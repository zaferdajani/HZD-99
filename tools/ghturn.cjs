// GRAVEHORN'S TURN: the turnaround plate -> two shipped plates + their measured anchors.
//
// The owner, 2026-11-16: "I did ask you to check out how this animal moves and rotates. Because now
// it's just rotating as a simple paper leaf instead of actually rotating like a normal animal."
// His turn was the rig squashed flat and mirrored (c.scale(sx, 1) through zero). A heavy quadruped
// turns with its head and shoulders leading and its hindquarters following round (the shoulder
// girdle leads the pelvic girdle in yaw — Moreno & Biewener's turning goats; the forelimb is the
// stronger limb in a rhinoceros and carries the turn). In profile that is three pictures, not one
// squashed: three-quarter, head-on, three-quarter the other way. Those two views are a fired plate
// (assets/source/gravehorn/turn.webp, against design.webp) and this cuts them.
//
// The plate came back with a soft, part-transparent studio haze round each body: only what is
// SOLID is rhinoceros (alpha >= 235), opened by four pixels so no strand of the haze survives.
// Each body is cropped to its own box; its FLOOR is the lowest solid row (the hooves), its axis the
// middle of its hooves' span, and its EYES are found where the art lit them (the red glow), never
// typed by eye.
//
// 2026-11-17: fired again at 2k (turn3.webp, on a black field — keyed here by a flood from the
// border, so the black INSIDE him stays) with a third body, the REAR three-quarter, and a fourth
// plate of its own, tail-on (turn_tail.webp), so a turn AWAY from the camera is three pictures too.
// Bodies are cut at full size and shipped no taller than MAXH: he is drawn 152 world px high.
//
//   node tools/ghturn.cjs      # writes assets/characters/gravehorn/turn{34,_front,_rear,_tail}.webp, prints GH_TURN
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SRCDIR = path.join(ROOT, 'assets', 'source', 'gravehorn');
const SHEETS = [{ file: 'turn3.webp', names: ['turn34', 'turn_front', 'turn_rear'] }, { file: 'turn_tail.webp', names: ['turn_tail'] }];
const MAXH = 620;
const OUT = path.join(ROOT, 'assets', 'characters', 'gravehorn');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const p = await b.newPage();
  for (const SH of SHEETS) {
  const SRC = path.join(SRCDIR, SH.file);
  if (!fs.existsSync(SRC)) { console.log('  (' + SH.file + ' not fired yet)'); continue; }
  const R = await p.evaluate(async ({ d, want, MAXH }) => {
    const i = new Image(); i.src = 'data:image/webp;base64,' + d; await i.decode();
    const W = i.naturalWidth, H = i.naturalHeight;
    const c = Object.assign(document.createElement('canvas'), { width: W, height: H }); const x = c.getContext('2d'); x.drawImage(i, 0, 0);
    const id = x.getImageData(0, 0, W, H), px = id.data;
    // a plate fired on black: the field is what a flood from the border reaches
    let opaque = 0; for (let k = 0; k < W * H; k += 97) if (px[k * 4 + 3] > 250) opaque++;
    if (opaque > (W * H / 97) * 0.98) {
      const field = new Uint8Array(W * H), stack = new Int32Array(W * H); let sp = 0;
      const push = (q) => { if (!field[q] && (px[q * 4] * 2 + px[q * 4 + 1] * 5 + px[q * 4 + 2]) / 8 <= 2.5) { field[q] = 1; stack[sp++] = q; } };
      for (let xx = 0; xx < W; xx++) { push(xx); push((H - 1) * W + xx); }
      for (let yy = 0; yy < H; yy++) { push(yy * W); push(yy * W + W - 1); }
      while (sp > 0) { const q = stack[--sp], qx = q % W, qy = (q / W) | 0;
        if (qx > 0) push(q - 1); if (qx < W - 1) push(q + 1); if (qy > 0) push(q - W); if (qy < H - 1) push(q + W); }
      for (let k = 0; k < W * H; k++) if (field[k]) px[k * 4 + 3] = 0;
    }
    const m0 = new Uint8Array(W * H); for (let k = 0; k < W * H; k++) m0[k] = px[k * 4 + 3] >= 235 ? 1 : 0;
    let m = m0.slice();
    const step = (src, grow) => { const o = src.slice();
      for (let yy = 1; yy < H - 1; yy++) for (let xx = 1; xx < W - 1; xx++) { const k = yy * W + xx; let n = 0; for (const dd of [1, -1, W, -W, W + 1, W - 1, -W + 1, -W - 1]) n += src[k + dd];
        if (grow) { if (!src[k] && n > 0 && m0[k]) o[k] = 1; } else if (src[k] && n < 8) o[k] = 0; } return o; };
    for (let q = 0; q < 4; q++) m = step(m, false);
    const lab = new Int32Array(W * H), comps = [null]; let n = 0;
    for (let k = 0; k < W * H; k++) { if (!m[k] || lab[k]) continue; n++; const st = [k]; lab[k] = n; let sz = 0;
      while (st.length) { const at = st.pop(); sz++; for (const o of [1, -1, W, -W]) { const q2 = at + o; if (q2 < 0 || q2 >= W * H || lab[q2] || !m[q2]) continue; lab[q2] = n; st.push(q2); } }
      comps.push(sz); }
    for (let k = 0; k < W * H; k++) if (m[k] && comps[lab[k]] < W * H * 0.02) m[k] = 0;
    for (let q = 0; q < 6; q++) m = step(m, true);
    // the two bodies, left to right
    const lab2 = new Int32Array(W * H), boxes = []; n = 0;
    for (let k = 0; k < W * H; k++) { if (!m[k] || lab2[k]) continue; n++; const st = [k]; lab2[k] = n; const B = { x0: W, x1: 0, y0: H, y1: 0, n: 0, id: n };
      while (st.length) { const at = st.pop(), ax = at % W, ay = (at / W) | 0; B.n++; if (ax < B.x0) B.x0 = ax; if (ax > B.x1) B.x1 = ax; if (ay < B.y0) B.y0 = ay; if (ay > B.y1) B.y1 = ay;
        for (const o of [1, -1, W, -W]) { const q2 = at + o; if (q2 < 0 || q2 >= W * H || lab2[q2] || !m[q2]) continue; lab2[q2] = n; st.push(q2); } }
      boxes.push(B); }
    boxes.sort((a, bb) => bb.n - a.n); const two = boxes.slice(0, want).sort((a, bb) => a.x0 - bb.x0);
    const out = [];
    for (const B of two) {
      const pad = 3, bw = B.x1 - B.x0 + 1 + pad * 2, bh = B.y1 - B.y0 + 1 + pad * 2;
      const cc = Object.assign(document.createElement('canvas'), { width: bw, height: bh }); const cx = cc.getContext('2d');
      const od = cx.createImageData(bw, bh);
      let hx0 = W, hx1 = 0; const eyes = [];
      for (let yy = B.y0; yy <= B.y1; yy++) for (let xx = B.x0; xx <= B.x1; xx++) { const k = yy * W + xx; if (lab2[k] !== B.id) continue;
        const o = ((yy - B.y0 + pad) * bw + (xx - B.x0 + pad)) * 4; od.data[o] = px[k * 4]; od.data[o + 1] = px[k * 4 + 1]; od.data[o + 2] = px[k * 4 + 2];
        let nb = 0; for (const dd of [1, -1, W, -W]) if (lab2[k + dd] !== B.id) nb++; od.data[o + 3] = nb ? Math.round(255 * (1 - nb * 0.2)) : 255;
        if (yy > B.y1 - 10) { if (xx < hx0) hx0 = xx; if (xx > hx1) hx1 = xx; }
        // the lit eye: hot red-orange, in the upper 60% of the body
        if (px[k * 4] > 235 && px[k * 4 + 1] > 70 && px[k * 4 + 1] < 190 && px[k * 4 + 2] < 110 && yy < B.y0 + (B.y1 - B.y0) * 0.6) eyes.push([xx, yy]); }
      cx.putImageData(od, 0, 0);
      // cluster the eye pixels left / right of the body's middle
      const midx = (B.x0 + B.x1) / 2; const E = [];
      for (const side of [-1, 1]) { const pts = eyes.filter(e => (e[0] - midx) * side > 0); if (pts.length < 12) continue;
        E.push([pts.reduce((a, e) => a + e[0], 0) / pts.length - B.x0 + pad, pts.reduce((a, e) => a + e[1], 0) / pts.length - B.y0 + pad]); }
      // shipped no taller than MAXH; every anchor is a FRACTION, so it survives the scale
      const sc = Math.min(1, MAXH / bh), sw = Math.round(bw * sc), sh = Math.round(bh * sc);
      const oc = Object.assign(document.createElement('canvas'), { width: sw, height: sh }); const ox = oc.getContext('2d'); ox.imageSmoothingQuality = 'high'; ox.drawImage(cc, 0, 0, sw, sh);
      out.push({ w: sw, h: sh, ay: (B.y1 - B.y0 + pad) / bh, ax: ((hx0 + hx1) / 2 - B.x0 + pad) / bw, eyes: E.map(e => [+(e[0] / bw).toFixed(4), +(e[1] / bh).toFixed(4)]), allEyes: eyes.length, url: oc.toDataURL('image/webp', 0.92) });
    }
    return out;
  }, { d: fs.readFileSync(SRC).toString('base64'), want: SH.names.length, MAXH });
  const names = SH.names;
  R.forEach((r, i) => { fs.writeFileSync(path.join(OUT, names[i] + '.webp'), Buffer.from(r.url.split(',')[1], 'base64'));
    console.log('  ' + names[i] + ': { w: ' + r.w + ', h: ' + r.h + ', ax: ' + r.ax.toFixed(4) + ', ay: ' + r.ay.toFixed(4) + ', eyes: ' + JSON.stringify(r.eyes) + ' },   // ' + (fs.statSync(path.join(OUT, names[i] + '.webp')).size / 1024).toFixed(0) + ' KB, eye px ' + r.allEyes); });
  }
  await b.close();
})();
