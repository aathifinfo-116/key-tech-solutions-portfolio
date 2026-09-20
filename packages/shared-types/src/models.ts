/**
 * Response models returned by the API.
 *
 * The API never returns raw Prisma entities; every controller maps to one of
 * these shapes. Dates are serialised as ISO 8601 strings.
 */

import type {
  AdminUserStatus,
  AnnouncementTone,
  ApplicationStatus,
  BlogPostType,
  CareerStatus,
  ContentBlockType,
  ContentEntityType,
  DocumentKind,
  EmploymentType,
  LeadStatus,
  LeadType,
  MediaKind,
  MediaVisibility,
  ProductStatus,
  ProjectStatus,
  PublicationStatus,
  RedirectStatus,
  SectionTheme,
  SectionType,
  SitemapFrequency,
  WorkplaceType,
} from './enums';

// ---------------------------------------------------------------------------
// Envelopes
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  requestId?: string;
  details?: Array<{ path: string; message: string }>;
}

// ---------------------------------------------------------------------------
// Media and SEO
// ---------------------------------------------------------------------------

export interface MediaVariantSet {
  thumbnail?: string;
  card?: string;
  hero?: string;
  openGraph?: string;
  original: string;
}

export interface MediaAssetDto {
  id: string;
  url: string;
  kind: MediaKind;
  visibility: MediaVisibility;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
  altText: string | null;
  caption: string | null;
  blurDataUrl: string | null;
  focalPoint: { x: number; y: number };
  originalName: string;
  folder: string;
  variants: MediaVariantSet;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAssetDto {
  id: string;
  title: string | null;
  description: string | null;
  originalName: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  kind: DocumentKind;
  visibility: MediaVisibility;
  /** Only populated for public documents; private documents need a signed link. */
  url: string | null;
  createdAt: string;
}

export interface SeoMetadataDto {
  title: string | null;
  description: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: MediaAssetDto | null;
  twitterCard: string;
  keywords: string[];
  robotsIndex: boolean;
  robotsFollow: boolean;
  includeInSitemap: boolean;
  sitemapPriority: number;
  sitemapFrequency: SitemapFrequency;
}

export interface SitemapEntryDto {
  path: string;
  lastModified: string;
  changeFrequency: Lowercase<SitemapFrequency>;
  priority: number;
  images?: Array<{ url: string; title?: string }>;
}

// ---------------------------------------------------------------------------
// Site configuration
// ---------------------------------------------------------------------------

export interface BrandDto {
  companyName: string;
  shortName: string;
  legalName: string | null;
  tagline: string | null;
  description: string | null;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    highlight: string;
    ink: string;
  };
  gradientCss: string;
  contactEmail: string | null;
  contactPhone: string | null;
  supportEmail: string | null;
  logoLight: MediaAssetDto | null;
  logoDark: MediaAssetDto | null;
  logoMark: MediaAssetDto | null;
  favicon: MediaAssetDto | null;
  ogDefault: MediaAssetDto | null;
}

export interface SocialLinkDto {
  platform: string;
  label: string;
  url: string;
  iconName: string | null;
}

export interface NavigationItemDto {
  id: string;
  label: string;
  href: string;
  description: string | null;
  iconName: string | null;
  isExternal: boolean;
  openInNewTab: boolean;
  highlight: boolean;
  children: NavigationItemDto[];
}

export interface NavigationMenuDto {
  key: string;
  name: string;
  location: string;
  items: NavigationItemDto[];
}

export interface FooterGroupDto {
  key: string;
  title: string;
  links: Array<{ label: string; href: string; isExternal: boolean }>;
}

export interface AnnouncementDto {
  id: string;
  message: string;
  linkLabel: string | null;
  linkHref: string | null;
  tone: AnnouncementTone;
}

export interface SiteSettingsDto {
  brand: BrandDto;
  socialLinks: SocialLinkDto[];
  settings: Record<string, unknown>;
  announcement: AnnouncementDto | null;
}

