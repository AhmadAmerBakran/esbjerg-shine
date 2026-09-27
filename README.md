# Esbjerg Shine

Performance-first website for **Esbjerg Shine** (CVR 46241479), a Danish bilplejevirksomhed in Esbjerg.

## Stack

- Astro 7 with fully static output
- Plain CSS and small vanilla JavaScript enhancements
- Cloudflare Workers + Static Assets
- Worker-backed contact endpoint at `/api/contact`
- Danish metadata, canonical URLs, sitemap, robots.txt and structured data
- GitHub Actions quality gate with Lighthouse checks

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
SITE_URL=https://esbjergshine.dk npm run build
```

Cloudflare validation:

```bash
npm run cf:dry-run
```

## Services

The public service list is defined in `src/data/services.ts` and currently contains:

- Håndvask og udvendig bilpleje
- Indvendig bilpleje
- Komplet klargøring
- Polering
- Motorvask
- Sæde- og tekstilrens

Service pages are generated from the same data source, so titles, descriptions and navigation remain consistent.

## Media structure

Website media lives in `public/media/`.

```text
public/media/
├── brand/
│   └── esbjerg-shine-logo.webp
├── home/
│   ├── hero-background.webp
│   └── hero-poster.webp
├── video/
│   ├── hero-detailing.webm
│   └── hero-detailing.mp4
├── services/
│   ├── bilvask/
│   │   ├── card.webp
│   │   └── detail.webp
│   ├── indvendig-bilpleje/
│   │   ├── card.webp
│   │   └── detail.webp
│   ├── komplet-klargoering/
│   │   ├── card.webp
│   │   └── detail.webp
│   ├── polering/
│   │   ├── card.webp
│   │   └── detail.webp
│   ├── motorvask/
│   │   ├── card.webp
│   │   └── detail.webp
│   └── saederens/
│       ├── card.webp
│       └── detail.webp
├── before-after/
│   ├── 01-polering-before.webp
│   ├── 01-polering-after.webp
│   ├── 02-indvendig-before.webp
│   ├── 02-indvendig-after.webp
│   ├── 03-saederens-before.webp
│   ├── 03-saederens-after.webp
│   ├── 04-bilvask-before.webp
│   ├── 04-bilvask-after.webp
│   ├── 05-klargoering-before.webp
│   ├── 05-klargoering-after.webp
│   ├── 06-motorvask-before.webp
│   └── 06-motorvask-after.webp
├── about/
│   └── esbjerg-shine-work.webp
├── location/
│   └── esbjerg-shine-location.webp
└── social/
    └── esbjerg-shine-og.jpg
```

## Asset budgets

The CI quality gate rejects oversized public assets:

- Non-video files: maximum 1.2 MB each
- Video files under `public/media/video/`: maximum 4 MB each

## Contact form

The production Worker uses Cloudflare Turnstile, a rate-limit binding and Microsoft Graph. Runtime secrets are configured outside Git and documented in `docs/cloudflare-deployment.md`.

## SEO and local business data

The site uses the verified business details from `src/data/company.ts`, including:

- Esbjerg Shine
- CVR 46241479
- +45 91 81 89 90
- Randersvej 26, 6700 Esbjerg
- Åbningstider efter aftale

The site intentionally avoids thin location pages. Service pages use individual Danish titles, descriptions and structured data.

## Quality targets

GitHub Actions builds the site and runs Lighthouse on mobile and desktop. Current floors are:

- Performance: 95+
- Accessibility: 98+
- Best Practices: 95+
- SEO: 100

After launch, monitor real-user LCP, INP and CLS in addition to synthetic Lighthouse checks.
