/**
 * Key Tech product catalogue seed.
 *
 * KeySportsBooking and KeyAutoParts are Key Tech Solutions' own products.
 * The copy describes what each product is for and what it does; it states no
 * customer count, venue count, revenue figure, launch commitment or result,
 * because none has been supplied. Every field remains editable in the admin
 * panel.
 */

import { SAMPLE_CONTENT_NOTICE } from '@kts/config';

export interface ProductSeed {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  productStatus:
    | 'CONCEPT'
    | 'PLANNED'
    | 'IN_DEVELOPMENT'
    | 'COMING_SOON'
    | 'BETA'
    | 'LIVE'
    | 'MAINTENANCE'
    | 'RETIRED';
  summary: string;
  fullDescription: string;
  problemSolved: string;
  targetUsers: string[];
  benefits: string[];
  brandPrimary: string;
  brandSecondary: string;
  launchLabel: string;
  businessModel: string;
  isFeatured: boolean;
  sortOrder: number;
  features: Array<{ title: string; description: string; iconName: string }>;
  faqs: Array<{ question: string; answer: string }>;
  solutions: string[];
  services: string[];
  industries: string[];
  technologies: string[];
  seoTitle: string;
  seoDescription: string;
}

export const PRODUCTS: ProductSeed[] = [
  {
    slug: 'keysportsbooking',
    name: 'KeySportsBooking',
    tagline: 'Find a venue. Book a slot. Run the schedule.',
    category: 'Booking and reservations',
    productStatus: 'IN_DEVELOPMENT',
    isFeatured: true,
    sortOrder: 0,
    brandPrimary: '#2CA3A3',
    brandSecondary: '#416F9E',
    launchLabel: 'In active development',
    businessModel: 'Subscription for venue operators, with free booking for players.',
    summary:
      'A sports venue discovery and booking platform, paired with an administration console venue operators use to manage availability, reservations and their schedule.',
    fullDescription:
      '<p>KeySportsBooking has two sides. Players search for a venue and reserve a slot themselves, at any hour. Venue operators get an administration console where availability, recurring club bookings, blocked periods and manual overrides all live in one place.</p>' +
      '<p>The part that matters is underneath both: an availability model the software can reason about, rather than a calendar that humans interpret. That is what makes a double booking impossible instead of unlikely.</p>' +
      '<p>KeySportsBooking is a Key Tech Solutions product and is under active development. Feature availability and timing will be published here as they are confirmed.</p>',
    problemSolved:
      '<p>Venue bookings are still largely arranged by phone and message during opening hours, recorded in a diary only one person can read. Players give up when nobody answers; staff spend the day confirming slots and untangling clashes afterwards.</p>' +
      '<p>KeySportsBooking moves routine reservations into software, while keeping staff in control of the cases software should not decide.</p>',
    targetUsers: [
      'Players and casual groups looking for a venue',
      'Clubs holding recurring slots',
      'Venue staff managing the daily schedule',
      'Venue owners tracking utilisation',
    ],
    benefits: [
      'Reservations taken outside opening hours',
      'An availability model that prevents double bookings',
      'Recurring club bookings handled as a rule, not a repeated task',
      'Staff override for the situations rules cannot cover',
      'A complete history of every reservation change',
    ],
    features: [
      {
        title: 'Venue discovery',
        description:
          'Search venues by sport, location and availability window rather than by browsing a list.',
        iconName: 'search',
      },
      {
        title: 'Real-time availability',
        description:
          'Availability is derived from opening hours, slot rules, existing bookings and blocked periods.',
        iconName: 'calendar',
      },
      {
        title: 'Self-service reservations',
        description:
          "Players book, amend and cancel within the venue's own rules, with automatic confirmation.",
        iconName: 'check-circle',
      },
      {
        title: 'Recurring and block bookings',
        description:
          'Club slots and maintenance windows are expressed as recurring rules with exceptions.',
        iconName: 'repeat',
      },
      {
        title: 'Venue administration console',
        description:
          'Facilities, pricing, opening hours, staff accounts and manual bookings in one place.',
        iconName: 'gauge',
      },
      {
        title: 'Payment evidence workflow',
        description:
          'Deposits and payment confirmations recorded against a booking for staff to verify.',
        iconName: 'receipt',
      },
      {
        title: 'Notifications and reminders',
        description: 'Confirmation, change and reminder messages driven by the booking lifecycle.',
        iconName: 'bell',
      },
      {
        title: 'Utilisation reporting',
        description: 'Which slots sell, which sit empty, and how that changes across the week.',
        iconName: 'bar-chart',
      },
    ],
    faqs: [
      {
        question: 'Is KeySportsBooking available to use now?',
        answer:
          'It is in active development. This page is kept current as capabilities are confirmed; there is no published availability date yet.',
      },
      {
        question: 'Who is it for?',
        answer:
          'Venue operators who take bookings for courts, pitches or halls, and the players and clubs who book them.',
      },
      {
        question: 'Can a venue keep taking bookings by phone?',
        answer:
          'Yes. Staff can create and amend bookings directly in the administration console, so the phone remains a supported channel rather than a separate system.',
      },
    ],
    solutions: ['sports-venue-booking', 'appointment-booking', 'multi-tenant-saas'],
    services: [
      'booking-and-reservation-platforms',
      'saas-product-development',
      'admin-dashboard-development',
    ],
    industries: ['sports-and-recreation', 'hospitality', 'membership-organizations'],
    technologies: ['typescript', 'nextjs', 'nestjs', 'postgresql', 'prisma', 'docker'],
    seoTitle: 'KeySportsBooking - Sports Venue Booking Platform',
    seoDescription:
      'KeySportsBooking is a Key Tech Solutions product for sports venue discovery, self-service reservations and venue schedule administration. Currently in active development.',
  },
  {
    slug: 'keyautoparts',
    name: 'KeyAutoParts',
    tagline: 'The right part, found the first time.',
    category: 'Commerce and catalogue',
    productStatus: 'IN_DEVELOPMENT',
    isFeatured: true,
    sortOrder: 1,
    brandPrimary: '#6436A3',
    brandSecondary: '#416F9E',
    launchLabel: 'In active development',
    businessModel: 'Subscription for parts businesses, with catalogue import included.',
    summary:
      'An automotive parts catalogue and ordering platform that models fitment, cross-references and supersessions explicitly, so buyers and counter staff reach the same correct answer.',
    fullDescription:
      '<p>Most parts catalogues treat a part as a product with a code. That works until a buyer asks whether it fits their vehicle, what replaced it, or what the equivalent is from another brand.</p>' +
      '<p>KeyAutoParts models those relationships as first-class data: vehicle applications, cross-references and supersession chains. Supplier catalogues are imported and normalised into one index, so a search returns a real answer rather than a list to interpret.</p>' +
      '<p>KeyAutoParts is a Key Tech Solutions product and is under active development. Capabilities listed here reflect the current build scope and remain subject to change.</p>',
    problemSolved:
      '<p>In a parts business, the expensive knowledge is fitment: which part suits which vehicle, and what superseded what. When that lives only in experienced staff, every enquiry consumes their time and every gap produces a return.</p>' +
      '<p>KeyAutoParts puts that knowledge into the system, where it can be searched, corrected and reused.</p>',
    targetUsers: [
      'Counter staff answering parts enquiries',
      'Workshops ordering for a specific vehicle',
      'Online buyers searching by registration or part number',
      'Suppliers publishing a catalogue',
      'Administrators maintaining catalogue quality',
    ],
    benefits: [
      'Fitment answered by the system rather than from memory',
      'Cross-references and supersessions maintained as data',
      'Supplier catalogues consolidated into a single search',
      'Fewer returns caused by incorrect part selection',
      'Quotations produced from live catalogue and pricing data',
    ],
    features: [
      {
        title: 'Vehicle-first search',
        description:
          'Start from the vehicle and narrow to compatible parts, rather than guessing from a part list.',
        iconName: 'car',
      },
      {
        title: 'Fitment and application data',
        description: 'Explicit vehicle-to-part applications, including qualifiers and date ranges.',
        iconName: 'link',
      },
      {
        title: 'Cross-references and supersessions',
        description:
          'Equivalent and replacement parts modelled as chains rather than free-text notes.',
        iconName: 'refresh',
      },
      {
        title: 'Supplier catalogue import',
        description: 'Import and normalise supplier feeds into one consistent catalogue model.',
        iconName: 'upload',
      },
      {
        title: 'Stock and availability',
        description:
          'Availability across locations and suppliers, visible at the point of enquiry.',
        iconName: 'boxes',
      },
      {
        title: 'Quotation and enquiry workflow',
        description: 'Turn an enquiry into a priced quotation without leaving the catalogue.',
        iconName: 'file-text',
      },
      {
        title: 'Data quality reporting',
        description:
          'Surface gaps, conflicts and duplicates so catalogue quality improves over time.',
        iconName: 'alert-triangle',
      },
      {
        title: 'Administration console',
        description: 'Catalogue, pricing, users and imports managed by the business itself.',
        iconName: 'gauge',
      },
    ],
    faqs: [
      {
        question: 'Is KeyAutoParts available to use now?',
        answer:
          'It is in active development. This page is maintained as capabilities are confirmed; there is no published availability date yet.',
      },
      {
        question: 'Can existing supplier catalogues be imported?',
        answer:
          'Catalogue import and normalisation is part of the product scope. The specific formats supported will be listed here as they are implemented.',
      },
      {
        question: 'Does it replace an existing accounting or stock system?',
        answer:
          'It is designed to sit alongside them and integrate, not to replace finance systems.',
      },
    ],
    solutions: ['automotive-parts-management', 'inventory-control', 'multi-tenant-saas'],
    services: [
      'automotive-parts-platforms',
      'ecommerce-and-marketplace-development',
      'inventory-and-operations-systems',
    ],
    industries: ['automotive', 'retail', 'small-and-medium-businesses'],
    technologies: ['typescript', 'nextjs', 'nestjs', 'postgresql', 'prisma', 'docker'],
    seoTitle: 'KeyAutoParts - Automotive Parts Catalogue Platform',
    seoDescription:
      'KeyAutoParts is a Key Tech Solutions product for automotive parts catalogues: vehicle fitment, cross-references, supersessions, supplier imports and quotations. In active development.',
  },
];

