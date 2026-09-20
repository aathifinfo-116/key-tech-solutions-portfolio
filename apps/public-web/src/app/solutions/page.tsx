import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { collectionPageJsonLd } from '@kts/seo';
import {
  Breadcrumbs,
  CtaPanel,
  IndustryGrid,
  PageHero,
  Section,
  SectionHeader,
  SolutionGrid,
} from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.listing;

const DESCRIPTION =
  'How Key Tech Solutions addresses specific business problems: venue booking, automotive parts, appointments, inventory, multi-tenant SaaS, customer portals and corporate portfolio management.';

export function generateMetadata(): Metadata {
  return pageMetadata({ path: '/solutions', title: 'Solutions', description: DESCRIPTION });
}

export default async function SolutionsPage() {
  const [solutions, industries] = await Promise.all([
    api.solutions({ pageSize: 50 }).catch(() => ({ items: [], meta: null })),
    api.industries({ pageSize: 20 }).catch(() => ({ items: [], meta: null })),
  ]);
  const { trail, jsonLd } = breadcrumbs([{ name: 'Solutions', path: '/solutions' }]);

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd({
            siteUrl: SITE_URL,
            url: url('/solutions'),
            name: 'Solutions',
            description: DESCRIPTION,
            items: solutions.items.map((s) => ({ name: s.name, url: url(`/solutions/${s.slug}`) })),
          }),
          jsonLd,
        ]}
      />
      <Breadcrumbs items={trail} />
      <PageHero
        eyebrow="Solutions"
        heading="Common problems, worked through end to end"
        description={DESCRIPTION}
      />

      <Section theme="WHITE">
        <SectionHeader
          eyebrow="01 — Solutions"
          heading="Each one names the challenge before the capability"
          description="A solution page describes the business problem, the capabilities that address it and the workflow it produces."
        />
        <SolutionGrid solutions={solutions.items} />
      </Section>

      {industries.items.length > 0 ? (
        <Section theme="LIGHT">
          <SectionHeader eyebrow="02 — Industries" heading="Sectors we work in" />
          <IndustryGrid industries={industries.items} />
        </Section>
      ) : null}

      <Section theme="DARK">
        <CtaPanel
          heading="Your problem is not on this list?"
          description="Most are not, exactly. Describe it and we will tell you which parts we have solved before."
          primaryCta={{ label: 'Start a Project', href: '/request-a-quote' }}
          onDark
        />
      </Section>
    </>
  );
}
