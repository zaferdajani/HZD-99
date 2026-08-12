// BOSS 01 — TALONHOST, the virus-infected robot eagle. And its flock.
//
// Every rendered state IS an authored figure from the sheet — the hanging
// idle on its mount, the WINGS DOWN / WINGS UP flip-book frames for flight,
// the CHARGE / FIRE / RECOVER attack sequence, the metallic feather art as
// projectiles. This code never invents anatomy: it only picks the authored
// frame, aligns frames on the glowing chest core so nothing jumps, and adds
// rigid motion (cable pendulum, wing-beat timing, dive banking) plus glow
// and wind.
const EAGLE_P = {
  eHead: [6, 6, 85, 107], eBody: [97, 6, 105, 134],
  eWingU: [208, 6, 181, 107], eWingL: [395, 6, 147, 90], eWingT: [548, 6, 73, 70],
  eTail: [627, 6, 98, 129], eMount: [731, 6, 109, 98], eTalon: [846, 6, 97, 90],
  eFull: [949, 6, 532, 313],
  pIdle: [6, 325, 173, 155], pDown: [185, 325, 188, 204],
  pUp: [379, 325, 182, 195], pShoot: [567, 325, 252, 157],
  kCharge: [825, 325, 228, 128], kFire: [1059, 325, 210, 116], kRecover: [1275, 325, 204, 119],
  fea0: [6, 535, 62, 30], fea1: [74, 535, 125, 34], fea2: [205, 535, 136, 33],
  // the bird alone, without its ceiling mount: pIdle minus the mount rows —
  // used when it perches low to rest and when it lies dead
  pRest: [6, 371, 173, 109],
};
const EAGLE_F = 2.11;             // panel figure scale -> in-world master scale
const EAGLE_CACHE = { anchors: null };

let EG_PURE = false;              // drawEagle sets this from b.purified
let EG_PURE_CV = undefined;
// the purified sheet: every hot virus-red pixel remapped to clean teal
function egPureAtlas(im) {
  if (EG_PURE_CV !== undefined) return EG_PURE_CV;
  // never cache before the sheet has decoded — a 0-size canvas is forever
  if (!im || !im.naturalWidth) return null;
  const cv = document.createElement('canvas');
  cv.width = im.naturalWidth; cv.height = im.naturalHeight;
  const x = cv.getContext('2d', { willReadFrequently: true });
  x.drawImage(im, 0, 0);
  let d;
  try { d = x.getImageData(0, 0, cv.width, cv.height); }
  catch (e) { return (EG_PURE_CV = null); }
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], g = p[i + 1], b2 = p[i + 2];
    if (p[i + 3] > 60 && r > 130 && r - g > 55 && r - b2 > 45) {
      p[i] = Math.round(r * 0.25);
      p[i + 1] = Math.min(255, Math.round(r * 0.9 + 40));
      p[i + 2] = Math.round(r * 0.72);
    }
  }
  x.putImageData(d, 0, 0);
  return (EG_PURE_CV = cv);
}
function eagleImg() {
  const im = typeof MEDIA_IMG !== 'undefined' && ((typeof softArt === 'function' && softArt('eagleParts')) || MEDIA_IMG.eagleParts);
  if (im && EG_PURE) { const pv = egPureAtlas(im); if (pv) return pv; }
  return im;
}

// each figure is registered on its glowing chest core, found by scanning the
// art itself — so alternating frames stay locked to one another
function eagleAnchors() {
  if (EAGLE_CACHE.anchors) return EAGLE_CACHE.anchors;
  // always scan the RAW sheet: the purified remap moves the red the scan needs
  const im = typeof MEDIA_IMG !== 'undefined' && ((typeof softArt === 'function' && softArt('eagleParts')) || MEDIA_IMG.eagleParts);
  if (!im || !im.naturalWidth) return null;
  const cv = document.createElement('canvas');
  cv.width = im.naturalWidth; cv.height = im.naturalHeight;
  const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
  const out = {};
  for (const key of ['pIdle', 'pDown', 'pUp', 'pShoot', 'kCharge', 'kFire', 'kRecover', 'pRest']) {
    const s = EAGLE_P[key];
    const d = x.getImageData(s[0], s[1], s[2], s[3]).data;
    let mx = 0, my = 0, n = 0;
    for (let i = 0; i < s[2] * s[3]; i++) {
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], a = d[i * 4 + 3];
      if (a > 120 && r > 185 && r - g > 85 && r - b > 70) { mx += i % s[2]; my += (i / s[2]) | 0; n++; }
    }
    out[key] = n ? [mx / n, my / n] : [s[2] / 2, s[3] / 2];
  }
  EAGLE_CACHE.anchors = out;
  return out;
}

