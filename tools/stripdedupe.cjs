// Drop the DEAD cells from a cut strip — consecutive cells that tests/frames.cjs
// would call the same picture (its own signature: a 12x12 grid of alpha and
// luma, per-cell difference under 2.5%). vidstrip's content selector keeps
// frames 4% apart by pixel change, which is not the same number, and a slow
// take can land a pair under the harness's line. Measured the harness's way,
// dropped, and the strip written back shorter.
//
//   node tools/stripdedupe.cjs <in.png> <out.png> [minPct=3]
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [inp, out, minArg] = process.argv.slice(2);
  const MIN = parseFloat(minArg || '3');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage();
  await p.exposeFunction('bytes', f => fs.readFileSync(f).toString('base64'));
  const res = await p.evaluate(async ({ inp, MIN }) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + await window.bytes(inp); await im.decode();
    const H = im.height, n = Math.round(im.width / H), S = 12;
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = H;
    const c = cv.getContext('2d', { willReadFrequently: true }); c.drawImage(im, 0, 0);
    const d = c.getImageData(0, 0, cv.width, H).data, W = cv.width;
    const sigOf = (i) => {
      const a = new Float32Array(S * S), v = new Float32Array(S * S), bx = H / S, by = H / S;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        let sa = 0, sv = 0, cnt = 0;
        for (let yy = Math.floor(y * by); yy < Math.floor((y + 1) * by); yy += 3)
          for (let xx = Math.floor(x * bx); xx < Math.floor((x + 1) * bx); xx += 3) {
            const j = ((yy * W + i * H + xx) << 2);
            sa += d[j + 3] / 255; sv += (0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2]) / 255 * (d[j + 3] / 255); cnt++;
          }
        a[y * S + x] = cnt ? sa / cnt : 0; v[y * S + x] = cnt ? sv / cnt : 0;
      }
      return { a, v };
    };
    const pct = (A, B) => { let d2 = 0, on = 0; for (let q = 0; q < S * S; q++) { const cov = Math.max(A.a[q], B.a[q]); if (cov < 0.02) continue; d2 += Math.abs(A.a[q] - B.a[q]) * 0.5 + Math.abs(A.v[q] - B.v[q]); on += cov; } return on ? (d2 / on) * 100 : 0; };
    const keep = [0]; let last = sigOf(0); const pcs = [];
    for (let i = 1; i < n; i++) { const s = sigOf(i); const pc = pct(last, s); pcs.push(pc.toFixed(1)); if (pc >= MIN) { keep.push(i); last = s; } }
    const o = document.createElement('canvas'); o.width = H * keep.length; o.height = H;
    const oc = o.getContext('2d'); keep.forEach((i, k) => oc.drawImage(cv, i * H, 0, H, H, k * H, 0, H, H));
    return { png: o.toDataURL('image/png'), n, kept: keep.length, pcs };
  }, { inp, MIN });
  fs.writeFileSync(out, Buffer.from(res.png.split(',')[1], 'base64'));
  console.log(out, res.n + ' -> ' + res.kept + ' cells', 'steps:', res.pcs.join(' '));
  await b.close();
})();
