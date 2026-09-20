/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  BlogPostDto,
  BlogPostSummaryDto,
  CareerDto,
  CareerSummaryDto,
  CaseStudyDto,
  CaseStudySummaryDto,
  CompanyMilestoneDto,
  CompanyValueDto,
  IndustryDto,
  IndustrySummaryDto,
  PageDto,
  Paginated,
  PortfolioProjectDto,
  PortfolioSummaryDto,
  ProcessPhaseDto,
  ProductDto,
  ProductSummaryDto,
  ServiceDto,
  ServiceSummaryDto,
  SolutionDto,
  SolutionSummaryDto,
  StatisticDto,
  TeamMemberDto,
  TechnologyGroupDto,
  TestimonialDto,
} from '@kts/shared-types';
import { PAGINATION } from '@kts/config';
import { publicVisibilityWhere } from '@kts/validation';
import { PrismaService } from '../../common/prisma/prisma.service';
import { STORAGE_PROVIDER, type StorageProvider } from '../../common/storage/storage.interface';
import { mapMedia, type MediaUrlResolver } from '../../common/utils/mappers';
import { normalisePaging, paginate, toSkipTake } from '../../common/utils/pagination';
import { loadGallery } from '../content/content.helpers';
import {
  blogDetailInclude,
  blogSummaryInclude,
  caseStudyDetailInclude,
  caseStudySummaryInclude,
  careerDetailInclude,
  industryDetailInclude,
  industrySummaryInclude,
  pageDetailInclude,
  portfolioDetailInclude,
  portfolioSummaryInclude,
  productDetailInclude,
  productSummaryInclude,
  serviceDetailInclude,
  serviceSummaryInclude,
  solutionDetailInclude,
  solutionSummaryInclude,
} from '../content/content.includes';
import {
  mapBlogPost,
  mapBlogSummary,
  mapCareer,
  mapCareerSummary,
  mapCaseStudy,
  mapCaseStudySummary,
  mapIndustry,
  mapIndustrySummary,
  mapPage,
  mapPortfolioProject,
  mapPortfolioSummary,
  mapProduct,
  mapProductSummary,
  mapService,
  mapServiceSummary,
  mapSolution,
  mapSolutionSummary,
  mapTeamMember,
  mapTechnologySummary,
  mapTestimonial,
} from '../content/content.mappers';

/**
 * Public read API.
 *
 * One rule decides visibility everywhere: `publicVisibilityWhere()`. Drafts,
 * items in review, future-dated schedules and archived records are filtered
 * in the query, so they cannot leak through a listing, a related-content
 * block, the sitemap or a detail route.
 */
@Injectable()
export class PublicService {
  private readonly resolver: MediaUrlResolver;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {
    this.resolver = { publicUrl: (key: string) => this.storage.publicUrl(key) };
  }

  private get visible() {
    return publicVisibilityWhere() as any;
  }

  // -------------------------------------------------------------------------
  // Pages
  // -------------------------------------------------------------------------

  async homepage(): Promise<PageDto> {
    const page = await this.prisma.page.findFirst({
      where: { slug: 'home', ...this.visible },
      include: pageDetailInclude,
    });
    if (!page) throw new NotFoundException('The homepage has not been published yet.');
    return this.hydratePage(page);
  }

  async page(slug: string): Promise<PageDto> {
    const page = await this.prisma.page.findFirst({
      where: { slug, ...this.visible },
      include: pageDetailInclude,
    });
    if (!page) throw new NotFoundException('Page not found.');
    return this.hydratePage(page);
  }

