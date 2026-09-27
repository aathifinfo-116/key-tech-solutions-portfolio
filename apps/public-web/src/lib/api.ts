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
 * True while `next build` is prerendering pages.
 *
 * Degrading gracefully is right when the site is serving and the API has a
 * blip: a visitor gets the page, just without a menu. It is wrong during a
 * build, because the fallback is then written into the static HTML and
 * shipped - a deploy that looks successful and serves a site with no
 * navigation and the wrong brand name. Better to fail the build.
 */
const IS_BUILD = process.env.NEXT_PHASE === 'phase-production-build';

/**
 * Loads the header, footer and brand in one place.
 *
 * At runtime a failure degrades rather than breaks: the layout still renders
 * with the default brand and no navigation, and the error is logged server
 * side. During a build the same failure is fatal - see `IS_BUILD`.
 */
export async function getSiteChrome(): Promise<SiteChrome> {
  /** Fatal during a build, logged and survivable while serving. */
  function report(what: string, error: unknown): void {
    if (IS_BUILD) {
      throw new Error(
        `The API was unreachable while building (${what}: ${errorMessage(error)}). ` +
          'Deploy the API first and check API_INTERNAL_URL, or this build would ship ' +
          'pages with no navigation and placeholder branding.',
      );
    }
    console.error(`[site] ${what} unavailable:`, errorMessage(error));
  }

  const [settings, navigation, footer] = await Promise.all([
    api.settings().catch((error) => {
      report('settings', error);
      return {
        brand: FALLBACK_BRAND,
        socialLinks: [],
        settings: {},
        announcement: null,
      } satisfies SiteSettingsDto;
    }),
    api.navigation('PRIMARY').catch((error) => {
      report('navigation', error);
      return null;
    }),
    api.footer().catch((error) => {
      report('footer', error);
      return [];
    }),
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
