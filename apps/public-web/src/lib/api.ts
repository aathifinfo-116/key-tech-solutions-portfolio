/**
 * Server-side API access.
 *
 * Every read goes through one PublicApi instance so caching, tagging and
 * revalidation behave identically on every route. `API_INTERNAL_URL` lets the
 * server talk to the API over a private network address while the browser
 * uses the public one.
 */

import { createPublicApi } from '@kts/api-client';
import type {
  BrandDto,
  FooterGroupDto,
  NavigationItemDto,
  SiteSettingsDto,
} from '@kts/shared-types';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3010').replace(
  /\/+$/,
  '',
);
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Key Tech Solutions';

const API_BASE = (
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4010'
).replace(/\/+$/, '');

export const api = createPublicApi(API_BASE);

/** Fallback used when the API is unreachable, so the site still renders. */
const FALLBACK_BRAND: BrandDto = {
  companyName: SITE_NAME,
  shortName: 'Key Tech',
  legalName: null,
  tagline: null,
  description: null,
  colors: {
    primary: '#6436A3',
    secondary: '#416F9E',
    accent: '#2CA3A3',
    highlight: '#5BC3C6',
    ink: '#111426',
  },
  gradientCss: 'linear-gradient(135deg, #6436A3 0%, #416F9E 50%, #2CA3A3 100%)',
  contactEmail: null,
  contactPhone: null,
  supportEmail: null,
  logoLight: null,
  logoDark: null,
  logoMark: null,
  favicon: null,
  ogDefault: null,
};

export interface SiteChrome {
  settings: SiteSettingsDto;
  navigation: NavigationItemDto[];
  footer: FooterGroupDto[];
}

/**
 * Loads the header, footer and brand in one place.
 *
 * A failure here degrades rather than breaks: the layout still renders with
 * the default brand and no navigation, and the error is logged server side.
 */
export async function getSiteChrome(): Promise<SiteChrome> {
  const [settings, navigation, footer] = await Promise.all([
    api.settings().catch((error) => {
      console.error('[site] settings unavailable:', errorMessage(error));
      return {
        brand: FALLBACK_BRAND,
        socialLinks: [],
        settings: {},
        announcement: null,
      } satisfies SiteSettingsDto;
    }),
    api.navigation('PRIMARY').catch(() => null),
    api.footer().catch(() => []),
  ]);

  return { settings, navigation: navigation?.items ?? [], footer };
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Reads a public site setting with a typed fallback. */
export function setting<T>(settings: Record<string, unknown>, key: string, fallback: T): T {
  const value = settings[key];
  return value === undefined || value === null ? fallback : (value as T);
}
