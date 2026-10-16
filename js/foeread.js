// CLAWBYTE — EVERY MACHINE STANDS OFF ITS ROOM (owner, 2026-10-12).
//
//   "Check all the other enemies and bosses. You should always keep a
//    contrast between the background and the enemy."
//
// tests/contrast.cjs measured it before anything here existed: in the real
// frame, with the art warm, 55 of the 106 room × creature pairs lost more than
// half of their silhouette edge into the room behind them — a grey wolf on a
// grey-teal yard, a violet snare on a violet nest, a dark bat in a dark cave.
// The bodies are not badly drawn. The rooms are DARK (the ring round a body
// measures L* 13–46 in every kingdom) and most bodies sit only a few steps of
// lightness above them, in the room's own hue family.
//
// THE FIX IS A RIM, NOT NEW ART. Each body is outlined by a thin pale rim —
// the edge light a painter puts on a figure to lift it off a dark ground —
// drawn behind the body and only OUTSIDE its silhouette, so not one pixel of
// the authored creature changes. Its tint is chosen per kingdom, measured
// (tests/contrast.cjs prints the numbers):
//
//   - pale, because every backdrop is dark: the rim is L* 89–96 against rings
//     of L* 13–46, a luminance ratio of 4:1 or more against every kingdom's
//     ground colours (PAL far/mid/solid/dark);
//   - WARM where the kingdom is cool and NEUTRAL where it is warm, so it is
//     also a different colour from the room's own light (ΔE ≥ 36 from every
//     kingdom's glow and edge — D, the ice kingdom, is the tight one, and it
//     gets the warmest tint for that reason);
//   - never a reserved hue (docs/combat/GLOBAL_REGISTRY.md §2): ΔE ≥ 30 from
//     telegraph amber, danger red, lock cyan, purifier violet, frost, repair
//     mint, reward gold and parry lime — and nowhere near the Hue Law's
//     infected crimson or clean cyan. A rim must never be read as a tell, a
//     lock, a cure or a parry window; it is the same pale edge in every state.
//
// HOW IT IS DRAWN, and why it costs what it costs. The rim needs the body's
// silhouette, which only the body's own draw knows. So the body is drawn a
// second time — ALONE, onto a scratch canvas the size of its neighbourhood,
// under the same transform — as anatomy only:
//   - G.artProbe is raised for that pass, so every telegraph wash, ground
//     ring, beam and pool is left out (they are decoration; a rimmed telegraph
//     would be a second telegraph). FOE_READ.sil marks the pass so the few
//     things the probe ALSO switches off that are pose, not decoration — the
//     guardians' lean — stay on and the rim fits the body that is drawn.
//   - the scratch context ignores shadowBlur (tests/glowcost.cjs counts every
//     blurred draw, and a silhouette has no use for a glow);
//   - no particle, no sound, no infection eye and no contact shadow is laid
//     by it (addPart, sfx, infEyeMark and contactShadow check FOE_READ.sil) —
//     the pass is a stencil, not a second creature.
// The silhouette's alpha is cubed (two destination-in blits) so soft glows
// drop out of it, dilated by the rim's width (eight offset blits), the body
// itself cut back out, and what is left is tinted and laid behind the real
// draw. About fourteen blits of a body-sized rectangle, no blur, no allocation
// after the first frame.
//
// G.artProbe on the way IN switches the rim off entirely: tests/artbible.cjs
// measures anatomy, feet and amber, and a rim is none of those.
//
// Only CLAWBYTE's machine world is rimmed. NOSTOS draws its own creatures and
// has not been measured by tests/contrast.cjs; a change it was not measured
// against is not one this file makes for it.
const FOE_READ = { on: true, sil: false, alpha: 0.62, width: 1.5, q: 1, feather: 1.8 };
const FOE_RIM = Object.freeze({
  A: '#ffe6d6',   // teal yard → warm peach-white       (ΔE 59 to its glow/edge)
  B: '#fff0dc',   // blue conduits → ivory              (ΔE 61)
  C: '#fff0f0',   // orange foundry → neutral white     (ΔE 64; ivory sat 35 from its gold acc)
  D: '#ffd9c4',   // ice archives → warmest peach       (ΔE 36; a near-white would be 20)
  E: '#fff0dc',   // violet nest → ivory                (ΔE 106)
  X: '#fff0dc',   // pink rift → ivory                  (ΔE 72)
});
const FOE_RIM_DEFAULT = '#fff0dc';

