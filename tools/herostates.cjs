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
const CW = 240, CH = 300;             // cell box, generous enough for the X of the finisher

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
  return c.toDataURL('image/png');
};
`;

(async () => {
  const [dir, out] = process.argv.slice(2);
  if (!dir || !out) { console.log('usage: herostates.cjs <indir> <out.png>'); process.exit(1); }
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
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
  const url = await page.evaluate(({ cells, CW, CH, scale }) => window.compose(cells, CW, CH, scale),
                                  { cells, CW, CH, scale });
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log(out + ' written (' + cells.length + ' x ' + CW + 'x' + CH + ', scale ' + scale.toFixed(3) + ')');
  console.log(cells.map((c, i) => i + ':' + c.name + (c.grounded ? '' : '~')).join(' '));
  await browser.close();
})();
