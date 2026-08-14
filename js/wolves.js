// ===========================================================================
// THE PACK — the first living thing in the game, and the first one you keep.
//
// Zone A's ground machines used to be WHELPS: small copies of NULLFANG,
// assembled out of the boss's own parts rig. That was cheap in the good sense
// — no new art — and wrong in one that mattered: the first enemy in the game
// was a spoiler for the first boss, and it made the opening kingdom read as
// "lion, lion, lion, big lion".
//
// They are ELECTRONIC WOLVES now, and they come as a pack with something at
// the head of it. Three things follow from that and all three are mechanics
// rather than decoration:
//
//   1. A WOLF IS A COIL AND A POUNCE. It is the only shape it has. The crawler
//      already worked that way — patrol, gather, commit, be winded — so the
//      art did not need a new state machine, it needed three plates that ARE
//      those three states. Rest, coil, lunge.
//   2. THE ALPHA IS NOT A BIG WOLF. It is a different silhouette, a different
//      score, and it calls the pack in rather than fighting alone.
//   3. THE PACK CHANGES SIDES. Beat the Alpha and it yields; every wolf in the
//      game is friendly from that moment, in the room you are standing in and
//      in every room you walk back through. That is why the small ones are
//      worth having a leader — the reward for the fight is the enemy.
//
// TAMING IS THE ONLY ENDING HERE. There is no fork, no question, no option to
// destroy it: the alternative was never built and half a fork is worse than
// none (see TAME_ONLY in braid.js). The Eye's constructs are the things that
// get destroyed, and they are a different kind of thing entirely.
// ===========================================================================

// ---------------------------------------------------------------------------
// WHICH MACHINES ARE WOLVES.
//
// Zone A's crawler and hopper, in CLAWBYTE only — exactly the two kinds that
// used to draw as the boss's whelps. This is a rendering-and-flavour identity,
// not a new EKIND: giving the pack its own entity type would have meant
// touching every room list, every spawn table and every harness that counts
// enemies, to arrive at a crawler with a different picture on it.
// THE OLD ART HAS NO ZONES LEFT TO HIDE IN. The first cut covered zone A only,
// which quietly left every ground machine in the back four kingdoms drawing
// from the roster atlas — the same generic crawler the wolves were brought in
// to replace. Walking east far enough put the old enemy back on screen, and it
// was reported as "the game is still loading the old image enemies", which is
// exactly what it was.
//
// So the split is total: the pack holds the first two kingdoms, the cheetah
// line holds the last four, and no crawler or hopper anywhere falls through to
// the roster. tests/wolves.cjs checks every zone, not the two it started with.
const WOLF_ZONES = { A: 1, B: 1 };
function isWolf(e) {
  if (!e || (typeof isHero === 'function' && isHero())) return false;
  if (e.kind !== 'crawler' && e.kind !== 'hopper') return false;
  return !!(G.roomDef && WOLF_ZONES[G.roomDef.zone]);
}
// ...and whether the pack has changed sides. One flag, set by the Alpha's
// yield, read everywhere — including on a save loaded a week later, which is
// the whole point of it living in G.save.flags rather than on the room.
function packTamed() {
  return !!(G.save && G.save.flags && G.save.flags.alpha);
}

// ---------------------------------------------------------------------------
// THE CHEETAH LINE — the second animal, and the one that has no leader.
//
// Zones C and D run the same frames as the meadow, and running them as wolves
// would say the wrong thing twice: that the pack reaches everywhere, and that
// taming the Alpha bought you the whole world. It did not. These came off the
// same production line and whatever was in them is gone — there is nothing at
// the head of them to yield, no bargain to strike, and the flag that turned
// every wolf in the game friendly does not touch a single one of them.
//
// Mechanically identical to the wolf, deliberately: prowl, coil, pounce, three
// plates. Same grammar, different animal, and it is FASTER — a cheetah that
// read like a heavy wolf would be a reskin, so it takes the same wind-up and
// covers half again the distance with it.
const CAT_ZONES = { C: 1, D: 1, E: 1, X: 1 };
function isCheetah(e) {
  if (!e || (typeof isHero === 'function' && isHero())) return false;
  if (e.kind !== 'crawler' && e.kind !== 'hopper') return false;
  return !!(G.roomDef && CAT_ZONES[G.roomDef.zone]);
}
// Fetched on arrival, not on first draw. A lazy plate means the first frame in
// a room shows whatever the fallback is — and the fallback is the old art the
// whole line exists to replace, so "it flashes the wrong enemy for a moment"
// and "it draws the wrong enemy" look identical to somebody playing it.
function beastPreload(zone) {
  if (typeof mediaFetch !== 'function') return;
  const set = WOLF_ZONES[zone] ? WOLF_ART : (CAT_ZONES[zone] ? CHEETAH_ART : null);
  if (!set) return;
  for (const k in set) mediaFetch(set[k].img);
}
const CHEETAH_ART = {
  rest: { img: 'cheetahRest', k: 2.10, foot: 1 },
  walkA: { img: 'cheetahWalkA', k: 2.10, foot: 1 },
  walkB: { img: 'cheetahWalkB', k: 2.10, foot: 1 },
  coil: { img: 'cheetahWarn', k: 2.30, foot: 1 },
  lunge: { img: 'cheetahRun', k: 2.05, foot: 0, yOff: -0.18 },
};

