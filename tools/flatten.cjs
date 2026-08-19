// Composite a keyed plate onto a flat ground and write the shipped file.
//
// Some plates in this game are BANDS, not cutouts: the ceiling strip and the
// strata strip are drawn opaque and tiled by the engine, which fades their own
// edges. So once the generator's paper-white negative space has been keyed out,
// what ships is the drawing over BLACK — the colour the room behind it already
// is — at the size the engine resamples to, at the same path and the same
// format it had before. Keeping the path and the format is the whole point:
// choosing a style stays a file copy rather than a code change.
//
//   node tools/flatten.cjs <in.png> <out.jpg|png> [w] [h] [bg=#000] [darken=0]
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const [inp, out, wArg, hArg, bgArg, darkArg] = process.argv.slice(2);
  if (!inp || !out) { console.error('usage: flatten.cjs <in.png> <out> [w] [h] [bg] [darken]'); process.exit(2); }
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.exposeFunction('plateBytes', () => fs.readFileSync(inp).toString('base64'));
  const jpg = /\.jpe?g$/i.test(out);
  const res = await page.evaluate(async ({ wArg, hArg, bgArg, darkArg, jpg }) => {
    const im = new Image();
    im.src = 'data:image/png;base64,' + await window.plateBytes();
    await im.decode();
    const W = wArg ? +wArg : im.width, H = hArg ? +hArg : im.height;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.imageSmoothingQuality = 'high';
    c.fillStyle = bgArg || '#000'; c.fillRect(0, 0, W, H);
    // COVER, not stretch: a band squashed to a different aspect stretches the
    // grain, and stretched grain is the one thing that reads as "resized art"
    const s = Math.max(W / im.width, H / im.height);
    const dw = im.width * s, dh = im.height * s;
    c.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
    const dk = darkArg ? +darkArg : 0;
    if (dk > 0) { c.globalAlpha = dk; c.fillStyle = '#000'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    return cv.toDataURL(jpg ? 'image/jpeg' : 'image/png', 0.9);
  }, { wArg, hArg, bgArg, darkArg, jpg });
  fs.writeFileSync(out, Buffer.from(res.split(',')[1], 'base64'));
  console.log('  ' + out + '  ' + (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
  await browser.close();
})();