export interface PortfolioSeed {
  slug: string;
  title: string;
  customerDisplayName: string | null;
  isCustomerConfidential: boolean;
  category: string;
  projectStatus: 'PLANNED' | 'IN_PROGRESS' | 'ONGOING' | 'COMPLETED' | 'MAINTENANCE' | 'PRIVATE';
  summary: string;
  challenge: string;
  approach: string;
  solution: string;
  features: string[];
  deliverables: string[];
  isFeatured: boolean;
  services: string[];
  products: string[];
  industries: string[];
  technologies: string[];
  seoTitle: string;
  seoDescription: string;
}

export const PORTFOLIO_PROJECTS: PortfolioSeed[] = [
  {
    slug: 'keysportsbooking-platform-build',
    title: 'KeySportsBooking platform build',
    customerDisplayName: 'Key Tech Solutions (internal product)',
    isCustomerConfidential: false,
    category: 'SaaS product',
    projectStatus: 'IN_PROGRESS',
    isFeatured: true,
    summary:
      'Designing and building the availability model, booking flows and venue administration console behind the KeySportsBooking product.',
    challenge:
      '<p>Booking software is easy to demonstrate and hard to get right. The difficulty is not the booking form; it is expressing availability so that recurring club slots, blocked maintenance windows, partial-hour bookings and staff overrides can all coexist without producing a clash.</p>',
    approach:
      '<p>We started from the availability model rather than the interface. Slots are derived from opening hours, facility configuration and rules, with exceptions modelled explicitly instead of patched in later. Only once that held up did we design the player-facing and staff-facing experiences on top of it.</p>',
    solution:
      '<p>The platform separates three concerns: the availability engine, the reservation lifecycle, and the administration console. Each is independently testable, and the reservation history records every change with its author.</p>',
    features: [
      'Availability derivation from configuration and rules',
      'Reservation lifecycle with amendment and cancellation windows',
      'Recurring bookings with exception handling',
      'Venue administration console',
      'Notification pipeline',
      'Utilisation reporting',
    ],
    deliverables: [
      'Availability and reservation data model',
      'Player-facing booking interface',
      'Venue administration console',
      'Notification templates',
      'Deployment pipeline',
    ],
    services: ['booking-and-reservation-platforms', 'saas-product-development', 'ui-and-ux-design'],
    products: ['keysportsbooking'],
    industries: ['sports-and-recreation'],
    technologies: ['typescript', 'nextjs', 'nestjs', 'postgresql', 'prisma'],
    seoTitle: 'KeySportsBooking Platform Build',
    seoDescription:
      'How Key Tech Solutions approached the availability model, reservation lifecycle and venue administration console behind KeySportsBooking.',
  },
  {
    slug: 'keyautoparts-catalogue-platform',
    title: 'KeyAutoParts catalogue platform',
    customerDisplayName: 'Key Tech Solutions (internal product)',
    isCustomerConfidential: false,
    category: 'Commerce platform',
    projectStatus: 'IN_PROGRESS',
    isFeatured: true,
    summary:
      'Modelling fitment, cross-references and supersessions, and building the import pipeline that consolidates supplier catalogues.',
    challenge:
      '<p>Automotive catalogue data arrives in incompatible shapes from every supplier, and the relationships that matter most to a buyer - does it fit, what replaced it, what is equivalent - are usually the least structured part of the feed.</p>',
    approach:
      '<p>We treated fitment and supersession as first-class entities rather than attributes, then built an import pipeline that normalises supplier data into that model and reports what it could not resolve.</p>',
    solution:
      '<p>The result is a single searchable catalogue with an explicit data-quality signal: gaps and conflicts are visible and fixable rather than silently absorbed.</p>',
    features: [
      'Fitment and application modelling',
      'Cross-reference and supersession chains',
      'Supplier feed import and normalisation',
      'Vehicle-first and part-number-first search',
      'Data quality reporting',
    ],
    deliverables: [
      'Catalogue and fitment data model',
      'Import and normalisation pipeline',
      'Search and browse interfaces',
      'Administration console',
      'Data quality dashboard',
    ],
    services: [
      'automotive-parts-platforms',
      'ecommerce-and-marketplace-development',
      'postgresql-database-design',
    ],
    products: ['keyautoparts'],
    industries: ['automotive', 'retail'],
    technologies: ['typescript', 'nextjs', 'nestjs', 'postgresql', 'prisma'],
    seoTitle: 'KeyAutoParts Catalogue Platform',
    seoDescription:
      'How Key Tech Solutions modelled automotive fitment, cross-references and supersessions, and built the supplier catalogue import pipeline for KeyAutoParts.',
  },
  {
    slug: 'key-tech-portfolio-management-platform',
    title: 'Key Tech portfolio management platform',
    customerDisplayName: 'Key Tech Solutions (internal product)',
    isCustomerConfidential: false,
    category: 'Corporate platform',
    projectStatus: 'ONGOING',
    isFeatured: true,
    summary:
      'The platform behind this website: a server-rendered public site, an administration panel and a versioned API sharing one content model.',
    challenge:
      '<p>A corporate site that cannot be edited becomes inaccurate within months. One that is fully editable usually becomes slow, inconsistent or invisible to search engines. We wanted neither trade-off.</p>',
    approach:
      '<p>Content is modelled explicitly - pages and sections, services, solutions, products, portfolio, case studies, insights, careers - with a controlled set of section layouts rather than a free canvas. The public site renders on the server and revalidates only the pages a publish actually affects.</p>',
    solution:
      '<p>Editors change content, metadata, navigation and redirects without a deployment. The public site stays server-rendered and crawlable, and every change is attributable through the audit log.</p>',
    features: [
      'Section-based page builder with a fixed layout set',
      'Draft, review, schedule and publish workflow with revisions',
      'SEO metadata, redirects and database-driven sitemap',
      'Media library with generated image variants',
      'Role-based administration with audit logging',
      'Tag-based incremental revalidation',
    ],
    deliverables: [
      'Prisma schema and migrations',
      'NestJS API with public and admin surfaces',
      'Public website and administration panel',
      'Docker development and production configuration',
      'Documentation and test suites',
    ],
    services: [
      'corporate-and-portfolio-websites',
      'seo-focused-development',
      'admin-dashboard-development',
      'api-development-and-integration',
    ],
    products: [],
    industries: ['professional-services', 'small-and-medium-businesses'],
    technologies: [
      'typescript',
      'nextjs',
      'nestjs',
      'postgresql',
      'prisma',
      'docker',
      'playwright',
    ],
    seoTitle: 'Key Tech Portfolio Management Platform',
    seoDescription:
      'The platform behind keytech: a server-rendered public website, an administration panel and a versioned API over one shared content model.',
  },
];

