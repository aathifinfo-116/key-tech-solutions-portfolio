'use client';

import { useEffect, useMemo, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SEO_LIMITS } from '@kts/config';
import { slugify } from '@kts/validation';
import {
  Badge,
  Button,
  CheckboxRow,
  Field,
  FieldRow,
  Input,
  LengthCounter,
  LinkButton,
  Mono,
  Notice,
  PageHeader,
  Panel,
  Select,
  StatusBadge,
  Table,
  TableWrap,
  Textarea,
  adminStyles as styles,
} from '@kts/admin-ui';
import { findResource, type FieldDef, type ResourceDef } from '@/lib/resources';
import { adminApi, describeError, useSession } from '@/lib/session';

const PUBLIC_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3010').replace(
  /\/+$/,
  '',
);

/**
 * Generic content editor.
 *
 * The form is built from the resource registry; the API validates the same
 * payload with Zod, so anything the form allows the server still checks. Three
 * things this screen deliberately does:
 *  - warns before leaving with unsaved changes,
 *  - shows live SEO length feedback rather than silently truncating,
 *  - keeps publishing as an explicit, separate action from saving.
 */
export default function ResourceEditPage() {
  const params = useParams<{ resource: string; id: string }>();
  const resource = findResource(params.resource);
  if (!resource) notFound();

  const isNew = params.id === 'new';
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = useSession();

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const canUpdate = can(`${resource.permissionFamily}:${isNew ? 'create' : 'update'}`);
  const canPublish = can(`${resource.permissionFamily}:publish`);
  const canDelete = can(`${resource.permissionFamily}:delete`);

  const record = useQuery<Record<string, unknown>>({
    queryKey: [resource.key, params.id],
    queryFn: () => adminApi.get(resource.api, params.id),
    enabled: !isNew,
  });

  const revisions = useQuery({
    queryKey: [resource.key, params.id, 'revisions'],
    queryFn: () => adminApi.revisions(resource.api, params.id),
    enabled: !isNew && can(`${resource.permissionFamily}:read`),
  });

  // Seed the form once the record arrives, or with sensible defaults for a new one.
  useEffect(() => {
    if (isNew) {
      setValues(defaultsFor(resource));
      return;
    }
    if (record.data) setValues(flatten(record.data, resource));
  }, [isNew, record.data, resource]);

  // Browser-level guard against losing work.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const groups = useMemo(() => groupFields(resource.fields), [resource]);

  const setValue = (name: string, value: unknown) => {
    setValues((current) => {
      const next = { ...current, [name]: value };
      // Derive the slug from the title until the editor types one themselves.
      if (name === resource.titleField && isNew && !slugTouched && typeof value === 'string') {
        next.slug = slugify(value);
      }
      return next;
    });
    setDirty(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = expand(values, resource);
      return isNew
        ? adminApi.create<Record<string, unknown>>(resource.api, payload)
        : adminApi.update<Record<string, unknown>>(resource.api, params.id, payload);
    },
    onSuccess: (saved) => {
      setDirty(false);
      setMessage({ tone: 'success', text: 'Saved.' });
      void queryClient.invalidateQueries({ queryKey: [resource.key] });
      if (isNew && saved?.id) router.replace(`/content/${resource.key}/${String(saved.id)}`);
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  const changeStatus = useMutation({
    mutationFn: (status: string) =>
      adminApi.changeStatus(resource.api, params.id, {
        status,
        scheduledAt: (values.scheduledAt as string) || null,
      }),
    onSuccess: () => {
      setMessage({ tone: 'success', text: 'Status updated.' });
      void queryClient.invalidateQueries({ queryKey: [resource.key] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  const archive = useMutation({
    mutationFn: () => adminApi.remove(resource.api, params.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [resource.key] });
      router.push(`/content/${resource.key}`);
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  const duplicate = useMutation({
    mutationFn: () => adminApi.duplicate<Record<string, unknown>>(resource.api, params.id),
    onSuccess: (copy) => {
      void queryClient.invalidateQueries({ queryKey: [resource.key] });
      if (copy?.id) router.push(`/content/${resource.key}/${String(copy.id)}`);
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  if (!canUpdate && isNew) {
    return (
      <>
        <PageHeader title={`New ${resource.singular.toLowerCase()}`} />
        <Notice tone="warning" title="No access">
          Your role cannot create {resource.plural.toLowerCase()}.
        </Notice>
      </>
    );
  }

  /*
    Read from the saved record, not from the form: publication status is
    changed by the workflow panel below, not by saving the form, so the form
    state is not the authority on it.
  */
  const currentStatus = String(
    (record.data?.status as string | undefined) ??
      values.careerStatus ??
      (isNew ? 'DRAFT' : 'DRAFT'),
  );
  const slug = String(values.slug ?? '');
  const title = String(
    values[resource.titleField] ?? (isNew ? `New ${resource.singular.toLowerCase()}` : ''),
  );

  return (
    <>
      <PageHeader
        title={title || resource.singular}
        description={resource.description}
        actions={
          <>
            <LinkButton href={`/content/${resource.key}`} variant="ghost">
              Back to list
            </LinkButton>
            {!isNew && resource.previewType ? (
              <LinkButton
                href={`${PUBLIC_SITE_URL}/preview/${resource.previewType}/${slug || params.id}`}
                variant="secondary"
              >
                Preview draft
              </LinkButton>
            ) : null}
            {!isNew && resource.publicPath && currentStatus === 'PUBLISHED' ? (
              <LinkButton
                href={`${PUBLIC_SITE_URL}${resource.publicPath}/${slug}`}
                variant="secondary"
              >
                View live
              </LinkButton>
            ) : null}
            <Button
              variant="primary"
              onClick={() => save.mutate()}
              disabled={save.isPending || !canUpdate}
            >
              {save.isPending ? 'Saving...' : dirty ? 'Save changes' : 'Save'}
            </Button>
          </>
        }
      />

      {message ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      {dirty ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone="warning">You have unsaved changes.</Notice>
        </div>
      ) : null}

      {record.isError ? (
        <Notice tone="error" title="Could not load this record">
          {describeError(record.error)}
        </Notice>
      ) : null}

      <div style={{ display: 'grid', gap: 18 }}>
        {groups.map(([groupName, fields]) => (
          <Panel key={groupName} title={groupName}>
            <div className={styles.form}>
              {fields.map((field) => (
                <FormField
                  key={field.name}
                  field={field}
                  value={values[field.name]}
                  onChange={(value) => {
                    if (field.name === 'slug') setSlugTouched(true);
                    setValue(field.name, value);
                  }}
                />
              ))}
            </div>
          </Panel>
        ))}

        {/* "Publication workflow", not "Publishing": the field group above is
            named Publishing and holds values you save with the record, while
            this panel performs the transition immediately. */}
        {!isNew && resource.publishable ? (
          <Panel title="Publication workflow">
            <div className={styles.stack}>
              <div className={styles.inline}>
                <span>Current status:</span>
                <StatusBadge status={currentStatus} />
              </div>
              <div className={styles.inline}>
                <Button
                  variant="primary"
                  onClick={() => changeStatus.mutate('PUBLISHED')}
                  disabled={!canPublish || changeStatus.isPending}
                >
                  Publish now
                </Button>
                <Button
                  onClick={() => changeStatus.mutate('SCHEDULED')}
                  disabled={!canPublish || changeStatus.isPending}
                >
                  Schedule
                </Button>
                <Button
                  onClick={() => changeStatus.mutate('REVIEW')}
                  disabled={changeStatus.isPending}
                >
                  Submit for review
                </Button>
                <Button
                  onClick={() => changeStatus.mutate('DRAFT')}
                  disabled={changeStatus.isPending}
                >
                  Unpublish
                </Button>
              </div>
              {!canPublish ? (
                <Notice tone="info">
                  Your role can edit but not publish. Submit for review and a publisher will take it
                  from there.
                </Notice>
              ) : null}
            </div>
          </Panel>
        ) : null}

        {!isNew ? (
          <Panel title="Record actions">
            <div className={styles.inline}>
              <Button
                onClick={() => duplicate.mutate()}
                disabled={duplicate.isPending || !can(`${resource.permissionFamily}:create`)}
              >
                Duplicate
              </Button>
              <Button
                variant="danger"
                disabled={!canDelete || archive.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      `Archive this ${resource.singular.toLowerCase()}? It will be removed from the website but kept in the database.`,
                    )
                  ) {
                    archive.mutate();
                  }
                }}
              >
                Archive
              </Button>
            </div>
          </Panel>
        ) : null}

        {!isNew && revisions.data && revisions.data.length > 0 ? (
          <Panel title="Revision history" padded={false}>
            <TableWrap>
              <Table caption="Revision history">
                <thead>
                  <tr>
                    <th scope="col">Version</th>
                    <th scope="col">Action</th>
                    <th scope="col">Status after</th>
                    <th scope="col">Editor</th>
                    <th scope="col">When</th>
                    <th scope="col">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {revisions.data.map((revision) => (
                    <tr key={revision.id}>
                      <td>
                        <Mono>v{revision.version}</Mono>
                      </td>
                      <td>
                        <Badge>{revision.action.toLowerCase().replace(/_/g, ' ')}</Badge>
                      </td>
                      <td>
                        <StatusBadge status={revision.statusAfter} />
                      </td>
                      <td>{revision.editor?.name ?? '-'}</td>
                      <td>{new Date(revision.createdAt).toLocaleString('en-GB')}</td>
                      <td className={styles.cellMuted}>{revision.changeSummary ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Panel>
        ) : null}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------

function FormField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const isSeoTitle = field.name === 'seo.title';
  const isSeoDescription = field.name === 'seo.description';

  if (field.kind === 'boolean') {
    return (
      <CheckboxRow
        id={`field-${field.name}`}
        label={field.label}
        hint={field.hint}
        checked={Boolean(value)}
        onChange={(event) => onChange(event.target.checked)}
      />
    );
  }

  return (
    <Field
      label={field.label}
      hint={field.hint}
      optional={field.optional}
      counter={
        isSeoTitle ? (
          <LengthCounter
            value={String(value ?? '')}
            min={SEO_LIMITS.titleMin}
            ideal={SEO_LIMITS.titleIdealMax}
            hard={SEO_LIMITS.titleHardMax}
          />
        ) : isSeoDescription ? (
          <LengthCounter
            value={String(value ?? '')}
            min={SEO_LIMITS.descriptionMin}
            ideal={SEO_LIMITS.descriptionIdealMax}
            hard={SEO_LIMITS.descriptionHardMax}
          />
        ) : null
      }
    >
      {({ id, describedBy }) => {
        switch (field.kind) {
          case 'textarea':
          case 'richtext':
            return (
              <Textarea
                id={id}
                rows={field.rows ?? (field.kind === 'richtext' ? 10 : 3)}
                aria-describedby={describedBy}
                value={String(value ?? '')}
                onChange={(event) => onChange(event.target.value)}
                placeholder={field.kind === 'richtext' ? 'HTML is sanitised on save.' : undefined}
              />
            );
          case 'select':
            return (
              <Select
                id={id}
                aria-describedby={describedBy}
                value={String(value ?? '')}
                onChange={(event) => onChange(event.target.value)}
              >
                <option value="">Choose...</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            );
          case 'stringList':
            return (
              <Textarea
                id={id}
                rows={field.rows ?? 4}
                aria-describedby={describedBy}
                value={Array.isArray(value) ? (value as string[]).join('\n') : ''}
                onChange={(event) =>
                  onChange(
                    event.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="One item per line"
              />
            );
          case 'number':
            return (
              <Input
                id={id}
                type="number"
                step="any"
                aria-describedby={describedBy}
                value={value === null || value === undefined ? '' : String(value)}
                onChange={(event) =>
                  onChange(event.target.value === '' ? null : Number(event.target.value))
                }
              />
            );
          case 'date':
            return (
              <Input
                id={id}
                type="datetime-local"
                aria-describedby={describedBy}
                value={toLocalDateTime(value)}
                onChange={(event) =>
                  onChange(event.target.value ? new Date(event.target.value).toISOString() : null)
                }
              />
            );
          case 'color':
            return (
              <Input
                id={id}
                type="text"
                placeholder="#6436A3"
                aria-describedby={describedBy}
                value={String(value ?? '')}
                onChange={(event) => onChange(event.target.value || undefined)}
              />
            );
          case 'url':
            return (
              <Input
                id={id}
                type="url"
                inputMode="url"
                placeholder="https://"
                aria-describedby={describedBy}
                value={String(value ?? '')}
                onChange={(event) => onChange(event.target.value || undefined)}
              />
            );
          default:
            return (
              <Input
                id={id}
                type="text"
                aria-describedby={describedBy}
                value={String(value ?? '')}
                onChange={(event) => onChange(event.target.value)}
              />
            );
        }
      }}
    </Field>
  );
}

function groupFields(fields: FieldDef[]): Array<[string, FieldDef[]]> {
  const map = new Map<string, FieldDef[]>();
  for (const field of fields) {
    const group = field.group ?? 'Content';
    if (!map.has(group)) map.set(group, []);
    map.get(group)?.push(field);
  }
  return Array.from(map.entries());
}

function defaultsFor(resource: ResourceDef): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of resource.fields) {
    switch (field.kind) {
      case 'boolean':
        values[field.name] =
          field.name.startsWith('seo.robots') || field.name === 'seo.includeInSitemap'
            ? true
            : field.name === 'createRedirectOnSlugChange' ||
              field.name === 'isActive' ||
              field.name === 'showInSitemap';
        break;
      case 'stringList':
        values[field.name] = [];
        break;
      case 'number':
        values[field.name] = field.name === 'seo.sitemapPriority' ? 0.5 : 0;
        break;
      case 'select':
        values[field.name] = field.options?.[0]?.value ?? '';
        break;
      default:
        values[field.name] = '';
    }
  }
  if (resource.publishable) values.status = 'DRAFT';
  return values;
}

/** Turns a nested API record into the flat shape the form works with. */
function flatten(record: Record<string, unknown>, resource: ResourceDef): Record<string, unknown> {
  const values: Record<string, unknown> = { ...defaultsFor(resource) };
  for (const field of resource.fields) {
    if (field.name.startsWith('seo.')) {
      const key = field.name.slice(4);
      const seo = record.seo as Record<string, unknown> | null;
      if (seo && seo[key] !== undefined && seo[key] !== null) values[field.name] = seo[key];
      continue;
    }
    if (record[field.name] !== undefined && record[field.name] !== null) {
      values[field.name] = record[field.name];
    }
  }
  return values;
}

/** Rebuilds the nested payload the API expects. */
function expand(values: Record<string, unknown>, resource: ResourceDef): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const seo: Record<string, unknown> = {};

  for (const field of resource.fields) {
    const raw = values[field.name];
    // Blank optional strings are omitted rather than sent as ''.
    const value = raw === '' && field.optional ? undefined : raw;
    if (value === undefined) continue;

    if (field.name.startsWith('seo.')) {
      seo[field.name.slice(4)] = value;
    } else {
      payload[field.name] = value;
    }
  }

  if (resource.hasSeo && Object.keys(seo).length > 0) payload.seo = seo;
  return payload;
}

function toLocalDateTime(value: unknown): string {
  if (!value) return '';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
