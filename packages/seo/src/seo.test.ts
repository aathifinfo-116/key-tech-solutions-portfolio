import { describe, expect, it } from 'vitest';
import {
  absoluteUrl,
  buildBreadcrumbs,
  buildMetadata,
  buildPaginationMeta,
  clampDescription,
  noIndexMetadata,
} from './metadata';
import {
  articleJsonLd,
  breadcrumbJsonLd,
  collectionPageJsonLd,
  faqJsonLd,
  jobPostingJsonLd,
  organizationJsonLd,
  prune,
  serializeJsonLd,
  serviceJsonLd,
  softwareApplicationJsonLd,
  webPageJsonLd,
  webSiteJsonLd,
} from './jsonld';
import { buildRobots, buildSitemapEntries, renderImageSitemap, toNextSitemap } from './sitemap';
import { auditAll, auditEntity, lengthIndicator, type AuditableEntity } from './audit';

const CONTEXT = {
  siteUrl: 'https://keytech.example',
  siteName: 'Key Tech Solutions',
  defaultOgImage: 'https://keytech.example/og-default.png',
};

describe('absoluteUrl', () => {
  it('joins the site url and path without duplicate slashes', () => {
    expect(absoluteUrl('https://keytech.example/', '/services')).toBe(
      'https://keytech.example/services',
    );
    expect(absoluteUrl('https://keytech.example', 'services')).toBe(
      'https://keytech.example/services',
    );
    expect(absoluteUrl('https://keytech.example', '/')).toBe('https://keytech.example/');
    expect(absoluteUrl('https://keytech.example', '/services/')).toBe(
      'https://keytech.example/services',
    );
  });
});

describe('clampDescription', () => {
  it('leaves short text untouched', () => {
    expect(clampDescription('Short description.')).toBe('Short description.');
  });

  it('trims on a sentence boundary when possible', () => {
    const text = `${'a'.repeat(80)}. ${'b'.repeat(200)}`;
    const result = clampDescription(text, 158);
    expect(result?.endsWith('.')).toBe(true);
    expect(result!.length).toBeLessThanOrEqual(158);
  });

  it('falls back to an ellipsis on a word boundary', () => {
    const result = clampDescription(`${'word '.repeat(80)}`, 60);
    expect(result!.length).toBeLessThanOrEqual(63);
    expect(result!.endsWith('...')).toBe(true);
  });
});

