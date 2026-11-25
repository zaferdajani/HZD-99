// THE POKE (cheap pattern, fair: decisions on ctx.seen). NULLFANG's hurt box is 2.6x its collider
// (types.js hurtBoxOf: 218 px wide) and her blade reaches 86+ px past her body, so she lands blows
// from 207 px (claws) / 230 px (Purifier) centre to centre — while his swipe reaches 114 px and only
// fires inside 130. She holds 140-200 px off his nose-side, backs off when he steps in, cuts always,
// and jumps whatever leaves the ground.
module.exports = { boss: 'glitch', bot: `(bo, P, ctx) => {
  const s = ctx.seen; if (!s) return;
  const pc = P.x + P.w / 2, d = s.cx - pc, ad = Math.abs(d), dir = d > 0 ? 1 : -1;
  const toward = dir > 0 ? 'ArrowRight' : 'ArrowLeft', away = dir > 0 ? 'ArrowLeft' : 'ArrowRight';
  if (ctx.jt > 0) { ctx.jt--; keys.Space = 1; }
  const jump = () => { if (P.on) { keysP.Space = 1; keys.Space = 1; ctx.jt = 18; } };
  const W = G.roomDef.w * TILE, wallBehind = dir > 0 ? P.x < 60 : P.x + P.w > W - 60;
  const st = s.st;
  if (st === 'pounce' || st === 'dive' || st === 'nullhop' || (st === 'perch' && s.t < 0.32)) { if (ad < 320) jump(); keys[away] = 1; if (ad < 240) keysP.KeyX = 1; return; }
  if (wallBehind && ad < 150 && (st === 'swipewarn' || st === 'idle' || st === 'stalk')) { jump(); keys[toward] = 1; return; }   // cornered: over him
  const lo = 145, hi = 196;
  if (ad < lo) keys[away] = 1; else if (ad > hi) keys[toward] = 1;
  else if ((P.face || 1) !== dir) { keys[toward] = 1; }
  if (ad < 225) keysP.KeyX = 1;
}` };
