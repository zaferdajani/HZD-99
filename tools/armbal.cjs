// Is this plate two-armed? Measured per CELL, before it is wired.
//
// tests/hero.cjs fails a pose when the quieter side of her body carries less
// than 0.16 of the busier side at shoulder height. That test measures the
// RENDERED pose in the running game, which is the right thing to check and
// the wrong thing to iterate against: by the time it fails, the plate is
// already in the sheet and in a commit.
//
// This measures the same quantity on the sheet itself — split each cell at
// its own subject centre, count opaque pixels either side across the 30%-55%
// band of the body, and report the ratio. It is not a substitute for the
// harness (the game adds facing, lean, scarf and jets on top, and those move
// the number a lot) but it answers the question that matters while a plate
// can still be cheaply re-fired: does the far arm exist at all.
//
//   node tools/armbal.cjs
//
const { chromium } = require('playwright');
const fs = require('fs');
const NAMES = ['idle','walk_a','walk_b','run_a','run_b','rise','apex','fall','land','dash','skid',
  'wall_cling','djump_jet','claw_1','claw_2','finisher','charge','burst','hurt','heal','song','slump'];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  const src = 'data:image/png;base64,' + fs.readFileSync('/home/user/HZD-99/assets/characters/hero/states.png').toString('base64');
  const r = await p.evaluate(async (src) => {
    const im = new Image(); im.src = src; await im.decode();
    const N = 22, cw = im.width / N, H = im.height;
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = H;
    const c = cv.getContext('2d'); c.drawImage(im, 0, 0);
    const out = [];
    for (let i = 0; i < N; i++) {
      const x0 = Math.round(i * cw), w = Math.round(cw);
      const d = c.getImageData(x0, 0, w, H).data;
      // subject bbox
      let minX = w, maxX = -1, minY = H, maxY = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 140) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
      }
      if (maxX < 0) { out.push(null); continue; }
      const spine = (minX + maxX) / 2, bh = maxY - minY + 1;
      // shoulder band: 30%-55% down the body
      const yA = Math.round(minY + bh * 0.30), yB = Math.round(minY + bh * 0.55);
      let L = 0, R = 0;
      for (let y = yA; y <= yB; y++) for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 140) (x < spine ? L++ : R++);
      }
      out.push({ L, R, ratio: +(Math.min(L, R) / Math.max(L, R)).toFixed(3) });
    }
    return out;
  }, src);
  r.forEach((v, i) => { if (v) console.log(NAMES[i].padEnd(11), 'L', String(v.L).padStart(5), 'R', String(v.R).padStart(5), ' ratio', v.ratio, v.ratio < 0.16 ? '  << under 0.16' : ''); });
  await b.close();
})();
