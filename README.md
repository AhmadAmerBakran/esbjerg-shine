# Esbjerg Shine

Performance-first Danish website for **Esbjerg Shine** (CVR 46241479), bilpleje/detailing in Esbjerg.

## Direction

The site is deliberately built differently from the earlier DME Murer project: Astro generates the repetitive page structure, production assets receive build hashes, service pages come from one data source, and the browser receives only a very small progressive-enhancement script. There are no third-party fonts, trackers, UI frameworks or runtime CDN dependencies.

The visual direction is a clean detailing-studio aesthetic: cool graphite, deep neutral blacks, glassy slate surfaces and restrained liquid-silver highlights. Avoid warm brown/beige tones that can read as dusty, and avoid sudden white sections. The public website must stay customer-facing: no implementation notes, upload instructions, placeholder guidance or developer copy should appear inside visual areas or sections.

## Stack

- Astro 7, fully static output
- plain CSS and a small vanilla JavaScript enhancement file
- Cloudflare Pages-compatible `_headers` and `_routes.json`
- Cloudflare Pages Function for the contact endpoint
- Danish metadata, canonical URLs, sitemap, robots.txt, `AutoWash`/LocalBusiness-compatible structured data and individual service pages
- GitHub Actions build + Lighthouse quality gate

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
SITE_URL=https://example.dk npm run build
```

The fallback site URL in development is currently `https://esbjergshine.dk`. **Confirm the production domain before launch** and set `SITE_URL` in the build environment.

## Media plan

Customer-facing pages should never contain notes such as “project photo comes later”, “upload image here” or technical explanations. Temporary visual areas should remain purely decorative until the real media is available.

Recommended structure:

```text
src/assets/images/
├── home/
│   ├── hero.jpg
│   └── about.jpg
├── services/
│   ├── bilvask/
│   ├── indvendig-bilpleje/
│   ├── komplet-klargoering/
│   ├── polering/
│   ├── lakbeskyttelse/
│   └── saederens/
└── before-after/

public/media/
├── brand/
│   └── esbjerg-shine-logo.webp
├── og/
│   └── esbjerg-shine-og.jpg
└── video/
    ├── hero.webm
    └── hero.mp4
```

Recommended source sizes and crops:

- Hero photo: 1600 × 2000 px, 4:5
- Service card photo: 1600 × 1000 px, 8:5
- Service detail photo: 1920 × 1080 px, 16:9
- Before/after pair: 1600 × 1200 px, 4:3, identical framing for both images
- About photo: 1200 × 1600 px, 3:4
- Open Graph image: 1200 × 630 px
- Logo: original SVG/vector preferred when available

Photography should normally be kept as a high-quality JPEG source in `src/assets/images/` and rendered by Astro as responsive AVIF/WebP/JPEG variants. Video should be short, muted, loop-friendly and supplied as WebM with MP4 fallback. Avoid GIF.

The currently integrated logo is an optimized WebP derived from the supplied raster image. Replace it with the original vector artwork later if the designer can provide it.

## Contact form

The form UI is ready. The Pages Function is provisioned for a Microsoft 365 / Microsoft Graph mailbox using these production secrets:

- `M365_TENANT_ID`
- `M365_CLIENT_ID`
- `M365_CLIENT_SECRET`
- `CONTACT_MAILBOX`
- `CONTACT_TO`

This mail transport is intentionally not treated as final until Esbjerg Shine's actual business email/provider is confirmed. If the company uses another provider, replace the delivery adapter rather than weakening the form security.

The endpoint already includes same-origin enforcement, server-side validation, an allowlist, honeypot, request-size limits and short IP-hash throttling. It does not log form content.

## Information still needed before production

1. Final production domain.
2. Business email address and email provider.
3. Real before/after photo pairs and service/project photos.
4. Original logo SVG/vector file, if available.
5. Confirmation that the initial service list matches what Esbjerg Shine actually offers.
6. Optional real customer reviews, with permission to publish them.

## SEO / local search

The current information is consistently represented as:

- Esbjerg Shine
- Enkeltmandsvirksomhed
- CVR 46241479
- +45 91 81 89 90
- Randersvej 26, 6700 Esbjerg
- Åbningstider efter aftale

The website uses the physical address in visible content and structured data for local relevance. We intentionally do **not** generate dozens of thin city pages. Search Console, Google Business Profile consistency and real project content will matter more than doorway-style pages.

## Performance target

GitHub Actions builds the site and runs Lighthouse on mobile and desktop. The initial floor is:

- Performance: 95+
- Accessibility: 98+
- Best Practices: 95+
- SEO: 100

Those are lab gates, not a substitute for field Core Web Vitals. After launch, monitor real-user LCP, INP and CLS and keep the 75th percentile in the good range.
