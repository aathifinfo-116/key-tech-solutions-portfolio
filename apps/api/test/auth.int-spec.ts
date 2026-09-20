/**
 * Authentication and authorisation, end to end through the real application.
 *
 * These assert the properties the design depends on rather than the happy
 * path alone: that a session token never reaches a response body, that the
 * cookie cannot be read by script, that a wrong password and an unknown
 * account are indistinguishable, and that a permission the role does not
 * hold is refused by the API even when the user interface would not offer it.
 */

import {
  createHarness,
  createTestUser,
  HAS_DATABASE,
  deleteTestUser,
  describeWithDatabase,
  safeJson,
  signIn,
  SESSION_COOKIE,
  type Harness,
} from './harness';

let harness: Harness;

beforeAll(async () => {
  // Without a database every suite below is skipped, so there is nothing to
  // build and nothing to connect to.
  if (!HAS_DATABASE) return;
  harness = await createHarness();
}, 60_000);

afterAll(async () => {
  await harness?.close();
});

describeWithDatabase('sign-in', () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    user = await createTestUser(harness.prisma, {
      label: 'reader',
      permissions: ['services:read'],
    });
  });

  afterAll(async () => {
    if (user) await deleteTestUser(harness.prisma, user);
  });

  it('refuses a wrong password and an unknown account with the same answer', async () => {
    const wrongPassword = await signIn(harness.app, user.email, 'not-the-right-password');
    const unknownAccount = await signIn(
      harness.app,
      'nobody@keytech.invalid',
      'not-the-right-password',
    );

    expect(wrongPassword.status).toBe(401);
    expect(unknownAccount.status).toBe(401);
    // Identical wording: the response must not reveal whether the account exists.
    expect(wrongPassword.body.message).toBe(unknownAccount.body.message);
    expect(wrongPassword.cookie).toBeNull();
    expect(unknownAccount.cookie).toBeNull();
  });

  it('accepts the right password and returns no token in the body', async () => {
    const result = await signIn(harness.app, user.email, user.password);

    expect(result.status).toBe(200);
    expect(result.cookie).not.toBeNull();
    const serialised = JSON.stringify(result.body);
    expect(serialised).not.toContain('passwordHash');
    expect(serialised).not.toContain(user.password);
    expect(serialised).not.toMatch(/token/i);
    expect(result.body.email).toBe(user.email);
  });

  it('sets a cookie that script cannot read and other sites cannot send', async () => {
    const response = await harness.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: user.email, password: user.password, rememberDevice: false },
    });
    const raw = ([] as string[])
      .concat(response.headers['set-cookie'] as string | string[])
      .find((value) => value?.startsWith(`${SESSION_COOKIE}=`)) as string;

    expect(raw).toBeDefined();
    expect(raw).toMatch(/HttpOnly/i);
    expect(raw).toMatch(/SameSite=Lax/i);
    expect(raw).toMatch(/Path=\//i);
  });

  it('stores only a hash of the session token', async () => {
    const result = await signIn(harness.app, user.email, user.password);
    const token = (result.cookie ?? '').split('=')[1];
    expect(token.length).toBeGreaterThan(20);
    const sessions = await harness.prisma.adminSession.findMany({ where: { userId: user.id } });
    expect(sessions.length).toBeGreaterThan(0);
    // The raw token exists only in the cookie; the row holds a digest of it.
    for (const session of sessions) {
      expect(session.tokenHash).not.toBe(token);
      expect(session.tokenHash).toHaveLength(64);
    }
  });
});

