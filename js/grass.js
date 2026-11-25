// THE GRASS THAT MOVES WHEN SOMETHING WALKS THROUGH IT.
//
// Owner, 2026-11-25: "Try to improve the grass ... find free library for the grass instead of these
// green lines" — and: "do not make the game heavy. This is very important. I need the game to be
// playable everywhere. But if you can find grass that can move with the characters to show real
// life movements whenever I walk on it or an enemy walk on it, that would be amazing."
//
// The green lines were js/game.js paintFringe: two strokes and a dot per blade, five blades a tile.
// What grows there now is a painted grass card — "grass blades alpha card texture (side view)" by
// para, OpenGameArt, CC0 (assets/source/grass/, assets/CREDITS.md) — tinted into the meadow's own
// yellow-green and the Nest's violet by tools/grasstint.py.
//
// HOW IT MOVES, AND WHY IT COSTS NOTHING. A 3D grass library would be the heaviest thing in the game.
// This is one 512 x 128 picture, cut at draw time into narrow COLUMNS standing along every exposed
// edge of ground (the same edges, on the same drawn coastline, as the fringe it replaces). Each
// column is a spring: an angle and a speed. A body in the grass band — her, any walker, a boss —
// pushes the columns under and beside it AWAY from its middle and along the way it moves, and they
// spring back when it has passed; a breath of wind keeps the rest alive. A column is drawn with ONE
// drawImage under a skew transform rooted at its foot, so it bends from the ground like a blade,
// never slides. Only the columns on screen are stepped or drawn: a few hundred image draws, no
// allocation per frame, no shader, no library. The low tier draws wider columns (fewer draws).
//
// Drawn where the fringe was drawn (js/game.js drawFringe, over the cast), so the last pixels of a
// body's feet still pass behind the grass — the depth trick the fringe was built for.
const GRASS_ART = { grass: 'grassMeadow', frond: 'grassFrond' };
const GRASS_H0 = 24;                // the card's nominal drawn height, px (its source scale)
const GRASS_CROP = 0.8;             // the part of the card's height that is drawn (from its tips)
const GRASS_OVER = 1.8;             // each column is drawn this many columns wide, over its neighbour
const GRASS = { room: null, cols: [], key: null, collect: null, t: 0, last: 0, ready: false, wait: null };

function grassImg(key) {
  if (!key) return null;
  if (typeof mediaFetch === 'function') mediaFetch(key);
  const im = typeof MEDIA_IMG !== 'undefined' ? MEDIA_IMG[key] : null;
  return im && im.naturalWidth ? im : null;
}
function grassColW() { return (typeof QUAL !== 'undefined' && !QUAL.glow) ? 14 : 9; }

// One tile's worth of grass, asked by paintFringe. Returns false when the art is not here yet (the
// fringe then paints its old blades, and is rebuilt when the picture lands). With GRASS.collect set
// (the current room) the columns are recorded to be drawn live; without it (a neighbour drawn across
// a seam) they are painted standing still into the fringe canvas `x`.
function grassTile(x, X, Y, tx, ty, kind, groundY) {
  const key = GRASS_ART[kind]; const im = grassImg(key);
  if (!im) { if (GRASS.collect) GRASS.wait = key; return false; }
  const cw = grassColW(), n = Math.max(1, Math.round(TILE / cw)), w = TILE / n;
  for (let j = 0; j < n; j++) {
    const cx = X + j * w, mid = cx + w / 2;
    // ONE CONTINUOUS HEIGHT along the ground (owner, 2026-11-25: "It shouldn't look like squares
    // stuck together. It should be continuous without edges"): a slow swell only, so neighbouring
    // columns differ by a fraction of a pixel; the card's own ragged top is the variety
    const h = GRASS_H0 * (0.82 + 0.1 * Math.sin(mid * 0.0083 + ty * 0.7) + 0.06 * Math.sin(mid * 0.0031 + 2.1));
    // its foot follows the ground's own slope between its two edges, so neighbouring columns join
    // along the drawn coastline instead of standing as a staircase of flat-bottomed blocks
    const gA = groundY(cx), gB = groundY(cx + w);
    const col = { x: cx, y: gA + 7, s: (gB - gA) / w, w, h, a: 0, v: 0, e: 1, sq: 0 };
    if (GRASS.collect) GRASS.collect.push(col);
    else grassDrawCol(x, im, col, 0, null);
  }
  GRASS.key = key;
  return true;
}

// a column, bent by `a` (radians, + leans right), rooted at (col.x, col.y)
function grassDrawCol(c, im, col, a, M) {
  // (the card's lowest fifth is a solid mat of stems: it is left out, and the root sinks into the
  // ground instead, so what stands above the coastline is blades, not a carpet edge)
  const iw = im.naturalWidth, ih = im.naturalHeight * GRASS_CROP, k = im.naturalHeight / GRASS_H0;
  const sw = col.w * k;
  let sx = (col.x * k) % iw; if (sx < 0) sx += iw;
  // a bent blade is shorter than a standing one; one trodden on is pressed down; the last columns
  // of a run taper, so a verge ends in a few low blades and not in a cut
  const e = col.e == null ? 1 : col.e;
  const h = col.h * (1 - Math.min(0.25, a * a * 0.5)) * (1 - (col.sq || 0)) * (0.3 + 0.7 * e);
  const sk = -Math.tan(a);                                // x' = x + sk*y, y up is negative
  const sl = col.s || 0;                                  // x' = x + sk*y, y' = y + sl*x
  if (M) c.setTransform(M.a + M.c * sl, M.b + M.d * sl, M.a * sk + M.c, M.b * sk + M.d, M.a * col.x + M.c * col.y + M.e, M.b * col.x + M.d * col.y + M.f);
  else { c.save(); c.transform(1, sl, sk, 1, col.x, col.y); }
  // (the card is seamless: a column that runs off its right edge takes the rest from its left)
  // Each column is drawn OVER THE NEXT ONE by most of its width: standing, the overlap is the very
  // same pixels in the very same place and cannot be seen; bent, it fills what would have been a
  // crack between two columns leaning differently.
  const ov = e < 1 ? 1 : GRASS_OVER, dw = col.w * ov, sw2 = sw * ov;
  if (e < 1) c.globalAlpha = 0.45 + 0.55 * e;
  if (sx + sw2 <= iw) c.drawImage(im, sx, 0, sw2, ih, 0, -h, dw, h);
  else {
    const s1 = iw - sx, d1 = dw * s1 / sw2;
    c.drawImage(im, sx, 0, s1, ih, 0, -h, d1, h);
    c.drawImage(im, 0, 0, sw2 - s1, ih, d1, -h, dw - d1, h);
  }
  if (e < 1) c.globalAlpha = 1;
  if (!M) c.restore();
}

