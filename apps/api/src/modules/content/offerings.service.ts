/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable } from '@nestjs/common';
import type { IndustryDto, ProductDto, ServiceDto, SolutionDto } from '@kts/shared-types';
import { AuditService } from '../../common/audit/audit.service';
import { CrudService } from '../../common/crud/crud.service';
import type { CrudConfig, CrudContext, PrismaDelegate } from '../../common/crud/crud.types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RevalidationService } from '../../common/revalidation/revalidation.service';
import { STORAGE_PROVIDER, type StorageProvider } from '../../common/storage/storage.interface';
import type { MediaUrlResolver } from '../../common/utils/mappers';
import {
  flattenCta,
  loadGallery,
  optionalConnect,
  relationSet,
  replaceChildren,
  sanitiseRichFields,
  seoNestedWrite,
  syncGallery,
  toDateOrNull,
} from './content.helpers';
import {
  industryDetailInclude,
  industrySummaryInclude,
  productDetailInclude,
  productSummaryInclude,
  serviceDetailInclude,
  serviceSummaryInclude,
  solutionDetailInclude,
  solutionSummaryInclude,
} from './content.includes';
import { mapIndustry, mapProduct, mapService, mapSolution } from './content.mappers';

/** Shared plumbing: media URL resolution and gallery attachment. */
abstract class OfferingService<TDto> extends CrudService<TDto> {
  protected readonly resolver: MediaUrlResolver;

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    protected readonly storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation);
    this.resolver = { publicUrl: (key: string) => this.storage.publicUrl(key) };
  }

  protected override async requireRow(id: string): Promise<any> {
    const row = await super.requireRow(id);
    row.__gallery = await loadGallery(this.prisma, this.config.entityType, id);
    return row;
  }

  protected override async afterWrite(row: any, input: any, _ctx: CrudContext): Promise<any> {
    await syncGallery(this.prisma, this.config.entityType, row.id, input.galleryMediaIds);
    row.__gallery = await loadGallery(this.prisma, this.config.entityType, row.id);
    return row;
  }
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

@Injectable()
export class ServiceAdminService extends OfferingService<ServiceDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly config: CrudConfig = {
    resource: 'services',
    singular: 'Service',
    entityType: 'SERVICE',
    permissionFamily: 'services',
    searchFields: ['name', 'shortDescription', 'slug'],
    sortFields: ['name', 'sortOrder', 'updatedAt', 'publishedAt'],
    defaultOrderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: serviceDetailInclude,
    listInclude: serviceSummaryInclude,
    publishable: true,
    sluggable: true,
    publicBasePath: '/services',
    reorderable: true,
    hasSeo: true,
    archivable: true,
    featuredField: 'isFeatured',
    labelField: 'name',
    snapshotOmit: ['seoId'],
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation, storage);
    this.delegate = prisma.service as unknown as PrismaDelegate;
  }

  protected toDto(row: any): ServiceDto {
    return mapService(row, this.resolver);
  }

  private common(input: any) {
    const clean = sanitiseRichFields(input, ['fullDescription']);
    return {
      name: clean.name,
      slug: clean.slug,
      shortDescription: clean.shortDescription,
      fullDescription: clean.fullDescription ?? null,
      iconName: clean.iconName ?? null,
      benefits: clean.benefits ?? [],
      capabilities: clean.capabilities ?? [],
      deliverables: clean.deliverables ?? [],
      processSummary: clean.processSummary ?? null,
      isFeatured: clean.isFeatured ?? false,
      sortOrder: clean.sortOrder ?? 0,
      status: clean.status ?? 'DRAFT',
      scheduledAt: toDateOrNull(clean.scheduledAt),
      ...flattenCta(clean.cta, { withDescription: true }),
      category: optionalConnect(clean.categoryId),
      coverImage: optionalConnect(clean.coverImageId),
      features: replaceChildren(clean.features, (f: any, i: number) => ({
        title: f.title,
        description: f.description ?? null,
        iconName: f.iconName ?? null,
        sortOrder: f.sortOrder ?? i,
      })),
      faqs: replaceChildren(clean.faqs, (f: any, i: number) => ({
        question: f.question,
        answer: f.answer,
        sortOrder: f.sortOrder ?? i,
        isActive: f.isActive ?? true,
      })),
      technologies: relationSet(clean.technologyIds),
      products: relationSet(clean.productIds),
      solutions: relationSet(clean.solutionIds),
      projects: relationSet(clean.projectIds),
      industries: relationSet(clean.industryIds),
    };
  }

  protected toCreateData(input: any) {
    return { ...this.common(input), seo: seoNestedWrite(input.seo) };
  }

  protected toUpdateData(input: any, existing: any) {
    return { ...this.common(input), seo: seoNestedWrite(input.seo, existing.seoId) };
  }
}

