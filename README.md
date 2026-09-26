# Esbjerg Shine

Performance-first Danish website for **Esbjerg Shine** (CVR 46241479), bilpleje/detailing in Esbjerg.

## Direction

The site is built with Astro and a very small progressive-enhancement script. Service pages come from one data source, production assets are cacheable, and there are no UI frameworks or runtime CDN dependencies.

The visual direction is a clean detailing-studio aesthetic: cool graphite, deep neutral blacks, cool silver, clean light surfaces and restrained blue highlights. Public pages must stay customer-facing: no upload instructions or developer notes should appear inside the UI.

## Stack

- Astro 7, fully static output
- Manrope Variable, self-hosted through the project dependency
- plain CSS and a small vanilla JavaScript enhancement file
- Cloudflare Pages-compatible `_headers` and `_routes.json`
- Cloudflare Pages Function for the contact endpoint
- Danish metadata, canonical URLs, sitemap, robots.txt, structured data and individual service pages
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

The fallback site URL in development is currently `https://esbjergshine.dk`. Confirm the production domain before launch and set `SITE_URL` in the build environment.

# Drop-in media system

The site is already wired to the paths below. You do **not** need to edit any Astro, CSS or JavaScript when real media is ready.

If a file is missing, the website shows a clean branded placeholder instead of a broken image. As soon as a correctly named file is placed at the expected path and the site is refreshed, that media appears automatically.

All website-ready media below belongs in `public/media/`. Empty media directories are kept in Git with `.gitkeep`, so the full folder structure is present after cloning/pulling even before all media has been added.

## 1. Brand

Already in use:

```text
public/media/brand/esbjerg-shine-logo.webp
```

Preferred long-term replacement: original SVG/vector artwork if available.

## 2. Hero

```text
public/media/home/hero-background.webp
public/media/home/hero-poster.webp
public/media/video/hero-detailing.webm
public/media/video/hero-detailing.mp4
```

Recommended final files:

| File | Purpose | Size / ratio | Format | Target weight |
| --- | --- | --- | --- | --- |
| `hero-background.webp` | full-width background behind the entire hero section | 2400 × 1600, 3:2 | WebP | ideally < 450 KB |
| `hero-poster.webp` | immediate image inside the hero media card + video fallback | 1600 × 2000, 4:5 | WebP | ideally < 300 KB |
| `hero-detailing.webm` | preferred autoplay hero-card video | 1080 × 1350, 4:5, 6–8 sec | WebM | ideally 1.5–3 MB |
| `hero-detailing.mp4` | compatibility fallback | 1080 × 1350, 4:5, 6–8 sec | H.264 MP4 | ideally 1.5–3.5 MB |

The full hero background is automatically darkened by the UI so the text and buttons remain readable. Use a wide image with the most important subject away from the main text area. If it is missing, the existing dark hero treatment remains as the placeholder.

Hero-card video should be muted, loop-friendly and contain no audio track. The page automatically falls back to the poster image when video cannot play or reduced-motion is preferred.

## 3. Service cards and service pages

Every service has two already-linked media slots: one homepage/list card image and one larger service-detail image.

```text
public/media/services/
├── bilvask/
│   ├── card.webp
│   └── detail.webp
├── indvendig-bilpleje/
│   ├── card.webp
│   └── detail.webp
├── komplet-klargoering/
│   ├── card.webp
│   └── detail.webp
├── polering/
│   ├── card.webp
│   └── detail.webp
├── lakbeskyttelse/
│   ├── card.webp
│   └── detail.webp
└── saederens/
    ├── card.webp
    └── detail.webp
```

Recommended output:

| Filename | Used on | Size / ratio | Format | Target weight |
| --- | --- | --- | --- | --- |
| `card.webp` | homepage service card + `/ydelser/` list | 1600 × 1000, 8:5 | WebP | ideally < 220 KB |
| `detail.webp` | individual service page | 1920 × 1080, 16:9 | WebP | ideally < 320 KB |

