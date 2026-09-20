import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { articleJsonLd, webPageJsonLd } from '@kts/seo';
import {
  Breadcrumbs,
  CtaPanel,
  DownloadList,
  Gallery,
  PageHero,
  ProductGrid,
  Prose,
  Section,
  SectionHeader,
  ServiceGrid,
  SmartImage,
  Statistics,
  TestimonialList,
} from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.detail;

export async function generateStaticParams() {
  const studies = await api.caseStudies({ pageSize: 100 }).catch(() => ({ items: [] }));
  return studies.items.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const study = await api.caseStudy(params.slug);
  if (!study) {
    return pageMetadata({
      path: `/case-studies/${params.slug}`,
      title: 'Case study not found',
      forceNoIndex: true,
    });
  }
  return pageMetadata({
    path: `/case-studies/${study.slug}`,
    title: study.title,
    description: study.summary,
    seo: study.seo,
    type: 'article',
    publishedTime: study.publishedAt,
    modifiedTime: study.updatedAt,
    image: study.coverImage
      ? {
          url: study.coverImage.variants.openGraph ?? study.coverImage.variants.original,
          alt: study.coverImage.altText ?? study.title,
        }
      : null,
  });
}

/** Ordered narrative sections, rendered only when the editor filled them in. */
const NARRATIVE = [
  ['background', 'Background'],
  ['challenge', 'Challenge'],
  ['discovery', 'Discovery'],
  ['strategy', 'Strategy'],
  ['design', 'Design'],
  ['architecture', 'Architecture'],
  ['development', 'Development'],
  ['solution', 'Solution'],
] as const;

export default async function CaseStudyDetailPage({ params }: { params: { slug: string } }) {
  const study = await api.caseStudy(params.slug);
  if (!study) notFound();

  const path = `/case-studies/${study.slug}`;
  const { trail, jsonLd } = breadcrumbs([
    { name: 'Case studies', path: '/case-studies' },
    { name: study.title, path },
  ]);

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            siteUrl: SITE_URL,
            url: url(path),
            name: study.title,
            description: study.summary,
            datePublished: study.publishedAt,
            dateModified: study.updatedAt,
          }),
          articleJsonLd({
            siteUrl: SITE_URL,
            url: url(path),
            headline: study.title,
            description: study.summary,
            imageUrl: study.coverImage?.variants.original ?? null,
            datePublished: study.publishedAt,
            dateModified: study.updatedAt,
            type: 'Article',
          }),
          jsonLd,
        ]}
      />

      <Breadcrumbs items={trail} />
      <PageHero
        eyebrow="Case study"
        heading={study.title}
        description={study.summary}
        meta={study.approvedCustomerName ? <span>{study.approvedCustomerName}</span> : null}
      />

      {study.coverImage ? (
        <Section theme="WHITE" compact>
          <SmartImage media={study.coverImage} variant="hero" ratio="16 / 9" priority branded />
        </Section>
      ) : null}

      {NARRATIVE.map(([key, label], index) => {
        const html = study[key];
        if (!html) return null;
        return (
          <Section key={key} theme={index % 2 === 0 ? 'WHITE' : 'LIGHT'}>
            <SectionHeader eyebrow={String(index + 1).padStart(2, '0')} heading={label} />
            <Prose html={html} />
          </Section>
        );
      })}

      {/*
        The results band appears only when verified metrics exist. With no
        independently confirmed numbers, nothing is shown rather than an
        invented figure.
      */}
      {study.metrics.length > 0 ? (
        <Section theme="BRAND_GRADIENT">
          <SectionHeader eyebrow="Results" heading="Verified outcomes" />
          <Statistics
            statistics={study.metrics.map((metric) => ({
              id: metric.id,
              key: metric.id,
              label: metric.label,
              value: `${metric.value}${metric.unit ?? ''}`,
              numericValue: Number.parseFloat(metric.value) || null,
              prefix: null,
              suffix: metric.unit,
              description: metric.description,
              isVerified: metric.isVerified,
            }))}
          />
        </Section>
      ) : null}

      {study.results ? (
        <Section theme="SOFT_TEAL">
          <SectionHeader eyebrow="Outcome" heading="Where it landed" />
          <Prose html={study.results} />
        </Section>
      ) : null}

      {study.testimonial ? (
        <Section theme="WHITE">
          <SectionHeader eyebrow="In their words" heading="Customer feedback" />
          <TestimonialList testimonials={[study.testimonial]} />
        </Section>
      ) : null}

      {study.gallery.length > 0 ? (
        <Section theme="LIGHT">
          <SectionHeader eyebrow="Gallery" heading="Selected screens" />
          <Gallery images={study.gallery} />
        </Section>
      ) : null}

      {study.downloads.length > 0 ? (
        <Section theme="WHITE" compact>
          <SectionHeader eyebrow="Downloads" heading="Related documents" level={2} />
          <DownloadList documents={study.downloads} />
        </Section>
      ) : null}

      {study.products.length > 0 ? (
        <Section theme="DARK">
          <SectionHeader eyebrow="Products" heading="Related Key products" />
          <ProductGrid products={study.products} onDark />
        </Section>
      ) : null}

      {study.services.length > 0 ? (
        <Section theme="WHITE">
          <SectionHeader eyebrow="Services" heading="Capabilities involved" />
          <ServiceGrid services={study.services} />
        </Section>
      ) : null}

      <Section theme="LIGHT">
        <CtaPanel
          heading={study.cta.heading ?? 'Facing something similar?'}
          description="Tell us the shape of the problem and we will say what carries across."
          primaryCta={{
            label: study.cta.label ?? 'Start a Project',
            href: study.cta.href ?? '/request-a-quote',
          }}
          secondaryCta={{ label: 'More case studies', href: '/case-studies' }}
        />
      </Section>
    </>
  );
}
