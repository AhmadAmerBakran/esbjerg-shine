# Esbjerg Shine

Performance-first Danish website for **Esbjerg Shine** (CVR 46241479), built for a Cloudflare Pages deployment with a very small attack surface and no client-side framework runtime.

## Stack

- Astro 7, fully static output
- Manrope Variable, self-hosted through the project dependency
- Plain CSS and small vanilla JavaScript enhancements
- Cloudflare Pages-compatible `_headers` and `_routes.json`
- Cloudflare Pages Function for `/api/contact`
- Microsoft 365 / Microsoft Graph mail delivery
- Danish metadata, canonical URLs, structured data, `robots.txt` and `sitemap.xml`
- GitHub Actions quality gate with dependency audit and Lighthouse checks
- Build-time media optimization for the deployment output

## Local development

Requires Node.js 22.12 or newer.

```bash
npm ci
npm run dev
```

Production build:

```bash
SITE_URL=https://esbjergshine.dk npm run build
```

`npm run build` creates `dist/` and then optimizes raster media in the deployment output. Source photographs in `public/media/` remain untouched, so the repository keeps the original quality while Cloudflare receives lighter files.

Useful checks:

```bash
npm run check
npm run audit
```

## Services

The public service set is generated from `src/data/services.ts`:

- Håndvask & udvendig bilpleje
- Indvendig bilpleje
- Komplet klargøring
- Polering
- Motorvask
- Sæde- & tekstilrens

Service card/detail media follows the matching slug under `public/media/services/<slug>/`.

The before/after gallery uses:

```text
public/media/before-after/
├── 01-polering-before.webp
├── 01-polering-after.webp
├── 02-indvendig-before.webp
├── 02-indvendig-after.webp
├── 03-saederens-before.webp
├── 03-saederens-after.webp
├── 04-bilvask-before.webp
├── 04-bilvask-after.webp
├── 05-klargoering-before.webp
├── 05-klargoering-after.webp
├── 06-motorvask-before.webp
└── 06-motorvask-after.webp
```

## Performance strategy

The site deliberately avoids a UI framework and external runtime CDN dependencies. Images outside the critical hero are lazy-loaded, the Google map is click-to-load, and the heavier interaction script is deferred until interaction or later in the session. Hero video loading respects reduced-motion and data-saver preferences.

The production build optimizes copied WebP/JPEG media in `dist/media/` and strips unnecessary metadata. CI rejects production non-video media above 600 KB and video files above 4 MB.

Lighthouse quality floors in CI are:

- Performance: 95+
- Accessibility: 98+
- Best Practices: 95+
- SEO: 100

## Security baseline

Static responses use a restrictive Content Security Policy, HSTS, clickjacking protection, MIME sniffing protection, a restrictive Permissions Policy and same-origin isolation/resource policies where appropriate.

The contact endpoint adds its own security headers because Cloudflare Pages `_headers` rules apply to static asset responses, not Pages Function responses.

The form endpoint includes:

- same-origin and Fetch Metadata validation
- JSON/content-type and request-size checks
- strict server-side field validation and service allowlisting
- single-line sanitization for mail headers/identity fields
- a honeypot field
- minimum/maximum form-age checks
- short hashed-IP throttling using the Cloudflare cache
- no logging of submitted form content
- Microsoft Graph credentials read only from Cloudflare environment secrets

GitHub Actions are pinned to immutable commit SHAs. CI runs `npm audit --audit-level=moderate`, and Dependabot checks npm and GitHub Actions weekly.

## Cloudflare Pages deployment

Recommended project settings:

```text
Production branch: the approved production branch after review
Build command: npm run build
Build output directory: dist
Root directory: /
Node.js: 22.x (22.12+)
```

Set this production build variable:

```text
SITE_URL=https://esbjergshine.dk
```

The root `functions/` directory is intentionally outside `dist/`. Cloudflare Pages discovers it and deploys the Pages Function. `public/_routes.json` is copied to the build output and limits Function invocation to `/api/*`, leaving normal static requests on the static path.

### Contact-mail secrets

Configure these as production secrets/variables in Cloudflare Pages:

```text
M365_TENANT_ID
M365_CLIENT_ID
M365_CLIENT_SECRET
CONTACT_MAILBOX
CONTACT_TO
```

The Microsoft application only needs mail-sending capability for this workflow. When Exchange Online is configured, scope the application to the contact mailbox with **Exchange Online RBAC for Applications** rather than leaving an organization-wide `Mail.Send` grant effectively usable against every mailbox.

Do not place tenant IDs, client secrets or mailbox credentials in this repository.

## Launch checklist

Before connecting the production domain:

1. Confirm `esbjergshine.dk` is the canonical domain. Redirect `www.esbjergshine.dk` permanently to the apex domain (or reverse this everywhere if the business chooses `www`).
2. Keep Cloudflare SSL/TLS in a strict configuration and enforce HTTPS. HSTS is already emitted by the site, so only enable the final production hostname when HTTPS is stable.
3. Set the production `SITE_URL` exactly to the canonical HTTPS origin.
4. Configure Microsoft 365 mail delivery and the five Cloudflare secrets above.
5. Restrict the Microsoft application to the intended mailbox with Exchange Online RBAC for Applications.
6. Configure SPF, DKIM and DMARC for the production mail domain.
7. Run the GitHub quality workflow and require it to pass before merging/deploying.
8. Keep Cloudflare preview deployments out of search indexing or behind access controls; only the canonical production domain should be submitted to search engines.
9. After launch, submit `https://esbjergshine.dk/sitemap.xml` to Google Search Console and Bing Webmaster Tools and verify the canonical domain.
10. Test the live contact form, mobile navigation, click-to-load map, service pages, 404 response, `robots.txt`, `sitemap.xml`, canonical tags and structured data.

Cloudflare-level rate limiting/WAF rules can be added around `/api/contact` as a second layer if the endpoint receives meaningful bot traffic. Avoid adding CAPTCHA/Turnstile unless abuse justifies the extra dependency and privacy/UX cost.

## SEO and local search

The site consistently exposes:

- Esbjerg Shine
- Enkeltmandsvirksomhed
- CVR 46241479
- +45 91 81 89 90
- Randersvej 26, 6700 Esbjerg
- Åbningstider efter aftale

SEO implementation includes unique page titles/descriptions, canonical URLs, Danish language metadata, Open Graph/Twitter metadata, `AutomotiveBusiness` and `Service` structured data, breadcrumbs on service pages, `robots.txt`, and a sitemap covering all indexable public pages. The API is explicitly excluded from crawling.

The site intentionally avoids thin location pages and keyword stuffing. Local relevance comes from useful Danish service content, consistent business information and the real Esbjerg address.

## Privacy

The public privacy policy describes the current architecture: Cloudflare hosting, Microsoft 365 mail delivery, click-to-load Google Maps, no analytics/marketing pixels, and the handling of contact-form data. If analytics, advertising, extra embeds or a different mail provider are introduced later, review the privacy and consent setup before enabling them.
