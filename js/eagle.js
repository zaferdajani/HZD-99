// BOSS 01 — TALONHOST, the virus-infected robot eagle. And its flock.
//
// Assembled from the authored parts sheet: body, head, tail, ceiling mount,
// talons, and three-segment wings (upper / lower / tip) that flap as chained
// rotations. The feather-volley special uses the sheet's own CHARGE / FIRE /
// RECOVER figures, and the projectile feathers are the sheet's metallic
// feather art riding the game's projectile system.
const EAGLE_P = {
  eHead: [6, 6, 85, 107], eBody: [97, 6, 105, 134],
  eWingU: [208, 6, 181, 107], eWingL: [395, 6, 147, 90], eWingT: [548, 6, 73, 70],
  eTail: [627, 6, 98, 129], eMount: [731, 6, 109, 98], eTalon: [846, 6, 97, 90],
  eFull: [949, 6, 532, 313],
  pIdle: [6, 325, 173, 155], pDown: [185, 325, 188, 204],
  pUp: [379, 325, 182, 195], pShoot: [567, 325, 252, 157],
  kCharge: [825, 325, 228, 128], kFire: [1059, 325, 210, 116], kRecover: [1275, 325, 204, 119],
  fea0: [6, 535, 62, 30], fea1: [74, 535, 125, 34], fea2: [205, 535, 136, 33],
};
const EAGLE_F = 2.11;             // example/attack panel scale -> master scale
// wing assembly knobs, exposed for auditor calibration
const EAGLE_TUNE = { wingY: -28, warnBase: 0.22, warnFold: 0.05, lx: -76, ly: 20 };

function eagleImg() { return typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.eagleParts; }

function egPart(c, key, px, py) {
  const s = EAGLE_P[key];
  c.drawImage(eagleImg(), s[0], s[1], s[2], s[3], -px, -py, s[2], s[3]);
}
// whole authored figure, centred on the body, panel scale lifted to master
function egFig(c, key, shake) {
  const s = EAGLE_P[key];
  const w = s[2] * EAGLE_F, h = s[3] * EAGLE_F;
  c.save();
  if (shake) c.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake * 0.6);
  c.drawImage(eagleImg(), s[0], s[1], s[2], s[3], -w / 2, -h * 0.52, w, h);
  c.restore();
}

// one wing: three segments chained from the shoulder, lagged flap.
// Local space faces the wing LEFT (authored); caller mirrors for the right.
function egWing(c, baseA, flap, lag, fold) {
  fold = fold || 0;
  c.save();
  c.translate(-2, EAGLE_TUNE.wingY);          // socket buried in the shoulder
  c.rotate(baseA + flap);
  egPart(c, 'eWingU', 178, 26);
  c.translate(EAGLE_TUNE.lx, EAGLE_TUNE.ly);
  c.rotate(flap * 0.7 + lag + fold);
  egPart(c, 'eWingL', 144, 20);
  c.translate(-108, 16);
  c.rotate(flap * 0.9 + lag * 1.4 + fold * 0.8);
  egPart(c, 'eWingT', 68, 14);
  c.restore();
}

// pose: wings base angle (0 spread level, + droops down, - sweeps up),
// flap amplitude & speed, talon splay, tail sway, glow
function eaglePose(b) {
  const t = b.anim, st = b.st;
  const P = { base: -0.3, fold: 0, flapAmp: 0.1, flapSpd: 2.2, talon: 0, tailA: Math.sin(t * 1.8) * 0.1, glow: 0.6, shake: 0 };
  if (b.dead) {
    const k = 1 - Math.max(0, Math.min(1, (b.deathAnimT || 0) / 1.6));
    P.base = -0.6 - 0.25 * k; P.fold = -0.45; P.flapAmp = 0.02; P.talon = 0.5;
    P.glow = Math.max(0, 0.5 - k * 0.5) * (0.5 + Math.sin(t * 26) * 0.5);
  } else if (st === 'volley') {
    P.base = 0.05; P.flapAmp = 0.16; P.flapSpd = 3.2; P.glow = 1.2;
  } else if (st === 'swoopwarn') {
    P.base = EAGLE_TUNE.warnBase; P.fold = EAGLE_TUNE.warnFold; P.flapAmp = 0.06; P.talon = 0.9; P.glow = 1.4; P.shake = 2;
  } else if (st === 'swoop') {
    P.base = 0.5; P.fold = 0.2; P.flapAmp = 0.05; P.flapSpd = 1.2; P.talon = 1; P.glow = 1.4;
  } else if (st === 'rest' || st === 'restlow') {
    P.base = -0.6; P.fold = -0.45; P.flapAmp = 0.04; P.flapSpd = 1.4; P.glow = 0.35;
  } else {
    P.base = -0.5; P.fold = -0.35; P.flapAmp = 0.1; P.flapSpd = 2.2;   // free hover fallback
  }
  return P;
}

