'use client';

import { useQuery } from '@tanstack/react-query';
import type { SitemapEntryDto } from '@kts/shared-types';
import {
  Badge,
  EmptyState,
  Grid,
  LinkButton,
  Mono,
  Notice,
  PageHeader,
  Panel,
  StatCard,
  Table,
  TableWrap,
  adminStyles as styles,
} from '@kts/admin-ui';
import { adminApi, describeError, useSession } from '@/lib/session';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3010').replace(/\/+$/, '');

/**
 * Sitemap preview.
 *
 * Built from the database with exactly the visibility rule the public pages
 * use, so what is listed here is what a crawler is actually offered. Drafts,
 * future schedules, archived records and noindex pages cannot appear.
 */
export default function SitemapPage() {
  const { can } = useSession();

  const query = useQuery<SitemapEntryDto[]>({
    queryKey: ['sitemap-preview'],
    queryFn: () => adminApi.sitemapPreview(),
    enabled: can('sitemap:read'),
  });

  if (!can('sitemap:read')) {
    return (
      <>
        <PageHeader title="Sitemap" />
        <Notice tone="warning" title="No access">
          Your role does not include sitemap:read.
        </Notice>
      </>
    );
  }

  const entries = query.data ?? [];

  return (
    <>
      <PageHeader
        title="Sitemap"
        description="Every URL offered to search engines, generated live from published content."
        actions={
          <LinkButton href={`${SITE_URL}/sitemap.xml`} variant="secondary">
            Open sitemap.xml
          </LinkButton>
        }
      />

      {query.error ? (
        <Notice tone="error" title="Could not load the sitemap">
          {describeError(query.error)}
        </Notice>
      ) : null}

      {query.isPending ? <Notice tone="info">Generating...</Notice> : null}

      {query.data ? (
        <div style={{ display: 'grid', gap: 18 }}>
          <Grid columns={3}>
            <StatCard label="URLs listed" value={entries.length} />
            <StatCard
              label="High priority (0.8+)"
              value={entries.filter((entry) => entry.priority >= 0.8).length}
            />
            <StatCard
              label="Updated in the last 30 days"
              value={
                entries.filter(
                  (entry) => Date.now() - Date.parse(entry.lastModified) < 30 * 86_400_000,
                ).length
              }
            />
          </Grid>

          <Panel title="Entries" padded={false}>
            {entries.length === 0 ? (
              <EmptyState
                title="No published content"
                description="Publish something and it will appear here."
              />
            ) : (
              <TableWrap>
                <Table caption="Sitemap entries">
                  <thead>
                    <tr>
                      <th scope="col">Path</th>
                      <th scope="col">Priority</th>
                      <th scope="col">Frequency</th>
                      <th scope="col">Last modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.path}>
                        <td>
                          <Mono>{entry.path}</Mono>
                        </td>
                        <td>
                          <Badge tone={entry.priority >= 0.8 ? 'published' : 'neutral'}>
                            {entry.priority.toFixed(1)}
                          </Badge>
                        </td>
                        <td className={styles.cellMuted}>{entry.changeFrequency}</td>
                        <td className={styles.cellMuted}>
                          {new Date(entry.lastModified).toLocaleDateString('en-GB')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </Panel>
        </div>
      ) : null}
    </>
  );
}