describe('buildMetadata', () => {
  it('applies the title template and canonical url', () => {
    const meta = buildMetadata(CONTEXT, { path: '/services', title: 'Services' });
    expect(meta.title).toBe('Services | Key Tech Solutions');
    expect(meta.alternates?.canonical).toBe('https://keytech.example/services');
    expect(meta.robots?.index).toBe(true);
  });

  it('does not double up the site name', () => {
    const meta = buildMetadata(CONTEXT, { path: '/', title: 'Key Tech Solutions' });
    expect(meta.title).toBe('Key Tech Solutions');
  });

  it('prefers the editor supplied seo values', () => {
    const meta = buildMetadata(CONTEXT, {
      path: '/products/keysportsbooking',
      title: 'KeySportsBooking',
      description: 'Fallback description',
      seo: {
        title: 'Sports venue booking software',
        description: 'Editor written description for the product page.',
        canonicalUrl: 'https://keytech.example/products/keysportsbooking',
        ogTitle: 'KeySportsBooking by Key Tech',
        ogDescription: null,
        ogImage: null,
        twitterCard: 'summary_large_image',
        keywords: ['booking', 'sports'],
        robotsIndex: true,
        robotsFollow: true,
        includeInSitemap: true,
        sitemapPriority: 0.8,
        sitemapFrequency: 'WEEKLY',
      },
    });
    expect(meta.title).toBe('Sports venue booking software | Key Tech Solutions');
    expect(meta.description).toBe('Editor written description for the product page.');
    expect(meta.openGraph?.title).toBe('KeySportsBooking by Key Tech');
    expect(meta.keywords).toEqual(['booking', 'sports']);
  });

  it('honours a stored noindex flag', () => {
    const meta = buildMetadata(CONTEXT, {
      path: '/hidden',
      title: 'Hidden',
      seo: {
        title: null,
        description: null,
        canonicalUrl: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        twitterCard: 'summary',
        keywords: [],
        robotsIndex: false,
        robotsFollow: false,
        includeInSitemap: false,
        sitemapPriority: 0.1,
        sitemapFrequency: 'NEVER',
      },
    });
    expect(meta.robots?.index).toBe(false);
    expect(meta.robots?.follow).toBe(false);
  });

  it('forces noindex for preview routes regardless of stored settings', () => {
    const meta = buildMetadata(CONTEXT, {
      path: '/preview/page',
      title: 'Preview',
      forceNoIndex: true,
    });
    expect(meta.robots?.index).toBe(false);
    expect(meta.robots?.googleBot?.index).toBe(false);
  });

  it('falls back to the default open graph image', () => {
    const meta = buildMetadata(CONTEXT, { path: '/about', title: 'About' });
    expect(meta.openGraph?.images?.[0]?.url).toBe(CONTEXT.defaultOgImage);
    expect(meta.twitter?.images).toEqual([CONTEXT.defaultOgImage]);
  });

  it('omits the images key entirely when there is no image to name', () => {
    // An empty array would override a framework file-convention OG image,
    // leaving shares with no picture at all.
    const meta = buildMetadata(
      { siteUrl: CONTEXT.siteUrl, siteName: CONTEXT.siteName },
      { path: '/about', title: 'About' },
    );
    expect(meta.openGraph).not.toHaveProperty('images');
    expect(meta.twitter).not.toHaveProperty('images');
  });

  it('emits article timestamps when supplied', () => {
    const meta = buildMetadata(CONTEXT, {
      path: '/blog/post',
      title: 'Post',
      type: 'article',
      publishedTime: '2026-01-01T00:00:00.000Z',
      modifiedTime: '2026-02-01T00:00:00.000Z',
      authors: ['Key Tech Team'],
    });
    expect(meta.openGraph?.type).toBe('article');
    expect(meta.openGraph?.publishedTime).toBe('2026-01-01T00:00:00.000Z');
    expect(meta.openGraph?.authors).toEqual(['Key Tech Team']);
  });
});

describe('noIndexMetadata', () => {
  it('blocks indexing and following', () => {
    const meta = noIndexMetadata('Admin');
    expect(meta.robots).toEqual({
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    });
  });
});

describe('buildPaginationMeta', () => {
  it('canonicalises page one to the bare path', () => {
    const meta = buildPaginationMeta({
      page: 1,
      totalPages: 5,
      basePath: '/blog',
      siteUrl: CONTEXT.siteUrl,
    });
    expect(meta.canonical).toBe('https://keytech.example/blog');
    expect(meta.prev).toBeUndefined();
    expect(meta.next).toBe('https://keytech.example/blog?page=2');
  });

  it('canonicalises deeper pages to themselves', () => {
    const meta = buildPaginationMeta({
      page: 3,
      totalPages: 5,
      basePath: '/blog',
      siteUrl: CONTEXT.siteUrl,
    });
    expect(meta.canonical).toBe('https://keytech.example/blog?page=3');
    expect(meta.prev).toBe('https://keytech.example/blog?page=2');
    expect(meta.noIndex).toBe(false);
  });

  it('noindexes pages beyond the end of the list', () => {
    expect(
      buildPaginationMeta({ page: 9, totalPages: 5, basePath: '/blog', siteUrl: CONTEXT.siteUrl })
        .noIndex,
    ).toBe(true);
  });
});

