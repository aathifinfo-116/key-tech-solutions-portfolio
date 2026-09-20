/**
 * Public read API.
 *
 * Every method is a plain `fetch` with an explicit revalidation window and
 * cache tag, so a publish in the admin panel can invalidate exactly the pages
 * that changed instead of rebuilding the whole site.
 */

import { CACHE } from '@kts/config';
import type {
  BlogCategoryDto,
  BlogPostDto,
  BlogPostSummaryDto,
  CareerDto,
  CareerSummaryDto,
  CaseStudyDto,
  CaseStudySummaryDto,
  CompanyMilestoneDto,
  CompanyValueDto,
  FooterGroupDto,
  IndustryDto,
  IndustrySummaryDto,
  NavigationMenuDto,
  PageDto,
  Paginated,
  PortfolioProjectDto,
  PortfolioSummaryDto,
  ProcessPhaseDto,
  ProductDto,
  ProductSummaryDto,
  ServiceDto,
  ServiceSummaryDto,
  SiteSettingsDto,
  SitemapEntryDto,
  SolutionDto,
  SolutionSummaryDto,
  StatisticDto,
  SubmissionReceiptDto,
  TeamMemberDto,
  TechnologyGroupDto,
  TestimonialDto,
} from '@kts/shared-types';
import { ApiClient, CACHE_TAGS, type RequestOptions } from './client';

const V1 = '/api/v1/public';

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  tag?: string;
  industry?: string;
  featured?: boolean;
  status?: string;
}

export class PublicApi {
  constructor(private readonly client: ApiClient) {}

  private cached(tags: string[], revalidate: number): RequestOptions {
    return { next: { tags, revalidate } };
  }

  // ---- site configuration -------------------------------------------------

  settings(): Promise<SiteSettingsDto> {
    return this.client.get(`${V1}/settings`, this.cached([CACHE_TAGS.settings], CACHE.settings));
  }

  navigation(location = 'PRIMARY'): Promise<NavigationMenuDto | null> {
    return this.client.getOrNull(`${V1}/navigation`, {
      query: { location },
      ...this.cached([CACHE_TAGS.navigation], CACHE.settings),
    });
  }

  footer(): Promise<FooterGroupDto[]> {
    return this.client.get(`${V1}/footer`, this.cached([CACHE_TAGS.navigation], CACHE.settings));
  }

  // ---- pages --------------------------------------------------------------

  homepage(): Promise<PageDto | null> {
    return this.client.getOrNull(
      `${V1}/homepage`,
      this.cached([CACHE_TAGS.homepage], CACHE.homepage),
    );
  }

  page(slug: string): Promise<PageDto | null> {
    return this.client.getOrNull(
      `${V1}/pages/${encodeURIComponent(slug)}`,
      this.cached([CACHE_TAGS.pages, CACHE_TAGS.page(slug)], CACHE.detail),
    );
  }

  // ---- offerings ----------------------------------------------------------

  services(params: ListParams = {}): Promise<Paginated<ServiceSummaryDto>> {
    return this.client.list(`${V1}/services`, {
      query: { ...params },
      ...this.cached([CACHE_TAGS.services], CACHE.listing),
    });
  }

  service(slug: string): Promise<ServiceDto | null> {
    return this.client.getOrNull(
      `${V1}/services/${encodeURIComponent(slug)}`,
      this.cached([CACHE_TAGS.services, CACHE_TAGS.service(slug)], CACHE.detail),
    );
  }

  solutions(params: ListParams = {}): Promise<Paginated<SolutionSummaryDto>> {
    return this.client.list(`${V1}/solutions`, {
      query: { ...params },
      ...this.cached([CACHE_TAGS.solutions], CACHE.listing),
    });
  }

  solution(slug: string): Promise<SolutionDto | null> {
    return this.client.getOrNull(
      `${V1}/solutions/${encodeURIComponent(slug)}`,
      this.cached([CACHE_TAGS.solutions, CACHE_TAGS.solution(slug)], CACHE.detail),
    );
  }

  industries(params: ListParams = {}): Promise<Paginated<IndustrySummaryDto>> {
    return this.client.list(`${V1}/industries`, {
      query: { ...params },
      ...this.cached([CACHE_TAGS.industries], CACHE.listing),
    });
  }

  industry(slug: string): Promise<IndustryDto | null> {
    return this.client.getOrNull(
      `${V1}/industries/${encodeURIComponent(slug)}`,
      this.cached([CACHE_TAGS.industries, CACHE_TAGS.industry(slug)], CACHE.detail),
    );
  }

  products(params: ListParams = {}): Promise<Paginated<ProductSummaryDto>> {
    return this.client.list(`${V1}/products`, {
      query: { ...params },
      ...this.cached([CACHE_TAGS.products], CACHE.listing),
    });
  }

  product(slug: string): Promise<ProductDto | null> {
    return this.client.getOrNull(
      `${V1}/products/${encodeURIComponent(slug)}`,
      this.cached([CACHE_TAGS.products, CACHE_TAGS.product(slug)], CACHE.detail),
    );
  }

  // ---- portfolio ----------------------------------------------------------

  projects(params: ListParams = {}): Promise<Paginated<PortfolioSummaryDto>> {
    return this.client.list(`${V1}/portfolio`, {
      query: { ...params },
      ...this.cached([CACHE_TAGS.portfolio], CACHE.listing),
    });
  }

  project(slug: string): Promise<PortfolioProjectDto | null> {
    return this.client.getOrNull(
      `${V1}/portfolio/${encodeURIComponent(slug)}`,
      this.cached([CACHE_TAGS.portfolio, CACHE_TAGS.project(slug)], CACHE.detail),
    );
  }

