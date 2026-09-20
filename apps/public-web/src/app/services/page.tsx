import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { collectionPageJsonLd } from '@kts/seo';
import type { ServiceSummaryDto } from '@kts/shared-types';
import { Breadcrumbs, CtaPanel, PageHero, Section, SectionHeader, ServiceGrid } from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.listing;

const TITLE = 'Services';
const DESCRIPTION =
  'Custom web applications, SaaS products, business automation, booking platforms, commerce, APIs, databases and the design and SEO work around them.';

export function generateMetadata(): Metadata {
  return pageMetadata({ path: '/services', title: TITLE, description: DESCRIPTION });
}

export default async function ServicesPage() {
  const services = await api.services({ pageSize: 60 }).catch(() => ({ items: [], meta: null }));
  const { trail, jsonLd } = breadcrumbs([{ name: TITLE, path: '/services' }]);

  // Group by category so a long list reads as a structure rather than a wall.
  const groups = new Map<
    string,
    { name: string; description: string | null; items: ServiceSummaryDto[] }
  >();
  for (const service of services.items) {
    const key = service.category?.slug ?? 'other';
    if (!groups.has(key)) {
      groups.set(key, {
        name: service.category?.name ?? 'Other services',
        description: service.category?.description ?? null,
        items: [],
      });
    }
    groups.get(key)?.items.push(service);
  }

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd({
            siteUrl: SITE_URL,
            url: url('/services'),
            name: TITLE,
            description: DESCRIPTION,
            items: services.items.map((service) => ({
              name: service.name,
              url: url(`/services/${service.slug}`),
            })),
          }),
          jsonLd,
        ]}
      />
      <Breadcrumbs items={trail} />
      <PageHero
        eyebrow="What we do"
        heading="Services built around the work, not around a template"
        description={DESCRIPTION}
      />

      {Array.from(groups.entries()).map(([key, group], index) => (
        <Section key={key} theme={index % 2 === 0 ? 'WHITE' : 'LIGHT'}>
          <SectionHeader
            eyebrow={String(index + 1).padStart(2, '0')}
            heading={group.name}
            description={group.description}
          />
          <ServiceGrid services={group.items} />
        </Section>
      ))}

      <Section theme="DARK">
        <CtaPanel
          heading="Not sure which of these you need?"
          description="Describe the problem rather than the solution. We will tell you which parts are relevant and which are not."
          primaryCta={{ label: 'Start a Project', href: '/request-a-quote' }}
          secondaryCta={{ label: 'Contact us', href: '/contact' }}
          onDark
        />
      </Section>
    </>
  );
}
