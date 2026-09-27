import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import type { SessionUserDto } from '@kts/shared-types';
import { AppConfig } from '../../config/app-config';
import { PrismaService } from '../prisma/prisma.service';

export interface ResolvedSession {
  sessionId: string;
  user: SessionUserDto;
}

/**
 * Opaque server-side sessions.
 *
 * The cookie carries a random 32-byte token; only its SHA-256 hash is stored,
 * so a database dump cannot be replayed as a login. The cookie is HttpOnly,
 * SameSite=Lax and Secure in production. Sessions have both a sliding idle
 * expiry and a hard absolute cap.
 */
@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Constant-time comparison for tokens supplied in headers. */
  static safeEquals(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
  }

  async create(params: {
    userId: string;
    ipAddress: string | null;
    userAgent: string | null;
    rememberDevice?: boolean;
  }): Promise<{ token: string; sessionId: string; expiresAt: Date }> {
    const token = randomBytes(32).toString('base64url');
    const now = new Date();
    const { idleMinutes, absoluteHours } = this.config.session;
    // "Remember this device" extends the absolute cap, never the idle window.
    const absoluteMultiplier = params.rememberDevice ? 7 : 1;

    const idleExpiresAt = new Date(now.getTime() + idleMinutes * 60_000);
    const absoluteExpiresAt = new Date(
      now.getTime() + absoluteHours * absoluteMultiplier * 3_600_000,
    );

    const session = await this.prisma.adminSession.create({
      data: {
        userId: params.userId,
        tokenHash: this.hash(token),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent?.slice(0, 400) ?? null,
        idleExpiresAt,
        absoluteExpiresAt,
      },
      select: { id: true },
    });

    return { token, sessionId: session.id, expiresAt: absoluteExpiresAt };
  }

  /**
   * Resolves a cookie token to a live session, sliding the idle window.
   * Returns null for unknown, revoked, expired or suspended accounts.
   */
  async resolve(token: string): Promise<ResolvedSession | null> {
    if (!token) return null;

    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: this.hash(token) },
      include: {
        user: {
          include: {
            roles: {
              include: { role: { include: { permissions: { include: { permission: true } } } } },
            },
          },
        },
      },
    });

    if (!session || session.revokedAt) return null;

    const now = new Date();
    if (session.idleExpiresAt <= now || session.absoluteExpiresAt <= now) {
      await this.revoke(session.id, 'expired');
      return null;
    }

    if (session.user.status !== 'ACTIVE' || session.user.archivedAt) {
      await this.revoke(session.id, 'account-not-active');
      return null;
    }

    // Slide the idle window, but never past the absolute cap. Writing on every
    // request would be wasteful, so only refresh once a minute has passed.
    const nextIdle = new Date(
      Math.min(
        now.getTime() + this.config.session.idleMinutes * 60_000,
        session.absoluteExpiresAt.getTime(),
      ),
    );
    if (nextIdle.getTime() - session.idleExpiresAt.getTime() > 60_000) {
      await this.prisma.adminSession.update({
        where: { id: session.id },
        data: { idleExpiresAt: nextIdle, lastSeenAt: now },
      });
    }

    const permissions = new Set<string>();
    for (const userRole of session.user.roles) {
      for (const rolePermission of userRole.role.permissions) {
        permissions.add(rolePermission.permission.key);
      }
    }

    return {
      sessionId: session.id,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        jobTitle: session.user.jobTitle,
        status: session.user.status,
        roles: session.user.roles.map((r) => ({
          id: r.role.id,
          key: r.role.key,
          name: r.role.name,
        })),
        lastLoginAt: session.user.lastLoginAt?.toISOString() ?? null,
        mustChangePassword: session.user.mustChangePassword,
        createdAt: session.user.createdAt.toISOString(),
        permissions: Array.from(permissions).sort(),
      },
    };
  }

  async revoke(sessionId: string, reason: string): Promise<void> {
    await this.prisma.adminSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  /** Revokes every session for a user - used on password change or suspension. */
  async revokeAllForUser(
    userId: string,
    reason: string,
    exceptSessionId?: string,
  ): Promise<number> {
    const result = await this.prisma.adminSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
    return result.count;
  }

  async listForUser(userId: string, currentSessionId: string) {
    const sessions = await this.prisma.adminSession.findMany({
      where: { userId, revokedAt: null, absoluteExpiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: 'desc' },
      select: { id: true, userAgent: true, ipAddress: true, createdAt: true, lastSeenAt: true },
    });
    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt.toISOString(),
      lastSeenAt: s.lastSeenAt.toISOString(),
      current: s.id === currentSessionId,
    }));
  }

  /** Housekeeping: drop sessions that expired more than a day ago. */
  async purgeExpired(): Promise<number> {
    const cutoff = new Date(Date.now() - 24 * 3_600_000);
    const result = await this.prisma.adminSession.deleteMany({
      where: { absoluteExpiresAt: { lt: cutoff } },
    });
    return result.count;
  }

  setCookie(reply: FastifyReply, token: string, expiresAt: Date): void {
    const { cookieName, secure, domain, sameSite } = this.config.session;
    void reply.setCookie(cookieName, token, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      domain,
      expires: expiresAt,
      signed: false,
    });
  }

  clearCookie(reply: FastifyReply): void {
    const { cookieName, secure, domain, sameSite } = this.config.session;
    void reply.clearCookie(cookieName, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      domain,
    });
  }
}
