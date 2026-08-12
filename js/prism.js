// ===========================================================================
// THE PRISM PROWLER — boss 5, the rival robo-cat. The one machine the network
// never indexed, so the broadcast never touched it: no virus, no wear, no
// crimson. A sleek cat chassis with a faceted crystal torso riding a glowing
// TURNTABLE — a disc it literally turns on, which is how it changes facing.
//
// Shape language: triangles over a long horizontal silhouette (danger, speed).
// Palette: cyan #37ffd0 (emissive), arc-violet #b48cff, prism white #e0e0ff,
// body #2a2a4a. Emissive is rationed: the eyes, the disc engravings, and the
// prism tail-tip that splits white light into a tiny spectrum. One deliberate
// asymmetry: the near ear has a chipped facet.
//
// Authored nose-LEFT, ground y=0, origin under the disc centre — same local
// convention as every other machine. drawPrism(c, b) returns true when it
// drew, so Boss.draw can keep its fallback chain.
// ===========================================================================

// ---------------------------------------------------------------------------
// AUTHORED ATLAS. The owner's PRISM sheet carries both halves of the character:
// the virus-lit red cat it fights as, and the clear blue cat underneath. That
// means the purification needs no hue remap here — it simply changes which half
// of the sheet we read from, which is why this boss looks right where a tinted
// copy of the infected art never would.
//
// Rects are [sx, sy, sw, sh] into assets/characters/prism_parts.png, with an
// optional 5th flag for the handful the artist drew facing left. Everything
// else is nose-RIGHT and gets mirrored on facing.
// ---------------------------------------------------------------------------
const PRZ_FR = {
  i_dorm: [[702, 739, 186, 81], [543, 739, 157, 82]],
  i_idle: [[592, 165, 106, 118], [425, 295, 146, 113]],
  i_walk: [[849, 295, 135, 110], [573, 295, 118, 113], [317, 295, 106, 114], [834, 165, 95, 117], [700, 165, 132, 118], [124, 526, 154, 105]],
  i_run: [[166, 295, 149, 115], [693, 295, 154, 113], [356, 414, 159, 109], [583, 635, 174, 96]],
  i_roar: [[210, 2, 118, 145], [506, 2, 187, 133], [695, 2, 160, 129]],
  i_slash: [[2, 2, 206, 161]],
  i_burst: [[177, 165, 217, 123]],
  i_beam: [[330, 2, 174, 142, 1]],
  i_spin: [[2, 165, 173, 128]],
  i_hurt: [[396, 165, 194, 120]],
  i_death: [[2, 835, 208, 79]],
  p_idle: [[442, 526, 112, 104], [187, 635, 120, 101]],
  p_walk: [[641, 414, 147, 107], [2, 414, 114, 110], [118, 414, 105, 110], [225, 414, 129, 110], [790, 414, 140, 107], [517, 414, 122, 108]],
  p_run: [[704, 526, 122, 103], [2, 526, 120, 107], [828, 526, 141, 102], [173, 739, 189, 91]],
  p_play: [[280, 526, 160, 105], [556, 526, 146, 104], [2, 635, 183, 102], [309, 635, 152, 100], [463, 635, 118, 98], [364, 739, 177, 88]],
  p_stretch: [[2, 739, 169, 94], [759, 635, 153, 95]],
  p_loaf: [[212, 835, 128, 75]],
  p_turn: [[2, 295, 162, 117]],
};
// the standing reference the artist drew at: every frame shares one world
// scale off this, so a lying cat stays smaller than a rearing one
const PRZ_REF_H = 118;

function przImg() {
  const im = (typeof MEDIA_IMG !== 'undefined') ? ((typeof softArt === 'function' && softArt('prismParts')) || MEDIA_IMG.prismParts) : null;
  return (im && im.naturalWidth) ? im : null;
}

// which drawing the cat is in right now
function przClip(b) {
  const t = b.anim || 0, st = b.st, R = PRZ_FR;
  const seq = (a, hz) => a[Math.floor(Math.abs(t) * hz) % a.length];
  const spd = Math.abs(b.vx || 0);

  if (b.purified) {
    // THE HANDOFF. Her film ends with the freed cat rolled onto its back,
    // paws in the air, batting at its own tail crystal — so the game comes out
    // of the cutscene in exactly that pose and holds it before drifting into
    // the normal idle. A cut is invisible when both sides of it agree.
    const pt = b.pureT || 0;
    if (pt < 0.5) return R.p_turn[0];        // body cleared, tail still red
    if (pt < 3.2) return seq(R.p_play, 3.4); // belly-up, exactly where the film left off
    if (spd > 240) return seq(R.p_run, 11);
    if (spd > 34) return seq(R.p_walk, 9);
    // left alone it behaves like a cat with nothing left to guard: it rolls on
    // its back batting at its own tail crystal, stretches, then loafs
    const cyc = (t * 1) % 17;
    if (cyc < 4.6) return seq(R.p_play, 3.6);
    if (cyc < 6.4) return seq(R.p_stretch, 2.4);
    if (cyc < 10) return R.p_loaf[0];
    return seq(R.p_idle, 1.3);
  }
  if (b.dead) return R.i_death[0];
  if ((b.stagT || 0) > 0) return R.i_hurt[0];
  if (st === 'dorm') return seq(R.i_dorm, 0.42);
  if (st === 'intro') return seq(R.i_roar, 5.5);
  if (st === 'arcspin') return R.i_spin[0];
  if (st === 'dashslash') return R.i_slash[0];
  if (st === 'lsvanish' || st === 'lsarrive') return R.i_burst[0];
  if (st === 'beam' || st === 'aim') return R.i_beam[0];
  if (st === 'pounce') return seq(R.i_run, 12);
  if (spd > 240) return seq(R.i_run, 12);
  if (spd > 34) return seq(R.i_walk, 9);
  return seq(R.i_idle, 1.5);
}