describe('buildBreadcrumbs', () => {
  it('always starts at home', () => {
    expect(buildBreadcrumbs([{ name: 'Services', path: '/services' }])).toEqual([
      { name: 'Home', path: '/' },
      { name: 'Services', path: '/services' },
    ]);
  });
});

// ---------------------------------------------------------------------------
// Structured data
// ---------------------------------------------------------------------------

describe('prune', () => {
  it('removes undefined, null, empty strings, arrays and objects', () => {
    expect(prune({ a: 1, b: undefined, c: null, d: '', e: [], f: {}, g: 'ok' })).toEqual({
      a: 1,
      g: 'ok',
    });
  });
});

describe('organizationJsonLd', () => {
  it('emits only supplied fields', () => {
    const data = organizationJsonLd({ siteUrl: CONTEXT.siteUrl, name: 'Key Tech Solutions' });
    expect(data['@type']).toBe('Organization');
    expect(data.name).toBe('Key Tech Solutions');
    expect(data).not.toHaveProperty('address');
    expect(data).not.toHaveProperty('aggregateRating');
    expect(data).not.toHaveProperty('telephone');
  });

  it('includes contact details when present', () => {
    const data = organizationJsonLd({
      siteUrl: CONTEXT.siteUrl,
      name: 'Key Tech Solutions',
      email: 'hello@example.invalid',
      sameAs: ['https://www.linkedin.com/company/example'],
    });
    expect(data.email).toBe('hello@example.invalid');
    expect(data.sameAs).toHaveLength(1);
  });
});

describe('webSiteJsonLd and webPageJsonLd', () => {
  it('links the page to the website and organization nodes', () => {
    const site = webSiteJsonLd({ siteUrl: CONTEXT.siteUrl, name: CONTEXT.siteName });
    expect(site['@id']).toBe('https://keytech.example/#website');

    const page = webPageJsonLd({
      siteUrl: CONTEXT.siteUrl,
      url: 'https://keytech.example/about',
      name: 'About',
      type: 'AboutPage',
    });
    expect(page['@type']).toBe('AboutPage');
    expect(page.isPartOf).toEqual({ '@id': 'https://keytech.example/#website' });
  });
});

describe('breadcrumbJsonLd', () => {
  it('numbers positions from one', () => {
    const data = breadcrumbJsonLd([
      { name: 'Home', url: 'https://keytech.example/' },
      { name: 'Services', url: 'https://keytech.example/services' },
    ]);
    const items = data.itemListElement as Array<Record<string, unknown>>;
    expect(items[0]?.position).toBe(1);
    expect(items[1]?.name).toBe('Services');
  });
});

describe('serviceJsonLd', () => {
  it('references the organization as provider and omits pricing', () => {
    const data = serviceJsonLd({
      siteUrl: CONTEXT.siteUrl,
      url: 'https://keytech.example/services/saas-product-development',
      name: 'SaaS Product Development',
    });
    expect(data.provider).toEqual({ '@id': 'https://keytech.example/#organization' });
    expect(data).not.toHaveProperty('offers');
    expect(data).not.toHaveProperty('aggregateRating');
  });
});

describe('softwareApplicationJsonLd', () => {
  it('never invents an offer or rating', () => {
    const data = softwareApplicationJsonLd({
      siteUrl: CONTEXT.siteUrl,
      url: 'https://keytech.example/products/keysportsbooking',
      name: 'KeySportsBooking',
      description: 'Sports venue discovery and booking platform.',
    });
    expect(data['@type']).toBe('SoftwareApplication');
    expect(data.applicationCategory).toBe('BusinessApplication');
    expect(data).not.toHaveProperty('offers');
    expect(data).not.toHaveProperty('aggregateRating');
    expect(data).not.toHaveProperty('review');
  });
});

