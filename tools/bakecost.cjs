// HOW BIG CAN A ROOM ACTUALLY BE? renderTileLayer bakes the whole room into
// one canvas, so room size is a rendering decision, not a design one — and
// nobody had measured where it stops being free. The answer decides whether
// the kingdom sessions can widen rooms freely or whether the code session owes
// them chunked baking first.
//
//   node tools/bakecost.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await b.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', e => console.error('ERR', e.message));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const rows = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv);
    const out = [];
    // synthetic rooms built from A1's own recipe at growing sizes
    const SIZES = [[32, 17], [48, 17], [64, 17], [96, 17], [64, 34], [96, 34], [128, 34]];
    for (const [w, h] of SIZES) {
      const id = 'BAKE_' + w + 'x' + h;
      ROOMS[id] = { zone: 'A', w, h, exits: {}, ents: [],
        build(g) {
          frame(g);
          for (let x = 1; x < w - 1; x++) for (let y = h - 2; y < h; y++) g[y][x] = '#';
          for (let i = 4; i < w - 6; i += 7) { const yy = 6 + (i % 5); for (let k = 0; k < 4; k++) g[yy][i + k] = '='; }
        } };
      if (typeof MAPPOS !== 'undefined') MAPPOS[id] = [0, 0, 1, 1];
      loadRoom(id);
      for (let i = 0; i < 30; i++) await new Promise(k => requestAnimationFrame(k));
      // force a rebake and time it
      // ...and WHICH PASS costs it. A number without a culprit cannot be acted
      // on: the tile draw, the cave erosion and the slab silhouette pass are
      // three different jobs over the same canvas.
      let best = 1e9, parts = null;
      const e0 = erodeCaveEdges, s0 = slabSilhouettePass;
      for (let t = 0; t < 3; t++) {
        const acc = { erode: 0, slab: 0 };
        window.erodeCaveEdges = (x) => { const a = performance.now(); const r = e0(x); acc.erode += performance.now() - a; return r; };
        window.slabSilhouettePass = (x) => { const a = performance.now(); const r = s0(x); acc.slab += performance.now() - a; return r; };
        tileDirty = true;
        const t0 = performance.now();
        renderTileLayer(PAL.A);
        const ms = performance.now() - t0;
        if (ms < best) { best = ms; parts = acc; }
        await new Promise(k => requestAnimationFrame(k));
      }
      window.erodeCaveEdges = e0; window.slabSilhouettePass = s0;
      out.push({ size: w + 'x' + h,
                 px: (w * 32) + 'x' + (h * 32),
                 screens: +(w * 32 / 960).toFixed(2) + ' x ' + +(h * 32 / 540).toFixed(2),
                 mb: +((w * 32 * h * 32 * 4) / 1048576).toFixed(1),
                 bakeMs: +best.toFixed(1),
                 erode: +parts.erode.toFixed(1), slab: +parts.slab.toFixed(1),
                 rest: +(best - parts.erode - parts.slab).toFixed(1) });
    }
    return out;
  });
  console.log('\nTILE BAKE COST — one canvas per room, timed on the real renderer\n');
  console.log('  tiles      pixels        screens        canvas   bake       tiles    erode    slab');
  for (const r of rows)
    console.log('  ' + r.size.padEnd(9) + r.px.padEnd(14) + r.screens.padEnd(15) +
                (r.mb + ' MB').padEnd(9) + (r.bakeMs + ' ms').padEnd(11) +
                (r.rest + ' ms').padEnd(9) + (r.erode + ' ms').padEnd(9) + r.slab + ' ms');
  console.log('\n  (a bake happens once per room entry; 16 ms is one frame at 60 fps)\n');
  await b.close();
})();
