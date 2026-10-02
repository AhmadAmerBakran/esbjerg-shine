import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 8787;
const origin = `http://127.0.0.1:${port}`;
const child = spawn('./node_modules/.bin/wrangler', ['dev', '--local', '--ip', '127.0.0.1', '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, NO_COLOR: '1' }
});

let output = '';
child.stdout.on('data', (chunk) => {
  output += chunk.toString();
});
child.stderr.on('data', (chunk) => {
  output += chunk.toString();
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async () => {
  for (let i = 0; i < 60; i += 1) {
    try {
      const response = await fetch(`${origin}/`, { redirect: 'manual' });
      if (response.status > 0) return;
    } catch {
      // Wrangler is still starting.
    }
    await sleep(250);
  }
  throw new Error(`Wrangler did not start. Output:\n${output}`);
};

const checkStaticHeaders = (response) => {
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.match(response.headers.get('content-security-policy') ?? '', /default-src 'self'/);
  assert.match(response.headers.get('strict-transport-security') ?? '', /max-age=31536000/);
};

try {
  await waitForServer();

  const home = await fetch(`${origin}/`);
  assert.equal(home.status, 200);
  checkStaticHeaders(home);
  assert.match(await home.text(), /Esbjerg Shine/i);

  const service = await fetch(`${origin}/ydelser/polering/`);
  assert.equal(service.status, 200);
  checkStaticHeaders(service);
  assert.match(await service.text(), /Polering/);

  const privacy = await fetch(`${origin}/privatliv/`);
  assert.equal(privacy.status, 200);
  checkStaticHeaders(privacy);
  assert.match(await privacy.text(), /Datatilsynet/);

  for (const contactPath of ['/kontakt', '/kontakt/']) {
    const contactRedirect = await fetch(`${origin}${contactPath}`, { redirect: 'manual' });
    assert.equal(contactRedirect.status, 301);
    assert.equal(contactRedirect.headers.get('location'), `${origin}/#kontakt`);
  }

  const missing = await fetch(`${origin}/det-her-findes-ikke-task13/`, { redirect: 'manual' });
  assert.equal(missing.status, 404);
  checkStaticHeaders(missing);
  assert.match(await missing.text(), /Siden findes/i);

  const missingApi = await fetch(`${origin}/api/does-not-exist`);
  assert.equal(missingApi.status, 404);
  assert.equal(missingApi.headers.get('cache-control'), 'no-store');
  assert.equal(missingApi.headers.get('x-frame-options'), 'DENY');
  assert.equal(missingApi.headers.get('x-robots-tag'), 'noindex');
  assert.match(missingApi.headers.get('content-security-policy') ?? '', /default-src 'none'/);
  assert.deepEqual(await missingApi.json(), { ok: false, code: 'not_found' });

  const contactGet = await fetch(`${origin}/api/contact`);
  assert.equal(contactGet.status, 405);
  assert.equal(contactGet.headers.get('allow'), 'POST');
  assert.equal(contactGet.headers.get('cache-control'), 'no-store');

  const contactOptions = await fetch(`${origin}/api/contact`, { method: 'OPTIONS' });
  assert.equal(contactOptions.status, 204);
  assert.equal(contactOptions.headers.get('allow'), 'POST');

  console.log('Wrangler runtime smoke test passed.');
} finally {
  child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    sleep(2_000).then(() => child.kill('SIGKILL'))
  ]);
}