export const CASE_STUDIES = [
  {
    slug: 'building-a-reliable-availability-model',
    title: 'Building a reliable availability model for venue booking',
    projectSlug: 'keysportsbooking-platform-build',
    summary:
      'Why the availability model, not the booking form, is the hard part of a reservation platform - and how KeySportsBooking approaches it.',
    background:
      '<p>KeySportsBooking is a Key Tech Solutions product for sports venue discovery and booking. This case study describes our own engineering approach on that product.</p>',
    challenge:
      '<p>Venue availability is not a list of free slots. It is the result of opening hours, facility configuration, slot granularity, recurring club bookings, maintenance blocks, cancellation windows and manual staff decisions - all interacting.</p>' +
      '<p>Treat it as a calendar and the clashes appear later, in production, in front of a customer.</p>',
    discovery:
      '<p>We catalogued the ways a booking can conflict: overlapping slots, partial-hour bookings crossing a boundary, a recurring block that should have had an exception, and a staff override that bypassed a rule. Each became a test case before any interface work started.</p>',
    strategy:
      '<p>Availability is derived, never stored as a free/busy flag. The source of truth is the configuration plus the reservation ledger; free slots are computed from them. That makes an inconsistent state impossible to persist.</p>',
    design:
      '<p>The player-facing interface exposes only what the model says is bookable. The staff console exposes the model itself - rules, exceptions and overrides - because staff need to reason about why something is unavailable.</p>',
    development:
      '<p>The availability engine is a pure module with no database access, so its rules can be tested exhaustively. Persistence and the HTTP layer sit around it.</p>',
    architecture:
      '<p>Three separable concerns: availability derivation, reservation lifecycle, and administration. Reservations are append-only in effect - every amendment is recorded with its author and reason rather than overwriting the previous state.</p>',
    solution:
      '<p>The outcome is a booking platform where a double booking is prevented by construction rather than by a check that someone remembered to add, and where every change to a reservation can be explained afterwards.</p>',
    isFeatured: true,
    services: ['booking-and-reservation-platforms', 'saas-product-development'],
    products: ['keysportsbooking'],
    industries: ['sports-and-recreation'],
    seoTitle: 'Building a Reliable Availability Model for Venue Booking',
    seoDescription:
      'A Key Tech Solutions engineering case study on deriving venue availability from configuration and a reservation ledger, so double bookings are prevented by construction.',
  },
];

