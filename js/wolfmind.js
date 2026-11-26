// ===========================================================================
// THE WOLF'S MIND (owner, 2026-11-26: "the small ones this world just roam
// around without feeling like they have any self-awareness which is wrong.
// They are creatures that should act like wolves ... how it senses a predator
// coming, how it shows a defense dance and starts attacking ... this is how
// it's going to start when I summon my small wolf").
//
// What was wrong, watched in A10R before this file: one wolf saw her and
// hunted; the seven others went on pacing their beats, back and forth, 500 px
// away, while their packmate bit her. Nothing in a wolf knew another wolf was
// there, nothing in it rested, and from the moment it saw her it ran straight
// in and bit — no looking, no measuring, no dance.
//
// WHAT REAL WOLVES DO (read before the numbers below were set):
//  - MacNulty, Mech & Smith 2007 (J. Mammalogy 88:595, "A proposed ethogram of
//    large-carnivore predatory behavior, exemplified by the wolf"; 2,150 h of
//    Yellowstone wolves): a hunt is SEARCH -> APPROACH -> WATCH -> ATTACK-GROUP
//    -> ATTACK-INDIVIDUAL -> CAPTURE. Watching — standing, fixed on the prey,
//    reading it — is its own common stage between coming and biting.
//  - Muro, Escobedo, Spector & Coppinger 2011 (Behavioural Processes 88:192):
//    the pack's encircling comes from two rules — close on the prey to a SAFE
//    DISTANCE (longer the more dangerous the prey), and once there, MOVE AWAY
//    FROM THE OTHER WOLVES. No leader, no plan: spacing alone surrounds it.
//  - Mech (Isle Royale; "The Wolves of Isle Royale", 1966) and the older moose
//    accounts: wolves "check their speed" until the prey bolts; prey that turns
//    and faces them is lunged at from all sides to make it run, and an animal
//    that stands its ground is tested and often LEFT — a wolf judges the cost.
//  - Threat display (wolf ethograms, e.g. UK Wolf Conservation Trust's; Mech &
//    Boitani 2003): stare, hackles up, lips curled off the canines, snarl,
//    the weight going back onto the haunches ready to spring.
//  - A wolf that is hurt pulls back; a lone survivor calls (barks / howls) for
//    the pack rather than taking on alone what the pack would.
//
// So a pack wolf here lives through five states, each with its own picture:
//
//   CALM     the pack at rest near its ground: sitting, nose down sniffing,
//            standing, a short prowl and back. Together, with purpose.
//   LOOK     it has noticed her: it stops dead and comes round to face her,
//            head up. The first to see her BARKS, and every wolf of its pack
//            stops what it is doing and looks too.
//   DISPLAY  the dance: the snarl, then in to a safe distance and HELD there —
//            low, teeth out — each further wolf on her side holding further
//            out (Muro's spacing), one working round to her other side over
//            her head when she has none there; the front one FEINTS: a dart in
//            that stops short, a snap at the air, and a back-step. She pushes
//            in hard and it gives ground, facing her.
//   COMMIT   one wolf at a time — or two from opposite sides, a beat apart —
//            stalks in to its reach and the crawler's own coil, lunge, bite
//            and thrash take it from there, at the lengths they always had.
//   HURT     a blow sends it back a few steps facing her; badly hurt it pants;
//            the last of a pack bays for the ones that are gone.
//
// Nothing here runs in a guardian's fight (the Alpha's own summons keep the
// hunt the boss ladder was measured against), on a tamed pack, or on her own
// small wolf (js/packcall.js drives that one with the same dance, aimed at
// what hunts her). `tests/wolf-mind.cjs` holds all of it.
// ===========================================================================
const WOLF_MIND = {
  pack: 560, packY: 170,       // px: wolves inside this of each other are one pack
  look: 0.45,                  // s the first to see her stands and looks
  lookHeard: [0.35, 0.75],     // s a packmate that heard the bark stands and looks
  call: 0.55,                  // s the bark (its bay strip) before its own snarl
  rally: 4,                    // s a packmate that heard the bark comes looking before it gives up
  ring: 58,                    // px past its own reach where the front wolf holds her
  ringStep: 70,                // px further out for each wolf behind it on the same side
  band: 16,                    // px of dead band round the ring (no dithering)
  dispFirst: [1.1, 1.6],       // s of display (at bay or feinting) before a wolf's first bite
  dispAgain: [1.5, 2.6],       // s between its bites (cunning takes off up to a third)
  lone: 0.55,                  // ...× for a wolf with no pack (a lone hunter tests her quicker)
  feintFirst: [0.25, 0.55],    // s into the dance before the front wolf's first feint
  feintEvery: [1.2, 2.1],      // s between feints
  dartV: 2.7, dartT: 0.34,     // × patrol speed, and the longest a dart runs
  dartStop: 18,                // px past its reach where a dart stops: short of her, always
  backV: 1.35, backMax: 88,    // × patrol speed for a back-step, never onto the gallop strip (95)
  backT: 0.42,                 // s of a feint's back-step
  stagger: 0.45,               // s: no two wolves' tells start closer together than this
  pincer: 0.45,                // s: a second wolf may commit from her OTHER side once the first has been in this long
  give: 2.6,                   // s a commit may take to reach her before it is called off
  after: 0.55,                 // s it backs off after its bite
  yield: 3.5,                  // s it stands at the back of its side's line after its bite (if there is a line)
  shy: 0.7,                    // s it backs off a blow
  crowd: 0.5,                  // s she may stand inside its bite before it bites anyway
  pant: 1.1, low: 0.45,        // s it pants when its hp falls under this share
  bay: 1.0,                    // s the last of a pack bays
  vaultEvery: [4.5, 7.5],      // s between one wolf's circlings
  vaultFrom: 98, vaultVx: 470, vaultVy: -720,
  // the calm (seconds, and × patrol speed for the prowl)
  sit: [3, 6], sniff: [1.6, 3.2], stand: [1.2, 2.6], prowlV: 0.55, roam: 110,
  // what it senses before it sees (px; s it stands nose-on; s it goes to look; s before it heeds again)
  sense: 420, senseY: 120, senseLook: 0.6, senseGo: 6, senseAgain: 5,
};
// ONE CLOCK AND ONE LEDGER PER ROOM: when a tell last started and when a bite
// was last given out, so no two start on one frame. The clock is the wolves'
// own: one wolf of the room (the lead, any live one) advances it each frame it
// runs (wolfMindFrame), so it keeps time however the frame was stepped — a
// harness that steps one body steps the clock too.
const WM = { room: null, lastTell: -99, lastGrant: -99, t: 0, lead: null };
// the minds that are AT her (a packmate in one of these is a pack in a fight)
const WM_FIGHT = { call: 1, display: 1, commit: 1, flank: 1 };
function wmNow() { return WM.t; }
function wmRoom() { if (WM.room !== G.roomId) { WM.room = G.roomId; WM.lastTell = -99; WM.lastGrant = -99; WM.lead = null; } }
// IS THIS A WILD PACK WOLF WITH A MIND? Not in a guardian's fight (the Alpha
// calls his own and they hunt as he was measured with), not tamed, not hers.
function wmFight() { return !!(G.boss && !G.boss.dead && typeof bossActive === 'function' && bossActive()); }
function wolfMindOn(e) {
  return !!e && typeof isWolf === 'function' && isWolf(e) && !e.pack && !e.dead && !e.disabled
    && !(typeof packTamed === 'function' && packTamed()) && !wmFight();
}
// its pack: the wild wolves near it, itself included
function wmPack(e) {
  const out = [], cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  for (const o of G.enemies || []) {
    if (!o || o.dead || o.disabled || !(o === e || wolfMindOn(o))) continue;
    if (Math.abs(o.x + o.w / 2 - cx) > WOLF_MIND.pack || Math.abs(o.y + o.h / 2 - cy) > WOLF_MIND.packY) continue;
    out.push(o);
  }
  return out;
}
// THE FACE STAYS ON HER whatever the feet do (Enemy.update reads guardFace;
// wolfPose runs a back-step's stride backwards, so it walks back, never slides)
function wmGuard(e, side) { e.guardFace = side; e.guardT = 0.12; }
// feet that go against the face, or faster than the walk's own ease: its own ease
function wmStep(e, want, dt, accT) {
  const a = Math.max(24, e.spd || 24) / (accT || 0.14) * dt, d = want - (e.vx || 0);
  e.vx = Math.abs(d) <= a ? want : (e.vx || 0) + Math.sign(d) * a;
}
function wmFloor(e, dir) {
  return groundAhead(e, dir) && groundAhead({ x: e.x + dir * 14, y: e.y, w: e.w, h: e.h }, dir);
}
// A TELL STARTED (seen from wolfFrame on its rising edge, whichever machine set it)
function wmTellSeen(e) {
  if (!wolfMindOn(e) && !(e.kind === 'hopper' && typeof isWolf === 'function' && isWolf(e))) return;
  const on = (e.coilT || 0) > 0 || (e.crouchT || 0) > 0;
  if (on && !e._wmTell) { wmRoom(); WM.lastTell = wmNow(); e._wmCoiled = 1; }
  e._wmTell = on;
}
// MAY A LEAPING WOLF GATHER NOW? Never on the beat another's tell started.
function wolfTellOK(e) {
  if (!(typeof isWolf === 'function' && isWolf(e)) || (typeof packTamed === 'function' && packTamed()) || wmFight()) return true;
  wmRoom();
  if (wmNow() - WM.lastTell < WOLF_MIND.stagger) return false;
  for (const o of wmPack(e)) if (o !== e && ((o.coilT || 0) > 0 || (o.crouchT || 0) > 0)) return false;
  return true;
}
// EVERY WOLF OF ITS PACK HEARS THE BARK: it stops and looks her way
function wmCall(e) {
  for (const o of wmPack(e)) {
    if (o === e || o.kind !== 'crawler' || (o.mind && o.mind !== 'calm')) continue;
    o.mind = 'look'; o.lookT = rnd(WOLF_MIND.lookHeard[0], WOLF_MIND.lookHeard[1]);
    o.heard = 1; o.rallyX = e.x + e.w / 2; o.rallyT = WOLF_MIND.rally; o.mindPose = 'look';
    o.dir = Math.sign(player.x + player.w / 2 - o.x - o.w / 2) || o.dir;
  }
  // ...the leaping ones get up off their haunches and stand (they keep their
  // own notice and their own leap: js/entities.js, the hopper)
  for (const o of wmPack(e)) if (o.kind === 'hopper' && !o.hunt) { o.chore = 'stand'; o.choreT = 3; o.mindPose = null; }
}
function wmCalmReset(e) {
  e.mind = 'calm'; e.hunt = 0; e.huntHold = false; e.mindPose = null; e.feint = null; e.flank = 0;
  e.choreT = rnd(0.6, 1.6); e.chore = 'stand'; e.heard = 0;
}
// THE BEGINNING OF ITS DANCE
function wmDisplay(e, snarl) {
  e.mind = 'display'; e.hunt = 1; e.lostT = 0; e.mindPose = null; e.dispT = 0; e.feint = null;
  e.dispNeed = rnd(WOLF_MIND.dispFirst[0], WOLF_MIND.dispFirst[1]);
  e.feintCD = rnd(WOLF_MIND.feintFirst[0], WOLF_MIND.feintFirst[1]);
  e.feints = 0;
  if (e.vaultCD == null) e.vaultCD = rnd(1.2, 2.4);
  if (snarl && !((e.snarlCD || 0) > 0)) {
    e.snarlT = WOLF_HUNT.snarl; e.snarl0 = WOLF_HUNT.snarl; e.snarlCD = WOLF_HUNT.snarl + WOLF_HUNT.again;
    if (typeof sfx === 'function') sfx('wolf_snarl');
  }
}
// ---------------------------------------------------------------------------
// THE MIND, asked in place of wolfHunt from the crawler's patrol branch (so
// never during its coil, lunge or winded window — those stay the crawler's).
// Returns what wolfHunt returned: 0 nothing (unused here), 1 the bite may arm,
// 2 busy — the legs are driven and nothing arms.
// ---------------------------------------------------------------------------
function wolfMind(e, dt, px, py, cx, cy) {
  const M = WOLF_MIND, H = WOLF_HUNT;
  wmRoom();
  if (!e.mind) wmCalmReset(e);
  const dx = px - cx, ad = Math.abs(dx), dy = Math.abs(py - cy);
  const toward = Math.sign(dx) || e.dir || 1;
  const alerted = e.mind !== 'calm';
  const sees = !player.dead && (alerted ? (ad < H.lose && dy < H.loseY) : (ad < H.see && dy < H.seeY))
    && (typeof foeLOS !== 'function' || foeLOS(e, dt, px, py, cx));
  const pack = wmPack(e);
  // a packmate in the fight: a wolf that has not seen her yet still knows
  const fighting = pack.find(o => o !== e && o.kind === 'crawler' && WM_FIGHT[o.mind]);
  // ---- a blow it took (wolfFrame saw the hp fall) ----
  if ((e.shyT || 0) > 0 && e.mind !== 'calm') {
    e.shyT -= dt; e.dir = toward; wmGuard(e, toward); e.feint = null;
    if (e.mind === 'commit') e.mind = 'display';
    if (wmFloor(e, -toward) && faceSide(e) === toward) wmStep(e, -toward * Math.min(e.spd * M.backV, M.backMax), dt);
    else wmStep(e, 0, dt, 0.08);
    if (e.shyT <= 0 && e.pantNext) { e.pantNext = 0; e.pantT = M.pant; }
    return 2;
  }
  if ((e.pantT || 0) > 0) {
    e.pantT -= dt; e.mindPose = 'pant'; e.dir = toward; wmGuard(e, toward); wmStep(e, 0, dt, 0.08);
    if (e.pantT <= 0) e.mindPose = null;
    return 2;
  }
  // ---- CALM ----
  if (e.mind === 'calm') {
    if (sees) {
      // IT HAS NOTICED HER. It stops; it comes round; it looks.
      e.mind = 'look'; e.lookT = M.look + rnd(0, 0.15); e.hunt = 1; e.lostT = 0; e.mindPose = 'look'; e.heard = 0;
      e.dir = toward; e.alertN = (e.alertN | 0) + 1;
      // the first of its pack to see her calls the others
      e.caller = pack.filter(o => o !== e && o.kind === 'crawler' && (!o.mind || o.mind === 'calm')).length > 0
        || pack.some(o => o !== e && o.kind === 'hopper' && !o.hunt);
      // (one bark to a pack: one that saw her on the same beat as another just looks)
      if (pack.some(o => o !== e && (o.mind === 'call' || (o.mind === 'look' && o.caller)))) e.caller = 0;
      enemyGait(e, 0, dt);
      return 2;
    }
    // ...or it hears its pack at her (it was out of earshot of the bark, or
    // came round a rock): it stops what it is doing and looks
    if (fighting) {
      e.mind = 'look'; e.lookT = rnd(M.lookHeard[0], M.lookHeard[1]); e.hunt = 1; e.heard = 1; e.mindPose = 'look';
      e.rallyX = fighting.x + fighting.w / 2; e.rallyT = M.rally; e.dir = toward;
      enemyGait(e, 0, dt);
      return 2;
    }
    // IT SENSES HER before it can see her (a sound, the wind): it stops, nose
    // her way, and goes to look — calmly, on its own ground, never hunting
    // through rock: it comes for her only once it SEES her (above)
    if ((e.senseCD || 0) > 0) e.senseCD -= dt;
    if (!player.dead && e.chore !== 'sense' && e.chore !== 'nose' && !(e.senseCD > 0)
        && ad < M.sense && dy < M.senseY) {
      e.chore = 'sense'; e.choreT = M.senseLook; e.senseX = px; e.senseCD = M.senseAgain;
    }
    if (e.chore === 'sense' || e.chore === 'nose') {
      e.hunt = 0; e.mindPose = null;
      if (e.chore === 'sense') {
        e.dir = toward; enemyGait(e, 0, dt); e.mindPose = 'look';
        if (faceSide(e) === toward && (e.choreT -= dt) <= 0) { e.chore = 'nose'; e.choreT = M.senseGo; }
      } else {
        const go = Math.sign(e.senseX - cx);
        // (it climbs what a wolf climbs — moveEnt steps it up a heap — and
        // stops where the floor drops away or a wall stops it dead)
        e.noseStuck = Math.abs(e.x - (e._noseX == null ? e.x + 9 : e._noseX)) < 0.2 ? (e.noseStuck || 0) + dt : 0; e._noseX = e.x;
        if (!go || Math.abs(e.senseX - cx) < 40 || !groundAhead(e, go) || e.noseStuck > 0.5 || (e.choreT -= dt) <= 0) {
          e.chore = 'stand'; e.choreT = rnd(1, 2); enemyGait(e, 0, dt);
        } else { e.dir = go; enemyGait(e, go * e.spd * M.prowlV, dt); }
      }
      return 2;
    }
    return wmCalm(e, dt, pack, cx);
  }
  // ---- it knows: lost her for long enough, it settles again ----
  if (!sees && e.mind !== 'look' && e.mind !== 'call') {
    if (fighting || (e.heard && (e.rallyT || 0) > 0)) {
      // it heard the bark, or its pack is at her, but it cannot see her: it
      // goes to where they are; where it cannot get to them it stands and
      // watches her way. It does not sit down while its pack fights.
      e.mind = 'rally';
      if (fighting) { e.rallyX = fighting.x + fighting.w / 2; e.rallyT = Math.max(e.rallyT || 0, 1); } else e.rallyT -= dt;
      const rd = (e.rallyX || cx) - cx;
      const go = Math.abs(rd) > 60 && huntGround(e, Math.sign(rd), 0) ? Math.sign(rd) : 0;
      if (go) { e.dir = go; e.mindPose = null; }
      else { e.dir = toward; e.mindPose = 'look'; }
      enemyGait(e, go * e.spd * H.stalk, dt);
      if (e.rallyT <= 0 && !fighting) wmCalmReset(e);
      return 2;
    }
    e.lostT = (e.lostT || 0) + dt;
    if (e.lostT > H.loseT) { wmCalmReset(e); return 2; }
  } else if (sees) { e.lostT = 0; if (e.mind === 'rally') { e.heard = 0; e.mindPose = null; wmDisplay(e, true); } }
  // ---- LOOK: frozen, coming round to her, head up ----
  if (e.mind === 'look') {
    e.dir = toward; e.mindPose = 'look';
    enemyGait(e, 0, dt);
    if (faceSide(e) === toward && Math.abs(e.vx) < 4) e.lookT -= dt;
    if (e.lookT <= 0) {
      e.mindPose = null;
      if (e.heard && !sees) { e.mind = 'rally'; return 2; }
      if (e.caller) {
        // THE BARK: its call, on its bay strip, before its own display
        e.caller = 0; e.mind = 'call'; e.callT = M.call; e.mindPose = 'bay';
        if (typeof sfx === 'function') sfx('wolf_bark');
        wmCall(e);
        return 2;
      }
      e.heard = 0; wmDisplay(e, true);
    }
    return 2;
  }
  if (e.mind === 'call') {
    e.dir = toward; wmGuard(e, toward); enemyGait(e, 0, dt);
    if ((e.callT -= dt) <= 0) { e.mindPose = null; wmDisplay(e, true); }
    return 2;
  }
  // ---- the last of its pack bays for the others ----
  const hunters = pack.filter(o => o.kind === 'crawler' && o.mind && o.mind !== 'calm');
  const nPack = pack.length;
  if ((e._packMax || 0) >= 2 && nPack === 1 && !e.lastBay && e.mind !== 'commit') {
    e.lastBay = 1; e.bayT = M.bay; e.mindPose = 'bay';
    if (typeof sfx === 'function') sfx('wolf_bark');
  }
  e._packMax = Math.max(e._packMax || 0, nPack);
  if ((e.bayT || 0) > 0) {
    e.bayT -= dt; e.dir = toward; wmGuard(e, toward); wmStep(e, 0, dt, 0.08);
    if (e.bayT <= 0) { e.mindPose = null; e.dispNeed = (e.dispNeed || 1) * 1.4; }
    return 2;
  }
  // ---- the commit it was given has run its course (the coil started) ----
  if (e.mind === 'commit' && e._wmCoiled) {
    e._wmCoiled = 0; e.mind = 'display'; e.dispT = 0; e.afterT = M.after; e.bites = (e.bites | 0) + 1; e.yieldT = M.yield;
    e.dispNeed = rnd(M.dispAgain[0], M.dispAgain[1]) * (1 - Math.min(0.33, (e.iq || 0) * 0.3));
    e.feintCD = rnd(M.feintEvery[0], M.feintEvery[1]) * 0.6;
  }
  e._wmCoiled = 0;
  // ---- THE FLANK: over her head to her empty side ----
  if (e.mind === 'flank') return wmFlank(e, dt, px, cx, toward);
  if (e.vaultCD > 0) e.vaultCD -= dt;
  e.dir = toward; wmGuard(e, toward);
  const reach = wolfReach(e);
  // ---- COMMIT: in to its reach; the crawler's own coil takes it from there ----
  if (e.mind === 'commit') {
    e.commitT = (e.commitT || 0) + dt;
    if (e.commitT > M.give || (e.huntHold && ad > reach + 30)) { e.mind = 'display'; e.dispT = 0; return 2; }
    const edge = !huntGround(e, toward, Math.abs(e.vx || 0) * 0.12);
    e.huntHold = edge;
    let v = 0;
    // (committed, it RUSHES the open ground and stalks only the last stride)
    if (!edge && faceSide(e) === toward) v = ad > reach + 56 ? e.spd * (H.charge + (e.iq || 0) * H.chargeIq)
      : ad > reach - H.holdBack ? e.spd * H.stalk : 0;
    enemyGait(e, toward * v, dt);
    return 1;
  }
  // ---- DISPLAY ----
  if (e.mind !== 'display') wmDisplay(e, false);
  if ((e.snarlT || 0) > 0) { enemyGait(e, 0, dt); return 2; }
  if (e.feint) { e.dispT += dt; return wmFeint(e, dt, ad, reach, toward); }   // (a feint is the dance too)
  // ITS PLACE ROUND HER (Muro et al.): the nearest on each side holds at its
  // safe distance, each one behind it further out — they space themselves
  const side = -toward;                                    // which side of her it stands
  const mates = hunters.filter(o => o !== e && (Math.sign(o.x + o.w / 2 - px) || 1) === side);
  // ...and they TAKE TURNS at the front: one that has just bitten drops to
  // the back of its side's line, and the next one comes up to test her
  if ((e.yieldT || 0) > 0) e.yieldT -= dt;
  const qd = (o) => Math.abs(o.x + o.w / 2 - px) + ((o.yieldT || 0) > 0 ? 1000 : 0);
  const myQ = qd(e);
  const rank = mates.filter(o => qd(o) < myQ).length;
  const across = hunters.some(o => o !== e && (Math.sign(o.x + o.w / 2 - px) || 1) === -side);
  const lone = hunters.length <= 1;
  const target = reach + M.ring + rank * M.ringStep;
  // the after-bite back-off: away from her, facing her, to its ring
  if ((e.afterT || 0) > 0) e.afterT -= dt;
  const edgeIn = !huntGround(e, toward, Math.abs(e.vx || 0) * 0.12);
  // CAN IT GET TO HER AT ALL? Her floor is not its floor (a drop, a gap
  // between): it goes to the brink and holds her there, nose on her
  e.cutOffT = (e.cutOffT || 0) - dt;
  if (e.cutOffT <= 0) { e.cutOffT = 0.2; e.cutOff = !huntGround(e, toward, Math.max(0, ad - 24)) || Math.abs(py - cy) > 70; }
  e.huntHold = edgeIn;
  // (a band with a memory: holding, it stays held until she is well out of it)
  const band = e.holding ? M.band * 2.5 : M.band;
  let mode = 'hold';
  if ((e.landT || 0) > 0) mode = 'still';
  else if (e.cutOff) mode = edgeIn ? 'hold' : 'in';
  else if (ad > target + band && !edgeIn) mode = 'in';
  else if (ad < target - band || (e.afterT || 0) > 0) mode = wmFloor(e, side) ? 'back' : 'cornered';
  if (faceSide(e) !== toward && mode !== 'still') mode = 'turn';
  e.holding = mode === 'hold' || mode === 'cornered';
  // CROWDED: she has come inside its bite and stays there however it gives
  // ground — a wolf crowded like that stops dancing and bites (no warning is
  // shortened by it: the coil that follows is the whole tell)
  e.crowdT = ad < reach + 8 ? (e.crowdT || 0) + dt : Math.max(0, (e.crowdT || 0) - dt * 2);
  const crowded = e.crowdT > M.crowd;
  // the dance is counted AT BAY — standing its ground on her, not walking to it
  if (e.holding) { e.dispT += dt; if (e.feintCD > 0) e.feintCD -= dt; }
  if (mode === 'in') {
    // (the run and the walk with a memory too: it does not flicker between them)
    e.charging = e.charging ? ad - target > 24 : ad - target > 60;
    const far = e.charging && !e.cutOff;
    enemyGait(e, toward * e.spd * (far ? H.charge + (e.iq || 0) * H.chargeIq : H.stalk), dt);
  } else if (mode === 'back') {
    wmStep(e, side * Math.min(e.spd * M.backV, M.backMax), dt);
  } else if (mode === 'turn') {
    enemyGait(e, 0, dt);
  } else {
    // AT BAY: low, teeth out, standing its ground (bay strip once still)
    wmStep(e, 0, dt, 0.08);
    if (mode === 'cornered') e.dispT += dt;                // nowhere to give: it comes sooner
  }
  // THE FEINT: the front wolf darts in and stops short
  if (e.cutOff) return 2;                                  // nothing to test or bite across a drop
  if (rank === 0 && (mode === 'hold' || mode === 'cornered') && e.feintCD <= 0 && Math.abs(e.vx) < 10 && huntGround(e, toward, 30)) {
    e.feint = { ph: 'dart', t: M.dartT };
    return 2;
  }
  // THE FLANK: one that stands behind another on her side, with nobody on
  // her other side, goes round — over her, since in this world that is the
  // only way round (a wolf that runs THROUGH her would be a bite)
  if (rank >= 1 && !across && e.vaultCD <= 0 && e.holding && e.dispT > 0.5 && player.on
      && !hunters.some(o => o !== e && (o.mind === 'flank' || o.mind === 'commit')) && wmVaultLane(e, px, toward)) {
    e.mind = 'flank'; e.flankPh = 'run'; e.flankT = 1.6; e.flankTo = M.ring + reach;
    return 2;
  }
  // ITS TURN: the dance has run long enough, it has tested her once, and no
  // other wolf is biting — or one is, from her other side, a beat ago
  const need = (e.dispNeed || 1.5) * (lone ? M.lone : 1);
  // (only the wolf nearest her on its side goes: the ones behind it wait,
  // or work round — a wolf does not walk in past its packmate to bite)
  if (((rank === 0 && e.dispT >= need && (e.feints > 0 || e.bites > 0 || mode === 'cornered' || e.dispT >= need * 1.6) && !(e.afterT > 0)) || crowded)
      && mode !== 'turn' && wmGrant(e, hunters, px)) {
    e.mind = 'commit'; e.commitT = 0; e.atkCD = 0; e._wmCoiled = 0;
    return 2;
  }
  return 2;
}
// MAY IT GO NOW? One at a time; a pincer from her other side a beat after the first.
function wmGrant(e, hunters, px) {
  const now = wmNow();
  if (now - WM.lastGrant < WOLF_MIND.stagger || now - WM.lastTell < WOLF_MIND.stagger) return false;
  const side = Math.sign(e.x + e.w / 2 - px) || 1;
  let busy = 0;
  for (const o of hunters) {
    if (o === e) continue;
    const goes = o.mind === 'commit' || (o.coilT || 0) > 0 || (o.lungeT || 0) > 0 || (o.windedT || 0) > 0 || (o.crouchT || 0) > 0;
    if (!goes) continue;
    busy++;
    if ((Math.sign(o.x + o.w / 2 - px) || 1) === side) return false;          // same side: wait its turn
    if (now - (o.commitAt == null ? -99 : o.commitAt) < WOLF_MIND.pincer) return false;
  }
  if (busy >= 2) return false;
  WM.lastGrant = now; e.commitAt = now;
  return true;
}
// a dart in, a snap at the air short of her, a back-step out — nothing arms
function wmFeint(e, dt, ad, reach, toward) {
  const M = WOLF_MIND, F = e.feint;
  F.t -= dt;
  if (F.ph === 'dart') {
    const stop = ad <= reach + M.dartStop || F.t <= 0 || !huntGround(e, toward, Math.abs(e.vx || 0) * 0.1 + 6);
    if (!stop) wmStep(e, toward * e.spd * M.dartV, dt, 0.07);
    else {
      F.ph = 'stop'; F.t = 0.2;
    }
  } else if (F.ph === 'stop') {
    wmStep(e, 0, dt, 0.035);                               // claws in: it brakes hard
    if (Math.abs(e.vx) < 6 || F.t <= 0) {
      e.vx = 0; F.ph = 'snap'; F.t = WOLF_HUNT.snap;
      e.snapT = WOLF_HUNT.snap;
      if (typeof sfx === 'function') sfx('wolf_snap');
    }
  } else if (F.ph === 'snap') {
    wmStep(e, 0, dt, 0.05);
    if (F.t <= 0) { F.ph = 'back'; F.t = M.backT; }
  } else {
    if (wmFloor(e, -toward)) wmStep(e, -toward * Math.min(e.spd * M.backV, M.backMax), dt);
    else wmStep(e, 0, dt, 0.08);
    if (F.t <= 0) { e.feint = null; e.feints = (e.feints | 0) + 1; e.feintN = (e.feintN | 0) + 1; e.feintCD = rnd(M.feintEvery[0], M.feintEvery[1]); }
  }
  return 2;
}
// is there a run up, her to go over, and ground beyond her to land on?
function wmVaultLane(e, px, toward) {
  const M = WOLF_MIND, feet = e.y + e.h, land = px + toward * (M.ring + wolfReach(e));
  if (!G.roomDef || land < 48 || land > G.roomDef.w * TILE - 48) return false;
  const pf = player.y + player.h;
  if (Math.abs(pf - feet) > 30) return false;
  for (let x = e.x + e.w / 2; Math.abs(x - land) > 10; x += toward * 14) {
    const gc = typeof groundColumnAt === 'function' ? groundColumnAt(x) : null;
    if (!gc || !(gc[0] < gc[1]) || Math.abs(gc[0] - feet) > 36) return false;
    // and nothing solid anywhere in the air it flies through (a block it
    // would land ON is not her other side, it is a perch above her)
    for (let h = 6; h <= 140; h += 12) if (wmBlocks(x, feet - h)) return false;
  }
  for (let x = land - 30; x <= land + 30; x += 15)
    for (let h = 6; h <= 60; h += 12) if (wmBlocks(x, feet - h)) return false;
  return true;
}
// rock, or a deck it would come down on (a one-way floor is a floor from above)
function wmBlocks(x, y) {
  const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
  return solidAt(tx, ty) || (typeof tileAt === 'function' && tileAt(tx, ty) === '=');
}
function wmFlank(e, dt, px, cx, toward) {
  const M = WOLF_MIND;
  e.flankT -= dt;
  if (e.flankPh === 'run') {
    e.dir = toward; wmGuard(e, toward);
    const ad = Math.abs(px - cx);
    if (e.flankT <= 0 || !huntGround(e, toward, 20)) { e.mind = 'display'; e.vaultCD = 2; return 2; }
    if (ad > M.vaultFrom) { enemyGait(e, toward * e.spd * (WOLF_HUNT.charge + 0.6), dt); return 2; }
    // OVER HER: a bound, nose-first; the leap strip draws it by its rise and fall
    // ...aimed to come down at its own distance on her far side, not past it
    const air = 2 * -M.vaultVy / 2000;
    e.flankPh = 'air'; e.vaultT = 1.2; e.flankDir = toward;
    e.vx = toward * clamp((ad + (e.flankTo || M.ring + 80)) / air, 260, M.vaultVx); e.vy = M.vaultVy; e.on = false; e.guardT = 0;
    faceCommit(e, toward);
    return 2;
  }
  // in the air the body is the crawler's physics; on the ground again it
  // absorbs the drop on its landing strip, then comes round to her
  e.guardT = 0; e.dir = e.flankDir || toward;
  if (e.on !== false && e.flankT < 1.55 - 0.12) {
    e.vaultT = 0; e.landT = HOP_LAND_T; e.land0 = HOP_LAND_T; e.vx *= 0.25;
    e.mind = 'display'; e.flankN = (e.flankN | 0) + 1;
    e.vaultCD = rnd(M.vaultEvery[0], M.vaultEvery[1]);
  }
  return 2;
}
// ---------------------------------------------------------------------------
// THE CALM. Each wolf goes through small chores of its own clock — it sits,
// it puts its nose down, it stands, it takes a few steps and stops — staying
// within reach of its own ground and drifting toward its pack, so a pack at
// rest reads as a pack at rest, not machines walking a line.
// ---------------------------------------------------------------------------
function wmCalm(e, dt, pack, cx) {
  const M = WOLF_MIND;
  e.hunt = 0; e.huntHold = false;
  e.choreT -= dt;
  if (e.chore === 'prowl') {
    const d = (e.prowlX == null ? cx : e.prowlX) - cx, go = Math.sign(d);
    // (the patrol's own test of the floor ahead: a heap is walked over, a drop or a spike bed is not)
    if (Math.abs(d) < 6 || !go || !groundAhead(e, go) || e.choreT <= 0) { e.choreT = 0; e.chore = 'stop'; }
    else { e.dir = go; enemyGait(e, go * e.spd * M.prowlV, dt); e.mindPose = null; return 2; }
  }
  enemyGait(e, 0, dt);
  if (e.choreT <= 0 && Math.abs(e.vx) < 2) {
    // the next chore: never two prowls running, never the same sit twice
    const was = e.chore, r = Math.random();
    let next = was === 'prowl' || was === 'stop' ? (r < 0.4 ? 'sniff' : r < 0.7 ? 'stand' : 'sit')
      : r < 0.45 ? 'prowl' : r < 0.65 ? 'sniff' : r < 0.82 ? 'sit' : 'stand';
    if (next === was) next = 'prowl';
    e.chore = next;
    if (next === 'prowl') {
      // toward somewhere near home, pulled to where the pack is
      const home = (e.sx == null ? cx : e.sx + e.w / 2);
      let mx = 0, n = 0; for (const o of pack) if (o !== e) { mx += o.x + o.w / 2; n++; }
      const mid = n ? home * 0.65 + (mx / n) * 0.35 : home;
      let tx = mid + rnd(-M.roam, M.roam);
      if (Math.abs(tx - cx) < 36) tx = cx + (tx >= cx ? 1 : -1) * rnd(40, 90);
      e.prowlX = tx; e.choreT = 4;
    } else e.choreT = rnd.apply(null, M[next]);
  }
  e.mindPose = e.chore === 'sit' ? 'sitWild' : e.chore === 'sniff' ? 'sniff' : null;
  return 2;
}
// THE LEAPING WOLF AT REST (the hopper keeps its own machine; only its picture
// changes while nothing is near): it sits, sniffs, stands, in turn
function wmHopperCalm(e, dt) {
  if (e.hunt || e.on === false || (e.crouchT || 0) > 0 || (e.landT || 0) > 0 || !wolfMindOn(e)) { e.mindPose = null; return; }
  e.choreT = (e.choreT == null ? rnd(0.5, 2) : e.choreT) - dt;
  if (e.choreT <= 0) {
    const r = Math.random();
    e.chore = e.chore === 'sit' ? (r < 0.5 ? 'sniff' : 'stand') : r < 0.45 ? 'sit' : r < 0.75 ? 'sniff' : 'stand';
    e.choreT = rnd.apply(null, WOLF_MIND[e.chore]);
  }
  e.mindPose = e.chore === 'sit' ? 'sitWild' : e.chore === 'sniff' ? 'sniff' : null;
}
// ONCE A FRAME (from wolfFrame): the blow it took, the tell it started
function wolfMindFrame(e, dt) {
  wmRoom();
  if (!WM.lead || WM.lead.dead || (G.enemies || []).indexOf(WM.lead) < 0) WM.lead = e;
  if (WM.lead === e) WM.t += dt;
  if (e.vaultT > 0) e.vaultT -= dt;
  wmTellSeen(e);
  const hp = e.hp;
  if (e._hpWas != null && hp < e._hpWas && wolfMindOn(e) && e.kind === 'crawler'
      && !((e.lungeT || 0) > 0)) {
    if (!e.mind || e.mind === 'calm') { e.mind = 'look'; e.lookT = 0.15; e.hunt = 1; e.caller = 1; }
    else { e.shyT = WOLF_MIND.shy; e.feint = null; if (e.mind === 'flank') e.mind = 'display'; }
    if (hp < (e.hpMax0 || hp) * WOLF_MIND.low) e.pantNext = 1;
  }
  e._hpWas = hp;
  // thrown over its back by her heavy blow: up again, it gives ground first
  const rolled = (e.rollT || 0) > 0;
  if (rolled && !e._wmRoll && e.mind && e.mind !== 'calm' && wolfMindOn(e)) { e.shyT = WOLF_MIND.shy; e.feint = null; if (e.mind !== 'look') e.mind = 'display'; }
  e._wmRoll = rolled;
  if (e.kind === 'hopper') wmHopperCalm(e, dt);
}
