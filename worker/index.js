import { onRequestGet, onRequestOptions, onRequestPost } from '../functions/api/contact.js';

const API_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy':
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'noindex'
};

const withApiHeaders = (response) => {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(API_HEADERS)) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

const apiJson = (data, status, extraHeaders = {}) =>
  withApiHeaders(
    new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...extraHeaders
      }
    })
  );

const apiNotFound = () => apiJson({ ok: false, code: 'not_found' }, 404);
const methodNotAllowed = () => apiJson({ ok: false, code: 'method_not_allowed' }, 405, { Allow: 'POST, OPTIONS' });
const internalError = (requestId) => apiJson({ ok: false, code: 'internal_error' }, 500, { 'X-Request-ID': requestId });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact' || url.pathname === '/api/contact/') {
      const context = {
        request,
        env,
        waitUntil: (promise) => ctx.waitUntil(promise)
      };

      try {
        let response;
        if (request.method === 'POST') response = await onRequestPost(context);
        else if (request.method === 'GET') response = onRequestGet(context);
        else if (request.method === 'OPTIONS') response = onRequestOptions(context);
        else response = methodNotAllowed();

        return withApiHeaders(response);
      } catch {
        const requestId = crypto.randomUUID();
        console.error(`[contact] ${JSON.stringify({ event: 'worker_unhandled_error', requestId })}`);
        return internalError(requestId);
      }
    }

    if (url.pathname.startsWith('/api/')) return apiNotFound();
    return env.ASSETS.fetch(request);
  }
};
