// A BODY STANDS ON THE GROUND (the ledger; owner, 2026-11-21, of MIREJAW: "when it
// stands on the platform is leveled and the crocodile is actually, four of its
// limbs is almost on the air, not actually standing on actual ground").
// A plate is drawn level and seated by its centre, so over a hump its ends hang in
// the air. Each long body that stands on the curve is posed from the ground under
// its own front and back feet; this measures those feet against the ground, on
// every patch of floor the body can stand on, facing both ways:
//   - no foot is in the ground, and no foot is more than 6 px over it
//     (a foot past a bank, in the water, is under the surface).
//
//   node tests/stand-ground.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, info) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (info == null ? '' : '  ' + info)); if (!ok) fails.push(name); };
  const p = await b.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function');
  console.log('── stand-ground — long bodies stand on the ground under their own feet');
  const R = await p.evaluate(async () => {
    const out = {};
    const gy = x => { const gc = groundColumnAt(x); return gc ? Math.min(gc[0], gc[1]) : null; };
    const sv = newSave(1); sv.time = 99;
    Object.assign(sv.flags, { tut: 1, woke: 1, crystal: 1, bossGlitch: 1, ch2Climb: 1, bossCarrier: 1, ferryPaid: 1, k2Road: 1 });
    startGame(sv);
    // MIREJAW, on every island of the wallow
    loadRoom('SW3'); G.state = 'PLAY'; update(1 / 60);
    { const B = G.boss; mjInit(B); const o = { n: 0, worst: 0, under: 0, wetAbove: 0 };
      for (let x = 2 * TILE; x < (G.roomDef.w - 2) * TILE; x += 16) {
        if (mjGroundAt(x) == null) continue;
        for (const face of [-1, 1]) {
          B.st = 'beached'; B.t = 1; B.mj.t0 = 1; B.mj.wx = x - face * 70; B.mj.face = face; B.mj.drawY = null;
          mjPoseStep(B, 1);
          for (const pw of B.mj.paws) {
            if (pw.wet) { if (pw.y < mjSurfY()) o.wetAbove++; continue; }
            o.n++; o.worst = Math.max(o.worst, pw.ground - pw.y); if (pw.y > pw.ground + 1) o.under++;
          }
        }
      }
      out.croc = o; }
    // NULLFANG, across his whole arena (A4): drawn, and his feet read back from
    // the pose the drawing settled on
    loadRoom('A4'); G.state = 'PLAY'; update(1 / 60);
    for (const k of Object.keys(MEDIA_SRC.images)) if (/^beast/.test(k)) mediaFetch(k, true);
    for (let i = 0; i < 200 && !(beastImg() && beastImg().naturalWidth && MEDIA_IMG.beastStudioIdle && MEDIA_IMG.beastStudioIdle.naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
    out.lionArt = !!(beastImg() && beastImg().naturalWidth);
    { const B = G.boss, cv = document.createElement('canvas'); cv.width = 960; cv.height = 540; const cx2 = cv.getContext('2d');
      const o = { n: 0, worst: 0, under: 0, tilted: 0, kind: B && B.kind };
      const W = G.roomDef.w * TILE, Sk = (B.h * 2.35) / BEAST_H * BEAST_STRIP_PX;
      for (let x = 3 * TILE; x < W - 3 * TILE; x += 24) {
        const g0 = gy(x); if (g0 == null || g0 < B.y + B.h - 140) continue;
        for (const fv of [-1, 1]) {
          B.st = 'idle'; B.vy = 0; B.face = B.faceVis = fv; B.x = x - B.w / 2; B.y = g0 - B.h; B._seatT = 0; B._seatY = 0;
          // (his seat settles on his own clock, B.anim, which the game's update advances between
          // drawn frames: two thirds of a second of it here, drawn every 1/60)
          for (let i = 0; i < 40; i++) { B.anim = (B.anim || 0) + 1 / 60; cx2.save(); drawBeast(cx2, B); cx2.restore(); }
          const sgn = fv < 0 ? 1 : -1, cx = x, foot = g0 + B._seatY, sl = Math.tan(B._seatT);
          for (const px of [cx - sgn * 93 * Sk, cx + sgn * 54 * Sk]) {
            const g = gy(px); if (g == null) continue; const y = foot + sl * (px - cx);
            o.n++; o.worst = Math.max(o.worst, g - y); if (y > g + 2) o.under++;
          }
          if (Math.abs(B._seatT) > 0.03) o.tilted++;
        }
      }
      out.lion = o; }
    return out;
  });
  check('MIREJAW: every paw over an island is on it — none in it, none floating', R.croc.n > 20 && R.croc.under === 0 && R.croc.worst <= 6, JSON.stringify(R.croc));
  check('...and a paw past the bank is under the water', R.croc.wetAbove === 0, JSON.stringify(R.croc));
  check('NULLFANG: across his arena both ends of him stand on the ground under them', R.lionArt && R.lion.n > 20 && R.lion.under === 0 && R.lion.worst <= 6, JSON.stringify(R.lion));
  check('...and he pitches with the ground where it slopes', R.lion.tilted > 2, JSON.stringify(R.lion));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — they stand on the ground under their feet');
})().catch(e => { console.error(e); process.exit(1); });
