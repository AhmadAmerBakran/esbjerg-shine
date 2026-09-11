import { services } from '../data/services';

export const prerender = true;

const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char] ?? char);

export function GET({ site }: { site?: URL }) {
  const origin = (site ?? new URL('https://esbjergshine.dk')).toString().replace(/\/$/, '');
  const paths = ['/', '/ydelser/', ...services.map((service) => `/ydelser/${service.slug}/`), '/privatliv/'];
  const urls = paths.map((path) => `  <url><loc>${escapeXml(`${origin}${path}`)}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
