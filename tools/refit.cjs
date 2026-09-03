// Put a refired plate into the OLD plate's frame, at the old plate's size.
//
// drawBeastPlate (and every drawer that scales a whole image by a k) sizes
// the picture, not the subject: dh = hitbox * k and dw follows the image's
// aspect. So a refired plate with a different crop draws the animal a
// different size, and k was measured against the old crop. This keeps the
// old contract: same canvas size, the new subject's box fitted to the old
// subject's box (uniform scale, centred on it), so every k stays true.
//
//   node tools/refit.cjs <old.webp|png> <new_keyed.png> <out.png>
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [oldF, newF, out] = process.argv.slice(2);
  if (!oldF || !newF || !out) { console.error('usage: refit.cjs <old> <new_keyed.png> <out.png>'); process.exit(2); }
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage();
  await p.exposeFunction('bytes', f => fs.readFileSync(f).toString('base64'));
  const res = await p.evaluate(async ({ oldF, newF }) => {
    const load = async (f) => { const im = new Image(); im.src = 'data:image/' + (f.endsWith('webp') ? 'webp' : 'png') + ';base64,' + await window.bytes(f); await im.decode(); return im; };
    const box = (im) => { const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const c = cv.getContext('2d', { willReadFrequently: true }); c.drawImage(im, 0, 0); const d = c.getImageData(0, 0, cv.width, cv.height).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; };
    const o = await load(oldF), n = await load(newF); const ob = box(o), nb = box(n);
    const s = Math.min(ob.w / nb.w, ob.h / nb.h);
    const dw = nb.w * s, dh = nb.h * s;
    const cv = document.createElement('canvas'); cv.width = o.width; cv.height = o.height;
    const c = cv.getContext('2d'); c.imageSmoothingQuality = 'high';
    // centred on the old box horizontally, feet on the old box's floor
    c.drawImage(n, nb.x0, nb.y0, nb.w, nb.h, ob.x0 + (ob.w - dw) / 2, ob.y0 + ob.h - dh, dw, dh);
    return { png: cv.toDataURL('image/png'), size: o.width + 'x' + o.height, ob, nb, s: +s.toFixed(3) };
  }, { oldF, newF });
  fs.writeFileSync(out, Buffer.from(res.png.split(',')[1], 'base64'));
  console.log(out.split('/').pop(), res.size, 'old box', res.ob.w + 'x' + res.ob.h, 'new box', res.nb.w + 'x' + res.nb.h, 'scale', res.s);
  await b.close();
})();
