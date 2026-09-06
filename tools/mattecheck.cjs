// Does a matted plate still carry a straight cut edge?
//
// A clean cutout touches the image border almost nowhere, and where it does it
// wanders. A failed matte leaves a RUN of opaque pixels along a border, or a
// long perfectly-straight alpha step inside the frame — the giveaway that the
// background was cropped rather than removed. Straight is the thing being
// measured, because straight is exactly what this game's rules forbid.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const dir = path.join(__dirname, '..', 'assets', 'characters', 'guardians');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  for (const f of files) {
    const b64 = fs.readFileSync(path.join(dir, f)).toString('base64');
    const r = await page.evaluate(async (b64) => {
      const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
      const W = im.naturalWidth, H = im.naturalHeight;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const c = cv.getContext('2d'); c.drawImage(im, 0, 0);
      const d = c.getImageData(0, 0, W, H).data;
      const A = (x, y) => d[((y * W + x) << 2) + 3];
      // longest unbroken opaque run along each border
      let best = 0, where = '';
      const scan = (n, get, name) => {
        let run = 0;
        for (let i = 0; i < n; i++) {
          if (get(i) > 40) { run++; if (run > best) { best = run; where = name; } }
          else run = 0;
        }
      };
      scan(W, i => A(i, 0), 'top');
      scan(W, i => A(i, H - 1), 'bottom');
      scan(H, i => A(0, i), 'left');
      scan(H, i => A(W - 1, i), 'right');
      // longest vertical straight alpha step inside the frame
      let vbest = 0;
      for (let x = 1; x < W; x++) {
        let run = 0;
        for (let y = 0; y < H; y++) {
          const a = A(x, y), b = A(x - 1, y);
          if ((a > 40) !== (b > 40)) { run++; if (run > vbest) vbest = run; } else run = 0;
        }
      }
      const opaque = (() => { let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n; })();
      return { W, H, border: best, where, vstep: vbest, fill: (opaque / (W * H) * 100).toFixed(1) };
    }, b64);
    const bad = r.border > r.W * 0.05 || r.vstep > r.H * 0.10;
    console.log(`${bad ? 'BAD ' : 'ok  '} ${f.padEnd(24)} ${r.W}x${r.H}  border-run ${String(r.border).padStart(5)} (${r.where})  straight-vert-step ${String(r.vstep).padStart(5)}  fill ${r.fill}%`);
  }
  await browser.close();
})();