describe('articleJsonLd', () => {
  it('defaults to BlogPosting and falls back to the organization as author', () => {
    const data = articleJsonLd({
      siteUrl: CONTEXT.siteUrl,
      url: 'https://keytech.example/blog/post',
      headline: 'A post',
      datePublished: '2026-01-01T00:00:00.000Z',
    });
    expect(data['@type']).toBe('BlogPosting');
    expect(data.author).toEqual({ '@id': 'https://keytech.example/#organization' });
    expect(data.dateModified).toBe('2026-01-01T00:00:00.000Z');
  });

  it('truncates very long headlines', () => {
    const data = articleJsonLd({
      siteUrl: CONTEXT.siteUrl,
      url: 'https://keytech.example/blog/post',
      headline: 'x'.repeat(200),
    });
    expect((data.headline as string).length).toBe(110);
  });
});

describe('faqJsonLd', () => {
  it('returns null when there are no questions', () => {
    expect(faqJsonLd([])).toBeNull();
  });

  it('maps questions to accepted answers', () => {
    const data = faqJsonLd([{ question: 'Do you build SaaS products?', answer: 'Yes.' }]);
    const entities = data!.mainEntity as Array<Record<string, unknown>>;
    expect(entities[0]?.name).toBe('Do you build SaaS products?');
  });
});

describe('jobPostingJsonLd', () => {
  it('maps employment type to schema.org values', () => {
    const data = jobPostingJsonLd({
      siteUrl: CONTEXT.siteUrl,
      url: 'https://keytech.example/careers/backend-engineer',
      title: 'Backend Engineer',
      description: 'Build APIs.',
      employmentType: 'CONTRACT',
      location: 'Colombo',
      isRemote: false,
      organizationName: 'Key Tech Solutions',
    });
    expect(data.employmentType).toBe('CONTRACTOR');
    expect(data).not.toHaveProperty('baseSalary');
  });

  it('marks remote roles as telecommute', () => {
    const data = jobPostingJsonLd({
      siteUrl: CONTEXT.siteUrl,
      url: 'https://keytech.example/careers/x',
      title: 'X',
      description: 'Y',
      employmentType: 'FULL_TIME',
      location: 'Sri Lanka',
      isRemote: true,
      organizationName: 'Key Tech Solutions',
    });
    expect(data.jobLocationType).toBe('TELECOMMUTE');
  });
});

describe('collectionPageJsonLd', () => {
  it('builds an item list', () => {
    const data = collectionPageJsonLd({
      siteUrl: CONTEXT.siteUrl,
      url: 'https://keytech.example/services',
      name: 'Services',
      items: [{ name: 'A', url: 'https://keytech.example/services/a' }],
    });
    const main = data.mainEntity as Record<string, unknown>;
    expect((main.itemListElement as unknown[]).length).toBe(1);
  });
});