// THREE PLATES, ONE PER PHASE OF THE ONLY MOVE IT HAS.
//   k    — how many hitbox-heights the plate occupies on screen
//   yOff — nudge in hitbox-heights, for a plate whose art sits high in its frame
// The lunge plate is airborne in its own frame, so it is anchored by the CENTRE
// while the two grounded plates are anchored by their FEET. Anchoring all three
// the same way is what put the pounce fifteen pixels into the floor.
const WOLF_ART = {
  rest: { img: 'wolfRest', k: 2.35, foot: 1 },
  walkA: { img: 'wolfWalkA', k: 2.35, foot: 1 },
  walkB: { img: 'wolfWalkB', k: 2.35, foot: 1 },
  coil: { img: 'wolfCoil', k: 2.20, foot: 1 },
  lunge: { img: 'wolfLunge', k: 2.15, foot: 0, yOff: -0.22 },
};
// ---------------------------------------------------------------------------
// IT WALKS. IT DOES NOT GLIDE.
//
// The first cut hung ONE standing plate on the crawler, and the crawler slides:
// it has no gait, it never had one, its old art was a machine on treads for
// which sliding is correct. A wolf on treads is exactly what it looked like —
// an animal skating along the floor with its legs locked — and that is a worse
// lie than the machine it replaced, because a wolf has legs and you can see
// them not working.
//
// So the cycle is driven by GROUND TRAVELLED, not by a clock. `_stride`
// accumulates the pixels it has actually covered and the frame is a function of
// that: at any speed, on any framerate, in slow motion, a paw plants once per
// STRIDE of floor and the feet never slip. A timed cycle is what produces the
// moonwalk — the legs run at their own rate while the body moves at another.
const STRIDE = 30;                          // px of floor per half-step
function wolfPose(e) {
  if ((e.lungeT || 0) > 0 || (e.diveT || 0) > 0 || e.on === false) return 'lunge';
  if ((e.coilT || 0) > 0 || (e.crouchT || 0) > 0) return 'coil';
  // how far it has really moved since the last frame, whatever moved it
  const px = e._lastX == null ? e.x : e._lastX;
  e._stride = (e._stride || 0) + Math.abs(e.x - px);
  e._lastX = e.x;
  if (Math.abs(e.vx || 0) < 6) return 'rest';       // standing still stands still
  // contact, passing, contact (mirrored by the other pair), passing — four
  // beats off two drawings, which is what a two-frame walk cycle is
  return ((Math.floor(e._stride / STRIDE) % 4) & 1) ? 'walkB' : 'walkA';
}

