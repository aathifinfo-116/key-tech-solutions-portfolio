import { ImageResponse } from 'next/og';
import { SITE_NAME, getSiteChrome } from '@/lib/api';

/**
 * Default Open Graph image.
 *
 * Generated from the brand tokens so every share card is on-brand without an
 * uploaded asset. Individual entities override it with their own OG image.
 */
export const runtime = 'nodejs';
export const alt = `${SITE_NAME} - software, SaaS and business automation`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const { settings } = await getSiteChrome().catch(() => ({ settings: null }) as never);
  const brand = settings?.brand;
  const tagline = brand?.tagline ?? 'Technology that unlocks business growth';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: 'linear-gradient(135deg, #6436A3 0%, #416F9E 50%, #2CA3A3 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            letterSpacing: 6,
            textTransform: 'uppercase',
            opacity: 0.85,
          }}
        >
          Software &middot; SaaS &middot; Automation
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>
            {brand?.companyName ?? SITE_NAME}
          </div>
          <div style={{ fontSize: 34, opacity: 0.9, maxWidth: 900 }}>{tagline}</div>
        </div>
        <div
          style={{
            display: 'flex',
            height: 8,
            width: 220,
            background: '#ffffff',
            borderRadius: 999,
          }}
        />
      </div>
    ),
    size,
  );
}
