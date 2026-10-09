// THE ROOF IS PART OF THE BUILDING, SO IT MOVES WITH THE BUILDING.
//
// drawCeiling hung the kingdom's roof plate at two parallax rates — the far
// layer at 0.35 across / 0.22 down, the near one at 0.92 — so in any room
// bigger than the screen the roof slid against the rock it hangs from, and it
// could never meet the floor art of the room stacked above (which is drawn on
// the grid, at 1.0). In C1, a 34-row shaft, the near plate ended up tens of
// pixels down inside the room by the bottom of the climb.
//
// This drives the real drawCeiling at several camera positions and records
// where each plate stamp actually lands. A world-locked plate lands at the
// same WORLD position whatever the camera does; the test fails if either layer
// drifts by more than a pixel, or if the near plate does not reach up to the
// top edge of the room (the line where the room above's floor ends).
//
//   node tests/ceillock.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── ceillock — the roof plate is nailed to the room grid\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv);
    const out = {};
    for (const room of ['C1', 'B2', 'A7']) {
      loadRoom(room);
      MEDIA_IMG[CEIL[G.roomDef.zone]];
      for (let i = 0; i < 120 && !ceilTex(G.roomDef.zone); i++) await new Promise(q => requestAnimationFrame(q));
      const tex = ceilTex(G.roomDef.zone);
      if (!tex) { out[room] = { err: 'no plate' }; continue; }
      if (typeof QUAL !== 'undefined') QUAL.ceil = 2;     // both layers
      const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
      const real = c.drawImage;
      const samples = [];
      const shots = [[0, 0], [W * 0.31, H * 0.17], [W * 0.5, H * 0.43], [W - 960, H - 540], [137, 61]];
      for (const [cx, cy] of shots) {
        cam.x = cx; cam.y = cy; cam.shakeX = 0; cam.shakeY = 0;
        const stamps = [];
        c.drawImage = function (img, ...a) {
          if (img === tex) stamps.push({ x: a[0], y: a[1], h: a[3] });
          return real.call(this, img, ...a);
        };
        try { drawCeiling(G.roomDef.zone); } finally { c.drawImage = real; }
        const sx = Math.round(camSX()), sy = Math.round(camSY());
        // two layers: the far one is drawn taller (CEIL_TH * 1.18)
        const near = stamps.filter(s => Math.abs(s.h - CEIL_TH) < 0.5);
        const far = stamps.filter(s => Math.abs(s.h - CEIL_TH) >= 0.5);
        const lay = (L) => L.length ? {
          wy: +(L[0].y + sy).toFixed(2),
          // world x phase of the stamp grid, modulo the plate width
          wx: +((((L[0].x + sx) % CEIL_TW) + CEIL_TW) % CEIL_TW).toFixed(2),
        } : null;
        samples.push({ cx, cy, near: lay(near), far: lay(far) });
      }
      out[room] = { samples };
    }
    return out;
  });

  for (const [room, res] of Object.entries(r)) {
    if (res.err) { check(room + ': plate resolves', false, res.err); continue; }
    // a sample whose layer was scrolled out of sight above is not drawn at
    // all; drift is measured over the samples that drew it
    for (const layer of ['near', 'far']) {
      const drawn = res.samples.filter(s => s[layer]);
      if (!drawn.length) { check(`${room} ${layer} plate is drawn`, false, 'never drawn'); continue; }
      const ys = drawn.map(s => s[layer].wy), xs = drawn.map(s => s[layer].wx);
      const dy = Math.max(...ys) - Math.min(...ys);
      const dxs = xs.map(x => Math.min(Math.abs(x - xs[0]), CEIL_TW_GUESS - Math.abs(x - xs[0])));
      const dx = Math.max(...dxs);
      check(`${room} ${layer} plate stays on the grid as the camera moves`, dy <= 1 && dx <= 1,
        `world y spread ${dy.toFixed(1)} px, x phase spread ${dx.toFixed(1)} px over ${drawn.length} camera positions`);
    }
    const near = res.samples.find(s => s.near);
    check(`${room} near plate reaches the room's top edge`, near && near.near.wy <= 0,
      near ? 'hangs from world y ' + near.near.wy : 'not drawn');
  }
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log('\n' + (fails.length ? 'FAILED\n  ' + fails.join('\n  ')
    : 'OK — the roof moves with the room it is the roof of'));
  process.exit(fails.length ? 1 : 0);
})();
// the plate width, for the wrap-around distance on the x phase (CEIL_TW in js/game.js)
const CEIL_TW_GUESS = 512;
