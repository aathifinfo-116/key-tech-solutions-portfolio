import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { SessionUserDto } from '@kts/shared-types';
import { ANY_PERMISSION_KEY, PERMISSIONS_KEY, IS_PUBLIC_KEY } from './auth.decorators';
import { PermissionsGuard, SessionGuard } from './guards';
import type { SessionService } from './session.service';
import type { AppConfig } from '../../config/app-config';

function makeUser(permissions: string[]): SessionUserDto {
  return {
    id: 'u1',
    email: 'editor@example.invalid',
    name: 'Editor',
    jobTitle: null,
    status: 'ACTIVE',
    roles: [{ id: 'r1', key: 'content-administrator', name: 'Content Administrator' }],
    lastLoginAt: null,
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
    permissions,
  };
}

function makeContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  } as unknown as ExecutionContext;
}

function makeReflector(metadata: Record<string, unknown>): Reflector {
  return {
    getAllAndOverride: (key: string) => metadata[key],
  } as unknown as Reflector;
}

describe('PermissionsGuard', () => {
  it('allows a route with no permission metadata', () => {
    const guard = new PermissionsGuard(makeReflector({}));
    expect(guard.canActivate(makeContext({ currentUser: makeUser([]) }))).toBe(true);
  });

  it('allows when every required permission is held', () => {
    const guard = new PermissionsGuard(makeReflector({ [PERMISSIONS_KEY]: ['services:update'] }));
    expect(guard.canActivate(makeContext({ currentUser: makeUser(['services:update']) }))).toBe(
      true,
    );
  });

  it('refuses when a required permission is missing, and names it', () => {
    const guard = new PermissionsGuard(makeReflector({ [PERMISSIONS_KEY]: ['services:publish'] }));
    expect(() =>
      guard.canActivate(makeContext({ currentUser: makeUser(['services:read']) })),
    ).toThrow(/services:publish/);
    expect(() =>
      guard.canActivate(makeContext({ currentUser: makeUser(['services:read']) })),
    ).toThrow(ForbiddenException);
  });

  it('requires all of a multi-permission list', () => {
    const guard = new PermissionsGuard(makeReflector({ [PERMISSIONS_KEY]: ['a:read', 'b:read'] }));
    expect(() => guard.canActivate(makeContext({ currentUser: makeUser(['a:read']) }))).toThrow(
      ForbiddenException,
    );
  });

  it('accepts any one of an "any" list', () => {
    const guard = new PermissionsGuard(
      makeReflector({ [ANY_PERMISSION_KEY]: ['a:read', 'b:read'] }),
    );
    expect(guard.canActivate(makeContext({ currentUser: makeUser(['b:read']) }))).toBe(true);
    expect(() => guard.canActivate(makeContext({ currentUser: makeUser(['c:read']) }))).toThrow(
      ForbiddenException,
    );
  });

  it('refuses an unauthenticated request outright', () => {
    const guard = new PermissionsGuard(makeReflector({ [PERMISSIONS_KEY]: ['services:read'] }));
    expect(() => guard.canActivate(makeContext({}))).toThrow(UnauthorizedException);
  });
});

describe('SessionGuard', () => {
  const config = { session: { cookieName: 'kts_admin_session' } } as unknown as AppConfig;

  it('rejects a protected route with no cookie', async () => {
    const sessions = { resolve: jest.fn() } as unknown as SessionService;
    const guard = new SessionGuard(makeReflector({}), sessions, config);
    await expect(guard.canActivate(makeContext({ cookies: {} }))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a protected route when the token does not resolve', async () => {
    const sessions = { resolve: jest.fn().mockResolvedValue(null) } as unknown as SessionService;
    const guard = new SessionGuard(makeReflector({}), sessions, config);
    await expect(
      guard.canActivate(makeContext({ cookies: { kts_admin_session: 'stale' } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('attaches the user on a valid session', async () => {
    const user = makeUser(['dashboard:read']);
    const sessions = {
      resolve: jest.fn().mockResolvedValue({ sessionId: 's1', user }),
    } as unknown as SessionService;
    const request: Record<string, unknown> = { cookies: { kts_admin_session: 'good' } };

    const guard = new SessionGuard(makeReflector({}), sessions, config);
    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(request.currentUser).toBe(user);
    expect(request.sessionId).toBe('s1');
  });

  it('lets a public route through without a session', async () => {
    const sessions = { resolve: jest.fn() } as unknown as SessionService;
    const guard = new SessionGuard(makeReflector({ [IS_PUBLIC_KEY]: true }), sessions, config);
    await expect(guard.canActivate(makeContext({ cookies: {} }))).resolves.toBe(true);
  });

  it('still attributes a public request to a signed-in editor when a cookie is present', async () => {
    const user = makeUser([]);
    const sessions = {
      resolve: jest.fn().mockResolvedValue({ sessionId: 's1', user }),
    } as unknown as SessionService;
    const request: Record<string, unknown> = { cookies: { kts_admin_session: 'good' } };

    const guard = new SessionGuard(makeReflector({ [IS_PUBLIC_KEY]: true }), sessions, config);
    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(request.currentUser).toBe(user);
  });
});
