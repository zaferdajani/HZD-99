// Make a painted parallax strip REPEAT without a seam.
//
// drawParallaxArt tiles a layer end to end across the screen. The pixel pack
// it replaced was drawn to wrap; a painted plate is not, and a hard cut where
// the right edge meets the left reads as a wall in the sky every screen-width.
// So the last N% of the plate is cross-faded over the first N%: the strip
// gets shorter by that much and its two ends become the same picture.
//
// Alpha is blended too, so a keyed layer (sky = transparent) wraps cleanly.
//
//   node tools/wraptile.cjs <in.png> <out.png> [overlap=0.08]
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [inp, out, ovArg] = process.argv.slice(2);
  const OV = parseFloat(ovArg || '0.08');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage();
  await p.exposeFunction('bytes', f => fs.readFileSync(f).toString('base64'));
  const res = await p.evaluate(async ({ inp, OV }) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + await window.bytes(inp); await im.decode();
    const W = im.width, H = im.height, ov = Math.round(W * OV), NW = W - ov;
    const src = document.createElement('canvas'); src.width = W; src.height = H;
    const sc = src.getContext('2d', { willReadFrequently: true }); sc.drawImage(im, 0, 0);
    const d = sc.getImageData(0, 0, W, H).data;
    const o = new ImageData(NW, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < NW; x++) {
      const j = (y * NW + x) * 4;
      if (x >= ov) { const s = (y * W + x) * 4; o.data[j] = d[s]; o.data[j + 1] = d[s + 1]; o.data[j + 2] = d[s + 2]; o.data[j + 3] = d[s + 3]; continue; }
      // x in [0, ov): blend the plate's own start (weight t) with its tail (weight 1-t)
      const t = (x + 0.5) / ov, a = (y * W + x) * 4, z = (y * W + NW + x) * 4;
      const wa = t, wz = 1 - t;
      const aa = d[a + 3] * wa, az = d[z + 3] * wz, at = aa + az;
      o.data[j + 3] = Math.round(at);
      for (let k = 0; k < 3; k++) o.data[j + k] = at ? Math.round((d[a + k] * aa + d[z + k] * az) / at) : 0;
    }
    const oc = document.createElement('canvas'); oc.width = NW; oc.height = H;
    oc.getContext('2d').putImageData(o, 0, 0);
    return { png: oc.toDataURL('image/png'), W, NW };
  }, { inp, OV });
  fs.writeFileSync(out, Buffer.from(res.png.split(',')[1], 'base64'));
  console.log(out, res.W + ' -> ' + res.NW + ' wide, ends cross-faded');
  await b.close();
})();
