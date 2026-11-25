// ===========================================================================
// THE DOOR TO KINGDOM 2 — grown over, and torn open by the lion it waited for.
//
// The owner, 2026-11-25: "It would be a nice animation to cover the door with leaves and plants
// that stick to it, just like the climbing plants. That when I free Nilfang, it simply removes
// it. It does a move like a roar or something ... And the trees will just respond and create an
// opening for it ... this door leads to the second kingdom ... this door should look different
// than the ones before and similar to the ones within the second kingdom. To make the story
// connected."
//
// THE DOOR is a ring of the Conduits' own make (RING_GATE.ringConduit: cables wound round the
// band, knotted at the crown), standing in NULLFANG's arena (GATE_STORY.A4 in js/game.js).
// THE VINES are one fired overlay (assets/source/gates/vines_conduit.webp, Higgsfield, cut by
// tools/vinecut.py) in the ring's own frame, drawn over it with the ring's own box, so they grip
// the band where the band is. They breathe in the meadow's air; while he walks to the door they
// shiver.
// THE OPENING is the ring wake every door in the game has (ringWakeStep, js/game.js): the freed
// guardian goes to his door, faces it and roars — and here the roar TEARS THE VINES OFF. The
// overlay is cut, once, into ragged pieces along the art itself (cells with torn edges, never a
// grid); each peels from its top as the roar reaches it, then is thrown the way the roar pushes,
// turning end over end like a sheet of metal (edge-on and back), and comes down on the ground
// and sinks into the grass. Nothing fades and nothing slides (the ledger: real motion). The
// clumps either side of the door are pushed back and STAY bent out of its way
// (js/nfcover.js nfCoverMakeWay) — the opening the owner asked the trees to make.
// Then the field wakes in the ring, and the door is a door: the save remembers (rw_A4>A14).
// No light round any of it (the ledger): the vines and the pieces are drawn at full strength,
// with no glow, rim or outline; the vine door's wake has no white-out.
// ===========================================================================
// the vine door's wake: he crosses his arena to it (walk, at his own prowl — 175 px/s is the
// stride his filmed stalk is played at; faster and his feet would slide), roars at the end of the
// walk, the vines are off by `lit`, when the field takes its light; she gets her controls back at T
const K2_WAKE = Object.freeze({ T: 4.9, walk: 2.4, walkV: 175, lit: 3.8, rise: 0.9 });
const K2V = Object.freeze({
  key: 'ringConduitVines', ring: 'ringConduit',
  grid: 128,          // the label grid the pieces are cut on (per side)
  n: 17,              // pieces
  g: 900,             // px/s² a torn piece falls by
  fall: 260,          // ...the speed a tumbling sheet cannot fall faster than
  sink: 1.3,          // s a landed piece takes to go down into the grass
});
const K2D = { cut: null, room: null, pieces: null, last: 0, torn: null };
// the scenery's own dice (the boss ladder seeds Math.random)
let K2_SEED = 0x6c8e9cf5;
function k2Rnd(a, b) { K2_SEED = (K2_SEED * 1664525 + 1013904223) >>> 0; return a + (K2_SEED / 4294967296) * (b - a); }

