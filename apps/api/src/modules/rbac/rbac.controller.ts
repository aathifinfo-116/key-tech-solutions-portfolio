import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  adminUserCreateSchema,
  adminUserUpdateSchema,
  listQuerySchema,
  roleUpsertSchema,
} from '@kts/validation';
import type { SessionUserDto } from '@kts/shared-types';
import { RequirePermissions } from '../../common/auth/auth.decorators';
import { CurrentUser, Meta, type RequestMeta } from '../../common/http/request-context';
import { RbacService } from './rbac.service';

@Controller('api/v1/admin')
export class RbacController {
  constructor(private readonly rbac: RbacService) {}

  private ctx(user: SessionUserDto, meta: RequestMeta) {
    return { user, meta };
  }

  // ---- users --------------------------------------------------------------

  @Get('users')
  @RequirePermissions('users:read')
  listUsers(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.rbac.listUsers(
      listQuerySchema.passthrough().parse(query ?? {}),
      this.ctx(user, meta),
    );
  }

  @Get('users/:id')
  @RequirePermissions('users:read')
  getUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.rbac.getUser(id, this.ctx(user, meta));
  }

  @Post('users')
  @RequirePermissions('users:create')
  createUser(
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.rbac.createUser(adminUserCreateSchema.parse(body ?? {}), this.ctx(user, meta));
  }

  @Patch('users/:id')
  @RequirePermissions('users:update')
  updateUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.rbac.updateUser(id, adminUserUpdateSchema.parse(body ?? {}), this.ctx(user, meta));
  }

  @Delete('users/:id')
  @HttpCode(204)
  @RequirePermissions('users:delete')
  async archiveUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ): Promise<void> {
    await this.rbac.archiveUser(id, this.ctx(user, meta));
  }

  // ---- roles and permissions ---------------------------------------------

  @Get('roles')
  @RequirePermissions('roles:read')
  listRoles(@CurrentUser() user: SessionUserDto, @Meta() meta: RequestMeta) {
    return this.rbac.listRoles(this.ctx(user, meta));
  }

  @Get('permissions')
  @RequirePermissions('roles:read')
  listPermissions(@CurrentUser() user: SessionUserDto, @Meta() meta: RequestMeta) {
    return this.rbac.listPermissions(this.ctx(user, meta));
  }

  @Post('roles')
  @RequirePermissions('roles:create')
  createRole(
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.rbac.createRole(roleUpsertSchema.parse(body ?? {}), this.ctx(user, meta));
  }

  @Patch('roles/:id')
  @RequirePermissions('roles:update')
  updateRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.rbac.updateRole(id, roleUpsertSchema.parse(body ?? {}), this.ctx(user, meta));
  }

  @Delete('roles/:id')
  @HttpCode(204)
  @RequirePermissions('roles:delete')
  async deleteRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ): Promise<void> {
    await this.rbac.deleteRole(id, this.ctx(user, meta));
  }

  // ---- audit --------------------------------------------------------------

  @Get('audit-logs')
  @RequirePermissions('audit:read')
  listAuditLogs(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.rbac.listAuditLogs(
      listQuerySchema.passthrough().parse(query ?? {}),
      this.ctx(user, meta),
    );
  }
}
