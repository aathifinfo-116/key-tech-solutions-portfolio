/**
 * Typed HTTP client for the Key Tech API.
 *
 * Used by the public website (server components, with Next.js cache tags) and
 * by the admin panel (browser, with credentials). No credentials or secrets are
 * ever embedded here; callers pass what they need per request.
 */

import type { ApiErrorBody, Paginated } from '@kts/shared-types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorBody | null,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isUnauthorised(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get fieldErrors(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const detail of this.body?.details ?? []) map[detail.path] = detail.message;
    return map;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined | null | string[]>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Next.js fetch cache controls. Ignored outside Next. */
  next?: { revalidate?: number | false; tags?: string[] };
  cache?: 'force-cache' | 'no-store';
  /** Send cookies (admin panel). */
  credentials?: 'include' | 'omit' | 'same-origin';
  signal?: AbortSignal;
  /** Multipart upload body; set instead of `body`. */
  formData?: FormData;
}

export interface ApiClientConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  /** Default fetch credentials mode for every request. */
  credentials?: RequestOptions['credentials'];
  /** Injected for tests. */
  fetchImpl?: typeof fetch;
}

export function buildQueryString(
  query: Record<string, string | number | boolean | undefined | null | string[]> | undefined,
): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((item) => params.append(key, String(item)));
    } else {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly credentials?: RequestOptions['credentials'];
  private readonly fetchImpl: typeof fetch;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.defaultHeaders = config.defaultHeaders ?? {};
    this.credentials = config.credentials;
    // Bound to globalThis on purpose: calling it as `this.fetchImpl(...)`
    // would make `this` the ApiClient, and browsers reject fetch invoked with
    // any receiver other than the global object ("Illegal invocation").
    this.fetchImpl = config.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}${buildQueryString(options.query)}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...this.defaultHeaders,
      ...options.headers,
    };
    let body: BodyInit | undefined;

    if (options.formData) {
      body = options.formData;
      // The browser sets the multipart boundary; forcing it breaks the upload.
      delete headers['Content-Type'];
    } else if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    const response = await this.fetchImpl(url, {
      method: options.method ?? 'GET',
      headers,
      body,
      credentials: options.credentials ?? this.credentials,
      signal: options.signal,
      ...(options.cache ? { cache: options.cache } : {}),
      ...(options.next ? { next: options.next } : {}),
    } as RequestInit);

    if (response.status === 204) return undefined as T;

    const text = await response.text();
    const parsed = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      const errorBody = (parsed as ApiErrorBody | null) ?? null;
      throw new ApiError(
        response.status,
        errorBody,
        errorBody?.message ?? `Request to ${path} failed with status ${response.status}`,
      );
    }

    return parsed as T;
  }

  get<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  patch<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  put<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  delete<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  /** GET that resolves to `null` on 404 instead of throwing. */
  async getOrNull<T>(
    path: string,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<T | null> {
    try {
      return await this.get<T>(path, options);
    } catch (error) {
      if (error instanceof ApiError && error.isNotFound) return null;
      throw error;
    }
  }

  list<T>(
    path: string,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<Paginated<T>> {
    return this.get<Paginated<T>>(path, options);
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

/** Cache tags used for on-demand revalidation after a publish. */
export const CACHE_TAGS = {
  settings: 'settings',
  navigation: 'navigation',
  homepage: 'homepage',
  pages: 'pages',
  page: (slug: string) => `page:${slug}`,
  services: 'services',
  service: (slug: string) => `service:${slug}`,
  solutions: 'solutions',
  solution: (slug: string) => `solution:${slug}`,
  industries: 'industries',
  industry: (slug: string) => `industry:${slug}`,
  products: 'products',
  product: (slug: string) => `product:${slug}`,
  portfolio: 'portfolio',
  project: (slug: string) => `project:${slug}`,
  caseStudies: 'case-studies',
  caseStudy: (slug: string) => `case-study:${slug}`,
  blog: 'blog',
  post: (slug: string) => `post:${slug}`,
  careers: 'careers',
  career: (slug: string) => `career:${slug}`,
  company: 'company',
  technologies: 'technologies',
  sitemap: 'sitemap',
} as const;
