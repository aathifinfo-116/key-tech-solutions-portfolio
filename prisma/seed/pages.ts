/**
 * Page and section seed data.
 *
 * Sections are the controlled layout set the page builder exposes. Every
 * string here is editable in the admin panel; none of it is hardcoded in the
 * website. Data-driven sections (service grid, product grid, statistics, ...)
 * carry only their framing copy - the records themselves are resolved at read
 * time from the published catalogue.
 */

export interface SectionSeed {
  internalName: string;
  type: string;
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  description?: string;
  bodyHtml?: string;
  theme: 'WHITE' | 'LIGHT' | 'SOFT_PURPLE' | 'SOFT_TEAL' | 'DARK' | 'BRAND_GRADIENT';
  layoutVariant?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  settings?: Record<string, unknown>;
}

export interface PageSeed {
  slug: string;
  path: string;
  title: string;
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
  summary?: string;
  isSystem: boolean;
  seoTitle: string;
  seoDescription: string;
  sitemapPriority?: number;
  sections: SectionSeed[];
}

export const PAGES: PageSeed[] = [
  {
    slug: 'home',
    path: '/',
    title: 'Key Tech Solutions',
    isSystem: true,
    seoTitle: 'Key Tech Solutions - Software, SaaS and Business Automation',
    seoDescription:
      'Key Tech Solutions designs and builds web applications, SaaS products and business systems, and is the parent organisation behind KeySportsBooking and KeyAutoParts.',
    sitemapPriority: 1,
    sections: [
      {
        internalName: 'Hero',
        type: 'HERO',
        theme: 'WHITE',
        layoutVariant: 'asymmetric-media',
        eyebrow: 'Software • SaaS • Business Automation',
        heading: 'Technology That Unlocks Business Growth',
        description:
          'Key Tech Solutions designs and builds modern web applications, SaaS products, and digital systems that simplify operations and create new business opportunities.',
        primaryCtaLabel: 'Start a Project',
        primaryCtaHref: '/request-a-quote',
        secondaryCtaLabel: 'Explore Our Products',
        secondaryCtaHref: '/products',
      },
      {
        internalName: 'Capability strip',
        type: 'CAPABILITY_STRIP',
        theme: 'LIGHT',
        settings: {
          items: [
            { label: 'Custom web applications', iconName: 'code' },
            { label: 'SaaS products', iconName: 'layers' },
            { label: 'Booking platforms', iconName: 'calendar' },
            { label: 'Business automation', iconName: 'workflow' },
            { label: 'APIs and integration', iconName: 'plug' },
            { label: 'SEO-focused websites', iconName: 'search' },
          ],
        },
      },
      {
        internalName: 'Introduction',
        type: 'SPLIT_CONTENT',
        theme: 'WHITE',
        layoutVariant: 'text-left',
        eyebrow: '01 — Who we are',
        heading: 'A technology company that also builds its own products',
        bodyHtml:
          '<p>Key Tech Solutions is a software development company and the parent organisation behind the Key-branded product family. We build web applications, SaaS products and operational systems for other businesses, and we build our own.</p>' +
          '<p>Running our own products changes how we work for clients. We have had to live with our own architecture decisions, our own migrations and our own support burden, which makes us noticeably more careful about the ones we recommend to you.</p>',
        primaryCtaLabel: 'About Key Tech',
        primaryCtaHref: '/about',
      },
      {
        internalName: 'Services overview',
        type: 'SERVICE_GRID',
        theme: 'LIGHT',
        eyebrow: '02 — What we do',
        heading: 'Services built around the work, not around a template',
        description:
          'From a first release to a platform under continuous development, each engagement starts by understanding the process it has to support.',
        primaryCtaLabel: 'All services',
        primaryCtaHref: '/services',
        settings: { limit: 6 },
      },
      {
        internalName: 'Product ecosystem',
        type: 'PRODUCT_GRID',
        theme: 'DARK',
        eyebrow: '03 — The Key family',
        heading: 'Products we are building ourselves',
        description:
          'Key-branded products apply what we build for clients to problems we chose to take on directly.',
        primaryCtaLabel: 'Explore our products',
        primaryCtaHref: '/products',
        settings: { limit: 4 },
      },
      {
        internalName: 'Solutions',
        type: 'SOLUTION_GRID',
        theme: 'WHITE',
        eyebrow: '04 — Solutions',
        heading: 'Common problems, worked through end to end',
        description:
          'Each solution describes the business challenge, the capabilities that address it and the workflow it produces.',
        primaryCtaLabel: 'All solutions',
        primaryCtaHref: '/solutions',
        settings: { limit: 6 },
      },
      {
        internalName: 'Industries',
        type: 'INDUSTRY_GRID',
        theme: 'SOFT_TEAL',
        eyebrow: '05 — Industries',
        heading: 'Sectors we understand well enough to argue with',
        settings: { limit: 8 },
      },
      {
        internalName: 'Why Key Tech',
        type: 'VALUES',
        theme: 'WHITE',
        eyebrow: '06 — Why Key Tech',
        heading: 'How we work',
        description: 'Six commitments that shape what we ship and how we talk about it.',
      },
      {
        internalName: 'Development process',
        type: 'PROCESS_STEPS',
        theme: 'SOFT_PURPLE',
        eyebrow: '07 — Process',
        heading: 'Ten phases, from first conversation to continuous improvement',
        description:
          'A predictable sequence with named deliverables, so you always know where a project is and what comes next.',
        primaryCtaLabel: 'See the full process',
        primaryCtaHref: '/process',
      },
      {
        internalName: 'Featured portfolio',
        type: 'PORTFOLIO_GRID',
        theme: 'WHITE',
        eyebrow: '08 — Portfolio',
        heading: 'Work in progress and platforms in production',
        primaryCtaLabel: 'View portfolio',
        primaryCtaHref: '/portfolio',
        settings: { limit: 3 },
      },
      {
        internalName: 'Technology stack',
        type: 'TECHNOLOGY_GRID',
        theme: 'LIGHT',
        eyebrow: '09 — Technology',
        heading: 'The stack we work in every day',
        description:
          'Chosen for maintainability and for the fact that another team can pick the codebase up later.',
        primaryCtaLabel: 'Technology stack',
        primaryCtaHref: '/technology',
      },
      {
        internalName: 'Capability statistics',
        type: 'STATISTICS',
        theme: 'BRAND_GRADIENT',
        eyebrow: '10 — At a glance',
        heading: 'Where Key Tech is today',
        description: 'Figures drawn from this platform, not from a marketing estimate.',
        settings: { group: 'home' },
      },
      {
        internalName: 'Insights preview',
        type: 'BLOG_PREVIEW',
        theme: 'WHITE',
        eyebrow: '11 — Insights',
        heading: 'Notes from the work',
        description:
          'Engineering write-ups, product updates and practical notes for people commissioning software.',
        primaryCtaLabel: 'Read insights',
        primaryCtaHref: '/blog',
        settings: { limit: 3 },
      },
      {
        internalName: 'Closing call to action',
        type: 'CTA',
        theme: 'DARK',
        heading: 'Have a system that needs building, or one that needs fixing?',
        description:
          'Tell us what the business needs to do differently. We will tell you plainly whether we are the right people to build it.',
        primaryCtaLabel: 'Start a Project',
        primaryCtaHref: '/request-a-quote',
        secondaryCtaLabel: 'Contact us',
        secondaryCtaHref: '/contact',
      },
    ],
  },
  {
    slug: 'about',
    path: '/about',
    title: 'About Key Tech Solutions',
    eyebrow: 'About',
    headline: 'The company behind the Key product family',
    subheadline:
      'Key Tech Solutions builds software for other businesses and builds its own products on the same foundations.',
    isSystem: true,
    seoTitle: 'About Key Tech Solutions',
    seoDescription:
      'Key Tech Solutions is a software development company and the parent organisation behind KeySportsBooking and KeyAutoParts. How we work, what we value and what we are building.',
    sitemapPriority: 0.8,
    sections: [
      {
        internalName: 'Overview',
        type: 'RICH_TEXT',
        theme: 'WHITE',
        eyebrow: '01 — Overview',
        heading: 'What Key Tech Solutions is',
        bodyHtml:
          '<p>Key Tech Solutions is a technology development company. We design and build web applications, SaaS products, booking platforms, commerce systems, customer portals and the APIs and databases underneath them.</p>' +
          '<p>We are also the parent organisation behind the Key-branded product family. KeySportsBooking and KeyAutoParts are our own products, built and maintained by the same team that takes on client work.</p>' +
          '<p>That dual role is deliberate. Maintaining products we have to live with keeps us honest about the recommendations we make to other people.</p>',
      },
      {
        internalName: 'Mission and vision',
        type: 'SPLIT_CONTENT',
        theme: 'SOFT_PURPLE',
        layoutVariant: 'two-column',
        eyebrow: '02 — Direction',
        heading: 'Mission and vision',
        bodyHtml:
          '<h3>Mission</h3><p>To build software that removes friction from how a business operates, and to hand it over in a state the business can own.</p>' +
          '<h3>Vision</h3><p>To grow a family of Key-branded products that solve specific operational problems well, funded and informed by the client work we do alongside them.</p>',
      },
      {
        internalName: 'Values',
        type: 'VALUES',
        theme: 'WHITE',
        eyebrow: '03 — Values',
        heading: 'What we hold ourselves to',
      },
      {
        internalName: 'Technology philosophy',
        type: 'RICH_TEXT',
        theme: 'LIGHT',
        eyebrow: '04 — Philosophy',
        heading: 'How we choose technology',
        bodyHtml:
          '<p>We pick boring, well-supported technology on purpose. TypeScript end to end, PostgreSQL for data, server rendering for anything a search engine needs to read, and containers so the same artefact runs everywhere.</p>' +
          '<p>The test we apply is not "is this the most capable option" but "can another competent team maintain this in three years". That rules out a lot of interesting choices, which is the point.</p>' +
          '<p>Where we do spend complexity budget, it is on the data model. Schemas are the hardest thing to change later, so they get the most argument up front.</p>',
      },
      {
        internalName: 'Product ecosystem',
        type: 'PRODUCT_GRID',
        theme: 'DARK',
        eyebrow: '05 — Products',
        heading: 'The Key product family',
        description: 'Products built and maintained by Key Tech Solutions.',
        settings: { limit: 4 },
      },
      {
        internalName: 'Timeline',
        type: 'TIMELINE',
        theme: 'WHITE',
        eyebrow: '06 — Timeline',
        heading: 'Where we are in the story',
      },
      {
        internalName: 'Process',
        type: 'PROCESS_STEPS',
        theme: 'SOFT_TEAL',
        eyebrow: '07 — Process',
        heading: 'How an engagement runs',
      },
      {
        internalName: 'About CTA',
        type: 'CTA',
        theme: 'BRAND_GRADIENT',
        heading: 'Want to talk about a project?',
        description:
          'Start with the problem. We will be straightforward about whether we can help.',
        primaryCtaLabel: 'Start a Project',
        primaryCtaHref: '/request-a-quote',
      },
    ],
  },
  {
    slug: 'contact',
    path: '/contact',
    title: 'Contact Key Tech Solutions',
    eyebrow: 'Contact',
    headline: 'Tell us what needs building',
    subheadline: 'Send a message and a member of the team will reply by email.',
    isSystem: true,
    seoTitle: 'Contact Key Tech Solutions',
    seoDescription:
      'Contact Key Tech Solutions about a web application, SaaS product, booking platform or business system. Send a message and the team will reply by email.',
    sitemapPriority: 0.7,
    sections: [
      {
        internalName: 'Contact form',
        type: 'CONTACT_BLOCK',
        theme: 'WHITE',
        heading: 'Send a message',
        description:
          'Tell us what the business needs to do differently. The more concrete the problem, the more useful our first reply will be.',
      },
    ],
  },
  {
    slug: 'request-a-quote',
    path: '/request-a-quote',
    title: 'Request a Quote',
    eyebrow: 'Start a project',
    headline: 'Request a quote',
    subheadline:
      'A few structured questions so the first conversation starts from something concrete rather than from scratch.',
    isSystem: true,
    seoTitle: 'Request a Quote',
    seoDescription:
      'Request a quote from Key Tech Solutions for a custom web application, SaaS product, booking platform, e-commerce build or business system.',
    sitemapPriority: 0.7,
    sections: [
      {
        internalName: 'Quote form',
        type: 'CONTACT_BLOCK',
        theme: 'WHITE',
        layoutVariant: 'quote',
        heading: 'Project details',
        description:
          'Nothing here is binding. It gives us enough to reply with a realistic range and the questions that would narrow it.',
      },
    ],
  },
  {
    slug: 'privacy',
    path: '/privacy',
    title: 'Privacy Policy',
    eyebrow: 'Legal',
    headline: 'Privacy policy',
    isSystem: true,
    seoTitle: 'Privacy Policy',
    seoDescription:
      'How Key Tech Solutions collects, uses, stores and protects personal information.',
    sitemapPriority: 0.3,
    sections: [
      {
        internalName: 'Privacy content',
        type: 'RICH_TEXT',
        theme: 'WHITE',
        layoutVariant: 'legal',
        bodyHtml:
          '<p><strong>This policy is a starting template and must be reviewed against the law that applies to your organisation before publication.</strong></p>' +
          '<h2>What we collect</h2>' +
          '<p>When you submit the contact form, the quote request form, a newsletter sign-up or a job application, we collect the information you enter, together with the page you submitted from, your IP address and your browser user agent.</p>' +
          '<h2>Why we collect it</h2>' +
          '<p>Enquiry and quote information is used to respond to your enquiry. Job application information is used to assess your application. Newsletter details are used only to send the newsletter. IP address and user agent are recorded to detect automated abuse of these forms.</p>' +
          '<h2>How long we keep it</h2>' +
          '<p>Enquiries are retained while they remain commercially relevant and are then archived. Applications are retained for the duration of the recruitment process and any period you have agreed to. You can ask us to delete your information at any time.</p>' +
          '<h2>Who can see it</h2>' +
          '<p>Access is restricted by role. Enquiries are visible to staff responsible for handling them; applications and uploaded CVs are visible only to staff involved in recruitment. Every access to an uploaded document is recorded in an audit log.</p>' +
          '<h2>Files you upload</h2>' +
          '<p>Documents you attach are stored privately. They are never published, never indexed and never served from a public address. Staff access them through a short-lived, single-file authorised link.</p>' +
          '<h2>Cookies</h2>' +
          '<p>The public website sets no tracking cookies. The administration panel sets one essential session cookie for signed-in staff.</p>' +
          '<h2>Your rights</h2>' +
          '<p>You can request a copy of the information we hold about you, ask for it to be corrected, or ask for it to be deleted. Contact us using the details on the contact page.</p>' +
          '<h2>Changes</h2>' +
          '<p>Material changes to this policy will be reflected on this page, with the revision date updated.</p>',
      },
    ],
  },
  {
    slug: 'terms',
    path: '/terms',
    title: 'Terms of Use',
    eyebrow: 'Legal',
    headline: 'Terms of use',
    isSystem: true,
    seoTitle: 'Terms of Use',
    seoDescription: 'The terms that apply to use of the Key Tech Solutions website.',
    sitemapPriority: 0.3,
    sections: [
      {
        internalName: 'Terms content',
        type: 'RICH_TEXT',
        theme: 'WHITE',
        layoutVariant: 'legal',
        bodyHtml:
          '<p><strong>These terms are a starting template and must be reviewed by a qualified adviser before publication.</strong></p>' +
          '<h2>Using this website</h2>' +
          '<p>This website is provided for information about Key Tech Solutions and its services and products. You may read, print and share its content for your own reference.</p>' +
          '<h2>Accuracy</h2>' +
          '<p>We keep the content current, but it is provided without warranty. Product capabilities described as in development may change. Nothing on this website is an offer capable of acceptance, and nothing forms a contract.</p>' +
          '<h2>Intellectual property</h2>' +
          '<p>The content, design and branding of this website belong to Key Tech Solutions unless stated otherwise. Third-party names and marks belong to their respective owners and are used descriptively only.</p>' +
          '<h2>Submissions</h2>' +
          '<p>When you submit a form you confirm that the information is accurate and that you are entitled to provide it. Do not submit confidential information belonging to a third party.</p>' +
          '<h2>Links</h2>' +
          '<p>Links to other websites are provided for convenience. We are not responsible for their content.</p>' +
          '<h2>Liability</h2>' +
          '<p>To the extent permitted by law, Key Tech Solutions is not liable for loss arising from use of this website. Nothing here limits liability that cannot lawfully be limited.</p>',
      },
    ],
  },
  {
    slug: 'cookie-policy',
    path: '/cookie-policy',
    title: 'Cookie Policy',
    eyebrow: 'Legal',
    headline: 'Cookie policy',
    isSystem: true,
    seoTitle: 'Cookie Policy',
    seoDescription: 'Which cookies the Key Tech Solutions website uses, and why.',
    sitemapPriority: 0.3,
    sections: [
      {
        internalName: 'Cookie content',
        type: 'RICH_TEXT',
        theme: 'WHITE',
        layoutVariant: 'legal',
        bodyHtml:
          '<p><strong>Review this policy against your final analytics and integration choices before publication.</strong></p>' +
          '<h2>The public website</h2>' +
          '<p>As delivered, the public website sets no tracking or advertising cookies and includes no third-party tracking scripts. If analytics are enabled later, this page must be updated and consent handled accordingly.</p>' +
          '<h2>The administration panel</h2>' +
          '<p>The administration panel sets one essential cookie to keep signed-in staff authenticated. It is HttpOnly, restricted to the administration origin, and contains an opaque session identifier rather than personal data. It cannot be disabled, because signing in is impossible without it.</p>' +
          '<h2>Managing cookies</h2>' +
          '<p>Your browser can block or delete cookies. Blocking the administration session cookie will prevent staff sign-in; it has no effect on the public website.</p>',
      },
    ],
  },
];

