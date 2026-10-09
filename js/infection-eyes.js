// ===========================================================================
// THE INFECTION'S EYES.
//
// Every hostile machine carries the virus, and the virus looks out through its
// eyes: red in the rank and file, purple in the guardians and the Alpha. A lit
// eye that MOVES leaves a thread of smoke behind it the way a burning incense
// stick does when it is carried — a bright narrow line at the tip, then soft
// wisps that curl, rise a little and thin out to nothing.
//
// The three things that make that read instead of looking like a particle
// spray are also the three rules this file is built on:
//
//   1. THE EYE IS WHERE THE ART PUTS IT, THIS FRAME. Renderers report the eye
//      as they draw it (infEyeMark for a procedural eye, infEyeArt for an eye
//      baked into a plate, strip cell or atlas cell — looked up in EYE_MAP,
//      which tools/eyemap.cjs measures from the art itself). The point goes
//      through the canvas's own transform, so a mirrored, crouched, leaping or
//      rotated body reports the eye where it actually is. Nothing is ever
//      emitted from a body centre or a guessed forehead.
//   2. THE SMOKE LIVES IN THE WORLD. Particles are stored in world coordinates
//      and the camera is undone with the transform captured when the world
//      layer starts (infEyeWorldBegin). A camera pan moves the smoke with the
//      room, never draws a trail of its own.
//   3. THE SIM CLOCK OWNS IT. Particles are born and aged in infEyeUpdate,
//      which runs inside the fixed-step update — a paused game advances
//      nothing, and the trail is the same at any frame rate.
//
// Restraint is a requirement, not a taste: wisps are thin and translucent, the
// count is bounded by the quality tier, there is no full-screen pass, and the
// player's reduced-motion preference keeps the glowing eye but drops the smoke.
// ===========================================================================

// the two infections. `core` is the hot line at the tip, `wisp` the smoke.
const INF_EYE_COL = {
  red:    { core: [255, 120, 104], wisp: [232, 44, 52],  glow: [255, 58, 52] },
  purple: { core: [232, 168, 255], wisp: [150, 70, 255], glow: [186, 92, 255] },
};
// particle budget per quality tier — a phone on 'low' carries the threads of
// four or five moving machines and no more
const INF_EYE_CAP = { low: 90, mid: 170, high: 260, ultra: 320 };
const INF_EYE_LIFE = 1.5;          // seconds a wisp lives (each gets ±25%)
const INF_EYE_SPACING = 2.2;       // px of eye travel per particle at the tip
const INF_EYE_HOLD = 0.1;          // s: a body counts as travelling this long after it last moved
const INF_EYE_MIN_V = 10;          // px/s: below this the eye is standing still and emits nothing
const INF_EYE_JUMP = 90;           // px in one step = a teleport, not a motion

// The pool: structure-of-arrays, allocated once, recycled forever.
const INF_N = 320;
const INF_X = new Float32Array(INF_N), INF_Y = new Float32Array(INF_N), INF_Y0 = new Float32Array(INF_N);
const INF_VX = new Float32Array(INF_N), INF_VY = new Float32Array(INF_N);
const INF_AGE = new Float32Array(INF_N), INF_LIFE = new Float32Array(INF_N);
const INF_PH = new Float32Array(INF_N), INF_SZ = new Float32Array(INF_N);
const INF_PURP = new Uint8Array(INF_N);
const INF_OWN = new Array(INF_N).fill(null);
let INF_LIVE = 0;                  // particles 0..INF_LIVE-1 are alive (packed)

// The world transform: device pixels -> world, refreshed every frame the world
// is drawn. Until it is set, marks are ignored (a renderer drawing into a
// scratch canvas or a menu has no world to report into).
let INF_S2W = null;
let INF_DRAWN = 0;                 // frame counter: which draw an anchor belongs to
let INF_CUR = null;                // the body currently being drawn
let INF_CUR_CLASS = null;
const INF_OWNERS = new Set();      // bodies that reported eyes recently
let INF_RM = null;                 // reduced-motion media query, read lazily

function infEyeReduced() {
  if (INF_RM === null) {
    try { INF_RM = matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) { INF_RM = false; }
  }
  return !!(INF_RM && INF_RM.matches) || !!(typeof G !== 'undefined' && G.save && G.save.opts && G.save.opts.reduceMotion);
}
function infEyeCap() {
  const q = (typeof QUAL !== 'undefined' && QUAL && QUAL.name) || 'high';
  return Math.min(INF_N, INF_EYE_CAP[q] || 220);
}

