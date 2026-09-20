/**
 * Prisma `include` shapes.
 *
 * Detail reads pull relations eagerly in a single query, which is what keeps
 * a service or product page to a handful of round trips instead of an N+1
 * cascade. List reads use the deliberately lighter `*ListInclude`.
 */

const SEO_INCLUDE = { include: { ogImage: true } } as const;
const SUMMARY_MEDIA = { coverImage: true } as const;

export const serviceSummaryInclude = {
  coverImage: true,
  category: true,
} as const;

export const serviceDetailInclude = {
  coverImage: true,
  category: true,
  seo: SEO_INCLUDE,
  features: { orderBy: { sortOrder: 'asc' } },
  faqs: { orderBy: { sortOrder: 'asc' } },
  technologies: { include: { category: true, logo: true } },
  products: { include: { logo: true, coverImage: true } },
  solutions: { include: SUMMARY_MEDIA },
  projects: { include: SUMMARY_MEDIA },
  industries: { include: SUMMARY_MEDIA },
} as const;

export const solutionSummaryInclude = { coverImage: true } as const;

export const solutionDetailInclude = {
  coverImage: true,
  seo: SEO_INCLUDE,
  features: { orderBy: { sortOrder: 'asc' } },
  faqs: { orderBy: { sortOrder: 'asc' } },
  documents: { include: { document: true }, orderBy: { sortOrder: 'asc' } },
  services: { include: serviceSummaryInclude },
  products: { include: { logo: true, coverImage: true } },
  industries: { include: SUMMARY_MEDIA },
  projects: { include: SUMMARY_MEDIA },
} as const;

export const industrySummaryInclude = { coverImage: true } as const;

export const industryDetailInclude = {
  coverImage: true,
  seo: SEO_INCLUDE,
  services: { include: serviceSummaryInclude },
  solutions: { include: solutionSummaryInclude },
  products: { include: { logo: true, coverImage: true } },
  projects: { include: SUMMARY_MEDIA },
  caseStudies: { include: SUMMARY_MEDIA },
} as const;

export const productSummaryInclude = { logo: true, coverImage: true } as const;

export const productDetailInclude = {
  logo: true,
  coverImage: true,
  seo: SEO_INCLUDE,
  features: { orderBy: { sortOrder: 'asc' } },
  screenshots: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
  faqs: { orderBy: { sortOrder: 'asc' } },
  technologies: { include: { category: true, logo: true } },
  industries: { include: SUMMARY_MEDIA },
  services: { include: serviceSummaryInclude },
  solutions: { include: solutionSummaryInclude },
  caseStudies: { include: SUMMARY_MEDIA },
} as const;

export const portfolioSummaryInclude = { coverImage: true } as const;

export const portfolioDetailInclude = {
  coverImage: true,
  seo: SEO_INCLUDE,
  featureItems: { orderBy: { sortOrder: 'asc' } },
  technologies: { include: { category: true, logo: true } },
  services: { include: serviceSummaryInclude },
  products: { include: productSummaryInclude },
  industries: { include: SUMMARY_MEDIA },
  caseStudies: { include: SUMMARY_MEDIA },
} as const;

export const caseStudySummaryInclude = { coverImage: true } as const;

export const caseStudyDetailInclude = {
  coverImage: true,
  seo: SEO_INCLUDE,
  metrics: { orderBy: { sortOrder: 'asc' } },
  downloads: { include: { document: true }, orderBy: { sortOrder: 'asc' } },
  testimonial: { include: { photo: true } },
  services: { include: serviceSummaryInclude },
  products: { include: productSummaryInclude },
  industries: { include: SUMMARY_MEDIA },
  project: { include: SUMMARY_MEDIA },
} as const;

export const blogSummaryInclude = {
  coverImage: true,
  author: { include: { avatar: true } },
  category: true,
  tags: { include: { tag: true } },
} as const;

export const blogDetailInclude = {
  ...blogSummaryInclude,
  seo: SEO_INCLUDE,
  blocks: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
  relatedTo: { include: blogSummaryInclude },
  services: { include: serviceSummaryInclude },
  products: { include: productSummaryInclude },
} as const;

export const careerDetailInclude = { seo: SEO_INCLUDE } as const;

export const pageDetailInclude = {
  coverImage: true,
  seo: SEO_INCLUDE,
  sections: {
    orderBy: { sortOrder: 'asc' },
    include: { media: true, blocks: { include: { media: true }, orderBy: { sortOrder: 'asc' } } },
  },
} as const;
