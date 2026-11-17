// AN AGENT POSED FROM PARTS — one sheet of art, every move, and the motion between them.
//
// The owner, 2026-11-17: "Do you have the ability to animate those agents between those
// moves?... instead of generating the artwork for every single move. And this way we can
// make everything smoother... to minimize the amount of artwork needed."
//
// An agent was eight finished pictures and a filmed walk (AGENT_ART, sage-motion.js): a
// picture per move, and a hard cut from one to the next. This is the other way to draw
// the same body — the way GRAVEHORN is drawn. The art is ONE sheet of parts (hood and
// head, torso, robe skirt, upper arm, forearm and hand, lower leg and foot, the prop),
// cut and anchored by tools/agentparts.cjs. Everything after that is this file:
//
//   AGENT_RIG_UNITS  how big each part stands against the body (one skeleton, any agent)
//   AGENT_POSE       a move is a ROW OF NUMBERS — joint angles, how low the hips are,
//                    where the feet and the prop are — not a picture
//   the blend        the body is never switched to a pose: it is DRIVEN toward one by a
//                    spring on every number, so stand -> crouch -> leap -> spent is one
//                    continuous motion with its own follow-through, at any frame rate
//   the overlays     what no pose row can hold: the stride (by the floor it covers, like
//                    every walker), the breath, the robe swinging behind a moving body
//
// A new move is a new row. A new agent is a new sheet and no code at all.
//
// IT IS A PROOF, AND IT IS OFF. The fired plates stay the shipped drawing; `?rig=1` (or
// G.agentRig) draws the rig instead in a chamber whose AGENT_ART row names one, so the
// two can be judged side by side before anything is converted.
//
// Angles, all of them, are in the body's own terms so a row can be read: a LIMB hangs
// straight down at 0 and swings FORWARD (toward the way it faces) as the number grows;
// the SPINE, the head, a shin and the prop stand straight up at 0 and lean forward as it
// grows. Lengths are in body heights (1 = hood top to floor). The art faces LEFT.
const AGENT_RIG_UNITS = { head: 0.30, torso: 0.33, skirt: 0.50, uarm: 0.22, farm: 0.25, leg: 0.27, prop: 1.08 };
// the body's height against its box: what the standing plate is drawn at (the engine scales an agent
// by its own factor on top of this, exactly as it does the plates)
const AGENT_RIG_BODY = 1.12;
const AGENT_RIG_NECK = 0.72;        // how far up the torso (belt -> collar) the neck sits: inside the collar
const AGENT_RIG_KEYS = ['px', 'hp', 'air', 'sp', 'hd', 'aF', 'bF', 'aB', 'bB', 'f1x', 'f1y', 'k1', 'f2x', 'f2y', 'k2',
  'skA', 'skL', 'skW', 'stA', 'stH', 'stX', 'stY', 'stG', 'stP', 'stZ', 'tell', 'glowH', 'pure', 'wk'];
const AGENT_POSE_BASE = { px: 0, hp: 0.50, air: 0, sp: 0.03, hd: 0, aF: 0.15, bF: 0.6, aB: -0.05, bB: 0.12,
  f1x: -0.05, f1y: 0, k1: 0, f2x: 0.05, f2y: 0, k2: 0, skA: 0, skL: 0.49, skW: 1, stA: 0.04, stH: 1, stX: 0, stY: 0.5,
  stG: 0.45, stP: 1, stZ: 1, tell: 0, glowH: 0, pure: 0, wk: 0 };
