/**
 * Permission catalogue.
 *
 * Permissions are stored in the database (`permissions` table) and attached to
 * roles through `role_permissions`. This file is the single source of truth the
 * seed script uses to synchronise that table, and the constant the API guards
 * and the admin UI reference.
 *
 * Key format: `<family>:<action>`.
 */

export const PERMISSION_ACTIONS = [
  'read',
  'create',
  'update',
  'delete',
  'publish',
  'export',
  'download',
  'manage',
] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export interface PermissionDefinition {
  key: string;
  family: string;
  action: PermissionAction;
  description: string;
}

interface FamilySpec {
  family: string;
  label: string;
  actions: PermissionAction[];
}

const FAMILY_SPECS: FamilySpec[] = [
  { family: 'dashboard', label: 'the admin dashboard', actions: ['read'] },
  {
    family: 'pages',
    label: 'website pages and sections',
    actions: ['read', 'create', 'update', 'delete', 'publish'],
  },
  {
    family: 'services',
    label: 'services and service categories',
    actions: ['read', 'create', 'update', 'delete', 'publish'],
  },
  {
    family: 'solutions',
    label: 'solutions',
    actions: ['read', 'create', 'update', 'delete', 'publish'],
  },
  {
    family: 'industries',
    label: 'industries',
    actions: ['read', 'create', 'update', 'delete', 'publish'],
  },
  {
    family: 'products',
    label: 'Key Tech products',
    actions: ['read', 'create', 'update', 'delete', 'publish'],
  },
  {
    family: 'portfolio',
    label: 'portfolio projects',
    actions: ['read', 'create', 'update', 'delete', 'publish'],
  },
  {
    family: 'case-studies',
    label: 'case studies',
    actions: ['read', 'create', 'update', 'delete', 'publish'],
  },
  {
    family: 'blog',
    label: 'blog posts, categories, tags and authors',
    actions: ['read', 'create', 'update', 'delete', 'publish'],
  },
  {
    family: 'company',
    label: 'company content (values, milestones, process, technologies, team)',
    actions: ['read', 'create', 'update', 'delete', 'publish'],
  },
  {
    family: 'social-proof',
    label: 'testimonials, clients and partners',
    actions: ['read', 'create', 'update', 'delete', 'publish'],
  },
  {
    family: 'media',
    label: 'the public media library',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    family: 'documents',
    label: 'private documents',
    actions: ['read', 'create', 'update', 'delete', 'download'],
  },
  { family: 'seo', label: 'SEO metadata and global SEO settings', actions: ['read', 'update'] },
  { family: 'redirects', label: 'redirect rules', actions: ['read', 'create', 'update', 'delete'] },
  { family: 'sitemap', label: 'sitemap configuration', actions: ['read', 'update'] },
  { family: 'navigation', label: 'navigation menus and the footer', actions: ['read', 'update'] },
  {
    family: 'leads',
    label: 'leads, contact messages and quote requests',
    actions: ['read', 'update', 'delete', 'export'],
  },
  {
    family: 'newsletter',
    label: 'newsletter subscribers',
    actions: ['read', 'update', 'delete', 'export'],
  },
  {
    family: 'careers',
    label: 'job openings',
    actions: ['read', 'create', 'update', 'delete', 'publish'],
  },
  {
    family: 'applications',
    label: 'job applications and CVs',
    actions: ['read', 'update', 'delete', 'download', 'export'],
  },
  { family: 'users', label: 'admin users', actions: ['read', 'create', 'update', 'delete'] },
  {
    family: 'roles',
    label: 'roles and permission assignments',
    actions: ['read', 'create', 'update', 'delete'],
  },
  { family: 'settings', label: 'site settings and integrations', actions: ['read', 'update'] },
  { family: 'branding', label: 'brand settings', actions: ['read', 'update'] },
  { family: 'audit', label: 'audit logs', actions: ['read', 'export'] },
];

const ACTION_VERB: Record<PermissionAction, string> = {
  read: 'View',
  create: 'Create',
  update: 'Edit',
  delete: 'Delete or archive',
  publish: 'Publish, schedule and unpublish',
  export: 'Export',
  download: 'Download files for',
  manage: 'Fully manage',
};

export const PERMISSIONS: PermissionDefinition[] = FAMILY_SPECS.flatMap((spec) =>
  spec.actions.map((action) => ({
    key: `${spec.family}:${action}`,
    family: spec.family,
    action,
    description: `${ACTION_VERB[action]} ${spec.label}.`,
  })),
);

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

export const PERMISSION_FAMILIES = FAMILY_SPECS.map((s) => s.family);

/** Convenience helper: every permission key belonging to a family. */
export function permissionsForFamily(family: string): string[] {
  return PERMISSIONS.filter((p) => p.family === family).map((p) => p.key);
}

function families(...names: string[]): string[] {
  return names.flatMap((name) => permissionsForFamily(name));
}

function readOnly(...names: string[]): string[] {
  return names.map((name) => `${name}:read`).filter((key) => PERMISSION_KEYS.includes(key));
}

