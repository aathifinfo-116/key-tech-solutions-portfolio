import { describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiError, buildQueryString, CACHE_TAGS } from './client';
import { createPublicApi } from './public-api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('buildQueryString', () => {
  it('returns an empty string for no query', () => {
    expect(buildQueryString(undefined)).toBe('');
    expect(buildQueryString({})).toBe('');
  });

  it('omits undefined, null and empty values', () => {
    expect(buildQueryString({ a: 1, b: undefined, c: null, d: '' })).toBe('?a=1');
  });

  it('repeats array values', () => {
    expect(buildQueryString({ tag: ['a', 'b'] })).toBe('?tag=a&tag=b');
  });

  it('encodes special characters', () => {
    expect(buildQueryString({ search: 'a b&c' })).toBe('?search=a+b%26c');
  });
});

describe('ApiClient', () => {
  it('builds the request url from base, path and query', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = new ApiClient({
      baseUrl: 'http://api.test/',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await client.get('/api/v1/public/services', { query: { page: 2 } });

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://api.test/api/v1/public/services?page=2',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('sends a json body with the right content type', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ id: '1' }, 201));
    const client = new ApiClient({
      baseUrl: 'http://api.test',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await client.post('/api/v1/public/contact', { name: 'Sam' });

    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"name":"Sam"}');
  });

  it('does not set a content type for multipart uploads', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ id: '1' }));
    const client = new ApiClient({
      baseUrl: 'http://api.test',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await client.request('/api/v1/media/upload', { method: 'POST', formData: new FormData() });

    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined();
  });

  it('calls fetch with the global as receiver, not the client', async () => {
    // Browsers throw "Illegal invocation" when fetch is called with any other
    // receiver, so the default implementation must be bound to globalThis.
    let receiver: unknown = 'unset';
    const original = globalThis.fetch;
    globalThis.fetch = function patched(this: unknown) {
      // Capturing the receiver is the whole point of this test.
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      receiver = this;
      return Promise.resolve(jsonResponse({ ok: true }));
    } as unknown as typeof fetch;

    try {
      const client = new ApiClient({ baseUrl: 'http://api.test' });
      await client.get('/x');
    } finally {
      globalThis.fetch = original;
    }

    expect(receiver).toBe(globalThis);
  });

  it('returns undefined for a 204', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const client = new ApiClient({
      baseUrl: 'http://api.test',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await expect(client.delete('/x')).resolves.toBeUndefined();
  });

  it('throws a typed ApiError carrying field errors', async () => {
    // A Response body can only be read once, so build a fresh one per call.
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        jsonResponse(
          {
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: 'Validation failed',
            details: [{ path: 'email', message: 'must be a valid email address' }],
          },
          422,
        ),
      ),
    );
    const client = new ApiClient({
      baseUrl: 'http://api.test',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(client.post('/x', {})).rejects.toBeInstanceOf(ApiError);
    try {
      await client.post('/x', {});
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.status).toBe(422);
      expect(apiError.fieldErrors.email).toBe('must be a valid email address');
    }
  });

  it('exposes convenience flags for common statuses', async () => {
    const make = (status: number) =>
      new ApiClient({
        baseUrl: 'http://api.test',
        fetchImpl: vi
          .fn()
          .mockResolvedValue(jsonResponse({ message: 'x' }, status)) as unknown as typeof fetch,
      });

    await expect(make(401).get('/x')).rejects.toMatchObject({ isUnauthorised: true });
    await expect(make(403).get('/x')).rejects.toMatchObject({ isForbidden: true });
    await expect(make(404).get('/x')).rejects.toMatchObject({ isNotFound: true });
  });

  it('getOrNull swallows a 404 but not other errors', async () => {
    const notFound = new ApiClient({
      baseUrl: 'http://api.test',
      fetchImpl: vi
        .fn()
        .mockResolvedValue(jsonResponse({ message: 'nope' }, 404)) as unknown as typeof fetch,
    });
    await expect(notFound.getOrNull('/x')).resolves.toBeNull();

    const serverError = new ApiClient({
      baseUrl: 'http://api.test',
      fetchImpl: vi
        .fn()
        .mockResolvedValue(jsonResponse({ message: 'boom' }, 500)) as unknown as typeof fetch,
    });
    await expect(serverError.getOrNull('/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('handles a non-json error body without throwing a parse error', async () => {
    const client = new ApiClient({
      baseUrl: 'http://api.test',
      fetchImpl: vi
        .fn()
        .mockResolvedValue(
          new Response('gateway timeout', { status: 504 }),
        ) as unknown as typeof fetch,
    });
    await expect(client.get('/x')).rejects.toThrow('gateway timeout');
  });
});

describe('PublicApi caching', () => {
  it('tags cached reads so a publish can invalidate them', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ items: [], meta: {} }));
    const api = createPublicApi('http://api.test', fetchImpl as unknown as typeof fetch);

    await api.service('saas-product-development');

    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit & { next?: { tags: string[] } };
    expect(init.next?.tags).toContain(CACHE_TAGS.services);
    expect(init.next?.tags).toContain('service:saas-product-development');
  });

  it('never caches form submissions', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ reference: 'KTS-1' }));
    const api = createPublicApi('http://api.test', fetchImpl as unknown as typeof fetch);

    await api.submitContact({ name: 'Sam' });

    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(init.cache).toBe('no-store');
  });

  it('url-encodes slugs', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}));
    const api = createPublicApi('http://api.test', fetchImpl as unknown as typeof fetch);

    await api.post('a b/c');

    expect(fetchImpl.mock.calls[0]?.[0]).toBe('http://api.test/api/v1/public/blog/a%20b%2Fc');
  });
});
