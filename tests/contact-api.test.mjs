import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet, onRequestOptions, onRequestPost } from '../functions/api/contact.js';
import worker from '../worker/index.js';

const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;

let receiptStore;
let graphCalls;
let turnstileResult;
let deliveryStatus;

const baseEnv = () => ({
  APP_ENV: 'production',
  APP_HOSTNAME: 'esbjergshine.dk',
  TURNSTILE_SECRET_KEY: 'test-secret',
  M365_TENANT_ID: 'tenant-id',
  M365_CLIENT_ID: 'client-id',
  M365_CLIENT_SECRET: 'client-secret',
  CONTACT_RATE_LIMITER: { limit: async () => ({ success: true }) }
});

const validPayload = (overrides = {}) => ({
  navn: 'Test Kunde',
  telefon: '+45 12 34 56 78',
  email: 'kunde@example.com',
  ydelse: 'Polering',
  besked: 'Jeg vil gerne høre mere om polering af bilen.',
  website: '',
  turnstileToken: 'test-token',
  submissionId: 'submission-12345678901234567890',
  startedAt: Date.now() - 2_000,
  samtykke: true,
  ...overrides
});

const makeRequest = (payload = validPayload(), options = {}) => {
  const headers = new Headers({
    Origin: options.origin ?? 'https://esbjergshine.dk',
    'Sec-Fetch-Site': options.fetchSite ?? 'same-origin',
    'CF-Connecting-IP': options.ip ?? '203.0.113.10',
    'Content-Type': options.contentType ?? 'application/json'
  });
  if (options.contentLength) headers.set('Content-Length', String(options.contentLength));
  return new Request(options.url ?? 'https://esbjergshine.dk/api/contact', {
    method: options.method ?? 'POST',
    headers,
    body: options.rawBody ?? JSON.stringify(payload)
  });
};

const responseJson = async (response) => ({ response, body: await response.json() });

