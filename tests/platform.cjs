// RULE ONE, MEASURED: every platform gets the same game.
//
// Web page, mobile web, the Capacitor app, the desktop shell. One build, one
// game. "I fixed it" is meaningless if it only means "on the web".
//
// The rule is already true structurally — build.cjs emits two pages and every
// platform consumes those two files — so this does not re-check the obvious.
// It checks the four narrow ways it actually breaks:
//
//   an asset the GAME references that the PACKER does not put in the package;
//   a difference between the web page and the packaged page that is not one of
//     the two deliberate ones;
//   a screen that only one input method can reach;
//   the 11 MB generation archive being shipped to a phone that cannot see it.
//
// It runs against the real www/, so `npm run app:pack` has to have been run —
// which is the point: forgetting to pack IS the failure this catches.
//
//   node build.cjs && npm run app:pack && node tests/platform.cjs
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');

(async () => {
  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };
  console.log('── platform — one build, four platforms, no divergence');

  if (!fs.existsSync(WWW)) {
    console.log('  FAIL www/ is missing — run `npm run app:pack`');
    process.exit(1);
  }

  // ---- 1. THE PAGES ARE THE SAME GAME ------------------------------------
  // Exactly one difference is allowed, and it is named: the app strips the
  // service-worker registration, because inside a package there is nothing for
  // a cached page to be newer than.
  for (const f of ['index.html', 'odyssey.html']) {
    const web = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const app = fs.readFileSync(path.join(WWW, f), 'utf8');
    const norm = (s) => s.replace(/navigator\.serviceWorker\.register\('sw\.js'\)/g, 'void 0');
    check(f + ': the packaged page is the web page',
      norm(web) === app,
      norm(web).length === app.length ? '' : 'differs by ' + Math.abs(norm(web).length - app.length) + ' chars');
    check(f + ': and the app does not register a worker',
      !/serviceWorker\.register\('sw\.js'\)/.test(app));
  }

  // ---- 2. EVERY ASSET THE GAME NAMES IS IN THE PACKAGE --------------------
  // Read from the running game's own manifest rather than from a list here: a
  // list here would be the very thing that goes stale.
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const named = await page.evaluate(() => {
    const out = [];
    // MEDIA_OPTIONAL is the game's own declaration of which slots are allowed
    // to be empty — the NPC voice overrides, which fall back to the synth. A
    // harness that had to be TOLD to skip those would drift out of date the
    // first time a slot was added; reading the game's own set cannot.
    const opt = (typeof MEDIA_OPTIONAL !== 'undefined') ? MEDIA_OPTIONAL : new Set();
    const push = (k, v) => {
      if (typeof v === 'string' && v.startsWith('assets/') && !opt.has(k)) out.push(v);
    };
    for (const k in (MEDIA_SRC.images || {})) push(k, MEDIA_SRC.images[k]);
    for (const k in (MEDIA_SRC.audio || {})) push(k, MEDIA_SRC.audio[k]);
    // ...and the quarter-scale tier, which is named by window.LOWRES rather
    // than by MEDIA_SRC. It is 68 more files that the game genuinely asks for,
    // and a packer that missed them would leave the app drawing procedural
    // fallbacks where the web build draws art — RULE ONE, exactly.
    const L = window.LOWRES || {};
    for (const k in L) push(k, L[k]);
    // ...and the films, in every form the page can ask for: the master, the
    // webm sibling, and the light tier a phone on mobile data is handed. These
    // were never checked here at all, which is a gap RULE ONE cannot have — a
    // film missing from the package is a story beat that silently does not play.
    for (const m of [window.VID_FILES, window.VID_ALT, window.VID_LIGHT]) {
      for (const k in (m || {})) push(k, m[k]);
    }
    return out;
  });
  const missing = named.filter(p => !fs.existsSync(path.join(WWW, p)));
  check('every asset the manifest names is in the package (' + named.length + ')',
    !missing.length, missing.slice(0, 4).join(', '));
  const gone = named.filter(p => !fs.existsSync(path.join(ROOT, p)));
  check('...and every one of them exists on disk at all',
    !gone.length, gone.slice(0, 4).join(', '));

  // ---- 3. THE ARCHIVE IS NOT SHIPPED -------------------------------------
  check('the generation archive stays out of the package',
    !fs.existsSync(path.join(WWW, 'assets', 'source')),
    fs.existsSync(path.join(WWW, 'assets', 'source')) ? 'assets/source is in www/' : '');

  // ---- 4. EVERY SCREEN IS REACHABLE BY TOUCH -----------------------------
  // A screen a phone cannot open is a screen that does not exist on the
  // platform most of this game's players are on. The pause menu is the spine
  // of the UI, so every row it lists must have a tap target — which is the
  // same property tests/tap.cjs proves row by row; here it is the COUNT, so a
  // row added without touching the layout is caught.
  const touch = await page.evaluate(() => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    startGame(sv);
    G.state = 'PAUSE';
    const PL = pauseLayout();
    const hit = [];
    for (let i = 0; i < PL.items.length; i++) {
      G.pauseIdx = -1;
      tapMenu(480, PL.y0 + i * PL.step);
      hit.push(G.pauseIdx === i);
    }
    G.pauseConfirm = null; G.state = 'PLAY';
    return { n: PL.items.length, hit: hit.filter(Boolean).length };
  });
  check('every pause row is reachable by touch',
    touch.hit === touch.n, touch.hit + ' / ' + touch.n);

  // ---- 5. AND BY A CONTROLLER --------------------------------------------
  // Same argument, other input: the pad is how this game is played on a TV and
  // in the desktop shell.
  //
  // The property is REACHABLE, not BOUND, and the difference matters. SKILL and
  // CREST are deliberately unbound — every real button is spoken for (four
  // faces, four shoulders, two sticks, View, Options), and the skill tree once
  // sat on the Guide button, which Windows and Steam take before a page ever
  // sees it. So the honest contract is: an action is either on a button, or the
  // pause menu opens it and howToOpen() says so. An unbound action with no
  // route is the actual bug (it shipped once, as "▸ T" on a controller).
  const pad = await page.evaluate(() => {
    // PAD_ACTIONS is the game's own list of everything a pad can do, so this
    // cannot fall behind the game the way a list written here would
    const map = (typeof PAD !== 'undefined' && PAD && PAD.map) || null;
    const need = (typeof PAD_ACTIONS !== 'undefined' && PAD_ACTIONS) || [];
    if (!map || !need.length) return { skip: 1 };
    const unbound = need.filter(k => map[k] == null || map[k] < 0);
    // for anything unbound, the pause route has to be real: PAUSE itself must
    // be on a button, and the pause menu must actually contain a row for it
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv);
    const rows = pauseItems().map(i => i.id);
    const VIA = { SKILL: 'skills', CREST: 'crests', MAP: 'map' };
    const stranded = unbound.filter(k => !(map.PAUSE >= 0 && VIA[k] && rows.includes(VIA[k])));
    // ...and the game must SAY so rather than naming a control that is not there
    PAD.on = true;
    const mute = unbound.filter(k => !/▸/.test(howToOpen(k, VIA[k])));
    PAD.on = false;
    return { skip: 0, n: need.length, unbound, stranded, mute };
  });
  if (pad.skip) console.log('  ..   no pad map exposed to test against');
  else {
    check('every pad action is reachable (' + pad.n + ' actions, ' + pad.unbound.length + ' via the menu)',
      !pad.stranded.length, pad.stranded.join(',') || '');
    check('...and an unbound action names its route rather than a missing button',
      !pad.mute.length, pad.mute.join(',') || '');
  }

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — the web page, the phone, the app and the desktop shell are the same game');
})().catch(e => { console.error(e); process.exit(1); });
