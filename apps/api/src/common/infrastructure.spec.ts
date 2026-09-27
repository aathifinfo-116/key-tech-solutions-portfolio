import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { diffKeys, redact } from './audit/audit.service';
import { maskEmail, redactLinks } from './mail/mail.service';
import { RevalidationService } from './revalidation/revalidation.service';
import { LocalFileStorageProvider } from './storage/local-file-storage.provider';
import { StorageError } from './storage/storage.interface';
import { AppConfig } from '../config/app-config';
import { buildOrderBy, buildSearchWhere, buildMeta, normalisePaging } from './utils/pagination';
import { mapDocument, mapMedia, mapWorkflowSteps } from './utils/mappers';

const BASE_ENV = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db?schema=public',
  SESSION_SECRET: 'x'.repeat(48),
} as unknown as NodeJS.ProcessEnv;

describe('audit redaction', () => {
  it('masks anything credential-shaped, at any depth', () => {
    const result = redact({
      email: 'a@b.c',
      password: 'hunter2',
      nested: { tokenHash: 'abc', currentPassword: 'x', apiKey: 'k' },
      list: [{ secret: 's' }],
    }) as Record<string, unknown>;

    expect(result.email).toBe('a@b.c');
    expect(result.password).toBe('[redacted]');
    expect((result.nested as Record<string, unknown>).tokenHash).toBe('[redacted]');
    expect((result.nested as Record<string, unknown>).apiKey).toBe('[redacted]');
    expect(((result.list as unknown[])[0] as Record<string, unknown>).secret).toBe('[redacted]');
  });

  it('matches key names regardless of separators or case', () => {
    const result = redact({ 'reset-token': 'x', SESSION_ID: 'y' }) as Record<string, unknown>;
    expect(result['reset-token']).toBe('[redacted]');
    expect(result.SESSION_ID).toBe('[redacted]');
  });

  it('stops at a sane depth instead of recursing forever', () => {
    const deep: Record<string, unknown> = {};
    let cursor = deep;
    for (let i = 0; i < 12; i += 1) {
      cursor.next = {};
      cursor = cursor.next as Record<string, unknown>;
    }
    expect(() => redact(deep)).not.toThrow();
  });
});

describe('diffKeys', () => {
  it('names only the fields that changed', () => {
    expect(diffKeys({ a: 1, b: 2 }, { a: 1, b: 3 })).toEqual(['b']);
  });

  it('ignores bookkeeping columns', () => {
    expect(diffKeys({ updatedAt: 1, version: 1 }, { updatedAt: 2, version: 2 })).toEqual([]);
  });

  it('reports added and removed fields', () => {
    expect(diffKeys({ a: 1 }, { b: 2 })).toEqual(['a', 'b']);
  });
});

describe('mail helpers', () => {
  it('strips query strings so tokens never reach the log', () => {
    expect(redactLinks('Open https://admin.test/reset?token=secret now')).toBe(
      'Open https://admin.test/reset?[redacted] now',
    );
  });

  it('masks an email down to a correlatable stub', () => {
    expect(maskEmail('alex@example.invalid')).toBe('a***@example.invalid');
    expect(maskEmail('broken')).toBe('[invalid]');
  });
});

describe('RevalidationService.tagsFor', () => {
  const service = new RevalidationService(new AppConfig(BASE_ENV));

  it('invalidates the entity, its listing and the sitemap', () => {
    const tags = service.tagsFor('SERVICE', 'saas-product-development');
    expect(tags).toEqual(
      expect.arrayContaining(['services', 'service:saas-product-development', 'sitemap']),
    );
  });

  it('also invalidates the homepage for featured content', () => {
    expect(service.tagsFor('PRODUCT', 'keysportsbooking', true)).toContain('homepage');
    expect(service.tagsFor('PRODUCT', 'keysportsbooking', false)).not.toContain('homepage');
  });

  it('treats the home page slug as the homepage', () => {
    expect(service.tagsFor('PAGE', 'home')).toContain('homepage');
  });

  it('groups company content under one tag', () => {
    for (const type of ['TEAM_MEMBER', 'COMPANY_VALUE', 'PROCESS_PHASE', 'STATISTIC']) {
      expect(service.tagsFor(type)).toContain('company');
    }
  });

  it('never returns duplicates', () => {
    const tags = service.tagsFor('BLOG_POST', 'a-post', true);
    expect(new Set(tags).size).toBe(tags.length);
  });
});

