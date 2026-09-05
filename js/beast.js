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
const BEAST_CACHE = { dark: null, glow: {} };
// assembly anchors, exposed so the auditor can calibrate them against the art
const BEAST_TUNE = { headX: -82, headY: -188, bodyX: 118, bodyY: 229, shX: -100, hpX: 62 };
// live-render state the glow overlays read: set per-draw, never persisted
const BEAST_LIVE = { t: 0, glow: 1, charge: 0 };

// ---------------------------------------------------------------------------
// THE VIRUS VEINS. The artist already painted every emissive mark — eye,
// core discs, joint lights, the tail spade. Scan each sprite ONCE for its
// purple pixels, cluster them, and breathe additive pulses at exactly those
// authored positions. Nothing is repainted; the light just lives.
// ---------------------------------------------------------------------------
function beastGlowSpots(key) {
  const cache = BEAST_CACHE.glow;
  if (cache[key] !== undefined) return cache[key];
  const im = beastImg(); if (!im || !im.naturalWidth) return null;
  const s = BEAST_P[key];
  const cv = document.createElement('canvas'); cv.width = s[2]; cv.height = s[3];
  const q = cv.getContext('2d', { willReadFrequently: true });
  q.drawImage(im, s[0], s[1], s[2], s[3], 0, 0, s[2], s[3]);
  let d;
  try { d = q.getImageData(0, 0, s[2], s[3]).data; } catch (e) { return (cache[key] = null); }
  const cl = [];
  for (let y = 0; y < s[3]; y += 2) for (let x = 0; x < s[2]; x += 2) {
    const i = (y * s[2] + x) * 4;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    // the authored virus purple: blue-heavy, red-warm, green-starved
    if (d[i + 3] > 120 && b > 140 && r > 70 && b - g > 60 && r - g > 8) {
      let hit = null;
      for (const c2 of cl)
        if (Math.abs(x - c2.sx / c2.n) < 13 && Math.abs(y - c2.sy / c2.n) < 13) { hit = c2; break; }
      if (hit) { hit.sx += x; hit.sy += y; hit.n++; }
      else cl.push({ sx: x, sy: y, n: 1 });
    }
  }
  const out = cl.filter(c2 => c2.n >= 2)
    .sort((a2, b2) => b2.n - a2.n).slice(0, 14)
    .map(c2 => ({
      x: c2.sx / c2.n, y: c2.sy / c2.n,
      r: 4.5 + Math.min(15, Math.sqrt(c2.n) * 2.4),
    }));
  cache[key] = out;
  return out;
}

// breathe the pulses over a just-drawn sprite. (px,py) is the same pivot
// offset the sprite was drawn with; dim knocks far-side veins back.
function bGlowOver(c, key, px, py, dim, sc) {
  const k = BEAST_LIVE.glow * (dim || 1);
  if (k <= 0.05) return;
  const spots = beastGlowSpots(key);
  if (!spots || !spots.length) return;
  const F = sc || 1;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const sp of spots) {
    // the wave travels ALONG the body: phase keyed to the vein's x position
    const ph = BEAST_LIVE.t * 2.7 + sp.x * 0.05 + sp.y * 0.02;
    const a = Math.max(0, k * (0.16 + 0.15 * Math.sin(ph)));
    if (a <= 0.02) continue;
    const gx = (sp.x - px) * F, gy = (sp.y - py) * F;
    const gr = sp.r * F * (1.15 + 0.3 * Math.sin(ph * 0.5 + 1));
    const gg = c.createRadialGradient(gx, gy, 0.5, gx, gy, gr);
    if (BEAST_LIVE.pure) {
      // the virus is gone: the same authored vein positions breathe CLEAN
      gg.addColorStop(0, 'rgba(190,255,240,' + Math.min(0.8, a * 1.6) + ')');
      gg.addColorStop(0.5, 'rgba(90,235,205,' + a + ')');
      gg.addColorStop(1, 'rgba(20,140,120,0)');
    } else if (BEAST_LIVE.charge > 0.02) {
      // WINDING UP: every authored vein runs from virus purple to the game's
      // one warning colour. The Hue Law already says amber means "this is
      // coming" and nothing else in the game is allowed to use it, so the
      // charge does not need explaining — a player who has met one telegraph
      // has met this one. It is the whole animal that changes, not a badge.
      const q = BEAST_LIVE.charge;
      const mix = (c0, c1) => Math.round(c0 + (c1 - c0) * q);
      const r0 = mix(226, 255), g0 = mix(168, 246), b0 = mix(255, 205);
      const r1 = mix(176, 255), g1 = mix(106, 194), b1 = mix(255, 74);
      gg.addColorStop(0, 'rgba(' + r0 + ',' + g0 + ',' + b0 + ',' + Math.min(0.9, a * (1.6 + q)) + ')');
      gg.addColorStop(0.5, 'rgba(' + r1 + ',' + g1 + ',' + b1 + ',' + (a * (1 + q * 0.6)) + ')');
      gg.addColorStop(1, 'rgba(' + mix(120, 180) + ',' + mix(50, 90) + ',' + mix(210, 20) + ',0)');
    } else {
      gg.addColorStop(0, 'rgba(226,168,255,' + Math.min(0.8, a * 1.6) + ')');
      gg.addColorStop(0.5, 'rgba(176,106,255,' + a + ')');
      gg.addColorStop(1, 'rgba(120,50,210,0)');
    }
    c.fillStyle = gg;
    c.beginPath(); c.arc(gx, gy, gr, 0, 7); c.fill();
  }
  c.restore();
}

function beastImg() {
  if (typeof MEDIA_IMG === 'undefined') return null;
  return (typeof softArt === 'function' && softArt('beastParts')) || MEDIA_IMG.beastParts;
}

// ---------------------------------------------------------------------------
// THE FRONT VIEW, built from the authored art itself. The sheet has no
// straight-on figure, but the 3/4 head mirrored about its face axis gives a
// true two-eyed front face (every pixel is the artist's), the body sprite's
// chest disc is the torso seen end-on, and the leg sprites stand under it.
// The turn passes THROUGH this — side, front, side — never a flat sliver.
// ---------------------------------------------------------------------------
function beastFront() {
  if (BEAST_CACHE.front) return BEAST_CACHE.front;
  const im = beastImg(); if (!im || !im.naturalWidth) return null;
  const cv = document.createElement('canvas'); cv.width = 240; cv.height = 280;
  const q = cv.getContext('2d');
  const P = BEAST_P, CXc = 120, GY = 274;
  const part = (key, dx, dy, sc, mirror, dark) => {
    const s = P[key];
    q.save();
    q.translate(dx, dy);
    if (mirror) q.scale(-1, 1);
    if (sc) q.scale(sc, sc);
    if (dark) q.globalAlpha = 0.68;
    q.drawImage(im, s[0], s[1], s[2], s[3], -s[2] / 2, -s[3] / 2, s[2], s[3]);
    q.restore();
  };
  // hind legs peeking outside, darker (they are further away)
  part('bleg1', CXc - 58, GY - 60, 1, false, true);
  part('bleg1', CXc + 58, GY - 60, 1, true, true);
  // front legs, planted
  part('fleg1', CXc - 34, GY - 58, 1, false);
  part('fleg1', CXc + 34, GY - 58, 1, true);
  part('fleg0', CXc - 36, GY - 118, 1, false);
  part('fleg0', CXc + 36, GY - 118, 1, true);
  // chest: the body sprite's disc end, seen straight on
  {
    const s = P.body;
    const w = 96;                                   // the disc portion only
    q.drawImage(im, s[0], s[1], w, s[3], CXc - w * 0.62, GY - 196, w * 1.24, s[3] * 1.1);
  }
  // the face: mirror-composited about the face axis (x=34 in the head sprite)
  {
    const s = P.head, AX = 34;
    const hw = s[2] - AX;                           // mane side width
    const hy = GY - 258;
    // right half: the original's mane side
    q.save();
    q.beginPath(); q.rect(CXc, hy, hw, s[3]); q.clip();
    q.drawImage(im, s[0] + AX, s[1], hw, s[3], CXc, hy, hw, s[3]);
    q.restore();
    // left half: the same pixels mirrored
    q.save();
    q.translate(CXc, 0); q.scale(-1, 1);
    q.beginPath(); q.rect(0, hy, hw, s[3]); q.clip();
    q.drawImage(im, s[0] + AX, s[1], hw, s[3], 0, hy, hw, s[3]);
    q.restore();
    // the muzzle strip, centred over the seam
    q.drawImage(im, s[0], s[1] + 40, AX, s[3] - 40, CXc - AX / 2, hy + 46, AX, s[3] - 40);
  }
  BEAST_CACHE.front = cv;
  return cv;
}
// THE PURIFIED ATLAS: the virus is destroyed, so its purple must leave the
// body too. Every blue-heavy virus pixel in the authored sheet is remapped
// to a clean teal — same art, same positions, the infection gone.
function beastPure() {
  if (BEAST_CACHE.pureAtlas !== undefined) return BEAST_CACHE.pureAtlas;
  const im = beastImg(); if (!im || !im.naturalWidth) return null;
  const cv = document.createElement('canvas');
  cv.width = im.naturalWidth; cv.height = im.naturalHeight;
  const x = cv.getContext('2d', { willReadFrequently: true });
  x.drawImage(im, 0, 0);
  let d;
  try { d = x.getImageData(0, 0, cv.width, cv.height); }
  catch (e) { return (BEAST_CACHE.pureAtlas = null); }
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], g = p[i + 1], b2 = p[i + 2];
    // the same virus-purple test the vein scanner uses, softened to catch
    // the dimmer edges of each glow disc
    if (p[i + 3] > 60 && b2 > 110 && b2 - g > 35 && r - g > 0) {
      p[i] = Math.round(r * 0.3);
      p[i + 1] = Math.min(255, Math.round(b2 * 0.95));
      p[i + 2] = Math.round(b2 * 0.8);
    }
  }
  x.putImageData(d, 0, 0);
  BEAST_CACHE.pureAtlas = cv;
  return cv;
}
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
// smear copies use a violet-flooded atlas — the virus afterimage, not a xerox
function beastViolet() {
  if (BEAST_CACHE.viol) return BEAST_CACHE.viol;
  const im = beastImg(); if (!im) return null;
  const cv = document.createElement('canvas');
  cv.width = im.naturalWidth; cv.height = im.naturalHeight;
  const x = cv.getContext('2d');
  x.drawImage(im, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = 'rgba(150,80,255,0.7)'; x.fillRect(0, 0, cv.width, cv.height);
  BEAST_CACHE.viol = cv;
  return cv;
}

// draw one AUTHORED whole-figure pose, bottom-aligned on the ground line.
// These are the sheet's own key poses — the open-jaw roar and the crouched
// attack exist only as whole figures, so the rig hands over to them.
function bFig(c, key, rot, shake, sqx, sqy) {
  const s = BEAST_P[key];
  const w = s[2] * BEAST_F, h = s[3] * BEAST_F;
  c.save();
  if (shake) c.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake * 0.5);
  // squash & stretch about the ground contact — anticipation compresses,
  // launch stretches past 1.0, the art itself is never resampled oddly
  if (sqx || sqy) c.scale(sqx || 1, sqy || 1);
  if (rot) { c.translate(0, -h * 0.4); c.rotate(rot); c.translate(0, h * 0.4); }
  c.drawImage(beastImg(), s[0], s[1], s[2], s[3], -w / 2, -h, w, h);
  // the figure's own authored veins breathe too
  c.translate(-w / 2, -h);
  bGlowOver(c, key, 0, 0, 1, BEAST_F);
  c.restore();
}

