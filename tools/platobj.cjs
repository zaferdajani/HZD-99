// A zone's PLATFORM OBJECTS, cut from one fired sheet.
//
// The owner: "the platforms are so translucent, it does not actually indicate
// a platform or something that I have to walk on. It should have its own
// objective structure drawn and showing." Each zone's sheet (ART_QUEUE §2bt)
// carries three whole objects — short, medium, long — stacked top to bottom on
// a transparent field. This finds the three by their alpha rows, trims each,
// measures where its WALKABLE TOP is (the first row that is opaque across most
// of its width: grass tufts and crystals stand above that line and must not be
// mistaken for it), scales them to one thickness, and packs them into a strip
// sheet with a table the game reads.
//
//   node tools/platobj.cjs <fired.png> <out.webp> [thick=56]
// prints the PLAT_OBJ row for js/game.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [inp, out, thickArg] = process.argv.slice(2);
  if (!inp || !out) { console.error('usage: platobj.cjs <fired.png> <out.webp> [thick]'); process.exit(2); }
  const THICK = parseInt(thickArg || '56', 10);
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const res = await page.evaluate(async ({ b64, THICK }) => {
      const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
      const W = im.naturalWidth, H = im.naturalHeight;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const c = cv.getContext('2d', { willReadFrequently: true }); c.drawImage(im, 0, 0);
      const d = c.getImageData(0, 0, W, H).data;
      const A = (x, y) => d[((y * W + x) << 2) + 3];
      // rows that hold anything, grouped into bands
      const rowN = new Int32Array(H);
      for (let y = 0; y < H; y++) { let n = 0; for (let x = 0; x < W; x += 2) if (A(x, y) > 48) n++; rowN[y] = n; }
      const bands = []; let y0 = -1;
      for (let y = 0; y <= H; y++) {
        const on = y < H && rowN[y] > 3;
        if (on && y0 < 0) y0 = y;
        if (!on && y0 >= 0) { if (y - y0 > H * 0.03) bands.push([y0, y - 1]); y0 = -1; }
      }
      if (bands.length !== 3) return { err: 'expected three objects, found ' + bands.length };
      const objs = bands.map(([a, b]) => {
        let x0 = W, x1 = -1;
        for (let y = a; y <= b; y++) for (let x = 0; x < W; x++) if (A(x, y) > 48) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
        const w = x1 - x0 + 1, h = b - a + 1;
        // the walkable top: first row opaque over 80% of the middle 80% of the width
        let top = 0; const m0 = Math.round(x0 + w * 0.1), m1 = Math.round(x1 - w * 0.1);
        for (let y = a; y <= b; y++) { let n = 0; for (let x = m0; x <= m1; x++) if (A(x, y) > 128) n++; if (n >= (m1 - m0 + 1) * 0.8) { top = y - a; break; } }
        // ...and the solid slab's bottom: the last such row
        let bot = h - 1;
        for (let y = b; y >= a; y--) { let n = 0; for (let x = m0; x <= m1; x++) if (A(x, y) > 128) n++; if (n >= (m1 - m0 + 1) * 0.8) { bot = y - a; break; } }
        return { x0, y0: a, w, h, top, bot };
      });
      // one scale for the set: the slab (top..bot) of the SHORT one is THICK px
      const s = THICK / Math.max(1, objs[0].bot - objs[0].top + 1);
      const pad = 2; let OW = 0, OH = pad;
      const placed = objs.map(o => { const w = Math.round(o.w * s), h = Math.round(o.h * s); const r = { x: pad, y: OH, w, h, top: Math.round(o.top * s), slab: Math.round((o.bot - o.top + 1) * s) }; OH += h + pad; OW = Math.max(OW, w + pad * 2); return r; });
      const o = document.createElement('canvas'); o.width = OW; o.height = OH;
      const oc = o.getContext('2d'); oc.imageSmoothingQuality = 'high';
      objs.forEach((ob, i) => oc.drawImage(cv, ob.x0, ob.y0, ob.w, ob.h, placed[i].x, placed[i].y, placed[i].w, placed[i].h));
      return { url: o.toDataURL('image/webp', 0.92), placed, size: [OW, OH], scale: s };
    }, { b64: fs.readFileSync(inp).toString('base64'), THICK });
    if (res.err) { console.error('platobj: ' + res.err); process.exit(1); }
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
    console.log('platobj: ' + out + ' ' + res.size.join('x') + ' scale ' + res.scale.toFixed(3) + ' ' + fs.statSync(out).size + ' bytes');
    console.log('  [' + res.placed.map(r => '{ x: ' + r.x + ', y: ' + r.y + ', w: ' + r.w + ', h: ' + r.h + ', top: ' + r.top + ', slab: ' + r.slab + ' }').join(', ') + ']');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
