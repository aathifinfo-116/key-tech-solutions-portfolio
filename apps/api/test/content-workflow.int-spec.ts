/**
 * The editorial workflow, end to end through the real application.
 *
 * The invariants here are the ones an editor's work depends on:
 *   - saving a record edits it and nothing else - in particular it never
 *     takes a live page off the website,
 *   - moving between draft and published is a separate, permissioned action,
 *   - renaming a published record leaves a 301 behind,
 *   - every write is recorded as a revision and in the audit log.
 *
 * Each test creates the content it needs and removes it afterwards, so the
 * suite can run repeatedly against a seeded development database.
 */

import { randomBytes } from 'node:crypto';
import {
  createHarness,
  createTestUser,
  deleteTestUser,
  describeWithDatabase,
  HAS_DATABASE,
  safeJson,
  signIn,
  type Harness,
} from './harness';

let harness: Harness;

beforeAll(async () => {
  if (!HAS_DATABASE) return;
  harness = await createHarness();
}, 60_000);

afterAll(async () => {
  await harness?.close();
});

const EDITOR_PERMISSIONS = [
  'services:read',
  'services:create',
  'services:update',
  'services:delete',
];
const PUBLISHER_PERMISSIONS = [...EDITOR_PERMISSIONS, 'services:publish'];

/** The full payload the service schema requires, with one field varied. */
function servicePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const suffix = randomBytes(4).toString('hex');
  return {
    name: `Integration service ${suffix}`,
    slug: `integration-service-${suffix}`,
    shortDescription: 'Created by the integration suite. Safe to delete.',
    fullDescription: '<p>Created by the integration suite. Safe to delete.</p>',
    benefits: [],
    capabilities: [],
    deliverables: [],
    processSummary: '',
    iconName: '',
    isFeatured: false,
    sortOrder: 0,
    createRedirectOnSlugChange: true,
    ...overrides,
  };
}

describeWithDatabase('saving a record', () => {
  let publisher: Awaited<ReturnType<typeof createTestUser>>;
  let cookie: string;
  const created: string[] = [];

  beforeAll(async () => {
    publisher = await createTestUser(harness.prisma, {
      label: 'publisher',
      permissions: PUBLISHER_PERMISSIONS,
    });
    cookie = (await signIn(harness.app, publisher.email, publisher.password)).cookie as string;
  });

  afterAll(async () => {
    for (const id of created) {
      await harness.prisma.pageRevision.deleteMany({ where: { entityId: id } });
      await harness.prisma.auditLog.deleteMany({ where: { entityId: id } });
      await harness.prisma.service.delete({ where: { id } }).catch(() => undefined);
    }
    await deleteTestUser(harness.prisma, publisher);
  });

  async function createService(overrides: Record<string, unknown> = {}) {
    const response = await harness.app.inject({
      method: 'POST',
      url: '/api/v1/admin/services',
      headers: { cookie, 'content-type': 'application/json' },
      payload: servicePayload(overrides),
    });
    expect(response.statusCode).toBe(201);
    const body = safeJson(response.body);
    created.push(String(body.id));
    return body;
  }

  it('creates a draft by default', async () => {
    const body = await createService();

    const row = await harness.prisma.service.findUnique({ where: { id: String(body.id) } });
    expect(row?.status).toBe('DRAFT');
    expect(row?.publishedAt).toBeNull();
  });

  it('lets a publisher create something already published', async () => {
    // Creating published content is a publish, and is checked as one - see
    // the editor's refusal in the publishing suite below.
    const body = await createService({ status: 'PUBLISHED' });

    const row = await harness.prisma.service.findUnique({ where: { id: String(body.id) } });
    expect(row?.status).toBe('PUBLISHED');
  });

  it('returns the workflow fields an editor needs to see', async () => {
    const body = await createService();

    const response = await harness.app.inject({
      method: 'GET',
      url: `/api/v1/admin/services/${String(body.id)}`,
      headers: { cookie },
    });

    const record = safeJson(response.body);
    // Without these the editor cannot tell a published page from a draft.
    expect(record).toHaveProperty('status');
    expect(record).toHaveProperty('publishedAt');
    expect(record.status).toBe('DRAFT');
  });

  it('does not unpublish a live record, even when the payload says DRAFT', async () => {
    const body = await createService();
    const id = String(body.id);

    const published = await harness.app.inject({
      method: 'POST',
      url: `/api/v1/admin/services/${id}/status`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { status: 'PUBLISHED' },
    });
    expect(published.statusCode).toBeLessThan(300);
    expect((await harness.prisma.service.findUnique({ where: { id } }))?.status).toBe('PUBLISHED');

    // A stale form, or one that simply omits the field, must not take the
    // page off the website. This is the regression the end-to-end suite found.
    const saved = await harness.app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/services/${id}`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: servicePayload({
        name: String(body.name),
        slug: String(body.slug),
        status: 'DRAFT',
        changeSummary: 'An ordinary edit',
      }),
    });

    expect(saved.statusCode).toBeLessThan(300);
    const after = await harness.prisma.service.findUnique({ where: { id } });
    expect(after?.status).toBe('PUBLISHED');
  });

  it('records every save as a revision, with the summary the editor gave', async () => {
    const body = await createService();
    const id = String(body.id);

    await harness.app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/services/${id}`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: servicePayload({
        name: String(body.name),
        slug: String(body.slug),
        changeSummary: 'Tightened the wording',
      }),
    });

    const revisions = await harness.prisma.pageRevision.findMany({
      where: { entityType: 'SERVICE', entityId: id },
      orderBy: { version: 'asc' },
    });

    expect(revisions.length).toBeGreaterThanOrEqual(2);
    expect(revisions.at(-1)?.changeSummary).toBe('Tightened the wording');
    expect(revisions.at(-1)?.editorId).toBe(publisher.id);
  });

  it('writes an audit entry naming the actor', async () => {
    const body = await createService();

    const entries = await harness.prisma.auditLog.findMany({
      where: { entityId: String(body.id), action: 'CREATE' },
    });

    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].actorId).toBe(publisher.id);
  });
});

