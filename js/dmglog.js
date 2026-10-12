// THE DAMAGE LOG, AS A CHECK (handoff Part 2 A6).
//
// Player.hurt has always counted blows by source into G.dmgLog, with a rule
// in the comment beside it: any single attack that takes more than about 40%
// of the damage she takes has a telegraph problem. Nothing ever applied it.
// Now each room (each fight) keeps the cores actually LOST by source, and the
// Forge's DAMAGE toggle (or F4) draws the ranking in play, with the offenders
// flagged — the rule as something a tuning pass can run, not remember.
const DMG_FLAG = 0.4;    // the published heuristic
const DMG_MIN = 5;       // ...and only once there is enough damage to mean it
function dmgFightReset() {
  G.dmgFight = { room: G.roomId || '', cores: {}, total: 0 };
}
// Player.hurt, at the one line that takes a core
function dmgNote(src, lost) {
  if (!G.dmgFight || G.dmgFight.room !== G.roomId) dmgFightReset();
  const F = G.dmgFight, k = src || 'unknown';
  F.cores[k] = (F.cores[k] || 0) + lost;
  F.total += lost;
}
// the ranking: most damaging first, each with its share and the 40% flag
function dmgReport(F) {
  F = F || G.dmgFight;
  // a record from the room she left is not this room's: it starts again on
  // the first blow here (dmgNote)
  if (!F || !F.total || (F === G.dmgFight && F.room !== G.roomId)) return [];
  return Object.keys(F.cores).map(k => ({ src: k, lost: F.cores[k], share: F.cores[k] / F.total,
    flag: F.total >= DMG_MIN && F.cores[k] / F.total > DMG_FLAG }))
    .sort((a, b) => b.lost - a.lost);
}
// screen space, after the HUD: only while the Forge has it on
function drawDmgOverlay(c) {
  if (!G.showDmg) return;
  const rows = dmgReport().slice(0, 8), F = G.dmgFight && G.dmgFight.room === G.roomId ? G.dmgFight : null;
  const x = 960 - 236, y = 64, w = 224, h = 30 + Math.max(1, rows.length) * 18;
  c.save();
  c.fillStyle = 'rgba(8,12,18,0.82)'; c.fillRect(x, y, w, h);
  c.strokeStyle = 'rgba(255,255,255,0.25)'; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  c.font = '11px monospace'; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillStyle = '#dfe6ee';
  c.fillText('DAMAGE ' + G.roomId + '  cores lost ' + (F ? F.total : 0), x + 8, y + 14);
  if (!rows.length) { c.fillStyle = '#8a97a6'; c.fillText('(nothing has hit her here)', x + 8, y + 32); }
  rows.forEach((r, i) => {
    const ry = y + 32 + i * 18;
    c.fillStyle = r.flag ? 'rgba(255,95,109,0.55)' : 'rgba(143,246,255,0.35)';
    c.fillRect(x + 8, ry - 6, (w - 16) * r.share, 12);
    c.fillStyle = r.flag ? '#ffd0d4' : '#dfe6ee';
    c.fillText((r.flag ? '! ' : '  ') + r.src.slice(0, 20) + '  ' + Math.round(r.share * 100) + '%', x + 10, ry);
  });
  c.restore();
}
