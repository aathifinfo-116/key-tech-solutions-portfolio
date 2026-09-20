'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminUserDto, Paginated, RoleDto } from '@kts/shared-types';
import {
  Badge,
  Button,
  CheckboxRow,
  EmptyState,
  Field,
  FieldRow,
  Input,
  Notice,
  PageHeader,
  Pagination,
  Panel,
  Select,
  StatusBadge,
  Table,
  TableSkeleton,
  TableWrap,
  adminStyles as styles,
} from '@kts/admin-ui';
import { adminApi, describeError, useSession } from '@/lib/session';

/**
 * Admin users.
 *
 * An account created without a password is INVITED: it cannot sign in until
 * the invitee sets one through a single-use emailed link. The API separately
 * refuses to leave the platform without an active Super Administrator.
 */
export default function UsersPage() {
  const { can, user: currentUser } = useSession();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [draft, setDraft] = useState({
    email: '',
    name: '',
    jobTitle: '',
    roleIds: [] as string[],
  });

  const users = useQuery<Paginated<AdminUserDto>>({
    queryKey: ['users', page],
    queryFn: () => adminApi.users({ page, pageSize: 25 }),
    enabled: can('users:read'),
    placeholderData: keepPreviousData,
  });

  const roles = useQuery<RoleDto[]>({
    queryKey: ['roles'],
    queryFn: () => adminApi.roles(),
    enabled: can('roles:read'),
  });

  const invite = useMutation({
    mutationFn: () => adminApi.createUser({ ...draft, mustChangePassword: true }),
    onSuccess: () => {
      setDraft({ email: '', name: '', jobTitle: '', roleIds: [] });
      setMessage({
        tone: 'success',
        text: 'Invitation sent. The account stays inactive until they set a password.',
      });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateUser(id, { status }),
    onSuccess: () => {
      setMessage({ tone: 'success', text: 'Account updated. Any live sessions were signed out.' });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  if (!can('users:read')) {
    return (
      <>
        <PageHeader title="Users" />
        <Notice tone="warning" title="No access">
          Your role does not include users:read.
        </Notice>
      </>
    );
  }

  const items = users.data?.items ?? [];
  const meta = users.data?.meta;

  return (
    <>
      <PageHeader
        title="Admin users"
        description="Who can sign in, and what each of them can do."
      />

      {message ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      {can('users:create') ? (
        <div style={{ marginBottom: 18 }}>
          <Panel title="Invite a user">
            <form
              className={styles.form}
              onSubmit={(event) => {
                event.preventDefault();
                invite.mutate();
              }}
            >
              <FieldRow two>
                <Field label="Full name">
                  {({ id }) => (
                    <Input
                      id={id}
                      required
                      value={draft.name}
                      onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                    />
                  )}
                </Field>
                <Field label="Email address">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="email"
                      required
                      value={draft.email}
                      onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                    />
                  )}
                </Field>
              </FieldRow>

              <Field label="Job title" optional>
                {({ id }) => (
                  <Input
                    id={id}
                    value={draft.jobTitle}
                    onChange={(event) => setDraft({ ...draft, jobTitle: event.target.value })}
                  />
                )}
              </Field>

              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className={styles.label} style={{ marginBottom: 8 }}>
                  Roles
                </legend>
                <div className={styles.permissionGrid}>
                  {(roles.data ?? []).map((role) => (
                    <CheckboxRow
                      key={role.id}
                      id={`role-${role.id}`}
                      label={role.name}
                      checked={draft.roleIds.includes(role.id)}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          roleIds: event.target.checked
                            ? [...draft.roleIds, role.id]
                            : draft.roleIds.filter((value) => value !== role.id),
                        })
                      }
                    />
                  ))}
                </div>
              </fieldset>

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={invite.isPending || draft.roleIds.length === 0}
                >
                  {invite.isPending ? 'Sending...' : 'Send invitation'}
                </Button>
              </div>
            </form>
          </Panel>
        </div>
      ) : null}

      <Panel title={`Users${meta ? ` (${meta.total})` : ''}`} padded={false}>
        <TableWrap>
          <Table caption="Admin users">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Roles</th>
                <th scope="col">Status</th>
                <th scope="col">Last sign-in</th>
                <th scope="col">
                  <span className="kt-visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            {users.isPending ? (
              <TableSkeleton columns={5} />
            ) : (
              <tbody>
                {items.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{user.name}</span>
                      {user.id === currentUser.id ? <Badge tone="brand"> you</Badge> : null}
                      <br />
                      <span className={styles.cellMuted}>{user.email}</span>
                    </td>
                    <td>
                      <div className={styles.chipRow}>
                        {user.roles.map((role) => (
                          <Badge key={role.id}>{role.name}</Badge>
                        ))}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={user.status} />
                      {user.mustChangePassword ? (
                        <Badge tone="review">must change password</Badge>
                      ) : null}
                    </td>
                    <td className={styles.cellMuted}>
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString('en-GB')
                        : 'Never'}
                    </td>
                    <td>
                      <div className={styles.cellActions}>
                        <Select
                          aria-label={`Status for ${user.name}`}
                          value={user.status}
                          disabled={!can('users:update') || user.id === currentUser.id}
                          onChange={(event) =>
                            updateStatus.mutate({ id: user.id, status: event.target.value })
                          }
                          style={{ minHeight: 32, fontSize: 13, width: 'auto' }}
                        >
                          <option value="INVITED">Invited</option>
                          <option value="ACTIVE">Active</option>
                          <option value="SUSPENDED">Suspended</option>
                          <option value="DISABLED">Disabled</option>
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </Table>
        </TableWrap>

        {!users.isPending && items.length === 0 ? <EmptyState title="No admin users" /> : null}

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
