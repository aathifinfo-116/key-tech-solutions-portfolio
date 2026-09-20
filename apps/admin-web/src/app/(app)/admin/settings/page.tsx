'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  EmptyState,
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

interface SettingRow {
  id: string;
  key: string;
  value: unknown;
  group: string;
  label: string;
  description: string | null;
  isPublic: boolean;
}

/**
 * Site settings.
 *
 * Values marked private are withheld from the public API, so an operational
 * address or an internal flag cannot leak into the website's settings payload.
 */
export default function SettingsPage() {
  const { can } = useSession();
  const queryClient = useQueryClient();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const query = useQuery<SettingRow[]>({
    queryKey: ['settings'],
    queryFn: () => adminApi.listSettings(),
    enabled: can('settings:read'),
  });

  const save = useMutation({
    mutationFn: (row: SettingRow) => {
      const raw = edits[row.key] ?? String(row.value ?? '');
      // Preserve the stored type rather than turning everything into a string.
      let value: unknown = raw;
      if (typeof row.value === 'boolean') value = raw === 'true';
      else if (typeof row.value === 'number') value = Number(raw);

      return adminApi.upsertSetting({
        key: row.key,
        value,
        group: row.group,
        label: row.label,
        description: row.description ?? undefined,
        isPublic: row.isPublic,
      });
    },
    onSuccess: () => {
      setMessage({ tone: 'success', text: 'Setting saved.' });
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  if (!can('settings:read')) {
    return (
      <>
        <PageHeader title="Settings" />
        <Notice tone="warning" title="No access">
          Your role does not include settings:read.
        </Notice>
      </>
    );
  }

  const rows = query.data ?? [];
  const groups = Array.from(new Set(rows.map((row) => row.group)));

  return (
    <>
      <PageHeader
        title="Site settings"
        description="Values the website reads at runtime, editable without a deployment."
      />

      {message ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      {query.isPending ? <Notice tone="info">Loading settings...</Notice> : null}
      {!query.isPending && rows.length === 0 ? <EmptyState title="No settings defined" /> : null}

      <div style={{ display: 'grid', gap: 18 }}>
        {groups.map((group) => (
          <Panel key={group} title={group} padded={false}>
            <TableWrap>
              <Table caption={`${group} settings`}>
                <thead>
                  <tr>
                    <th scope="col">Setting</th>
                    <th scope="col">Value</th>
                    <th scope="col">Visibility</th>
                    <th scope="col">
                      <span className="kt-visually-hidden">Save</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows
                    .filter((row) => row.group === group)
                    .map((row) => (
                      <tr key={row.id}>
                        <td>
                          <span style={{ fontWeight: 600 }}>{row.label}</span>
                          <br />
                          <Mono>{row.key}</Mono>
                          {row.description ? (
                            <p className={styles.cellMuted}>{row.description}</p>
                          ) : null}
                        </td>
                        <td style={{ minWidth: 260 }}>
                          <label htmlFor={`setting-${row.id}`} className="kt-visually-hidden">
                            {row.label}
                          </label>
                          <Input
                            id={`setting-${row.id}`}
                            value={edits[row.key] ?? String(row.value ?? '')}
                            disabled={!can('settings:update')}
                            onChange={(event) =>
                              setEdits({ ...edits, [row.key]: event.target.value })
                            }
                          />
                        </td>
                        <td>
                          {row.isPublic ? (
                            <Badge tone="neutral">public</Badge>
                          ) : (
                            <Badge tone="review">private</Badge>
                          )}
                        </td>
                        <td>
                          <div className={styles.cellActions}>
                            <Button
                              small
                              variant="primary"
                              disabled={
                                !can('settings:update') ||
                                edits[row.key] === undefined ||
                                save.isPending
                              }
                              onClick={() => save.mutate(row)}
                            >
                              Save
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </TableWrap>
          </Panel>
        ))}
      </div>
    </>
  );
}
