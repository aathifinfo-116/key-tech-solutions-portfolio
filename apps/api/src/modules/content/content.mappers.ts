/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Domain mappers.
 *
 * Shared by the admin controllers and the public read API so both surfaces
 * always agree on the shape (and on what is deliberately withheld, such as a
 * confidential customer's name).
 */

import type {
  BlogPostDto,
  BlogPostSummaryDto,
  CareerDto,
  CareerSummaryDto,
  CaseStudyDto,
  CaseStudySummaryDto,
  IndustryDto,
  IndustrySummaryDto,
  PortfolioProjectDto,
  PortfolioSummaryDto,
  ProductDto,
  ProductSummaryDto,
  ServiceDto,
  ServiceSummaryDto,
  SolutionDto,
  SolutionSummaryDto,
  TeamMemberDto,
  TechnologySummaryDto,
  TestimonialDto,
} from '@kts/shared-types';
import {
  isoOrNull,
  mapCta,
  mapDocuments,
  mapFaqs,
  mapFeatures,
  mapMedia,
  mapMediaList,
  mapSeo,
  mapWorkflowSteps,
  type MediaUrlResolver,
} from '../../common/utils/mappers';

type R = MediaUrlResolver;

/** Galleries are attached by the service layer before mapping. */
function gallery(row: any, r: R) {
  return mapMediaList(row.__gallery ?? [], r);
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export function mapServiceSummary(row: any, r: R): ServiceSummaryDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    iconName: row.iconName,
    coverImage: mapMedia(row.coverImage, r),
    category: row.category
      ? {
          id: row.category.id,
          slug: row.category.slug,
          name: row.category.name,
          description: row.category.description,
          iconName: row.category.iconName,
          accentColor: row.category.accentColor,
        }
      : null,
    isFeatured: row.isFeatured,
  };
}

export function mapService(row: any, r: R): ServiceDto {
  return {
    ...mapServiceSummary(row, r),
    fullDescription: row.fullDescription,
    benefits: row.benefits ?? [],
    capabilities: row.capabilities ?? [],
    deliverables: row.deliverables ?? [],
    processSummary: row.processSummary,
    cta: {
      heading: row.ctaHeading,
      description: row.ctaDescription,
      label: row.ctaLabel,
      href: row.ctaHref,
    },
    features: mapFeatures(row.features),
    faqs: mapFaqs(row.faqs),
    gallery: gallery(row, r),
    technologies: (row.technologies ?? []).map((t: any) => mapTechnologySummary(t, r)),
    relatedProducts: (row.products ?? []).map((p: any) => mapProductSummary(p, r)),
    relatedSolutions: (row.solutions ?? []).map((s: any) => mapSolutionSummary(s, r)),
    relatedProjects: (row.projects ?? []).map((p: any) => mapPortfolioSummary(p, r)),
    seo: mapSeo(row.seo, r),
    publishedAt: isoOrNull(row.publishedAt),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Solutions
// ---------------------------------------------------------------------------

export function mapSolutionSummary(row: any, r: R): SolutionSummaryDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    iconName: row.iconName,
    coverImage: mapMedia(row.coverImage, r),
    isFeatured: row.isFeatured,
  };
}

export function mapSolution(row: any, r: R): SolutionDto {
  return {
    ...mapSolutionSummary(row, r),
    businessChallenge: row.businessChallenge,
    overview: row.overview,
    capabilities: row.capabilities ?? [],
    userTypes: row.userTypes ?? [],
    benefits: row.benefits ?? [],
    workflowSteps: mapWorkflowSteps(row.workflowSteps),
    integrations: row.integrations ?? [],
    cta: { heading: row.ctaHeading, label: row.ctaLabel, href: row.ctaHref },
    features: mapFeatures(row.features),
    faqs: mapFaqs(row.faqs),
    gallery: gallery(row, r),
    documents: mapDocuments((row.documents ?? []).map((d: any) => d.document)),
    relatedServices: (row.services ?? []).map((s: any) => mapServiceSummary(s, r)),
    relatedProducts: (row.products ?? []).map((p: any) => mapProductSummary(p, r)),
    relatedProjects: (row.projects ?? []).map((p: any) => mapPortfolioSummary(p, r)),
    industries: (row.industries ?? []).map((i: any) => mapIndustrySummary(i, r)),
    seo: mapSeo(row.seo, r),
    publishedAt: isoOrNull(row.publishedAt),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Industries
// ---------------------------------------------------------------------------

export function mapIndustrySummary(row: any, r: R): IndustrySummaryDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    iconName: row.iconName,
    coverImage: mapMedia(row.coverImage, r),
  };
}