// rate: how hard the body is driven to this pose (a strike snaps, a kneel settles)
const AGENT_POSE = {
  stand: { rate: 9 },
  walk: { rate: 11, wk: 1, sp: 0.07 },
  // coiled low, the prop drawn back level like a spear, one hand to the ground
  coil: { rate: 13, px: 0.04, hp: 0.27, sp: 0.85, hd: -0.55, aF: -2.08, bF: -1.87, aB: 0.1, bB: 0.2, f1x: -0.16, k1: 0.25, f2x: 0.14, k2: -0.2,
    skL: 0.26, skW: 1.5, stA: 1.45, stP: 0, tell: 1 },
  // the leap: off the floor, the prop driven forward, legs and robe trailing
  lunge: { rate: 24, px: -0.10, hp: 0.46, air: 0.14, sp: 0.45, hd: -0.3, aF: 1.5, bF: 0.15, aB: -1.3, bB: -0.3,
    f1x: 0.22, f1y: 0.12, k1: 0.9, f2x: 0.34, f2y: 0.2, k2: 1.1, skA: -0.35, skL: 0.5, skW: 1.1, stA: 1.3, stG: 0.5, stP: 0, tell: 1 },
  // gathering: upright, both palms out and lit, the prop slung behind
  gather: { rate: 10, sp: -0.06, hd: -0.05, aF: 0.6, bF: 0.35, aB: -0.55, bB: -0.3, skW: 1.05,
    stH: 0, stX: 0.13, stY: 0.62, stA: -0.22, stG: 0.5, stP: 0, stZ: 0, tell: 1, glowH: 1 },
  // spent: both hands on the planted prop, the head hung
  exhale: { rate: 7, hp: 0.44, sp: 0.42, hd: 0.5, aF: 0.25, bF: 1.0, aB: 0.35, bB: 0.95, f1x: -0.08, k1: 0.12, f2x: 0.1, k2: 0.1,
    skL: 0.43, skW: 1.08, stA: 0.1 },
  // bound: on its knees, palms together, the prop on the ground before it
  lock: { rate: 6, hp: 0.26, sp: 0.14, hd: 0.4, aF: 0.3, bF: 2.1, aB: 0.25, bB: 2.1, f1x: 0.06, f1y: 0.09, k1: 1.2, f2x: 0.12, f2y: 0.09, k2: 1.2,
    skL: 0.24, skW: 1.45, stH: 0, stX: -0.3, stY: 0.03, stA: 1.5, stG: 0.5, stP: 0, tell: 0.35 },
  // purified: the same kneel, upright, hands open on its thighs, the prop across its knees
  pure: { rate: 5, hp: 0.22, sp: 0, hd: 0, aF: 0.15, bF: 0.7, aB: 0.1, bB: 0.6, f1x: 0.06, f1y: 0.09, k1: 1.2, f2x: 0.12, f2y: 0.09, k2: 1.2,
    skL: 0.20, skW: 1.5, stH: 0, stX: -0.02, stY: 0.16, stA: 1.5, stG: 0.5, stP: 0, pure: 1 },
};
// which chamber's agent has a rig (its sheet's name under assets/characters/agents/)
const AGENT_RIG_ROOM = { GA1D: 'tally' };
const AGENT_RIG_PART_ORDER = ['head', 'torso', 'skirt', 'uarm', 'farm', 'leg', 'prop'];

