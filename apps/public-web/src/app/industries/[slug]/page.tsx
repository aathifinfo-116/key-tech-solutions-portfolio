import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { webPageJsonLd } from '@kts/seo';
import {
  Breadcrumbs,
  CaseStudyGrid,
  CheckList,
  CtaPanel,
  Grid,
  PageHero,
  PortfolioGrid,
  ProductGrid,
  Prose,
  Section,
  SectionHeader,
  ServiceGrid,
  SolutionGrid,
} from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.detail;

export async function generateStaticParams() {
  const industries = await api.industries({ pageSize: 100 }).catch(() => ({ items: [] }));
  return industries.items.map((industry) => ({ slug: industry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const industry = await api.industry(params.slug);
  if (!industry) {
    return pageMetadata({
      path: `/industries/${params.slug}`,
      title: 'Industry not found',
      forceNoIndex: true,
    });
  }
  return pageMetadata({
    path: `/industries/${industry.slug}`,
    title: `${industry.name} software`,
    description: industry.summary,
    seo: industry.seo,
    modifiedTime: industry.updatedAt,
  });
}

export default async function IndustryDetailPage({ params }: { params: { slug: string } }) {
  const industry = await api.industry(params.slug);
  if (!industry) notFound();

  const path = `/industries/${industry.slug}`;
  const { trail, jsonLd } = breadcrumbs([
    { name: 'Industries', path: '/industries' },
    { name: industry.name, path },
  ]);

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            siteUrl: SITE_URL,
            url: url(path),
            name: `${industry.name} software`,
            description: industry.summary,
            datePublished: industry.publishedAt,
            dateModified: industry.updatedAt,
          }),
          jsonLd,
        ]}
      />
      <Breadcrumbs items={trail} />
      <PageHero eyebrow="Industry" heading={industry.name} description={industry.summary} />

      {industry.introduction ? (
        <Section theme="WHITE">
          <Prose html={industry.introduction} />
        </Section>
      ) : null}

      {industry.challenges.length > 0 || industry.capabilities.length > 0 ? (
        <Section theme="LIGHT">
          <Grid columns={2}>
            {industry.challenges.length > 0 ? (
              <div>
                <SectionHeader
                  eyebrow="Challenges"
                  heading="What makes this sector hard"
                  level={2}
                />
                <CheckList items={industry.challenges} />
              </div>
            ) : null}
            {industry.capabilities.length > 0 ? (
              <div>
                <SectionHeader eyebrow="Capabilities" heading="How we help" level={2} />
                <CheckList items={industry.capabilities} />
              </div>
            ) : null}
          </Grid>
        </Section>
      ) : null}

      {industry.products.length > 0 ? (
        <Section theme="DARK">
          <SectionHeader eyebrow="Products" heading="Key products for this sector" />
          <ProductGrid products={industry.products} onDark />
        </Section>
      ) : null}

      {industry.solutions.length > 0 ? (
        <Section theme="WHITE">
          <SectionHeader eyebrow="Solutions" heading="Relevant solutions" />
          <SolutionGrid solutions={industry.solutions} />
        </Section>
      ) : null}

      {industry.services.length > 0 ? (
        <Section theme="LIGHT">
          <SectionHeader eyebrow="Services" heading="How we deliver" />
          <ServiceGrid services={industry.services} />
        </Section>
      ) : null}

      {industry.projects.length > 0 ? (
        <Section theme="WHITE">
          <SectionHeader eyebrow="Work" heading="Related projects" />
          <PortfolioGrid projects={industry.projects} />
        </Section>
      ) : null}

      {industry.caseStudies.length > 0 ? (
        <Section theme="LIGHT">
          <SectionHeader eyebrow="Case studies" heading="In depth" />
          <CaseStudyGrid caseStudies={industry.caseStudies} />
        </Section>
      ) : null}

      <Section theme="BRAND_GRADIENT">
        <CtaPanel
          heading={industry.cta.heading ?? `Working in ${industry.name.toLowerCase()}?`}
          description="Tell us what the operation struggles with. We will be straightforward about fit."
          primaryCta={{
            label: industry.cta.label ?? 'Start a Project',
            href: industry.cta.href ?? '/request-a-quote',
          }}
          onDark
        />
      </Section>
    </>
  );
}
