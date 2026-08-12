// CLAWBYTE — player, enemies, bosses, projectiles, pickups
const DIFFS = [
  { cores: 7, edmg: 1, ehp: 0.75, pdmg: 1.25, espd: 1, lives: 0 },
  { cores: 5, edmg: 1, ehp: 1, pdmg: 1, espd: 1, lives: 0 },
  { cores: 5, edmg: 2, ehp: 1.15, pdmg: 1, espd: 1.2, lives: 9 },
];
function DF() { return DIFFS[G.save.diff]; }
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
    for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, ty)) { e.y = (ty + 1) * TILE + 0.01; e.vy = 0; col.u = 1; break; }
  }
  return col;
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
function armBones(c, shX, shY, ex, ey, hx, hy, far) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = far ? 'rgba(32,41,54,0.9)' : 'rgba(38,48,62,0.9)';
  c.lineWidth = far ? 5.2 : 5.8;
  c.beginPath(); c.moveTo(shX, shY); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
  c.strokeStyle = far ? '#6d7a8c' : '#8593a6'; c.lineWidth = far ? 3.6 : 4;
  c.beginPath(); c.moveTo(shX, shY); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
  c.strokeStyle = far ? 'rgba(190,205,224,0.35)' : 'rgba(226,236,250,0.55)';
  c.lineWidth = 1.4;                                          // top-lit edge
  c.beginPath(); c.moveTo(shX, shY - 1); c.lineTo(ex, ey - 1); c.stroke();
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