export const BLOG_CATEGORIES = [
  {
    slug: 'engineering',
    name: 'Engineering',
    description: 'How we build things, and why we made the call that way.',
    accentColor: '#6436A3',
    sortOrder: 0,
  },
  {
    slug: 'product',
    name: 'Product',
    description: 'Updates on the Key-branded products we are building.',
    accentColor: '#2CA3A3',
    sortOrder: 1,
  },
  {
    slug: 'business-technology',
    name: 'Business Technology',
    description: 'Practical notes for businesses choosing or commissioning software.',
    accentColor: '#416F9E',
    sortOrder: 2,
  },
];

export const BLOG_POSTS = [
  {
    slug: 'why-availability-is-harder-than-booking',
    title: 'Why availability is harder than booking',
    category: 'engineering',
    postType: 'TECHNICAL_GUIDE' as const,
    tags: ['booking', 'architecture', 'postgresql'],
    isFeatured: true,
    excerpt:
      'Every reservation system looks simple until you meet recurring blocks, partial-hour slots and the staff member who needs to override the rules. Here is how we model it.',
    contentHtml:
      '<p>Ask someone to describe a booking system and they will describe a form. Ask them two weeks later, after the first double booking, and they will describe an availability model.</p>' +
      '<h2>Stored availability goes stale</h2>' +
      '<p>The tempting design is a table of slots with a <code>is_available</code> flag. It is fast to query and easy to explain. It is also a second source of truth, and second sources of truth drift.</p>' +
      '<p>The moment a booking is cancelled in one code path and the flag is not cleared, the slot is invisible forever. The moment two requests arrive together, both read <em>available</em> and both write <em>booked</em>.</p>' +
      '<h2>Derive it instead</h2>' +
      '<p>Availability is a function of configuration and reservations. Opening hours, slot granularity and recurring rules describe what <em>could</em> be booked; the reservation ledger describes what <em>has</em> been. Free slots are the difference.</p>' +
      '<p>Nothing to keep in sync, because nothing is duplicated. The cost is computation, which is what indexes and a well-chosen query are for.</p>' +
      '<h2>Exceptions are data, not code</h2>' +
      '<p>A recurring club booking every Tuesday except the third week of the month is not an edge case; it is normal. Express recurrence and its exceptions as data and the rule stays editable by staff. Express it as a special case in code and you will be redeploying every time the club changes its schedule.</p>' +
      '<h2>Let staff override, and record it</h2>' +
      '<p>Software should not have the final say about whether a regular can have the court fifteen minutes early. Staff need an override. What the system owes you is a record: who overrode what, when, and why.</p>' +
      '<h2>Test the conflicts first</h2>' +
      '<p>Before writing the booking form, write the list of ways two bookings can collide. Overlapping ranges, a booking that starts inside another, one that ends inside another, one that spans an entire block. Each is a test. If the availability module is pure - no database, no HTTP - you can test all of them in milliseconds.</p>' +
      '<p>Get that right and the booking form really is the easy part.</p>',
    services: ['booking-and-reservation-platforms'],
    products: ['keysportsbooking'],
    seoTitle: 'Why Availability Is Harder Than Booking',
    seoDescription:
      'Reservation systems fail on availability, not on the booking form. How to derive availability from configuration and a reservation ledger instead of storing it.',
  },
  {
    slug: 'technical-seo-is-engineering-work',
    title: 'Technical SEO is engineering work',
    category: 'engineering',
    postType: 'ARTICLE' as const,
    tags: ['seo', 'nextjs', 'performance'],
    isFeatured: true,
    excerpt:
      'Server rendering, correct status codes, canonical URLs and structured data that matches the page. None of it is marketing; all of it is engineering.',
    contentHtml:
      '<p>Technical SEO gets treated as something you sprinkle on before launch. It is not. It is a set of engineering decisions, most of which are expensive to reverse.</p>' +
      '<h2>Render on the server</h2>' +
      '<p>If the page content only exists after client-side hydration, you are betting on a crawler executing your JavaScript and waiting for your API. Some do. Not reliably, and not quickly. Server-render the content that matters and the bet disappears.</p>' +
      '<h2>Status codes are part of the contract</h2>' +
      '<p>A missing page must return 404, not 200 with an apology. A moved page must return 301, not a client-side redirect. A removed page can legitimately return 410. Each tells a crawler something different, and getting them wrong wastes crawl budget on pages you do not want indexed.</p>' +
      '<h2>Canonical URLs need an owner</h2>' +
      '<p>Pagination, filters and tracking parameters all create URL variants. Decide which one is canonical, emit it consistently, and give editors a way to override it when they have a reason.</p>' +
      '<h2>Structured data must match the page</h2>' +
      '<p>JSON-LD that describes content the visitor cannot see is a liability. If there is no published price, emit no <code>offers</code>. If there is no review, emit no <code>aggregateRating</code>. Marking up claims you cannot support is the fastest route to a manual action.</p>' +
      '<h2>Redirect when the slug changes</h2>' +
      '<p>Editors rename things. If a published URL changes and nothing catches it, every inbound link and every indexed result breaks silently. The system should notice the change and offer the 301 automatically.</p>' +
      '<h2>Generate the sitemap from the database</h2>' +
      '<p>A hand-maintained sitemap describes the site as it was when someone last remembered. Generate it from the same visibility rule the pages use, and it cannot disagree with reality.</p>' +
      '<h2>What none of this buys you</h2>' +
      '<p>A ranking. Technical SEO removes the reasons a page <em>cannot</em> rank. What it ranks for, and how well, depends on the content and on competition. Anyone promising a position is selling something else.</p>',
    services: ['seo-focused-development', 'corporate-and-portfolio-websites'],
    products: [],
    seoTitle: 'Technical SEO Is Engineering Work',
    seoDescription:
      'Server rendering, correct status codes, canonical URLs, honest structured data, automatic redirects and database-driven sitemaps - the engineering side of search visibility.',
  },
  {
    slug: 'what-to-ask-before-commissioning-software',
    title: 'What to ask before commissioning custom software',
    category: 'business-technology',
    postType: 'INDUSTRY_INSIGHT' as const,
    tags: ['procurement', 'planning'],
    isFeatured: false,
    excerpt:
      'Six questions worth asking any development partner before signing, including the ones that are uncomfortable to answer.',
    contentHtml:
      '<p>Commissioning software is difficult because the thing being bought does not exist yet. These questions surface most of what matters.</p>' +
      '<h2>1. Who owns the code and the data?</h2>' +
      '<p>Get it in writing. Ownership of the repository, the database and the deployment configuration should not be ambiguous, and it should not depend on the relationship continuing.</p>' +
      '<h2>2. What happens if we stop working together?</h2>' +
      '<p>A good answer describes a handover: documented environment, reproducible build, migrations in the repository, credentials rotated to you. A vague answer is a warning.</p>' +
      '<h2>3. How will I see progress?</h2>' +
      '<p>"A demo at the end of each month" is weak. Working software in a staging environment you can open yourself, updated continuously, is strong.</p>' +
      '<h2>4. What is deliberately not in the first release?</h2>' +
      '<p>A plan that includes everything is a plan nobody has prioritised. Ask what has been deferred and why - the reasoning tells you whether the scope was thought about.</p>' +
      '<h2>5. How is the estimate constructed?</h2>' +
      '<p>A single number is a guess with false precision. A range, with the assumptions that would move it, is an estimate. Ask which parts are uncertain and what would resolve them.</p>' +
      '<h2>6. Who maintains it afterwards?</h2>' +
      '<p>Dependencies get security advisories whether or not anyone is watching. Agree who applies them, on what schedule, and what it costs - before launch, not after the first advisory.</p>' +
      '<h2>And one to ask yourself</h2>' +
      '<p>What will be measurably different in the business once this exists? If that cannot be answered, the project is not ready to start, however good the development partner is.</p>',
    services: ['custom-web-application-development', 'maintenance-and-technical-support'],
    products: [],
    seoTitle: 'What to Ask Before Commissioning Custom Software',
    seoDescription:
      'Six practical questions to ask a software development partner before signing: ownership, handover, progress visibility, scope, estimates and maintenance.',
  },
];

