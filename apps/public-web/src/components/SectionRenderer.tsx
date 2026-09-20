/**
 * Page builder renderer.
 *
 * Maps a stored PageSectionDto onto the fixed set of layouts in @kts/ui.
 * An unrecognised section type renders nothing rather than throwing, so a
 * future section added in the admin panel degrades instead of breaking the
 * page for every visitor.
 */

import type { PageSectionDto } from '@kts/shared-types';
import {
  ButtonLink,
  CapabilityStrip,
  CaseStudyGrid,
  CtaPanel,
  DownloadList,
  FaqList,
  Gallery,
  Hero,
  IndustryGrid,
  BlogGrid,
  LogoCloud,
  ProcessSteps,
  ProductGrid,
  Prose,
  Section,
  SectionHeader,
  ServiceGrid,
  SolutionGrid,
  SplitContent,
  Statistics,
  TeamGrid,
  TechnologyGroups,
  TestimonialList,
  Timeline,
  ValueGrid,
  VideoEmbed,
  PortfolioGrid,
  isDarkTheme,
} from '@kts/ui';
import { ContactForm } from '@/components/forms/ContactForm';
import { QuoteForm } from '@/components/forms/QuoteForm';

export function SectionRenderer({ sections }: { sections: PageSectionDto[] }) {
  return (
    <>
      {sections.map((section, index) => (
        <SectionBlock key={section.id} section={section} isFirst={index === 0} />
      ))}
    </>
  );
}

function SectionBlock({ section, isFirst }: { section: PageSectionDto; isFirst: boolean }) {
  const onDark = isDarkTheme(section.theme);
  const data = section.data ?? {};

  // The hero owns its own band, including the backdrop, so it is not wrapped.
  if (section.type === 'HERO') {
    return (
      <Hero
        eyebrow={section.eyebrow}
        heading={section.heading ?? ''}
        highlight={pickHighlight(section.heading)}
        description={section.description}
        primaryCta={section.primaryCta}
        secondaryCta={section.secondaryCta}
        media={isFirst ? section.media : section.media}
      />
    );
  }

  const header = (
    <SectionHeader
      eyebrow={section.eyebrow}
      heading={section.heading}
      description={section.description}
      align={section.layoutVariant === 'centered' ? 'center' : 'start'}
    />
  );

  return (
    <Section theme={section.theme} id={slugifyId(section.internalName)}>
      {section.type !== 'CTA' ? header : null}
      {renderBody()}
    </Section>
  );

  function renderBody() {
    switch (section.type) {
      case 'RICH_TEXT':
        return section.bodyHtml ? (
          <Prose html={section.bodyHtml} wide={section.layoutVariant === 'legal'} />
        ) : null;

      case 'SPLIT_CONTENT':
        return (
          <SplitContent
            bodyHtml={section.bodyHtml}
            media={section.media}
            mediaFirst={section.layoutVariant === 'media-left'}
            cta={section.primaryCta}
          />
        );

      case 'CAPABILITY_STRIP':
        return <CapabilityStrip items={readItems(section)} />;

      case 'SERVICE_GRID':
        return (
          <>
            <ServiceGrid services={data.services ?? []} onDark={onDark} />
            {ctaRow()}
          </>
        );

      case 'PRODUCT_GRID':
        return (
          <>
            <ProductGrid products={data.products ?? []} onDark={onDark} />
            {ctaRow()}
          </>
        );

      case 'SOLUTION_GRID':
        return (
          <>
            <SolutionGrid solutions={data.solutions ?? []} />
            {ctaRow()}
          </>
        );

      case 'INDUSTRY_GRID':
        return <IndustryGrid industries={data.industries ?? []} />;

      case 'PORTFOLIO_GRID':
        return (
          <>
            <PortfolioGrid projects={data.projects ?? []} />
            {ctaRow()}
          </>
        );

      case 'CASE_STUDY':
        return <CaseStudyGrid caseStudies={data.caseStudies ?? []} />;

      case 'BLOG_PREVIEW':
        return (
          <>
            <BlogGrid posts={data.posts ?? []} />
            {ctaRow()}
          </>
        );

      case 'PROCESS_STEPS':
        return (
          <>
            <ProcessSteps
              phases={data.processPhases ?? []}
              detailed={section.layoutVariant === 'detailed'}
            />
            {ctaRow()}
          </>
        );

      case 'STATISTICS':
        return <Statistics statistics={data.statistics ?? []} />;

      case 'VALUES':
        return <ValueGrid values={data.values ?? []} />;

      case 'TIMELINE':
        return <Timeline milestones={data.milestones ?? []} />;

      case 'TEAM':
        return <TeamGrid members={data.team ?? []} />;

      case 'TESTIMONIALS':
        return <TestimonialList testimonials={data.testimonials ?? []} />;

      case 'LOGO_CLOUD':
        return <LogoCloud clients={data.clients ?? []} />;

      case 'TECHNOLOGY_GRID':
        return (
          <>
            <TechnologyGroups groups={data.technologies ?? []} />
            {ctaRow()}
          </>
        );

      case 'FAQ':
        return <FaqList faqs={data.faqs ?? []} />;

      case 'IMAGE_GALLERY':
        return <Gallery images={data.gallery ?? []} />;

      case 'DOWNLOAD':
        return <DownloadList documents={data.downloads ?? []} />;

      case 'VIDEO':
        return section.backgroundImageUrl ? (
          <VideoEmbed url={section.backgroundImageUrl} title={section.heading ?? 'Video'} />
        ) : null;

      case 'QUOTE':
        return section.bodyHtml ? <Prose html={section.bodyHtml} /> : null;

      case 'CONTACT_BLOCK':
        return section.layoutVariant === 'quote' ? <QuoteForm /> : <ContactForm />;

      case 'CTA':
        return (
          <CtaPanel
            heading={section.heading ?? ''}
            description={section.description}
            primaryCta={section.primaryCta}
            secondaryCta={section.secondaryCta}
            onDark={onDark}
          />
        );

      default:
        return null;
    }
  }

  function ctaRow() {
    if (!section.primaryCta) return null;
    return (
      <div style={{ marginTop: 'var(--kt-space-7)' }}>
        <ButtonLink href={section.primaryCta.href} variant="secondary" onDark={onDark}>
          {section.primaryCta.label}
        </ButtonLink>
      </div>
    );
  }
}

/** Reads the `items` array from a section's settings, defensively. */
function readItems(section: PageSectionDto): Array<{ label: string }> {
  const items = (section.settings as { items?: unknown } | null)?.items;
  if (!Array.isArray(items)) return [];
  return items
    .filter(
      (item): item is { label: string } =>
        Boolean(item) && typeof (item as { label?: unknown }).label === 'string',
    )
    .map((item) => ({ label: item.label }));
}

/**
 * Picks the trailing phrase of a heading to render in the brand gradient.
 * Purely presentational, and only applied when the heading is long enough for
 * the emphasis to read as deliberate.
 */
function pickHighlight(heading: string | null): string | null {
  if (!heading) return null;
  const words = heading.trim().split(/\s+/);
  if (words.length < 4) return null;
  return words.slice(-2).join(' ');
}

function slugifyId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
