import { NextResponse } from 'next/server';

/** Container health probe. Reports this process only, never the database. */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ status: 'ok', service: 'public-web' });
}
