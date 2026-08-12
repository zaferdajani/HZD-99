// ===========================================================================
// GLACIERE, THE FROZEN PURIFIER — the corrupted unicorn of the void.
// Every pixel here is the owner's sheet: two full authored figures (the
// galloping hero pose for flight, the standing assembly for gathered
// moments), the parts row (which she SHATTERS INTO when she dies), and the
// authored effects — void lance, ice shards, nova crystals, void orbs.
// Nothing is guessed; the sheet is ground truth.
// ===========================================================================
const GLC_P = {
  hero: [6, 6, 610, 413],      // galloping flight pose (faces LEFT)
  head: [622, 6, 114, 129], neck: [742, 6, 63, 130], body: [811, 6, 192, 123],
  legF: [1009, 6, 68, 130], legH: [1083, 6, 71, 135], tail: [1160, 6, 136, 84],
  asm: [6, 425, 445, 294],     // standing assembly (faces LEFT)
  lance: [457, 425, 128, 43],
  shard1: [610, 427, 77, 36],  // one arrow from the authored fan
  novaCr: [693, 425, 85, 95],
  orb: [784, 425, 20, 25],
  // sub-rects of the HERO figure (sheet space) used for additive flow ghosts:
  // the void mane tendrils behind her head, and the crystal tail fan
  mane: [100, 10, 168, 162],
  tailW: [430, 230, 186, 155],
};
let GLC_PURE = false;             // drawGlaciere sets this from b.purified
let GLC_PURE_CV = undefined;
// purified sheet: the void purple leaves her — remapped to living ice
function glcPureAtlas(im) {
  if (GLC_PURE_CV !== undefined) return GLC_PURE_CV;
  // never cache before the sheet has decoded — a 0-size canvas is forever
  if (!im || !im.naturalWidth) return null;
  const cv = document.createElement('canvas');
  cv.width = im.naturalWidth; cv.height = im.naturalHeight;
  const x = cv.getContext('2d', { willReadFrequently: true });
  x.drawImage(im, 0, 0);
  let d;
  try { d = x.getImageData(0, 0, cv.width, cv.height); }
  catch (e) { return (GLC_PURE_CV = null); }
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], g = p[i + 1], b2 = p[i + 2];
    if (p[i + 3] > 60 && b2 > 120 && b2 - g > 40 && r - g > 5) {
      p[i] = Math.round(r * 0.45);
      p[i + 1] = Math.min(255, Math.round(b2 * 0.92));
      p[i + 2] = b2;
    }
  }
  x.putImageData(d, 0, 0);
  return (GLC_PURE_CV = cv);
}
function glcImg() {
  const im = typeof MEDIA_IMG !== 'undefined' ? ((typeof softArt === 'function' && softArt('glaciereParts')) || MEDIA_IMG.glaciereParts) : null;
  if (im && GLC_PURE) { const pv = glcPureAtlas(im); if (pv) return pv; }
  return im;
}

// draw one authored figure bottom-anchored in local space (art faces LEFT)
function glcFig(c, key, rot, shake, alpha) {
  const im = glcImg(); if (!im || !im.naturalWidth) return false;
  const s = GLC_P[key];
  c.save();
  if (alpha != null) c.globalAlpha *= alpha;
  if (shake) c.translate(rnd(-shake, shake), rnd(-shake, shake));
  if (rot) c.rotate(rot);
  c.drawImage(im, s[0], s[1], s[2], s[3], -s[2] / 2, -s[3], s[2], s[3]);
  c.restore();
  return true;
}

// the horn tip in hero-figure local space (art faces LEFT, bottom-anchored):
// measured off the sheet — the spiral horn ends near the top-left corner
function glcHornLocal() { return { x: -GLC_P.hero[2] * 0.44, y: -GLC_P.hero[3] * 0.94 }; }

// an additive ghost echo of a HERO-figure sub-rect, drawn at its authored
// position in hero-local space plus a phase offset — the classic way to sell
// the baked-in mane/tail motion without repainting a pixel of it
function glcGhost(c, r, dx, dy, alpha) {
  const im = glcImg(); if (!im || !im.naturalWidth) return;
  const h = GLC_P.hero;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha *= alpha;
  c.drawImage(im, r[0], r[1], r[2], r[3],
    r[0] - h[0] - h[2] / 2 + dx, r[1] - h[1] - h[3] + dy, r[2], r[3]);
  c.restore();
}

