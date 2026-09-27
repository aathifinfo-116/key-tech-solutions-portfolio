'use client';

import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { LEAD_STATUS_LABEL, type LeadDto, type Paginated } from '@kts/shared-types';
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
  StatusBadge,
  Table,
  TableSkeleton,
  TableWrap,
  Toolbar,
  adminStyles as styles,
} from '@kts/admin-ui';
import { adminApi, describeError, useSession } from '@/lib/session';

const API_BASE = (process.env.NEXT_PUBLIC_ADMIN_API_URL ?? 'http://localhost:4010').replace(
  /\/+$/,
  '',
);

/**
 * Leads, contact messages and quote requests.
 *
 * Suspected spam is stored and flagged rather than discarded, so a false
 * positive can be recovered by a human instead of being silently lost.
 */
export default function LeadsPage() {
  const { can } = useSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [leadStatus, setLeadStatus] = useState('');
  const [type, setType] = useState('');

  const query = useQuery<Paginated<LeadDto>>({
    queryKey: ['leads', { page, search, leadStatus, type }],
    queryFn: () =>
      adminApi.leads({
        page,
        pageSize: 20,
        search: search || undefined,
        leadStatus: leadStatus || undefined,
        type: type || undefined,
      }),
    enabled: can('leads:read'),
    placeholderData: keepPreviousData,
  });

  if (!can('leads:read')) {
    return (
      <>
        <PageHeader title="Leads" />
        <Notice tone="warning" title="No access">
          Your role does not include leads:read.
        </Notice>
      </>
    );
  }

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;

  return (
    <>
      <PageHeader
        title="Leads and quote requests"
        description="Every enquiry from the website, with its reference, source and current status."
        actions={
          can('leads:export') ? (
            <LinkButton href={`${API_BASE}/api/v1/admin/leads/export`} variant="secondary">
              Export CSV
            </LinkButton>
          ) : null
        }
      />

      {query.error ? (
        <Notice tone="error" title="Could not load leads">
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
            <label htmlFor="lead-search" className="kt-visually-hidden">
              Search leads
            </label>
            <Input
              id="lead-search"
              type="search"
              placeholder="Search by name, email, organisation or reference"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </form>

          <label htmlFor="lead-status" className="kt-visually-hidden">
            Filter by status
          </label>
          <Select
            id="lead-status"
            value={leadStatus}
            onChange={(event) => {
              setLeadStatus(event.target.value);
              setPage(1);
            }}
            style={{ width: 'auto' }}
          >
            <option value="">All statuses</option>
            {Object.entries(LEAD_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <label htmlFor="lead-type" className="kt-visually-hidden">
            Filter by type
          </label>
          <Select
            id="lead-type"
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setPage(1);
            }}
            style={{ width: 'auto' }}
          >
            <option value="">All types</option>
            <option value="CONTACT">Contact message</option>
            <option value="QUOTE">Quote request</option>
          </Select>

          {search || leadStatus || type ? (
            <Button
              small
              variant="ghost"
              onClick={() => {
                setSearch('');
                setSearchInput('');
                setLeadStatus('');
                setType('');
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </Toolbar>

        <TableWrap>
          <Table caption="Leads">
            <thead>
              <tr>
                <th scope="col">Reference</th>
                <th scope="col">From</th>
                <th scope="col">Type</th>
                <th scope="col">Subject</th>
                <th scope="col">Status</th>
                <th scope="col">Assigned</th>
                <th scope="col">Received</th>
              </tr>
            </thead>
            {query.isPending ? (
              <TableSkeleton columns={7} />
            ) : (
              <tbody>
                {items.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <Link className={styles.cellPrimary} href={`/growth/leads/${lead.id}`}>
                        {lead.reference}
                      </Link>
                      {lead.spamScore >= 0.7 ? (
                        <>
                          {' '}
                          <Badge tone="error">spam suspected</Badge>
                        </>
                      ) : null}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{lead.name}</span>
                      <br />
                      <span className={styles.cellMuted}>{lead.organization ?? lead.email}</span>
                    </td>
                    <td>
                      <Badge>{lead.type === 'QUOTE' ? 'Quote' : 'Contact'}</Badge>
                    </td>
                    <td className={styles.cellMuted}>{lead.subject ?? '-'}</td>
                    <td>
                      <StatusBadge status={lead.leadStatus} />
                    </td>
                    <td className={styles.cellMuted}>{lead.assignedTo?.name ?? 'Unassigned'}</td>
                    <td className={styles.cellMuted}>
                      {new Date(lead.createdAt).toLocaleString('en-GB')}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </Table>
        </TableWrap>

        {!query.isPending && items.length === 0 ? (
          <EmptyState
            title={
              search || leadStatus || type ? 'Nothing matches those filters' : 'No enquiries yet'
            }
            description="Submissions from the contact and quote forms appear here as they arrive."
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