let FR_S = null, FR_T = null, FR_R = null;          // silhouette, threshold, rim
function frCanvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  return cv;
}
function frEnsure(w, h) {
  if (!FR_S) {
    FR_S = frCanvas(w, h); FR_T = frCanvas(w, h); FR_R = frCanvas(w, h);
    // the stencil has no use for a glow, and a blurred draw is the most
    // expensive thing a 2D context does: this context simply cannot blur
    const sx = FR_S.getContext('2d');
    try { Object.defineProperty(sx, 'shadowBlur', { get() { return 0; }, set() {} }); } catch (e) { /* draws blurred; still correct */ }
    return;
  }
  // grow only: a body-sized rectangle, reused for every body every frame
  if (FR_S.width < w || FR_S.height < h) {
    const W = Math.max(FR_S.width, w), H = Math.max(FR_S.height, h);
    for (const cv of [FR_S, FR_T, FR_R]) { cv.width = W; cv.height = H; }
  }
}

// is this body rimmed? (the rest are drawn exactly as they always were)
function foeReadOn(e) {
  if (!FOE_READ.on || !e || e.dead) return false;
  // a bound or freed body is not a threat to find in the room: no rim
  if (e.disabled || e.rescued) return false;
  if (typeof G === 'undefined' || G.artProbe || !G.roomDef) return false;
  if (typeof isHero === 'function' && isHero()) return false;
  return true;
}
function foeRimCol(zone) { return FOE_RIM[zone] || FOE_RIM_DEFAULT; }

