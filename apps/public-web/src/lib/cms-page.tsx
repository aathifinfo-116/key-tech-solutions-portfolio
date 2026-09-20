import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { webPageJsonLd, type WebPageType } from '@kts/seo';
import { Breadcrumbs, PageHero } from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { SectionRenderer } from '@/components/SectionRenderer';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

/**
 * Renders a page that is fully managed in the admin panel.
 *
 * Used by /about, /contact, /request-a-quote and the legal routes, so those
 * URLs stay stable and crawlable while their content stays editable.
 */

export async function cmsPageMetadata(slug: string, path: string): Promise<Metadata> {
  const page = await api.page(slug).catch(() => null);
  if (!page) return pageMetadata({ path, title: 'Page not found', forceNoIndex: true });
  return pageMetadata({
    path,
    title: page.title,
    description: page.summary ?? page.subheadline,
    seo: page.seo,
    modifiedTime: page.updatedAt,
  });
}

export async function CmsPage({
  slug,
  path,
  breadcrumbName,
  schemaType = 'WebPage',
}: {
  slug: string;
  path: string;
  breadcrumbName: string;
  schemaType?: WebPageType;
}) {
  const page = await api.page(slug).catch(() => null);
  if (!page) notFound();

  const { trail, jsonLd } = breadcrumbs([{ name: breadcrumbName, path }]);
  const hasHeroSection = page.sections.some((section) => section.type === 'HERO');

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            siteUrl: SITE_URL,
            url: url(path),
            name: page.title,
            description: page.summary,
            type: schemaType,
            datePublished: page.publishedAt,
            dateModified: page.updatedAt,
          }),
          jsonLd,
        ]}
      />
      <Breadcrumbs items={trail} />
      {/* Pages without their own hero section get the standard interior hero,
          so every route still renders exactly one h1. */}
      {hasHeroSection ? null : (
        <PageHero
          eyebrow={page.eyebrow}
          heading={page.headline ?? page.title}
          description={page.subheadline ?? page.summary}
        />
      )}
      <SectionRenderer sections={page.sections} />
    </>
  );
}
