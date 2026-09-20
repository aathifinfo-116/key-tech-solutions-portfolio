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
  ProductGrid,
  Prose,
  Section,
  SectionHeader,
  SolutionGrid,
  PortfolioGrid,
} from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.detail;
export const dynamicParams = true;

/** Pre-renders every published service at build time; new ones stream in. */
export async function generateStaticParams() {
  const services = await api.services({ pageSize: 100 }).catch(() => ({ items: [] }));
  return services.items.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const service = await api.service(params.slug);
  if (!service)
    return pageMetadata({
      path: `/services/${params.slug}`,
      title: 'Service not found',
      forceNoIndex: true,
    });

  return pageMetadata({
    path: `/services/${service.slug}`,
    title: service.name,
    description: service.shortDescription,
    seo: service.seo,
    image: service.coverImage
      ? {
          url: service.coverImage.variants.openGraph ?? service.coverImage.variants.original,
          alt: service.coverImage.altText ?? service.name,
        }
      : null,
    modifiedTime: service.updatedAt,
  });
}

export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = await api.service(params.slug);
  if (!service) notFound();

  const path = `/services/${service.slug}`;
  const { trail, jsonLd } = breadcrumbs([
    { name: 'Services', path: '/services' },
    { name: service.name, path },
  ]);

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            siteUrl: SITE_URL,
            url: url(path),
            name: service.name,
            description: service.shortDescription,
            datePublished: service.publishedAt,
            dateModified: service.updatedAt,
            primaryImageUrl: service.coverImage?.variants.original ?? null,
          }),
          serviceJsonLd({
            siteUrl: SITE_URL,
            url: url(path),
            name: service.name,
            description: service.shortDescription,
            serviceType: service.category?.name,
            imageUrl: service.coverImage?.variants.original ?? null,
          }),
          jsonLd,
          // Only emitted when there are real questions on the page.
          ...(service.faqs.length > 0 ? [faqJsonLd(service.faqs)!] : []),
        ]}
      />

      <Breadcrumbs items={trail} />
      <PageHero
        eyebrow={service.category?.name ?? 'Service'}
        heading={service.name}
        description={service.shortDescription}
        meta={service.isFeatured ? <Badge tone="brand">Featured service</Badge> : null}
      />

      {service.fullDescription ? (
        <Section theme="WHITE">
          <Prose html={service.fullDescription} />
        </Section>
      ) : null}

      {service.benefits.length > 0 || service.capabilities.length > 0 ? (
        <Section theme="LIGHT">
          <Grid columns={2}>
            {service.benefits.length > 0 ? (
              <div>
                <SectionHeader eyebrow="Why it matters" heading="What you get" level={2} />
                <CheckList items={service.benefits} />
              </div>
            ) : null}
            {service.capabilities.length > 0 ? (
              <div>
                <SectionHeader eyebrow="Scope" heading="What is included" level={2} />
                <CheckList items={service.capabilities} />
              </div>
            ) : null}
          </Grid>
        </Section>
      ) : null}

      {service.deliverables.length > 0 ? (
        <Section theme="SOFT_PURPLE">
          <SectionHeader
            eyebrow="Deliverables"
            heading="What you receive"
            description="Concrete artefacts, handed over and owned by you."
          />
          <CheckList items={service.deliverables} />
        </Section>
      ) : null}

      {service.features.length > 0 ? (
        <Section theme="WHITE">
          <SectionHeader eyebrow="Capabilities" heading="In more detail" />
          <Grid columns={3}>
            {service.features.map((feature) => (
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

      {service.gallery.length > 0 ? (
        <Section theme="LIGHT">
          <SectionHeader eyebrow="Gallery" heading="Selected screens" />
          <Gallery images={service.gallery} />
        </Section>
      ) : null}

      {service.technologies.length > 0 ? (
        <Section theme="WHITE" compact>
          <SectionHeader eyebrow="Technology" heading="What we build it with" level={2} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {service.technologies.map((technology) => (
              <Badge key={technology.id} tone="neutral">
                {technology.name}
              </Badge>
            ))}
          </div>
        </Section>
      ) : null}

      {service.relatedProducts.length > 0 ? (
        <Section theme="DARK">
          <SectionHeader
            eyebrow="Related products"
            heading="Key products built on this capability"
          />
          <ProductGrid products={service.relatedProducts} onDark />
        </Section>
      ) : null}

      {service.relatedSolutions.length > 0 ? (
        <Section theme="WHITE">
          <SectionHeader eyebrow="Related solutions" heading="Where this fits" />
          <SolutionGrid solutions={service.relatedSolutions} />
        </Section>
      ) : null}

      {service.relatedProjects.length > 0 ? (
        <Section theme="LIGHT">
          <SectionHeader eyebrow="Related work" heading="Projects using this service" />
          <PortfolioGrid projects={service.relatedProjects} />
        </Section>
      ) : null}

      {service.faqs.length > 0 ? (
        <Section theme="SOFT_TEAL">
          <SectionHeader eyebrow="Questions" heading="Frequently asked" />
          <FaqList faqs={service.faqs} />
        </Section>
      ) : null}

      <Section theme="BRAND_GRADIENT">
        <CtaPanel
          heading={service.cta.heading ?? `Talk to us about ${service.name.toLowerCase()}`}
          description={
            service.cta.description ??
            'Describe the problem and we will tell you plainly whether we are the right fit.'
          }
          primaryCta={{
            label: service.cta.label ?? 'Start a Project',
            href: service.cta.href ?? '/request-a-quote',
          }}
          secondaryCta={{ label: 'All services', href: '/services' }}
          onDark
        />
      </Section>
    </>
  );
}
