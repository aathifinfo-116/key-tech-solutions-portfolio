/**
 * Structured data generators.
 *
 * Rules enforced here:
 *  - Only fields backed by visible page content are emitted.
 *  - No ratings, reviews, prices, offers, awards or addresses are invented.
 *  - `undefined` values are pruned so no empty properties reach the page.
 */

import { EMPLOYMENT_TYPE_SCHEMA_ORG, type EmploymentType } from '@kts/shared-types';

export type JsonLd = Record<string, unknown>;

/** Recursively removes undefined, null and empty arrays/objects. */
export function prune<T>(value: T): T {
  if (Array.isArray(value)) {
    const cleaned = value.map(prune).filter((v) => v !== undefined && v !== null);
    return (cleaned.length > 0 ? cleaned : undefined) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => [k, prune(v)] as const)
      .filter(([, v]) => v !== undefined && v !== null && v !== '');
    return (entries.length > 0 ? Object.fromEntries(entries) : undefined) as unknown as T;
  }
  return value;
}

export interface OrganizationInput {
  siteUrl: string;
  name: string;
  legalName?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  email?: string | null;
  telephone?: string | null;
  sameAs?: string[];
}

export function organizationJsonLd(input: OrganizationInput): JsonLd {
  return prune({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${input.siteUrl}/#organization`,
    name: input.name,
    legalName: input.legalName ?? undefined,
    url: `${input.siteUrl}/`,
    description: input.description ?? undefined,
    logo: input.logoUrl ? { '@type': 'ImageObject', url: input.logoUrl } : undefined,
    email: input.email ?? undefined,
    telephone: input.telephone ?? undefined,
    sameAs: input.sameAs?.length ? input.sameAs : undefined,
  });
}

export function webSiteJsonLd(input: {
  siteUrl: string;
  name: string;
  description?: string | null;
}): JsonLd {
  return prune({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${input.siteUrl}/#website`,
    url: `${input.siteUrl}/`,
    name: input.name,
    description: input.description ?? undefined,
    publisher: { '@id': `${input.siteUrl}/#organization` },
    inLanguage: 'en',
  });
}

export type WebPageType =
  | 'WebPage'
  | 'AboutPage'
  | 'ContactPage'
  | 'CollectionPage'
  | 'ProfilePage';