// ---------------------------------------------------------------------------
// DRAWING ONE. Returns false if the plate has not come over the wire yet, so
// the caller falls through to whatever it was doing before rather than drawing
// nothing — the same contract every authored body in this engine has.
// ---------------------------------------------------------------------------
function drawWolf(c, e) { return drawBeastPlate(c, e, WOLF_ART, packTamed()); }
// The cheetah rides the same renderer, and can never be tamed — the `tame`
// argument is the only difference between the two animals in this file.
function drawCheetah(c, e) { return drawBeastPlate(c, e, CHEETAH_ART, false); }
function drawBeastPlate(c, e, ART, tame) {
  const pose = wolfPose(e);
  const A = ART[pose];
  if (typeof mediaHas === 'function' && !mediaHas(A.img) && typeof mediaFetch === 'function') {
    mediaFetch(A.img);
    // and pull the other two while we are here: an animal that has to wait for
    // its coil plate the first time it winds up shows a rest pose through the
    // tell, which is the one frame the player must not be lied to about
    for (const k in ART) mediaFetch(ART[k].img);
  }
  const im = MEDIA_IMG[A.img];
  if (!im || !im.naturalWidth) return false;

  const cx = e.x + e.w / 2, footY = e.y + e.h;
  const dh = e.h * A.k, dw = dh * (im.naturalWidth / im.naturalHeight);
  // A GAIT HAS A VERTICAL. A quadruped's shoulders rise on the passing frame
  // and drop as the paw plants, so the body oscillates twice per stride — and
  // a walk cycle without it reads as two pictures being swapped. Locked to the
  // same stride counter as the frames, so it can never drift out of phase.
  const gait = (pose === 'walkA' || pose === 'walkB')
    ? -Math.abs(Math.sin(((e._stride || 0) / STRIDE) * Math.PI)) * 1.6 : 0;
  // grounded plates hang off the floor line; the airborne one hangs off centre
  const yc = (A.foot ? footY - dh / 2 + e.h * (A.yOff || 0)
                     : e.y + e.h / 2 + dh * (A.yOff || 0)) + gait;

  c.save();
  c.translate(cx, yc);
  // THE TELL IS THE PLATE, AND THE PLATE IS NOT ENOUGH ON ITS OWN. The coil
  // drawing already burns amber where the rest drawing burns red — but a wolf
  // is twenty-six pixels tall in a busy room, so the wind-up also gets the
  // wash the guardians get, behind the body, growing over the tell.
  if ((e.coilT || 0) > 0 && !G.artProbe && !tame) {
    const k = clamp(1 - e.coilT / TELL_FAST, 0, 1);
    const g2 = Math.pow(k, 0.62);                        // §3.6 — lit from frame one
    const R = Math.max(72, dh * 0.9);
    c.save(); c.globalCompositeOperation = 'lighter';
    const gg = c.createRadialGradient(0, 0, 3, 0, 0, R);
    const al = 0.14 + g2 * 0.30;
    gg.addColorStop(0, 'rgba(255,232,168,' + Math.min(0.66, al).toFixed(3) + ')');
    gg.addColorStop(0.44, 'rgba(255,194,74,' + (al * 0.6).toFixed(3) + ')');
    gg.addColorStop(1, 'rgba(255,150,20,0)');
    c.fillStyle = gg; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill();
    c.restore();
  }
  // the plates are authored facing LEFT, so a wolf walking right is mirrored.
  // A quadruped in profile is the one case where mirroring is honest — there is
  // no lit side to flip onto the shadow side when the key light is overhead and
  // the subject is symmetric about its own spine.
  const dir = (e.faceVis != null ? e.faceVis : e.dir) || -1;
  c.scale(dir > 0 ? -1 : 1, 1);
  if (e.hurtT > 0) c.globalAlpha *= 0.85;
  c.drawImage(im, -dw / 2, -dh / 2, dw, dh);
  if (e.hurtT > 0) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5;
    c.drawImage(im, -dw / 2, -dh / 2, dw, dh); c.restore();
  }
  c.restore();

  // A TAMED WOLF IS VISIBLY A DIFFERENT ANIMAL, and it has to be readable from
  // across a room or the player will keep flinching at it. The plates stay
  // (there is no second set of art for forty friendly wolves) and the red optic
  // is overpainted cyan, which is the one pixel the eye actually reads.
  if (tame) {
    const nose = cx + (dir > 0 ? 1 : -1) * dw * 0.30;
    const eyeY = yc - dh * 0.12;
    c.save(); c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.55 + Math.sin((e.anim || 0) * 3) * 0.12;
    const g3 = c.createRadialGradient(nose, eyeY, 0, nose, eyeY, dh * 0.20);
    g3.addColorStop(0, '#9ffcff'); g3.addColorStop(1, 'rgba(60,220,255,0)');
    c.fillStyle = g3; c.beginPath(); c.arc(nose, eyeY, dh * 0.20, 0, 7); c.fill();
    c.restore();
  }
  return true;
}

// ---------------------------------------------------------------------------
// WHAT A TAMED WOLF DOES INSTEAD OF HUNTING.
//
// It trots. It keeps loose station on her, it never closes, it never winds up,
// and it cannot be hurt or hurt her — the contact-damage and damage-taking
// paths both check this. "All wolves become friendly" has to mean all of them,
// including the ones already standing in a room she cleared before the fight.
//
// Returns true when it has taken the frame, so the crawler's own machine never
// runs on a tamed wolf and a half-finished lunge cannot survive the yield.
// ---------------------------------------------------------------------------
function wolfTameStep(e, dt) {
  if (!isWolf(e) || !packTamed()) return false;
  e.coilT = 0; e.lungeT = 0; e.windedT = 0; e.crouchT = 0; e.guard = false;
  e.vy += 2000 * dt;
  const px = player.x + player.w / 2, cx = e.x + e.w / 2;
  const d = px - cx, ad = Math.abs(d);
  // an escort, not a shadow: it closes to a comfortable distance and then
  // mills about, so a room of them reads as a pack milling rather than a
  // conga line stapled to the player's back
  if (ad > 150) { e.dir = Math.sign(d) || e.dir; e.vx = e.dir * e.spd * 0.9; }
  else if (ad > 70) { e.dir = Math.sign(d) || e.dir; e.vx = e.dir * e.spd * 0.45; }
  else e.vx = Math.sin((e.anim || 0) * 1.3) * e.spd * 0.3;
  const col = moveEnt(e, dt);
  if (col.l) e.dir = 1; else if (col.r) e.dir = -1;
  else if (col.d && !groundAhead(e, e.dir)) e.dir *= -1;
  return true;
}

