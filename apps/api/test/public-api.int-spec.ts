/**
 * The public read surface, end to end through the real application.
 *
 * One rule matters more than the rest: unpublished work must be invisible.
 * A draft, a scheduled item, an archived item and a private project must be
 * absent from every listing, every detail route, the sitemap and the route
 * resolver - and they must be absent together, because a crawler that finds
 * one of them through any single route has found it.
 *
 * The suite also covers the public write surface's validation, since a form
 * that accepts junk is a spam queue rather than a lead pipeline.
 */

import { randomBytes } from 'node:crypto';
import {
  createHarness,
  describeWithDatabase,
  HAS_DATABASE,
  safeJson,
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

interface Fixture {
  id: string;
  slug: string;
}

/** Creates one service in each non-public state, straight through Prisma. */
async function createHiddenServices(harness: Harness): Promise<Record<string, Fixture>> {
  const suffix = randomBytes(4).toString('hex');

  const make = async (state: string, data: Record<string, unknown>): Promise<Fixture> => {
    const slug = `hidden-${state}-${suffix}`;
    const row = await harness.prisma.service.create({
      data: {
        slug,
        name: `Hidden ${state} ${suffix}`,
        shortDescription: 'Created by the integration suite. Must never be public.',
        fullDescription: '<p>Must never be public.</p>',
        ...data,
      },
      select: { id: true, slug: true },
    });
    return row;
  };

  return {
    draft: await make('draft', { status: 'DRAFT' }),
    review: await make('review', { status: 'REVIEW' }),
    scheduled: await make('scheduled', {
      status: 'SCHEDULED',
      // An hour away: a scheduled item is not public until its time comes.
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
    }),
    archived: await make('archived', { status: 'ARCHIVED', archivedAt: new Date() }),
    publishedThenArchived: await make('pub-archived', {
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 1000),
      archivedAt: new Date(),
    }),
  };
}