// draw one authored figure with its chest core at the origin
function egFigA(c, key, alpha, rot) {
  const A = eagleAnchors(); if (!A) return;
  const s = EAGLE_P[key], an = A[key];
  c.save();
  if (rot) c.rotate(rot);
  if (alpha != null) c.globalAlpha *= alpha;
  c.scale(EAGLE_F, EAGLE_F);
  c.drawImage(eagleImg(), s[0], s[1], s[2], s[3], -an[0], -an[1], s[2], s[3]);
  c.restore();
}

// ---- wing-beat timing ----
// A real wing-beat is asymmetric: the power stroke SNAPS down fast, the
// recovery sweeps back up slow. egBeat warps a 0..1 cycle phase into the
// wings-up weight (1 = pUp figure, 0 = pDown figure) with that asymmetry —
// a third of the cycle for the strike, a beat of glide on the downstroke,
// the rest for the slow recovery.
function egBeat(p) {
  p = p - Math.floor(p);
  if (p < 0.32) { const u = p / 0.32; return 1 - u * u * (3 - 2 * u); }   // power stroke
  if (p < 0.46) return 0;                                                 // glide on it
  const u = (p - 0.46) / 0.54; return u * u * (3 - 2 * u);                // slow recovery
}

// flight: the sheet's own wings-down / wings-up frames alternating, blended
// through egBeat's cadence. The body bob is derived from the same warp, so
// she lifts on the strike and settles through the recovery. `heavy` is the
// laboured version — bigger travel, the nose dipping into each stroke.
function egFlap(c, t, spd, rot, heavy) {
  const k = egBeat((t * spd) / (Math.PI * 2));
  const amp = heavy ? 13 : 7;
  c.save(); c.translate(0, (k * 2 - 1) * amp);
  const pitch = (rot || 0) + (heavy ? (0.5 - k) * 0.09 : 0);
  if (k < 0.22) egFigA(c, 'pDown', 1, pitch);
  else if (k > 0.78) egFigA(c, 'pUp', 1, pitch);
  else {
    const m = (k - 0.22) / 0.56;
    egFigA(c, 'pDown', 1 - m, pitch);
    egFigA(c, 'pUp', m, pitch);
  }
  c.restore();
}

function egChestGlow(c, k) {
  if (k <= 0.05) return;
  c.save(); c.globalCompositeOperation = 'lighter';
  const gg = c.createRadialGradient(0, 0, 2, 0, 0, 34 * k);
  gg.addColorStop(0, 'rgba(255,120,130,' + Math.min(0.8, 0.45 * k).toFixed(2) + ')');
  gg.addColorStop(1, 'rgba(200,30,50,0)');
  c.fillStyle = gg; c.beginPath(); c.arc(0, 0, 34 * k, 0, 7); c.fill();
  c.restore();
}

// ---- the cable rig (visual only) ----
// One damped pendulum shared by every state: loaded and stiff while she
// hangs, loose while the empty cable dangles over the perch. The AI injects
// impulses into cabV (volley recoil, swoop departure, the catch on return);
// integration lives here so the swing keeps settling even through hit-stagger.
function egCableTick(b) {
  const a0 = b._pa == null ? b.anim : b._pa;
  const dtv = Math.max(0, Math.min(0.05, b.anim - a0));
  b._pa = b.anim;
  if (b.cabA == null) { b.cabA = 0; b.cabV = 0; }
  const hang = !b.dead && (b.st === 'idle' || b.st === 'dorm' || b.st === 'intro' ||
    b.st === 'volley' || b.st === 'broodcall');
  const k = hang ? 24 : 6.5, dmp = hang ? 2.4 : 0.8;
  b.cabV += (-k * b.cabA - dmp * b.cabV) * dtv;
  b.cabA += b.cabV * dtv;
  if (hang) {
    // her own drift under the anchor rocks the hang — gently; the spring
    // does the storytelling, not the raw travel
    const hx = b.x + b.w / 2;
    if (b._phx != null) b.cabV -= (hx - b._phx) * 0.012;
    b._phx = hx;
  } else b._phx = null;
  b.cabV = Math.max(-2.6, Math.min(2.6, b.cabV));
  b.cabA = Math.max(-0.42, Math.min(0.42, b.cabA));
  b.fireKick = Math.max(0, (b.fireKick || 0) - dtv * 5);
  // per-state visual clock, for tells that BUILD (charge shudder, rise beats)
  if (b.st !== b._stPrev) { b._stPrev = b.st; b._stT = 0; } else b._stT = (b._stT || 0) + dtv;
  return hang;
}

