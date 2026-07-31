// THE FIRST BOSS — virus-infected robot beast, and its whelps.
//
// Assembled from the authored parts sheet exactly as designed: every part
// (head, neck, body, two-segment legs, chained tail) is its own sprite
// mounted on a skeleton of nested pivots. Walking is legs actually swinging
// from shoulder and hip with knee counter-flex; roaring is the neck and head
// really rotating back; death is the machine folding onto the ground and its
// virus-light going out. Nothing here is a whole picture sliding around.
//
// Parts atlas layout (built from the uploaded sheet, white keyed out):
const BEAST_P = {
  head: [6, 6, 154, 158], neck: [166, 6, 69, 88], body: [241, 6, 204, 144],
  fleg0: [451, 6, 68, 82], fleg1: [525, 6, 70, 109],
  bleg0: [601, 6, 70, 79], bleg1: [677, 6, 72, 114],
  tail0: [755, 6, 54, 45], tail1: [815, 6, 43, 39], tail2: [864, 6, 50, 32], tail3: [920, 6, 45, 28],
  full: [971, 6, 517, 270],
  // the authored animation poses: complete connected figures, extracted by
  // component mask (never rectangle cuts), baked shadows removed
  aIdle: [6, 282, 197, 149], aWalk: [209, 282, 207, 139],
  aRoar: [422, 282, 237, 159], aAtk: [665, 282, 207, 106],
};
const BEAST_H = 270;              // the full figure's standing height in atlas px
const BEAST_F = 270 / 149;        // example-pose panel scale -> rig scale
const BEAST_CACHE = { dark: null };
// assembly anchors, exposed so the auditor can calibrate them against the art
const BEAST_TUNE = { headX: -82, headY: -188, bodyX: 118, bodyY: 229, shX: -100, hpX: 62 };

function beastImg() { return typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.beastParts; }
// far-side limbs use a darkened copy of the atlas so depth reads
function beastDark() {
  if (BEAST_CACHE.dark) return BEAST_CACHE.dark;
  const im = beastImg(); if (!im) return null;
  const cv = document.createElement('canvas');
  cv.width = im.naturalWidth; cv.height = im.naturalHeight;
  const x = cv.getContext('2d');
  x.drawImage(im, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = 'rgba(10,8,18,0.48)'; x.fillRect(0, 0, cv.width, cv.height);
  BEAST_CACHE.dark = cv;
  return cv;
}

// draw one AUTHORED whole-figure pose, bottom-aligned on the ground line.
// These are the sheet's own key poses — the open-jaw roar and the crouched
// attack exist only as whole figures, so the rig hands over to them.
function bFig(c, key, rot, shake) {
  const s = BEAST_P[key];
  const w = s[2] * BEAST_F, h = s[3] * BEAST_F;
  c.save();
  if (shake) c.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake * 0.5);
  if (rot) { c.translate(0, -h * 0.4); c.rotate(rot); c.translate(0, h * 0.4); }
  c.drawImage(beastImg(), s[0], s[1], s[2], s[3], -w / 2, -h, w, h);
  c.restore();
}

// draw one part with its pivot at the current origin
function bPart(c, key, px, py, dark) {
  const s = BEAST_P[key];
  const im = dark ? beastDark() : beastImg();
  c.drawImage(im, s[0], s[1], s[2], s[3], -px, -py, s[2], s[3]);
}

// a two-segment leg: rotate a1 at the anchor, draw upper, step to the knee,
// rotate a2 more, draw lower. Nested transforms keep the chain honest.
function bLeg(c, up, lo, ax, ay, a1, a2, kneeY, dark) {
  c.save();
  c.translate(ax, ay); c.rotate(a1);
  bPart(c, up, BEAST_P[up][2] / 2, 26, dark);      // socket sits deep in the hip
  c.translate(0, kneeY); c.rotate(a2);
  bPart(c, lo, BEAST_P[lo][2] / 2, 18, dark);
  c.restore();
}

