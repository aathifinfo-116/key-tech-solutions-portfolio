import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

/**
 * On-demand revalidation.
 *
 * The API calls this after a publish with the exact cache tags that changed,
 * so one edit refreshes that page, its listing and the sitemap rather than
 * rebuilding the site. The shared secret is compared in constant time and is
 * never echoed back, not even in an error.
 */
export const dynamic = 'force-dynamic';

const MAX_TAGS = 40;

function secretMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'Revalidation is not configured.' }, { status: 503 });
  }

  if (!secretMatches(request.headers.get('x-revalidate-secret'), expected)) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }

  let body: { tags?: unknown; paths?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const tags = Array.isArray(body.tags)
    ? body.tags
        .filter(
          (tag): tag is string => typeof tag === 'string' && tag.length > 0 && tag.length < 120,
        )
        .slice(0, MAX_TAGS)
    : [];
  const paths = Array.isArray(body.paths)
    ? body.paths
        .filter((path): path is string => typeof path === 'string' && path.startsWith('/'))
        .slice(0, MAX_TAGS)
    : [];

  if (tags.length === 0 && paths.length === 0) {
    return NextResponse.json({ error: 'Supply at least one tag or path.' }, { status: 400 });
  }

  for (const tag of tags) revalidateTag(tag);
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ revalidated: true, tags, paths, at: new Date().toISOString() });
}
