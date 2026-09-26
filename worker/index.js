import { onRequestGet, onRequestOptions, onRequestPost } from '../functions/api/contact.js';

const API_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
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

const apiNotFound = () => withApiHeaders(new Response(JSON.stringify({ ok: false, code: 'not_found' }), {
  status: 404,
  headers: { 'Content-Type': 'application/json; charset=utf-8' }
}));

const methodNotAllowed = () => withApiHeaders(new Response(JSON.stringify({ ok: false, code: 'method_not_allowed' }), {
  status: 405,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    Allow: 'POST, OPTIONS'
  }
}));

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact' || url.pathname === '/api/contact/') {
      const context = {
        request,
        env,
        waitUntil: (promise) => ctx.waitUntil(promise)
      };

      let response;
      if (request.method === 'POST') response = await onRequestPost(context);
      else if (request.method === 'GET') response = onRequestGet(context);
      else if (request.method === 'OPTIONS') response = onRequestOptions(context);
      else response = methodNotAllowed();

      return withApiHeaders(response);
    }

    if (url.pathname.startsWith('/api/')) return apiNotFound();
    return env.ASSETS.fetch(request);
  }
};
