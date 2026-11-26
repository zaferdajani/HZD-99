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
  if (packCallsAlpha()) return alcCall(p);
  const k = (typeof EKIND !== 'undefined' && EKIND.crawler) || { w: 40, h: 28 };
  const back = -(p.face || 1);
  const w = {
    x: p.x + p.w / 2 + back * 150 - k.w / 2, y: p.y + p.h - k.h, w: k.w, h: k.h,
    vx: -back * PACK_CALL.spd, vy: -260, on: false, anim: 0, t: packStat('stay'),
    dir: -back, faceVis: -back, spd: PACK_CALL.spd, kind: 'crawler', hp: 1,
    coilT: 0, lungeT: 0, biteCD: 0.3, bit: null, leaveT: 0, airT: 0, pack: 1,
  };
  // it comes in from off her shoulder, not out of the floor
  if (typeof solidAt === 'function' && solidAt(Math.floor((w.x + w.w / 2) / TILE), Math.floor((w.y + w.h / 2) / TILE))) w.x = p.x;
  G.packWolf = w;
  if (typeof sfx === 'function') sfx('alpha_howl_far');
  if (typeof burst === 'function') burst(w.x + w.w / 2, w.y + w.h, 10, '#b9a88a', 160, 0.5, 300, 2.4, true);
  return true;
}
function packStep(dt) {
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
    if (w.leaveT <= 0 || sx < -80 || sx > 1040) { G.packWolf = null; return; }
  } else if (w.lungeT > 0) {
    // THE BITE: its flight is the move; the jaws land on what they meet once
    w.lungeT -= dt;
    const q = w.bit;
    if (q && !w.hitDone && !q.dead) {
      const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(q) : q;
      if (aabb(w, b)) {
        w.hitDone = true;
        const dm = Math.round(packStat('dmg') * ((typeof DF === 'function' && DF().pdmg) || 1));
        dealDmg(q, dm, null, b.x + b.w / 2, b.y + b.h / 2, true, 'pack');
        if (typeof sfx === 'function') sfx('wolf_bite');
        if (typeof burst === 'function') burst(b.x + b.w / 2, b.y + b.h / 2, 8, '#ffe6c8', 180, 0.3, 200, 2.2, true);
        if (!(q instanceof Boss) && q.kind !== 'turret') { q.kbT = 0.18; q.vx += w.dir * 200; q.vy -= 90; }
        if (q.hp <= 0 && !q.dead && typeof q.die === 'function') { q.die(w.dir, -0.3); if (typeof questPackKill === 'function') questPackKill(q); }
      }
    }
    if (w.lungeT <= 0) { w.biteCD = PACK_CALL.again; w.bit = null; }
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
      w.vx = w.dir * 470; w.vy = -230; w.on = false;
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
  if (w.stuckT > 0.25 && w.on) { w.vy = -560; w.on = false; w.stuckT = 0; }
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
  first: [0.6, 1.0],     // s of display before its first bite on a quarry
  again: [0.7, 1.2],     // ...and between bites
  after: 0.45,           // s backing off after a bite
  feint: [0.2, 0.45],    // s into the dance before it feints
  dartV: 250, dartT: 0.3, dartStop: 22,
  backT: 0.38,
};
function packMind(w, dt, cx, px) {
  const P = PACK_MIND;
  w.backing = false; w.brake = false; w.mindPose = null;
  const q = packQuarry(w);
  w.hunt = q ? 1 : 0;
  if (!q) {
    w.quarry = null; w.mind = null;
    // nothing to hunt: at her heel
    const d = px - cx, ad = Math.abs(d);
    if (ad > 120) { w.dir = Math.sign(d) || w.dir; return w.dir * PACK_CALL.spd * (ad > 260 ? 1 : 0.5); }
    return 0;
  }
  const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(q) : q;
  const d = b.x + b.w / 2 - cx, gap = Math.abs(d) - b.w / 2, toward = Math.sign(d) || w.dir;
  if (w.quarry !== q) {
    // A NEW QUARRY: it stops and looks before anything else
    w.quarry = q; w.mind = 'look'; w.lookT = P.look; w.feints = 0; w.dispT = 0;
    w.dispNeed = rnd(P.first[0], P.first[1]); w.feintCD = rnd(P.feint[0], P.feint[1]); w.feint = null;
  }
  w.dir = toward; w.guardFace = toward; w.guardT = 0.12;
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
    if (gap < PACK_CALL.reach && w.biteCD <= 0 && w.on !== false && Math.sign(w.faceVis) === toward) {
      w.coilT = PACK_CALL.coil; w.bit = q; w.vx = 0; w.mind = 'bite'; return 0;
    }
    return toward * (gap > PACK_CALL.reach + P.ring + 30 ? PACK_CALL.spd : P.stalk);
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
