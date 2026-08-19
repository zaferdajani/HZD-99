// Cut the named rects out of a guardian parts atlas, ready to be restyled.
//
// A guardian is a RIG: every part is addressed by absolute pixel rect, and a
// part that comes back 3px wider dislocates the whole animal. So the parts are
// fired one rect at a time and put back one rect at a time — never as a whole
// re-imagined sheet, which is the fast way to lose the rig.
//
// Same field rules as every other plate: flat black, generous padding, upscaled
// so the generator has pixels to work with. The rect's own geometry is written
// out beside it so the paste-back can reverse this exactly.
//
//   node tools/rigcut.cjs <atlas.png> <rects.json> <outdir>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

(async () => {
  const [atlas, rectsFile, outdir] = process.argv.slice(2);
  const rects = JSON.parse(fs.readFileSync(rectsFile, 'utf8'));
  fs.mkdirSync(outdir, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.exposeFunction('atlasBytes', () => fs.readFileSync(atlas).toString('base64'));
  const alphaSheet = await page.evaluate(async () => {
    const im = new Image();
    im.src = 'data:image/png;base64,' + (await window.atlasBytes());
    await im.decode();
    const cv = document.createElement('canvas');
    cv.width = im.naturalWidth; cv.height = im.naturalHeight;
    const c = cv.getContext('2d'); c.drawImage(im, 0, 0);
    const d = c.getImageData(0, 0, cv.width, cv.height).data;
    let clear = 0; const N = cv.width * cv.height;
    for (let i = 0; i < N; i++) if (d[i * 4 + 3] === 0) clear++;
    return clear / N > 0.2;
  });
  console.log(alphaSheet ? 'alpha-cut sheet: empty means transparent'
                         : 'opaque sheet: empty means black');
  const meta = { _alphaSheet: alphaSheet };
  for (const [name, r] of Object.entries(rects)) {
    const res = await page.evaluate(async ({ r, alphaSheet }) => {
      const im = new Image();
      im.src = 'data:image/png;base64,' + (await window.atlasBytes());
      await im.decode();
      const side = Math.max(r[2], r[3]);
      const PAD = Math.round(side * 0.22);
      const S = Math.max(2, Math.min(8, Math.round(1400 / (side + PAD * 2))));
      const D = (side + PAD * 2) * S;
      const cv = document.createElement('canvas'); cv.width = D; cv.height = D;
      const c = cv.getContext('2d');
      c.fillStyle = '#000'; c.fillRect(0, 0, D, D);
      c.imageSmoothingQuality = 'high';
      const ox = (PAD + (side - r[2]) / 2) * S, oy = (PAD + (side - r[3]) / 2) * S;
      c.drawImage(im, r[0], r[1], r[2], r[3], ox, oy, r[2] * S, r[3] * S);

      // The part's own silhouette, measured in the ORIGINAL atlas: the paste
      // back clips to this, so the rig cannot move however the art changes.
      //
      // What counts as EMPTY is measured, not assumed. Some of these sheets
      // are alpha-cut and some are opaque with black between the parts, and
      // picking the wrong test destroys the contract in opposite directions:
      // an alpha test on an opaque sheet marks every pixel as part, and a tone
      // test on an alpha sheet eats every dark plate the creature has.
      const m = document.createElement('canvas'); m.width = r[2]; m.height = r[3];
      const q = m.getContext('2d');
      q.drawImage(im, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
      const d = q.getImageData(0, 0, r[2], r[3]).data;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, on = 0;
      for (let y = 0; y < r[3]; y++) for (let x = 0; x < r[2]; x++) {
        const i = (y * r[2] + x) * 4;
        const lit = alphaSheet
          ? d[i + 3] > 24
          : (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) > 16;
        if (lit) {
          on++; if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
      return { url: cv.toDataURL('image/png'), D, S, ox, oy, on, bbox: [x0, y0, x1, y1] };
    }, { r, alphaSheet });
    fs.writeFileSync(path.join(outdir, name + '.png'),
      Buffer.from(res.url.split(',')[1], 'base64'));
    meta[name] = { rect: r, D: res.D, S: res.S, ox: res.ox, oy: res.oy, bbox: res.bbox, on: res.on };
    console.log(name.padEnd(12) + ' ' + r.join(',') + '  bbox ' + res.bbox.join(','));
  }
  fs.writeFileSync(path.join(outdir, '_meta.json'), JSON.stringify(meta, null, 1));
  await browser.close();
})();
