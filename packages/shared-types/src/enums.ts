/**
 * Domain enums shared by the API, the public website and the admin panel.
 *
 * These mirror the Prisma enums one-for-one. They are declared here (rather
 * than imported from `@prisma/client`) so the Next.js applications never have
 * to pull the Prisma runtime into a browser bundle.
 */

export const PublicationStatus = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type PublicationStatus = (typeof PublicationStatus)[keyof typeof PublicationStatus];

export const AdminUserStatus = {
  INVITED: 'INVITED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DISABLED: 'DISABLED',
} as const;
export type AdminUserStatus = (typeof AdminUserStatus)[keyof typeof AdminUserStatus];

export const SectionTheme = {
  LIGHT: 'LIGHT',
  WHITE: 'WHITE',
  SOFT_PURPLE: 'SOFT_PURPLE',
  SOFT_TEAL: 'SOFT_TEAL',
  DARK: 'DARK',
  BRAND_GRADIENT: 'BRAND_GRADIENT',
} as const;
export type SectionTheme = (typeof SectionTheme)[keyof typeof SectionTheme];

export const SectionType = {
  HERO: 'HERO',
  RICH_TEXT: 'RICH_TEXT',
  SPLIT_CONTENT: 'SPLIT_CONTENT',
  IMAGE_GALLERY: 'IMAGE_GALLERY',
  STATISTICS: 'STATISTICS',
  SERVICE_GRID: 'SERVICE_GRID',
  PRODUCT_GRID: 'PRODUCT_GRID',
  SOLUTION_GRID: 'SOLUTION_GRID',
  PORTFOLIO_GRID: 'PORTFOLIO_GRID',
  CASE_STUDY: 'CASE_STUDY',
  PROCESS_STEPS: 'PROCESS_STEPS',
  TIMELINE: 'TIMELINE',
  VALUES: 'VALUES',
  TEAM: 'TEAM',
  TESTIMONIALS: 'TESTIMONIALS',
  LOGO_CLOUD: 'LOGO_CLOUD',
  FAQ: 'FAQ',
  DOWNLOAD: 'DOWNLOAD',
  CTA: 'CTA',
  CONTACT_BLOCK: 'CONTACT_BLOCK',
  TECHNOLOGY_GRID: 'TECHNOLOGY_GRID',
  VIDEO: 'VIDEO',
  QUOTE: 'QUOTE',
  CAPABILITY_STRIP: 'CAPABILITY_STRIP',
  INDUSTRY_GRID: 'INDUSTRY_GRID',
  BLOG_PREVIEW: 'BLOG_PREVIEW',
} as const;
export type SectionType = (typeof SectionType)[keyof typeof SectionType];

export const ContentBlockType = {
  PARAGRAPH: 'PARAGRAPH',
  HEADING: 'HEADING',
  IMAGE: 'IMAGE',
  GALLERY: 'GALLERY',
  QUOTE: 'QUOTE',
  CALLOUT: 'CALLOUT',
  CODE: 'CODE',
  LIST: 'LIST',
  TABLE: 'TABLE',
  VIDEO_EMBED: 'VIDEO_EMBED',
  DOWNLOAD: 'DOWNLOAD',
  CTA: 'CTA',
  RELATED_CONTENT: 'RELATED_CONTENT',
} as const;
export type ContentBlockType = (typeof ContentBlockType)[keyof typeof ContentBlockType];

export const ProductStatus = {
  CONCEPT: 'CONCEPT',
  PLANNED: 'PLANNED',
  IN_DEVELOPMENT: 'IN_DEVELOPMENT',
  COMING_SOON: 'COMING_SOON',
  BETA: 'BETA',
  LIVE: 'LIVE',
  MAINTENANCE: 'MAINTENANCE',
  RETIRED: 'RETIRED',
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const ProjectStatus = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  MAINTENANCE: 'MAINTENANCE',
  PRIVATE: 'PRIVATE',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const BlogPostType = {
  ARTICLE: 'ARTICLE',
  TECHNICAL_GUIDE: 'TECHNICAL_GUIDE',
  PRODUCT_UPDATE: 'PRODUCT_UPDATE',
  RELEASE_NOTE: 'RELEASE_NOTE',
  CASE_STUDY: 'CASE_STUDY',
  COMPANY_NEWS: 'COMPANY_NEWS',
  INDUSTRY_INSIGHT: 'INDUSTRY_INSIGHT',
} as const;
export type BlogPostType = (typeof BlogPostType)[keyof typeof BlogPostType];

export const CareerStatus = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type CareerStatus = (typeof CareerStatus)[keyof typeof CareerStatus];

export const WorkplaceType = {
  ONSITE: 'ONSITE',
  HYBRID: 'HYBRID',
  REMOTE: 'REMOTE',
} as const;
export type WorkplaceType = (typeof WorkplaceType)[keyof typeof WorkplaceType];

export const EmploymentType = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACT',
  INTERNSHIP: 'INTERNSHIP',
  TEMPORARY: 'TEMPORARY',
} as const;
export type EmploymentType = (typeof EmploymentType)[keyof typeof EmploymentType];

