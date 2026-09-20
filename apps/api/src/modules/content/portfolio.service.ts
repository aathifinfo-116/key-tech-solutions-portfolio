/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable } from '@nestjs/common';
import type {
  CaseStudyDto,
  ClientDto,
  PartnerDto,
  PortfolioProjectDto,
  TestimonialDto,
} from '@kts/shared-types';
import { AuditService } from '../../common/audit/audit.service';
import { CrudService } from '../../common/crud/crud.service';
import type { CrudConfig, CrudContext, PrismaDelegate } from '../../common/crud/crud.types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RevalidationService } from '../../common/revalidation/revalidation.service';
import { STORAGE_PROVIDER, type StorageProvider } from '../../common/storage/storage.interface';
import { mapMedia, type MediaUrlResolver } from '../../common/utils/mappers';
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
  caseStudyDetailInclude,
  caseStudySummaryInclude,
  portfolioDetailInclude,
  portfolioSummaryInclude,
} from './content.includes';
import { mapCaseStudy, mapPortfolioProject, mapTestimonial } from './content.mappers';

abstract class PortfolioBaseService<TDto> extends CrudService<TDto> {
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
// Portfolio projects
// ---------------------------------------------------------------------------

@Injectable()
export class PortfolioAdminService extends PortfolioBaseService<PortfolioProjectDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly config: CrudConfig = {
    resource: 'portfolio',
    singular: 'Portfolio project',
    entityType: 'PORTFOLIO_PROJECT',
    permissionFamily: 'portfolio',
    searchFields: ['title', 'summary', 'slug', 'category'],
    sortFields: ['title', 'sortOrder', 'updatedAt', 'completionDate', 'publishedAt'],
    defaultOrderBy: [{ sortOrder: 'asc' }, { completionDate: 'desc' }],
    include: portfolioDetailInclude,
    listInclude: portfolioSummaryInclude,
    publishable: true,
    sluggable: true,
    publicBasePath: '/portfolio',
    reorderable: true,
    hasSeo: true,
    archivable: true,
    featuredField: 'isFeatured',
    labelField: 'title',
    snapshotOmit: ['seoId'],
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation, storage);
    this.delegate = prisma.portfolioProject as unknown as PrismaDelegate;
  }

  protected toDto(row: any): PortfolioProjectDto {
    return mapPortfolioProject(row, this.resolver);
  }

  private common(input: any) {
    const clean = sanitiseRichFields(input, ['challenge', 'approach', 'solution']);
    return {
      title: clean.title,
      slug: clean.slug,
      // The schema already refuses a named customer on a confidential project;
      // this makes the stored value match regardless.
      customerDisplayName: clean.isCustomerConfidential
        ? null
        : (clean.customerDisplayName ?? null),
      isCustomerConfidential: clean.isCustomerConfidential ?? false,
      category: clean.category ?? null,
      projectStatus: clean.projectStatus ?? 'PLANNED',
      startDate: toDateOrNull(clean.startDate),
      completionDate: toDateOrNull(clean.completionDate),
      summary: clean.summary,
      challenge: clean.challenge ?? null,
      approach: clean.approach ?? null,
      solution: clean.solution ?? null,
      features: clean.features ?? [],
      deliverables: clean.deliverables ?? [],
      publicUrl: clean.publicUrl ?? null,
      demoUrl: clean.demoUrl ?? null,
      isFeatured: clean.isFeatured ?? false,
      sortOrder: clean.sortOrder ?? 0,
      status: clean.status ?? 'DRAFT',
      scheduledAt: toDateOrNull(clean.scheduledAt),
      coverImage: optionalConnect(clean.coverImageId),
      featureItems: replaceChildren(clean.featureItems, (f: any, i: number) => ({
        title: f.title,
        description: f.description ?? null,
        iconName: f.iconName ?? null,
        sortOrder: f.sortOrder ?? i,
      })),
      technologies: relationSet(clean.technologyIds),
      services: relationSet(clean.serviceIds),
      products: relationSet(clean.productIds),
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
// Case studies
// ---------------------------------------------------------------------------

@Injectable()
export class CaseStudyAdminService extends PortfolioBaseService<CaseStudyDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly config: CrudConfig = {
    resource: 'case-studies',
    singular: 'Case study',
    entityType: 'CASE_STUDY',
    permissionFamily: 'case-studies',
    searchFields: ['title', 'summary', 'slug'],
    sortFields: ['title', 'sortOrder', 'updatedAt', 'publishedAt'],
    defaultOrderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    include: caseStudyDetailInclude,
    listInclude: caseStudySummaryInclude,
    publishable: true,
    sluggable: true,
    publicBasePath: '/case-studies',
    reorderable: true,
    hasSeo: true,
    archivable: true,
    featuredField: 'isFeatured',
    labelField: 'title',
    snapshotOmit: ['seoId'],
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation, storage);
    this.delegate = prisma.caseStudy as unknown as PrismaDelegate;
  }

  protected toDto(row: any): CaseStudyDto {
    return mapCaseStudy(row, this.resolver);
  }

  private common(input: any) {
    const clean = sanitiseRichFields(input, [
      'background',
      'challenge',
      'discovery',
      'strategy',
      'design',
      'development',
      'architecture',
      'solution',
      'results',
    ]);
    return {
      title: clean.title,
      slug: clean.slug,
      summary: clean.summary,
      approvedCustomerName: clean.isCustomerApproved ? (clean.approvedCustomerName ?? null) : null,
      isCustomerApproved: clean.isCustomerApproved ?? false,
      background: clean.background ?? null,
      challenge: clean.challenge ?? null,
      discovery: clean.discovery ?? null,
      strategy: clean.strategy ?? null,
      design: clean.design ?? null,
      development: clean.development ?? null,
      architecture: clean.architecture ?? null,
      solution: clean.solution ?? null,
      results: clean.results ?? null,
      isFeatured: clean.isFeatured ?? false,
      sortOrder: clean.sortOrder ?? 0,
      status: clean.status ?? 'DRAFT',
      scheduledAt: toDateOrNull(clean.scheduledAt),
      ...flattenCta(clean.cta),
      coverImage: optionalConnect(clean.coverImageId),
      project: optionalConnect(clean.projectId),
      testimonial: optionalConnect(clean.testimonialId),
      metrics: replaceChildren(clean.metrics, (m: any, i: number) => ({
        label: m.label,
        value: m.value,
        unit: m.unit ?? null,
        description: m.description ?? null,
        isVerified: m.isVerified ?? false,
        sourceNote: m.sourceNote ?? null,
        sortOrder: m.sortOrder ?? i,
      })),
      downloads: replaceChildren(
        clean.downloadDocumentIds?.map((id: string) => ({ id })),
        (d: any, i: number) => ({ documentId: d.id, label: 'Download', sortOrder: i }),
      ),
      services: relationSet(clean.serviceIds),
      products: relationSet(clean.productIds),
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
// Testimonials, clients, partners
// ---------------------------------------------------------------------------

@Injectable()
export class TestimonialAdminService extends CrudService<TestimonialDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly resolver: MediaUrlResolver;
  protected readonly config: CrudConfig = {
    resource: 'testimonials',
    singular: 'Testimonial',
    entityType: 'TESTIMONIAL',
    permissionFamily: 'social-proof',
    searchFields: ['authorName', 'organization', 'quote'],
    sortFields: ['authorName', 'sortOrder', 'updatedAt'],
    defaultOrderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: { photo: true },
    publishable: true,
    sluggable: false,
    reorderable: true,
    hasSeo: false,
    archivable: true,
    labelField: 'authorName',
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation);
    this.delegate = prisma.testimonial as unknown as PrismaDelegate;
    this.resolver = { publicUrl: (key: string) => this.storage.publicUrl(key) };
  }

  protected toDto(row: any): TestimonialDto {
    return mapTestimonial(row, this.resolver);
  }

  private common(input: any) {
    return {
      quote: input.quote,
      authorName: input.authorName,
      authorRole: input.authorRole ?? null,
      organization: input.organization ?? null,
      isApproved: input.isApproved ?? false,
      approvalNote: input.approvalNote ?? null,
      isSampleContent: input.isSampleContent ?? false,
      sortOrder: input.sortOrder ?? 0,
      status: input.status ?? 'DRAFT',
      photo: optionalConnect(input.photoId),
    };
  }

  protected toCreateData(input: any) {
    return this.common(input);
  }

  protected toUpdateData(input: any) {
    return this.common(input);
  }
}

@Injectable()
export class ClientAdminService extends CrudService<ClientDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly resolver: MediaUrlResolver;
  protected readonly config: CrudConfig = {
    resource: 'clients',
    singular: 'Client',
    entityType: 'CLIENT',
    permissionFamily: 'social-proof',
    searchFields: ['organization', 'slug'],
    sortFields: ['organization', 'sortOrder', 'updatedAt'],
    defaultOrderBy: [{ sortOrder: 'asc' }, { organization: 'asc' }],
    include: { logo: true },
    publishable: true,
    sluggable: true,
    reorderable: true,
    hasSeo: false,
    archivable: true,
    labelField: 'organization',
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation);
    this.delegate = prisma.client as unknown as PrismaDelegate;
    this.resolver = { publicUrl: (key: string) => this.storage.publicUrl(key) };
  }

  protected toDto(row: any): ClientDto {
    return {
      id: row.id,
      organization: row.organization,
      slug: row.slug,
      logo: mapMedia(row.logo, this.resolver),
      websiteUrl: row.websiteUrl,
      isSampleContent: row.isSampleContent,
    };
  }

  private common(input: any) {
    return {
      organization: input.organization,
      slug: input.slug,
      websiteUrl: input.websiteUrl ?? null,
      isDisplayApproved: input.isDisplayApproved ?? false,
      isSampleContent: input.isSampleContent ?? false,
      sortOrder: input.sortOrder ?? 0,
      status: input.status ?? 'DRAFT',
      logo: optionalConnect(input.logoId),
    };
  }

  protected toCreateData(input: any) {
    return this.common(input);
  }

  protected toUpdateData(input: any) {
    return this.common(input);
  }
}

