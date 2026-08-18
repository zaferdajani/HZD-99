// Key a generated terrain strip to a shippable plate.
//
// The field is DETECTED, not assumed: the brief says black and the generator
// returns white often enough that assuming cost a whole compositing pass which
// rendered white sheets and read as broken art. Sample the top corners, decide
// which way the field goes, key that, then trim to what survived so the plate's
// own top edge is the top of the file — the engine anchors on it.
//
//   node tools/terrainkey.cjs <in.png> <out.png> [width]
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [inp, out, wArg] = process.argv.slice(2);
  const OW = parseInt(wArg || '1920', 10);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const b64 = fs.readFileSync(inp).toString('base64');
  const res = await page.evaluate(async ({ b64, OW }) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const cv = document.createElement('canvas');
    cv.width = im.naturalWidth; cv.height = im.naturalHeight;
    const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, cv.width, cv.height), p = d.data;
    const L = (i) => (0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2]) / 2.55;
    const probe = [2, cv.width >> 1, cv.width - 3].map(cx => L(((2 * cv.width + cx) << 2)));
    const field = probe.reduce((a, v) => a + v, 0) / probe.length;
    const white = field > 55;
    for (let i = 0; i < p.length; i += 4) {
      const dist = white ? (field - L(i)) : (L(i) - field);
      p[i + 3] = dist <= 2 ? 0 : dist >= 12 ? 255 : Math.round(((dist - 2) / 10) * 255);
    }
    x.putImageData(d, 0, 0);
    // trim empty rows top and bottom
    const q = x.getImageData(0, 0, cv.width, cv.height).data;
    let top = cv.height, bot = 0;
    for (let y = 0; y < cv.height; y++) {
      for (let xx = 0; xx < cv.width; xx += 3) {
        if (q[((y * cv.width + xx) << 2) + 3] > 60) { if (y < top) top = y; if (y > bot) bot = y; break; }
      }
    }
    if (bot <= top) return null;
    const h = bot - top + 1, sc = OW / cv.width;
    const o = document.createElement('canvas');
    o.width = OW; o.height = Math.round(h * sc);
    const oc = o.getContext('2d');
    oc.imageSmoothingQuality = 'high';
    oc.drawImage(cv, 0, top, cv.width, h, 0, 0, o.width, o.height);
    return { url: o.toDataURL('image/png'), w: o.width, h: o.height, field: white ? 'white' : 'black' };
  }, { b64, OW });
  if (!res) { console.log('nothing survived the key: ' + inp); process.exit(1); }
  fs.writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
  console.log(out.split('/').pop() + '  ' + res.w + 'x' + res.h +
              '  field=' + res.field + '  ' + (fs.statSync(out).size / 1e3).toFixed(0) + ' KB');
  await browser.close();
})();
