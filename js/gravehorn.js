// ===========================================================================
// GRAVEHORN — First Soldier of the Eye. Chapter one's quarry boss (CV3).
//
// The owner, 2026-10-11: "a very dangerous, evil rhino that works under the
// robot that stole the mother's song ... this rhino shoots missiles as its
// horn leaves its body. It charges at you ... if it's next to you, it can just
// hit you with its horn to push you far away. It will make you dizzy ... You
// can parry with the normal hit ... second phase ... two horns being shot ...
// it can kick if you're standing behind it." And before that: "make it worth
// fighting, not just something that goes left and right and jumps."
//
// He is the Eye's own heavy trooper, posted on the raw marble. He is NOT an
// infected guardian: there is no song in him to cure, so there is no fork, no
// purification and no pet. Beaten, he backs into the rock and leaves — a
// lieutenant who will be back, not a kill and not a rescue.
//
// CLASS B, a parts rig (ART_BIBLE.md §1/§3). Every part below has a plate
// briefed in docs/ART_QUEUE.md §2bf and NONE exists yet — so each part draws a
// flat gunmetal STAND-IN in the same frame its plate will occupy, and swaps to
// the plate the moment `assets/characters/gravehorn/<part>.webp` is on disk
// (build.cjs hands the page the list as window.GH_FILES; nothing here names a
// file that is not there). The stand-ins are wiring, not art: flat fills, no
// rendering, deliberately plain.
//
// The move table, with the numbers measured by tests/gravehorn.cjs, is
// docs/combat/BOSS_GRAVEHORN.md.
// ===========================================================================

// ---- the tuning sheet (seconds, px, px/s) ---------------------------------
const GH = {
  walk: 105, walk2: 135, walkAcc: 340,       // the prowl between moves
  turnT: 0.35,                               // the weighted turn: plant, pivot
  // HORN MISSILE: the big horn leaves the socket, homes lightly until it
  // LOCKS (a cyan flash), then flies straight
  hornPrep: 0.70, hornPrep2: 0.75, hornFire: 0.34, hornFire2: 0.62,
  lockT: 0.35, mLaunch: 420, mCruise: 560, mDive: 300, mTurn: 3.2, mBlastR: 46, mLife: 2.0,
  smallGap: 0.45, smallSpeed: 660,           // phase two: the small horn, direct
  away: 2.5, away2: 3.4, retSpd: 360,        // the hornless opening
  seat: 0.32,
  // CHARGE
  chargeTell: 0.80, chargeTell2: 1.05, rush: 640, rush2: 830, rushAcc: 2600,
  skidDec: 1500, recover: 0.62, stun: 1.2, stun2: 1.0, wallTurn: 0.5,
  // HORN TOSS (and its parry)
  tossReach: 78, tossTell: 0.45, toss: 0.30, tossHit: 0.20,
  tossRecover: 0.68, tossRecover2: 0.60, parryLead: 0.15, stagger: 0.9,
  tossKB: [520, 700], tossKB2: [640, 820], dizzy: 1.4, dizzy2: 1.8,
  // REAR KICK (phase two)
  kickReach: 104, kickTell: 0.35, kick: 0.22, kickRecover: 0.55,
  // the turn between phases, and the end
  kneel: 0.9, rage: 1.7, beaten: 1.0, retreat: 2.8,
  // the hit-group break
  daze: 1.4, daze2: 1.1,
};
// the rig, in px. Facing LEFT (the guardian convention): local -x is forward,
// the origin is the floor under the collider's centre, +y is down.
//   her drawn height measured 66 px (ears to soles); jump apex 216 px running.
//   hump top 132 px (2.0x her), head-to-tail 243 px (3.7x her) — see the doc.
const GH_RIG = {
  body: [8, -80],                 // the body part's pivot (its centre)
  neck: [-80, -12],               // head pivot, in body-local px
  tail: [88, -24],
  sockBig: [-72, -12], sockSmall: [-50, -24],   // in head-local px
  L1: 42, L2: 40,                 // upper, lower (with hoof) leg segments
};
// four legs: body-local hip, which way the joint bends, near/far, and the
// phase offset in the 4-beat walk (LH, LF, RH, RF) and in the charge gallop
// (every hip sits 70 px over the floor at rest, so a hoof at either end of its
// stance — at most 36 px behind in the walk, 48 in the charge's crouch — is
// inside the leg's 82 px reach and the IK never has to lift it off its spot)
const GH_LEGS = [
  { k: 'fn', hip: [-52, 13], bend: 1, far: 0, off: 0.25, offG: 0.50, up: 'fleg_up', lo: 'fleg_low' },
  { k: 'ff', hip: [-40, 13], bend: 1, far: 1, off: 0.75, offG: 0.62, up: 'fleg_up', lo: 'fleg_low' },
  { k: 'hn', hip: [50, 13], bend: -1, far: 0, off: 0.00, offG: 0.00, up: 'hleg_up', lo: 'hleg_low' },
  { k: 'hf', hip: [62, 13], bend: -1, far: 1, off: 0.50, offG: 0.12, up: 'hleg_up', lo: 'hleg_low' },
];
// how long each timed state is, for a drawing asked for without its update
// (the art harness poses a state by name and draws it)
const GH_DUR = {
  hornprep: GH.hornPrep, hornfire: GH.hornFire, hornseat: GH.seat, chargewarn: GH.chargeTell,
  skid: 0.5, recover: GH.recover, wallslam: 0.2, stunned: GH.stun, tossprep: GH.tossTell,
  toss: GH.toss, tossrecover: GH.tossRecover, stagger: GH.stagger, kickprep: GH.kickTell,
  kick: GH.kick, kickrecover: GH.kickRecover, turn: GH.turnT, daze: GH.daze, kneel: GH.kneel,
  rage: GH.rage, beaten: GH.beaten, retreat: GH.retreat, ghwake: 2.0, ghbellow: 1.3,
  wallturn: GH.wallTurn, rest: 1.0,
};
// committed states: the hit-group break and the Song's stagger wait for them
const GH_BUSY = { rush: 1, toss: 1, kick: 1, hornfire: 1, wallslam: 1, kneel: 1, rage: 1,
  beaten: 1, retreat: 1, ghwake: 1, ghspeak: 1, ghbellow: 1, daze: 1, stunned: 1, wallturn: 1 };
// the cinematic beats: no damage lands, she is held, the bar is his to refill
const GH_CINE = { ghwake: 1, ghspeak: 1, ghbellow: 1, kneel: 1, rage: 1, beaten: 1, retreat: 1 };

// ---- the plates: registered only when they are on disk --------------------
const GH_PART_KEYS = ['body', 'head', 'head_roar', 'horn_big', 'horn_small', 'fleg_up', 'fleg_low',
  'hleg_up', 'hleg_low', 'tail', 'body2', 'head2', 'horn_big2', 'horn_small2'];
