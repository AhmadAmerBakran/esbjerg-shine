import assert from 'node:assert/strict';
import { onRequestGet, onRequestOptions, onRequestPost } from '../functions/api/contact.js';

const endpoint = 'https://esbjergshine.dk/api/contact';

const request = (body, headers = {}) => new Request(endpoint, {
  method: 'POST',
  headers,
  body: typeof body === 'string' ? body : JSON.stringify(body)
});

const validPayload = (overrides = {}) => ({
  navn: 'Testkunde',
  telefon: '+45 12 34 56 78',
  email: 'kunde@example.com',
  ydelse: 'Polering',
  besked: 'Jeg vil gerne have et tilbud.',
  website: '',
  startedAt: Date.now() - 2_000,
  samtykke: true,
  ...overrides
});

{
  const response = onRequestGet();
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
}

{
  const response = onRequestOptions();
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('allow'), 'POST');
}

{
  const response = await onRequestPost({ request: request(validPayload(), { 'Content-Type': 'application/json' }), env: {} });
  assert.equal(response.status, 403, 'POST without Origin must be rejected');
}

{
  const response = await onRequestPost({
    request: request(validPayload(), { Origin: 'https://esbjergshine.dk', 'Content-Type': 'text/plain' }),
    env: {}
  });
  assert.equal(response.status, 415, 'non-JSON submissions must be rejected');
}

{
  const response = await onRequestPost({
    request: request('{', { Origin: 'https://esbjergshine.dk', 'Content-Type': 'application/json' }),
    env: {}
  });
  assert.equal(response.status, 400, 'malformed JSON must be rejected');
}

{
  const response = await onRequestPost({
    request: request(validPayload({ ydelse: 'Polering & lakforbedring' }), {
      Origin: 'https://esbjergshine.dk',
      'Content-Type': 'application/json'
    }),
    env: {}
  });
  assert.equal(response.status, 400, 'obsolete service values must be rejected');
}

{
  const response = await onRequestPost({
    request: request(validPayload({ startedAt: Date.now() }), {
      Origin: 'https://esbjergshine.dk',
      'Content-Type': 'application/json'
    }),
    env: {}
  });
  assert.equal(response.status, 400, 'impossibly fast submissions must be rejected');
}

{
  const response = await onRequestPost({
    request: request(validPayload(), {
      Origin: 'https://esbjergshine.dk',
      'Content-Type': 'application/json'
    }),
    env: {}
  });
  assert.equal(response.status, 503, 'valid submissions must fail closed when mail delivery is unconfigured');
}

console.log('Contact endpoint regression tests passed.');