// Authored-art path. Returns false when the sheet has not decoded yet, so the
// procedural cat below keeps the boss on screen from the very first frame.
function drawPrismSheet(c, b) {
  const im = przImg(); if (!im) return false;
  const f = przClip(b); if (!f) return false;
  const [sx, sy, sw, sh, art] = f;

  const cx = b.x + b.w / 2, footY = b.y + b.h;
  const fv = b.faceVis == null ? (b.face || 1) : b.faceVis;
  const ta = Math.max(0.001, Math.abs(fv));
  const dir = (fv < 0 ? -1 : 1) * (art ? -1 : 1);   // sheet is nose-RIGHT
  // PRISM's hitbox is the smallest of any boss — it is a fast rival cat, not a
  // siege engine — so the art is drawn well proud of it. The tail crystal sits
  // in the upper part of every frame, which is why the reference height buys
  // less body than the number suggests.
  const S = (b.h * 1.95) / PRZ_REF_H;
  const dw = sw * S, dh = sh * S;

  // breath and the settle after a landing, in world pixels
  const bob = (b.st === 'dorm' || b.dead) ? 0 : Math.sin((b.anim || 0) * 2.2) * 1.2;

  c.save();
  // contact shadow, so a painted sprite still sits on the floor
  c.save();
  c.globalAlpha = 0.32; c.fillStyle = '#000';
  c.beginPath(); c.ellipse(cx, footY - 1, dw * 0.30, dh * 0.055, 0, 0, 7); c.fill();
  c.restore();

  c.translate(cx, footY + bob);
  // the turn is a real squash through the vertical, matching the turntable
  c.scale(dir * (0.88 + 0.12 * ta), 1);
  c.drawImage(im, sx, sy, sw, sh, -dw / 2, -dh, dw, dh);

  // the hit frame: the crystal takes the light straight through, so the whole
  // cat lifts towards white for an instant, punched through its own alpha
  const hurt = b.hurtT || 0;
  if (hurt > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = Math.min(0.7, hurt * 3.5);
    c.drawImage(im, sx, sy, sw, sh, -dw / 2, -dh, dw, dh);
    c.restore();
  }
  c.restore();
  return true;
}

const PRZ = {
  // crystal body: cool indigo ramp, hue-shifted (never black-mixed)
  body:  { lit: '#a8aee2', mid: '#565b96', dark: '#2a2a4a', deep: '#131328' },
  // prism white: the facet material that catches the light
  white: { lit: '#ffffff', mid: '#e0e0ff', dark: '#8d90c4', deep: '#40426a' },
  // arc violet: coils, facet seams, inner ear
  viol:  { lit: '#e6d8ff', mid: '#b48cff', dark: '#6a4bb8', deep: '#2c1d58' },
  // clean cyan: the only boss whose light was never corrected
  cyan:  { lit: '#d8fff4', mid: '#37ffd0', dark: '#14a184', deep: '#063a30' },
};
const PRZ_SPEC = ['#ff5e6a', '#ffc95e', '#7dff9a', '#37ffd0', '#5ea8ff', '#b48cff'];

// ---- torso facet mesh: vertices then triangles, so the crystal is a real
// faceted solid whose planes catch the light at different ramp angles.
// Long and LOW, but carried clear of the disc so the legs read. ----
const PRZ_V = [
  [-26, -18], [-4, -16], [18, -17],            // 0-2 keel: chest low, belly, rear
  [-31, -27], [-7, -25], [25, -26],            // 3-5 midline
  [-23, -34], [1, -37], [19, -34],             // 6-8 spine: shoulder, arch, haunch
  [29, -20],                                   // 9 haunch point (rear silhouette break)
];
const PRZ_F = [
  [3, 0, 1], [3, 1, 4], [4, 1, 2], [4, 2, 5],
  [3, 4, 6], [6, 4, 7], [7, 4, 5], [7, 5, 8],
  [5, 2, 9], [8, 5, 9],
];

// slow cat blink: mostly open, a 0.24s sweep every ~3.5s
function przBlink(t) {
  const c2 = (t % 3.5);
  return c2 < 0.24 ? 1 - 0.94 * Math.sin(c2 / 0.24 * Math.PI) : 1;
}

// one jagged arc of coil lightning between two points
function przBolt(c, x0, y0, x1, y1, seed, amp, alpha) {
  c.save(); c.globalCompositeOperation = 'lighter';
  c.globalAlpha *= alpha;
  c.strokeStyle = PRZ.cyan.lit; c.lineWidth = 1.2;
  c.shadowColor = PRZ.cyan.mid; c.shadowBlur = 7;
  c.beginPath(); c.moveTo(x0, y0);
  for (let i = 1; i < 7; i++) {
    const k = i / 7;
    const nx = x0 + (x1 - x0) * k + Math.sin(seed * 37 + i * 9.7) * amp;
    const ny = y0 + (y1 - y0) * k + Math.cos(seed * 51 + i * 7.3) * amp;
    c.lineTo(nx, ny);
  }
  c.lineTo(x1, y1); c.stroke();
  c.shadowBlur = 0; c.restore();
}

