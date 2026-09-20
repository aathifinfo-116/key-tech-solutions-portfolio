'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FooterGroupDto } from '@kts/shared-types';
import {
  Button,
  Field,
  FieldRow,
  Input,
  Notice,
  PageHeader,
  Panel,
  adminStyles as styles,
} from '@kts/admin-ui';
import { adminApi, describeError, useSession } from '@/lib/session';

interface DraftGroup {
  key: string;
  title: string;
  links: Array<{ label: string; href: string }>;
}

/**
 * Footer groups and links.
 *
 * Each group is saved on its own, so one column can be corrected without
 * re-submitting the whole footer.
 */
export default function FooterPage() {
  const { can } = useSession();
  const queryClient = useQueryClient();
  const [groups, setGroups] = useState<DraftGroup[]>([]);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const footer = useQuery<FooterGroupDto[]>({
    queryKey: ['footer'],
    queryFn: () => adminApi.footer(),
    enabled: can('navigation:read'),
  });

  useEffect(() => {
    if (!footer.data) return;
    setGroups(
      footer.data.map((group) => ({
        key: group.key,
        title: group.title,
        links: group.links.map((link) => ({ label: link.label, href: link.href })),
      })),
    );
  }, [footer.data]);

  const save = useMutation({
    mutationFn: (group: DraftGroup) =>
      adminApi.saveFooterGroup({
        key: group.key,
        title: group.title,
        sortOrder: groups.findIndex((candidate) => candidate.key === group.key),
        isActive: true,
        links: group.links.map((link, index) => ({
          label: link.label,
          href: link.href,
          isExternal: /^https?:\/\//i.test(link.href),
          sortOrder: index,
          isActive: true,
        })),
      }),
    onSuccess: () => {
      setMessage({ tone: 'success', text: 'Footer group saved.' });
      void queryClient.invalidateQueries({ queryKey: ['footer'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  if (!can('navigation:read')) {
    return (
      <>
        <PageHeader title="Footer" />
        <Notice tone="warning" title="No access">
          Your role does not include navigation:read.
        </Notice>
      </>
    );
  }

  const editable = can('navigation:update');

  const patch = (index: number, next: Partial<DraftGroup>) =>
    setGroups((current) =>
      current.map((group, i) => (i === index ? { ...group, ...next } : group)),
    );

  return (
    <>
      <PageHeader
        title="Footer"
        description="The link columns at the bottom of every public page."
      />

      {message ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      {footer.isPending ? <Notice tone="info">Loading footer...</Notice> : null}

      <div style={{ display: 'grid', gap: 14 }}>
        {groups.map((group, index) => (
          <Panel
            key={group.key}
            title={group.title || group.key}
            actions={
              editable ? (
                <Button
                  small
                  variant="primary"
                  onClick={() => save.mutate(group)}
                  disabled={save.isPending}
                >
                  Save group
                </Button>
              ) : null
            }
          >
            <div className={styles.form}>
              <Field label="Group title">
                {({ id }) => (
                  <Input
                    id={id}
                    value={group.title}
                    disabled={!editable}
                    onChange={(event) => patch(index, { title: event.target.value })}
                  />
                )}
              </Field>

              {group.links.map((link, linkIndex) => (
                <FieldRow key={linkIndex} two>
                  <Field label={`Link ${linkIndex + 1} label`}>
                    {({ id }) => (
                      <Input
                        id={id}
                        value={link.label}
                        disabled={!editable}
                        onChange={(event) =>
                          patch(index, {
                            links: group.links.map((item, i) =>
                              i === linkIndex ? { ...item, label: event.target.value } : item,
                            ),
                          })
                        }
                      />
                    )}
                  </Field>
                  <Field label={`Link ${linkIndex + 1} destination`}>
                    {({ id }) => (
                      <div className={styles.inline}>
                        <Input
                          id={id}
                          value={link.href}
                          disabled={!editable}
                          onChange={(event) =>
                            patch(index, {
                              links: group.links.map((item, i) =>
                                i === linkIndex ? { ...item, href: event.target.value } : item,
                              ),
                            })
                          }
                        />
                        {editable ? (
                          <Button
                            small
                            variant="danger"
                            onClick={() =>
                              patch(index, { links: group.links.filter((_, i) => i !== linkIndex) })
                            }
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    )}
                  </Field>
                </FieldRow>
              ))}

              {editable ? (
                <div>
                  <Button
                    small
                    onClick={() =>
                      patch(index, { links: [...group.links, { label: '', href: '/' }] })
                    }
                  >
                    Add link
                  </Button>
                </div>
              ) : null}
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