describe('serializeJsonLd', () => {
  it('escapes angle brackets so a script tag cannot be closed early', () => {
    const output = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(output).not.toContain('</script>');
    expect(output).toContain('\\u003c');
  });

  it('returns an empty string for null', () => {
    expect(serializeJsonLd(null)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Sitemap and robots
// ---------------------------------------------------------------------------

describe('buildSitemapEntries', () => {
  const base = {
    lastModified: '2026-01-01T00:00:00.000Z',
    isIndexable: true,
    includeInSitemap: true,
  };

  it('excludes non-indexable and excluded entries', () => {
    const entries = buildSitemapEntries([
      { ...base, path: '/a' },
      { ...base, path: '/b', isIndexable: false },
      { ...base, path: '/c', includeInSitemap: false },
    ]);
    expect(entries.map((e) => e.path)).toEqual(['/a']);
  });

  it('de-duplicates paths and normalises trailing slashes', () => {
    const entries = buildSitemapEntries([
      { ...base, path: '/services/' },
      { ...base, path: '/services' },
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.path).toBe('/services');
  });

  it('clamps priority into 0..1 and lowercases frequency', () => {
    const entries = buildSitemapEntries([
      { ...base, path: '/x', priority: 5, changeFrequency: 'DAILY' },
    ]);
    expect(entries[0]?.priority).toBe(1);
    expect(entries[0]?.changeFrequency).toBe('daily');
  });

  it('sorts by priority then recency', () => {
    const entries = buildSitemapEntries([
      { ...base, path: '/low', priority: 0.3 },
      { ...base, path: '/high', priority: 0.9 },
    ]);
    expect(entries[0]?.path).toBe('/high');
  });

  it('keeps the root path intact', () => {
    const entries = buildSitemapEntries([{ ...base, path: '/' }]);
    expect(entries[0]?.path).toBe('/');
  });
});

describe('toNextSitemap', () => {
  it('produces absolute urls', () => {
    const entries = buildSitemapEntries([
      {
        path: '/',
        lastModified: '2026-01-01T00:00:00.000Z',
        isIndexable: true,
        includeInSitemap: true,
      },
      {
        path: '/about',
        lastModified: '2026-01-01T00:00:00.000Z',
        isIndexable: true,
        includeInSitemap: true,
      },
    ]);
    const next = toNextSitemap(entries, 'https://keytech.example/');
    expect(next.map((e) => e.url).sort()).toEqual([
      'https://keytech.example/',
      'https://keytech.example/about',
    ]);
  });
});

describe('renderImageSitemap', () => {
  it('escapes xml and includes only entries with images', () => {
    const xml = renderImageSitemap(
      [
        {
          path: '/portfolio/a',
          lastModified: '2026-01-01T00:00:00.000Z',
          changeFrequency: 'weekly',
          priority: 0.5,
          images: [{ url: 'https://keytech.example/i.png?a=1&b=2', title: 'A & B' }],
        },
        {
          path: '/no-images',
          lastModified: '2026-01-01T00:00:00.000Z',
          changeFrequency: 'weekly',
          priority: 0.5,
        },
      ],
      'https://keytech.example',
    );
    expect(xml).toContain('a=1&amp;b=2');
    expect(xml).toContain('A &amp; B');
    expect(xml).not.toContain('/no-images');
  });
});

describe('buildRobots', () => {
  it('always disallows admin, api and preview', () => {
    const robots = buildRobots({ siteUrl: 'https://keytech.example' });
    expect(robots.rules[0]?.disallow).toContain('/admin/');
    expect(robots.rules[0]?.disallow).toContain('/api/');
    expect(robots.rules[0]?.disallow).toContain('/preview/');
    expect(robots.sitemap).toBe('https://keytech.example/sitemap.xml');
  });

  it('blocks everything when asked', () => {
    const robots = buildRobots({ siteUrl: 'https://keytech.example', blockAll: true });
    expect(robots.rules[0]?.disallow).toEqual(['/']);
    expect(robots.rules[0]?.allow).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Editorial audit
// ---------------------------------------------------------------------------

const GOOD_ENTITY: AuditableEntity = {
  entityType: 'SERVICE',
  entityId: '11111111-1111-4111-8111-111111111111',
  label: 'SaaS Product Development',
  adminPath: '/offerings/services/11111111-1111-4111-8111-111111111111',
  publicPath: '/services/saas-product-development',
  isPublished: true,
  seoTitle: 'SaaS Product Development Services',
  seoDescription:
    'Key Tech Solutions designs, builds and maintains multi tenant SaaS products, from discovery through architecture to release.',
  canonicalUrl: 'https://keytech.example/services/saas-product-development',
  ogImageUrl: 'https://keytech.example/og.png',
  robotsIndex: true,
  includeInSitemap: true,
  h1: 'SaaS Product Development',
  images: [{ url: 'https://keytech.example/a.png', altText: 'Dashboard screenshot' }],
  slug: 'saas-product-development',
  brokenRelationIds: [],
  isOrphan: false,
};

describe('auditEntity', () => {
  it('reports no issues for a well configured page', () => {
    expect(auditEntity(GOOD_ENTITY)).toEqual([]);
  });

  it('flags a missing title, description and h1', () => {
    const codes = auditEntity({
      ...GOOD_ENTITY,
      seoTitle: null,
      seoDescription: null,
      h1: null,
    }).map((i) => i.code);
    expect(codes).toContain('missing-title');
    expect(codes).toContain('missing-description');
    expect(codes).toContain('missing-h1');
  });

  it('flags missing alt text', () => {
    const codes = auditEntity({
      ...GOOD_ENTITY,
      images: [{ url: 'x', altText: null }],
    }).map((i) => i.code);
    expect(codes).toContain('missing-alt-text');
  });

  it('flags a published page marked noindex', () => {
    const codes = auditEntity({ ...GOOD_ENTITY, robotsIndex: false }).map((i) => i.code);
    expect(codes).toContain('noindex-conflict');
  });

  it('flags an indexable page excluded from the sitemap', () => {
    const codes = auditEntity({ ...GOOD_ENTITY, includeInSitemap: false }).map((i) => i.code);
    expect(codes).toContain('sitemap-excluded');
  });

  it('flags a canonical pointing elsewhere', () => {
    const codes = auditEntity({ ...GOOD_ENTITY, canonicalUrl: 'https://other.example/x' }).map(
      (i) => i.code,
    );
    expect(codes).toContain('canonical-conflict');
  });

  it('flags broken related content and orphan pages', () => {
    const codes = auditEntity({ ...GOOD_ENTITY, brokenRelationIds: ['a'], isOrphan: true }).map(
      (i) => i.code,
    );
    expect(codes).toContain('broken-related-content');
    expect(codes).toContain('orphan-content');
  });

  it('flags duplicate slugs', () => {
    const codes = auditEntity(GOOD_ENTITY, new Set(['saas-product-development'])).map(
      (i) => i.code,
    );
    expect(codes).toContain('duplicate-slug');
  });
});

describe('auditAll', () => {
  it('scores a clean set at 100', () => {
    const summary = auditAll([GOOD_ENTITY]);
    expect(summary.editorialScore).toBe(100);
    expect(summary.issues).toEqual([]);
  });

  it('lowers the score as issues accumulate', () => {
    const summary = auditAll([
      { ...GOOD_ENTITY, seoTitle: null, seoDescription: null, h1: null, ogImageUrl: null },
    ]);
    expect(summary.editorialScore).toBeLessThan(60);
    expect(summary.issueCounts.error).toBe(3);
  });

  it('detects duplicate slugs across entities of the same type', () => {
    const summary = auditAll([
      GOOD_ENTITY,
      { ...GOOD_ENTITY, entityId: '22222222-2222-4222-8222-222222222222' },
    ]);
    expect(summary.issues.some((i) => i.code === 'duplicate-slug')).toBe(true);
  });

  it('never returns a negative score', () => {
    const broken: AuditableEntity = {
      ...GOOD_ENTITY,
      seoTitle: null,
      seoDescription: null,
      h1: null,
      ogImageUrl: null,
      robotsIndex: false,
      includeInSitemap: false,
      canonicalUrl: 'https://other.example/x',
      images: [{ url: 'x', altText: null }],
      brokenRelationIds: ['a', 'b'],
      isOrphan: true,
    };
    expect(auditAll([broken]).editorialScore).toBeGreaterThanOrEqual(0);
  });
});

describe('lengthIndicator', () => {
  it('reports empty, short, good and long states', () => {
    expect(lengthIndicator('', 'title').state).toBe('empty');
    expect(lengthIndicator('Short', 'title').state).toBe('short');
    expect(lengthIndicator('A perfectly reasonable SEO title here', 'title').state).toBe('good');
    expect(lengthIndicator('x'.repeat(120), 'title').state).toBe('long');
  });
});