export const NAVIGATION_ITEMS = [
  { label: 'Home', href: '/' },
  {
    label: 'About',
    href: '/about',
    children: [
      { label: 'About Key Tech', href: '/about', description: 'Who we are and how we work' },
      {
        label: 'Our process',
        href: '/process',
        description: 'Ten phases from discovery to improvement',
      },
      { label: 'Technology', href: '/technology', description: 'The stack we build on' },
    ],
  },
  {
    label: 'Services',
    href: '/services',
    children: [
      { label: 'All services', href: '/services', description: 'The full capability list' },
      { label: 'Custom web applications', href: '/services/custom-web-application-development' },
      { label: 'SaaS product development', href: '/services/saas-product-development' },
      { label: 'Booking platforms', href: '/services/booking-and-reservation-platforms' },
      { label: 'SEO-focused development', href: '/services/seo-focused-development' },
    ],
  },
  {
    label: 'Solutions',
    href: '/solutions',
    children: [
      { label: 'All solutions', href: '/solutions' },
      { label: 'Sports venue booking', href: '/solutions/sports-venue-booking' },
      { label: 'Automotive parts management', href: '/solutions/automotive-parts-management' },
      { label: 'Industries we work in', href: '/industries' },
    ],
  },
  {
    label: 'Products',
    href: '/products',
    highlight: true,
    children: [
      { label: 'All products', href: '/products' },
      {
        label: 'KeySportsBooking',
        href: '/products/keysportsbooking',
        description: 'Venue discovery and booking',
      },
      {
        label: 'KeyAutoParts',
        href: '/products/keyautoparts',
        description: 'Parts catalogue and ordering',
      },
    ],
  },
  {
    label: 'Portfolio',
    href: '/portfolio',
    children: [
      { label: 'Portfolio', href: '/portfolio' },
      { label: 'Case studies', href: '/case-studies' },
    ],
  },
  { label: 'Insights', href: '/blog' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
];

export const FOOTER_GROUPS = [
  {
    key: 'company',
    title: 'Company',
    sortOrder: 0,
    links: [
      { label: 'About', href: '/about' },
      { label: 'Our process', href: '/process' },
      { label: 'Technology', href: '/technology' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    key: 'services',
    title: 'Services',
    sortOrder: 1,
    links: [
      { label: 'Custom web applications', href: '/services/custom-web-application-development' },
      { label: 'SaaS product development', href: '/services/saas-product-development' },
      { label: 'Business process automation', href: '/services/business-process-automation' },
      { label: 'Booking platforms', href: '/services/booking-and-reservation-platforms' },
      { label: 'All services', href: '/services' },
    ],
  },
  {
    key: 'products',
    title: 'Products',
    sortOrder: 2,
    links: [
      { label: 'KeySportsBooking', href: '/products/keysportsbooking' },
      { label: 'KeyAutoParts', href: '/products/keyautoparts' },
      { label: 'All products', href: '/products' },
      { label: 'Solutions', href: '/solutions' },
      { label: 'Industries', href: '/industries' },
    ],
  },
  {
    key: 'resources',
    title: 'Resources',
    sortOrder: 3,
    links: [
      { label: 'Insights', href: '/blog' },
      { label: 'Portfolio', href: '/portfolio' },
      { label: 'Case studies', href: '/case-studies' },
      { label: 'Request a quote', href: '/request-a-quote' },
    ],
  },
  {
    key: 'legal',
    title: 'Legal',
    sortOrder: 4,
    links: [
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Terms of use', href: '/terms' },
      { label: 'Cookie policy', href: '/cookie-policy' },
    ],
  },
];
