// MASH (CHIME): walks under it, jumps and presses attack 12x a second. Never dodges.
// The only skill it has is the one the room demands: it jumps the drop shaft (cols 11-14).
const SHAFT = `const pc = P.x + P.w/2, goR = keys.ArrowRight, goL = keys.ArrowLeft;
  if (P.on && ((goR && pc > 300 && pc < 352) || (goL && pc < 530 && pc > 480))) { keysP.Space = 1; keys.Space = 1; ctx.shaftJ = 20; }
  if (ctx.shaftJ > 0) { ctx.shaftJ--; keys.Space = 1; if (goR || goL) {} else keys[ctx.lastDir || 'ArrowRight'] = 1; }
  if (pc > 340 && pc < 492 && !P.on) { keys.ArrowLeft = keys.ArrowRight = 0; keys[pc < 416 ? 'ArrowRight' : (ctx.lastDir || 'ArrowRight')] = 1; keys.Space = 1; }
  if (keys.ArrowRight) ctx.lastDir = 'ArrowRight'; else if (keys.ArrowLeft) ctx.lastDir = 'ArrowLeft';`;
module.exports = { boss: 'chime', SHAFT, bot: `(bo, P, ctx) => { const s = ctx.seen; const dx = s.cx - (P.x + P.w/2);
  keys[dx > 0 ? 'ArrowRight' : 'ArrowLeft'] = Math.abs(dx) > 30 ? 1 : 0;
  if (Math.abs(dx) < 120) { if (P.on && ctx.frame % 20 === 0) { keysP.Space = 1; } keys.Space = 1; if (ctx.frame % 5 === 0) { keysP.KeyX = 1; keys.KeyX = 1; } }
  ${SHAFT} }` };
