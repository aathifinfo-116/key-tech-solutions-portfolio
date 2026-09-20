'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Paginated } from '@kts/shared-types';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  LinkButton,
  Notice,
  PageHeader,
  Pagination,
  Panel,
  Select,
  SortHeader,
  StatusBadge,
  Table,
  TableSkeleton,
  TableWrap,
  Toolbar,
  adminStyles as styles,
} from '@kts/admin-ui';
import { findResource, readPath, type ColumnDef } from '@/lib/resources';
import { adminApi, describeError, useSession } from '@/lib/session';

/**
 * Generic content listing.
 *
 * Driven entirely by the resource registry, so every content type gets the
 * same search, sorting, filtering, pagination and empty/loading/error states
 * without a bespoke page each.
 */
export default function ResourceListPage() {
  const params = useParams<{ resource: string }>();
  const resource = findResource(params.resource);
  if (!resource) notFound();

  const { can } = useSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [includeArchived, setIncludeArchived] = useState(false);

  const canRead = can(`${resource.permissionFamily}:read`);
  const canCreate = can(`${resource.permissionFamily}:create`);

  const query = useQuery<Paginated<Record<string, unknown>>>({
    queryKey: [resource.key, { page, search, status, sortBy, sortDir, includeArchived }],
    queryFn: () =>
      adminApi.list(resource.api, {
        page,
        pageSize: 20,
        search: search || undefined,
        status: status || undefined,
        sortBy,
        sortDir,
        includeArchived: includeArchived || undefined,
      }),
    enabled: canRead,
    placeholderData: keepPreviousData,
  });

  const columns = useMemo(() => resource.columns, [resource]);

  if (!canRead) {
    return (
      <>
        <PageHeader title={resource.plural} />
        <Notice tone="warning" title="No access">
          Your role does not include {resource.permissionFamily}:read.
        </Notice>
      </>
    );
  }

  const onSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;

  return (
    <>
      <PageHeader
        title={resource.plural}
        description={resource.description}
        actions={
          canCreate ? (
            <LinkButton href={`/content/${resource.key}/new`} variant="primary">
              New {resource.singular.toLowerCase()}
            </LinkButton>
          ) : null
        }
      />

      {query.error ? (
        <Notice tone="error" title={`Could not load ${resource.plural.toLowerCase()}`}>
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
            <label htmlFor="resource-search" className="kt-visually-hidden">
              Search {resource.plural}
            </label>
            <Input
              id="resource-search"
              type="search"
              placeholder={`Search ${resource.plural.toLowerCase()}`}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </form>

          {resource.publishable ? (
            <>
              <label htmlFor="resource-status" className="kt-visually-hidden">
                Filter by status
              </label>
              <Select
                id="resource-status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                style={{ width: 'auto' }}
              >
                <option value="">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="REVIEW">In review</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </>
          ) : null}

          <Button
            small
            onClick={() => {
              setIncludeArchived(!includeArchived);
              setPage(1);
            }}
            aria-pressed={includeArchived}
          >
            {includeArchived ? 'Hiding nothing' : 'Show archived'}
          </Button>

          {search || status || includeArchived ? (
            <Button
              small
              variant="ghost"
              onClick={() => {
                setSearch('');
                setSearchInput('');
                setStatus('');
                setIncludeArchived(false);
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </Toolbar>

        <TableWrap>
          <Table caption={`${resource.plural} list`}>
            <thead>
              <tr>
                {columns.map((column) =>
                  column.sortable ? (
                    <SortHeader
                      key={column.key}
                      label={column.label}
                      field={column.key}
                      activeField={sortBy}
                      direction={sortDir}
                      onSort={onSort}
                    />
                  ) : (
                    <th key={column.key} scope="col">
                      {column.label}
                    </th>
                  ),
                )}
                <th scope="col">
                  <span className="kt-visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>

            {query.isPending ? (
              <TableSkeleton columns={columns.length + 1} />
            ) : (
              <tbody>
                {items.map((item) => {
                  const id = String(item.id);
                  return (
                    <tr key={id}>
                      {columns.map((column) => (
                        <td key={column.key}>
                          {renderCell(item, column, `/content/${resource.key}/${id}`)}
                        </td>
                      ))}
                      <td>
                        <div className={styles.cellActions}>
                          <LinkButton small href={`/content/${resource.key}/${id}`}>
                            Edit
                          </LinkButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </Table>
        </TableWrap>

        {!query.isPending && items.length === 0 ? (
          <EmptyState
            title={
              search || status
                ? 'Nothing matches those filters'
                : `No ${resource.plural.toLowerCase()} yet`
            }
            description={
              search || status
                ? 'Try a different search term or clear the filters.'
                : `Create the first ${resource.singular.toLowerCase()} to get started.`
            }
            action={
              canCreate && !search && !status ? (
                <LinkButton href={`/content/${resource.key}/new`} variant="primary">
                  New {resource.singular.toLowerCase()}
                </LinkButton>
              ) : null
            }
          />
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

function renderCell(item: Record<string, unknown>, column: ColumnDef, href: string) {
  const value = readPath(item, column.key);

  switch (column.render) {
    case 'link':
      return (
        <Link className={styles.cellPrimary} href={href}>
          {String(value ?? 'Untitled')}
        </Link>
      );
    case 'status':
      return value ? (
        <StatusBadge status={String(value)} />
      ) : (
        <span className={styles.cellMuted}>-</span>
      );
    case 'date':
      return value ? (
        <span className={styles.cellMuted}>
          {new Date(String(value)).toLocaleDateString('en-GB')}
        </span>
      ) : (
        <span className={styles.cellMuted}>-</span>
      );
    case 'boolean':
      return value ? <Badge tone="brand">Yes</Badge> : <span className={styles.cellMuted}>No</span>;
    case 'muted':
      return <span className={styles.cellMuted}>{value ? String(value) : '-'}</span>;
    default:
      return <span>{value === null || value === undefined ? '-' : String(value)}</span>;
  }
}
