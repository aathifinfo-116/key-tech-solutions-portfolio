'use client';

/**
 * Job application form.
 *
 * The CV is uploaded first to a private endpoint, which returns an opaque
 * document id; only that id travels with the application. The file itself is
 * never public, never indexed and never served from a guessable URL.
 */

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@kts/api-client';
import { UPLOAD } from '@kts/config';
import { jobApplicationSchema, type JobApplicationInput } from '@kts/validation';
import { Button } from '@kts/ui';
import { browserApi } from '@/lib/browser-api';
import {
  ErrorSummary,
  Field,
  Honeypot,
  Row,
  SuccessPanel,
  TextArea,
  TextInput,
  formStyles as styles,
} from './form-parts';

export function ApplicationForm({
  careerSlug,
  roleTitle,
}: {
  careerSlug: string;
  roleTitle: string;
}) {
  const [receipt, setReceipt] = useState<{ reference: string; message: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [cvName, setCvName] = useState<string | null>(null);
  const cvDocumentId = useRef<string | undefined>(undefined);
  const mountedAt = useRef<number>(Date.now());

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<JobApplicationInput>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: { careerSlug, consent: false },
  });

  if (receipt) {
    return (
      <SuccessPanel
        title="Application received"
        message={receipt.message}
        reference={receipt.reference}
      />
    );
  }

  const summary = Object.entries(errors).map(([field, error]) => ({
    field,
    message: (error?.message as string) ?? 'This field is invalid',
  }));

  async function uploadCv(file: File) {
    setUploadState('uploading');
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append('kind', 'cv');
      formData.append('file', file);
      const result = await browserApi.uploadPublicFormFile(formData);
      cvDocumentId.current = result.id;
      setCvName(result.originalName);
      setUploadState('done');
    } catch (error) {
      cvDocumentId.current = undefined;
      setUploadState('error');
      setSubmitError(
        error instanceof ApiError && error.body?.details?.length
          ? error.body.details.map((d) => d.message).join(' ')
          : 'That file could not be accepted. PDF or DOCX only.',
      );
    }
  }

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setSubmitError(null);
        try {
          const result = await browserApi.submitApplication({
            ...values,
            careerSlug,
            cvDocumentId: cvDocumentId.current,
            elapsedMs: Date.now() - mountedAt.current,
          });
          setReceipt({ reference: result.reference, message: result.message });
        } catch (error) {
          if (error instanceof ApiError && error.status === 422) {
            for (const [path, message] of Object.entries(error.fieldErrors)) {
              setError(path as keyof JobApplicationInput, { message });
            }
            return;
          }
          setSubmitError(
            error instanceof ApiError
              ? error.message
              : 'Your application could not be sent just now. Please try again in a moment.',
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

      <input type="hidden" value={careerSlug} {...register('careerSlug')} />

      <Row two>
        <Field label="Your name" error={errors.applicantName?.message}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              autoComplete="name"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('applicantName')}
            />
          )}
        </Field>
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
      </Row>

      <Row two>
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
        <Field label="Portfolio or website" optional error={errors.portfolioUrl?.message}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              type="url"
              inputMode="url"
              placeholder="https://"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('portfolioUrl')}
            />
          )}
        </Field>
      </Row>

      <Field label="LinkedIn profile" optional error={errors.linkedinUrl?.message}>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            type="url"
            inputMode="url"
            placeholder="https://www.linkedin.com/in/"
            aria-describedby={describedBy}
            aria-invalid={invalid}
            {...register('linkedinUrl')}
          />
        )}
      </Field>

      <Field
        label="Cover note"
        optional
        hint={`Why this role, and what you would bring to ${roleTitle}.`}
        error={errors.coverNote?.message}
      >
        {({ id, describedBy, invalid }) => (
          <TextArea
            id={id}
            rows={6}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            {...register('coverNote')}
          />
        )}
      </Field>

      <Field
        label="CV"
        optional
        hint={`PDF or DOCX, up to ${Math.round(UPLOAD.document.maxBytesDefault / (1024 * 1024))} MB. Stored privately and never published.`}
      >
        {({ id, describedBy }) => (
          <>
            <input
              id={id}
              className={styles.fileInput}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              aria-describedby={describedBy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadCv(file);
              }}
            />
            <span className={styles.hint} aria-live="polite">
              {uploadState === 'uploading' ? 'Uploading your CV...' : null}
              {uploadState === 'done' && cvName ? `Attached: ${cvName}` : null}
              {uploadState === 'error' ? 'Upload failed. You can still submit without a CV.' : null}
            </span>
          </>
        )}
      </Field>

      <div className={styles.checkboxRow}>
        <input
          id="application-consent"
          type="checkbox"
          className={styles.checkbox}
          aria-invalid={Boolean(errors.consent)}
          {...register('consent')}
        />
        <label className={styles.checkboxLabel} htmlFor="application-consent">
          I agree to Key Tech Solutions processing this application and the information I have
          provided. <a href="/privacy">How we handle your information</a>.
          {errors.consent ? <span className={styles.error}> {errors.consent.message}</span> : null}
        </label>
      </div>

      <Honeypot register={register('website')} />

      <div className={styles.actions}>
        <Button type="submit" disabled={isSubmitting || uploadState === 'uploading'}>
          {isSubmitting ? 'Sending...' : 'Submit application'}
        </Button>
      </div>
    </form>
  );
}
