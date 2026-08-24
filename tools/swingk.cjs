// WHAT SCALE A SWING STRIP HAS TO BE DRAWN AT so the character does not change
// size the instant she attacks.
//
// A strip cell is SQUARE and the figure fills whatever fraction of it that
// swing's widest frame allows — an overhead slam needs headroom, a backhand
// needs width — while the state sheet's cells share one scale. Draw both at
// HERO_DH and she swells on one attack and shrinks on the next.
//
// So k is measured, per strip, against THE CELL THAT HOLDS THE SAME POSE as
// the sheet cell the strip replaces. That last part is the whole trick: the
// video is started FROM the sheet's pose, so one cell of the strip is that
// pose and the comparison is like for like. Measuring cell 0 blindly reads the
// burst's tuck against the sheet's arms-wide release and comes back 27% out.
//
//   k = (sheet subject / sheet cell) / (strip subject / strip cell)
//
// and js/entities.js draws the cell at HERO_DH * k. Re-run this whenever a
// strip is re-cut; the numbers belong in SWING_STRIP.
//
//   node tools/swingk.cjs [name=strip.png:cell] ...
//     with no arguments it measures the four shipped strips.
const { chromium } = require('playwright'); const fs = require('fs');
const CELLMAP = { claw_1: 13, claw_2: 14, finisher: 15, burst: 17 };
// [file, which cell shows the SAME pose as the sheet cell it replaces]. The
// indices moved when the strips were re-cut at the film's own frame rate —
// a reference cell is a moment in the move, not a fixed slot, so it has to be
// re-picked whenever the cell count changes.
const DEF = {
  claw_1: ['assets/characters/hero/swing/claw_1.webp', 0],
  claw_2: ['assets/characters/hero/swing/claw_2.webp', 4],
  finisher: ['assets/characters/hero/swing/finisher.webp', 0],
  burst: ['assets/characters/hero/swing/burst.webp', 7],
};
const args = process.argv.slice(2);
const STRIPS = args.length ? Object.fromEntries(args.map(a => {
  const [name, rest] = a.split('=');
  const [file, cell] = rest.split(':');
  return [name, [file, parseInt(cell || '0', 10)]];
})) : DEF;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.exposeFunction('bytes', f => fs.readFileSync(f).toString('base64'));
  const out = await p.evaluate(async ({ CELLMAP, STRIPS }) => {
    const load = async (f) => {
      const im = new Image();
      im.src = 'data:image/' + (f.endsWith('webp') ? 'webp' : 'png') + ';base64,' + await window.bytes(f);
      await im.decode(); return im;
    };
    // the subject's height inside one cell, at the alpha the renderer calls solid
    const boxOf = (im, sx, sw) => {
      const cv = document.createElement('canvas'); cv.width = Math.ceil(sw); cv.height = im.height;
      const c = cv.getContext('2d', { willReadFrequently: true });
      c.drawImage(im, sx, 0, sw, im.height, 0, 0, sw, im.height);
      const d = c.getImageData(0, 0, cv.width, cv.height).data;
      let y0 = cv.height, y1 = -1;
      for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++)
        if (d[((y * cv.width + x) << 2) + 3] > 60) { if (y < y0) y0 = y; if (y > y1) y1 = y; break; }
      return { h: y1 - y0 + 1, cell: cv.height };
    };
    const sheet = await load('assets/characters/hero/states.webp');
    const cw = sheet.width / 24;
    const res = {};
    for (const k of Object.keys(STRIPS)) {
      const st = await load(STRIPS[k][0]);
      const sh = boxOf(sheet, CELLMAP[k] * cw, cw);
      const sp = boxOf(st, STRIPS[k][1] * st.height, st.height);   // cells are square
      res[k] = { sheetSubj: sh.h, sheetCell: sh.cell, stripSubj: sp.h, stripCell: sp.cell,
                 cells: Math.round(st.width / st.height),
                 ref: STRIPS[k][1], k: +((sh.h / sh.cell) * (sp.cell / sp.h)).toFixed(4) };
    }
    return res;
  }, { CELLMAP, STRIPS });
  console.log('── swingk — the draw scale each swing strip owes the sheet\n');
  for (const k of Object.keys(out)) {
    const r = out[k];
    console.log('  ' + k.padEnd(9) + ' sheet ' + r.sheetSubj + '/' + r.sheetCell +
      '   strip ' + r.stripSubj + '/' + r.stripCell + ' (' + r.cells + ' cells, ref ' + r.ref + ')   k = ' + r.k);
  }
  await b.close();
})();
