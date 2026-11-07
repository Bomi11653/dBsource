import test from 'node:test';
import assert from 'node:assert/strict';
import { createCmsClient, CmsHttpError } from './cms-client.mjs';

const jsonOk = (data) => ({ ok: true, status: 200, json: async () => ({ data }) });
const httpError = (status) => ({ ok: false, status });

test('GET collection success, same-key memory TTL cache', async () => {
  let requests = 0;
  let now = 1000;
  const client = createCmsClient({
    baseUrl: 'http://127.0.0.1:1337',
    fetchImpl: async () => { requests++; return jsonOk([{ id: 1 }]); },
    now: () => now,
  });
  assert.equal((await client.getCollection('/products')).source, 'live');
  now += 1000;
  const second = await client.getCollection('/products');
  assert.equal(second.source, 'memory-cache');
  assert.deepEqual(second.data, [{ id: 1 }]);
  assert.equal(requests, 1);
});

test('deduplicates concurrent identical API GETs', async () => {
  let requests = 0;
  const client = createCmsClient({ baseUrl: 'https://cms.example.test', fetchImpl: async () => {
    requests++;
    await new Promise(resolve => setTimeout(resolve, 5));
    return jsonOk([10]);
  }});
  const [a, b] = await Promise.all([
    client.getCollection('/products?pagination[pageSize]=1'),
    client.getCollection('/products?pagination[pageSize]=1'),
  ]);
  assert.equal(requests, 1);
  assert.deepEqual(a.data, b.data);
});

test('returns bounded last-known-good data on transient 500', async () => {
  let now = 0;
  let failure = false;
  const client = createCmsClient({ baseUrl: 'http://localhost:1337', ttlMs: 5, staleMaxAgeMs: 100,
    now: () => now, fetchImpl: async () => failure ? httpError(500) : jsonOk([{ model: 'A' }]) });
  await client.getCollection('/products');
  failure = true;
  now = 20;
  assert.equal((await client.getCollection('/products')).source, 'stale');
  now = 101;
  await assert.rejects(client.getCollection('/products'), (e) => e instanceof CmsHttpError && e.status === 500);
});

test('401 is not silently swallowed by a cached copy', async () => {
  let now = 0;
  let denied = false;
  const client = createCmsClient({ baseUrl: 'http://localhost:1337', ttlMs: 1, staleMaxAgeMs: 1000,
    now: () => now, fetchImpl: async () => denied ? httpError(401) : jsonOk([{ model: 'A' }]) });
  await client.getCollection('/products');
  now = 10;
  denied = true;
  await assert.rejects(client.getCollection('/products'), (e) => e instanceof CmsHttpError && e.status === 401);
});

test('rejects absolute and traversing paths', async () => {
  const client = createCmsClient({ baseUrl: 'http://localhost:1337', fetchImpl: async () => jsonOk([]) });
  await assert.rejects(client.getCollection('//evil.example.net/data'), TypeError);
  await assert.rejects(client.getCollection('/../secrets'), TypeError);
});

test('passes token only via server side Authorization request header', async () => {
  let header = '';
  const client = createCmsClient({ baseUrl: 'http://localhost:1337', token: 'demo-test-only', fetchImpl: async (_url, init) => {
    header = init.headers.Authorization;
    return jsonOk([]);
  }});
  await client.getCollection('/products');
  assert.equal(header, 'Bearer demo-test-only');
});


test('network timeout can return recent stale cache, but not stale beyond max age', async () => {
  let now = 0;
  let timeoutMode = false;
  const client = createCmsClient({ baseUrl: 'http://localhost:1337', ttlMs: 1, staleMaxAgeMs: 100, timeoutMs: 10, now: () => now,
    fetchImpl: async (_url, init) => {
      if (!timeoutMode) return jsonOk([{ id: 10 }]);
      return new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
      });
    },
  });
  await client.getCollection('/products');
  timeoutMode = true;
  now = 2;
  assert.equal((await client.getCollection('/products')).source, 'stale');
  now = 200;
  await assert.rejects(client.getCollection('/products'), (e) => e.name === 'AbortError');
});


test('404 missing collection cannot be concealed with stale cache', async () => {
  let now = 0; let missing = false;
  const client = createCmsClient({ baseUrl: 'http://localhost:1337', ttlMs: 1, staleMaxAgeMs: 1000, now: () => now,
    fetchImpl: async () => missing ? httpError(404) : jsonOk([{ id: 1 }]) });
  await client.getCollection('/products'); now = 3; missing = true;
  await assert.rejects(client.getCollection('/products'), (e) => e instanceof CmsHttpError && e.status === 404);
});

test('invalid collection schema is not treated as a temporary outage', async () => {
  let now = 0; let invalid = false;
  const client = createCmsClient({ baseUrl: 'http://localhost:1337', ttlMs: 1, staleMaxAgeMs: 1000, now: () => now,
    fetchImpl: async () => invalid ? jsonOk('wrong shape') : jsonOk([{ id: 1 }]) });
  await client.getCollection('/products'); now = 3; invalid = true;
  await assert.rejects(client.getCollection('/products'), (e) => e.name === 'CmsSchemaError');
});
