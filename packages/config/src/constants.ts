/** Platform-wide constants shared by the API and both web applications. */

export const SITE = {
  companyName: 'Key Tech Solutions',
  shortName: 'Key Tech',
  defaultLocale: 'en',
  defaultTitleTemplate: '%s | Key Tech Solutions',
} as const;

export const PAGINATION = {
  defaultPage: 1,
  defaultPageSize: 12,
  maxPageSize: 100,
  adminDefaultPageSize: 20,
  blogPageSize: 9,
  portfolioPageSize: 12,
} as const;

export const CACHE = {
  /** Incremental revalidation windows, in seconds. */
  homepage: 300,
  listing: 600,
  detail: 900,
  settings: 300,
  sitemap: 3600,
} as const;

/** Upload allow-lists. Extension, MIME type and magic bytes are all checked. */
export const UPLOAD = {
  image: {
    extensions: ['jpg', 'jpeg', 'png', 'webp'] as const,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
    maxBytesDefault: 8 * 1024 * 1024,
    maxWidth: 6000,
    maxHeight: 6000,
    minWidth: 16,
    minHeight: 16,
  },
  document: {
    extensions: ['pdf', 'docx'] as const,
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ] as const,
    maxBytesDefault: 15 * 1024 * 1024,
  },
  maxFilenameLength: 180,
} as const;

/** Magic-byte signatures used to verify that a file really is what it claims. */
export const FILE_SIGNATURES: Record<string, Array<{ offset: number; bytes: number[] }>> = {
  'image/jpeg': [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  'image/png': [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  // RIFF....WEBP - the 'WEBP' marker sits at offset 8.
  'image/webp': [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
  'application/pdf': [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] }],
  // DOCX is a ZIP container.
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    { offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] },
  ],
};

/** Extensions that must never be accepted, even nested in a double extension. */
export const FORBIDDEN_UPLOAD_EXTENSIONS = [
  'exe',
  'dll',
  'bat',
  'cmd',
  'com',
  'cpl',
  'scr',
  'msi',
  'ps1',
  'sh',
  'bash',
  'zsh',
  'js',
  'mjs',
  'cjs',
  'jsx',
  'ts',
  'tsx',
  'php',
  'phtml',
  'py',
  'rb',
  'pl',
  'jar',
  'html',
  'htm',
  'xhtml',
  'svg',
  'svgz',
  'xml',
  'xsl',
  'swf',
  'jsp',
  'asp',
  'aspx',
  'zip',
  'rar',
  '7z',
  'tar',
  'gz',
  'bz2',
  'xz',
  'iso',
  'dmg',
  'app',
  'deb',
  'rpm',
  'htaccess',
  'htpasswd',
  'env',
  'sql',
] as const;

export const IMAGE_VARIANTS = {
  thumbnail: { width: 320, height: 320, fit: 'inside' as const },
  card: { width: 768, height: 576, fit: 'inside' as const },
  hero: { width: 1920, height: 1280, fit: 'inside' as const },
  openGraph: { width: 1200, height: 630, fit: 'cover' as const },
} as const;

export type ImageVariantKey = keyof typeof IMAGE_VARIANTS;

/** Public media folders. Upload targets are constrained to this list. */
export const PUBLIC_MEDIA_FOLDERS = [
  'branding',
  'services',
  'products',
  'solutions',
  'portfolio',
  'case-studies',
  'blog',
  'team',
  'content',
] as const;
export type PublicMediaFolder = (typeof PUBLIC_MEDIA_FOLDERS)[number];

export const PRIVATE_DOCUMENT_FOLDERS = ['leads', 'careers', 'documents'] as const;
export type PrivateDocumentFolder = (typeof PRIVATE_DOCUMENT_FOLDERS)[number];

/** Paths that a redirect rule may never target or originate from. */
export const REDIRECT_PROTECTED_PREFIXES = ['/api', '/admin', '/_next', '/preview'] as const;
export const REDIRECT_MAX_CHAIN = 3;

export const SEO_LIMITS = {
  titleMin: 20,
  titleIdealMax: 60,
  titleHardMax: 70,
  descriptionMin: 70,
  descriptionIdealMax: 155,
  descriptionHardMax: 175,
} as const;

export const BUDGET_RANGES = [
  'Under 5,000 USD',
  '5,000 - 15,000 USD',
  '15,000 - 40,000 USD',
  '40,000 - 100,000 USD',
  'Over 100,000 USD',
  'Not decided yet',
] as const;

export const PROJECT_TYPES = [
  'Custom web application',
  'SaaS product',
  'Booking or reservation platform',
  'E-commerce or marketplace',
  'Inventory or operations system',
  'Customer portal',
  'Administration dashboard',
  'API or integration work',
  'Corporate or portfolio website',
  'Maintenance and support',
  'Something else',
] as const;

/** Marker used on every seeded record that is illustrative rather than factual. */
export const SAMPLE_CONTENT_NOTICE =
  'Development sample content - replace before publishing to a production audience.';
