'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { changePasswordSchema, passwordStrength, type ChangePasswordInput } from '@kts/validation';
import {
  Badge,
  Button,
  Field,
  Grid,
  Input,
  Mono,
  Notice,
  PageHeader,
  Panel,
  Table,
  TableWrap,
  adminStyles as styles,
} from '@kts/admin-ui';
import { adminApi, describeError, useSession } from '@/lib/session';

/**
 * Your account.
 *
 * Changing a password signs out every other device but keeps this one, so an
 * administrator can revoke a stolen session without locking themselves out.
 */
export default function AccountPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const sessions = useQuery({
    queryKey: ['sessions'],
    queryFn: () => adminApi.sessions(),
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const password = watch('password') ?? '';
  const strength = passwordStrength(password);

  const revoke = useMutation({
    mutationFn: (id: string) => adminApi.revokeSession(id),
    onSuccess: () => {
      setMessage({ tone: 'success', text: 'Session revoked.' });
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  return (
    <>
      <PageHeader title="Your account" description="Your details, password and active sessions." />

      {message ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      <Grid columns={2}>
        <div style={{ display: 'grid', gap: 18 }}>
          <Panel title="Details">
            <dl style={{ display: 'grid', gap: 10, margin: 0 }}>
              <Row label="Name" value={user.name} />
              <Row label="Email" value={user.email} />
              <Row label="Job title" value={user.jobTitle ?? '-'} />
              <Row
                label="Status"
                value={<Badge tone="published">{user.status.toLowerCase()}</Badge>}
              />
              <Row
                label="Roles"
                value={
                  <div className={styles.chipRow}>
                    {user.roles.map((role) => (
                      <Badge key={role.id}>{role.name}</Badge>
                    ))}
                  </div>
                }
              />
              <Row label="Permissions" value={`${user.permissions.length} granted`} />
            </dl>
          </Panel>

          <Panel title="Change password">
            <form
              className={styles.form}
              noValidate
              onSubmit={handleSubmit(async (values) => {
                setMessage(null);
                try {
                  const result = await adminApi.changePassword(values);
                  reset();
                  setMessage({ tone: 'success', text: result.message });
                  void queryClient.invalidateQueries({ queryKey: ['session'] });
                  void queryClient.invalidateQueries({ queryKey: ['sessions'] });
                } catch (error) {
                  setMessage({ tone: 'error', text: describeError(error) });
                }
              })}
            >
              <Field label="Current password" error={errors.currentPassword?.message}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    type="password"
                    autoComplete="current-password"
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    {...register('currentPassword')}
                  />
                )}
              </Field>

              <Field
                label="New password"
                error={errors.password?.message}
                hint="At least 12 characters, with upper and lower case, a number and a symbol."
                counter={password ? <span className={styles.counter}>{strength.label}</span> : null}
              >
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    type="password"
                    autoComplete="new-password"
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    {...register('password')}
                  />
                )}
              </Field>

              <Field label="Confirm new password" error={errors.confirmPassword?.message}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    type="password"
                    autoComplete="new-password"
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    {...register('confirmPassword')}
                  />
                )}
              </Field>

              <div>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Change password'}
                </Button>
              </div>

              <Notice tone="info">
                Changing your password signs out every other device. This one stays signed in.
              </Notice>
            </form>
          </Panel>
        </div>

        <Panel title="Active sessions" padded={false}>
          <TableWrap>
            <Table caption="Your active sessions">
              <thead>
                <tr>
                  <th scope="col">Device</th>
                  <th scope="col">Signed in</th>
                  <th scope="col">
                    <span className="kt-visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(sessions.data ?? []).map((session) => (
                  <tr key={session.id}>
                    <td>
                      <span className={styles.cellMuted} style={{ wordBreak: 'break-word' }}>
                        {session.userAgent ?? 'Unknown device'}
                      </span>
                      {session.current ? (
                        <>
                          <br />
                          <Badge tone="brand">this device</Badge>
                        </>
                      ) : null}
                      {session.ipAddress ? (
                        <>
                          <br />
                          <Mono>{session.ipAddress}</Mono>
                        </>
                      ) : null}
                    </td>
                    <td className={styles.cellMuted}>
                      {new Date(session.createdAt).toLocaleString('en-GB')}
                    </td>
                    <td>
                      <div className={styles.cellActions}>
                        {!session.current ? (
                          <Button small variant="danger" onClick={() => revoke.mutate(session.id)}>
                            Revoke
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Panel>
      </Grid>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 10 }}>
      <dt className={styles.cellMuted}>{label}</dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </div>
  );
}
