// ===========================================================================
// THE WOLF KING'S OWN MOVES (owner, 2026-11-15: "as for the Wolf King, the
// Alpha, you need to add special effects, special moves, special attacks.
// With sound effects and visual effects to improve it.")
//
// The Alpha had five skills and almost no light: a claw and a bite that were
// a burst of eight sparks each, a leap, a howl and a roar drawn as one ring.
// This file is what it gained. Nothing here shortens a tell or closes an
// opening — every new blow is announced for at least as long as the one it
// stands beside, and each ends in the same rest the old ones did.
//
//   REND    a special ATTACK, from the middle distance (it alternates with
//           the leap there). It rears for TELL_SWIPE with the floor in front
//           of it lit the whole length the blow will run, then rakes the
//           ground: three claw-waves tear along the terrain, 300 px, waist
//           high. The answer is to be in the air when they arrive — or
//           behind it, or past their reach. In FURY a second set follows.
//   FURY    a special MOVE, once, at half health: it stops, throws its head
//           back for TELL_HEAVY, and the roar that comes out hurts no one —
//           it THROWS her back, lights the room red and changes the fight:
//           the king burns from then on, prowls faster, rends twice, and
//           every leap that lands shakes the ground it lands on.
//   QUAKE   what a fury leap does when it MISSES: the landing is a shock
//           through the floor, 120 px each way. It is painted on the ground
//           where it will land from the moment the king coils, so the read is
//           the same read as the leap itself — do not be standing there.
//
// And every old move wears its effect now (js/fxgl.js): the claw's arc, the
// jaws shutting, each whip of the clinch, the howl's pillar and the pack
// arriving in red, the roar's wave through the ground it stands on.
// Ground-anchored light respects G.artProbe, like all of it.
// ===========================================================================
const ALPHA_FX = {
  rendV: 440,          // px/s along the ground
  rendReach: 300,      // px: how far a wave runs
  rendH: 40,           // px: how tall it stands — a plain jump clears it twice over
  rendW: 30,
  rendAgain: 0.17,     // s: the fury's second set follows the first by this
  furyAt: 0.5,         // of its health
  furyPush: 250,       // px: she is thrown back from inside this
  furySpd: 1.15,       // × its prowl, once it burns
  quake: 120,          // px each way from where a fury leap lands
  ghosts: 5,
};
const ALPHA_RED = '#ff3b4f', ALPHA_HOT = '#ffe9d6';
function alphaFloorY(b) { return b.y + b.h; }
function alphaLive(b) { return !!b && !b.dead && !b.purified && !b.tamed; }

