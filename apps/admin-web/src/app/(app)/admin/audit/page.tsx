'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AuditLogDto, Paginated } from '@kts/shared-types';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Mono,
  Notice,
  PageHeader,
  Pagination,
  Panel,
  Select,
  Table,
  TableSkeleton,
  TableWrap,
  Toolbar,
  adminStyles as styles,
} from '@kts/admin-ui';
import { adminApi, describeError, useSession } from '@/lib/session';

const ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'ARCHIVE',
  'RESTORE',
  'PUBLISH',
  'UNPUBLISH',
  'SCHEDULE',
  'LOGIN',
  'LOGIN_FAILED',
  'LOGOUT',
  'PASSWORD_RESET_REQUEST',
  'PASSWORD_RESET_COMPLETE',
  'PASSWORD_CHANGE',
  'PERMISSION_CHANGE',
  'UPLOAD',
  'DOWNLOAD',
  'EXPORT',
  'STATUS_CHANGE',
];

/**
 * Audit log.
 *
 * Append-only and read-only from here. Credential-shaped values are redacted
 * before an entry is written, so the trail can be read without exposing
 * anything sensitive.
 */
export default function AuditPage() {
  const { can } = useSession();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const query = useQuery<Paginated<AuditLogDto>>({
    queryKey: ['audit', { page, action, search }],
    queryFn: () =>
      adminApi.auditLogs({
        page,
        pageSize: 40,
        action: action || undefined,
        search: search || undefined,
      }),
    enabled: can('audit:read'),
    placeholderData: keepPreviousData,
  });

  if (!can('audit:read')) {
    return (
      <>
        <PageHeader title="Audit log" />
        <Notice tone="warning" title="No access">
          Your role does not include audit:read.
        </Notice>
      </>
    );
  }

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Who changed what, and when. Entries cannot be edited or removed from this screen."
      />

      {query.error ? (
        <Notice tone="error" title="Could not load the audit log">
          {describeError(query.error)}
        </Notice>
      ) : null}

      <Panel padded={false}>
        <Toolbar>
          <form
            className={styles.search}
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput.trim());
              setPage(1);
            }}
          >
            <label htmlFor="audit-search" className="kt-visually-hidden">
              Search the audit log
            </label>
            <Input
              id="audit-search"
              type="search"
              placeholder="Search by record, summary or actor"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </form>

          <label htmlFor="audit-action" className="kt-visually-hidden">
            Filter by action
          </label>
          <Select
            id="audit-action"
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
            }}
            style={{ width: 'auto' }}
          >
            <option value="">All actions</option>
            {ACTIONS.map((value) => (
              <option key={value} value={value}>
                {value.toLowerCase().replace(/_/g, ' ')}
              </option>
            ))}
          </Select>

          {search || action ? (
            <Button
              small
              variant="ghost"
              onClick={() => {
                setSearch('');
                setSearchInput('');
                setAction('');
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </Toolbar>

        <TableWrap>
          <Table caption="Audit log">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Action</th>
                <th scope="col">Record</th>
                <th scope="col">Summary</th>
                <th scope="col">Actor</th>
                <th scope="col">Request</th>
              </tr>
            </thead>
            {query.isPending ? (
              <TableSkeleton columns={6} />
            ) : (
              <tbody>
                {items.map((entry) => (
                  <tr key={entry.id}>
                    <td className={styles.cellMuted} style={{ whiteSpace: 'nowrap' }}>
                      {new Date(entry.createdAt).toLocaleString('en-GB')}
                    </td>
                    <td>
                      <Badge tone={entry.action === 'LOGIN_FAILED' ? 'error' : 'neutral'}>
                        {entry.action.toLowerCase().replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{entry.entityLabel ?? '-'}</span>
                      <br />
                      <span className={styles.cellMuted}>
                        {entry.entityType.toLowerCase().replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className={styles.cellMuted}>{entry.summary ?? '-'}</td>
                    <td className={styles.cellMuted}>
                      {entry.actor?.email ?? 'anonymous'}
                      {entry.ipAddress ? (
                        <>
                          <br />
                          <Mono>{entry.ipAddress}</Mono>
                        </>
                      ) : null}
                    </td>
                    <td>
                      <Mono>{entry.requestId?.slice(0, 8) ?? '-'}</Mono>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </Table>
        </TableWrap>

        {!query.isPending && items.length === 0 ? (
          <EmptyState title="No entries match those filters" />
        ) : null}

        {meta ? (
          <Pagination
            page={meta.page}
            pageSize={meta.pageSize}
            total={meta.total}
            totalPages={meta.totalPages}
            onPage={setPage}
          />
        ) : null}
      </Panel>
    </>
  );
}
