// ===========================================================================
// CHAPTER ONE'S ROAD (owner, 2026-10-09: "PUT THE MARBLE QUEST BEFORE THE
// LION" and "MAKE CAVES WORTH ENTERING").
//
// The required order is the owner's, verbatim:
//   find raw marble -> return to Ratchet -> forge the Purifier -> cleanse the
//   first Sage -> learn about CHIME -> silence CHIME -> face and cleanse NULLFANG
//
// Everything in this file serves that line, and nothing in it is a message
// pretending to be a wall. The order is held by GEOMETRY and GATES:
//   * the lion's enclosure (A4) — a song ward at A3's east seam that pushes her
//     back (and checkTransitions' clamp behind it), no depth door from the
//     grotto until he is free (GATE_ROOM GA1 `need`), and a saved bench can
//     never be inside it (progressBenchGuard)
//   * the bell (A9) — A8's way up is a gated exit (world.js) that only the
//     freed Sage opens, and a ward is drawn across the hole while it is shut
//   * the staged lion bodies (the meeting, the break) take no damage at all
//     (storyProtected / Boss.die), so no blow can free him out of order
// ...and it is SHOWN, so the player is never left reading a toast to find the
// way: the quarry marks (MARBLE_TRAIL), the marble dust over the hub's cracked
// floor, the quarry visibly cut and the maintenance passage lit on the return,
// and the bound machines she left behind asking to be freed on the way back.
//
// Cleansing reads as a rescue, never as a kill (cleanseBegin): a slow white
// pulse, the infection leaving the body as dark motes that RISE and thin out,
// a column of light, a soft cue, and the word over the body — no debris, no
// detonations, no shake.
//
// docs/CAVES_CH1.md is the cave-by-cave ledger; tests/den-gate.cjs and
// tests/caves-ch1.cjs measure all of it in the real build.
// ===========================================================================

// ---- THE LAIR'S MILESTONES -------------------------------------------------
const PG_LAIR_NEEDS = ['crystal', 'sageTame_GA1D', 'bossChime'];
function pgRobo() { return !(typeof isHero === 'function' && isHero()) && G.save && G.save.storyVersion >= 2; }
function pgLairOpen(f) {
  f = f || (G.save && G.save.flags) || {};
  if (f.bossGlitch) return true;
  return PG_LAIR_NEEDS.every(k => f[k]);
}
function pgBellOpen(f, visited) {
  f = f || (G.save && G.save.flags) || {};
  return !!(f.sageTame_GA1D || f.bossChime || f.bossGlitch || (visited && visited.A9));
}

// A save can only be continued from a bench, and no bench stands inside a
// locked place — but a hand-edited or pre-gate save can name one. Continuing
// it must not start her inside the lair (or the bell's chamber) the gates
// exist to keep her out of. She wakes at the camp bench instead, which is the
// last place before both.
const PG_SAFE_BENCH = { room: 'A3', tx: 8, ty: 15 };
function progressBenchGuard(save) {
  if (!save || save.theme === 'hero' || (typeof isHero === 'function' && isHero())) return false;
  const b = save.bench; if (!b) return false;
  const f = save.flags || {};
  const lockedLair = b.room === 'A4' && !pgLairOpen(f);
  const lockedBell = (b.room === 'A9' || b.room === 'A11') && !pgBellOpen(f, save.visited);
  if (!lockedLair && !lockedBell) return false;
  // the bench static's own geometry (spawnStatic: 44x52, centred on its tile)
  b.room = PG_SAFE_BENCH.room;
  b.x = PG_SAFE_BENCH.tx * TILE + (TILE - 44) / 2;
  b.y = PG_SAFE_BENCH.ty * TILE - 52 + 52 - 38;
  return true;
}

// reading a terminal that does something (game.js, the terminal's use)
function pgSurveyChart() {
  const f = G.save.flags = G.save.flags || {};
  if (f.pgSurvey) return false;
  f.pgSurvey = 1;
  const ch = G.save.charted = G.save.charted || {};
  for (const id of ['CV1', 'CV1B', 'CV2', 'CV3']) ch[id] = 1;
  if (typeof persistSoon === 'function') persistSoon();
  G.toast(t('pg_survey'));
  if (typeof sfx === 'function') sfx('chargeReady');
  return true;
}
function pgTermRead(room, which) {
  if (which === 'survey' && pgRobo()) pgSurveyChart();
}

// ---- WHAT TO DO NOW --------------------------------------------------------
// One answer for "what is the current goal of chapter one", from the save
// alone, so a HUD objective line (the OPENING workstream's) and the cave
// guidance below can never disagree. Returns an i18n key, or null when the
// chapter's own opening lessons (or a later chapter) own the answer.
function progressGoal(f) {
  f = f || (G.save && G.save.flags) || {};
  if (!pgRobo() || f.bossGlitch && f.ch2Climb) return null;
  if (!f['on_A0B|ratchet']) return null;               // the opening's lessons speak first
  if (!f.crystal) {
    if (G.save.bag && G.save.bag.cshard || f.pl_cshard && !f.crystal) return 'pg_goal_return';
    if (!f.heal) return 'pg_goal_pack';
    if (f.ghMet && !f.bossHorn) return 'pg_goal_gravehorn';   // the soldier on the stone
    if (f.beacon) return 'pg_goal_quarry';
    // before the meeting there is no hatch to name (pgHubSealed): send her east
    return pgHubSealed(f) ? 'pg_goal_cross' : 'pg_goal_marble';
  }
  if (f.bossGlitch) return 'pg_goal_up';           // an older save may hold the lion without the rest
  if (!f.sageTame_GA1D) return 'pg_goal_sage';
  if (!f.bossChime) return 'pg_goal_chime';
  return f.nfMeet ? 'pg_goal_lion' : 'pg_goal_east';
}

// ---- THE QUARRY MARKS -------------------------------------------------------
// The Deaf quarrymen marked their road to the seam in chalk (terminal 20, the
// survey under the hub, says so). Each row: tile columns of a mark on the
// floor, all pointing the way on. CV3 has two roads — to the pillar before the
// forge, and to the maintenance passage after it.
const MARBLE_TRAIL = {
  A5:   [17, 23, 30],
  CV1:  [12, 20, 28, 42, 50],
  CV1B: [12, 26],
  CV2:  [20, 31, 41, 50, 58],
  CV3:  { marble: [12, 22, 32, 42], sage: [12, 22, 30] },
};
// which leg of the road is live: 'marble' (go and get it), 'sage' (the blade
// is forged; the same marks now lead to the passage beside the quarry), or
// nothing (carrying the marble home, or the Sage already free)
function pgTrailPhase(f) {
  f = f || (G.save && G.save.flags) || {};
  if (!pgRobo()) return null;
  if (!f.crystal) return f.pl_cshard ? null : 'marble';
  if (!f.sageTame_GA1D) return 'sage';
  return null;
}
function pgTrailMarks(room, phase) {
  const r = MARBLE_TRAIL[room];
  if (!r) return [];
  return Array.isArray(r) ? r : (r[phase] || []);
}
// the floor under a world x, in this room: the heightfield where there is one
// (the meadow's mounds), else the first solid row under open air from the
// bottom of the grid
function pgFloorY(wx) {
  const col = typeof groundColumnAt === 'function' ? groundColumnAt(wx) : null;
  if (col && col.length) { const y = Math.min.apply(null, col); if (isFinite(y)) return y; }
  const g = G.grid, tx = Math.max(0, Math.min(g[0].length - 1, Math.floor(wx / TILE)));
  let ty = g.length - 1;
  while (ty > 0 && (g[ty][tx] === '#' || g[ty][tx] === 'B')) ty--;
  return (ty + 1) * TILE;
}