// ===========================================================================
// THE ALPHA — the first mini-boss, and the only one you keep.
//
// FIVE SKILLS, and the shape of the fight is which one the distance buys you:
//
//   HOWL      far   — it calls the betas in. The reason it is a leader and not
//                     just a bigger wolf.
//   ROAR      far   — it takes your controls away for a second. The most
//                     expensive thing a boss in this game does to a player, so
//                     it has the longest wind-up of the five and a radius you
//                     can be outside of.
//   LEAP      mid   — up, a corkscrew in the air, and down on top of you. It
//                     commits: there is no steering once it is off the ground.
//   CLAW      near  — a wide horizontal rake when you close.
//   BITE      near  — the same range, half the reach, twice the speed.
//
// ...and the leap has TWO recoveries, which is the part that makes it feel
// like an animal rather than a projectile:
//   IT HIT YOU  → it kicks backwards off you through the air and lands on its
//                 feet facing you. It got what it came for; it takes the space.
//   IT MISSED   → it spins on the spot to bring its head back round. That spin
//                 is the opening, and it is the only generous one in the fight.
// ===========================================================================
// One plate per state (ART_BIBLE.md §3.3 — states must differ in SILHOUETTE,
// and a five-move boss sharing two drawings has two moves as far as the eye is
// concerned). `foot` anchors by the floor line; the airborne states do not.
const ALPHA_ART = {
  rest: { img: 'alphaRest', k: 2.05, foot: 1 },
  roarwarn: { img: 'alphaRoar', k: 2.15, foot: 1 },
  roar: { img: 'alphaRoar', k: 2.15, foot: 1 },
  broodcall: { img: 'alphaHowl', k: 2.30, foot: 1 },
  howl: { img: 'alphaHowl', k: 2.30, foot: 1 },
  coil: { img: 'alphaRoar', k: 2.05, foot: 1 },
  leap: { img: 'alphaLeap', k: 2.20, foot: 0 },
  clawwarn: { img: 'alphaClaw', k: 2.10, foot: 1 },
  claw: { img: 'alphaClaw', k: 2.10, foot: 1 },
  bitewarn: { img: 'alphaBite', k: 2.05, foot: 1 },
  bite: { img: 'alphaBite', k: 2.05, foot: 1 },
  clinch: { img: 'alphaClinch', k: 2.05, foot: 1 },
  shake: { img: 'alphaClinch', k: 2.05, foot: 1 },
  recoil: { img: 'alphaRecoil', k: 2.10, foot: 0 },
  turn: { img: 'alphaTurn', k: 2.05, foot: 1 },
  free: { img: 'alphaFree', k: 2.05, foot: 1 },
};
const ALPHA_KIT = {
  spd: 132,          // it prowls; the leap is where the speed is
  close: 128,        // inside this it claws or bites
  near: 300,         // inside this it leaps; outside it howls or roars
  leapV: 480,        // horizontal launch
  leapUp: 430,       // ...and it leaves the ground, because a wolf does
  kickV: 300,        // how hard it kicks off you when the leap connects
  stun: 1.05,        // seconds of the roar. Tuned against its own wind-up:
                     // TELL_HEAVY is 0.7s of warning for 1.05s of cost.
  packMax: 3,        // never more than this many betas alive at once
};

// ---------------------------------------------------------------------------
// BEING HELD, AND BEING ABLE TO DO SOMETHING ABOUT IT.
//
// A grab that the player can only wait out is a cutscene with damage in it. So
// while the Alpha has her: she is pinned to its jaw (so the picture is honest —
// she is IN its mouth, not standing next to it), her controls are gone, and
// MASHING SHORTENS IT. Twelve presses take the whole shake off; a player who
// does nothing eats three hits and gets thrown. Either way it ends.
// ---------------------------------------------------------------------------
function alphaHold(b, dt) {
  if (!player || player.dead) { b.st = 'rest'; b.t = 0.4; return; }
  player.stunT = Math.max(player.stunT || 0, 0.12);      // re-armed every frame
  player.vx = 0; player.vy = 0;
  // held at the jaw, which is at the front of the plate
  player.x = b.cx() + b.face * (b.w * 0.62) - player.w / 2;
  player.y = b.y + b.h * 0.18;
  // the escape. IN_P rather than inP: Player.update shadows the input readers
  // to dead stubs while stunned, and the whole point of this is that ONE input
  // still gets through.
  if (typeof IN_P === 'function' && (IN_P('ATK') || IN_P('JUMP') || IN_P('DASH'))) {
    b.mash = (b.mash || 0) + 1;
    burst(player.x + player.w / 2, player.y, 3, '#9ffcff', 200, 0.3, 0, 2, true);
    if (b.mash >= 12) b.t = Math.min(b.t, 0.06);
  }
}

