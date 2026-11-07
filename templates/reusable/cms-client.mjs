/**
 * General-purpose, read-only CMS client (Node.js >=18, ESM).
 * Portable illustration: in-process TTL cache, request dedup, timeout,
 * and bounded stale-if-error. NOT persistent across process restarts.
 * No retries: unlimited retries can cause a thundering herd when DB is unhealthy.
 * Never use this module in browser/client components if token is supplied.
 */

export class CmsHttpError extends Error {
  constructor(status, path) {
    super(`CMS GET failed: status ${status}, path ${path}`);
    this.name = 'CmsHttpError';
    this.status = status;
    this.path = path;
  }
}

export class CmsSchemaError extends Error {
  constructor(path) {
    super(`Invalid CMS response schema at ${path}`);
    this.name = 'CmsSchemaError';
  }
}

export function createCmsClient({
  baseUrl,
  token = '',
  fetchImpl = fetch,
  now = () => Date.now(),
  timeoutMs = 5_000,
  ttlMs = 30_000,
  staleMaxAgeMs = 5 * 60_000,
} = {}) {
  if (!baseUrl || typeof baseUrl !== 'string') {
    throw new TypeError('baseUrl is required');
  }
  const origin = new URL(baseUrl);
  if (!['http:', 'https:'].includes(origin.protocol)) throw new TypeError('CMS must use HTTP(S)');
  if (origin.username || origin.password) throw new TypeError('Do not put credentials in CMS URL');
  for (const [k, n] of Object.entries({ timeoutMs, ttlMs, staleMaxAgeMs })) {
    if (!Number.isFinite(n) || n < 0) throw new RangeError(`${k} must be non-negative`);
  }
  const cache = new Map();
  const inFlight = new Map();

  function canonicalPath(path) {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
      throw new TypeError('Use a relative API path starting with /');
    }
    // Never allow callers to supply a fully qualified URL/host as a path.
    if (path.includes('\\') || /(^|\/)\.\.?(\/|\?|$)/.test(path)) {
      throw new TypeError('Disallowed path segment');
    }
    const u = new URL(`/api${path}`, origin);
    if (u.origin !== origin.origin || !u.pathname.startsWith('/api/')) {
      throw new TypeError('CMS path leaves the API origin');
    }
    return u.pathname + u.search;
  }

  async function fetchFresh(key) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(new URL(key, origin), {
        method: 'GET',
        headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: controller.signal,
      });
      if (!response.ok) throw new CmsHttpError(response.status, key);
      const body = await response.json();
      if (body === null || !Array.isArray(body.data)) {
        throw new CmsSchemaError(key);
      }
      const entry = { data: body.data, cachedAt: now() };
      cache.set(key, entry);
      return { ...entry, source: 'live', ageMs: 0 };
    } finally {
      clearTimeout(timeout);
    }
  }

  async function getCollection(path) {
    const key = canonicalPath(path);
    const cached = cache.get(key);
    const age = cached ? Math.max(0, now() - cached.cachedAt) : Infinity;
    if (cached && age <= ttlMs) return { ...cached, source: 'memory-cache', ageMs: age };
    if (inFlight.has(key)) return inFlight.get(key);

    const task = (async () => {
      try {
        return await fetchFresh(key);
      } catch (e) {
        // Only transport failures, timeouts, and transient HTTP statuses may use stale data.
        // Authorization errors, missing resources, and invalid schema must be visible.
        const transient = e instanceof CmsHttpError
          ? e.status === 408 || e.status === 429 || e.status >= 500
          : (e instanceof TypeError || e?.name === 'AbortError');
        if (!transient) throw e;
        const stillGood = cache.get(key);
        const staleAge = stillGood ? Math.max(0, now() - stillGood.cachedAt) : Infinity;
        if (stillGood && staleAge <= staleMaxAgeMs) {
          return { ...stillGood, source: 'stale', ageMs: staleAge };
        }
        throw e;
      } finally {
        inFlight.delete(key);
      }
    })();
    inFlight.set(key, task);
    return task;
  }

  return {
    getCollection,
    clearCache: () => cache.clear(),
    getCacheKeys: () => Array.from(cache.keys()),
  };
}
