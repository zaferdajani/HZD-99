// ONE SHEET OF PARTS -> a rig's plates and its anchors.
//
// The owner, 2026-11-17: "Do you have the ability to animate those agents between those moves?...
// instead of generating the artwork for every single move... to minimize the amount of artwork
// needed." An agent cost eight plates and a filmed walk; a RIG costs one sheet — the body taken
// apart on a screen (hood and head, torso, robe skirt, upper arm, forearm and hand, lower leg and
// foot, the prop) — and every move after that is a row of numbers in js/agentrig.js.
//
// A part is finished when it is cut clean and the rig knows where it JOINS. Both are done here from
// the sheet itself, and nothing is typed by eye: each part's anchors are measured off its own alpha
// (where its top and bottom are, where the shoulders sit on the torso, where the hand is in the
// sleeve, where the eyes are lit) and written as FRACTIONS of the part, so a smaller copy of the
// plate (tools/lowres.cjs) is still the same part.
//
//   node tools/agentparts.cjs <name>
//     reads   assets/source/agents/<name>/parts_asfired.webp   (pieces left to right, on a screen)
//     writes  assets/characters/agents/<name>/rig/<part>.webp  and  rig/rig.json
//   PARTS_ORDER=head,torso,skirt,uarm,farm,leg,prop   the pieces' names, left to right (the default)
//   PARTS_KEY=d0,d1   the chroma distance ramp (default 90,165)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const name = process.argv[2];
if (!name) { console.error('usage: agentparts.cjs <name>'); process.exit(2); }
const SRC = path.join(ROOT, 'assets', 'source', 'agents', name, 'parts_asfired.webp');
const OUT = path.join(ROOT, 'assets', 'characters', 'agents', name, 'rig');
const ORDER = (process.env.PARTS_ORDER || 'head,torso,skirt,uarm,farm,leg,prop').split(',');
const KEYD = (process.env.PARTS_KEY || '90,165').split(',').map(Number);
// shipped no taller than this (px): the whole figure stands about 600 px, like the 512 cells it replaces
const CAP = { head: 300, torso: 300, skirt: 420, uarm: 230, farm: 300, leg: 260, prop: 680 };

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  try {
    const p = await b.newPage();
    const R = await p.evaluate(async ({ d, ORDER, KEYD, CAP }) => {
      const im = new Image(); im.src = 'data:image/webp;base64,' + d; await im.decode();
      const W = im.naturalWidth, H = im.naturalHeight;
      const cv = Object.assign(document.createElement('canvas'), { width: W, height: H }), x = cv.getContext('2d', { willReadFrequently: true });
      x.drawImage(im, 0, 0); const id = x.getImageData(0, 0, W, H), px = id.data;
      // the screen: the border's median colour, keyed by distance, the spill pulled back
      const rs = [], gs = [], bs = []; const take = (xx, yy) => { const j = (yy * W + xx) * 4; rs.push(px[j]); gs.push(px[j + 1]); bs.push(px[j + 2]); };
      for (let xx = 0; xx < W; xx += 4) { take(xx, 0); take(xx, H - 1); } for (let yy = 0; yy < H; yy += 4) { take(0, yy); take(W - 1, yy); }
      const med = (q) => { q.sort((a, c) => a - c); return q[q.length >> 1]; }; const kR = med(rs), kG = med(gs), kB = med(bs);
      for (let i = 0; i < W * H; i++) { const j = i * 4, dr = px[j] - kR, dg = px[j + 1] - kG, db = px[j + 2] - kB, dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist <= KEYD[0]) { px[j + 3] = 0; continue; }
        if (dist < KEYD[1]) px[j + 3] = Math.round((dist - KEYD[0]) / (KEYD[1] - KEYD[0]) * 255);
        if (kG > kR && kG > kB && px[j + 1] > (px[j] + px[j + 2]) / 2) px[j + 1] = Math.round((px[j] + px[j + 2]) / 2); }
      // the pieces: connected bodies of what is left, the big ones left to right; a crumb belongs to the piece whose box it lies in
      const lab = new Int32Array(W * H), comps = []; const st = new Int32Array(W * H);
      for (let i = 0; i < W * H; i++) { if (lab[i] || px[i * 4 + 3] <= 48) continue; const n = comps.length + 1; let sp = 0; st[sp++] = i; lab[i] = n; const C = { n, x0: W, x1: 0, y0: H, y1: 0, a: 0 };
        while (sp) { const q = st[--sp], qx = q % W, qy = (q / W) | 0; C.a++; if (qx < C.x0) C.x0 = qx; if (qx > C.x1) C.x1 = qx; if (qy < C.y0) C.y0 = qy; if (qy > C.y1) C.y1 = qy;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = qx + dx, ny = qy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const k = ny * W + nx; if (!lab[k] && px[k * 4 + 3] > 48) { lab[k] = n; st[sp++] = k; } } }
        comps.push(C); }
      const big = comps.filter(c => c.a > W * H * 0.002).sort((a, c) => a.x0 - c.x0);
      if (big.length !== ORDER.length) return { err: 'expected ' + ORDER.length + ' pieces, found ' + big.length + ' (areas ' + big.map(c => c.a).join(', ') + ')' };
      const owner = new Int32Array(comps.length + 1);
      for (const c of comps) { let o = big.indexOf(c); if (o < 0) { const cx = (c.x0 + c.x1) / 2, cy = (c.y0 + c.y1) / 2; o = big.findIndex(q => cx >= q.x0 - 12 && cx <= q.x1 + 12 && cy >= q.y0 - 12 && cy <= q.y1 + 12); } owner[c.n] = o + 1; }
      const out = {};
      big.forEach((B, bi) => {
        const part = ORDER[bi]; let x0 = W, x1 = 0, y0 = H, y1 = 0;
        for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) { const l = lab[yy * W + xx]; if (l && owner[l] === bi + 1) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; } }
        const pad = 2, bw = x1 - x0 + 1 + pad * 2, bh = y1 - y0 + 1 + pad * 2;
        const cc = Object.assign(document.createElement('canvas'), { width: bw, height: bh }), cx2 = cc.getContext('2d'); const od = cx2.createImageData(bw, bh), o = od.data;
        for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) { const k = yy * W + xx, l = lab[k]; if (!l || owner[l] !== bi + 1) continue; const j = ((yy - y0 + pad) * bw + (xx - x0 + pad)) * 4; o[j] = px[k * 4]; o[j + 1] = px[k * 4 + 1]; o[j + 2] = px[k * 4 + 2]; o[j + 3] = px[k * 4 + 3]; }
        cx2.putImageData(od, 0, 0);
        // ---- what the rig needs to know, measured off the alpha ----
        const al = (xx, yy) => o[(yy * bw + xx) * 4 + 3] > 96;
        const span = (yy) => { let a = -1, c = -1; for (let xx = 0; xx < bw; xx++) if (al(xx, yy)) { if (a < 0) a = xx; c = xx; } return a < 0 ? null : [a, c]; };
        const band = (f0, f1) => { let sx = 0, n = 0, l = bw, r = 0; for (let yy = Math.floor(bh * f0); yy < Math.ceil(bh * f1); yy++) { const s = span(Math.min(bh - 1, Math.max(0, yy))); if (!s) continue; sx += (s[0] + s[1]) / 2; n++; if (s[0] < l) l = s[0]; if (s[1] > r) r = s[1]; } return n ? { cx: sx / n / bw, l: l / bw, r: r / bw } : { cx: 0.5, l: 0, r: 1 }; };
        const fx = (v) => +v.toFixed(4);
        const M = { top: [fx(band(0, 0.06).cx), 0], bot: [fx(band(0.94, 1).cx), 1] };
        if (part === 'head') {   // the lit eyes: hot amber
          const pts = []; for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) { const j = (yy * bw + xx) * 4; if (o[j + 3] > 200 && o[j] > 215 && o[j + 1] > 120 && o[j + 2] < 120 && o[j] - o[j + 2] > 120) pts.push([xx, yy]); }
          if (pts.length > 20) { const mx = pts.reduce((a, q) => a + q[0], 0) / pts.length; M.eyes = [-1, 1].map(sd => pts.filter(q => (q[0] - mx) * sd > 0)).filter(g => g.length > 8).map(g => [fx(g.reduce((a, q) => a + q[0], 0) / g.length / bw), fx(g.reduce((a, q) => a + q[1], 0) / g.length / bh)]); }
          else M.eyes = [];
        }
        if (part === 'torso') { const s = band(0.24, 0.36); M.shF = [fx(s.l + (s.r - s.l) * 0.16), 0.3]; M.shB = [fx(s.r - (s.r - s.l) * 0.16), 0.3]; }
        if (part === 'farm') {   // the hand: the dark metal in the lower part of the sleeve
          let sx = 0, sy = 0, n = 0; for (let yy = Math.floor(bh * 0.3); yy < bh; yy++) for (let xx = 0; xx < bw * 0.45; xx++) { const j = (yy * bw + xx) * 4; if (o[j + 3] > 200 && (o[j] * 2 + o[j + 1] * 5 + o[j + 2]) / 8 < 62) { sx += xx; sy += yy; n++; } }
          M.hand = n > 40 ? [fx(sx / n / bw), fx(sy / n / bh)] : [0.3, 0.7];
        }
        if (part === 'uarm') {   // the elbow: the dark joint under the cloth cap, in the lower middle of the sleeve
          let sx = 0, sy = 0, n = 0; for (let yy = Math.floor(bh * 0.45); yy < bh * 0.8; yy++) for (let xx = 0; xx < bw; xx++) { const j = (yy * bw + xx) * 4; if (o[j + 3] > 200 && (o[j] * 2 + o[j + 1] * 5 + o[j + 2]) / 8 < 62) { sx += xx; sy += yy; n++; } }
          M.elbow = n > 40 ? [fx(sx / n / bw), fx(sy / n / bh)] : [M.bot[0], 0.62];
        }
        if (part === 'leg') { const s = band(0.6, 0.7); M.ankle = [fx(s.cx), 0.72]; M.toe = [fx(band(0.9, 1).l), 1]; }
        if (part === 'prop') { M.ring = [fx(band(0.03, 0.13).cx), 0.08]; }
        const sc = Math.min(1, (CAP[part] || 320) / bh), sw = Math.max(1, Math.round(bw * sc)), sh = Math.max(1, Math.round(bh * sc));
        const oc = Object.assign(document.createElement('canvas'), { width: sw, height: sh }), ox = oc.getContext('2d'); ox.imageSmoothingQuality = 'high'; ox.drawImage(cc, 0, 0, sw, sh);
        out[part] = Object.assign({ w: sw, h: sh, src: [x0, y0, bw - pad * 2, bh - pad * 2] }, M, { url: oc.toDataURL('image/webp', 0.9) });
      });
      return { parts: out, key: [kR, kG, kB], sheet: [W, H] };
    }, { d: fs.readFileSync(SRC).toString('base64'), ORDER, KEYD, CAP });
    if (R.err) { console.error('agentparts: ' + R.err); process.exit(1); }
    fs.mkdirSync(OUT, { recursive: true });
    const rig = { name, sheet: R.sheet, parts: {} };
    for (const part of ORDER) { const P = R.parts[part]; fs.writeFileSync(path.join(OUT, part + '.webp'), Buffer.from(P.url.split(',')[1], 'base64')); delete P.url; rig.parts[part] = P;
      console.log('  ' + part.padEnd(6) + JSON.stringify(P)); }
    fs.writeFileSync(path.join(OUT, 'rig.json'), JSON.stringify(rig, null, 1) + '\n');
    console.log('agentparts: ' + name + ' — ' + ORDER.length + ' parts, ' + path.relative(ROOT, path.join(OUT, 'rig.json')));
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
