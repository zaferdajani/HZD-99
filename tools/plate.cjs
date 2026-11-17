// One fired STILL, made into a plate the game draws: keyed if it came on a
// screen, trimmed to the figure, seated on the cell's floor, encoded webp.
//
// Every standing plate has been through these four steps by hand, with a
// different script each time, which is how an NPC's talking plate came out a
// head taller than its working strip. This does them in one place and says
// what it measured, so two plates of one character can be given ONE scale.
//
//   node tools/plate.cjs <in> <out.webp> <size> [fill=0.97] [key=auto|none]
//     size  square cell, px
//     fill  how much of the cell's HEIGHT the figure's height takes (its feet
//           sit on the bottom edge); `w0.9` fills the cell's WIDTH instead
//     key   auto: a flat chroma or black field round the border is keyed
//           (colour distance + despill, the rule tools/vidstrip.cjs uses);
//           none: the alpha the file came with is the alpha
//   node tools/plate.cjs --encode <in> <out.webp> [width]     re-encode only
//   PLATE_ANCHOR=x   horizontal centre taken from the figure's FOOT span
//                    (bottom eighth) rather than its whole width — a raised
//                    arm must not push a body sideways in its cell
//   PLATE_DESPILL=edge  pull the screen's colour back only near the key
//                    (a GREEN robe fired on a green screen is not spill, and a
//                    whole-figure despill turns it grey)
//   PLATE_SCALE=s    the scale itself, for a SET: fill measures the whole
//                    silhouette, so a plate with a hand raised over its head
//                    would come out a smaller body than its neighbours
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

