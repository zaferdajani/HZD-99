// One tutorial controller. The semantic CURRENT PROMPT owns input policy;
// saved step IDs never override an approach/return prompt in another room.
const TUTORIAL_NAV = new Set(['LEFT', 'RIGHT', 'JUMP', 'UP', 'DOWN', 'PAUSE', 'BACK']);
const TUTORIAL_DISCRETE = new Set(['JUMP', 'UP', 'ATK', 'INT', 'HEAL', 'SKILL']);
const tutorialFrozen = new Map();

function tutorialStep() {
  if (!G || !G.save || !G.tut || !player || player.dead || G.save.flags.tut
      || TUT_ROOMS[G.roomId] === undefined) return null;
  return TUT_STEPS[G.tut.i] || null;
}
function tutJumpAtObstacle() {
  if (!player || !player.on || G.roomId !== 'W2') return false;
  const dir = player.vx < -8 ? -1 : player.vx > 8 ? 1 : player.face || 1;
  const feet = player.y + player.h, row = Math.floor((feet - 1) / TILE);
  const edge = dir > 0 ? player.x + player.w : player.x;
  // Reachable one-way shelves are jump opportunities, not collision walls.
  // W2's authored lesson is the row-11 shelf; its later hull is a walkable
  // ramp. Requiring a >24px solid face could never announce the actual lesson.
  if (typeof tileAt === 'function') {
    const pc = player.x + player.w / 2;
    const reach = typeof JUMP_V === 'number' ? Math.min(200, JUMP_V * JUMP_V / 4400) : 190;
    for (let tx = Math.floor((pc-40)/TILE); tx <= Math.floor((pc+40)/TILE); tx++) {
      for (let ty = Math.floor((feet-reach)/TILE); ty <= Math.floor((feet-48)/TILE); ty++) {
        if (tileAt(tx,ty) !== '=') continue;
        // A platform behind a solid ceiling is not reachable from this side.
        let clear = true;
        for (let y=ty+1; y<=row; y++) if (solidAt(tx,y)) { clear=false; break; }
        if (clear) return true;
      }
    }
  }
  for (let dx = 6; dx <= 60; dx += 6) {
    const tx = Math.floor((edge + dir * dx) / TILE);
    if (!solidAt(tx, row)) continue;
    let top = row;
    while (top > 0 && solidAt(tx, top - 1)) top--;
    // Small surface irregularities are step-ups, not jump lessons. A ceiling
    // somewhere ahead is not a floor obstacle either.
    const rise = feet - top * TILE;
    if (rise > PLAYER_STEP_UP && rise < 120) return true;
  }
  return false;
}
function tutorialReady(p) {
  if (!p || !player || !TUTORIAL_DISCRETE.has(p.action)) return false;
  if (p.action === 'JUMP') return tutJumpAtObstacle();
  if (p.action === 'ATK') {
    const e = (G.enemies || []).find(q => q && !q.dead && q.hp > 0);
    return !!e && Math.abs(e.x + e.w/2 - player.x - player.w/2) <= 68
      && Math.abs(e.y + e.h/2 - player.y - player.h/2) <= 58;
  }
  if (p.action === 'UP') {
    const d = typeof gateHere === 'function' && player.on && gateHere();
    return !!d && !!p.target && Math.abs(gateWorldX(d) - p.target.x) < 2;
  }
  if (p.action === 'INT') {
    // An unrelated nearby object must not freeze travel to the actual target.
    const n = G.near;
    return !!n && !!p.target && Math.abs(n.x+n.w/2-p.target.x) < 2
      && Math.abs(n.y+n.h/2-p.target.y) < 2;
  }
  if (p.action === 'HEAL') return player.cores < player.maxCores() && player.volts >= 33;
  if (p.action === 'SKILL') return (G.save.iq || 0) > 0;
  return false;
}
function tutorialContext() {
  const s = tutorialStep();
  const suspended = G.state !== 'PLAY' || G.dialog || G.cut || G.gateWalk || G.wake
    || G.bossEntry || (typeof inputSuspended !== 'undefined' && inputSuspended);
  if (!s || suspended || G.tut.hold > 0) return { step:s, prompt:null, ready:false };
  const p = tutPrompt(s);
  return { step:s, prompt:p, ready:tutorialReady(p) };
}
function tutorialRelease() {
  for (const [e, saved] of tutorialFrozen) {
    if (e.update === saved.frozenUpdate) e.update = saved.update;
    // Do not erase knockback that an accepted strike has just applied.
    if (e.vx === 0) e.vx = saved.vx;
    if (e.vy === 0) e.vy = saved.vy;
  }
  tutorialFrozen.clear();
  G.tutorialLock = null;
  G.walkthroughLock = null; G.tutHardLock = null; // retire old transient state
}
function tutorialTick() {
  const ctx = tutorialContext(), p = ctx.prompt, s = ctx.step;
  if (!s || !p || !ctx.ready || p.action === 'MOVE') { tutorialRelease(); return; }
  const L = G.tutorialLock;
  if (!L || L.id !== s.id || L.room !== G.roomId || L.action !== p.action) {
    tutorialRelease();
    G.tutorialLock = { id:s.id, room:G.roomId, action:p.action, active:true };
  }
  // No player.x pin and no input-array clearing. The instruction filters
  // unrelated controls, not the physical input edge it is trying to teach.
  player.vx = 0;
  if (s.id === 'jump') G.tut.jumpShown = true;
  for (const e of (G.enemies || [])) {
    if (!e || e.dead || tutorialFrozen.has(e)) continue;
    const frozenUpdate = function() {};
    tutorialFrozen.set(e, { update:e.update, frozenUpdate, vx:e.vx, vy:e.vy });
    e.update = frozenUpdate; e.vx = 0; e.vy = 0;
  }
}
function tutorialAllows(action) {
  // Menus/dialogue own their controls. A gameplay lesson cannot block buying,
  // choosing a skill, leaving a shop, pausing, or skipping a story film.
  if (action === 'PAUSE' || action === 'BACK' || G.state !== 'PLAY' || G.dialog
      || G.cut || G.gateWalk || G.wake) return true;
  const ctx = tutorialContext();
  if (!ctx.step) return true;
  if (ctx.ready && ctx.prompt) return action === ctx.prompt.action;
  // The acknowledgement beat releases navigation immediately. A jump that
  // just succeeded must be steerable in the air, not pinned for 0.7 seconds.
  if (TUTORIAL_NAV.has(action)) {
    if (ctx.step.id === 'move') return action === 'LEFT' || action === 'RIGHT';
    if (action === 'UP' || action === 'DOWN') return false;
    return true;
  }
  // Travel never grants untaught powers. UI navigation outside PLAY is above.
  const need = TUT_UNLOCK[action];
  if (need) return G.tut.i >= TUT_STEPS.findIndex(q => q.id === need)
    && !(ctx.prompt && ctx.prompt.action === 'MOVE' && ['ATK','INT','HEAL','SKILL'].includes(action));
  return action === 'MAP' || action === 'OK';
}
// Retain the public diagnostic interface used by release tools, without
// patching draw(), input getters or clearP() a second time.
if (typeof window !== 'undefined') window.__tutorialEnforcement = {
  step: () => { const s = tutorialStep(); return s && s.id; },
  lock: () => G.tutorialLock ? { ...G.tutorialLock } : null,
  prompt: () => { const s=tutorialStep(); return s ? tutPrompt(s) : null; }
};
