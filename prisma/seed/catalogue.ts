/**
 * Catalogue seed data.
 *
 * Everything here describes capabilities Key Tech Solutions offers, or the
 * Key-branded products it is building. Nothing asserts a customer, an outcome,
 * a metric, a partnership or a certification, because none has been supplied.
 * Copy that is illustrative rather than factual carries the sample marker.
 */

export interface ServiceCategorySeed {
  slug: string;
  name: string;
  description: string;
  iconName: string;
  accentColor: string;
  sortOrder: number;
}

export const SERVICE_CATEGORIES: ServiceCategorySeed[] = [
  {
    slug: 'product-engineering',
    name: 'Product Engineering',
    description: 'Designing and building web applications and SaaS products from first principles.',
    iconName: 'cube',
    accentColor: '#6436A3',
    sortOrder: 0,
  },
  {
    slug: 'business-systems',
    name: 'Business Systems',
    description:
      'Operational software that replaces spreadsheets, paperwork and manual coordination.',
    iconName: 'workflow',
    accentColor: '#416F9E',
    sortOrder: 1,
  },
  {
    slug: 'commerce-and-marketplaces',
    name: 'Commerce and Marketplaces',
    description:
      'Selling, listing and fulfilment platforms, including parts and inventory catalogues.',
    iconName: 'store',
    accentColor: '#2CA3A3',
    sortOrder: 2,
  },
  {
    slug: 'platform-and-integration',
    name: 'Platform and Integration',
    description:
      'APIs, databases, integrations and cloud-ready architecture underneath the product.',
    iconName: 'plug',
    accentColor: '#5BC3C6',
    sortOrder: 3,
  },
  {
    slug: 'experience-and-growth',
    name: 'Experience and Growth',
    description: 'Interface design, search-visible websites and performance work that compounds.',
    iconName: 'sparkles',
    accentColor: '#6436A3',
    sortOrder: 4,
  },
  {
    slug: 'run-and-support',
    name: 'Run and Support',
    description: 'Keeping delivered software correct, current and supported after launch.',
    iconName: 'lifebuoy',
    accentColor: '#416F9E',
    sortOrder: 5,
  },
];

export interface ServiceSeed {
  slug: string;
  name: string;
  category: string;
  iconName: string;
  shortDescription: string;
  fullDescription: string;
  benefits: string[];
  capabilities: string[];
  deliverables: string[];
  isFeatured?: boolean;
  faqs?: Array<{ question: string; answer: string }>;
  seoTitle: string;
  seoDescription: string;
}

