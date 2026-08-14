// A contact sheet of a directory of PNGs, labelled, on a mid-grey ground.
//
// Restyling a boss produces sixty separate files and the only question that
// matters is whether they look like one animal. Opening them one at a time
// cannot answer that; laid out side by side it is obvious in a second — which
// limb came back the wrong colour, which one the model decided to re-pose.
//
// Mid grey rather than black on purpose: the generated parts sit on black and
// a black sheet hides exactly the thing being checked, the cutout edge.
//
//   node tools/contact.cjs <dir> <out.png> [cellPx]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

(async () => {
  const [dir, out, cellArg] = process.argv.slice(2);
  const cell = parseInt(cellArg || '300', 10);
  // jpg too: the archive stores its reference copies as 1024/q90 JPEG (see
  // assets/source/README.md), so a PNG-only filter silently produced an empty
  // sheet for every directory that had already been crushed.
  const files = fs.readdirSync(dir).filter(f => /\.(png|jpe?g)$/i.test(f)).sort();
  if (!files.length) { console.log('no PNGs in ' + dir); process.exit(1); }
  const imgs = files.map(f => ({
    name: f.replace(/\.(png|jpe?g)$/i, ''),
    url: 'data:image/png;base64,' + fs.readFileSync(path.join(dir, f)).toString('base64'),
  }));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const url = await page.evaluate(async ({ imgs, cell }) => {
    const cols = Math.min(imgs.length, Math.ceil(Math.sqrt(imgs.length * 1.4)));
    const rows = Math.ceil(imgs.length / cols);
    const lab = 18;
    const c = document.createElement('canvas');
    c.width = cols * cell; c.height = rows * (cell + lab);
    const x = c.getContext('2d');
    x.fillStyle = '#585c62'; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < imgs.length; i++) {
      const im = new Image(); im.src = imgs[i].url; await im.decode();
      const cx = (i % cols) * cell, cy = ((i / cols) | 0) * (cell + lab);
      const k = Math.min((cell - 8) / im.naturalWidth, (cell - 8) / im.naturalHeight);
      const w = im.naturalWidth * k, h = im.naturalHeight * k;
      x.drawImage(im, cx + (cell - w) / 2, cy + (cell - h) / 2, w, h);
      x.fillStyle = '#0c0e12'; x.fillRect(cx, cy + cell, cell, lab);
      x.fillStyle = '#cfe6ff'; x.font = '13px monospace'; x.textAlign = 'center';
      x.fillText(imgs[i].name, cx + cell / 2, cy + cell + 13);
      x.strokeStyle = '#2a2d33'; x.strokeRect(cx + .5, cy + .5, cell - 1, cell + lab - 1);
    }
    return c.toDataURL('image/png');
  }, { imgs, cell });
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log(files.length + ' parts -> ' + out);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