describeWithDatabase('publishing', () => {
  let editor: Awaited<ReturnType<typeof createTestUser>>;
  let publisher: Awaited<ReturnType<typeof createTestUser>>;
  let editorCookie: string;
  let publisherCookie: string;
  const created: string[] = [];

  beforeAll(async () => {
    editor = await createTestUser(harness.prisma, {
      label: 'editor',
      permissions: EDITOR_PERMISSIONS,
    });
    publisher = await createTestUser(harness.prisma, {
      label: 'pub2',
      permissions: PUBLISHER_PERMISSIONS,
    });
    editorCookie = (await signIn(harness.app, editor.email, editor.password)).cookie as string;
    publisherCookie = (await signIn(harness.app, publisher.email, publisher.password))
      .cookie as string;
  });

  afterAll(async () => {
    for (const id of created) {
      await harness.prisma.pageRevision.deleteMany({ where: { entityId: id } });
      await harness.prisma.auditLog.deleteMany({ where: { entityId: id } });
      await harness.prisma.service.delete({ where: { id } }).catch(() => undefined);
    }
    await deleteTestUser(harness.prisma, editor);
    await deleteTestUser(harness.prisma, publisher);
  });

  async function draft(cookie: string) {
    const response = await harness.app.inject({
      method: 'POST',
      url: '/api/v1/admin/services',
      headers: { cookie, 'content-type': 'application/json' },
      payload: servicePayload(),
    });
    const body = safeJson(response.body);
    created.push(String(body.id));
    return body;
  }

  it('refuses to create something already published without the permission', async () => {
    const response = await harness.app.inject({
      method: 'POST',
      url: '/api/v1/admin/services',
      headers: { cookie: editorCookie, 'content-type': 'application/json' },
      payload: servicePayload({ status: 'PUBLISHED' }),
    });

    expect(response.statusCode).toBe(403);
    expect(String(safeJson(response.body).message)).toMatch(/services:publish/);
  });

  it('refuses to publish for a role that may edit but not publish', async () => {
    const body = await draft(editorCookie);

    const response = await harness.app.inject({
      method: 'POST',
      url: `/api/v1/admin/services/${String(body.id)}/status`,
      headers: { cookie: editorCookie, 'content-type': 'application/json' },
      payload: { status: 'PUBLISHED' },
    });

    expect(response.statusCode).toBe(403);
    expect(String(safeJson(response.body).message)).toMatch(/services:publish/);
    expect(
      (await harness.prisma.service.findUnique({ where: { id: String(body.id) } }))?.status,
    ).toBe('DRAFT');
  });

  it('lets that role submit for review instead', async () => {
    const body = await draft(editorCookie);

    const response = await harness.app.inject({
      method: 'POST',
      url: `/api/v1/admin/services/${String(body.id)}/status`,
      headers: { cookie: editorCookie, 'content-type': 'application/json' },
      payload: { status: 'REVIEW' },
    });

    expect(response.statusCode).toBeLessThan(300);
    expect(
      (await harness.prisma.service.findUnique({ where: { id: String(body.id) } }))?.status,
    ).toBe('REVIEW');
  });

  it('stamps publishedAt when a publisher publishes', async () => {
    const body = await draft(publisherCookie);

    await harness.app.inject({
      method: 'POST',
      url: `/api/v1/admin/services/${String(body.id)}/status`,
      headers: { cookie: publisherCookie, 'content-type': 'application/json' },
      payload: { status: 'PUBLISHED' },
    });

    const row = await harness.prisma.service.findUnique({ where: { id: String(body.id) } });
    expect(row?.status).toBe('PUBLISHED');
    expect(row?.publishedAt).toBeInstanceOf(Date);
  });

  it('refuses a scheduled publication with no date', async () => {
    const body = await draft(publisherCookie);

    const response = await harness.app.inject({
      method: 'POST',
      url: `/api/v1/admin/services/${String(body.id)}/status`,
      headers: { cookie: publisherCookie, 'content-type': 'application/json' },
      payload: { status: 'SCHEDULED', scheduledAt: null },
    });

    expect(response.statusCode).toBeGreaterThanOrEqual(400);
    expect(response.statusCode).toBeLessThan(500);
  });
});

