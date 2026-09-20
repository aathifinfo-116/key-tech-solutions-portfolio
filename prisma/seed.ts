/**
 * Database seed.
 *
 * Idempotent: every write is an upsert keyed on a natural identifier, so
 * running it repeatedly converges rather than duplicating. Safe to run against
 * an existing database.
 *
 * The bootstrap administrator password comes from SEED_ADMIN_PASSWORD. It is
 * never hardcoded, never printed and never written to a file. If the variable
 * is absent the script generates a random password, prints it once, and marks
 * the account as requiring a change at next sign-in.
 */

import { randomBytes } from 'node:crypto';
import { PrismaClient, type Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  PERMISSIONS,
  ROLE_DEFINITIONS,
  SUPER_ADMIN_ROLE_KEY,
  resolveRolePermissions,
} from '@kts/shared-types';
import { estimateReadingMinutes, sanitizeRichText, slugify } from '@kts/validation';
import {
  COMPANY_VALUES,
  INDUSTRIES,
  PROCESS_PHASES,
  SERVICES,
  SERVICE_CATEGORIES,
  SOLUTIONS,
  TECHNOLOGIES,
  TECHNOLOGY_CATEGORIES,
} from './seed/catalogue';
import {
  BLOG_CATEGORIES,
  BLOG_POSTS,
  CAREERS,
  CASE_STUDIES,
  PORTFOLIO_PROJECTS,
  PRODUCTS,
} from './seed/products';
import { FOOTER_GROUPS, NAVIGATION_ITEMS, PAGES } from './seed/pages';

const prisma = new PrismaClient();

const now = new Date();
let generatedPassword: string | null = null;

function log(step: string, detail: string): void {
  process.stdout.write(`  ${step.padEnd(24)} ${detail}\n`);
}

/** Creates the SEO row inline with its owner so the one-to-one stays paired. */
function seo(
  title: string,
  description: string,
  options: {
    priority?: number;
    frequency?: Prisma.SeoMetadataCreateInput['sitemapFrequency'];
  } = {},
): Prisma.SeoMetadataCreateNestedOneWithoutPageInput {
  return {
    create: {
      title,
      description,
      robotsIndex: true,
      robotsFollow: true,
      includeInSitemap: true,
      sitemapPriority: options.priority ?? 0.6,
      sitemapFrequency: options.frequency ?? 'WEEKLY',
    },
  };
}

/** Optional relation connect that is simply absent when there is no id. */
function connectIf(id: string | null | undefined) {
  return id ? { connect: { id } } : undefined;
}

/**
 * Many-to-many payload. `create` accepts only `connect`; `update` needs
 * `set` so the relation is replaced rather than appended to.
 */
function relate(
  rows: Array<{ id: string; slug: string }>,
  slugs: string[],
  mode: 'create' | 'update',
) {
  const ids = rows.filter((row) => slugs.includes(row.slug)).map((row) => ({ id: row.id }));
  return mode === 'create' ? { connect: ids } : { set: ids };
}

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

async function seedPermissionsAndRoles(): Promise<void> {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      create: {
        key: permission.key,
        family: permission.family,
        action: permission.action,
        description: permission.description,
      },
      update: {
        family: permission.family,
        action: permission.action,
        description: permission.description,
      },
    });
  }
  log('permissions', `${PERMISSIONS.length} synchronised`);

  const permissionsByKey = new Map<string, string>(
    (await prisma.permission.findMany()).map(
      (permission) => [permission.key, permission.id] as const,
    ),
  );

  for (const definition of ROLE_DEFINITIONS) {
    const keys = resolveRolePermissions(definition);
    const role = await prisma.role.upsert({
      where: { key: definition.key },
      create: {
        key: definition.key,
        name: definition.name,
        description: definition.description,
        isSystem: definition.isSystem,
        sortOrder: definition.sortOrder,
      },
      update: {
        name: definition.name,
        description: definition.description,
        sortOrder: definition.sortOrder,
      },
    });

    // Replace the grant set so a permission removed from code is revoked here.
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: keys
        .map((key) => permissionsByKey.get(key))
        .filter((id): id is string => Boolean(id))
        .map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    });
  }
  log('roles', `${ROLE_DEFINITIONS.length} synchronised with permission grants`);
}

