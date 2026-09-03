// Lay keyed turnaround PLATES into the 6-column NPC sheet the game slices.
//
// tools/turnsheet.cjs cut generated strips; the painted cast was fired one
// yaw per plate (each cell of the old sheet, blurred, as the shape reference),
// so the sheet is assembled from named files instead. Same contract as the
// sheet atlas.js reads: cols 0..5 = right profile, 3/4 right, front, 3/4 left,
// left profile, back; one row per character in ATLAS.sub order.
//
// ONE SCALE PER ROW. A turntable that changes size between yaws pumps as the
// body turns, so every cell of a row is scaled by the tallest plate in that
// row, and every figure stands on the cell floor. The cell is 4x the old
// sheet's (600x780 against 150x195): the old cells were the pixelation the
// owner saw, and the atlas reads fractions, so the game does not care.
//
//   node tools/yawsheet.cjs <platedir> <out.png> row1 row2 ...   (files <row>_<col>.png)
//   --cols=8 for an eight-yaw sheet (the creature roster); default 6.
//   --cw=624 --ch=456 cell size; --fill=1 --floor=0 how much of the cell the
//   tallest figure takes and the gap under the feet (the roster's old rows are
//   laid TIGHT, fill 1.0, and drawAtlas sizes by the cell, so a looser row
//   would draw every enemy smaller).
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const argv = process.argv.slice(2);
  const colsArg = argv.find(a => a.startsWith('--cols='));
  const [dir, out, ...rows] = argv.filter(a => !a.startsWith('--'));
  if (!dir || !out || !rows.length) { console.error('usage: yawsheet.cjs <platedir> <out.png> row... [--cols=N]'); process.exit(2); }
  const COLS = colsArg ? parseInt(colsArg.split('=')[1], 10) : 6;
  const opt = (k, d) => { const a = argv.find(x => x.startsWith('--' + k + '=')); return a ? parseFloat(a.split('=')[1]) : d; };
  const CW = opt('cw', COLS === 6 ? 600 : 480), CH = opt('ch', COLS === 6 ? 780 : 480);
  const FILL = opt('fill', 0.96), FLOOR = opt('floor', 0.02);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.exposeFunction('bytes', f => fs.existsSync(f) ? fs.readFileSync(f).toString('base64') : '');
  const res = await p.evaluate(async ({ dir, rows, CW, CH, COLS, FILL, FLOOR }) => {
    const cv = document.createElement('canvas'); cv.width = CW * COLS; cv.height = CH * rows.length;
    const c = cv.getContext('2d'); c.imageSmoothingQuality = 'high';
    const log = [];
    for (let r = 0; r < rows.length; r++) {
      const figs = [];
      for (let col = 0; col < COLS; col++) {
        const b64 = await window.bytes(dir + '/' + rows[r] + '_' + col + '.png');
        if (!b64) { figs.push(null); continue; }
        const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
        const t = document.createElement('canvas'); t.width = im.width; t.height = im.height;
        const tc = t.getContext('2d', { willReadFrequently: true }); tc.drawImage(im, 0, 0);
        const d = tc.getImageData(0, 0, t.width, t.height).data;
        let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
        for (let y = 0; y < t.height; y++) for (let x = 0; x < t.width; x++)
          if (d[(y * t.width + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        figs.push({ im, x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
      }
      const have = figs.filter(Boolean);
      const s = Math.min(...have.map(f => Math.min(CH * FILL / f.h, CW * 0.96 / f.w)));
      figs.forEach((f, col) => {
        if (!f) { log.push(rows[r] + '_' + col + ' MISSING'); return; }
        const dw = f.w * s, dh = f.h * s;
        c.drawImage(f.im, f.x0, f.y0, f.w, f.h, col * CW + (CW - dw) / 2, r * CH + CH * (1 - FLOOR) - dh, dw, dh);
      });
      log.push(rows[r] + ' scale ' + s.toFixed(3) + ' heights ' + figs.map(f => f ? Math.round(f.h * s) : '-').join('/'));
    }
    return { png: cv.toDataURL('image/png'), log };
  }, { dir, rows, CW, CH, COLS, FILL, FLOOR });
  fs.writeFileSync(out, Buffer.from(res.png.split(',')[1], 'base64'));
  console.log(res.log.join('\n')); console.log(out);
  await b.close();
})();