@Injectable()
export class PartnerAdminService extends CrudService<PartnerDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly resolver: MediaUrlResolver;
  protected readonly config: CrudConfig = {
    resource: 'partners',
    singular: 'Partner',
    entityType: 'PARTNER',
    permissionFamily: 'social-proof',
    searchFields: ['organization', 'slug'],
    sortFields: ['organization', 'sortOrder', 'updatedAt'],
    defaultOrderBy: [{ sortOrder: 'asc' }, { organization: 'asc' }],
    include: { logo: true },
    publishable: true,
    sluggable: true,
    reorderable: true,
    hasSeo: false,
    archivable: true,
    labelField: 'organization',
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation);
    this.delegate = prisma.partner as unknown as PrismaDelegate;
    this.resolver = { publicUrl: (key: string) => this.storage.publicUrl(key) };
  }

  protected toDto(row: any): PartnerDto {
    return {
      id: row.id,
      organization: row.organization,
      slug: row.slug,
      logo: mapMedia(row.logo, this.resolver),
      websiteUrl: row.websiteUrl,
      relationshipNote: row.relationshipNote,
      isSampleContent: row.isSampleContent,
    };
  }

  private common(input: any) {
    return {
      organization: input.organization,
      slug: input.slug,
      websiteUrl: input.websiteUrl ?? null,
      relationshipNote: input.relationshipNote ?? null,
      isDisplayApproved: input.isDisplayApproved ?? false,
      isSampleContent: input.isSampleContent ?? false,
      sortOrder: input.sortOrder ?? 0,
      status: input.status ?? 'DRAFT',
      logo: optionalConnect(input.logoId),
    };
  }

  protected toCreateData(input: any) {
    return this.common(input);
  }

  protected toUpdateData(input: any) {
    return this.common(input);
  }
}