beforeEach(() => {
  receiptStore = new Map();
  graphCalls = 0;
  turnstileResult = { success: true, action: 'contact', hostname: 'esbjergshine.dk' };
  deliveryStatus = 202;

  Object.defineProperty(globalThis, 'caches', {
    configurable: true,
    writable: true,
    value: {
      default: {
        async match(request) {
          const value = receiptStore.get(request.url);
          return value === undefined ? undefined : new Response(value);
        },
        async put(request, response) {
          receiptStore.set(request.url, await response.text());
        }
      }
    }
  });

  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('challenges.cloudflare.com/turnstile/v0/siteverify')) {
      return new Response(JSON.stringify(turnstileResult), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.includes('login.microsoftonline.com')) {
      return new Response(JSON.stringify({ access_token: 'graph-token', expires_in: 3600 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.includes('graph.microsoft.com')) {
      graphCalls += 1;
      return new Response(null, { status: deliveryStatus });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  Object.defineProperty(globalThis, 'caches', {
    configurable: true,
    writable: true,
    value: originalCaches
  });
});

test('valid enquiry is delivered once through Microsoft Graph', async () => {
  const { response, body } = await responseJson(await onRequestPost({ request: makeRequest(), env: baseEnv() }));
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(graphCalls, 1);
  assert.match(response.headers.get('x-request-id') ?? '', /^[0-9a-f-]{36}$/i);
});

test('same successful submission id and content is treated as a duplicate', async () => {
  const env = baseEnv();
  const payload = validPayload();
  const first = await responseJson(await onRequestPost({ request: makeRequest(payload), env }));
  const second = await responseJson(await onRequestPost({ request: makeRequest(payload), env }));
  assert.equal(first.body.ok, true);
  assert.equal(second.body.ok, true);
  assert.equal(second.body.duplicate, true);
  assert.equal(graphCalls, 1);
});

test('cross-origin submissions are rejected before external calls', async () => {
  const { response, body } = await responseJson(
    await onRequestPost({ request: makeRequest(validPayload(), { origin: 'https://example.com' }), env: baseEnv() })
  );
  assert.equal(response.status, 403);
  assert.equal(body.code, 'origin');
  assert.equal(graphCalls, 0);
});

test('invalid content type is rejected', async () => {
  const { response, body } = await responseJson(
    await onRequestPost({ request: makeRequest(validPayload(), { contentType: 'text/plain' }), env: baseEnv() })
  );
  assert.equal(response.status, 415);
  assert.equal(body.code, 'content_type');
});

test('oversized requests are rejected from Content-Length before parsing', async () => {
  const { response, body } = await responseJson(
    await onRequestPost({ request: makeRequest(validPayload(), { contentLength: 12_001 }), env: baseEnv() })
  );
  assert.equal(response.status, 413);
  assert.equal(body.code, 'too_large');
});

test('required fields and service allowlist are enforced', async () => {
  const missing = await responseJson(
    await onRequestPost({ request: makeRequest(validPayload({ navn: '' })), env: baseEnv() })
  );
  assert.equal(missing.response.status, 400);
  assert.equal(missing.body.code, 'required');

  const invalid = await responseJson(
    await onRequestPost({ request: makeRequest(validPayload({ ydelse: 'Ukendt ydelse' })), env: baseEnv() })
  );
  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.body.code, 'invalid');
});

test('rate limiting returns 429 with Retry-After', async () => {
  const env = baseEnv();
  env.CONTACT_RATE_LIMITER.limit = async () => ({ success: false });
  const { response, body } = await responseJson(await onRequestPost({ request: makeRequest(), env }));
  assert.equal(response.status, 429);
  assert.equal(body.code, 'rate_limited');
  assert.equal(response.headers.get('retry-after'), '60');
});

test('unavailable rate limiter fails closed in production', async () => {
  const env = baseEnv();
  delete env.CONTACT_RATE_LIMITER;
  const { response, body } = await responseJson(await onRequestPost({ request: makeRequest(), env }));
  assert.equal(response.status, 503);
  assert.equal(body.code, 'security_unavailable');
});

test('Turnstile failure is rejected', async () => {
  turnstileResult = { success: false };
  const { response, body } = await responseJson(await onRequestPost({ request: makeRequest(), env: baseEnv() }));
  assert.equal(response.status, 403);
  assert.equal(body.code, 'turnstile');
  assert.equal(graphCalls, 0);
});

test('missing Graph configuration exposes a controlled fallback state', async () => {
  const env = baseEnv();
  delete env.M365_CLIENT_SECRET;
  const { response, body } = await responseJson(await onRequestPost({ request: makeRequest(), env }));
  assert.equal(response.status, 503);
  assert.equal(body.code, 'not_configured');
});

test('Graph delivery failure is mapped to a controlled error', async () => {
  deliveryStatus = 503;
  const { response, body } = await responseJson(
    await onRequestPost({
      request: makeRequest(validPayload({ submissionId: 'submission-22345678901234567890' })),
      env: baseEnv()
    })
  );
  assert.equal(response.status, 502);
  assert.equal(body.code, 'delivery_failed');
});

test('GET and OPTIONS expose only the intended contact method', async () => {
  const get = onRequestGet();
  assert.equal(get.status, 405);
  assert.equal(get.headers.get('allow'), 'POST');

  const options = onRequestOptions();
  assert.equal(options.status, 204);
  assert.equal(options.headers.get('allow'), 'POST');
});

test('Worker protects unknown API routes and delegates normal assets', async () => {
  const ctx = { waitUntil() {} };
  const env = {
    ...baseEnv(),
    ASSETS: { fetch: async () => new Response('asset-ok', { status: 200 }) }
  };

  const missingApi = await worker.fetch(new Request('https://esbjergshine.dk/api/unknown'), env, ctx);
  assert.equal(missingApi.status, 404);
  assert.equal(missingApi.headers.get('cache-control'), 'no-store');
  assert.equal(missingApi.headers.get('x-robots-tag'), 'noindex');
  assert.match(missingApi.headers.get('content-security-policy') ?? '', /default-src 'none'/);

  const asset = await worker.fetch(new Request('https://esbjergshine.dk/ydelser/'), env, ctx);
  assert.equal(asset.status, 200);
  assert.equal(await asset.text(), 'asset-ok');
});