// THE SLEEPING LION — composed flat from his own parts, the way lions
// actually sleep: belly on the ground, forelegs stretched flat in front,
// the head resting down ON them inside the mane, tail lying still along
// the ground. lift 0..1 is the stir: the head rises first, then the chest.
// Local space: authored (faces LEFT), ground y=0, caller scaled/mirrored.
function bSleep(c, t, lift) {
  const br = Math.sin(t * 0.75);
  BEAST_LIVE.t = t; BEAST_LIVE.glow = 0.08 + Math.max(0, br) * 0.06 + lift * 0.8;
  c.save();
  c.translate(0, br * 1.6 * (1 - lift) - lift * 26);
  // the body, belly on the ground (bottom of the torso at the floor line)
  c.save(); c.translate(0, 85 - lift * 30); c.rotate(-0.02 + lift * 0.05);
  bPart(c, 'body', BEAST_TUNE.bodyX, BEAST_TUNE.bodyY); c.restore();
  // the haunch: ONE round hip mass settled against the rump — a sleeping
  // lion's hind legs disappear under the body, so no shank ever shows
  c.save(); c.translate(58, -42 + lift * 8); c.rotate(-0.35);
  bPart(c, 'bleg0', BEAST_P.bleg0[2] / 2, BEAST_P.bleg0[3] / 2); c.restore();
  // the tail: one CONNECTED curve hugging the near flank, the spade tip
  // resting by the forepaws — segments overlapped along the arc so it
  // reads as a single limb, never scattered pieces
  {
    const PTS = [[86, -30], [52, -14], [12, -9], [-30, -9], [-68, -12]];
    for (let i = 0; i < 4; i++) {
      const key = 'tail' + i;
      const mx = (PTS[i][0] + PTS[i + 1][0]) / 2, my = (PTS[i][1] + PTS[i + 1][1]) / 2;
      const a = Math.atan2(PTS[i + 1][1] - PTS[i][1], PTS[i + 1][0] - PTS[i][0]);
      c.save();
      c.translate(mx, my - (i === 3 ? Math.max(0, br) * 2 : 0));
      c.rotate(a + Math.PI);                     // pieces are authored tip-back
      bPart(c, key, BEAST_P[key][2] / 2, BEAST_P[key][3] / 2);
      c.restore();
    }
  }
  // forelegs stretched FLAT in front — far one first, darkened
  c.save(); c.translate(-136, -15 - lift * 8); c.rotate(1.42); bPart(c, 'fleg1', 35, 54, true); c.restore();
  c.save(); c.translate(-152, -13 - lift * 10); c.rotate(1.5); bPart(c, 'fleg1', 35, 54); c.restore();
  // the head, resting on the stretched paws — the stir raises it first
  c.save();
  c.translate(-128 + lift * 20, -58 - lift * 96);
  c.rotate(0.42 - lift * 0.55);
  bPart(c, 'head', 118, 92);
  c.restore();
  c.restore();
}

