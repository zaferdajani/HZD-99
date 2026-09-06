// ===========================================================================
// MOTHER-V, THE NULL CORE — authored parts animated by a procedural rig.
// mvArtBody draws motherParts when loaded; the geometric body below it is
// the loading fallback. The heartbeat and effects remain procedural.
//
// She is not a machine and not a creature: she is a transmission that grew
// mass. The composition is built cold-around-warm — everything (void aura,
// violet-grey armor shell, virus tendrils, the cyan-to-red halo) sits in the
// cold dark bands so the single golden CORE reads as the only living thing
// in the room. One key light, upper-left, for every solid surface; the core
// itself is the second, warm, local light and rims the shell from inside —
// that inner gold edge is what welds the composition together.
//
// She has no facing. She is RADIAL: the turn law is satisfied by radial
// symmetry — there is no flip to police. Life comes from asymmetry of
// DETAIL: per-plate drift phases, staggered eye blinks, one worn plate.
//
// Everything moves on one shared heartbeat (~0.9 Hz) that accelerates as
// her HP falls: core swell, halo spikes, plate breathing.
// ===========================================================================

const MV_TAU = Math.PI * 2;
const MV = {
  void:   '#1a0a1a', deep: '#0d0d12',
  red:    '#e63946', redLt: '#ff8a8f', redDk: '#7e1826',
  vio:    '#b48cff', vioMid: '#7a5fd0', vioDk: '#3a2b55', vioDeep: '#241a38',
  gold:   '#ffd76a', goldHot: '#fff3c8', goldMid: '#d9a63e', goldDk: '#8a5a16', goldDeep: '#3a2408',
  // the shell ramp: cool violet-grey, hue-shifted (never grey-by-black)
  shRim: '#b7b0dc', shLit: '#837ca6', shMid: '#453f5e', shDark: '#26223a', shDeep: '#14111c',
  cyan: '#3fd8ee',
};
function mvClamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function mvLerp(a, b, k) { return a + (b - a) * k; }
function mvHash(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.545; return s - Math.floor(s); }
function mvMix(a, b, t) {
  const p = h => h[0] === '#' ? [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
    : h.match(/\d+/g).map(Number);
  const A = p(a), B = p(b);
  t = mvClamp(t, 0, 1);
  return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')';
}
function mvAngLerp(a, b, k) {
  let d = (b - a) % MV_TAU;
  if (d > Math.PI) d -= MV_TAU; if (d < -Math.PI) d += MV_TAU;
  return a + d * k;
}

// which plates are gone at each phase: opposite pairs, but NOT the first two
// sectors — asymmetric order so the wreckage never reads as a clean icon
const MV_SHATTER = [1, 5, 3, 7, 0, 4];
function mvGone(i, ph) {
  for (let k = 0; k < ph * 2 && k < MV_SHATTER.length; k++) if (MV_SHATTER[k] === i) return true;
  return false;
}

// annular-sector armor plate pointing +x. Concave scalloped sides (never a
// raw wedge); the outer edge carries a raised crest with a hard spike — the
// silhouette breaker that keeps the shell from reading as a closed ring.
function mvPlatePath(c, r0, r1, w0, w1, spike) {
  c.beginPath();
  c.arc(0, 0, r0, w0, -w0, true);                                   // inner edge
  const rm = r0 + (r1 - r0) * 0.5;
  c.quadraticCurveTo(Math.cos(-w0 * 0.6) * rm, Math.sin(-w0 * 0.6) * rm,
    Math.cos(-w1) * r1, Math.sin(-w1) * r1);                        // concave side
  c.arc(0, 0, r1, -w1, -0.1);                                       // outer edge…
  c.lineTo(r1 + spike, -1.8); c.lineTo(r1 + spike + 3, 0); c.lineTo(r1 + spike, 1.8); // …crest spike
  c.arc(0, 0, r1, 0.1, w1);
  c.quadraticCurveTo(Math.cos(w0 * 0.6) * rm, Math.sin(w0 * 0.6) * rm,
    Math.cos(w0) * r0, Math.sin(w0) * r0);                          // concave side
  c.closePath();
}

// ===========================================================================
// THE AUTHORED SHEET. Twenty painted parts, cut out of one plate and rigged
// against the motion this file already computes.
//
// She is RADIAL, which is what makes a sheet work here at all: one plate,
// drawn eight times around a circle, IS the shell — and drawing the same
// plate eight times is what keeps the ring symmetrical in a way eight
// separately painted plates never would be. The art on the sheet is oriented
// pointing LEFT-ish with its spikes up, so every draw rotates it into its
// sector and the whole body is built from a handful of rects.
// ===========================================================================
const MVA = {
  plate: [427, 2, 175, 238], plateB: [604, 2, 175, 228],
  crack: [326, 360, 177, 216], crack2: [505, 360, 181, 216],
  collar: [2, 360, 322, 220],
  haloCR: [2, 582, 526, 196], haloR: [2, 780, 522, 184],
  coreS: [2, 966, 125, 118], coreB: [688, 360, 238, 215], coreD: [526, 780, 145, 148],
  tend1: [2, 2, 133, 356], tend2: [287, 2, 138, 340], tend3: [137, 2, 148, 356],
  stub: [129, 966, 155, 108],
  shard1: [673, 780, 108, 143], shard2: [783, 780, 100, 136], shard3: [491, 966, 101, 75],
  shard4: [885, 780, 116, 120], shard5: [286, 966, 115, 96], shard6: [403, 966, 86, 88],
};
const MV_SHARDS = ['shard1', 'shard2', 'shard3', 'shard4', 'shard5', 'shard6'];
const MV_TENDS = ['tend1', 'tend2', 'tend3'];
function mvArt() {
  const im = (typeof MEDIA_IMG !== 'undefined') ? ((typeof softArt === 'function' && softArt('motherParts')) || MEDIA_IMG.motherParts) : null;
  return (im && im.naturalWidth) ? im : null;
}
// one part, centred on the current origin, at a given angle and pixel height
function mvBlit(c, key, ang, h, alpha, flip) {
  const im = mvArt(); if (!im) return;
  const r = MVA[key]; if (!r) return;
  const k = h / r[3], w = r[2] * k;
  c.save();
  c.rotate(ang);
  if (flip) c.scale(1, -1);
  c.globalAlpha *= (alpha == null ? 1 : alpha);
  c.drawImage(im, r[0], r[1], r[2], r[3], -w / 2, -h / 2, w, h);
  c.restore();
}
// a part hung out along a radius, so a plate sits in its sector rather than
// on top of the core
function mvBlitAt(c, key, ang, rad, h, alpha, spin) {
  const im = mvArt(); if (!im) return;
  const r = MVA[key]; if (!r) return;
  const k = h / r[3], w = r[2] * k;
  c.save();
  c.rotate(ang);
  c.translate(rad, 0);
  c.rotate(spin || 0);
  c.globalAlpha *= (alpha == null ? 1 : alpha);
  c.drawImage(im, r[0], r[1], r[2], r[3], -w / 2, -h / 2, w, h);
  c.restore();
}
function mvArtBody(c, b, P) {
  const { tt, dd, beat, hpFrac, ph, dorm, charging, dark, song, stag, grabbing, hurt, targA, cy } = P;
  // ---- void aura: unchanged in spirit, she is still a hole in the world ----
  if (!dark) {
    const deathFade = b.dead ? mvClamp(1 - dd / 1.8, 0, 1) : 1;
    const ag = c.createRadialGradient(0, 0, 20, 0, 0, 132);
    ag.addColorStop(0, 'rgba(26,10,26,' + 0.5 * deathFade + ')');
    ag.addColorStop(0.65, 'rgba(20,8,22,' + 0.26 * deathFade + ')');
    ag.addColorStop(1, 'rgba(13,13,18,0)');
    c.fillStyle = ag; c.beginPath(); c.arc(0, 0, 132, 0, MV_TAU); c.fill();
  }
  // ---- tendrils, behind the shell, reaching the way they always did --------
  const limpK = b.dead ? mvClamp(dd / 1.0, 0, 1) : 0;
  const dissK = b.dead ? mvClamp((dd - 0.5) / 1.0, 0, 1) : 0;
  const reach = dorm ? 0 : grabbing ? -0.5 : stag ? 0.15 : 0.75;
  if (dissK < 1 && !dark) {
    const tLen = 96 + ph * 22;
    for (let i = 0; i < 8; i++) {
      const Ti = (i + 0.5) / 8 * MV_TAU + Math.sin(tt * 0.17 + i * 2.4) * 0.05;
      let wgt = Math.pow(Math.max(0, Math.cos(Ti - targA)), 2) * reach;
      if (grabbing && Math.cos(Ti - targA) > 0.86) wgt = -0.4;
      // it leans toward her target, sways on the beat, and hangs on death
      let ang = mvAngLerp(Ti, targA, Math.max(0, wgt) * 0.34)
        + Math.sin(tt * 2.3 + i * 1.7) * (0.05 + 0.11 * Math.max(0, wgt)) * (1 - limpK);
      ang = mvAngLerp(ang, Math.PI / 2, limpK * 0.75);
      const grow = (1 + 0.28 * Math.max(0, wgt)) * (1 - limpK * 0.18) * (dorm ? 0.72 : 1);
      const key = MV_TENDS[i % MV_TENDS.length];
      const h = tLen * grow;
      // the art points along its own length: rotate so the tip leads outward
      mvBlitAt(c, key, ang, 34 + h * 0.5, h, (1 - dissK) * (dorm ? 0.7 : 1), Math.PI / 2);
    }
  }
  // ---- collar under the plates --------------------------------------------
  if (!dark && dissK < 1) {
    const cw = 104 * (1 + 0.03 * beat);
    mvBlit(c, 'collar', tt * 0.06, cw, (b.dead ? 1 - dissK : 1) * (dorm ? 0.85 : 1));
  }
  // ---- the shell: ONE plate, eight sectors --------------------------------
  const shellA = tt * 0.1;
  const breathe = 3.5 * beat + (stag ? 14 : 0) + (song ? 5 : 0) + (charging ? -2.5 : 0);
  const shellAl = dark ? 0.08 : dorm ? 0.85 : 1;
  for (let i = 0; i < 8; i++) {
    const gone = mvGone(i, ph);
    const h1 = mvHash(i * 3 + 1);
    const A = i / 8 * MV_TAU + shellA + Math.sin(tt * (0.21 + h1 * 0.12) + h1 * 6) * 0.05;
    let fly = 0, flyAl = 1;
    if (b.dead) {
      const t0 = (gone ? 0.02 + i * 0.03 : 0.12 + i * 0.14);
      const e = dd - t0;
      if (e > 0) { fly = e * (240 + 260 * e); flyAl = mvClamp(1 - e / 0.5, 0, 1); }
      if (flyAl <= 0) continue;
    } else if (gone) {
      continue;                       // this one is already lost to a phase shift
    }
    // one plate is worn, and two of them crack as she loses phases
    const key = (i === 3) ? 'plateB' : (ph >= 1 && i === 5) ? 'crack' : (ph >= 2 && i === 1) ? 'crack2' : 'plate';
    // eight plates on a ring wide enough that they read as an iris with gaps,
    // and whose inner tips stop short of the core instead of burying it
    const rad = 67 + breathe + fly;
    // the sheet paints the plate with its crest spikes up; turning it a quarter
    // the other way puts the spikes on the OUTSIDE of the ring, which is the
    // whole point of a silhouette breaker
    mvBlitAt(c, key, A, rad, 66 * (1 + 0.02 * beat), shellAl * flyAl, -Math.PI / 2);
  }
  // ---- shards, only once she is coming apart ------------------------------
  if (b.dead && dd > 0.25) {
    for (let i = 0; i < 10; i++) {
      const h1 = mvHash(i * 7 + 3), h2 = mvHash(i * 11 + 5);
      const e = dd - (0.25 + h1 * 0.5); if (e <= 0) continue;
      const al = mvClamp(1 - e / 1.1, 0, 1); if (al <= 0) continue;
      const A = h1 * MV_TAU, rad = e * (150 + 220 * e);
      mvBlitAt(c, MV_SHARDS[i % MV_SHARDS.length], A, rad, 26 + h2 * 22, al, e * (2 + h2 * 4));
    }
  }
  // ---- the core: the only warm thing in the game --------------------------
  {
    const scl = 1 + 0.08 * beat + (stag ? 0.04 : 0) + ph * 0.02;
    let bright = (dorm ? 0.55 : 0.9) + ph * 0.16 + (stag ? 0.25 : 0) + (dark ? 0.35 : 0)
      + (song ? 0.12 : 0) + (hurt ? 0.35 : 0);
    let deadCore = 0, flick = 1;
    if (b.dead) {
      deadCore = mvClamp((dd - 1.55) / 0.9, 0, 1);
      const gate = mvHash(Math.floor(dd * 22));
      flick = dd < 1.55 ? 1 + 0.3 * Math.sin(dd * 30) * mvClamp(dd - 0.8, 0, 1)
        : (gate > deadCore * 0.85 ? 1 - deadCore * 0.35 : 0.06);
      bright = 1.25 * flick * (1 - deadCore * 0.55);
    }
    const big = ph >= 1 || stag || charging;
    const size = 54 * scl * (1 - deadCore * 0.45) * (big ? 1.12 : 1);
    // the light it throws into the room, which is what welds the figure together
    if (!charging && deadCore < 1) {
      const gg = c.createRadialGradient(0, 0, 4, 0, 0, size * 2.1);
      gg.addColorStop(0, 'rgba(255,215,106,' + 0.5 * bright * (1 - deadCore) + ')');
      gg.addColorStop(0.5, 'rgba(217,166,62,' + 0.16 * bright * (1 - deadCore) + ')');
      gg.addColorStop(1, 'rgba(138,90,22,0)');
      c.fillStyle = gg; c.beginPath(); c.arc(0, 0, size * 2.1, 0, MV_TAU); c.fill();
    }
    // charging goes BLACK — with the frozen halo, that silence is the tell
    const key = (charging || deadCore > 0.8) ? 'coreD' : big ? 'coreB' : 'coreS';
    c.save();
    c.globalAlpha *= mvClamp(charging ? 1 : bright * 0.75 + 0.35, 0, 1);
    mvBlit(c, key, tt * (charging ? 0 : 0.25), size);
    c.restore();
  }
  // ---- the halo: a crown she does not wear ---------------------------------
  {
    let hy = -(b.h / 2) - 38, haloAl = dark ? 0.25 : 1, rock = 0;
    if (b.dead) {
      // it falls, hits the floor, bounces and rings like a dropped coin
      const t = dd - 0.35;
      if (t > 0) {
        const grav = 1500;
        const gy = (typeof G !== 'undefined' && G.roomDef ? G.roomDef.h - 2 : 15) * (typeof TILE !== 'undefined' ? TILE : 32);
        const F = Math.max(40, gy - (cy + hy) - 6);
        const t1 = Math.sqrt(2 * F / grav);
        if (t < t1) { hy += 0.5 * grav * t * t; rock = t * 2.2; }
        else {
          const v1 = grav * t1 * 0.26, t2 = t - t1, tAir = 2 * v1 / grav;
          const tc = Math.min(t2, tAir);
          hy += F - (v1 * tc - 0.5 * grav * tc * tc);
          rock = Math.sin(t2 * 22) * Math.max(0, 0.5 - t2 * 0.4);
          haloAl = mvClamp(1 - (t2 - tAir) / 1.6, 0, 1);
        }
      }
    } else {
      hy += Math.sin(tt * 0.9) * 3 - beat * 2;
    }
    if (haloAl > 0.01) {
      c.save();
      c.translate(0, hy);
      // the halo IS the health bar: split cyan-and-red at full, pure red at the end
      const key = (hpFrac > 0.45 && !b.dead) ? 'haloCR' : 'haloR';
      const w = 150 + beat * 5 + ph * 6;
      const r = MVA[key], k = w / r[2];
      c.rotate(rock * 0.25);
      c.globalAlpha *= haloAl * (charging ? 0.5 : 1);
      c.drawImage(mvArt(), r[0], r[1], r[2], r[3], -w / 2, -r[3] * k / 2, w, r[3] * k);
      c.restore();
    }
  }
  return true;
}

function drawMother(c, b) {
  // ---- shared rhythm bookkeeping (visual only — never touches AI state) ----
  const S = b._mv || (b._mv = { last: b.anim, haloA: 0.6, beatPh: 0, deathT: 0 });
  let d = b.anim - S.last; S.last = b.anim;
  if (!(d >= 0 && d < 0.25)) d = 0;
  const hpFrac = mvClamp((b.hpMax ? b.hp / b.hpMax : 1), 0, 1);
  const ph = b.mPhase || 0;
  const dorm = b.st === 'dorm';
  const charging = b.st === 'nwcharge';
  const dark = (typeof G !== 'undefined' && (G.darkT || 0) > 0) && !b.dead;
  const song = b.st === 'msong';
  const stag = (b.stagT || 0) > 0 && !b.dead;
  const grabbing = b.st === 'grabwarn' || b.st === 'grab';
  const hurt = (b.hurtT || 0) > 0 && !b.dead;
  // the heartbeat: ~0.9 Hz at full health, racing toward 1.8 Hz near death
  const rate = (0.9 + (1 - hpFrac) * 0.9) * (dorm ? 0.55 : 1);
  if (!b.dead) S.beatPh += d * rate * MV_TAU;
  if (!charging && !b.dead) S.haloA += d * (1.1 + (1 - hpFrac) * 0.8);
  if (b.dead) S.deathT += d;
  const bp = S.beatPh % MV_TAU;
  const lub = Math.pow(Math.max(0, Math.sin(bp)), 3);
  const dub = Math.pow(Math.max(0, Math.sin(bp - 2.1)), 6) * 0.55;
  const beat = charging ? 0 : mvClamp(lub + dub, 0, 1);       // the lub-dub
  const dd = S.deathT;                                        // death clock
  const tt = b.anim;
  const cx = b.cx(), cy = b.cy();
  const lightA = -Math.PI * 0.75;                             // upper-left key
  // player, for the reaching tendrils
  const P = (typeof player !== 'undefined' && player && !player.dead) ? player : null;
  const targA = P ? Math.atan2(P.y + P.h / 2 - cy, P.x + P.w / 2 - cx) : Math.PI / 2;

  c.save();
  c.translate(cx, cy);

  // ---- 0. THE AUTHORED BODY -------------------------------------------------
  // She was the last guardian drawn entirely in maths, which is why she read
  // cleaner and flatter than the cast she is the climax of. With her sheet in
  // memory the painted parts take over — but nothing above this line changes:
  // the heartbeat, the halo's fall, the plate-loss order, the reach of the
  // tendrils and the collapse of the core are all still the numbers this file
  // already worked out. Only what gets painted is different.
  if (mvArt() && mvArtBody(c, b, {
    tt, dd, beat, hpFrac, ph, dorm, charging, dark, song, stag, grabbing, hurt, targA, cy,
  })) { c.restore(); return; }

  // ---- 1. void aura: she is a hole in the world -----------------------------
  if (!dark) {
    const deathFade = b.dead ? mvClamp(1 - dd / 1.8, 0, 1) : 1;
    const ag = c.createRadialGradient(0, 0, 20, 0, 0, 126);
    ag.addColorStop(0, 'rgba(26,10,26,' + 0.5 * deathFade + ')');
    ag.addColorStop(0.65, 'rgba(20,8,22,' + 0.28 * deathFade + ')');
    ag.addColorStop(1, 'rgba(20,8,22,0)');
    c.fillStyle = ag; c.beginPath(); c.arc(0, 0, 126, 0, 7); c.fill();
    // a few slow motes falling INTO her — the pull of the signal
    if (!b.dead && !dorm) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const u = 1 - ((tt * 0.13 + mvHash(i)) % 1);
        const a = mvHash(i + 9) * MV_TAU + tt * 0.1;
        c.globalAlpha = (1 - u) * u * 2.4 * 0.5;
        c.fillStyle = i % 2 ? MV.vio : MV.red;
        c.beginPath(); c.arc(Math.cos(a) * 118 * u, Math.sin(a) * 118 * u, 1.6, 0, 7); c.fill();
      }
      c.restore();
    }
  }

  // ---- 2. the HALO: a crown she does not wear — it floats -------------------
  // cyan-to-red gradient chasing itself around the ring; 8 spikes on the beat.
  // nwcharge freezes it dead (with the black core, that silence IS the tell).
  // Death: it falls, hits the arena floor, bounces and rings like a dropped coin.
  {
    let hy = -(b.h / 2) - 38, rockA = 0, ryk = 1, ringFl = 0, haloAl = 1;
    if (b.dead) {
      const t = dd - 0.35;
      if (t > 0) {
        const grav = 1500;
        const gy = (typeof G !== 'undefined' && G.roomDef ? G.roomDef.h - 2 : 15) * (typeof TILE !== 'undefined' ? TILE : 32);
        const F = Math.max(40, gy - (cy + hy) - 6);
        const t1 = Math.sqrt(2 * F / grav);
        if (t < t1) hy += 0.5 * grav * t * t;
        else {
          const v1 = grav * t1 * 0.26, t2 = t - t1, tAir = 2 * v1 / grav;
          const tc = Math.min(t2, tAir);
          hy += F - (v1 * tc - 0.5 * grav * tc * tc);
          const settled = Math.max(0, t2 - tAir);
          rockA = Math.exp(-1.8 * t2) * Math.sin(13 * t2) * 0.55;
          ryk = mvLerp(1, 0.45, mvClamp(t2 * 2, 0, 1));
          ringFl = Math.max(Math.exp(-4 * t2), settled > 0 ? Math.exp(-4 * settled) * 0.7 : 0);
        }
        haloAl = mvClamp(1 - (dd - 2.45) / 0.4, 0, 1);
      }
    }
    if (dark) haloAl *= 0.06;
    if (haloAl > 0.01) {
      c.save(); c.translate(0, hy); c.rotate(Math.sin(tt * 0.4) * 0.05 + rockA);
      const rx = 54, ry = 13 * ryk, segs = 26;
      const deadK = b.dead ? mvClamp(dd / 2.2, 0, 1) : 0;
      // dark under-band first: gives the crown thickness instead of a wire edge
      c.strokeStyle = 'rgba(16,10,20,0.85)'; c.lineWidth = 6.5; c.globalAlpha = haloAl;
      c.beginPath(); c.ellipse(0, 1.5, rx, ry, 0, 0, 7); c.stroke();
      for (let s = 0; s < segs; s++) {
        const a0 = s / segs * MV_TAU, a1 = (s + 1) / segs * MV_TAU;
        let col = mvMix(MV.cyan, MV.red, 0.5 + 0.5 * Math.sin(a0 + S.haloA * 1.6));
        if (song) col = mvMix(MV.red, MV.vio, 0.5 + 0.5 * Math.sin(a0 + S.haloA * 1.6));
        if (deadK) col = mvMix(col, '#4a3a44', deadK);
        const front = 0.5 + 0.5 * Math.max(0, Math.sin(a0 + 0.1));   // near edge brighter
        c.strokeStyle = col; c.globalAlpha = haloAl * front * (charging ? 0.55 : 1);
        c.lineWidth = 2.8 + Math.sin(a0) * 1.1;
        c.beginPath();
        c.moveTo(Math.cos(a0) * rx, Math.sin(a0) * ry);
        c.lineTo(Math.cos(a1) * rx, Math.sin(a1) * ry);
        c.stroke();
      }
      // additive pass: the crown burns
      c.save(); c.globalCompositeOperation = 'lighter';
      if (!deadK) {
        c.globalAlpha = haloAl * (charging ? 0.1 : 0.28 + beat * 0.2);
        c.strokeStyle = song ? MV.red : MV.cyan; c.lineWidth = 1.2;
        c.beginPath(); c.ellipse(0, -0.5, rx, ry, 0, 0, 7); c.stroke();
      }
      // the 8 spikes, pulsing on the heartbeat
      for (let s = 0; s < 8; s++) {
        const sa = s / 8 * MV_TAU + S.haloA;
        const len = (8 + 15 * beat + 3 * mvHash(s)) * (1 - deadK * 0.7);
        let col = mvMix(MV.cyan, MV.red, 0.5 + 0.5 * Math.sin(sa + S.haloA * 0.6));
        if (song) col = MV.red;
        if (deadK) col = mvMix(col, '#4a3a44', deadK);
        c.globalAlpha = haloAl * (0.45 + 0.5 * beat) * (charging ? 0.25 : 1);
        c.fillStyle = col;
        const bx2 = Math.cos(sa), by2 = Math.sin(sa);
        c.beginPath();
        c.moveTo(Math.cos(sa - 0.12) * rx, Math.sin(sa - 0.12) * ry);
        c.lineTo(bx2 * (rx + len), by2 * (ry + len * 0.55));
        c.lineTo(Math.cos(sa + 0.12) * rx, Math.sin(sa + 0.12) * ry);
        c.closePath(); c.fill();
      }
      if (ringFl > 0.02) {          // the coin-ring flash on each floor impact
        c.globalAlpha = mvClamp(ringFl, 0, 1) * haloAl; c.strokeStyle = MV.goldHot; c.lineWidth = 2.2;
        c.beginPath(); c.ellipse(0, 0, rx + 5, ry + 3, 0, 0, 7); c.stroke();
      }
      c.restore();
      c.restore(); c.globalAlpha = 1;
    }
  }

  // ---- 3. TENDRILS: 8 virus-purple limbs on wave physics --------------------
  // Rooted deep under the shell so they read as coming from inside her.
  // Each phase shift they grow 20px. They reach for the player; during the
  // grab the AI's own tendril line takes over, so ours curl back in.
  {
    const segs = 5;
    const segLen = 13 + ph * 4 + (dorm ? -4 : 0);
    const limpK = b.dead ? mvClamp(dd / 1.0, 0, 1) : 0;
    const dissK = b.dead ? mvClamp((dd - 0.5) / 1.0, 0, 1) : 0;
    const reach = dorm ? 0 : grabbing ? -0.5 : stag ? 0.15 : 0.75;
    if (dissK < 1 && !dark) {
      for (let i = 0; i < 8; i++) {
        const Ti = (i + 0.5) / 8 * MV_TAU + Math.sin(tt * 0.17 + i * 2.4) * 0.05;
        let wgt = Math.pow(Math.max(0, Math.cos(Ti - targA)), 2) * reach;
        if (grabbing && Math.cos(Ti - targA) > 0.86) wgt = -0.4;  // hand off to the AI line
        const amp = (0.16 + 0.3 * Math.max(0, wgt)) * (1 - limpK);
        let px2 = Math.cos(Ti) * 30, py2 = Math.sin(Ti) * 30, ang = Ti;
        const pts = [[px2, py2]];
        for (let k = 1; k <= segs; k++) {
          const u = k / segs;
          ang = mvAngLerp(ang, targA, Math.max(0, wgt) * 0.34)
              + Math.sin(tt * 2.3 - k * 0.85 + i * 1.7) * amp * u
              + (wgt < 0 ? -0.28 * u : 0);                       // curl away
          ang = mvAngLerp(ang, Math.PI / 2, limpK * (0.25 + 0.6 * u));  // go limp
          px2 += Math.cos(ang) * segLen * (1 + 0.3 * Math.max(0, wgt));
          py2 += Math.sin(ang) * segLen * (1 + 0.3 * Math.max(0, wgt));
          pts.push([px2, py2, ang]);
        }
        const drawn = Math.max(1, Math.round(segs * (1 - dissK)));
        const al = (dorm ? 0.55 : 0.95) * (1 - dissK);
        c.save(); c.lineCap = 'round'; c.globalAlpha = al;
        for (let k = 0; k < drawn; k++) {                        // dark body
          const u = k / segs;
          c.strokeStyle = MV.vioDeep; c.lineWidth = mvLerp(10, 1.6, u * u * 0.6 + u * 0.4);
          c.beginPath(); c.moveTo(pts[k][0], pts[k][1]); c.lineTo(pts[k + 1][0], pts[k + 1][1]); c.stroke();
        }
        for (let k = 0; k < drawn; k++) {                        // lit top pass
          const u = k / segs;
          c.strokeStyle = mvMix(MV.vioDk, MV.vio, 0.2 + u * 0.8);
          c.lineWidth = mvLerp(5.5, 0.9, u);
          c.beginPath(); c.moveTo(pts[k][0], pts[k][1] - 1.2); c.lineTo(pts[k + 1][0], pts[k + 1][1] - 1.2); c.stroke();
        }
        // thorn barbs at the joints — menace, not decoration
        if (limpK < 0.5) {
          c.fillStyle = MV.vioMid; c.globalAlpha = al * 0.85;
          for (const k of [2, 3]) {
            if (k >= drawn) continue;
            const [jx, jy, ja] = pts[k];
            const na = ja + (i % 2 ? 1 : -1) * Math.PI / 2;
            c.beginPath();
            c.moveTo(jx + Math.cos(ja) * 2.5, jy + Math.sin(ja) * 2.5);
            c.lineTo(jx + Math.cos(na) * (5.5 - k), jy + Math.sin(na) * (5.5 - k));
            c.lineTo(jx - Math.cos(ja) * 2.5, jy - Math.sin(ja) * 2.5);
            c.closePath(); c.fill();
          }
        }
        c.restore();
      }
    }
    c.globalAlpha = 1;
  }

  // ---- 4. the CORE: the only warm thing in the game -------------------------
  {
    const coreR = 26;
    const scl = 1 + 0.08 * beat + (stag ? 0.04 : 0) + ph * 0.02;
    // brightness compensates for every plate she loses; total dark leaves it
    // as the single lamp in the room
    let bright = (dorm ? 0.4 : 0.85) + ph * 0.22 + (stag ? 0.35 : 0) + (dark ? 0.4 : 0) + (song ? 0.15 : 0) + (hurt ? 0.45 : 0);
    let flick = 1, deadCore = 0;
    if (b.dead) {
      deadCore = mvClamp((dd - 1.55) / 0.9, 0, 1);
      const gate = mvHash(Math.floor(dd * 22));
      flick = dd < 1.55 ? 1 + 0.3 * Math.sin(dd * 30) * mvClamp(dd - 0.8, 0, 1)
            : (gate > deadCore * 0.85 ? 1 - deadCore * 0.35 : 0.06);
      bright = 1.25 * flick * (1 - deadCore * 0.55);
    }
    c.save();
    // dying, the star COLLAPSES: radius shrinks as the light stutters out
    c.scale(scl * (1 - deadCore * 0.45), scl * (1 - deadCore * 0.45));
    if (charging) {
      // NULL WAVE tell: the heart runs BLACK — a hole veined in red
      const k = 1 - mvClamp((b.nwT || 0) / 1.1, 0, 1);
      const cg = c.createRadialGradient(-5, -6, 2, 0, 0, coreR);
      cg.addColorStop(0, mvMix(MV.goldDeep, '#08080d', k));
      cg.addColorStop(0.7, mvMix('#1c1208', MV.deep, k));
      cg.addColorStop(1, '#08080d');
      c.fillStyle = cg; c.beginPath(); c.arc(0, 0, coreR, 0, 7); c.fill();
      c.save(); c.lineCap = 'round'; c.globalAlpha = (0.25 + 0.55 * k);
      c.strokeStyle = MV.redDk; c.lineWidth = 1.2;
      for (let i = 0; i < 5; i++) {                    // dark-side cracks
        const va = mvHash(i * 13 + 2) * MV_TAU;
        c.beginPath(); c.moveTo(Math.cos(va) * 4, Math.sin(va) * 4);
        c.lineTo(Math.cos(va + 0.5) * coreR * 0.7, Math.sin(va + 0.5) * coreR * 0.7); c.stroke();
      }
      c.restore();
      c.strokeStyle = MV.red; c.globalAlpha = 0.35 + 0.6 * k + Math.sin(tt * 24) * 0.1 * k;
      c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, coreR + 1, 0, 7); c.stroke();
      c.globalAlpha = 1;
    } else if (deadCore < 1 || dd < 2.6) {
      // warm bloom — HER light, cast on everything nearby
      c.save(); c.globalCompositeOperation = 'lighter';
      const gr = coreR * (dark ? 1.9 : 2.0 + bright * 0.8);
      const gg = c.createRadialGradient(0, 0, 2, 0, 0, gr);
      gg.addColorStop(0, 'rgba(255,215,106,' + mvClamp(0.35 * bright, 0, 0.6) + ')');
      gg.addColorStop(0.55, 'rgba(255,180,70,' + mvClamp(0.13 * bright, 0, 0.3) + ')');
      gg.addColorStop(1, 'rgba(255,160,60,0)');
      c.fillStyle = gg; c.beginPath(); c.arc(0, 0, gr, 0, 7); c.fill();
      c.restore();
      // inner sphere: emissive gold, form given by an OFF-CENTRE hot spot…
      const cg = c.createRadialGradient(-coreR * 0.32, -coreR * 0.36, 1.5, 0, 0, coreR);
      cg.addColorStop(0, MV.goldHot);
      cg.addColorStop(0.34, MV.gold);
      cg.addColorStop(0.72, MV.goldMid);
      cg.addColorStop(1, MV.goldDk);
      c.fillStyle = cg;
      c.globalAlpha = mvClamp(0.55 + bright * 0.45, 0, 1) * (b.dead ? Math.max(flick, 0.05) : 1);
      c.beginPath(); c.arc(0, 0, coreR, 0, 7); c.fill();
      // …and a real terminator: the lower-right of the sphere falls off
      const tg = c.createRadialGradient(-coreR * 0.32, -coreR * 0.36, coreR * 0.5, 0, 0, coreR * 1.02);
      tg.addColorStop(0, 'rgba(58,36,8,0)');
      tg.addColorStop(0.75, 'rgba(58,36,8,0)');
      tg.addColorStop(1, 'rgba(40,22,6,0.6)');
      c.fillStyle = tg; c.beginPath(); c.arc(0, 0, coreR, 0, 7); c.fill();
      c.globalAlpha = 1;
      // the cracked OUTER crust: a tarnished ring band split by narrow radial
      // fissures; the inner light burns through the gaps
      if (deadCore < 0.6) {
        const crk = 7;
        for (let i = 0; i < crk; i++) {
          const a0 = i / crk * MV_TAU + 0.35 + Math.sin(i * 3.7) * 0.12;
          const gap = (0.09 + ph * 0.035 + beat * 0.035);      // fissures widen
          const a1 = a0 + MV_TAU / crk - gap;
          const rIn = coreR * (0.66 + mvHash(i + 3) * 0.1);
          const litK = Math.max(0, Math.cos((a0 + a1) / 2 - lightA));
          c.fillStyle = mvMix('#241503', '#553511', 0.25 + 0.45 * litK);
          c.globalAlpha = (1 - deadCore) * 0.96;
          c.beginPath();
          c.arc(0, 0, coreR + 0.5, a0, a1);
          for (let k2 = 3; k2 >= 0; k2--) {          // lightly jagged inner rim
            const aa = a0 + (a1 - a0) * k2 / 3;
            const jr = rIn - mvHash(i * 5 + k2) * 2.5;
            c.lineTo(Math.cos(aa) * jr, Math.sin(aa) * jr);
          }
          c.closePath(); c.fill();
          // infection: a red filament crawling along the crust piece
          c.strokeStyle = i % 2 ? MV.red : MV.redDk; c.lineWidth = 1;
          c.globalAlpha = (0.35 + ph * 0.14 + beat * 0.15) * (1 - deadCore);
          c.beginPath();
          const am = (a0 + a1) / 2;
          c.moveTo(Math.cos(a0 + gap) * (rIn + 1), Math.sin(a0 + gap) * (rIn + 1));
          c.quadraticCurveTo(Math.cos(am) * (coreR * 0.85), Math.sin(am) * (coreR * 0.85),
            Math.cos(a1 - 0.06) * (coreR - 1.5), Math.sin(a1 - 0.06) * (coreR - 1.5));
          c.stroke();
        }
        // fissure flares: the heart showing through the cracks
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < crk; i++) {
          const a1 = i / crk * MV_TAU + 0.35 + Math.sin(i * 3.7) * 0.12 - 0.045;
          c.globalAlpha = (0.2 + 0.35 * beat + ph * 0.08) * (1 - deadCore) * (dark ? 1.3 : 1);
          c.strokeStyle = MV.goldHot; c.lineWidth = 1.4;
          c.beginPath(); c.moveTo(Math.cos(a1) * coreR * 0.72, Math.sin(a1) * coreR * 0.72);
          c.lineTo(Math.cos(a1) * (coreR + 0.5 + beat * 1.5), Math.sin(a1) * (coreR + 0.5 + beat * 1.5));
          c.stroke();
        }
        c.restore();
        c.globalAlpha = 1;
      }
      // dying spark: the very last thing on screen
      if (b.dead && dd > 2.25) {
        const k = mvClamp(1 - (dd - 2.25) / 0.35, 0, 1);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = k;
        c.fillStyle = '#ffffff';
        c.beginPath(); c.arc(0, 0, 3.5 * k, 0, 7); c.fill();
        c.restore();
      }
    }
    c.restore();
  }

  // ---- 5. the SHELL: 8 armor plates in 45-degree sectors --------------------
  // Slow shared rotation + per-plate oscillation (independent drift), breathing
  // apart on the heartbeat. Diagonal clipped ramps off the one key light; the
  // inner edge is rimmed GOLD by the core. Each carries a lidded red eye.
  {
    const shellA = tt * 0.1;
    const r0 = 34, r1 = 74;
    const breathe = 3.5 * beat + (stag ? 14 : 0) + (song ? 5 : 0) + (charging ? -2.5 : 0);
    const shellAl = dark ? 0.08 : dorm ? 0.8 : 1;
    for (let i = 0; i < 8; i++) {
      const gone = mvGone(i, ph);
      const h1 = mvHash(i * 3 + 1), h2 = mvHash(i * 5 + 2);
      const A = i / 8 * MV_TAU + shellA + Math.sin(tt * (0.21 + h1 * 0.12) + h1 * 6) * 0.05;
      // death: plates shatter outward ONE BY ONE
      let fly = 0, flyAl = 1;
      if (b.dead) {
        const t0 = (gone ? 0.02 + i * 0.03 : 0.12 + i * 0.14);
        const e = dd - t0;
        if (e > 0) { fly = e * (240 + 260 * e); flyAl = mvClamp(1 - e / 0.5, 0, 1); }
        if (flyAl <= 0) continue;
      }
      const rOff = breathe + fly + (stag ? Math.sin(tt * 1.4 + i) * 2 : 0);
      c.save();
      c.rotate(A);
      c.translate(rOff, 0);
      if (b.dead && fly > 0) { c.translate((r0 + r1) / 2, 0); c.rotate(fly * 0.02 * (h1 - 0.5) * 4); c.translate(-(r0 + r1) / 2, 0); }
      c.globalAlpha = shellAl * flyAl;
      if (gone) {
        // SHATTERED sector: a jagged stub still glowing at the break, plus
        // two loose shards adrift in the gap — wreckage, not absence
        c.fillStyle = MV.shDeep;
        c.beginPath();
        c.arc(0, 0, r0, 0.3, -0.3, true);
        c.lineTo(Math.cos(-0.22) * (r0 + 6 + h1 * 6), Math.sin(-0.22) * (r0 + 6 + h1 * 6));
        c.lineTo(Math.cos(-0.05) * (r0 + 3.5), Math.sin(-0.05) * (r0 + 3.5));
        c.lineTo(Math.cos(0.1) * (r0 + 8 + h2 * 5), Math.sin(0.1) * (r0 + 8 + h2 * 5));
        c.closePath(); c.fill();
        c.strokeStyle = MV.red; c.globalAlpha *= 0.5 + 0.4 * beat;   // hot break edge
        c.lineWidth = 1.3;
        c.beginPath();
        c.moveTo(Math.cos(-0.22) * (r0 + 6 + h1 * 6), Math.sin(-0.22) * (r0 + 6 + h1 * 6));
        c.lineTo(Math.cos(-0.05) * (r0 + 3.5), Math.sin(-0.05) * (r0 + 3.5));
        c.lineTo(Math.cos(0.1) * (r0 + 8 + h2 * 5), Math.sin(0.1) * (r0 + 8 + h2 * 5));
        c.stroke();
        c.globalAlpha = shellAl * flyAl;
        for (let s2 = 0; s2 < 2; s2++) {                             // drifting shards
          const sr = r0 + 16 + s2 * 11 + Math.sin(tt * (0.5 + h2) + s2 * 2.4) * 3.5;
          const sa2 = (s2 - 0.5) * 0.3 + Math.sin(tt * 0.4 + i + s2) * 0.06;
          c.save(); c.translate(Math.cos(sa2) * sr, Math.sin(sa2) * sr);
          c.rotate(tt * (0.4 + h1) + s2 * 2);
          c.fillStyle = s2 ? MV.shMid : MV.shDark;
          c.beginPath(); c.moveTo(5, 0); c.lineTo(-3, 3.6); c.lineTo(-3.6, -2.6); c.closePath(); c.fill();
          c.restore();
        }
        c.restore(); continue;
      }
      // ---- an intact plate ----
      const worn = i === 3;                                          // the one scarred plate
      const spike = 9 + h1 * 6 + (worn ? -5 : 0);
      const midA = A;                                                // outward normal (world)
      // per-plate key-light factor: plates facing the key are genuinely lighter
      const faceK = 0.62 + 0.5 * Math.max(0, Math.cos(midA - lightA));
      mvPlatePath(c, r0, r1, 0.33, 0.28, spike);
      c.save(); c.clip();
      // diagonal ramp: axis fixed in WORLD space regardless of sector angle
      const pcx = (r0 + r1) / 2, len = (r1 - r0) * 1.0;
      const ldx = Math.cos(lightA - A) * len, ldy = Math.sin(lightA - A) * len;
      const g = c.createLinearGradient(pcx + ldx, ldy, pcx - ldx, -ldy);
      g.addColorStop(0, mvMix(MV.shLit, MV.shRim, mvClamp((faceK - 0.9) * 2, 0, 1)));
      g.addColorStop(0.5, mvMix(MV.shMid, MV.shLit, mvClamp((faceK - 0.75) * 1.6, 0, 0.6)));
      g.addColorStop(1, MV.shDeep);
      c.fillStyle = g; c.fillRect(r0 - 12, -r1, (r1 - r0) + spike + 16, r1 * 2);
      // clipped diagonal chamfer band across the face
      c.globalAlpha *= 0.3;
      c.fillStyle = MV.shRim;
      c.beginPath();
      c.moveTo(r0 + 3, -17); c.lineTo(r0 + 11, -19); c.lineTo(r1 - 2, 9); c.lineTo(r1 - 10, 11);
      c.closePath(); c.fill();
      c.globalAlpha = shellAl * flyAl;
      // raised outer crest: a darker band under the spike — mechanical mass
      c.fillStyle = 'rgba(14,11,22,0.55)';
      c.beginPath(); c.arc(0, 0, r1, -0.33, 0.33);
      c.arc(0, 0, r1 - 6, 0.33, -0.33, true); c.closePath(); c.fill();
      c.strokeStyle = MV.shLit; c.globalAlpha *= 0.5;
      c.beginPath(); c.arc(0, 0, r1 - 6, -0.3, 0.3); c.stroke();
      c.globalAlpha = shellAl * flyAl;
      // panel seam + inner recess shadow (depth without black-lining)
      c.strokeStyle = 'rgba(10,8,16,0.55)'; c.lineWidth = 1.4;
      c.beginPath(); c.arc(0, 0, r0 + (r1 - r0) * 0.58, -0.28, 0.28); c.stroke();
      c.beginPath(); c.arc(0, 0, r0 + 4, -0.36, 0.36); c.stroke();
      if (worn) {                                                    // old damage, one side
        c.fillStyle = 'rgba(10,8,16,0.5)';
        c.beginPath(); c.moveTo(r1 - 8, -10); c.lineTo(r1 - 17, -6); c.lineTo(r1 - 10, -3); c.closePath(); c.fill();
      }
      c.restore();
      if (hurt) {                                                    // hit flinch: plate rims flash
        c.strokeStyle = '#ffffff'; c.globalAlpha = shellAl * 0.35; c.lineWidth = 1.2;
        mvPlatePath(c, r0, r1, 0.33, 0.28, spike); c.stroke();
        c.globalAlpha = shellAl * flyAl;
      }
      // world-lit rim: only on plates whose face catches the key light
      const rimK = Math.max(0, Math.cos(midA - lightA));
      if (rimK > 0.12) {
        c.strokeStyle = MV.shRim; c.globalAlpha = shellAl * flyAl * rimK * 0.9;
        c.lineWidth = 1.6;
        c.beginPath(); c.arc(0, 0, r1 - 0.5, -0.22, 0.22); c.stroke();
        c.globalAlpha = shellAl * flyAl;
      }
      // CORE rim: the inner edge of every plate takes her gold light
      const coreRimK = charging ? 0.06 : (0.3 + 0.55 * beat + ph * 0.1 + (stag ? 0.3 : 0));
      c.strokeStyle = MV.gold; c.globalAlpha = shellAl * flyAl * mvClamp(coreRimK, 0, 1) * 0.8;
      c.lineWidth = 1.8;
      c.beginPath(); c.arc(0, 0, r0 + 0.8, -0.32, 0.32); c.stroke();
      c.globalAlpha = shellAl * flyAl;
      // infected trace creeping OUT of the gap toward the eye
      c.strokeStyle = MV.redDk; c.globalAlpha *= 0.75;
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(r0 + 2, 5 * (h2 - 0.5));
      c.lineTo(r0 + (r1 - r0) * 0.38, 6 * (h1 - 0.5)); c.stroke();
      c.globalAlpha = shellAl * flyAl;
      // ---- the plate EYE: a recessed tangential slit, staggered blinking ----
      {
        const er = r0 + (r1 - r0) * (0.36 + h2 * 0.14);
        const esc = 0.85 + h1 * 0.3;                                 // per-plate eye size
        let open = mvClamp(Math.sin(tt * 1.15 + i * 1.9) * 1.6 + 0.6, 0.06, 1);
        if (dorm) open = 0.06;
        if (b.beam || song) open = 1;
        if (charging) open = mvClamp(open, 0.06, 0.35);
        if (b.dead) open *= mvClamp(1 - dd / 0.5, 0, 1);
        c.save(); c.translate(er, 0); c.scale(esc, esc);
        // carved socket: a lens slot cut across the plate, not a sticker on it
        c.fillStyle = '#0a0812';
        c.beginPath(); c.ellipse(0, 0, 3.4, 5.8, 0, 0, 7); c.fill();
        c.strokeStyle = 'rgba(183,176,220,0.35)'; c.lineWidth = 1;
        c.beginPath(); c.ellipse(0, 0.8, 3.4, 5.8, 0, -2.6, -0.6, false); c.stroke();  // socket lower lip catches light
        if (open > 0.08) {
          const hot = b.beam && !b.beam.warn ? 1.4 : b.beam ? 1.15 : 1;
          c.save(); c.scale(open, 1);                                // slit narrows shut
          c.fillStyle = MV.redDk;
          c.beginPath(); c.ellipse(0, 0, 2.4, 4.6, 0, 0, 7); c.fill();
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = (0.55 + 0.45 * beat) * hot * shellAl;
          c.fillStyle = MV.red;
          c.beginPath(); c.ellipse(0, 0, 1.5 * hot, 3.6 * hot, 0, 0, 7); c.fill();
          c.fillStyle = MV.redLt; c.globalAlpha *= 0.85;
          c.beginPath(); c.ellipse(0.3, -1.2, 0.7, 1.3, 0, 0, 7); c.fill();
          c.restore();
          if (b.beam) {                                              // focus glow: all eyes on you
            c.save(); c.globalCompositeOperation = 'lighter';
            c.globalAlpha = (b.beam.warn ? 0.3 + Math.sin(tt * 16) * 0.12 : 0.55) * shellAl;
            const fg = c.createRadialGradient(0, 0, 0.5, 0, 0, 10);
            fg.addColorStop(0, MV.red); fg.addColorStop(1, 'rgba(230,57,70,0)');
            c.fillStyle = fg; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fill();
            c.restore();
          }
        }
        c.restore();
      }
      c.restore();
    }
    c.globalAlpha = 1;
  }

  c.restore();
  return true;
}
