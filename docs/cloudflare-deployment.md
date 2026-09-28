# Cloudflare deployment

## Architecture

- Platform: Cloudflare Workers + Static Assets
- Final production domain: `https://esbjergshine.dk`
- Temporary production host: the `esbjerg-shine` Worker on the account's `workers.dev` subdomain
- Static build output: `dist/`
- Worker entry point: `worker/index.js`
- Worker-first routes: `/api/*` only
- Preview URLs stay disabled.

Two Wrangler configs are intentionally kept:

- `wrangler.workers-dev.jsonc` is the current temporary production target. It enables the normal `workers.dev` Worker URL and does not claim the final domain.
- `wrangler.jsonc` is the final custom-domain production config. It disables `workers.dev` and routes the same Worker to `esbjergshine.dk`.

Both configs use the same Worker name, `esbjerg-shine`, so the later domain launch is a routing/configuration switch rather than a new application deployment.

## Current temporary production deployment

Until the domain, Microsoft 365 mailbox and production Turnstile widget are ready, deployments from `master` publish with `wrangler.workers-dev.jsonc`.

Required GitHub Actions secrets for this stage:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

`PUBLIC_TURNSTILE_SITE_KEY` is optional during this temporary stage. If it is absent, the contact form does not submit to the API and instead offers the existing pre-filled `mailto:` fallback. It never reports a successful Graph delivery when Graph/Turnstile are not configured.

The temporary production deploy commands are:

```sh
npm run cf:workers-dev:dry-run
npm run cf:workers-dev:deploy
```

## Final production runtime secrets

Before the custom-domain launch, set these on the `esbjerg-shine` Worker. Never commit their values:

```sh
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put M365_TENANT_ID
npx wrangler secret put M365_CLIENT_ID
npx wrangler secret put M365_CLIENT_SECRET
```

The public mailbox address comes from `src/data/company.ts` and is currently `info@esbjergshine.dk`. The Microsoft tenant/client credentials and Turnstile secret remain runtime secrets.

For local development, copy `.dev.vars.example` to `.dev.vars` and `.env.example` to `.env`. Cloudflare's official Turnstile test sitekey/secret may be used locally; never use test credentials for the final custom-domain production launch.

## Final GitHub Actions configuration

Keep the existing Cloudflare deployment secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Add this repository variable before the final custom-domain launch:

- `PUBLIC_TURNSTILE_SITE_KEY`

Use a least-privilege Cloudflare API token that can deploy this Worker. When the custom domain is enabled, it must also have the permissions required to manage the configured Worker custom domain.

## Turnstile

For the final domain, create one **Managed** Turnstile widget for the contact form and restrict its production hostname to:

- `esbjergshine.dk`

Store the public sitekey as the GitHub repository variable `PUBLIC_TURNSTILE_SITE_KEY` and the private secret as the Worker secret `TURNSTILE_SECRET_KEY`.

The backend validates every token with Cloudflare Siteverify, requires action `contact`, verifies the configured production hostname, and fails closed if the security configuration is unavailable.

## Contact rate limiting and reliability

Both Wrangler production configs contain the `CONTACT_RATE_LIMITER` binding. The contact endpoint is limited to five attempts per 60 seconds per hashed IP and per hashed email address before any Microsoft Graph call is made.

Successful submissions also receive a browser-generated submission ID. The Worker keeps a short-lived, non-PII receipt for successful submissions so an accidental repeat of the same request can return success without sending a second email. The application does not automatically retry Microsoft Graph delivery because a network timeout can be ambiguous after an email has already been accepted.

If direct delivery is unavailable, the form keeps the user's entered information and offers an explicit pre-filled email fallback to `info@esbjergshine.dk`. It does not automatically launch the visitor's mail application. With JavaScript disabled, the page still exposes the direct email address.

Worker diagnostics only log an event name, a random request reference and an HTTP status where useful. Names, email addresses, phone numbers, IP addresses, message text, secrets and access tokens must never be logged.

For additional edge protection at final launch, add a Cloudflare WAF rate-limiting rule for `POST /api/contact` and keep the Worker limit as the application-level backstop.

## Microsoft 365 least privilege

The production mailbox will be `info@esbjergshine.dk` once Exchange Online is provisioned. The contact Worker only needs to send email. Use Exchange Online **RBAC for Applications** to scope the app to that dedicated mailbox and assign only `Application Mail.Send` for that scope. Avoid an additional unscoped Microsoft Entra `Mail.Send` application grant if RBAC is being used to restrict the mailbox.

Rotate the client secret periodically and immediately if it is ever exposed. Never log the client secret, access token, contact message body, or Turnstile secret.

## Final custom-domain switch

When `esbjergshine.dk` is ready:

1. Add/activate the domain in Cloudflare.
2. Create `info@esbjergshine.dk` and verify MX/SPF/DKIM/DMARC.
3. Configure Microsoft Graph and the real Turnstile widget/secrets.
4. Add `PUBLIC_TURNSTILE_SITE_KEY` in GitHub Actions variables.
5. Change the deployment workflow from `cf:workers-dev:*` back to `cf:*`, which uses `wrangler.jsonc`.
6. Keep the apex domain `esbjergshine.dk` on the Worker custom domain.
7. Redirect `www.esbjergshine.dk` permanently to the apex hostname.
8. Set SSL/TLS to **Full (strict)**, enable Always Use HTTPS/TLS 1.3, then enable DNSSEC once DNS is confirmed.

The final config already has `workers_dev: false`, so the temporary Worker URL can be disabled as part of that deployment.

## Local validation

```sh
npm ci
npm run check
npm audit --audit-level=low
npm run build
npm run test:predeploy
npm run cf:workers-dev:dry-run
```

## Production deployment

`.github/workflows/deploy-cloudflare.yml` deploys only after the `Website quality gate` succeeds for `master`.

During the temporary stage it publishes to `workers.dev`. After the final domain switch it should be changed back to the custom-domain commands documented above.

## Rollback

List recent deployments/versions in Cloudflare, then use:

```sh
npm run cf:rollback
```

Wrangler will create a new deployment pointing back to the selected previous Worker version.
