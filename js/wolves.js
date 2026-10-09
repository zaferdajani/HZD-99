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
// Fetched on arrival, not on first draw. There is NO fallback body any more —
// a crawler or hopper whose plates are not here draws nothing (Enemy.draw) —
// so a room that has the animal in it asks URGENTLY, which also requests the
// quarter-scale stand-in (media.js mediaLow) that lands in a fraction of the
// time; a room without one just warms the zone's set at the normal priority.
function beastPreload(zone, def) {
  if (typeof mediaFetch !== 'function') return;
  const set = WOLF_ZONES[zone] ? WOLF_ART : (CAT_ZONES[zone] ? CHEETAH_ART : null);
  if (!set) return;
  const here = !!(def && (def.ents || []).some(e => e[0] === 'crawler' || e[0] === 'hopper'
    || (e[0] === 'boss' && e[3] === 'alpha')));
  for (const k in set) mediaFetch(set[k].img, here);
}
// IS THE BODY HERE? A crawler or hopper has no stand-in (Enemy.draw), so it
// draws nothing — not even its shadow — until its own art can: the pack's or
// the cheetahs' rest plate in CLAWBYTE (the fallback for every pose whose
// strip is still in flight), the hound's or the skull's sheet in NOSTOS. Asks
// for what is missing, urgently, so a failed or evicted fetch is re-made.
function groundBeastReady(e) {
  if (typeof isHero === 'function' && isHero()) {
    const keys = e.kind === 'hopper' ? ['skull'] : ['houndIdle', 'houndRun'];
    return keys.some(k => sheetReady(k));
  }
  const set = isWolf(e) ? WOLF_ART : isCheetah(e) ? CHEETAH_ART : null;
  if (!set) return false;
  if (mediaHas(set.rest.img)) return true;
  if (typeof mediaFetch === 'function') mediaFetch(set.rest.img, true);
  return false;
}
const CHEETAH_ART = {
  rest: { img: 'cheetahRest', k: 2.10, foot: 1 },
  coil: { img: 'cheetahWarn', k: 2.30, foot: 1 },
  lunge: { img: 'cheetahRun', k: 2.05, foot: 0, yOff: -0.18 },
  // the filmed cycles (§2cc): k is the CELL height, chosen so the body inside
  // a square cell stands as tall as it does on the rest plate (measured: the
  // walk's body fills 0.58 of its cell, the gallop's is cut from a wider take)
  walkStrip: { img: 'cheetahWalk8', cells: 8, k: 3.57 },
  runStrip: { img: 'cheetahRun6', cells: 6, k: 3.64 },
  windedStrip: { img: 'cheetahWinded6', cells: 6, k: 3.55 },
  landStrip: { img: 'cheetahLand4', cells: 4, k: 3.57 },
};
// how each animal carries its run (drawBeastPlate): a wolf bounds, a cheetah
// runs a rotary gallop — longer reach, deeper back flexion, harder suspension
const WOLF_GAIT = { strideMul: 1.0, pitch: 0.065, runAmp: 2.6, susp: 1.4 };
const CAT_GAIT = { strideMul: 1.22, pitch: 0.10, runAmp: 3.0, susp: 2.2 };

