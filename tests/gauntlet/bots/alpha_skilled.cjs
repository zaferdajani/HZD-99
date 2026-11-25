// SKILL (ALPHA): a strong player. Decides on ctx.seen only (the king 250 ms ago); reads her own body,
// the rend waves in flight (bo.rends) and the quake mark painted on the floor (bo.quakeX) live, and
// the betas live. Hits ONLY in the openings (rest/idle/turn/recoil), at most 3 blows an opening
// (2 in fury) so the spring never triggers; gets out of every blow; jumps the rend; kills betas.
module.exports = { boss: 'alpha', bot: `(bo, P, ctx) => {
  const s = ctx.seen, st = s.st, est = (s.t || 0) - 0.25;
  const pc = P.x + P.w / 2, ecx = s.cx + (s.on !== false && !/leap|spring|recoil/.test(st) ? s.vx * 0.25 : 0), d = ecx - pc, adx = Math.abs(d);
  const W = G.roomDef.w * TILE;
  const away = d > 0 ? 'ArrowLeft' : 'ArrowRight', toward = d > 0 ? 'ArrowRight' : 'ArrowLeft';
  const wallBehind = d > 0 ? pc < 120 : pc > W - 120, roomBehind = d > 0 ? pc : W - pc;
  const fury = !!bo.fury;
  const OPEN = st === 'rest' || st === 'idle' || st === 'turn' || st === 'recoil';
  let jump = false, swing = false, mv = 0;   // mv: -1 away, +1 toward
  // a new opening: reset my blow count
  // blows that LANDED this opening (the health bar is on screen)
  if (ctx.hp != null && bo.hp < ctx.hp) ctx.n = (ctx.n || 0) + 1; ctx.hp = bo.hp;
  if (OPEN && !ctx.wasOpen) ctx.n = 0; ctx.wasOpen = OPEN; if (st !== 'coil' && st !== 'leap') ctx.plan = null;
  if (ctx.lastHits == null) ctx.lastHits = 0;
  const cap = fury ? 2 : 3;
  // rend waves in flight: jump when one is about to arrive
  for (const w of (bo.rends || [])) { const q = (pc - w.x) * w.dir; if (q > -10 && q < 110 && P.on) jump = true; }
  // CORNERED: in an opening with little floor behind her, she vaults it to the open side
  if (ctx.vault > 0) { ctx.vault--; keys[ctx.vdir] = 1; keys.Space = 1; return; }
  if (OPEN && roomBehind < 200 && adx < 140 && est > 0.3 && P.on) { ctx.vault = 40; ctx.vdir = toward; keysP.Space = 1; keys.Space = 1; keys[toward] = 1; return; }
  if (OPEN) {
    if ((ctx.n || 0) < cap) { if (adx > 125) mv = 1; else if (adx < 100) mv = -1; if (adx < 140 && (st !== 'rest' && st !== 'idle' || est > 0.1)) { swing = true; if (Math.sign(d) !== P.face && mv !== -1) mv = 1; } }
    else { if (adx < 150) mv = -1; }
  } else if (st === 'clawwarn' || st === 'claw' || st === 'bitewarn' || st === 'bite') {
    if (adx < 180) { if (wallBehind) { mv = 1; jump = true; } else mv = -1; }
  } else if (st === 'coil' || st === 'leap') {
    // ONE plan per pounce, made when the coil is seen: inside its reach, jump OVER it at once
    // (she is at her apex as it leaves); outside its reach, hold ground
    if (st === 'coil' && ctx.plan == null) ctx.plan = adx > 290 ? 'hold' : roomBehind > 300 ? 'run' : 'over';
    if (ctx.plan === 'run') { if (adx < 330) mv = -1; }
    else if (ctx.plan === 'over') { mv = 1; if (P.on && st === 'coil') jump = true; if (!P.on) jump = true; }
    else if (adx < 300) mv = -1;
    if (fury && bo.quakeX != null && Math.abs(bo.quakeX - pc) < 170 && st === 'leap') jump = true;
  } else if (st === 'rendwarn' || st === 'rend') {
    const inFront = (Math.sign(pc - s.cx) || 1) === (s.face || -1);
    if (adx < 100) mv = -1;
    if (inFront && adx < 380 && st === 'rendwarn') { const arrive = est + 0.1 + Math.max(0, adx - 62) / 440; if (arrive < 0.12) jump = true; }
  } else if (st === 'roarwarn' || st === 'roar' || st === 'furywarn' || st === 'fury') {
    if (adx < 285) { if (wallBehind) { mv = 1; jump = true; } else mv = -1; } else if (adx > 330) mv = 1;
  } else if (st === 'skywarn' || st === 'sky') {
    if (adx < 110) mv = -1;
  } else if (st === 'dorm' || st === 'intro') {
    if (adx > 230) mv = 1;
  } else if (st === 'spring') {
  } else {
    // broodcall / howl: hide is up — keep a distance and deal with the pack
    if (adx < 120) mv = -1;
  }
  if (adx < 95 && mv === 0) mv = -1;   // never stand in its body
  // never hang over its back
  // in the air near its body: carry on across, never reverse over its back
  if (!P.on && adx < 120 && Math.abs(P.vx) > 40 && st !== 'coil' && st !== 'leap') { mv = 0; keys[P.vx > 0 ? 'ArrowRight' : 'ArrowLeft'] = 1; }
  // a beta in reach is dealt with first unless the king is the nearer danger
  const danger = (!OPEN && adx < 200) || st === 'coil' || st === 'leap' || (bo.rends && bo.rends.length);
  let wolf = null, wd = 130; for (const e of G.enemies) { if (e === bo || e.dead || e.disabled || e.rescued) continue; const q = Math.abs(e.x + e.w / 2 - pc); if (q < wd && Math.abs(e.y - P.y) < 70) { wd = q; wolf = e; } }
  if (wolf && !danger && !(OPEN && (ctx.n || 0) < cap && adx < 120)) { const wdx = wolf.x + wolf.w / 2 - pc; mv = 0; keys[wdx > 0 ? 'ArrowRight' : 'ArrowLeft'] = (Math.abs(wdx) > 40 || Math.sign(wdx) !== P.face) ? 1 : 0; if (ctx.frame % 5 === 0) { keysP.KeyX = 1; keys.KeyX = 1; } }
  if (mv === 1) keys[toward] = 1; else if (mv === -1) keys[away] = 1;
  // something in the way (a beta's body, a step): hop it
  const one = !!keys.ArrowLeft !== !!keys.ArrowRight, busy = P.swing && P.swing.t > 0;
  if (one && !busy && P.on && Math.abs(P.vx) < 30 && ctx.pushing > 6) jump = true;
  ctx.pushing = one && !busy && Math.abs(P.vx) < 30 ? (ctx.pushing || 0) + 1 : 0;
  if (swing && ctx.frame % 5 === 0) { keysP.KeyX = 1; keys.KeyX = 1; }
  if (jump && P.on) keysP.Space = 1; if (jump || (!P.on && P.vy < 0)) keys.Space = 1;
}` };
