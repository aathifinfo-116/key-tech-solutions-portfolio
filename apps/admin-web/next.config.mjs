/**
 * Next.js configuration for the administration panel.
 *
 * The admin panel must never be indexed, so a noindex header is applied to
 * every response here as well as in each page's metadata - two independent
 * mechanisms, because one of them getting forgotten is exactly how admin
 * screens end up in search results.
 */

/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? 'http://localhost:4010';
const apiOrigin = (() => {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return 'http://localhost:4010';
  }
})();

/*
  Next compiles client chunks with eval() in development, so a script-src
  without 'unsafe-eval' stops every bundle from running: the server-rendered
  HTML appears, nothing hydrates, and the page sits on its loading state
  forever. The allowance is development-only - a production build needs no
  eval, and granting it there would undo most of what this header is for.
*/
const isDevelopment = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${apiOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
].join('; ');

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: process.env.NEXT_OUTPUT_STANDALONE === '1' ? 'standalone' : undefined,
  transpilePackages: ['@kts/admin-ui'],
  experimental: {
    outputFileTracingRoot: process.env.NEXT_OUTPUT_TRACING_ROOT,
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '4010', pathname: '/api/v1/media/**' },
      { protocol: 'http', hostname: 'api', port: '4010', pathname: '/api/v1/media/**' },
      ...(process.env.NEXT_PUBLIC_MEDIA_HOSTNAME
        ? [{ protocol: 'https', hostname: process.env.NEXT_PUBLIC_MEDIA_HOSTNAME, pathname: '/**' }]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Belt and braces: the admin panel is never indexed.
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet' },
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
