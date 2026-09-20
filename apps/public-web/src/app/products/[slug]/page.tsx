import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { PRODUCT_STATUS_LABEL } from '@kts/shared-types';
import { faqJsonLd, softwareApplicationJsonLd, webPageJsonLd } from '@kts/seo';
import {
  Badge,
  Breadcrumbs,
  ButtonLink,
  ButtonRow,
  CaseStudyGrid,
  CheckList,
  CtaPanel,
  FaqList,
  Gallery,
  Grid,
  PageHero,
  Prose,
  Section,
  SectionHeader,
  ServiceGrid,
  SmartImage,
  SolutionGrid,
  VideoEmbed,
} from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.detail;

export async function generateStaticParams() {
  const products = await api.products({ pageSize: 100 }).catch(() => ({ items: [] }));
  return products.items.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await api.product(params.slug);
  if (!product)
    return pageMetadata({
      path: `/products/${params.slug}`,
      title: 'Product not found',
      forceNoIndex: true,
    });

  return pageMetadata({
    path: `/products/${product.slug}`,
    title: product.name,
    description: product.tagline ?? product.summary,
    seo: product.seo,
    image: product.coverImage
      ? {
          url: product.coverImage.variants.openGraph ?? product.coverImage.variants.original,
          alt: product.coverImage.altText ?? product.name,
        }
      : null,
    modifiedTime: product.updatedAt,
  });
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await api.product(params.slug);
  if (!product) notFound();

  const path = `/products/${product.slug}`;
  const { trail, jsonLd } = breadcrumbs([
    { name: 'Products', path: '/products' },
    { name: product.name, path },
  ]);

  const isLive = product.productStatus === 'LIVE' || product.productStatus === 'MAINTENANCE';

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            siteUrl: SITE_URL,
            url: url(path),
            name: product.name,
            description: product.summary,
            datePublished: product.publishedAt,
            dateModified: product.updatedAt,
            primaryImageUrl: product.coverImage?.variants.original ?? null,
          }),
          /* SoftwareApplication with no offers and no rating: we have no
             published price and no reviews, so neither is asserted. */
          softwareApplicationJsonLd({
            siteUrl: SITE_URL,
            url: url(path),
            name: product.name,
            description: product.summary,
            applicationCategory: product.category,
            imageUrl: product.coverImage?.variants.original ?? null,
            screenshotUrls: product.screenshots.map((s) => s.media.variants.original),
            releaseDate: isLive ? product.launchDate : null,
          }),
          jsonLd,
          ...(product.faqs.length > 0 ? [faqJsonLd(product.faqs)!] : []),
        ]}
      />

      <Breadcrumbs items={trail} />
      <PageHero
        eyebrow="Key Tech product"
        heading={product.name}
        description={product.tagline ?? product.summary}
        meta={
          <>
            <Badge tone="brand" withDot>
              {PRODUCT_STATUS_LABEL[product.productStatus]}
            </Badge>
            {product.category ? <Badge tone="neutral">{product.category}</Badge> : null}
            {product.launchLabel ? <span>{product.launchLabel}</span> : null}
          </>
        }
        actions={
          product.websiteUrl || product.demoUrl || product.documentationUrl ? (
            <ButtonRow>
              {product.websiteUrl ? (
                <ButtonLink href={product.websiteUrl}>Visit {product.name}</ButtonLink>
              ) : null}
              {product.demoUrl ? (
                <ButtonLink href={product.demoUrl} variant="secondary">
                  See a demo
                </ButtonLink>
              ) : null}
              {product.documentationUrl ? (
                <ButtonLink href={product.documentationUrl} variant="ghost">
                  Documentation
                </ButtonLink>
              ) : null}
            </ButtonRow>
          ) : null
        }
      />

      <Section theme="WHITE">
        <Grid columns={2}>
          <div>
            <SectionHeader eyebrow="01 — Overview" heading="What it is" />
            <p style={{ fontSize: 'var(--kt-text-lead)', color: 'var(--kt-text-secondary)' }}>
              {product.summary}
            </p>
            {product.fullDescription ? <Prose html={product.fullDescription} /> : null}
          </div>
          <SmartImage
            media={product.coverImage}
            variant="hero"
            ratio="4 / 3"
            priority
            branded
            sizes="(max-width: 1023px) 100vw, 560px"
            placeholderLabel={`${product.name} interface`}
          />
        </Grid>
      </Section>

      {product.problemSolved ? (
        <Section theme="SOFT_PURPLE">
          <SectionHeader eyebrow="02 — The problem" heading="Why it exists" />
          <Prose html={product.problemSolved} />
        </Section>
      ) : null}

      {product.features.length > 0 ? (
        <Section theme="WHITE">
          <SectionHeader eyebrow="03 — Capabilities" heading="What it does" />
          <Grid columns={3}>
            {product.features.map((feature) => (
              <div key={feature.id}>
                <h3 style={{ fontSize: 'var(--kt-text-card-heading)', marginBottom: 8 }}>
                  {feature.title}
                </h3>
                {feature.description ? (
                  <p style={{ color: 'var(--kt-text-secondary)' }}>{feature.description}</p>
                ) : null}
              </div>
            ))}
          </Grid>
        </Section>
      ) : null}

      {product.targetUsers.length > 0 || product.benefits.length > 0 ? (
        <Section theme="LIGHT">
          <Grid columns={2}>
            {product.targetUsers.length > 0 ? (
              <div>
                <SectionHeader eyebrow="04 — Audience" heading="Who it is for" level={2} />
                <CheckList items={product.targetUsers} />
              </div>
            ) : null}
            {product.benefits.length > 0 ? (
              <div>
                <SectionHeader eyebrow="05 — Outcome" heading="What changes" level={2} />
                <CheckList items={product.benefits} />
              </div>
            ) : null}
          </Grid>
        </Section>
      ) : null}

      {product.screenshots.length > 0 ? (
        <Section theme="WHITE">
          <SectionHeader eyebrow="06 — Screens" heading="Inside the product" />
          <Gallery images={product.screenshots.map((s) => s.media)} />
        </Section>
      ) : null}

      {product.demoVideoUrl ? (
        <Section theme="DARK">
          <SectionHeader eyebrow="Walkthrough" heading={`${product.name} in motion`} />
          <VideoEmbed url={product.demoVideoUrl} title={`${product.name} walkthrough`} />
        </Section>
      ) : null}

      {product.technologies.length > 0 ? (
        <Section theme="LIGHT" compact>
          <SectionHeader eyebrow="Technology" heading="Built with" level={2} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {product.technologies.map((technology) => (
              <Badge key={technology.id} tone="neutral">
                {technology.name}
              </Badge>
            ))}
          </div>
        </Section>
      ) : null}

      {product.relatedSolutions.length > 0 ? (
        <Section theme="WHITE">
          <SectionHeader eyebrow="Solutions" heading="Problems it addresses" />
          <SolutionGrid solutions={product.relatedSolutions} />
        </Section>
      ) : null}

      {product.relatedServices.length > 0 ? (
        <Section theme="LIGHT">
          <SectionHeader
            eyebrow="Services"
            heading="The same capability, as a service"
            description="Everything behind this product is available as client work."
          />
          <ServiceGrid services={product.relatedServices} />
        </Section>
      ) : null}

      {product.relatedCaseStudies.length > 0 ? (
        <Section theme="WHITE">
          <SectionHeader eyebrow="Case studies" heading="How it was built" />
          <CaseStudyGrid caseStudies={product.relatedCaseStudies} />
        </Section>
      ) : null}

      {product.faqs.length > 0 ? (
        <Section theme="SOFT_TEAL">
          <SectionHeader eyebrow="Questions" heading={`About ${product.name}`} />
          <FaqList faqs={product.faqs} />
        </Section>
      ) : null}

      <Section theme="BRAND_GRADIENT">
        <CtaPanel
          heading={`Interested in ${product.name}?`}
          description="Tell us about your operation and we will say plainly whether this product fits it today."
          primaryCta={{ label: 'Start a Project', href: '/request-a-quote' }}
          secondaryCta={{ label: 'Contact us', href: '/contact' }}
          onDark
        />
      </Section>
    </>
  );
}
