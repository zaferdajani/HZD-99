// THE BACKSTAB (cheap pattern, fair: decisions on ctx.seen). His turn is a filmed 0.52 s pivot and
// his swipe only goes forward: get behind him (over his back when in front), cut his rump until he
// turns, go over again. Jumps whatever leaves the ground.
module.exports = { boss: 'glitch', bot: `(bo, P, ctx) => {
  const s = ctx.seen; if (!s) return;
  const pc = P.x + P.w / 2, d = s.cx - pc, ad = Math.abs(d), dir = d > 0 ? 1 : -1;
  const toward = dir > 0 ? 'ArrowRight' : 'ArrowLeft', away = dir > 0 ? 'ArrowLeft' : 'ArrowRight';
  const front = (Math.sign(-d) || 1) === (s.face || 1);
  if (ctx.jt > 0) { ctx.jt--; keys.Space = 1; }
  const jump = () => { if (P.on) { keysP.Space = 1; keys.Space = 1; ctx.jt = 18; } };
  const st = s.st;
  if (st === 'pounce' || st === 'dive' || st === 'nullhop' || (st === 'perch' && s.t < 0.32)) { if (ad < 320) jump(); keys[away] = 1; return; }
  if (ctx.over > 0) { ctx.over--; keys[ctx.overDir] = 1; return; }
  if (front) {   // go over him
    if (ad > 190) { keys[toward] = 1; return; }
    if (P.on) { jump(); ctx.over = 40; ctx.overDir = toward; keys[toward] = 1; }
    return;
  }
  if (ad < 70) { keys[away] = 1; return; }
  if (ad > 160) { keys[toward] = 1; return; }
  if ((P.face || 1) !== dir) { keys[toward] = 1; return; }
  keysP.KeyX = 1;
}` };