// pose fields: bob, pitch, crouch, neckA, headA, legs [f near, b near, f far, b far]
// each {a1, a2}, tailA base wave, glow 0..1, slump 0..1 (death)
function beastPose(b) {
  const t = b.anim, st = b.st;
  const P = {
    bob: Math.sin(t * 2.1) * 3, pitch: 0, crouch: 0,
    neckA: 0, headA: 0, tailA: Math.sin(t * 1.4) * 0.18, tailUp: -1,
    glow: 0.55 + Math.sin(t * 3) * 0.2, slump: 0,
    legs: [0, 1, 2, 3].map(i => ({ a1: Math.sin(t * 1.6 + i * 1.7) * 0.04, a2: 0.02 })),
  };
  const gallop = (freq, amp) => {
    const g = t * freq;
    P.legs = [0, 1, 2, 3].map(i => {
      const ph = (i % 2) * Math.PI * 0.75 + (i > 1 ? Math.PI : 0);
      return { a1: Math.sin(g + ph) * amp, a2: Math.sin(g + ph + 1.2) * amp * 0.6 };
    });
    P.bob = Math.sin(g * 2) * 4;
    P.pitch = Math.sin(g) * 0.05;
  };
  if (b.dead) {
    // powered down: folded legs, dropped body, head on the ground, light out
    const k = 1 - Math.max(0, Math.min(1, (b.deathAnimT || 0) / 1.6));
    P.slump = k;
    P.crouch = 44 * k; P.pitch = 0.1 * k;
    P.neckA = 0.34 * k; P.headA = 0.5 * k;
    P.bob = 0; P.tailA = 0.05; P.tailUp = -1;
    P.glow = Math.max(0, 0.6 - k * 0.6) * (0.5 + Math.sin(t * 30) * 0.5);
    P.legs = P.legs.map(() => ({ a1: 0.9 * k, a2: -1.5 * k }));
  } else if (st === 'charge') {
    gallop(11, 0.26);
    P.neckA = -0.08; P.headA = -0.06;               // head level, locked on prey
    P.tailA = Math.sin(t * 6) * 0.3; P.tailUp = -0.55; P.glow = 1;
  } else if (st === 'leap') {
    // pounce: forelegs reach, hindlegs drive, nose follows the arc
    const dive = Math.max(-0.3, Math.min(0.45, (b.vy || 0) / 1400));
    P.pitch = dive; P.bob = 0;
    P.legs[0] = P.legs[2] = { a1: -0.75, a2: 0.55 };
    P.legs[1] = P.legs[3] = { a1: 0.7, a2: -0.5 };
    P.neckA = -0.12; P.headA = dive * 0.6; P.glow = 1;
    P.tailA = 0.4; P.tailUp = 0.9;
  } else if (st === 'bore') {
    // THE ROAR: crouch onto the haunches, throw the head back and howl the
    // virus into the floor, then slam back down as the eruptions plant
    const u = Math.max(0, Math.min(1, 1 - (b.t || 0) / 1.1));
    if (u < 0.45) {
      const k = Math.sin(u / 0.45 * Math.PI / 2);
      P.crouch = 10 * k; P.pitch = -0.16 * k;
      P.neckA = -0.5 * k; P.headA = -0.6 * k;       // head thrown back
      P.legs[1].a1 = P.legs[3].a1 = 0.3 * k;        // haunches folded
      P.glow = 0.6 + k * 0.8;
      P.tailA = Math.sin(t * 9) * 0.35 * k; P.tailUp = 0.5 + k * 0.5;
    } else {
      const v = (u - 0.45) / 0.55;
      const slam = v < 0.3 ? v / 0.3 : 1;
      P.crouch = 10 - 16 * slam + (v > 0.3 ? Math.sin(t * 44) * 1.6 : 0);
      P.pitch = -0.16 + 0.3 * slam;
      P.neckA = -0.5 + 0.72 * slam; P.headA = -0.6 + 0.95 * slam;  // bite the floor
      P.legs[0].a1 = P.legs[2].a1 = -0.24 * slam;
      P.glow = 1.4;
      P.tailA = Math.sin(t * 12) * 0.3; P.tailUp = 1;
    }
  } else if (Math.abs(b.vx || 0) > 40) gallop(8, 0.22);
  return P;
}