  caseStudies(params: ListParams = {}): Promise<Paginated<CaseStudySummaryDto>> {
    return this.client.list(`${V1}/case-studies`, {
      query: { ...params },
      ...this.cached([CACHE_TAGS.caseStudies], CACHE.listing),
    });
  }

  caseStudy(slug: string): Promise<CaseStudyDto | null> {
    return this.client.getOrNull(
      `${V1}/case-studies/${encodeURIComponent(slug)}`,
      this.cached([CACHE_TAGS.caseStudies, CACHE_TAGS.caseStudy(slug)], CACHE.detail),
    );
  }

  // ---- company ------------------------------------------------------------

  processPhases(): Promise<ProcessPhaseDto[]> {
    return this.client.get(`${V1}/process`, this.cached([CACHE_TAGS.company], CACHE.listing));
  }

  technologies(): Promise<TechnologyGroupDto[]> {
    return this.client.get(
      `${V1}/technologies`,
      this.cached([CACHE_TAGS.technologies], CACHE.listing),
    );
  }

  team(): Promise<TeamMemberDto[]> {
    return this.client.get(`${V1}/team`, this.cached([CACHE_TAGS.company], CACHE.listing));
  }

  values(): Promise<CompanyValueDto[]> {
    return this.client.get(`${V1}/values`, this.cached([CACHE_TAGS.company], CACHE.listing));
  }

  milestones(): Promise<CompanyMilestoneDto[]> {
    return this.client.get(`${V1}/milestones`, this.cached([CACHE_TAGS.company], CACHE.listing));
  }

  statistics(group = 'home'): Promise<StatisticDto[]> {
    return this.client.get(`${V1}/statistics`, {
      query: { group },
      ...this.cached([CACHE_TAGS.company], CACHE.listing),
    });
  }

  testimonials(): Promise<TestimonialDto[]> {
    return this.client.get(`${V1}/testimonials`, this.cached([CACHE_TAGS.company], CACHE.listing));
  }

  // ---- blog ---------------------------------------------------------------

  posts(params: ListParams = {}): Promise<Paginated<BlogPostSummaryDto>> {
    return this.client.list(`${V1}/blog`, {
      query: { ...params },
      ...this.cached([CACHE_TAGS.blog], CACHE.listing),
    });
  }

  post(slug: string): Promise<BlogPostDto | null> {
    return this.client.getOrNull(
      `${V1}/blog/${encodeURIComponent(slug)}`,
      this.cached([CACHE_TAGS.blog, CACHE_TAGS.post(slug)], CACHE.detail),
    );
  }

  blogCategories(): Promise<BlogCategoryDto[]> {
    return this.client.get(`${V1}/blog-categories`, this.cached([CACHE_TAGS.blog], CACHE.listing));
  }

  // ---- careers ------------------------------------------------------------

  careers(): Promise<CareerSummaryDto[]> {
    return this.client.get(`${V1}/careers`, this.cached([CACHE_TAGS.careers], CACHE.listing));
  }

  career(slug: string): Promise<CareerDto | null> {
    return this.client.getOrNull(
      `${V1}/careers/${encodeURIComponent(slug)}`,
      this.cached([CACHE_TAGS.careers, CACHE_TAGS.career(slug)], CACHE.detail),
    );
  }

  // ---- sitemap ------------------------------------------------------------

  sitemap(): Promise<SitemapEntryDto[]> {
    return this.client.get(`${V1}/sitemap`, this.cached([CACHE_TAGS.sitemap], CACHE.sitemap));
  }

  // ---- write endpoints (never cached) -------------------------------------

  submitContact(body: unknown): Promise<SubmissionReceiptDto> {
    return this.client.post(`${V1}/contact`, body, { cache: 'no-store' });
  }

  submitQuote(body: unknown): Promise<SubmissionReceiptDto> {
    return this.client.post(`${V1}/quote-requests`, body, { cache: 'no-store' });
  }

  subscribeNewsletter(body: unknown): Promise<SubmissionReceiptDto> {
    return this.client.post(`${V1}/newsletter`, body, { cache: 'no-store' });
  }

  submitApplication(body: unknown): Promise<SubmissionReceiptDto> {
    return this.client.post(`${V1}/applications`, body, { cache: 'no-store' });
  }

  uploadPublicFormFile(
    formData: FormData,
  ): Promise<{ id: string; originalName: string; sizeBytes: number }> {
    return this.client.post(`${V1}/uploads`, undefined, { formData, cache: 'no-store' });
  }

  /** Resolves a redirect rule for an incoming path. Used by middleware. */
  resolveRedirect(path: string): Promise<{ destination: string; statusCode: number } | null> {
    return this.client.getOrNull(`${V1}/redirects/resolve`, {
      query: { path },
      next: { revalidate: 60, tags: ['redirects'] },
    });
  }

  /** Authorised draft preview. Never cached, never indexed. */
  preview(entityType: string, idOrSlug: string, secret: string): Promise<unknown> {
    return this.client.get(
      `${V1}/preview/${encodeURIComponent(entityType)}/${encodeURIComponent(idOrSlug)}`,
      {
        headers: { 'x-preview-secret': secret },
        cache: 'no-store',
      },
    );
  }
}

export function createPublicApi(baseUrl: string, fetchImpl?: typeof fetch): PublicApi {
  return new PublicApi(new ApiClient({ baseUrl, fetchImpl }));
}