// ---------------------------------------------------------------------------
// Page builder
// ---------------------------------------------------------------------------

export interface ContentBlockDto {
  id: string;
  type: ContentBlockType;
  heading: string | null;
  text: string | null;
  html: string | null;
  code: string | null;
  language: string | null;
  items: unknown;
  media: MediaAssetDto | null;
  href: string | null;
  linkLabel: string | null;
  settings: Record<string, unknown> | null;
  sortOrder: number;
}

export interface PageSectionDto {
  id: string;
  internalName: string;
  type: SectionType;
  eyebrow: string | null;
  heading: string | null;
  subheading: string | null;
  description: string | null;
  bodyHtml: string | null;
  theme: SectionTheme;
  layoutVariant: string;
  backgroundImageUrl: string | null;
  media: MediaAssetDto | null;
  primaryCta: CtaDto | null;
  secondaryCta: CtaDto | null;
  settings: Record<string, unknown> | null;
  relatedIds: string[];
  sortOrder: number;
  blocks: ContentBlockDto[];
  /** Server-resolved content for data-driven section types. */
  data?: SectionData;
}

export interface CtaDto {
  label: string;
  href: string;
}

export interface SectionData {
  services?: ServiceSummaryDto[];
  products?: ProductSummaryDto[];
  solutions?: SolutionSummaryDto[];
  industries?: IndustrySummaryDto[];
  projects?: PortfolioSummaryDto[];
  caseStudies?: CaseStudySummaryDto[];
  posts?: BlogPostSummaryDto[];
  processPhases?: ProcessPhaseDto[];
  statistics?: StatisticDto[];
  values?: CompanyValueDto[];
  milestones?: CompanyMilestoneDto[];
  team?: TeamMemberDto[];
  testimonials?: TestimonialDto[];
  clients?: ClientDto[];
  partners?: PartnerDto[];
  technologies?: TechnologyGroupDto[];
  faqs?: FaqDto[];
  gallery?: MediaAssetDto[];
  downloads?: DocumentAssetDto[];
}

export interface PageDto {
  id: string;
  slug: string;
  path: string;
  title: string;
  eyebrow: string | null;
  headline: string | null;
  subheadline: string | null;
  summary: string | null;
  status: PublicationStatus;
  publishedAt: string | null;
  updatedAt: string;
  coverImage: MediaAssetDto | null;
  seo: SeoMetadataDto | null;
  sections: PageSectionDto[];
}

// ---------------------------------------------------------------------------
// Offerings
// ---------------------------------------------------------------------------

export interface FaqDto {
  id: string;
  question: string;
  answer: string;
}

export interface FeatureDto {
  id: string;
  title: string;
  description: string | null;
  iconName: string | null;
}

export interface ServiceCategoryDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconName: string | null;
  accentColor: string | null;
}

export interface ServiceSummaryDto {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  iconName: string | null;
  coverImage: MediaAssetDto | null;
  category: ServiceCategoryDto | null;
  isFeatured: boolean;
}