export const SERVICES: ServiceSeed[] = [
  {
    slug: 'custom-web-application-development',
    name: 'Custom Web Application Development',
    category: 'product-engineering',
    iconName: 'code',
    isFeatured: true,
    shortDescription:
      'Web applications built around how your business actually works, rather than around a template.',
    fullDescription:
      "<p>Off-the-shelf software forces a business to bend around someone else's assumptions. A custom application does the opposite: the data model, the screens and the permissions follow your real process.</p><p>We start by mapping the work as it is done today, including the exceptions people handle informally. That map becomes the specification. From there we design the interface, model the database, build the application and hand over something your team can operate without us in the room.</p>",
    benefits: [
      'The software matches your process instead of the other way round',
      'One source of truth instead of spreadsheets and email threads',
      'Room to grow: new modules attach to the same data model',
      'You own the code, the data and the deployment',
    ],
    capabilities: [
      'Requirement discovery and process mapping',
      'Information architecture and data modelling',
      'Role based access control',
      'Responsive interfaces for desktop and mobile',
      'Reporting and export',
      'Audit trails and change history',
    ],
    deliverables: [
      'Requirement and scope document',
      'Interface designs and a clickable prototype',
      'Database schema with migrations',
      'The application, deployed to your environment',
      'Administrator and user documentation',
      'Handover session and support window',
    ],
    faqs: [
      {
        question: 'How do you scope a project before the requirements are fully known?',
        answer:
          'We run a paid discovery phase first. It produces a written scope, a data model and interface designs. You can take that away and build it anywhere; if you continue with us, it becomes the plan.',
      },
      {
        question: 'Who owns the source code?',
        answer:
          'You do. The repository, the database schema and the deployment configuration are handed over as part of the project.',
      },
    ],
    seoTitle: 'Custom Web Application Development',
    seoDescription:
      'Key Tech Solutions designs and builds custom web applications around your real business process, from discovery and data modelling through to deployment and handover.',
  },
  {
    slug: 'saas-product-development',
    name: 'SaaS Product Development',
    category: 'product-engineering',
    iconName: 'layers',
    isFeatured: true,
    shortDescription:
      'Multi-tenant products with the subscription, onboarding and administration plumbing already thought through.',
    fullDescription:
      '<p>A SaaS product is not just an application with a login screen. It needs tenant isolation, a self-service onboarding path, plan and usage handling, an administration console, and a release process that does not take the whole product down.</p><p>We build those foundations first, because retrofitting them is expensive. Key Tech Solutions runs its own Key-branded products on the same patterns we use for client work.</p>',
    benefits: [
      'Tenant isolation designed in, not bolted on',
      'Self-service sign up and onboarding',
      'An administration console for your own team from day one',
      'A release process that supports frequent, low-risk deployment',
    ],
    capabilities: [
      'Multi-tenant data architecture',
      'Subscription, plan and usage modelling',
      'Onboarding and trial flows',
      'Tenant administration and support tooling',
      'Feature flags and staged rollout',
      'Usage reporting',
    ],
    deliverables: [
      'Product architecture and tenancy model',
      'Design system and application interface',
      'Working product with administration console',
      'Deployment pipeline and environments',
      'Operational runbook',
    ],
    faqs: [
      {
        question: 'Do you work on early-stage products or only established ones?',
        answer:
          'Both. For an early-stage product we usually recommend a narrow first release that proves the core workflow, then expand from real usage rather than from a long specification.',
      },
    ],
    seoTitle: 'SaaS Product Development',
    seoDescription:
      'Multi-tenant SaaS product development by Key Tech Solutions: tenancy architecture, onboarding, subscription modelling, administration consoles and a release process built for frequent delivery.',
  },
  {
    slug: 'business-process-automation',
    name: 'Business Process Automation',
    category: 'business-systems',
    iconName: 'workflow',
    isFeatured: true,
    shortDescription:
      'Replacing the manual steps between systems with software that does them reliably, every time.',
    fullDescription:
      '<p>Most operational pain is not one broken system. It is the gap between systems: the re-keying, the chasing, the spreadsheet somebody maintains by hand.</p><p>We find those gaps, decide which are worth automating, and build the workflow, the approvals and the exception handling that make automation safe to trust.</p>',
    benefits: [
      'Fewer manual handoffs and fewer transcription errors',
      'Work that is visible and traceable rather than sitting in an inbox',
      'Exceptions surfaced instead of silently skipped',
      'Staff time moved from data entry to judgement',
    ],
    capabilities: [
      'Process mapping and bottleneck analysis',
      'Approval and review workflows',
      'Scheduled and event-driven jobs',
      'Notification and escalation rules',
      'Document generation',
      'Exception queues and manual overrides',
    ],
    deliverables: [
      'Current-state and target-state process maps',
      'Automation design with exception handling',
      'The implemented workflow',
      'Monitoring and alerting',
      'Team training',
    ],
    seoTitle: 'Business Process Automation',
    seoDescription:
      'Key Tech Solutions maps operational processes, then builds the workflows, approvals and exception handling that remove manual steps without losing control.',
  },
  {
    slug: 'booking-and-reservation-platforms',
    name: 'Booking and Reservation Platforms',
    category: 'business-systems',
    iconName: 'calendar',
    isFeatured: true,
    shortDescription:
      'Availability, reservations, cancellations and venue administration - the parts that are harder than they look.',
    fullDescription:
      '<p>Booking software looks simple until you meet double bookings, partial-hour slots, recurring blocks, cancellation windows, deposits and staff overrides. Getting those right is most of the work.</p><p>We build booking platforms around a correct availability model first, then layer the customer-facing and administrative experiences on top. KeySportsBooking is our own product in this space.</p>',
    benefits: [
      'An availability model that cannot double book',
      'Customer self-service that reduces phone and message traffic',
      'Administrative override for the cases software cannot predict',
      'A record of every reservation change',
    ],
    capabilities: [
      'Availability and slot modelling',
      'Recurring and blocked periods',
      'Reservation, amendment and cancellation flows',
      'Deposit and payment evidence workflows',
      'Venue and resource administration',
      'Notifications and reminders',
    ],
    deliverables: [
      'Availability and booking data model',
      'Customer booking interface',
      'Venue administration console',
      'Notification templates',
      'Operational documentation',
    ],
    faqs: [
      {
        question: 'Can you integrate with an existing payment provider?',
        answer:
          'Yes. We integrate with the provider you already use, or advise on options if you have not chosen one. Payment handling is scoped per project.',
      },
    ],
    seoTitle: 'Booking and Reservation Platform Development',
    seoDescription:
      'Booking and reservation platforms built on a correct availability model: slots, recurring blocks, cancellations, deposits and venue administration.',
  },
  {
    slug: 'ecommerce-and-marketplace-development',
    name: 'E-commerce and Marketplace Development',
    category: 'commerce-and-marketplaces',
    iconName: 'store',
    shortDescription:
      'Catalogues, carts, checkout and multi-seller marketplaces, built for the catalogue you actually have.',
    fullDescription:
      '<p>A parts catalogue is not a fashion catalogue. Fitment data, supersessions, cross-references and unit-of-measure rules change what the product model has to support.</p><p>We build commerce platforms around the catalogue and the buying behaviour that go with it, rather than forcing a generic store template to cope.</p>',
    benefits: [
      'A product model that fits your catalogue, including its awkward parts',
      'Search and filtering that reflect how buyers actually look for items',
      'Multi-seller support where the business needs it',
      'Clean separation between catalogue, pricing and stock',
    ],
    capabilities: [
      'Catalogue and variant modelling',
      'Search, faceting and filtering',
      'Cart and checkout flows',
      'Multi-seller listings and order routing',
      'Pricing rules and customer-specific pricing',
      'Order management',
    ],
    deliverables: [
      'Catalogue data model',
      'Storefront and checkout',
      'Seller or administrator console',
      'Order management workflow',
      'Import tooling for existing catalogue data',
    ],
    seoTitle: 'E-commerce and Marketplace Development',
    seoDescription:
      'E-commerce and multi-seller marketplace development for catalogues with real complexity - fitment data, variants, pricing rules and order routing.',
  },
  {
    slug: 'inventory-and-operations-systems',
    name: 'Inventory and Operations Systems',
    category: 'business-systems',
    iconName: 'boxes',
    shortDescription:
      'Stock, movements, locations and reordering, accurate enough to make decisions from.',
    fullDescription:
      '<p>Inventory software earns its keep only when the numbers are trusted. That means modelling movements rather than balances, recording who changed what, and making stock takes easy enough that they actually happen.</p>',
    benefits: [
      'Stock figures people are willing to act on',
      'Movement history instead of unexplained adjustments',
      'Reorder signals before a shortage becomes urgent',
      'Multi-location visibility',
    ],
    capabilities: [
      'Item, variant and unit-of-measure modelling',
      'Movement and adjustment ledgers',
      'Multi-location and bin management',
      'Reorder points and purchase suggestions',
      'Stock take and reconciliation',
      'Operational reporting',
    ],
    deliverables: [
      'Inventory data model',
      'Stock management interface',
      'Movement and audit reporting',
      'Import and migration tooling',
      'Team training',
    ],
    seoTitle: 'Inventory and Operations System Development',
    seoDescription:
      'Inventory and operations systems built on movement ledgers, multi-location stock, reorder signals and reconciliation that teams actually use.',
  },
  {
    slug: 'automotive-parts-platforms',
    name: 'Automotive Parts Platforms',
    category: 'commerce-and-marketplaces',
    iconName: 'wrench',
    shortDescription:
      'Parts catalogues with fitment, cross-references and supersessions modelled properly.',
    fullDescription:
      '<p>Automotive parts have requirements a generic catalogue cannot express: which vehicles a part fits, which part supersedes which, what the equivalent is across brands, and how a buyer searches when they only know the registration.</p><p>KeyAutoParts is the Key Tech product in this space, and the same modelling work is available as a service.</p>',
    benefits: [
      'Buyers find the right part instead of the nearest-looking one',
      'Fewer returns caused by fitment mistakes',
      'Supersessions handled rather than left to tribal knowledge',
      'Supplier catalogues consolidated into one searchable index',
    ],
    capabilities: [
      'Fitment and application modelling',
      'Cross-reference and supersession handling',
      'Supplier catalogue import and normalisation',
      'Vehicle-first and part-number-first search',
      'Stock and availability across suppliers',
      'Quotation and enquiry workflows',
    ],
    deliverables: [
      'Parts and fitment data model',
      'Catalogue import pipeline',
      'Search and browse interfaces',
      'Administration console',
      'Data quality reporting',
    ],
    seoTitle: 'Automotive Parts Platform Development',
    seoDescription:
      'Automotive parts platforms with fitment, cross-reference and supersession modelling, supplier catalogue import and vehicle-first search.',
  },
  {
    slug: 'customer-portal-development',
    name: 'Customer Portal Development',
    category: 'business-systems',
    iconName: 'users',
    shortDescription: 'Self-service for your customers, and fewer routine requests for your team.',
    fullDescription:
      '<p>A portal is worth building when the same questions arrive repeatedly: where is my order, what did I agree to, can I change this booking, where is my invoice. Answering those in software is cheaper than answering them by hand.</p>',
    benefits: [
      'Routine requests answered without staff involvement',
      'A single place for documents, history and status',
      'Clear permissions between account holders and their users',
      'Fewer "can you resend that" emails',
    ],
    capabilities: [
      'Account and sub-user management',
      'Document and invoice access',
      'Order, booking and request history',
      'Self-service change requests',
      'Notification preferences',
    ],
    deliverables: [
      'Portal interface',
      'Account and permission model',
      'Integration with your existing systems',
      'Customer onboarding material',
    ],
    seoTitle: 'Customer Portal Development',
    seoDescription:
      'Customer portals that answer routine requests in software: account management, documents, history, self-service changes and clear permissions.',
  },
  {
    slug: 'admin-dashboard-development',
    name: 'Administration Dashboard Development',
    category: 'business-systems',
    iconName: 'gauge',
    shortDescription:
      'The internal console your team lives in, designed with the same care as the public product.',
    fullDescription:
      '<p>Internal tools are usually the last thing designed and the first thing complained about. A good administration console is fast to search, safe to act in, and honest about what changed and who changed it.</p>',
    benefits: [
      'Staff can find and fix things without a developer',
      'Destructive actions are guarded and reversible where possible',
      'Every change is attributable',
      'Permissions reflect real job roles',
    ],
    capabilities: [
      'Role and permission design',
      'Search, filtering and bulk actions',
      'Draft, review and publish workflows',
      'Audit logging',
      'Operational dashboards',
    ],
    deliverables: [
      'Permission matrix',
      'Administration interface',
      'Audit trail',
      'Role-based training material',
    ],
    seoTitle: 'Administration Dashboard Development',
    seoDescription:
      'Administration dashboards designed for the people who use them daily: fast search, guarded actions, role-based permissions and a complete audit trail.',
  },
  {
    slug: 'api-development-and-integration',
    name: 'API Development and Integration',
    category: 'platform-and-integration',
    iconName: 'plug',
    shortDescription:
      'Versioned APIs of your own, and reliable connections to the systems you already run.',
    fullDescription:
      '<p>Integrations fail in predictable ways: the other system is down, the payload changed, the same message arrives twice. We design for those cases rather than assuming the happy path.</p>',
    benefits: [
      'Integrations that survive the other side having a bad day',
      'Versioned contracts that do not break existing consumers',
      'Idempotent operations instead of duplicate records',
      'Clear error reporting when something does go wrong',
    ],
    capabilities: [
      'REST API design and versioning',
      'Authentication and rate limiting',
      'Webhook publishing and consumption',
      'Retry, backoff and idempotency handling',
      'Third-party integration',
      'API documentation',
    ],
    deliverables: [
      'API specification',
      'Implemented endpoints with tests',
      'Integration monitoring',
      'Developer documentation',
    ],
    seoTitle: 'API Development and Integration',
    seoDescription:
      'Versioned REST APIs and resilient third-party integrations: authentication, rate limiting, webhooks, retries and idempotency handled by design.',
  },
  {
    slug: 'postgresql-database-design',
    name: 'PostgreSQL Database Design',
    category: 'platform-and-integration',
    iconName: 'database',
    shortDescription: 'Schema design, indexing and migrations that keep working as the data grows.',
    fullDescription:
      '<p>Most application performance problems are database design problems wearing a different hat. We model the domain properly, index for the queries the application actually runs, and treat migrations as a first-class, reversible part of delivery.</p>',
    benefits: [
      'Queries that stay fast as row counts grow',
      'Constraints that make invalid data impossible rather than unlikely',
      'Migrations that can be reviewed and rolled forward safely',
      'A schema a new developer can read',
    ],
    capabilities: [
      'Relational modelling and normalisation',
      'Index and query plan analysis',
      'Migration strategy and tooling',
      'Partitioning and archival strategy',
      'Backup and recovery planning',
      'Least-privilege database roles',
    ],
    deliverables: [
      'Entity relationship model',
      'Migration set',
      'Index and query review',
      'Backup and recovery plan',
    ],
    seoTitle: 'PostgreSQL Database Design',
    seoDescription:
      'PostgreSQL schema design, indexing, migrations, backup planning and least-privilege roles for applications that need to stay fast as they grow.',
  },
  {
    slug: 'cloud-ready-application-development',
    name: 'Cloud-ready Application Development',
    category: 'platform-and-integration',
    iconName: 'cloud',
    shortDescription: 'Applications packaged, configured and observable enough to deploy anywhere.',
    fullDescription:
      '<p>"Cloud-ready" means something specific: configuration comes from the environment, the application is stateless where it can be, it starts and stops cleanly, and it tells you what it is doing.</p>',
    benefits: [
      'The same artefact runs in development, staging and production',
      'No secrets baked into an image',
      'Clean startup and shutdown behaviour',
      'Logs and health checks that support real operations',
    ],
    capabilities: [
      'Containerisation and multi-stage builds',
      'Environment-based configuration',
      'Health checks and graceful shutdown',
      'Structured logging',
      'Deployment pipelines',
    ],
    deliverables: [
      'Container images and compose or manifest files',
      'Environment configuration template',
      'Deployment pipeline',
      'Operational runbook',
    ],
    seoTitle: 'Cloud-ready Application Development',
    seoDescription:
      'Containerised, environment-configured applications with health checks, graceful shutdown, structured logging and a repeatable deployment pipeline.',
  },
  {
    slug: 'corporate-and-portfolio-websites',
    name: 'Corporate and Portfolio Websites',
    category: 'experience-and-growth',
    iconName: 'globe',
    shortDescription:
      'Server-rendered business websites with a content management system your team can actually run.',
    fullDescription:
      '<p>A business website has two audiences: the people reading it and the crawler indexing it. Both are served by the same thing - real content, rendered on the server, in a structure that makes sense.</p><p>We build websites with a content management system behind them, so pages, services, case studies and metadata are edited by your team rather than requested from a developer.</p>',
    benefits: [
      'Content edited by your team, not by a change request',
      'Server-rendered pages that crawlers can read without executing JavaScript',
      'Metadata, redirects and sitemap handled in the admin panel',
      'A design system, so new pages stay consistent',
    ],
    capabilities: [
      'Section-based page building',
      'Dynamic navigation and footer',
      'Metadata and structured data management',
      'Redirect management',
      'Media library with image optimisation',
      'Draft, review, schedule and publish workflow',
    ],
    deliverables: [
      'Design system and page templates',
      'Website with content management system',
      'SEO configuration and sitemap',
      'Editor documentation and training',
    ],
    seoTitle: 'Corporate and Portfolio Website Development',
    seoDescription:
      'Server-rendered corporate and portfolio websites with a real content management system: section-based pages, dynamic navigation, metadata control and redirects.',
  },
  {
    slug: 'seo-focused-development',
    name: 'SEO-focused Development',
    category: 'experience-and-growth',
    iconName: 'search',
    isFeatured: true,
    shortDescription:
      'The technical foundations of search visibility, built in rather than retrofitted.',
    fullDescription:
      '<p>Technical SEO is engineering work: server rendering, correct status codes, canonical URLs, structured data that matches the visible page, fast largest-contentful-paint, and a sitemap that reflects what is actually published.</p><p>We build those in from the start and give editors the controls to manage metadata without a deployment. What we cannot do is promise a ranking, and we will not pretend otherwise.</p>',
    benefits: [
      'Crawlable, server-rendered content on every public route',
      'Metadata and canonical URLs editors control themselves',
      'Structured data that matches what the page shows',
      'Automatic redirects when a published URL changes',
    ],
    capabilities: [
      'Server rendering and static generation',
      'Metadata and Open Graph management',
      'JSON-LD structured data',
      'Database-driven sitemap and robots rules',
      'Redirect management and slug-change handling',
      'Core Web Vitals work',
    ],
    deliverables: [
      'Technical SEO implementation',
      'Editorial SEO controls in the admin panel',
      'Sitemap and robots configuration',
      'Search Console setup guidance',
    ],
    faqs: [
      {
        question: 'Can you guarantee a first page ranking?',
        answer:
          'No, and nobody can. Search engines do not sell or promise positions. What we can do is remove the technical reasons a page fails to rank and make the content easy to crawl, index and understand.',
      },
    ],
    seoTitle: 'SEO-focused Web Development',
    seoDescription:
      'Technical SEO built into the application: server rendering, canonical URLs, structured data, database-driven sitemaps, redirect handling and Core Web Vitals work.',
  },
  {
    slug: 'ui-and-ux-design',
    name: 'UI and UX Design',
    category: 'experience-and-growth',
    iconName: 'palette',
    shortDescription:
      'Interface design grounded in the task, with a design system that keeps it consistent.',
    fullDescription:
      '<p>Design work here is not decoration applied at the end. It is deciding what goes on the screen, in what order, and what happens when something goes wrong - then expressing that as reusable tokens and components so the tenth screen looks like the first.</p>',
    benefits: [
      'Screens organised around the task, not the database table',
      'A token-based design system that survives new features',
      'Accessible by construction rather than by audit',
      'Fewer "which button do I press" support requests',
    ],
    capabilities: [
      'User flows and information architecture',
      'Wireframes and interactive prototypes',
      'Design tokens and component libraries',
      'Accessibility review against WCAG 2.2 AA practices',
      'Responsive layout design',
      'Motion and interaction design',
    ],
    deliverables: [
      'User flows and wireframes',
      'High-fidelity designs',
      'Design token set and component specifications',
      'Accessibility notes',
    ],
    seoTitle: 'UI and UX Design Services',
    seoDescription:
      'Interface design grounded in real tasks: user flows, prototypes, design tokens, component libraries, responsive layout and WCAG 2.2 AA accessibility practices.',
  },
  {
    slug: 'application-performance-optimization',
    name: 'Application Performance Optimization',
    category: 'run-and-support',
    iconName: 'zap',
    shortDescription: 'Measure, find the real bottleneck, fix that. No guessing.',
    fullDescription:
      '<p>Performance work starts with measurement, because the slow part is rarely the part people suspect. We profile the application, look at query plans, check what the browser actually downloads, and fix the largest cost first.</p>',
    benefits: [
      'Decisions driven by measurement rather than intuition',
      'Database and front-end costs addressed together',
      'Smaller JavaScript payloads and faster first render',
      'A repeatable way to catch regressions',
    ],
    capabilities: [
      'Front-end profiling and Core Web Vitals analysis',
      'Database query and index analysis',
      'N+1 query detection and removal',
      'Caching and revalidation strategy',
      'Image and asset optimisation',
      'Load testing',
    ],
    deliverables: [
      'Performance audit with measurements',
      'Prioritised remediation plan',
      'Implemented fixes with before and after figures',
      'Regression monitoring',
    ],
    seoTitle: 'Application Performance Optimization',
    seoDescription:
      'Measurement-led performance work: front-end profiling, Core Web Vitals, query plan analysis, N+1 removal, caching strategy and load testing.',
  },
  {
    slug: 'maintenance-and-technical-support',
    name: 'Maintenance and Technical Support',
    category: 'run-and-support',
    iconName: 'lifebuoy',
    shortDescription: 'Keeping delivered software patched, monitored and supported after launch.',
    fullDescription:
      '<p>Software does not stop needing attention at launch. Dependencies get security advisories, data grows, browsers change and requirements move. A maintenance arrangement keeps that work scheduled rather than urgent.</p>',
    benefits: [
      'Security patches applied on a schedule',
      'Backups verified rather than assumed',
      'A named route for problems',
      'Small improvements delivered continuously',
    ],
    capabilities: [
      'Dependency and security updates',
      'Monitoring and alerting',
      'Backup verification and recovery drills',
      'Incident response',
      'Small enhancement delivery',
      'Technical advisory',
    ],
    deliverables: [
      'Maintenance schedule',
      'Monitoring and alert configuration',
      'Change log and reporting',
      'Support process documentation',
    ],
    seoTitle: 'Application Maintenance and Technical Support',
    seoDescription:
      'Ongoing maintenance and support: scheduled security updates, monitoring, verified backups, incident response and continuous small improvements.',
  },
];

