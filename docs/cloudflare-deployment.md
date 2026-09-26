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
npx wrangler secret put M365_TENANT_ID
npx wrangler secret put M365_CLIENT_ID
npx wrangler secret put M365_CLIENT_SECRET
npx wrangler secret put CONTACT_MAILBOX
npx wrangler secret put CONTACT_TO
```

For local development, copy `.dev.vars.example` to `.dev.vars` and fill the values locally.

## Required GitHub Actions secrets

The deployment workflow needs only:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Use a least-privilege Cloudflare API token that can deploy this Worker and manage its configured custom domain.

## One-time Cloudflare zone settings

Before production launch:

1. Keep the apex domain `esbjergshine.dk` on the Worker custom domain configured by `wrangler.jsonc`.
2. Create a Cloudflare Redirect Rule from `https://www.esbjergshine.dk/*` to `https://esbjergshine.dk/${1}` with HTTP 301. Do not serve both hosts as independent canonical sites.
3. Set SSL/TLS mode to **Full (strict)**.
4. Enable **Always Use HTTPS** and TLS 1.3.
5. Enable DNSSEC after DNS is confirmed correct.
6. Confirm mail DNS (MX/SPF/DKIM/DMARC) before enabling the contact form in production.

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

The deployment workflow rechecks dependency security, types, build output and Wrangler configuration before publishing the validated commit.

## Rollback

List recent deployments/versions in Cloudflare, then use:

```sh
npm run cf:rollback
```

Wrangler will create a new deployment pointing back to the selected previous Worker version.