(function ghRegister() {
  const on = (typeof window !== 'undefined' && window.GH_FILES) || [];
  if (typeof MEDIA_SRC === 'undefined') return;
  for (const p of on) if (GH_PART_KEYS.indexOf(p) >= 0)
    MEDIA_SRC.images['gh_' + p] = 'assets/characters/gravehorn/' + p + '.webp';
})();
// THE ANCHOR TABLE. Where a plate sits in its part's frame: the box it is
// fitted to (local px) and the point of the plate that is the pivot, as
// fractions of the plate. The stand-ins are drawn in the same box, so a plate
// that lands replaces its stand-in in place; re-measure the fractions from the
// keyed plate when it arrives (one number per part, no code).
const GH_BOX = {
  body: { x: -92, y: -56, w: 186, h: 96, ax: 0.49, ay: 0.58 },
  head: { x: -92, y: -34, w: 102, h: 70, ax: 0.90, ay: 0.49 },
  head_roar: { x: -92, y: -34, w: 102, h: 78, ax: 0.90, ay: 0.44 },
  horn_big: { x: -26, y: -66, w: 38, h: 70, ax: 0.68, ay: 0.94 },
  horn_small: { x: -14, y: -34, w: 24, h: 38, ax: 0.58, ay: 0.90 },
  fleg_up: { x: -16, y: -6, w: 32, h: 50, ax: 0.5, ay: 0.12 },
  fleg_low: { x: -15, y: -4, w: 30, h: 46, ax: 0.5, ay: 0.09 },
  hleg_up: { x: -19, y: -8, w: 38, h: 52, ax: 0.5, ay: 0.15 },
  hleg_low: { x: -15, y: -4, w: 30, h: 46, ax: 0.5, ay: 0.09 },
  tail: { x: -8, y: -4, w: 26, h: 36, ax: 0.3, ay: 0.11 },
};
GH_BOX.body2 = GH_BOX.body; GH_BOX.head2 = GH_BOX.head;
GH_BOX.horn_big2 = GH_BOX.horn_big; GH_BOX.horn_small2 = GH_BOX.horn_small;
function ghPlate(part) {
  const k = 'gh_' + part;
  if (typeof MEDIA_SRC === 'undefined' || !MEDIA_SRC.images[k]) return null;
  const im = MEDIA_IMG[k];
  return im && im.naturalWidth ? im : null;
}
// a darkened (far side) or silhouetted (in the dark) copy of a plate, made once
const GH_TINT = {};
function ghPlateTint(part, im, mode) {
  const key = part + ':' + mode;
  const T = GH_TINT[key];
  if (T && T.src === im) return T.cv;
  const cv = document.createElement('canvas');
  cv.width = im.naturalWidth; cv.height = im.naturalHeight;
  const x = cv.getContext('2d');
  x.drawImage(im, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = mode === 'sil' ? '#05070a' : 'rgba(4,6,10,0.42)';
  x.fillRect(0, 0, cv.width, cv.height);
  GH_TINT[key] = { src: im, cv };
  return cv;
}

// ---- the stand-in palette: flat, three tones, clearly not the final art ---
const GHC = {
  hi: '#7c858f', mid: '#5b636d', lo: '#3a4048', deep: '#262b31',
  far: ['#4b525a', '#3b4148', '#2a2f35'],
  red: '#a8291f', redHi: '#d0392b', bone: '#cfc4ac', boneLo: '#958a73', eye: '#ff3b2a',
  melt: '#ff3b1f',
};
function ghTone(sty, i) { return sty.sil ? sty.sil : sty.far ? GHC.far[i] : [GHC.hi, GHC.mid, GHC.lo][i]; }
// ---- part stand-ins (each in its own frame; see GH_BOX) --------------------
const GH_DRAW = {
  body(c, sty, p2) {
    // barrel, shoulder hump, sloping back, round rump
    c.fillStyle = ghTone(sty, 1);
    c.beginPath();
    c.moveTo(-90, 2);
    c.quadraticCurveTo(-92, -28, -70, -38);
    c.quadraticCurveTo(-52, -58, -32, -54);          // the hump
    c.quadraticCurveTo(0, -44, 40, -38);
    c.quadraticCurveTo(84, -34, 92, -8);             // rump
    c.quadraticCurveTo(96, 18, 74, 30);
    c.quadraticCurveTo(10, 40, -54, 34);             // belly
    c.quadraticCurveTo(-88, 28, -90, 2);
    c.fill();
    if (sty.sil) return;
    // the lit top
    c.fillStyle = ghTone(sty, 0);
    c.beginPath();
    c.moveTo(-82, -24);
    c.quadraticCurveTo(-56, -56, -32, -52);
    c.quadraticCurveTo(0, -42, 40, -36);
    c.quadraticCurveTo(80, -32, 88, -12);
    c.quadraticCurveTo(40, -20, 0, -24);
    c.quadraticCurveTo(-40, -28, -82, -24);
    c.fill();
    // the underside
    c.fillStyle = ghTone(sty, 2);
    c.beginPath();
    c.moveTo(-84, 14);
    c.quadraticCurveTo(-20, 22, 80, 18);
    c.quadraticCurveTo(70, 32, 20, 36);
    c.quadraticCurveTo(-50, 36, -84, 14);
    c.fill();
    // armour plate seams
    c.strokeStyle = ghTone(sty, 2); c.lineWidth = 2.2;
    for (const sx of [-58, -22, 18, 56]) {
      c.beginPath(); c.moveTo(sx - 6, -44 + Math.abs(sx) * 0.08); c.quadraticCurveTo(sx + 6, -10, sx - 2, 22); c.stroke();
    }
    // the hazard stripe over the hump
    c.fillStyle = sty.far ? '#6a2621' : GHC.red;
    c.beginPath();
    c.moveTo(-64, -42); c.quadraticCurveTo(-44, -56, -26, -52); c.lineTo(-22, -45);
    c.quadraticCurveTo(-44, -49, -60, -36); c.fill();
    // rivets
    c.fillStyle = ghTone(sty, 0);
    for (const [rx, ry] of [[-70, -14], [-40, -30], [-6, -24], [30, -20], [64, -16], [-50, 14], [10, 18], [50, 12]]) {
      c.beginPath(); c.arc(rx, ry, 2, 0, 6.2832); c.fill();
    }
    if (p2) {
      // PHASE TWO: the plates blown open — molten cracks and jet vents
      c.strokeStyle = GHC.melt; c.lineWidth = 2.4; c.lineCap = 'round';
      for (const crk of [[[-60, -30], [-48, -14], [-56, 4]], [[-12, -34], [-2, -16], [-14, 8], [-4, 22]],
        [[30, -28], [42, -10], [34, 10]], [[66, -22], [74, -4]]]) {
        c.beginPath(); c.moveTo(crk[0][0], crk[0][1]);
        for (let i = 1; i < crk.length; i++) c.lineTo(crk[i][0], crk[i][1]);
        c.stroke();
      }
      c.fillStyle = GHC.deep;
      for (const vx of [-40, -6, 28]) { c.beginPath(); c.ellipse(vx, -44 + Math.abs(vx + 20) * 0.1, 5, 3, 0, 0, 6.2832); c.fill(); }
    }
  },
  head(c, sty, p2, roar) {
    // neck stub, brow, snout, jaw (shut, or dropped for the roar)
    c.fillStyle = ghTone(sty, 1);
    c.beginPath();
    c.moveTo(8, -26);
    c.quadraticCurveTo(-16, -34, -44, -28);          // brow
    c.quadraticCurveTo(-66, -22, -78, -8);           // snout top
    c.quadraticCurveTo(-90, 4, -84, 14);             // snout tip
    c.quadraticCurveTo(-60, 14, -36, 16);
    c.quadraticCurveTo(-12, 22, 8, 26);
    c.closePath(); c.fill();
    // the jaw
    c.save();
    c.translate(-30, 12);
    c.rotate(roar ? -0.42 : 0);
    c.fillStyle = ghTone(sty, 2);
    c.beginPath();
    c.moveTo(14, 0); c.quadraticCurveTo(-20, 4, -50, 6);
    c.quadraticCurveTo(-52, 14, -40, 18); c.quadraticCurveTo(-10, 20, 24, 14);
    c.closePath(); c.fill();
    c.restore();
    if (sty.sil) return;
    c.fillStyle = ghTone(sty, 0);
    c.beginPath();
    c.moveTo(4, -24); c.quadraticCurveTo(-30, -32, -60, -18);
    c.quadraticCurveTo(-30, -20, 4, -14); c.fill();
    // mouth grille
    c.strokeStyle = GHC.deep; c.lineWidth = 2;
    for (const gx of [-70, -63, -56]) { c.beginPath(); c.moveTo(gx, 6); c.lineTo(gx + 2, 14); c.stroke(); }
    // the brow slot (the eye is lit in its own pass, additively)
    c.fillStyle = GHC.deep;
    c.beginPath(); c.ellipse(-36, -12, 9, 4.5, -0.2, 0, 6.2832); c.fill();
    // the empty sockets: a horn that has left shows a hole, not a stump
    c.fillStyle = GHC.deep;
    c.beginPath(); c.ellipse(GH_RIG.sockBig[0], GH_RIG.sockBig[1], 7, 3.5, -0.35, 0, 6.2832); c.fill();
    c.beginPath(); c.ellipse(GH_RIG.sockSmall[0], GH_RIG.sockSmall[1], 5, 2.6, -0.3, 0, 6.2832); c.fill();
    // a hazard tick on the cheek
    c.fillStyle = sty.far ? '#6a2621' : GHC.red;
    c.beginPath(); c.moveTo(-20, 0); c.lineTo(-8, -4); c.lineTo(-6, 4); c.lineTo(-18, 8); c.fill();
    if (p2) {
      c.strokeStyle = GHC.melt; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-10, -26); c.lineTo(-18, -14); c.lineTo(-12, -2); c.stroke();
      c.beginPath(); c.moveTo(-50, -20); c.lineTo(-58, -8); c.stroke();
    }
  },
  horn_big(c, sty, p2) {
    c.fillStyle = sty.sil || GHC.lo;
    c.beginPath(); c.ellipse(0, -2, 11, 5, 0, 0, 6.2832); c.fill();              // the nozzle collar
    c.fillStyle = sty.sil || (sty.far ? GHC.boneLo : GHC.bone);
    c.beginPath();
    c.moveTo(-10, -3); c.quadraticCurveTo(-14, -34, -20, -62);
    c.quadraticCurveTo(-4, -40, 9, -3); c.closePath(); c.fill();
    if (sty.sil) return;
    c.fillStyle = GHC.boneLo;
    c.beginPath(); c.moveTo(2, -4); c.quadraticCurveTo(-6, -36, -20, -62); c.quadraticCurveTo(-2, -34, 9, -3); c.fill();
    if (p2) { c.fillStyle = GHC.redHi; c.beginPath(); c.moveTo(-13, -40); c.quadraticCurveTo(-16, -52, -20, -62); c.quadraticCurveTo(-8, -48, -6, -40); c.fill(); }
  },
  horn_small(c, sty, p2) {
    c.fillStyle = sty.sil || GHC.lo;
    c.beginPath(); c.ellipse(0, -2, 7, 3.5, 0, 0, 6.2832); c.fill();
    c.fillStyle = sty.sil || (sty.far ? GHC.boneLo : GHC.bone);
    c.beginPath(); c.moveTo(-6, -2); c.quadraticCurveTo(-8, -18, -8, -32); c.quadraticCurveTo(0, -18, 6, -2); c.closePath(); c.fill();
    if (p2 && !sty.sil) { c.fillStyle = GHC.redHi; c.beginPath(); c.moveTo(-7, -20); c.quadraticCurveTo(-8, -27, -8, -32); c.quadraticCurveTo(-3, -24, -2, -20); c.fill(); }
  },
  // limb segments run along +y from their pivot
  fleg_up(c, sty) { ghLimb(c, sty, 15, 11, GH_RIG.L1, true); },
  hleg_up(c, sty) { ghLimb(c, sty, 18, 11, GH_RIG.L1, true); },
  // (the hoof is drawn FLAT at the foot by the rig, not along the shin: a
  // planted hoof stays level on the floor while the leg above it swings)
  fleg_low(c, sty) { ghLimb(c, sty, 11, 10, GH_RIG.L2 - 6, false); },
  hleg_low(c, sty) { ghLimb(c, sty, 11, 9, GH_RIG.L2 - 6, false); },
  tail(c, sty) {
    c.fillStyle = ghTone(sty, 1);
    c.beginPath(); c.moveTo(-5, 0); c.quadraticCurveTo(-2, 14, 2, 26); c.lineTo(8, 26); c.quadraticCurveTo(6, 12, 5, 0); c.fill();
    c.fillStyle = ghTone(sty, 2);
    c.beginPath(); c.ellipse(5, 28, 5, 4, 0, 0, 6.2832); c.fill();
  },
};
GH_DRAW.head_roar = (c, sty, p2) => GH_DRAW.head(c, sty, p2, true);
function ghLimb(c, sty, w0, w1, len, top) {
  c.fillStyle = ghTone(sty, 1);
  c.beginPath();
  c.moveTo(-w0, 0); c.quadraticCurveTo(-w0 - 1, len * 0.5, -w1, len);
  c.lineTo(w1, len); c.quadraticCurveTo(w0 + 1, len * 0.5, w0, 0);
  c.quadraticCurveTo(0, -w0 * 0.5, -w0, 0); c.fill();
  if (sty.sil) return;
  c.fillStyle = ghTone(sty, 0);
  c.beginPath(); c.moveTo(-w0 + 3, 2); c.quadraticCurveTo(-w0 + 1, len * 0.5, -w1 + 3, len - 2);
  c.lineTo(-w1 + 8, len - 2); c.quadraticCurveTo(-w0 + 8, len * 0.5, -w0 + 9, 2); c.fill();
  if (top) { c.fillStyle = ghTone(sty, 2); c.beginPath(); c.arc(0, len, w1 * 0.9, 0, 6.2832); c.fill(); }
}
function ghHoof(c, sty, y) {
  // lit enough to read as the foot (and to be measured as one: ART_BIBLE §3.4)
  c.fillStyle = sty.sil || (sty.far ? '#3d4249' : '#4d535b');
  c.beginPath();
  c.moveTo(-13, y); c.quadraticCurveTo(-14, y - 9, -9, y - 11); c.lineTo(9, y - 11);
  c.quadraticCurveTo(15, y - 8, 13, y); c.closePath(); c.fill();
}
// one part, drawn into its frame: the plate if it is here, else its stand-in
function ghPart(c, part, x, y, rot, sty, p2, flipX) {
  const key = p2 && GH_BOX[part + '2'] ? part + '2' : part;
  const im = ghPlate(key) || (key !== part ? ghPlate(part) : null);
  c.save();
  c.translate(x, y); c.rotate(rot);
  if (flipX) c.scale(-1, 1);
  if (im) {
    const B = GH_BOX[key] || GH_BOX[part];
    // contained in the box, pivot pinned
    const s = Math.min(B.w / im.naturalWidth, B.h / im.naturalHeight);
    const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    const src = sty.sil ? ghPlateTint(key, im, 'sil') : sty.far ? ghPlateTint(key, im, 'far') : im;
    c.drawImage(src, -B.ax * dw, -B.ay * dh, dw, dh);
  } else {
    const fn = GH_DRAW[part];
    if (fn) fn(c, sty, p2);
  }
  c.restore();
}

