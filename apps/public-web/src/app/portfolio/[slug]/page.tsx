import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { PROJECT_STATUS_LABEL } from '@kts/shared-types';
import { webPageJsonLd } from '@kts/seo';
import {
  Badge,
  Breadcrumbs,
  ButtonLink,
  ButtonRow,
  CaseStudyGrid,
  CheckList,
  CtaPanel,
  Gallery,
  Grid,
  PageHero,
  ProductGrid,
  Prose,
  Section,
  SectionHeader,
  ServiceGrid,
  SmartImage,
} from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.detail;

export async function generateStaticParams() {
  const projects = await api.projects({ pageSize: 100 }).catch(() => ({ items: [] }));
  return projects.items.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const project = await api.project(params.slug);
  if (!project) {
    return pageMetadata({
      path: `/portfolio/${params.slug}`,
      title: 'Project not found',
      forceNoIndex: true,
    });
  }
  return pageMetadata({
    path: `/portfolio/${project.slug}`,
    title: project.title,
    description: project.summary,
    seo: project.seo,
    image: project.coverImage
      ? {
          url: project.coverImage.variants.openGraph ?? project.coverImage.variants.original,
          alt: project.coverImage.altText ?? project.title,
        }
      : null,
    modifiedTime: project.updatedAt,
  });
}

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const project = await api.project(params.slug);
  if (!project) notFound();

  const path = `/portfolio/${project.slug}`;
  const { trail, jsonLd } = breadcrumbs([
    { name: 'Portfolio', path: '/portfolio' },
    { name: project.title, path },
  ]);

  const dateFormat = (value: string | null) =>
    value ? new Date(value).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : null;

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            siteUrl: SITE_URL,
            url: url(path),
            name: project.title,
            description: project.summary,
            datePublished: project.publishedAt,
            dateModified: project.updatedAt,
            primaryImageUrl: project.coverImage?.variants.original ?? null,
          }),
          jsonLd,
        ]}
      />

      <Breadcrumbs items={trail} />
      <PageHero
        eyebrow="Portfolio"
        heading={project.title}
        description={project.summary}
        meta={
          <>
            <Badge tone="neutral" withDot>
              {PROJECT_STATUS_LABEL[project.projectStatus]}
            </Badge>
            {project.category ? <Badge tone="brand">{project.category}</Badge> : null}
            {/* A confidential project states the fact rather than hiding it. */}
            {project.isCustomerConfidential ? (
              <span>Customer identity withheld by agreement</span>
            ) : project.customerDisplayName ? (
              <span>{project.customerDisplayName}</span>
            ) : null}
            {dateFormat(project.completionDate) ? (
              <span>Completed {dateFormat(project.completionDate)}</span>
            ) : null}
          </>
        }
        actions={
          project.publicUrl || project.demoUrl ? (
            <ButtonRow>
              {project.publicUrl ? (
                <ButtonLink href={project.publicUrl}>Visit the site</ButtonLink>
              ) : null}
              {project.demoUrl ? (
                <ButtonLink href={project.demoUrl} variant="secondary">
                  See a demo
                </ButtonLink>
              ) : null}
            </ButtonRow>
          ) : null
        }
      />

      {project.coverImage ? (
        <Section theme="WHITE" compact>
          <SmartImage
            media={project.coverImage}
            variant="hero"
            ratio="16 / 9"
            priority
            branded
            sizes="(max-width: 1279px) 100vw, 1200px"
          />
        </Section>
      ) : null}

      {project.challenge ? (
        <Section theme="SOFT_PURPLE">
          <SectionHeader eyebrow="01 — Challenge" heading="What had to be solved" />
          <Prose html={project.challenge} />
        </Section>
      ) : null}

      {project.approach ? (
        <Section theme="WHITE">
          <SectionHeader eyebrow="02 — Approach" heading="How we went about it" />
          <Prose html={project.approach} />
        </Section>
      ) : null}

      {project.solution ? (
        <Section theme="LIGHT">
          <SectionHeader eyebrow="03 — Solution" heading="What was built" />
          <Prose html={project.solution} />
        </Section>
      ) : null}

      {project.features.length > 0 || project.deliverables.length > 0 ? (
        <Section theme="WHITE">
          <Grid columns={2}>
            {project.features.length > 0 ? (
              <div>
                <SectionHeader eyebrow="Features" heading="What it does" level={2} />
                <CheckList items={project.features} />
              </div>
            ) : null}
            {project.deliverables.length > 0 ? (
              <div>
                <SectionHeader eyebrow="Deliverables" heading="What was handed over" level={2} />
                <CheckList items={project.deliverables} />
              </div>
            ) : null}
          </Grid>
        </Section>
      ) : null}

      {project.gallery.length > 0 ? (
        <Section theme="LIGHT">
          <SectionHeader eyebrow="Gallery" heading="Selected screens" />
          <Gallery images={project.gallery} />
        </Section>
      ) : null}

      {project.technologies.length > 0 ? (
        <Section theme="WHITE" compact>
          <SectionHeader eyebrow="Technology" heading="Stack" level={2} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {project.technologies.map((technology) => (
              <Badge key={technology.id} tone="neutral">
                {technology.name}
              </Badge>
            ))}
          </div>
        </Section>
      ) : null}

      {project.caseStudies.length > 0 ? (
        <Section theme="LIGHT">
          <SectionHeader eyebrow="In depth" heading="Case studies from this project" />
          <CaseStudyGrid caseStudies={project.caseStudies} />
        </Section>
      ) : null}

      {project.products.length > 0 ? (
        <Section theme="DARK">
          <SectionHeader eyebrow="Products" heading="Related Key products" />
          <ProductGrid products={project.products} onDark />
        </Section>
      ) : null}

      {project.services.length > 0 ? (
        <Section theme="WHITE">
          <SectionHeader eyebrow="Services" heading="What this engagement involved" />
          <ServiceGrid services={project.services} />
        </Section>
      ) : null}

      <Section theme="BRAND_GRADIENT">
        <CtaPanel
          heading="Building something comparable?"
          description="Describe the problem. We will tell you what is similar and what is genuinely different."
          primaryCta={{ label: 'Start a Project', href: '/request-a-quote' }}
          secondaryCta={{ label: 'More work', href: '/portfolio' }}
          onDark
        />
      </Section>
    </>
  );
}
