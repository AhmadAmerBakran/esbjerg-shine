import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/contact.js';

const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;

test('Graph token failure is mapped to delivery_unavailable on a cold module instance', async () => {
  Object.defineProperty(globalThis, 'caches', {
    configurable: true,
    writable: true,
    value: {
      default: {
        async match() {
          return undefined;
        },
        async put() {}
      }
    }
  });

  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('challenges.cloudflare.com/turnstile/v0/siteverify')) {
      return new Response(JSON.stringify({ success: true, action: 'contact', hostname: 'esbjergshine.dk' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.includes('login.microsoftonline.com')) {
      return new Response(JSON.stringify({ error: 'invalid_client' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };

  const env = {
    APP_ENV: 'production',
    APP_HOSTNAME: 'esbjergshine.dk',
    TURNSTILE_SECRET_KEY: 'test-secret',
    M365_TENANT_ID: 'tenant-id',
    M365_CLIENT_ID: 'client-id',
    M365_CLIENT_SECRET: 'client-secret',
    CONTACT_RATE_LIMITER: { limit: async () => ({ success: true }) }
  };
  const request = new Request('https://esbjergshine.dk/api/contact', {
    method: 'POST',
    headers: {
      Origin: 'https://esbjergshine.dk',
      'Sec-Fetch-Site': 'same-origin',
      'CF-Connecting-IP': '203.0.113.20',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      navn: 'Test Kunde',
      telefon: '',
      email: 'kunde@example.com',
      ydelse: 'Polering',
      besked: 'Test af tokenfejl.',
      website: '',
      turnstileToken: 'test-token',
      submissionId: 'submission-token-123456789012345',
      startedAt: Date.now() - 2_000,
      samtykke: true
    })
  });

  try {
    const response = await onRequestPost({ request, env });
    const body = await response.json();
    assert.equal(response.status, 502);
    assert.equal(body.code, 'delivery_unavailable');
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, 'caches', {
      configurable: true,
      writable: true,
      value: originalCaches
    });
  }
});
