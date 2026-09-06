// Build HZD-99's STATE SHEET: one keyed, foot-aligned cell per pose.
//
// The turnaround (tools/herosheet.cjs) answers "which way is she facing".
// This answers "what is she doing", and it is a different problem: the poses
// were generated as independent 1:1 plates, so each one frames her at whatever
// size the generator felt like. Trimmed to their own bounding boxes and scaled
// to fill a cell, a wide pose (the finisher, arms thrown out in an X) comes out
// with a SMALLER body than a narrow one, and she visibly pops between sizes as
// the state changes. That is the same failure tools/bossparts.cjs calls out for
// whole-figure frames, and it is worse on the protagonist because you are
// looking straight at her the whole game.
//
// So nothing here trims to fit. Every plate is keyed and measured, ONE global
// scale is derived from the median GROUNDED body height, and every cell is
// placed with that same scale:
//
//   grounded poses  are anchored by their LOWEST opaque pixel to the cell floor,
//                   which is what ART_BIBLE.md §3.4 measures in the game.
//   airborne poses  are anchored by their CENTRE, because there is no contact
//                   point to align and hanging them off the floor line would
//                   bake a fake altitude into the art.
//
// The alpha key is a luminance ramp, not a threshold: the plates arrive on
// black with a bloom halo, and a hard cut leaves a dark fringe that reads as an
// outline once she is composited over a lit room.
//
//   node tools/herostates.cjs <indir> <out.png>
//
// <indir> holds one <state>.png per entry in STATES, on a black field.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

// Cell order IS the wire format: js/entities.js indexes this sheet by state
// name through HERO_CELL, so appending is safe and reordering is not.
const STATES = [
  ['idle',      true ], ['walk_a',    true ], ['walk_b',    true ],
  ['run_a',     true ], ['run_b',     false], ['rise',      false],
  ['apex',      false], ['fall',      false], ['land',      true ],
  ['dash',      false], ['skid',      true ], ['wall_cling', false],
  ['djump_jet', false], ['claw_1',    true ], ['claw_2',    true ],
  ['finisher',  true ], ['charge',    true ], ['burst',     true ],
  ['hurt',      false], ['heal',      true ], ['song',      true ],
  ['slump',     true ],
];
// Cell HEIGHT is fixed. Cell WIDTH is MEASURED, not guessed, because a fixed
// width that the widest pose overflows does not clip it — it BLEEDS into the
// neighbouring cell, and then the next pose's thrown-out arm rides beside her
// head in-game on every single idle frame. The finisher (both arms out in an X)
// is roughly twice as wide as she is tall, so guessing this wrong is the
// default outcome.
const CH = 300, CW_MARGIN = 1.10;