// ---- FURY ------------------------------------------------------------------
// Asked at the top of every step. It only ever begins from open ground time
// (a rest, or the turn after a missed leap) so no blow in progress is cut
// short, and it is a wind-up like any other: named *warn, so TELL_ST gives it
// the amber and the warning sound.
//
// IT FOLLOWS THE MIDPOINT, IT DOES NOT REPLACE IT. Every guardian already
// staggers for a second and a half as it crosses half health (Boss.update:
// "a moment of relief immediately before the hardest part") and that free
// punish is hers. The fury is what the king does when it gets back up — so it
// is never begun while the stagger is still on it.
function alphaFuryDue(b) {
  return alphaLive(b) && !b.fury && !b.furying && b.hp > 0 && b.hp <= b.hpMax * ALPHA_FX.furyAt
    && (b.st === 'rest' || b.st === 'idle') && b.on !== false && !((b.stagT || 0) > 0);
}
function alphaFuryBegin(b) {
  b.furying = 1; b.st = 'furywarn'; b.t = TELL_HEAVY; b.windT = TELL_HEAVY; b.fired = false; b.vx = 0;
  if (typeof sfx === 'function') sfx('alpha_furywarn');
  if (typeof fx === 'function') b.coilFx = fx('gather', b.cx(), b.y + b.h * 0.35, { rx: 190, ry: 150, dur: TELL_HEAVY, col: ALPHA_RED, hot: ALPHA_HOT, follow: b, power: 1.1 });
}
function alphaFuryFire(b, px, py) {
  b.fury = 1; b.furying = 0;
  const cx = b.cx(), fy = alphaFloorY(b);
  // IT THROWS HER, IT DOES NOT HURT HER. The moment is the change in the
  // fight, and a change she is punished for watching is one she learns to
  // look away from.
  const d = px - cx;
  if (!player.dead && Math.abs(d) < ALPHA_FX.furyPush && Math.abs(py - b.cy()) < 150) {
    const s = Math.sign(d) || -b.face;
    player.vx = s * 430; player.vy = Math.min(player.vy, -210);
    player.knockT = Math.max(player.knockT || 0, 0.22);
    if (typeof padRumble === 'function') padRumble(0.9, 0.9, 520);
  }
  if (typeof sfx === 'function') sfx('alpha_fury');
  cam.shake = Math.max(cam.shake, 13);
  // the roar itself: the room bends as it goes out, twice — the blast, and
  // the note still ringing after it (js/ripple.js). Its own throw moved her;
  // the wave only passes.
  alphaWave(b, { R: 600, dur: 1.05, amp: 34, width: 70, col: ALPHA_RED, fronts: 3, gap: 0.12, nudge: 8, shimmer: 3.4, pulse: 0.26 });
  alphaWave(b, { R: 680, dur: 1.5, amp: 12, width: 96, col: '#b06aff', fronts: 2, gap: 0.24, nudge: 0, delay: 0.6, dust: false, light: 0.5, pulse: 0, shimmer: 1.2 });
  b.rumbleT = 0.7;
  if (typeof fx === 'function') {
    // (no pillar of light out of him and no flash round him, 2026-11-24: the ledger's light round a
    // body. The fury is the room bending, the floor cracking and the red grade — alphaAura)
    if (!G.artProbe) {
      fx('ground', cx, fy - 2, { rx: 330, ry: 44, dur: 0.7, col: ALPHA_RED, hot: ALPHA_HOT, power: 1.4 });
      fx('cracks', cx, fy + 3, { rx: 230, ry: 30, dur: 2.2, col: '#c2182c', hot: ALPHA_HOT, power: 1.3 });
    }
  }
  burst(cx, b.cy(), 26, ALPHA_RED, 360, 0.7, -60, 3, true);
  // ...and the pack answers it: whoever is left comes in on the roar
  if (typeof alphaSummon === 'function') alphaSummon(b);
}
// what the fury looks like for the rest of the fight: embers off its back,
// and the ghosts of where it has just been whenever it moves fast
function alphaFuryAura(b, dt) {
  if ((b.auraT || 0) > 0) b.auraT -= dt;
  // the note is HELD: the screen trembles under it for as long as it lasts
  if ((b.rumbleT || 0) > 0) { b.rumbleT -= dt; cam.shake = Math.max(cam.shake, 3.2); }
  // breath going IN before a howl: motes drawn to the muzzle from all round it
  if ((b.st === 'broodcall' || b.st === 'furywarn') && alphaLive(b) && !G.artProbe && chance(dt * 40)) {
    const a = rnd(0, 6.28), d = rnd(70, 150), mx = b.cx() + (b.face || -1) * b.w * 0.3, my = b.y + b.h * 0.25;
    addPart(mx + Math.cos(a) * d, my + Math.sin(a) * d * 0.7, -Math.cos(a) * d * 2.4, -Math.sin(a) * d * 1.7, 0.36, b.st === 'furywarn' ? ALPHA_RED : '#ff8fb0', rnd(1.4, 2.4), 0, true);
  }
  if (!b.fury || !alphaLive(b) || G.artProbe) return;
  if (chance(dt * 22))
    addPart(b.cx() + rnd(-b.w * 0.5, b.w * 0.5), b.y + rnd(0, b.h * 0.6), rnd(-24, 24) - (b.vx || 0) * 0.08, rnd(-90, -30),
      rnd(0.35, 0.7), chance(0.3) ? '#ffb38a' : ALPHA_RED, rnd(1.6, 2.8), -40, true);
  const fast = Math.abs(b.vx || 0) > 190 || b.st === 'leap' || b.st === 'recoil';
  b.ghostT = (b.ghostT || 0) - dt;
  if (fast && b.ghostT <= 0) {
    b.ghostT = 0.045;
    const pick = alphaStripCell(b);
    if (pick) {
      (b.ghosts || (b.ghosts = [])).push({ x: b.cx(), y: b.y + b.h, key: pick.S.key, cell: pick.cell, cells: pick.S.cells, ch: pick.S.ch, fl: !!pick.S.float, face: b.face, t: 0.26 });
      if (b.ghosts.length > ALPHA_FX.ghosts) b.ghosts.shift();
    }
  }
  if (b.ghosts) for (let i = b.ghosts.length - 1; i >= 0; i--) if ((b.ghosts[i].t -= dt) <= 0) b.ghosts.splice(i, 1);
}

