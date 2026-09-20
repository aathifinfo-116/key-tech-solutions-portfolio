'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordStrength, resetPasswordSchema, type ResetPasswordInput } from '@kts/validation';
import { Button, Field, Input, Notice, adminStyles as styles } from '@kts/admin-ui';
import { adminApi, describeError } from '@/lib/session';

/**
 * Password reset completion.
 *
 * The token arrives in the URL and is sent straight back to the API; it is
 * never stored, logged or displayed. Completing a reset revokes every other
 * session on the account.
 */
function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const password = watch('password') ?? '';
  const strength = passwordStrength(password);

  if (!token) {
    return (
      <Notice tone="error" title="This link is incomplete">
        The reset link is missing its token. Request a new one from the{' '}
        <Link href="/forgot-password">forgotten password</Link> page.
      </Notice>
    );
  }

  if (done) {
    return (
      <Notice tone="success" title="Password changed">
        Your password has been changed and every other session was signed out.{' '}
        <Link href="/login">Sign in</Link>.
      </Notice>
    );
  }

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setError(null);
        try {
          await adminApi.resetPassword({ ...values, token });
          setDone(true);
          setTimeout(() => router.replace('/login'), 2500);
        } catch (caught) {
          setError(describeError(caught));
        }
      })}
    >
      {error ? <Notice tone="error">{error}</Notice> : null}
      <input type="hidden" {...register('token')} value={token} />

      <Field
        label="New password"
        error={errors.password?.message}
        hint="At least 12 characters, with upper and lower case, a number and a symbol."
        counter={
          password ? (
            <span className={styles.counter} aria-live="polite">
              {strength.label}
            </span>
          ) : null
        }
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            type="password"
            autoComplete="new-password"
            autoFocus
            aria-describedby={describedBy}
            aria-invalid={invalid}
            {...register('password')}
          />
        )}
      </Field>

      <Field label="Confirm new password" error={errors.confirmPassword?.message}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            type="password"
            autoComplete="new-password"
            aria-describedby={describedBy}
            aria-invalid={invalid}
            {...register('confirmPassword')}
          />
        )}
      </Field>

      <Button type="submit" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Set new password'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.authShell}>
      <div className={styles.authCard}>
        <div className={styles.authBrand}>
          <span className={styles.brandMark} style={{ fontSize: '1.25rem' }}>
            Key Tech
          </span>
          <h1 className={styles.authTitle}>Choose a new password</h1>
        </div>
        <Suspense fallback={<p>Loading...</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
