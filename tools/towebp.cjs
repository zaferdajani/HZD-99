// png -> webp through the browser's encoder, same pixels, alpha kept.
//   node tools/towebp.cjs <in.png> <out.webp> [quality=0.9]
// The repo ships nothing from npm and has no sharp/cwebp; Chromium's encoder
// is the one every other webp in assets/ went through (tools/webptier.cjs).
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [inp, out, q] = process.argv.slice(2);
  if (!inp || !out) { console.error('usage: towebp.cjs <in.png> <out.webp> [quality]'); process.exit(2); }
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const url = await page.evaluate(async ({ b64, q }) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
    cv.getContext('2d').drawImage(im, 0, 0);
    return cv.toDataURL('image/webp', q);
  }, { b64: fs.readFileSync(inp).toString('base64'), q: parseFloat(q || '0.9') });
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  await browser.close();
  console.log(out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
})();
