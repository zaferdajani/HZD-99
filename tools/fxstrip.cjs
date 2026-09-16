// Build an EFFECT's strip out of independently generated plates.
//
// tools/movestrip.cjs does this for a MOVE, and its two central decisions are
// both wrong for an effect:
//
//   It anchors on her feet, because a body stands on a floor. A glow has no
//   feet. Anchoring a bloom on the bottom of its own box pins the fading edge
//   and lets the bright core drift, which is precisely backwards — the core is
//   the thing the eye tracks.
//
//   It normalises to ONE scale off the median height, because a cat growing
//   mid-swing is a defect. An effect growing is the ANIMATION: heal_fx is a
//   spark that swells to a sparkle burst and falls away again, and flattening
//   that to a median leaves five drawings of the same size and no arc at all.
//
// So: anchor on the LIGHT'S CENTROID (alpha-weighted, so the bright core wins
// over the halo around it), and keep every plate's real size relative to its
// neighbours — one global factor sized so the biggest plate fits, applied to
// all of them equally.
//
// Keying is movestrip's luminance ramp unchanged, which suits a glow even
// better than a body: the field is black, so black keys to nothing, and the
// result composites as light with no matte to cut.
//
//   node tools/fxstrip.cjs <indir> <out.png> [cell=256]
//
// Input is <indir>/0.png, 1.png ... in PLAY ORDER. Then:
//   node tools/towebp.cjs <out.png> <out.webp> 0.9
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const PAGE = `
window.cut = async (dataUrl) => {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, W, H), p = d.data;
  // DOES THE PLATE ALREADY HAVE A MATTE? An effect delivered on transparency
  // arrives with the falloff the artist drew, and re-deriving alpha from
  // luminance throws that away and invents a worse one — movestrip's ramp
  // saturates everything above lum 58 to fully opaque, which is right for
  // plating (a cat's shoulder is not semi-transparent) and turns a bloom into a
  // hard blue disc with a rim. That is the "beautifully rendered wrong thing"
  // the art-prompts skill warns about, manufactured in the keyer rather than by
  // the generator. So: if the corners are already transparent, the plate brought
  // its own matte and it is kept untouched. Only a plate on a solid field gets
  // keyed, and then the ramp is STRAIGHT, because a glow's brightness is its
  // opacity.
  const corner = [[0,0],[W-1,0],[0,H-1],[W-1,H-1]]
    .every(([qx, qy]) => p[(qy * W + qx) * 4 + 3] < 8);
  const FLOOR = 14, GAIN = 255 / 205;
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  let sx = 0, sy = 0, sw = 0;
  for (let i = 0, q = 0; i < p.length; i += 4, q++) {
    let a;
    if (corner) a = p[i + 3];
    else {
      const lum = p[i] * 0.30 + p[i + 1] * 0.59 + p[i + 2] * 0.11;
      a = lum <= FLOOR ? 0 : Math.min(255, Math.round((lum - FLOOR) * GAIN));
      p[i + 3] = a;
    }
    // THE BOX IS TAKEN AT THE NOISE FLOOR, not at some comfortable threshold.
    // A bloom's alpha falls away smoothly — measured on the heal plates it runs
    // 1, 2, 3, 4, 5, 7, 12, 16, 21 ... out to the core — so a box drawn at
    // a>40 cuts that ramp off mid-slope and leaves alpha stepping from 40 to 0
    // along a straight line. Added as light that reads as a faint rectangle
    // around every frame, which is worse than the wide box it was saving.
    if (a > 3) {
      const px = q % W, py = (q / W) | 0;
      if (px < x0) x0 = px; if (px > x1) x1 = px;
      if (py < y0) y0 = py; if (py > y1) y1 = py;
      if (a > 120) { const w = a * a; sx += px * w; sy += py * w; sw += w; }
    }
  }
  if (!corner) x.putImageData(d, 0, 0);
  if (x1 < x0 || y1 < y0 || !sw) return null;
  return { url: c.toDataURL('image/png'), x0, y0, x1, y1,
           cx: sx / sw, cy: sy / sw, keyed: !corner };
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
    // centroid to cell centre — the core sits still and the light breathes
    // around it, which is what the plates were drawn to do
    const dx = i * CW + CW / 2 - (cell.cx - cell.x0) * scale;
    const dy = CH / 2 - (cell.cy - cell.y0) * scale;
    x.drawImage(im, cell.x0, cell.y0, cell.x1 - cell.x0 + 1, cell.y1 - cell.y0 + 1,
                dx, dy, bw, bh);
  }
  return c.toDataURL('image/png');
};
`;

(async () => {
  const argv = process.argv.slice(2);
  const [dir, out, cellArg] = argv;
  if (!dir || !out) { console.log('usage: fxstrip.cjs <indir> <out.png> [cell=256]'); process.exit(1); }
  const CELL = +(cellArg || 256);

  const files = fs.readdirSync(dir).filter(f => /^\d+\.png$/.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b));
  if (!files.length) { console.log('no numbered plates in ' + dir); process.exit(1); }

  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.addScriptTag({ content: PAGE });

  const cells = [];
  for (const f of files) {
    const b64 = fs.readFileSync(path.join(dir, f)).toString('base64');
    const r = await page.evaluate((u) => window.cut(u), 'data:image/png;base64,' + b64);
    if (!r) { console.log('EMPTY ' + f); process.exit(1); }
    r.name = f.replace('.png', '');
    r.h = r.y1 - r.y0 + 1; r.w = r.x1 - r.x0 + 1;
    cells.push(r);
  }

  // ONE factor, off the LARGEST plate — the opposite of movestrip's median, and
  // for the opposite reason. There the outlier is an accident to be absorbed;
  // here the biggest frame is the peak of the effect and the cell has to hold
  // it. The centroid is rarely the middle of the box, so the reach that must fit
  // is measured from the centroid outwards, not as the box's own width.
  let need = 0;
  for (const c of cells) {
    need = Math.max(need, c.cx - c.x0, c.x1 - c.cx, c.cy - c.y0, c.y1 - c.cy);
  }
  const scale = (CELL / 2 * 0.98) / need;

  const url = await page.evaluate(({ cells, CW, CH, scale }) => window.compose(cells, CW, CH, scale),
                                  { cells, CW: CELL, CH: CELL, scale });
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log(out + ' written — ' + cells.length + ' cells of ' + CELL + 'x' + CELL
    + ', scale ' + scale.toFixed(3) + ' (max reach ' + need.toFixed(0) + 'px from centroid)');
  console.log('  box sizes ' + cells.map(c => c.w + 'x' + c.h).join(' '));
  const keyed = cells.filter(c => c.keyed).length;
  console.log('  matte: ' + (cells.length - keyed) + ' plate(s) kept their own alpha, '
    + keyed + ' keyed off a solid field');
  await browser.close();
})();