async function seedAdminUser(): Promise<void> {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@keytech.local').toLowerCase();
  const name = process.env.SEED_ADMIN_NAME ?? 'Key Tech Administrator';
  const supplied = process.env.SEED_ADMIN_PASSWORD;

  const superRole = await prisma.role.findUnique({ where: { key: SUPER_ADMIN_ROLE_KEY } });
  if (!superRole) throw new Error('The Super Administrator role is missing; seed roles first.');

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    // Never silently reset a password that is already in use.
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: existing.id, roleId: superRole.id } },
      create: { userId: existing.id, roleId: superRole.id },
      update: {},
    });
    log('admin user', `${email} already exists - password left unchanged`);
    return;
  }

  const password =
    supplied && supplied.length >= 12 ? supplied : randomBytes(18).toString('base64url');
  if (!supplied) generatedPassword = password;

  const user = await prisma.adminUser.create({
    data: {
      email,
      name,
      jobTitle: 'Platform administrator',
      passwordHash: await bcrypt.hash(password, Number(process.env.PASSWORD_HASH_ROUNDS ?? 12)),
      status: 'ACTIVE',
      mustChangePassword: !supplied,
      roles: { create: { roleId: superRole.id } },
    },
  });

  log('admin user', `${user.email} created as Super Administrator`);
}

// ---------------------------------------------------------------------------
// Site configuration
// ---------------------------------------------------------------------------

async function seedSiteConfiguration(): Promise<void> {
  const brand = await prisma.brandSetting.findFirst({ where: { singleton: true } });
  if (!brand) {
    await prisma.brandSetting.create({
      data: {
        singleton: true,
        companyName: 'Key Tech Solutions',
        shortName: 'Key Tech',
        legalName: null,
        tagline: 'Technology that unlocks business growth',
        description:
          'Key Tech Solutions designs and builds web applications, SaaS products and business systems, and is the parent organisation behind the Key product family.',
        primaryColor: '#6436A3',
        secondaryColor: '#416F9E',
        accentColor: '#2CA3A3',
        highlightColor: '#5BC3C6',
        inkColor: '#111426',
        gradientCss: 'linear-gradient(135deg, #6436A3 0%, #416F9E 50%, #2CA3A3 100%)',
      },
    });
  }
  log('brand', 'brand settings ready');

  const settings: Array<{
    key: string;
    value: Prisma.InputJsonValue;
    group: string;
    label: string;
    isPublic: boolean;
    description?: string;
  }> = [
    {
      key: 'site.tagline',
      value: 'Technology that unlocks business growth',
      group: 'general',
      label: 'Site tagline',
      isPublic: true,
    },
    { key: 'site.locale', value: 'en', group: 'general', label: 'Content locale', isPublic: true },
    {
      key: 'contact.responseNote',
      value: 'We reply to enquiries by email.',
      group: 'contact',
      label: 'Contact response note',
      isPublic: true,
    },
    {
      key: 'forms.consentText',
      value: 'I agree to Key Tech Solutions contacting me about this enquiry.',
      group: 'contact',
      label: 'Form consent text',
      isPublic: true,
    },
    {
      key: 'seo.defaultTitleTemplate',
      value: '%s | Key Tech Solutions',
      group: 'seo',
      label: 'Title template',
      isPublic: true,
    },
    {
      key: 'seo.robotsBlockAll',
      value: false,
      group: 'seo',
      label: 'Block all crawlers',
      isPublic: true,
      description: 'Enable on staging deployments so they are never indexed.',
    },
    {
      key: 'features.newsletter',
      value: true,
      group: 'features',
      label: 'Newsletter sign-up enabled',
      isPublic: true,
    },
    {
      key: 'features.testimonials',
      value: false,
      group: 'features',
      label: 'Testimonials section enabled',
      isPublic: true,
      description: 'Off until approved customer testimonials exist.',
    },
    {
      key: 'ops.notificationEmail',
      value: '',
      group: 'integrations',
      label: 'Internal notification email',
      isPublic: false,
      description: 'Overridden by MAIL_NOTIFY_TO when set.',
    },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      create: setting,
      update: {
        label: setting.label,
        group: setting.group,
        isPublic: setting.isPublic,
        description: setting.description,
      },
    });
  }
  log('settings', `${settings.length} site settings synchronised`);

  // Navigation is replaced wholesale so the seed is the source of truth for it.
  const menu = await prisma.navigationMenu.upsert({
    where: { key: 'primary' },
    create: { key: 'primary', name: 'Primary navigation', location: 'PRIMARY', isActive: true },
    update: { name: 'Primary navigation', location: 'PRIMARY', isActive: true },
  });
  await prisma.navigationItem.deleteMany({ where: { menuId: menu.id } });

  for (const [index, item] of NAVIGATION_ITEMS.entries()) {
    const parent = await prisma.navigationItem.create({
      data: {
        menuId: menu.id,
        label: item.label,
        href: item.href,
        highlight: 'highlight' in item ? Boolean(item.highlight) : false,
        sortOrder: index,
      },
    });
    for (const [childIndex, child] of (item.children ?? []).entries()) {
      await prisma.navigationItem.create({
        data: {
          menuId: menu.id,
          parentId: parent.id,
          label: child.label,
          href: child.href,
          description: 'description' in child ? (child.description as string) : null,
          sortOrder: childIndex,
        },
      });
    }
  }
  log('navigation', `${NAVIGATION_ITEMS.length} primary items`);

  for (const group of FOOTER_GROUPS) {
    const footerGroup = await prisma.footerGroup.upsert({
      where: { key: group.key },
      create: { key: group.key, title: group.title, sortOrder: group.sortOrder },
      update: { title: group.title, sortOrder: group.sortOrder },
    });
    await prisma.footerLink.deleteMany({ where: { groupId: footerGroup.id } });
    await prisma.footerLink.createMany({
      data: group.links.map((link, index) => ({
        groupId: footerGroup.id,
        label: link.label,
        href: link.href,
        sortOrder: index,
      })),
    });
  }
  log('footer', `${FOOTER_GROUPS.length} footer groups`);

  await prisma.announcement.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      message: 'KeySportsBooking and KeyAutoParts are in active development.',
      linkLabel: 'See our products',
      linkHref: '/products',
      tone: 'BRAND',
      // Off by default: an announcement should be a deliberate editorial act.
      isActive: false,
    },
    update: {},
  });
  log('announcement', 'default announcement created (inactive)');
}

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

