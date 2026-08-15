// THE LOW TIER — a quarter-scale copy of every sheet that is safe to have one.
//
// WHAT PROBLEM THIS SOLVES. The lazy media map means a sheet is fetched the
// first time something draws it, and until it lands the renderer falls back to
// the procedural version — a different drawing, not a rougher one. On a phone
// that reads as the room changing its mind: procedural floor, then authored
// floor; grey wolf shape, then wolf. preload.js already fixed the common case
// by fetching ahead over the room graph, but "ahead" is only as good as the
// connection, and the heaviest room is 3.6 MB.
//
// So: a second copy of each sheet at 25% linear scale — about a sixteenth of
// the pixels, and with webp usually well under a twentieth of the bytes. The
// game asks for both when it needs a sheet NOW, and whichever arrives first is
// drawn. The result is that the room is RIGHT immediately (correct art, correct
// silhouettes, correct colours, just soft) and sharpens a moment later, instead
// of being a different picture that gets replaced.
//
// WHY NOT ALL OF THEM. Six sheets in this game are parts atlases addressed with
// ABSOLUTE PIXEL RECTANGLES — `c.drawImage(im, s[0], s[1], s[2], s[3], …)` in
// beast.js, eagle.js, glaciere.js, furnace.js, prism.js and mother.js, where
// the s[] tables are pixel coordinates measured against the full-size sheet.
// Hand one of those a quarter-scale image and every guardian is assembled out
// of the wrong quarter of itself. Everything else in the game slices
// PROPORTIONALLY (`im.width / cols`, `im.width / HERO_CELLS`) or draws the
// whole image, and proportional slicing does not care how big the sheet is.
//
// That rule is what SKIP encodes, and tests/lowres.cjs re-derives it from the
// source rather than trusting this list — a seventh atlas with a rect table
// would otherwise be a silent corruption six months from now.
//
//   node tools/lowres.cjs            # rebuild the whole tier
//   node tools/lowres.cjs --check    # report only, write nothing
//
// Writes assets/lowres/<key>.webp and assets/lowres/index.json, which build.cjs
// compiles into the page as window.LOWRES.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCALE = 0.25;
const QUALITY = 0.62;
// below this there is nothing to save and a second request costs more than the
// bytes it avoids
const MIN_BYTES = 120 * 1024;

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'lowres');

// the six parts atlases, by media key. See the note above.
const SKIP = new Set(['beastParts', 'eagleParts', 'glaciereParts', 'dragonParts',
  'prismParts', 'motherParts']);

function manifest() {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'media.js'), 'utf8');
  const seg = src.split('images: {')[1].split(/\n  },/)[0];
  const re = /^\s*([a-zA-Z0-9_]+):\s*'([^']+)'/gm;
  const out = {}; let m;
  while ((m = re.exec(seg))) out[m[1]] = m[2];
  return out;
}

(async () => {
  const check = process.argv.includes('--check');
  const IM = manifest();
  if (!check) fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const index = {};
  let full = 0, low = 0, skipped = 0, small = 0;

  for (const key of Object.keys(IM)) {
    const rel = IM[key];
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const size = fs.statSync(abs).size;
    if (SKIP.has(key)) { skipped++; continue; }
    if (size < MIN_BYTES) { small++; continue; }
    const b64 = fs.readFileSync(abs).toString('base64');
    const mime = /\.png$/i.test(rel) ? 'image/png' : 'image/jpeg';
    const r = await page.evaluate(async ({ b64, mime, SCALE, QUALITY }) => {
      const im = new Image();
      await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = 'data:' + mime + ';base64,' + b64; });
      const W = Math.max(1, Math.round(im.naturalWidth * SCALE));
      const H = Math.max(1, Math.round(im.naturalHeight * SCALE));
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const c = cv.getContext('2d');
      // the browser's own downscale filter, which is a proper box filter at
      // this ratio — a nearest-neighbour quarter would alias the keyed edges
      // into a dotted line, which is exactly what these plates must not do
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(im, 0, 0, W, H);
      // webp, because it is the only format here that carries ALPHA and still
      // compresses like a photo — half these sheets are keyed cut-outs and a
      // jpeg stand-in would put a black box where the transparency was
      return { url: cv.toDataURL('image/webp', QUALITY), w: W, h: H,
               fw: im.naturalWidth, fh: im.naturalHeight };
    }, { b64, mime, SCALE, QUALITY });
    if (!/^data:image\/webp/.test(r.url)) {
      console.log('  !! ' + key + ' — no webp encoder, skipping');
      continue;
    }
    const buf = Buffer.from(r.url.split(',')[1], 'base64');
    const name = key + '.webp';
    if (!check) fs.writeFileSync(path.join(OUT, name), buf);
    index[key] = 'assets/lowres/' + name;
    full += size; low += buf.length;
    console.log('  ' + key.padEnd(16) + (size / 1024).toFixed(0).padStart(6) + ' KB -> '
      + (buf.length / 1024).toFixed(0).padStart(5) + ' KB   '
      + r.fw + 'x' + r.fh + ' -> ' + r.w + 'x' + r.h);
  }
  await browser.close();
  if (!check) fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
  console.log('\n' + Object.keys(index).length + ' sheets:  '
    + (full / 1048576).toFixed(1) + ' MB -> ' + (low / 1048576).toFixed(2) + ' MB  ('
    + (low / full * 100).toFixed(1) + '%)');
  console.log(skipped + ' skipped (absolute-rect parts atlases), ' + small + ' already small enough');
})().catch(e => { console.error(e); process.exit(1); });
