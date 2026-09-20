/**
 * Prisma entity -> DTO mappers.
 *
 * Nothing reaches a client except through one of these functions, so internal
 * columns (password hashes, spam scores on public responses, private storage
 * keys, applicant IP addresses) cannot leak by accident.
 */

import type { MediaAsset, DocumentAsset, SeoMetadata, Prisma } from '@prisma/client';
import type {
  CtaDto,
  DocumentAssetDto,
  FaqDto,
  FeatureDto,
  MediaAssetDto,
  MediaVariantSet,
  SeoMetadataDto,
} from '@kts/shared-types';

export interface MediaUrlResolver {
  publicUrl(storageKey: string): string;
}

type MediaWithVariants = MediaAsset;

export function mapMedia(
  media: MediaWithVariants | null | undefined,
  resolver: MediaUrlResolver,
): MediaAssetDto | null {
  if (!media || media.archivedAt) return null;
  // Private assets never get a direct URL; callers must request a signed link.
  if (media.visibility !== 'PUBLIC') return null;

  const original = resolver.publicUrl(media.storageKey);
  const stored = (media.variants ?? {}) as Record<string, string | undefined>;

  const variants: MediaVariantSet = {
    original,
    thumbnail: stored.thumbnail ? resolver.publicUrl(stored.thumbnail) : undefined,
    card: stored.card ? resolver.publicUrl(stored.card) : undefined,
    hero: stored.hero ? resolver.publicUrl(stored.hero) : undefined,
    openGraph: stored.openGraph ? resolver.publicUrl(stored.openGraph) : undefined,
  };

  return {
    id: media.id,
    url: variants.card ?? original,
    kind: media.kind,
    visibility: media.visibility,
    mimeType: media.mimeType,
    extension: media.extension,
    sizeBytes: media.sizeBytes,
    width: media.width,
    height: media.height,
    aspectRatio: media.aspectRatio,
    altText: media.altText,
    caption: media.caption,
    blurDataUrl: media.blurDataUrl,
    focalPoint: { x: media.focalX, y: media.focalY },
    originalName: media.originalName,
    folder: media.folder,
    variants,
    createdAt: media.createdAt.toISOString(),
    updatedAt: media.updatedAt.toISOString(),
  };
}

export function mapMediaList(
  items: Array<MediaWithVariants | null | undefined>,
  resolver: MediaUrlResolver,
): MediaAssetDto[] {
  return items
    .map((item) => mapMedia(item, resolver))
    .filter((item): item is MediaAssetDto => item !== null);
}

/**
 * Private documents expose metadata only. `url` stays null; a caller with the
 * right permission requests a short-lived signed link separately.
 */
export function mapDocument(document: DocumentAsset | null | undefined): DocumentAssetDto | null {
  if (!document || document.archivedAt) return null;
  return {
    id: document.id,
    title: document.title,
    description: document.description,
    originalName: document.originalName,
    mimeType: document.mimeType,
    extension: document.extension,
    sizeBytes: document.sizeBytes,
    kind: document.kind,
    visibility: document.visibility,
    url: null,
    createdAt: document.createdAt.toISOString(),
  };
}

export function mapDocuments(items: Array<DocumentAsset | null | undefined>): DocumentAssetDto[] {
  return items.map(mapDocument).filter((item): item is DocumentAssetDto => item !== null);
}

export function mapSeo(
  seo: (SeoMetadata & { ogImage?: MediaAsset | null }) | null | undefined,
  resolver: MediaUrlResolver,
): SeoMetadataDto | null {
  if (!seo) return null;
  return {
    title: seo.title,
    description: seo.description,
    canonicalUrl: seo.canonicalUrl,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    ogImage: mapMedia(seo.ogImage, resolver),
    twitterCard: seo.twitterCard,
    keywords: seo.keywords,
    robotsIndex: seo.robotsIndex,
    robotsFollow: seo.robotsFollow,
    includeInSitemap: seo.includeInSitemap,
    sitemapPriority: seo.sitemapPriority,
    sitemapFrequency: seo.sitemapFrequency,
  };
}

export function mapFaqs(
  faqs: Array<{ id: string; question: string; answer: string; isActive?: boolean }> | undefined,
): FaqDto[] {
  return (faqs ?? [])
    .filter((faq) => faq.isActive !== false)
    .map((faq) => ({ id: faq.id, question: faq.question, answer: faq.answer }));
}

export function mapFeatures(
  features:
    | Array<{ id: string; title: string; description: string | null; iconName: string | null }>
    | undefined,
): FeatureDto[] {
  return (features ?? []).map((feature) => ({
    id: feature.id,
    title: feature.title,
    description: feature.description,
    iconName: feature.iconName,
  }));
}

export function mapCta(label: string | null, href: string | null): CtaDto | null {
  if (!label || !href) return null;
  return { label, href };
}

export function isoOrNull(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

/** Reads the workflow-step JSON column defensively; bad data yields []. */
export function mapWorkflowSteps(
  value: Prisma.JsonValue | null,
): Array<{ title: string; description?: string }> {
  if (!Array.isArray(value)) return [];
  const steps: Array<{ title: string; description?: string }> = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const item = entry as Record<string, unknown>;
    const title = typeof item.title === 'string' ? item.title : '';
    if (!title) continue;
    steps.push({
      title,
      description: typeof item.description === 'string' ? item.description : undefined,
    });
  }
  return steps;
}

/** Narrows an untyped JSON column into a plain record. */
export function asRecord(
  value: Prisma.JsonValue | null | undefined,
): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
