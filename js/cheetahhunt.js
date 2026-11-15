// ===========================================================================
// THE CHEETAHS HUNT LIKE CHEETAHS (owner, 2026-11-15: "Inside the caves, those
// cheetahs are actually not moving in a good manner... look for how cheetahs
// move and then convert it into real movement").
//
// Filmed before this existed (seven seconds of one in the long dark): it stood
// where it was for 1.7 s, gathered, hopped 70 px, and stood for 2.7 s more. A
// statue that hops. It owned a filmed walk and a filmed gallop and used
// neither, because nothing ever asked it to go anywhere — the crawler in a
// cat's picture walked a beat, and the hopper in one did not walk at all.
//
// What a cheetah does, and it is nothing like what a wolf does:
//
//   1. IT STALKS. It sees her from a long way off — much further than a wolf
//      — and comes in LOW AND SLOW, a creep, not a walk. And it creeps while
//      her back is turned: when she looks at it, it FREEZES where it is. That
//      is the real animal (a stalking cat stops dead the moment the prey's
//      head comes up) and it is a thing she can read and use: face it and it
//      stops coming. Not for ever — a hungry cat's patience runs out.
//   2. IT SPRINTS. Inside sprinting distance it breaks, from a creep to the
//      fastest thing in the caves (2.5x its patrol; the pack charges at 1.75),
//      on its gallop strip — and bites from the distance its lunge really
//      covers, with the same coil and the same length of warning every
//      crawler has (TELL_FAST: nothing here shortens a tell).
//   3. IT CANNOT TURN. All that speed goes one way. If she is suddenly behind
//      it — over its back, through its legs — it SKIDS: claws out, braking,
//      its back to her for a third of a second before it can come round. The
//      answer to a sprinting cheetah is to not be in front of it.
//   4. IT IS SPENT. The winded window after the lunge is the crawler's own,
//      untouched — and for this animal it is the truest picture it has: a
//      cheetah that has run is a cheetah lying there panting.
//   5. IT GIVES GROUND. With no bite in it — just spent, or only just arrived
//      — it does not stand at biting distance waiting for one. It turns, trots
//      out to where a run can start from, comes round, and runs again. Sprint,
//      bite, pant, withdraw, sprint: the rhythm of the real hunt, and each
//      withdrawal shows her its back.
//
// The LEAPING cat (a hopper in the cats' kingdoms) keeps its own machine — the
// gather and the leap are exactly what they were — but it no longer stands
// like furniture between leaps: it PACES, back and forth across its ground
// with its eyes on her, the way a big cat waits, and comes in to leaping
// distance if she hangs back.
//
// Every picture here is one it already had: the filmed walk (the creep and
// the pacing), the filmed gallop (the sprint), the landing strip (the skid),
// the pant (spent). Nothing new was drawn — see ART_QUEUE §2bq for the takes
// that would give the stalk and the skid bodies of their own.
// ===========================================================================
const CAT_HUNT = {
  see: 460, seeY: 96,      // px: it notices her inside this (the pack: 300)
  lose: 580, loseY: 170,   // ...and keeps the hunt up out to this
  loseT: 2.6,              // s out of sight before it goes back to its beat
  creep: 0.7,              // x its patrol speed: the stalk
  patience: 1.5,           // s it will stand frozen under her eye before it comes anyway
  sprintFrom: 290,         // px: inside this the stalk is over and it runs — far enough out to reach full speed
  sprint: 2.5, sprintIq: 0.8,   // x patrol speed, and what cunning adds
  reachPad: 14,            // px past its own lunge distance: it coils inside that
  skid: 0.36,              // s braking with its back to her when it overshoots
  skidFrom: 150,           // px/s: slower than this it simply turns
  ready: 0.3,              // s of cooldown left at which it comes in again
  standoff: 265, backV: 0.9,    // px it gives ground to with no bite in it, and x patrol speed
  beat: [0.45, 0.8], beatSpan: 60, beatV: 0.62,   // the pacing out there: s a leg, px of line, x patrol speed
  trotMax: 90,             // px/s: giving ground and pacing stay on the WALK strip (the gallop starts at 95)
  // the leaping cat's pacing, in px and px/s (its `spd` is its leap, not its legs)
  paceV: 78, paceSpan: [0.8, 1.5], closeV: 90, closeFrom: 210, tooNear: 96,
  settle: 0.18,            // s before the gather in which it stops walking: the crouch starts from a stand
};
function catHunter(e) { return !!e && e.kind === 'crawler' && typeof isCheetah === 'function' && isCheetah(e); }
// how far its lunge really goes: the crawler's numbers, and a cheetah's half-again commit
function catReach(e) { return e.spd * 4.2 * (0.22 + (e.iq || 0) * 0.06) * 1.5 + CAT_HUNT.reachPad; }
// is she looking at it? Facing its side of her, and near enough her own level to see it
function catWatched(e, px, py, cx, cy) {
  if (!player || player.dead) return false;
  const side = Math.sign(cx - px) || 1;
  return (player.face || 1) === side && Math.abs(py - cy) < 120;
}
// THE HUNT, asked from the crawler's patrol branch exactly as wolfHunt is.
//   0 - not hunting: walk the beat      1 - hunting: this drove the legs; the bite may arm
//   2 - hunting and busy (the skid): nothing arms through it
function catHunt(e, dt, px, py, cx, cy) {
  if (!catHunter(e) || player.dead) { if (e && catHunter(e)) { e.hunt = 0; e.huntHold = false; } return 0; }
  const H = CAT_HUNT, dx = px - cx, ad = Math.abs(dx), dy = Math.abs(py - cy);
  // ---- the skid owns the frame while it lasts ----
  if ((e.skidT || 0) > 0) {
    e.skidT -= dt;
    e.landT = Math.max(0, e.skidT); e.land0 = H.skid;         // it wears the braking strip
    e.vx *= Math.pow(0.012, dt);
    if (!G.artProbe && Math.abs(e.vx) > 30 && chance(dt * 34))
      addPart(e.x + e.w / 2 + Math.sign(e.vx) * rnd(4, 18), e.y + e.h - 1, -Math.sign(e.vx) * rnd(20, 90), rnd(-70, -10), 0.3, '#b9a48a', 1.8, 420);
    if (e.skidT <= 0) { e.vx = 0; e.dir = Math.sign(dx) || e.dir; e.landT = 0; }
    return 2;
  }
  const sees = e.hunt ? (ad < H.lose && dy < H.loseY) : (ad < H.see && dy < H.seeY);
  if (!e.hunt) {
    if (!sees) { e.huntHold = false; return 0; }
    e.hunt = 1; e.lostT = 0; e.frozeT = 0; e.dir = Math.sign(dx) || e.dir || 1;
  }
  if (!sees) { e.lostT = (e.lostT || 0) + dt; if (e.lostT > H.loseT) { e.hunt = 0; e.huntHold = false; e.running = 0; return 0; } }
  else e.lostT = 0;
  const want = Math.sign(dx) || e.dir || 1;
  // IT OVERSHOT: flat out one way, and she is the other. Claws out.
  if (Math.abs(e.vx || 0) >= H.skidFrom && Math.sign(e.vx) !== want && ad > 26) {
    e.skidT = H.skid; e.running = 0; e.frozeT = 0;
    if (typeof sfx === 'function') sfx('grind');
    return 2;
  }
  e.dir = want;
  const ahead = { x: e.x + want * Math.abs(e.vx || 0) * 0.14, y: e.y, w: e.w, h: e.h };
  const edge = !groundAhead(e, want) || !groundAhead(ahead, want);
  e.huntHold = edge;
  const reach = catReach(e);
  // its bite comes back while it hunts, not only while it stands in reach of
  // her (in reach, the crawler's own machine is the one counting)
  if (!(ad < reach && dy < 70) && (e.atkCD || 0) > 0) e.atkCD -= dt;
  let v = 0;
  if (edge) { v = 0; e.running = 0; }
  else if (e.running || ad <= H.sprintFrom) {
    // THE BREAK. Once it has gone it does not go back to creeping.
    e.running = 1;
    if ((e.atkCD || 0) > H.ready) {
      // NO BITE IN IT YET (it has just lunged, or only just seen her). It does
      // not stand at biting distance waiting for one, which is the statue this
      // file exists to remove: it GIVES GROUND — turns and trots out to where a
      // run can start from — and waits there, turned back to her. Its back is
      // to her on the way out, and she is five times faster than it trots.
      const away = -want;
      if (ad < H.standoff && groundAhead(e, away) && groundAhead({ x: e.x + away * 14, y: e.y, w: e.w, h: e.h }, away)) {
        e.dir = away; e.huntHold = false;
        enemyGait(e, away * Math.min(e.spd * H.backV, H.trotMax), dt);
        return 1;
      }
      // ...and out there it does not stand either: it PACES a short beat
      // across the line it will run down, the way the leaping cat does.
      e.paceT = (e.paceT || 0) - dt;
      if (e.paceT <= 0 || !e.paceDir) { e.paceDir = e.paceDir ? -e.paceDir : want; e.paceT = rnd(H.beat[0], H.beat[1]); }
      if (ad > H.standoff + H.beatSpan && e.paceDir === away) { e.paceDir = want; e.paceT = rnd(H.beat[0], H.beat[1]); }
      if (ad < H.standoff + 6 && e.paceDir === want) { e.paceDir = away; e.paceT = rnd(H.beat[0], H.beat[1]); }
      const pd = e.paceDir;
      if (groundAhead(e, pd) && groundAhead({ x: e.x + pd * 14, y: e.y, w: e.w, h: e.h }, pd)) {
        e.dir = pd; e.huntHold = false;
        enemyGait(e, pd * Math.min(e.spd * H.beatV, H.trotMax), dt);
        return 1;
      }
      // CORNERED: nothing behind it to give. It turns on her, and a cornered
      // cat does not wait long — its bite comes back at twice the rate. The
      // coil that follows is the full one; only the standing is shorter.
      e.paceDir = -pd; e.paceT = rnd(H.beat[0], H.beat[1]);
      e.atkCD -= dt;
      v = 0;
    } else if (ad > reach - 16) v = e.spd * (H.sprint + (e.iq || 0) * H.sprintIq);
  } else if (catWatched(e, px, py, cx, cy) && (e.frozeT = (e.frozeT || 0) + dt) < H.patience) {
    v = 0;                                                    // seen: it stops dead
  } else {
    if (!catWatched(e, px, py, cx, cy)) e.frozeT = Math.max(0, (e.frozeT || 0) - dt * 0.5);
    // out of patience, it comes at a run from wherever it is
    if ((e.frozeT || 0) >= H.patience) e.running = 1;
    v = e.spd * H.creep;
  }
  enemyGait(e, want * v, dt);
  if (ad > H.sprintFrom + 120 && !e.huntHold && (e.frozeT || 0) < H.patience) e.running = 0;   // she got clear: it stalks again
  return 1;
}
// THE LEAPING CAT BETWEEN LEAPS: the horizontal speed it wants this frame, or 0
// to stand. Asked from the hopper's own ground state, after its landing has
// been absorbed and before it gathers — never during the crouch.
function catPace(e, dt, px, cx) {
  if (typeof isCheetah !== 'function' || !isCheetah(e) || e.kind !== 'hopper' || !player || player.dead) return 0;
  if ((e.landT || 0) > 0 || (e.crouchT || 0) > 0 || (e.t || 0) < CAT_HUNT.settle || e.disabled) return 0;
  const H = CAT_HUNT, dx = px - cx, ad = Math.abs(dx);
  if (ad > H.lose) return 0;
  let v;
  if (ad > H.closeFrom) v = (Math.sign(dx) || 1) * H.closeV;            // she hangs back: it comes in
  else {
    // ...at leaping distance it paces across its own ground, eyes on her
    e.paceT = (e.paceT == null ? rnd(0.3, 0.8) : e.paceT) - dt;
    if (e.paceT <= 0 || !e.paceDir) { e.paceDir = e.paceDir ? -e.paceDir : (chance(0.5) ? 1 : -1); e.paceT = rnd(H.paceSpan[0], H.paceSpan[1]); }
    // never INTO her, and never off its ledge
    if (ad < H.tooNear && Math.sign(dx) === e.paceDir) { e.paceDir = -e.paceDir; e.paceT = rnd(H.paceSpan[0], H.paceSpan[1]); }
    v = e.paceDir * H.paceV;
  }
  if (!groundAhead(e, Math.sign(v)) || !groundAhead({ x: e.x + Math.sign(v) * 14, y: e.y, w: e.w, h: e.h }, Math.sign(v))) {
    e.paceDir = -Math.sign(v); e.paceT = rnd(H.paceSpan[0], H.paceSpan[1]);
    // CORNERED — her on one side, the drop on the other. It does not wait
    // there long: the gather comes at twice the rate. The crouch is the full one.
    if (ad < H.tooNear) e.t -= dt;
    return 0;
  }
  return v;
}
