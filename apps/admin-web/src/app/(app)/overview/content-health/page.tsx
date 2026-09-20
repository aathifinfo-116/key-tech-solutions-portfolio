'use client';

import Link from 'next/link';
import { useQueries } from '@tanstack/react-query';
import type { Paginated } from '@kts/shared-types';
import {
  Badge,
  Grid,
  Notice,
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
  Table,
  TableWrap,
  adminStyles as styles,
} from '@kts/admin-ui';
import { RESOURCES } from '@/lib/resources';
import { adminApi, useSession } from '@/lib/session';

/**
 * Content health.
 *
 * Shows where content is sitting in the workflow, so nothing is left in
 * review indefinitely and scheduled items are visible before they go live.
 */
export default function ContentHealthPage() {
  const { can } = useSession();
  const publishable = RESOURCES.filter((resource) => resource.publishable);

  const queries = useQueries({
    queries: publishable.map((resource) => ({
      queryKey: ['content-health', resource.key],
      queryFn: () =>
        adminApi.list<Record<string, unknown>>(resource.api, {
          pageSize: 100,
          includeArchived: false,
        }),
      enabled: can(`${resource.permissionFamily}:read`),
    })),
  });

  const rows = publishable.map((resource, index) => {
    const result = queries[index];
    const items = (result?.data as Paginated<Record<string, unknown>> | undefined)?.items ?? [];
    const count = (status: string) => items.filter((item) => item.status === status).length;
    return {
      resource,
      accessible: can(`${resource.permissionFamily}:read`),
      loading: result?.isPending ?? false,
      total: items.length,
      draft: count('DRAFT'),
      review: count('REVIEW'),
      scheduled: count('SCHEDULED'),
      published: count('PUBLISHED'),
    };
  });

  const visible = rows.filter((row) => row.accessible);
  const totals = visible.reduce(
    (sum, row) => ({
      draft: sum.draft + row.draft,
      review: sum.review + row.review,
      scheduled: sum.scheduled + row.scheduled,
      published: sum.published + row.published,
    }),
    { draft: 0, review: 0, scheduled: 0, published: 0 },
  );

  return (
    <>
      <PageHeader
        title="Content health"
        description="Where everything sits in the editorial workflow, across every content type you can see."
      />

      {visible.length === 0 ? (
        <Notice tone="info" title="Nothing to show">
          Your role does not include read access to any publishable content type.
        </Notice>
      ) : (
        <div style={{ display: 'grid', gap: 18 }}>
          <Grid columns={4}>
            <StatCard label="Published" value={totals.published} />
            <StatCard label="In review" value={totals.review} hint="Waiting on a publisher" />
            <StatCard
              label="Scheduled"
              value={totals.scheduled}
              hint="Will go live automatically"
            />
            <StatCard label="Drafts" value={totals.draft} />
          </Grid>

          {totals.review > 0 ? (
            <Notice tone="warning" title={`${totals.review} item(s) waiting for review`}>
              Someone with publish rights needs to look at these before they can go live.
            </Notice>
          ) : null}

          <Panel title="By content type" padded={false}>
            <TableWrap>
              <Table caption="Content by workflow status">
                <thead>
                  <tr>
                    <th scope="col">Type</th>
                    <th scope="col">Published</th>
                    <th scope="col">Scheduled</th>
                    <th scope="col">In review</th>
                    <th scope="col">Draft</th>
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr key={row.resource.key}>
                      <td>
                        <Link className={styles.cellPrimary} href={`/content/${row.resource.key}`}>
                          {row.resource.plural}
                        </Link>
                      </td>
                      <td>{row.loading ? '-' : <Badge tone="published">{row.published}</Badge>}</td>
                      <td>{row.loading ? '-' : row.scheduled}</td>
                      <td>
                        {row.loading ? (
                          '-'
                        ) : row.review > 0 ? (
                          <Badge tone="review">{row.review}</Badge>
                        ) : (
                          0
                        )}
                      </td>
                      <td>{row.loading ? '-' : row.draft}</td>
                      <td className={styles.cellMuted}>{row.loading ? 'loading...' : row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Panel>

          <Panel title="Workflow reference">
            <div className={styles.stackTight}>
              {[
                ['DRAFT', 'Being worked on. Never public.'],
                ['REVIEW', 'Submitted for checking. Still never public.'],
                ['SCHEDULED', 'Becomes public automatically once its date passes.'],
                ['PUBLISHED', 'Live on the website and in the sitemap.'],
                ['ARCHIVED', 'Removed from the website but kept in the database.'],
              ].map(([status, meaning]) => (
                <div key={status} className={styles.inline}>
                  <StatusBadge status={status} />
                  <span className={styles.cellMuted}>{meaning}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