// ---- THE HUB'S LANDMARK -----------------------------------------------------
// A2's cracked floor (12-14) is the way down to everything in this file, and a
// player arriving from the west is standing two screens from it with the whole
// meadow to look at. So the floor itself says it: pale marble dust seeping up
// through the cracks and a column of light rising out of them, visible from the
// room's west seam — the material in the ground, not a sign on a post.
const PG_HUB = { room: 'A2', tx0: 12, tx1: 14, ty: 15 };
function pgHubBroken() {
  const br = (G.save && G.save.broken) || {};
  for (let x = PG_HUB.tx0; x <= PG_HUB.tx1; x++) if (br['A2:' + x + ',' + PG_HUB.ty]) return true;
  return false;
}
// THE HATCH DOES NOT EXIST UNTIL IT CAN BE OPENED (owner, 2026-11-14: "if it's
// supposed to go inside and dig after Nullfang, then why are you showing it
// before?").
//
// The chapter puts the first meeting with NULLFANG — on the crest, forty-six
// tiles east — before the first cave. The floor was sealed until then, and
// everything ELSE about it was already live: a column of light, "pale marble
// dust seeps up through the cracked floor", a goal line naming the spot, and a
// prompt to jump, hold down and strike. He did, and it knocked and held: a
// glitch, as far as anyone playing could tell.
//
// So the seal is total. Until the meeting these three columns ARE floor: tileAt
// answers '#', which removes the fracture from the drawing, the hollow from the
// knock and the prompt from the air in one place; the light and the caption
// wait on this same answer; and the goal lines send her east instead of down.
// The meeting itself throws her back west along the mound, and the light is
// what she sees when she gets up.
// A save that already cut the hatch (before the seal existed) keeps its hole.
// ...and so does one that has plainly been below it already — a save staged or
// migrated into the caves is not walked back up to a floor that is rock again.
function pgHubSealed(f) {
  f = f || (G.save && G.save.flags);
  if (!f || f.nfMeet || pgHubBroken()) return false;
  if (f.crystal || f.pl_cshard || f.ghMet || f.bossHorn || f.beacon) return false;
  const v = G.save && G.save.visited;
  return !(v && (v.A5 || v.CV1 || v.CV2 || v.CV3));
}
function pgHubSealedTile(tx, ty) {
  return tx >= PG_HUB.tx0 && tx <= PG_HUB.tx1 && ty >= PG_HUB.ty && ty <= PG_HUB.ty + 1 && pgHubSealed();
}
// is the landmark lit? the one question the drawing asks
function pgHubLit(f) { return !!pgTrailPhase(f) && !pgHubSealed(f); }

// THE WAY DOWN IS POINTED AT (owner, 2026-11-15: "it is asking me to bring the
// sword, but ... I cannot access it because it's not easy to find"). The hatch
// has its light and its caption, and both are two screens west of where the
// meeting with NULLFANG leaves her. So while the marble is still the errand and
// the hatch is still shut, the room points at it the way the opening points at
// everything it teaches: a gold chevron pinned to the edge of the frame with
// the distance under it while the hatch is out of view, and a gold arrow
// bobbing over the hatch itself once it is in view. It goes the moment the
// floor is cut. Screen space; nothing under the art probe.
function pgHatchPointer(c) {
  if (!G.save || G.roomId !== PG_HUB.room || G.state !== 'PLAY' || !player || player.dead) return;
  if (G.artProbe || G.dialog || G.cut || G.wake || G.bossEntry || G.gateWalk || G.meet) return;
  if (typeof isHero === 'function' && isHero()) return;
  const f = G.save.flags || {}, bag = G.save.bag || {};
  if (G.tut && !f.tut) return;
  if (f.crystal || bag.cshard || f.pl_cshard || pgHubSealed(f) || pgHubBroken()) return;
  const wx = (PG_HUB.tx0 + PG_HUB.tx1 + 1) / 2 * TILE, wy = PG_HUB.ty * TILE;
  const sx = typeof worldScreenX === 'function' ? worldScreenX(wx) : wx - cam.x;
  const sy = typeof worldScreenY === 'function' ? worldScreenY(wy) : wy - cam.y;
  const pu = 0.5 + Math.sin(performance.now() / 260) * 0.5, col = '#ffd76a';
  c.save();
  if (sx < 26 || sx > 934 || sy < 90 || sy > 520) {
    const M = 26, ex = Math.max(M, Math.min(960 - M, sx)), ey = Math.max(M + 40, Math.min(540 - M - 60, sy));
    const ang = Math.atan2(sy - ey, sx - ex);
    c.globalAlpha = 0.55 + pu * 0.45; c.translate(ex, ey); c.rotate(ang);
    c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 8;
    c.beginPath(); c.moveTo(14 + pu * 4, 0); c.lineTo(-8, -11); c.lineTo(-3, 0); c.lineTo(-8, 11); c.closePath(); c.fill();
    c.rotate(-ang); c.shadowBlur = 0;
    c.font = '700 11px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'top';
    c.fillText(Math.round(Math.hypot(sx - ex, sy - ey) / TILE) + 'm', 0, 16);
  } else if (Math.abs(player.x + player.w / 2 - wx) > 56) {
    // in view and she is not on it yet: an arrow over the hatch, pointing down at it
    const y = sy - 58 - pu * 8;
    c.globalAlpha = 0.6 + pu * 0.4; c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 10;
    c.beginPath(); c.moveTo(sx, y + 16); c.lineTo(sx - 12, y - 4); c.lineTo(sx - 4, y - 4); c.lineTo(sx - 4, y - 18);
    c.lineTo(sx + 4, y - 18); c.lineTo(sx + 4, y - 4); c.lineTo(sx + 12, y - 4); c.closePath(); c.fill();
  }
  c.restore();
  G.hatchPointer = (G.hatchPointer | 0) + 1;      // counted, for the harness
}

