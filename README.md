# Esbjerg Shine

Production website for **Esbjerg Shine** (CVR 46241479), a bilplejevirksomhed in Esbjerg. The public site is Danish and built for performance, accessibility, local SEO and a small attack surface.

## Stack

- Astro 7 with fully static output
- Plain CSS and small vanilla JavaScript enhancements
- Cloudflare Workers + Static Assets
- Worker-backed contact endpoint at `/api/contact`
- Cloudflare Turnstile and Worker rate limiting
- Microsoft Graph / Exchange Online mail delivery
- GitHub Actions quality gate with Lighthouse checks

## Source of truth

Keep business and service information centralized:

- `src/data/company.ts` — company name, CVR, phone, `info@esbjergshine.dk`, address, maps and social links
- `src/data/services.ts` — public services and their Danish content/SEO metadata
- `src/data/media.ts` — media paths used by the site

The contact backend imports the company email and service titles from those same sources. Do not duplicate them in Worker configuration.

## Local development

Use the pinned Node/npm versions from `.node-version` / `packageManager`.

```bash
npm ci
npm run dev
```

Useful checks:

```bash
npm run check
npm run lint
npm run format:check
npm audit --audit-level=low
npm run build
npm run test:predeploy
npm run cf:dry-run
```

`astro check` validates Astro/TypeScript. ESLint covers runtime JavaScript and the permanent test suite. Prettier keeps supported JavaScript/TypeScript/config/test files consistent.

## Pre-deployment tests

After `npm run build`, `npm run test:predeploy` checks the parts that can be verified without a live domain or production credentials:

- contact API validation, Turnstile handling, rate limiting, Graph success/failure mapping and duplicate-submit protection
- security headers, CSP and Cloudflare production configuration
- generated pages, canonical URLs, sitemap, robots.txt, internal links, fragments, IDs and image alt attributes
- the custom 404 page and `/api/*` routing through a real local Wrangler runtime

Real DNS/TLS, the production Turnstile keys, Cloudflare account rules and actual delivery through `info@esbjergshine.dk` are verified only after deployment.

## Contact form

The production form is handled by `/api/contact` and uses Turnstile, application-level rate limiting, duplicate-submission receipts, request timeouts and Microsoft Graph. If mail infrastructure is unavailable, the page offers a user-initiated pre-filled email fallback to `info@esbjergshine.dk`.

Secrets are never committed. Production setup is documented in `docs/cloudflare-deployment.md`.

## Media

Media lives in `public/media/`. Service media follows:

```text
public/media/services/<service-slug>/card.webp
public/media/services/<service-slug>/detail.webp
```

Media paths are centralized in `src/data/media.ts`. CI limits non-video public assets to 1.2 MB each and video files under `public/media/video/` to 4 MB each.

## Quality gate

The permanent quality gate runs dependency audit, Astro checks, JavaScript linting, formatting checks, the pre-deployment regression suite, build/Cloudflare validation and Lighthouse. Current homepage Lighthouse floors are Performance 95+ using the median of three mobile runs, Accessibility 100, Best Practices 95+ and SEO 100.
