/**
 * Sitemap assembly.
 *
 * The API returns raw entries; this module normalises, de-duplicates and
 * filters them so unpublished, noindex or excluded content can never leak in.
 */

import type { SitemapEntryDto, SitemapFrequency } from '@kts/shared-types';

export interface SitemapSourceEntry {
  path: string;
  lastModified: string | Date;
  changeFrequency?: SitemapFrequency;
  priority?: number;
  isIndexable: boolean;
  includeInSitemap: boolean;
  images?: Array<{ url: string; title?: string }>;
}

export interface NextSitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

function normalisePath(path: string): string {
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  if (withSlash === '/') return '/';
  return withSlash.replace(/\/+$/, '').replace(/\/{2,}/g, '/');
}

/**
 * Filters and de-duplicates source entries. An entry survives only when it is
 * indexable *and* flagged for sitemap inclusion.
 */
export function buildSitemapEntries(sources: SitemapSourceEntry[]): SitemapEntryDto[] {
  const seen = new Set<string>();
  const result: SitemapEntryDto[] = [];

  for (const source of sources) {
    if (!source.isIndexable || !source.includeInSitemap) continue;
    const path = normalisePath(source.path);
    if (seen.has(path)) continue;
    seen.add(path);

    const lastModified =
      source.lastModified instanceof Date ? source.lastModified : new Date(source.lastModified);

    result.push({
      path,
      lastModified: (Number.isNaN(lastModified.getTime())
        ? new Date()
        : lastModified
      ).toISOString(),
      changeFrequency: (
        source.changeFrequency ?? 'WEEKLY'
      ).toLowerCase() as SitemapEntryDto['changeFrequency'],
      priority: clampPriority(source.priority),
      images: source.images?.length ? source.images : undefined,
    });
  }

  // Highest priority first, then most recently modified.
  return result.sort(
    (a, b) => b.priority - a.priority || Date.parse(b.lastModified) - Date.parse(a.lastModified),
  );
}

function clampPriority(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0.5;
  return Math.min(1, Math.max(0, Math.round(value * 10) / 10));
}

/** Converts entries into the shape Next.js `sitemap.ts` expects. */
export function toNextSitemap(entries: SitemapEntryDto[], siteUrl: string): NextSitemapEntry[] {
  const base = siteUrl.replace(/\/+$/, '');
  return entries.map((entry) => ({
    url: entry.path === '/' ? `${base}/` : `${base}${entry.path}`,
    lastModified: new Date(entry.lastModified),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}

/** Renders an image sitemap XML document. */
export function renderImageSitemap(entries: SitemapEntryDto[], siteUrl: string): string {
  const base = siteUrl.replace(/\/+$/, '');
  const withImages = entries.filter((entry) => entry.images && entry.images.length > 0);

  const urls = withImages
    .map((entry) => {
      const images = (entry.images ?? [])
        .map(
          (image) =>
            `    <image:image>\n      <image:loc>${escapeXml(image.url)}</image:loc>${
              image.title ? `\n      <image:title>${escapeXml(image.title)}</image:title>` : ''
            }\n    </image:image>`,
        )
        .join('\n');
      return `  <url>\n    <loc>${escapeXml(`${base}${entry.path === '/' ? '/' : entry.path}`)}</loc>\n${images}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface RobotsConfig {
  siteUrl: string;
  /** Disallow everything - used for staging or preview deployments. */
  blockAll?: boolean;
}

/** Robots rules. The admin panel, API and preview routes are always excluded. */
export function buildRobots(config: RobotsConfig): {
  rules: Array<{ userAgent: string; allow?: string[]; disallow?: string[] }>;
  sitemap: string;
  host: string;
} {
  const base = config.siteUrl.replace(/\/+$/, '');
  if (config.blockAll) {
    return {
      rules: [{ userAgent: '*', disallow: ['/'] }],
      sitemap: `${base}/sitemap.xml`,
      host: base,
    };
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/api/', '/admin/', '/preview/', '/search', '/*?page=', '/_next/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