// draw one part with its pivot at the current origin
function bPart(c, key, px, py, dark) {
  const s = BEAST_P[key];
  const im = dark ? beastDark()
    : (BEAST_LIVE.pure && beastPure()) || beastImg();
  c.drawImage(im, s[0], s[1], s[2], s[3], -px, -py, s[2], s[3]);
  bGlowOver(c, key, px, py, dark ? 0.4 : 1);
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
// ===========================================================================
// THE LEAP. A cat jumping is a MOTION, not a picture.
//
// Every beat of this pounce used to draw the same authored still — the standing
// side view — squashed a little on the coil and stretched a little in the air.
// Laid out frame by frame (tools/leapshot.cjs) it is unmistakable: a rigid lion
// sliding along a parabola. Nothing coils, nothing extends, nothing reaches,
// nothing lands. That is what "it does not show a full motion of a lion
// jumping" is, and no amount of extra artwork fixes it, because the missing
// thing is the frames BETWEEN the poses.
//
// So the leap is driven through the parts rig instead — the same restyled 3D
// head, mane, body, four two-segment legs and tail the stalk and the landing
// already use, and which already look far better than the still they were being
// replaced by. Four beats, blended by where the body actually is in its arc:
//
//   COIL    hindquarters loaded and folded, forelegs braced, chest low, head
//           level and locked on. The spring is visibly wound.
//   DRIVE   hind legs snap straight back off the ground, forelegs fold up under
//           the chest, nose up, tail streaming. This is the beat that was
//           missing entirely and it is the one that sells the power.
//   EXTEND  the flying cat: forelegs thrown forward claws-first, hind legs
//           trailing straight out behind, spine long, level.
//   REACH   nose down at the target, forepaws down and open, hind legs swinging
//           forward under the hips to take the landing.
//
// Leg convention (see bLeg): a1 rotates the upper segment at the hip/shoulder,
// a2 folds the knee. Negative a1 is forward. legs = [f near, b near, f far, b far].
// ---------------------------------------------------------------------------
// THE NUMBERS ARE BIG ON PURPOSE. The first pass of this used angles around a
// third of these and the sheet came back with a lion that was merely tilted:
// the legs are short next to the body mass, so a quarter-radian of hip does not
// change the silhouette at all. A leap is read almost entirely from the
// silhouette, so the pose has to commit — nose up nearly thirty degrees on the
// drive, forelegs a full radian forward at the stretch, hind legs straight out
// behind. Anything less and it is a standing cat on a slope.
// AND THE SIGNS ARE THE OTHER WAY ROUND, which cost a round to find. The
// authored figure faces LEFT, so a positive body rotation lifts the NOSE, and a
// positive hip angle swings a leg FORWARD. The first version had both backwards
// — it dived on the launch, reared on the strike, and drove with its forelegs.
// (The pounce pose that was already in here, and never reached the screen, had
// them backwards too. Two wrongs agreeing is not evidence.)
const BEAST_LEAP = {
  // pitch, front {a1,a2}, hind {a1,a2}, neck, head, tailUp, tailA, crouch
  // DRIVE: nose up, forelegs folded up under the chest, hind legs straight back
  drive:  { p: 0.46, f: [0.62, -1.05], h: [-1.28, -0.04], n: -0.26, hd: -0.20, tu: 0.45, ta: 0.34, c: -6 },
  // EXTEND: the flying cat — forelegs thrown forward, hind trailing straight out
  extend: { p: 0.14, f: [1.35, -0.22], h: [-1.18, -0.08], n: -0.22, hd: -0.06, tu: 0.78, ta: 0.14, c: -10 },
  // REACH: nose down at her, forepaws open and leading, hind swinging under
  reach:  { p: -0.46, f: [1.02, 0.32], h: [0.28, -0.98], n: 0.02, hd: 0.30, tu: 0.72, ta: -0.30, c: -4 },
};
function beastLerpLeap(A, B, k) {
  const m = (a, b2) => a + (b2 - a) * k;
  return {
    p: m(A.p, B.p), n: m(A.n, B.n), hd: m(A.hd, B.hd),
    tu: m(A.tu, B.tu), ta: m(A.ta, B.ta), c: m(A.c, B.c),
    f: [m(A.f[0], B.f[0]), m(A.f[1], B.f[1])],
    h: [m(A.h[0], B.h[0]), m(A.h[1], B.h[1])],
  };
}
function beastLeap(P, b, t) {
  const vy = b.vy || 0;
  // where in the arc: 1 driving up, 0 at the top, 1 falling. The blend runs
  // DRIVE -> EXTEND on the way up and EXTEND -> REACH on the way down, so the
  // pose is a continuous function of the body's own motion and can never be
  // out of step with it.
  const up = Math.max(0, Math.min(1, -vy / 430));
  const dn = Math.max(0, Math.min(1, vy / 430));
  const K = vy < 0 ? beastLerpLeap(BEAST_LEAP.extend, BEAST_LEAP.drive, up)
                   : beastLerpLeap(BEAST_LEAP.extend, BEAST_LEAP.reach, dn);
  P.pitch = K.p; P.bob = 0; P.crouch = K.c;
  P.neckA = K.n; P.headA = K.hd;
  // the far pair trails the near pair very slightly, so the four legs do not
  // read as two — the same trick the gallop uses
  P.legs[0] = { a1: K.f[0], a2: K.f[1] };
  P.legs[2] = { a1: K.f[0] + 0.10, a2: K.f[1] - 0.06 };
  P.legs[1] = { a1: K.h[0], a2: K.h[1] };
  P.legs[3] = { a1: K.h[0] - 0.09, a2: K.h[1] + 0.05 };
  P.tailUp = K.tu; P.tailA = K.ta + Math.sin(t * 9) * 0.06;
  P.glow = 1.15 + up * 0.25;
}
// ===========================================================================
// THE CHARGE — what the second of coil is FOR.
//
// A wind-up has one job: tell the player something is coming, early enough and
// loudly enough that where they choose to stand is a decision rather than a
// reflex. This one is the biggest sentence in the fight — a leap that crosses
// the arena — so it is drawn as a machine visibly loading, and every channel
// says the same thing at the same time:
//
//   the veins run from virus purple to the game's one warning amber (bGlowOver)
//   sparks are pulled IN toward the haunches instead of thrown off them, which
//     is the difference between "storing" and "venting" and is the whole read
//   the haunches themselves swell a pool of light, brightest at the hips
//   arcs crawl up out of the ground into the paws
//   the claws come out, and they come out LAST
//
// Nothing here is a badge floated over the animal. It is the animal that
// changes, which is why it reads at a glance and at any size.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// WHERE THE PAW IS, and WHAT IS ON THE END OF IT. Both of these were written
// inline inside the coil first, and the moment the swipe needed the same maths
// there were going to be two copies of a forward-kinematics chain that has to
// agree with bLeg exactly or the claws float off the foot. One copy.
//
// Chain, matching beastDraw: near foreleg shoulder at (shX-14, -125), upper
// segment 32, lower 88; near hind hip at (hpX-14, -135), 37 and 98. `cr` is
// P.crouch, which beastDraw has already translated the body down by.
function beastPaw(a1, a2, cr, hind) {
  const sx = (hind ? BEAST_TUNE.hpX : BEAST_TUNE.shX) - 14;
  const sy = (hind ? -135 : -125) + cr;
  const L1 = hind ? 37 : 32, L2 = hind ? 98 : 88;
  const kx = sx - Math.sin(a1) * L1, ky = sy + Math.cos(a1) * L1;
  return {
    x: kx - Math.sin(a1 + a2) * L2,
    y: ky + Math.cos(a1 + a2) * L2,
    a: a1 + a2,
  };
}
// Four hooked claws fanned off a paw, pointing down the limb's own axis plus
// `splay`. Drawn in SOURCE-OVER on purpose — the first cut drew them additively
// with everything else and they came back as a small orange flame at the paw:
// additive light has no edge, and a claw is nothing BUT edge.
function beastClaws(c, x, y, ang, len, alpha, splay) {
  if (alpha <= 0.01 || len <= 0) return;
  c.save(); c.translate(x, y); c.rotate(ang + (splay == null ? 0.62 : splay));
  c.globalAlpha = alpha;
  for (let i = -1; i <= 2; i++) {
    const L = len * (1 - Math.abs(i - 0.5) * 0.10);
    c.save(); c.rotate(i * 0.26 - 0.13);
    const cg = c.createLinearGradient(0, 0, 0, L);
    cg.addColorStop(0, 'rgba(96,72,44,0.85)');
    cg.addColorStop(0.30, 'rgba(255,236,196,0.98)');
    cg.addColorStop(1, 'rgba(255,255,250,1)');
    c.fillStyle = cg;
    c.shadowColor = 'rgba(255,178,58,0.85)'; c.shadowBlur = 7;
    // hooked, the way a cat's claw is — straight ones read as spikes
    c.beginPath(); c.moveTo(-2.6, 0);
    c.quadraticCurveTo(-2.0, L * 0.66, 1.9, L);
    c.quadraticCurveTo(0.3, L * 0.60, 2.6, 0);
    c.closePath(); c.fill();
    c.shadowBlur = 0;
    c.restore();
  }
  c.restore(); c.globalAlpha = 1;
}
function beastCoilFx(c, b, k) {
  // NOT a smoothstep. A smoothstep spends the first third of the wind-up at
  // almost nothing — photographed at 15% of the coil the animal was completely
  // cold, which is the opposite of the instruction: the surge is what the
  // crouch IS, so it has to be lit from the first frame and grow from there.
  // This curve is at 29% by 15% of the way in and still climbing at the end.
  const e = Math.pow(Math.max(0, Math.min(1, k)), 0.62);
  const t = b.anim || 0;
  // beastDraw translates the whole body DOWN by P.crouch before it places the
  // shoulder and hip anchors; this function draws at the outer transform, so
  // it has to add that offset back or the pool and the claws hang in the air
  // above an animal that has ducked out from under them. The ground arcs are
  // the exception — they belong to the floor, and the floor does not crouch.
  const CR = (b._coilPose && b._coilPose.crouch) || 0;
  const HIPX = BEAST_TUNE.hpX, HIPY = -135 + CR;
  c.save();
  c.globalCompositeOperation = 'lighter';
  // 1. the store: a pool of amber gathering in the haunches. Drawn as an
  //    ellipse lying ALONG the spine rather than a disc, and kept dimmer than
  //    it wants to be: the first cut used a 126 px circle at 0.52 alpha and it
  //    ate the whole hindquarter — the anatomy that is supposed to be visibly
  //    loading vanished inside its own glow, which is a worse read than no
  //    glow at all.
  {
    const r = 50 + e * 50;
    c.save(); c.translate(HIPX, HIPY); c.scale(1.30, 0.82);
    const gg = c.createRadialGradient(0, 0, 2, 0, 0, r);
    const a = 0.19 + e * 0.20 + Math.sin(t * 15) * 0.035 * e;
    gg.addColorStop(0, 'rgba(255,240,196,' + Math.min(0.62, a * 1.55) + ')');
    gg.addColorStop(0.40, 'rgba(255,186,64,' + a + ')');
    gg.addColorStop(1, 'rgba(180,90,20,0)');
    c.fillStyle = gg;
    c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
    c.restore();
  }
  // 2. the intake: motes converging on the hips. They are drawn rather than
  //    spawned as particles because a particle system throws things OUTWARD —
  //    and outward is the opposite of what a spring doing work looks like.
  {
    const n = 9;
    for (let i = 0; i < n; i++) {
      // each mote runs its own loop, offset, so the stream never pulses as one
      const ph = (t * (1.5 + (i % 3) * 0.35) + i / n) % 1;
      const a0 = (i / n) * 6.2832 + t * 0.4;
      const d = (1 - ph) * (150 + (i % 4) * 34) * (0.45 + e * 0.55);
      const x = HIPX + Math.cos(a0) * d, y = HIPY + Math.sin(a0) * d * 0.72;
      const al = ph * ph * (0.44 + e * 0.44);
      if (al < 0.02) continue;
      const rr = 1.6 + ph * 4.6 + e * 1.6;
      const gg = c.createRadialGradient(x, y, 0, x, y, rr);
      gg.addColorStop(0, 'rgba(255,250,226,' + al + ')');
      gg.addColorStop(1, 'rgba(255,180,60,0)');
      c.fillStyle = gg;
      c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill();
    }
  }
  // 3. the ground gives it up: arcs climbing out of the floor INTO THE PAWS.
  //    Under the paws, not across the middle of the animal — the first cut of
  //    this spaced them evenly from the shoulder and they landed under its
  //    belly, which reads as decoration rather than as the floor discharging
  //    into the feet that are about to push off it.
  //    They are stroked TWICE — a wide soft amber halo and a thin hot core —
  //    and kept short. A single thin near-white polyline is what the first cut
  //    drew, and photographed at 2.6x it read as pencil scribble laid over the
  //    legs: no colour, no falloff, and tall enough to cross the belly. An arc
  //    is light, and light has a halo; without one it is just a line.
  if (e > 0.04) {
    const paws = [BEAST_TUNE.shX - 14, BEAST_TUNE.shX + 14,
                  BEAST_TUNE.hpX - 14, BEAST_TUNE.hpX + 14];
    for (let s2 = 0; s2 < paws.length; s2++) {
      // the hind paws — the ones doing the work — arc harder than the front
      const hind = s2 >= 2;
      if (!hind && e < 0.22) continue;
      const bx = paws[s2];
      // a fresh crooked path every few frames — a steady one reads as a wire
      const seed = Math.floor(t * 16) + s2 * 7;
      const pts = [[bx, 0]];
      let yy = 0, xx = bx;
      const steps = hind ? 3 : 2;
      for (let g2 = 0; g2 < steps; g2++) {
        yy -= (9 + (seed * (g2 + 3)) % 7) * (0.5 + e * (hind ? 0.85 : 0.55));
        xx += (((seed * (g2 + 5)) % 13) - 6) * 0.9;
        pts.push([xx, yy]);
      }
      const path = () => {
        c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
        for (let g2 = 1; g2 < pts.length; g2++) c.lineTo(pts[g2][0], pts[g2][1]);
        c.stroke();
      };
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = 'rgba(255,168,44,' + (0.16 + e * 0.34) + ')';
      c.lineWidth = 5.0 + e * 3.0; path();
      c.strokeStyle = 'rgba(255,242,206,' + (0.30 + e * 0.55) + ')';
      c.lineWidth = 1.3 + e * 0.9; path();
      // where it touches the floor it burns a bead — the contact point is the
      // only part of an arc that is unambiguous about which way it is flowing
      const bg = c.createRadialGradient(bx, 0, 0, bx, 0, 12 + e * 10);
      bg.addColorStop(0, 'rgba(255,246,214,' + (0.34 + e * 0.44) + ')');
      bg.addColorStop(1, 'rgba(255,150,40,0)');
      c.fillStyle = bg;
      c.beginPath(); c.ellipse(bx, 0, 12 + e * 10, 5 + e * 4, 0, 0, 7); c.fill();
    }
  }
  // 4. THE CLAWS, and they come out last — the final quarter of the wind-up,
  //    which is exactly when the player still has time to move but no longer
  //    has any doubt about what for.
  //    They are set forward-and-down INTO the floor: a cat sets its claws
  //    before it goes, and the paw that is about to push is the one that grips.
  c.restore();
  const claw = Math.max(0, (e - 0.52) / 0.48);
  if (claw > 0) {
    const P = b._coilPose;
    if (P) for (const side of [0, 2]) {
      const near = side === 0;
      const p = beastPaw(P.legs[side].a1, P.legs[side].a2, CR, false);
      // the far pair is offset by the +14/-14 the rig uses; beastPaw returns
      // the near one, so nudge it rather than duplicating the chain
      beastClaws(c, p.x + (near ? 0 : 28), Math.min(p.y, -4), p.a,
                 15 + claw * 11, near ? claw : claw * 0.5);
    }
  }
}
// ===========================================================================
// THE SWIPE, drawn as a HAND.
//
// The fight already had a swipe: a foreleg rotated through 90 degrees over a
// quarter second and a hitbox appeared. Photographed, what the player sees is
// the animal leaning. Nothing about it says claw, which is the one thing a
// lion's near attack is.
//
// Three additions, and the third is the one that does the work:
//   the claws unsheathe on the WIND-UP, so the cock of the paw is readable as
//     intent rather than as a shuffle;
//   the paw's own path is traced — not a swoosh drawn where the arc ought to
//     be, but the actual forward-kinematic position at earlier points of the
//     same curve, so the trail cannot disagree with the limb;
//   FOUR trails, one per claw, spread along the path normal. One wide ribbon
//     is a sword. Four thin ones are a hand, and the eye knows the difference
//     without being told.
// Two-link IK in the rig's own convention, which is the inverse of beastPaw:
//   pos = (-L1·sin(a1) - L2·sin(a1+a2),  L1·cos(a1) + L2·cos(a1+a2))
// `bend` picks which way the knee breaks. Targets outside the chain's reach are
// clamped rather than rejected — a limb that snaps to rest when you ask for one
// pixel too far is worse than a limb that stretches for it.
function beastIK(tx, ty, L1, L2, bend) {
  const dMin = Math.abs(L2 - L1) + 1.5, dMax = L1 + L2 - 1.5;
  let d = Math.hypot(tx, ty);
  const s = d < 0.001 ? 0 : Math.max(dMin, Math.min(dMax, d)) / d;
  tx *= s; ty *= s; d = Math.hypot(tx, ty);
  const ca = Math.max(-1, Math.min(1, (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2)));
  const a2 = (bend < 0 ? -1 : 1) * Math.acos(ca);
  const a1 = Math.atan2(-tx, ty) - Math.atan2(L2 * Math.sin(a2), L1 + L2 * Math.cos(a2));
  return { a1, a2 };
}
// THE SWIPE PATH, authored as PAW POSITIONS rather than as joint angles.
//
// Authored as angles it swept a1 from -0.95 to +0.55 with the elbow barely
// moving, which keeps the chain at full extension the whole time — so the paw
// travelled 86 px along a line 6 px off the floor. Measured, that is a cat
// pushing something across the ground, and it is why a trail drawn along its
// real path was invisible: there was nothing there to see.
//
// Positions are relative to the shoulder, +x BACKWARD (the figure faces left),
// +y down. Up and back to cock, thrown forward high, raked down and through,
// then pulled back under the chest.
const BEAST_SWIPE_PATH = [
  [0.00, 58, -46],    // cocked: paw up by the shoulder, weight back
  [0.42, -112, -34],  // the reach — as far forward and as high as it goes
  [0.72, -126, 52],   // the rake: down through the strike line
  [1.00, -58, 58],    // and back under, claws still out
];
function beastSwipeArm(sq) {
  const q = Math.max(0, Math.min(1, sq));
  let i = 0;
  while (i < BEAST_SWIPE_PATH.length - 2 && q > BEAST_SWIPE_PATH[i + 1][0]) i++;
  const A = BEAST_SWIPE_PATH[i], B = BEAST_SWIPE_PATH[i + 1];
  const u = (q - A[0]) / (B[0] - A[0] || 1);
  // ease within each leg so the paw accelerates into the strike and drags out
  const w = u * u * (3 - 2 * u);
  return beastIK(A[1] + (B[1] - A[1]) * w, A[2] + (B[2] - A[2]) * w, 32, 88, 1);
}
function beastClawFx(c, b, P) {
  const CR = P.crouch || 0;
  if (b.st === 'swipewarn') {
    // unsheathing: they slide out over the second half of the cock
    const wq = 1 - Math.max(0, Math.min(1, (b.t || 0) / 0.3));
    const out = Math.max(0, (wq - 0.38) / 0.62);
    if (out <= 0) return;
    const p = beastPaw(P.legs[0].a1, P.legs[0].a2, CR, false);
    beastClaws(c, p.x, p.y, p.a, 10 + out * 15, Math.min(1, out * 1.3), 0.30);
    return;
  }
  const sq = 1 - Math.max(0, Math.min(1, (b.t || 0) / 0.24));
  const p = beastPaw(P.legs[0].a1, P.legs[0].a2, CR, false);
  // the trail: seven samples back along the SAME curve the limb is on
  const N = 9, SPAN = 0.44;
  const path = [];
  for (let i = N; i >= 0; i--) {
    const q = sq - SPAN * (i / N);
    if (q <= 0.02) continue;
    const A = beastSwipeArm(q);
    path.push(beastPaw(A.a1, A.a2, CR, false));
  }
  if (path.length > 1) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (let lane = 0; lane < 4; lane++) {
      const off = (lane - 1.5) * 8.5;
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1], b2 = path[i];
        // normal of this segment, to fan the four lanes apart
        const dx = b2.x - a.x, dy = b2.y - a.y;
        const L = Math.hypot(dx, dy) || 1;
        const nx = -dy / L * off, ny = dx / L * off;
        const age = i / (path.length - 1);          // 1 = at the paw
        c.globalAlpha = age * age * 0.95;
        c.strokeStyle = age > 0.72 ? 'rgba(255,250,232,1)' : 'rgba(255,182,64,1)';
        c.lineWidth = 1.6 + age * 4.6;
        c.beginPath(); c.moveTo(a.x + nx, a.y + ny); c.lineTo(b2.x + nx, b2.y + ny);
        c.stroke();
      }
    }
    c.globalAlpha = 1;
    c.restore();
  }
  beastClaws(c, p.x, p.y, p.a, 25, 1, 0.30);
}
// ===========================================================================
// THE DAZE. Hit it enough times fast enough and the machine loses the thread:
// head thrown side to side, veins guttering, and — the part the player is
// actually being sold — it stops defending. See NULLFANG's `daze` state in
// entities.js for the window itself; this is only what it looks like.
function beastDazeFx(c, b) {
  const t = b.anim || 0;
  const life = Math.max(0, Math.min(1, (b.t || 0) / (b.dazeDur || 1.6)));
  // follow the head down: the daze pose sinks the body 50 px, and a halo that
  // stays where the skull used to be is a halo floating over nothing
  const CR = 20 + 30 * Math.pow(life, 0.8);
  const HX = BEAST_TUNE.headX, HY = BEAST_TUNE.headY - 30 + CR;
  c.save();
  c.globalCompositeOperation = 'lighter';
  // the ring of lights circling the head. Not stars — this is a machine, so
  // they are its own guttering status lamps, shaken loose and orbiting.
  for (let i = 0; i < 7; i++) {
    const a = t * 3.4 + i * 0.898;
    const x = HX + Math.cos(a) * 76, y = HY + Math.sin(a) * 26 - Math.sin(t * 2) * 3;
    const near = Math.sin(a) > 0;                 // in front of the skull
    const r = (near ? 10 : 6) * (0.7 + 0.3 * Math.sin(t * 9 + i));
    const al = (near ? 1 : 0.45) * life;
    const gg = c.createRadialGradient(x, y, 0, x, y, r * 3);
    gg.addColorStop(0, 'rgba(255,246,214,' + al + ')');
    gg.addColorStop(0.4, 'rgba(214,140,255,' + al * 0.55 + ')');
    gg.addColorStop(1, 'rgba(160,80,255,0)');
    c.fillStyle = gg;
    c.beginPath(); c.arc(x, y, r * 3, 0, 7); c.fill();
  }
  // and the whole animal browns out in time with the shake, so the SILHOUETTE
  // says "not working" even at a glance and even in a single frame
  c.globalAlpha = (0.14 + 0.10 * Math.sin(t * 17)) * life;
  c.fillStyle = '#7a3fd0';
  c.beginPath(); c.ellipse(0, -120 + CR * 0.5, 190, 130, 0, 0, 7); c.fill();
  c.globalAlpha = 1;
  c.restore();
  // and it sheds sparks from the seams — the only time in the fight the
  // machine is visibly LOSING material rather than spending it
  // machine is visibly LOSING material rather than spending it. addPart, not a
  // hand-rolled push: the particle record has a shape (life0, grav, glow) and
  // a device budget, and both live in engine.js.
  if (Math.random() < 0.4) {
    addPart(b.cx() + rnd(-60, 60), b.y + 40 + rnd(-30, 30),
            rnd(-70, 70), rnd(-140, -30), 0.5, '#d68cff', rnd(1.5, 3), 420, true);
  }
}
// THE COIL, which is also the tell. `k` runs 0 (settling) to 1 (about to go).
function beastCoil(P, b, t, k, deep) {
  const e = k * k * (3 - 2 * k);
  b._coilPose = P;                 // the claw overlay needs the forepaws
  // The silhouette has to CHANGE, or there is no tell. The first cut lowered
  // the body 30 px and folded only the hips: photographed next to the stalk it
  // was the same animal a little lower at the back, which reads as sitting
  // down. A gathering cat drops its CHEST — the elbows fold, the shoulders
  // come down to the floor, and the hips stack up over the hind paws.
  // The fold has to PAY FOR the crouch, joint by joint, or the body sinks and
  // the paws go through the floor. Front chain is 32 + 88 from a shoulder at
  // -125; vertical reach is 32·cos(a1) + 88·cos(a1+a2). The first cut set
  // a1 = -0.40 and a2 = +0.68, which sum to +0.28 — a nearly straight leg. It
  // bought 6 px of fold against a 36 px crouch, which is why the chest never
  // moved and the coil read as the stalk with the rump lowered.
  // Both constraints have to hold at once, and the second one is the one that
  // was missed twice: the paw must not TRAVEL. Solve the chain for vertical
  // reach AND zero horizontal drift —
  //     horiz = -L1·sin(a1) - L2·sin(a1+a2) = 0
  //     vert  =  L1·cos(a1) + L2·cos(a1+a2) = reach - crouch
  //   front (32, 88 from -125), e=1:  a1 -1.45, a1+a2 +0.37 -> 3.9 + 82.1 = 86
  //   hind  (37, 98 from -135), e=1:  a1 +1.25, a1+a2 -0.42 -> 11.7 + 89.5 = 101
  // Solving only the first equation is what gave a forepaw thrown 40 px out in
  // front of the shoulder — the chest did come down, but the animal read as
  // lying down in a sphinx rather than gathering to go.
  P.crouch = 4 + (deep ? 42 : 34) * e;
  P.pitch = -0.02 - 0.05 * e;
  // forelegs FOLD: the elbow drops back and the forearm stays vertical, so the
  // CHEST comes down to the floor over paws that have not moved an inch.
  // (a1 stops at -1.30 rather than the -1.45 the equations want: at -1.45 the
  // upper segment is dead horizontal and the limb reads as broken. Four pixels
  // of paw sink is a cheaper lie than a snapped elbow.)
  P.legs[0] = { a1: -0.05 - 1.25 * e, a2: 0.20 + 1.46 * e };
  P.legs[2] = { a1: -0.02 - 1.25 * e, a2: 0.18 + 1.46 * e };
  // hindquarters LOAD: hips stack up over the hind paws, the spring winding
  P.legs[1] = { a1: 0.48 + (deep ? 0.92 : 0.77) * e, a2: -0.62 - (deep ? 1.22 : 1.05) * e };
  P.legs[3] = { a1: 0.44 + (deep ? 0.92 : 0.77) * e, a2: -0.58 - (deep ? 1.22 : 1.05) * e };
  // the head comes LEVEL and forward — eyes locked, the last thing to move
  P.neckA = -0.04 - 0.16 * e; P.headA = 0.12 - 0.20 * e;
  // the tail lashes, then goes rigid and low a beat before the launch
  // ...and it goes RIGID AND STRAIGHT OUT, not rigid and low. The generated
  // reference plate (assets/source/beast/motion/07_coil.png) holds the tail
  // dead level behind the spine like a rudder, and it is the single clearest
  // silhouette difference between a cat that is crouching and one that is
  // about to leave the ground — a low tail reads as caution, a level one as
  // commitment.
  const rigid = Math.max(0, (e - 0.62) / 0.38);
  P.tailUp = -0.55 + 0.42 * e;
  P.tailA = Math.sin(t * 11) * 0.30 * (1 - rigid) - 0.10 * rigid;
  P.glow = 1.05 + e * 0.45;
}
function beastPose(b) {
  const t = b.anim, st = b.st;
  const P = {
    bob: Math.sin(t * 2.1) * 3, pitch: 0, crouch: 0,
    neckA: 0, headA: 0, tailA: Math.sin(t * 1.4) * 0.18, tailUp: -1,
    glow: 0.55 + Math.sin(t * 3) * 0.2, slump: 0, swell: 0,
    legs: [0, 1, 2, 3].map(i => ({ a1: Math.sin(t * 1.6 + i * 1.7) * 0.04, a2: 0.02 })),
  };
  const gallop = (freq, amp) => {
    const g = t * freq;
    // ROTARY GALLOP timing, like a real lion: the hind pair drives almost
    // together, the front pair catches staggered, and front vs hind are NOT
    // a clean half-cycle apart. The off-beat is what reads as flesh instead
    // of a wind-up toy. legs: [f near, b near, f far, b far]
    const PH = [0, 1.18 * Math.PI, 0.42 * Math.PI, 1.46 * Math.PI];
    const k = amp / 0.22;
    P.legs = [0, 1, 2, 3].map(i => {
      const w = g + PH[i], s1 = Math.sin(w);
      return {
        // a touch of second harmonic: reach snaps forward, drags back slower
        a1: (s1 + 0.22 * Math.sin(w * 2 + 0.6)) * amp,
        // the knee folds hard on the swing-through, stays long in stance
        a2: (Math.sin(w + 1.25) * 0.55 + Math.max(0, Math.sin(w + 2.1)) * 0.5) * amp,
      };
    });
    // double-beat bob, the hind-drive beat landing heavier than the catch
    P.bob = (Math.sin(g * 2) * 0.62 + Math.sin(g + 0.7) * 0.38) * 6.5 * k;
    P.pitch = (Math.sin(g + 0.4) * 0.05 + Math.sin(g * 2 + 1.1) * 0.018) * k;
    // the tail counter-swings against the body's rock, half a beat late
    P.tailA = -Math.sin(g - 0.7) * 0.24 * k - P.pitch * 1.5;
    P.tailUp = -0.85 + Math.sin(g * 0.5) * 0.12;
  };
  if (st === 'dorm' && !b.dead) {
    // ASLEEP: a mound of machine — deep crouch, head sunk between the
    // forelegs, tail wrapped close, the virus veins barely breathing
    // a real lion's sleep: the collapse rest held peacefully — belly on
    // the floor, legs folded flat along the ground, head down on the paws,
    // tail lying still. Only the breath moves.
    P.crouch = 44 + Math.sin(t * 0.8) * 1.4; P.bob = 0; P.pitch = 0.03;
    P.neckA = 0.5; P.headA = 1.05;
    P.tailUp = -1.5; P.tailA = 0.02;
    P.glow = 0.05 + Math.max(0, Math.sin(t * 0.8)) * 0.06;
    P.legs = [{ a1: 0.9, a2: -1.5 }, { a1: 0.94, a2: -1.54 }, { a1: 0.86, a2: -1.46 }, { a1: 0.92, a2: -1.5 }];
    return P;
  }
  if (st === 'intro' && !b.dead) {
    // THE WAKING: the eye finds her first — the head snaps up while the
    // mass is still down — then the body follows it upright, and the draw
    // side hands the last beat to the authored roar figure
    const k = Math.max(0, Math.min(1, 1 - (b.t || 0) / 2));
    const head = Math.min(1, k / 0.35);
    const rise = Math.max(0, Math.min(1, (k - 0.32) / 0.38));
    P.crouch = 44 * (1 - rise * rise); P.bob = 0; P.pitch = 0.03 * (1 - rise);
    P.neckA = 0.5 * (1 - head); P.headA = 1.05 - head * 1.15;
    P.tailUp = -1.35 + rise * 0.55; P.tailA = Math.sin(t * (1 + k * 6)) * 0.1 * k;
    P.glow = 0.05 + head * 0.7 + (k > 0.5 ? Math.max(0, Math.sin(t * 24)) * 0.25 : 0);
    // the folded legs push the ground away as the mass comes up
    const fold = 1 - rise;
    P.legs = [
      { a1: 0.9 * fold + 0.02, a2: -1.5 * fold },
      { a1: 0.94 * fold + 0.02, a2: -1.54 * fold },
      { a1: 0.86 * fold + 0.02, a2: -1.46 * fold },
      { a1: 0.92 * fold + 0.02, a2: -1.5 * fold },
    ];
    return P;
  }
  if (b.purified) {
    const pt = b.pureT || 0;
    if (pt < 0.8) {
      // THE RISE: up out of the collapse, shaking the last of it off
      const k = pt / 0.8, e = k * k * (3 - 2 * k);
      P.crouch = 44 * (1 - e); P.pitch = 0.06 * (1 - e);
      P.legs = [0, 1, 2, 3].map(() => ({ a1: 0.9 * (1 - e), a2: -1.5 * (1 - e) }));
      P.headA = 0.5 * (1 - e); P.neckA = 0.3 * (1 - e);
      P.glow = 0.25; P.tailUp = -1 + e * 0.9;
      P.bob = k > 0.6 ? Math.sin(t * 40) * 2 * (1 - k) : 0;
      return P;
    }
    // A HOUSECAT THE SIZE OF A CAR: happy tail always; it pads to her
    // side, sits watching her, grooms a forepaw, and loafs — on a loop
    P.glow = 0.35 + Math.sin(t * 2) * 0.1;
    P.tailUp = 0.35; P.tailA = Math.sin(t * 3.2) * 0.35;
    if (b.petWalk) {
      const g2 = t * 4.2;
      const PH2 = [0, 1.18 * Math.PI, 0.42 * Math.PI, 1.46 * Math.PI];
      P.legs = [0, 1, 2, 3].map(i => {
        const w = g2 + PH2[i];
        return { a1: Math.sin(w) * 0.14,
          a2: (Math.sin(w + 1.25) * 0.55 + Math.max(0, Math.sin(w + 2.1)) * 0.5) * 0.2 };
      });
      P.bob = Math.sin(g2 * 2) * 2;
      P.headA = 0.06 + Math.sin(g2 - 1) * 0.03;
      return P;
    }
    const cyc = pt % 12;
    if (cyc < 4) {                      // SIT: haunches down, chest up, watching
      P.crouch = 24; P.pitch = -0.05;
      P.headA = -0.06 + Math.sin(t * 0.9) * 0.03;
      P.legs = [{ a1: 0.06, a2: 0.04 }, { a1: 0.5, a2: -0.7 }, { a1: 0.02, a2: 0.04 }, { a1: 0.46, a2: -0.66 }];
    } else if (cyc < 7.5) {             // GROOM: forepaw to the cheek, licking
      const lk = Math.min(1, cyc - 4, 7.5 - cyc);
      P.crouch = 28; P.pitch = -0.03;
      P.legs = [{ a1: -1.15 * lk, a2: 0.6 * lk }, { a1: 0.5, a2: -0.7 }, { a1: 0.04, a2: 0.03 }, { a1: 0.46, a2: -0.66 }];
      P.headA = 0.5 * lk + Math.max(0, Math.sin(t * 7)) * 0.06 * lk;
      P.neckA = 0.2 * lk;
    } else {                            // LOAF: folded flat, utterly content
      const lk = Math.min(1, (cyc - 7.5) / 0.8);
      P.crouch = 24 + 20 * lk; P.pitch = 0.03 * lk;
      P.legs = [0, 1, 2, 3].map(() => ({ a1: 0.9 * lk, a2: -1.5 * lk }));
      P.headA = 0.25 * lk; P.neckA = 0.15 * lk;
      P.bob = Math.sin(t * 0.9) * 1.2;
    }
    return P;
  }
  if (b.dead) {
    // STAGGERED COLLAPSE: the machine dies joint by joint — near fore-knee
    // buckles first, the far one follows, the hips give, the body drops onto
    // them, and the head is the last light down, with one small rebound.
    const T = 1.6 - Math.max(0, Math.min(1.6, b.deathAnimT || 0));
    const jt = (d0, dur) => {
      const u = Math.max(0, Math.min(1, (T - d0) / dur));
      return u * u * (3 - 2 * u);
    };
    const fN = jt(0, 0.32), fF = jt(0.12, 0.34);
    const hN = jt(0.3, 0.4), hF = jt(0.42, 0.4);
    const bodyK = jt(0.1, 0.85), headK = jt(0.62, 0.55);
    const tailK = jt(0.85, 0.5);
    const bounce = -0.07 * Math.sin(Math.max(0, Math.min(1, (T - 1.2) / 0.35)) * Math.PI);
    P.slump = bodyK;
    P.crouch = 44 * bodyK; P.pitch = 0.01 + 0.14 * fN - 0.05 * hN;
    P.neckA = 0.34 * headK; P.headA = 0.5 * headK + bounce;
    P.bob = 0;
    P.tailA = 0.05 + (1 - tailK) * Math.sin(t * 3) * 0.08;
    // the tail flops its last and comes to REST ON the ground: the body has
    // sunk 44px, so the tip eases up in local space to lie flat, not clip
    P.tailUp = -1 + 0.35 * tailK;
    P.glow = Math.max(0, 0.6 * (1 - T / 1.6)) * (0.5 + Math.sin(t * 30) * 0.5);
    P.legs = [fN, hN, fF, hF].map(k2 => ({ a1: 0.9 * k2, a2: -1.5 * k2 }));
  } else if (st === 'stalk') {
    // the prowl: slow gait, head carried LOW, eyes locked on prey. The head
    // bobs half a beat behind the shoulders and the whole stride softens
    // and gathers on a slow settle wave — patience, not a metronome.
    gallop(7, 0.2);
    const g2 = t * 7, settle = 0.78 + 0.22 * Math.sin(t * 0.9 + 1);
    P.bob *= settle;
    P.legs.forEach(l => { l.a1 *= settle; l.a2 *= settle; });
    P.neckA = 0.14 + Math.sin(g2 * 2 - 1.3) * 0.022;
    P.headA = 0.2 + Math.sin(g2 - 2.0) * 0.045 + Math.sin(t * 0.9) * 0.03;
    P.tailUp = -0.7; P.glow = 1;
  } else if (st === 'swipewarn') {
    // two beats of anticipation: the SHOULDER pulls back and the weight
    // settles first — only then does the paw rise into the cock
    const wq = 1 - Math.max(0, Math.min(1, (b.t || 0) / 0.3));
    const pull = Math.min(1, wq / 0.4);
    const rise = Math.max(0, (wq - 0.4) / 0.6);
    const re = rise * rise * (3 - 2 * rise);
    P.crouch = 4 + pull * 4; P.pitch = -0.02 - pull * 0.035;
    // and it ends EXACTLY where beastSwipeArm starts (sq 0), so the cock hands
    // off to the strike without a one-frame snap between two authorings
    {
      const rest = beastIK(-10, 112, 32, 88, 1);
      const cock = beastSwipeArm(0);
      const m = (a, b2) => a + (b2 - a) * re;
      P.legs[0] = { a1: m(rest.a1 + 0.28 * pull, cock.a1), a2: m(rest.a2 - 0.14 * pull, cock.a2) };
    }
    P.legs[1].a1 += 0.1 * pull;                    // hind gathers underneath
    P.neckA = 0.05 * pull; P.headA = 0.08 * pull;
    P.glow = 1 + wq * 0.3; P.tailA = Math.sin(t * 10) * 0.3;
  } else if (st === 'swipe') {
    // the paw whips through, OVERSHOOTS the strike line, then settles back.
    // The arm curve is beastSwipeArm because the claw TRAIL walks the same
    // curve backwards — two copies of it would drift apart within a patch.
    const sq = 1 - Math.max(0, Math.min(1, (b.t || 0) / 0.24));
    const e = 1 - Math.pow(1 - sq, 3);
    P.crouch = 6; P.pitch = 0.015 + 0.03 * e;
    P.legs[0] = beastSwipeArm(sq);
    P.legs[1].a1 = -0.1 * e;                       // hind braces the followthrough
    P.neckA = 0.04 * e; P.headA = 0.1 * e;
    P.glow = 1.4; P.tailA = -0.25 * e;
  } else if (st === 'spring' || st === 'dive') {
    // the ambush leap off a gantry is the same motion — it just starts higher
    beastLeap(P, b, t);
  } else if (st === 'crouch') {
    beastCoil(P, b, t, 1 - Math.max(0, Math.min(1, (b.t || 0) / (b.phase === 2 ? 0.9 : 1.0))), false);
  } else if (st === 'springwarn') {
    beastCoil(P, b, t, 1 - Math.max(0, Math.min(1, (b.t || 0) / 0.42)), false);
  } else if (st === 'nullhop') {
    // gravity is off and it knows: the same coil, wound past what a spine should
    beastCoil(P, b, t, 1, true);
  } else if (st === 'daze') {
    // THE HEAD SHAKE. A big cat that has taken a run of hits does not stand
    // and blink — it throws its head hard side to side, twice, trying to clear
    // whatever is wrong, and the whole front end goes slack while it does.
    // The shake DECAYS: fast and wide at the start, smaller and slower as it
    // comes back. A constant wobble reads as an idle, not as damage.
    const dur = b.dazeDur || 1.6;
    const q = Math.max(0, Math.min(1, (b.t || 0) / dur));   // 1 fresh -> 0 done
    const shake = Math.pow(q, 0.8);
    // It has to be visible in a SINGLE FRAME. The first cut set 16 px of
    // crouch and a 0.3 rad neck swing and photographed as the stalk with three
    // dots over its head — the shake was real but a still frame catches it
    // near zero half the time, and a still frame is what the player gets when
    // they glance at it while deciding whether to commit. So the sag and the
    // splay are CONSTANT for the duration and the shake rides on top.
    // (pitch is small on purpose: c.rotate is clockwise and the figure faces
    // left, so POSITIVE pitch drops the nose. A fifth of a radian tipped the
    // whole animal onto its face and swung the tail through the floor.)
    // 50 px of sag against ~40 px of leg fold put the paws 20 px through the
    // floor — measured, not guessed (tests/artbible.cjs, §3.4). The sag is the
    // part that gives, because the splay is what says "buckling".
    P.crouch = 16 + 22 * shake; P.pitch = 0.03 + 0.05 * shake;
    // the neck swings; the skull lags the neck by a beat, which is what makes
    // a shake look like weight rather than like a metronome. The head also
    // HANGS — a constant droop the swing oscillates around.
    P.neckA = 0.34 * shake + Math.sin(t * 17) * 0.34 * shake;
    P.headA = 0.52 * shake + Math.sin(t * 17 - 0.9) * 0.50 * shake;
    // legs splayed and buckling — it is holding itself up, not standing. The
    // front pair scrabbles forward, the hind pair has half collapsed.
    P.legs[0] = { a1: 0.62 * shake, a2: 0.30 * shake };
    P.legs[2] = { a1: 0.74 * shake, a2: 0.24 * shake };
    P.legs[1] = { a1: -0.30 * shake, a2: -0.86 * shake };
    P.legs[3] = { a1: -0.38 * shake, a2: -0.80 * shake };
    P.bob = Math.sin(t * 23) * 3.4 * shake;
    // and the tail comes UP, not down: at -0.80 its spade hung below the paws
    // and was the lowest thing on the animal, which is what the ground check
    // was actually reporting
    P.tailUp = -0.30 - 0.14 * shake; P.tailA = Math.sin(t * 5) * 0.10 * shake;
    // the veins gutter instead of burning: this is the one state where the
    // virus light is LOSING, and it is the read the free-hit window rests on
    P.glow = 0.16 + Math.max(0, Math.sin(t * 13)) * 0.14 * shake;
  } else if (st === 'perch') {
    // poised on the ledge — and the TAIL-LASH: a slow flat-topped draw one
    // way, a fast whip back, the cat deciding to kill
    const lw = t * 4.5, sw = Math.sin(lw);
    P.crouch = 8; P.neckA = 0.1;
    P.headA = 0.16 + Math.sin(t * 3.1) * 0.02;
    P.tailA = (sw > 0 ? Math.pow(sw, 0.55) : -Math.pow(-sw, 2.2)) * 0.5;
    P.tailUp = -0.25 - Math.cos(lw) * 0.25;
    P.glow = 1.1 + Math.max(0, sw) * 0.15;
  } else if (st === 'recover') {
    // the landing settle: hit the deck HARD past the rest pose, then ease
    // back up through it — overshoot down, recover — your opening
    const rq = 1 - Math.max(0, Math.min(1, (b.t || 0) / 0.42));
    const drop = Math.sin(Math.min(1, rq * 2.2) * Math.PI * 0.5);
    const rise = Math.max(0, (rq - 0.45) / 0.55);
    const k2 = drop * (1 - rise * rise * 0.8);
    P.crouch = 4 + 20 * k2; P.pitch = 0.05 * k2;
    P.neckA = 0.12 * k2; P.headA = 0.18 * k2;
    P.glow = 0.45;
    P.legs = P.legs.map(() => ({ a1: 0.32 * k2, a2: -0.55 * k2 }));
    P.tailUp = -0.9 + 0.3 * k2; P.tailA = Math.sin(t * 6) * 0.15;
  } else if (st === 'roar') {
    // rig-side roar frames: the chest SWELLS through the first breath
    // (before the authored open-jaw figure takes over) and eases back down
    // after the roar breaks
    let rq = Math.max(0, Math.min(1, (1.25 - (b.t || 0)) / 0.18));
    if ((b.t || 0) < 0.25) rq *= Math.max(0, (b.t || 0) / 0.25);
    P.swell = rq;
    P.crouch = -3 * rq; P.pitch = -0.05 * rq;
    P.neckA = -0.18 * rq; P.headA = -0.1 * rq;
    P.glow = 1 + rq * 0.5;
    P.legs.forEach(l => { l.a1 -= 0.06 * rq; });
    P.tailA = 0.12 + rq * 0.1; P.tailUp = -0.6;
  } else if (st === 'pounce') {
    beastLeap(P, b, t);
  } else if (Math.abs(b.vx || 0) > 40) gallop(8, 0.22);
  return P;
}

