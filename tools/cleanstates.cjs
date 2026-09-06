// Scrub background remnants out of a CELL SHEET without touching the subject.
//
// The generator ignored "pitch-dark room" on a handful of state cells and
// left flat gray polygons and orbs floating NEAR her — and the sheet has
// already been border-keyed, so the remnants are interior ISLANDS: opaque
// components disconnected from her body. A remnant has three properties her
// art never has together: it is not the largest component in its cell, its
// colour is near-neutral (her scarf is red, her accents cyan), and it is
// CHUNKY — a filled slab, where her stray parts are threads and tufts. So:
// per cell, label the opaque components, keep the largest (her), and delete
// any smaller one that is both neutral and chunky. (Flatness was tried first
// and failed: the remnants are shaded slabs, std up to 97.) The original
// must be archived in assets/source/ before running this.
//
//   node tools/cleanstates.cjs <sheet.png> <cells>
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const [file, cellsArg] = process.argv.slice(2);
  const CELLS = parseInt(cellsArg, 10);
  if (!file || !CELLS) { console.error('usage: cleanstates <sheet.png> <cells>'); process.exit(1); }
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const b64 = fs.readFileSync(file).toString('base64');
  const out = await page.evaluate(async ({ b64, CELLS }) => {
    const im = new Image();
    im.src = 'data:image/png;base64,' + b64;
    await new Promise(r => { im.onload = r; });
    const W = im.width, H = im.height, cw = W / CELLS;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    x.drawImage(im, 0, 0);
    const id = x.getImageData(0, 0, W, H), d = id.data;
    let cleared = 0, killed = 0;
    for (let cell = 0; cell < CELLS; cell++) {
      const x0 = Math.round(cell * cw), x1 = Math.round((cell + 1) * cw);
      const lab = new Int32Array((x1 - x0) * H).fill(-1);
      const comps = [];
      const li = (px, py) => (py * (x1 - x0)) + (px - x0);
      for (let py = 0; py < H; py++) for (let px = x0; px < x1; px++) {
        const i = (py * W + px) * 4;
        if (d[i + 3] < 30 || lab[li(px, py)] >= 0) continue;
        const comp = { id: comps.length, px: [], sr: 0, sg: 0, sb: 0, minx: 1e9, maxx: -1, miny: 1e9, maxy: -1 };
        const q = [[px, py]];
        lab[li(px, py)] = comp.id;
        while (q.length) {
          const [ax, ay] = q.pop();
          const ai = (ay * W + ax) * 4;
          comp.px.push(ai);
          if (ax < comp.minx) comp.minx = ax; if (ax > comp.maxx) comp.maxx = ax;
          if (ay < comp.miny) comp.miny = ay; if (ay > comp.maxy) comp.maxy = ay;
          comp.sr += d[ai]; comp.sg += d[ai + 1]; comp.sb += d[ai + 2];
          for (const [nx, ny] of [[ax + 1, ay], [ax - 1, ay], [ax, ay + 1], [ax, ay - 1]]) {
            if (nx < x0 || nx >= x1 || ny < 0 || ny >= H) continue;
            const ni = (ny * W + nx) * 4;
            if (d[ni + 3] < 30 || lab[li(nx, ny)] >= 0) continue;
            lab[li(nx, ny)] = comp.id;
            q.push([nx, ny]);
          }
        }
        comps.push(comp);
      }
      if (!comps.length) continue;
      const biggest = comps.reduce((a, b) => (b.px.length > a.px.length ? b : a));
      for (const cp of comps) {
        if (cp === biggest || cp.px.length < 60) continue;
        const n = cp.px.length;
        const mr = cp.sr / n, mg = cp.sg / n, mb = cp.sb / n;
        // a remnant is a CHUNK; her whiskers and stray hairlines are threads
        const bw = cp.maxx - cp.minx + 1, bh = cp.maxy - cp.miny + 1;
        const chunky = n / (bw * bh) > 0.5 && Math.min(bw, bh) > 6;
        const neutral = Math.abs(mr - mg) < 22 && Math.abs(mg - mb) < 22;
        if (neutral && chunky) {
          for (const ai of cp.px) d[ai + 3] = 0;
          cleared += n; killed++;
        }
      }
    }
    x.putImageData(id, 0, 0);
    return { png: cv.toDataURL('image/png').split(',')[1], cleared, killed };
  }, { b64, CELLS });
  fs.writeFileSync(file, Buffer.from(out.png, 'base64'));
  console.log(file + ' — deleted ' + out.killed + ' neutral chunk island(s), ' + out.cleared + ' px');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