// paintFringe is about to be run for the current room: the columns it finds are this room's
function grassBegin() { GRASS.collect = []; GRASS.key = null; GRASS.wait = null; }
function grassEnd() {
  GRASS.cols = GRASS.collect || []; GRASS.collect = null;
  GRASS.cols.sort((p, q) => p.x - q.x);
  // where a run of grass ends (a ledge, a gap, a step), its last three columns taper. A column's
  // neighbour is the one in the next slot whose foot meets its own — not simply the next in x: where
  // a deck runs above the ground the two layers interleave, and each must find its own
  const cs = GRASS.cols, w0 = cs.length ? cs[0].w : 8, slot = new Map();
  for (const q of cs) { const k = Math.round(q.x / w0); if (!slot.has(k)) slot.set(k, []); slot.get(k).push(q); }
  const right = p => (slot.get(Math.round(p.x / w0) + 1) || []).find(q => Math.abs(q.y - (p.y + (p.s || 0) * p.w)) < 8) || null;
  const left = q => (slot.get(Math.round(q.x / w0) - 1) || []).find(p => Math.abs(q.y - (p.y + (p.s || 0) * p.w)) < 8) || null;
  for (const q of cs) {
    let l = 0, r = 0, a = q, b = q;
    while (l < 3 && (a = left(a))) l++;
    while (r < 3 && (b = right(b))) r++;
    q.e = Math.min(1, (Math.min(l, r) + 0.6) / 3.6);
  }
  GRASS.room = G.roomId; GRASS.ready = GRASS.cols.length > 0;
}

// the room was built while its grass was still on its way: rebuild once it lands
function grassWants() {
  if (!GRASS.wait || GRASS.room !== G.roomId || !grassImg(GRASS.wait)) return false;
  GRASS.wait = null; return true;
}

// what walks in the grass: her, every walker on the ground, the boss
function grassBodies(out) {
  out.length = 0;
  if (typeof player !== 'undefined' && player && !player.dead) out.push(player);
  for (const e of (G.enemies || [])) if (e && !e.dead && !e.calm && e.w && e.h) out.push(e);
  if (G.boss && !G.boss.dead && G.boss.w) out.push(G.boss);
  return out;
}
const GRASS_BODIES = [];

function drawGrass(c) {
  if (G.fringeProbe || !GRASS.ready || GRASS.room !== G.roomId) return;
  const im = grassImg(GRASS.key); if (!im) return;
  const now = performance.now() / 1000;
  const dt = Math.min(0.05, Math.max(0, now - (GRASS.last || now))); GRASS.last = now;
  GRASS.t += dt;
  // the columns on screen only
  const z = (typeof cam !== 'undefined' && cam.zoom) || 1, ox = 480 * (1 - 1 / z);
  const x0 = camSX() + ox - 40, x1 = camSX() + 960 - ox + 40;
  const cols = GRASS.cols;
  let lo = 0, hi = cols.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (cols[m].x < x0) lo = m + 1; else hi = m; }
  const bodies = grassBodies(GRASS_BODIES);
  const M = c.getTransform();
  const t = GRASS.t;
  for (let i = lo; i < cols.length; i++) {
    const col = cols[i]; if (col.x > x1) break;
    const mid = col.x + col.w / 2;
    // a breath of wind: two slow waves along the ground, never in step
    let tgt = Math.sin(t * 1.3 + mid * 0.021) * 0.07 + Math.sin(t * 0.55 + mid * 0.006) * 0.05, sq = 0;
    for (const b of bodies) {
      const feet = b.y + b.h;
      if (feet < col.y - col.h - 8 || feet > col.y + 14) continue;        // not in this grass's band
      const bc = b.x + b.w / 2, reach = b.w / 2 + 18, d = (mid - bc) / reach;
      if (d <= -1 || d >= 1) continue;
      // pushed apart from its middle — a smooth wave through zero, so there is no crack where the two
      // sides part — dragged along the way it moves, and pressed down where the weight is
      const win = 0.5 + 0.5 * Math.cos(Math.PI * d);
      tgt += Math.sin(Math.PI * d) * 0.85 + Math.max(-0.5, Math.min(0.5, (b.vx || 0) / 700)) * win;
      sq = Math.max(sq, 0.38 * win * win);
    }
    tgt = Math.max(-1.15, Math.min(1.15, tgt));
    // a stiff, damped spring: bends in a tenth of a second, settles in about one
    col.v += ((tgt - col.a) * 70 - col.v * 9) * dt;
    col.a += col.v * dt;
    col.sq += (sq - col.sq) * Math.min(1, dt * 14);
    grassDrawCol(c, im, col, col.a, M);
  }
  c.setTransform(M);
}
