// Turn generated turnaround STRIPS into one atlas sheet the game can slice.
//
// The generator will not be told how many cells to draw. Ask for eight and it
// draws six; ask again and it draws six somewhere else. So nothing here assumes
// a grid: it keys the black backdrop out to alpha, measures how much subject
// sits in each column, and cuts the strip at the empty gutters between figures.
// That is robust to any count and any spacing, which a fixed slice is not.
//
// Two strips per character, because one render only ever covers half a turn:
//   LEFT strip   left profile -> 3/4 left -> front -> ... -> back
//   RIGHT strip  3/4 right -> right profile -> back
// and the sheet is assembled from named picks out of both, so the finished row
// is a real turntable and NOTHING IS EVER MIRRORED. Mirroring would flip the
// lit side onto the shadow side, and the world-fixed key light is the entire
// reason these read as volumes rather than as pictures.
//
//   node tools/turnsheet.cjs <indir> <out.png>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

// row order in the finished sheet, and where each column comes from.
// L<n> = nth detected figure in the left strip, R<n> = nth in the right strip.
// Column order matches the sheet the game already reads: 0 faces screen-RIGHT
// and 4 faces screen-LEFT, because that is what yawColF() maps facing onto.
// Column 5 is the back, kept for scripted moments. -1 = last figure detected.
const COLS = ['R1', 'R0', 'L2', 'L1', 'L0', 'L-1'];
const SUBJECTS = ['servo', 'ratchet', 'mono', 'patch', 'sage', 'lumen', 'guard'];
const CW = 200, CH = 260;                              // cell size in the sheet

const PAGE = `
// --- key the black backdrop out, and report where the figures are -----------
window.cutStrip = async (dataUrl) => {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, W, H), p = d.data;
  // The backdrop is near-black but not pure: there is a faint floor gradient
  // and a bloom halo around each figure. A flat threshold either eats the dark
  // parts of a gunmetal robot or keeps the halo, so alpha RAMPS across a band
  // — below it is background, above it is subject, between it fades.
  const LO = 26, HI = 62;
  const col = new Float64Array(W);
  for (let i = 0, q = 0; i < p.length; i += 4, q++) {
    const lum = p[i] * 0.30 + p[i + 1] * 0.59 + p[i + 2] * 0.11;
    let a = 0;
    if (lum > HI) a = 255;
    else if (lum > LO) a = Math.round((lum - LO) / (HI - LO) * 255);
    p[i + 3] = a;
    if (a > 140) col[q % W] += 1;
  }
  x.putImageData(d, 0, 0);
  // columns with real subject in them, split at the gutters
  const thresh = Math.max(2, H * 0.012);
  const bands = [];
  let s = -1;
  for (let i = 0; i < W; i++) {
    const on = col[i] > thresh;
    if (on && s < 0) s = i;
    else if (!on && s >= 0) { bands.push([s, i]); s = -1; }
  }
  if (s >= 0) bands.push([s, W]);
  // merge bands separated by less than a figure's width of gutter — a raised
  // arm or a dangling trinket can break one character into two bands
  const merged = [];
  for (const b of bands) {
    const last = merged[merged.length - 1];
    if (last && b[0] - last[1] < W * 0.018) last[1] = b[1];
    else merged.push(b.slice());
  }
  const figs = merged.filter(b => (b[1] - b[0]) > W * 0.025);
  // vertical extent per figure, so each one can be cropped to its own box
  const boxes = figs.map(([x0, x1]) => {
    let y0 = H, y1 = 0;
    for (let y = 0; y < H; y++) {
      let hit = 0;
      for (let xx = x0; xx < x1; xx += 2) if (p[(y * W + xx) * 4 + 3] > 140) { hit++; if (hit > 2) break; }
      if (hit > 2) { if (y < y0) y0 = y; y1 = y; }
    }
    return { x0, x1, y0, y1: y1 + 1 };
  }).filter(b => b.y1 > b.y0 + H * 0.05);
  window.__strip = { url: c.toDataURL('image/png'), boxes, W, H };
  return boxes;
};
// --- paste one cropped figure into a cell, grounded and centred -------------
window.pasteCell = async (dataUrl, box, col, row, CW, CH) => {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const x = window.__sheet.getContext('2d');
  const bw = box.x1 - box.x0, bh = box.y1 - box.y0;
  // Normalise by HEIGHT, not by a single scale for the row. A turnaround whose
  // subject changes size between angles reads as a zoom rather than a rotation
  // — and the two source renders framed their subject at different distances,
  // so preserving their relative sizes preserves exactly the wrong thing. A
  // machine is very nearly the same height from every angle; its width is not,
  // so height is the honest thing to match and width only clamps an overflow.
  let k = (CH * 0.84) / bh;
  if (bw * k > CW * 0.92) k = (CW * 0.92) / bw;
  const dw = bw * k, dh = bh * k;
  const dx = col * CW + (CW - dw) / 2;
  const dy = row * CH + (CH - dh) - CH * 0.04;         // feet near the cell floor
  x.drawImage(img, box.x0, box.y0, bw, bh, dx, dy, dw, dh);
};
`;

