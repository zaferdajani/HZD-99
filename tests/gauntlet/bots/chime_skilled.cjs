// SKILL (CHIME): decides on ctx.seen (the construct 250 ms ago) for where it is and what it is doing;
// reads the notes in flight live (projectiles may be read live). Each frame it looks 0.5 s ahead along
// six things she could do (stay/left/right, each with or without a jump) and keeps her intent (get
// under it, jump, strike) unless that path meets a note; then it takes the nearest safe one.
// Jumps the drop shaft (cols 11-14).
const { SHAFT } = require('./chime_mash.cjs');
module.exports = { boss: 'chime', bot: `(bo, P, ctx) => {
  const s = ctx.seen, st = s.st;
  const pc = P.x + P.w / 2, pcy = P.y + P.h / 2, d = s.cx - pc, adx = Math.abs(d);
  const sy = s.y + s.h / 2;   // its middle, 250 ms ago
  // INTENT: get under it (a little to the side so the body never lands on her), jump, strike
  let dir = 0, jump = false, swing = false;
  if (st === 'dorm' || st === 'intro') { dir = adx > 120 ? Math.sign(d) : 0; }
  else {
    if (adx > 40) dir = Math.sign(d);
    if (adx < 120 && P.on && sy < pcy - 20) jump = true;
    if (adx < 130 && Math.abs(sy - pcy) < 120) swing = true;
  }
  // THE TOLL (2026-11-27): it shivers before it drops on whoever is under it — step out from under it
  if ((st === 'tollwarn' || st === 'toll') && adx < 100) { dir = d > 0 ? -1 : 1; jump = false; swing = false; }
  // THE NOTES: simulate each option 0.5 s ahead
  const threats = G.projs.filter(q => !q.friendly && !q.dead);
  const G2 = 2100, JV = 920, floorY = P.y;
  const WX = G.roomDef.w * TILE - TILE - P.w - 2; const path = (dx, jp, t) => { const ta = Math.min(t, 0.08); let x = Math.max(TILE + 2, Math.min(WX, P.x + (P.vx + dx * 340) / 2 * ta + dx * 340 * (t - ta))), y;
    if (P.on && jp) y = P.y - (JV * t - 0.5 * G2 * t * t); else if (!P.on) y = P.y + P.vy * t + 0.5 * G2 * t * t; else y = P.y;
    if (y > (ctx.floor || P.y) && (!P.on || jp)) y = Math.min(y, ctx.floor || y); return { x, y }; };
  if (P.on) ctx.floor = P.y;
  const hits = (dx, jp) => { let worst = 9; for (let k = 0; k <= 15; k++) { const t = k / 30; const q0 = path(dx, jp, t);
      for (const q of threats) { const qx = q.x + q.vx * t, qy = q.y + q.vy * t + 0.5 * (q.grav || 0) * t * t, m = (q.r || 6) + 10;
        if (qx > q0.x - m && qx < q0.x + P.w + m && qy > q0.y - m && qy < q0.y + P.h + m) { worst = Math.min(worst, t); } } }
    // its body too: never be where it is (as last seen, carried on its drift)
    for (let k = 0; k <= 9; k++) { const t = k / 30, q0 = path(dx, jp, t), bx = s.x + s.vx * (t + 0.25), by = s.y + s.vy * (t + 0.25);
      if (q0.x < bx + s.w + 2 && q0.x + P.w > bx - 2 && q0.y < by + s.h + 2 && q0.y + P.h > by - 2) worst = Math.min(worst, t + 0.05); }
    return worst; };
  const want = hits(dir, jump);
  if (want < 9) {
    let best = null, bt = -1;
    for (const o of [[dir, false], [-dir || 1, false], [-(dir || 1) * -1, false], [0, false], [dir, true], [-dir || 1, true], [1, true], [-1, true], [1, false], [-1, false]]) {
      const t = hits(o[0], o[1]); if (t > bt) { bt = t; best = o; } }
    dir = best[0]; jump = best[1]; swing = false;
  }
  if (dir > 0) keys.ArrowRight = 1; else if (dir < 0) keys.ArrowLeft = 1;
  if (jump && P.on) keysP.Space = 1; if (jump || (!P.on && P.vy < 0 && sy < pcy - 40)) keys.Space = 1;
  if (swing && ctx.frame % 5 === 0) { if (sy < pcy - 50 && adx < 60) keys.ArrowUp = 1; else if (Math.sign(d) !== P.face) keys[d > 0 ? 'ArrowRight' : 'ArrowLeft'] = 1; keysP.KeyX = 1; keys.KeyX = 1; }
  { ${SHAFT} }
}` };
