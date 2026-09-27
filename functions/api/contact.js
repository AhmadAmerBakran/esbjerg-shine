const ALLOWED_SERVICES = new Set([
  'Håndvask og udvendig bilpleje',
  'Indvendig bilpleje',
  'Komplet klargøring',
  'Polering',
  'Motorvask',
  'Sæde- og tekstilrens',
  'Andet'
]);

const MAX_BODY_BYTES = 12_000;
const TURNSTILE_MAX_CHARS = 2_048;
const TURNSTILE_ACTION = 'contact';
const FETCH_TIMEOUT_MS = 8_000;
const RATE_LIMIT_SECONDS = 60;
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

const fetchWithTimeout = async (input, init = {}, timeoutMs = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const sameOrigin = (request, env) => {
  const origin = request.headers.get('Origin');
  if (!origin) return false;

  try {
    const requestUrl = new URL(request.url);
    const originUrl = new URL(origin);
    if (originUrl.origin !== requestUrl.origin) return false;

    const expectedHostname = clean(env.APP_HOSTNAME, 253).toLowerCase();
    if (env.APP_ENV === 'production' && expectedHostname && requestUrl.hostname.toLowerCase() !== expectedHostname) return false;

    const fetchSite = request.headers.get('Sec-Fetch-Site');
    return !fetchSite || fetchSite === 'same-origin';
  } catch {
    return false;
  }
};

const hashValue = async (value) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const checkRateLimit = async (request, env, email) => {
  if (!env.CONTACT_RATE_LIMITER?.limit) return { available: false, limited: false };
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return { available: env.APP_ENV !== 'production', limited: false };

  try {
    const ipKey = `ip:${await hashValue(ip)}`;
    const emailKey = `email:${await hashValue(email)}`;
    const [ipResult, emailResult] = await Promise.all([
      env.CONTACT_RATE_LIMITER.limit({ key: ipKey }),
      env.CONTACT_RATE_LIMITER.limit({ key: emailKey })
    ]);
    return { available: true, limited: !ipResult.success || !emailResult.success };
  } catch {
    return { available: false, limited: false };
  }
};

const verifyTurnstile = async (request, env, token) => {
  const secret = clean(env.TURNSTILE_SECRET_KEY, 2_048);
  if (!secret || !token || token.length > TURNSTILE_MAX_CHARS) return false;

  const body = new URLSearchParams({
    secret,
    response: token,
    idempotency_key: crypto.randomUUID()
  });
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) body.set('remoteip', ip);

  const response = await fetchWithTimeout('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) return false;
  if (result.action !== TURNSTILE_ACTION) return false;

  const expectedHostname = clean(env.APP_HOSTNAME, 253).toLowerCase();
  if (expectedHostname && String(result.hostname || '').toLowerCase() !== expectedHostname) return false;
  return true;
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

  const response = await fetchWithTimeout(`https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`, {
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
  const response = await fetchWithTimeout(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.mailbox)}/sendMail`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
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
  if (!sameOrigin(request, env)) return json({ ok: false, code: 'origin' }, 403);

  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) return json({ ok: false, code: 'content_type' }, 415);

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return json({ ok: false, code: 'too_large' }, 413);

  const raw = await request.text().catch(() => '');
  if (!raw || new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ ok: false, code: 'invalid_body' }, 400);

  let payload;
  try { payload = JSON.parse(raw); }
  catch { return json({ ok: false, code: 'invalid_json' }, 400); }

  const navn = clean(payload.navn, 80);
  const telefon = clean(payload.telefon, 30);
  const email = clean(payload.email, 120).toLowerCase();
  const ydelse = clean(payload.ydelse, 100);
  const besked = clean(payload.besked, 2500);
  const honeypot = clean(payload.website, 200);
  const turnstileToken = clean(payload.turnstileToken, TURNSTILE_MAX_CHARS);
  const startedAt = Number(payload.startedAt || 0);
  const samtykke = payload.samtykke === true;

  if (honeypot) return json({ ok: true });
  if (!navn || !email || !ydelse || !besked || !samtykke) return json({ ok: false, code: 'required' }, 400);
  if (!validEmail(email) || !validPhone(telefon) || !ALLOWED_SERVICES.has(ydelse)) return json({ ok: false, code: 'invalid' }, 400);
  if (startedAt && Date.now() - startedAt < 700) return json({ ok: false, code: 'too_fast' }, 400);

  const rate = await checkRateLimit(request, env, email);
  if (!rate.available) return json({ ok: false, code: 'security_unavailable' }, 503);
  if (rate.limited) return json({ ok: false, code: 'rate_limited' }, 429, { 'Retry-After': String(RATE_LIMIT_SECONDS) });

  const turnstileValid = await verifyTurnstile(request, env, turnstileToken).catch(() => false);
  if (!turnstileValid) return json({ ok: false, code: 'turnstile' }, 403);

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

  return json({ ok: true });
}

export function onRequestGet() {
  return json({ ok: false, code: 'method_not_allowed' }, 405, { Allow: 'POST' });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: { Allow: 'POST' } });
}
