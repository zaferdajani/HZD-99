// THE MEADOW IS ALIVE, AND IT HAS TO LOOK IT.
//
// The owner, 2026-08-23, on the scrap meadow: "This greenery background is
// giving me very pale blue vibe instead of vibrant one even though it's in a
// scrapyard or whatever. It shouldn't be so electronic. It needs to be even
// though electronic, but vibrant, even though all the machines are dead."
//
// He was reading the composite, not the paint. Measured: the fringe canvas
// ALONE is 49.7 saturation at hue 100 — a true yellow-green, exactly as
// authored — and on screen the greenery came out at 27.8 at hue 113. The
// cinematic grade was innocent; turning it off changed nothing. The loss was
// in a per-blade alpha that started at 0.55, which makes a blade 45% of the
// dark teal rock behind it: half the chroma gone and the hue dragged toward
// the ground it stands on.
//
// So this measures what the GRASS actually contributes to the frame, by taking
// it away: two frames, one with the fringe and one with G.fringeProbe set, and
// the pixels that differ are the grass. Any geometric guess at where grass is
// also samples the rock it grows out of, which is the very thing diluting it.
//
//   node tests/meadow.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── meadow — the greenery keeps its colour all the way to the screen\n');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A1');
    G.wake = null; G.state = 'PLAY';
    G.enemies = []; G.boss = null;
    for (let i = 0; i < 120; i++) await new Promise(k => requestAnimationFrame(k));
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const grab = () => new Uint8ClampedArray(ctx.getImageData(0, 0, cv.width, cv.height).data);
    const realNow = performance.now, realRand = Math.random;
    const out = {};
    for (let attempt = 0; attempt < 6; attempt++) {
      const tNow = realNow.call(performance);
      performance.now = () => tNow; Math.random = () => 0.5;
      const w0 = cv.width, h0 = cv.height;
      for (let f = 0; f < 4; f++) await new Promise(k => requestAnimationFrame(k));
      const A = grab();
      G.fringeProbe = 1;
      for (let f = 0; f < 4; f++) await new Promise(k => requestAnimationFrame(k));
      const B = grab();
      G.fringeProbe = 0;
      performance.now = realNow; Math.random = realRand;
      // the backbuffer can resize under a measurement (js/perf.js drops the
      // tier when the frame rate slips) — compare the BUFFERS, not the sizes
      if (cv.width !== w0 || cv.height !== h0 || A.length !== B.length) continue;
      const n = A.length / 4;
      let s = 0, v = 0, hu = 0, c = 0, sB = 0, vB = 0;
      for (let i = 0; i < n; i++) {
        const d0 = Math.abs(A[i * 4] - B[i * 4]) + Math.abs(A[i * 4 + 1] - B[i * 4 + 1]) +
                   Math.abs(A[i * 4 + 2] - B[i * 4 + 2]);
        if (d0 < 24) continue;
        const R = A[i * 4], G2 = A[i * 4 + 1], Bl = A[i * 4 + 2];
        const mx = Math.max(R, G2, Bl), mn = Math.min(R, G2, Bl);
        if (mx < 30) continue;
        s += (mx - mn) / mx * 100; v += mx / 255 * 100;
        hu += mx === mn ? 0 : 60 * (2 + (Bl - R) / (mx - mn));
        const R2 = B[i * 4], G3 = B[i * 4 + 1], B2 = B[i * 4 + 2];
        const mx2 = Math.max(R2, G3, B2), mn2 = Math.min(R2, G3, B2);
        sB += mx2 ? (mx2 - mn2) / mx2 * 100 : 0; vB += mx2 / 255 * 100;
        c++;
      }
      if (!c) continue;
      out.px = c;
      out.grass = { sat: +(s / c).toFixed(1), val: +(v / c).toFixed(1), hue: +(hu / c).toFixed(0) };
      out.ground = { sat: +(sB / c).toFixed(1), val: +(vB / c).toFixed(1) };
      out.attempts = attempt + 1;
      break;
    }
    return out;
  });

  check('the meadow actually grows something', (r.px || 0) > 3000, (r.px || 0) + ' px of grass');
  if (r.grass) {
    // 34 is the floor, and the number is chosen from what the composite can
    // actually deliver rather than from what would be nice. The paint is 63;
    // the screen cannot reach it, because a two-pixel blade is mostly
    // antialiased edge and an antialiased edge is half the rock behind it.
    // What matters is that the old build measured 28 and this one measures
    // 37 — so the floor fails the blend that produced the owner's report and
    // passes the one that fixed it, with margin either side. It is a COMPOSITE
    // test, not a palette test: brightening the greens alone cannot pass it.
    check('...and the grass keeps its colour', r.grass.sat >= 34,
          'saturation ' + r.grass.sat + ' (min 34; the paint is 63, the old blend gave 28)');
    // hue 100 is yellow-green, 130 is cyan-green. "Not so electronic" is a
    // number: the blades must not drift into the sky's half of the wheel.
    check('...and it is GREEN, not blue-green', r.grass.hue <= 112,
          'hue ' + r.grass.hue + '° (max 112; the paint is 98)');
    check('...and it stands out from the ground it grows in',
          r.grass.sat - r.ground.sat >= 12 && r.grass.val > r.ground.val,
          'grass ' + r.grass.sat + '/' + r.grass.val + ' vs ground ' +
          r.ground.sat + '/' + r.ground.val);
  } else check('the greenery could be measured', false, 'no stable frame pair');

  if (errs.length) check('no page errors', false, errs[0]);
  await browser.close();
  console.log(fails.length ? '\n' + fails.length + ' FAILED\n' : '\nall good\n');
  process.exit(fails.length ? 1 : 0);
})();