// ---- pose: every state resolved into a small set of numbers ----
function przPose(b) {
  const t = b.anim, st = b.st;
  const P = {
    bob: Math.sin(t * 2.2) * 1.4, crouch: 0, pitch: 0,
    stretchX: 1, stretchY: 1, spin: 0,
    headA: 0, headUp: 0, earFlat: 0, eyeK: przBlink(t), pupilW: 1,
    tailLift: 0.6 + Math.sin(t * 1.6) * 0.12, tailWave: Math.sin(t * 2.3) * 3,
    facetK: 1, glow: 0.7, pant: 0, groom: 0, sit: 0, lick: 0,
    legs: [0, 0, 0, 0],                       // fore-near, fore-far, hind-near, hind-far
    discSpin: 0.9, rings: 0, coil: 0.12, sprawl: 0,
  };
  if (b.dead) return P;
  if (b.stagT > 0) {
    // fell off the disc after the storm: flat on its side, light guttering
    P.sprawl = 1; P.crouch = 13; P.stretchY = 0.72; P.pitch = 0.05;
    P.headA = 0.35; P.eyeK = 0.15; P.facetK = 0.5; P.glow = 0.25;
    P.tailLift = 0.02; P.tailWave = Math.sin(t * 1.1) * 1.5;
    P.discSpin = 0.2; P.pant = 1; P.bob = 0;
    P.legs = [-0.8, 0.9, 1, 1];
    return P;
  }
  if (st === 'dorm') {
    // pre-fight: an actual cat. It alternates grooming and a weight-shifted
    // sit, and never looks like it is waiting for a fight to start.
    const cyc = t % 11;
    if (cyc < 4.2) {                          // groom: paw up, head down, licking
      const k = Math.min(1, cyc / 0.5, (4.2 - cyc) / 0.5);
      P.groom = k; P.lick = Math.max(0, Math.sin(t * 7)) * k;
      P.headA = 0.38 * k + Math.sin(t * 7) * 0.05 * k;
      P.legs[0] = -1.3 * k;                   // near forepaw raised to the cheek
      P.crouch = 2 * k;
    } else {                                  // sit: haunch settles, chest rises
      const k = Math.min(1, (cyc - 4.2) / 0.9);
      P.sit = k; P.crouch = 2 * k;
      P.tailLift = 0.06; P.tailWave = Math.sin(t * 1.3) * 2;
      P.headUp = 3 * k;
    }
    P.discSpin = 0.35; P.glow = 0.45;
    return P;
  }
  if (st === 'intro') {
    P.crouch = 2; P.headA = -0.06; P.glow = 1;
    P.tailLift = 1.05; P.tailWave = Math.sin(t * 9) * 4;
    P.discSpin = 3;
    return P;
  }
  if (st === 'idle') {
    P.glow = 0.85;
    P.tailWave = Math.sin(t * 5) * 3.5;       // tail cutting the air: intent
    if ((b.t || 0) < 0.16) {                  // anticipation: flatten before striking
      P.crouch = 5; P.stretchY = 0.9; P.stretchX = 1.05; P.earFlat = 0.55;
      P.pupilW = 0.5;
    }
    return P;
  }
  if (st === 'dashslash') {
    // flatten, then the whole cat SPINS on its own axis — a blade of light
    const k = clamp(1 - (b.t || 0) / 0.42, 0, 1);
    P.spin = k * Math.PI * 4;
    P.stretchX = 1.1; P.stretchY = 0.8; P.crouch = 6;
    P.earFlat = 1; P.eyeK = 0.35; P.glow = 1.2;
    P.tailLift = 0.15; P.discSpin = 14; P.legs = [1.1, 1.1, 1.1, 1.1];
    return P;
  }
  if (st === 'pounce') {
    const dive = clamp((b.vy || 0) / 1300, -0.38, 0.42);
    P.pitch = dive; P.bob = 0; P.crouch = -2;
    P.legs = [-1, -0.8, 0.9, 0.75];           // forepaws reaching, hind driving
    P.earFlat = 1; P.glow = 1.1; P.pupilW = 0.5;
    P.tailLift = 1.15; P.tailWave = Math.sin(t * 10) * 3;
    P.stretchX = 1.06; P.discSpin = 5;
    return P;
  }
  if (st === 'rest') {
    // spent: panting vibration, facets dim, eyes half-lidded
    P.pant = 1; P.crouch = 6; P.eyeK = Math.min(P.eyeK, 0.45);
    P.facetK = 0.55; P.glow = 0.3; P.earFlat = 0.3;
    P.tailLift = 0.12; P.tailWave = Math.sin(t * 1.4) * 2;
    P.discSpin = 0.4;
    return P;
  }
  if (st === 'arcspin') {
    // the turntable screams up to speed under a cat pressed flat against it
    const k = clamp(1 - (b.t || 0) / 1.2, 0, 1);
    P.crouch = 9; P.stretchY = 0.84; P.earFlat = 1;
    P.eyeK = 1; P.pupilW = 0.4; P.glow = 1.3;
    P.discSpin = 2 + k * 42; P.rings = k; P.coil = 0.4 + k * 0.6;
    P.tailLift = 0.08; P.legs = [0.8, 0.8, 0.8, 0.8];
    return P;
  }
  if (st === 'arcstorm') {
    P.crouch = 10; P.stretchY = 0.8; P.earFlat = 1;
    P.eyeK = 1; P.pupilW = 0.35; P.glow = 1.4;
    P.discSpin = 48; P.rings = 1; P.coil = 1;
    P.tailLift = 0.06; P.legs = [0.8, 0.8, 0.8, 0.8];
    return P;
  }
  return P;
}

// sample the tail curve: two joined quadratics making a cat's S
function przTailPts(P) {
  const lift = P.tailLift, wob = P.tailWave, sit = P.sit;
  // root at the haunch; sitting wraps it low around the flank instead
  const p0 = [24, -24];
  const c1 = sit ? [34, -12] : [37, -22 + wob * 0.4];
  const m = sit ? [30, -8] : [41, -32 - lift * 8 + wob * 0.6];
  const c2 = sit ? [22, -6] : [44, -42 - lift * 10 + wob];
  const p1 = sit ? [12, -7] : [39, -50 - lift * 12 + wob * 1.4];
  const q = (a, b2, c3, k) => [
    (1 - k) * (1 - k) * a[0] + 2 * (1 - k) * k * b2[0] + k * k * c3[0],
    (1 - k) * (1 - k) * a[1] + 2 * (1 - k) * k * b2[1] + k * k * c3[1]];
  const pts = [];
  for (let i = 0; i <= 3; i++) pts.push(q(p0, c1, m, i / 3));
  for (let i = 1; i <= 3; i++) pts.push(q(m, c2, p1, i / 3));
  return pts;
}