// build.cjs hands the page every rig.json that is on disk (window.AGENT_RIGS); the plates
// are registered from it, so nothing here names a file that is not there
(function agentRigRegister() {
  const R = (typeof window !== 'undefined' && window.AGENT_RIGS) || {};
  if (typeof MEDIA_SRC === 'undefined') return;
  for (const name in R) for (const part in R[name].parts)
    MEDIA_SRC.images['agRig_' + name + '_' + part] = 'assets/characters/agents/' + name + '/rig/' + part + '.webp';
  try { if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('rig') === '1') window.AGENT_RIG_FLAG = 1; } catch (e) { /* no query string here */ }
})();
function agentRigName() {
  if (typeof isHero === 'function' && isHero()) return null;
  if (!((typeof G !== 'undefined' && G.agentRig) || (typeof window !== 'undefined' && window.AGENT_RIG_FLAG))) return null;
  const n = AGENT_RIG_ROOM[G.roomId];
  return n && typeof window !== 'undefined' && window.AGENT_RIGS && window.AGENT_RIGS[n] ? n : null;
}
// the move the fight is in — the same reading, in the same order, the plates use
function agentRigMove(e) {
  if (e.tame) return Math.abs(e.vx || 0) > 12 ? 'walk' : 'pure';
  if (e.locked) return 'lock';
  if ((e.kbT || 0) > 0 || (e.stagT || 0) > 0) return 'exhale';
  if ((e.lungeT || 0) > 0) return 'lunge';
  if ((e.coilT || 0) > 0 || (e.sageReplantT || 0) > 0) return 'coil';
  if ((e.gatherT || 0) > 0) return 'gather';
  if ((e.windedT || 0) > 0) return 'exhale';
  return Math.abs(e.vx || 0) > 12 ? 'walk' : 'stand';
}
function agentRigTarget(e, move) {
  const T = Object.assign({}, AGENT_POSE_BASE, AGENT_POSE[move] || AGENT_POSE.stand);
  if (e.tame) { T.pure = 1; T.tell = 0; T.glowH = 0; }
  return T;
}
// every number of the pose is on a spring, a little under-damped: it arrives, passes by a hair and settles
function agentRigStep(e, T, dt) {
  let S = e._rig;
  if (!S) { S = e._rig = { P: {}, V: {}, sway: 0, swayV: 0, at: e.anim || 0 }; for (const k of AGENT_RIG_KEYS) { S.P[k] = T[k]; S.V[k] = 0; } return S; }
  const w = T.rate || 9, zeta = 0.78;
  let left = dt;
  while (left > 1e-5) {                       // small steps: the spring must not blow up on a long frame
    const h = Math.min(left, 1 / 120); left -= h;
    for (const k of AGENT_RIG_KEYS) {
      const acc = (T[k] - S.P[k]) * w * w - S.V[k] * 2 * zeta * w;
      S.V[k] += acc * h; S.P[k] += S.V[k] * h;
    }
    // the robe trails a moving body and swings back when it stops
    const want = clamp(-(e._rigVx || 0) / 520, -0.5, 0.5);
    S.swayV += ((want - S.sway) * 90 - S.swayV * 9) * h; S.sway += S.swayV * h;
  }
  return S;
}
// one part, laid along its bone: plate anchor a0 on the joint, the line a0->a1 turned to `ang`
// (a canvas angle), drawn `unit` body-heights tall, stretched kl along the bone and kw across it.
// Returns where any other point of the plate lands, so the next part can hang off it.
function agentRigBone(c, im, Pt, a0, a1, jx, jy, ang, hPx, kl, kw, draw, alpha) {
  const s = hPx / Pt.h, w = Pt.w, h = Pt.h;
  const na = Math.atan2((a1[1] - a0[1]) * h, (a1[0] - a0[0]) * w);
  const ca = Math.cos(ang), sa = Math.sin(ang), cn = Math.cos(-na), sn = Math.sin(-na);
  if (draw && im) {
    c.save(); c.translate(jx, jy); c.rotate(ang); c.scale(kl || 1, kw || 1); c.rotate(-na); c.scale(s, s);
    if (alpha != null) c.globalAlpha *= alpha;
    c.drawImage(im, -a0[0] * w, -a0[1] * h, w, h); c.restore();
  }
  return (ax, ay) => {
    let x = (ax - a0[0]) * w * s, y = (ay - a0[1]) * h * s;
    let bx = x * cn - y * sn, by = x * sn + y * cn; bx *= (kl || 1); by *= (kw || 1);
    return [jx + bx * ca - by * sa, jy + bx * sa + by * ca];
  };
}
const AGENT_RIG_LIMB = (t) => Math.PI / 2 + t;        // from straight down, forward as it grows
const AGENT_RIG_UP = (t) => -Math.PI / 2 - t;         // from straight up, forward as it grows
// the plate of a part, and (while it is turning) its purified copy to lay over it
function agentRigPlate(name, part, pure) {
  const k = 'agRig_' + name + '_' + part;
  if (typeof mediaFetch === 'function') mediaFetch(k, pure > 0.01);
  const im = (typeof softArt === 'function' ? softArt(k) : MEDIA_IMG[k]) || MEDIA_IMG[k];
  let blue = null;
  if (pure > 0.01 && typeof sagePureWalkImage === 'function' && typeof MEDIA_RAW !== 'undefined' && MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth) blue = sagePureWalkImage(MEDIA_RAW[k], true);
  return { im: im && im.naturalWidth ? im : null, blue };
}
// THE TELL LIGHTS THE CLOTH, NOT THE AIR. The plates paint a wind-up as ember along the hem and
// the cuffs. A glow laid over the body would spill round it (NO LIGHT ROUND A BODY), so each
// hanging part has an EMBER copy — its own silhouette, clear at the top and amber toward the
// edge that hangs — and that is what is added over it. The light cannot leave the cloth.
const AGENT_RIG_EMBER = {};
function agentRigEmber(name, part) {
  const k = 'agRig_' + name + '_' + part, im = MEDIA_IMG[k];
  if (!im || !im.naturalWidth) return null;
  const hit = AGENT_RIG_EMBER[k]; if (hit && hit.src === im) return hit.cv;
  const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
  const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
  x.globalCompositeOperation = 'source-in';
  const g = x.createLinearGradient(0, 0, 0, cv.height);
  g.addColorStop(0, 'rgba(255,120,20,0)'); g.addColorStop(0.5, 'rgba(255,120,20,0.08)'); g.addColorStop(0.86, 'rgba(255,140,36,0.55)'); g.addColorStop(1, 'rgba(255,190,90,0.8)');
  x.fillStyle = g; x.fillRect(0, 0, cv.width, cv.height);
  AGENT_RIG_EMBER[k] = { src: im, cv };
  return cv;
}
function agentRigReady(name) {
  const R = window.AGENT_RIGS[name]; let ok = true;
  for (const part in R.parts) { const k = 'agRig_' + name + '_' + part; if (typeof mediaFetch === 'function') mediaFetch(k); const im = MEDIA_IMG[k]; if (!im || !im.naturalWidth) ok = false; }
  return ok;
}
// THE DRAW. Returns false (and the plates draw as they always did) until every part has landed.
function agentRigDraw(c, e) {
  const name = agentRigName(); if (!name) return false;
  if (!agentRigReady(name)) return false;
  const R = window.AGENT_RIGS[name].parts, U = AGENT_RIG_UNITS;
  const move = agentRigMove(e), T = agentRigTarget(e, move);
  const now = e.anim || 0, last = e._rig ? e._rig.at : now, dt = clamp(now - last, 0, 0.05);
  // which way it faces: toward her, except a thrown lunge keeps the way it was thrown (as the plates do)
  const cxw = e.x + e.w / 2, feet = e.y + e.h;
  let face = (typeof player !== 'undefined' && player && player.x + player.w / 2 < cxw) ? -1 : 1;
  if (typeof sageDuelActive === 'function' && sageDuelActive(e) && e.sageDuel) face = e.sageDuel.face || e.dir || face;
  if ((e.lungeT || 0) > 0 && Math.abs(e.vx || 0) > 1) face = e.vx > 0 ? 1 : -1;
  if (e.tame && Math.abs(e.vx || 0) > 12) face = e.vx > 0 ? 1 : -1;
  e._rigVx = (e.vx || 0) * -face;                       // speed along its own forward, for the robe
  const S = agentRigStep(e, T, (now - last > 0.25 || now < last) ? 0 : dt); S.at = now;
  if (now - last > 0.25 || now < last) { for (const k of AGENT_RIG_KEYS) { S.P[k] = T[k]; S.V[k] = 0; } }
  const P = Object.assign({}, S.P);
  const H = e.h * AGENT_RIG_BODY;
  // ---- what no pose holds: the stride, the breath ----
  const ph = ((e.walkD || 0) / 56) * Math.PI * 2, wk = clamp(P.wk, 0, 1), still = 1 - wk;
  const br = Math.sin(now * 2.2);
  P.f1x += 0.05 * Math.cos(ph) * wk; P.f1y += 0.025 * Math.max(0, Math.sin(ph)) * wk; P.k1 += 0.2 * Math.sin(ph) * wk;
  P.f2x += 0.05 * Math.cos(ph + Math.PI) * wk; P.f2y += 0.025 * Math.max(0, Math.sin(ph + Math.PI)) * wk; P.k2 += 0.2 * Math.sin(ph + Math.PI) * wk;
  P.hp += -0.012 * Math.abs(Math.sin(ph)) * wk + 0.004 * br * still * (1 - clamp(P.air * 6, 0, 1));
  P.aB += 0.24 * Math.sin(ph) * wk; P.bB += 0.1 * Math.max(0, Math.sin(ph)) * wk;
  P.aF += 0.07 * Math.sin(ph + Math.PI) * wk; P.stA += 0.06 * Math.sin(ph) * wk;
  P.sp += 0.012 * br * still; P.hd += 0.01 * Math.sin(now * 1.3) * still;
  const skA = P.skA + S.sway + 0.05 * Math.sin(ph * 2) * wk;

  const pure = clamp(P.pure, 0, 1);
  const plate = {}; for (const part of AGENT_RIG_PART_ORDER) plate[part] = agentRigPlate(name, part, pure);
  const tellNow = clamp(P.tell, 0, 1) * (1 - pure), flick = 0.82 + 0.18 * Math.sin(now * 23);
  const put = (part, a0, a1, jx, jy, ang, kl, kw, draw) => {
    const g = agentRigBone(c, plate[part].im, R[part], a0, a1, jx, jy, ang, U[part] * H, kl, kw, draw);
    if (draw && plate[part].blue && pure > 0.01) agentRigBone(c, plate[part].blue, R[part], a0, a1, jx, jy, ang, U[part] * H, kl, kw, true, pure);
    if (draw && tellNow > 0.02 && (part === 'skirt' || part === 'farm') && !(typeof G !== 'undefined' && G.rigNoGlow)) {
      const em = agentRigEmber(name, part);
      if (em) { c.save(); c.globalCompositeOperation = 'lighter'; agentRigBone(c, em, R[part], a0, a1, jx, jy, ang, U[part] * H, kl, kw, true, tellNow * flick); c.restore(); }
    }
    return g;
  };
  c.save();
  c.translate(cxw, feet); if (face > 0) c.scale(-1, 1);
  // ---- the skeleton, solved before anything is drawn (a part needs joints of parts drawn after it) ----
  const pel = [P.px * H, -(P.hp + P.air) * H];
  const tAng = AGENT_RIG_UP(P.sp);
  const torso = agentRigBone(c, null, R.torso, R.torso.bot, R.torso.top, pel[0], pel[1], tAng, U.torso * H);
  const neck = torso(lerp(R.torso.bot[0], R.torso.top[0], AGENT_RIG_NECK), 1 - AGENT_RIG_NECK);
  const shF = torso(R.torso.shF[0], R.torso.shF[1]), shB = torso(R.torso.shB[0], R.torso.shB[1]);
  const arm = (sh, a, b, draw) => {
    const aTop = [R.uarm.top[0], 0.04], fTop = [R.farm.top[0], 0.06];
    const ua = put('uarm', aTop, R.uarm.elbow, sh[0], sh[1], AGENT_RIG_LIMB(P.sp * 0.6 + a), 1, 1, false);
    const el = ua(R.uarm.elbow[0], R.uarm.elbow[1]);
    const fa = agentRigBone(c, null, R.farm, fTop, R.farm.hand, el[0], el[1], AGENT_RIG_LIMB(P.sp * 0.6 + a + b), U.farm * H);
    const hand = fa(R.farm.hand[0], R.farm.hand[1]);
    if (draw) {      // the sleeve first, the forearm over its end
      put('uarm', aTop, R.uarm.elbow, sh[0], sh[1], AGENT_RIG_LIMB(P.sp * 0.6 + a), 1, 1, true);
      put('farm', fTop, R.farm.hand, el[0], el[1], AGENT_RIG_LIMB(P.sp * 0.6 + a + b), 1, 1, true);
    }
    return hand;
  };
  const handF = arm(shF, P.aF, P.bF, false), handB = arm(shB, P.aB, P.bB, false);
  // the prop: in the front hand, or wherever the pose lays it; planted, its foot finds the floor
  const stLen = U.prop * H, stAng = AGENT_RIG_UP(P.stA);
  const sH = clamp(P.stH, 0, 1), gx = lerp(P.stX * H, handF[0], sH), gy = lerp(-P.stY * H, handF[1], sH);
  const gPlant = clamp(1 - (-gy) / Math.max(1, stLen * Math.cos(P.stA)), 0.2, 0.85);
  const g = lerp(P.stG, gPlant, clamp(P.stP, 0, 1));
  const drawProp = () => put('prop', [R.prop.top[0], g], [R.prop.top[0], 0], gx, gy, stAng, 1, 1, true);
  // ---- back to front ----
  arm(shB, P.aB, P.bB, true);
  if (P.stZ < 0.5) drawProp();
  const leg = (fx, fy, k) => put('leg', [R.leg.ankle[0], 1], [R.leg.top[0], 0], fx * H, -(fy + P.air) * H, AGENT_RIG_UP(k), 1, 1, true);
  leg(P.f2x, P.f2y, P.k2); leg(P.f1x, P.f1y, P.k1);
  // the robe: from the hips to the floor, however low the hips are — cloth folds, it does not hinge
  const skNat = U.skirt * H * Math.hypot((R.skirt.bot[0] - R.skirt.top[0]) * R.skirt.w, R.skirt.h) / R.skirt.h;
  put('skirt', R.skirt.top, R.skirt.bot, pel[0], pel[1] - 0.01 * H, AGENT_RIG_LIMB(skA), (P.skL * H) / skNat, P.skW, true);
  put('torso', R.torso.bot, R.torso.top, pel[0], pel[1], tAng, 1, 1, true);
  const head = put('head', R.head.bot, R.head.top, neck[0], neck[1], AGENT_RIG_UP(P.sp + P.hd), 1, 1, true);
  if (P.stZ >= 0.5) drawProp();
  arm(shF, P.aF, P.bF, true);
  // ---- the tell is LIGHT, and light is the engine's: the eyes, the palms, the prop's ring ----
  const tell = clamp(P.tell, 0, 1) * (1 - pure);
  const eyes = (R.head.eyes || []).map(q => head(q[0], q[1]));
  if (!e.tame && typeof infEyeMark === 'function') eyes.forEach((q, i) => { if (i < 2) infEyeMark(c, q[0], q[1]); });
  if (tell > 0.02 && !(typeof G !== 'undefined' && G.rigNoGlow)) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const glow = (x, y, r, a) => { const gr = c.createRadialGradient(x, y, 0.5, x, y, r); gr.addColorStop(0, 'rgba(255,236,190,' + a + ')'); gr.addColorStop(0.35, 'rgba(255,150,40,' + a * 0.7 + ')'); gr.addColorStop(1, 'rgba(255,90,10,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill(); };
    const fl = 0.85 + 0.15 * Math.sin(now * 23);
    eyes.forEach(q => glow(q[0], q[1], H * 0.03, 0.6 * tell * fl));
    const gh = clamp(P.glowH, 0, 1);
    if (gh > 0.02) { glow(handF[0], handF[1], H * 0.11, 0.8 * tell * gh * fl); glow(handB[0], handB[1], H * 0.11, 0.8 * tell * gh * fl); }
    else { const ring = [gx + (g - 0.08) * stLen * Math.sin(P.stA) * -1, gy - (g - 0.08) * stLen * Math.cos(P.stA)]; glow(ring[0], ring[1], H * 0.085, 0.7 * tell * fl); }
    c.restore();
  }
  c.restore();
  if (typeof G !== 'undefined') { const ht = head(R.head.top[0], 0); G.rigDrawn = { name, move, face, H: Math.round(H), hp: +P.hp.toFixed(3), sp: +P.sp.toFixed(3), tell: +tell.toFixed(2), pelvis: Math.round(-pel[1]), neck: Math.round(-neck[1]), top: Math.round(-ht[1]), handF: [Math.round(handF[0]), Math.round(-handF[1])] }; }
  return true;
}
