// Assemble HZD-99's 8-yaw turnaround from two generated half-turn sheets.
//
// Reuses turnsheet.cjs's band-cutting idea (key the black field, split at the
// gutters) but for ONE subject at a fixed 8-column layout in ENGINE order:
//   col 0 = 0°   right profile (facing screen-right)   <- front sheet fig 0
//   col 1 = 45°                                        <- front fig 1
//   col 2 = 90°  facing camera                         <- front fig 2
//   col 3 = 135°                                       <- front fig 3
//   col 4 = 180° left profile (facing screen-left)     <- back fig 0
//   col 5 = 225°                                       <- back fig 1
//   col 6 = 270° the back — the gate walk              <- back fig 2
//   col 7 = 315°                                       <- back fig 3
// NOTHING IS MIRRORED. The key light is world-fixed in both renders; that is
// the entire reason a turn reads as a volume.
//
//   node tools/herosheet.cjs <front.png> <back.png> <out.png>
const { chromium } = require('playwright');
const fs = require('fs');
const CW = 200, CH = 260;

(async () => {
  const [front, back, out] = process.argv.slice(2);
  if (!front || !back || !out) { console.log('usage: herosheet.cjs <front> <back> <out>'); process.exit(1); }
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const res = await page.evaluate(async ({ f, b, CW, CH }) => {
    const cut = async (dataUrl) => {
      const img = new Image(); img.src = dataUrl; await img.decode();
      const W = img.naturalWidth, H = img.naturalHeight;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, W, H), p = d.data;
      const LO = 26, HI = 62;
      const col = new Float64Array(W);
      for (let i = 0, q = 0; i < p.length; i += 4, q++) {
        const lum = p[i] * 0.30 + p[i + 1] * 0.59 + p[i + 2] * 0.11;
        let a = 0;
        if (lum > HI) a = 255; else if (lum > LO) a = Math.round((lum - LO) / (HI - LO) * 255);
        p[i + 3] = a;
        if (a > 140) col[q % W] += 1;
      }
      x.putImageData(d, 0, 0);
      const thresh = Math.max(2, H * 0.012);
      const bands = []; let s = -1;
      for (let i = 0; i < W; i++) {
        const on = col[i] > thresh;
        if (on && s < 0) s = i; else if (!on && s >= 0) { bands.push([s, i]); s = -1; }
      }
      if (s >= 0) bands.push([s, W]);
      const merged = [];
      for (const bd of bands) {
        const last = merged[merged.length - 1];
        if (last && bd[0] - last[1] < W * 0.018) last[1] = bd[1]; else merged.push(bd.slice());
      }
      let figs = merged.filter(bd => (bd[1] - bd[0]) > W * 0.025);
      if (figs.length) {
        const wide = Math.max(...figs.map(bd => bd[1] - bd[0]));
        figs = figs.filter(bd => (bd[1] - bd[0]) > wide * 0.22);
      }
      // TWO FIGURES BRIDGED INTO ONE BAND. Her blade sticks out sideways on the
      // back angles and can touch the neighbouring figure's band, merging two
      // characters into one box. Any band wider than 1.6x the median is split
      // at its own thinnest interior column — the real gutter is still the
      // emptiest place inside it.
      const med = figs.map(bd => bd[1] - bd[0]).sort((q, r) => q - r)[Math.floor(figs.length / 2)];
      const split = [];
      for (const bd of figs) {
        if (bd[1] - bd[0] > med * 1.6) {
          let best = -1, bestV = Infinity;
          const m0 = bd[0] + Math.round((bd[1] - bd[0]) * 0.3);
          const m1 = bd[1] - Math.round((bd[1] - bd[0]) * 0.3);
          for (let i = m0; i < m1; i++) if (col[i] < bestV) { bestV = col[i]; best = i; }
          split.push([bd[0], best], [best + 1, bd[1]]);
        } else split.push(bd);
      }
      figs = split;
      const boxes = figs.map(([x0, x1]) => {
        let y0 = H, y1 = 0;
        for (let y = 0; y < H; y++) {
          let hit = 0;
          for (let xx = x0; xx < x1; xx += 2) if (p[(y * W + xx) * 4 + 3] > 140) { hit++; if (hit > 2) break; }
          if (hit > 2) { if (y < y0) y0 = y; y1 = y; }
        }
        return { x0, x1, y0, y1: y1 + 1 };
      }).filter(bd => bd.y1 > bd.y0 + H * 0.05);
      return { url: c.toDataURL('image/png'), boxes };
    };
    const F = await cut(f), B2 = await cut(b);
    if (F.boxes.length !== 4 || B2.boxes.length !== 4)
      return { err: 'figure count front=' + F.boxes.length + ' back=' + B2.boxes.length };
    const sheet = document.createElement('canvas');
    sheet.width = 8 * CW; sheet.height = CH;
    const x = sheet.getContext('2d');
    const paste = async (keyedUrl, box, colI) => {
      const img = new Image(); img.src = keyedUrl; await img.decode();
      const bw = box.x1 - box.x0, bh = box.y1 - box.y0;
      let k = (CH * 0.84) / bh;
      if (bw * k > CW * 0.92) k = (CW * 0.92) / bw;
      const dw = bw * k, dh = bh * k;
      x.drawImage(img, box.x0, box.y0, bw, bh,
        colI * CW + (CW - dw) / 2, (CH - dh) - CH * 0.04, dw, dh);
    };
    for (let i = 0; i < 4; i++) await paste(F.url, F.boxes[i], i);
    for (let i = 0; i < 4; i++) await paste(B2.url, B2.boxes[i], 4 + i);
    return { url: sheet.toDataURL('image/png') };
  }, {
    f: 'data:image/png;base64,' + fs.readFileSync(front).toString('base64'),
    b: 'data:image/png;base64,' + fs.readFileSync(back).toString('base64'),
    CW, CH,
  });
  await browser.close();
  if (res.err) { console.error('FAIL: ' + res.err); process.exit(1); }
  fs.writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
  console.log(out + ' written (8 x ' + CW + 'x' + CH + ')');
})().catch(e => { console.error(e); process.exit(1); });
