// AUTHORED HIT SHAPES (handoff Part 2 D2).
//
// Player.hitbox() is a square, and the claw arc she draws is not: it sweeps a
// crescent whose far corners are empty air. A crawler clipping the square's
// far corner was hit by claws the picture never put there — and an argument
// about "I hit it but it did not count" had nothing to point at. Each swing
// now has an authored convex polygon, laid INSIDE its box (so no move reaches
// one pixel further than it did), tested against hurt boxes with a separating-
// axis check. The box stays as the cheap first test and as the reach every
// older harness measures.
//
// Shapes are written in the box's own unit space, as if facing right: u runs
// from her body edge (0) to the reach (1), v across the cut (0..1). A down
// swing maps u downward from her feet. The Forge's SHAPES toggle (js/editor.js,
// or F3) draws all of it in play: attack shape, hurt boxes, her body.
const HIT_SHAPES = {
  // the jab and the second beat: full height at her paw, the far corners
  // rounded off where the arc's tips curl back
  slash:    [[0, 0.06], [0.5, 0], [0.8, 0.06], [1, 0.3], [1, 0.7], [0.8, 0.94], [0.5, 1], [0, 0.94]],
  // the finisher: the wider sweep, rounded less
  finisher: [[0, 0.02], [0.55, 0], [0.86, 0.08], [1, 0.3], [1, 0.7], [0.86, 0.92], [0.55, 1], [0, 0.98]],
  // the plunge: wide at her feet, narrowing to the point she drives down
  down:     [[0, 0], [1, 0], [0.96, 0.5], [0.76, 1], [0.24, 1], [0.04, 0.5]],
  // THE SEALS' CUTS (C1, CREST_ATTACK in js/game.js names which beat uses which).
  // the cutter's reach: the long edge narrows to its point
  reach:    [[0, 0.04], [0.5, 0], [0.84, 0.1], [1, 0.34], [1, 0.66], [0.84, 0.9], [0.5, 1], [0, 0.96]],
  // the plate's slam: a heavy flat face, barely rounded — the width is the point
  slam:     [[0, 0], [0.62, 0], [0.94, 0.08], [1, 0.26], [1, 0.74], [0.94, 0.92], [0.62, 1], [0, 1]],
  // the plate's diagonal pogo: the box sits on the 45-degree line, so its
  // shape is the one that reads the same turned either way — an octagon
  diag:     [[0.15, 0], [0.85, 0], [1, 0.15], [1, 0.85], [0.85, 1], [0.15, 1], [0, 0.85], [0, 0.15]],
};
function swingShapeId(s) {
  if (s.ay > 0 && !s.ax) return 'down';
  if (s.ay > 0.5) return 'diag';             // the plate's diagonal pogo (C1)
  const id = s.combo === 2 ? 'finisher' : 'slash';
  const blk = typeof swingCrest === 'function' ? swingCrest(s) : null;
  return (blk && blk.shape && blk.shape[id]) || id;
}
// the authored shape, in world space, for the swing `s` and its box `b`
function swingShape(s, b) {
  const pts = HIT_SHAPES[swingShapeId(s)], out = [];
  const down = s.ay > 0 && !s.ax, up = s.ay < 0 && !s.ax;
  for (const [u, v] of pts) {
    if (down) out.push([b.x + v * b.w, b.y + u * b.h]);
    else if (up) out.push([b.x + v * b.w, b.y + b.h - u * b.h]);
    else if (s.ax < 0) out.push([b.x + b.w - u * b.w, b.y + v * b.h]);
    else out.push([b.x + u * b.w, b.y + v * b.h]);
  }
  return out;
}
// convex polygon vs axis-aligned box, by separating axes: the box's two and
// each polygon edge's normal. Touching counts as a hit, as aabb() does.
function polyBoxHit(poly, b) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of poly) { if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0]; if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
  if (maxX < b.x || minX > b.x + b.w || maxY < b.y || minY > b.y + b.h) return false;
  const corners = [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], c = poly[(i + 1) % poly.length];
    const nx = c[1] - a[1], ny = a[0] - c[0];
    let pMin = Infinity, pMax = -Infinity, bMin = Infinity, bMax = -Infinity;
    for (const p of poly) { const d = p[0] * nx + p[1] * ny; if (d < pMin) pMin = d; if (d > pMax) pMax = d; }
    for (const p of corners) { const d = p[0] * nx + p[1] * ny; if (d < bMin) bMin = d; if (d > bMax) bMax = d; }
    if (pMax < bMin || bMax < pMin) return false;
  }
  return true;
}
// Does her current swing touch `box`? The square first (cheap, and the reach
// every older measurement uses), then the authored shape inside it.
function swingTouches(p, box, hb) {
  if (!p.swing) return false;
  const b = hb || p.hitbox();
  return aabb(b, box) && polyBoxHit(swingShape(p.swing, b), box);
}

// THE OVERLAY (Forge: SHAPES, or F3). Drawn in world space after she is.
function drawHitShapes(c) {
  if (!G.showShapes || !player) return;
  c.save();
  c.lineWidth = 1.5;
  const box = (b, col) => { c.strokeStyle = col; c.strokeRect(b.x, b.y, b.w, b.h); };
  box(player, '#5fd3ff');                                   // her body
  const list = G.boss ? G.enemies.concat([G.boss]) : G.enemies;
  for (const e of list) if (e && !e.dead) box(hurtBoxOf(e), '#7dff8a');   // what can be hit
  const s = player.swing;
  if (s && s.t > 0) {
    const hb = player.hitbox();
    c.setLineDash([4, 3]); box(hb, 'rgba(255,170,90,0.6)'); c.setLineDash([]);   // the old square, for comparison
    const poly = swingShape(s, hb);
    c.beginPath(); poly.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath();
    c.fillStyle = 'rgba(255,120,60,0.3)'; c.fill();
    c.strokeStyle = '#ff7a3c'; c.stroke();
  }
  c.restore();
}
