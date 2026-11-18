#!/usr/bin/env node
// NO LIGHT ROUND A BODY — INCLUDING THE LIGHT THAT WAS PAINTED ON IT.
//
// Owner, four times: "Why still framed with light ?!!!" The rim the ENGINE drew was removed
// on 2026-11-16 (js/foeread.js). It was still there on the cheetah, because the cheetah's
// standing plate was FIRED with a cyan rim light painted down its back, hind leg and tail:
// 11.7% of its outer edge was cyan against 1.3% of its inside, while its filmed walk had
// none — so it wore an outline standing and lost it walking. Image models put a teal rim
// on a figure by habit, and a chroma key leaves the same colour behind.
//
// This takes it off the plate without firing anything: every pixel in the outer few pixels
// of the silhouette that is cyan, where the body just inside it is NOT cyan, is given the
// body's own colour from just inside. A part that really is cyan (her ears, a purified
// robe, an ice shell) is cyan inside as well and is left exactly as it was.
//
//   node tools/defringe.cjs --scan                 every keyed plate under assets/characters: edge vs inside
//   node tools/defringe.cjs --check                exit 1 if any plate wears a rim (tests/no-rim-baked.cjs)
//   node tools/defringe.cjs <plate.webp> [...]     fix in place
//   node tools/defringe.cjs --all                  fix every plate --check would refuse
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
// a rim: this much of the outer edge is cyan, and at least this many times what the inside is
const RIM_EDGE = 0.05, RIM_RATIO = 3;
function walk(dir, out) { for (const n of fs.readdirSync(dir)) { const f = path.join(dir, n); if (fs.statSync(f).isDirectory()) walk(f, out); else if (/\.(webp|png)$/i.test(n)) out.push(f); } return out; }
const PAGE = (fix) => `async (src) => {
  const im = new Image(); im.src = src; await im.decode();
  const W = im.naturalWidth, H = im.naturalHeight, cv = Object.assign(document.createElement('canvas'), { width: W, height: H }), x = cv.getContext('2d', { willReadFrequently: true });
  x.drawImage(im, 0, 0); const id = x.getImageData(0, 0, W, H), d = id.data, N = W * H;
  let clearN = 0; for (let i = 0; i < N; i++) if (d[i * 4 + 3] < 40) clearN++;
  if (clearN / N < 0.08) return { skip: 'not a keyed plate' };
  // distance to the nearest clear pixel, up to 9 (two chamfer passes)
  const D = new Uint8Array(N); for (let i = 0; i < N; i++) D[i] = d[i * 4 + 3] < 40 ? 0 : 99;
  for (let pass = 0; pass < 2; pass++) { const fwd = pass === 0;
    for (let k = 0; k < N; k++) { const i = fwd ? k : N - 1 - k, px = i % W, py = (i / W) | 0; if (!D[i]) continue; let m = D[i];
      const nb = fwd ? [[-1, 0], [0, -1], [-1, -1], [1, -1]] : [[1, 0], [0, 1], [1, 1], [-1, 1]];
      for (const [ox, oy] of nb) { const qx = px + ox, qy = py + oy; const v = (qx < 0 || qy < 0 || qx >= W || qy >= H) ? 0 : D[qy * W + qx]; if (v + 1 < m) m = v + 1; } D[i] = m; } }
  const cyan = (i) => { const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b); return g > r * 1.2 && b > r * 1.2 && mx > 96 && (mx - mn) / mx > 0.22; };
  const BAND = +(${JSON.stringify(process.env.DEFRINGE_BAND || '')} || 4);
  let edge = 0, edgeC = 0, ins = 0, insC = 0;
  for (let i = 0; i < N; i++) { if (d[i * 4 + 3] <= 100) continue; if (D[i] <= 3) { edge++; if (cyan(i)) edgeC++; } else { ins++; if (cyan(i)) insC++; } }
  const before = { edge: edge ? edgeC / edge : 0, inside: ins ? insC / ins : 0, n: edge };
  if (!${fix} || edge < 200) return { before };
  let changed = 0; const out = new Uint8ClampedArray(d);
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) { const i = py * W + px; if (d[i * 4 + 3] < 12 || D[i] > BAND || !cyan(i)) continue;
    // the body just inside: solid pixels a little deeper than this one, within reach
    let n = 0, c = 0, sr = 0, sg = 0, sb = 0, sw = 0; const R = 8;
    for (let oy = -R; oy <= R; oy++) for (let ox = -R; ox <= R; ox++) { const qx = px + ox, qy = py + oy; if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue; const j = qy * W + qx;
      if (d[j * 4 + 3] < 200 || D[j] < BAND + 1) continue; n++; if (cyan(j)) { c++; continue; } const w = 1 / (1 + ox * ox + oy * oy); sr += d[j * 4] * w; sg += d[j * 4 + 1] * w; sb += d[j * 4 + 2] * w; sw += w; }
    if (n >= 6 && c / n > 0.3) continue;                 // it is cyan inside too: that is the part's own colour
    if (!sw || n < 12) continue;                         // no body behind it (a drip, a wire, a whisker is its own thing): leave it
    // the body's colour, at this pixel's own brightness (a rim is bright; the edge it sat on is not lit)
    const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b, br = sr / sw, bg = sg / sw, bb = sb / sw;
    const k = Math.min(1.15, Math.max(0.55, lum(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) / Math.max(1, lum(br, bg, bb)) * 0.8));
    out[i * 4] = br * k; out[i * 4 + 1] = bg * k; out[i * 4 + 2] = bb * k; changed++; }
  id.data.set(out); x.putImageData(id, 0, 0);
  let e2 = 0, e2c = 0; const d2 = out, cy2 = (i) => { const r = d2[i * 4], g = d2[i * 4 + 1], b = d2[i * 4 + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b); return g > r * 1.2 && b > r * 1.2 && mx > 96 && (mx - mn) / mx > 0.22; };
  for (let i = 0; i < N; i++) { if (d2[i * 4 + 3] <= 100 || D[i] > 3) continue; e2++; if (cy2(i)) e2c++; }
  return { before, after: { edge: e2 ? e2c / e2 : 0 }, changed, url: cv.toDataURL(src.startsWith('data:image/png') ? 'image/png' : 'image/webp', 0.93) };
}`;
const isRim = (m) => m && m.edge >= RIM_EDGE && m.edge >= m.inside * RIM_RATIO;
// not bodies, or cyan by design all the way through (measured, looked at): never "fixed"
// (her own plates are left: the cyan line on her shell is her design, and she is the owner's to judge)
// (a dialog BUST is a close-up portrait: the teal on Servo's dome is a hand's width of painted shading, not an
// edge, and taking it off left blotches — looked at, put back. demon-idle.png is a legacy sheet nothing draws.)
const LEAVE = /\/(eye\/lattice|gear\/|flora\/|agents\/[a-z]+\/pure|sage\/pure|chime\/ring|hero\/|hzd_|npc\/bust\/|demon-idle)/;
async function run(files, fix) {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }), p = await b.newPage(); const out = [];
  for (const f of files) { const buf = fs.readFileSync(f), mime = /\.png$/i.test(f) ? 'image/png' : 'image/webp';
    const r = await p.evaluate('(' + PAGE(fix ? 'true' : 'false') + ')(' + JSON.stringify('data:' + mime + ';base64,' + buf.toString('base64')) + ')');
    if (fix && r.url && r.changed) fs.writeFileSync(f, Buffer.from(r.url.split(',')[1], 'base64'));
    out.push(Object.assign({ file: path.relative(ROOT, f) }, r)); }
  await b.close(); return out;
}
module.exports = { run, isRim, LEAVE, walk, ROOT };
if (require.main === module) (async () => {
  const a = process.argv.slice(2), all = () => walk(path.join(ROOT, 'assets/characters'), []).sort();
  const pc = v => (v * 100).toFixed(1).padStart(5) + '%';
  if (a[0] === '--scan' || a[0] === '--check' || a[0] === '--all') {
    const R = (await run(all(), false)).filter(r => r.before), rims = R.filter(r => isRim(r.before) && !LEAVE.test('/' + r.file));
    if (a[0] === '--scan') for (const r of R.sort((x, y) => y.before.edge - x.before.edge).slice(0, 60)) console.log(pc(r.before.edge), 'edge', pc(r.before.inside), 'inside', isRim(r.before) ? (LEAVE.test('/' + r.file) ? 'left ' : 'RIM  ') : '     ', r.file);
    if (a[0] === '--all') { const F = await run(rims.map(r => path.join(ROOT, r.file)), true); for (const r of F) console.log(pc(r.before.edge), '->', pc(r.after ? r.after.edge : r.before.edge), String(r.changed || 0).padStart(6), 'px ', r.file); return; }
    for (const r of rims) console.log(pc(r.before.edge), 'edge', pc(r.before.inside), 'inside  RIM ', r.file);
    console.log(rims.length ? rims.length + ' plate(s) wear a painted rim: node tools/defringe.cjs --all' : R.length + ' keyed plates, none wears a rim');
    if (a[0] === '--check') process.exit(rims.length ? 1 : 0); return; }
  for (const r of await run(a.map(f => path.resolve(f)), true)) console.log(r.skip || (pc(r.before.edge) + ' -> ' + pc(r.after ? r.after.edge : r.before.edge) + '  ' + (r.changed || 0) + ' px'), r.file);
})().catch(e => { console.error(e); process.exit(1); });
