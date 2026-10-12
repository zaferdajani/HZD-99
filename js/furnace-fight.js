// ===========================================================================
// FURNACE CHOIR'S FIGHT — the machine (handoff Part 2 A5, the NULLFANG
// treatment for zone C). js/furnace.js draws him; this file decides what he
// does. Boss.update hands the frame here from `case 'atlas'` once the shared
// beats (the wake, the fork, a stagger, the midpoint, the hit-group break)
// have had their turn. The move table, with the numbers tests/furnace.cjs
// measures off his own clock (b.fcLog), is docs/combat/BOSS_FURNACE.md.
//
// HIS SLOT IS THE GREED TEST (docs/combat/GLOBAL_REGISTRY.md §4): openings
// that fit two hits and tempt three. Until this pass that was a sentence in a
// doc — nothing in the machine ever answered the third hit. Now something
// does: THE BELLOWS. The third blow landed inside one of his openings wakes
// the furnace in his chest; it draws breath (the tell) and backdrafts a short
// cone of fire out of the front of him. It is the one blow in zone C that
// wears the parry glint, so the greedy hit has three honest answers — step
// out of the cone (or behind him), jump it, or turn it with a perfect guard —
// and the precise one is paid: he chokes on his own fire for a second.
//
// Every move is one sentence, TELL (a TELL_ST name, so its cue sounds and the
// amber wash rises) -> ACTIVE -> RECOVERY (an opening of at least 250 ms):
//   fc.lob        lobwarn    -> the fireball      -> the walk-in (no wind-up 450 ms)
//   fc.slam       slamwarn   -> tail + two waves  -> recover, tail planted
//   fc.forgebell  forgebell  -> three weapons     -> the walk-in
//   fc.hymn       hymn       -> heat rings        -> recover, the bells ring down
//   fc.backdraft  ventwarn   -> vent (the cone)   -> recover, vents cooling (parried: stagger)
//   fc.drop  (p2) dropcrouch -> rise, droplock, dive -> recover, sprawled
//   fc.meltdown   meltwarn   -> the pour          -> recover
// The art for every state is the owner's sheet (js/furnace.js): the idle,
// walk, fly and reared hero figures plus his parts. Plates that would make
// the new moves read better are briefed in docs/ART_QUEUE.md §2bn.
// ===========================================================================

// ---- the tuning sheet (seconds, px, px/s) ---------------------------------
const FC = {
  walk: 62,
  open: 0.45,                 // the walk-in after a lob or a bell: no wind-up may start
  lobTell: 0.45, lobRest: 1.1,
  slamTell: 0.55, slamWave: 340, slamReach: 100,
  bellTell: 1.5, bellRest: 1.35,
  hymnTell: 1.0,
  meltTell: 1.2, meltAt: 0.35,
  // THE BELLOWS — the answer to the third hit
  ventHits: 3, ventTell: 0.45, ventTell2: 0.40, vent: 0.18,
  ventFrom: 18, ventReach: 132, ventH: 78,
  stagger: 1.0,
  // THE DROP — phase two takes distance away
  dropTell: 0.60, rise: 0.45, riseH: 150, riseSpd: 560, lockT: 0.38, fallV: 1500,
  splashR: 66, dropWave: 300, dropWaveLife: 0.55,
};
// [hold p1, hold p2, the rest beat that follows as a bossRest multiple]. The
// planted beat is a thing he DOES (the tail driven into the floor, the bells
// ringing down, the vents cooling, the wings sprawled after the drop).
const FURN_REC = {
  slam: [0.5, 0.42, 0.7], hymn: [0.55, 0.45, 0.95], melt: [0.45, 0.4, 0.8],
  vent: [0.6, 0.5, 0.8], drop: [0.7, 0.62, 0.8],
};
// openings the bellows guards in phase one: the planted ones, where taking
// the whole window is the temptation. Phase two guards every opening.
const FC_GUARDED_P1 = { slam: 1, hymn: 1, melt: 1 };
// states he is committed to: a Song stagger does not freeze him in the air,
// and the hit-group break waits for them to end (BREAK_KIT.atlas.busy)
const FC_AIR = { rise: 1, droplock: 1, dive: 1 };
// THE VETO LIST (boss-openings §4): pairs that, back to back or overlapping,
// leave no reachable answer. Checked at every draw by fcVeto.
//   hymn while the slag pours   - the ledges are the only floor; a ring across them is a toll
//   drop while the slag pours   - he would dive onto the only safe floor
//   drop while forge weapons live - "be elsewhere" twice, in two different places
//   drop -> drop, hymn -> hymn  - cooldowns
//   drop -> slam                - two floor waves from beside her with no beat between
//   backdraft -> backdraft      - its own recovery is never a guarded opening
function fcVeto(b, mv) {
  if (b.slag && (mv === 'hymn' || mv === 'drop')) return true;
  if (mv === 'drop' && b.forge && b.forge.length) return true;
  if (mv === 'drop' && ((b.dropCD || 0) > 0 || b.fcLast === 'drop')) return true;
  if (mv === 'hymn' && (b.hymnCD || 0) > 0) return true;
  if (mv === 'slam' && b.fcLast === 'drop' && (b.openT || 0) > 0) return true;
  return false;
}

