import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '../../config/app-config';

/**
 * On-demand revalidation.
 *
 * After a publish the API tells the public site exactly which cache tags to
 * drop. Editing one service invalidates that service page, the services
 * listing and the sitemap - not the whole site. Failures are logged and
 * swallowed: a stale page is a smaller problem than a failed publish.
 */
@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);

  constructor(private readonly config: AppConfig) {}

  /** Cache tags to invalidate for a given entity type and slug. */
  tagsFor(entityType: string, slug?: string | null, isFeatured = false): string[] {
    const tags = new Set<string>(['sitemap']);

    const add = (...values: Array<string | null | undefined>) => {
      values.filter(Boolean).forEach((value) => tags.add(value as string));
    };

    switch (entityType) {
      case 'PAGE':
        add('pages', slug ? `page:${slug}` : null);
        if (slug === 'home') add('homepage');
        break;
      case 'SERVICE':
        add('services', slug ? `service:${slug}` : null);
        break;
      case 'SOLUTION':
        add('solutions', slug ? `solution:${slug}` : null);
        break;
      case 'INDUSTRY':
        add('industries', slug ? `industry:${slug}` : null);
        break;
      case 'PRODUCT':
        add('products', slug ? `product:${slug}` : null);
        break;
      case 'PORTFOLIO_PROJECT':
        add('portfolio', slug ? `project:${slug}` : null);
        break;
      case 'CASE_STUDY':
        add('case-studies', slug ? `case-study:${slug}` : null);
        break;
      case 'BLOG_POST':
      case 'BLOG_CATEGORY':
        add('blog', slug ? `post:${slug}` : null);
        break;
      case 'CAREER':
        add('careers', slug ? `career:${slug}` : null);
        break;
      case 'TEAM_MEMBER':
      case 'COMPANY_VALUE':
      case 'COMPANY_MILESTONE':
      case 'PROCESS_PHASE':
      case 'STATISTIC':
      case 'TESTIMONIAL':
      case 'CLIENT':
      case 'PARTNER':
        add('company');
        break;
      case 'TECHNOLOGY':
      case 'TECHNOLOGY_CATEGORY':
        add('technologies');
        break;
      case 'NAVIGATION_MENU':
      case 'FOOTER_GROUP':
        add('navigation');
        break;
      case 'SITE_SETTING':
      case 'BRAND_SETTING':
      case 'ANNOUNCEMENT':
        add('settings');
        break;
      case 'REDIRECT_RULE':
        add('redirects');
        break;
      default:
        break;
    }

    // Featured content also surfaces on the homepage.
    if (isFeatured) add('homepage');

    return Array.from(tags);
  }

  /**
   * Notifies the public site. Never throws.
   * Returns the tags that were requested so callers can log or test them.
   */
  async revalidate(
    entityType: string,
    slug?: string | null,
    isFeatured = false,
  ): Promise<string[]> {
    const tags = this.tagsFor(entityType, slug, isFeatured);
    const secret = this.config.revalidateSecret;

    if (!secret) {
      this.logger.debug(`REVALIDATE_SECRET not set; skipping revalidation of ${tags.join(', ')}`);
      return tags;
    }

    const url = `${this.config.publicSiteUrl}/api/revalidate`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-revalidate-secret': secret },
        body: JSON.stringify({ tags }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        this.logger.warn(`Revalidation returned ${response.status} for tags: ${tags.join(', ')}`);
      }
    } catch (error) {
      this.logger.warn(`Revalidation request failed: ${(error as Error).message}`);
    }
    return tags;
  }
}
