/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ContentEntityType } from '@prisma/client';
import { sanitizeRichText } from '@kts/validation';
import type { PrismaService } from '../../common/prisma/prisma.service';

/** Prisma relation payload that replaces a many-to-many set wholesale. */
export function relationSet(ids: string[] | undefined): { set: Array<{ id: string }> } | undefined {
  if (!ids) return undefined;
  return { set: ids.map((id) => ({ id })) };
}

export function relationConnect(
  ids: string[] | undefined,
): { connect: Array<{ id: string }> } | undefined {
  if (!ids || ids.length === 0) return undefined;
  return { connect: ids.map((id) => ({ id })) };
}

/** Optional one-to-one connect/disconnect, driven by a nullable id. */
export function optionalConnect(id: string | null | undefined) {
  if (id === undefined) return undefined;
  return id === null ? { disconnect: true } : { connect: { id } };
}

/** Replaces a child collection (features, FAQs, screenshots) in one write. */
export function replaceChildren<T extends Record<string, unknown>>(
  items: T[] | undefined,
  mapItem: (item: T, index: number) => Record<string, unknown>,
) {
  if (!items) return undefined;
  return { deleteMany: {}, create: items.map(mapItem) };
}

/** Sanitises every rich-text field on an input object, in place. */
export function sanitiseRichFields<T extends Record<string, any>>(
  input: T,
  fields: Array<keyof T>,
  options: { allowEmbeds?: boolean } = {},
): T {
  const output = { ...input };
  for (const field of fields) {
    const value = output[field];
    if (typeof value === 'string') {
      (output as Record<string, unknown>)[field as string] = sanitizeRichText(value, options);
    }
  }
  return output;
}

export function toDateOrNull(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Builds the Prisma `seo` nested write from validated SEO input. */
export function seoNestedWrite(
  seo: Record<string, any> | undefined,
  existingSeoId?: string | null,
) {
  if (!seo) return undefined;

  const data = {
    title: seo.title ?? null,
    description: seo.description ?? null,
    canonicalUrl: seo.canonicalUrl ?? null,
    ogTitle: seo.ogTitle ?? null,
    ogDescription: seo.ogDescription ?? null,
    ogImageId: seo.ogImageId ?? null,
    twitterCard: seo.twitterCard ?? 'summary_large_image',
    keywords: seo.keywords ?? [],
    robotsIndex: seo.robotsIndex ?? true,
    robotsFollow: seo.robotsFollow ?? true,
    includeInSitemap: seo.includeInSitemap ?? true,
    sitemapPriority: seo.sitemapPriority ?? 0.5,
    sitemapFrequency: seo.sitemapFrequency ?? 'WEEKLY',
  };

  return existingSeoId ? { update: data } : { create: data };
}

/**
 * Replaces the gallery for an entity.
 *
 * Galleries are stored as MediaUsage rows rather than per-entity join tables,
 * which keeps one reverse index for "where is this image used?".
 */
export async function syncGallery(
  prisma: PrismaService,
  entityType: ContentEntityType,
  entityId: string,
  mediaIds: string[] | undefined,
  role = 'gallery',
): Promise<void> {
  if (!mediaIds) return;

  await prisma.$transaction([
    prisma.mediaUsage.deleteMany({ where: { entityType, entityId, role } }),
    ...(mediaIds.length > 0
      ? [
          prisma.mediaUsage.createMany({
            data: mediaIds.map((mediaId, index) => ({
              mediaId,
              entityType,
              entityId,
              role,
              sortOrder: index,
            })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);
}

/** Loads a gallery in sort order, newest write wins on duplicates. */
export async function loadGallery(
  prisma: PrismaService,
  entityType: ContentEntityType,
  entityId: string,
  role = 'gallery',
) {
  const usages = await prisma.mediaUsage.findMany({
    where: { entityType, entityId, role },
    orderBy: { sortOrder: 'asc' },
    include: { media: true },
  });
  return usages.map((usage) => usage.media).filter((media) => media && !media.archivedAt);
}

/**
 * CTA fields arrive nested in the payload but are stored as flat columns.
 * Only Service carries a CTA description column, hence the flag.
 */
export function flattenCta(
  cta: Record<string, any> | undefined,
  options: { withDescription?: boolean } = {},
): Record<string, string | null> {
  if (!cta) return {};
  return {
    ctaHeading: cta.heading ?? null,
    ...(options.withDescription ? { ctaDescription: cta.description ?? null } : {}),
    ctaLabel: cta.label ?? null,
    ctaHref: cta.href ?? null,
  };
}