// ---- geometry --------------------------------------------------------------
function ghRot(x, y, a) { const c0 = Math.cos(a), s0 = Math.sin(a); return [x * c0 - y * s0, x * s0 + y * c0]; }
function ghEase(k) { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); }
function ghK(b) {
  const dur = b._tellSt === b.st && b._dur ? b._dur : (GH_DUR[b.st] || 1);
  return clamp(1 - (b.t || 0) / dur, 0, 1);
}
// THE POSE. Pure: everything comes from the state, its clock and the feet the
// simulation planted — so the art harness can pose a state by name and the
// game draws exactly what its hitboxes use.
function ghPose(b) {
  const st = b.st || 'idle', k = ghK(b), e = ghEase(k), an = b.anim || 0;
  const P = {
    br: 0, q: null, by: 0, bx: 0, hr: 0.16, jaw: false, glowB: 0, glowS: 0, tail: 0.35,
    lift: [null, null, null, null], eye: 1, stars: false, steam: 0, tell: 0,
  };
  // breathing and the stride's bob, with the head countering it
  const breathe = Math.sin(an * 2.1);
  P.by += breathe * 1.1 + (b._bob || 0);
  P.hr += breathe * 0.02 - (b._bob || 0) * 0.012;
  P.tail = 0.35 + Math.sin(an * 1.7) * 0.12;
  const hindQ = 'hind', frontQ = 'front';
  switch (st) {
    case 'dorm': P.hr = 0.32; P.eye = 0.7; break;
    case 'ghbellow': case 'rage': {
      const r = st === 'rage' ? clamp((k - 0.2) / 0.3, 0, 1) : clamp(k / 0.25, 0, 1);
      if (st === 'rage' && k < 0.2) { P.q = hindQ; P.br = -0.2 * (1 - k / 0.2); P.hr = 0.6; P.lift[0] = P.lift[1] = [-16, 26]; }
      else { P.hr = 0.16 - 0.66 * r; P.jaw = r > 0.15; P.q = hindQ; P.br = 0.07 * r; P.by -= 2 * r; }
      P.glowS = st === 'rage' ? clamp((k - 0.25) * 2, 0, 1) : 0;
      break;
    }
    case 'hornprep': {
      P.hr = 0.16 + 0.34 * Math.pow(k, 0.6) + Math.sin(an * 42) * 0.05 * k;   // the head drops and shakes
      P.bx = 4 * e; P.glowB = Math.pow(k, 0.6); if (b.phase === 2) P.glowS = P.glowB; P.tell = Math.pow(k, 0.6);
      P.steam = k;
      break;
    }
    case 'hornfire': P.hr = k < 0.3 ? lerp(0.5, -0.32, k / 0.3) : lerp(-0.32, 0.1, (k - 0.3) / 0.7); P.bx = 7 * (1 - k); break;
    // hornless he hangs his head — the open socket, and the opening, low
    // enough for claws standing on the floor
    case 'hornless': P.hr = 0.4 + Math.sin(an * 3) * 0.06; P.steam = 0.5; break;
    case 'hornseat': P.hr = k < 0.5 ? 0.1 + 0.3 * (k / 0.5) : 0.4 - 0.3 * ((k - 0.5) / 0.5); break;
    case 'chargewarn': {
      P.hr = 0.16 + 0.44 * Math.pow(k, 0.6); P.by += 6 * e; P.tell = Math.pow(k, 0.6);
      // the scrapes: the near forefoot lifts and drags back, twice (three
      // times for the chained second charge, which is the read that it differs)
      const n = b.chainLeg === 2 ? 3 : 2, dur = (b._dur || GH.chargeTell);
      const el = (1 - (b.t || 0) / dur) * dur;
      for (let i = 0; i < n; i++) {
        const s0 = 0.1 + i * 0.3, s = (el - s0) / 0.24;
        if (s > 0 && s < 1) P.lift[0] = [-8 + 44 * s, 64 - 14 * Math.sin(Math.PI * s)];
      }
      P.eye = 1 + (b.t < 0.16 ? 1.5 : 0);
      break;
    }
    case 'rush': P.hr = 0.52 + Math.sin(an * 22) * 0.03; P.by += 8; P.br = -0.035; break;
    case 'skid': P.hr = 0.3; P.br = 0.08 * (1 - k); P.by += 4; break;
    case 'wallslam': P.hr = -0.3; P.br = 0.12; P.bx = 6; break;
    case 'stunned': case 'daze': P.hr = 0.38 + Math.sin(an * 6) * 0.12; P.stars = true; P.eye = 0.4 + 0.3 * Math.abs(Math.sin(an * 9)); P.by += 4; break;
    case 'recover': case 'tossrecover': case 'kickrecover': case 'rest': {
      P.hr = 0.3 + Math.sin(an * 14) * 0.06 * (1 - k); P.steam = 0.8;
      if (st === 'tossrecover' && k < 0.25) { P.q = hindQ; P.br = 0.32 * (1 - k / 0.25); P.lift[0] = P.lift[1] = [-8, 40]; }
      break;
    }
    case 'tossprep': {
      // the snort, the head dropping LOW, the weight going back onto the rear
      P.hr = 0.16 + 0.8 * Math.pow(k, 0.6); P.bx = 10 * e; P.by += 3 * e; P.q = hindQ; P.br = -0.03 * e;
      P.tell = Math.pow(k, 0.6); P.steam = 1;
      break;
    }
    case 'toss': {
      // THE WHOLE BODY HOOKS UP THROUGH HER: forelegs off the floor, the rear
      // braced, head and neck driving up — not a head bob
      // the scoop first (head still low, the body lurching INTO her), then
      // the hook up through her as the forequarters leave the floor
      const up = Math.sin(Math.PI * 0.5 * clamp((k - 0.1) / 0.5, 0, 1));
      P.q = hindQ; P.br = 0.34 * up; P.bx = 10 - 34 * ghEase(Math.min(1, k / 0.35));
      P.hr = lerp(0.96, -0.9, ghEase(clamp((k - 0.08) / 0.5, 0, 1)));
      if (k > 0.12) P.lift[0] = P.lift[1] = [-10, 40];
      break;
    }
    case 'stagger': P.hr = lerp(-0.45, 0.25, e); P.bx = 8 * (1 - e); P.stars = k < 0.7; break;
    case 'kickprep': {
      // hind legs gather under him; the head comes up and glances back
      P.hr = -0.45 * Math.pow(k, 0.6); P.q = frontQ; P.br = 0.06 * e; P.tell = Math.pow(k, 0.6);
      P.lift[2] = [-14, 70]; P.lift[3] = [-12, 72]; P.glance = k;
      break;
    }
    case 'kick': {
      const up = Math.sin(Math.PI * Math.min(1, k * 1.25));
      P.q = frontQ; P.br = -0.30 * up; P.hr = -0.2;
      P.lift[2] = [66, 30]; P.lift[3] = [60, 36];
      break;
    }
    case 'turn': P.br = 0.06 * Math.sin(Math.PI * k); P.hr = 0.25; break;
    case 'wallturn': P.hr = 0.3; P.br = 0.05; break;
    case 'kneel': case 'beaten': {
      P.q = hindQ; P.br = -0.24 * e; P.hr = 0.62; P.lift[0] = P.lift[1] = [-18, 28]; P.eye = st === 'beaten' ? 0.5 : 1;
      P.stars = st === 'beaten';
      break;
    }
    case 'retreat': P.hr = 0.4; P.eye = 0.6; break;
    default: break;
  }
  // body transform: pitch about the hind hip, the front hip, or its centre
  const B0 = GH_RIG.body;
  let bpx = B0[0] + P.bx, bpy = B0[1] + P.by;
  if (P.q) {
    const L = P.q === 'hind' ? GH_LEGS[2].hip : GH_LEGS[0].hip;
    const qx = bpx + L[0], qy = bpy + L[1];
    const r = ghRot(bpx - qx, bpy - qy, P.br);
    bpx = qx + r[0]; bpy = qy + r[1];
  }
  P.bpx = bpx; P.bpy = bpy;
  P.toRig = (lx, ly) => { const r = ghRot(lx, ly, P.br); return [bpx + r[0], bpy + r[1]]; };
  // the head hangs off the neck; head down = negative canvas rotation
  P.neck = P.toRig(GH_RIG.neck[0], GH_RIG.neck[1]);
  P.ha = P.br - P.hr;
  P.headRig = (lx, ly) => { const r = ghRot(lx, ly, P.ha); return [P.neck[0] + r[0], P.neck[1] + r[1]]; };
  P.sockBig = P.headRig(GH_RIG.sockBig[0], GH_RIG.sockBig[1]);
  P.sockSmall = P.headRig(GH_RIG.sockSmall[0], GH_RIG.sockSmall[1]);
  // the horn leans a little forward of its socket's normal
  P.hornA = P.ha - 0.12;
  return P;
}
// the feet, solved: each leg from its hip to the foot the gait planted (or the
// pose's own target), two segments, the joint bending the anatomical way
function ghLegs(b, P) {
  const out = [];
  const m = -(b.face || -1);
  const cx = b.cx(), fy = b.y + b.h;
  const turning = Math.abs(b.faceVis == null ? b.face : b.faceVis) < 0.97;
  for (let i = 0; i < 4; i++) {
    const L = GH_LEGS[i];
    const hip = P.toRig(L.hip[0], L.hip[1]);
    let fx, fy2;
    const F = b.feet && b.feet[i];
    if (F && !turning && Math.abs((F.x - cx) * m - L.hip[0]) < 130 && Math.abs(F.y - fy) < 60) {
      fx = (F.x - cx) * m; fy2 = F.y - fy - (F.sw ? F.lift || 0 : 0);
    } else { fx = L.hip[0] - 2; fy2 = 0; }
    if (P.lift[i]) {
      const T = P.lift[i];
      // a pose target is relative to the hip (it travels with the body)
      fx = hip[0] + T[0]; fy2 = Math.min(0, hip[1] + T[1]);
    }
    const kn = rigIK(hip[0], hip[1], fx, fy2, GH_RIG.L1, GH_RIG.L2, L.bend);
    const a1 = Math.atan2(kn.y - hip[1], kn.x - hip[0]);
    const tx = kn.x + Math.cos(Math.atan2(fy2 - kn.y, fx - kn.x)) * GH_RIG.L2;
    const ty = kn.y + Math.sin(Math.atan2(fy2 - kn.y, fx - kn.x)) * GH_RIG.L2;
    const a2 = Math.atan2(ty - kn.y, tx - kn.x);
    out.push({ L, hip, kn, a1, a2, foot: [tx, ty] });
  }
  return out;
}
// the hooves as DRAWN, in world px, with whether the gait has them planted —
// what tests/gravehorn.cjs holds against the floor
function ghHoofWorld(b) {
  const P = ghPose(b), legs = ghLegs(b, P), m = -(b.face || -1);
  return legs.map((Lg, i) => ({ x: b.cx() + Lg.foot[0] * m, y: b.y + b.h + Lg.foot[1],
    stance: !!(b.feet && b.feet[i] && !b.feet[i].sw), fx: b.feet && b.feet[i] ? b.feet[i].x : null }));
}
// world boxes for everything that can hit or be hit
function ghBoxes(b, P) {
  P = P || ghPose(b);
  const m = -(b.face || -1), cx = b.cx(), fy = b.y + b.h;
  const W = (pts) => {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of pts) {
      const wx = cx + p[0] * m, wy = fy + p[1];
      if (wx < x0) x0 = wx; if (wx > x1) x1 = wx; if (wy < y0) y0 = wy; if (wy > y1) y1 = wy;
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  };
  const front = W([P.toRig(-86, -50), P.toRig(4, -50), P.toRig(4, 30), P.toRig(-86, 30)]);
  const rear = W([P.toRig(4, -40), P.toRig(92, -36), P.toRig(92, 26), P.toRig(4, 34)]);
  // the legs are body too: down to the floor under the barrel
  front.h = Math.max(front.h, fy - front.y - 2); rear.h = Math.max(rear.h, fy - rear.y - 2);
  const head = W([P.headRig(-86, -26), P.headRig(6, -26), P.headRig(6, 26), P.headRig(-86, 18)]);
  const hornPts = (sock, len) => {
    const r = ghRot(-len * 0.3, -len, P.hornA);
    const mid = ghRot(-len * 0.12, -len * 0.5, P.hornA);
    return [[sock[0] - 8, sock[1] + 4], [sock[0] + 8, sock[1] - 4], [sock[0] + mid[0], sock[1] + mid[1]], [sock[0] + r[0], sock[1] + r[1]]];
  };
  const horn = b.hornBig !== false ? W(hornPts(P.sockBig, 62)) : null;
  const hornS = b.hornSmall !== false ? W(hornPts(P.sockSmall, 32)) : null;
  if (horn) { horn.x -= 6; horn.y -= 6; horn.w += 12; horn.h += 12; }
  // THE SCOOP: the space in front of the snout the horn drives through at the
  // start of the toss, before it hooks up — from the floor to above her head
  const tip = P.headRig(-86, 12), tx = cx + tip[0] * m;
  const scoop = { x: m > 0 ? tx - 46 : tx, y: fy - 80, w: 46, h: 78 };
  return { front, rear, head, horn, hornS, scoop };
}
// what her swings and shots aim at (types.js hurtBoxOf)
function ghHurtBox(b) {
  const B = ghBoxes(b);
  const x0 = Math.min(B.front.x, B.rear.x, B.head.x), x1 = Math.max(B.front.x + B.front.w, B.rear.x + B.rear.w, B.head.x + B.head.w);
  const y0 = Math.min(B.front.y, B.rear.y, B.head.y), y1 = b.y + b.h;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
// the floor under a foot: the drawn heightfield, never more than a hand away
// from the floor the body itself is standing on
function ghGround(b, x) {
  const feet = b.y + b.h;
  if (typeof groundColumnAt !== 'function') return feet;
  const gc = groundColumnAt(x);
  if (!gc) return feet;
  const s = gc[0] < gc[1] ? gc[0] : gc[1];
  return Math.abs(s - feet) < 28 ? s : feet;
}

// ---- spawning, saving, the story -------------------------------------------
// He is posted on the marble. A save that already holds it (or the blade it
// became) met a quarry he had already left — those saves get the flag, so the
// cave's own machines come back and nothing in the story runs twice.
function ghMigrate(sv) {
  if (!sv || !sv.flags || sv.flags.bossHorn) return;
  const hero = typeof isHero === 'function' && isHero();
  if (hero || sv.flags.pl_cshard || sv.flags.crystal || (sv.bag && sv.bag.cshard)) sv.flags.bossHorn = 1;
}
function ghInit(b) {
  b.hornBig = true; b.hornSmall = true;
  b.missiles = []; b.rocks = [];
  b.feet = null; b.gph = 0; b._bob = 0;
  b.dark = 1; b.fade = 0; b.hideBar = true;
  b.denied = 0; b.lastMove = null; b.chainLeg = 0;
}

// ---- the machine --------------------------------------------------------------
function ghSay(lines, onEnd, key) {
  const d = { name: t('grv_name'), lines: [].concat(lines), i: 0, gh: 1, onEnd: onEnd || null };
  if (typeof dialogOpen === 'function') dialogOpen(d); else { G.dialog = d; G.state = 'DIALOG'; }
  sfx('rock');
}
function ghSet(b, st, t) { b.st = st; b.t = t; }
function ghRest(b, k) { return typeof bossRest === 'function' ? bossRest(b, k) : 0.8 * (k || 1); }
function ghStep(b, dt) {
  if (!b.missiles) ghInit(b);
  b._clk = (b._clk || 0) + dt;
  // THE WARNING GETS THE SOUND, as for every boss (Boss.update): any state
  // whose name says a blow is coming fires the cue once, on entry
  if (b.st !== b._tellSt) {
    b._tellSt = b.st; b._dur = Math.max(0.05, b.t || 0); b._el = 0;
    // the state log, on his own clock (tests/gravehorn.cjs reads it)
    const L = b.ghLog || (b.ghLog = []);
    L.push([b.st, +b._clk.toFixed(4)]); if (L.length > 96) L.shift();
    if (TELL_ST.test(b.st || '')) sfx(b.tellCue());
  } else b._el = (b._el || 0) + dt;
  if (G.ghCard) { G.ghCard.t -= dt; if (G.ghCard.t <= 0) G.ghCard = null; }
  if (b.dead) return;
  if (b.st !== 'dorm' && b.st !== 'ghwake') b.dark = Math.max(0, (b.dark || 0) - dt * 2);
  const p2 = b.phase === 2;
  if (!player || player.dead) G.ghHold = null;
  ghProjStep(b, dt);
  // nothing lands during the cinematic beats; the bar is his to set
  if (GH_CINE[b.st] || b.st === 'dorm') b.hp = Math.max(b.hp, b.invHp || b.hpMax);
  if (b.hurtT > 0 && b._hpPrev != null && b.hp < b._hpPrev && !b.hornBig) ghHeadBonus(b);
  const px = player.x + player.w / 2, py = player.y + player.h / 2;
  const dist = px - b.cx(), adist = Math.abs(dist);
  b.t -= dt;
  // THE TOSS WEARS THE PARRY GLINT (js/parry.js), for exactly the window that
  // turns it: the last parryLead of the wind-up and the active frames. Either
  // answer works inside it — her strike on the horn (ghParry, the owner's own
  // order) or a brace raised in the instant it lands (the perfect guard).
  b.parryable = (b.st === 'tossprep' && b.t <= GH.parryLead) || (b.st === 'toss' && b._el <= GH.tossHit && !b.tossHit);
  if (!b.parryAt) { b.parryAt = () => ghHornTip(b); b.onParried = (p, how) => ghClashed(b, p, how); }
  // ---- the hit-group break, taken out of anything he is not committed to ----
  if ((b.dazeWin || 0) > 0) b.dazeWin -= dt;
  if ((b.dazeCD || 0) > 0) b.dazeCD -= dt;
  // ...and the window's hits do not COUNT toward one either: counted, they
  // carried over and the first blow after the horn seated broke him anyway
  // (measured: the autopilot took 247 → 97 in the window, then the break)
  if (b.st === 'hornless' || b.st === 'hornseat') { b.dazeHits = 0; b.dazeWin = 0; b.dazeReq = false; }
  if (b.dazeReq) {
    b.dazeReq = false;
    // never inside the hornless window: that opening already pays (the head
    // bites deeper), and a break on top of it ended a phase in one window
    if (!GH_BUSY[b.st] && b.st !== 'dorm' && b.st !== 'hornless' && b.st !== 'hornseat') {
      ghSet(b, 'daze', p2 ? GH.daze2 : GH.daze); b.vx = 0;
      sfx('phase'); sfx('bosshit'); cam.shake = Math.max(cam.shake, 8);
      G.hitStop = Math.max(G.hitStop, 0.11);
      burst(b.cx(), b.y + 30, 24, '#ff7a6a', 320, 0.6, 240, 4, true);
      if (typeof roarWave === 'function') roarWave(b.cx(), b.y + 40, '#ff5f6d');
      G.toast(t('gd_open'));
    }
  }
  // the Song's stagger (and any other) is an opening, never a move eaten
  if (b.stagT > 0) {
    b.stagT -= dt;
    if (!GH_BUSY[b.st] && b.st !== 'dorm' && b.st !== 'stagger') { ghSet(b, 'stagger', Math.max(0.5, b.stagT)); b.stagT = 0; }
  }
  const face = b.face || -1;
  const front = (Math.sign(dist) || face) === face;
  const snoutX = b.cx() + face * 150, rumpX = b.cx() - face * 100;
  const dSnout = Math.abs(px - snoutX), dRump = Math.abs(px - rumpX);
  const low = player.y + player.h > b.y + b.h - 64;
  let want = 0;                    // horizontal speed the body is asked for
  switch (b.st) {
    // ---------------------------------------------------------- the entrance
    case 'dorm': {
      want = 0;
      const ready = G.state === 'PLAY' && !G.bossEntry && !player.dead;
      if (ready && (px > 12 * TILE || adist < 620)) {
        ghSet(b, 'ghwake', 2.0); b.face = Math.sign(dist) || -1; b.faceVis = b.face;
        G.ghHold = true; b.hideBar = true;
        if (typeof setMusic === 'function') setMusic('boss_horn');
        sfx('quake'); cam.shake = Math.max(cam.shake, 4);
      }
      break;
    }
    case 'ghwake': {
      // he steps out of the dark: heavy, slow, every plant a thud
      G.ghHold = true;
      want = face * 78;
      b.dark = Math.max(0, b.dark - dt / 1.6);
      if (b.t <= 0) {
        ghSet(b, 'ghspeak', 99); want = 0; b.dark = 0;
        const again = G.save && G.save.flags && G.save.flags.ghMet;
        if (G.save && G.save.flags) G.save.flags.ghMet = 1;
        ghSay(t(again ? 'grv_again' : 'grv_intro'), () => { if (b.st === 'ghspeak') ghSet(b, 'ghbellow', 1.3); });
      }
      break;
    }
    case 'ghspeak': {
      G.ghHold = true;
      // the conversation closed some other way (a test, a reset): go on
      if (!G.dialog && G.state === 'PLAY' && b._el > 0.3) ghSet(b, 'ghbellow', 1.3);
      break;
    }
    case 'ghbellow': {
      G.ghHold = true;
      if (!b.bellowed && b._el >= 0.15) {
        b.bellowed = true;
        sfx('roar'); sfx('quake');
        cam.shake = Math.max(cam.shake, 10);
        if (typeof padRumble === 'function') padRumble(0.9, 0.7, 600);
        const h = ghHeadWorld(b);
        if (typeof roarWave === 'function') roarWave(h[0], h[1], '#ff5f6d');
        G.ghCard = { t: 2.8, t0: 2.8 };
      }
      if (b.t <= 0) { G.ghHold = null; b.hideBar = false; ghSet(b, 'idle', 0.5); }
      break;
    }
    // ------------------------------------------------------------ neutral
    case 'idle': case 'rest': case 'walk': {
      // she is dizzy: he does not start a blow into a body that cannot answer
      if ((player.dizzyT || 0) > 0 && b.t < player.dizzyT + 0.25) b.t = player.dizzyT + 0.25;
      if (b.st === 'walk') {
        // close in to toss range, or out to charge range, never parked
        const goal = b.walkGoal || 0;
        want = goal ? Math.sign(goal) * (p2 ? GH.walk2 : GH.walk) : 0;
        if (dSnout < GH.tossReach - 10) b.t = 0;
        if (!front) b.t = 0;
      }
      if (!front && b.st !== 'rest' && b.t > 0.15 && !(p2 && dRump < GH.kickReach + 10 && low)) {
        b.t = Math.min(b.t, 0.15);
      }
      if (b.t <= 0) ghDecide(b, px, py, front, dSnout, dRump, adist, low);
      break;
    }
    case 'turn': {
      want = 0;
      if (b.t <= 0) { ghPlantAll(b); ghSet(b, 'idle', p2 ? 0.25 : 0.35); }
      break;
    }
    // --------------------------------------------------------- HORN MISSILE
    case 'hornprep': {
      want = 0; b.windT = b.t;
      if (chance(0.5)) ghSmoke(b, 'big');
      if (p2 && chance(0.4)) ghSmoke(b, 'small');
      if (b.t <= 0) { ghSet(b, 'hornfire', p2 ? GH.hornFire2 : GH.hornFire); b.fired = 0; }
      break;
    }
    case 'hornfire': {
      want = 0;
      if (!(b.fired & 1)) { b.fired |= 1; ghLaunch(b, 'big'); }
      if (p2 && !(b.fired & 2) && b._el >= GH.smallGap) { b.fired |= 2; ghLaunch(b, 'small'); }
      if (b.t <= 0) { ghSet(b, 'hornless', 9); b.awayT = 0; }
      break;
    }
    case 'hornless': {
      // THE OPENING: no horn, no charge, no toss. He paws and snorts and keeps
      // his body between her and the stone — and his head is open
      b.awayT = (b.awayT || 0) + dt;
      want = 0;
      if (b.hornBig && (!p2 || b.hornSmall)) { ghSet(b, 'hornseat', GH.seat); sfx('bosshit'); }
      break;
    }
    case 'hornseat': want = 0; if (b.t <= 0) ghSet(b, 'idle', ghRest(b, 0.7)); break;
    // --------------------------------------------------------------- CHARGE
    case 'chargewarn': {
      want = 0; b.windT = b.t;
      const n = b.chainLeg === 2 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const s0 = 0.1 + i * 0.3;
        if (b._el >= s0 && !(b.scraped & (1 << i))) {
          b.scraped |= 1 << i;
          // a hoof scrape: grit thrown BACK, and the sound of it
          const fx = b.cx() + face * 60;
          for (let j = 0; j < 9; j++)
            addPart(fx, b.y + b.h - 2, -face * rnd(80, 240), rnd(-160, -40), rnd(0.35, 0.6), '#9a8e78', rnd(2, 3.4), 520);
          sfx('step'); sfx('grind');
        }
      }
      if (b.t <= 0.16 && !b.flared) { b.flared = true; burst(ghHeadWorld(b)[0], ghHeadWorld(b)[1], 8, '#ffffff', 160, 0.25, 0, 2.5, true); }
      if (b.t <= 0) {
        ghSet(b, 'rush', 2.4); b.rushHit = false; b.rushFrom = b.cx(); b.passed = false;
        sfx('launch'); cam.shake = Math.max(cam.shake, 4);
        b.vx = face * 120;
      }
      break;
    }
    case 'rush': {
      const top = (p2 ? GH.rush2 : GH.rush) * (DF().espd || 1);
      b.vx += clamp(face * top - b.vx, -GH.rushAcc * dt, GH.rushAcc * dt);
      want = null;                                     // the rush owns vx
      if ((px - b.cx()) * face < -180) b.passed = true; // she is behind him now
      if (chance(0.6)) addPart(b.cx() - face * 70, b.y + b.h - 3, -face * rnd(40, 160), rnd(-90, -20), 0.4, '#9a8e78', 3, 400);
      // past her, far enough: phase one digs in and skids; the chained
      // first leg of phase two runs on to the wall
      const run = Math.abs(b.cx() - b.rushFrom);
      if (b.passed && run > 380 && !(p2 && b.chainLeg === 1) && (px - b.cx()) * face < -260) {
        ghSet(b, 'skid', 0.5); sfx('grind');
      } else if (b.t <= 0) ghSet(b, 'skid', 0.5);
      break;
    }
    case 'skid': {
      want = null;
      const s = Math.sign(b.vx);
      b.vx -= s * GH.skidDec * dt; if (Math.sign(b.vx) !== s) b.vx = 0;
      if (chance(0.8)) addPart(b.cx() + face * 70, b.y + b.h - 2, -face * rnd(20, 120), rnd(-70, -10), 0.4, '#9a8e78', 3, 300);
      if (b.t <= 0 || b.vx === 0) { b.vx = 0; ghSet(b, 'recover', GH.recover); }
      break;
    }
    case 'wallslam': { want = null; b.vx *= Math.pow(0.002, dt); if (b.t <= 0) ghSet(b, 'stunned', p2 ? GH.stun2 : GH.stun); break; }
    case 'wallturn': {
      want = null; b.vx *= Math.pow(0.0005, dt);
      if (b.t <= GH.wallTurn - 0.15 && !b.turned) { b.turned = true; b.face = -face; ghPlantAll(b); sfx('step'); }
      if (b.t <= 0) { b.vx = 0; b.chainLeg = 2; ghSet(b, 'chargewarn', GH.chargeTell2); b.scraped = 0; b.flared = false; }
      break;
    }
    case 'stunned': want = 0; if (b.t <= 0) ghSet(b, 'recover', 0.35); break;
    case 'recover': want = 0; if (b.t <= 0) { b.chainLeg = 0; ghSet(b, 'idle', ghRest(b, 0.6)); } break;
    // ------------------------------------------------------------ HORN TOSS
    case 'tossprep': {
      want = 0; b.windT = b.t;
      if (b._el < 0.05 && !b.snorted) { b.snorted = true; ghSnort(b); }
      if (b.t <= GH.parryLead && !b.glinted) { b.glinted = true; const h = ghHornTip(b); burst(h[0], h[1], 5, PARRY_COL, 120, 0.22, 0, 2.2, true); }
      if (ghParry(b)) break;
      if (b.t <= 0) { ghSet(b, 'toss', GH.toss); b.tossHit = false; sfx('launch'); cam.shake = Math.max(cam.shake, 3); }
      break;
    }
    case 'toss': {
      want = 0;
      if (b._el <= GH.tossHit && ghParry(b)) break;
      if (!b.tossHit && b._el <= GH.tossHit && !player.dead) {
        const B = ghBoxes(b);
        const hit = (b._el <= 0.14 && aabb(B.scoop, player)) || (B.horn && aabb(B.horn, player)) || aabb(B.head, player);
        if (hit) { b.tossHit = true; ghTossHit(b); }
      }
      if (b.t <= 0) {
        ghSet(b, 'tossrecover', p2 ? GH.tossRecover2 : GH.tossRecover);
        // the forelegs come down: the weight lands
        cam.shake = Math.max(cam.shake, 6); sfx('slam');
        for (let i = 0; i < 10; i++) addPart(b.cx() + face * rnd(30, 80), b.y + b.h - 2, rnd(-140, 140), rnd(-120, -20), 0.45, '#9a8e78', 3, 380);
      }
      break;
    }
    case 'tossrecover': want = 0; if (b.t <= 0) ghSet(b, 'idle', ghRest(b, 0.55)); break;
    case 'stagger': { want = null; b.vx *= Math.pow(0.004, dt); if (b.t <= 0) { b.vx = 0; ghSet(b, 'idle', ghRest(b, 0.5)); } break; }
    // ------------------------------------------------------------ REAR KICK
    case 'kickprep': { want = 0; b.windT = b.t; if (b.t <= 0) { ghSet(b, 'kick', GH.kick); b.kickHit = false; sfx('launch'); } break; }
    case 'kick': {
      want = 0;
      if (!b.kickHit && b._el > 0.03 && b._el < 0.16 && !player.dead) {
        const fy = b.y + b.h, rx = b.cx() - face * 92;
        const box = { x: face < 0 ? rx : rx - 92, y: fy - 78, w: 92, h: 74 };
        b.kickBox = box;
        if (aabb(box, player) && player.iT <= 0) {
          b.kickHit = true;
          const c0 = player.cores;
          player.hurt(DF().edmg, b.cx(), 'horn.kick');
          if (player.cores < c0) { player.vx = -face * 560; player.vy = -380; player.flungT = 0.35; b.denied++; b.hitSince = true; }
          cam.shake = Math.max(cam.shake, 8); sfx('slam');
        }
      }
      if (b.t <= 0) { b.kickBox = null; ghSet(b, 'kickrecover', GH.kickRecover); cam.shake = Math.max(cam.shake, 4); sfx('land'); }
      break;
    }
    case 'kickrecover': want = 0; if (b.t <= 0) ghSet(b, 'idle', ghRest(b, 0.5)); break;
    case 'daze': want = 0; if (b.t <= 0) { b.dazeCD = p2 ? 7 : 6; b.dazeHits = 0; b.dazeWin = 0; ghSet(b, 'recover', 0.4); } break;
    // ------------------------------------------------- the turn between phases
    case 'kneel': {
      want = 0; G.ghHold = true;
      if (b.t <= 0) {
        ghSet(b, 'rage', GH.rage); b.raged = false;
        ghSay(t('grv_phase2'));
      }
      break;
    }
    case 'rage': {
      want = 0; G.ghHold = true;
      const k = clamp(b._el / GH.rage, 0, 1);
      if (!b.raged && b._el >= 0.35) {
        b.raged = true; b.phase = 2;
        // THE ARMOUR GOES: plates blown off, the second horn lights
        sfx('quake'); sfx('roar'); sfx('blast');
        cam.shake = Math.max(cam.shake, 14); G.flash = Math.max(G.flash, 0.4);
        if (typeof padRumble === 'function') padRumble(1, 0.8, 700);
        if (typeof roarWave === 'function') roarWave(b.cx(), b.y + 40, '#ff3b1f');
        for (let i = 0; i < 14; i++)
          addPart(b.cx() + rnd(-80, 80), b.y + rnd(10, 60), rnd(-320, 320), rnd(-420, -140), rnd(0.6, 1.1),
            chance(0.5) ? GHC.mid : GHC.lo, rnd(4, 7), 900);
        burst(b.cx(), b.y + 40, 30, GHC.melt, 300, 0.7, 120, 4, true);
      }
      // the bar fills while he stands up into it
      b.invHp = Math.max(1, Math.round(b.hpMax * clamp((k - 0.2) / 0.75, 0.005, 1)));
      b.hp = b.invHp;
      if (b.t <= 0) {
        b.hp = b.hpMax; b.invHp = 0; G.ghHold = null;
        b.dazeCD = 2; b.denied = 0; b.lastMove = null;
        ghSet(b, 'idle', 0.6);
      }
      break;
    }
    // --------------------------------------------------------------- the end
    case 'beaten': {
      want = 0; G.ghHold = true;
      if (chance(0.3)) burst(b.cx() + rnd(-60, 60), b.y + rnd(10, 70), 3, '#ffffff', 160, 0.3, 200, 2, true);
      if (b.t <= 0) {
        ghSet(b, 'ghspeak2', 99);
        ghSay(t('grv_down'), () => { if (b.st === 'ghspeak2') ghSet(b, 'retreat', GH.retreat); });
      }
      break;
    }
    case 'ghspeak2': { want = 0; G.ghHold = true; if (!G.dialog && G.state === 'PLAY' && b._el > 0.3) ghSet(b, 'retreat', GH.retreat); break; }
    case 'retreat': {
      // he backs into the dark of the rock, and the dark keeps him
      G.ghHold = true;
      want = -face * 58;
      b.fade = clamp(b._el / GH.retreat, 0, 1);
      if (chance(0.3)) addPart(b.cx() - face * 90, b.y + rnd(20, b.h), rnd(-40, 40), rnd(-30, 10), 0.8, '#3a3630', rnd(4, 7), -20);
      if (b.t <= 0) ghGone(b);
      break;
    }
    default: ghSet(b, 'idle', 0.4);
  }
  // ---- the body: momentum, gravity, the floor --------------------------------
  if (want != null) {
    const acc = GH.walkAcc;
    b.vx += clamp(want - b.vx, -acc * dt * 3, acc * dt * (Math.abs(want) > Math.abs(b.vx) ? 1 : 3));
  }
  b.vy += 2100 * dt;
  const x0 = b.x;
  const col = moveEnt(b, dt);
  b.on = !!col.d;
  const maxX = G.roomDef.w * TILE - b.w;
  let edge = 0;
  if (b.x < 0) { b.x = 0; edge = -1; } else if (b.x > maxX) { b.x = maxX; edge = 1; }
  if (b.y > G.roomDef.h * TILE + 20) { b.x = b.spawnX; b.y = b.spawnY; b.vx = 0; b.vy = 0; }
  // the charge meets the end of the arena
  if (b.st === 'rush') {
    const wall = (b.face > 0 && col.r) || (b.face < 0 && col.l);
    const end = wall || edge === b.face;
    if (end) ghRushEnd(b, wall);
  }
  // ---- facing: the weighted turn ---------------------------------------------
  const fv = b.faceVis == null ? b.face : b.faceVis;
  const rate = 2 / GH.turnT;
  b.faceVis = fv + clamp((b.face || -1) - fv, -rate * dt, rate * dt);
  if ((Math.sign(b.faceVis) || 1) !== (Math.sign(fv) || 1)) {
    for (let i = 0; i < 10; i++)
      addPart(b.cx() + rnd(-b.w * 0.45, b.w * 0.45), b.y + b.h - rnd(0, 8), rnd(-140, 140), rnd(-150, -30), 0.4, '#9a8e78', 3, 260);
    sfx('step');
  }
  ghGait(b, dt, b.x - x0);
  // ---- contact: a moving rhino is the weapon; a standing one is a wall -------
  ghContact(b);
  b._hpPrev = b.hp;
  if (b.hp <= 0) ghDown(b);
}
// the head's world position (eye), for effects
function ghHeadWorld(b) {
  const P = ghPose(b), m = -(b.face || -1);
  const h = P.headRig(-36, -12);
  return [b.cx() + h[0] * m, b.y + b.h + h[1]];
}
function ghHornTip(b) {
  const P = ghPose(b), m = -(b.face || -1);
  const r = ghRot(-18, -60, P.hornA);
  return [b.cx() + (P.sockBig[0] + r[0]) * m, b.y + b.h + P.sockBig[1] + r[1]];
}
function ghSockWorld(b, which) {
  const P = ghPose(b), m = -(b.face || -1);
  const s = which === 'small' ? P.sockSmall : P.sockBig;
  return [b.cx() + s[0] * m, b.y + b.h + s[1]];
}
function ghSmoke(b, which) {
  const s = ghSockWorld(b, which);
  addPart(s[0] + rnd(-4, 4), s[1] + rnd(-2, 2), rnd(-30, 30), rnd(-70, -30), rnd(0.4, 0.7), chance(0.5) ? '#5c5c5c' : '#7a7470', rnd(3, 5), -60);
}
function ghSnort(b) {
  const h = ghHeadWorld(b), f = b.face || -1;
  for (let i = 0; i < 8; i++) addPart(h[0] + f * 40, h[1] + 20, f * rnd(60, 160), rnd(-30, 20), rnd(0.4, 0.6), '#cfd6dc', rnd(3, 5), -40);
  sfx('vent');
}
// ---- the brain ----------------------------------------------------------------
// THE DECK (.claude/skills/boss-patterns): weighted, re-weighted by where she
// stands, recency debt (bossDraw), and no move twice in a row. Sentences:
//   far:    charge — or the horn, lobbed, if she is up off the floor
//   mid:    walk in; the horn missile
//   close:  the horn toss (and its parry)
//   behind: phase one turns (the opening of standing there); phase two KICKS
// The cold-dice floor: three blows in a row that landed and he stands and
// blows steam for a second — an opening that is not conditional on anything.
function ghDecide(b, px, py, front, dSnout, dRump, adist, low) {
  const p2 = b.phase === 2, face = b.face || -1;
  if (!b.hitSince) b.denied = 0;
  b.hitSince = false;
  b.scraped = 0; b.flared = false; b.snorted = false; b.glinted = false; b.turned = false; b.fired = 0;
  if (!front) {
    if (p2 && dRump < GH.kickReach && low && b.lastMove !== 'kick') {
      ghSet(b, 'kickprep', GH.kickTell); b.lastMove = 'kick'; return;
    }
    ghSet(b, 'turn', GH.turnT); b.face = -face; return;
  }
  if ((b.denied || 0) >= 3) { b.denied = 0; ghSet(b, 'rest', 1.0); b.lastMove = 'rest'; return; }
  const deck = [];
  if (dSnout < GH.tossReach && low) deck.push(['toss', 6]);
  if (adist > 250) deck.push(['charge', adist > 430 ? 4 : 2.5]);
  deck.push(['missile', adist > 380 ? 3.5 : !low ? 4 : 1.6]);
  if (dSnout > GH.tossReach && adist < 380) deck.push(['walk', 2.2]);
  // no move twice in a row (the walk is footwork, not a move)
  const pool = deck.filter(d => d[0] === 'walk' || d[0] !== b.lastMove);
  const pick = bossDraw(b, pool.length ? pool : [['walk', 1]]);
  if (pick === 'walk') {
    ghSet(b, 'walk', rnd(0.6, 1.0)); b.walkGoal = face; return;
  }
  b.lastMove = pick;
  if (pick === 'toss') {
    ghSet(b, 'tossprep', GH.tossTell);
    if (G.save && G.save.flags && !G.save.flags.ghParryTold) { G.save.flags.ghParryTold = 1; G.toast(t('grv_parry_hint')); }
  } else if (pick === 'charge') {
    b.chainLeg = p2 ? 1 : 0;
    ghSet(b, 'chargewarn', GH.chargeTell);
  } else {
    ghSet(b, 'hornprep', p2 ? GH.hornPrep2 : GH.hornPrep);
  }
}
function ghRushEnd(b, wall) {
  const p2 = b.phase === 2, face = b.face || -1;
  if (p2 && b.chainLeg === 1) {
    // THE CHAIN: the first leg ends in a brace and a turn, not a window
    ghSet(b, 'wallturn', GH.wallTurn); b.turned = false; b.vx = -face * 60;
    cam.shake = Math.max(cam.shake, wall ? 7 : 3); sfx(wall ? 'slam' : 'grind');
    return;
  }
  if (!wall) { ghSet(b, 'skid', 0.5); sfx('grind'); return; }
  // THE WALL: he hits it with everything, the roof comes down, and he is open
  ghSet(b, 'wallslam', 0.2);
  b.vx = -face * 140;
  sfx('slam'); sfx('quake'); sfx('crack');
  cam.shake = Math.max(cam.shake, 14); G.hitStop = Math.max(G.hitStop, 0.08);
  if (typeof padRumble === 'function') padRumble(1, 0.7, 420);
  const wx = b.cx() + face * (b.w / 2 + 8);
  for (let i = 0; i < 18; i++) addPart(wx, b.y + rnd(10, b.h - 10), -face * rnd(60, 260), rnd(-260, -40), rnd(0.4, 0.8), chance(0.5) ? '#8a7f6c' : '#5b5348', rnd(3, 5), 900);
  ghRocks(b, wx);
}
// the roof answers the slam: rocks, each with its shadow on the floor first
function ghRocks(b, wx) {
  const W = G.roomDef.w * TILE, face = b.face || -1;
  const xs = [wx - face * rnd(40, 90), wx - face * rnd(200, 300)];
  const px = player.x + player.w / 2;
  if (Math.abs(px - wx) < 640) xs.push(px + rnd(-20, 20));
  for (const x0 of xs) {
    const x = clamp(x0, 40, W - 40);
    let ty = Math.floor((b.y + b.h - 8) / TILE);
    while (ty > 0 && !solidAt(Math.floor(x / TILE), ty)) ty--;
    const y0 = (ty + 1) * TILE;
    b.rocks.push({ x, y: y0, y0, vy: 0, warn: 0.65, ph: 'warn', fy: ghGround(b, x) || (b.y + b.h), r: rnd(11, 15), a: rnd(0, 6) });
  }
}
// ---- the horns in flight ---------------------------------------------------------
function ghLaunch(b, which) {
  const s = ghSockWorld(b, which), face = b.face || -1;
  const px = player.x + player.w / 2, py = player.y + player.h / 2;
  let vx, vy;
  if (which === 'big') {
    // UP, steeply: it climbs over her, leaning her way — and at the lock it
    // turns onto where she is and dives. Standing under his face is not a hiding
    // place; moving after the cyan flash is the answer
    vx = face * GH.mLaunch * 0.42; vy = -GH.mLaunch * 0.9;
  } else {
    // the small horn is direct and fast: aimed where she is, a little led
    const lx = px + (player.vx || 0) * 0.22, ly = py;
    const a = Math.atan2(ly - s[1], lx - s[0]);
    vx = Math.cos(a) * GH.smallSpeed; vy = Math.sin(a) * GH.smallSpeed;
  }
  if (which === 'big') b.hornBig = false; else b.hornSmall = false;
  b.missiles.push({ which, ph: 'fly', x: s[0], y: s[1], vx, vy, t: 0, locked: which === 'small', hit: false, boomT: 0, life: which === 'big' ? GH.mLife : 1.6 });
  sfx('launch'); sfx('shoot');
  cam.shake = Math.max(cam.shake, 3);
  burst(s[0], s[1], 10, '#ff4a2a', 220, 0.3, 0, 2.5, true);
}
function ghMissileBox(m) { return { x: m.x - 11, y: m.y - 11, w: 22, h: 22 }; }
function ghBoom(b, m, swatted) {
  m.ph = 'boom'; m.boomT = 0.4; m.vx = 0; m.vy = 0;
  burst(m.x, m.y, swatted ? 10 : 22, swatted ? '#ffffff' : '#ff5f6d', swatted ? 200 : 300, 0.45, 160, 3.4, true);
  burst(m.x, m.y, 8, '#5b636d', 180, 0.6, 600, 3.6);
  sfx(swatted ? 'block' : 'blast'); cam.shake = Math.max(cam.shake, swatted ? 3 : 6);
  if (!swatted && !m.hit && !player.dead) {
    const d = Math.hypot(player.x + player.w / 2 - m.x, player.y + player.h / 2 - m.y);
    if (d < GH.mBlastR) { m.hit = true; ghHurtBy(b, m.x, 'horn.blast'); }
  }
}
function ghHurtBy(b, fromX, src) {
  const c0 = player.cores;
  player.hurt(DF().edmg, fromX, src);
  if (player.cores < c0) { b.denied = (b.denied || 0) + 1; b.hitSince = true; }
}
function ghProjStep(b, dt) {
  const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
  const px = player.x + player.w / 2, py = player.y + player.h / 2;
  const away = b.phase === 2 ? GH.away2 : GH.away;
  for (let i = b.missiles.length - 1; i >= 0; i--) {
    const m = b.missiles[i];
    m.t += dt;
    if (m.ph === 'fly') {
      if (!m.locked) {
        // LIGHT homing, and only until the lock: after it, dodging works
        const want = Math.atan2(py - m.y, px - m.x), cur = Math.atan2(m.vy, m.vx);
        let d = want - cur; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832;
        const a = cur + clamp(d, -GH.mTurn * dt, GH.mTurn * dt);
        const sp = Math.min(GH.mCruise, Math.hypot(m.vx, m.vy) + 400 * dt);
        m.vx = Math.cos(a) * sp; m.vy = Math.sin(a) * sp;
        if (m.t >= GH.lockT) {
          m.locked = true; m.lockFx = 0.25;
          // THE LOCK: the heading is set on her, once, and never again — and
          // the dive starts slow enough that the flash is a warning (0.35-0.45 s
          // to arrive from where it climbed to), then hardens
          if (m.which === 'big') {
            const la = Math.atan2(py - m.y, px - m.x);
            m.vx = Math.cos(la) * GH.mDive; m.vy = Math.sin(la) * GH.mDive;
          }
          burst(m.x, m.y, 10, '#8ff6ff', 180, 0.25, 0, 2.4, true);
          sfx('chirp');
        }
      } else if (m.which === 'big') {
        const sp = Math.min(GH.mCruise + 80, Math.hypot(m.vx, m.vy) + 700 * dt), a = Math.atan2(m.vy, m.vx);
        m.vx = Math.cos(a) * sp; m.vy = Math.sin(a) * sp;
      }
      if (m.lockFx > 0) m.lockFx -= dt;
      m.x += m.vx * dt; m.y += m.vy * dt;
      if (chance(0.8)) addPart(m.x - m.vx * 0.03, m.y - m.vy * 0.03, rnd(-20, 20), rnd(-30, 10), rnd(0.3, 0.6), chance(0.5) ? '#6b6b6b' : '#8a8580', rnd(2.5, 4), -30);
      const bx = ghMissileBox(m);
      // her claws knock it out of the air: it bursts, harmlessly, where it was
      if (player.swing && player.swing.t > 0 && aabb(player.hitbox(), bx)) { ghBoom(b, m, true); continue; }
      if (!player.dead && player.iT <= 0 && aabb(bx, player)) { m.hit = true; ghHurtBy(b, m.x, 'horn.missile'); ghBoom(b, m, false); continue; }
      const gy = ghGround(b, m.x);
      const solid = solidAt(Math.floor(m.x / TILE), Math.floor(m.y / TILE));
      if (solid || (m.y > gy - 6 && m.vy > 0 && Math.abs(gy - (b.y + b.h)) < 40) || m.x < 0 || m.x > W || m.y > H || m.y < -40 || m.t > m.life) ghBoom(b, m, false);
    } else if (m.ph === 'boom') {
      m.boomT -= dt;
      if (m.boomT <= 0) m.ph = 'ret';
    } else if (m.ph === 'ret') {
      // IT COMES HOME, harmless: up off the floor first, then to its socket.
      // It waits out the rest of the opening — the hornless window is a
      // promise, not an accident of where the shot landed.
      const s = ghSockWorld(b, m.which);
      const early = m.t < away - 0.55;
      const tx = s[0] + (early ? -(b.face || -1) * 60 : 0), ty = s[1] - (early ? 90 : 0);
      const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy) || 1;
      const sp = early ? Math.min(GH.retSpd * 0.6, d * 3) : GH.retSpd;
      m.vx += (dx / d * sp - m.vx) * Math.min(1, dt * 5);
      m.vy += (dy / d * sp - m.vy) * Math.min(1, dt * 5);
      m.x += m.vx * dt; m.y += m.vy * dt;
      if (!early && d < 16) {
        b.missiles.splice(i, 1);
        if (m.which === 'big') b.hornBig = true; else b.hornSmall = true;
        burst(s[0], s[1], 8, '#ffffff', 140, 0.25, 0, 2, true);
        sfx('bosshit');
        continue;
      }
      if (m.t > away + 2.5) {      // never stranded
        b.missiles.splice(i, 1);
        if (m.which === 'big') b.hornBig = true; else b.hornSmall = true;
      }
    }
  }
  for (let i = b.rocks.length - 1; i >= 0; i--) {
    const r = b.rocks[i];
    if (r.ph === 'warn') {
      r.warn -= dt;
      if (chance(0.35)) addPart(r.x + rnd(-10, 10), r.y0 + 2, rnd(-10, 10), rnd(20, 80), 0.6, '#8a7f6c', 2, 500);
      if (r.warn <= 0) { r.ph = 'fall'; sfx('rock'); }
    } else {
      r.vy = Math.min(1100, r.vy + 2200 * dt); r.y += r.vy * dt; r.a += dt * 6;
      if (!player.dead && player.iT <= 0 && aabb({ x: r.x - r.r, y: r.y - r.r, w: r.r * 2, h: r.r * 2 }, player)) {
        ghHurtBy(b, r.x, 'horn.rock');
        r.y = r.fy;
      }
      if (r.y + r.r >= r.fy) {
        burst(r.x, r.fy - 4, 12, '#8a7f6c', 200, 0.5, 600, 3.4);
        sfx('crack'); cam.shake = Math.max(cam.shake, 3);
        b.rocks.splice(i, 1);
      }
    }
  }
}
// ---- the parry, the toss, the head ----------------------------------------------
// HER NORMAL STRIKE ON THE HORN, in the last 150 ms of the toss's wind-up or
// in its active window, facing him: steel on steel. She takes nothing; he is
// knocked back on his heels for 0.9 s. A clash is checked BEFORE the toss's
// hit on the same frame, so the window means what it says.
function ghParry(b) {
  if (player.dead || !player.swing || player.swing.t <= 0 || player.swing.ghClash) return false;
  if (b.st === 'tossprep' && b.t > GH.parryLead) return false;
  const pcx = player.x + player.w / 2;
  const facing = (Math.sign(b.cx() - pcx) || 1) === (player.face || 1);
  if (!facing) return false;
  const B = ghBoxes(b);
  const hb = player.hitbox();
  if (!((B.horn && aabb(hb, B.horn)) || aabb(hb, B.head) || aabb(hb, B.scoop))) return false;
  player.swing.ghClash = true;
  // the clash itself (freeze, ring, the counter it opens) is the shared one,
  // so a strike on the horn and a perfect guard are the same event to the game
  parryClash(player, b, 'strike');
  return true;
}
// ...and what a turned toss does to him, however it was turned
function ghClashed(b, p, how) {
  const face = b.face || -1;
  cam.shake = Math.max(cam.shake, 7);
  const tip = ghHornTip(b), pcx = player.x + player.w / 2;
  const sx = (tip[0] + pcx) / 2, sy = Math.min(tip[1], player.y + 10);
  burst(sx, sy, 12, '#dfe6ee', 300, 0.35, 120, 2.6, true);   // steel, not lock cyan (registry §2)
  sfx('bosshit');
  if (typeof padRumble === 'function') padRumble(0.7, 0.6, 180);
  // both pushed apart
  player.vx = face * 380; player.vy = Math.min(player.vy, -170); player.iT = Math.max(player.iT, 0.45);
  player.flungT = Math.max(player.flungT || 0, 0.18);
  b.vx = -face * ATTACKS.clash.kb;
  b.parries = (b.parries || 0) + 1;
  b.tossHit = true;
  ghSet(b, 'stagger', GH.stagger);
}
function ghTossHit(b) {
  const p2 = b.phase === 2, face = b.face || -1;
  const c0 = player.cores, iT0 = player.iT;
  player.hurt(DF().edmg, b.cx(), 'horn.toss', b);
  if (b.st === 'stagger') return;          // turned by a perfect guard (js/parry.js → ghClashed)
  const KB = p2 ? GH.tossKB2 : GH.tossKB;
  if (player.cores < c0) {
    // THROWN FAR, and dizzy when she lands from it
    player.vx = face * KB[0]; player.vy = -KB[1]; player.on = false;
    player.flungT = 0.55;
    playerDizzy(p2 ? GH.dizzy2 : GH.dizzy);
    b.denied = (b.denied || 0) + 1; b.hitSince = true;
    cam.shake = Math.max(cam.shake, 10); G.hitStop = Math.max(G.hitStop, 0.1);
    sfx('slam');
  } else if (player.iT > iT0) {
    // braced: the plate takes it, and she is shoved, not thrown
    player.vx = face * KB[0] * 0.35;
  }
}
function ghHeadBonus(b) {
  // HORNLESS, THE HEAD IS OPEN: a strike that lands on it bites deeper
  const drop = b._hpPrev - b.hp;
  if (!player.swing) return;
  const B = ghBoxes(b);
  if (!aabb(player.hitbox(), B.head)) return;
  const extra = Math.max(1, Math.round(drop * 0.4));
  b.hp -= extra;
  const h = ghHeadWorld(b);
  burst(h[0], h[1], 10, '#ffffff', 240, 0.3, 120, 2.6, true);
  if (G.save && G.save.flags && !G.save.flags.ghHeadTold) { G.save.flags.ghHeadTold = 1; G.toast(t('grv_head')); }
}
function ghContact(b) {
  if (player.dead || GH_CINE[b.st] || b.st === 'dorm' || b.st === 'ghspeak2') return;
  const B = ghBoxes(b);
  const boxes = [B.front, B.rear, B.head];
  let over = null;
  for (const bx of boxes) if (aabb(bx, player)) { over = bx; break; }
  if (!over) return;
  const moving = b.st === 'rush' || Math.abs(b.vx) > 150;
  if (moving) {
    // one blow per charge: she is thrown clear, not pinned and hit again
    if (player.iT > 0 || (b.st === 'rush' && b.rushHit)) return;
    const c0 = player.cores, face = b.face || -1;
    player.hurt(DF().edmg, b.cx(), b.st === 'rush' ? 'horn.charge' : 'horn.trample');
    if (player.cores < c0) {
      b.rushHit = true; b.denied = (b.denied || 0) + 1; b.hitSince = true;
      if (b.st === 'rush') { player.vx = face * 540; player.vy = -440; player.flungT = 0.45; cam.shake = Math.max(cam.shake, 9); sfx('slam'); }
    }
    return;
  }
  // standing still he is a wall: she is moved out of him, not hurt by him
  if (B.head === over) return;
  const pcx = player.x + player.w / 2;
  const L = Math.min(B.front.x, B.rear.x), R = Math.max(B.front.x + B.front.w, B.rear.x + B.rear.w);
  if (player.y + player.h < over.y + 14) return;      // on his back: she slides off on her own
  if (pcx - L < R - pcx) player.x = Math.min(player.x, L - player.w - 0.5);
  else player.x = Math.max(player.x, R + 0.5);
}
function ghDown(b) {
  if (!b.missiles) ghInit(b);
  if (b.st === 'kneel' || b.st === 'rage' || b.st === 'beaten' || b.st === 'ghspeak2' || b.st === 'retreat' || b.dead) {
    b.hp = Math.max(1, b.hp); return;
  }
  b.hp = 1; b.invHp = 1; b.vx = 0;
  b.rocks.length = 0; b.kickBox = null;
  for (const m of b.missiles) if (m.ph === 'fly') { m.ph = 'ret'; burst(m.x, m.y, 8, '#ffffff', 160, 0.3, 0, 2, true); }
  G.ghHold = true;
  G.hitStop = Math.max(G.hitStop, 0.16); cam.shake = Math.max(cam.shake, 12);
  sfx('slam'); sfx('bosshit');
  burst(b.cx(), b.y + 40, 26, '#ffffff', 340, 0.6, 200, 4, true);
  if (typeof padRumble === 'function') padRumble(0.9, 0.7, 400);
  if (b.phase !== 2) ghSet(b, 'kneel', GH.kneel);
  else ghSet(b, 'beaten', GH.beaten);
}
function ghGone(b) {
  if (!b.missiles) ghInit(b);
  b.dead = true; b.hp = 0; b.fade = 1; b.vx = 0;
  b.missiles.length = 0; b.rocks.length = 0;
  G.ghHold = null;
  if (G.save) {
    G.save.flags.bossHorn = 1;
    if (typeof persist === 'function') persist();
  }
  if (typeof setMusic === 'function') setMusic(G.roomDef.zone);
  if (typeof G.dropScrap === 'function') G.dropScrap(b.cx(), b.y + b.h - 30, 30);
  sfx('collapse'); cam.shake = Math.max(cam.shake, 6);
  G.toast(t('grv_gone'));
}
// ---- the gait: feet that are PLANTED ---------------------------------------------
// Each foot lives in world space. In stance it does not move — not a pixel —
// and the body travels over it; the IK takes up the difference. A foot lifts
// when the body has carried its hip far enough past it (and it is that foot's
// turn: hind-left, fore-left, hind-right, fore-right — the 4-beat walk), and is
// set down ahead of the hip on the drawn floor under it. So the cadence comes
// from the speed, the order from the gait, and the reach can never run out:
// a foot that lags past the leg's reach lifts whatever the order says. Faster
// than 300 px/s (the charge) the steps are shorter in time and more of them
// overlap — a gallop. Stopped, every foot left away from its hip re-plants,
// one at a time.
const GH_SEQ = [2, 0, 3, 1];            // hn, fn, hf, ff
function ghHipWorld(b, i) {
  const m = -(b.face || -1), L = GH_LEGS[i].hip;
  return b.cx() + (GH_RIG.body[0] + L[0]) * m;
}
function ghPlantAll(b) {
  if (!b.feet) b.feet = [{}, {}, {}, {}];
  const m = -(b.face || -1);
  for (let i = 0; i < 4; i++) {
    // a standing animal is not square: the near pair splayed a little
    const x = ghHipWorld(b, i) + [-6, 4, 6, -4][i] * m;
    b.feet[i] = { x, y: ghGround(b, x), sw: false, k: 0, lift: 0 };
  }
  b.gseq = 0;
}
function ghGait(b, dt, dx) {
  if (!b.feet || !b.feet[0] || b.feet[0].x == null) ghPlantAll(b);
  const spd = Math.abs(b.vx), run = spd > 300 || b.st === 'rush';
  const reach = run ? 42 : 30, T = run ? 0.11 : 0.24, liftH = run ? 20 : 12;
  const maxAir = run ? 3 : 2;
  const moving = spd > 12 && b.on;
  const dir = Math.sign(b.vx) || (b.face || -1);
  let air = 0;
  for (const F of b.feet) if (F.sw) air++;
  // land the feet already in the air
  for (let i = 0; i < 4; i++) {
    const F = b.feet[i];
    if (!F.sw) continue;
    F.k = Math.min(1, F.k + dt / F.T);
    // the landing spot travels with the body until the hoof comes down
    const hipX = ghHipWorld(b, i);
    if (F.mode === 'step') F.tx = hipX + b.vx * (1 - F.k) * F.T + dir * reach * 0.9;
    F.x = lerp(F.sx, F.tx, ghEase(F.k));
    F.y = ghGround(b, F.x); F.lift = Math.sin(Math.PI * F.k) * F.h;
    if (F.k >= 1) ghLand(b, F, i, F.run);
  }
  air = 0; for (const F of b.feet) if (F.sw) air++;
  if (moving) {
    // whose turn it is, and anyone left too far behind
    for (let n = 0; n < 4; n++) {
      const i = GH_SEQ[(b.gseq + n) % 4], F = b.feet[i];
      if (F.sw) continue;
      // judged one frame AHEAD: on a slow device a frame is a long stride, and
      // a foot only lifted once it is already past its reach has been drawn
      // over-stretched for a frame — the hoof dragged off its plant
      const lag = (F.x - ghHipWorld(b, i)) * dir - spd * Math.min(dt, 0.1);
      const turn = n === 0;
      if ((turn && lag < -reach && air < maxAir) || lag < -reach - 6) {
        F.sw = true; F.mode = 'step'; F.k = 0; F.T = T; F.h = liftH; F.run = run;
        F.sx = F.x; F.tx = ghHipWorld(b, i) + b.vx * T + dir * reach * 0.9;
        air++;
        if (turn) b.gseq = (b.gseq + 1) % 4;
      }
    }
  } else if (b.on && !air) {
    // stopped: square up, one foot at a time
    for (let n = 0; n < 4; n++) {
      const i = GH_SEQ[(b.gseq + n) % 4], F = b.feet[i];
      const hipX = ghHipWorld(b, i);
      if (Math.abs(F.x - hipX) > 20) {
        F.sw = true; F.mode = 'settle'; F.k = 0; F.T = 0.2; F.h = 8; F.run = false;
        F.sx = F.x; F.tx = hipX; b.gseq = (GH_SEQ.indexOf(i) + 1) % 4;
        break;
      }
    }
  }
  // the body rides the stride: it dips as each foot takes the weight, and
  // eases back up as the next one swings
  const want = moving ? -(run ? 4 : 2.2) * Math.min(1, air / 2) : 0;
  b._bob = lerp(b._bob || 0, want, 1 - Math.pow(0.0005, dt));
  b.gph = (b.gph || 0) + Math.abs(dx) / 96;
}
function ghLand(b, F, i, run) {
  F.sw = false; F.lift = 0; F.x = F.tx; F.y = ghGround(b, F.x);
  // a plant: grit off the hoof, and on the heavy beats the room feels it
  for (let j = 0; j < (run ? 5 : 3); j++)
    addPart(F.x + rnd(-8, 8), F.y - 2, rnd(-60, 60), rnd(-60, -15), rnd(0.3, 0.5), '#9a8e78', rnd(2, 3), 300);
  if (run) { if (i < 2) { sfx('land'); cam.shake = Math.max(cam.shake, 1.6); } }
  else if (i >= 2 && b.st !== 'retreat' && b.st !== 'ghwake') sfx('step');
  else if (b.st === 'ghwake' && i >= 2) { sfx('land'); cam.shake = Math.max(cam.shake, 1.4); }
}
// ---- the picture -------------------------------------------------------------
function drawGravehorn(c, b) {
  // any construction route draws: a body spawned and drawn without ever
  // stepping (the infection roster, an art harness) has no shots in the air
  // and both horns seated — never the entrance's dark, which only ghInit sets
  if (!b.missiles) b.missiles = [];
  if (!b.rocks) b.rocks = [];
  if (b.hornBig == null) b.hornBig = true;
  if (b.hornSmall == null) b.hornSmall = true;
  const P = ghPose(b);
  const legs = ghLegs(b, P);
  const cx = b.cx(), fy = b.y + b.h;
  const fv = b.faceVis == null ? (b.face || -1) : b.faceVis;
  const sx = -(Math.sign(fv) || -1) * Math.max(0.16, Math.abs(fv));
  const p2 = b.phase === 2;
  // the dark belongs to the entrance and the fade to the exit; any other
  // state (an art harness posing one by name) is drawn in full light
  const dark = (b.st === 'dorm' || b.st === 'ghwake') ? clamp(b.dark == null ? 1 : b.dark, 0, 1) : 0;
  const fade = (b.st === 'retreat' || b.dead) ? clamp(b.fade || 0, 0, 1) : 0;
  if (!G.artProbe && fade < 1) contactShadow(c, cx, fy, 150 * Math.abs(sx), 0.45 * (1 - fade));
  c.save();
  c.globalAlpha *= 1 - fade * 0.96;
  c.translate(cx, fy); c.scale(sx, 1);
  const far = { far: true }, near = {};
  const leg = (Lg, sty) => {
    ghPart(c, Lg.L.up, Lg.hip[0], Lg.hip[1], Lg.a1 - Math.PI / 2, sty, p2);
    ghPart(c, Lg.L.lo, Lg.kn.x, Lg.kn.y, Lg.a2 - Math.PI / 2, sty, p2);
    // the stand-in's hoof, level; a lower-leg plate carries its own
    if (!ghPlate(Lg.L.lo)) { c.save(); c.translate(Lg.foot[0], Lg.foot[1]); c.rotate(clamp((Lg.a2 - Math.PI / 2) * 0.25, -0.2, 0.2)); ghHoof(c, sty, 0); c.restore(); }
  };
  // far side first: the far hind leg, the far foreleg, the tail
  leg(legs[3], far); leg(legs[1], far);
  const tr = P.toRig(GH_RIG.tail[0], GH_RIG.tail[1]);
  ghPart(c, 'tail', tr[0], tr[1], -P.tail + P.br, near, p2);
  // the barrel
  ghPart(c, 'body', P.bpx, P.bpy, P.br, near, p2);
  // the near hind leg over the barrel
  leg(legs[2], near);
  // the head and its horns
  const headPart = P.jaw ? 'head_roar' : 'head';
  ghPart(c, headPart, P.neck[0], P.neck[1], P.ha, near, p2);
  if (b.hornSmall !== false) ghPart(c, 'horn_small', P.sockSmall[0], P.sockSmall[1], P.hornA, near, p2);
  if (b.hornBig !== false) ghPart(c, 'horn_big', P.sockBig[0], P.sockBig[1], P.hornA, near, p2);
  leg(legs[0], near);
  // ---- light: the eye, the nozzles (additive — the §0.0 glow exception) ----
  c.save();
  c.globalCompositeOperation = 'lighter';
  const tk = P.tell || 0;
  // the identity red LERPS toward the amber during a wind-up (Hue Law §3.5)
  const eyeCol = tk > 0 ? ghMix('#ff3b2a', TELL_COL, tk) : '#ff3b2a';
  const eyeP = P.headRig(-36, -12);
  // the infection looks out through this eye (js/infection-eyes.js): reported
  // where it is drawn this frame, in the head's own transform — so it rides
  // the toss, the kneel, the hornless sag and the phase-two head alike
  if (typeof infEyeMark === 'function') infEyeMark(c, eyeP[0], eyeP[1]);
  const er = 5 + 3 * Math.max(0, (P.eye || 1) - 1);
  const g1 = c.createRadialGradient(eyeP[0], eyeP[1], 0.5, eyeP[0], eyeP[1], er * 3.2);
  g1.addColorStop(0, '#ffffff'); g1.addColorStop(0.25, eyeCol); g1.addColorStop(1, 'rgba(255,40,30,0)');
  c.globalAlpha = clamp(P.eye, 0.2, 1);
  c.fillStyle = g1; c.beginPath(); c.arc(eyeP[0], eyeP[1], er * 3.2, 0, 6.2832); c.fill();
  if (P.glance) {
    // the glance back: the eye-light thrown over the shoulder
    const gp = P.toRig(-40, -46);
    c.globalAlpha = P.glance; c.fillStyle = eyeCol;
    c.beginPath(); c.ellipse(gp[0] + 30 * P.glance, gp[1], 10, 4, 0, 0, 6.2832); c.fill();
  }
  c.globalAlpha = 1;
  const nozzle = (sock, k, col, r) => {
    if (k <= 0.01) return;
    const g = c.createRadialGradient(sock[0], sock[1], 0.5, sock[0], sock[1], r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, col); g.addColorStop(1, 'rgba(255,60,30,0)');
    c.globalAlpha = k; c.fillStyle = g; c.beginPath(); c.arc(sock[0], sock[1], r, 0, 6.2832); c.fill();
  };
  nozzle(P.sockBig, P.glowB, ghMix('#ff4a2a', TELL_COL, tk), 22);
  if (p2) nozzle(P.sockSmall, Math.max(P.glowS, b.hornSmall ? 0.35 + 0.15 * Math.sin((b.anim || 0) * 18) : 0), ghMix('#ff3b1f', TELL_COL, tk), 14);
  if (p2 && !G.artProbe) {
    // the jet vents along the spine breathe red
    for (const vx of [-40, -6, 28]) {
      const v = P.toRig(vx, -48);
      const fl = 0.4 + 0.3 * Math.sin((b.anim || 0) * 23 + vx);
      c.globalAlpha = fl; c.fillStyle = GHC.melt;
      c.beginPath(); c.ellipse(v[0], v[1] - 6, 3, 8 + fl * 5, 0, 0, 6.2832); c.fill();
    }
  }
  c.restore();
  // stepping out of the dark: a silhouette laid over him and lifted
  if (dark > 0.01) {
    c.save(); c.globalAlpha *= dark * 0.92;
    const sil = { sil: '#05070a' };
    leg(legs[3], sil); leg(legs[1], sil);
    ghPart(c, 'body', P.bpx, P.bpy, P.br, sil, p2);
    leg(legs[2], sil);
    ghPart(c, headPart, P.neck[0], P.neck[1], P.ha, sil, p2);
    if (b.hornBig !== false) ghPart(c, 'horn_big', P.sockBig[0], P.sockBig[1], P.hornA, sil, p2);
    leg(legs[0], sil);
    c.restore();
    // ...and the eye still burns through it
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.9;
    c.fillStyle = '#ff3b2a'; c.beginPath(); c.arc(eyeP[0], eyeP[1], 3.4, 0, 6.2832); c.fill();
    c.restore();
  }
  c.restore();
  // ---- world-space: stars, the steam, the missiles, the rocks ----
  const m = -(b.face || -1);
  if (P.stars && !G.artProbe) {
    const h = P.headRig(-30, -40);
    // his stars are pale steel, not the warning amber: a stunned soldier is
    // the opening, and the opening must not wear the telegraph's colour
    ghStars(c, cx + h[0] * m, fy + h[1], b.anim || 0, '#eef0f4');
  }
  if (!G.artProbe) ghDrawShots(c, b);
}
function ghMix(a, b2, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b2.slice(1), 16);
  const r = Math.round(lerp(pa >> 16, pb >> 16, k)), g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, k)), bl = Math.round(lerp(pa & 255, pb & 255, k));
  return 'rgb(' + r + ',' + g + ',' + bl + ')';
}
function ghStars(c, x, y, an, col) {
  c.save();
  for (let i = 0; i < 3; i++) {
    const a = an * 4 + i * 2.094;
    const sx = x + Math.cos(a) * 16, sy = y + Math.sin(a) * 5;
    c.fillStyle = col; c.globalAlpha = 0.65 + 0.35 * Math.sin(a);
    c.beginPath();
    for (let j = 0; j < 10; j++) {
      const rr = j % 2 ? 1.6 : 4, aa = j * Math.PI / 5 + an * 3;
      c[j ? 'lineTo' : 'moveTo'](sx + Math.cos(aa) * rr, sy + Math.sin(aa) * rr);
    }
    c.closePath(); c.fill();
  }
  c.restore();
}
function ghDrawShots(c, b) {
  const p2 = b.phase === 2;
  // the small horn's lock line in the gap before it leaves (lock cyan:
  // "you are targeted specifically", registry §2)
  if (p2 && b.st === 'hornfire' && b.hornSmall && b._el < GH.smallGap) {
    const s = ghSockWorld(b, 'small');
    c.save(); c.strokeStyle = '#8ff6ff'; c.globalAlpha = 0.25 + 0.5 * (b._el / GH.smallGap);
    c.lineWidth = 1.6; c.setLineDash([6, 6]);
    c.beginPath(); c.moveTo(s[0], s[1]); c.lineTo(player.x + player.w / 2, player.y + player.h / 2); c.stroke();
    c.setLineDash([]); c.restore();
  }
  for (const mm of b.missiles) {
    if (mm.ph === 'boom') continue;
    const a = Math.atan2(mm.vy, mm.vx) + Math.PI / 2;
    // the exhaust: red-white light behind the horn's base
    if (mm.ph === 'fly') {
      c.save(); c.globalCompositeOperation = 'lighter';
      const bx = mm.x - Math.cos(a - Math.PI / 2) * 6, by = mm.y - Math.sin(a - Math.PI / 2) * 6;
      const g = c.createRadialGradient(bx, by, 0.5, bx, by, 24);
      g.addColorStop(0, '#fff2ea'); g.addColorStop(0.3, '#ff4a2a'); g.addColorStop(1, 'rgba(255,60,30,0)');
      c.fillStyle = g; c.beginPath(); c.arc(bx, by, 24, 0, 6.2832); c.fill();
      // the burn behind it: a short streak along the way it came, so the shot
      // reads in the dark at phone size
      const sp = Math.hypot(mm.vx, mm.vy) || 1;
      c.strokeStyle = 'rgba(255,90,60,0.55)'; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - mm.vx / sp * 46, by - mm.vy / sp * 46); c.stroke();
      if (mm.lockFx > 0) {
        c.globalAlpha = mm.lockFx / 0.25; c.strokeStyle = '#8ff6ff'; c.lineWidth = 2.5;
        c.beginPath(); c.arc(mm.x, mm.y, 22 - mm.lockFx * 30, 0, 6.2832); c.stroke();
      }
      c.restore();
    }
    // the horn itself, tip first along its flight
    const part = mm.which === 'big' ? 'horn_big' : 'horn_small';
    const len = mm.which === 'big' ? 62 : 32;
    c.save();
    c.translate(mm.x, mm.y); c.rotate(a);
    ghPart(c, part, 0, len * 0.45, 0, mm.ph === 'ret' ? { far: true } : {}, p2);
    c.restore();
  }
  for (const r of b.rocks) {
    // the shadow on the floor: danger red at its rim (registry §2 — the
    // floor going hostile), growing as the rock comes
    const k = r.ph === 'warn' ? 1 - r.warn / 0.65 : 1;
    c.save();
    c.fillStyle = 'rgba(0,0,0,' + (0.25 + 0.35 * k) + ')';
    c.beginPath(); c.ellipse(r.x, r.fy - 2, r.r * (0.6 + 0.6 * k), 4 + 2 * k, 0, 0, 6.2832); c.fill();
    c.strokeStyle = 'rgba(255,95,109,' + (0.3 + 0.5 * k) + ')'; c.lineWidth = 1.6; c.stroke();
    if (r.ph === 'fall') {
      c.translate(r.x, r.y); c.rotate(r.a);
      c.fillStyle = '#6e6456';
      c.beginPath();
      for (let j = 0; j < 7; j++) { const aa = j / 7 * 6.2832, rr = r.r * (0.75 + 0.25 * Math.sin(j * 2.3)); c[j ? 'lineTo' : 'moveTo'](Math.cos(aa) * rr, Math.sin(aa) * rr); }
      c.closePath(); c.fill();
      c.fillStyle = '#8a7f6c'; c.beginPath(); c.arc(-r.r * 0.25, -r.r * 0.3, r.r * 0.35, 0, 6.2832); c.fill();
    }
    c.restore();
  }
}
// the dialogue bust: his head, framed, until a portrait exists
function ghPortrait(c, x, y, S) {
  c.save();
  c.beginPath(); c.arc(x + S / 2, y + S / 2, S / 2, 0, 6.2832); c.clip();
  c.fillStyle = '#0b0e12'; c.fillRect(x, y, S, S);
  c.translate(x + S * 0.72, y + S * 0.56); c.scale(0.62, 0.62);
  ghPart(c, 'head', 0, 0, -0.1, {}, false);
  ghPart(c, 'horn_big', GH_RIG.sockBig[0], GH_RIG.sockBig[1], -0.22, {}, false);
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = '#ff3b2a'; c.beginPath(); c.arc(-36, -12, 5, 0, 6.2832); c.fill();
  c.restore();
}
// the name card, over the HUD while he bellows
function drawGhCard(c) {
  const k = G.ghCard;
  if (!k || G.state !== 'PLAY') return;
  const a = clamp(Math.min((k.t0 - k.t) / 0.35, k.t / 0.6), 0, 1);
  c.save(); c.globalAlpha = a;
  c.fillStyle = 'rgba(6,8,12,0.72)';
  c.fillRect(0, 168, 960, 92);
  c.fillStyle = '#a8291f'; c.fillRect(0, 168, 960, 3); c.fillRect(0, 257, 960, 3);
  ftxt(t('grv_name'), 480, 214, 40, '#f2e9e4', 'center', '#ff3b2a');
  ftxt(t('grv_title'), 480, 244, 16, '#d8c8c0', 'center');
  c.restore();
}
// ---- DIZZY: a status any boss can hand out (this is the first) ---------------
// Stars round her head; for its length she can WALK, slowly, and nothing
// else — no jump, no strike, no dash, no power. One rule, readable at a glance.
// It never stacks: a dizzy player is not made dizzier.
function playerDizzy(sec) {
  if (!player || player.dead) return false;
  if ((player.dizzyT || 0) > 0) return false;
  player.dizzyT = sec; player.dizzy0 = sec;
  player.atkBuf = 0; player.jbuf = 0; player.chargeT = 0;
  return true;
}
function drawDizzy(c, p) {
  if (!p || p.dead || !(p.dizzyT > 0)) return;
  const fade = clamp(p.dizzyT / 0.3, 0, 1);
  c.save(); c.globalAlpha *= fade;
  ghStars(c, p.x + p.w / 2, p.y - 14, (performance.now() / 1000), '#ffe08a');
  c.restore();
}
// ---- the words, in five languages ------------------------------------------------
TEXT_LAYERS.push({
  robo: true,
  en: {
    grv_name: 'GRAVEHORN',
    grv_title: 'First Soldier of the Eye',
    b_horn: 'GRAVEHORN, FIRST SOLDIER OF THE EYE',
    grv_intro: ['So the little cleaner woke up.',
      'I am GRAVEHORN, First Soldier of the Eye. It posted me on this stone.',
      'The marble stays buried. So will you.'],
    grv_again: ['Back again, cleaner? The stone is still mine.'],
    grv_phase2: ['Enough. The Eye built me for war. Now you see all of it.'],
    grv_down: ["This isn't over.", 'The Eye sees you, cleaner. Next time it comes itself.'],
    grv_gone: 'GRAVEHORN backs into the rock and is gone. The raw marble is unguarded.',
    grv_parry_hint: 'Strike his horn as it comes up — a clean hit turns the toss.',
    grv_head: 'His horn is gone — the head is open. Hit it!',
    op_o_gravehorn: 'GRAVEHORN stands on the raw marble at the end of the cave. Drive him off.',
    pg_goal_gravehorn: 'GRAVEHORN stands on the raw marble at the end of the cave. Drive him off.',
  },
  ar: {
    grv_name: 'قَرنُ القبر',
    grv_title: 'الجنديّ الأوّل للعين',
    b_horn: 'قَرنُ القبر، الجنديّ الأوّل للعين',
    grv_intro: ['إذن استيقظت المنظِّفة الصغيرة.',
      'أنا قَرنُ القبر، الجنديّ الأوّل للعين. أقامتني على هذا الحجر.',
      'الرخام يبقى مدفونًا. وأنتِ كذلك.'],
    grv_again: ['عدتِ يا منظِّفة؟ الحجر ما زال لي.'],
    grv_phase2: ['كفى. صنعتني العين للحرب. الآن ترين كلّ ما فيّ.'],
    grv_down: ['لم ينتهِ الأمر.', 'العين تراكِ يا منظِّفة. في المرّة القادمة تأتي بنفسها.'],
    grv_gone: 'تراجع قَرنُ القبر إلى الصخر واختفى. الرخام الخام بلا من يقف عليه.',
    grv_parry_hint: 'اضربي قرنه وهو يرتفع — ضربة نظيفة تردّ النطحة.',
    grv_head: 'قرنه غائب — رأسه مكشوف. اضربيه!',
    op_o_gravehorn: 'يقف قَرنُ القبر على الرخام الخام في آخر الكهف. اطرديه.',
    pg_goal_gravehorn: 'يقف قَرنُ القبر على الرخام الخام في آخر الكهف. اطرديه.',
  },
  tr: {
    grv_name: 'MEZARBOYNUZ',
    grv_title: "Göz'ün Birinci Askeri",
    b_horn: "MEZARBOYNUZ, GÖZ'ÜN BİRİNCİ ASKERİ",
    grv_intro: ['Demek küçük temizlikçi uyandı.',
      "Ben MEZARBOYNUZ, Göz'ün Birinci Askeri. Beni bu taşın başına o dikti.",
      'Mermer gömülü kalır. Sen de öyle.'],
    grv_again: ['Yine mi geldin, temizlikçi? Taş hâlâ benim.'],
    grv_phase2: ['Yeter. Göz beni savaş için yaptı. Şimdi hepsini göreceksin.'],
    grv_down: ['Bu iş bitmedi.', 'Göz seni görüyor, temizlikçi. Bir dahakine kendisi gelir.'],
    grv_gone: 'MEZARBOYNUZ kayanın içine geri çekilip kayboldu. Ham mermerin başında kimse yok.',
    grv_parry_hint: 'Boynuzu kalkarken ona vur — temiz bir vuruş savurmayı geri çevirir.',
    grv_head: 'Boynuzu yok — kafası açıkta. Vur!',
    op_o_gravehorn: 'MEZARBOYNUZ mağaranın sonunda ham mermerin başında duruyor. Onu kovala.',
    pg_goal_gravehorn: 'MEZARBOYNUZ mağaranın sonunda ham mermerin başında duruyor. Onu kovala.',
  },
  zh: {
    grv_name: '墓角',
    grv_title: '天眼的第一士兵',
    b_horn: '墓角，天眼的第一士兵',
    grv_intro: ['原来小清洁工醒了。', '我是墓角，天眼的第一士兵。它把我派到这块石头上。', '大理石会一直埋着。你也一样。'],
    grv_again: ['又来了，清洁工？石头还是我的。'],
    grv_phase2: ['够了。天眼为战争造了我。现在让你看个全。'],
    grv_down: ['这事没完。', '天眼看着你，清洁工。下一次，它亲自来。'],
    grv_gone: '墓角退进岩石里，消失了。原生大理石没人看着了。',
    grv_parry_hint: '在它的角往上挑时打它的角——打得干净就能弹开这一挑。',
    grv_head: '它的角飞走了——头露出来了，快打！',
    op_o_gravehorn: '墓角站在洞穴尽头的原生大理石上。把它赶走。',
    pg_goal_gravehorn: '墓角站在洞穴尽头的原生大理石上。把它赶走。',
  },
  ru: {
    grv_name: 'МОГИЛЬНЫЙ РОГ',
    grv_title: 'Первый солдат Ока',
    b_horn: 'МОГИЛЬНЫЙ РОГ, ПЕРВЫЙ СОЛДАТ ОКА',
    grv_intro: ['Значит, маленькая уборщица проснулась.',
      'Я МОГИЛЬНЫЙ РОГ, первый солдат Ока. Оно поставило меня на этот камень.',
      'Мрамор останется в земле. И ты тоже.'],
    grv_again: ['Опять ты, уборщица? Камень всё ещё мой.'],
    grv_phase2: ['Хватит. Око сделало меня для войны. Теперь смотри на всё.'],
    grv_down: ['Это ещё не конец.', 'Око видит тебя, уборщица. В следующий раз оно придёт само.'],
    grv_gone: 'МОГИЛЬНЫЙ РОГ пятится в скалу и исчезает. Сырой мрамор никто не держит.',
    grv_parry_hint: 'Бей по рогу, когда он идёт вверх, — чистый удар сбивает бросок.',
    grv_head: 'Рога нет — голова открыта. Бей!',
    op_o_gravehorn: 'МОГИЛЬНЫЙ РОГ стоит на сыром мраморе в конце пещеры. Прогони его.',
    pg_goal_gravehorn: 'МОГИЛЬНЫЙ РОГ стоит на сыром мраморе в конце пещеры. Прогони его.',
  },
});
