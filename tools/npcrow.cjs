// APPEND ONE SUBJECT'S SIX-VIEW ROW TO THE SHARED NPC TURNAROUND SHEET.
//
// assets/characters/npc_6yaw.webp is a 6-column grid of 300x390 cells, one row
// per machine person, indexed by row in ATLAS2. tools/turnsheet.cjs built it
// once from seven subjects and then it was full: every row taken, and the
// eighth cast member (Kerf, ART_QUEUE §2aq) had nowhere to live. Her brief
// names that as her blocker in so many words.
//
// Rebuilding the sheet to add one row would re-fire seven subjects that are
// already approved and shipped, so this GROWS it: key the new strip, find the
// six figures in it, fit each into the existing cell on ONE shared scale, and
// paste them underneath as a new row. Nothing above the new row is read back
// out and rewritten — those rows are the owner's and they are left exactly as
// they are.
//
//   node tools/npcrow.cjs <strip.png> <row-name>
//
// THE VIEWS ARE FOUND, NOT ASSUMED. Cutting the strip into six equal slices
// puts the seam through a leg the moment the generator spaces the views even
// slightly unevenly, which it does. Transparent gutters give the real columns.
//
// ONE SCALE FOR ALL SIX, off the tallest figure, because a turnaround whose
// views are individually normalised is a character that changes size as it
// turns — the same rule tools/movestrip.cjs states for a move.
const { chromium } = require('playwright');
const fs = require('fs');

const SHEET = 'assets/characters/npc_6yaw.webp';
const COLS = 6;

(async () => {
  const [strip, name] = process.argv.slice(2);
  if (!strip || !name) { console.log('usage: npcrow.cjs <strip.png> <row-name>'); process.exit(1); }

  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.exposeFunction('sheetB64', () => fs.readFileSync(SHEET).toString('base64'));
  await page.exposeFunction('stripB64', () => fs.readFileSync(strip).toString('base64'));

  const res = await page.evaluate(async (COLS) => {
    const load = async (u) => { const im = new Image(); im.src = u; await im.decode(); return im; };
    const sheet = await load('data:image/webp;base64,' + await window.sheetB64());
    const src = await load('data:image/png;base64,' + await window.stripB64());
    const CW = sheet.naturalWidth / COLS;
    const rows = Math.round(sheet.naturalHeight / (CW * 1.3));
    const CH = sheet.naturalHeight / rows;

    // --- key the strip's near-black field, then find the figures -------------
    const sc = document.createElement('canvas');
    sc.width = src.naturalWidth; sc.height = src.naturalHeight;
    const sx = sc.getContext('2d', { willReadFrequently: true });
    sx.drawImage(src, 0, 0);
    const d = sx.getImageData(0, 0, sc.width, sc.height), p = d.data;
    // the field is near-black but carries a faint bloom, so the ramp is soft
    const LO = 20, HI = 60;
    for (let i = 0; i < p.length; i += 4) {
      const lum = p[i] * 0.30 + p[i+1] * 0.59 + p[i+2] * 0.11;
      p[i+3] = lum <= LO ? 0 : lum >= HI ? 255 : Math.round((lum - LO) / (HI - LO) * 255);
    }
    sx.putImageData(d, 0, 0);

    const A = (x, y) => p[(y * sc.width + x) * 4 + 3];
    const col = [];
    for (let x = 0; x < sc.width; x++) {
      let n = 0;
      for (let y = 0; y < sc.height; y++) if (A(x, y) > 24) n++;
      col[x] = n > 0;
    }
    let runs = [], s0 = -1;
    for (let x = 0; x < sc.width; x++) {
      if (col[x] && s0 < 0) s0 = x;
      else if (!col[x] && s0 >= 0) { runs.push([s0, x - 1]); s0 = -1; }
    }
    if (s0 >= 0) runs.push([s0, sc.width - 1]);
    runs = runs.filter(r => r[1] - r[0] + 1 > sc.width * 0.02);
    if (runs.length !== COLS) return { error: 'found ' + runs.length + ' figures, need ' + COLS, runs };

    // vertical extent per figure, and the shared scale off the tallest
    const figs = runs.map(([x0, x1]) => {
      let y0 = sc.height, y1 = 0;
      for (let y = 0; y < sc.height; y++) for (let x = x0; x <= x1; x++)
        if (A(x, y) > 24) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
      return { x0, x1, y0, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    });
    const tallest = Math.max(...figs.map(f => f.h));
    const widest = Math.max(...figs.map(f => f.w));
    // fill the cell the way the existing rows do: a margin all round, and never
    // wider than the cell or the neighbouring view bleeds into it
    const scale = Math.min((CH * 0.86) / tallest, (CW * 0.92) / widest);

    // --- compose the grown sheet --------------------------------------------
    const out = document.createElement('canvas');
    out.width = sheet.naturalWidth; out.height = CH * (rows + 1);
    const ox = out.getContext('2d');
    ox.imageSmoothingQuality = 'high';
    ox.drawImage(sheet, 0, 0);                       // every existing row, untouched
    figs.forEach((f, i) => {
      const w = f.w * scale, h = f.h * scale;
      const dx = i * CW + (CW - w) / 2;              // centred in its column
      const dy = rows * CH + (CH - 4) - h;           // standing on the cell floor
      ox.drawImage(sc, f.x0, f.y0, f.w, f.h, dx, dy, w, h);
    });
    return {
      url: out.toDataURL('image/png'),
      cell: CW + 'x' + CH, wasRows: rows, newRow: rows,
      scale: +scale.toFixed(3),
      figures: figs.map(f => f.w + 'x' + f.h),
      size: out.width + 'x' + out.height,
    };
  }, COLS);

  if (res.error) { console.log('FAILED: ' + res.error + ' ' + JSON.stringify(res.runs)); await browser.close(); process.exit(1); }
  fs.writeFileSync('/tmp/npcrow_out.png', Buffer.from(res.url.split(',')[1], 'base64'));
  console.log(name + ': cell ' + res.cell + ', was ' + res.wasRows + ' rows, new row index ' + res.newRow);
  console.log('  figures ' + res.figures.join(' ') + '  one scale ' + res.scale);
  console.log('  grown sheet ' + res.size + ' -> /tmp/npcrow_out.png (encode with tools/towebp.cjs)');
  await browser.close();
})();