export interface ServiceDto extends ServiceSummaryDto {
  fullDescription: string | null;
  benefits: string[];
  capabilities: string[];
  deliverables: string[];
  processSummary: string | null;
  cta: {
    heading: string | null;
    description: string | null;
    label: string | null;
    href: string | null;
  };
  features: FeatureDto[];
  faqs: FaqDto[];
  gallery: MediaAssetDto[];
  technologies: TechnologySummaryDto[];
  relatedProducts: ProductSummaryDto[];
  relatedSolutions: SolutionSummaryDto[];
  relatedProjects: PortfolioSummaryDto[];
  seo: SeoMetadataDto | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface SolutionSummaryDto {
  id: string;
  slug: string;
  name: string;
  summary: string;
  iconName: string | null;
  coverImage: MediaAssetDto | null;
  isFeatured: boolean;
}

export interface WorkflowStep {
  title: string;
  description?: string;
}

export interface SolutionDto extends SolutionSummaryDto {
  businessChallenge: string | null;
  overview: string | null;
  capabilities: string[];
  userTypes: string[];
  benefits: string[];
  workflowSteps: WorkflowStep[];
  integrations: string[];
  cta: { heading: string | null; label: string | null; href: string | null };
  features: FeatureDto[];
  faqs: FaqDto[];
  gallery: MediaAssetDto[];
  documents: DocumentAssetDto[];
  relatedServices: ServiceSummaryDto[];
  relatedProducts: ProductSummaryDto[];
  relatedProjects: PortfolioSummaryDto[];
  industries: IndustrySummaryDto[];
  seo: SeoMetadataDto | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface IndustrySummaryDto {
  id: string;
  slug: string;
  name: string;
  summary: string;
  iconName: string | null;
  coverImage: MediaAssetDto | null;
}

export interface IndustryDto extends IndustrySummaryDto {
  introduction: string | null;
  challenges: string[];
  capabilities: string[];
  cta: { heading: string | null; label: string | null; href: string | null };
  services: ServiceSummaryDto[];
  solutions: SolutionSummaryDto[];
  products: ProductSummaryDto[];
  projects: PortfolioSummaryDto[];
  caseStudies: CaseStudySummaryDto[];
  seo: SeoMetadataDto | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface ProductSummaryDto {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  summary: string;
  productStatus: ProductStatus;
  category: string | null;
  logo: MediaAssetDto | null;
  coverImage: MediaAssetDto | null;
  brandPrimary: string | null;
  brandSecondary: string | null;
  launchLabel: string | null;
  isFeatured: boolean;
}

export interface ProductScreenshotDto {
  id: string;
  media: MediaAssetDto;
  title: string | null;
  caption: string | null;
}

export interface ProductDto extends ProductSummaryDto {
  fullDescription: string | null;
  problemSolved: string | null;
  targetUsers: string[];
  benefits: string[];
  websiteUrl: string | null;
  demoUrl: string | null;
  documentationUrl: string | null;
  demoVideoUrl: string | null;
  launchDate: string | null;
  businessModel: string | null;
  features: FeatureDto[];
  screenshots: ProductScreenshotDto[];
  gallery: MediaAssetDto[];
  faqs: FaqDto[];
  technologies: TechnologySummaryDto[];
  industries: IndustrySummaryDto[];
  relatedServices: ServiceSummaryDto[];
  relatedSolutions: SolutionSummaryDto[];
  relatedCaseStudies: CaseStudySummaryDto[];
  seo: SeoMetadataDto | null;
  publishedAt: string | null;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Portfolio and case studies
// ---------------------------------------------------------------------------

export interface PortfolioSummaryDto {
  id: string;
  slug: string;
  title: string;
  customerDisplayName: string | null;
  isCustomerConfidential: boolean;
  category: string | null;
  projectStatus: ProjectStatus;
  summary: string;
  coverImage: MediaAssetDto | null;
  isFeatured: boolean;
  completionDate: string | null;
}

export interface PortfolioProjectDto extends PortfolioSummaryDto {
  startDate: string | null;
  challenge: string | null;
  approach: string | null;
  solution: string | null;
  features: string[];
  deliverables: string[];
  publicUrl: string | null;
  demoUrl: string | null;
  featureItems: FeatureDto[];
  gallery: MediaAssetDto[];
  technologies: TechnologySummaryDto[];
  services: ServiceSummaryDto[];
  products: ProductSummaryDto[];
  industries: IndustrySummaryDto[];
  caseStudies: CaseStudySummaryDto[];
  seo: SeoMetadataDto | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface CaseStudyMetricDto {
  id: string;
  label: string;
  value: string;
  unit: string | null;
  description: string | null;
  isVerified: boolean;
}

export interface CaseStudySummaryDto {
  id: string;
  slug: string;
  title: string;
  summary: string;
  approvedCustomerName: string | null;
  coverImage: MediaAssetDto | null;
  isFeatured: boolean;
}

export interface CaseStudyDto extends CaseStudySummaryDto {
  background: string | null;
  challenge: string | null;
  discovery: string | null;
  strategy: string | null;
  design: string | null;
  development: string | null;
  architecture: string | null;
  solution: string | null;
  results: string | null;
  /** Empty when no verified metric exists; the results block is then hidden. */
  metrics: CaseStudyMetricDto[];
  testimonial: TestimonialDto | null;
  gallery: MediaAssetDto[];
  downloads: DocumentAssetDto[];
  cta: { heading: string | null; label: string | null; href: string | null };
  services: ServiceSummaryDto[];
  products: ProductSummaryDto[];
  project: PortfolioSummaryDto | null;
  seo: SeoMetadataDto | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface TestimonialDto {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string | null;
  organization: string | null;
  photo: MediaAssetDto | null;
  isSampleContent: boolean;
}

export interface ClientDto {
  id: string;
  organization: string;
  slug: string;
  logo: MediaAssetDto | null;
  websiteUrl: string | null;
  isSampleContent: boolean;
}

export interface PartnerDto extends ClientDto {
  relationshipNote: string | null;
}

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

export interface ProcessPhaseDto {
  id: string;
  slug: string;
  number: number;
  name: string;
  shortDescription: string;
  detailedDescription: string | null;
  deliverables: string[];
  iconName: string | null;
  image: MediaAssetDto | null;
}

export interface CompanyValueDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconName: string | null;
}

export interface CompanyMilestoneDto {
  id: string;
  label: string;
  title: string;
  description: string | null;
  occurredOn: string | null;
  image: MediaAssetDto | null;
}

export interface StatisticDto {
  id: string;
  key: string;
  label: string;
  value: string;
  numericValue: number | null;
  prefix: string | null;
  suffix: string | null;
  description: string | null;
  isVerified: boolean;
}

export interface TechnologySummaryDto {
  id: string;
  slug: string;
  name: string;
  logo: MediaAssetDto | null;
  proficiencyLabel: string | null;
  categorySlug: string | null;
}

export interface TechnologyGroupDto {
  category: { slug: string; name: string; description: string | null };
  technologies: TechnologySummaryDto[];
}

export interface TeamMemberDto {
  id: string;
  slug: string;
  displayName: string;
  jobTitle: string;
  biography: string | null;
  photo: MediaAssetDto | null;
  skills: string[];
  linkedinUrl: string | null;
  githubUrl: string | null;
  publicEmail: string | null;
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export interface AuthorDto {
  id: string;
  slug: string;
  displayName: string;
  jobTitle: string | null;
  biography: string | null;
  avatar: MediaAssetDto | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
}

export interface BlogCategoryDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  accentColor: string | null;
  postCount?: number;
}

export interface BlogTagDto {
  id: string;
  slug: string;
  name: string;
}

export interface BlogPostSummaryDto {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  postType: BlogPostType;
  coverImage: MediaAssetDto | null;
  author: AuthorDto | null;
  category: BlogCategoryDto | null;
  tags: BlogTagDto[];
  readingMinutes: number;
  publishedAt: string | null;
  contentUpdatedAt: string | null;
  isFeatured: boolean;
}

export interface BlogPostDto extends BlogPostSummaryDto {
  contentHtml: string | null;
  blocks: ContentBlockDto[];
  relatedPosts: BlogPostSummaryDto[];
  relatedServices: ServiceSummaryDto[];
  relatedProducts: ProductSummaryDto[];
  seo: SeoMetadataDto | null;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Careers and leads
// ---------------------------------------------------------------------------

export interface CareerSummaryDto {
  id: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  workplaceType: WorkplaceType;
  employmentType: EmploymentType;
  summary: string;
  applyDeadline: string | null;
  publishedAt: string | null;
}

export interface CareerDto extends CareerSummaryDto {
  responsibilities: string[];
  requirements: string[];
  preferredSkills: string[];
  careerStatus: CareerStatus;
  seo: SeoMetadataDto | null;
  updatedAt: string;
}

export interface LeadNoteDto {
  id: string;
  body: string;
  channel: string | null;
  isInternal: boolean;
  authorName: string | null;
  createdAt: string;
}

export interface LeadDto {
  id: string;
  reference: string;
  type: LeadType;
  leadStatus: LeadStatus;
  name: string;
  email: string;
  mobile: string | null;
  organization: string | null;
  subject: string | null;
  message: string | null;
  serviceInterest: string | null;
  assignedTo: { id: string; name: string } | null;
  attachment: DocumentAssetDto | null;
  sourcePage: string | null;
  spamScore: number;
  quote: {
    projectType: string;
    businessChallenge: string;
    requiredFeatures: string[];
    existingSystem: string | null;
    budgetRange: string | null;
    preferredStart: string | null;
    timelineNote: string | null;
  } | null;
  notes: LeadNoteDto[];
  createdAt: string;
  updatedAt: string;
}

export interface JobApplicationDto {
  id: string;
  careerId: string;
  careerTitle: string;
  applicantName: string;
  email: string;
  mobile: string | null;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  coverNote: string | null;
  hasCv: boolean;
  applicationStatus: ApplicationStatus;
  internalNotes: string | null;
  appliedAt: string;
}

export interface SubmissionReceiptDto {
  reference: string;
  receivedAt: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface AdminUserDto {
  id: string;
  email: string;
  name: string;
  jobTitle: string | null;
  status: AdminUserStatus;
  roles: Array<{ id: string; key: string; name: string }>;
  lastLoginAt: string | null;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface SessionUserDto extends AdminUserDto {
  permissions: string[];
}

export interface RoleDto {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  userCount: number;
}

export interface PermissionDto {
  id: string;
  key: string;
  family: string;
  action: string;
  description: string | null;
}

export interface AuditLogDto {
  id: string;
  action: string;
  entityType: ContentEntityType;
  entityId: string | null;
  entityLabel: string | null;
  summary: string | null;
  actor: { id: string | null; email: string | null } | null;
  ipAddress: string | null;
  requestId: string | null;
  createdAt: string;
}

export interface RedirectRuleDto {
  id: string;
  source: string;
  destination: string;
  status: RedirectStatus;
  httpStatus: number;
  reason: string | null;
  isActive: boolean;
  hitCount: number;
  createdAt: string;
}

export interface RevisionDto {
  id: string;
  entityType: ContentEntityType;
  entityId: string;
  version: number;
  action: string;
  statusAfter: PublicationStatus;
  changeSummary: string | null;
  editor: { id: string | null; name: string | null } | null;
  createdAt: string;
}

export interface DashboardStatsDto {
  content: {
    pages: number;
    services: number;
    solutions: number;
    products: number;
    projects: number;
    caseStudies: number;
    posts: number;
    openRoles: number;
  };
  workflow: Record<PublicationStatus, number>;
  leads: {
    total: number;
    newThisWeek: number;
    byStatus: Record<string, number>;
  };
  media: { images: number; documents: number; totalBytes: number };
  recentAudit: AuditLogDto[];
}

export interface SeoIssueDto {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  entityType: ContentEntityType;
  entityId: string;
  entityLabel: string;
  adminPath: string;
}

export interface SeoHealthDto {
  /**
   * Internal editorial score (0-100) derived from our own checklist.
   * This is not, and does not predict, any search engine ranking.
   */
  editorialScore: number;
  checkedEntities: number;
  issues: SeoIssueDto[];
  issueCounts: { error: number; warning: number; info: number };
}