// WHO IS INFECTED, AND WITH WHICH COLOUR. null = not infected now: dead,
// purified, tamed, calmed, friendly, or held by the Song for the moment. The
// guardians, the Alpha and the sage duelist carry the purple; everything else
// the red.
function infEyeClass(e) {
  if (!e || e.dead || e.removed) return null;
  if (e.purified || e.tame || e.calm || e.friendly || e.rescued || e.yielded || e.disabled) return null;
  if ((e.pureM || 0) >= 1) return null;
  if ((e.hypnoT || 0) > 0) return null;
  if (e.kind === 'alpha' || e.isAlpha) return (typeof alphaFreed === 'function' && alphaFreed()) ? null : 'purple';
  // a tamed pack is every wolf, not one
  if (typeof isWolf === 'function' && (isWolf(e) || (typeof isCheetah === 'function' && isCheetah(e)))
      && typeof packTamed === 'function' && packTamed() && !(typeof isCheetah === 'function' && isCheetah(e))) return null;
  const boss = (typeof Boss !== 'undefined' && e instanceof Boss) || e.miniboss || e.kind === 'sage';
  return boss ? 'purple' : 'red';
}

// ---- the renderer side ----------------------------------------------------
// Called by the world renderer once per frame, at the point where the canvas
// transform maps WORLD coordinates to device pixels (camera, zoom and shake
// already applied). Everything drawn after it can report eyes.
function infEyeWorldBegin(c) {
  INF_DRAWN++;
  try {
    const m = c.getTransform();
    const det = m.a * m.d - m.b * m.c;
    if (!det) { INF_S2W = null; return; }
    // the inverse of [a c e; b d f], kept as six numbers — no DOMMatrix per mark
    INF_S2W = { a: m.d / det, b: -m.b / det, c: -m.c / det, d: m.a / det,
                e: (m.c * m.f - m.d * m.e) / det, f: (m.b * m.e - m.a * m.f) / det };
  } catch (er) { INF_S2W = null; }
}
// Enemy.draw / Boss.draw bracket their body with these, so the shared art
// helpers (strips, plates, atlases) know whose eyes they are drawing.
function infEyeBodyBegin(e) {
  INF_CUR = e; INF_CUR_CLASS = infEyeClass(e);
  if (e && e._eyeDraw !== INF_DRAWN) { e._eyeDraw = INF_DRAWN; e._eyeN = 0; }
}
function infEyeBodyEnd() { INF_CUR = null; INF_CUR_CLASS = null; }