// ---- REND ------------------------------------------------------------------
function alphaRendBegin(b) {
  b.st = 'rendwarn'; b.t = TELL_SWIPE; b.windT = TELL_SWIPE; b.fired = false; b.rendDir = b.face || -1;
  if (typeof sfx === 'function') sfx('alpha_rendwarn');
}
function alphaRendThrow(b, late) {
  const d = b.rendDir || b.face || -1;
  (b.rends || (b.rends = [])).push({ x: b.cx() + d * (b.w * 0.5 + 10), y: alphaFloorY(b), dir: d, left: ALPHA_FX.rendReach, t: 0, seed: (b.rends ? b.rends.length : 0) * 3.7 + (late ? 1.3 : 0) });
  if (typeof sfx === 'function') sfx('alpha_rend');
  cam.shake = Math.max(cam.shake, late ? 4 : 6);
  if (typeof fx === 'function') fx('slash', b.cx() + d * 52, b.cy() + 6, { rx: 120, ry: 104, dur: 0.3, flip: d < 0, power: 3.6, col: b.fury ? ALPHA_RED : '#ff8a4a', hot: ALPHA_HOT });
  if (!G.artProbe) burst(b.cx() + d * b.w * 0.55, alphaFloorY(b) - 4, 12, '#c8925c', 240, 0.45, 300, 2.6);
}
// the waves outlive the state that threw them: stepped every frame the king
// is stepped, whatever it is doing by then
function alphaRendStep(b, dt) {
  const R = b.rends; if (!R || !R.length) return;
  for (let i = R.length - 1; i >= 0; i--) {
    const w = R[i]; w.t += dt;
    const adv = ALPHA_FX.rendV * dt;
    w.x += w.dir * adv; w.left -= adv;
    // it runs ON the ground the room has: up a mound, and it ends at a drop
    // or a wall (js/fxgl.js — the same lookup the ground effects stand on)
    const sy = typeof fxSurfaceY === 'function' ? fxSurfaceY(w.x, w.y, 30) : w.y;
    if (!(sy === sy) || w.left <= 0 || w.x < 8 || w.x > G.roomDef.w * TILE - 8) {
      if (!G.artProbe) burst(w.x, w.y - 10, 7, b.fury ? ALPHA_RED : '#ffb15a', 170, 0.3, 200, 2, true);
      R.splice(i, 1); continue;
    }
    w.y = sy;
    if (!G.artProbe && chance(dt * 40))
      addPart(w.x - w.dir * rnd(0, 18), w.y - rnd(0, 6), -w.dir * rnd(20, 90), rnd(-120, -30), 0.3, chance(0.5) ? '#c8925c' : (b.fury ? ALPHA_RED : '#ffb15a'), rnd(1.4, 2.4), 520);
    const hb = { x: w.x - ALPHA_FX.rendW / 2, y: w.y - ALPHA_FX.rendH, w: ALPHA_FX.rendW, h: ALPHA_FX.rendH };
    if (alphaLive(b) && !player.dead && player.iT <= 0 && aabb(hb, player)) {
      player.hurt(DF().edmg, w.x - w.dir * 12, 'alpha.rend', b);
      b.denied = (b.denied || 0) + 1; b.hitSince = true;
      R.splice(i, 1);
    }
  }
}

