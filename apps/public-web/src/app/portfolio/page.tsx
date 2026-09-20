import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { collectionPageJsonLd } from '@kts/seo';
import { Breadcrumbs, CtaPanel, PageHero, PortfolioGrid, Section, SectionHeader } from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { Pagination } from '@/components/Pagination';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.listing;

const DESCRIPTION =
  'Platforms Key Tech Solutions has built and is building, including the products behind the Key brand.';

export function generateMetadata({ searchParams }: { searchParams: { page?: string } }): Metadata {
  const page = Number(searchParams?.page ?? 1);
  return pageMetadata({
    path: page > 1 ? `/portfolio?page=${page}` : '/portfolio',
    title: page > 1 ? `Portfolio - page ${page}` : 'Portfolio',
    description: DESCRIPTION,
  });
}

export default async function PortfolioPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const projects = await api.projects({ page }).catch(() => ({
    items: [],
    meta: { page: 1, pageSize: 12, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
  }));

  const { trail, jsonLd } = breadcrumbs([{ name: 'Portfolio', path: '/portfolio' }]);

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd({
            siteUrl: SITE_URL,
            url: url('/portfolio'),
            name: 'Portfolio',
            description: DESCRIPTION,
            items: projects.items.map((p) => ({ name: p.title, url: url(`/portfolio/${p.slug}`) })),
          }),
          jsonLd,
        ]}
      />
      <Breadcrumbs items={trail} />
      <PageHero
        eyebrow="Portfolio"
        heading="Work in progress and platforms in production"
        description={DESCRIPTION}
      />

      <Section theme="WHITE">
        <SectionHeader
          eyebrow="Projects"
          heading="What we have built"
          description="Where a customer has asked to remain unnamed, the project is described without identifying them."
        />
        <PortfolioGrid projects={projects.items} />
        <Pagination meta={projects.meta} basePath="/portfolio" />
      </Section>

      <Section theme="DARK">
        <CtaPanel
          heading="Have something similar in mind?"
          description="The quickest route to a useful answer is a short description of the problem."
          primaryCta={{ label: 'Start a Project', href: '/request-a-quote' }}
          secondaryCta={{ label: 'Read the case studies', href: '/case-studies' }}
          onDark
        />
      </Section>
    </>
  );
}