(async () => {
  const a = process.argv.slice(2);
  const ENC = a[0] === '--encode';
  if (ENC) a.shift();
  const [inp, out, sizeArg, fillArg, keyArg] = a;
  if (!inp || !out) { console.error('usage: plate.cjs <in> <out.webp> <size> [fill] [key]  |  --encode <in> <out.webp> [width]'); process.exit(2); }
  const SIZE = parseInt(sizeArg || '0', 10);
  const BYW = /^w/i.test(String(fillArg || ''));
  const FILL = parseFloat(String(fillArg || '0.97').replace(/^w/i, '')) || 0.97;
  const KEY = keyArg || 'auto';
  const FOOT = process.env.PLATE_ANCHOR === 'x';
  const FORCE = parseFloat(process.env.PLATE_SCALE || '0') || 0;
  const EDGE = process.env.PLATE_DESPILL === 'edge';
  // PLATE_KEY=d0,d1  the colour-distance ramp (default 90,165). A subject near the
  // screen's own hue (olive weed on green) needs it tighter, or it keys half away.
  const KEYD = (process.env.PLATE_KEY || '90,165').split(',').map(Number);
  const mime = /\.jpe?g$/i.test(inp) ? 'image/jpeg' : /\.webp$/i.test(inp) ? 'image/webp' : 'image/png';
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const res = await page.evaluate(async ({ b64, mime, ENC, SIZE, FILL, BYW, KEY, FOOT, FORCE, EDGE, KEYD }) => {
      const im = new Image(); im.src = 'data:' + mime + ';base64,' + b64; await im.decode();
      const W = im.naturalWidth, H = im.naturalHeight;
      if (ENC) {
        const w = SIZE || W, h = Math.round(H * w / W);
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const c = cv.getContext('2d'); c.imageSmoothingQuality = 'high'; c.drawImage(im, 0, 0, w, h);
        return { url: cv.toDataURL('image/webp', 0.9), note: w + 'x' + h };
      }
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const c = cv.getContext('2d', { willReadFrequently: true }); c.drawImage(im, 0, 0);
      const id = c.getImageData(0, 0, W, H), d = id.data;
      let keyed = 'none';
      if (KEY !== 'none') {
        // what colour is the border? (only if the border is opaque at all)
        const rs = [], gs = [], bs = []; let opaque = 0, n = 0;
        const take = (x, y) => { const j = (y * W + x) << 2; n++; if (d[j + 3] > 200) { opaque++; rs.push(d[j]); gs.push(d[j + 1]); bs.push(d[j + 2]); } };
        for (let x = 0; x < W; x += 4) { take(x, 0); take(x, H - 1); }
        for (let y = 0; y < H; y += 4) { take(0, y); take(W - 1, y); }
        if (opaque > n * 0.8) {
          const med = (q) => { q.sort((p, r) => p - r); return q[q.length >> 1]; };
          const kR = med(rs), kG = med(gs), kB = med(bs);
          const chroma = Math.max(kR, kG, kB) - Math.min(kR, kG, kB) > 40;
          if (chroma) {
            keyed = 'chroma ' + [kR, kG, kB].join(',');
            const D0 = KEYD[0], D1 = KEYD[1];
            for (let p = 0; p < W * H; p++) {
              const j = p << 2;
              const dr = d[j] - kR, dg = d[j + 1] - kG, db = d[j + 2] - kB;
              const dist = Math.sqrt(dr * dr + dg * dg + db * db);
              if (dist <= D0) { d[j + 3] = 0; continue; }
              if (dist < D1) d[j + 3] = Math.round((dist - D0) / (D1 - D0) * 255);
              if (EDGE) {   // only what is unmistakably the screen: far greener than either neighbour
                if (kG > kR && kG > kB && d[j + 1] > Math.max(d[j], d[j + 2]) * 1.5) d[j + 1] = Math.round(Math.max(d[j], d[j + 2]) * 1.1);
                continue;
              }
              if (kG > kR && kG > kB && d[j + 1] > (d[j] + d[j + 2]) / 2) d[j + 1] = Math.round((d[j] + d[j + 2]) / 2);
              else if (kB > kR && kB > kG && d[j + 2] > (d[j] + d[j + 1]) / 2) d[j + 2] = Math.round((d[j] + d[j + 1]) / 2);
            }
          } else if ((kR * 2 + kG * 5 + kB) / 8 < 40) {
            // a black field: flood from the border, so black INSIDE the figure stays
            keyed = 'black';
            const THR = 26, field = new Uint8Array(W * H), stack = new Int32Array(W * H); let sp = 0;
            const push = (p) => { if (!field[p]) { const j = p << 2; if ((d[j] * 2 + d[j + 1] * 5 + d[j + 2]) / 8 <= THR) { field[p] = 1; stack[sp++] = p; } } };
            for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
            for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
            while (sp > 0) { const p = stack[--sp], x = p % W, y = (p / W) | 0;
              if (x > 0) push(p - 1); if (x < W - 1) push(p + 1); if (y > 0) push(p - W); if (y < H - 1) push(p + W); }
            for (let p = 0; p < W * H; p++) if (field[p]) d[(p << 2) + 3] = 0;
          }
        }
        c.putImageData(id, 0, 0);
      }
      // the figure: what is really there, not a faint wash at an edge
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
        if (d[((y * W + x) << 2) + 3] > 48) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) return { err: 'nothing left after the key' };
      const fw = x1 - x0 + 1, fh = y1 - y0 + 1;
      let ax = (x0 + x1 + 1) / 2;
      if (FOOT) {
        let a0 = W, a1 = -1;
        for (let y = y1 - Math.round(fh / 8); y <= y1; y++) for (let x = x0; x <= x1; x++)
          if (d[((y * W + x) << 2) + 3] > 48) { if (x < a0) a0 = x; if (x > a1) a1 = x; }
        if (a1 >= 0) ax = (a0 + a1 + 1) / 2;
      }
      let s = FORCE || (BYW ? SIZE * FILL / fw : SIZE * FILL / fh), shrink = 1;
      // a pose wider than it is tall (a levelled staff, a trailing chain) is fitted to the cell's width and says so
      if (!FORCE && fw * s > SIZE * 0.98) { shrink = fw * s / (SIZE * 0.98); s /= shrink; }
      const o = document.createElement('canvas'); o.width = SIZE; o.height = SIZE;
      const oc = o.getContext('2d'); oc.imageSmoothingQuality = 'high';
      oc.drawImage(cv, x0, y0, fw, fh, Math.round(SIZE / 2 - (ax - x0) * s), Math.round(SIZE - fh * s), fw * s, fh * s);
      return { url: o.toDataURL('image/webp', 0.9), note: 'figure ' + fw + 'x' + fh + ' of ' + W + 'x' + H + ', key ' + keyed + ', scale ' + s.toFixed(3) + (shrink > 1 ? ', fitted to width (x' + shrink.toFixed(2) + ' smaller)' : '') + ', drawn ' + Math.round(fw * s) + 'x' + Math.round(fh * s) + ' in ' + SIZE };
    }, { b64: fs.readFileSync(inp).toString('base64'), mime, ENC, SIZE, FILL, BYW, KEY, FOOT, FORCE, EDGE, KEYD });
    if (res.err) { console.error('plate: ' + res.err); process.exit(1); }
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
    console.log('plate: ' + out + '  ' + res.note + '  ' + fs.statSync(out).size + ' bytes');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