// a hung cable is never a ruler line: slight catenary sag when slack, bowing
// against the swing when it whips
function egCableStroke(c, x0, y0, x1, y1, bow) {
  const mx = (x0 + x1) / 2 + bow, my = (y0 + y1) / 2 + Math.abs(bow) * 0.3 + 7;
  c.save(); c.lineCap = 'round';
  c.strokeStyle = '#2c3138'; c.lineWidth = 4.5;
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
  c.strokeStyle = '#4a525c'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(x0 - 1.2, y0); c.quadraticCurveTo(mx - 1.2, my, x1 - 1.2, y1); c.stroke();
  // ceiling grommet
  c.fillStyle = '#3a4048'; c.fillRect(x0 - 6, y0 - 3, 12, 6);
  c.fillStyle = '#20242a'; c.fillRect(x0 - 3, y0 + 1, 6, 3);
  c.restore();
}

function drawEagle(c, b) {
  EG_PURE = !!b.purified;
  const im = eagleImg(); if (!im || (!im.naturalWidth && !im.getContext)) return false;
  c.save();
  try {
    const S = (b.w * 3.0) / 532;
    const cx = b.x + b.w / 2;
    let cy = b.y + b.h / 2;
    const hang = egCableTick(b);
    // the ceiling anchor is FIXED where she first roosted; everything the
    // cable does happens between that point and the mount on her back
    const hangX = b.hangX != null ? b.hangX : (b.hangX = (b.spawnX != null ? b.spawnX : b.x) + b.w / 2);
    const ancY = (b.homeY != null ? b.homeY : 60) + b.h / 2 - 300 * S;
    if (b.dead) {
      // drops out of the air onto the floor
      const k = 1 - Math.max(0, Math.min(1, (b.deathAnimT || 0) / 1.6));
      const floor = 15 * TILE - b.h / 2 - 10;
      cy = cy + (floor - cy) * k * k;
    }
    if (!hang) {
      // she has left the cable: it dangles empty over the perch, still
      // carrying whatever swing her departure put into it
      c.save(); c.translate(hangX, ancY); c.scale(S, S);
      const a = (b.cabA || 0) * 1.7;
      const tx = Math.sin(a) * 195 - (b.cabV || 0) * 26;
      const ty = Math.cos(a) * 195 * (1 - Math.abs(Math.sin(a)) * 0.12);
      egCableStroke(c, 0, 0, tx, ty, Math.sin(a) * 26 - (b.cabV || 0) * 18);
      // the empty coupling, its lock light blinking for her
      c.save(); c.translate(tx, ty); c.rotate(a * 1.4 - (b.cabV || 0) * 0.3);
      c.fillStyle = '#4d545e'; c.fillRect(-5, -2, 10, 12);
      c.fillStyle = '#2c3138'; c.fillRect(-5, 5, 10, 2.5);
      c.save(); c.globalAlpha *= 0.5 + Math.max(0, Math.sin(b.anim * 5)) * 0.45;
      c.shadowColor = '#ff4c5c'; c.shadowBlur = 8;
      c.fillStyle = '#ff4c5c'; c.fillRect(-2, 9, 4, 4);
      c.restore();
      c.restore(); c.restore();
    }
    c.translate(cx, cy);
    c.scale(S, S);
    if (b.hurtT > 0) c.globalAlpha = 0.72;
    if (b.st === 'dorm') c.globalAlpha *= 0.85;      // asleep on the line, dimmed
    if (b.st === 'intro') {
      // the waking shiver: it runs down the cable into her frame, hardest
      // just before the screech breaks
      const wk2 = Math.max(0, Math.min(1, 1 - (b.t || 0) / 2));
      c.translate((Math.random() - 0.5) * wk2 * 6, (Math.random() - 0.5) * wk2 * 3);
    }
    const t = b.anim;
    // while hung, the body tilts with the pendulum, plus a lean toward the
    // anchor when an attack has pulled her off plumb
    let tilt = 0, ax = 0, ay = -100;
    if (hang) {
      const slant = Math.atan2(cx - hangX, Math.max(40, cy - ancY));
      tilt = (b.cabA || 0) + Math.max(-0.16, Math.min(0.16, slant * 0.35));
      tilt = Math.max(-0.4, Math.min(0.4, tilt));
      ax = Math.sin(tilt) * 100; ay = -Math.cos(tilt) * 100;   // mount atop her back
      const lx = (hangX - cx) / S, ly = (ancY - cy) / S;
      egCableStroke(c, lx, ly, ax, ay, -(b.cabV || 0) * 14 + (lx - ax) * 0.1);
    }
    if (b.dead && !b.purified) {
      // powered down on the ground, light out, listing to one side
      const k = 1 - Math.max(0, Math.min(1, (b.deathAnimT || 0) / 1.6));
      egFigA(c, 'pRest', 1, 0.35 * k);
    } else if (b.st === 'idle' || b.st === 'dorm' || b.st === 'intro') {
      // the sheet's hanging figure, riding its cable's swing
      c.rotate(tilt + Math.sin(t * 1.3) * 0.018);
      egFigA(c, 'pIdle', 1, 0);
      egChestGlow(c, 0.55 + Math.sin(t * 3) * 0.2);
    } else if (b.st === 'volley') {
      // authored CHARGE -> FIRE -> RECOVER, all of it ON the cable
      const held = b.t || 0;
      if (!b.fired) {
        // the shudder builds from a tremor to a full rattle before the fan
        const a2 = Math.min(1, (b._stT || 0) / 0.85); const sh = a2 * a2;
        c.translate((Math.random() - 0.5) * 3.4 * sh, (Math.random() - 0.5) * 1.6 * sh);
        c.rotate(tilt + Math.sin(t * (16 + 14 * a2)) * 0.014 * a2);
        egFigA(c, 'kCharge', 1, 0);
        egChestGlow(c, 0.5 + a2 * 0.7 + Math.sin(t * 14) * 0.3 * a2);
      } else {
        // recoil: the burst kicks her up the cable, then she settles
        const kick = b.fireKick || 0;
        c.translate(0, -15 * kick);
        c.rotate(tilt - 0.09 * kick);
        egFigA(c, held < 0.35 ? 'kRecover' : 'kFire', 1, 0);
        egChestGlow(c, 0.55 + kick * 0.6);
      }
    } else if (b.st === 'swoop') {
      const u = Math.min(1, b.t || 0);
      const dir = Math.sign(b.vx || 1);
      const rot = Math.max(-0.5, Math.min(0.5, (b.vx || 0) / 1600));
      if (u < 0.14) {
        // fold-drop: she lets go still folded, plummets a beat — then the
        // wings SNAP open into the authored stoop
        const m = u / 0.14;
        const snap = m > 0.7 ? (m - 0.7) / 0.3 : 0;
        if (snap < 1) egFigA(c, 'pIdle', 1 - snap, rot * m * 0.5);
        if (snap > 0) {
          const pop = 1 + 0.09 * (1 - snap);
          c.save(); c.scale(pop, pop); egFigA(c, 'pDown', snap, rot); c.restore();
        }
        egChestGlow(c, 0.7 + snap * 0.5);
      } else {
        // banked through the bezier's apex: she rolls into the turn, the
        // span foreshortening as the body cants over
        const bank = Math.sin(Math.PI * Math.min(1, u * 1.12)) * 0.26 * dir;
        c.save(); c.globalAlpha *= 0.16;
        c.translate(-(b.vx || 0) * 0.012 / S, -(b.vy || 0) * 0.012 / S);
        egFigA(c, 'pDown', 1, rot + bank);   // speed ghost trailing the dive
        c.restore();
        c.save(); c.scale(1 - Math.abs(bank) * 0.22, 1);
        egFigA(c, 'pDown', 1, rot + bank);
        egChestGlow(c, 1.2);
        c.restore();
      }
    } else if (b.st === 'swoopwarn') {
      // agitated hover, locking on — the tremor builds until she commits
      const j = Math.min(1, (b._stT || 0) / 0.4);
      c.translate((Math.random() - 0.5) * 3 * j, (Math.random() - 0.5) * 1.4 * j);
      egFlap(c, t, 11, 0);
      egChestGlow(c, 1.3 + Math.sin(t * 16) * 0.3);
    } else if (b.st === 'broodcall') {
      // BROOD CALL: the screech — thrown back on the cable, chest strobing
      c.rotate(tilt - 0.16 + Math.sin(t * 22) * 0.02);
      egFigA(c, 'kCharge', 1, 0);
      egChestGlow(c, 1.5 + Math.sin(t * 25) * 0.5);
    } else if (b.st === 'cfcrash') {
      // COOLANT FREEZE: an uncontrolled tumble, not a stoop
      egFigA(c, 'pDown', 1, Math.sin(t * 7) * 0.5);
      egChestGlow(c, 0.9 + Math.sin(t * 30) * 0.4);
    } else if (b.st === 'cffloor') {
      // downed, chest cracked, coolant bleeding out — the repair window
      c.scale(1, 1 + Math.sin(t * 8) * 0.03);
      egFigA(c, 'pRest', 1, 0.12);
      egChestGlow(c, 0.25 + Math.sin(t * 18) * 0.15);
      c.save(); c.globalCompositeOperation = 'lighter';
      const cg = c.createRadialGradient(0, -20, 4, 0, -20, 70);
      cg.addColorStop(0, 'rgba(160,230,255,0.5)'); cg.addColorStop(1, 'rgba(120,200,255,0)');
      c.fillStyle = cg; c.beginPath(); c.arc(0, -20, 70, 0, 7); c.fill();
      c.restore();
    } else if (b.st === 'restlow') {
      // wings spent: down in claw range, head drooped, the core banked down
      // to embers — everything about the pose says WINDOW. Right before she
      // commits to rising, one test-flap checks the wings still answer.
      const br = Math.sin(t * 2.4);
      c.rotate(0.07 + br * 0.012);
      c.scale(1, 1 + br * 0.022);
      const tf = (b.t != null && b.t < 0.5) ? Math.sin(Math.PI * (1 - b.t / 0.5)) * 0.75 : 0;
      if (tf > 0.04) { egFigA(c, 'pIdle', 1 - tf, 0); egFigA(c, 'pDown', tf, -0.04 * tf); }
      else egFigA(c, 'pIdle', 1, 0);
      egChestGlow(c, 0.13 + Math.max(0, br) * 0.15);
    } else if (b.st === 'rise') {
      // three deliberate, heavy beats to climb back to the cable, the core
      // re-igniting stroke by stroke
      egFlap(c, b._stT || 0, 15.7, 0, true);
      egChestGlow(c, 0.35 + Math.min(0.5, (b._stT || 0) * 0.45));
    } else {
      // rest descent: laboured, slow strokes on the way down to the perch
      egFlap(c, t, 5, 0, true);
      egChestGlow(c, 0.45);
    }
    c.restore();
    return true;
  } catch (e) { c.restore(); return false; }
}