  /** Resolves data-driven sections so a page renders in a single round trip. */
  private async hydratePage(page: any): Promise<PageDto> {
    const now = new Date();
    const sections = (page.sections ?? []).filter(
      (section: any) =>
        section.isVisible &&
        (!section.visibleFrom || section.visibleFrom <= now) &&
        (!section.visibleUntil || section.visibleUntil >= now),
    );

    const data = new Map<string, Record<string, unknown>>();

    for (const section of sections) {
      const ids: string[] = section.relatedIds ?? [];
      const limit = Number((section.settings as any)?.limit ?? 6);

      switch (section.type) {
        case 'SERVICE_GRID':
          data.set(section.id, { services: await this.pickServices(ids, limit) });
          break;
        case 'PRODUCT_GRID':
          data.set(section.id, { products: await this.pickProducts(ids, limit) });
          break;
        case 'SOLUTION_GRID':
          data.set(section.id, { solutions: await this.pickSolutions(ids, limit) });
          break;
        case 'INDUSTRY_GRID':
          data.set(section.id, { industries: (await this.industries({ pageSize: limit })).items });
          break;
        case 'PORTFOLIO_GRID':
          data.set(section.id, { projects: await this.pickProjects(ids, limit) });
          break;
        case 'CASE_STUDY':
          data.set(section.id, {
            caseStudies: (await this.caseStudies({ pageSize: limit })).items,
          });
          break;
        case 'BLOG_PREVIEW':
          data.set(section.id, { posts: (await this.posts({ pageSize: limit })).items });
          break;
        case 'PROCESS_STEPS':
          data.set(section.id, { processPhases: await this.processPhases() });
          break;
        case 'STATISTICS':
          data.set(section.id, {
            statistics: await this.statistics(String((section.settings as any)?.group ?? 'home')),
          });
          break;
        case 'VALUES':
          data.set(section.id, { values: await this.values() });
          break;
        case 'TIMELINE':
          data.set(section.id, { milestones: await this.milestones() });
          break;
        case 'TEAM':
          data.set(section.id, { team: await this.team() });
          break;
        case 'TESTIMONIALS':
          data.set(section.id, { testimonials: await this.testimonials() });
          break;
        case 'LOGO_CLOUD':
          data.set(section.id, { clients: await this.clients() });
          break;
        case 'TECHNOLOGY_GRID':
          data.set(section.id, { technologies: await this.technologies() });
          break;
        case 'IMAGE_GALLERY':
          data.set(section.id, {
            gallery: (await loadGallery(this.prisma, 'PAGE_SECTION', section.id)).map((m) =>
              mapMedia(m, this.resolver),
            ),
          });
          break;
        default:
          break;
      }
    }

    return mapPage({ ...page, sections }, this.resolver, data) as PageDto;
  }

  private async pickServices(ids: string[], limit: number): Promise<ServiceSummaryDto[]> {
    const rows = await this.prisma.service.findMany({
      where: { ...this.visible, ...(ids.length > 0 ? { id: { in: ids } } : { isFeatured: true }) },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: limit,
      include: serviceSummaryInclude,
    });
    return rows.map((row) => mapServiceSummary(row, this.resolver));
  }

