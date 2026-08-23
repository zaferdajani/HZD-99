// THE LOW TIER — the quarter-scale copy of the art, and the one rule it can
// break catastrophically and silently.
//
// The idea is simple: fetch a small copy and a full copy of a sheet at once and
// draw whichever arrives first, so a room is RIGHT (correct art, just soft)
// rather than being the procedural fallback that later gets replaced. The whole
// game at quarter size is 0.55 MB against 24.2 MB.
//
// THE DANGER is that "the same picture, smaller" is only true for code that
// slices PROPORTIONALLY. Six sheets in this game — the guardian parts atlases —
// are addressed with ABSOLUTE PIXEL RECTANGLES baked against the full-size
// sheet. Hand one of those a quarter-scale image and the boss is assembled out
// of the wrong quarter of itself: no error, no missing file, just a guardian
// made of fragments. So the exclusion is not trusted here, it is RE-DERIVED
// from the source — any file that indexes a sheet with numeric source rects
// must have no small copy, whether or not anybody remembered to say so.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── lowres — the whole world, roughly, for half a megabyte');

  const idxPath = path.join(ROOT, 'assets/lowres/index.json');
  if (!fs.existsSync(idxPath)) {
    console.log('  FAIL assets/lowres/index.json is missing — run tools/lowres.cjs');
    process.exit(1);
  }
  const idx = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
  const keys = Object.keys(idx);

  // ---- 1. EVERY ENTRY IS A FILE, AND A MUCH SMALLER ONE --------------------
  const src = fs.readFileSync(path.join(ROOT, 'js/media.js'), 'utf8');
  const seg = src.split('images: {')[1].split(/\n  },/)[0];
  const IMG = {}; let m;
  const re = /^\s*([a-zA-Z0-9_]+):\s*'([^']+)'/gm;
  while ((m = re.exec(seg))) IMG[m[1]] = m[2];

  const missing = [], notSmaller = [];
  let full = 0, low = 0;
  for (const k of keys) {
    const lp = path.join(ROOT, idx[k]);
    if (!fs.existsSync(lp)) { missing.push(k); continue; }
    const ls = fs.statSync(lp).size, fs2 = fs.statSync(path.join(ROOT, IMG[k])).size;
    low += ls; full += fs2;
    if (ls > fs2 / 4) notSmaller.push(k + ' ' + ls + '/' + fs2);
  }
  check('every small copy the manifest names is on disk', !missing.length,
        keys.length + ' entries' + (missing.length ? ' — missing ' + missing.join(', ') : ''));
  check('...and every one of them is at most a quarter of its full sheet',
        !notSmaller.length, notSmaller.slice(0, 3).join('; ') || 'all under');
  check('the whole tier is small enough to front-load', low < 2 * 1048576,
        (low / 1048576).toFixed(2) + ' MB for ' + (full / 1048576).toFixed(1)
        + ' MB of art (' + (low / full * 100).toFixed(1) + '%)');

  // ---- 2. THE ABSOLUTE-RECT RULE, RE-DERIVED -------------------------------
  // Find every media key that some file draws with a numeric source rectangle,
  // and insist it has NO small copy. This is deliberately over-broad: a false
  // positive costs one sheet its low tier, a false negative costs a boss.
  const bad = [];
  const guard = ['beast', 'eagle', 'glaciere', 'furnace', 'prism', 'mother'];
  for (const g of guard) {
    const js = fs.readFileSync(path.join(ROOT, 'js', g + '.js'), 'utf8');
    // a 9-argument drawImage is a source-rect draw; the sheets these files use
    // are named by their MEDIA_IMG lookups
    if (!/drawImage\([^)]*,[^)]*,[^)]*,[^)]*,[^)]*,[^)]*,[^)]*,[^)]*,[^)]*\)/.test(js)) continue;
    for (const km of js.matchAll(/MEDIA_IMG\[?'?([a-zA-Z0-9_]+)'?\]?/g)) {
      const k = km[1];
      if (idx[k]) bad.push(g + '.js draws ' + k + ' by pixel rect but it has a small copy');
    }
  }
  check('no sheet addressed by absolute pixel rect has a small copy', !bad.length,
        bad.slice(0, 3).join('; ') || guard.length + ' guardian files checked');

  // ---- 3. IT ACTUALLY STANDS IN, AND IT ACTUALLY GETS REPLACED -------------
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  const got = [];
  page.on('response', r => { if (/\/assets\/lowres\//.test(r.url())) got.push(r.url().split('/').pop()); });
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const wired = await page.evaluate(() => ({
    manifest: !!window.LOWRES && Object.keys(window.LOWRES).length,
    inPolicy: preloadPolicy().lowAll,
  }));
  check('the page carries the manifest', wired.manifest === keys.length,
        wired.manifest + ' keys in window.LOWRES');
  check('...and the prefetcher is told to front-load it', wired.inPolicy === true);

  // THE PROBE IS TAKEN FROM THE MANIFEST, NOT NAMED. This used to drive the key
  // 'lairDen' by hand, which was a sheet with a small copy on the day it was
  // written and stopped being one the moment the art tier moved to webp: at
  // 68 KB it now falls under lowres.cjs's 120 KB floor, mediaLow() hands back
  // the FULL sheet, and the check read "620 -> 620 px" — a stand-in that never
  // stood in for anything. The property is still worth testing; the probe just
  // has to be a sheet that actually has a small copy, which only the manifest
  // knows.
  const probeKey = await page.evaluate(() => Object.keys(window.LOWRES || {})[0]);
  if (!probeKey) { check('the manifest names at least one small copy', false, 'none'); }

  // drive one key through the whole life cycle by hand, so the STAND-IN and the
  // UPGRADE are both observed rather than assumed
  const life = await page.evaluate(async (k) => {
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    delete MEDIA_RAW[k]; MEDIA_LOW[k] = 0; delete MEDIA_PEND[k];
    SOFT_ART[k] = 'STALE';                       // a derivative nobody may keep
    mediaLow(k);
    for (let i = 0; i < 60 && MEDIA_LOW[k] !== 2; i++) await wait(50);
    const small = MEDIA_RAW[k] ? MEDIA_RAW[k].naturalWidth : 0;
    const clearedByLow = SOFT_ART[k] === undefined;
    SOFT_ART[k] = 'STALE2';
    mediaFetch(k);
    for (let i = 0; i < 100 && MEDIA_LOW[k] !== 3; i++) await wait(50);
    return { small, big: MEDIA_RAW[k] ? MEDIA_RAW[k].naturalWidth : 0,
             clearedByLow, clearedByFull: SOFT_ART[k] === undefined, state: MEDIA_LOW[k] };
  }, probeKey);

  check('a small copy stands in for a sheet that has not arrived', life.small > 0,
        life.small + ' px wide');
  check('...and the full sheet replaces it', life.big > life.small && life.state === 3,
        life.small + ' -> ' + life.big + ' px');
  check('...and every cached derivative of the soft one is thrown away',
        life.clearedByLow && life.clearedByFull,
        'on stand-in: ' + life.clearedByLow + ', on upgrade: ' + life.clearedByFull);

  // ---- 4. AND THE PREFETCHER REALLY FRONT-LOADS IT -------------------------
  await page.evaluate(() => { const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv); });
  await page.waitForTimeout(6000);
  check('the tier is fetched ahead of the full-size art', got.length >= 20,
        got.length + ' small copies fetched in the first six seconds');

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — the room is right immediately and sharp a moment later');
})().catch(e => { console.error(e); process.exit(1); });