// core renderer: local space is the AUTHORED one — beast faces LEFT, ground at
// y=0, x=0 under the body's centre. Caller has already scaled and mirrored.
function beastDraw(c, b, P) {
  const g = P.crouch;
  c.save();
  c.translate(0, P.bob + g);
  c.rotate(P.pitch);
  // anchors measured off the authored FULL figure (ground y=0, origin under
  // the body centre, facing left): head low and forward, long level body,
  // legs under the shoulders/hips, tail rooted at the rump top
  const SH = [BEAST_TUNE.shX, -125];                            // front shoulder anchor
  const HP = [BEAST_TUNE.hpX, -135];                              // back hip anchor
  // far legs first (darkened, half a stride out of phase)
  bLeg(c, 'fleg0', 'fleg1', SH[0] + 14, SH[1], P.legs[2].a1, P.legs[2].a2, 32, true);
  bLeg(c, 'bleg0', 'bleg1', HP[0] + 14, HP[1], P.legs[3].a1, P.legs[3].a2, 37, true);
  // tail: segments laid along an explicit curve off the rump (matched to the
  // authored curl), each rotated to its local tangent — connected by design
  {
    const lift = P.tailUp, wob = P.tailA;
    // compact authored curl: root at the rump, spade tip just over the back
    const TP = [
      [86, -146], [106, -148 - 40 * lift + wob * 6],
      [122, -146 - 68 * lift + wob * 14], [138, -140 - 96 * lift + wob * 22],
      [152, -132 - 120 * lift + wob * 30],
    ];
    const keys = ['tail1', 'tail2', 'tail3', 'tail0'];     // thick -> tip spade
    for (let i = 0; i < 4; i++) {
      const ang = Math.atan2(TP[i + 1][1] - TP[i][1], TP[i + 1][0] - TP[i][0]);
      c.save();
      c.translate(TP[i][0], TP[i][1]); c.rotate(ang);
      bPart(c, keys[i], 6, BEAST_P[keys[i]][3] * 0.5);
      c.restore();
    }
  }
  // body over tail and far legs: long and level, top at -215
  bPart(c, 'body', BEAST_TUNE.bodyX, BEAST_TUNE.bodyY);
  // near legs
  bLeg(c, 'bleg0', 'bleg1', HP[0] - 14, HP[1], P.legs[1].a1, P.legs[1].a2, 37, false);
  bLeg(c, 'fleg0', 'fleg1', SH[0] - 14, SH[1], P.legs[0].a1, P.legs[0].a2, 32, false);
  // the head seats INTO the shoulders — a lion's neck hides under the mane,
  // so no neck piece is mounted; the skull rotates about its rear
  c.save();
  c.translate(BEAST_TUNE.headX, BEAST_TUNE.headY);
  c.rotate(P.neckA * 0.4 + P.headA * 0.8);
  bPart(c, 'head', 118, 92);
  // virus eye: a live glow over the authored eye, breathing with the state
  if (P.glow > 0.05) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const eg = c.createRadialGradient(-80, -16, 1, -80, -16, 26 * P.glow);
    eg.addColorStop(0, 'rgba(214,140,255,' + Math.min(0.9, 0.55 * P.glow) + ')');
    eg.addColorStop(1, 'rgba(140,60,220,0)');
    c.fillStyle = eg;
    c.beginPath(); c.arc(-80, -16, 26 * P.glow, 0, 7); c.fill();
    c.restore();
  }
  c.restore();
  c.restore();
}