function alphaSummon(b) {
  const live = G.enemies.filter(e => !e.dead && isWolf(e)).length;
  const want = Math.min(2, ALPHA_KIT.packMax - live);
  for (let i = 0; i < want; i++) {
    const side = i % 2 ? 1 : -1;
    const x = clamp(b.cx() + side * rnd(90, 190), 40, G.roomDef.w * TILE - 60);
    const w = new Enemy('crawler', x, b.y + b.h - 26);
    w.dir = Math.sign(b.cx() - x) || 1;
    G.enemies.push(w);
    burst(x + 14, b.y + b.h - 12, 12, '#ff5f6d', 220, 0.5, 220, 3, true);
  }
  if (want > 0) sfx('cast');
}

// The Alpha's whole machine. Written as one pass with no early returns for the
// same reason the constructs' is (see MINI_KIT): the integrate lives at the
// bottom and a state that breaks out of the top skips it, which is how five
// enemies once measured 60-98% motionless.
//
// EVERY WIND-UP IS NAMED <move>warn OR IS IN TELL_ST. That is not a convention,
// it is the wiring: TELL_ST fires the warning sound and Boss.draw paints the
// rising amber for any state whose NAME says a blow is coming, so a move that
// forgets to be named is a move with no telegraph at all.
function alphaStep(b, dt, px, py) {
  const dist = px - b.cx(), adist = Math.abs(dist);
  b.t -= dt;
  const airborne = b.st === 'leap';
  if (!airborne) b.face = Math.sign(dist) || b.face;

  if (b.st === 'idle' || b.st === 'rest') {
    if (b.t <= 0) {
      // WHICH SKILL, AND WHY IT IS NOT SIMPLY "WHATEVER THE DISTANCE IS".
      //
      // The first cut read the current gap and picked the matching move. It
      // used exactly ONE of the five: the prowl closes when she is far and
      // gives ground when she is near, so the Alpha parked itself in the
      // middle band and leapt, forever — a five-skill boss with one skill.
      // tests/wolves.cjs measured it as `leap, missing howl,roar,claw,bite`.
      //
      // So the BAND is chosen first and walked to. It rotates — close, mid,
      // far — and the prowl below drives toward that band's distance, which
      // means the fight breathes in and out instead of settling. Distance
      // still decides the move; the Alpha just decides the distance, which is
      // what a predator circling something actually does.
      b.band = ((b.band == null ? -1 : b.band) + 1) % 3;
      b.fired = false; b._tellDur = 0;
      const packRoom = G.enemies.filter(e => !e.dead && isWolf(e)).length < ALPHA_KIT.packMax;
      // It walks to the band first — but only for so long. She moves faster
      // than it does, so "wait until you are in range" is a condition she can
      // deny forever simply by pacing, and the first version of this deadlock
      // measured as 2% telegraph and three skills never used. Two beats of
      // repositioning and then it commits from wherever it is: the roar has a
      // radius, the howl does not care, and a claw thrown at nothing is a
      // whiff, which is a real event rather than a bug.
      const inBand = b.band === 0 ? adist <= ALPHA_KIT.close
                   : b.band === 1 ? adist > ALPHA_KIT.close && adist <= ALPHA_KIT.near
                   : adist > ALPHA_KIT.near;
      if (!inBand && (b.reposN = (b.reposN || 0) + 1) < 3) {
        b.t = 0.3; b.band = (b.band + 2) % 3;      // hold the band, walk to it
        return alphaMove(b, dt, adist);
      }
      b.reposN = 0;
      b.alphaAlt = !b.alphaAlt;
      if (b.band === 0) { b.st = b.alphaAlt ? 'clawwarn' : 'bitewarn'; b.t = TELL_FAST; }
      else if (b.band === 1) { b.st = 'coil'; b.t = TELL_SWIPE; }
      else if (b.alphaAlt && packRoom) { b.st = 'broodcall'; b.t = TELL_HEAVY; }
      else { b.st = 'roarwarn'; b.t = TELL_HEAVY; }
    }
  } else if (b.st === 'clawwarn' || b.st === 'bitewarn') {
    // it STEPS INTO the swing rather than planting and swinging at air — which
    // is both how an animal does it and what makes a claw thrown from the edge
    // of its reach still worth respecting
    b.windT = TELL_FAST;
    b.vx += (b.face * ALPHA_KIT.spd * 1.6 - b.vx) * Math.min(1, dt * 5);
    if (b.t <= 0) { b.st = b.st.replace('warn', ''); b.t = 0.26; b.fired = false; }
  } else if (b.st === 'claw' || b.st === 'bite') {
    // THE CLOSE ANSWER, and it is deliberately not generous. "Do not leave many
    // openings if the player is closing off to it" — so the recovery after a
    // claw or a bite is barely half the one after a leap. Standing next to this
    // thing is meant to be the wrong place to be.
    if (!b.fired) {
      b.fired = true;
      const reach = b.st === 'claw' ? b.w * 0.95 : b.w * 0.6;
      const hb = { x: b.cx() + (b.face > 0 ? 0 : -reach), y: b.y + b.h * 0.2,
                   w: reach, h: b.h * 0.7 };
      const hit = !player.dead && player.iT <= 0 && aabb(hb, player);
      if (hit) player.hurt(DF().edmg, b.cx(), 'alpha.' + b.st);
      sfx(b.st === 'claw' ? 'slash' : 'hit');
      cam.shake = Math.max(cam.shake, 3);
      burst(b.cx() + b.face * reach * 0.7, b.cy(), 8, '#ffb15a', 190, 0.4, 120, 2, true);
      // A BITE THAT LANDS DOES NOT LET GO. A wolf does not close its jaws and
      // step back — it takes hold and WORRIES the thing, head whipping side to
      // side. So a connected bite is not one hit, it is a hold: clinch, shake,
      // throw. The claw stays a single clean swipe; that contrast is the whole
      // reason the two moves are worth having next to each other.
      if (hit && b.st === 'bite') {
        b.st = 'clinch'; b.t = 0.18;
        b.shakeN = 0; b.shakeT = 0; b.mash = 0;
        b.vx = 0;
      }
    }
    if (b.st !== 'clinch' && b.t <= 0) { b.st = 'rest'; b.t = bossRest(b, 0.62); }
  } else if (b.st === 'clinch') {
    // it has her. A beat of stillness first, because a shake that starts on the
    // frame the jaws close reads as a glitch rather than as weight.
    b.vx = 0;
    alphaHold(b, dt);
    if (b.t <= 0) { b.st = 'shake'; b.t = 0.66; b.shakeN = 0; }
  } else if (b.st === 'shake') {
    // THE WORRY: three whips of the head, left-right-left, each one a hit. The
    // damage is spread across the shakes rather than front-loaded so that
    // breaking out early actually saves you something.
    b.vx = 0;
    alphaHold(b, dt);
    const want = Math.floor((0.66 - b.t) / 0.2);
    if (want > b.shakeN) {
      b.shakeN = want;
      if (!player.dead) player.hurt(DF().edmg, b.cx(), 'alpha.shake');
      sfx('hit'); cam.shake = Math.max(cam.shake, 6);
      if (typeof padRumble === 'function') padRumble(0.8, 0.6, 140);
      burst(b.cx() + b.face * b.w * 0.5, b.cy(), 7, '#ff9a5a', 220, 0.4, 60, 2, true);
    }
    if (b.t <= 0) {
      // ...and then it throws her. Away from itself, which is a mercy and a
      // reset: the fight restarts at a distance instead of on top of it.
      if (player && !player.dead) {
        player.vx = b.face * 340; player.vy = -260;
        player.stunT = 0;                        // the throw gives her back
      }
      b.st = 'rest'; b.t = bossRest(b, 0.8);
      sfx('boom'); cam.shake = Math.max(cam.shake, 7);
    }
  } else if (b.st === 'coil') {
    b.windT = TELL_SWIPE;
    b.vx *= Math.pow(0.02, dt);
    if (b.t <= 0) {
      b.st = 'leap'; b.t = 1.1; b.leapHit = false;
      b.vx = b.face * ALPHA_KIT.leapV; b.vy = -ALPHA_KIT.leapUp;
      sfx('dash'); cam.shake = Math.max(cam.shake, 4);
    }
  } else if (b.st === 'leap') {
    // COMMITTED. No steering in the air — that is the whole reason the coil in
    // front of it is worth reading.
    if (!b.leapHit && !player.dead && player.iT <= 0 && aabb(hurtBoxOf(b), player)) {
      b.leapHit = true;
      player.hurt(DF().edmg, b.cx(), 'alpha.leap');
      // IT GOT WHAT IT CAME FOR, so it takes the space back: a kick off her
      // through the air, backwards, landing on its feet.
      b.st = 'recoil'; b.t = 0.75;
      b.vx = -b.face * ALPHA_KIT.kickV; b.vy = -260;
      cam.shake = Math.max(cam.shake, 7);
      if (typeof padRumble === 'function') padRumble(0.6, 0.4, 260);
    } else if (b.on && b.vy >= 0) {
      // IT MISSED. The spin is the opening, and it is the only generous one in
      // the fight — which is exactly why the fight has one.
      b.st = 'turn'; b.t = 0.5; b.vx = 0;
      cam.shake = Math.max(cam.shake, 5); sfx('boom');
      burst(b.cx(), b.y + b.h, 14, '#c8925c', 200, 0.5, 320, 3);
    } else if (b.t <= 0) { b.st = 'turn'; b.t = 0.42; }
  } else if (b.st === 'recoil') {
    if (b.on && b.vy >= 0) { b.vx *= Math.pow(0.02, dt); if (b.t > 0.3) b.t = 0.3; }
    if (b.t <= 0) { b.st = 'rest'; b.t = bossRest(b, 0.7); }
  } else if (b.st === 'turn') {
    b.vx *= Math.pow(0.02, dt);
    if (b.t <= 0) { b.st = 'rest'; b.t = bossRest(b, 1.15); }
  } else if (b.st === 'broodcall') {
    b.windT = TELL_HEAVY;
    b.vx *= Math.pow(0.05, dt);
    if (b.t <= 0) { b.st = 'howl'; b.t = 0.55; b.fired = false; }
  } else if (b.st === 'howl') {
    if (!b.fired) {
      b.fired = true;
      alphaSummon(b);
      sfx('roar_beast'); cam.shake = Math.max(cam.shake, 7);
      if (typeof padRumble === 'function') padRumble(0.7, 0.5, 380);
      if (typeof roarWave === 'function') roarWave(b.cx(), b.cy() - b.h * 0.3, '#ff8a4a');
    }
    if (b.t <= 0) { b.st = 'rest'; b.t = bossRest(b, 0.9); }
  } else if (b.st === 'roarwarn') {
    b.windT = TELL_HEAVY;
    b.vx *= Math.pow(0.05, dt);
    if (b.t <= 0) { b.st = 'roar'; b.t = 0.5; b.fired = false; }
  } else if (b.st === 'roar') {
    if (!b.fired) {
      b.fired = true;
      // A STUN HAS TO BE ESCAPABLE OR IT IS NOT A MOVE, IT IS A TAX. So it is a
      // RADIUS, not a hitscan: 260 px, announced by a 0.7 s wind-up and a
      // shockwave ring drawn on the floor. Outside it, nothing happens to you.
      const d = Math.hypot(px - b.cx(), py - b.cy());
      if (!player.dead && d < 260) {
        player.stunT = Math.max(player.stunT || 0, ALPHA_KIT.stun);
        player.vx = 0;
        if (typeof padRumble === 'function') padRumble(0.9, 0.8, 700);
      }
      sfx('roar_beast'); cam.shake = Math.max(cam.shake, 11);
      if (typeof roarWave === 'function') roarWave(b.cx(), b.cy() - b.h * 0.3, '#ffc24a');
      burst(b.cx(), b.cy(), 18, '#ffe6b8', 300, 0.6, 0, 3, true);
    }
    if (b.t <= 0) { b.st = 'rest'; b.t = bossRest(b, 1.05); }
  } else {
    b.st = 'rest'; if (b.t <= 0) b.t = bossRest(b, 1);
  }
  // ---- and where it is ----------------------------------------------------
  alphaMove(b, dt, adist);
}