// ---- THE WAY TO WHAT SHE WAS ASKED TO DO ------------------------------------
// (owner, 2026-11-15: "the door for the keeper that I should go to is unclear.
// I have no idea where that is.") The goal line names a place — "the door
// beside the marble quarry" — to a player who is standing in the meadow three
// rooms and a hatch away from it and has no way to know that. The hatch got a
// pointer of its own the same morning; this is that pointer for every errand
// of the chapter: from wherever she is, the shortest way through the rooms to
// the goal is worked out, and the door, edge or drop she should take NEXT is
// pointed at — a gold chevron with the distance at the edge of the frame while
// it is out of view, a gold arrow on it once it is in view. It reads the same
// room graph she walks (side exits, ways up and down, and every depth door
// that has been built), so it cannot point at a door that is not there.
function pgGoalRoom(key, f) {
  const ratchet = () => ['A3', 'A0B'].find(id => typeof npcPlaced !== 'function' || npcPlaced(id, 'ratchet')) || 'A3';
  switch (key) {
    case 'pg_goal_pack': case 'pg_goal_return': return ratchet();
    // THE MARBLE IS IN THE QUARRY, not under the hatch (owner, 2026-11-20:
    // "Once I reach the gate and go inside, the arrow keeps directing me back to
    // the gate entrance instead of through the cave to the actual place of the
    // marble"). Naming A5 made every cave room route BACK to it. The route
    // still goes down through the hatch (pgHatchPointer marks it in A2), then
    // on through the caves to the stone.
    case 'pg_goal_marble': return 'CV3';
    case 'pg_goal_quarry': case 'pg_goal_gravehorn': return 'CV3';
    case 'pg_goal_cross': return 'A2';                     // east, to the crest where he meets her
    case 'pg_goal_sage': return 'GA1D';
    case 'pg_goal_chime': return 'A9';
    case 'pg_goal_lion': case 'pg_goal_east': return 'A4';
    case 'pg_goal_up': return 'B1';
  }
  return null;
}
const PG_ROUTE = { key: '', step: null };
function pgRouteEdges(id) {
  const out = [], def = ROOMS[id];
  if (!def) return out;
  const ex = def.exits || {};
  for (const side in ex) { const v = ex[side], to = typeof v === 'object' ? v.to : v; if (to && ROOMS[to]) out.push({ to, side }); }
  const f = (G.save && G.save.flags) || {};
  for (const d of (typeof gateDoorsAll === 'function' ? gateDoorsAll(id) : [])) if (d && d.to && ROOMS[d.to] && (!d.need || f[d.need]) && (!d.lock || f[d.lock])) out.push({ to: d.to, gate: d });   // (a dark ring is not a way through)
  return out;
}
// the next thing to walk through from this room, toward the goal's room
function pgRouteStep() {
  if (!G.save || !G.roomId || !pgRobo()) return null;
  const goal = typeof progressGoal === 'function' ? progressGoal() : null;
  const want = goal && pgGoalRoom(goal, G.save.flags || {});
  const key = G.roomId + '|' + goal + '|' + want + '|' + (G.save.flags && G.save.flags.crystal ? 1 : 0) + (pgHubBroken() ? 1 : 0);
  if (PG_ROUTE.key === key) return PG_ROUTE.step;
  PG_ROUTE.key = key; PG_ROUTE.step = null;
  if (!want || want === G.roomId || !ROOMS[want]) return null;
  const first = { [G.roomId]: null }, q = [G.roomId];
  while (q.length) {
    const id = q.shift();
    if (id === want) break;
    for (const e of pgRouteEdges(id)) {
      if (first[e.to] !== undefined) continue;
      first[e.to] = id === G.roomId ? e : first[id];
      q.push(e.to);
    }
  }
  PG_ROUTE.step = first[want] || null;
  if (PG_ROUTE.step) PG_ROUTE.step.goal = goal;
  return PG_ROUTE.step;
}
// the depth door the route goes through, if it goes through one (drawRingGate turns that ring gold)
function pgRouteDoor() { const s = pgRouteStep(); return s && s.gate ? s.gate : null; }
// where that step IS in this room, in world pixels: [x, y, direction]
function pgRouteSpot(step) {
  const W = G.roomDef.w * TILE, H = G.grid.length * TILE;
  const floorAt = (x) => { const g = typeof groundColumnAt === 'function' ? groundColumnAt(x) : null; return g && g.length ? Math.min.apply(null, g) : (G.roomDef.h - 2) * TILE; };
  if (step.gate) { const x = gateWorldX(step.gate); return [x, floorAt(x) - 150, 'down']; }
  if (step.side === 'L') return [10, floorAt(40) - 40, 'left'];
  if (step.side === 'R') return [W - 10, floorAt(W - 40) - 40, 'right'];
  // a way up or down keeps her column: it is where the OTHER room's opening is
  let x = W / 2;
  try {
    const g2 = buildRoom(step.to), row = g2[step.side === 'T' ? g2.length - 1 : 0], open = [];
    for (let i = 0; i < row.length; i++) if (row[i] !== '#') open.push(i);
    if (open.length && open.length < row.length - 4) x = (open[0] + open[open.length - 1] + 1) / 2 * TILE;
  } catch (e) {}
  return step.side === 'T' ? [x, cam.y + 30, 'up'] : [x, floorAt(x) - 8, 'down'];
}
function pgRoutePointer(c) {
  if (!G.save || G.state !== 'PLAY' || !player || player.dead) return;
  if (G.artProbe || G.dialog || G.cut || G.wake || G.bossEntry || G.gateWalk || G.meet || G.trans) return;
  if (typeof isHero === 'function' && isHero()) return;
  const f = G.save.flags || {};
  if (G.tut && !f.tut) return;
  if (typeof bossActive === 'function' && bossActive()) return;
  const step = pgRouteStep();
  if (!step) return;
  // the hatch has its own marker while it is still shut (pgHatchPointer)
  if (step.side === 'B' && G.roomId === PG_HUB.room && !pgHubBroken() && !pgHubSealed(f)) return;
  if (step.side === 'B' && G.roomId === PG_HUB.room && pgHubSealed(f)) return;
  let spot; try { spot = pgRouteSpot(step); } catch (e) { return; }
  const sx = typeof worldScreenX === 'function' ? worldScreenX(spot[0]) : spot[0] - cam.x;
  const sy = typeof worldScreenY === 'function' ? worldScreenY(spot[1]) : spot[1] - cam.y;
  const pu = 0.5 + Math.sin(performance.now() / 260) * 0.5, col = '#ffd76a';
  c.save();
  if (sx < 30 || sx > 930 || sy < 96 || sy > 516) {
    const M = 26, ex = Math.max(M, Math.min(960 - M, sx)), ey = Math.max(M + 76, Math.min(540 - M - 60, sy));
    const ang = Math.atan2(sy - ey, sx - ex);
    c.globalAlpha = 0.6 + pu * 0.4; c.translate(ex, ey); c.rotate(ang);
    c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 8;
    c.beginPath(); c.moveTo(14 + pu * 4, 0); c.lineTo(-8, -11); c.lineTo(-3, 0); c.lineTo(-8, 11); c.closePath(); c.fill();
    c.rotate(-ang); c.shadowBlur = 0;
    c.font = '700 11px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'top';
    c.fillText(Math.max(1, Math.round(Math.hypot(sx - ex, sy - ey) / TILE)) + 'm', 0, 16);
  } else {
    // in view: an arrow on it, pointing the way she goes through it
    const a = spot[2] === 'left' ? Math.PI : spot[2] === 'right' ? 0 : spot[2] === 'up' ? -Math.PI / 2 : Math.PI / 2;
    c.translate(sx, sy); c.rotate(a); c.translate(-pu * 8, 0);
    c.globalAlpha = 0.65 + pu * 0.35; c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 10;
    c.beginPath(); c.moveTo(16, 0); c.lineTo(-4, -12); c.lineTo(-4, -4); c.lineTo(-18, -4); c.lineTo(-18, 4); c.lineTo(-4, 4); c.lineTo(-4, 12); c.closePath(); c.fill();
  }
  c.restore();
  G.routePointer = { to: step.to, gate: !!step.gate, side: step.side || null, x: Math.round(spot[0]), y: Math.round(spot[1]), n: ((G.routePointer && G.routePointer.n) | 0) + 1 };
}

// ---- WARDS ------------------------------------------------------------------
// The song, wound tight across a way through. Drawn as layered membranes whose
// edges are never straight (NO RIGHT ANGLES), with sound-rings crawling along
// them; `layers` is how many milestones are still missing, so the lair's ward
// visibly thins as the chapter is played: three sheets before the forge, two
// before the Sage, one before the bell, none after.
function pgWardLayers() {
  const f = G.save.flags;
  if (pgLairOpen(f)) return 0;
  return PG_LAIR_NEEDS.filter(k => !f[k]).length;
}
const PG_WARD_EAST = 2.2;       // tiles: the lair ward's depth at A3's east seam (inside the camera's clamp)
const PG_BELL_COLS = [11, 14];  // A8's way up (world.js: the shaft shared with A2 and A9)