async function main() {
  const [indir, out] = process.argv.slice(2);
  if (!indir || !out) { console.log('usage: turnsheet.cjs <indir> <out.png>'); process.exit(1); }
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.addScriptTag({ content: PAGE });
  await page.evaluate(({ w, h }) => {
    window.__sheet = document.createElement('canvas');
    window.__sheet.width = w; window.__sheet.height = h;
  }, { w: COLS.length * CW, h: SUBJECTS.length * CH });

  const report = [];
  for (let row = 0; row < SUBJECTS.length; row++) {
    const s = SUBJECTS[row];
    const strips = {};
    for (const side of ['', '_r']) {
      const f = path.join(indir, s + side + '.png');
      if (!fs.existsSync(f)) { strips[side || 'L'] = null; continue; }
      const url = 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
      const boxes = await page.evaluate(u => window.cutStrip(u), url);
      const keyed = await page.evaluate(() => window.__strip.url);
      strips[side === '_r' ? 'R' : 'L'] = { url: keyed, boxes };
    }
    if (!strips.L) { console.log(s + ': NO LEFT STRIP — skipped'); continue; }
    // one scale for the whole row, from the tallest figure that will be used
    const pick = (tag) => {
      const side = tag[0] === 'R' ? strips.R : strips.L;
      if (!side || !side.boxes.length) return null;
      let i = parseInt(tag.slice(1), 10);
      if (i < 0) i = side.boxes.length + i;
      return side.boxes[i] ? { url: side.url, box: side.boxes[i] } : null;
    };
    const picks = COLS.map(pick);
    const used = picks.filter(Boolean);
    if (!used.length) { console.log(s + ': nothing detected'); continue; }
    const scale = Math.min(...used.map(u =>
      Math.min((CW * 0.86) / (u.box.x1 - u.box.x0), (CH * 0.88) / (u.box.y1 - u.box.y0))));
    await page.evaluate(k => { window.__rowScale = k; }, scale);
    for (let col = 0; col < COLS.length; col++) {
      // a missing angle falls back to the nearest one that exists, so a row is
      // never a hole — a hole would draw nothing at all in game
      const p2 = picks[col] || used[Math.min(col, used.length - 1)];
      await page.evaluate(async ({ url, box, col, row, CW, CH }) =>
        window.pasteCell(url, box, col, row, CW, CH), { url: p2.url, box: p2.box, col, row, CW, CH });
    }
    report.push(s + ': left=' + strips.L.boxes.length + ' right=' + (strips.R ? strips.R.boxes.length : 0) +
      ' cells=' + picks.map((p2, i) => p2 ? COLS[i] : '·').join(','));
  }
  // DID IT ACTUALLY TURN? The generator does not always obey a direction: asked
  // for a right-facing profile it will happily hand back the left-facing one
  // again, and a row assembled from two identical half-turns looks like a
  // finished turnaround right up until the character walks the other way and
  // does not change. Column 0 and column 4 are opposite profiles, so they must
  // be the LEAST similar pair in the row. If they are not, say so by name.
  const turn = await page.evaluate(({ CW, CH, cols, rows }) => {
    const x = window.__sheet.getContext('2d');
    const cell = (col, row) => x.getImageData(col * CW, row * CH, CW, CH).data;
    const diff = (a, b) => {
      let s = 0, n = 0;
      for (let i = 0; i < a.length; i += 4 * 7) {
        s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 3] - b[i + 3]); n++;
      }
      return s / n;
    };
    const out = [];
    for (let r = 0; r < rows; r++) out.push(diff(cell(0, r), cell(4, r)));
    return out;
  }, { CW, CH, cols: COLS.length, rows: SUBJECTS.length });
  console.log('\nprofile-to-profile difference (higher = a real turn):');
  turn.forEach((d, i) => console.log('  ' + SUBJECTS[i].padEnd(9) + d.toFixed(1) +
    (d < 12 ? '   <-- SUSPECT: both profiles face the same way' : '')));

  const url = await page.evaluate(() => window.__sheet.toDataURL('image/png'));
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  await browser.close();
  console.log(report.join('\n'));
  console.log('\n' + out + '  ' + (COLS.length * CW) + 'x' + (SUBJECTS.length * CH) +
    '  ' + (fs.statSync(out).size / 1024 | 0) + 'K   (' + COLS.length + ' cols x ' + SUBJECTS.length + ' rows)');
}
main().catch(e => { console.error(e); process.exit(1); });
