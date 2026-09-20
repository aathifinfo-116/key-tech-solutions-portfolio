'use client';

/**
 * Session and server-state plumbing.
 *
 * Authentication is an HttpOnly cookie set by the API, so nothing here stores
 * a token. The session user is fetched once, cached by React Query, and used
 * to decide which navigation entries to show - a convenience, not a control,
 * since the API enforces every permission itself.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { ApiError, createAdminApi } from '@kts/api-client';
import type { SessionUserDto } from '@kts/shared-types';

const API_BASE = (process.env.NEXT_PUBLIC_ADMIN_API_URL ?? 'http://localhost:4000').replace(
  /\/+$/,
  '',
);

export const adminApi = createAdminApi(API_BASE);

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Admin data changes underneath you; a short stale time keeps lists
        // fresh without hammering the API on every focus change.
        staleTime: 15_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Never retry an auth or permission failure; it will not succeed.
          if (error instanceof ApiError && [401, 403, 404, 422].includes(error.status))
            return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// ---------------------------------------------------------------------------

interface SessionValue {
  user: SessionUserDto;
  can: (permission: string) => boolean;
  canAny: (...permissions: string[]) => boolean;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ user, children }: { user: SessionUserDto; children: ReactNode }) {
  const value = useMemo<SessionValue>(() => {
    const held = new Set(user.permissions);
    return {
      user,
      can: (permission) => held.has(permission),
      canAny: (...permissions) => permissions.some((permission) => held.has(permission)),
    };
  }, [user]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}

/** Loads the signed-in user, or null when there is no valid session. */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        return await adminApi.me();
      } catch (error) {
        if (error instanceof ApiError && error.isUnauthorised) return null;
        throw error;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => adminApi.logout(),
    onSettled: () => {
      queryClient.clear();
      router.replace('/login');
      router.refresh();
    },
  });
}

/**
 * Turns any error into a message safe and useful to show an editor.
 *
 * A 401 normally means the session ran out, which is what an editor half way
 * through an edit needs to be told. On the sign-in form it means the
 * credentials were wrong instead, so that screen passes `useServerMessage`
 * and gets the API's own wording.
 */
export function describeError(
  error: unknown,
  options: { useServerMessage401?: boolean } = {},
): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return options.useServerMessage401 && error.message
        ? error.message
        : 'Your session has expired. Sign in again.';
    }
    if (error.status === 403) return error.message;
    if (error.status === 422) {
      const fields = Object.entries(error.fieldErrors);
      if (fields.length > 0)
        return fields.map(([field, message]) => `${field}: ${message}`).join('; ');
      return error.message;
    }
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export { ApiError };
