// ===========================================================================
// FURNACE CHOIR, THE ATLAS — the owner's CORRUPTED MECHA DRAGON.
// Every pixel here is the owner's sheet: three authored full poses (IDLE,
// WALK, FLY), the large flying hero figure (the dramatic states — the Forge
// Roar, the orb summoning, the meltdown), the parts column (which he BREAKS
// INTO when he dies, staggered — wings first, then the head, then the body
// drops), the glow core (the molten orb art) and the lava ring (his ground
// presence). Nothing is guessed; the sheet is ground truth.
// NOTE: this art faces RIGHT (GLACIERE's faces left — signs flip here).
// ===========================================================================
const DRG_P = {
  hero: [6, 6, 608, 541],       // large flying figure
  ring: [620, 6, 512, 96],      // molten lava ring (ground effect)
  idle: [1138, 6, 170, 165],    // grounded stand
  walk: [6, 553, 196, 168],     // grounded stride
  fly: [208, 553, 230, 168],    // airborne
  head: [444, 553, 140, 84], neck: [590, 553, 132, 107], body: [728, 553, 261, 125],
  flegR: [995, 553, 85, 118], flegL: [1086, 553, 79, 117],
  hlegR: [1171, 553, 86, 113], hlegL: [1263, 553, 70, 116],
  tail: [6, 727, 299, 75],
  wingR: [311, 727, 298, 239], wingL: [615, 727, 292, 238],
  core: [913, 727, 48, 60],     // glow core — the molten orb
};
const DRG_CACHE = {};
function drgImg() {
  if (typeof MEDIA_IMG === 'undefined') return null;
  return (typeof softArt === 'function' && softArt('dragonParts')) || MEDIA_IMG.dragonParts;
}

