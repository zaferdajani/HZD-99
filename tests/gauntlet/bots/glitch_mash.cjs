// THE MASH BOT: walks at it and presses attack. Reads the boss LIVE (it never dodges, so lag is moot).
module.exports = { boss: 'glitch', bot: `(bo, P) => { const dx = bo.cx() - (P.x + P.w/2); keys[dx > 0 ? 'ArrowRight' : 'ArrowLeft'] = Math.abs(dx) > 70 ? 1 : 0; if (Math.abs(dx) < 110) keysP.KeyX = 1; }` };
