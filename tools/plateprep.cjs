// Prepare whole plate files for an image-to-image restyle.
//
// Same job as herocut.cjs, but for the parts of the cast that are stored one
// state per FILE rather than as cells of a sheet — the wolves, the drones, the
// machines. Every plate gets the same treatment for the same two reasons the
// hero's cells did:
//
//   FLAT BLACK, not transparency. A generator handed a transparent PNG invents
//   its own background, and then the result cannot be keyed off anything.
//   PADDING, because a subject touching the frame edge comes back cropped —
//   that cost four guardian plates.
//
// Also SQUARE: these plates are all shapes, and a wide one letterboxed into a
// 1:1 generation comes back with the subject re-composed to fill the frame,
// which is scale drift by another route. Padding to square first means the
// aspect the model is given is the aspect it returns.
//
//   node tools/plateprep.cjs <outdir> <plate.png> [more.png ...]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

(async () => {
  const [outdir, ...files] = process.argv.slice(2);
  fs.mkdirSync(outdir, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.exposeFunction('plateBytes', f => fs.readFileSync(f).toString('base64'));
  for (const f of files) {
    const res = await page.evaluate(async f => {
      const im = new Image();
      im.src = 'data:image/png;base64,' + (await window.plateBytes(f));
      await im.decode();
      const W = im.naturalWidth, H = im.naturalHeight;
      const side = Math.max(W, H);
      const PAD = Math.round(side * 0.18);
      const S = Math.max(1, Math.min(6, Math.round(1400 / (side + PAD * 2))));
      const D = (side + PAD * 2) * S;
      const cv = document.createElement('canvas'); cv.width = D; cv.height = D;
      const c = cv.getContext('2d');
      c.fillStyle = '#000'; c.fillRect(0, 0, D, D);
      c.imageSmoothingQuality = 'high';
      c.drawImage(im, (PAD + (side - W) / 2) * S, (PAD + (side - H) / 2) * S, W * S, H * S);
      return { url: cv.toDataURL('image/png'), src: [W, H], out: D };
    }, path.resolve(f));
    const out = path.join(outdir, path.parse(f).name + '.png');
    fs.writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
    console.log(path.parse(f).name + '  ' + res.src.join('x') + ' -> ' + res.out + '²');
  }
  await browser.close();
})();
