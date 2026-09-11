const ALLOWED_SERVICES = new Set([
  'Håndvask & udvendig bilpleje',
  'Indvendig bilpleje',
  'Komplet klargøring',
  'Polering & lakforbedring',
  'Lakbeskyttelse & coating',
  'Sæde- & tekstilrens',
  'Andet'
]);

const MAX_BODY_CHARS = 12_000;
const RATE_LIMIT_SECONDS = 75;
const TOKEN_SKEW_MS = 60_000;
let cachedAccessToken = '';
let cachedAccessTokenExpiresAt = 0;

const json = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders
  }
});

const clean = (value, max) => String(value ?? '').replace(/\u0000/g, '').trim().slice(0, max);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(value);
const validPhone = (value) => !value || /^[0-9+().\s-]{3,30}$/u.test(value);

const sameOrigin = (request) => {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
};

const hashValue = async (value) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const getRateState = async (request) => {
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip || !globalThis.caches?.default) return { limited: false, key: null };
  try {
    const token = await hashValue(ip);
    const url = new URL(request.url);
    const key = new Request(`${url.origin}/__rate/contact/${token}`, { method: 'GET' });
    const existing = await caches.default.match(key);
    return { limited: Boolean(existing), key };
  } catch {
    return { limited: false, key: null };
  }
};

const markRate = async (key) => {
  if (!key || !globalThis.caches?.default) return;
  try {
    await caches.default.put(key, new Response('1', {
      headers: { 'Cache-Control': `public, max-age=${RATE_LIMIT_SECONDS}` }
    }));
  } catch {
    // Delivery must not depend on cache availability.
  }
};

const graphConfig = (env) => {
  const tenantId = clean(env.M365_TENANT_ID, 100);
  const clientId = clean(env.M365_CLIENT_ID, 100);
  const clientSecret = clean(env.M365_CLIENT_SECRET, 1200);
  const mailbox = clean(env.CONTACT_MAILBOX, 160).toLowerCase();
  const recipient = clean(env.CONTACT_TO || mailbox, 160).toLowerCase();
  if (!tenantId || !clientId || !clientSecret || !validEmail(mailbox) || !validEmail(recipient)) return null;
  return { tenantId, clientId, clientSecret, mailbox, recipient };
};

const getAccessToken = async (config) => {
  if (cachedAccessToken && Date.now() < cachedAccessTokenExpiresAt - TOKEN_SKEW_MS) return cachedAccessToken;

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.access_token) return null;

  const expiresIn = Number(result.expires_in || 3600);
  cachedAccessToken = String(result.access_token);
  cachedAccessTokenExpiresAt = Date.now() + Math.max(300, Math.min(expiresIn, 3600)) * 1000;
  return cachedAccessToken;
};

const sendMessage = async (config, token, message) => {
  const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.mailbox)}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject: message.subject,
        body: { contentType: 'Text', content: message.text },
        toRecipients: [{ emailAddress: { address: config.recipient } }],
        replyTo: [{ emailAddress: { name: message.customerName, address: message.customerEmail } }]
      },
      saveToSentItems: true
    })
  });
  return response.ok;
};

export async function onRequestPost({ request, env, waitUntil }) {
  if (!sameOrigin(request)) return json({ ok: false, code: 'origin' }, 403);
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) return json({ ok: false, code: 'content_type' }, 415);

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > MAX_BODY_CHARS) return json({ ok: false, code: 'too_large' }, 413);

  const raw = await request.text().catch(() => '');
  if (!raw || raw.length > MAX_BODY_CHARS) return json({ ok: false, code: 'invalid_body' }, 400);

  let payload;
  try { payload = JSON.parse(raw); }
  catch { return json({ ok: false, code: 'invalid_json' }, 400); }

  const navn = clean(payload.navn, 80);
  const telefon = clean(payload.telefon, 30);
  const email = clean(payload.email, 120).toLowerCase();
  const ydelse = clean(payload.ydelse, 100);
  const besked = clean(payload.besked, 2500);
  const honeypot = clean(payload.website, 200);
  const startedAt = Number(payload.startedAt || 0);
  const samtykke = payload.samtykke === true;

  if (honeypot) return json({ ok: true });
  if (!navn || !email || !ydelse || !besked || !samtykke) return json({ ok: false, code: 'required' }, 400);
  if (!validEmail(email) || !validPhone(telefon) || !ALLOWED_SERVICES.has(ydelse)) return json({ ok: false, code: 'invalid' }, 400);
  if (startedAt && Date.now() - startedAt < 700) return json({ ok: false, code: 'too_fast' }, 400);

  const rate = await getRateState(request);
  if (rate.limited) return json({ ok: false, code: 'rate_limited' }, 429, { 'Retry-After': String(RATE_LIMIT_SECONDS) });

  const config = graphConfig(env);
  if (!config) return json({ ok: false, code: 'not_configured' }, 503);

  const token = await getAccessToken(config).catch(() => null);
  if (!token) return json({ ok: false, code: 'delivery_unavailable' }, 502);

  const text = [
    'Ny forespørgsel fra Esbjerg Shine', '',
    `Navn: ${navn}`,
    `Telefon: ${telefon || 'Ikke oplyst'}`,
    `E-mail: ${email}`,
    `Ydelse: ${ydelse}`, '',
    'Besked:', besked, '',
    `Modtaget: ${new Date().toISOString()}`
  ].join('\n');

  const sent = await sendMessage(config, token, {
    subject: `Forespørgsel – ${ydelse}`,
    text,
    customerName: navn,
    customerEmail: email
  }).catch(() => false);
  if (!sent) return json({ ok: false, code: 'delivery_failed' }, 502);

  waitUntil(markRate(rate.key));
  return json({ ok: true });
}

export function onRequestGet() {
  return json({ ok: false, code: 'method_not_allowed' }, 405, { Allow: 'POST' });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: { Allow: 'POST' } });
}
