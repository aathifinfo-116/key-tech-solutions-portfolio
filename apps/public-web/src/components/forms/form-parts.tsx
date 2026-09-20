'use client';

/**
 * Shared form building blocks.
 *
 * Every field is a real label bound to a real input, errors are associated
 * with `aria-describedby`, and the submit-time error summary is focusable so
 * screen readers announce what went wrong.
 */

import {
  forwardRef,
  useId,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type InputHTMLAttributes,
} from 'react';
import styles from './forms.module.css';

export interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

export function Field({ label, error, hint, optional, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {optional ? <span className={styles.optional}> (optional)</span> : null}
      </label>
      {hint ? (
        <span className={styles.hint} id={hintId}>
          {hint}
        </span>
      ) : null}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <span className={styles.error} id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput(props, ref) {
    return <input ref={ref} className={styles.input} {...props} />;
  },
);

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea(props, ref) {
  return <textarea ref={ref} className={styles.textarea} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ children, ...props }, ref) {
    return (
      <select ref={ref} className={styles.select} {...props}>
        {children}
      </select>
    );
  },
);

export function Row({ children, two }: { children: ReactNode; two?: boolean }) {
  return <div className={`${styles.row} ${two ? styles.two : ''}`}>{children}</div>;
}

/** Off-screen decoy field. Real people never fill it; simple bots do. */
export function Honeypot({ register }: { register: Record<string, unknown> }) {
  return (
    <div className={styles.honeypot} aria-hidden="true">
      <label htmlFor="kt-website">Leave this field empty</label>
      <input id="kt-website" type="text" tabIndex={-1} autoComplete="off" {...register} />
    </div>
  );
}

export interface ErrorSummaryProps {
  errors: Array<{ field: string; message: string }>;
  title?: string;
}

export function ErrorSummary({
  errors,
  title = 'Please fix the following before submitting',
}: ErrorSummaryProps) {
  if (errors.length === 0) return null;
  return (
    <div className={styles.summary} role="alert" tabIndex={-1} data-error-summary>
      <p className={styles.summaryTitle}>{title}</p>
      <ul className={styles.summaryList}>
        {errors.map((error) => (
          <li key={error.field}>{error.message}</li>
        ))}
      </ul>
    </div>
  );
}

export function SuccessPanel({
  title,
  message,
  reference,
}: {
  title: string;
  message: string;
  reference?: string;
}) {
  return (
    <div className={styles.success} role="status" tabIndex={-1}>
      <p className={styles.successTitle}>{title}</p>
      <p>{message}</p>
      {reference ? (
        <p>
          Your reference is <span className={styles.reference}>{reference}</span>. Quote it if you
          get in touch again.
        </p>
      ) : null}
    </div>
  );
}

export { styles as formStyles };
