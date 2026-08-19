// THE ART BOOK — one page that shows every character in the drawn cast.
//
// The plates live in assets/source/*/drawnA as 1024² cutouts. A page that
// embedded those raw would be 90 MB and unopenable, so this derives the book
// tier the same way tools/lowres.cjs derives the shipped tier (RULE ZERO):
// crop each cutout to its own alpha box, fit it to a short edge, and encode
// webp — the masters stay untouched on disk.
//
// The crop matters more than the encode. A 1024² plate of a bat is mostly
// nothing; cropping to the ink is what lets 90 plates sit in one grid at a
// readable size instead of 90 stamps floating in 90 empty squares.
//
//   node tools/artbook.cjs <template.html> <out.html>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
// [key prefix, directory, max edge, webp quality, crop to alpha]
const SETS = [
  ['hero', 'assets/source/hero/drawnA', 560, 0.78, true],
  ['cast', 'assets/source/cast/drawnA', 520, 0.76, true],
  ['cover', 'assets/source/hero/drawnA', 1000, 0.86, true, ['idle', 'apex', 'finisher']],
  ['guardian', 'docs', 1800, 0.82, false, null, /^drawn_(nullfang|talonhost|glaciere|choir|prism|mother)\.png$/],
];

(async () => {
  const [tpl, out] = process.argv.slice(2);
  if (!tpl || !out) { console.error('usage: artbook.cjs <template.html> <out.html>'); process.exit(2); }

  const jobs = [];
  for (const [pre, dir, edge, q, crop, only, re] of SETS) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) { console.log('  (skip ' + dir + ' — not on disk)'); continue; }
    for (const f of fs.readdirSync(full).sort()) {
      if (!/\.png$/i.test(f)) continue;
      if (re && !re.test(f)) continue;
      const base = f.replace(/\.png$/i, '');
      if (only && !only.includes(base)) continue;
      jobs.push({ key: pre + ':' + base.replace(/^drawn_/, ''), file: path.join(full, f), edge, q, crop });
    }
  }

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  // one plate at a time over the bridge: handing 90 MB of base64 to a single
  // evaluate() kills the page outright
  await page.exposeFunction('plateBytes', f => fs.readFileSync(f).toString('base64'));
  await page.setContent('<canvas id=c></canvas>');

  const plates = {};
  let bytes = 0;
  for (const j of jobs) {
    const uri = await page.evaluate(async ({ file, edge, q, crop }) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + await window.plateBytes(file);
      await img.decode();
      const cv = document.createElement('canvas');
      const c = cv.getContext('2d', { willReadFrequently: true });
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (crop) {
        cv.width = img.width; cv.height = img.height;
        c.drawImage(img, 0, 0);
        const d = c.getImageData(0, 0, cv.width, cv.height).data;
        let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
        for (let i = 3, p = 0; i < d.length; i += 4, p++) {
          if (d[i] < 12) continue;
          const x = p % cv.width, y = (p / cv.width) | 0;
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
        if (x1 >= x0) {
          const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.035);
          sx = Math.max(0, x0 - pad); sy = Math.max(0, y0 - pad);
          sw = Math.min(cv.width - sx, x1 - x0 + 1 + pad * 2);
          sh = Math.min(cv.height - sy, y1 - y0 + 1 + pad * 2);
        }
      }
      const s = Math.min(1, edge / Math.max(sw, sh));
      const w = Math.max(1, Math.round(sw * s)), h = Math.max(1, Math.round(sh * s));
      cv.width = w; cv.height = h;
      c.clearRect(0, 0, w, h);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      return cv.toDataURL('image/webp', q);
    }, j);
    plates[j.key] = uri;
    bytes += uri.length;
  }
  await browser.close();

  const html = fs.readFileSync(path.resolve(ROOT, tpl), 'utf8');
  if (!html.includes('/*PLATES*/')) { console.error('template has no /*PLATES*/ slot'); process.exit(2); }
  fs.writeFileSync(path.resolve(ROOT, out), html.replace('/*PLATES*/', JSON.stringify(plates)));
  const kb = n => (n / 1024 / 1024).toFixed(2) + ' MB';
  console.log('  ' + jobs.length + ' plates, ' + kb(bytes) + ' embedded -> ' + out
    + ' (' + kb(fs.statSync(path.resolve(ROOT, out)).size) + ')');
})();