// ---- the cat body, in authored (nose-left) local space ----
function przBody(c, b, P, fv) {
  const t = b.anim;
  const dim = P.facetK;

  // ---- tail first (behind the body): tapered S-curve to a prism tip ----
  {
    const pts = przTailPts(P);
    for (let i = 0; i < pts.length - 1; i++) {
      const k = i / (pts.length - 2);
      c.strokeStyle = k < 0.5 ? PRZ.body.dark : PRZ.viol.dark;
      c.lineWidth = 3.6 - k * 2.1; c.lineCap = 'round';
      c.beginPath(); c.moveTo(pts[i][0], pts[i][1]); c.lineTo(pts[i + 1][0], pts[i + 1][1]); c.stroke();
    }
    // the prism tip: a small crystal wedge that SPLITS light
    const tip = pts[pts.length - 1], prev = pts[pts.length - 2];
    const ta2 = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
    c.save(); c.translate(tip[0], tip[1]); c.rotate(ta2);
    c.fillStyle = ramp(c, PRZ.white, -2, -3, 3, 3, dim);
    c.beginPath(); c.moveTo(-2, -3); c.lineTo(4.5, 0); c.lineTo(-2, 3); c.closePath(); c.fill();
    // the split: a tiny spectrum fanning out of the point
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < PRZ_SPEC.length; i++) {
      const a = -0.5 + i / (PRZ_SPEC.length - 1);
      c.globalAlpha = (0.4 + Math.sin(t * 3 + i) * 0.15) * Math.max(0.35, P.glow);
      c.strokeStyle = PRZ_SPEC[i]; c.lineWidth = 1.3;
      c.beginPath(); c.moveTo(3.5, 0);
      c.lineTo(3.5 + Math.cos(a) * 6.5, Math.sin(a) * 6.5); c.stroke();
    }
    c.restore(); c.restore();
  }

  // ---- far legs (dimmer, behind the torso) ----
  przLeg(c, -18, -26, P.legs[1], P, 0.6, t, 1);
  przLeg(c, 16, -25, P.legs[3], P, 0.6, t, 3);

  // ---- faceted crystal torso ----
  const V = PRZ_V;
  // backing fill (deepest tone) so facet seams never show the background
  c.beginPath();
  c.moveTo(V[3][0], V[3][1]); c.lineTo(V[6][0], V[6][1]); c.lineTo(V[7][0], V[7][1]);
  c.lineTo(V[8][0], V[8][1]); c.lineTo(V[9][0], V[9][1]); c.lineTo(V[2][0], V[2][1]);
  c.lineTo(V[1][0], V[1][1]); c.lineTo(V[0][0], V[0][1]); c.closePath();
  c.fillStyle = PRZ.body.deep; c.fill();
  // each facet plane catches the light at its own angle — and the angle
  // breathes with facing and time, so the crystal glitters as he moves
  for (let i = 0; i < PRZ_F.length; i++) {
    const [a, bq, cq] = PRZ_F[i];
    const mx = (V[a][0] + V[bq][0] + V[cq][0]) / 3, my = (V[a][1] + V[bq][1] + V[cq][1]) / 3;
    const fa = i * 1.7 + fv * 0.9 + Math.sin(t * 1.1 + i * 2.1) * 0.35;
    const k = (0.42 + 0.58 * Math.max(0, Math.cos(fa))) * dim;
    const mat = i % 3 === 2 ? PRZ.viol : PRZ.body;
    c.fillStyle = ramp(c, mat, mx - Math.cos(fa) * 9, my - Math.sin(fa) * 9,
      mx + Math.cos(fa) * 9, my + Math.sin(fa) * 9, k);
    c.beginPath(); c.moveTo(V[a][0], V[a][1]); c.lineTo(V[bq][0], V[bq][1]);
    c.lineTo(V[cq][0], V[cq][1]); c.closePath(); c.fill();
  }
  // additive facet seams (never black-lined)
  c.save(); c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.15 * dim; c.strokeStyle = PRZ.white.mid; c.lineWidth = 0.8;
  for (const [a, bq, cq] of PRZ_F) {
    c.beginPath(); c.moveTo(V[a][0], V[a][1]); c.lineTo(V[bq][0], V[bq][1]);
    c.lineTo(V[cq][0], V[cq][1]); c.closePath(); c.stroke();
  }
  c.restore();
  // rim light: a short bright arc on the lit (upper-left) spine only, lost at
  // both ends — never a glass-dome outline
  c.save(); c.globalCompositeOperation = 'lighter';
  const rg = c.createLinearGradient(V[3][0], V[3][1], V[7][0], V[7][1]);
  rg.addColorStop(0, 'rgba(224,224,255,0)');
  rg.addColorStop(0.45, 'rgba(255,255,255,' + (0.5 * dim) + ')');
  rg.addColorStop(1, 'rgba(224,224,255,0)');
  c.strokeStyle = rg; c.lineWidth = 1.6; c.lineCap = 'round';
  c.beginPath(); c.moveTo(V[3][0] + 1, V[3][1]); c.lineTo(V[6][0], V[6][1] - 0.5);
  c.lineTo(V[7][0], V[7][1] - 0.5); c.stroke();
  c.restore();
  // panting: the flank vibrates
  if (P.pant) {
    c.save(); c.globalAlpha = 0.25 + Math.sin(t * 15) * 0.15;
    c.strokeStyle = PRZ.white.dark; c.lineWidth = 1;
    const pk = Math.sin(t * 14) * 1.4;
    c.beginPath(); c.moveTo(-8, -17 - pk); c.quadraticCurveTo(4, -14 - pk, 15, -18 - pk); c.stroke();
    c.restore();
  }

  // ---- near legs ----
  przLeg(c, -23, -26, P.legs[0], P, 1, t, 0);
  przLeg(c, 21, -25, P.legs[2], P, 1, t, 2);

  // ---- neck wedge: the head sits ON something, not beside it. Wide enough
  // that no background shows between the jaw and the chest. ----
  const hx = -29, hy = -36 - P.headUp;
  c.beginPath();
  c.moveTo(V[6][0] + 5, V[6][1] - 2);          // shoulder top
  c.lineTo(hx + 9, hy - 5);
  c.lineTo(hx - 2, hy + 10);
  c.lineTo(V[0][0] + 2, V[0][1] + 2);          // chest keel
  c.closePath();
  c.fillStyle = ramp(c, PRZ.body, hx, hy + 6, V[6][0], V[6][1], 0.9 * dim);
  c.fill();

  // ---- head: a wedge with concave cheeks, seated INTO the neck ----
  c.save();
  c.translate(hx, hy);
  c.rotate(P.headA);
  const HS = 1.3;                              // the head carries the character
  c.scale(HS, HS);
  // far ear first (rooted inside the skull)
  przEar(c, -3, -7.5, -0.22, 0.5 * dim, false, P.earFlat);
  // skull — lit clearly (it must never read darker than the torso)
  c.beginPath();
  c.moveTo(-13, 1);                            // nose tip
  c.quadraticCurveTo(-11, -5, -5, -8);         // muzzle bridge up
  c.lineTo(4, -9.5);                           // forehead
  c.quadraticCurveTo(10, -8, 11, -3);          // back of skull
  c.lineTo(9, 4);                              // jaw back
  c.quadraticCurveTo(2, 7, -3, 5.5);           // jowl
  c.quadraticCurveTo(-9, 5, -13, 1);           // concave cheek line to the nose
  c.closePath();
  const hgr = c.createLinearGradient(-11, -9, 8, 6);
  hgr.addColorStop(0, PRZ.body.lit); hgr.addColorStop(0.5, PRZ.body.mid); hgr.addColorStop(1, PRZ.body.dark);
  c.fillStyle = hgr;
  c.save(); if (dim < 1) c.globalAlpha *= 0.75 + dim * 0.25; c.fill(); c.restore();
  if (dim < 0.8) { c.fillStyle = 'rgba(19,19,40,' + (0.8 - dim) + ')'; c.fill(); }
  // cheek facet: a violet plane under the eye — structure, not sticker
  c.fillStyle = ramp(c, PRZ.viol, -8, 0, 2, 6, 0.55 * dim);
  c.beginPath(); c.moveTo(-10, 0.5); c.lineTo(-1, 0); c.lineTo(2, 5.5); c.quadraticCurveTo(-4, 6.5, -10, 0.5);
  c.closePath(); c.fill();
  // brow + muzzle plane breaks (additive, structural)
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 * dim;
  c.strokeStyle = PRZ.white.mid; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(-11, -3.5); c.lineTo(-4, -6.5); c.lineTo(4, -7.5); c.stroke();
  c.restore();
  // muzzle facet: prism white chin wedge
  c.fillStyle = ramp(c, PRZ.white, -13, 0, -6, 6, 0.85 * dim);
  c.beginPath(); c.moveTo(-13, 1); c.lineTo(-7, 1.5); c.lineTo(-5, 5.5); c.quadraticCurveTo(-9, 5, -13, 1);
  c.closePath(); c.fill();
  // nose: a tiny violet triangle
  c.fillStyle = PRZ.viol.mid;
  c.beginPath(); c.moveTo(-13.4, 0.2); c.lineTo(-10.6, -0.6); c.lineTo(-11, 1.8); c.closePath(); c.fill();
  // whiskers: three hair-thin light lines off the muzzle — pure cat
  c.save(); c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.35 * dim; c.strokeStyle = PRZ.white.mid; c.lineWidth = 0.5;
  for (let i = 0; i < 3; i++) {
    const wa = 0.12 + i * 0.24;
    c.beginPath(); c.moveTo(-9.5, 1.5 + i * 0.8);
    c.quadraticCurveTo(-14, 1 + i * 1.4 + wa, -18, 0.5 + i * 2.2 + wa * 2); c.stroke();
  }
  c.restore();
  // the licking tongue during grooming
  if (P.lick > 0.1) {
    c.save(); c.globalAlpha = P.lick * 0.9;
    c.fillStyle = PRZ.cyan.mid;
    c.beginPath(); c.ellipse(-11.5, 3.5 + P.lick * 2, 1.3, 2.4, 0.5, 0, 7); c.fill();
    c.restore();
  }
  // near ear — with the chipped facet (the one asymmetry)
  przEar(c, 4.5, -8, 0.14, dim, true, P.earFlat);
  // head rim, lit side only
  c.save(); c.globalCompositeOperation = 'lighter';
  const hg = c.createLinearGradient(-12, -6, 6, -9);
  hg.addColorStop(0, 'rgba(255,255,255,0)');
  hg.addColorStop(0.5, 'rgba(255,255,255,' + 0.45 * dim + ')');
  hg.addColorStop(1, 'rgba(255,255,255,0)');
  c.strokeStyle = hg; c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(-11, -4.5); c.quadraticCurveTo(-6, -8, 4, -9); c.stroke();
  c.restore();
  // THE EYE: wide, cyan, alive. Blinks slowly; pupil narrows when hunting.
  {
    const open = clamp(P.eyeK, 0.04, 1);
    c.save(); c.translate(-5.2, -2.6);
    c.scale(1, open);
    c.shadowColor = PRZ.cyan.mid; c.shadowBlur = 8 * P.glow;
    c.fillStyle = PRZ.cyan.mid;
    c.beginPath(); c.moveTo(-4.8, 0.2); c.quadraticCurveTo(-1, -3.8, 4.2, -0.7);
    c.quadraticCurveTo(0.5, 3.4, -4.8, 0.2); c.closePath(); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = PRZ.cyan.lit;
    c.beginPath(); c.arc(-1.6, -0.6, 1.2, 0, 7); c.fill();
    // slit pupil
    c.fillStyle = PRZ.body.deep;
    c.beginPath(); c.ellipse(0.5, 0, 0.8 * P.pupilW, 1.8, 0, 0, 7); c.fill();
    c.restore();
  }
  c.restore();
}

