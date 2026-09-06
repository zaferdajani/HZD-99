// Halve a keyed plate for the archive.
//
// These cutouts are 2048² masters of art that ends up in a 160px cell — six
// times more pixels than the largest thing downstream can use. Keeping the
// full 2048 in git costs a hundred megabytes for detail nothing will ever
// read, so the ARCHIVED tier is 1024² (still 6× the cell) and the 2048 stays
// in the generation service, which is where the true master lives.
//
// PNG, not WebP: the alpha is the whole point of a cutout and it will be
// composited again, so no lossy step before the last one.
//
//   node tools/halfplate.cjs <outdir> <plate.png> [more.png ...]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [outdir, ...files] = process.argv.slice(2);
  fs.mkdirSync(outdir, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.exposeFunction('plateBytes', f => fs.readFileSync(f).toString('base64'));
  let n = 0;
  for (const f of files) {
    const url = await page.evaluate(async f => {
      const im = new Image();
      im.src = 'data:image/png;base64,' + (await window.plateBytes(f));
      await im.decode();
      const cv = document.createElement('canvas');
      cv.width = Math.round(im.naturalWidth / 2); cv.height = Math.round(im.naturalHeight / 2);
      const c = cv.getContext('2d');
      c.imageSmoothingQuality = 'high';
      c.drawImage(im, 0, 0, cv.width, cv.height);
      return cv.toDataURL('image/png');
    }, path.resolve(f));
    fs.writeFileSync(path.join(outdir, path.parse(f).name + '.png'),
      Buffer.from(url.split(',')[1], 'base64'));
    n++;
  }
  console.log(n + ' plates halved into ' + outdir);
  await browser.close();
})();