describeWithDatabase('session lifetime', () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    user = await createTestUser(harness.prisma, {
      label: 'session',
      permissions: ['services:read'],
    });
  });

  afterAll(async () => {
    if (user) await deleteTestUser(harness.prisma, user);
  });

  it('identifies the signed-in user and forgets them after signing out', async () => {
    const { cookie } = await signIn(harness.app, user.email, user.password);
    expect(cookie).not.toBeNull();
    const me = await harness.app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { cookie: cookie as string },
    });
    expect(me.statusCode).toBe(200);
    expect(safeJson(me.body).email).toBe(user.email);
    const out = await harness.app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: { cookie: cookie as string },
    });
    expect([200, 204]).toContain(out.statusCode);
    const after = await harness.app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { cookie: cookie as string },
    });
    expect(after.statusCode).toBe(401);
  });

  it('rejects a token that was never issued', async () => {
    const response = await harness.app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { cookie: `${SESSION_COOKIE}=this-token-was-never-issued-by-anyone` },
    });

    expect(response.statusCode).toBe(401);
  });
});

describeWithDatabase('permissions', () => {
  let reader: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    reader = await createTestUser(harness.prisma, {
      label: 'perms',
      permissions: ['services:read'],
    });
  });

  afterAll(async () => {
    if (reader) await deleteTestUser(harness.prisma, reader);
  });

  it('refuses an admin route with no session at all', async () => {
    const response = await harness.app.inject({ method: 'GET', url: '/api/v1/admin/services' });
    expect(response.statusCode).toBe(401);
  });

  it('allows what the role includes', async () => {
    const { cookie } = await signIn(harness.app, reader.email, reader.password);
    const response = await harness.app.inject({
      method: 'GET',
      url: '/api/v1/admin/services',
      headers: { cookie: cookie as string },
    });
    expect(response.statusCode).toBe(200);
  });

  it('refuses what the role does not include, and names the permission', async () => {
    const { cookie } = await signIn(harness.app, reader.email, reader.password);
    const response = await harness.app.inject({
      method: 'GET',
      url: '/api/v1/admin/users',
      headers: { cookie: cookie as string },
    });

    expect(response.statusCode).toBe(403);
    // Naming the missing permission is deliberate: it tells an administrator
    // what to grant, and reveals nothing an editor could not already infer.
    expect(String(safeJson(response.body).message)).toMatch(/users:/);
  });

  it('refuses a write when the role only reads', async () => {
    const { cookie } = await signIn(harness.app, reader.email, reader.password);
    const response = await harness.app.inject({
      method: 'POST',
      url: '/api/v1/admin/services',
      headers: { cookie: cookie as string, 'content-type': 'application/json' },
      payload: {
        name: 'Should never be created',
        slug: 'should-never-be-created',
        shortDescription: 'No.',
      },
    });

    expect([403, 422]).toContain(response.statusCode);
    const created = await harness.prisma.service.findUnique({
      where: { slug: 'should-never-be-created' },
    });
    expect(created).toBeNull();
  });
});

describeWithDatabase('error responses', () => {
  it('never carry a stack trace, a query or a connection string', async () => {
    const responses = await Promise.all([
      harness.app.inject({
        method: 'GET',
        url: '/api/v1/public/services/no-such-service-anywhere',
      }),
      harness.app.inject({ method: 'GET', url: '/api/v1/admin/services' }),
      harness.app.inject({
        method: 'POST',
        url: '/api/v1/public/contact',
        payload: { nonsense: true },
      }),
    ]);

    for (const response of responses) {
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
      const body = response.body;
      expect(body).not.toMatch(/at [A-Za-z0-9_.]+ \(/);
      expect(body).not.toMatch(/postgres(ql)?:\/\//i);
      expect(body).not.toMatch(/prisma/i);
      expect(body).not.toMatch(/SELECT .* FROM/i);
      expect(body).not.toMatch(/node_modules/);
      expect(safeJson(body)).toHaveProperty('statusCode');
    }
  });

  it('answers an unparseable body with 400 or 422, not 500', async () => {
    const response = await harness.app.inject({
      method: 'POST',
      url: '/api/v1/public/contact',
      headers: { 'content-type': 'application/json' },
      payload: '{ this is not json',
    });

    expect(response.statusCode).toBeGreaterThanOrEqual(400);
    expect(response.statusCode).toBeLessThan(500);
  });
});