export function mapIndustry(row: any, r: R): IndustryDto {
  return {
    ...mapIndustrySummary(row, r),
    introduction: row.introduction,
    challenges: row.challenges ?? [],
    capabilities: row.capabilities ?? [],
    cta: { heading: row.ctaHeading, label: row.ctaLabel, href: row.ctaHref },
    services: (row.services ?? []).map((s: any) => mapServiceSummary(s, r)),
    solutions: (row.solutions ?? []).map((s: any) => mapSolutionSummary(s, r)),
    products: (row.products ?? []).map((p: any) => mapProductSummary(p, r)),
    projects: (row.projects ?? []).map((p: any) => mapPortfolioSummary(p, r)),
    caseStudies: (row.caseStudies ?? []).map((c: any) => mapCaseStudySummary(c, r)),
    seo: mapSeo(row.seo, r),
    publishedAt: isoOrNull(row.publishedAt),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export function mapProductSummary(row: any, r: R): ProductSummaryDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    summary: row.summary,
    productStatus: row.productStatus,
    category: row.category,
    logo: mapMedia(row.logo, r),
    coverImage: mapMedia(row.coverImage, r),
    brandPrimary: row.brandPrimary,
    brandSecondary: row.brandSecondary,
    launchLabel: row.launchLabel,
    isFeatured: row.isFeatured,
  };
}

export function mapProduct(row: any, r: R): ProductDto {
  return {
    ...mapProductSummary(row, r),
    fullDescription: row.fullDescription,
    problemSolved: row.problemSolved,
    targetUsers: row.targetUsers ?? [],
    benefits: row.benefits ?? [],
    websiteUrl: row.websiteUrl,
    demoUrl: row.demoUrl,
    documentationUrl: row.documentationUrl,
    demoVideoUrl: row.demoVideoUrl,
    launchDate: isoOrNull(row.launchDate),
    businessModel: row.businessModel,
    features: mapFeatures(row.features),
    screenshots: (row.screenshots ?? [])
      .map((s: any) => {
        const media = mapMedia(s.media, r);
        return media ? { id: s.id, media, title: s.title, caption: s.caption } : null;
      })
      .filter(Boolean),
    gallery: gallery(row, r),
    faqs: mapFaqs(row.faqs),
    technologies: (row.technologies ?? []).map((t: any) => mapTechnologySummary(t, r)),
    industries: (row.industries ?? []).map((i: any) => mapIndustrySummary(i, r)),
    relatedServices: (row.services ?? []).map((s: any) => mapServiceSummary(s, r)),
    relatedSolutions: (row.solutions ?? []).map((s: any) => mapSolutionSummary(s, r)),
    relatedCaseStudies: (row.caseStudies ?? []).map((c: any) => mapCaseStudySummary(c, r)),
    seo: mapSeo(row.seo, r),
    publishedAt: isoOrNull(row.publishedAt),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------------

/**
 * A confidential project never exposes a customer name, whatever is stored.
 * The check lives in the mapper so every read path inherits it.
 */
export function mapPortfolioSummary(row: any, r: R): PortfolioSummaryDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    customerDisplayName: row.isCustomerConfidential ? null : (row.customerDisplayName ?? null),
    isCustomerConfidential: row.isCustomerConfidential,
    category: row.category,
    projectStatus: row.projectStatus,
    summary: row.summary,
    coverImage: mapMedia(row.coverImage, r),
    isFeatured: row.isFeatured,
    completionDate: isoOrNull(row.completionDate),
  };
}