// ---- THE KING DOES NOT STAND AND TAKE IT -------------------------------------
// (owner, 2026-11-15, having beaten it: "defeating them while the alpha was
// super easy. There was no challenge... no attacks, super attacks, special
// attacks, movements, jumping around, howling... there was no skill testing at
// all.")
//
// Measured before any of this (tests/boss-skill.cjs keeps the bots): a player
// who walked up and pressed ATTACK twelve times a second, never once moving out
// of the way, killed it in 8.5 SECONDS and lost three cores — it got one claw,
// one leap and its fury out and was dead, so the rend, the howl and the roar
// were never seen at all. And a player who jumped on its back and struck DOWN
// over and over took 20 seconds and was never touched: nothing it owned
// reached the air above it. Everything he said was true.
//
// The kit was not the problem; being allowed to finish it was. So:
//
//   HIDE     a blow thrown INTO its wind-up or its strike turns on its hide
//            and lands at two fifths. The rests, the missed leap's spin and the
//            stagger are untouched — that is where the damage is, which is the
//            whole of "skill testing": hit it THEN.
//   SPRING   it will not be stood next to and mashed. The fourth blow of one
//            opening (the third, in fury) and it is gone — a spring back out of
//            reach, or a VAULT clean over her when its back is to a wall — and
//            what it lands into is a counter: the rend or the leap, announced.
//   SKYBITE  the answer to the air above it. Bounce off its back, or hang over
//            it, and it throws its muzzle up (0.3 s, named *warn*, so it wears
//            the amber and the warning) and snaps the air over its spine.
//            Strike down ONCE and drift off it: that is a hit she earned.
//   CHAIN    in fury a missed leap is not the end of it: it lands, coils short
//            and comes again — three pounces, each landing painted on the
//            floor before it leaves. The opening is after the LAST.
//   PACK     it opens the fight by calling them, and calls again as it burns.
//
// Nothing here is unannounced, and every one of them ends in a rest.
const ALPHA_WIT = {
  // (the gauntlet, 2026-11-24: a sword mash took two thirds of it. A blow into its attack is turned
  // to 15%, and an opening holds two blows — one in its fury — before it springs clear)
  hide: 0.15,
  evadeAt: 3, evadeAtFury: 2, evadeCD: 1.5,
  springV: 470, springUp: 270, vaultV: 440, vaultUp: 540, springGrace: 0.24,
  skyTell: 0.42, skyLive: 0.24, skyReach: 150, skyDwell: 0.30, skyPlunged: 0.7,
  chain: 2, chainTell: 0.42,   // (both were under the 0.40 s kingdom-1 floor)
};
function alphaOpen(b) { return b.st === 'rest' || b.st === 'idle' || b.st === 'turn' || (b.stagT || 0) > 0; }
// asked once a step, before the machine: keeps the hide current, and takes the
// state when the spring or the skybite is due. True when it took it.
function alphaWitStep(b, dt, px, py) {
  if (!b.onStruck) b.onStruck = () => { b.struckN = ((b.struckT || 0) > 0 ? (b.struckN || 0) : 0) + 1; b.struckT = 1.1; };
  if ((b.struckT || 0) > 0) b.struckT -= dt;
  if ((b.evadeCD || 0) > 0) b.evadeCD -= dt;
  if ((b.evadeT || 0) > 0) b.evadeT -= dt;
  if ((b.plungedT || 0) > 0) b.plungedT -= dt;
  const open = alphaOpen(b);
  // held in its jaws she cannot swing; a kick-off it has landed from is a rest
  b.hideK = (b.evadeT || 0) > 0 ? 0 : (open || b.st === 'recoil') ? 1 : ALPHA_WIT.hide;
  if (!alphaLive(b) || !player || player.dead || !open || (b.stagT || 0) > 0 || b.on === false) { b.overT = 0; return false; }
  // ---- the air above it ----
  const over = !player.on && Math.abs(px - b.cx()) < b.w * 0.55 && player.y + player.h < b.y + 10;
  b.overT = over ? (b.overT || 0) + dt : 0;
  if ((b.plungedT || 0) > 0 || b.overT >= ALPHA_WIT.skyDwell) {
    b.plungedT = 0; b.overT = 0;
    b.st = 'skywarn'; b.t = ALPHA_WIT.skyTell; b.windT = ALPHA_WIT.skyTell; b.fired = false; b.skyHit = false; b.vx = 0;
    if (typeof sfx === 'function') sfx('alpha_rendwarn');
    return true;
  }
  // ---- being mashed ----
  if ((b.struckN || 0) >= (b.fury ? ALPHA_WIT.evadeAtFury : ALPHA_WIT.evadeAt) && (b.evadeCD || 0) <= 0) {
    const away = -(Math.sign(px - b.cx()) || b.face || 1), W = G.roomDef.w * TILE;
    const cornered = away < 0 ? b.x < TILE * 5 : b.x + b.w > W - TILE * 5;
    b.struckN = 0; b.evadeCD = ALPHA_WIT.evadeCD; b.evadeT = ALPHA_WIT.springGrace;
    b.st = 'spring'; b.t = 0.9; b.springAir = 0;
    if (cornered) { b.vx = -away * ALPHA_WIT.vaultV; b.vy = -ALPHA_WIT.vaultUp; b.face = -away; }
    else { b.vx = away * ALPHA_WIT.springV; b.vy = -ALPHA_WIT.springUp; }
    b.on = false;
    if (typeof sfx === 'function') sfx('alpha_leap');
    if (!G.artProbe) burst(b.cx(), alphaFloorY(b) - 4, 10, '#c8925c', 220, 0.4, 300, 2.4);
    return true;
  }
  return false;
}
// its states, one branch of alphaSpecialStep's chain
function alphaWitStates(b, dt, px, py) {
  if (b.st === 'spring') {
    b.springAir = (b.springAir || 0) + dt;
    if ((b.on && b.vy >= 0 && b.springAir > 0.12) || b.t <= 0) {
      // IT LANDS INTO A COUNTER, and the counter is announced like any other:
      // along the floor or through the air, turn about
      b.vx = 0; b.face = Math.sign(px - b.cx()) || b.face;
      b.midAlt = !b.midAlt; b.fired = false; b._tellDur = 0;
      if (!b.midAlt) alphaRendBegin(b);
      else {
        b.st = 'coil'; b.t = TELL_SWIPE;
        if (b.fury) { b.quakeX = alphaLeapMark(b); const qy = typeof fxSurfaceY === 'function' ? fxSurfaceY(b.quakeX, b.y + b.h, 60) : NaN; b.quakeY = qy === qy ? qy : b.y + b.h; } else b.quakeX = null;
      }
    }
    return true;
  }
  if (b.st === 'skywarn') {
    b.windT = ALPHA_WIT.skyTell; b.vx *= Math.pow(0.02, dt);
    if (b.t <= 0) { b.st = 'sky'; b.t = ALPHA_WIT.skyLive + 0.12; b.fired = false; b.skyHit = false; }
    return true;
  }
  if (b.st === 'sky') {
    b.vx = 0;
    const cx = b.cx();
    if (!b.fired) {
      b.fired = true;
      if (typeof sfx === 'function') sfx('slash');
      cam.shake = Math.max(cam.shake, 5);
      // THE BITE, generated (js/bossvfx.js): two crescents of fangs snapping shut in the air over its
      // spine — exactly the box that bites. (It was a pillar of light standing up out of its back and
      // a flash round its head: light on a body.)
      if (typeof bossVfx === 'function' && !G.artProbe) bossVfx('alpha_bite', cx, b.y - ALPHA_WIT.skyReach * 0.5, { h: ALPHA_WIT.skyReach * 1.35, dur: 0.42 });
      burst(cx, b.y - 20, 12, '#ffb15a', 260, 0.4, -200, 2.4, true);
    }
    // live for the whole snap: the air over its spine, a body and a half up
    if (b.t > 0.12 && !b.skyHit && !player.dead && player.iT <= 0
        && aabb({ x: cx - b.w * 0.7, y: b.y - ALPHA_WIT.skyReach, w: b.w * 1.4, h: ALPHA_WIT.skyReach + 12 }, player)) {
      b.skyHit = true;
      player.hurt(DF().edmg, cx, 'alpha.sky', b);
      player.vx = (Math.sign(px - cx) || -b.face) * 320; player.vy = -240;
      b.denied = (b.denied || 0) + 1; b.hitSince = true;
    }
    if (b.t <= 0) { b.st = 'rest'; b.t = bossRest(b, 0.6); }
    return true;
  }
  return false;
}
// a fury leap that missed: does it come again? True when it has coiled again.
function alphaChain(b, px) {
  if (!b.fury || (b.chainN || 0) >= ALPHA_WIT.chain) { b.chainN = 0; return false; }
  b.chainN = (b.chainN || 0) + 1;
  b.face = Math.sign(px - b.cx()) || b.face;
  b.st = 'coil'; b.t = ALPHA_WIT.chainTell; b.vx = 0; b.fired = false; b._tellDur = 0;
  b.quakeX = alphaLeapMark(b);
  const qy = typeof fxSurfaceY === 'function' ? fxSurfaceY(b.quakeX, b.y + b.h, 60) : NaN;
  b.quakeY = qy === qy ? qy : b.y + b.h;
  return true;
}