// ---- THE TICK ---------------------------------------------------------------
// THE HINTS FOR SOMETHING HIDDEN UP (owner, 2026-11-16: "you have to show hints
// in the room that suggest there is something hidden up"). The cache on the
// Seam's shelf is out of a jump's reach on purpose. It already glints (a chest
// is lit); dust comes down off the shelf it stands on, all the time, so the eye
// is drawn up to it from anywhere in the room; and the first time she stands
// under it without the legs for it, she is told what she is looking at.
function pgSeamHints(f, dt) {
  const ch = (G.statics || []).find(s => s.type === 'chest' && !s.opened);
  if (!ch || !player || player.dead) return;
  if (!G.artProbe && chance((dt || 1 / 60) * 14))
    addPart(ch.x + rnd(-44, 54), ch.y + ch.h + 8, rnd(-6, 6), rnd(18, 44), rnd(1.6, 2.6),
      chance(0.3) ? '#fff2cf' : '#9fd8ff', rnd(1, 2.1), 26, true);
  const can = typeof hasMod === 'function' && (hasMod('djump') || hasMod('wall'));
  if (!f.pgSeamHigh && !can && player.on && Math.abs(player.x + player.w / 2 - (ch.x + ch.w / 2)) < 96
      && player.y > ch.y + 120) {
    f.pgSeamHigh = 1; persistSoon(); G.toast(t('pg_seam_high'));
  }
}
function progressTick(dt) {
  // the cleansing light belongs to the room it was cast in (the reward it was
  // holding is settled by loadRoom's own safety net)
  if (G.pgRoom !== G.roomId) { G.pgRoom = G.roomId; G.cleanses = []; }
  if (!pgRobo() || !player || player.dead || G.trans) return;
  const f = G.save.flags, W = G.roomDef.w * TILE, now = G.save.time || 0;
  // THE LAIR WARD, physically. checkTransitions already refuses the crossing at
  // the room's edge; this is the face of it, a tile and a half earlier, so she
  // meets a thing she can SEE rather than an invisible stop at the seam. Speed
  // is irrelevant: it corrects position after movement, every step, so a dash
  // or a jump arrives at the same place a walk does.
  if (G.roomId === 'A3' && !pgLairOpen(f) && !G.break) {
    const face = W - PG_WARD_EAST * TILE;
    if (player.x + player.w > face) {
      player.x = face - player.w;
      if (player.vx > 0) player.vx = -90;
      if (player.dashT > 0) player.dashT = 0;
      pgWardHit(face, player.y + player.h * 0.5, 'lair');
    }
  }
  // THE BELL WARD. The gate (world.js A8 T exit) makes the hole above a ceiling;
  // this makes the ceiling answer: she is pushed back down with the ward's
  // light, and told why.
  if (G.roomId === 'A8' && !pgBellOpen(f, G.save.visited)) {
    const cx = player.x + player.w / 2;
    if (player.y < TILE * 0.7 && cx > (PG_BELL_COLS[0] - 0.5) * TILE && cx < (PG_BELL_COLS[1] + 1.5) * TILE) {
      player.y = TILE * 0.7;
      if (player.vy < 0) player.vy = 160;
      pgWardHit(cx, TILE * 0.6, 'bell');
    }
  }
  // THE QUARRY, AFTER THE FORGE. The same cavern, visibly not the same: the
  // marble cut, the maintenance passage open and lit, and she is told so the
  // first time she stands there with the blade.
  if (G.roomId === 'CV3' && f.crystal && !f.sageTame_GA1D && !f.pgCv3Back) {
    f.pgCv3Back = 1; persistSoon();
    G.toast(t('pg_cv3_back'));
  }
  // THE BOUND ONES WAIT. Every machine she knocked down before the forge is
  // lying where it fell, still bound — and the road back through the caves is
  // where she meets them again with the blade in her paw.
  // Said twice, not in every room: the campaign run heard it in nearly every
  // room after the forge, and a line the player has already understood
  // becomes noise that buries the toasts that are news.
  if (f.crystal && !(f.pgBound || {})[G.roomId] && (f.pgBoundN | 0) < 2
      && (G.enemies || []).some(e => e && e.disabled && !e.rescued)) {
    (f.pgBound = f.pgBound || {})[G.roomId] = 1; f.pgBoundN = (f.pgBoundN | 0) + 1; persistSoon();
    G.toast(t('pg_bound_wait'));
  }
  // THE SURVEY (CV1B). The Deaf quarrymen's station in the seam hall charts the
  // quarry's tunnels onto her map when she reads it — a facility brought back,
  // not a heap of scrap. It was a save pod until 2026-11-15 (the owner: save
  // points "only near critical areas, not everywhere"); a run that rested at
  // it then keeps its chart, and one parked there is charted on waking.
  if (G.roomId === 'CV1B' && G.save.bench && G.save.bench.room === 'CV1B' && !f.pgSurvey) pgSurveyChart();
  // THE SEAM'S CACHE SAYS IT IS THERE (world.js CV1B): a thing kept for a later
  // skill has to be SEEN before it can be remembered
  if (G.roomId === 'CV1B') pgSeamHints(f, dt);
  // THE FIRST MARK SPEAKS ONCE: what the arrows are and who drew them.
  if (pgTrailPhase(f) === 'marble' && !f.pgMarks && G.roomId === 'A5') {
    const mk = pgTrailMarks('A5', 'marble');
    if (mk.length && Math.abs(player.x + player.w / 2 - (mk[0] + 0.5) * TILE) < 3 * TILE) {
      f.pgMarks = 1; persistSoon();
      G.toast(t('pg_marks'));
    }
  }
  // THE END OF CHAPTER ONE: the climb above the camp, once the lion is free.
  // This only closes the chapter's objective line. The chapter-two teaser is
  // NOT queued here any more: a comic on the ledges is a comic in the middle
  // of play (owner, 2026-10-12), so it plays over the crossing into B1
  // instead (js/panels.js, the 'ch2' entry).
  if (G.roomId === 'A3' && f.bossGlitch && f.crystal && !f.ch2Climb) {
    const cx = (player.x + player.w / 2) / TILE, cy = (player.y + player.h / 2) / TILE;
    if (cx >= 17 && cx <= 29 && cy < 8) { f.ch2Climb = 1; persist(); }
  }
  // cleansing pulses: the reward waits for the light to settle, the way the
  // kill path waits for its finale
  if (G.cleanses && G.cleanses.length) {
    for (const q of G.cleanses) {
      q.t += dt;
      if (q.t < 1.6 && q.t - (q.mt || 0) > 0.05) {
        q.mt = q.t;
        // THE INFECTION LEAVES: dark violet motes rising off the body and
        // thinning out, with white sparks — the opposite of debris, which
        // falls. Nothing here has gravity pulling it down.
        const n = q.small ? 1 : 3;
        for (let i = 0; i < n; i++) {
          addPart(q.x + rnd(0, q.w), q.y + rnd(q.h * 0.2, q.h), rnd(-18, 18), rnd(-110, -50),
            rnd(0.8, 1.3), chance(0.5) ? '#5a2a7a' : '#2a1238', q.small ? 2.2 : 3.2, -40, false);
          if (chance(0.5)) addPart(q.x + rnd(0, q.w), q.y + rnd(0, q.h), rnd(-30, 30), rnd(-80, -20),
            0.7, '#ffffff', 1.8, -20, true);
        }
      }
      if (q.boss && q.t > 1.6 && q.boss.rewardPend) { q.boss.rewardPend = false; G.onBossDead(q.boss.kind); }
    }
    G.cleanses = G.cleanses.filter(q => q.t < 3.4);
  }
}
function pgWardHit(x, y, which) {
  const now = G.save.time || 0;
  if (chance(0.5)) burst(x, y, 4, '#c79bff', 140, 0.35, 0, 2, true);
  G.pgWardFlash = 0.6;
  if (!G.pgWardSaid || now - G.pgWardSaid > 4) {
    G.pgWardSaid = now;
    if (typeof sfx === 'function') sfx('no');
    const hint = which === 'lair' && typeof openingGateHint === 'function' ? openingGateHint('A4') : '';
    G.toast(hint || t(which === 'lair' ? 'gh_marble' : 'gate_chime_ward'));
  }
}

