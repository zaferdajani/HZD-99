// Compose the six kingdom backdrops into the atlas the engine reads.
//
// ZONE_CELL in js/game.js addresses zones_far.jpg as 2 columns x 3 rows —
// A B / C D / E X — so the cell geometry is a contract, not a layout choice: a
// backdrop composed into the wrong cell puts the Foundry behind the Archives.
// The order below is the order that table reads, and the cell size is derived
// from the sheet rather than typed twice.
//
//   node tools/vistaatlas.cjs <out.jpg> <A.png> <B.png> <C.png> <D.png> <E.png> <X.png>
const { chromium } = require('playwright');
const fs = require('fs');

const W = 1920, H = 1080, COLS = 2, ROWS = 3;

(async () => {
  const [out, ...files] = process.argv.slice(2);
  if (!out || files.length !== 6) {
    console.error('usage: vistaatlas.cjs <out.jpg> <A> <B> <C> <D> <E> <X>'); process.exit(2);
  }
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.exposeFunction('cellBytes', i => fs.readFileSync(files[i]).toString('base64'));
  const url = await page.evaluate(async ({ W, H, COLS, ROWS, n }) => {
    const CW = W / COLS, CH = H / ROWS;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    c.imageSmoothingQuality = 'high';
    for (let i = 0; i < n; i++) {
      const im = new Image();
      im.src = 'data:image/png;base64,' + await window.cellBytes(i);
      await im.decode();
      const cx = (i % COLS) * CW, cy = ((i / COLS) | 0) * CH;
      // COVER: a backdrop squashed into 8:3 stretches its own ink, and the one
      // thing a hand-drawn line cannot survive is being scaled unevenly
      const s = Math.max(CW / im.width, CH / im.height);
      const dw = im.width * s, dh = im.height * s;
      c.save();
      c.beginPath(); c.rect(cx, cy, CW, CH); c.clip();
      c.drawImage(im, cx + (CW - dw) / 2, cy + (CH - dh) / 2, dw, dh);
      c.restore();
    }
    return cv.toDataURL('image/jpeg', 0.88);
  }, { W, H, COLS, ROWS, n: files.length });
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log('  ' + out + '  ' + W + 'x' + H + '  cells ' + (W / COLS) + 'x' + (H / ROWS)
    + '  ' + (fs.statSync(out).size / 1024 | 0) + ' KB');
  await browser.close();
})();
