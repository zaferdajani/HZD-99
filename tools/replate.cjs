// Put a restyled cutout back exactly where the plate it replaces used to be.
//
// THE SILHOUETTE COMES FROM THE PLATE, NOT FROM THE GENERATOR, and that is the
// whole design. The first version of this tool measured the restyle's own keyed
// box and mapped it onto the original's box, which trusts the generator to have
// honoured "the black is emptiness, leave it black". It does not:
// tools/alphacmp.cjs measured eight depth planes and SEVEN came back with a
// different silhouette — one went from 39% alpha coverage to 86% because it
// painted a whole lava cavern into the empty margins and handed back a
// rectangle. A rectangle dropped into a room reads as a rendering bug.
//
// Saying it louder does not work either; that is the standing lesson of this
// pipeline (naming a thing forbids nothing). So the alpha is not negotiated:
//
//   RGB comes from the restyle. ALPHA comes from the plate on disk.
//
// which makes "restyle only" true by construction rather than by inspection.
// The plate keeps its exact outline, its exact size and its exact anchor, and
// the only thing that changed is the paint inside the line — which is all the
// drawn pass was ever asking for.
//
// The alignment is ARITHMETIC, not measured, and it has to match
// tools/plateprep.cjs exactly: that tool centres the plate in a square with a
// margin of 18% of the long side, so the plate occupies a known fraction of the
// square whatever resolution the generator returns it at. Crop that fraction,
// scale it to the plate's size, keep the plate's alpha.
//
//   node tools/replate.cjs <orig.png> <restyled.png> <out.png>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

(async () => {
  const [orig, styled, out] = process.argv.slice(2);
  if (!orig || !styled || !out) {
    console.error('usage: replate.cjs <orig.png> <restyled.png> <out.png>');
    process.exit(2);
  }
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.exposeFunction('bytes', f => fs.readFileSync(f).toString('base64'));

  const res = await page.evaluate(async ({ orig, styled }) => {
    const load = async (f) => {
      const im = new Image();
      im.src = 'data:image/png;base64,' + await window.bytes(f);
      await im.decode();
      return im;
    };
    const oim = await load(orig), sim = await load(styled);
    const W = oim.naturalWidth, H = oim.naturalHeight;
    const R = sim.naturalWidth;
    if (Math.abs(sim.naturalHeight - R) > 2) return { err: 'the restyle is not square (' + R + 'x' + sim.naturalHeight + ')' };

    // THE SAME PADDING plateprep.cjs USED, as fractions of the square.
    const side = Math.max(W, H);
    const PAD = Math.round(side * 0.18);
    const box = side + PAD * 2;
    const fx = (PAD + (side - W) / 2) / box, fy = (PAD + (side - H) / 2) / box;
    const fw = W / box, fh = H / box;

    // the restyle's paint, cropped to where the plate was and scaled back to it
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d', { willReadFrequently: true });
    c.imageSmoothingQuality = 'high';
    c.drawImage(sim, fx * R, fy * R, fw * R, fh * R, 0, 0, W, H);
    const sd = c.getImageData(0, 0, W, H);

    // the plate's alpha, unchanged
    const oc = document.createElement('canvas');
    oc.width = W; oc.height = H;
    const octx = oc.getContext('2d', { willReadFrequently: true });
    octx.drawImage(oim, 0, 0);
    const od = octx.getImageData(0, 0, W, H).data;

    let kept = 0;
    for (let p = 0; p < W * H; p++) {
      const a = od[(p << 2) + 3];
      sd.data[(p << 2) + 3] = a;
      if (a > 60) kept++;
    }
    c.putImageData(sd, 0, 0);
    return { png: cv.toDataURL('image/png'), size: W + 'x' + H, src: R + '²',
             cover: kept / (W * H) * 100 };
  }, { orig, styled });

  if (res.err) { console.error('  ' + res.err); process.exit(1); }
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, Buffer.from(res.png.split(',')[1], 'base64'));
  console.log('  ' + path.basename(out) + '  ' + res.size + '  (paint from ' + res.src
    + ', alpha from the plate, ' + res.cover.toFixed(1) + '% covered)  '
    + (fs.statSync(out).size / 1024 | 0) + ' KB');
  await browser.close();
})();