describe('LocalFileStorageProvider', () => {
  let root: string;
  let provider: LocalFileStorageProvider;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'kts-storage-'));
    provider = new LocalFileStorageProvider(
      new AppConfig({
        ...BASE_ENV,
        STORAGE_LOCAL_ROOT: root,
        STORAGE_PUBLIC_BASE_URL: 'http://localhost:4010/api/v1/media/file',
      } as unknown as NodeJS.ProcessEnv),
    );
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  const key = 'public/products/0f9b5c40-6f5f-4a52-9d1e-1f6c1b2b3c4d.png';

  it('stores and reads an object', async () => {
    const stored = await provider.put(key, Buffer.from('hello'), 'image/png');
    expect(stored.sizeBytes).toBe(5);
    expect(await provider.exists(key)).toBe(true);
    expect((await provider.get(key)).toString()).toBe('hello');
  });

  it('refuses to overwrite an existing object', async () => {
    await provider.put(key, Buffer.from('a'), 'image/png');
    await expect(provider.put(key, Buffer.from('b'), 'image/png')).rejects.toBeInstanceOf(
      StorageError,
    );
  });

  it('rejects a traversal key', async () => {
    await expect(provider.get('../../../etc/passwd')).rejects.toBeInstanceOf(StorageError);
    await expect(provider.get('public/../../secret.png')).rejects.toBeInstanceOf(StorageError);
  });

  it('refuses a public url for a private object', () => {
    expect(() =>
      provider.publicUrl('private/careers/0f9b5c40-6f5f-4a52-9d1e-1f6c1b2b3c4d.pdf'),
    ).toThrow(StorageError);
  });

  it('builds a public url from the configured base', () => {
    expect(provider.publicUrl(key)).toBe(
      'http://localhost:4010/api/v1/media/file/products/0f9b5c40-6f5f-4a52-9d1e-1f6c1b2b3c4d.png',
    );
  });

  it('signs a private link that verifies and then expires', async () => {
    // A storage key for a private object, not a cryptographic key.
    const documentKey = 'private/careers/0f9b5c40-6f5f-4a52-9d1e-1f6c1b2b3c4d.pdf';
    const signed = await provider.signedUrl(documentKey, 300);
    const url = new URL(signed.url);
    const expires = Number(url.searchParams.get('expires'));
    const signature = url.searchParams.get('signature') as string;

    expect(provider.verifySignature(documentKey, expires, signature)).toBe(true);
    // Wrong key, tampered signature and past expiry are all rejected.
    expect(provider.verifySignature('private/careers/other.pdf', expires, signature)).toBe(false);
    expect(provider.verifySignature(documentKey, expires, 'deadbeef')).toBe(false);
    expect(
      provider.verifySignature(
        documentKey,
        Math.floor(Date.now() / 1000) - 10,
        provider.sign(documentKey, Math.floor(Date.now() / 1000) - 10),
      ),
    ).toBe(false);
  });
});

describe('pagination helpers', () => {
  it('clamps paging values into range', () => {
    expect(normalisePaging({ page: 0, pageSize: 0 })).toEqual({ page: 1, pageSize: 12 });
    expect(normalisePaging({ page: 3, pageSize: 5000 }).pageSize).toBe(100);
    expect(normalisePaging(undefined)).toEqual({ page: 1, pageSize: 12 });
  });

  it('computes navigation flags', () => {
    expect(buildMeta({ page: 2, pageSize: 10 }, 25)).toEqual({
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
      hasNext: true,
      hasPrevious: true,
    });
    expect(buildMeta({ page: 1, pageSize: 10 }, 0).totalPages).toBe(0);
  });

  it('only sorts by allow-listed columns', () => {
    const fallback = [{ createdAt: 'desc' as const }];
    expect(buildOrderBy('name', 'asc', ['name'], fallback)).toEqual([{ name: 'asc' }]);
    expect(buildOrderBy('passwordHash', 'asc', ['name'], fallback)).toEqual(fallback);
    expect(buildOrderBy(undefined, undefined, ['name'], fallback)).toEqual(fallback);
  });

  it('builds a case-insensitive search across fields', () => {
    expect(buildSearchWhere('  key  ', ['name', 'slug'])).toEqual({
      OR: [
        { name: { contains: 'key', mode: 'insensitive' } },
        { slug: { contains: 'key', mode: 'insensitive' } },
      ],
    });
    expect(buildSearchWhere('   ', ['name'])).toBeUndefined();
    expect(buildSearchWhere('key', [])).toBeUndefined();
  });
});

describe('mappers', () => {
  const resolver = { publicUrl: (key: string) => `https://cdn.test/${key}` };

  const media = {
    id: 'm1',
    storageKey: 'public/products/a.png',
    originalName: 'a.png',
    generatedName: 'a.png',
    mimeType: 'image/png',
    extension: 'png',
    kind: 'IMAGE',
    visibility: 'PUBLIC',
    folder: 'products',
    sizeBytes: 100,
    width: 800,
    height: 600,
    aspectRatio: 1.3333,
    blurDataUrl: null,
    altText: 'Dashboard',
    caption: null,
    focalX: 0.5,
    focalY: 0.5,
    checksum: null,
    variants: { card: 'public/products/a-card.webp' },
    uploadedById: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    archivedAt: null,
  } as never;

  it('resolves variant urls and prefers the card size', () => {
    const dto = mapMedia(media, resolver);
    expect(dto?.url).toBe('https://cdn.test/public/products/a-card.webp');
    expect(dto?.variants.original).toBe('https://cdn.test/public/products/a.png');
  });

  it('never exposes an archived or private asset', () => {
    expect(
      mapMedia({ ...(media as object), archivedAt: new Date() } as never, resolver),
    ).toBeNull();
    expect(mapMedia({ ...(media as object), visibility: 'PRIVATE' } as never, resolver)).toBeNull();
  });

  it('never returns a url for a private document', () => {
    const dto = mapDocument({
      id: 'd1',
      title: 'CV',
      description: null,
      originalName: 'cv.pdf',
      mimeType: 'application/pdf',
      extension: 'pdf',
      sizeBytes: 1000,
      kind: 'CV',
      visibility: 'PRIVATE',
      storageKey: 'private/careers/x.pdf',
      createdAt: new Date('2026-01-01'),
      archivedAt: null,
    } as never);
    expect(dto?.url).toBeNull();
    expect(JSON.stringify(dto)).not.toContain('private/careers');
  });

  it('reads workflow steps defensively', () => {
    expect(mapWorkflowSteps(null)).toEqual([]);
    expect(mapWorkflowSteps('nope' as never)).toEqual([]);
    expect(
      mapWorkflowSteps([{ title: 'A', description: 'B' }, { nope: 1 }, null] as never),
    ).toEqual([{ title: 'A', description: 'B' }]);
  });
});