// ---- THE NEW STATES --------------------------------------------------------
// One branch of alphaStep's chain. True when the state was one of these.
function alphaSpecialStep(b, dt, px, py) {
  if (alphaWitStates(b, dt, px, py)) return true;
  if (b.st === 'rendwarn') {
    b.windT = TELL_SWIPE;
    b.vx *= Math.pow(0.02, dt);
    if (b.t <= 0) { b.st = 'rend'; b.t = 0.34; b.fired = false; b.rendQ = 0; }
    return true;
  }
  if (b.st === 'rend') {
    b.vx *= Math.pow(0.02, dt);
    if (!b.fired && b.t <= 0.24) { b.fired = true; alphaRendThrow(b, false); if (b.fury) b.rendQ = ALPHA_FX.rendAgain; }
    if (b.rendQ > 0 && (b.rendQ -= dt) <= 0) { b.rendQ = 0; alphaRendThrow(b, true); }
    // the same rest the leap's kick pays: one clean combo for whoever jumped it
    if (b.t <= 0 && !(b.rendQ > 0)) { b.st = 'rest'; b.t = bossRest(b, 0.7); }
    return true;
  }
  if (b.st === 'furywarn') {
    b.windT = TELL_HEAVY; b.vx *= Math.pow(0.02, dt);
    if (b.t <= 0) { b.st = 'fury'; b.t = 0.7; b.fired = false; }
    return true;
  }
  if (b.st === 'fury') {
    b.vx = 0;
    if (!b.fired) { b.fired = true; alphaFuryFire(b, px, py); }
    // ...and it stands in its own roar for a beat afterwards: the display is
    // followed by the longest rest in the fight, because she was just thrown
    if (b.t <= 0) { b.st = 'rest'; b.t = bossRest(b, 0.95); b.band = 1; b.reposN = 0; }
    return true;
  }
  return false;
}

