-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AdminUserStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "ContentEntityType" AS ENUM ('PAGE', 'PAGE_SECTION', 'SERVICE', 'SERVICE_CATEGORY', 'SOLUTION', 'INDUSTRY', 'PRODUCT', 'PORTFOLIO_PROJECT', 'CASE_STUDY', 'BLOG_POST', 'BLOG_CATEGORY', 'CAREER', 'TEAM_MEMBER', 'TESTIMONIAL', 'CLIENT', 'PARTNER', 'PROCESS_PHASE', 'TECHNOLOGY', 'COMPANY_VALUE', 'COMPANY_MILESTONE', 'STATISTIC', 'NAVIGATION_MENU', 'FOOTER_GROUP', 'ANNOUNCEMENT', 'SITE_SETTING', 'BRAND_SETTING', 'REDIRECT_RULE', 'MEDIA_ASSET', 'DOCUMENT_ASSET', 'LEAD', 'JOB_APPLICATION', 'NEWSLETTER_SUBSCRIBER', 'ADMIN_USER', 'ROLE');

-- CreateEnum
CREATE TYPE "SectionTheme" AS ENUM ('LIGHT', 'WHITE', 'SOFT_PURPLE', 'SOFT_TEAL', 'DARK', 'BRAND_GRADIENT');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('HERO', 'RICH_TEXT', 'SPLIT_CONTENT', 'IMAGE_GALLERY', 'STATISTICS', 'SERVICE_GRID', 'PRODUCT_GRID', 'SOLUTION_GRID', 'PORTFOLIO_GRID', 'CASE_STUDY', 'PROCESS_STEPS', 'TIMELINE', 'VALUES', 'TEAM', 'TESTIMONIALS', 'LOGO_CLOUD', 'FAQ', 'DOWNLOAD', 'CTA', 'CONTACT_BLOCK', 'TECHNOLOGY_GRID', 'VIDEO', 'QUOTE', 'CAPABILITY_STRIP', 'INDUSTRY_GRID', 'BLOG_PREVIEW');

-- CreateEnum
CREATE TYPE "ContentBlockType" AS ENUM ('PARAGRAPH', 'HEADING', 'IMAGE', 'GALLERY', 'QUOTE', 'CALLOUT', 'CODE', 'LIST', 'TABLE', 'VIDEO_EMBED', 'DOWNLOAD', 'CTA', 'RELATED_CONTENT');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('CONCEPT', 'PLANNED', 'IN_DEVELOPMENT', 'COMING_SOON', 'BETA', 'LIVE', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'ONGOING', 'COMPLETED', 'MAINTENANCE', 'PRIVATE');

-- CreateEnum
CREATE TYPE "BlogPostType" AS ENUM ('ARTICLE', 'TECHNICAL_GUIDE', 'PRODUCT_UPDATE', 'RELEASE_NOTE', 'CASE_STUDY', 'COMPANY_NEWS', 'INDUSTRY_INSIGHT');

