// ===========================================================================
// NULLFANG'S DUEL — the first sage made the hardest fight of chapter one.
//
// The owner, 2026-11-24: "Rhino is the hardest boss, even though it's the
// first mini boss, which means all the next ones need to be harder ... Lion
// also needs to be flashier and harder. You need to decrease the openings for
// hitting those bosses. And Lion needs to be even harder than Rhino."
//
// WHAT WAS WRONG, MEASURED (the boss gauntlet, seeds 1-5, Normal, the Purifier
// equipped as she carries it into A4):
//   - a bot that walks in and holds attack killed him in 4.4 s, losing one
//     core. Five blows less than 1.1 s apart broke him (1.7 s, x1.6), the
//     break was taken out of his own wind-ups, and the half-health stagger
//     (1.5 s, and `t = 1.2` written into whatever state he stood in) stretched
//     that break to 3.76 s: 60% of his bar in one daze. Phases two and three
//     lasted three seconds and he acted once.
//   - he had no hide: every blow landed whole in every state (the recorder's
//     openShare 1.00; the rhino's is 0.68-0.82).
//   - a POKE: his hurt box is 218 px wide (types.js hurtBoxOf), the Purifier
//     lands from 230 px centre to centre, and his paw reached 114 px and only
//     swung inside 130 — 145-196 px off his nose was a place to stand and cut
//     forever (4.9 s, no damage taken).
//   - his BACK: a 0.52 s filmed turn and nothing that strikes behind (7.1 s,
//     no damage taken).
//
// WHAT THIS FILE DOES. It wraps Boss.prototype.update for NULLFANG alone (not
// the NOSTOS boar, not the staged first meeting) — the shape the gauntlet's
// prototype was measured in — and adds, all in NF_DUEL:
//   1. the break cannot be taken out of anything he is DOING, needs 7 blows,
//      and turned blows do not count toward it (types.js, `dazeWhole`);
//   2. the phase breaks are short staggers that never stretch the state he
//      is in;
//   3. a hide of 0.25 while he acts or stands neutral; whole only in the
//      openings (recover, the rest after a move, the break, the null crash);
//   4. the swipe is a LUNGE: it swings from 215 px and carries him 75 px
//      into the blow, and the claw arc drawn is the box that hits;
//   5. 449 HP on Normal (BSTAT 220 -> 300);
//   6. greed is answered: three turned blows and he BITES — a 950 px/s lunge
//      along the floor (jump it), then a 260 ms stop you may punish once;
//   7. no place is safe: the turning RAKE for her behind him, the REAR-UP for
//      her over him, NULL BOLTS for her far away, and floor SHOCKS from the
//      roar and from his landings for her standing on the ground;
//   8. the openings are shorter: 300-400 ms after a move (255-300 in fury),
//      landings 300/240/200 ms by phase, the null crash 1.0 s.
// Every tell is at least 400 ms (kingdom one) and carries the wind-up cue
// (TELL_ST hears `warn`); no tell got shorter, the WAITING did.
//
// MEASURED (tests in the gauntlet folder, the same bots before and after):
// the walk-in-and-mash bot dies in ~11 s; the poke and the backstab die; a
// careful player bot wins about 2 fights in 5 in ~60 s. The rhino's careful
// bot wins in 37.6 s untouched.
//
// FLASH, THE ALLOWED WAY (owner, four times: "Why still framed with light
// ?!!!"): light runs along the FLOOR with the shocks, the bolts carry their
// own trail, the fury cracks the ground under every paw plant, the claw arc is
// drawn where it cuts — and nothing is drawn round his body.
//
// His art is the filmed lion (js/beast.js BEAST_STRIP): every new state is a
// range of an existing take, mapped below, so no state falls back to a
// standing pose in the middle of a strike.
// ===========================================================================
const NF_DUEL = Object.freeze({
  hp: 300,                       // BSTAT base (x FOE_HP 1.15 x ZONE_ATK 1.3 = 449 on Normal); was 220
  dazeAt: 7,                     // was 5 (the rhino: 6)
  daze: [1.2, 0.9, 0.7],         // by phase (three = fury); was 1.7 / 1.25
  midStag: 0.6, furyStag: 0.5,   // the phase breaks; were 1.5 and 1.2, and they rewrote `t`
  hide: 0.25,                    // a blow into him while he acts (the rhino: 0.5)
  rest: [0.30, 0.40],            // the rest after a move; fury takes [0.255, 0.30]
  landRec: [0.30, 0.24, 0.20],   // pounce/dive landing settle by phase; were 0.36/0.26 and 0.30/0.22
  nullend: 1.0,                  // the null crash, the fight's one gift; was 1.15
  swipeTrig: 215, lunge: 75,     // the lunge-swipe: swings from 215 px, steps 75 px into it
  swipeBox: 144,                 // its box runs cx+6 .. cx+150 (entities.js case 'glitch'); was 108
  lungeGap: 72,                  // the paw arrives, the body stops this far short of her
  rake: 0.52, rakeHit: 0.22, rakeBox: 120, rakeCD: 0.9,   // the turning rake: the filmed turn IS its tell
  rear: 0.45, rearHop: 520, rearT: 0.5, rearBox: [80, 110], rearCD: 1.0,   // the rear-up: +-80 px, 110 px over him
  spit: 0.5, spitMin: 420, spitCD: [4, 6], spitVy: 380, spitG: 900, spitR: 9,   // null bolts, three, at 0.75/1/1.25 of her distance
  bite: 950, biteTell: 0.40, biteT: 0.24, biteRec: 0.26, biteAfter: 0.15, greedN: 3,   // the answer to greed
  roarShock: [480, 1.15], landShock: [420, 0.8], shockH: 34, shockW: 40,   // px/s, s; jump them
  furyCrack: 58,                 // px of prowl between cracks under his paws, in fury
});
// THE AMBUSH FROM THE LEAVES (owner, 2026-11-25: "create structures like green structure,
// leaves, or maybe banana leaves ... converted into metallic ... a place where the lion goes
// inside and hide and then comes attacking ... the indication of the place it comes from is by
// watching the leaves moves in the place that is coming from to attack. Usually that happens
// wherever I'm standing. So it gives me a split of second to move away from its attack").
// The arena's metal banana clumps are js/nfcover.js. The sentence, every number in seconds:
//   coverwarn  he turns to the clump nearest him and gathers (the filmed leap's crouch)
//   coverin    one low leap into it: the leaves part round him, close behind him, sway
//   lurk       HIDDEN: not drawn, not a target, no body to walk into, no damage from anything
//   lurkwarn   HIDDEN, THE TELL: the clump at or nearest where SHE stands shakes — leaves
//              thrash, shed flecks, the recorded meadow rustles and the wind-up cue sounds
//              (TELL_ST hears `warn`). He has moved to it unseen. 0.60 s, 0.50 in phase two,
//              0.45 in the fury: never under kingdom one's 0.40 floor
//   lurkpounce he bursts out of THAT clump at where she is NOW, low and fast; the box that
//              hurts is his drawn body in the air (ledger: what looks sharp cuts)
//   lurkland   the opening: landed, spent, whole hide
// Answers: leave the shaking clump's reach (run from it), or jump the burst. No place is safe —
// the clump that shakes is always the one nearest her — and no hiding is endless: he is hidden
// at most lurk + tell (0.95 + 0.60 s), then he must come out.
const NF_AMB = Object.freeze({
  warn: 0.34,                    // the gather before the leap in
  inApex: 70, inMax: 560,        // the leap into a clump: apex px, the farthest clump he will take
  lurk: [0.55, 0.95],            // hidden, before the tell (fury: the low end)
  tell: [0.60, 0.50, 0.45],      // the shaking clump, by phase (three = fury)
  apex: [40, 34, 30],            // the burst's apex px over her floor
  reach: 440,                    // the farthest the burst carries from the clump
  land: [0.32, 0.28, 0.26],      // the opening after it, by phase (and the turn after it, when she is behind him: under 0.9 s together, tests/openings.cjs)
  after: 0.15,                   // ...and straight back to work
  fade: 0.3,                     // the body goes down into the leaves this long as he goes in
  first: [4, 6], every: [[8, 11], [6, 9]],   // its clock: the first, then by phase
});
// the states he is DOING something in: a blow into them is turned, and the
// break is not taken out of them
const NF_ACT = { swipewarn: 1, swipe: 1, crouch: 1, pounce: 1, roar: 1, springwarn: 1, spring: 1, perch: 1,
  dive: 1, nullcharge: 1, nullhop: 1, stalk: 1, run: 1, rakewarn: 1, rake: 1, rearwarn: 1, rear: 1, swatwarn: 1, swat: 1,
  spitwarn: 1, bitewarn: 1, bite: 1, coverwarn: 1, coverin: 1, lurk: 1, lurkwarn: 1, lurkpounce: 1 };
