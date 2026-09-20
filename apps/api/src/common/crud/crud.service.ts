/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Paginated, PublicationStatus } from '@kts/shared-types';
import { buildSlugChangeRedirect, resolveStatusChange, slugify, uniqueSlug } from '@kts/validation';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { RevalidationService } from '../revalidation/revalidation.service';
import {
  buildOrderBy,
  buildSearchWhere,
  normalisePaging,
  paginate,
  toSkipTake,
} from '../utils/pagination';
import type { CrudConfig, CrudContext, CrudListQuery, PrismaDelegate } from './crud.types';

/**
 * Shared behaviour for every content resource: listing, workflow transitions,
 * revisions, soft archival, reordering, slug-change redirects, audit records
 * and cache invalidation.
 *
 * Concrete services extend this and supply the typed Prisma delegate plus the
 * translation between validated input and Prisma data.
 */
@Injectable()
export abstract class CrudService<TDto> {
  protected abstract readonly delegate: PrismaDelegate;
  protected abstract readonly config: CrudConfig;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly audit: AuditService,
    protected readonly revalidation: RevalidationService,
  ) {}

  /** Maps a Prisma row to the DTO the API returns. */
  protected abstract toDto(row: any): TDto;

  /**
   * The DTO an editor sees, which is the public shape plus the workflow
   * fields the website has no use for.
   *
   * Every admin read and write goes through here. Without it the editor is
   * shown a record with no status at all, and a form that cannot tell a
   * published page from a draft.
   */
  protected toAdminDto(row: any): TDto {
    if (!this.config.publishable) return this.toDto(row);
    return {
      ...this.toDto(row),
      status: row.status,
      scheduledAt: row.scheduledAt ? row.scheduledAt.toISOString() : null,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      ...(this.config.archivable
        ? { archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null }
        : {}),
      version: row.version ?? 1,
    } as TDto;
  }

  /** Translates validated input into Prisma `create` data. */
  protected abstract toCreateData(input: any, ctx: CrudContext): Promise<any> | any;

  /** Translates validated input into Prisma `update` data. */
  protected abstract toUpdateData(input: any, existing: any, ctx: CrudContext): Promise<any> | any;

  /**
   * Hook run after a create or update, before the row is mapped to a DTO.
   * Used to persist side tables (galleries, tags) and to re-read the row so
   * the response reflects everything that was written.
   */
  protected async afterWrite(row: any, _input: any, _ctx: CrudContext): Promise<any> {
    return row;
  }

  /** Extra `where` conditions applied to every list query. */
  protected listWhere(_query: CrudListQuery): Record<string, unknown> {
    return {};
  }

  // -------------------------------------------------------------------------
  // Permissions
  // -------------------------------------------------------------------------

  assertPermission(ctx: CrudContext, action: string): void {
    const key = `${this.config.permissionFamily}:${action}`;
    if (!ctx.user.permissions.includes(key)) {
      throw new ForbiddenException(`Your role does not include the required permission: ${key}.`);
    }
  }

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  async list(query: CrudListQuery, ctx: CrudContext): Promise<Paginated<TDto>> {
    this.assertPermission(ctx, 'read');

    const paging = normalisePaging(query);
    const { skip, take } = toSkipTake(paging);

    const where: Record<string, unknown> = { ...this.listWhere(query) };
    const search = buildSearchWhere(query.search, this.config.searchFields);
    if (search) Object.assign(where, search);
    if (this.config.publishable && query.status) where.status = query.status;
    if (this.config.archivable && !query.includeArchived) where.archivedAt = null;

    const orderBy = buildOrderBy(
      query.sortBy,
      query.sortDir,
      this.config.sortFields,
      this.config.defaultOrderBy,
    );

    const [rows, total] = await Promise.all([
      this.delegate.findMany({
        where,
        orderBy,
        skip,
        take,
        include: this.config.listInclude ?? this.config.include,
      }),
      this.delegate.count({ where }),
    ]);

    return paginate(
      rows.map((row) => this.toAdminDto(row)),
      paging,
      total,
    );
  }

  async findOne(id: string, ctx: CrudContext): Promise<TDto> {
    this.assertPermission(ctx, 'read');
    return this.toAdminDto(await this.requireRow(id));
  }

  protected async requireRow(id: string): Promise<any> {
    const row = await this.delegate.findUnique({ where: { id }, include: this.config.include });
    if (!row) throw new NotFoundException(`${this.config.singular} not found.`);
    return row;
  }

  // -------------------------------------------------------------------------
  // Writes
  // -------------------------------------------------------------------------

  async create(input: any, ctx: CrudContext): Promise<TDto> {
    this.assertPermission(ctx, 'create');

    if (this.config.publishable && this.isPublishTransition('DRAFT', input.status)) {
      this.assertPermission(ctx, 'publish');
    }

    const data = await this.toCreateData(input, ctx);
    if (this.config.sluggable) {
      data.slug = await this.ensureUniqueSlug(
        data.slug ?? slugify(String(data[this.config.labelField] ?? '')),
        null,
      );
    }

    let created = await this.delegate.create({ data, include: this.config.include });
    created = await this.afterWrite(created, input, ctx);

    await this.writeRevision(created, ctx, 'SAVED', input.changeSummary);
    await this.audit.record({
      action: 'CREATE',
      entityType: this.config.entityType,
      entityId: created.id,
      entityLabel: this.labelOf(created),
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
    await this.revalidateFor(created);

    return this.toAdminDto(created);
  }

  async update(id: string, input: any, ctx: CrudContext): Promise<TDto> {
    this.assertPermission(ctx, 'update');

    const existing = await this.requireRow(id);

    const data = await this.toUpdateData(input, existing, ctx);

    /*
      Saving edits content; it never moves the record between draft and
      published. Those transitions belong to `changeStatus`, which checks the
      publish permission and the rules about what may follow what. Dropping
      the field here means a form that omits it - or sends a stale value -
      cannot take a live page off the website by accident.
    */
    if (this.config.publishable) delete data.status;

    let suggestedRedirect: { source: string; destination: string } | null = null;
    if (this.config.sluggable && data.slug && data.slug !== existing.slug) {
      data.slug = await this.ensureUniqueSlug(data.slug, id);
      suggestedRedirect = await this.handleSlugChange(existing, data.slug, input, ctx);
    }

    if (this.config.publishable) data.version = (existing.version ?? 1) + 1;

    let updated = await this.delegate.update({ where: { id }, data, include: this.config.include });
    updated = await this.afterWrite(updated, input, ctx);

    await this.writeRevision(updated, ctx, 'SAVED', input.changeSummary);
    await this.audit.recordChange({
      action: 'UPDATE',
      entityType: this.config.entityType,
      entityId: id,
      label: this.labelOf(updated),
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
      before: this.snapshot(existing),
      after: this.snapshot(updated),
    });
    await this.revalidateFor(updated, existing);

    if (suggestedRedirect) {
      await this.revalidation.revalidate('REDIRECT_RULE');
    }

    return this.toAdminDto(updated);
  }

  async changeStatus(
    id: string,
    input: { status: PublicationStatus; scheduledAt?: string | null; changeSummary?: string },
    ctx: CrudContext,
  ): Promise<TDto> {
    if (!this.config.publishable) {
      throw new BadRequestException(
        `${this.config.singular} does not use the publication workflow.`,
      );
    }
    this.assertPermission(ctx, 'update');
    if (this.isPublishTransition('DRAFT', input.status)) this.assertPermission(ctx, 'publish');

    const existing = await this.requireRow(id);

    const resolved = resolveStatusChange({
      currentStatus: existing.status,
      nextStatus: input.status,
      scheduledAt: input.scheduledAt ?? null,
      publishedAt: existing.publishedAt ?? null,
    });
    if (!resolved.ok || !resolved.patch) {
      throw new BadRequestException(resolved.error ?? 'Invalid status change.');
    }

    const updated = await this.delegate.update({
      where: { id },
      data: { ...resolved.patch, version: (existing.version ?? 1) + 1 },
      include: this.config.include,
    });

    const action =
      input.status === 'PUBLISHED'
        ? 'PUBLISH'
        : input.status === 'ARCHIVED'
          ? 'ARCHIVE'
          : input.status === 'SCHEDULED'
            ? 'SCHEDULE'
            : 'UNPUBLISH';

    await this.writeRevision(
      updated,
      ctx,
      input.status === 'PUBLISHED'
        ? 'PUBLISHED'
        : input.status === 'SCHEDULED'
          ? 'SCHEDULED'
          : input.status === 'ARCHIVED'
            ? 'ARCHIVED'
            : input.status === 'REVIEW'
              ? 'SUBMITTED_FOR_REVIEW'
              : 'UNPUBLISHED',
      input.changeSummary,
    );

    await this.audit.record({
      action,
      entityType: this.config.entityType,
      entityId: id,
      entityLabel: this.labelOf(updated),
      summary: `${existing.status} -> ${input.status}`,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
    await this.revalidateFor(updated, existing);

    return this.toAdminDto(updated);
  }

  async archive(id: string, ctx: CrudContext): Promise<void> {
    this.assertPermission(ctx, 'delete');
    const existing = await this.requireRow(id);

    if (existing.isSystem) {
      throw new BadRequestException(
        `${this.config.singular} is a system record and cannot be removed.`,
      );
    }

    if (this.config.archivable) {
      await this.delegate.update({
        where: { id },
        data: {
          archivedAt: new Date(),
          ...(this.config.publishable ? { status: 'ARCHIVED' } : {}),
        },
      });
    } else {
      await this.delegate.delete({ where: { id } });
    }

    await this.audit.record({
      action: this.config.archivable ? 'ARCHIVE' : 'DELETE',
      entityType: this.config.entityType,
      entityId: id,
      entityLabel: this.labelOf(existing),
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
    await this.revalidateFor(existing);
  }

  async restore(id: string, ctx: CrudContext): Promise<TDto> {
    this.assertPermission(ctx, 'update');
    if (!this.config.archivable) {
      throw new BadRequestException(
        `${this.config.singular} cannot be archived, so it cannot be restored.`,
      );
    }
    const restored = await this.delegate.update({
      where: { id },
      data: { archivedAt: null, ...(this.config.publishable ? { status: 'DRAFT' } : {}) },
      include: this.config.include,
    });
    await this.audit.record({
      action: 'RESTORE',
      entityType: this.config.entityType,
      entityId: id,
      entityLabel: this.labelOf(restored),
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
    return this.toAdminDto(restored);
  }

  async duplicate(id: string, ctx: CrudContext): Promise<TDto> {
    this.assertPermission(ctx, 'create');
    const existing = await this.requireRow(id);

    const data: Record<string, unknown> = { ...this.scalarFields(existing) };
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.seoId;
    delete data.publishedAt;
    delete data.scheduledAt;
    delete data.archivedAt;

    if (this.config.publishable) data.status = 'DRAFT';
    if (this.config.publishable) data.version = 1;
    if (this.config.featuredField) data[this.config.featuredField] = false;

    const label = `${this.labelOf(existing)} (copy)`;
    data[this.config.labelField] = label;
    if (this.config.sluggable) {
      data.slug = await this.ensureUniqueSlug(slugify(label), null);
    }

    const created = await this.delegate.create({ data, include: this.config.include });

    await this.writeRevision(created, ctx, 'DUPLICATED', `Duplicated from ${id}`);
    await this.audit.record({
      action: 'CREATE',
      entityType: this.config.entityType,
      entityId: created.id,
      entityLabel: label,
      summary: `Duplicated from ${id}`,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });

    return this.toAdminDto(created);
  }

  async reorder(ids: string[], ctx: CrudContext): Promise<void> {
    this.assertPermission(ctx, 'update');
    if (!this.config.reorderable) {
      throw new BadRequestException(`${this.config.singular} does not support manual ordering.`);
    }
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('The reorder request contains duplicate identifiers.');
    }

    // The delegate is structurally typed, so Prisma cannot see these as
    // PrismaPromise; they are, and the transaction is applied atomically.
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.delegate.update({ where: { id }, data: { sortOrder: index } }),
      ) as any,
    );

    await this.audit.record({
      action: 'UPDATE',
      entityType: this.config.entityType,
      summary: `Reordered ${ids.length} records`,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
    await this.revalidation.revalidate(this.config.entityType);
  }

  // -------------------------------------------------------------------------
  // Revisions
  // -------------------------------------------------------------------------

  async listRevisions(id: string, ctx: CrudContext) {
    this.assertPermission(ctx, 'read');
    const revisions = await this.prisma.pageRevision.findMany({
      where: { entityType: this.config.entityType, entityId: id },
      orderBy: { version: 'desc' },
      take: 50,
      include: { editor: { select: { id: true, name: true } } },
    });
    return revisions.map((revision) => ({
      id: revision.id,
      entityType: revision.entityType,
      entityId: revision.entityId,
      version: revision.version,
      action: revision.action,
      statusAfter: revision.statusAfter,
      changeSummary: revision.changeSummary,
      editor: revision.editor ? { id: revision.editor.id, name: revision.editor.name } : null,
      createdAt: revision.createdAt.toISOString(),
    }));
  }

  async restoreRevision(id: string, version: number, ctx: CrudContext): Promise<TDto> {
    this.assertPermission(ctx, 'update');

    const revision = await this.prisma.pageRevision.findUnique({
      where: {
        entityType_entityId_version: { entityType: this.config.entityType, entityId: id, version },
      },
    });
    if (!revision) throw new NotFoundException('That revision does not exist.');

    const snapshot = revision.snapshot as Record<string, unknown>;
    const data = { ...snapshot };
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    // A restore never republishes on its own; the editor publishes explicitly.
    if (this.config.publishable) {
      data.status = 'DRAFT';
      data.version = ((await this.requireRow(id)).version ?? 1) + 1;
    }

    const restored = await this.delegate.update({
      where: { id },
      data,
      include: this.config.include,
    });

    await this.writeRevision(restored, ctx, 'RESTORED', `Restored version ${version}`);
    await this.audit.record({
      action: 'RESTORE',
      entityType: this.config.entityType,
      entityId: id,
      entityLabel: this.labelOf(restored),
      summary: `Restored revision ${version}`,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });

    return this.toAdminDto(restored);
  }

  protected async writeRevision(
    row: any,
    ctx: CrudContext,
    action:
      | 'SAVED'
      | 'SUBMITTED_FOR_REVIEW'
      | 'PUBLISHED'
      | 'UNPUBLISHED'
      | 'SCHEDULED'
      | 'ARCHIVED'
      | 'RESTORED'
      | 'DUPLICATED',
    changeSummary?: string,
  ): Promise<void> {
    const last = await this.prisma.pageRevision.findFirst({
      where: { entityType: this.config.entityType, entityId: row.id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    await this.prisma.pageRevision.create({
      data: {
        entityType: this.config.entityType,
        entityId: row.id,
        version: (last?.version ?? 0) + 1,
        editorId: ctx.user.id,
        changeSummary: changeSummary?.slice(0, 300) ?? null,
        action,
        statusAfter: (row.status as PublicationStatus) ?? 'PUBLISHED',
        snapshot: this.snapshot(row) as object,
      },
    });
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  protected labelOf(row: any): string {
    return String(row?.[this.config.labelField] ?? row?.id ?? 'record');
  }

  /** Scalar columns only - relations are dropped so a snapshot stays writable. */
  protected scalarFields(row: any): Record<string, unknown> {
    const omit = new Set(this.config.snapshotOmit ?? []);
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row ?? {})) {
      if (omit.has(key)) continue;
      if (value === null || value === undefined) {
        out[key] = value;
        continue;
      }
      if (value instanceof Date) {
        out[key] = value;
        continue;
      }
      if (Array.isArray(value)) {
        // Keep string arrays (benefits, capabilities); drop relation arrays.
        if (value.every((item) => typeof item === 'string')) out[key] = value;
        continue;
      }
      if (typeof value === 'object') continue;
      out[key] = value;
    }
    return out;
  }

  protected snapshot(row: any): Record<string, unknown> {
    const scalars = this.scalarFields(row);
    return JSON.parse(
      JSON.stringify(scalars, (_key, value) =>
        value instanceof Date ? value.toISOString() : value,
      ),
    );
  }

  protected isPublishTransition(from: string, to: string | undefined): boolean {
    if (!to) return false;
    return (to === 'PUBLISHED' || to === 'SCHEDULED') && from !== to;
  }

  protected async ensureUniqueSlug(desired: string, excludeId: string | null): Promise<string> {
    const base = slugify(desired);
    if (!base) throw new BadRequestException('A slug could not be derived from the supplied name.');

    const conflicts = await this.delegate.findMany({
      where: { slug: { startsWith: base }, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { slug: true },
    });
    return uniqueSlug(
      base,
      conflicts.map((row: any) => row.slug as string),
    );
  }

  /**
   * When a published record's slug changes, create a 301 so existing links and
   * indexed results keep working. Opt out per request with
   * `createRedirectOnSlugChange: false`.
   */
  protected async handleSlugChange(
    existing: any,
    newSlug: string,
    input: any,
    ctx: CrudContext,
  ): Promise<{ source: string; destination: string } | null> {
    const wasLive = !this.config.publishable || existing.status === 'PUBLISHED';
    if (!this.config.publicBasePath || !wasLive || input.createRedirectOnSlugChange === false) {
      return null;
    }

    const proposal = buildSlugChangeRedirect({
      basePath: this.config.publicBasePath,
      oldSlug: existing.slug,
      newSlug,
    });

    const clash = await this.prisma.redirectRule.findUnique({ where: { source: proposal.source } });
    if (clash) return null;

    await this.prisma.redirectRule.create({
      data: {
        source: proposal.source,
        destination: proposal.destination,
        status: 'PERMANENT_301',
        reason: proposal.reason,
        isActive: true,
        createdById: ctx.user.id,
      },
    });

    await this.audit.record({
      action: 'CREATE',
      entityType: 'REDIRECT_RULE',
      entityLabel: proposal.source,
      summary: proposal.reason,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });

    return { source: proposal.source, destination: proposal.destination };
  }

  protected async revalidateFor(row: any, previous?: any): Promise<void> {
    const featured = this.config.featuredField
      ? Boolean(row?.[this.config.featuredField] || previous?.[this.config.featuredField])
      : false;
    await this.revalidation.revalidate(this.config.entityType, row?.slug ?? null, featured);
    // A slug change has to clear the old path's cache entry as well.
    if (previous?.slug && previous.slug !== row?.slug) {
      await this.revalidation.revalidate(this.config.entityType, previous.slug, featured);
    }
  }
}
