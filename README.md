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
npm run cf:dry-run
```

`astro check` validates Astro/TypeScript. ESLint covers runtime JavaScript and Prettier keeps JavaScript/TypeScript/config files consistent.

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

The permanent quality gate runs dependency audit, Astro checks, JavaScript linting, formatting checks, build/Cloudflare validation and Lighthouse. Current Lighthouse floors are Performance 95+, Accessibility 100, Best Practices 95+ and SEO 100.
