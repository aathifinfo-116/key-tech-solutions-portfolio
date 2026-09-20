/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CareerDto, JobApplicationDto, Paginated } from '@kts/shared-types';
import { sanitizeRichText } from '@kts/validation';
import { AuditService } from '../../common/audit/audit.service';
import { CrudService } from '../../common/crud/crud.service';
import type {
  CrudConfig,
  CrudContext,
  CrudListQuery,
  PrismaDelegate,
} from '../../common/crud/crud.types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RevalidationService } from '../../common/revalidation/revalidation.service';
import { STORAGE_PROVIDER, type StorageProvider } from '../../common/storage/storage.interface';
import type { MediaUrlResolver } from '../../common/utils/mappers';
import {
  buildSearchWhere,
  normalisePaging,
  paginate,
  toSkipTake,
} from '../../common/utils/pagination';
import { seoNestedWrite, toDateOrNull } from '../content/content.helpers';
import { careerDetailInclude } from '../content/content.includes';
import { mapCareer } from '../content/content.mappers';

/**
 * Job openings.
 *
 * Careers use their own `careerStatus` lifecycle (DRAFT / OPEN / CLOSED /
 * ARCHIVED) rather than the content publication workflow, so `publishable` is
 * false and the status change goes through `setCareerStatus`.
 */
