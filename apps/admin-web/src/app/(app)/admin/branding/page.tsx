'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BrandDto } from '@kts/shared-types';
import {
  Button,
  Field,
  FieldRow,
  Grid,
  Input,
  Notice,
  PageHeader,
  Panel,
  Textarea,
  adminStyles as styles,
} from '@kts/admin-ui';
import { adminApi, describeError, useSession } from '@/lib/session';

/**
 * Brand settings.
 *
 * These values drive both applications: the colours become CSS custom
 * properties, and the company name and tagline appear in the header, footer,
 * page titles and Organization structured data.
 */
export default function BrandingPage() {
  const { can } = useSession();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const brand = useQuery<BrandDto>({
    queryKey: ['branding'],
    queryFn: () => adminApi.brand() as Promise<BrandDto>,
    enabled: can('branding:read'),
  });

  useEffect(() => {
    if (!brand.data) return;
    setValues({
      companyName: brand.data.companyName,
      shortName: brand.data.shortName,
      legalName: brand.data.legalName ?? '',
      tagline: brand.data.tagline ?? '',
      description: brand.data.description ?? '',
      primaryColor: brand.data.colors.primary,
      secondaryColor: brand.data.colors.secondary,
      accentColor: brand.data.colors.accent,
      highlightColor: brand.data.colors.highlight,
      inkColor: brand.data.colors.ink,
      gradientCss: brand.data.gradientCss,
      contactEmail: brand.data.contactEmail ?? '',
      contactPhone: brand.data.contactPhone ?? '',
      supportEmail: brand.data.supportEmail ?? '',
    });
  }, [brand.data]);

  const save = useMutation({
    mutationFn: () =>
      adminApi.updateBrand({
        ...values,
        legalName: values.legalName || undefined,
        tagline: values.tagline || undefined,
        description: values.description || undefined,
        contactEmail: values.contactEmail || undefined,
        contactPhone: values.contactPhone || undefined,
        supportEmail: values.supportEmail || undefined,
      }),
    onSuccess: () => {
      setMessage({
        tone: 'success',
        text: 'Brand settings saved. The website will pick them up on its next revalidation.',
      });
      void queryClient.invalidateQueries({ queryKey: ['branding'] });
    },
    onError: (error) => setMessage({ tone: 'error', text: describeError(error) }),
  });

  if (!can('branding:read')) {
    return (
      <>
        <PageHeader title="Branding" />
        <Notice tone="warning" title="No access">
          Your role does not include branding:read.
        </Notice>
      </>
    );
  }

  const set = (key: string) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));

  const colourFields: Array<[string, string]> = [
    ['primaryColor', 'Primary'],
    ['secondaryColor', 'Secondary'],
    ['accentColor', 'Accent'],
    ['highlightColor', 'Highlight'],
    ['inkColor', 'Ink (text)'],
  ];

  return (
    <>
      <PageHeader
        title="Branding"
        description="Company identity and colour tokens, shared by the website and this panel."
        actions={
          <Button
            variant="primary"
            disabled={!can('branding:update') || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? 'Saving...' : 'Save branding'}
          </Button>
        }
      />

      {message ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      {brand.isPending ? <Notice tone="info">Loading brand settings...</Notice> : null}

      {brand.data ? (
        <div style={{ display: 'grid', gap: 18 }}>
          <Panel title="Identity">
            <div className={styles.form}>
              <FieldRow two>
                <Field label="Company name">
                  {({ id }) => (
                    <Input id={id} value={values.companyName ?? ''} onChange={set('companyName')} />
                  )}
                </Field>
                <Field label="Short name" hint="Used in the header wordmark.">
                  {({ id }) => (
                    <Input id={id} value={values.shortName ?? ''} onChange={set('shortName')} />
                  )}
                </Field>
              </FieldRow>
              <Field
                label="Legal name"
                optional
                hint="Appears in the footer copyright line when set."
              >
                {({ id }) => (
                  <Input id={id} value={values.legalName ?? ''} onChange={set('legalName')} />
                )}
              </Field>
              <Field label="Tagline" optional>
                {({ id }) => (
                  <Input id={id} value={values.tagline ?? ''} onChange={set('tagline')} />
                )}
              </Field>
              <Field label="Description" optional hint="Used in Organization structured data.">
                {({ id }) => (
                  <Textarea
                    id={id}
                    rows={3}
                    value={values.description ?? ''}
                    onChange={set('description')}
                  />
                )}
              </Field>
            </div>
          </Panel>

          <Panel title="Colours">
            <Grid columns={3}>
              {colourFields.map(([key, label]) => (
                <Field key={key} label={label} hint="Hex, e.g. #6436A3">
                  {({ id }) => (
                    <div className={styles.inline}>
                      <span
                        aria-hidden="true"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          border: '1px solid var(--kt-border-default)',
                          background: values[key] ?? '#fff',
                          flex: 'none',
                        }}
                      />
                      <Input id={id} value={values[key] ?? ''} onChange={set(key)} />
                    </div>
                  )}
                </Field>
              ))}
            </Grid>
            <div style={{ marginTop: 14 }}>
              <Field
                label="Brand gradient"
                hint="A CSS gradient value. Used for the primary call to action and accents."
              >
                {({ id }) => (
                  <Input id={id} value={values.gradientCss ?? ''} onChange={set('gradientCss')} />
                )}
              </Field>
              <div
                aria-hidden="true"
                style={{
                  marginTop: 10,
                  height: 44,
                  borderRadius: 10,
                  background: values.gradientCss,
                }}
              />
            </div>
          </Panel>

          <Panel title="Contact details">
            <div className={styles.form}>
              <FieldRow two>
                <Field label="Contact email" optional>
                  {({ id }) => (
                    <Input
                      id={id}
                      type="email"
                      value={values.contactEmail ?? ''}
                      onChange={set('contactEmail')}
                    />
                  )}
                </Field>
                <Field label="Contact phone" optional>
                  {({ id }) => (
                    <Input
                      id={id}
                      value={values.contactPhone ?? ''}
                      onChange={set('contactPhone')}
                    />
                  )}
                </Field>
              </FieldRow>
              <Field label="Support email" optional>
                {({ id }) => (
                  <Input
                    id={id}
                    type="email"
                    value={values.supportEmail ?? ''}
                    onChange={set('supportEmail')}
                  />
                )}
              </Field>
              <Notice tone="info">
                Only fill these in with addresses you actually monitor. They are published on the
                website and emitted in structured data.
              </Notice>
            </div>
          </Panel>
        </div>
      ) : null}
    </>
  );
}
