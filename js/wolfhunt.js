// ===========================================================================
// THE PACK HUNTS (owner, 2026-11-15: "the micro enemies need to attack in a
// better way, move in a better way, especially the wolves ... find wolves, see
// how they move, how they attack, how they roll, and replicate it with the
// wolves that we have as robots ... concentrate on the aggressive attacking
// moods of the wolf").
//
// A pack wolf used to be a crawler in a wolf's picture: it walked its beat
// whether she was in the room or not, and if she happened to be within reach
// when its timer ran out it coiled and lunged — from as far as 160 px, with a
// lunge that covers about 60, so most of its bites closed on air. Nothing in
// that is a wolf. What a wolf does, and what the filmed references show
// (assets/source/beasts/wolf3/), is this:
//
//   1. IT NOTICES HER. The head drops, the plates along its back stand up,
//      the jaw opens on its teeth — a threat display, held for half a second,
//      and that display is the first warning of the whole hunt.
//   2. IT COMES FOR HER. Far off it CHARGES, at a gallop; inside striking
//      distance of a rush it drops into the STALK — head under the line of
//      the back, slow heavy steps — and closes to the distance its lunge
//      actually covers. It no longer bites from where a bite cannot land.
//   3. IT BITES. The same coil, the same tell and the same length of tell the
//      crawler has always had (TELL_FAST; nothing here shortens a warning),
//      then the lunge — and a bite that LANDS is held and thrashed, the head
//      whipping side to side, before the animal is spent.
//   4. IT IS SPENT. The winded window is untouched: the opening the lunge has
//      always paid is still paid, at the same length.
//   5. A BLOW THAT THROWS IT ROLLS IT. Her heavy hit takes it off its feet:
//      it goes over its own back, scrambles up low and snarling, FACING HER —
//      and whatever it was winding up is gone. Her finisher is an interrupt.
//
// It gives up when she is gone: out of sight for a couple of seconds and it
// goes back to its beat. It never walks off a ledge to reach her — it stands
// at the edge with its teeth out, which is its own picture.
//
// Nothing here runs for anything but a pack wolf (isWolf — a crawler or a
// hopper in the wolves' kingdoms), and a tamed pack never hunts
// (wolfTameStep takes the frame long before this is asked).
// ===========================================================================
const WOLF_HUNT = {
  see: 300, seeY: 84,     // px: it notices her inside this, near its own level
  lose: 430, loseY: 150,  // ...and keeps the hunt up out to this
  loseT: 2.2,             // s out of sight before it goes back to its beat
  snarl: 0.5,             // s: the threat display that opens a hunt
  reachPad: 12,           // px past its own lunge distance: it coils inside that
  holdBack: 20,           // px short of that reach: where it stops crowding her
  chargeFrom: 196,        // px: further than this it runs; nearer, it stalks
  stalk: 1.12,            // × its own patrol speed
  charge: 1.75, chargeIq: 0.9,   // × patrol speed, and what cunning adds
  thrash: 0.42,           // s the bite is held and worried, when it lands
  roll: 0.66,             // s from the blow to back on its feet
  rollV: 380,             // px/s: a blow that throws it at least this hard rolls it
  again: 1.4,             // s before the same wolf will put on the display again
  snap: 0.42,             // s: one snap at the air while it holds her at bay
  snapEvery: [1.3, 2.3],  // s between them
};
// HOW FAR ITS LUNGE REALLY GOES — the crawler's own numbers (spd × 4.2 for
// 0.22 s + what cunning adds), so the distance it bites from can never drift
// from the distance the bite covers. Measured before this existed: a wolf that
// coiled at 108 px stopped 7 px short of a girl standing still.
function wolfReach(e) {
  return e.spd * 4.2 * (0.22 + (e.iq || 0) * 0.06) + WOLF_HUNT.reachPad;
}
function wolfHunter(e) {
  return !!e && e.kind === 'crawler' && typeof isWolf === 'function' && isWolf(e);
}
// ONCE A FRAME, FOR EVERY PACK WOLF, before anything in its update can return:
// the clocks the pictures run on, and the blow that rolls it.
function wolfFrame(e, dt) {
  if (typeof isWolf !== 'function' || !isWolf(e)) return;
  if ((e.snarlT || 0) > 0) e.snarlT -= dt;
  if ((e.thrashT || 0) > 0) e.thrashT -= dt;
  if ((e.snapT || 0) > 0) e.snapT -= dt;
  if ((e.snarlCD || 0) > 0) e.snarlCD -= dt;
  if ((e.rollT || 0) > 0) e.rollT -= dt;
  // THE THROW. attackKnock writes kbT and adds the blow to vx in one frame; a
  // kbT that went UP since last frame is a new blow, and a hard one rolls it.
  // Not through a lunge: that is the committed half of its own attack, and
  // the winded window it pays for is the opening — a roll there would replace
  // the picture she is meant to be reading.
  const kb = e.kbT || 0;
  if (kb > (e._kbWas || 0) + 1e-4 && Math.abs(e.vx || 0) >= WOLF_HUNT.rollV
      && !e.dead && !e.disabled && (e.lungeT || 0) <= 0 && (e.windedT || 0) <= 0
      && !(typeof packTamed === 'function' && packTamed())) {
    e.rollT = WOLF_HUNT.roll; e.roll0 = e.rollT;
    // it goes over AWAY from the blow and comes up FACING it
    const away = Math.sign(e.vx) || 1;
    e.dir = -away; e.faceVis = -away;
    // ...and the wind-up it was in does not survive leaving the ground
    if ((e.coilT || 0) > 0) { e.coilT = 0; e.dragT = 0; e.drag0 = 0; e.facetT = 0; e.facet0 = 0; e.atkCD = Math.max(e.atkCD || 0, 0.6); }
    if ((e.crouchT || 0) > 0 && e.kind === 'hopper') { e.crouchT = 0; e.gathered = false; e.t = Math.max(e.t || 0, 0.5); }
    e.snarlT = 0;
    if (typeof sfx === 'function') sfx('wolf_yelp');
  }
  e._kbWas = kb;
}
// AFTER THE THROW, ON THE GROUND: the second half of the roll is the scramble
// back onto its feet. Physics only — it is not thinking yet. True while it
// has the frame.
function wolfRollStep(e, dt) {
  if (!((e.rollT || 0) > 0) || typeof isWolf !== 'function' || !isWolf(e)) return false;
  e.vy += 2000 * dt;
  e.vx *= Math.pow(0.004, dt);
  moveEnt(e, dt);
  if (typeof onSpike === 'function' && onSpike(e)) { e._envDeath = 1; e.die(Math.sign(e.vx) || 1, -0.4); return true; }
  if (e.y > G.roomDef.h * TILE + 40) { e._envDeath = 1; e.die(0, 1); return true; }
  // dust off its back while it is still sliding
  if (Math.abs(e.vx) > 40 && e.on !== false && chance(dt * 26) && !G.artProbe)
    addPart(e.x + e.w / 2 + rnd(-10, 10), e.y + e.h - 1, rnd(-30, 30), rnd(-60, -10), 0.32, '#b9a48a', 1.8, 420);
  return true;
}
// THE HUNT ITSELF, asked from the crawler's patrol branch (so never during a
// coil, a lunge or the winded window — those are the crawler's own clocks and
// stay exactly what they were). Returns
//   0 — not hunting: walk the beat
//   1 — hunting: this drove the legs; the bite may arm
//   2 — hunting, and busy with the threat display: nothing arms through it
function wolfHunt(e, dt, px, py, cx, cy) {
  if (!wolfHunter(e) || player.dead) { e.hunt = 0; e.huntHold = false; return 0; }
  const H = WOLF_HUNT, dx = px - cx, ad = Math.abs(dx), dy = Math.abs(py - cy);
  const sees = e.hunt ? (ad < H.lose && dy < H.loseY) : (ad < H.see && dy < H.seeY);
  if (!e.hunt) {
    if (!sees) { e.huntHold = false; return 0; }
    e.hunt = 1; e.lostT = 0;
    e.dir = Math.sign(dx) || e.dir || 1;
    if (!((e.snarlCD || 0) > 0)) {
      e.snarlT = H.snarl; e.snarl0 = H.snarl; e.snarlCD = H.snarl + H.again;
      if (typeof sfx === 'function') sfx('wolf_snarl');
    }
  }
  if (!sees) {
    e.lostT = (e.lostT || 0) + dt;
    if (e.lostT > H.loseT) { e.hunt = 0; e.huntHold = false; return 0; }
  } else e.lostT = 0;
  const want = Math.sign(dx) || e.dir || 1;
  e.dir = want;
  // the edge of what it stands on is where the hunt stops: it holds there,
  // nose on her, and the crawler's own ledge turn is told not to spin it round
  // (looked for a brake's length ahead as well as at its feet: at a charge it
  // covers more ground stopping than the crawler's own probe looks across)
  const ahead = { x: e.x + want * Math.abs(e.vx || 0) * 0.12, y: e.y, w: e.w, h: e.h };
  const edge = !groundAhead(e, want) || !groundAhead(ahead, want);
  e.huntHold = edge;
  let v = 0;
  if ((e.snarlT || 0) > 0 || edge) v = 0;
  else if (ad > H.chargeFrom) v = e.spd * (H.charge + (e.iq || 0) * H.chargeIq);
  else if (ad > wolfReach(e) - H.holdBack) v = e.spd * H.stalk;
  enemyGait(e, want * v, dt);
  // AT BAY it does not simply stand: every second or two the jaws snap shut
  // on the air between them. A picture and a click — it is not an attack and
  // nothing is hurt by it; the attack is the coil, which still looks like one.
  if (!v && !((e.snarlT || 0) > 0) && Math.abs(e.vx || 0) < 6) {
    e.snapCD = (e.snapCD == null ? rnd(0.5, 1.2) : e.snapCD) - dt;
    if (e.snapCD <= 0) {
      e.snapCD = rnd(H.snapEvery[0], H.snapEvery[1]); e.snapT = H.snap;
      if (typeof sfx === 'function') sfx('wolf_snap');
    }
  } else e.snapT = 0;
  return (e.snarlT || 0) > 0 ? 2 : 1;
}
// THE BITE LANDED (the crawler's contact hit, while the lunge is on or just
// spent): it does not let go at once. Picture and sound only — the damage was
// the one contact hit, and the winded window it is now inside is unchanged.
function wolfBit(e) {
  if (!wolfHunter(e)) return;
  if (!((e.lungeT || 0) > 0 || (e.windedT || 0) > 0)) return;
  if ((e.thrashT || 0) > 0) return;
  e.thrashT = WOLF_HUNT.thrash; e.thrash0 = e.thrashT;
  // IT HAS HER, SO IT STOPS. A lunge that carried on through her left the wolf
  // shaking its head at nothing with her standing behind it (measured: the
  // body went past, and she was eased out of it on the far side). The commit
  // ends on the bite — the same transition the crawler makes when its lunge
  // runs out, at the same winded length — and she is thrown clear in front
  // of its nose, where the thrash is aimed.
  if ((e.lungeT || 0) > 0) {
    e.lungeT = 0; e.vx = 0;
    e.windedT = Math.max(0.5, 0.75 - (e.iq || 0) * 0.22);
    if (typeof e.shear === 'function') e.shear();
  }
  if (typeof sfx === 'function') sfx('wolf_bite');
  if (!G.artProbe) {
    const d = (e.faceVis != null ? e.faceVis : e.dir) >= 0 ? 1 : -1;
    burst(e.x + e.w / 2 + d * (e.w * 0.7), e.y + e.h * 0.4, 9, '#ffd0a0', 210, 0.34, 260, 2.2, true);
  }
  cam.shake = Math.max(cam.shake, 4);
}