// the state log, on his own clock (tests/furnace.cjs reads it). Called from
// Boss.update before anything can return early, so the shared beats (daze,
// a stagger) are logged as well as his own.
function fcLogStep(b, dt) {
  b._fcClk = (b._fcClk || 0) + dt;
  if (b.st !== b._fcLogSt) {
    b._fcLogSt = b.st;
    const L = b.fcLog || (b.fcLog = []);
    L.push([b.st, +b._fcClk.toFixed(4)]); if (L.length > 120) L.shift();
  }
  // the glint is set by the machine each frame it is true; nothing else
  // (a break, a stagger that skips the machine) may leave it lit
  b.parryable = false;
  // a window she EARNED (the hit-group break) is hers: the bellows stands down
  if (b.st === 'daze') { b.fcArm = false; b.fcHits = 0; }
}

// every hit she lands (dealDmg -> onStruck) counts toward the bellows while
// one of his openings is guarded — but not inside a window she earned or was
// given from outside (the break, the choke, the Song's stagger, the midpoint):
// those are rewards, and a reward that bites back is a trap
function fcStruck(b) {
  if (!b.fcArm || b.dead || b.st === 'daze' || b.st === 'stagger' || (b.stagT || 0) > 0) return;
  b.fcHits = (b.fcHits || 0) + 1;
}

// a wind-up begins: the opening behind it closes, and the cold-dice ledger
// learns whether the move before this one reached her
function fcBegin(b, mv) {
  b.fcArm = false; b.fcHits = 0;
  b.fcStreak = b.fcGotHer ? (b.fcStreak || 0) + 1 : 0;
  b.fcGotHer = false;
  b.fcLast = mv; b.fcMove = mv;
}
// an opening begins (the move has gone off): guarded or free
function fcOpen(b, mv) {
  b.fcArm = mv !== 'vent' && (b.phase === 2 || !!FC_GUARDED_P1[mv]);
  b.fcHits = 0;
}
function furnRecover(b, mv) {
  const R = FURN_REC[mv];
  b.st = 'recover'; b.vx = 0; b.t = R[b.phase === 2 ? 1 : 0]; b.recNext = R[2]; b.recMv = mv;
  fcOpen(b, mv);
}

// every wind-up, in one place, so the deck, the cold-dice floor and the
// harness all start a move exactly the same way
function fcStart(b, mv) {
  const p2 = b.phase === 2;
  b.vx = 0;
  if (mv === 'lob') { fcBegin(b, mv); b.st = 'lobwarn'; b.t = FC.lobTell; }
  else if (mv === 'slam') { fcBegin(b, mv); b.st = 'slamwarn'; b.t = FC.slamTell; b.slamCD = rnd(2.6, 4.0); }
  else if (mv === 'forgebell') {
    // the first clapper strike lands 450 ms in (see the forgebell state)
    fcBegin(b, mv); b.st = 'forgebell'; b.t = FC.bellTell; b.fbCD = rnd(11, 15); b.fbStruck = 0;
  } else if (mv === 'hymn') {
    fcBegin(b, mv); b.st = 'hymn'; b.t = FC.hymnTell; b.hymnCD = rnd(6.5, 8.5);
    b.roarBuzzT = 0.7;
    if (typeof padRumble === 'function') padRumble(0.7, 0.6, 550);
    if (typeof roarWave === 'function') roarWave(b.cx() + b.face * 34, b.y - b.h * 0.6, '#ff9a5a');   // molten, never reward gold (registry §2)
  } else if (mv === 'melt') {
    fcBegin(b, mv); b.meltUsed = true; b.st = 'meltwarn'; b.t = FC.meltTell; sfx('castfire');
  } else if (mv === 'vent') {
    // he turns to the blow that woke it, and that facing is the cone's: it
    // does not follow her round the back of him
    fcBegin(b, mv);
    b.face = Math.sign(player.x + player.w / 2 - b.cx()) || b.face || 1;
    b.st = 'ventwarn'; b.t = p2 ? FC.ventTell2 : FC.ventTell; b.ventHit = false;
    sfx('vent');
    if (G.save && G.save.flags && !G.save.flags.fcBellowsTold) { G.save.flags.fcBellowsTold = 1; G.toast(t('fc_bellows')); }
  } else if (mv === 'drop') {
    fcBegin(b, mv); b.st = 'dropcrouch'; b.t = FC.dropTell; b.dropFloor = b.y + b.h;
  }
}