// ---- THE QUAKE ---------------------------------------------------------------
// where a leap begun from here will come down, on the floor it left from
function alphaLeapMark(b) {
  const T = 2 * ALPHA_KIT.leapUp / 2000;
  return b.cx() + (b.face || -1) * ALPHA_KIT.leapV * T;
}
function alphaLeapLanded(b) {
  if (!b.fury) return;
  const cx = b.cx(), fy = alphaFloorY(b);
  if (typeof sfx === 'function') sfx('alpha_quake');
  cam.shake = Math.max(cam.shake, 10);
  if (typeof padRumble === 'function') padRumble(0.8, 0.7, 320);
  if (typeof fx === 'function' && !G.artProbe) {
    fx('ground', cx, fy - 2, { rx: ALPHA_FX.quake + 40, ry: 36, dur: 0.55, col: ALPHA_RED, hot: ALPHA_HOT, power: 1.35 });
    fx('cracks', cx, fy + 3, { rx: ALPHA_FX.quake, ry: 26, dur: 1.6, col: '#c2182c', hot: ALPHA_HOT, power: 1.2 });
  }
  // the landing, generated: a red shock out along the floor as far as the quake reaches (it was a
  // flash round its feet)
  if (typeof bossVfx === 'function' && !G.artProbe) bossVfx('alpha_land', cx, fy, { h: (ALPHA_FX.quake * 2 + 40) * 160 / 338 });
  // through the FLOOR: it reaches her only if she is standing on it
  if (!player.dead && player.iT <= 0 && player.on && Math.abs(player.x + player.w / 2 - cx) < ALPHA_FX.quake
      && Math.abs(player.y + player.h - fy) < 46) {
    player.hurt(DF().edmg, cx, 'alpha.quake', b);
    b.denied = (b.denied || 0) + 1; b.hitSince = true;
  }
}

// ---- WHAT THE OLD MOVES WEAR NOW -----------------------------------------------
function alphaStrikeFx(b, kind, reach, hit) {
  if (typeof fx !== 'function') return;
  const f = b.face || -1, col = b.fury ? ALPHA_RED : '#ff8a4a';
  if (kind === 'claw') {
    fx('slash', b.cx() + f * reach * 0.55, b.cy() - 2, { rx: 112, ry: 100, dur: 0.28, flip: f < 0, power: 3.4, col, hot: ALPHA_HOT });
    if (typeof sfx === 'function') sfx('alpha_claw');
  } else {
    // the jaws, generated, snapping shut in front of the muzzle (a flash there lit its own head)
    if (typeof bossVfx === 'function' && !G.artProbe) bossVfx('alpha_bite', b.cx() + f * (b.w * 0.5 + reach * 0.35), b.y + b.h * 0.38, { h: hit ? 120 : 90, dur: 0.3 });
    if (typeof sfx === 'function') sfx('alpha_snap');
  }
}
function alphaShakeFx(b, n) {
  if (typeof fx !== 'function') return;
  const f = b.face || -1;
  fx('slash', b.cx() + f * b.w * 0.55, b.y + b.h * 0.3, { rx: 78, ry: 70, dur: 0.2, flip: (n & 1) ? f > 0 : f < 0, power: 2.6, col: ALPHA_RED, hot: ALPHA_HOT });
  if (typeof sfx === 'function') sfx('wolf_bite');
}
function alphaHowlFx(b) {
  if (typeof fx !== 'function') return;
  const cx = b.cx(), fy = alphaFloorY(b);
  // THE HOWL GOES THROUGH THE ROOM. Not rings drawn on it: the picture bends
  // as each front of the note passes, the frame is nudged when it reaches
  // her, and it moves her back a step. Then the note rings on, wider and
  // fainter, after the wolf has closed its mouth.
  alphaWave(b, { R: 500, dur: 1.0, amp: 28, width: 62, col: '#ff5f8a', fronts: 3, gap: 0.14, push: 190, nudge: 6, shimmer: 2.8, pulse: 0.2 });
  alphaWave(b, { R: 600, dur: 1.4, amp: 10, width: 90, col: '#b06aff', fronts: 2, gap: 0.24, nudge: 0, delay: 0.55, dust: false, light: 0.5, pulse: 0, shimmer: 1.0 });
  b.auraT = 1.3; b.rumbleT = 0.55;
  if (!G.artProbe) for (let i = 0; i < 14; i++)
    addPart(cx + rnd(-60, 60), fy - rnd(0, 20), rnd(-30, 30), rnd(-220, -90), rnd(0.5, 0.9), chance(0.4) ? '#ffb38a' : '#ff5f6d', rnd(1.6, 2.6), -60, true);
}
// a wolf called by the howl arrives ALREADY hunting: red light where it lands,
// and its teeth out before it has taken a step
function alphaPackArrive(w) {
  // red light where it LANDS, on the floor under it (a flash round the wolf was light round a body)
  if (typeof bossVfx === 'function' && !G.artProbe) bossVfx('alpha_land', w.x + w.w / 2, w.y + w.h, { h: 54 });
  if (typeof WOLF_HUNT !== 'undefined') { w.hunt = 1; w.snarlT = WOLF_HUNT.snarl; w.snarl0 = w.snarlT; w.snarlCD = WOLF_HUNT.snarl + WOLF_HUNT.again; }
}
function alphaRoarFx(b) {
  if (typeof fx !== 'function') return;
  const cx = b.cx(), fy = alphaFloorY(b);
  // out to the edge of the stun and no further: the bend ends where the
  // roar's reach does, so what the eye sees is what the blow covers
  alphaWave(b, { R: 262, dur: 0.5, amp: 24, width: 46, col: TELL_COL, fronts: 2, gap: 0.1, nudge: 6, shimmer: 2.2, pulse: 0.14 });
  b.rumbleT = 0.3;
  if (!G.artProbe) {
    fx('ground', cx, fy - 2, { rx: 270, ry: 34, dur: 0.55, col: TELL_COL, hot: '#fff6df', power: 1.2 });
    fx('cracks', cx, fy + 3, { rx: 150, ry: 22, dur: 1.4, col: '#b06a1e', hot: '#fff6df', power: 1.0 });
  }
}

