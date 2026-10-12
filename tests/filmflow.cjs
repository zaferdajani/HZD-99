// THE OPENING FILM IS ONE MOVE, NOT EIGHT (owner, 2026-10-12: "between each
// scene there is a pause instead of being continuous").
//
// Measured before the fix, frame by frame: every shot faded to black over
// 0.34 s, sat in a black hold until "can play through", and — whenever its
// sentence was longer than its picture — froze on its last frame for up to
// 3.6 s waiting for the caption. Eight shots, seven stops.
//
// What this measures, on the real reel:
//   - all eight shots play;
//   - between two shots there is never a frame of black (no 'in' fade, no dark
//     'hold'): a shot still buffering holds the frame the last one ended on;
//   - between two shots the picture never stops for longer than a quarter
//     second (from one clip's end to the next clip moving);
//   - no shot but the last holds its frame for an unread caption — the line
//     rides on over the next shot instead.
//
//   node tests/filmflow.cjs        (needs the repo served on :8220)
const { chromium } = require('playwright');
const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name);
};
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
    args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startCine === 'function', null, { timeout: 30000 });
  await page.mouse.click(8, 8);
  const r = await page.evaluate(async () => {
    G.afterCine = 'DIFF'; startCine();
    const shots = [], black = [], frozen = [], gaps = [];
    let lastKind = null, endAt = null, t0 = performance.now();
    while (performance.now() - t0 < 160000) {
      await new Promise(k => requestAnimationFrame(k));
      const now = performance.now() / 1000;
      const ct = G.cut;
      if (!ct) { if (G.state !== 'CUT') break; continue; }
      const v = ct.v;
      if (ct.kind !== lastKind) { shots.push(ct.kind); lastKind = ct.kind; }
      // a frame of black between two shots (the first shot fades in from the
      // title, which is not a gap between shots)
      if (shots.length > 1 && (ct.ph === 'in' || (ct.ph === 'hold' && !ct.keep))) black.push(ct.kind + ':' + ct.ph);
      // the picture stopped: this clip at its end, or a clip not yet moving
      const moving = ct.ph === 'play' && v && !v.paused && !v.ended && v.currentTime < (v.duration || 1e9) - 0.06;
      if (!moving && shots.length >= 1) { if (endAt == null) endAt = now; }
      else if (endAt != null) { gaps.push([ct.kind, +(now - endAt).toFixed(2)]); endAt = null; }
      const last = !(G.reel && G.reel.length);
      if (!last && (ct.capHold || 0) > 0) frozen.push(ct.kind + ':' + ct.capHold.toFixed(2));
    }
    return { shots, black, frozen, gaps, film: typeof INTRO_FILM !== 'undefined' ? INTRO_FILM.length : -1 };
  });
  console.log('  shots: ' + r.shots.join(' '));
  check('all eight shots play', r.shots.length >= 8, r.shots.length + ' / 8');
  check('no frame of black between two shots', r.black.length === 0, r.black.slice(0, 6).join(', '));
  // the first entry is the title handing to shot one; the rest are cuts
  const cuts = r.gaps.filter(g => g[0] !== r.shots[0]);
  const worst = cuts.reduce((m, g) => Math.max(m, g[1]), 0);
  check('the picture never stops between shots for more than 0.25 s', worst <= 0.25,
    'worst ' + worst.toFixed(2) + ' s  ' + JSON.stringify(cuts));
  check('no shot but the last freezes on its caption', r.frozen.length === 0, r.frozen.slice(0, 4).join(', '));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAIL — ' + fails.join('; ')); process.exit(1); }
  console.log('\nOK — the opening plays as one film, shot into shot');
})();