// THREE PLATES, ONE PER PHASE OF THE ONLY MOVE IT HAS.
//   k    — how many hitbox-heights the plate occupies on screen
//   yOff — nudge in hitbox-heights, for a plate whose art sits high in its frame
// The lunge plate is airborne in its own frame, so it is anchored by the CENTRE
// while the two grounded plates are anchored by their FEET. Anchoring all three
// the same way is what put the pounce fifteen pixels into the floor.
const WOLF_ART = {
  rest: { img: 'wolfRest', k: 2.35, foot: 1 },
  coil: { img: 'wolfCoil', k: 2.20, foot: 1 },
  lunge: { img: 'wolfLunge', k: 2.15, foot: 0, yOff: -0.22 },
  walkStrip: { img: 'wolfWalk8', cells: 8, k: 3.87 },
  runStrip: { img: 'wolfRun6', cells: 6, k: 3.94 },
  windedStrip: { img: 'wolfWinded6', cells: 6, k: 3.89 },
  landStrip: { img: 'wolfLand4', cells: 4, k: 3.89 },
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
// THE GAIT SPLITS AT SPEED, the way the CC0 reference does (ScratchIO's wolf,
// docs/MOVEMENT_SOURCES.md §2: an 8-frame walk and a SEPARATE 6-frame run —
// fewer poses, longer reach, a suspension beat where every paw is off the
// ground). Patrol speed is 62; anything faster than 95 is running. The run
// stride is half again the walk's, which is where the reach comes from.
// THE RECOVERIES, re-posed from the rest plate — now only the fallback while
// their filmed strips (windedStrip / landStrip, ART_QUEUE §2cc-iii) load. Plate space: the animal faces LEFT, +rot turns the nose UP
// (canvas rotation is clockwise and the nose is on the -x side), and the pivot
// is the middle of the feet line.
//   winded — after the crawler's lunge: head and shoulders DOWN, the whole
//            body sunk and stretched long, the flanks heaving. Spent.
//   land   — after the hopper's leap: legs folded under the drop, chest low,
//            the body compressed. Absorbing it.
// Both are measured against rest and against the coil by tests/artbible.cjs
// (the ENEMY cast), so a re-tune that makes them read alike fails the build.
const BEAST_RECOVER = {
  winded: { rot: -0.12, kx: 1.10, ky: 0.80, dx: 0.04, heave: 9 },
  land:   { rot: -0.07, kx: 1.16, ky: 0.70, dx: 0, heave: 0 },
};
// one full breath of the winded strip, in seconds: the filmed pant is ~1.6 s,
// played faster because the punish window is only 0.5-0.75 s and a breath
// that never finishes inside it reads as a held pose, not a heave
const WINDED_BREATH = 0.6;
const STRIDE = 30;                          // px of floor per half-step, walking
const STRIDE_RUN = 46;                      // ...and running (the cheetah adds more)
// AIRBORNE MEANS OFF THE GROUND FOR REAL. Enemies carry `on` now (moveEnt),
// and a hopper in flight used to run its walk frames through the whole arc
// because nothing ever told the pose it had left the floor. One frame of air
// over a fracture in the surface curve is not a leap, though, so a body only
// reads as airborne once it has been up for a few hundredths of a second —
// or at once, if it is going UP, which only a jump does.
const AIR_POSE_T = 0.06;
function beastAirborne(e) {
  return e.on === false && ((e.airT || 0) > AIR_POSE_T || (e.vy || 0) < -60);
}
function wolfPose(e) {
  // how far it has really moved since the last frame, whatever moved it —
  // accumulated in HALF-STEPS of the current stride, so a wolf that breaks
  // into a run keeps its phase instead of snapping to a new foot. Counted
  // BEFORE any early return, so the frame after a lunge does not bank the
  // whole lunge as one giant stride; and only on the ground, because feet in
  // the air are not taking steps.
  const px = e._lastX == null ? e.x : e._lastX;
  const run = Math.abs(e.vx || 0) > 95;
  e._runG = run;
  const stride = run ? STRIDE_RUN * (e._strideMul || 1) : STRIDE;
  if (e.on !== false) e._ph = (e._ph || 0) + Math.abs(e.x - px) / stride;
  e._lastX = e.x;
  if ((e.lungeT || 0) > 0 || (e.diveT || 0) > 0 || beastAirborne(e)) return 'lunge';
  if ((e.coilT || 0) > 0 || (e.crouchT || 0) > 0) return 'coil';
  // THE RECOVERIES — each attack's opening wears its own picture now, so the
  // punish window is something she SEES rather than a gap she has to know is
  // there: the crawler's lunge leaves it WINDED (head down, flanks heaving),
  // the hopper's landing leaves it ABSORBING the drop (legs folded, chest
  // low). Both are the rest plate re-posed (BEAST_RECOVER) until their own
  // plates come off THE FIRING LIST (ART_QUEUE §2cc).
  if ((e.windedT || 0) > 0) return 'winded';
  if ((e.landT || 0) > 0) return 'land';
  if (Math.abs(e.vx || 0) < 6) return 'rest';       // standing still stands still
  // the half-step the stride is on. The names are phases, not plates: the
  // filmed strips (walkStrip / runStrip) are what draw them, and the old
  // two-plate pairs that used to alternate here are retired (ART_QUEUE §2q).
  const b2 = (Math.floor(e._ph) % 4) & 1;
  if (run) return b2 ? 'runB' : 'runA';
  return b2 ? 'walkB' : 'walkA';
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
  const GAIT = ART === CHEETAH_ART ? CAT_GAIT : WOLF_GAIT;
  e._strideMul = GAIT.strideMul;
  const pose = wolfPose(e);
  // a walk or run phase has no plate of its own: until its filmed strip
  // lands it stands on the REST plate, carried by the gait transform below
  let A = ART[pose] || ART.rest;
  if (typeof mediaHas === 'function' && !mediaHas(A.img) && typeof mediaFetch === 'function') {
    mediaFetch(A.img);
    // and pull the other two while we are here: an animal that has to wait for
    // its coil plate the first time it winds up shows a rest pose through the
    // tell, which is the one frame the player must not be lied to about
    for (const k in ART) mediaFetch(ART[k].img);
  }
  // THE FILMED CYCLE, when it is here: a walk or run pose draws one cell of a
  // real stride instead of alternating two plates. The cell is a function of
  // the same distance-driven phase as everything else (_ph counts half-steps;
  // a strip is one full stride = two of them), so a paw plants once per stride
  // of floor at any speed — the strip cannot moonwalk any more than the plates
  // could. Until it loads, the rest plate stands in (see above).
  const isRun = pose === 'runA' || pose === 'runB', isWalk = pose === 'walkA' || pose === 'walkB';
  // THE OPENINGS HAVE BODIES TOO (ART_QUEUE §2cc-iii). The winded breath is
  // a LOOP on the sim clock — one breath in and out per WINDED_BREATH, so the
  // flanks keep heaving however long the window is held. The landing is ONCE,
  // clocked by the landing timer itself: strike, fold, lowest, half-risen,
  // and it ends on the half-risen cell exactly as the window closes.
  const SA = isRun ? ART.runStrip : isWalk ? ART.walkStrip
    : pose === 'winded' ? ART.windedStrip : pose === 'land' ? ART.landStrip : null;
  let cell = -1;
  if (SA && typeof mediaHas === 'function') {
    if (mediaHas(SA.img)) {
      if (pose === 'winded') {
        const b = (((e.anim || 0) / WINDED_BREATH) % 1 + 1) % 1;
        cell = Math.min(SA.cells - 1, Math.floor(b * SA.cells));
      } else if (pose === 'land') {
        const L0 = e.land0 || HOP_LAND_T;
        cell = clamp(Math.floor((1 - (e.landT || 0) / L0) * SA.cells), 0, SA.cells - 1);
      } else {
        const half = (((e._ph || 0) % 2) + 2) % 2;
        cell = Math.min(SA.cells - 1, Math.floor(half / 2 * SA.cells));
      }
      A = SA;
    } else if (typeof mediaFetch === 'function') mediaFetch(SA.img);
  }
  const im0 = MEDIA_IMG[A.img];
  if (!im0 || !im0.naturalWidth) return false;
  // the pack takes the pop grade (media.js): a predator that blends into the
  // meadow is an ambush, and the owner reported exactly that
  const im = (typeof popArt === 'function' && popArt(A.img)) || im0;

  const cx = e.x + e.w / 2, footY = e.y + e.h;
  const cellW = cell >= 0 ? im.naturalWidth / A.cells : im.naturalWidth;
  const dh = e.h * A.k, dw = dh * (cellW / im.naturalHeight);
  // A GAIT HAS A VERTICAL — AND A RUN HAS A BACK. The vertical is weight
  // transfer taken from the measured CC0 cycles (docs/MOVEMENT_SOURCES.md):
  // a sharp rise onto the planted paw and a soft settle, not a symmetric
  // wave. The run adds two things the walk does not have: a suspension beat
  // (all four paws off the floor once per stride — the extra lift below) and
  // back flexion (the pitch), which is most of what separates a gallop from
  // a fast walk on screen. All of it rides the same distance-driven phase as
  // the frames, so nothing can drift.
  const moving = pose === 'walkA' || pose === 'walkB' || pose === 'runA' || pose === 'runB';
  const run = !!e._runG && moving;
  const p = (e._ph || 0) % 1;
  let gait = 0, pitch = 0;
  // a filmed stride already carries its rise, its suspension and its back:
  // the transform stand-in would add the same motion a second time
  if (moving && cell < 0) {
    const amp = run ? GAIT.runAmp : 1.6;
    gait = -Math.pow(Math.abs(Math.sin(p * Math.PI)), 0.7) * amp;
    if (run) {
      gait -= Math.max(0, Math.sin((p + 0.3) * Math.PI * 2)) * GAIT.susp;
      pitch = Math.sin(((e._ph || 0) % 2) * Math.PI) * GAIT.pitch;
    } else {
      pitch = Math.sin(((e._ph || 0) % 2) * Math.PI) * 0.028;
    }
  }
  // grounded plates hang off the floor line; the airborne one hangs off centre
  const yc = (A.foot || cell >= 0 ? footY - dh / 2 + e.h * (A.yOff || 0)
                     : e.y + e.h / 2 + dh * (A.yOff || 0)) + gait;

  c.save();
  c.translate(cx, yc);
  // THE TELL IS THE PLATE, AND THE PLATE IS NOT ENOUGH ON ITS OWN. The coil
  // drawing already burns amber where the rest drawing burns red — but a wolf
  // is twenty-six pixels tall in a busy room, so the wind-up also gets the
  // wash the guardians get, behind the body, growing over the tell.
  // ...and the HOPPER's crouch is the same tell and wears the same wash: it
  // returned before the shared ring ever drew, so a cheetah — gold all over —
  // gathered for its leap without the amber rising at all (tests/artbible).
  const wT = (e.coilT || 0) > 0 ? e.coilT : (e.crouchT || 0);
  if (wT > 0 && !G.artProbe && !tame) {
    const k = clamp(1 - wT / TELL_FAST, 0, 1);
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
  // the back flexes in plate space (after the mirror), so the flexion reads
  // the same whichever way it is running
  if (pitch) c.rotate(pitch);
  // THE RECOVERY POSES, in plate space and pivoted on the FEET so the paws
  // stay on the floor (ART_BIBLE §3.4) whatever the body does above them.
  // ...the transform stand-in only while the filmed opening is still in flight
  const R = cell < 0 ? BEAST_RECOVER[pose] : null;
  if (R) {
    const heave = R.heave ? Math.sin((e.anim || 0) * R.heave) * 0.025 : 0;
    c.translate(0, dh / 2);
    c.rotate(R.rot);
    c.scale(R.kx, R.ky + heave);
    c.translate(R.dx * dw, -dh / 2);
  }
  if (e.hurtT > 0) c.globalAlpha *= 0.85;
  const sx = cell >= 0 ? cell * cellW : 0;
  c.drawImage(im, sx, 0, cellW, im.naturalHeight, -dw / 2, -dh / 2, dw, dh);
  infEyeArt(c, A.img, cell >= 0 ? cell : 0, -dw / 2, -dh / 2, dw, dh);
  if (e.hurtT > 0) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5;
    c.drawImage(im, sx, 0, cellW, im.naturalHeight, -dw / 2, -dh / 2, dw, dh); c.restore();
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
  //
  // It walks like the hostile ones do (enemyGait): up to speed, down from it,
  // and round on its feet. The milling used to be vx = sin(t)·spd with the
  // facing left wherever it was — a friendly wolf drifting backwards and
  // forwards under a picture that never turned, the moonwalk at its purest.
  // Now the drift has a direction and the picture follows it, with a beat of
  // standing still at each end where the sine passes through zero.
  let want = 0;
  if (ad > 150) { e.dir = Math.sign(d) || e.dir; want = e.dir * e.spd * 0.9; }
  else if (ad > 70) { e.dir = Math.sign(d) || e.dir; want = e.dir * e.spd * 0.45; }
  else {
    const m = Math.sin((e.anim || 0) * 1.3);
    if (Math.abs(m) > 0.25) { e.dir = Math.sign(m); want = m * e.spd * 0.3; }
  }
  enemyGait(e, want, dt);
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
// ---------------------------------------------------------------------------
// THE ALPHA'S MOVES, FILMED (ART_QUEUE §2ax, 2026-09-05). Nine takes cut to
// strips, one per move, mapped onto the states over each state's own clock —
// the same table Nullfang has (BEAST_STRIP in js/beast.js) for the same
// reason: a plate slid around a room is a picture, a take is the move. The
// strips are the Alpha's ONLY body now (2026-10-09): the nine still plates
// that used to stand in were retired, a state without a strip of its own
// wears the rest take, and until its strip is over the wire the Alpha is
// the dark hold silhouette every guardian waits behind (drawBossHold).
//
// THE SCALE, MEASURED. The rest plate is all wolf (467 of 468 px) and draws
// at 2.05 hitbox heights; the rest take's wolf stands 227 of its 320-px cell,
// so the cell draws at 2.05 * 320/227 heights and the wolf comes out the size
// the plate was. Each take was cropped to its own widest frame, so k puts the
// resting body length back on the rest take's 304 px: roar 259 -> 1.17, leap
// (crouch, framed for the whole arc) 188 -> 1.6, claw 255 -> 1.19, clinch
// 243 -> 1.25, yield 291 -> 1.04, the rest at ~305 -> 1.
//
// THE CLOCKS: `b.t` counts down from what the transition set — known
// constants here (TELL_HEAVY, TELL_SWIPE, TELL_FAST, the 1.1 s leap, 0.26 s
// blows, the 0.18 s clinch) so `t0` is written in; the prowl runs on ground
// covered (like wolfPose), the rest and the shake loop on `anim`, and the
// yield plays once from the frame it is first seen and holds its last cell.
const ALPHA_STRIP_H = 2.05 * 320 / 227;
// THE CELLS OF THE STRIPS THAT ARE ON DISK (assets/characters/alpha/*.webp:
// 9-, 16- and 12-cell strips). A 24-cell table for a studio re-shoot that was
// never delivered used to sit beside this one; it was removed with the
// plates. A re-shoot brings its own cell table with it.
const ALPHA_STRIP = {
  rest:{key:'alRest',cells:9,k:1,loop:8},
  prowl:{key:'alProwl',cells:16,k:1,from:0,to:12,dist:9},
  roarwarn:{key:'alRoar',cells:12,k:1.17,from:0,to:3},
  roar:{key:'alRoar',cells:12,k:1.17,from:4,to:11},
  broodcall:{key:'alHowl',cells:12,k:1,from:0,to:5},
  howl:{key:'alHowl',cells:12,k:1,from:6,to:11},
  coil:{key:'alLeap',cells:12,k:1.6,from:0,to:4},
  leap:{key:'alLeap',cells:12,k:1.6,from:5,to:8},
  recoil:{key:'alLeap',cells:12,k:1.6,from:9,to:11},
  turn:{key:'alLeap',cells:12,k:1.6,from:9,to:11},
  clawwarn:{key:'alClaw',cells:12,k:1.19,from:0,to:5},
  claw:{key:'alClaw',cells:12,k:1.19,from:6,to:11},
  bitewarn:{key:'alBite',cells:12,k:1,from:0,to:4},
  bite:{key:'alBite',cells:12,k:1,from:5,to:11},
  clinch:{key:'alClinch',cells:12,k:1.25,from:0,to:3},
  shake:{key:'alClinch',cells:12,k:1.25,from:4,to:8,loop:12},
  free:{key:'alYield',cells:12,k:1.04,once:10},
};
const ALPHA_STRIPS = [...new Set(Object.values(ALPHA_STRIP).map(s=>s.key))];
// Simulation owns time and resolved distance. Drawing is a pure lookup.
function alphaMotionBegin(b) {
  if (b._alphaState !== b.st) { b._alphaState=b.st; b._alphaElapsed=0; b._alphaDuration=Math.max(.05,b.t||0); }
  b._alphaX=b.x;
}
function alphaMotionEnd(b,dt) {
  if (b._alphaState !== b.st) {
    b._alphaState=b.st; b._alphaElapsed=0;
    b._alphaDuration=b.st==='leap'?ALPHA_KIT.leapUp/1000:Math.max(.05,b.t||0);
  } else b._alphaElapsed=(b._alphaElapsed||0)+dt;
  const d=Math.abs(b.x-b._alphaX);
  if (d<100 && (b.st==='rest'||b.st==='idle'||b.petWalk)) {
    const old=b._alphaDistance||0;b._alphaDistance=old+d;
    if(d>.1&&Math.floor(old/30)!==Math.floor(b._alphaDistance/30))sfx('alpha_step');
  }
}
function alphaStripCell(b) {
  if (typeof G!=='undefined'&&(G.bossRig||G.alphaRig))return null;
  let st=(b.purified||b.tamed)?(b.petWalk?'prowl':'rest'):(b.dead&&!b.forceKill)?'free':b.st;
  if(st==='idle')st='rest';
  if(st==='intro'||st==='dorm')st='roarwarn';
  if(st==='rest'&&Math.abs(b.vx||0)>25)st='prowl';
  const S=ALPHA_STRIP[st]||ALPHA_STRIP.rest;
  const from=S.from||0,to=S.to==null?S.cells-1:S.to,n=to-from+1;
  let cell;
  if(S.loop)cell=from+Math.floor((b.anim||0)*S.loop)%n;
  else if(S.dist){let step=Math.floor((b._alphaDistance||0)/S.dist)%n;if((b.vx||0)*b.face<0)step=n-1-step;cell=from+step;}
  else {const p=S.once?clamp(1-(b.deathAnimT||0)/1.6,0,.999):clamp((b._alphaElapsed||0)/(b._alphaDuration||1),0,.999);cell=from+Math.floor(p*n);}
  return {S,cell};
}
function alphaQuestOffer() {
  if(isHero()||!G.save.flags.crystal||G.save.flags.alphaLead||G.save.flags.alpha)return;
  G.save.flags.alphaLead=1;qSet('alpha_pack','active');persist();
  G.dialog={name:t('n_ratchet'),lines:t('q_ask_alpha_pack'),i:0,npc:'ratchet'};G.state='DIALOG';
}
const ALPHA_KIT = {
  spd: 132,          // it prowls; the leap is where the speed is
  close: 128,        // inside this it claws or bites
  near: 300,         // inside this it leaps; outside it howls or roars
  leapV: 480,        // horizontal launch
  leapUp: 430,       // ...and it leaves the ground, because a wolf does
  kickV: 300,        // how hard it kicks off you when the leap connects
  stun: 0.45,        // seconds of the roar. Tuned against its own wind-up:
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
    if (b.mash >= 4) { b.st='rest'; b.t=bossRest(b,.8); player.stunT=0; player.vx=-b.face*220; player.vy=-180; player.iT=Math.max(player.iT,.35); }
  }
}

function alphaSummon(b) {
  const live = G.enemies.filter(e => !e.dead && isWolf(e)).length;
  const want = Math.min(2, ALPHA_KIT.packMax - live);
  for (let i = 0; i < want; i++) {
    const side = i % 2 ? 1 : -1;
    let x = side < 0 ? 3*TILE : (G.roomDef.w-4)*TILE;
    if (Math.abs(x-player.x)<260) x = side < 0 ? (G.roomDef.w-4)*TILE : 3*TILE;
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
  if (b.st === 'rest' || b.st === 'idle') b.face = Math.sign(dist) || b.face;

  if (b.st === 'idle' || b.st === 'rest') {
    if (b.t <= 0) {
      // a rest she was not hit through is an opening she had: the debt clears
      if (!b.hitSince) b.denied = 0;
      b.hitSince = false;
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
      // Two beats of 0.2 s, not three of 0.3: the walk is OPEN time (it cannot
      // hurt her while it paces), and tests/openings.cjs measured the claw's
      // opening at 1.2 s with the old walk on top of its rest — a gift on the
      // move that was meant to be the stingy one.
      if (!inBand && (b.reposN = (b.reposN || 0) + 1) < 2) {
        b.t = 0.2; b.band = (b.band + 2) % 3;      // hold the band, walk to it
        return alphaMove(b, dt, adist);
      }
      b.reposN = 0;
      // THE COLD-DICE FLOOR (.claude/skills/boss-openings §4): three moves in
      // a row that landed on her mean she has not had an opening she could
      // use — the leap kicked off her, the bite held her, the roar froze her.
      // The next move is the close pair (the shortest tell, and it always
      // opens), and it waits an extra beat first so the opening is unmissable.
      if ((b.denied || 0) >= 3) { b.denied = 0; b.band = 0; b.t = 0.7; return alphaMove(b, dt, adist); }
      b.alphaAlt = !b.alphaAlt;
      if (b.band === 0) { b.st = b.alphaAlt ? 'clawwarn' : 'bitewarn'; b.t = Math.max(.42,TELL_FAST); }
      else if (b.band === 1) { b.st = 'coil'; b.t = TELL_SWIPE; }
      else if (b.alphaAlt && packRoom) { b.st = 'broodcall'; b.t = TELL_HEAVY; }
      else { b.st = 'roarwarn'; b.t = TELL_HEAVY; }
    }
  } else if (b.st === 'clawwarn' || b.st === 'bitewarn') {
    // it STEPS INTO the swing rather than planting and swinging at air — which
    // is both how an animal does it and what makes a claw thrown from the edge
    // of its reach still worth respecting
    b.windT = Math.max(.42,TELL_FAST);
    b.vx += (b.face * ALPHA_KIT.spd * 1.6 - b.vx) * Math.min(1, dt * 5);
    if (b.t <= 0) { b.st = b.st.replace('warn', ''); b.t = 0.26; b.fired = false; }
  } else if (b.st === 'claw' || b.st === 'bite') {
    // THE CLOSE ANSWER, and it is deliberately not generous. "Do not leave many
    // openings if the player is closing off to it" — so the recovery after a
    // claw or a bite is barely half the one after a leap. Standing next to this
    // thing is meant to be the wrong place to be.
    if (!b.fired && b.t <= .19) {
      b.fired = true;
      const reach = b.st === 'claw' ? b.w * 0.95 : b.w * 0.6;
      const hb = { x: b.cx() + (b.face > 0 ? 0 : -reach), y: b.y + b.h * 0.2,
                   w: reach, h: b.h * 0.7 };
      const hit = !player.dead && player.iT <= 0 && aabb(hb, player);
      if (hit) { player.hurt(DF().edmg, b.cx(), 'alpha.' + b.st); b.denied = (b.denied || 0) + 1; b.hitSince = true; }
      sfx(b.st === 'claw' ? 'slash' : 'hit');
      cam.shake = Math.max(cam.shake, 3);
      burst(b.cx() + b.face * reach * 0.7, b.cy(), 8, '#ffb15a', 190, 0.4, 120, 2, true);
      // A BITE THAT LANDS DOES NOT LET GO. A wolf does not close its jaws and
      // step back — it takes hold and WORRIES the thing, head whipping side to
      // side. So a connected bite is not one hit, it is a hold: clinch, shake,
      // throw. The claw stays a single clean swipe; that contrast is the whole
      // reason the two moves are worth having next to each other.
      if (hit && b.st === 'bite') {
        b.st = 'clinch'; b.t = 0.18; G.toast(t('alpha_escape'));
        b.shakeN = 0; b.shakeT = 0; b.mash = 0;
        b.vx = 0;
      }
    }
    // 0.45 of the guardian rest: measured (tests/openings.cjs) as ~600-900 ms
    // of opening with the band walk on top — two hits, not the three a 0.62
    // rest was handing out
    if (b.st !== 'clinch' && b.t <= 0) { b.st = 'rest'; b.t = bossRest(b, 0.45); }
  } else if (b.st === 'clinch') {
    // it has her. A beat of stillness first, because a shake that starts on the
    // frame the jaws close reads as a glitch rather than as weight.
    b.vx = 0;
    alphaHold(b, dt);
    if (b.st !== 'clinch') return alphaMove(b,dt,adist);
    if (b.t <= 0) { b.st = 'shake'; b.t = 0.66; b.shakeN = 0; }
  } else if (b.st === 'shake') {
    // THE WORRY: three whips of the head, left-right-left, each one a hit. The
    // damage is spread across the shakes rather than front-loaded so that
    // breaking out early actually saves you something.
    b.vx = 0;
    alphaHold(b, dt);
    if (b.st !== 'shake') return alphaMove(b,dt,adist);
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
      sfx('alpha_leap'); cam.shake = Math.max(cam.shake, 4);
    }
  } else if (b.st === 'leap') {
    // COMMITTED. No steering in the air — that is the whole reason the coil in
    // front of it is worth reading.
    if (!b.leapHit && !player.dead && player.iT <= 0 && aabb(hurtBoxOf(b), player)) {
      b.leapHit = true;
      player.hurt(DF().edmg, b.cx(), 'alpha.leap'); b.denied = (b.denied || 0) + 1; b.hitSince = true;
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
    if (b.t <= 0) { b.st = 'howl'; b.t = 0.45; b.fired = false; }
  } else if (b.st === 'howl') {
    if (!b.fired) {
      b.fired = true;
      alphaSummon(b);
      sfx('alpha_howl'); cam.shake = Math.max(cam.shake, 7);
      if (typeof padRumble === 'function') padRumble(0.7, 0.5, 380);
      if (typeof roarWave === 'function') roarWave(b.cx(), b.cy() - b.h * 0.3, '#ff8a4a');
    }
    if (b.t <= 0) { b.st = 'rest'; b.t = bossRest(b, 0.6); }
  } else if (b.st === 'roarwarn') {
    b.windT = TELL_HEAVY;
    b.vx *= Math.pow(0.05, dt);
    if (b.t <= 0) { b.st = 'roar'; b.t = 0.4; b.fired = false; }
  } else if (b.st === 'roar') {
    if (!b.fired) {
      b.fired = true;
      // A STUN HAS TO BE ESCAPABLE OR IT IS NOT A MOVE, IT IS A TAX. So it is a
      // RADIUS, not a hitscan: 260 px, announced by a 0.7 s wind-up and a
      // shockwave ring drawn on the floor. Outside it, nothing happens to you.
      const d = Math.hypot(px - b.cx(), py - b.cy());
      if (!player.dead && d < 260) {
        b.denied = (b.denied || 0) + 1; b.hitSince = true;
        player.stunT = Math.max(player.stunT || 0, ALPHA_KIT.stun);
        player.vx = 0;
        if (typeof padRumble === 'function') padRumble(0.9, 0.8, 700);
      }
      sfx('alpha_bark'); cam.shake = Math.max(cam.shake, 11);
      if (typeof roarWave === 'function') roarWave(b.cx(), b.cy() - b.h * 0.3, '#ffc24a');
      burst(b.cx(), b.cy(), 18, '#ffe6b8', 300, 0.6, 0, 3, true);
    }
    // THE ONE GIFT IS THE MISSED LEAP, not this: standing outside the ring is
    // the read, and it pays one clean combo — measured 1.5 s before, 0.9 now
    if (b.t <= 0) { b.st = 'rest'; b.t = bossRest(b, 0.6); }
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

// one amber copy of a strip CELL, for the tell on a filmed move: the Alpha
// returns before Boss.draw paints the rigs' wind-up amber, so the tell's
// gold is laid on here, climbing over the wind-up
const ALPHA_CELL_TINT = { cv: null, key: '', cell: -1 };
function alphaStripTint(key, cell, cells) {
  const im = MEDIA_RAW[key]; if (!im || !im.naturalWidth) return null;
  const T = ALPHA_CELL_TINT;
  const cw = im.naturalWidth / cells, ch = im.naturalHeight;
  if (!T.cv) T.cv = document.createElement('canvas');
  if (T.key !== key || T.cell !== cell) {
    T.cv.width = Math.round(cw); T.cv.height = ch;
    const x = T.cv.getContext('2d');
    x.clearRect(0, 0, T.cv.width, ch);
    x.drawImage(im, cell * cw, 0, cw, ch, 0, 0, T.cv.width, ch);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = TELL_COL; x.fillRect(0, 0, T.cv.width, ch);
    T.key = key; T.cell = cell;
  }
  return T.cv;
}
function drawAlpha(c, b, cx, cy) {
  if (typeof mediaFetch === 'function') for (const k of ALPHA_STRIPS) mediaFetch(k);
  const pick = alphaStripCell(b);
  const sim = pick && MEDIA_RAW[pick.S.key];
  if (!sim || !sim.naturalWidth) { drawBossHold(c, b); return; }
  const warn = !!(b.st && TELL_ST.test(b.st));
  // THE FILMED MOVE, drawn foot on the hitbox floor and mirrored for
  // face > 0 (the takes face LEFT). No bob, lean or spin on top: the
  // corkscrew, the head-shake and the howl's rise are IN the takes, and
  // turning a take that already turns would turn it twice.
  const S = pick.S, H = b.h * ALPHA_STRIP_H * S.k;
  c.save();
  c.translate(cx, b.y + b.h);
  c.scale((b.face || -1) > 0 ? -1 : 1, 1);
  if (b.hurtT > 0) c.globalAlpha *= 0.85;
  drawStripCell(c, S.key, pick.cell, S.cells, 0, 0, H, false);
  const cw = sim.naturalWidth / S.cells, dw = H * (cw / sim.naturalHeight);
  // THE RISING AMBER. Only a state whose name says a blow is coming wears it,
  // so the art probe's COLD states stay cold by the warn test itself.
  if (warn && !b.dead) {
    const dur = b.windT > 0 ? b.windT
      : b.st === 'coil' ? TELL_SWIPE : /roarwarn|broodcall/.test(b.st) ? TELL_HEAVY : TELL_FAST;
    const kk = clamp(1 - (b.t || 0) / dur, 0, 1);
    const tint = alphaStripTint(S.key, pick.cell, S.cells);
    if (tint) {
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.06 + 0.26 * kk;     // photographed at 0.68: a flat gold silhouette with no wolf left in it
      c.drawImage(tint, -dw / 2, -H, dw, H); c.restore();
    }
  }
  if (b.hurtT > 0) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5;
    drawStripCell(c, S.key, pick.cell, S.cells, 0, 0, H, false); c.restore();
  }
  c.restore();
  // THE ROAR'S RADIUS, DRAWN. A stun the player cannot see the edge of is a
  // stun they will believe was unfair even when it was not — so the ring that
  // decides it is on the floor, growing over the wind-up and flashing at the
  // moment it lands. Suppressed for the art probe like every other
  // ground-anchored effect (§3.4), since it is lit pixels below the foot line.
  if (!G.artProbe && (b.st === 'roarwarn' || b.st === 'roar')) alphaRoarRing(c, b, cx);
}
function alphaRoarRing(c, b, cx) {
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