// where the backdraft burns: out of the front of him, chest to floor
function fcVentBox(b) {
  const f = b.face || 1, feet = b.y + b.h;
  const x0 = b.cx() + f * FC.ventFrom, x1 = b.cx() + f * (FC.ventFrom + FC.ventReach);
  return { x: Math.min(x0, x1), y: feet - FC.ventH, w: FC.ventReach, h: FC.ventH };
}
function fcChest(b) { return [b.cx() + (b.face || 1) * 30, b.y + b.h * 0.42]; }
// a perfect guard turned the backdraft (js/parry.js parryClash): he chokes on
// his own fire — the fight's one gift-sized window, and only for the hardest read
function fcClashed(b, p, how) {
  b.st = 'stagger'; b.t = FC.stagger; b.vx = 0; b.ventHit = true; b.fcArm = false;
  b.parries = (b.parries || 0) + 1;
  const c = fcChest(b);
  sfx('bosshit'); sfx('vent');
  cam.shake = Math.max(cam.shake, 7);
  burst(c[0], c[1], 22, MAT.molten.mid, 300, 0.6, 120, 3.4, true);
  for (let i = 0; i < 10; i++)
    addPart(c[0] + rnd(-14, 14), c[1] + rnd(-10, 10), rnd(-60, 60), rnd(-160, -60), 0.7, '#3a3632', 4, -40, true);
}

// the deck, by range (near < 170 / mid < 380 / far): the bells answer a
// player who stands close (the rings leave from his body), the lob one who
// keeps her distance — and in phase two the DROP takes distance away
function fcDraw(b, fdx) {
  const band = fdx < 170 ? 0 : fdx < 380 ? 1 : 2;
  const p2 = b.phase === 2;
  const deck = [
    ['hymn', fcVeto(b, 'hymn') ? 0 : [3, 1, 0.5][band]],
    ['lob', (p2 ? [1, 1.5, 1.5] : [1, 2, 3])[band]],
  ];
  if (p2) deck.push(['drop', fcVeto(b, 'drop') ? 0 : [0, 1.5, 2.5][band]]);
  return bossDraw(b, deck);
}

