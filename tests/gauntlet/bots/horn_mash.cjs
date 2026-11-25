// THE BRIEF'S MASH BOT: walk in, press attack. Reads nothing but where he stands (250 ms ago).
module.exports = { boss: 'horn', bot: `(bo, P, ctx) => { const s = ctx.seen; const dx = s.cx - (P.x + P.w/2); keys[dx > 0 ? 'ArrowRight' : 'ArrowLeft'] = Math.abs(dx) > 70 ? 1 : 0; if (Math.abs(dx) < 110) keysP.KeyX = 1; }` };
