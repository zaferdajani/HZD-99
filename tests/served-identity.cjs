// WHICH BUILD IS ON :8220? Every browser harness tests whatever answers on
// 127.0.0.1:8220, and several checkouts (worktrees, parallel sessions, the
// studio collector) all serve on that one port. A runner that accepts "any
// page that loads" will happily certify another checkout's game — green,
// confident, and about code that is not the code under review (studio audit
// finding QA-04). So identity is measured, not assumed: the served bytes of
// the two shipped pages and a few loose assets are hashed and compared with
// this checkout's files on disk, and a mismatch refuses the run.
//
// Used by tests/run.cjs (before the first browser harness, between harnesses
// and at the end) and by tools/studio/audit.py, so both apply ONE rule.
//
//   node tests/served-identity.cjs                   compare served vs disk
//   node tests/served-identity.cjs --write F         ...and save the snapshot to F
//   node tests/served-identity.cjs --expect F        compare served vs snapshot F
//   node tests/served-identity.cjs --json            machine-readable result
//
// Exit 0 = identical, 2 = mismatch or unreachable.
const crypto = require('crypto'), fs = require('fs'), http = require('http'), path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.SERVED_BASE || 'http://127.0.0.1:8220/';

// The two pages are the whole game (every js file is concatenated into them).
// The loose files prove the directory behind them is this checkout too: a
// copy of just the pages served from somewhere else would load this game's
// code against another tree's art, and sw.js decides what a browser caches.
function identityPaths(root = ROOT) {
  const list = ['index.html', 'odyssey.html', 'sw.js', 'assets/eyes.json'];
  // one shipped webp, chosen deterministically so disk and snapshot agree
  try {
    const low = fs.readdirSync(path.join(root, 'assets/lowres')).filter(f => f.endsWith('.webp')).sort();
    if (low.length) list.push('assets/lowres/' + low[0]);
  } catch (e) { /* no low tier in this checkout: the pages still decide */ }
  return list.filter(p => fs.existsSync(path.join(root, p)));
}

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
// what the build stamps into each page (build.cjs: window.BUILD_ID="…")
const buildId = (buf) => { const m = /window\.BUILD_ID="([^"]*)"/.exec(buf.toString('latin1')); return m ? m[1] : null; };

function describe(buf) { return { sha256: sha(buf), bytes: buf.length, buildId: buildId(buf) }; }

function diskSnapshot(root = ROOT) {
  const files = {};
  for (const p of identityPaths(root)) files[p] = describe(fs.readFileSync(path.join(root, p)));
  return { root, base: BASE, takenAt: new Date().toISOString(), files };
}

function fetchBuf(url, timeoutMs = 10000) {
  return new Promise((resolve) => {
    // a proxy must never answer for the loopback server — http.get does not
    // read HTTP(S)_PROXY, which is exactly why it is used here and not fetch()
    const req = http.get(url, { headers: { 'Cache-Control': 'no-cache' } }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks),
        root: res.headers['x-served-root'] || null }));
      res.on('error', e => resolve({ error: String(e.message || e) }));
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error('timeout after ' + timeoutMs + ' ms')));
    req.on('error', e => resolve({ error: String(e.message || e) }));
  });
}

// Compare what :8220 serves with an expected snapshot (default: disk now).
async function verifyServed(expected) {
  expected = expected || diskSnapshot();
  const result = { ok: true, base: BASE, expectedRoot: expected.root, servedRoot: null, files: {} };
  for (const [p, want] of Object.entries(expected.files)) {
    const got = await fetchBuf(BASE + p);
    if (got.root) result.servedRoot = got.root;
    let entry;
    if (got.error) entry = { ok: false, expected: want, served: { error: got.error } };
    else if (got.status !== 200) entry = { ok: false, expected: want, served: { error: 'HTTP ' + got.status } };
    else { const s = describe(got.body); entry = { ok: s.sha256 === want.sha256, expected: want, served: s }; }
    result.files[p] = entry;
    if (!entry.ok) result.ok = false;
  }
  return result;
}

function short(d) {
  if (!d) return '—';
  if (d.error) return d.error;
  return d.sha256.slice(0, 16) + ' ' + d.bytes + ' B' + (d.buildId ? ' BUILD_ID ' + d.buildId : '');
}

function report(result, why) {
  const lines = ['SERVED BUILD MISMATCH' + (why ? ' — ' + why : '') + ': ' + result.base + ' is not serving the build this run expects.'];
  for (const [p, e] of Object.entries(result.files)) {
    if (e.ok) continue;
    lines.push('  ' + p);
    lines.push('    served   ' + short(e.served));
    lines.push('    expected ' + short(e.expected));
  }
  lines.push('  expected root ' + result.expectedRoot + (result.servedRoot ? ', server says its root is ' + result.servedRoot : ''));
  lines.push('  Another checkout or session may own the port, or the pages were rebuilt.'
    + ' Stop that server, serve this checkout (node tests/serve.cjs), or isolate the run'
    + ' (e.g. its own network namespace). No browser harness result from this server can be trusted.');
  return lines.join('\n');
}

module.exports = { identityPaths, diskSnapshot, verifyServed, report, BASE };

if (require.main === module) {
  (async () => {
    const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
    const expectFile = arg('--expect'), writeFile = arg('--write');
    const expected = expectFile ? JSON.parse(fs.readFileSync(expectFile, 'utf8')) : diskSnapshot();
    const result = await verifyServed(expected);
    if (writeFile && result.ok) fs.writeFileSync(writeFile, JSON.stringify(expected, null, 2) + '\n');
    // --json still explains a mismatch on stderr, for the log a person reads
    if (process.argv.includes('--json')) { console.log(JSON.stringify(result, null, 2)); if (!result.ok) console.error(report(result)); }
    else if (result.ok) console.log('served build matches ' + (expectFile || 'this checkout') + ': '
      + Object.entries(result.files).map(([p, e]) => p + ' ' + e.served.sha256.slice(0, 12)).join(', '));
    else console.error(report(result));
    process.exit(result.ok ? 0 : 2);
  })();
}
