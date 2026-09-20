'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Paginated, RedirectRuleDto } from '@kts/shared-types';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  FieldRow,
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
  adminStyles as styles,
} from '@kts/admin-ui';
import { adminApi, describeError, useSession } from '@/lib/session';

const STATUS_OPTIONS = [
  { value: 'PERMANENT_301', label: '301 Moved permanently' },
  { value: 'PERMANENT_308', label: '308 Permanent redirect' },
  { value: 'FOUND_302', label: '302 Found (temporary)' },
  { value: 'TEMPORARY_307', label: '307 Temporary redirect' },
  { value: 'GONE_410', label: '410 Gone (no destination)' },
];

/**
 * Redirect rules.
 *
 * The API refuses loops, long chains, duplicate sources, unsafe external
 * destinations and anything pointing at the API, admin panel or preview
 * routes, so an invalid rule cannot be saved from here.
 */
export default function RedirectsPage() {
  const { can } = useSession();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [draft, setDraft] = useState({
    source: '',
    destination: '',
    status: 'PERMANENT_301',
    reason: '',
  });

  const query = useQuery<Paginated<RedirectRuleDto>>({
    queryKey: ['redirects', page],
    queryFn: () => adminApi.redirects({ page, pageSize: 25 }),
    enabled: can('redirects:read'),
    placeholderData: keepPreviousData,
  });

  const create = useMutation({
    mutationFn: () => adminApi.createRedirect(draft),
    onSuccess: () => {
      setDraft({ source: '', destination: '', status: 'PERMANENT_301', reason: '' });
      setMessage({ tone: 'success', text: 'Redirect created.' });
      void queryClient.invalidateQueries({ queryKey: ['redirects'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteRedirect(id),
    onSuccess: () => {
      setMessage({ tone: 'success', text: 'Redirect removed.' });
      void queryClient.invalidateQueries({ queryKey: ['redirects'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  if (!can('redirects:read')) {
    return (
      <>
        <PageHeader title="Redirects" />
        <Notice tone="warning" title="No access">
          Your role does not include redirects:read.
        </Notice>
      </>
    );
  }

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;

  return (
    <>
      <PageHeader
        title="Redirects"
        description="Keep old URLs working. Renaming a published slug creates a 301 here automatically."
      />

      {message ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      {can('redirects:create') ? (
        <div style={{ marginBottom: 18 }}>
          <Panel title="Add a redirect">
            <form
              className={styles.form}
              onSubmit={(event) => {
                event.preventDefault();
                create.mutate();
              }}
            >
              <FieldRow two>
                <Field label="Source path" hint="A path on this site, such as /old-services.">
                  {({ id }) => (
                    <Input
                      id={id}
                      required
                      placeholder="/old-path"
                      value={draft.source}
                      onChange={(event) => setDraft({ ...draft, source: event.target.value })}
                    />
                  )}
                </Field>
                <Field
                  label="Destination"
                  optional={draft.status === 'GONE_410'}
                  hint={
                    draft.status === 'GONE_410'
                      ? 'Not used for a 410 response.'
                      : 'A path on this site.'
                  }
                >
                  {({ id }) => (
                    <Input
                      id={id}
                      placeholder="/new-path"
                      value={draft.destination}
                      disabled={draft.status === 'GONE_410'}
                      onChange={(event) => setDraft({ ...draft, destination: event.target.value })}
                    />
                  )}
                </Field>
              </FieldRow>

              <FieldRow two>
                <Field label="Response">
                  {({ id }) => (
                    <Select
                      id={id}
                      value={draft.status}
                      onChange={(event) => setDraft({ ...draft, status: event.target.value })}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field
                  label="Reason"
                  optional
                  hint="Why this rule exists. Future you will be grateful."
                >
                  {({ id }) => (
                    <Input
                      id={id}
                      value={draft.reason}
                      onChange={(event) => setDraft({ ...draft, reason: event.target.value })}
                    />
                  )}
                </Field>
              </FieldRow>

              <div>
                <Button type="submit" variant="primary" disabled={create.isPending}>
                  {create.isPending ? 'Saving...' : 'Create redirect'}
                </Button>
              </div>
            </form>
          </Panel>
        </div>
      ) : null}

      <Panel title={`Rules${meta ? ` (${meta.total})` : ''}`} padded={false}>
        <TableWrap>
          <Table caption="Redirect rules">
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col">Destination</th>
                <th scope="col">Response</th>
                <th scope="col">Hits</th>
                <th scope="col">Reason</th>
                <th scope="col">
                  <span className="kt-visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            {query.isPending ? (
              <TableSkeleton columns={6} />
            ) : (
              <tbody>
                {items.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <Mono>{rule.source}</Mono>
                    </td>
                    <td>
                      <Mono>{rule.destination || '(gone)'}</Mono>
                    </td>
                    <td>
                      <Badge
                        tone={
                          rule.httpStatus === 301 || rule.httpStatus === 308
                            ? 'published'
                            : 'neutral'
                        }
                      >
                        {rule.httpStatus}
                      </Badge>
                      {!rule.isActive ? <Badge tone="error">inactive</Badge> : null}
                    </td>
                    <td className={styles.cellMuted}>{rule.hitCount}</td>
                    <td className={styles.cellMuted}>{rule.reason ?? '-'}</td>
                    <td>
                      <div className={styles.cellActions}>
                        <Button
                          small
                          variant="danger"
                          disabled={!can('redirects:delete') || remove.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete the redirect from ${rule.source}? Existing links to it will 404.`,
                              )
                            ) {
                              remove.mutate(rule.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
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
            title="No redirects yet"
            description="Rules appear here automatically when a published slug changes, or add one above."
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
