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
    const e = (G.enemies || []).find(q => q && !q.dead && !q.disabled && q.hp > 0);
    // in reach of the BODY, not its centre: the yard winch is 120 px wide,
    // and standing against its housing is standing in reach of it
    return !!e && Math.abs(e.x + e.w/2 - player.x - player.w/2) <= Math.max(68, e.w / 2 + 34)
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
    if (e.vx === 0) e.vx = saved.vx;
    if (e.vy === 0) e.vy = saved.vy;
  }
  tutorialFrozen.clear();
  G.tutorialLock = null;
  G.walkthroughLock = null; G.tutHardLock = null; // retire old transient state
}
// THE ONE HOLD LEFT IS THE JUMP (owner, 2026-10-09: "fix the input enforcer
// so it never blocks the action being taught next or freezes her
// pointlessly"). The beam in W2 is walk-up height, so a player who is not held
// at it walks over it and never presses jump — the lesson IS standing at the
// obstacle with the jump being the way on. Every other lesson leaves her free
// to move: she can walk off and come back, and the enemies are not frozen
// mid-swing any more — the waking floor's one machine is calm for the whole
// walk instead (updateTutor), which is the same safety without a statue.
function tutorialTick() {
  const ctx = tutorialContext(), p = ctx.prompt, s = ctx.step;
  if (!s || !p || !ctx.ready || p.action !== 'JUMP') { tutorialRelease(); return; }
  const L = G.tutorialLock;
  if (!L || L.id !== s.id || L.room !== G.roomId || L.action !== p.action) {
    tutorialRelease();
    G.tutorialLock = { id:s.id, room:G.roomId, action:p.action, active:true };
  }
  player.vx = 0;
  G.tut.jumpShown = true;
}
const TUTORIAL_VERBS = ['ATK', 'INT', 'HEAL', 'SKILL'];
function tutorialAllows(action) {
  // Menus/dialogue own their controls. A gameplay lesson cannot block buying,
  // choosing a skill, leaving a shop, pausing, or skipping a story film.
  if (action === 'PAUSE' || action === 'BACK' || G.state !== 'PLAY' || G.dialog
      || G.cut || G.gateWalk || G.wake) return true;
  const ctx = tutorialContext();
  if (!ctx.step) return true;
  const p = ctx.prompt, i = G.tut.i;
  // At the obstacle, the jump is the way on (tutorialTick).
  if (ctx.ready && p && p.action === 'JUMP') return action === 'JUMP';
  // The control being taught always answers when she is where it works.
  if (ctx.ready && p && action === p.action) return true;
  // Walking and jumping are never taken away: they are the first two things
  // anyone tries, and a player who wants to look around is not breaking the
  // lesson. DOWN is a crouch/drop and is free once the claw is taught.
  if (action === 'LEFT' || action === 'RIGHT' || action === 'JUMP') return true;
  if (action === 'DOWN') return i >= TUT_STEPS.findIndex(q => q.id === 'atk');
  // UP walks through a door: the one the step points at, or — backtracking
  // stays voluntary — any door she is actually standing at.
  if (action === 'UP') return !!(typeof gateHere === 'function' && player && player.on && gateHere());
  // Travel never grants untaught powers, and while she is being walked to a
  // target the verbs wait — one instruction, one thing to do.
  const need = TUT_UNLOCK[action];
  if (need) {
    if (i < TUT_STEPS.findIndex(q => q.id === need)) return false;
    if (TUTORIAL_VERBS.includes(action) && p && (p.action === 'MOVE' || p.action === 'UP')) return false;
    if (TUTORIAL_VERBS.includes(action) && p && ctx.ready && action !== p.action) return false;
    return true;
  }
  return action === 'MAP' || action === 'OK';
}
// Retain the public diagnostic interface used by release tools, without
// patching draw(), input getters or clearP() a second time.
if (typeof window !== 'undefined') window.__tutorialEnforcement = {
  step: () => { const s = tutorialStep(); return s && s.id; },
  lock: () => G.tutorialLock ? { ...G.tutorialLock } : null,
  prompt: () => { const s=tutorialStep(); return s ? tutPrompt(s) : null; }
};
