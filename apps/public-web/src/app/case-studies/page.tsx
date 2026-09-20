import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { collectionPageJsonLd } from '@kts/seo';
import { Breadcrumbs, CaseStudyGrid, CtaPanel, PageHero, Section, SectionHeader } from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { Pagination } from '@/components/Pagination';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.listing;

const DESCRIPTION =
  'Longer write-ups of how specific problems were approached, from discovery and architecture through to what was delivered.';

export function generateMetadata({ searchParams }: { searchParams: { page?: string } }): Metadata {
  const page = Number(searchParams?.page ?? 1);
  return pageMetadata({
    path: page > 1 ? `/case-studies?page=${page}` : '/case-studies',
    title: page > 1 ? `Case studies - page ${page}` : 'Case studies',
    description: DESCRIPTION,
  });
}

export default async function CaseStudiesPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const studies = await api.caseStudies({ page }).catch(() => ({
    items: [],
    meta: { page: 1, pageSize: 12, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
  }));

  const { trail, jsonLd } = breadcrumbs([{ name: 'Case studies', path: '/case-studies' }]);

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd({
            siteUrl: SITE_URL,
            url: url('/case-studies'),
            name: 'Case studies',
            description: DESCRIPTION,
            items: studies.items.map((s) => ({
              name: s.title,
              url: url(`/case-studies/${s.slug}`),
            })),
          }),
          jsonLd,
        ]}
      />
      <Breadcrumbs items={trail} />
      <PageHero
        eyebrow="Case studies"
        heading="How the work actually went"
        description={DESCRIPTION}
      />

      <Section theme="WHITE">
        <SectionHeader
          eyebrow="Case studies"
          heading="Discovery, decisions and trade-offs"
          description="Where a result has not been independently verified, no number is published. Engineering reasoning is what these describe."
        />
        <CaseStudyGrid caseStudies={studies.items} />
        <Pagination meta={studies.meta} basePath="/case-studies" />
      </Section>

      <Section theme="DARK">
        <CtaPanel
          heading="Want this level of detail on your project?"
          description="That is roughly what a discovery phase produces before any code is written."
          primaryCta={{ label: 'Start a Project', href: '/request-a-quote' }}
          onDark
        />
      </Section>
    </>
  );
}
