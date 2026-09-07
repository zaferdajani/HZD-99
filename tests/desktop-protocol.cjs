// The desktop origin must stream the packaged game without exposing other files.
// Pure Node: this gate also runs before Electron is installed or a display exists.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {resolveAsset, parseRange, serveAsset} = require('../desktop/protocol.cjs');

async function main() {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'clawbyte-protocol-'));
  const root = path.join(fixture, 'www');
  fs.mkdirSync(path.join(root, 'assets'), {recursive:true});
  fs.writeFileSync(path.join(root, 'index.html'), '<!doctype html><title>CLAWBYTE</title>');
  fs.writeFileSync(path.join(root, 'assets', 'clip.mp4'), Buffer.from('0123456789'));
  fs.writeFileSync(path.join(root, 'assets', 'space name.ogg'), 'audio');
  fs.writeFileSync(path.join(root, 'assets', 'empty.bin'), '');
  fs.writeFileSync(path.join(fixture, 'outside.txt'), 'outside package');
  const request = (url, method = 'GET', range) => ({url, method,
    headers:new Headers(range === undefined ? {} : {Range:range})});
  const get = (url, method, range) => serveAsset(root, request(url, method, range));
  try {
    assert.equal(resolveAsset(root, 'app://clawbyte/'), path.join(root, 'index.html'));
    assert.equal(resolveAsset(root, 'app://clawbyte/index.html?pack=demo#start'), path.join(root, 'index.html'));
    assert.equal(resolveAsset(root, 'app://clawbyte/assets/space%20name.ogg'), path.join(root, 'assets', 'space name.ogg'));
    for (const url of [
      'https://clawbyte/index.html', 'file:///etc/passwd', 'app://other/index.html',
      'app://clawbyte.evil/index.html', 'app://user@clawbyte/index.html',
      'app://clawbyte:123/index.html', 'not a url',
      'app://clawbyte/../outside.txt', 'app://clawbyte/%2e%2e/outside.txt',
      'app://clawbyte/assets/%2e%2e/%2e%2e/outside.txt',
      'app://clawbyte/assets/%2e%2e%2f%2e%2e%2foutside.txt',
      'app://clawbyte/assets/..\\..\\outside.txt',
      'app://clawbyte/assets/%2e%2e%5c%2e%2e%5coutside.txt',
      'app://clawbyte/assets/%00clip.mp4', 'app://clawbyte/assets/%ZZ'
    ]) assert.equal(resolveAsset(root, url), null, `reject unsafe URL: ${url}`);

    assert.equal(parseRange(undefined, 10), null);
    assert.equal(parseRange(null, 10), null);
    for (const [header, expected] of [
      ['bytes=0-0', {start:0,end:0}], ['bytes=0-9', {start:0,end:9}],
      ['bytes=9-9', {start:9,end:9}], ['bytes=3-', {start:3,end:9}],
      ['bytes=3-99', {start:3,end:9}], ['bytes=-4', {start:6,end:9}],
      ['bytes=-99', {start:0,end:9}]
    ]) assert.deepEqual(parseRange(header, 10), expected, header);
    for (const header of ['bytes=10-', 'bytes=10-11', 'bytes=5-2', 'bytes=-0',
      'bytes=', 'bytes=-', 'bytes=1.5-3', 'items=0-1', 'bytes=0-1,4-5',
      'bytes=NaN-9', 'bytes=9007199254740993-', 'bytes=0-Infinity']) {
      assert.equal(parseRange(header, 10), false, `reject invalid range: ${header}`);
    }
    assert.equal(parseRange('bytes=0-', 0), false, 'empty files have no satisfiable range');

    const html = await get('app://clawbyte/');
    assert.equal(html.status, 200);
    assert.match(html.headers.get('content-type'), /^text\/html(?:;|$)/);
    assert.equal(Number(html.headers.get('content-length')), fs.statSync(path.join(root, 'index.html')).size);
    assert.equal(await html.text(), '<!doctype html><title>CLAWBYTE</title>');

    const full = await get('app://clawbyte/assets/clip.mp4');
    assert.equal(full.status, 200);
    assert.equal(full.headers.get('content-type'), 'video/mp4');
    assert.equal(full.headers.get('accept-ranges'), 'bytes');
    assert.equal(full.headers.get('content-length'), '10');
    assert.equal(await full.text(), '0123456789');
    const head = await get('app://clawbyte/assets/clip.mp4', 'HEAD');
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('content-length'), '10');
    assert.equal(await head.text(), '', 'HEAD never streams the body');

    for (const [range, start, end, body] of [
      ['bytes=0-0',0,0,'0'], ['bytes=9-',9,9,'9'],
      ['bytes=3-99',3,9,'3456789'], ['bytes=-3',7,9,'789']
    ]) {
      const partial = await get('app://clawbyte/assets/clip.mp4', 'GET', range);
      assert.equal(partial.status, 206, range);
      assert.equal(partial.headers.get('content-range'), `bytes ${start}-${end}/10`);
      assert.equal(partial.headers.get('content-length'), String(body.length));
      assert.equal(await partial.text(), body);
    }
    const partialHead = await get('app://clawbyte/assets/clip.mp4', 'HEAD', 'bytes=2-4');
    assert.equal(partialHead.status, 200, 'Range applies only to GET, not HEAD');
    assert.equal(partialHead.headers.get('content-range'), null);
    assert.equal(partialHead.headers.get('content-length'), '10');
    assert.equal(await partialHead.text(), '');
    for (const range of ['bytes=10-', 'bytes=2-1', 'bytes=0-1,3-4']) {
      const unsatisfiable = await get('app://clawbyte/assets/clip.mp4', 'GET', range);
      assert.equal(unsatisfiable.status, 416, range);
      assert.equal(unsatisfiable.headers.get('content-range'), 'bytes */10');
    }
    const empty = await get('app://clawbyte/assets/empty.bin');
    assert.equal(empty.status, 200);
    assert.equal(empty.headers.get('content-length'), '0');
    assert.equal(await empty.text(), '');
    const emptyRange = await get('app://clawbyte/assets/empty.bin', 'GET', 'bytes=0-');
    assert.equal(emptyRange.status, 416);
    assert.equal(emptyRange.headers.get('content-range'), 'bytes */0');
    assert.equal((await get('app://clawbyte/missing.file')).status, 404);
    assert.equal((await get('app://clawbyte/assets')).status, 404, 'no directory browsing');
    assert.equal((await get('app://evil/index.html')).status, 403);
    assert.equal((await get('app://clawbyte/%2e%2e/outside.txt')).status, 403);
    assert.equal((await get('app://clawbyte/index.html', 'POST')).status, 405);
    let symlinkSupported = true;
    try {
      fs.symlinkSync(path.join(fixture, 'outside.txt'), path.join(root, 'assets', 'escape.txt'));
    } catch (error) {
      // Windows CI can lack the symlink privilege; do not hide other errors.
      if (process.platform === 'win32' && error.code === 'EPERM') symlinkSupported = false;
      else throw error;
    }
    if (symlinkSupported) {
      assert.equal((await get('app://clawbyte/assets/escape.txt')).status, 403, 'symlink cannot expose files outside the package');
    } else console.log('SKIP: symlink fixture requires the Windows symlink privilege');
    console.log('PASS: desktop origin confinement, media ranges, GET/HEAD and errors');
  } finally {
    // Only the exact mkdtemp-owned fixture is removed; no user/game data is touched.
    fs.rmSync(fixture, {recursive:true, force:true});
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
