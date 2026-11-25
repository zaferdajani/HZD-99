// SKILLED v2 (fair, react 250 ms) — the player who has learned the PROPOSED duel (and plays the current one too).
// Decides on the agent only through ctx.seen (its pose 250 ms ago); reads her own body and the hazards
// already in flight live (rings, beads, floor marks, ground waves: e.rr / e.beads / e.marks / e.waves,
// and the current fight's bo.ringR). Discipline: at most two blows per opening, then step out;
// never pokes the armoured body; never jumps over it outside an opening.
module.exports = { boss: 'tally', bot: `(bo, P, ctx) => {
  const s = ctx.seen, st = s.st, pc = P.x + P.w / 2, pb = P.y + P.h, dx = s.cx - pc, ad = Math.abs(dx), dir = Math.sign(dx) || 1;
  const L = 'ArrowLeft', R = 'ArrowRight';
  let avoidZ = [];
  // never walk INTO a marked floor or a bead's landing: a mark is a wall until it has burnt
  const go = d => { if ((d < 0 && pc < 70) || (d > 0 && pc > G.roomDef.w * TILE - 70)) return; const ahead = pc + d * 30; if (avoidZ.some(([x, r]) => Math.abs(ahead - x) < r && Math.abs(ahead - x) < Math.abs(pc - x))) return; keys[d > 0 ? R : L] = 1; };
  const W = G.roomDef.w * TILE, nearWall = d => (d < 0 ? pc < 130 : pc > W - 130);
  const jump = (h) => { if (P.on) { keysP.Space = 1; keys.Space = 1; ctx.hold = h || 16; } };
  if (ctx.hold > 0) { ctx.hold--; keys.Space = 1; }
  // ---- live hazards first: what is already flying is read with her own eyes ----
  let mustJump = false, flee = 0;
  const rings = (bo.rr || []).slice(); if (bo.ringR != null) rings.push({ r: bo.ringR, x: (typeof sageRingOrigin === 'function' ? sageRingOrigin(bo).x : bo.cx()) });
  let hop = 5; for (const r of rings) { const gap = Math.abs(pc - r.x) - r.r; if (gap > -6 && gap < 40) { mustJump = true; hop = 9; } }
  for (const w of (bo.waves || [])) { const d = (pc - w.x) * w.dir; if (d > -4 && d < 52) mustJump = true; }
  const avoid = [];
  for (const k of (bo.marks || [])) { avoidZ.push([k.x, 28 + 18]); if (k.t < 0.6) avoid.push([k.x, 28 + 16]); }
  for (const b of (bo.beads || [])) { // where it lands
    const fl = b.floor, a = 450, bb = b.vy, c = b.y - fl; const tl = (-bb + Math.sqrt(Math.max(0, bb * bb - 4 * a * c))) / (2 * a);
    if (tl < 0.6) avoid.push([b.x + b.vx * tl, 40]); }
  let inDanger = avoid.some(([x, r]) => Math.abs(pc - x) < r);
  if (inDanger) { // the nearest x that is clear of every mark and bead
    let best = null; for (let off = 8; off < 260; off += 8) for (const sg of [1, -1]) { const x = pc + sg * off;
      if (x < 40 || x > W - 40) continue; if (!avoid.some(([ax, r]) => Math.abs(x - ax) < r + 6)) { best = x; break; } if (best != null) break; }
      if (best != null) flee = Math.sign(best - pc); }
  if (mustJump) jump(hop);                       // a SHORT hop: a ring or a wave is 26 px tall, and a full jump over its body draws the plumb
  if (flee && !((flee < 0 && pc < 70) || (flee > 0 && pc > W - 70))) { keys[flee > 0 ? R : L] = 1; return; }
  if (st === 'exhale' && ctx.lastSt !== 'exhale') ctx.hit = { n: 0 };
  if (st !== 'coil' && st !== 'lunge' && st !== 'replant' && st !== 'lastcoil') { ctx.over = 0; ctx.lastSt2 = st; }
  ctx.lastSt = st;
  // ---- the agent, as seen ----
  const away = () => { if (nearWall(-dir)) { jump(26); go(dir); } else go(-dir); };
  switch (st) {
    case 'exhale': {                         // THE opening: two blows, then out
      if (ctx.hit.n < 2) { if (ad > 58) go(dir); else if (P.atkT == null || ctx.frame - (ctx.lastSwing || -99) > 13) { keysP.KeyX = 1; ctx.lastSwing = ctx.frame; ctx.hit.n++; } }
      else if (ad < 120) go(-dir);
      return; }
    case 'coil': case 'lunge': case 'replant': case 'lastcoil':
      // close: JUMP OVER the first lunge (it passes under her) and keep going: she lands behind it,
      // a step from where the chain ends. Far: out-range it.
      if (st === 'coil' && ctx.lastSt2 !== 'coil') ctx.over = ad < 260 ? dir : 0;
      ctx.lastSt2 = st;
      if (ctx.over) { if (P.on && st === 'coil') jump(40); if (!P.on) keys.Space = 1; go(ctx.over); return; }
      if (ad < 400) away(); return;
    case 'vaultcrouch': ctx.vx0 = null; return;            // stand still: it will aim at where she stands
    case 'vault': { if (ctx.vx0 == null) ctx.vx0 = pc;    // it is in the air: step 90 px off her own mark
      if (Math.abs(pc - ctx.vx0) < 95) { const d = nearWall(1) ? -1 : nearWall(-1) ? 1 : -dir; go(d); } return; }
    case 'spinprep': case 'spin': if (ad < 130) { if (ad < 70) jump(20); go(-dir); } return;
    case 'plumbprep': case 'sweep': if (!P.on) go(-dir); else if (ad < 150) go(-dir); return;
    case 'gather': case 'gather2': if (ad > 140) go(dir); return;
    case 'countprep': case 'sightprep': case 'mark': case 'volley': if (ad > 200) go(dir); return;
    case 'unbind': if (ad < 150) go(-dir); return;
    default: { // stand / walk / the current fight's states
      // the CURRENT fight has no armour: there a skilled player simply swings (that is the finding)
      const armoured = !!window.__tallyProto;   // she knows the rules of the fight she is in, not its live numbers
      if (!armoured) { if (ad > 60) go(dir); else keysP.KeyX = 1; return; }
      // one poke at half weight when it lets her in, then out before the second one draws the spin
      if (ad < 62 && ctx.frame - (ctx.poke || -999) > 90) { keysP.KeyX = 1; ctx.poke = ctx.frame; return; }
      if (ctx.frame - (ctx.poke || -999) < 40) { go(-dir); return; }
      if (ad > 150) go(dir); else if (ad < 110 && ctx.frame - (ctx.poke || -999) < 200) go(-dir); else if (ad > 62) go(dir);
      return; }
  }
}` };