// It PROWLS between moves — and it prowls TOWARD the band it has chosen, which
// is what stops a five-skill boss from only ever using the one skill its own
// footwork keeps it in range for. A boss that parks between attacks is the note
// the whole cast was retuned for; a boss that paces to one distance and stays
// there is the same note wearing a coat.
function alphaMove(b, dt, adist) {
  b.vy += 2000 * dt;
  const rooted = b.st === 'coil' || b.st === 'broodcall' || b.st === 'howl'
              || b.st === 'roarwarn' || b.st === 'roar' || b.st === 'turn'
              || b.st === 'clinch' || b.st === 'shake'
              || /warn$/.test(b.st) || b.st === 'claw' || b.st === 'bite';
  if (b.st !== 'leap' && b.st !== 'recoil' && !rooted) {
    const tgt = b.band === 0 ? ALPHA_KIT.close * 0.55
              : b.band === 1 ? (ALPHA_KIT.close + ALPHA_KIT.near) * 0.5
              : ALPHA_KIT.near * 1.25;
    // close if the gap is bigger than the band wants, back off if it is
    // smaller, and stand still inside a dead band so it does not jitter on the
    // boundary the way an unclamped seek does
    const err = adist - tgt;
    const drive = Math.abs(err) < 24 ? 0 : Math.sign(err);
    const want = b.face * ALPHA_KIT.spd * drive;
    b.vx += (want - b.vx) * Math.min(1, dt * 4);
  }
  const col = moveEnt(b, dt);
  b.on = !!col.d;
}