// a wave from its throat (js/ripple.js); the dust it drags runs on its floor
function alphaWave(b, o) {
  if (typeof shockRipple !== 'function') return null;
  const w = shockRipple(b.cx() + (b.face || -1) * b.w * 0.3, b.y + b.h * 0.25, o);
  if (w) w.gy = alphaFloorY(b);
  return w;
}
// THE AURA. While it is drawing breath for a howl, howling, or burning, the
// king stands in its own light: a soft body of colour that breathes, wider
// with the note — a glow with no edge, never a ring.
function alphaAura(c, b, cx) {
  let k = 0, col = '255,95,138';
  if (b.st === 'broodcall') k = 0.35 + 0.65 * Math.pow(clamp(1 - (b.t || 0) / TELL_HEAVY, 0, 1), 0.62);
  else if (b.st === 'howl') k = 1;
  else if (b.st === 'furywarn') { k = 0.4 + 0.6 * Math.pow(clamp(1 - (b.t || 0) / TELL_HEAVY, 0, 1), 0.62); col = '255,59,79'; }
  else if (b.st === 'fury') { k = 1.2; col = '255,59,79'; }
  else if ((b.auraT || 0) > 0) k = clamp(b.auraT / 1.3, 0, 1) * 0.8;
  else if (b.fury) { k = 0.3; col = '255,59,79'; }
  if (k <= 0.01) return;
  // NOTHING ROUND THE BODY (the owner, four times: "Why still framed with light ?!!!"; found by the
  // gauntlet 2026-11-24 — this drew a red ellipse of light round the king through its howl and its
  // whole fury). The same strength goes on the FLOOR under it, where the pack is called and the
  // fury lands, and as a red grade over the whole room while it rages.
  const t = b.anim || 0, pulse = 1 + Math.sin(t * 9) * 0.06 + Math.sin(t * 23) * 0.025;
  if (typeof tellFloorLight === 'function') tellFloorLight(c, cx, b.y + b.h - 2, (b.w * 1.4 + 60 * k) * pulse, Math.min(1, k));
  if (col === '255,59,79' && typeof cam !== 'undefined' && G.roomDef) {
    c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = Math.min(0.22, 0.16 * k);
    c.fillStyle = 'rgb(255,140,150)'; c.fillRect(cam.x - 400, cam.y - 300, 1800, 1200);   // (world space, over any zoom)
    c.restore();
  }
}
// ---- DRAWING -----------------------------------------------------------------
// Behind the body: the floor it is about to tear or land on, and its ghosts.
function alphaDrawUnder(c, b, cx) {
  if (G.artProbe || !alphaLive(b)) return;
  alphaAura(c, b, cx);
  const fy = alphaFloorY(b);
  if (typeof tellFloorLight === 'function') {
    if (b.st === 'rendwarn') {
      const k = Math.pow(clamp(1 - (b.t || 0) / TELL_SWIPE, 0, 1), 0.62), d = b.rendDir || b.face || -1;
      const half = ALPHA_FX.rendReach / 2;
      tellFloorLight(c, cx + d * (b.w * 0.5 + 10 + half), fy - 2, half, k);
    } else if (b.fury && (b.st === 'coil' || b.st === 'leap') && b.quakeX != null) {
      const k = b.st === 'coil' ? Math.pow(clamp(1 - (b.t || 0) / TELL_SWIPE, 0, 1), 0.62) : 1;
      tellFloorLight(c, b.quakeX, b.quakeY - 2, ALPHA_FX.quake, k);
    }
  }
  if (b.ghosts && b.ghosts.length) {
    for (const g of b.ghosts) {
      const H = b.h * ALPHA_PX * g.ch, base = g.fl ? H / 2 - b.h * 0.55 : ALPHA_PAD * H / g.ch;
      c.save();
      c.translate(g.x, g.y); c.scale(g.face > 0 ? -1 : 1, 1);
      c.globalAlpha = 0.34 * clamp(g.t / 0.26, 0, 1);
      const tint = alphaGhostTint(g.key, g.cell, g.cells);
      if (tint) { const im = MEDIA_RAW[g.key], dw = H * ((im.naturalWidth / g.cells) / im.naturalHeight); c.drawImage(tint, -dw / 2, base - H, dw, H); }
      c.restore();
    }
  }
}
// one red copy of a strip cell, cached per (key, cell): the ghosts
const ALPHA_GHOST = {};
function alphaGhostTint(key, cell, cells) {
  const im = MEDIA_RAW[key]; if (!im || !im.naturalWidth) return null;
  const id = key + ':' + cell; if (ALPHA_GHOST[id]) return ALPHA_GHOST[id];
  const cw = im.naturalWidth / cells, ch = im.naturalHeight;
  const cv = document.createElement('canvas'); cv.width = Math.round(cw); cv.height = ch;
  const x = cv.getContext('2d');
  x.drawImage(im, cell * cw, 0, cw, ch, 0, 0, cv.width, ch);
  x.globalCompositeOperation = 'source-in'; x.fillStyle = ALPHA_RED; x.fillRect(0, 0, cv.width, ch);
  // a handful of cells are ever asked for; the cache is bounded all the same
  const keys = Object.keys(ALPHA_GHOST); if (keys.length > 48) delete ALPHA_GHOST[keys[0]];
  return (ALPHA_GHOST[id] = cv);
}
// In front of the body: the waves. A claw is nothing but EDGE, and additive
// light has none — so each wave is three blades drawn source-over, a dark
// base under a hot rim, leaning the way they run, with one soft glow behind.
function alphaDrawOver(c, b) {
  if (!alphaLive(b)) { b.rends = null; return; }   // a king that has yielded tears nothing
  const R = b.rends; if (!R || !R.length || G.artProbe) return;
  const hot = b.fury ? ALPHA_RED : '#ffb15a';
  for (const w of R) {
    const k = clamp(w.left / 60, 0, 1) * clamp(w.t / 0.05, 0, 1), d = w.dir, H = ALPHA_FX.rendH;
    c.save(); c.translate(w.x, w.y); c.scale(d, 1);
    c.globalAlpha = k;
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(0, -H * 0.5, 2, 0, -H * 0.5, H * 1.1);
    g.addColorStop(0, hot === ALPHA_RED ? 'rgba(255,59,79,0.42)' : 'rgba(255,177,90,0.4)'); g.addColorStop(1, 'rgba(255,120,40,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, -H * 0.5, H * 1.1, 0, 7); c.fill(); c.restore();
    for (let i = 0; i < 3; i++) {
      const ox = -i * 13 + Math.sin(w.t * 30 + i * 2 + w.seed) * 1.5, hh = H * (1 - i * 0.14);
      // a blade: a crescent from the ground up and forward, tip leading
      c.beginPath();
      c.moveTo(ox - 8, 0);
      c.quadraticCurveTo(ox - 2, -hh * 0.62, ox + 15, -hh);
      c.quadraticCurveTo(ox + 5, -hh * 0.5, ox + 3, 0);
      c.closePath();
      c.fillStyle = '#2a1410'; c.fill();
      c.lineWidth = 2; c.strokeStyle = hot; c.lineJoin = 'round'; c.stroke();
      c.beginPath(); c.moveTo(ox + 1, -hh * 0.2); c.quadraticCurveTo(ox + 4, -hh * 0.66, ox + 14, -hh + 1);
      c.lineWidth = 1.4; c.strokeStyle = ALPHA_HOT; c.stroke();
    }
    c.restore();
  }
}