function fcStep(b, dt, px, py, spd) {
  const p2 = b.phase === 2;
  if (!b.onStruck) b.onStruck = () => fcStruck(b);
  if (!b.parryAt) { b.parryAt = () => fcChest(b); b.onParried = (p, how) => fcClashed(b, p, how); }
  if (!FC_AIR[b.st]) b.vy += 2100 * dt;
  if (b.st !== 'ventwarn' && b.st !== 'vent' && !FC_AIR[b.st]) b.face = Math.sign(px - b.cx()) || 1;
  // the ledger the cold-dice floor reads: did the last move reach her?
  if (b._fcCores != null && player.cores < b._fcCores) b.fcGotHer = true;
  b._fcCores = player.cores;
  // the midpoint (Boss.update) can land mid-bellows; the turn of the fight
  // takes the breath with it rather than leaving a 1.2 s tell behind
  if (b._fcPh !== b.phase) {
    if (b._fcPh != null && (b.st === 'ventwarn' || b.st === 'vent')) { furnRecover(b, 'vent'); b.fcArm = false; }
    b._fcPh = b.phase;
  }
  b.fbCD = b.fbCD == null ? 8 : b.fbCD - dt;
  b.slamCD = b.slamCD == null ? 0 : b.slamCD - dt;
  b.hymnCD = Math.max(0, (b.hymnCD || 0) - dt);
  b.dropCD = b.dropCD == null ? 2 : Math.max(0, b.dropCD - dt);
  const fdx = Math.abs(px - b.cx());
  // THE BELLOWS: the third hit inside a guarded opening. Out of his recovery
  // or his walk-in only — never out of a wind-up or a blow already going off.
  const greedy = b.fcArm && (b.fcHits || 0) >= FC.ventHits && !b.slag;
  switch (b.st) {
    case 'idle': {
      b.vx = b.face * FC.walk * spd * (b.slag ? 0.55 : 1);
      b.t -= dt;
      // THE WALK-IN IS A WINDOW: after a lob or a bell he walks at her for
      // `openT` before he may start another wind-up (a slam a frame after a
      // lob measured a 17 ms "opening" in tests/guardians.cjs)
      b.openT = Math.max(0, (b.openT || 0) - dt);
      if (greedy) fcStart(b, 'vent');
      else if (b.openT > 0) { /* walking in, open */ }
      else if (!b.meltUsed && b.hp <= b.hpMax * FC.meltAt) fcStart(b, 'melt');
      else {
        // THE COLD-DICE FLOOR (boss-openings §4): three moves in a row that
        // reached her (the last one still on the ledger counts) and she has had
        // nothing she could take. When the rest beat runs out, the next move is
        // the plainest in the fight — a lob, and the long walk-in after it —
        // and the ledger starts over. Nothing else may jump the queue meanwhile.
        const cold = (b.fcStreak || 0) + (b.fcGotHer ? 1 : 0) >= 3;
        if (cold) { if (b.t <= 0) { fcStart(b, 'lob'); b.fcStreak = 0; } }
        else if (b.fbCD <= 0 && b.t <= 0.6) fcStart(b, 'forgebell');
        else if (fdx < FC.slamReach && b.slamCD <= 0 && !fcVeto(b, 'slam')) fcStart(b, 'slam');
        else if (b.t <= 0) fcStart(b, fcDraw(b, fdx));
      }
      break;
    }
    case 'lobwarn': {
      b.vx = 0; b.t -= dt; b.windT = 0.3;
      if (b.t <= 0) {
        const d = px - b.cx();
        b.shoot(clamp(d * 1.1, -300, 300), -460, 8, 900); sfx('lob');
        // the lob keeps the walk-in as its window: a planted beat after his
        // commonest move made him a statue for a third of the fight
        b.st = 'idle'; b.t = bossRest(b, FC.lobRest); b.openT = FC.open; fcOpen(b, 'lob');
      }
      break;
    }
    case 'forgebell': {
      // each strike rings out a spark shower, then the sky answers with
      // embedded white-hot weapons — break them before they burst
      b.vx = 0; b.t -= dt; b.windT = 0.3;
      const due = Math.floor((FC.bellTell - 0.15 - b.t) / 0.3);
      while (b.fbStruck < Math.min(3, due)) {
        b.fbStruck++;
        cam.shake = 6; sfx('bosshit');
        burst(b.cx(), b.cy() - 10, 12, MAT.molten.mid, 260, 0.45, 200, 3, true);
        const wx = clamp(px + rnd(-110, 110), 60, G.roomDef.w * TILE - 60);
        b.forge = b.forge || [];
        b.forge.push({ x: wx, y: -30, vy: 0, landed: false, t: 3, kind: b.fbStruck % 3 });
      }
      if (b.t <= 0) { b.st = 'idle'; b.t = bossRest(b, FC.bellRest); b.openT = FC.open; fcOpen(b, 'forgebell'); }
      break;
    }
    case 'meltwarn': {
      // the tell: the bell whitens, steam screams from every joint
      b.vx = 0; b.t -= dt; b.windT = 0.4;
      b.whiteHot = Math.min(1, (b.whiteHot || 0) + dt * 1.2);
      if (chance(0.9)) addPart(b.cx() + rnd(-40, 40), b.y + rnd(0, b.h),
        rnd(-30, 30), rnd(-140, -60), 0.5, '#fff2dd', 2.5, 0, true);
      if (b.t <= 0) {
        furnRecover(b, 'melt');
        b.slag = { t: 0, life: 6.5, h: 0 };
        cam.shake = 9; sfx('roar');
      }
      break;
    }
    case 'hymn': {
      // the bells wind up, then ring: expanding rings of heat along the floor
      b.vx = 0; b.t -= dt; b.windT = 0.4;
      if (b.t <= 0) {
        b.hymn = { r: 10, t: 0, n: p2 ? 3 : 2 };
        sfx('roar'); cam.shake = 7;
        if (G.save && G.save.flags && !G.save.flags.hymnTold) { G.save.flags.hymnTold = 1; G.toast(t('hymn_warn')); }
        furnRecover(b, 'hymn');
      }
      break;
    }
    case 'slamwarn': {
      b.vx = 0; b.t -= dt;
      if (b.t <= 0) {
        furnRecover(b, 'slam');
        cam.shake = 11; sfx('slam');
        const gy = b.y + b.h - 8;
        G.projs.push(new Proj(b.cx() - 40, gy, -FC.slamWave, 0, false, 1, 8, PAL.C.glow, 0, 1.6));
        G.projs.push(new Proj(b.cx() + 40, gy, FC.slamWave, 0, false, 1, 8, PAL.C.glow, 0, 1.6));
      }
      break;
    }
    // ---------------------------------------------------- THE BELLOWS
    case 'ventwarn': {
      // he draws breath: the chest swells, the plates lift, the core goes
      // white — and for its last 150 ms the chest wears the parry glint
      b.vx = 0; b.t -= dt; b.windT = 0.3;
      b.parryable = b.t <= (typeof PARRY_LEAD === 'number' ? PARRY_LEAD : 0.15);
      if (chance(0.6)) addPart(b.cx() + rnd(-26, 26), b.y + rnd(4, b.h * 0.6), rnd(-50, 50), rnd(-110, -40), 0.35, '#f4efe6', 2.2, -30, true);
      if (b.t <= 0) {
        b.st = 'vent'; b.t = FC.vent; b.ventHit = false;
        sfx('castfire'); sfx('blast'); cam.shake = Math.max(cam.shake, 7);
        if (typeof padRumble === 'function') padRumble(0.6, 0.5, 200);
      }
      break;
    }
    case 'vent': {
      b.vx = 0; b.t -= dt;
      b.parryable = !b.ventHit;
      const box = fcVentBox(b);
      if (!b.ventHit && !player.dead && player.iT <= 0 && aabb(box, player)) {
        b.ventHit = true;
        player.hurt(DF().edmg, b.cx(), 'atlas.vent', b);   // the attacker named: a perfect guard turns it
      }
      if (chance(0.8)) addPart(box.x + rnd(0, box.w), box.y + rnd(0, box.h), (b.face || 1) * rnd(80, 220), rnd(-80, -10), 0.3, MAT.molten.mid, 3, -60, true);
      if (b.st === 'vent' && b.t <= 0) furnRecover(b, 'vent');
      break;
    }
    case 'stagger': {
      // choked on his own fire: smoke out of every vent, the light gone
      b.vx = 0; b.t -= dt;
      if (chance(0.5)) addPart(b.cx() + rnd(-22, 22), b.y + rnd(0, b.h * 0.5), rnd(-30, 30), rnd(-90, -40), 0.8, '#3a3632', 4, -30, true);
      if (b.t <= 0) { b.st = 'idle'; b.t = bossRest(b, 0.7); b.openT = FC.open; }
      break;
    }
    // ------------------------------------------------------- THE DROP
    case 'dropcrouch': {
      // the wings gather and the body sinks onto its haunches
      b.vx = 0; b.t -= dt; b.windT = 0.3;
      if (b.t <= 0) {
        b.st = 'rise'; b.t = FC.rise; b.vy = 0; b.thruPlat = true;
        b.dropFloor = b.y + b.h;
        sfx('launch'); sfx('dash'); cam.shake = Math.max(cam.shake, 4);
        for (let i = 0; i < 10; i++)
          addPart(b.cx() + rnd(-40, 40), b.y + b.h - 3, rnd(-180, 180), rnd(-120, -20), 0.4, '#c8925c', 3, 260, true);
      }
      break;
    }
    case 'rise': {
      // up on the wings, drifting over her: he follows until the lock
      b.t -= dt; b.vy = 0;
      const ty = b.dropFloor - FC.riseH - b.h;
      b.y += (ty - b.y) * (1 - Math.exp(-9 * dt));
      const W = G.roomDef.w * TILE;
      const tx = clamp(px, 60, W - 60);
      b.vx = clamp((tx - b.cx()) / Math.max(dt, 1e-3), -FC.riseSpd * spd, FC.riseSpd * spd);
      b.x += b.vx * dt;
      if (b.t <= 0) {
        b.st = 'droplock'; b.t = FC.lockT; b.vx = 0; b.dropX = b.cx();
        sfx('chirp');
      }
      break;
    }
    case 'droplock': {
      // LOCKED: the landing is marked on the floor and it does not move again
      b.t -= dt; b.vx = 0; b.vy = 0; b.windT = 0.3;
      if (b.t <= 0) { b.st = 'dive'; b.t = 1.0; b.vy = FC.fallV; }
      break;
    }
    case 'dive': {
      b.t -= dt; b.vx = 0; b.vy = FC.fallV;
      break;     // the landing is read after moveEnt, below
    }
    case 'recover': {
      // PLANTED: the blow is spent and he stands in it
      b.vx = 0; b.t -= dt;
      if (greedy) fcStart(b, 'vent');
      else if (b.t <= 0) { b.st = 'idle'; b.t = bossRest(b, b.recNext || 0.7); if (b.recMv === 'drop') b.openT = FC.open; }
      break;
    }
    default: {
      // a state this machine does not own (a stale name from elsewhere):
      // hand back to the walk rather than freezing
      b.st = 'idle'; b.t = 0.5;
    }
  }
  if (p2) {
    b.embT = (b.embT || 0) - dt;
    if (b.embT <= 0) { b.embT = 1.1; G.projs.push(new Proj(px + rnd(-130, 130), 40, 0, 300, false, 1, 6, '#ff9430', 100, 3)); }
  }
  if (b.st === 'rise' || b.st === 'droplock') return;      // flown by hand, no physics
  const wasDive = b.st === 'dive';
  const col = moveEnt(b, dt);
  if (wasDive && ((col && col.d) || b.vy === 0 || b.t <= 0)) fcLand(b, px, py);
}

