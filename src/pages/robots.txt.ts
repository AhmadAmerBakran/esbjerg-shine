export const prerender = true;

export function GET({ site }: { site?: URL }) {
  const origin = (site ?? new URL('https://esbjergshine.dk')).toString().replace(/\/$/, '');
  return new Response(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