@Injectable()
export class CareerAdminService extends CrudService<CareerDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly resolver: MediaUrlResolver;
  protected readonly config: CrudConfig = {
    resource: 'careers',
    singular: 'Job opening',
    entityType: 'CAREER',
    permissionFamily: 'careers',
    searchFields: ['title', 'department', 'location', 'slug'],
    sortFields: ['title', 'department', 'publishedAt', 'updatedAt'],
    defaultOrderBy: [{ publishedAt: 'desc' }, { title: 'asc' }],
    include: careerDetailInclude,
    publishable: false,
    sluggable: true,
    publicBasePath: '/careers',
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
    this.delegate = prisma.career as unknown as PrismaDelegate;
    this.resolver = { publicUrl: (key: string) => this.storage.publicUrl(key) };
  }

  protected toDto(row: any): CareerDto {
    return mapCareer(row, this.resolver);
  }

  protected override listWhere(query: CrudListQuery): Record<string, unknown> {
    const where: Record<string, unknown> = {};
    if (query.careerStatus) where.careerStatus = query.careerStatus;
    if (query.department) where.department = query.department;
    return where;
  }

  private common(input: any) {
    return {
      slug: input.slug,
      title: input.title,
      department: input.department,
      location: input.location,
      workplaceType: input.workplaceType ?? 'ONSITE',
      employmentType: input.employmentType ?? 'FULL_TIME',
      summary: sanitizeRichText(input.summary),
      responsibilities: input.responsibilities ?? [],
      requirements: input.requirements ?? [],
      preferredSkills: input.preferredSkills ?? [],
      applyDeadline: toDateOrNull(input.applyDeadline),
      careerStatus: input.careerStatus ?? 'DRAFT',
      // OPEN is the point at which the role becomes publicly visible.
      publishedAt: input.careerStatus === 'OPEN' ? new Date() : undefined,
    };
  }

  protected toCreateData(input: any) {
    return { ...this.common(input), seo: seoNestedWrite(input.seo) };
  }

  protected toUpdateData(input: any, existing: any) {
    const data: Record<string, unknown> = {
      ...this.common(input),
      seo: seoNestedWrite(input.seo, existing.seoId),
    };
    // Keep the original publication date once a role has been opened.
    if (existing.publishedAt) data.publishedAt = existing.publishedAt;
    if (input.careerStatus === 'OPEN' && !existing.publishedAt) data.publishedAt = new Date();
    return data;
  }

  async setCareerStatus(
    id: string,
    status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'ARCHIVED',
    ctx: CrudContext,
  ): Promise<CareerDto> {
    this.assertPermission(ctx, 'publish');
    const existing = await this.requireRow(id);

    const updated = await this.prisma.career.update({
      where: { id },
      data: {
        careerStatus: status,
        publishedAt:
          status === 'OPEN' ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
        archivedAt: status === 'ARCHIVED' ? new Date() : null,
      },
      include: careerDetailInclude,
    });

    await this.audit.record({
      action: status === 'OPEN' ? 'PUBLISH' : status === 'ARCHIVED' ? 'ARCHIVE' : 'STATUS_CHANGE',
      entityType: 'CAREER',
      entityId: id,
      entityLabel: updated.title,
      summary: `${existing.careerStatus} -> ${status}`,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
    await this.revalidation.revalidate('CAREER', updated.slug);

    return this.toDto(updated);
  }
}

/**
 * Job applications.
 *
 * Applications are never created from the admin panel; they arrive through the
 * public API. CVs stay in private storage and are reachable only through a
 * short-lived signed link issued to a role holding `applications:download`.
 */
@Injectable()
export class JobApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private assert(ctx: CrudContext, permission: string): void {
    if (!ctx.user.permissions.includes(permission)) {
      throw new NotFoundException('Not found.');
    }
  }

  async list(query: CrudListQuery, ctx: CrudContext): Promise<Paginated<JobApplicationDto>> {
    this.assert(ctx, 'applications:read');
    const paging = normalisePaging(query);
    const { skip, take } = toSkipTake(paging);

    const where: Record<string, unknown> = {};
    if (query.careerId) where.careerId = query.careerId;
    if (query.applicationStatus) where.applicationStatus = query.applicationStatus;
    if (!query.includeArchived) where.archivedAt = null;
    const search = buildSearchWhere(query.search, ['applicantName', 'email']);
    if (search) Object.assign(where, search);

    const [rows, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where,
        orderBy: { appliedAt: 'desc' },
        skip,
        take,
        include: { career: { select: { title: true } } },
      }),
      this.prisma.jobApplication.count({ where }),
    ]);

    return paginate(rows.map(mapApplication), paging, total);
  }

  async get(id: string, ctx: CrudContext): Promise<JobApplicationDto> {
    this.assert(ctx, 'applications:read');
    const row = await this.prisma.jobApplication.findUnique({
      where: { id },
      include: { career: { select: { title: true } } },
    });
    if (!row) throw new NotFoundException('That application does not exist.');
    return mapApplication(row);
  }

  async update(
    id: string,
    input: { applicationStatus?: JobApplicationDto['applicationStatus']; internalNotes?: string },
    ctx: CrudContext,
  ): Promise<JobApplicationDto> {
    this.assert(ctx, 'applications:update');
    const row = await this.prisma.jobApplication.update({
      where: { id },
      data: { applicationStatus: input.applicationStatus, internalNotes: input.internalNotes },
      include: { career: { select: { title: true } } },
    });

    await this.audit.record({
      action: 'STATUS_CHANGE',
      entityType: 'JOB_APPLICATION',
      entityId: id,
      // The applicant's name is the label; the CV itself is never touched here.
      entityLabel: row.applicantName,
      summary: input.applicationStatus
        ? `Status set to ${input.applicationStatus}`
        : 'Notes updated',
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });

    return mapApplication(row);
  }

  /** Returns the CV's document id so the caller can request a signed link. */
  async cvDocumentId(id: string, ctx: CrudContext): Promise<string> {
    this.assert(ctx, 'applications:download');
    const row = await this.prisma.jobApplication.findUnique({
      where: { id },
      select: { cvDocumentId: true },
    });
    if (!row?.cvDocumentId) throw new NotFoundException('This application has no CV attached.');
    return row.cvDocumentId;
  }
}

function mapApplication(row: any): JobApplicationDto {
  return {
    id: row.id,
    careerId: row.careerId,
    careerTitle: row.career?.title ?? '',
    applicantName: row.applicantName,
    email: row.email,
    mobile: row.mobile,
    portfolioUrl: row.portfolioUrl,
    linkedinUrl: row.linkedinUrl,
    coverNote: row.coverNote,
    hasCv: Boolean(row.cvDocumentId),
    applicationStatus: row.applicationStatus,
    internalNotes: row.internalNotes,
    appliedAt: row.appliedAt.toISOString(),
  };
}