  private async pickProducts(ids: string[], limit: number): Promise<ProductSummaryDto[]> {
    const rows = await this.prisma.product.findMany({
      where: { ...this.visible, ...(ids.length > 0 ? { id: { in: ids } } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: limit,
      include: productSummaryInclude,
    });
    return rows.map((row) => mapProductSummary(row, this.resolver));
  }

  private async pickSolutions(ids: string[], limit: number): Promise<SolutionSummaryDto[]> {
    const rows = await this.prisma.solution.findMany({
      where: { ...this.visible, ...(ids.length > 0 ? { id: { in: ids } } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: limit,
      include: solutionSummaryInclude,
    });
    return rows.map((row) => mapSolutionSummary(row, this.resolver));
  }

  private async pickProjects(ids: string[], limit: number): Promise<PortfolioSummaryDto[]> {
    const rows = await this.prisma.portfolioProject.findMany({
      where: {
        ...this.visible,
        projectStatus: { not: 'PRIVATE' },
        ...(ids.length > 0 ? { id: { in: ids } } : { isFeatured: true }),
      },
      orderBy: [{ sortOrder: 'asc' }, { completionDate: 'desc' }],
      take: limit,
      include: portfolioSummaryInclude,
    });
    return rows.map((row) => mapPortfolioSummary(row, this.resolver));
  }

  // -------------------------------------------------------------------------
  // Offerings
  // -------------------------------------------------------------------------

  async services(query: any = {}): Promise<Paginated<ServiceSummaryDto>> {
    const paging = normalisePaging(query);
    const { skip, take } = toSkipTake(paging);
    const where: any = { ...this.visible };
    if (query.category) where.category = { slug: query.category };
    if (query.featured) where.isFeatured = true;

    const [rows, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip,
        take,
        include: serviceSummaryInclude,
      }),
      this.prisma.service.count({ where }),
    ]);
    return paginate(
      rows.map((row) => mapServiceSummary(row, this.resolver)),
      paging,
      total,
    );
  }

  async service(slug: string): Promise<ServiceDto> {
    const row = await this.prisma.service.findFirst({
      where: { slug, ...this.visible },
      include: serviceDetailInclude,
    });
    if (!row) throw new NotFoundException('Service not found.');
    return mapService(
      { ...row, __gallery: await loadGallery(this.prisma, 'SERVICE', row.id) },
      this.resolver,
    );
  }

  async solutions(query: any = {}): Promise<Paginated<SolutionSummaryDto>> {
    const paging = normalisePaging(query);
    const { skip, take } = toSkipTake(paging);
    const where: any = { ...this.visible };
    if (query.industry) where.industries = { some: { slug: query.industry } };

    const [rows, total] = await Promise.all([
      this.prisma.solution.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip,
        take,
        include: solutionSummaryInclude,
      }),
      this.prisma.solution.count({ where }),
    ]);
    return paginate(
      rows.map((row) => mapSolutionSummary(row, this.resolver)),
      paging,
      total,
    );
  }

  async solution(slug: string): Promise<SolutionDto> {
    const row = await this.prisma.solution.findFirst({
      where: { slug, ...this.visible },
      include: solutionDetailInclude,
    });
    if (!row) throw new NotFoundException('Solution not found.');
    return mapSolution(
      { ...row, __gallery: await loadGallery(this.prisma, 'SOLUTION', row.id) },
      this.resolver,
    );
  }

  async industries(query: any = {}): Promise<Paginated<IndustrySummaryDto>> {
    const paging = normalisePaging(query);
    const { skip, take } = toSkipTake(paging);
    const [rows, total] = await Promise.all([
      this.prisma.industry.findMany({
        where: this.visible,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip,
        take,
        include: industrySummaryInclude,
      }),
      this.prisma.industry.count({ where: this.visible }),
    ]);
    return paginate(
      rows.map((row) => mapIndustrySummary(row, this.resolver)),
      paging,
      total,
    );
  }

  async industry(slug: string): Promise<IndustryDto> {
    const row = await this.prisma.industry.findFirst({
      where: { slug, ...this.visible },
      include: industryDetailInclude,
    });
    if (!row) throw new NotFoundException('Industry not found.');
    return mapIndustry(row, this.resolver);
  }

  async products(query: any = {}): Promise<Paginated<ProductSummaryDto>> {
    const paging = normalisePaging(query);
    const { skip, take } = toSkipTake(paging);
    const where: any = { ...this.visible };
    if (query.status) where.productStatus = query.status;

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip,
        take,
        include: productSummaryInclude,
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginate(
      rows.map((row) => mapProductSummary(row, this.resolver)),
      paging,
      total,
    );
  }

  async product(slug: string): Promise<ProductDto> {
    const row = await this.prisma.product.findFirst({
      where: { slug, ...this.visible },
      include: productDetailInclude,
    });
    if (!row) throw new NotFoundException('Product not found.');
    return mapProduct(
      { ...row, __gallery: await loadGallery(this.prisma, 'PRODUCT', row.id) },
      this.resolver,
    );
  }

  // -------------------------------------------------------------------------
  // Portfolio
  // -------------------------------------------------------------------------

  async projects(query: any = {}): Promise<Paginated<PortfolioSummaryDto>> {
    const paging = normalisePaging({ pageSize: PAGINATION.portfolioPageSize, ...query });
    const { skip, take } = toSkipTake(paging);
    const where: any = { ...this.visible, projectStatus: { not: 'PRIVATE' } };
    if (query.category) where.category = query.category;
    if (query.industry) where.industries = { some: { slug: query.industry } };

    const [rows, total] = await Promise.all([
      this.prisma.portfolioProject.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { completionDate: 'desc' }],
        skip,
        take,
        include: portfolioSummaryInclude,
      }),
      this.prisma.portfolioProject.count({ where }),
    ]);
    return paginate(
      rows.map((row) => mapPortfolioSummary(row, this.resolver)),
      paging,
      total,
    );
  }

  async project(slug: string): Promise<PortfolioProjectDto> {
    const row = await this.prisma.portfolioProject.findFirst({
      where: { slug, ...this.visible, projectStatus: { not: 'PRIVATE' } },
      include: portfolioDetailInclude,
    });
    if (!row) throw new NotFoundException('Project not found.');
    return mapPortfolioProject(
      { ...row, __gallery: await loadGallery(this.prisma, 'PORTFOLIO_PROJECT', row.id) },
      this.resolver,
    );
  }

  async caseStudies(query: any = {}): Promise<Paginated<CaseStudySummaryDto>> {
    const paging = normalisePaging(query);
    const { skip, take } = toSkipTake(paging);
    const [rows, total] = await Promise.all([
      this.prisma.caseStudy.findMany({
        where: this.visible,
        orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
        skip,
        take,
        include: caseStudySummaryInclude,
      }),
      this.prisma.caseStudy.count({ where: this.visible }),
    ]);
    return paginate(
      rows.map((row) => mapCaseStudySummary(row, this.resolver)),
      paging,
      total,
    );
  }

  async caseStudy(slug: string): Promise<CaseStudyDto> {
    const row = await this.prisma.caseStudy.findFirst({
      where: { slug, ...this.visible },
      include: caseStudyDetailInclude,
    });
    if (!row) throw new NotFoundException('Case study not found.');
    return mapCaseStudy(
      { ...row, __gallery: await loadGallery(this.prisma, 'CASE_STUDY', row.id) },
      this.resolver,
    );
  }

  // -------------------------------------------------------------------------
  // Company
  // -------------------------------------------------------------------------

  async processPhases(): Promise<ProcessPhaseDto[]> {
    const rows = await this.prisma.processPhase.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { number: 'asc' }],
      include: { image: true },
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      number: row.number,
      name: row.name,
      shortDescription: row.shortDescription,
      detailedDescription: row.detailedDescription,
      deliverables: row.deliverables,
      iconName: row.iconName,
      image: mapMedia(row.image, this.resolver),
    }));
  }

  async values(): Promise<CompanyValueDto[]> {
    const rows = await this.prisma.companyValue.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      iconName: row.iconName,
    }));
  }

  async milestones(): Promise<CompanyMilestoneDto[]> {
    const rows = await this.prisma.companyMilestone.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { occurredOn: 'asc' }],
      include: { image: true },
    });
    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      title: row.title,
      description: row.description,
      occurredOn: row.occurredOn?.toISOString() ?? null,
      image: mapMedia(row.image, this.resolver),
    }));
  }

  async statistics(group = 'home'): Promise<StatisticDto[]> {
    const rows = await this.prisma.statistic.findMany({
      where: { isActive: true, group },
      orderBy: [{ sortOrder: 'asc' }],
    });
    return rows.map((row) => ({
      id: row.id,
      key: row.key,
      label: row.label,
      value: row.value,
      numericValue: row.numericValue,
      prefix: row.prefix,
      suffix: row.suffix,
      description: row.description,
      isVerified: row.isVerified,
    }));
  }

  async technologies(): Promise<TechnologyGroupDto[]> {
    const categories = await this.prisma.technologyCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        technologies: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: { logo: true, category: true },
        },
      },
    });
    return categories
      .filter((category) => category.technologies.length > 0)
      .map((category) => ({
        category: { slug: category.slug, name: category.name, description: category.description },
        technologies: category.technologies.map((technology) =>
          mapTechnologySummary(technology, this.resolver),
        ),
      }));
  }

  async team(): Promise<TeamMemberDto[]> {
    const rows = await this.prisma.teamMember.findMany({
      where: this.visible,
      orderBy: [{ sortOrder: 'asc' }, { displayName: 'asc' }],
      include: { photo: true },
    });
    return rows.map((row) => mapTeamMember(row, this.resolver));
  }

  /** Only approved testimonials are ever returned. */
  async testimonials(): Promise<TestimonialDto[]> {
    const rows = await this.prisma.testimonial.findMany({
      where: { ...this.visible, OR: [{ isApproved: true }, { isSampleContent: true }] },
      orderBy: [{ sortOrder: 'asc' }],
      include: { photo: true },
    });
    return rows.map((row) => mapTestimonial(row, this.resolver));
  }

  async clients() {
    const rows = await this.prisma.client.findMany({
      where: { ...this.visible, OR: [{ isDisplayApproved: true }, { isSampleContent: true }] },
      orderBy: [{ sortOrder: 'asc' }],
      include: { logo: true },
    });
    return rows.map((row) => ({
      id: row.id,
      organization: row.organization,
      slug: row.slug,
      logo: mapMedia(row.logo, this.resolver),
      websiteUrl: row.websiteUrl,
      isSampleContent: row.isSampleContent,
    }));
  }

  // -------------------------------------------------------------------------
  // Blog
  // -------------------------------------------------------------------------

  async posts(query: any = {}): Promise<Paginated<BlogPostSummaryDto>> {
    const paging = normalisePaging({ pageSize: PAGINATION.blogPageSize, ...query });
    const { skip, take } = toSkipTake(paging);
    const where: any = { ...this.visible };
    if (query.category) where.category = { slug: query.category };
    if (query.tag) where.tags = { some: { tag: { slug: query.tag } } };
    if (query.featured) where.isFeatured = true;

    const [rows, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }],
        skip,
        take,
        include: blogSummaryInclude,
      }),
      this.prisma.blogPost.count({ where }),
    ]);
    return paginate(
      rows.map((row) => mapBlogSummary(row, this.resolver)),
      paging,
      total,
    );
  }

  async post(slug: string): Promise<BlogPostDto> {
    const row = await this.prisma.blogPost.findFirst({
      where: { slug, ...this.visible },
      include: blogDetailInclude,
    });
    if (!row) throw new NotFoundException('Article not found.');
    return mapBlogPost(row, this.resolver);
  }

  async blogCategories() {
    const rows = await this.prisma.blogCategory.findMany({
      where: { isActive: true, posts: { some: this.visible } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { posts: { where: this.visible } } } },
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      accentColor: row.accentColor,
      postCount: row._count.posts,
    }));
  }

  // -------------------------------------------------------------------------
  // Careers
  // -------------------------------------------------------------------------

  async careers(): Promise<CareerSummaryDto[]> {
    const rows = await this.prisma.career.findMany({
      where: { careerStatus: 'OPEN', archivedAt: null },
      orderBy: [{ publishedAt: 'desc' }, { title: 'asc' }],
    });
    return rows.map(mapCareerSummary);
  }

  async career(slug: string): Promise<CareerDto> {
    const row = await this.prisma.career.findFirst({
      where: { slug, careerStatus: 'OPEN', archivedAt: null },
      include: careerDetailInclude,
    });
    if (!row) throw new NotFoundException('That role is not currently open.');
    return mapCareer(row, this.resolver);
  }

  // -------------------------------------------------------------------------
  // Preview
  // -------------------------------------------------------------------------

  /**
   * Draft preview for authorised editors.
   *
   * Bypasses the visibility filter deliberately. The route that calls this is
   * protected by the preview secret and always responds noindex, and preview
   * URLs are excluded from the sitemap.
   */
  async preview(entityType: string, idOrSlug: string): Promise<unknown> {
    const byKey = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
        ? { id: value }
        : { slug: value };

    switch (entityType) {
      case 'page': {
        const row = await this.prisma.page.findFirst({
          where: byKey(idOrSlug),
          include: pageDetailInclude,
        });
        if (!row) throw new NotFoundException('Not found.');
        return this.hydratePage(row);
      }
      case 'service': {
        const row = await this.prisma.service.findFirst({
          where: byKey(idOrSlug),
          include: serviceDetailInclude,
        });
        if (!row) throw new NotFoundException('Not found.');
        return mapService(
          { ...row, __gallery: await loadGallery(this.prisma, 'SERVICE', row.id) },
          this.resolver,
        );
      }
      case 'product': {
        const row = await this.prisma.product.findFirst({
          where: byKey(idOrSlug),
          include: productDetailInclude,
        });
        if (!row) throw new NotFoundException('Not found.');
        return mapProduct(
          { ...row, __gallery: await loadGallery(this.prisma, 'PRODUCT', row.id) },
          this.resolver,
        );
      }
      case 'solution': {
        const row = await this.prisma.solution.findFirst({
          where: byKey(idOrSlug),
          include: solutionDetailInclude,
        });
        if (!row) throw new NotFoundException('Not found.');
        return mapSolution(
          { ...row, __gallery: await loadGallery(this.prisma, 'SOLUTION', row.id) },
          this.resolver,
        );
      }
      case 'portfolio': {
        const row = await this.prisma.portfolioProject.findFirst({
          where: byKey(idOrSlug),
          include: portfolioDetailInclude,
        });
        if (!row) throw new NotFoundException('Not found.');
        return mapPortfolioProject(
          { ...row, __gallery: await loadGallery(this.prisma, 'PORTFOLIO_PROJECT', row.id) },
          this.resolver,
        );
      }
      case 'case-study': {
        const row = await this.prisma.caseStudy.findFirst({
          where: byKey(idOrSlug),
          include: caseStudyDetailInclude,
        });
        if (!row) throw new NotFoundException('Not found.');
        return mapCaseStudy(
          { ...row, __gallery: await loadGallery(this.prisma, 'CASE_STUDY', row.id) },
          this.resolver,
        );
      }
      case 'blog': {
        const row = await this.prisma.blogPost.findFirst({
          where: byKey(idOrSlug),
          include: blogDetailInclude,
        });
        if (!row) throw new NotFoundException('Not found.');
        return mapBlogPost(row, this.resolver);
      }
      case 'career': {
        const row = await this.prisma.career.findFirst({
          where: byKey(idOrSlug),
          include: careerDetailInclude,
        });
        if (!row) throw new NotFoundException('Not found.');
        return mapCareer(row, this.resolver);
      }
      default:
        throw new NotFoundException(`Preview is not available for "${entityType}".`);
    }
  }
}
