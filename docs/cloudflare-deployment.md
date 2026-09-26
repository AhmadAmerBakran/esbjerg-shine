# Cloudflare deployment

## Architecture

- Platform: Cloudflare Workers + Static Assets
- Production domain: `https://esbjergshine.dk`
- Static build output: `dist/`
- Worker entry point: `worker/index.js`
- Worker-first routes: `/api/*` only
- `workers.dev` and Version/Preview URLs are disabled in production config.

## Required Cloudflare runtime secrets

Set these on the `esbjerg-shine` Worker. Never commit their values:

```sh
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put M365_TENANT_ID
npx wrangler secret put M365_CLIENT_ID
npx wrangler secret put M365_CLIENT_SECRET
npx wrangler secret put CONTACT_MAILBOX
npx wrangler secret put CONTACT_TO
```

For local development, copy `.dev.vars.example` to `.dev.vars` and `.env.example` to `.env`. Cloudflare's official Turnstile test sitekey/secret may be used locally; never use test credentials in production.

## Required GitHub Actions configuration

Secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Repository variable:

- `PUBLIC_TURNSTILE_SITE_KEY`

The production workflow refuses to deploy when the Turnstile sitekey variable is missing. Use a least-privilege Cloudflare API token that can deploy this Worker and manage its configured custom domain.

## Turnstile

Create one **Managed** Turnstile widget for the contact form and restrict its production hostname to:

- `esbjergshine.dk`

Store the public sitekey as the GitHub repository variable `PUBLIC_TURNSTILE_SITE_KEY` and the private secret as the Worker secret `TURNSTILE_SECRET_KEY`.

The backend validates every token with Cloudflare Siteverify, requires action `contact`, verifies the production hostname, and fails closed if the security configuration is unavailable.

## Contact rate limiting

`wrangler.jsonc` contains the `CONTACT_RATE_LIMITER` binding. The contact endpoint is limited to five attempts per 60 seconds per hashed IP and per hashed email address before any Microsoft Graph call is made.

For additional edge protection, add a Cloudflare WAF rate-limiting rule for `POST /api/contact` and start with a Managed Challenge for obvious bursts. Keep the Worker limit as the application-level backstop.

## Microsoft 365 least privilege

The contact Worker only needs to send email. Use Exchange Online **RBAC for Applications** to scope the app to the dedicated contact mailbox and assign only `Application Mail.Send` for that scope. Avoid an additional unscoped Microsoft Entra `Mail.Send` application grant if RBAC is being used to restrict the mailbox, because an unscoped grant would defeat the resource restriction.

Rotate the client secret periodically and immediately if it is ever exposed. Never log the client secret, access token, contact message body, or Turnstile secret.

## One-time Cloudflare zone settings

Before production launch:

1. Keep the apex domain `esbjergshine.dk` on the Worker custom domain configured by `wrangler.jsonc`.
2. Create a Cloudflare Redirect Rule from `https://www.esbjergshine.dk/*` to `https://esbjergshine.dk/${1}` with HTTP 301. Do not serve both hosts as independent canonical sites.
3. Set SSL/TLS mode to **Full (strict)**.
4. Enable **Always Use HTTPS** and TLS 1.3.
5. Enable DNSSEC after DNS is confirmed correct.
6. Enable the appropriate Cloudflare managed WAF rules available on the account and review false positives before tightening them.
7. Confirm mail DNS (MX/SPF/DKIM/DMARC) before enabling the contact form in production.

## Local validation

```sh
npm ci
npm run check
npm audit --audit-level=low
npm run build
npm run cf:dry-run
npm run cf:dev
```

## Production deployment

Production deployment is handled by `.github/workflows/deploy-cloudflare.yml` only after the `Website quality gate` succeeds for `master`.

The deployment workflow rechecks dependency security, types, the Turnstile sitekey, build output and Wrangler configuration before publishing the validated commit.

## Rollback

List recent deployments/versions in Cloudflare, then use:

```sh
npm run cf:rollback
```

Wrangler will create a new deployment pointing back to the selected previous Worker version.
