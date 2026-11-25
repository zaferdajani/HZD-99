// pogo: jump on it and strike DOWN off its back, over and over (boss-skill pogo)
module.exports = {
 "boss": "tally",
 "bosses": [
  "horn",
  "tally",
  "glitch",
  "alpha",
  "chime"
 ],
 "react": 0,
 "desc": "jump on it and strike DOWN off its back, over and over (boss-skill pogo)",
 "bot": "(bo, P, ctx) => {\n\n  const S = ctx.seen || { cx: bo.cx(), x: bo.x, y: bo.y, w: bo.w, h: bo.h, st: bo.st, face: bo.face || 1 };\n  const pc = P.x + P.w / 2, py = P.y + P.h / 2, dx = S.cx - pc, adx = Math.abs(dx);\n  const toward = dx > 0 ? 'ArrowRight' : 'ArrowLeft', away = dx > 0 ? 'ArrowLeft' : 'ArrowRight';\n  const W = G.roomDef.w * TILE, REACH = S.w / 2 + P.w / 2 + 22;\n  const bcy = S.y + S.h / 2, above = py - bcy;          // > 0: the body is above her\n  const st = String(S.st || '');\n  const TELL = /warn|charge|crouch|coil|gather|prep|aim|rear|raise|perch|lunge|swipe|claw|bite|pounce|leap|dive|spring|rend|roar|sky|ring|note|fury|toss|charge|quake|buck|sweep|stomp|gore|slam/i;\n  const atk = (aimUp) => { if (ctx.frame % 5 === 0) { keysP.KeyX = 1; keys.KeyX = 1; if (aimUp) keys.ArrowUp = 1; } };\n  const jump = () => { if (P.on) keysP.Space = 1; keys.Space = 1; };\n  const face = () => { if (Math.sign(dx) !== P.face) keys[toward] = 1; };\n  const flier = S.h + 40 < above * 2 && above > 50;\n  // A9: the drop shaft (cols 11-14) lies between her door and CHIME — every pattern crosses it first\n  // nothing happens until it wakes: walk up to it first (it stirs within 340-380 px)\n  if (G.roomId === 'A9' && pc < 500 && S.cx > 500) { keys.ArrowRight = 1; if (pc > 300 && P.on) keysP.Space = 1; keys.Space = 1; return; }\n  if (!ctx.woke && /^(dorm|intro|ghwake|ghspeak|ghbellow)$/.test(st) && bo.kind !== 'sage') { if (adx > 260) keys[toward] = 1; return; }\n  ctx.woke = 1;\n\n(() => {\n  if (adx > 26) keys[toward] = 1;\n  if (P.on && adx < 120 && ctx.frame % 3 === 0) keysP.Space = 1; keys.Space = 1;\n  if (!P.on && P.y + P.h < S.y + 10) { keys.ArrowDown = 1; if (ctx.frame % 4 === 0) { keysP.KeyX = 1; keys.KeyX = 1; } }\n})();\n\n  { const dir = keys.ArrowRight ? 1 : keys.ArrowLeft ? -1 : 0;\n    if (dir && P.on) { const fy = Math.floor((P.y + P.h + 4) / TILE), ax = Math.floor((pc + dir * 44) / TILE), bx = Math.floor((pc + dir * 12) / TILE);\n      const row = G.grid[fy]; if (row && (row[ax] === '.' || row[bx] === '.') && row[ax] !== '=' ) { keysP.Space = 1; keys.Space = 1; } }\n    if (!P.on && P.vy < 0 && ctx.gapHold) keys.Space = 1;\n    if (keysP.Space) ctx.gapHold = 1; if (P.on) ctx.gapHold = 0; }\n}"
};
