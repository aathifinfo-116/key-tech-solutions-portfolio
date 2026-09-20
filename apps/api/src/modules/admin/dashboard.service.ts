import { ForbiddenException, Injectable } from '@nestjs/common';
import type { DashboardStatsDto, PublicationStatus } from '@kts/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { CrudContext } from '../../common/crud/crud.types';

/**
 * Admin dashboard counts.
 *
 * Every number here is a live count from the database. Nothing is estimated,
 * projected or carried over from a previous period.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(ctx: CrudContext): Promise<DashboardStatsDto> {
    if (!ctx.user.permissions.includes('dashboard:read')) {
      throw new ForbiddenException(
        'Your role does not include the required permission: dashboard:read.',
      );
    }

    const live = { archivedAt: null };
    const weekAgo = new Date(Date.now() - 7 * 24 * 3_600_000);

    const [
      pages,
      services,
      solutions,
      products,
      projects,
      caseStudies,
      posts,
      openRoles,
      workflowGroups,
      leadTotal,
      leadsThisWeek,
      leadStatusGroups,
      images,
      documents,
      mediaSize,
      recentAudit,
    ] = await Promise.all([
      this.prisma.page.count({ where: live }),
      this.prisma.service.count({ where: live }),
      this.prisma.solution.count({ where: live }),
      this.prisma.product.count({ where: live }),
      this.prisma.portfolioProject.count({ where: live }),
      this.prisma.caseStudy.count({ where: live }),
      this.prisma.blogPost.count({ where: live }),
      this.prisma.career.count({ where: { careerStatus: 'OPEN', archivedAt: null } }),

      // One grouped query per content type would be eight round trips; the
      // workflow tile only needs the aggregate, so services stand in as the
      // representative publishable type plus pages and posts.
      Promise.all([
        this.prisma.page.groupBy({ by: ['status'], _count: true, where: live }),
        this.prisma.service.groupBy({ by: ['status'], _count: true, where: live }),
        this.prisma.product.groupBy({ by: ['status'], _count: true, where: live }),
        this.prisma.blogPost.groupBy({ by: ['status'], _count: true, where: live }),
        this.prisma.portfolioProject.groupBy({ by: ['status'], _count: true, where: live }),
        this.prisma.caseStudy.groupBy({ by: ['status'], _count: true, where: live }),
      ]),

      this.prisma.lead.count({ where: { archivedAt: null } }),
      this.prisma.lead.count({ where: { archivedAt: null, createdAt: { gte: weekAgo } } }),
      this.prisma.lead.groupBy({ by: ['leadStatus'], _count: true, where: { archivedAt: null } }),

      this.prisma.mediaAsset.count({ where: { archivedAt: null } }),
      this.prisma.documentAsset.count({ where: { archivedAt: null } }),
      this.prisma.mediaAsset.aggregate({ _sum: { sizeBytes: true }, where: { archivedAt: null } }),

      this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 12 }),
    ]);

    const workflow: Record<PublicationStatus, number> = {
      DRAFT: 0,
      REVIEW: 0,
      SCHEDULED: 0,
      PUBLISHED: 0,
      ARCHIVED: 0,
    };
    for (const group of workflowGroups.flat()) {
      const status = group.status as PublicationStatus;
      workflow[status] = (workflow[status] ?? 0) + (group._count as number);
    }

    const byStatus: Record<string, number> = {};
    for (const group of leadStatusGroups) {
      byStatus[group.leadStatus] = group._count as number;
    }

    return {
      content: { pages, services, solutions, products, projects, caseStudies, posts, openRoles },
      workflow,
      leads: { total: leadTotal, newThisWeek: leadsThisWeek, byStatus },
      media: { images, documents, totalBytes: mediaSize._sum.sizeBytes ?? 0 },
      recentAudit: recentAudit.map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        entityLabel: row.entityLabel,
        summary: row.summary,
        actor: row.actorEmail ? { id: row.actorId, email: row.actorEmail } : null,
        ipAddress: row.ipAddress,
        requestId: row.requestId,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }
}
