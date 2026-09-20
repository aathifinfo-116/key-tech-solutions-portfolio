import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppConfig } from '../../config/app-config';
import type { AuthenticatedRequest } from '../http/request-context';
import { ANY_PERMISSION_KEY, IS_PUBLIC_KEY, PERMISSIONS_KEY } from './auth.decorators';
import { SessionService } from './session.service';

/**
 * Attaches the authenticated admin user to the request.
 *
 * Registered globally, so a route is protected unless it opts out with
 * `@Public()`. Forgetting the decorator fails closed.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
    private readonly config: AppConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[this.config.session.cookieName];

    // Public routes still resolve a session when one is present, so audit
    // records can attribute an action to a signed-in editor.
    if (token) {
      const resolved = await this.sessions.resolve(token);
      if (resolved) {
        request.currentUser = resolved.user;
        request.sessionId = resolved.sessionId;
      }
    }

    if (isPublic) return true;

    if (!request.currentUser) {
      throw new UnauthorizedException('Sign in to continue.');
    }
    return true;
  }
}

/** Enforces `@RequirePermissions` / `@RequireAnyPermission`. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const any = this.reflector.getAllAndOverride<string[]>(ANY_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if ((!required || required.length === 0) && (!any || any.length === 0)) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.currentUser;
    if (!user) throw new UnauthorizedException('Sign in to continue.');

    const held = new Set(user.permissions);

    if (required?.length) {
      const missing = required.filter((permission) => !held.has(permission));
      if (missing.length > 0) {
        throw new ForbiddenException(
          `Your role does not include the required permission: ${missing.join(', ')}.`,
        );
      }
    }

    if (any?.length && !any.some((permission) => held.has(permission))) {
      throw new ForbiddenException(
        `Your role needs at least one of these permissions: ${any.join(', ')}.`,
      );
    }

    return true;
  }
}