// white-hot copy of the atlas for the meltdown: the sheet's own pixels pushed
// toward #FFF5E0, crossfaded in by whiteHot/slag — never a painted-over glow
function drgHot() {
  if (DRG_CACHE.hot) return DRG_CACHE.hot;
  const im = drgImg(); if (!im || !im.naturalWidth) return null;
  const cv = document.createElement('canvas');
  cv.width = im.naturalWidth; cv.height = im.naturalHeight;
  const x = cv.getContext('2d');
  x.drawImage(im, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = 'rgba(255,245,224,0.85)'; x.fillRect(0, 0, cv.width, cv.height);
  DRG_CACHE.hot = cv;
  return cv;
}

// one authored figure, bottom-anchored at the origin (art faces RIGHT).
// wk crossfades the white-hot copy over it.
function drgFig(c, key, wk, shake, rot) {
  const im = drgImg(); const s = DRG_P[key];
  c.save();
  if (shake) c.translate(rnd(-shake, shake), rnd(-shake, shake) * 0.5);
  if (rot) { c.translate(0, -s[3] * 0.45); c.rotate(rot); c.translate(0, s[3] * 0.45); }
  c.drawImage(im, s[0], s[1], s[2], s[3], -s[2] / 2, -s[3], s[2], s[3]);
  if (wk > 0) {
    // capped crossfade: white-hot must READ as him glowing, never erase him
    const h = drgHot();
    if (h) {
      c.save(); c.globalAlpha *= Math.min(1, wk) * 0.5;
      c.drawImage(h, s[0], s[1], s[2], s[3], -s[2] / 2, -s[3], s[2], s[3]);
      c.restore();
    }
  }
  c.restore();
}

// ---------------------------------------------------------------------------
// THE STEPPING RIG — no more sliding stride pose. The walk figure keeps his
// body, wings, head and tail, but the baked legs are lifted out and the
// sheet's own four leg pieces are hung back on nested hip/knee pivots, so
// the walk is REAL steps: reach, plant, drive, fold. The gait clock is
// NULLFANG's rotary gallop — hind pair drives, front pair catches off-beat.
// ---------------------------------------------------------------------------
// per-piece skeleton, measured off the sheet: hip ball and knee ball centres
// in part-local px. Each piece is split at its knee so the shank folds.
const DRG_LEG = {
  flegR: { hip: [46, 20], knee: [70, 42] },
  flegL: { hip: [30, 20], knee: [56, 46] },
  hlegR: { hip: [20, 20], knee: [60, 44] },
  hlegL: { hip: [17, 18], knee: [46, 44] },
};
// hip anchors in walk-pose local space (origin feet-centre, art faces RIGHT):
// [f near, h near, f far, h far] — far pair sits deeper and darker
const DRG_HIPS = [[60, -70, 'flegR'], [-26, -68, 'hlegR'], [44, -72, 'flegL'], [-8, -70, 'hlegL']];
const DRG_LEGSC = 0.64;                          // leg pieces vs walk-pose art
// warm-shadowed atlas copy for the far pair, so depth reads
function drgDark() {
  if (DRG_CACHE.dark) return DRG_CACHE.dark;
  const im = drgImg(); if (!im || !im.naturalWidth) return null;
  const cv = document.createElement('canvas');
  cv.width = im.naturalWidth; cv.height = im.naturalHeight;
  const x = cv.getContext('2d');
  x.drawImage(im, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = 'rgba(24,7,4,0.45)'; x.fillRect(0, 0, cv.width, cv.height);
  DRG_CACHE.dark = cv;
  return cv;
}
// the walk figure with its baked legs erased — the tail band survives whole.
// The rig legs hang over the cut, their hip balls tucked up into the belly.
function drgWalkCut(hot) {
  const slot = hot ? 'walkCutHot' : 'walkCut';
  if (DRG_CACHE[slot]) return DRG_CACHE[slot];
  const im = hot ? drgHot() : drgImg();
  if (!im || (im.naturalWidth === 0 && !im.getContext)) return null;
  const s = DRG_P.walk;
  const cv = document.createElement('canvas');
  cv.width = s[2]; cv.height = s[3];
  const x = cv.getContext('2d');
  x.drawImage(im, s[0], s[1], s[2], s[3], 0, 0, s[2], s[3]);
  x.globalCompositeOperation = 'destination-out';
  x.fillRect(80, 96, 116, 72);                  // the leg block right of the tail
  x.fillRect(35, 148, 45, 20);                  // the feet strip under the tail
  DRG_CACHE[slot] = cv;
  return cv;
}
// one authored leg split at its knee ball: the upper drives from the hip,
// the shank folds about the knee — both halves are the sheet's own pixels,
// overlapped 14 rows through the ball so the seam never shows mid-flex
function drgLegDraw(c, key, ax, ay, a1, a2, dark) {
  const im = dark ? drgDark() : drgImg();
  if (!im || !(im.naturalWidth || im.width)) return;
  const s = DRG_P[key], L = DRG_LEG[key], sc = DRG_LEGSC;
  const cutUp = Math.min(s[3], L.knee[1] + 7), cutLo = Math.max(0, L.knee[1] - 7);
  c.save();
  c.translate(ax, ay); c.rotate(a1);
  c.drawImage(im, s[0], s[1], s[2], cutUp,
    -L.hip[0] * sc, -L.hip[1] * sc, s[2] * sc, cutUp * sc);
  c.translate((L.knee[0] - L.hip[0]) * sc, (L.knee[1] - L.hip[1]) * sc);
  c.rotate(a2);
  c.drawImage(im, s[0], s[1] + cutLo, s[2], s[3] - cutLo,
    -L.knee[0] * sc, (cutLo - L.knee[1]) * sc, s[2] * sc, (s[3] - cutLo) * sc);
  c.restore();
}
// the assembled stepping walk: far pair, cut body, near pair — one gait beat
function drgWalkRig(c, ph, wk, shake, rot) {
  const cut = drgWalkCut(false);
  if (!cut) { drgFig(c, 'walk', wk, shake, rot); return; }
  const s = DRG_P.walk;
  c.save();
  if (shake) c.translate(rnd(-shake, shake), rnd(-shake, shake) * 0.5);
  if (rot) { c.translate(0, -s[3] * 0.45); c.rotate(rot); c.translate(0, s[3] * 0.45); }
  // ROTARY GALLOP timing, straight off NULLFANG: hind pair near-together,
  // front pair staggered, front vs hind NOT a clean half-cycle — the
  // off-beat is what reads as an animal instead of a wind-up toy
  const PH = [0, 1.18 * Math.PI, 0.42 * Math.PI, 1.46 * Math.PI];
  const legs = PH.map((p, i) => {
    const w = ph + p;
    // the hind pair carries the mass — it steps shallower and never folds
    // both feet off the ground at once; the front pair does the reaching
    const hind = i === 1 || i === 3 ? 0.72 : 1;
    return {
      // second harmonic: the reach snaps forward, drags back slower
      a1: (Math.sin(w) + 0.22 * Math.sin(w * 2 + 0.6)) * 0.26 * hind,
      // the knee folds hard on the swing-through, stays long in stance
      a2: (Math.sin(w + 1.25) * 0.55 + Math.max(0, Math.sin(w + 2.1)) * 0.5) * 0.42 * hind,
    };
  });
  drgLegDraw(c, DRG_HIPS[2][2], DRG_HIPS[2][0], DRG_HIPS[2][1], legs[2].a1, legs[2].a2, true);
  drgLegDraw(c, DRG_HIPS[3][2], DRG_HIPS[3][0], DRG_HIPS[3][1], legs[3].a1, legs[3].a2, true);
  c.drawImage(cut, -s[2] / 2, -s[3]);
  if (wk > 0) {
    const hcut = drgWalkCut(true);
    if (hcut) {
      c.save(); c.globalAlpha *= Math.min(1, wk) * 0.5;
      c.drawImage(hcut, -s[2] / 2, -s[3]);
      c.restore();
    }
  }
  drgLegDraw(c, DRG_HIPS[1][2], DRG_HIPS[1][0], DRG_HIPS[1][1], legs[1].a1, legs[1].a2, false);
  drgLegDraw(c, DRG_HIPS[0][2], DRG_HIPS[0][0], DRG_HIPS[0][1], legs[0].a1, legs[0].a2, false);
  c.restore();
}

// one death piece, centre-anchored
function drgPiece(c, key, sc) {
  const im = drgImg(); const s = DRG_P[key];
  c.drawImage(im, s[0], s[1], s[2], s[3], -s[2] * sc / 2, -s[3] * sc / 2, s[2] * sc, s[3] * sc);
}

// a soft molten glow puddle (mouth ember, core flare)
function drgGlow(c, x, y, r, a, lit) {
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, 'rgba(255,' + (lit ? '245,224,' : '215,106,') + a + ')');
  g.addColorStop(0.5, 'rgba(255,123,58,' + a * 0.6 + ')');
  g.addColorStop(1, 'rgba(255,123,58,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.restore();
}

// mouth position per grounded pose, in art-local units (origin feet-centre)
const DRG_MOUTH = { idle: [62, -112], walk: [72, -116], fly: [92, -128] };

// his roost: a nest of slag and bent girders packed onto the high ledge.
// World-space and anchored — it stays where he built it after he leaves.
function drgNest(c, x, y, t) {
  c.save();
  c.translate(x, y);
  // heat shimmer banked in the bowl
  c.save(); c.globalCompositeOperation = 'lighter';
  const eg = c.createRadialGradient(0, -8, 2, 0, -8, 46);
  const ea = 0.14 + Math.max(0, Math.sin(t * 0.9)) * 0.08;
  eg.addColorStop(0, 'rgba(255,160,80,' + ea + ')'); eg.addColorStop(1, 'rgba(255,120,50,0)');
  c.fillStyle = eg; c.beginPath(); c.ellipse(0, -8, 70, 26, 0, 0, 7); c.fill();
  c.restore();
  // the bowl: three packed arcs of scrap, darkest deepest
  c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    c.strokeStyle = ['#241a12', '#3a2a20', '#4a382a'][i];
    c.lineWidth = 13 - i * 3;
    c.beginPath();
    c.ellipse(0, -4 - i * 5, 74 - i * 10, 20 - i * 4, 0, 0.15 + i * 0.06, Math.PI - 0.15 - i * 0.06);
    c.stroke();
  }
  // bent girder ends poking from the weave
  c.strokeStyle = '#57453a'; c.lineWidth = 4;
  for (let i = 0; i < 6; i++) {
    const a = 0.4 + i * 0.45, r0 = 58 - (i % 2) * 12;
    c.beginPath();
    c.moveTo(Math.cos(a) * r0 * (i % 2 ? -1 : 1), -8 - Math.sin(a) * 12);
    c.lineTo(Math.cos(a) * (r0 + 16) * (i % 2 ? -1 : 1), -16 - Math.sin(a) * 20);
    c.stroke();
  }
  // a few live embers in the weave
  for (let i = 0; i < 4; i++) {
    const px = Math.sin(i * 2.7) * 40, ph = t * 1.4 + i * 1.9;
    c.fillStyle = 'rgba(255,' + (150 + i * 20) + ',80,' + (0.3 + Math.max(0, Math.sin(ph)) * 0.4) + ')';
    c.fillRect(px, -10 - (i % 2) * 6, 3, 3);
  }
  c.restore();
}

// THE SLEEPING DRAGON — composed from his own authored parts the way a
// dragon actually sleeps: body flat on the ground, tail wrapped around the
// front, wings folded over the back like a tent, head down on a tucked
// forepaw. lift 0..1 is the stir: head and chest come off the ground first.
// Local space: ground at y=0, art faces RIGHT, caller has scaled/mirrored.
function drgSleep(c, t, lift) {
  const im = drgImg(); if (!im || (im.naturalWidth === 0 && !im.getContext)) return;
  const dk = drgDark();
  const pc = (key, x, y, rot, sc, sqx, sqy, dark) => {
    const s = DRG_P[key];
    c.save(); c.translate(x, y); if (rot) c.rotate(rot);
    c.scale(sqx || 1, sqy || 1);
    c.drawImage(dark && dk ? dk : im, s[0], s[1], s[2], s[3],
      -s[2] * sc / 2, -s[3] * sc / 2, s[2] * sc, s[3] * sc);
    c.restore();
  };
  const P2 = 0.42;
  const br = Math.sin(t * 0.75);                   // the slow sleeping breath
  c.save();
  c.translate(0, br * 1.3 * (1 - lift));
  // far wing: folded flat along the back, darkened for depth
  pc('wingL', -14, -58, 0.9, 0.2, 1, 0.55, true);
  // tail wrapped around the front of the body, lying on the ground
  pc('tail', -26, -13, 0.1, P2);
  // the body, belly on the ground
  pc('body', 0, -27, -0.02, P2, 1, 1 - br * 0.012);
  // near wing folded over it — the tent
  pc('wingR', 2, -54 - lift * 6, 1.0 - lift * 0.15, 0.24, 1, 0.5);
  // tucked forepaw, lying flat — the pillow
  pc('flegR', 46, -11, 1.35, P2 * 0.85);
  // neck and head: resting on the paw; the stir lifts them first
  pc('neck', 34, -30 - lift * 30, 0.55 - lift * 0.75, P2);
  pc('head', 58 - lift * 8, -15 - lift * 52, 0.6 - lift * 0.85, P2);
  // the banked chest ember, breathing under the plating
  drgGlow(c, 2, -26, 7 + lift * 16, 0.06 + Math.max(0, br) * 0.06 + lift * 0.35, false);
  c.restore();
}

function drawFurnace(c, b) {
  const im = drgImg(); if (!im || !im.naturalWidth) return false;
  c.save();
  try {
    // the roost is part of the room, not of him — drawn at its own anchor
    if (b.nestX != null && !b.dead) drgNest(c, b.nestX, b.nestFootY, b.anim);
    // ---- visual-state memory: draw-side timers driven off b.anim ----------
    const fc = b.fc || (b.fc = {
      pSt: b.st, pAnim: b.anim, slamT: 0, roarT: 0, pulseT: 0,
      hymnR: 0, pStruck: 0, step: 0, deadT: 0,
    });
    const dt = clamp(b.anim - fc.pAnim, 0, 0.1); fc.pAnim = b.anim;
    if (fc.pSt !== b.st) {
      // the slam has no smear: the warn pose cuts to the struck pose in one
      // frame (too heavy to blur) and the tail stays planted, then pulls out
      if (fc.pSt === 'slamwarn') fc.slamT = 0.5;
      // the roar breaks: hold the reared figure while the first ring leaves
      if (fc.pSt === 'hymn') { fc.roarT = 0.55; fc.pulseT = 0.25; }
      fc.pSt = b.st;
    }
    fc.slamT = Math.max(0, fc.slamT - dt);
    fc.roarT = Math.max(0, fc.roarT - dt);
    fc.pulseT = Math.max(0, fc.pulseT - dt);
    // each hymn ring rebirth is a fresh peal — flash the mouth in sync
    if (b.hymn) {
      if (b.hymn.r < fc.hymnR - 40) fc.pulseT = 0.22;
      fc.hymnR = b.hymn.r;
    } else fc.hymnR = 0;
    // forgebell: pulse on every summon strike the AI emits
    if ((b.fbStruck || 0) !== fc.pStruck) {
      if (b.st === 'forgebell') fc.pulseT = 0.2;
      fc.pStruck = b.fbStruck || 0;
    }

    const S = (b.h * 1.9) / DRG_P.idle[3];         // grounded pose scale
    const HR = (b.h * 2.6) / DRG_P.hero[3] / S;    // hero figure, relative
    const PS = 0.34;                               // death pieces vs pose art
    const cx = b.x + b.w / 2, footY = b.y + b.h;
    const fv = b.faceVis == null ? (b.face || 1) : b.faceVis;
    const sgn = fv >= 0 ? 1 : -1;                  // authored art faces RIGHT
    const ta = Math.max(0.001, Math.abs(fv));
    const wk = b.slag ? 1 : (b.whiteHot || 0);
    c.translate(cx, footY);
    // THE TURN LAW, tier 3: no authored front exists, so the flex floor is
    // 0.85, the pivot crouches into the feet, and the update side kicks dust
    // on the crossing frame
    c.translate(0, (1 - ta) * 6);
    c.scale(sgn * (0.85 + 0.15 * ta) * S, (1 - (1 - ta) * 0.05) * S);
    if (b.hurtT > 0 && !b.dead) c.globalAlpha *= 0.72;

    // ---- DEATH: he breaks into the sheet's own parts, staggered — wings
    // tear free first, the head drops next, the legs buckle, the body falls
    if (b.dead && !b.purified) {
      fc.deadT += dt;
      if (!fc.shatter) {
        const mk = (k, x, y, delay, vx, vy, vr, gy) =>
          ({ k, x, y, delay, vx, vy, vr, rot: 0, gy, bounced: 0, rel: false });
        fc.shatter = [
          mk('wingL', -45, -115, 0.00, -70, -170, -2.6, -40),
          mk('wingR', -22, -110, 0.14, -30, -210, 2.2, -40),
          mk('head', 52, -118, 0.30, 80, -230, 1.8, -14),
          mk('neck', 28, -100, 0.40, 45, -150, -1.2, -18),
          mk('tail', -72, -55, 0.48, -70, -120, -1.5, -13),
          mk('flegR', 18, -38, 0.55, 30, -70, 1.0, -20),
          mk('hlegR', -28, -38, 0.62, -35, -60, -1.0, -19),
          mk('flegL', 34, -40, 0.68, 55, -50, 1.4, -20),
          mk('hlegL', -45, -40, 0.74, -55, -50, -1.4, -20),
          mk('body', -5, -70, 0.82, 0, -40, 0.25, -21),
        ];
      }
      // phase 1: the whole machine shudders as the seams let go
      const preT = 0.35;
      if (fc.deadT < preT) {
        drgFig(c, 'idle', wk + (1 - fc.deadT / preT) * 0.4, 2.5 + fc.deadT * 6);
        drgGlow(c, 0, -75, 60, 0.5, true);
        c.restore(); return true;
      }
      const fade = clamp(1 - (fc.deadT - 2.0) / 0.9, 0, 1);
      c.globalAlpha *= fade;
      // far-to-near paint order: wings behind, body last so it lands on top
      const order = ['wingL', 'tail', 'hlegL', 'flegL', 'neck', 'head', 'hlegR', 'flegR', 'body', 'wingR'];
      for (const key of order) {
        const p = fc.shatter.find(q => q.k === key);
        const live = fc.deadT - preT >= p.delay;
        if (live) {
          if (!p.rel) {                         // the moment it tears free
            p.rel = true;
            if (typeof burst === 'function')
              burst(cx + p.x * S * sgn, footY + p.y * S, 6, '#ff7b3a', 150, 0.4, 200, 2.5, true);
          }
          p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
          p.vy += 1500 * dt;
          if (p.y >= p.gy) {                    // meets the floor, one bounce
            p.y = p.gy;
            if (p.bounced++ === 0 && p.vy > 60) {
              p.vy = -p.vy * 0.3; p.vx *= 0.5; p.vr *= 0.4;
            } else { p.vy = 0; p.vx = 0; p.vr = 0; }
          }
        }
        c.save();
        c.translate(p.x, p.y); c.rotate(p.rot);
        if (!live) c.translate(rnd(-1.5, 1.5), rnd(-1, 1));   // straining
        drgPiece(c, key, PS);
        c.restore();
      }
      // the heat leaves him: embers rising off the wreck
      if (fade > 0.2 && typeof addPart === 'function' && chance(0.35))
        addPart(cx + rnd(-40, 40), footY - rnd(0, 30), rnd(-20, 20), rnd(-80, -30),
          0.5, chance(0.5) ? '#ffd76a' : '#ff7b3a', 2.5, 0, true);
      c.restore(); return true;
    }

    // ---- ground presence: the authored lava ring, breathing under him ----
    // banked while he sleeps; it catches as the wake reaches ignition
    const wakeK2 = b.st === 'intro' ? clamp(1 - (b.t || 0) / 2, 0, 1) : (b.st === 'dorm' ? 0 : 1);
    const ringGate = b.st === 'dorm' ? 0 : b.st === 'intro' ? (b.nestLanded ? 1 : 0) : 1;
    const grounded = Math.abs(b.vy || 0) < 120;
    // The ring is DECORATION PAINTED ON THE FLOOR, spreading 20 px below his
    // feet, so it is exactly what G.artProbe exists to switch off (entities.js).
    // It was never gated because the old plate's lower half was too dim to pass
    // the harness's lit-pixel test; a brighter plate made the same ring measure
    // as his feet standing 11 px through the ground, in every state, identically.
    if (grounded && ringGate > 0.01 && !G.artProbe) {
      const rg = DRG_P.ring;
      const hotStat = b.st === 'hymn' || b.st === 'forgebell' || b.st === 'meltwarn';
      const ra = (0.2 + Math.sin(b.anim * 2.6) * 0.07 + (hotStat ? 0.22 : 0) + wk * 0.25) * ringGate;
      const rw2 = 95, rh2 = 15;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= ra;
      c.drawImage(im, rg[0], rg[1], rg[2], rg[3], -rw2, -rh2 * 0.62, rw2 * 2, rh2 * 2);
      c.restore();
    }

    const shk = b.hurtT > 0 ? 1.2 : 0;
    const heroPose = b.st === 'hymn' || b.st === 'forgebell' || b.st === 'meltwarn' || fc.roarT > 0;

    if (b.st === 'dorm') {
      // ASLEEP IN THE NEST: the composed sleeping pose — body flat, tail
      // wrapped, wings folded over the back, head down on a tucked forepaw
      drgSleep(c, b.anim, 0);
    } else if (b.st === 'intro') {
      const t2 = b.t || 0;
      if (wakeK2 < 0.45) {
        // the stir: head and chest come off the ground first, the chest
        // light climbing through the seams, the whole machine knocking
        const u = wakeK2 / 0.45;
        c.save();
        if (u > 0.3) c.translate(rnd(-1, 1) * u * 2.5, rnd(-1, 1) * u);
        drgSleep(c, b.anim, u);
        c.restore();
      } else if (t2 <= 0.6 && !b.nestLanded) {
        // ON THE WING: down from the roost, nose tipped into the glide
        drgFig(c, 'fly', wk, 0.6, clamp((b.vy || 0) / 2400, -0.22, 0.28));
        if (typeof addPart === 'function' && chance(0.5))
          addPart(cx + rnd(-30, 30), footY - b.h * 1.2, rnd(-40, 40), rnd(-90, -30),
            0.4, '#ff7b3a', 2, 0, true);
      } else if (b.nestLanded) {
        // TOUCHDOWN: the landing squash settling out as the fight begins
        const ls = clamp(t2 / 0.1, 0, 1);
        c.translate(0, 4 * ls);
        c.scale(1 + 0.07 * ls, 1 - 0.09 * ls);
        drgFig(c, 'idle', wk, ls * 2, 0);
        drgGlow(c, 12, -78, 16, 0.3, false);
      } else {
        // IGNITION: he rears into the authored flying figure as the horn
        // of the foundry sounds — mouth and core flooding, ring catching
        const u = (wakeK2 - 0.45) / 0.55;
        const fl = Math.max(0, 1 - Math.abs(wakeK2 - 0.62) / 0.3);
        c.save();
        c.translate(0, -(4 + u * 9));
        c.scale(HR, HR);
        drgFig(c, 'hero', 0, (1 - u) * 2.5 + fl * 2, -0.04 - u * 0.05);
        drgGlow(c, 266, -292, 20 + fl * 40, 0.3 + fl * 0.6, fl > 0.4);
        drgGlow(c, 40, -230, 26 + fl * 22, 0.22 + fl * 0.4, false);
        c.restore();
        if (fl > 0.3 && typeof addPart === 'function' && chance(0.7))
          addPart(cx + rnd(-40, 40), footY - b.h * 1.5, rnd(-80, 80), rnd(-160, -40),
            0.5, chance(0.5) ? '#ffd76a' : '#ff7b3a', 2.5, 0, true);
      }
    } else if (b.stagT > 0) {
      // SILENCED: her song killed his — grounded, slumped, the light dimmed
      c.translate(0, 4);
      drgFig(c, 'idle', wk, 1.6, 0.06);
      c.save(); c.globalAlpha *= 0.4; c.fillStyle = '#1a0a06';
      c.beginPath(); c.ellipse(30, -100, 26, 18, 0.2, 0, 7); c.fill(); c.restore();
    } else if (heroPose) {
      // THE FORGE ROAR / ORB SUMMONING / MELTDOWN: the sheet's large flying
      // figure — he rears onto the air, wings spread, and the foundry answers
      let k = 0;
      if (b.st === 'hymn') k = clamp(1 - (b.t || 0) / 1.0, 0, 1);
      else if (b.st === 'forgebell') k = clamp(1 - (b.t || 0) / 1.35, 0, 1);
      else if (b.st === 'meltwarn') k = wk;
      else k = 1;
      const wind = (b.windT || 0) > 0 ? 1.4 : 0;
      c.save();
      c.translate(0, -(4 + k * 9) + Math.sin(b.anim * 3.2) * 2);
      c.scale(HR, HR);
      drgFig(c, 'hero', wk, wind + shk, -0.04 - k * 0.05);
      // the mouth: heat gathers through the windup, flashes on every peal
      const mp = fc.pulseT > 0 ? fc.pulseT / 0.25 : 0;
      drgGlow(c, 266, -292, 22 + k * 22 + mp * 24, 0.35 + k * 0.3 + mp * 0.5, mp > 0.4);
      // core flare under the chest plating
      drgGlow(c, 40, -230, 30 + Math.sin(b.anim * 6) * 5 + k * 14, 0.25 + k * 0.25, false);
      // wing-flap gusts on the peals (cosmetic wind, no new damage)
      if (mp > 0.25) {
        c.save(); c.globalCompositeOperation = 'lighter';
        c.lineCap = 'round';
        for (let i = 0; i < 2; i++) {
          const gy2 = -250 - i * 70, sw2 = (1 - mp) * 110;
          const gg = c.createLinearGradient(-200 - sw2, 0, -60 - sw2, 0);
          gg.addColorStop(0, 'rgba(255,215,106,0)');
          gg.addColorStop(0.6, 'rgba(255,215,106,' + (0.34 * mp) + ')');
          gg.addColorStop(1, 'rgba(255,215,106,0)');
          c.strokeStyle = gg; c.lineWidth = 7;
          c.beginPath(); c.moveTo(-200 - sw2, gy2 + i * 16);
          c.quadraticCurveTo(-130 - sw2, gy2 + 30, -60 - sw2 * 0.4, gy2 + 8);
          c.stroke();
        }
        c.restore();
      }
      c.restore();
      if (fc.pulseT > 0.16 && typeof addPart === 'function' && chance(0.8))
        addPart(cx + rnd(-30, 30) * sgn, footY - b.h * 1.6, rnd(-160, -60) * sgn, rnd(-40, 20),
          0.4, '#ffd76a', 2.5, 0, true);
    } else if (b.st === 'slamwarn' || fc.slamT > 0) {
      // TAIL SLAM. The warn coils the authored tail overhead — that is the
      // tell — then it cuts to planted-in-the-ground with NO smear between.
      const warm = b.st === 'slamwarn';
      const wt = warm ? clamp(1 - (b.t || 0) / 0.55, 0, 1) : 1;
      c.translate(0, warm ? 3 : (fc.slamT > 0.3 ? 5 : 2));
      drgFig(c, 'idle', wk, (warm ? 0.6 + wt * 1.8 : 0.8) + shk, warm ? -0.07 : 0.05);
      // the authored tail piece, rooted at the rump
      const ts = DRG_P.tail;
      let ang;
      if (warm) ang = -0.5 - wt * 1.45;                        // coils overhead
      else if (fc.slamT > 0.2) ang = 0.52;                     // PLANTED
      else ang = 0.52 - (1 - fc.slamT / 0.2) * 0.9;            // pulls out
      c.save();
      // the overlay hands back to the pose's own baked tail without a pop
      if (!warm && fc.slamT < 0.08) c.globalAlpha *= fc.slamT / 0.08;
      c.translate(-45, -58); c.rotate(ang);
      if (warm && wt > 0.6) c.translate(rnd(-1.5, 1.5), rnd(-1.5, 1.5));
      c.drawImage(im, ts[0], ts[1], ts[2], ts[3], -8, -ts[3] * PS * 0.5, ts[2] * PS, ts[3] * PS);
      // flame tip glow
      drgGlow(c, ts[2] * PS - 12, 0, 14 + wt * 8, 0.5, false);
      c.restore();
      occl(c, -45, -52, 14, 8, 0.4);
      // stuck: the ground answers around the buried tip
      if (!warm && fc.slamT > 0.2 && typeof addPart === 'function' && chance(0.6))
        addPart(cx + 42 * sgn + rnd(-8, 8), footY - 2, rnd(-50, 50), rnd(-90, -20), 0.35, '#c8925c', 2.5, 300, true);
    } else if (!grounded) {
      // airborne: the authored FLY pose, nose riding the arc
      drgFig(c, 'fly', wk, shk, clamp((b.vy || 0) / 2400, -0.22, 0.22));
    } else if (Math.abs(b.vx || 0) > 20) {
      // the WALK pose with a weighty gait: the body sinks onto each planted
      // side and every footfall kicks dust and a 1px shake
      const ph = b.anim * 7;
      const sN = Math.floor(ph / Math.PI);
      if (sN !== fc.step) {
        fc.step = sN;
        if (typeof cam !== 'undefined') cam.shake = Math.max(cam.shake, 1);
        if (typeof addPart === 'function')
          for (let i = 0; i < 3; i++)
            addPart(cx + (sN % 2 ? 26 : -20) * sgn + rnd(-6, 6), footY - 2,
              rnd(-40, 40), rnd(-70, -20), 0.3, '#c8925c', 2.5, 300, true);
      }
      c.translate(0, -Math.abs(Math.sin(ph)) * 3 + 1);
      drgWalkRig(c, ph, wk, shk, Math.sin(ph) * 0.035);
    } else {
      // stand: breathing, the core light swelling and settling
      c.translate(0, Math.sin(b.anim * 1.8) * 1.5);
      drgFig(c, 'idle', wk, shk, Math.sin(b.anim * 1.8) * 0.012);
    }

    // grounded overlays -----------------------------------------------------
    if (!heroPose && b.stagT <= 0 && b.st !== 'dorm' && b.st !== 'intro') {
      const mk2 = DRG_MOUTH[!grounded ? 'fly' : (Math.abs(b.vx || 0) > 20 ? 'walk' : 'idle')];
      // FIREBALL tell: heat climbs into the mouth as the lob comes due
      if (b.st === 'idle' && (b.t || 0) < 0.6 && !b.hymn && !b.slag)
        drgGlow(c, mk2[0], mk2[1], 10 + (1 - b.t / 0.6) * 12, 0.25 + (1 - b.t / 0.6) * 0.4, false);
      // late hymn peals flash the mouth even after he has resumed walking
      if (fc.pulseT > 0 && b.hymn)
        drgGlow(c, mk2[0], mk2[1], 16 + fc.pulseT * 60, 0.3 + fc.pulseT * 1.6, true);
      // chest core, always alive
      drgGlow(c, 12, -78, 14 + Math.sin(b.anim * 5) * 2.5 + wk * 10, 0.16 + wk * 0.3, false);
    }
    c.restore();
    return true;
  } catch (e) { c.restore(); return false; }
}

// the authored GLOW CORE as the summoned molten orb (forgebell reskin):
// falls, then hovers strobing until it bursts — timers and hitchecks are the
// AI's own, untouched
function drawFurnaceOrb(c, w, t) {
  const im = drgImg(); if (!im || !im.naturalWidth) return false;
  const s = DRG_P.core;
  const bob = w.landed ? Math.sin(t * 5 + w.x * 0.1) * 3 : 0;
  const urgent = w.landed && w.t < 1;
  const k = 1.15 + (urgent ? Math.sin(t * 22) * 0.12 : Math.sin(t * 6) * 0.05);
  c.save();
  c.translate(w.x, w.y + 8 + bob);
  drgGlow(c, 0, 0, 26 + (urgent ? Math.sin(t * 22) * 8 : 0), urgent ? 0.75 : 0.45, urgent);
  c.drawImage(im, s[0], s[1], s[2], s[3], -s[2] * k / 2, -s[3] * k / 2, s[2] * k, s[3] * k);
  c.restore();
  return true;
}
