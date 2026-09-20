import { describe, expect, it } from 'vitest';
import {
  PERMISSIONS,
  PERMISSION_FAMILIES,
  PERMISSION_KEYS,
  ROLE_DEFINITIONS,
  SUPER_ADMIN_ROLE_KEY,
  permissionsForFamily,
  resolveRolePermissions,
} from './permissions';
import { REDIRECT_HTTP_CODE, EMPLOYMENT_TYPE_SCHEMA_ORG } from './enums';

describe('permission catalogue', () => {
  it('contains every required permission family', () => {
    const required = [
      'dashboard',
      'pages',
      'services',
      'solutions',
      'industries',
      'products',
      'portfolio',
      'case-studies',
      'blog',
      'media',
      'documents',
      'seo',
      'redirects',
      'sitemap',
      'leads',
      'careers',
      'applications',
      'users',
      'roles',
      'settings',
      'branding',
      'audit',
    ];
    for (const family of required) {
      expect(PERMISSION_FAMILIES).toContain(family);
    }
  });

  it('uses the family:action key format', () => {
    for (const permission of PERMISSIONS) {
      expect(permission.key).toBe(`${permission.family}:${permission.action}`);
    }
  });

  it('has no duplicate keys', () => {
    expect(new Set(PERMISSION_KEYS).size).toBe(PERMISSION_KEYS.length);
  });

  it('gives every permission a description', () => {
    expect(PERMISSIONS.every((p) => p.description.length > 10)).toBe(true);
  });

  it('filters by family', () => {
    const redirectPerms = permissionsForFamily('redirects');
    expect(redirectPerms).toContain('redirects:create');
    expect(redirectPerms.every((k) => k.startsWith('redirects:'))).toBe(true);
  });
});

describe('role definitions', () => {
  it('defines the documented roles', () => {
    const keys = ROLE_DEFINITIONS.map((r) => r.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        'super-administrator',
        'content-administrator',
        'seo-manager',
        'marketing-editor',
        'product-manager',
        'portfolio-manager',
        'lead-manager',
        'career-manager',
        'media-manager',
        'auditor',
      ]),
    );
  });

  it('grants the super administrator every permission', () => {
    const role = ROLE_DEFINITIONS.find((r) => r.key === SUPER_ADMIN_ROLE_KEY)!;
    expect(resolveRolePermissions(role).sort()).toEqual([...PERMISSION_KEYS].sort());
  });

  it('only references permissions that exist', () => {
    for (const role of ROLE_DEFINITIONS) {
      if (role.permissions === '*') continue;
      for (const key of role.permissions) {
        expect(PERMISSION_KEYS, `role ${role.key} references unknown permission ${key}`).toContain(
          key,
        );
      }
    }
  });

  it('gives the auditor read access but no write access', () => {
    const auditor = ROLE_DEFINITIONS.find((r) => r.key === 'auditor')!;
    const resolved = resolveRolePermissions(auditor);
    expect(resolved).toContain('audit:read');
    expect(resolved.filter((k) => k.endsWith(':create'))).toEqual([]);
    expect(resolved.filter((k) => k.endsWith(':update'))).toEqual([]);
    expect(resolved.filter((k) => k.endsWith(':delete'))).toEqual([]);
    expect(resolved.filter((k) => k.endsWith(':publish'))).toEqual([]);
  });

  it('keeps user and role management away from non-super roles', () => {
    for (const role of ROLE_DEFINITIONS) {
      if (role.key === SUPER_ADMIN_ROLE_KEY) continue;
      const resolved = resolveRolePermissions(role);
      expect(resolved).not.toContain('users:create');
      expect(resolved).not.toContain('roles:update');
    }
  });

  it('lets the lead manager download lead attachments but not edit content', () => {
    const resolved = resolveRolePermissions(
      ROLE_DEFINITIONS.find((r) => r.key === 'lead-manager')!,
    );
    expect(resolved).toContain('leads:update');
    expect(resolved).toContain('documents:download');
    expect(resolved).not.toContain('services:update');
  });

  it('de-duplicates permission lists', () => {
    for (const role of ROLE_DEFINITIONS) {
      const resolved = resolveRolePermissions(role);
      expect(new Set(resolved).size).toBe(resolved.length);
    }
  });
});

describe('enum maps', () => {
  it('maps redirect enums to http codes', () => {
    expect(REDIRECT_HTTP_CODE.PERMANENT_301).toBe(301);
    expect(REDIRECT_HTTP_CODE.GONE_410).toBe(410);
  });

  it('maps employment types to schema.org values', () => {
    expect(EMPLOYMENT_TYPE_SCHEMA_ORG.INTERNSHIP).toBe('INTERN');
    expect(EMPLOYMENT_TYPE_SCHEMA_ORG.CONTRACT).toBe('CONTRACTOR');
  });
});
