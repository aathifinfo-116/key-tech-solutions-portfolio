import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { collectionPageJsonLd } from '@kts/seo';
import { Breadcrumbs, CtaPanel, IndustryGrid, PageHero, Section, SectionHeader } from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.listing;

const DESCRIPTION =
  'Sectors Key Tech Solutions builds software for, and the specific operational problems each one brings.';

export function generateMetadata(): Metadata {
  return pageMetadata({ path: '/industries', title: 'Industries', description: DESCRIPTION });
}

export default async function IndustriesPage() {
  const industries = await api
    .industries({ pageSize: 40 })
    .catch(() => ({ items: [], meta: null }));
  const { trail, jsonLd } = breadcrumbs([{ name: 'Industries', path: '/industries' }]);

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd({
            siteUrl: SITE_URL,
            url: url('/industries'),
            name: 'Industries',
            description: DESCRIPTION,
            items: industries.items.map((i) => ({
              name: i.name,
              url: url(`/industries/${i.slug}`),
            })),
          }),
          jsonLd,
        ]}
      />
      <Breadcrumbs items={trail} />
      <PageHero eyebrow="Industries" heading="Sectors we work in" description={DESCRIPTION} />
      <Section theme="WHITE">
        <IndustryGrid industries={industries.items} />
      </Section>
      <Section theme="DARK">
        <CtaPanel
          heading="Not listed here?"
          description="Sector experience helps, but the constraints usually rhyme. Tell us the problem."
          primaryCta={{ label: 'Start a Project', href: '/request-a-quote' }}
          onDark
        />
      </Section>
    </>
  );
}
