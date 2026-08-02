// BOSS 01 — TALONHOST, the virus-infected robot eagle. And its flock.
//
// Every rendered state IS an authored figure from the sheet — the hanging
// idle on its mount, the WINGS DOWN / WINGS UP flip-book frames for flight,
// the CHARGE / FIRE / RECOVER attack sequence, the metallic feather art as
// projectiles. This code never invents anatomy: it only picks the authored
// frame, aligns frames on the glowing chest core so nothing jumps, and adds
// rigid motion (sway, bob, dive rotation) plus glow and wind.
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

function eagleImg() { return typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.eagleParts; }

// each figure is registered on its glowing chest core, found by scanning the
// art itself — so alternating frames stay locked to one another
function eagleAnchors() {
  if (EAGLE_CACHE.anchors) return EAGLE_CACHE.anchors;
  const im = eagleImg(); if (!im || !im.naturalWidth) return null;
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

// flight: the sheet's own wings-down / wings-up frames alternating, with a
// short cross-blend at the switch that reads as the wing sweeping through
function egFlap(c, t, spd, rot) {
  const k = (Math.sin(t * spd) + 1) / 2;
  const bob = Math.cos(t * spd) * 7;
  c.save(); c.translate(0, bob);
  if (k < 0.35) egFigA(c, 'pDown', 1, rot);
  else if (k > 0.65) egFigA(c, 'pUp', 1, rot);
  else {
    const m = (k - 0.35) / 0.3;
    egFigA(c, 'pDown', 1 - m, rot);
    egFigA(c, 'pUp', m, rot);
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

function drawEagle(c, b) {
  const im = eagleImg(); if (!im || !im.naturalWidth) return false;
  c.save();
  try {
    const S = (b.w * 3.0) / 532;
    const cx = b.x + b.w / 2;
    let cy = b.y + b.h / 2;
    if (b.dead) {
      // drops out of the air onto the floor
      const k = 1 - Math.max(0, Math.min(1, (b.deathAnimT || 0) / 1.6));
      const floor = 15 * TILE - b.h / 2 - 10;
      cy = cy + (floor - cy) * k * k;
    }
    c.translate(cx, cy);
    c.scale(S, S);
    if (b.hurtT > 0) c.globalAlpha = 0.72;
    const t = b.anim;
    if (b.dead) {
      // powered down on the ground, light out, listing to one side
      const k = 1 - Math.max(0, Math.min(1, (b.deathAnimT || 0) / 1.6));
      egFigA(c, 'pRest', 1, 0.35 * k);
    } else if (b.st === 'idle' || b.st === 'dorm' || b.st === 'intro') {
      // the sheet's hanging figure, swaying on its ceiling cable
      const sway = Math.sin(t * 1.3) * 0.03;
      c.strokeStyle = '#3a4048'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(0, -300); c.lineTo(0, -100); c.stroke();
      c.rotate(sway);
      egFigA(c, 'pIdle', 1, 0);
      egChestGlow(c, 0.55 + Math.sin(t * 3) * 0.2);
    } else if (b.st === 'volley') {
      // authored CHARGE -> FIRE -> RECOVER
      const held = b.t || 0;
      const fig = b.fired ? (held < 0.35 ? 'kRecover' : 'kFire') : 'kCharge';
      egFigA(c, fig, 1, 0);
      if (fig === 'kCharge') egChestGlow(c, 1.1 + Math.sin(t * 14) * 0.3);
    } else if (b.st === 'swoop') {
      // wings-down stoop, nose rotated into the dive
      const rot = Math.max(-0.5, Math.min(0.5, (b.vx || 0) / 1600));
      egFigA(c, 'pDown', 1, rot);
      egChestGlow(c, 1.2);
    } else if (b.st === 'swoopwarn') {
      // agitated hover, locking on
      c.translate((Math.random() - 0.5) * 2.4, 0);
      egFlap(c, t, 11, 0);
      egChestGlow(c, 1.3 + Math.sin(t * 16) * 0.3);
    } else if (b.st === 'broodcall') {
      // BROOD CALL: the screech — thrown back on the cable, chest strobing
      c.strokeStyle = '#3a4048'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(0, -300); c.lineTo(0, -100); c.stroke();
      c.rotate(-0.16 + Math.sin(t * 22) * 0.02);
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
      // wings spent: down in claw range, breathing hard (the sheet keeps the
      // mount on the creature in every frame, so it stays)
      c.scale(1, 1 + Math.sin(t * 5) * 0.02);
      egFigA(c, 'pIdle', 1, 0);
      egChestGlow(c, 0.3);
    } else {
      // rest descent / rise: honest flapping between the authored frames
      egFlap(c, t, b.st === 'rest' ? 5 : 7, 0);
      egChestGlow(c, 0.6);
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
