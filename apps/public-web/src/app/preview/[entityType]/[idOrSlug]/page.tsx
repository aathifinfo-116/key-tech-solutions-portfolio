import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Badge, Container, Prose, Section, SectionHeader } from '@kts/ui';
import { api } from '@/lib/api';
import { noIndex } from '@/lib/seo';

/**
 * Draft preview.
 *
 * Three independent protections, because one is not enough:
 *  1. the request carries the server-held preview secret, which never reaches
 *     the browser bundle,
 *  2. the response is noindex/nofollow both in metadata and as an
 *     `X-Robots-Tag` header set in next.config.mjs,
 *  3. preview paths are excluded from robots.txt and never enter the sitemap.
 *
 * Always dynamic: a draft must never be served from a cache.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function generateMetadata(): Metadata {
  return noIndex('Preview');
}

const SUPPORTED = [
  'page',
  'service',
  'solution',
  'product',
  'portfolio',
  'case-study',
  'blog',
  'career',
];

export default async function PreviewPage({
  params,
}: {
  params: { entityType: string; idOrSlug: string };
}) {
  const secret = process.env.PREVIEW_SECRET;
  if (!secret) notFound();
  if (!SUPPORTED.includes(params.entityType)) notFound();

  const content = await api.preview(params.entityType, params.idOrSlug, secret).catch(() => null);
  if (!content) notFound();

  const record = content as Record<string, unknown>;
  const title = String(record.title ?? record.name ?? 'Untitled');
  const summary = (record.summary ?? record.excerpt ?? record.shortDescription ?? null) as
    | string
    | null;
  const status = String(record.status ?? record.careerStatus ?? 'DRAFT');
  const bodyHtml = (record.contentHtml ?? record.fullDescription ?? record.overview ?? null) as
    | string
    | null;

  return (
    <>
      <Section theme="SOFT_PURPLE" compact>
        <Container>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--kt-space-3)',
              alignItems: 'center',
            }}
          >
            <Badge tone="warning" withDot>
              Preview
            </Badge>
            <Badge tone="neutral">{status}</Badge>
            <span style={{ fontSize: 'var(--kt-text-small)', color: 'var(--kt-text-secondary)' }}>
              This is unpublished content. It is not indexed, not linked and not in the sitemap.
            </span>
          </div>
        </Container>
      </Section>

      <Section theme="WHITE">
        <SectionHeader
          eyebrow={params.entityType}
          heading={title}
          description={summary}
          level={1}
        />
        {bodyHtml ? <Prose html={bodyHtml} /> : null}
      </Section>
    </>
  );
}
