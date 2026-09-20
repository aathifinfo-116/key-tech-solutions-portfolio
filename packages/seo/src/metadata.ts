/**
 * Metadata builders.
 *
 * Every public route funnels through `buildMetadata`, so title, description,
 * canonical, robots, Open Graph and Twitter tags are produced by one rule set
 * rather than page-by-page guesses.
 */

import type { SeoMetadataDto } from '@kts/shared-types';

export interface RobotsDirective {
  index: boolean;
  follow: boolean;
  googleBot?: {
    index: boolean;
    follow: boolean;
    'max-image-preview'?: string;
    'max-snippet'?: number;
  };
}

export interface OpenGraphImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

/** Structurally compatible with Next.js `Metadata`. */
export interface PageMetadata {
  title: string;
  description?: string;
  keywords?: string[];
  alternates?: { canonical?: string };
  robots?: RobotsDirective;
  openGraph?: {
    type: 'website' | 'article' | 'profile';
    siteName: string;
    title: string;
    description?: string;
    url: string;
    locale: string;
    images?: OpenGraphImage[];
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
  };
  twitter?: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description?: string;
    images?: string[];
  };
  other?: Record<string, string>;
}

export interface SeoContext {
  siteUrl: string;
  siteName: string;
  defaultOgImage?: string;
  locale?: string;
  titleTemplate?: string;
}

export interface BuildMetadataInput {
  /** Path relative to the site root, e.g. `/services/saas-product-development`. */
  path: string;
  /** Fallback title used when the editor has not supplied an SEO title. */
  title: string;
  description?: string | null;
  /** Editor-managed overrides from the database. */
  seo?: SeoMetadataDto | null;
  image?: { url: string; width?: number; height?: number; alt?: string } | null;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string | null;
  modifiedTime?: string | null;
  authors?: string[];
  /** Force noindex regardless of stored SEO - used by preview and search pages. */
  forceNoIndex?: boolean;
  /** Suppresses the site-name suffix (the homepage supplies its own full title). */
  omitTitleTemplate?: boolean;
}

export function absoluteUrl(siteUrl: string, path: string): string {
  const base = siteUrl.replace(/\/+$/, '');
  if (!path || path === '/') return `${base}/`;
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalised.replace(/\/+$/, '')}`;
}

/** Trims a description to a sentence boundary under the given limit. */
export function clampDescription(value: string | null | undefined, max = 158): string | undefined {
  if (!value) return undefined;
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const lastStop = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? '),
  );
  if (lastStop > max * 0.5) return slice.slice(0, lastStop + 1).trim();
  const lastSpace = slice.lastIndexOf(' ');
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : max).trim()}...`;
}

export function buildMetadata(context: SeoContext, input: BuildMetadataInput): PageMetadata {
  const locale = context.locale ?? 'en_US';
  const seo = input.seo ?? null;

  const rawTitle = seo?.title?.trim() || input.title;
  const title =
    input.omitTitleTemplate || rawTitle.includes(context.siteName)
      ? rawTitle
      : (context.titleTemplate ?? `%s | ${context.siteName}`).replace('%s', rawTitle);

  const description = clampDescription(seo?.description ?? input.description ?? undefined);
  const url = absoluteUrl(context.siteUrl, input.path);
  const canonical = seo?.canonicalUrl?.trim() || url;

  const index = input.forceNoIndex ? false : (seo?.robotsIndex ?? true);
  const follow = input.forceNoIndex ? false : (seo?.robotsFollow ?? true);

  const ogImageUrl =
    seo?.ogImage?.variants?.openGraph ??
    seo?.ogImage?.url ??
    input.image?.url ??
    context.defaultOgImage;
  const images: OpenGraphImage[] = ogImageUrl
    ? [
        {
          url: ogImageUrl,
          width: input.image?.width ?? 1200,
          height: input.image?.height ?? 630,
          alt: seo?.ogImage?.altText ?? input.image?.alt ?? rawTitle,
        },
      ]
    : [];

  return {
    title,
    description,
    keywords: seo?.keywords?.length ? seo.keywords : undefined,
    alternates: { canonical },
    robots: {
      index,
      follow,
      googleBot: { index, follow, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    openGraph: {
      type: input.type ?? 'website',
      siteName: context.siteName,
      title: seo?.ogTitle?.trim() || rawTitle,
      description: clampDescription(seo?.ogDescription ?? description, 200),
      url: canonical,
      locale,
      // Omitted rather than empty: an empty array would override the
      // framework's file-convention Open Graph image, leaving shares with no
      // picture at all.
      ...(images.length > 0 ? { images } : {}),
      publishedTime: input.publishedTime ?? undefined,
      modifiedTime: input.modifiedTime ?? undefined,
      authors: input.authors?.length ? input.authors : undefined,
    },
    twitter: {
      card: (seo?.twitterCard as 'summary' | 'summary_large_image') ?? 'summary_large_image',
      title: seo?.ogTitle?.trim() || rawTitle,
      description: clampDescription(seo?.ogDescription ?? description, 200),
      ...(images.length > 0 ? { images: images.map((i) => i.url) } : {}),
    },
  };
}

/** Metadata for routes that must never be indexed (admin, preview, search). */
export function noIndexMetadata(title: string): PageMetadata {
  return {
    title,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/** Builds the breadcrumb trail for a nested route, always rooted at Home. */
export function buildBreadcrumbs(segments: BreadcrumbItem[]): BreadcrumbItem[] {
  return [{ name: 'Home', path: '/' }, ...segments];
}

export interface PaginationMetaInput {
  page: number;
  totalPages: number;
  basePath: string;
  siteUrl: string;
}

/**
 * Canonical and prev/next handling for paginated listings.
 * Page 1 canonicalises to the bare path; deeper pages canonicalise to themselves
 * so their unique content is still indexable.
 */
export function buildPaginationMeta(input: PaginationMetaInput): {
  canonical: string;
  prev?: string;
  next?: string;
  noIndex: boolean;
} {
  const { page, totalPages, basePath, siteUrl } = input;
  const pageUrl = (n: number) => absoluteUrl(siteUrl, n <= 1 ? basePath : `${basePath}?page=${n}`);
  return {
    canonical: pageUrl(page),
    prev: page > 1 ? pageUrl(page - 1) : undefined,
    next: page < totalPages ? pageUrl(page + 1) : undefined,
    // Pages beyond the end of the list have no content worth indexing.
    noIndex: totalPages > 0 && page > totalPages,
  };
}
