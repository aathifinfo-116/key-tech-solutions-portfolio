'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  Panel,
  Select,
  adminStyles as styles,
} from '@kts/admin-ui';
import { adminApi, describeError, useSession } from '@/lib/session';

/**
 * Announcement bar.
 *
 * Only one announcement shows at a time: the active one with the lowest sort
 * order whose date window includes now. New announcements start inactive, so
 * publishing one is always a deliberate act.
 */
export default function AnnouncementsPage() {
  const { can } = useSession();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [draft, setDraft] = useState({
    message: '',
    linkLabel: '',
    linkHref: '',
    tone: 'BRAND',
    isActive: false,
  });

  const query = useQuery({
    queryKey: ['announcements'],
    queryFn: () => adminApi.announcements(),
    enabled: can('settings:read'),
  });

  const create = useMutation({
    mutationFn: () =>
      adminApi.createAnnouncement({
        message: draft.message,
        linkLabel: draft.linkLabel || undefined,
        linkHref: draft.linkHref || undefined,
        tone: draft.tone,
        isActive: draft.isActive,
      }),
    onSuccess: () => {
      setDraft({ message: '', linkLabel: '', linkHref: '', tone: 'BRAND', isActive: false });
      setMessage({ tone: 'success', text: 'Announcement created.' });
      void queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, current }: { id: string; current: Record<string, unknown> }) =>
      adminApi.updateAnnouncement(id, { ...current, isActive: !current.isActive }),
    onSuccess: () => {
      setMessage({ tone: 'success', text: 'Announcement updated.' });
      void queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteAnnouncement(id),
    onSuccess: () => {
      setMessage({ tone: 'success', text: 'Announcement deleted.' });
      void queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  if (!can('settings:read')) {
    return (
      <>
        <PageHeader title="Announcements" />
        <Notice tone="warning" title="No access">
          Your role does not include settings:read.
        </Notice>
      </>
    );
  }

  const items = query.data ?? [];
  const editable = can('settings:update');

  return (
    <>
      <PageHeader
        title="Announcements"
        description="The bar above the header. One shows at a time; the rest stay inactive until you switch them on."
      />

      {message ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      {editable ? (
        <div style={{ marginBottom: 18 }}>
          <Panel title="New announcement">
            <form
              className={styles.form}
              onSubmit={(event) => {
                event.preventDefault();
                create.mutate();
              }}
            >
              <Field label="Message">
                {({ id }) => (
                  <Input
                    id={id}
                    required
                    maxLength={240}
                    value={draft.message}
                    onChange={(event) => setDraft({ ...draft, message: event.target.value })}
                  />
                )}
              </Field>

              <FieldRow two>
                <Field label="Link label" optional>
                  {({ id }) => (
                    <Input
                      id={id}
                      value={draft.linkLabel}
                      onChange={(event) => setDraft({ ...draft, linkLabel: event.target.value })}
                    />
                  )}
                </Field>
                <Field label="Link destination" optional hint="Required when a link label is set.">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={draft.linkHref}
                      onChange={(event) => setDraft({ ...draft, linkHref: event.target.value })}
                    />
                  )}
                </Field>
              </FieldRow>

              <Field label="Tone">
                {({ id }) => (
                  <Select
                    id={id}
                    value={draft.tone}
                    onChange={(event) => setDraft({ ...draft, tone: event.target.value })}
                  >
                    <option value="BRAND">Brand</option>
                    <option value="INFO">Information</option>
                    <option value="SUCCESS">Success</option>
                    <option value="WARNING">Warning</option>
                  </Select>
                )}
              </Field>

              <CheckboxRow
                id="announcement-active"
                label="Show this announcement immediately"
                checked={draft.isActive}
                onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
              />

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={create.isPending || !draft.message.trim()}
                >
                  {create.isPending ? 'Saving...' : 'Create announcement'}
                </Button>
              </div>
            </form>
          </Panel>
        </div>
      ) : null}

      <Panel title={`Announcements (${items.length})`}>
        {items.length === 0 ? (
          <EmptyState
            title="No announcements"
            description="Create one above when you have something to say."
          />
        ) : (
          <div className={styles.stackTight}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  padding: 12,
                  border: '1px solid var(--kt-border-default)',
                  borderRadius: 10,
                }}
              >
                <div>
                  <p style={{ fontWeight: 600 }}>{item.message}</p>
                  <p className={styles.cellMuted}>
                    {item.tone.toLowerCase()}
                    {item.linkLabel ? ` - links to ${item.linkHref}` : ''}
                  </p>
                </div>
                <div className={styles.inline}>
                  {item.isActive ? <Badge tone="published">live</Badge> : <Badge>inactive</Badge>}
                  {editable ? (
                    <>
                      <Button
                        small
                        onClick={() =>
                          toggle.mutate({
                            id: item.id,
                            current: item as unknown as Record<string, unknown>,
                          })
                        }
                      >
                        {item.isActive ? 'Hide' : 'Show'}
                      </Button>
                      <Button
                        small
                        variant="danger"
                        onClick={() => {
                          if (window.confirm('Delete this announcement?')) remove.mutate(item.id);
                        }}
                      >
                        Delete
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
