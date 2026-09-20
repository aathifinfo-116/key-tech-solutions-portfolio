import { createHash, randomBytes } from 'node:crypto';
import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
} from '@kts/validation';
import { passwordResetEmail } from '@kts/email-templates';
import { AppConfig } from '../../config/app-config';
import { AuditService } from '../../common/audit/audit.service';
import { SessionService } from '../../common/auth/session.service';
import { MailService } from '../../common/mail/mail.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { RequestMeta } from '../../common/http/request-context';

/**
 * Admin authentication.
 *
 * Passwords are bcrypt hashed and never logged. Reset tokens are random,
 * single use, stored only as a SHA-256 hash and never returned in an API
 * response. Login responses are deliberately uniform so they cannot be used to
 * enumerate accounts.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    private readonly config: AppConfig,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.config.auth.hashRounds);
  }

  async login(input: LoginInput, meta: RequestMeta) {
    const user = await this.prisma.adminUser.findUnique({ where: { email: input.email } });
    const now = new Date();

    // Always run a hash comparison, even for an unknown email, so response
    // timing does not reveal whether the account exists.
    const storedHash =
      user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
    const passwordMatches = await bcrypt.compare(input.password, storedHash);

    const genericFailure = new UnauthorizedException('Email or password is incorrect.');

    if (!user || user.archivedAt) {
      await this.audit.record({
        action: 'LOGIN_FAILED',
        entityType: 'ADMIN_USER',
        entityLabel: input.email,
        summary: 'No matching active account',
        meta,
      });
      throw genericFailure;
    }

    if (user.lockedUntil && user.lockedUntil > now) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60_000);
      throw new UnauthorizedException(
        `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      );
    }

    if (!passwordMatches) {
      const attempts = user.failedLoginCount + 1;
      const shouldLock = attempts >= this.config.auth.maxAttempts;
      await this.prisma.adminUser.update({
        where: { id: user.id },
        data: {
          failedLoginCount: shouldLock ? 0 : attempts,
          lockedUntil: shouldLock
            ? new Date(now.getTime() + this.config.auth.lockMinutes * 60_000)
            : null,
        },
      });
      await this.audit.record({
        action: 'LOGIN_FAILED',
        entityType: 'ADMIN_USER',
        entityId: user.id,
        entityLabel: user.email,
        summary: shouldLock ? 'Account temporarily locked' : `Failed attempt ${attempts}`,
        meta,
      });
      throw genericFailure;
    }

    if (user.status === 'SUSPENDED' || user.status === 'DISABLED') {
      await this.audit.record({
        action: 'LOGIN_FAILED',
        entityType: 'ADMIN_USER',
        entityId: user.id,
        entityLabel: user.email,
        summary: `Account is ${user.status}`,
        meta,
      });
      throw new UnauthorizedException('This account is not active. Contact an administrator.');
    }

    if (user.status === 'INVITED') {
      throw new UnauthorizedException(
        'Finish setting up your account using the link in your invitation email.',
      );
    }

    const session = await this.sessions.create({
      userId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      rememberDevice: input.rememberDevice,
    });

    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: now,
        lastLoginIp: meta.ipAddress,
      },
    });

    await this.audit.record({
      action: 'LOGIN',
      entityType: 'ADMIN_USER',
      entityId: user.id,
      entityLabel: user.email,
      actor: { id: user.id, email: user.email },
      meta,
    });

    const resolved = await this.sessions.resolve(session.token);
    if (!resolved) throw new UnauthorizedException('Session could not be established.');

    return { session, user: resolved.user };
  }

  async logout(
    sessionId: string,
    actor: { id: string; email: string },
    meta: RequestMeta,
  ): Promise<void> {
    await this.sessions.revoke(sessionId, 'user-logout');
    await this.audit.record({
      action: 'LOGOUT',
      entityType: 'ADMIN_USER',
      entityId: actor.id,
      entityLabel: actor.email,
      actor,
      meta,
    });
  }

  /**
   * Always reports success. Revealing whether an email is registered would
   * turn this endpoint into an account-enumeration oracle.
   */
  async requestPasswordReset(
    input: ForgotPasswordInput,
    meta: RequestMeta,
  ): Promise<{ message: string }> {
    const generic = {
      message: 'If that email belongs to an admin account, a reset link is on its way.',
    };

    const user = await this.prisma.adminUser.findUnique({ where: { email: input.email } });
    if (!user || user.archivedAt || user.status === 'DISABLED') return generic;

    // Invalidate any outstanding tokens so only the newest link works.
    await this.prisma.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + this.config.auth.resetTokenMinutes * 60_000);

    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        expiresAt,
        requestIp: meta.ipAddress,
      },
    });

    const resetUrl = `${this.config.adminSiteUrl}/reset-password?token=${token}`;
    const email = passwordResetEmail(
      { companyName: 'Key Tech Solutions', siteUrl: this.config.publicSiteUrl },
      { name: user.name, resetUrl, expiresInMinutes: this.config.auth.resetTokenMinutes },
    );
    await this.mail.send(email, { to: user.email });

    await this.audit.record({
      action: 'PASSWORD_RESET_REQUEST',
      entityType: 'ADMIN_USER',
      entityId: user.id,
      entityLabel: user.email,
      meta,
    });

    return generic;
  }

  async resetPassword(input: ResetPasswordInput, meta: RequestMeta): Promise<{ message: string }> {
    const record = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: this.hashToken(input.token) },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      throw new BadRequestException(
        'That reset link is invalid or has expired. Request a new one.',
      );
    }

    const passwordHash = await this.hashPassword(input.password);

    await this.prisma.$transaction([
      this.prisma.adminUser.update({
        where: { id: record.userId },
        data: {
          passwordHash,
          mustChangePassword: false,
          failedLoginCount: 0,
          lockedUntil: null,
          status: record.user.status === 'INVITED' ? 'ACTIVE' : record.user.status,
        },
      }),
      this.prisma.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    // A password change invalidates every existing session for that account.
    const revoked = await this.sessions.revokeAllForUser(record.userId, 'password-reset');

    await this.audit.record({
      action: 'PASSWORD_RESET_COMPLETE',
      entityType: 'ADMIN_USER',
      entityId: record.userId,
      entityLabel: record.user.email,
      summary: `Revoked ${revoked} active session(s)`,
      meta,
    });

    return { message: 'Your password has been changed. Sign in with your new password.' };
  }

  async changePassword(
    userId: string,
    sessionId: string,
    input: ChangePasswordInput,
    meta: RequestMeta,
  ): Promise<{ message: string }> {
    const user = await this.prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Sign in to continue.');

    if (!(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
      await this.audit.record({
        action: 'LOGIN_FAILED',
        entityType: 'ADMIN_USER',
        entityId: user.id,
        entityLabel: user.email,
        summary: 'Incorrect current password on change attempt',
        meta,
      });
      throw new BadRequestException('Your current password is incorrect.');
    }

    await this.prisma.adminUser.update({
      where: { id: userId },
      data: { passwordHash: await this.hashPassword(input.password), mustChangePassword: false },
    });

    // Keep the current session alive; sign out everywhere else.
    const revoked = await this.sessions.revokeAllForUser(userId, 'password-change', sessionId);

    await this.audit.record({
      action: 'PASSWORD_CHANGE',
      entityType: 'ADMIN_USER',
      entityId: userId,
      entityLabel: user.email,
      summary: `Revoked ${revoked} other session(s)`,
      actor: { id: user.id, email: user.email },
      meta,
    });

    return { message: 'Password changed. Other devices have been signed out.' };
  }
}
