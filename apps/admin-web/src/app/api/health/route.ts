import { NextResponse } from 'next/server';

/** Container health probe for the admin panel process. */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ status: 'ok', service: 'admin-web' });
}