export interface SolutionSeed {
  slug: string;
  name: string;
  summary: string;
  businessChallenge: string;
  overview: string;
  capabilities: string[];
  userTypes: string[];
  benefits: string[];
  workflowSteps: Array<{ title: string; description: string }>;
  integrations: string[];
  iconName: string;
  isFeatured?: boolean;
  seoTitle: string;
  seoDescription: string;
}

export const SOLUTIONS: SolutionSeed[] = [
  {
    slug: 'sports-venue-booking',
    name: 'Sports Venue Booking',
    iconName: 'calendar',
    isFeatured: true,
    summary:
      'Let players find and reserve a court or pitch online, and give venue staff one place to manage the schedule.',
    businessChallenge:
      '<p>Venues lose bookings to the friction of arranging them: a phone call during opening hours, a message that goes unanswered, a paper diary only one person can read. Meanwhile staff spend the day confirming slots by hand and resolving clashes after the fact.</p>',
    overview:
      '<p>A booking solution replaces the diary with an availability model the software can reason about. Players see what is genuinely free and reserve it themselves. Staff keep the ability to block, move and override, but stop being the bottleneck for every routine reservation.</p>',
    capabilities: [
      'Venue, facility and slot configuration',
      'Real-time availability',
      'Self-service booking, amendment and cancellation',
      'Recurring bookings and blocked periods',
      'Deposit and payment evidence workflow',
      'Staff override and manual booking',
      'Automated confirmations and reminders',
    ],
    userTypes: ['Players and members', 'Venue staff', 'Venue owners', 'Platform administrators'],
    benefits: [
      'Bookings taken outside opening hours',
      'Clashes prevented by the availability model',
      'Less time on the phone confirming slots',
      'A complete history of every reservation change',
    ],
    workflowSteps: [
      {
        title: 'Configure',
        description: 'Set up venues, facilities, opening hours and slot rules.',
      },
      {
        title: 'Publish availability',
        description: 'The availability model derives what is actually bookable.',
      },
      {
        title: 'Book',
        description: 'Players reserve a slot and receive confirmation automatically.',
      },
      {
        title: 'Manage',
        description: 'Staff amend, block or override where the rules cannot decide.',
      },
      {
        title: 'Review',
        description: 'Utilisation and booking history are available to the venue.',
      },
    ],
    integrations: [
      'Payment providers',
      'Email and SMS delivery',
      'Calendar export',
      'Accounting exports',
    ],
    seoTitle: 'Sports Venue Booking Solution',
    seoDescription:
      'A sports venue booking solution: availability modelling, self-service reservations, recurring bookings, deposits, staff overrides and automated confirmations.',
  },
  {
    slug: 'automotive-parts-management',
    name: 'Automotive Parts Management',
    iconName: 'wrench',
    isFeatured: true,
    summary:
      'Bring supplier catalogues, fitment data and stock into one searchable place buyers and counter staff can trust.',
    businessChallenge:
      "<p>Parts businesses run on knowledge that lives in people's heads: which part supersedes which, what fits what, which supplier actually has it today. When that knowledge is not in the system, every enquiry costs an expert's time and every mistake costs a return.</p>",
    overview:
      '<p>This solution models fitment, cross-references and supersessions explicitly, then consolidates supplier catalogues into one index. Counter staff and online buyers search the same data and get the same answer.</p>',
    capabilities: [
      'Parts catalogue with variants and units of measure',
      'Vehicle fitment and application data',
      'Cross-reference and supersession chains',
      'Supplier catalogue import and normalisation',
      'Stock and availability across locations',
      'Enquiry and quotation workflow',
    ],
    userTypes: ['Counter staff', 'Online buyers', 'Workshops', 'Suppliers', 'Administrators'],
    benefits: [
      'Fitment answered by the system rather than by memory',
      'Fewer returns from incorrect parts',
      'Supplier catalogues consolidated into one search',
      'Quotations produced from live catalogue data',
    ],
    workflowSteps: [
      {
        title: 'Import',
        description: 'Supplier catalogues are imported and normalised into one model.',
      },
      { title: 'Enrich', description: 'Fitment, cross-references and supersessions are attached.' },
      { title: 'Search', description: 'Buyers search by vehicle, part number or cross-reference.' },
      {
        title: 'Quote or order',
        description: 'An enquiry becomes a quotation or an order with correct pricing.',
      },
      { title: 'Reconcile', description: 'Stock and supplier availability are kept current.' },
    ],
    integrations: [
      'Supplier catalogue feeds',
      'Accounting systems',
      'Payment providers',
      'Courier services',
    ],
    seoTitle: 'Automotive Parts Management Solution',
    seoDescription:
      'Automotive parts management with fitment data, cross-references, supersessions, supplier catalogue import, multi-location stock and quotation workflows.',
  },
  {
    slug: 'multi-tenant-saas',
    name: 'Multi-tenant SaaS',
    iconName: 'layers',
    summary:
      'The tenancy, onboarding and administration foundations a subscription product needs before its first customer.',
    businessChallenge:
      '<p>Products that start as a single-customer application and grow into a SaaS almost always hit the same wall: tenant data was never separated, onboarding was manual, and support has no way to act on one customer without touching the others.</p>',
    overview:
      '<p>This solution establishes the tenancy model, the onboarding path and the internal administration console up front, so the product can take its second, tenth and hundredth customer without a rewrite.</p>',
    capabilities: [
      'Tenant isolation at the data layer',
      'Self-service sign up and trials',
      'Plan, seat and usage modelling',
      'Tenant administration and impersonation controls',
      'Per-tenant configuration and branding',
      'Usage and billing exports',
    ],
    userTypes: [
      'Tenant administrators',
      'Tenant users',
      'Support staff',
      'Platform administrators',
    ],
    benefits: [
      'A second customer does not require a second deployment',
      'Support can act on one tenant safely',
      'Plan changes handled as data, not as code',
      'Usage visible per tenant',
    ],
    workflowSteps: [
      {
        title: 'Model tenancy',
        description: 'Decide isolation strategy and enforce it in the schema.',
      },
      { title: 'Build onboarding', description: 'Sign up, provisioning and first-run experience.' },
      {
        title: 'Add administration',
        description: 'Internal console for support and configuration.',
      },
      { title: 'Instrument', description: 'Usage measurement feeding plans and reporting.' },
    ],
    integrations: [
      'Payment and subscription providers',
      'Email delivery',
      'Analytics',
      'Support tooling',
    ],
    seoTitle: 'Multi-tenant SaaS Solution',
    seoDescription:
      'Multi-tenant SaaS foundations: tenant isolation, self-service onboarding, plan and usage modelling, tenant administration and per-tenant configuration.',
  },
  {
    slug: 'appointment-booking',
    name: 'Appointment Booking',
    iconName: 'clock',
    summary:
      'Scheduling for services delivered by people, where the constraint is staff availability rather than a room.',
    businessChallenge:
      '<p>When the bookable resource is a person, availability depends on shifts, skills, travel time and breaks. A simple calendar cannot express that, so staff end up managing it manually.</p>',
    overview:
      '<p>This solution models staff availability, service duration and the rules that connect them, so customers only see appointments that can actually be delivered.</p>',
    capabilities: [
      'Staff rosters and working patterns',
      'Service duration and buffer rules',
      'Skill-based matching',
      'Customer self-service booking and rescheduling',
      'Reminders and no-show handling',
      'Calendar synchronisation',
    ],
    userTypes: ['Customers', 'Practitioners and staff', 'Schedulers', 'Managers'],
    benefits: [
      'Only deliverable appointments are offered',
      'Rescheduling handled without a phone call',
      'Reminders reduce no-shows',
      'Utilisation visible per person',
    ],
    workflowSteps: [
      {
        title: 'Define services',
        description: 'Duration, buffers and required skills per service.',
      },
      { title: 'Set availability', description: 'Working patterns, leave and exceptions.' },
      { title: 'Book', description: 'Customers choose from genuinely available slots.' },
      {
        title: 'Remind and follow up',
        description: 'Automated reminders and post-appointment actions.',
      },
    ],
    integrations: ['Calendar providers', 'SMS and email delivery', 'Payment providers'],
    seoTitle: 'Appointment Booking Solution',
    seoDescription:
      'Appointment scheduling built around staff availability: rosters, service duration, skill matching, self-service rescheduling and automated reminders.',
  },
  {
    slug: 'inventory-control',
    name: 'Inventory Control',
    iconName: 'boxes',
    summary:
      'Movement-based stock control across locations, with reconciliation that people will actually do.',
    businessChallenge:
      '<p>Stock figures drift. Adjustments are made without explanation, locations disagree, and eventually nobody trusts the number enough to order from it.</p>',
    overview:
      '<p>Modelling movements rather than balances makes every change explicable. Combined with straightforward stock takes and clear reorder signals, the number becomes something the business can act on.</p>',
    capabilities: [
      'Movement ledger with reasons and attribution',
      'Multi-location and bin-level stock',
      'Reorder points and purchase suggestions',
      'Stock take and variance reporting',
      'Batch, serial and expiry tracking where required',
    ],
    userTypes: ['Warehouse staff', 'Purchasing', 'Finance', 'Operations managers'],
    benefits: [
      'Every change has a reason and an owner',
      'Variance reporting instead of silent adjustment',
      'Reorder before the shortage',
      'Location-level accuracy',
    ],
    workflowSteps: [
      { title: 'Receive', description: 'Goods in recorded against a purchase or transfer.' },
      { title: 'Move', description: 'Transfers between locations recorded as movements.' },
      { title: 'Issue', description: 'Stock consumed or dispatched, reducing availability.' },
      { title: 'Count', description: 'Stock takes reconcile physical and recorded quantities.' },
    ],
    integrations: [
      'Purchasing systems',
      'Accounting systems',
      'Barcode scanners',
      'E-commerce platforms',
    ],
    seoTitle: 'Inventory Control Solution',
    seoDescription:
      'Movement-based inventory control: attributable adjustments, multi-location stock, reorder points, stock takes and variance reporting.',
  },
  {
    slug: 'customer-portals',
    name: 'Customer Portals',
    iconName: 'users',
    summary: 'A single authenticated place where customers can see their history and act on it.',
    businessChallenge:
      '<p>Customer information is scattered across email threads, PDFs and whichever staff member handled it last. Every routine question becomes a manual lookup.</p>',
    overview:
      '<p>A portal consolidates account data, documents and history behind an authenticated account, with permissions that reflect how organisations actually delegate work.</p>',
    capabilities: [
      'Account and sub-user management',
      'Document and invoice access',
      'Order, booking and request history',
      'Self-service change requests',
      'Messaging and notification preferences',
    ],
    userTypes: ['Account holders', 'Delegated users', 'Support staff', 'Account managers'],
    benefits: [
      'Routine lookups answered without staff time',
      'Documents in one durable place',
      'Delegation handled by permissions rather than shared logins',
      'Requests tracked rather than lost in email',
    ],
    workflowSteps: [
      { title: 'Invite', description: 'Customers are invited and set their own credentials.' },
      { title: 'Delegate', description: 'Account holders add users with scoped permissions.' },
      { title: 'Self-serve', description: 'History, documents and status available on demand.' },
      { title: 'Request', description: 'Changes raised as tracked requests.' },
    ],
    integrations: [
      'Existing back-office systems',
      'Document storage',
      'Email delivery',
      'Single sign-on providers',
    ],
    seoTitle: 'Customer Portal Solution',
    seoDescription:
      'Customer portals with account and sub-user management, document access, history, tracked self-service requests and scoped permissions.',
  },
  {
    slug: 'corporate-portfolio-management',
    name: 'Corporate Portfolio Management',
    iconName: 'briefcase',
    isFeatured: true,
    summary:
      'A business website whose services, products, portfolio, insights and SEO are all managed from an admin panel.',
    businessChallenge:
      '<p>Marketing sites calcify. Adding a service means a developer ticket, changing a page title means a deployment, and the sitemap slowly stops matching reality.</p>',
    overview:
      '<p>This solution treats every part of a corporate site as content: pages and sections, services, solutions, products, portfolio projects, case studies, insights, job openings and the metadata around all of them. The website renders on the server from that content, so it stays fast and crawlable while remaining editable.</p>',
    capabilities: [
      'Section-based page builder with a controlled layout set',
      'Service, solution, product and portfolio catalogues',
      'Blog and insights with scheduling',
      'Careers and application handling',
      'Lead capture and quote requests',
      'SEO metadata, redirects and sitemap control',
      'Media library with image variants',
      'Role-based administration and audit logging',
    ],
    userTypes: ['Content editors', 'Marketing managers', 'SEO managers', 'Administrators'],
    benefits: [
      'Content changes without a deployment',
      'Metadata and redirects owned by the people responsible for them',
      'New services and products published the same day',
      'A complete record of who changed what',
    ],
    workflowSteps: [
      { title: 'Draft', description: 'An editor creates content and previews it privately.' },
      { title: 'Review', description: 'Content is submitted and checked before it goes live.' },
      {
        title: 'Publish or schedule',
        description: 'Content goes live immediately or at a chosen time.',
      },
      {
        title: 'Revalidate',
        description: 'Only the affected pages and the sitemap are refreshed.',
      },
    ],
    integrations: ['Search Console', 'Analytics', 'Email delivery', 'Object storage'],
    seoTitle: 'Corporate Portfolio Management Solution',
    seoDescription:
      'A managed corporate website platform: section-based pages, service and product catalogues, portfolio, insights, careers, leads, SEO controls and audit logging.',
  },
];

