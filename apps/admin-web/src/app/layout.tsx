import type { Metadata, Viewport } from 'next';
import { buildCssVariables } from '@kts/config';
import '@kts/admin-ui/styles/admin.css';
import { Providers } from '@/lib/session';

/**
 * Admin root layout.
 *
 * The panel is never indexed: the metadata below says so, and
 * next.config.mjs sets an X-Robots-Tag header on every response as well.
 */
export const metadata: Metadata = {
  title: { default: 'Key Tech Admin', template: '%s | Key Tech Admin' },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#111426',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Brand tokens, emitted from @kts/config so both apps stay in step. */}
        <style dangerouslySetInnerHTML={{ __html: buildCssVariables() }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
