/**
 * Admin navigation.
 *
 * Mirrors the documented information architecture. Each entry names the
 * permission that makes it useful; the shell hides entries the signed-in user
 * cannot act on, and the API refuses them regardless.
 */

import type { NavGroup } from '@kts/admin-ui';

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/', permission: 'dashboard:read' },
      { label: 'Content health', href: '/overview/content-health', permission: 'dashboard:read' },
      { label: 'SEO health', href: '/overview/seo-health', permission: 'seo:read' },
      { label: 'Leads', href: '/growth/leads', permission: 'leads:read' },
    ],
  },
  {
    title: 'Website',
    items: [
      { label: 'Pages', href: '/content/pages', permission: 'pages:read' },
      { label: 'Navigation', href: '/website/navigation', permission: 'navigation:read' },
      { label: 'Footer', href: '/website/footer', permission: 'navigation:read' },
      { label: 'Announcements', href: '/website/announcements', permission: 'settings:read' },
    ],
  },
  {
    title: 'Offerings',
    items: [
      { label: 'Services', href: '/content/services', permission: 'services:read' },
      { label: 'Solutions', href: '/content/solutions', permission: 'solutions:read' },
      { label: 'Industries', href: '/content/industries', permission: 'industries:read' },
      { label: 'Products', href: '/content/products', permission: 'products:read' },
    ],
  },
  {
    title: 'Portfolio',
    items: [
      { label: 'Projects', href: '/content/portfolio', permission: 'portfolio:read' },
      { label: 'Case studies', href: '/content/case-studies', permission: 'case-studies:read' },
      { label: 'Testimonials', href: '/content/testimonials', permission: 'social-proof:read' },
      { label: 'Clients', href: '/content/clients', permission: 'social-proof:read' },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Insights', href: '/content/blog', permission: 'blog:read' },
      { label: 'Categories', href: '/content/blog-categories', permission: 'blog:read' },
      { label: 'Authors', href: '/content/authors', permission: 'blog:read' },
      { label: 'Media library', href: '/content/media', permission: 'media:read' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'Process', href: '/content/process-phases', permission: 'company:read' },
      { label: 'Values', href: '/content/company-values', permission: 'company:read' },
      { label: 'Milestones', href: '/content/milestones', permission: 'company:read' },
      { label: 'Statistics', href: '/content/statistics', permission: 'company:read' },
      { label: 'Technologies', href: '/content/technologies', permission: 'company:read' },
      { label: 'Team', href: '/content/team', permission: 'company:read' },
      { label: 'Careers', href: '/content/careers', permission: 'careers:read' },
      { label: 'Applications', href: '/growth/applications', permission: 'applications:read' },
    ],
  },
  {
    title: 'Growth',
    items: [{ label: 'Leads and quotes', href: '/growth/leads', permission: 'leads:read' }],
  },
  {
    title: 'SEO',
    items: [
      { label: 'SEO health', href: '/overview/seo-health', permission: 'seo:read' },
      { label: 'Redirects', href: '/seo/redirects', permission: 'redirects:read' },
      { label: 'Sitemap', href: '/seo/sitemap', permission: 'sitemap:read' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users', href: '/admin/users', permission: 'users:read' },
      { label: 'Roles and permissions', href: '/admin/roles', permission: 'roles:read' },
      { label: 'Settings', href: '/admin/settings', permission: 'settings:read' },
      { label: 'Branding', href: '/admin/branding', permission: 'branding:read' },
      { label: 'Audit log', href: '/admin/audit', permission: 'audit:read' },
    ],
  },
];

/** Page title shown in the top bar, derived from the current path. */
export function titleForPath(pathname: string): string {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.href === pathname) return item.label;
    }
  }
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.href !== '/' && pathname.startsWith(`${item.href}/`)) return item.label;
    }
  }
  return 'Administration';
}