// one thin crystal leg: shoulder anchor, crystal knee joint, paw on the disc.
// bend < 0 raises the paw (grooming / pounce reach); bend > 0 folds it.
function przLeg(c, ax, ay, bend, P, depth, t, idx) {
  const near = depth >= 1;
  const groundY = -7 + Math.min(P.crouch, 6) * 0.3;
  c.save();
  if (!near) c.globalAlpha *= 0.7;
  const col = near ? PRZ.body.dark : PRZ.body.deep;
  const sway = P.sprawl ? (idx % 2 ? 1 : -1) : Math.sin(t * 1.8 + idx * 1.9) * 0.05;
  let kx, ky, px2, py2;
  if (P.sprawl) {                              // knocked flat: legs out sideways
    const d = idx < 2 ? -1 : 1;
    kx = ax + d * 6; ky = groundY - 2;
    px2 = ax + d * 12; py2 = groundY;
  } else if (bend < -0.5) {                    // raised: paw up toward the cheek
    const k = -bend;
    kx = ax - 3; ky = ay + 7 - k * 3;
    px2 = ax - 7 * k; py2 = ay + 6 - 11 * k;
    if (P.groom) py2 += Math.sin(t * 7) * 1.6; // the paw rides the licking rhythm
  } else if (bend > 0.5) {                     // folded flat (spin/crouch)
    kx = ax + 3; ky = groundY - 4;
    px2 = ax + (idx < 2 ? -5 : 5); py2 = groundY;
  } else {
    kx = ax + sway * 6 + bend * 5; ky = (ay + groundY) / 2 + 2;
    px2 = ax + sway * 9 + bend * 9; py2 = groundY;
    if (P.sit) {
      if (idx >= 2) { kx = ax + 5; ky = groundY - 3.5; px2 = ax + 1; py2 = groundY; }
      else { kx = ax - 1; ky = (ay + groundY) / 2; px2 = ax - 1; py2 = groundY; }
    }
  }
  c.strokeStyle = col; c.lineCap = 'round';
  c.lineWidth = near ? 2.7 : 2.1;
  c.beginPath(); c.moveTo(ax, ay + 3); c.lineTo(kx, ky); c.stroke();
  c.lineWidth = near ? 2.3 : 1.8;
  c.beginPath(); c.moveTo(kx, ky); c.lineTo(px2, py2); c.stroke();
  // crystal knee joint: a small quiet diamond (only the near legs sparkle)
  if (near) {
    c.save(); c.translate(kx, ky); c.rotate(0.785);
    c.globalAlpha *= 0.8;
    c.fillStyle = ramp(c, PRZ.white, -1.5, -1.5, 1.5, 1.5, 0.7 * P.facetK);
    c.fillRect(-1.5, -1.5, 3, 3);
    c.restore();
  }
  // paw wedge
  c.fillStyle = col;
  c.beginPath(); c.moveTo(px2 - 2.8, py2 + 1); c.lineTo(px2 + 3, py2 + 1);
  c.lineTo(px2 + 0.8, py2 - 2.4); c.closePath(); c.fill();
  c.restore();
}

