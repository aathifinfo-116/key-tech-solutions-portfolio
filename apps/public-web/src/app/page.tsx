import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { webPageJsonLd } from '@kts/seo';
import { JsonLd } from '@/components/JsonLd';
import { SectionRenderer } from '@/components/SectionRenderer';
import { api, errorMessage } from '@/lib/api';
import { pageMetadata, url } from '@/lib/seo';

/**
 * Homepage.
 *
 * Statically generated and revalidated on a timer, and invalidated on demand
 * by the `homepage` cache tag whenever an editor publishes something featured.
 */
export const revalidate = CACHE.homepage;

export async function generateMetadata(): Promise<Metadata> {
  const page = await api.homepage().catch(() => null);
  return pageMetadata({
    path: '/',
    title: page?.title ?? 'Key Tech Solutions',
    description: page?.summary ?? page?.subheadline,
    seo: page?.seo,
    omitTitleTemplate: true,
  });
}

export default async function HomePage() {
  const page = await api.homepage().catch((error) => {
    console.error('[home] homepage unavailable:', errorMessage(error));
    return null;
  });

  if (!page) {
    // The API is unreachable or the homepage is unpublished. Rather than a
    // stack trace, the visitor gets something honest and the build still works.
    return (
      <div style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <h1>Key Tech Solutions</h1>
        <p style={{ color: 'var(--kt-text-secondary)' }}>
          The homepage content is not available right now. Please try again shortly.
        </p>
      </div>
    );
  }

  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          siteUrl: url('/').replace(/\/$/, ''),
          url: url('/'),
          name: page.title,
          description: page.summary,
          datePublished: page.publishedAt,
          dateModified: page.updatedAt,
        })}
      />
      <SectionRenderer sections={page.sections} />
    </>
  );
}