function fcLand(b, px, py) {
  b.vy = 0; b.thruPlat = false;
  furnRecover(b, 'drop');
  b.dropCD = rnd(5, 7); b.slamCD = Math.max(b.slamCD || 0, 1.2);
  cam.shake = Math.max(cam.shake, 12); sfx('slam'); sfx('land');
  if (typeof padRumble === 'function') padRumble(0.8, 0.6, 260);
  const feet = b.y + b.h, cx = b.cx();
  burst(cx, feet - 6, 20, MAT.molten.mid, 300, 0.5, 400, 3.2, true);
  for (let i = 0; i < 14; i++)
    addPart(cx + rnd(-60, 60), feet - 3, rnd(-220, 220), rnd(-170, -30), 0.45, '#c8925c', 3, 300, true);
  // the splash takes a body standing at the landing; a body in the air, or
  // one that left the marked floor after the lock, is not there
  if (!player.dead && player.iT <= 0 && Math.abs(px - cx) < FC.splashR
      && player.y + player.h > feet - 26 && player.y < feet)
    player.hurt(DF().edmg, cx, 'atlas.drop');
  const gy = feet - 8;
  G.projs.push(new Proj(cx - 40, gy, -FC.dropWave, 0, false, 1, 7, PAL.C.glow, 0, FC.dropWaveLife));
  G.projs.push(new Proj(cx + 40, gy, FC.dropWave, 0, false, 1, 7, PAL.C.glow, 0, FC.dropWaveLife));
}