// ---- CLEANSING ---------------------------------------------------------------
// The one picture of a rescue, shared by the Sage, the freed guardians and every
// bound machine she cleanses: see the header. `label` is an i18n key drawn
// over the body; `boss` (optional) is paid its reward when the light settles.
function cleanseBegin(x, y, w, h, label, boss, small) {
  G.cleanses = G.cleanses || [];
  G.cleanses.push({ x, y, w, h, t: 0, label: label || 'pg_freed', boss: boss || null, small: !!small });
  if (typeof sfx === 'function') sfx('heal');
  if (!small) {
    G.flash = Math.max(G.flash || 0, 0.22);
    if (typeof G.addRing === 'function') G.addRing(x + w / 2, y + h / 2);
  }
}
function drawCleanses(c) {
  if (!G.cleanses || !G.cleanses.length) return;
  for (const q of G.cleanses) {
    const cx = q.x + q.w / 2, cy = q.y + q.h / 2, k = q.small ? 0.55 : 1;
    const R = Math.max(q.w, q.h) * (q.small ? 1.2 : 1.6);
    c.save();
    c.globalCompositeOperation = 'lighter';
    // a column of clean light standing on the body, fading as it settles
    const colA = Math.max(0, 1 - q.t / 2.6) * 0.42 * k;
    if (colA > 0.01) {
      // scattered like every shaft (drawSoftShaft): no ruled sides
      const cw = q.w * 0.9;
      drawSoftShaft(c, cx, q.y - 260 * k, cw * 0.35, cx, q.y + q.h, cw * 1.2, '235,250,255', 0, colA * 1.3, false);
    }
    // three slow white rings, the pulse going OUT and staying soft
    for (let i = 0; i < 3; i++) {
      const u = (q.t - i * 0.35) / 1.8;
      if (u <= 0 || u >= 1) continue;
      c.strokeStyle = 'rgba(225,245,255,' + ((1 - u) * 0.45 * k).toFixed(3) + ')';
      c.lineWidth = (1 - u) * 3.5 + 1;
      c.beginPath(); c.ellipse(cx, cy, R * (0.4 + u * 1.6), R * (0.32 + u * 1.25), 0, 0, 7); c.stroke();
    }
    c.restore();
    // ...and the word, so nobody reads the light as a death
    const la = Math.min(1, q.t / 0.35) * Math.max(0, Math.min(1, (3.4 - q.t) / 0.8));
    if (la > 0.02) {
      // on a dark plate, like every other word the game hands her: white on
      // the column of light would be white on white
      const sz = q.small ? 12 : 16, ly = q.y - 22 - Math.min(1, q.t) * 10, word = t(q.label);
      c.save(); c.globalAlpha = la;
      c.font = '700 ' + sz + 'px "Segoe UI", Tahoma, sans-serif';
      const lw = c.measureText(word).width + sz * 1.4;
      c.fillStyle = 'rgba(6,14,24,0.82)';
      if (typeof rr === 'function') { rr(c, cx - lw / 2, ly - sz * 0.9, lw, sz * 1.8, sz * 0.6); c.fill(); }
      ftxt(word, cx, ly, sz, '#f4fbff', 'center', 'rgba(140,220,255,0.95)');
      c.restore(); c.globalAlpha = 1;
    }
  }
}

