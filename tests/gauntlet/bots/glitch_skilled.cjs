// THE SKILLED PLAYER (fair: every decision about NULLFANG is made on ctx.seen, the lion as it was
// 250 ms ago; her own body and hazards in flight — G.projs, and the prototype's ground shocks
// window.__NFW — are read live, as allowed).
// Neutral: hold ~250 px off him (outside every paw), in his pounce band, and make him commit.
//   swipewarn/swipe in front -> back out of the paw; too close -> jump straight up
//   crouch -> pounce / nullhop / dive: be in the air when it lands, drifting away; cut the landing
//   roar -> stand off; jump any ground shock coming at her
//   behind him (rake), above him (rear): leave the box
//   openings (idle after a move, recover, daze, nullend, nullcharge, roar's inhale if close): close and cut,
//   then step back out to neutral after the window.
module.exports = { boss: 'glitch', bot: `(bo, P, ctx) => {
  const s = ctx.seen; if (!s) return;
  const pc = P.x + P.w / 2, d = s.cx - pc, ad = Math.abs(d), dir = d > 0 ? 1 : -1;
  const toward = dir > 0 ? 'ArrowRight' : 'ArrowLeft', away = dir > 0 ? 'ArrowLeft' : 'ArrowRight';
  const front = (Math.sign(-d) || 1) === (s.face || 1);
  const RW = G.roomDef.w * TILE, wallBehind = dir > 0 ? P.x < 70 : P.x + P.w > RW - 70, cornered = dir > 0 ? P.x < 200 : P.x + P.w > RW - 200;
  if (ctx.jt > 0) { ctx.jt--; keys.Space = 1; }
  const jump = () => { if (P.on) { keysP.Space = 1; keys.Space = 1; ctx.jt = 16; } };
  const cut = () => { if (ad < 72) { keys[away] = 1; return; } if (ad > 150) keys[toward] = 1; else if ((P.face || 1) !== dir) keys[toward] = 1; if (ad < 205 && (P.face || 1) === dir) keysP.KeyX = 1; };
  const hold = (lo, hi) => {
    // her back to the wall: do not back into it — go over him to the open side
    if (ctx.cross > 0 || (cornered && ad < hi + 20 && /idle|recover|stalk|run|daze|nullend/.test(s.st))) { ctx.cross = ctx.cross > 0 ? ctx.cross - 1 : 50; keys[ctx.crossDir || (ctx.crossDir = toward)] = 1; if (ad < 200 && P.on) jump(); if (ctx.cross <= 0) ctx.crossDir = null; return; }
    if (cornered && ad < lo) { if ((P.face||1) !== dir) keys[toward] = 1; if (ad < 205) keysP.KeyX = 1; return; }
    if (ad < lo) keys[away] = 1; else if (ad > hi) keys[toward] = 1; };
  // hazards in flight (read live): ground shocks and the boss's orbs
  for (const w of (window.__NFW || [])) { const dx = w.x - pc; if (Math.sign(dx) !== Math.sign(w.v) && Math.abs(dx) < 70) { jump(); } }
  for (const w of (bo.nfShocks || [])) { const dx = w.x - pc; if (Math.sign(dx) !== w.dir && Math.abs(dx) < 70) { jump(); } }
  for (const o of (bo.nfOrbs || [])) { const dx = o.x - pc; if (Math.abs(dx) < 90 && o.vy > 0) keys[dx > 0 ? 'ArrowLeft' : 'ArrowRight'] = 1; }
  for (const p of (G.projs || [])) { if (p.friendly || p.mine || p.byPlayer) continue; const dx = p.x - pc, dy = p.y - (P.y + P.h/2); if (Math.abs(dx) < 90 && dy < 40 && dy > -260 && p.vy > 0) { keys[dx > 0 ? 'ArrowLeft' : 'ArrowRight'] = 1; } }
  ctx.disc = ctx.disc || (bo.hideK != null && bo.hideK < 1 && (bo.turnedT || 0) > 0);
  const st = s.st; ctx.last = ctx.last || ''; if (st !== ctx.last) { ctx.enter = ctx.frame; ctx.prev = ctx.last; ctx.last = st; }
  const since = (ctx.frame - ctx.enter) / 60;
  if (st === 'pounce' || st === 'dive' || st === 'nullhop') { if (ad < 330 && P.on) jump(); keys[away] = 1; return; }
  if (st === 'perch') { if (s.t < 0.34 && ad < 220) { jump(); keys[away] = 1; return; } hold(150, 260); return; }
  if (st === 'spring' || st === 'springwarn') { hold(150, 260); return; }
  if (st === 'crouch') { if (!front && ad < 150 && !ctx.disc) { cut(); return; } hold(230, 300); return; }
  if (st === 'swipewarn' || st === 'swipe') {
    if (!front && ad < 150 && !ctx.disc) { cut(); return; }
    if (cornered) { keys[toward] = 1; if (ad < 200) jump(); return; }
    if (ad < 270 && P.on && since > 0.05) jump();
    keys[away] = 1; return;
  }
  if (st === 'rakewarn' || st === 'rake') { if (!front && ad < 160) { if (ad < 80) jump(); keys[away] = 1; } else cut(); return; }
  if (st === 'rearwarn' || st === 'rear') { keys[away] = 1; return; }
  if (st === 'bitewarn' || st === 'bite') { if (front && ad < 330) { jump(); keys[toward] = 1; } else if (!front && ad < 150) cut(); return; }
  if (st === 'bitestop') { cut(); return; }
  if (st === 'spitwarn') { hold(240, 400); return; }
  if (st === 'roar') { if (since < 0.25 && ad < 200 && !ctx.disc) { cut(); return; } hold(260, 420); return; }
  // openings: the move that just ended decides how long to stay
  const open = st === 'daze' || st === 'recover' || st === 'nullend' || st === 'bitestop' || (st === 'nullcharge' && !ctx.disc) || st === 'winded'
    || (st === 'idle' && /swipe|rake|rear|recover|pounce|spitwarn|nullend|daze/.test(ctx.prev) && since < 0.22);
  if (open) { cut(); return; }
  hold(240, 270); if (ad < 210 && !ctx.disc) keysP.KeyX = 1;
}` };
