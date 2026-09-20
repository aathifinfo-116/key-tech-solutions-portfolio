import { z } from 'zod';
import {
  ctaInputSchema,
  hexColorSchema,
  optionalText,
  publicationStatusSchema,
  seoInputSchema,
  slugSchema,
  stringList,
  text,
  urlSchema,
  uuidSchema,
} from './common';

/** Admin CRUD payload schemas. Shared by the API pipes and the admin forms. */

const nullableUuid = uuidSchema.nullish();
const richText = (max = 60000) => z.string().max(max).optional();
const optionalUrl = urlSchema.optional().or(z.literal('').transform(() => undefined));

const workflowFields = {
  status: publicationStatusSchema.default('DRAFT'),
  scheduledAt: z.string().datetime({ offset: true }).nullish(),
  seo: seoInputSchema.partial().optional(),
  /** Create a 301 from the previous slug when the slug changes on live content. */
  createRedirectOnSlugChange: z.boolean().default(true),
  changeSummary: optionalText(300),
};

const sortableFields = {
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isFeatured: z.boolean().default(false),
};

// --------------------------------------------------------------------------
// Pages and sections
// --------------------------------------------------------------------------

export const sectionTypeSchema = z.enum([
  'HERO',
  'RICH_TEXT',
  'SPLIT_CONTENT',
  'IMAGE_GALLERY',
  'STATISTICS',
  'SERVICE_GRID',
  'PRODUCT_GRID',
  'SOLUTION_GRID',
  'PORTFOLIO_GRID',
  'CASE_STUDY',
  'PROCESS_STEPS',
  'TIMELINE',
  'VALUES',
  'TEAM',
  'TESTIMONIALS',
  'LOGO_CLOUD',
  'FAQ',
  'DOWNLOAD',
  'CTA',
  'CONTACT_BLOCK',
  'TECHNOLOGY_GRID',
  'VIDEO',
  'QUOTE',
  'CAPABILITY_STRIP',
  'INDUSTRY_GRID',
  'BLOG_PREVIEW',
]);

export const sectionThemeSchema = z.enum([
  'LIGHT',
  'WHITE',
  'SOFT_PURPLE',
  'SOFT_TEAL',
  'DARK',
  'BRAND_GRADIENT',
]);

export const pageSectionSchema = z.object({
  id: uuidSchema.optional(),
  internalName: text(120, 'Section name'),
  type: sectionTypeSchema,
  eyebrow: optionalText(120),
  heading: optionalText(200),
  subheading: optionalText(300),
  description: optionalText(1200),
  bodyHtml: richText(),
  theme: sectionThemeSchema.default('WHITE'),
  layoutVariant: z.string().trim().max(40).default('default'),
  backgroundImageUrl: optionalText(2048),
  mediaId: nullableUuid,
  primaryCtaLabel: optionalText(60),
  primaryCtaHref: optionalText(2048),
  secondaryCtaLabel: optionalText(60),
  secondaryCtaHref: optionalText(2048),
  settings: z.record(z.unknown()).optional(),
  relatedIds: z.array(z.string().max(96)).max(48).default([]),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isVisible: z.boolean().default(true),
  visibleFrom: z.string().datetime({ offset: true }).nullish(),
  visibleUntil: z.string().datetime({ offset: true }).nullish(),
});
export type PageSectionInput = z.infer<typeof pageSectionSchema>;

