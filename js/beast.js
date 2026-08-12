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
const BEAST_LIVE = { t: 0, glow: 1 };

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
    P.legs[0] = {
      a1: 0.28 * pull * (1 - re) - 0.95 * re,
      a2: -0.14 * pull * (1 - re) + 0.55 * re,
    };
    P.legs[1].a1 += 0.1 * pull;                    // hind gathers underneath
    P.neckA = 0.05 * pull; P.headA = 0.08 * pull;
    P.glow = 1 + wq * 0.3; P.tailA = Math.sin(t * 10) * 0.3;
  } else if (st === 'swipe') {
    // the paw whips through, OVERSHOOTS the strike line, then settles back
    const sq = 1 - Math.max(0, Math.min(1, (b.t || 0) / 0.24));
    const e = 1 - Math.pow(1 - sq, 3);
    const over = 0.3 * Math.max(0, Math.sin((sq - 0.4) / 0.6 * Math.PI));
    P.crouch = 6; P.pitch = 0.015 + 0.03 * e;
    P.legs[0] = { a1: -0.95 + 1.5 * e + over, a2: 0.55 - 0.9 * e - over * 0.5 };
    P.legs[1].a1 = -0.1 * e;                       // hind braces the followthrough
    P.neckA = 0.04 * e; P.headA = 0.1 * e;
    P.glow = 1.4; P.tailA = -0.25 * e;
  } else if (st === 'spring' || st === 'dive') {
    // airborne leap: forelegs reaching, hindlegs driving
    P.pitch = st === 'dive' ? 0.3 : -0.22; P.bob = 0;
    P.legs[0] = P.legs[2] = { a1: -0.7, a2: 0.5 };
    P.legs[1] = P.legs[3] = { a1: 0.65, a2: -0.45 };
    P.glow = 1.3; P.tailUp = 0.8; P.tailA = 0.3;
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
    // pounce: forelegs reach, hindlegs drive, nose follows the arc
    const dive = Math.max(-0.3, Math.min(0.45, (b.vy || 0) / 1400));
    P.pitch = dive; P.bob = 0;
    P.legs[0] = P.legs[2] = { a1: -0.75, a2: 0.55 };
    P.legs[1] = P.legs[3] = { a1: 0.7, a2: -0.5 };
    P.neckA = -0.12; P.headA = dive * 0.6; P.glow = 1;
    P.tailA = 0.4; P.tailUp = 0.9;
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
      && b.st !== 'nullhop' && b.st !== 'nullend'
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
    } else if (b.st === 'pounce' && !b.dead) {
      // the authored pounce riding the arc — STRETCHED past 1.0 on the
      // launch drive, relaxing and spreading again as it tops out and drops
      const dive = Math.max(-0.3, Math.min(0.45, (b.vy || 0) / 1400));
      const up = Math.max(0, Math.min(0.55, -(b.vy || 0) / 1000));
      const dn = Math.max(0, Math.min(0.5, (b.vy || 0) / 1000));
      BEAST_LIVE.glow = 1.25;
      bFig(c, 'aAtk', dive, 0, 1 - up * 0.16 + dn * 0.08, 1 + up * 0.26 - dn * 0.06);
    } else if ((b.st === 'springwarn' || (b.st === 'perch' && (b.t || 0) <= 0.45)) && !b.dead) {
      // the flattened crouch figure IS the tell, on the ground or the ledge
      BEAST_LIVE.glow = 1.15;
      bFig(c, 'aAtk', 0, 1.8, 1.04, 0.95);
    } else if (b.st === 'crouch' && !b.dead) {
      // the pounce anticipation: the sheet's own crouch, COMPRESSING in two
      // beats — a slow settle, then one extra hard coil right before launch
      const ck = 1 - Math.max(0, Math.min(1, (b.t || 0) / 0.45));
      const beat2 = Math.max(0, Math.min(1, (ck - 0.72) / 0.28));
      const cmp = ck * ck * 0.5 + beat2 * beat2 * (3 - 2 * beat2) * 0.5;
      BEAST_LIVE.glow = 1.1 + cmp * 0.4;
      bFig(c, 'aAtk', 0, 1.6, 1 + 0.09 * cmp, 1 - 0.14 * cmp);
    } else if (b.st === 'nullhop' && !b.dead) {
      // NULL GRAVITY coil: the same authored crouch, wound tighter
      BEAST_LIVE.glow = 1.5;
      bFig(c, 'aAtk', 0, 2.6, 1.1, 0.87);
    } else if (b.st === 'nullend' && !b.dead) {
      // the field's collapse dropped it flat — sprawled and spent
      BEAST_LIVE.glow = 0.5;
      bFig(c, 'aAtk', 0.12, 0.6, 1.06, 0.96);
    } else if (b.st === 'nullcharge' && !b.dead) {
      // stands dead still while gravity is unplugged; virus light climbs the coat
      beastDraw(c, b, beastPose(b));
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
      bFig(c, 'aRoar', 0, 2 + Math.max(0, (b.t || 0) - 0.35) * 5);
    } else if (b.st === 'roar' && (b.t || 0) > 0.25 && (b.t || 0) <= 1.07 && !b.dead) {
      // THE ROAR — the sheet's own open-jaw howl, shaking harder as it
      // peaks. (The first ~0.18s stays on the rig: the chest swells up into
      // this figure instead of snapping to it.)
      BEAST_LIVE.glow = 1.5;
      bFig(c, 'aRoar', 0, 1 + Math.max(0, 1.25 - (b.t || 0)) * 6);
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