export interface IndustrySeed {
  slug: string;
  name: string;
  summary: string;
  introduction: string;
  challenges: string[];
  capabilities: string[];
  iconName: string;
  seoTitle: string;
  seoDescription: string;
}

export const INDUSTRIES: IndustrySeed[] = [
  {
    slug: 'sports-and-recreation',
    name: 'Sports and Recreation',
    iconName: 'trophy',
    summary:
      'Venues, clubs and facility operators that need scheduling to be reliable rather than approximate.',
    introduction:
      '<p>Recreation businesses live and die by utilisation. Every unsold slot is gone for good, and every double booking costs more than the booking was worth.</p>',
    challenges: [
      'Bookings arriving through several uncoordinated channels',
      'Peak-time demand concentrated into a few hours',
      'Recurring club bookings competing with casual players',
      'Cancellations and no-shows eating into utilisation',
    ],
    capabilities: [
      'Availability modelling that prevents clashes',
      'Self-service booking and cancellation',
      'Recurring and block bookings',
      'Utilisation reporting',
    ],
    seoTitle: 'Software for Sports and Recreation',
    seoDescription:
      'Booking and operations software for sports venues, clubs and facility operators: availability modelling, self-service reservations and utilisation reporting.',
  },
  {
    slug: 'automotive',
    name: 'Automotive',
    iconName: 'car',
    summary:
      'Parts businesses, workshops and suppliers working with catalogues that punish imprecision.',
    introduction:
      '<p>Automotive data is unforgiving. A part either fits or it does not, and "close enough" becomes a return, a refund and a lost customer.</p>',
    challenges: [
      'Fitment knowledge held by individuals rather than systems',
      'Supplier catalogues in incompatible formats',
      'Supersessions and cross-references maintained by hand',
      'Returns caused by incorrect part selection',
    ],
    capabilities: [
      'Fitment and application modelling',
      'Catalogue import and normalisation',
      'Cross-reference and supersession chains',
      'Vehicle-first search',
    ],
    seoTitle: 'Software for the Automotive Sector',
    seoDescription:
      'Automotive parts software: fitment modelling, supplier catalogue normalisation, cross-references, supersessions and vehicle-first search.',
  },
  {
    slug: 'retail',
    name: 'Retail',
    iconName: 'store',
    summary: 'Retailers selling across counter, phone and web who need one honest view of stock.',
    introduction:
      '<p>Selling through more than one channel multiplies the cost of inaccurate stock. The fix is a single inventory model every channel reads from.</p>',
    challenges: [
      'Stock figures diverging between channels',
      'Manual re-keying between systems',
      'Pricing rules maintained in several places',
      'No single view of an order across channels',
    ],
    capabilities: [
      'Unified catalogue and stock model',
      'Channel-aware pricing',
      'Order management across channels',
      'Reporting on real margin',
    ],
    seoTitle: 'Software for Retail',
    seoDescription:
      'Retail software with a unified catalogue and stock model, channel-aware pricing, cross-channel order management and honest reporting.',
  },
  {
    slug: 'professional-services',
    name: 'Professional Services',
    iconName: 'briefcase',
    summary: 'Firms whose product is expert time, and whose admin overhead quietly consumes it.',
    introduction:
      '<p>In a professional services firm, every hour spent on coordination is an hour not billed. Software earns its place by removing coordination, not by adding another system to update.</p>',
    challenges: [
      'Client information spread across inboxes and drives',
      'Manual scheduling and reminders',
      'Document versions that diverge',
      'Time and progress reported after the fact',
    ],
    capabilities: [
      'Client portals with document access',
      'Appointment and engagement scheduling',
      'Workflow and approval automation',
      'Operational reporting',
    ],
    seoTitle: 'Software for Professional Services',
    seoDescription:
      'Software for professional services firms: client portals, scheduling, document access, workflow automation and operational reporting.',
  },
  {
    slug: 'education-administration',
    name: 'Education Administration',
    iconName: 'graduation-cap',
    summary:
      'Administrative systems for institutions, where records and scheduling have to be exact.',
    introduction:
      '<p>Education administration is record keeping with consequences. Enrolment, scheduling and communication all need to be correct, traceable and available to the right people only.</p>',
    challenges: [
      'Enrolment and records maintained in spreadsheets',
      'Timetabling constraints that change late',
      'Communication to several audiences at once',
      'Access that must be tightly scoped',
    ],
    capabilities: [
      'Record management with audit history',
      'Scheduling and resource allocation',
      'Role-scoped portals',
      'Bulk communication',
    ],
    seoTitle: 'Software for Education Administration',
    seoDescription:
      'Education administration software: record management with audit history, scheduling, role-scoped portals and bulk communication.',
  },
  {
    slug: 'hospitality',
    name: 'Hospitality',
    iconName: 'utensils',
    summary:
      'Venues where the booking, the guest experience and the operation are the same system.',
    introduction:
      '<p>Hospitality software has to work at the pace of service. If it slows a member of staff down during a busy period, it will be abandoned.</p>',
    challenges: [
      'Reservations arriving through multiple channels',
      'Staff tools too slow for service hours',
      'Guest history not available at the point of contact',
      'Seasonal demand swings',
    ],
    capabilities: [
      'Reservation and table or room management',
      'Fast staff-facing interfaces',
      'Guest history and preferences',
      'Demand and utilisation reporting',
    ],
    seoTitle: 'Software for Hospitality',
    seoDescription:
      'Hospitality software built for service pace: reservations, fast staff interfaces, guest history and utilisation reporting.',
  },
  {
    slug: 'property-and-facility-management',
    name: 'Property and Facility Management',
    iconName: 'building',
    summary: 'Managing spaces, tenants, maintenance and the paperwork that follows them.',
    introduction:
      '<p>Facility management is coordination between people who are rarely in the same place. Software helps by making the current state of every request visible.</p>',
    challenges: [
      'Maintenance requests tracked in email',
      'Contractor coordination by phone',
      'Compliance documents scattered across drives',
      "No single view of a property's history",
    ],
    capabilities: [
      'Request and work-order workflows',
      'Contractor and tenant portals',
      'Document and compliance records',
      'Asset and maintenance history',
    ],
    seoTitle: 'Software for Property and Facility Management',
    seoDescription:
      'Property and facility management software: work-order workflows, tenant and contractor portals, compliance documents and asset history.',
  },
  {
    slug: 'small-and-medium-businesses',
    name: 'Small and Medium Businesses',
    iconName: 'store',
    summary: 'Businesses that have outgrown spreadsheets but do not want enterprise software.',
    introduction:
      '<p>There is a gap between a spreadsheet and an enterprise platform. Most growing businesses sit in it. The right answer is usually a focused application that does the two or three things that actually hurt.</p>',
    challenges: [
      'Critical processes running on a single spreadsheet',
      'Knowledge concentrated in one or two people',
      'Off-the-shelf software priced and scoped for larger firms',
      'No budget for a long implementation',
    ],
    capabilities: [
      'Focused applications with a narrow first release',
      'Migration from spreadsheets',
      'Straightforward hosting and maintenance',
      'Training for small teams',
    ],
    seoTitle: 'Software for Small and Medium Businesses',
    seoDescription:
      'Focused business software for SMBs that have outgrown spreadsheets: narrow first releases, spreadsheet migration and maintainable hosting.',
  },
  {
    slug: 'startups',
    name: 'Startups',
    iconName: 'rocket',
    summary:
      'Getting a defensible first version in front of users without building the wrong thing twice.',
    introduction:
      '<p>The risk in an early product is not writing code slowly. It is building the wrong thing carefully. We aim for a first release narrow enough to ship and honest enough to learn from.</p>',
    challenges: [
      'Requirements that are still hypotheses',
      'Pressure to build everything before launching anything',
      'Technical decisions that become expensive later',
      'Limited runway',
    ],
    capabilities: [
      'Scoping a first release around one core workflow',
      'Architecture that leaves the second decision open',
      'Instrumentation to learn from real usage',
      'Iterative delivery',
    ],
    seoTitle: 'Software Development for Startups',
    seoDescription:
      'Startup product development: a narrow first release around one core workflow, architecture that stays flexible and instrumentation to learn from usage.',
  },
  {
    slug: 'membership-organizations',
    name: 'Membership Organizations',
    iconName: 'users',
    summary: 'Clubs, associations and societies managing members, renewals and access.',
    introduction:
      '<p>Membership administration is repetitive, deadline-driven and easy to get wrong at scale. It is well suited to software precisely because the rules are consistent.</p>',
    challenges: [
      'Renewals chased manually every cycle',
      'Member records duplicated across systems',
      'Access and entitlements handled by hand',
      'Communication to segmented audiences',
    ],
    capabilities: [
      'Member records and tiers',
      'Renewal and reminder automation',
      'Entitlement and access control',
      'Segmented communication',
    ],
    seoTitle: 'Software for Membership Organizations',
    seoDescription:
      'Membership management software: member records and tiers, renewal automation, entitlement control and segmented communication.',
  },
];