// metallic feather projectile: the sheet's own art, rotated to its velocity
function drawFeather(c, pr) {
  const im = eagleImg(); if (!im || !im.naturalWidth) return false;
  try {
    const s = EAGLE_P[Math.abs(pr.vx) + Math.abs(pr.vy) > 460 ? 'fea1' : 'fea0'];
    c.save();
    c.translate(pr.x, pr.y);
    c.rotate(Math.atan2(pr.vy, pr.vx) + Math.PI);   // art points left, trail behind
    c.shadowColor = '#ff4c5c'; c.shadowBlur = 10;
    const k = 0.42;
    c.drawImage(im, s[0], s[1], s[2], s[3], -s[2] * k * 0.5, -s[3] * k * 0.5, s[2] * k, s[3] * k);
    c.restore();
    return true;
  } catch (e) { return false; }
}

// the flock: every flying minion is a small TALONHOST — the same authored
// flip-book frames at a smaller scale; talons only, no feathers
function drawEagleMini(c, e) {
  EG_PURE = false;
  const im = eagleImg(); if (!im || !im.naturalWidth) return false;
  c.save();
  try {
    const S = (e.w * 3.2) / 532;
    c.translate(e.x + e.w / 2, e.y + e.h / 2);
    c.scale(S, S);
    if (e.hurtT > 0) c.globalAlpha = 0.72;
    if (e.hypnoT > 0) c.globalAlpha = 0.85;
    const diving = (e.vy || 0) > 120;
    if (diving) egFigA(c, 'pDown', 1, Math.sign(e.vx || 1) * 0.3);
    else egFlap(c, e.anim, 9, 0);
    c.restore();
    return true;
  } catch (e2) { c.restore(); return false; }
}
