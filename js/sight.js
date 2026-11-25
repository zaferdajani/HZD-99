// ===========================================================================
// THEY SEE HER (owner, 2026-11-25, of the meadow's shielded walker: "Seeing me
// should activate it, make it come to me. Give the enemies self awareness, not
// just roaming around. It shows them as roaming at first, but once they see
// me, they come to me. All of them, not just one").
//
// Every ordinary machine walked its beat whatever she did, and turned to her
// only once she was inside the 160 px its wind-up is armed from — so from
// across a room she was furniture to it. Now each one LOOKS:
//
//   ROAM   it walks its beat (or hangs, or sweeps) exactly as before;
//   SEE    she is in front of it inside SIGHT.range, near its own level, and
//          no solid tile stands between its eye and her (a walk along the
//          tile grid, never through a wall). Right on its back it feels her;
//   ALERT  it turns to her, stands for a beat and says so — a struck plate,
//          a recorded take, never a light: no ring, rim or halo round a body;
//   COME   a walker follows her along the ground and stops at the edge of what
//          it stands on and at a wall it cannot step (never off a ledge, never
//          into a wall); a flier homes in; a turret or a plumbed machine turns
//          and aims only — it has no feet to come with;
//   LOSE   out of sight for SIGHT.memory seconds it gives up and roams again.
//
// A blow is seen too: a machine struck from behind knows where she is.
//
// CHEAP, because the phone is the floor: the range, level and front tests are
// arithmetic, and only when they pass is the tile grid walked — a DDA over the
// tiles between eye and her (a dozen lookups at the most), and only once every
// SIGHT.look seconds per machine. Nothing is allocated per frame.
//
// The pack and the cats keep their own hunts (js/wolfhunt.js,
// js/cheetahhunt.js): they already notice, display and come. What they took
// from here is the wall — `foeLOS` — so none of them sees through rock either.
// Bosses, agents, NPCs and anything calm, tamed or purified never reach this
// (Enemy.update returns before the kinds' cases for those). tests/enemy-sight.cjs
// ===========================================================================
const SIGHT = {
  range: 300,      // px ahead of it: how far it sees
  behind: 56,      // px behind it: she is right on its back and it feels her
  band: 110,       // px above or below its eye
  keep: 430,       // px: once it is on her it keeps her in view this far, any side
  memory: 3,       // s out of sight before it gives up and goes back to its beat
  look: 0.15,      // s between looks (one walk of the tile grid per look)
  alert: 0.5,      // s: the beat between seeing her and coming for her
  hold: 22,        // px between its edge and hers where a walker stops crowding
};
// a heavier body takes a longer beat to come round and set itself
const SIGHT_ALERT = { guard: 0.7, blob: 0.6 };
// how fast each walker comes, × its own patrol speed — heavy and deliberate
// for the armoured walker, a drag for the melt
const SIGHT_CHASE = { guard: 1.4, crawler: 1.5, blob: 1.7 };
// further for the ones that shoot or wait for her: their own band's reach
const SIGHT_RANGE = { turret: 440, flier: 340, bat: 260, surge: 260, kiln: 240, rime: 270, snare: 280 };
// what the alert sounds like: a recorded take of what the body is made of
// (audio.js HIT_BANK, CC0), never the same take twice running
const SIGHT_CUE = { guard: 'notice_guard', blob: 'notice_blob', flier: 'notice_light', bat: 'notice_light' };

// IS THE LINE FROM (x0,y0) TO (x1,y1) CLEAR OF SOLID TILES? A grid walk
// (Amanatides & Woo): every tile the segment passes through, in order, and
// nothing else. The tile the eye is in is not asked — an eye set into the
// lip of the ground it stands on is not blind.
function sightClear(x0, y0, x1, y1) {
  let tx = Math.floor(x0 / TILE), ty = Math.floor(y0 / TILE);
  const ex = Math.floor(x1 / TILE), ey = Math.floor(y1 / TILE);
  const dx = x1 - x0, dy = y1 - y0;
  const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1;
  const adx = Math.abs(dx), ady = Math.abs(dy);
  const tdx = adx > 1e-6 ? TILE / adx : Infinity, tdy = ady > 1e-6 ? TILE / ady : Infinity;
  let tmx = adx > 1e-6 ? (sx > 0 ? (tx + 1) * TILE - x0 : x0 - tx * TILE) / adx : Infinity;
  let tmy = ady > 1e-6 ? (sy > 0 ? (ty + 1) * TILE - y0 : y0 - ty * TILE) / ady : Infinity;
  for (let n = 0; n < 48; n++) {
    if (tx === ex && ty === ey) return true;
    if (tmx < tmy) { tmx += tdx; tx += sx; } else { tmy += tdy; ty += sy; }
    if (!(tx === ex && ty === ey) && solidAt(tx, ty)) return false;
  }
  return true;
}
// where it looks from: high on its body, where the sensor is
function foeEyeY(e) { return e.y + e.h * 0.3; }
// the first look is staggered by where it was put, so a room of machines does
// not all walk the grid on the same frame — and the same room looks on the
// same frames at any frame rate
// (the FIRST look is taken at once — a machine she walks in on sees her on
// that frame, as it always reached for her — and the stagger is laid on the
// gap after it)
function foeLookStart(e) { return ((Math.abs(Math.round(e.sx || e.x)) * 7 + Math.abs(Math.round(e.sy || e.y)) * 13) % 97) / 97 * SIGHT.look; }

