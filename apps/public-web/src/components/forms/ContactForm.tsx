'use client';

/**
 * Contact form.
 *
 * Validated with the same Zod schema the API uses, so a bypassed browser
 * check is rejected server side with the identical rules. On success the form
 * is replaced by a confirmation carrying the reference the API issued.
 */

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@kts/api-client';
import { contactFormSchema, type ContactFormInput } from '@kts/validation';
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

export interface ContactFormProps {
  /** Pre-selects a service in the interest list, e.g. from a service page. */
  defaultServiceInterest?: string;
  serviceOptions?: string[];
  consentText?: string;
}

export function ContactForm({
  defaultServiceInterest,
  serviceOptions = [],
  consentText,
}: ContactFormProps) {
  const [receipt, setReceipt] = useState<{ reference: string; message: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const mountedAt = useRef<number>(Date.now());

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      consent: false,
      serviceInterest: defaultServiceInterest,
      sourcePage: typeof window === 'undefined' ? undefined : window.location.pathname,
    },
  });

  // Move focus to the summary so the failure is announced, not just shown.
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      summaryRef.current?.querySelector<HTMLElement>('[data-error-summary]')?.focus();
    }
  }, [errors]);

  if (receipt) {
    return (
      <SuccessPanel
        title="Message received"
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
          const result = await browserApi.submitContact({
            ...values,
            elapsedMs: Date.now() - mountedAt.current,
            sourcePage: window.location.pathname,
          });
          setReceipt({ reference: result.reference, message: result.message });
        } catch (error) {
          if (error instanceof ApiError && error.status === 422) {
            for (const [path, message] of Object.entries(error.fieldErrors)) {
              setError(path as keyof ContactFormInput, { message });
            }
            return;
          }
          if (error instanceof ApiError && error.status === 429) {
            setSubmitError(error.message);
            return;
          }
          setSubmitError('Your message could not be sent just now. Please try again in a moment.');
        }
      })}
    >
      <div ref={summaryRef}>
        <ErrorSummary errors={summary} />
      </div>
      {submitError ? (
        <div className={styles.summary} role="alert">
          <p className={styles.summaryTitle}>Submission failed</p>
          <p>{submitError}</p>
        </div>
      ) : null}

      <Row two>
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

        <Field label="Organisation" optional error={errors.organization?.message}>
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

      {serviceOptions.length > 0 ? (
        <Field
          label="Service you are interested in"
          optional
          error={errors.serviceInterest?.message}
        >
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('serviceInterest')}
            >
              <option value="">Not sure yet</option>
              {serviceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          )}
        </Field>
      ) : null}

      <Field label="Subject" error={errors.subject?.message}>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            {...register('subject')}
          />
        )}
      </Field>

      <Field
        label="Message"
        hint="What is the business trying to do differently? Concrete detail gets a more useful reply."
        error={errors.message?.message}
      >
        {({ id, describedBy, invalid }) => (
          <TextArea
            id={id}
            rows={7}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            {...register('message')}
          />
        )}
      </Field>

      <div className={styles.checkboxRow}>
        <input
          id="contact-consent"
          type="checkbox"
          className={styles.checkbox}
          aria-invalid={Boolean(errors.consent)}
          {...register('consent')}
        />
        <label className={styles.checkboxLabel} htmlFor="contact-consent">
          {consentText ?? 'I agree to Key Tech Solutions contacting me about this enquiry.'}{' '}
          <a href="/privacy">How we handle your information</a>.
          {errors.consent ? <span className={styles.error}> {errors.consent.message}</span> : null}
        </label>
      </div>

      <Honeypot register={register('website')} />

      <div className={styles.actions}>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send message'}
        </Button>
        <span className={styles.hint} aria-live="polite">
          {isSubmitting ? 'Submitting your message.' : ''}
        </span>
      </div>
    </form>
  );
}
