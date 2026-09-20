import { SetMetadata } from '@nestjs/common';

/** Marks a route as reachable without an admin session. */
export const IS_PUBLIC_KEY = 'kts:isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Requires every listed permission.
 *
 * Enforced server side by PermissionsGuard. Hiding a menu item in the admin UI
 * is a convenience, not a control; this decorator is the control.
 */
export const PERMISSIONS_KEY = 'kts:permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/** Requires at least one of the listed permissions. */
export const ANY_PERMISSION_KEY = 'kts:anyPermission';
export const RequireAnyPermission = (...permissions: string[]) =>
  SetMetadata(ANY_PERMISSION_KEY, permissions);

/** Applies the stricter public-form rate limit to a route. */
export const PUBLIC_FORM_KEY = 'kts:publicForm';
export const PublicForm = () => SetMetadata(PUBLIC_FORM_KEY, true);
