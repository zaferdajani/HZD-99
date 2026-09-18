// THE MACHINES STAND IN HER WEIGHT CLASS.
//
// Owner, 2026-09-18: "make their size comparable with my hero." They were not —
// measured against CLAWBYTE's hero at 76px, the bat drew 0.28x of her and the
// four kingdom emitters about 0.39x, which reads as scenery she happens to be
// able to hit. EDRAW_ROBO (js/entities.js) lifts the low end into her band.
//
// Both halves are measured, because they pull against each other: comparable
// means CLOSE TO her, and the SCALE LAW above EDRAW says an ordinary minion must
// still read SMALLER than her. A change that satisfies one by breaking the other
// is the failure this exists to catch.
//
//   node tests/foescale.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

// How close to her an ordinary machine has to read, and how far it may not go.
// The ceiling is the SCALE LAW, not a taste call: at 1.0 a minion IS the hero.
const FLOOR = 0.5, CEIL = 1.0;

(async () => {
  console.log('── foescale — every machine reads in the hero\'s weight class\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A1');
    G.wake = null; G.state = 'PLAY'; G.boss = null;
    for (let i = 0; i < 60; i++) await new Promise(k => requestAnimationFrame(k));
    // Each body is rendered ALONE onto a scratch canvas and measured by its own
    // pixels: what the player sees, not what a table claims.
    const cv = document.createElement('canvas'); cv.width = 400; cv.height = 300;
    const cx2 = cv.getContext('2d');
    const height = () => {
      const d = cx2.getImageData(0, 0, cv.width, cv.height).data;
      let y0 = 1e9, y1 = -1;
      for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++)
        if (d[(y * cv.width + x) * 4 + 3] > 24) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
      return y1 < 0 ? 0 : y1 - y0 + 1;
    };
    const out = { drawn: {} };
    const ocx = cam.x, ocy = cam.y;
    cam.x = 0; cam.y = 0; cam.shakeX = 0; cam.shakeY = 0;
    const px = player.x, py = player.y;
    player.x = 180; player.y = 180; player.vx = 0; player.on = true;
    cx2.clearRect(0, 0, 400, 300);
    player.draw(cx2);
    out.hero = height();
    player.x = px; player.y = py;
    for (const kind of Object.keys(EKIND)) {
      const e = new Enemy(kind, 180, 180);
      e.anim = 1.2; e.hurtT = 0; e.t = 1;
      cx2.clearRect(0, 0, 400, 300);
      e.draw(cx2);
      out.drawn[kind] = height();
    }
    cam.x = ocx; cam.y = ocy;
    return out;
  });

  check('the hero measures at all', r.hero > 40, r.hero + 'px');
  const ratios = {};
  for (const kind of Object.keys(r.drawn)) ratios[kind] = +(r.drawn[kind] / r.hero).toFixed(2);
  const small = Object.entries(ratios).filter(([, v]) => v < FLOOR);
  const big = Object.entries(ratios).filter(([, v]) => v >= CEIL);
  check('no machine reads as scenery beside her (>= ' + FLOOR + ' of her height)',
    small.length === 0, small.map(([k, v]) => k + ' ' + v + 'x').join(', ') || Object.keys(ratios).length + ' kinds');
  check('...and none of them reads as big as her — the SCALE LAW holds',
    big.length === 0, big.map(([k, v]) => k + ' ' + v + 'x').join(', ') || 'max ' + Math.max(...Object.values(ratios)) + 'x');
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log('\n  hero ' + r.hero + 'px  ·  ' +
    Object.entries(ratios).sort((a, b) => a[1] - b[1]).map(([k, v]) => k + ' ' + v).join('  '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
