/**
 * Next.js configuration for the public website.
 *
 * Security headers are set here rather than only at the edge, so the same
 * protections apply however the app is hosted. The CSP is deliberately strict:
 * no third-party script origins are allowed by default, and adding an
 * analytics provider is a conscious edit rather than an accident.
 */

/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4010';
const apiOrigin = (() => {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return 'http://localhost:4010';
  }
})();

/*
  Next compiles client chunks with eval() in development, so a script-src
  without 'unsafe-eval' stops every bundle from running: the page renders on
  the server, nothing hydrates, and anything interactive is dead. The
  allowance is development-only - a production build needs no eval, and
  granting it there would undo most of what this header is for.
*/
const isDevelopment = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  // Next.js injects inline bootstrap scripts; 'unsafe-inline' is required for
  // them in the App Router without a per-request nonce middleware.
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${apiOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin}`,
  "frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /**
   * The standalone bundle is what the Docker image runs. It is produced only
   * when asked for, because assembling it requires symlink permission, which
   * Windows withholds outside Developer Mode. The Docker builds set
   * NEXT_OUTPUT_STANDALONE=1; a local `next build` produces the normal output.
   */
  output: process.env.NEXT_OUTPUT_STANDALONE === '1' ? 'standalone' : undefined,
  transpilePackages: ['@kts/ui'],
  experimental: {
    // Keeps the workspace root unambiguous for the standalone trace.
    outputFileTracingRoot: process.env.NEXT_OUTPUT_TRACING_ROOT,
  },
  images: {
    formats: ['image/webp'],
    // Only the API serves our media; nothing else may be proxied.
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
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains; preload',
                },
              ]
            : []),
        ],
      },
      {
        // Preview and search results must never be indexed.
        source: '/preview/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
    ];
  },
};

export default nextConfig;
