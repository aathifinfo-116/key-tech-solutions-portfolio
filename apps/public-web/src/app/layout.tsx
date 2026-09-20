import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { buildCssVariables } from '@kts/config';
import { AnnouncementBar, SiteFooter, SiteHeader, SkipLink } from '@kts/ui';
import '@kts/ui/styles/globals.css';
import { JsonLd } from '@/components/JsonLd';
import { SITE_NAME, SITE_URL, getSiteChrome, setting } from '@/lib/api';
import { siteJsonLd } from '@/lib/seo';

/**
 * Self-hosted variable font with `display: swap` and a preload.
 * Next inlines the @font-face and preloads the file, so the first paint uses
 * the real typeface without a layout shift when it arrives.
 */
const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--kt-font-loaded',
  preload: true,
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  applicationName: SITE_NAME,
  formatDetection: { telephone: false },
  icons: { icon: '/favicon.svg' },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#6436A3',
  colorScheme: 'light',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings, navigation, footer } = await getSiteChrome();
  const { brand, socialLinks, announcement } = settings;

  const primaryCta = { label: 'Start a Project', href: '/request-a-quote' };
  const secondaryCta = { label: 'Explore Our Products', href: '/products' };

  return (
    <html lang="en" className={sans.className}>
      <head>
        {/*
          Design tokens are emitted from @kts/config at render time, so the
          stylesheet and the TypeScript tokens can never drift apart.
        */}
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `${buildCssVariables()}\n:root{--kt-font-sans:${sans.style.fontFamily},system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;}`,
          }}
        />
      </head>
      <body>
        <SkipLink />
        <JsonLd data={siteJsonLd(brand, socialLinks)} />

        <AnnouncementBar announcement={announcement} />
        <SiteHeader
          brand={brand}
          navigation={navigation}
          primaryCta={primaryCta}
          secondaryCta={secondaryCta}
        />

        <main id="main">{children}</main>

        <SiteFooter
          brand={brand}
          groups={footer}
          socialLinks={socialLinks}
          note={setting<string>(settings.settings, 'site.footerNote', '')}
        />
      </body>
    </html>
  );
}