const PAGE = `
window.cut = async (dataUrl) => {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, W, H), p = d.data;
  // LO..HI is the ramp: below LO is background, above HI is subject, between
  // fades. Her plating is bright and the black is deep, so the window is wide.
  const LO = 22, HI = 58;
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let i = 0, q = 0; i < p.length; i += 4, q++) {
    const lum = p[i] * 0.30 + p[i + 1] * 0.59 + p[i + 2] * 0.11;
    let a = 0;
    if (lum > HI) a = 255; else if (lum > LO) a = Math.round((lum - LO) / (HI - LO) * 255);
    p[i + 3] = a;
    if (a > 140) {                       // bbox off SOLID pixels only, so the
      const px = q % W, py = (q / W) | 0; // bloom halo does not inflate her size
      if (px < x0) x0 = px; if (px > x1) x1 = px;
      if (py < y0) y0 = py; if (py > y1) y1 = py;
    }
  }
  x.putImageData(d, 0, 0);
  if (x1 < x0 || y1 < y0) return null;
  return { url: c.toDataURL('image/png'), x0, y0, x1, y1 };
};
window.compose = async (cells, CW, CH, scale) => {
  const c = document.createElement('canvas');
  c.width = CW * cells.length; c.height = CH;
  const x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const im = new Image(); im.src = cell.url; await im.decode();
    const bw = (cell.x1 - cell.x0 + 1) * scale, bh = (cell.y1 - cell.y0 + 1) * scale;
    const dx = i * CW + (CW - bw) / 2;
    // grounded: lowest pixel ON the floor line. airborne: centred in the box.
    const dy = cell.grounded ? (CH - 4) - bh : (CH - bh) / 2;
    x.drawImage(im, cell.x0, cell.y0, cell.x1 - cell.x0 + 1, cell.y1 - cell.y0 + 1,
                dx, dy, bw, bh);
  }
  // SCRUB THE STUDIO POOL. Generation renders some grounded poses standing on
  // a soft white ground glow, and it survives keying because it is bright and
  // near-opaque — then it ships as a lamp under her feet in every dark room
  // (the owner reported it three times before it was traced HERE). The pool is
  // whitish, lives in the bottom rows, and has no body above it; her feet are
  // whitish too but always continue upward into legs. So: bottom 18 rows,
  // whitish, and nothing opaque 16-26 rows above -> not her, gone.
  {
    const img = x.getImageData(0, 0, c.width, c.height), d = img.data;
    const W = c.width;
    for (let y = c.height - 18; y < c.height; y++) {
      for (let px = 0; px < W; px++) {
        const i = (y * W + px) * 4;
        if (!(d[i+3] > 8 && d[i] > 165 && d[i+1] > 160 && d[i+2] > 150)) continue;
        let leg = false;
        for (let yy = y - 26; yy <= y - 16; yy++)
          if (d[(yy * W + px) * 4 + 3] > 100) { leg = true; break; }
        if (!leg) d[i+3] = 0;
      }
    }
    x.putImageData(img, 0, 0);
  }
  return c.toDataURL('image/png');
};
`;

(async () => {
  const [dir, out] = process.argv.slice(2);
  if (!dir || !out) { console.log('usage: herostates.cjs <indir> <out.png>'); process.exit(1); }
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.addScriptTag({ content: PAGE });

  const cells = [];
  for (const [name, grounded] of STATES) {
    const f = path.join(dir, name + '.png');
    if (!fs.existsSync(f)) { console.log('MISSING ' + name); process.exit(1); }
    const b64 = fs.readFileSync(f).toString('base64');
    const r = await page.evaluate((u) => window.cut(u), 'data:image/png;base64,' + b64);
    if (!r) { console.log('EMPTY ' + name); process.exit(1); }
    r.name = name; r.grounded = grounded;
    r.h = r.y1 - r.y0 + 1; r.w = r.x1 - r.x0 + 1;
    cells.push(r);
  }

  // ONE scale for the whole sheet. Taken from the median height of the GROUNDED
  // poses: those are the ones whose real-world height is honest (she is standing
  // on something), while an airborne pose is stretched or tucked by the motion
  // and would drag the average around.
  const gh = cells.filter(c => c.grounded).map(c => c.h).sort((a, b) => a - b);
  const med = gh[Math.floor(gh.length / 2)];
  const scale = (CH * 0.82) / med;          // 0.82 leaves headroom for the tall poses
  // now the width, from the widest figure once that scale is applied
  const widest = Math.max(...cells.map(c => c.w)) * scale;
  const CW = Math.ceil(widest * CW_MARGIN / 2) * 2;   // even, so the half-width is exact
  const url = await page.evaluate(({ cells, CW, CH, scale }) => window.compose(cells, CW, CH, scale),
                                  { cells, CW, CH, scale });
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log(out + ' written (' + cells.length + ' x ' + CW + 'x' + CH + ', scale ' + scale.toFixed(3) + ')');
  console.log(cells.map((c, i) => i + ':' + c.name + (c.grounded ? '' : '~')).join(' '));
  await browser.close();
})();
