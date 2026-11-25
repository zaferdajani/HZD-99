// NULLFANG'S SECOND SHOWING, SOLID (owner, 2026-11-20: "nulfang appears two times
// before reaching it, the second appearance after acquiring the sword is the issue,
// its oversized and colors are pale").
//
// The second showing is the break (js/story-opening.js): he comes along the road,
// the purple goes out of him, the bell writes it back and he leaps away. While he
// stood free he was drawn at 15% in the crouch a defeated guardian rises from (the
// boss draw's purification fade, never advanced in a staged beat): a pale ghost.
// This holds:
//   - every phase of the beat draws him SOLID: every picture of him at full opacity;
//   - free, he stands (not the rise crouch);
//   - the beat is framed no closer than 1.3, all of him in the frame.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await p.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2;
    Object.assign(sv.flags, { woke: 1, tut: 1, gateOpened: 1, heal: 1, crystal: 1, opNote: 1, nfMeet: 1, nfGlimpse: 1, sageTame_GA1D: 1 });
    startGame(sv); loadRoom('A3'); G.state = 'PLAY'; G.dialog = null; G.toasts = [];
    for (const k of Object.keys(MEDIA_SRC.images).filter(k => /^beast/.test(k))) mediaFetch(k, true);
    const BK = Object.keys(MEDIA_SRC.images).filter(k => /^beast/.test(k));
    for (let i = 0; i < 400 && !BK.every(k => MEDIA_RAW[k] && (MEDIA_RAW[k].naturalWidth || MEDIA_RAW[k].failed)); i++) await new Promise(r => setTimeout(r, 50));
    const W = G.roomDef.w * TILE; player.x = W - 17 * TILE; player.y = 0; player.vy = 0;
    const cv = document.querySelector('canvas'), x = cv.getContext('2d');
    // how solid his body is drawn: the opacity every picture of him goes down at
    const presence = () => {
      const bb = G.boss; let lo = 1, n = 0, on = false;
      const D = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function () { if (on) { n++; lo = Math.min(lo, this.globalAlpha); } return D.apply(this, arguments); };
      const d0 = bb.draw; bb.draw = function (c) { on = true; try { return d0.apply(this, arguments); } finally { on = false; } };
      try { G.toasts = []; draw(performance.now()); } finally { CanvasRenderingContext2D.prototype.drawImage = D; bb.draw = d0; }
      return n ? lo : -1;
    };
    const out = { zooms: [] };
    for (let f = 0; f < 60 * 10; f++) {
      update(1 / 60); G.dialog = null;
      if (G.break) out.zooms.push(cam.zoom);
      // (measured on the first frame he is actually drawn in each phase)
      if (G.break && G.break.ph === 'still' && G.break.t > 0.5 && out.free == null) { const v = presence(); if (v >= 0) { out.free = v; out.pureT = G.boss.pureT; } }
      if (G.break && G.break.ph === 'bell' && G.break.t > 0.2 && out.bound == null) { const v = presence(); if (v >= 0) out.bound = v; }
    }
    out.zMax = out.zooms.slice(30).reduce((m, v) => Math.max(m, v), 0);
    delete out.zooms;
    return out;
  });
  check('free, he is drawn solid: every picture of him at full opacity, as when the bell has him back', R.free >= 0.95 && R.bound >= 0.95, 'free ' + R.free + ', bound ' + R.bound);
  check('...standing, not in the crouch a beaten guardian rises from', R.pureT >= 0.8, 'pureT ' + R.pureT);
  check('the beat is framed no closer than 1.3: all of him in the frame', R.zMax <= 1.31, 'zoom ' + R.zMax.toFixed(2));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — his second showing is NULLFANG, solid and his own size');
})().catch(e => { console.error(e); process.exit(1); });