// triangular crystal ear, concave outer edge, rooted INTO the skull;
// chip = the asymmetric bitten facet
function przEar(c, x, y, lean, k, chip, flat) {
  c.save();
  c.translate(x, y);
  c.rotate(lean + flat * 0.95);                // flattens back when aggressive
  const h = 13 * (1 - flat * 0.35);
  c.fillStyle = ramp(c, PRZ.body, -4, -h, 3, 2, Math.min(1, k * 1.15));
  c.beginPath();
  c.moveTo(-5, 2.5);                           // base buried in the skull
  if (chip) {                                  // chipped facet: a bitten apex
    c.quadraticCurveTo(-4, -h * 0.55, -1.8, -h);
    c.lineTo(0.9, -h * 0.6);                   // the notch
    c.lineTo(2.4, -h * 0.84);
  } else {
    c.quadraticCurveTo(-3.6, -h * 0.6, -0.8, -h);
  }
  c.quadraticCurveTo(2.8, -h * 0.42, 5, 3);    // concave inner slope down
  c.closePath(); c.fill();
  // inner-ear facet: violet
  c.fillStyle = ramp(c, PRZ.viol, -1, -h * 0.7, 2, 1, 0.85 * k);
  c.beginPath(); c.moveTo(-1.8, 1);
  c.quadraticCurveTo(-1.4, -h * 0.5, chip ? -0.7 : 0, -h * 0.78 + (chip ? h * 0.13 : 0));
  c.quadraticCurveTo(1.9, -h * 0.35, 3, 2);
  c.closePath(); c.fill();
  // lit outer edge, one short stroke
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4 * k;
  c.strokeStyle = PRZ.white.mid; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(-4.4, 1);
  c.quadraticCurveTo(-3.8, -h * 0.5, chip ? -1.8 : -0.8, -h * 0.96);
  c.stroke(); c.restore();
  c.restore();
}

