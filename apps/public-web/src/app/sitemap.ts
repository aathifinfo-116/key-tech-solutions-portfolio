import type { MetadataRoute } from 'next';
import { CACHE } from '@kts/config';
import { toNextSitemap } from '@kts/seo';
import { SITE_URL, api, errorMessage } from '@/lib/api';

/**
 * Database-driven sitemap.
 *
 * The API applies exactly the same visibility rule the pages use, so the
 * sitemap cannot list a draft, a future-dated schedule, an archived record or
 * anything an editor marked noindex or excluded.
 */
export const revalidate = CACHE.sitemap;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const entries = await api.sitemap();
    return toNextSitemap(entries, SITE_URL);
  } catch (error) {
    // A sitemap that omits everything is better than a 500 at /sitemap.xml.
    console.error('[sitemap] could not be generated:', errorMessage(error));
    return [
      { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    ];
  }
}