// the moves this file owns: the entities switch does not know them, and they
// run here, before it
const NF_OWN = { rakewarn: 1, rake: 1, swatwarn: 1, swat: 1, spitwarn: 1, bitewarn: 1, bite: 1, bitestop: 1,
  coverwarn: 1, coverin: 1, lurk: 1, lurkwarn: 1, lurkpounce: 1, lurkland: 1 };
// in the leaves: not drawn, not a target, no body
const NF_HID = { lurk: 1, lurkwarn: 1 };
function nfHidden(b) { return !!b && b.kind === 'glitch' && !!NF_HID[b.st] && !b.dead; }
function nfDuelOn(b) {
  return !!b && b.kind === 'glitch' && !b.meet && !(typeof isHero === 'function' && isHero());
}
function nfRand(a, b) { return a + Math.random() * (b - a); }
// a state entered by this file: the clock and the filmed take's clock together
function nfEnter(b, st, t) {
  b.st = st; b.t = t;
  b._motionState = st; b._motionDuration = Math.max(0.05, t); b._motionElapsed = 0;
}
function nfHurt(b, src) {
  if (player.dead || player.iT > 0) return false;
  player.hurt(DF().edmg, b.cx(), 'glitch.' + src);
  b.denied = (b.denied || 0) + 1; b.hitSince = true;
  return true;
}
// THE FLOOR SHOCK — gravehorn's buck shock (js/gravehorn.js b.shocks), run
// on the ground he is standing on: low enough to jump, gone at its range
// the ground under x near a height (gravehorn's ghGround: the meadow is a heightfield, not a line)
function nfGround(x, y0) {
  const gc = typeof groundColumnAt === 'function' ? groundColumnAt(x) : null;
  if (!gc) return y0;
  const s = gc[0] < gc[1] ? gc[0] : gc[1];
  return Math.abs(s - y0) < 28 ? s : y0;
}
function nfShock(b, spec) {
  const fy = b.y + b.h;
  // up on a ledge, or in the air: the floor does not carry it
  if (b.on === false || (typeof tileAt === 'function' && tileAt(Math.floor(b.cx() / TILE), Math.floor((fy + 4) / TILE)) === '=')) return;
  b.nfShocks = b.nfShocks || [];
  for (const dir of [-1, 1]) b.nfShocks.push({ x: b.cx() + dir * 40, y: fy, dir, v: spec[0], life: spec[1], t: 0, hit: false });
  cam.shake = Math.max(cam.shake, 7); sfx('quake');
  if (typeof padRumble === 'function') padRumble(0.6, 0.5, 220);
}
function nfStepHazards(b, dt) {
  const W = G.roomDef.w * TILE, pc = player.x + player.w / 2;
  if (b.nfShocks) for (let i = b.nfShocks.length - 1; i >= 0; i--) {
    const s = b.nfShocks[i];
    s.t += dt; s.x += s.dir * s.v * dt; s.y = nfGround(s.x, s.y);
    const wall = solidAt(Math.floor(s.x / TILE), Math.floor((s.y - TILE * 0.6) / TILE));
    if (s.t >= s.life || wall || s.x < 0 || s.x > W) { b.nfShocks.splice(i, 1); continue; }
    if (!G.artProbe) {
      burst(s.x, s.y - 2, 2, '#b8a888', 150, 0.3, 420, 3.2);
      if (chance(0.6)) burst(s.x, s.y - 4, 1, '#d68cff', 120, 0.22, 200, 2.2, true);
    }
    if (!s.hit && aabb({ x: s.x - NF_DUEL.shockW / 2, y: s.y - NF_DUEL.shockH, w: NF_DUEL.shockW, h: NF_DUEL.shockH + 6 }, player)
      && nfHurt(b, 'shock')) s.hit = true;
  }
  if (b.nfOrbs) for (let i = b.nfOrbs.length - 1; i >= 0; i--) {
    const o = b.nfOrbs[i];
    o.vy += NF_DUEL.spitG * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.t += dt;
    if (!G.artProbe) {
      addPart(o.x + rnd(-2, 2), o.y + rnd(-2, 2), -o.vx * 0.08, -o.vy * 0.08, 0.32, chance(0.4) ? '#f1dcff' : '#b06aff', 2.6, 0, true);
    }
    const ground = solidAt(Math.floor(o.x / TILE), Math.floor((o.y + NF_DUEL.spitR) / TILE));
    const hitHer = Math.abs(o.x - pc) < NF_DUEL.spitR + player.w / 2 && o.y + NF_DUEL.spitR > player.y && o.y - NF_DUEL.spitR < player.y + player.h;
    if (hitHer) nfHurt(b, 'bolt');
    if (hitHer || ground || o.t > 2.5 || o.x < 0 || o.x > W) {
      b.nfOrbs.splice(i, 1);
      burst(o.x, o.y, 10, '#b06aff', 200, 0.4, 260, 3, true);
      if (typeof bossVfx === 'function' && !G.artProbe) bossVfx('nf_burst', o.x, o.y, { h: 72 });
      if (ground && typeof fx === 'function' && !G.artProbe)
        fx('cracks', o.x, Math.floor((o.y + NF_DUEL.spitR) / TILE) * TILE + 3, { rx: 46, ry: 14, dur: 1.0, col: '#8a3df0', hot: '#f1dcff', power: 0.9 });
      sfx('hit');
    }
  }
}
// the moves this file owns, ticked before the entities switch sees the frame
function nfOwnStep(b, dt, dist, adist) {
  if (/^(cover|lurk)/.test(b.st)) return nfAmbStep(b, dt, dist, adist);
  const N = NF_DUEL, f = b.face || 1;
  const turning = Math.abs((b.faceVis == null ? f : b.faceVis) - f) > 0.02;
  b.vx = b.st === 'bite' ? f * N.bite : 0;
  b.t -= dt;
  if (b.st === 'rakewarn') {
    // the turn plays out first: the strike is never thrown by a body still coming round
    if (b.t <= 0 && !turning) { nfEnter(b, 'rake', N.rakeHit); b.hitDone = false; beastSound('swipe'); }
  } else if (b.st === 'rake') {
    if (!b.hitDone && b.t <= N.rakeHit - 0.06) {
      b.hitDone = true;
      // THE WHIRL: the paw comes round WITH the body, so the arc covers the side he
      // turned from as well as the side he turned to — crossing back over his
      // back during the turn is not a way out of it (measured: a bot that did
      // exactly that won 5 of 5 against a rake that struck one side only)
      const box = { x: b.cx() - 8 - N.rakeBox, y: b.y - 10, w: 2 * (N.rakeBox + 8), h: b.h + 14 };
      if (typeof fx === 'function') for (const sd of [f, -f])
        fx('slash', b.cx() + sd * 40, b.cy() - 4, { rx: 100, ry: 90, dur: 0.3, flip: sd < 0, power: 4, col: '#b06aff', hot: '#f4e6ff', delay: sd === f ? 0 : 0.05 });
      burst(b.cx() + f * 70, b.cy(), 10, '#b06aff', 260, 0.35, 150, 3, true);
      burst(b.cx() - f * 70, b.cy(), 8, '#b06aff', 220, 0.3, 150, 3, true);
      // the claws, generated (js/bossvfx.js): three gashes each side, as wide as the box
      if (typeof bossVfx === 'function' && !G.artProbe) for (const sd of [f, -f]) bossVfx('nf_claw', b.cx() + sd * (N.rakeBox * 0.55 + 8), b.cy() - 4, { h: N.rakeBox * 1.25, flip: sd > 0 });
      if (aabb(box, player)) nfHurt(b, 'rake');
    }
    if (b.t <= 0) { nfEnter(b, 'idle', nfRand(N.rest[0], N.rest[1])); b.openIdle = true; }
  } else if (b.st === 'swatwarn') {
    if (chance(0.5)) addPart(b.cx() + rnd(-30, 30), b.y + b.h - 2, rnd(-20, 20), rnd(-160, -80), 0.35, '#b9a888', 2.4, 120, false);
    if (b.t <= 0) {
      nfEnter(b, 'swat', N.rearT); b.hitDone = false; b.vy = -N.rearHop; b.rearY = b.y;
      beastSound('leap'); cam.shake = Math.max(cam.shake, 4);
    }
  } else if (b.st === 'swat') {
    if (!b.hitDone && b.t <= N.rearT - 0.08) {
      b.hitDone = true;
      const box = { x: b.cx() - N.rearBox[0], y: b.rearY - N.rearBox[1], w: 2 * N.rearBox[0], h: N.rearBox[1] + 10 };
      // the paws go UP: the arc is drawn over his back, where the box is
      if (typeof fx === 'function') fx('slash', b.cx(), b.rearY - 30, { rx: 96, ry: 90, dur: 0.3, rot: -Math.PI / 2, flip: f < 0, power: 4, col: '#b06aff', hot: '#f4e6ff' });
      if (typeof bossVfx === 'function' && !G.artProbe) bossVfx('nf_claw', b.cx(), b.rearY - N.rearBox[1] * 0.5, { h: N.rearBox[0] * 1.6, rot: -Math.PI / 2, flip: f < 0 });
      for (let i = 0; i < 10; i++) addPart(b.cx() + rnd(-60, 60), b.rearY + rnd(-10, 10), rnd(-40, 40), rnd(-320, -160), 0.4, i % 3 ? '#b9a888' : '#d68cff', 2.6, 300, i % 3 === 0);
      beastSound('swipe');
      if (aabb(box, player)) nfHurt(b, 'swat');
    }
    if (b.t <= 0 && b.on !== false) { nfEnter(b, 'idle', nfRand(N.rest[0], N.rest[1])); b.openIdle = true; beastSound('land'); }
    else if (b.t <= -0.6) { nfEnter(b, 'idle', nfRand(N.rest[0], N.rest[1])); b.openIdle = true; }
  } else if (b.st === 'spitwarn') {
    if (chance(0.7)) {
      const a = rnd(0, 6.28), r = rnd(24, 44), mx = b.cx() + f * 74, my = b.y + 8;
      addPart(mx + Math.cos(a) * r, my + Math.sin(a) * r, -Math.cos(a) * 90, -Math.sin(a) * 90, 0.3, '#b06aff', 2.4, 0, true);
    }
    if (b.t <= 0) {
      const T = 2 * N.spitVy / N.spitG, mid = clamp(dist / T, -700, 700);
      b.nfOrbs = b.nfOrbs || [];
      for (const k of [0.75, 1, 1.25]) b.nfOrbs.push({ x: b.cx() + f * 74, y: b.y + 10, vx: mid * k, vy: -N.spitVy, t: 0 });
      beastSound('roar'); cam.shake = Math.max(cam.shake, 5);
      burst(b.cx() + f * 74, b.y + 10, 14, '#d68cff', 260, 0.4, 0, 3, true);
      if (typeof bossVfx === 'function' && !G.artProbe) bossVfx('nf_burst', b.cx() + f * 84, b.y + 10, { h: 80 });
      nfEnter(b, 'idle', nfRand(N.rest[0], N.rest[1])); b.openIdle = true;
      b.spitCD = nfRand(N.spitCD[0], N.spitCD[1]);
    }
  } else if (b.st === 'bitewarn') {
    if (chance(0.5)) addPart(b.cx() - f * rnd(10, 40), b.y + b.h - 3, -f * rnd(30, 90), rnd(-50, -10), 0.3, '#b9a888', 2.4, 200, false);
    if (b.t <= 0) { nfEnter(b, 'bite', N.biteT); b.hitDone = false; beastSound('leap'); cam.shake = Math.max(cam.shake, 4); }
  } else if (b.st === 'bite') {
    // speed lines along the floor behind him: the ground he just covered
    for (let i = 0; i < 2; i++)
      addPart(b.cx() - f * rnd(20, 70), b.y + rnd(8, b.h - 6), -f * rnd(200, 420), 0, 0.18, i ? '#cdbd9c' : '#d68cff', 2.2, 0, !i);
    const box = { x: f > 0 ? b.x + b.w - 10 : b.x - 40, y: b.y + 4, w: 50, h: b.h - 4 };
    if (!b.hitDone && aabb(box, player) && nfHurt(b, 'bite')) {
      b.hitDone = true; G.hitStop = Math.max(G.hitStop, 0.08); cam.shake = Math.max(cam.shake, 6);
      burst(box.x + box.w / 2, b.cy(), 12, '#f1dcff', 280, 0.3, 120, 3, true);
      if (typeof bossVfx === 'function' && !G.artProbe) bossVfx('nf_burst', box.x + box.w / 2, b.cy(), { h: 110 });
    }
    // it BITES, it does not run through her: it stops on her (or on its own length
    // when she has gone over it). Running on past her turned the stop into a turn
    // and a 0.7-1.0 s gift (tests/openings.cjs, bite>bitestop)
    if (b.hitDone || (adist < 64 && (Math.sign(dist) || f) === f)) b.t = Math.min(b.t, 0);
    if (b.t <= 0) { nfEnter(b, 'bitestop', N.biteRec); b.vx = 0; beastSound('land'); }
  } else if (b.st === 'bitestop') {
    // the stop IS the opening (biteRec); after it he is straight back to work —
    // a rest here measured as a 1 s gift (tests/openings.cjs, bite>bitestop)
    if (b.t <= 0) { nfEnter(b, 'idle', N.biteAfter); b.openIdle = false; b.swipeCD = Math.min(b.swipeCD || 0, N.biteAfter); }
  }
}
// THE BURST HURTS WITH THE BODY THAT IS DRAWN. The filmed leap carries the animal about
// inside its cell as it flies (up, and well ahead of the physics box), so a box round his
// physics body would cut where nothing is drawn and miss what is. Each flight cell's drawn
// body, measured off the shipped art by tools/nfleapbox.cjs (nfMeasureLeapBox below):
// [left, right, top, bottom] in px from (his centre x, his feet y), facing +x.
// tests/nf-ambush.cjs re-measures it against the build and fails if the art moved.
const NF_LEAP_BOX = [[-108, 110, -116, 8], [-96, 118, -126, 8], [-98, 122, -128, 8], [-114, 124, -128, 8], [-100, 128, -128, 8],
  [-100, 132, -126, 8], [-106, 136, -94, 8], [-110, 136, -90, 8], [-114, 136, -84, 8], [-116, 134, -86, 8], [-120, 130, -92, 8],
  [-116, 122, -110, 8], [-112, 118, -128, 8]];
