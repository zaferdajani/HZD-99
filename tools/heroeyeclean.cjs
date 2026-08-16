// Take the BAKED eye-lights out of the state sheet, so she has two eyes.
//
// The renderer repaints her eye-lights live over the plate (drawHeroEyes) so
// they can blink and carry mood — a frozen pair is a sensor, not a face. That
// only works if the repaint COVERS the baked pair. It does not: the anchors
// are measured off the brightest cyan core, so the repaint lands centred and
// correct but smaller than the baked lens, and the rim of the baked eye stays
// visible around it. On screen that is FOUR EYES, which is exactly what the
// owner reported — "one that is moving on top of the static 3D, but it is not
// actually correctly placed, it's underneath".
//
// Chasing the size is the wrong fix: it has already been wrong in both
// directions once (drawn double, then halved), and any size that is right for
// idle is wrong for the poses where her head is turned. The reliable fix is to
// delete the thing being doubled. With the baked lights painted out to the
// visor's own dark, the live pair is the ONLY pair, and the anchor and size
// only have to be plausible rather than pixel-exact.
//
// The eye region is replaced with the darkest colour found in the visor band
// immediately around it, so the mask keeps its own shading rather than getting
// a flat black patch stamped on it.
//
//   node tools/heroeyeclean.cjs <sheet.png> <out.png> [--pad 1.35]
const { chromium } = require('playwright');
const fs = require('fs');

// mirrors HERO_EYE in js/entities.js — normalised per cell
const EYE = JSON.parse(fs.readFileSync(__dirname + '/heroeye.json', 'utf8'));
const NAMES = Object.keys(EYE);

(async () => {
  const [inp, out, ...rest] = process.argv.slice(2);
  const pi = rest.indexOf('--pad');
  const PAD = pi >= 0 ? parseFloat(rest[pi + 1]) : 1.35;
  if (!inp || !out) { console.log('usage: heroeyeclean.cjs <sheet.png> <out.png> [--pad 1.35]'); process.exit(1); }

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const b64 = fs.readFileSync(inp).toString('base64');

  const res = await page.evaluate(async ({ b64, EYE, NAMES, PAD }) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const N = NAMES.length, CW = im.naturalWidth / N, CH = im.naturalHeight;
    const cv = document.createElement('canvas');
    cv.width = im.naturalWidth; cv.height = CH;
    const c = cv.getContext('2d');
    c.drawImage(im, 0, 0);
    const img = c.getImageData(0, 0, cv.width, CH), d = img.data;
    const W = cv.width;
    const at = (x, y) => ((y * W + x) << 2);
    const report = [];

    for (let i = 0; i < N; i++) {
      const E = EYE[NAMES[i]]; if (!E) continue;
      const x0 = i * CW;
      // the two eyes, in cell pixels
      const eyes = [[E.lx, E.ly], [E.rx, E.ry]].map(([nx, ny]) => ({
        cx: x0 + nx * CW, cy: ny * CH,
        rx: (E.ew * CW * 0.5) * PAD, ry: (E.eh * CH * 0.5) * PAD,
      }));
      // sample the visor's own dark from an annulus just outside both eyes,
      // ignoring anything still bright (that would be the other eye)
      let sr = 0, sg = 0, sb = 0, n = 0;
      for (const e of eyes) {
        for (let a = 0; a < 32; a++) {
          const th = a / 32 * Math.PI * 2;
          const px = Math.round(e.cx + Math.cos(th) * e.rx * 1.45);
          const py = Math.round(e.cy + Math.sin(th) * e.ry * 1.45);
          if (px < x0 || px >= x0 + CW || py < 0 || py >= CH) continue;
          const q = at(px, py);
          if (d[q + 3] < 200) continue;
          const lum = d[q] * 0.3 + d[q + 1] * 0.59 + d[q + 2] * 0.11;
          if (lum > 90) continue;                  // still an eye-light, skip
          sr += d[q]; sg += d[q + 1]; sb += d[q + 2]; n++;
        }
      }
      const fill = n > 6 ? [sr / n, sg / n, sb / n] : [26, 24, 30];
      let painted = 0;
      for (const e of eyes) {
        const ax = Math.ceil(e.rx), ay = Math.ceil(e.ry);
        for (let y = Math.floor(e.cy - ay); y <= e.cy + ay; y++) {
          for (let x = Math.floor(e.cx - ax); x <= e.cx + ax; x++) {
            if (x < x0 || x >= x0 + CW || y < 0 || y >= CH) continue;
            const dx = (x - e.cx) / e.rx, dy = (y - e.cy) / e.ry;
            const r2 = dx * dx + dy * dy;
            if (r2 > 1) continue;
            const q = at(x, y);
            if (d[q + 3] < 8) continue;            // never paint into the cut-out
            // feather the last 20% so the patch has no hard rim
            const t = r2 < 0.64 ? 1 : (1 - r2) / 0.36;
            d[q]     = d[q]     * (1 - t) + fill[0] * t;
            d[q + 1] = d[q + 1] * (1 - t) + fill[1] * t;
            d[q + 2] = d[q + 2] * (1 - t) + fill[2] * t;
            painted++;
          }
        }
      }
      report.push({ name: NAMES[i], painted, fill: fill.map(v => Math.round(v)) });
    }
    c.putImageData(img, 0, 0);
    return { url: cv.toDataURL('image/png'), report, CW: Math.round(CW), CH };
  }, { b64, EYE, NAMES, PAD });

  fs.writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
  console.log(`sheet ${res.CW}x${res.CH} per cell · pad ${PAD}`);
  for (const r of res.report) console.log(`  ${r.name.padEnd(11)} ${String(r.painted).padStart(5)} px -> rgb(${r.fill.join(',')})`);
  await browser.close();
})();