// ---- DRAWING ----------------------------------------------------------------
// Ground layer: marks and dust, under every body.
function drawProgressGround(c) {
  if (!pgRobo()) return;
  const f = G.save.flags, phase = pgTrailPhase(f), now = performance.now() / 1000;
  const sage = phase === 'sage';
  const ink = sage ? '159,220,255' : '238,244,240';
  // the hub's landmark
  if (G.roomId === PG_HUB.room && phase && !pgHubSealed()) {
    const x0 = PG_HUB.tx0 * TILE, x1 = (PG_HUB.tx1 + 1) * TILE, cx = (x0 + x1) / 2;
    const broken = pgHubBroken(), fy = broken ? PG_HUB.ty * TILE : Math.min(PG_HUB.ty * TILE, pgFloorY(cx));
    const pu = 0.6 + Math.sin(now * 1.7) * 0.4;
    c.save(); c.globalCompositeOperation = 'lighter';
    // the column of light out of the cracks, tall enough to read from the seam
    // ...scattered, never ruled (owner, 2026-10-16): the column has no edge —
    // it is strongest in its core, gone at its sides, thins away into the air
    // above, and pools out along the floor where it stands (drawSoftShaft)
    const H = 8.5 * TILE;
    drawSoftShaft(c, cx, fy - H, (x1 - x0) * 0.55, cx, fy + 2, (x1 - x0) * 1.35, ink,
      0.0, 0.30 + pu * 0.12, !broken);
    // the seams themselves glow: the dust is coming through the cracks,
    // split by dark seams on the pool the column lays on the surface
    if (!broken) {
      c.strokeStyle = 'rgba(' + ink + ',' + (0.6 + pu * 0.35).toFixed(3) + ')';
      c.lineWidth = 2; c.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const sx = x0 + 14 + i * ((x1 - x0 - 28) / 3);
        c.beginPath(); c.moveTo(sx - 9, fy - 1);
        c.quadraticCurveTo(sx, fy - 5 - (i % 2) * 3, sx + 9, fy - 1);
        c.stroke();
      }
    } else {
      // the hole she cut keeps breathing light: this is still the way down
      const hg = c.createRadialGradient(cx, fy + 18, 4, cx, fy + 18, 70);
      hg.addColorStop(0, 'rgba(' + ink + ',' + (0.35 + pu * 0.2).toFixed(3) + ')');
      hg.addColorStop(1, 'rgba(' + ink + ',0)');
      c.fillStyle = hg; c.beginPath(); c.ellipse(cx, fy + 18, 70, 40, 0, 0, 7); c.fill();
    }
    c.restore();
    if (chance(0.35)) addPart(x0 + rnd(4, x1 - x0 - 4), fy - 2, rnd(-10, 10), rnd(-70, -30), rnd(0.9, 1.5),
      sage ? '#a8e4ff' : '#f2f5ef', 2, -20, true);
    // a caption on the approach; up close the strike prompt takes over
    if (!broken && player) {
      const d = Math.abs(player.x + player.w / 2 - cx);
      if (d > 140 && d < 470) {
        c.save(); c.globalAlpha = Math.min(1, (470 - d) / 120) * 0.92;
        // one sentence a line: the caption stands over the crack, inside the
        // light, and never runs off the side of a phone's frame
        const lines = pgSentences(t('pg_marble_here'));
        lines.forEach((ln, i) => ftxt(ln, cx, fy - 3.9 * TILE + (i - (lines.length - 1)) * 16, 12, '#f4f7f2', 'center', 'rgba(200,225,215,0.9)'));
        c.restore(); c.globalAlpha = 1;
      }
    }
  }
  // the quarry marks
  if (phase) {
    for (const tx of pgTrailMarks(G.roomId, phase)) {
      const mx = (tx + 0.5) * TILE, my = pgFloorY(mx);
      pgDrawMark(c, mx, my, ink, now + tx);
    }
  }
  // CV3 after the forge: the cut stump where the marble came free, and the
  // maintenance passage lit from inside
  if (G.roomId === 'CV3' && f.pl_cshard) pgDrawStump(c, f);
  // (THE PASSAGE'S OWN LIGHT IS ITS RING NOW. This used to lay a 190 px haze of
  // blue over the door to say "lit from inside" — the only sign the keeper's
  // door had — and over the ring gate it was a fog standing in front of the
  // best thing in the room. The ring's field says it; only the motes stay.)
  if (G.roomId === 'CV3' && f.crystal && !f.sageTame_GA1D) {
    const dx = W_CV3_DOOR(), fy = pgFloorY(dx);
    if (chance(0.3)) addPart(dx + rnd(-40, 40), fy - rnd(20, 120), rnd(-14, 14), rnd(-30, 6), 1.2, '#9fdcff', 2, -8, true);
  }
}
function pgSentences(str) {
  const parts = String(str).split(/(?<=[.!?。！？])\s*/).filter(Boolean);
  return parts.length ? parts : [String(str)];
}
function W_CV3_DOOR() { return G.roomDef.w * TILE * (36 / 56); }
// one chalk mark: a curved arrow pointing on, and a rounded pebble — the raw
// marble as the quarrymen drew it. Strokes only, all of them curved.
function pgDrawMark(c, x, y, ink, ph) {
  const pu = 0.65 + Math.sin(ph * 2.3) * 0.35;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const hg = c.createRadialGradient(x, y - 4, 2, x, y - 4, 46);
  hg.addColorStop(0, 'rgba(' + ink + ',' + (0.18 * pu).toFixed(3) + ')');
  hg.addColorStop(1, 'rgba(' + ink + ',0)');
  c.fillStyle = hg; c.beginPath(); c.ellipse(x, y - 4, 46, 22, 0, 0, 7); c.fill();
  c.globalCompositeOperation = 'source-over';
  c.strokeStyle = 'rgba(' + ink + ',' + (0.55 + 0.35 * pu).toFixed(3) + ')';
  c.lineWidth = 2.4; c.lineCap = 'round'; c.lineJoin = 'round';
  // the shaft, bowed like a quick hand drew it
  c.beginPath(); c.moveTo(x - 20, y - 6); c.quadraticCurveTo(x - 2, y - 13, x + 16, y - 7); c.stroke();
  // the head
  c.beginPath(); c.moveTo(x + 7, y - 15); c.quadraticCurveTo(x + 13, y - 9, x + 17, y - 7);
  c.quadraticCurveTo(x + 12, y - 4, x + 8, y + 1); c.stroke();
  // the pebble: raw marble, rounded
  c.beginPath(); c.ellipse(x - 27, y - 9, 6, 4.5, -0.3, 0, 7); c.stroke();
  c.restore();
}
// where the stone stands: read from the room's own entity list, so the stump
// is under the stone wherever the room puts it (it moved to the back wall on
// 2026-11-16) — and never over open floor (the wall's own column has none)
function PG_STONE_X() {
  const d = ROOMS.CV3 && ROOMS.CV3.ents.find(e => e[0] === 'pillar');
  return ((d ? d[1] : 50) + 0.5) * TILE - 12;
}
function pgDrawStump(c, f) {
  // (seated where the pillar was: on the bowl's floor, not on its tile row — seatPillars, js/game.js)
  const x = PG_STONE_X(), base = (typeof pgFloorY === 'function' ? pgFloorY(x) + 5 : 15 * TILE);
  const h = 96 * 1.18, cutY = base - h * 0.38;
  c.save();
  // keep only what is below an uneven cut line — the pillar's own plate,
  // quarried down to a stump
  c.beginPath();
  c.moveTo(x - 90, base + 6);
  c.lineTo(x - 90, cutY + 6);
  c.quadraticCurveTo(x - 30, cutY - 6, x + 6, cutY + 2);
  c.quadraticCurveTo(x + 40, cutY + 10, x + 90, cutY - 4);
  c.lineTo(x + 90, base + 6);
  c.closePath();
  c.clip();
  const drew = typeof drawPlateAnchored === 'function' && drawPlateAnchored(c, 'rawMarble', x, base, h, false);
  if (!drew) {
    c.fillStyle = '#b9c8cb';
    c.beginPath(); c.ellipse(x, base - h * 0.3, 54, h * 0.42, 0, 0, 7); c.fill();
  }
  c.restore();
  // the cut face catches the light
  const pu = 0.6 + Math.sin(performance.now() / 800) * 0.4;
  c.save(); c.globalCompositeOperation = 'lighter';
  c.strokeStyle = 'rgba(240,250,255,' + (0.55 + pu * 0.3).toFixed(3) + ')';
  c.lineWidth = 3; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - 46, cutY + 3);
  c.quadraticCurveTo(x - 30, cutY - 6, x + 6, cutY + 2);
  c.quadraticCurveTo(x + 30, cutY + 8, x + 48, cutY + 1);
  c.stroke();
  c.restore();
}
// Over the bodies: the wards and the cleansing light.
function drawProgress(c) {
  if (!pgRobo()) return;
  const now = performance.now() / 1000;
  if (G.pgWardFlash > 0) G.pgWardFlash = Math.max(0, G.pgWardFlash - 1 / 60);
  if (G.roomId === 'A3') {
    const n = pgWardLayers();
    if (n > 0) {
      const W = G.roomDef.w * TILE, x0 = W - PG_WARD_EAST * TILE;
      pgDrawWardV(c, x0, W + 8, -2 * TILE, 15 * TILE + 6, n, now);
    }
  }
  if (G.roomId === 'A8' && !pgBellOpen(G.save.flags, G.save.visited)) {
    pgDrawWardH(c, (PG_BELL_COLS[0] - 0.6) * TILE, (PG_BELL_COLS[1] + 1.6) * TILE, -6, TILE * 1.9, now);
  }
  drawCleanses(c);
}
function pgDrawWardV(c, x0, x1, y0, y1, layers, now) {
  const fl = G.pgWardFlash || 0;
  c.save(); c.globalCompositeOperation = 'lighter';
  // the halo it throws on the camp, so the ward reads from across the yard
  const hw = 3.5 * TILE;
  const hg = c.createLinearGradient(x0 - hw, 0, x0 + 8, 0);
  hg.addColorStop(0, 'rgba(170,110,255,0)');
  hg.addColorStop(1, 'rgba(170,110,255,' + (0.10 + 0.05 * layers + fl * 0.15).toFixed(3) + ')');
  c.fillStyle = hg;
  c.beginPath();
  c.moveTo(x0 + 8, y0);
  c.quadraticCurveTo(x0 - hw * 0.6, (y0 + y1) / 2, x0 + 8, y1);
  c.closePath(); c.fill();
  for (let L = 0; L < layers; L++) {
    const depth = L / Math.max(1, layers);
    const left = x0 + depth * (x1 - x0) * 0.45;
    const a = (0.16 + 0.1 * (layers - L) / layers + fl * 0.25);
    const g = c.createLinearGradient(left, 0, x1, 0);
    g.addColorStop(0, 'rgba(180,120,255,0)');
    g.addColorStop(0.35, 'rgba(180,120,255,' + a.toFixed(3) + ')');
    g.addColorStop(1, 'rgba(255,110,190,' + (a * 0.8).toFixed(3) + ')');
    c.fillStyle = g;
    c.beginPath();
    const N = 14;
    for (let i = 0; i <= N; i++) {
      const yy = y0 + (y1 - y0) * i / N;
      const xx = left + Math.sin(now * (1.3 + L * 0.4) + i * 0.9 + L * 2) * 9;
      if (!i) c.moveTo(xx, yy); else c.lineTo(xx, yy);
    }
    c.lineTo(x1, y1); c.lineTo(x1, y0); c.closePath();
    c.fill();
    // sound-rings crawling up the sheet: the song, still singing in it
    c.strokeStyle = 'rgba(230,190,255,' + (0.35 + fl * 0.4).toFixed(3) + ')';
    c.lineWidth = 1.6;
    for (let r = 0; r < 4; r++) {
      const v = ((now * 0.35 + r / 4 + L * 0.13) % 1);
      const yy = y1 - v * (y1 - y0);
      c.beginPath(); c.ellipse(left + 12, yy, 10 + L * 4, 26, 0, -1.3, 1.3); c.stroke();
    }
  }
  c.restore();
}
function pgDrawWardH(c, x0, x1, y0, y1, now) {
  const fl = G.pgWardFlash || 0;
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, 'rgba(255,120,200,' + (0.55 + fl * 0.3).toFixed(3) + ')');
  g.addColorStop(0.55, 'rgba(190,120,255,' + (0.28 + fl * 0.2).toFixed(3) + ')');
  g.addColorStop(1, 'rgba(180,120,255,0)');
  c.fillStyle = g;
  c.beginPath();
  const N = 12;
  c.moveTo(x0, y0);
  for (let i = 0; i <= N; i++) {
    const xx = x0 + (x1 - x0) * i / N;
    const sag = Math.sin(Math.PI * i / N);           // the membrane bellies down in the middle
    c.lineTo(xx, y0 + (y1 - y0) * (0.35 + 0.65 * sag) + Math.sin(now * 2.2 + i * 1.1) * 6);
  }
  c.lineTo(x1, y0); c.closePath(); c.fill();
  // the strings it is wound from, each one bowed and trembling
  c.strokeStyle = 'rgba(245,215,255,' + (0.55 + fl * 0.4).toFixed(3) + ')';
  c.lineWidth = 1.5;
  for (let k = 0; k < 4; k++) {
    const yy = y0 + 6 + k * (y1 - y0) * 0.18;
    c.beginPath(); c.moveTo(x0 + 4, yy);
    c.quadraticCurveTo((x0 + x1) / 2, yy + (y1 - y0) * 0.35 + Math.sin(now * 9 + k) * 3, x1 - 4, yy);
    c.stroke();
  }
  // sound-rings dropping out of it: the bell, ringing somewhere above
  for (let r = 0; r < 3; r++) {
    const v = ((now * 0.45 + r / 3) % 1);
    c.strokeStyle = 'rgba(230,190,255,' + ((1 - v) * 0.6).toFixed(3) + ')';
    c.beginPath(); c.ellipse((x0 + x1) / 2, y1 * 0.6 + v * TILE * 1.6, 16 + v * 40, 5 + v * 9, 0, 0, 7); c.stroke();
  }
  c.restore();
}

