'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { JobApplicationDto, Paginated } from '@kts/shared-types';
import {
  Badge,
  Button,
  EmptyState,
  Input,
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

const STATUSES = [
  'RECEIVED',
  'SCREENING',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
  'ARCHIVED',
] as const;

/**
 * Job applications.
 *
 * CVs are never listed as links. Reading one requires the
 * `applications:download` permission, produces a five-minute signed URL, and
 * is written to the audit log with the actor's identity.
 */
export default function ApplicationsPage() {
  const { can } = useSession();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const query = useQuery<Paginated<JobApplicationDto>>({
    queryKey: ['applications', { page, search, status }],
    queryFn: () =>
      adminApi.applications({
        page,
        pageSize: 20,
        search: search || undefined,
        applicationStatus: status || undefined,
      }),
    enabled: can('applications:read'),
    placeholderData: keepPreviousData,
  });

  const update = useMutation({
    mutationFn: ({ id, applicationStatus }: { id: string; applicationStatus: string }) =>
      adminApi.updateApplication(id, { applicationStatus }),
    onSuccess: () => {
      setMessage({ tone: 'success', text: 'Application updated.' });
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  const cvLink = useMutation({
    mutationFn: (id: string) => adminApi.applicationCvLink(id),
    onSuccess: (result) => window.open(result.url, '_blank', 'noopener,noreferrer'),
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  if (!can('applications:read')) {
    return (
      <>
        <PageHeader title="Applications" />
        <Notice tone="warning" title="No access">
          Your role does not include applications:read.
        </Notice>
      </>
    );
  }

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;

  return (
    <>
      <PageHeader
        title="Job applications"
        description="Applications submitted through the careers pages. CVs stay in private storage."
      />

      {message ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      {query.error ? (
        <Notice tone="error" title="Could not load applications">
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
            <label htmlFor="application-search" className="kt-visually-hidden">
              Search applications
            </label>
            <Input
              id="application-search"
              type="search"
              placeholder="Search by applicant name or email"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </form>

          <label htmlFor="application-status" className="kt-visually-hidden">
            Filter by status
          </label>
          <Select
            id="application-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            style={{ width: 'auto' }}
          >
            <option value="">All statuses</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value.toLowerCase()}
              </option>
            ))}
          </Select>
        </Toolbar>

        <TableWrap>
          <Table caption="Job applications">
            <thead>
              <tr>
                <th scope="col">Applicant</th>
                <th scope="col">Role</th>
                <th scope="col">CV</th>
                <th scope="col">Status</th>
                <th scope="col">Applied</th>
                <th scope="col">
                  <span className="kt-visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            {query.isPending ? (
              <TableSkeleton columns={6} />
            ) : (
              <tbody>
                {items.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{application.applicantName}</span>
                      <br />
                      <span className={styles.cellMuted}>{application.email}</span>
                    </td>
                    <td className={styles.cellMuted}>{application.careerTitle}</td>
                    <td>
                      {application.hasCv ? (
                        <Badge tone="brand">Attached</Badge>
                      ) : (
                        <span className={styles.cellMuted}>None</span>
                      )}
                    </td>
                    <td>
                      <Select
                        aria-label={`Status for ${application.applicantName}`}
                        value={application.applicationStatus}
                        disabled={!can('applications:update')}
                        onChange={(event) =>
                          update.mutate({
                            id: application.id,
                            applicationStatus: event.target.value,
                          })
                        }
                        style={{ minHeight: 32, fontSize: 13 }}
                      >
                        {STATUSES.map((value) => (
                          <option key={value} value={value}>
                            {value.toLowerCase()}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className={styles.cellMuted}>
                      {new Date(application.appliedAt).toLocaleDateString('en-GB')}
                    </td>
                    <td>
                      <div className={styles.cellActions}>
                        {application.hasCv ? (
                          <Button
                            small
                            disabled={!can('applications:download') || cvLink.isPending}
                            onClick={() => cvLink.mutate(application.id)}
                          >
                            Download CV
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </Table>
        </TableWrap>

        {!query.isPending && items.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="Applications submitted against open roles appear here."
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