export interface RoleDefinition {
  key: string;
  name: string;
  description: string;
  isSystem: boolean;
  sortOrder: number;
  /** `'*'` grants every permission and stays correct as new permissions appear. */
  permissions: string[] | '*';
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    key: 'super-administrator',
    name: 'Super Administrator',
    description: 'Unrestricted access to every module, including users, roles and audit logs.',
    isSystem: true,
    sortOrder: 0,
    permissions: '*',
  },
  {
    key: 'content-administrator',
    name: 'Content Administrator',
    description: 'Manages and publishes all website content but cannot change users or roles.',
    isSystem: true,
    sortOrder: 10,
    permissions: [
      ...families(
        'pages',
        'services',
        'solutions',
        'industries',
        'products',
        'portfolio',
        'case-studies',
        'blog',
        'company',
        'social-proof',
        'media',
        'navigation',
      ),
      ...readOnly(
        'dashboard',
        'documents',
        'seo',
        'redirects',
        'sitemap',
        'settings',
        'branding',
        'audit',
      ),
      'seo:update',
      'documents:create',
    ],
  },
  {
    key: 'seo-manager',
    name: 'SEO Manager',
    description: 'Owns SEO metadata, redirects, sitemap configuration and social sharing.',
    isSystem: true,
    sortOrder: 20,
    permissions: [
      ...families('seo', 'redirects', 'sitemap'),
      ...readOnly(
        'dashboard',
        'pages',
        'services',
        'solutions',
        'industries',
        'products',
        'portfolio',
        'case-studies',
        'blog',
        'careers',
        'media',
        'settings',
      ),
      'settings:update',
    ],
  },
  {
    key: 'marketing-editor',
    name: 'Marketing Editor',
    description: 'Writes and edits blog content and marketing copy; publishing requires review.',
    isSystem: true,
    sortOrder: 30,
    permissions: [
      'blog:read',
      'blog:create',
      'blog:update',
      'media:read',
      'media:create',
      'media:update',
      'social-proof:read',
      'social-proof:create',
      'social-proof:update',
      ...readOnly(
        'dashboard',
        'pages',
        'services',
        'products',
        'solutions',
        'portfolio',
        'case-studies',
        'seo',
      ),
      'seo:update',
    ],
  },
  {
    key: 'product-manager',
    name: 'Product Manager',
    description: 'Manages the Key Tech product catalogue, solutions and technology stack.',
    isSystem: true,
    sortOrder: 40,
    permissions: [
      ...families('products', 'solutions'),
      'company:read',
      'company:update',
      'media:read',
      'media:create',
      'media:update',
      ...readOnly(
        'dashboard',
        'services',
        'industries',
        'portfolio',
        'case-studies',
        'blog',
        'seo',
      ),
      'seo:update',
    ],
  },
  {
    key: 'portfolio-manager',
    name: 'Portfolio Manager',
    description: 'Manages portfolio projects, case studies and approved client references.',
    isSystem: true,
    sortOrder: 50,
    permissions: [
      ...families('portfolio', 'case-studies', 'social-proof'),
      'media:read',
      'media:create',
      'media:update',
      'documents:read',
      'documents:create',
      ...readOnly('dashboard', 'services', 'products', 'solutions', 'industries', 'seo'),
      'seo:update',
    ],
  },
  {
    key: 'lead-manager',
    name: 'Lead Manager',
    description: 'Works contact messages, quote requests and the newsletter list.',
    isSystem: true,
    sortOrder: 60,
    permissions: [
      ...families('leads', 'newsletter'),
      'documents:read',
      'documents:download',
      ...readOnly('dashboard'),
    ],
  },
  {
    key: 'career-manager',
    name: 'Career Manager',
    description: 'Publishes job openings and processes applications, including CV downloads.',
    isSystem: true,
    sortOrder: 70,
    permissions: [
      ...families('careers', 'applications'),
      'documents:read',
      'documents:download',
      ...readOnly('dashboard', 'company'),
    ],
  },
  {
    key: 'media-manager',
    name: 'Media Manager',
    description: 'Curates the media library and private document store.',
    isSystem: true,
    sortOrder: 80,
    permissions: [...families('media', 'documents'), ...readOnly('dashboard')],
  },
  {
    key: 'auditor',
    name: 'Auditor',
    description:
      'Read-only access across the platform plus the audit trail. Cannot change anything.',
    isSystem: true,
    sortOrder: 90,
    permissions: [
      ...readOnly(
        'dashboard',
        'pages',
        'services',
        'solutions',
        'industries',
        'products',
        'portfolio',
        'case-studies',
        'blog',
        'company',
        'social-proof',
        'media',
        'documents',
        'seo',
        'redirects',
        'sitemap',
        'navigation',
        'leads',
        'newsletter',
        'careers',
        'applications',
        'users',
        'roles',
        'settings',
        'branding',
        'audit',
      ),
      'audit:export',
    ],
  },
];

/** Resolves `'*'` and de-duplicates a role's permission list. */
export function resolveRolePermissions(role: RoleDefinition): string[] {
  if (role.permissions === '*') return [...PERMISSION_KEYS];
  return Array.from(new Set(role.permissions)).filter((key) => PERMISSION_KEYS.includes(key));
}

export const SUPER_ADMIN_ROLE_KEY = 'super-administrator';