describeWithDatabase('renaming published content', () => {
  let publisher: Awaited<ReturnType<typeof createTestUser>>;
  let cookie: string;
  const created: string[] = [];
  const redirects: string[] = [];

  beforeAll(async () => {
    publisher = await createTestUser(harness.prisma, {
      label: 'rename',
      permissions: PUBLISHER_PERMISSIONS,
    });
    cookie = (await signIn(harness.app, publisher.email, publisher.password)).cookie as string;
  });

  afterAll(async () => {
    for (const source of redirects) {
      await harness.prisma.redirectRule.deleteMany({ where: { source } });
    }
    for (const id of created) {
      await harness.prisma.pageRevision.deleteMany({ where: { entityId: id } });
      await harness.prisma.auditLog.deleteMany({ where: { entityId: id } });
      await harness.prisma.service.delete({ where: { id } }).catch(() => undefined);
    }
    await deleteTestUser(harness.prisma, publisher);
  });

  it('leaves a 301 behind so inbound links keep working', async () => {
    const createResponse = await harness.app.inject({
      method: 'POST',
      url: '/api/v1/admin/services',
      headers: { cookie, 'content-type': 'application/json' },
      payload: servicePayload(),
    });
    const body = safeJson(createResponse.body);
    const id = String(body.id);
    const oldSlug = String(body.slug);
    created.push(id);

    await harness.app.inject({
      method: 'POST',
      url: `/api/v1/admin/services/${id}/status`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { status: 'PUBLISHED' },
    });

    const newSlug = `${oldSlug}-renamed`;
    const renamed = await harness.app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/services/${id}`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: servicePayload({ name: String(body.name), slug: newSlug, changeSummary: 'Renamed' }),
    });
    expect(renamed.statusCode).toBeLessThan(300);

    redirects.push(`/services/${oldSlug}`);
    const rule = await harness.prisma.redirectRule.findFirst({
      where: { source: `/services/${oldSlug}` },
    });

    expect(rule).not.toBeNull();
    expect(rule?.destination).toBe(`/services/${newSlug}`);
    expect(rule?.status).toBe('PERMANENT_301');
    expect(rule?.isActive).toBe(true);
  });

  it('resolves that redirect for the website middleware', async () => {
    const source = redirects[0];
    const response = await harness.app.inject({
      method: 'GET',
      url: `/api/v1/public/routes/resolve?path=${encodeURIComponent(source)}`,
    });

    const resolved = safeJson(response.body) as {
      redirect: { statusCode: number } | null;
      missing: boolean;
    };
    expect(response.statusCode).toBe(200);
    expect(resolved.redirect?.statusCode).toBe(301);
    expect(resolved.missing).toBe(false);
  });
});