// THE ONE CALL SITE: drawWorldFrame draws every enemy and the guardian through
// this, in place of e.draw(c).
// A BOUND MACHINE IS DOWN, NOT STANDING (owner, 2026-10-16). The wolves and
// cheetahs lie down through their own plates (wolves.js, the 'down' pose);
// every other bound body — the guard, the fliers, the bat — is slumped over
// onto the floor here, pivoted on its feet so it rests where it fell.
function foeDrawDown(c, e) {
  if (!e.disabled || (typeof isWolf === 'function' && isWolf(e))
      || (typeof isCheetah === 'function' && isCheetah(e))) { e.draw(c); return; }
  const fx = e.x + e.w / 2, fy = e.y + e.h, dir = e.dir || 1;
  c.save();
  c.translate(fx, fy); c.rotate(dir * 0.32); c.scale(1.08, 0.66); c.translate(-fx, -fy);
  e.draw(c);
  c.restore();
}
function foeDraw(c, e) {
  if (e && e.disabled) { foeDrawDown(c, e); return; }
  if (!foeReadOn(e)) { c.save(); if (e && e.purified && !isHero() && ['glitch','brood','atlas','zero','prism'].includes(e.kind)) c.filter = 'sepia(1) saturate(1.8) brightness(1.08)'; e.draw(c); c.restore(); return; }
  const m = c.getTransform();
  const cvW = c.canvas.width, cvH = c.canvas.height;
  // the body's neighbourhood in WORLD units — generous above (a guardian's
  // art stands well over its hitbox) and a little below (feet, tails)
  const padX = Math.max(e.w * 1.3, 64), top = Math.max(e.h * 1.9, 90), bot = 28;
  const wx0 = e.x - padX, wx1 = e.x + e.w + padX, wy0 = e.y - top, wy1 = e.y + e.h + bot;
  // ...in device pixels (the world transform is a scale and a translate)
  const ax = m.a * wx0 + m.c * wy0 + m.e, bx = m.a * wx1 + m.c * wy1 + m.e;
  const ay = m.b * wx0 + m.d * wy0 + m.f, by = m.b * wx1 + m.d * wy1 + m.f;
  const ox = Math.max(0, Math.floor(Math.min(ax, bx))), oy = Math.max(0, Math.floor(Math.min(ay, by)));
  const W = Math.min(cvW, Math.ceil(Math.max(ax, bx))) - ox, H = Math.min(cvH, Math.ceil(Math.max(ay, by))) - oy;
  if (W < 4 || H < 4) { e.draw(c); return; }          // off screen: nothing to lift
  // THE STENCIL RUNS AT FULL SIZE. FOE_READ.q can shrink it (every blit then
  // touches q² of the pixels), and at 0.5 it was tried and measured: the rim
  // came back up soft, its solid core under one device pixel, and 70 of 106
  // bodies sank back into their rooms. A rim is an edge; it has to be crisp.
  const q = FOE_READ.q;
  const w = Math.max(2, Math.ceil(W * q)), h = Math.max(2, Math.ceil(H * q));
  frEnsure(w, h);
  const S = FR_S.getContext('2d'), T = FR_T.getContext('2d'), R = FR_R.getContext('2d');
  // 1. the stencil: the body alone, anatomy only (see the header)
  S.setTransform(1, 0, 0, 1, 0, 0); S.globalAlpha = 1; S.globalCompositeOperation = 'source-over';
  S.clearRect(0, 0, w, h);
  S.setTransform(m.a * q, m.b * q, m.c * q, m.d * q, (m.e - ox) * q, (m.f - oy) * q);
  const keepProbe = G.artProbe;
  const keepEye = typeof INF_S2W !== 'undefined' ? INF_S2W : null;
  G.artProbe = true; FOE_READ.sil = true;
  if (typeof INF_S2W !== 'undefined') INF_S2W = null;
  try { e.draw(S); } catch (er) { /* a stencil that fails draws no rim */ }
  finally {
    G.artProbe = keepProbe; FOE_READ.sil = false;
    if (typeof INF_S2W !== 'undefined') INF_S2W = keepEye;
    S.setTransform(1, 0, 0, 1, 0, 0);
  }
  // 2. threshold: alpha cubed, so a soft glow or a faint wash drops out and a
  //    solid body stays solid
  T.setTransform(1, 0, 0, 1, 0, 0);
  T.globalCompositeOperation = 'copy'; T.drawImage(FR_S, 0, 0, w, h, 0, 0, w, h);
  T.globalCompositeOperation = 'destination-in'; T.drawImage(FR_S, 0, 0, w, h, 0, 0, w, h);
  T.drawImage(FR_S, 0, 0, w, h, 0, 0, w, h);
  T.globalCompositeOperation = 'source-over';
  // 3. dilate by the rim's width, cut the body back out, tint what is left
  const sc = Math.hypot(m.a, m.b) || 1;
  const r = Math.max(1, Math.max(2, Math.round(FOE_READ.width * sc)) * q), d = r * 0.7071;
  R.setTransform(1, 0, 0, 1, 0, 0); R.globalCompositeOperation = 'source-over';
  R.clearRect(0, 0, w, h);
  // AN EDGE LIGHT, NOT A FRAME (owner, 2026-10-16: the wolf "is framed by a
  // white frame, which is weird"). One crisp ring at a single alpha is a
  // keyline — a sticker's cut edge. Two rings, the outer one fainter, make the
  // light fall off away from the body the way light off a surface does.
  const ring = (rr, a) => {
    const dd = rr * 0.7071;
    R.globalAlpha = a;
    R.drawImage(FR_T, 0, 0, w, h, rr, 0, w, h); R.drawImage(FR_T, 0, 0, w, h, -rr, 0, w, h);
    R.drawImage(FR_T, 0, 0, w, h, 0, rr, w, h); R.drawImage(FR_T, 0, 0, w, h, 0, -rr, w, h);
    R.drawImage(FR_T, 0, 0, w, h, dd, dd, w, h); R.drawImage(FR_T, 0, 0, w, h, -dd, dd, w, h);
    R.drawImage(FR_T, 0, 0, w, h, dd, -dd, w, h); R.drawImage(FR_T, 0, 0, w, h, -dd, -dd, w, h);
  };
  ring(r * FOE_READ.feather, 0.35);
  ring(r, 1);
  R.globalAlpha = 1;
  R.globalCompositeOperation = 'destination-out'; R.drawImage(FR_T, 0, 0, w, h, 0, 0, w, h);
  R.globalCompositeOperation = 'source-in';
  R.fillStyle = foeRimCol(G.roomDef.zone); R.fillRect(0, 0, w, h);
  R.globalCompositeOperation = 'source-over';
  // 4. the rim behind, then the body exactly as it has always been drawn
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = FOE_READ.alpha;
  c.imageSmoothingEnabled = true;
  c.drawImage(FR_R, 0, 0, w, h, ox, oy, w / q, h / q);
  c.restore();
  e.draw(c);
  // Reuse the anatomy stencil, not a white rectangle or brightness filter.
  // This covers every drawn enemy/guardian without changing sprite pixels,
  // eye anchors, collision or the telegraph layers excluded from the stencil.
  if ((e.impactUntil || 0) > performance.now() && !e.rescued && !e.tame && e.st !== 'purified') {
    T.globalCompositeOperation = 'source-in'; T.fillStyle = '#ffffff'; T.fillRect(0, 0, w, h);
    T.globalCompositeOperation = 'source-over';
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 0.92;
    c.drawImage(FR_T, 0, 0, w, h, ox, oy, w / q, h / q); c.restore();
  }
}
