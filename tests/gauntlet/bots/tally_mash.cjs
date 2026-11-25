// MASH: walk in and press attack every frame it is in reach. No reading at all.
module.exports = { boss: 'tally', bot: `(bo, P) => { const dx = bo.cx() - (P.x + P.w/2); keys[dx > 0 ? 'ArrowRight' : 'ArrowLeft'] = Math.abs(dx) > 70 ? 1 : 0; if (Math.abs(dx) < 110) keysP.KeyX = 1; }` };