// WHICH PLATE THE STATE IS SHOWING. One lookup, one fallback, and the fallback
// is the prowl — never a wind-up, because a boss that shows a telegraph it is
// not actually performing is worse than one that shows none.
function alphaPlate(b) {
  if (b.purified || b.tamed || (b.dead && !b.forceKill)) return ALPHA_ART.free;
  if (b.st === 'intro' || b.st === 'dorm') return ALPHA_ART.roar;
  return ALPHA_ART[b.st] || ALPHA_ART.rest;
}
// HOW IT LOOKS. Nine plates composited the way the Eye's constructs are — bob,
// lean, a swell on the wind-up — because a static plate slid around a room is
// exactly what the guardians' leap was rebuilt to stop being.
function drawAlpha(c, b, cx, cy) {
  if (typeof mediaFetch === 'function')
    for (const k in ALPHA_ART) mediaFetch(ALPHA_ART[k].img);
  const A = alphaPlate(b);
  const im = MEDIA_IMG[A.img];
  if (!im || !im.naturalWidth) { drawBossHold(c, b); return; }
  const t2 = b.anim || 0;
  const warn = !!(b.st && TELL_ST.test(b.st));
  // Scaled to the hitbox by HEIGHT. The nine plates have wildly different
  // aspect ratios — the howl is nearly square, the leap is a long diagonal —
  // so the GROUNDED ones are anchored by their feet and the airborne ones by
  // their centre. Anchoring all nine the same way sinks the Alpha into the
  // floor on every state that is taller than the prowl, which is the same bug
  // the lattice construct's `foot` flag exists for.
  const k = (b.h * A.k) / im.naturalHeight;
  const dw = im.naturalWidth * k, dh = im.naturalHeight * k;
  const cyDraw = A.foot ? (b.y + b.h) - dh / 2 : b.y + b.h / 2;
  c.save();
  c.translate(cx, cyDraw);
  const bob = Math.sin(t2 * 1.7) * (A.foot ? 1.8 : 0);
  const lean = clamp((b.vx || 0) / 900, -0.2, 0.2);
  const pop = warn ? 1 + 0.05 * Math.sin(t2 * 20) : 1;
  c.translate(0, bob);
  // the corkscrew is IN the leap plate, but a plate is one frame of a spin —
  // rotating it through the arc is what turns it into the move
  const spin = b.st === 'leap' ? clamp(1.1 - (b.t || 0), 0, 1.1) * 1.5 * (b.face > 0 ? -1 : 1) : 0;
  // THE WORRY, as motion rather than as a caption. The clinch plate is one
  // frame of a head-shake; whipping the whole body about the jaw is what turns
  // that frame into the move. Fast (about 5 Hz) and asymmetric, because a
  // symmetric wobble reads as a bounce and an animal tearing at something does
  // not bounce.
  const shk = b.st === 'shake' ? Math.sin((b.anim || 0) * 31) * 0.16 : 0;
  c.rotate(lean + spin + shk);
  if (shk) c.translate(Math.sin((b.anim || 0) * 31 + 0.5) * 5, 0);
  // authored facing LEFT, like every plate in this file
  c.scale(pop * ((b.face || -1) > 0 ? -1 : 1), pop);
  if (b.hurtT > 0) c.globalAlpha *= 0.85;
  c.drawImage(im, -dw / 2, -dh / 2, dw, dh);
  if (b.hurtT > 0) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5;
    c.drawImage(im, -dw / 2, -dh / 2, dw, dh); c.restore();
  }
  c.restore();

  // THE ROAR'S RADIUS, DRAWN. A stun the player cannot see the edge of is a
  // stun they will believe was unfair even when it was not — so the ring that
  // decides it is on the floor, growing over the wind-up and flashing at the
  // moment it lands. Suppressed for the art probe like every other
  // ground-anchored effect (§3.4), since it is lit pixels below the foot line.
  if (!G.artProbe && (b.st === 'roarwarn' || b.st === 'roar')) {
    const grow = b.st === 'roarwarn'
      ? Math.pow(clamp(1 - (b.t || 0) / TELL_HEAVY, 0, 1), 0.62) : 1;
    const R = 260 * grow;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = (b.st === 'roar' ? 0.55 : 0.22 + grow * 0.2);
    c.strokeStyle = TELL_COL; c.lineWidth = b.st === 'roar' ? 4 : 2;
    c.beginPath(); c.ellipse(cx, b.y + b.h - 3, R, R * 0.22, 0, 0, 7); c.stroke();
    c.restore();
  }
}
