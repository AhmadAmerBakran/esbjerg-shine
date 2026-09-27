import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const siteOrigin = 'https://esbjergshine.dk';

const walk = (dir, predicate) => {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full, predicate));
    else if (predicate(full)) files.push(full);
  }
  return files;
};

const htmlFiles = () => walk(dist, (file) => file.endsWith('.html'));

const routeToFile = (pathname) => {
  const cleanPath = decodeURIComponent(pathname || '/').split('?')[0];
  if (cleanPath === '/') return path.join(dist, 'index.html');
  const relative = cleanPath.replace(/^\/+/, '');
  if (cleanPath.endsWith('/')) return path.join(dist, relative, 'index.html');
  const direct = path.join(dist, relative);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  return path.join(dist, relative, 'index.html');
};

const attrs = (html, name) => [...html.matchAll(new RegExp(`\\b${name}=["']([^"']+)["']`, 'gi'))].map((m) => m[1]);
const ids = (html) => attrs(html, 'id');

const resolveLocal = (value, currentFile) => {
  if (!value || value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('data:')) return null;
  if (value.startsWith('javascript:')) throw new Error(`javascript: URL found in ${currentFile}: ${value}`);

  let url;
  try {
    url = new URL(value, `${siteOrigin}${fileToRoute(currentFile)}`);
  } catch {
    return null;
  }
  if (url.origin !== siteOrigin) return null;
  if (url.pathname.startsWith('/api/')) return null;
  return url;
};

const fileToRoute = (file) => {
  const rel = path.relative(dist, file).replaceAll(path.sep, '/');
  if (rel === 'index.html') return '/';
  if (rel === '404.html') return '/404.html';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
};

test('all expected static site outputs exist', () => {
  for (const required of [
    'index.html',
    '404.html',
    'robots.txt',
    'sitemap.xml',
    'privatliv/index.html',
    'ydelser/index.html'
  ]) {
    assert.ok(fs.existsSync(path.join(dist, required)), `Missing ${required}`);
  }
});

test('every indexable HTML page has language, title, description and unique canonical', () => {
  const canonicals = new Set();
  for (const file of htmlFiles()) {
    const html = fs.readFileSync(file, 'utf8');
    if (path.basename(file) === '404.html') continue;
    assert.match(html, /<html[^>]+lang="da-DK"/i, `Missing da-DK lang in ${file}`);
    assert.match(html, /<title>[^<]+<\/title>/i, `Missing title in ${file}`);
    assert.match(html, /<meta[^>]+name="description"[^>]+content="[^"]+"/i, `Missing description in ${file}`);
    const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1];
    assert.ok(canonical, `Missing canonical in ${file}`);
    assert.ok(canonical.startsWith(siteOrigin), `Unexpected canonical origin in ${file}: ${canonical}`);
    assert.ok(!canonicals.has(canonical), `Duplicate canonical ${canonical}`);
    canonicals.add(canonical);
  }
});

test('404 stays non-indexable and free of canonical/schema', () => {
  const html = fs.readFileSync(path.join(dist, '404.html'), 'utf8');
  assert.match(html, /noindex,nofollow/i);
  assert.doesNotMatch(html, /rel="canonical"/i);
  assert.doesNotMatch(html, /application\/ld\+json/i);
  assert.match(html, /Siden findes/i);
});

test('all local href/src/poster references resolve to built files and fragments', () => {
  for (const file of htmlFiles()) {
    const html = fs.readFileSync(file, 'utf8');
    const values = [...attrs(html, 'href'), ...attrs(html, 'src'), ...attrs(html, 'poster')];
    for (const value of values) {
      const url = resolveLocal(value, file);
      if (!url) continue;
      const target = routeToFile(url.pathname);
      assert.ok(fs.existsSync(target), `Broken local reference in ${file}: ${value} -> ${target}`);
      if (url.hash && target.endsWith('.html')) {
        const targetHtml = fs.readFileSync(target, 'utf8');
        const targetId = decodeURIComponent(url.hash.slice(1));
        assert.ok(ids(targetHtml).includes(targetId), `Broken fragment in ${file}: ${value}`);
      }
    }
  }
});

test('HTML ids are unique per page and images always declare alt text', () => {
  for (const file of htmlFiles()) {
    const html = fs.readFileSync(file, 'utf8');
    const pageIds = ids(html);
    assert.equal(new Set(pageIds).size, pageIds.length, `Duplicate id in ${file}`);
    for (const img of html.match(/<img\b[^>]*>/gi) ?? []) {
      assert.match(img, /\balt(?:=["'][^"']*["'])?(?=\s|>)/i, `Image without alt in ${file}: ${img}`);
    }
  }
});

test('sitemap contains only real canonical pages and excludes 404', () => {
  const xml = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URL');
  assert.ok(urls.length >= 9, 'Sitemap unexpectedly small');
  for (const value of urls) {
    const url = new URL(value);
    assert.equal(url.origin, siteOrigin);
    assert.ok(fs.existsSync(routeToFile(url.pathname)), `Sitemap URL has no built page: ${value}`);
    assert.doesNotMatch(url.pathname, /404/);
  }

  for (const file of htmlFiles()) {
    if (path.basename(file) === '404.html') continue;
    const html = fs.readFileSync(file, 'utf8');
    const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1];
    assert.ok(urls.includes(canonical), `Indexable page missing from sitemap: ${canonical}`);
  }
});

test('robots.txt allows crawling and advertises the sitemap', () => {
  const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
  assert.match(robots, /User-agent:\s*\*/i);
  assert.match(robots, /Sitemap:\s*https:\/\/esbjergshine\.dk\/sitemap\.xml/i);
  assert.doesNotMatch(robots, /Disallow:\s*\//i);
});

test('removed service wording and placeholder privacy copy do not return', () => {
  const text = walk(dist, (file) => /\.(html|xml|txt|js|css)$/i.test(file))
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n')
    .toLowerCase();
  assert.doesNotMatch(text, /lakbeskyttelse/);
  assert.doesNotMatch(text, /lakforbedring/);
  assert.doesNotMatch(text, /planlagte behandling/);
});