export function mapPortfolioProject(row: any, r: R): PortfolioProjectDto {
  return {
    ...mapPortfolioSummary(row, r),
    startDate: isoOrNull(row.startDate),
    challenge: row.challenge,
    approach: row.approach,
    solution: row.solution,
    features: row.features ?? [],
    deliverables: row.deliverables ?? [],
    publicUrl: row.publicUrl,
    demoUrl: row.demoUrl,
    featureItems: mapFeatures(row.featureItems),
    gallery: gallery(row, r),
    technologies: (row.technologies ?? []).map((t: any) => mapTechnologySummary(t, r)),
    services: (row.services ?? []).map((s: any) => mapServiceSummary(s, r)),
    products: (row.products ?? []).map((p: any) => mapProductSummary(p, r)),
    industries: (row.industries ?? []).map((i: any) => mapIndustrySummary(i, r)),
    caseStudies: (row.caseStudies ?? []).map((c: any) => mapCaseStudySummary(c, r)),
    seo: mapSeo(row.seo, r),
    publishedAt: isoOrNull(row.publishedAt),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Case studies
// ---------------------------------------------------------------------------

export function mapCaseStudySummary(row: any, r: R): CaseStudySummaryDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    approvedCustomerName: row.isCustomerApproved ? (row.approvedCustomerName ?? null) : null,
    coverImage: mapMedia(row.coverImage, r),
    isFeatured: row.isFeatured,
  };
}

export function mapCaseStudy(row: any, r: R): CaseStudyDto {
  return {
    ...mapCaseStudySummary(row, r),
    background: row.background,
    challenge: row.challenge,
    discovery: row.discovery,
    strategy: row.strategy,
    design: row.design,
    development: row.development,
    architecture: row.architecture,
    solution: row.solution,
    results: row.results,
    // Only verified metrics are published, so the results block never shows an
    // unsupported number.
    metrics: (row.metrics ?? [])
      .filter((m: any) => m.isVerified)
      .map((m: any) => ({
        id: m.id,
        label: m.label,
        value: m.value,
        unit: m.unit,
        description: m.description,
        isVerified: m.isVerified,
      })),
    testimonial: row.testimonial ? mapTestimonial(row.testimonial, r) : null,
    gallery: gallery(row, r),
    downloads: mapDocuments((row.downloads ?? []).map((d: any) => d.document)),
    cta: { heading: row.ctaHeading, label: row.ctaLabel, href: row.ctaHref },
    services: (row.services ?? []).map((s: any) => mapServiceSummary(s, r)),
    products: (row.products ?? []).map((p: any) => mapProductSummary(p, r)),
    project: row.project ? mapPortfolioSummary(row.project, r) : null,
    seo: mapSeo(row.seo, r),
    publishedAt: isoOrNull(row.publishedAt),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapTestimonial(row: any, r: R): TestimonialDto {
  return {
    id: row.id,
    quote: row.quote,
    authorName: row.authorName,
    authorRole: row.authorRole,
    organization: row.organization,
    photo: mapMedia(row.photo, r),
    isSampleContent: row.isSampleContent,
  };
}

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

export function mapTechnologySummary(row: any, r: R): TechnologySummaryDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    logo: mapMedia(row.logo, r),
    proficiencyLabel: row.proficiencyLabel,
    categorySlug: row.category?.slug ?? null,
  };
}

export function mapTeamMember(row: any, r: R): TeamMemberDto {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.displayName,
    jobTitle: row.jobTitle,
    biography: row.biography,
    photo: mapMedia(row.photo, r),
    skills: row.skills ?? [],
    linkedinUrl: row.linkedinUrl,
    githubUrl: row.githubUrl,
    publicEmail: row.publicEmail,
  };
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export function mapBlogSummary(row: any, r: R): BlogPostSummaryDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    postType: row.postType,
    coverImage: mapMedia(row.coverImage, r),
    author: row.author
      ? {
          id: row.author.id,
          slug: row.author.slug,
          displayName: row.author.displayName,
          jobTitle: row.author.jobTitle,
          biography: row.author.biography,
          avatar: mapMedia(row.author.avatar, r),
          linkedinUrl: row.author.linkedinUrl,
          githubUrl: row.author.githubUrl,
          websiteUrl: row.author.websiteUrl,
        }
      : null,
    category: row.category
      ? {
          id: row.category.id,
          slug: row.category.slug,
          name: row.category.name,
          description: row.category.description,
          accentColor: row.category.accentColor,
        }
      : null,
    tags: (row.tags ?? []).map((t: any) => ({ id: t.tag.id, slug: t.tag.slug, name: t.tag.name })),
    readingMinutes: row.readingMinutes,
    publishedAt: isoOrNull(row.publishedAt),
    contentUpdatedAt: isoOrNull(row.contentUpdatedAt),
    isFeatured: row.isFeatured,
  };
}

