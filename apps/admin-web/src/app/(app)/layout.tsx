'use client';

/**
 * Authenticated admin layout.
 *
 * Redirects to the sign-in page when there is no valid session, and forces a
 * password change before anything else when the account is flagged for one.
 * This is a convenience for the operator: the API independently refuses every
 * request that lacks a session or a permission.
 */

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminShell, Notice } from '@kts/admin-ui';
import { NAV_GROUPS, titleForPath } from '@/lib/navigation';
import { SessionProvider, useCurrentUser, useSignOut } from '@/lib/session';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const { data: user, isPending, isError } = useCurrentUser();
  const signOut = useSignOut();

  useEffect(() => {
    if (!isPending && user === null) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
    }
  }, [isPending, user, pathname, router]);

  useEffect(() => {
    if (user?.mustChangePassword && pathname !== '/account') {
      router.replace('/account');
    }
  }, [user, pathname, router]);

  if (isPending) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <p aria-live="polite">Loading your session...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 24 }}>
        <Notice tone="error" title="The API is unreachable">
          The administration panel cannot reach the API. Check that it is running and try again.
        </Notice>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SessionProvider user={user}>
      <AdminShell
        user={user}
        groups={NAV_GROUPS}
        title={titleForPath(pathname)}
        onSignOut={() => signOut.mutate()}
      >
        {user.mustChangePassword && pathname === '/account' ? (
          <div style={{ marginBottom: 20 }}>
            <Notice tone="warning" title="Choose a new password">
              This account was created with a temporary password. Set your own before continuing.
            </Notice>
          </div>
        ) : null}
        {children}
      </AdminShell>
    </SessionProvider>
  );
}