// core renderer: local space is the AUTHORED one — beast faces LEFT, ground at
// y=0, x=0 under the body's centre. Caller has already scaled and mirrored.
function beastDraw(c, b, P) {
  const g = P.crouch;
  BEAST_LIVE.t = b.anim || 0; BEAST_LIVE.glow = P.glow;
  c.save();
  c.translate(0, P.bob + g);
  c.rotate(P.pitch);
  // the chest swell (roar anticipation) inflates the whole cage about a
  // point mid-torso, so the mane and shoulders ride up together
  if (P.swell) {
    c.translate(0, -140);
    c.scale(1 + 0.045 * P.swell, 1 + 0.075 * P.swell);
    c.translate(0, 140);
  }
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

// ---------------------------------------------------------------------------
// THE FILMED MOVES (ART_QUEUE §2ax, fired 2026-09-05).
//
// The owner on the cast reel: "the boss fight and boss characters, movements,
// and attacks are bad, like, super bad." The reel showed why — her moves are
// filmed motion, the guardians were stills cut together: sixteen states,
// sixteen pictures, a pounce one drawing slid across the floor. So each of
// Nullfang's moves is one continuous take now, cut to a strip, and this table
// says which strip plays which state and over which clock. The parts rig
// stays underneath: it draws for any state without a strip, for any strip not
// yet over the wire, mid-turn (the strips are one yaw; the rig's constructed
// front carries the turn), and while staggered by the Song.
//
// THE SCALE IS ONE NUMBER PER STRIP, MEASURED. The strips were cropped by
// content per take, so a take whose widest frame is a fully extended paw
// holds the lion smaller in its cells than a take where nothing extends. k
// puts them back on one size: the lion's resting body length in each take's
// resting cell against the stalk's (291 px) — swipe 205 -> 1.42, leap 216 ->
// 1.35, springup 256 -> 1.14, the rest at or near 300 -> 1. BEAST_STRIP_PX is
// the stalk's own scale: 280 rig px of standing lion for 210 strip px.
//
// THE CLOCKS ARE THE STATE MACHINE'S OWN. `b.t` counts DOWN from whatever the
// transition set it to, and the transition does not record that number, so the
// first frame seen in a state is taken as its length (`_st0`), the way the
// hero's land0 works. Loops run on b.anim; the arc of a pounce is indexed by
// its own vertical speed (up / hang / down); the spring and the dive carry
// their own 0..1 (`b.u`); the death counts deathAnimT from 1.6 to 0.
const BEAST_STRIP_PX = 280 / 210;
const BEAST_STRIP = {
  stalk:      { key: 'beastStalk',      cells: 16, k: 1,    loop: 14 },
  idle:       { key: 'beastStalk',      cells: 16, k: 1,    from: 0, to: 0, loop: 1 },
  roar:       { key: 'beastRoar',       cells: 12, k: 1,    t0: 1.25 },
  intro:      { key: 'beastRoar',       cells: 12, k: 1,    t0: 1.0, when: (b) => (b.t || 0) <= 1.0 },
  swipewarn:  { key: 'beastSwipe',      cells: 12, k: 1.42, from: 0, to: 5 },   // the raised paw HOLDS on 5
  swipe:      { key: 'beastSwipe',      cells: 12, k: 1.42, from: 6, to: 11 },  // the rake, then the recovery
  crouch:     { key: 'beastLeap',       cells: 12, k: 1.35, from: 0, to: 5 },
  springwarn: { key: 'beastLeap',       cells: 12, k: 1.35, from: 0, to: 5 },
  pounce:     { key: 'beastLeap',       cells: 12, k: 1.35, from: 6, to: 8, air: 1 },
  recover:    { key: 'beastLeap',       cells: 12, k: 1.35, from: 9, to: 11 },
  spring:     { key: 'beastSpringup',   cells: 8,  k: 1.14, u: 1 },
  dive:       { key: 'beastDive',       cells: 5,  k: 1,    u: 1 },
  perch:      { key: 'beastPerch',      cells: 8,  k: 1,    loop: 10 },
  daze:       { key: 'beastDaze',       cells: 12, k: 1,    loop: 12 },
  nullcharge: { key: 'beastNullcharge', cells: 12, k: 1,    from: 0, to: 3 },
  nullhop:    { key: 'beastNullcharge', cells: 12, k: 1,    from: 4, to: 8, loop: 10 },
  nullend:    { key: 'beastNullcharge', cells: 12, k: 1,    from: 9, to: 11 },
  dead:       { key: 'beastFall',       cells: 12, k: 1,    death: 1 },
};
// every key above, once — prefetched the moment the fight is entered
const BEAST_STRIPS = Object.values(BEAST_STRIP).map((s) => s.key).filter((k, i, a) => a.indexOf(k) === i);
// Draws the strip cell for the boss's current state in RIG SPACE (origin at
// the feet, the body transform already applied by drawBeast), or returns
// false so the caller draws the rig instead. G.beastRig forces the rig, which
// is how the harness diffs the two.
function beastStrip(c, b) {
  if (typeof G !== 'undefined' && (G.bossRig || G.beastRig)) return false;
  let st = b.dead ? 'dead' : b.st;
  // the null sequence's pounces float rather than leap: the field's own cells
  if (st === 'pounce' && (b.nullSeq || 0) > 0) st = 'nullhop';
  const S = BEAST_STRIP[st];
  if (!S || (S.when && !S.when(b))) return false;
  if (b._sst !== st) { b._sst = st; b._st0 = Math.max(0.05, b.t || 0); }
  else if ((b.t || 0) > (b._st0 || 0)) b._st0 = b.t;
  const from = S.from || 0, to = S.to == null ? S.cells - 1 : S.to, n = to - from + 1;
  let cell;
  if (S.loop) cell = from + (Math.floor((b.anim || 0) * S.loop) % n);
  else if (S.air) { const vy = b.vy || 0; cell = from + (vy < -120 ? 0 : vy < 120 ? 1 : 2); }
  else if (S.u) cell = from + Math.min(n - 1, Math.floor(Math.max(0, Math.min(0.999, b.u || 0)) * n));
  else if (S.death) {
    const T = 1.6 - Math.max(0, Math.min(1.6, b.deathAnimT == null ? 0 : b.deathAnimT));
    cell = from + Math.min(n - 1, Math.floor((T / 1.6) * n));
  } else {
    const t0 = S.t0 || b._st0 || 1;
    const p = Math.max(0, Math.min(0.999, 1 - (b.t || 0) / t0));
    cell = from + Math.floor(p * n);
  }
  const im = (typeof MEDIA_RAW !== 'undefined') && MEDIA_RAW[S.key];
  const cellH = im && im.naturalHeight ? im.naturalHeight : 320;
  return drawStripCell(c, S.key, cell, S.cells, 0, 0, cellH * BEAST_STRIP_PX * S.k, false);
}

// boss entry point. Returns false so the old chain can catch a missing image.
function drawBeast(c, b) {
  const im = beastImg(); if (!im || !im.naturalWidth) return false;
  try {
    const fv = b.faceVis == null ? -1 : b.faceVis;
    const S = (b.h * 2.35) / BEAST_H;
    const cx = b.x + b.w / 2, footY = b.y + b.h;
    BEAST_LIVE.t = b.anim || 0; BEAST_LIVE.glow = 1; BEAST_LIVE.pure = !!b.purified;
    // SMEAR TRAIL: while it leaps (pounce / spring / dive), 2-3 violet
    // afterimage copies of the authored crouch figure hang along the arc
    // and burn off — the virus can't keep up with the body
    const leaping = !b.dead && (b.st === 'pounce' || b.st === 'spring' || b.st === 'dive');
    if (b.dead) b._smear = null;
    if (leaping) {
      const tr = b._smear || (b._smear = []);
      const last = tr[tr.length - 1];
      const rot = b.st === 'pounce'
        ? Math.max(-0.3, Math.min(0.45, (b.vy || 0) / 1400))
        : (b.st === 'dive' ? 0.3 : -0.22);
      if (!last || Math.hypot(cx - last.x, footY - last.y) > 30) {
        tr.push({ x: cx, y: footY, t: b.anim, sgn: fv < 0 ? 1 : -1, rot });
        if (tr.length > 3) tr.shift();
      }
    }
    if (b._smear && b._smear.length) {
      const vim = beastViolet();
      const sA = BEAST_P.aAtk, gw = sA[2] * BEAST_F, gh = sA[3] * BEAST_F;
      for (let i = b._smear.length - 1; i >= 0; i--) {
        const sm = b._smear[i], age = (b.anim || 0) - sm.t;
        if (age > 0.26) { b._smear.splice(i, 1); continue; }
        if (!vim || age < 0.03) continue;
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha *= 0.32 * (1 - age / 0.26);
        c.translate(sm.x, sm.y);
        c.scale(sm.sgn * S, S);
        if (sm.rot) { c.translate(0, -gh * 0.4); c.rotate(sm.rot); c.translate(0, gh * 0.4); }
        c.drawImage(vim, sA[0], sA[1], sA[2], sA[3], -gw / 2, -gh, gw, gh);
        c.restore();
      }
    }
    c.save();
    c.translate(cx, footY);
    const sgn = fv < 0 ? 1 : -1;                     // authored facing LEFT
    const ta = Math.abs(fv);
    // through-the-front turn: inside the window the constructed FRONT view
    // (the artist's pixels, mirror-composited) looks at the camera
    const turnFront = ta < 0.3 && !b.dead && b.stagT <= 0
      && b.st !== 'pounce' && b.st !== 'crouch' && b.st !== 'roar'
      && b.st !== 'springwarn' && b.st !== 'spring' && b.st !== 'dive'
      && b.st !== 'nullhop' && b.st !== 'nullend' && b.st !== 'daze'
      ? beastFront() : null;
    if (turnFront) {
      const k = 1 - ta / 0.3;
      const fs = S * (270 / 274);
      c.translate(0, (1 - ta) * 4);
      // the front composite never compresses below 0.82 of its true width —
      // the crossing frame is a dimensional body, never a sliver
      c.scale((0.82 + 0.18 * k) * fs, fs);
      c.save(); c.globalAlpha *= 0.34; c.fillStyle = '#04070b';
      c.beginPath(); c.ellipse(0, 2, 132, 15, 0, 0, 7); c.fill(); c.restore();
      if (b.hurtT > 0) c.globalAlpha = 0.72;
      c.drawImage(turnFront, -120, -274);
      c.restore();
      return true;
    }
    c.translate(0, (1 - ta) * 7);
    c.scale(sgn * (0.85 + 0.15 * ta) * S, (1 - (1 - ta) * 0.06) * S);
    if (b.hurtT > 0) c.globalAlpha = 0.72;
    // ground shadow lives with every representation
    c.save(); c.globalAlpha *= 0.34; c.fillStyle = '#04070b';
    c.beginPath(); c.ellipse(0, 4, 205, 17, 0, 0, 7); c.fill(); c.restore();
    if (b.stagT > 0 && !b.dead) {
      // staggered by the Song: cowering low, trembling
      BEAST_LIVE.glow = 0.35;
      bFig(c, 'aAtk', 0, 2.2);
    // THE WHOLE LEAP USED TO BE INTERCEPTED HERE and handed to `aAtk` — the
    // authored standing side view — squashed on the coil, stretched in the air.
    // Six different beats, one drawing. It is the rig's job now (beastLeap /
    // beastCoil): the same restyled 3D parts the stalk and the landing already
    // use, posed through a motion instead of scaled through one. The body
    // stretch stays, applied to the rig, because a leap wants the smear.
    } else if ((b.st === 'crouch' || b.st === 'springwarn' || b.st === 'nullhop') && !b.dead) {
      // the wind-up, drawn as a machine loading — see beastCoilFx
      const dur = b.phase === 2 ? 0.9 : 1.0;
      const k = b.st === 'nullhop' ? 1
        : 1 - Math.max(0, Math.min(1, (b.t || 0) / (b.st === 'springwarn' ? 0.42 : dur)));
      // the veins go amber IMMEDIATELY and then deepen — the recolour is the
      // cheapest, largest-area part of the surge, so holding it back until the
      // wind-up is half over throws away the half that matters most
      BEAST_LIVE.charge = 0.32 + 0.68 * k;
      if (!beastStrip(c, b)) beastDraw(c, b, beastPose(b));
      if (!G.artProbe) beastCoilFx(c, b, k);   // see G.artProbe in entities.js
      // THE FLASH. The last beat before it goes: one white pop over the whole
      // animal, so the cue to move is a single unmissable event rather than a
      // ramp the eye can sit through. It fires with just over a fifth of a
      // second left — enough to act on, not enough to ignore.
      // A FLAT fill is what this was, and a flat additive ellipse over a grey
      // room is fog: it has no centre, no edge, and no direction. It is a
      // gradient bloom now — a hot core that falls off, which is what light
      // does and what makes the eye call this an event instead of weather.
      if (k > 0.80) {
        const f = Math.min(1, (k - 0.80) / 0.14);
        const pulse = 0.68 + 0.32 * Math.sin(b.anim * 40);
        c.save();
        c.globalCompositeOperation = 'lighter';
        const R = 150 + f * 105;
        const gg = c.createRadialGradient(0, -140, 8, 0, -140, R);
        gg.addColorStop(0, 'rgba(255,250,232,' + (0.60 * f * pulse) + ')');
        gg.addColorStop(0.34, 'rgba(255,206,116,' + (0.30 * f * pulse) + ')');
        gg.addColorStop(1, 'rgba(255,150,40,0)');
        c.fillStyle = gg;
        c.beginPath(); c.ellipse(0, -140, R, R * 0.82, 0, 0, 7); c.fill();
        c.restore(); c.globalAlpha = 1;
      }
      BEAST_LIVE.charge = 0;
    } else if ((b.st === 'pounce' || b.st === 'spring' || b.st === 'dive') && !b.dead) {
      const up = Math.max(0, Math.min(0.55, -(b.vy || 0) / 1000));
      const dn = Math.max(0, Math.min(0.5, (b.vy || 0) / 1000));
      c.scale(1 - up * 0.10 + dn * 0.05, 1 + up * 0.16 - dn * 0.04);
      if (!beastStrip(c, b)) beastDraw(c, b, beastPose(b));
    } else if ((b.st === 'swipe' || b.st === 'swipewarn') && !b.dead) {
      // THE CLAW, which is the whole point of a lion's swipe and which this
      // fight did not previously show. The pose rotated a foreleg and the game
      // spawned a hitbox; what the player SAW was the animal leaning. So the
      // paw is now the loudest thing on screen for a quarter of a second —
      // claws unsheathed on the wind-up, an arc that follows where they have
      // actually been, and four separate trails, because one wide swoosh is a
      // sword and four is a hand.
      // ...unless the filmed swipe is here, which carries its own claws: the
      // trails are fitted to the rig's paw and would hang off the take's
      if (!beastStrip(c, b)) {
        const P = beastPose(b);
        beastDraw(c, b, P);
        beastClawFx(c, b, P);
      }
    } else if (b.st === 'daze' && !b.dead) {
      // broken open: the head shakes itself, the veins gutter, and it does not
      // defend. See the entities-side state — this branch only draws it.
      if (!beastStrip(c, b)) beastDraw(c, b, beastPose(b));
      if (!G.artProbe) beastDazeFx(c, b);      // see G.artProbe in entities.js
    } else if (b.st === 'nullend' && !b.dead) {
      // the field's collapse dropped it flat — sprawled and spent
      BEAST_LIVE.glow = 0.5;
      if (!beastStrip(c, b)) bFig(c, 'aAtk', 0.12, 0.6, 1.06, 0.96);
    } else if (b.st === 'nullcharge' && !b.dead) {
      // stands dead still while gravity is unplugged; virus light climbs the coat
      if (!beastStrip(c, b)) beastDraw(c, b, beastPose(b));
      c.save(); c.globalCompositeOperation = 'lighter';
      const ng = c.createRadialGradient(0, -120, 10, 0, -120, 190);
      ng.addColorStop(0, 'rgba(176,106,255,' + (0.24 + Math.sin(b.anim * 9) * 0.12) + ')');
      ng.addColorStop(1, 'rgba(176,106,255,0)');
      c.fillStyle = ng; c.beginPath(); c.arc(0, -120, 190, 0, 7); c.fill();
      c.restore();
    } else if (b.st === 'dorm' && !b.dead) {
      // asleep, composed flat from his own parts — only the breath moves
      bSleep(c, b.anim, 0);
    } else if (b.st === 'intro' && (b.t || 0) > 1.0 && !b.dead) {
      // the stir: head off the paws first, chest following — still down
      const k = clamp(1 - (b.t || 0) / 2, 0, 1);
      c.save();
      if (k > 0.2) c.translate(rnd(-1, 1) * k * 3, rnd(-1, 1) * k);
      bSleep(c, b.anim, clamp(k / 0.5, 0, 1));
      c.restore();
    } else if (b.st === 'intro' && !b.dead) {
      // the wake's climax: up onto his feet and straight into the authored
      // open-jaw howl, holding it while the roar plays out
      BEAST_LIVE.glow = 1.4;
      if (!beastStrip(c, b)) bFig(c, 'aRoar', 0, 2 + Math.max(0, (b.t || 0) - 0.35) * 5);
    } else if (b.st === 'roar' && (b.t || 0) > 0.25 && (b.t || 0) <= 1.07 && !b.dead) {
      // THE ROAR — the sheet's own open-jaw howl, shaking harder as it
      // peaks. (The first ~0.18s stays on the rig: the chest swells up into
      // this figure instead of snapping to it.)
      BEAST_LIVE.glow = 1.5;
      if (!beastStrip(c, b)) bFig(c, 'aRoar', 0, 1 + Math.max(0, 1.25 - (b.t || 0)) * 6);
      // the virus orb GATHERS in the throat through the inhale (the tell),
      // pulsing brighter each beat, then floods out as the roar breaks
      const inh = Math.max(0, Math.min(1, (1.25 - (b.t || 0)) / 0.5));
      const orbR = 22 + inh * 44;
      const pulse = 0.5 + Math.sin(b.anim * 13) * 0.22 * (0.4 + inh);
      c.save(); c.globalCompositeOperation = 'lighter';
      const mg = c.createRadialGradient(-150, -215, 2, -150, -215, orbR);
      mg.addColorStop(0, 'rgba(240,200,255,' + Math.min(0.95, 0.45 + pulse * 0.5) + ')');
      mg.addColorStop(0.4, 'rgba(220,150,255,' + (0.35 + inh * 0.3) + ')');
      mg.addColorStop(1, 'rgba(140,60,220,0)');
      c.fillStyle = mg; c.beginPath(); c.arc(-150, -215, orbR, 0, 7); c.fill();
      c.restore();
    } else {
      if (!beastStrip(c, b)) beastDraw(c, b, beastPose(b));
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
    if (e.hurtT > 0) c.globalAlpha = 0.72;
    if (e.hypnoT > 0) c.globalAlpha = 0.85;
    const fr = ta < 0.3 ? beastFront() : null;
    if (fr) {
      const k = 1 - ta / 0.3;
      const fs = S * (270 / 274);
      c.scale((0.82 + 0.18 * k) * fs, fs);
      c.drawImage(fr, -120, -274);
      c.restore();
      return true;
    }
    c.translate(0, (1 - ta) * 4);
    c.scale(sgn * (0.85 + 0.15 * ta) * S, (1 - (1 - ta) * 0.06) * S);
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
