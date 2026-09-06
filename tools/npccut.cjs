// Cut one NPC out of the npc_6yaw turnaround as a generation source.
//
// The standing NPCs live as CELLS of a 6x7 atlas, which is the wrong shape to
// hand a generator: it invents a background behind transparency (see
// tools/plateprep.cjs) and it re-composes a non-square frame to fill 1:1. So a
// cell is lifted, cropped to its own alpha box, and laid on flat black in a
// 1024 square with a little air around it — the same preparation every other
// plate in this pipeline gets, for the same two reasons.
//
// COL 1 is the three-quarter angle. It is the one the work loops were fired
// from (js/game.js NPC_LOOP), which is why it is the default: a front-on cell
// gives the generator no side to work the character's own bench from.
//
//   S=<outdir> [COL=1] node tools/npccut.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const ROWS = { servo:0, ratchet:1, mono:2, patch:3, sage:4, lumen:5, guard:6 };
(async () => {
  const S = process.env.S, COL = +(process.env.COL || 1);
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.exposeFunction('by', () => fs.readFileSync('assets/characters/npc_6yaw.webp').toString('base64'));
  const out = await p.evaluate(async ({ ROWS, COL }) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + await window.by(); await im.decode();
    const CW = im.width / 6, CH = im.height / 7;
    const res = { size: im.width + 'x' + im.height, cells: {} };
    for (const name in ROWS) {
      const cv = document.createElement('canvas');
      cv.width = 1024; cv.height = 1024;
      const c = cv.getContext('2d', { willReadFrequently: true });
      c.imageSmoothingQuality = 'high';
      // the cell, fitted into a square on black with a little air
      const tmp = document.createElement('canvas'); tmp.width = CW; tmp.height = CH;
      const tc = tmp.getContext('2d', { willReadFrequently: true });
      tc.drawImage(im, COL * CW, ROWS[name] * CH, CW, CH, 0, 0, CW, CH);
      const d = tc.getImageData(0, 0, CW, CH).data;
      let x0 = CW, y0 = CH, x1 = -1, y1 = -1;
      for (let i = 3, q = 0; i < d.length; i += 4, q++) {
        if (d[i] < 30) continue;
        const x = q % CW, y = (q / CW) | 0;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      if (x1 < 0) { res.cells[name] = null; continue; }
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      c.fillStyle = '#000'; c.fillRect(0, 0, 1024, 1024);
      const s = Math.min(880 / bw, 880 / bh);
      c.drawImage(tmp, x0, y0, bw, bh, (1024 - bw * s) / 2, (1024 - bh * s) / 2, bw * s, bh * s);
      res.cells[name] = cv.toDataURL('image/png');
    }
    return res;
  }, { ROWS, COL });
  console.log(out.size);
  for (const n in out.cells) {
    if (!out.cells[n]) { console.log('  ' + n + ': EMPTY'); continue; }
    fs.writeFileSync(S + '/npcsrc/' + n + '.png', Buffer.from(out.cells[n].split(',')[1], 'base64'));
    console.log('  ' + n);
  }
  await b.close();
})();