// ---- the turntable: disc, engraved light lines, two arc coils ----
function przDisc(c, b, P, rot) {
  const t = b.anim;
  const RX = 34, RY = 8;
  // side wall (thickness)
  c.fillStyle = ramp(c, PRZ.body, -RX, -6, RX, 2, 0.8);
  c.beginPath();
  c.ellipse(0, -6, RX, RY, 0, 0, Math.PI);     // bottom half of top ellipse
  c.ellipse(0, -2, RX, RY, 0, Math.PI, 0, true);
  c.fill();
  c.fillStyle = PRZ.body.deep;
  c.beginPath(); c.ellipse(0, -2, RX, RY, 0, 0, Math.PI); c.fill();
  // top surface
  const tg = c.createLinearGradient(-RX, -14, RX, 0);
  tg.addColorStop(0, PRZ.body.mid); tg.addColorStop(0.55, PRZ.body.dark); tg.addColorStop(1, PRZ.body.deep);
  c.fillStyle = tg;
  c.beginPath(); c.ellipse(0, -6, RX, RY, 0, 0, 7); c.fill();
  // engraved rotating light lines: even segments riding the ellipse
  c.save(); c.globalCompositeOperation = 'lighter';
  const glow = Math.max(0.25, P.glow);
  for (let ring = 0; ring < 2; ring++) {
    const f = [0.52, 0.82][ring];
    const n = 6 + ring * 4;
    c.strokeStyle = PRZ.cyan.mid; c.lineWidth = ring === 1 ? 1.5 : 1.1;
    c.globalAlpha = 0.22 + 0.3 * glow;
    for (let i = 0; i < n; i++) {
      const a0 = rot * (1 + ring * 0.18) + i / n * Math.PI * 2;
      c.beginPath();
      c.ellipse(0, -6, RX * f, RY * f, 0, a0, a0 + 3.6 / n); c.stroke();
    }
  }
  // spindle light under the cat
  c.globalAlpha = 0.5 * glow;
  c.fillStyle = PRZ.cyan.mid;
  c.beginPath(); c.ellipse(0, -6, 2.5, 1, 0, 0, 7); c.fill();
  // front rim glow arc
  c.globalAlpha = 0.5 * glow;
  c.strokeStyle = PRZ.cyan.mid; c.lineWidth = 1.6;
  c.beginPath(); c.ellipse(0, -2, RX, RY, 0, 0.5, Math.PI - 0.5); c.stroke();
  c.restore();
  // spin blur rings (arcspin / arcstorm)
  if (P.rings > 0.02) {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      c.globalAlpha = P.rings * (0.3 - i * 0.08) * (0.7 + Math.sin(t * 30 + i * 2) * 0.3);
      c.strokeStyle = i === 1 ? PRZ.white.mid : PRZ.cyan.mid;
      c.lineWidth = 2.5 - i * 0.6;
      c.beginPath(); c.ellipse(0, -6, RX + 3 + i * 5, RY + 1.5 + i * 2, 0, 0, 7); c.stroke();
    }
    c.restore();
  }
  // ---- the two arc coils, outboard on the disc, behind the cat ----
  for (const sx of [-1, 1]) {
    const bx = sx * (RX - 3), by = -5;
    c.save(); c.translate(bx, by);
    occl(c, 0, 1, 4, 2, 0.4);
    c.fillStyle = ramp(c, PRZ.body, -1.5, -10, 1.5, 0, 0.85);
    c.fillRect(-1.4, -10, 2.8, 10);
    for (let i = 0; i < 3; i++) {              // violet coil windings
      c.fillStyle = ramp(c, PRZ.viol, -3, -4 - i * 2.6, 3, -2.5 - i * 2.6, 0.7);
      c.beginPath(); c.ellipse(0, -3.6 - i * 2.6, 3, 1.3, 0, 0, 7); c.fill();
    }
    c.fillStyle = PRZ.white.dark;              // the emitter tip — quiet until it fires
    if (P.coil > 0.3) { c.shadowColor = PRZ.viol.mid; c.shadowBlur = 4 + P.coil * 7; c.fillStyle = PRZ.white.mid; }
    c.beginPath(); c.arc(0, -11.5, 1.5, 0, 7); c.fill();
    c.shadowBlur = 0;
    c.restore();
  }
  // coil sparks: idle crackle, storm arcs
  const sparky = P.coil > 0.3 || Math.sin(t * 6.7) > 0.92;
  if (sparky) {
    const a = Math.min(1, P.coil + 0.25);
    const tipY = -16.5, tipX = RX - 3;
    przBolt(c, -tipX, tipY, -tipX * 0.3, -34 - Math.sin(t * 9) * 5, Math.floor(t * 24), 3, a * 0.8);
    przBolt(c, tipX, tipY, tipX * 0.3, -33 + Math.cos(t * 8) * 5, Math.floor(t * 21) + 7, 3, a * 0.8);
    if (P.coil > 0.55)
      przBolt(c, -tipX, tipY, tipX, tipY, Math.floor(t * 19) + 3, 6, a * 0.6);
  }
}

// ---- death: the facets shatter into rainbow shards; the disc spins down ----
function przDeath(c, b, S) {
  const k = 1 - clamp((b.deathAnimT || 0) / 1.6, 0, 1);
  if (!b.przShards) {
    const sh = [];
    const V = PRZ_V;
    PRZ_F.forEach((f, i) => {
      const mx = (V[f[0]][0] + V[f[1]][0] + V[f[2]][0]) / 3;
      const my = (V[f[0]][1] + V[f[1]][1] + V[f[2]][1]) / 3;
      sh.push({ x: mx, y: my, vx: mx * 14 + rnd(-60, 60), vy: -rnd(60, 240),
        rot: rnd(0, 6), vr: rnd(-7, 7), s: rnd(3, 6.5), col: PRZ_SPEC[i % PRZ_SPEC.length] });
    });
    for (let i = 0; i < 6; i++)                // head / ear / tail fragments
      sh.push({ x: rnd(-38, -22), y: rnd(-48, -32), vx: rnd(-160, -20), vy: -rnd(80, 260),
        rot: rnd(0, 6), vr: rnd(-8, 8), s: rnd(2, 4.5), col: PRZ_SPEC[i % PRZ_SPEC.length] });
    b.przShards = sh;
  }
  // the disc stays, spinning down in a shower of sparks
  b.przRot = (b.przRot || 0) + 0.032 * (30 * (1 - k) * (1 - k) + 1.5);
  const P = { glow: Math.max(0.05, 0.8 - k), rings: Math.max(0, 0.5 - k), coil: Math.max(0, 0.6 - k * 1.2), crouch: 0 };
  przDisc(c, b, P, b.przRot);
  if (k < 0.85 && typeof addPart === 'function' && chance(0.5)) {
    const sx2 = b.cx ? b.cx() : 0, sy2 = b.y != null ? b.y + b.h : 0;
    addPart(sx2 + rnd(-30, 30) * S, sy2 - rnd(0, 6), rnd(-90, 90), rnd(-160, -30), 0.35, '#b48cff', 2, 300, true);
  }
  // the body flash-fades as the shards take over
  c.save(); c.globalCompositeOperation = 'lighter';
  c.globalAlpha = Math.max(0, 0.7 - k * 2.4);
  const fg = c.createRadialGradient(-4, -26, 2, -4, -26, 40);
  fg.addColorStop(0, 'rgba(255,255,255,0.9)'); fg.addColorStop(0.4, 'rgba(55,255,208,0.5)');
  fg.addColorStop(1, 'rgba(180,140,255,0)');
  c.fillStyle = fg; c.beginPath(); c.arc(-4, -26, 40, 0, 7); c.fill();
  c.restore();
  // rainbow shards, tumbling out and falling
  for (const s2 of b.przShards) {
    s2.x += s2.vx * 0.032; s2.y += (s2.vy + 640 * k) * 0.032;
    if (s2.y > -3) { s2.y = -3; s2.vy = -Math.abs(s2.vy) * 0.4; s2.vx *= 0.7; }
    s2.rot += s2.vr * 0.032;
    c.save();
    c.globalAlpha = Math.max(0, 1 - k * 1.05);
    c.translate(s2.x, s2.y); c.rotate(s2.rot);
    c.fillStyle = s2.col;
    c.shadowColor = s2.col; c.shadowBlur = 6;
    c.beginPath(); c.moveTo(-s2.s * 0.6, s2.s * 0.5); c.lineTo(s2.s * 0.7, s2.s * 0.3);
    c.lineTo(0, -s2.s * 0.8); c.closePath(); c.fill();
    c.shadowBlur = 0;
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha *= 0.7;
    c.strokeStyle = '#ffffff'; c.lineWidth = 0.7;
    c.beginPath(); c.moveTo(-s2.s * 0.5, s2.s * 0.4); c.lineTo(0, -s2.s * 0.7); c.stroke();
    c.restore();
  }
}