// A procedural eye at local (lx, ly) in the CURRENT canvas transform.
function infEyeMark(c, lx, ly, e) {
  const who = e || INF_CUR;
  if (!who || !INF_S2W) return;
  const cls = e ? infEyeClass(e) : INF_CUR_CLASS;
  if (!cls) return;
  if (who._eyeDraw !== INF_DRAWN) { who._eyeDraw = INF_DRAWN; who._eyeN = 0; }
  if ((who._eyeN || 0) >= 2) return;                 // two eyes is all any machine gets
  const m = c.getTransform();
  const dx = m.a * lx + m.c * ly + m.e, dy = m.b * lx + m.d * ly + m.f;
  const S = INF_S2W;
  const wx = S.a * dx + S.c * dy + S.e, wy = S.b * dx + S.d * dy + S.f;
  if (!who._eyeW) who._eyeW = [0, 0, 0, 0];
  const i = who._eyeN * 2;
  infEyeLay(who, who._eyeN, wx, wy);
  who._eyeW[i] = wx; who._eyeW[i + 1] = wy;
  who._eyeN++;
  who._eyeCls = cls;
  // the on-screen scale of this body, so the glow is the size of ITS eye
  who._eyeS = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * Math.sqrt(Math.abs(S.a * S.d - S.b * S.c));
  INF_OWNERS.add(who);
}
// THE SMOKE IS LAID WHERE THE EYE IS DRAWN. Called for each eye as the art
// reports it: wisps go down along the eye's own path since its last draw,
// the newest exactly at the eye in this frame, each already aged by how long
// ago (in sim time) the eye passed that point.
function infEyeLay(e, k, x, y) {
  const P = e._eyeP;
  if (!P || k > 1) return;
  // IT TURNED ROUND: the eye is on the other side of the head now. Joining the
  // old side to the new would lay a streak of smoke across the face, so the
  // trail starts again from here.
  const face = Math.sign((e.faceVis != null ? e.faceVis : e.dir) || 0);
  if (face !== P.face) { P.face = face; P.ok[0] = P.ok[1] = false; P.owe[0] = P.owe[1] = 0; }
  const T = P.acc[k]; P.acc[k] = 0;
  if (!P.ok[k]) { P.x[k] = x; P.y[k] = y; P.ok[k] = true; P.owe[k] = 0; return; }
  const px = P.x[k], py = P.y[k], d = Math.hypot(x - px, y - py);
  P.x[k] = x; P.y[k] = y;
  if (d > INF_EYE_JUMP) { infEyeKillOwner(e); P.owe[k] = 0; return; }   // teleported
  // owed by TRAVEL only: a body that stops lets its plume rise and thin away
  // and keeps just the glow — breathing, idle sway and a head tossed in place
  // leave nothing behind
  if (!(T > 0)) { P.owe[k] = 0; return; }
  let owe = P.owe[k] + d / INF_EYE_SPACING;
  const cnt = Math.min(12, Math.floor(owe));
  owe -= cnt; P.owe[k] = owe;
  for (let j = 0; j < cnt; j++) {
    const t = (j + 1) / cnt;
    infEyeSpawn(e, px + (x - px) * t, py + (y - py) * t, P.purple, (1 - t) * T);
  }
}
// An eye baked into art: `key` names the image in EYE_MAP, `cell` its cell
// (0 for a single plate), and (dx, dy, dw, dh) the rectangle the cell was just
// drawn into, in the current transform. For an atlas, `cell` is row*cols+col.
function infEyeArt(c, key, cell, dx, dy, dw, dh) {
  if (!INF_CUR || !INF_CUR_CLASS || !INF_S2W || typeof EYE_MAP === 'undefined') return;
  const M = EYE_MAP[key];
  if (!M) return;
  const pts = M.e[cell | 0];
  if (!pts) return;
  for (let i = 0; i + 1 < pts.length; i += 2)
    infEyeMark(c, dx + pts[i] * dw, dy + pts[i + 1] * dh);
}