function eagleDraw(c, b, P, anchored) {
  c.save();
  c.scale(1.22, 1.22);            // parts panel is smaller than the master figure
  const t = b.anim;
  const flap = Math.sin(t * P.flapSpd * Math.PI) * P.flapAmp;
  if (P.shake) c.translate((Math.random() - 0.5) * P.shake, 0);
  // wings behind everything
  const lag = Math.sin(t * P.flapSpd * Math.PI - 0.7) * P.flapAmp;
  egWing(c, P.base, flap, lag, P.fold);
  c.save(); c.scale(-1, 1);
  egWing(c, P.base, flap, lag, P.fold);
  c.restore();
  // tail below, swaying
  c.save(); c.translate(0, 42); c.rotate(P.tailA);
  egPart(c, 'eTail', 49, 10); c.restore();
  // body
  egPart(c, 'eBody', 52, 67);
  // talons: splay open when hunting
  for (const sg of [-1, 1]) {
    c.save(); c.scale(sg, 1);
    c.translate(20, 54); c.rotate(P.talon * 0.35);
    egPart(c, 'eTalon', 48, 14);
    c.restore();
  }
  // head over the chest
  c.save(); c.translate(0, -46);
  egPart(c, 'eHead', 42, 44);
  // sensor glow: crimson core in the chest + eyes, breathing with the state
  if (P.glow > 0.05) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const eg2 = c.createRadialGradient(0, 22, 2, 0, 22, 30 * P.glow);
    eg2.addColorStop(0, 'rgba(255,120,130,' + Math.min(0.85, 0.5 * P.glow) + ')');
    eg2.addColorStop(1, 'rgba(200,30,50,0)');
    c.fillStyle = eg2;
    c.beginPath(); c.arc(0, 22, 30 * P.glow, 0, 7); c.fill();
    c.restore();
  }
  c.restore();
  // the ceiling mount + cable, only while it hangs at home
  if (anchored) {
    c.save();
    c.strokeStyle = '#3a4048'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, -240); c.lineTo(0, -128); c.stroke();
    c.translate(0, -122);
    egPart(c, 'eMount', 54, 10);
    c.restore();
  }
  c.restore();
}

function drawEagle(c, b) {
  const im = eagleImg(); if (!im || !im.naturalWidth) return false;
  c.save();
  try {
    const S = (b.w * 3.0) / 532;
    const cx = b.x + b.w / 2;
    let cy = b.y + b.h / 2;
    // death: the machine drops out of the air onto the floor
    if (b.dead) {
      const k = 1 - Math.max(0, Math.min(1, (b.deathAnimT || 0) / 1.6));
      const floor = 15 * TILE - b.h / 2 - 6;
      cy = cy + (floor - cy) * k * k;
    }
    c.translate(cx, cy);
    c.scale(S, S);
    if (b.hurtT > 0) c.globalAlpha = 0.72;
    const P = eaglePose(b);
    const anchored = !b.dead && (b.st === 'idle' || b.st === 'dorm' || b.st === 'intro' || b.st === 'volley');
    // anchored idle IS the sheet's own hanging figure (mount included),
    // swaying on its cable — the artwork, not an imitation of it
    if (!b.dead && (b.st === 'idle' || b.st === 'dorm' || b.st === 'intro')) {
      const sway = Math.sin(b.anim * 1.3) * 0.03;
      c.strokeStyle = '#3a4048'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(0, -300); c.lineTo(0, -158); c.stroke();
      c.rotate(sway);
      const s2 = EAGLE_P.pIdle, w2 = s2[2] * EAGLE_F, h2 = s2[3] * EAGLE_F;
      c.drawImage(eagleImg(), s2[0], s2[1], s2[2], s2[3], -w2 / 2, -h2 * 0.5 - 4, w2, h2);
      // sensor glow breathing on the chest
      c.save(); c.globalCompositeOperation = 'lighter';
      const gg = c.createRadialGradient(0, 26, 2, 0, 26, 26);
      gg.addColorStop(0, 'rgba(255,120,130,' + (0.3 + Math.sin(b.anim * 3) * 0.15).toFixed(2) + ')');
      gg.addColorStop(1, 'rgba(200,30,50,0)');
      c.fillStyle = gg; c.beginPath(); c.arc(0, 26, 26, 0, 7); c.fill();
      c.restore();
      c.restore();
      return true;
    }
    // the volley plays the sheet's own attack sequence
    if (!b.dead && b.st === 'volley') {
      const held = b.t || 0;
      const fig = b.fired ? (held < 0.35 ? 'kRecover' : 'kFire') : 'kCharge';
      egFig(c, fig, fig === 'kCharge' ? 2.4 : 0);
      if (anchored) {
        c.strokeStyle = '#3a4048'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(0, -260); c.lineTo(0, -138); c.stroke();
        c.save(); c.translate(0, -132); egPart(c, 'eMount', 54, 10); c.restore();
      }
    } else {
      eagleDraw(c, b, P, anchored);
    }
    c.restore();
    return true;
  } catch (e) { c.restore(); return false; }
}

// metallic feather projectile: the sheet's own art, rotated to its velocity.
// Rides the Proj system — this only replaces the look.
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

// the flock: every flying minion is a small version of him (no feathers —
// they only dive in and rake with their talons)
function drawEagleMini(c, e) {
  const im = eagleImg(); if (!im || !im.naturalWidth) return false;
  c.save();
  try {
    const S = (e.w * 2.6) / 532;
    c.translate(e.x + e.w / 2, e.y + e.h / 2);
    c.scale(S, S);
    if (e.hurtT > 0) c.globalAlpha = 0.72;
    if (e.hypnoT > 0) c.globalAlpha = 0.85;
    const diving = (e.vy || 0) > 120;
    const fake = { anim: e.anim, st: diving ? 'swoop' : 'x', t: 0, dead: false, deathAnimT: 0 };
    const P = eaglePose(fake);
    P.flapSpd = 5.5; P.flapAmp = diving ? 0.06 : 0.3; P.glow = 0.5;
    if (diving) c.rotate(Math.sign(e.vx || 1) * 0.2);
    eagleDraw(c, fake, P, false);
    c.restore();
    return true;
  } catch (e2) { c.restore(); return false; }
}
