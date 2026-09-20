/* eslint-disable @typescript-eslint/no-explicit-any */
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { PageDto } from '@kts/shared-types';
import { normalisePath, sanitizeRichText } from '@kts/validation';
import { AuditService } from '../../common/audit/audit.service';
import { CrudService } from '../../common/crud/crud.service';
import type { CrudConfig, PrismaDelegate } from '../../common/crud/crud.types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RevalidationService } from '../../common/revalidation/revalidation.service';
import { STORAGE_PROVIDER, type StorageProvider } from '../../common/storage/storage.interface';
import type { MediaUrlResolver } from '../../common/utils/mappers';
import { optionalConnect, seoNestedWrite, toDateOrNull } from './content.helpers';
import { pageDetailInclude } from './content.includes';
import { mapPage } from './content.mappers';

/**
 * Pages and the section-based page builder.
 *
 * Sections are a controlled set of layouts rather than a free canvas: an
 * editor picks a type, a theme and a layout variant, and the rendering stays
 * inside the design system. Section bodies are sanitised on write.
 */
@Injectable()
export class PageAdminService extends CrudService<PageDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly resolver: MediaUrlResolver;
  protected readonly config: CrudConfig = {
    resource: 'pages',
    singular: 'Page',
    entityType: 'PAGE',
    permissionFamily: 'pages',
    searchFields: ['title', 'slug', 'path', 'summary'],
    sortFields: ['title', 'path', 'updatedAt', 'publishedAt'],
    defaultOrderBy: [{ path: 'asc' }],
    include: pageDetailInclude,
    listInclude: { coverImage: true, _count: { select: { sections: true } } },
    publishable: true,
    sluggable: true,
    reorderable: false,
    hasSeo: true,
    archivable: true,
    labelField: 'title',
    snapshotOmit: ['seoId'],
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation);
    this.delegate = prisma.page as unknown as PrismaDelegate;
    this.resolver = { publicUrl: (key: string) => this.storage.publicUrl(key) };
  }

  protected toDto(row: any): PageDto {
    return mapPage(row, this.resolver) as PageDto;
  }

  private sectionsWrite(sections: any[] | undefined) {
    if (!sections) return undefined;
    return {
      deleteMany: {},
      create: sections.map((section, index) => ({
        internalName: section.internalName,
        type: section.type,
        eyebrow: section.eyebrow ?? null,
        heading: section.heading ?? null,
        subheading: section.subheading ?? null,
        description: section.description ?? null,
        bodyHtml: section.bodyHtml
          ? sanitizeRichText(section.bodyHtml, { allowEmbeds: true })
          : null,
        theme: section.theme ?? 'WHITE',
        layoutVariant: section.layoutVariant ?? 'default',
        backgroundImageUrl: section.backgroundImageUrl ?? null,
        mediaId: section.mediaId ?? null,
        primaryCtaLabel: section.primaryCtaLabel ?? null,
        primaryCtaHref: section.primaryCtaHref ?? null,
        secondaryCtaLabel: section.secondaryCtaLabel ?? null,
        secondaryCtaHref: section.secondaryCtaHref ?? null,
        settings: section.settings ?? undefined,
        relatedIds: section.relatedIds ?? [],
        sortOrder: section.sortOrder ?? index,
        isVisible: section.isVisible ?? true,
        visibleFrom: toDateOrNull(section.visibleFrom),
        visibleUntil: toDateOrNull(section.visibleUntil),
      })),
    };
  }

  private common(input: any) {
    const path = normalisePath(input.path ?? `/${input.slug}`);
    if (path.startsWith('/admin') || path.startsWith('/api')) {
      throw new BadRequestException('A page path may not start with /admin or /api.');
    }
    return {
      slug: input.slug,
      path,
      title: input.title,
      eyebrow: input.eyebrow ?? null,
      headline: input.headline ?? null,
      subheadline: input.subheadline ?? null,
      summary: input.summary ?? null,
      showInSitemap: input.showInSitemap ?? true,
      status: input.status ?? 'DRAFT',
      scheduledAt: toDateOrNull(input.scheduledAt),
      coverImage: optionalConnect(input.coverImageId),
      sections: this.sectionsWrite(input.sections),
    };
  }

  protected toCreateData(input: any) {
    return { ...this.common(input), seo: seoNestedWrite(input.seo) };
  }

  protected toUpdateData(input: any, existing: any) {
    if (existing.isSystem && input.slug && input.slug !== existing.slug) {
      throw new BadRequestException('The slug of a system page cannot be changed.');
    }
    return { ...this.common(input), seo: seoNestedWrite(input.seo, existing.seoId) };
  }
}