// ---- the simulation side -----------------------------------------------------
function infEyeSpawn(owner, x, y, purple, young) {
  const cap = infEyeCap();
  let i;
  if (INF_LIVE < cap) i = INF_LIVE++;
  else {                                              // full: recycle the oldest
    i = 0; let best = -1;
    for (let k = 0; k < INF_LIVE; k++) { const a = INF_AGE[k] / INF_LIFE[k]; if (a > best) { best = a; i = k; } }
  }
  INF_X[i] = x; INF_Y[i] = y; INF_Y0[i] = y;
  // a thread, not a spray: almost no initial velocity, a slow rise, a curl
  INF_VX[i] = (Math.random() - 0.5) * 6;
  INF_VY[i] = -9 - Math.random() * 8;
  INF_AGE[i] = young || 0;
  INF_LIFE[i] = INF_EYE_LIFE * (0.75 + Math.random() * 0.5);
  INF_PH[i] = Math.random() * 6.283;
  INF_SZ[i] = 0.8 + Math.random() * 0.5;
  INF_PURP[i] = purple ? 1 : 0;
  INF_OWN[i] = owner;
}
function infEyeKill(i) {
  const j = --INF_LIVE;                               // swap the last live one in
  if (i !== j) {
    INF_X[i] = INF_X[j]; INF_Y[i] = INF_Y[j]; INF_Y0[i] = INF_Y0[j]; INF_VX[i] = INF_VX[j]; INF_VY[i] = INF_VY[j];
    INF_AGE[i] = INF_AGE[j]; INF_LIFE[i] = INF_LIFE[j]; INF_PH[i] = INF_PH[j]; INF_SZ[i] = INF_SZ[j];
    INF_PURP[i] = INF_PURP[j]; INF_OWN[i] = INF_OWN[j];
  }
  INF_OWN[j] = null;
}
// Drop every wisp a body left — a teleport, a removal. Room changes clear all.
function infEyeKillOwner(e) {
  for (let i = INF_LIVE - 1; i >= 0; i--) if (INF_OWN[i] === e) infEyeKill(i);
}
function infEyeClearOwner(e) {
  infEyeKillOwner(e);
  if (e) { e._eyeP = null; e._eyeN = 0; }
  INF_OWNERS.delete(e);
}
function infEyeClearAll() {
  for (const e of INF_OWNERS) if (e) { e._eyeP = null; e._eyeN = 0; }
  INF_OWNERS.clear();
  for (let i = 0; i < INF_LIVE; i++) INF_OWN[i] = null;
  INF_LIVE = 0;
}
function infEyeAlive(e) {
  if (typeof G === 'undefined') return false;
  if (G.boss === e) return true;
  if (G.enemies && G.enemies.indexOf(e) >= 0) return true;
  return !!(G.extraBodies && G.extraBodies.indexOf(e) >= 0);
}
// One fixed step. Emits from every eye that was drawn in the last frame and is
// still infected, then ages and moves the smoke.
function infEyeUpdate(dt) {
  if (!(dt > 0)) return;
  const smoke = !infEyeReduced();
  for (const e of INF_OWNERS) {
    // removed from the room: its wisps go with it
    if (!infEyeAlive(e)) { infEyeClearOwner(e); continue; }
    // emission needs an eye drawn THIS frame or the last one: a body that
    // stopped reporting (purified, off-screen, culled) stops emitting at once
    const fresh = e._eyeDraw >= INF_DRAWN - 1 && (e._eyeN || 0) > 0;
    const cls = infEyeClass(e);
    if (!fresh || !cls) { e._eyeP = null; continue; }
    if (!smoke) { e._eyeP = null; continue; }
    const purple = cls === 'purple';
    // IS THE CREATURE GOING ANYWHERE? Asked of the BODY, not the eye. A filmed
    // idle steps its eye a few pixels from one cell to the next, all at once,
    // and one fixed step of that reads as hundreds of px/s — a wolf breathing
    // in place used to leave a thread of smoke. The body's own travel is the
    // honest answer; a short hold carries it across the steps between draws.
    if (e._eyeBX != null) {
      const bv = Math.hypot(e.x - e._eyeBX, e.y - e._eyeBY);
      if (bv <= INF_EYE_JUMP && bv / dt >= INF_EYE_MIN_V) e._eyeMv = INF_EYE_HOLD;
    }
    e._eyeBX = e.x; e._eyeBY = e.y;
    e._eyeMv = Math.max(0, (e._eyeMv || 0) - dt);
    // ...and how much MOVING sim time each eye is owed since its last draw.
    // The smoke itself is laid by the draw (infEyeLay), along the eye the art
    // actually drew — an emitter running here, before the draw, can only aim
    // at the eye of the frame before, and is a frame late whenever the art
    // changes cell. The sim clock still decides how much: nothing is owed
    // while paused, and a camera that moves without the sim owes nothing.
    if (!e._eyeP) e._eyeP = { x: [0, 0], y: [0, 0], owe: [0, 0], ok: [false, false], acc: [0, 0], face: 0 };
    const P = e._eyeP;
    if (e._eyeMv > 0) { P.acc[0] += dt; P.acc[1] += dt; } else { P.acc[0] = P.acc[1] = 0; }
    P.purple = purple;
  }
  // age and drift: a slow rise that gathers, and a curl that widens with age
  for (let i = INF_LIVE - 1; i >= 0; i--) {
    const a = (INF_AGE[i] += dt);
    if (a >= INF_LIFE[i]) { infEyeKill(i); continue; }
    const k = a / INF_LIFE[i];
    const curl = Math.sin(INF_PH[i] + a * 3.1) * (4 + k * 14);
    INF_X[i] += (INF_VX[i] + curl) * dt;
    INF_Y[i] += INF_VY[i] * dt;
    INF_VX[i] *= Math.pow(0.4, dt);
    INF_VY[i] -= 6 * dt;                            // warm smoke keeps rising
  }
}

