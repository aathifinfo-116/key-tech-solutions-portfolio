'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NavigationItemDto, NavigationMenuDto } from '@kts/shared-types';
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

interface DraftItem {
  label: string;
  href: string;
  description: string;
  children: Array<{ label: string; href: string; description: string }>;
}

/**
 * Primary navigation.
 *
 * Saving replaces the whole menu in one transaction, so ordering can never end
 * up half-applied. Each top-level entry is a real link in its own right, so a
 * dropdown is a shortcut rather than the only way to reach a section.
 */
export default function NavigationPage() {
  const { can } = useSession();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<DraftItem[]>([]);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const menu = useQuery<NavigationMenuDto | null>({
    queryKey: ['navigation', 'PRIMARY'],
    queryFn: () => adminApi.navigation('PRIMARY'),
    enabled: can('navigation:read'),
  });

  useEffect(() => {
    if (!menu.data) return;
    setItems(menu.data.items.map(toDraft));
  }, [menu.data]);

  const save = useMutation({
    mutationFn: () =>
      adminApi.saveNavigation({
        key: 'primary',
        name: 'Primary navigation',
        location: 'PRIMARY',
        isActive: true,
        items: items.map((item, index) => ({
          label: item.label,
          href: item.href,
          description: item.description || undefined,
          sortOrder: index,
          isActive: true,
          children: item.children.map((child, childIndex) => ({
            label: child.label,
            href: child.href,
            description: child.description || undefined,
            sortOrder: childIndex,
            isActive: true,
          })),
        })),
      }),
    onSuccess: () => {
      setMessage({
        tone: 'success',
        text: 'Navigation saved. The website picks it up on its next revalidation.',
      });
      void queryClient.invalidateQueries({ queryKey: ['navigation'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  if (!can('navigation:read')) {
    return (
      <>
        <PageHeader title="Navigation" />
        <Notice tone="warning" title="No access">
          Your role does not include navigation:read.
        </Notice>
      </>
    );
  }

  const editable = can('navigation:update');

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved as DraftItem);
    setItems(next);
  };

  return (
    <>
      <PageHeader
        title="Primary navigation"
        description="The header menu. Order here is the order visitors see."
        actions={
          <Button
            variant="primary"
            disabled={!editable || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? 'Saving...' : 'Save navigation'}
          </Button>
        }
      />

      {message ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      {menu.isPending ? <Notice tone="info">Loading navigation...</Notice> : null}

      <div style={{ display: 'grid', gap: 14 }}>
        {items.map((item, index) => (
          <Panel
            key={`${item.href}-${index}`}
            title={item.label || 'Untitled item'}
            actions={
              editable ? (
                <>
                  <Button
                    small
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${item.label} up`}
                  >
                    Up
                  </Button>
                  <Button
                    small
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    aria-label={`Move ${item.label} down`}
                  >
                    Down
                  </Button>
                  <Button
                    small
                    variant="danger"
                    onClick={() => setItems(items.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </>
              ) : null
            }
          >
            <div className={styles.form}>
              <FieldRow two>
                <Field label="Label">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={item.label}
                      disabled={!editable}
                      onChange={(event) => update(index, { label: event.target.value })}
                    />
                  )}
                </Field>
                <Field label="Link">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={item.href}
                      disabled={!editable}
                      onChange={(event) => update(index, { href: event.target.value })}
                    />
                  )}
                </Field>
              </FieldRow>

              <div className={styles.stackTight}>
                <p className={styles.label}>Dropdown entries</p>
                {item.children.map((child, childIndex) => (
                  <FieldRow key={childIndex} two>
                    <Field label={`Child ${childIndex + 1} label`}>
                      {({ id }) => (
                        <Input
                          id={id}
                          value={child.label}
                          disabled={!editable}
                          onChange={(event) =>
                            updateChild(index, childIndex, { label: event.target.value })
                          }
                        />
                      )}
                    </Field>
                    <Field label={`Child ${childIndex + 1} link`}>
                      {({ id }) => (
                        <div className={styles.inline}>
                          <Input
                            id={id}
                            value={child.href}
                            disabled={!editable}
                            onChange={(event) =>
                              updateChild(index, childIndex, { href: event.target.value })
                            }
                          />
                          {editable ? (
                            <Button
                              small
                              variant="danger"
                              onClick={() =>
                                update(index, {
                                  children: item.children.filter((_, i) => i !== childIndex),
                                })
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
                        update(index, {
                          children: [...item.children, { label: '', href: '/', description: '' }],
                        })
                      }
                    >
                      Add dropdown entry
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </Panel>
        ))}

        {editable ? (
          <div>
            <Button
              onClick={() =>
                setItems([
                  ...items,
                  { label: 'New item', href: '/', description: '', children: [] },
                ])
              }
            >
              Add menu item
            </Button>
          </div>
        ) : null}
      </div>
    </>
  );

  function update(index: number, patch: Partial<DraftItem>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function updateChild(
    index: number,
    childIndex: number,
    patch: Partial<DraftItem['children'][number]>,
  ) {
    setItems((current) =>
      current.map((item, i) =>
        i === index
          ? {
              ...item,
              children: item.children.map((child, ci) =>
                ci === childIndex ? { ...child, ...patch } : child,
              ),
            }
          : item,
      ),
    );
  }
}

function toDraft(item: NavigationItemDto): DraftItem {
  return {
    label: item.label,
    href: item.href,
    description: item.description ?? '',
    children: item.children.map((child) => ({
      label: child.label,
      href: child.href,
      description: child.description ?? '',
    })),
  };
}