function nfLeapCell(b) {
  const R = BEAST_STRIP.lurkpounce, n = R.to - R.from + 1, d = b.leapDuration || 0.4;
  return Math.min(n - 1, Math.floor(clamp(((b.anim || 0) - (b.leapT0 || 0)) / d, 0, 0.999) * n));
}
function nfBurstBox(b) {
  const T = NF_LEAP_BOX, f = b.face || 1, cx = b.cx(), fy = b.y + b.h;
  const q = T && T[nfLeapCell(b)];
  if (!q) { const H = hurtBoxOf(b); return { x: H.x, y: H.y, w: H.w, h: H.h }; }
  // the silhouette's own fill: a tenth in from each side of its box (tail tip, ear tips)
  const w = q[1] - q[0], h = q[3] - q[2], l = f > 0 ? cx + q[0] : cx - q[1];
  return { x: l + w * 0.1, y: fy + q[2] + h * 0.1, w: w * 0.8, h: h * 0.8 };
}
function nfMeasureLeapBox() {
  const b = G.boss; if (!b) return null;
  const keep = {}; for (const k of ['st', 'anim', 'leapT0', 'leapDuration', 'face', 'faceVis', 't', 'coverFade', '_motionState', '_motionDuration']) keep[k] = b[k];
  const probe = G.artProbe, R = BEAST_STRIP.lurkpounce, n = R.to - R.from + 1;
  const cv = document.createElement('canvas'); cv.width = 1000; cv.height = 600;
  const q = cv.getContext('2d', { willReadFrequently: true });
  const out = [];
  try {
    b.st = 'lurkpounce'; b.face = 1; b.faceVis = 1; b.leapDuration = 1; b.coverFade = 0; G.artProbe = true;
    for (let i = 0; i < n; i++) {
      b.anim = 10; b.leapT0 = 10 - (i + 0.5) / n;
      q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, 1000, 600);
      q.translate(500 - b.cx(), 450 - (b.y + b.h));
      b.draw(q);
      const d = q.getImageData(0, 0, 1000, 600).data;
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (let y = 0; y < 600; y += 2) for (let x = 0; x < 1000; x += 2) if (d[(y * 1000 + x) * 4 + 3] > 140) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      out.push(x1 < x0 ? null : [x0 - 500, x1 - 500, y0 - 450, y1 - 450]);
    }
  } finally { Object.assign(b, keep); G.artProbe = probe; }
  return out;
}
// THE AMBUSH, STEPPED (see NF_AMB). Ticked before the entities switch, which still
// runs gravity and moveEnt on him: the leaps are real arcs, and he lands on what is there.
function nfAmbPh(b) { return b.fury ? 2 : (b.phase === 2 ? 1 : 0); }
function nfAmbStep(b, dt, dist, adist) {
  const A = NF_AMB, ph = nfAmbPh(b), pc = player.x + player.w / 2;
  const turning = Math.abs((b.faceVis == null ? (b.face || 1) : b.faceVis) - (b.face || 1)) > 0.02;
  const cl = b.coverAt != null && typeof nfCoverList === 'function' ? nfCoverList()[b.coverAt] : null;
  if (!cl) { nfEnter(b, 'idle', NF_AMB.after); b.openIdle = false; b.coverHidT = 0; return; }
  b.ambT = (b.ambT || 0) + dt;
  // touched down: moveEnt stopped a fall since the last step (a guardian keeps no `on` flag)
  const landed = (b._ambVy || 0) > 0 && b.vy <= 0 && b.ambT > 0.08;
  b._ambVy = b.vy;
  if (b.st === 'coverwarn') {
    b.vx = 0;
    if (!turning) b.t -= dt;                    // the gather is counted from the end of the pivot
    if (chance(0.4)) addPart(b.cx() + rnd(-30, 30), b.y + b.h - 2, rnd(-30, 30), rnd(-90, -40), 0.3, '#b9a888', 2.2, 120, false);
    if (b.t <= 0) {
      // one low leap into the clump: the arc is solved for the distance, like the pounce's
      const dx = cl.x - b.cx(), up = Math.sqrt(2 * 2100 * A.inApex), air = 2 * up / 2100;
      b.face = Math.sign(dx) || b.face || 1;
      b.vx = dx / air; b.vy = -up; b.ambT = 0; b._ambVy = b.vy; b.leapT0 = b.anim || 0; b.leapDuration = air;
      nfEnter(b, 'coverin', air + 0.4);
      beastSound('leap');
      if (typeof nfCoverPart === 'function') nfCoverPart(cl, b.face, 0.5, air * 0.6);   // the leaves start to give as he comes
    }
  } else if (b.st === 'coverin') {
    b.t -= dt;
    const inside = Math.abs(b.cx() - cl.x) < 26;
    if (landed || b.t <= 0 || (inside && b.vy > 0)) {
      // in: the leaves close behind him and sway, and he is gone
      b.x = cl.x - b.w / 2; b.y = cl.gy - b.h; b.vx = 0; b.vy = 0;
      b.coverHidT = 0; b.coverFade = A.fade;
      if (typeof nfCoverPart === 'function') nfCoverPart(cl, b.face || 1, 1.0, 0);
      if (typeof nfCoverRustleSound === 'function') nfCoverRustleSound(0.8);
      nfEnter(b, 'lurk', ph === 2 ? A.lurk[0] : nfRand(A.lurk[0], A.lurk[1]));
    }
  } else if (b.st === 'lurk' || b.st === 'lurkwarn') {
    b.vx = 0; b.vy = 0; b.coverHidT = (b.coverHidT || 0) + dt;
    if (b.coverFade > 0) b.coverFade -= dt;
    b.t -= dt;
    if (b.st === 'lurk' && b.t <= 0) {
      // he goes where SHE is, unseen, and the clump nearest her is the one that shakes
      const L = nfCoverList();
      let k = 0;
      for (let i = 1; i < L.length; i++) if (Math.abs(L[i].x - pc) < Math.abs(L[k].x - pc)) k = i;
      const to = L[k];
      b.coverAt = k; b.x = to.x - b.w / 2; b.y = to.gy - b.h;
      b.face = Math.sign(pc - to.x) || b.face || 1; b.faceVis = b.face;
      b.tellAt = b.ambT;
      nfEnter(b, 'lurkwarn', A.tell[ph]);
      if (typeof nfCoverRustle === 'function') nfCoverRustle(to, A.tell[ph]);
    } else if (b.st === 'lurkwarn') {
      // the shaking: flecks off the leaves, louder as it builds (nfcover.js draws the leaves)
      const k = 1 - Math.max(0, b.t) / A.tell[ph];
      if (!G.artProbe && chance(0.35 + 0.5 * k)) addPart(cl.x + rnd(-cl.w * 0.4, cl.w * 0.4), cl.gy - cl.h * rnd(0.35, 0.9), rnd(-70, 70), rnd(-60, 10), rnd(0.35, 0.6), chance(0.5) ? '#7f9a86' : '#a9b4ad', rnd(1.8, 3), 380, false);
      if (b.t <= 0) {
        // OUT, at where she is now: low and fast, solved for her floor (a deck too)
        b.face = Math.sign(pc - cl.x) || b.face || 1; b.faceVis = b.face;
        const tx = cl.x + clamp(pc - cl.x, -A.reach, A.reach);
        const lx = bossLandClear(b, tx, player.on ? player.y + player.h : cl.gy) - b.w / 2;
        const rise = Math.max(0, (cl.gy) - (player.on ? player.y + player.h : cl.gy));
        const H = rise + A.apex[ph], up = Math.sqrt(2 * 2100 * H);
        const air = up / 2100 + Math.sqrt(2 * Math.max(0, H - rise) / 2100);
        b.vx = (lx + b.w / 2 - cl.x) / air; b.vy = -up; b.hitDone = false; b.coverHidT = 0;
        b.thruPlat = false; b.ambT = 0; b._ambVy = b.vy; b.burstAt = b.cx(); b.leapT0 = b.anim || 0; b.leapDuration = air;
        nfEnter(b, 'lurkpounce', air + 0.5);
        beastSound('leap'); cam.shake = Math.max(cam.shake, 6);
        if (typeof nfCoverBurst === 'function') nfCoverBurst(cl, b.face);
        if (typeof padRumble === 'function') padRumble(0.6, 0.45, 160);
      }
    }
  } else if (b.st === 'lurkpounce') {
    b.t -= dt;
    // the hurt is his drawn body in the air — the box the lion fills, claws forward
    const f = b.face || 1, box = nfBurstBox(b);
    if (!b.hitDone && aabb(box, player) && nfHurt(b, 'ambush')) {
      b.hitDone = true; G.hitStop = Math.max(G.hitStop, 0.08); cam.shake = Math.max(cam.shake, 6);
      burst(player.x + player.w / 2, player.y + player.h / 2, 12, '#f1dcff', 280, 0.3, 120, 3, true);
    }
    if (chance(0.6)) addPart(b.cx() - f * rnd(20, 60), b.y + rnd(4, b.h), -f * rnd(120, 260), rnd(-30, 30), 0.25, '#7f9a86', 2.2, 120, false);
    if (landed || b.t <= 0) {
      b.vx = 0;
      nfEnter(b, 'lurkland', A.land[ph]); b.landAt = b.anim || 0;
      beastSound('land'); cam.shake = Math.max(cam.shake, 5);
      for (let i = 0; i < 8; i++) addPart(b.cx() + rnd(-40, 40), b.y + b.h - 3, rnd(-160, 160), rnd(-120, -20), 0.4, '#b9a888', 3, 300, true);
    }
  } else if (b.st === 'lurkland') {
    b.vx = 0; b.t -= dt;
    if (b.t <= 0) { nfEnter(b, 'idle', A.after); b.openIdle = false; b.coverAt = null; b.swipeCD = Math.min(b.swipeCD || 0, A.after); }
  }
}
// ...and when it is chosen: on its own clock, which runs through the whole fight (the perch dive
// keeps the ambush clock it always had: entities.js ambushCD) — the first at 4-6 s, then every
// 8-11 s (6-9 in phase two), from a body that is free to choose and not in an opening
function nfAmbChoose(b, dist, adist) {
  if (typeof nfCoverList !== 'function') return false;
  const L = nfCoverList();
  if (!L.length || !(b.coverCD <= 0)) return false;
  if (!(b.st === 'stalk' || b.st === 'run' || (b.st === 'idle' && !b.openIdle && b.t <= 0))) return false;
  // the perch dive keeps its turn (nfChoose): with cover across the whole floor (2026-11-25) a clump
  // is always in reach, and the leaves would take every chance the dive's clock ever got
  if (b.ambushCD != null && b.ambushCD <= 0 && b.ambushCD > -1e8) return false;
  if (!b.nullUsed && b.hp <= b.hpMax * 0.5) return false;      // the null field goes first
  let k = 0;
  for (let i = 1; i < L.length; i++) if (Math.abs(L[i].x - b.cx()) < Math.abs(L[k].x - b.cx())) k = i;
  if (Math.abs(L[k].x - b.cx()) > NF_AMB.inMax) return false;
  b.coverAt = k;
  b.face = Math.sign(L[k].x - b.cx()) || b.face || 1;          // the turn to it is inside the gather
  b.coverCD = nfRand(NF_AMB.every[b.phase === 2 ? 1 : 0][0], NF_AMB.every[b.phase === 2 ? 1 : 0][1]);
  nfEnter(b, 'coverwarn', NF_AMB.warn); b.vx = 0; b.ambT = 0; b.turnStreak = 0; b.lastMove = 'ambush';
  return true;
}
// ...and what starts them, from a body that is free to choose
function nfChoose(b, pre, dist, adist) {
  const N = NF_DUEL, f = b.face || 1;
  const front = (Math.sign(dist) || f) === f;
  const turning = Math.abs((b.faceVis == null ? f : b.faceVis) - f) > 0.02;
  if (b.stagT > 0 || turning || b.breakRoar) return false;
  // greed: three blows turned on his hide, and he answers where they came from —
  // the bite for her in front, the rake for her behind (measured: blows from his
  // back ran the greed count up with nothing to answer it, and a bot that crossed
  // over him and cut his rump won 5 of 5 in 36 s)
  const freeNow = (b.st === 'idle' && !b.openIdle) || b.st === 'stalk' || b.st === 'run';
  if ((b.greed || 0) >= N.greedN && freeNow) {
    if (front && adist < 300) { b.greed = 0; nfEnter(b, 'bitewarn', N.biteTell); b.vx = 0; b.turnStreak = 0; b.lastMove = 'bite'; return true; }
    if (!front && adist < 160 && player.on) {
      b.greed = 0; b.face = Math.sign(dist) || -f;
      nfEnter(b, 'rakewarn', N.rake); b.vx = 0; b.rakeCD = N.rakeCD; b.turnStreak = 0; b.lastMove = 'rake'; return true;
    }
  }
  // THE PERCH DIVE, when its clock is due, goes before the leaves and the swipe: it is chosen in his
  // prowl (js/entities.js), so the prowl is let run this frame, or a free body is put into it
  // (only at her on her feet: at her in the air the dive lands under her, out of her reach)
  const diveDue = b.ambushCD != null && b.ambushCD <= 0 && b.ambushCD > -1e8 && (b.nullUsed || b.hp > b.hpMax * 0.5) && player.on;
  if (diveDue && (b.st === 'stalk' || b.st === 'run')) return false;
  if (diveDue && b.st === 'idle' && !b.openIdle && b.t <= 0.05) { b.st = 'stalk'; b.t = 0.02; return true; }
  // the leaves, on the ambush clock (NF_AMB)
  if (nfAmbChoose(b, dist, adist)) return true;
  // the rest after a move is the opening, and nothing cuts it short — not from
  // behind, not from far away, not from the air (tests/openings.cjs: a rear-up
  // fired out of the rest left 17 ms)
  const free = (b.st === 'idle' || b.st === 'stalk' || b.st === 'run') && !(!b.nullUsed && b.hp <= b.hpMax * 0.5);
  const rested = !(b.st === 'idle' && b.openIdle && b.t > 0);
  if (!free) return false;
  const above = player.y + player.h < b.y - 4 && adist < N.rearBox[0] + 20;
  if (rested && above && b.rearCD <= 0) { nfEnter(b, 'swatwarn', N.rear); b.vx = 0; b.rearCD = N.rearCD; b.turnStreak = 0; b.lastMove = 'swat'; return true; }
  if (rested && !front && adist < 140 && b.rakeCD <= 0 && player.on) {
    b.face = Math.sign(dist) || -f;      // the turn begins: the filmed turn is the tell
    nfEnter(b, 'rakewarn', N.rake); b.vx = 0; b.rakeCD = N.rakeCD; b.turnStreak = 0; b.lastMove = 'rake'; return true;
  }
  if (rested && front && adist > N.spitMin && b.spitCD <= 0 && b.st !== 'idle') {
    nfEnter(b, 'spitwarn', N.spit); b.vx = 0; b.lastMove = 'spit'; return true;
  }
  if (front && adist >= 130 && adist < N.swipeTrig && b.swipeCD <= 0 && (b.st !== 'idle' || b.t <= 0)) {
    nfEnter(b, 'swipewarn', TELL_SWIPE); b.vx = 0; b.lastMove = 'swipe'; b.turnStreak = 0;
    b.swipeCD = b.phase === 2 ? nfRand(0.7, 1.0) : nfRand(0.9, 1.3); b.lungeLeft = N.lunge;
    return true;
  }
  return false;
}
// THE LUNGE: the last 180 ms of the cock carries him into the blow — never
// through a rise, never into her
function nfLunge(b, dt, adist) {
  const N = NF_DUEL;
  if (b.st === 'swipewarn' && b.t <= 0.18 && b.lungeLeft == null) b.lungeLeft = N.lunge;
  if (!((b.st === 'swipewarn' && b.t <= 0.18) || (b.st === 'swipe' && !b.swiped)) || !(b.lungeLeft > 0)) return;
  const f = b.face || 1, room = Math.max(0, adist - N.lungeGap);
  const step = Math.min(b.lungeLeft, N.lunge / 0.24 * dt, room);
  const lead = f > 0 ? b.x + b.w + step : b.x - step;
  if (solidAt(Math.floor(lead / TILE), Math.floor((b.y + b.h - 8) / TILE)) || solidAt(Math.floor(lead / TILE), Math.floor((b.y + 8) / TILE))) { b.lungeLeft = 0; return; }
  b.x = clamp(b.x + f * step, 0, G.roomDef.w * TILE - b.w); b.lungeLeft -= step;
  if (!G.artProbe && chance(0.6)) addPart(b.cx() - f * rnd(20, 50), b.y + b.h - 3, -f * rnd(60, 160), rnd(-40, -8), 0.3, '#cdbd9c', rnd(2.5, 4), 160, false);
}
function nfDuelUpdate(U, b, dt) {
  const N = NF_DUEL;
  if (!b._nfInit) {
    b._nfInit = true;
    const k = N.hp / 220;                      // BSTAT.glitch.hp, which the NOSTOS boar still uses
    b.hp = Math.round(b.hp * k); b.hpMax = Math.round(b.hpMax * k);
    b.dazeAt = N.dazeAt; b.dazeWhole = true;
    b.spitCD = 3; b.rakeCD = 0; b.rearCD = 0;
    if (typeof bossVfxPrefetch === 'function') bossVfxPrefetch(['nf_shock', 'nf_bolt', 'nf_claw', 'nf_burst']);
  }
  const pc = player.x + player.w / 2, dist = pc - b.cx(), adist = Math.abs(dist);
  if (!b.dead) nfStepHazards(b, dt);
  b.spitCD -= dt; b.rakeCD -= dt; b.rearCD -= dt;
  if (b.coverCD == null) b.coverCD = nfRand(NF_AMB.first[0], NF_AMB.first[1]);
  if (!/^(cover|lurk)/.test(b.st)) b.coverCD -= dt;
  else if (b.ambushCD != null && b.ambushCD < 1e8) b.ambushCD -= dt;     // the dive's clock runs while he hides
  if (b.dead || b.purified || b.st === 'dorm' || b.st === 'intro' || b.hp <= 0) return U.call(b, dt);
  const pre = { phase: b.phase, fury: b.fury, st: b.st, t: b.t, roared: b.roared, on: b.on };
  // a break asked for by a blow into something he is doing is refused
  if (b.dazeReq && NF_ACT[b.st]) b.dazeReq = false;
  // greed: a blow that just landed on the hide
  if ((b.hurtT || 0) > (b._nfHurtT || 0) && b.hideK != null && b.hideK < 1) b.greed = (b.greed || 0) + 1;
  b._nfHurtT = b.hurtT || 0;
  if (NF_OWN[b.st] && !(b.stagT > 0)) nfOwnStep(b, dt, dist, adist);
  else if (!NF_OWN[b.st]) { nfChoose(b, pre, dist, adist); nfLunge(b, dt, adist); }
  const st0 = b.st;
  U.call(b, dt);
  if (b.st !== 'swipewarn' && b.st !== 'swipe') b.lungeLeft = null;
  // the hide: whole in the openings, turned while he acts or stands neutral
  if (b.st === 'idle' && st0 !== 'idle') b.openIdle = /swipe|recover|nullend|daze/.test(st0);
  b.hideK = NF_HID[b.st] ? 0 : (NF_ACT[b.st] || (b.st === 'idle' && !b.openIdle)) ? N.hide : 1;
  const ph = b.fury ? 3 : (b.phase || 1);
  const setT = (t) => { b.t = t; if (b._motionState === b.st) b._motionDuration = Math.max(0.05, t); };
  // the break: shorter, by phase
  if (b.st === 'daze' && st0 !== 'daze') { b.dazeDur = N.daze[ph - 1]; setT(b.dazeDur); }
  // the phase breaks: a short stagger, never stretching the state they land in
  if (pre.phase === 1 && b.phase === 2) { b.stagT = Math.min(b.stagT, N.midStag); if (st0 === b.st) b.t = pre.t - dt; }
  if (!pre.fury && b.fury) { b.stagT = Math.min(b.stagT, N.furyStag); if (st0 === b.st) b.t = pre.t - dt; }
  // greed, at the end of the swipe it was thrown into
  if (st0 === 'swipe' && b.st === 'idle' && (b.greed || 0) >= N.greedN && !(b.stagT > 0)) {
    if ((Math.sign(dist) || b.face) === b.face) { if (adist < 300) { b.greed = 0; nfEnter(b, 'bitewarn', N.biteTell); b.vx = 0; b.turnStreak = 0; b.lastMove = 'bite'; } }
    else if (adist < 160 && player.on) { b.greed = 0; b.face = Math.sign(dist) || -b.face; nfEnter(b, 'rakewarn', N.rake); b.vx = 0; b.rakeCD = N.rakeCD; b.turnStreak = 0; b.lastMove = 'rake'; }
  }
  // the shorter openings
  if (st0 === 'swipe' && b.st === 'idle') setT(b.fury ? nfRand(N.rest[0] * 0.85, N.rest[0]) : nfRand(N.rest[0], N.rest[1]));
  if ((st0 === 'pounce' || st0 === 'dive') && b.st === 'recover') setT(N.landRec[ph - 1]);
  if (st0 === 'recover' && b.st === 'idle') setT(nfRand(N.rest[0], N.rest[1]));
  if (st0 !== 'nullend' && b.st === 'nullend') setT(N.nullend);
  // the shocks: the roar's, and the landings'
  if (pre.st === 'roar' && !pre.roared && b.roared) nfShock(b, N.roarShock);
  if (st0 === 'pounce' && b.st !== 'pounce' && b.phase >= 2 && !(b.nullSeq > 0 && b.st === 'nullhop')) nfShock(b, N.landShock);
  if (st0 === 'dive' && b.st === 'recover') nfShock(b, N.landShock);
  // THE FURY CRACKS THE GROUND: every stride of the prowl leaves the floor alight under the paw
  if (b.fury && (b.st === 'stalk' || b.st === 'run') && b.on !== false) {
    b._nfStride = (b._nfStride || 0) + Math.abs(b.vx || 0) * dt;
    if (b._nfStride >= N.furyCrack) {
      b._nfStride = 0;
      if (typeof fx === 'function' && !G.artProbe)
        fx('cracks', b.cx() + (b.face || 1) * 54, b.y + b.h + 3, { rx: 72, ry: 16, dur: 1.5, col: '#8a3df0', hot: '#f1dcff', power: 1.1 });
    }
  }
}
// what the shocks and the bolts look like: light ON THE FLOOR and on the bolt,
// never on him
function nfDuelDraw(c, b) {
  if (G.artProbe || !nfDuelOn(b)) return;
  const t = b.anim || 0;
  // the floor shock: generated violet lightning crawling along the floor behind its front (the
  // strip's own crackle, js/bossvfx.js), and a flickering burst at the front the height of the hazard
  if (b.nfShocks) for (const s of b.nfShocks) {
    const k = clamp(1 - s.t / s.life, 0, 1) * 1.6, L = 150;
    drawBossVfxLoop(c, 'nf_shock', t + s.dir, s.x - s.dir * L * 0.5, s.y - 4, 44, s.dir < 0, 0, Math.min(1, k));
    drawBossVfxCell(c, 'nf_burst', 1 + ((t * 18) % 2), s.x, s.y - NF_DUEL.shockH * 0.5, NF_DUEL.shockH * 2.2, false, 0, Math.min(1, k) * 0.85);
  }
  // the null bolts: generated plasma, nose first along the arc
  if (b.nfOrbs) for (const o of b.nfOrbs) drawBossVfxLoop(c, 'nf_bolt', t + o.vx * 0.001, o.x, o.y, 34, false, Math.atan2(o.vy, o.vx), 1);
}
// the filmed takes the new states play (js/beast.js BEAST_STRIP — same keys,
// same anchors, so tests/lion-motion.cjs holds them as it holds the rest)
if (typeof BEAST_STRIP !== 'undefined') Object.assign(BEAST_STRIP, {
  // the rake's tell is the filmed TURN (beastTurnState); when the turn has
  // landed and the clock has not, the paw is cocked on the new side
  rakewarn: { key: 'beastStudioSwipe', cells: 24, k: 1, ax: 29.9, from: 10, to: 14 },
  rake:     { key: 'beastStudioSwipe', cells: 24, k: 1, ax: 29.9, from: 15, to: 23 },
  // (the SWAT — the paws up at her over his back — is not the phase-two REAR-UP, js/entities.js
  // rearwarn/rear/rearspent and its own filmed take, beastStudioRear: the two are separate moves)
  swatwarn: { key: 'beastStudioRoar', cells: 30, k: 1, ax: 3.1, from: 0, to: 7 },
  swat:     { key: 'beastStudioLeap', cells: 30, k: 1, ax: 25.7, from: 11, to: 14 },
  spitwarn: { key: 'beastStudioRoar', cells: 30, k: 1, ax: 3.1, from: 0, to: 19 },
  bitewarn: { key: 'beastStudioLeap', cells: 30, k: 1, ax: 25.7, from: 0, to: 10 },
  bite:     { key: 'beastStudioLeap', cells: 30, k: 1, ax: 25.7, from: 11, to: 18 },
  bitestop: { key: 'beastStudioLeap', cells: 30, k: 1, ax: 25.7, from: 24, to: 29, root: 1 },
  // the ambush from the leaves (NF_AMB): the leap's gather, its flight into the clump and out
  // of it, its landing. While he is hidden nothing is drawn; the rows are there for the clock
  coverwarn:  { key: 'beastStudioLeap', cells: 30, k: 1, ax: 25.7, from: 0, to: 10 },
  coverin:    { key: 'beastStudioLeap', cells: 30, k: 1, ax: 25.7, from: 11, to: 23, air: 1, root: 1 },
  lurk:       { key: 'beastStudioLeap', cells: 30, k: 1, ax: 25.7, from: 24, to: 29, root: 1 },
  lurkwarn:   { key: 'beastStudioLeap', cells: 30, k: 1, ax: 25.7, from: 4, to: 10 },
  lurkpounce: { key: 'beastStudioLeap', cells: 30, k: 1, ax: 25.7, from: 11, to: 23, air: 1, root: 1 },
  lurkland:   { key: 'beastStudioLeap', cells: 30, k: 1, ax: 25.7, from: 24, to: 29, root: 1 },
});
(function nfDuelInstall() {
  if (typeof Boss === 'undefined' || Boss.prototype.__nfDuel) return;
  Boss.prototype.__nfDuel = true;
  const U = Boss.prototype.update, D = Boss.prototype.draw;
  const update = function (dt) { return nfDuelOn(this) ? nfDuelUpdate(U, this, dt) : U.call(this, dt); };
  // tests/artbible.cjs reads the update's source to confirm a state name is
  // real: it sees the entities switch and this file's states both
  update.toString = () => U.toString() + '\n' + nfDuelUpdate.toString() + '\n' + nfOwnStep.toString() + '\n' + nfChoose.toString() + '\n' + nfAmbStep.toString();
  Boss.prototype.update = update;
  Boss.prototype.draw = function (c2, ...rest) {
    // in the leaves he is not there to draw: the clump shows where he is, or nothing does
    if (nfHidden(this) && !(this.coverFade > 0)) { try { nfDuelDraw(c2, this); } catch (_) {} return; }
    if (nfHidden(this)) {
      // ...and the moment he goes in, the body goes DOWN into the leaves rather than blinking out
      // or fading (the owner, 2026-11-25: the leaves are "not faded" objects, and nor is he): his
      // landing crouch drops below the clump's leaves, flattening as it goes, cut at the ground he
      // is standing on, so what is left of him at the end is behind the leaves and under the grass
      const cl = this.coverAt != null && typeof nfCoverList === 'function' ? nfCoverList()[this.coverAt] : null;
      const k = clamp(1 - this.coverFade / NF_AMB.fade, 0, 1), e = k * k * (3 - 2 * k), foot = this.y + this.h;
      c2.save();
      c2.beginPath(); c2.rect(this.x - 400, (cl ? cl.gy : foot) - 1200, this.w + 800, 1200 + 2); c2.clip();
      c2.translate(this.cx(), foot); c2.scale(1, 1 - 0.35 * e); c2.translate(-this.cx(), -foot + this.h * 0.95 * e);
      try { D.call(this, c2, ...rest); } finally { c2.restore(); }
      try { nfDuelDraw(c2, this); } catch (_) {}
      return;
    }
    const out = D.call(this, c2, ...rest);
    try { nfDuelDraw(c2, this); } catch (_) {}
    return out;
  };
})();
