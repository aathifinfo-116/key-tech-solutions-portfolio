/**
 * Section layouts.
 *
 * These are the controlled set the page builder exposes. They are server
 * components: the only JavaScript on a page comes from the reveal wrapper, the
 * statistic counter and the mobile menu.
 */

import Link from 'next/link';
import type {
  BlogPostSummaryDto,
  CaseStudySummaryDto,
  ClientDto,
  CompanyMilestoneDto,
  CompanyValueDto,
  CtaDto,
  DocumentAssetDto,
  FaqDto,
  IndustrySummaryDto,
  MediaAssetDto,
  PortfolioSummaryDto,
  ProcessPhaseDto,
  ProductSummaryDto,
  ServiceSummaryDto,
  SolutionSummaryDto,
  StatisticDto,
  TeamMemberDto,
  TechnologyGroupDto,
  TestimonialDto,
} from '@kts/shared-types';
import { PRODUCT_STATUS_LABEL, PROJECT_STATUS_LABEL } from '@kts/shared-types';
import {
  Badge,
  ButtonLink,
  ButtonRow,
  Card,
  CardBody,
  CardFooter,
  CardHeading,
  CheckList,
  Container,
  EmptyState,
  Grid,
  Prose,
  SectionHeader,
  TextLink,
  cx,
} from '../primitives';
import { CountUp, Reveal } from '../motion';
import { SmartAvatar, SmartImage, SmartLogo } from '../media/SmartImage';
import styles from './sections.module.css';

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export interface HeroProps {
  eyebrow?: string | null;
  heading: string;
  /** Words in the heading rendered with the brand gradient. */
  highlight?: string | null;
  description?: string | null;
  primaryCta?: CtaDto | null;
  secondaryCta?: CtaDto | null;
  media?: MediaAssetDto | null;
  /** Rendered instead of the abstract panel when no image exists. */
  panelRows?: Array<{ label: string; meta: string }>;
}

