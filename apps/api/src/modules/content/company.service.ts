/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable } from '@nestjs/common';
import type {
  CompanyMilestoneDto,
  CompanyValueDto,
  ProcessPhaseDto,
  StatisticDto,
  TeamMemberDto,
  TechnologySummaryDto,
} from '@kts/shared-types';
import { sanitizeRichText } from '@kts/validation';
import { AuditService } from '../../common/audit/audit.service';
import { CrudService } from '../../common/crud/crud.service';
import type { CrudConfig, PrismaDelegate } from '../../common/crud/crud.types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RevalidationService } from '../../common/revalidation/revalidation.service';
import { STORAGE_PROVIDER, type StorageProvider } from '../../common/storage/storage.interface';
import { isoOrNull, mapMedia, type MediaUrlResolver } from '../../common/utils/mappers';
import { optionalConnect, relationSet, toDateOrNull } from './content.helpers';
import { mapTeamMember, mapTechnologySummary } from './content.mappers';

abstract class CompanyBaseService<TDto> extends CrudService<TDto> {
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
}

@Injectable()
export class ProcessPhaseAdminService extends CompanyBaseService<ProcessPhaseDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly config: CrudConfig = {
    resource: 'process-phases',
    singular: 'Process phase',
    entityType: 'PROCESS_PHASE',
    permissionFamily: 'company',
    searchFields: ['name', 'shortDescription', 'slug'],
    sortFields: ['number', 'sortOrder', 'name'],
    defaultOrderBy: [{ sortOrder: 'asc' }, { number: 'asc' }],
    include: { image: true },
    publishable: false,
    sluggable: true,
    reorderable: true,
    hasSeo: false,
    archivable: false,
    labelField: 'name',
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation, storage);
    this.delegate = prisma.processPhase as unknown as PrismaDelegate;
  }

  protected toDto(row: any): ProcessPhaseDto {
    return {
      id: row.id,
      slug: row.slug,
      number: row.number,
      name: row.name,
      shortDescription: row.shortDescription,
      detailedDescription: row.detailedDescription,
      deliverables: row.deliverables ?? [],
      iconName: row.iconName,
      image: mapMedia(row.image, this.resolver),
    };
  }

  private common(input: any) {
    return {
      slug: input.slug,
      number: input.number,
      name: input.name,
      shortDescription: input.shortDescription,
      detailedDescription: input.detailedDescription
        ? sanitizeRichText(input.detailedDescription)
        : null,
      deliverables: input.deliverables ?? [],
      iconName: input.iconName ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
      image: optionalConnect(input.imageId),
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
export class CompanyValueAdminService extends CompanyBaseService<CompanyValueDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly config: CrudConfig = {
    resource: 'company-values',
    singular: 'Company value',
    entityType: 'COMPANY_VALUE',
    permissionFamily: 'company',
    searchFields: ['title', 'description', 'slug'],
    sortFields: ['title', 'sortOrder'],
    defaultOrderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    publishable: false,
    sluggable: true,
    reorderable: true,
    hasSeo: false,
    archivable: false,
    labelField: 'title',
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation, storage);
    this.delegate = prisma.companyValue as unknown as PrismaDelegate;
  }

  protected toDto(row: any): CompanyValueDto {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      iconName: row.iconName,
    };
  }

  private common(input: any) {
    return {
      slug: input.slug,
      title: input.title,
      description: input.description,
      iconName: input.iconName ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
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
export class MilestoneAdminService extends CompanyBaseService<CompanyMilestoneDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly config: CrudConfig = {
    resource: 'milestones',
    singular: 'Milestone',
    entityType: 'COMPANY_MILESTONE',
    permissionFamily: 'company',
    searchFields: ['title', 'label'],
    sortFields: ['sortOrder', 'occurredOn'],
    defaultOrderBy: [{ sortOrder: 'asc' }, { occurredOn: 'asc' }],
    include: { image: true },
    publishable: false,
    sluggable: false,
    reorderable: true,
    hasSeo: false,
    archivable: false,
    labelField: 'title',
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation, storage);
    this.delegate = prisma.companyMilestone as unknown as PrismaDelegate;
  }

  protected toDto(row: any): CompanyMilestoneDto {
    return {
      id: row.id,
      label: row.label,
      title: row.title,
      description: row.description,
      occurredOn: isoOrNull(row.occurredOn),
      image: mapMedia(row.image, this.resolver),
    };
  }

  private common(input: any) {
    return {
      label: input.label,
      title: input.title,
      description: input.description ?? null,
      occurredOn: toDateOrNull(input.occurredOn),
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
      image: optionalConnect(input.imageId),
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
export class StatisticAdminService extends CompanyBaseService<StatisticDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly config: CrudConfig = {
    resource: 'statistics',
    singular: 'Statistic',
    entityType: 'STATISTIC',
    permissionFamily: 'company',
    searchFields: ['label', 'key', 'value'],
    sortFields: ['sortOrder', 'label'],
    defaultOrderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    publishable: false,
    sluggable: false,
    reorderable: true,
    hasSeo: false,
    archivable: false,
    labelField: 'label',
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation, storage);
    this.delegate = prisma.statistic as unknown as PrismaDelegate;
  }

  protected toDto(row: any): StatisticDto {
    return {
      id: row.id,
      key: row.key,
      label: row.label,
      value: row.value,
      numericValue: row.numericValue,
      prefix: row.prefix,
      suffix: row.suffix,
      description: row.description,
      isVerified: row.isVerified,
    };
  }

  private common(input: any) {
    return {
      key: input.key,
      label: input.label,
      value: input.value,
      numericValue: input.numericValue ?? null,
      prefix: input.prefix ?? null,
      suffix: input.suffix ?? null,
      description: input.description ?? null,
      group: input.group ?? 'home',
      isVerified: input.isVerified ?? false,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
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
export class TechnologyAdminService extends CompanyBaseService<TechnologySummaryDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly config: CrudConfig = {
    resource: 'technologies',
    singular: 'Technology',
    entityType: 'TECHNOLOGY',
    permissionFamily: 'company',
    searchFields: ['name', 'slug'],
    sortFields: ['name', 'sortOrder'],
    defaultOrderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { logo: true, category: true },
    publishable: false,
    sluggable: true,
    reorderable: true,
    hasSeo: false,
    archivable: false,
    featuredField: 'isFeatured',
    labelField: 'name',
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation, storage);
    this.delegate = prisma.technology as unknown as PrismaDelegate;
  }

  protected toDto(row: any): TechnologySummaryDto {
    return mapTechnologySummary(row, this.resolver);
  }

  private common(input: any) {
    return {
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      proficiencyLabel: input.proficiencyLabel ?? null,
      websiteUrl: input.websiteUrl ?? null,
      isFeatured: input.isFeatured ?? false,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
      category: optionalConnect(input.categoryId),
      logo: optionalConnect(input.logoId),
      services: relationSet(input.serviceIds),
      products: relationSet(input.productIds),
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
export class TechnologyCategoryAdminService extends CompanyBaseService<{
  id: string;
  slug: string;
  name: string;
  description: string | null;
}> {
  protected readonly delegate: PrismaDelegate;
  protected readonly config: CrudConfig = {
    resource: 'technology-categories',
    singular: 'Technology category',
    entityType: 'TECHNOLOGY',
    permissionFamily: 'company',
    searchFields: ['name', 'slug'],
    sortFields: ['name', 'sortOrder'],
    defaultOrderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    publishable: false,
    sluggable: true,
    reorderable: true,
    hasSeo: false,
    archivable: false,
    labelField: 'name',
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation, storage);
    this.delegate = prisma.technologyCategory as unknown as PrismaDelegate;
  }

  protected toDto(row: any) {
    return { id: row.id, slug: row.slug, name: row.name, description: row.description };
  }

  private common(input: any) {
    return {
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
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
export class TeamMemberAdminService extends CompanyBaseService<TeamMemberDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly config: CrudConfig = {
    resource: 'team',
    singular: 'Team member',
    entityType: 'TEAM_MEMBER',
    permissionFamily: 'company',
    searchFields: ['displayName', 'jobTitle', 'slug'],
    sortFields: ['displayName', 'sortOrder'],
    defaultOrderBy: [{ sortOrder: 'asc' }, { displayName: 'asc' }],
    include: { photo: true },
    publishable: true,
    sluggable: true,
    publicBasePath: '/team',
    reorderable: true,
    hasSeo: false,
    archivable: true,
    featuredField: 'isFeatured',
    labelField: 'displayName',
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation, storage);
    this.delegate = prisma.teamMember as unknown as PrismaDelegate;
  }

  protected toDto(row: any): TeamMemberDto {
    return mapTeamMember(row, this.resolver);
  }

  private common(input: any) {
    return {
      slug: input.slug,
      displayName: input.displayName,
      jobTitle: input.jobTitle,
      biography: input.biography ? sanitizeRichText(input.biography) : null,
      skills: input.skills ?? [],
      linkedinUrl: input.linkedinUrl ?? null,
      githubUrl: input.githubUrl ?? null,
      // Only an address the member agreed to publish is ever stored here.
      publicEmail: input.publicEmail ?? null,
      isFeatured: input.isFeatured ?? false,
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
