// ===========================================================================
// THE PACK ANSWERS HER (owner, 2026-11-20: "since I became the leader of ...
// the pack, I should be able to summon for a short period, like seconds, a
// wolf to help me ... as a special power" · "as the alpha, I should be able
// to summon him temporarily for 10 seconds or so").
//
// The Alpha's yield gives her an arm on the suit wheel: THE PACK. Worn and
// cast (the same key every arm fires on), it calls one wolf of the pack she
// now leads. It comes in from behind her at a run, and for ten seconds it
// hunts what hunts her: it closes on the nearest machine or guardian, gathers
// on its haunches (the wolf's own coil) and bites — the same lunge the pack
// used on her, now on her side. With nothing to hunt it keeps at her heel.
// When its time is up it lopes off the way it came and is gone.
//
// It is a wolf of the meadow pack wherever she is (the same filmed strips,
// worn tame), it cannot be hurt and cannot hurt her, and there is only ever
// one: calling again while it runs does nothing, and the arm's cooldown is
// longer than its stay. It is dear in volts on purpose — a second pair of
// teeth is a lot to have.
// ===========================================================================
const PACK_CALL = {
  stay: 10,          // seconds it hunts
  cost: 45,          // volts (ARMS)
  cd: 16,            // seconds before the next call (ARMS)
  spd: 300,          // its run
  sight: 560,        // how far it looks for a quarry
  reach: 78,         // from here it gathers to bite
  coil: 0.2,         // the gather (its own wolf coil)
  lunge: 0.26,       // the bite's flight
  again: 0.75,       // between bites
  dmg: 14,           // a bite, before her difficulty's scaling
  leave: 3,          // the lope away: until it is off the screen, or this long
};
// THE PACK, LONGER (Ratchet's shelf, 2026-11-25): the bought tier stays longer and bites harder
function packStat(k) { const up = (G.save && G.save.packLv | 0) >= 2; return k === 'stay' ? (up ? 15 : PACK_CALL.stay) : k === 'dmg' ? (up ? 22 : PACK_CALL.dmg) : PACK_CALL[k]; }
// ---------------------------------------------------------------------------
// A BITE THAT HURTS (owner, 2026-11-27: "The wolf is super weak. When I
// summoned it next to the cheetahs, it hit it so many times without any real
// damage, even though I upgraded the wolf"). Measured before this: a cave cat
// in CV2 is 121-145 hp (the rift's zone scaling, a level-5 machine, often the
// tough trait) under 12 % plate, and the bite was a flat 14 (22 upgraded) — 12
// a bite, a twelfth of the cat, three bites in a ten-second stay. A flat number
// cannot be right in the meadow and in the rift both, so against an ordinary
// machine the bite is a SHARE of what that machine started with: a fifth at
// the first rung (five bites bring it down), three tenths upgraded (four),
// never less than the flat bite. A guardian, a sage or an agent still takes the
// flat bite: against them it stays a little help.
// ---------------------------------------------------------------------------
const PACK_BITE = { share: 0.2, shareUp: 0.3, upReach: 150 };
function packBigFoe(q) {
  return (typeof Boss !== 'undefined' && q instanceof Boss) || q.kind === 'sage' || !!q.agent || !!q.isAgent;
}
// the bite before her difficulty, and the raw number that lands it through the plate
function packBiteRaw(q, flat) {
  const base = flat * ((typeof DF === 'function' && DF().pdmg) || 1);
  if (!q || packBigFoe(q)) return Math.round(base);
  const up = (G.save && G.save.packLv | 0) >= 2;
  const want = Math.ceil((q.hpMax0 || q.hp || 0) * (up ? PACK_BITE.shareUp : PACK_BITE.share));
  // dealDmg takes the plate off (combatDamage); hand it the number that comes
  // out at `want` after it, so the share is the share whatever its armour
  const def = typeof combatDefense === 'function' ? combatDefense(q) : 0;
  const raw = def > 0 ? Math.ceil((want + 0.49) / (1 - def / 100)) : want;
  return Math.max(Math.round(base), raw);
}
// the bite, landed: from the side the jaws are on (a shield-walker's plate is
// on one side, and a bite from behind it goes in whole), the knock the way the
// wolf was going, and the fold when it is the last
function packBite(w, q, flat) {
  const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(q) : q;
  const hx = w.dir > 0 ? b.x + 3 : b.x + b.w - 3, hy = b.y + b.h * 0.5;
  const out = dealDmg(q, packBiteRaw(q, flat), null, hx, hy, true, 'pack');
  if (typeof sfx === 'function') sfx('wolf_bite');
  if (typeof burst === 'function') burst(hx, hy, 8, '#ffe6c8', 180, 0.3, 200, 2.2, true);
  if (!(typeof Boss !== 'undefined' && q instanceof Boss) && q.kind !== 'turret') { q.kbT = Math.max(q.kbT || 0, 0.2); q.vx = (q.vx || 0) * 0.3 + w.dir * 200; q.vy = Math.min(q.vy || 0, 0) - 110; }
  if (q.hp <= 0 && !q.dead && typeof q.die === 'function') { q.die(w.dir, -0.3); if (typeof questPackKill === 'function') questPackKill(q); }
  return out;
}
// THE PACK LADDER (js/packtree.js, owner 2026-11-26): from CALL THE ALPHA on, the call brings the
// Alpha himself, at his own size, instead of a small wolf — he has his own step and drawing there
function packCallsAlpha() { return (G.save && G.save.packLv | 0) >= 3 && typeof alcCall === 'function'; }
function packCallable() { return !(typeof isHero === 'function' && isHero()) && !!(G.save && G.save.arms && G.save.arms.includes('pack')); }
// the quarry: what is still fighting her, nearest first
function packQuarry(w) {
  let best = null, bd = PACK_CALL.sight;
  const cx = w.x + w.w / 2;
  const cand = (G.enemies || []).slice();
  if (G.boss && typeof bossActive === 'function' && bossActive() && !G.boss.purified) cand.push(G.boss);
  for (const e of cand) {
    if (!e || e.dead || e.disabled || e.rescued || e.calm || e.meek) continue;
    if (typeof isPet === 'function' && isPet(e)) continue;
    if (typeof isWolf === 'function' && isWolf(e) && typeof packTamed === 'function' && packTamed()) continue;
    const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(e) : e;
    const d = Math.abs(b.x + b.w / 2 - cx);
    if (Math.abs(b.y + b.h / 2 - (w.y + w.h / 2)) > 220) continue;   // not one it can reach on foot
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}
function packCall(p) {
  if (G.packWolf) return false;
  G.packCarry = null;                      // a fresh call is not the one she brought
  if (packCallsAlpha()) return alcCall(p);
  const k = (typeof EKIND !== 'undefined' && EKIND.crawler) || { w: 40, h: 28 };
  const back = -(p.face || 1);
  const w = {
    x: p.x + p.w / 2 + back * 150 - k.w / 2, y: p.y + p.h - k.h, w: k.w, h: k.h,
    vx: -back * PACK_CALL.spd, vy: -260, on: false, anim: 0, t: packStat('stay'),
    dir: -back, faceVis: -back, spd: PACK_CALL.spd, kind: 'crawler', hp: 1,
    coilT: 0, lungeT: 0, biteCD: 0.3, bit: null, leaveT: 0, airT: 0, pack: 1,
  };
  // ...inside the room: called with her back to the room's edge it used to
  // come in from past the wall and run on the void outside it for its stay
  // (measured in V2: spawned at x 1292 in a room 1024 wide, never bit)
  const W = G.roomDef ? G.roomDef.w * TILE : 4000;
  w.x = clamp(w.x, TILE + 4, W - TILE - 4 - w.w);
  // it comes in from off her shoulder, not out of the floor
  if (typeof solidAt === 'function' && solidAt(Math.floor((w.x + w.w / 2) / TILE), Math.floor((w.y + w.h / 2) / TILE))) w.x = p.x;
  G.packWolf = w;
  if (typeof sfx === 'function') sfx('alpha_howl_far');
  if (typeof burst === 'function') burst(w.x + w.w / 2, w.y + w.h, 10, '#b9a88a', 160, 0.5, 300, 2.4, true);
  return true;
}
// ===========================================================================
// IT COMES WITH HER (owner, 2026-11-27: "it should move with the screens when I
// go from one screen to another, which also is not. Not all the time, at
// least"). loadRoom used to drop the called wolf at every door — only a ridden
// Alpha crossed. Now loadRoom hands what is left of its stay to G.packCarry
// (packCarryOut), every crossing arms it once she is placed in the far room
// (packCarryArm: a side seam, a cut crossing, a vertical shaft, a ring gate,
// the sewer's hatch), and it comes in beside her, behind her shoulder, on the
// ground she stands on (packArrive) — the small wolf or the called Alpha, with
// the seconds it had left. A crossing made in the air (up a shaft, a drop
// through a floor) waits until her feet are down, the stay still running. A
// respawn or a load is not a crossing: nothing arms it, and the next call
// clears it. A wolf already loping off is not brought.
// ===========================================================================
const PACK_CARRY = { minT: 0.6, wait: 3, behind: 64, behindAlpha: 110 };
function packCarryOut() {
  const w = G.packWolf;
  if (!w || w.leaveT > 0 || !(w.t > PACK_CARRY.minT)) { G.packCarry = null; return null; }
  G.packCarry = { alpha: !!w.alpha, t: w.t, room: G.roomId, armed: false, waitT: 0 };
  return G.packCarry;
}
// a crossing has put her in the room: bring it (now, or when she lands)
function packCarryArm() {
  const C = G.packCarry;
  if (!C) return false;
  C.armed = true; C.room = G.roomId;
  return packArrive(0);
}
// the ground beside her that a body of this size can stand on: behind her
// first, then her other side, then where she stands; never in rock
function packArriveSpot(bw, bh, behind) {
  const p = player, W = G.roomDef.w * TILE, feet = p.y + p.h;
  const back = -(p.face || 1);
  const free = (x, y) => {
    for (let yy = y + 2; yy < y + bh - 1; yy += 8)
      for (const xx of [x + 2, x + bw / 2, x + bw - 2])
        if (solidAt(Math.floor(xx / TILE), Math.floor(yy / TILE))) return false;
    return true;
  };
  const under = (x) => {               // something to stand on within two tiles of her feet
    for (let yy = feet; yy < feet + TILE * 2; yy += 8)
      for (const xx of [x + 4, x + bw - 4]) if (solidAt(Math.floor(xx / TILE), Math.floor(yy / TILE))) return true;
    return false;
  };
  for (const off of [behind, behind * 1.6, behind * 0.6, -behind * 0.6, -behind, -behind * 1.6, 0]) {
    const x = clamp(p.x + p.w / 2 + back * off - bw / 2, TILE + 4, W - TILE - 4 - bw);
    const y = feet - bh;
    if (free(x, y) && under(x)) return { x, y };
  }
  return { x: clamp(p.x + p.w / 2 - bw / 2, 4, W - 4 - bw), y: feet - bh };
}
function packArrive(dt) {
  const C = G.packCarry;
  if (!C || !C.armed || G.packWolf) return false;
  if (C.room !== G.roomId || (typeof isHero === 'function' && isHero())) { G.packCarry = null; return false; }
  C.t -= dt || 0; C.waitT += dt || 0;
  if (C.t <= PACK_CARRY.minT * 0.5 || C.waitT > PACK_CARRY.wait) { G.packCarry = null; return false; }
  // in the air (a climb, a drop): it comes once there is ground under her
  if (!player || player.dead || !player.on || G.climb) return false;
  const keep = player.armCD;
  const ok = C.alpha && typeof alcCall === 'function' ? alcCall(player, { quiet: 1 }) : packCallQuiet(player);
  player.armCD = keep;                 // bringing it is not a second call
  G.packCarry = null;
  const w = G.packWolf;
  if (!ok || !w) return false;
  const at = packArriveSpot(w.w, w.h, w.alpha ? PACK_CARRY.behindAlpha : PACK_CARRY.behind);
  w.x = at.x; w.y = at.y; w.vy = 0; w.on = true;
  w.vx = 0; w.t = C.t; w.carried = (w.carried || 0) + 1;
  // it keeps its face to where she is going
  w.dir = player.face || 1; if (w.faceVis != null) w.faceVis = w.dir; if (w.face != null) w.face = w.dir;
  if (typeof burst === 'function') burst(w.x + w.w / 2, w.y + w.h, 6, '#b9a88a', 120, 0.4, 300, 2, true);
  return true;
}
// the small wolf, without the call's howl (it did not leave: it came through with her)
function packCallQuiet(p) {
  const s0 = typeof sfx === 'function' ? sfx : null;
  try { if (s0) sfx = () => {}; return packCall(p); } finally { if (s0) sfx = s0; }
}
function packStep(dt) {
  if (!G.packWolf && G.packCarry && G.packCarry.armed && G.state === 'PLAY') packArrive(dt);
  const w = G.packWolf; if (!w) return;
  if (w.alpha) { if (typeof alcStep === 'function') alcStep(w, dt); return; }   // the called Alpha (js/packtree.js)
  if (G.state !== 'PLAY') return;
  if (G.mount && G.mount.w === w) return;   // she is riding it: it goes where she does (js/wolfmount.js)
  w.anim += dt; w.t -= dt;
  if (w.biteCD > 0) w.biteCD -= dt;
  w.vy += 2000 * dt;
  const px = player.x + player.w / 2, cx = w.x + w.w / 2;
  if (w.t <= 0 && !w.leaveT) { w.leaveT = PACK_CALL.leave; w.coilT = 0; w.lungeT = 0; }
  let want = 0;
  if (w.leaveT > 0) {
    // ITS TIME IS UP: it lopes off the way it came, away from her
    w.leaveT -= dt;
    const away = Math.sign(cx - px) || w.dir || 1;
    w.dir = away; want = away * PACK_CALL.spd * 1.1;
    const sx = typeof worldScreenX === 'function' ? worldScreenX(cx) : cx - cam.x;
    // (it lopes a few strides before it is gone, even out of the frame: a
    // wolf whose time ran out at the screen's edge used to vanish on the beat)
    if (w.leaveT <= 0 || (PACK_CALL.leave - w.leaveT > 0.3 && (sx < -80 || sx > 1040))) { G.packWolf = null; return; }
  } else if (w.lungeT > 0) {
    // THE BITE: its flight is the move; the jaws land on what they meet once
    w.lungeT -= dt;
    const q = w.bit;
    if (q && !w.hitDone && !q.dead) {
      const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(q) : q;
      // the JAWS, not the collider: its drawn head reaches past the front of
      // its box and its open jaw above it (the hit is the drawn shape)
      const jaw = { x: w.dir > 0 ? w.x : w.x - 22, y: w.y - 18, w: w.w + 22, h: w.h + 18 };
      if (aabb(jaw, b)) {
        w.hitDone = true;
        packBite(w, q, packStat('dmg'));
      }
    }
    // a bite that MISSED (the quarry sprang clear) does not send it back to
    // dancing: it presses in again as soon as its jaws are ready
    if (w.lungeT <= 0) { w.biteCD = PACK_CALL.again; w.bit = null; if (!w.hitDone) { w.mind = 'close'; w.afterT = 0; } }
    const col = moveEnt(w, dt); w.on = !!col.d;
    w.vx *= Math.pow(0.3, dt);
    return;
  } else if (w.coilT > 0) {
    // GATHERED on its haunches, then it goes
    w.coilT -= dt; w.vx = 0;
    if (w.coilT <= 0 && w.bit && !w.bit.dead) {
      const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(w.bit) : w.bit;
      w.dir = Math.sign(b.x + b.w / 2 - cx) || w.dir;
      w.faceVis = w.dir;
      w.lungeT = PACK_CALL.lunge; w.hitDone = false;
      // ...and it springs at the height its quarry is at: up a bank, higher
      // (a cat leaping over it or one standing on a bank is reached: a spring
      // of up to ~150 px, the most a wolf's gather gives)
      const up = Math.max(0, (w.y + w.h) - (b.y + b.h));
      w.vx = w.dir * 470; w.vy = -230 - Math.min(560, up * 5); w.on = false;
      // and when it is down again it backs off and dances before the next
      w.mind = 'display'; w.dispT = 0; w.dispNeed = rnd(PACK_MIND.again[0], PACK_MIND.again[1]); w.afterT = PACK_MIND.after;
    }
  } else {
    want = packMind(w, dt, cx, px);
  }
  // turn its picture toward where it is going, in time, and walk like a wolf
  w.faceVis += clamp(w.dir - w.faceVis, -dt * 7, dt * 7);
  if (w.snapT > 0) w.snapT -= dt;
  if (w.guardT > 0) w.guardT -= dt;
  const ws = Math.sign(want);
  // (a back-step goes against its face on purpose: its stride runs backwards — wolves.js)
  if (w.backing && ws && ws !== w.dir) w.vx += clamp(want - w.vx, -PACK_CALL.spd * 4 * dt, PACK_CALL.spd * 4 * dt);
  else if (ws && Math.sign(w.faceVis) !== ws) w.vx *= Math.pow(0.02, dt);
  else if (!ws && w.brake) w.vx *= Math.pow(0.0005, dt);
  else w.vx += clamp(want - w.vx, -PACK_CALL.spd * 6 * dt, PACK_CALL.spd * 6 * dt);
  const col = moveEnt(w, dt);
  w.on = !!col.d;
  if (w.on) w.airT = 0; else w.airT += dt;
  // stuck at a wall it cannot cross: it jumps it — only once it has really
  // stopped against one; a hill's steps are walked, not hopped
  w.stuckT = (col.l || col.r) && want && Math.abs(w.x - (w._px == null ? w.x : w._px)) < 0.5 ? (w.stuckT || 0) + dt : 0;
  w._px = w.x;
  // (as high as the climb in front of it asks — up to the ledge its quarry or
  // she stands on: a wolf that fell into a pit beside a cat used to hop a
  // tile and a half against a wall three tiles tall for the rest of its stay)
  if (w.stuckT > 0.25 && w.on) {
    const tq = w.quarry && !w.quarry.dead ? (typeof hurtBoxOf === 'function' ? hurtBoxOf(w.quarry) : w.quarry) : player;
    const need = (w.y + w.h) - (tq.y + tq.h);
    w.vy = -Math.sqrt(4000 * clamp(need + 30, 80, 200)); w.on = false; w.stuckT = 0;
  }
  // fell out of the world, or far behind her in another part of the room
  if (G.roomDef && w.y > G.roomDef.h * TILE + 60) { w.x = player.x; w.y = player.y; w.vy = 0; }
}
// ---------------------------------------------------------------------------
// HER WOLF HAS THE PACK'S MIND (owner, 2026-11-26: "this is how it's going to
// start when I summon my small wolf ... a small wolf comes, helps in attack,
// attacks a little bit. It's not that strong"). The same dance the wild pack
// does to her (js/wolfmind.js), aimed at what hunts her: it comes in, stops
// and LOOKS at its quarry, goes in to a safe distance and holds there low and
// snarling, darts in once and snaps short of it, and only then closes, coils
// and bites — and after the bite it backs off, facing the quarry, and dances
// again. Its bite is the bite it always had; it simply bites less often than
// it used to (a bite every ~2.5 s, not every ~1.3 s): a helper, not a weapon.
// ---------------------------------------------------------------------------
const PACK_MIND = {
  look: 0.4,             // s it stands and looks at a new quarry
  ring: 40,              // px past its reach where it holds the quarry (edge to edge)
  band: 14,
  stalk: 88,             // px/s: in on the walk (the stalk strip; the gallop starts at 95)
  back: 80,              // px/s backing off, facing it
  // (owner, 2026-11-27: "the wolf I'm summoning is doing nothing. It should
  // help me with attacking a little bit" — a bite every ~2.6 s was three in a
  // stay; now about one every ~1.9 s, four or five in a stay, the dance kept)
  first: [0.4, 0.7],     // s of display before its first bite on a quarry
  again: [0.35, 0.6],    // ...and between bites
  after: 0.35,           // s backing off after a bite
  feint: [0.2, 0.45],    // s into the dance before it feints
  dartV: 250, dartT: 0.3, dartStop: 22,
  backT: 0.38,
  // THE PROMISE (owner, 2026-11-26: weak, "attacks a little bit" — never
  // idle). Once its quarry is within `near` px it has at most `must` s of
  // looking, dancing and feinting before it goes in; then it RUSHES to its
  // reach and bites, however the quarry moves (a cat holding its own guard
  // used to keep it dancing its whole stay). The clock starts again after
  // every bite it commits to.
  near: 220, must: 2.0,
};
function packMind(w, dt, cx, px) {
  const P = PACK_MIND;
  w.backing = false; w.brake = false; w.mindPose = null;
  // (it keeps the quarry it has chosen while that one is still in the fight
  // and in sight: two machines the same distance off must not reset its look
  // every time the nearer one changes)
  const k = w.quarry;
  const keep = k && !k.dead && !k.disabled && !k.calm && !k.rescued && !k.purified
    // (a leaping cat goes high over it: the one it is already on stays its
    // quarry through the leap, rather than dropping out of its sight mid-air)
    && Math.abs(k.x + k.w / 2 - cx) < PACK_CALL.sight && Math.abs(k.y + k.h / 2 - (w.y + w.h / 2)) < 340;
  const q = keep ? k : packQuarry(w);
  w.hunt = q ? 1 : 0;
  if (!q) {
    if (w.quarry) { w.lastQ = w.quarry; w.lostAt = w.anim; }
    w.quarry = null; w.mind = null;
    // nothing to hunt: at her heel
    const d = px - cx, ad = Math.abs(d);
    if (ad > 120) { w.dir = Math.sign(d) || w.dir; return w.dir * PACK_CALL.spd * (ad > 260 ? 1 : 0.5); }
    return 0;
  }
  const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(q) : q;
  const d = b.x + b.w / 2 - cx, gap = Math.abs(d) - b.w / 2, toward = Math.sign(d) || w.dir;
  if (w.quarry !== q && q === w.lastQ && w.anim - (w.lostAt || 0) < 2.5) {
    // THE SAME ONE, BACK IN SIGHT: no second look and no dance from the top —
    // it goes in (it used to start over every time a cat leapt out of view,
    // and spent its stay looking at a cat it had already looked at)
    w.quarry = q; w.lastQ = null; w.mind = 'close'; w.feint = null; w.nearT = 0;
  } else if (w.quarry !== q) {
    // A NEW QUARRY: it stops and looks before anything else
    w.quarry = q; w.mind = 'look'; w.lookT = P.look; w.feints = 0; w.dispT = 0; w.nearT = 0;
    w.dispNeed = rnd(P.first[0], P.first[1]); w.feintCD = rnd(P.feint[0], P.feint[1]); w.feint = null;
  }
  w.dir = toward; w.guardFace = toward; w.guardT = 0.12;
  if (gap < P.near) w.nearT = (w.nearT || 0) + dt;
  if (w.nearT > P.must && w.mind !== 'close') { w.feint = null; w.mind = 'close'; w.backing = false; }
  if (w.mind === 'look') {
    w.mindPose = 'look'; w.brake = true;
    if (Math.sign(w.faceVis) === toward && Math.abs(w.vx) < 6) w.lookT -= dt;
    if (w.lookT <= 0) { w.mind = 'display'; w.mindPose = null; }
    return 0;
  }
  // A QUARRY UP A BANK OR DOWN ONE is not danced at: there is no ground
  // between them to hold. It goes straight up to it, as it always did.
  if (w.mind === 'display' && !w.feint && Math.abs(b.y + b.h - (w.y + w.h)) > 36 && w.on !== false) w.mind = 'close';
  // GOING IN: the dance is done — in to its reach, then the coil (packStep)
  if (w.mind === 'close') {
    // (and from its quarry's own level: a lunge from a ledge sails over it)
    // (...or from under it, when it is up a bank or in the air over it: the
    // spring is aimed up — a leaping cat used to be out of its reach for good)
    const upQ = (w.y + w.h) - (b.y + b.h);
    if (gap < PACK_CALL.reach && upQ > -28 && upQ < PACK_BITE.upReach && w.biteCD <= 0 && w.on !== false && Math.sign(w.faceVis) === toward) {
      w.coilT = PACK_CALL.coil; w.bit = q; w.vx = 0; w.mind = 'bite'; w.nearT = 0; return 0;
    }
    // (in at a rush: it does not walk up to something that is moving off)
    return toward * (gap > PACK_CALL.reach + 20 ? PACK_CALL.spd : P.stalk);
  }
  // THE FEINT: in at a dart, stop short, snap at the air, back-step out
  const F = w.feint;
  if (F) {
    F.t -= dt;
    if (F.ph === 'dart') {
      if (gap <= PACK_CALL.reach + P.dartStop || F.t <= 0) { F.ph = 'snap'; F.t = 0.42; w.brake = true; w.vx *= 0.3; w.snapT = 0.42; if (typeof sfx === 'function') sfx('wolf_snap'); return 0; }
      return toward * P.dartV;
    }
    if (F.ph === 'snap') { w.brake = true; if (F.t <= 0) { F.ph = 'back'; F.t = P.backT; } return 0; }
    w.backing = true;
    if (F.t <= 0) { w.feint = null; w.feints++; w.feintCD = 9; }
    return -toward * P.back;
  }
  // THE DANCE: held at its distance, low and snarling
  if (w.afterT > 0) w.afterT -= dt;
  const ring = PACK_CALL.reach + P.ring;
  let want = 0;
  if (w.afterT > 0 || gap < ring - P.band) { w.backing = true; want = -toward * P.back; }
  else if (gap > ring + P.band) want = toward * (gap > ring + 60 ? PACK_CALL.spd : P.stalk);
  else { w.brake = true; if (Math.abs(w.vx) < 12) { w.dispT += dt; w.feintCD -= dt; } }   // the dance is counted AT BAY
  if (!want && w.feintCD <= 0 && w.on !== false && Math.abs(w.vx) < 12) { w.feint = { ph: 'dart', t: P.dartT }; return 0; }
  if (w.dispT >= w.dispNeed && (w.feints > 0) && w.biteCD <= 0 && !(w.afterT > 0)) w.mind = 'close';
  return want;
}
function drawPackWolf(c) {
  // a body, solid from the first frame to the last: it runs in and runs off
  const w = G.packWolf; if (!w) return;
  if (w.alpha) { if (typeof alcDraw === 'function') alcDraw(c, w); return; }
  if (typeof drawBeastPlate !== 'function') return;
  drawBeastPlate(c, w, WOLF_ART, true);
}

// ===========================================================================
// THE BOW (owner, 2026-11-20: "After finishing the alpha should step back, bow
// down to you as the new alpha ... not as a video, but as a gameplay ... and
// then maybe some other small wolves will stand behind the alpha and bow to
// you too").
//
// The yielded Alpha backs off two steps with its eyes on her — its own prowl,
// played backwards, so the paws walk back rather than slide — and then plays
// its filmed yield: the head drops, the forelegs fold, the chin goes to the
// floor, and it holds there. Three of the pack come in from the den behind it,
// stop in a row at its back facing her, and go down low on their forelegs
// (their own crouch, held at its lowest). A breath later they all rise, and
// they are hers. Once per save (flags.alphaBowed); she keeps her controls.
// ===========================================================================
const ALPHA_BOW = { back: 0.9, backV: 60, bow: 1.2, hold: 3.6, pack: 3, gap: 74 };
function alphaBowBegin(b) {
  const f = G.save && G.save.flags;
  if (!f || f.alphaBowed || (typeof isHero === 'function' && isHero())) { b.bowT = 0; return; }
  f.alphaBowed = 1;
  if (typeof persist === 'function') persist();
  b.bow0 = b.bowT = ALPHA_BOW.back + ALPHA_BOW.bow + ALPHA_BOW.hold;
  const px = player.x + player.w / 2;
  b.bowSide = Math.sign(b.cx() - px) || 1;           // away from her: where it backs to, and where the pack stands
  b.face = -b.bowSide; b.faceVis = b.face;
  const W = G.roomDef.w * TILE;
  for (let i = 0; i < ALPHA_BOW.pack; i++) {
    const tx = clamp(b.cx() + b.bowSide * (b.w * 0.5 + ALPHA_BOW.backV * ALPHA_BOW.back + 60 + i * ALPHA_BOW.gap), 50, W - 90);
    const sx = clamp(b.cx() + b.bowSide * (b.w * 0.5 + 400 + i * 70), 30, W - 70);
    const w = new Enemy('crawler', sx, (G.roomDef.h - 2) * TILE - 40);
    w.bowTo = tx; w.bowT = b.bowT + 0.3 - i * 0.2; w.dir = -b.bowSide;
    w.spd0 = w.spd; w.spd = 280;          // they come at a run, and walk once they are hers
    G.enemies.push(w);
  }
}
// the Alpha's own beat, inside its purified update; true while it runs
function alphaBowStep(b, dt) {
  if (!(b.bowT > 0)) { b.bowing = false; return false; }
  b.bowT -= dt;
  const el = b.bow0 - b.bowT;
  b.face = -b.bowSide;
  if (el < ALPHA_BOW.back) {
    b.vx = b.bowSide * ALPHA_BOW.backV; b.x += b.vx * dt; b.petWalk = true; b.bowing = false;
  } else {
    b.vx = 0; b.petWalk = false; b.bowing = true;
    b.bowU = clamp((el - ALPHA_BOW.back) / ALPHA_BOW.bow, 0, 0.999);
  }
  const ground = typeof groundColumnAt === 'function' ? groundColumnAt(b.cx()) : null;
  if (ground && ground.length) b.y = Math.min(...ground) - b.h;
  b.vy = 0;
  if (b.bowT <= 0) b.bowing = false;
  return true;
}
// a wolf of the pack coming in to bow behind it (from wolfTameStep)
function wolfBowStep(e, dt) {
  if (!(e.bowT > 0) || e.bowTo == null) { e.bowing = false; return false; }
  e.bowT -= dt;
  const cx = e.x + e.w / 2, d = e.bowTo - cx;
  const px = player.x + player.w / 2;
  if (!e.bowing && Math.abs(d) > 6) {
    e.dir = Math.sign(d);
    enemyGait(e, e.dir * e.spd, dt);
  } else {
    // arrived: round to face her, then down
    e.dir = Math.sign(px - cx) || e.dir;
    enemyGait(e, 0, dt);
    if (faceSide(e) === e.dir && Math.abs(e.vx) < 4) e.bowing = true;
  }
  e.vy += 2000 * dt;
  moveEnt(e, dt);
  if (e.bowT <= 0) { e.bowing = false; e.bowTo = null; if (e.spd0) e.spd = e.spd0; }
  return true;
}