export interface ProcessPhaseSeed {
  slug: string;
  number: number;
  name: string;
  shortDescription: string;
  detailedDescription: string;
  deliverables: string[];
  iconName: string;
}

export const PROCESS_PHASES: ProcessPhaseSeed[] = [
  {
    slug: 'discovery',
    number: 1,
    name: 'Discovery',
    iconName: 'search',
    shortDescription: 'Understand the business, the people and the problem worth solving first.',
    detailedDescription:
      '<p>We spend time with the people who do the work, including the workarounds they have invented. That is usually where the real requirement is hiding.</p>',
    deliverables: [
      'Stakeholder notes',
      'Current-state process map',
      'Problem statement',
      'Initial scope',
    ],
  },
  {
    slug: 'requirement-analysis',
    number: 2,
    name: 'Requirement Analysis',
    iconName: 'list-checks',
    shortDescription: 'Turn what we heard into requirements that can be argued with.',
    detailedDescription:
      '<p>Requirements are written so they can be disagreed with. Vague ones get clarified now rather than during development.</p>',
    deliverables: [
      'Functional requirements',
      'Non-functional requirements',
      'Acceptance criteria',
      'Open questions',
    ],
  },
  {
    slug: 'solution-planning',
    number: 3,
    name: 'Solution Planning',
    iconName: 'map',
    shortDescription: 'Decide what to build first, and what deliberately comes later.',
    detailedDescription:
      '<p>Sequencing matters more than estimating. We plan a first release that is genuinely useful, and say plainly what is deferred.</p>',
    deliverables: ['Release plan', 'Prioritised backlog', 'Risk register', 'Estimate range'],
  },
  {
    slug: 'ux-and-interface-design',
    number: 4,
    name: 'UX and Interface Design',
    iconName: 'palette',
    shortDescription: 'Design the screens, the flows and the failure states.',
    detailedDescription:
      '<p>Design covers the unhappy paths too: empty states, validation errors, permission refusals. Those are where software feels good or bad.</p>',
    deliverables: [
      'User flows',
      'Wireframes',
      'High-fidelity designs',
      'Design tokens and components',
    ],
  },
  {
    slug: 'architecture',
    number: 5,
    name: 'Architecture',
    iconName: 'blocks',
    shortDescription: 'Model the data, choose the boundaries, write down the decisions.',
    detailedDescription:
      '<p>Architecture decisions are recorded with their reasoning, so the next person can tell the difference between a deliberate constraint and an accident.</p>',
    deliverables: [
      'Data model',
      'Service and module boundaries',
      'Architecture decision records',
      'Environment plan',
    ],
  },
  {
    slug: 'development',
    number: 6,
    name: 'Development',
    iconName: 'code',
    shortDescription: 'Build in reviewable increments against the agreed criteria.',
    detailedDescription:
      '<p>Work lands in small, reviewed increments with tests. You see progress continuously rather than at a milestone.</p>',
    deliverables: ['Reviewed increments', 'Automated tests', 'Migration scripts', 'Progress notes'],
  },
  {
    slug: 'quality-assurance',
    number: 7,
    name: 'Quality Assurance',
    iconName: 'shield-check',
    shortDescription: 'Test the behaviour, the edges, the accessibility and the security posture.',
    detailedDescription:
      '<p>Testing covers unit, integration and end-to-end behaviour, plus accessibility and an application security review.</p>',
    deliverables: ['Test results', 'Accessibility findings', 'Security review notes', 'Defect log'],
  },
  {
    slug: 'deployment',
    number: 8,
    name: 'Deployment',
    iconName: 'rocket',
    shortDescription: 'Release deliberately, with a way back.',
    detailedDescription:
      '<p>Deployments are scripted and repeatable, migrations are reviewed before they run, and there is a rollback path before anything goes out.</p>',
    deliverables: ['Deployment pipeline', 'Migration plan', 'Rollback procedure', 'Release notes'],
  },
  {
    slug: 'monitoring',
    number: 9,
    name: 'Monitoring',
    iconName: 'activity',
    shortDescription: 'Know how the system is behaving before a user tells you.',
    detailedDescription:
      '<p>Health checks, structured logs and alerting on the signals that matter, rather than on everything.</p>',
    deliverables: [
      'Health checks',
      'Log and metric configuration',
      'Alert rules',
      'Operational runbook',
    ],
  },
  {
    slug: 'continuous-improvement',
    number: 10,
    name: 'Continuous Improvement',
    iconName: 'refresh',
    shortDescription: 'Keep it current, and keep improving it from real usage.',
    detailedDescription:
      '<p>Scheduled dependency and security updates, plus a steady stream of small improvements informed by how the system is actually used.</p>',
    deliverables: ['Maintenance schedule', 'Usage review', 'Improvement backlog', 'Change log'],
  },
];