// boss entry point. Returns false so the old chain can catch a missing image.
function drawBeast(c, b) {
  const im = beastImg(); if (!im || !im.naturalWidth) return false;
  try {
    const fv = b.faceVis == null ? -1 : b.faceVis;
    const S = (b.h * 2.35) / BEAST_H;
    const cx = b.x + b.w / 2, footY = b.y + b.h;
    c.save();
    c.translate(cx, footY);
    const sgn = fv < 0 ? 1 : -1;                     // authored facing LEFT
    // NO paper-thin edge at the turn: the body flexes to 85% at most and the
    // pivot crouches into its feet — the flip reads as weight, never as a line
    const ta = Math.abs(fv);
    c.translate(0, (1 - ta) * 7);
    c.scale(sgn * (0.85 + 0.15 * ta) * S, (1 - (1 - ta) * 0.06) * S);
    if (b.hurtT > 0) c.globalAlpha = 0.72;
    // ground shadow lives with every representation
    c.save(); c.globalAlpha *= 0.34; c.fillStyle = '#04070b';
    c.beginPath(); c.ellipse(0, 4, 205, 17, 0, 0, 7); c.fill(); c.restore();
    const u = b.st === 'bore' ? Math.max(0, Math.min(1, 1 - (b.t || 0) / 1.1)) : 0;
    if (b.stagT > 0 && !b.dead) {
      // staggered by the Song: cowering low, trembling
      bFig(c, 'aAtk', 0, 2.2);
    } else if (b.st === 'leap' && !b.dead) {
      // the authored pounce: crouched attack figure riding the arc
      const dive = Math.max(-0.3, Math.min(0.45, (b.vy || 0) / 1400));
      bFig(c, 'aAtk', dive, 0);
    } else if (b.st === 'bore' && u > 0.18 && u < 0.45 && !b.dead) {
      // THE ROAR — the sheet's own open-jaw howl, shaking harder as it peaks
      bFig(c, 'aRoar', 0, 1 + (u - 0.18) * 14);
      // virus light pouring from the throat
      c.save(); c.globalCompositeOperation = 'lighter';
      const mg = c.createRadialGradient(-150, -215, 2, -150, -215, 60);
      mg.addColorStop(0, 'rgba(220,150,255,0.65)'); mg.addColorStop(1, 'rgba(140,60,220,0)');
      c.fillStyle = mg; c.beginPath(); c.arc(-150, -215, 60, 0, 7); c.fill();
      c.restore();
    } else {
      beastDraw(c, b, beastPose(b));
    }
    c.restore();
    return true;
  } catch (e) { return false; }
}

// the whelps: Zone A ground minions are literally smaller versions of him
function drawBeastMini(c, e) {
  const im = beastImg(); if (!im || !im.naturalWidth) return false;
  try {
    const fv = e.faceVis == null ? (e.face || -1) : e.faceVis;
    const S = (e.h * 1.5) / BEAST_H;
    c.save();
    c.translate(e.x + e.w / 2, e.y + e.h);
    const sgn = fv < 0 ? 1 : -1;
    const ta = Math.abs(fv);
    c.translate(0, (1 - ta) * 4);
    c.scale(sgn * (0.85 + 0.15 * ta) * S, (1 - (1 - ta) * 0.06) * S);
    if (e.hurtT > 0) c.globalAlpha = 0.72;
    if (e.hypnoT > 0) c.globalAlpha = 0.85;
    c.save(); c.globalAlpha *= 0.3; c.fillStyle = '#04070b';
    c.beginPath(); c.ellipse(0, 3, 195, 16, 0, 0, 7); c.fill(); c.restore();
    const fake = {
      anim: e.anim,
      st: Math.abs(e.vy || 0) > 80 ? 'leap' : Math.abs(e.vx || 0) > 30 ? 'walk' : 'idle',
      vx: e.vx, vy: e.vy, t: 0, dead: false, deathAnimT: 0, hurtT: e.hurtT,
    };
    beastDraw(c, fake, beastPose(fake));
    c.restore();
    return true;
  } catch (e2) { return false; }
}