function k2DoorDef() { return typeof GATE_STORY !== 'undefined' ? GATE_STORY.A4 : null; }
// open for good: woken once, remembered
function k2DoorOpen() {
  const d = k2DoorDef();
  return !!(d && G.save && G.save.flags && typeof ringWakeKey === 'function' && G.save.flags[ringWakeKey(d, 'A4')]);
}
// the vines still hold it: not yet woken, and not being torn off right now
function k2VinesOn(def) {
  if (!def || def.style !== 'k2' || def.to !== 'A14') return false;        // (the far side, A14, never had them)
  if (G.save && G.save.flags && G.save.flags[ringWakeKey(def)]) return false;
  if (K2D.torn === G.roomId + ':' + ringWakeKey(def)) return false;      // (torn off this visit, not yet saved)
  return true;
}
// the ring's box at a door — the same arithmetic as drawRingGate, so the vines sit on the band
function k2RingBox(cx, gy) {
  const R = RING_GATE[K2V.ring], im = MEDIA_IMG[K2V.ring];
  if (!R || !im || !im.naturalWidth) return null;
  const RH = RING_H, RW = RH * (im.naturalWidth / im.naturalHeight);
  return { x0: cx - RW * R.cx, y0: gy - RH * R.floor + 4, w: RW, h: RH };
}
// THE CUT: ragged cells over the vines (a nearest-seed map with a torn border), each its own
// small canvas, made once
function k2CutVines(im) {
  if (K2D.cut && K2D.cut.im === im) return K2D.cut;
  const N = K2V.grid, n = K2V.n;
  let h = 0x2f6b1d3a;
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822519) + 0x7f4a7c15 >>> 0) % 10000) / 10000;
  const seeds = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 0.44;
    seeds.push([0.5 + Math.cos(a) * r, 0.47 + Math.sin(a) * r * 1.02]);
  }
  // the vines' own coverage at the grid's size: a cell with nothing in it is no piece
  const sc = document.createElement('canvas'); sc.width = sc.height = N;
  const sx = sc.getContext('2d', { willReadFrequently: true }); sx.drawImage(im, 0, 0, N, N);
  const al = sx.getImageData(0, 0, N, N).data;
  const lab = new Int16Array(N * N).fill(-1);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (al[(y * N + x) * 4 + 3] < 20) continue;
    const u = x / N, v = y / N;
    // a torn border: the distance is roughened, so a cell's edge wanders like a rip
    const jit = 0.035 * Math.sin(u * 37.1 + v * 11.3) * Math.cos(v * 29.7 - u * 7.9);
    let best = 0, bd = 1e9;
    for (let i = 0; i < n; i++) { const dx = u - seeds[i][0], dy = v - seeds[i][1], d = dx * dx + dy * dy + jit * (i % 3 - 1); if (d < bd) { bd = d; best = i; } }
    lab[y * N + x] = best;
  }
  const W = im.naturalWidth, H = im.naturalHeight, pieces = [];
  for (let i = 0; i < n; i++) {
    let x0 = N, y0 = N, x1 = -1, y1 = -1, cnt = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (lab[y * N + x] === i) { cnt++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (cnt < 12) continue;
    x0 = Math.max(0, x0 - 1); y0 = Math.max(0, y0 - 1); x1 = Math.min(N - 1, x1 + 1); y1 = Math.min(N - 1, y1 + 1);
    const gw = x1 - x0 + 1, gh = y1 - y0 + 1;
    // the cell's mask at grid size, laid up soft over the picture
    const m = document.createElement('canvas'); m.width = gw; m.height = gh;
    const mx = m.getContext('2d'), md = mx.createImageData(gw, gh);
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) if (lab[(y + y0) * N + x + x0] === i) md.data[(y * gw + x) * 4 + 3] = 255;
    mx.putImageData(md, 0, 0);
    const pw = Math.ceil(gw / N * W), ph = Math.ceil(gh / N * H);
    const pc = document.createElement('canvas'); pc.width = pw; pc.height = ph;
    const px = pc.getContext('2d');
    px.drawImage(im, -x0 / N * W, -y0 / N * H, W, H);
    px.globalCompositeOperation = 'destination-in'; px.imageSmoothingEnabled = true;
    px.drawImage(m, 0, 0, pw, ph);
    pieces.push({ cv: pc, u: x0 / N, v: y0 / N, uw: gw / N, vh: gh / N });
  }
  K2D.cut = { im, pieces };
  return K2D.cut;
}
// THE ROAR TEARS THEM OFF (ringWakeStep, at the roar)
function k2VinesTear(def, fromX) {
  const im = MEDIA_IMG[K2V.key], cx = gateWorldX(def), gy = (G.roomDef.h - 2) * TILE;
  K2D.torn = G.roomId + ':' + ringWakeKey(def);
  if (typeof nfCoverMakeWay === 'function') nfCoverMakeWay(cx, 300, 1, true);
  if (!im || !im.naturalWidth) { K2D.pieces = []; K2D.room = G.roomId; return; }
  let floor = gy;
  if (typeof groundColumnAt === 'function') {
    let low = -Infinity;
    for (const ox of [-34, 0, 34]) { const col = groundColumnAt(cx + ox); if (col && col.length) low = Math.max(low, Math.min.apply(null, col)); }
    if (low > -Infinity) floor = low;
  }
  const box = k2RingBox(cx, floor); if (!box) { K2D.pieces = []; K2D.room = G.roomId; return; }
  const cut = k2CutVines(im), dir = Math.sign(cx - fromX) || 1;
  K2D.room = G.roomId; K2D.last = G.simClock || 0;
  K2D.pieces = cut.pieces.map(p => {
    const w = p.uw * box.w, h = p.vh * box.h;
    const x = box.x0 + (p.u + p.uw / 2) * box.w, y = box.y0 + (p.v + p.vh / 2) * box.h;
    // the roar reaches the near side first, and what hangs lowest lets go first
    const near = dir > 0 ? (p.u + p.uw / 2) : 1 - (p.u + p.uw / 2);
    const out = Math.sign(x - cx) || dir;
    return {
      p, x, y, w, h, rot: 0, t: -(0.06 + near * 0.32 + (1 - (p.v + p.vh)) * 0.12),
      vx: dir * k2Rnd(140, 330) + out * k2Rnd(20, 90), vy: k2Rnd(-280, -90),
      vr: (dir * 0.6 + out * 0.4) * k2Rnd(1.6, 4.2), tum: k2Rnd(0, 6.3), vt: k2Rnd(4, 9),
      down: 0, floor: (typeof nfCoverGround === 'function' ? null : floor),
    };
  });
  if (typeof nfCoverRustleSound === 'function') { nfCoverRustleSound(1); nfCoverRustleSound(0.8); }
}
function k2PiecesStep(dt) {
  const P = K2D.pieces; if (!P) return;
  let live = 0;
  for (const q of P) {
    q.t += dt;
    if (q.t < 0) { live++; continue; }
    if (q.down > 0) { q.down += dt; if (q.down < K2V.sink) live++; continue; }
    live++;
    // the first beat: it peels from its top, the hinge where the vine held the band
    if (q.t < 0.16) { q.rot += (Math.sign(q.vx) || 1) * dt * 2.4; continue; }
    q.vy += K2V.g * dt;
    if (q.vy > K2V.fall) q.vy += (K2V.fall - q.vy) * Math.min(1, 5 * dt);
    q.vx *= Math.max(0, 1 - 1.3 * dt);
    q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt; q.vr *= Math.max(0, 1 - 0.7 * dt); q.tum += q.vt * dt;
    const gy = typeof nfCoverGround === 'function' ? nfCoverGround(q.x) : q.floor;
    if (q.vy > 0 && q.y + Math.min(q.w, q.h) * 0.25 >= gy) { q.y = gy - Math.min(q.w, q.h) * 0.25; q.down = 0.001; }
  }
  if (!live) K2D.pieces = null;
}
// drawn by drawGateDoor right after the ring (world coordinates, the near plane)
function k2VinesDraw(def, cx, gy) {
  if (G.artProbe) return;
  if (typeof mediaFetch === 'function') mediaFetch(K2V.key);
  const now = G.simClock || 0, dt = Math.min(0.05, Math.max(0, now - (K2D.last || now))); K2D.last = now;
  // the pieces in flight, wherever they are (they leave the door's box)
  if (K2D.pieces && K2D.room === G.roomId) {
    k2PiecesStep(dt);
    if (K2D.pieces) for (const q of K2D.pieces) {
      const sink = q.down > 0 ? Math.min(1, q.down / K2V.sink) : 0;
      c.save();
      c.translate(q.x, q.y + sink * q.h * 0.25);
      if (q.t < 0) { c.drawImage(q.p.cv, -q.w / 2, -q.h / 2, q.w, q.h); c.restore(); continue; }
      if (q.t < 0.16) { c.translate(0, -q.h / 2); c.rotate(q.rot); c.translate(0, q.h / 2); }
      else c.rotate(q.rot);
      // a sheet of metal falling turns edge-on and back; landed, it lies and goes down into the grass
      const sy = q.down > 0 ? Math.max(0.02, 0.45 * (1 - sink)) : Math.max(0.18, Math.abs(Math.cos(q.tum)));
      c.scale(1, sy);
      c.drawImage(q.p.cv, -q.w / 2, -q.h / 2, q.w, q.h);
      c.restore();
    }
    return;
  }
  if (!k2VinesOn(def)) return;
  const im = MEDIA_IMG[K2V.key]; if (!im || !im.naturalWidth) return;
  const box = k2RingBox(cx, gy); if (!box) return;
  // grown over the ring: still, but for the meadow's air in the hanging strands — and a shiver
  // through all of it while he crosses the arena to it
  const w = G.ringWake && G.ringWake.def === def ? G.ringWake : null;
  const shiver = w ? Math.min(1, w.t / K2_WAKE.walk) : 0;
  const n = 12, iw = im.naturalWidth, ih = im.naturalHeight, bh = box.h / n, sh = ih / n;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;                                   // 0 at the crown, 1 at the foot
    const off = Math.sin(now * 0.9 + i * 0.35) * 1.6 * u + shiver * Math.sin(now * 31 + i * 0.6) * 3.5 * u;
    c.drawImage(im, 0, i * sh, iw, sh + 0.5, box.x0 + off, box.y0 + i * bh, box.w, bh + 0.8);
  }
}
