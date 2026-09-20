import Link from 'next/link';
import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { collectionPageJsonLd } from '@kts/seo';
import { Badge, BlogGrid, Breadcrumbs, CtaPanel, PageHero, Section, SectionHeader } from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { Pagination } from '@/components/Pagination';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.listing;

const DESCRIPTION =
  'Engineering write-ups, product updates and practical notes for businesses commissioning software, from the Key Tech Solutions team.';

export function generateMetadata({
  searchParams,
}: {
  searchParams: { page?: string; category?: string };
}): Metadata {
  const page = Number(searchParams?.page ?? 1);
  const category = searchParams?.category;

  // A filtered listing has no unique content worth indexing on its own.
  if (category) {
    return pageMetadata({
      path: '/blog',
      title: `Insights - ${category}`,
      description: DESCRIPTION,
      forceNoIndex: true,
    });
  }

  return pageMetadata({
    path: page > 1 ? `/blog?page=${page}` : '/blog',
    title: page > 1 ? `Insights - page ${page}` : 'Insights',
    description: DESCRIPTION,
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { page?: string; category?: string };
}) {
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const category = searchParams?.category;

  const [posts, categories] = await Promise.all([
    api.posts({ page, category }).catch(() => ({
      items: [],
      meta: { page: 1, pageSize: 9, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    })),
    api.blogCategories().catch(() => []),
  ]);

  const { trail, jsonLd } = breadcrumbs([{ name: 'Insights', path: '/blog' }]);
  const basePath = category ? `/blog?category=${encodeURIComponent(category)}` : '/blog';

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd({
            siteUrl: SITE_URL,
            url: url('/blog'),
            name: 'Insights',
            description: DESCRIPTION,
            items: posts.items.map((post) => ({
              name: post.title,
              url: url(`/blog/${post.slug}`),
            })),
          }),
          jsonLd,
        ]}
      />
      <Breadcrumbs items={trail} />
      <PageHero eyebrow="Insights" heading="Notes from the work" description={DESCRIPTION} />

      <Section theme="WHITE">
        {categories.length > 0 ? (
          <nav
            aria-label="Filter by category"
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 'var(--kt-space-6)' }}
          >
            <Link
              href="/blog"
              aria-current={!category ? 'page' : undefined}
              style={{ textDecoration: 'none' }}
            >
              <Badge tone={!category ? 'brand' : 'neutral'}>All</Badge>
            </Link>
            {categories.map((item) => (
              <Link
                key={item.id}
                href={`/blog?category=${item.slug}`}
                aria-current={category === item.slug ? 'page' : undefined}
                style={{ textDecoration: 'none' }}
              >
                <Badge tone={category === item.slug ? 'brand' : 'neutral'}>
                  {item.name}
                  {typeof item.postCount === 'number' ? ` (${item.postCount})` : ''}
                </Badge>
              </Link>
            ))}
          </nav>
        ) : null}

        <SectionHeader
          eyebrow={category ? `Category: ${category}` : 'Latest'}
          heading={category ? `Articles in ${category}` : 'Latest articles'}
        />
        <BlogGrid posts={posts.items} />
        <Pagination meta={posts.meta} basePath={basePath} />
      </Section>

      <Section theme="DARK">
        <CtaPanel
          heading="Have a technical question about your own project?"
          description="Ask it directly. A short, specific question usually gets a short, specific answer."
          primaryCta={{ label: 'Contact us', href: '/contact' }}
          onDark
        />
      </Section>
    </>
  );
}