// ---- drawing ----------------------------------------------------------------
// One soft dot per colour, made once: drawImage of a 32 px sprite is the
// cheapest soft thing a canvas can draw, and it needs no shadowBlur.
let INF_SPR = null;
function infEyeSprites() {
  if (INF_SPR) return INF_SPR;
  INF_SPR = {};
  for (const name in INF_EYE_COL) {
    const C = INF_EYE_COL[name];
    const mk = (rgb, hard) => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 32;
      const x = cv.getContext('2d');
      const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, 'rgba(' + rgb + ',1)');
      g.addColorStop(hard ? 0.35 : 0.2, 'rgba(' + rgb + ',' + (hard ? 0.85 : 0.45) + ')');
      g.addColorStop(1, 'rgba(' + rgb + ',0)');
      x.fillStyle = g; x.fillRect(0, 0, 32, 32);
      return cv;
    };
    INF_SPR[name] = { wisp: mk(C.wisp.join(','), false), core: mk(C.core.join(','), true), glow: mk(C.glow.join(','), true) };
  }
  return INF_SPR;
}
// Drawn in WORLD space (inside the camera transform), after the bodies, so a
// wisp crosses in front of the machine that left it the way smoke would.
function infEyeDraw(c) {
  if (typeof document === 'undefined') return;
  const S = infEyeSprites();
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < INF_LIVE; i++) {
    const k = INF_AGE[i] / INF_LIFE[i];
    const sp = INF_PURP[i] ? S.purple : S.red;
    // young: a hot, narrow point; old: a wide, faint breath that is nearly gone
    const young = k < 0.12;
    const r = (young ? 1.2 + k * 10 : 2 + k * 7) * INF_SZ[i];
    const al = young ? 0.55 * (1 - k * 2) : 0.30 * Math.pow(1 - k, 1.6);
    if (al <= 0.01) continue;
    c.globalAlpha = al;
    c.drawImage(young ? sp.core : sp.wisp, INF_X[i] - r, INF_Y[i] - r, r * 2, r * 2);
  }
  // the eyes themselves: a small steady burn at every infected eye drawn this
  // frame — the colour of the infection, whatever colour the art painted
  for (const e of INF_OWNERS) {
    if (e._eyeDraw !== INF_DRAWN || !(e._eyeN > 0)) continue;
    const cls = infEyeClass(e);
    if (!cls) continue;
    const sp = S[cls];
    const s = Math.max(0.5, Math.min(2.5, e._eyeS || 1));
    const pulse = 0.85 + Math.sin((e.anim || 0) * 5.3) * 0.15;
    for (let k = 0; k < e._eyeN; k++) {
      const x = e._eyeW[k * 2], y = e._eyeW[k * 2 + 1];
      const R = 5.5 * s;
      c.globalAlpha = 0.55 * pulse; c.drawImage(sp.glow, x - R, y - R, R * 2, R * 2);
      const r = 1.6 * s;
      c.globalAlpha = 0.95; c.drawImage(sp.core, x - r, y - r, r * 2, r * 2);
    }
  }
  c.restore();
}
// for the harnesses: how much smoke there is, and whose
function infEyeStats() {
  let red = 0, purple = 0;
  for (let i = 0; i < INF_LIVE; i++) INF_PURP[i] ? purple++ : red++;
  return { live: INF_LIVE, red, purple, cap: infEyeCap(), owners: INF_OWNERS.size, frame: INF_DRAWN };
}
function infEyeParticles(owner) {
  const out = [];
  for (let i = 0; i < INF_LIVE; i++) if (!owner || INF_OWN[i] === owner)
    out.push({ x: INF_X[i], y: INF_Y[i], y0: INF_Y0[i], age: INF_AGE[i], purple: !!INF_PURP[i] });
  return out;
}

// ---- the brackets -----------------------------------------------------------
// Every body draw is bracketed here rather than at each draw site, so the
// shared art helpers know whose eyes they are drawing. Bosses are wrapped by
// boss_aaa_fix.js as well; the order does not matter, both call through.
(function infEyeInstall() {
  const wrap = (proto) => {
    if (!proto || !proto.draw || proto.draw._infEye) return;
    const d = proto.draw;
    const w = function (c) {
      const prev = INF_CUR, prevC = INF_CUR_CLASS;
      infEyeBodyBegin(this);
      try { return d.apply(this, arguments); } finally { INF_CUR = prev; INF_CUR_CLASS = prevC; }
    };
    w._infEye = true;
    proto.draw = w;
  };
  if (typeof Enemy !== 'undefined') wrap(Enemy.prototype);
  if (typeof Boss !== 'undefined') wrap(Boss.prototype);
  // the yard winch draws itself and never calls Enemy.draw; its lens is
  // marked where it is painted
  if (typeof YardWinch !== 'undefined') wrap(YardWinch.prototype);
})();