export function webPageJsonLd(input: {
  siteUrl: string;
  url: string;
  name: string;
  description?: string | null;
  type?: WebPageType;
  datePublished?: string | null;
  dateModified?: string | null;
  primaryImageUrl?: string | null;
}): JsonLd {
  return prune({
    '@context': 'https://schema.org',
    '@type': input.type ?? 'WebPage',
    '@id': `${input.url}#webpage`,
    url: input.url,
    name: input.name,
    description: input.description ?? undefined,
    isPartOf: { '@id': `${input.siteUrl}/#website` },
    about: { '@id': `${input.siteUrl}/#organization` },
    datePublished: input.datePublished ?? undefined,
    dateModified: input.dateModified ?? undefined,
    primaryImageOfPage: input.primaryImageUrl
      ? { '@type': 'ImageObject', url: input.primaryImageUrl }
      : undefined,
    inLanguage: 'en',
  });
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>): JsonLd {
  return prune({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

export function serviceJsonLd(input: {
  siteUrl: string;
  url: string;
  name: string;
  description?: string | null;
  serviceType?: string | null;
  imageUrl?: string | null;
}): JsonLd {
  return prune({
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${input.url}#service`,
    name: input.name,
    description: input.description ?? undefined,
    serviceType: input.serviceType ?? undefined,
    url: input.url,
    image: input.imageUrl ?? undefined,
    provider: { '@id': `${input.siteUrl}/#organization` },
  });
}

/**
 * SoftwareApplication for Key Tech products.
 * No `offers` block is emitted: we have no published pricing to substantiate.
 */
export function softwareApplicationJsonLd(input: {
  siteUrl: string;
  url: string;
  name: string;
  description?: string | null;
  applicationCategory?: string | null;
  imageUrl?: string | null;
  screenshotUrls?: string[];
  operatingSystem?: string;
  softwareVersion?: string | null;
  releaseDate?: string | null;
}): JsonLd {
  return prune({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${input.url}#software`,
    name: input.name,
    description: input.description ?? undefined,
    applicationCategory: input.applicationCategory ?? 'BusinessApplication',
    operatingSystem: input.operatingSystem ?? 'Web browser',
    url: input.url,
    image: input.imageUrl ?? undefined,
    screenshot: input.screenshotUrls?.length ? input.screenshotUrls : undefined,
    softwareVersion: input.softwareVersion ?? undefined,
    datePublished: input.releaseDate ?? undefined,
    publisher: { '@id': `${input.siteUrl}/#organization` },
  });
}

export function articleJsonLd(input: {
  siteUrl: string;
  url: string;
  headline: string;
  description?: string | null;
  imageUrl?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
  authorUrl?: string | null;
  section?: string | null;
  keywords?: string[];
  type?: 'Article' | 'BlogPosting' | 'TechArticle' | 'NewsArticle';
}): JsonLd {
  return prune({
    '@context': 'https://schema.org',
    '@type': input.type ?? 'BlogPosting',
    '@id': `${input.url}#article`,
    headline: input.headline.slice(0, 110),
    description: input.description ?? undefined,
    image: input.imageUrl ? [input.imageUrl] : undefined,
    datePublished: input.datePublished ?? undefined,
    dateModified: input.dateModified ?? input.datePublished ?? undefined,
    author: input.authorName
      ? prune({ '@type': 'Person', name: input.authorName, url: input.authorUrl ?? undefined })
      : { '@id': `${input.siteUrl}/#organization` },
    publisher: { '@id': `${input.siteUrl}/#organization` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    articleSection: input.section ?? undefined,
    keywords: input.keywords?.length ? input.keywords.join(', ') : undefined,
    inLanguage: 'en',
  });
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>): JsonLd | null {
  if (items.length === 0) return null;
  return prune({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  });
}

export function jobPostingJsonLd(input: {
  siteUrl: string;
  url: string;
  title: string;
  description: string;
  datePosted?: string | null;
  validThrough?: string | null;
  employmentType: EmploymentType;
  location: string;
  isRemote: boolean;
  organizationName: string;
  department?: string | null;
}): JsonLd {
  return prune({
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    '@id': `${input.url}#jobposting`,
    title: input.title,
    description: input.description,
    datePosted: input.datePosted ?? undefined,
    validThrough: input.validThrough ?? undefined,
    employmentType: EMPLOYMENT_TYPE_SCHEMA_ORG[input.employmentType],
    hiringOrganization: {
      '@type': 'Organization',
      name: input.organizationName,
      sameAs: `${input.siteUrl}/`,
    },
    // `addressLocality` carries only what the editor typed; nothing is invented.
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: input.location },
    },
    jobLocationType: input.isRemote ? 'TELECOMMUTE' : undefined,
    applicantLocationRequirements: input.isRemote
      ? { '@type': 'Country', name: input.location }
      : undefined,
    department: input.department ?? undefined,
    directApply: true,
  });
}

export function imageObjectJsonLd(input: {
  url: string;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
}): JsonLd {
  return prune({
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: input.url,
    url: input.url,
    caption: input.caption ?? undefined,
    width: input.width ?? undefined,
    height: input.height ?? undefined,
  });
}

export function collectionPageJsonLd(input: {
  siteUrl: string;
  url: string;
  name: string;
  description?: string | null;
  items: Array<{ name: string; url: string }>;
}): JsonLd {
  return prune({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${input.url}#collection`,
    url: input.url,
    name: input.name,
    description: input.description ?? undefined,
    isPartOf: { '@id': `${input.siteUrl}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: input.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    },
  });
}

/**
 * Serialises JSON-LD for a `<script type="application/ld+json">` tag.
 * `<` is escaped so the payload can never terminate the script element early.
 */
export function serializeJsonLd(data: JsonLd | JsonLd[] | null): string {
  if (!data) return '';
  const payload = Array.isArray(data) ? data.filter(Boolean) : data;
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}