Suggested subjects:

- `bilvask`: foam, hand wash, rinse or wet glossy exterior
- `indvendig-bilpleje`: dashboard, cockpit or detailed interior work
- `komplet-klargoering`: finished whole-car 3/4 view
- `polering`: machine polisher working on paint
- `lakbeskyttelse`: coating application, gloss or water beading
- `saederens`: seat extraction/cleaning or clean upholstery

## 4. Before / after gallery

The homepage comparison component is already connected to six selectable pairs. Keep every before/after pair at exactly the same crop, camera position and dimensions.

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
├── 06-lakbeskyttelse-before.webp
└── 06-lakbeskyttelse-after.webp
```

Recommended for every file:

- 1600 × 1200 px
- 4:3
- WebP
- ideally < 250 KB each
- identical framing between each `before` and `after` pair

The comparison starts on the first pair where both files actually exist. The slider reveals the before image over the after image, while the arrows and six gallery markers switch between pairs.

## 5. About image

```text
public/media/about/esbjerg-shine-work.webp
```

Recommended:

- 1600 × 2000 px
- 4:5
- WebP
- ideally < 300 KB
- authentic photo of Esbjerg Shine working on a vehicle

This is already connected to the homepage About section.

## 6. Location image

```text
public/media/location/esbjerg-shine-location.webp
```

Recommended:

- 1800 × 1200 px
- 3:2
- WebP
- ideally < 300 KB
- workshop, entrance, detailing area or a strong exterior location photo

This image sits beside the address and the click-to-load Google Maps area. If it is not present, the branded placeholder remains.

## 7. Social / SEO preview

```text
public/media/social/esbjerg-shine-og.jpg
```

Required crop:

- 1200 × 630 px
- JPG
- ideally < 400 KB

This is already connected to Open Graph, Twitter/X large-card metadata and the business structured data. Use a strong finished-car image with the Esbjerg Shine logo; keep any text minimal.

## Complete media checklist

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
│   ├── lakbeskyttelse/
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
│   ├── 06-lakbeskyttelse-before.webp
│   └── 06-lakbeskyttelse-after.webp
├── about/
│   └── esbjerg-shine-work.webp
├── location/
│   └── esbjerg-shine-location.webp
└── social/
    └── esbjerg-shine-og.jpg
```

That is **30 drop-in media files including the existing logo and both hero-video encodes**. The same six service-card images are reused intelligently on the homepage and `/ydelser/`, so no duplicate assets are required.

## Asset budgets

The CI quality gate rejects oversized final media:

- non-video files in `public/`: maximum 1.2 MB each
- files under `public/media/video/`: maximum 4 MB each

The recommended targets above are intentionally much smaller than the hard limits.

## Photography direction

Use consistent cool-neutral lighting, clean blacks, glossy paint, glass, water, polished metal and controlled reflections. Avoid yellow workshop light, beige/brown casts, heavy HDR, random stock styles and visibly dusty environments.

## Contact form

The form UI is ready. The Pages Function is provisioned for a Microsoft 365 / Microsoft Graph mailbox using these production secrets:

- `M365_TENANT_ID`
- `M365_CLIENT_ID`
- `M365_CLIENT_SECRET`
- `CONTACT_MAILBOX`
- `CONTACT_TO`

The endpoint includes same-origin enforcement, server-side validation, an allowlist, honeypot, request-size limits and short IP-hash throttling. It does not log form content.

## Information still needed before production

1. Final production domain.
2. Business email address and email provider.
3. Real media listed above.
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

The website uses the physical address in visible content and structured data for local relevance. We intentionally do not generate thin city pages.

## Performance target

GitHub Actions builds the site and runs Lighthouse on mobile and desktop. The floor is:

- Performance: 95+
- Accessibility: 98+
- Best Practices: 95+
- SEO: 100

After launch, monitor real-user LCP, INP and CLS and keep the 75th percentile in the good range.

