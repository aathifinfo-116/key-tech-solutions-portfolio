'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { SeoHealthDto } from '@kts/shared-types';
import {
  Badge,
  Button,
  EmptyState,
  Grid,
  Notice,
  PageHeader,
  Panel,
  StatCard,
  Table,
  TableWrap,
  adminStyles as styles,
} from '@kts/admin-ui';
import { adminApi, describeError, useSession } from '@/lib/session';

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 } as const;

/**
 * Editorial SEO health.
 *
 * The score is Key Tech's own completeness checklist, expressed out of 100.
 * It is not a search engine ranking and cannot predict one - the page says so
 * plainly, because a number out of 100 invites exactly that misreading.
 */
export default function SeoHealthPage() {
  const { can } = useSession();
  const [severity, setSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const query = useQuery<SeoHealthDto>({
    queryKey: ['seo-health'],
    queryFn: () => adminApi.seoHealth(),
    enabled: can('seo:read'),
  });

  const issues = useMemo(() => {
    const all = query.data?.issues ?? [];
    const filtered = severity === 'all' ? all : all.filter((issue) => issue.severity === severity);
    return [...filtered].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }, [query.data, severity]);

  if (!can('seo:read')) {
    return (
      <>
        <PageHeader title="SEO health" />
        <Notice tone="warning" title="No access">
          Your role does not include seo:read.
        </Notice>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="SEO health"
        description="Where published content is missing the metadata, headings or alt text that make it easy to index."
      />

      <div style={{ marginBottom: 16 }}>
        <Notice tone="info" title="What this score is">
          This is an internal editorial completeness score, calculated from the checklist below. It
          is not a search engine ranking, it does not come from any search engine, and improving it
          does not guarantee a position. It simply tells you which pages are incompletely prepared.
        </Notice>
      </div>

      {query.error ? (
        <Notice tone="error" title="Could not run the audit">
          {describeError(query.error)}
        </Notice>
      ) : null}

      {query.isPending ? <Notice tone="info">Auditing published content...</Notice> : null}

      {query.data ? (
        <div style={{ display: 'grid', gap: 18 }}>
          <Grid columns={4}>
            <StatCard
              label="Editorial score"
              value={`${query.data.editorialScore}/100`}
              hint="Internal checklist only"
            />
            <StatCard label="Pages checked" value={query.data.checkedEntities} />
            <StatCard label="Errors" value={query.data.issueCounts.error} hint="Fix these first" />
            <StatCard label="Warnings" value={query.data.issueCounts.warning} />
          </Grid>

          <Panel
            title={`Issues (${issues.length})`}
            padded={false}
            actions={
              <div className={styles.inline}>
                {(['all', 'error', 'warning', 'info'] as const).map((level) => (
                  <Button
                    key={level}
                    small
                    variant={severity === level ? 'primary' : 'ghost'}
                    aria-pressed={severity === level}
                    onClick={() => setSeverity(level)}
                  >
                    {level === 'all' ? 'All' : level}
                  </Button>
                ))}
              </div>
            }
          >
            {issues.length === 0 ? (
              <EmptyState
                title="Nothing to fix at this level"
                description="Published content passes every check in this category."
              />
            ) : (
              <TableWrap>
                <Table caption="SEO issues">
                  <thead>
                    <tr>
                      <th scope="col">Severity</th>
                      <th scope="col">Page</th>
                      <th scope="col">Issue</th>
                      <th scope="col">
                        <span className="kt-visually-hidden">Fix</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue) => (
                      <tr key={`${issue.entityId}-${issue.code}`}>
                        <td>
                          <Badge
                            tone={
                              issue.severity === 'error'
                                ? 'error'
                                : issue.severity === 'warning'
                                  ? 'review'
                                  : 'neutral'
                            }
                          >
                            {issue.severity}
                          </Badge>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{issue.entityLabel}</span>
                          <br />
                          <span className={styles.cellMuted}>
                            {issue.entityType.toLowerCase().replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>{issue.message}</td>
                        <td>
                          <div className={styles.cellActions}>
                            <Link className={styles.cellPrimary} href={issue.adminPath}>
                              Fix
                            </Link>
                          </div>
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
