// AGGRESSIVE SKILLED (fair react; began as the cheap-pattern hunter "mash-out"): stand in its face and swing every
// frame, and only leave for the two wind-ups that punish standing there — the greed spin and the coil.
module.exports = { boss: 'tally', bot: `(bo, P, ctx) => {
  const s = ctx.seen, pc = P.x + P.w / 2, dx = s.cx - pc, ad = Math.abs(dx), dir = Math.sign(dx) || 1;
  if (ctx.hold > 0) { ctx.hold--; keys.Space = 1; }
  const rings = (bo.rr || []); for (const r of rings) { const gap = Math.abs(pc - r.x) - r.r; if (gap > -6 && gap < 40 && P.on) { keysP.Space = 1; keys.Space = 1; ctx.hold = 9; } }
  for (const w of (bo.waves || [])) { const d = (pc - w.x) * w.dir; if (d > -4 && d < 52 && P.on) { keysP.Space = 1; keys.Space = 1; ctx.hold = 5; } }
  if (s.st === 'spinprep' || s.st === 'spin' || s.st === 'coil' || s.st === 'vaultcrouch') { keys[dir > 0 ? 'ArrowLeft' : 'ArrowRight'] = 1; if (P.on && ad < 70) { keysP.Space = 1; keys.Space = 1; ctx.hold = 12; } return; }
  if (ad > 60) keys[dir > 0 ? 'ArrowRight' : 'ArrowLeft'] = 1;
  if (ad < 75) keysP.KeyX = 1;
}` };