// ===========================================================================
// entry point — bottom-anchored at the boss hitbox, THE TURN LAW tier 3+:
// the cat turns by riding its disc through the crossing (flex floor 0.85)
// while the disc itself visibly spins with the turn and sparks at centre.
// ===========================================================================
function drawPrism(c, b) {
  try {
    // authored art first; the procedural cat stays as the fallback so the boss
    // is never missing while the sheet is still coming down the wire
    if (drawPrismSheet(c, b)) return true;
    const S = (b.h * 1.15) / 34;
    const cx = b.x + b.w / 2, footY = b.y + b.h;
    const fv = b.faceVis == null ? (b.face || 1) : b.faceVis;
    const ta = Math.max(0.001, Math.abs(fv));
    const sgn = fv < 0 ? 1 : -1;               // authored nose-LEFT

    // disc rotation: a real turntable — it idles slowly, whips with facing
    // changes, and screams during the arc states
    const P = (b.dead && !b.purified) ? null : przPose(b);
    const dA = b.anim - (b.przAt == null ? b.anim : b.przAt); b.przAt = b.anim;
    if (!b.dead || b.purified) {
      const dFv = fv - (b.przFv == null ? fv : b.przFv);
      b.przRot = (b.przRot || 0) + dA * P.discSpin + dFv * -2.2;
      // the crossing frame: the disc kicks sparks as the cat swings through
      if (b.przFv != null && Math.sign(fv) !== Math.sign(b.przFv) && typeof addPart === 'function') {
        for (let i = 0; i < 7; i++)
          addPart(cx + rnd(-b.w * 0.45, b.w * 0.45), footY - rnd(2, 8),
            rnd(-130, 130), rnd(-150, -40), 0.3, i % 2 ? '#37ffd0' : '#e0e0ff', 2.5, 260, true);
      }
      b.przFv = fv;
    }

    c.save();
    c.translate(cx, footY);
    c.scale(S, S);

    if (b.dead && !b.purified) { przDeath(c, b, S); c.restore(); return true; }

    // the turntable does not mirror — it is a disc; only its lines rotate
    przDisc(c, b, P, b.przRot || 0);

    // the cat, mirrored through the turn with the tier-3 floor (>= 0.85)
    c.save();
    c.translate(0, (1 - ta) * 2.5 + P.crouch + P.bob * 0.4);
    c.scale(sgn * (0.85 + 0.15 * ta) * P.stretchX, P.stretchY * (1 - (1 - ta) * 0.04));
    if (P.sit) {                               // weight shift: rear settles, chest rises
      c.translate(20, -15); c.rotate(0.17 * P.sit); c.translate(-20, 15 + 3 * P.sit);
    }
    c.rotate(P.pitch);
    if (P.spin) {                              // dashslash: the light-blade spin
      // directional smear first, in unspun space: the rainbow it drags behind
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        c.globalAlpha = 0.22 - i * 0.04;
        c.strokeStyle = PRZ_SPEC[(i * 2 + 1) % PRZ_SPEC.length]; c.lineWidth = 2.2;
        c.beginPath(); c.moveTo(18 + i * 9, -14 - i * 5);
        c.lineTo(50 + i * 12, -14 - i * 5); c.stroke();
      }
      c.restore();
      c.translate(-3, -25); c.rotate(P.spin); c.translate(3, 25);
      // rotational blur streaks + the rainbow the spin smears out
      c.save(); c.globalCompositeOperation = 'lighter';
      const sk = Math.min(1, P.spin / 2);
      for (let i = 0; i < 5; i++) {
        const a0 = -P.spin * 1.3 - i * 0.45;
        c.globalAlpha = Math.max(0, 0.42 * sk - i * 0.06);
        c.strokeStyle = i === 0 ? '#ffffff' : PRZ_SPEC[(i * 2) % PRZ_SPEC.length];
        c.lineWidth = 3 - i * 0.4;
        c.beginPath(); c.arc(-3, -25, 26 + i * 4, a0, a0 + 1.5); c.stroke();
      }
      c.restore();
    }
    if (P.pant) {                              // panting vibration
      c.translate(0, Math.sin(b.anim * 16) * 0.6);
    }
    przBody(c, b, P, fv);
    c.restore();

    c.restore();
    return true;
  } catch (e) { try { c.restore(); } catch (e2) {} return false; }
}