// ================= PLAYER =================
class Player {
  constructor(x, y) {
    this.x = x; this.y = y; this.w = 24; this.h = 36;
    this.vx = 0; this.vy = 0; this.face = 1; this.faceVis = 1; this.on = false;
    this.cores = 5; this.volts = 33;
    this.coyote = 0; this.jbuf = 0; this.airJumps = 0;
    this.dashT = 0; this.dashCD = 0; this.iT = 0; this.atkCD = 0;
    this.swing = null; this.healT = 0; this.castCD = 0;
    this.dead = false; this.wallSlide = 0; this.trail = [];
    this.lastSafe = { x, y }; this.anim = 0; this.landT = 0;
    this.lean = 0; this.flipT = 0; this.jetT = 0; this.skidT = 0;
    this.combo = 0; this.comboT = 0; this.dashVX = 0; this.dashVY = 0; this.rechargeT = 0;
    this.chargeT = 0; this.chargeTick = 0; this.healTick = 0;
    this.clawT = 0; this.clawCD = 0; this.pounceT = 0;   // FERAL CLAWS (robo-cat)
    this.armCD = 0; this.songT = 0; this.songCD = 0; this.starCD = 0;
    this.downBuf = 0; this.pogoT = 0; this.slowT = 0;   // frost-slow from the Archivist
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
    const held = !!G.bossEntry;
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
        this.vx += dir * acc * dt;
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
          this.vy = -680; this.airJumps--; this.jbuf = 0;
          this.jetT = 0.3; this.flipT = FLIP_DUR; sfx('djump');
          this.takeoffT = this.takeoff0 = 0.12; this.takeoffCoil = 0;
          burst(this.x + this.w / 2, this.y + this.h, 10, '#8ff6ff', 160, 0.35, 500, 3, true);
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
      this.combo = this.comboT > 0 ? (this.combo + 1) % 3 : 0;
      this.comboT = 0.9;
      const ang = Math.atan2(ay, ax);
      // active a touch longer, so a swing that looks like it should connect does
      this.swing = { t: 0.15, ax, ay, ang, combo: this.combo, set: new Set() };
      this.swingVis = { t: 0.24, t0: 0.24, ang, combo: this.combo };
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
    // hold attack to charge the volt-burst
    if (inD('ATK') && this.dashT <= 0) {
      this.chargeT += dt;
      if (this.chargeT > 0.25) {
        this.chargeTick -= dt;
        if (this.chargeTick <= 0) { this.chargeTick = 0.11; sfxChargeTick(Math.min(1, this.chargeT / 0.6)); }
        if (chance(0.55)) addPart(this.x + rnd(-16, 40), this.y + rnd(-12, 48), 0, 0, 0.25,
          this.chargeT >= 0.6 ? '#ffffff' : PAL[G.roomDef.zone].glow, 2.5, -170, true);
        if (this.chargeT >= 0.6 && this.chargeT - dt < 0.6) sfx('chargeReady');
      }
    } else {
      if (this.chargeT >= 0.6) this.releaseCharged();
      this.chargeT = 0;
    }
    if (this.swingVis) { this.swingVis.t -= dt; if (this.swingVis.t <= 0) { this.swingVis = null; this._paw = null; } }
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
                              * (this.clawT > 0 ? 1.45 : 1));   // claws rake deeper
          if (relicHas('lens') && chance(0.1)) {
            dm *= 2;
            burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 10, '#ffffff', 340, 0.4, 100, 4, true);
          }
          dm = dealDmg(e, dm, armEl(), hb.x + hb.w / 2, hb.y + hb.h / 2, true);
          if (!(e instanceof Boss) && e.kind !== 'turret') {
            e.kbT = 0.26;
            e.vx += kx * 310;
            e.vy = Math.min(e.vy, 0) + ky * 220 - 120;
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
  }
  releaseCharged() {
    this.chargeT = 0;
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    sfx('chargedHit');
    cam.shake = 13; G.hitStop = Math.max(G.hitStop, 0.09);
    G.flash = Math.max(G.flash, 0.55);
    G.impact = { t: 0.16, t0: 0.16, x: cx, y: cy };
    G.addRing(cx, cy); G.addRing(cx, cy, 55);
    this.swingVis = { t: 0.32, t0: 0.32, ang: 0, combo: 3 };
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
    const R = down ? 46 : (s.combo === 2 ? 50 : 44);
    const half = down ? 32 : (s.combo === 2 ? 35 : 30);
    const cx = this.x + this.w / 2 + s.ax / n * R;
    const cy = this.y + this.h / 2 + s.ay / n * R;
    return { x: cx - half, y: cy - half, w: half * 2, h: half * 2 };
  }
  hurt(d, fromX) {
    if (this.dead || this.iT > 0) return;
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
    const cr = (this.skidT > 0 ? 0.2 : (this.wallSlide !== 0 ? 0.1 : 0))
             + (run ? sprintK * 0.12 : 0);                          // low, coiled sprint carriage
    if (this.wallSlide !== 0) c.translate(2.5, 0);                  // body pressed INTO the wall
    c.rotate(this.lean + (this.skidT > 0 ? -0.14 : 0) + (this.wallSlide !== 0 ? 0.1 : 0)
             + (run ? sprintK * 0.3 : 0)                            // pitched forward, chasing the ground
             + (this.hurtPoseT > 0 ? -0.3 * (this.hurtPoseT / 0.3) : 0)  // thrown back, off balance
             + (this.idleT > 0.9 ? Math.sin(this.idleT * 0.9) * 0.022 : 0)); // idle weight shift
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
        c.scale((fb < 0 ? -1 : 1) * Math.max(0.33, Math.abs(fb)), 1);
        c.rotate(Math.sin(tb) * 0.05);
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
      const fx = Math.cos(th);
      c.scale((fx < 0 ? -1 : 1) * Math.max(0.33, Math.abs(fx)), 1);
      c.rotate(Math.sin(th) * 0.05);
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
    // body — the CHUBBY ceramic shell (spec §1.1): rounded, bottom-heavy,
    // wider at the hips than the chest. A pear, not a box.
    const by0 = -24 + bob * 0.4;
    const grad = c.createLinearGradient(0, by0 - 2, 0, by0 + 20);
    grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.32, '#f2f1e8');
    grad.addColorStop(0.7, '#bcc5d2'); grad.addColorStop(1, '#77839c');
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
    // ambient occlusion pooling under the round belly
    const ao2 = c.createLinearGradient(0, by0 + 10, 0, by0 + 21);
    ao2.addColorStop(0, 'rgba(60,75,95,0)'); ao2.addColorStop(1, 'rgba(45,58,75,0.5)');
    c.fillStyle = ao2; belly(); c.fill();
    // specular rim along the top-left of the shell
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(-8, by0 + 1.5); c.quadraticCurveTo(-14, by0 + 4, -14.5, by0 + 11); c.stroke();
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
    const hgd = c.createLinearGradient(0, hy - 12, 0, hy + 8);
    hgd.addColorStop(0, '#ffffff'); hgd.addColorStop(0.48, '#f0efe6'); hgd.addColorStop(1, '#96a2b6');
    c.fillStyle = hgd;
    rr(c, -12, hy - 12, 27, 21, 10); c.fill();
    c.strokeStyle = 'rgba(74,86,106,0.9)'; c.lineWidth = 1.2; rr(c, -12, hy - 12, 27, 21, 10); c.stroke();
    // cheek/jaw shadow + top specular
    c.fillStyle = 'rgba(70,88,110,0.26)';
    rr(c, -12, hy + 3, 27, 6, 5); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(-6, hy - 10.4); c.quadraticCurveTo(4, hy - 11.6, 11, hy - 10); c.stroke();
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
      c.fillStyle = '#e8e8ea';
      c.beginPath(); c.moveTo(-11, hy - 8); c.lineTo(-6 + lTx, hy - 22 + eLy); c.lineTo(0, hy - 10); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(4, hy - 10); c.lineTo(10 + rTx, hy - 22 + eLy); c.lineTo(15, hy - 8); c.closePath(); c.fill();
      c.strokeStyle = '#98a1b0'; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(-11, hy - 8); c.lineTo(-6 + lTx, hy - 22 + eLy); c.lineTo(0, hy - 10);
      c.moveTo(4, hy - 10); c.lineTo(10 + rTx, hy - 22 + eLy); c.lineTo(15, hy - 8); c.stroke();
      c.fillStyle = P.glow; c.globalAlpha = 0.75;
      c.beginPath(); c.moveTo(-9, hy - 9.5); c.lineTo(-6.4 + lTx * 0.72, hy - 17 + eLy * 0.72); c.lineTo(-3, hy - 10.5); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(6.4, hy - 10.5); c.lineTo(9.6 + rTx * 0.72, hy - 17 + eLy * 0.72); c.lineTo(12.6, hy - 9.5); c.closePath(); c.fill();
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
    // the visor — a full LED band across the dome, not two pinprick eyes
    c.fillStyle = hero ? '#2a1e10' : '#0a1420'; rr(c, -8, hy - 7, 22, 10, 5); c.fill();
    c.strokeStyle = 'rgba(58,58,74,0.9)'; c.lineWidth = 1; rr(c, -8, hy - 7, 22, 10, 5); c.stroke();
    // eye blocks slide inside the band when she glances around while idle
    const lk = clamp(this.lookX || 0, -2.4, 2.4);
    c.fillStyle = this.healT > 0 ? '#aef7d8' : P.glow;
    c.shadowColor = c.fillStyle; c.shadowBlur = 8;
    c.fillRect(-5 + lk, hy - 4.8, 6.5, 5.6); c.fillRect(5 + lk, hy - 4.8, 6.5, 5.6);
    c.shadowBlur = 0;
    c.fillStyle = 'rgba(160,255,240,0.55)';                // inner highlight line
    c.fillRect(-5 + lk, hy - 4.8, 6.5, 1.4); c.fillRect(5 + lk, hy - 4.8, 6.5, 1.4);
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
      armBones(c, shX, shY, ex, ey, hx, hy, false);
      // THE PAW. It was a circle, which meant it pointed nowhere and could not
      // lead or trail the arm. It is now a pad with three toes, and its wrist
      // rides a softer spring than the arm does — so it drags behind the swing
      // and whips through at the end, the way a real paw follows a foreleg.
      const wr = rigAng(this, 'armW', ang, this.swingVis ? 520 : 160, this.rigDt);
      const spread = this.swingVis ? 1 + Math.sin(clamp(1 - this.swingVis.t / this.swingVis.t0, 0, 1) * Math.PI) * 0.5 : 1;
      armPaw(c, hx, hy, wr, spread, false);
      // the cut is drawn later, in world space, and has to know where this paw
      // finished — otherwise it goes back to guessing from the aim
      if (this.swingVis && swingHand !== 'B')
        this._paw = { x: hx, y: hy, a: ang, dir: swingPose ? swingPose.dir : 1,
                      sgn: Math.sign(this.faceVis == null ? this.face : this.faceVis) || this.face || 1 };
      c.fillStyle = P.glow; c.beginPath(); c.arc(shX, shY, 1.7, 0, 7); c.arc(ex, ey, 1.3, 0, 7); c.fill();
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
      // THE RAKE ITSELF. The claws were always drawn; what was missing was the
      // cut they leave in the air, and that absence is why the attack never
      // read as a hit. It is an authored light effect, composited additively —
      // the sheet is painted on black, so brightness IS the alpha and no
      // cutting is needed. Each beat of the combo escalates the shape, and the
      // finisher is a crossing double-rake.
      if (this.swingVis && !hero && swingHand !== 'B')
        drawRake(c, this, hx, hy, ang, P, swingPose && swingPose.dir);
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
        armBones(c, bsx, bsy, bel.x, bel.y, bhx, bhy, true);
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
        drawRake(c, this, bhx, bhy, ba, P, bp.dir, true);
        if (swingHand === 'B')
          this._paw = { x: bhx, y: bhy, a: ba, dir: bp.dir,
                        sgn: Math.sign(this.faceVis == null ? this.face : this.faceVis) || this.face || 1 };
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
      const ease = p * p * (3 - 2 * p);
      const gcol = PAL[G.roomDef.zone].glow;
      const empowered = this.clawT > 0;
      const divineHit = empowered && typeof isHero === 'function' && isHero();
      const clawed = empowered && !divineHit;
      const col = divineHit ? '#ffd76a' : clawed ? '#b06aff' : (sv.combo === 2 ? '#ffd76a' : gcol);
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
      // THE CUT COMES OFF THE PAW. It used to hang 56px out from the middle of
      // her body, rotated by a fixed offset from the aim — so it sat wherever
      // the aim pointed while the foreleg throwing it swung somewhere else
      // entirely. That mismatch is the whole reason the hand looked like it was
      // not moving with the slash. It is now anchored to the paw that threw it
      // and rotated by that paw's live angle, and it is a THIRD of the length:
      // a cat rakes close in, toward itself, not three body-lengths into the air.
      const pw = this._paw;
      const px3 = pw ? this.x + this.w / 2 + pw.sgn * pw.x
                     : this.x + this.w / 2 + Math.cos(sv.ang) * 40;
      const py3 = pw ? this.y + this.h + pw.y
                     : this.y + this.h / 2 + Math.sin(sv.ang) * 40;
      const pa3 = pw ? Math.atan2(Math.sin(pw.a), pw.sgn * Math.cos(pw.a)) : sv.ang;
      const pd3 = pw ? pw.dir : 1;
      c.translate(px3 + Math.cos(pa3) * 14, py3 + Math.sin(pa3) * 14);
      c.globalCompositeOperation = 'lighter';
      const grow = 0.55 + ease * 0.65;         // the cut extends as it lands
      const drift = (1 - ease) * 0.22;         // slight rotation as it settles
      // the rake materializes a frame AFTER the arm's wind-up — anticipation
      const gate = clamp((p - 0.07) / 0.07, 0, 1);
      const far3 = (typeof hasSkill === 'function' && hasSkill('reach')) || empowered;
      if (sv.combo === 2) {
        // finisher: the X still crosses, but its span is earned — the long
        // version belongs to the Long Rake skill and to the feral claws
        const L = far3 ? 104 : 62;
        c.rotate(pa3 + 0.3 * pd3 + drift * pd3); c.scale(grow, pd3);
        cut(L, L * 0.28, Math.min(1, (1 - p) * 1.7) * gate);
        c.rotate(0.9 * -pd3); c.scale(1, -1);
        cut(L, L * 0.28, Math.min(1, (1 - p) * 1.4) * gate);
      } else {
        // one diagonal rake, leaning the way the paw is actually travelling
        c.rotate(pa3 + 0.35 * pd3 + drift * pd3);
        c.scale(grow, pd3);
        cut(far3 ? 74 : 52, 18, Math.min(1, (1 - p) * 1.7) * gate);
      }
      c.restore();
      c.globalAlpha = 1;
      }
    }
    // charging aura on the blade
    if (this.chargeT > 0.25) {
      const ck = Math.min(1, this.chargeT / 0.6);
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.25 + ck * 0.35 + Math.sin(performance.now() / 90) * 0.12;
      const cg = c.createRadialGradient(this.x + 12, this.y + 14, 4, this.x + 12, this.y + 14, 30 + ck * 22);
      cg.addColorStop(0, ck >= 1 ? '#ffffff' : PAL[G.roomDef.zone].glow);
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = cg;
      c.beginPath(); c.arc(this.x + 12, this.y + 14, 30 + ck * 22, 0, 7); c.fill();
      c.restore(); c.globalAlpha = 1;
    }
    // FIREDASH — combustion-engine exhaust: white-hot core at the feet,
    // conical flame body fading behind, shock diamonds and shine flashes
    if (this.dashT > 0) {
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
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (solidAt(Math.floor(this.x / TILE), Math.floor(this.y / TILE))) {
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
// THE HUSK — what is left standing where NYA-9 fell.
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
const EKIND = {
  crawler: { w: 28, h: 20, hp: 30, spd: 62 },
  flier: { w: 26, h: 22, hp: 24, spd: 120 },
  turret: { w: 28, h: 30, hp: 45, spd: 0 },
  hopper: { w: 26, h: 24, hp: 36, spd: 180 },
  blob: { w: 34, h: 26, hp: 52, spd: 30 },
};
class Enemy {
  constructor(kind, x, y) {
    const k = EKIND[kind];
    this.kind = kind; this.x = x; this.y = y; this.w = k.w; this.h = k.h;
    this.hypnoT = 0; this.stagT = 0; this.faceVis = 1;
    this.hp = Math.round(k.hp * DF().ehp); this.spd = k.spd * DF().espd;
    this.vx = 0; this.vy = 0; this.dir = chance(0.5) ? 1 : -1;
    this.t = rnd(0.5, 2); this.sx = x; this.sy = y; this.hurtT = 0; this.dead = false; this.anim = rnd(0, 9);
    this.kbT = 0; this.tr = [];
  }
  update(dt) {
    this.anim += dt; this.hurtT -= dt;
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
      if (!player.dead && aabb(this, player)) player.hurt(DF().edmg, this.x + this.w / 2);
      return;
    }
    const px = player.x + player.w / 2, py = player.y + player.h / 2;
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    switch (this.kind) {
      case 'crawler': case 'blob': {
        this.vx = this.dir * this.spd * (this.kind === 'blob' ? (0.6 + Math.sin(this.anim * 4) * 0.4) : 1);
        this.vy += 2000 * dt;
        const col = moveEnt(this, dt);
        if (col.l) this.dir = 1; else if (col.r) this.dir = -1;
        else if (col.d && !groundAhead(this, this.dir)) this.dir *= -1;
        break;
      }
      case 'flier': {
        const near = dist2(cx, cy, px, py) < 300 * 300 && !player.dead;
        if (near) {
          const d = Math.hypot(px - cx, py - cy) || 1;
          this.vx += (px - cx) / d * 260 * dt; this.vy += (py - cy) / d * 260 * dt;
          const s = Math.hypot(this.vx, this.vy);
          if (s > this.spd) { this.vx *= this.spd / s; this.vy *= this.spd / s; }
        } else {
          this.vx = lerp(this.vx, Math.sin(this.anim * 1.3) * 40, 0.05);
          this.vy = lerp(this.vy, (this.sy - this.y) * 1.2 + Math.cos(this.anim * 1.7) * 30, 0.05);
        }
        moveEnt(this, dt);
        break;
      }
      case 'turret': {
        // sweep → LOCK (the red light is the tell) → fire
        this.t -= dt;
        if ((this.lockT || 0) > 0) {
          this.lockT -= dt;
          if (this.lockT <= 0) {
            this.t = 2.0 / DF().espd; this.lockT = 0;
            const d = Math.hypot(px - cx, py - cy) || 1;
            G.projs.push(new Proj(cx, cy - 6, (px - cx) / d * 340, (py - cy) / d * 340, false, 1, 6, '#ff5c6c'));
            sfx('shoot');
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
          this.vx = 0; this.t -= dt;
          // it faces its prey while gathering — so the leap goes nose-first
          this.dir = Math.sign(px - cx) || this.dir || 1;
          if (this.t <= 0 && !player.dead && Math.abs(px - cx) < 380) {
            this.t = rnd(1.1, 1.9);
            this.dir = Math.sign(px - cx) || 1;
            this.vy = -560; this.vx = this.dir * this.spd;
            sfx('jump');
          }
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
  die(kx, ky) {
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
    if (this.kind !== 'flier') contactShadow(c, cx, this.y + this.h, this.w * 0.55, 0.38);
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
    // Zone A ground minions are the boss's WHELPS — smaller versions of the
    // virus beast itself, assembled from the same parts rig. CLAWBYTE only:
    // the Odyssey's creatures never fall back onto the machine art, not even
    // for a frame while their own sheets load.
    const heroEn = typeof isHero === 'function' && isHero();
    if (!heroEn && G.roomDef && G.roomDef.zone === 'A' && (this.kind === 'crawler' || this.kind === 'hopper')
        && typeof drawBeastMini === 'function' && drawBeastMini(c, this)) return;
    // every flying minion is a small TALONHOST — talons only, no feathers
    if (!heroEn && this.kind === 'flier' && typeof drawEagleMini === 'function' && drawEagleMini(c, this)) return;
    // Pre-rendered 3D turnaround. Selected by angle, never mirrored, so the baked
    // key light stays on the correct side as the machine turns.
    if (drawAtlas(c, this.kind, this.faceVis, cx, this.y + this.h, this.h, {
          flash: this.hurtT > 0 ? 1 : 0,
          charm: this.hypnoT > 0 ? 1 : 0,
          grounded: this.kind !== 'flier',
          t: this.anim, vx: this.vx, vy: this.vy,
          air: this.kind === 'hopper' ? clamp(Math.abs(this.vy) / 400, 0, 1) : 0,
          mode: { crawler: 'walk', hopper: 'spring', blob: 'pulse', flier: 'hover', turret: 'breathe' }[this.kind] || 'breathe',
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
        // NIKK — a leak-seeker that copied NYA-9's own frame. It is the only
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
        // LOCKED: the red targeting light — your half-second to move
        if ((this.lockT || 0) > 0) {
          c.save(); c.globalAlpha = 0.6 + Math.sin(this.anim * 30) * 0.35;
          c.fillStyle = '#ff3c50'; c.shadowColor = '#ff3c50'; c.shadowBlur = 12;
          c.beginPath(); c.arc(0, -14, 3.2, 0, 7); c.fill();
          c.shadowBlur = 0; c.restore();
        }
        break;
      }
    }
    c.restore();
  }
}

// ---------------------------------------------------------------------------
// THE SCALE LAW (sprite spec, section C: WORLD SCALE / CHARACTER SCALE).
// NYA-9 is the canonical reference. Ordinary minions must read SMALLER than her;
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
    G.dropScrap(cx, cy, irnd(4, 9));
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
function bossFork(b) {
  if (!b || b.forkAsked || b.dead || b.kind === 'mother') return false;
  if (typeof brOffer !== 'function' || typeof G === 'undefined') return false;
  if (typeof player === 'undefined' || !player || player.dead) return false;
  if (typeof isHero === 'function' && isHero()) return false;
  b.forkAsked = true;
  b.hp = 0; b.vx = 0; b.vy = 0; b.stagT = 0;
  brOffer(b.kind === 'glitch' ? 'firstboss' : 'boss');
  G.forkBoss = b;
  return true;
}
const BSTAT = {
  glitch: { w: 84, h: 56, hp: 220 },
  brood: { w: 96, h: 64, hp: 320 },
  atlas: { w: 62, h: 74, hp: 460 },
  zero: { w: 112, h: 62, hp: 500 },   // GLACIERE: a long floating quadruped
  // PRISM is the nimble rival, so it stays the smallest guardian — but a boss
  // still has to stand over NYA-9 (36), and at 34 it stood under her.
  prism: { w: 62, h: 46, hp: 520 },
  mother: { w: 120, h: 120, hp: 750 },
};
// ===========================================================================
// THE RAKE — NYA-9's claw arc, from an authored light sheet.
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
function drawRake(c, pl, hx, hy, ang, P, dir, far) {
  const im = (typeof MEDIA_IMG !== 'undefined') ? MEDIA_IMG.slashFx : null;
  if (!im || !im.naturalWidth) return;
  const sv = pl.swingVis, p = clamp(1 - sv.t / sv.t0, 0, 1);
  if (p < 0.06) return;                       // nothing during the wind-up
  // snaps in, holds a moment, thins away — a cut does not fade evenly
  const a = p < 0.22 ? p / 0.22 : Math.pow(1 - (p - 0.22) / 0.78, 1.5);
  if (a <= 0.02) return;
  const claw = pl.clawT > 0;
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
  const w = r[2] / r[3] * h;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.translate(hx + Math.cos(ang) * h * 0.5, hy + Math.sin(ang) * h * 0.5);
  // LEAN WITH THE TRAVEL, always. The offset used to be picked per combo beat
  // and one of them leaned against its own arc, which is what made the cut look
  // detached from the paw throwing it. One constant, flipped by the direction
  // the arc actually sweeps.
  c.rotate(ang + 0.35 * (dir == null ? 1 : dir));
  // The finisher already has its own authored identity — the golden crossing X
  // drawn below. This sweep sits UNDER it at half strength so the third beat
  // reads as one heavier blow rather than two effects arguing.
  c.globalAlpha = a * (claw ? 0.95 : 0.8) * (sv.combo === 2 ? 0.5 : 1) * (far ? 0.8 : 1);
  c.drawImage(im, r[0], r[1], r[2], r[3], -w * 0.42, -h / 2, w, h);
  // the strike flash: one bright burst on the frame the hitbox is live
  if (p > 0.18 && p < 0.42 && sv.combo !== 2) {
    const b = RAKE.burstS;
    const bh = (sv.combo === 2 ? 22 : 15) * (claw ? 1.3 : 1);
    const bw = b[2] / b[3] * bh;
    c.globalAlpha = (1 - Math.abs(p - 0.3) / 0.12) * 0.85;
    c.drawImage(im, b[0], b[1], b[2], b[3], w * 0.18 - bw / 2, -bh / 2, bw, bh);
  }
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
              atlas: 'roar_drg', prism: 'roar_prism' }[this.kind] || 'roar');
        cam.shake = Math.max(cam.shake, 11);
        this.roarBuzzT = 0.8;
        if (typeof padRumble === 'function') padRumble(0.9, 0.7, 650);
        if (typeof roarWave === 'function')
          roarWave(this.cx(), this.cy() - this.h * 0.35,
            { glitch: '#b48cff', brood: '#ff5f6d', zero: '#a5d8ff',
              atlas: '#ffd76a', prism: '#37ffd0' }[this.kind] || '#e05aff');
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
      this.phase = 2; this.t = 1;
      burst(this.cx(), this.cy(), 30, '#ffffff', 320, 0.7, 200, 4, true);
      cam.shake = 12; sfx('phase');
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
        const dist = px - this.cx(), adist = Math.abs(dist);
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
          } else if (adist < 130) { this.st = 'swipewarn'; this.t = 0.32; this.vx = 0; }
          else if (this.roarCD <= 0) { this.st = 'roar'; this.t = 1.25; this.vx = 0; this.roared = false; this.roarCD = rnd(5.5, 7); }
          else if (this.t <= 0 && adist > 170 && adist < 470) { this.st = 'crouch'; this.t = 0.45; this.vx = 0; }
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
            if (!player.dead && player.iT <= 0 && aabb(box, player)) player.hurt(DF().edmg, this.cx());
          }
          if (this.t <= 0) {
            // a lion swipes twice when it is angry
            if (this.phase === 2 && chance(0.5)) { this.st = 'swipewarn'; this.t = 0.22; }
            else { this.st = 'idle'; this.t = rnd(0.5, 0.9); }
          }
        } else if (this.st === 'crouch') {
          // flat to the ground, trembling with intent — then the pounce
          this.vx = 0; this.t -= dt; this.windT = 0.3;
          if (this.t <= 0) {
            this.st = 'pounce';
            this.face = Math.sign(dist) || 1;
            this.vx = clamp(dist * 1.6, -640, 640) * (this.phase === 2 ? 1.15 : 1) * spd;
            this.vy = -(420 + Math.min(260, adist * 0.5));
            sfx('dash');
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
            this.st = 'perch'; this.t = this.phase === 2 ? 1.0 : 1.4;
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
          if (this.t <= 0.45) this.windT = 0.3;
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
            if (!player.dead && player.iT <= 0 && aabb(box, player)) player.hurt(DF().edmg, this.cx());
            if (this.phase === 2 && typeof G.addRing === 'function') G.addRing(this.cx(), this.y + this.h - 8);
          }
        } else if (this.st === 'recover') {
          // a beat of stillness after the landing — your window
          this.vx *= 0.8; this.t -= dt;
          if (this.t <= 0) { this.st = 'idle'; this.t = rnd(0.4, 0.7); }
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
          if (!player.dead && player.iT <= 0 && aabb(box, player)) player.hurt(DF().edmg, this.cx());
          if (this.nullSeq > 0) {
            this.nullSeq--;
            if (this.nullSeq > 0) { this.st = 'nullhop'; this.t = 0.16; }
            else { this.st = 'nullend'; this.t = 1.15; }
          } else {
            this.st = 'recover'; this.t = this.phase === 2 ? 0.32 : 0.42;
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
          this.x = lerp(this.x, this.spawnX, dt * 2);
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
            if (which === 3) { this.st = 'rest'; this.t = 1.0; }
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
          if (this.t <= 0) { this.st = 'idle'; this.t = this.phase === 2 ? 1.2 : 1.8; }
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
            this.st = 'idle'; this.t = this.phase === 2 ? 1.1 : 1.6; this.vx = 0; this.vy = 0;
          }
        } else if (this.st === 'rest') {
          // wings burn out: it descends into claw range
          this.y = lerp(this.y, 12.4 * TILE, dt * 2.8);
          this.x += Math.sin(this.anim * 2.2) * 22 * dt;
          this.t -= dt;
          if (this.t <= 0 && this.y > 11.6 * TILE) { this.st = 'restlow'; this.t = this.phase === 2 ? 2.0 : 2.9; }
        } else if (this.st === 'restlow') {
          this.y += Math.sin(this.anim * 3) * 8 * dt;
          this.t -= dt;
          if (this.t <= 0) { this.st = 'rise'; this.t = 1.2; }
        } else if (this.st === 'rise') {
          this.t -= dt; this.y = lerp(this.y, this.homeY, 0.06);
          if (this.t <= 0) {
            this.st = 'idle'; this.t = 1.3;
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
            this.st = 'idle'; this.t = 1.5;
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
            this.st = 'forgebell'; this.t = 1.35; this.vx = 0;
            this.fbCD = rnd(11, 15); this.fbStruck = 0;
          } else if (Math.abs(px - this.cx()) < 100 && this.t < 2) { this.st = 'slamwarn'; this.t = 0.55; this.vx = 0; }
          else if (this.t <= 0) {
            if (this.cycle++ % 3 === 2) {
              this.st = 'hymn'; this.t = 1.0;
              this.roarBuzzT = 0.7;
              if (typeof padRumble === 'function') padRumble(0.7, 0.6, 550);
              if (typeof roarWave === 'function')
                roarWave(this.cx() + this.face * 34, this.y - this.h * 0.6, '#ffd76a');
            }
            else {
              this.t = this.phase === 2 ? 2.2 : 3.2;
              const d = px - this.cx();
              this.shoot(clamp(d * 1.1, -300, 300), -460, 8, 900); sfx('shoot');
            }
          }
        } else if (this.st === 'forgebell') {
          // each strike rings out a spark shower, then the sky answers with
          // embedded white-hot weapons — break them before they burst
          this.vx = 0; this.t -= dt; this.windT = 0.3;
          const due = Math.floor((1.35 - this.t) / 0.3);
          while (this.fbStruck < Math.min(3, due)) {
            this.fbStruck++;
            cam.shake = 6; sfx('bosshit');
            burst(this.cx(), this.cy() - 10, 12, MAT.molten.mid, 260, 0.45, 200, 3, true);
            const wx = clamp(px + rnd(-110, 110), 60, G.roomDef.w * TILE - 60);
            this.forge = this.forge || [];
            this.forge.push({ x: wx, y: -30, vy: 0, landed: false, t: 3, kind: this.fbStruck % 3 });
          }
          if (this.t <= 0) { this.st = 'idle'; this.t = this.phase === 2 ? 1.6 : 2.4; }
        } else if (this.st === 'meltwarn') {
          // the tell: the bell whitens, steam screams from every joint
          this.vx = 0; this.t -= dt; this.windT = 0.4;
          this.whiteHot = Math.min(1, (this.whiteHot || 0) + dt * 1.2);
          if (chance(0.9)) addPart(this.cx() + rnd(-40, 40), this.y + rnd(0, this.h),
            rnd(-30, 30), rnd(-140, -60), 0.5, '#fff2dd', 2.5, 0, true);
          if (this.t <= 0) {
            this.st = 'idle'; this.t = 2.0;
            this.slag = { t: 0, life: 6.5, h: 0 };
            cam.shake = 9; sfx('roar');
          }
        } else if (this.st === 'hymn') {
          // the bells wind up, then ring: expanding rings of heat
          this.vx = 0; this.t -= dt; this.windT = 0.4;
          if (this.t <= 0) {
            this.hymn = { r: 10, t: 0, n: this.phase === 2 ? 3 : 2 };
            sfx('roar'); cam.shake = 7;
            this.st = 'idle'; this.t = this.phase === 2 ? 2.0 : 3.0;
          }
        } else if (this.st === 'slamwarn') {
          this.vx = 0; this.t -= dt;
          if (this.t <= 0) {
            this.st = 'idle'; this.t = 3;
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
        if (this.st === 'idle') {
          // the float: glide toward a point flanking the prey
          const tx2 = clamp(px + (this.cx() < px ? -190 : 190), 70, gW - 70);
          this.x = lerp(this.x, tx2 - this.w / 2, dt * 1.1);
          this.y = lerp(this.y, hovY, dt * 1.4);
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
            else {
              // an information prison: a cage of frozen void around you
              this.prison = { x: px, y: py, t: 0, life: this.phase === 2 ? 3.4 : 2.6, held: 0 };
              sfx('cast'); this.windT = 0.5; this.t = 2.2;
            }
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
            this.st = 'idle'; this.t = this.phase === 2 ? 1.5 : 2.1;
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
            sfx('shoot'); this.st = 'idle'; this.t = this.phase === 2 ? 1.4 : 2.0;
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
          if (this.t <= 0) { this.st = 'idle'; this.t = 0.9; }
        } else if (this.st === 'novawarn') {
          this.t -= dt; this.vx = 0; this.vy = 0;
          if (this.t <= 0) {
            this.nova = { r: 24 };
            burst(this.cx(), this.cy(), 26, '#e0f7fa', 380, 0.6, 0, 3.5, true);
            cam.shake = 7; sfx('break'); G.flash = Math.max(G.flash, 0.18);
            this.st = 'idle'; this.t = 1.6;
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
            this.st = 'idle'; this.t = 2.0;
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
            this.st = 'idle'; this.t = 2.0;
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
            this.st = 'idle'; this.t = 1.8;
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
          this.vx = 0; this.t -= dt;
          this.face = Math.sign(px - this.cx()) || 1;
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
            if (pick === 0) { this.st = 'dashslash'; this.t = 0.42; this.vx = this.face * 720 * spd; }
            else if (pick === 1) { this.st = 'pounce'; this.vy = -600; this.vx = this.face * 380 * spd; }
            else {
              this.vy = -480;
              for (let k = -1; k <= 1; k++) {
                const a = Math.atan2(py - this.cy(), px - this.cx()) + k * 0.3;
                this.shoot(Math.cos(a) * 300, Math.sin(a) * 300, 6);
              }
              this.st = 'rest'; this.t = this.phase === 2 ? 0.6 : 0.95;
            }
          }
        } else if (this.st === 'dashslash') {
          this.t -= dt;
          this.trailT = (this.trailT || 0) - dt;
          if (this.trailT <= 0) { this.trailT = 0.03; addPart(this.cx(), this.cy(), 0, 0, 0.3, PAL.X.glow, 5, 0, true); }
          if (this.t <= 0) { this.st = 'rest'; this.t = this.phase === 2 ? 0.5 : 0.85; this.vx = 0; }
        } else if (this.st === 'pounce') {
          if (this.vy > 0 && this.y + this.h > 14 * TILE) { this.st = 'rest'; this.t = 0.7; this.vx = 0; cam.shake = 6; }
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
            this.st = 'rest'; this.t = 1.9;
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
        if (this.st === 'dashslash' && (col.l || col.r)) { this.st = 'rest'; this.t = 0.8; }
        break;
      }
      // ---- MOTHER-V: the Null Core ----
      case 'mother': {
        this.y = 110 + Math.sin(this.anim * 1.1) * 16;
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
            this.st = 'idle'; this.t = 2.2; this.lash = null;
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
        } else if (this.t <= 0) {
          const p2 = this.phase === 2;
          this.t = (p2 ? 1.7 : 2.4) * (1 - (this.mPhase || 0) * 0.08);
          if (this.msCD <= 0 && (this.mPhase || 0) >= 1) {
            this.msCD = rnd(18, 24);
            this.st = 'msong'; this.nwT = 1.6; sfx('cast');
          } else {
            const which = this.cycle++ % 4;
            if (which === 0 && !this.nwave) { this.st = 'nwcharge'; this.nwT = 1.1; sfx('no'); }
            else if (which === 1) this.ring((p2 ? 14 : 10) + (this.mPhase || 0) * 2, 230 * spd, this.anim);
            else if (which === 2 && (this.mPhase || 0) >= 2) { this.st = 'grabwarn'; this.nwT = 0.5; sfx('cast'); }
            else if (which === 2 && G.enemies.filter(e => !e.dead).length < 2) {
              const b = new Enemy('blob', this.cx() - 17, this.y + this.h);
              G.enemies.push(b);
              burst(this.cx(), this.y + this.h, 12, PAL.E.glow, 200, 0.5, 300, 3, true);
            } else {
              const horiz = p2 ? chance(0.5) : true;
              this.beam = horiz
                ? { x: 0, y: py - 34, w: G.roomDef.w * TILE, h: 68, t: 0.8, warn: true }
                : { x: px - 34, y: 0, w: 68, h: G.roomDef.h * TILE, t: 0.8, warn: true };
              sfx('cast');
            }
          }
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
    if (this.dead && !heroWorld && !BOSS_ART[this.kind] && this.kind !== 'mother') return;
    const P = PAL[G.roomDef.zone];
    // The intro used to fade the boss up from nothing, which made sense when it
    // arrived out of empty air. Now every guardian is already lying there in a
    // dormant pose, so a fade from zero blinked it out of existence on the exact
    // frame it woke. It stays solid; the rise and the roar carry the moment.
    let a = 1;
    if (this.purified && (this.pureT || 0) < 0.7) a *= clamp((this.pureT || 0) / 0.7 + 0.15, 0.15, 1);
    c.save(); c.globalAlpha = a * (this.hurtT > 0 ? 0.6 : 1);
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
      } else if (!(typeof drawBeast === 'function' && drawBeast(c, this))) drawDriller(c, this);
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
