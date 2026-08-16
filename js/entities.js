// CLAWBYTE — player, enemies, bosses, projectiles, pickups
const DIFFS = [
  { cores: 7, edmg: 1, ehp: 0.75, pdmg: 1.25, espd: 1, lives: 0 },
  { cores: 5, edmg: 1, ehp: 1, pdmg: 1, espd: 1, lives: 0 },
  { cores: 5, edmg: 2, ehp: 1.15, pdmg: 1, espd: 1.2, lives: 9 },
];
function DF() { return DIFFS[G.save.diff]; }
// The real input readers, aliased once. Player.update SHADOWS `inD`/`inP` with
// dead stubs while she is stunned (one line instead of a check at every input
// site), and a `const` cannot initialise from the name it is shadowing — so the
// originals are captured here, at load, from the hoisted declarations.
const IN_D = inD, IN_P = inP;
function hasCrest(id) { return G.save.equip.indexOf(id) >= 0; }
function hasMod(id) { return !!G.save.abil[id]; }
function hasSkill(id) { return G.save.skills && G.save.skills.indexOf(id) >= 0; }
// evolution: power milestones make the character visibly bigger and better-geared
function evoPts() {
  const s = G.save; if (!s) return 0;
  const bosses = ['Glitch', 'Brood', 'Atlas', 'Zero', 'Prism', 'Mother'].filter(b => s.flags && s.flags['boss' + b]).length;
  return Object.keys(s.abil || {}).length * 2 + (s.skills || []).length * 2 + bosses * 3 + (s.relics || []).length;
}
function evoTier() { const p = evoPts(); return p >= 26 ? 3 : p >= 14 ? 2 : p >= 5 ? 1 : 0; }
function relicHas(id) { return G.save.relics && G.save.relics.indexOf(id) >= 0; }

// ---- tile queries against the live room ----
function tileAt(tx, ty) {
  const g = G.grid;
  if (ty < 0 || ty >= g.length || tx < 0 || tx >= g[0].length) return '.';
  if (G.roomId === 'D3' && !G.save.flags.bossZero && ty >= 15 && tx >= 15 && tx <= 17) return '#';
  // X1: a hardlight bridge seals the floor entrance for the length of the
  // Prowler fight — but ONLY once she is inside and standing clear of it.
  // Until then the way in stays open. It holds through the death collapse,
  // then shatters open again.
  if (G.roomId === 'X1' && G.x1Bridge && G.boss && (!G.boss.dead || (G.boss.deathAnimT || 0) > 0)
      && ty >= 15 && tx >= 6 && tx <= 8) return '#';
  const c = g[ty][tx];
  if ((c === 'B' || c === 'v') && G.save.broken[G.roomId + ':' + tx + ',' + ty]) return '.';
  return c;
}
function solidAt(tx, ty) { const c = tileAt(tx, ty); return c === '#' || c === 'B'; }
// FRACTURE worlds: a deterministic scatter of ordinary wall is secretly loose.
// Same tiles every visit, and only ever wall that already has open air behind
// it, so it can never seal a route or open one that leads nowhere.
function brLoose(tx, ty) {
  if (typeof brHas !== 'function' || !brHas('fracture')) return false;
  if (tileAt(tx, ty) !== '#') return false;
  const h = ((tx * 73856093) ^ (ty * 19349663) ^ (universe().seed | 0)) >>> 0;
  if ((h % 1000) / 1000 > 0.06) return false;
  const open = (x, y) => { const c2 = tileAt(x, y); return c2 !== '#' && c2 !== 'B'; };
  return open(tx, ty - 1) || open(tx, ty + 1) || open(tx - 1, ty) || open(tx + 1, ty);
}
// ---- sprite-sheet helpers (real hand-animated art; see assets/CREDITS.md) ----
function sheetReady(key) { return typeof MEDIA_IMG !== 'undefined' && !!MEDIA_IMG[key]; }
// draw one frame of a uniform sheet, standing on the local origin (feet at 0,0)
function drawSheet(c, key, n, cw, ch, frame, scale, yOff) {
  const img = MEDIA_IMG[key]; if (!img) return false;
  const f = clamp(frame | 0, 0, n - 1);
  const dw = cw * scale, dh = ch * scale;
  c.imageSmoothingEnabled = false;
  c.drawImage(img, f * cw, 0, cw, ch, -dw / 2, -dh + (yOff || 0), dw, dh);
  c.imageSmoothingEnabled = true;
  return true;
}
// soft contact shadow — the cheapest, strongest "grounded / lit scene" cue
function contactShadow(c, cx, feetY, w, alpha) {
  c.save();
  const g = c.createRadialGradient(cx, feetY, 1, cx, feetY, w);
  g.addColorStop(0, 'rgba(0,0,0,' + (alpha || 0.4) + ')');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.beginPath(); c.ellipse(cx, feetY, w, w * 0.32, 0, 0, 7); c.fill();
  c.restore();
}
function moveEnt(e, dt) {
  const col = { l: 0, r: 0, u: 0, d: 0 };
  e.x += e.vx * dt;
  const t0 = Math.floor(e.y / TILE), t1 = Math.floor((e.y + e.h - 1) / TILE);
  if (e.vx > 0) {
    const tx = Math.floor((e.x + e.w) / TILE);
    for (let ty = t0; ty <= t1; ty++) if (solidAt(tx, ty)) { e.x = tx * TILE - e.w - 0.01; e.vx = 0; col.r = 1; break; }
  } else if (e.vx < 0) {
    const tx = Math.floor(e.x / TILE);
    for (let ty = t0; ty <= t1; ty++) if (solidAt(tx, ty)) { e.x = (tx + 1) * TILE + 0.01; e.vx = 0; col.l = 1; break; }
  }
  const prevB = e.y + e.h;
  e.y += e.vy * dt;
  const x0 = Math.floor(e.x / TILE), x1 = Math.floor((e.x + e.w - 1) / TILE);
  if (e.vy >= 0) {
    const ty = Math.floor((e.y + e.h) / TILE);
    for (let tx = x0; tx <= x1; tx++) {
      const c = tileAt(tx, ty);
      if (c === '#' || c === 'B' || (c === '=' && prevB <= ty * TILE + 1)) { e.y = ty * TILE - e.h - 0.01; e.vy = 0; col.d = 1; break; }
    }
  } else {
    const ty = Math.floor(e.y / TILE);
    let bonk = false;
    for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, ty)) { bonk = true; break; }
    // CORNER CORRECTION (opt-in via e.ccorr — the player only). Clipping a
    // ceiling corner by a few pixels on the way up is an aiming error smaller
    // than a paw; the canon answer (Celeste nudges up to 4px, we allow 8) is
    // to slide the body sideways around the corner and keep the jump's speed
    // instead of bonking. Only a small shift qualifies, and only into space
    // that is actually clear for the whole body — otherwise it is a real
    // ceiling and stops her like one.
    if (bonk && e.ccorr) {
      const clearAt = (nx) => {
        const a0 = Math.floor(nx / TILE), a1 = Math.floor((nx + e.w - 1) / TILE);
        for (let tx = a0; tx <= a1; tx++) if (solidAt(tx, ty)) return false;
        const b0 = Math.floor(e.y / TILE), b1 = Math.floor((e.y + e.h - 1) / TILE);
        for (let ty2 = b0; ty2 <= b1; ty2++) if (solidAt(a0, ty2) || solidAt(a1, ty2)) return false;
        return true;
      };
      const dxR = (Math.floor(e.x / TILE) + 1) * TILE + 0.01 - e.x;          // clear the left corner
      const dxL = e.x + e.w - Math.floor((e.x + e.w - 1) / TILE) * TILE + 0.01; // clear the right corner
      if (dxR > 0 && dxR <= 8 && clearAt(e.x + dxR)) { e.x += dxR; bonk = false; }
      else if (dxL > 0 && dxL <= 8 && clearAt(e.x - dxL)) { e.x -= dxL; bonk = false; }
    }
    if (bonk) { e.y = (ty + 1) * TILE + 0.01; e.vy = 0; col.u = 1; }
  }
  return col;
}
// WHAT STOPS A SHOT — which is not the same question as what stops a BODY.
//
// '=' is a one-way platform: a body jumps up through it and lands on top. The
// projectile test reused solidAt, which is correctly honest about '=' being
// passable, so every shot fired from under a gantry went straight up through
// the floor and hit whoever was standing on it. Standing on a platform reads
// as cover and therefore has to BE cover — in both directions, and for her own
// shuriken too, which is what makes it a position worth taking rather than a
// place the rules happen to favour her.
function blocksShot(tx, ty) {
  const c = tileAt(tx, ty);
  return c === '#' || c === 'B' || c === '=';
}
// SWEPT, NOT SAMPLED. A shot travels further than a tile in one step whenever
// the machine is slow or the shot is fast, and a point test taken only at the
// end of the step walks it clean through a one-tile floor without ever having
// been inside it. Returns the last free point before the block, or null.
function shotSweep(x0, y0, x1, y1) {
  // a shot that STARTS inside terrain (a turret muzzle buried in its own
  // mounting) is given the step to get out rather than killed on spawn
  if (blocksShot(Math.floor(x0 / TILE), Math.floor(y0 / TILE))) return null;
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 8));
  let px = x0, py = y0;
  for (let i = 1; i <= steps; i++) {
    const x = x0 + dx * (i / steps), y = y0 + dy * (i / steps);
    if (blocksShot(Math.floor(x / TILE), Math.floor(y / TILE))) return { x: px, y: py };
    px = x; py = y;
  }
  return null;
}
function onSpike(e) {
  const x0 = Math.floor((e.x + 5) / TILE), x1 = Math.floor((e.x + e.w - 5) / TILE);
  const y0 = Math.floor((e.y + 6) / TILE), y1 = Math.floor((e.y + e.h - 2) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { const c2 = tileAt(tx, ty); if (c2 === '^' || c2 === 'v') return true; }
  return false;
}
function groundAhead(e, dir) {
  const tx = Math.floor((dir > 0 ? e.x + e.w + 3 : e.x - 3) / TILE);
  const ty = Math.floor((e.y + e.h + 4) / TILE);
  const c = tileAt(tx, ty);
  return c === '#' || c === 'B' || c === '=';
}
function touchingWall(e, dir) {
  const tx = Math.floor((dir > 0 ? e.x + e.w + 2 : e.x - 2) / TILE);
  const t0 = Math.floor((e.y + 4) / TILE), t1 = Math.floor((e.y + e.h - 4) / TILE);
  for (let ty = t0; ty <= t1; ty++) if (solidAt(tx, ty)) return true;
  return false;
}

const FLIP_DUR = 0.62;   // the double-jump pirouette, start to finish

// ===========================================================================
// THE SLASH, DEFINED ONCE.
//
// The paw's pose and the claw effect used to be authored separately — two
// hand-tuned sets of angles that had no reason to agree, and did not. The
// effect swept one way while the limb throwing it swung another, which is the
// exact thing that reads as "the hand is not moving with the slash".
//
// Both now come from this table. Each beat of the string is one DIAGONAL rake:
// a cat pulls its claws down and back toward itself, it does not swipe flat and
// away. And each beat is thrown by a different paw — right, then left, then
// both crossing — so a three-hit string is three different motions instead of
// one arm doing everything.
//
//   hand : F front paw, B rear paw, X both (the finisher crosses them)
//   a0→a1: where the paw starts and finishes, in radians around the shoulder,
//          relative to the aim. Positive is DOWNWARD on this canvas, so every
//          arc here ends lower than it starts.
//   r0→r1: reach at the start and at full extension
// ===========================================================================
// THE SWIRL — the twin-blade supercharge. Numbers in seconds, because the loop
// is a fixed-step float accumulator and frame integers would be fabricated
// precision (see the combat skill, §0.1).
//
//   startup   ~0     she is already committed when the charge releases
//   active    0.64   FOUR passes, one every 0.16
//   recovery  0.30   she lands out of the turn; this is the cost
//
// Her own recovery is the risk she is buying the ring with. 300 ms is longer
// than any of her combo beats (0.23–0.33) and is meant to be felt: the swirl is
// a decision, not a better button.
const SWIRL_T = 0.64, SWIRL_STEP = 0.16, SWIRL_R = 62, SWIRL_TWIN = 6;
const SLASH = [
  { hand: 'F', a0: -0.95, a1: 0.42, r0: 11.5, r1: 21 },   // beat 1 — right paw, steep down-rake
  { hand: 'B', a0: -0.45, a1: 0.92, r0: 11, r1: 20 },     // beat 2 — left paw, shallower, crosses under
  { hand: 'X', a0: -1.05, a1: 0.55, r0: 12, r1: 23 },     // beat 3 — both, closing in an X
];
// the rear paw's half of the finisher travels the other way, so the two arcs
// cross rather than chasing each other
const SLASH_X_B = { a0: 0.75, a1: -0.8, r0: 12, r1: 21 };
// Both forelegs are built the same way; the far one is simply darker, so the
// two read as near and far rather than as one arm that changed sides.
// ===========================================================================
// ONE LIMB. NO BEADS. THIS IS A RULE, NOT A PREFERENCE.
//
// The owner has ruled out the jointed arm repeatedly, and it kept coming back
// because of what is written just below this line in the previous version of
// this comment: an argument that a machine's arm SHOULD show its segments, and
// that a smooth taper reads as flesh. That argument is mine, it is about my
// taste, and it was never what was asked for. Worse, the last round of this
// only SOFTENED it — three beads became two, the shoulder puck was flattened,
// and the note congratulated itself for it. A rule half-applied is a rule
// ignored with extra steps.
//
// So: her arm is ONE piece. A single continuous tapered casing from shoulder
// to wrist, thick where it leaves the shoulder and narrow at the paw, bending
// through the elbow as a CURVE rather than a hinge. No pucks. No rings. No gap
// at the bend. Nothing on the limb that reads as a bead on a string.
//
// It still bends — the IK solve is unchanged, and the elbow is still where the
// elbow was — but the bend is in the silhouette, the way it is in the opening
// film, instead of being announced by hardware bolted to the outside.
//
// tests/hero.cjs enforces this: it spies on the draw and fails if a joint is
// ever stamped onto her arm. That is the only version of this rule that has
// ever survived a week.
function armBone(c, x0, y0, x1, y1, w, trim, dark, mid, lit) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  const ax = x0 + ux * trim, ay = y0 + uy * trim;
  const bx = x1 - ux * trim, by = y1 - uy * trim;
  c.lineCap = 'round';
  c.strokeStyle = dark; c.lineWidth = w + 1.8;
  c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
  c.strokeStyle = mid; c.lineWidth = w;
  c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
  if (lit) {                                     // top-lit edge along the casing
    c.strokeStyle = lit; c.lineWidth = Math.max(0.9, w * 0.3);
    c.beginPath();
    c.moveTo(ax - uy * w * 0.24, ay + ux * w * 0.24 - 0.6);
    c.lineTo(bx - uy * w * 0.24, by + ux * w * 0.24 - 0.6);
    c.stroke();
  }
}
// KEPT, AND DELIBERATELY UNCALLED. This stamped the pucks onto her arm and is
// the exact thing the rule forbids. It stays as a named function so
// tests/hero.cjs can spy on it and fail the build the moment anything calls it
// again — a rule with a tripwire under it, rather than a rule in a comment.
function armJoint(c, x, y, r, dark, mid, glow) {
  if (typeof G !== 'undefined' && G) G._armJointCalls = (G._armJointCalls || 0) + 1;
  c.fillStyle = dark;
  c.beginPath(); c.arc(x, y, r + 0.9, 0, 7); c.fill();
  c.fillStyle = mid;
  c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  if (glow) { c.fillStyle = glow; c.beginPath(); c.arc(x, y, r * 0.42, 0, 7); c.fill(); }
}
// The limb, as one shape. Sampled along shoulder -> elbow -> wrist as a single
// quadratic through the elbow, with the half-width tapering along it, so the
// outline is continuous and the bend is a curve rather than a corner.
const ARM_SEG = 14;
function armBones(c, shX, shY, ex, ey, hx, hy, far, glow) {
  c.lineJoin = 'round';
  const dark = far ? 'rgba(32,41,54,0.92)' : 'rgba(38,48,62,0.92)';
  const mid = far ? '#6d7a8c' : '#8593a6';
  const lit = far ? 'rgba(190,205,224,0.34)' : 'rgba(226,236,250,0.52)';
  const w0 = (far ? 3.4 : 3.8) * 1.16;          // shoulder half-width
  const w1 = (far ? 3.4 : 3.8) * 0.62;          // wrist half-width
  // the elbow is the control point of ONE curve, not a hinge between two bones
  const px = [], py = [], pw = [];
  for (let i = 0; i <= ARM_SEG; i++) {
    const t = i / ARM_SEG, u = 1 - t;
    px.push(u * u * shX + 2 * u * t * ex + t * t * hx);
    py.push(u * u * shY + 2 * u * t * ey + t * t * hy);
    // taper, with a little swell through the forearm so it is a limb and not
    // a cone — a straight linear taper is the other way to look wrong
    pw.push((w0 + (w1 - w0) * t) * (1 + 0.10 * Math.sin(t * Math.PI)) * 0.5);
  }
  const side = (sign) => {
    for (let i = 0; i <= ARM_SEG; i++) {
      const j = sign > 0 ? i : ARM_SEG - i;
      const a2 = px[Math.min(ARM_SEG, j + 1)] - px[Math.max(0, j - 1)];
      const b2 = py[Math.min(ARM_SEG, j + 1)] - py[Math.max(0, j - 1)];
      const d = Math.hypot(a2, b2) || 1;
      const nx = -b2 / d * pw[j] * sign, ny = a2 / d * pw[j] * sign;
      const X = px[j] + nx, Y = py[j] + ny;
      if (i === 0 && sign > 0) c.moveTo(X, Y); else c.lineTo(X, Y);
    }
  };
  // contour, then the casing, as ONE closed outline
  c.beginPath(); side(1); side(-1); c.closePath();
  c.fillStyle = dark; c.fill();
  c.save(); c.clip();
  c.fillStyle = mid;
  c.beginPath(); side(1); side(-1); c.closePath(); c.fill();
  // one continuous top-lit edge running the whole length — the read that
  // replaces the hinge: light says where the limb turns
  c.strokeStyle = lit; c.lineWidth = Math.max(0.9, w0 * 0.34);
  c.beginPath();
  for (let i = 0; i <= ARM_SEG; i++) {
    const a2 = px[Math.min(ARM_SEG, i + 1)] - px[Math.max(0, i - 1)];
    const b2 = py[Math.min(ARM_SEG, i + 1)] - py[Math.max(0, i - 1)];
    const d = Math.hypot(a2, b2) || 1;
    const X = px[i] - b2 / d * pw[i] * 0.5, Y = py[i] + a2 / d * pw[i] * 0.5 - 0.5;
    if (i === 0) c.moveTo(X, Y); else c.lineTo(X, Y);
  }
  c.stroke();
  c.restore();
  // the one light she keeps: a soft glow INSIDE the casing at the elbow, with
  // no ring and no edge — the machine showing through the shell rather than a
  // bolt sitting on it
  if (glow) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5;
    const gg = c.createRadialGradient(ex, ey, 0, ex, ey, w0 * 1.5);
    gg.addColorStop(0, glow); gg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gg; c.beginPath(); c.arc(ex, ey, w0 * 1.5, 0, 7); c.fill();
    c.restore();
  }
}
function armPaw(c, hx, hy, wr, spread, far) {
  c.save(); c.translate(hx, hy); c.rotate(wr);
  const k2 = far ? 0.9 : 1;
  c.fillStyle = far ? 'rgba(32,41,54,0.9)' : 'rgba(38,48,62,0.9)';   // contour
  c.beginPath(); c.ellipse(0.3, 0, 4.1 * k2, 3.5 * k2, 0, 0, 7); c.fill();
  for (let k = -1; k <= 1; k++) {
    c.beginPath(); c.arc(2.5 * k2, k * 1.65 * spread, 1.9 * k2, 0, 7); c.fill();
  }
  c.fillStyle = far ? '#9fadc0' : '#dbe3ef';
  c.beginPath(); c.ellipse(0.3, 0, 3.2 * k2, 2.6 * k2, 0, 0, 7); c.fill();   // pad
  c.fillStyle = far ? '#b6c3d4' : '#f2f6fd';
  for (let k = -1; k <= 1; k++) {                                            // three toes
    c.beginPath(); c.arc(2.5 * k2, k * 1.65 * spread, 1.1 * k2, 0, 7); c.fill();
  }
  c.restore();
}
// Where the throwing paw is RIGHT NOW. One function, so nothing downstream can
// disagree with it: the limb is drawn here and the effect is rotated by it.
function slashPose(sv, face, back) {
  const S = back ? Object.assign({}, SLASH[2], SLASH_X_B) : SLASH[sv.combo] || SLASH[0];
  const raw = clamp(1 - sv.t / sv.t0, 0, 1);
  // ANTICIPATION: the paw pulls back past the start of the arc for the first
  // beat, then whips through it
  const pr = raw < 0.18 ? -(raw / 0.18) * 0.3 : (raw - 0.18) / 0.82;
  const prc = Math.max(0, pr);
  const aim = sv.ang * (face < 0 ? -1 : 1);          // local space; already flipped
  const span = S.a1 - S.a0;
  return {
    hand: S.hand,
    dir: span >= 0 ? 1 : -1,                          // which way this arc sweeps
    ang: aim + S.a0 + span * pr,
    reach: (pr < 0 ? S.r0 - 1 : S.r0) + (S.r1 - S.r0) * Math.sin(prc * Math.PI),
    p: raw,
  };
}

// ===========================================================================
// THE JOINT LAYER — why her limbs used to snap.
//
// Every pose in this rig was evaluated fresh each frame and drawn exactly
// where the formula said. That is fine while one formula is running, but the
// moment the state changed — run to swing, swing to idle, ground to air, hurt
// to anything — the arm was simply somewhere else on the next frame. No amount
// of polish inside a single pose fixes that; the eye reads the seam between
// poses, not the poses.
//
// So the joints now have MEMORY. Each one carries a value and a velocity and
// is driven toward its target by a critically-damped spring: it arrives
// instead of appearing, carries a little of its old motion into the new pose,
// and settles. That single change smooths every transition in the game at
// once, in every direction she can face and every motion she can be in,
// including ones nobody thought to hand-tune.
// ===========================================================================
const RIG_MAXDT = 1 / 30;      // a dropped frame must never fling a limb
function rigStep(s, key, target, stiff, dt) {
  const p = '_' + key, v = '_' + key + 'v';
  if (s[p] === undefined) { s[p] = target; s[v] = 0; return target; }
  // Sub-step, and take the step size FROM the stiffness. A fixed sub-step is
  // the classic way to blow one of these up: a stiff spring integrated at a
  // step near its own period does not settle, it diverges — and a limb that
  // diverges leaves the screen. The step is bounded by the damping term, so
  // the stiffest joint here stays as stable as the loosest.
  const damp = 2 * Math.sqrt(stiff);
  const hMax = Math.min(RIG_MAXDT, 1.4 / damp);
  let left = Math.min(dt, 0.1);
  while (left > 1e-6) {
    const h = Math.min(left, hMax);
    s[v] += (stiff * (target - s[p]) - damp * s[v]) * h;
    s[p] += s[v] * h;
    left -= h;
  }
  return s[p];
}
// the same spring, but on a circle: always take the short way round, so an
// angle crossing ±π drags through the near side instead of unwinding
function rigAng(s, key, target, stiff, dt) {
  const p = '_' + key;
  if (s[p] !== undefined) {
    let d = target - s[p];
    while (d > Math.PI) { s[p] += Math.PI * 2; d -= Math.PI * 2; }
    while (d < -Math.PI) { s[p] -= Math.PI * 2; d += Math.PI * 2; }
  }
  return rigStep(s, key, target, stiff, dt);
}
// Two-bone IK. The elbow used to be pinned at a fixed angular offset from the
// shoulder→hand line, so it bent by the same amount whether the arm was tucked
// or fully extended — the giveaway that nothing underneath was jointed. Now the
// upper arm and forearm have LENGTHS, and the elbow lands wherever those two
// lengths can actually meet the hand.
function rigIK(sx, sy, hx, hy, l1, l2, bend) {
  const dx = hx - sx, dy = hy - sy;
  const d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.01, (l1 + l2) * 0.998);
  const base = Math.atan2(dy, dx);
  const cosA = clamp((d * d + l1 * l1 - l2 * l2) / (2 * d * l1), -1, 1);
  const a = base + Math.acos(cosA) * bend;
  return { x: sx + Math.cos(a) * l1, y: sy + Math.sin(a) * l1, base };
}

// ---- HER AUTHORED BODY -----------------------------------------------------
// assets/characters/hero/states.png: one keyed, foot-aligned cell per state,
// assembled by tools/herostates.cjs. Indexed BY NAME, never by number — the
// tool's STATES array is the wire format, and naming keeps appending to it safe.
//
// This is the arrangement NOSTOS's hero has always used (drawHeroSprite first,
// the procedural rig as the fallback), pointed at her for the first time. Her
// procedural body is not deleted: it draws until the sheet loads, and it draws
// forever if the sheet is missing.
// Horizontal registration nudges, as a fraction of the drawn plate width.
// Measured from the sheet (tools note in drawRoboPlate): walk_a's head center
// sits at cell x 102.7, walk_b's at 88.1 — aligning them to their midpoint
// means walk_a shifts left and walk_b right by 7.3/160 of the cell each.
// ...and the same correction for the §1e run pair, derived from the re-fired
// cells' HERO_EYE measurements: run_a's eye midpoint sits at 0.455 of the
// cell, run_b's at 0.382 — 11.7px of head drift at cell scale, the exact
// strobing the owner reported on the walk. Aligned to their common midpoint.
const HERO_REG = { walk_a: -0.046, walk_b: 0.046, run_a: -0.0365, run_b: 0.0365 };
const HERO_CELL = {
  idle: 0, walk_a: 1, walk_b: 2, run_a: 3, run_b: 4, rise: 5, apex: 6,
  fall: 7, land: 8, dash: 9, skid: 10, wall_cling: 11, djump_jet: 12,
  claw_1: 13, claw_2: 14, finisher: 15, charge: 16, burst: 17, hurt: 18,
  heal: 19, song: 20, slump: 21,
};
const HERO_CELLS = 22;
// The plate is drawn from the FOOT, like everything else in this file: y=0 is
// the floor and up is negative. HERO_DH is the whole cell's height in world
// units — bigger than she is, because the cell has headroom over her ears — and
// HERO_FLOOR is the 4px margin herostates.cjs leaves under the grounded poses,
// scaled into those units so her soles land on y=0 and not just near it.
// HERO_FLOOR sinks the plate to the SOIL LINE: the cells carry a baked
// contact shadow and a few px of margin under the feet, and anchoring the
// cell bottom to the floor stood her on top of the grass fringe — reported
// as "running on top of grass instead of the ground". Sunk, her feet meet
// the dirt and the front grass blades brush her ankles, which is what
// standing IN a meadow looks like.
const HERO_DH = 60, HERO_FLOOR = 6;
// Airborne cells are CENTRED in their cell rather than stood on its floor (the
// tool does this, because a flying pose has no contact point to align). They
// must be drawn centred too, or she steps up a few pixels the frame she leaves
// the ground.
const HERO_AIR = {
  run_b: 1, rise: 1, apex: 1, fall: 1, dash: 1, wall_cling: 1, djump_jet: 1, hurt: 1,
};

// ---- THE EYES ARE THE ONLY PART OF HER THAT ACTS ---------------------------
//
// She has no mouth, no brows and a ceramic face that cannot move. Everything
// she feels has to come out of two lights, which is a constraint and not a
// shortage — the portrait bust in game.js has always worked this way, and its
// comment calls the visor "the LED strip that does the acting". This is that,
// on her body, at gameplay size.
//
// THE PLATES CANNOT DO IT. Her eyes are baked into all 22 of them, so authored
// alone she wears one expression per pose forever: the same face landing a jump
// as taking a hit. So the eye-lights are REPAINTED live over the plate — the
// baked pair is covered with the visor's own dark, and a new pair is drawn in
// whatever shape the moment calls for.
//
// WHERE they are per pose is measured, not guessed: tools/heroeyes.cjs finds
// the cyan pair in each cell and writes this table. Three poses defeat it (her
// eyes are dim, tipped away, or drowned by a brighter cyan elsewhere) and are
// set by hand there, said out loud, and checked on its --mark image.
// generated by tools/heroeyes.cjs from hzd_states_front.png
const HERO_EYE = {
  idle:        { lx: 0.410, ly: 0.445, rx: 0.510, ry: 0.444, ew: 0.044, eh: 0.060 },
  walk_a:      { lx: 0.702, ly: 0.450, rx: 0.759, ry: 0.453, ew: 0.030, eh: 0.050 },
  walk_b:      { lx: 0.609, ly: 0.406, rx: 0.692, ry: 0.409, ew: 0.044, eh: 0.063 },
  run_a:       { lx: 0.410, ly: 0.391, rx: 0.499, ry: 0.390, ew: 0.041, eh: 0.053 },
  run_b:       { lx: 0.348, ly: 0.308, rx: 0.416, ry: 0.302, ew: 0.031, eh: 0.053 },
  rise:        { lx: 0.460, ly: 0.205, rx: 0.523, ry: 0.203, ew: 0.028, eh: 0.032 },
  apex:        { lx: 0.450, ly: 0.376, rx: 0.548, ry: 0.377, ew: 0.048, eh: 0.057 },
  fall:        { lx: 0.582, ly: 0.610, rx: 0.674, ry: 0.577, ew: 0.058, eh: 0.063 },
  land:        { lx: 0.462, ly: 0.609, rx: 0.589, ry: 0.609, ew: 0.055, eh: 0.063 },
  dash:        { lx: 0.260, ly: 0.402, rx: 0.362, ry: 0.400, ew: 0.046, eh: 0.062 },
  skid:        { lx: 0.730, ly: 0.446, rx: 0.803, ry: 0.473, ew: 0.042, eh: 0.043 },
  wall_cling:  { lx: 0.529, ly: 0.295, rx: 0.600, ry: 0.289, ew: 0.044, eh: 0.047 },
  djump_jet:   { lx: 0.460, ly: 0.219, rx: 0.528, ry: 0.204, ew: 0.048, eh: 0.047 },
  claw_1:      { lx: 0.605, ly: 0.384, rx: 0.703, ry: 0.402, ew: 0.051, eh: 0.058 },
  claw_2:      { lx: 0.268, ly: 0.432, rx: 0.361, ry: 0.419, ew: 0.044, eh: 0.062 },
  finisher:    { lx: 0.452, ly: 0.447, rx: 0.548, ry: 0.447, ew: 0.044, eh: 0.057 },
  charge:      { lx: 0.411, ly: 0.695, rx: 0.586, ry: 0.694, ew: 0.072, eh: 0.075 },
  burst:       { lx: 0.465, ly: 0.324, rx: 0.579, ry: 0.323, ew: 0.055, eh: 0.057 },
  hurt:        { lx: 0.598, ly: 0.259, rx: 0.680, ry: 0.279, ew: 0.058, eh: 0.053 },
  heal:        { lx: 0.663, ly: 0.578, rx: 0.744, ry: 0.571, ew: 0.055, eh: 0.033 },
  song:        { lx: 0.522, ly: 0.470, rx: 0.617, ry: 0.463, ew: 0.045, eh: 0.035 },
  slump:       { lx: 0.681, ly: 0.447, rx: 0.746, ry: 0.465, ew: 0.050, eh: 0.030 },
};

// THE MOODS. Same names as drawPortrait()'s expressions in game.js, on purpose:
// the face on her body and the face in the dialogue box must never disagree.
//
// SHE IS CUTE BY DEFAULT AND THAT IS THE RULE, not a starting value. `calm` is
// two big soft rounded lights with a slow blink, and everything else is a
// DEPARTURE from it that decays back. A character whose resting face is neutral
// reads as a machine; hers reads as a kid, and the fight is what makes it
// harden.
//
// Shape does the work, not colour. Red is the virus in this game and amber is
// the one reserved telegraph (ART_BIBLE §3.5), so her feelings are NOT allowed
// to reach for either — an angry cat with red eyes would read as infected. Her
// range is her own cyan-to-mint, and what changes is the SHAPE of the light:
//   squash    < 1 narrows the light to a slit, > 1 opens it round and wide
//   tilt      inner corners down = angry, outer corners down = sad. This one
//             trick carries most of the emotion in every cartoon ever drawn
//   glow      brightness, and its pulse
//   ar        aspect: > 1 wide and sleepy, < 1 tall and alert
//   asym      the FAR eye's size against the near one. Two identical lights are
//             a readout; one slightly smaller is a face with a thought behind
//             it, which is the whole of `curious`
//
// Every row was checked on tools/moodshot.cjs, and two were rewritten because
// of it: `sad` first differed from `calm` only in brightness (a droop the eye
// cannot see is not a droop) and `curious` was a second `excited`.
const HERO_MOOD = {
  //            squash tilt    glow  ar    pulse  asym
  calm:       { sq: 1.00, tl:  0.00, gl: 1.00, ar: 1.00, pu: 0.00, as: 1.00 },
  happy:      { sq: 0.55, tl: -0.30, gl: 1.15, ar: 1.35, pu: 0.00, as: 1.00 },  // shut upward — the ^^ smile
  excited:    { sq: 1.25, tl:  0.00, gl: 1.30, ar: 0.85, pu: 7.00, as: 1.00 },  // wide, bright, buzzing
  determined: { sq: 0.72, tl: -0.34, gl: 1.12, ar: 1.15, pu: 0.00, as: 1.00 },  // narrowed, inner down
  angry:      { sq: 0.50, tl: -0.62, gl: 1.30, ar: 1.30, pu: 3.20, as: 1.00 },  // hard slits, steep, burning
  sad:        { sq: 0.52, tl:  0.62, gl: 0.42, ar: 1.25, pu: 0.00, as: 1.00 },  // outer corners dragged down
  hurt:       { sq: 0.22, tl:  0.10, gl: 0.85, ar: 1.40, pu: 15.0, as: 1.00 },  // screwed shut, flickering
  curious:    { sq: 1.10, tl:  0.14, gl: 0.95, ar: 0.92, pu: 0.00, as: 0.62 },  // one eye small: a question
  weary:      { sq: 0.45, tl:  0.26, gl: 0.40, ar: 1.30, pu: 1.10, as: 1.00 },  // one core left: guttering
};

// ================= PLAYER =================
class Player {
  constructor(x, y) {
    this.x = x; this.y = y; this.w = 24; this.h = 36;
    this.vx = 0; this.vy = 0; this.face = 1; this.faceVis = 1; this.on = false;
    this.cores = 5; this.volts = 33;
    this.coyote = 0; this.jbuf = 0; this.airJumps = 0;
    this.ccorr = true;   // moveEnt slides her around clipped ceiling corners
    this.dashT = 0; this.dashCD = 0; this.iT = 0; this.atkCD = 0;
    this.swing = null; this.healT = 0; this.castCD = 0;
    this.dead = false; this.wallSlide = 0; this.trail = [];
    this.lastSafe = { x, y }; this.anim = 0; this.landT = 0;
    this.lean = 0; this.flipT = 0; this.jetT = 0; this.skidT = 0;
    this.combo = 0; this.comboT = 0; this.dashVX = 0; this.dashVY = 0; this.rechargeT = 0;
    this.chargeT = 0; this.chargeTick = 0; this.healTick = 0;
    this.mood = null; this.moodT = 0;      // a scripted feeling, and its clock
    // THE SWIRL and the window it leaves: while twinT runs the blade is in two
    // and her combo swings both. See swirl().
    this.swirlT = 0; this.swirlTick = 0; this.swirlHits = 0; this.twinT = 0;
    this.clawT = 0; this.clawCD = 0; this.pounceT = 0;   // FERAL CLAWS (robo-cat)
    this.armCD = 0; this.songT = 0; this.songCD = 0; this.starCD = 0;
    this.downBuf = 0; this.pogoT = 0; this.slowT = 0;   // frost-slow from the Archivist
    // THE STUN. Nothing in the game took her controls away until the Wolf Pack
    // Alpha's roar, and taking them away is the most expensive thing a boss can
    // do to a player — so it is one field, read in exactly one place, and every
    // move that sets it has a wind-up long enough to leave the radius.
    this.stunT = 0;
    // scarf (4 segments) + tail (3 segments) spring chains — angles + velocities
    this.scarfA = [-0.4, -0.55, -0.7, -0.85]; this.scarfV = [0, 0, 0, 0];
    this.tailA = [0.9, 0.75, 0.6]; this.tailV = [0, 0, 0];
    // motion-depth state: anticipation / overshoot / settle + idle micro-life
    this.takeoffT = 0; this.takeoff0 = 0.16; this.takeoffCoil = 0; // jump coil + launch stretch
    this.land0 = 0.12;                                   // duration of the current landing bounce
    this.hurtPoseT = 0;                                  // limbs flail for a beat on knockback
    this.earL = 0; this.earV = 0;                        // ear-tip inertia (spring, px of trail)
    this.earTwitchT = 0; this.earTwitchSide = 1;         // idle ear twitch
    this.idleT = 0; this.lookX = 0; this.lookTgt = 0;    // look-around visor shift + weight shift
    this.dashTrailT = 0;                                 // afterimage spawn metronome
  }
  maxCores() { return G.save.coresMax + (hasCrest('plate') ? 1 : 0) + (relicHas('silent') ? 1 : 0); }
  speed() { return 340 * (hasCrest('sprint') ? 1.15 : 1) * (relicHas('shard') ? 1.04 : 1); }
  dmg() { return Math.round(12 * (hasCrest('claws') ? 1.25 : 1) * (G.save.flags && G.save.flags.resolve ? 1.18 : 1) * (1 + (relicHas('fang') ? 0.08 : 0) + (relicHas('whisker') ? 0.06 : 0)) * DF().pdmg); }
  voltMax() { return relicHas('collar') ? 110 : 99; }
  healCost() { return relicHas('coolant') ? 28 : 33; }
  gainVolts(n) { this.volts = clamp(this.volts + Math.round(n * (hasCrest('siphon') ? 1.5 : 1)) + (relicHas('silk') ? 2 : 0), 0, this.voltMax()); }
  update(dt) {
    if (this.dead) return;
    // ---- STUNNED: THE CONTROLS ARE GONE, AND THEY ARE GONE ALL AT ONCE ------
    // Gating each input site separately is how a stun ends up letting you dash
    // out of it because one branch was missed. `inD`/`inP` are top-level
    // functions in the concatenated build, so SHADOWING them for the length of
    // this method kills every read in it — walk, jump, attack, dash, cast, the
    // pad, the touch controller — from one line, which is also the only way
    // RULE ONE holds without four copies of the same check.
    const _stun = (this.stunT = Math.max(0, (this.stunT || 0) - dt)) > 0;
    const inD = _stun ? () => false : IN_D, inP = _stun ? () => false : IN_P;
    if (_stun && chance(0.5))
      addPart(this.x + this.w / 2 + rnd(-10, 10), this.y - 4,
        rnd(-30, 30), rnd(-50, -20), 0.4, '#ffe08a', 2, 60);
    // she TURNS, fast but with weight: the body flexes through the flip in
    // ~100ms and kicks a little dust — same law as every creature in the game
    {
      const pvs = Math.sign(this.faceVis || 1);
      this.faceVis += clamp(this.face - this.faceVis, -dt * 18, dt * 18);
      if ((Math.sign(this.faceVis) || 1) !== pvs && this.on)
        for (let i = 0; i < 3; i++)
          addPart(this.x + this.w / 2 + rnd(-6, 6), this.y + this.h - 2,
            rnd(-60, 60), rnd(-70, -20), 0.25, '#8fa3b5', 2, 400);
    }
    // scarf + tail follow-through: spring-damper chains (k=0.3, damping 0.8
    // per 60fps frame). Each segment chases the one before it, so the cloth
    // whips and settles instead of ticking like a metronome.
    {
      const f60 = clamp(dt * 60, 0, 3);
      const wind = clamp(this.vx * this.face, 0, 420) / 420;   // forward speed streams it back
      const fall = clamp(this.vy / 900, -1, 1);                // + falling lifts, − rising drops
      for (let i = 0; i < 4; i++) {
        const rest = -0.34 - i * 0.14 + wind * (0.44 + i * 0.1) + fall * (0.5 + i * 0.14)
          + Math.sin(this.anim * (9 + i * 1.3) + i * 1.9) * (0.05 + wind * 0.16 + Math.abs(fall) * 0.08);
        const drive = i ? this.scarfA[i - 1] * 0.6 + rest * 0.4 : rest;
        this.scarfV[i] = (this.scarfV[i] + (drive - this.scarfA[i]) * 0.3 * f60) * Math.pow(0.8, f60);
        this.scarfA[i] = clamp(this.scarfA[i] + this.scarfV[i] * f60 * 0.6, -1.5, 1.4);
      }
      const runK = clamp(Math.abs(this.vx) / this.speed(), 0, 1);
      for (let i = 0; i < 3; i++) {
        const rest = 0.95 - i * 0.16 - wind * 0.5 + fall * 0.4
          + Math.sin(this.anim * 6 - i * 0.9) * (0.12 + runK * 0.1);
        const drive = i ? this.tailA[i - 1] * 0.55 + rest * 0.45 : rest;
        this.tailV[i] = (this.tailV[i] + (drive - this.tailA[i]) * 0.3 * f60) * Math.pow(0.8, f60);
        this.tailA[i] = clamp(this.tailA[i] + this.tailV[i] * f60 * 0.6, -0.4, 2.2);
      }
      // ear-tip inertia: the tall antenna ears trail the head — swept back at a
      // run, thrown forward when she brakes, lifted in a fall (same spring feel
      // as the scarf, one scalar: px of horizontal tip-lag in local space)
      const eTgt = -clamp(this.vx * this.face / this.speed(), -1, 1) * 3.4 - fall * 1.6;
      this.earV = (this.earV + (eTgt - this.earL) * 0.32 * f60) * Math.pow(0.76, f60);
      this.earL = clamp(this.earL + this.earV * f60 * 0.7, -5, 5);
      // idle micro-life: randomized ear twitches, tail flicks, look-arounds and
      // slow weight shifts — she never stands like a statue
      const idle = this.on && Math.abs(this.vx) < 30 && !this.swingVis && this.dashT <= 0
        && this.healT <= 0 && this.landT <= 0;
      if (idle) {
        this.idleT += dt;
        this.earTwitchIn = (this.earTwitchIn == null ? rnd(1.0, 2.6) : this.earTwitchIn) - dt;
        if (this.earTwitchIn <= 0) {
          this.earTwitchIn = rnd(1.6, 4.4); this.earTwitchT = 0.34;
          this.earTwitchSide = chance(0.5) ? -1 : 1;
        }
        this.lookIn = (this.lookIn == null ? rnd(1.6, 3.4) : this.lookIn) - dt;
        if (this.lookIn <= 0) {
          this.lookIn = rnd(2.4, 5.5);
          this.lookTgt = chance(0.6) ? (chance(0.5) ? -2.6 : 2.6) : 0;
          this.lookHold = rnd(0.5, 1.2);
        }
        this.tailFlickIn = (this.tailFlickIn == null ? rnd(1.8, 4.5) : this.tailFlickIn) - dt;
        if (this.tailFlickIn <= 0) {
          this.tailFlickIn = rnd(2.4, 6);
          this.tailV[0] += 0.55; this.tailV[1] += 0.35; this.tailV[2] += 0.2;
        }
      } else { this.idleT = 0; this.lookTgt = 0; this.lookHold = null; }
      if (this.lookHold != null) {
        this.lookHold -= dt;
        if (this.lookHold <= 0) { this.lookTgt = 0; this.lookHold = null; }
      }
      this.earTwitchT = Math.max(0, this.earTwitchT - dt);
      this.lookX = lerp(this.lookX, this.lookTgt, 1 - Math.pow(0.001, dt));
      this.takeoffT = Math.max(0, this.takeoffT - dt);
      this.hurtPoseT = Math.max(0, this.hurtPoseT - dt);
    }
    if (this.rechargeT > 0) {
      this.rechargeT -= dt; this.anim += dt;
      this.vx = 0; this.vy = Math.min(this.vy + 2300 * dt, 980);
      moveEnt(this, dt);
      return;
    }
    this.anim += dt;
    this.dashCD -= dt; this.atkCD -= dt; this.iT -= dt; this.castCD -= dt;
    this.jbuf -= dt; this.landT -= dt; this.comboT -= dt;
    if (this.slowT > 0) {
      this.slowT -= dt;
      if (chance(0.3)) addPart(this.x + rnd(0, this.w), this.y + rnd(0, this.h),
        rnd(-15, 15), rnd(-25, 5), 0.4, '#bfe8ff', 2, 100);
    }
    // COOLANT FREEZE coats any floor in ice; NULL GRAVITY makes jumps go light
    const ice = !!G.roomDef.ice || (G.iceT || 0) > 0;
    // THE CHAMBER HOLD. Standing in a guardian's room while the lights come up
    // is staging, and staging that the player can walk out of is not staging.
    // Her controls come back the moment the room is lit.
    // ...and the same hold covers the WAKING: the two seconds in which the
    // cradle lets go of her. A release you can walk out of halfway through is
    // a loading screen with a picture on it.
    const held = !!G.bossEntry || !!G.wake || !!G.gateWalk;
    // MOTHER'S SONG mirrors your inputs for its few seconds — fight it
    const dirRaw = held ? 0 : (inD('RIGHT') ? 1 : 0) - (inD('LEFT') ? 1 : 0);
    const dir = (G.revT || 0) > 0 ? -dirRaw : dirRaw;
    const healing = this.healT > 0;

    if (this.dashT > 0) {
      this.dashT -= dt;
      this.vx = this.dashVX; this.vy = this.dashVY;
      if (this.dashT <= 0) { if (this.dashVY < 0) this.vy = -240; else this.vy = Math.min(this.vy, 320); }
      // afterimages: 2-3 DISCRETE echoes along the dash line (not a per-frame
      // smear) — each one a readable copy that fades where she was
      this.dashTrailT -= dt;
      if (this.dashTrailT <= 0) {
        this.dashTrailT = 0.055;
        this.trail.push({ x: this.x, y: this.y, face: this.face, t: 0.24, t0: 0.24 });
      }
    } else {
      // horizontal — crisp starts and stops
      const acc = (ice ? 1000 : 3000), fric = ice ? 260 : 2900;
      if (dir !== 0 && !healing) {
        // TURN BOOST: reversing bites harder than accelerating. Pressing away
        // from current speed is always a correction the player already wants
        // finished — every feel-canon movement kit does this (not on ice:
        // ice keeps its commitment, that is what ice IS).
        const turn = !ice && Math.sign(this.vx) === -dir ? 1.6 : 1;
        this.vx += dir * acc * turn * dt;
        // frozen joints: the Archivist's beams halve her top speed for a spell
        const cap = this.speed() * (this.slowT > 0 ? 0.5 : 1);
        this.vx = clamp(this.vx, -cap, cap);
        this.face = dir;
      } else {
        const s = Math.sign(this.vx);
        this.vx -= s * fric * dt;
        if (Math.sign(this.vx) !== s) this.vx = 0;
      }
      // asymmetric gravity: quick rise, floaty apex hang, heavier fall
      let grav = this.vy < 0 ? 2150 : 3050;
      if (!this.on && Math.abs(this.vy) < 90) grav *= 0.55;
      if ((G.lowGravT || 0) > 0) grav *= 0.32;   // NULL GRAVITY field
      this.vy = Math.min(this.vy + grav * dt, 1020);
      this.wallSlide = 0;
      if (hasMod('wall') && !this.on && this.vy > 0 && dir !== 0 && touchingWall(this, dir)) {
        this.vy = Math.min(this.vy, 150); this.wallSlide = dir;
        if (chance(0.3)) addPart(dir > 0 ? this.x + this.w : this.x, this.y + this.h * 0.7, -dir * 40, rnd(-20, 60), 0.3, PAL[G.roomDef.zone].glow, 2, 300, true);
        // hot friction flecks off the paw pressed to the wall
        if (chance(0.22)) addPart(dir > 0 ? this.x + this.w : this.x, this.y + this.h * 0.35,
          -dir * rnd(30, 90), rnd(-90, -30), 0.24, '#ffd76a', 1.6, 700, true);
      }
      // jumping
      if (inP('JUMP')) this.jbuf = 0.12;
      if (this.jbuf > 0) {
        if (this.on || this.coyote > 0) {
          this.vy = -770 * (relicHas('spring') ? 1.045 : 1);
          this.on = false; this.coyote = 0; this.jbuf = 0; this.jetT = 0.2; sfx('jump');
          this.takeoffT = this.takeoff0 = 0.17; this.takeoffCoil = 1;   // coil 1-2 frames, then stretch
        } else if (this.wallSlide !== 0) {
          this.vy = -700; this.vx = -this.wallSlide * 430; this.face = -this.wallSlide; this.jbuf = 0;
          this.jetT = 0.22; this.flipT = FLIP_DUR; sfx('jump');
          this.takeoffT = this.takeoff0 = 0.12; this.takeoffCoil = 0;   // launch stretch only
          burst(this.wallSlide > 0 ? this.x + this.w : this.x, this.y + this.h / 2, 6, PAL[G.roomDef.zone].glow, 140, 0.3, 400, 3, true);
        } else if (this.airJumps > 0) {
          // THE DOUBLE JUMP IS A BACK JET NOW, not a pirouette (owner's call).
          // She is a robot: the second jump is HARDWARE — the back thruster
          // lights and shoves her, the same family as the dash boots. boostT
          // drives the thrust pose and the plume; the spin is retired from
          // this move (the wall jump keeps its flip, which is a different
          // gymnastic). Authored back-jet gear plates are queued in
          // ART_QUEUE §1c; the plume itself is additive light, which is the
          // one thing the art rules leave procedural (§0.0).
          this.vy = -680; this.airJumps--; this.jbuf = 0;
          this.jetT = 0.34; this.boostT = 0.3; sfx('djump');
          this.takeoffT = this.takeoff0 = 0.12; this.takeoffCoil = 0;
          burst(this.x + this.w / 2, this.y + this.h, 10, '#8ff6ff', 160, 0.35, 500, 3, true);
          if (typeof padRumble === 'function') padRumble(0.4, 0.3, 160);
        }
      }
      if (!inD('JUMP') && this.vy < -240) this.vy = -240;
      // omnidirectional dash — travels at the angle you hold
      if (inP('DASH') && hasMod('dash') && this.dashCD <= 0) {
        let ddx = (inD('RIGHT') ? 1 : 0) - (inD('LEFT') ? 1 : 0);
        let ddy = (inD('UP') ? -1 : 0) + (inD('DOWN') && !this.on ? 1 : 0);
        if (!ddx && !ddy) ddx = this.face;
        if (ddx) this.face = ddx;
        const dn = Math.hypot(ddx, ddy) || 1;
        this.dashVX = ddx / dn * 940;
        this.dashVY = ddy / dn * 880;
        this.dashT = 0.16 * (hasCrest('sprint') ? 1.2 : 1);
        this.dashCD = 0.45; this.vx = this.dashVX; this.vy = this.dashVY;
        this.dashTrailT = 0.03;   // first afterimage drops just behind her
        this.healT = 0; sfx('dash');
      }
    }
    // pose state (ninja/robot animation)
    const leanT = clamp(this.vx * this.face / this.speed(), -1, 1) * 0.15
      + (!this.on && this.dashT <= 0 ? clamp(this.vy / 1800, -0.1, 0.16) : 0);
    this.lean = lerp(this.lean, leanT, 1 - Math.pow(0.002, dt));
    this.flipT = Math.max(0, this.flipT - dt);
    this.boostT = Math.max(0, (this.boostT || 0) - dt);
    this.jetT = Math.max(0, this.jetT - dt);
    this.skidT = Math.max(0, this.skidT - dt);
    if (this.on && dir !== 0 && Math.sign(this.vx) === -dir && Math.abs(this.vx) > 200) {
      this.skidT = 0.14;
      if (chance(0.5)) addPart(this.x + this.w / 2 + dir * 10, this.y + this.h, dir * rnd(40, 110), rnd(-80, -20), 0.35, '#9fb8c8', 2.5, 600);
    }
    if (this.on && Math.abs(this.vx) > 280 && chance(0.1))
      addPart(this.x + this.w / 2 - this.face * 10, this.y + this.h - 2, -this.face * rnd(20, 60), rnd(-40, -10), 0.3, '#8fa3b5', 2, 500);
    // ---- FERAL CLAWS: the robo-cat's signature power ----
    // the volt-blade dissolves into twin purple energy claws, a halo of light
    // wraps the frame, and every strike becomes a raking claw hit
    this.clawT = Math.max(0, this.clawT - dt);
    this.clawCD = Math.max(0, this.clawCD - dt);
    this.pounceT = Math.max(0, this.pounceT - dt);
    G._pillarToldT = Math.max(0, (G._pillarToldT || 0) - dt);
    G._sgToldT = Math.max(0, (G._sgToldT || 0) - dt);
    const heroP = typeof isHero === 'function' && isHero();
    if (inP('CLAW') && this.clawCD <= 0 && this.clawT <= 0 && this.volts >= 30) {
      this.volts -= 30;
      this.clawT = 7; this.clawCD = 11;
      sfx('chargeReady'); sfx('cast');
      G.flash = Math.max(G.flash, heroP ? 0.42 : 0.3);
      cam.shake = Math.max(cam.shake, heroP ? 7 : 5);
      G.addRing(this.x + this.w / 2, this.y + this.h / 2);
      const c1 = heroP ? '#ffd76a' : '#b06aff';
      burst(this.x + this.w / 2, this.y + this.h / 2, 26, c1, 300, 0.7, 60, 3, true);
      burst(this.x + this.w / 2, this.y + this.h / 2, 12, '#ffffff', 200, 0.5, 20, 2, true);
      if (heroP) {
        // the sky answers: a bolt from Olympus strikes the hero as he is blessed
        G.bolt = { x: this.x + this.w / 2, y: this.y + this.h / 2, t: 0.35, t0: 0.35 };
        burst(this.x + this.w / 2, this.y, 18, '#fff6c0', 260, 0.6, -60, 3, true);
      }
      G.toast(t(heroP ? 'wrath_on' : 'claw_on'));
    }
    if (this.clawT > 0 && chance(0.5))
      addPart(this.x + rnd(-6, this.w + 6), this.y + rnd(0, this.h), rnd(-18, 18), rnd(-42, -12), 0.5,
        heroP ? (chance(0.5) ? '#ffd76a' : '#fff6c0') : (chance(0.5) ? '#b06aff' : '#e0a0ff'), 2.2, -40, true);
    // Down is buffered: players press DOWN and ATK together, and whichever lands
    // first used to decide the swing. Holding the intent for a beat fixes that.
    if (inD('DOWN')) this.downBuf = 0.16; else this.downBuf -= dt;
    this.pogoT -= dt;
    // ---- THE SLASH -------------------------------------------------------
    // The single worst thing about the old melee was invisible: pressing ATK
    // during recovery DROPPED the press. A player attacking on rhythm — which is
    // what anyone does once they know the timing — was throwing away every other
    // input and feeling like the character was ignoring them. Nothing else about
    // an attack matters as much as the game agreeing that you pressed the button.
    //
    // So the press is now held for a beat and spent the instant the swing is
    // free. This is the difference between "sluggish" and "tight", and it is
    // almost entirely this one buffer.
    if (inP('ATK') && !G.bossEntry) this.atkBuf = 0.2;
    else this.atkBuf = (this.atkBuf || 0) - dt;
    if (this.atkBuf > 0 && this.atkCD <= 0) {
      this.atkBuf = 0;
      // The combo ACCELERATES. Three identical beats read as one slow beat
      // repeated; opening fast and landing heavy on the finisher is what makes
      // a three-hit string feel like a sentence instead of a metronome.
      const nextC = this.comboT > 0 ? (this.combo + 1) % 3 : 0;
      this.atkCD = (nextC === 0 ? 0.26 : nextC === 1 ? 0.23 : 0.33) * (hasCrest('over') ? 0.7 : 1);
      let ax = (inD('RIGHT') ? 1 : 0) - (inD('LEFT') ? 1 : 0);
      let ay = (inD('UP') ? -1 : 0) + (this.downBuf > 0 && !this.on ? 1 : 0);
      // a down-attack goes straight down. Diagonal aim used to push the hitbox
      // forward of whatever you were standing over, which is why it kept missing.
      if (ay > 0) ax = 0;
      if (!ax && !ay) ax = this.face;
      if (ax) this.face = ax;
      // WHAT IS IN HER PAW. 0 = her own claws, 1 = the single purifier
      // crystal, 2 = the joined two-ended blade. The flag IS the weapon —
      // the same switch audio.js reads, so the hand and the whoosh can
      // never disagree. While the thrown blade is out she is bare-clawed
      // (see G.boomer below), which the audio router also honours.
      const wield = (G.boomer ? 0
        : (G.save.flags && G.save.flags.crystal2) ? 2
        : (G.save.flags && G.save.flags.crystal) ? 1 : 0);
      let threw = false;
      if (wield === 2 && typeof hasSkill === 'function' && hasSkill('boomer')
          && (this.comboT > 0 ? (this.combo + 1) % 3 : 0) === 2 && !ay) {
        // THE THROW. With both ends joined, the big slash IS the throw
        // (owner: "instead of a big slash, you will throw the sword at the
        // enemy that will come back to you"). The chain's finisher slot
        // spends the blade: it flies flat, bites on the way out and the way
        // back, and until her paw closes on it again she fights with claws.
        this.combo = 0; this.comboT = 0; this.atkCD = 0.5;
        G.boomer = { x: this.x + this.w / 2, y: this.y + this.h / 2 - 4,
          vx: (ax || this.face) * 640, vy: 0, t: 0, out: true, spin: 0, set: new Set() };
        cam.shake = Math.max(cam.shake, 3);
        this.vx -= (ax || this.face) * 90;   // the release pushes back on her
        if (typeof padRumble === 'function') padRumble(0.3, 0.4, 90);
        this.healT = 0; sfx('atk');
        threw = true;
      }
      if (!threw) {
      this.combo = this.comboT > 0 ? (this.combo + 1) % 3 : 0;
      this.comboT = 0.9;
      // THE CRYSTAL'S FINISHER RISES. Lost Crown grammar: the third beat of a
      // grounded chain is a diagonal cut that carries UP-forward, so a chain
      // that ends near a wall or a jumper ends by reaching after them. Claw
      // chains keep their flat finisher — the rake is a cat's move, not a
      // swordsman's.
      let aay = ay;
      if (wield >= 1 && this.combo === 2 && !ay && this.on) aay = -0.55;
      const ang = Math.atan2(aay, ax);
      // active a touch longer, so a swing that looks like it should connect does
      // TWIN: the swirl leaves the blade in two for a few seconds, and while it
      // is she swings BOTH. Not a damage buff with a new name — the second
      // blade opens the arc, so a chain that used to catch one thing in front of
      // her sweeps a wedge either side. Reach is the single blade's; what she
      // buys is COVERAGE, which is what a second sword is actually for.
      const twin = this.twinT > 0 && wield >= 1;
      this.swing = { t: 0.15, ax, ay: aay, ang, combo: this.combo, set: new Set(), wield,
                     pure: wield >= 1, twin };
      this.swingVis = { t: 0.24, t0: 0.24, ang, combo: this.combo, wield, twin };
      if (hasSkill('wave')) {
        const wn = Math.hypot(ax, ay) || 1;
        G.projs.push(new Proj(this.x + this.w / 2 + ax / wn * 22, this.y + this.h / 2 - 2 + ay / wn * 22,
          ax / wn * 430, ay / wn * 430, true, Math.round(8 * DF().pdmg), 7, PAL[G.roomDef.zone].glow, 0, 0.34));
      }
      // EVERY grounded swing steps into the strike. Only the finisher used to
      // move her, so the first two hits felt like swiping at air from a standstill.
      if (this.on && !ay) this.vx += ax * (this.combo === 2 ? 230 : 96);
      // and in the air a level swing arrests the fall for a moment: it reads as
      // committing weight to the blow rather than flailing while dropping
      if (!this.on && !ay && this.vy > -60) this.vy = Math.min(this.vy, 40);
      // PAW PUNCH — in claw mode the finisher becomes a pouncing strike:
      // she launches at the target like a cat, claws first
      if (this.clawT > 0 && this.combo === 2) {
        if (heroP) {
          // THUNDERFALL — Zeus answers the strike: a bolt falls from the sky
          const tx2 = this.x + this.w / 2 + ax * 46, ty2 = this.y + this.h / 2 + ay * 20;
          G.bolt = { x: tx2, y: ty2, t: 0.4, t0: 0.4 };
          G.flash = Math.max(G.flash, 0.5);
          cam.shake = Math.max(cam.shake, 9);
          G.addRing(tx2, ty2);
          sfx('boom');
          burst(tx2, ty2, 22, '#fff6c0', 320, 0.6, 120, 4, true);
          // the bolt itself wounds anything beneath it
          for (const e of G.enemies.concat(G.boss && !G.boss.dead && G.boss.st !== 'dorm' && G.boss.st !== 'intro' ? [G.boss] : [])) {
            if (e.dead) continue;
            if (Math.abs((e.x + e.w / 2) - tx2) < 46 && Math.abs((e.y + e.h / 2) - ty2) < 120) {
              e.hp -= Math.round(this.dmg() * 1.6); e.hurtT = 0.15;
              if (!(e instanceof Boss) && e.kind !== 'turret') { e.kbT = 0.3; e.vy -= 180; }
              if (e.hp <= 0) e.die(Math.sign(ax) || 1, -0.5);
            }
          }
        } else {
          this.pounceT = 0.22;
          this.vx += ax * 320;
          if (!this.on) this.vy = Math.min(this.vy, -80);
          cam.shake = Math.max(cam.shake, 5);
          sfx('wave');
          burst(this.x + this.w / 2 + ax * 18, this.y + this.h / 2 + ay * 18, 14, '#b06aff', 260, 0.4, 60, 3, true);
        }
      }
      this.healT = 0; sfx('atk');
      }
    }
    // hold attack to charge the volt-burst
    if (inD('ATK') && this.dashT <= 0) {
      this.chargeT += dt;
      // CAN SHE ACTUALLY PAY FOR IT?
      //
      // The build-up used to look and sound identical whether or not she had
      // the volts: same rising ticks, same brightening aura, same white flash
      // at full charge — and then, on release, nothing but a soft refusal
      // buried under the swing. A promise kept every time except when it isn't
      // is not a cost, it is a bug, and it was reported as one.
      //
      // The charge still runs when she is short, because a move you cannot see
      // is a move you never learn. It runs DULL: no rising ladder, sparse cold
      // particles, and the price said out loud the first time she asks for it.
      this.chargeOk = this.volts >= BURST_VOLTS;
      // SHE HOLDS A NOTE WHILE IT BUILDS. Every other bark in the game is an
      // event — one syllable on one frame — but a charge is a STATE, and the
      // thing the player needs to hear is that it is still going. So the vocal
      // starts once, a beat in, and is not re-triggered: the rising tick ladder
      // is the clock, her voice is the effort under it.
      //
      // Only when she can PAY. The refusal path is deliberately dull (see
      // below) and a hero straining for a move she cannot afford is exactly the
      // promise-that-isn't this whole branch was rewritten to stop making.
      if (this.chargeT > 0.14 && !this.chargeVoxed && this.chargeOk) {
        this.chargeVoxed = true;
        if (typeof hzdSay === 'function') hzdSay('charge', 0);
      }
      if (this.chargeT > 0.25) {
        this.chargeTick -= dt;
        if (this.chargeTick <= 0) {
          this.chargeTick = 0.11;
          if (this.chargeOk) sfxChargeTick(Math.min(1, this.chargeT / 0.6));
        }
        if (chance(this.chargeOk ? 0.55 : 0.16)) addPart(this.x + rnd(-16, 40), this.y + rnd(-12, 48), 0, 0, 0.25,
          !this.chargeOk ? '#7d6b8a' : this.chargeT >= 0.6 ? '#ffffff' : PAL[G.roomDef.zone].glow, 2.5, -170, true);
        if (this.chargeT >= 0.6 && this.chargeT - dt < 0.6) {
          sfx(this.chargeOk ? 'chargeReady' : 'no');
          // said once, at the exact moment the player is asking the question
          if (!this.chargeOk && !G.save.burstTold) {
            G.save.burstTold = 1;
            G.toast(t('tt_burst_need').replace('%n', BURST_VOLTS).replace('%v', Math.floor(this.volts)));
          }
        }
      }
    } else {
      // THE BURST COSTS SOMETHING NOW. Held attack put out 2.6x damage in a
      // 128 px circle with full knockback, at no cost and no cooldown — which
      // is strictly better than the combo the whole game is built around, so
      // finding it ended the melee game rather than deepening it. It is a
      // resource decision now, and it is in the controls screen where it can
      // be found on purpose instead of by accident.
      if (this.chargeT >= 0.6) {
        if (this.volts >= BURST_VOLTS) {
          this.volts -= BURST_VOLTS;
          // the held note ends in a shout — the one place her voice is allowed
          // to sit ON TOP of the impact rather than under it, because this is
          // the move the whole charge was for
          if (typeof hzdSay === 'function') hzdSay('release', 0);
          this.releaseCharged();
        } else { sfx('no'); this.chargeT = 0; }
      }
      this.chargeT = 0; this.chargeVoxed = false;
    }
    if (this.swingVis) { this.swingVis.t -= dt; if (this.swingVis.t <= 0) { this.swingVis = null; this._rake = null; } }
    // heal
    if (inD('HEAL') && this.on && this.dashT <= 0 && this.volts >= this.healCost() && this.cores < this.maxCores()) {
      this.healT += dt; this.vx = 0;
      if (chance(0.5)) addPart(this.x + rnd(0, this.w), this.y + this.h, rnd(-20, 20), rnd(-120, -60), 0.5, '#aef7d8', 2.5, -50, true);
      this.healTick -= dt;
      if (this.healTick <= 0) { this.healTick = 0.16; sfxHealTick(this.healT / 0.85); }
      if (this.healT >= 0.85) {
        this.healT = 0; this.volts -= this.healCost(); this.cores++;
        G.coreFlash = { i: this.cores - 1, t: 0.5 };
        if (this.cores >= this.maxCores()) G.coresFullT = 0.8;
        sfx('heal'); burst(this.x + this.w / 2, this.y + this.h / 2, 16, '#aef7d8', 180, 0.5, 100, 3, true);
      }
    } else this.healT = 0;
    this.armCD -= dt; this.songT -= dt; this.songCD -= dt; this.starCD -= dt;
    if (this.moodT > 0) this.moodT -= dt;
    // THE SWIRL runs on its own clock so its four passes keep their spacing
    // whatever the frame rate is doing
    if (this.swirlT > 0) {
      this.swirlT -= dt; this.swirlTick += dt;
      while (this.swirlTick >= SWIRL_STEP && this.swirlT > -SWIRL_STEP) {
        this.swirlTick -= SWIRL_STEP;
        this.swirlPass();
      }
      if (this.swirlT <= 0) { this.swirlTick = 0; this.atkCD = Math.max(this.atkCD, 0.30); }
    }
    if (this.twinT > 0) {
      this.twinT -= dt;
      // they lock again with a chime, so the window's end is audible and she is
      // never quietly weaker than the player thinks she is
      if (this.twinT <= 0) { this.twinT = 0; try { sfx('crystalJoin'); } catch (e) {} }
    }
    // shuriken — hers from the start, aimed with UP or DOWN
    if (inP('STAR') && this.starCD <= 0) throwStar(this);
    // cycle the suit wheel (slot 0 is the plain bolt, so EMP is never lost)
    if (inP('ARM') && cycleArm(1)) {
      const a = activeArm();
      sfx('ui'); G.toast(a ? t('arm_' + a.id) : t('arm_none'));
    }
    // CAST fires whichever suit is worn; with none worn it is the old EMP bolt
    const arm = (typeof activeArm === 'function') ? activeArm() : null;
    const empCost = hasSkill('router') ? 18 : 26;
    if (inP('CAST') && arm && this.armCD <= 0 && this.volts >= arm.cost) {
      this.volts -= arm.cost; this.armCD = arm.cd;
      fireArm(this, arm);
    } else if (inP('CAST') && !arm && hasMod('emp') && this.castCD <= 0 && this.volts >= empCost) {
      this.volts -= empCost; this.castCD = 0.5; sfx('cast');
      G.projs.push(new Proj(this.x + this.w / 2 + this.face * 16, this.y + this.h / 2 - 4, this.face * 540, 0, true, Math.round(22 * DF().pdmg), 11, '#7df3ff'));
    }
    // the Song — quiets the orders without touching the body
    if (inP('SONG') && this.songCD <= 0 && this.volts >= SONG_COST) {
      if ((G.songLockT || 0) > 0) {
        // MOTHER'S SONG is jamming the channel — the keytar chokes
        this.songCD = 0.5; sfx('no');
      } else {
        this.songCD = 1.1;
        const n = playSong();
        if (n) G.toast(t('song_hit').replace('%s', n));
        if ((G.darkT || 0) > 0) G.revealT = 3;   // the Song lights her up
      }
    }
    // resolve movement
    const wasFalling = this.vy;
    const col = moveEnt(this, dt);
    if (col.d) {
      if (!this.on && wasFalling > 420) {
        this.landT = wasFalling > 700 ? 0.22 : 0.12; this.land0 = this.landT; sfx('land');
        if (typeof padRumble === 'function')
          padRumble(wasFalling > 700 ? 0.5 : 0.2, wasFalling > 700 ? 0.35 : 0.3, wasFalling > 700 ? 140 : 80);
        burst(this.x + this.w / 2, this.y + this.h, wasFalling > 700 ? 14 : 6, '#9fb8c8', wasFalling > 700 ? 150 : 90, 0.35, 500, 2);
      }
      this.on = true; this.coyote = 0.1;
      this.airJumps = hasMod('djump') ? (hasSkill('triple') ? 2 : 1) : 0;
    } else { this.on = false; this.coyote -= dt; }
    if (this.on && Math.abs(this.vx) > 150 && this.dashT <= 0) {
      this.stepT = (this.stepT || 0) - dt;
      if (this.stepT <= 0) {
        this.stepT = 0.27;
        sfx((G.roomDef.ice || (G.iceT || 0) > 0) ? 'stepice' : 'step');
      }
    } else this.stepT = 0.1;
    // hazard tiles. The GROUNDING CREST is the one piece of kit that lets her
    // stand on a live rail — and standing on one is the only way to reach what
    // is under the brittle stretch of it.
    if (onSpike(this) && hasCrest('ground')) {
      if (chance(0.5)) addPart(this.x + rnd(0, this.w), this.y + this.h - 2,
        rnd(-40, 40), rnd(-70, -20), 0.3, chance(0.5) ? '#9fe8ff' : '#ffffff', 2, 90, true);
      this.groundedOn = true;
    } else if (onSpike(this)) {
      this.hurt(1, this.x - this.vx);
      if (!this.dead) { this.x = this.lastSafe.x; this.y = this.lastSafe.y; this.vx = 0; this.vy = 0; }
    } else if (this.on && this.vy === 0) {
      // remember a safe spot (solid, non-hazard footing)
      const bx = Math.floor((this.x + this.w / 2) / TILE), by = Math.floor((this.y + this.h + 4) / TILE);
      if (solidAt(bx, by) && tileAt(bx, by - 1) !== '^' && tileAt(bx - 1, by) !== '^' && tileAt(bx + 1, by) !== '^')
        this.lastSafe = { x: this.x, y: this.y };
    }
    // swing hits
    if (this.swing && this.swing.t > 0) {
      // …and the other order too: ATK first, DOWN a frame later. Within the first
      // 60ms the swing is still re-aimable.
      if (this.swing.t > 0.06 && this.swing.ay <= 0 && !this.on && inD('DOWN')) {
        this.swing.ax = 0; this.swing.ay = 1; this.swing.ang = Math.PI / 2;
      }
      this.swing.t -= dt;
      const hb = this.hitbox();
      let pogo = false;
      // A freed guardian is never a target. Swinging at the beast you saved is
      // not an attack, it is a poke — so it is intercepted here, before any of
      // the damage machinery, and answered instead.
      if (typeof isPet === 'function' && isPet(G.boss) && !this.swing.set.has(G.boss)
          && aabb(hb, hurtBoxOf(G.boss))) {
        this.swing.set.add(G.boss);
        petPoke(G.boss, hb.x + hb.w / 2, hb.y + hb.h / 2);
      }
      const targets = G.enemies.concat(G.boss && !G.boss.dead && G.boss.st !== 'intro' && G.boss.st !== 'dorm' ? [G.boss] : []);
      const n0 = Math.hypot(this.swing.ax, this.swing.ay) || 1;
      const kx = this.swing.ax / n0 || this.face, ky = this.swing.ay / n0;
      for (const e of targets) {
        if (e.dead || this.swing.set.has(e)) continue;
        if (aabb(hb, hurtBoxOf(e))) {
          this.swing.set.add(e);
          let dm = Math.round(this.dmg() * (this.swing.combo === 2 ? (hasSkill('calc') ? 1.55 : 1.35) : 1)
                              * (this.clawT > 0 ? 1.45 : 1)     // claws rake deeper
                              * (this.swing.wield === 2 ? 1.45 : this.swing.wield ? 1.25 : 1));  // the crystal has an edge
          // PURITY: the crystal is a disinfectant before it is a weapon. With
          // the skill, a pure edge bites the Eye's own machines — bosses and
          // the corrupted — harder, and says so in white.
          if (this.swing.pure && hasSkill('purity') && (e instanceof Boss || e.miniboss)) {
            dm = Math.round(dm * 1.3);
            burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 8, '#ffffff', 220, 0.3, -60, 2.4, true);
          }
          if (relicHas('lens') && chance(0.1)) {
            dm *= 2;
            burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 10, '#ffffff', 340, 0.4, 100, 4, true);
          }
          dm = dealDmg(e, dm, armEl(), hb.x + hb.w / 2, hb.y + hb.h / 2, true);
          if (!(e instanceof Boss) && e.kind !== 'turret') {
            e.kbT = 0.26;
            e.vx += kx * 310;
            e.vy = Math.min(e.vy, 0) + ky * 220 - 120;
            // RISECUT: the up-slash becomes a LAUNCHER (Lost Crown's juggle
            // grammar). The enemy goes up far enough to meet an air chain,
            // and a grounded cut that connects lifts her into the juggle too.
            if (this.swing.ay < 0 && this.swing.wield >= 1 && hasSkill('risecut')) {
              e.vy = -430; e.kbT = 0.4;
              if (this.on) this.vy = -300, this.on = false;
            }
          }
          this.gainVolts(11);
          // IMPACT, WEIGHTED. One flat freeze for every hit makes a finisher land
          // like a jab. Hit-stop, shake and rumble now all scale with what the
          // blow actually was, so the third hit of a combo reads as the third hit.
          const heavy = this.swing.combo === 2, big = e instanceof Boss;
          sfx(big ? 'bosshit' : 'hit');
          cam.shake = Math.max(cam.shake, heavy ? 5 : big ? 3.4 : 2.5);
          G.hitStop = Math.max(G.hitStop, heavy ? 0.085 : big ? 0.06 : 0.05);
          // RECOIL. Contact has to push back on HER too, or the enemy is made of
          // paper — a few pixels against the swing is all it takes to sell mass.
          this.vx -= kx * (heavy ? 130 : 62);
          if (typeof padRumble === 'function') padRumble(heavy ? 0.42 : 0.2, heavy ? 0.6 : 0.42, heavy ? 110 : 60);
          this.hitConfirmT = 0.14;
          burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 14, '#fff2a8', 280, 0.35, 300, 3, true);
          burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 6, '#ffffff', 160, 0.2, 100, 2, true);
          if (this.swing.combo === 2) G.impact = { t: 0.12, t0: 0.12, x: hb.x + hb.w / 2, y: hb.y + hb.h / 2 };
          if (this.swing.ay > 0) pogo = true;
          if (e.hp <= 0) e.die(kx, ky);
        }
      }
      // the pillar shrugs off ordinary claws — and SAYS so, because a wall
      // that eats hits silently reads as a bug rather than a lock. Sparks fly
      // on every hit; the hint line is throttled so it teaches, not nags.
      for (const s2 of G.statics) {
        if (s2.type !== 'pillar' || this.swing.pilHit || !aabb(hb, s2)) continue;
        this.swing.pilHit = true;                       // one clink per swing
        burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 6, '#bfe9ff', 180, 0.22, 220, 2, true);
        sfx('no');
        if ((G._pillarToldT || 0) <= 0) { G._pillarToldT = 3; G.toast(t('pl_hint')); }
      }
      // WHIFF. A miss used to be silent, which made a missed swing feel like a
      // dropped input rather than a mistake. The blade now cuts air on the frame
      // the window closes, and only if nothing was struck.
      if (this.swing.t <= 0 && !this.swing.set.size && !this.swing.whiffed) {
        this.swing.whiffed = true;
        sfx('whiff');
      }
      // hostile projectiles can be swatted
      for (const p of G.projs) if (!p.friendly && !p.dead && aabb(hb, p.box())) { p.dead = true; burst(p.x, p.y, 6, p.color, 150, 0.25, 300, 2, true); }
      // breakable + spike tiles in swing range
      const x0 = Math.floor(hb.x / TILE), x1 = Math.floor((hb.x + hb.w) / TILE);
      const y0 = Math.floor(hb.y / TILE), y1 = Math.floor((hb.y + hb.h) / TILE);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        const raw = tileAt(tx, ty);
        // only a grounded cat can cut a live rail; anyone else is just being hit
        if (raw === 'v') {
          if (hasCrest('ground') && this.swing.ay > 0) {
            G.breakTile(tx, ty); pogo = true;
            sfx('glass'); cam.shake = Math.max(cam.shake, 7);
            for (let i = 0; i < 14; i++)
              addPart(tx * TILE + 16, ty * TILE + 16, rnd(-220, 220), rnd(-260, 60),
                rnd(0.4, 0.8), chance(0.5) ? '#9fe8ff' : '#fff2a8', rnd(2, 3.4), 500, true);
          }
          continue;
        }
        const c = (raw === '#' && brLoose(tx, ty)) ? 'B' : raw;
        if (c === 'B') {
          // floor blocks (at/below the feet) only break with a DOWN-attack
          // (jump, hold down, hit); side/ceiling secret walls break normally
          const floorBlock = ty * TILE >= this.y + this.h - 6;
          if (this.swing.ay > 0 || !floorBlock) {
            G.breakTile(tx, ty);
            if (this.swing.ay > 0) pogo = true;
          }
        } else if (c === '^' && this.swing.ay > 0) pogo = true;
      }
      if (pogo && this.swing.ay > 0) {
        // PLUNGE: with the skill, the down-slash's rebound frame also slams a
        // ring into the floor — everything grounded nearby takes a smaller,
        // second bite. Priced as a tier-2 node because it turns the pogo from
        // an escape move into an opener.
        if (this.swing.wield >= 1 && hasSkill('plunge')) {
          const px0 = this.x + this.w / 2, py0 = this.y + this.h;
          G.addRing(px0, py0);
          cam.shake = Math.max(cam.shake, 6);
          burst(px0, py0, 18, '#e8f4ff', 300, 0.5, 200, 3, true);
          for (const e2 of G.enemies) {
            if (e2.dead || this.swing.set.has(e2)) continue;
            if (Math.abs(e2.x + e2.w / 2 - px0) < 78 && Math.abs(e2.y + e2.h - py0) < 40) {
              this.swing.set.add(e2);
              dealDmg(e2, Math.round(this.dmg() * 0.6), armEl(), e2.x + e2.w / 2, e2.y + e2.h / 2, true);
              e2.kbT = 0.3; e2.vx += Math.sign(e2.x - px0) * 260; e2.vy = -180;
              if (e2.hp <= 0) e2.die(Math.sign(e2.x - px0) || 1, -0.4);
            }
          }
        }
        // A short, crisp rebound rather than a free jump — hold JUMP to get the
        // taller one. Either way you leave the enemy instead of falling into it.
        this.vy = inD('JUMP') ? -880 : -660;
        if (this.dashT > 0 && this.dashVY > 0) { this.dashT = 0; this.dashVY = 0; }
        this.iT = Math.max(this.iT, 0.18);   // no contact damage from what you just hit
        this.pogoT = 0.18;
        this.airJumps = hasMod('djump') ? (hasSkill('triple') ? 2 : 1) : 0;
        this.dashCD = Math.min(this.dashCD, 0); this.swing.t = 0; sfx('pogo');
        if (typeof padRumble === 'function') padRumble(0.3, 0.55, 90);
        cam.shake = Math.max(cam.shake, 4);
        G.hitStop = Math.max(G.hitStop, 0.05);
        burst(this.x + this.w / 2, this.y + this.h + 4, 10, '#cfe8ff', 220, 0.3, 260, 3, true);
      }
    }
    for (let i = this.trail.length - 1; i >= 0; i--) { this.trail[i].t -= dt; if (this.trail[i].t <= 0) this.trail.splice(i, 1); }
    this.updateBoomer(dt);
  }
  // ---- THE THROWN BLADE ---------------------------------------------------
  // Out flat and fast, a beat of hang, then home to her paw — and it cuts on
  // every pass: the same enemy can be hit going and coming, which is the
  // whole reason a boomerang is not just a slower projectile. While it flies
  // she is unarmed (the atk router and the audio's wielded() both check
  // G.boomer), so a throw is a real decision, not free damage.
  updateBoomer(dt) {
    const b = G.boomer;
    if (!b) return;
    b.t += dt; b.spin += dt * 22;
    if (b.out) {
      b.vx *= Math.pow(0.14, dt);            // the air bleeds the throw off
      if (Math.abs(b.vx) < 130 || b.t > 0.55) { b.out = false; b.set.clear(); }
    } else {
      // homing return — to where she IS, not where she stood when she threw
      const tx = this.x + this.w / 2, ty = this.y + this.h / 2 - 4;
      const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy) || 1;
      const sp = Math.min(980, 560 + b.t * 500);
      b.vx = dx / d * sp; b.vy = dy / d * sp;
      if (d < 26) {                          // the catch
        G.boomer = null;
        this.atkCD = Math.min(this.atkCD, 0.08);
        sfx('chargeReady');
        burst(tx, ty, 8, '#ffffff', 160, 0.25, 60, 2, true);
        if (typeof padRumble === 'function') padRumble(0.2, 0.3, 60);
        return;
      }
    }
    b.x += b.vx * dt; b.y += (b.vy || 0) * dt;
    // it cuts both ways, once per pass
    const bb = { x: b.x - 16, y: b.y - 16, w: 32, h: 32 };
    const targets = G.enemies.concat(G.boss && !G.boss.dead && G.boss.st !== 'intro' && G.boss.st !== 'dorm' ? [G.boss] : []);
    for (const e of targets) {
      if (e.dead || b.set.has(e)) continue;
      if (typeof isPet === 'function' && isPet(e)) continue;
      if (aabb(bb, hurtBoxOf(e))) {
        b.set.add(e);
        const dm = dealDmg(e, Math.round(this.dmg() * 1.15), armEl(), b.x, b.y, true);
        sfx(e instanceof Boss ? 'bosshit' : 'hit');
        G.hitStop = Math.max(G.hitStop, 0.05);
        burst(b.x, b.y, 10, '#ffffff', 240, 0.3, 120, 2.6, true);
        if (!(e instanceof Boss) && e.kind !== 'turret') { e.kbT = 0.22; e.vx += Math.sign(b.vx) * 240; }
        if (e.hp <= 0) e.die(Math.sign(b.vx) || 1, -0.3);
      }
    }
    // walls turn it around early rather than eating it
    if (b.out && solidAt(Math.floor((b.x + Math.sign(b.vx) * 16) / TILE), Math.floor(b.y / TILE))) { b.out = false; b.set.clear(); }
  }
  // ---- THE SWIRL: the twin-blade supercharge --------------------------------
  //
  // With both halves in her paws the charged blow is not a punch, it is a DANCE.
  // She comes up onto one toe and turns, and the two crystals draw a flower in
  // the air around her — the same five-petal ring the art plate carries.
  //
  // WHY IT IS A DIFFERENT MOVE AND NOT A BIGGER ONE. The single-crystal burst is
  // a shove: one hit, everything within 128 px, over in a moment. The swirl is
  // FOUR passes over 640 ms in a tighter ring, so it does more to a thing that
  // stays and much less to a thing that leaves. That makes it a positioning
  // move — you open with it when something is committed, not when something is
  // approaching — and it is the greedy axis from the combat skill: the window
  // fits three passes comfortably and tempts you to stand there for the fourth.
  //
  // AND IT LEAVES HER SPLIT. For SWIRL_TWIN seconds afterwards the blade stays
  // in two, and her combo swings BOTH — which is the two-hand technique itself
  // rather than a one-off flourish. They lock again with a chime. So the fantasy
  // arrives in the right order: she finds the second half and can fight with the
  // pair, and joining them is the thing she grows into.
  swirl() {
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    this.chargeT = 0;
    this.swirlT = SWIRL_T; this.swirlTick = 0; this.swirlHits = 0;
    this.twinT = SWIRL_TWIN;
    // she rises and turns: light, buoyant, off the floor for the whole move
    this.vy = Math.min(this.vy, -110);
    // its OWN cue, on the pass clock — not the burst's thud. See crystalSwirl()
    sfx('crystalSwirl');
    // NO cam.shake here. The combat skill's camera rule is that the screen must
    // never shake through a frame the player has to read, and the whole point of
    // this move is that you watch it. The flash and the ring carry the weight.
    G.flash = Math.max(G.flash, 0.4);
    G.addRing(cx, cy, 30);
    this.swingVis = { t: SWIRL_T, t0: SWIRL_T, ang: 0, combo: 3, charged: true, swirl: true };
    burst(cx, cy, 22, '#ffffff', 260, 0.7, 90, 3, true);
  }
  // one damage pass of the swirl, called on its own clock from update()
  swirlPass() {
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    const R = SWIRL_R, dm = Math.max(1, Math.round(this.dmg() * 0.95));
    const targets = G.enemies.concat(G.boss && !G.boss.dead && G.boss.st !== 'intro' && G.boss.st !== 'dorm' ? [G.boss] : []);
    let hit = 0;
    for (const e of targets) {
      if (e.dead) continue;
      const ex = e.x + e.w / 2 - cx, ey = e.y + e.h / 2 - cy;
      const d = Math.hypot(ex, ey);
      if (d > R + Math.max(e.w, e.h) / 2) continue;
      hit++;
      e.hp -= dm; e.hurtT = 0.18;
      const n = d || 1;
      // it LIFTS rather than throws: a thing juggled inside the ring stays in
      // it for the next pass, which is what makes standing your ground pay
      if (!(e instanceof Boss) && e.kind !== 'turret') {
        e.kbT = 0.16; e.vx += ex / n * 120; e.vy = Math.min(e.vy, -60);
      }
      this.gainVolts(4);
      if (e.hp <= 0) e.die(ex / n, ey / n);
    }
    if (hit) { G.hitStop = Math.max(G.hitStop, 0.035); sfx('hit'); }
    this.swirlHits += hit;
    burst(cx, cy, 8, '#eafffb', 210, 0.35, 60, 2, true);
  }
  releaseCharged() {
    // both halves in her paws: the charged blow is the dance instead
    if ((G.save.flags && G.save.flags.crystal2) && !G.boomer) return this.swirl();
    this.chargeT = 0;
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    sfx('chargedHit');
    cam.shake = 13; G.hitStop = Math.max(G.hitStop, 0.09);
    G.flash = Math.max(G.flash, 0.55);
    G.impact = { t: 0.16, t0: 0.16, x: cx, y: cy };
    G.addRing(cx, cy); G.addRing(cx, cy, 55);
    // flagged so the body can draw the BURST plate rather than the ordinary
    // third-hit finisher — same combo number, different blow
    this.swingVis = { t: 0.32, t0: 0.32, ang: 0, combo: 3, charged: true };
    burst(cx, cy, 34, '#ffffff', 400, 0.6, 200, 4, true);
    burst(cx, cy, 20, PAL[G.roomDef.zone].glow, 300, 0.8, 100, 4, true);
    const R = 128, dm = Math.round(this.dmg() * 2.6);
    const targets = G.enemies.concat(G.boss && !G.boss.dead && G.boss.st !== 'intro' && G.boss.st !== 'dorm' ? [G.boss] : []);
    for (const e of targets) {
      if (e.dead) continue;
      const ex = e.x + e.w / 2 - cx, ey = e.y + e.h / 2 - cy;
      const d = Math.hypot(ex, ey);
      if (d > R + Math.max(e.w, e.h) / 2) continue;
      e.hp -= dm; e.hurtT = 0.2;
      const n = d || 1;
      if (!(e instanceof Boss) && e.kind !== 'turret') {
        e.kbT = 0.3; e.vx += ex / n * 420; e.vy = Math.min(e.vy, 0) + ey / n * 200 - 180;
      }
      this.gainVolts(11);
      if (e.hp <= 0) e.die(ex / n, ey / n);
    }
    // shatter breakables caught in the burst
    const t0x = Math.floor((cx - R) / TILE), t1x = Math.floor((cx + R) / TILE);
    const t0y = Math.floor((cy - R) / TILE), t1y = Math.floor((cy + R) / TILE);
    for (let ty = t0y; ty <= t1y; ty++) for (let tx = t0x; tx <= t1x; tx++)
      if (tileAt(tx, ty) === 'B') G.breakTile(tx, ty);
    // THE PILLAR ANSWERS ONLY TO THIS. Ordinary claws glance off pure crystal
    // (see the swing's hint below); the supercharged claw is the quarry tool —
    // the owner's design, and the reason the burst was taught before the cave.
    // Shattering is once per save (flags.pl_*), and the shard goes into the
    // BAG so the inventory screen shows what she is carrying back to Ratchet.
    for (let i = G.statics.length - 1; i >= 0; i--) {
      const s = G.statics[i];
      if (s.type !== 'pillar') continue;
      const sx = s.x + s.w / 2, sy = s.y + s.h / 2;
      if (Math.hypot(sx - cx, sy - cy) > R + 60) continue;
      G.statics.splice(i, 1);
      G.save.flags['pl_' + (s.extra || 'cshard')] = 1;
      sfx('glass');
      cam.shake = Math.max(cam.shake, 11);
      G.flash = Math.max(G.flash, 0.65);
      G.hitStop = Math.max(G.hitStop, 0.1);
      burst(sx, sy, 42, '#ffffff', 400, 0.9, 160, 4, true);
      burst(sx, sy, 26, '#bfe9ff', 320, 1.2, 60, 3, true);
      if (typeof padRumble === 'function') padRumble(0.8, 0.7, 360);
      if (typeof questTake === 'function') questTake('cshard');
    }
    if (hasSkill('wave')) {
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2;
        G.projs.push(new Proj(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24,
          Math.cos(a) * 430, Math.sin(a) * 430, true, Math.round(8 * DF().pdmg), 7, PAL[G.roomDef.zone].glow, 0, 0.34));
      }
      sfx('wave');
    }
  }
  hitbox() {
    const s = this.swing;
    const n = Math.hypot(s.ax, s.ay) || 1;
    const down = s.ay > 0 && !s.ax;
    // the down box starts at the feet and is wider than it is deep, so landing on
    // something slightly to one side still rebounds
    // THE LONG RAKE, FOR REAL. 'reach' costs 50 IQ and promised the finisher a
    // longer arc; it swapped the ARC ART from 62 px to 104 px and never touched
    // this function, so the picture had been lying about where the claws were
    // since the day it shipped. The hitbox now grows with the drawing.
    const rk = s.combo === 2 && typeof hasSkill === 'function' && hasSkill('reach');
    // a sword out-reaches a paw: the crystal adds real length to every cut,
    // and the joined blade a little more. The DRAWN arc grows the same way
    // (drawRake), because a hitbox the picture does not admit to is the exact
    // lie the long-rake fix above was about.
    const wm = s.wield === 2 ? 1.35 : s.wield ? 1.2 : 1;
    // TWIN widens, it does not lengthen. The second blade covers the ground
    // either side of the first, so `half` grows and `R` does not — she is not
    // reaching further, she is filling more of what she can already reach.
    const tw = s.twin ? 1.45 : 1;
    const R = (down ? 46 : (s.combo === 2 ? (rk ? 68 : 50) : 44)) * wm;
    const half = (down ? 32 : (s.combo === 2 ? (rk ? 46 : 35) : 30)) * wm * tw;
    const cx = this.x + this.w / 2 + s.ax / n * R;
    const cy = this.y + this.h / 2 + s.ay / n * R;
    return { x: cx - half, y: cy - half, w: half * 2, h: half * 2 };
  }
  // The third argument is the point of this: WHAT hit her, by name. One
  // parameter turns "I think that attack is unfair" into a ranked table, and
  // the published heuristic is blunt — any single attack above about 40% of all
  // damage taken has a telegraph problem. Nothing is sent anywhere; it lives in
  // the run and is read from the console.
  hurt(d, fromX, src) {
    if (this.dead || this.iT > 0) return;
    try {
      G.dmgLog = G.dmgLog || {};
      const key = src || 'unknown';
      G.dmgLog[key] = (G.dmgLog[key] | 0) + 1;
    } catch (e) {}
    if (this.dashT > 0 && hasCrest('phantom')) return;
    if (relicHas('aegis') && !G.save.usedAegis) {
      G.save.usedAegis = true;
      this.iT = 1.2;
      sfx('chargeReady');
      G.addRing(this.x + this.w / 2, this.y + this.h / 2);
      G.toast(t('rl_aegis'));
      burst(this.x + this.w / 2, this.y + this.h / 2, 16, '#ffd76a', 240, 0.5, 200, 3, true);
      return;
    }
    // THE OATH — what the lion owes her for not finishing it. Once per room,
    // the blow that would leave her on her last core is answered instead: it
    // comes out of the dark, roars everything off her, and is gone. Deliberately
    // a SAVE and not a stat, so the tame reward is a different KIND of power
    // from the +18% the kill hands out rather than a bigger or smaller number.
    if (G.save.flags && G.save.flags.oath && !this.oathUsed && this.cores - d <= 1 && this.cores > 1) {
      this.oathUsed = true;
      this.iT = 1.6; this.healT = 0;
      const cx0 = this.x + this.w / 2, cy0 = this.y + this.h / 2;
      if (typeof roarWave === 'function') roarWave(cx0, cy0, '#ffb347');
      sfx('roar_beast'); cam.shake = Math.max(cam.shake, 9);
      G.hitStop = Math.max(G.hitStop, 0.12);
      if (typeof padRumble === 'function') padRumble(0.7, 0.9, 320);
      for (const e of G.enemies) {
        if (e.dead) continue;
        const dx0 = e.x + e.w / 2 - cx0, dy0 = e.y + e.h / 2 - cy0;
        const dd = Math.hypot(dx0, dy0);
        if (dd > 250) continue;
        e.kbT = 0.45; e.stagT = Math.max(e.stagT || 0, 0.8);
        e.vx += (dx0 / (dd || 1)) * 520; e.vy = -260;
      }
      for (let i = 0; i < 26; i++)
        addPart(cx0 + rnd(-30, 30), cy0 + rnd(-20, 20), rnd(-160, 160), rnd(-180, 60),
          rnd(0.5, 1), chance(0.5) ? '#ffb347' : '#ffe0a8', rnd(2.4, 4), 120, true);
      G.toast(t('oath_fire'));
      return;
    }
    this.cores -= d; this.iT = hasSkill('reflex') ? 1.65 : 1.3; this.healT = 0;
    this.hurtPoseT = 0.3;   // limbs flail for a beat while the knockback carries her
    cam.shake = 9; sfx('hurt');
    if (typeof padRumble === 'function') padRumble(0.85, 0.5, 240);
    G.flash = Math.max(G.flash, 0.4); G.addRing(this.x + this.w / 2, this.y + this.h / 2);
    G.impact = { t: 0.09, t0: 0.09, x: this.x + this.w / 2, y: this.y + this.h / 2 };
    burst(this.x + this.w / 2, this.y + this.h / 2, 14, '#ff5f6d', 260, 0.5, 500, 3, true);
    const kbm = relicHas('ember') ? 0.5 : 1;
    this.vx = (Math.sign(this.x + this.w / 2 - fromX) * 250 || 250) * kbm; this.vy = -240 * kbm;
    if (this.cores <= 0 && hasCrest('nine') && !G.save.usedNine) {
      G.save.usedNine = true; this.cores = 3; this.iT = 2.2;
      sfx('win'); G.toast(t('c_nine'));
      burst(this.x + this.w / 2, this.y + this.h / 2, 26, '#ffd76a', 300, 0.8, 100, 4, true);
      return;
    }
    if (this.cores <= 0) this.die();
  }
  die() {
    if (this.dead) return;
    this.dead = true;
    this.deathAnimT = 1.6;   // the destroyed row plays out while the wreck settles sfx('boom');
    burst(this.x + this.w / 2, this.y + this.h / 2, 40, '#8ff6ff', 340, 0.9, 300, 4, true);
    G.onPlayerDeath();
  }
  // Odyssey hero — real hand-animated character art (CC0, ansimuz), with the
  // code-drawn rig kept as an automatic fallback until the sheets decode.
  // Which authored plate she is in RIGHT NOW.
  //
  // Ordered by what overrides what, and the order is the design: a state her
  // body is PUT INTO (hurt, healing, singing) beats one she chose (running),
  // because the read the player needs is the one she is not in control of.
  // Everything below the airborne test is a ground state, so the test for
  // "is she on the floor" sits in the middle rather than at the top.
  heroState(run) {
    if (this.hurtPoseT > 0) return 'hurt';
    if (this.healT > 0) return 'heal';
    if (this.songT > 0) return 'song';
    if (this.swingVis) {
      // releaseCharged() flags its own swing: the charged blow is a BURST, a
      // different drawing from the third hit of an ordinary combo.
      if (this.swingVis.charged) return 'burst';
      return this.swingVis.combo >= 3 ? 'finisher' : this.swingVis.combo === 2 ? 'claw_2' : 'claw_1';
    }
    if (this.chargeT > 0.05) return 'charge';
    if (this.dashT > 0) return 'dash';
    if (this.wallSlide !== 0 && !this.on) return 'wall_cling';
    if (!this.on) {
      if ((this.boostT || 0) > 0) return 'djump_jet';
      if (this.vy < -140) return 'rise';
      if (this.vy < 140) return 'apex';                 // the hang, both ways through zero
      return 'fall';
    }
    if (this.skidT > 0) return 'skid';
    if (this.landT > 0) return 'land';
    // one core left and standing still: the carriage sags. Moving cancels it —
    // a limp that survives a sprint reads as a bug, not as damage.
    if (this.cores <= 1 && Math.abs(this.vx) < 20) return 'slump';
    if (Math.abs(this.vx) > 12) {
      // THE RUN PAIR, UN-PARKED (§1e). The first fired run was a low feline
      // lunge — the owner: "moving like a cat instead of running like a cute
      // robot" — and the run states borrowed the walk cells while a re-fire
      // waited. The art session's upright re-fire is in the sheet now: torso
      // vertical, head high, one leg reaching and one pushing off, a wind-up
      // toy in a hurry. The walk substitution ends here.
      const k = Math.floor(this.anim * (run ? 10 : 7)) % 2;
      return run ? (k ? 'run_b' : 'run_a') : (k ? 'walk_b' : 'walk_a');
    }
    return 'idle';
  }
  // Draw the authored plate for the current state. Returns false if the sheet
  // has not loaded, so the caller falls back to the procedural body rather than
  // drawing nothing — the same contract drawAtlas() has with the guardians.
  //
  // Facing, squash, lean and the pirouette are ALREADY in the transform by the
  // time this runs (see the c.scale at the top of draw()), so this draws her
  // square-on at the origin and inherits all of it. That does mean a leftward
  // facing mirrors the plate and flips its lit side; the procedural body has
  // always been mirrored the same way, so this matches what shipped rather
  // than introducing a new inconsistency.
  drawRoboPlate(c, run) {
    if (typeof MEDIA_IMG === 'undefined' || !MEDIA_IMG.heroStates) return false;
    const im = MEDIA_IMG.heroStates;
    const cw = im.width / HERO_CELLS, ch = im.height;
    const st = this.heroState(run);
    const col = HERO_CELL[st] || 0;
    const dh = HERO_DH, dw = dh * (cw / ch);
    // grounded cells stand on the cell's floor line; airborne cells are centred
    const dy = HERO_AIR[st] ? -dh * 0.5 - 18 : -dh + HERO_FLOOR;
    c.save();
    // THE ROBOT HURRY. The plates are stills; the machine in them comes from
    // this: a forward lean and a hard little bounce timed to the step flips,
    // so she pistons along like a wind-up toy instead of gliding. Grounded
    // locomotion only — everything else keeps the plate's own pose.
    const moving = this.on && Math.abs(this.vx) > 12 && !this.swingVis
      && this.dashT <= 0 && this.landT <= 0 && this.skidT <= 0
      && this.hurtPoseT <= 0 && this.healT <= 0 && this.chargeT <= 0.05;
    if (moving) {
      const step = Math.abs(Math.sin(this.anim * (run ? 10 : 7) * Math.PI / 2));
      c.rotate(run ? 0.055 : 0.022);
      c.translate(0, -step * (run ? 1.6 : 1.2));
    }
    // REGISTRATION: the two walk plates were fired as independent stills and
    // their heads do not sit at the same x (measured: centers 14.6px apart in
    // the 160px cell). Flipped raw at run cadence that is a strobing head —
    // the owner's "head is over-mobile". These offsets pull each plate so the
    // HEAD holds still and the legs do the moving, which is how a walk reads.
    const reg = HERO_REG[st];
    if (reg) c.translate(reg * dw, 0);
    c.drawImage(im, col * cw, 0, cw, ch, -dw / 2, dy, dw, dh);
    this.drawHeroEyes(c, st, dw, dh, dy);
    c.restore();
    return true;
  }
  // What she is FEELING, which is a different question from what she is doing.
  //
  // A scripted mood always wins (moodSet: dialogue, a pickup, a story beat),
  // then the things being done TO her, then the things she is doing. Combat
  // hardens her face and nothing else does, which is the whole arc in one
  // function: she is a cute maintenance unit until something makes her serious.
  heroMood(st) {
    if (this.moodT > 0 && this.mood) return this.mood;
    if (this.hurtPoseT > 0) return 'hurt';
    if (this.cores <= 1) return 'weary';
    if (this.healT > 0) return 'happy';                 // relief, eyes closed
    if (this.songT > 0) return 'excited';
    if (st === 'burst') return 'angry';                 // the charged blow only
    if (this.chargeT > 0.05) return 'determined';
    if (this.swingVis) return 'determined';
    if ((this.boostT || 0) > 0 || st === 'djump_jet') return 'excited';
    if (G && G.boss && !G.boss.dead) return 'determined';   // a fight is on
    return 'calm';
  }
  // Set a mood for a moment, over the top of everything: moodSet('happy', 1.2)
  moodSet(m, t) { this.mood = m; this.moodT = Math.max(this.moodT || 0, t || 1); }
  // Repaint her eye-lights over the plate's baked pair.
  drawHeroEyes(c, st, dw, dh, dy) {
    const E = HERO_EYE[st]; if (!E) return;
    const M = HERO_MOOD[this.heroMood(st)] || HERO_MOOD.calm;
    const t = this.anim;
    // THE BLINK IS THE CUTENESS. Two lights that never close are a sensor; two
    // that blink are alive. It runs on her own animation clock so it does not
    // tick in lockstep with anything else on screen, and it is suppressed while
    // her eyes are already narrowed — a slit does not blink, it just vanishes.
    const blink = M.sq > 0.6 && ((t * 0.47) % 3.1) < 0.10 ? 0.12 : 1;
    const pulse = M.pu ? 1 + Math.sin(t * M.pu) * 0.16 : 1;
    const px = (nx) => -dw / 2 + nx * dw, py = (ny) => dy + ny * dh;
    const ew = E.ew * dw, eh = E.eh * dh;
    c.save();
    for (const side of [-1, 1]) {
      const ex = px(side < 0 ? E.lx : E.rx), ey = py(side < 0 ? E.ly : E.ry);
      // 1. COVER the baked light with the visor's own dark. Soft-edged, because
      //    a hard patch on a rendered face reads as a sticker — the same lesson
      //    media.js learned about cutting the guardians out.
      const g = c.createRadialGradient(ex, ey, 0, ex, ey, Math.max(ew, eh) * 1.5);
      g.addColorStop(0, 'rgba(14,19,26,1)');
      g.addColorStop(0.62, 'rgba(14,19,26,0.96)');
      g.addColorStop(1, 'rgba(14,19,26,0)');
      c.fillStyle = g;
      c.beginPath(); c.ellipse(ex, ey, ew * 1.6, eh * 1.5, 0, 0, 7); c.fill();
      // 2. DRAW the light she is actually wearing.
      c.save();
      c.translate(ex, ey);
      c.rotate(side < 0 ? -M.tl : M.tl);      // inner corners down = angry, outer = sad
      // the far eye (screen-left when she faces right) carries the asymmetry
      const k = side < 0 ? (M.as == null ? 1 : M.as) : 1;
      const rw = ew * M.ar * k, rh = eh * M.sq * blink * k;
      const lit = 0.55 + 0.45 * Math.min(1.4, M.gl * pulse);
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = 'rgba(' + Math.round(90 * lit) + ',' + Math.round(255 * lit) + ',' + Math.round(232 * lit) + ',1)';
      c.shadowColor = '#37ffd0'; c.shadowBlur = 6 * M.gl * pulse;
      c.beginPath(); c.ellipse(0, 0, Math.max(0.6, rw), Math.max(0.35, rh), 0, 0, 7); c.fill();
      // a white-hot core, because a light with no hotter centre reads as paint
      c.fillStyle = 'rgba(235,255,250,' + (0.55 * lit).toFixed(2) + ')';
      c.beginPath(); c.ellipse(0, -rh * 0.15, rw * 0.45, Math.max(0.3, rh * 0.42), 0, 0, 7); c.fill();
      c.shadowBlur = 0;
      c.restore();
    }
    c.restore();
  }
  drawHeroSprite(c, run, evo) {
    if (typeof MEDIA_IMG === 'undefined' || !MEDIA_IMG.heroIdle || !MEDIA_IMG.heroRun
        || !MEDIA_IMG.heroJump || !MEDIA_IMG.heroAtk) return false;
    // sheet, frame count, cell size (uniform grids measured from the art)
    let key, n, cw, ch, fps, fr;
    if (this.swingVis) {
      key = 'heroAtk'; n = 6; cw = 96; ch = 48;
      const p = clamp(1 - this.swingVis.t / this.swingVis.t0, 0, 0.999);
      fr = Math.floor(p * n);
    } else if (!this.on) {
      key = 'heroJump'; n = 5; cw = 61; ch = 77;
      fr = this.vy < -220 ? 1 : this.vy < 60 ? 2 : this.vy < 420 ? 3 : 4;
    } else if (run) {
      key = 'heroRun'; n = 12; cw = 66; ch = 48; fps = 16;
      fr = Math.floor(this.anim * fps) % n;
    } else {
      key = 'heroIdle'; n = 4; cw = 38; ch = 48; fps = 7;
      fr = Math.floor(this.anim * fps) % n;
    }
    fr = clamp(fr | 0, 0, n - 1);
    const img = MEDIA_IMG[key];
    // draw standing on the feet (local origin), scaled to the play size
    const s = 1.2, dw = cw * s, dh = ch * s;
    c.imageSmoothingEnabled = false;
    // grounded frames sit on the floor; the jump sheet is taller, keep feet aligned
    c.drawImage(img, fr * cw, 0, cw, ch, -dw / 2, -dh + 3, dw, dh);
    c.imageSmoothingEnabled = true;
    if (evo >= 3) {                       // apex halo stays, drawn over the art
      c.strokeStyle = '#c8ffa0'; c.shadowColor = '#c8ffa0'; c.shadowBlur = 9; c.lineWidth = 2;
      c.beginPath(); c.arc(0, -dh + 16, 13, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
      c.shadowBlur = 0;
    }
    return true;
  }
  drawHeroRig(c, P, bob, run, ph, spdK, evo) {
    if (this.drawHeroSprite(c, run, evo)) return;
    const gold = evo >= 3 ? '#e6c56f' : '#c79a4e', goldD = '#8a6f38';
    const crim = '#b23140', crimD = '#7c2430', skin = '#d9a97a', skinD = '#b8895f';
    const b4 = bob * 0.4;
    // --- flowing crimson cloak behind ---
    const cw = Math.sin(this.anim * 5) * (2 + spdK * 4) + (this.on ? 0 : 5);
    c.fillStyle = crimD;
    c.beginPath(); c.moveTo(-3, -30 + bob);
    c.quadraticCurveTo(-16 - spdK * 14, -18 + cw, -14 - spdK * 18, 0 + cw);
    c.quadraticCurveTo(-6, -6, -3, -14 + bob); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,150,120,0.22)'; c.lineWidth = 1.4; c.stroke();
    // --- legs (human, two-segment, bronze greaves + sandals) ---
    const legH = (hipX, phase, front) => {
      const hipY = -15 + bob * 0.3; let footX, footY, lift = 0;
      if (run) { footX = hipX + Math.sin(phase) * 8; lift = Math.max(0, -Math.cos(phase)) * 5; footY = -lift; }
      else if (!this.on) { footX = hipX + 3; footY = -3; }
      else { footX = hipX + 1; footY = 0; }
      const kx = (hipX + footX) / 2 + (front ? 2 : -1), ky = (hipY + footY) / 2;
      c.strokeStyle = front ? skin : skinD; c.lineWidth = 5; c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath(); c.moveTo(hipX, hipY); c.lineTo(kx, ky); c.lineTo(footX, footY - 1); c.stroke();
      c.strokeStyle = front ? gold : goldD; c.lineWidth = 3;
      c.beginPath(); c.moveTo(kx, ky); c.lineTo(footX, footY - 1); c.stroke();
      c.fillStyle = goldD; c.fillRect(footX - 3, footY - 1, 8, 3);
    };
    legH(-5, ph + Math.PI, false); legH(5, ph, true);
    // --- pteruges (leather war-skirt strips) ---
    for (let i = -2; i <= 2; i++) {
      const sway = Math.sin(this.anim * 6 + i) * 1.5 + (run ? Math.sin(ph * 2) * 1 : 0);
      c.fillStyle = i % 2 ? '#8a5a34' : '#9c6a3e';
      c.beginPath(); c.moveTo(i * 4 - 2, -16 + b4); c.lineTo(i * 4 + 2, -16 + b4);
      c.lineTo(i * 4 + 2 + sway, -7); c.lineTo(i * 4 - 2 + sway, -7); c.closePath(); c.fill();
    }
    // --- back arm holding a round hoplite shield (hidden mid-swing) ---
    if (!this.swingVis) {
      c.fillStyle = gold;
      c.beginPath(); c.arc(-9, -19 + b4, 7.5, 0, 7); c.fill();
      c.strokeStyle = goldD; c.lineWidth = 1.5; c.beginPath(); c.arc(-9, -19 + b4, 7.5, 0, 7); c.stroke();
      c.fillStyle = crim; c.beginPath(); c.arc(-9, -19 + b4, 3, 0, 7); c.fill();
      c.fillStyle = goldD; c.beginPath(); c.arc(-9, -19 + b4, 1.2, 0, 7); c.fill();
    }
    // --- torso: crimson tunic under a shaded bronze breastplate ---
    const tg = c.createLinearGradient(0, -30, 0, -13);
    tg.addColorStop(0, crim); tg.addColorStop(1, crimD);
    c.fillStyle = tg; rr(c, -10, -30 + b4, 20, 18, 5); c.fill();
    const bpg = c.createLinearGradient(0, -30, 0, -15);
    bpg.addColorStop(0, '#f0dca0'); bpg.addColorStop(0.5, gold); bpg.addColorStop(1, goldD);
    c.fillStyle = bpg;
    c.beginPath(); c.moveTo(-9, -29 + b4); c.lineTo(9, -29 + b4); c.lineTo(8, -17 + b4);
    c.quadraticCurveTo(0, -13 + b4, -8, -17 + b4); c.closePath(); c.fill();
    c.strokeStyle = goldD; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -27 + b4); c.lineTo(0, -16 + b4); c.stroke();
    c.fillStyle = gold; c.beginPath(); c.arc(-8, -28 + b4, 4, 0, 7); c.arc(8, -28 + b4, 4, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,245,210,0.5)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-8, -28.5 + b4); c.lineTo(8, -28.5 + b4); c.stroke();
    // --- head: skin, helmet dome, nose-guard, flowing plume, an eye (emotion) ---
    const hy = -34 + bob;
    c.fillStyle = skin; c.fillRect(-2, -32 + b4, 6, 4);           // neck
    c.fillStyle = skin; rr(c, -1, hy - 8, 14, 13, 5); c.fill();   // face
    c.fillStyle = '#2a1e14'; c.fillRect(6, hy - 2, 3, 3);          // eye
    c.strokeStyle = '#2a1e14'; c.lineWidth = 1; c.beginPath(); c.moveTo(4.5, hy - 4); c.lineTo(9, hy - 3); c.stroke(); // brow
    c.fillStyle = gold; c.beginPath(); c.arc(6, hy - 3, 9, Math.PI, 0); c.fill(); // helmet dome
    c.fillRect(-3, hy - 4, 18, 3);
    c.fillStyle = goldD; c.fillRect(11, hy - 4, 2, 7);            // nose guard
    const pv = Math.sin(this.anim * 7) * 2 + (run ? Math.sin(ph * 2) * 1.5 : 0);
    c.fillStyle = crim;
    c.beginPath(); c.moveTo(3, hy - 11); c.quadraticCurveTo(-7, hy - 17, -11 - spdK * 4, hy - 7 + pv);
    c.quadraticCurveTo(-4, hy - 11, 3, hy - 8); c.closePath(); c.fill();
    if (evo >= 3) {
      c.strokeStyle = '#c8ffa0'; c.shadowColor = '#c8ffa0'; c.shadowBlur = 8; c.lineWidth = 2;
      c.beginPath(); c.arc(6, hy - 2, 11, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); c.shadowBlur = 0;
    }
    // --- front arm + LIVE SWORD (windup → sweep → follow-through on attack) ---
    let swAng;
    if (this.swingVis) {
      const sv = this.swingVis, p = 1 - sv.t / sv.t0;
      if (sv.combo === 2) swAng = -1.5 + p * 2.7;        // overhead finisher
      else if (sv.combo === 1) swAng = 1.0 - p * 1.9;    // rising cut
      else swAng = -0.9 + p * 1.9;                       // descending cut
    } else {
      swAng = -1.05 + Math.sin(this.anim * 2) * 0.07;    // ready stance, breathing
    }
    const shX = 6, shY = -26 + b4;
    const handX = shX + Math.cos(swAng) * 8, handY = shY + 6 + Math.sin(swAng) * 8;
    c.strokeStyle = skin; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(shX, shY); c.lineTo(handX, handY); c.stroke();
    c.strokeStyle = gold; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo((shX + handX) / 2, (shY + handY) / 2); c.lineTo(handX, handY); c.stroke();
    c.save(); c.translate(handX, handY); c.rotate(swAng + Math.PI / 2);
    c.fillStyle = goldD; c.fillRect(-1.6, -2, 3.2, 6); c.fillRect(-4.5, -2, 9, 2);  // hilt + guard
    const bl = 27, blg = c.createLinearGradient(0, -2, 0, -bl);
    blg.addColorStop(0, '#9aa7b8'); blg.addColorStop(0.5, '#eef3fa'); blg.addColorStop(1, '#ffffff');
    c.fillStyle = blg; c.shadowColor = this.swingVis ? '#ffffff' : 'rgba(0,0,0,0)'; c.shadowBlur = this.swingVis ? 8 : 0;
    c.beginPath(); c.moveTo(-2, -2); c.lineTo(-1.5, -bl + 3); c.lineTo(0, -bl); c.lineTo(1.5, -bl + 3); c.lineTo(2, -2); c.closePath(); c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(-0.4, -4); c.lineTo(0, -bl + 3); c.stroke();
    c.restore();
  }
  draw(c) {
    if (this.dead) return;
    if (this.iT > 0 && Math.floor(this.iT * 18) % 2 === 0) return;
    const P = PAL[G.roomDef.zone];
    for (const tr of this.trail) {
      // dash echoes: each one a whole readable copy of her silhouette that
      // cools from white-hot (freshest) to zone-glow and shrinks as it dies
      const k = tr.t / (tr.t0 || 0.25);
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.24 + k * 0.36;
      c.translate(tr.x + this.w / 2, tr.y + this.h / 2);
      c.scale(tr.face * (0.86 + k * 0.14), 0.86 + k * 0.14);
      c.fillStyle = P.glow;
      rr(c, -14, -7, 28, 19, 9); c.fill();
      c.beginPath(); c.arc(2, -15, 11, 0, 7); c.fill();
      c.beginPath(); c.moveTo(-8, -21); c.lineTo(-4, -32); c.lineTo(1, -22); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(4, -22); c.lineTo(9, -32); c.lineTo(13, -21); c.closePath(); c.fill();
      // white-hot core on the freshest echo — the visor band still burning
      c.globalAlpha = k * k * 0.7;
      c.fillStyle = '#ffffff';
      rr(c, -5, -19, 15, 6, 3); c.fill();
      c.restore(); c.globalAlpha = 1;
    }
    // contact shadow — tightens and darkens as the hero nears the ground
    {
      let gy = this.y + this.h, probe = 0;
      while (probe < 240 && !solidAt(Math.floor((this.x + this.w / 2) / TILE), Math.floor((gy + probe) / TILE))) probe += 8;
      const air = clamp(probe / 200, 0, 1);
      contactShadow(c, this.x + this.w / 2, gy + probe, this.w * (0.6 - air * 0.25), 0.45 * (1 - air * 0.7));
    }
    // where the paws finish this frame, recorded as they are drawn and read back
    // once the body's transform has been popped (see rakeMark / the swing block)
    this._rake = null;
    c.save();
    c.translate(this.x + this.w / 2, this.y + this.h);
    {
      const tfv = this.faceVis == null ? this.face : this.faceVis;
      c.scale((Math.sign(tfv) || this.face) * (0.86 + 0.14 * Math.abs(tfv)), 1);
    }
    const run = this.on && Math.abs(this.vx) > 40 && this.dashT <= 0;
    const sprintK = clamp((Math.abs(this.vx) - 120) / 240, 0, 1);   // 0→1 into a full sprint
    // the joint springs run on render time, not sim time: they smooth what the
    // eye actually receives, so they stay smooth at any frame rate
    {
      const nw = performance.now();
      this.rigDt = this._rigT ? Math.min((nw - this._rigT) / 1000, 0.1) : 1 / 60;
      this._rigT = nw;
    }
    // ninja stride: the faster she moves, the quicker and longer the cycle
    const ph = this.anim * (13 + sprintK * 7);
    const bob = run ? Math.sin(ph * 2) * (1.4 - sprintK * 0.9) : Math.sin(this.anim * 2.4) * 0.9;
    // --- squash & stretch: one signed, volume-conserving deformation ---
    let sy = 1, sx = 1;
    if (this.landT > 0) {
      // landing: deep squash -> overshoot stretch -> settle (damped bounce,
      // pinned at the feet so the dome dips and rebounds)
      const l0 = this.land0 || 0.12, lk = 1 - this.landT / l0;
      const A = l0 > 0.15 ? 0.3 : 0.17;
      // cos crosses zero exactly at lk=1, so the settle never pops
      const w = A * Math.cos(lk * Math.PI * 1.5) * (1 - lk * 0.5);
      sy -= w; sx += w * 0.72;
    }
    if (this.pogoT > 0) {
      // pogo rebound: she stretches tall off the bounce, then settles
      const pk = this.pogoT / 0.18;
      sy += 0.22 * pk * pk; sx -= 0.13 * pk * pk;
    }
    if (this.takeoffT > 0 && this.landT <= 0) {
      // jump: 1-2 frames of anticipation coil, then a launch stretch
      const el = this.takeoff0 - this.takeoffT;
      if (this.takeoffCoil && el < 0.05) { sy -= 0.16; sx += 0.12; }
      else {
        const q = this.takeoffT / Math.max(0.01, this.takeoff0 - (this.takeoffCoil ? 0.05 : 0));
        sy += 0.18 * q; sx -= 0.1 * q;
      }
    }
    // ---- THE THREE POSES THE STATE SHEET CAUGHT MISSING -------------------
    // The full-state audit (tools/statesheet.cjs) put every state next to idle
    // and three of them were the same drawing: the Song, the beat after firing
    // an arm, and standing at one core. Each is a MECHANIC the body ignored.
    // The fixes live here, in the same carriage/rotation stage as every other
    // pose, so they compose with running, landing and the rest instead of
    // fighting them — and tests/hero.cjs now holds each one to the guardians'
    // silhouette law, so none of them can quietly become idle again.
    //
    // THE SONG: she stands INTO it — up on her toes, chest lifted, head back.
    // A note thrown at the sky, which is what the Song is in the fiction.
    const songK = this.songT > 0 ? clamp(this.songT / 0.5, 0, 1) : 0;
    // ARM FIRE: the shot has a beat of recoil. The body rocks back off the
    // firing line and settles as the cooldown runs out, so every arm reads as
    // having KICK even before its projectile is seen.
    const kick = this.armCD > 0 ? clamp(this.armCD / 0.3, 0, 1) : 0;
    // ONE CORE LEFT: she is hurt and it shows between fights — shoulders
    // dropped, carriage low, the run unaffected (a limp that slows the PLAYER
    // is punishing the state twice; this is body language, not a debuff).
    const lowK = (this.cores <= 1 && this.on && !run && this.dashT <= 0
                  && !this.swingVis && this.healT <= 0) ? 1 : 0;
    // AIRBORNE — the find that put this block under a harness: mid-air she
    // measured 0.92 IoU against standing still. A standing picture on a
    // parabola is exactly what NULLFANG's leap was convicted of, and she had
    // been doing it herself all along. The rise stretches her ALONG the jump
    // and tips her back off it; the fall compresses and pitches her INTO it,
    // reading forward the way anything falling with intent does. Blended by
    // vertical speed so the apex passes through neutral instead of popping.
    let airRot = 0;
    // THE BOOST POSE: the back jet is shoving her, so the body stretches hard
    // along the thrust and tips back against it — a rocket, not a dancer.
    if ((this.boostT || 0) > 0) {
      const bk = this.boostT / 0.3;
      sy += 0.20 * bk; sx -= 0.11 * bk;
      airRot = -0.16 * bk;
    } else if (!this.on && this.wallSlide === 0 && this.dashT <= 0 && this.flipT <= 0
        && this.landT <= 0 && this.hurtPoseT <= 0) {
      const vk = clamp(this.vy / 760, -1, 1);
      if (vk < 0) { sy += -vk * 0.13; sx -= -vk * 0.08; }   // the rise: drawn long
      else { sy -= vk * 0.05; sx += vk * 0.04; }            // the fall: gathered
      airRot = vk < 0 ? vk * 0.07 : vk * 0.12;              // back off it, then into it
    }
    const cr = (this.skidT > 0 ? 0.2 : (this.wallSlide !== 0 ? 0.1 : 0))
             + (run ? sprintK * 0.12 : 0)                           // low, coiled sprint carriage
             - songK * 0.08                                        // the Song: drawn UP, not down
             + lowK * 0.11;                                        // one core: sagging carriage
    if (this.wallSlide !== 0) c.translate(2.5, 0);                  // body pressed INTO the wall
    if (kick > 0) c.translate(-2.6 * kick, 0);                      // rocked off the firing line
    c.rotate(this.lean + (this.skidT > 0 ? -0.14 : 0) + (this.wallSlide !== 0 ? 0.1 : 0)
             + (run ? sprintK * 0.3 : 0)                            // pitched forward, chasing the ground
             + (this.hurtPoseT > 0 ? -0.3 * (this.hurtPoseT / 0.3) : 0)  // thrown back, off balance
             + airRot                                       // the leap's own pitch
             - songK * 0.13                                        // head and chest thrown back to sing
             - kick * 0.09                                         // recoil rocks her heels-back
             + lowK * 0.07                                         // one core: hunched forward
             + (this.idleT > 0.9 ? Math.sin(this.idleT * 0.9) * 0.022 : 0)); // idle weight shift
    // THE FRAME THE CUT LIVES IN, captured here and not one line later. Below
    // this point the transform stops describing where she IS and starts
    // describing what her body is DOING to itself: the spiral of the double
    // jump, the landing squash, the evolution scale. A mark left in the air
    // takes part in none of that. Marked here, the cut always hangs on the side
    // she is facing — mid-pirouette the arm may be anywhere, but the swipe is
    // still thrown forward, which is the thing the player is reading.
    // (only while a swing is alive — getTransform allocates, and the loop is
    // meant to stay allocation-light)
    if (this.swingVis) this._rakeM = c.getTransform();
    if (this.flipT > 0) {
      // THE SPIRAL: the double jump is a ninja pirouette about her own
      // VERTICAL axis — head to toe through the middle of the body — not a
      // cartwheel. Two eased twists; the silhouette slims through each
      // profile pass and mirrors on the far side, so the spin reads as a
      // body turning in place, with a whisker of axis wobble for style.
      // IT USED TO SPIN TOO FAST TO SEE. Two full twists inside half a second
      // is eight profile passes, one every four frames, each squeezed to 22%
      // of her width — the eye gets a strobe, not a pirouette, and no amount of
      // extra artwork would have fixed a rotation running faster than the
      // display can show it. One turn now, never narrower than a third of her
      // width, and the smear below fills in the frames the screen cannot.
      const k = 1 - this.flipT / FLIP_DUR;
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const th = e * Math.PI * 2;                  // one full twist
      // MOTION BLUR, which is what "more frames" actually means here: the
      // silhouette is stamped at the phases she passed through between this
      // frame and the last, so the turn reads continuous instead of stepped.
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (let g = 1; g <= 3; g++) {
        const kb = Math.max(0, k - g * 0.055);
        const eb = kb < 0.5 ? 2 * kb * kb : 1 - Math.pow(-2 * kb + 2, 2) / 2;
        const tb = eb * Math.PI * 2, fb = Math.cos(tb);
        c.save();
        c.scale((fb < 0 ? -1 : 1) * Math.max(0.52, Math.abs(fb)), 1);
        c.rotate(Math.sin(tb) * 0.19);
        c.globalAlpha = 0.22 - g * 0.05;
        c.fillStyle = P.glow;
        rr(c, -13, -25, 26, 19, 9); c.fill();                    // body
        c.beginPath(); c.arc(2, -33, 10.5, 0, 7); c.fill();      // head
        c.beginPath(); c.moveTo(-7, -39); c.lineTo(-3, -49); c.lineTo(2, -40); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(5, -40); c.lineTo(9, -49); c.lineTo(13, -39); c.closePath(); c.fill();
        c.restore();
      }
      c.restore();
      c.globalAlpha = 1;
      // SHE FOLDED LIKE PAPER, and a flat scale on x is exactly why: squeezing a
      // drawing to a third of its width does not turn a body, it closes a book.
      // Nothing about the figure got thicker as it turned edge-on, because a
      // sheet has no thickness to show.
      //
      // A real body seen edge-on is still a body — narrower, but not gone, and
      // its EDGE is what you see. So the squeeze stops at 0.52 rather than 0.33
      // (a robot cat has depth: shoulders, a chest, a pack), the figure leans
      // into the turn instead of staying bolt upright, and it lifts slightly at
      // the profile pass the way a spinning thing does when it is not on a
      // spit. Same one turn, same timing — it just has a third dimension now.
      const fx = Math.cos(th);
      const edge = 1 - Math.abs(fx);                 // 0 face-on, 1 edge-on
      c.scale((fx < 0 ? -1 : 1) * Math.max(0.52, Math.abs(fx)), 1 + edge * 0.06);
      c.rotate(Math.sin(th) * 0.19);
      c.translate(0, -edge * 1.6);
    }
    c.scale(sx, sy * (1 - cr));
    // evolution: the frame grows with each power milestone (visual only — hitbox unchanged)
    const evo = typeof evoTier === 'function' ? evoTier() : 0;
    c.scale(1 + evo * 0.07, 1 + evo * 0.07);
    const hero = typeof isHero === 'function' && isHero();
    const spdK = Math.min(1, Math.abs(this.vx) / 360);
    if (evo >= 3) {
      // apex aura — raw power radiating off the body
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.14 + Math.sin(this.anim * 3.2) * 0.05;
      const ag = c.createRadialGradient(0, -16, 6, 0, -16, 42);
      ag.addColorStop(0, hero ? '#ffd98a' : P.glow); ag.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = ag; c.beginPath(); c.arc(0, -16, 42, 0, 7); c.fill();
      c.restore(); c.globalAlpha = 1;
    }
    if (hero) {
      this.drawHeroRig(c, P, bob, run, ph, spdK, evo);
    } else {
    // HER BODY, authored or drawn. drawRoboPlate() puts the authored plate for
    // the current state on screen and returns true; everything guarded below is
    // the procedural body, which now runs only until the sheet loads (and
    // forever, unchanged, if it never does).
    //
    // The guard stops at the thruster jets on purpose. The plates carry her
    // shell, head, ears, visor, limbs AND her scarf — so the procedural scarf
    // must not run over them, or she wears two. The jets are additive light
    // fired from the body rather than part of it (§0.0), they respond to state
    // the art cannot know, and they are the same in both paths, so they sit
    // OUTSIDE the guard and draw either way.
    if (!this.drawRoboPlate(c, run)) {
    if (hero && evo >= 2) {
      // crimson war-cloak flowing behind
      const cwv = Math.sin(this.anim * 5) * (2 + spdK * 4);
      c.fillStyle = evo >= 3 ? '#8a1f2e' : '#7c2430';
      c.beginPath(); c.moveTo(-2, -27 + bob);
      c.quadraticCurveTo(-18 - spdK * 12, -20 + cwv, -16 - spdK * 16, -2 + cwv);
      c.quadraticCurveTo(-8, -8, -4, -12 + bob);
      c.closePath(); c.fill();
      if (!this.swingVis) {
        // round shield slung on the back
        c.fillStyle = evo >= 3 ? '#e6c56f' : '#b8934c';
        c.beginPath(); c.arc(-10, -18 + bob * 0.4, 8, 0, 7); c.fill();
        c.strokeStyle = '#8a6f38'; c.lineWidth = 1.5;
        c.beginPath(); c.arc(-10, -18 + bob * 0.4, 8, 0, 7); c.stroke();
        c.fillStyle = '#8a6f38'; c.beginPath(); c.arc(-10, -18 + bob * 0.4, 2.5, 0, 7); c.fill();
      }
    }
    {
      // scarf — the 4-segment spring chain, rendered as a tapering ribbon.
      // The angles live in update(); here we just walk the chain backward.
      let sx0 = 0, sy0 = -22.5 + bob;   // knotted at the neck, under the big head
      const seg = [[sx0, sy0]];
      for (let i = 0; i < 4; i++) {
        const L = 7 + spdK * 3.5 + (this.on ? 0 : 1.5);
        sx0 -= Math.cos(this.scarfA[i]) * L; sy0 -= Math.sin(this.scarfA[i]) * L;
        seg.push([sx0, sy0]);
      }
      c.lineCap = 'round'; c.lineJoin = 'round';
      // dark fold under, bright cloth over — reads as a folded ribbon
      c.strokeStyle = '#b91c1c';
      c.beginPath(); c.moveTo(seg[0][0], seg[0][1] + 2.2);
      for (let i = 1; i <= 4; i++) c.lineTo(seg[i][0], seg[i][1] + 2.2 - i * 0.3);
      c.lineWidth = 4.6; c.stroke();
      c.strokeStyle = '#e63946';
      c.beginPath(); c.moveTo(seg[0][0], seg[0][1]);
      for (let i = 1; i <= 4; i++) c.lineTo(seg[i][0], seg[i][1]);
      c.lineWidth = 3.6; c.stroke();
      // split tip — the scarf ends in two tails that flutter apart
      c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(seg[3][0], seg[3][1]);
      c.lineTo(seg[4][0] - 1, seg[4][1] + 4 + Math.sin(this.anim * 11) * 2); c.stroke();
    }
    if (!hero) {
      // tail — energy conduit on the 3-segment spring chain: it lags a turn,
      // streams back at a sprint and flags upward in a fall
      let tx0 = -11, ty0 = -10;
      const tp = [[tx0, ty0]];
      for (let i = 0; i < 3; i++) {
        const L = 8.5 - i * 0.5;
        tx0 -= Math.cos(this.tailA[i]) * L; ty0 -= Math.sin(this.tailA[i]) * L;
        tp.push([tx0, ty0]);
      }
      c.strokeStyle = '#cfd8e6'; c.lineWidth = 3.5; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(tp[0][0], tp[0][1]);
      for (let i = 1; i <= 3; i++) c.lineTo(tp[i][0], tp[i][1]);
      c.stroke();
      c.strokeStyle = P.glow; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(tp[0][0] - 1.5, tp[0][1] - 2.5);
      for (let i = 1; i <= 3; i++) c.lineTo(tp[i][0] + 0.5, tp[i][1] + 1);
      c.stroke();
      c.fillStyle = P.glow; c.beginPath(); c.arc(tp[3][0], tp[3][1], 2.6, 0, 7); c.fill();
    }
    // segmented digitigrade legs with glowing joints
    const leg = (hipX, phase, front) => {
      const hipY = -9 + bob * 0.3;
      let fx, fy, lift = 0, knee = 0;
      if (this.hurtPoseT > 0) {
        // knockback flail: both legs thrown forward, kicking at nothing
        fx = hipX + (front ? 7 : 4.5) + Math.sin(this.anim * 34 + (front ? 0 : 2.1)) * 2.5;
        fy = -6 - Math.max(0, Math.sin(this.anim * 30 + (front ? 1.2 : 3))) * 3;
      } else if (run) {
        // stride reaches further and the knee drives higher the faster she goes
        const reach = 7.5 + sprintK * 7;
        fx = hipX + Math.sin(phase) * reach;
        lift = Math.max(0, -Math.cos(phase)) * (4.5 + sprintK * 7);
        fy = -lift;
        knee = Math.max(0, -Math.cos(phase)) * sprintK * 5;   // tucked knee on recovery
      } else if (!this.on) { fx = hipX + 2.5; fy = -4; }
      else { fx = hipX + 1; fy = 0; }
      // the foot is springed too, so leaving the ground, landing, and dropping
      // out of a run all BEND the leg through the change instead of cutting to
      // the new pose. Stiff enough that a running stride still lands on beat.
      const lk = front ? 'legF' : 'legB';
      fx = rigStep(this, lk + 'x', fx, run ? 2600 : 520, this.rigDt);
      fy = rigStep(this, lk + 'y', fy, run ? 2600 : 520, this.rigDt);
      const kx = (hipX + fx) / 2 - 3.5 - lift * 0.3 + knee, ky = (hipY + fy) / 2 - 1 - knee * 0.5;
      // short, stubby limbs — spec §1.1: chubby means the legs stay little
      c.strokeStyle = front ? '#aab6c6' : '#7f8b9c'; c.lineWidth = 4.2; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(hipX, hipY); c.lineTo(kx, ky); c.lineTo(fx, fy - 1); c.stroke();
      c.fillStyle = front ? '#cfd8e6' : '#93a0b2';
      // the foot points on push-off instead of staying flat
      c.save(); c.translate(fx, fy - 1); c.rotate(run ? Math.cos(phase) * 0.5 * sprintK : 0);
      c.fillRect(-3, -1.2, 7, 3.2); c.restore();
      c.fillStyle = P.glow;
      c.beginPath(); c.arc(hipX, hipY, 1.9, 0, 7); c.arc(kx, ky, 1.5, 0, 7); c.fill();
      // dust kicks off the back foot at full tilt
      if (run && sprintK > 0.4 && front && Math.cos(phase) > 0.85 && chance(0.5))
        addPart(this.x + this.w / 2 - this.face * 8, this.y + this.h - 1,
                -this.face * rnd(50, 130), rnd(-60, -14), 0.32, '#9fb8c8', 2.4, 500);
    };
    // Rear arm. It used to appear the instant she crossed into a sprint and
    // vanish the instant she dropped out of one — a whole limb popping in and
    // out of the silhouette. It is always there now, and it SWINGS between
    // tucked and trailing, so the ninja-run builds instead of switching on.
    {
      const trail = clamp((sprintK - 0.1) / 0.6, 0, 1);
      const bTgt = (run ? 1.25 : 1.5) + trail * 1.6 - Math.sin(ph) * (0.1 + trail * 0.16);
      const bAng = rigAng(this, 'armB', bTgt, 200, this.rigDt);
      // it has to reach PAST the back of the torso to be seen at all — a
      // trailing arm that stops inside the silhouette is a trailing arm nobody
      // ever saw. At rest it stays short and the body hides it, which is right
      // for a side view; the sprint is what swings it out.
      const bLen = rigStep(this, 'armBL', 10 + trail * 6, 180, this.rigDt);
      const bx2 = -9, by2 = -19 + bob * 0.4;
      const bhx = bx2 + Math.cos(bAng) * bLen, bhy = by2 + Math.sin(bAng) * bLen;
      const bEl = rigIK(bx2, by2, bhx, bhy, Math.max(5.6, bLen * 0.58), Math.max(5.6, bLen * 0.58), -1);
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = 'rgba(32,41,54,0.85)'; c.lineWidth = 4.6;
      c.beginPath(); c.moveTo(bx2, by2); c.lineTo(bEl.x, bEl.y); c.lineTo(bhx, bhy); c.stroke();
      c.strokeStyle = '#6d7a8c'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(bx2, by2); c.lineTo(bEl.x, bEl.y); c.lineTo(bhx, bhy); c.stroke();
      c.fillStyle = 'rgba(32,41,54,0.85)'; c.beginPath(); c.ellipse(bhx, bhy, 3.1, 2.7, 0, 0, 7); c.fill();
      c.fillStyle = '#8d9aac'; c.beginPath(); c.ellipse(bhx, bhy, 2.3, 1.9, 0, 0, 7); c.fill();
    }
    // speed smear behind her at full sprint
    if (run && sprintK > 0.5) {
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.1 * sprintK;
      c.fillStyle = P.glow;
      for (let k = 1; k <= 2; k++) rr(c, -13 - k * 7, -24 + bob * 0.4, 26, 20, 7), c.fill();
      c.restore(); c.globalAlpha = 1;
    }
    leg(-7, ph + Math.PI, false); leg(6, ph, true);
    // EMPOWERED halo — violet Feral Claws (cat) / golden Wrath of Olympus (hero)
    if (this.clawT > 0) {
      const divine = hero;
      c.save(); c.globalCompositeOperation = 'lighter';
      const pulse = 0.7 + Math.sin(this.anim * 7) * 0.3;
      const fade = Math.min(1, this.clawT / 1.2);              // dims as it expires
      const hg = c.createRadialGradient(0, -16, 4, 0, -16, 40);
      if (divine) {
        hg.addColorStop(0, 'rgba(255,225,140,0.5)');
        hg.addColorStop(0.5, 'rgba(255,180,60,0.3)');
        hg.addColorStop(1, 'rgba(255,180,60,0)');
      } else {
        hg.addColorStop(0, 'rgba(160,80,255,0.45)');
        hg.addColorStop(0.5, 'rgba(122,31,208,0.3)');
        hg.addColorStop(1, 'rgba(122,31,208,0)');
      }
      c.globalAlpha = (0.5 + pulse * 0.4) * fade;
      c.fillStyle = hg; c.beginPath(); c.arc(0, -16, 40, 0, 7); c.fill();
      // orbiting halo ring — a crown of light / a laurel of divine favour
      c.globalAlpha = (0.45 + pulse * 0.35) * fade;
      c.strokeStyle = divine ? '#ffd76a' : '#e0a0ff'; c.lineWidth = 2.2;
      c.beginPath(); c.ellipse(0, -42, 16, 5, Math.sin(this.anim * 1.6) * 0.25, 0, 7); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = 1;
      c.beginPath(); c.ellipse(0, -42, 16, 5, Math.sin(this.anim * 1.6) * 0.25, 0.6, 3.1); c.stroke();
      if (divine) {
        // static arcs crawling over the champion — the storm clings to him
        c.globalAlpha = fade * (0.5 + Math.sin(this.anim * 19) * 0.4);
        c.strokeStyle = '#fff6c0'; c.lineWidth = 1.3; c.lineCap = 'round';
        for (let k = 0; k < 2; k++) {
          const sx2 = rnd(-11, 11), sy2 = rnd(-32, -6);
          c.beginPath(); c.moveTo(sx2, sy2);
          c.lineTo(sx2 + rnd(-6, 6), sy2 + rnd(5, 11));
          c.lineTo(sx2 + rnd(-8, 8), sy2 + rnd(12, 20));
          c.stroke();
        }
      }
      c.restore(); c.globalAlpha = 1;
    }
    // volt-blade sheathed on the back (hidden mid-swing — it's in the paw)
    if (!this.swingVis && this.clawT <= 0) {
      c.save(); c.translate(-11, -19 + bob * 0.4); c.rotate(-1.0);
      c.fillStyle = '#8892a2'; c.fillRect(-2, 0, 4, 8);
      c.fillStyle = '#5c6678'; c.fillRect(-4.5, -1, 9, 3);
      const bg = c.createLinearGradient(0, -26, 0, 0);
      bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, P.glow);
      c.fillStyle = bg; c.shadowColor = P.glow; c.shadowBlur = 9;
      c.beginPath(); c.moveTo(-1.8, -2); c.lineTo(-1.8, -22); c.lineTo(0, -27); c.lineTo(1.8, -22); c.lineTo(1.8, -2); c.closePath(); c.fill();
      c.shadowBlur = 0; c.restore();
      if (!hero && evo >= 2) {
        // second volt-blade — crossed sheaths, war-ready
        c.save(); c.translate(-5, -18 + bob * 0.4); c.rotate(-1.35);
        c.fillStyle = '#8892a2'; c.fillRect(-1.6, 0, 3.2, 6);
        c.fillStyle = '#5c6678'; c.fillRect(-3.5, -1, 7, 2.6);
        c.fillStyle = evo >= 3 ? '#ffd76a' : P.glow; c.shadowColor = c.fillStyle; c.shadowBlur = 7;
        c.beginPath(); c.moveTo(-1.4, -2); c.lineTo(-1.4, -17); c.lineTo(0, -21); c.lineTo(1.4, -17); c.lineTo(1.4, -2); c.closePath(); c.fill();
        c.shadowBlur = 0; c.restore();
      }
    }
    // ---- THE FAR FORELEG -------------------------------------------------
    // SHE HAD ONE ARM. The rear arm was only ever drawn while it was throwing
    // the second beat of a combo — every other frame of the game, standing,
    // walking, running, jumping, she was a one-armed cat, and at the size she
    // is played that does not read as "the far arm is hidden behind her", it
    // reads as a missing limb.
    //
    // It lives HERE, before the shell, because that is what makes it the far
    // arm: drawn behind the body and darker, so the near arm crossing the
    // belly still wins the eye. Its swing is the near arm's in antiphase — the
    // opposite foreleg, which is what a walk actually is — and it is deliberately
    // held closer to the body, since a rear limb that reaches as far forward as
    // the front one stops reading as depth and starts reading as a second cat.
    //
    // AND IT HAS TO CLEAR THE SILHOUETTE. Mounted on the near side and aimed
    // forward like the front arm, it is drawn every frame and hidden by the
    // belly in all of them — which is exactly the bug it was added to fix,
    // committed twice. It is mounted on the BACK edge of the chest and hangs
    // down the far side, so the paw shows past the body's outline: a limb you
    // can see is a limb, and one you cannot is nothing.
    if (!hero) {
      // SHE IS DRAWN ALMOST FRONT-ON — one visor, two eyes, both ears — so the
      // far arm is not a limb hiding behind a profile, it is the other arm, and
      // it belongs on the other shoulder doing the mirror of what this one does.
      // Hung down the back edge instead, it spent every frame inside the belly:
      // present in the code, absent from the screen, which is the same bug.
      const fsX = -10, fsY = -19.5 + bob * 0.4;
      const MIR = Math.PI;                                  // pi - a mirrors an angle
      let fAng, fReach;
      if (this.hurtPoseT > 0) {
        fAng = MIR + 1.9 - Math.sin(this.anim * 30) * 0.75; fReach = 11.5;
      } else if (this.wallSlide !== 0) {
        fAng = MIR + 0.55; fReach = 11;                     // reaching away from the wall
      } else if (run && sprintK > 0.25) {
        fAng = MIR - 1.35 - sprintK * 0.5 + Math.sin(ph) * 0.12;
        fReach = 13 + sprintK * 3;
      } else if (!this.onGround) {
        fAng = MIR - 0.62; fReach = 11.5;                   // tucked in the air
      } else {
        const sw = run ? Math.sin(ph) : 0;                  // ANTIPHASE to the near arm
        fAng = MIR - 0.72 - sw * 0.26 - Math.sin(this.anim * 2 + 1.1) * 0.05;
        fReach = 12.6 + sw * 1.1;
      }
      fAng = rigAng(this, 'armFA', fAng, 260, this.rigDt);
      fReach = rigStep(this, 'armFR', fReach, 200, this.rigDt);
      const fhx = fsX + Math.cos(fAng) * fReach, fhy = fsY + Math.sin(fAng) * fReach;
      const fbone = Math.max(6.6, fReach * 0.56);
      const fel = rigIK(fsX, fsY, fhx, fhy, fbone, fbone, -1);
      armBones(c, fsX, fsY, fel.x, fel.y, fhx, fhy, true, null);
      armPaw(c, fhx, fhy, fAng, 1, true);
    }
    // body — the CHUBBY ceramic shell (spec §1.1): rounded, bottom-heavy,
    // wider at the hips than the chest. A pear, not a box.
    const by0 = -24 + bob * 0.4;
    // WHY SHE READ FLAT. This gradient ran straight down — top-to-bottom, its
    // axis CONCENTRIC with the outline — which is pillow shading: light bleeds
    // in evenly from the edge and the form has no direction, so it reads as a
    // sticker of a body rather than a body. Every value also sat in the light
    // half (white, bone, pale grey, with the dark stop only touching the last
    // pixel row), and a shape with no shadow side cannot be round.
    //
    // The light is committed now: upper-left, front-side-top, the same key that
    // lights the guardians. The gradient axis runs DIAGONALLY ACROSS the shell,
    // so there is a lit cheek and a shaded cheek, and it carries a real ramp —
    // hue-shifted rather than mixed with grey: warm bone in the light, cool
    // violet-slate in the shadow, because a shadow takes its colour from the
    // sky and a highlight from the lamp.
    const grad = c.createLinearGradient(-13, by0 - 2, 13, by0 + 19);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.26, '#f6f2e6');      // warm light
    grad.addColorStop(0.52, '#cbd0da');      // the turn
    grad.addColorStop(0.78, '#8b93ab');      // terminator
    grad.addColorStop(1, '#5d6480');         // cool core shadow
    c.fillStyle = grad;
    const belly = () => {
      c.beginPath();
      c.moveTo(-10, by0 + 1);
      c.quadraticCurveTo(-17, by0 + 9, -14.5, by0 + 16);
      c.quadraticCurveTo(-8, by0 + 20.5, 0, by0 + 20.5);
      c.quadraticCurveTo(8, by0 + 20.5, 14.5, by0 + 16);
      c.quadraticCurveTo(17, by0 + 9, 10, by0 + 1);
      c.quadraticCurveTo(0, by0 - 2.5, -10, by0 + 1);
      c.closePath();
    };
    belly(); c.fill();
    // Everything below is clipped to the shell, so shading stays ON the form.
    c.save(); belly(); c.clip();
    // CORE SHADOW. The darkest band on a round object is not its edge — it is
    // just inside the edge on the shaded side, because the very rim picks up
    // bounce. Without this a gradient still reads as a disc; with it the shell
    // turns away from you.
    const core = c.createRadialGradient(-5, by0 + 6, 3, -1, by0 + 10, 24);
    core.addColorStop(0, 'rgba(60,70,95,0)');
    core.addColorStop(0.62, 'rgba(58,68,92,0)');
    core.addColorStop(0.88, 'rgba(52,60,84,0.5)');
    core.addColorStop(1, 'rgba(70,80,104,0.22)');   // bounce lifts the last rim
    c.fillStyle = core; c.fillRect(-20, by0 - 4, 40, 28);
    // ambient occlusion pooling under the round belly
    const ao2 = c.createLinearGradient(0, by0 + 10, 0, by0 + 21);
    ao2.addColorStop(0, 'rgba(60,75,95,0)'); ao2.addColorStop(1, 'rgba(45,58,75,0.5)');
    c.fillStyle = ao2; c.fillRect(-20, by0 - 4, 40, 28);
    // CAST SHADOW FROM THE HEAD. The single strongest cue that two parts are at
    // different depths, and it was missing entirely — the head simply sat in
    // front of the chest touching nothing. A big round head above a chest puts
    // a soft crescent across the top of it, offset to the shadow side.
    const hcast = c.createRadialGradient(3, by0 - 8, 4, 3, by0 - 6, 20);
    hcast.addColorStop(0, 'rgba(40,48,70,0.5)');
    hcast.addColorStop(0.7, 'rgba(40,48,70,0.22)');
    hcast.addColorStop(1, 'rgba(40,48,70,0)');
    c.fillStyle = hcast; c.fillRect(-20, by0 - 4, 40, 20);
    c.restore();
    // SPECULAR, SEGMENTED. A rim stroked around the whole outline is the glass
    // dome error — it reads as a transparent bubble. This is a short arc on the
    // lit side only, fading to nothing at both ends.
    const spec = c.createLinearGradient(-14, by0 + 2, -6, by0 + 14);
    spec.addColorStop(0, 'rgba(255,255,255,0)');
    spec.addColorStop(0.42, 'rgba(255,255,255,0.92)');
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    c.strokeStyle = spec; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-8, by0 + 1.5); c.quadraticCurveTo(-14, by0 + 4, -14.5, by0 + 12); c.stroke();
    // and a COOL BACK-RIM on the shadow side, which is what actually lifts her
    // off a dark background — the guardians all have one and she had none
    const brim = c.createLinearGradient(9, by0 + 3, 15, by0 + 15);
    brim.addColorStop(0, 'rgba(150,205,255,0)');
    brim.addColorStop(0.45, 'rgba(150,205,255,0.5)');
    brim.addColorStop(1, 'rgba(150,205,255,0)');
    c.strokeStyle = brim; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(10, by0 + 1.5); c.quadraticCurveTo(16.4, by0 + 5, 14.6, by0 + 15); c.stroke();
    c.strokeStyle = 'rgba(74,86,106,0.9)'; c.lineWidth = 1.2; belly(); c.stroke();
    // evolution gear on the torso
    if (!hero && evo >= 1) {
      // shoulder pauldron riding the back of the shell
      c.fillStyle = evo >= 3 ? '#4a5668' : '#68758a';
      rr(c, -16, -25 + bob * 0.4, 11, 6, 3); c.fill();
      c.strokeStyle = evo >= 3 ? '#ffd76a' : '#93a0b2'; c.lineWidth = 1;
      rr(c, -16, -25 + bob * 0.4, 11, 6, 3); c.stroke();
    }
    if (!hero && evo >= 2) {
      // armored belly plate
      c.fillStyle = 'rgba(90,104,124,0.85)';
      rr(c, -10, -20 + bob * 0.4, 14, 8, 4); c.fill();
      c.strokeStyle = evo >= 3 ? '#ffd76a' : 'rgba(150,165,185,0.8)'; c.lineWidth = 1;
      rr(c, -10, -20 + bob * 0.4, 14, 8, 4); c.stroke();
    }
    if (hero && evo >= 1) {
      // hammered bronze breastplate (gold at apex)
      c.fillStyle = evo >= 3 ? '#e6c56f' : '#b8934c';
      rr(c, -11, -23 + bob * 0.4, 21, 12, 5); c.fill();
      c.strokeStyle = '#8a6f38'; c.lineWidth = 1;
      rr(c, -11, -23 + bob * 0.4, 21, 12, 5); c.stroke();
      c.beginPath(); c.moveTo(-1, -21 + bob * 0.4); c.lineTo(-1, -13 + bob * 0.4); c.stroke();
    }
    // chest light + gold power socket (spec: upgrade sockets are gold)
    c.fillStyle = P.glow; c.shadowColor = P.glow; c.shadowBlur = 8;
    c.beginPath(); c.arc(7, -15 + bob * 0.4, 2.6, 0, 7); c.fill(); c.shadowBlur = 0;
    c.fillStyle = '#ffd76a'; c.shadowColor = '#ffd76a'; c.shadowBlur = 5;
    c.beginPath(); c.arc(-11.5, -18 + bob * 0.4, 1.8, 0, 7); c.fill(); c.shadowBlur = 0;
    c.strokeStyle = '#8a6f38'; c.lineWidth = 0.8;
    c.beginPath(); c.arc(-11.5, -18 + bob * 0.4, 2.6, 0, 7); c.stroke();
    // head — the OVERSIZED dome (spec §1.1: head is 40% of her): this is
    // what makes the silhouette read CAT at 36px. In the stride it bobs in
    // COUNTER-PHASE to the body — the dome stays level-ish while the hips pump
    const hy = -30 + (run ? -bob * 0.6 : bob);
    // The dome, lit by the same lamp as the shell — upper-left, gradient axis
    // running diagonally ACROSS the form. Straight down the outline was the
    // pillow-shading tell, and it made the biggest, roundest part of her the
    // flattest thing on screen.
    const hgd = c.createLinearGradient(-11, hy - 12, 14, hy + 8);
    hgd.addColorStop(0, '#ffffff');
    hgd.addColorStop(0.3, '#f4f0e4');
    hgd.addColorStop(0.58, '#cdd2dc');
    hgd.addColorStop(0.82, '#8f97ad');
    hgd.addColorStop(1, '#646b86');
    c.fillStyle = hgd;
    const dome = () => rr(c, -12, hy - 12, 27, 21, 10);
    dome(); c.fill();
    c.save(); dome(); c.clip();
    // core shadow inside the lower-right edge, with the rim lifting again on
    // bounce — the thing that separates a sphere from a disc
    const hcore = c.createRadialGradient(-4, hy - 5, 3, 1, hy - 1, 22);
    hcore.addColorStop(0, 'rgba(60,70,95,0)');
    hcore.addColorStop(0.6, 'rgba(58,68,92,0)');
    hcore.addColorStop(0.9, 'rgba(50,58,82,0.52)');
    hcore.addColorStop(1, 'rgba(74,84,110,0.2)');
    c.fillStyle = hcore; c.fillRect(-14, hy - 14, 32, 26);
    // THE EARS CAST ONTO THE SKULL. Two roots, offset to the shadow side, and
    // suddenly the ears are standing ON the head rather than stuck behind it.
    if (!hero) {
      c.fillStyle = 'rgba(46,54,78,0.34)';
      c.beginPath(); c.ellipse(-4.5, hy - 9.5, 5.2, 3.4, -0.5, 0, 7); c.fill();
      c.beginPath(); c.ellipse(9.5, hy - 9.5, 5.2, 3.4, 0.5, 0, 7); c.fill();
    }
    // cheek/jaw shadow — the underside of the dome turning away
    const jaw = c.createLinearGradient(0, hy + 1, 0, hy + 9);
    jaw.addColorStop(0, 'rgba(70,88,110,0)'); jaw.addColorStop(1, 'rgba(58,72,98,0.5)');
    c.fillStyle = jaw; c.fillRect(-14, hy, 32, 12);
    c.restore();
    c.strokeStyle = 'rgba(74,86,106,0.9)'; c.lineWidth = 1.2; dome(); c.stroke();
    // top specular, kept SHORT and fading at both ends — a highlight that runs
    // the whole width is a glass dome, not a painted shell
    const hspec = c.createLinearGradient(-7, hy - 11, 12, hy - 10);
    hspec.addColorStop(0, 'rgba(255,255,255,0)');
    hspec.addColorStop(0.35, 'rgba(255,255,255,0.95)');
    hspec.addColorStop(1, 'rgba(255,255,255,0)');
    c.strokeStyle = hspec; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(-6, hy - 10.4); c.quadraticCurveTo(4, hy - 11.6, 11, hy - 10); c.stroke();
    // cool back-rim down the shadow edge of the skull
    const hrim = c.createLinearGradient(13, hy - 8, 15, hy + 5);
    hrim.addColorStop(0, 'rgba(150,205,255,0)');
    hrim.addColorStop(0.45, 'rgba(150,205,255,0.55)');
    hrim.addColorStop(1, 'rgba(150,205,255,0)');
    c.strokeStyle = hrim; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(14.4, hy - 8); c.quadraticCurveTo(15.6, hy - 2, 12.4, hy + 6); c.stroke();
    if (hero) {
      // bronze helmet with crimson crest (gold at apex)
      c.fillStyle = evo >= 3 ? '#e6c56f' : '#b8934c';
      c.beginPath(); c.arc(6, hy - 6, 11, Math.PI, 0); c.fill();
      c.fillRect(-5, hy - 7, 22, 3);
      c.strokeStyle = '#e63946'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.arc(4, hy - 8, 13, Math.PI * 1.15, Math.PI * 1.8); c.stroke();
      if (evo >= 3) {
        // divine laurel glow
        c.strokeStyle = '#c8ffa0'; c.shadowColor = '#c8ffa0'; c.shadowBlur = 8; c.lineWidth = 2.5;
        c.beginPath(); c.arc(6, hy - 5, 12.5, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
        c.shadowBlur = 0;
      }
    } else {
      // antenna ears — one of the three features that must read at 36px:
      // tall, set on top of the dome, cyan sensor inners. The TIPS carry
      // inertia: swept back at a run, thrown up in a fall — plus the idle
      // twitch, one ear at a time on its randomized timer
      const eT = this.earTwitchT > 0 ? Math.sin(this.earTwitchT * 34) * this.earTwitchT * 8.5 : 0;
      const eLx = this.earL || 0, eLy = clamp(-this.vy * 0.004, -3, 3);
      const lTx = eLx + (this.earTwitchSide < 0 ? eT : 0);
      const rTx = eLx + (this.earTwitchSide > 0 ? eT : 0);
      // AN EAR IS NOT A TRIANGLE. These were three straight lines each, filled
      // flat, with a flat triangle of cyan inside — raw primitives at their
      // default orientation, which is the exact signature of programmer art
      // and the flattest thing left on her once the dome was lit. A real ear
      // curves INWARD along its outer edge and cups toward the head; a
      // triangle never does either.
      //
      // Each ear is now a path with a concave outer edge and a rounded tip,
      // shaded by the same upper-left lamp as the rest of her — lit on the
      // outer face, dropping into shadow toward the cup.
      // ONE EAR, STATED PLAINLY. Written with sign arithmetic first and got
      // knobs, spikes and splayed bulges out of it three times running — the
      // control points are easier to reason about named than mirrored.
      //   bo = base outer (against the skull)   bi = base inner
      //   tip = where it points, carrying the twitch and the fall-inertia
      // The outer edge bows INWARD on its way up, which is the one thing a
      // triangle cannot do and the reason ears drawn as triangles read as
      // cardboard.
      const earPath = (bo, bi, tipX, co, ci) => {
        const ty = hy - 21.5 + eLy;
        c.beginPath();
        c.moveTo(bo, hy - 8);
        c.quadraticCurveTo(co, hy - 15.5, tipX, ty);          // outer, concave
        c.quadraticCurveTo(ci, hy - 14.5, bi, hy - 9.6);      // inner, back to the skull
        c.quadraticCurveTo((bo + bi) / 2, hy - 7.6, bo, hy - 8);
        c.closePath();
      };
      const EARS = [
        { bo: -11.5, bi: -1.5, tip: -6.5 + lTx, co: -11.2, ci: -3.4, gx: -12, gy: 0 },
        { bo: 15.5, bi: 5.5, tip: 10.5 + rTx, co: 15.2, ci: 7.4, gx: 16, gy: 4 },
      ];
      for (const E of EARS) {
        const eg = c.createLinearGradient(E.gx, hy - 20, E.bi, hy - 8);
        eg.addColorStop(0, '#ffffff');
        eg.addColorStop(0.4, '#e6e8ec');
        eg.addColorStop(0.76, '#a6aebe');
        eg.addColorStop(1, '#79839a');
        c.fillStyle = eg; earPath(E.bo, E.bi, E.tip, E.co, E.ci); c.fill();
        // the cup — the inner face turns away from the lamp hardest
        c.save(); earPath(E.bo, E.bi, E.tip, E.co, E.ci); c.clip();
        const cup = c.createLinearGradient(E.bi, hy - 9, E.tip, hy - 19);
        cup.addColorStop(0, 'rgba(56,66,90,0.5)'); cup.addColorStop(1, 'rgba(56,66,90,0)');
        c.fillStyle = cup; c.fillRect(-16, hy - 26, 36, 22);
        c.restore();
        c.strokeStyle = 'rgba(120,131,150,0.8)'; c.lineWidth = 0.8;
        earPath(E.bo, E.bi, E.tip, E.co, E.ci); c.stroke();
      }
      // the sensor inside each ear: a lit membrane, brightest at the base where
      // the light in it comes from, not a flat cyan wedge
      const sens = (ax, tx2, bx2, ty) => {
        const sg = c.createLinearGradient(0, ty, 0, hy - 9.5);
        sg.addColorStop(0, 'rgba(255,255,255,0.5)');
        sg.addColorStop(0.45, P.glow);
        sg.addColorStop(1, 'rgba(20,60,70,0.55)');
        c.fillStyle = sg;
        c.beginPath(); c.moveTo(ax, hy - 9.5);
        c.quadraticCurveTo((ax + tx2) / 2, hy - 14, tx2, ty);
        c.quadraticCurveTo((tx2 + bx2) / 2, hy - 13.5, bx2, hy - 10.5);
        c.closePath(); c.fill();
      };
      c.globalAlpha = 0.85;
      sens(-9, -6.4 + lTx * 0.72, -3, hy - 17 + eLy * 0.72);
      sens(12.6, 9.6 + rTx * 0.72, 6.4, hy - 17 + eLy * 0.72);
      c.globalAlpha = 1;
      if (evo >= 3) {
        // apex antennae with glowing tips
        c.strokeStyle = '#ffd76a'; c.lineWidth = 1.6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-6, hy - 20); c.lineTo(-9, hy - 27); c.moveTo(10, hy - 20); c.lineTo(13, hy - 27); c.stroke();
        c.fillStyle = '#ffd76a'; c.shadowColor = '#ffd76a'; c.shadowBlur = 6;
        c.beginPath(); c.arc(-9, hy - 27, 1.6, 0, 7); c.arc(13, hy - 27, 1.6, 0, 7); c.fill();
        c.shadowBlur = 0;
      }
    }
    // THE VISOR — and this was the flattest thing on her, which matters more
    // than anything else on the model because it is where the eye goes.
    //
    // It was a black capsule with two flat rectangles laid on top: features
    // sitting ON the face as separate marks, the emoji-face error. A visor is
    // a LENS SET INTO A SOCKET, and three things say so — the socket is cut
    // into the skull and shades its own upper lip, the eyes glow from BEHIND
    // the glass rather than being painted on it, and the glass carries a
    // reflection of the room that the eyes do not move with.
    const vis = () => rr(c, -8, hy - 7, 22, 10, 5);
    c.fillStyle = hero ? '#2a1e10' : '#0a1420'; vis(); c.fill();
    c.save(); vis(); c.clip();
    // the socket is RECESSED: the skull above it casts down into the well
    const well = c.createLinearGradient(0, hy - 7, 0, hy - 1);
    well.addColorStop(0, 'rgba(0,0,0,0.75)'); well.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = well; c.fillRect(-9, hy - 8, 24, 8);
    // eye blocks slide inside the band when she glances around while idle
    const lk = clamp(this.lookX || 0, -2.4, 2.4);
    const eyeCol = this.healT > 0 ? '#aef7d8' : P.glow;
    // behind the glass: a soft bloom pool, then the hard element inside it, so
    // the light has somewhere to come FROM
    c.globalCompositeOperation = 'lighter';
    for (const ex of [-1.75 + lk, 8.25 + lk]) {
      const pool = c.createRadialGradient(ex, hy - 2, 0.5, ex, hy - 2, 7);
      pool.addColorStop(0, eyeCol); pool.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = 0.5; c.fillStyle = pool;
      c.beginPath(); c.arc(ex, hy - 2, 7, 0, 7); c.fill();
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.fillStyle = eyeCol; c.shadowColor = eyeCol; c.shadowBlur = 8;
    rr(c, -5 + lk, hy - 4.8, 6.5, 5.6, 1.6); c.fill();
    rr(c, 5 + lk, hy - 4.8, 6.5, 5.6, 1.6); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = 'rgba(190,255,246,0.75)';                // hot top edge of each element
    c.fillRect(-5 + lk, hy - 4.8, 6.5, 1.3); c.fillRect(5 + lk, hy - 4.8, 6.5, 1.3);
    // THE GLASS ITSELF, in front of everything: a curved sheen running down
    // from the upper left, which is what makes the band read as a covered lens
    // instead of a hole with lights in it. It does NOT track the eyes — a
    // reflection belongs to the room, not to where she is looking.
    const gl = c.createLinearGradient(-8, hy - 7, 6, hy + 3);
    gl.addColorStop(0, 'rgba(255,255,255,0.34)');
    gl.addColorStop(0.42, 'rgba(255,255,255,0.07)');
    gl.addColorStop(0.62, 'rgba(255,255,255,0)');
    c.fillStyle = gl;
    c.beginPath();
    c.moveTo(-8, hy - 7); c.lineTo(9, hy - 7);
    c.quadraticCurveTo(-1, hy - 3.4, -8, hy + 1);
    c.closePath(); c.fill();
    c.restore();
    c.strokeStyle = 'rgba(58,58,74,0.9)'; c.lineWidth = 1; vis(); c.stroke();
    // a bright lip on the top edge of the bezel — the socket has a thickness
    const lip = c.createLinearGradient(-6, hy - 7, 10, hy - 6);
    lip.addColorStop(0, 'rgba(226,236,250,0)');
    lip.addColorStop(0.4, 'rgba(226,236,250,0.7)');
    lip.addColorStop(1, 'rgba(226,236,250,0)');
    c.strokeStyle = lip; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(-5, hy - 6.6); c.lineTo(11, hy - 6.6); c.stroke();
    if (!hero) {
      // whisker antennae
      c.strokeStyle = 'rgba(200,220,240,0.7)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(15, hy - 1); c.lineTo(21, hy - 3); c.moveTo(15, hy + 2); c.lineTo(21, hy + 3); c.stroke();
    }
    // visor scan sweep — the cyan bar crossing the whole band
    const scn = this.anim % 2.6;
    if (scn < 0.45) {
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.fillRect(-7 + (scn / 0.45) * 19, hy - 6, 2.6, 8);
    }
    // panel seam + vents on torso
    c.strokeStyle = 'rgba(70,85,105,0.55)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-9, -16 + bob * 0.4); c.lineTo(7, -16 + bob * 0.4); c.stroke();
    c.fillStyle = (this.dashT > 0 || this.healT > 0) ? P.glow : 'rgba(70,85,105,0.6)';
    for (let k = 0; k < 3; k++) c.fillRect(-10 + k * 3, -12 + bob * 0.4, 1.6, 4);
    // --- front arm: a cat scratches — the paw rakes, nothing is held.
    // (the hero form still carries the volt-blade through the old arcs) ---
    {
      // The shoulder used to sit at x=6 — six pixels inside a torso that is
      // seventeen wide. Every resting and running pose therefore put the whole
      // arm INSIDE her own silhouette, in the same metal as the belly: drawn
      // every frame, visible in none of them. It rides on the front edge now,
      // and every pose below is aimed to keep the paw clear of the body.
      const shX = 10, shY = -20 + bob * 0.4;
      let ang, reach = 14;
      // which paw is throwing, and where it is — resolved once, read by the
      // limb here, by the rear arm below, and by the claw effect
      const swingPose = this.swingVis ? slashPose(this.swingVis, this.face, false) : null;
      const swingHand = swingPose ? swingPose.hand : null;
      if (this.hurtPoseT > 0) {
        // knockback flail: the arm windmills for a beat
        ang = -1.9 + Math.sin(this.anim * 36) * 0.75; reach = 13;
      } else if (this.swingVis && (hero || swingHand !== 'B')) {
        const sv = this.swingVis;
        if (hero) {
          const prRaw = clamp(1 - sv.t / sv.t0, 0, 1);
          const pr = prRaw < 0.18 ? -(prRaw / 0.18) * 0.34 : (prRaw - 0.18) / 0.82;
          const prc = Math.max(0, pr);
          const aim = sv.ang * (this.face < 0 ? -1 : 1);
          // sword arcs: long, shoulder-led
          if (sv.combo === 2) ang = aim - 1.5 + pr * 2.8;
          else if (sv.combo === 1) ang = aim + 1.15 - pr * 2.2;
          else ang = aim - 1.0 + pr * 2.1;
          reach = 13 + Math.sin(prc * Math.PI) * 4;
        } else {
          ang = swingPose.ang; reach = swingPose.reach;
        }
      } else if (this.swingVis && swingHand === 'B') {
        // the OTHER paw is throwing this one. This arm braces across the chest
        // rather than mirroring the strike — a cat that rakes with one forepaw
        // plants the other, it does not swing both at everything.
        ang = 0.35 + swingPose.p * 0.3; reach = 12.5;
      } else if (this.wallSlide !== 0) {
        // wall-slide: palm planted on the wall above the shoulder
        ang = -0.9 + Math.sin(this.anim * 3) * 0.05; reach = 13.5;
      } else if (run && sprintK > 0.25) {
        // NINJA SPRINT: the arm sweeps back — but LOW, past the hip, so the paw
        // clears the belly instead of disappearing into it
        ang = 1.35 + sprintK * 0.5 + Math.sin(ph) * 0.12;
        reach = 15 + sprintK * 4;
      } else {
        // relaxed guard, held at the front edge of the chest where it can be
        // seen: the paw pumps a little with the walk and breathes at a stand
        const armSw = run ? Math.sin(ph + Math.PI) : 0;
        ang = 0.72 + armSw * 0.26 + Math.sin(this.anim * 2) * 0.06;
        reach = 14 + armSw * 1.2;
      }
      // Everything above only says where the arm WANTS to be. The spring says
      // where it is — stiff through a strike so the rake keeps its snap, loose
      // the rest of the time so travel, landing and idle flow into each other.
      const stiff = this.swingVis ? 900 : this.hurtPoseT > 0 ? 700 : 230;
      ang = rigAng(this, 'armA', ang, stiff, this.rigDt);
      reach = rigStep(this, 'armR', reach, stiff * 0.75, this.rigDt);
      const hx = shX + Math.cos(ang) * reach, hy = shY + Math.sin(ang) * reach;
      // the elbow is SOLVED now. The bones grow with the reach, so a tucked arm
      // folds hard and an extended one straightens out — the fold itself
      // animates, which is most of what sells a limb as jointed
      const bone = Math.max(7.6, reach * 0.56);
      const el = rigIK(shX, shY, hx, hy, bone, bone, -1);
      const ex = el.x, ey = el.y;
      // upper + fore arm — chubby means round little arms too. Drawn twice: a
      // dark contour underneath, then the metal inside it. Without the contour
      // the arm is the same value as the belly it crosses and vanishes into it,
      // which is exactly what it used to do.
      armBones(c, shX, shY, ex, ey, hx, hy, false, P.glow);
      // THE PAW. It was a circle, which meant it pointed nowhere and could not
      // lead or trail the arm. It is now a pad with three toes, and its wrist
      // rides a softer spring than the arm does — so it drags behind the swing
      // and whips through at the end, the way a real paw follows a foreleg.
      const wr = rigAng(this, 'armW', ang, this.swingVis ? 520 : 160, this.rigDt);
      const spread = this.swingVis ? 1 + Math.sin(clamp(1 - this.swingVis.t / this.swingVis.t0, 0, 1) * Math.PI) * 0.5 : 1;
      armPaw(c, hx, hy, wr, spread, false);
      // the cut is drawn later, in world space, and has to know where this paw
      // finished — otherwise it goes back to guessing from the aim
      // the same condition the near arm is drawn under, so the mark can never
      // describe a limb that is not on screen: in hero form this arm throws
      // every beat, in cat form the middle beat belongs to the other paw
      if (this.swingVis && (hero || swingHand !== 'B'))
        rakeMark(this, c, shX, shY, hx, hy, swingPose ? swingPose.dir : 1, false);
      // (the shoulder and elbow lights are part of the joints themselves now)
      // FERAL CLAWS: three purple energy talons splay from the paw
      if (this.clawT > 0) {
        c.save(); c.translate(hx, hy); c.rotate(ang);
        const flick = 0.85 + Math.sin(this.anim * 22) * 0.15;
        for (let k = -1; k <= 1; k++) {
          const len = (15 + Math.abs(k) * -3) * flick, spread = k * 0.34;
          c.save(); c.rotate(spread);
          const cg2 = c.createLinearGradient(0, 0, len, 0);
          cg2.addColorStop(0, 'rgba(255,255,255,0.95)');
          cg2.addColorStop(0.45, '#e0a0ff'); cg2.addColorStop(1, 'rgba(176,106,255,0)');
          c.fillStyle = cg2; c.shadowColor = '#b06aff'; c.shadowBlur = 12;
          c.beginPath(); c.moveTo(0, -2.2); c.quadraticCurveTo(len * 0.6, -1.6, len, 0);
          c.quadraticCurveTo(len * 0.6, 1.6, 0, 2.2); c.closePath(); c.fill();
          c.shadowBlur = 0; c.restore();
        }
        c.restore();
      }
      // THE RAKE ITSELF used to be drawn here, and that was the bug. Inside her
      // transform it inherits everything the body is doing: the double jump's
      // spiral squashes it to half width and mirrors it, the sprint's forward
      // pitch tips it over, and — because it was centred on a paw that is inside
      // her silhouette at both ends of the swing — the arc washed straight
      // across her chest. It is now composited in world space, after her, in
      // front of her. See the swing block further down.
      // the cat's own claws bare from the paw for the strike: three hooked
      // talons splayed along the swipe, steel-white with glowing tips
      if (this.swingVis && this.clawT <= 0 && !hero && swingHand !== 'B') {
        c.save(); c.translate(hx, hy); c.rotate(ang);
        for (let k = -1; k <= 1; k++) {
          const len = 11 - Math.abs(k) * 2, spread = k * 0.38;
          c.save(); c.rotate(spread);
          // claw steel per the locked palette: #C0C0D0 body, #E8E8FF edge
          const cg2 = c.createLinearGradient(0, 0, len, 0);
          cg2.addColorStop(0, '#e8e8ff'); cg2.addColorStop(0.55, '#c0c0d0'); cg2.addColorStop(1, P.glow);
          c.fillStyle = cg2; c.shadowColor = P.glow; c.shadowBlur = 8;
          // hooked like a real claw: curves down toward the tip
          c.beginPath(); c.moveTo(0, -1.6);
          c.quadraticCurveTo(len * 0.55, -2.2, len, 1.2);
          c.quadraticCurveTo(len * 0.5, 1.8, 0, 1.6); c.closePath(); c.fill();
          c.shadowBlur = 0; c.restore();
        }
        c.restore();
      }
      // ---- THE FAR PAW'S OWN BEAT ----------------------------------------
      // The second hit of the string is thrown by the OTHER foreleg, and the
      // rear arm lives behind the body, so it is drawn again here — in front,
      // for exactly as long as it is striking. Darker than the near one, so it
      // still reads as the far side rather than as this arm teleporting.
      if (this.swingVis && !hero && (swingHand === 'B' || swingHand === 'X')) {
        const bp = slashPose(this.swingVis, this.face, swingHand === 'X');
        const bsx = -2, bsy = -19 + bob * 0.4;
        const ba = rigAng(this, 'armFB', bp.ang, 900, this.rigDt);
        const br = rigStep(this, 'armFBR', bp.reach, 700, this.rigDt);
        const bhx = bsx + Math.cos(ba) * br, bhy = bsy + Math.sin(ba) * br;
        const bbone = Math.max(7.2, br * 0.56);
        const bel = rigIK(bsx, bsy, bhx, bhy, bbone, bbone, -1);
        armBones(c, bsx, bsy, bel.x, bel.y, bhx, bhy, true, null);
        const bwr = rigAng(this, 'armFBW', ba, 520, this.rigDt);
        armPaw(c, bhx, bhy, bwr, 1 + Math.sin(bp.p * Math.PI) * 0.5, true);
        if (this.clawT <= 0) {
          c.save(); c.translate(bhx, bhy); c.rotate(ba);
          for (let k = -1; k <= 1; k++) {
            const len = 10 - Math.abs(k) * 2;
            c.save(); c.rotate(k * 0.38);
            const cg3 = c.createLinearGradient(0, 0, len, 0);
            cg3.addColorStop(0, '#cfd6e6'); cg3.addColorStop(0.55, '#9aa3b6'); cg3.addColorStop(1, P.glow);
            c.fillStyle = cg3; c.shadowColor = P.glow; c.shadowBlur = 6;
            c.beginPath(); c.moveTo(0, -1.5);
            c.quadraticCurveTo(len * 0.55, -2, len, 1.1);
            c.quadraticCurveTo(len * 0.5, 1.7, 0, 1.5); c.closePath(); c.fill();
            c.shadowBlur = 0; c.restore();
          }
          c.restore();
        }
        rakeMark(this, c, bsx, bsy, bhx, bhy, bp.dir, true);
      }
      // the blade, held IN the paw — hero form only
      if (this.swingVis && this.clawT <= 0 && hero) {
        c.save(); c.translate(hx, hy); c.rotate(ang + Math.PI / 2);
        c.fillStyle = '#5c6678'; c.fillRect(-1.8, 0, 3.6, 7);        // grip
        c.fillStyle = '#8892a2'; c.fillRect(-4.5, -1.5, 9, 3);       // guard
        const bl = 30;
        const bg2 = c.createLinearGradient(0, -bl, 0, 0);
        bg2.addColorStop(0, '#ffffff'); bg2.addColorStop(0.55, '#eaf6ff'); bg2.addColorStop(1, P.glow);
        c.fillStyle = bg2; c.shadowColor = P.glow; c.shadowBlur = 12;
        c.beginPath(); c.moveTo(-2, -2); c.lineTo(-1.6, -bl + 4); c.lineTo(0, -bl);
        c.lineTo(1.6, -bl + 4); c.lineTo(2, -2); c.closePath(); c.fill();
        c.shadowBlur = 0;
        c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 0.9;
        c.beginPath(); c.moveTo(-0.4, -5); c.lineTo(0, -bl + 4); c.stroke();   // edge highlight
        c.restore();
      }
    }
    // THE BACK JET at full burn — the double jump's engine. A single hard
    // plume from the lower back, angled down and behind her, with shock
    // diamonds stepped along it: a jet, not a candle. Additive light only —
    // the authored gear plates for the pack itself are queued (§1c).
    if ((this.boostT || 0) > 0) {
      const bk = this.boostT / 0.3;
      c.save(); c.globalCompositeOperation = 'lighter';
      c.translate(-9, -14);                      // the pack sits on her lower back
      c.rotate(0.5);                             // exhaust thrown down-behind
      const L = 26 + bk * 22 + rnd(-2, 2);
      const jg = c.createLinearGradient(0, 0, 0, L);
      jg.addColorStop(0, '#ffffff'); jg.addColorStop(0.25, '#8ff6ff');
      jg.addColorStop(0.6, '#37ffd0'); jg.addColorStop(1, 'rgba(55,255,208,0)');
      c.fillStyle = jg; c.globalAlpha = 0.55 + bk * 0.4;
      c.beginPath(); c.moveTo(-4.5, 0); c.lineTo(4.5, 0); c.lineTo(1.5, L); c.lineTo(-1.5, L); c.closePath(); c.fill();
      // shock diamonds — the read that says PRESSURE rather than flame
      c.fillStyle = '#ffffff';
      for (let q = 1; q <= 3; q++) {
        const dy2 = q * L * 0.24, w2 = (4.2 - q) * 1.15 * bk;
        c.globalAlpha = (0.5 - q * 0.12) * bk;
        c.beginPath(); c.moveTo(0, dy2 - w2); c.lineTo(w2, dy2); c.lineTo(0, dy2 + w2); c.lineTo(-w2, dy2); c.closePath(); c.fill();
      }
      c.restore();
    }
    }  // end of the procedural body — the jets below draw in BOTH paths
    // thruster jets
    if (this.jetT > 0 || (!this.on && this.vy < -140 && this.dashT <= 0)) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const px of (this.flipT > 0 ? [-7, 6] : [-8])) {
        const L = rnd(8, 15) + (this.jetT > 0 ? 5 : 0);
        // spec §2.3: jet-orange core fading to cyan at the edge
        const jg = c.createLinearGradient(px, -6, px - 5, -6 + L + 8);
        jg.addColorStop(0, '#fff1d8'); jg.addColorStop(0.4, '#ff8c42'); jg.addColorStop(1, 'rgba(55,255,208,0)');
        c.fillStyle = jg;
        c.beginPath(); c.moveTo(px - 2.4, -6); c.lineTo(px + 2.4, -6); c.lineTo(px - 4, -6 + L + 8); c.closePath(); c.fill();
      }
      c.restore();
    }
    }
    c.restore();
    // combo pips — 1/2/3 tiny lights above the head while the chain is alive;
    // the newest pip burns white so you can read where you are mid-combo
    if (this.comboT > 0) {
      const n = this.combo + 1, a = clamp(this.comboT / 0.3, 0, 1);
      c.save(); c.globalAlpha = 0.85 * a;
      for (let i = 0; i < n; i++) {
        const px2 = this.x + this.w / 2 + (i - (n - 1) / 2) * 9;
        c.fillStyle = i === n - 1 ? '#ffffff' : PAL[G.roomDef.zone].glow;
        c.shadowColor = PAL[G.roomDef.zone].glow; c.shadowBlur = 6;
        c.beginPath(); c.arc(px2, this.y - 12, i === n - 1 ? 2.6 : 2, 0, 7); c.fill();
      }
      c.shadowBlur = 0; c.restore(); c.globalAlpha = 1;
    }
    // volt-blade slashes — sharp tapered anime CUTS through space, not rings
    if (this.swingVis) {
      const sv = this.swingVis;
      const p = 1 - sv.t / sv.t0;
      // ---- THE SWIRL draws its own thing and nothing else ------------------
      // The rake arcs follow her PAWS, and through a pirouette the paws go
      // round with her — which would draw two arcs chasing each other's tails
      // and read as a mess. The dance is one shape, so it is drawn as one: a
      // ring the blades are cutting, opened into petals where they cross.
      if (sv.swirl) {
        const cx = this.x + this.w / 2, cy = this.y + this.h / 2 - 4;
        const spin = p * Math.PI * 3.2;                 // a turn and a half
        const grow = Math.sin(Math.min(1, p * 1.25) * Math.PI * 0.5);   // opens fast
        const fade = 1 - Math.max(0, (p - 0.72) / 0.28);                // closes late
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.translate(cx, cy);
        c.rotate(spin);
        c.scale(1, 0.46);                               // seen from above-ish, so it lies flat
        const R = SWIRL_R * (0.55 + grow * 0.55);
        // FIVE PETALS, the shape the art plate carries: a rose curve, which is
        // what two blades crossing on a turn actually leave behind
        for (const pass of [0, 1]) {
          c.beginPath();
          for (let i = 0; i <= 96; i++) {
            const a = i / 96 * Math.PI * 2;
            const rr2 = R * (0.72 + 0.28 * Math.cos(a * 5 + pass * Math.PI));
            const px = Math.cos(a) * rr2, py = Math.sin(a) * rr2;
            i ? c.lineTo(px, py) : c.moveTo(px, py);
          }
          c.closePath();
          c.strokeStyle = pass ? 'rgba(190,245,255,' + (0.5 * fade).toFixed(3) + ')'
                               : 'rgba(255,255,255,' + (0.85 * fade).toFixed(3) + ')';
          c.lineWidth = pass ? 5.5 : 2.4;
          c.shadowColor = '#dff6ff'; c.shadowBlur = pass ? 16 : 7;
          c.stroke();
        }
        c.restore();
        // motes thrown off the ring, in world space so they do not spin with it
        if (chance(0.7)) {
          const a = rnd(0, 7);
          addPart(cx + Math.cos(a) * SWIRL_R * 0.9, cy + Math.sin(a) * SWIRL_R * 0.42,
                  Math.cos(a) * 90, Math.sin(a) * 42 - 30, 0.4, '#ffffff', 2.2, 40, true);
        }
        c.globalCompositeOperation = 'source-over';
        return;
      }
      const ease = p * p * (3 - 2 * p);
      const gcol = PAL[G.roomDef.zone].glow;
      const empowered = this.clawT > 0;
      const divineHit = empowered && typeof isHero === 'function' && isHero();
      const clawed = empowered && !divineHit;
      const col = divineHit ? '#ffd76a' : clawed ? '#b06aff' : (sv.combo === 2 ? '#ffd76a' : gcol);
      // Resolve the paws recorded during the body pass into world space. The old
      // conversion did this by hand — body centre, plus the local x flipped by
      // the facing sign — which quietly ignored the facing SCALE, the run lean,
      // the landing squash, the evolution scale and, worst of all, the double
      // jump's spiral. Ask the context instead: it knows the exact matrix each
      // paw was drawn under, and the inverse of the world matrix takes it back.
      const marks = [];
      if (this._rake && this._rake.length) {
        const inv = c.getTransform().invertSelf();
        for (const rk of this._rake) {
          const M = inv.multiply(rk.m);
          const o = M.transformPoint(new DOMPoint(rk.sx, rk.sy));   // shoulder
          const t = M.transformPoint(new DOMPoint(rk.x, rk.y));     // paw
          // a mirrored frame reverses which way an arc sweeps, so the travel
          // direction has to be mirrored with it or the cut bows the wrong way
          const mir = M.a * M.d - M.b * M.c < 0 ? -1 : 1;
          marks.push({ sx: o.x, sy: o.y, x: t.x, y: t.y,
                       a: Math.atan2(t.y - o.y, t.x - o.x),
                       r: Math.hypot(t.x - o.x, t.y - o.y),
                       dir: rk.dir * mir, far: rk.far });
        }
      }
      // THE AUTHORED RAKE, composited in world space so nothing the body is
      // doing can deform it. Each beat of the combo escalates the shape and the
      // finisher is a crossing double-rake; the sheet is painted on black, so
      // brightness IS the alpha and no cutting is needed.
      if (!hero) for (const mk of marks) drawRake(c, this, mk);
      // WRATH OF OLYMPUS: the cut lands as a forked thunderbolt
      const boltCut = (len, wid, alpha) => {
        const hl = len / 2;
        c.save();
        for (let pass = 0; pass < 2; pass++) {
          c.globalAlpha = alpha * (pass ? 1 : 0.85);
          c.strokeStyle = pass ? '#ffffff' : '#ffb43c';
          c.lineWidth = pass ? 2.4 : 6.5; c.lineCap = 'round'; c.lineJoin = 'round';
          c.shadowColor = '#ffd76a'; c.shadowBlur = pass ? 12 : 24;
          c.beginPath(); c.moveTo(-hl, 6);
          for (let s2 = 1; s2 <= 4; s2++)
            c.lineTo(-hl + (len * s2) / 5 + rnd(-4, 4), -wid * 0.55 * Math.sin((s2 / 5) * Math.PI) + rnd(-5, 5));
          c.lineTo(hl, 2); c.stroke();
          // a forked branch splitting off the main arc
          c.lineWidth = pass ? 1.4 : 3.4;
          c.beginPath(); c.moveTo(0, -wid * 0.4);
          c.lineTo(hl * 0.35 + rnd(-4, 4), -wid * 0.15); c.lineTo(hl * 0.55, wid * 0.35);
          c.stroke();
        }
        c.shadowBlur = 0; c.restore(); c.globalAlpha = 1;
      };
      // the cat's cut is a CLAW RAKE: three curved talon crescents, sharp at
      // both ends, full in the belly — the wake of a paw, not a sword edge
      const talonRake = (len, wid, alpha, body, edge) => {
        body = body || col; edge = edge || '#ffffff';
        const hl = len / 2;
        c.save();
        for (let k = -1; k <= 1; k++) {
          const off = k * wid * 0.42, L = hl * (1 - Math.abs(k) * 0.14), W = wid * (1 - Math.abs(k) * 0.1);
          c.globalAlpha = alpha * (1 - Math.abs(k) * 0.2);
          c.shadowColor = body; c.shadowBlur = 14;
          c.fillStyle = body;
          c.beginPath();
          c.moveTo(-L, 6 + off);
          c.quadraticCurveTo(0, -W + off, L, 1 + off);
          c.quadraticCurveTo(0, -W * 0.55 + off, -L, 6 + off);
          c.closePath(); c.fill();
          c.shadowBlur = 0;
          // razor edge along the leading curve
          c.strokeStyle = edge; c.globalAlpha = alpha * (0.9 - Math.abs(k) * 0.25);
          c.lineWidth = 1.6; c.lineCap = 'round';
          c.beginPath(); c.moveTo(-L * 0.94, 5 + off);
          c.quadraticCurveTo(0, -W * 0.96 + off, L * 0.94, 0.5 + off); c.stroke();
        }
        c.restore(); c.globalAlpha = 1;
      };
      // in claw mode a strike is a RAKE: three parallel talon streaks
      const cut = divineHit ? boltCut : clawed ? (len, wid, alpha) => {
        const hl = len / 2;
        c.save();
        for (let k = -1; k <= 1; k++) {
          const off = k * wid * 0.34, thin = 3.4 - Math.abs(k) * 1.1;
          c.globalAlpha = alpha * (1 - Math.abs(k) * 0.18);
          // deep violet body so the rake stays purple through the bloom pass
          c.strokeStyle = '#8a2be2'; c.shadowColor = '#7a1fd0'; c.shadowBlur = 10;
          c.lineWidth = thin * 1.5; c.lineCap = 'round';
          c.beginPath();
          c.moveTo(-hl * 0.95, 5 + off);
          c.quadraticCurveTo(0, -wid * 0.7 + off, hl * 0.95, 1 + off);
          c.stroke();
          c.strokeStyle = '#c77dff'; c.lineWidth = thin * 0.75; c.shadowBlur = 6;
          c.beginPath();
          c.moveTo(-hl * 0.95, 5 + off);
          c.quadraticCurveTo(0, -wid * 0.7 + off, hl * 0.95, 1 + off);
          c.stroke();
          c.shadowBlur = 0;
          c.strokeStyle = 'rgba(255,240,255,' + (alpha * 0.55) + ')'; c.lineWidth = thin * 0.22;
          c.beginPath();
          c.moveTo(-hl * 0.9, 5 + off);
          c.quadraticCurveTo(0, -wid * 0.7 + off, hl * 0.9, 1 + off);
          c.stroke();
        }
        c.restore(); c.globalAlpha = 1;
      } : (len, wid, alpha) => talonRake(len, wid, alpha, col);
      if (sv.combo === 3) {
        // SUPERCHARGED: two claw sweeps closing in an X in front of the cat —
        // gold over zone-glow, a shock ring, and a four-point spark at the cross
        const cbx = this.x + this.w / 2 + (this.face || 1) * 34, cby = this.y + this.h / 2;
        const a3 = Math.min(1, (1 - p) * 1.7);
        const drift3 = (1 - ease) * 0.3;
        c.save();
        c.translate(cbx, cby);
        c.globalCompositeOperation = 'lighter';
        // slim shock ring racing outward from the cross
        c.globalAlpha = a3 * 0.8;
        c.strokeStyle = '#ffffff'; c.shadowColor = gcol; c.shadowBlur = 22;
        c.lineWidth = 3.5 * (1 - p * 0.6);
        c.beginPath(); c.arc(0, 0, 34 + ease * 104, 0, 7); c.stroke();
        c.shadowBlur = 0;
        // the two rakes: they close toward each other as the strike settles
        const gr3 = 0.7 + ease * 0.55;
        c.save(); c.rotate(-0.62 + drift3); c.scale(gr3, gr3);
        talonRake(158, 44, a3, '#ffd76a'); c.restore();
        c.save(); c.rotate(0.62 - drift3); c.scale(gr3, -gr3);
        talonRake(158, 44, a3 * 0.92, gcol); c.restore();
        // spark cross where the claws meet
        c.globalAlpha = a3;
        c.strokeStyle = '#ffffff'; c.shadowColor = '#ffd76a'; c.shadowBlur = 16;
        c.lineWidth = 2.2; c.lineCap = 'round';
        c.rotate(ease * 0.6);
        for (let k = 0; k < 4; k++) {
          c.rotate(Math.PI / 2);
          c.beginPath(); c.moveTo(4, 0); c.lineTo(20 + ease * 14, 0); c.stroke();
        }
        c.restore();
        c.globalAlpha = 1;
      } else {
      c.save();
      // THE CUT COMES OFF THE PAW, AND HANGS IN FRONT OF HER.
      //
      // It was already anchored to the paw and rotated by the paw's live angle,
      // which fixed the hand looking detached. What it was still doing wrong is
      // sitting CENTRED on that paw — and the paw is inside her silhouette at
      // the start and the end of every swing, and is dragged back inside it by
      // its own spring whenever she is running or has just left the ground. So
      // the rear half of every rake was painted across her own chest, and the
      // faster she moved the more of it landed on her. A cat does not wear the
      // mark it makes: the claws lead, the cut hangs in the air ahead of them.
      //
      // The stroke is now laid ACROSS the swing rather than along it — see
      // rakePlace — and carried out to a radius that clears her, with the paw
      // leading the mark it is making.
      const mk3 = marks[0] || {
        sx: this.x + this.w / 2, sy: this.y + this.h - 20,
        x: this.x + this.w / 2 + Math.cos(sv.ang) * 26,
        y: this.y + this.h - 20 + Math.sin(sv.ang) * 26,
        a: sv.ang, r: 26, dir: 1,
      };
      const pd3 = mk3.dir;
      c.globalCompositeOperation = 'lighter';
      const grow = 0.55 + ease * 0.65;         // the cut extends as it lands
      const drift = (1 - ease) * 0.22;         // slight rotation as it settles
      // the rake materializes a frame AFTER the arm's wind-up — anticipation
      const gate = clamp((p - 0.07) / 0.07, 0, 1);
      const far3 = (typeof hasSkill === 'function' && hasSkill('reach')) || empowered;
      // finisher: the X still crosses, but its span is earned — the long
      // version belongs to the Long Rake skill and to the feral claws
      const L3 = sv.combo === 2 ? (far3 ? 92 : 56) : (far3 ? 62 : 44);
      // captured marks live in body space (aim must fold facing out); the
      // synthesized fallback is world space (aim is the raw swing angle)
      rakePlace(c, mk3, marks[0]
        ? Math.atan2(Math.sin(sv.ang), Math.cos(sv.ang) * (this.faceVis || 1))
        : sv.ang);
      c.rotate(drift * pd3);
      c.scale(grow, pd3);
      c.translate(-L3 * RAKE_LAG, 0);
      if (sv.combo === 2) {
        // the finisher crosses two rakes. They have to open WIDE — at a narrow
        // angle six streaks at slightly different tilts read as a firework, not
        // as two paws closing on the same point.
        c.rotate(-0.52);
        cut(L3, L3 * 0.28, Math.min(1, (1 - p) * 1.7) * gate);
        c.rotate(1.04); c.scale(1, -1);
        cut(L3, L3 * 0.28, Math.min(1, (1 - p) * 1.4) * gate);
      } else {
        cut(L3, 18, Math.min(1, (1 - p) * 1.7) * gate);
      }
      c.restore();
      c.globalAlpha = 1;
      }
    }
    // charging aura on the blade — cold and thin when she cannot pay for it,
    // so the screen answers "why did nothing happen" before it happens
    if (this.chargeT > 0.25) {
      const ck = Math.min(1, this.chargeT / 0.6);
      const cok = this.chargeOk !== false;
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = (cok ? 0.25 + ck * 0.35 : 0.12 + ck * 0.1) + Math.sin(performance.now() / 90) * (cok ? 0.12 : 0.04);
      const cg = c.createRadialGradient(this.x + 12, this.y + 14, 4, this.x + 12, this.y + 14, 30 + ck * 22);
      cg.addColorStop(0, !cok ? '#7d6b8a' : ck >= 1 ? '#ffffff' : PAL[G.roomDef.zone].glow);
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = cg;
      c.beginPath(); c.arc(this.x + 12, this.y + 14, 30 + ck * 22, 0, 7); c.fill();
      c.restore(); c.globalAlpha = 1;
    }
    // FIREDASH — combustion-engine exhaust: white-hot core at the feet,
    // conical flame body fading behind, shock diamonds and shine flashes
    if (this.dashT > 0) {
      // the hardware first, under its own light — see drawThrustBoots()
      if (typeof drawThrustBoots === 'function') drawThrustBoots(c, this);
      const dvx = this.dashVX || this.face * 900, dvy = this.dashVY || 0;
      const dn = Math.hypot(dvx, dvy) || 1;
      const ex = -dvx / dn, ey = -dvy / dn;          // exhaust direction (backwards)
      const pxn = -ey, pyn = ex;                     // perpendicular
      const now = performance.now();
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const foot of [-3.5, 3.5]) {              // twin nozzles, one per foot
        const bx = this.x + this.w / 2 + ex * 8 + pxn * foot;
        const by = this.y + this.h - 7 + ey * 6 + pyn * foot;
        const flick = 0.82 + Math.sin(now / 22 + foot) * 0.18;
        // layered cone: wide orange body → golden mid → white-hot core at the shoe
        for (const [len, wid, col, al] of [[62, 12, '#ff7a2e', 0.42], [42, 8, '#ffd76a', 0.6], [24, 5, '#ffffff', 0.9]]) {
          const L2 = len * flick;
          const tx = bx + ex * L2, ty = by + ey * L2;
          const g2 = c.createLinearGradient(bx, by, tx, ty);
          g2.addColorStop(0, col); g2.addColorStop(1, 'rgba(255,110,30,0)');
          c.fillStyle = g2; c.globalAlpha = al;
          c.beginPath();
          c.moveTo(bx + pxn * wid, by + pyn * wid);
          c.lineTo(bx - pxn * wid, by - pyn * wid);
          c.lineTo(tx, ty);
          c.closePath(); c.fill();
        }
        // shock diamonds along the plume — the jet-engine signature
        c.fillStyle = '#ffffff';
        for (let k = 1; k <= 3; k++) {
          const dd = (10 + k * 11) * flick, ds = (4 - k) * 1.5;
          const dx2 = bx + ex * dd, dy2 = by + ey * dd;
          c.globalAlpha = 0.75 - k * 0.18;
          c.beginPath();
          c.moveTo(dx2 + ex * ds * 1.6, dy2 + ey * ds * 1.6);
          c.lineTo(dx2 + pxn * ds, dy2 + pyn * ds);
          c.lineTo(dx2 - ex * ds * 1.6, dy2 - ey * ds * 1.6);
          c.lineTo(dx2 - pxn * ds, dy2 - pyn * ds);
          c.closePath(); c.fill();
        }
        // stray shine sparks flying off the plume
        for (let k = 0; k < 3; k++) {
          const sd = rnd(16, 58), sw = rnd(-9, 9);
          c.globalAlpha = rnd(0.3, 0.8);
          c.fillRect(bx + ex * sd + pxn * sw - 1, by + ey * sd + pyn * sw - 1, 2, 2);
        }
        // nozzle glow at the shoe
        const ng = c.createRadialGradient(bx, by, 1, bx, by, 9);
        ng.addColorStop(0, '#ffffff'); ng.addColorStop(1, 'rgba(255,160,60,0)');
        c.globalAlpha = 0.95; c.fillStyle = ng;
        c.beginPath(); c.arc(bx, by, 9, 0, 7); c.fill();
      }
      c.restore(); c.globalAlpha = 1;
    }
    // heal ring
    if (this.healT > 0) {
      c.strokeStyle = '#aef7d8'; c.globalAlpha = 0.7; c.lineWidth = 2;
      c.beginPath(); c.arc(this.x + this.w / 2, this.y + this.h / 2, 26 - this.healT * 18, 0, 7); c.stroke();
      c.globalAlpha = 1;
    }
  }
}

// ================= PROJECTILES =================
class Proj {
  constructor(x, y, vx, vy, friendly, dmg, r, color, grav, life) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.friendly = friendly; this.dmg = dmg; this.r = r; this.color = color;
    this.grav = grav || 0; this.life = life || 3; this.dead = false; this.el = null;
  }
  box() { return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 }; }
  update(dt) {
    this.life -= dt; if (this.life <= 0) { this.dead = true; return; }
    this.vy += this.grav * dt;
    const sx = this.x, sy = this.y;
    this.x += this.vx * dt; this.y += this.vy * dt;
    const bump = shotSweep(sx, sy, this.x, this.y);
    if (bump) {
      this.x = bump.x; this.y = bump.y;
      this.dead = true; burst(this.x, this.y, 6, this.color, 130, 0.3, 400, 2, true); return;
    }
    if (this.friendly) {
      const targets = G.enemies.concat(G.boss && !G.boss.dead && G.boss.st !== 'intro' && G.boss.st !== 'dorm' ? [G.boss] : []);
      for (const e of targets) {
        if (e.dead) continue;
        if (aabb(this.box(), hurtBoxOf(e))) {
          dealDmg(e, this.dmg, this.el || armEl(), this.x, this.y); this.dead = true;
          if (this.freeze) {                       // HALT: holds a target still
            e.stagT = Math.max(e.stagT || 0, 2.0);
            burst(this.x, this.y, 14, ELEM.glazz.glow, 200, 0.6, 40, 3, true);
          }
          if (this.pool) {                         // FORGE: splash where it lands
            for (const o of targets) {
              if (o === e || o.dead) continue;
              if (Math.hypot(o.x + o.w / 2 - this.x, o.y + o.h / 2 - this.y) < 78)
                dealDmg(o, Math.round(this.dmg * 0.6), 'hott', o.x + o.w / 2, o.y);
            }
            burst(this.x, this.y, 18, ELEM.hott.glow, 260, 0.7, 260, 4, true);
          }
          if (this.chain > 0) {                    // ARCLIGHT: jumps onward
            let best = null, bd = 190;
            for (const o of targets) {
              if (o === e || o.dead) continue;
              const d = Math.hypot(o.x + o.w / 2 - this.x, o.y + o.h / 2 - this.y);
              if (d < bd) { bd = d; best = o; }
            }
            if (best) {
              const nx = best.x + best.w / 2, ny = best.y + best.h / 2;
              const j = new Proj(this.x, this.y, (nx - this.x) * 4, (ny - this.y) * 4, true,
                                 Math.round(this.dmg * 0.75), this.r, this.color, 0, 0.3);
              j.el = this.el; j.chain = this.chain - 1; G.projs.push(j);
            }
          }
          if (!(e instanceof Boss) && e.kind !== 'turret') {
            e.kbT = 0.22; e.vx += Math.sign(this.vx) * 260; e.vy -= 120;
          }
          sfx('hit'); burst(this.x, this.y, 10, this.color, 200, 0.35, 200, 3, true);
          if (e.hp <= 0) e.die(Math.sign(this.vx), -0.3);
          return;
        }
      }
    } else if (!player.dead && aabb(this.box(), player)) {
      this.dead = true;
      player.hurt(DF().edmg, this.x);
      if (this.frost) {                          // Archivist beam: frozen joints
        player.slowT = Math.max(player.slowT, 2);
        burst(this.x, this.y, 12, '#bfe8ff', 180, 0.5, 100, 2.5, true);
      }
    }
  }
  draw(c) {
    // TALONHOST's metallic feathers wear the sheet's own art
    if (this.feather && typeof drawFeather === 'function' && drawFeather(c, this)) return;
    // GLACIERE's void lance and ice shards wear hers
    if (this.glcFx && typeof drawGlcProj === 'function' && drawGlcProj(c, this)) return;
    c.shadowColor = this.color; c.shadowBlur = 12; c.fillStyle = this.color;
    c.beginPath(); c.arc(this.x, this.y, this.r, 0, 7); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.beginPath(); c.arc(this.x, this.y, this.r * 0.4, 0, 7); c.fill();
  }
}

// ================= MOVING PLATFORMS =================
// Powered rail slabs for the later zones: each one ping-pongs between two
// anchors on a smooth cosine, carries whoever rides it, and is ONE-WAY —
// she jumps up through it freely and only lands from above.
// ===========================================================================
// THE GRINDER. A cone sitting still on the floor is a warning sign, not a
// threat — you route around it once and never think about it again. A wheel
// that PATROLS the rail is a different thing entirely: it has to be read, timed
// and beaten, and it turns a static wall into a piece of play.
//
// It is built like a machine that would actually exist in this factory: a
// bolted hub, spokes under tension, and a hardened tooth ring that bites the
// rail it runs on and throws sparks off it. Rotation is derived from distance
// travelled, never from a timer, because a wheel that slides instead of rolling
// is the one thing the eye catches instantly.
// ===========================================================================
class SawWheel {
  constructor(x0, x1, ty) {
    this.r = 19;
    this.railY = ty * TILE;                 // top of the hazard rail
    this.x0 = x0 + this.r; this.x1 = x1 - this.r;
    if (this.x1 < this.x0) { const m = (x0 + x1) / 2; this.x0 = this.x1 = m; }
    this.x = this.x0; this.y = this.railY + TILE - this.r * 0.62;
    this.spd = 74 + ((x0 * 7919) % 40);     // each rail runs at its own pace
    this.dir = ((x0 / TILE) | 0) % 2 ? 1 : -1;
    this.rot = 0; this.sparkT = 0; this.arcSeed = 0; this.arcT = 0;
  }
  update(dt) {
    const span = this.x1 - this.x0;
    if (span <= 1) { this.rot += dt * 5; return; }
    const nx = this.x + this.dir * this.spd * dt;
    if (nx > this.x1) { this.x = this.x1; this.dir = -1; }
    else if (nx < this.x0) { this.x = this.x0; this.dir = 1; }
    else this.x = nx;
    // rolling, not sliding: the tooth ring turns exactly as far as it travelled
    this.rot += (this.dir * this.spd * dt) / this.r;
    // the arc re-strikes on its own clock, so it flickers instead of spinning
    this.arcT -= dt;
    if (this.arcT <= 0) { this.arcT = 0.055; this.arcSeed = (this.arcSeed + 5) % 12; }
    // it grinds where it touches
    this.sparkT -= dt;
    if (this.sparkT <= 0 && typeof addPart === 'function') {
      this.sparkT = 0.035;
      for (let i = 0; i < 2; i++)
        addPart(this.x - this.dir * this.r * 0.55, this.y + this.r * 0.86,
          -this.dir * rnd(90, 260), rnd(-140, -20), rnd(0.18, 0.38),
          chance(0.5) ? '#fff0c0' : '#ffa23c', rnd(1.6, 2.6), 620, true);
    }
    // and it hurts, above the rail, which is the entire point of it moving
    if (player && !player.dead && player.iT <= 0) {
      const dx = (player.x + player.w / 2) - this.x, dy = (player.y + player.h / 2) - this.y;
      if (Math.hypot(dx, dy) < this.r + 12) player.hurt(1, this.x);
    }
  }
  draw(c2) {
    const P = PAL[G.roomDef.zone];
    c2.save();
    c2.translate(this.x, this.y);
    // the shadow it casts into its own trench
    c2.globalAlpha = 0.4; c2.fillStyle = '#000';
    c2.beginPath(); c2.ellipse(0, this.r * 0.9, this.r * 0.95, 4, 0, 0, 7); c2.fill();
    c2.globalAlpha = 1;
    c2.rotate(this.rot);
    const R = this.r;
    // hardened tooth ring — swept, so the leading edge of each tooth is the
    // one that would catch
    c2.fillStyle = rkMix('#8f9daa', P.edge, 0.12);
    c2.beginPath();
    const N = 12;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2, a1 = ((i + 0.42) / N) * Math.PI * 2, a2 = ((i + 1) / N) * Math.PI * 2;
      c2.lineTo(Math.cos(a0) * R * 0.82, Math.sin(a0) * R * 0.82);
      c2.lineTo(Math.cos(a1) * R * 1.16, Math.sin(a1) * R * 1.16);
      c2.lineTo(Math.cos(a2) * R * 0.82, Math.sin(a2) * R * 0.82);
    }
    c2.closePath(); c2.fill();
    c2.strokeStyle = '#141a22'; c2.lineWidth = 1.4; c2.stroke();
    // the honed inner edge of the ring
    c2.strokeStyle = '#eaf4ff'; c2.globalAlpha = 0.5; c2.lineWidth = 1.4;
    c2.beginPath(); c2.arc(0, 0, R * 0.8, 0, 7); c2.stroke();
    c2.globalAlpha = 1;
    // disc, spokes, bolted hub
    const g = c2.createRadialGradient(-R * 0.3, -R * 0.35, 2, 0, 0, R * 0.8);
    g.addColorStop(0, '#7c8996'); g.addColorStop(1, '#2b333d');
    c2.fillStyle = g;
    c2.beginPath(); c2.arc(0, 0, R * 0.78, 0, 7); c2.fill();
    c2.strokeStyle = '#0e131a'; c2.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      c2.beginPath(); c2.moveTo(Math.cos(a) * R * 0.2, Math.sin(a) * R * 0.2);
      c2.lineTo(Math.cos(a) * R * 0.72, Math.sin(a) * R * 0.72); c2.stroke();
    }
    c2.fillStyle = '#5d6975';
    c2.beginPath(); c2.arc(0, 0, R * 0.26, 0, 7); c2.fill();
    c2.strokeStyle = '#0e131a'; c2.lineWidth = 1.1; c2.stroke();
    c2.fillStyle = '#0e131a';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      c2.beginPath(); c2.arc(Math.cos(a) * R * 0.16, Math.sin(a) * R * 0.16, 1.5, 0, 7); c2.fill();
    }
    // ---- IT IS ELECTRIC ----------------------------------------------
    // The blade is not merely sharp, it is LIVE: the tooth ring carries a
    // charge that lights its own edge and jumps to whatever is nearest. An
    // arc is the cheapest possible way to say "do not touch this", and it
    // is the thing that stops a wheel reading as a cog.
    c2.globalCompositeOperation = 'lighter';
    c2.globalAlpha = 0.55 + Math.sin(this.rot * 3) * 0.2;
    c2.strokeStyle = '#bdf0ff'; c2.lineWidth = 2.2;
    c2.beginPath(); c2.arc(0, 0, R * 1.02, 0, 7); c2.stroke();
    c2.globalAlpha = 0.9; c2.strokeStyle = '#ffffff'; c2.lineWidth = 1;
    // arcs jumping tooth to tooth
    const AN = 12;
    for (let i = 0; i < 3; i++) {
      const j = ((this.arcSeed || 0) + i * 5) % AN;
      const a0 = (j / AN) * Math.PI * 2, a1 = ((j + 1) / AN) * Math.PI * 2;
      const mid = (a0 + a1) / 2, bulge = R * (1.1 + ((j * 7) % 5) / 16);
      c2.beginPath();
      c2.moveTo(Math.cos(a0) * R * 1.14, Math.sin(a0) * R * 1.14);
      c2.quadraticCurveTo(Math.cos(mid) * bulge * 1.32, Math.sin(mid) * bulge * 1.32,
                          Math.cos(a1) * R * 1.14, Math.sin(a1) * R * 1.14);
      c2.stroke();
    }
    c2.globalAlpha = 0.6; c2.fillStyle = '#9fe8ff';
    c2.beginPath(); c2.arc(0, 0, R * 0.14, 0, 7); c2.fill();
    c2.restore();
  }
}
// ===========================================================================
// THE CHAINSAW RIG. A blade on a rail, running back and forth inside its own
// housing — and the thing that makes it read as dangerous is not the blade, it
// is the SPARKS. A saw that slides silently along a bar is a moving rectangle.
// One that throws a rooster-tail of sparks off the rail while it travels, and
// slams into its housing at each end hard enough to shower the floor, is a
// machine that is working, and working is what makes it frightening.
//
// So there are two spark sources, and they are different on purpose:
//   TRAVEL   a thin continuous spray off the shoe where the carriage grinds
//            the rail, thrown BACKWARD from the direction of travel, scaled by
//            how fast it is going — so it thins out at the ends of the stroke
//            where the saw slows, and fans at the middle where it is quickest.
//   IMPACT   a hard burst at each end when it hits the box, plus a screech and
//            a kick of the camera. It fires once per arrival, latched, because
//            an impact that repeats every frame while the saw sits at the end
//            is not an impact, it is a fountain.
//
// It travels on the same eased path the moving platforms use, so it is always
// slowest at the ends: there is always a window to cross, and the window is
// visible from across the room because the sparks stop.
// ===========================================================================
class SawRig {
  constructor(tx, ty, spec) {
    this.r = 15;                                   // blade radius
    this.x0 = tx * TILE + TILE / 2;
    this.y0 = ty * TILE - 2;                       // the blade rides on the deck
    this.x1 = this.x0 + ((spec && spec[0]) || 0) * TILE;
    this.y1 = this.y0 + ((spec && spec[1]) || 0) * TILE;
    this.per = Math.max(1.6, (spec && spec[2]) || 3.2);
    this.ph = Math.random() * this.per;
    const u0 = (1 - Math.cos(this.ph / this.per * Math.PI * 2)) / 2;
    this.x = this.x0 + (this.x1 - this.x0) * u0;
    this.y = this.y0 + (this.y1 - this.y0) * u0;
    this.spin = 0; this.sp = 0; this.end = 0; this.hitT = 0;
  }
  update(dt) {
    const px = this.x, py = this.y;
    this.ph += dt;
    const u = (1 - Math.cos(this.ph / this.per * Math.PI * 2)) / 2;
    this.x = this.x0 + (this.x1 - this.x0) * u;
    this.y = this.y0 + (this.y1 - this.y0) * u;
    const dx = this.x - px, dy = this.y - py;
    this.sp = Math.hypot(dx, dy) / Math.max(dt, 1e-4);
    this.spin += dt * (26 + this.sp * 0.06);       // the blade never stops
    if (this.hitT > 0) this.hitT -= dt;
    // THE ENDS OF THE STROKE. Latched, so the shower fires on arrival and not
    // once per frame for as long as it rests there.
    const at = u < 0.02 ? -1 : u > 0.98 ? 1 : 0;
    if (at && at !== this.end) {
      this.end = at;
      this.hitT = 0.22;
      const dirx = this.x1 - this.x0, diry = this.y1 - this.y0;
      const n = Math.hypot(dirx, diry) || 1;
      const sx = this.x + dirx / n * this.r * at, sy = this.y + diry / n * this.r * at;
      for (let i = 0; i < 16; i++) {
        const a = Math.atan2(-diry, -dirx) * at + rnd(-1.1, 1.1);
        const v = rnd(90, 320);
        addPart(sx, sy, Math.cos(a) * v, Math.sin(a) * v - rnd(0, 60),
          rnd(0.22, 0.6), i % 3 ? '#ffb347' : '#fff3d0', rnd(1.5, 3), 780, true);
      }
      // only when the player can actually see it hit — a saw grinding in a
      // room she has walked away from should not shake her camera
      if (Math.abs(this.x - cam.x - 480) < 620 && Math.abs(this.y - cam.y - 270) < 400) {
        sfx('grind'); cam.shake = Math.max(cam.shake, 3.5);
      }
    } else if (!at) this.end = 0;
    // THE TRAVELLING SPRAY, off the shoe, thrown back down the rail
    if (this.sp > 22 && parts.length < 420) {
      const k = clamp(this.sp / 260, 0, 1);
      const n = Math.random() < k ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const back = Math.atan2(-dy, -dx) + rnd(-0.5, 0.5);
        const v = rnd(40, 150) * (0.4 + k);
        addPart(this.x - dx / Math.max(1, Math.hypot(dx, dy)) * this.r * 0.8,
          this.y + this.r * 0.55,
          Math.cos(back) * v, Math.sin(back) * v - rnd(10, 70),
          rnd(0.14, 0.4), Math.random() < 0.3 ? '#fff3d0' : '#ffa235', rnd(1, 2.2), 900, true);
      }
    }
    if (!player.dead && player.iT <= 0
        && Math.abs(player.x + player.w / 2 - this.x) < this.r + player.w * 0.4
        && Math.abs(player.y + player.h / 2 - this.y) < this.r + player.h * 0.4) {
      player.hurt(DF().edmg, this.x);
      burst(this.x, this.y, 10, '#ff8a4a', 240, 0.5, 700, 3, true);
    }
  }
  draw(c) {
    const P = PAL[G.roomDef.zone];
    // the rail it runs on, and the housing box at each end
    c.save();
    c.strokeStyle = 'rgba(120,132,148,0.55)'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(this.x0, this.y0); c.lineTo(this.x1, this.y1); c.stroke();
    c.strokeStyle = 'rgba(40,48,58,0.9)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(this.x0, this.y0); c.lineTo(this.x1, this.y1); c.stroke();
    for (const e of [[this.x0, this.y0, -1], [this.x1, this.y1, 1]]) {
      const hot = this.hitT > 0 && this.end === e[2] ? this.hitT / 0.22 : 0;
      c.fillStyle = '#2b3340'; rr(c, e[0] - 9, e[1] - 13, 18, 26, 4); c.fill();
      c.strokeStyle = hot ? '#ffd08a' : 'rgba(150,165,185,0.5)';
      c.lineWidth = hot ? 2.5 : 1.5;
      rr(c, e[0] - 9, e[1] - 13, 18, 26, 4); c.stroke();
      c.fillStyle = 'rgba(90,100,115,0.9)';
      c.fillRect(e[0] - 5, e[1] - 9, 3, 3); c.fillRect(e[0] + 2, e[1] + 6, 3, 3);
    }
    c.restore();
    // THE CARRIAGE. Drawn as a body with the blade in FRONT of it, because the
    // first version drew ten open strokes on a bare disc and what came out was
    // a white star — a sea urchin on a wire, not a machine. A saw blade is a
    // solid plate with teeth cut into its rim, and the teeth only read as teeth
    // if the plate behind them is there to be cut from.
    const dirx = (this.x1 - this.x0) || 1, diry = this.y1 - this.y0;
    const along = Math.atan2(diry, dirx);
    const back = this.sp > 4 ? (this.x < (this.x0 + this.x1) / 2 ? -1 : 1) : -1;
    c.save();
    c.translate(this.x, this.y);
    // motor body, sitting behind the blade along the rail
    c.save();
    c.rotate(along);
    // TRAILING the blade, not hidden behind it. At first the body was drawn
    // centred on the hub, where a blade of the same size covers it completely —
    // so the rig read as a disc floating on a wire with no machine driving it.
    const bx = back * (this.r * 0.95) - 11;
    c.fillStyle = '#232a34';
    rr(c, bx, -10, 22, 20, 4); c.fill();
    c.strokeStyle = 'rgba(150,168,190,0.55)'; c.lineWidth = 1.4;
    rr(c, bx, -10, 22, 20, 4); c.stroke();
    c.fillStyle = '#39424f';
    for (let i2 = 0; i2 < 3; i2++) c.fillRect(bx + 4 + i2 * 5, -6, 3, 12);
    // the drive arm reaching from the motor to the hub
    c.strokeStyle = 'rgba(170,186,206,0.7)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(bx + (back > 0 ? 0 : 22), 0); c.lineTo(0, 0); c.stroke();
    c.fillStyle = P.glow;
    c.globalAlpha = 0.55 + Math.sin(this.spin * 4) * 0.25;
    c.fillRect(bx + 2, 5, 18, 2);
    c.globalAlpha = 1;
    c.restore();
    // the blade: one filled plate, teeth cut around its rim
    c.save();
    c.rotate(this.spin);
    const R = this.r, root = R * 0.74, N = 12;
    c.beginPath();
    for (let i2 = 0; i2 < N; i2++) {
      const a0 = i2 / N * Math.PI * 2, a1 = (i2 + 0.42) / N * Math.PI * 2, a2 = (i2 + 1) / N * Math.PI * 2;
      if (!i2) c.moveTo(Math.cos(a0) * root, Math.sin(a0) * root);
      else c.lineTo(Math.cos(a0) * root, Math.sin(a0) * root);
      c.lineTo(Math.cos(a0 + 0.02) * R, Math.sin(a0 + 0.02) * R);   // leading edge
      c.lineTo(Math.cos(a1) * R, Math.sin(a1) * R);
      c.lineTo(Math.cos(a2) * root, Math.sin(a2) * root);
    }
    c.closePath();
    const bg = c.createLinearGradient(-R, -R, R, R);
    bg.addColorStop(0, '#aab6c4'); bg.addColorStop(0.5, '#7c8896'); bg.addColorStop(1, '#5d6874');
    c.fillStyle = bg; c.fill();
    c.strokeStyle = 'rgba(240,248,255,0.55)'; c.lineWidth = 1; c.stroke();
    // hub and bolts
    c.fillStyle = '#39424f';
    c.beginPath(); c.arc(0, 0, R * 0.3, 0, 7); c.fill();
    c.fillStyle = '#1b2029';
    c.beginPath(); c.arc(0, 0, R * 0.12, 0, 7); c.fill();
    c.fillStyle = 'rgba(200,214,230,0.7)';
    for (let i2 = 0; i2 < 3; i2++) {
      const a3 = i2 / 3 * Math.PI * 2;
      c.beginPath(); c.arc(Math.cos(a3) * R * 0.46, Math.sin(a3) * R * 0.46, 1.4, 0, 7); c.fill();
    }
    c.restore();
    // it is turning far too fast to see: one soft ring sells the speed
    c.save();
    c.globalAlpha = 0.22;
    c.strokeStyle = '#e8f0fa'; c.lineWidth = R * 0.24;
    c.beginPath(); c.arc(0, 0, R * 0.88, 0, 7); c.stroke();
    c.restore();
    c.restore();
    // heat glow, brighter the harder it is working
    c.save();
    c.globalCompositeOperation = 'lighter';
    const k = 0.10 + clamp(this.sp / 300, 0, 1) * 0.16 + (this.hitT > 0 ? 0.3 : 0);
    const g2 = c.createRadialGradient(this.x, this.y, 2, this.x, this.y, this.r * 2.4);
    g2.addColorStop(0, 'rgba(255,176,90,' + k.toFixed(3) + ')');
    g2.addColorStop(1, 'rgba(255,120,40,0)');
    c.fillStyle = g2;
    c.beginPath(); c.arc(this.x, this.y, this.r * 2.4, 0, 7); c.fill();
    c.restore();
  }
}
class MovingPlat {
  constructor(tx, ty, spec) {
    // spec: [dxTiles, dyTiles, periodSec, widthTiles?]
    const wT = (spec && spec[3]) || 3;
    this.w = wT * TILE; this.h = 12;
    this.x0 = tx * TILE; this.y0 = ty * TILE - this.h;
    this.x1 = this.x0 + ((spec && spec[0]) || 0) * TILE;
    this.y1 = this.y0 + ((spec && spec[1]) || 0) * TILE;
    this.per = Math.max(1.4, (spec && spec[2]) || 3.4);
    this.ph = 0; this.x = this.x0; this.y = this.y0;
    this.fdx = 0; this.fdy = 0;
  }
  update(dt) {
    this.ph += dt;
    const k = (1 - Math.cos(this.ph / this.per * Math.PI * 2)) / 2;   // 0→1→0
    const nx = this.x0 + (this.x1 - this.x0) * k;
    const ny = this.y0 + (this.y1 - this.y0) * k;
    this.fdx = nx - this.x; this.fdy = ny - this.y;
    this.x = nx; this.y = ny;
  }
  draw(c) {
    const P = PAL[G.roomDef.zone];
    const moving = Math.abs(this.fdx) + Math.abs(this.fdy) > 0.01;
    c.save();
    // the rail slab wears the same authored deck the built world does, so a
    // moving platform never reads as a different material to stand on
    if (typeof drawDeck === 'function' && typeof platVariant === 'function'
        && drawDeck(c, this.x, this.y - 5, this.w, 30, platVariant())) {
      // its own rail line and thruster wash still tell you it TRAVELS
      c.strokeStyle = 'rgba(150,170,190,0.14)'; c.lineWidth = 2;
      c.setLineDash([4, 7]);
      c.beginPath();
      c.moveTo(this.x0 + this.w / 2, this.y0 + this.h / 2);
      c.lineTo(this.x1 + this.w / 2, this.y1 + this.h / 2);
      c.stroke(); c.setLineDash([]);
      if (moving) {
        const dir = Math.atan2(this.fdy, this.fdx) + Math.PI;
        const jx = this.x + this.w / 2 + Math.cos(dir) * this.w * 0.5;
        const jy = this.y + this.h / 2 + Math.sin(dir) * 8;
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5;
        const jg = c.createRadialGradient(jx, jy, 1, jx, jy, 14);
        jg.addColorStop(0, P.glow); jg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = jg; c.beginPath(); c.arc(jx, jy, 14, 0, 7); c.fill();
        c.restore();
      }
      c.restore();
      return;
    }
    // rail ghost: the travel line, faint, so the timing is readable
    c.strokeStyle = 'rgba(150,170,190,0.14)'; c.lineWidth = 2;
    c.setLineDash([4, 7]);
    c.beginPath();
    c.moveTo(this.x0 + this.w / 2, this.y0 + this.h / 2);
    c.lineTo(this.x1 + this.w / 2, this.y1 + this.h / 2);
    c.stroke(); c.setLineDash([]);
    // slab body: dark metal, chamfered, with the zone's light on its lip
    const g = c.createLinearGradient(0, this.y, 0, this.y + this.h);
    g.addColorStop(0, '#4a5462'); g.addColorStop(0.35, '#2c323c'); g.addColorStop(1, '#171b22');
    c.fillStyle = g; rr(c, this.x, this.y, this.w, this.h, 4); c.fill();
    c.strokeStyle = '#0c0f14'; c.lineWidth = 2; rr(c, this.x, this.y, this.w, this.h, 4); c.stroke();
    // emissive top strip — her landing surface, always readable
    c.fillStyle = P.glow; c.globalAlpha = 0.85;
    rr(c, this.x + 3, this.y + 1.5, this.w - 6, 3, 2); c.fill();
    c.globalAlpha = 1;
    // side thruster wash when it moves
    if (moving) {
      const dir = Math.atan2(this.fdy, this.fdx) + Math.PI;
      const jx = this.x + this.w / 2 + Math.cos(dir) * this.w * 0.5;
      const jy = this.y + this.h / 2 + Math.sin(dir) * 8;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5;
      const jg = c.createRadialGradient(jx, jy, 1, jx, jy, 14);
      jg.addColorStop(0, P.glow); jg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = jg; c.beginPath(); c.arc(jx, jy, 14, 0, 7); c.fill();
      c.restore();
    }
    // underside vents
    c.fillStyle = 'rgba(8,10,14,0.8)';
    for (let i = 0; i < Math.floor(this.w / 22); i++)
      c.fillRect(this.x + 8 + i * 22, this.y + this.h - 3, 10, 2);
    c.restore();
  }
}
// ride resolve, run every frame after her physics: standing on a slab means
// the slab's motion is hers too. One-way from above; never a head bonk.
function platRide(p) {
  if (!G.plats || !G.plats.length || p.dead) return;
  for (const pl of G.plats) {
    if (p.x + p.w <= pl.x + 2 || p.x >= pl.x + pl.w - 2) continue;
    const feet = p.y + p.h;
    const catchBand = 12 + Math.abs(pl.fdy) * 2;
    if (p.vy >= -1 && feet >= pl.y - 5 && feet <= pl.y + catchBand) {
      if (!p.on && p.vy > 420) {                 // real landing: squash + dust
        p.landT = p.vy > 700 ? 0.22 : 0.12; p.land0 = p.landT;
        sfx('land');
        burst(p.x + p.w / 2, pl.y, 6, '#9fb8c8', 90, 0.35, 500, 2);
      }
      p.x += pl.fdx;
      p.y = pl.y - p.h;
      p.vy = Math.min(p.vy, Math.max(0, pl.fdy * 60));
      p.on = true; p.coyote = 0.1;
      p.airJumps = hasMod('djump') ? (hasSkill('triple') ? 2 : 1) : 0;
      return;
    }
  }
}

// ================= PICKUPS =================
class Scrap {
  constructor(x, y, val) {
    this.x = x; this.y = y; this.w = 10; this.h = 10; this.val = val;
    this.vx = rnd(-130, 130); this.vy = rnd(-320, -120); this.t = rnd(0, 9);
    this.dead = false;
  }
  update(dt) {
    this.t += dt;
    if (this.rest === undefined) this.rest = 0;
    // A shard that lands in spikes, or on a ledge you cannot stand on, used to be
    // gone for good. After a moment at rest it drifts to you instead.
    const settled = this.rest > 1.2;
    if (settled && !player.dead && dist2(this.x, this.y, player.x, player.y) < 320 * 320) {
      const dx = player.x + 12 - this.x, dy = player.y + 18 - this.y, d = Math.hypot(dx, dy) || 1;
      this.x += dx / d * 300 * dt; this.y += dy / d * 300 * dt;
      this.vx = 0; this.vy = 0;
      if (chance(dt * 8)) addPart(this.x, this.y, 0, -30, 0.4, '#ffd76a', 1.6, 0, true);
      if (aabb(this, player)) { this.dead = true; G.save.scrap += this.val; sfx('pick'); }
      return;
    }
    if (hasCrest('magnet') && !player.dead && dist2(this.x, this.y, player.x, player.y) < 210 * 210) {
      const dx = player.x + 12 - this.x, dy = player.y + 18 - this.y, d = Math.hypot(dx, dy) || 1;
      this.vx += dx / d * 1900 * dt; this.vy += dy / d * 1900 * dt;
    } else this.vy += 900 * dt;
    const pv = this.vy;
    const col = moveEnt(this, dt);
    if (col.d) { this.vy = pv < -50 ? 0 : -pv * 0.35; this.vx *= 0.82; }
    if (col.l || col.r) this.vx = 0;
    this.rest = (col.d && Math.abs(this.vy) < 30 && Math.abs(this.vx) < 20) ? this.rest + dt : 0;
    if (!player.dead && aabb(this, player)) {
      this.dead = true; G.save.scrap += this.val; sfx('pick');
      addPart(this.x, this.y, 0, -60, 0.4, '#ffd76a', 3, 0, true);
    }
  }
  draw(c) {
    const s = this.val >= 15 ? 6 : 4;
    c.save(); c.translate(this.x + 5, this.y + 5); c.rotate(this.t * 3);
    c.shadowColor = '#ffd76a'; c.shadowBlur = 8; c.fillStyle = '#ffd76a';
    c.fillRect(-s / 2, -s / 2, s, s);
    c.restore(); c.shadowBlur = 0;
  }
}
// THE HUSK — what is left standing where HZD-99 fell.
// Hollow Knight leaves a shade you must fight. A repair unit leaves something
// worse and more personal: her own previous chassis, still upright, still running
// the last orders she gave it, with the broadcast already behind its eyes. It
// holds the scrap and the charge she was carrying.
// Two ways to take it back, and they are not equal — walk into it and it gives up
// the scrap, or play the Song first and it remembers itself, releasing the charge
// as well. The recovery uses the one power that is hers.
class Pouch {
  constructor(x, y, amount) {
    this.x = x; this.y = y; this.w = 22; this.h = 30; this.amount = amount;
    this.vy = 0; this.vx = 0; this.dead = false; this.t = 0;
    this.calmed = false;                 // has the Song reached it
    this.volts = (G.save.pouchVolts || 0);
    this.drift = chance(0.5) ? 1 : -1;
    this.hypnoT = 0; this.stagT = 0; this.kind = 'husk';
  }
  update(dt) {
    this.t += dt;
    // the Song calms it — the same call that charms mimics
    if (!this.calmed && this.hypnoT > 0) {
      this.calmed = true;
      burst(this.x + 11, this.y + 12, 22, ELEM.murr.glow, 240, 0.8, -40, 3, true);
      sfx('powerUp'); G.toast(t('husk_calm'));
    }
    // it paces where it fell until it is calmed, then waits for her
    if (!this.calmed) {
      this.vx = this.drift * 22 * (0.6 + Math.sin(this.t * 1.6) * 0.4);
      if (!groundAhead(this, this.drift)) this.drift *= -1;
    } else this.vx = 0;
    this.vy += 900 * dt;
    const col = moveEnt(this, dt);
    if (col.l || col.r) this.drift *= -1;
    if (!player.dead && aabb(this, player)) {
      this.dead = true;
      G.save.scrap += this.amount;
      let msg = t('pouch_back') + '  +' + this.amount;
      if (this.calmed && this.volts > 0) {
        player.gainVolts(this.volts);
        msg += '  ·  +' + this.volts + '⚡';
      }
      G.save.pouch = null; G.save.pouchVolts = 0;
      sfx('bench'); G.toast(msg);
      burst(this.x + 11, this.y + 14, 26, this.calmed ? ELEM.murr.glow : '#ffd76a', 300, 0.7, 60, 4, true);
    }
  }
  draw(c) {
    const cx = this.x + 11, sway = Math.sin(this.t * (this.calmed ? 1.4 : 3.4)) * (this.calmed ? 1 : 2.2);
    contactShadow(c, cx, this.y + this.h, 11, 0.4);
    c.save(); c.translate(cx + sway * 0.3, this.y + this.h);
    // hollow chassis: her outline, emptied out
    const g = c.createLinearGradient(-9, -28, 8, 2);
    g.addColorStop(0, this.calmed ? '#6f8f96' : '#4a5560');
    g.addColorStop(1, '#151c24');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-8, 0); c.lineTo(-9, -16);
    c.quadraticCurveTo(-9, -26, 0, -26);
    c.quadraticCurveTo(9, -26, 9, -16); c.lineTo(8, 0);
    c.closePath(); c.fill();
    // ears, so it is unmistakably her shape
    c.beginPath(); c.moveTo(-7, -22); c.lineTo(-9, -31); c.lineTo(-2, -24); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(7, -22); c.lineTo(9, -31); c.lineTo(2, -24); c.closePath(); c.fill();
    // the eyes are the whole point: red while the broadcast still has it,
    // her own teal once the Song has reached it
    const col = this.calmed ? ELEM.murr.col : '#ff2f4f';
    c.fillStyle = col; c.shadowColor = col;
    c.shadowBlur = 10 + Math.sin(this.t * 5) * 5;
    c.fillRect(-6, -20, 4.2, 2.6); c.fillRect(1.8, -20, 4.2, 2.6);
    c.shadowBlur = 0;
    // the scrap it is holding, visible in the chest cavity
    c.fillStyle = '#ffd76a'; c.shadowColor = '#ffd76a'; c.shadowBlur = 8;
    c.fillRect(-2.4, -13, 4.8, 4.8);
    c.shadowBlur = 0;
    c.restore();
    if (this.calmed) {   // it hums back
      c.save(); c.globalAlpha = 0.5 + Math.sin(this.t * 4) * 0.3;
      ftxt('♪', cx + 12, this.y - 4, 12, ELEM.murr.glow);
      c.restore(); c.globalAlpha = 1;
    }
  }
}

// glowing relic drop — grab it before you forget it
class RelicPickup {
  constructor(x, y, id) {
    this.x = x; this.y = y; this.w = 20; this.h = 20; this.id = id;
    this.vx = rnd(-60, 60); this.vy = -280; this.t = 0; this.dead = false;
  }
  update(dt) {
    this.t += dt;
    this.vy += 700 * dt;
    const col = moveEnt(this, dt);
    if (col.d) { this.vy = 0; this.vx *= 0.8; }
    if (chance(0.25)) addPart(this.x + 10, this.y + 10, rnd(-25, 25), rnd(-50, -10), 0.4, '#ffd76a', 2, 0, true);
    if (!player.dead && aabb(this, player)) {
      this.dead = true;
      G.grantRelic(this.id);
    }
  }
  draw(c) {
    const bob = Math.sin(this.t * 4) * 3;
    c.save(); c.translate(this.x + 10, this.y + 10 + bob);
    c.shadowColor = '#ffd76a'; c.shadowBlur = 14;
    c.fillStyle = '#2c2517'; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fill();
    c.strokeStyle = '#ffd76a'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.stroke();
    c.shadowBlur = 0;
    c.font = '700 11px "Segoe UI", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#ffd76a'; c.fillText(RELIC_ICONS[this.id] || '◆', 0, 1);
    c.restore();
  }
}
// ================= ENEMIES =================
function drawTurretLock(c, e, cx) {
  const cy = e.y + e.h / 2;
  const k = 1 - clamp(e.lockT / 0.55, 0, 1);            // 0 -> 1 across the lock
  const px = player ? player.x + player.w / 2 : cx, py = player ? player.y + player.h / 2 : cy;
  c.save();
  // the beam finds you: faint and wide at first, thin and bright at the end
  c.globalAlpha = 0.10 + k * 0.5;
  c.strokeStyle = TELL_COL; c.lineWidth = 3.5 - k * 2.2;
  c.setLineDash([9, 7]); c.lineDashOffset = -performance.now() / 45;
  c.beginPath(); c.moveTo(cx, cy); c.lineTo(px, py); c.stroke();
  c.setLineDash([]);
  // and the eye itself, quickening
  c.globalAlpha = 0.55 + Math.sin(e.anim * (16 + k * 26)) * 0.35;
  c.fillStyle = TELL_COL; c.shadowColor = TELL_COL; c.shadowBlur = 12;
  c.beginPath(); c.arc(cx, cy - e.h * 0.34, 2.4 + k * 2.2, 0, 7); c.fill();
  c.shadowBlur = 0;
  c.restore();
  c.globalAlpha = 1;
}
// Rising, but gently: at the deepest point a machine has 1.7x the plating and
// about a fifth more pace. Difficulty is meant to arrive mostly through what
// they DO and how they are combined — this is the floor under that, not the
// mechanism itself.
const ZONE_K = { A: 1.0, B: 1.15, C: 1.32, D: 1.5, E: 1.7, X: 1.6 };
// ===========================================================================
// THE MACHINES LEARN. Zone scaling makes them tougher the deeper you go; this
// makes them CLEVERER the stronger you get, which is a different axis and the
// more interesting one. A player who has taken four powers and three guardians
// is not asking for enemies with more health — they are asking to be read.
//
// What rises with it: how soon they commit, whether they aim where she IS or
// where she is GOING, whether they follow up, whether they track her while
// winding up. What never rises with it: THE LENGTH OF THE WARNING. Difficulty
// that comes from shortening the tell is difficulty bought by making the game
// unreadable, and that trade is never worth taking — every attack stays as
// readable at full cunning as it was in the first room.
// ===========================================================================
function foeIQ() {
  const sv = typeof G !== 'undefined' && G.save;
  if (!sv) return 0;
  let mods = 0; for (const k in (sv.abil || {})) if (sv.abil[k]) mods++;
  let won = 0;
  for (const k of ['bossGlitch', 'bossBrood', 'bossAtlas', 'bossZero', 'bossPrism'])
    if (sv.flags && sv.flags[k]) won++;
  const skills = (sv.skills || []).length;
  // four powers and three guardians is about three quarters of the way up
  return clamp(mods * 0.11 + won * 0.10 + skills * 0.035, 0, 1);
}
// CUNNING IS ONE AXIS; MUSCLE IS THE OTHER. Getting smarter alone eventually
// reads as an enemy that dodges well and still dies in two hits — the fight
// gets fussier without getting bigger. This is the second dial: the same
// machines, reinforced, as the virus gets more of the city to work with.
// Multiplied with the zone curve, so depth and progress compound instead of
// competing (a first-kingdom frame late in a run is still the weakest thing in
// the game; a Nest frame late in a run is the hardest).
function foePow() { return 1 + foeIQ() * 0.55; }
// AND MIX AND MATCH. A flat multiplier makes every enemy the same enemy with
// bigger numbers. Traits make the same room play differently twice: one crawler
// is quick, the next is armoured, the one after goes off when it dies. Each is
// marked on the body so it is read before it is discovered, and none of them
// touches a telegraph — an enemy is never harder because it warned you less.
const TRAITS = {
  swift:    { spd: 1.32, hp: 0.92, col: '#7de8ff' },
  tough:    { spd: 0.9,  hp: 1.75, col: '#c8b28a' },
  volatile: { spd: 1.06, hp: 0.9,  col: '#ff9a5a' },
};
const TRAIT_KEYS = ['swift', 'tough', 'volatile'];
function rollTraits(iq) {
  // nothing at all early; one somewhere past the second power; a second one
  // only once the player is genuinely equipped
  const out = [];
  if (iq < 0.2) return out;
  const chance1 = 0.18 + iq * 0.42;
  if (Math.random() < chance1) out.push(TRAIT_KEYS[Math.floor(Math.random() * 3)]);
  if (iq > 0.62 && Math.random() < (iq - 0.62) * 1.1) {
    const t2 = TRAIT_KEYS[Math.floor(Math.random() * 3)];
    if (out.indexOf(t2) < 0) out.push(t2);
  }
  return out;
}
// where she will BE, not where she is — the single most human-feeling thing a
// simple enemy can do, and it costs one line
function leadX(px, k) {
  return px + (typeof player !== 'undefined' && player ? player.vx : 0) * k;
}
const EKIND = {
  crawler: { w: 28, h: 20, hp: 30, spd: 62 },
  guard: { w: 30, h: 22, hp: 44, spd: 52 },
  flier: { w: 26, h: 22, hp: 24, spd: 120 },
  turret: { w: 28, h: 30, hp: 45, spd: 0 },
  hopper: { w: 26, h: 24, hp: 36, spd: 180 },
  blob: { w: 34, h: 26, hp: 52, spd: 30 },
  bat: { w: 24, h: 18, hp: 18, spd: 150 },
  // THE BREAKER — the Data Conduits' own machine (kingdom 2). spd is the
  // WAVE's speed, not the body's: the drum is bolted where it stands.
  surge: { w: 30, h: 24, hp: 40, spd: 250 },
  // THE KILN VENT — the Foundry's own machine (kingdom 3). spd is the
  // PLUME's rise speed, not the body's: the pot is plumbed where it stands.
  kiln: { w: 30, h: 26, hp: 42, spd: 460 },
  // THE RIME COIL — the Archives' own machine (kingdom 4). spd is the
  // RING's growth speed, not the body's: the coil is bolted where it stands.
  rime: { w: 28, h: 26, hp: 44, spd: 300 },
  // THE NEST SNARE — the Virus Nest's own machine (kingdom 5). spd is the
  // REEL's base pull, not the body's: the polyp is rooted where it grew.
  snare: { w: 28, h: 26, hp: 46, spd: 720 },
  sage: { w: 26, h: 42, hp: 150, spd: 170 },
};
class Enemy {
  constructor(kind, x, y) {
    const k = EKIND[kind];
    this.kind = kind; this.x = x; this.y = y; this.w = k.w; this.h = k.h;
    this.hypnoT = 0; this.stagT = 0; this.faceVis = 1;
    // EVERY TIMER STARTS AT A NUMBER. The new wind-ups read `(this.atkCD -= dt)`
    // and `this.crouchT <= 0` — and on an undefined field the first gives NaN
    // (and NaN <= 0 is false, forever) while the second is false immediately.
    // Every one of them would have failed silently in the shipped game exactly
    // as it failed in the harness: the enemy simply never winds up, with no
    // error anywhere. Declared here, once, where the fields belong.
    this.iq = foeIQ();
    this.atkCD = rnd(0.5, 1.6);
    this.coilT = 0; this.lungeT = 0; this.windedT = 0;
    this.holdT = 0; this.diveT = 0; this.riseT = 0;
    this.crouchT = 0; this.gathered = false; this.wasAir = false; this.burst = 0;
    this.gatherT = 0; this.stepT = 0; this.denied = 0; this.pureM = 0;
    // THE WORLD USED TO BE FLAT. EKIND is one global table, so a crawler in the
    // last kingdom was byte-identical to the one in the first — and the last
    // NEW enemy type appears at the midpoint, which left the back half of the
    // game escalating by terrain alone. The frames are the same machines; the
    // deeper you go, the more the virus has done to them.
    const zk = ZONE_K[(G.roomDef && G.roomDef.zone) || 'A'] || 1;
    this.zoneK = zk;
    const iq0 = foeIQ();
    this.traits = rollTraits(iq0);
    let th = 1, ts = 1;
    for (const tr of this.traits) { th *= TRAITS[tr].hp; ts *= TRAITS[tr].spd; }
    const pw = foePow();
    this.hp = Math.round(k.hp * DF().ehp * zk * pw * th);
    this.hpMax0 = this.hp;
    this.spd = k.spd * DF().espd * (0.88 + zk * 0.12) * (0.94 + pw * 0.06) * ts;
    this.vx = 0; this.vy = 0; this.dir = chance(0.5) ? 1 : -1;
    this.t = rnd(0.5, 2); this.sx = x; this.sy = y; this.hurtT = 0; this.dead = false; this.anim = rnd(0, 9);
    this.kbT = 0; this.tr = [];
  }
  update(dt) {
    this.anim += dt; this.hurtT -= dt;
    // cheap, and it means a machine that was in the room before you took a
    // power is as sharp as one spawned after it
    if ((this.iqT = (this.iqT || 0) - dt) <= 0) { this.iqT = 2.5; this.iq = foeIQ(); }
    // summoned brood expires: called minions burn out after their tour
    if (this.expireT != null && !this.dead) {
      this.expireT -= dt;
      if (this.expireT <= 0) { this.die(0, -0.5); return; }
    }
    // turn toward where we are going, in time rather than in frames drawn
    const wantF = (this.kind === 'flier' ? Math.sign(this.vx) || 1 : this.dir) || 1;
    this.faceVis += clamp(wantF - this.faceVis, -dt * 5.5, dt * 5.5);
    // CURED. On ground the player's mercy has bought back, machines wake up as
    // what they were built to be. They potter about, they will not touch her,
    // and their sensor burns cyan instead of red. This is the whole reward for
    // choosing LEFT, and it has to be visible from across the room.
    if (this.calm) {
      this.stagT = 0; this.hypnoT = 1e9;
      this.t -= dt;
      if (this.t <= 0) { this.dir = -this.dir || 1; this.t = rnd(1.6, 4.2); }
      this.vx = this.dir * this.spd * 0.26;
      this.vy += 900 * dt;
      const col = moveEnt(this, dt);
      if (col.l || col.r) this.dir = -this.dir;
      if (chance(dt * 2.2)) addPart(this.x + this.w / 2 + rnd(-5, 5), this.y - 2, rnd(-10, 10), -22, 0.7, '#37ffd0', 2, -20, true);
      return;
    }
    // THE PACK CHANGED SIDES. Handled before every other behaviour and it
    // returns, so nothing below it runs: not the hunt, not the wind-up, and —
    // because touch damage lives at the BOTTOM of this method — not the
    // contact hit either. A friendly wolf you cannot walk through is not
    // friendly.
    if (typeof wolfTameStep === 'function' && wolfTameStep(this, dt)) return;
    // charmed by the Song: it keeps the body and quiets the orders
    if (this.hypnoT > 0) {
      this.hypnoT -= dt; this.stagT = 0;
      this.vx = 0; this.vy += 900 * dt;
      moveEnt(this, dt);
      if (Math.random() < dt * 6) burst(this.x + this.w / 2, this.y - 4, 1, ELEM.murr.glow, 40, 0.6, -30, 2, true);
      return;
    }
    if (this.stagT > 0) { this.stagT -= dt; this.vx = 0; return; }
    // light trail — infected machines smear glowing red light as they move
    const mx = this.x + this.w / 2, my = this.y + this.h / 2;
    if (!this.tr.length || Math.hypot(mx - this.tr[0].x, my - this.tr[0].y) > 3) {
      this.tr.unshift({ x: mx, y: my });
      if (this.tr.length > 9) this.tr.pop();
      if ((Math.abs(this.vx) > 30 || Math.abs(this.vy) > 30) && chance(0.3))
        addPart(mx + rnd(-4, 4), my + rnd(-4, 4), -this.vx * 0.12, -this.vy * 0.12 - 14, 0.4, '#ff4f6d', 2.2, 0, true);
    } else if (this.tr.length > 1 && chance(0.25)) this.tr.pop();
    // knocked back: physics only — can be launched into spikes or off ledges
    if (this.kbT > 0) {
      this.kbT -= dt;
      this.vy += 2000 * dt;
      moveEnt(this, dt);
      this.vx *= Math.pow(0.02, dt);
      if (onSpike(this)) { this.die(Math.sign(this.vx) || 1, -0.4); return; }
      if (this.y > G.roomDef.h * TILE + 40) { this.die(0, 1); return; }
      if (!player.dead && aabb(this, player)) player.hurt(DF().edmg, this.x + this.w / 2, this.kind + '.knockback');
      return;
    }
    const px = player.x + player.w / 2, py = player.y + player.h / 2;
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    switch (this.kind) {
      // EVERY FRAME NOW ASKS ITS OWN QUESTION. They used to share this case
      // label — literally the same code, one of them slower — which is why the
      // roster read as one enemy in five costumes. A cast needs each member to
      // ask something different, or one of them is redundant.
      //
      // The crawler asks: CAN YOU READ A WIND-UP? It patrols, and inside its
      // reach it stops, coils for TELL_FAST, and lunges — and the lunge leaves
      // it winded, which is where the player is meant to hit it.
      // THE GUARD asks the question the whole game is built on and nothing had
      // ever asked: CAN YOU WAIT? It holds a plate up and takes almost nothing
      // through it, and it drops that plate only while it is winded from its
      // own lunge. Mashing does not work; the punish window does. It is a
      // crawler with one field changed — no new art, no new AI — which is the
      // cheapest way there is to teach patience before a boss demands it.
      case 'guard':
      case 'crawler': {
        this.vy += 2000 * dt;
        this.guard = this.kind === 'guard' && this.windedT <= 0 && this.lungeT <= 0;
        if (this.lungeT > 0) {                              // committed
          this.lungeT -= dt;
          this.vx = this.dir * this.spd * 4.2;
          // the punish window shrinks with cunning but never closes: even at
          // full sharpness there is a third of a second where it is yours
          if (this.lungeT <= 0) { this.windedT = 0.55 - this.iq * 0.22; this.vx = 0; }
        } else if (this.windedT > 0) {                      // the punish window
          this.windedT -= dt; this.vx *= Math.pow(0.02, dt);
        } else if (this.coilT > 0) {                        // the tell
          this.coilT -= dt; this.vx = 0;
          // a clever one keeps its nose on her while it gathers, so stepping
          // around it stops being a free answer
          if (this.iq > 0.55) this.dir = Math.sign(px - cx) || this.dir;
          if (this.coilT <= 0) {
            // A CHEETAH COVERS MORE GROUND WITH THE SAME WARNING. Same tell
            // length, half again the commit — which is what makes the second
            // animal a different problem rather than the first one reskinned.
            this.lungeT = (0.22 + this.iq * 0.06)
              * (typeof isCheetah === 'function' && isCheetah(this) ? 1.5 : 1);
            sfx('dash');
          }
        } else {
          this.vx = this.dir * this.spd;
          // IT NOTICES HER. Requiring it to already be facing the right way
          // meant it ignored anyone who walked up behind it — which is most of
          // the time, since she moves five times faster than it patrols. It
          // TURNS to face her first and lunges on the following pass, so the
          // turn itself becomes part of the warning.
          if (!player.dead && Math.abs(px - cx) < 160 && Math.abs(py - cy) < 70
              && (this.atkCD -= dt) <= 0) {
            const want = Math.sign(px - cx) || this.dir;
            if (want !== this.dir) { this.dir = want; this.atkCD = 0.28 - this.iq * 0.14; }
            else {
              this.coilT = TELL_FAST;                       // the tell never shortens
              this.atkCD = rnd(2.2 - this.iq * 1.1, 3.4 - this.iq * 1.6);
              this.vx = 0; sfx('tell');
            }
          }
        }
        const col = moveEnt(this, dt);
        if (col.l) this.dir = 1; else if (col.r) this.dir = -1;
        else if (col.d && !groundAhead(this, this.dir) && this.lungeT <= 0) this.dir *= -1;
        break;
      }
      // The blob asks: ARE YOU STILL STANDING THERE? It is slow and it does not
      // chase well — but it drips, and what it drips stays on the floor. It is
      // the only enemy in the game that punishes holding a position, which is
      // exactly the question the roster was missing, and it pairs with the
      // turret (which punishes approaching) to make a room out of two enemies.
      case 'blob': {
        this.vx = this.dir * this.spd * (0.6 + Math.sin(this.anim * 4) * 0.4);
        this.vy += 2000 * dt;
        this.dripT = (this.dripT || rnd(0.6, 1.4)) - dt;
        if (this.dripT <= 0 && this.on !== false) {
          this.dripT = rnd(1.1 - this.iq * 0.4, 1.8 - this.iq * 0.6);
          G.pools = G.pools || [];
          if (G.pools.length < 14) G.pools.push({ x: cx, y: this.y + this.h - 2, t: 4.2, t0: 4.2, r: 0 });
        }
        const col = moveEnt(this, dt);
        if (col.l) this.dir = 1; else if (col.r) this.dir = -1;
        else if (col.d && !groundAhead(this, this.dir)) this.dir *= -1;
        break;
      }
      // The flier asks: CAN YOU MOVE OUT FROM UNDER SOMETHING? It takes station
      // above you, holds — visibly, for TELL_FAST — and drops. Then it climbs
      // back out of reach, so the fight has a rhythm instead of being a wasp.
      case 'flier': {
        const near = dist2(cx, cy, px, py) < 340 * 340 && !player.dead;
        if (this.diveT > 0) {
          this.diveT -= dt;
          // it aims where she is GOING once it has learned to
          this.vx = lerp(this.vx, (leadX(px, this.iq * 0.36) - cx) * 1.2, 0.12);
          this.vy = 430;
          if (this.diveT <= 0 || moveEnt(this, dt).d) { this.diveT = 0; this.riseT = 0.9 - this.iq * 0.35; }
          else break;
        } else if (this.riseT > 0) {                        // withdrawing
          this.riseT -= dt;
          this.vx = lerp(this.vx, (px - cx) * 0.5, 0.03);
          this.vy = lerp(this.vy, -180, 0.1);
        } else if (this.holdT > 0) {                        // the tell
          this.holdT -= dt;
          this.vx = lerp(this.vx, 0, 0.2); this.vy = lerp(this.vy, -20, 0.2);
          if (this.holdT <= 0) this.diveT = 0.75;
        } else if (near) {
          const tx = px, ty = py - 120;                     // station above you
          this.vx += (tx - cx) * 1.6 * dt; this.vy += (ty - cy) * 2.2 * dt;
          const sp = Math.hypot(this.vx, this.vy);
          if (sp > this.spd) { this.vx *= this.spd / sp; this.vy *= this.spd / sp; }
          if (Math.abs(px - cx) < 46 + this.iq * 26 && cy < py - 60 && (this.atkCD -= dt) <= 0) {
            this.holdT = TELL_FAST;                          // unchanged, always
            this.atkCD = rnd(2.4 - this.iq * 1.1, 3.6 - this.iq * 1.5); sfx('tell');
          }
        } else {
          this.vx = lerp(this.vx, Math.sin(this.anim * 1.3) * 40, 0.05);
          this.vy = lerp(this.vy, (this.sy - this.y) * 1.2 + Math.cos(this.anim * 1.7) * 30, 0.05);
        }
        moveEnt(this, dt);
        break;
      }
      // THE BAT — the caves' own hazard (owner: "robot bats, coming from the
      // ceiling"). It hangs in the rock like one more stalactite until she is
      // beneath it, SHIVERS for the tell, drops in a swooping dive, and
      // climbs home when the swoop is spent. The opening is the climb: on
      // the way back up it is slow, lit, and cannot hurt her.
      case 'bat': {
        if (this.hang == null) this.hang = 1;
        const near = Math.abs(px - cx) < 150 + this.iq * 70 && py > cy - 20 && !player.dead;
        if (this.hang) {
          this.vx = 0; this.vy = 0;
          if (this.holdT > 0) {                     // the shiver — wings rustle
            this.holdT -= dt;
            if (this.holdT <= 0) { this.hang = 0; this.diveT = 0.85; this.vy = 80; }
          } else if (near && (this.atkCD -= dt) <= 0) {
            this.holdT = TELL_FAST; sfx('tell');
            this.atkCD = rnd(2.6 - this.iq, 4 - this.iq * 1.4);
          }
          break;                                    // anchored to the rock
        }
        if (this.diveT > 0) {
          this.diveT -= dt;
          this.vx = lerp(this.vx, (leadX(px, this.iq * 0.3) - cx) * 1.7, 0.1);
          this.vy = lerp(this.vy, 300 + Math.sin(this.anim * 9) * 90, 0.12);
          if (moveEnt(this, dt).d || this.diveT <= 0) { this.diveT = 0; this.riseT = 1.2; }
          break;
        }
        if (this.riseT > 0) {                       // climbing home, harmless-slow
          this.riseT -= dt;
          this.vx = lerp(this.vx, Math.sin(this.anim * 5) * 60, 0.08);
          this.vy = lerp(this.vy, -230, 0.1);
          const m = moveEnt(this, dt);
          if (m.u) { this.hang = 1; this.riseT = 0; this.vx = 0; this.vy = 0; }
          else if (this.riseT <= 0) this.riseT = 0.6;   // keep climbing till rock
          break;
        }
        this.hang = 1;                              // never idles in mid-air
        break;
      }
      // THE SAGE — docs/combat/SAGE.md. A hero-scale DUELIST: it wears her
      // own verbs, its openings are temporal, and it can only be CLEANSED,
      // never killed — the reason the purifier exists. Sentences, in words:
      //   coil -> lunge -> lunge -> EXHALE     (the exhale is the opening)
      //   gather -> EMBER RING                 (grounded; jump it)
      // Three denied openings force a long exhale — the cold-dice floor.
      case 'sage': {
        if (this.tame) {
          // purified: it kneels in peace and cannot touch her (return skips
          // the contact hit at the bottom, the wolves' own law)
          this.vx = 0; this.vy += 900 * dt; moveEnt(this, dt);
          this.faceVis = Math.sign(px - cx) || this.faceVis;
          if (chance(dt * 1.4)) addPart(cx + rnd(-8, 8), this.y + 6, rnd(-6, 6), -18, 0.7, '#57a8ff', 1.8, -20, true);
          return;
        }
        if (this.locked) {
          // SONG-LOCKED: kneeling, chanting, knitting itself back together.
          // Claws got it here; only the crystal gets it further (sageStruck).
          this.vx = 0; this.vy += 900 * dt; moveEnt(this, dt);
          const fl = this.hpMax0 * 0.45;
          if (this.hp < fl) this.hp = Math.min(fl, this.hp + this.hpMax0 * 0.06 * dt);
          if (chance(dt * 5)) addPart(cx + rnd(-9, 9), this.y + rnd(0, 12), rnd(-8, 8), -30, 0.6,
            chance(0.5) ? '#ff6a3a' : '#3a1a20', 2, -30, true);
          return;                                // the duel is over; the choice is hers
        }
        this.vy += 900 * dt;
        // the ember ring runs on its own clock once cast
        if (this.ringR != null) {
          this.ringR += 200 * dt;
          const rd = Math.abs(Math.hypot(px - cx, py - (this.y + this.h)) - this.ringR);
          if (rd < 16 && player.on && !player.dead) player.hurt(DF().edmg, cx, 'sage.ring');
          if (this.ringR > 250) this.ringR = null;
        }
        if (this.windedT > 0) {                   // THE EXHALE — the opening
          this.windedT -= dt; this.vx = 0; moveEnt(this, dt);
          if (this.windedT <= 0) {
            if (!this.struck) this.denied++; else this.denied = 0;
            this.struck = false;
          }
          break;
        }
        if (this.lungeT > 0) {
          this.lungeT -= dt; moveEnt(this, dt);
          if (this.lungeT <= 0) {
            if (this.lunges > 0) { this.lunges--; this.vx = Math.sign(px - cx) * this.spd * 2.2; this.lungeT = 0.22; }
            else this.windedT = 0.7;
          }
          break;
        }
        if (this.coilT > 0) {
          this.coilT -= dt; this.vx = 0; moveEnt(this, dt);
          if (this.coilT <= 0) { this.lunges = 1; this.vx = Math.sign(px - cx) * this.spd * 2.2; this.lungeT = 0.22; }
          break;
        }
        if (this.gatherT > 0) {
          this.gatherT -= dt; this.vx = 0; moveEnt(this, dt);
          if (this.gatherT <= 0) { this.ringR = 20; sfx('boom'); cam.shake = Math.max(cam.shake, 5); }
          break;
        }
        // neutral: hold duel range, decide on the beat
        const dxp = px - cx;
        this.vx = Math.abs(dxp) > 160 ? Math.sign(dxp) * this.spd * 0.6
          : Math.abs(dxp) < 70 ? -Math.sign(dxp) * this.spd * 0.4 : 0;
        this.dir = Math.sign(dxp) || 1;
        moveEnt(this, dt);
        if ((this.stepT -= dt) <= 0 && !player.dead && Math.abs(dxp) < 420) {
          // A DUEL GETS DUEL MUSIC. The chambers inherited their zone's
          // ambient stream, so a sage fight played over walking music — the
          // owner: "not epic, not from the theme, sounds like old Atari."
          // The moment the sage takes its first beat at her, the guardian
          // fight track takes the room; the taming resolves it (sageTame).
          if (!this.duelMus) { this.duelMus = 1; if (typeof setMusic === 'function') setMusic('sage'); }
          this.stepT = 0.9;
          if (this.denied >= 3) { this.windedT = 1.2; this.denied = 0; }
          else if (Math.abs(dxp) < 190 && chance(0.65)) { this.coilT = TELL_SWIPE; sfx('tell'); }
          else if (chance(0.5)) { this.gatherT = TELL_HEAVY; sfx('tell'); }
        }
        break;
      }
      case 'turret': {
        // sweep → LOCK (the red light is the tell) → fire
        this.t -= dt;
        if ((this.lockT || 0) > 0) {
          this.lockT -= dt;
          if (this.lockT <= 0) {
            this.lockT = 0;
            // a practised gunner shoots where you will be. The lock is still
            // 0.55 s and the beam still shows you the line — what changes is
            // that standing still stops being safe just because you were
            // moving when it locked.
            const aimX = leadX(px, this.iq * 0.42);
            const d = Math.hypot(aimX - cx, py - cy) || 1;
            G.projs.push(new Proj(cx, cy - 6, (aimX - cx) / d * 340, (py - cy) / d * 340, false, 1, 6, '#ff5c6c'));
            sfx('shoot');
            // FAR AWAY IT FIRES A BURST, close up a single shot. The question
            // it asks is "can you cross this ground?", and a burst is what
            // makes crossing a decision instead of a stroll.
            this.burst = (this.burst | 0) + 1;
            const far = dist2(cx, cy, px, py) > 240 * 240;
            if (far && this.burst < 2 + Math.round(this.iq * 2)) { this.t = 0.16; this.lockT = 0.0001; }
            else { this.burst = 0; this.t = 2.0 / DF().espd; }
          }
        } else if (this.t <= 0 && !player.dead && dist2(cx, cy, px, py) < 440 * 440) {
          this.lockT = 0.55; sfx('ui');
        }
        break;
      }
      case 'hopper': {
        this.vy += 2000 * dt;
        const col = moveEnt(this, dt);
        if (col.d) {
          // it LANDS HARD. The shock is a moment of danger on the ground next
          // to it, which is what stops the answer from being "stand where it
          // was and swing" every single time.
          if (this.wasAir && Math.abs(px - cx) < 62 && Math.abs(py - cy) < 40 && !player.dead
              && player.iT <= 0 && player.on) player.hurt(DF().edmg, cx, 'hopper.landing');
          if (this.wasAir) {
            cam.shake = Math.max(cam.shake, 2);
            for (let i = 0; i < 7; i++)
              addPart(cx + rnd(-16, 16), this.y + this.h, rnd(-90, 90), rnd(-120, -20), 0.35, '#b9c6d4', 2.2, 700);
          }
          this.wasAir = false;
          this.vx = 0;
          if (this.crouchT > 0) { this.crouchT -= dt; if (this.crouchT > 0) break; }
          this.t -= dt;
          // it faces its prey while gathering — so the leap goes nose-first
          this.dir = Math.sign(px - cx) || this.dir || 1;
          if (this.t <= 0 && !player.dead && Math.abs(px - cx) < 380) {
            // THE CROUCH. It used to launch on the frame a random timer hit
            // zero — it faced you first, but facing is not a warning. Now it
            // gathers for TELL_FAST with a cue, and the leap is a thing you
            // saw coming.
            if (this.crouchT <= 0 && !this.gathered) {
              this.crouchT = TELL_FAST; this.gathered = true; sfx('tell');
              this.dir = Math.sign(px - cx) || 1;
              this.t = 0.01;
              break;
            }
            this.gathered = false;
            this.t = rnd(1.1 - this.iq * 0.4, 1.9 - this.iq * 0.6);
            this.dir = Math.sign(leadX(px, this.iq * 0.5) - cx) || 1;
            this.vy = -560; this.vx = this.dir * this.spd * (1 + this.iq * 0.18); this.wasAir = true;
            sfx('jump');
          }
        }
        break;
      }
      // THE BREAKER (kingdom 2's own machine) asks: CAN YOU BE AIRBORNE ON A
      // BEAT? A squat breaker drum bolted to the conduit rail. When she is in
      // its band it charges for TELL_SWIPE — fins flare, the amber ring reads —
      // then VENTS: a charge wave crawls the floor BOTH ways at wave speed,
      // and the floor under her feet is briefly not hers. The wave is jumped
      // (grounded-only damage), out-ranged (finite reach, dies at walls and
      // gaps, never climbs a ledge), or never met at all (bait the vent and
      // walk in behind it: 0.9 s of open vents is a two-hit window that
      // tempts three — the greed axis, per the combat registry). It is what
      // the Conduits teach before TALONHOST asks "where are you standing?"
      // for keeps. Zoner; threat 2; tell never shortens with iq — cunning
      // buys a faster wave and a shorter rest, not a shorter warning.
      case 'surge': {
        this.vy += 2000 * dt; this.vx = 0;
        moveEnt(this, dt);
        this.dir = 0;                 // omnidirectional: no misleading tell wedge
        // the waves run on their own clock once vented
        if (this.waves && this.waves.length) {
          for (let i = this.waves.length - 1; i >= 0; i--) {
            const w = this.waves[i];
            w.x += w.dir * w.spd * dt; w.life -= dt; w.ph += dt * 30;
            const wtx = Math.floor(w.x / TILE);
            const fty = Math.floor((w.y + 4) / TILE);      // the rail it rides
            const bty = Math.floor((w.y - 10) / TILE);     // the air it needs
            const railOn = (tt => tt === '#' || tt === 'B' || tt === '=')(tileAt(wtx, fty));
            if (w.life <= 0 || !railOn || solidAt(wtx, bty)) { this.waves.splice(i, 1); continue; }
            // grounded-only: feet near the rail line is the hit, air is the answer
            if (!player.dead && player.iT <= 0
                && Math.abs(player.x + player.w / 2 - w.x) < 18
                && player.y + player.h > w.y - 26 && player.y + player.h < w.y + 8)
              player.hurt(DF().edmg, w.x, 'surge.wave');
            if (chance(dt * 22)) addPart(w.x + rnd(-5, 5), w.y - rnd(2, 14), rnd(-30, 30), rnd(-90, -30), 0.28, '#ff5f6d', 2, 300, true);
          }
        }
        if (this.windedT > 0) {            // VENTED — the punish window (0.9 s)
          this.windedT -= dt;
          break;
        }
        if (this.crouchT > 0) {            // the charge — fins up, amber on
          this.crouchT -= dt;
          if (this.crouchT <= 0) {
            const fy = this.y + this.h;
            const life = Math.min(1.05, 300 / Math.max(1, this.spd));
            this.waves = this.waves || [];
            for (const s of [-1, 1])
              this.waves.push({ x: cx + s * (this.w / 2 + 6), y: fy, dir: s, spd: this.spd, life, ph: 0 });
            this.windedT = 0.9;            // opening_ms = 900 − 33: two hits, tempts three
            sfx('cast');
          }
          break;
        }
        // idle: latched, humming, watching its band
        if (!player.dead && Math.abs(px - cx) < 230 && Math.abs(py - cy) < 90
            && (this.atkCD -= dt) <= 0) {
          this.crouchT = TELL_SWIPE;       // zone-B floor: the tell never shortens
          this.atkCD = rnd(2.4 - this.iq * 0.8, 3.6 - this.iq * 1.2);
          sfx('tell');
        }
        break;
      }
      // THE KILN VENT (kingdom 3's own machine) asks FURNACE CHOIR's question
      // a kingdom early: HEAT RUNS ON A BEAT — AND HOW MUCH OF THE QUIET WILL
      // YOU SPEND STANDING IN ITS LANE? A squat casting pot plumbed into the
      // Foundry floor. When she is in its patch it charges for TELL_SWIPE —
      // damper petals hinge open, the amber ring reads — then it BLOWS: a
      // column of furnace heat stands straight up off the mouth, and the air
      // over the vent is briefly not hers, grounded or airborne alike (the
      // surge owns the floor; the kiln owns the LANE — two different answers).
      // The column is side-stepped (finite half-width), out-waited (finite
      // burn), or never met at all (cross on the beat's quiet). Then the pot
      // is SPENT: grates fall open for 0.95 s — a window that fits two hits
      // and tempts three, which is exactly the greed axis its guardian's
      // whole fight is built on (registry §4: FURNACE CHOIR, greed test).
      // Zoner; threat 2; the tell never shortens with iq — cunning buys a
      // taller plume and a shorter rest, not a shorter warning.
      case 'kiln': {
        this.vy += 2000 * dt; this.vx = 0;
        moveEnt(this, dt);
        this.dir = 0;                 // omnidirectional: no misleading tell wedge
        if ((this.plumeT || 0) > 0) {      // BLOWING — the lane is closed
          this.plumeT -= dt;
          this.plumeH = Math.min(this.plumeMax || 150, (this.plumeH || 0) + this.spd * dt);
          const my = this.y + 2;           // the mouth: the column stands on it
          if (!player.dead && player.iT <= 0
              && Math.abs(player.x + player.w / 2 - cx) < 19
              && player.y + player.h > my - this.plumeH && player.y < my + 6)
            player.hurt(DF().edmg, cx, 'kiln.plume');
          if (chance(dt * 26)) addPart(cx + rnd(-8, 8), my - rnd(0, this.plumeH),
            rnd(-24, 24), rnd(-160, -60), 0.3, chance(0.4) ? '#ffd08a' : '#ff5f6d', 2.2, -80, true);
          if (this.plumeT <= 0) { this.plumeH = 0; this.windedT = 0.95; }
          break;
        }
        if (this.windedT > 0) {            // SPENT — the punish window (0.95 s)
          this.windedT -= dt;
          break;
        }
        if (this.crouchT > 0) {            // the charge — petals up, amber on
          this.crouchT -= dt;
          if (this.crouchT <= 0) {
            this.plumeT = 0.8; this.plumeH = 0;
            // cunning buys REACH: a taller column each iq step, never less warning
            this.plumeMax = 140 + this.iq * 70;
            sfx('cast');
          }
          break;
        }
        // idle: plumbed in, breathing embers, watching its patch — the band
        // reaches UP, because the lane it closes does
        if (!player.dead && Math.abs(px - cx) < 210 && py > cy - 190 && py < cy + 70
            && (this.atkCD -= dt) <= 0) {
          this.crouchT = TELL_SWIPE;       // the kingdom floor: the tell never shortens
          this.atkCD = rnd(2.2 - this.iq * 0.7, 3.4 - this.iq * 1.1);
          sfx('tell');
        }
        break;
      }
      // THE RIME COIL (kingdom 4's own machine) asks GLACIERE's question a
      // kingdom early: THE COLD CLOSES AS A CIRCLE, AND JUMPING IS NOT AN
      // ANSWER TO A RADIUS — DISTANCE IS. A waisted condenser bobbin bolted
      // into the Archives floor. When she is in its patch it charges for
      // TELL_HEAVY — the frost crown extends, the amber ring reads — and the
      // whole tell is SPENT GROWING THE BOUNDARY: a frost ring swells from
      // the coil to a told edge and holds there, so the read is a shape on
      // the ground, not a timer in her head. Then it SNAPS: everything
      // inside the circle at that instant is hit, grounded or airborne alike
      // (the surge owns the floor, the kiln owns the lane, the rime owns the
      // RADIUS — three machines, three different answers). On ice, where the
      // Archives already forbid stopping, leaving a circle is a commitment
      // made EARLY — which is exactly the read GLACIERE's ABSOLUTE ZERO
      // hush demands for keeps ("be outside it when the silence lands").
      // Then it is DARK: the core dies for 1.0 s — a window that fits two
      // hits and tempts three. Zoner; threat 2; the tell never shortens with
      // iq — cunning buys a wider circle and a shorter rest, never a shorter
      // warning; TELL_HEAVY, not TELL_SWIPE, because the answer costs
      // ground and the warning has to pay for the ground it costs.
      case 'rime': {
        this.vy += 2000 * dt; this.vx = 0;
        moveEnt(this, dt);
        this.dir = 0;                 // omnidirectional: no misleading tell wedge
        if ((this.snapT || 0) > 0) this.snapT -= dt;   // the flash decays on its own
        if (this.windedT > 0) {            // DARK — the punish window (1.0 s)
          this.windedT -= dt;
          break;
        }
        if (this.crouchT > 0) {            // the charge — crown up, boundary growing
          this.crouchT -= dt;
          this.ringR = Math.min(this.ringMax || 120, (this.ringR || 0) + this.spd * dt);
          if (this.crouchT <= 0) {
            // THE SNAP: one instant, one circle — inside is hit, outside is not
            const r = this.ringR || 0;
            const ddx = player.x + player.w / 2 - cx, ddy = player.y + player.h / 2 - cy;
            if (!player.dead && player.iT <= 0 && ddx * ddx + ddy * ddy < r * r)
              player.hurt(DF().edmg, cx, 'rime.snap');
            // the circle's death is drawn where its edge WAS, so the miss
            // teaches as well as the hit
            this.snapR = r; this.snapT = 0.22;
            for (let i = 0; i < 14; i++) {
              const a = i / 14 * 6.283 + rnd(-0.1, 0.1);
              addPart(cx + Math.cos(a) * r, cy + Math.sin(a) * r,
                Math.cos(a) * rnd(20, 60), -rnd(20, 90), 0.35, i % 3 ? '#a8e4f4' : '#e6fbff', 2, 160, true);
            }
            this.ringR = 0;
            this.windedT = 1.0;            // opening_ms = 1000 − 33: two hits, tempts three
            sfx('cast');
          }
          break;
        }
        // idle: bolted in, breathing cold, watching its patch — the band is
        // a little wider than the widest circle, so the first read is free
        if (!player.dead && Math.abs(px - cx) < 240 && Math.abs(py - cy) < 150
            && (this.atkCD -= dt) <= 0) {
          this.crouchT = TELL_HEAVY;       // the kingdom floor: the tell never shortens
          this.ringR = 0;
          // cunning buys REACH: a wider circle each iq step, never less warning
          this.ringMax = 104 + this.iq * 48;
          this.atkCD = rnd(2.6 - this.iq * 0.8, 3.8 - this.iq * 1.2);
          sfx('tell');
        }
        break;
      }
      // THE NEST SNARE (kingdom 5's own machine) asks MOTHER-V's question a
      // kingdom early — the only question in the game the Null Core asks
      // with her own hands: THE NEST DOES NOT STRIKE YOU, IT DRAWS YOU IN,
      // AND STANDING YOUR GROUND IS A DECISION YOU MAKE WITH YOUR FEET. A
      // thorned polyp rooted where it grew. When she is in its patch it
      // charges for TELL_HEAVY — the maw leans open, a tendril arcs OUT
      // toward her and hovers, the amber ring reads — and the whole tell is
      // spent showing the line it wants to close. Then it LATCHES: if she is
      // inside the told reach at that instant the reel begins — 0.9 s of
      // steady horizontal drag toward the thorned core, grounded or airborne
      // alike (the surge owns the floor, the kiln owns the lane, the rime
      // owns the radius, the snare owns the LINE OF PULL — four machines,
      // four different answers). And unlike its three siblings the failure
      // is RECOVERABLE, which is the actual lesson: run against the reel
      // and the moment the line is overstretched it snaps — exactly the
      // read MOTHER-V's tendril grab demands for keeps ("break line-of-pull
      // by moving"). A latch that finds nobody inside the reach whiffs, and
      // the whiff pays the same as the snap. Then the tendril hangs LIMP
      // for 1.0 s — a window that fits two hits and tempts three.
      // Disruptor; threat 2; the tell never shortens with iq — cunning buys
      // a longer reach and a harder grip, never a shorter warning;
      // TELL_HEAVY, not TELL_SWIPE, because the answer costs ground and the
      // warning has to pay for the ground it costs.
      case 'snare': {
        this.vy += 2000 * dt; this.vx = 0;
        moveEnt(this, dt);
        this.dir = 0;                 // omnidirectional: no misleading tell wedge
        if (this.windedT > 0) {            // LIMP — the punish window (1.0 s)
          this.windedT -= dt;
          break;
        }
        if ((this.reelT || 0) > 0) {       // LATCHED — the line is closing
          this.reelT -= dt;
          const rdx = px - cx, rdy = py - cy;
          const rd = Math.hypot(rdx, rdy) || 1;
          if (rd > (this.reachR || 150) * 1.4) {
            // SHE BROKE IT: running against the reel overstretched the line.
            // The correct answer is rewarded with the same limp window the
            // timer would have paid, so fighting free is never worse than
            // waiting out the drag.
            this.reelT = 0;
            burst(lerp(cx, px, 0.5), lerp(cy, py, 0.5), 8, '#ff9a9a', 180, 0.3, 60, 2, true);
          } else if (!player.dead) {
            // the reel is horizontal, like the guardian's own grab: jumping
            // does not answer a pull, motion against it does
            player.vx += (Math.sign(cx - px) || 1) * (this.pull || this.spd) * dt;
            if (chance(0.5)) addPart(lerp(cx, px, rnd(0.2, 0.9)), lerp(cy, py, rnd(0.2, 0.9)),
              rnd(-24, 24), rnd(-24, 24), 0.2, '#ff4d4d', 1.8, 0, true);
          }
          if (this.reelT <= 0) { this.windedT = 1.0; sfx('cast'); }
          break;
        }
        if (this.crouchT > 0) {            // the reach — tendril out, hovering
          this.crouchT -= dt;
          if (this.crouchT <= 0) {
            const ldx = px - cx, ldy = py - cy;
            const r = this.reachR || 150;
            if (!player.dead && ldx * ldx + ldy * ldy < r * r) {
              this.reelT = 0.9; sfx('dash');           // THE LATCH
            } else {
              // the whiff teaches as well as the hit: the tendril closes on
              // nothing and the polyp pays the full limp window for it
              this.windedT = 1.0; sfx('cast');
            }
          }
          break;
        }
        // idle: rooted, pulsing on the broadcast, watching its patch — the
        // band is a little wider than the longest reach, so the first read
        // is free
        if (!player.dead && Math.abs(px - cx) < 250 && Math.abs(py - cy) < 130
            && (this.atkCD -= dt) <= 0) {
          this.crouchT = TELL_HEAVY;       // the kingdom floor: the tell never shortens
          // cunning buys REACH and GRIP: a longer line and a harder pull
          // each iq step, never less warning (and never past the guardian's
          // own 1150 — the minion must stay the lesson, not the exam)
          this.reachR = 150 + this.iq * 70;
          this.pull = this.spd * (0.9 + this.iq * 0.35);
          this.atkCD = rnd(2.6 - this.iq * 0.8, 3.8 - this.iq * 1.2);
          sfx('tell');
        }
        break;
      }
    }
    // spikes are spikes for everyone: a machine that lands in the pit dies
    // in it — no creature camps where the player cannot stand
    if (onSpike(this)) { this.die(0, -0.4); return; }
    // touch damage
    if (!player.dead && aabb(this, player)) player.hurt(DF().edmg, cx);
  }
  // VOLATILE: it takes the room with it. Telegraphed by its own colour on the
  // body and by a beat of warning light, so it is a thing you step away from
  // rather than a thing that happens to you.
  die(kx, ky) {
    if (this.traits && this.traits.indexOf('volatile') >= 0 && !this.dead && !this.popped) {
      this.popped = true;
      const bx = this.x + this.w / 2, by = this.y + this.h / 2;
      G.pools = G.pools || [];
      burst(bx, by, 22, TRAITS.volatile.col, 320, 0.55, 90, 3.2, true);
      cam.shake = Math.max(cam.shake, 5);
      if (typeof sfx === 'function') sfx('boom');
      if (!player.dead && player.iT <= 0
          && Math.hypot(player.x + player.w / 2 - bx, player.y + player.h / 2 - by) < 74)
        player.hurt(DF().edmg, bx, this.kind + '.volatile');
    }
    return this._die0(kx, ky);
  }
  _die0(kx, ky) {
    if (this.dead) return;
    this.dead = true;
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    sfx('edie');
    player.gainVolts(8);
    burst(cx, cy, 10, PAL[G.roomDef.zone].glow, 200, 0.4, 400, 3, true);
    // a slag blob does not die clean: it bursts into two small blobs
    if (this.kind === 'blob' && !this.mini && !onSpike(this)) {
      for (const s of [-1, 1]) {
        const b2 = new Enemy('blob', cx - 10 + s * 10, this.y + this.h - 16);
        b2.w = 20; b2.h = 15; b2.hp = 12; b2.mini = true;
        b2.dir = s; b2.vx = s * 130; b2.vy = -240; b2.kbT = 0.35;
        G.enemies.push(b2);
      }
    }
    G.wrecks.push(new Wreck(this, kx || 0, ky || 0));
    // THE BRAID: every machine that dies leaves a mark on the world, and none of
    // them stop the game to discuss it. Only guardians are asked about.
    if (typeof brKill === 'function' && !this.mini) brKill(G.roomId);
    // CHOIR: in a world where they hear each other die, the dead call the living
    if (typeof brHas === 'function' && brHas('choir') && chance(0.35)) {
      const e2 = new Enemy(chance(0.5) ? 'crawler' : 'flier', cx + rnd(-80, 80), this.y - 40);
      e2.expireT = 14; G.enemies.push(e2);
    }
  }
  draw(c) {
    const P = PAL[G.roomDef.zone];
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    // light trail — glowing red smear behind the moving machine
    if (this.tr.length > 2) {
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (let i = 1; i < this.tr.length; i++) {
        const a = (1 - i / this.tr.length) * 0.28;
        c.strokeStyle = 'rgba(255,79,109,' + a.toFixed(3) + ')';
        c.lineWidth = Math.max(1, 6 * (1 - i / this.tr.length));
        c.beginPath(); c.moveTo(this.tr[i - 1].x, this.tr[i - 1].y); c.lineTo(this.tr[i].x, this.tr[i].y); c.stroke();
      }
      c.restore();
    }
    // authored nose-left like the bosses, and eased so a mimic turns rather than
    // snapping. flier faces its travel vector; the rest face their walk direction.
    const TP = turnPose(this.faceVis);
    // Only the crawler is authored in profile. The rest are drawn head-on, so
    // they must never be scaled toward zero — they just lean.
    const profile = this.kind === 'crawler';
    const flipS = profile
      ? -TP.dir * (TP.pose === 'q' ? 0.82 + TP.t * 0.18 : 1)
      : -TP.dir;
    // grounded creatures cast a contact shadow (lighting pass)
    if (this.kind !== 'flier' && this.kind !== 'bat') contactShadow(c, cx, this.y + this.h, this.w * 0.55, 0.38);
    // the cave bat is its own machine, hanging or flying; authored plates are
    // queued (ART_QUEUE) — this is the engine-drawn first pass, same standing
    // as the other minion fallbacks
    if (this.kind === 'bat') { drawBat(c, this); return; }
    if (this.kind === 'sage') { drawSage(c, this); return; }
    // ---- hero world: real hand-animated creatures ----
    if (typeof isHero === 'function' && isHero()) {
      const SPR = {
        crawler: () => {
          const moving = Math.abs(this.vx) > 12;
          return moving ? ['houndRun', 5, 67, 32, Math.floor(this.anim * 14)]
                        : ['houndIdle', 6, 64, 32, Math.floor(this.anim * 7)];
        },
        flier: () => ['ghost', 7, 64, 80, Math.floor(this.anim * 8)],
        hopper: () => ['skull', 12, 64, 112, Math.floor(this.anim * 12)],
      };
      const pick = SPR[this.kind] && SPR[this.kind]();
      if (pick && sheetReady(pick[0])) {
        const [key, n, cw, ch, fr] = pick;
        c.save();
        if (this.hurtT > 0) c.globalAlpha = 0.6;
        c.translate(cx, this.y + this.h);
        c.scale(flipS, 1);
        // fit the art to the hitbox height, a touch larger for presence
        const sc = (this.h * 1.5) / ch;
        drawSheet(c, key, n, cw, ch, fr % n, sc, this.kind === 'flier' ? 6 : 2);
        c.restore();
        return;
      }
    }
    // ZONE A'S GROUND MACHINES ARE THE PACK. They used to be the boss's WHELPS
    // — smaller copies of NULLFANG off the same parts rig — which made the
    // first enemy in the game a spoiler for the first boss and left the opening
    // kingdom reading as lion, lion, lion, big lion. They are electronic wolves
    // now (js/wolves.js), and the whelp rig stays as the fallback for the one
    // frame before the plates land. CLAWBYTE only: the Odyssey's creatures
    // never fall back onto the machine art.
    const heroEn = typeof isHero === 'function' && isHero();
    if (isWolf(this) && drawWolf(c, this)) return;
    if (isCheetah(this) && drawCheetah(c, this)) return;
    if (!heroEn && G.roomDef && G.roomDef.zone === 'A' && (this.kind === 'crawler' || this.kind === 'hopper')
        && typeof drawBeastMini === 'function' && drawBeastMini(c, this)) return;
    // every flying minion is a small TALONHOST — talons only, no feathers
    if (!heroEn && this.kind === 'flier' && typeof drawEagleMini === 'function' && drawEagleMini(c, this)) return;
    // THE TURRET'S HALF-SECOND, PUT BACK ON SCREEN. There has always been a red
    // targeting light for the 0.55 s lock — drawn seven hundred lines below,
    // inside the procedural fallback, which stopped executing the day the
    // sprite atlas started loading. In the shipped game the only warning before
    // a bullet was a sound. It is drawn HERE now, above every early return, and
    // it brings an aim line with it: the line finds you over the half second,
    // so the warning says where the shot is going as well as that it is coming.
    // WHAT THIS ONE IS. A ring in the trait's own colour, plus a mark: a
    // chevron for quick, a bar for armoured, a dot for the one that goes off.
    // Colour alone would fail roughly one man in twelve, so the shape carries
    // the same information.
    if (this.traits && this.traits.length && !this.dead) {
      c.save();
      this.traits.forEach((tr, ti) => {
        const T = TRAITS[tr]; if (!T) return;
        const ry = this.y - 6 - ti * 7;
        c.globalAlpha = 0.85;
        c.strokeStyle = T.col; c.lineWidth = 1.6;
        c.beginPath(); c.arc(cx, ry, 3.6, 0, 7); c.stroke();
        c.fillStyle = T.col;
        if (tr === 'swift') { c.beginPath(); c.moveTo(cx - 2, ry + 1.6); c.lineTo(cx, ry - 1.8); c.lineTo(cx + 2, ry + 1.6); c.closePath(); c.fill(); }
        else if (tr === 'tough') c.fillRect(cx - 2.4, ry - 1.2, 4.8, 2.4);
        else { c.beginPath(); c.arc(cx, ry, 1.7, 0, 7); c.fill(); }
      });
      c.restore(); c.globalAlpha = 1;
    }
    // the plate: up means wait, down means now
    if (this.kind === 'guard' && !this.dead) {
      const up = !!this.guard;
      c.save();
      c.translate(cx + this.dir * (this.w * 0.52), this.y + this.h * 0.5);
      c.globalAlpha = up ? 0.95 : 0.35;
      c.fillStyle = up ? '#9fb3c8' : '#5b6a7a';
      rr(c, -3, -this.h * 0.5, 6, this.h, 2); c.fill();
      c.strokeStyle = up ? '#dfeaf6' : 'rgba(190,210,230,0.4)'; c.lineWidth = 1.2;
      rr(c, -3, -this.h * 0.5, 6, this.h, 2); c.stroke();
      if (!up) {                                    // the window, made obvious
        c.globalAlpha = 0.5 + Math.sin(performance.now() / 90) * 0.3;
        c.strokeStyle = TELL_COL; c.lineWidth = 2;
        c.beginPath(); c.arc(-this.dir * this.w * 0.52, 0, this.w * 0.75, 0, 7); c.stroke();
      }
      c.restore(); c.globalAlpha = 1;
    }
    if ((this.lockT || 0) > 0 && !this.dead) drawTurretLock(c, this, cx);
    // the breaker's charge waves live on the rail, not on the body — drawn in
    // world space, danger red per the registry: area denial, "the floor going
    // hostile", exactly what the hue is reserved to mean
    if (this.kind === 'surge' && this.waves && this.waves.length) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const w of this.waves) {
        const a = clamp(w.life * 2.2, 0, 1);
        c.globalAlpha = 0.55 * a;
        c.strokeStyle = '#ff5f6d'; c.lineWidth = 2; c.lineCap = 'round';
        // a crest of crawling arcs, tallest at the front edge
        for (let i = 0; i < 3; i++) {
          const ax = w.x - w.dir * i * 7;
          const ah = (14 - i * 3.5) * (0.7 + Math.sin(w.ph + i * 1.7) * 0.3);
          c.beginPath();
          c.moveTo(ax - 5, w.y);
          c.quadraticCurveTo(ax + rnd(-2, 2), w.y - ah, ax + 5, w.y);
          c.stroke();
        }
        c.globalAlpha = 0.3 * a;
        const gl = c.createRadialGradient(w.x, w.y - 4, 1, w.x, w.y - 4, 26);
        gl.addColorStop(0, '#ff5f6d'); gl.addColorStop(1, 'rgba(255,95,109,0)');
        c.fillStyle = gl;
        c.beginPath(); c.ellipse(w.x, w.y - 3, 26, 12, 0, 0, 7); c.fill();
      }
      c.restore(); c.globalAlpha = 1;
    }
    // the kiln's plume stands on the mouth, not on the body — drawn in world
    // space, danger red at its skin per the registry (area denial, "this space
    // is briefly not yours"), white-hot only at the throat where it is born
    if (this.kind === 'kiln' && (this.plumeT || 0) > 0 && !this.dead) {
      const my = this.y + 2, ph = this.plumeH || 0;
      const a = clamp(this.plumeT * 4, 0, 1);
      c.save(); c.globalCompositeOperation = 'lighter';
      // the column: a gradient stalk born white and dying danger red
      const gl = c.createLinearGradient(0, my, 0, my - ph);
      gl.addColorStop(0, 'rgba(255,242,221,' + 0.5 * a + ')');
      gl.addColorStop(0.4, 'rgba(255,148,48,' + 0.4 * a + ')');
      gl.addColorStop(1, 'rgba(255,95,109,' + 0.16 * a + ')');
      c.fillStyle = gl;
      c.beginPath();
      c.moveTo(cx - 13, my);
      c.quadraticCurveTo(cx - 15 + Math.sin(this.anim * 21) * 3, my - ph * 0.55, cx - 8 + Math.sin(this.anim * 17) * 3, my - ph);
      c.lineTo(cx + 8 + Math.sin(this.anim * 19 + 2) * 3, my - ph);
      c.quadraticCurveTo(cx + 15 + Math.sin(this.anim * 23 + 4) * 3, my - ph * 0.55, cx + 13, my);
      c.closePath(); c.fill();
      // tongues climbing the stalk — the crest that says it is MOVING up
      c.strokeStyle = '#ff5f6d'; c.lineWidth = 2; c.lineCap = 'round';
      c.globalAlpha = 0.5 * a;
      for (let i = 0; i < 3; i++) {
        const ty = my - ((this.anim * 130 + i * ph / 3) % Math.max(ph, 1));
        const tw = 10 - i * 2;
        c.beginPath();
        c.moveTo(cx - tw, ty);
        c.quadraticCurveTo(cx + Math.sin(this.anim * 25 + i * 2.4) * 5, ty - 9, cx + tw, ty);
        c.stroke();
      }
      // the crown: where the reach STOPS, marked so the read is a shape
      c.globalAlpha = 0.4 * a;
      const cg = c.createRadialGradient(cx, my - ph, 1, cx, my - ph, 20);
      cg.addColorStop(0, '#ff5f6d'); cg.addColorStop(1, 'rgba(255,95,109,0)');
      c.fillStyle = cg;
      c.beginPath(); c.ellipse(cx, my - ph, 20, 9, 0, 0, 7); c.fill();
      c.restore(); c.globalAlpha = 1;
    }
    // the rime's circle is the READ, drawn in world space as the TRUE hit
    // shape — a circle on the body's centre, because the snap tests exactly
    // that circle and a floor ellipse would lie about the air. Frost skin,
    // amber at the growing edge (a warning is amber everywhere in this game);
    // danger red only for the one beat the circle is real (the registry's
    // area-denial hue, worn at the moment the area denies)
    if (this.kind === 'rime' && !this.dead && ((this.ringR || 0) > 2 || (this.snapT || 0) > 0)) {
      const ry = this.y + this.h / 2;
      c.save();
      if ((this.ringR || 0) > 2) {
        const r = this.ringR;
        const held = r >= (this.ringMax || 120) - 1;     // the edge has arrived
        c.globalCompositeOperation = 'lighter';
        // the cold filling the circle, thin — presence, not opacity
        const fg = c.createRadialGradient(cx, ry, r * 0.3, cx, ry, r);
        fg.addColorStop(0, 'rgba(168,228,244,0)');
        fg.addColorStop(1, 'rgba(168,228,244,0.16)');
        c.fillStyle = fg;
        c.beginPath(); c.arc(cx, ry, r, 0, 7); c.fill();
        // the boundary itself: frost line under an amber dashed rim — the
        // same amber the body wears, because they are the same warning
        c.strokeStyle = 'rgba(230,251,255,0.55)'; c.lineWidth = 2;
        c.beginPath(); c.arc(cx, ry, r, 0, 7); c.stroke();
        c.strokeStyle = TELL_COL; c.lineWidth = held ? 2.4 : 1.6;
        c.globalAlpha = held ? 0.8 + Math.sin(this.anim * 26) * 0.2 : 0.55;
        c.setLineDash([6, 6]); c.lineDashOffset = -performance.now() / 40;
        c.beginPath(); c.arc(cx, ry, r, 0, 7); c.stroke(); c.setLineDash([]);
      }
      if ((this.snapT || 0) > 0) {
        // the snap: the circle is REAL for one flash, then it is gone
        const a = clamp(this.snapT / 0.22, 0, 1), r = this.snapR || 0;
        c.globalCompositeOperation = 'lighter';
        const sg = c.createRadialGradient(cx, ry, 2, cx, ry, r);
        sg.addColorStop(0, 'rgba(230,251,255,' + 0.5 * a + ')');
        sg.addColorStop(0.75, 'rgba(255,95,109,' + 0.3 * a + ')');
        sg.addColorStop(1, 'rgba(255,95,109,' + 0.45 * a + ')');
        c.fillStyle = sg;
        c.beginPath(); c.arc(cx, ry, r, 0, 7); c.fill();
        c.strokeStyle = '#ff5f6d'; c.globalAlpha = a; c.lineWidth = 2.6;
        c.beginPath(); c.arc(cx, ry, r, 0, 7); c.stroke();
      }
      c.restore(); c.globalAlpha = 1;
    }
    // the snare's tendril is the READ, drawn in world space because the line
    // it threatens runs from the body to HER. Through the tell it stretches
    // out and hovers (amber — a warning is amber everywhere in this game,
    // and the reach boundary is dashed at the told radius so the latch
    // circle never lies); through the reel it is taut and infection-red —
    // the registry's danger hue, worn at the moment the line is real
    if (this.kind === 'snare' && !this.dead
        && ((this.crouchT || 0) > 0 || (this.reelT || 0) > 0)) {
      const sy = this.y + this.h * 0.28;
      const tpx = player ? player.x + player.w / 2 : cx;
      const tpy = player ? player.y + player.h / 2 : sy;
      c.save();
      if ((this.crouchT || 0) > 0) {
        const k = 1 - clamp(this.crouchT / TELL_HEAVY, 0, 1);
        const r = this.reachR || 150;
        // the told reach: a dim dashed arc at the latch radius — the honest
        // boundary, like the rime's held ring, drawn low so it reads as
        // ground the line can claim
        c.globalAlpha = 0.16 + k * 0.3;
        c.strokeStyle = TELL_COL; c.lineWidth = 1.6;
        c.setLineDash([5, 7]); c.lineDashOffset = -performance.now() / 50;
        c.beginPath(); c.arc(cx, sy, r, 0, 7); c.stroke(); c.setLineDash([]);
        // the tendril, growing toward her across the whole tell and hovering
        // just short — when it can touch the drawing of you, it can take you
        const gk = Math.min(1, k * 1.25);
        const ex = lerp(cx, tpx, gk * 0.86), ey = lerp(sy, tpy, gk * 0.86);
        c.globalAlpha = 0.35 + k * 0.45;
        c.strokeStyle = TELL_COL; c.lineWidth = 2.6 - k * 0.8; c.lineCap = 'round';
        c.beginPath(); c.moveTo(cx, sy);
        c.quadraticCurveTo(lerp(cx, ex, 0.5), Math.min(sy, ey) - 26 - k * 10, ex, ey);
        c.stroke();
        // the open hook at its tip, quickening on the body's own pulse
        c.globalAlpha = 0.5 + Math.sin(this.anim * (14 + k * 22)) * 0.3;
        c.fillStyle = TELL_COL; c.shadowColor = TELL_COL; c.shadowBlur = 9;
        c.beginPath(); c.arc(ex, ey, 2.2 + k * 1.8, 0, 7); c.fill();
        c.shadowBlur = 0;
      } else {
        // LATCHED: the line is real — taut, red, vibrating with the reel
        const jit = Math.sin(this.anim * 46) * 2.2;
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = 0.7;
        c.strokeStyle = '#ff4d4d'; c.lineWidth = 2.4; c.lineCap = 'round';
        c.beginPath(); c.moveTo(cx, sy);
        c.quadraticCurveTo(lerp(cx, tpx, 0.5), lerp(sy, tpy, 0.5) + jit, tpx, tpy);
        c.stroke();
        c.globalAlpha = 0.35;
        c.strokeStyle = '#ff9a9a'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(cx, sy);
        c.quadraticCurveTo(lerp(cx, tpx, 0.5), lerp(sy, tpy, 0.5) - jit, tpx, tpy);
        c.stroke();
      }
      c.restore(); c.globalAlpha = 1;
    }
    // EVERY WIND-UP WEARS THE SAME COLOUR. One hue, one meaning, used by
    // nothing else in the game — and always with motion and sound beside it,
    // because roughly one man in twelve cannot rely on hue alone.
    if (!this.dead && ((this.coilT || 0) > 0 || (this.holdT || 0) > 0 || (this.crouchT || 0) > 0)) {
      const w = Math.max(this.coilT || 0, this.holdT || 0, this.crouchT || 0);
      const k = 1 - clamp(w / TELL_FAST, 0, 1);
      c.save();
      c.globalAlpha = 0.30 + k * 0.5;
      c.strokeStyle = TELL_COL; c.lineWidth = 2 + k * 1.4;
      c.setLineDash([5, 5]); c.lineDashOffset = -performance.now() / 55;
      c.beginPath();
      c.arc(cx, this.y + this.h / 2, this.w * 0.72 + 10 - k * 6, 0, 7);
      c.stroke(); c.setLineDash([]);
      // a wedge pointing where it is about to go — motion, not just colour
      const dx = (this.coilT || this.crouchT) ? this.dir : 0, dy = this.holdT ? 1 : 0;
      if (dx || dy) {
        c.globalAlpha = 0.5 + k * 0.5; c.fillStyle = TELL_COL;
        const ox = cx + dx * (this.w * 0.9 + k * 10), oy = this.y + this.h / 2 + dy * (this.h * 0.9 + k * 10);
        c.beginPath();
        c.moveTo(ox + dy * 7 + dx * 7, oy + dx * 7 + dy * 7);
        c.lineTo(ox - dy * 7 - dx * 0, oy - dx * 7 - dy * 0);
        c.lineTo(ox + dx * 13 + dy * 0, oy + dy * 13 + dx * 0);
        c.closePath(); c.fill();
      }
      c.restore(); c.globalAlpha = 1;
    }
    // Pre-rendered 3D turnaround. Selected by angle, never mirrored, so the baked
    // key light stays on the correct side as the machine turns.
    if (drawAtlas(c, this.kind, this.faceVis, cx, this.y + this.h, this.h, {
          flash: this.hurtT > 0 ? 1 : 0,
          charm: this.hypnoT > 0 ? 1 : 0,
          grounded: this.kind !== 'flier',
          t: this.anim, vx: this.vx, vy: this.vy,
          air: this.kind === 'hopper' ? clamp(Math.abs(this.vy) / 400, 0, 1) : 0,
          mode: { crawler: 'walk', guard: 'walk', hopper: 'spring', blob: 'pulse', flier: 'hover', turret: 'breathe' }[this.kind] || 'breathe',
          yawScan: enemyYaw(this),
        })) return;
    c.save();
    if (this.hurtT > 0) { c.globalAlpha = 0.6; }
    c.translate(cx, cy);
    // virus glitch — the infection makes the body stutter
    if (chance(0.04)) c.translate(rnd(-1.5, 1.5), rnd(-1.5, 1.5));
    const flip = flipS;
    c.scale(flip, 1);
    // always-on RED eyes: the infection marker — friendlies never have these
    // one recessed sensor, not two flat red squares. A charmed mimic goes cyan,
    // because the Song has quieted its orders for a moment.
    const eyes = (x, y, s) => {
      const st = this.hypnoT > 0 ? 'alert' : (this.stagT > 0 ? 'overdrive' : 'locked');
      drawSensor(c, x + s * 0.9, y + s * 0.6, s * 0.62, st, this.anim);
    };
    // shaded metal body gradient (top-lit → dark belly) for dimensionality
    const eg = c.createLinearGradient(0, -12, 0, 14);
    eg.addColorStop(0, '#616e82'); eg.addColorStop(0.55, '#454f60'); eg.addColorStop(1, '#28303c');
    // ---- one faction, five species ------------------------------------------
    // These are 26-34px tall in play, so they are designed AT that size: the
    // silhouette carries the recognition and detail is spent only where it
    // separates one machine from another. Each still reads as the job it used to
    // do (STORY.md: a mimic keeps its work, it only stops caring what the work
    // does to you), and each owns a distinct base geometry so no two share an
    // outline: crawler = long low wedge, hopper = teardrop on springs,
    // blob = sagging dome, flier = pure circle, turret = rooted trapezoid.
    const EL = (typeof ELEM !== 'undefined' && typeof MIMIC_EL !== 'undefined' && ELEM[MIMIC_EL[this.kind]]) || { col: '#8aa2b5', glow: '#cfe3ef' };
    // Derived from the NULL-SEEKER DRILLER that rules Zone A: the minions are
    // built out of the same materials as the boss, so a room reads as one family.
    // Ceramic is the armour, steel the frame, bronze the joints — and each part
    // gets its own light axis instead of one gradient over everything.
    const plate = (path, y0, y1, k) => { c.fillStyle = ramp(c, MAT.ceramic, -8, y0, 8, y1, k); path(); c.fill(); };
    const frame = (path, y0, y1, k) => { c.fillStyle = ramp(c, MAT.steel, -8, y0, 8, y1, k); path(); c.fill(); };
    const joint = (jx, jy, jr) => {
      c.fillStyle = ramp(c, MAT.bronze, jx - jr, jy - jr, jx + jr, jy + jr);
      c.beginPath(); c.arc(jx, jy, jr, 0, 7); c.fill();
      occl(c, jx, jy + jr * 0.6, jr * 1.4, jr * 0.8, 0.4);
    };
    const seam = (x0, y0, x1, y1, a) => {   // additive panel line, never black
      c.strokeStyle = 'rgba(190,214,235,' + (a || 0.22) + ')'; c.lineWidth = 0.7;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    };
    const accent = (fn, glow) => {          // element tell: material, not eyes
      c.fillStyle = EL.col;
      if (glow) { c.shadowColor = EL.col; c.shadowBlur = 5; }
      fn(); c.shadowBlur = 0;
    };
    switch (this.kind) {
      case 'crawler': {
        if (TP.pose === 'front') {
          // head-on: the bore-head end-on, four legs, body much narrower.
          // Undo the outer flip — a front view is the same from either side, and
          // mirroring it makes the machine appear to jump as it crosses centre.
          c.save(); c.scale(1 / flipS, 1);
          const ph0 = this.anim * 12;
          for (const [lx, phs, dep] of [[-7, 1.1, 0.7], [7, 3.6, 0.7], [-5, 0, 1], [5, 2.4, 1]]) {
            const sw = Math.sin(ph0 + phs);
            c.save(); c.globalAlpha = dep < 1 ? 0.8 : 1;
            c.strokeStyle = dep < 1 ? MAT.steel.deep : MAT.steel.dark;
            c.lineWidth = 2.6 * dep; c.lineCap = 'round';
            c.beginPath(); c.moveTo(lx, 1); c.lineTo(lx + sw, 9); c.stroke();
            c.fillStyle = MAT.steel.deep; c.fillRect(lx + sw - 1.6 * dep, 8.4, 3.4 * dep, 1.8);
            c.restore();
          }
          plate(() => { c.beginPath(); rr(c, -9, -5, 18, 8, 3); }, -6, 4);
          c.fillStyle = ramp(c, MAT.bronze, -9, -1, 9, 1); c.fillRect(-9, -1, 18, 2);
          c.save(); c.translate(0, 1);
          c.fillStyle = ramp(c, MAT.bronze, -5, -5, 5, 5);
          c.beginPath(); c.arc(0, 0, 4.6, 0, 7); c.fill();
          c.strokeStyle = 'rgba(28,20,10,0.6)'; c.lineWidth = 0.7;
          for (let i = 0; i < 5; i++) {
            const a = this.anim * 4 + i / 5 * Math.PI * 2;
            c.beginPath(); c.moveTo(Math.cos(a) * 1.6, Math.sin(a) * 1.6);
            c.lineTo(Math.cos(a) * 4.4, Math.sin(a) * 4.4); c.stroke();
          }
          c.restore();
          occl(c, 0, 6, 6, 2, 0.5);
          eyes(-2, -7, 2);
          c.restore();
          break;
        }
        // DRAKK — a yard hauler that read the word "hound". Long low wedge with
        // a cargo hopper on its back: the back attachment is what makes it
        // unmistakable in silhouette, from the front and the side alike.
        const ph = this.anim * 12;
        const leg = (hx, phase, len, thick) => {
          const step = Math.sin(phase) * 3.2, lift = Math.max(0, -Math.cos(phase)) * 2.2;
          c.strokeStyle = MAT.steel.dark; c.lineWidth = thick; c.lineCap = 'round';
          c.beginPath(); c.moveTo(hx, 1);
          c.lineTo(hx + step * 0.5, 5 - lift);
          c.lineTo(hx + step, 9 - lift * 0.4);          // visible knee, not a peg
          c.stroke();
          joint(hx + step * 0.5, 5 - lift, 1.5);
          c.fillStyle = MAT.steel.deep;                  // a foot, so it stands
          c.fillRect(hx + step - 1.6, 8.4 - lift * 0.4, 3.4, 1.8);
        };
        leg(-7, ph, 9, 2.6); leg(-3.5, ph + 2.4, 9, 2.2);
        leg(4, ph + 1.1, 9, 3);  leg(8, ph + 3.6, 9, 2.4);
        // cargo hopper (back attachment)
        plate(() => {
          c.beginPath(); c.moveTo(-1, -6); c.lineTo(11, -8); c.lineTo(12, -1); c.lineTo(0, -1);
          c.closePath();
        }, -9, -1);
        accent(() => {                                   // rust bleeding from the bin
          c.globalAlpha = 0.55;
          c.fillRect(2, -2.4, 8, 1.4); c.globalAlpha = 1;
        });
        c.fillStyle = ramp(c, MAT.bronze, -2, -8, 11, -5);   // bronze rim of the open bin
        c.beginPath(); c.moveTo(-1.4, -6.2); c.lineTo(11.4, -8.4); c.lineTo(11.6, -7); c.lineTo(-1.2, -4.8);
        c.closePath(); c.fill();
        seam(1, -4.2, 10.4, -6, 0.24);
        // chassis: a long wedge, nose lower than tail
        plate(() => {
          c.beginPath(); c.moveTo(-13, -1.5); c.lineTo(-9, -4.5); c.lineTo(9, -4.5);
          c.lineTo(12.5, -0.5); c.lineTo(10, 2.5); c.lineTo(-11, 2.5); c.closePath();
        }, -5, 3);
        seam(-9, -1.2, 8, -1.2, 0.2);
        // head: a blunt tow-coupling thrust forward on a stub neck
        plate(() => {
          c.beginPath(); c.moveTo(-18, -1); c.lineTo(-13, -5); c.lineTo(-10, -5);
          c.lineTo(-10, 1.5); c.lineTo(-16, 2); c.closePath();
        }, -5, 2);
        // a bore-head scaled down from the Driller's: conical, fluted, bronze
        const bh = this.anim * 26;
        c.save(); c.translate(-16.5, 0.6); c.rotate(-0.12);
        c.fillStyle = ramp(c, MAT.bronze, -5, -3, 3, 3);
        c.beginPath(); c.moveTo(-6.5, 0); c.lineTo(2, -2.6); c.lineTo(2, 2.6); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(20,16,10,0.55)'; c.lineWidth = 0.6;
        for (let i = 0; i < 3; i++) {                    // flutes, turning
          const o = ((bh + i * 2.1) % 6) - 3;
          c.beginPath(); c.moveTo(o * 0.9 - 2, -2.2); c.lineTo(o * 0.9 - 0.6, 2.2); c.stroke();
        }
        c.restore();
        occl(c, -13, 1, 5, 3, 0.5);
        seam(-13.4, -4.2, -10.6, -4.2, 0.3);
        eyes(-16.8, -3.6, 1.9);
        break;
      }
      case 'hopper': {
        // NIKK — a leak-seeker that copied HZD-99's own frame. It is the only
        // mimic with ears, and it has them because it was imitating her.
        const ph = this.anim * 9;
        const squash = 1 + Math.sin(ph) * 0.06;
        // coiled spring legs — the species signature, visible at 1x
        c.strokeStyle = MAT.steel.mid; c.lineWidth = 1.5; c.lineCap = 'round';
        for (const sx of [-4.5, 4.5]) {
          c.beginPath();
          for (let i = 0; i <= 8; i++) {
            const yy = 4 + i * 0.9, xx = sx + (i % 2 ? 1.7 : -1.7) * (1 - i / 14);
            i ? c.lineTo(xx, yy) : c.moveTo(sx, yy);
          }
          c.stroke();
          c.fillStyle = MAT.steel.deep; c.fillRect(sx - 2.6, 11, 5.2, 1.8);
        }
        // coolant tank on the back
        plate(() => { c.beginPath(); c.ellipse(6, -2, 3.4, 4.6, 0.25, 0, 7); c.closePath(); }, -7, 3);
        accent(() => { c.beginPath(); c.ellipse(6.6, -2.6, 1.1, 2.1, 0.25, 0, 7); c.fill(); }, true);
        // teardrop body
        plate(() => {
          c.beginPath(); c.moveTo(0, -11);
          c.bezierCurveTo(7, -10, 9, -3, 8, 2);
          c.bezierCurveTo(6, 6, -6, 6, -8, 2);
          c.bezierCurveTo(-9, -3, -7, -10, 0, -11);
          c.closePath();
        }, -12 * squash, 6);
        seam(-6.5, -3, 6.5, -3, 0.22);
        // ears — the head-area element that makes it recognisable
        c.fillStyle = ramp(c, MAT.ceramic, -8, -15, 8, -8, 0.92);
        for (const [ex, tx] of [[-5.4, -7.6], [4.4, 6.8]]) {
          c.beginPath(); c.moveTo(ex, -8.6); c.quadraticCurveTo(tx, -14.5, ex + (tx - ex) * 0.55, -8);
          c.closePath(); c.fill();
        }
        // probe snout with a hanging drip
        c.fillStyle = ramp(c, MAT.bronze, -12, -1, -8, 2);
        c.beginPath(); c.moveTo(-8, -1); c.lineTo(-12.5, 0.6); c.lineTo(-8, 2.2); c.closePath(); c.fill();
        accent(() => { c.beginPath(); c.arc(-12.4, 2.4 + Math.sin(ph * 0.7) * 0.6, 0.9, 0, 7); c.fill(); }, true);
        eyes(-5.2, -6.4, 2);
        break;
      }
      case 'blob': {
        // BRUT — foundry spillage that cooled into something with legs. The only
        // asymmetric mimic: it sags, and it has three stubby legs, not four.
        const ph = this.anim * 5;
        const pulse = 0.55 + Math.sin(ph) * 0.45;
        c.strokeStyle = MAT.steel.dark; c.lineWidth = 2.4; c.lineCap = 'round';
        for (const [lx, lp] of [[-8, 0], [-1, 2.1], [7.5, 4.2]]) {
          const lift = Math.max(0, Math.sin(ph * 1.6 + lp)) * 1.4;
          c.beginPath(); c.moveTo(lx, 6); c.lineTo(lx + 0.6, 11 - lift); c.stroke();
        }
        // the mass: wide, low, and deliberately lopsided
        plate(() => {
          c.beginPath(); c.moveTo(-16, 6);
          c.bezierCurveTo(-17, -4, -9, -11, 1, -11);
          c.bezierCurveTo(10, -11, 16, -6, 15, 1);
          c.bezierCurveTo(14.4, 5, 12, 7, 8, 7);
          c.bezierCurveTo(4, 9, -12, 9, -16, 6);
          c.closePath();
        }, -12, 8);
        // molten underglow first — the heat is INSIDE, the crust sits over it
        c.save(); c.globalAlpha = 0.5 + pulse * 0.3;
        const ug = c.createRadialGradient(-1, 3, 1, -1, 3, 15);
        ug.addColorStop(0, EL.col); ug.addColorStop(1, 'rgba(255,122,52,0)');
        c.fillStyle = ug; c.beginPath(); c.ellipse(-1, 3, 14, 6, 0, 0, 7); c.fill();
        c.restore();
        // cooled crust: several DARK irregular plates, so the gaps between them
        // are what glows. Plates lighter than the body read as planks taped on.
        c.fillStyle = MAT.steel.deep;
        const crust = [
          [[-14, 3], [-11, -5], [-4, -8], [-3, -1], [-8, 4]],
          [[-1.5, -9], [5, -9.5], [7, -3.5], [0.5, -2.5]],
          [[8.5, -6], [14, -2], [13, 3], [8, 2]],
          [[-2, 0], [6, -1], [7.5, 5], [-1, 6]],
        ];
        for (const poly of crust) {
          c.beginPath(); poly.forEach((pt, i) => i ? c.lineTo(pt[0], pt[1]) : c.moveTo(pt[0], pt[1]));
          c.closePath(); c.fill();
        }
        // a few short hot flecks where the crust has not closed
        c.save(); c.globalAlpha = pulse;
        c.fillStyle = '#ffd9a0'; c.shadowColor = EL.col; c.shadowBlur = 4;
        c.fillRect(-3.4, -6, 0.9, 2.2); c.fillRect(7.4, -2.6, 0.8, 2.6);
        c.fillRect(-1.2, 5.4, 2.4, 0.8);
        c.shadowBlur = 0; c.restore();
        eyes(-3, -6, 2.2);
        break;
      }
      case 'flier': {
        // OKK — a survey lens that never landed. The lens IS the big shape, and
        // it is the only mimic with a single eye, so it never reads as the others.
        const ph = this.anim * 6, bob = Math.sin(ph) * 0.8;
        c.save(); c.translate(0, bob);
        // housing ring behind the lens
        c.strokeStyle = ramp(c, MAT.bronze, -10, -10, 10, 10); c.lineWidth = 2.4;
        c.beginPath(); c.arc(0, 0, 10.5, 0, 7); c.stroke();
        c.strokeStyle = MAT.steel.mid; c.lineWidth = 1;
        for (let i = 0; i < 3; i++) {                    // mounting struts
          const a = ph * 0.6 + i / 3 * Math.PI * 2;
          c.beginPath(); c.moveTo(Math.cos(a) * 6.5, Math.sin(a) * 6.5);
          c.lineTo(Math.cos(a) * 10.5, Math.sin(a) * 10.5); c.stroke();
        }
        // the lens body
        plate(() => { c.beginPath(); c.arc(0, 0, 7, 0, 7); c.closePath(); }, -8, 7);
        // single red iris — infection marker, one not two
        drawSensor(c, -1.2, 0, 2.5, this.hypnoT > 0 ? 'alert' : 'locked', this.anim);
        c.fillStyle = 'rgba(255,255,255,0.4)';   // specular, so the lens reads as glass
        c.beginPath(); c.ellipse(-3.4, -2.4, 1.8, 1, -0.5, 0, 7); c.fill();
        // arc emitters underneath
        accent(() => {
          for (const ex of [-5, 5]) { c.beginPath(); c.arc(ex, 8.4, 1.3, 0, 7); c.fill(); }
        }, true);
        c.strokeStyle = MAT.bronze.mid; c.lineWidth = 1;
        c.beginPath(); c.moveTo(0, -10.5); c.lineTo(0.6, -14); c.stroke();
        c.restore();
        break;
      }
      case 'surge': {
        // BRYT — a line breaker that kept its rail and lost its manners. Base
        // geometry no other mimic owns: a low HORIZONTAL DRUM with insulator
        // fins on its back — no legs (blob has legs), no barrel (that is the
        // turret), no wedge (the crawler's). Engine-drawn stand-in; authored
        // plates are queued (ART_QUEUE §2i) per the four-class art bible.
        const tell = (this.crouchT || 0) > 0;
        const vented = (this.windedT || 0) > 0;
        const k2 = tell ? 1 - clamp(this.crouchT / TELL_SWIPE, 0, 1) : 0;
        const hum = Math.sin(this.anim * (tell ? 26 : 7)) * (tell ? 1.2 : 0.4);
        // symmetric machine: undo the flip so it never appears to jump sides
        c.save(); c.scale(1 / flip, 1);
        // cable stubs arcing into the rail on both sides — it is PLUMBED in
        c.strokeStyle = MAT.steel.dark; c.lineWidth = 2.2; c.lineCap = 'round';
        for (const s of [-1, 1]) {
          c.beginPath(); c.moveTo(s * 11, 6);
          c.quadraticCurveTo(s * 17, 7, s * 19, 12); c.stroke();
        }
        // the mount saddle it is bolted to
        frame(() => { c.beginPath(); c.moveTo(-13, 12); c.lineTo(-11, 7); c.lineTo(11, 7); c.lineTo(13, 12); c.closePath(); }, 6, 12);
        for (const bx of [-9, 9]) joint(bx, 10.4, 1.5);
        // the drum — lifts a little as it charges, sags a little vented
        const lift = tell ? -k2 * 2.5 : vented ? 1.2 : 0;
        c.save(); c.translate(hum * 0.4, lift);
        plate(() => { c.beginPath(); c.ellipse(0, 0, 13, 8.5, 0, 0, 7); c.closePath(); }, -9, 9);
        seam(-11, -2.5, 11, -2.5, 0.2);
        // end caps
        c.fillStyle = ramp(c, MAT.bronze, -14, -4, -10, 4);
        c.beginPath(); c.ellipse(-11.4, 0, 2.6, 6.8, 0, 0, 7); c.fill();
        c.beginPath(); c.ellipse(11.4, 0, 2.6, 6.8, 0, 0, 7); c.fill();
        // insulator fins: folded flat at rest, FLARED through the charge,
        // drooped when vented — the silhouette IS the state (art bible §3.3)
        const flare = tell ? 0.55 + k2 * 0.75 : vented ? 0.12 : 0.3;
        for (const [fx, fs] of [[-6, -0.25], [0, 0], [6, 0.25]]) {
          c.save(); c.translate(fx, -7); c.rotate(fs * (1 - flare));
          plate(() => {
            c.beginPath(); c.moveTo(-2.6, 0);
            c.lineTo(-1.6, -3 - flare * 6.5); c.lineTo(1.6, -3 - flare * 6.5);
            c.lineTo(2.6, 0); c.closePath();
          }, -10 - flare * 6, -6);
          c.restore();
        }
        // the charge window: dull at rest, hot through the tell, dark vented —
        // plus open side vents while it is spent, so the window reads
        c.save();
        c.globalAlpha = vented ? 0.35 : 0.75 + k2 * 0.25;
        accent(() => { c.beginPath(); c.ellipse(0, 1.5, 5 + k2 * 1.5, 3 + k2, 0, 0, 7); c.fill(); }, tell);
        c.restore();
        if (vented) {
          c.fillStyle = '#1a222c';
          for (const s of [-1, 1]) c.fillRect(s * 8 - 2, -1, 4, 5.5);
          c.save(); c.globalAlpha = 0.4 + Math.sin(this.anim * 9) * 0.2;
          c.fillStyle = '#ff9a6a';
          for (const s of [-1, 1]) c.fillRect(s * 8 - 1.2, 0, 2.4, 3.6);
          c.restore();
        }
        eyes(-3, -5.5, 1.9);
        c.restore();   // drum lift
        c.restore();   // the un-flip
        break;
      }
      case 'kiln': {
        // GLOD — a casting pot that never stopped being fed. Base geometry no
        // other mimic owns: a squat VERTICAL CRUCIBLE with a flared mouth and
        // three damper petals on the rim — no legs (blob), no horizontal drum
        // (the breaker), no barrel (the turret), no wedge (the crawler).
        // Engine-drawn stand-in; authored plates are queued (ART_QUEUE §2l)
        // per the four-class art bible.
        const tell = (this.crouchT || 0) > 0;
        const blowing = (this.plumeT || 0) > 0;
        const spent = (this.windedT || 0) > 0;
        const k2 = tell ? 1 - clamp(this.crouchT / TELL_SWIPE, 0, 1) : 0;
        const shiver = blowing ? Math.sin(this.anim * 40) * 1.1 : tell ? Math.sin(this.anim * 24) * k2 * 0.8 : 0;
        // symmetric machine: undo the flip so it never appears to jump sides
        c.save(); c.scale(1 / flip, 1);
        // feed pipes arcing into the floor on both sides — it is PLUMBED in
        c.strokeStyle = MAT.steel.dark; c.lineWidth = 2.4; c.lineCap = 'round';
        for (const s of [-1, 1]) {
          c.beginPath(); c.moveTo(s * 10, 8);
          c.quadraticCurveTo(s * 17, 9, s * 19, 13); c.stroke();
        }
        // the slag skirt it sits in — cooled spillage, never a square plinth
        frame(() => {
          c.beginPath(); c.moveTo(-14, 13);
          c.quadraticCurveTo(-11, 7, -6, 8.5);
          c.quadraticCurveTo(0, 6.5, 6, 8.5);
          c.quadraticCurveTo(11, 7, 14, 13);
          c.closePath();
        }, 7, 13);
        for (const bx of [-8, 8]) joint(bx, 11.5, 1.4);
        // the pot — swells a little as it charges, sags a little spent
        const sag = spent ? 1.2 : 0;
        c.save(); c.translate(shiver, sag);
        plate(() => {
          c.beginPath();
          c.moveTo(-9, -8);                          // the flared mouth lip
          c.quadraticCurveTo(-13, -4, -11.5, 2);     // belly out
          c.quadraticCurveTo(-10, 8, 0, 9);
          c.quadraticCurveTo(10, 8, 11.5, 2);
          c.quadraticCurveTo(13, -4, 9, -8);
          c.quadraticCurveTo(0, -10, -9, -8);        // no straight rim
          c.closePath();
        }, -9, 9);
        seam(-10, 1, 10, 1, 0.2);
        // bronze mouth collar
        c.strokeStyle = ramp(c, MAT.bronze, -10, -10, 10, -6);
        c.lineWidth = 2.2;
        c.beginPath(); c.ellipse(0, -8, 9.6, 2.6, 0, 0, 7); c.stroke();
        // damper petals: folded over the mouth at rest, HINGED OPEN through
        // the charge, hanging wide and drooped when spent — the silhouette IS
        // the state (art bible §3.3)
        const open = tell ? 0.35 + k2 * 1.15 : blowing ? 1.6 : spent ? 1.85 : 0.25;
        for (const [px2, s] of [[-6, -1], [0, 0], [6, 1]]) {
          c.save(); c.translate(px2, -8.5);
          if (s) c.rotate(s * open);                 // side petals hinge out
          else c.translate(0, -open * 2.2);          // the middle petal lifts
          plate(() => {
            c.beginPath(); c.moveTo(-3, 0);
            c.quadraticCurveTo(0, -4.5 - open * 2.4, 3, 0);
            c.closePath();
          }, -13 - open * 3, -8);
          c.restore();
        }
        // the throat: dull embers at rest, white through the charge and the
        // blow, dead dark when spent — plus fallen-open side grates while it
        // is spent, so the window reads across the room
        c.save();
        c.globalAlpha = spent ? 0.22 : blowing ? 1 : 0.6 + k2 * 0.4;
        accent(() => { c.beginPath(); c.ellipse(0, -7.5, 5.5 + k2 * 2, 2 + k2, 0, 0, 7); c.fill(); }, tell || blowing);
        c.restore();
        if (spent) {
          c.fillStyle = '#1a222c';
          for (const s of [-1, 1]) c.fillRect(s * 8.5 - 2, 0, 4, 6);
          c.save(); c.globalAlpha = 0.4 + Math.sin(this.anim * 9) * 0.2;
          c.fillStyle = '#ff9a6a';
          for (const s of [-1, 1]) c.fillRect(s * 8.5 - 1.2, 1, 2.4, 4);
          c.restore();
        } else if (!blowing && chance(0.06)) {
          // idle breath: one ember slipping the dampers now and then
          addPart(cx + rnd(-3, 3), this.y - 2, rnd(-8, 8), rnd(-40, -20), 0.5, '#ff9430', 1.6, -30, true);
        }
        eyes(-4, 2.5, 1.8);
        c.restore();   // pot shiver/sag
        c.restore();   // the un-flip
        break;
      }
      case 'rime': {
        // RIM — an archive climate unit that never stopped chilling. Base
        // geometry no other mimic owns: a WAISTED CONDENSER BOBBIN — two
        // lobes and a pinched middle, wrapped in a cooling coil — no legs
        // (blob), no horizontal drum (the breaker), no flared crucible mouth
        // (the kiln), no barrel (the turret), no wedge (the crawler).
        // Engine-drawn stand-in; authored plates are queued (ART_QUEUE §2n)
        // per the four-class art bible.
        const tell = (this.crouchT || 0) > 0;
        const dark = (this.windedT || 0) > 0;
        const k2 = tell ? 1 - clamp(this.crouchT / TELL_HEAVY, 0, 1) : 0;
        const shiver = tell ? Math.sin(this.anim * 30) * k2 * 1.1 : 0;
        // symmetric machine: undo the flip so it never appears to jump sides
        c.save(); c.scale(1 / flip, 1);
        // feed lines arcing into the floor both sides — it is PLUMBED into
        // the stacks' chiller loop
        c.strokeStyle = MAT.steel.dark; c.lineWidth = 2.2; c.lineCap = 'round';
        for (const s of [-1, 1]) {
          c.beginPath(); c.moveTo(s * 9, 9);
          c.quadraticCurveTo(s * 16, 10, s * 18, 13); c.stroke();
        }
        // the hoar skirt it stands in — frost crust, never a square plinth
        frame(() => {
          c.beginPath(); c.moveTo(-13, 13);
          c.quadraticCurveTo(-10, 8, -5, 9.5);
          c.quadraticCurveTo(0, 7.5, 5, 9.5);
          c.quadraticCurveTo(10, 8, 13, 13);
          c.closePath();
        }, 8, 13);
        for (const bx of [-7, 7]) joint(bx, 11.5, 1.4);
        // the bobbin — lifts a hair as it charges, slumps a hair when dark
        const sag = dark ? 1.1 : tell ? -k2 * 1.6 : 0;
        c.save(); c.translate(shiver, sag);
        plate(() => {
          c.beginPath();
          c.moveTo(-8, -10);                          // upper lobe
          c.quadraticCurveTo(-11.5, -6, -9, -1.5);
          c.quadraticCurveTo(-5.5, 0.5, -9.5, 3);     // the pinched waist
          c.quadraticCurveTo(-12, 7.5, -7, 9.5);      // lower lobe
          c.quadraticCurveTo(0, 11, 7, 9.5);
          c.quadraticCurveTo(12, 7.5, 9.5, 3);
          c.quadraticCurveTo(5.5, 0.5, 9, -1.5);
          c.quadraticCurveTo(11.5, -6, 8, -10);
          c.quadraticCurveTo(0, -12, -8, -10);        // no straight shoulder
          c.closePath();
        }, -11, 10);
        // the cooling coil wrapped around the waist — bronze, three sagging turns
        c.strokeStyle = ramp(c, MAT.bronze, -8, 0, 8, 5); c.lineWidth = 1.8; c.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
          c.beginPath();
          c.moveTo(-8.5 + i * 0.7, 0.4 + i * 2.1);
          c.quadraticCurveTo(0, 2.6 + i * 2.1, 8.5 - i * 0.7, 0.2 + i * 2.1);
          c.stroke();
        }
        seam(-7, -8, 7, -8, 0.2);
        // the frost crown around the upper collar: laid low at rest, EXTENDED
        // through the charge, snapped drooping when it is dark — the
        // silhouette IS the state (art bible §3.3)
        const ext = tell ? 0.4 + k2 * 1.2 : dark ? 0.08 : 0.3;
        for (const [nx, s] of [[-5.5, -1], [0, 0], [5.5, 1]]) {
          c.save(); c.translate(nx, -9.5);
          if (dark) c.rotate(s * 1.9 + (s === 0 ? 0.5 : 0));   // snapped over
          else c.rotate(s * (0.6 - ext * 0.35));               // fanning upright
          plate(() => {
            c.beginPath(); c.moveTo(-2.2, 0);
            c.lineTo(-0.7, -3 - ext * 7); c.lineTo(0.7, -3 - ext * 7);
            c.lineTo(2.2, 0); c.closePath();
          }, -12 - ext * 6, -9);
          c.restore();
        }
        // the cold core in the upper lobe: a dull pulse at rest, white-bright
        // through the charge, DEAD DARK for the whole window — plus fallen-
        // open frost vents while it is dark, so the window reads across a room
        c.save();
        c.globalAlpha = dark ? 0.12 : tell ? 0.75 + k2 * 0.25 : 0.45 + Math.sin(this.anim * 2.2) * 0.15;
        accent(() => { c.beginPath(); c.ellipse(0, -5.5, 4.5 + k2 * 2, 3.4 + k2, 0, 0, 7); c.fill(); }, tell);
        c.restore();
        if (dark) {
          c.fillStyle = '#131c26';
          for (const s of [-1, 1]) c.fillRect(s * 7.5 - 2, 2, 4, 6);
          c.save(); c.globalAlpha = 0.35 + Math.sin(this.anim * 9) * 0.15;
          c.fillStyle = '#a8e4f4';
          for (const s of [-1, 1]) c.fillRect(s * 7.5 - 1.2, 3, 2.4, 4.4);
          c.restore();
        } else if (!tell && chance(0.05)) {
          // idle breath: cold FALLS — one frost mote slipping off the crown
          addPart(cx + rnd(-4, 4), this.y + 2, rnd(-6, 6), rnd(8, 26), 0.6, '#bfeaff', 1.5, 30, true);
        }
        eyes(-3, -3, 1.8);
        c.restore();   // bobbin shiver/sag
        c.restore();   // the un-flip
        break;
      }
      case 'snare': {
        // KNOT — a nest polyp that grew around a maintenance node and kept
        // its grip. Base geometry no other mimic owns: a ROOTED TEARDROP
        // BULB under an open thorn maw — no legs (blob), no horizontal drum
        // (the breaker), no flared crucible mouth (the kiln: its mouth is a
        // machine part; this is a mouth), no waisted bobbin (the rime), no
        // barrel (the turret), no wedge (the crawler). Engine-drawn
        // stand-in; authored plates are queued (ART_QUEUE §2p) per the
        // four-class art bible.
        const tell = (this.crouchT || 0) > 0;
        const reel = (this.reelT || 0) > 0;
        const limp = (this.windedT || 0) > 0;
        const k2 = tell ? 1 - clamp(this.crouchT / TELL_HEAVY, 0, 1) : 0;
        // the heartbeat: the broadcast's own ~0.9 Hz, racing when the line
        // is real — the one machine in the game that pulses like its boss
        const beat = limp ? 0 : (Math.sin(this.anim * (reel ? 11 : 5.65)) + 1) / 2;
        // symmetric machine: undo the flip, then LEAN toward the target —
        // the body aims where the tendril goes, so the read has a direction
        // without a wedge lying about one
        const twd = (typeof player !== 'undefined' && player)
          ? (Math.sign(player.x + player.w / 2 - (this.x + this.w / 2)) || 1) : 1;
        c.save(); c.scale(1 / flip, 1);
        // the holdfast: root-tendrils splayed into the floor — it GREW here
        c.strokeStyle = MAT.steel.dark; c.lineWidth = 2.4; c.lineCap = 'round';
        for (const [rx, ry2] of [[-11, 13], [-5, 13.5], [6, 13.5], [12, 13]]) {
          c.beginPath(); c.moveTo(rx * 0.35, 8);
          c.quadraticCurveTo(rx * 0.8, 10.5, rx, ry2); c.stroke();
        }
        c.save();
        c.translate(twd * (tell ? k2 * 2.2 : reel ? 2.2 : 0), limp ? 1.6 : -beat * 1.1);
        if (limp) c.rotate(twd * 0.14);              // sagged off its rooting
        // the bulb: a woven teardrop, fuller on one side — tissue, not turning
        plate(() => {
          c.beginPath();
          c.moveTo(-3, -11);
          c.quadraticCurveTo(-9.5, -8.5, -10.5, -1);
          c.quadraticCurveTo(-11.5, 6.5, -6, 9.5);
          c.quadraticCurveTo(0, 11.5, 6.5, 9);
          c.quadraticCurveTo(11.5, 6, 10, -1.5);
          c.quadraticCurveTo(9, -8, 3.5, -10.5);
          c.quadraticCurveTo(0, -12, -3, -11);
          c.closePath();
        }, -11, 10);
        // the winding strands: dead cable-tissue wrapped over the weave —
        // bronze, sagging, never a clean hoop
        c.strokeStyle = ramp(c, MAT.bronze, -9, -2, 9, 8); c.lineWidth = 1.6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-10, 0.5); c.quadraticCurveTo(-2, 3.6, 9.5, 1); c.stroke();
        c.beginPath(); c.moveTo(-8.5, 5.5); c.quadraticCurveTo(1, 8, 8, 5); c.stroke();
        seam(-6, -7.5, 5, -8.5, 0.18);
        // the maw: a ring of thorn hooks around the crown — closed low at
        // rest, SPREAD through the tell (the silhouette is the state, art
        // bible §3.3), clenched during the reel, hanging slack when limp
        const spread = tell ? 0.35 + k2 * 1.0 : reel ? 0.2 : limp ? 0.06 : 0.3;
        for (const [nx, s] of [[-6, -1], [-2, -0.4], [2.5, 0.4], [6.5, 1]]) {
          c.save(); c.translate(nx, -9 + Math.abs(s) * 1.4);
          if (limp) c.rotate(s * 2.1 + 0.3);         // thorns drooped over
          else c.rotate(s * (1.15 - spread * 0.7));  // fanning open
          frame(() => {
            c.beginPath(); c.moveTo(-1.8, 0);
            c.quadraticCurveTo(-0.6, -2.5 - spread * 5.5, 0.9, -3.2 - spread * 6);
            c.quadraticCurveTo(0.9, -1.4 - spread * 3, 1.8, 0);
            c.closePath();
          }, -13 - spread * 5, -8);
          c.restore();
        }
        // the core in the bulb's heart: the infection's own red, pulsing on
        // the beat — white-hot through the tell, DEAD DARK for the whole
        // limp window, so the opening reads across a room
        c.save();
        c.globalAlpha = limp ? 0.1 : tell ? 0.7 + k2 * 0.3 : 0.35 + beat * 0.3;
        accent(() => { c.beginPath(); c.ellipse(twd * 0.8, -2.5, 4.2 + k2 * 2, 5 + k2, 0, 0, 7); c.fill(); }, tell || reel);
        c.restore();
        if (limp) {
          // the spent tendril, lying where it fell — visibly empty hands
          c.strokeStyle = '#5a2430'; c.lineWidth = 2; c.lineCap = 'round';
          c.beginPath(); c.moveTo(twd * 3, -8);
          c.quadraticCurveTo(twd * 12, -2, twd * 17, 12);
          c.quadraticCurveTo(twd * 20, 13.5, twd * 23, 13); c.stroke();
        } else if (!tell && !reel && chance(0.04)) {
          // idle breath: a spore mote drifting UP off the maw — the Nest
          // exhales; the Archives' cold falls, this rises
          addPart(cx + rnd(-4, 4), this.y - 2, rnd(-8, 8), -rnd(8, 24), 0.6, '#ff9a9a', 1.5, -24, true);
        }
        eyes(-4, -6, 1.7);
        c.restore();   // the lean
        c.restore();   // the un-flip
        break;
      }
      default: {
        // VAKT — bolted down, still guarding a door that leads nowhere. Rooted
        // trapezoid: the only mimic with no legs and a horizontal base.
        const ph = this.anim * 3;
        const aim = Math.sin(ph * 0.5) * 0.22;
        // base, wider at the floor, with visible anchor bolts
        plate(() => {
          c.beginPath(); c.moveTo(-13, 15); c.lineTo(-8, 2); c.lineTo(8, 2); c.lineTo(13, 15); c.closePath();
        }, 0, 15);
        for (const bx of [-9.5, 9.5]) joint(bx, 12.4, 1.6);
        seam(-8.6, 6, 8.6, 6, 0.2);
        // shoulder collar — head-area mass, where recognition lives
        plate(() => {
          c.beginPath(); c.moveTo(-9, 2); c.lineTo(-7.5, -3); c.lineTo(7.5, -3); c.lineTo(9, 2); c.closePath();
        }, -4, 3);
        c.save(); c.rotate(aim);
        // turret head + barrel
        plate(() => {
          c.beginPath(); c.moveTo(-6.5, -3); c.lineTo(-5, -10); c.lineTo(5, -10); c.lineTo(6.5, -3); c.closePath();
        }, -11, -2);
        c.fillStyle = ramp(c, MAT.steel, -13, -9, -5, -5); c.fillRect(-13, -8.4, 8, 3.4);   // barrel
        accent(() => {                                                // arc coils
          for (let i = 0; i < 3; i++) c.fillRect(-12 + i * 2.4, -8.8, 1, 4.2);
        }, true);
        eyes(-3.4, -8, 2);
        c.restore();
        // (the lock light is drawn in draw(), above every early return)
        break;
      }
    }
    c.restore();
  }
}

// ---------------------------------------------------------------------------
// THE SCALE LAW (sprite spec, section C: WORLD SCALE / CHARACTER SCALE).
// HZD-99 is the canonical reference. Ordinary minions must read SMALLER than her;
// every boss must read LARGER. Two minions had drifted out of that order: the
// flier and the blob were drawn at boss-like multiples of their own hitbox
// (~2.5x and ~2.7x, against ~1.45x for everything else), which pushed both above
// the hero — and pushed the blob above an actual boss.
//
// This trims the DRAWING only. Collision boxes, damage and fight tuning are
// untouched, and the scale is taken about each creature's ground-contact point
// so feet stay planted on the same floor line (section M: GROUNDING).
// ---------------------------------------------------------------------------
// The blob is oversized in BOTH games — it has no hand-drawn Odyssey sheet, so
// the Odyssey draws it from the same atlas and inherits the same problem. The
// flier only overshoots in CLAWBYTE; the Odyssey's ghost has its own sheet and
// already sits correctly under that hero, so trimming it there would shrink it
// to nothing.
const EDRAW = { blob: 0.56 };
const EDRAW_ROBO = { flier: 0.64 };
const _enemyDrawRaw = Enemy.prototype.draw;
Enemy.prototype.draw = function (c) {
  const hero = typeof isHero === 'function' && isHero();
  const k = EDRAW[this.kind] || (hero ? 0 : EDRAW_ROBO[this.kind]);
  if (!k) return _enemyDrawRaw.call(this, c);
  const px = this.x + this.w / 2, py = this.y + this.h;
  c.save();
  c.translate(px, py); c.scale(k, k); c.translate(-px, -py);
  try { _enemyDrawRaw.call(this, c); } finally { c.restore(); }
};

// tumbling burning wreck — the dramatic enemy death
class Wreck {
  constructor(e, kx, ky) {
    this.x = e.x; this.y = e.y; this.w = e.w; this.h = e.h; this.kind = e.kind;
    const n = Math.hypot(kx, ky) || 1;
    this.vx = (kx / n) * rnd(240, 380) + rnd(-40, 40);
    this.vy = (ky / n) * 220 - rnd(180, 320);
    this.rot = 0; this.vr = rnd(-9, 9) || 6;
    this.t = rnd(0.7, 1); this.dead = false; this.bounced = 0;
  }
  update(dt) {
    this.t -= dt; this.rot += this.vr * dt;
    this.vy += 1900 * dt;
    const pv = this.vy;
    const col = moveEnt(this, dt);
    if (col.d && pv > 120) {
      this.vy = -pv * 0.45; this.vx *= 0.7; this.vr *= 0.8; this.bounced++;
      sfx('phit');
      burst(this.x + this.w / 2, this.y + this.h, 5, '#9fb8c8', 100, 0.3, 500, 2);
    }
    if (col.l || col.r) this.vx *= -0.5;
    if (chance(0.4)) addPart(this.x + rnd(0, this.w), this.y + rnd(0, this.h), rnd(-40, 40), rnd(-90, 0), 0.35, chance(0.5) ? '#ffd76a' : '#ff8a5c', 2.5, 500, true);
    if (this.t <= 0 || this.bounced >= 3 || onSpike(this) || this.y > G.roomDef.h * TILE + 60) this.explode();
  }
  explode() {
    if (this.dead) return;
    this.dead = true;
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    sfx('boom'); cam.shake = Math.max(cam.shake, 4);
    burst(cx, cy, 22, PAL[G.roomDef.zone].glow, 300, 0.6, 400, 4, true);
    burst(cx, cy, 10, '#ffd76a', 240, 0.5, 600, 3, true);
    G.addRing(cx, cy);
    // The waking floor's one machine pays for the lesson that follows it: the
    // trader two screens away is useless if the first kill cannot buy anything
    // from him, and a tutorial that asks you to farm is not a tutorial.
    G.dropScrap(cx, cy, G.roomId === 'A0' ? 18 : irnd(4, 9));
    G.maybeDropRelic(cx, cy);
  }
  draw(c) {
    c.save();
    c.translate(this.x + this.w / 2, this.y + this.h / 2);
    c.rotate(this.rot);
    c.fillStyle = '#39424f';
    rr(c, -this.w / 2, -this.h / 2 + 3, this.w, this.h - 6, 5); c.fill();
    c.fillStyle = '#20262f';
    c.fillRect(-this.w / 2 + 3, -3, this.w * 0.4, 5);
    c.fillStyle = 'rgba(255,138,92,0.9)'; c.shadowColor = '#ff8a5c'; c.shadowBlur = 8;
    c.beginPath(); c.arc(this.w * 0.15, -2, 2.5, 0, 7); c.fill();
    c.shadowBlur = 0;
    c.restore();
  }
}

// ================= BOSSES =================
// ---------------------------------------------------------------------------
// USING THE WHOLE TURNTABLE.
//
// Every machine is a pre-rendered 3D turnaround, eight authored angles that the
// renderer cross-fades between — but the only thing that ever moved the yaw was
// which way it was facing. That makes a turn read as a volume and everything
// else read as a cutout, which is why the cast looked flatter than the art
// actually is.
//
// So the yaw now answers to what the machine is DOING as well as where it is
// looking. Nothing here changes a silhouette or a palette: it is the same
// authored frames, sampled at angles they were rendered for and never reached.
// ---------------------------------------------------------------------------
function enemyYaw(e) {
  const base = yawColF(e.faceVis);
  // The turntable wraps, and angles 5-7 are the BACK of the model. A
  // side-scroller must never show those, so every offset is clamped to keep the
  // whole sweep inside the front hemisphere 0..4 — measured, because the first
  // version of this happily rotated a crawler around to face away from camera.
  const S = (c, a) => ({ c: clamp(c, a, 4 - a), r: 0, a });
  switch (e.kind) {
    case 'turret':
      // a sentry sweeping its arc — it does not walk, so the sweep IS its motion
      return Object.assign(S(2, 1.6), { r: 0.55 });
    case 'flier':
      // BANKS into its own movement, the way anything that flies has to, and
      // drifts a little while hovering so it is never perfectly still
      return Object.assign(S(base + clamp(e.vx / 150, -1, 1) * 1.15, 0.30), { r: 0.9 });
    case 'crawler':
      // a slow head-scan while it walks: it is looking for her
      return Object.assign(S(base, Math.abs(e.vx) > 12 ? 0.22 : 0.45), { r: 0.7 });
    case 'blob':
      // a mass that has no front rolls where it is going
      return Object.assign(S(base + clamp(e.vx / 120, -1, 1) * 0.8, 0.35), { r: 0.5 });
    case 'hopper':
      // twists in the air and squares up as it lands
      return Object.assign(S(base + clamp(-e.vy / 500, -1, 1) * 0.9, e.on ? 0.12 : 0.3), { r: 1.4 });
    default:
      return Object.assign(S(base, 0.25), { r: 0.6 });
  }
}
// the states that own their stagger rather than being interrupted by one
const BOSS_SELF_STAG = { nullend: 1, cffloor: 1 };

// ---------------------------------------------------------------------------
// ONE GUARDIAN, ONE QUESTION — and it has to be asked no matter what lands the
// last blow.
//
// Four separate places in the combat code destroy an entity the instant its
// health reaches zero: the claw's hitbox, the shuriken, the Song, and the
// pounce. Every one of them called die() on the spot. So a guardian killed by
// an actual attack — which is every guardian a player has ever killed — was
// already dead and already playing its death by the time Boss.update looked at
// its health and offered the choice. The fork only ever fired in tests that
// subtracted health directly without swinging anything, which is precisely why
// it passed its own test suite while never once appearing in the game.
//
// The question therefore lives HERE, and die() asks it before doing anything
// else. Whatever kills a guardian, it kneels first.
// ---------------------------------------------------------------------------
// ===========================================================================
// THE EYE'S CONSTRUCTS — the mini-bosses, and why they are a different kind of
// thing from a guardian.
//
// A guardian is a MACHINE THAT WAS INFECTED. It had a life before the Song and
// it can have one after, which is why the fight ends in a question and why
// sparing one turns it into something that follows you home.
//
// These did not. They were MADE by the source of the Song — the Eye — and there
// is nothing underneath the virus to give back. So they are destroyed, they are
// never offered the fork, and they leave no trophy but the Power Cell they were
// built around.
//
// AND THEY ARE NOT UGLY, deliberately. The obvious reading of "made by the
// enemy" is teeth and spikes, and that reading is wrong here: the Eye does not
// build monsters, it builds INSTRUMENTS. A wind-chime. A courier still running
// its route. A moth going to the heat. A frost lattice growing toward you. Each
// is clean, symmetrical, almost pretty — and each is trying to kill you. The
// unease is the point, and it is the reason they are procedural geometry and
// light rather than authored creatures (ART_BIBLE.md §1, class E).
const MINIS = {
  chime:  { w: 44, h: 58, hp: 130, zone: 'A', col: '#9fe8ff', acc: '#eefcff' },
  carrier:{ w: 52, h: 46, hp: 165, zone: 'B', col: '#57a8ff', acc: '#cfe6ff' },
  moth:   { w: 60, h: 48, hp: 200, zone: 'C', col: '#ffab4a', acc: '#ffe6b8' },
  lattice:{ w: 50, h: 62, hp: 235, zone: 'D', col: '#bfeaff', acc: '#ffffff' },
  lens:   { w: 46, h: 46, hp: 270, zone: 'X', col: '#ff7ad1', acc: '#ffd9f2' },
};
function isMini(b) { return !!(b && MINIS[b.kind]); }
// TWO AUTHORED PLATES EACH, and the reason there are two is the silhouette law.
//
// The first cut of these was procedural line art — a few strokes and a glow —
// on the argument that they are "geometry and light, not creatures". That was
// a rationalisation written while the art connector was down, and it shows:
// next to a rendered guardian they read as flat 2D drawings in a 3D game. They
// are generated and rendered like everything else now.
//   k    — how many hitbox-heights the plate occupies
//   fly  — bob amplitude and lean, for the ones that hover
//   spin — constant rotation, for the ones that have no up
const MINI_ART = {
  chime:   { rest: 'eyeChime',   warn: 'eyeChimeW',   k: 1.9, fly: 1 },
  carrier: { rest: 'eyeCarrier', warn: 'eyeCarrierW', k: 1.8, fly: 1 },
  moth:    { rest: 'eyeMoth',    warn: 'eyeMothW',    k: 1.7, fly: 1 },
  // `foot` anchors the plate by its BOTTOM instead of its centre. The two
  // lattice plates have different aspect ratios (it grows), so centring them
  // moved the thing's base 11 px off the floor between rest and wind-up —
  // which tests/artbible.cjs measures as feet leaving the ground.
  lattice: { rest: 'eyeLattice', warn: 'eyeLatticeW', k: 1.8, fly: 0, spin: 0.22, foot: 1 },
  lens:    { rest: 'eyeLens',    warn: 'eyeLensW',    k: 1.7, fly: 1, spin: 0.35 },
};
// ---------------------------------------------------------------------------
// HOW THEY LOOK, and why none of them has a face.
//
// "They do not need to look evil" is the brief, and the honest way to honour it
// is not to soften a monster — it is not to draw a monster. Each of these is an
// OBJECT that happens to be hunting you: a mobile, a courier, a moth, a growing
// crystal, a lens. Clean, symmetrical, mostly still. Nothing snarls, nothing
// bares anything, and that is exactly what makes them uncomfortable to be in a
// room with.
//
// They are procedural on purpose (ART_BIBLE.md §1, class E): every one of them
// is geometry and light rather than a creature with anatomy, and a generator
// asked for "a beautiful lethal machine" returns a beautiful lethal ANIMAL.
function drawMini(c, b, cx, cy) {
  const M = MINIS[b.kind], A = MINI_ART[b.kind], t = b.anim || 0;
  const warn = /warn$/.test(b.st || '');
  c.save();
  c.translate(cx, cy);
  if (b.dead) c.globalAlpha *= Math.max(0, 1 - (1.6 - (b.deathAnimT || 0)) / 1.6);
  // the wash behind it, which is what the wind-up is read from at a glance
  {
    const R = Math.max(b.w, b.h) * 1.7;
    const g = c.createRadialGradient(0, 0, 0, 0, 0, R);
    g.addColorStop(0, M.col); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.save(); c.globalCompositeOperation = 'lighter';
    c.globalAlpha = (warn ? 0.26 : 0.14) * (0.85 + 0.15 * Math.sin(t * 6));
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill(); c.restore();
  }
  const im = MEDIA_IMG[warn ? A.warn : A.rest];
  if (im && im.naturalWidth) {
    // scaled to the hitbox by HEIGHT and drawn about its centre. The wind-up
    // plate is a different drawing rather than the same one tinted, so the
    // silhouette genuinely changes — which is the one rule this class cannot
    // satisfy with a rig, because it has no rig.
    const k = (b.h * A.k) / im.naturalHeight;
    const w = im.naturalWidth * k, h = im.naturalHeight * k;
    // and it is ALIVE: a bob, a lean into its own motion, and a swell on the
    // wind-up. A static plate slid around a room is the thing the guardians'
    // leap was rebuilt to stop being.
    const bob = Math.sin(t * (A.fly ? 3.1 : 1.6)) * (A.fly ? 4 : 1.6);
    // grounded constructs hang off the floor line, not off their own middle
    const foot = A.foot ? (b.h / 2 - h / 2) : 0;
    const lean = clamp((b.vx || 0) / 900, -0.22, 0.22) * (A.fly ? 1 : 0.4);
    const pop = warn ? 1 + 0.06 * Math.sin(t * 22) : 1;
    c.save();
    c.translate(0, bob + foot);
    c.rotate(lean + (A.spin ? t * A.spin : 0));
    c.scale(pop * (b.face > 0 ? -1 : 1), pop);
    if (b.hurtT > 0) { c.globalAlpha *= 0.85; }
    c.drawImage(im, -w / 2, -h / 2, w, h);
    // hurt flash: the plate re-drawn as pure white through a lighter pass
    if (b.hurtT > 0) {
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5;
      c.drawImage(im, -w / 2, -h / 2, w, h); c.restore();
    }
    c.restore();
  }
  c.restore();
}
// The five differ in the SHAPE of a move, never in its grammar.
//   near  — inside this, use `close`; outside it, use `far`
//   dur   — how long the committed move lasts
//   fly   — holds a station in the air instead of standing on the floor
const MINI_KIT = {
  // CHIME — a mobile of tuning forks. It sings, and the song is a ring of
  // notes. Slow, wide, and completely avoidable if you read the wind-up.
  chime:   { fly: 1, spd: 120, stand: 150, hover: 90, near: 190,
             close: 'note', far: 'ring', dur: 0.5, lungeV: 0 },
  // CARRIER — a courier that never stopped. It throws the parcel, then runs
  // its route straight through you.
  carrier: { fly: 1, spd: 175, stand: 200, hover: 70, near: 230,
             close: 'lunge', far: 'toss', dur: 0.42, lungeV: 480 },
  // MOTH — going to the heat. Scatters cinders, then climbs and drops.
  moth:    { fly: 1, spd: 150, stand: 170, hover: 130, near: 210,
             close: 'drop', far: 'cinder', dur: 0.55, lungeV: 0 },
  // LATTICE — it does not chase. It GROWS toward you, and what it grows is
  // solid until it shatters.
  lattice: { fly: 0, spd: 90, stand: 0, hover: 0, near: 260,
             close: 'spike', far: 'grow', dur: 0.6, lungeV: 0 },
  // LENS — the Eye's own instrument. It focuses, and then the line it drew is
  // where the beam goes.
  lens:    { fly: 1, spd: 140, stand: 240, hover: 120, near: 300,
             close: 'lunge', far: 'beam', dur: 0.7, lungeV: 420 },
};
// WHAT EACH COMMITTED MOVE ACTUALLY DOES. Split out of the state machine so the
// machine stays readable — the machine is about WHEN, this is about WHAT.
function miniFire(b, st, K) {
  const col = MINIS[b.kind].col;
  const cx = b.cx(), cy = b.cy();
  // Player has no cx()/cy() — only Boss does. Writing player.cy() crashed every
  // aimed move the moment it fired, and tests/minis.cjs found it before the
  // fight was ever played.
  const pcx = player.x + player.w / 2, pcy = player.y + player.h / 2;
  if (st === 'ring') {
    // a ring of eight notes, slow enough to walk out of
    b.ring(8, 180, b.anim);
    sfx('shoot');
  } else if (st === 'note') {
    // three aimed notes in a narrow fan
    const a0 = Math.atan2(pcy - cy, pcx - cx);
    for (let i = -1; i <= 1; i++)
      b.shoot(Math.cos(a0 + i * 0.22) * 260, Math.sin(a0 + i * 0.22) * 260, 6);
    sfx('shoot');
  } else if (st === 'toss') {
    // the parcel: a heavy arc that lands where she IS, not where she was
    const dx = pcx - cx;
    G.projs.push(new Proj(cx, cy, clamp(dx * 1.05, -420, 420), -300, false, 1, 9, col, 900, 3));
    sfx('shoot');
  } else if (st === 'cinder') {
    // cinders scattered wide and falling — an area to leave, not a shot to dodge
    for (let i = 0; i < 7; i++)
      G.projs.push(new Proj(cx + rnd(-30, 30), cy, rnd(-180, 180), rnd(-260, -140), false, 1, 5, col, 780, 3));
    sfx('shoot');
  } else if (st === 'drop') {
    b.vy = 620; b.vx = 0;                    // straight down onto her
    sfx('dash');
  } else if (st === 'grow') {
    // IT BUILDS. Three columns of ice marching toward her along the floor —
    // the only construct whose attack persists in the room after it fires.
    const gy = b.y + b.h;
    for (let i = 1; i <= 3; i++) {
      const gx = cx + b.face * i * 92;
      G.projs.push(new Proj(gx, gy - 14, 0, -170, false, 1, 8, col, -520, 1.1));
    }
    sfx('cast');
  } else if (st === 'spike') {
    for (let i = -1; i <= 1; i++) b.shoot(b.face * 300, i * 130, 7);
    sfx('shoot');
  } else if (st === 'beam') {
    // the focus already told you the line; this is that line arriving
    const a0 = Math.atan2(pcy - cy, pcx - cx);
    for (let i = 0; i < 5; i++)
      G.projs.push(new Proj(cx + Math.cos(a0) * i * 22, cy + Math.sin(a0) * i * 22,
        Math.cos(a0) * 520, Math.sin(a0) * 520, false, 1, 6, col, 0, 1.6));
    sfx('shoot');
  }
}
function bossFork(b) {
  // the Eye's constructs are never offered mercy: there is nobody in there
  if (isMini(b)) return false;
  if (!b || b.forkAsked || b.dead || b.kind === 'mother') return false;
  if (typeof brOffer !== 'function' || typeof G === 'undefined') return false;
  if (typeof player === 'undefined' || !player || player.dead) return false;
  if (typeof isHero === 'function' && isHero()) return false;
  b.forkAsked = true;
  b.hp = 0; b.vx = 0; b.vy = 0; b.stagT = 0;
  // G.forkBoss FIRST, and that ordering is now load-bearing. It used to be set
  // after brOffer because brOffer only opened a dialog and the answer arrived
  // frames later. Under TAME_ONLY brOffer ANSWERS ON THE SPOT — and brAnswer
  // reads G.forkBoss to find the creature it is answering about, so setting it
  // afterwards meant every guardian resolved into an empty branch: no tame, no
  // spoil, no flag, and a boss left standing at zero health. tests/wolves.cjs
  // caught it on the Alpha.
  G.forkBoss = b;
  brOffer(b.kind === 'glitch' ? 'firstboss' : 'boss');
  return true;
}
// `dazeAt` opts a guardian into the hit-group break (see DAZE_WINDOW in
// types.js): land this many hits inside the rolling window and it comes apart
// for a second and a half. NULLFANG is the first guardian you meet and the one
// whose whole read is "a big cat you can out-time", so it is the right place
// to teach the mechanic; the others are deliberately left off until this one
// has been played enough to know the number is right.
const BSTAT = Object.assign({
  glitch: { w: 84, h: 56, hp: 220, dazeAt: 5 },
  brood: { w: 96, h: 64, hp: 320 },
  atlas: { w: 62, h: 74, hp: 460 },
  zero: { w: 112, h: 62, hp: 500 },   // GLACIERE: a long floating quadruped
  // PRISM is the nimble rival, so it stays the smallest guardian — but a boss
  // still has to stand over HZD-99 (36), and at 34 it stood under her.
  prism: { w: 62, h: 46, hp: 520 },
  mother: { w: 120, h: 120, hp: 750 },
  // THE ALPHA. The first mini-boss in the run, and the only one that is TAMED
  // rather than destroyed — see js/wolves.js. Wider than NULLFANG and shorter:
  // it is a quadruped that fights along the floor, and its reach is the length
  // of it. 300 HP puts it just above the first guardian's 220 while she still
  // has no dash, which is where the fight wants to sit — losable, not long.
  alpha: { w: 104, h: 58, hp: 300 },
// ...and the Eye's constructs join the same table, so every piece of machinery
// that already works on a boss — the hurt flash, the health bar, the telegraph
// wash, the artbible harness — works on them without a second code path. They
// differ in what they ARE, not in how they are plumbed.
}, MINIS);
// ===========================================================================
// THE RAKE — HZD-99's claw arc, from an authored light sheet.
//
// The sheet is painted on pure black, which is the whole trick: drawn with
// 'lighter' the black contributes nothing and the glow composites correctly
// over any background, so there is no alpha channel to cut and no matte to
// get wrong. Brightness is the alpha.
//
// The art arcs from upper-left down to lower-right, so each draw rotates it
// onto the swing direction and mirrors it for the way she is facing.
// ===========================================================================
const RAKE = {
  rake1: [39, 33, 156, 178], rake2: [229, 34, 195, 177], heavy: [457, 30, 252, 214],
  burstL: [807, 68, 168, 164], xrake: [37, 249, 304, 291], burstM: [542, 278, 159, 151],
  burstS: [407, 313, 83, 81], ring: [761, 329, 231, 60], streak: [372, 472, 374, 49],
};
// ---------------------------------------------------------------------------
// WHERE THE CUT GOES — AND WHY IT WAS LANDING ON HER
//
// A CLAW MARK IS TANGENTIAL, NOT RADIAL. The claws swing on an arc about the
// shoulder, so the streaks they leave run ACROSS the strike, curving around her
// — three parallel crescents perpendicular to the line from shoulder to paw.
// The cut used to be laid out the other way: its long axis pointed along that
// line, so it ran from her chest outward like a spear, and everything from the
// midpoint back was painted on the cat throwing it. Rotating it a quarter turn
// is most of this fix, and it is why the effect never read as a swipe.
//
// The second half is the radius. A straight chord tangent to a circle lies
// entirely OUTSIDE that circle, so once the arc is tangential, keeping its
// midpoint at least RAKE_CLEAR from the shoulder puts the whole stroke clear of
// her — at every angle, at every point in the swing, whatever the body is doing.
// That is the property the old version could not have at any offset: a radial
// stroke through her shoulder always crosses her.
//
// RAKE_CLEAR is measured from the shoulder (10, -20), which sits on her front
// edge, out past the far side of her head and hips. RAKE_OUT then carries the
// mark BEYOND the claws — a swipe leaves its mark in the air the claws opened,
// not on the claws — and it is what stops a stroke this long from curling round
// her: at radius 25 an arc of 44 subtends ninety degrees and wraps her like a
// halo; the same arc at 34 subtends fifty and reads as a swipe through the air.
const RAKE_CLEAR = 31, RAKE_OUT = 12;
// how far the arc trails BEHIND the paw, as a fraction of its own length: the
// claws lead the mark they are making
const RAKE_LAG = 0.3;
function rakePlace(c, mk, aim) {
  const r = mk.r || 1;
  const R = Math.max(r + RAKE_OUT, RAKE_CLEAR);
  let ux = (mk.x - mk.sx) / r, uy = (mk.y - mk.sy) / r;
  if (aim != null) {
    // THE MARK FOLLOWS THE AIM, NOT THE PAW. The paw is high in the wind-up
    // and low in the follow-through, so a mark anchored to it landed over her
    // head mid-swing and under her feet at the end — reported exactly so:
    // "scratching under her feet instead of in front of her like a normal
    // cat." The cut's sweep still comes from the paw's travel; only its HOME
    // is now two-thirds the swing's aim, one-third the paw — a forward cut
    // marks forward at chest height, an up-cut above, a pogo below.
    const bx = Math.cos(aim), by = Math.sin(aim);
    ux = ux * 0.34 + bx * 0.66; uy = uy * 0.34 + by * 0.66;
    const n = Math.hypot(ux, uy) || 1; ux /= n; uy /= n;
  }
  c.translate(mk.sx + ux * R, mk.sy + uy * R);
  // +x becomes the direction the paw is travelling; -y, after the caller's
  // y-flip by dir, points away from the shoulder, so the crescent bows outward
  c.rotate(mk.a + Math.PI / 2 * mk.dir);
}
function drawRake(c, pl, mk) {
  const dir = mk.dir, far = mk.far;
  const im = (typeof MEDIA_IMG !== 'undefined') ? MEDIA_IMG.slashFx : null;
  if (!im || !im.naturalWidth) return;
  const sv = pl.swingVis, p = clamp(1 - sv.t / sv.t0, 0, 1);
  if (p < 0.06) return;                       // nothing during the wind-up
  // the swing's aim in the MARK's (body) space: the body transform mirrors
  // with facing, so forward is +x either way — fold the facing out of ang
  const abody = Math.atan2(Math.sin(sv.ang), Math.cos(sv.ang) * (pl.faceVis || 1));
  // snaps in, holds a moment, thins away — a cut does not fade evenly
  const a = p < 0.22 ? p / 0.22 : Math.pow(1 - (p - 0.22) / 0.78, 1.5);
  if (a <= 0.02) return;
  const claw = pl.clawT > 0;
  // THE CRYSTAL'S CUT IS LIGHT. Until the authored slash sheets (ART_QUEUE
  // §1b-i) land as MEDIA keys, the purifier's arc is drawn as pure additive
  // light — the one channel the art rules leave procedural (§0.0) — and never
  // as the claw sheet, which is claw art and would put a cat's rake on a
  // sword's cut.
  if (sv.wield) { drawCrystalArc(c, pl, mk, sv, p, abody); return; }
  // THE LONG RAKE IS EARNED. The wide shining arc is the best-looking thing in
  // the sheet, and spending it on every third punch from the first room leaves
  // nothing to grow into. The default finisher is a heavier version of the same
  // short cut she has been throwing all along; the long one belongs to the
  // skill, and to the feral claws.
  const longRake = claw || (typeof hasSkill === 'function' && hasSkill('reach'));
  const key = sv.combo === 2 ? (longRake ? 'xrake' : 'rake2')
    : sv.combo === 1 ? 'rake2' : 'rake1';
  const r = RAKE[key];
  // it grows through the swing, so the arc opens rather than sitting still
  // sized against HER, not against the screen: she is 36px tall, so a rake that
  // reads as a heavy blow is about her own height and not three times it
  // SIZED AGAINST HER REACH, NOT HER BODY. At her own height the arc washed
  // straight across the cat throwing it; a rake belongs in front of the paw,
  // close in, where a cat actually pulls its claws.
  const h = (sv.combo === 2 ? (longRake ? 34 : 24) : sv.combo === 1 ? 21 : 19)
    * (claw ? 1.3 : 1) * (far ? 0.9 : 1) * (0.84 + p * 0.26);
  // the art is WIDER than it is tall and its width is now the sweep, so it is
  // sized by the length of the stroke rather than by its thickness
  const w = r[2] / r[3] * h;
  c.save();
  c.globalCompositeOperation = 'lighter';
  rakePlace(c, mk, abody);
  c.scale(1, dir);                            // bow away from the shoulder
  // The finisher already has its own authored identity — the golden crossing X
  // drawn below. This sweep sits UNDER it at half strength so the third beat
  // reads as one heavier blow rather than two effects arguing.
  c.globalAlpha = a * (claw ? 0.95 : 0.8) * (sv.combo === 2 ? 0.5 : 1) * (far ? 0.8 : 1);
  c.drawImage(im, r[0], r[1], r[2], r[3], -w * (0.5 + RAKE_LAG), -h / 2, w, h);
  // the strike flash: one bright burst on the frame the hitbox is live, thrown
  // at the LEADING tip of the stroke — where the claws are, not where they were
  if (p > 0.18 && p < 0.42 && sv.combo !== 2) {
    const b = RAKE.burstS;
    const bh = (sv.combo === 2 ? 22 : 15) * (claw ? 1.3 : 1);
    const bw = b[2] / b[3] * bh;
    c.globalAlpha = (1 - Math.abs(p - 0.3) / 0.12) * 0.85;
    c.drawImage(im, b[0], b[1], b[2], b[3], w * (0.5 - RAKE_LAG) - bw / 2, -bh / 2, bw, bh);
  }
  c.restore();
}
// The purifier's stroke: a tapered crescent of white light, bright at the
// leading edge, with a cold blue wash behind it. The joined blade (wield 2)
// cuts TWICE — a second crescent trails the first by a beat, which is the
// visual twin of the doubled whoosh in audio.js. All additive; no body art.
function drawCrystalArc(c, pl, mk, sv, p, abody) {
  const heavy = sv.combo === 2;
  const L = (heavy ? 50 : sv.combo === 1 ? 38 : 33) * (sv.wield === 2 ? 1.15 : 1);
  const TH = heavy ? 13 : 9;
  c.save();
  c.globalCompositeOperation = 'lighter';
  rakePlace(c, mk, abody);
  c.scale(1, mk.dir);
  const passes = sv.wield === 2 ? [0, 0.16] : [0];
  for (const off of passes) {
    const q = clamp(p - off, 0, 1);
    if (q <= 0.05) continue;
    const env = q < 0.22 ? q / 0.22 : Math.pow(1 - (q - 0.22) / 0.78, 1.5);
    if (env <= 0.02) continue;
    const grow = 0.8 + q * 0.35;
    const a0 = -Math.PI * 0.78, a1 = -Math.PI * 0.22;
    c.beginPath();
    c.arc(0, L * 0.62 * grow, L * grow, a0, a1);
    c.arc(0, L * 0.62 * grow, (L - TH) * grow, a1, a0, true);
    c.closePath();
    const g = c.createRadialGradient(0, L * 0.62 * grow, (L - TH) * grow, 0, L * 0.62 * grow, L * grow);
    g.addColorStop(0, 'rgba(140,190,255,0)');
    g.addColorStop(0.55, 'rgba(210,235,255,' + (0.5 * env) + ')');
    g.addColorStop(1, 'rgba(255,255,255,' + (0.9 * env) + ')');
    c.fillStyle = g;
    c.shadowColor = '#cfe8ff'; c.shadowBlur = 10 * env;
    c.fill();
    c.shadowBlur = 0;
    // the leading tip flashes on the frames the hitbox is live
    if (q > 0.18 && q < 0.45) {
      const tipA = a1, R2 = (L - TH / 2) * grow;
      c.globalAlpha = (1 - Math.abs(q - 0.3) / 0.16) * 0.9;
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(Math.cos(tipA) * R2, L * 0.62 * grow + Math.sin(tipA) * R2, heavy ? 4.5 : 3.2, 0, 7);
      c.fill();
      c.globalAlpha = 1;
    }
  }
  c.restore();
}
// The blade in flight — a dark grip with two white crystal ends, spinning.
// Drawn in world space from the game's draw pass (after projectiles).
function drawBoomer(c) {
  const b = G.boomer;
  if (!b) return;
  c.save();
  c.translate(b.x, b.y);
  c.rotate(b.spin);
  // the grip is a solid thing and drawn as one
  c.fillStyle = '#2a3442';
  c.beginPath(); c.roundRect ? c.roundRect(-5, -2.6, 10, 5.2, 2.4) : c.rect(-5, -2.6, 10, 5.2); c.fill();
  c.globalCompositeOperation = 'lighter';
  for (const s of [1, -1]) {
    const g = c.createLinearGradient(0, 0, s * 24, 0);
    g.addColorStop(0, 'rgba(210,235,255,0.15)');
    g.addColorStop(0.55, 'rgba(240,250,255,0.95)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.shadowColor = '#cfe8ff'; c.shadowBlur = 8;
    c.beginPath();
    c.moveTo(s * 5, -3); c.lineTo(s * 20, -1.7); c.lineTo(s * 24, 0);
    c.lineTo(s * 20, 1.7); c.lineTo(s * 5, 3);
    c.closePath(); c.fill();
  }
  c.restore();
}
// Records where a paw was, and what it was swinging around, in the context it
// was drawn in. The matrix is captured rather than the world position, because
// by the time the cut is composited the body's transform — facing mirror, run
// lean, landing squash, evolution scale and the double jump's spiral — has been
// popped, and only the matrix knows what all of that did to these two points.
function rakeMark(pl, c, sx, sy, hx, hy, dir, far) {
  (pl._rake || (pl._rake = [])).push({
    m: pl._rakeM || c.getTransform(), sx: sx, sy: sy, x: hx, y: hy,
    dir: dir == null ? 1 : dir, far: !!far,
  });
}
// THE SAGE'S LAW OF HARM (docs/combat/SAGE.md). Fighting: normal damage
// down to a hard floor at 30% — the song holds the body together past it,
// and reaching the floor drops it into the SONG-LOCK. Locked: claws glance
// (sparks and the hint line — Ratchet said it in dialogue, the fight says
// it in play); crystal strikes fill PURITY, and full purity tames it.
// Tamed: strikes are pokes, the wolves' own mercy law.
function sageStruck(e, dm, x, y) {
  if (e.tame) {
    burst(x, y, 5, '#9ffcff', 150, 0.3, 0, 2, true);
    if (typeof sfx === 'function') sfx('pick');
    return 0;
  }
  const wield = typeof wielded === 'function' ? wielded() : 'claw';
  const floor = Math.round(e.hpMax0 * 0.3);
  if (e.locked) {
    if (wield === 'claw') {
      burst(x, y, 6, '#bfe9ff', 180, 0.22, 220, 2, true);
      sfx('no');
      if ((G._sgToldT || 0) <= 0) { G._sgToldT = 4; G.toast(t('sg_hint')); }
      return 0;
    }
    e.pureM += (wield === 'crystal2' ? 0.34 : 0.25);
    e.hurtT = 0.15;
    burst(x, y, 14, '#ffffff', 260, 0.5, 60, 3, true);
    sfx('bosshit');
    G.hitStop = Math.max(G.hitStop, 0.06);
    if (e.pureM >= 1) sageTame(e);
    return 0;
  }
  e.struck = true;
  if (e.hp - dm <= floor) {
    e.hp = floor; e.locked = true; e.hurtT = 0.2;
    e.coilT = e.gatherT = e.lungeT = e.windedT = 0; e.ringR = null;
    G.flash = Math.max(G.flash, 0.3);
    cam.shake = Math.max(cam.shake, 6);
    sfx('tell');
    if (!G.save.flags.sgLockSeen) { G.save.flags.sgLockSeen = 1; G.toast(t('sg_lock')); persist(); }
    return dm;
  }
  e.hp -= dm; e.hurtT = 0.2;
  return dm;
}
// EVERY SAGE IS SOMEBODY. Seven chambers, seven identities, and what each
// one gives is what its kingdom valued — a cell kept safe, a mending kit,
// teaching, weight of metal. The identity card carries the cave's story
// beat; the gift closure carries its economy. A chamber with no row falls
// back to the generic payout, so a new network is never silently giftless.
const SAGE_GIFT = {
  GA1D: () => invAdd('batt'),                                    // a cell, kept safe
  GA2D: () => { invAdd('kit'); G.save.scrap += 80; },            // what a pack values
  GB1D: () => { G.save.iq += 25; },                              // it teaches
  GC1D: () => { G.save.scrap += 200; },                          // weight of metal
  GD1D: () => { G.save.scrap += 150; G.save.iq += 10; },         // the Archives hoard
  GX1D: () => { G.save.scrap += 120; G.save.iq += 15; },         // tribute to the sword
  GE1D: () => invAdd('batt'),                                    // it knelt closest and held on
};
function sageTame(e) {
  e.tame = 1; e.locked = false; e.calm = true; e.pureM = 1;
  const key = 'sageTame_' + G.roomId;
  G.save.flags[key] = 1;
  // the duel track resolves: the chamber goes back to its zone's own quiet
  // (the zone key is what loadRoom itself plays for a non-boss room)
  if (e.duelMus && typeof setMusic === 'function' && G.roomDef) setMusic(G.roomDef.zone);
  sfx('win');
  G.flash = Math.max(G.flash, 0.5);
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  G.addRing(cx, cy);
  burst(cx, cy, 30, '#ffffff', 320, 0.9, 60, 3, true);
  burst(cx, cy, 18, '#57a8ff', 260, 1.1, 20, 2.6, true);
  // THE GIFT — the cave gives "instead of taking from the tamed sage"
  if (!G.save.flags['sageGift_' + G.roomId]) {
    G.save.flags['sageGift_' + G.roomId] = 1;
    (SAGE_GIFT[G.roomId] || (() => { G.save.scrap += 120; G.save.iq += 15; }))();
    const ik = 'sg_t_' + G.roomId;
    const nm = t(ik) === ik ? t('sg_tamed') : t(ik);
    const ds = t(ik + 'd') === ik + 'd' ? t('sg_tamedd') : t(ik + 'd');
    if (typeof showItem === 'function') showItem(nm, ds);
    if (typeof iqNudge === 'function') iqNudge();
  }
  // THE RULE, FOR SAGES TOO: "defeating a boss or a sage always reveals a
  // cave." Chamber sages are already inside theirs; a future SURFACE sage
  // needs only a GATE_ROOM row gated on 'sageTame_<its room>' and this
  // fires the reveal the moment it is purified.
  for (const rid in (typeof GATE_ROOM !== 'undefined' ? GATE_ROOM : {})) {
    if (GATE_ROOM[rid].need !== key) continue;
    G.toast(t('cave_open'));
    sfx('chargeReady');
    break;
  }
  persist();
}
// THE SAGE, DRAWN — a robed machine monk, hooded, kneeling half-inside the
// song. Engine-drawn first pass in the minion fallback style; authored
// plates queued (ART_QUEUE). The aura rule lives here too: while she holds
// crystal light an infected sage wears the BLACK HALO WITH THE EMBER RIM
// (the owner's spec — black cannot ride the additive pass, so it is its own
// dark ring), and a purified one shows blue from the light pass.
function drawSage(c, e) {
  const cx = e.x + e.w / 2, base = e.y + e.h;
  const t2 = e.anim;
  const kneel = e.locked || e.tame;
  const bob = kneel ? 0 : Math.sin(t2 * 2.2) * 1.6;
  // the aura sense: the black halo, under everything
  if (typeof auraSense === 'function' && auraSense() && !e.tame) {
    const fl = 0.75 + Math.sin(t2 * 7 + Math.sin(t2 * 13)) * 0.25;
    c.save();
    const dg = c.createRadialGradient(cx, base - e.h * 0.5, 4, cx, base - e.h * 0.5, 52);
    dg.addColorStop(0, 'rgba(0,0,0,0.5)'); dg.addColorStop(0.72, 'rgba(10,2,4,0.3)');
    dg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = dg; c.beginPath(); c.arc(cx, base - e.h * 0.5, 52, 0, 7); c.fill();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.3 * fl;
    c.strokeStyle = '#ff5a2a'; c.lineWidth = 2.5;
    c.shadowColor = '#ff5a2a'; c.shadowBlur = 8;
    c.beginPath(); c.arc(cx, base - e.h * 0.5, 40 + fl * 4, 0, 7); c.stroke();
    c.shadowBlur = 0;
    c.restore();
  }
  // THE AUTHORED SAGE (§2e): six plates indexed by the same state the whole
  // fight reads — amber on exactly the three telegraph states, ember gone and
  // crystal blue on pure. The procedural monk below stays as the fallback
  // while a plate is in flight, which is the house arrangement everywhere.
  const sagePlate = e.tame ? 'sagePure'
    : e.locked ? 'sageLock'
    : e.gatherT > 0 ? 'sageGather'
    : e.coilT > 0 ? 'sageCoil'
    : e.lungeT > 0 ? 'sageLunge' : 'sageStand';
  // per-state height: the silhouettes are genuinely different shapes, so each
  // maps its own opaque-box height to the body rather than one shared number
  const sageH = { sagePure: 0.72, sageLock: 0.66, sageLunge: 0.62 }[sagePlate] || 1.12;
  const sageFlip = !!(typeof player !== 'undefined' && player && player.x + player.w / 2 < cx);
  if (typeof drawPlateAnchored === 'function' &&
      drawPlateAnchored(c, sagePlate, cx, base + bob, e.h * sageH, sageFlip)) {
    // the plate carries the body; the ring, purity bar and halo still ride it
  } else {
  c.save();
  c.translate(cx, base + bob);
  const lean = kneel ? 0 : clamp(e.vx / 260, -1, 1) * 0.12;
  c.rotate(lean);
  const H2 = kneel ? e.h * 0.72 : e.h;
  const coil = e.coilT > 0 ? 1 - e.coilT / TELL_SWIPE : 0;
  const gath = e.gatherT > 0 ? 1 - e.gatherT / TELL_HEAVY : 0;
  // the robe — a tapered cowl, torn at the hem
  const rg = c.createLinearGradient(0, -H2, 0, 0);
  rg.addColorStop(0, e.tame ? '#54687e' : '#54404c');
  rg.addColorStop(1, e.tame ? '#242f3c' : '#241820');
  c.fillStyle = rg;
  c.beginPath();
  c.moveTo(-4, -H2);
  c.quadraticCurveTo(-13 - coil * 3, -H2 * 0.55, -11, 0);
  for (let k = -11; k < 11; k += 4) c.lineTo(k + 2, k % 8 === 1 ? -3 : 0);
  c.lineTo(11, 0);
  c.quadraticCurveTo(13 + coil * 3, -H2 * 0.55, 4, -H2);
  c.closePath(); c.fill();
  // the rim light — one lit edge, so the silhouette reads against dark rock
  // (black-on-black was invisible in the render-and-look pass)
  c.strokeStyle = e.tame ? '#8fb0cc' : '#8a6a7a';
  c.lineWidth = 1.4; c.globalAlpha = 0.85;
  c.beginPath();
  c.moveTo(-4, -H2);
  c.quadraticCurveTo(-13 - coil * 3, -H2 * 0.55, -11, 0);
  c.stroke();
  c.globalAlpha = 1;
  // the hood — deep, and nothing in it but the eyes
  c.fillStyle = e.tame ? '#2c3a4c' : '#241820';
  c.beginPath();
  c.ellipse(0, -H2 + 4, 9, 8, 0, Math.PI * 0.95, Math.PI * 2.05);
  c.quadraticCurveTo(7, -H2 + 12, 0, -H2 + 13);
  c.quadraticCurveTo(-7, -H2 + 12, -9, -H2 + 4);
  c.closePath(); c.fill();
  c.fillStyle = '#05070a';
  c.beginPath(); c.ellipse(0, -H2 + 8, 6, 5.5, 0, 0, 7); c.fill();
  // gathering: ember light pools in the sleeves
  if (gath > 0) {
    c.save(); c.globalCompositeOperation = 'lighter';
    c.globalAlpha = gath;
    for (const s of [-1, 1]) {
      c.fillStyle = '#ff8a4a'; c.shadowColor = '#ff5a2a'; c.shadowBlur = 10;
      c.beginPath(); c.arc(s * (12 + gath * 4), -H2 * 0.4, 3 + gath * 2.5, 0, 7); c.fill();
    }
    c.shadowBlur = 0; c.restore();
  }
  // the eyes — ember while the song holds it, blue once it lets go
  const hot = e.coilT > 0 || e.gatherT > 0 || e.lungeT > 0;
  const ec = e.tame ? '#6ac8ff' : hot ? '#ff7a3a' : '#c85a3a';
  c.fillStyle = ec; c.shadowColor = ec; c.shadowBlur = hot ? 9 : 5;
  const blink = e.locked ? 0.6 + Math.sin(t2 * 6) * 0.4 : 1;
  c.globalAlpha = blink;
  for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 2.6, -H2 + 8, 1.4, 0, 7); c.fill(); }
  c.globalAlpha = 1; c.shadowBlur = 0;
  c.restore();
  }
  // the ember ring HUGS THE GROUND — it hurts her feet, so it is drawn at
  // her feet: a squashed ellipse crawling outward, not a hoop in the air
  // (the first render read as a giant circle over the whole room)
  if (e.ringR != null) {
    c.save(); c.globalCompositeOperation = 'lighter';
    c.globalAlpha = clamp(1 - e.ringR / 250, 0.12, 0.55);
    c.strokeStyle = '#ff6a3a'; c.lineWidth = 3;
    c.shadowColor = '#ff5a2a'; c.shadowBlur = 6;
    c.beginPath(); c.ellipse(cx, base, e.ringR, 9, 0, Math.PI, Math.PI * 2); c.stroke();
    // sparks riding the wavefront
    for (const s of [-1, 1]) {
      c.fillStyle = '#ffb08a';
      c.beginPath(); c.arc(cx + s * e.ringR, base - 2, 2, 0, 7); c.fill();
    }
    c.shadowBlur = 0; c.restore();
  }
  // purity, shown: the lock chant dims as the crystal fills it
  if (e.locked && e.pureM > 0) {
    c.save(); c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.5 + e.pureM * 0.4;
    c.fillStyle = '#ffffff'; c.shadowColor = '#cfe8ff'; c.shadowBlur = 8;
    c.fillRect(cx - 14, base - e.h - 10, 28 * clamp(e.pureM, 0, 1), 3);
    c.restore();
  }
}
// THE ROBOT BAT, DRAWN. Hanging: folded wing panels around the body, head
// down, one red optic — one more dark shape in the ceiling until it shivers.
// Flying: angular metal wings flapping from the shoulder joint. All paths
// and gradients, in the minion fallback style; authored plates queued.
function drawBat(c, e) {
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  const hang = !!e.hang;
  const shiver = hang && e.holdT > 0 ? Math.sin(performance.now() / 24) * 1.6 : 0;
  const flap = Math.sin(e.anim * 18) * (e.diveT > 0 ? 0.9 : 0.6);
  // THE AUTHORED BAT (§2d): five plates on the same reads the fallback uses.
  // hang is the only one with its optic dark; shiver rattles amber out of the
  // seams; flap_up/flap_dn alternate on the stride counter; dive is the
  // swept-back arrowhead. Hanging plates are authored head-down, so they
  // anchor from the ceiling by their opaque top; fliers centre on the body.
  const batPlate = hang ? (e.holdT > 0 ? 'batShiver' : 'batHang')
    : e.diveT > 0 ? 'batDive'
    : (Math.sin(e.anim * 18) > 0 ? 'batFlapUp' : 'batFlapDn');
  const batH = e.h * (hang ? 1.3 : batPlate === 'batDive' ? 1.15 : 1.75);
  const batBase = hang ? e.y + batH : cy + batH / 2;
  if (typeof drawPlateAnchored === 'function' &&
      drawPlateAnchored(c, batPlate, cx + shiver, batBase, batH, !hang && e.vx < 0)) return;
  c.save();
  c.translate(cx + shiver, cy);
  if (hang) c.scale(1, -1);                    // head down, feet in the rock
  // body — a gunmetal teardrop
  const bg = c.createLinearGradient(0, -9, 0, 9);
  bg.addColorStop(0, '#3a4450'); bg.addColorStop(1, '#1c232c');
  c.fillStyle = bg;
  c.beginPath(); c.ellipse(0, 0, 6.5, 9, 0, 0, 7); c.fill();
  // wings — folded shells while hanging, angular panels in flight
  c.fillStyle = '#242e3a';
  c.strokeStyle = '#39434f'; c.lineWidth = 1;
  for (const s of [-1, 1]) {
    c.save();
    if (hang) {
      c.translate(s * 4.5, -1);
      c.rotate(s * 0.18 + shiver * 0.05 * s);
      c.beginPath();
      c.moveTo(0, -7); c.quadraticCurveTo(s * 7, -2, s * 5, 8);
      c.quadraticCurveTo(s * 2, 10, 0, 7); c.closePath();
      c.fill(); c.stroke();
    } else {
      c.translate(s * 5, -3);
      c.rotate(s * (0.5 + flap));
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(s * 13, -4); c.lineTo(s * 16, 2);
      c.lineTo(s * 9, 3); c.lineTo(s * 12, 8); c.lineTo(s * 3, 6);
      c.closePath(); c.fill(); c.stroke();
    }
    c.restore();
  }
  // claw feet gripping the rock (they read as the attachment)
  if (hang) {
    c.strokeStyle = '#4a5663'; c.lineWidth = 1.6;
    for (const s of [-1, 1]) {
      c.beginPath(); c.moveTo(s * 2, 8); c.lineTo(s * 3.4, 11.5); c.stroke();
    }
  }
  // the optic — dull while it sleeps, hot through the shiver and the dive
  const hot = e.holdT > 0 || e.diveT > 0;
  c.fillStyle = hot ? '#ff5f6d' : '#7a3540';
  if (hot) { c.shadowColor = '#ff5f6d'; c.shadowBlur = 8; }
  c.beginPath(); c.arc(0, hang ? 5.5 : -4.5, 2.1, 0, 7); c.fill();
  c.shadowBlur = 0;
  c.restore();
}
// EVERY GUARDIAN'S REAL BODY, AND THE SHEET IT ARRIVES IN. One table, checked
// per kind. If a kind is in here it has authored art and must never be drawn as
// anything else — not as the driller it was prototyped from, not as another
// guardian whose sheet happens to be in memory.
const BOSS_ART = {
  glitch: 'beastParts',      // NULLFANG      — the lion
  brood: 'eagleParts',       // TALONHOST     — the eagle
  zero: 'glaciereParts',     // GLACIERE      — the unicorn
  atlas: 'dragonParts',      // FURNACE CHOIR — the dragon
  prism: 'prismParts',       // PRISM PROWLER — the cat
  mother: 'motherParts',     // MOTHER-V      — the Null Core
};
// It is there; its body just has not come over the wire yet. A dark mass with a
// live rim and two eyes reads as "something enormous, in the dark, watching" —
// which is the right thing to be looking at for the half second this lasts, and
// is honest in a way that showing the wrong creature never was.
function drawBossHold(c, b) {
  const P = PAL[G.roomDef.zone];
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  const pu = 0.5 + Math.sin((b.anim || 0) * 3) * 0.5;
  c.save();
  c.fillStyle = 'rgba(7,10,16,0.94)';
  c.beginPath(); c.ellipse(cx, cy, b.w * 0.56, b.h * 0.56, 0, 0, 6.2832); c.fill();
  c.globalAlpha = 0.22 + pu * 0.28; c.strokeStyle = P.glow; c.lineWidth = 2.5; c.stroke();
  c.globalAlpha = 0.45 + pu * 0.55; c.fillStyle = P.glow;
  for (const s of [-1, 1]) {
    c.beginPath();
    c.ellipse(cx + s * b.w * 0.15, cy - b.h * 0.16, 3.6, 2.3, 0, 0, 6.2832);
    c.fill();
  }
  c.restore();
}
// ---------------------------------------------------------------------------
// HOW LONG A WARNING HAS TO BE. Not a feel value — a computed one:
//
//     tell = reaction time + time for the dodge to actually clear + buffer
//
// Simple visual reaction is ~250 ms for an adult and 280-350 ms at 8-10 years
// old; choosing between four possible attacks is slower still. The dash needs
// ~80 ms to carry her out of a swipe box, and rAF plus display latency eats
// ~50 ms before she ever sees the frame. That puts the floor at half a second
// for the player this game is built for. Hornet, in Hollow Knight, telegraphs
// between 0.5 and 0.66 s — these are the same numbers arrived at twice.
const TELL_SWIPE = 0.5, TELL_FAST = 0.35, TELL_HEAVY = 0.7;
// Every state whose whole job is to say "this is coming". The cue fires when
// the state is ENTERED, centrally, so a new attack cannot be written without
// one — which is exactly how the old swipe ended up with its sound on the hit
// instead of on the warning.
// THE STATE NAME IS THE CONTRACT. Any boss state whose name matches this fires
// the tell cue exactly once on entry, which is how the audio channel of every
// telegraph in the game gets handled without a boss author having to remember
// it. The corollary is the trap: a wind-up state named something that does NOT
// match is silently a ONE-CHANNEL telegraph, and nothing warns you.
//
// 'roar' is here because of exactly that. NULLFANG's roar opens with a 500 ms
// inhale — orb gathering in the throat, debris lifting off the floor — and then
// shoves the player across the room. The inhale is a real telegraph and it had
// no sound of its own: the only audio was `roar_beast`, which plays 500 ms
// LATER and is the hit, not the warning. On the game's FIRST boss, whose entire
// job is to prove the telegraph contract is real before any later fight can
// rely on the player trusting it.
// 'volley' and 'broodcall' joined it for the same reason 'roar' did, found the
// same way one zone later: TALONHOST spends 900 ms hauling itself to centre-top
// with its wings loading before a seven-feather fan leaves, and 500 ms with its
// head thrown back before the screech that calls the brood. Both are real
// telegraphs, both were visual-only, and neither is called anything a list of
// wind-up-sounding words would ever have contained.
//
// Which is the actual lesson: a lexical rule cannot find these. `tests/tells.cjs`
// no longer guesses from state names — it watches for states that set `windT`,
// because setting windT IS the engine declaring "I am winding up", and any state
// that declares that and earns no cue is a one-channel telegraph by construction.
const TELL_ST = /warn|charge|crouch|coil|lock|prep|spin|gather|roar|volley|broodcall|forgebell|hymn/i;
// ONE COLOUR THAT MEANS ONE THING. The Hue Law already says crimson is infected
// and cyan is clean — but those encode WHOSE side a thing is on, and nothing in
// the palette meant "this is about to hit you". A tell needs a channel of its
// own, used by nothing else, the way Cuphead's pink means parryable everywhere
// with no exceptions. This amber is that channel. It is also paired with motion
// and sound in every use, because roughly one man in twelve cannot rely on hue.
const TELL_COL = '#ffc24a';
const BURST_VOLTS = 25;
// GLACIERE'S REST BEAT, in one place because it was wrong in five.
//
// Measured over twenty-five seconds of a real fight: SIXTY-TWO PER CENT of her
// samples were `idle`. Every power ended with `this.st = 'idle'; this.t = 2.1`
// — a two-second pause after a half-second telegraph — so the fight she
// actually presents is a hovering unicorn waiting for a timer, punctuated. The
// tell is not the problem and never was; the silence after it is.
//
// A rest beat has a job: it is the window you attack into. It has to be long
// enough to be a window and short enough that you are still being fought.
// Roughly one second, tightening as she loses, with a little variance so the
// rhythm is not a metronome you can set your watch by.
function glcRest(b) { return bossRest(b, 0.85); }
// ...and it was wrong for all six, which is why this is now one function.
//
// Measured against a player who MOVES (tests/bosspace.cjs — the earlier figures
// came from a stationary target, which is not the fight), the roster spent
// between 57% and 73% of every encounter in `idle`. FURNACE CHOIR was the
// clearest case and the shape is identical in all of them: a half-second
// telegraph, an attack, and then THREE SECONDS of a guardian standing still.
// That is not a punish window. It is a queue.
//
// A rest beat has one job: be the window the player attacks INTO. Long enough
// to land the three-hit combo — about 0.7 s — and short enough that they are
// still being fought. `k` scales it for a power that has earned a longer
// breath: a room-clearing rite gets one, a jab does not.
function bossRest(b, k) {
  // 0.72 s is the floor, not a feel value: that is what her three-hit combo
  // takes to land, and a window shorter than the punish it exists for is a
  // tease. Phase two drops under it deliberately — by then she is expected to
  // take the first two hits and leave.
  const base = b.phase === 2 ? rnd(0.45, 0.62) : rnd(0.74, 0.98);
  return base * (k || 1);
}
class Boss {
  constructor(kind, x, y) {
    const s = BSTAT[kind];
    this.kind = kind; this.w = s.w; this.h = s.h;
    this.x = x - s.w / 2; this.y = y - s.h;
    this.hpMax = Math.round(s.hp * DF().ehp); this.hp = this.hpMax;
    this.vx = 0; this.vy = 0; this.st = 'dorm'; this.t = 1.4; this.phase = 1;
    this.hurtT = 0; this.dead = false; this.anim = 0; this.face = -1;
    this.cycle = 0; this.marks = []; this.beam = null;
    this.hypnoT = 0; this.stagT = 0;
    this.dazeAt = s.dazeAt || 0; this.dazeHits = 0; this.dazeWin = 0; this.dazeCD = 0;
    // faceVis trails face, so a machine visibly TURNS instead of teleporting its
    // nose to the other side. Passing through zero squashes the body, which reads
    // as it swinging round.
    this.faceVis = this.face;
    this.bores = []; this.hymn = null; this.prison = null;
    this.windT = 0; this.overdriveT = 0;
    if (kind === 'brood') { this.y = 60; this.homeY = 60; }
    if (kind === 'atlas') { this.nestX = this.x + s.w / 2; this.nestFootY = y; }
    if (kind === 'zero') this.y -= 90;
    if (kind === 'mother') { this.y = 110; this.x = G.roomDef.w * TILE / 2 - s.w / 2; }
    // recorded AFTER the per-kind placement, or the flyers get sent back to a
    // position they never actually occupied
    this.spawnX = this.x; this.spawnY = this.y;
  }
  cx() { return this.x + this.w / 2; }
  cy() { return this.y + this.h / 2; }
  shoot(vx, vy, r, grav, life) {
    G.projs.push(new Proj(this.cx(), this.cy(), vx, vy, false, 1, r || 7, PAL[G.roomDef.zone].glow, grav || 0, life || 4));
  }
  ring(n, speed, off) {
    for (let i = 0; i < n; i++) {
      const a = off + i / n * Math.PI * 2;
      this.shoot(Math.cos(a) * speed, Math.sin(a) * speed, 6);
    }
    sfx('shoot');
  }
  update(dt) {
    this.anim += dt; this.hurtT -= dt;
    // THE WEIGHT PASS (#93, the code half). Every guardian carries momentum
    // now, from one place, for every boss that exists or will ever exist:
    // a lean INTO acceleration, and a landing squash when a fall dies. The
    // matching draw-side transform lives at the top of Boss.draw; per-plate
    // walk cycles are the art half (ART_QUEUE boss-motion block).
    const wAx = dt > 1e-4 ? (this.vx - (this._pvx == null ? this.vx : this._pvx)) / dt : 0;
    const wantLean = clamp(this.vx / 460, -1, 1) * 0.055 + clamp(wAx / 4200, -0.6, 0.6) * 0.035;
    this._lean = (this._lean || 0) + (wantLean - (this._lean || 0)) * (1 - Math.pow(0.002, dt));
    if ((this._pvy || 0) > 150 && Math.abs(this.vy) < 24 && !this._squashT) this._squashT = 0.22;
    if (this._squashT > 0) this._squashT = Math.max(0, this._squashT - dt);
    this._pvx = this.vx; this._pvy = this.vy;
    // THE WARNING GETS THE SOUND. It used to arrive with the hit, which is
    // feedback, not a telegraph — and the ear is faster than the eye (an
    // auditory stimulus reaches the brain in 8-10 ms against 20-40 ms for a
    // visual one, ~140-160 ms of reaction against ~180-200 ms). Firing the cue
    // the frame a tell BEGINS is therefore worth about 40 ms of the player's
    // reaction budget for free, and it costs one line, here, for every boss
    // move that exists or will ever exist.
    if (this.st !== this._tellSt) {
      this._tellSt = this.st;
      if (TELL_ST.test(this.st || '')) sfx('tell');
    }
    if (this.roarBuzzT > 0) {
      // the roar VIBRATES: a held tremble on the camera and, through the
      // rumble motors, on the controller — re-armed in short pulses
      const pb = Math.floor(this.roarBuzzT * 5.5);
      this.roarBuzzT -= dt;
      cam.shake = Math.max(cam.shake, 2.6);
      if (Math.floor(this.roarBuzzT * 5.5) !== pb && typeof padRumble === 'function')
        padRumble(0.4, 0.55, 200);
    }
    if (this.shieldT > 0) this.shieldT -= dt;          // shorted plating recovers
    if (this.deathAnimT > 0) this.deathAnimT -= dt;   // the collapse plays out
    if (this.dead) {
      // THE DEATH SCENE: the wreck does not go quietly — secondary
      // detonations ripple across the body while it comes apart, each one
      // kicking the room and the pad, closing on one last whiteout
      if (this.deathFxT == null) { this.deathFxT = 2.1; this.deathFxNext = 0.12; }
      if (this.deathFxT > 0) {
        this.deathFxT -= dt; this.deathFxNext -= dt;
        if (this.deathFxNext <= 0 && this.deathFxT > 0.5) {
          this.deathFxNext = rnd(0.12, 0.28);
          const bx = this.cx() + rnd(-this.w * 0.7, this.w * 0.7);
          const by = this.y + rnd(0, this.h);
          burst(bx, by, 10, chance(0.5) ? '#ffffff' : PAL[G.roomDef.zone].glow, 230, 0.5, 150, 3, true);
          cam.shake = Math.max(cam.shake, 5); sfx('hit');
          if (typeof padRumble === 'function') padRumble(0.3, 0.42, 120);
        }
        if (this.deathFxT <= 0.5 && !this.deathFinale) {
          this.deathFinale = true;
          burst(this.cx(), this.cy(), 70, '#ffffff', 480, 1.2, 150, 5, true);
          burst(this.cx(), this.cy(), 30, PAL[G.roomDef.zone].glow, 320, 1.0, 80, 4, true);
          G.flash = Math.max(G.flash, 0.85); cam.shake = Math.max(cam.shake, 18);
          G.hitStop = Math.max(G.hitStop, 0.18);
          sfx('boom'); sfx('phase');
          if (typeof roarWave === 'function') roarWave(this.cx(), this.cy(), '#ffffff');
          if (typeof padRumble === 'function') padRumble(1, 0.8, 700);
          // Normally the blast is the VIRUS leaving, not the guardian dying —
          // that is the whole point of the purification arc. But forceKill means
          // the player was ASKED and chose to end it, and a choice the game
          // quietly reverses two seconds later is not a choice.
          if (this.kind !== 'mother' && !this.purified && !this.forceKill) {
            this.purified = true; this.pureT = 0;
            G.toast(t({ glitch: 'pure_beast', brood: 'pure_brood', atlas: 'pure_atlas',
                        zero: 'pure_zero', prism: 'pure_prism' }[this.kind]));
          }
          if (this.rewardPend) { this.rewardPend = false; G.onBossDead(this.kind); }
        }
      }
      if (this.purified) {
        // THE PETS: a freed guardian keeps its nature. The lion and the
        // dragon pad to her side; GLACIERE glides at her shoulder; the
        // eagle perches watching over her; the Prowler is just a cat
        // again. All of them purr hearts when she is close.
        this.pureT = (this.pureT || 0) + dt;
        this.faceVis = (this.faceVis || this.face)
          + clamp(this.face - (this.faceVis || this.face), -dt * 5, dt * 5);
        const px2 = player.x + player.w / 2, pd = px2 - this.cx();
        const settled = this.pureT > 1.1 && !player.dead;
        if (settled) this.face = Math.sign(pd) || this.face;
        if (settled && Math.abs(pd) < (this.kind === 'zero' ? 180 : 110) && chance(0.05))
          addPart(this.cx() + rnd(-14, 14), this.y - 6, rnd(-6, 6), rnd(-42, -22),
            rnd(0.7, 1.1), chance(0.5) ? '#ff8fb3' : '#ffc2d4', 2.6, -14, true);
        const floorY2 = 15 * TILE - this.h;
        if (this.kind === 'glitch' || this.kind === 'atlas') {
          if (this.y < floorY2) this.y = Math.min(floorY2, this.y + 320 * dt);
          let mv = 0;
          if (settled && Math.abs(pd) > 96) { mv = clamp(pd, -70, 70); this.x += mv * dt; }
          this.petWalk = mv !== 0;
          this.vx = this.kind === 'atlas' ? mv : 0;   // drives the dragon's step rig
          if (this.kind === 'atlas') { this.st = 'idle'; this.t = 5; this.vy = 0; }
        } else if (this.kind === 'zero') {
          this.st = 'idle';
          if (settled) {
            // at her shoulder: a half-length behind, riding the air
            const tx2 = px2 - (Math.sign(pd) || 1) * 120 - this.w / 2;
            const ty2 = floorY2 - 130;
            this.x += (tx2 - this.x) * Math.min(1, dt * 1.6);
            this.y += (ty2 - this.y) * Math.min(1, dt * 1.1);
          }
        } else if (this.kind === 'brood') {
          this.st = 'restlow'; this.t = 5;
          this.y = floorY2 + 4; this.vy = 0; this.cabV = this.cabV || 0;
        } else if (this.kind === 'prism') {
          this.st = 'dorm';
          if (this.y < floorY2) this.y = Math.min(floorY2, this.y + 320 * dt);
        }
        this.x = clamp(this.x, 8, G.roomDef.w * TILE - this.w - 8);
      }
      // the X1 bridge lets go once the wreck has settled
      if (G.roomId === 'X1' && (this.deathAnimT || 0) <= 0 && !this.bridgeGone) {
        this.bridgeGone = true;
        for (let i = 0; i < 12; i++)
          addPart(6 * TILE + rnd(0, 3 * TILE), 15 * TILE + rnd(-4, 4),
            rnd(-60, 60), rnd(-40, 120), 0.6, '#37ffd0', 2.5, 500, true);
        sfx('glass'); cam.shake = Math.max(cam.shake, 4);
      }
      return;
    }
    // ---- THE FORK ---------------------------------------------------------
    // Every guardian asks, and it asks on the killing blow. The strike that
    // would end it instead puts it on its knees, and the fight stops on the
    // only question the game is built on: do you finish this, or do you free
    // it? Nothing smaller than a guardian is ever allowed to ask — a question
    // repeated over every crawler is what made this one cheap.
    //
    // For NULLFANG it is also, by the Braid's own arithmetic, the single most
    // consequential press in a run: as the FIRST entry on the ledger it carries
    // roughly nine times the weight of the choice you will make an hour later.
    //
    // THIS RUNS BEFORE THE STATE MACHINE, and that placement is the whole point.
    // It used to sit below every state handler, so any state that returned early
    // swallowed the question entirely: PRISM PROWLER killed mid-dash never asked
    // and never died — it sat at zero health, still fighting. A guardian's death
    // cannot be contingent on which move it happened to be in when it died.
    // (The blow itself is caught in die(); this is the backstop for anything
    // that drains a guardian to zero without ever calling it.)
    if (this.hp <= 0 && bossFork(this)) return;
    // A guardian at zero does not fall on its own any more. It is either kneeling
    // with the question still open, or waiting for the blow the game is about to
    // swing on the player's behalf — and dying early would eat both moments.
    if (this.hp <= 0 && (G.forkBoss === this || (G.finish && G.finish.b === this))) return;
    if (this.hp <= 0) { this.die(); return; }
    // TWO STATES ARE THEIR OWN STAGGER. nullend (NULLFANG landing after Null
    // Gravity) and cffloor (TALONHOST grounded with its chest cracked open)
    // re-apply stagT every frame so the boss stays open to attack for the whole
    // window. Returning early on that starved the very timer the handler was
    // counting down: it only ticked on the one frame in eighteen where the
    // stagger had just expired. NULLFANG's 1.15s recovery took 22 seconds and
    // TALONHOST's 1.7s repair took 42 — the boss visibly stopped and stayed
    // stopped, which is exactly how it looked from the outside.
    if (this.stagT > 0) {
      this.stagT -= dt;
      if (!BOSS_SELF_STAG[this.st]) return;             // Song / weakness stagger
    }
    if (this.st === 'dorm') {
      // THE EYE'S CONSTRUCTS DO NOT GET A GUARDIAN'S AWAKENING. The shared
      // handler below rises, ROARS, shakes the room and starts a named boss
      // theme — which is the right ceremony for one of the six and completely
      // wrong for a side fight you went looking for. Worse, it left `intro` in
      // their state list: an attack-shaped state with no wind-up, which is
      // exactly what tests/minis.cjs flagged.
      if (isMini(this)) {
        if (!player.dead && Math.abs(player.x + player.w / 2 - this.cx()) < 340) {
          this.st = 'idle'; this.t = 0.45;
          sfx('cast'); cam.shake = Math.max(cam.shake, 3);
          setMusic('boss_mini');
          G.toast(t('mini_' + this.kind));
        }
        return;
      }
      // THE ALPHA GETS A GUARDIAN'S CEREMONY, because it earns one: it is the
      // first thing in the run with a name, a theme of its own and a fight you
      // can lose. What it does not get is a guardian's REWARD chain — see
      // onBossDead — and it does not get the fork, because taming is the only
      // ending it has.
      if (this.kind === 'alpha') {
        if (!player.dead && Math.abs(player.x + player.w / 2 - this.cx()) < 380) {
          this.st = 'intro'; this.t = 2.0; this.roared = false;
          sfx('ui'); cam.shake = Math.max(cam.shake, 3);
          setMusic('boss_alpha');
          G.toast(t('alpha_meet'));
        }
        return;
      }
      if (!player.dead && Math.abs(player.x + player.w / 2 - this.cx()) < 380) {
        // THE STIR: it hears her. The wake itself is quiet — servos, a
        // breath — the ROAR belongs to the moment it reaches full height.
        this.st = 'intro'; this.t = 2.0; this.roared = false;
        sfx('ui'); cam.shake = Math.max(cam.shake, 3);
        // each guardian gets its own theme when one has been scored, and the
        // shared boss score until then
        setMusic('boss_' + this.kind);
      }
      return;
    }
    if (this.st === 'intro') {
      this.t -= dt;
      if (!this.roared && this.t <= 0.85) {
        // THE ROAR — each guardian announces itself in its own voice, and
        // the room answers: shake, rumble, a burst off the body
        this.roared = true;
        sfx({ glitch: 'roar_beast', brood: 'roar_eagle', zero: 'roar_glc',
              atlas: 'roar_drg', prism: 'roar_prism', alpha: 'roar_beast' }[this.kind] || 'roar');
        cam.shake = Math.max(cam.shake, 11);
        this.roarBuzzT = 0.8;
        if (typeof padRumble === 'function') padRumble(0.9, 0.7, 650);
        if (typeof roarWave === 'function')
          roarWave(this.cx(), this.cy() - this.h * 0.35,
            { glitch: '#b48cff', brood: '#ff5f6d', zero: '#a5d8ff',
              atlas: '#ffd76a', prism: '#37ffd0', alpha: '#ffc24a' }[this.kind] || '#e05aff');
        burst(this.cx(), this.cy() - this.h * 0.3, 16, '#ffffff', 260, 0.5, 160, 3, true);
      }
      if (this.kind === 'atlas' && this.nestFootY != null && this.t <= 0.6 && !this.nestLanded) {
        // DOWN FROM THE ROOST: he leaves the nest on the wing and glides to
        // the arena floor, landing with the whole room's weight
        const floorFoot = 15 * TILE;
        const k2 = clamp((0.6 - this.t) / 0.5, 0, 1);
        const e2 = k2 * k2 * (3 - 2 * k2);
        this.y = this.nestFootY + (floorFoot - this.nestFootY) * e2 - this.h;
        this.x += (G.roomDef.w * TILE * 0.5 - this.w / 2 - this.x) * Math.min(1, dt * 3);
        this.vy = 320;
        this.face = this.faceVis = player.x + player.w / 2 < this.cx() ? -1 : 1;
        if (k2 >= 1) {
          this.nestLanded = true; this.vy = 0;
          cam.shake = Math.max(cam.shake, 9); sfx('boom');
          if (typeof padRumble === 'function') padRumble(0.7, 0.5, 300);
          burst(this.cx(), this.y + this.h, 18, '#c8925c', 220, 0.5, 400, 3);
        }
      }
      if (this.t <= 0) { this.st = 'idle'; this.t = 0.8; this.vy = 0; }
      return;
    }
    // ---- THE FORK ---------------------------------------------------------
    // Every guardian asks, and it asks on the killing blow. The strike that
    // would end it instead puts it on its knees, and the fight stops on the
    // only question the game is built on: do you finish this, or do you free
    // it? Nothing smaller than a guardian is ever allowed to ask — a question
    // repeated over every crawler is what made this one cheap.
    //
    // For NULLFANG it is also, by the Braid's own arithmetic, the single most
    // consequential press in a run: as the FIRST entry on the ledger it carries
    // roughly nine times the weight of the choice you will make an hour later.
    if (this.phase === 1 && this.hp < this.hpMax / 2) {
      // THE MIDPOINT — the beat every one of these fights was missing. A boss
      // is a dramatic structure, and the published shape puts a turning point
      // at the middle: a moment of relief immediately before the hardest part.
      // Going straight from phase one to phase two made escalation read as the
      // fight getting grindier. This costs a second and a half, hands the
      // player a guaranteed free punish exactly where frustration peaks, and
      // makes the change of gear something you SEE rather than something you
      // slowly infer from being hit more.
      this.phase = 2; this.stagT = Math.max(this.stagT || 0, 1.5); this.t = 1.2; this.vx = 0; this.vy = 0;
      burst(this.cx(), this.cy(), 30, '#ffffff', 320, 0.7, 200, 4, true);
      burst(this.cx(), this.cy(), 22, TELL_COL, 240, 0.9, 60, 3, true);
      cam.shake = 12; sfx('phase'); G.flash = Math.max(G.flash, 0.35);
      G.hitStop = Math.max(G.hitStop, 0.12);
      if (typeof padRumble === 'function') padRumble(0.8, 0.9, 380);
    }
    const px = player.x + player.w / 2, py = player.y + player.h / 2;
    // each boss up the chain is natively faster and more relentless
    const spd = DF().espd * (BOSS_AGGRO[this.kind] || 1);
    this.windT -= dt; this.overdriveT -= dt;
    // every boss looks where it is going, even the ones that do not walk
    if (this.kind === 'zero' || this.kind === 'brood' || this.kind === 'prism' || this.kind === 'mother')
      this.face = Math.sign(px - this.cx()) || this.face || 1;
    const turn = dt * 5.5;
    const pvSign = Math.sign(this.faceVis) || 1;
    this.faceVis += clamp((this.face || 1) - this.faceVis, -turn, turn);
    // the pivot kicks up dust the instant the body whips through centre, so a
    // turning machine reads as planting and spinning, never as a flat sliver
    if ((this.kind === 'glitch' || this.kind === 'zero' || this.kind === 'atlas') && (Math.sign(this.faceVis) || 1) !== pvSign) {
      // THE TURN LAW's dust: the crossing frame is masked by a kicked cloud
      const dustCol = this.kind === 'zero' ? '#cfe8f4' : this.kind === 'atlas' ? '#c8925c' : '#b9a888';
      for (let i = 0; i < 8; i++)
        addPart(this.cx() + rnd(-this.w * 0.4, this.w * 0.4), this.y + this.h - rnd(0, 8),
          rnd(-120, 120), rnd(-140, -30), 0.35, dustCol, 3, 260, true);
      sfx('step');
    }
    this.tickAbilities(dt, px, py);
    switch (this.kind) {
      // ---- GLITCH.EXE: charging corrupted hound ----
      case 'glitch': {
        // ---- NULLFANG moves like a LION, traced from the sheet's four
        // poses: it STALKS low (walk figure), SWIPES a paw at arm's reach,
        // flattens into a CROUCH (attack figure) before the POUNCE, and
        // ROARS (roar figure) to shove you back and call the pack. The old
        // boss's drill is gone — nothing here is inherited. ----
        this.vy += 2100 * dt;
        this.swipeCD = this.swipeCD == null ? 0 : this.swipeCD - dt;
        const dist = px - this.cx(), adist = Math.abs(dist);
        // ---- THE BREAK ----------------------------------------------------
        // dealDmg counts hits landed close together and raises `dazeReq`. It
        // is taken HERE and only here, and only out of a state the boss is not
        // committed to: interrupting a launched pounce mid-air would leave the
        // animal falling in a pose that has no landing, and interrupting the
        // roar would eat the orb it has already spawned. Everything the player
        // can stand next to and hit — the stalk, the idle, the wind-ups — is
        // fair game, which is all of the fight that matters for this.
        if (this.dazeReq) {
          this.dazeReq = false;
          const committed = this.st === 'pounce' || this.st === 'spring' || this.st === 'dive'
            || this.st === 'nullcharge' || this.st === 'nullhop' || this.st === 'nullend'
            || this.st === 'intro' || this.st === 'dorm' || this.st === 'daze';
          if (!committed) {
            this.st = 'daze';
            // phase two shrugs it off faster — the same read, a smaller prize
            this.dazeDur = this.phase === 2 ? 1.25 : 1.7;
            this.t = this.dazeDur;
            this.vx = 0; this.swiped = false; this.swiped2 = false;
            // the break is an EVENT and gets announced on every channel the
            // rest of the fight uses, or the player will not notice they have
            // earned anything and will keep playing the safe way
            sfx('phase'); sfx('bosshit');
            cam.shake = Math.max(cam.shake, 8);
            G.hitStop = Math.max(G.hitStop, 0.11);
            burst(this.cx(), this.y + 50, 26, '#d68cff', 340, 0.7, 260, 4, true);
            if (typeof roarWave === 'function') roarWave(this.cx(), this.y + 60, '#d68cff');
            if (typeof padRumble === 'function') padRumble(0.75, 0.6, 220);
            G.toast(t('daze_open'));
          }
        }
        if ((this.dazeWin || 0) > 0) this.dazeWin -= dt;
        if ((this.dazeCD || 0) > 0) this.dazeCD -= dt;
        if (this.st === 'daze') {
          this.vx = 0; this.t -= dt;
          if (this.t <= 0) {
            // it comes back UP, not straight back to work: `recover` is the
            // existing landing settle and it already reads as "getting its feet
            // under it", which is exactly the beat this wants.
            this.st = 'recover'; this.t = 0.42;
            // and it cannot be broken again immediately, or a fast player
            // stunlocks the guardian and the fight stops being a fight
            this.dazeCD = this.phase === 2 ? 7 : 5.5;
            this.dazeHits = 0; this.dazeWin = 0;
            this.swipeCD = Math.max(this.swipeCD, 0.5);
          }
          break;
        }
        if (this.st === 'idle') {
          this.vx = 0; this.t -= dt;
          this.face = Math.sign(dist) || 1;
          if (this.t <= 0) { this.st = 'stalk'; this.t = rnd(1.4, 2.4); this.roarCD = this.roarCD || rnd(4, 5.5); if (this.ambushCD == null) this.ambushCD = rnd(5, 8); }
        } else if (this.st === 'stalk') {
          // low prowl toward you, patient, gathering pounce distance
          this.face = Math.sign(dist) || 1;
          this.vx = this.face * (this.phase === 2 ? 210 : 165) * spd;
          this.t -= dt; this.roarCD -= dt; this.ambushCD -= dt;
          if (!this.nullUsed && this.hp <= this.hpMax * 0.5) {
            // NULL GRAVITY: once per fight, below half health, the virus
            // overrides the room's gravity — the charge-up is the tell
            this.nullUsed = true;
            this.st = 'nullcharge'; this.t = 1.1; this.vx = 0; sfx('cast');
          } else if (this.ambushCD <= 0) {
            // scan the room for perches ('=' platform runs)
            const per = [];
            for (let ty2 = 3; ty2 < G.roomDef.h - 2; ty2++) {
              let run = 0;
              for (let tx2 = 1; tx2 < G.roomDef.w; tx2++) {
                const ch2 = G.grid && G.grid[ty2] && G.grid[ty2][tx2];
                if (ch2 === '=') run++;
                else { if (run >= 3) per.push([(tx2 - run / 2) * TILE, ty2 * TILE]); run = 0; }
              }
              if (run >= 3) per.push([(G.roomDef.w - run / 2) * TILE, ty2 * TILE]);
            }
            if (per.length) {
              per.sort((a2, b2) => Math.abs(a2[0] - this.cx()) - Math.abs(b2[0] - this.cx()));
              this.perch = per[0];
              this.st = 'springwarn'; this.t = 0.42; this.vx = 0;
            }
            this.ambushCD = rnd(this.phase === 2 ? 6 : 9, this.phase === 2 ? 9 : 12);
          } else if (adist < 130 && this.swipeCD <= 0) {
            // the same trap FURNACE's slam was in: gated on range alone, so a
            // player who stays in melee sees one telegraph and nothing else
            this.st = 'swipewarn'; this.t = TELL_SWIPE; this.vx = 0;
            this.swipeCD = rnd(1.5, 2.4);
          }
          else if (this.roarCD <= 0) { this.st = 'roar'; this.t = 1.25; this.vx = 0; this.roared = false; this.roarCD = rnd(5.5, 7); }
          else if (this.t <= 0 && adist > 170 && adist < 470) {
            // THE COIL IS THE FIGHT'S BIGGEST SENTENCE, so it gets a second.
            //
            // I shortened this to a third of a second first, on the theory that
            // better animation buys a shorter tell. Wrong instinct: this is the
            // one move in the encounter that can cross the whole arena, and the
            // player's answer to it is not a twitch, it is a decision about
            // where to be. A decision needs time to make, and a moment that
            // matters should LOOK like it matters.
            //
            // So it is a full second of a lion gathering itself — the hips
            // loading, the veins running from virus purple to warning amber,
            // sparks pulled INTO the haunches rather than thrown off them, arcs
            // crawling up from the paws, and the claws coming out. See
            // beastCoilFx. The difficulty is paid for on the other side: the
            // leap leads her now, and in phase two it lands and goes again.
            this.st = 'crouch'; this.t = this.phase === 2 ? 0.9 : 1.0;
            this.vx = 0; this.coilTick = 0; this.coilFlashed = false;
          }
          else if (this.t <= 0) this.t = rnd(1.1, 1.9);
        } else if (this.st === 'swipewarn') {
          // the paw rises — that is your tell
          this.vx = 0; this.t -= dt; this.windT = 0.3;
          if (this.t <= 0) { this.st = 'swipe'; this.t = 0.24; this.swiped = false; }
        } else if (this.st === 'swipe') {
          this.vx = 0; this.t -= dt;
          if (!this.swiped && this.t <= 0.18) {
            this.swiped = true;
            const f = this.face || 1;
            const box = { x: this.cx() + (f > 0 ? 6 : -114), y: this.y - 24, w: 108, h: this.h + 28 };
            burst(this.cx() + f * 66, this.cy(), 10, '#b06aff', 260, 0.35, 150, 3, true);
            sfx('atk');
            if (!player.dead && player.iT <= 0 && aabb(box, player)) player.hurt(DF().edmg, this.cx(), this.kind + '.' + this.st);
          }
          if (this.t <= 0) {
            // a lion swipes twice when it is angry
            // A LION SWIPES TWICE WHEN IT IS ANGRY — but it used to do so on a
            // coin flip, with a 0.22 s tell. Two separate faults in one line:
            // 0.22 s is below the reaction time of an ADULT (~0.25 s simple
            // visual, slower again for a choice between four attacks), let
            // alone the 8-10 year old this game is for; and firing it half the
            // time means the same read produces different outcomes, which is
            // what "unlearnable" means. It is now always twice in phase two,
            // with a full tell. The pressure comes back as a shorter gap
            // afterwards, which is the lever that does not cost readability.
            if (this.phase === 2 && !this.swiped2) { this.swiped2 = true; this.st = 'swipewarn'; this.t = TELL_SWIPE; }
            else { this.swiped2 = false; this.st = 'idle'; this.t = this.phase === 2 ? rnd(0.35, 0.6) : rnd(0.5, 0.9); }
          }
        } else if (this.st === 'crouch') {
          // flat to the ground, trembling with intent — then the pounce
          this.vx = 0; this.t -= dt; this.windT = 0.4;
          {
            // THE CHARGE, HEARD AND FELT. A tell carried on one channel is a
            // tell half the room misses: the ladder climbs in pitch as the
            // spring winds, the pad shakes harder, and the last quarter second
            // trembles the camera so it lands even with the sound off.
            const dur = this.phase === 2 ? 0.9 : 1.0;
            const k = 1 - Math.max(0, Math.min(1, this.t / dur));
            this.coilK = k;
            this.coilTick = (this.coilTick || 0) - dt;
            if (this.coilTick <= 0) {
              this.coilTick = 0.16 - k * 0.09;
              sfxChargeTick(0.15 + k * 0.85);
              if (typeof padRumble === 'function') padRumble(0.12 + k * 0.5, 0.1 + k * 0.35, 90);
            }
            if (k > 0.74) cam.shake = Math.max(cam.shake, 1.5 + (k - 0.74) * 14);
            // ...and the flash is an EVENT, so it gets one sound and one jolt
            // rather than being part of the ramp. This is the beat that means
            // "move now", and it lands with a fifth of a second still to go.
            if (k > 0.80 && !this.coilFlashed) {
              this.coilFlashed = true;
              sfx('chargeReady'); cam.shake = Math.max(cam.shake, 6);
              G.flash = Math.max(G.flash || 0, 0.10);
              if (typeof padRumble === 'function') padRumble(0.8, 0.55, 140);
            }
          }
          if (this.t <= 0) {
            this.st = 'pounce';
            this.face = Math.sign(dist) || 1;
            // AND IT LEADS HER. Aiming at where she is standing makes one
            // sidestep the whole answer — you can beat it without moving your
            // feet until the launch. Aiming at where she is GOING means the
            // dodge has to be a real change of direction, which is the fight
            // this move was always supposed to be.
            const lead = dist + (player.vx || 0) * (this.phase === 2 ? 0.26 : 0.18);
            this.vx = clamp(lead * 1.6, -680, 680) * (this.phase === 2 ? 1.15 : 1) * spd;
            this.vy = -(420 + Math.min(260, adist * 0.5));
            sfx('dash'); sfx('boom');
            cam.shake = Math.max(cam.shake, 9);
            G.flash = Math.max(G.flash || 0, 0.16);
            this.coilK = 0;
            // the stored charge LEAVES: a ring of it blows off the hind paws
            for (let i = 0; i < 14; i++) {
              const a = rnd(2.2, 4.1);
              addPart(this.cx() - this.face * 18, this.y + this.h - 8,
                Math.cos(a) * rnd(120, 300), Math.sin(a) * rnd(60, 220),
                rnd(0.25, 0.45), i % 3 ? TELL_COL : '#fff6df', rnd(2.5, 4), 120, true);
            }
            if (typeof roarWave === 'function')
              roarWave(this.cx(), this.y + this.h - 10, TELL_COL);
            // launch kickback: the hind paws throw dirt out behind the leap
            for (let i = 0; i < 7; i++)
              addPart(this.cx() - this.face * rnd(10, 40), this.y + this.h - rnd(0, 6),
                -this.face * rnd(80, 220), rnd(-140, -30), rnd(0.3, 0.5), '#b9a888', rnd(2.5, 4), 240, true);
          }
        } else if (this.st === 'pounce') {
          // airborne, claws first, virus streaming off the coat
          if (chance(0.5)) addPart(this.cx() - this.face * 30, this.cy() + rnd(-14, 14),
            -this.face * rnd(60, 140), rnd(-40, 40), 0.3, '#b06aff', 2.5, 0, true);
        } else if (this.st === 'roar') {
          this.vx = 0; this.t -= dt;
          if (!this.roared) {
            // the inhale: a virus orb gathers in the throat and loose ground
            // debris drifts upward — both scream "get clear NOW"
            if (chance(0.7)) addPart(this.cx() + rnd(-90, 90), this.y + this.h - 4,
              rnd(-15, 15), rnd(-80, -30), 0.5, '#8a8a96', 2, -60);
            if (chance(0.8)) {
              const oa = rnd(0, 6.28), or2 = rnd(26, 48);
              addPart(this.cx() + this.face * 30 + Math.cos(oa) * or2, this.cy() - 6 + Math.sin(oa) * or2,
                -Math.cos(oa) * 95, -Math.sin(oa) * 95, 0.3, '#b06aff', 2.5, 0, true);
            }
          }
          if (!this.roared && this.t <= 0.75) {
            this.roared = true;
            cam.shake = 11; sfx('roar_beast'); G.flash = Math.max(G.flash, 0.18);
            this.roarBuzzT = 0.6;
            if (typeof padRumble === 'function') padRumble(0.85, 0.65, 500);
            if (typeof roarWave === 'function') roarWave(this.cx() + this.face * 30, this.cy() - 10, '#b48cff');
            if (typeof G.addRing === 'function') G.addRing(this.cx(), this.cy() - 20);
            // the roar itself shoves you off your feet
            if (adist < 250 && !player.dead) {
              player.vx = (Math.sign(dist) || 1) * 520;
              player.vy = Math.min(player.vy, -170);
            }
            // and the pack answers
            if (G.enemies.filter(e => !e.dead && (e.kind === 'crawler' || e.kind === 'hopper')).length < (this.phase === 2 ? 2 : 1)) {
              const wx = clamp(this.cx() - this.face * 150, 60, G.roomDef.w * TILE - 60);
              const wl = new Enemy('crawler', wx, this.y + this.h - 26);
              G.enemies.push(wl);
              burst(wx, this.y + this.h - 10, 12, '#b06aff', 220, 0.5, 260, 3, true);
            }
          }
          if (this.t <= 0) { this.st = 'stalk'; this.t = rnd(1.6, 2.6); }
        } else if (this.st === 'springwarn') {
          // crouched, eyes up at the perch — dust already rising off its back
          this.vx = 0; this.vy = 0; this.t -= dt; this.windT = 0.3;
          if (chance(0.4)) addPart(this.cx() + rnd(-20, 20), this.y + rnd(0, 10), rnd(-30, 30), rnd(-120, -60), 0.3, '#b9a888', 2, 0, true);
          if (this.t <= 0) {
            this.st = 'spring'; this.u = 0;
            this.sx = this.x; this.sy = this.y;
            this.tx = clamp(this.perch[0] - this.w / 2, 40, G.roomDef.w * TILE - this.w - 40);
            this.ty = this.perch[1] - this.h;
            this.face = Math.sign(this.tx - this.x) || 1;
            sfx('dash');
          }
        } else if (this.st === 'spring') {
          // one clean leap onto the platform
          this.u += dt / 0.55;
          const u2 = Math.min(1, this.u);
          this.x = lerp(this.sx, this.tx, u2);
          this.y = lerp(this.sy, this.ty, u2) - Math.sin(u2 * Math.PI) * 120;
          this.vx = (this.tx - this.sx) / 0.55; this.vy = 0;
          if (u2 >= 1) {
            this.x = this.tx; this.y = this.ty; this.vx = 0;
            this.st = 'perch'; this.t = this.phase === 2 ? 1.0 : 1.4; this.perchTold = false;
            cam.shake = 5; sfx('land');
            // grit puffs off the ledge where the paws bite down
            for (let i = 0; i < 6; i++)
              addPart(this.cx() + rnd(-34, 34), this.y + this.h - 2,
                rnd(-90, 90), rnd(-70, -12), rnd(0.25, 0.4), '#b9a888', rnd(2, 3), 140, true);
          }
        } else if (this.st === 'perch') {
          // up on the ledge, tracking you; it flattens and the eye flares
          // in the last half second — that is the dive coming
          this.vx = 0; this.vy = 0; this.t -= dt;
          this.face = Math.sign(dist) || 1;
          // The dive's telegraph is the LAST 450 ms of the perch, not the whole
          // of it — it sits up there tracking you for a second first, and a cue
          // on entry would be a warning that arrives before there is anything
          // to warn about. So the state name deliberately stays outside TELL_ST
          // and the cue is fired by hand, at the moment the body flattens.
          if (this.t <= 0.45) {
            this.windT = 0.3;
            if (!this.perchTold) { this.perchTold = true; sfx('tell'); }
          }
          if (this.t <= 0) {
            this.st = 'dive'; this.u = 0;
            this.sx = this.x; this.sy = this.y;
            this.tx = clamp(px - this.w / 2, 20, G.roomDef.w * TILE - this.w - 20);
            this.ty = player.y + player.h - this.h;
            this.face = Math.sign(this.tx - this.x) || 1;
            sfx('dash');
          }
        } else if (this.st === 'dive') {
          // claws-first drop onto the prey
          this.u += dt / 0.42;
          const u2 = Math.min(1, this.u);
          this.x = lerp(this.sx, this.tx, u2);
          this.y = lerp(this.sy, this.ty, u2 * u2);   // accelerating fall
          this.vx = (this.tx - this.sx) / 0.42; this.vy = 600;
          if (chance(0.6)) addPart(this.cx() - this.face * 26, this.cy() + rnd(-16, 16), -this.face * rnd(60, 130), rnd(-60, 30), 0.3, '#b06aff', 2.5, 0, true);
          if (u2 >= 1) {
            this.st = 'recover'; this.t = this.phase === 2 ? 0.34 : 0.45;
            cam.shake = 10; sfx('boom');
            for (let i = 0; i < 12; i++)
              addPart(this.cx() + rnd(-this.w * 0.6, this.w * 0.6), this.y + this.h - 4,
                rnd(-180, 180), rnd(-200, -50), 0.45, '#b9a888', 3, 300, true);
            // the heavy landing language: low dust rolls outward along the
            // ground, slow pale plumes hang, and a few dark chips fly
            for (let i = 0; i < 8; i++) {
              const dr = i % 2 ? 1 : -1;
              addPart(this.cx() + dr * rnd(12, this.w * 0.8), this.y + this.h - 3,
                dr * rnd(130, 300), rnd(-36, -6), rnd(0.5, 0.85), '#cdbd9c', rnd(3.5, 5.5), 70);
            }
            for (let i = 0; i < 4; i++)
              addPart(this.cx() + rnd(-30, 30), this.y + this.h - rnd(4, 14),
                rnd(-40, 40), rnd(-90, -40), rnd(0.6, 0.9), '#8f846f', rnd(4, 6), 30);
            for (let i = 0; i < 3; i++)
              addPart(this.cx() + rnd(-20, 20), this.y + this.h - 6,
                rnd(-240, 240), rnd(-260, -140), 0.5, '#8a8a96', 2.5, 700, true);
            const box = { x: this.cx() - 92, y: this.y - 8, w: 184, h: this.h + 22 };
            if (!player.dead && player.iT <= 0 && aabb(box, player)) player.hurt(DF().edmg, this.cx(), this.kind + '.' + this.st);
            if (this.phase === 2 && typeof G.addRing === 'function') G.addRing(this.cx(), this.y + this.h - 8);
          }
        } else if (this.st === 'recover') {
          // a beat of stillness after the landing — your window
          this.vx *= 0.8; this.t -= dt;
          if (this.t <= 0) { this.st = 'idle'; this.t = rnd(0.4, 0.7); }
        } else if (this.st === 'ringcharge') {
          this.vx = 0; this.nwT -= dt;
          const kk = 1 - clamp(this.nwT / 0.7, 0, 1);
          for (let i = 0; i < 2; i++) {
            const a2 = rnd(0, 6.28), rr2 = 130 - kk * 92;
            addPart(this.cx() + Math.cos(a2) * rr2, this.cy() + Math.sin(a2) * rr2,
              -Math.cos(a2) * 210, -Math.sin(a2) * 210, 0.3, TELL_COL, 2.6, 0, true);
          }
          if (this.nwT <= 0) {
            this.ring((this.phase === 2 ? 14 : 10) + (this.mPhase || 0) * 2, 230 * (DF().espd || 1), this.anim);
            this.st = 'idle'; this.t = bossRest(this, 1.1);
          }
        } else if (this.st === 'nullcharge') {
          // dead still while virus light crawls up off the floor and your
          // own jumps start to feel wrong — gravity is being unplugged
          this.vx = 0; this.t -= dt; this.windT = 0.3;
          G.lowGravT = Math.max(G.lowGravT || 0, 0.5);
          if (chance(0.9)) addPart(rnd(40, G.roomDef.w * TILE - 40), G.roomDef.h * TILE - 10,
            rnd(-10, 10), rnd(-70, -25), 0.6, '#b06aff', 2.5, -140, true);
          if (this.t <= 0) {
            this.nullSeq = 3;
            this.st = 'nullhop'; this.t = 0.12;
            G.flash = Math.max(G.flash, 0.25); cam.shake = 6; sfx('roar');
          }
        } else if (this.st === 'nullhop') {
          // between the field pounces: an instant coil, then launch — the
          // field itself is the wind-up, the pounces have none
          this.vx = 0; this.t -= dt;
          G.lowGravT = Math.max(G.lowGravT || 0, 1.2);
          if (chance(0.5)) addPart(rnd(40, G.roomDef.w * TILE - 40), rnd(60, G.roomDef.h * TILE - 50),
            rnd(-20, 20), rnd(-30, 10), 0.5, '#b06aff', 2, 0, true);
          if (this.t <= 0) {
            const d2 = px - this.cx();
            this.face = Math.sign(d2) || 1;
            this.vx = clamp(d2 * 1.9, -720, 720) * spd;
            this.vy = -(380 + Math.min(240, Math.abs(d2) * 0.45));
            this.st = 'pounce'; sfx('dash');
          }
        } else if (this.st === 'nullend') {
          // the field collapses: everything slams back down and NULLFANG
          // lands hard, stunned — the longest window in the fight
          this.vx = 0; this.t -= dt;
          if (!this.nullCrash) {
            this.nullCrash = true;
            G.lowGravT = 0;
            for (let i = 0; i < 16; i++)
              addPart(rnd(40, G.roomDef.w * TILE - 40), rnd(80, G.roomDef.h * TILE - 80),
                0, rnd(300, 520), 0.5, '#8a8a96', 3, 600);
            cam.shake = 9; sfx('boom');
          }
          this.stagT = Math.max(this.stagT, 0.3);
          if (this.t <= 0) { this.st = 'idle'; this.t = rnd(0.6, 1.0); this.nullCrash = false; }
        }
        if (this.st === 'pounce' && this.nullSeq > 0) G.lowGravT = Math.max(G.lowGravT || 0, 1.2);
        const col = (this.st === 'spring' || this.st === 'dive') ? {} : moveEnt(this, dt);
        if (this.st === 'pounce' && col.d) {
          cam.shake = 8; sfx('land');
          for (let i = 0; i < 10; i++)
            addPart(this.cx() + rnd(-this.w * 0.5, this.w * 0.5), this.y + this.h - 4,
              rnd(-160, 160), rnd(-180, -40), 0.4, '#b9a888', 3, 300, true);
          // heavier landing: dust rolls low and wide off the forepaws
          for (let i = 0; i < 6; i++) {
            const dr = i % 2 ? 1 : -1;
            addPart(this.cx() + this.face * 20 + dr * rnd(8, this.w * 0.6), this.y + this.h - 3,
              dr * rnd(110, 250), rnd(-30, -6), rnd(0.45, 0.7), '#cdbd9c', rnd(3, 5), 70);
          }
          for (let i = 0; i < 3; i++)
            addPart(this.cx() + rnd(-24, 24), this.y + this.h - rnd(4, 12),
              rnd(-30, 30), rnd(-80, -35), rnd(0.55, 0.8), '#8f846f', rnd(3.5, 5.5), 30);
          const box = { x: this.cx() - 80, y: this.y, w: 160, h: this.h + 8 };
          if (!player.dead && player.iT <= 0 && aabb(box, player)) player.hurt(DF().edmg, this.cx(), this.kind + '.' + this.st);
          if (this.nullSeq > 0) {
            this.nullSeq--;
            if (this.nullSeq > 0) { this.st = 'nullhop'; this.t = 0.16; }
            else { this.st = 'nullend'; this.t = 1.15; }
          } else {
            // the punish window: long enough for the three-hit combo, not for
            // three of them
            this.st = 'recover'; this.t = this.phase === 2 ? 0.26 : 0.36;
          }
        }
        if (this.st === 'stalk' && (col.l || col.r)) this.face *= -1;
        // ANTI-WEDGE WATCHDOG: a dive can end beneath a ledge and jam the
        // hunter in place. If it stops registering movement for 2.6s in an
        // active state it WRENCHES itself free toward open floor — and if
        // that fails twice more, it re-enters clean from its spawn point.
        {
          if (this.wdX == null) { this.wdX = this.x; this.wdT = 0; }
          const activeSt = this.st === 'stalk' || this.st === 'recover'
            || this.st === 'pounce' || this.st === 'crouch' || this.st === 'nullend';
          if (Math.abs(this.x - this.wdX) > 10 || !activeSt || this.stagT > 0) {
            this.wdX = this.x; this.wdT = 0;
          } else if ((this.wdT += dt) > 2.6) {
            this.wdT = 0; this.wdX = this.x;
            this.wedged = (this.wedged || 0) + 1;
            const mid = G.roomDef.w * TILE / 2;
            if (this.wedged >= 3) {
              this.x = this.spawnX; this.y = this.spawnY; this.vx = 0; this.vy = 0;
              this.st = 'stalk'; this.t = 1.5; this.wedged = 0;
              burst(this.cx(), this.cy(), 14, '#b06aff', 200, 0.5, 100, 3, true);
            } else {
              this.st = 'pounce';
              this.vy = -560; this.vx = (mid > this.cx() ? 1 : -1) * 300;
              this.face = Math.sign(this.vx) || 1;
              cam.shake = Math.max(cam.shake, 4); sfx('dash');
              for (let i = 0; i < 8; i++)
                addPart(this.cx() + rnd(-24, 24), this.y + this.h - 4,
                  rnd(-120, 120), rnd(-160, -40), 0.4, '#b9a888', 2.5, 300, true);
            }
          }
        }
        break;
      }
      // ---- Broodmother: hangs above, spawns and slams ----
      case 'brood': {
        // ---- TALONHOST: hangs from the ceiling mount, rains metallic
        // feathers in fans, swoops through the arena with a wind wake, and
        // must come down low to rest its wings — that's your window ----
        this.bcCD = this.bcCD == null ? 9 : this.bcCD - dt;
        if (this.st === 'idle') {
          // IT WENT HOME BETWEEN PASSES. Returning to spawn is the one place in
          // the arena the player never has to be, so every beat between attacks
          // was the eagle drifting AWAY — the opposite of pressure. It holds a
          // station off her shoulder now, swapping sides, the way a bird that is
          // hunting you actually behaves.
          if (this.perchT == null || (this.perchT -= dt) <= 0) {
            this.perchSide = (chance(0.5) ? -1 : 1);
            this.perchT = rnd(1.4, 2.4);
          }
          {
            const bW = G.roomDef.w * TILE;
            const tgt = clamp(px + this.perchSide * rnd(120, 150), 80, bW - 80) - this.w / 2;
            this.x = lerp(this.x, tgt, Math.min(1, dt * 1.6));
          }
          this.y = this.homeY + Math.sin(this.anim * 1.6) * 8;
          this.t -= dt;
          if (!this.frozeUsed && this.hp <= this.hpMax * 0.4) {
            // COOLANT FREEZE: once per fight the ruptured coolant system
            // drops it out of the sky — an uncontrolled fall, not a swoop
            this.frozeUsed = true;
            this.st = 'cfcrash'; this.vy = 60; sfx('hurt');
            this.cabV = (this.cabV || 0) + 2.0;   // torn free — the cable whips
          } else if (this.t <= 0 && this.bcCD <= 0) {
            // BROOD CALL: the territorial screech that summons its brood
            this.st = 'broodcall'; this.t = 1.6;
            this.bcCD = rnd(12, 16); this.bcN = this.phase === 2 ? 4 : 3;
            this.bcT = 0.5; this.bcCried = false;
          } else if (this.t <= 0) {
            const which = this.cycle++ % 4;   // volley, swoop, volley, rest
            if (which === 3) { this.st = 'rest'; this.t = bossRest(this, 0.9); }
            else if (which === 1) { this.st = 'swoopwarn'; this.t = 0.55; this.tx = px; this.ty = py; }
            else {
              this.st = 'volley'; this.t = this.phase === 2 ? 1.6 : 1.9; this.fired = 0;
              if (G.enemies.filter(e => !e.dead && e.kind === 'flier').length < (this.phase === 2 ? 2 : 1)) {
                const f = new Enemy('flier', this.cx() - 13, this.y + this.h);
                G.enemies.push(f); sfx('shoot');
                burst(this.cx(), this.y + this.h, 10, PAL.B.glow, 180, 0.4, 300, 3, true);
              }
            }
          }
        } else if (this.st === 'volley') {
          // centre-top, then the authored charge -> fire -> recover, raining
          // a fan of metallic feathers you must take cover from
          this.x = lerp(this.x, G.roomDef.w * TILE / 2 - this.w / 2, dt * 3);
          this.y = lerp(this.y, this.homeY, dt * 3);
          this.t -= dt; this.windT = 0.3;
          const volleys = this.phase === 2 ? 2 : 1;
          if (this.fired < volleys && this.t <= (this.fired ? 0.45 : (this.phase === 2 ? 1.05 : 0.9))) {
            this.fired++;
            const n = this.phase === 2 ? 7 : 5;
            // the fan leaves the wings centre-out in a two-frame ripple, and
            // the recoil kicks her back up the cable
            this.feaQ = this.feaQ || [];
            for (let i = 0; i < n; i++)
              this.feaQ.push({ d: Math.abs(i - (n - 1) / 2) * 0.033, i, n });
            this.cabV = (this.cabV || 0) + (this.fired === 1 ? 1.3 : -1.3);
            this.fireKick = 1;
            sfx('shoot'); cam.shake = 4;
          }
          if (this.feaQ && this.feaQ.length) {
            for (const q of this.feaQ) {
              q.d -= dt;
              if (q.d > 0) continue;
              const a = Math.PI / 2 + (q.i - (q.n - 1) / 2) * 0.28 + rnd(-0.04, 0.04);
              const f = new Proj(this.cx() + (q.i - (q.n - 1) / 2) * 16, this.y + this.h - 6,
                Math.cos(a) * 330, Math.sin(a) * 330, false, 1, 7, '#ff4c5c', 180, 4);
              f.feather = true; G.projs.push(f);
            }
            this.feaQ = this.feaQ.filter(q => q.d > 0);
          }
          if (this.t <= 0) { this.st = 'idle'; this.t = bossRest(this, 1.2); }
        } else if (this.st === 'swoopwarn') {
          // locks on, talons splayed — then the dive
          this.t -= dt; this.windT = 0.3;
          if (this.t <= 0) {
            this.st = 'swoop'; this.t = 0;
            this.sx = this.x; this.sy = this.y;
            const W = G.roomDef.w * TILE;
            this.mx = clamp(this.tx, 70, W - 70);
            this.my = clamp(this.ty + 4, 60, 14.4 * TILE);
            this.ex = clamp(this.mx + (this.cx() < this.mx ? 300 : -300), 90, W - 90) - this.w / 2;
            sfx('dash');
            // her departure leaves the empty cable swinging over the perch
            this.cabV = (this.cabV || 0) + (this.cx() < this.mx ? -2.2 : 2.2);
          }
        } else if (this.st === 'swoop') {
          // one diagonal dive straight through where you stood, wind trailing
          this.t += dt / 1.05;
          const u = Math.min(1, this.t), iu = 1 - u;
          const nx = iu * iu * this.sx + 2 * iu * u * (this.mx - this.w / 2) + u * u * this.ex;
          const ny = iu * iu * this.sy + 2 * iu * u * (this.my - this.h / 2) + u * u * this.homeY;
          this.vx = (nx - this.x) / Math.max(dt, 0.001);
          this.vy = (ny - this.y) / Math.max(dt, 0.001);
          this.x = nx; this.y = ny;
          // the wake: twin ribbons of wind peeling off the wingtips, each
          // curling outward so the trail arcs instead of scattering
          const wsp = Math.hypot(this.vx, this.vy) || 1;
          const wnx = -this.vy / wsp, wny = this.vx / wsp;
          for (const sgn of [-1, 1]) {
            if (!chance(0.9)) continue;
            const off = sgn * (15 + Math.sin(this.anim * 12 + sgn) * 5);
            addPart(this.cx() + wnx * off - this.vx * 0.03, this.cy() + wny * off - this.vy * 0.03,
              -this.vx * 0.16 + wnx * sgn * 55, -this.vy * 0.16 + wny * sgn * 55,
              0.55, '#d6f2fb', 3.4, 0, true);
          }
          if (chance(0.3)) addPart(this.cx(), this.cy(), rnd(-40, 40), rnd(-40, 40), 0.22, '#ff4c5c', 2, 0, true);
          if (u >= 1) {
            // the catch: she snaps back onto station and the cable takes the
            // leftover momentum as a settling swing
            this.cabV = (this.cabV || 0) + clamp(this.vx * 0.0035, -2.4, 2.4);
            this.st = 'idle'; this.t = bossRest(this, 1.1); this.vx = 0; this.vy = 0;
          }
        } else if (this.st === 'rest') {
          // wings burn out: it descends into claw range
          this.y = lerp(this.y, 12.4 * TILE, dt * 2.8);
          this.x += Math.sin(this.anim * 2.2) * 22 * dt;
          this.t -= dt;
          if (this.t <= 0 && this.y > 11.6 * TILE) { this.st = 'restlow'; this.t = bossRest(this, 1.5); }
        } else if (this.st === 'restlow') {
          this.y += Math.sin(this.anim * 3) * 8 * dt;
          this.t -= dt;
          if (this.t <= 0) { this.st = 'rise'; this.t = 1.2; }
        } else if (this.st === 'rise') {
          this.t -= dt; this.y = lerp(this.y, this.homeY, 0.06);
          if (this.t <= 0) {
            this.st = 'idle'; this.t = bossRest(this, 1.1);
            this.cabV = (this.cabV || 0) + 0.9;   // catching the cable rocks it
          }
        } else if (this.st === 'broodcall') {
          // head thrown back, core strobing — then the brood answers from
          // the arena's edges, one staggered swoop at a time
          this.x = lerp(this.x, G.roomDef.w * TILE / 2 - this.w / 2, dt * 2);
          this.y = lerp(this.y, this.homeY, dt * 2);
          this.t -= dt; this.windT = 0.3;
          if (!this.bcCried && this.t <= 1.1) {
            this.bcCried = true; sfx('roar'); cam.shake = 7;
            this.cabV = (this.cabV || 0) - 1.1;   // the screech throws her back
            if (typeof G.addRing === 'function') G.addRing(this.cx(), this.cy());
          }
          if (chance(0.4)) addPart(this.cx() + rnd(-20, 20), this.y + this.h - 8,
            rnd(-40, 40), rnd(-30, 60), 0.3, '#ff4c5c', 2.5, 0, true);
          if (this.bcCried && this.bcN > 0) {
            this.bcT -= dt;
            if (this.bcT <= 0) {
              this.bcT = 0.5; this.bcN--;
              const left = this.bcN % 2 === 0;
              const f = new Enemy('flier', left ? 16 : G.roomDef.w * TILE - 42, rnd(70, 150));
              f.hp = 1; f.expireT = 10; f.dir = left ? 1 : -1;
              G.enemies.push(f); sfx('shoot');
              burst(f.x + f.w / 2, f.y + f.h / 2, 8, '#ff4c5c', 160, 0.35, 0, 2.5, true);
            }
          }
          if (this.t <= 0 && this.bcN <= 0) {
            this.st = 'idle'; this.t = bossRest(this, 1.2);
            this.stagT = Math.max(this.stagT, 0.9);   // wings drooped — window
          }
        } else if (this.st === 'cfcrash') {
          // falling with no lift at all; sparks and coolant trailing
          this.vy += 2600 * dt; this.y += this.vy * dt;
          this.x += Math.sin(this.anim * 9) * 30 * dt;
          if (chance(0.7)) addPart(this.cx() + rnd(-16, 16), this.y + rnd(0, this.h),
            rnd(-60, 60), rnd(-80, 20), 0.4, chance(0.5) ? '#8fd8ff' : '#ffb060', 2.5, 200, true);
          if (this.y >= 12.9 * TILE) {
            this.y = 12.9 * TILE; this.vy = 0;
            this.st = 'cffloor'; this.t = 1.7; this.coreCracked = true;
            G.iceT = 7.5; cam.shake = 10; sfx('boom');
            for (let i = 0; i < 22; i++)
              addPart(this.cx() + rnd(-24, 24), this.cy() + rnd(-10, 10),
                rnd(-280, 280), rnd(-320, -40), 0.7, i % 3 ? '#8fd8ff' : '#e8fbff', 3, 500, true);
            G.toast(t('cf_warn'));
          }
        } else if (this.st === 'cffloor') {
          // grounded with the chest cracked open — hit it while it repairs
          this.t -= dt;
          this.stagT = Math.max(this.stagT, 0.4);
          if (chance(0.5)) addPart(this.cx() + rnd(-14, 14), this.cy(),
            rnd(-60, 60), rnd(-130, -30), 0.5, '#8fd8ff', 2.5, 200, true);
          if (this.t <= 0) { this.st = 'rise'; this.t = 1.4; this.coreCracked = false; }
        }
        break;
      }
      // ---- ATLAS-7: slow walker, slams and lobs ----
      case 'atlas': {
        this.vy += 2100 * dt;
        this.face = Math.sign(px - this.cx()) || 1;
        this.fbCD = this.fbCD == null ? 8 : this.fbCD - dt;
        // THE SLAM HAD NO COOLDOWN. Its only gate was "she is within a hundred
        // pixels", which against a player who stays in melee range is always
        // true — so once the fight closed, the slam was the ONLY thing she ever
        // did: 38% of the encounter was one telegraph on repeat, and the bell,
        // the hymn and the forge never got a turn.
        this.slamCD = this.slamCD == null ? 0 : this.slamCD - dt;
        if (this.st === 'idle') {
          this.vx = this.face * 62 * spd * (this.slag ? 0.55 : 1);
          this.t -= dt;
          if (!this.meltUsed && this.hp <= this.hpMax * 0.35) {
            // MELTDOWN: below a third the furnace stops holding itself back —
            // the bell runs white-hot and the floor starts to pour
            this.meltUsed = true;
            this.st = 'meltwarn'; this.t = 1.2; this.vx = 0; sfx('cast');
          } else if (this.fbCD <= 0 && this.t <= 0.6) {
            // FORGE BELL: three rapid clapper strikes, three falling weapons
            // THE SHORTEST TELL IN THE GAME, LENGTHENED. It ran 300 ms to the
            // first clapper strike, which clears the 250 ms reaction floor by
            // fifty — for an ADULT. This game is for eight- to ten-year-olds,
            // whose choice-reaction time (four moves to tell apart, not one
            // stimulus to press a key on) is materially slower than the number
            // every window in docs/combat was checked against. 1.5 s to the
            // first strike puts it at 450 ms, in line with the rest of the
            // roster, and costs the fight nothing: its difficulty is the size
            // of its openings, not the speed of its warnings.
            this.st = 'forgebell'; this.t = 1.5; this.vx = 0;
            this.fbCD = rnd(11, 15); this.fbStruck = 0;
          } else if (Math.abs(px - this.cx()) < 100 && this.slamCD <= 0) {
            this.st = 'slamwarn'; this.t = 0.55; this.vx = 0;
            this.slamCD = rnd(2.6, 4.0);
          }
          else if (this.t <= 0) {
            if (this.cycle++ % 3 === 2) {
              this.st = 'hymn'; this.t = 1.0;
              this.roarBuzzT = 0.7;
              if (typeof padRumble === 'function') padRumble(0.7, 0.6, 550);
              if (typeof roarWave === 'function')
                roarWave(this.cx() + this.face * 34, this.y - this.h * 0.6, '#ffd76a');
            }
            else { this.st = 'lobwarn'; this.t = 0.45; this.vx = 0; }
          }
        } else if (this.st === 'lobwarn') {
          // THE LOB WAS NOT A STATE, and that is two bugs in one. It fired from
          // inside `idle` — so the automatic telegraph, which keys off the state
          // NAME, never sounded for it, and every measurement of this fight
          // counted her heaviest ranged attack as standing still. It has a
          // wind-up and a name now, so it warns like everything else does.
          this.vx = 0; this.t -= dt; this.windT = 0.3;
          if (this.t <= 0) {
            const d = px - this.cx();
            this.shoot(clamp(d * 1.1, -300, 300), -460, 8, 900); sfx('shoot');
            this.st = 'idle'; this.t = bossRest(this, 1.1);
          }
        } else if (this.st === 'forgebell') {
          // each strike rings out a spark shower, then the sky answers with
          // embedded white-hot weapons — break them before they burst
          this.vx = 0; this.t -= dt; this.windT = 0.3;
          // the first strike lands 450 ms in; the three are 300 ms apart after
          const due = Math.floor((1.5 - 0.15 - this.t) / 0.3);
          while (this.fbStruck < Math.min(3, due)) {
            this.fbStruck++;
            cam.shake = 6; sfx('bosshit');
            burst(this.cx(), this.cy() - 10, 12, MAT.molten.mid, 260, 0.45, 200, 3, true);
            const wx = clamp(px + rnd(-110, 110), 60, G.roomDef.w * TILE - 60);
            this.forge = this.forge || [];
            this.forge.push({ x: wx, y: -30, vy: 0, landed: false, t: 3, kind: this.fbStruck % 3 });
          }
          if (this.t <= 0) { this.st = 'idle'; this.t = bossRest(this, 1.35); }
        } else if (this.st === 'meltwarn') {
          // the tell: the bell whitens, steam screams from every joint
          this.vx = 0; this.t -= dt; this.windT = 0.4;
          this.whiteHot = Math.min(1, (this.whiteHot || 0) + dt * 1.2);
          if (chance(0.9)) addPart(this.cx() + rnd(-40, 40), this.y + rnd(0, this.h),
            rnd(-30, 30), rnd(-140, -60), 0.5, '#fff2dd', 2.5, 0, true);
          if (this.t <= 0) {
            this.st = 'idle'; this.t = bossRest(this, 1.25);
            this.slag = { t: 0, life: 6.5, h: 0 };
            cam.shake = 9; sfx('roar');
          }
        } else if (this.st === 'hymn') {
          // the bells wind up, then ring: expanding rings of heat
          this.vx = 0; this.t -= dt; this.windT = 0.4;
          if (this.t <= 0) {
            this.hymn = { r: 10, t: 0, n: this.phase === 2 ? 3 : 2 };
            sfx('roar'); cam.shake = 7;
            this.st = 'idle'; this.t = bossRest(this, 1.5);
          }
        } else if (this.st === 'slamwarn') {
          this.vx = 0; this.t -= dt;
          if (this.t <= 0) {
            this.st = 'idle'; this.t = bossRest(this, 1.2);
            cam.shake = 11; sfx('boom');
            const gy = this.y + this.h - 8;
            G.projs.push(new Proj(this.cx() - 40, gy, -340, 0, false, 1, 8, PAL.C.glow, 0, 1.6));
            G.projs.push(new Proj(this.cx() + 40, gy, 340, 0, false, 1, 8, PAL.C.glow, 0, 1.6));
          }
        }
        if (this.phase === 2) {
          this.embT = (this.embT || 0) - dt;
          if (this.embT <= 0) { this.embT = 1.1; G.projs.push(new Proj(px + rnd(-130, 130), 40, 0, 300, false, 1, 6, '#ff9430', 100, 3)); }
        }
        moveEnt(this, dt);
        break;
      }
      // ---- Archivist Zero: teleporting caster ----
      case 'zero': {
        // ---- GLACIERE, THE FROZEN PURIFIER: she FLOATS, gliding to flank
        // you, and answers with the sheet's five powers — VOID LANCE, ICE
        // SHARDS, FROST NOVA, DASH CHARGE, VOID ORBS — every one told.
        // ABSOLUTE ZERO, DATA CORRUPTION and the prison remain her rites. ----
        this.azCD = this.azCD == null ? 10 : this.azCD - dt;
        this.novaCD = Math.max(0, (this.novaCD || 0) - dt);
        // the shard fan's second rank: queued arrows leave a couple frames
        // after the first — the ripple launch (angles/speeds unchanged)
        if (this.glcShardQ && this.glcShardQ.length) {
          for (let i = this.glcShardQ.length - 1; i >= 0; i--) {
            const q = this.glcShardQ[i]; q.d -= dt;
            if (q.d <= 0) {
              const pr = new Proj(this.cx(), this.cy(), Math.cos(q.a) * 350, Math.sin(q.a) * 350, false, 1, 8, '#a5d8ff', 0, 2.2);
              pr.glcFx = 'shard'; pr.frost = true; G.projs.push(pr);
              this.glcShardQ.splice(i, 1);
            }
          }
        }
        const gW = G.roomDef.w * TILE;
        const hovY = clamp(py - 130, 80, 330);
        if (this.st !== 'dash' && this.st !== 'dashwarn')
          this.face = Math.sign(px - this.cx()) || this.face || 1;
        // leaving idle forgets the station, so coming back picks a new one
        if (this.st !== 'idle') { this.glcStat = null; this._glcWas = this.st; }
        if (this.st === 'idle') {
          // THE FLOAT, and why it read as waiting rather than flying.
          //
          // hovY is `clamp(py - 130, 80, 330)`, and a player standing on the
          // floor of her room puts that value hard against 330 — so she parked
          // at one altitude and stayed there for the whole fight, drifting
          // sideways at a lerp rate of 1.1 that could not close the distance
          // before the next timer fired. Fixed height plus imperceptible motion
          // is a hovering statue however many powers it has.
          //
          // She now picks a fresh station each time she comes to rest — which
          // side, how high, how far out — and MOVES to it, fast enough to be
          // seen going. A guardian who flies should look like she chose where
          // to be.
          if (this.glcStat == null || this.st !== this._glcWas) {
            this.glcStat = { side: this.cx() < px ? -1 : 1, out: rnd(150, 230), up: rnd(-40, 95) };
          }
          this._glcWas = 'idle';
          const S = this.glcStat;
          const tx2 = clamp(px + S.side * S.out, 70, gW - 70);
          const ty2 = clamp(hovY - S.up, 70, 14 * TILE - this.h - 40);
          this.x = lerp(this.x, tx2 - this.w / 2, dt * 2.6);
          this.y = lerp(this.y, ty2, dt * 2.4);
          // DATA CORRUPTION makes the whole unit run hotter while your HUD lies
          this.t -= dt * ((G.hudGlitchT || 0) > 0 ? 1.45 : 1);
          const adist = Math.abs(px - this.cx());
          if (!this.dcUsed && this.hp <= this.hpMax * 0.4) {
            // DATA CORRUPTION: once, below 40% — the void uploads itself
            // into your visor and scrambles everything you trust
            this.dcUsed = true;
            this.st = 'dccast'; this.t = 0.9; sfx('cast'); this.windT = 0.5;
          } else if (this.azCD <= 0 && this.t <= 0.4) {
            // ABSOLUTE ZERO: the purifier's hush — the expanding frost aura
            // is the tell; be outside it when the silence lands
            this.st = 'azhush'; this.t = 1.1; this.azCD = rnd(13, 17); this.windT = 0.5;
            sfx('cast');
          } else if (adist < 140 && Math.abs(py - this.cy()) < 120 && this.novaCD <= 0) {
            // FROST NOVA is reactive: crowd her and the cold answers — she
            // drops onto the standing frame and gathers, that is the tell
            this.st = 'novawarn'; this.t = 0.6; this.novaCD = 7; sfx('cast'); this.windT = 0.5;
          } else if (this.t <= 0) {
            const alt = this.cycle++ % 5;
            if (alt === 0 || alt === 2) { this.st = 'lancewarn'; this.t = 0.7; this.windT = 0.5; sfx('cast'); }
            else if (alt === 1) { this.st = 'shardwarn'; this.t = 0.5; this.windT = 0.4; sfx('cast'); }
            else if (alt === 3) { this.st = 'dashwarn'; this.t = 0.55; this.windT = 0.5; sfx('dash'); }
            else if (!this.orbs || !this.orbs.length) { this.st = 'orbs'; this.t = 1.0; this.windT = 0.5; sfx('cast'); }
            // THE PRISON GETS ITS OWN STATE. It used to be cast from inside
            // `idle` — the state was never changed, only `windT` was set — and
            // that makes `idle` itself a wind-up, which the telegraph auditor
            // rightly calls a one-channel tell: there is no way to look at a
            // hovering guardian and know a cage is coming. It only surfaced
            // once her rest beats got short enough to enter idle eighty times
            // a fight, but it was always a lie in the state machine.
            else { this.st = 'prisonwarn'; this.t = 0.5; this.windT = 0.5; sfx('cast'); }
          }
        } else if (this.st === 'lancewarn') {
          // the horn drinks void light — hold, watch, then move OFF the line
          this.t -= dt; this.vx = 0; this.vy = 0;
          if (this.t <= 0) {
            const n2 = this.phase === 2 ? 2 : 1;
            for (let k = 0; k < n2; k++) {
              const a = Math.atan2(py + (k ? -70 : 0) - this.cy(), px - this.cx());
              const pr = new Proj(this.cx() + this.face * this.w * 0.55, this.y + this.h * 0.18,
                Math.cos(a) * 185, Math.sin(a) * 185, false, 1, 13, '#d24bff', 0, 4.2);
              pr.glcFx = 'lance'; G.projs.push(pr);
            }
            sfx('cast'); cam.shake = 4;
            this.st = 'idle'; this.t = glcRest(this);
          }
        } else if (this.st === 'shardwarn') {
          // ice condenses along the spine crystals, then the fan flies
          this.t -= dt;
          if (this.t <= 0) {
            const n2 = this.phase === 2 ? 7 : 5;
            const base = Math.atan2(py - this.cy(), px - this.cx());
            // the fan leaves in a RIPPLE, not a wall: even ranks fire now,
            // odd ranks a couple frames later — same angles, same speeds
            this.glcShardQ = this.glcShardQ || [];
            for (let k = 0; k < n2; k++) {
              const a = base + (k - (n2 - 1) / 2) * 0.19;
              if (k % 2 === 0) {
                const pr = new Proj(this.cx(), this.cy(), Math.cos(a) * 350, Math.sin(a) * 350, false, 1, 8, '#a5d8ff', 0, 2.2);
                pr.glcFx = 'shard'; pr.frost = true; G.projs.push(pr);
              } else this.glcShardQ.push({ a, d: 0.07 });
            }
            sfx('shoot'); this.st = 'idle'; this.t = glcRest(this);
          }
        } else if (this.st === 'dashwarn') {
          // she squares up and coils; the charge line is drawn in the air
          this.t -= dt; this.vx = 0; this.vy = 0;
          this.dashAng = Math.atan2(py - this.cy(), px - this.cx());
          this.face = Math.abs(Math.cos(this.dashAng)) > 0.05 ? (Math.cos(this.dashAng) > 0 ? 1 : -1) : this.face;
          if (this.t <= 0) {
            this.st = 'dash'; this.t = 0.62;
            this.vx = Math.cos(this.dashAng) * 640 * spd;
            this.vy = Math.sin(this.dashAng) * 640 * spd;
            sfx('dash'); cam.shake = 5;
          }
        } else if (this.st === 'dash') {
          // DASH CHARGE: through where you stood, authored crystals hanging
          // in her wake — the trail itself bites
          this.t -= dt;
          this.x += this.vx * dt; this.y += this.vy * dt;
          this.y = clamp(this.y, 50, 14 * TILE - this.h);
          this.trailT = (this.trailT || 0) - dt;
          if (this.trailT <= 0) {
            this.trailT = 0.07;
            this.iceTrail = this.iceTrail || [];
            this.iceTrail.push({ x: this.cx() - this.vx * 0.06, y: this.cy() + rnd(-8, 8), t: 2.4 });
          }
          if (chance(0.8)) addPart(this.cx() - this.vx * 0.04, this.cy() + rnd(-16, 16),
            -this.vx * 0.2 + rnd(-40, 40), rnd(-40, 40), 0.3, '#bfe8ff', 2.5, 0, true);
          if (this.t <= 0) { this.vx = 0; this.vy = 0; this.st = 'recover'; this.t = 0.7; }
        } else if (this.st === 'recover') {
          // spent from the charge — your window
          this.t -= dt; this.y = lerp(this.y, hovY, dt * 1.2);
          if (this.t <= 0) { this.st = 'idle'; this.t = glcRest(this); }
        } else if (this.st === 'prisonwarn') {
          // the void gathers around where she is looking, then closes
          this.t -= dt; this.vx = 0; this.vy = 0;
          if (chance(0.7)) {
            const aa = rnd(0, 6.28), rr2 = 44 + rnd(-8, 8);
            addPart(px + Math.cos(aa) * rr2, py + Math.sin(aa) * rr2,
              -Math.cos(aa) * 90, -Math.sin(aa) * 90, 0.3, '#c88cff', 2.2, 0, true);
          }
          if (this.t <= 0) {
            this.prison = { x: px, y: py, t: 0, life: this.phase === 2 ? 3.4 : 2.6, held: 0 };
            sfx('cast'); this.st = 'idle'; this.t = glcRest(this);
          }
        } else if (this.st === 'novawarn') {
          this.t -= dt; this.vx = 0; this.vy = 0;
          if (this.t <= 0) {
            this.nova = { r: 24 };
            burst(this.cx(), this.cy(), 26, '#e0f7fa', 380, 0.6, 0, 3.5, true);
            cam.shake = 7; sfx('break'); G.flash = Math.max(G.flash, 0.18);
            // the nova already costs her a stagger; it does not also need a
            // two-second nap on top of it
            this.st = 'idle'; this.t = glcRest(this);
            this.stagT = Math.max(this.stagT, 0.55);   // spent for a breath
          }
        } else if (this.st === 'orbs') {
          // VOID ORBS: she stands and calls them out of the dark
          this.t -= dt; this.vx = 0; this.vy = 0;
          if (this.t <= 0) {
            this.orbs = [];
            const n2 = this.phase === 2 ? 4 : 3;
            for (let k = 0; k < n2; k++)
              this.orbs.push({ a: k / n2 * Math.PI * 2, cd: 1.4 + k * 0.5, t: 9, x: this.cx(), y: this.cy() });
            sfx('phase');
            this.st = 'idle'; this.t = glcRest(this);
          }
        } else if (this.st === 'azhush') {
          this.t -= dt;
          this.azR = 40 + (1.1 - this.t) * 190;      // the aura swelling outward
          if (chance(0.8)) {
            const aa = rnd(0, 6.28);
            addPart(this.cx() + Math.cos(aa) * this.azR, this.cy() + Math.sin(aa) * this.azR,
              -Math.cos(aa) * 60, -Math.sin(aa) * 60, 0.35, '#bfe8ff', 2, 0, true);
          }
          if (this.t <= 0) {
            const d2 = Math.hypot(px - this.cx(), py - this.cy());
            burst(this.cx(), this.cy(), 30, '#e0f7fa', 420, 0.7, 0, 3.5, true);
            cam.shake = 8; sfx('break'); G.flash = Math.max(G.flash, 0.2);
            if (d2 < this.azR && !player.dead) {
              player.slowT = Math.max(player.slowT, 2.4);
              player.hurt(1, this.cx());
            }
            // two follow-up beams while you are slowed — dodge on half speed
            this.marks.push({ x: px, t: 0.55 }, { x: px + (Math.sign(player.vx) || 1) * 70, t: 0.85 });
            this.azR = 0;
            this.st = 'idle'; this.t = glcRest(this) + 0.4;   // her biggest rite earns the longest breath
          }
        } else if (this.st === 'dccast') {
          this.t -= dt;
          // a stream of cyan digits pouring from the tablet into your visor
          if (chance(0.9)) {
            const k = rnd(0, 1);
            addPart(lerp(this.cx(), px, k), lerp(this.cy(), py, k) + rnd(-8, 8),
              (px - this.cx()) * 0.4, (py - this.cy()) * 0.4, 0.25, '#8ff6ff', 2, 0, true);
          }
          if (this.t <= 0) {
            G.hudGlitchT = 8; G.toast(t('dc_warn')); sfx('phase');
            this.st = 'idle'; this.t = glcRest(this);
          }
        }
        for (let i = this.marks.length - 1; i >= 0; i--) {
          const m = this.marks[i]; m.t -= dt;
          if (m.t <= 0) {
            const pr = new Proj(m.x, 15 * TILE - 6, 0, -520, false, 1, 8, '#eefcff', 0, 0.9);
            pr.frost = true;                       // contact freezes the joints
            G.projs.push(pr);
            sfx('shoot'); this.marks.splice(i, 1);
          }
        }
        // FROST NOVA in flight: a ring of biting cold, jump it or wear it
        if (this.nova) {
          const nv = this.nova; nv.r += 300 * dt;
          const d2 = Math.hypot(px - this.cx(), py - this.cy());
          if (Math.abs(d2 - nv.r) < 17 && !player.dead && player.iT <= 0) {
            player.hurt(DF().edmg, this.cx());
            player.slowT = Math.max(player.slowT, 1.6);
          }
          if (nv.r > 250) this.nova = null;
        }
        // VOID ORBS: they orbit her and take their shots; they burn out
        if (this.orbs && this.orbs.length) {
          for (let i = this.orbs.length - 1; i >= 0; i--) {
            const ob = this.orbs[i];
            ob.a += dt * 1.7; ob.t -= dt; ob.cd -= dt;
            ob.x = this.cx() + Math.cos(ob.a) * 80;
            ob.y = this.cy() + Math.sin(ob.a) * 54;
            if (ob.cd <= 0) {
              ob.cd = this.phase === 2 ? 1.5 : 2.1;
              const a = Math.atan2(py - ob.y, px - ob.x);
              G.projs.push(new Proj(ob.x, ob.y, Math.cos(a) * 300, Math.sin(a) * 300, false, 1, 6, '#d24bff', 0, 2));
              sfx('shoot');
            }
            if (ob.t <= 0) {
              burst(ob.x, ob.y, 8, '#d24bff', 160, 0.4, 0, 2.5, true);
              this.orbs.splice(i, 1);
            }
          }
        }
        // the DASH CHARGE's hanging ice: authored crystals that bite and fade
        if (this.iceTrail && this.iceTrail.length) {
          for (let i = this.iceTrail.length - 1; i >= 0; i--) {
            const tr = this.iceTrail[i]; tr.t -= dt;
            if (tr.t <= 0) { this.iceTrail.splice(i, 1); continue; }
            if (!player.dead && player.iT <= 0 && Math.abs(px - tr.x) < 20 && Math.abs(py - tr.y) < 26) {
              player.hurt(1, tr.x);
              player.slowT = Math.max(player.slowT, 1.2);
            }
          }
        }
        break;
      }
      // ---- Prism Prowler: rival robo-cat ----
      case 'prism': {
        this.vy += 2100 * dt;
        this.lsCD = this.lsCD == null ? 8 : this.lsCD - dt;
        if (this.st === 'idle') {
          // it PROWLS. Standing dead still between pounces made the rival read
          // as a statue that occasionally teleports; a cat closes the gap.
          this.face = Math.sign(px - this.cx()) || 1;
          const gap = px - this.cx();
          this.vx = Math.abs(gap) > 96 ? Math.sign(gap) * 190 * spd : Math.sign(gap) * 70 * spd;
          this.t -= dt;
          if (!this.arcUsed && this.hp <= this.hpMax * 0.35) {
            // ARC OVERLOAD: once, low health — the turntable overcharges and
            // it vanishes into its own lightning storm
            this.arcUsed = true;
            this.st = 'arcspin'; this.t = 1.2; this.vx = 0; sfx('cast');
          } else if (this.lsCD <= 0 && this.t <= 0) {
            // LIGHT SPLIT: a cat's pounce, taken through light — three spots
            // glow; only one holds the real body
            this.st = 'lsvanish'; this.t = 0.95; this.lsCD = rnd(10, 14);
            const W2 = G.roomDef.w * TILE;
            this.lsSpots = [0, 1, 2].map(i => ({
              x: clamp(W2 * (0.2 + i * 0.3) + rnd(-60, 60), 70, W2 - 70),
              y: 13.4 * TILE,
            }));
            this.lsReal = Math.floor(rnd(0, 3)) % 3;
            burst(this.cx(), this.cy(), 20, PAL.X.glow, 260, 0.5, 0, 3, true);
            sfx('wave');
          } else if (this.t <= 0) {
            const pick = this.cycle++ % 3;
            // THE FASTEST BOSS IN THE GAME HAD NO TELLS. Its dash covers 1022
            // px/s against her 340 and fired straight out of idle — nothing to
            // read, nothing to beat, and the same for the pounce. Both now
            // gather first, on the shared budget, with the sound the tell
            // system fires automatically on entering a *warn state. The fight
            // is still the tightest cycle in the game; it is now a fair one.
            if (pick === 0) { this.st = 'dashwarn'; this.t = TELL_FAST; this.vx = 0; }
            else if (pick === 1) { this.st = 'pouncewarn'; this.t = TELL_FAST * 0.86; this.vx = 0; }
            else {
              this.vy = -480;
              for (let k = -1; k <= 1; k++) {
                const a = Math.atan2(py - this.cy(), px - this.cx()) + k * 0.3;
                this.shoot(Math.cos(a) * 300, Math.sin(a) * 300, 6);
              }
              this.st = 'rest'; this.t = bossRest(this, 0.8);
            }
          }
        } else if (this.st === 'dashslash') {
          this.t -= dt;
          this.trailT = (this.trailT || 0) - dt;
          if (this.trailT <= 0) { this.trailT = 0.03; addPart(this.cx(), this.cy(), 0, 0, 0.3, PAL.X.glow, 5, 0, true); }
          if (this.t <= 0) { this.st = 'rest'; this.t = bossRest(this, 0.75); this.vx = 0; }
        } else if (this.st === 'pounce') {
          if (this.vy > 0 && this.y + this.h > 14 * TILE) { this.st = 'rest'; this.t = bossRest(this, 0.75); this.vx = 0; cam.shake = 6; }
        } else if (this.st === 'rest') {
          this.vx = 0; this.t -= dt;
          if (this.t <= 0) { this.st = 'idle'; this.t = rnd(0.3, 0.7); }
        } else if (this.st === 'lsvanish') {
          // gone — only the three glowing afterimages remain (the tell)
          this.vx = 0; this.vy = 0; this.t -= dt;
          if (this.t <= 0) {
            const spot = this.lsSpots[this.lsReal];
            this.x = spot.x - this.w / 2; this.y = spot.y - this.h;
            burst(spot.x, spot.y - this.h / 2, 18, PAL.X.glow, 300, 0.5, 60, 3, true);
            sfx('dash');
            // the fakes fire; the real one pounces
            this.lsSpots.forEach((s2, i) => {
              if (i === this.lsReal) return;
              const a = Math.atan2(py - (s2.y - 20), px - s2.x);
              this.shoot(Math.cos(a) * 340, Math.sin(a) * 340, 5, 0);
              burst(s2.x, s2.y - 20, 10, '#e0e0ff', 200, 0.4, 0, 2.5, true);
            });
            this.lsSpots = null;
            this.face = Math.sign(px - this.cx()) || 1;
            this.st = 'pounce'; this.vy = -420; this.vx = this.face * 460 * spd;
          }
        } else if (this.st === 'arcspin') {
          // the turntable screams up to full speed — sparks climbing the coils
          this.vx = 0; this.t -= dt; this.windT = 0.3;
          if (chance(0.9)) addPart(this.cx() + rnd(-30, 30), this.y + this.h - 6,
            rnd(-40, 40), rnd(-160, -60), 0.4, '#8ff6ff', 2.5, 0, true);
          if (this.t <= 0) {
            this.st = 'arcstorm'; this.t = 5.2; this.stormT = 5.2;
            this.strikes = []; this.strikeT = 0.2;
            G.flash = Math.max(G.flash, 0.3); cam.shake = 8; sfx('roar');
          }
        } else if (this.st === 'dashwarn') {
          this.vx = 0; this.t -= dt;
          this.face = Math.sign(px - this.cx()) || this.face;
          if (chance(0.7)) addPart(this.cx() + this.face * rnd(10, 34), this.cy() + rnd(-14, 14),
            -this.face * rnd(60, 190), rnd(-30, 30), 0.22, TELL_COL, 2.4, 0, true);
          if (this.t <= 0) { this.st = 'dashslash'; this.t = 0.42; this.vx = this.face * 720 * spd; }
        } else if (this.st === 'pouncewarn') {
          this.vx = 0; this.t -= dt;
          this.face = Math.sign(px - this.cx()) || this.face;
          if (chance(0.7)) addPart(this.cx() + rnd(-16, 16), this.y + this.h - rnd(0, 10),
            rnd(-40, 40), -rnd(40, 150), 0.24, TELL_COL, 2.4, 0, true);
          if (this.t <= 0) { this.st = 'pounce'; this.vy = -600; this.vx = this.face * 380 * spd; }
        } else if (this.st === 'arcstorm') {
          // hiding inside the storm: untouchable, but every strike is told
          // by its floor-glow a full second early
          this.vx = 0; this.t -= dt; this.stormT = this.t;
          this.strikeT -= dt;
          if (this.strikeT <= 0 && this.t > 1.0) {
            this.strikeT = 0.6;
            this.strikes.push({ x: clamp(px + rnd(-40, 40), 40, G.roomDef.w * TILE - 40), t: 1.0 });
          }
          if (chance(0.8)) addPart(this.cx() + rnd(-36, 36), this.y + rnd(-10, this.h),
            rnd(-60, 60), rnd(-40, 40), 0.2, '#8ff6ff', 2, 0, true);
          if (this.t <= 0) {
            this.stormT = 0;
            this.st = 'rest'; this.t = bossRest(this, 1.4);
            this.stagT = Math.max(this.stagT, 1.5);   // fell off the disc
            cam.shake = 7; sfx('boom');
          }
        }
        // the storm's lightning: warn on the floor, then the bolt
        if (this.strikes && this.strikes.length) {
          for (let i = this.strikes.length - 1; i >= 0; i--) {
            const s2 = this.strikes[i]; s2.t -= dt;
            if (s2.t <= 0) {
              const gy = 15 * TILE;
              for (let k = 0; k < 8; k++)
                addPart(s2.x + rnd(-10, 10), gy - k * 55 - rnd(0, 40), rnd(-40, 40), rnd(-20, 20), 0.16, '#dffcff', 3, 0, true);
              burst(s2.x, gy - 8, 14, '#8ff6ff', 260, 0.4, 200, 3, true);
              cam.shake = Math.max(cam.shake, 6); sfx('cast');
              if (!player.dead && Math.abs(px - s2.x) < 42 && py > gy - 90) player.hurt(DF().edmg, s2.x);
              this.strikes.splice(i, 1);
            }
          }
        }
        const col = (this.st === 'lsvanish' || this.st === 'arcstorm') ? {} : moveEnt(this, dt);
        if (this.st === 'dashslash' && (col.l || col.r)) { this.st = 'rest'; this.t = bossRest(this, 0.8); }
        break;
      }
      // ---- MOTHER-V: the Null Core ----
      case 'mother': {
        // SHE NEVER MOVED. Her y was a sine and her x was wherever she
        // spawned, so half the last fight in the game measured as a floating
        // shell waiting for a timer — which is the same complaint GLACIERE
        // had, and the same answer: hold a STATION relative to the player,
        // reclaimed after every action, so the beat between attacks is an
        // approach rather than a pause.
        this.y = lerp(this.y, 110 + Math.sin(this.anim * 1.1) * 16
          + clamp(py - 300, -70, 70) * 0.35, Math.min(1, dt * 2.2));
        {
          const mW = G.roomDef.w * TILE;
          if (this.mStat == null || (this.mStatT = (this.mStatT || 0) - dt) <= 0) {
            this.mStat = (chance(0.5) ? -1 : 1) * rnd(90, 210);
            this.mStatT = rnd(1.6, 2.8);
          }
          const tgt = clamp(px + this.mStat, 90, mW - 90) - this.w / 2;
          this.x = lerp(this.x, tgt, Math.min(1, dt * 1.5));
        }
        // PHASE SHIFT: crossing 75/50/25% shatters two more shell plates.
        // The core burns brighter to compensate and each break unlocks a
        // crueller trick: double Null Wave, then the tendril grab, then
        // the exposed core spitting wider rings.
        const phFrac = this.hp / this.hpMax;
        const wantPh = phFrac <= 0.25 ? 3 : phFrac <= 0.5 ? 2 : phFrac <= 0.75 ? 1 : 0;
        if ((this.mPhase || 0) < wantPh) {
          this.mPhase = wantPh;
          burst(this.cx(), this.cy(), 30, '#b48cff', 420, 0.8, 100, 4, true);
          burst(this.cx(), this.cy(), 14, '#ffd76a', 300, 0.6, 0, 3, true);
          cam.shake = 10; sfx('phase'); G.flash = Math.max(G.flash, 0.25);
          this.stagT = Math.max(this.stagT, 0.5);   // reforming — brief window
        }
        this.msCD = this.msCD == null ? 12 : this.msCD - dt;
        // TOTAL NULL: once, below 20% — every light in the arena dies
        if (!this.tnUsed && phFrac <= 0.2 && this.st !== 'msong' && this.st !== 'nwcharge') {
          this.tnUsed = true;
          this.st = 'tnull'; this.nwT = 1.4; this.beam = null;
          G.darkT = 8.4; G.toast(t('tn_warn'));
          sfx('roar'); G.flash = Math.max(G.flash, 0.4); cam.shake = 9;
        }
        this.t -= dt;
        if (this.beam) {
          this.beam.t -= dt;
          if (this.beam.warn && this.beam.t <= 0) { this.beam.warn = false; this.beam.t = 0.5; sfx('boom'); cam.shake = 8; }
          else if (!this.beam.warn) {
            if (!player.dead && aabb(this.beam, player)) player.hurt(DF().edmg, this.beam.x + this.beam.w / 2);
            if (this.beam.t <= 0) this.beam = null;
          }
        }
        // NULL WAVE in flight: black ring, red edge — jump it or eat the shove
        if (this.nwave) {
          const nw = this.nwave;
          nw.r += 240 * dt;
          const d2 = Math.hypot(px - this.cx(), py - this.cy());
          if (Math.abs(d2 - nw.r) < 18 && !player.dead && player.iT <= 0) {
            player.hurt(DF().edmg, this.cx());
            player.vx = (Math.sign(px - this.cx()) || 1) * 640;
            player.slowT = Math.max(player.slowT, 1.2);
          }
          if (nw.r > 620) {
            nw.n--;
            if (nw.n > 0) nw.r = 10;
            else { this.nwave = null; this.stagT = Math.max(this.stagT, 1.0); }
          }
        }
        if (this.st === 'nwcharge') {
          // the tell is SILENCE: the halo freezes and the core runs black
          this.nwT -= dt;
          if (this.nwT <= 0) {
            this.st = 'idle';
            this.nwave = { r: 10, n: (this.mPhase || 0) >= 1 ? 2 : 1 };
            cam.shake = 9; sfx('boom'); G.flash = Math.max(G.flash, 0.3);
          }
        } else if (this.st === 'msong') {
          // MOTHER'S SONG: the original broadcast — red where hers is cyan
          this.nwT -= dt;
          if (chance(0.8)) {
            const oa = rnd(0, 6.28);
            addPart(this.cx() + Math.cos(oa) * 40, this.cy() + Math.sin(oa) * 40,
              Math.cos(oa) * 160, Math.sin(oa) * 160, 0.4, chance(0.5) ? '#e63946' : '#b48cff', 2.5, 0, true);
          }
          if (this.nwT <= 0) {
            this.st = 'idle';
            G.songLockT = 10; G.revT = 5; G.toast(t('ms_warn'));
            sfx('phase'); cam.shake = 7;
            this.stagT = Math.max(this.stagT, 0.8);
          }
        } else if (this.st === 'tnull') {
          // attacks come out of the dark with sound for a tell; the Song
          // buys three seconds of sight
          this.nwT -= dt;
          if (this.nwT <= 0) { this.nwT = 1.4; sfx('cast'); this.lash = { x: px, y: py, t: 0.5 }; }
          if (this.lash) {
            this.lash.t -= dt;
            if (this.lash.t <= 0) {
              burst(this.lash.x, this.lash.y, 12, '#b48cff', 240, 0.4, 100, 3, true);
              if (!player.dead && Math.hypot(px - this.lash.x, py - this.lash.y) < 46)
                player.hurt(DF().edmg, this.lash.x);
              this.lash = null;
            }
          }
          if ((G.darkT || 0) <= 0) {
            // lights return: she hangs exposed, every plate open — FINISH IT
            this.st = 'idle'; this.t = bossRest(this, 2.0); this.lash = null;
            this.stagT = Math.max(this.stagT, 2.0);
            G.flash = Math.max(G.flash, 0.3); sfx('phase');
          }
        } else if (this.st === 'grabwarn') {
          // a tendril arcs out and hovers on you — break line-of-pull by moving
          this.nwT -= dt;
          if (this.nwT <= 0) { this.st = 'grab'; this.nwT = 0.9; sfx('dash'); }
        } else if (this.st === 'grab') {
          this.nwT -= dt;
          if (!player.dead) {
            player.vx += (Math.sign(this.cx() - px) || 1) * 1150 * dt;
            if (chance(0.6)) addPart(lerp(this.cx(), px, rnd(0.2, 0.9)), lerp(this.cy(), py, rnd(0.2, 0.9)),
              rnd(-30, 30), rnd(-30, 30), 0.2, '#b48cff', 2, 0, true);
          }
          if (this.nwT <= 0) this.st = 'idle';
        } else if (this.st === 'beamwarn') {
          this.nwT -= dt; this.windT = 0.3;
          if (this.nwT <= 0) { this.st = 'idle'; this.t = bossRest(this, 1.0); }
        } else if (this.st === 'ringcharge') {
          // HER RING HAS NEVER ONCE FIRED.
          //
          // `ringcharge` is handled in NULLFANG's state chain and nowhere else.
          // The last boss in the game sets the state, matches none of her own
          // branches, falls through to "pick something", and stands still for
          // the whole beat before choosing again. One action in four was a
          // no-op — which is exactly the 74% of the fight the measurement found
          // her spending in a single state — and the ring itself, sixteen
          // projectiles thrown into a coverless arena, her signature move, has
          // never gone off in a shipped build.
          this.vx = 0; this.nwT -= dt; this.windT = 0.3;
          {
            const rk = 1 - clamp(this.nwT / 0.7, 0, 1);
            for (let i = 0; i < 2; i++) {
              const ra = rnd(0, 6.28), rr3 = 150 - rk * 104;
              addPart(this.cx() + Math.cos(ra) * rr3, this.cy() + Math.sin(ra) * rr3,
                -Math.cos(ra) * 230, -Math.sin(ra) * 230, 0.3, TELL_COL, 2.8, 0, true);
            }
          }
          if (this.nwT <= 0) {
            this.ring((this.phase === 2 ? 16 : 12) + (this.mPhase || 0) * 2,
                      250 * (DF().espd || 1), this.anim);
            sfx('shoot'); cam.shake = 6;
            this.st = 'idle'; this.t = bossRest(this, 1.2);
          }
        } else if (this.t <= 0) {
          const p2 = this.phase === 2;
          // her decision beat, which WAS the fight: 1.5 s of nothing between
          // every action, against actions that last well under a second
          this.t = (p2 ? 0.62 : 0.9) * (1 - (this.mPhase || 0) * 0.08);
          if (this.msCD <= 0 && (this.mPhase || 0) >= 1) {
            this.msCD = rnd(18, 24);
            this.st = 'msong'; this.nwT = 1.6; sfx('cast');
          } else {
            const which = this.cycle++ % 4;
            if (which === 0 && !this.nwave) { this.st = 'nwcharge'; this.nwT = 1.1; sfx('no'); }
            // THE RING GATHERS FIRST. Sixteen projectiles used to appear in a
            // single frame, in a 34-tile arena with no cover, while she is
            // usually mid-air with her dash spent. The charge is short — this
            // is still the last boss — but it exists, and the tell system
            // sounds it automatically because the state name says 'charge'.
            else if (which === 1) { this.st = 'ringcharge'; this.nwT = 0.7; }
            else if (which === 2 && (this.mPhase || 0) >= 2) { this.st = 'grabwarn'; this.nwT = 0.5; sfx('cast'); }
            else if (which === 2 && G.enemies.filter(e => !e.dead).length < 2) {
              const b = new Enemy('blob', this.cx() - 17, this.y + this.h);
              G.enemies.push(b);
              burst(this.cx(), this.y + this.h, 12, PAL.E.glow, 200, 0.5, 300, 3, true);
            } else {
              // ...and the same in her chain: the sweeping beam was laid down
              // from inside `idle`, so the automatic telegraph never fired for
              // it and two thirds of the last fight in the game measured as her
              // standing still. It is a named state now, like everything else.
              const horiz = p2 ? chance(0.5) : true;
              this.beam = horiz
                ? { x: 0, y: py - 34, w: G.roomDef.w * TILE, h: 68, t: 0.8, warn: true }
                : { x: px - 34, y: 0, w: 68, h: G.roomDef.h * TILE, t: 0.8, warn: true };
              sfx('cast');
              this.st = 'beamwarn'; this.nwT = 0.8;
            }
          }
        }
        break;
      }
      // ---- THE EYE'S CONSTRUCTS ----------------------------------------
      // ONE state machine for all five, parameterised by MINI_KIT, because
      // five hand-written machines is five places for a telegraph to go
      // missing and the whole point of these is that they are LEGIBLE. What
      // differs between them is the shape of the attack and the shape of the
      // thing; the grammar — drift, wind up with your name on it, commit,
      // recover — is the same, and being the same is what makes them
      // learnable in a game that is about to have five more fights in it.
      // ---- THE ALPHA ---------------------------------------------------
      // Five skills and two recoveries, all of it in js/wolves.js so this
      // switch does not grow a sixth hand-written machine. It is not one of
      // the Eye's constructs and it is not a guardian: it is the pack.
      case 'alpha': alphaStep(this, dt, px, py); break;
      case 'chime': case 'carrier': case 'moth': case 'lattice': case 'lens': {
        const K = MINI_KIT[this.kind];
        const dist = px - this.cx(), adist = Math.abs(dist);
        this.face = Math.sign(dist) || 1;
        this.t -= dt;
        // ---- WHAT IT IS DOING ------------------------------------------
        // Written as one pass with NO early breaks. The first cut broke out of
        // the idle branch and out of the wind-up branch, and the integrate sat
        // at the bottom of the case — so the body only moved during the two
        // tenths of a second it was actually attacking, and every construct
        // measured 60-98% motionless. The state machine decides intent; the
        // block after it always runs.
        if (this.st === 'idle' || this.st === 'rest') {
          if (this.t <= 0) {
            // alternate the two moves rather than rolling for them: a coin
            // flip between attacks is what combat-design calls unlearnable,
            // and it is why NULLFANG's double swipe was fixed
            this.miniAlt = !this.miniAlt;
            const far = adist > K.near;
            this.st = (far ? K.far : (this.miniAlt ? K.close : K.far)) + 'warn';
            this.t = TELL_FAST;
          }
        } else if (/warn$/.test(this.st)) {
          // every wind-up is named <move>warn, so TELL_ST fires its sound and
          // Boss.draw paints the amber — no per-construct telegraph code
          this.windT = TELL_FAST;
          if (this.t <= 0) {
            this.st = this.st.replace(/warn$/, '');
            this.t = K.dur; this.fired = false; this.lunged = false;
          }
        } else {
          if (!this.fired) { this.fired = true; miniFire(this, this.st, K); }
          if (this.st === 'lunge' && !this.lunged) {
            this.lunged = true; this.vx = this.face * K.lungeV; if (K.fly) this.vy = 0;
          }
          if (this.st === 'lunge' && !player.dead && player.iT <= 0 && aabb(hurtBoxOf(this), player))
            player.hurt(DF().edmg, this.cx(), this.kind + '.lunge');
          if (this.t <= 0) { this.lunged = false; this.st = 'rest'; this.t = bossRest(this, 0.55); }
        }
        // ---- AND WHERE IT IS -------------------------------------------
        // It is NEVER parked. A construct that holds a station between moves is
        // a turret with a wind-up, which is the complaint the guardians were
        // retuned for; these ride a slow figure-of-eight around the station and
        // keep riding it through the telegraph.
        const held = /warn$/.test(this.st) ? 0.55 : 1;
        if (K.fly) {
          const tgt = px - this.face * K.stand, ty2 = py - K.hover;
          this.vx += clamp((tgt - this.cx()) * 2.4, -520, 520) * dt * held;
          this.vy += clamp((ty2 - this.cy()) * 2.4, -420, 420) * dt * held;
          this.vx += Math.cos(this.anim * 1.7) * K.spd * 2.6 * dt * held;
          this.vy += Math.sin(this.anim * 2.6) * 210 * dt * held;
          this.vx = clamp(this.vx, -K.spd * 3.2, K.spd * 3.2);
          this.vy = clamp(this.vy, -240, 240);
          this.x += this.vx * dt; this.y += this.vy * dt;
          this.vx *= 0.985; this.vy *= 0.975;
          const fy = 15 * TILE - this.h;
          if (this.y > fy) { this.y = fy; if (this.vy > 0) this.vy = 0; }
          if (this.y < TILE) { this.y = TILE; if (this.vy < 0) this.vy = 0; }
        } else {
          this.vy += 2100 * dt;
          // it walks, and it keeps walking through its own wind-up — a lattice
          // that stops dead to telegraph is a lattice you can ignore
          if (this.st !== 'spike') this.vx = this.face * K.spd * (0.9 * held + 0.25) * spd;
          moveEnt(this, dt);
        }
        break;
      }
    }
    // arena guard: a boss can never leave the room (out-of-bounds tiles read as
    // empty, so a charge through a doorway would escape and fall into the void)
    const maxX = G.roomDef.w * TILE - this.w;
    if (this.x < 0) { this.x = 0; if (this.vx < 0) this.vx = 0; this.atEdge = 1; }
    else if (this.x > maxX) { this.x = maxX; if (this.vx > 0) this.vx = 0; this.atEdge = 1; }
    else this.atEdge = 0;
    // falling out used to park the boss on the room's bottom edge, which is often
    // inside solid tile — hence a boss stuck in the floor. Send it home instead.
    if (this.y > G.roomDef.h * TILE + 20) {
      this.x = this.spawnX; this.y = this.spawnY; this.vx = 0; this.vy = 0;
      burst(this.cx(), this.cy(), 14, '#ffffff', 200, 0.5, 0, 3, true);
    }
    if (!player.dead && aabb(this, player) && this.st !== 'intro'
      && this.st !== 'lsvanish' && this.st !== 'arcstorm') player.hurt(DF().edmg, this.cx());
  }
  // ---- the three signature systems -----------------------------------------
  plantBore(x) {
    this.bores.push({ x, t: 0, next: 1.6 });
    if (this.bores.length > 4) this.bores.shift();
  }
  tickAbilities(dt, px, py) {
    // boreholes: the Driller's legacy. They keep erupting after it plants them,
    // so the floor you fight on is worse in the second half than the first.
    for (const b of this.bores) {
      b.t += dt; b.next -= dt;
      if (b.next <= 0) {
        b.next = 1.9;
        const gy = G.roomDef.h * TILE;
        for (let i = -1; i <= 1; i++) {
          const pr = new Proj(b.x + i * 9, gy - 8, i * 60, -520, false, 1, 6, MAT.crimson.mid, 900, 1.6);
          G.projs.push(pr);
        }
        burst(b.x, gy - 10, 10, MAT.crimson.mid, 220, 0.5, -200, 3, true);
        sfx('shoot');
      }
    }
    // the hymn: expanding rings. The Song cancels it — dissonance. That is the
    // whole reason this boss has bells.
    if (this.hymn) {
      const h = this.hymn;
      h.t += dt; h.r += 260 * dt;
      if (player.songT > 0) {                        // she sings over it
        this.hymn = null;
        this.stagT = Math.max(this.stagT, 1.1);
        G.elemPop = { t: 0.6, x: this.cx(), y: this.y - 12, el: 'murr' };
        burst(this.cx(), this.cy(), 30, ELEM.murr.glow, 380, 0.8, 0, 4, true);
        cam.shake = 9; sfx('powerUp');
      } else {
        const d = Math.hypot(px - this.cx(), py - this.cy());
        if (Math.abs(d - h.r) < 16 && !player.dead) player.hurt(DF().edmg, this.cx());
        if (h.r > 520) { h.n--; if (h.n > 0) { h.r = 10; } else this.hymn = null; }
      }
    }
    // FORGE BELL: the fallen weapons — embedded, white-hot, on a fuse.
    // Break them early (one hit each) or be elsewhere when they burst.
    if (this.forge && this.forge.length) {
      for (let i = this.forge.length - 1; i >= 0; i--) {
        const w = this.forge[i];
        if (!w.landed) {
          w.vy += 1700 * dt; w.y += w.vy * dt;
          if (chance(0.5)) addPart(w.x + rnd(-4, 4), w.y, rnd(-20, 20), rnd(-60, -10), 0.3, MAT.molten.mid, 2, 0, true);
          if (w.y >= 15 * TILE - 26) {
            w.y = 15 * TILE - 26; w.landed = true;
            cam.shake = Math.max(cam.shake, 3); sfx('land');
            burst(w.x, w.y + 20, 8, MAT.molten.mid, 180, 0.4, 300, 2.5, true);
          }
        } else {
          w.t -= dt;
          if (player.swing && Math.abs(px - w.x) < 44 && Math.abs(py - (w.y + 10)) < 50) {
            burst(w.x, w.y + 10, 12, MAT.molten.mid, 220, 0.45, 200, 3, true);
            sfx('break'); this.forge.splice(i, 1); continue;
          }
          if (w.t <= 0) {
            burst(w.x, w.y + 8, 18, MAT.molten.lit, 320, 0.55, 200, 3.5, true);
            cam.shake = Math.max(cam.shake, 6); sfx('boom');
            if (!player.dead && Math.hypot(px - w.x, py - (w.y + 8)) < 54) player.hurt(DF().edmg, w.x);
            this.forge.splice(i, 1);
          }
        }
      }
    }
    // MELTDOWN: the slag tide — an orange line climbing the floor. Platforms
    // are the answer; standing in the pour is not.
    if (this.slag) {
      const s = this.slag;
      s.t += dt; s.life -= dt;
      s.h = 30 * Math.min(1, s.t / 1.2) * clamp(s.life / 0.8, 0, 1);
      const top = 15 * TILE - s.h;
      if (s.h > 8 && !player.dead && player.y + player.h > top + 4) {
        s.tick = (s.tick || 0) - dt;
        if (s.tick <= 0) { s.tick = 0.7; player.hurt(1, player.x - 40); }
      }
      if (chance(0.7)) addPart(rnd(30, G.roomDef.w * TILE - 30), top, rnd(-20, 20), rnd(-70, -20), 0.4, MAT.molten.mid, 2.5, 0, true);
      if (s.life <= 0) {
        this.slag = null; this.whiteHot = 0;
        this.stagT = Math.max(this.stagT, 1.0);   // cooling vents open — window
        sfx('phase');
      }
    }
    // the prison: it holds you and takes what you are carrying, rather than
    // wounding you. Break out by attacking it.
    if (this.prison) {
      const q = this.prison;
      q.t += dt;
      const inside = Math.abs(px - q.x) < 62 && Math.abs(py - q.y) < 62;
      if (inside && !player.dead) {
        player.vx *= 0.25;
        q.held += dt;
        if (q.held > 0.7) {
          q.held = 0;
          if (G.save.scrap > 0) { G.save.scrap = Math.max(0, G.save.scrap - 3); G.toast(t('arch_take')); }
          else player.hurt(1, q.x);
        }
      }
      if (player.swing && inside) q.life -= dt * 3;   // hitting the bars breaks them
      q.life -= dt;
      if (q.life <= 0) { this.prison = null; }
    }
  }
  drawAbilities(c) {
    for (const b of this.bores) {                     // a scar in the floor
      const gy = G.roomDef.h * TILE;
      c.save();
      c.fillStyle = MAT.crimson.deep;
      c.beginPath(); c.ellipse(b.x, gy - 4, 13, 5, 0, 0, 7); c.fill();
      const glow = 0.4 + Math.sin(b.t * 4) * 0.3;
      c.globalAlpha = glow;
      c.fillStyle = MAT.crimson.mid;
      c.beginPath(); c.ellipse(b.x, gy - 5, 8, 3, 0, 0, 7); c.fill();
      c.restore(); c.globalAlpha = 1;
      c.save(); c.translate(b.x, gy - 8); tendrils(c, 3, 16, b.t, b.x, 0.35 * glow); c.restore();
    }
    if (this.hymn) {                                  // the ring of the bells
      const h = this.hymn;
      c.save(); c.globalAlpha = clamp(1 - h.r / 560, 0, 1);
      c.strokeStyle = MAT.molten.mid; c.lineWidth = 7;
      c.shadowColor = MAT.molten.mid; c.shadowBlur = 14;
      c.beginPath(); c.arc(this.cx(), this.cy(), h.r, 0, 7); c.stroke();
      c.strokeStyle = MAT.molten.lit; c.lineWidth = 2;
      c.beginPath(); c.arc(this.cx(), this.cy(), h.r - 5, 0, 7); c.stroke();
      c.shadowBlur = 0; c.restore(); c.globalAlpha = 1;
    }
    // FORGE BELL weapons: sword, axe and spear silhouettes, embedded, glowing
    if (this.forge) {
      for (const w of this.forge) {
        // the summoned molten orbs: the sheet's authored GLOW CORE, when the
        // dragon atlas is in — same positions, timers and hitchecks either way
        if (typeof drawFurnaceOrb === 'function' && drawFurnaceOrb(c, w, this.anim)) continue;
        c.save(); c.translate(w.x, w.y);
        const hot = w.landed ? 0.6 + Math.sin(w.t * (w.t < 1 ? 22 : 9)) * 0.35 : 0.8;
        c.shadowColor = MAT.molten.mid; c.shadowBlur = 12 * hot;
        c.fillStyle = '#e8d8c8'; c.strokeStyle = MAT.molten.mid; c.lineWidth = 1.4;
        if (w.kind === 0) {          // sword: blade down, crossguard
          c.fillRect(-2.4, -22, 4.8, 44); c.fillRect(-9, -14, 18, 4);
        } else if (w.kind === 1) {   // axe: haft + head
          c.fillRect(-2, -24, 4, 48);
          c.beginPath(); c.moveTo(2, -20); c.quadraticCurveTo(18, -14, 2, -2); c.closePath(); c.fill();
        } else {                     // spear: long shaft + leaf point
          c.fillRect(-1.6, -28, 3.2, 52);
          c.beginPath(); c.moveTo(0, -38); c.lineTo(5, -26); c.lineTo(-5, -26); c.closePath(); c.fill();
        }
        c.globalAlpha = hot; c.strokeStyle = MAT.molten.lit;
        c.strokeRect(-2.4, -22, 4.8, 44);
        c.restore(); c.globalAlpha = 1;
      }
    }
    // MELTDOWN slag tide
    if (this.slag && this.slag.h > 1) {
      const gy = 15 * TILE, top = gy - this.slag.h;
      const W2 = G.roomDef.w * TILE;
      const sg = c.createLinearGradient(0, top, 0, gy);
      sg.addColorStop(0, MAT.molten.lit); sg.addColorStop(0.35, MAT.molten.mid); sg.addColorStop(1, '#7a2c08');
      c.fillStyle = sg; c.fillRect(0, top, W2, this.slag.h + 6);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + Math.sin(this.anim * 7) * 0.2;
      c.fillStyle = MAT.molten.lit; c.fillRect(0, top - 2, W2, 3);
      c.restore(); c.globalAlpha = 1;
    }
    // MELTDOWN: the bell running white-hot — heat aura swallowing the body
    if ((this.whiteHot || 0) > 0 || this.slag) {
      const wk = this.slag ? 1 : this.whiteHot;
      c.save(); c.globalCompositeOperation = 'lighter';
      const wg = c.createRadialGradient(this.cx(), this.cy(), 8, this.cx(), this.cy(), this.w * 1.1);
      wg.addColorStop(0, 'rgba(255,245,224,' + (0.5 * wk) + ')');
      wg.addColorStop(0.5, 'rgba(255,170,80,' + (0.3 * wk) + ')');
      wg.addColorStop(1, 'rgba(255,120,58,0)');
      c.fillStyle = wg; c.beginPath(); c.arc(this.cx(), this.cy(), this.w * 1.1, 0, 7); c.fill();
      c.restore();
    }
    // GLACIERE's telegraphs and standing hazards -------------------------
    if (this.nova) {
      c.save(); c.globalAlpha = clamp(1 - this.nova.r / 260, 0, 1);
      c.strokeStyle = '#e0f7fa'; c.lineWidth = 4;
      c.shadowColor = '#a5d8ff'; c.shadowBlur = 14;
      c.beginPath(); c.arc(this.cx(), this.cy(), this.nova.r, 0, 7); c.stroke();
      c.strokeStyle = '#d24bff'; c.lineWidth = 1.6;
      c.beginPath(); c.arc(this.cx(), this.cy(), this.nova.r * 0.9, 0, 7); c.stroke();
      c.shadowBlur = 0; c.restore();
    }
    if (this.iceTrail && typeof drawGlcCrystal === 'function')
      for (const tr of this.iceTrail)
        drawGlcCrystal(c, tr.x, tr.y + 16, 0.34, clamp(tr.t * 0.9, 0, 1));
    if (this.orbs && typeof drawGlcOrb === 'function')
      for (const ob of this.orbs) if (ob.x != null) drawGlcOrb(c, ob.x, ob.y, this.anim + ob.a, 9 - ob.t);
    if (this.st === 'dashwarn' && this.dashAng != null) {
      // the charge line, sketched in frost before she takes it
      c.save(); c.globalAlpha = 0.3 + Math.sin(this.anim * 14) * 0.15;
      c.strokeStyle = '#a5d8ff'; c.lineWidth = 2; c.setLineDash([12, 9]);
      c.beginPath(); c.moveTo(this.cx(), this.cy());
      c.lineTo(this.cx() + Math.cos(this.dashAng) * 460, this.cy() + Math.sin(this.dashAng) * 460);
      c.stroke(); c.setLineDash([]); c.restore();
    }
    // ABSOLUTE ZERO hush aura — the swelling frost ring is the whole tell
    if (this.st === 'azhush' && this.azR > 0) {
      c.save(); c.globalAlpha = 0.55;
      c.strokeStyle = '#bfe8ff'; c.lineWidth = 3;
      c.shadowColor = '#bfe8ff'; c.shadowBlur = 14;
      c.beginPath(); c.arc(this.cx(), this.cy(), this.azR, 0, 7); c.stroke();
      c.lineWidth = 1.2; c.strokeStyle = '#eefcff';
      c.beginPath(); c.arc(this.cx(), this.cy(), this.azR * 0.86, 0, 7); c.stroke();
      c.shadowBlur = 0; c.restore();
    }
    // LIGHT SPLIT: three refraction ghosts — one holds the cat
    if (this.st === 'lsvanish' && this.lsSpots) {
      const k = clamp(1 - this.t / 0.95, 0, 1);
      for (const s2 of this.lsSpots) {
        c.save(); c.globalAlpha = 0.25 + k * 0.4 + Math.sin(this.anim * 10 + s2.x) * 0.1;
        c.strokeStyle = PAL.X.glow; c.lineWidth = 2;
        c.shadowColor = PAL.X.glow; c.shadowBlur = 12;
        // a crouched-cat outline, faint, shimmering
        c.beginPath(); c.ellipse(s2.x, s2.y - 22, 30, 16, 0, 0, 7); c.stroke();
        c.beginPath(); c.arc(s2.x + 22, s2.y - 34, 10, 0, 7); c.stroke();
        c.beginPath(); c.moveTo(s2.x + 18, s2.y - 42); c.lineTo(s2.x + 22, s2.y - 50); c.lineTo(s2.x + 27, s2.y - 42);
        c.moveTo(s2.x + 26, s2.y - 42); c.lineTo(s2.x + 31, s2.y - 49); c.lineTo(s2.x + 34, s2.y - 41); c.stroke();
        c.shadowBlur = 0; c.restore();
      }
      c.globalAlpha = 1;
    }
    // ARC OVERLOAD: floor glows a second ahead of every bolt
    if (this.strikes) {
      const gy = 15 * TILE;
      for (const s2 of this.strikes) {
        const warn = clamp(1 - s2.t, 0, 1);
        c.save(); c.globalAlpha = 0.3 + warn * 0.5;
        c.fillStyle = '#8ff6ff'; c.shadowColor = '#8ff6ff'; c.shadowBlur = 10;
        c.beginPath(); c.ellipse(s2.x, gy - 4, 30 + warn * 10, 6, 0, 0, 7); c.fill();
        c.shadowBlur = 0; c.restore();
      }
      c.globalAlpha = 1;
    }
    // NULL WAVE ring: black body, red rim — the void moving outward
    if (this.nwave) {
      const nw = this.nwave;
      c.save(); c.globalAlpha = clamp(1 - nw.r / 660, 0, 1);
      c.strokeStyle = '#0d0d12'; c.lineWidth = 10;
      c.beginPath(); c.arc(this.cx(), this.cy(), nw.r, 0, 7); c.stroke();
      c.strokeStyle = '#e63946'; c.lineWidth = 3;
      c.shadowColor = '#e63946'; c.shadowBlur = 12;
      c.beginPath(); c.arc(this.cx(), this.cy(), nw.r + 5, 0, 7); c.stroke();
      c.shadowBlur = 0; c.restore();
    }
    if (this.st === 'nwcharge') {
      // the silent charge: the core swallowed by black
      c.save();
      const k = 1 - clamp(this.nwT / 1.1, 0, 1);
      const dg = c.createRadialGradient(this.cx(), this.cy(), 2, this.cx(), this.cy(), 60);
      dg.addColorStop(0, 'rgba(13,13,18,' + (0.75 * k) + ')');
      dg.addColorStop(1, 'rgba(13,13,18,0)');
      c.fillStyle = dg; c.beginPath(); c.arc(this.cx(), this.cy(), 60, 0, 7); c.fill();
      c.restore();
    }
    if (this.st === 'msong') {
      // inverted song rings — red and violet where hers run cyan
      for (let i = 0; i < 3; i++) {
        const r2 = ((1.6 - this.nwT) * 90 + i * 34) % 150;
        c.save(); c.globalAlpha = clamp(1 - r2 / 150, 0, 1) * 0.7;
        c.strokeStyle = i % 2 ? '#e63946' : '#b48cff'; c.lineWidth = 2.5;
        c.beginPath(); c.arc(this.cx(), this.cy(), 30 + r2, 0, 7); c.stroke();
        c.restore();
      }
      c.globalAlpha = 1;
    }
    if ((this.st === 'grabwarn' || this.st === 'grab') && !player.dead) {
      // the tendril: a waving virus-purple whip reaching for you
      c.save(); c.globalAlpha = this.st === 'grab' ? 0.9 : 0.45;
      c.strokeStyle = '#b48cff'; c.lineWidth = this.st === 'grab' ? 4 : 2.5;
      c.shadowColor = '#b48cff'; c.shadowBlur = 10; c.lineCap = 'round';
      c.beginPath(); c.moveTo(this.cx(), this.cy() + 20);
      const tx2 = player.x + player.w / 2, ty2 = player.y + player.h / 2;
      for (let k = 1; k <= 5; k++) {
        const u = k / 5;
        c.lineTo(lerp(this.cx(), tx2, u) + Math.sin(this.anim * 11 + k * 1.7) * 16 * (1 - u),
                 lerp(this.cy() + 20, ty2, u) + Math.cos(this.anim * 9 + k * 1.3) * 12 * (1 - u));
      }
      c.stroke(); c.shadowBlur = 0; c.restore();
    }
    if (this.lash) {
      // in the dark: the strike point glows for half a second — MOVE
      c.save(); c.globalAlpha = 0.5 + Math.sin(this.anim * 22) * 0.3;
      c.strokeStyle = '#b48cff'; c.lineWidth = 2;
      c.beginPath(); c.arc(this.lash.x, this.lash.y, 30 + this.lash.t * 40, 0, 7); c.stroke();
      c.restore();
    }
    if (this.prison) {                                // bars of frozen data
      const q = this.prison, k = clamp(q.life, 0, 1);
      c.save(); c.globalAlpha = 0.35 + Math.min(1, q.t * 3) * 0.4 * k;
      c.strokeStyle = MAT.frost.mid; c.lineWidth = 3;
      c.strokeRect(q.x - 62, q.y - 62, 124, 124);
      c.lineWidth = 1.6; c.strokeStyle = MAT.frost.lit;
      for (let i = 1; i < 6; i++) {
        const bx = q.x - 62 + i * 20.6;
        c.beginPath(); c.moveTo(bx, q.y - 62); c.lineTo(bx, q.y + 62); c.stroke();
      }
      c.globalAlpha = 0.5; c.fillStyle = MAT.frost.lit;
      for (let i = 0; i < 5; i++) {                   // extracted memories, rising
        const yy = q.y + 56 - ((q.t * 40 + i * 26) % 120);
        ftxt('◈', q.x - 40 + i * 20, yy, 11, MAT.frost.lit);
      }
      c.restore(); c.globalAlpha = 1;
    }
  }
  die() {
    if (this.dead) return;
    // THE BLOW THAT WOULD END IT asks the question instead. This is the path
    // every real kill actually takes — the claw, the shuriken, the Song and the
    // pounce all call die() the moment health hits zero — so the guardian has
    // to kneel here, or it never kneels at all.
    if (!this.forceKill && bossFork(this)) return;
    this.dead = true;
    // A guardian with an authored purification film does not detonate. The
    // film shows the last blow and the virus leaving; we skip straight past
    // the wreck so nothing of him is ever seen destroyed.
    // forceKill is the FINISH branch of the first fork. Without it the film runs
    // either way and both answers end with the lion alive, which would make the
    // choice a costume change. Choosing to end it has to actually end it.
    if (!this.forceKill && typeof startPurifyCut === 'function' && startPurifyCut(this.kind)) {
      this.deathAnimT = 0; this.deathFxT = 0; this.deathFinale = true;
      this.purified = true; this.pureT = 0; this.rewardPend = true;
      this.vx = 0; this.vy = 0;
      if (this.kind !== 'mother') setMusic(G.roomDef.zone); else stopMusic();
      G.dropScrap(this.cx(), this.cy(), 30);
      sfx('win');
      return;
    }
    this.deathAnimT = Math.max(this.deathAnimT || 0, 1.6);
    burst(this.cx(), this.cy(), 60, '#ffffff', 420, 1.1, 200, 5, true);
    burst(this.cx(), this.cy(), 40, PAL[G.roomDef.zone].glow, 300, 1.4, 100, 4, true);
    cam.shake = 16; sfx('boom'); sfx('win');
    if (typeof roarWave === 'function') roarWave(this.cx(), this.cy(), '#ffffff');
    if (typeof padRumble === 'function') padRumble(1, 0.85, 800);
    G.hitStop = Math.max(G.hitStop, 0.22); G.flash = Math.max(G.flash, 0.7);
    G.addRing(this.cx(), this.cy()); G.addRing(this.cx(), this.cy(), 60);
    G.impact = { t: 0.24, t0: 0.24, x: this.cx(), y: this.cy() };
    if (this.kind !== 'mother') setMusic(G.roomDef.zone); else stopMusic();
    G.dropScrap(this.cx(), this.cy(), 30);
    // the reward dialog used to open HERE — freezing the collapse mid-fall
    // so the wreck stood still. Now the death scene plays to its finale
    // first; the spoils wait their turn (update fires them, loadRoom is
    // the safety net if the room is left early).
    this.rewardPend = true;
  }
  draw(c) {
    // ONE ENGINE, TWO WORLDS — and they must never bleed into each other.
    // Every routing decision below checks the theme FIRST: the Odyssey's
    // bosses are never allowed to borrow the machine art, dead or alive.
    const heroWorld = typeof isHero === 'function' && isHero();
    // The old test ORed the art keys across bosses, so NULLFANG counted as
    // "has a body" whenever the EAGLE's sheet happened to be loaded. Per-kind,
    // from one table, is the only version of this that cannot be wrong.
    if (this.dead && !heroWorld && !BOSS_ART[this.kind] && this.kind !== 'mother'
        && this.kind !== 'alpha') return;
    const P = PAL[G.roomDef.zone];
    // The intro used to fade the boss up from nothing, which made sense when it
    // arrived out of empty air. Now every guardian is already lying there in a
    // dormant pose, so a fade from zero blinked it out of existence on the exact
    // frame it woke. It stays solid; the rise and the roar carry the moment.
    let a = 1;
    if (this.purified && (this.pureT || 0) < 0.7) a *= clamp((this.pureT || 0) / 0.7 + 0.15, 0.15, 1);
    c.save(); c.globalAlpha = a * (this.hurtT > 0 ? 0.6 : 1);
    // THE TELEGRAPH WASH, and it lives HERE rather than in each guardian's own
    // file on purpose. TELL_ST has fired the warning SOUND for every boss since
    // it was written; the matching visual was left to each guardian to
    // implement, and tests/artbible.cjs measured the result: NULLFANG's coil
    // reaches 31% amber against a 0% rest, but GLACIERE's lance wind-up sits at
    // 0.0% — no warning colour at all — and FURNACE CHOIR's fire-lob wind-up is
    // actually DIMMER in amber than her own idle, because she is a fire dragon
    // and her rest state already lives in that hue.
    //
    // So the floor is structural: any state whose NAME says a blow is coming
    // gets a rising amber bloom behind the animal and a hot ring at its feet,
    // for every guardian that exists and every guardian added later. It sits
    // BEHIND the body — a wash in front would be the pasted badge ART_BIBLE.md
    // §3.5 forbids — and it is a floor, not a ceiling: a guardian that lerps
    // its own veins toward the amber (see NULLFANG's beastCoilFx) reads better,
    // and should.
    // (G.artProbe is the one measurement hook in this file. tests/artbible.cjs
    // checks that a guardian's FEET are on the floor, and ground-anchored
    // effects — this ring, a charge bead, a shockwave — are lit pixels below
    // the foot line that are not feet. Suppressing decoration for the probe is
    // honest; teaching the probe to guess which bright pixels are anatomy is
    // not. Nothing in the game ever sets it.)
    if (!this.dead && !G.artProbe && this.st && TELL_ST.test(this.st)) {
      // ramp over the wind-up's own length, so the bloom grows as the blow
      // approaches instead of switching on
      const dur = Math.max(0.18, this._tellDur || (this._tellDur = Math.max(0.18, this.t || 0.4)));
      const k = clamp(1 - (this.t || 0) / dur, 0, 1);
      const e = Math.pow(k, 0.62);              // §3.6 — lit from the first frame
      // A FLOOR ON THE RADIUS, not a pure multiple of the body. Scaled purely
      // off size, the smallest construct (the Carrier, 52x46) got a 78 px bloom
      // and measured 4.6% amber against a guardian's 180 px — a fainter warning
      // for a faster enemy, which is backwards. The player's eye needs the same
      // signal whatever the thing's size, so small things get proportionally
      // more of it.
      const bx = this.cx(), by = this.y + this.h * 0.55;
      const R = Math.max(104, Math.max(this.w, this.h) * 1.5);
      c.save();
      c.globalCompositeOperation = 'lighter';
      const gg = c.createRadialGradient(bx, by, 4, bx, by, R);
      const al = 0.16 + e * 0.30 + Math.sin((this.anim || 0) * 14) * 0.04 * e;
      gg.addColorStop(0, 'rgba(255,232,168,' + Math.min(0.7, al) + ')');
      gg.addColorStop(0.42, 'rgba(255,194,74,' + al * 0.6 + ')');
      gg.addColorStop(1, 'rgba(255,150,40,0)');
      c.fillStyle = gg;
      c.beginPath(); c.ellipse(bx, by, R, R * 0.86, 0, 0, 7); c.fill();
      // and the floor under it takes the light — the one place a wind-up is
      // always visible even when the animal itself is off the top of the screen
      c.strokeStyle = 'rgba(255,206,116,' + (0.22 + e * 0.5) + ')';
      c.lineWidth = 2 + e * 3;
      c.beginPath();
      c.ellipse(bx, this.y + this.h - 2, this.w * (0.6 + e * 0.5), 9 + e * 6, 0, 0, 7);
      c.stroke();
      c.restore();
    } else this._tellDur = 0;
    // A REACTION HAS TO HAPPEN IN THE CREATURE. Particles thrown around a
    // motionless body read as an effect played AT it; the bend is what turns a
    // poke into an answer. Rides inside the save above, so every early return
    // in this method unwinds it correctly.
    const _pp = (typeof petPose === 'function') ? petPose(this) : null;
    if (_pp) {
      const _px = this.cx(), _py = this.y + this.h;
      c.translate(_px + _pp.dx, _py + _pp.dy);
      c.rotate(_pp.rot); c.scale(_pp.sx, _pp.sy);
      c.translate(-_px, -_py);
    }
    // THE WEIGHT PASS, draw half: the momentum bookkeeping from update()
    // becomes a body that leans into its own speed, bobs with its stride,
    // and compresses when a fall lands — pivoted at the FEET so mass stays
    // planted. Suppressed for the art probe (it measures feet, not physics)
    // and for the dead (their collapses are choreographed per guardian).
    if (!this.dead && !G.artProbe) {
      const wx = this.cx(), wy = this.y + this.h;
      const spd = Math.abs(this.vx);
      const bob = Math.abs(this.vy) < 30 && spd > 26
        ? Math.abs(Math.sin(this.anim * (6 + Math.min(6, spd / 90)))) * Math.min(4, spd / 90) : 0;
      const sq = this._squashT > 0 ? Math.sin((this._squashT / 0.22) * Math.PI) * 0.09 : 0;
      if (this._lean || sq || bob) {
        c.translate(wx, wy);
        c.rotate(this._lean || 0);
        c.scale(1 + sq * 0.7, 1 - sq);
        c.translate(-wx, -wy);
        c.translate(0, -bob);
      }
    }
    const cx = this.cx(), cy = this.cy();
    if (this.dead) {
      if (heroWorld) {
        // the Odyssey's creatures die as THEMSELVES: the same sheet they
        // fought with, keeling over and fading — never the lion
        const k = 1 - clamp((this.deathAnimT || 0) / 1.6, 0, 1);
        const BSPR = {
          glitch: ['beast', 6, 55, 67, 1.25], brood: ['ghost', 7, 64, 80, 1.6],
          atlas: ['demon', 6, 160, 144, 1.7], zero: ['ghost', 7, 64, 80, 1.4],
        };
        const s = BSPR[this.kind];
        if (s && typeof sheetReady === 'function' && sheetReady(s[0])) {
          const [key, n, cw, ch, mult] = s;
          c.save();
          c.globalAlpha *= Math.max(0, 1 - k * 0.9);
          c.translate(cx, this.y + this.h + k * 10);
          c.scale(this.face || 1, 1);
          c.rotate(k * 0.45); c.scale(1, 1 - k * 0.4);
          drawSheet(c, key, n, cw, ch, 0, (this.h * 1.55 * mult) / ch, 4);
          c.restore();
        }
        c.restore(); return;
      }
      // each machine dies as itself: the beast folds, the eagle drops,
      // GLACIERE breaks into the sheet's own parts, the PRISM PROWLER
      // shatters into rainbow shards while its turntable spins down, and
      // MOTHER-V's finale plays out — plates one by one, limp tendrils,
      // the fallen halo ringing on the floor, the core flickering out LAST
      // THE ALPHA DOES NOT DIE. It yields — so what stands in the room after
      // the fight is the freed plate, not a death animation, and it stays
      // there for the rest of the run (see PET_HOMES).
      if (this.kind === 'alpha') { drawAlpha(c, this, cx, cy); c.restore(); return; }
      if (this.kind === 'mother') {
        if (typeof drawMother === 'function') drawMother(c, this);
        c.restore(); return;
      }
      if (this.kind === 'prism') {
        if (typeof drawPrism === 'function') drawPrism(c, this);
        c.restore(); return;
      }
      if (this.kind === 'zero') {
        if (typeof drawGlaciere === 'function') drawGlaciere(c, this);
      } else if (this.kind === 'atlas') {
        // FURNACE CHOIR dies as himself: the dragon breaks into the sheet's
        // own parts — wings first, then the head, then the body drops
        if (typeof drawFurnace === 'function') drawFurnace(c, this);
      } else if (this.kind === 'brood') {
        if (typeof drawEagle === 'function') drawEagle(c, this);
      } else if (!(typeof drawBeast === 'function' && drawBeast(c, this))) {
        // NEVER THE DRILLER. This used to fall back to the legacy procedural
        // NULL-SEEKER — a drill-nosed walker off driller_12x6.png — whenever
        // the lion's parts sheet was not in memory yet, which is exactly when
        // a player is most likely to be looking: the frame it dies. It was
        // reported as "the old one that has a drill as a nose", and it was.
        drawBossHold(c, this);
      }
      c.restore(); return;
    }
    // telegraphs
    this.drawAbilities(c);
    // LIGHT SPLIT: the body is elsewhere — only the ghosts (drawn above) show
    if (this.st === 'lsvanish') { c.restore(); return; }
    // ARC OVERLOAD: a strobing silhouette inside its own lightning
    if (this.st === 'arcstorm') {
      c.globalAlpha *= 0.35 + Math.sin(this.anim * 26) * 0.25;
    }
    // plating chain feedback: a shorted shield crackles in the key element's
    // color for the length of the window; closed plating pings grey on hit
    if (BOSS_GATE[this.kind]) {
      const R = Math.max(this.w, this.h) * 0.78;
      if ((this.shieldT || 0) > 0) {
        const key = armDef(BOSS_GATE[this.kind]);
        const col = key ? ELEM[key.el].glow : '#ffffff';
        c.save(); c.globalAlpha = 0.32 + Math.sin(this.anim * 18) * 0.14;
        c.strokeStyle = col; c.lineWidth = 2.5; c.setLineDash([10, 7]);
        c.beginPath(); c.arc(cx, cy, R + Math.sin(this.anim * 9) * 3, 0, 7); c.stroke();
        c.setLineDash([]); c.restore();
      } else if (!bossGateOpen(this) && this.hurtT > 0) {
        c.save(); c.globalAlpha = 0.55;
        c.strokeStyle = '#c8d2dc'; c.lineWidth = 3;
        c.beginPath(); c.arc(cx, cy, R, -0.6, 0.6); c.stroke();
        c.beginPath(); c.arc(cx, cy, R, Math.PI - 0.6, Math.PI + 0.6); c.stroke();
        c.restore();
      }
    }
    if (this.kind === 'zero') for (const m of this.marks) {
      c.fillStyle = 'rgba(238,252,255,0.35)';
      c.fillRect(m.x - 10, 12 * TILE, 20, 3 * TILE);
    }
    if (this.kind === 'mother' && this.beam) {
      c.fillStyle = this.beam.warn ? 'rgba(255,90,220,0.22)' : 'rgba(255,120,240,0.6)';
      c.fillRect(this.beam.x, this.beam.y, this.beam.w, this.beam.h);
    }
    // bosses get a heavy contact shadow too (grounded ones)
    if (this.kind === 'glitch' || this.kind === 'atlas' || this.kind === 'prism')
      contactShadow(c, cx, this.y + this.h, this.w * 0.6, 0.45);
    // ---- hero world: real hand-animated boss beasts ----
    if (typeof isHero === 'function' && isHero()) {
      const BSPR = {
        glitch: ['beast', 6, 55, 67, 12, 1.25],   // the Bronze Boar
        brood: ['ghost', 7, 64, 80, 8, 1.6],      // the Siren Mother — a spirit, not the iron eagle
        atlas: ['demon', 6, 160, 144, 7, 1.7],    // Talos, the Forge-Giant
        zero: ['ghost', 7, 64, 80, 8, 1.4],       // the Judge of the Dead
      };
      const s = BSPR[this.kind];
      if (s && sheetReady(s[0])) {
        const [key, n, cw, ch, fps, mult] = s;
        c.save();
        if (this.hurtT > 0) c.globalAlpha = 0.65;
        c.translate(cx, this.y + this.h);
        c.scale(this.face || 1, 1);
        if (this.st === 'slamwarn' || this.st === 'charge') {   // menace tell
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.28;
          const wg = c.createRadialGradient(0, -this.h / 2, 4, 0, -this.h / 2, this.w);
          wg.addColorStop(0, '#ff6a3c'); wg.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = wg; c.beginPath(); c.arc(0, -this.h / 2, this.w, 0, 7); c.fill();
          c.restore();
        }
        drawSheet(c, key, n, cw, ch, Math.floor(this.anim * fps) % n, (this.h * 1.55 * mult) / ch, 4);
        c.restore();
        c.restore();
        return;
      }
    }
    // the machine's authored art is CLAWBYTE-only — hard theme gate
    if (!heroWorld && this.kind === 'zero' && typeof drawGlaciere === 'function' && drawGlaciere(c, this)) { c.restore(); return; }
    if (!heroWorld && this.kind === 'atlas' && typeof drawFurnace === 'function' && drawFurnace(c, this)) { c.restore(); return; }
    if (!heroWorld && this.kind === 'glitch' && typeof drawBeast === 'function' && drawBeast(c, this)) { c.restore(); return; }
    if (!heroWorld && this.kind === 'brood' && typeof drawEagle === 'function' && drawEagle(c, this)) { c.restore(); return; }
    if (!heroWorld && this.kind === 'prism' && typeof drawPrism === 'function' && drawPrism(c, this)) { c.restore(); return; }
    if (!heroWorld && this.kind === 'mother' && typeof drawMother === 'function' && drawMother(c, this)) { c.restore(); return; }
    // NEVER THE WRONG BODY. Every guardian's authored art streams in on demand,
    // and until it lands its draw function returns false — which used to drop
    // through to the legacy procedural boss underneath. That is exactly why
    // walking into NULLFANG's room could show you the DRILLER for a moment: not
    // a leftover asset, a fallback firing while the real sheet was still in
    // flight. A guardian that HAS a body now waits behind its own silhouette
    // rather than borrowing somebody else's.
    // the Eye's constructs are drawn, not composited — see MINIS
    if (isMini(this)) { drawMini(c, this, cx, cy); c.restore(); return; }
    if (!heroWorld && this.kind === 'alpha') { drawAlpha(c, this, cx, cy); c.restore(); return; }
    if (!heroWorld && BOSS_ART[this.kind]) {
      if (typeof mediaFetch === 'function') mediaFetch(BOSS_ART[this.kind]);
      drawBossHold(c, this); c.restore(); return;
    }
    if (drawAtlas(c, this.kind, this.faceVis, cx, this.y + this.h, this.h, {
          flash: this.hurtT > 0 ? 1 : 0,
          grounded: this.kind !== 'brood' && this.kind !== 'zero' && this.kind !== 'prism',
          t: this.anim, vx: this.vx, vy: this.vy, air: clamp(-this.vy / 500, 0, 1),
          mode: { brood: 'sway', atlas: 'breathe', zero: 'hover', prism: 'gimbal', mother: 'pulse' }[this.kind] || 'breathe',
          yawSpin: this.kind === 'prism' ? 0.9 : 0,
          yawScan: this.kind === 'zero' ? { c: yawColF(this.faceVis), r: 0.4, a: 0.7 } : null,
        })) { c.restore(); return; }
    // ---- THE LEGACY PROCEDURAL BODIES END HERE, FOR CLAWBYTE ----------------
    // Everything below this line is the pre-authored-art cast: the drill-nosed
    // NULL-SEEKER, the procedural eagle, and the rest. Every one of them has a
    // rendered body now, and the ONLY way to reach these is a sheet that has
    // not arrived yet — so what the player gets is a boss wearing the wrong
    // species for a frame or two. That is worse than showing nothing, because
    // "nothing" is a dark silhouette with two eyes in it and reads as menace,
    // while a drill-nosed walker reads as the wrong game.
    //
    // The Odyssey keeps them: its creatures are hand-animated sheets and these
    // are their honest fallback, not a different cast.
    if (!heroWorld) { drawBossHold(c, this); c.restore(); return; }
    c.translate(cx, cy);
    // The bodies are authored nose-LEFT, but face = +1 means "the player is to my
    // right", so scaling by face directly made every boss charge backwards. Scale
    // by the negated eased facing instead, and never let it hit exactly zero.
    const fv = -(this.faceVis || (this.face || 1));
    const faceScale = Math.abs(fv) < 0.09 ? (fv < 0 ? -0.09 : 0.09) : fv;
    switch (this.kind) {
      case 'glitch': {
        // NULL-SEEKER DRILLER. Authored in three poses off the sheet — SIDE, 3/4
        // and FRONT — so a turn walks through the front view instead of squashing
        // the profile to a sliver.
        const tt = this.anim, p2 = this.phase === 2;
        const st8 = sensorState(this);
        const T = turnPose(this.faceVis);
        const drill = tt * (this.st === 'charge' || this.st === 'bore' ? 46 : 12);

        const legPair = (lx, ph, depth) => {          // depth 1 = near, <1 = far side
          const sw = Math.sin(tt * (this.st === 'charge' ? 14 : 5) + ph);
          const kx = lx + sw * 5 * depth, ky = 4 + Math.abs(sw) * 2;
          c.save(); c.globalAlpha = depth < 1 ? 0.8 : 1;
          c.strokeStyle = depth < 1 ? MAT.steel.deep : MAT.steel.dark;
          c.lineWidth = 5 * depth; c.lineCap = 'round';
          c.beginPath(); c.moveTo(kx, ky); c.lineTo(kx + sw * 3, 24); c.stroke();
          const ang = Math.atan2(ky + 4, kx - lx * 0.7), seg = Math.hypot(kx - lx * 0.7, ky + 4);
          c.save(); c.translate(lx * 0.7, -4); c.rotate(ang);
          c.fillStyle = ramp(c, MAT.steel, 0, -3.4, seg * 0.6, 3.4, depth);
          rr(c, 0, -3.4 * depth, seg * 0.62, 6.8 * depth, 2.4); c.fill();
          c.fillStyle = ramp(c, MAT.ceramic, seg * 0.5, -2, seg, 2, 0.9 * depth);
          c.fillRect(seg * 0.55, -1.9 * depth, seg * 0.45, 3.8 * depth);
          c.fillStyle = ramp(c, MAT.bronze, 0, -4, 6, 4, depth);
          rr(c, -1, -4.2 * depth, 6, 8.4 * depth, 2); c.fill();
          c.restore();
          c.fillStyle = MAT.ceramic.dark; c.fillRect(kx + sw * 3 - 4 * depth, 23, 8 * depth, 3.5);
          occl(c, kx + sw * 3, 26, 7 * depth, 3, 0.5 * depth);
          c.restore();
        };
        const stacks = (sep) => {
          for (const ex of [sep, sep + 7]) {
            c.fillStyle = ramp(c, MAT.steel, ex - 2, -34, ex + 2, -26);
            c.fillRect(ex, -34, 4, 8);
            if (p2) { c.fillStyle = MAT.crimson.mid; c.fillRect(ex, -36, 4, 2.5); }
          }
        };

        if (T.pose === 'front') {
          // ---- FRONT: the drum head-on, the bore-head pointing straight at you,
          // four legs splayed with the far pair dimmed behind the near pair.
          c.save(); c.scale(1 + T.t * 0.10, 1);
          legPair(-19, 1.1, 0.68); legPair(19, 3.4, 0.68);
          legPair(-13, 0, 1);      legPair(13, 2.2, 1);
          stacks(-4);
          c.fillStyle = ramp(c, MAT.ceramic, -14, -22, 16, 12);
          rr(c, -19, -20, 38, 30, 9); c.fill();            // narrower seen head-on
          occl(c, 0, 10, 19, 6, 0.45);
          c.fillStyle = ramp(c, MAT.bronze, -19, -6, 19, 2);
          c.fillRect(-19, -6, 38, 5);
          c.fillStyle = ramp(c, MAT.ceramic, -10, -30, 12, -14, 0.95);
          rr(c, -12, -30, 24, 14, 5); c.fill();
          occl(c, 0, -16, 13, 4, 0.4);
          wear(c, [[-15, -12, 4], [11, 2, 3]]);
          c.save(); c.translate(0, 4);                      // bore-head, end-on
          c.fillStyle = ramp(c, MAT.bronze, -11, -11, 11, 11);
          c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fill();
          c.strokeStyle = 'rgba(28,20,10,0.6)'; c.lineWidth = 1.4;
          for (let i = 0; i < 6; i++) {
            const a = drill * 0.16 + i / 6 * Math.PI * 2;
            c.beginPath(); c.moveTo(Math.cos(a) * 3.5, Math.sin(a) * 3.5);
            c.lineTo(Math.cos(a) * 10.5, Math.sin(a) * 10.5); c.stroke();
          }
          c.fillStyle = ramp(c, MAT.steel, -4, -4, 4, 4);
          c.beginPath(); c.arc(0, 0, 4, 0, 7); c.fill();
          c.restore();
          occl(c, 0, 14, 11, 4, 0.5);
          drawSensor(c, 0, -12, 5, st8, tt);
          if (p2 || this.overdriveT > 0) { c.save(); c.translate(0, -28); tendrils(c, 5, 26, tt, 1.2, 0.75); c.restore(); }
          c.restore();
        } else {
          // ---- SIDE and 3/4. The 3/4 narrows the profile and brings the far legs
          // into view, which is what sells the angle rather than a squash.
          const narrow = T.pose === 'q' ? 0.46 + T.t * 0.54 : 1;
          c.scale(-T.dir * narrow, 1);
          if (T.pose === 'q') { legPair(-20, 1.1, 0.66); legPair(18, 3.4, 0.66); }
          legPair(-24, 0, 1); legPair(-11, 2.2, 1); legPair(12, 1.1, 1); legPair(25, 3.4, 1);
          c.fillStyle = ramp(c, MAT.ceramic, -20, -22, 24, 12);
          rr(c, -26, -20, 52, 30, 9); c.fill();
          occl(c, 0, 10, 26, 7, 0.45);
          c.fillStyle = ramp(c, MAT.bronze, -26, -6, 26, 2);
          c.fillRect(-26, -6, 52, 5);
          c.fillStyle = ramp(c, MAT.ceramic, -14, -30, 16, -14, 0.95);
          rr(c, -16, -30, 32, 14, 5); c.fill();
          occl(c, 0, -16, 18, 4, 0.4);
          wear(c, [[-22, -14, 4], [17, 2, 3], [-6, -26, 3]]);
          c.strokeStyle = 'rgba(40,44,50,0.45)'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(-20, -12); c.lineTo(20, -12); c.stroke();
          stacks(8);
          c.save(); c.translate(-30, 2); c.rotate(this.st === 'bore' ? 0.5 : -0.06);
          c.fillStyle = ramp(c, MAT.bronze, -6, -9, 6, 9);
          c.beginPath(); c.moveTo(-22, 0); c.lineTo(4, -9); c.lineTo(4, 9); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(28,20,10,0.6)'; c.lineWidth = 1.2;
          for (let i = 0; i < 4; i++) {
            const o = ((drill + i * 5.5) % 22) - 22;
            c.beginPath(); c.moveTo(o, -7.5); c.lineTo(o + 8, 7.5); c.stroke();
          }
          c.fillStyle = ramp(c, MAT.steel, 2, -10, 10, 10);
          rr(c, 2, -10, 9, 20, 3); c.fill();
          c.restore();
          occl(c, -24, 4, 9, 5, 0.5);
          drawSensor(c, -13, -12, 5, st8, tt);
          if (p2 || this.overdriveT > 0) { c.save(); c.translate(14, -26); tendrils(c, 5, 26, tt, 1.2, 0.75); c.restore(); }
        }
        break;
      }
      case 'brood': {
        // BROODMOTHER NODE — a coolant regulator for the network's arteries that
        // started incubating instead. Ceramic pressure vessel, bronze manifolds,
        // cyan coolant behind glass, and half-formed mimics in pods beneath it.
        const tt = this.anim, p2 = this.phase === 2;
        const st8 = sensorState(this);
        const puls = 1 + Math.sin(tt * 3) * 0.04;
        // the feed cable it still hangs from
        c.strokeStyle = MAT.steel.dark; c.lineWidth = 6;
        c.beginPath(); c.moveTo(0, -this.h / 2); c.lineTo(0, -cy); c.stroke();
        c.strokeStyle = MAT.bronze.dark; c.lineWidth = 2.2;
        c.beginPath(); c.moveTo(-2, -this.h / 2); c.lineTo(-2, -cy); c.stroke();
        c.save();
        c.rotate(this.faceVis * -0.07);           // swings on its cable toward you
        c.scale(puls, puls);
        // bronze manifold collar at the top, with outlet stubs
        c.fillStyle = ramp(c, MAT.bronze, -22, -30, 22, -20);
        rr(c, -22, -30, 44, 11, 3); c.fill();
        for (const mx of [-26, -18, 18, 26]) {
          c.fillStyle = ramp(c, MAT.bronze, mx - 3, -28, mx + 3, -20);
          c.fillRect(mx - 3, -28, 6, 9);
        }
        occl(c, 0, -19, 22, 4, 0.5);
        // the ceramic vessel
        c.fillStyle = ramp(c, MAT.ceramic, -20, -22, 22, 16);
        c.beginPath();
        c.moveTo(-24, -20); c.lineTo(24, -20);
        c.bezierCurveTo(30, 0, 24, 16, 14, 20);
        c.lineTo(-14, 20);
        c.bezierCurveTo(-24, 16, -30, 0, -24, -20);
        c.closePath(); c.fill();
        wear(c, [[-20, -8, 5], [17, 4, 4], [-6, 14, 3]]);
        // coolant window: cyan fluid with a moving level line
        c.save();
        c.fillStyle = MAT.cyan.deep;
        rr(c, -13, -13, 26, 24, 4); c.fill();
        const lvl = -6 + Math.sin(tt * 1.6) * 2.4;
        const cg2 = c.createLinearGradient(0, lvl, 0, 11);
        cg2.addColorStop(0, MAT.cyan.lit); cg2.addColorStop(1, MAT.cyan.dark);
        c.globalAlpha = 0.85; c.shadowColor = MAT.cyan.mid; c.shadowBlur = 10;
        c.fillStyle = cg2; rr(c, -12, lvl, 24, 11 - lvl, 3); c.fill();
        c.shadowBlur = 0; c.globalAlpha = 1;
        c.strokeStyle = 'rgba(240,251,255,0.5)'; c.lineWidth = 1;
        rr(c, -13, -13, 26, 24, 4); c.stroke();
        c.restore();
        occl(c, 0, -13, 13, 3, 0.4);
        // incubation pods hanging underneath, each with a half-formed mimic
        for (const [bx, bp] of [[-16, 0], [0, 1.7], [16, 3.4]]) {
          const sw = Math.sin(tt * 1.3 + bp) * 0.10;
          c.save(); c.translate(bx, 19); c.rotate(sw);
          c.strokeStyle = MAT.steel.mid; c.lineWidth = 1.4;
          c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 5); c.stroke();
          c.save(); c.globalAlpha = 0.6;
          c.fillStyle = ramp(c, MAT.frost, -7, 5, 7, 22);
          c.beginPath(); c.ellipse(0, 13, 7, 9, 0, 0, 7); c.fill();
          c.restore();
          // the thing inside, not finished
          c.fillStyle = p2 ? MAT.crimson.dark : MAT.steel.dark;
          c.beginPath(); c.ellipse(0, 14, 3.4, 4.4, sw, 0, 7); c.fill();
          c.fillStyle = p2 ? MAT.crimson.mid : MAT.cyan.dark;
          c.beginPath(); c.arc(-1.1, 12.6, 1.1, 0, 7); c.fill();
          c.strokeStyle = 'rgba(240,251,255,0.45)'; c.lineWidth = 0.8;
          c.beginPath(); c.ellipse(0, 13, 7, 9, 0, 0, 7); c.stroke();
          c.restore();
        }
        // coolant dripping from the hem
        for (let i = 0; i < 3; i++) {
          const dy = ((tt * 34 + i * 17) % 26);
          c.globalAlpha = 1 - dy / 26;
          c.fillStyle = MAT.cyan.mid;
          c.beginPath(); c.ellipse(-9 + i * 9, 20 + dy, 1.2, 2.2, 0, 0, 7); c.fill();
        }
        c.globalAlpha = 1;
        drawSensor(c, 0, -24, 5, st8, tt);
        c.restore();
        if (p2 || this.overdriveT > 0) {
          c.save(); c.translate(-20, 6); tendrils(c, 4, 22, tt, 0.9, 0.7); c.restore();
          c.save(); c.translate(20, 6); tendrils(c, 4, 22, tt, 3.4, 0.7); c.restore();
        }
        break;
      }
      case 'atlas': {
        // FURNACE CHOIR — a smelting array that sings. A bronze ring frame of
        // ceramic bells around an open furnace core, molten metal in the slot.
        const tt = this.anim;
        const singing = this.st === 'hymn' || !!this.hymn;
        const heat = singing ? 1 : (this.phase === 2 ? 0.7 : 0.45);
        const st8 = sensorState(this);
        c.rotate(this.faceVis * -0.05);           // leans toward its target
        c.fillStyle = ramp(c, MAT.steel, -26, 24, 26, 37);
        c.beginPath(); c.moveTo(-26, 37); c.lineTo(-18, 22); c.lineTo(18, 22); c.lineTo(26, 37); c.closePath(); c.fill();
        occl(c, 0, 36, 26, 5, 0.55);
        for (const px2 of [-13, 13]) {
          c.fillStyle = ramp(c, MAT.bronze, px2 - 3, 4, px2 + 3, 24);
          c.fillRect(px2 - 3, 4, 6, 20);
        }
        // the column is ceramic and stays ceramic: heat lives in the slot only, so
        // the piece keeps a light-mid-dark structure instead of glowing all over
        c.fillStyle = ramp(c, MAT.ceramic, -11, -30, 9, 22, 0.8);
        rr(c, -10, -30, 20, 54, 4); c.fill();
        c.fillStyle = 'rgba(28,26,22,0.5)';                 // shadowed right flank
        rr(c, 3, -29, 7, 52, 3); c.fill();
        c.save();
        c.fillStyle = '#150a04'; c.fillRect(-5.5, -26, 11, 46);   // cold cavity
        const mg = c.createLinearGradient(0, -26, 0, 20);
        mg.addColorStop(0, MAT.molten.mid); mg.addColorStop(0.45, MAT.molten.lit);
        mg.addColorStop(1, MAT.molten.dark);
        c.globalAlpha = 0.5 + heat * 0.35 + Math.sin(tt * 6) * 0.05;
        c.shadowColor = MAT.molten.mid; c.shadowBlur = 8 + heat * 14;
        c.fillStyle = mg; c.fillRect(-3.4, -24, 6.8, 42);
        c.restore(); c.shadowBlur = 0;
        c.strokeStyle = 'rgba(20,14,8,0.7)'; c.lineWidth = 1.4;   // slot lip
        c.strokeRect(-5.5, -26, 11, 46);
        c.fillStyle = ramp(c, MAT.bronze, -11, -4, 11, 3);        // waist band
        c.fillRect(-11, -4, 22, 5);
        occl(c, 0, 1, 11, 3, 0.45);
        wear(c, [[-9, -6, 4], [6, 10, 3]]);
        c.strokeStyle = ramp(c, MAT.bronze, -30, -34, 30, -26); c.lineWidth = 4;
        c.beginPath(); c.ellipse(0, -30, 29, 7, 0, 0, 7); c.stroke();
        c.strokeStyle = MAT.bronze.lit; c.lineWidth = 1.2;
        c.beginPath(); c.ellipse(0, -31, 29, 7, 0, Math.PI, Math.PI * 2); c.stroke();
        for (const [bx, bp] of [[-24, 0], [-13, 1.1], [0, 2.2], [13, 3.3], [24, 4.4]]) {
          const swing = Math.sin(tt * (singing ? 7 : 1.7) + bp) * (singing ? 0.30 : 0.10);
          c.save(); c.translate(bx, -30 + Math.abs(bx) * 0.12); c.rotate(swing);
          c.strokeStyle = MAT.bronze.dark; c.lineWidth = 1.4;
          c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 9); c.stroke();
          for (let k = 2; k < 9; k += 3) { c.fillStyle = MAT.bronze.mid; c.fillRect(-1.2, k, 2.4, 1.6); }
          c.fillStyle = ramp(c, MAT.ceramic, -6, 8, 6, 24, 0.95);
          c.beginPath();
          c.moveTo(-3.5, 9); c.lineTo(3.5, 9);
          c.bezierCurveTo(6.5, 15, 7, 20, 7, 22);
          c.lineTo(-7, 22); c.bezierCurveTo(-7, 20, -6.5, 15, -3.5, 9);
          c.closePath(); c.fill();
          c.fillStyle = ramp(c, MAT.bronze, -7, 21, 7, 25);
          c.fillRect(-7.2, 21.5, 14.4, 2.6);
          c.save(); c.globalAlpha = 0.4 + heat * 0.55;
          c.shadowColor = MAT.molten.mid; c.shadowBlur = 8 + heat * 12;
          c.fillStyle = MAT.molten.mid;
          c.beginPath(); c.ellipse(0, 22.5, 5.4, 1.8, 0, 0, 7); c.fill();
          c.restore(); c.shadowBlur = 0;
          occl(c, 0, 9.5, 5, 2, 0.5);
          c.restore();
        }
        drawSensor(c, 0, -36, 5.5, st8, tt);
        if (this.phase === 2 || this.overdriveT > 0) {
          c.save(); c.translate(-22, -22); tendrils(c, 4, 24, tt, 0.4, 0.7); c.restore();
          c.save(); c.translate(22, -22); tendrils(c, 4, 24, tt, 2.9, 0.7); c.restore();
        }
        break;
      }
      case 'zero': {
        // THE ARCHIVIST — a data librarian: a tapering cloak of ceramic panels
        // and frosted glass, a bronze halo, and jointed arms holding book-racks.
        const tt = this.anim, fl = Math.sin(tt * 2.2) * 3;
        const st8 = sensorState(this);
        const look = -this.faceVis;               // it does not walk; it turns to look
        c.translate(0, fl);
        // the cloak is built from vertical fold panels, each with its own light
        // value, so the form turns instead of reading as one flat cone
        const folds = [-3, -2, -1, 0, 1, 2, 3];
        for (const f of folds) {
          const top = f * 2.6, botL = f * 6.6 - 3.4, botR = f * 6.6 + 3.4;
          // panels facing the light are brighter; the far ones fall away
          const k = clamp(0.95 - Math.abs(f + 0.9) * 0.13, 0.42, 0.95);
          c.fillStyle = ramp(c, MAT.ceramic, top - 4, -14, botR, 29, k);
          c.beginPath();
          c.moveTo(top - 1.6, -14);
          c.bezierCurveTo(top - 2.4, 4, botL + 1.2, 18, botL, 29);
          c.lineTo(botR, 29);
          c.bezierCurveTo(botR - 1.2, 18, top + 2.4, 4, top + 1.6, -14);
          c.closePath(); c.fill();
          // the crease line down each fold
          c.strokeStyle = 'rgba(38,36,32,0.45)'; c.lineWidth = 0.8;
          c.beginPath(); c.moveTo(top + 1.6, -13); c.lineTo(botR, 28); c.stroke();
        }
        // hem: a heavier bronze-weighted edge, and the shadow it throws
        c.fillStyle = ramp(c, MAT.bronze, -22, 25, 22, 30, 0.85);
        c.beginPath(); c.moveTo(-23, 25); c.lineTo(23, 25); c.lineTo(21, 30); c.lineTo(-21, 30); c.closePath(); c.fill();
        occl(c, 0, 29, 22, 4, 0.55);
        c.save(); c.globalAlpha = 0.42;
        c.fillStyle = ramp(c, MAT.frost, -5, -10, 5, 26);
        c.beginPath(); c.moveTo(-4, -12); c.lineTo(4, -12); c.lineTo(8, 27); c.lineTo(-8, 27); c.closePath(); c.fill();
        c.restore();
        c.strokeStyle = 'rgba(60,74,84,0.4)'; c.lineWidth = 0.9;
        for (const sx of [-12, 12]) { c.beginPath(); c.moveTo(sx * 0.5, -8); c.lineTo(sx * 1.5, 26); c.stroke(); }
        for (const [side, ay, ph] of [[-1, -8, 0], [1, -8, 1.6], [-1, 2, 3.1], [1, 2, 4.7]]) {
          const sw = Math.sin(tt * 1.5 + ph) * 2.4;
          const reach = 24 + (side === Math.sign(look) ? 5 : -3);   // reaches toward you
          const ex = side * reach, ey = ay + sw;
          c.strokeStyle = MAT.steel.dark; c.lineWidth = 3.2; c.lineCap = 'round';
          c.beginPath(); c.moveTo(side * 7, ay - 2); c.lineTo(side * 16, ay + 2 + sw * 0.5); c.lineTo(ex, ey); c.stroke();
          c.fillStyle = ramp(c, MAT.bronze, side * 15, ay - 2, side * 17, ay + 4);
          c.beginPath(); c.arc(side * 16, ay + 2 + sw * 0.5, 2.2, 0, 7); c.fill();
          c.save(); c.translate(ex, ey); c.rotate(side * 0.2 + sw * 0.04);
          c.fillStyle = ramp(c, MAT.ceramic, -4, -6, 4, 6, 0.9);
          rr(c, -4.5, -6, 9, 12, 1.5); c.fill();
          c.fillStyle = MAT.bronze.mid; c.fillRect(-4.5, -1, 9, 1.6);
          if (st8 === 'locked' || st8 === 'overdrive') {
            c.fillStyle = MAT.crimson.mid; c.shadowColor = MAT.crimson.mid; c.shadowBlur = 7;
            c.fillRect(-3, -4.5, 6, 1.6); c.shadowBlur = 0;
          }
          c.restore();
          occl(c, ex, ey + 7, 5, 2, 0.4);
        }
        c.fillStyle = ramp(c, MAT.steel, -4, -20, 4, -12);
        c.fillRect(-3.5, -20, 7, 9);
        c.save(); c.translate(look * 2.2, 0); c.rotate(look * 0.09);   // head turn
        c.fillStyle = ramp(c, MAT.ceramic, -8, -30, 8, -18);
        rr(c, -8, -30, 16, 14, 5); c.fill();
        occl(c, 0, -17, 8, 3, 0.45);
        drawSensor(c, 0, -23, 4.6, st8, tt);
        c.restore();
        c.save(); c.translate(look * 1.6, -34);
        c.strokeStyle = ramp(c, MAT.bronze, -16, -4, 16, 4); c.lineWidth = 2.6;
        c.beginPath(); c.ellipse(0, 0, 16, 4.5, Math.sin(tt * 0.5) * 0.16, 0, 7); c.stroke();
        c.strokeStyle = MAT.bronze.lit; c.lineWidth = 1;
        c.beginPath(); c.ellipse(0, -0.8, 16, 4.5, Math.sin(tt * 0.5) * 0.16, Math.PI, Math.PI * 2); c.stroke();
        c.restore();
        if (this.phase === 2 || this.overdriveT > 0) {
          c.save(); c.translate(0, -34); tendrils(c, 6, 22, tt, 1.7, 0.8); c.restore();
        }
        break;
      }
      case 'prism': {
        // PRISM PROWLER — the one machine the network never indexed, so the
        // broadcast never found it. It is NOT infected: it is the only boss whose
        // sensor stays cyan, and the only one with no wear and no tendrils. It is
        // still exactly what it was, and that is the point of it.
        const tt = this.anim;
        const hot = this.st === 'beam' || this.st === 'aim';
        // authored head-on: it turns by swinging its gimbal, never by squashing
        c.rotate(this.faceVis * 0.08);
        // bronze gimbal ring, turning on two axes
        c.strokeStyle = ramp(c, MAT.bronze, -22, -14, 22, 14); c.lineWidth = 2.8;
        c.beginPath(); c.ellipse(0, 0, 21, 13, Math.sin(tt * 0.6) * 0.2, 0, 7); c.stroke();
        c.strokeStyle = MAT.bronze.lit; c.lineWidth = 1;
        c.beginPath(); c.ellipse(0, -1, 21, 13, Math.sin(tt * 0.6) * 0.2, Math.PI, Math.PI * 2); c.stroke();
        c.strokeStyle = ramp(c, MAT.bronze, -6, -16, 6, 16); c.lineWidth = 2.2;
        c.beginPath(); c.ellipse(0, 0, 8, 15, Math.cos(tt * 0.45) * 0.25, 0, 7); c.stroke();
        // ceramic housing shells, clean — no chipping on this one
        for (const sx of [-1, 1]) {
          c.fillStyle = ramp(c, MAT.ceramic, sx * 12 - 6, -11, sx * 12 + 6, 9, 0.95);
          c.beginPath();
          c.moveTo(sx * 9, -10); c.lineTo(sx * 22, -6);
          c.lineTo(sx * 22, 6); c.lineTo(sx * 9, 10);
          c.closePath(); c.fill();
          occl(c, sx * 10, 0, 4, 8, 0.4);
        }
        // the faceted crystal core
        const facets = 7, spin = tt * 0.8;
        c.save();
        for (let i = 0; i < facets; i++) {
          const a0 = spin + i / facets * Math.PI * 2, a1 = spin + (i + 1) / facets * Math.PI * 2;
          const k = 0.45 + 0.55 * Math.abs(Math.cos(a0 + 0.6));
          c.fillStyle = ramp(c, MAT.frost, 0, -10, Math.cos(a0) * 10, 10, k);
          c.beginPath(); c.moveTo(0, 0);
          c.lineTo(Math.cos(a0) * 11, Math.sin(a0) * 9);
          c.lineTo(Math.cos(a1) * 11, Math.sin(a1) * 9);
          c.closePath(); c.fill();
        }
        c.restore();
        // refracted light — a fan of thin cyan rays, brighter while it aims
        c.save(); c.globalCompositeOperation = 'lighter';
        c.globalAlpha = hot ? 0.55 : 0.24;
        for (let i = 0; i < 5; i++) {
          const a = spin * 1.6 + i / 5 * Math.PI * 2;
          c.strokeStyle = MAT.cyan.lit; c.lineWidth = 1.1;
          c.beginPath(); c.moveTo(0, 0);
          c.lineTo(Math.cos(a) * (hot ? 34 : 20), Math.sin(a) * (hot ? 26 : 15));
          c.stroke();
        }
        c.restore(); c.globalAlpha = 1;
        // the eye. Cyan, always — it was never corrected.
        drawSensor(c, 0, 0, 4.6, hot ? 'locked' : 'alert', tt, true);   // clean: never catalogued, never corrected
        break;
      }
      case 'mother': {
        // MOTHER-V — not a machine. The broadcast grew a body out of cable and
        // coolant because it finally wanted hands. So it is the inverse of every
        // other boss: crimson tissue first, with fragments of the ceramic machines
        // it absorbed still stuck in it, half-digested.
        const tt = this.anim, p2 = this.phase === 2;
        // outer cable-flesh: overlapping lobes that breathe
        for (let ring = 3; ring >= 1; ring--) {
          const rr3 = 22 + ring * 12 + Math.sin(tt * 1.2 + ring) * 2.5;
          const g2 = c.createRadialGradient(-rr3 * 0.25, -rr3 * 0.3, 2, 0, 0, rr3);
          g2.addColorStop(0, MAT.crimson.dark);
          g2.addColorStop(0.6, 'rgba(60,10,18,0.92)');
          g2.addColorStop(1, 'rgba(28,6,12,0.5)');
          c.fillStyle = g2;
          c.beginPath();
          for (let i = 0; i <= 16; i++) {
            const a = i / 16 * Math.PI * 2;
            const w2 = rr3 * (1 + Math.sin(a * 3 + tt * 0.8 + ring) * 0.10);
            i ? c.lineTo(Math.cos(a) * w2, Math.sin(a) * w2 * 0.92)
              : c.moveTo(Math.cos(a) * w2, Math.sin(a) * w2 * 0.92);
          }
          c.closePath(); c.fill();
        }
        // absorbed machine parts: ceramic plates and a bronze fitting, embedded
        for (const [ax, ay, ar, aw, ah] of [[-34, -16, -0.5, 15, 9], [30, 10, 0.35, 13, 8], [-14, 34, 0.9, 12, 7], [24, -30, -0.2, 11, 6]]) {
          c.save(); c.translate(ax, ay); c.rotate(ar);
          c.fillStyle = ramp(c, MAT.ceramic, -aw, -ah, aw, ah, 0.62);
          rr(c, -aw, -ah, aw * 2, ah * 2, 2); c.fill();
          c.fillStyle = 'rgba(60,10,18,0.55)';               // tissue creeping over
          rr(c, -aw, ah * 0.2, aw * 2, ah * 0.9, 2); c.fill();
          c.strokeStyle = MAT.bronze.dark; c.lineWidth = 1.2;
          c.beginPath(); c.moveTo(-aw, -ah * 0.3); c.lineTo(aw, -ah * 0.3); c.stroke();
          c.restore();
          occl(c, ax, ay + ah, aw, ah * 0.6, 0.45);
        }
        // cable bundles reaching outward — the hands it wanted
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * Math.PI * 2 + tt * 0.22;
          c.save(); c.rotate(a); c.translate(30, 0);
          tendrils(c, 3, 30 + (p2 ? 14 : 0), tt, i * 1.3, 0.8);
          c.restore();
        }
        // the core: a crimson heart with a ring of extracted sensors round it
        const beat = 1 + Math.sin(tt * 4) * (p2 ? 0.14 : 0.07);
        c.save(); c.scale(beat, beat);
        const cg3 = c.createRadialGradient(-4, -5, 1, 0, 0, 22);
        cg3.addColorStop(0, '#fff0f0'); cg3.addColorStop(0.35, MAT.crimson.mid);
        cg3.addColorStop(1, MAT.crimson.deep);
        c.shadowColor = MAT.crimson.mid; c.shadowBlur = 26;
        c.fillStyle = cg3;
        c.beginPath(); c.arc(0, 0, 20, 0, 7); c.fill();
        c.shadowBlur = 0;
        c.restore();
        // the eyes of the machines it has taken, orbiting it
        for (let i = 0; i < 6; i++) {
          const a = tt * 0.7 + i / 6 * Math.PI * 2;
          const ox = Math.cos(a) * 30, oy = Math.sin(a) * 24;
          drawSensor(c, ox, oy, 2.8, 'locked', tt + i);
        }
        drawSensor(c, 0, 0, 7, 'overdrive', tt);
        break;
      }
    }
    c.restore();
  }
}