// ---------------------------------------------------------------------------
// Solutions
// ---------------------------------------------------------------------------

@Injectable()
export class SolutionAdminService extends OfferingService<SolutionDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly config: CrudConfig = {
    resource: 'solutions',
    singular: 'Solution',
    entityType: 'SOLUTION',
    permissionFamily: 'solutions',
    searchFields: ['name', 'summary', 'slug'],
    sortFields: ['name', 'sortOrder', 'updatedAt', 'publishedAt'],
    defaultOrderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: solutionDetailInclude,
    listInclude: solutionSummaryInclude,
    publishable: true,
    sluggable: true,
    publicBasePath: '/solutions',
    reorderable: true,
    hasSeo: true,
    archivable: true,
    featuredField: 'isFeatured',
    labelField: 'name',
    snapshotOmit: ['seoId'],
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation, storage);
    this.delegate = prisma.solution as unknown as PrismaDelegate;
  }

  protected toDto(row: any): SolutionDto {
    return mapSolution(row, this.resolver);
  }

  private common(input: any) {
    const clean = sanitiseRichFields(input, ['businessChallenge', 'overview']);
    return {
      name: clean.name,
      slug: clean.slug,
      summary: clean.summary,
      businessChallenge: clean.businessChallenge ?? null,
      overview: clean.overview ?? null,
      capabilities: clean.capabilities ?? [],
      userTypes: clean.userTypes ?? [],
      benefits: clean.benefits ?? [],
      workflowSteps: clean.workflowSteps ?? [],
      integrations: clean.integrations ?? [],
      iconName: clean.iconName ?? null,
      isFeatured: clean.isFeatured ?? false,
      sortOrder: clean.sortOrder ?? 0,
      status: clean.status ?? 'DRAFT',
      scheduledAt: toDateOrNull(clean.scheduledAt),
      ...flattenCta(clean.cta),
      coverImage: optionalConnect(clean.coverImageId),
      features: replaceChildren(clean.features, (f: any, i: number) => ({
        title: f.title,
        description: f.description ?? null,
        iconName: f.iconName ?? null,
        sortOrder: f.sortOrder ?? i,
      })),
      faqs: replaceChildren(clean.faqs, (f: any, i: number) => ({
        question: f.question,
        answer: f.answer,
        sortOrder: f.sortOrder ?? i,
        isActive: f.isActive ?? true,
      })),
      documents: replaceChildren(
        clean.documentIds?.map((id: string) => ({ id })),
        (d: any, i: number) => ({ documentId: d.id, label: 'Download', sortOrder: i }),
      ),
      services: relationSet(clean.serviceIds),
      products: relationSet(clean.productIds),
      industries: relationSet(clean.industryIds),
      projects: relationSet(clean.projectIds),
    };
  }

  protected toCreateData(input: any) {
    return { ...this.common(input), seo: seoNestedWrite(input.seo) };
  }

  protected toUpdateData(input: any, existing: any) {
    return { ...this.common(input), seo: seoNestedWrite(input.seo, existing.seoId) };
  }
}

// ---------------------------------------------------------------------------
// Industries
// ---------------------------------------------------------------------------

@Injectable()
export class IndustryAdminService extends OfferingService<IndustryDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly config: CrudConfig = {
    resource: 'industries',
    singular: 'Industry',
    entityType: 'INDUSTRY',
    permissionFamily: 'industries',
    searchFields: ['name', 'summary', 'slug'],
    sortFields: ['name', 'sortOrder', 'updatedAt'],
    defaultOrderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: industryDetailInclude,
    listInclude: industrySummaryInclude,
    publishable: true,
    sluggable: true,
    publicBasePath: '/industries',
    reorderable: true,
    hasSeo: true,
    archivable: true,
    featuredField: 'isFeatured',
    labelField: 'name',
    snapshotOmit: ['seoId'],
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation, storage);
    this.delegate = prisma.industry as unknown as PrismaDelegate;
  }

  protected toDto(row: any): IndustryDto {
    return mapIndustry(row, this.resolver);
  }

  private common(input: any) {
    const clean = sanitiseRichFields(input, ['introduction']);
    return {
      name: clean.name,
      slug: clean.slug,
      summary: clean.summary,
      introduction: clean.introduction ?? null,
      challenges: clean.challenges ?? [],
      capabilities: clean.capabilities ?? [],
      iconName: clean.iconName ?? null,
      isFeatured: clean.isFeatured ?? false,
      sortOrder: clean.sortOrder ?? 0,
      status: clean.status ?? 'DRAFT',
      scheduledAt: toDateOrNull(clean.scheduledAt),
      ...flattenCta(clean.cta),
      coverImage: optionalConnect(clean.coverImageId),
      services: relationSet(clean.serviceIds),
      solutions: relationSet(clean.solutionIds),
      products: relationSet(clean.productIds),
      projects: relationSet(clean.projectIds),
      caseStudies: relationSet(clean.caseStudyIds),
    };
  }

  protected toCreateData(input: any) {
    return { ...this.common(input), seo: seoNestedWrite(input.seo) };
  }

  protected toUpdateData(input: any, existing: any) {
    return { ...this.common(input), seo: seoNestedWrite(input.seo, existing.seoId) };
  }
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