export const CAREERS = [
  {
    slug: 'full-stack-engineer',
    title: 'Full Stack Engineer',
    department: 'Engineering',
    location: 'Remote',
    workplaceType: 'REMOTE' as const,
    employmentType: 'FULL_TIME' as const,
    careerStatus: 'OPEN' as const,
    summary:
      `<p><strong>${SAMPLE_CONTENT_NOTICE}</strong></p>` +
      '<p>We are looking for an engineer comfortable across a TypeScript stack: Next.js on the front, NestJS and PostgreSQL behind it. You will work on Key-branded products and on client platforms, usually owning a feature from data model to deployed interface.</p>',
    responsibilities: [
      'Design and build features across the API and the web applications',
      'Model data in PostgreSQL and write reviewable migrations',
      'Write unit, integration and end-to-end tests alongside the code',
      "Review colleagues' work and take review on your own",
      'Take part in discovery sessions with the people who will use what you build',
    ],
    requirements: [
      'Strong TypeScript across both browser and server',
      'Practical experience with React and a server-rendering framework',
      'Comfortable designing relational schemas and reading a query plan',
      'Writes tests as part of the work rather than afterwards',
      'Can explain a technical trade-off to a non-technical colleague',
    ],
    preferredSkills: [
      'NestJS or another structured Node.js framework',
      'Prisma or a comparable ORM with migration tooling',
      'Accessibility practice against WCAG 2.2 AA',
      'Docker and CI pipelines',
    ],
    seoTitle: 'Full Stack Engineer',
    seoDescription:
      'Full Stack Engineer role at Key Tech Solutions: TypeScript, Next.js, NestJS and PostgreSQL, owning features from data model to deployed interface.',
  },
  {
    slug: 'product-designer',
    title: 'Product Designer',
    department: 'Design',
    location: 'Hybrid',
    workplaceType: 'HYBRID' as const,
    employmentType: 'FULL_TIME' as const,
    careerStatus: 'DRAFT' as const,
    summary:
      `<p><strong>${SAMPLE_CONTENT_NOTICE}</strong></p>` +
      '<p>A designer who is as interested in the administration console as in the marketing page. You will work on flows, interfaces and the design system that keeps them consistent.</p>',
    responsibilities: [
      'Map user flows for both customer-facing and internal interfaces',
      'Produce wireframes, prototypes and high-fidelity designs',
      'Extend and maintain the design token set and component library',
      'Review built interfaces against the design and against accessibility practice',
    ],
    requirements: [
      'A portfolio that includes complex internal tools, not only marketing pages',
      'Comfortable designing empty, loading and error states',
      'Working knowledge of accessible design practice',
      'Able to hand off designs developers can build without guessing',
    ],
    preferredSkills: [
      'Design systems and token architecture',
      'Motion design',
      'Basic HTML and CSS literacy',
    ],
    seoTitle: 'Product Designer',
    seoDescription:
      'Product Designer role at Key Tech Solutions: user flows, prototypes, design systems and accessible interfaces for both customer-facing and internal software.',
  },
];
