import { services } from '../data/services';

export const prerender = true;

const CONTENT_UPDATED = '2026-09-27';
const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char] ?? char);

export function GET({ site }: { site?: URL }) {
  const origin = (site ?? new URL('https://esbjergshine.dk')).toString().replace(/\/$/, '');
  const entries = [
    { path: '/', lastmod: CONTENT_UPDATED },
    { path: '/ydelser/', lastmod: CONTENT_UPDATED },
    ...services.map((service) => ({ path: `/ydelser/${service.slug}/`, lastmod: CONTENT_UPDATED })),
    { path: '/privatliv/' }
  ];

  const urls = entries.map(({ path, lastmod }) => {
    const loc = escapeXml(`${origin}${path}`);
    const lastmodElement = lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : '';
    return `  <url><loc>${loc}</loc>${lastmodElement}</url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