export function Hero({
  eyebrow,
  heading,
  highlight,
  description,
  primaryCta,
  secondaryCta,
  media,
  panelRows,
}: HeroProps) {
  const [before, after] =
    highlight && heading.includes(highlight) ? heading.split(highlight) : [heading, null];

  return (
    <section className={styles.hero}>
      <div className={styles.heroBackdrop} aria-hidden="true" />
      {/* Abstract key-line motif, inspired by the brand mark without copying it. */}
      <svg className={styles.heroLines} viewBox="0 0 600 420" fill="none" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, index) => (
          <ellipse
            key={index}
            cx={300}
            cy={210}
            rx={120 + index * 16}
            ry={70 + index * 11}
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeWidth="1"
            transform={`rotate(${index * 6} 300 210)`}
          />
        ))}
      </svg>

      <Container>
        <div className={styles.heroGrid}>
          <div className={styles.heroContent}>
            {eyebrow ? (
              <Reveal>
                <span className="kt-keyline" aria-hidden="true" style={{ marginBottom: 12 }} />
                <span
                  style={{
                    display: 'block',
                    fontSize: 'var(--kt-text-meta)',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--kt-text-secondary)',
                  }}
                >
                  {eyebrow}
                </span>
              </Reveal>
            ) : null}

            <Reveal delay={60}>
              <h1 className={styles.heroHeading}>
                {after !== null ? (
                  <>
                    {before}
                    <span className={styles.heroHighlight}>{highlight}</span>
                    {after}
                  </>
                ) : (
                  heading
                )}
              </h1>
            </Reveal>

            {description ? (
              <Reveal delay={120}>
                <p className={styles.heroLead}>{description}</p>
              </Reveal>
            ) : null}

            {primaryCta || secondaryCta ? (
              <Reveal delay={180}>
                <ButtonRow>
                  {primaryCta ? (
                    <ButtonLink href={primaryCta.href}>{primaryCta.label}</ButtonLink>
                  ) : null}
                  {secondaryCta ? (
                    <ButtonLink href={secondaryCta.href} variant="secondary">
                      {secondaryCta.label}
                    </ButtonLink>
                  ) : null}
                </ButtonRow>
              </Reveal>
            ) : null}
          </div>

          <div className={styles.heroMedia}>
            <Reveal delay={140}>
              {media ? (
                <SmartImage
                  media={media}
                  variant="hero"
                  ratio="4 / 3"
                  priority
                  branded
                  sizes="(max-width: 1023px) 100vw, 480px"
                />
              ) : (
                <HeroPanel rows={panelRows} />
              )}
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** A restrained abstraction of a product interface. No fake data, no numbers. */
function HeroPanel({ rows }: { rows?: Array<{ label: string; meta: string }> }) {
  const content = rows?.length
    ? rows
    : [
        { label: 'Discovery and scope', meta: 'Phase 1' },
        { label: 'Design and architecture', meta: 'Phase 2' },
        { label: 'Build and quality assurance', meta: 'Phase 3' },
        { label: 'Launch and improvement', meta: 'Phase 4' },
      ];

  return (
    <div className={styles.heroPanel} aria-hidden="true">
      <div className={styles.heroPanelBar}>
        <span className={styles.heroPanelDot} />
        <span className={styles.heroPanelDot} />
        <span className={styles.heroPanelDot} />
      </div>
      <div className={styles.heroPanelRows}>
        {content.map((row) => (
          <div key={row.label} className={styles.heroPanelRow}>
            <span className={styles.heroPanelSwatch} />
            <span className={styles.heroPanelLabel}>{row.label}</span>
            <span className={styles.heroPanelMeta}>{row.meta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page hero (interior routes)
// ---------------------------------------------------------------------------

export function PageHero({
  eyebrow,
  heading,
  description,
  meta,
  actions,
}: {
  eyebrow?: string | null;
  heading: string;
  description?: string | null;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className={styles.pageHero}>
      <Container>
        <div className={styles.pageHeroInner}>
          {eyebrow ? (
            <span
              style={{
                fontSize: 'var(--kt-text-meta)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--kt-color-purple)',
              }}
            >
              {eyebrow}
            </span>
          ) : null}
          <h1 style={{ fontSize: 'var(--kt-text-page-heading)' }}>{heading}</h1>
          {description ? (
            <p
              style={{
                fontSize: 'var(--kt-text-lead)',
                color: 'var(--kt-text-secondary)',
                maxWidth: '62ch',
              }}
            >
              {description}
            </p>
          ) : null}
          {meta ? <div className={styles.pageHeroMeta}>{meta}</div> : null}
          {actions}
        </div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Breadcrumbs
// ---------------------------------------------------------------------------

export function Breadcrumbs({ items }: { items: Array<{ name: string; path: string }> }) {
  if (items.length <= 1) return null;
  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      <Container>
        <ol className={styles.breadcrumbList}>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.path} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isLast ? (
                  <span aria-current="page">{item.name}</span>
                ) : (
                  <>
                    <Link className={styles.breadcrumbLink} href={item.path}>
                      {item.name}
                    </Link>
                    <span className={styles.breadcrumbSeparator} aria-hidden="true">
                      /
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </Container>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Capability strip
// ---------------------------------------------------------------------------

export function CapabilityStrip({ items }: { items: Array<{ label: string }> }) {
  if (items.length === 0) return null;
  return (
    <ul className={styles.strip} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((item, index) => (
        <li key={item.label}>
          <Reveal delay={index * 45} className={styles.stripItem}>
            <span className={styles.stripMark} aria-hidden="true" />
            <span>{item.label}</span>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Split content
// ---------------------------------------------------------------------------

export function SplitContent({
  eyebrow,
  heading,
  bodyHtml,
  media,
  mediaFirst,
  cta,
  children,
}: {
  eyebrow?: string | null;
  heading?: string | null;
  bodyHtml?: string | null;
  media?: MediaAssetDto | null;
  mediaFirst?: boolean;
  cta?: CtaDto | null;
  children?: React.ReactNode;
}) {
  return (
    <div className={cx(styles.split, mediaFirst && styles.mediaFirst)}>
      <Reveal className={styles.splitText}>
        <SectionHeader eyebrow={eyebrow} heading={heading} />
        {bodyHtml ? <Prose html={bodyHtml} /> : null}
        {children}
        {cta ? (
          <ButtonRow>
            <ButtonLink href={cta.href} variant="secondary">
              {cta.label}
            </ButtonLink>
          </ButtonRow>
        ) : null}
      </Reveal>
      <Reveal delay={90}>
        <SmartImage media={media} ratio="5 / 4" sizes="(max-width: 1023px) 100vw, 560px" branded />
      </Reveal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Offering grids
// ---------------------------------------------------------------------------

function IconBadge({ children }: { children?: React.ReactNode }) {
  return (
    <span className={styles.iconBadge} aria-hidden="true">
      {children ?? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <rect
            x="11"
            y="3"
            width="6"
            height="6"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <rect
            x="3"
            y="11"
            width="6"
            height="6"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <rect
            x="11"
            y="11"
            width="6"
            height="6"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      )}
    </span>
  );
}

export function ServiceGrid({
  services,
  onDark,
}: {
  services: ServiceSummaryDto[];
  onDark?: boolean;
}) {
  if (services.length === 0) {
    return (
      <EmptyState
        title="No services are published yet."
        description="Published services will appear here."
      />
    );
  }
  return (
    <Grid columns={3}>
      {services.map((service, index) => (
        <Reveal key={service.id} delay={index * 55}>
          <Card href={`/services/${service.slug}`} onDark={onDark}>
            <IconBadge />
            <CardHeading>{service.name}</CardHeading>
            <CardBody>{service.shortDescription}</CardBody>
            {service.category ? (
              <div className={styles.cardMeta}>
                <Badge tone="neutral">{service.category.name}</Badge>
              </div>
            ) : null}
            <CardFooter>
              <span className={styles.cardMeta}>Read more</span>
            </CardFooter>
          </Card>
        </Reveal>
      ))}
    </Grid>
  );
}

export function ProductGrid({
  products,
  onDark,
}: {
  products: ProductSummaryDto[];
  onDark?: boolean;
}) {
  if (products.length === 0) {
    return <EmptyState title="No products are published yet." />;
  }
  return (
    <Grid columns={2}>
      {products.map((product, index) => (
        <Reveal key={product.id} delay={index * 70}>
          <Card href={`/products/${product.slug}`} onDark={onDark}>
            <div className={styles.cardMeta}>
              {product.logo ? (
                <SmartLogo media={product.logo} alt={`${product.name} logo`} height={28} />
              ) : null}
              <Badge tone={onDark ? 'neutral' : 'brand'} withDot>
                {PRODUCT_STATUS_LABEL[product.productStatus]}
              </Badge>
              {product.launchLabel ? <span>{product.launchLabel}</span> : null}
            </div>
            <CardHeading>{product.name}</CardHeading>
            {product.tagline ? <CardBody>{product.tagline}</CardBody> : null}
            <CardBody>{product.summary}</CardBody>
            <CardFooter>
              <span className={styles.cardMeta}>Explore {product.name}</span>
            </CardFooter>
          </Card>
        </Reveal>
      ))}
    </Grid>
  );
}

export function SolutionGrid({ solutions }: { solutions: SolutionSummaryDto[] }) {
  if (solutions.length === 0) return <EmptyState title="No solutions are published yet." />;
  return (
    <Grid columns={3}>
      {solutions.map((solution, index) => (
        <Reveal key={solution.id} delay={index * 55}>
          <Card href={`/solutions/${solution.slug}`}>
            <IconBadge />
            <CardHeading>{solution.name}</CardHeading>
            <CardBody>{solution.summary}</CardBody>
            <CardFooter>
              <span className={styles.cardMeta}>See the solution</span>
            </CardFooter>
          </Card>
        </Reveal>
      ))}
    </Grid>
  );
}

export function IndustryGrid({ industries }: { industries: IndustrySummaryDto[] }) {
  if (industries.length === 0) return <EmptyState title="No industries are published yet." />;
  return (
    <Grid columns={4}>
      {industries.map((industry, index) => (
        <Reveal key={industry.id} delay={index * 40}>
          <Card href={`/industries/${industry.slug}`}>
            <CardHeading>{industry.name}</CardHeading>
            <CardBody>{industry.summary}</CardBody>
          </Card>
        </Reveal>
      ))}
    </Grid>
  );
}

export function PortfolioGrid({ projects }: { projects: PortfolioSummaryDto[] }) {
  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects are published yet."
        description="Published projects will appear here."
      />
    );
  }
  return (
    <Grid columns={3}>
      {projects.map((project, index) => (
        <Reveal key={project.id} delay={index * 55}>
          <Card href={`/portfolio/${project.slug}`}>
            <div className={styles.cardMediaWrap}>
              <SmartImage
                media={project.coverImage}
                ratio="16 / 10"
                alt=""
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 380px"
                placeholderLabel={`${project.title} cover image`}
              />
            </div>
            <div className={styles.cardMeta}>
              <Badge tone="neutral" withDot>
                {PROJECT_STATUS_LABEL[project.projectStatus]}
              </Badge>
              {project.category ? <span>{project.category}</span> : null}
            </div>
            <CardHeading>{project.title}</CardHeading>
            <CardBody>{project.summary}</CardBody>
            {project.isCustomerConfidential ? (
              <span className={styles.cardMeta}>Customer identity withheld by agreement</span>
            ) : project.customerDisplayName ? (
              <span className={styles.cardMeta}>{project.customerDisplayName}</span>
            ) : null}
          </Card>
        </Reveal>
      ))}
    </Grid>
  );
}

export function CaseStudyGrid({ caseStudies }: { caseStudies: CaseStudySummaryDto[] }) {
  if (caseStudies.length === 0) return <EmptyState title="No case studies are published yet." />;
  return (
    <Grid columns={3}>
      {caseStudies.map((study, index) => (
        <Reveal key={study.id} delay={index * 55}>
          <Card href={`/case-studies/${study.slug}`}>
            <div className={styles.cardMediaWrap}>
              <SmartImage
                media={study.coverImage}
                ratio="16 / 10"
                alt=""
                placeholderLabel={`${study.title} cover image`}
              />
            </div>
            <CardHeading>{study.title}</CardHeading>
            <CardBody>{study.summary}</CardBody>
            {study.approvedCustomerName ? (
              <span className={styles.cardMeta}>{study.approvedCustomerName}</span>
            ) : null}
          </Card>
        </Reveal>
      ))}
    </Grid>
  );
}

export function BlogGrid({ posts }: { posts: BlogPostSummaryDto[] }) {
  if (posts.length === 0) return <EmptyState title="No articles are published yet." />;
  return (
    <Grid columns={3}>
      {posts.map((post, index) => (
        <Reveal key={post.id} delay={index * 55}>
          <Card href={`/blog/${post.slug}`}>
            <div className={styles.cardMediaWrap}>
              <SmartImage
                media={post.coverImage}
                ratio="16 / 9"
                alt=""
                placeholderLabel={`${post.title} cover image`}
              />
            </div>
            <div className={styles.cardMeta}>
              {post.category ? <Badge tone="brand">{post.category.name}</Badge> : null}
              {post.publishedAt ? (
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </time>
              ) : null}
              <span>{post.readingMinutes} min read</span>
            </div>
            <CardHeading>{post.title}</CardHeading>
            <CardBody>{post.excerpt}</CardBody>
          </Card>
        </Reveal>
      ))}
    </Grid>
  );
}

// ---------------------------------------------------------------------------
// Process steps
// ---------------------------------------------------------------------------

export function ProcessSteps({
  phases,
  detailed,
}: {
  phases: ProcessPhaseDto[];
  detailed?: boolean;
}) {
  if (phases.length === 0)
    return <EmptyState title="The delivery process has not been published yet." />;
  return (
    <ol className={styles.steps} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {phases.map((phase, index) => (
        <li key={phase.id}>
          <Reveal delay={index * 45} className={styles.step}>
            <span className={styles.stepNumber} aria-hidden="true">
              {String(phase.number).padStart(2, '0')}
            </span>
            <div className={styles.stepBody}>
              <h3 className={styles.stepTitle}>
                <span className="kt-visually-hidden">Phase {phase.number}: </span>
                {phase.name}
              </h3>
              <p style={{ color: 'var(--kt-text-secondary)' }}>{phase.shortDescription}</p>
              {detailed && phase.detailedDescription ? (
                <Prose html={phase.detailedDescription} />
              ) : null}
              {phase.deliverables.length > 0 ? (
                <div className={styles.stepDeliverables}>
                  {phase.deliverables.map((deliverable) => (
                    <Badge key={deliverable} tone="neutral">
                      {deliverable}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Values, timeline, statistics
// ---------------------------------------------------------------------------

export function ValueGrid({ values }: { values: CompanyValueDto[] }) {
  if (values.length === 0) return null;
  return (
    <Grid columns={3}>
      {values.map((value, index) => (
        <Reveal key={value.id} delay={index * 50}>
          <Card>
            <IconBadge />
            <CardHeading>{value.title}</CardHeading>
            <CardBody>{value.description}</CardBody>
          </Card>
        </Reveal>
      ))}
    </Grid>
  );
}

export function Timeline({ milestones }: { milestones: CompanyMilestoneDto[] }) {
  if (milestones.length === 0) return null;
  return (
    <ol className={styles.timeline}>
      {milestones.map((milestone, index) => (
        <li key={milestone.id} className={styles.timelineItem}>
          <Reveal delay={index * 60}>
            <span className={styles.timelineDot} aria-hidden="true" />
            <span className={styles.timelineLabel}>{milestone.label}</span>
            <h3 className={styles.timelineTitle}>{milestone.title}</h3>
            {milestone.description ? (
              <p style={{ color: 'var(--kt-text-secondary)' }}>{milestone.description}</p>
            ) : null}
            {milestone.occurredOn ? (
              <time dateTime={milestone.occurredOn} className={styles.cardMeta}>
                {new Date(milestone.occurredOn).toLocaleDateString('en-GB', {
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
            ) : null}
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

export function Statistics({ statistics }: { statistics: StatisticDto[] }) {
  if (statistics.length === 0) return null;
  return (
    <dl className={styles.stats} style={{ margin: 0 }}>
      {statistics.map((statistic, index) => (
        <Reveal key={statistic.id} delay={index * 55} className={styles.stat}>
          <dd className={styles.statValue} style={{ margin: 0 }}>
            {typeof statistic.numericValue === 'number' && statistic.numericValue > 0 ? (
              <CountUp
                value={statistic.numericValue}
                formatted={statistic.value}
                prefix={statistic.prefix}
                suffix={statistic.suffix}
              />
            ) : (
              <>
                {statistic.prefix}
                {statistic.value}
                {statistic.suffix}
              </>
            )}
          </dd>
          <dt className={styles.statLabel}>{statistic.label}</dt>
          {statistic.description ? (
            <p className={styles.statDescription}>{statistic.description}</p>
          ) : null}
        </Reveal>
      ))}
    </dl>
  );
}

// ---------------------------------------------------------------------------
// Technology, team, social proof
// ---------------------------------------------------------------------------

export function TechnologyGroups({ groups }: { groups: TechnologyGroupDto[] }) {
  if (groups.length === 0) return null;
  return (
    <div className={styles.techGroups}>
      {groups.map((group, index) => (
        <Reveal key={group.category.slug} delay={index * 45} className={styles.techGroup}>
          <h3 className={styles.techGroupTitle}>{group.category.name}</h3>
          {group.category.description ? (
            <p style={{ color: 'var(--kt-text-secondary)', fontSize: 'var(--kt-text-small)' }}>
              {group.category.description}
            </p>
          ) : null}
          <ul className={styles.techList}>
            {group.technologies.map((technology) => (
              <li key={technology.id} className={styles.techPill}>
                {technology.logo ? <SmartLogo media={technology.logo} alt="" height={16} /> : null}
                {technology.name}
              </li>
            ))}
          </ul>
        </Reveal>
      ))}
    </div>
  );
}

export function TeamGrid({ members }: { members: TeamMemberDto[] }) {
  if (members.length === 0) return null;
  return (
    <Grid columns={4}>
      {members.map((member, index) => (
        <Reveal key={member.id} delay={index * 45}>
          <Card className={styles.teamCard}>
            <SmartImage
              media={member.photo}
              ratio="1 / 1"
              alt={member.displayName}
              placeholderLabel={member.displayName}
            />
            <div>
              <p className={styles.teamName}>{member.displayName}</p>
              <p className={styles.teamRole}>{member.jobTitle}</p>
            </div>
            {member.skills.length > 0 ? (
              <div className={styles.cardMeta}>
                {member.skills.slice(0, 3).map((skill) => (
                  <Badge key={skill} tone="neutral">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : null}
            <div className={styles.teamLinks}>
              {member.linkedinUrl ? (
                <a href={member.linkedinUrl} rel="noopener noreferrer" target="_blank">
                  LinkedIn
                  <span className="kt-visually-hidden"> profile for {member.displayName}</span>
                </a>
              ) : null}
              {member.githubUrl ? (
                <a href={member.githubUrl} rel="noopener noreferrer" target="_blank">
                  GitHub
                  <span className="kt-visually-hidden"> profile for {member.displayName}</span>
                </a>
              ) : null}
            </div>
          </Card>
        </Reveal>
      ))}
    </Grid>
  );
}

export function TestimonialList({ testimonials }: { testimonials: TestimonialDto[] }) {
  if (testimonials.length === 0) return null;
  return (
    <Grid columns={testimonials.length >= 3 ? 3 : 2}>
      {testimonials.map((testimonial, index) => (
        <Reveal key={testimonial.id} delay={index * 55}>
          <figure className={styles.quote} style={{ margin: 0 }}>
            <svg
              className={styles.quoteMark}
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M11 6c-3.9 1.7-6 4.8-6 9.3V22h8v-8H8.4c.2-2.4 1.2-4 3.1-5L11 6zm12 0c-3.9 1.7-6 4.8-6 9.3V22h8v-8h-4.6c.2-2.4 1.2-4 3.1-5L23 6z"
                fill="currentColor"
              />
            </svg>
            <blockquote className={styles.quoteText}>{testimonial.quote}</blockquote>
            <figcaption className={styles.quoteAuthor}>
              <SmartAvatar media={testimonial.photo} alt={testimonial.authorName} size={44} />
              <span>
                <span className={styles.quoteAuthorName}>{testimonial.authorName}</span>
                {testimonial.authorRole || testimonial.organization ? (
                  <span className={styles.quoteAuthorRole} style={{ display: 'block' }}>
                    {[testimonial.authorRole, testimonial.organization].filter(Boolean).join(', ')}
                  </span>
                ) : null}
              </span>
            </figcaption>
            {testimonial.isSampleContent ? (
              <Badge tone="warning">Sample content - not a real customer statement</Badge>
            ) : null}
          </figure>
        </Reveal>
      ))}
    </Grid>
  );
}

export function LogoCloud({ clients }: { clients: ClientDto[] }) {
  const withLogos = clients.filter((client) => client.logo);
  if (withLogos.length === 0) return null;
  return (
    <div className={styles.logoCloud}>
      {withLogos.map((client) => (
        <div key={client.id} className={styles.logoItem}>
          <SmartLogo media={client.logo} alt={client.organization} height={32} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FAQ, gallery, downloads, video, CTA
// ---------------------------------------------------------------------------

export function FaqList({ faqs }: { faqs: FaqDto[] }) {
  if (faqs.length === 0) return null;
  return (
    <div className={styles.faqList}>
      {faqs.map((faq) => (
        <details key={faq.id} className={styles.faqItem}>
          <summary className={styles.faqSummary}>
            <span>{faq.question}</span>
            <svg
              className={styles.faqIcon}
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 4v12M4 10h12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </summary>
          <div className={styles.faqAnswer}>{faq.answer}</div>
        </details>
      ))}
    </div>
  );
}

export function Gallery({ images }: { images: MediaAssetDto[] }) {
  if (images.length === 0) return null;
  return (
    <div className={styles.gallery}>
      {images.map((image, index) => (
        <Reveal key={image.id} delay={index * 40}>
          <figure className={styles.galleryFigure}>
            <SmartImage media={image} ratio="4 / 3" sizes="(max-width: 767px) 100vw, 360px" />
            {image.caption ? (
              <figcaption className={styles.galleryCaption}>{image.caption}</figcaption>
            ) : null}
          </figure>
        </Reveal>
      ))}
    </div>
  );
}

export function DownloadList({ documents }: { documents: DocumentAssetDto[] }) {
  if (documents.length === 0) return null;
  return (
    <ul className={styles.downloadList}>
      {documents.map((document) => (
        <li key={document.id} className={styles.downloadItem}>
          <div>
            <p style={{ fontWeight: 600 }}>{document.title ?? document.originalName}</p>
            <p className={styles.downloadMeta}>
              {document.extension.toUpperCase()} &middot;{' '}
              {Math.max(1, Math.round(document.sizeBytes / 1024))} KB
            </p>
          </div>
          {document.url ? (
            <ButtonLink href={document.url} variant="secondary" size="small">
              Download
            </ButtonLink>
          ) : (
            <span className={styles.downloadMeta}>Available on request</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Renders a video embed for an allow-listed host only.
 * Anything else is shown as a plain link rather than an iframe.
 */
export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const embed = toEmbedUrl(url);
  if (!embed) {
    return (
      <p>
        <a href={url} rel="noopener noreferrer" target="_blank">
          {title}
        </a>
      </p>
    );
  }
  return (
    <div className={styles.videoFrame}>
      <iframe
        src={embed}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function toEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'www.youtube.com' || parsed.hostname === 'youtube.com') {
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (parsed.hostname === 'youtu.be') {
      return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
    }
    if (parsed.hostname === 'vimeo.com') {
      return `https://player.vimeo.com/video/${parsed.pathname.slice(1)}`;
    }
    if (parsed.hostname === 'player.vimeo.com' || parsed.hostname === 'www.youtube-nocookie.com') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function CtaPanel({
  heading,
  description,
  primaryCta,
  secondaryCta,
  onDark,
}: {
  heading: string;
  description?: string | null;
  primaryCta?: CtaDto | null;
  secondaryCta?: CtaDto | null;
  onDark?: boolean;
}) {
  return (
    <div className={styles.ctaPanel}>
      <div className={styles.ctaText}>
        <h2 className={styles.ctaHeading}>{heading}</h2>
        {description ? <p style={{ color: 'var(--section-muted)' }}>{description}</p> : null}
      </div>
      <ButtonRow>
        {primaryCta ? (
          <ButtonLink href={primaryCta.href} onDark={onDark}>
            {primaryCta.label}
          </ButtonLink>
        ) : null}
        {secondaryCta ? (
          <ButtonLink href={secondaryCta.href} variant="secondary" onDark={onDark}>
            {secondaryCta.label}
          </ButtonLink>
        ) : null}
      </ButtonRow>
    </div>
  );
}

export { styles as sectionStyles, IconBadge, TextLink, CheckList };