export const pageSchema = z.object({
  slug: slugSchema,
  path: z.string().trim().min(1).max(200).regex(/^\//, 'Path must start with /'),
  title: text(180, 'Page title'),
  eyebrow: optionalText(120),
  headline: optionalText(200),
  subheadline: optionalText(300),
  summary: optionalText(600),
  showInSitemap: z.boolean().default(true),
  coverImageId: nullableUuid,
  sections: z.array(pageSectionSchema).max(40).optional(),
  ...workflowFields,
});
export type PageInput = z.infer<typeof pageSchema>;

// --------------------------------------------------------------------------
// Services
// --------------------------------------------------------------------------

export const serviceCategorySchema = z.object({
  slug: slugSchema,
  name: text(120, 'Category name'),
  description: optionalText(600),
  iconName: optionalText(60),
  accentColor: hexColorSchema.optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const faqItemSchema = z.object({
  id: uuidSchema.optional(),
  question: text(300, 'Question'),
  answer: text(3000, 'Answer'),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const featureItemSchema = z.object({
  id: uuidSchema.optional(),
  title: text(160, 'Title'),
  description: optionalText(800),
  iconName: optionalText(60),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const serviceSchema = z.object({
  slug: slugSchema,
  name: text(140, 'Service name'),
  categoryId: nullableUuid,
  shortDescription: text(320, 'Short description'),
  fullDescription: richText(),
  iconName: optionalText(60),
  coverImageId: nullableUuid,
  benefits: stringList(20),
  capabilities: stringList(24),
  deliverables: stringList(24),
  processSummary: optionalText(2000),
  cta: ctaInputSchema.optional(),
  features: z.array(featureItemSchema).max(24).optional(),
  faqs: z.array(faqItemSchema).max(24).optional(),
  galleryMediaIds: z.array(uuidSchema).max(24).optional(),
  technologyIds: z.array(uuidSchema).max(40).optional(),
  productIds: z.array(uuidSchema).max(20).optional(),
  solutionIds: z.array(uuidSchema).max(20).optional(),
  projectIds: z.array(uuidSchema).max(20).optional(),
  industryIds: z.array(uuidSchema).max(20).optional(),
  ...sortableFields,
  ...workflowFields,
});
export type ServiceInput = z.infer<typeof serviceSchema>;

// --------------------------------------------------------------------------
// Solutions and industries
// --------------------------------------------------------------------------

export const workflowStepSchema = z.object({
  title: text(160, 'Step title'),
  description: optionalText(600),
});

export const solutionSchema = z.object({
  slug: slugSchema,
  name: text(140, 'Solution name'),
  summary: text(320, 'Summary'),
  businessChallenge: richText(),
  overview: richText(),
  capabilities: stringList(24),
  userTypes: stringList(16),
  benefits: stringList(20),
  workflowSteps: z.array(workflowStepSchema).max(16).default([]),
  integrations: stringList(24),
  iconName: optionalText(60),
  coverImageId: nullableUuid,
  cta: ctaInputSchema.optional(),
  features: z.array(featureItemSchema).max(24).optional(),
  faqs: z.array(faqItemSchema).max(24).optional(),
  galleryMediaIds: z.array(uuidSchema).max(24).optional(),
  documentIds: z.array(uuidSchema).max(12).optional(),
  serviceIds: z.array(uuidSchema).max(20).optional(),
  productIds: z.array(uuidSchema).max(20).optional(),
  industryIds: z.array(uuidSchema).max(20).optional(),
  projectIds: z.array(uuidSchema).max(20).optional(),
  ...sortableFields,
  ...workflowFields,
});
export type SolutionInput = z.infer<typeof solutionSchema>;

export const industrySchema = z.object({
  slug: slugSchema,
  name: text(120, 'Industry name'),
  summary: text(320, 'Summary'),
  introduction: richText(),
  challenges: stringList(16),
  capabilities: stringList(20),
  iconName: optionalText(60),
  coverImageId: nullableUuid,
  cta: ctaInputSchema.optional(),
  serviceIds: z.array(uuidSchema).max(30).optional(),
  solutionIds: z.array(uuidSchema).max(30).optional(),
  productIds: z.array(uuidSchema).max(20).optional(),
  projectIds: z.array(uuidSchema).max(20).optional(),
  caseStudyIds: z.array(uuidSchema).max(20).optional(),
  ...sortableFields,
  ...workflowFields,
});
export type IndustryInput = z.infer<typeof industrySchema>;

// --------------------------------------------------------------------------
// Products
// --------------------------------------------------------------------------

export const productStatusSchema = z.enum([
  'CONCEPT',
  'PLANNED',
  'IN_DEVELOPMENT',
  'COMING_SOON',
  'BETA',
  'LIVE',
  'MAINTENANCE',
  'RETIRED',
]);

export const productScreenshotSchema = z.object({
  id: uuidSchema.optional(),
  mediaId: uuidSchema,
  title: optionalText(160),
  caption: optionalText(400),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const productSchema = z.object({
  slug: slugSchema,
  name: text(120, 'Product name'),
  tagline: optionalText(200),
  category: optionalText(80),
  productStatus: productStatusSchema.default('CONCEPT'),
  summary: text(400, 'Summary'),
  fullDescription: richText(),
  problemSolved: richText(),
  targetUsers: stringList(16),
  benefits: stringList(20),
  brandPrimary: hexColorSchema.optional(),
  brandSecondary: hexColorSchema.optional(),
  logoId: nullableUuid,
  coverImageId: nullableUuid,
  demoVideoUrl: optionalUrl,
  websiteUrl: optionalUrl,
  demoUrl: optionalUrl,
  documentationUrl: optionalUrl,
  launchLabel: optionalText(80),
  launchDate: z.string().datetime({ offset: true }).nullish(),
  businessModel: optionalText(200),
  features: z.array(featureItemSchema).max(30).optional(),
  screenshots: z.array(productScreenshotSchema).max(24).optional(),
  faqs: z.array(faqItemSchema).max(24).optional(),
  galleryMediaIds: z.array(uuidSchema).max(24).optional(),
  technologyIds: z.array(uuidSchema).max(40).optional(),
  industryIds: z.array(uuidSchema).max(20).optional(),
  serviceIds: z.array(uuidSchema).max(20).optional(),
  solutionIds: z.array(uuidSchema).max(20).optional(),
  caseStudyIds: z.array(uuidSchema).max(20).optional(),
  ...sortableFields,
  ...workflowFields,
});
export type ProductInput = z.infer<typeof productSchema>;

// --------------------------------------------------------------------------
// Portfolio and case studies
// --------------------------------------------------------------------------

export const projectStatusSchema = z.enum([
  'PLANNED',
  'IN_PROGRESS',
  'ONGOING',
  'COMPLETED',
  'MAINTENANCE',
  'PRIVATE',
]);

export const portfolioProjectSchema = z
  .object({
    slug: slugSchema,
    title: text(180, 'Project title'),
    customerDisplayName: optionalText(160),
    isCustomerConfidential: z.boolean().default(false),
    category: optionalText(80),
    projectStatus: projectStatusSchema.default('PLANNED'),
    startDate: z.string().datetime({ offset: true }).nullish(),
    completionDate: z.string().datetime({ offset: true }).nullish(),
    summary: text(400, 'Summary'),
    challenge: richText(),
    approach: richText(),
    solution: richText(),
    features: stringList(24),
    deliverables: stringList(24),
    publicUrl: optionalUrl,
    demoUrl: optionalUrl,
    coverImageId: nullableUuid,
    featureItems: z.array(featureItemSchema).max(24).optional(),
    galleryMediaIds: z.array(uuidSchema).max(30).optional(),
    technologyIds: z.array(uuidSchema).max(40).optional(),
    serviceIds: z.array(uuidSchema).max(20).optional(),
    productIds: z.array(uuidSchema).max(20).optional(),
    industryIds: z.array(uuidSchema).max(20).optional(),
    ...sortableFields,
    ...workflowFields,
  })
  .refine((v) => !(v.isCustomerConfidential && v.customerDisplayName), {
    message: 'A confidential project must not carry a customer display name.',
    path: ['customerDisplayName'],
  });
export type PortfolioProjectInput = z.infer<typeof portfolioProjectSchema>;

export const caseStudyMetricSchema = z
  .object({
    id: uuidSchema.optional(),
    label: text(120, 'Metric label'),
    value: text(60, 'Metric value'),
    unit: optionalText(20),
    description: optionalText(400),
    isVerified: z.boolean().default(false),
    sourceNote: optionalText(300),
    sortOrder: z.coerce.number().int().min(0).default(0),
  })
  .refine((v) => !v.isVerified || Boolean(v.sourceNote), {
    message: 'A verified metric must record where the number came from.',
    path: ['sourceNote'],
  });

export const caseStudySchema = z
  .object({
    slug: slugSchema,
    title: text(180, 'Case study title'),
    projectId: nullableUuid,
    approvedCustomerName: optionalText(160),
    isCustomerApproved: z.boolean().default(false),
    summary: text(400, 'Summary'),
    background: richText(),
    challenge: richText(),
    discovery: richText(),
    strategy: richText(),
    design: richText(),
    development: richText(),
    architecture: richText(),
    solution: richText(),
    results: richText(),
    coverImageId: nullableUuid,
    cta: ctaInputSchema.optional(),
    metrics: z.array(caseStudyMetricSchema).max(12).optional(),
    testimonialId: nullableUuid,
    galleryMediaIds: z.array(uuidSchema).max(30).optional(),
    downloadDocumentIds: z.array(uuidSchema).max(12).optional(),
    serviceIds: z.array(uuidSchema).max(20).optional(),
    productIds: z.array(uuidSchema).max(20).optional(),
    industryIds: z.array(uuidSchema).max(20).optional(),
    ...sortableFields,
    ...workflowFields,
  })
  .refine((v) => !v.approvedCustomerName || v.isCustomerApproved, {
    message: 'Naming a customer requires the approval checkbox to be ticked.',
    path: ['isCustomerApproved'],
  });
export type CaseStudyInput = z.infer<typeof caseStudySchema>;

export const testimonialSchema = z
  .object({
    quote: text(1200, 'Quote'),
    authorName: text(120, 'Author name'),
    authorRole: optionalText(120),
    organization: optionalText(160),
    photoId: nullableUuid,
    isApproved: z.boolean().default(false),
    approvalNote: optionalText(300),
    isSampleContent: z.boolean().default(false),
    sortOrder: z.coerce.number().int().min(0).default(0),
    status: publicationStatusSchema.default('DRAFT'),
  })
  .refine((v) => v.status !== 'PUBLISHED' || v.isApproved || v.isSampleContent, {
    message: 'A testimonial can only be published once approval is recorded.',
    path: ['isApproved'],
  });
export type TestimonialInput = z.infer<typeof testimonialSchema>;

export const clientSchema = z
  .object({
    organization: text(160, 'Organisation'),
    slug: slugSchema,
    logoId: nullableUuid,
    websiteUrl: optionalUrl,
    relationshipNote: optionalText(300),
    isDisplayApproved: z.boolean().default(false),
    isSampleContent: z.boolean().default(false),
    sortOrder: z.coerce.number().int().min(0).default(0),
    status: publicationStatusSchema.default('DRAFT'),
  })
  .refine((v) => v.status !== 'PUBLISHED' || v.isDisplayApproved || v.isSampleContent, {
    message: 'Displaying a logo publicly requires recorded approval.',
    path: ['isDisplayApproved'],
  });
export type ClientInput = z.infer<typeof clientSchema>;

// --------------------------------------------------------------------------
// Company content
// --------------------------------------------------------------------------

export const processPhaseSchema = z.object({
  slug: slugSchema,
  number: z.coerce.number().int().min(1).max(99),
  name: text(120, 'Phase name'),
  shortDescription: text(320, 'Short description'),
  detailedDescription: richText(),
  deliverables: stringList(16),
  iconName: optionalText(60),
  imageId: nullableUuid,
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const companyValueSchema = z.object({
  slug: slugSchema,
  title: text(120, 'Value title'),
  description: text(800, 'Description'),
  iconName: optionalText(60),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const companyMilestoneSchema = z.object({
  label: text(60, 'Label'),
  title: text(160, 'Title'),
  description: optionalText(800),
  occurredOn: z.string().datetime({ offset: true }).nullish(),
  imageId: nullableUuid,
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const statisticSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(2)
      .max(60)
      .regex(/^[a-z0-9-]+$/),
    label: text(120, 'Label'),
    value: text(40, 'Value'),
    numericValue: z.coerce.number().nullish(),
    prefix: optionalText(8),
    suffix: optionalText(8),
    description: optionalText(300),
    group: z.string().trim().max(40).default('home'),
    isVerified: z.boolean().default(false),
    sortOrder: z.coerce.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
  })
  .refine((v) => !v.isActive || v.isVerified || Boolean(v.description), {
    message: 'An unverified statistic must explain what the number represents.',
    path: ['description'],
  });

export const technologyCategorySchema = z.object({
  slug: slugSchema,
  name: text(80, 'Category name'),
  description: optionalText(400),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const technologySchema = z.object({
  slug: slugSchema,
  name: text(80, 'Technology name'),
  categoryId: nullableUuid,
  description: optionalText(600),
  proficiencyLabel: optionalText(60),
  logoId: nullableUuid,
  websiteUrl: optionalUrl,
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  serviceIds: z.array(uuidSchema).max(40).optional(),
  productIds: z.array(uuidSchema).max(20).optional(),
});

export const teamMemberSchema = z.object({
  slug: slugSchema,
  displayName: text(120, 'Display name'),
  jobTitle: text(120, 'Job title'),
  biography: richText(4000),
  photoId: nullableUuid,
  skills: stringList(20, 60),
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  publicEmail: z
    .string()
    .email()
    .max(254)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
  status: publicationStatusSchema.default('DRAFT'),
});

// --------------------------------------------------------------------------
// Blog
// --------------------------------------------------------------------------

export const blogPostTypeSchema = z.enum([
  'ARTICLE',
  'TECHNICAL_GUIDE',
  'PRODUCT_UPDATE',
  'RELEASE_NOTE',
  'CASE_STUDY',
  'COMPANY_NEWS',
  'INDUSTRY_INSIGHT',
]);

export const contentBlockSchema = z.object({
  id: uuidSchema.optional(),
  type: z.enum([
    'PARAGRAPH',
    'HEADING',
    'IMAGE',
    'GALLERY',
    'QUOTE',
    'CALLOUT',
    'CODE',
    'LIST',
    'TABLE',
    'VIDEO_EMBED',
    'DOWNLOAD',
    'CTA',
    'RELATED_CONTENT',
  ]),
  heading: optionalText(200),
  text: optionalText(8000),
  html: richText(),
  code: z.string().max(20000).optional(),
  language: optionalText(30),
  items: z.unknown().optional(),
  mediaId: nullableUuid,
  href: optionalText(2048),
  linkLabel: optionalText(80),
  settings: z.record(z.unknown()).optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const blogPostSchema = z.object({
  slug: slugSchema,
  title: text(200, 'Title'),
  excerpt: text(400, 'Excerpt'),
  contentHtml: richText(200000),
  postType: blogPostTypeSchema.default('ARTICLE'),
  coverImageId: nullableUuid,
  authorId: nullableUuid,
  categoryId: nullableUuid,
  tagSlugs: z.array(z.string().trim().min(1).max(60)).max(16).default([]),
  blocks: z.array(contentBlockSchema).max(80).optional(),
  relatedPostIds: z.array(uuidSchema).max(8).optional(),
  serviceIds: z.array(uuidSchema).max(10).optional(),
  productIds: z.array(uuidSchema).max(10).optional(),
  ...sortableFields,
  ...workflowFields,
});
export type BlogPostInput = z.infer<typeof blogPostSchema>;

export const blogCategorySchema = z.object({
  slug: slugSchema,
  name: text(80, 'Category name'),
  description: optionalText(400),
  accentColor: hexColorSchema.optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  seo: seoInputSchema.partial().optional(),
});

export const authorSchema = z.object({
  slug: slugSchema,
  displayName: text(120, 'Display name'),
  jobTitle: optionalText(120),
  biography: richText(4000),
  avatarId: nullableUuid,
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  websiteUrl: optionalUrl,
  adminUserId: nullableUuid,
  isActive: z.boolean().default(true),
});

// --------------------------------------------------------------------------
// Careers
// --------------------------------------------------------------------------

export const careerSchema = z.object({
  slug: slugSchema,
  title: text(160, 'Job title'),
  department: text(80, 'Department'),
  location: text(120, 'Location'),
  workplaceType: z.enum(['ONSITE', 'HYBRID', 'REMOTE']).default('ONSITE'),
  employmentType: z
    .enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY'])
    .default('FULL_TIME'),
  summary: text(1200, 'Summary'),
  responsibilities: stringList(24, 400),
  requirements: stringList(24, 400),
  preferredSkills: stringList(24, 400),
  applyDeadline: z.string().datetime({ offset: true }).nullish(),
  careerStatus: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED']).default('DRAFT'),
  seo: seoInputSchema.partial().optional(),
  createRedirectOnSlugChange: z.boolean().default(true),
});
export type CareerInput = z.infer<typeof careerSchema>;

// --------------------------------------------------------------------------
// Site configuration
// --------------------------------------------------------------------------

export const navigationItemSchema = z.object({
  id: uuidSchema.optional(),
  label: text(60, 'Label'),
  href: z.string().trim().min(1).max(2048),
  description: optionalText(200),
  iconName: optionalText(60),
  isExternal: z.boolean().default(false),
  openInNewTab: z.boolean().default(false),
  highlight: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  children: z
    .array(z.lazy((): z.ZodTypeAny => navigationItemSchema))
    .max(12)
    .optional(),
});

export const navigationMenuSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/),
  name: text(80, 'Menu name'),
  location: z.enum(['PRIMARY', 'FOOTER', 'UTILITY', 'MOBILE', 'LEGAL']).default('PRIMARY'),
  isActive: z.boolean().default(true),
  items: z.array(navigationItemSchema).max(24).default([]),
});

export const footerGroupSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/),
  title: text(80, 'Group title'),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  links: z
    .array(
      z.object({
        id: uuidSchema.optional(),
        label: text(60, 'Label'),
        href: z.string().trim().min(1).max(2048),
        isExternal: z.boolean().default(false),
        sortOrder: z.coerce.number().int().min(0).default(0),
        isActive: z.boolean().default(true),
      }),
    )
    .max(16)
    .default([]),
});

export const announcementSchema = z
  .object({
    message: text(240, 'Message'),
    linkLabel: optionalText(60),
    linkHref: optionalText(2048),
    tone: z.enum(['INFO', 'BRAND', 'SUCCESS', 'WARNING']).default('BRAND'),
    isActive: z.boolean().default(false),
    startsAt: z.string().datetime({ offset: true }).nullish(),
    endsAt: z.string().datetime({ offset: true }).nullish(),
    sortOrder: z.coerce.number().int().min(0).default(0),
  })
  .refine((v) => !v.linkLabel || Boolean(v.linkHref), {
    message: 'A link label needs a destination.',
    path: ['linkHref'],
  });

export const brandSettingSchema = z.object({
  companyName: text(120, 'Company name'),
  shortName: text(60, 'Short name'),
  legalName: optionalText(160),
  tagline: optionalText(200),
  description: optionalText(600),
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  accentColor: hexColorSchema,
  highlightColor: hexColorSchema,
  inkColor: hexColorSchema,
  gradientCss: z.string().trim().max(400),
  contactEmail: z
    .string()
    .email()
    .max(254)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  contactPhone: optionalText(40),
  supportEmail: z
    .string()
    .email()
    .max(254)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  logoLightId: nullableUuid,
  logoDarkId: nullableUuid,
  logoMarkId: nullableUuid,
  faviconId: nullableUuid,
  ogDefaultId: nullableUuid,
});

export const siteSettingSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9._-]+$/),
  value: z.unknown(),
  group: z.string().trim().max(40).default('general'),
  label: text(120, 'Label'),
  description: optionalText(300),
  isPublic: z.boolean().default(true),
});

export const redirectRuleSchema = z.object({
  source: z.string().trim().min(1).max(512),
  destination: z.string().trim().max(2048).default(''),
  status: z
    .enum(['PERMANENT_301', 'FOUND_302', 'TEMPORARY_307', 'PERMANENT_308', 'GONE_410'])
    .default('PERMANENT_301'),
  reason: optionalText(300),
  isActive: z.boolean().default(true),
});
export type RedirectRuleInput = z.infer<typeof redirectRuleSchema>;

export const mediaUpdateSchema = z.object({
  altText: optionalText(300),
  caption: optionalText(400),
  focalX: z.coerce.number().min(0).max(1).optional(),
  focalY: z.coerce.number().min(0).max(1).optional(),
  folder: z.string().trim().max(40).optional(),
});

export const leadUpdateSchema = z.object({
  leadStatus: z
    .enum([
      'NEW',
      'REVIEWING',
      'CONTACTED',
      'QUALIFIED',
      'PROPOSAL',
      'WON',
      'LOST',
      'SPAM',
      'ARCHIVED',
    ])
    .optional(),
  assignedToId: nullableUuid,
});

export const leadNoteSchema = z.object({
  body: text(4000, 'Note'),
  channel: optionalText(40),
  isInternal: z.boolean().default(true),
});

export const applicationUpdateSchema = z.object({
  applicationStatus: z
    .enum([
      'RECEIVED',
      'SCREENING',
      'SHORTLISTED',
      'INTERVIEW',
      'OFFER',
      'HIRED',
      'REJECTED',
      'WITHDRAWN',
      'ARCHIVED',
    ])
    .optional(),
  internalNotes: optionalText(4000),
});

export const statusChangeSchema = z.object({
  status: publicationStatusSchema,
  scheduledAt: z.string().datetime({ offset: true }).nullish(),
  changeSummary: optionalText(300),
});
