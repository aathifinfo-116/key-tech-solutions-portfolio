import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { faqJsonLd, serviceJsonLd, webPageJsonLd } from '@kts/seo';
import {
  Badge,
  Breadcrumbs,
  CheckList,
  CtaPanel,
  FaqList,
  Gallery,
  Grid,
  PageHero,
  PortfolioGrid,
  ProductGrid,
  Prose,
  Section,
  SectionHeader,
  ServiceGrid,
} from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.detail;

export async function generateStaticParams() {
  const solutions = await api.solutions({ pageSize: 100 }).catch(() => ({ items: [] }));
  return solutions.items.map((solution) => ({ slug: solution.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const solution = await api.solution(params.slug);
  if (!solution) {
    return pageMetadata({
      path: `/solutions/${params.slug}`,
      title: 'Solution not found',
      forceNoIndex: true,
    });
  }
  return pageMetadata({
    path: `/solutions/${solution.slug}`,
    title: solution.name,
    description: solution.summary,
    seo: solution.seo,
    modifiedTime: solution.updatedAt,
  });
}

export default async function SolutionDetailPage({ params }: { params: { slug: string } }) {
  const solution = await api.solution(params.slug);
  if (!solution) notFound();

  const path = `/solutions/${solution.slug}`;
  const { trail, jsonLd } = breadcrumbs([
    { name: 'Solutions', path: '/solutions' },
    { name: solution.name, path },
  ]);

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            siteUrl: SITE_URL,
            url: url(path),
            name: solution.name,
            description: solution.summary,
            datePublished: solution.publishedAt,
            dateModified: solution.updatedAt,
          }),
          serviceJsonLd({
            siteUrl: SITE_URL,
            url: url(path),
            name: solution.name,
            description: solution.summary,
          }),
          jsonLd,
          ...(solution.faqs.length > 0 ? [faqJsonLd(solution.faqs)!] : []),
        ]}
      />

      <Breadcrumbs items={trail} />
      <PageHero eyebrow="Solution" heading={solution.name} description={solution.summary} />

      {solution.businessChallenge ? (
        <Section theme="SOFT_PURPLE">
          <SectionHeader eyebrow="01 — The challenge" heading="What goes wrong today" />
          <Prose html={solution.businessChallenge} />
        </Section>
      ) : null}

      {solution.overview ? (
        <Section theme="WHITE">
          <SectionHeader eyebrow="02 — Approach" heading="How the solution works" />
          <Prose html={solution.overview} />
        </Section>
      ) : null}

      {solution.capabilities.length > 0 || solution.benefits.length > 0 ? (
        <Section theme="LIGHT">
          <Grid columns={2}>
            {solution.capabilities.length > 0 ? (
              <div>
                <SectionHeader eyebrow="03 — Capabilities" heading="What it includes" level={2} />
                <CheckList items={solution.capabilities} />
              </div>
            ) : null}
            {solution.benefits.length > 0 ? (
              <div>
                <SectionHeader eyebrow="04 — Outcome" heading="What changes" level={2} />
                <CheckList items={solution.benefits} />
              </div>
            ) : null}
          </Grid>
        </Section>
      ) : null}

      {solution.workflowSteps.length > 0 ? (
        <Section theme="WHITE">
          <SectionHeader eyebrow="05 — Workflow" heading="How it runs day to day" />
          <ol
            style={{
              display: 'grid',
              gap: 'var(--kt-space-4)',
              listStyle: 'none',
              margin: 0,
              padding: 0,
            }}
          >
            {solution.workflowSteps.map((step, index) => (
              <li
                key={step.title}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: 'var(--kt-space-4)',
                  alignItems: 'start',
                }}
              >
                <span
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    background: 'var(--kt-gradient-brand)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    minWidth: '2.2ch',
                  }}
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 style={{ fontSize: 'var(--kt-text-card-heading)', marginBottom: 4 }}>
                    <span className="kt-visually-hidden">Step {index + 1}: </span>
                    {step.title}
                  </h3>
                  {step.description ? (
                    <p style={{ color: 'var(--kt-text-secondary)' }}>{step.description}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {solution.userTypes.length > 0 || solution.integrations.length > 0 ? (
        <Section theme="LIGHT" compact>
          <Grid columns={2}>
            {solution.userTypes.length > 0 ? (
              <div>
                <SectionHeader eyebrow="Users" heading="Who uses it" level={2} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {solution.userTypes.map((type) => (
                    <Badge key={type} tone="brand">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
            {solution.integrations.length > 0 ? (
              <div>
                <SectionHeader eyebrow="Integrations" heading="What it connects to" level={2} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {solution.integrations.map((integration) => (
                    <Badge key={integration} tone="accent">
                      {integration}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </Grid>
        </Section>
      ) : null}

      {solution.gallery.length > 0 ? (
        <Section theme="WHITE">
          <SectionHeader eyebrow="Gallery" heading="Selected screens" />
          <Gallery images={solution.gallery} />
        </Section>
      ) : null}

      {solution.relatedProducts.length > 0 ? (
        <Section theme="DARK">
          <SectionHeader eyebrow="Products" heading="Key products in this space" />
          <ProductGrid products={solution.relatedProducts} onDark />
        </Section>
      ) : null}

      {solution.relatedServices.length > 0 ? (
        <Section theme="WHITE">
          <SectionHeader eyebrow="Services" heading="How we deliver it" />
          <ServiceGrid services={solution.relatedServices} />
        </Section>
      ) : null}

      {solution.relatedProjects.length > 0 ? (
        <Section theme="LIGHT">
          <SectionHeader eyebrow="Work" heading="Related projects" />
          <PortfolioGrid projects={solution.relatedProjects} />
        </Section>
      ) : null}

      {solution.faqs.length > 0 ? (
        <Section theme="SOFT_TEAL">
          <SectionHeader eyebrow="Questions" heading="Frequently asked" />
          <FaqList faqs={solution.faqs} />
        </Section>
      ) : null}

      <Section theme="BRAND_GRADIENT">
        <CtaPanel
          heading={solution.cta.heading ?? `Talk to us about ${solution.name.toLowerCase()}`}
          description="Start with what is going wrong today. The rest follows from that."
          primaryCta={{
            label: solution.cta.label ?? 'Start a Project',
            href: solution.cta.href ?? '/request-a-quote',
          }}
          secondaryCta={{ label: 'All solutions', href: '/solutions' }}
          onDark
        />
      </Section>
    </>
  );
}