export const ApplicationStatus = {
  RECEIVED: 'RECEIVED',
  SCREENING: 'SCREENING',
  SHORTLISTED: 'SHORTLISTED',
  INTERVIEW: 'INTERVIEW',
  OFFER: 'OFFER',
  HIRED: 'HIRED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const LeadType = {
  CONTACT: 'CONTACT',
  QUOTE: 'QUOTE',
  NEWSLETTER: 'NEWSLETTER',
  CAREER: 'CAREER',
} as const;
export type LeadType = (typeof LeadType)[keyof typeof LeadType];

export const LeadStatus = {
  NEW: 'NEW',
  REVIEWING: 'REVIEWING',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  PROPOSAL: 'PROPOSAL',
  WON: 'WON',
  LOST: 'LOST',
  SPAM: 'SPAM',
  ARCHIVED: 'ARCHIVED',
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const MediaVisibility = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
} as const;
export type MediaVisibility = (typeof MediaVisibility)[keyof typeof MediaVisibility];

export const MediaKind = {
  IMAGE: 'IMAGE',
  LOGO: 'LOGO',
  ICON: 'ICON',
  SCREENSHOT: 'SCREENSHOT',
  OPEN_GRAPH: 'OPEN_GRAPH',
} as const;
export type MediaKind = (typeof MediaKind)[keyof typeof MediaKind];

export const DocumentKind = {
  LEAD_ATTACHMENT: 'LEAD_ATTACHMENT',
  CV: 'CV',
  BROCHURE: 'BROCHURE',
  CASE_STUDY_DOWNLOAD: 'CASE_STUDY_DOWNLOAD',
  GENERAL: 'GENERAL',
} as const;
export type DocumentKind = (typeof DocumentKind)[keyof typeof DocumentKind];

export const RedirectStatus = {
  PERMANENT_301: 'PERMANENT_301',
  FOUND_302: 'FOUND_302',
  TEMPORARY_307: 'TEMPORARY_307',
  PERMANENT_308: 'PERMANENT_308',
  GONE_410: 'GONE_410',
} as const;
export type RedirectStatus = (typeof RedirectStatus)[keyof typeof RedirectStatus];

/** Maps the redirect enum onto the HTTP status code that must be returned. */
export const REDIRECT_HTTP_CODE: Record<RedirectStatus, number> = {
  PERMANENT_301: 301,
  FOUND_302: 302,
  TEMPORARY_307: 307,
  PERMANENT_308: 308,
  GONE_410: 410,
};

export const SitemapFrequency = {
  ALWAYS: 'ALWAYS',
  HOURLY: 'HOURLY',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
  NEVER: 'NEVER',
} as const;
export type SitemapFrequency = (typeof SitemapFrequency)[keyof typeof SitemapFrequency];

export const NavigationLocation = {
  PRIMARY: 'PRIMARY',
  FOOTER: 'FOOTER',
  UTILITY: 'UTILITY',
  MOBILE: 'MOBILE',
  LEGAL: 'LEGAL',
} as const;
export type NavigationLocation = (typeof NavigationLocation)[keyof typeof NavigationLocation];

export const AnnouncementTone = {
  INFO: 'INFO',
  BRAND: 'BRAND',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
} as const;
export type AnnouncementTone = (typeof AnnouncementTone)[keyof typeof AnnouncementTone];

