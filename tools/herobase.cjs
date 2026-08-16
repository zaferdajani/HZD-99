// Cut the FIGURINE BASE out from under her.
//
// Owner, twice now: "I can still see the light shining underneath the legs
// when the character is standing. When it runs, it goes. But when it stands,
// it's still there." The tell in that sentence is the whole diagnosis — it
// survives in the STANDING poses only, which means it is not a ground effect
// the engine draws. It is baked into the art: several plates came back as
// product renders of a figurine, standing on a little glowing display disc,
// and the disc was keyed along with her.
//
// A disc is findable by SHAPE rather than by colour, which matters because it
// glows in the same off-white her feet are. Her legs are narrow; the base is
// wide. So: walk up from the bottom of the cell, and while a row is far wider
// than the legs above it, that row is base. The moment the width drops to leg
// width, we have reached her and stop.
//
// Erased to full transparency, not to black — the plates carry real alpha and
// a black smear under a character reads as a shadow, which is the thing being
// removed.
//
//   node tools/herobase.cjs <sheet.png> <out.png> [--ratio 1.55] [--max 0.22]
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const [inp, out, ...rest] = process.argv.slice(2);
  const ri = rest.indexOf('--ratio'), mi = rest.indexOf('--max');
  const RATIO = ri >= 0 ? parseFloat(rest[ri + 1]) : 1.55;
  const MAXFRAC = mi >= 0 ? parseFloat(rest[mi + 1]) : 0.22;
  if (!inp || !out) { console.log('usage: herobase.cjs <sheet.png> <out.png> [--ratio 1.55] [--max 0.22]'); process.exit(1); }

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const b64 = fs.readFileSync(inp).toString('base64');

  const res = await page.evaluate(async ({ b64, RATIO, MAXFRAC }) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const N = 22, CW = Math.round(im.naturalWidth / N), CH = im.naturalHeight;
    const cv = document.createElement('canvas');
    cv.width = im.naturalWidth; cv.height = CH;
    const c = cv.getContext('2d');
    c.drawImage(im, 0, 0);
    const img = c.getImageData(0, 0, cv.width, CH), d = img.data, W = cv.width;
    const rowW = (x0, y) => {           // opaque width of one row inside a cell
      let lo = -1, hi = -1;
      for (let x = x0; x < x0 + CW; x++) {
        if (d[((y * W + x) << 2) + 3] > 40) { if (lo < 0) lo = x; hi = x; }
      }
      return hi < 0 ? 0 : hi - lo + 1;
    };
    const report = [];
    for (let i = 0; i < N; i++) {
      const x0 = i * CW;
      let bottom = -1;
      for (let y = CH - 1; y >= 0 && bottom < 0; y--) if (rowW(x0, y) > 0) bottom = y;
      if (bottom < 0) continue;
      // median width over the band just above the very bottom = "leg width"
      const band = [];
      for (let y = bottom - Math.round(CH * 0.20); y < bottom - Math.round(CH * 0.05); y++) {
        const w = rowW(x0, y); if (w > 0) band.push(w);
      }
      if (!band.length) continue;
      band.sort((a, b) => a - b);
      const legW = band[band.length >> 1];
      // climb while the row is much wider than the legs
      let cut = bottom + 1;
      const limit = bottom - Math.round(CH * MAXFRAC);
      for (let y = bottom; y > limit; y--) {
        if (rowW(x0, y) >= legW * RATIO) cut = y; else break;
      }
      if (cut > bottom) { report.push({ i, removed: 0 }); continue; }
      let removed = 0;
      for (let y = cut; y <= bottom; y++) {
        for (let x = x0; x < x0 + CW; x++) {
          const q = ((y * W + x) << 2);
          if (d[q + 3] > 0) { d[q + 3] = 0; removed++; }
        }
      }
      report.push({ i, removed, rows: bottom - cut + 1, legW });
    }
    c.putImageData(img, 0, 0);
    return { url: cv.toDataURL('image/png'), report };
  }, { b64, RATIO, MAXFRAC });

  fs.writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
  const hit = res.report.filter(r => r.removed > 0);
  console.log(`${hit.length} cell(s) had a base under them`);
  for (const r of hit) console.log(`  cell ${String(r.i).padStart(2)}  ${r.rows} row(s), ${r.removed} px  (legs ${r.legW}px wide)`);
  await browser.close();
})();
