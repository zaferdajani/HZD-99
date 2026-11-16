// THE ORACLE'S ROBE HAS AN INSIDE.
//
// mono's filmed strip (assets/characters/npc/mono/work_loop.webp) was keyed off
// a dark plate, and the key took the dark INSIDE of the cable shroud with it:
// below the hands every cell is loose strands with holes between them, so in
// the game the room showed through the lower half of the body (owner,
// 2026-11-16, of the figure that resulted: "the npc needs a lot of
// improvement"). This puts the inside back. For every row of the robe below
// the shoulders it fills, BEHIND the art, from the first strand to the last —
// in the robe's own dark, held to the body's own width so a reaching hand does
// not grow a web to the hip — and lets the fill fray out with the hem.
//
// Master in, shipped strip out; it is a derivation, so it can be re-run:
//   node tools/shroudback.cjs
// then: node tools/lowres.cjs && node build.cjs
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'assets/source/npc/mono/work_loop_keyed.webp');
const OUT = path.join(ROOT, 'assets/characters/npc/mono/work_loop.webp');
const CELLS = 16;
// ...AND ONE CELL OF THE TAKE WAS NEVER A PICTURE OF ITS OWN. With the robe
// keyed full of holes, every cell differed from its neighbour by the holes
// alone; backed, cells 8-9-10 measure 2.4% and 2.3% apart (tests/frames.cjs
// calls anything under 2.5% a dead cell — the hands have not moved). Cell 9 is
// left out, so the strip that ships is fifteen pictures, each one a change.
const DROP = [9];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const b64 = fs.readFileSync(SRC).toString('base64');
    const res = await page.evaluate(async ({ b64, CELLS, DROP }) => {
      const im = new Image(); im.src = 'data:image/webp;base64,' + b64; await im.decode();
      const W = im.naturalWidth, H = im.naturalHeight, cw = W / CELLS;
      const src = document.createElement('canvas'); src.width = W; src.height = H;
      const sx = src.getContext('2d'); sx.drawImage(im, 0, 0);
      const full = document.createElement('canvas'); full.width = W; full.height = H;
      const ox = full.getContext('2d');
      const back = ox.createImageData(W, H);
      const px = sx.getImageData(0, 0, W, H).data;
      const A = (x, y) => px[(y * W + x) * 4 + 3];
      const TOP = Math.round(H * 0.36), FRAY0 = Math.round(H * 0.90), FRAY1 = Math.round(H * 0.975);
      let filled = 0;
      for (let c = 0; c < CELLS; c++) {
        const x0 = Math.round(c * cw), x1 = Math.round((c + 1) * cw) - 1;
        // the body's own width: where the shroud leaves the casing (the band just
        // under the CRT, above any hand), flared a little for the hem
        // (the MEDIAN row of the band: one keying crumb or a raised finger must not widen it)
        const ls = [], rs = [];
        for (let y = Math.round(H * 0.36); y < Math.round(H * 0.42); y++) {
          let l = -1, r = -1;
          for (let x = x0; x <= x1; x++) if (A(x, y) > 128) { if (l < 0) l = x; r = x; }
          if (l >= 0) { ls.push(l); rs.push(r); }
        }
        ls.sort((p, q) => q - p); rs.sort((p, q) => p - q);          // the NARROWER side of the middle
        const bl = ls.length ? ls[Math.floor(ls.length * 0.35)] : x1, br = rs.length ? rs[Math.floor(rs.length * 0.35)] : x0;
        if (br <= bl) continue;
        for (let y = TOP; y < FRAY1; y++) {
          const k = (y - TOP) / (H - TOP), flare = cw * (0.01 + 0.16 * k);
          const lo = Math.max(x0, Math.round(bl - flare)), hi = Math.min(x1, Math.round(br + flare));
          let l = -1, r = -1;
          for (let x = lo; x <= hi; x++) if (A(x, y) > 96) { if (l < 0) l = x; r = x; }
          if (l < 0 || r - l < 6) continue;
          const fade = y < FRAY0 ? 1 : 1 - (y - FRAY0) / (FRAY1 - FRAY0);
          for (let x = l; x <= r; x++) {
            // (a soft edge, so the fill never shows past the strand that bounds it)
            const e = Math.min(1, (x - l + 1) / 3, (r - x + 1) / 3);
            const i = (y * W + x) * 4, shade = 1 - 0.25 * k;
            back.data[i] = 24 * shade; back.data[i + 1] = 19 * shade; back.data[i + 2] = 30 * shade;
            back.data[i + 3] = Math.round(255 * fade * e); filled++;
          }
        }
      }
      ox.putImageData(back, 0, 0);
      ox.drawImage(src, 0, 0);
      const keep = []; for (let c = 0; c < CELLS; c++) if (!DROP.includes(c)) keep.push(c);
      const out = document.createElement('canvas'); out.width = Math.round(cw * keep.length); out.height = H;
      const px2 = out.getContext('2d');
      keep.forEach((c, i) => px2.drawImage(full, Math.round(c * cw), 0, cw, H, Math.round(i * cw), 0, cw, H));
      return { url: out.toDataURL('image/webp', 0.92), W: out.width, H, filled, cells: keep.length };
    }, { b64, CELLS, DROP });
    fs.writeFileSync(OUT, Buffer.from(res.url.split(',')[1], 'base64'));
    console.log('shroudback: ' + path.relative(ROOT, OUT) + ' ' + res.W + 'x' + res.H + ', ' + res.filled + ' px backed, ' + res.cells + ' cells, ' + fs.statSync(OUT).size + ' bytes');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
