'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { DashboardStatsDto } from '@kts/shared-types';
import {
  Badge,
  EmptyState,
  Grid,
  Mono,
  Notice,
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
  Table,
  TableWrap,
} from '@kts/admin-ui';
import { adminApi, describeError, useSession } from '@/lib/session';

/**
 * Dashboard.
 *
 * Every figure is a live count from the database. Nothing is estimated or
 * projected, and no target or trend is implied that the data does not support.
 */
export default function DashboardPage() {
  const { user, can } = useSession();

  const { data, isPending, error } = useQuery<DashboardStatsDto>({
    queryKey: ['dashboard'],
    queryFn: () => adminApi.dashboard(),
    enabled: can('dashboard:read'),
  });

  if (!can('dashboard:read')) {
    return (
      <>
        <PageHeader title={`Welcome, ${user.name.split(' ')[0]}`} />
        <Notice tone="info" title="No dashboard access">
          Your role does not include dashboard access. Use the menu to reach the sections you can
          work in.
        </Notice>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(' ')[0]}`}
        description="A live view of what is published, what is waiting and what has come in."
      />

      {error ? (
        <Notice tone="error" title="Could not load the dashboard">
          {describeError(error)}
        </Notice>
      ) : null}

      {isPending ? (
        <Notice tone="info">Loading dashboard figures...</Notice>
      ) : data ? (
        <div style={{ display: 'grid', gap: 20 }}>
          <section>
            <h2 style={{ fontSize: '0.95rem', marginBottom: 10 }}>Published content</h2>
            <Grid columns={4}>
              <StatCard label="Pages" value={data.content.pages} />
              <StatCard label="Services" value={data.content.services} />
              <StatCard label="Solutions" value={data.content.solutions} />
              <StatCard label="Products" value={data.content.products} />
              <StatCard label="Portfolio projects" value={data.content.projects} />
              <StatCard label="Case studies" value={data.content.caseStudies} />
              <StatCard label="Insights" value={data.content.posts} />
              <StatCard label="Open roles" value={data.content.openRoles} />
            </Grid>
          </section>

          <Grid columns={2}>
            <Panel title="Editorial workflow">
              <div style={{ display: 'grid', gap: 8 }}>
                {Object.entries(data.workflow).map(([status, count]) => (
                  <div
                    key={status}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <StatusBadge status={status} />
                    <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</strong>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              title="Enquiries"
              actions={
                can('leads:read') ? (
                  <Link href="/growth/leads" style={{ fontSize: 13, fontWeight: 600 }}>
                    Open leads
                  </Link>
                ) : null
              }
            >
              <Grid columns={2}>
                <StatCard label="Total leads" value={data.leads.total} />
                <StatCard label="New this week" value={data.leads.newThisWeek} hint="Last 7 days" />
              </Grid>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                {Object.entries(data.leads.byStatus).map(([status, count]) => (
                  <Badge key={status}>
                    {status.toLowerCase()}: {count}
                  </Badge>
                ))}
              </div>
            </Panel>
          </Grid>

          <Grid columns={3}>
            <StatCard label="Images in the library" value={data.media.images} />
            <StatCard label="Private documents" value={data.media.documents} />
            <StatCard
              label="Media storage used"
              value={`${(data.media.totalBytes / (1024 * 1024)).toFixed(1)} MB`}
            />
          </Grid>

          {can('audit:read') ? (
            <Panel
              title="Recent activity"
              padded={false}
              actions={
                <Link href="/admin/audit" style={{ fontSize: 13, fontWeight: 600 }}>
                  Full audit log
                </Link>
              }
            >
              {data.recentAudit.length === 0 ? (
                <EmptyState title="No activity recorded yet" />
              ) : (
                <TableWrap>
                  <Table caption="Recent administrative activity">
                    <thead>
                      <tr>
                        <th scope="col">Action</th>
                        <th scope="col">Record</th>
                        <th scope="col">Who</th>
                        <th scope="col">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentAudit.map((entry) => (
                        <tr key={entry.id}>
                          <td>
                            <Badge>{entry.action.toLowerCase().replace(/_/g, ' ')}</Badge>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{entry.entityLabel ?? '-'}</span>
                            <br />
                            <Mono>{entry.entityType.toLowerCase()}</Mono>
                          </td>
                          <td>{entry.actor?.email ?? 'anonymous'}</td>
                          <td>{new Date(entry.createdAt).toLocaleString('en-GB')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              )}
            </Panel>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
