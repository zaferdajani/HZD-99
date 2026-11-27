// THE MARBLE CATCHES THE EYE — owner, 2026-11-27: "the marble should give a sparkle or something to
// show that it's important — to shine, to glow — to direct the player to it."
// The raw marble in the quarry (CV3, the pillar static, js/game.js marbleGlint) is played on a phone
// (844x390 at 2x, touch controller up, the game's own zoom) with her standing a screen away from it,
// the stone near the far edge of what the phone shows.
//   A  it is on the screen, whole, from there
//   B  IT CATCHES THE EYE: over three seconds of play, a good part of the stone's own pixels change
//      (the glint running over it, the glow breathing in it) — a still stone fails
//   C  NO RING, NO HALO, NO OUTLINE: the same frame drawn with and without the glint differs only on
//      the stone itself (its plate's alpha, 3 px of edge allowed) — at the glint's peak and at a
//      twinkle's; and the stone has no light of its own laid round it (no lightAt on the raw marble)
//   D  the glint is drawn at all (the frames with and without it differ on the stone)
//   E  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── marble-glint — the raw marble shines from a screen away, on itself and nowhere round it');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await page.goto('http://127.0.0.1:' + PORT + '/' + (process.env.PAGE || 'index.html'), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const S = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2;
    Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, rubbleA5: 1, rubbleCV1B: 1, beacon: 1, bossHorn: 1, ghMet: 1, ghWon: 1, burstDone: 1, 'rw_CV3>CV1B': 1 });
    startGame(sv);
    loadRoom('CV3'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = null; G.enemies = []; G.boss = null;
    mediaFetch('rawMarble', 1);
    for (let i = 0; i < 100 && !(MEDIA_IMG.rawMarble && MEDIA_IMG.rawMarble.naturalWidth); i++) await new Promise(r => setTimeout(r, 100));
    const s = G.statics.find(q => q.type === 'pillar');
    if (!s) return { none: 1 };
    window.__s = s; window.__T = performance.now();
    const step = (n) => { for (let i = 0; i < n; i++) { window.__T += 16.7; player.iT = 99; player.vx = 0; G.dialog = null; G.state = 'PLAY'; G.enemies = []; mainLoop(window.__T); } };
    // a screen away: walk her back from the stone until it sits at the far edge of the view
    let dx = 120;
    for (; dx < 900; dx += 20) {
      player.x = s.x - dx; const g = groundColumnAt(player.x + player.w / 2); player.y = Math.min.apply(null, g) - player.h; player.face = 1; player.vy = 0;
      step(90);
      if (worldScreenX(s.x + s.w + 30) > 900) break;
    }
    dx -= 20; player.x = s.x - dx; const g = groundColumnAt(player.x + player.w / 2); player.y = Math.min.apply(null, g) - player.h;
    step(120);
    window.__step = step;
    return { dx, sx0: worldScreenX(s.x - 20), sx1: worldScreenX(s.x + s.w + 20), sy0: worldScreenY(s.y - 10), sy1: worldScreenY(s.y + s.h), RS };
  });
  if (S.none) { check('the marble is in the quarry', false); await browser.close(); process.exit(1); }
  check('A  from a screen away (' + S.dx + ' px off) the stone is whole on the phone screen', S.sx0 >= 0 && S.sx1 <= 960 && S.sy0 >= 0 && S.sy1 <= 540, S);
  // B: three seconds of play, the stone's pixels over time
  const grabStone = () => page.evaluate(() => {
    window.__step(3);
    const cv = document.getElementById('cv'), k = cv.width / 960, s = window.__s;
    const x0 = Math.round(worldScreenX(s.x - 10) * k), x1 = Math.round(worldScreenX(s.x + s.w + 10) * k);
    const y0 = Math.round(worldScreenY(s.y - 20) * k), y1 = Math.round(worldScreenY(s.y + s.h - 6) * k);
    return Array.from(cv.getContext('2d').getImageData(x0, y0, x1 - x0, y1 - y0).data);
  });
  const frames = [];
  for (let i = 0; i < 14; i++) { frames.push(await grabStone()); await new Promise(r => setTimeout(r, 230)); }
  let most = 0;
  for (let i = 1; i < frames.length; i++) for (let j = 0; j < i; j++) {
    const a = frames[i], b = frames[j]; let n = 0, ch = 0;
    for (let q = 0; q < a.length; q += 4) { n++; if (Math.abs(a[q] - b[q]) + Math.abs(a[q + 1] - b[q + 1]) + Math.abs(a[q + 2] - b[q + 2]) > 45) ch++; }
    most = Math.max(most, ch / n);
  }
  check('B  it catches the eye: over 3 s a good part of the stone changes (>= 12% of its pixels)', most >= 0.12, (most * 100).toFixed(1) + '%');
  // C/D: the same frame with and without the glint, at the glint's peak and at a twinkle
  const C = await page.evaluate(() => {
    if (typeof marbleGlint !== 'function') return { missing: 1 };
    const cv = document.getElementById('cv'), k = cv.width / 960, s = window.__s, W = cv.width, H = cv.height;
    // the stone's silhouette on the canvas, from its own plate
    const R = marbleRect(s.x + s.w / 2, s.y + s.h, s.h * 1.18);
    const m = document.createElement('canvas'); m.width = W; m.height = H; const mx = m.getContext('2d');
    const iw = R.im.naturalWidth, ih = R.im.naturalHeight;
    const X = worldScreenX(R.x) * k, Y = worldScreenY(R.y) * k, X1 = worldScreenX(R.x + R.w) * k, Y1 = worldScreenY(R.y + R.h) * k;
    mx.drawImage(R.im, R.box.x * iw, R.box.y * ih, R.box.w * iw, R.box.h * ih, X, Y, X1 - X, Y1 - Y);
    const md = mx.getImageData(0, 0, W, H).data;
    const inStone = (x, y) => { for (let oy = -3; oy <= 3; oy++) for (let ox = -3; ox <= 3; ox++) { const xx = x + ox, yy = y + oy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && md[(yy * W + xx) * 4 + 3] > 8) return true; } return false; };
    const P0 = performance.now, R0 = Math.random, mg = window.marbleGlint, mm = window.marbleMotes;
    const out = {};
    for (const [name, frac] of [['peak', 0.17], ['twinkle', 0.95]]) {
      const t = (Math.floor(P0.call(performance) / 2800) + 1) * 2800 + frac * 2800;
      const frame = (glint) => {
        let seed = 7; Math.random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        performance.now = () => t; window.marbleMotes = () => {};
        window.marbleGlint = glint ? mg : () => {};
        try { draw(); } finally { performance.now = P0; Math.random = R0; window.marbleGlint = mg; window.marbleMotes = mm; }
        return cv.getContext('2d').getImageData(0, 0, W, H).data;
      };
      const a = frame(true), b = frame(false);
      let on = 0, off = 0, offAt = null;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const q = (y * W + x) * 4;
        if (Math.abs(a[q] - b[q]) + Math.abs(a[q + 1] - b[q + 1]) + Math.abs(a[q + 2] - b[q + 2]) <= 6) continue;
        if (inStone(x, y)) on++; else { off++; if (!offAt) offAt = [x, y]; }
      }
      out[name] = { on, off, offAt };
    }
    // and nothing lit round it: the lights pass lays no light on the raw marble
    const L0 = window.lightAt; let near = 0;
    window.lightAt = function (x, y, r, col, a) { if (Math.abs(x - (s.x + s.w / 2)) < 4 && Math.abs(y - (s.y + s.h * 0.4)) < 4) near++; return L0.apply(this, arguments); };
    try { draw(); } finally { window.lightAt = L0; }
    out.light = near;
    return out;
  });
  if (C.missing) { check('C  no ring round the stone', false, 'marbleGlint is not in the build'); check('D  the glint is drawn', false); }
  else {
    check('C  no ring, halo or outline: with and without the glint differ only on the stone, and no light is laid round it', C.peak.off === 0 && C.twinkle.off === 0 && C.light === 0, C);
    check('D  the glint is drawn on the stone (at its peak and at a twinkle)', C.peak.on > 200 && C.twinkle.on > 40, { peak: C.peak.on, twinkle: C.twinkle.on });
  }
  check('E  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — the marble shines, on itself');
})().catch(e => { console.error(e); process.exit(1); });