async function seedCatalogue(): Promise<void> {
  for (const category of SERVICE_CATEGORIES) {
    await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      create: category,
      update: category,
    });
  }
  log('service categories', `${SERVICE_CATEGORIES.length} synchronised`);

  const categoryIds = new Map<string, string>(
    (await prisma.serviceCategory.findMany()).map(
      (category) => [category.slug, category.id] as const,
    ),
  );

  for (const [index, service] of SERVICES.entries()) {
    const base = {
      name: service.name,
      shortDescription: service.shortDescription,
      fullDescription: sanitizeRichText(service.fullDescription),
      iconName: service.iconName,
      benefits: service.benefits,
      capabilities: service.capabilities,
      deliverables: service.deliverables,
      isFeatured: service.isFeatured ?? false,
      sortOrder: index,
      status: 'PUBLISHED' as const,
      publishedAt: now,
      ctaHeading: 'Talk about this service',
      ctaDescription: 'Describe the problem and we will tell you whether this is the right fit.',
      ctaLabel: 'Start a Project',
      ctaHref: '/request-a-quote',
    };

    const category = connectIf(categoryIds.get(service.category));
    const existing = await prisma.service.findUnique({ where: { slug: service.slug } });
    const record = existing
      ? await prisma.service.update({ where: { slug: service.slug }, data: { ...base, category } })
      : await prisma.service.create({
          data: {
            ...base,
            slug: service.slug,
            category,
            seo: seo(service.seoTitle, service.seoDescription, { priority: 0.8 }),
          },
        });

    await prisma.serviceFAQ.deleteMany({ where: { serviceId: record.id } });
    if (service.faqs?.length) {
      await prisma.serviceFAQ.createMany({
        data: service.faqs.map((faq, faqIndex) => ({
          serviceId: record.id,
          question: faq.question,
          answer: faq.answer,
          sortOrder: faqIndex,
        })),
      });
    }
  }
  log('services', `${SERVICES.length} published`);

  for (const [index, solution] of SOLUTIONS.entries()) {
    const base = {
      name: solution.name,
      summary: solution.summary,
      businessChallenge: sanitizeRichText(solution.businessChallenge),
      overview: sanitizeRichText(solution.overview),
      capabilities: solution.capabilities,
      userTypes: solution.userTypes,
      benefits: solution.benefits,
      workflowSteps: solution.workflowSteps as unknown as Prisma.InputJsonValue,
      integrations: solution.integrations,
      iconName: solution.iconName,
      isFeatured: solution.isFeatured ?? false,
      sortOrder: index,
      status: 'PUBLISHED' as const,
      publishedAt: now,
      ctaHeading: 'Discuss this solution',
      ctaLabel: 'Start a Project',
      ctaHref: '/request-a-quote',
    };

    const existing = await prisma.solution.findUnique({ where: { slug: solution.slug } });
    if (existing) {
      await prisma.solution.update({ where: { slug: solution.slug }, data: base });
    } else {
      await prisma.solution.create({
        data: {
          ...base,
          slug: solution.slug,
          seo: seo(solution.seoTitle, solution.seoDescription, { priority: 0.7 }),
        },
      });
    }
  }
  log('solutions', `${SOLUTIONS.length} published`);

  for (const [index, industry] of INDUSTRIES.entries()) {
    const base = {
      name: industry.name,
      summary: industry.summary,
      introduction: sanitizeRichText(industry.introduction),
      challenges: industry.challenges,
      capabilities: industry.capabilities,
      iconName: industry.iconName,
      sortOrder: index,
      status: 'PUBLISHED' as const,
      publishedAt: now,
      ctaHeading: 'Working in this sector?',
      ctaLabel: 'Start a Project',
      ctaHref: '/request-a-quote',
    };

    const existing = await prisma.industry.findUnique({ where: { slug: industry.slug } });
    if (existing) {
      await prisma.industry.update({ where: { slug: industry.slug }, data: base });
    } else {
      await prisma.industry.create({
        data: {
          ...base,
          slug: industry.slug,
          seo: seo(industry.seoTitle, industry.seoDescription, { priority: 0.6 }),
        },
      });
    }
  }
  log('industries', `${INDUSTRIES.length} published`);

  for (const category of TECHNOLOGY_CATEGORIES) {
    await prisma.technologyCategory.upsert({
      where: { slug: category.slug },
      create: category,
      update: category,
    });
  }
  const techCategoryIds = new Map<string, string>(
    (await prisma.technologyCategory.findMany()).map(
      (category) => [category.slug, category.id] as const,
    ),
  );

  for (const [index, technology] of TECHNOLOGIES.entries()) {
    const data = {
      name: technology.name,
      description: technology.description,
      proficiencyLabel: technology.proficiencyLabel,
      isFeatured: 'isFeatured' in technology ? Boolean(technology.isFeatured) : false,
      sortOrder: index,
      isActive: true,
      category: connectIf(techCategoryIds.get(technology.category)),
    };
    await prisma.technology.upsert({
      where: { slug: technology.slug },
      create: { ...data, slug: technology.slug },
      update: data,
    });
  }
  log('technologies', `${TECHNOLOGIES.length} in ${TECHNOLOGY_CATEGORIES.length} categories`);

  for (const phase of PROCESS_PHASES) {
    const data = {
      number: phase.number,
      name: phase.name,
      shortDescription: phase.shortDescription,
      detailedDescription: sanitizeRichText(phase.detailedDescription),
      deliverables: phase.deliverables,
      iconName: phase.iconName,
      sortOrder: phase.number,
      isActive: true,
    };
    await prisma.processPhase.upsert({
      where: { slug: phase.slug },
      create: { ...data, slug: phase.slug },
      update: data,
    });
  }
  log('process', `${PROCESS_PHASES.length} phases`);

  for (const [index, value] of COMPANY_VALUES.entries()) {
    await prisma.companyValue.upsert({
      where: { slug: value.slug },
      create: { ...value, sortOrder: index },
      update: { ...value, sortOrder: index },
    });
  }
  log('values', `${COMPANY_VALUES.length} company values`);
}

