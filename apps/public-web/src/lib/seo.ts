/**
 * SEO helpers bound to this deployment.
 *
 * Wraps @kts/seo with the site URL and name so route files stay short and no
 * page can accidentally use a different canonical origin.
 */

import type { Metadata } from 'next';
import {
  absoluteUrl,
  breadcrumbJsonLd,
  buildBreadcrumbs,
  buildMetadata,
  noIndexMetadata,
  organizationJsonLd,
  serializeJsonLd,
  webSiteJsonLd,
  type BuildMetadataInput,
  type JsonLd,
  type SeoContext,
} from '@kts/seo';
import type { BrandDto, SocialLinkDto } from '@kts/shared-types';
import { SITE_NAME, SITE_URL } from './api';

export const seoContext: SeoContext = {
  siteUrl: SITE_URL,
  siteName: SITE_NAME,
  defaultOgImage: undefined,
  locale: 'en_US',
  titleTemplate: `%s | ${SITE_NAME}`,
};

/**
 * Builds Next.js `Metadata` from an entity's stored SEO settings.
 *
 * The title is marked `absolute` because `buildMetadata` has already applied
 * the site-name suffix itself (and knows when to skip it, for a title that
 * already names the company). Without `absolute`, the root layout's title
 * template would append the company name a second time.
 */
export function pageMetadata(input: BuildMetadataInput): Metadata {
  const { title, ...rest } = buildMetadata(seoContext, input);
  return { ...rest, title: { absolute: title } } as Metadata;
}

export function noIndex(title: string): Metadata {
  return noIndexMetadata(title) as Metadata;
}

export function url(path: string): string {
  return absoluteUrl(SITE_URL, path);
}

/** Breadcrumb trail plus the matching BreadcrumbList structured data. */
export function breadcrumbs(segments: Array<{ name: string; path: string }>) {
  const trail = buildBreadcrumbs(segments);
  return {
    trail,
    jsonLd: breadcrumbJsonLd(trail.map((item) => ({ name: item.name, url: url(item.path) }))),
  };
}

/** Organization and WebSite nodes, emitted once from the root layout. */
export function siteJsonLd(brand: BrandDto, socialLinks: SocialLinkDto[]): JsonLd[] {
  return [
    organizationJsonLd({
      siteUrl: SITE_URL,
      name: brand.companyName,
      legalName: brand.legalName,
      description: brand.description,
      logoUrl: brand.logoLight?.variants.original ?? null,
      email: brand.contactEmail,
      telephone: brand.contactPhone,
      sameAs: socialLinks.map((link) => link.url),
    }),
    webSiteJsonLd({ siteUrl: SITE_URL, name: brand.companyName, description: brand.description }),
  ];
}

export { serializeJsonLd, SITE_URL, SITE_NAME };
export type { JsonLd };