// ---- REMEMBERED DISCOVERIES -------------------------------------------------
// "Reward early exploration: remember discoveries and adapt later quest
// dialogue rather than making players revisit an empty room solely because
// they explored before accepting the task." (owner). A fetch whose object is
// already in her bag, or a reach whose place she already stood in, is finished
// the moment it is asked — and the asker says so, in their own words.
// Culls are not discoveries: a count of machines broken before the ask is not
// the thing anybody asked for, so they still count from the ask.
function questFoundEarly(q) {
  if (!q || !G.save) return false;
  if (q.kind === 'fetch') return !!(G.save.bag && G.save.bag[q.item]);
  if (q.kind === 'reach') return !!(G.save.visited && G.save.visited[q.room]);
  // a READ is the evidence read, not the room stood in (MIS-01, js/quests.js)
  if (q.kind === 'read') return typeof qReadDone === 'function' && qReadDone(q);
  return false;
}
function questEarlyLines(q) {
  const k = 'q_early_' + q.id, l = t(k);
  const thanks = t('q_thanks_' + q.id);
  const out = [].concat(l && l !== k ? l : t('q_early'));
  if (thanks && thanks !== 'q_thanks_' + q.id) out.push(thanks);
  if (q.id === 'ratchet_forge' && typeof revisedStory === 'function' && revisedStory()) out.push(t('sl_ratchet_moving'));
  return out;
}