export function mapBlogPost(row: any, r: R): BlogPostDto {
  return {
    ...mapBlogSummary(row, r),
    contentHtml: row.contentHtml,
    blocks: (row.blocks ?? []).map((block: any) => ({
      id: block.id,
      type: block.type,
      heading: block.heading,
      text: block.text,
      html: block.html,
      code: block.code,
      language: block.language,
      items: block.items,
      media: mapMedia(block.media, r),
      href: block.href,
      linkLabel: block.linkLabel,
      settings: block.settings,
      sortOrder: block.sortOrder,
    })),
    relatedPosts: (row.relatedTo ?? []).map((p: any) => mapBlogSummary(p, r)),
    relatedServices: (row.services ?? []).map((s: any) => mapServiceSummary(s, r)),
    relatedProducts: (row.products ?? []).map((p: any) => mapProductSummary(p, r)),
    seo: mapSeo(row.seo, r),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Careers
// ---------------------------------------------------------------------------

export function mapCareerSummary(row: any): CareerSummaryDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    department: row.department,
    location: row.location,
    workplaceType: row.workplaceType,
    employmentType: row.employmentType,
    summary: row.summary,
    applyDeadline: isoOrNull(row.applyDeadline),
    publishedAt: isoOrNull(row.publishedAt),
  };
}

export function mapCareer(row: any, r: R): CareerDto {
  return {
    ...mapCareerSummary(row),
    responsibilities: row.responsibilities ?? [],
    requirements: row.requirements ?? [],
    preferredSkills: row.preferredSkills ?? [],
    careerStatus: row.careerStatus,
    seo: mapSeo(row.seo, r),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export { mapCta };

// ---------------------------------------------------------------------------
// Pages and sections
// ---------------------------------------------------------------------------

export function mapSection(row: any, r: R, data?: Record<string, unknown>) {
  return {
    id: row.id,
    internalName: row.internalName,
    type: row.type,
    eyebrow: row.eyebrow,
    heading: row.heading,
    subheading: row.subheading,
    description: row.description,
    bodyHtml: row.bodyHtml,
    theme: row.theme,
    layoutVariant: row.layoutVariant,
    backgroundImageUrl: row.backgroundImageUrl,
    media: mapMedia(row.media, r),
    primaryCta: mapCta(row.primaryCtaLabel, row.primaryCtaHref),
    secondaryCta: mapCta(row.secondaryCtaLabel, row.secondaryCtaHref),
    settings: row.settings ?? null,
    relatedIds: row.relatedIds ?? [],
    sortOrder: row.sortOrder,
    blocks: (row.blocks ?? []).map((block: any) => ({
      id: block.id,
      type: block.type,
      heading: block.heading,
      text: block.text,
      html: block.html,
      code: block.code,
      language: block.language,
      items: block.items,
      media: mapMedia(block.media, r),
      href: block.href,
      linkLabel: block.linkLabel,
      settings: block.settings,
      sortOrder: block.sortOrder,
    })),
    ...(data ? { data } : {}),
  };
}

export function mapPage(row: any, r: R, sectionData?: Map<string, Record<string, unknown>>) {
  return {
    id: row.id,
    slug: row.slug,
    path: row.path,
    title: row.title,
    eyebrow: row.eyebrow,
    headline: row.headline,
    subheadline: row.subheadline,
    summary: row.summary,
    status: row.status,
    publishedAt: isoOrNull(row.publishedAt),
    updatedAt: row.updatedAt.toISOString(),
    coverImage: mapMedia(row.coverImage, r),
    seo: mapSeo(row.seo, r),
    sections: (row.sections ?? []).map((section: any) =>
      mapSection(section, r, sectionData?.get(section.id)),
    ),
  };
}