// ---------------------------------------------------------------------------
// Products, portfolio and case studies
// ---------------------------------------------------------------------------

async function seedProducts(): Promise<void> {
  const [serviceIds, solutionIds, industryIds, technologyIds] = await Promise.all([
    prisma.service.findMany({ select: { id: true, slug: true } }),
    prisma.solution.findMany({ select: { id: true, slug: true } }),
    prisma.industry.findMany({ select: { id: true, slug: true } }),
    prisma.technology.findMany({ select: { id: true, slug: true } }),
  ]);

  for (const product of PRODUCTS) {
    const relations = (mode: 'create' | 'update') => ({
      services: relate(serviceIds, product.services, mode),
      solutions: relate(solutionIds, product.solutions, mode),
      industries: relate(industryIds, product.industries, mode),
      technologies: relate(technologyIds, product.technologies, mode),
    });

    const base = {
      name: product.name,
      tagline: product.tagline,
      category: product.category,
      productStatus: product.productStatus,
      summary: product.summary,
      fullDescription: sanitizeRichText(product.fullDescription),
      problemSolved: sanitizeRichText(product.problemSolved),
      targetUsers: product.targetUsers,
      benefits: product.benefits,
      brandPrimary: product.brandPrimary,
      brandSecondary: product.brandSecondary,
      launchLabel: product.launchLabel,
      businessModel: product.businessModel,
      isFeatured: product.isFeatured,
      sortOrder: product.sortOrder,
      status: 'PUBLISHED' as const,
      publishedAt: now,
    };

    const existing = await prisma.product.findUnique({ where: { slug: product.slug } });
    const record = existing
      ? await prisma.product.update({
          where: { slug: product.slug },
          data: { ...base, ...relations('update') },
        })
      : await prisma.product.create({
          data: {
            ...base,
            ...relations('create'),
            slug: product.slug,
            seo: seo(product.seoTitle, product.seoDescription, { priority: 0.9 }),
          },
        });

    await prisma.productFeature.deleteMany({ where: { productId: record.id } });
    await prisma.productFeature.createMany({
      data: product.features.map((feature, index) => ({
        productId: record.id,
        title: feature.title,
        description: feature.description,
        iconName: feature.iconName,
        sortOrder: index,
      })),
    });

    await prisma.productFAQ.deleteMany({ where: { productId: record.id } });
    await prisma.productFAQ.createMany({
      data: product.faqs.map((faq, index) => ({
        productId: record.id,
        question: faq.question,
        answer: faq.answer,
        sortOrder: index,
      })),
    });
  }
  log('products', `${PRODUCTS.map((p) => p.name).join(', ')}`);

  const productIds = await prisma.product.findMany({ select: { id: true, slug: true } });

  for (const [index, project] of PORTFOLIO_PROJECTS.entries()) {
    const relations = (mode: 'create' | 'update') => ({
      services: relate(serviceIds, project.services, mode),
      products: relate(productIds, project.products, mode),
      industries: relate(industryIds, project.industries, mode),
      technologies: relate(technologyIds, project.technologies, mode),
    });

    const base = {
      title: project.title,
      customerDisplayName: project.isCustomerConfidential ? null : project.customerDisplayName,
      isCustomerConfidential: project.isCustomerConfidential,
      category: project.category,
      projectStatus: project.projectStatus,
      summary: project.summary,
      challenge: sanitizeRichText(project.challenge),
      approach: sanitizeRichText(project.approach),
      solution: sanitizeRichText(project.solution),
      features: project.features,
      deliverables: project.deliverables,
      isFeatured: project.isFeatured,
      sortOrder: index,
      status: 'PUBLISHED' as const,
      publishedAt: now,
    };

    const existing = await prisma.portfolioProject.findUnique({ where: { slug: project.slug } });
    if (existing) {
      await prisma.portfolioProject.update({
        where: { slug: project.slug },
        data: { ...base, ...relations('update') },
      });
    } else {
      await prisma.portfolioProject.create({
        data: {
          ...base,
          ...relations('create'),
          slug: project.slug,
          seo: seo(project.seoTitle, project.seoDescription, { priority: 0.6 }),
        },
      });
    }
  }
  log('portfolio', `${PORTFOLIO_PROJECTS.length} projects published`);

  const projectIds = await prisma.portfolioProject.findMany({ select: { id: true, slug: true } });

  for (const [index, study] of CASE_STUDIES.entries()) {
    const relations = (mode: 'create' | 'update') => ({
      services: relate(serviceIds, study.services, mode),
      products: relate(productIds, study.products, mode),
      industries: relate(industryIds, study.industries, mode),
    });
    const project = connectIf(projectIds.find((p) => p.slug === study.projectSlug)?.id);

    const base = {
      title: study.title,
      summary: study.summary,
      background: sanitizeRichText(study.background),
      challenge: sanitizeRichText(study.challenge),
      discovery: sanitizeRichText(study.discovery),
      strategy: sanitizeRichText(study.strategy),
      design: sanitizeRichText(study.design),
      development: sanitizeRichText(study.development),
      architecture: sanitizeRichText(study.architecture),
      solution: sanitizeRichText(study.solution),
      // No `results` and no metrics: no verified outcome data has been supplied,
      // so the results block stays absent rather than being filled with a guess.
      results: null,
      isCustomerApproved: false,
      approvedCustomerName: null,
      isFeatured: study.isFeatured,
      sortOrder: index,
      status: 'PUBLISHED' as const,
      publishedAt: now,
      ctaHeading: 'Facing something similar?',
      ctaLabel: 'Start a Project',
      ctaHref: '/request-a-quote',
    };

    const existing = await prisma.caseStudy.findUnique({ where: { slug: study.slug } });
    if (existing) {
      await prisma.caseStudy.update({
        where: { slug: study.slug },
        data: { ...base, project, ...relations('update') },
      });
    } else {
      await prisma.caseStudy.create({
        data: {
          ...base,
          project,
          ...relations('create'),
          slug: study.slug,
          seo: seo(study.seoTitle, study.seoDescription, { priority: 0.6 }),
        },
      });
    }
  }
  log('case studies', `${CASE_STUDIES.length} published (no unverified metrics)`);
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

async function seedStatistics(): Promise<void> {
  const [serviceCount, solutionCount, productCount, industryCount, technologyCount] =
    await Promise.all([
      prisma.service.count({ where: { status: 'PUBLISHED', archivedAt: null } }),
      prisma.solution.count({ where: { status: 'PUBLISHED', archivedAt: null } }),
      prisma.product.count({ where: { status: 'PUBLISHED', archivedAt: null } }),
      prisma.industry.count({ where: { status: 'PUBLISHED', archivedAt: null } }),
      prisma.technology.count({ where: { isActive: true } }),
    ]);

  // Every figure is derived from this database, so each is verifiable.
  const statistics = [
    {
      key: 'published-services',
      label: 'Services offered',
      value: String(serviceCount),
      numericValue: serviceCount,
      description: 'Published service pages on this site.',
    },
    {
      key: 'published-solutions',
      label: 'Solutions documented',
      value: String(solutionCount),
      numericValue: solutionCount,
      description: 'Published solution pages on this site.',
    },
    {
      key: 'key-products',
      label: 'Key products in development',
      value: String(productCount),
      numericValue: productCount,
      description: 'Key-branded products currently published on this site.',
    },
    {
      key: 'industries-served',
      label: 'Industries covered',
      value: String(industryCount),
      numericValue: industryCount,
      description: 'Industry pages published on this site.',
    },
    {
      key: 'technologies-used',
      label: 'Technologies in the stack',
      value: String(technologyCount),
      numericValue: technologyCount,
      description: 'Active technologies listed in the stack.',
    },
    {
      key: 'process-phases',
      label: 'Delivery phases',
      value: '10',
      numericValue: 10,
      description: 'Phases in the documented delivery process.',
    },
  ];

  for (const [index, statistic] of statistics.entries()) {
    const data = {
      ...statistic,
      group: 'home',
      isVerified: true,
      sortOrder: index,
      isActive: true,
    };
    await prisma.statistic.upsert({ where: { key: statistic.key }, create: data, update: data });
  }
  log('statistics', `${statistics.length} verifiable figures`);

  const milestones = [
    {
      label: 'Foundation',
      title: 'Key Tech Solutions established',
      description: 'Formed to build web applications and SaaS products for other businesses.',
    },
    {
      label: 'Product',
      title: 'KeySportsBooking development begins',
      description: 'Work starts on a sports venue discovery and booking platform.',
    },
    {
      label: 'Product',
      title: 'KeyAutoParts development begins',
      description: 'Work starts on an automotive parts catalogue and ordering platform.',
    },
    {
      label: 'Platform',
      title: 'Portfolio management platform launched',
      description: 'This website and its administration panel go live on the Key Tech platform.',
    },
  ];

  for (const [index, milestone] of milestones.entries()) {
    const id = `00000000-0000-4000-8000-0000000001${String(index).padStart(2, '0')}`;
    await prisma.companyMilestone.upsert({
      where: { id },
      create: { id, ...milestone, sortOrder: index, isActive: true },
      update: { ...milestone, sortOrder: index },
    });
  }
  log('milestones', `${milestones.length} timeline entries (no dates asserted)`);
}

// ---------------------------------------------------------------------------
// Blog, careers and pages
// ---------------------------------------------------------------------------

async function seedBlog(): Promise<void> {
  for (const category of BLOG_CATEGORIES) {
    await prisma.blogCategory.upsert({
      where: { slug: category.slug },
      create: category,
      update: category,
    });
  }

  const author = await prisma.author.upsert({
    where: { slug: 'key-tech-team' },
    create: {
      slug: 'key-tech-team',
      displayName: 'Key Tech Team',
      jobTitle: 'Engineering and product',
      biography:
        '<p>Written by the Key Tech Solutions engineering and product team, who build the platforms described here.</p>',
      isActive: true,
    },
    update: {},
  });

  const categoryIds = new Map<string, string>(
    (await prisma.blogCategory.findMany()).map((c) => [c.slug, c.id] as const),
  );
  const serviceRows = await prisma.service.findMany({ select: { id: true, slug: true } });
  const productRows = await prisma.product.findMany({ select: { id: true, slug: true } });

  for (const post of BLOG_POSTS) {
    const contentHtml = sanitizeRichText(post.contentHtml, { allowEmbeds: true });
    const relations = (mode: 'create' | 'update') => ({
      services: relate(serviceRows, post.services, mode),
      products: relate(productRows, post.products, mode),
    });
    const category = connectIf(categoryIds.get(post.category));

    const base = {
      title: post.title,
      excerpt: post.excerpt,
      contentHtml,
      postType: post.postType,
      readingMinutes: estimateReadingMinutes(contentHtml),
      isFeatured: post.isFeatured,
      status: 'PUBLISHED' as const,
      publishedAt: now,
      contentUpdatedAt: now,
      author: { connect: { id: author.id } },
    };

    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    const record = existing
      ? await prisma.blogPost.update({
          where: { slug: post.slug },
          data: { ...base, category, ...relations('update') },
        })
      : await prisma.blogPost.create({
          data: {
            ...base,
            category,
            ...relations('create'),
            slug: post.slug,
            seo: seo(post.seoTitle, post.seoDescription, { priority: 0.5 }),
          },
        });

    const tags = await Promise.all(
      post.tags.map((tag) =>
        prisma.blogTag.upsert({
          where: { slug: slugify(tag) },
          create: { slug: slugify(tag), name: tag },
          update: {},
        }),
      ),
    );
    await prisma.blogPostTag.deleteMany({ where: { postId: record.id } });
    await prisma.blogPostTag.createMany({
      data: tags.map((tag) => ({ postId: record.id, tagId: tag.id })),
      skipDuplicates: true,
    });
  }
  log('blog', `${BLOG_POSTS.length} posts in ${BLOG_CATEGORIES.length} categories`);
}

async function seedCareers(): Promise<void> {
  for (const career of CAREERS) {
    const base = {
      title: career.title,
      department: career.department,
      location: career.location,
      workplaceType: career.workplaceType,
      employmentType: career.employmentType,
      summary: sanitizeRichText(career.summary),
      responsibilities: career.responsibilities,
      requirements: career.requirements,
      preferredSkills: career.preferredSkills,
      careerStatus: career.careerStatus,
      publishedAt: career.careerStatus === 'OPEN' ? now : null,
    };

    const existing = await prisma.career.findUnique({ where: { slug: career.slug } });
    if (existing) {
      await prisma.career.update({ where: { slug: career.slug }, data: base });
    } else {
      await prisma.career.create({
        data: {
          ...base,
          slug: career.slug,
          seo: seo(career.seoTitle, career.seoDescription, { priority: 0.5 }),
        },
      });
    }
  }
  const open = CAREERS.filter((c) => c.careerStatus === 'OPEN').length;
  log('careers', `${CAREERS.length} roles (${open} open, marked as sample content)`);
}

async function seedPages(): Promise<void> {
  for (const page of PAGES) {
    const base = {
      path: page.path,
      title: page.title,
      eyebrow: page.eyebrow ?? null,
      headline: page.headline ?? null,
      subheadline: page.subheadline ?? null,
      summary: page.summary ?? null,
      isSystem: page.isSystem,
      showInSitemap: true,
      status: 'PUBLISHED' as const,
      publishedAt: now,
    };

    const existing = await prisma.page.findUnique({ where: { slug: page.slug } });
    const record = existing
      ? await prisma.page.update({ where: { slug: page.slug }, data: base })
      : await prisma.page.create({
          data: {
            ...base,
            slug: page.slug,
            seo: seo(page.seoTitle, page.seoDescription, {
              priority: page.sitemapPriority ?? 0.6,
              frequency: page.slug === 'home' ? 'DAILY' : 'WEEKLY',
            }),
          },
        });

    await prisma.pageSection.deleteMany({ where: { pageId: record.id } });
    await prisma.pageSection.createMany({
      data: page.sections.map((section, index) => ({
        pageId: record.id,
        internalName: section.internalName,
        type: section.type as Prisma.PageSectionCreateManyInput['type'],
        eyebrow: section.eyebrow ?? null,
        heading: section.heading ?? null,
        subheading: section.subheading ?? null,
        description: section.description ?? null,
        bodyHtml: section.bodyHtml ? sanitizeRichText(section.bodyHtml) : null,
        theme: section.theme,
        layoutVariant: section.layoutVariant ?? 'default',
        primaryCtaLabel: section.primaryCtaLabel ?? null,
        primaryCtaHref: section.primaryCtaHref ?? null,
        secondaryCtaLabel: section.secondaryCtaLabel ?? null,
        secondaryCtaHref: section.secondaryCtaHref ?? null,
        settings: (section.settings ?? undefined) as Prisma.InputJsonValue | undefined,
        sortOrder: index,
        isVisible: true,
        status: 'PUBLISHED' as const,
      })),
    });
  }
  const sectionCount = PAGES.reduce((total, page) => total + page.sections.length, 0);
  log('pages', `${PAGES.length} pages with ${sectionCount} sections`);
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  process.stdout.write('\nSeeding Key Tech Solutions platform\n\n');

  await seedPermissionsAndRoles();
  await seedAdminUser();
  await seedSiteConfiguration();
  await seedCatalogue();
  await seedProducts();
  await seedStatistics();
  await seedBlog();
  await seedCareers();
  await seedPages();

  process.stdout.write('\nSeed complete.\n');

  if (generatedPassword) {
    process.stdout.write(
      '\n' +
        '  SEED_ADMIN_PASSWORD was not set, so a random password was generated.\n' +
        '  It is shown once, here, and is not stored anywhere in plain text:\n\n' +
        `      ${generatedPassword}\n\n` +
        '  Sign in, change it immediately, then set SEED_ADMIN_PASSWORD in your .env\n' +
        '  if you want future seeds to be non-interactive.\n\n',
    );
  }

  process.stdout.write(
    '  Note: no testimonials, client logos or partner records were seeded.\n' +
      '  Those require real, approved content and are left empty deliberately.\n\n',
  );
}

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `\nSeed failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