-- CreateEnum
CREATE TYPE "CareerStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkplaceType" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('RECEIVED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('CONTACT', 'QUOTE', 'NEWSLETTER', 'CAREER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'REVIEWING', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST', 'SPAM', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MediaVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'LOGO', 'ICON', 'SCREENSHOT', 'OPEN_GRAPH');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('LEAD_ATTACHMENT', 'CV', 'BROCHURE', 'CASE_STUDY_DOWNLOAD', 'GENERAL');

-- CreateEnum
CREATE TYPE "RedirectStatus" AS ENUM ('PERMANENT_301', 'FOUND_302', 'TEMPORARY_307', 'PERMANENT_308', 'GONE_410');

-- CreateEnum
CREATE TYPE "SitemapFrequency" AS ENUM ('ALWAYS', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'NEVER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'RESTORE', 'PUBLISH', 'UNPUBLISH', 'SCHEDULE', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_COMPLETE', 'PASSWORD_CHANGE', 'PERMISSION_CHANGE', 'UPLOAD', 'DOWNLOAD', 'EXPORT', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "NavigationLocation" AS ENUM ('PRIMARY', 'FOOTER', 'UTILITY', 'MOBILE', 'LEGAL');

-- CreateEnum
CREATE TYPE "AnnouncementTone" AS ENUM ('INFO', 'BRAND', 'SUCCESS', 'WARNING');

-- CreateEnum
CREATE TYPE "RevisionAction" AS ENUM ('SAVED', 'SUBMITTED_FOR_REVIEW', 'PUBLISHED', 'UNPUBLISHED', 'SCHEDULED', 'ARCHIVED', 'RESTORED', 'DUPLICATED');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jobTitle" TEXT,
    "passwordHash" TEXT NOT NULL,
    "status" "AdminUserStatus" NOT NULL DEFAULT 'INVITED',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idleExpiresAt" TIMESTAMP(3) NOT NULL,
    "absoluteExpiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "requestIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "actorEmail" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" "ContentEntityType" NOT NULL,
    "entityId" TEXT,
    "entityLabel" TEXT,
    "summary" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responseBody" JSONB,
    "statusCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "generatedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL DEFAULT 'IMAGE',
    "visibility" "MediaVisibility" NOT NULL DEFAULT 'PUBLIC',
    "folder" TEXT NOT NULL DEFAULT 'content',
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "aspectRatio" DOUBLE PRECISION,
    "blurDataUrl" TEXT,
    "altText" TEXT,
    "caption" TEXT,
    "focalX" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "focalY" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "checksum" TEXT,
    "variants" JSONB,
    "uploadedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_assets" (
    "id" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "generatedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL DEFAULT 'GENERAL',
    "visibility" "MediaVisibility" NOT NULL DEFAULT 'PRIVATE',
    "folder" TEXT NOT NULL DEFAULT 'documents',
    "sizeBytes" INTEGER NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "checksum" TEXT,
    "uploadedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "document_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_usages" (
    "id" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "entityType" "ContentEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'gallery',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "altOverride" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_metadata" (
    "id" UUID NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "canonicalUrl" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImageId" UUID,
    "twitterCard" TEXT NOT NULL DEFAULT 'summary_large_image',
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "robotsIndex" BOOLEAN NOT NULL DEFAULT true,
    "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
    "includeInSitemap" BOOLEAN NOT NULL DEFAULT true,
    "sitemapPriority" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "sitemapFrequency" "SitemapFrequency" NOT NULL DEFAULT 'WEEKLY',
    "structuredDataOverride" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redirect_rules" (
    "id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "status" "RedirectStatus" NOT NULL DEFAULT 'PERMANENT_301',
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastHitAt" TIMESTAMP(3),
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "redirect_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_revisions" (
    "id" UUID NOT NULL,
    "entityType" "ContentEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "editorId" UUID,
    "changeSummary" TEXT,
    "action" "RevisionAction" NOT NULL DEFAULT 'SAVED',
    "statusAfter" "PublicationStatus" NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'general',
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_settings" (
    "id" UUID NOT NULL,
    "singleton" BOOLEAN NOT NULL DEFAULT true,
    "companyName" TEXT NOT NULL DEFAULT 'Key Tech Solutions',
    "shortName" TEXT NOT NULL DEFAULT 'Key Tech',
    "legalName" TEXT,
    "tagline" TEXT,
    "description" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#6436A3',
    "secondaryColor" TEXT NOT NULL DEFAULT '#416F9E',
    "accentColor" TEXT NOT NULL DEFAULT '#2CA3A3',
    "highlightColor" TEXT NOT NULL DEFAULT '#5BC3C6',
    "inkColor" TEXT NOT NULL DEFAULT '#111426',
    "gradientCss" TEXT NOT NULL DEFAULT 'linear-gradient(135deg, #6436A3 0%, #416F9E 50%, #2CA3A3 100%)',
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "supportEmail" TEXT,
    "logoLightId" UUID,
    "logoDarkId" UUID,
    "logoMarkId" UUID,
    "faviconId" UUID,
    "ogDefaultId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links" (
    "id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "iconName" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_menus" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" "NavigationLocation" NOT NULL DEFAULT 'PRIMARY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigation_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_items" (
    "id" UUID NOT NULL,
    "menuId" UUID NOT NULL,
    "parentId" UUID,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer_groups" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer_links" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "linkLabel" TEXT,
    "linkHref" TEXT,
    "tone" "AnnouncementTone" NOT NULL DEFAULT 'BRAND',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eyebrow" TEXT,
    "headline" TEXT,
    "subheadline" TEXT,
    "summary" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "showInSitemap" BOOLEAN NOT NULL DEFAULT true,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "coverImageId" UUID,
    "seoId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_sections" (
    "id" UUID NOT NULL,
    "pageId" UUID NOT NULL,
    "internalName" TEXT NOT NULL,
    "type" "SectionType" NOT NULL,
    "eyebrow" TEXT,
    "heading" TEXT,
    "subheading" TEXT,
    "description" TEXT,
    "bodyHtml" TEXT,
    "theme" "SectionTheme" NOT NULL DEFAULT 'WHITE',
    "layoutVariant" TEXT NOT NULL DEFAULT 'default',
    "backgroundImageUrl" TEXT,
    "mediaId" UUID,
    "primaryCtaLabel" TEXT,
    "primaryCtaHref" TEXT,
    "secondaryCtaLabel" TEXT,
    "secondaryCtaHref" TEXT,
    "settings" JSONB,
    "relatedIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "visibleFrom" TIMESTAMP(3),
    "visibleUntil" TIMESTAMP(3),
    "status" "PublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_blocks" (
    "id" UUID NOT NULL,
    "sectionId" UUID,
    "blogPostId" UUID,
    "type" "ContentBlockType" NOT NULL,
    "heading" TEXT,
    "text" TEXT,
    "html" TEXT,
    "code" TEXT,
    "language" TEXT,
    "items" JSONB,
    "mediaId" UUID,
    "href" TEXT,
    "linkLabel" TEXT,
    "settings" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_categories" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT,
    "accentColor" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" UUID,
    "shortDescription" TEXT NOT NULL,
    "fullDescription" TEXT,
    "iconName" TEXT,
    "coverImageId" UUID,
    "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "processSummary" TEXT,
    "ctaHeading" TEXT,
    "ctaDescription" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "seoId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_features" (
    "id" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_faqs" (
    "id" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solutions" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "businessChallenge" TEXT,
    "overview" TEXT,
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "userTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "workflowSteps" JSONB,
    "integrations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "iconName" TEXT,
    "coverImageId" UUID,
    "ctaHeading" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "seoId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "solutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solution_features" (
    "id" UUID NOT NULL,
    "solutionId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solution_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solution_faqs" (
    "id" UUID NOT NULL,
    "solutionId" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solution_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solution_documents" (
    "id" UUID NOT NULL,
    "solutionId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solution_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industries" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "introduction" TEXT,
    "challenges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "iconName" TEXT,
    "coverImageId" UUID,
    "ctaHeading" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "seoId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "category" TEXT,
    "productStatus" "ProductStatus" NOT NULL DEFAULT 'CONCEPT',
    "summary" TEXT NOT NULL,
    "fullDescription" TEXT,
    "problemSolved" TEXT,
    "targetUsers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "brandPrimary" TEXT,
    "brandSecondary" TEXT,
    "logoId" UUID,
    "coverImageId" UUID,
    "demoVideoUrl" TEXT,
    "websiteUrl" TEXT,
    "demoUrl" TEXT,
    "documentationUrl" TEXT,
    "launchLabel" TEXT,
    "launchDate" TIMESTAMP(3),
    "businessModel" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "seoId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_features" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_screenshots" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "title" TEXT,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_screenshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_faqs" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_projects" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "customerDisplayName" TEXT,
    "isCustomerConfidential" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "projectStatus" "ProjectStatus" NOT NULL DEFAULT 'PLANNED',
    "startDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "summary" TEXT NOT NULL,
    "challenge" TEXT,
    "approach" TEXT,
    "solution" TEXT,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publicUrl" TEXT,
    "demoUrl" TEXT,
    "coverImageId" UUID,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "seoId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "portfolio_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_features" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_studies" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "projectId" UUID,
    "approvedCustomerName" TEXT,
    "isCustomerApproved" BOOLEAN NOT NULL DEFAULT false,
    "background" TEXT,
    "challenge" TEXT,
    "discovery" TEXT,
    "strategy" TEXT,
    "design" TEXT,
    "development" TEXT,
    "architecture" TEXT,
    "solution" TEXT,
    "results" TEXT,
    "summary" TEXT NOT NULL,
    "coverImageId" UUID,
    "ctaHeading" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "seoId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "testimonialId" UUID,

    CONSTRAINT "case_studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_study_metrics" (
    "id" UUID NOT NULL,
    "caseStudyId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "description" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "sourceNote" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_study_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_study_downloads" (
    "id" UUID NOT NULL,
    "caseStudyId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_study_downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" UUID NOT NULL,
    "quote" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT,
    "organization" TEXT,
    "photoId" UUID,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvalNote" TEXT,
    "isSampleContent" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "organization" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoId" UUID,
    "websiteUrl" TEXT,
    "isDisplayApproved" BOOLEAN NOT NULL DEFAULT false,
    "isSampleContent" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" UUID NOT NULL,
    "organization" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoId" UUID,
    "websiteUrl" TEXT,
    "relationshipNote" TEXT,
    "isDisplayApproved" BOOLEAN NOT NULL DEFAULT false,
    "isSampleContent" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_phases" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "detailedDescription" TEXT,
    "deliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "iconName" TEXT,
    "imageId" UUID,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "process_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_values" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconName" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_milestones" (
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "occurredOn" TIMESTAMP(3),
    "imageId" UUID,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statistics" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "numericValue" DOUBLE PRECISION,
    "prefix" TEXT,
    "suffix" TEXT,
    "description" TEXT,
    "group" TEXT NOT NULL DEFAULT 'home',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technology_categories" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technology_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technologies" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" UUID,
    "description" TEXT,
    "proficiencyLabel" TEXT,
    "logoId" UUID,
    "websiteUrl" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technologies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "biography" TEXT,
    "photoId" UUID,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "publicEmail" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authors" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "jobTitle" TEXT,
    "biography" TEXT,
    "avatarId" UUID,
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "websiteUrl" TEXT,
    "adminUserId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "accentColor" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "seoId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_tags" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "contentHtml" TEXT,
    "postType" "BlogPostType" NOT NULL DEFAULT 'ARTICLE',
    "coverImageId" UUID,
    "authorId" UUID,
    "categoryId" UUID,
    "readingMinutes" INTEGER NOT NULL DEFAULT 3,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "contentUpdatedAt" TIMESTAMP(3),
    "seoId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_post_tags" (
    "postId" UUID NOT NULL,
    "tagId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_post_tags_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateTable
CREATE TABLE "careers" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "workplaceType" "WorkplaceType" NOT NULL DEFAULT 'ONSITE',
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "summary" TEXT NOT NULL,
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "applyDeadline" TIMESTAMP(3),
    "careerStatus" "CareerStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "seoId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "careers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" UUID NOT NULL,
    "careerId" UUID NOT NULL,
    "applicantName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "portfolioUrl" TEXT,
    "linkedinUrl" TEXT,
    "coverNote" TEXT,
    "cvDocumentId" UUID,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentText" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicationStatus" "ApplicationStatus" NOT NULL DEFAULT 'RECEIVED',
    "internalNotes" TEXT,
    "sourceIp" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "LeadType" NOT NULL DEFAULT 'CONTACT',
    "leadStatus" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "organization" TEXT,
    "subject" TEXT,
    "message" TEXT,
    "serviceInterest" TEXT,
    "assignedToId" UUID,
    "attachmentId" UUID,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentText" TEXT,
    "sourcePage" TEXT,
    "sourceIp" TEXT,
    "userAgent" TEXT,
    "spamScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_notes" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "authorId" UUID,
    "body" TEXT NOT NULL,
    "channel" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_submissions" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "serviceInterest" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_requests" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "projectType" TEXT NOT NULL,
    "businessChallenge" TEXT NOT NULL,
    "requiredFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "existingSystem" TEXT,
    "budgetRange" TEXT,
    "preferredStart" TEXT,
    "timelineNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmTokenHash" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "sourcePage" TEXT,
    "sourceIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ServiceSolutions" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ServiceTechnologies" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ServiceIndustries" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_SolutionIndustries" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ProductIndustries" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_IndustryProjects" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ServiceProducts" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ProductSolutions" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ProductTechnologies" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ServiceProjects" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_SolutionProjects" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ProductProjects" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ProjectTechnologies" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ServiceCaseStudies" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ProductCaseStudies" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_IndustryCaseStudies" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_BlogPostServices" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_BlogPostProducts" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_RelatedPosts" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_status_idx" ON "admin_users"("status");

-- CreateIndex
CREATE INDEX "admin_users_archivedAt_idx" ON "admin_users"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_tokenHash_key" ON "admin_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "admin_sessions_userId_idx" ON "admin_sessions"("userId");

-- CreateIndex
CREATE INDEX "admin_sessions_absoluteExpiresAt_idx" ON "admin_sessions"("absoluteExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_tokenHash_key" ON "password_resets"("tokenHash");

-- CreateIndex
CREATE INDEX "password_resets_userId_idx" ON "password_resets"("userId");

-- CreateIndex
CREATE INDEX "password_resets_expiresAt_idx" ON "password_resets"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "roles_key_key" ON "roles"("key");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "permissions_family_idx" ON "permissions"("family");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_key_key" ON "idempotency_records"("key");

-- CreateIndex
CREATE INDEX "idempotency_records_expiresAt_idx" ON "idempotency_records"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_storageKey_key" ON "media_assets"("storageKey");

-- CreateIndex
CREATE INDEX "media_assets_visibility_archivedAt_idx" ON "media_assets"("visibility", "archivedAt");

-- CreateIndex
CREATE INDEX "media_assets_kind_idx" ON "media_assets"("kind");

-- CreateIndex
CREATE INDEX "media_assets_folder_idx" ON "media_assets"("folder");

-- CreateIndex
CREATE INDEX "media_assets_createdAt_idx" ON "media_assets"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "document_assets_storageKey_key" ON "document_assets"("storageKey");

-- CreateIndex
CREATE INDEX "document_assets_visibility_archivedAt_idx" ON "document_assets"("visibility", "archivedAt");

-- CreateIndex
CREATE INDEX "document_assets_kind_idx" ON "document_assets"("kind");

-- CreateIndex
CREATE INDEX "media_usages_entityType_entityId_role_sortOrder_idx" ON "media_usages"("entityType", "entityId", "role", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "media_usages_mediaId_entityType_entityId_role_key" ON "media_usages"("mediaId", "entityType", "entityId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "redirect_rules_source_key" ON "redirect_rules"("source");

-- CreateIndex
CREATE INDEX "redirect_rules_isActive_idx" ON "redirect_rules"("isActive");

-- CreateIndex
CREATE INDEX "page_revisions_entityType_entityId_idx" ON "page_revisions"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "page_revisions_createdAt_idx" ON "page_revisions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "page_revisions_entityType_entityId_version_key" ON "page_revisions"("entityType", "entityId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_key_key" ON "site_settings"("key");

-- CreateIndex
CREATE INDEX "site_settings_group_idx" ON "site_settings"("group");

-- CreateIndex
CREATE UNIQUE INDEX "brand_settings_singleton_key" ON "brand_settings"("singleton");

-- CreateIndex
CREATE UNIQUE INDEX "social_links_platform_key" ON "social_links"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "navigation_menus_key_key" ON "navigation_menus"("key");

-- CreateIndex
CREATE INDEX "navigation_items_menuId_sortOrder_idx" ON "navigation_items"("menuId", "sortOrder");

-- CreateIndex
CREATE INDEX "navigation_items_parentId_idx" ON "navigation_items"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "footer_groups_key_key" ON "footer_groups"("key");

-- CreateIndex
CREATE INDEX "footer_links_groupId_sortOrder_idx" ON "footer_links"("groupId", "sortOrder");

-- CreateIndex
CREATE INDEX "announcements_isActive_startsAt_endsAt_idx" ON "announcements"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "pages_path_key" ON "pages"("path");

-- CreateIndex
CREATE UNIQUE INDEX "pages_seoId_key" ON "pages"("seoId");

-- CreateIndex
CREATE INDEX "pages_status_publishedAt_idx" ON "pages"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "pages_archivedAt_idx" ON "pages"("archivedAt");

-- CreateIndex
CREATE INDEX "page_sections_pageId_sortOrder_idx" ON "page_sections"("pageId", "sortOrder");

-- CreateIndex
CREATE INDEX "page_sections_type_idx" ON "page_sections"("type");

-- CreateIndex
CREATE INDEX "content_blocks_sectionId_sortOrder_idx" ON "content_blocks"("sectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "content_blocks_blogPostId_sortOrder_idx" ON "content_blocks"("blogPostId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_slug_key" ON "service_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "services_seoId_key" ON "services"("seoId");

-- CreateIndex
CREATE INDEX "services_status_publishedAt_idx" ON "services"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "services_categoryId_idx" ON "services"("categoryId");

-- CreateIndex
CREATE INDEX "services_isFeatured_idx" ON "services"("isFeatured");

-- CreateIndex
CREATE INDEX "services_archivedAt_idx" ON "services"("archivedAt");

-- CreateIndex
CREATE INDEX "service_features_serviceId_sortOrder_idx" ON "service_features"("serviceId", "sortOrder");

-- CreateIndex
CREATE INDEX "service_faqs_serviceId_sortOrder_idx" ON "service_faqs"("serviceId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "solutions_slug_key" ON "solutions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "solutions_seoId_key" ON "solutions"("seoId");

-- CreateIndex
CREATE INDEX "solutions_status_publishedAt_idx" ON "solutions"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "solutions_isFeatured_idx" ON "solutions"("isFeatured");

-- CreateIndex
CREATE INDEX "solutions_archivedAt_idx" ON "solutions"("archivedAt");

-- CreateIndex
CREATE INDEX "solution_features_solutionId_sortOrder_idx" ON "solution_features"("solutionId", "sortOrder");

-- CreateIndex
CREATE INDEX "solution_faqs_solutionId_sortOrder_idx" ON "solution_faqs"("solutionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "solution_documents_solutionId_documentId_key" ON "solution_documents"("solutionId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "industries_slug_key" ON "industries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "industries_seoId_key" ON "industries"("seoId");

-- CreateIndex
CREATE INDEX "industries_status_publishedAt_idx" ON "industries"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "industries_archivedAt_idx" ON "industries"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_seoId_key" ON "products"("seoId");

-- CreateIndex
CREATE INDEX "products_status_publishedAt_idx" ON "products"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "products_productStatus_idx" ON "products"("productStatus");

-- CreateIndex
CREATE INDEX "products_isFeatured_idx" ON "products"("isFeatured");

-- CreateIndex
CREATE INDEX "products_archivedAt_idx" ON "products"("archivedAt");

-- CreateIndex
CREATE INDEX "product_features_productId_sortOrder_idx" ON "product_features"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "product_screenshots_productId_sortOrder_idx" ON "product_screenshots"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "product_faqs_productId_sortOrder_idx" ON "product_faqs"("productId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_projects_slug_key" ON "portfolio_projects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_projects_seoId_key" ON "portfolio_projects"("seoId");

-- CreateIndex
CREATE INDEX "portfolio_projects_status_publishedAt_idx" ON "portfolio_projects"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "portfolio_projects_projectStatus_idx" ON "portfolio_projects"("projectStatus");

-- CreateIndex
CREATE INDEX "portfolio_projects_isFeatured_idx" ON "portfolio_projects"("isFeatured");

-- CreateIndex
CREATE INDEX "portfolio_projects_archivedAt_idx" ON "portfolio_projects"("archivedAt");

-- CreateIndex
CREATE INDEX "portfolio_features_projectId_sortOrder_idx" ON "portfolio_features"("projectId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "case_studies_slug_key" ON "case_studies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "case_studies_seoId_key" ON "case_studies"("seoId");

-- CreateIndex
CREATE INDEX "case_studies_status_publishedAt_idx" ON "case_studies"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "case_studies_isFeatured_idx" ON "case_studies"("isFeatured");

-- CreateIndex
CREATE INDEX "case_studies_archivedAt_idx" ON "case_studies"("archivedAt");

-- CreateIndex
CREATE INDEX "case_study_metrics_caseStudyId_sortOrder_idx" ON "case_study_metrics"("caseStudyId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "case_study_downloads_caseStudyId_documentId_key" ON "case_study_downloads"("caseStudyId", "documentId");

-- CreateIndex
CREATE INDEX "testimonials_status_isApproved_idx" ON "testimonials"("status", "isApproved");

-- CreateIndex
CREATE UNIQUE INDEX "clients_slug_key" ON "clients"("slug");

-- CreateIndex
CREATE INDEX "clients_status_isDisplayApproved_idx" ON "clients"("status", "isDisplayApproved");

-- CreateIndex
CREATE UNIQUE INDEX "partners_slug_key" ON "partners"("slug");

-- CreateIndex
CREATE INDEX "partners_status_isDisplayApproved_idx" ON "partners"("status", "isDisplayApproved");

-- CreateIndex
CREATE UNIQUE INDEX "process_phases_slug_key" ON "process_phases"("slug");

-- CreateIndex
CREATE INDEX "process_phases_sortOrder_idx" ON "process_phases"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "company_values_slug_key" ON "company_values"("slug");

-- CreateIndex
CREATE INDEX "company_milestones_sortOrder_idx" ON "company_milestones"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "statistics_key_key" ON "statistics"("key");

-- CreateIndex
CREATE INDEX "statistics_group_sortOrder_idx" ON "statistics"("group", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "technology_categories_slug_key" ON "technology_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "technologies_slug_key" ON "technologies"("slug");

-- CreateIndex
CREATE INDEX "technologies_categoryId_sortOrder_idx" ON "technologies"("categoryId", "sortOrder");

-- CreateIndex
CREATE INDEX "technologies_isFeatured_idx" ON "technologies"("isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_slug_key" ON "team_members"("slug");

-- CreateIndex
CREATE INDEX "team_members_status_sortOrder_idx" ON "team_members"("status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "authors_slug_key" ON "authors"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "authors_adminUserId_key" ON "authors"("adminUserId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_seoId_key" ON "blog_categories"("seoId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_tags_slug_key" ON "blog_tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_seoId_key" ON "blog_posts"("seoId");

-- CreateIndex
CREATE INDEX "blog_posts_status_publishedAt_idx" ON "blog_posts"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "blog_posts_categoryId_idx" ON "blog_posts"("categoryId");

-- CreateIndex
CREATE INDEX "blog_posts_authorId_idx" ON "blog_posts"("authorId");

-- CreateIndex
CREATE INDEX "blog_posts_isFeatured_idx" ON "blog_posts"("isFeatured");

-- CreateIndex
CREATE INDEX "blog_posts_archivedAt_idx" ON "blog_posts"("archivedAt");

-- CreateIndex
CREATE INDEX "blog_post_tags_tagId_idx" ON "blog_post_tags"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "careers_slug_key" ON "careers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "careers_seoId_key" ON "careers"("seoId");

-- CreateIndex
CREATE INDEX "careers_careerStatus_publishedAt_idx" ON "careers"("careerStatus", "publishedAt");

-- CreateIndex
CREATE INDEX "careers_department_idx" ON "careers"("department");

-- CreateIndex
CREATE INDEX "job_applications_careerId_applicationStatus_idx" ON "job_applications"("careerId", "applicationStatus");

-- CreateIndex
CREATE INDEX "job_applications_appliedAt_idx" ON "job_applications"("appliedAt");

-- CreateIndex
CREATE UNIQUE INDEX "leads_reference_key" ON "leads"("reference");

-- CreateIndex
CREATE INDEX "leads_leadStatus_createdAt_idx" ON "leads"("leadStatus", "createdAt");

-- CreateIndex
CREATE INDEX "leads_type_idx" ON "leads"("type");

-- CreateIndex
CREATE INDEX "leads_assignedToId_idx" ON "leads"("assignedToId");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- CreateIndex
CREATE INDEX "lead_notes_leadId_createdAt_idx" ON "lead_notes"("leadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "contact_submissions_leadId_key" ON "contact_submissions"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "quote_requests_leadId_key" ON "quote_requests"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_isConfirmed_idx" ON "newsletter_subscribers"("isConfirmed");

-- CreateIndex
CREATE UNIQUE INDEX "_ServiceSolutions_AB_unique" ON "_ServiceSolutions"("A", "B");

-- CreateIndex
CREATE INDEX "_ServiceSolutions_B_index" ON "_ServiceSolutions"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ServiceTechnologies_AB_unique" ON "_ServiceTechnologies"("A", "B");

-- CreateIndex
CREATE INDEX "_ServiceTechnologies_B_index" ON "_ServiceTechnologies"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ServiceIndustries_AB_unique" ON "_ServiceIndustries"("A", "B");

-- CreateIndex
CREATE INDEX "_ServiceIndustries_B_index" ON "_ServiceIndustries"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_SolutionIndustries_AB_unique" ON "_SolutionIndustries"("A", "B");

-- CreateIndex
CREATE INDEX "_SolutionIndustries_B_index" ON "_SolutionIndustries"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProductIndustries_AB_unique" ON "_ProductIndustries"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductIndustries_B_index" ON "_ProductIndustries"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_IndustryProjects_AB_unique" ON "_IndustryProjects"("A", "B");

-- CreateIndex
CREATE INDEX "_IndustryProjects_B_index" ON "_IndustryProjects"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ServiceProducts_AB_unique" ON "_ServiceProducts"("A", "B");

-- CreateIndex
CREATE INDEX "_ServiceProducts_B_index" ON "_ServiceProducts"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProductSolutions_AB_unique" ON "_ProductSolutions"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductSolutions_B_index" ON "_ProductSolutions"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProductTechnologies_AB_unique" ON "_ProductTechnologies"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductTechnologies_B_index" ON "_ProductTechnologies"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ServiceProjects_AB_unique" ON "_ServiceProjects"("A", "B");

-- CreateIndex
CREATE INDEX "_ServiceProjects_B_index" ON "_ServiceProjects"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_SolutionProjects_AB_unique" ON "_SolutionProjects"("A", "B");

-- CreateIndex
CREATE INDEX "_SolutionProjects_B_index" ON "_SolutionProjects"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProductProjects_AB_unique" ON "_ProductProjects"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductProjects_B_index" ON "_ProductProjects"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectTechnologies_AB_unique" ON "_ProjectTechnologies"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectTechnologies_B_index" ON "_ProjectTechnologies"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ServiceCaseStudies_AB_unique" ON "_ServiceCaseStudies"("A", "B");

-- CreateIndex
CREATE INDEX "_ServiceCaseStudies_B_index" ON "_ServiceCaseStudies"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProductCaseStudies_AB_unique" ON "_ProductCaseStudies"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductCaseStudies_B_index" ON "_ProductCaseStudies"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_IndustryCaseStudies_AB_unique" ON "_IndustryCaseStudies"("A", "B");

-- CreateIndex
CREATE INDEX "_IndustryCaseStudies_B_index" ON "_IndustryCaseStudies"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_BlogPostServices_AB_unique" ON "_BlogPostServices"("A", "B");

-- CreateIndex
CREATE INDEX "_BlogPostServices_B_index" ON "_BlogPostServices"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_BlogPostProducts_AB_unique" ON "_BlogPostProducts"("A", "B");

-- CreateIndex
CREATE INDEX "_BlogPostProducts_B_index" ON "_BlogPostProducts"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RelatedPosts_AB_unique" ON "_RelatedPosts"("A", "B");

-- CreateIndex
CREATE INDEX "_RelatedPosts_B_index" ON "_RelatedPosts"("B");

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_assets" ADD CONSTRAINT "document_assets_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_usages" ADD CONSTRAINT "media_usages_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_metadata" ADD CONSTRAINT "seo_metadata_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redirect_rules" ADD CONSTRAINT "redirect_rules_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_revisions" ADD CONSTRAINT "page_revisions_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_settings" ADD CONSTRAINT "brand_settings_logoLightId_fkey" FOREIGN KEY ("logoLightId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_settings" ADD CONSTRAINT "brand_settings_logoDarkId_fkey" FOREIGN KEY ("logoDarkId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_settings" ADD CONSTRAINT "brand_settings_logoMarkId_fkey" FOREIGN KEY ("logoMarkId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_settings" ADD CONSTRAINT "brand_settings_faviconId_fkey" FOREIGN KEY ("faviconId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_settings" ADD CONSTRAINT "brand_settings_ogDefaultId_fkey" FOREIGN KEY ("ogDefaultId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "navigation_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "navigation_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "footer_links" ADD CONSTRAINT "footer_links_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "footer_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "seo_metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_blocks" ADD CONSTRAINT "content_blocks_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "page_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_blocks" ADD CONSTRAINT "content_blocks_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_blocks" ADD CONSTRAINT "content_blocks_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "seo_metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_features" ADD CONSTRAINT "service_features_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_faqs" ADD CONSTRAINT "service_faqs_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solutions" ADD CONSTRAINT "solutions_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solutions" ADD CONSTRAINT "solutions_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "seo_metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solution_features" ADD CONSTRAINT "solution_features_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "solutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solution_faqs" ADD CONSTRAINT "solution_faqs_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "solutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solution_documents" ADD CONSTRAINT "solution_documents_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "solutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solution_documents" ADD CONSTRAINT "solution_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industries" ADD CONSTRAINT "industries_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industries" ADD CONSTRAINT "industries_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "seo_metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "seo_metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_features" ADD CONSTRAINT "product_features_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_screenshots" ADD CONSTRAINT "product_screenshots_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_screenshots" ADD CONSTRAINT "product_screenshots_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_faqs" ADD CONSTRAINT "product_faqs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_projects" ADD CONSTRAINT "portfolio_projects_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_projects" ADD CONSTRAINT "portfolio_projects_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "seo_metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_features" ADD CONSTRAINT "portfolio_features_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "portfolio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "portfolio_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "seo_metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_testimonialId_fkey" FOREIGN KEY ("testimonialId") REFERENCES "testimonials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_study_metrics" ADD CONSTRAINT "case_study_metrics_caseStudyId_fkey" FOREIGN KEY ("caseStudyId") REFERENCES "case_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_study_downloads" ADD CONSTRAINT "case_study_downloads_caseStudyId_fkey" FOREIGN KEY ("caseStudyId") REFERENCES "case_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_study_downloads" ADD CONSTRAINT "case_study_downloads_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_phases" ADD CONSTRAINT "process_phases_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_milestones" ADD CONSTRAINT "company_milestones_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technologies" ADD CONSTRAINT "technologies_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "technology_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technologies" ADD CONSTRAINT "technologies_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authors" ADD CONSTRAINT "authors_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authors" ADD CONSTRAINT "authors_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "seo_metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "seo_metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "blog_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "careers" ADD CONSTRAINT "careers_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "seo_metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "careers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_cvDocumentId_fkey" FOREIGN KEY ("cvDocumentId") REFERENCES "document_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "document_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_submissions" ADD CONSTRAINT "contact_submissions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceSolutions" ADD CONSTRAINT "_ServiceSolutions_A_fkey" FOREIGN KEY ("A") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceSolutions" ADD CONSTRAINT "_ServiceSolutions_B_fkey" FOREIGN KEY ("B") REFERENCES "solutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceTechnologies" ADD CONSTRAINT "_ServiceTechnologies_A_fkey" FOREIGN KEY ("A") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceTechnologies" ADD CONSTRAINT "_ServiceTechnologies_B_fkey" FOREIGN KEY ("B") REFERENCES "technologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceIndustries" ADD CONSTRAINT "_ServiceIndustries_A_fkey" FOREIGN KEY ("A") REFERENCES "industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceIndustries" ADD CONSTRAINT "_ServiceIndustries_B_fkey" FOREIGN KEY ("B") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SolutionIndustries" ADD CONSTRAINT "_SolutionIndustries_A_fkey" FOREIGN KEY ("A") REFERENCES "industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SolutionIndustries" ADD CONSTRAINT "_SolutionIndustries_B_fkey" FOREIGN KEY ("B") REFERENCES "solutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductIndustries" ADD CONSTRAINT "_ProductIndustries_A_fkey" FOREIGN KEY ("A") REFERENCES "industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductIndustries" ADD CONSTRAINT "_ProductIndustries_B_fkey" FOREIGN KEY ("B") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IndustryProjects" ADD CONSTRAINT "_IndustryProjects_A_fkey" FOREIGN KEY ("A") REFERENCES "industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IndustryProjects" ADD CONSTRAINT "_IndustryProjects_B_fkey" FOREIGN KEY ("B") REFERENCES "portfolio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceProducts" ADD CONSTRAINT "_ServiceProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceProducts" ADD CONSTRAINT "_ServiceProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductSolutions" ADD CONSTRAINT "_ProductSolutions_A_fkey" FOREIGN KEY ("A") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductSolutions" ADD CONSTRAINT "_ProductSolutions_B_fkey" FOREIGN KEY ("B") REFERENCES "solutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductTechnologies" ADD CONSTRAINT "_ProductTechnologies_A_fkey" FOREIGN KEY ("A") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductTechnologies" ADD CONSTRAINT "_ProductTechnologies_B_fkey" FOREIGN KEY ("B") REFERENCES "technologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceProjects" ADD CONSTRAINT "_ServiceProjects_A_fkey" FOREIGN KEY ("A") REFERENCES "portfolio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceProjects" ADD CONSTRAINT "_ServiceProjects_B_fkey" FOREIGN KEY ("B") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SolutionProjects" ADD CONSTRAINT "_SolutionProjects_A_fkey" FOREIGN KEY ("A") REFERENCES "portfolio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SolutionProjects" ADD CONSTRAINT "_SolutionProjects_B_fkey" FOREIGN KEY ("B") REFERENCES "solutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductProjects" ADD CONSTRAINT "_ProductProjects_A_fkey" FOREIGN KEY ("A") REFERENCES "portfolio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductProjects" ADD CONSTRAINT "_ProductProjects_B_fkey" FOREIGN KEY ("B") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectTechnologies" ADD CONSTRAINT "_ProjectTechnologies_A_fkey" FOREIGN KEY ("A") REFERENCES "portfolio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectTechnologies" ADD CONSTRAINT "_ProjectTechnologies_B_fkey" FOREIGN KEY ("B") REFERENCES "technologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceCaseStudies" ADD CONSTRAINT "_ServiceCaseStudies_A_fkey" FOREIGN KEY ("A") REFERENCES "case_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceCaseStudies" ADD CONSTRAINT "_ServiceCaseStudies_B_fkey" FOREIGN KEY ("B") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductCaseStudies" ADD CONSTRAINT "_ProductCaseStudies_A_fkey" FOREIGN KEY ("A") REFERENCES "case_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductCaseStudies" ADD CONSTRAINT "_ProductCaseStudies_B_fkey" FOREIGN KEY ("B") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IndustryCaseStudies" ADD CONSTRAINT "_IndustryCaseStudies_A_fkey" FOREIGN KEY ("A") REFERENCES "case_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IndustryCaseStudies" ADD CONSTRAINT "_IndustryCaseStudies_B_fkey" FOREIGN KEY ("B") REFERENCES "industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogPostServices" ADD CONSTRAINT "_BlogPostServices_A_fkey" FOREIGN KEY ("A") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogPostServices" ADD CONSTRAINT "_BlogPostServices_B_fkey" FOREIGN KEY ("B") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogPostProducts" ADD CONSTRAINT "_BlogPostProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogPostProducts" ADD CONSTRAINT "_BlogPostProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RelatedPosts" ADD CONSTRAINT "_RelatedPosts_A_fkey" FOREIGN KEY ("A") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RelatedPosts" ADD CONSTRAINT "_RelatedPosts_B_fkey" FOREIGN KEY ("B") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