export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ARCHIVE: 'ARCHIVE',
  RESTORE: 'RESTORE',
  PUBLISH: 'PUBLISH',
  UNPUBLISH: 'UNPUBLISH',
  SCHEDULE: 'SCHEDULE',
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_COMPLETE: 'PASSWORD_RESET_COMPLETE',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PERMISSION_CHANGE: 'PERMISSION_CHANGE',
  UPLOAD: 'UPLOAD',
  DOWNLOAD: 'DOWNLOAD',
  EXPORT: 'EXPORT',
  STATUS_CHANGE: 'STATUS_CHANGE',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const RevisionAction = {
  SAVED: 'SAVED',
  SUBMITTED_FOR_REVIEW: 'SUBMITTED_FOR_REVIEW',
  PUBLISHED: 'PUBLISHED',
  UNPUBLISHED: 'UNPUBLISHED',
  SCHEDULED: 'SCHEDULED',
  ARCHIVED: 'ARCHIVED',
  RESTORED: 'RESTORED',
  DUPLICATED: 'DUPLICATED',
} as const;
export type RevisionAction = (typeof RevisionAction)[keyof typeof RevisionAction];

export const ContentEntityType = {
  PAGE: 'PAGE',
  PAGE_SECTION: 'PAGE_SECTION',
  SERVICE: 'SERVICE',
  SERVICE_CATEGORY: 'SERVICE_CATEGORY',
  SOLUTION: 'SOLUTION',
  INDUSTRY: 'INDUSTRY',
  PRODUCT: 'PRODUCT',
  PORTFOLIO_PROJECT: 'PORTFOLIO_PROJECT',
  CASE_STUDY: 'CASE_STUDY',
  BLOG_POST: 'BLOG_POST',
  BLOG_CATEGORY: 'BLOG_CATEGORY',
  CAREER: 'CAREER',
  TEAM_MEMBER: 'TEAM_MEMBER',
  TESTIMONIAL: 'TESTIMONIAL',
  CLIENT: 'CLIENT',
  PARTNER: 'PARTNER',
  PROCESS_PHASE: 'PROCESS_PHASE',
  TECHNOLOGY: 'TECHNOLOGY',
  COMPANY_VALUE: 'COMPANY_VALUE',
  COMPANY_MILESTONE: 'COMPANY_MILESTONE',
  STATISTIC: 'STATISTIC',
  NAVIGATION_MENU: 'NAVIGATION_MENU',
  FOOTER_GROUP: 'FOOTER_GROUP',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  SITE_SETTING: 'SITE_SETTING',
  BRAND_SETTING: 'BRAND_SETTING',
  REDIRECT_RULE: 'REDIRECT_RULE',
  MEDIA_ASSET: 'MEDIA_ASSET',
  DOCUMENT_ASSET: 'DOCUMENT_ASSET',
  LEAD: 'LEAD',
  JOB_APPLICATION: 'JOB_APPLICATION',
  NEWSLETTER_SUBSCRIBER: 'NEWSLETTER_SUBSCRIBER',
  ADMIN_USER: 'ADMIN_USER',
  ROLE: 'ROLE',
} as const;
export type ContentEntityType = (typeof ContentEntityType)[keyof typeof ContentEntityType];

/** Human readable labels used in the admin UI. */
export const PUBLICATION_STATUS_LABEL: Record<PublicationStatus, string> = {
  DRAFT: 'Draft',
  REVIEW: 'In review',
  SCHEDULED: 'Scheduled',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  CONCEPT: 'Concept',
  PLANNED: 'Planned',
  IN_DEVELOPMENT: 'In development',
  COMING_SOON: 'Coming soon',
  BETA: 'Beta',
  LIVE: 'Live',
  MAINTENANCE: 'Maintenance',
  RETIRED: 'Retired',
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In progress',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  MAINTENANCE: 'Maintenance',
  PRIVATE: 'Private',
};

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: 'New',
  REVIEWING: 'Reviewing',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  WON: 'Won',
  LOST: 'Lost',
  SPAM: 'Spam',
  ARCHIVED: 'Archived',
};

export const WORKPLACE_TYPE_LABEL: Record<WorkplaceType, string> = {
  ONSITE: 'On site',
  HYBRID: 'Hybrid',
  REMOTE: 'Remote',
};

export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  TEMPORARY: 'Temporary',
};

/** schema.org employmentType values, keyed by our enum. */
export const EMPLOYMENT_TYPE_SCHEMA_ORG: Record<EmploymentType, string> = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACTOR',
  INTERNSHIP: 'INTERN',
  TEMPORARY: 'TEMPORARY',
};
