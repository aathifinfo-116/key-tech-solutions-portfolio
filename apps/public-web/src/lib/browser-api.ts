/**
 * Browser-side API client.
 *
 * Used only by form components. It points at the public API origin, which is
 * a NEXT_PUBLIC_ value by necessity - it is a URL, not a secret. Nothing
 * authenticated is ever called from here.
 */

import { createPublicApi } from '@kts/api-client';

const BROWSER_API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4010').replace(
  /\/+$/,
  '',
);

export const browserApi = createPublicApi(BROWSER_API_BASE);
