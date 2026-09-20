'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PermissionDto, RoleDto } from '@kts/shared-types';
import {
  Badge,
  Button,
  CheckboxRow,
  Grid,
  Notice,
  PageHeader,
  Panel,
  PermissionGrid,
  ScrollBox,
  adminStyles as styles,
} from '@kts/admin-ui';
import { adminApi, describeError, useSession } from '@/lib/session';

/**
 * Roles and permissions.
 *
 * Permissions are stored in the database and enforced by the API, so this
 * screen changes real authorisation rather than just what the menu shows.
 * The Super Administrator role always holds everything and is not editable.
 */
export default function RolesPage() {
  const { can } = useSession();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const roles = useQuery<RoleDto[]>({
    queryKey: ['roles'],
    queryFn: () => adminApi.roles(),
    enabled: can('roles:read'),
  });

  const permissions = useQuery<PermissionDto[]>({
    queryKey: ['permissions'],
    queryFn: () => adminApi.permissions(),
    enabled: can('roles:read'),
  });

  const selected = roles.data?.find((role) => role.id === selectedId) ?? null;

  const families = useMemo(() => {
    const map = new Map<string, PermissionDto[]>();
    for (const permission of permissions.data ?? []) {
      if (!map.has(permission.family)) map.set(permission.family, []);
      map.get(permission.family)?.push(permission);
    }
    return Array.from(map.entries());
  }, [permissions.data]);

  const save = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error('No role selected');
      return adminApi.updateRole(selected.id, {
        key: selected.key,
        name: selected.name,
        description: selected.description ?? undefined,
        permissionKeys: Array.from(draft),
      });
    },
    onSuccess: () => {
      setMessage({
        tone: 'success',
        text: 'Permissions saved. Affected users were signed out so the change takes effect.',
      });
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  if (!can('roles:read')) {
    return (
      <>
        <PageHeader title="Roles" />
        <Notice tone="warning" title="No access">
          Your role does not include roles:read.
        </Notice>
      </>
    );
  }

  const isSuperAdmin = selected?.key === 'super-administrator';

  return (
    <>
      <PageHeader
        title="Roles and permissions"
        description="What each role can do. Enforced by the API on every request, not just hidden in the menu."
      />

      {message ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      <Grid columns={3}>
        <Panel title={`Roles (${roles.data?.length ?? 0})`}>
          <div className={styles.stackTight}>
            {(roles.data ?? []).map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  setSelectedId(role.id);
                  setDraft(new Set(role.permissions));
                  setMessage(null);
                }}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: `1px solid ${selectedId === role.id ? 'var(--kt-color-purple)' : 'var(--kt-border-default)'}`,
                  background: selectedId === role.id ? 'var(--kt-color-soft-purple)' : '#fff',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontWeight: 600, display: 'block' }}>{role.name}</span>
                <span className={styles.cellMuted}>
                  {role.permissions.length} permissions &middot; {role.userCount} user
                  {role.userCount === 1 ? '' : 's'}
                </span>
              </button>
            ))}
          </div>
        </Panel>

        <div style={{ gridColumn: 'span 2' }}>
          {!selected ? (
            <Panel>
              <p className={styles.cellMuted}>Choose a role to review or change its permissions.</p>
            </Panel>
          ) : (
            <Panel
              title={selected.name}
              actions={
                <>
                  {selected.isSystem ? <Badge>system role</Badge> : null}
                  <Button
                    variant="primary"
                    disabled={!can('roles:update') || isSuperAdmin || save.isPending}
                    onClick={() => save.mutate()}
                  >
                    {save.isPending ? 'Saving...' : 'Save permissions'}
                  </Button>
                </>
              }
            >
              {selected.description ? (
                <p className={styles.cellMuted}>{selected.description}</p>
              ) : null}

              {isSuperAdmin ? (
                <div style={{ marginTop: 12 }}>
                  <Notice tone="info">
                    The Super Administrator role always holds every permission, including ones added
                    in future releases, so it cannot be edited.
                  </Notice>
                </div>
              ) : null}

              <div style={{ marginTop: 14 }}>
                <ScrollBox>
                  <div className={styles.stack}>
                    {families.map(([family, items]) => (
                      <fieldset key={family} style={{ border: 0, padding: 0, margin: 0 }}>
                        <legend className={styles.label} style={{ marginBottom: 6 }}>
                          {family.replace(/-/g, ' ')}
                        </legend>
                        <PermissionGrid>
                          {items.map((permission) => (
                            <CheckboxRow
                              key={permission.key}
                              id={`perm-${permission.key}`}
                              label={permission.action}
                              checked={isSuperAdmin || draft.has(permission.key)}
                              disabled={!can('roles:update') || isSuperAdmin}
                              onChange={(event) => {
                                const next = new Set(draft);
                                if (event.target.checked) next.add(permission.key);
                                else next.delete(permission.key);
                                setDraft(next);
                              }}
                            />
                          ))}
                        </PermissionGrid>
                      </fieldset>
                    ))}
                  </div>
                </ScrollBox>
              </div>
            </Panel>
          )}
        </div>
      </Grid>
    </>
  );
}
