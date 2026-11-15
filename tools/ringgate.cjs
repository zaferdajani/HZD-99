// THE RING GATES: master plate -> shipped plate + the opening's measured geometry.
//
// Every depth door that is not a shop front is a machine RING (owner, 2026-11-15:
// "we are in a universe full of robots... something that looks like a Stargate").
// The ring is a fired plate with a real hole in it; the live field inside the hole
// is light, drawn by the engine BEHIND the plate (drawRingField, js/game.js), so
// the plate's own inner edge is what cuts it. For that the engine needs to know
// where the hole is, and that is read off the plate here, never typed by eye:
//
//   - the HOLE is the transparent region connected to the plate's centre;
//   - the FLOOR is the lowest opaque row (the sill stands on the room's floor).
//
// Masters live in assets/source/gates/ring_<name>.webp at 1024 (RULE ZERO: author
// once at full quality). The shipped copy is 640 wide with the generator's soft
// halo cut by level (alpha under 28 is glow, not metal).
//
//   node tools/ringgate.cjs            # writes assets/backgrounds/ring_*.webp, prints RING_GATE rows
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', 'assets', 'source', 'gates');
const OUT = path.join(__dirname, '..', 'assets', 'backgrounds');
(async () => {
  const names = fs.readdirSync(SRC).filter(f => /^ring_.*\.webp$/.test(f)).sort();
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  for (const f of names) {
    const r = await p.evaluate(async ({ d, SIZE }) => {
      const i = new Image(); i.src = 'data:image/webp;base64,' + d; await i.decode();
      const W = SIZE, H = Math.round(SIZE * i.naturalHeight / i.naturalWidth);
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
      x.drawImage(i, 0, 0, W, H);
      const id = x.getImageData(0, 0, W, H), px = id.data;
      for (let k = 3; k < px.length; k += 4) if (px[k] < 28) px[k] = 0;
      x.putImageData(id, 0, 0);
      // the hole: flood the transparency from the centre
      const seen = new Uint8Array(W * H), q = [(H >> 1) * W + (W >> 1)];
      seen[q[0]] = 1;
      let x0 = W, x1 = 0, y0 = H, y1 = 0, n = 0, edge = 0;
      while (q.length) {
        const at = q.pop(), px2 = at % W, py = (at / W) | 0;
        n++;
        if (px2 < x0) x0 = px2; if (px2 > x1) x1 = px2; if (py < y0) y0 = py; if (py > y1) y1 = py;
        if (px2 === 0 || py === 0 || px2 === W - 1 || py === H - 1) edge = 1;
        for (const o of [1, -1, W, -W]) {
          const nx = at + o;
          if (nx < 0 || nx >= W * H || seen[nx]) continue;
          if ((o === 1 && px2 === W - 1) || (o === -1 && px2 === 0)) continue;
          if (px[nx * 4 + 3] < 40) { seen[nx] = 1; q.push(nx); }
        }
      }
      // the widest row of the hole is the ring's own diameter; its centre is the ring's
      let wide = 0, wy = 0;
      for (let yy = y0; yy <= y1; yy++) {
        let a = -1, bb = -1;
        for (let xx = x0; xx <= x1; xx++) if (seen[yy * W + xx]) { if (a < 0) a = xx; bb = xx; }
        if (bb - a > wide) { wide = bb - a; wy = yy; }
      }
      let floor = 0;
      for (let yy = H - 1; yy > 0 && !floor; yy--) {
        let cnt = 0;
        for (let xx = 0; xx < W; xx++) if (px[(yy * W + xx) * 4 + 3] > 128) cnt++;
        if (cnt > W * 0.25) floor = yy;
      }
      return { W, H, x0, x1, y0, y1, wy, wide, n, edge, floor, url: c.toDataURL('image/webp', 0.9) };
    }, { d: fs.readFileSync(path.join(SRC, f)).toString('base64'), SIZE: 640 });
    if (r.edge) { console.log('!! ' + f + ': the transparency at the centre reaches the frame — the ring is not closed'); process.exitCode = 1; continue; }
    fs.writeFileSync(path.join(OUT, f), Buffer.from(r.url.split(',')[1], 'base64'));
    const fr = v => +(v).toFixed(4);
    const key = f.replace(/^ring_(.)(.*)\.webp$/, (m, a, z) => 'ring' + a.toUpperCase() + z);
    // cx, top, bottom of the hole and its half-width, and the floor line — all as fractions of the plate
    console.log('  ' + key + ': { cx: ' + fr((r.x0 + r.x1) / 2 / r.W) + ', top: ' + fr(r.y0 / r.H) + ', bot: ' + fr(r.y1 / r.H)
      + ', rx: ' + fr((r.x1 - r.x0) / 2 / r.W) + ', mid: ' + fr(r.wy / r.H) + ', floor: ' + fr(r.floor / r.H) + ', asp: ' + fr(r.W / r.H) + ' },'
      + '   // ' + (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0) + ' KB');
  }
  await b.close();
})();
