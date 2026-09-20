import { describe, expect, it } from 'vitest';
import { isReservedSlug, isValidSlug, normalisePath, slugify, uniqueSlug } from './slug';
import {
  escapeHtml,
  estimateReadingMinutes,
  isSafeRedirectTarget,
  sanitizeRichText,
  stripHtml,
} from './sanitize';
import {
  buildStorageKey,
  buildVariantKey,
  extractExtensions,
  hasPathTraversal,
  isSafeStorageKey,
  matchesSignature,
  validateUpload,
} from './upload';
import {
  canTransition,
  isPubliclyVisible,
  publicVisibilityWhere,
  resolveStatusChange,
} from './publication';
import {
  buildSlugChangeRedirect,
  followChain,
  redirectHttpStatus,
  validateRedirect,
} from './redirects';
import { assessSpam, contactFormSchema, quoteRequestSchema } from './public-forms';
import { passwordSchema, passwordStrength } from './auth';
import { caseStudySchema, portfolioProjectSchema, testimonialSchema } from './content';

// ---------------------------------------------------------------------------
// Slugs
// ---------------------------------------------------------------------------

describe('slugify', () => {
  it('produces url safe slugs from product names', () => {
    expect(slugify('KeySportsBooking')).toBe('keysportsbooking');
    expect(slugify('Custom Web Application Development')).toBe(
      'custom-web-application-development',
    );
    expect(slugify('UI & UX Design')).toBe('ui-and-ux-design');
    expect(slugify('Node.js + PostgreSQL')).toBe('node-js-plus-postgresql');
  });

  it('folds diacritics and drops symbols', () => {
    expect(slugify('Café Renovación')).toBe('cafe-renovacion');
    expect(slugify('  ***Hello***  World!!  ')).toBe('hello-world');
  });

  it('collapses separators and trims edges', () => {
    expect(slugify('a---b   c')).toBe('a-b-c');
    expect(slugify('-leading-and-trailing-')).toBe('leading-and-trailing');
  });

  it('truncates on a word boundary', () => {
    const slug = slugify('enterprise resource planning implementation programme', 30);
    expect(slug.length).toBeLessThanOrEqual(30);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('isValidSlug', () => {
  it.each(['keyautoparts', 'booking-platform', 'a1-b2-c3'])('accepts %s', (slug) => {
    expect(isValidSlug(slug)).toBe(true);
  });

  it.each(['Bad Slug', 'double--dash', '-leading', 'trailing-', 'admin', 'api', ''])(
    'rejects %s',
    (slug) => {
      expect(isValidSlug(slug)).toBe(false);
    },
  );

  it('flags reserved words', () => {
    expect(isReservedSlug('admin')).toBe(true);
    expect(isReservedSlug('sitemap.xml')).toBe(true);
    expect(isReservedSlug('services')).toBe(false);
  });
});

describe('uniqueSlug', () => {
  it('returns the base slug when free', () => {
    expect(uniqueSlug('Key Auto Parts', [])).toBe('key-auto-parts');
  });

  it('appends an incrementing suffix on collision', () => {
    expect(uniqueSlug('Booking', ['booking'])).toBe('booking-2');
    expect(uniqueSlug('Booking', ['booking', 'booking-2', 'booking-3'])).toBe('booking-4');
  });

  it('avoids reserved slugs', () => {
    expect(uniqueSlug('admin', [])).toBe('admin-2');
  });

  it('respects the maximum length when suffixing', () => {
    const slug = uniqueSlug('aaaaaaaaaa', ['aaaaaaaaaa'], 10);
    expect(slug.length).toBeLessThanOrEqual(10);
  });
});

describe('normalisePath', () => {
  it('normalises leading, trailing and duplicate slashes', () => {
    expect(normalisePath('services')).toBe('/services');
    expect(normalisePath('/services/')).toBe('/services');
    expect(normalisePath('//services//web//')).toBe('/services/web');
    expect(normalisePath('/')).toBe('/');
  });
});

// ---------------------------------------------------------------------------
// Sanitisation
// ---------------------------------------------------------------------------

describe('sanitizeRichText', () => {
  it('removes script tags and their content', () => {
    const out = sanitizeRichText('<p>Safe</p><script>alert(document.cookie)</script>');
    expect(out).toBe('<p>Safe</p>');
    expect(out).not.toContain('alert');
  });

  it('strips inline event handlers', () => {
    const out = sanitizeRichText('<p onclick="steal()">Text</p>');
    expect(out).toBe('<p>Text</p>');
  });

  it('removes javascript: urls', () => {
    const out = sanitizeRichText('<a href="javascript:alert(1)">Click</a>');
    expect(out).not.toContain('javascript:');
  });

  it('keeps permitted formatting', () => {
    const out = sanitizeRichText(
      '<h2>Title</h2><p><strong>Bold</strong> and <em>italic</em></p><ul><li>One</li></ul>',
    );
    expect(out).toContain('<h2>Title</h2>');
    expect(out).toContain('<strong>Bold</strong>');
    expect(out).toContain('<li>One</li>');
  });

  it('demotes h1 so pages keep a single top-level heading', () => {
    expect(sanitizeRichText('<h1>Nope</h1>')).toBe('<h2>Nope</h2>');
  });

  it('adds rel and target to external links', () => {
    const out = sanitizeRichText('<a href="https://example.com">External</a>');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain('target="_blank"');
  });

  it('drops iframes unless embeds are explicitly allowed', () => {
    const html = '<iframe src="https://www.youtube.com/embed/abc"></iframe>';
    expect(sanitizeRichText(html)).toBe('');
    expect(sanitizeRichText(html, { allowEmbeds: true })).toContain('<iframe');
  });

  it('rejects iframes from unknown hosts even when embeds are allowed', () => {
    const out = sanitizeRichText('<iframe src="https://evil.example/embed"></iframe>', {
      allowEmbeds: true,
    });
    expect(out).toBe('');
  });

  it('never keeps style attributes', () => {
    expect(sanitizeRichText('<p style="position:fixed">x</p>')).toBe('<p>x</p>');
  });
});

describe('stripHtml and helpers', () => {
  it('reduces markup to plain text', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('escapes html entities', () => {
    expect(escapeHtml('<b>&"\'')).toBe('&lt;b&gt;&amp;&quot;&#39;');
  });

  it('estimates reading time with a floor of one minute', () => {
    expect(estimateReadingMinutes('<p>short</p>')).toBe(1);
    const long = `<p>${'word '.repeat(660)}</p>`;
    expect(estimateReadingMinutes(long)).toBe(3);
  });
});

describe('isSafeRedirectTarget', () => {
  it('allows same-origin paths', () => {
    expect(isSafeRedirectTarget('/services')).toBe(true);
    expect(isSafeRedirectTarget('/blog/post?page=2')).toBe(true);
  });

  it('blocks protocol relative and external urls by default', () => {
    expect(isSafeRedirectTarget('//evil.example')).toBe(false);
    expect(isSafeRedirectTarget('https://evil.example')).toBe(false);
    expect(isSafeRedirectTarget('javascript:alert(1)')).toBe(false);
  });

  it('allows explicitly listed hosts', () => {
    expect(isSafeRedirectTarget('https://docs.example.com/x', ['docs.example.com'])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Upload security
// ---------------------------------------------------------------------------

const PNG_HEAD = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0,
]);
const JPG_HEAD = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const PDF_HEAD = new Uint8Array([
  0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0, 0, 0, 0, 0, 0, 0, 0,
]);

describe('upload signature checks', () => {
  it('matches known signatures', () => {
    expect(matchesSignature(PNG_HEAD, 'image/png')).toBe(true);
    expect(matchesSignature(JPG_HEAD, 'image/jpeg')).toBe(true);
    expect(matchesSignature(PDF_HEAD, 'application/pdf')).toBe(true);
  });

  it('rejects a mismatched signature', () => {
    expect(matchesSignature(PNG_HEAD, 'image/jpeg')).toBe(false);
  });

  it('extracts every extension in a chain', () => {
    expect(extractExtensions('photo.jpg')).toEqual(['jpg']);
    expect(extractExtensions('shell.php.jpg')).toEqual(['php', 'jpg']);
    expect(extractExtensions('archive.tar.gz')).toEqual(['tar', 'gz']);
  });

  it('detects path traversal attempts', () => {
    expect(hasPathTraversal('../../etc/passwd')).toBe(true);
    expect(hasPathTraversal('C:\\windows\\system32')).toBe(true);
    expect(hasPathTraversal('normal-name.png')).toBe(false);
  });
});

describe('validateUpload', () => {
  const imageOpts = { category: 'image' as const, folder: 'products' };

  it('accepts a well formed png', () => {
    const result = validateUpload(
      {
        originalName: 'dashboard.png',
        declaredMimeType: 'image/png',
        sizeBytes: 200_000,
        head: PNG_HEAD,
      },
      imageOpts,
    );
    expect(result.ok).toBe(true);
    expect(result.resolved?.mimeType).toBe('image/png');
  });

  it('rejects an executable disguised with a double extension', () => {
    const result = validateUpload(
      {
        originalName: 'payload.php.jpg',
        declaredMimeType: 'image/jpeg',
        sizeBytes: 1000,
        head: JPG_HEAD,
      },
      imageOpts,
    );
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/Disallowed file type|more than one extension/);
  });

  it('rejects svg uploads outright', () => {
    const result = validateUpload(
      {
        originalName: 'logo.svg',
        declaredMimeType: 'image/svg+xml',
        sizeBytes: 1000,
        head: PNG_HEAD,
      },
      imageOpts,
    );
    expect(result.ok).toBe(false);
  });

  it('rejects a file whose bytes do not match its extension', () => {
    const result = validateUpload(
      { originalName: 'fake.png', declaredMimeType: 'image/png', sizeBytes: 1000, head: PDF_HEAD },
      imageOpts,
    );
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('File content does not match its extension.');
  });

  it('does not trust the browser content type', () => {
    const result = validateUpload(
      {
        originalName: 'script.png',
        declaredMimeType: 'text/html',
        sizeBytes: 1000,
        head: PNG_HEAD,
      },
      imageOpts,
    );
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Declared content type does not match the file extension.');
  });

  it('enforces the size limit', () => {
    const result = validateUpload(
      {
        originalName: 'huge.png',
        declaredMimeType: 'image/png',
        sizeBytes: 50_000_000,
        head: PNG_HEAD,
      },
      imageOpts,
    );
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('larger than');
  });

  it('rejects an unknown destination folder', () => {
    const result = validateUpload(
      { originalName: 'x.png', declaredMimeType: 'image/png', sizeBytes: 1000, head: PNG_HEAD },
      { category: 'image', folder: '../private' },
    );
    expect(result.ok).toBe(false);
  });

  it('accepts a pdf into a private folder but not a public image folder', () => {
    const good = validateUpload(
      {
        originalName: 'cv.pdf',
        declaredMimeType: 'application/pdf',
        sizeBytes: 100_000,
        head: PDF_HEAD,
      },
      { category: 'document', folder: 'careers' },
    );
    expect(good.ok).toBe(true);

    const bad = validateUpload(
      {
        originalName: 'cv.pdf',
        declaredMimeType: 'application/pdf',
        sizeBytes: 100_000,
        head: PDF_HEAD,
      },
      { category: 'document', folder: 'products' },
    );
    expect(bad.ok).toBe(false);
  });
});

describe('storage keys', () => {
  it('builds a uuid based key', () => {
    const key = buildStorageKey({
      visibility: 'public',
      folder: 'products',
      uuid: '0f9b5c40-6f5f-4a52-9d1e-1f6c1b2b3c4d',
      extension: 'png',
    });
    expect(key).toBe('public/products/0f9b5c40-6f5f-4a52-9d1e-1f6c1b2b3c4d.png');
    expect(isSafeStorageKey(key)).toBe(true);
  });

  it('rejects traversal in a storage key', () => {
    expect(isSafeStorageKey('../../etc/passwd')).toBe(false);
    expect(isSafeStorageKey('/public/products/x.png')).toBe(false);
    expect(isSafeStorageKey('public/products/not-a-uuid.png')).toBe(false);
    expect(
      isSafeStorageKey('public/../private/leads/0f9b5c40-6f5f-4a52-9d1e-1f6c1b2b3c4d.pdf'),
    ).toBe(false);
  });

  it('accepts generated variant keys', () => {
    const original = 'public/products/0f9b5c40-6f5f-4a52-9d1e-1f6c1b2b3c4d.png';
    const variant = buildVariantKey(original, 'thumbnail');
    expect(variant).toBe('public/products/0f9b5c40-6f5f-4a52-9d1e-1f6c1b2b3c4d-thumbnail.webp');
    expect(isSafeStorageKey(variant)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Publication workflow
// ---------------------------------------------------------------------------

describe('publication workflow', () => {
  const now = new Date('2026-06-01T12:00:00.000Z');

  it('allows the documented transitions', () => {
    expect(canTransition('DRAFT', 'REVIEW')).toBe(true);
    expect(canTransition('REVIEW', 'PUBLISHED')).toBe(true);
    expect(canTransition('PUBLISHED', 'ARCHIVED')).toBe(true);
    expect(canTransition('ARCHIVED', 'DRAFT')).toBe(true);
  });

  it('blocks resurrecting archived content straight to published', () => {
    expect(canTransition('ARCHIVED', 'PUBLISHED')).toBe(false);
    const result = resolveStatusChange({ currentStatus: 'ARCHIVED', nextStatus: 'PUBLISHED', now });
    expect(result.ok).toBe(false);
  });

  it('stamps publishedAt on first publish and preserves it afterwards', () => {
    const first = resolveStatusChange({ currentStatus: 'DRAFT', nextStatus: 'PUBLISHED', now });
    expect(first.patch?.publishedAt).toEqual(now);

    const original = new Date('2026-01-01T00:00:00.000Z');
    const second = resolveStatusChange({
      currentStatus: 'DRAFT',
      nextStatus: 'PUBLISHED',
      publishedAt: original,
      now,
    });
    expect(second.patch?.publishedAt).toEqual(original);
  });

  it('requires a future date when scheduling', () => {
    expect(resolveStatusChange({ currentStatus: 'DRAFT', nextStatus: 'SCHEDULED', now }).ok).toBe(
      false,
    );
    expect(
      resolveStatusChange({
        currentStatus: 'DRAFT',
        nextStatus: 'SCHEDULED',
        scheduledAt: '2026-05-01T00:00:00.000Z',
        now,
      }).ok,
    ).toBe(false);
    expect(
      resolveStatusChange({
        currentStatus: 'DRAFT',
        nextStatus: 'SCHEDULED',
        scheduledAt: '2026-07-01T00:00:00.000Z',
        now,
      }).ok,
    ).toBe(true);
  });

  it('sets archivedAt when archiving', () => {
    const result = resolveStatusChange({ currentStatus: 'PUBLISHED', nextStatus: 'ARCHIVED', now });
    expect(result.patch?.archivedAt).toEqual(now);
  });

  it('decides public visibility consistently', () => {
    expect(isPubliclyVisible({ status: 'DRAFT' }, now)).toBe(false);
    expect(isPubliclyVisible({ status: 'REVIEW' }, now)).toBe(false);
    expect(
      isPubliclyVisible({ status: 'PUBLISHED', publishedAt: '2026-01-01T00:00:00.000Z' }, now),
    ).toBe(true);
    expect(
      isPubliclyVisible({ status: 'PUBLISHED', publishedAt: '2027-01-01T00:00:00.000Z' }, now),
    ).toBe(false);
    expect(
      isPubliclyVisible({ status: 'SCHEDULED', scheduledAt: '2026-01-01T00:00:00.000Z' }, now),
    ).toBe(true);
    expect(
      isPubliclyVisible({ status: 'SCHEDULED', scheduledAt: '2027-01-01T00:00:00.000Z' }, now),
    ).toBe(false);
  });

  it('never shows archived content even when published', () => {
    expect(
      isPubliclyVisible(
        {
          status: 'PUBLISHED',
          publishedAt: '2026-01-01T00:00:00.000Z',
          archivedAt: '2026-02-01T00:00:00.000Z',
        },
        now,
      ),
    ).toBe(false);
  });

  it('produces a where clause matching the visibility rule', () => {
    const where = publicVisibilityWhere(now);
    expect(where.archivedAt).toBeNull();
    expect(where.OR).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Redirects
// ---------------------------------------------------------------------------

describe('redirect rules', () => {
  const existing = [
    {
      source: '/old-services',
      destination: '/services',
      status: 'PERMANENT_301' as const,
      isActive: true,
    },
  ];

  it('maps enum values to http status codes', () => {
    expect(redirectHttpStatus('PERMANENT_301')).toBe(301);
    expect(redirectHttpStatus('FOUND_302')).toBe(302);
    expect(redirectHttpStatus('TEMPORARY_307')).toBe(307);
    expect(redirectHttpStatus('PERMANENT_308')).toBe(308);
    expect(redirectHttpStatus('GONE_410')).toBe(410);
  });

  it('accepts a simple internal redirect', () => {
    const result = validateRedirect(
      { source: '/legacy/about', destination: '/about', status: 'PERMANENT_301' },
      { existing },
    );
    expect(result.ok).toBe(true);
    expect(result.normalised).toEqual({ source: '/legacy/about', destination: '/about' });
  });

  it('rejects a self redirect', () => {
    const result = validateRedirect(
      { source: '/about', destination: '/about', status: 'PERMANENT_301' },
      { existing },
    );
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('loop');
  });

  it('rejects a duplicate source', () => {
    const result = validateRedirect(
      { source: '/old-services', destination: '/products', status: 'PERMANENT_301' },
      { existing },
    );
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('already exists');
  });

  it('rejects protected prefixes', () => {
    expect(
      validateRedirect(
        { source: '/admin/users', destination: '/', status: 'PERMANENT_301' },
        { existing },
      ).ok,
    ).toBe(false);
    expect(
      validateRedirect(
        { source: '/x', destination: '/api/v1/public', status: 'PERMANENT_301' },
        { existing },
      ).ok,
    ).toBe(false);
  });

  it('rejects an external destination that is not allow-listed', () => {
    expect(
      validateRedirect(
        { source: '/x', destination: 'https://evil.example', status: 'FOUND_302' },
        { existing },
      ).ok,
    ).toBe(false);
    expect(
      validateRedirect(
        { source: '/x', destination: 'https://docs.example.com', status: 'FOUND_302' },
        { existing, allowedExternalHosts: ['docs.example.com'] },
      ).ok,
    ).toBe(true);
  });

  it('detects a two-hop loop', () => {
    const rules = [
      { source: '/a', destination: '/b', status: 'PERMANENT_301' as const, isActive: true },
      { source: '/b', destination: '/a', status: 'PERMANENT_301' as const, isActive: true },
    ];
    expect(followChain('/a', rules).loop).toBe(true);
  });

  it('rejects a redirect that would exceed the maximum chain length', () => {
    const chainRules = [
      { source: '/a', destination: '/b', status: 'PERMANENT_301' as const, isActive: true },
      { source: '/b', destination: '/c', status: 'PERMANENT_301' as const, isActive: true },
      { source: '/c', destination: '/d', status: 'PERMANENT_301' as const, isActive: true },
    ];
    const result = validateRedirect(
      { source: '/start', destination: '/a', status: 'PERMANENT_301' },
      { existing: chainRules },
    );
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('chain');
  });

  it('allows a 410 with no destination', () => {
    const result = validateRedirect(
      { source: '/removed', destination: '', status: 'GONE_410' },
      { existing },
    );
    expect(result.ok).toBe(true);
  });

  it('builds the redirect proposed after a slug change', () => {
    expect(
      buildSlugChangeRedirect({
        basePath: '/services',
        oldSlug: 'web-dev',
        newSlug: 'web-development',
      }),
    ).toEqual({
      source: '/services/web-dev',
      destination: '/services/web-development',
      status: 'PERMANENT_301',
      reason: 'Slug changed from "web-dev" to "web-development".',
    });
  });
});

// ---------------------------------------------------------------------------
// Public forms
// ---------------------------------------------------------------------------

describe('contact form validation', () => {
  const valid = {
    name: 'Alex Fernando',
    email: 'Alex@Example.com',
    subject: 'New booking platform',
    message: 'We would like to discuss a booking platform for our venues.',
    consent: true,
  };

  it('accepts a complete submission and lowercases the email', () => {
    const parsed = contactFormSchema.parse(valid);
    expect(parsed.email).toBe('alex@example.com');
  });

  it('requires consent', () => {
    expect(contactFormSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });

  it('requires a substantial message', () => {
    expect(contactFormSchema.safeParse({ ...valid, message: 'hi' }).success).toBe(false);
  });

  it('rejects a filled honeypot', () => {
    expect(contactFormSchema.safeParse({ ...valid, website: 'http://spam' }).success).toBe(false);
  });

  it('rejects an invalid email', () => {
    expect(contactFormSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });
});

describe('quote request validation', () => {
  it('rejects an unknown project type', () => {
    const result = quoteRequestSchema.safeParse({
      organization: 'Acme',
      name: 'Sam',
      email: 'sam@example.com',
      projectType: 'Teleportation',
      businessChallenge: 'x'.repeat(40),
      consent: true,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid request', () => {
    const result = quoteRequestSchema.safeParse({
      organization: 'Acme',
      name: 'Sam',
      email: 'sam@example.com',
      projectType: 'SaaS product',
      businessChallenge: 'We need a multi tenant booking product for our venues network.',
      consent: true,
    });
    expect(result.success).toBe(true);
  });
});

describe('assessSpam', () => {
  it('scores a clean message as not spam', () => {
    const result = assessSpam({
      message: 'We would like a quote for a customer portal.',
      elapsedMs: 40_000,
    });
    expect(result.isSpam).toBe(false);
    expect(result.score).toBe(0);
  });

  it('flags a filled honeypot', () => {
    const result = assessSpam({ message: 'hello', honeypot: 'bot' });
    expect(result.isSpam).toBe(true);
    expect(result.reasons).toContain('honeypot-filled');
  });

  it('penalises instant submissions and link farms', () => {
    const result = assessSpam({
      message: 'buy backlinks https://a.com https://b.com https://c.com https://d.com',
      elapsedMs: 200,
    });
    expect(result.score).toBeGreaterThan(0.5);
  });

  it('never exceeds a score of 1', () => {
    const result = assessSpam({
      message: 'CASINO VIAGRA https://a https://b https://c https://d BUY BACKLINKS',
      honeypot: 'x',
      elapsedMs: 10,
    });
    expect(result.score).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

describe('password policy', () => {
  it.each(['short', 'alllowercase123!', 'NOLOWERCASE123!', 'NoDigitsHere!!', 'NoSymbols12345'])(
    'rejects %s',
    (candidate) => {
      expect(passwordSchema.safeParse(candidate).success).toBe(false);
    },
  );

  it('accepts a strong password', () => {
    expect(passwordSchema.safeParse('Correct-Horse-9-Battery').success).toBe(true);
  });

  it('scores strength', () => {
    expect(passwordStrength('short').score).toBeLessThan(2);
    expect(passwordStrength('Correct-Horse-9-Battery').score).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Content guard rails against unsupported claims
// ---------------------------------------------------------------------------

describe('content integrity rules', () => {
  const baseProject = {
    slug: 'venue-booking-platform',
    title: 'Venue booking platform',
    summary: 'A booking platform built for multi venue operators.',
  };

  it('forbids naming the customer on a confidential project', () => {
    const result = portfolioProjectSchema.safeParse({
      ...baseProject,
      isCustomerConfidential: true,
      customerDisplayName: 'Acme Sports',
    });
    expect(result.success).toBe(false);
  });

  it('allows a confidential project with no customer name', () => {
    expect(
      portfolioProjectSchema.safeParse({ ...baseProject, isCustomerConfidential: true }).success,
    ).toBe(true);
  });

  it('requires approval before a customer can be named on a case study', () => {
    const result = caseStudySchema.safeParse({
      slug: 'venue-booking',
      title: 'Venue booking',
      summary: 'Summary of the engagement.',
      approvedCustomerName: 'Acme Sports',
      isCustomerApproved: false,
    });
    expect(result.success).toBe(false);
  });

  it('requires a source note on a verified metric', () => {
    const result = caseStudySchema.safeParse({
      slug: 'venue-booking',
      title: 'Venue booking',
      summary: 'Summary of the engagement.',
      metrics: [{ label: 'Bookings processed', value: '1200', isVerified: true }],
    });
    expect(result.success).toBe(false);
  });

  it('blocks publishing an unapproved testimonial', () => {
    const result = testimonialSchema.safeParse({
      quote: 'Great work.',
      authorName: 'Someone',
      isApproved: false,
      status: 'PUBLISHED',
    });
    expect(result.success).toBe(false);
  });
});
