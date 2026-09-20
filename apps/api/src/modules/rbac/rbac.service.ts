import { randomBytes, createHash } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { adminInviteEmail } from '@kts/email-templates';
import { PERMISSION_KEYS, SUPER_ADMIN_ROLE_KEY } from '@kts/shared-types';
import type {
  AdminUserDto,
  AuditLogDto,
  Paginated,
  PermissionDto,
  RoleDto,
} from '@kts/shared-types';
import type { AdminUserCreateInput, AdminUserUpdateInput, RoleUpsertInput } from '@kts/validation';
import { AppConfig } from '../../config/app-config';
import { AuditService } from '../../common/audit/audit.service';
import { SessionService } from '../../common/auth/session.service';
import { MailService } from '../../common/mail/mail.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  buildSearchWhere,
  normalisePaging,
  paginate,
  toSkipTake,
} from '../../common/utils/pagination';
import type { CrudContext, CrudListQuery } from '../../common/crud/crud.types';

/**
 * Users, roles, permissions and the audit trail.
 *
 * Guard rails enforced here rather than in the UI:
 *  - nobody can remove their own last administrative access,
 *  - the seeded system roles keep their identity,
 *  - suspending or disabling an account kills its live sessions immediately.
 */
@Injectable()
export class RbacService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly sessions: SessionService,
    private readonly mail: MailService,
    private readonly config: AppConfig,
  ) {}

  private assert(ctx: CrudContext, permission: string): void {
    if (!ctx.user.permissions.includes(permission)) {
      throw new ForbiddenException(
        `Your role does not include the required permission: ${permission}.`,
      );
    }
  }

  // ---- users --------------------------------------------------------------

  async listUsers(query: CrudListQuery, ctx: CrudContext): Promise<Paginated<AdminUserDto>> {
    this.assert(ctx, 'users:read');
    const paging = normalisePaging(query);
    const { skip, take } = toSkipTake(paging);

    const where: Record<string, unknown> = {};
    const search = buildSearchWhere(query.search, ['name', 'email', 'jobTitle']);
    if (search) Object.assign(where, search);
    if (!query.includeArchived) where.archivedAt = null;

    const [rows, total] = await Promise.all([
      this.prisma.adminUser.findMany({
        where,
        orderBy: [{ name: 'asc' }],
        skip,
        take,
        include: { roles: { include: { role: true } } },
      }),
      this.prisma.adminUser.count({ where }),
    ]);

    return paginate(rows.map(mapUser), paging, total);
  }

  async getUser(id: string, ctx: CrudContext): Promise<AdminUserDto> {
    this.assert(ctx, 'users:read');
    const user = await this.prisma.adminUser.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('That admin user does not exist.');
    return mapUser(user);
  }

  async createUser(input: AdminUserCreateInput, ctx: CrudContext): Promise<AdminUserDto> {
    this.assert(ctx, 'users:create');

    const roles = await this.prisma.role.findMany({ where: { id: { in: input.roleIds } } });
    if (roles.length !== input.roleIds.length) {
      throw new BadRequestException('One or more of the selected roles no longer exists.');
    }

    // Only a super administrator may mint another super administrator.
    if (roles.some((role) => role.key === SUPER_ADMIN_ROLE_KEY) && !this.isSuperAdmin(ctx)) {
      throw new ForbiddenException(
        'Only a Super Administrator can grant the Super Administrator role.',
      );
    }

    // An account created without a password is INVITED and unusable until the
    // invitee sets one through the emailed single-use link.
    const placeholder = randomBytes(32).toString('base64url');
    const passwordHash = await bcrypt.hash(
      input.password ?? placeholder,
      this.config.auth.hashRounds,
    );

    const user = await this.prisma.adminUser.create({
      data: {
        email: input.email,
        name: input.name,
        jobTitle: input.jobTitle,
        passwordHash,
        status: input.password ? 'ACTIVE' : 'INVITED',
        mustChangePassword: input.password ? input.mustChangePassword : false,
        roles: { create: input.roleIds.map((roleId) => ({ roleId })) },
      },
      include: { roles: { include: { role: true } } },
    });

    if (!input.password) {
      const token = randomBytes(32).toString('base64url');
      await this.prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: createHash('sha256').update(token).digest('hex'),
          expiresAt: new Date(Date.now() + this.config.auth.inviteTokenHours * 3_600_000),
        },
      });
      await this.mail.send(
        adminInviteEmail(
          { companyName: 'Key Tech Solutions', siteUrl: this.config.publicSiteUrl },
          {
            name: user.name,
            inviteUrl: `${this.config.adminSiteUrl}/reset-password?token=${token}`,
            roleNames: roles.map((role) => role.name),
            expiresInHours: this.config.auth.inviteTokenHours,
          },
        ),
        { to: user.email },
      );
    }

    await this.audit.record({
      action: 'CREATE',
      entityType: 'ADMIN_USER',
      entityId: user.id,
      entityLabel: user.email,
      summary: `Roles: ${roles.map((role) => role.name).join(', ')}`,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });

    return mapUser(user);
  }

  async updateUser(
    id: string,
    input: AdminUserUpdateInput,
    ctx: CrudContext,
  ): Promise<AdminUserDto> {
    this.assert(ctx, 'users:update');

    const existing = await this.prisma.adminUser.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    if (!existing) throw new NotFoundException('That admin user does not exist.');

    if (input.roleIds) {
      const roles = await this.prisma.role.findMany({ where: { id: { in: input.roleIds } } });
      if (roles.some((role) => role.key === SUPER_ADMIN_ROLE_KEY) && !this.isSuperAdmin(ctx)) {
        throw new ForbiddenException(
          'Only a Super Administrator can grant the Super Administrator role.',
        );
      }
      if (
        id === ctx.user.id &&
        !roles.some((role) => role.key === SUPER_ADMIN_ROLE_KEY) &&
        this.isSuperAdmin(ctx)
      ) {
        await this.assertNotLastSuperAdmin(id);
      }
    }

    if (input.status && input.status !== 'ACTIVE' && id === ctx.user.id) {
      throw new BadRequestException('You cannot suspend or disable your own account.');
    }
    if (input.status && input.status !== 'ACTIVE') {
      await this.assertNotLastSuperAdmin(id);
    }

    const user = await this.prisma.adminUser.update({
      where: { id },
      data: {
        name: input.name,
        jobTitle: input.jobTitle,
        status: input.status,
        ...(input.roleIds
          ? { roles: { deleteMany: {}, create: input.roleIds.map((roleId) => ({ roleId })) } }
          : {}),
      },
      include: { roles: { include: { role: true } } },
    });

    // Losing access must take effect at once, not at the next session expiry.
    if (input.status && input.status !== 'ACTIVE') {
      await this.sessions.revokeAllForUser(id, `status-${input.status.toLowerCase()}`);
    } else if (input.roleIds) {
      await this.sessions.revokeAllForUser(id, 'roles-changed');
    }

    await this.audit.record({
      action: input.roleIds ? 'PERMISSION_CHANGE' : 'UPDATE',
      entityType: 'ADMIN_USER',
      entityId: id,
      entityLabel: user.email,
      summary: input.roleIds
        ? `Roles set to: ${user.roles.map((r) => r.role.name).join(', ')}`
        : input.status
          ? `Status: ${existing.status} -> ${input.status}`
          : undefined,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });

    return mapUser(user);
  }

  async archiveUser(id: string, ctx: CrudContext): Promise<void> {
    this.assert(ctx, 'users:delete');
    if (id === ctx.user.id) throw new BadRequestException('You cannot archive your own account.');
    await this.assertNotLastSuperAdmin(id);

    const user = await this.prisma.adminUser.update({
      where: { id },
      data: { archivedAt: new Date(), status: 'DISABLED' },
    });
    await this.sessions.revokeAllForUser(id, 'account-archived');

    await this.audit.record({
      action: 'ARCHIVE',
      entityType: 'ADMIN_USER',
      entityId: id,
      entityLabel: user.email,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
  }

  private isSuperAdmin(ctx: CrudContext): boolean {
    return ctx.user.roles.some((role) => role.key === SUPER_ADMIN_ROLE_KEY);
  }

  /** Refuses any change that would leave the platform with no super admin. */
  private async assertNotLastSuperAdmin(userId: string): Promise<void> {
    const remaining = await this.prisma.adminUser.count({
      where: {
        id: { not: userId },
        status: 'ACTIVE',
        archivedAt: null,
        roles: { some: { role: { key: SUPER_ADMIN_ROLE_KEY } } },
      },
    });
    const target = await this.prisma.adminUser.findFirst({
      where: { id: userId, roles: { some: { role: { key: SUPER_ADMIN_ROLE_KEY } } } },
      select: { id: true },
    });
    if (target && remaining === 0) {
      throw new BadRequestException(
        'This is the only active Super Administrator. Grant the role to another account first.',
      );
    }
  }

  // ---- roles and permissions ---------------------------------------------

  async listRoles(ctx: CrudContext): Promise<RoleDto[]> {
    this.assert(ctx, 'roles:read');
    const roles = await this.prisma.role.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });
    return roles.map((role) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map((p) => p.permission.key).sort(),
      userCount: role._count.users,
    }));
  }

  async listPermissions(ctx: CrudContext): Promise<PermissionDto[]> {
    this.assert(ctx, 'roles:read');
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ family: 'asc' }, { action: 'asc' }],
    });
    return permissions.map((permission) => ({
      id: permission.id,
      key: permission.key,
      family: permission.family,
      action: permission.action,
      description: permission.description,
    }));
  }

  async createRole(input: RoleUpsertInput, ctx: CrudContext): Promise<RoleDto> {
    this.assert(ctx, 'roles:create');
    this.assertKnownPermissions(input.permissionKeys);

    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: input.permissionKeys } },
    });
    const role = await this.prisma.role.create({
      data: {
        key: input.key,
        name: input.name,
        description: input.description,
        isSystem: false,
        permissions: { create: permissions.map((permission) => ({ permissionId: permission.id })) },
      },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });

    await this.audit.record({
      action: 'CREATE',
      entityType: 'ROLE',
      entityId: role.id,
      entityLabel: role.name,
      summary: `${permissions.length} permission(s)`,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });

    return {
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map((p) => p.permission.key).sort(),
      userCount: role._count.users,
    };
  }

  async updateRole(id: string, input: RoleUpsertInput, ctx: CrudContext): Promise<RoleDto> {
    this.assert(ctx, 'roles:update');
    this.assertKnownPermissions(input.permissionKeys);

    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('That role does not exist.');

    if (existing.key === SUPER_ADMIN_ROLE_KEY) {
      throw new BadRequestException(
        'The Super Administrator role always holds every permission and cannot be edited.',
      );
    }

    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: input.permissionKeys } },
    });

    const role = await this.prisma.role.update({
      where: { id },
      data: {
        // A system role keeps its key so seeds and code references stay valid.
        key: existing.isSystem ? existing.key : input.key,
        name: input.name,
        description: input.description,
        permissions: {
          deleteMany: {},
          create: permissions.map((permission) => ({ permissionId: permission.id })),
        },
      },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });

    await this.audit.record({
      action: 'PERMISSION_CHANGE',
      entityType: 'ROLE',
      entityId: id,
      entityLabel: role.name,
      summary: `Permissions set to ${permissions.length} entries`,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });

    return {
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map((p) => p.permission.key).sort(),
      userCount: role._count.users,
    };
  }

  async deleteRole(id: string, ctx: CrudContext): Promise<void> {
    this.assert(ctx, 'roles:delete');
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException('That role does not exist.');
    if (role.isSystem) throw new BadRequestException('System roles cannot be deleted.');
    if (role._count.users > 0) {
      throw new BadRequestException(
        `${role._count.users} user(s) still hold this role. Reassign them first.`,
      );
    }

    await this.prisma.role.delete({ where: { id } });
    await this.audit.record({
      action: 'DELETE',
      entityType: 'ROLE',
      entityId: id,
      entityLabel: role.name,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
  }

  private assertKnownPermissions(keys: string[]): void {
    const unknown = keys.filter((key) => !PERMISSION_KEYS.includes(key));
    if (unknown.length > 0) {
      throw new BadRequestException(`Unknown permission(s): ${unknown.join(', ')}`);
    }
  }

  // ---- audit --------------------------------------------------------------

  async listAuditLogs(query: CrudListQuery, ctx: CrudContext): Promise<Paginated<AuditLogDto>> {
    this.assert(ctx, 'audit:read');
    const paging = normalisePaging(query);
    const { skip, take } = toSkipTake(paging);

    const where: Record<string, unknown> = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.action) where.action = query.action;
    if (query.actorId) where.actorId = query.actorId;
    if (query.entityId) where.entityId = query.entityId;
    const search = buildSearchWhere(query.search, ['entityLabel', 'summary', 'actorEmail']);
    if (search) Object.assign(where, search);

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginate(
      rows.map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        entityLabel: row.entityLabel,
        summary: row.summary,
        actor: row.actorId || row.actorEmail ? { id: row.actorId, email: row.actorEmail } : null,
        ipAddress: row.ipAddress,
        requestId: row.requestId,
        createdAt: row.createdAt.toISOString(),
      })),
      paging,
      total,
    );
  }
}

type UserWithRoles = {
  id: string;
  email: string;
  name: string;
  jobTitle: string | null;
  status: AdminUserDto['status'];
  lastLoginAt: Date | null;
  mustChangePassword: boolean;
  createdAt: Date;
  roles: Array<{ role: { id: string; key: string; name: string } }>;
};

function mapUser(user: UserWithRoles): AdminUserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    jobTitle: user.jobTitle,
    status: user.status,
    roles: user.roles.map((r) => ({ id: r.role.id, key: r.role.key, name: r.role.name })),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt.toISOString(),
  };
}
