import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { articleJsonLd, webPageJsonLd } from '@kts/seo';
import {
  Badge,
  BlogGrid,
  Breadcrumbs,
  Container,
  CtaPanel,
  ProductGrid,
  Prose,
  Section,
  SectionHeader,
  ServiceGrid,
  SmartAvatar,
  SmartImage,
} from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.detail;

export async function generateStaticParams() {
  const posts = await api.posts({ pageSize: 100 }).catch(() => ({ items: [] }));
  return posts.items.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await api.post(params.slug);
  if (!post)
    return pageMetadata({
      path: `/blog/${params.slug}`,
      title: 'Article not found',
      forceNoIndex: true,
    });

  return pageMetadata({
    path: `/blog/${post.slug}`,
    title: post.title,
    description: post.excerpt,
    seo: post.seo,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.contentUpdatedAt ?? post.updatedAt,
    authors: post.author ? [post.author.displayName] : undefined,
    image: post.coverImage
      ? {
          url: post.coverImage.variants.openGraph ?? post.coverImage.variants.original,
          alt: post.coverImage.altText ?? post.title,
        }
      : null,
  });
}

const TYPE_TO_SCHEMA: Record<string, 'Article' | 'BlogPosting' | 'TechArticle' | 'NewsArticle'> = {
  ARTICLE: 'BlogPosting',
  TECHNICAL_GUIDE: 'TechArticle',
  PRODUCT_UPDATE: 'Article',
  RELEASE_NOTE: 'Article',
  CASE_STUDY: 'Article',
  COMPANY_NEWS: 'NewsArticle',
  INDUSTRY_INSIGHT: 'Article',
};

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await api.post(params.slug);
  if (!post) notFound();

  const path = `/blog/${post.slug}`;
  const { trail, jsonLd } = breadcrumbs([
    { name: 'Insights', path: '/blog' },
    { name: post.title, path },
  ]);

  const published = post.publishedAt ? new Date(post.publishedAt) : null;
  const updated = post.contentUpdatedAt ? new Date(post.contentUpdatedAt) : null;
  const showUpdated = updated && published && updated.getTime() - published.getTime() > 86_400_000;

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            siteUrl: SITE_URL,
            url: url(path),
            name: post.title,
            description: post.excerpt,
            datePublished: post.publishedAt,
            dateModified: post.contentUpdatedAt ?? post.updatedAt,
          }),
          articleJsonLd({
            siteUrl: SITE_URL,
            url: url(path),
            headline: post.title,
            description: post.excerpt,
            imageUrl: post.coverImage?.variants.original ?? null,
            datePublished: post.publishedAt,
            dateModified: post.contentUpdatedAt ?? post.updatedAt,
            authorName: post.author?.displayName ?? null,
            section: post.category?.name ?? null,
            keywords: post.tags.map((tag) => tag.name),
            type: TYPE_TO_SCHEMA[post.postType] ?? 'BlogPosting',
          }),
          jsonLd,
        ]}
      />

      <Breadcrumbs items={trail} />

      <Section theme="WHITE" width="narrow" as="article">
        <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--kt-space-4)' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--kt-space-3)',
              alignItems: 'center',
            }}
          >
            {post.category ? <Badge tone="brand">{post.category.name}</Badge> : null}
            {published ? (
              <time
                dateTime={post.publishedAt ?? undefined}
                style={{ fontSize: 'var(--kt-text-meta)', color: 'var(--kt-text-secondary)' }}
              >
                Published{' '}
                {published.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
            ) : null}
            {showUpdated ? (
              <time
                dateTime={post.contentUpdatedAt ?? undefined}
                style={{ fontSize: 'var(--kt-text-meta)', color: 'var(--kt-text-secondary)' }}
              >
                Updated{' '}
                {updated!.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
            ) : null}
            <span style={{ fontSize: 'var(--kt-text-meta)', color: 'var(--kt-text-secondary)' }}>
              {post.readingMinutes} min read
            </span>
          </div>

          <h1 style={{ fontSize: 'var(--kt-text-page-heading)' }}>{post.title}</h1>
          <p style={{ fontSize: 'var(--kt-text-lead)', color: 'var(--kt-text-secondary)' }}>
            {post.excerpt}
          </p>

          {post.author ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--kt-space-3)' }}>
              <SmartAvatar media={post.author.avatar} alt={post.author.displayName} size={44} />
              <div>
                <p style={{ fontWeight: 600 }}>{post.author.displayName}</p>
                {post.author.jobTitle ? (
                  <p style={{ fontSize: 'var(--kt-text-meta)', color: 'var(--kt-text-secondary)' }}>
                    {post.author.jobTitle}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </header>

        {post.coverImage ? (
          <div style={{ margin: 'var(--kt-space-7) 0' }}>
            <SmartImage
              media={post.coverImage}
              variant="hero"
              ratio="16 / 9"
              priority
              sizes="(max-width: 767px) 100vw, 760px"
            />
          </div>
        ) : null}

        {post.contentHtml ? (
          <div style={{ marginTop: 'var(--kt-space-7)' }}>
            <Prose html={post.contentHtml} />
          </div>
        ) : null}

        {post.tags.length > 0 ? (
          <div
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 'var(--kt-space-7)' }}
          >
            {post.tags.map((tag) => (
              <Badge key={tag.id} tone="neutral">
                {tag.name}
              </Badge>
            ))}
          </div>
        ) : null}
      </Section>

      {post.relatedServices.length > 0 ? (
        <Section theme="LIGHT">
          <SectionHeader eyebrow="Related services" heading="Work in this area" />
          <ServiceGrid services={post.relatedServices} />
        </Section>
      ) : null}

      {post.relatedProducts.length > 0 ? (
        <Section theme="DARK">
          <SectionHeader eyebrow="Related products" heading="Key products mentioned" />
          <ProductGrid products={post.relatedProducts} onDark />
        </Section>
      ) : null}

      {post.relatedPosts.length > 0 ? (
        <Section theme="WHITE">
          <SectionHeader eyebrow="Keep reading" heading="Related articles" />
          <BlogGrid posts={post.relatedPosts} />
        </Section>
      ) : null}

      <Section theme="BRAND_GRADIENT">
        <Container>
          <CtaPanel
            heading="Working on something this touches?"
            description="Send the specifics. A concrete question gets a concrete answer."
            primaryCta={{ label: 'Contact us', href: '/contact' }}
            secondaryCta={{ label: 'More insights', href: '/blog' }}
            onDark
          />
        </Container>
      </Section>
    </>
  );
}
