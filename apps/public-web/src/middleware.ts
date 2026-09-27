import { NextResponse, type NextRequest } from 'next/server';

/**
 * Routing middleware.
 *
 * Two jobs, answered by one API call:
 *
 * 1. Editor-managed redirect rules, resolved before Next's routing, so a slug
 *    change keeps inbound links and indexed results working with a real 301
 *    rather than a client-side bounce. A 410 is answered as 410, because
 *    "gone" and "not found" mean different things to a crawler.
 *
 * 2. Hard 404s for detail URLs with no publicly visible content behind them.
 *    `notFound()` inside a page cannot produce a 404 status in this version
 *    of Next: the not-found boundary catches it while the response is
 *    already streaming, so the body is the 404 page but the status stays
 *    200 - a soft 404 on every dead or unpublished slug. Rewriting to a path
 *    that matches no route hands the request to Next's own 404 handling,
 *    which answers with a real 404 and the site's not-found page. A rewrite,
 *    not a redirect, so the URL the visitor asked for is the URL they keep.
 *
 * Failure is non-fatal: if the API is unreachable the request continues to
 * normal routing rather than erroring.
 */

const API_BASE = (
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4010'
).replace(/\/+$/, '');

/** Paths the middleware must never touch. */
const SKIP_PREFIXES = ['/_next', '/api', '/preview', '/favicon', '/robots.txt', '/sitemap.xml'];

/**
 * Deliberately matches no route, so Next's router falls through to its own
 * 404 handling. Underscored to keep it out of the way of any future page.
 */
const NOT_FOUND_PATH = '/_missing';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }
  // Anything with a file extension is a static asset.
  if (/\.[a-z0-9]{2,5}$/i.test(pathname)) {
    return NextResponse.next();
  }

  try {
    const response = await fetch(
      `${API_BASE}/api/v1/public/routes/resolve?path=${encodeURIComponent(pathname)}`,
      {
        // Short cache: a new redirect, or newly published content, should take
        // effect quickly, but the middleware must not hit the API on literally
        // every request.
        next: { revalidate: 60, tags: ['redirects'] },
        signal: AbortSignal.timeout(2000),
      },
    );

    if (!response.ok) return NextResponse.next();

    const resolved = (await response.json()) as {
      redirect: { destination: string; statusCode: number } | null;
      missing: boolean;
    } | null;
    if (!resolved) return NextResponse.next();

    const rule = resolved.redirect;
    if (!rule) {
      if (resolved.missing) {
        return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url));
      }
      return NextResponse.next();
    }

    if (rule.statusCode === 410) {
      return new NextResponse('This page has been permanently removed.', {
        status: 410,
        headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex' },
      });
    }

    const destination = /^https?:\/\//i.test(rule.destination)
      ? new URL(rule.destination)
      : new URL(`${rule.destination}${search}`, request.url);

    return NextResponse.redirect(destination, rule.statusCode);
  } catch {
    // The API is unreachable or slow; serve the page normally.
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
