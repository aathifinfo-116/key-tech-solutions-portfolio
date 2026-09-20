import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { webPageJsonLd } from '@kts/seo';
import {
  Breadcrumbs,
  CtaPanel,
  PageHero,
  ProcessSteps,
  Section,
  SectionHeader,
  ValueGrid,
} from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.listing;

const DESCRIPTION =
  'The ten phases of a Key Tech Solutions engagement, from discovery through architecture and quality assurance to continuous improvement, each with named deliverables.';

export function generateMetadata(): Metadata {
  return pageMetadata({ path: '/process', title: 'Our process', description: DESCRIPTION });
}

export default async function ProcessPage() {
  const [phases, values] = await Promise.all([
    api.processPhases().catch(() => []),
    api.values().catch(() => []),
  ]);
  const { trail, jsonLd } = breadcrumbs([{ name: 'Process', path: '/process' }]);

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            siteUrl: SITE_URL,
            url: url('/process'),
            name: 'Our process',
            description: DESCRIPTION,
          }),
          jsonLd,
        ]}
      />
      <Breadcrumbs items={trail} />
      <PageHero
        eyebrow="Process"
        heading="Ten phases, each with something you can hold"
        description={DESCRIPTION}
      />

      <Section theme="WHITE">
        <SectionHeader
          eyebrow="Delivery"
          heading="How an engagement runs"
          description="You always know which phase a project is in and what comes out of it."
        />
        <ProcessSteps phases={phases} detailed />
      </Section>

      {values.length > 0 ? (
        <Section theme="LIGHT">
          <SectionHeader eyebrow="Principles" heading="What holds across every phase" />
          <ValueGrid values={values} />
        </Section>
      ) : null}

      <Section theme="BRAND_GRADIENT">
        <CtaPanel
          heading="Ready to start at phase one?"
          description="Discovery is a paid, standalone phase. Its output is yours whether or not we build the rest."
          primaryCta={{ label: 'Start a Project', href: '/request-a-quote' }}
          secondaryCta={{ label: 'See our services', href: '/services' }}
          onDark
        />
      </Section>
    </>
  );
}