@Injectable()
export class ProductAdminService extends OfferingService<ProductDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly config: CrudConfig = {
    resource: 'products',
    singular: 'Product',
    entityType: 'PRODUCT',
    permissionFamily: 'products',
    searchFields: ['name', 'tagline', 'summary', 'slug'],
    sortFields: ['name', 'sortOrder', 'updatedAt', 'publishedAt', 'launchDate'],
    defaultOrderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: productDetailInclude,
    listInclude: productSummaryInclude,
    publishable: true,
    sluggable: true,
    publicBasePath: '/products',
    reorderable: true,
    hasSeo: true,
    archivable: true,
    featuredField: 'isFeatured',
    labelField: 'name',
    snapshotOmit: ['seoId'],
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation, storage);
    this.delegate = prisma.product as unknown as PrismaDelegate;
  }

  protected toDto(row: any): ProductDto {
    return mapProduct(row, this.resolver);
  }

  private common(input: any) {
    const clean = sanitiseRichFields(input, ['fullDescription', 'problemSolved']);
    return {
      name: clean.name,
      slug: clean.slug,
      tagline: clean.tagline ?? null,
      category: clean.category ?? null,
      productStatus: clean.productStatus ?? 'CONCEPT',
      summary: clean.summary,
      fullDescription: clean.fullDescription ?? null,
      problemSolved: clean.problemSolved ?? null,
      targetUsers: clean.targetUsers ?? [],
      benefits: clean.benefits ?? [],
      brandPrimary: clean.brandPrimary ?? null,
      brandSecondary: clean.brandSecondary ?? null,
      demoVideoUrl: clean.demoVideoUrl ?? null,
      websiteUrl: clean.websiteUrl ?? null,
      demoUrl: clean.demoUrl ?? null,
      documentationUrl: clean.documentationUrl ?? null,
      launchLabel: clean.launchLabel ?? null,
      launchDate: toDateOrNull(clean.launchDate),
      businessModel: clean.businessModel ?? null,
      isFeatured: clean.isFeatured ?? false,
      sortOrder: clean.sortOrder ?? 0,
      status: clean.status ?? 'DRAFT',
      scheduledAt: toDateOrNull(clean.scheduledAt),
      logo: optionalConnect(clean.logoId),
      coverImage: optionalConnect(clean.coverImageId),
      features: replaceChildren(clean.features, (f: any, i: number) => ({
        title: f.title,
        description: f.description ?? null,
        iconName: f.iconName ?? null,
        sortOrder: f.sortOrder ?? i,
      })),
      screenshots: replaceChildren(clean.screenshots, (s: any, i: number) => ({
        mediaId: s.mediaId,
        title: s.title ?? null,
        caption: s.caption ?? null,
        sortOrder: s.sortOrder ?? i,
      })),
      faqs: replaceChildren(clean.faqs, (f: any, i: number) => ({
        question: f.question,
        answer: f.answer,
        sortOrder: f.sortOrder ?? i,
        isActive: f.isActive ?? true,
      })),
      technologies: relationSet(clean.technologyIds),
      industries: relationSet(clean.industryIds),
      services: relationSet(clean.serviceIds),
      solutions: relationSet(clean.solutionIds),
      caseStudies: relationSet(clean.caseStudyIds),
    };
  }

  protected toCreateData(input: any) {
    return { ...this.common(input), seo: seoNestedWrite(input.seo) };
  }

  protected toUpdateData(input: any, existing: any) {
    return { ...this.common(input), seo: seoNestedWrite(input.seo, existing.seoId) };
  }
}
