const ALLOWED_SERVICES = new Set([
  'Håndvask & udvendig bilpleje',
  'Indvendig bilpleje',
  'Komplet klargøring',
  'Polering',
  'Motorvask',
  'Sæde- & tekstilrens',
  'Andet'
]);

const MAX_BODY_BYTES = 12_000;
const RATE_LIMIT_SECONDS = 90;
const MIN_FORM_AGE_MS = 1_000;
const MAX_FORM_AGE_MS = 24 * 60 * 60 * 1_000;
const TOKEN_SKEW_MS = 60_000;
let cachedAccessToken = '';
let cachedAccessTokenExpiresAt = 0;

const API_SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
};

const json = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: {
    ...API_SECURITY_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders
  }
});

const cleanText = (value, max) => String(value ?? '').replace(/\u0000/g, '').trim().slice(0, max);
const cleanLine = (value, max) => cleanText(value, max).replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ');
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(value);
const validPhone = (value) => !value || /^[0-9+().\s-]{3,30}$/u.test(value);

const sameOrigin = (request) => {
  const origin = request.headers.get('Origin');
  if (!origin) return false;

  const fetchSite = request.headers.get('Sec-Fetch-Site');
  if (fetchSite && fetchSite !== 'same-origin') return false;

  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
};

const validFormTiming = (startedAt) => {
  if (!Number.isFinite(startedAt) || startedAt <= 0) return false;
  const age = Date.now() - startedAt;
  return age >= MIN_FORM_AGE_MS && age <= MAX_FORM_AGE_MS;
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
  const tenantId = cleanLine(env.M365_TENANT_ID, 100);
  const clientId = cleanLine(env.M365_CLIENT_ID, 100);
  const clientSecret = cleanText(env.M365_CLIENT_SECRET, 1200);
  const mailbox = cleanLine(env.CONTACT_MAILBOX, 160).toLowerCase();
  const recipient = cleanLine(env.CONTACT_TO || mailbox, 160).toLowerCase();
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

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!sameOrigin(request)) return json({ ok: false, code: 'origin' }, 403);

  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) return json({ ok: false, code: 'content_type' }, 415);

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return json({ ok: false, code: 'too_large' }, 413);

  const raw = await request.text().catch(() => '');
  if (!raw || raw.length > MAX_BODY_BYTES) return json({ ok: false, code: 'invalid_body' }, 400);

  let payload;
  try { payload = JSON.parse(raw); }
  catch { return json({ ok: false, code: 'invalid_json' }, 400); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return json({ ok: false, code: 'invalid_json' }, 400);

  const navn = cleanLine(payload.navn, 80);
  const telefon = cleanLine(payload.telefon, 30);
  const email = cleanLine(payload.email, 120).toLowerCase();
  const ydelse = cleanLine(payload.ydelse, 100);
  const besked = cleanText(payload.besked, 2500);
  const honeypot = cleanText(payload.website, 200);
  const startedAt = Number(payload.startedAt);
  const samtykke = payload.samtykke === true;

  if (honeypot) return json({ ok: true });
  if (!navn || !email || !ydelse || !besked || !samtykke) return json({ ok: false, code: 'required' }, 400);
  if (!validEmail(email) || !validPhone(telefon) || !ALLOWED_SERVICES.has(ydelse)) return json({ ok: false, code: 'invalid' }, 400);
  if (!validFormTiming(startedAt)) return json({ ok: false, code: 'invalid_timing' }, 400);

  const rate = await getRateState(request);
  if (rate.limited) return json({ ok: false, code: 'rate_limited' }, 429, { 'Retry-After': String(RATE_LIMIT_SECONDS) });

  const config = graphConfig(env);
  if (!config) return json({ ok: false, code: 'not_configured' }, 503);

  const token = await getAccessToken(config).catch(() => null);
  if (!token) return json({ ok: false, code: 'delivery_unavailable' }, 502);

  // Reserve the short rate-limit window before the external send to reduce
  // duplicate submissions and concurrent abuse. Cache failures stay non-fatal.
  await markRate(rate.key);

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

  return json({ ok: true });
}

export function onRequestGet() {
  return json({ ok: false, code: 'method_not_allowed' }, 405, { Allow: 'POST' });
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: { ...API_SECURITY_HEADERS, Allow: 'POST' }
  });
}
