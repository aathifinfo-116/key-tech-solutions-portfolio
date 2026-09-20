/**
 * Content resource registry.
 *
 * One entry per manageable content type. The generic list and edit screens
 * read this registry, so adding a resource is a data change rather than two
 * new pages. Field definitions here drive the edit form; the API validates the
 * same payload with Zod, so the form cannot widen what is accepted.
 */

import type { AdminResource } from '@kts/api-client';

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'slug'
  | 'number'
  | 'boolean'
  | 'select'
  | 'stringList'
  | 'date'
  | 'color'
  | 'url';

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  optional?: boolean;
  options?: Array<{ value: string; label: string }>;
  /** Fields in the same group render together under one heading. */
  group?: string;
  rows?: number;
}

export interface ColumnDef {
  key: string;
  label: string;
  /** `status` renders a StatusBadge, `date` formats, `link` opens the record. */
  render?: 'text' | 'status' | 'date' | 'boolean' | 'link' | 'muted';
  sortable?: boolean;
}

export interface ResourceDef {
  /** URL segment inside the admin panel. */
  key: string;
  /** API resource segment. */
  api: AdminResource;
  singular: string;
  plural: string;
  description: string;
  permissionFamily: string;
  /** Uses the draft/review/publish workflow. */
  publishable: boolean;
  /** Public URL prefix, for the "view live" link. */
  publicPath?: string;
  /** Slug used for the preview route, when previewable. */
  previewType?: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  /** Field whose value titles the record. */
  titleField: string;
  hasSeo: boolean;
}

const STATUS_COLUMN: ColumnDef = { key: 'status', label: 'Status', render: 'status' };
const UPDATED_COLUMN: ColumnDef = {
  key: 'updatedAt',
  label: 'Updated',
  render: 'date',
  sortable: true,
};

const SEO_NOTE = 'Leave blank to fall back to the page heading and summary.';

/**
 * Fields every publishable resource shares.
 *
 * Publication status is deliberately absent. It is not a value you save with
 * the rest of the form: the API only moves a record between draft and
 * published through its workflow transition, which checks the publish
 * permission and which states may follow which. The editor reads the current
 * status, and changes it, in the Publication workflow panel.
 */
const workflowFields: FieldDef[] = [
  {
    name: 'scheduledAt',
    label: 'Scheduled publication',
    kind: 'date',
    optional: true,
    group: 'Publishing',
    hint: 'Required when the status is Scheduled. Must be in the future.',
  },
  {
    name: 'createRedirectOnSlugChange',
    label: 'Create a 301 redirect if the slug changes',
    kind: 'boolean',
    group: 'Publishing',
    hint: 'Keeps inbound links and indexed results working after a rename.',
  },
  {
    name: 'changeSummary',
    label: 'Change summary',
    kind: 'text',
    optional: true,
    group: 'Publishing',
    hint: 'Recorded against this revision so the history explains itself.',
  },
];

const seoFields: FieldDef[] = [
  {
    name: 'seo.title',
    label: 'SEO title',
    kind: 'text',
    optional: true,
    group: 'SEO',
    hint: SEO_NOTE,
  },
  {
    name: 'seo.description',
    label: 'Meta description',
    kind: 'textarea',
    optional: true,
    group: 'SEO',
    rows: 3,
    hint: SEO_NOTE,
  },
  {
    name: 'seo.canonicalUrl',
    label: 'Canonical URL',
    kind: 'url',
    optional: true,
    group: 'SEO',
    hint: 'Only set this when this page duplicates another.',
  },
  {
    name: 'seo.robotsIndex',
    label: 'Allow search engines to index this page',
    kind: 'boolean',
    group: 'SEO',
  },
  {
    name: 'seo.robotsFollow',
    label: 'Allow search engines to follow its links',
    kind: 'boolean',
    group: 'SEO',
  },
  { name: 'seo.includeInSitemap', label: 'Include in the sitemap', kind: 'boolean', group: 'SEO' },
  {
    name: 'seo.sitemapPriority',
    label: 'Sitemap priority',
    kind: 'number',
    group: 'SEO',
    hint: '0 to 1. A hint only; search engines are free to ignore it.',
  },
];

