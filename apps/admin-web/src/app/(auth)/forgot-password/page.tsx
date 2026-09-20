'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@kts/validation';
import { Button, Field, Input, Notice, adminStyles as styles } from '@kts/admin-ui';
import { adminApi, describeError } from '@/lib/session';

/**
 * Password reset request.
 *
 * The response is identical whether or not the address belongs to an account,
 * so this page cannot be used to enumerate administrators.
 */
export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  return (
    <div className={styles.authShell}>
      <div className={styles.authCard}>
        <div className={styles.authBrand}>
          <span className={styles.brandMark} style={{ fontSize: '1.25rem' }}>
            Key Tech
          </span>
          <h1 className={styles.authTitle}>Reset your password</h1>
          <p className={styles.authSubtitle}>
            Enter the email address on your admin account and we will send a single-use link.
          </p>
        </div>

        {message ? (
          <Notice tone="success" title="Check your email">
            {message}
          </Notice>
        ) : (
          <form
            className={styles.form}
            noValidate
            onSubmit={handleSubmit(async (values) => {
              setError(null);
              try {
                const result = await adminApi.forgotPassword(values);
                setMessage(result.message);
              } catch (caught) {
                setError(describeError(caught));
              }
            })}
          >
            {error ? <Notice tone="error">{error}</Notice> : null}

            <Field label="Email address" error={errors.email?.message}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoFocus
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  {...register('email')}
                />
              )}
            </Field>

            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
        )}

        <p className={styles.authFooter}>
          <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