// LINE OF SIGHT ONLY, re-looked every SIGHT.look on the caller's clock — what
// the pack's and the cats' own hunts ask before they notice her (their ranges
// and their displays stay their own).
function foeLOS(e, dt, px, py, cx) {
  if (e._losT == null) e._losT = 0;
  if ((e._losT -= dt) <= 0 || e._los == null) {
    e._losT = SIGHT.look;
    e._los = sightClear(cx, foeEyeY(e), px, py);
  }
  return e._los;
}

// DOES IT SEE HER, this look? `omni` for a body with no front to it (a flier,
// a turret, a plumbed machine): range and the wall only.
function foeSees(e, px, py, cx, omni) {
  const ey = foeEyeY(e), dx = px - cx, dy = py - ey, ad = Math.abs(dx);
  const on = (e.aware || 0) > 0;
  const range = on ? Math.max(SIGHT.keep, SIGHT_RANGE[e.kind] || 0) : (SIGHT_RANGE[e.kind] || SIGHT.range);
  if (ad > range) return false;
  if (omni) { if (Math.abs(dy) > range) return false; }
  else {
    if (Math.abs(dy) > SIGHT.band * (on ? 1.4 : 1)) return false;
    // in FRONT of it, unless it is already on her or she is right on its back
    if (!on && ad > SIGHT.behind + e.w / 2 && Math.sign(dx) !== faceSide(e)) return false;
  }
  return sightClear(cx, ey, px, py);
}

// ONE STEP OF ITS ATTENTION. Returns 0 roaming, 1 the alert beat, 2 coming.
function foeAware(e, dt, px, py, cx, omni) {
  if (typeof player === 'undefined' || !player || player.dead) {
    e.aware = 0; e.lostT = 0; return 0;
  }
  if (e.lookT == null) e.lookT = dt;          // the first look is due now
  e.lookT -= dt;
  // `late`: how far past its due time this look is taken (a step is coarser
  // than a look on a slow phone). The beat is counted from when the look was
  // DUE, so it ends at the same moment at 30 fps as at 120.
  let late = 0;
  if (e.lookT <= 0) {
    late = -e.lookT;
    e.lookT += e.looked ? SIGHT.look : SIGHT.look * 0.5 + foeLookStart(e);
    e.looked = 1;
    if (e.lookT <= 0) { e.lookT = SIGHT.look; late = 0; }
    e.seen = foeSees(e, px, py, cx, omni);
  }
  const side = Math.sign(px - cx) || e.dir || 1;
  if (!e.aware) {
    // struck from where it could not see: it knows now, and turns on the blow
    if ((e.hurtT || 0) > 0) { e.aware = 2; e.lostT = 0; e.seen = true; if (e.dir) e.dir = side; return 2; }
    if (!e.seen) return 0;
    e.aware = 1; e.awareT = (SIGHT_ALERT[e.kind] || SIGHT.alert) - late; e.lostT = 0;
    if (e.dir) e.dir = side;                 // (a plumbed machine has no facing: dir 0 stays 0)
    e.alertN = (e.alertN | 0) + 1;           // counted, for tests/enemy-sight.cjs
    if (typeof sfx === 'function') sfx(SIGHT_CUE[e.kind] || 'notice');
    return 1;
  }
  if (e.seen) e.lostT = 0;
  else if ((e.lostT = (e.lostT || 0) + dt) > SIGHT.memory) { e.aware = 0; e.lostT = 0; return 0; }
  if (e.aware === 1 && (e.awareT -= dt) <= 0) e.aware = 2;
  return e.aware;
}

// A WALL IT CANNOT STEP: solid in the column just ahead of it, above the
// height its feet climb (moveEnt's step-up).
function foeWallAhead(e, dir) {
  const tx = Math.floor((dir > 0 ? e.x + e.w + 2 : e.x - 2) / TILE);
  const feet = e.y + e.h;
  const top = Math.min(feet - ENEMY_STEP_UP - 4, e.y + 4);
  for (let y = feet - ENEMY_STEP_UP - 4; y >= top - 0.5; y -= TILE) if (solidAt(tx, Math.floor(y / TILE))) return true;
  return solidAt(tx, Math.floor(top / TILE));
}
// A WALKER COMES FOR HER along the ground it is on. The beat: it stands and
// turns (enemyGait turns a body only once it has stopped). Then it walks at
// her, at its own heavier-than-patrol pace, and stops short of crowding her,
// at the edge of what it stands on and at a wall it cannot step. It never
// leaves its ground to reach her: at an edge it holds, facing her.
// Returns 2 through the beat (nothing arms during it), 1 while it comes.
function foeChase(e, dt, px, cx, aw, pace) {
  const want = Math.sign(px - cx) || e.dir || 1;
  e.dir = want;
  if (aw === 1) { enemyGait(e, 0, dt); e.chaseHold = 0; return 2; }
  const gap = Math.abs(px - cx) - e.w / 2 - (player.w || 24) / 2;
  const reach = Math.abs(e.vx || 0) * 0.12;
  const edge = typeof huntGround === 'function' ? !huntGround(e, want, reach) : !groundAhead(e, want);
  const wall = foeWallAhead(e, want);
  e.chaseHold = edge || wall ? 1 : 0;
  const v = (gap <= SIGHT.hold || e.chaseHold) ? 0 : e.spd * (SIGHT_CHASE[e.kind] || 1.3) * (pace == null ? 1 : pace);
  enemyGait(e, want * v, dt);
  return 1;
}
