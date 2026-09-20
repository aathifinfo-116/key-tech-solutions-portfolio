/** Slug generation and validation. Slugs are the public URL identity of content. */

const RESERVED_SLUGS = new Set([
  'api',
  'admin',
  'preview',
  'sitemap',
  'sitemap.xml',
  'robots',
  'robots.txt',
  'search',
  '_next',
  'static',
  'null',
  'undefined',
  'new',
  'edit',
  'create',
]);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_SLUG_LENGTH = 96;

/**
 * Converts arbitrary text into a human readable, URL safe slug.
 * Diacritics are folded, symbols dropped, runs of separators collapsed.
 */
export function slugify(input: string, maxLength: number = MAX_SLUG_LENGTH): string {
  const normalised = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[''`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  if (normalised.length <= maxLength) return normalised;
  // Trim on a word boundary so the slug stays readable.
  const clipped = normalised.slice(0, maxLength);
  const lastDash = clipped.lastIndexOf('-');
  return (lastDash > maxLength * 0.6 ? clipped.slice(0, lastDash) : clipped).replace(/-+$/, '');
}

export function isValidSlug(slug: string): boolean {
  return (
    slug.length > 0 &&
    slug.length <= MAX_SLUG_LENGTH &&
    SLUG_PATTERN.test(slug) &&
    !RESERVED_SLUGS.has(slug)
  );
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/**
 * Returns a slug that does not collide with `taken`, appending -2, -3, ...
 * The suffix is applied without exceeding the maximum slug length.
 */
export function uniqueSlug(
  desired: string,
  taken: Iterable<string>,
  maxLength = MAX_SLUG_LENGTH,
): string {
  const existing = new Set(taken);
  const base = slugify(desired, maxLength);
  if (base && !existing.has(base) && !isReservedSlug(base)) return base;

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const tail = `-${suffix}`;
    const trimmed = base.slice(0, Math.max(1, maxLength - tail.length)).replace(/-+$/, '');
    const candidate = `${trimmed}${tail}`;
    if (!existing.has(candidate)) return candidate;
  }
  return `${base.slice(0, maxLength - 14)}-${Date.now().toString(36)}`;
}

/** Normalises a URL path: leading slash, no trailing slash, no duplicate slashes. */
export function normalisePath(path: string): string {
  const withLeading = path.startsWith('/') ? path : `/${path}`;
  const collapsed = withLeading.replace(/\/{2,}/g, '/');
  if (collapsed === '/') return '/';
  return collapsed.replace(/\/+$/, '');
}