export const COMPANY_VALUES = [
  {
    slug: 'clarity-over-cleverness',
    title: 'Clarity over cleverness',
    description:
      'Code, interfaces and explanations are written to be understood by the next person, not to impress the last one.',
    iconName: 'lightbulb',
  },
  {
    slug: 'say-what-is-true',
    title: 'Say what is true',
    description:
      'We report progress, estimates and problems as they are. Nobody benefits from a status report that has to be decoded.',
    iconName: 'shield-check',
  },
  {
    slug: 'build-for-the-people-using-it',
    title: 'Build for the people using it',
    description:
      'Internal tools get the same design attention as customer-facing screens, because that is where the working day is spent.',
    iconName: 'users',
  },
  {
    slug: 'own-the-outcome',
    title: 'Own the outcome',
    description:
      "Delivery includes deployment, documentation and handover. Software that works only on the developer's machine is not finished.",
    iconName: 'target',
  },
  {
    slug: 'secure-by-default',
    title: 'Secure by default',
    description:
      'Access control, validation and auditability are part of the first version, not a follow-up ticket.',
    iconName: 'lock',
  },
  {
    slug: 'leave-it-maintainable',
    title: 'Leave it maintainable',
    description:
      'Tests, migrations and documentation are part of the work, so the system can be changed by someone who was not there when it was written.',
    iconName: 'wrench',
  },
];

