'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { loginSchema, type LoginInput } from '@kts/validation';
import { Button, CheckboxRow, Field, Input, Notice, adminStyles as styles } from '@kts/admin-ui';
import { ApiError, adminApi, describeError } from '@/lib/session';

/**
 * Administration sign-in.
 *
 * The API returns one message for every failure mode, so this screen cannot be
 * used to work out which email addresses exist. The session is an HttpOnly
 * cookie; nothing is written to storage here.
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberDevice: false },
  });

  const next = searchParams?.get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setSubmitError(null);
        try {
          const user = await adminApi.login(values);
          queryClient.setQueryData(['session'], user);
          router.replace(safeNext);
          router.refresh();
        } catch (error) {
          // A 401 here means the credentials were wrong, not that a session
          // expired, so the API's deliberately non-committal wording is shown
          // as it stands: it never says whether the account exists.
          setSubmitError(
            error instanceof ApiError && error.status === 429
              ? error.message
              : describeError(error, { useServerMessage401: true }),
          );
        }
      })}
    >
      {submitError ? (
        <Notice tone="error" title="Sign-in failed">
          {submitError}
        </Notice>
      ) : null}

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

      <Field label="Password" error={errors.password?.message}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            type="password"
            autoComplete="current-password"
            aria-describedby={describedBy}
            aria-invalid={invalid}
            {...register('password')}
          />
        )}
      </Field>

      <CheckboxRow
        id="rememberDevice"
        label="Remember this device"
        hint="Extends how long the session lasts before it expires outright. It does not extend the idle timeout."
        {...register('rememberDevice')}
      />

      <Button type="submit" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>

      <p className={styles.authFooter}>
        <Link href="/forgot-password">Forgotten your password?</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className={styles.authShell}>
      <div className={styles.authCard}>
        <div className={styles.authBrand}>
          <span className={styles.brandMark} style={{ fontSize: '1.25rem' }}>
            Key Tech
          </span>
          <h1 className={styles.authTitle}>Administration panel</h1>
          <p className={styles.authSubtitle}>
            Sign in to manage the website, products and enquiries.
          </p>
        </div>
        <Suspense fallback={<p>Loading...</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
