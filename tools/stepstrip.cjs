// A STEP UP INTO A DOOR, cut from a delivered sheet WITHOUT flattening the step.
//
// tools/movestrip.cjs foot-anchors every cell to one floor line, which is right
// for a move made on flat ground and exactly wrong here: the climb and the hop
// into a raised doorway (owner, 2026-11-21: "it raises a leg and climbs like a
// ladder or an elevated object, or it hops inside of it") ARE the change of
// height. So this keeps every frame where the sheet put it relative to frame 1's
// soles, and does only what the strip needs:
//   - finds the frames as runs of ink separated by clear columns (never a pitch);
//   - ONE scale for the whole strip, so frame 1's body is `--body` px tall — the
//     height her walk-away clip draws her at (183 of a 320 cell), so the climb
//     cuts straight on from the turn;
//   - frame 1's soles on `--floor` (311, the walk clip's floor row); every other
//     frame keeps its own height above it; each frame centred on its own ink.
//
//   node tools/stepstrip.cjs <sheet.png> <out.png> [--cell 320] [--body 183] [--floor 311] [--frames 8]
//   then: node tools/towebp.cjs <out.png> <out.webp> 0.9
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? +args[i + 1] : d; };
const [src, out] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!src || !out) { console.error('usage: node tools/stepstrip.cjs <sheet.png> <out.png> [--cell 320] [--body 183] [--floor 311]'); process.exit(1); }
const CELL = opt('cell', 320), BODY = opt('body', 183), FLOOR = opt('floor', 311), NF = opt('frames', 0);
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  const url = 'data:image/png;base64,' + fs.readFileSync(src).toString('base64');
  const r = await p.evaluate(async ({ url, CELL, BODY, FLOOR, NF }) => {
    const img = new Image(); img.src = url; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const a = x.getImageData(0, 0, W, H).data, ink = (i, j) => a[(j * W + i) * 4 + 3] > 40;
    const colInk = []; for (let i = 0; i < W; i++) { let n = 0; for (let j = 0; j < H; j++) if (ink(i, j)) { n = 1; break; } colInk.push(n); }
    const frames = []; let s = -1, gap = 0;
    for (let i = 0; i < W; i++) {
      if (colInk[i]) { if (s < 0) s = i; gap = 0; }
      else if (s >= 0 && ++gap > 6) { frames.push([s, i - gap]); s = -1; gap = 0; }
    }
    if (s >= 0) frames.push([s, W - 1]);
    // a long blade can bridge the gap between two frames: given the count from the
    // brief, split the widest run at its thinnest column in its middle half
    const colN = []; for (let i = 0; i < W; i++) { let n = 0; for (let j = 0; j < H; j++) if (ink(i, j)) n++; colN.push(n); }
    while (NF && frames.length < NF) {
      let wi = 0; frames.forEach((f, i) => { if (f[1] - f[0] > frames[wi][1] - frames[wi][0]) wi = i; });
      const [a0, a1] = frames[wi], L = a1 - a0; let best = a0 + (L >> 1);
      for (let i = a0 + Math.floor(L * 0.25); i <= a0 + Math.floor(L * 0.75); i++) if (colN[i] < colN[best]) best = i;
      frames.splice(wi, 1, [a0, best - 1], [best + 1, a1]);
    }
    const box = frames.map(([x0, x1]) => { let t = H, bt = 0; for (let i = x0; i <= x1; i++) for (let j = 0; j < H; j++) if (ink(i, j)) { if (j < t) t = j; if (j > bt) bt = j; } return { x0, x1, t, b: bt }; });
    const k = BODY / (box[0].b - box[0].t), sole0 = box[0].b;
    const o = document.createElement('canvas'); o.width = CELL * box.length; o.height = CELL;
    const ox = o.getContext('2d'); ox.imageSmoothingQuality = 'high';
    const placed = [];
    box.forEach((f, n) => {
      const w = (f.x1 - f.x0 + 1) * k, h = (f.b - f.t + 1) * k;
      const dx = n * CELL + CELL / 2 - w / 2, dy = FLOOR - (sole0 - f.t) * k;
      ox.drawImage(c, f.x0, f.t, f.x1 - f.x0 + 1, f.b - f.t + 1, dx, dy, w, h);
      placed.push({ top: Math.round(dy), sole: Math.round(dy + h), clipped: dy < 0 || dx < n * CELL || dx + w > (n + 1) * CELL });
    });
    return { n: box.length, scale: +k.toFixed(3), placed, png: o.toDataURL('image/png') };
  }, { url, CELL, BODY, FLOOR, NF });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(r.png.split(',')[1], 'base64'));
  console.log(path.basename(src), r.n, 'frames, scale', r.scale, 'soles', r.placed.map(q => q.sole).join(' '), r.placed.some(q => q.clipped) ? 'CLIPPED' : '');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
