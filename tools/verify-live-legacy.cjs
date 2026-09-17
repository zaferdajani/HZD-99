// IS PRODUCTION ACTUALLY SERVING THIS COMMIT?
//
// tools/verify-pages.cjs answers that for a release THIS WORKFLOW published: it
// compares the live site against _site/release.json, the manifest stamped into
// the artifact it just uploaded. That manifest only exists inside _site, so it
// cannot answer the question when something ELSE is doing the publishing.
//
// Something else has been. GitHub Pages' legacy branch publisher serves the
// repository root directly, and it has been quietly shipping this game for 524
// consecutive pushes while this workflow refused to run and reported failure
// every time. Every report written in that window called the site blocked. The
// site was fine. Nobody checked, because the only tool that could check was on
// the far side of the step that kept exiting 1.
//
// So this is the check that needs no cooperation from the publisher: the root
// index.html is the artifact in the legacy path, so hash the committed one and
// hash the live one and see whether they are the same bytes. Then sample the
// asset tree, because a page can be current while the CDN is still handing out
// an old sheet, and a half-deployed game is the failure that looks like success.
//
//   LIVE_URL=https://.../ node tools/verify-live-legacy.cjs
//
// Exits non-zero if production never catches up inside the window. Propagation
// is normally seconds; the window is generous because a slow CDN is not a
// regression and a false alarm here is exactly the disease being cured.
const fs = require('node:fs'), { createHash } = require('node:crypto');

const base = (process.env.LIVE_URL || 'https://zaferdajani.github.io/HZD-99/').replace(/\/?$/, '/');
const ATTEMPTS = +(process.env.VERIFY_ATTEMPTS || 20);
const WAIT_MS = +(process.env.VERIFY_WAIT_MS || 15000);
const sha = b => createHash('sha256').update(b).digest('hex');
const pause = ms => new Promise(r => setTimeout(r, ms));

// A DETERMINISTIC SAMPLE, not a hand-picked one. A list somebody chose is a list
// that rots: the interesting files change every time the art does. Sorting by a
// hash of the path gives a spread across the whole tree that is stable between
// runs and impossible to curate around.
function sampleAssets(n) {
  const all = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = dir + '/' + e.name;
      if (e.isDirectory()) { if (e.name !== 'source') walk(p); }
      else if (/\.(webp|png|jpg|json)$/.test(e.name)) all.push(p.replace(/^\.\//, ''));
    }
  })('assets');
  return all.sort((a, b) => sha(a).localeCompare(sha(b))).slice(0, n);
}

async function get(path, attempt) {
  const url = new URL(path, base);
  url.searchParams.set('verify', String(attempt));
  const r = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw Error(path + ': HTTP ' + r.status);
  return Buffer.from(await r.arrayBuffer());
}

(async () => {
  const localPage = fs.readFileSync('index.html');
  const want = sha(localPage);
  const buildId = (localPage.toString().match(/BUILD_ID="([0-9a-f]+)"/) || [])[1] || null;
  const files = sampleAssets(+(process.env.VERIFY_SAMPLE || 8));
  console.log('expecting index.html ' + want.slice(0, 12) + '  BUILD_ID ' + buildId);

  let live = null, last = '';
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const got = await get('index.html', attempt);
      const gotSha = sha(got);
      if (gotSha !== want) throw Error('index.html is ' + gotSha.slice(0, 12) + ', want ' + want.slice(0, 12));
      for (const f of files) {
        const remote = sha(await get(f, attempt));
        const local = sha(fs.readFileSync(f));
        if (remote !== local) throw Error('stale asset ' + f + ': live ' + remote.slice(0, 12) + ' vs ' + local.slice(0, 12));
      }
      live = { page: gotSha, build_id: buildId, sampled: files.length };
      break;
    } catch (e) {
      last = e.message;
      console.log('waiting for production to catch up (' + attempt + '/' + ATTEMPTS + '): ' + last);
      if (attempt < ATTEMPTS) await pause(WAIT_MS);
    }
  }

  fs.mkdirSync('release-evidence', { recursive: true });
  fs.writeFileSync('release-evidence/live-legacy.json',
    JSON.stringify({ verified: !!live, url: base, want, build_id: buildId, files, error: live ? null : last }, null, 2));
  if (!live) throw Error('production never matched this commit: ' + last);
  console.log('LIVE VERIFIED (legacy publisher) ' + JSON.stringify(live));
})().catch(e => { console.error(String(e.message || e)); process.exitCode = 1; });