export const TECHNOLOGY_CATEGORIES = [
  {
    slug: 'frontend',
    name: 'Frontend',
    description: 'Interfaces rendered on the server and enhanced in the browser.',
    sortOrder: 0,
  },
  {
    slug: 'backend',
    name: 'Backend',
    description: 'Application servers, APIs and background processing.',
    sortOrder: 1,
  },
  {
    slug: 'database',
    name: 'Database',
    description: 'Relational modelling, migrations and query performance.',
    sortOrder: 2,
  },
  {
    slug: 'cloud',
    name: 'Cloud',
    description: 'Hosting, object storage and managed services.',
    sortOrder: 3,
  },
  {
    slug: 'devops',
    name: 'DevOps',
    description: 'Build, packaging, deployment and environment management.',
    sortOrder: 4,
  },
  {
    slug: 'testing',
    name: 'Testing',
    description: 'Unit, integration and end-to-end verification.',
    sortOrder: 5,
  },
  {
    slug: 'design',
    name: 'Design',
    description: 'Interface design and design system tooling.',
    sortOrder: 6,
  },
  {
    slug: 'security',
    name: 'Security',
    description: 'Authentication, authorisation and application hardening.',
    sortOrder: 7,
  },
  {
    slug: 'monitoring',
    name: 'Monitoring',
    description: 'Health checks, logging and alerting.',
    sortOrder: 8,
  },
  {
    slug: 'integration',
    name: 'Integration',
    description: 'Connecting systems reliably.',
    sortOrder: 9,
  },
];