describeWithDatabase('unpublished content', () => {
  let hidden: Record<string, Fixture>;

  beforeAll(async () => {
    hidden = await createHiddenServices(harness);
  });

  afterAll(async () => {
    for (const fixture of Object.values(hidden ?? {})) {
      await harness.prisma.service.delete({ where: { id: fixture.id } }).catch(() => undefined);
    }
  });

  it('is absent from the public listing', async () => {
    const response = await harness.app.inject({ method: 'GET', url: '/api/v1/public/services' });
    expect(response.statusCode).toBe(200);

    for (const fixture of Object.values(hidden)) {
      expect(response.body).not.toContain(fixture.slug);
    }
  });

  it('answers 404 on the detail route, in every unpublished state', async () => {
    for (const [state, fixture] of Object.entries(hidden)) {
      const response = await harness.app.inject({
        method: 'GET',
        url: `/api/v1/public/services/${fixture.slug}`,
      });
      expect([response.statusCode, state]).toEqual([404, state]);
    }
  });

  it('is absent from the sitemap', async () => {
    const response = await harness.app.inject({ method: 'GET', url: '/api/v1/public/sitemap' });
    expect(response.statusCode).toBe(200);

    for (const fixture of Object.values(hidden)) {
      expect(response.body).not.toContain(fixture.slug);
    }
  });

  it('is reported as missing to the website, so the page is a real 404', async () => {
    for (const fixture of Object.values(hidden)) {
      const response = await harness.app.inject({
        method: 'GET',
        url: `/api/v1/public/routes/resolve?path=${encodeURIComponent(`/services/${fixture.slug}`)}`,
      });

      const resolved = safeJson(response.body) as { missing: boolean };
      expect(resolved.missing).toBe(true);
    }
  });

  it('becomes visible the moment it is published, through every route at once', async () => {
    const fixture = hidden.draft;

    await harness.prisma.service.update({
      where: { id: fixture.id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });

    const [detail, listing, resolved] = await Promise.all([
      harness.app.inject({ method: 'GET', url: `/api/v1/public/services/${fixture.slug}` }),
      harness.app.inject({ method: 'GET', url: '/api/v1/public/services' }),
      harness.app.inject({
        method: 'GET',
        url: `/api/v1/public/routes/resolve?path=${encodeURIComponent(`/services/${fixture.slug}`)}`,
      }),
    ]);

    expect(detail.statusCode).toBe(200);
    expect(listing.body).toContain(fixture.slug);
    expect((safeJson(resolved.body) as { missing: boolean }).missing).toBe(false);

    // Put it back, so the other assertions in this file keep their meaning.
    await harness.prisma.service.update({
      where: { id: fixture.id },
      data: { status: 'DRAFT', publishedAt: null },
    });
  });
});

describeWithDatabase('the public read surface', () => {
  it('never returns an internal field', async () => {
    const response = await harness.app.inject({ method: 'GET', url: '/api/v1/public/services' });
    const body = response.body;

    // Editorial machinery has no business in a website response.
    expect(body).not.toMatch(/"passwordHash"/);
    expect(body).not.toMatch(/"internalNotes"/);
    expect(body).not.toMatch(/"tokenHash"/);
  });

  it('resolves a listing path as present, not missing', async () => {
    for (const path of ['/services', '/products', '/about', '/']) {
      const response = await harness.app.inject({
        method: 'GET',
        url: `/api/v1/public/routes/resolve?path=${encodeURIComponent(path)}`,
      });
      const resolved = safeJson(response.body) as { missing: boolean };
      expect([path, resolved.missing]).toEqual([path, false]);
    }
  });

  it('refuses a route resolution with no path', async () => {
    const response = await harness.app.inject({
      method: 'GET',
      url: '/api/v1/public/routes/resolve',
    });
    expect(response.statusCode).toBe(400);
  });
});

describeWithDatabase('public forms', () => {
  const submitted: string[] = [];

  afterAll(async () => {
    // A submission hangs off its lead, and the lead cascades to it.
    for (const email of submitted) {
      await harness.prisma.lead.deleteMany({ where: { email } });
    }
  });

  /** How many contact submissions exist for this address. */
  const submissionsFor = (email: string) =>
    harness.prisma.contactSubmission.count({ where: { lead: { email } } });

  it('rejects a submission that fails validation, naming the fields', async () => {
    const response = await harness.app.inject({
      method: 'POST',
      url: '/api/v1/public/contact',
      headers: { 'content-type': 'application/json' },
      payload: {
        name: '',
        email: 'not-an-email',
        subject: '',
        message: 'too short',
        consent: false,
      },
    });

    expect(response.statusCode).toBe(422);
    const body = safeJson(response.body) as { details?: Array<{ path: string }> };
    const paths = (body.details ?? []).map((detail) => detail.path);
    expect(paths).toEqual(expect.arrayContaining(['email']));
  });

  it('rejects a submission without consent', async () => {
    const email = `int-${randomBytes(4).toString('hex')}@keytech.invalid`;
    const response = await harness.app.inject({
      method: 'POST',
      url: '/api/v1/public/contact',
      headers: { 'content-type': 'application/json' },
      payload: {
        name: 'Integration Suite',
        email,
        subject: 'Automated check',
        message: 'This message is long enough to pass the minimum length rule.',
        consent: false,
      },
    });

    expect(response.statusCode).toBe(422);
    expect(await submissionsFor(email)).toBe(0);
  });

  it('accepts a complete submission and answers with a reference, not a row id', async () => {
    const email = `int-${randomBytes(4).toString('hex')}@keytech.invalid`;
    submitted.push(email);

    const response = await harness.app.inject({
      method: 'POST',
      url: '/api/v1/public/contact',
      headers: { 'content-type': 'application/json' },
      payload: {
        name: 'Integration Suite',
        email,
        subject: 'Automated check',
        message: 'Submitted by the integration suite. Safe to ignore or delete.',
        consent: true,
      },
    });

    expect(response.statusCode).toBe(201);
    const body = safeJson(response.body);
    expect(String(body.reference)).toMatch(/^KTS-C-\d{6}$/);
    // A database id in a public response is an invitation to enumerate.
    expect(body).not.toHaveProperty('id');

    expect(await submissionsFor(email)).toBe(1);
  });
});