// world-space marks drawn under/over him by js/furnace.js: the landing on the
// floor (danger red: stay and it lands), the lock (cyan: you are targeted),
// and the backdraft's cone. Ground marks respect G.artProbe.
function fcDrawFx(c, b, layer) {
  if (b.dead) return;
  const st = b.st;
  if (layer === 'under' && (st === 'rise' || st === 'droplock' || st === 'dive') && !G.artProbe) {
    const fy = b.dropFloor || (G.roomDef.h - 2) * TILE;
    const x = st === 'rise' ? b.cx() : (b.dropX || b.cx());
    const k = st === 'rise' ? clamp(1 - b.t / FC.rise, 0, 1) : 1;
    const lock = st !== 'rise';
    c.save();
    c.globalAlpha = 0.25 + 0.35 * k;
    c.fillStyle = 'rgba(20,6,8,0.55)';
    c.beginPath(); c.ellipse(x, fy - 2, FC.splashR * (0.6 + 0.4 * k), 8, 0, 0, 7); c.fill();
    c.strokeStyle = '#ff5f6d'; c.lineWidth = lock ? 3 : 1.6;
    c.globalAlpha = lock ? 0.75 + Math.sin((b.anim || 0) * 24) * 0.2 : 0.35 + 0.3 * k;
    c.beginPath(); c.ellipse(x, fy - 2, FC.splashR, 9, 0, 0, 7); c.stroke();
    if (lock) {
      // the lock brackets: cyan, the registry's "you are targeted"
      c.strokeStyle = '#8ff6ff'; c.lineWidth = 2; c.globalAlpha = 0.85;
      const r = FC.splashR + 8;
      for (const s of [-1, 1]) {
        c.beginPath(); c.moveTo(x + s * r, fy - 14); c.lineTo(x + s * (r + 8), fy - 2); c.lineTo(x + s * r, fy + 10); c.stroke();
      }
      if (st === 'droplock' && b.t > FC.lockT - 0.2) {
        const q = (FC.lockT - b.t) / 0.2;
        c.globalAlpha = 1 - q; c.lineWidth = 3;
        c.beginPath(); c.arc(b.cx(), b.y + b.h * 0.35, 20 + q * 40, 0, 7); c.stroke();
      }
    }
    c.restore();
  }
  if (layer === 'over' && st === 'vent') {
    const box = fcVentBox(b), f = b.face || 1, ch = fcChest(b);
    const k = clamp(1 - b.t / FC.vent, 0, 1);
    const tip = box.x + (f > 0 ? box.w : 0), feet = box.y + box.h;
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(ch[0], 0, tip, 0);
    g.addColorStop(0, 'rgba(255,245,224,0.9)');
    g.addColorStop(0.35, 'rgba(255,123,58,0.75)');
    g.addColorStop(1, 'rgba(160,40,12,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(ch[0], ch[1] - 8);
    c.quadraticCurveTo((ch[0] + tip) / 2, box.y - 6 - Math.sin(k * 9) * 4, tip, box.y + 6);
    c.lineTo(tip, feet - 2);
    c.quadraticCurveTo((ch[0] + tip) / 2, feet, ch[0], ch[1] + 10);
    c.closePath(); c.fill();
    c.restore();
  }
}

TEXT_LAYERS.push({
  robo: true,
  en: { fc_bellows: 'THE BELLOWS — a third blow wakes the furnace. Step out of the fire, jump it, or raise the guard as it bursts.' },
  ar: { fc_bellows: 'المنفاخ — الضربة الثالثة توقظ الفرن. ابتعدي عن النار، أو اقفزي فوقها، أو ارفعي الحماية لحظة انفجارها.' },
  tr: { fc_bellows: 'KÖRÜK — üçüncü darbe fırını uyandırır. Ateşin önünden çekil, üstünden atla ya da patladığı anda siperi kaldır.' },
  zh: { fc_bellows: '风箱——第三击会唤醒熔炉。避开火焰、跳过去，或在它喷发的一瞬举起格挡。' },
  ru: { fc_bellows: 'МЕХА — третий удар будит горн. Уйдите из огня, перепрыгните его или поднимите блок в миг вспышки.' },
});
// NOSTOS shares the engine; its hero is addressed as he is
TEXT_LAYERS.push({
  en: { fc_bellows: 'THE BELLOWS — a third blow wakes the furnace. Step out of the fire, jump it, or raise the guard as it bursts.' },
  ar: { fc_bellows: 'المنفاخ — الضربة الثالثة توقظ الفرن. ابتعد عن النار، أو اقفز فوقها، أو ارفع الحماية لحظة انفجارها.' },
  tr: { fc_bellows: 'KÖRÜK — üçüncü darbe fırını uyandırır. Ateşin önünden çekil, üstünden atla ya da patladığı anda siperi kaldır.' },
  zh: { fc_bellows: '风箱——第三击会唤醒熔炉。避开火焰、跳过去，或在它喷发的一瞬举起格挡。' },
  ru: { fc_bellows: 'МЕХА — третий удар будит горн. Уйдите из огня, перепрыгните его или поднимите блок в миг вспышки.' },
});
