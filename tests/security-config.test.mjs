import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const headers = fs.readFileSync('public/_headers', 'utf8');
const wrangler = JSON.parse(fs.readFileSync('wrangler.jsonc', 'utf8'));
const gitignore = fs.readFileSync('.gitignore', 'utf8');

test('global security headers remain strict', () => {
  for (const required of [
    'X-Content-Type-Options: nosniff',
    'X-Frame-Options: DENY',
    'Referrer-Policy: strict-origin-when-cross-origin',
    'Cross-Origin-Opener-Policy: same-origin',
    'Cross-Origin-Resource-Policy: same-origin',
    'Strict-Transport-Security: max-age=31536000',
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "worker-src 'none'",
    'upgrade-insecure-requests'
  ]) {
    assert.ok(headers.includes(required), `Missing security directive: ${required}`);
  }
  assert.doesNotMatch(headers, /script-src[^\n]*'unsafe-inline'/i);
  assert.doesNotMatch(headers, /Access-Control-Allow-Origin:\s*\*/i);
});

test('third-party CSP access is limited to services actually used', () => {
  const csp = headers.match(/Content-Security-Policy:\s*([^\n]+)/i)?.[1] ?? '';
  assert.match(csp, /script-src 'self' https:\/\/challenges\.cloudflare\.com/);
  assert.match(csp, /connect-src 'self' https:\/\/challenges\.cloudflare\.com/);
  assert.match(
    csp,
    /frame-src https:\/\/www\.google\.com https:\/\/maps\.google\.com https:\/\/challenges\.cloudflare\.com/
  );
  for (const unexpected of ['googletagmanager.com', 'google-analytics.com', 'facebook.net', 'doubleclick.net']) {
    assert.ok(!csp.includes(unexpected), `Unexpected tracking domain in CSP: ${unexpected}`);
  }
});

test('Cloudflare Worker production routing remains locked down', () => {
  assert.equal(wrangler.workers_dev, false);
  assert.equal(wrangler.preview_urls, false);
  assert.deepEqual(wrangler.routes, [{ pattern: 'esbjergshine.dk', custom_domain: true }]);
  assert.equal(wrangler.assets?.binding, 'ASSETS');
  assert.equal(wrangler.assets?.not_found_handling, '404-page');
  assert.equal(wrangler.assets?.html_handling, 'force-trailing-slash');
  assert.deepEqual(wrangler.assets?.run_worker_first, ['/api/*']);
  assert.equal(wrangler.vars?.APP_ENV, 'production');
  assert.equal(wrangler.vars?.APP_HOSTNAME, 'esbjergshine.dk');
});

test('contact rate limit binding remains configured', () => {
  const limiter = wrangler.ratelimits?.find((entry) => entry.name === 'CONTACT_RATE_LIMITER');
  assert.ok(limiter, 'Missing CONTACT_RATE_LIMITER binding');
  assert.equal(limiter.simple?.limit, 5);
  assert.equal(limiter.simple?.period, 60);
});

test('local secret files stay ignored', () => {
  assert.match(gitignore, /^\.env$/m);
  assert.match(gitignore, /^\.env\.\*$/m);
  assert.match(gitignore, /^\.dev\.vars$/m);
  assert.match(gitignore, /^\.dev\.vars\.\*$/m);
  assert.match(gitignore, /^\.wrangler\/$/m);
});
