// Lay keyed STILLS into a strip the game draws like a video cut.
//
// Some transitions are two or three drawings rather than a clip — the skid's
// brace and whip-round, the jump's stretch / tuck / reach, the wall's cling,
// slip and catch. They ship in the same shape tools/vidstrip.cjs writes so
// drawStripCell needs no second path: square cells, ONE scale across the
// strip (a figure that changes size between cells is the "swells and shrinks"
// the owner reported), each figure's feet on the cell floor, centred.
//
// Inputs are plates with REAL alpha — key them with tools/blackkey.cjs first.
//
//   node tools/stillstrip.cjs <out.png> <cell> <plate.png> [plate.png ...]
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [out, cellArg, ...plates] = process.argv.slice(2);
  if (!out || !cellArg || !plates.length) { console.error('usage: stillstrip.cjs <out.png> <cell> <plate.png>...'); process.exit(2); }
  const CELL = parseInt(cellArg, 10);
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.exposeFunction('bytes', f => fs.readFileSync(f).toString('base64'));
  const res = await p.evaluate(async ({ plates, CELL }) => {
    const figs = [];
    for (const f of plates) {
      const im = new Image(); im.src = 'data:image/png;base64,' + await window.bytes(f); await im.decode();
      const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
      const c = cv.getContext('2d', { willReadFrequently: true }); c.drawImage(im, 0, 0);
      const d = c.getImageData(0, 0, cv.width, cv.height).data;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++)
        if (d[(y * cv.width + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      figs.push({ im, x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
    }
    // one scale for the strip: the biggest figure fills 92% of the cell
    const s = Math.min(...figs.map(f => Math.min(CELL * 0.92 / f.w, CELL * 0.92 / f.h)));
    const cv = document.createElement('canvas'); cv.width = CELL * figs.length; cv.height = CELL;
    const c = cv.getContext('2d'); c.imageSmoothingQuality = 'high';
    figs.forEach((f, i) => {
      const dw = f.w * s, dh = f.h * s;
      c.drawImage(f.im, f.x0, f.y0, f.w, f.h, i * CELL + (CELL - dw) / 2, CELL - dh - CELL * 0.02, dw, dh);
    });
    return { png: cv.toDataURL('image/png'), s, sizes: figs.map(f => f.w + 'x' + f.h) };
  }, { plates, CELL });
  fs.writeFileSync(out, Buffer.from(res.png.split(',')[1], 'base64'));
  console.log(out, plates.length + ' cells @ ' + CELL, 'scale ' + res.s.toFixed(3), res.sizes.join(' '));
  await b.close();
})();
