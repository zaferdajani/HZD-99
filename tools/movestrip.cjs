// Build ONE MOVE's strip out of independently generated stills.
//
// tools/vidstrip.cjs cuts a strip out of a filmed take; this cuts one out of
// PLATES. The owner's charged-scratch standard (assets/source/ref/
// hzd99_heavy_standard.jpg) is a sheet of drawn keyframes, not a film, and the
// filmed route is what put a 3D-rendered cat with her back to the camera into
// the game in the first place. A plate per keyframe is the route that keeps the
// painted look and lets a bad frame be re-fired on its own.
//
// It is tools/herostates.cjs's problem with one difference that matters: the
// state sheet is a set of UNRELATED poses, so a pose popping a few pixels taller
// than its neighbour is invisible. A MOVE is consecutive — every cell plays
// against the one before it — so a scale wobble reads as her growing and
// shrinking mid-swing. Hence the same rule, harder: ONE global scale off the
// median body height, every cell foot-anchored to the same floor line, and the
// cell width measured off the widest pose rather than guessed.
//
// Input is <indir>/0.png, 1.png, ... in PLAY ORDER, each a full-body plate on a
// black field. Output is a horizontal strip of CELL x CELL cells, keyed.
//
//   node tools/movestrip.cjs <indir> <out.png> [cell=320]
//
// Then: node tools/towebp.cjs <out.png> <out.webp> 0.9
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const PAGE = `
window.cut = async (dataUrl) => {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, W, H), p = d.data;
  // Same luminance ramp herostates.cjs uses: her plating is bright, the field is
  // deep black, so a wide window keys the halo off without biting the subject.
  const LO = 22, HI = 58;
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let i = 0, q = 0; i < p.length; i += 4, q++) {
    const lum = p[i] * 0.30 + p[i + 1] * 0.59 + p[i + 2] * 0.11;
    let a = 0;
    if (lum > HI) a = 255; else if (lum > LO) a = Math.round((lum - LO) / (HI - LO) * 255);
    p[i + 3] = a;
    if (a > 140) {                        // bbox off SOLID pixels, not the bloom
      const px = q % W, py = (q / W) | 0;
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
    // THE HORIZONTAL ANCHOR IS HER FEET, NOT HER BOUNDING BOX. Centring the box
    // slides her sideways the moment an arm shoots out: the box grows to the
    // right, so its centre moves right, so her BODY slides LEFT — she moonwalks
    // backwards through her own punch. The footprint stays put through a swing,
    // so that is what the cells are registered on.
    const dx = i * CW + CW / 2 - (cell.footX - cell.x0) * scale;
    const dy = (CH - 4) - bh;             // every cell of a move is grounded
    x.drawImage(im, cell.x0, cell.y0, cell.x1 - cell.x0 + 1, cell.y1 - cell.y0 + 1,
                dx, dy, bw, bh);
  }
  // Scrub the studio pool — see herostates.cjs. Generation likes to stand her on
  // a soft white ground glow which survives keying and ships as a lamp under her
  // feet in every dark room.
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
// Where her feet are: the horizontal midpoint of the opaque pixels in the
// bottom 6% of her own box. That band is soles in every pose of a grounded move.
window.footX = async (dataUrl, x0, y0, x1, y1) => {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const W = c.width, d = x.getImageData(0, 0, W, c.height).data;
  const band = Math.max(2, Math.round((y1 - y0 + 1) * 0.06));
  let lo = x1, hi = x0, any = false;
  for (let y = y1 - band; y <= y1; y++)
    for (let px = x0; px <= x1; px++)
      if (d[(y * W + px) * 4 + 3] > 140) { if (px < lo) lo = px; if (px > hi) hi = px; any = true; }
  return any ? (lo + hi) / 2 : (x0 + x1) / 2;
};
`;

(async () => {
  const [dir, out, cellArg] = process.argv.slice(2);
  if (!dir || !out) { console.log('usage: movestrip.cjs <indir> <out.png> [cell=320]'); process.exit(1); }
  const CELL = +(cellArg || 320);

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
    r.footX = await page.evaluate(([u, a, b, c, d]) => window.footX(u, a, b, c, d),
                                  [r.url, r.x0, r.y0, r.x1, r.y1]);
    r.name = f.replace('.png', '');
    r.h = r.y1 - r.y0 + 1; r.w = r.x1 - r.x0 + 1;
    cells.push(r);
  }

  // ONE scale for the whole move, off the MEDIAN height. Not the max: one
  // over-tall plate (an arm thrown straight up) would shrink every other cell to
  // accommodate it, and she would play the move smaller than she stands.
  const hs = cells.map(c => c.h).slice().sort((a, b) => a - b);
  const med = hs[Math.floor(hs.length / 2)];
  let scale = (CELL * 0.86) / med;
  // ...then back off if the widest or tallest pose would overflow its cell. A
  // strip cell has no neighbour-bleed margin: the next cell IS the next frame.
  const widest = Math.max(...cells.map(c => c.w)), tallest = Math.max(...cells.map(c => c.h));
  scale = Math.min(scale, (CELL * 0.97) / widest, (CELL * 0.97) / tallest);

  const url = await page.evaluate(({ cells, CW, CH, scale }) => window.compose(cells, CW, CH, scale),
                                  { cells, CW: CELL, CH: CELL, scale });
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log(out + ' written — ' + cells.length + ' cells of ' + CELL + 'x' + CELL
    + ', scale ' + scale.toFixed(3) + ' (median body ' + med + 'px)');
  console.log('  heights ' + cells.map(c => c.h).join(' '));
  await browser.close();
})();