export const TECHNOLOGIES = [
  {
    slug: 'typescript',
    name: 'TypeScript',
    category: 'frontend',
    proficiencyLabel: 'Core',
    isFeatured: true,
    description: 'Used across the API, both web applications and the shared packages.',
  },
  {
    slug: 'react',
    name: 'React',
    category: 'frontend',
    proficiencyLabel: 'Core',
    isFeatured: true,
    description: 'Server and client components for public and administrative interfaces.',
  },
  {
    slug: 'nextjs',
    name: 'Next.js',
    category: 'frontend',
    proficiencyLabel: 'Core',
    isFeatured: true,
    description: 'App Router, server rendering, static generation and incremental revalidation.',
  },
  {
    slug: 'tailwind-css',
    name: 'CSS Modules and design tokens',
    category: 'design',
    proficiencyLabel: 'Core',
    description: 'Token-driven styling with no runtime CSS-in-JS cost.',
  },
  {
    slug: 'nestjs',
    name: 'NestJS',
    category: 'backend',
    proficiencyLabel: 'Core',
    isFeatured: true,
    description: 'Modular API structure with guards, interceptors and dependency injection.',
  },
  {
    slug: 'fastify',
    name: 'Fastify',
    category: 'backend',
    proficiencyLabel: 'Core',
    description: 'HTTP adapter for the API, with schema-driven serialisation.',
  },
  {
    slug: 'nodejs',
    name: 'Node.js',
    category: 'backend',
    proficiencyLabel: 'Core',
    description: 'Runtime for the API and build tooling.',
  },
  {
    slug: 'postgresql',
    name: 'PostgreSQL',
    category: 'database',
    proficiencyLabel: 'Core',
    isFeatured: true,
    description: 'Primary datastore, with constraints and indexes designed per workload.',
  },
  {
    slug: 'prisma',
    name: 'Prisma',
    category: 'database',
    proficiencyLabel: 'Core',
    isFeatured: true,
    description: 'Schema definition, typed queries and reviewable migrations.',
  },
  {
    slug: 'docker',
    name: 'Docker',
    category: 'devops',
    proficiencyLabel: 'Core',
    isFeatured: true,
    description: 'Multi-stage builds and reproducible local environments.',
  },
  {
    slug: 'github-actions',
    name: 'CI pipelines',
    category: 'devops',
    proficiencyLabel: 'Working',
    description: 'Lint, typecheck, test and build on every change.',
  },
  {
    slug: 'playwright',
    name: 'Playwright',
    category: 'testing',
    proficiencyLabel: 'Core',
    description: 'End-to-end tests across desktop and mobile viewports.',
  },
  {
    slug: 'vitest',
    name: 'Vitest',
    category: 'testing',
    proficiencyLabel: 'Core',
    description: 'Fast unit testing for shared packages.',
  },
  {
    slug: 'jest',
    name: 'Jest',
    category: 'testing',
    proficiencyLabel: 'Core',
    description: 'Unit and integration testing for the API.',
  },
  {
    slug: 'zod',
    name: 'Zod',
    category: 'security',
    proficiencyLabel: 'Core',
    description: 'One schema validating on both the client and the server.',
  },
  {
    slug: 'sharp',
    name: 'Sharp',
    category: 'backend',
    proficiencyLabel: 'Working',
    description: 'Image re-encoding, variant generation and metadata stripping.',
  },
  {
    slug: 's3-compatible-storage',
    name: 'S3-compatible storage',
    category: 'cloud',
    proficiencyLabel: 'Working',
    description: 'Object storage behind a provider interface, swappable with local disk.',
  },
  {
    slug: 'structured-logging',
    name: 'Structured logging',
    category: 'monitoring',
    proficiencyLabel: 'Core',
    description: 'Request-scoped logs with correlation ids.',
  },
  {
    slug: 'rest-apis',
    name: 'REST APIs',
    category: 'integration',
    proficiencyLabel: 'Core',
    description: 'Versioned, documented endpoints with idempotent writes.',
  },
  {
    slug: 'webhooks',
    name: 'Webhooks',
    category: 'integration',
    proficiencyLabel: 'Working',
    description: 'Event publishing and consumption with retry handling.',
  },
];
