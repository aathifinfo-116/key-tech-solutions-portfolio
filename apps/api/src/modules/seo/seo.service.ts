/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ContentEntityType,
  Paginated,
  RedirectRuleDto,
  SeoHealthDto,
  SitemapEntryDto,
} from '@kts/shared-types';
import { REDIRECT_HTTP_CODE } from '@kts/shared-types';
import {
  auditAll,
  buildSitemapEntries,
  type AuditableEntity,
  type SitemapSourceEntry,
} from '@kts/seo';
import { normalisePath, publicVisibilityWhere, validateRedirect } from '@kts/validation';
import { AppConfig } from '../../config/app-config';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RevalidationService } from '../../common/revalidation/revalidation.service';
import { normalisePaging, paginate, toSkipTake } from '../../common/utils/pagination';
import type { CrudContext, CrudListQuery } from '../../common/crud/crud.types';

/** One row of the sitemap/audit sweep: which table, at which public path. */
interface SeoSource {
  entityType: ContentEntityType;
  basePath: string;
  adminPath: string;
  labelField: string;
  defaultPriority: number;
  rows: any[];
}

@Injectable()
export class SeoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly revalidation: RevalidationService,
    private readonly config: AppConfig,
  ) {}

  private assert(ctx: CrudContext, permission: string): void {
    if (!ctx.user.permissions.includes(permission)) {
      throw new ForbiddenException(
        `Your role does not include the required permission: ${permission}.`,
      );
    }
  }

  // -------------------------------------------------------------------------
  // Redirects
  // -------------------------------------------------------------------------

  async listRedirects(query: CrudListQuery, ctx: CrudContext): Promise<Paginated<RedirectRuleDto>> {
    this.assert(ctx, 'redirects:read');
    const paging = normalisePaging(query);
    const { skip, take } = toSkipTake(paging);

    const where = query.search
      ? {
          OR: [
            { source: { contains: String(query.search), mode: 'insensitive' as const } },
            { destination: { contains: String(query.search), mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.redirectRule.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.redirectRule.count({ where }),
    ]);

    return paginate(rows.map(mapRedirect), paging, total);
  }

  async createRedirect(input: any, ctx: CrudContext): Promise<RedirectRuleDto> {
    this.assert(ctx, 'redirects:create');

    const existing = await this.prisma.redirectRule.findMany({
      select: { source: true, destination: true, status: true, isActive: true },
    });

    const result = validateRedirect(
      { source: input.source, destination: input.destination, status: input.status },
      { existing, allowedExternalHosts: this.config.allowedRedirectHosts },
    );
    if (!result.ok || !result.normalised) {
      throw new BadRequestException({
        message: 'The redirect could not be created.',
        details: result.errors.map((message) => ({ path: 'source', message })),
      });
    }

    const row = await this.prisma.redirectRule.create({
      data: {
        source: result.normalised.source,
        destination: result.normalised.destination,
        status: input.status ?? 'PERMANENT_301',
        reason: input.reason ?? null,
        isActive: input.isActive ?? true,
        createdById: ctx.user.id,
      },
    });

    await this.audit.record({
      action: 'CREATE',
      entityType: 'REDIRECT_RULE',
      entityId: row.id,
      entityLabel: row.source,
      summary: `${row.source} -> ${row.destination || '(410 Gone)'} [${row.status}]`,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
    await this.revalidation.revalidate('REDIRECT_RULE');

    return mapRedirect(row);
  }

  async updateRedirect(id: string, input: any, ctx: CrudContext): Promise<RedirectRuleDto> {
    this.assert(ctx, 'redirects:update');

    const current = await this.prisma.redirectRule.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('That redirect does not exist.');

    const existing = await this.prisma.redirectRule.findMany({
      where: { id: { not: id } },
      select: { source: true, destination: true, status: true, isActive: true },
    });

    const result = validateRedirect(
      { source: input.source, destination: input.destination, status: input.status },
      { existing, allowedExternalHosts: this.config.allowedRedirectHosts },
    );
    if (!result.ok || !result.normalised) {
      throw new BadRequestException({
        message: 'The redirect could not be saved.',
        details: result.errors.map((message) => ({ path: 'source', message })),
      });
    }

    const row = await this.prisma.redirectRule.update({
      where: { id },
      data: {
        source: result.normalised.source,
        destination: result.normalised.destination,
        status: input.status,
        reason: input.reason ?? null,
        isActive: input.isActive ?? true,
      },
    });

    await this.audit.record({
      action: 'UPDATE',
      entityType: 'REDIRECT_RULE',
      entityId: id,
      entityLabel: row.source,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
    await this.revalidation.revalidate('REDIRECT_RULE');

    return mapRedirect(row);
  }

  async deleteRedirect(id: string, ctx: CrudContext): Promise<void> {
    this.assert(ctx, 'redirects:delete');
    const row = await this.prisma.redirectRule.delete({ where: { id } });
    await this.audit.record({
      action: 'DELETE',
      entityType: 'REDIRECT_RULE',
      entityId: id,
      entityLabel: row.source,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
    await this.revalidation.revalidate('REDIRECT_RULE');
  }

  /**
   * Resolves an incoming path for the website's middleware.
   * Hit counting is fire-and-forget so a redirect never waits on a write.
   */
  async resolveRedirect(path: string): Promise<{ destination: string; statusCode: number } | null> {
    const source = normalisePath(path);
    const rule = await this.prisma.redirectRule.findFirst({ where: { source, isActive: true } });
    if (!rule) return null;

    void this.prisma.redirectRule
      .update({
        where: { id: rule.id },
        data: { hitCount: { increment: 1 }, lastHitAt: new Date() },
      })
      .catch(() => undefined);

    return { destination: rule.destination, statusCode: REDIRECT_HTTP_CODE[rule.status] };
  }

  /**
   * Resolves an incoming path completely: a redirect rule if one matches,
   * otherwise whether the path is a content detail URL with nothing publicly
   * visible behind it.
   *
   * The website's middleware needs `missing` because Next.js caches a
   * `notFound()` render from an incremental-static route and then replays it
   * with a 200, which would turn every dead slug into a soft 404. Knowing
   * up-front that nothing is there lets the site answer with a real 404.
   *
   * `missing` is deliberately conservative: it is only ever true for a path
   * that matches one of the detail patterns below. Anything else - listing
   * pages, static pages, unknown top-level paths - is left to Next's own
   * routing, which already returns a correct status for it.
   */
  async resolveRoute(
    path: string,
  ): Promise<{ redirect: { destination: string; statusCode: number } | null; missing: boolean }> {
    const redirect = await this.resolveRedirect(path);
    if (redirect) return { redirect, missing: false };

    return { redirect: null, missing: await this.isMissingDetailPath(normalisePath(path)) };
  }

  /**
   * True when the path looks like `/<section>/<slug>` for a known section and
   * no publicly visible row answers to that slug. The visibility test is the
   * same `publicVisibilityWhere()` rule the public API and the sitemap use,
   * so the middleware can never disagree with the page it is guarding.
   */
  private async isMissingDetailPath(path: string): Promise<boolean> {
    const match = /^\/([a-z-]+)\/([A-Za-z0-9-]+)$/.exec(path);
    if (!match) return false;

    const [, section, slug] = match;
    const visible = publicVisibilityWhere() as any;

    const lookup: Record<string, () => Promise<unknown>> = {
      services: () =>
        this.prisma.service.findFirst({ where: { slug, ...visible }, select: { id: true } }),
      solutions: () =>
        this.prisma.solution.findFirst({ where: { slug, ...visible }, select: { id: true } }),
      industries: () =>
        this.prisma.industry.findFirst({ where: { slug, ...visible }, select: { id: true } }),
      products: () =>
        this.prisma.product.findFirst({ where: { slug, ...visible }, select: { id: true } }),
      portfolio: () =>
        this.prisma.portfolioProject.findFirst({
          where: { slug, ...visible, projectStatus: { not: 'PRIVATE' } },
          select: { id: true },
        }),
      'case-studies': () =>
        this.prisma.caseStudy.findFirst({ where: { slug, ...visible }, select: { id: true } }),
      blog: () =>
        this.prisma.blogPost.findFirst({ where: { slug, ...visible }, select: { id: true } }),
      careers: () =>
        this.prisma.career.findFirst({
          where: { slug, careerStatus: 'OPEN', archivedAt: null },
          select: { id: true },
        }),
    };

    const find = lookup[section];
    if (!find) return false;

    return (await find()) === null;
  }

  // -------------------------------------------------------------------------
  // Sitemap
  // -------------------------------------------------------------------------

  /** Collects every publicly visible entity that carries SEO settings. */
  private async collectSources(): Promise<SeoSource[]> {
    const visible = publicVisibilityWhere();
    const withSeo = { seo: true } as const;

    const [
      pages,
      services,
      solutions,
      industries,
      products,
      projects,
      caseStudies,
      posts,
      careers,
    ] = await Promise.all([
      this.prisma.page.findMany({ where: visible as any, include: withSeo }),
      this.prisma.service.findMany({ where: visible as any, include: withSeo }),
      this.prisma.solution.findMany({ where: visible as any, include: withSeo }),
      this.prisma.industry.findMany({ where: visible as any, include: withSeo }),
      this.prisma.product.findMany({ where: visible as any, include: withSeo }),
      this.prisma.portfolioProject.findMany({
        // A PRIVATE project is excluded even when its workflow status is published.
        where: { ...(visible as any), projectStatus: { not: 'PRIVATE' } },
        include: withSeo,
      }),
      this.prisma.caseStudy.findMany({ where: visible as any, include: withSeo }),
      this.prisma.blogPost.findMany({ where: visible as any, include: withSeo }),
      this.prisma.career.findMany({
        where: { careerStatus: 'OPEN', archivedAt: null },
        include: withSeo,
      }),
    ]);

    return [
      {
        entityType: 'PAGE',
        basePath: '',
        adminPath: '/website/pages',
        labelField: 'title',
        defaultPriority: 0.8,
        rows: pages,
      },
      {
        entityType: 'SERVICE',
        basePath: '/services',
        adminPath: '/offerings/services',
        labelField: 'name',
        defaultPriority: 0.8,
        rows: services,
      },
      {
        entityType: 'SOLUTION',
        basePath: '/solutions',
        adminPath: '/offerings/solutions',
        labelField: 'name',
        defaultPriority: 0.7,
        rows: solutions,
      },
      {
        entityType: 'INDUSTRY',
        basePath: '/industries',
        adminPath: '/offerings/industries',
        labelField: 'name',
        defaultPriority: 0.6,
        rows: industries,
      },
      {
        entityType: 'PRODUCT',
        basePath: '/products',
        adminPath: '/offerings/products',
        labelField: 'name',
        defaultPriority: 0.9,
        rows: products,
      },
      {
        entityType: 'PORTFOLIO_PROJECT',
        basePath: '/portfolio',
        adminPath: '/portfolio/projects',
        labelField: 'title',
        defaultPriority: 0.6,
        rows: projects,
      },
      {
        entityType: 'CASE_STUDY',
        basePath: '/case-studies',
        adminPath: '/portfolio/case-studies',
        labelField: 'title',
        defaultPriority: 0.6,
        rows: caseStudies,
      },
      {
        entityType: 'BLOG_POST',
        basePath: '/blog',
        adminPath: '/content/blog',
        labelField: 'title',
        defaultPriority: 0.5,
        rows: posts,
      },
      {
        entityType: 'CAREER',
        basePath: '/careers',
        adminPath: '/company/careers',
        labelField: 'title',
        defaultPriority: 0.5,
        rows: careers,
      },
    ];
  }

  async sitemap(): Promise<SitemapEntryDto[]> {
    const sources = await this.collectSources();

    const entries: SitemapSourceEntry[] = [];

    for (const source of sources) {
      for (const row of source.rows) {
        const path =
          source.entityType === 'PAGE'
            ? (row.path ?? `/${row.slug}`)
            : `${source.basePath}/${row.slug}`;
        if (source.entityType === 'PAGE' && row.showInSitemap === false) continue;

        entries.push({
          path,
          lastModified: row.updatedAt,
          changeFrequency: row.seo?.sitemapFrequency ?? 'WEEKLY',
          priority: row.seo?.sitemapPriority ?? source.defaultPriority,
          isIndexable: row.seo?.robotsIndex ?? true,
          includeInSitemap: row.seo?.includeInSitemap ?? true,
        });
      }
    }

    // Listing pages that are generated by the application rather than stored.
    const listings: Array<[string, number]> = [
      ['/services', 0.9],
      ['/solutions', 0.8],
      ['/products', 0.9],
      ['/industries', 0.6],
      ['/portfolio', 0.8],
      ['/case-studies', 0.7],
      ['/process', 0.6],
      ['/technology', 0.5],
      ['/blog', 0.7],
      ['/careers', 0.6],
      ['/contact', 0.7],
      ['/request-a-quote', 0.7],
      ['/about', 0.8],
    ];
    const now = new Date();
    for (const [path, priority] of listings) {
      entries.push({
        path,
        lastModified: now,
        changeFrequency: 'WEEKLY',
        priority,
        isIndexable: true,
        includeInSitemap: true,
      });
    }

    return buildSitemapEntries(entries);
  }

  // -------------------------------------------------------------------------
  // Editorial SEO health
  // -------------------------------------------------------------------------

  /**
   * Builds the admin SEO health report.
   *
   * The score is an internal editorial completeness score from our own
   * checklist. It does not represent or predict search engine ranking.
   */
  async health(ctx: CrudContext): Promise<SeoHealthDto> {
    this.assert(ctx, 'seo:read');

    const sources = await this.collectSources();
    const entities: AuditableEntity[] = [];

    for (const source of sources) {
      for (const row of source.rows) {
        const path =
          source.entityType === 'PAGE'
            ? (row.path ?? `/${row.slug}`)
            : `${source.basePath}/${row.slug}`;
        const label = String(row[source.labelField] ?? row.slug);

        entities.push({
          entityType: source.entityType,
          entityId: row.id,
          label,
          adminPath: `${source.adminPath}/${row.id}`,
          publicPath: path,
          isPublished: true,
          seoTitle: row.seo?.title ?? null,
          seoDescription: row.seo?.description ?? null,
          canonicalUrl: row.seo?.canonicalUrl ?? null,
          ogImageUrl: row.seo?.ogImageId ? 'set' : null,
          robotsIndex: row.seo?.robotsIndex ?? true,
          includeInSitemap: row.seo?.includeInSitemap ?? true,
          // Every public template renders the record's name/title as its H1.
          h1: label,
          images: row.coverImageId ? [{ url: 'cover', altText: 'cover' }] : [],
          slug: row.slug ?? null,
          brokenRelationIds: [],
          isOrphan: false,
        });
      }
    }

    return auditAll(entities);
  }
}

function mapRedirect(row: any): RedirectRuleDto {
  return {
    id: row.id,
    source: row.source,
    destination: row.destination,
    status: row.status,
    httpStatus: REDIRECT_HTTP_CODE[row.status as keyof typeof REDIRECT_HTTP_CODE],
    reason: row.reason,
    isActive: row.isActive,
    hitCount: row.hitCount,
    createdAt: row.createdAt.toISOString(),
  };
}