// ---- the Seam's cache, in five languages ----
TEXT_LAYERS.push({
  robo: true,
  en: { pure_first: 'THE FIRST PURIFIED', pure_firstd: 'It remembers who it was — and where it hid its spare. A CORE, and it is yours to keep: one more life, for good.', pure_core: 'A CORE, GIVEN', pure_cored: 'The purified have talked to each other. One of them kept a core through all of it, and wants you to have it.', pure_scrap: 'WHAT THEY KEPT', pure_scrapd: 'The purified pooled what they had hidden from the song: %s scrap.', pure_next: 'Purified: %n. At %m, they give again.', pure_all: 'Purified: %n. Every one of them is yours to call on.', gear_how: 'Use it: %k', gear_how_arm: 'Switch suit: %k', gear_how_wall: 'Use it: jump at a wall and hold toward it; jump again to kick off.', bag_gear: 'Blades, powers and the keys that use them: GEAR — %k', gear_seeit: 'It is in GEAR now (%k) with the key that uses it.', nf_break1: 'NULLFANG — a binding breaks. He is faster now.', nf_break2: 'NULLFANG — the last binding breaks. He will not rest again.', map_locked: 'No chart of this country yet. One of the Eye\'s agents keeps the survey — purify it, and the map is yours.', map_goal: 'Objective', shop_pick: 'RATCHET\'S PICK', shop_browse: 'Browse', shop_later: 'Not now', shop_why_pack: 'You have no pack yet. The Volt Pack is the first thing you need — it is what healing and the burst run on.', shop_why_cell: 'You are running low on volts. A cell fills you up.', shop_why_buy: 'If I were you: {item}. You can afford it, and it will change how you fight.', shop_why_save: 'Nothing here is in reach yet. Save {n} more scrap for {item}.', shop_why_none: 'You have everything on my shelf. Nothing to buy today.',
    ring_dormant: 'The ring is dormant. What holds this place has not woken it.', hz_back: 'Thrown back to the last safe ground she stood on.', pg_seam_high: 'Something is cached on the shelf above. Too high for one jump — come back when she can climb the air.' },
  ar: { pure_first: 'أوّل من تطهّر', pure_firstd: 'تذكّر من كان — وأين خبّأ قطعته الاحتياطية. نواةٌ، وهي لكِ إلى الأبد: حياةٌ إضافية دائمة.', pure_core: 'نواةٌ، هديّة', pure_cored: 'المطهَّرون تحدّثوا فيما بينهم. أحدهم احتفظ بنواةٍ طوال ذلك كلّه، ويريدها لكِ.', pure_scrap: 'ما احتفظوا به', pure_scrapd: 'جمع المطهَّرون ما أخفوه عن الأغنية: %s خردة.', pure_next: 'تطهّر: %n. عند %m يعطون من جديد.', pure_all: 'تطهّر: %n. كلّهم رهن إشارتك.', gear_how: 'استخدميه: %k', gear_how_arm: 'بدّلي البدلة: %k', gear_how_wall: 'استخدميه: اقفزي نحو جدار واضغطي باتجاهه؛ اقفزي ثانيةً للارتداد.', bag_gear: 'النصال والقدرات والأزرار التي تشغّلها: العتاد — %k', gear_seeit: 'صار في العتاد الآن (%k) مع الزر الذي يشغّله.', nf_break1: 'ناب العدم — قيدٌ ينكسر. صار أسرع.', nf_break2: 'ناب العدم — القيد الأخير ينكسر. لن يستريح بعد الآن.', map_locked: 'لا خريطة لهذه البلاد بعد. أحد عملاء العين يحتفظ بالمسح — طهّريه، والخريطة لكِ.', map_goal: 'الهدف', shop_pick: 'اختيار راتشيت', shop_browse: 'تصفّح', shop_later: 'ليس الآن', shop_why_pack: 'لا تملكين حزمة بعد. حزمة الفولت أوّل ما تحتاجينه — عليها يقوم الشفاء والانفجار.', shop_why_cell: 'فولتاتكِ قليلة. خليّة واحدة تملؤكِ.', shop_why_buy: 'لو كنتُ مكانكِ: {item}. تقدرين على ثمنه، وسيغيّر طريقة قتالكِ.', shop_why_save: 'لا شيء هنا في متناولكِ بعد. ادّخري {n} خردة أخرى من أجل {item}.', shop_why_none: 'عندكِ كلّ ما على رفّي. لا شيء يُشترى اليوم.',
    ring_dormant: 'الحلقة خامدة. من يملك هذا المكان لم يوقظها بعد.', hz_back: 'أُعيدت إلى آخر أرضٍ آمنة وقفت عليها.', pg_seam_high: 'شيء مخبّأ على الرفّ في الأعلى. أعلى من قفزة واحدة — عودي حين تتعلّمين تسلّق الهواء.' },
  tr: { pure_first: 'İLK ARINAN', pure_firstd: 'Kim olduğunu hatırlıyor — ve yedeğini nereye sakladığını. Bir ÇEKİRDEK, artık senin: kalıcı bir can daha.', pure_core: 'BİR ÇEKİRDEK, ARMAĞAN', pure_cored: 'Arınanlar birbirleriyle konuştu. İçlerinden biri baştan sona bir çekirdek saklamış ve senin almanı istiyor.', pure_scrap: 'SAKLADIKLARI', pure_scrapd: 'Arınanlar şarkıdan gizlediklerini bir araya getirdi: %s hurda.', pure_next: 'Arınan: %n. %m olunca yine verecekler.', pure_all: 'Arınan: %n. Hepsi senin çağrına hazır.', gear_how: 'Kullan: %k', gear_how_arm: 'Zırh değiştir: %k', gear_how_wall: 'Kullan: bir duvara zıpla ve ona doğru bas; sekmek için tekrar zıpla.', bag_gear: 'Kılıçlar, güçler ve onları kullanan tuşlar: DONANIM — %k', gear_seeit: 'Artık DONANIM\'da (%k), onu kullanan tuşla birlikte.', nf_break1: 'NULLFANG — bir bağ kopuyor. Artık daha hızlı.', nf_break2: 'NULLFANG — son bağ kopuyor. Bir daha dinlenmeyecek.', map_locked: 'Bu toprakların haritası henüz yok. Ölçümü Göz\'ün bir ajanı tutuyor — onu arındır, harita senin olsun.', map_goal: 'Hedef', shop_pick: 'RATCHET\'İN SEÇİMİ', shop_browse: 'Göz at', shop_later: 'Şimdi değil', shop_why_pack: 'Henüz paketin yok. Volt Paketi ilk ihtiyacın — iyileşme de patlama da onunla çalışır.', shop_why_cell: 'Voltun azalıyor. Bir hücre seni doldurur.', shop_why_buy: 'Yerinde olsam: {item}. Paran yetiyor ve dövüşünü değiştirir.', shop_why_save: 'Burada henüz gücünün yettiği bir şey yok. {item} için {n} hurda daha biriktir.', shop_why_none: 'Rafımdaki her şey sende. Bugün alacak bir şey yok.',
    ring_dormant: 'Halka uykuda. Bu yeri tutan onu henüz uyandırmadı.', hz_back: 'Bastığı son güvenli zemine geri atıldı.', pg_seam_high: 'Yukarıdaki rafta bir şey saklı. Tek zıplayışa fazla yüksek — havayı tırmanabildiğinde geri gel.' },
  zh: { pure_first: '第一个被净化者', pure_firstd: '它想起了自己是谁——也想起了备用件藏在哪里。一枚核心，归你所有：永久多一条命。', pure_core: '一枚核心，赠予', pure_cored: '被净化者们互相通了气。其中一个把一枚核心留到了现在，想让你拿去。', pure_scrap: '它们留下的东西', pure_scrapd: '被净化者们把躲过歌声藏起来的东西凑到了一起：%s 废料。', pure_next: '已净化：%n。到 %m 时，它们会再次回赠。', pure_all: '已净化：%n。它们每一个都听你召唤。', gear_how: '使用：%k', gear_how_arm: '切换战衣：%k', gear_how_wall: '使用：跳向墙壁并按住该方向；再跳一次即可蹬墙。', bag_gear: '武器、能力和对应按键都在「装备」里——%k', gear_seeit: '它现在在「装备」里（%k），旁边写着使用它的按键。', nf_break1: 'NULLFANG——一道束缚断了。它更快了。', nf_break2: 'NULLFANG——最后一道束缚断了。它不会再歇息。', map_locked: '这片土地还没有地图。测绘记录握在「眼」的一名特工手里——净化它，地图就是你的。', map_goal: '目标', shop_pick: '拉切特推荐', shop_browse: '看看货', shop_later: '以后再说', shop_why_pack: '你还没有电包。伏特电包是你最先需要的——治疗和爆发都靠它。', shop_why_cell: '你的伏特不多了。一块电池就能充满。', shop_why_buy: '换作是我：{item}。你买得起，它会改变你的打法。', shop_why_save: '这里暂时没有你买得起的。再攒 {n} 废料买 {item}。', shop_why_none: '我架上的东西你都有了。今天没什么可买。',
    ring_dormant: '这道环沉睡着。守着此地的那位还没有唤醒它。', hz_back: '她被抛回了上一次站稳的安全地面。', pg_seam_high: '上面的石架上藏着东西。一跳够不着——等她学会在空中再跳一次时回来。' },
  ru: { pure_first: 'ПЕРВЫЙ ОЧИЩЕННЫЙ', pure_firstd: 'Он вспомнил, кем был — и где спрятал запасное. ЯДРО, и оно твоё навсегда: ещё одна жизнь.', pure_core: 'ЯДРО В ДАР', pure_cored: 'Очищенные поговорили между собой. Один из них сберёг ядро через всё это и хочет отдать его тебе.', pure_scrap: 'ЧТО ОНИ СБЕРЕГЛИ', pure_scrapd: 'Очищенные собрали то, что прятали от песни: %s лома.', pure_next: 'Очищено: %n. На %m они одарят снова.', pure_all: 'Очищено: %n. Каждый из них откликнется на твой зов.', gear_how: 'Применить: %k', gear_how_arm: 'Сменить костюм: %k', gear_how_wall: 'Применить: прыгни к стене и держи к ней; прыгни ещё раз, чтобы оттолкнуться.', bag_gear: 'Клинки, способности и клавиши для них: СНАРЯЖЕНИЕ — %k', gear_seeit: 'Теперь это в СНАРЯЖЕНИИ (%k), вместе с клавишей.', nf_break1: 'NULLFANG — путы рвутся. Теперь он быстрее.', nf_break2: 'NULLFANG — рвутся последние путы. Больше он не отдыхает.', map_locked: 'Карты этих земель пока нет. Съёмку хранит один из агентов Ока — очисти его, и карта твоя.', map_goal: 'Цель', shop_pick: 'ВЫБОР РАТЧЕТА', shop_browse: 'Посмотреть', shop_later: 'Не сейчас', shop_why_pack: 'У тебя ещё нет блока. Вольт-блок нужен первым — на нём работают и лечение, и разряд.', shop_why_cell: 'Вольт осталось мало. Одна ячейка зарядит тебя.', shop_why_buy: 'На твоём месте я бы взял: {item}. Тебе хватает, и это изменит твой бой.', shop_why_save: 'Пока тебе здесь ничего не по карману. Накопи ещё {n} лома на {item}.', shop_why_none: 'У тебя есть всё с моей полки. Сегодня покупать нечего.',
    ring_dormant: 'Кольцо спит. Тот, кто держит это место, ещё не разбудил его.', hz_back: 'Её отбросило на последнюю безопасную опору.', pg_seam_high: 'На полке наверху что-то припрятано. Одним прыжком не достать — вернись, когда научишься взбираться по воздуху.' },
});
