export const siteMedia = {
  hero: {
    background: '/media/home/hero-background.webp',
    poster: '/media/home/hero-poster.webp',
    webm: '/media/video/hero-detailing.webm',
    mp4: '/media/video/hero-detailing.mp4'
  },
  about: '/media/about/esbjerg-shine-work.webp',
  location: '/media/location/esbjerg-shine-location.webp',
  social: '/media/social/esbjerg-shine-og.jpg',
  logo: '/media/brand/esbjerg-shine-logo.webp'
} as const;

export const getServiceMedia = (slug: string) => ({
  card: `/media/services/${slug}/card.webp`,
  detail: `/media/services/${slug}/detail.webp`
});

export const beforeAfterSets = [
  {
    label: 'Polering',
    before: '/media/before-after/01-polering-before.webp',
    after: '/media/before-after/01-polering-after.webp'
  },
  {
    label: 'Indvendig bilpleje',
    before: '/media/before-after/02-indvendig-before.webp',
    after: '/media/before-after/02-indvendig-after.webp'
  },
  {
    label: 'Sæderens',
    before: '/media/before-after/03-saederens-before.webp',
    after: '/media/before-after/03-saederens-after.webp'
  },
  {
    label: 'Bilvask',
    before: '/media/before-after/04-bilvask-before.webp',
    after: '/media/before-after/04-bilvask-after.webp'
  },
  {
    label: 'Komplet klargøring',
    before: '/media/before-after/05-klargoering-before.webp',
    after: '/media/before-after/05-klargoering-after.webp'
  },
  {
    label: 'Motorvask',
    before: '/media/before-after/06-motorvask-before.webp',
    after: '/media/before-after/06-motorvask-after.webp'
  }
] as const;