export const RESOURCES: ResourceDef[] = [
  {
    key: 'pages',
    api: 'pages',
    singular: 'Page',
    plural: 'Pages',
    description: 'Website pages and the sections they are built from.',
    permissionFamily: 'pages',
    publishable: true,
    previewType: 'page',
    titleField: 'title',
    hasSeo: true,
    columns: [
      { key: 'title', label: 'Title', render: 'link', sortable: true },
      { key: 'path', label: 'Path', render: 'muted' },
      STATUS_COLUMN,
      UPDATED_COLUMN,
    ],
    fields: [
      { name: 'title', label: 'Page title', kind: 'text', group: 'Content' },
      { name: 'slug', label: 'Slug', kind: 'slug', group: 'Content' },
      {
        name: 'path',
        label: 'Path',
        kind: 'text',
        group: 'Content',
        hint: 'Must start with /. Cannot begin with /admin or /api.',
      },
      { name: 'eyebrow', label: 'Eyebrow', kind: 'text', optional: true, group: 'Content' },
      { name: 'headline', label: 'Headline', kind: 'text', optional: true, group: 'Content' },
      { name: 'subheadline', label: 'Subheadline', kind: 'text', optional: true, group: 'Content' },
      {
        name: 'summary',
        label: 'Summary',
        kind: 'textarea',
        optional: true,
        group: 'Content',
        rows: 3,
      },
      { name: 'showInSitemap', label: 'Show in the sitemap', kind: 'boolean', group: 'Publishing' },
      ...workflowFields,
      ...seoFields,
    ],
  },
  {
    key: 'services',
    api: 'services',
    singular: 'Service',
    plural: 'Services',
    description: 'What Key Tech Solutions offers, grouped into categories.',
    permissionFamily: 'services',
    publishable: true,
    publicPath: '/services',
    previewType: 'service',
    titleField: 'name',
    hasSeo: true,
    columns: [
      { key: 'name', label: 'Service', render: 'link', sortable: true },
      { key: 'category.name', label: 'Category', render: 'muted' },
      { key: 'isFeatured', label: 'Featured', render: 'boolean' },
      STATUS_COLUMN,
      UPDATED_COLUMN,
    ],
    fields: [
      { name: 'name', label: 'Service name', kind: 'text', group: 'Content' },
      { name: 'slug', label: 'Slug', kind: 'slug', group: 'Content' },
      {
        name: 'shortDescription',
        label: 'Short description',
        kind: 'textarea',
        group: 'Content',
        rows: 2,
        hint: 'Shown on cards and in search results.',
      },
      {
        name: 'fullDescription',
        label: 'Full description',
        kind: 'richtext',
        optional: true,
        group: 'Content',
      },
      { name: 'iconName', label: 'Icon name', kind: 'text', optional: true, group: 'Content' },
      { name: 'benefits', label: 'Benefits', kind: 'stringList', group: 'Detail' },
      { name: 'capabilities', label: 'Capabilities', kind: 'stringList', group: 'Detail' },
      { name: 'deliverables', label: 'Deliverables', kind: 'stringList', group: 'Detail' },
      {
        name: 'isFeatured',
        label: 'Feature on the homepage',
        kind: 'boolean',
        group: 'Publishing',
      },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', group: 'Publishing' },
      ...workflowFields,
      ...seoFields,
    ],
  },
  {
    key: 'solutions',
    api: 'solutions',
    singular: 'Solution',
    plural: 'Solutions',
    description: 'Business problems and how Key Tech addresses them.',
    permissionFamily: 'solutions',
    publishable: true,
    publicPath: '/solutions',
    previewType: 'solution',
    titleField: 'name',
    hasSeo: true,
    columns: [
      { key: 'name', label: 'Solution', render: 'link', sortable: true },
      { key: 'isFeatured', label: 'Featured', render: 'boolean' },
      STATUS_COLUMN,
      UPDATED_COLUMN,
    ],
    fields: [
      { name: 'name', label: 'Solution name', kind: 'text', group: 'Content' },
      { name: 'slug', label: 'Slug', kind: 'slug', group: 'Content' },
      { name: 'summary', label: 'Summary', kind: 'textarea', group: 'Content', rows: 2 },
      {
        name: 'businessChallenge',
        label: 'Business challenge',
        kind: 'richtext',
        optional: true,
        group: 'Content',
      },
      { name: 'overview', label: 'Overview', kind: 'richtext', optional: true, group: 'Content' },
      { name: 'capabilities', label: 'Capabilities', kind: 'stringList', group: 'Detail' },
      { name: 'userTypes', label: 'User types', kind: 'stringList', group: 'Detail' },
      { name: 'benefits', label: 'Benefits', kind: 'stringList', group: 'Detail' },
      { name: 'integrations', label: 'Integrations', kind: 'stringList', group: 'Detail' },
      { name: 'iconName', label: 'Icon name', kind: 'text', optional: true, group: 'Detail' },
      {
        name: 'isFeatured',
        label: 'Feature on the homepage',
        kind: 'boolean',
        group: 'Publishing',
      },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', group: 'Publishing' },
      ...workflowFields,
      ...seoFields,
    ],
  },
  {
    key: 'industries',
    api: 'industries',
    singular: 'Industry',
    plural: 'Industries',
    description: 'Sectors Key Tech Solutions works in.',
    permissionFamily: 'industries',
    publishable: true,
    publicPath: '/industries',
    titleField: 'name',
    hasSeo: true,
    columns: [
      { key: 'name', label: 'Industry', render: 'link', sortable: true },
      STATUS_COLUMN,
      UPDATED_COLUMN,
    ],
    fields: [
      { name: 'name', label: 'Industry name', kind: 'text', group: 'Content' },
      { name: 'slug', label: 'Slug', kind: 'slug', group: 'Content' },
      { name: 'summary', label: 'Summary', kind: 'textarea', group: 'Content', rows: 2 },
      {
        name: 'introduction',
        label: 'Introduction',
        kind: 'richtext',
        optional: true,
        group: 'Content',
      },
      { name: 'challenges', label: 'Sector challenges', kind: 'stringList', group: 'Detail' },
      { name: 'capabilities', label: 'How we help', kind: 'stringList', group: 'Detail' },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', group: 'Publishing' },
      ...workflowFields,
      ...seoFields,
    ],
  },
  {
    key: 'products',
    api: 'products',
    singular: 'Product',
    plural: 'Products',
    description: 'The Key-branded product family.',
    permissionFamily: 'products',
    publishable: true,
    publicPath: '/products',
    previewType: 'product',
    titleField: 'name',
    hasSeo: true,
    columns: [
      { key: 'name', label: 'Product', render: 'link', sortable: true },
      { key: 'productStatus', label: 'Product status', render: 'status' },
      { key: 'isFeatured', label: 'Featured', render: 'boolean' },
      STATUS_COLUMN,
      UPDATED_COLUMN,
    ],
    fields: [
      { name: 'name', label: 'Product name', kind: 'text', group: 'Content' },
      { name: 'slug', label: 'Slug', kind: 'slug', group: 'Content' },
      { name: 'tagline', label: 'Tagline', kind: 'text', optional: true, group: 'Content' },
      { name: 'summary', label: 'Summary', kind: 'textarea', group: 'Content', rows: 3 },
      {
        name: 'fullDescription',
        label: 'Full description',
        kind: 'richtext',
        optional: true,
        group: 'Content',
      },
      {
        name: 'problemSolved',
        label: 'Problem solved',
        kind: 'richtext',
        optional: true,
        group: 'Content',
      },
      {
        name: 'productStatus',
        label: 'Development status',
        kind: 'select',
        group: 'Detail',
        hint: 'Shown to visitors. Keep it honest: it sets expectations.',
        options: [
          { value: 'CONCEPT', label: 'Concept' },
          { value: 'PLANNED', label: 'Planned' },
          { value: 'IN_DEVELOPMENT', label: 'In development' },
          { value: 'COMING_SOON', label: 'Coming soon' },
          { value: 'BETA', label: 'Beta' },
          { value: 'LIVE', label: 'Live' },
          { value: 'MAINTENANCE', label: 'Maintenance' },
          { value: 'RETIRED', label: 'Retired' },
        ],
      },
      { name: 'category', label: 'Category', kind: 'text', optional: true, group: 'Detail' },
      { name: 'launchLabel', label: 'Launch label', kind: 'text', optional: true, group: 'Detail' },
      {
        name: 'businessModel',
        label: 'Business model',
        kind: 'text',
        optional: true,
        group: 'Detail',
      },
      { name: 'targetUsers', label: 'Target users', kind: 'stringList', group: 'Detail' },
      { name: 'benefits', label: 'Benefits', kind: 'stringList', group: 'Detail' },
      { name: 'websiteUrl', label: 'Website URL', kind: 'url', optional: true, group: 'Links' },
      { name: 'demoUrl', label: 'Demo URL', kind: 'url', optional: true, group: 'Links' },
      {
        name: 'documentationUrl',
        label: 'Documentation URL',
        kind: 'url',
        optional: true,
        group: 'Links',
      },
      {
        name: 'demoVideoUrl',
        label: 'Demo video URL',
        kind: 'url',
        optional: true,
        group: 'Links',
        hint: 'YouTube or Vimeo only.',
      },
      {
        name: 'brandPrimary',
        label: 'Product primary colour',
        kind: 'color',
        optional: true,
        group: 'Branding',
      },
      {
        name: 'brandSecondary',
        label: 'Product secondary colour',
        kind: 'color',
        optional: true,
        group: 'Branding',
      },
      {
        name: 'isFeatured',
        label: 'Feature on the homepage',
        kind: 'boolean',
        group: 'Publishing',
      },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', group: 'Publishing' },
      ...workflowFields,
      ...seoFields,
    ],
  },
  {
    key: 'portfolio',
    api: 'portfolio',
    singular: 'Project',
    plural: 'Portfolio projects',
    description: 'Delivered and in-progress work.',
    permissionFamily: 'portfolio',
    publishable: true,
    publicPath: '/portfolio',
    previewType: 'portfolio',
    titleField: 'title',
    hasSeo: true,
    columns: [
      { key: 'title', label: 'Project', render: 'link', sortable: true },
      { key: 'projectStatus', label: 'Project status', render: 'status' },
      { key: 'isCustomerConfidential', label: 'Confidential', render: 'boolean' },
      STATUS_COLUMN,
      UPDATED_COLUMN,
    ],
    fields: [
      { name: 'title', label: 'Project title', kind: 'text', group: 'Content' },
      { name: 'slug', label: 'Slug', kind: 'slug', group: 'Content' },
      { name: 'summary', label: 'Summary', kind: 'textarea', group: 'Content', rows: 3 },
      { name: 'challenge', label: 'Challenge', kind: 'richtext', optional: true, group: 'Content' },
      { name: 'approach', label: 'Approach', kind: 'richtext', optional: true, group: 'Content' },
      { name: 'solution', label: 'Solution', kind: 'richtext', optional: true, group: 'Content' },
      {
        name: 'isCustomerConfidential',
        label: 'Customer identity is confidential',
        kind: 'boolean',
        group: 'Customer',
        hint: 'When ticked the customer name must be left blank and is never published.',
      },
      {
        name: 'customerDisplayName',
        label: 'Customer display name',
        kind: 'text',
        optional: true,
        group: 'Customer',
      },
      {
        name: 'projectStatus',
        label: 'Project status',
        kind: 'select',
        group: 'Detail',
        options: [
          { value: 'PLANNED', label: 'Planned' },
          { value: 'IN_PROGRESS', label: 'In progress' },
          { value: 'ONGOING', label: 'Ongoing' },
          { value: 'COMPLETED', label: 'Completed' },
          { value: 'MAINTENANCE', label: 'Maintenance' },
          { value: 'PRIVATE', label: 'Private (never published)' },
        ],
      },
      { name: 'category', label: 'Category', kind: 'text', optional: true, group: 'Detail' },
      { name: 'startDate', label: 'Start date', kind: 'date', optional: true, group: 'Detail' },
      {
        name: 'completionDate',
        label: 'Completion date',
        kind: 'date',
        optional: true,
        group: 'Detail',
      },
      { name: 'features', label: 'Features', kind: 'stringList', group: 'Detail' },
      { name: 'deliverables', label: 'Deliverables', kind: 'stringList', group: 'Detail' },
      { name: 'publicUrl', label: 'Public URL', kind: 'url', optional: true, group: 'Links' },
      { name: 'demoUrl', label: 'Demo URL', kind: 'url', optional: true, group: 'Links' },
      {
        name: 'isFeatured',
        label: 'Feature on the homepage',
        kind: 'boolean',
        group: 'Publishing',
      },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', group: 'Publishing' },
      ...workflowFields,
      ...seoFields,
    ],
  },
  {
    key: 'case-studies',
    api: 'case-studies',
    singular: 'Case study',
    plural: 'Case studies',
    description: 'In-depth write-ups. Results are published only when verified.',
    permissionFamily: 'case-studies',
    publishable: true,
    publicPath: '/case-studies',
    previewType: 'case-study',
    titleField: 'title',
    hasSeo: true,
    columns: [
      { key: 'title', label: 'Case study', render: 'link', sortable: true },
      { key: 'approvedCustomerName', label: 'Customer', render: 'muted' },
      STATUS_COLUMN,
      UPDATED_COLUMN,
    ],
    fields: [
      { name: 'title', label: 'Title', kind: 'text', group: 'Content' },
      { name: 'slug', label: 'Slug', kind: 'slug', group: 'Content' },
      { name: 'summary', label: 'Summary', kind: 'textarea', group: 'Content', rows: 3 },
      {
        name: 'background',
        label: 'Background',
        kind: 'richtext',
        optional: true,
        group: 'Narrative',
      },
      {
        name: 'challenge',
        label: 'Challenge',
        kind: 'richtext',
        optional: true,
        group: 'Narrative',
      },
      {
        name: 'discovery',
        label: 'Discovery',
        kind: 'richtext',
        optional: true,
        group: 'Narrative',
      },
      { name: 'strategy', label: 'Strategy', kind: 'richtext', optional: true, group: 'Narrative' },
      { name: 'design', label: 'Design', kind: 'richtext', optional: true, group: 'Narrative' },
      {
        name: 'architecture',
        label: 'Architecture',
        kind: 'richtext',
        optional: true,
        group: 'Narrative',
      },
      {
        name: 'development',
        label: 'Development',
        kind: 'richtext',
        optional: true,
        group: 'Narrative',
      },
      { name: 'solution', label: 'Solution', kind: 'richtext', optional: true, group: 'Narrative' },
      {
        name: 'results',
        label: 'Results',
        kind: 'richtext',
        optional: true,
        group: 'Narrative',
        hint: 'Only describe outcomes you can substantiate.',
      },
      {
        name: 'isCustomerApproved',
        label: 'The customer has approved being named',
        kind: 'boolean',
        group: 'Customer',
        hint: 'Required before a customer name can be saved or published.',
      },
      {
        name: 'approvedCustomerName',
        label: 'Approved customer name',
        kind: 'text',
        optional: true,
        group: 'Customer',
      },
      {
        name: 'isFeatured',
        label: 'Feature on the homepage',
        kind: 'boolean',
        group: 'Publishing',
      },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', group: 'Publishing' },
      ...workflowFields,
      ...seoFields,
    ],
  },
  {
    key: 'blog',
    api: 'blog',
    singular: 'Article',
    plural: 'Insights',
    description: 'Blog posts, product updates and technical guides.',
    permissionFamily: 'blog',
    publishable: true,
    publicPath: '/blog',
    previewType: 'blog',
    titleField: 'title',
    hasSeo: true,
    columns: [
      { key: 'title', label: 'Article', render: 'link', sortable: true },
      { key: 'category.name', label: 'Category', render: 'muted' },
      { key: 'publishedAt', label: 'Published', render: 'date', sortable: true },
      STATUS_COLUMN,
    ],
    fields: [
      { name: 'title', label: 'Title', kind: 'text', group: 'Content' },
      { name: 'slug', label: 'Slug', kind: 'slug', group: 'Content' },
      {
        name: 'excerpt',
        label: 'Excerpt',
        kind: 'textarea',
        group: 'Content',
        rows: 3,
        hint: 'Used on cards and as the default meta description.',
      },
      {
        name: 'contentHtml',
        label: 'Article body',
        kind: 'richtext',
        optional: true,
        group: 'Content',
      },
      {
        name: 'postType',
        label: 'Type',
        kind: 'select',
        group: 'Detail',
        options: [
          { value: 'ARTICLE', label: 'Article' },
          { value: 'TECHNICAL_GUIDE', label: 'Technical guide' },
          { value: 'PRODUCT_UPDATE', label: 'Product update' },
          { value: 'RELEASE_NOTE', label: 'Release note' },
          { value: 'CASE_STUDY', label: 'Case study' },
          { value: 'COMPANY_NEWS', label: 'Company news' },
          { value: 'INDUSTRY_INSIGHT', label: 'Industry insight' },
        ],
      },
      {
        name: 'tagSlugs',
        label: 'Tags',
        kind: 'stringList',
        group: 'Detail',
        hint: 'New tags are created automatically.',
      },
      {
        name: 'isFeatured',
        label: 'Feature on the homepage',
        kind: 'boolean',
        group: 'Publishing',
      },
      ...workflowFields,
      ...seoFields,
    ],
  },
  {
    key: 'blog-categories',
    api: 'blog-categories',
    singular: 'Blog category',
    plural: 'Blog categories',
    description: 'Groupings for insights.',
    permissionFamily: 'blog',
    publishable: false,
    titleField: 'name',
    hasSeo: true,
    columns: [
      { key: 'name', label: 'Category', render: 'link', sortable: true },
      { key: 'slug', label: 'Slug', render: 'muted' },
      { key: 'postCount', label: 'Articles' },
    ],
    fields: [
      { name: 'name', label: 'Category name', kind: 'text', group: 'Content' },
      { name: 'slug', label: 'Slug', kind: 'slug', group: 'Content' },
      {
        name: 'description',
        label: 'Description',
        kind: 'textarea',
        optional: true,
        group: 'Content',
        rows: 2,
      },
      {
        name: 'accentColor',
        label: 'Accent colour',
        kind: 'color',
        optional: true,
        group: 'Content',
      },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', group: 'Content' },
      { name: 'isActive', label: 'Active', kind: 'boolean', group: 'Content' },
    ],
  },
  {
    key: 'authors',
    api: 'authors',
    singular: 'Author',
    plural: 'Authors',
    description: 'Bylines for insights.',
    permissionFamily: 'blog',
    publishable: false,
    titleField: 'displayName',
    hasSeo: false,
    columns: [
      { key: 'displayName', label: 'Author', render: 'link', sortable: true },
      { key: 'jobTitle', label: 'Job title', render: 'muted' },
    ],
    fields: [
      { name: 'displayName', label: 'Display name', kind: 'text', group: 'Content' },
      { name: 'slug', label: 'Slug', kind: 'slug', group: 'Content' },
      { name: 'jobTitle', label: 'Job title', kind: 'text', optional: true, group: 'Content' },
      { name: 'biography', label: 'Biography', kind: 'richtext', optional: true, group: 'Content' },
      { name: 'linkedinUrl', label: 'LinkedIn URL', kind: 'url', optional: true, group: 'Links' },
      { name: 'githubUrl', label: 'GitHub URL', kind: 'url', optional: true, group: 'Links' },
      { name: 'websiteUrl', label: 'Website URL', kind: 'url', optional: true, group: 'Links' },
      { name: 'isActive', label: 'Active', kind: 'boolean', group: 'Content' },
    ],
  },
  {
    key: 'testimonials',
    api: 'testimonials',
    singular: 'Testimonial',
    plural: 'Testimonials',
    description: 'Customer quotes. Publishing requires recorded approval.',
    permissionFamily: 'social-proof',
    publishable: true,
    titleField: 'authorName',
    hasSeo: false,
    columns: [
      { key: 'authorName', label: 'Author', render: 'link', sortable: true },
      { key: 'organization', label: 'Organisation', render: 'muted' },
      STATUS_COLUMN,
    ],
    fields: [
      { name: 'quote', label: 'Quote', kind: 'textarea', group: 'Content', rows: 4 },
      { name: 'authorName', label: 'Author name', kind: 'text', group: 'Content' },
      { name: 'authorRole', label: 'Author role', kind: 'text', optional: true, group: 'Content' },
      {
        name: 'organization',
        label: 'Organisation',
        kind: 'text',
        optional: true,
        group: 'Content',
      },
      {
        name: 'isApproved',
        label: 'The customer has approved this quote for publication',
        kind: 'boolean',
        group: 'Approval',
        hint: 'A testimonial cannot be published without this.',
      },
      {
        name: 'approvalNote',
        label: 'Approval note',
        kind: 'text',
        optional: true,
        group: 'Approval',
        hint: 'Who approved it, and when.',
      },
      {
        name: 'isSampleContent',
        label: 'This is sample content, not a real customer statement',
        kind: 'boolean',
        group: 'Approval',
        hint: 'Sample testimonials are labelled as such on the website.',
      },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', group: 'Publishing' },
    ],
  },
  {
    key: 'clients',
    api: 'clients',
    singular: 'Client',
    plural: 'Clients',
    description: 'Client logos. Displaying one requires recorded approval.',
    permissionFamily: 'social-proof',
    publishable: true,
    titleField: 'organization',
    hasSeo: false,
    columns: [
      { key: 'organization', label: 'Organisation', render: 'link', sortable: true },
      STATUS_COLUMN,
    ],
    fields: [
      { name: 'organization', label: 'Organisation', kind: 'text', group: 'Content' },
      { name: 'slug', label: 'Slug', kind: 'slug', group: 'Content' },
      { name: 'websiteUrl', label: 'Website URL', kind: 'url', optional: true, group: 'Content' },
      {
        name: 'isDisplayApproved',
        label: 'Approved for public display',
        kind: 'boolean',
        group: 'Approval',
      },
      { name: 'isSampleContent', label: 'Sample content', kind: 'boolean', group: 'Approval' },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', group: 'Publishing' },
    ],
  },
  {
    key: 'process-phases',
    api: 'process-phases',
    singular: 'Process phase',
    plural: 'Process',
    description: 'The delivery phases shown on the process page.',
    permissionFamily: 'company',
    publishable: false,
    titleField: 'name',
    hasSeo: false,
    columns: [
      { key: 'number', label: '#', sortable: true },
      { key: 'name', label: 'Phase', render: 'link' },
      { key: 'shortDescription', label: 'Summary', render: 'muted' },
    ],
    fields: [
      { name: 'number', label: 'Phase number', kind: 'number', group: 'Content' },
      { name: 'name', label: 'Phase name', kind: 'text', group: 'Content' },
      { name: 'slug', label: 'Slug', kind: 'slug', group: 'Content' },
      {
        name: 'shortDescription',
        label: 'Short description',
        kind: 'textarea',
        group: 'Content',
        rows: 2,
      },
      {
        name: 'detailedDescription',
        label: 'Detailed description',
        kind: 'richtext',
        optional: true,
        group: 'Content',
      },
      { name: 'deliverables', label: 'Deliverables', kind: 'stringList', group: 'Content' },
      { name: 'iconName', label: 'Icon name', kind: 'text', optional: true, group: 'Content' },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', group: 'Content' },
      { name: 'isActive', label: 'Active', kind: 'boolean', group: 'Content' },
    ],
  },
  {
    key: 'company-values',
    api: 'company-values',
    singular: 'Company value',
    plural: 'Values',
    description: 'What the company holds itself to.',
    permissionFamily: 'company',
    publishable: false,
    titleField: 'title',
    hasSeo: false,
    columns: [
      { key: 'title', label: 'Value', render: 'link', sortable: true },
      { key: 'isActive', label: 'Active', render: 'boolean' },
    ],
    fields: [
      { name: 'title', label: 'Title', kind: 'text', group: 'Content' },
      { name: 'slug', label: 'Slug', kind: 'slug', group: 'Content' },
      { name: 'description', label: 'Description', kind: 'textarea', group: 'Content', rows: 3 },
      { name: 'iconName', label: 'Icon name', kind: 'text', optional: true, group: 'Content' },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', group: 'Content' },
      { name: 'isActive', label: 'Active', kind: 'boolean', group: 'Content' },
    ],
  },
  {
    key: 'milestones',
    api: 'milestones',
    singular: 'Milestone',
    plural: 'Milestones',
    description: 'The company timeline.',
    permissionFamily: 'company',
    publishable: false,
    titleField: 'title',
    hasSeo: false,
    columns: [
      { key: 'label', label: 'Label', render: 'muted' },
      { key: 'title', label: 'Milestone', render: 'link' },
      { key: 'occurredOn', label: 'Date', render: 'date' },
    ],
    fields: [
      {
        name: 'label',
        label: 'Label',
        kind: 'text',
        group: 'Content',
        hint: 'A short tag such as Foundation or Product.',
      },
      { name: 'title', label: 'Title', kind: 'text', group: 'Content' },
      {
        name: 'description',
        label: 'Description',
        kind: 'textarea',
        optional: true,
        group: 'Content',
        rows: 3,
      },
      {
        name: 'occurredOn',
        label: 'Date',
        kind: 'date',
        optional: true,
        group: 'Content',
        hint: 'Leave blank rather than guessing.',
      },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', group: 'Content' },
      { name: 'isActive', label: 'Active', kind: 'boolean', group: 'Content' },
    ],
  },
  {
    key: 'statistics',
    api: 'statistics',
    singular: 'Statistic',
    plural: 'Statistics',
    description: 'Figures shown on the website. Each must be substantiated.',
    permissionFamily: 'company',
    publishable: false,
    titleField: 'label',
    hasSeo: false,
    columns: [
      { key: 'label', label: 'Statistic', render: 'link', sortable: true },
      { key: 'value', label: 'Value' },
      { key: 'isVerified', label: 'Verified', render: 'boolean' },
      { key: 'isActive', label: 'Active', render: 'boolean' },
    ],
    fields: [
      {
        name: 'key',
        label: 'Key',
        kind: 'slug',
        group: 'Content',
        hint: 'Stable identifier used by page sections.',
      },
      { name: 'label', label: 'Label', kind: 'text', group: 'Content' },
      { name: 'value', label: 'Displayed value', kind: 'text', group: 'Content' },
      {
        name: 'numericValue',
        label: 'Numeric value',
        kind: 'number',
        optional: true,
        group: 'Content',
        hint: 'Enables the count-up animation.',
      },
      { name: 'prefix', label: 'Prefix', kind: 'text', optional: true, group: 'Content' },
      { name: 'suffix', label: 'Suffix', kind: 'text', optional: true, group: 'Content' },
      {
        name: 'description',
        label: 'What this number represents',
        kind: 'textarea',
        optional: true,
        group: 'Substantiation',
        rows: 2,
        hint: 'Required unless the figure is marked verified.',
      },
      { name: 'isVerified', label: 'Verified', kind: 'boolean', group: 'Substantiation' },
      {
        name: 'group',
        label: 'Group',
        kind: 'text',
        group: 'Content',
        hint: 'Which section renders it, e.g. home.',
      },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', group: 'Content' },
      { name: 'isActive', label: 'Active', kind: 'boolean', group: 'Content' },
    ],
  },
  {
    key: 'technologies',
    api: 'technologies',
    singular: 'Technology',
    plural: 'Technologies',
    description: 'The stack shown on the technology page.',
    permissionFamily: 'company',
    publishable: false,
    titleField: 'name',
    hasSeo: false,
    columns: [
      { key: 'name', label: 'Technology', render: 'link', sortable: true },
      { key: 'categorySlug', label: 'Category', render: 'muted' },
      { key: 'proficiencyLabel', label: 'Proficiency', render: 'muted' },
    ],
    fields: [
      { name: 'name', label: 'Name', kind: 'text', group: 'Content' },
      { name: 'slug', label: 'Slug', kind: 'slug', group: 'Content' },
      {
        name: 'description',
        label: 'Description',
        kind: 'textarea',
        optional: true,
        group: 'Content',
        rows: 2,
      },
      {
        name: 'proficiencyLabel',
        label: 'Proficiency label',
        kind: 'text',
        optional: true,
        group: 'Content',
        hint: 'A plain descriptor such as Core or Working. Avoid implying certification.',
      },
      { name: 'websiteUrl', label: 'Website URL', kind: 'url', optional: true, group: 'Content' },
      { name: 'isFeatured', label: 'Featured', kind: 'boolean', group: 'Content' },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', group: 'Content' },
      { name: 'isActive', label: 'Active', kind: 'boolean', group: 'Content' },
    ],
  },
  {
    key: 'team',
    api: 'team',
    singular: 'Team member',
    plural: 'Team',
    description: 'Published team profiles. Never store private staff data here.',
    permissionFamily: 'company',
    publishable: true,
    titleField: 'displayName',
    hasSeo: false,
    columns: [
      { key: 'displayName', label: 'Name', render: 'link', sortable: true },
      { key: 'jobTitle', label: 'Job title', render: 'muted' },
      STATUS_COLUMN,
    ],
    fields: [
      { name: 'displayName', label: 'Display name', kind: 'text', group: 'Content' },
      { name: 'slug', label: 'Slug', kind: 'slug', group: 'Content' },
      { name: 'jobTitle', label: 'Job title', kind: 'text', group: 'Content' },
      { name: 'biography', label: 'Biography', kind: 'richtext', optional: true, group: 'Content' },
      { name: 'skills', label: 'Skills', kind: 'stringList', group: 'Content' },
      { name: 'linkedinUrl', label: 'LinkedIn URL', kind: 'url', optional: true, group: 'Links' },
      { name: 'githubUrl', label: 'GitHub URL', kind: 'url', optional: true, group: 'Links' },
      {
        name: 'publicEmail',
        label: 'Public email',
        kind: 'text',
        optional: true,
        group: 'Links',
        hint: 'Only an address the person has agreed to publish.',
      },
      { name: 'isFeatured', label: 'Featured', kind: 'boolean', group: 'Publishing' },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', group: 'Publishing' },
    ],
  },
  {
    key: 'careers',
    api: 'careers',
    singular: 'Job opening',
    plural: 'Careers',
    description: 'Open roles and their descriptions.',
    permissionFamily: 'careers',
    publishable: false,
    publicPath: '/careers',
    previewType: 'career',
    titleField: 'title',
    hasSeo: true,
    columns: [
      { key: 'title', label: 'Role', render: 'link', sortable: true },
      { key: 'department', label: 'Department', render: 'muted' },
      { key: 'careerStatus', label: 'Status', render: 'status' },
      UPDATED_COLUMN,
    ],
    fields: [
      { name: 'title', label: 'Job title', kind: 'text', group: 'Content' },
      { name: 'slug', label: 'Slug', kind: 'slug', group: 'Content' },
      { name: 'department', label: 'Department', kind: 'text', group: 'Content' },
      { name: 'location', label: 'Location', kind: 'text', group: 'Content' },
      {
        name: 'workplaceType',
        label: 'Workplace type',
        kind: 'select',
        group: 'Content',
        options: [
          { value: 'ONSITE', label: 'On site' },
          { value: 'HYBRID', label: 'Hybrid' },
          { value: 'REMOTE', label: 'Remote' },
        ],
      },
      {
        name: 'employmentType',
        label: 'Employment type',
        kind: 'select',
        group: 'Content',
        options: [
          { value: 'FULL_TIME', label: 'Full time' },
          { value: 'PART_TIME', label: 'Part time' },
          { value: 'CONTRACT', label: 'Contract' },
          { value: 'INTERNSHIP', label: 'Internship' },
          { value: 'TEMPORARY', label: 'Temporary' },
        ],
      },
      { name: 'summary', label: 'Summary', kind: 'richtext', group: 'Content' },
      { name: 'responsibilities', label: 'Responsibilities', kind: 'stringList', group: 'Detail' },
      { name: 'requirements', label: 'Requirements', kind: 'stringList', group: 'Detail' },
      { name: 'preferredSkills', label: 'Preferred skills', kind: 'stringList', group: 'Detail' },
      {
        name: 'applyDeadline',
        label: 'Application deadline',
        kind: 'date',
        optional: true,
        group: 'Detail',
      },
      {
        name: 'careerStatus',
        label: 'Status',
        kind: 'select',
        group: 'Publishing',
        hint: 'Only OPEN roles appear on the website and accept applications.',
        options: [
          { value: 'DRAFT', label: 'Draft' },
          { value: 'OPEN', label: 'Open' },
          { value: 'CLOSED', label: 'Closed' },
          { value: 'ARCHIVED', label: 'Archived' },
        ],
      },
      {
        name: 'createRedirectOnSlugChange',
        label: 'Create a 301 redirect if the slug changes',
        kind: 'boolean',
        group: 'Publishing',
      },
      ...seoFields,
    ],
  },
];

export function findResource(key: string): ResourceDef | undefined {
  return RESOURCES.find((resource) => resource.key === key);
}

/** Reads a possibly dotted path off a record, e.g. `category.name`. */
export function readPath(record: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, segment) => {
    if (value && typeof value === 'object') return (value as Record<string, unknown>)[segment];
    return undefined;
  }, record);
}
