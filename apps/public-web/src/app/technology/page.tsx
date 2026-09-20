import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { webPageJsonLd } from '@kts/seo';
import { Breadcrumbs, CtaPanel, PageHero, Section, SectionHeader, TechnologyGroups } from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.listing;

const DESCRIPTION =
  'The technology Key Tech Solutions builds on: TypeScript, Next.js, NestJS, PostgreSQL, Prisma and Docker, chosen for maintainability rather than novelty.';

export function generateMetadata(): Metadata {
  return pageMetadata({ path: '/technology', title: 'Technology', description: DESCRIPTION });
}

export default async function TechnologyPage() {
  const groups = await api.technologies().catch(() => []);
  const { trail, jsonLd } = breadcrumbs([{ name: 'Technology', path: '/technology' }]);

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            siteUrl: SITE_URL,
            url: url('/technology'),
            name: 'Technology',
            description: DESCRIPTION,
          }),
          jsonLd,
        ]}
      />
      <Breadcrumbs items={trail} />
      <PageHero
        eyebrow="Technology"
        heading="What we build on, and why"
        description={DESCRIPTION}
      />

      <Section theme="WHITE">
        <SectionHeader
          eyebrow="Selection"
          heading="Boring on purpose"
          description="The test we apply is not which option is most capable, but whether another competent team can maintain it in three years. That rules out a lot of interesting choices, which is the point."
        />
      </Section>

      <Section theme="LIGHT">
        <SectionHeader eyebrow="The stack" heading="Grouped by role" />
        <TechnologyGroups groups={groups} />
      </Section>

      <Section theme="WHITE">
        <SectionHeader
          eyebrow="A note on claims"
          heading="No partnership or certification is implied"
          description="Listing a technology here means we use it. It does not imply endorsement by, partnership with, or certification from its vendor."
        />
      </Section>

      <Section theme="DARK">
        <CtaPanel
          heading="Want to discuss a stack decision?"
          description="Including the case for not rewriting what you already have."
          primaryCta={{ label: 'Contact us', href: '/contact' }}
          secondaryCta={{ label: 'Our process', href: '/process' }}
          onDark
        />
      </Section>
    </>
  );
}
