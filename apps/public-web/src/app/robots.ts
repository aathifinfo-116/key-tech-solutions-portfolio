import type { MetadataRoute } from 'next';
import { buildRobots } from '@kts/seo';
import { SITE_URL, api } from '@/lib/api';

/**
 * Robots rules.
 *
 * The admin panel, the API, preview routes and filtered listings are always
 * excluded. A staging deployment can disallow everything by switching the
 * `seo.robotsBlockAll` site setting on, with no redeploy.
 */
export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await api.settings().catch(() => null);
  const blockAll = Boolean(settings?.settings?.['seo.robotsBlockAll']);
  const config = buildRobots({ siteUrl: SITE_URL, blockAll });

  return {
    rules: config.rules,
    sitemap: config.sitemap,
    host: config.host,
  };
}