// ---------------------------------------------------------------------------
// THE AIR-GALLOP RIG — her legs are no longer frozen in the baked gallop.
// The hero figure keeps its head, mane, body, spine crystals and tail, but
// the baked legs are lifted out and the sheet's own two leg pieces (front
// and hind, each a full hip-ball/knee-ball/hoof limb) are hung back on
// nested pivots — near and far pairs — cycling on NULLFANG's rotary-gallop
// clock. Idle she paddles slowly on the hover; the dash is a full gallop.
// ---------------------------------------------------------------------------
const GLC_CACHE = {};
// per-piece skeleton, measured off the sheet: hip and knee ball centres
const GLC_LEG = {
  legF: { hip: [26, 24], knee: [52, 57] },
  legH: { hip: [33, 20], knee: [55, 55] },
};
// hip anchors in hero-local space (origin bottom-centre, art faces LEFT):
// [f near, h near, f far, h far], each [x, y, part, scale]
const GLC_HIPS = [
  [-145, -135, 'legF', 1.12], [40, -113, 'legH', 0.9],
  [-127, -138, 'legF', 1.05], [56, -116, 'legH', 0.84],
];
// cool-shadowed atlas for the far pair, so depth reads
function glcDark() {
  const slot = GLC_PURE ? 'darkPure' : 'dark';
  if (GLC_CACHE[slot]) return GLC_CACHE[slot];
  const im = glcImg(); if (!im || (!im.naturalWidth && !im.getContext)) return null;
  const cv = document.createElement('canvas');
  cv.width = im.naturalWidth; cv.height = im.naturalHeight;
  const x = cv.getContext('2d');
  x.drawImage(im, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = 'rgba(9,11,26,0.45)'; x.fillRect(0, 0, cv.width, cv.height);
  GLC_CACHE[slot] = cv;
  return cv;
}
// the hero figure with its baked legs erased — mane, belly lightning and the
// whole tail chain survive untouched; rig legs hang over the cut
function glcHeroCut() {
  const slot = GLC_PURE ? 'heroCutPure' : 'heroCut';
  if (GLC_CACHE[slot]) return GLC_CACHE[slot];
  const im = glcImg(); if (!im || (!im.naturalWidth && !im.getContext)) return null;
  const s = GLC_P.hero;
  const cv = document.createElement('canvas');
  cv.width = s[2]; cv.height = s[3];
  const x = cv.getContext('2d');
  x.drawImage(im, s[0], s[1], s[2], s[3], 0, 0, s[2], s[3]);
  x.globalCompositeOperation = 'destination-out';
  x.fillRect(122, 285, 128, 128);               // the front legs and both hoofs
  x.fillRect(326, 296, 106, 117);               // the hind leg under the tail
  GLC_CACHE[slot] = cv;
  return cv;
}
// one authored leg split at its knee ball — upper drives from the hip, the
// shank folds about the knee, overlapped 14 rows through the ball
function glcLegDraw(c, key, ax, ay, a1, a2, sc, dark) {
  const im = dark ? glcDark() : glcImg();
  if (!im || !(im.naturalWidth || im.width)) return;
  const s = GLC_P[key], L = GLC_LEG[key];
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
// the assembled hero with living legs. gait is the accumulated clock phase,
// k 0..1 scales paddle → full gallop, tuck 0..1 folds the legs up (the
// coiled dash tell). Falls back to the whole authored figure untouched.
function glcHeroRig(c, rot, shake, gait, k, tuck) {
  const cut = glcHeroCut();
  if (!cut) { glcFig(c, 'hero', rot, shake); return; }
  const s = GLC_P.hero;
  c.save();
  if (shake) c.translate(rnd(-shake, shake), rnd(-shake, shake));
  if (rot) c.rotate(rot);
  // NULLFANG's rotary-gallop timing: hind pair near-together, front pair
  // staggered off-beat — the off-beat is what reads as a living stride
  const PH = [0, 1.18 * Math.PI, 0.42 * Math.PI, 1.46 * Math.PI];
  const legs = PH.map(p => {
    const w = gait + p;
    let a1 = (Math.sin(w) + 0.22 * Math.sin(w * 2 + 0.6)) * (0.10 + 0.30 * k);
    let a2 = (Math.sin(w + 1.25) * 0.55 + Math.max(0, Math.sin(w + 2.1)) * 0.5) * (0.2 + 0.45 * k);
    if (tuck > 0) {                             // gathered: hoofs drawn up
      a1 += (-0.30 - a1) * tuck;
      a2 += (0.85 - a2) * tuck;
    }
    return { a1, a2 };
  });
  const far = [GLC_HIPS[2], GLC_HIPS[3]], near = [GLC_HIPS[0], GLC_HIPS[1]];
  glcLegDraw(c, far[0][2], far[0][0], far[0][1], legs[2].a1, legs[2].a2, far[0][3], true);
  glcLegDraw(c, far[1][2], far[1][0], far[1][1], legs[3].a1, legs[3].a2, far[1][3], true);
  c.drawImage(cut, -s[2] / 2, -s[3]);
  glcLegDraw(c, near[1][2], near[1][0], near[1][1], legs[1].a1, legs[1].a2, near[1][3], false);
  glcLegDraw(c, near[0][2], near[0][0], near[0][1], legs[0].a1, legs[0].a2, near[0][3], false);
  c.restore();
}

function drawGlaciere(c, b) {
  GLC_PURE = !!b.purified;
  const im = glcImg(); if (!im || (!im.naturalWidth && !im.getContext)) return false;
  c.save();
  try {
    const H = b.h * 1.9;                       // drawn height over the hitbox
    const S = H / GLC_P.hero[3];
    const cx = b.x + b.w / 2, footY = b.y + b.h;
    const fv = b.faceVis == null ? (b.face || 1) : b.faceVis;
    const sgn = fv < 0 ? 1 : -1;               // authored art faces LEFT
    const ta = Math.max(0.001, Math.abs(fv));
    // ---- the visual clock: every drama timer rides b.anim, so pausing the
    // game freezes her mid-beat and no gameplay number is ever touched ----
    const dtA = clamp(b.anim - (b.glcAnimP == null ? b.anim : b.glcAnimP), 0, 0.1);
    b.glcAnimP = b.anim;
    // visual velocity from position deltas — her idle glide moves by lerp, so
    // b.vx stays 0 and only the drawn position knows she is moving
    if (dtA > 0) {
      b.glcVX = clamp((cx - (b.glcPX == null ? cx : b.glcPX)) / dtA, -900, 900);
      b.glcVY = clamp((footY - (b.glcPY == null ? footY : b.glcPY)) / dtA, -900, 900);
      b.glcPX = cx; b.glcPY = footY;
    }
    const vxV = b.glcVX || 0, vyV = b.glcVY || 0;
    if (!b.dead) {
      // attack drama beats, armed the frame a state ends (seen from the draw
      // side — the update logic never learns these exist)
      if (b.glcPrevSt !== b.st) {
        if (b.glcPrevSt === 'lancewarn') b.glcRecoil = 1;  // the lance just left
        if (b.glcPrevSt === 'novawarn') b.glcStamp = 1;    // the ring released
        if (b.glcPrevSt === 'dash') b.glcSettle = 1;       // arrival overshoot
        b.glcPrevSt = b.st;
      }
      b.glcRecoil = Math.max(0, (b.glcRecoil || 0) - dtA * 2.8);
      b.glcStamp = Math.max(0, (b.glcStamp || 0) - dtA * 2.4);
      b.glcSettle = Math.max(0, (b.glcSettle || 0) - dtA * 2.0);
      // FROST PRESENCE: her passage rimes the air — sparse crystalline motes
      // hang near her, and her glide leaves a drift trail of tiny ice
      if (typeof addPart === 'function' && dtA > 0) {
        if (chance(0.12)) addPart(cx + rnd(-b.w * 0.9, b.w * 0.9), footY - rnd(4, H * 0.9),
          rnd(-10, 10), rnd(6, 22), rnd(0.5, 0.9), chance(0.5) ? '#bfe8ff' : '#e0f7fa', rnd(1, 2), 30, true);
        const spdV = Math.hypot(vxV, vyV);
        if (spdV > 60 && chance(clamp(spdV / 700, 0, 0.55)))
          addPart(cx - vxV * 0.06 + rnd(-8, 8), footY - H * 0.5 - vyV * 0.06 + rnd(-16, 16),
            -vxV * 0.12 + rnd(-14, 14), -vyV * 0.12 + rnd(-12, 12), rnd(0.3, 0.5), '#bfe8ff', 1.8, 0, true);
      }
    }
    c.translate(cx, footY);
    // THE TURN LAW, tier 3: no authored front exists, so the flex never
    // drops below 0.85, the pivot crouches into the hooves, and the update
    // side kicks dust on the crossing frame
    c.translate(0, (1 - ta) * 6);
    const sclX = sgn * (0.85 + 0.15 * ta) * S, sclY = (1 - (1 - ta) * 0.05) * S;
    c.scale(sclX, sclY);
    if (b.hurtT > 0) c.globalAlpha = 0.72;
    // dormant/wake clock: she KNEELS on the arena floor before the fight —
    // the standing assembly, dark and still — and RISES to hover height as
    // she wakes, the ignition timed to the roar
    const wakeK = b.st === 'intro' ? clamp(1 - (b.t || 0) / 2, 0, 1) : (b.st === 'dorm' ? 0 : 1);
    const rE = clamp((wakeK - 0.4) / 0.5, 0, 1);
    const riseK = b.st === 'dorm' ? 0 : (b.st === 'intro' ? rE * rE * (3 - 2 * rE) : 1);
    const groundOff = 90 * (1 - riseK);
    // hover shadow, faint — tight underfoot while she is grounded
    c.save(); c.globalAlpha *= 0.22; c.fillStyle = '#04070b';
    c.beginPath(); c.ellipse(0, 2 + groundOff, 200 * (0.55 + 0.45 * riseK), 16, 0, 0, 7); c.fill(); c.restore();
    if (b.dead && !b.purified) {
      // DEATH: she breaks into the sheet's own parts row — and the pieces
      // FALL: gravity takes them, each bounces once on the floor line, and
      // they settle where they lie with dying spin. Nothing drifts forever.
      b.glcDeathT = (b.glcDeathT || 0) + dtA;
      if (!b.glcShatter) {
        b.glcShatter = ['head', 'neck', 'body', 'legF', 'legH', 'tail'].map((pk, i) => ({
          pk,
          x: (i - 2.5) * 30, y: -220 + (i % 3) * 60,
          vx: (i - 2.5) * 95 + rnd(-40, 40), vy: rnd(-460, -160),
          rot: 0, vr: rnd(-3, 3), bounced: false, rest: false,
        }));
      }
      const fade = clamp(1 - (b.glcDeathT - 1.6) / 1.1, 0, 1);
      for (const sh of b.glcShatter) {
        const sp = GLC_P[sh.pk];
        const restY = -sp[3] * 0.34;           // lying on the floor line
        if (!sh.rest && dtA > 0) {
          sh.vy += 6200 * dtA;                 // local-space gravity
          sh.x += sh.vx * dtA; sh.y += sh.vy * dtA;
          sh.rot += sh.vr * dtA;
          if (sh.y >= restY && sh.vy > 0) {
            sh.y = restY;
            if (!sh.bounced) {
              sh.bounced = true;               // one bounce, frost kicked up
              sh.vy *= -0.36; sh.vx *= 0.5; sh.vr *= -0.45;
              if (typeof addPart === 'function') for (let d = 0; d < 3; d++)
                addPart(cx + sh.x * sclX, footY - 2, rnd(-70, 70), rnd(-60, -14),
                  0.35, '#cfe8f4', 2.2, 260, true);
            } else { sh.rest = true; sh.vy = 0; sh.vx = 0; }
          }
        } else if (sh.rest && dtA > 0) {
          sh.vr *= Math.pow(0.05, dtA);        // the spin dies where it lies
          sh.rot += sh.vr * dtA;
        }
        c.save();
        c.globalAlpha *= fade;
        c.translate(sh.x, sh.y);
        c.rotate(sh.rot);
        c.drawImage(im, sp[0], sp[1], sp[2], sp[3], -sp[2] / 2, -sp[3] / 2, sp[2], sp[3]);
        c.restore();
      }
      c.restore(); return true;
    }
    // FLIGHT LIFE: layered hover — a slow body swell under a faster
    // mane-frequency shimmer, and a bank rolled into her glide direction
    const bob = Math.sin(b.anim * 1.7) * 7 + Math.sin(b.anim * 4.6) * 2;
    const roll = clamp(vxV / 2600, -0.085, 0.085) * sgn;
    // the gait clock: her legs cycle faster the faster she actually moves —
    // a slow hover-paddle at rest, a full airborne gallop on the charge
    const spdG = Math.hypot(vxV, vyV);
    const gaitK = b.st === 'dash' ? 1 : clamp(spdG / 620, 0, 1);
    b.glcGait = (b.glcGait || 0) + dtA * (2.6 + gaitK * 7.2);
    const gait = b.glcGait;
    const pitch = clamp((b.vy || 0) / -1400, -0.16, 0.16) + Math.sin(b.anim * 1.1) * 0.022;
    c.translate(0, (-14 + bob) * riseK + groundOff);   // grounded → riding the air
    const swell = Math.sin(b.anim * 0.9);      // the slow body swell, breathing
    c.scale(1 + swell * 0.008, 1 - swell * 0.009);
    const heroFig = !(b.st === 'novawarn' || b.st === 'orbs' || b.st === 'azhush'
      || b.st === 'dorm' || (b.st === 'intro' && wakeK < 0.5)
      || ((b.glcStamp || 0) > 0 && b.st === 'idle'));
    if (b.st === 'dorm') {
      // ASLEEP ON HER HOOVES: head bowed, one ember alive in the horn.
      // Drawn a third over fight scale so the sleeping shape OWNS the room,
      // over a pool of ground frost that marks her cold
      const br2 = Math.sin(b.anim * 0.9) * 0.006;
      c.scale(1.32 * (1 + br2), 1.32 * (1 - br2));
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= 0.16 + Math.sin(b.anim * 0.7) * 0.05;
      const fg = c.createRadialGradient(0, 0, 8, 0, 0, 190);
      fg.addColorStop(0, 'rgba(165,216,255,0.8)'); fg.addColorStop(1, 'rgba(165,216,255,0)');
      c.fillStyle = fg; c.beginPath(); c.ellipse(0, 0, 190, 26, 0, 0, 7); c.fill();
      c.restore();
      glcFig(c, 'asm', 0.025, 0, 0.92);
      c.save(); c.globalCompositeOperation = 'lighter';
      const hg = c.createRadialGradient(-150, -240, 1, -150, -240, 16);
      hg.addColorStop(0, 'rgba(240,160,255,' + (0.16 + Math.max(0, Math.sin(b.anim * 0.9)) * 0.12) + ')');
      hg.addColorStop(1, 'rgba(120,30,200,0)');
      c.fillStyle = hg; c.beginPath(); c.arc(-150, -240, 16, 0, 7); c.fill();
      c.restore();
    } else if (b.st === 'intro') {
      if (wakeK < 0.5) {
        // the stir: the sleeping figure trembles harder as the cold gathers,
        // easing back down from the dormant scale as she braces to lift
        const sc2 = 1.32 - (wakeK / 0.5) * 0.32;
        c.scale(sc2, sc2);
        glcFig(c, 'asm', 0.025 - wakeK * 0.05, wakeK * 4.5);
        if (typeof addPart === 'function' && chance(wakeK * 0.7))
          addPart(cx + rnd(-b.w, b.w), footY + groundOff * sclY - rnd(0, 20),
            rnd(-20, 20), rnd(-60, -20), 0.5, '#bfe8ff', 2, 0, true);
      } else {
        // IGNITION: she is airborne in the hero figure, the horn flaring
        // with the shriek, frost blown off the lift
        glcFig(c, 'hero', -0.05, (1 - wakeK) * 3);
        const hp2 = glcHornLocal();
        const fl = Math.max(0, 1 - Math.abs(wakeK - 0.62) / 0.3);
        if (fl > 0.01) {
          c.save(); c.globalCompositeOperation = 'lighter';
          const g = c.createRadialGradient(hp2.x, hp2.y, 2, hp2.x, hp2.y, 30 + fl * 70);
          g.addColorStop(0, 'rgba(240,190,255,' + 0.85 * fl + ')');
          g.addColorStop(0.5, 'rgba(190,80,240,' + 0.5 * fl + ')');
          g.addColorStop(1, 'rgba(120,30,200,0)');
          c.fillStyle = g; c.beginPath(); c.arc(hp2.x, hp2.y, 30 + fl * 70, 0, 7); c.fill();
          c.restore();
        }
      }
    } else if (b.st === 'novawarn' || b.st === 'orbs' || b.st === 'azhush') {
      // gathered: the standing assembly, trembling as power collects
      glcFig(c, 'asm', 0, b.st === 'novawarn' ? 2 : 0.8);
    } else if ((b.glcStamp || 0) > 0 && b.st === 'idle') {
      // THE STAMP: the nova has just released — the standing figure drives
      // down into a squash beat and eases back to height
      const q = b.glcStamp * b.glcStamp;
      c.translate(0, 9 * q);
      c.scale(1 + 0.15 * q, 1 - 0.19 * q);
      glcFig(c, 'asm', 0, 0);
    } else if (b.st === 'dash') {
      // the charge: stretched into her own speed, nose into the line —
      // with a MOTION SMEAR of two fading authored copies hung along it
      for (let i = 2; i >= 1; i--) {
        c.save();
        c.translate(-(b.vx || 0) * 0.02 * i / sclX, -(b.vy || 0) * 0.02 * i / sclY);
        glcFig(c, 'hero', clamp((b.vy || 0) / 2200, -0.3, 0.3), 0, i === 1 ? 0.22 : 0.11);
        c.restore();
      }
      c.scale(1.07, 0.96);
      glcHeroRig(c, clamp((b.vy || 0) / 2200, -0.3, 0.3), 0, gait, 1, 0);
      // the tail crystals drag a wake of themselves through the line
      for (let i = 1; i <= 3; i++)
        glcGhost(c, GLC_P.tailW, i * 15 + Math.sin(b.anim * 9 - i * 1.1) * 5,
          Math.sin(b.anim * 7 - i * 1.4) * 6, 0.22 - i * 0.055);
    } else if (b.st === 'dashwarn') {
      // coiling, aimed — the tell: the legs GATHER UP under her as she loads
      const tk = clamp(1 - (b.t || 0) / 0.6, 0, 1);
      glcHeroRig(c, -0.06, 1.6, gait, 0, 0.4 + tk * 0.6);
    } else if (b.st === 'lancewarn' || b.st === 'shardwarn') {
      glcHeroRig(c, -0.03, 1.2, gait, 0.1, 0.35);
    } else {
      // LANCE RECOIL: the body is punched back a few px along the shot line
      // the instant the lance leaves, nose kicked up, settling as it decays
      const rq = (b.glcRecoil || 0) * (b.glcRecoil || 0);
      if (rq > 0.001) c.translate(rq * 26, 0);
      // DASH ARRIVAL: she overshoots the stop and springs back
      const st2 = b.glcSettle || 0;
      if (st2 > 0.001) {
        const w = Math.sin(st2 * 9) * st2 * st2;
        c.translate(w * -14, 0);
        c.scale(1 + w * 0.09, 1 - w * 0.07);
      }
      glcHeroRig(c, pitch + roll + rq * 0.07, 0, gait, gaitK, 0);
    }
    // VOID MANE FLOW: 2-3 additive ghost echoes of the authored tendrils,
    // offset on a phase wave — the baked mane appears to stream and coil
    if (heroFig) {
      const mph = b.anim * 3.2;
      for (let i = 1; i <= 3; i++)
        glcGhost(c, GLC_P.mane,
          i * 4 + Math.sin(mph - i * 0.8) * 4.5,
          Math.cos(mph - i * 1.1) * 3.5 - i * 1.5,
          0.15 - i * 0.033);
    }
    // horn charge glow: the lance tell builds at the horn tip
    if (b.st === 'lancewarn') {
      const hp2 = glcHornLocal();
      const k = clamp(1 - (b.t || 0) / 0.7, 0, 1);
      c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(hp2.x, hp2.y, 2, hp2.x, hp2.y, 26 + k * 40);
      g.addColorStop(0, 'rgba(240,160,255,' + (0.5 + k * 0.5) + ')');
      g.addColorStop(0.5, 'rgba(190,80,240,' + (0.3 + k * 0.35) + ')');
      g.addColorStop(1, 'rgba(120,30,200,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(hp2.x, hp2.y, 26 + k * 40, 0, 7); c.fill();
      c.restore();
    }
    if (b.st === 'shardwarn') {
      // ice gathers along the spine crystals — the shard tell
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha *= 0.35 + Math.sin(b.anim * 16) * 0.2;
      const g = c.createRadialGradient(30, -300, 8, 30, -300, 150);
      g.addColorStop(0, 'rgba(165,216,255,0.5)'); g.addColorStop(1, 'rgba(165,216,255,0)');
      c.fillStyle = g; c.beginPath(); c.arc(30, -300, 150, 0, 7); c.fill();
      c.restore();
    }
    c.restore();
    return true;
  } catch (e) { c.restore(); return false; }
}

// authored projectiles: the void lance and one shard from the sheet's fan
function drawGlcProj(c, pr) {
  const im = glcImg(); if (!im || !im.naturalWidth) return false;
  const s = pr.glcFx === 'lance' ? GLC_P.lance : GLC_P.shard1;
  const k = pr.glcFx === 'lance' ? 0.9 : 0.55;
  c.save();
  c.translate(pr.x, pr.y);
  c.rotate(Math.atan2(pr.vy, pr.vx));          // both sprites point RIGHT
  c.shadowColor = pr.glcFx === 'lance' ? '#d24bff' : '#a5d8ff'; c.shadowBlur = 12;
  c.drawImage(im, s[0], s[1], s[2], s[3], -s[2] * k * 0.5, -s[3] * k * 0.5, s[2] * k, s[3] * k);
  c.restore();
  return true;
}

// the authored void orb, pulsing — each one POPS in with a scale bounce
function drawGlcOrb(c, x, y, t, age) {
  const im = glcImg(); if (!im || !im.naturalWidth) return false;
  let pop = 1;
  if (age != null && age < 0.45) {
    // easeOutBack: swells past full size and snaps back — the pop
    const u = clamp(age / 0.45, 0, 1) - 1;
    pop = Math.max(0, 1 + 2.70158 * u * u * u + 1.70158 * u * u);
  }
  const s = GLC_P.orb, k = (1.5 + Math.sin(t * 6) * 0.18) * pop;
  c.save();
  if (age != null) c.globalAlpha *= clamp(age / 0.1, 0, 1);
  c.translate(x, y);
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(0, 0, 1, 0, 0, 22);
  g.addColorStop(0, 'rgba(220,120,255,0.5)'); g.addColorStop(1, 'rgba(150,40,220,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, 22, 0, 7); c.fill();
  c.restore();
  c.drawImage(im, s[0], s[1], s[2], s[3], -s[2] * k * 0.5, -s[3] * k * 0.5, s[2] * k, s[3] * k);
  c.restore();
  return true;
}

// the authored nova crystals, planted as an ice trail / nova burst piece
function drawGlcCrystal(c, x, y, sc, alpha) {
  const im = glcImg(); if (!im || !im.naturalWidth) return false;
  const s = GLC_P.novaCr;
  c.save();
  c.globalAlpha *= alpha == null ? 1 : alpha;
  c.translate(x, y);
  c.drawImage(im, s[0], s[1], s[2], s[3], -s[2] * sc * 0.5, -s[3] * sc, s[2] * sc, s[3] * sc);
  c.restore();
  return true;
}
