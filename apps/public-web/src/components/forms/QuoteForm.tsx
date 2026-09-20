'use client';

/**
 * Quote request form.
 *
 * Structured enough that the first reply can be concrete, short enough that
 * it is realistic to complete. Nothing here is binding, and the form says so.
 */

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@kts/api-client';
import { BUDGET_RANGES, PROJECT_TYPES } from '@kts/config';
import { quoteRequestSchema, type QuoteRequestInput } from '@kts/validation';
import { Button } from '@kts/ui';
import { browserApi } from '@/lib/browser-api';
import {
  ErrorSummary,
  Field,
  Honeypot,
  Row,
  Select,
  SuccessPanel,
  TextArea,
  TextInput,
  formStyles as styles,
} from './form-parts';

const FEATURE_OPTIONS = [
  'User accounts and roles',
  'Online booking or scheduling',
  'Payments',
  'Product or parts catalogue',
  'Inventory and stock',
  'Customer portal',
  'Administration dashboard',
  'Reporting and exports',
  'Third-party integrations',
  'Mobile-first interface',
  'Content management',
  'Migration from an existing system',
];

export function QuoteForm({ consentText }: { consentText?: string }) {
  const [receipt, setReceipt] = useState<{ reference: string; message: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mountedAt = useRef<number>(Date.now());

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<QuoteRequestInput>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: { consent: false, requiredFeatures: [] },
  });

  if (receipt) {
    return (
      <SuccessPanel
        title="Quote request received"
        message={receipt.message}
        reference={receipt.reference}
      />
    );
  }

  const summary = Object.entries(errors).map(([field, error]) => ({
    field,
    message: (error?.message as string) ?? 'This field is invalid',
  }));

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setSubmitError(null);
        try {
          const result = await browserApi.submitQuote({
            ...values,
            elapsedMs: Date.now() - mountedAt.current,
            sourcePage: window.location.pathname,
          });
          setReceipt({ reference: result.reference, message: result.message });
        } catch (error) {
          if (error instanceof ApiError && error.status === 422) {
            for (const [path, message] of Object.entries(error.fieldErrors)) {
              setError(path as keyof QuoteRequestInput, { message });
            }
            return;
          }
          setSubmitError(
            error instanceof ApiError && error.status === 429
              ? error.message
              : 'Your request could not be sent just now. Please try again in a moment.',
          );
        }
      })}
    >
      <ErrorSummary errors={summary} />
      {submitError ? (
        <div className={styles.summary} role="alert">
          <p className={styles.summaryTitle}>Submission failed</p>
          <p>{submitError}</p>
        </div>
      ) : null}

      <Row two>
        <Field label="Organisation" error={errors.organization?.message}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              autoComplete="organization"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('organization')}
            />
          )}
        </Field>
        <Field label="Your name" error={errors.name?.message}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              autoComplete="name"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('name')}
            />
          )}
        </Field>
      </Row>

      <Row two>
        <Field label="Email address" error={errors.email?.message}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              type="email"
              inputMode="email"
              autoComplete="email"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('email')}
            />
          )}
        </Field>
        <Field label="Mobile" optional error={errors.mobile?.message}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('mobile')}
            />
          )}
        </Field>
      </Row>

      <Field label="Project type" error={errors.projectType?.message}>
        {({ id, describedBy, invalid }) => (
          <Select
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            {...register('projectType')}
          >
            <option value="">Choose the closest match</option>
            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        label="Business challenge"
        hint="What is not working today, and what would good look like? This is the most useful box on the form."
        error={errors.businessChallenge?.message}
      >
        {({ id, describedBy, invalid }) => (
          <TextArea
            id={id}
            rows={7}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            {...register('businessChallenge')}
          />
        )}
      </Field>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className={styles.label} style={{ marginBottom: 'var(--kt-space-3)' }}>
          Features you expect to need <span className={styles.optional}>(optional)</span>
        </legend>
        <div className={styles.featureList}>
          {FEATURE_OPTIONS.map((feature) => (
            <div key={feature} className={styles.checkboxRow}>
              <input
                id={`feature-${feature}`}
                type="checkbox"
                className={styles.checkbox}
                value={feature}
                {...register('requiredFeatures')}
              />
              <label className={styles.checkboxLabel} htmlFor={`feature-${feature}`}>
                {feature}
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      <Field
        label="Existing system"
        optional
        hint="What are you using now - a spreadsheet, an off-the-shelf product, something custom?"
        error={errors.existingSystem?.message}
      >
        {({ id, describedBy, invalid }) => (
          <TextArea
            id={id}
            rows={3}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            {...register('existingSystem')}
          />
        )}
      </Field>

      <Row two>
        <Field label="Budget range" optional error={errors.budgetRange?.message}>
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('budgetRange')}
            >
              <option value="">Prefer not to say</option>
              {BUDGET_RANGES.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Preferred start" optional error={errors.preferredStart?.message}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              placeholder="e.g. within a month, next quarter"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('preferredStart')}
            />
          )}
        </Field>
      </Row>

      <div className={styles.checkboxRow}>
        <input
          id="quote-consent"
          type="checkbox"
          className={styles.checkbox}
          aria-invalid={Boolean(errors.consent)}
          {...register('consent')}
        />
        <label className={styles.checkboxLabel} htmlFor="quote-consent">
          {consentText ?? 'I agree to Key Tech Solutions contacting me about this quote request.'}{' '}
          <a href="/privacy">How we handle your information</a>.
          {errors.consent ? <span className={styles.error}> {errors.consent.message}</span> : null}
        </label>
      </div>

      <Honeypot register={register('website')} />

      <div className={styles.actions}>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send quote request'}
        </Button>
        <span className={styles.hint}>
          Nothing here is binding. It gives us enough to reply usefully.
        </span>
      </div>
    </form>
  );
}
