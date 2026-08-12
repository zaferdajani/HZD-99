// ===========================================================================
// THE BRAID — CLAWBYTE's multiverse.
//
// THE PROBLEM. "Every choice creates a new pathway" sounds like it means
// storing a tree of worlds. It cannot: three options at every kill and every
// rest means the number of reachable worlds passes a billion inside twenty
// minutes of play. No save file holds that, and no author writes it.
//
// THE ANSWER. You do not store a multiverse. You DERIVE one.
//
// Everything the player does appends one character to a LEDGER — a short
// string. That ledger is the only thing on disk. A universe is a pure function
// of it, computed fresh whenever it is needed:
//
//        ledger  ──hash──▶  seed  ──generator──▶  the world you are standing in
//
// Storage is constant. The number of universes is not bounded at all. The same
// ledger always rebuilds the same universe, on any device, forever — so a world
// can be written down as a six-character code and handed to somebody else.
//
// Two channels of consequence run out of the same ledger, and the game needs
// both to feel fair:
//
//   TALLY  — how many times you chose mercy, severance or the Signal. Smooth,
//            directional, legible. This drives infection, tone, aggression.
//            It is how the player learns that their choices point somewhere.
//   HASH   — the exact ORDER of those choices, avalanched into 32 bits. Sharp,
//            discrete, unrepeatable. This drives the ANOMALIES: the named
//            physical laws that make one world not another.
//
// Tally alone would make every world a slider. Hash alone would make choices
// feel arbitrary. Together: the direction is yours, the destination is unique.
// ===========================================================================

// LEFT = mercy, RIGHT = severance, RED = the Signal's own offer
const BR_PICKS = ['L', 'R', 'X'];
const BR_ZONES = ['A', 'B', 'C', 'D', 'E', 'X'];
// How much louder each step echoes than the one after it. This single number IS
// the butterfly effect: at 1.10 over a 24-choice run, the first decision carries
// about nine times the weight of the most recent one.
const BR_ECHO = 1.10;

// Every anomaly must DO something. A world modifier that is only a word on a
// screen is set dressing; these each change how the room plays.
const BR_ANOM = {
  bloom:    { n: 'BLOOM',    d: 'The rot flowers. Faster machines, richer scrap.' },
  hollow:   { n: 'HOLLOW',   d: 'Half the factory never woke. Fewer foes, sharper minds.' },
  starless: { n: 'STARLESS', d: 'The ceiling lights failed. You carry the only glow.' },
  frost:    { n: 'FROST',    d: 'Coolant flooded everything. Slow, heavy, brittle.' },
  fracture: { n: 'FRACTURE', d: 'The rock never set. More of it is loose than looks it.' },
  dense:    { n: 'DENSE',    d: 'Gravity runs high. You fall harder and hit harder.' },
  choir:    { n: 'CHOIR',    d: 'They hear each other die. The dead call the living.' },
  clement:  { n: 'CLEMENT',  d: 'Something here remembers being built to help.' },
};
const BR_ANOM_KEYS = Object.keys(BR_ANOM);

function braid() {
  if (!G.save) return null;
  if (!G.save.braid) {
    G.save.braid = {
      led: '',                       // the CHOICES — only what you were asked
      trail: '',                     // where you fought, one letter per machine
      tally: { L: 0, R: 0, X: 0 },
      nodes: [],                     // divergences worth drawing on the chart
      seen: {},                      // universe ids this player has stood in
      kills: 0, forks: 0,
    };
  }
  const b = G.save.braid;
  if (!b.tally) b.tally = { L: 0, R: 0, X: 0 };
  if (!b.nodes) b.nodes = [];
  if (!b.seen) b.seen = {};
  if (b.trail == null) b.trail = '';
  return b;
}

// FNV-1a, then an avalanche. Cheap, and one different character anywhere in the
// ledger has to move every output bit or neighbouring worlds come out samey.
function brHash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x846ca68b) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}
// a small deterministic stream off one seed, so every derived value is stable
function brRng(seed) {
  let s = (seed || 1) >>> 0;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
function brId(seed) {
  return 'U-' + seed.toString(36).toUpperCase().padStart(6, '0').slice(-6);
}

// ---------------------------------------------------------------------------
// THE GENERATOR. Pure: ledger in, world out. No randomness that is not seeded,
// no reads of live game state — which is what makes a universe reproducible
// from its code alone.
// ---------------------------------------------------------------------------
let brCache = { key: null, u: null };
function universe() {
  const b = braid(); if (!b) return brDefaultUniverse();
  // TWO INPUTS, TWO JOBS. The ledger is only what you were ASKED — a handful of
  // guardian forks — and it alone sets the world's DIRECTION, so one act of
  // mercy is never drowned out by forty machines you cleared on the way. The
  // trail is everywhere you fought, and it only perturbs the HASH: it decides
  // which world you got, not which way it leans.
  const key = b.led + '#' + b.trail;
  if (brCache.key === key) return brCache.u;
  const seed = brHash('clawbyte/' + key);
  const R = brRng(seed);
  const total = Math.max(1, b.tally.L + b.tally.R + b.tally.X);
  const mercy = b.tally.L / total, sever = b.tally.R / total, red = b.tally.X / total;

  // EVERYONE IS INFECTED. That is the starting condition of the whole story: the
  // ledger opens at 1.0 in every kingdom.
  //
  // THE BUTTERFLY. This used to be a tally — count the mercies, divide by the
  // total. Measured, that turned out NOT to be a butterfly effect at all: an
  // early choice moved the world exactly as much as the most recent one, because
  // normalising by the total means an old choice's share only ever shrinks. That
  // is chaos with no memory, and advertising it as a butterfly effect would have
  // been a lie.
  //
  // A first attempt simulated this step-by-step with a logistic spread term. It
  // measured WORSE: the attractor and the 0..1 clamp pull two diverged histories
  // back together, so the model was contractive — late choices ended up mattering
  // more than early ones, the exact opposite of the claim.
  //
  // What compounding actually means here is that a cure applied before the rot
  // has spread saves everything downstream of it, and one applied at the end
  // saves nothing. So each choice is weighted by how much history it got to act
  // on: BR_ECHO^(steps that came after it). The first decision of a run carries
  // roughly nine times the weight of the most recent one — which is a real,
  // measurable sensitive dependence on initial conditions rather than an assertion.
  const inf = {};
  const n = b.led.length;
  let wsum = 0, cure = 0, feed = 0;
  for (let k = 0; k < n; k++) {
    const w = Math.pow(BR_ECHO, n - 1 - k);
    wsum += w;
    const ch = b.led[k];
    if (ch === 'L') cure += w;
    else if (ch === 'X') feed += w * 1.2;
    else feed += w * 0.14;
  }
  const cureF = wsum ? cure / wsum : 0, feedF = wsum ? feed / wsum : 0;
  // cureF and feedF are FRACTIONS of the weighted ledger, so on the very first
  // choice one of them is necessarily 1.0 — and a simulated playthrough caught
  // exactly what that meant: a single act of mercy cured all six kingdoms and
  // turned every machine in the game peaceful, at which point there was no game
  // left. The fractions still say WHICH WAY the world is going; REACH says how
  // far it has been able to travel yet. A world has to be worked on.
  const reach = n / (n + 45);
  for (let i = 0; i < BR_ZONES.length; i++) {
    const z = BR_ZONES[i];
    // each kingdom answers at its own rate, so curing the world is never one
    // uniform slider and the map never reads as a single number repeated six times
    const bias = 0.72 + R() * 0.62;
    inf[z] = clamp(1 - cureF * bias * 1.6 * reach + feedF * 0.85 * reach, 0, 1);
  }

  // Boss disposition. A guardian you never met in this world may already be
  // free in it, or may have been taken further under.
  const boss = {};
  const KINDS = ['glitch', 'brood', 'zero', 'atlas', 'prism'];
  for (const k of KINDS) {
    const r = R();
    boss[k] = red > 0.45 && r < red * 0.7 ? 'ascended'
      : mercy > 0.4 && r < mercy * 0.5 ? 'freed'
      : 'infected';
  }

  // Anomalies come off the HASH, not the tally: this is the part of a world
  // that is yours alone rather than a consequence of your morals.
  const anom = [];
  const nA = 1 + (seed % 3);
  const pool = BR_ANOM_KEYS.slice();
  for (let i = 0; i < nA && pool.length; i++) {
    const j = Math.floor(R() * pool.length);
    anom.push(pool.splice(j, 1)[0]);
  }
  // the ledger's own drift can force a law on top of the roll
  if (red > 0.55 && anom.indexOf('bloom') < 0) anom.push('bloom');
  if (mercy > 0.6 && anom.indexOf('clement') < 0) anom.push('clement');

  const has = (a) => anom.indexOf(a) >= 0;
  const u = {
    id: brId(seed), seed, led: b.led, depth: b.led.length,
    mercy, sever, red, inf, boss, anom,
    // world laws, all read live by the systems that care
    foeK: (has('hollow') ? 0.55 : 1) * (has('bloom') ? 1.25 : 1),
    spdK: (has('frost') ? 0.78 : 1) * (has('bloom') ? 1.16 : 1),
    lootK: (has('bloom') ? 1.5 : 1) * (has('hollow') ? 1.25 : 1) * (1 + sever * 0.4),
    gravK: has('dense') ? 1.16 : 1,
    darkK: has('starless') ? 1 : 0,
    secretK: has('fracture') ? 1 : 0,
    callK: has('choir') ? 1 : 0,
    calmK: has('clement') ? 0.3 : 0,      // extra chance a machine wakes peaceful
  };
  brCache = { key, u };
  return u;
}
function brDefaultUniverse() {
  const inf = {}; for (const z of BR_ZONES) inf[z] = 1;
  return {
    id: 'U-000000', seed: 0, led: '', depth: 0, mercy: 0, sever: 0, red: 0,
    inf, boss: {}, anom: [], foeK: 1, spdK: 1, lootK: 1, gravK: 1,
    darkK: 0, secretK: 0, callK: 0, calmK: 0,
  };
}

// how infected the room she is standing in is, 0..1
function brInf() {
  const u = universe();
  return (u.inf && G.roomDef && u.inf[G.roomDef.zone] != null) ? u.inf[G.roomDef.zone] : 1;
}
function brHas(a) { return universe().anom.indexOf(a) >= 0; }

// ---------------------------------------------------------------------------
// RECORDING A CHOICE. One character on the ledger. Everything else follows.
// ---------------------------------------------------------------------------
function brRecord(pick, kind, room) {
  const b = braid(); if (!b) return;
  const before = universe();
  b.led += pick;
  b.tally[pick] = (b.tally[pick] || 0) + 1;
  b.forks++;
  b.nodes.push({ p: pick, k: kind, r: room || G.roomId, d: b.led.length });
  if (b.nodes.length > 220) b.nodes.shift();
  brCache.key = null;                       // the world has changed underneath us
  const after = universe();
  b.seen[after.id] = 1;
  if (typeof persist === 'function') persist();

  // PROVE IT, EVERY TIME. A game can claim that choices matter, or it can show
  // the reader the diff. This is the diff: what that single press actually did
  // to the world, in the numbers the world is actually built from. It is also
  // the honesty check on the whole feature — if this readout were ever empty,
  // the claim would be false, and the player would see that immediately.
  const dInf = (avg(after.inf) - avg(before.inf));
  const gained = after.anom.filter(a => before.anom.indexOf(a) < 0);
  const lost = before.anom.filter(a => after.anom.indexOf(a) < 0);
  G.brDelta = {
    t: 4.2, t0: 4.2, id: after.id, dInf,
    gained, lost,
    echo: Math.pow(BR_ECHO, Math.max(0, 24 - b.led.length)),
    first: b.led.length === 1,
  };
  function avg(o) { let s = 0, n2 = 0; for (const k in o) { s += o[k]; n2++; } return n2 ? s / n2 : 0; }
  // No toast: the readout above already names the world and says what changed,
  // and two banners fighting for the same moment is how a good beat gets lost.
  return after;
}
// A MACHINE DIES AND IS NOT DISCUSSED.
//
// Every kill used to raise a three-way ribbon. Forty of those in a run is not a
// moral system, it is a nag — and asking the same question over a spike-crawler
// that you asked over a guardian is what made the guardian's question cheap. So
// an ordinary kill is now recorded and never mentioned: it leaves a mark on the
// trail, which perturbs the world you are in without pretending you deliberated
// over it. The question is reserved for the only creatures big enough to ask it.
function brKill(room) {
  const b = braid(); if (!b) return;
  b.kills++;
  const z = (G.roomDef && G.roomDef.zone) || (room || 'A')[0] || 'A';
  b.trail += z;
  if (b.trail.length > 160) b.trail = b.trail.slice(-160);
  brCache.key = null;
}
// the readout itself, top-centre, in screen space
function drawBrDelta() {
  const d = G.brDelta; if (!d || d.t <= 0) return;
  const k = clamp(d.t / 0.6, 0, 1) * clamp((d.t0 - d.t) / 0.25, 0, 1);
  c.save();
  c.globalAlpha = k;
  const lines = [];
  if (Math.abs(d.dInf) >= 0.002) {
    const up = d.dInf > 0;
    lines.push({ s: t('br_d_inf').replace('%s', (up ? '+' : '−') + Math.round(Math.abs(d.dInf) * 100) + '%'),
                 col: up ? '#ff8fa0' : '#7de8a0' });
  }
  for (const a of d.gained) lines.push({ s: t('br_d_law').replace('%s', BR_ANOM[a].n), col: '#aef7d8' });
  for (const a of d.lost) lines.push({ s: t('br_d_gone').replace('%s', BR_ANOM[a].n), col: '#7d93a8' });
  if (!lines.length) lines.push({ s: t('br_d_none'), col: '#7d93a8' });
  const w = 330, h = 26 + lines.length * 17;
  // low and centre: the room name owns the top of the screen, and this has to be
  // readable at a glance without ever fighting it
  const x = 480 - w / 2, y = 372;
  c.fillStyle = 'rgba(5,9,15,0.95)'; rr(c, x, y, w, h, 8); c.fill();
  c.strokeStyle = 'rgba(120,200,230,0.35)'; c.lineWidth = 1.2; rr(c, x, y, w, h, 8); c.stroke();
  ftxt(d.id, 480, y + 14, 12, '#cfe8ff', 'center');
  lines.forEach((ln, i) => ftxt(ln.s, 480, y + 32 + i * 17, 12, ln.col, 'center'));
  c.restore();
}

// ---------------------------------------------------------------------------
// THE OFFER. One question, asked only by the creatures worth asking.
//
// It used to fire on every kill and every campfire, and that was the mistake:
// a question repeated forty times a run stops being a question. Now the blow
// that would kill a guardian brings it to its knees instead, and the fight
// stops on exactly one fork — spare it, or end it. Nothing else in the game
// interrupts you to ask anything.
// ---------------------------------------------------------------------------
function brOffer(kind, x, y) {
  if (!G.save || (typeof isHero === 'function' && isHero())) return;
  G.offer = { kind, t: 9e9, t0: 9e9, x: x || 0, y: y || 0, done: false };
  G.state = 'OFFER';
}

// NOBODY KNOWS WHICH IS BETTER, AND THAT IS THE POINT.
//
// If mercy always paid, mercy would not be a choice — it would be the correct
// answer with a delay on it. So what a guardian leaves behind is drawn from the
// world itself: the same ledger that made this universe decides whether sparing
// this one enriches you or whether ending it does. It is fixed for a given world
// (the same code always plays the same), and unknowable before you commit. Some
// runs will teach you that mercy pays. Those runs are lying to you.
const BR_SPOIL = ['core', 'scrap', 'iq', 'slot'];
function bossSpoil(kind, pick) {
  if (!G.save) return null;
  const R = brRng(brHash('spoil/' + braid().led + '/' + kind + '/' + pick));
  R(); R();                                  // warm the stream off the raw seed
  const g = BR_SPOIL[Math.floor(R() * BR_SPOIL.length) % BR_SPOIL.length];
  // mercy leaves a living creature that keeps giving; severance leaves salvage.
  // The KIND of gift tilts, the SIZE does not — neither answer is the rich one.
  const big = R() < 0.5;
  if (g === 'core') {
    G.save.coresMax = (G.save.coresMax || 4) + 1;
    if (player) player.cores = player.maxCores();
  } else if (g === 'scrap') {
    G.save.scrap = (G.save.scrap || 0) + (big ? 220 : 140);
  } else if (g === 'iq') {
    G.save.iq = (G.save.iq || 0) + (big ? 6 : 4);
  } else {
    G.save.slots = Math.min(6, (G.save.slots || 3) + 1);
  }
  return { name: t('sp_' + g), desc: t('sp_' + g + '_d') };
}
// Announcements wait for the world to be ready for them. A guardian's answer
// runs a film, or a scripted finishing blow, or a collapse — opening a dialog
// on top of any of those eats the moment. This queue holds the card until the
// game is actually back in the player's hands.
function spoilLater(sp) {
  if (sp) G.spoilQ = { name: sp.name, desc: sp.desc, t: 0.7 };
}
function updateSpoilQ(dt) {
  const q = G.spoilQ; if (!q) return;
  if (G.state !== 'PLAY' || G.finish || G.dialog) return;
  q.t -= dt;
  if (q.t <= 0) { G.spoilQ = null; if (typeof showItem === 'function') showItem(q.name, q.desc); }
}

function brAnswer(pick) {
  const o = G.offer; if (!o || o.done) return;
  o.done = true;
  const u = brRecord(pick, o.kind, G.roomId);
  if (typeof sfx === 'function') sfx(pick === 'L' ? 'powerUp' : 'ui');
  // THE GUARDIAN'S FORK. The first one hands over authored gifts, because it is
  // the moment the game teaches the rule; every one after it pays out of the
  // world. Either way the answer is the last input of the fight — choosing to
  // end it does not mean swinging again, it means the game swings for you.
  if (G.forkBoss) {
    const b2 = G.forkBoss; G.forkBoss = null;
    const first = o.kind === 'firstboss';
    if (pick === 'L') {
      b2.hp = 0; b2.tamed = true;
      b2.die();                                  // the purification film: it lives
      if (first) { G.save.flags.oath = 1; spoilLater({ name: t('oath_name'), desc: t('oath_desc') }); }
      else spoilLater(bossSpoil(b2.kind, 'L'));
    } else {
      b2.hp = 0; b2.forceKill = true;
      // remembered, so the room never re-spawns it as a pet on the way back
      G.save.flags.killed = G.save.flags.killed || {};
      G.save.flags.killed[b2.kind] = 1;
      if (first) G.save.flags.resolve = 1;
      const sp = first ? { name: t('resolve_name'), desc: t('resolve_desc') } : bossSpoil(b2.kind, 'R');
      startFinisher(b2, sp);                     // she closes the distance herself
    }
  }
  if (G.state === 'OFFER') G.state = 'PLAY';
  G.offer = null;
  return u;
}

// ---------------------------------------------------------------------------
// THE LAST BLOW IS NOT YOURS TO SWING.
//
// Choosing to end a guardian used to leave it standing there at zero, waiting
// for you to walk over and press attack one more time — which turns a decision
// into a chore and, worse, lets a fumbled input undercut the most deliberate
// moment in the game. The choice IS the input. The game closes the distance and
// lands the blow, and it lands cleanly every time.
// ---------------------------------------------------------------------------
const FIN_STEP = 0.36, FIN_HOLD = 0.9;
function startFinisher(b, spoil) {
  if (!b || typeof player === 'undefined' || !player) { if (b) b.die(); spoilLater(spoil); return; }
  const side = (player.x + player.w / 2) < b.cx() ? -1 : 1;
  G.finish = {
    b, spoil, t: 0, hit: false, x0: player.x, y0: player.y,
    tx: b.cx() + side * (b.w / 2 + 22) - player.w / 2,
    ty: b.y + b.h - player.h, face: -side,
  };
  player.vx = 0; player.vy = 0; player.swing = null; player.atkBuf = 0;
  if (typeof cam !== 'undefined') cam.shake = Math.max(cam.shake, 3);
}
function updateFinisher(dt) {
  const f = G.finish; if (!f) return;
  f.t += dt;
  const b = f.b;
  if (f.t < FIN_STEP) {
    // the step in — eased, so it reads as a decision rather than a teleport
    const k = f.t / FIN_STEP, e = k * k * (3 - 2 * k);
    player.x = f.x0 + (f.tx - f.x0) * e;
    player.y = f.y0 + (f.ty - f.y0) * e;
    player.face = f.face;
    if (chance(0.6)) addPart(player.x + player.w / 2, player.y + player.h - 2,
      -f.face * rnd(40, 110), rnd(-40, -6), 0.3, '#8fa3b5', 2, 500);
    return;
  }
  if (!f.hit) {
    f.hit = true;
    // the heavy end of the combo, swung by the game
    player.face = f.face;
    player.combo = 2; player.comboT = 0.9;
    player.swingVis = { t: 0.3, t0: 0.3, ang: f.face > 0 ? 0 : Math.PI, combo: 2 };
    if (typeof sfx === 'function') { sfx('swing'); sfx('boom'); }
    G.hitStop = Math.max(G.hitStop || 0, 0.26);
    G.flash = Math.max(G.flash || 0, 0.8);
    if (typeof cam !== 'undefined') cam.shake = Math.max(cam.shake, 14);
    if (typeof padRumble === 'function') padRumble(1, 0.9, 700);
    if (typeof burst === 'function') burst(b.cx(), b.cy(), 34, '#ffffff', 380, 0.9, 160, 4, true);
    if (!b.dead) b.die();
    return;
  }
  if (f.t > FIN_STEP + FIN_HOLD) { G.finish = null; spoilLater(f.spoil); }
}
// the readout runs on the real clock, not on how fast the machine happens to draw
function updateBrDelta(dt) {
  const d = G.brDelta; if (!d) return;
  d.t -= dt; if (d.t <= 0) G.brDelta = null;
}
// NO STRAY KEY DECIDES THIS. There is nothing left in the game that interrupts
// you to ask a question, so the one that does gets to insist on a real answer:
// every fork now decides whether a creature lives, and letting Esc resolve it
// would end one by accident. Two doors, both reachable by key and by thumb —
// refusing to auto-answer costs nothing and cannot strand anyone.
function updateOffer(dt) {
  if (!G.offer) return;
  if (inP('LEFT')) return brAnswer('L');
  if (inP('RIGHT')) return brAnswer('R');
}
// ---------------------------------------------------------------------------
// ONE geometry, shared by the drawing and the hit-test. They were separate, and
// the result was an offer that could be READ on a phone but never ANSWERED:
// the touch layer had no case for this state, so a tap sent OK, which nothing
// here was listening for — and a fork has no timeout, so the player was simply
// stuck looking at it. Anything drawn as a button has to be pressable by
// whatever the player actually has in their hands.
//
// Two doors, the same two every time. A guardian is spared or it is ended;
// there is no third thing to do with something that has knelt in front of you.
// ---------------------------------------------------------------------------
function offerOpts() {
  return [
    { p: 'L', key: '\u25c0', col: '#7de8a0', lab: t('fb_tame'), d: 'fb_tame_d' },
    { p: 'R', key: '\u25b6', col: '#ffd76a', lab: t('fb_beat'), d: 'fb_beat_d' },
  ];
}
// ---------------------------------------------------------------------------
// THE CHOICE, WITHOUT WORDS. This is the one question the whole game turns on,
// and until now it was two lines of English text. A child who cannot read the
// label still has to be able to tell "let it live" from "finish it", so each
// door carries a drawn sign: an open paw laid over a heart, or a claw striking
// through. The words stay for everyone else.
// ---------------------------------------------------------------------------
function offerIcon(x, y, s, kind, col) {
  c.save();
  c.translate(x, y); c.scale(s, s);
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (kind === 'L') {
    // a heart, with a paw print set into it — mercy, and whose mercy it is
    c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 10;
    c.beginPath();
    c.moveTo(0, 9);
    c.bezierCurveTo(-11, 1, -10, -8, -4.6, -8);
    c.bezierCurveTo(-1.4, -8, 0, -5.2, 0, -5.2);
    c.bezierCurveTo(0, -5.2, 1.4, -8, 4.6, -8);
    c.bezierCurveTo(10, -8, 11, 1, 0, 9);
    c.closePath(); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = 'rgba(8,16,14,0.85)';                       // the pad
    c.beginPath(); c.ellipse(0, 1.4, 3.1, 2.5, 0, 0, 7); c.fill();
    for (let k = -1; k <= 1; k++) {                            // three toes
      c.beginPath(); c.ellipse(k * 2.7, -2.9, 1.15, 1.5, k * 0.4, 0, 7); c.fill();
    }
  } else {
    // three claw strokes cutting down through the frame
    c.shadowColor = col; c.shadowBlur = 10;
    for (let k = -1; k <= 1; k++) {
      const o = k * 4.4, L = 9 - Math.abs(k) * 1.2;
      c.strokeStyle = col; c.lineWidth = 2.6 - Math.abs(k) * 0.6;
      c.beginPath();
      c.moveTo(-L + o, -L - 1);
      c.quadraticCurveTo(o * 0.4, 0, L * 0.8 + o, L + 1);
      c.stroke();
    }
    c.shadowBlur = 0;
  }
  c.restore();
}
function offerBoxes() {
  if (!G.offer) return [];
  const opts = offerOpts();
  const w = 250, h = 104, gap = 18;
  const bx = 480, by = 336;
  return opts.map((op, i) => ({
    op, w, h,
    x: bx + (i - (opts.length - 1) / 2) * (w + gap), y: by,
  }));
}
// a tap or a click, in 960x540 screen space
function offerTap(sx, sy) {
  const o = G.offer; if (!o || o.done) return false;
  for (const b of offerBoxes()) {
    // generous on a phone: the pad extends the target without moving the art
    if (Math.abs(sx - b.x) <= b.w / 2 + 10 && Math.abs(sy - b.y) <= b.h / 2 + 12) {
      brAnswer(b.op.p);
      return true;
    }
  }
  return false;
}
// the fork, over the frozen room, with the kneeling guardian still visible
function drawOffer() {
  const o = G.offer; if (!o) return;
  c.save();
  c.fillStyle = 'rgba(4,7,12,0.82)'; c.fillRect(0, 0, 960, 540);
  ftxt(t(o.kind === 'firstboss' ? 'fb_title' : 'br_boss'), 480, 116, 22, '#eef3fa', 'center', '#37ffd0');
  ftxt(universe().id + '  ·  ' + t('br_depth').replace('%s', universe().depth), 480, 146, 13, '#7d93a8', 'center');
  // THE PREMISE, SAID ONCE, IN THE GAME. The very first time she is asked, the
  // game states the rule outright rather than hoping the player infers it: the
  // story is fixed, the world is not, and what you do first echoes loudest.
  // Every readout after this is evidence for that sentence.
  if (braid().led.length === 0) {
    const bw = 660, bh = 90, bx0 = 480 - bw / 2, by0 = 176;
    c.fillStyle = 'rgba(6,11,18,0.9)'; rr(c, bx0, by0, bw, bh, 10); c.fill();
    c.strokeStyle = 'rgba(120,220,255,0.45)'; c.lineWidth = 1.5;
    rr(c, bx0, by0, bw, bh, 10); c.stroke();
    ftxt(t('br_prime1'), 480, by0 + 24, 15, '#eef3fa', 'center');
    ftxt(t('br_prime2'), 480, by0 + 47, 12.5, '#9fd8e8', 'center');
    ftxt(t('br_prime3'), 480, by0 + 68, 12.5, '#ffd76a', 'center');
  }
  for (const b of offerBoxes()) {
    const op = b.op, ox = b.x, oy = b.y, w = b.w, h = b.h;
    c.fillStyle = 'rgba(8,14,22,0.9)';
    rr(c, ox - w / 2, oy - h / 2, w, h, 8); c.fill();
    c.strokeStyle = op.col; c.lineWidth = 2;
    rr(c, ox - w / 2, oy - h / 2, w, h, 8); c.stroke();
    offerIcon(ox, oy - 26, 1.55, op.p, op.col);
    ftxt(op.key + '  ' + op.lab, ox, oy + 18, 17, op.col, 'center');
    ftxt(t(op.d), ox, oy + 40, 11, '#8aa2b5', 'center');
  }
  // SAY HOW TO ANSWER. The fork has no timer and stops the world, so if the way
  // in is not obvious it reads as a trap rather than a choice.
  const touchy = typeof TOUCH !== 'undefined' && TOUCH && TOUCH.enabled;
  ftxt(t(touchy ? 'br_pick_ft' : 'br_pick_fk'), 480, 424, 12.5, '#7d93a8', 'center');
  c.restore();
}

// ---------------------------------------------------------------------------
// THE CHART. Your own tree of worlds, drawn as a braid: mercy bends one way,
// severance the other, the Signal drops straight down.
// ---------------------------------------------------------------------------
const braidView = { z: 1, x: 0, y: 0, ready: false, drag: null };
function brLayout() {
  const b = braid(); if (!b) return [];
  const pts = [{ x: 0, y: 0, p: null, k: 'root', r: '', d: 0 }];
  let x = 0, y = 0;
  for (const n of b.nodes) {
    x += n.p === 'L' ? -46 : n.p === 'R' ? 46 : 0;
    y += n.p === 'X' ? 66 : 52;
    pts.push({ x, y, p: n.p, k: n.k, r: n.r, d: n.d });
  }
  return pts;
}
function brOpen() {
  braidView.z = 1; braidView.ready = true; braidView.drag = null;
  const pts = brLayout(), last = pts[pts.length - 1];
  braidView.x = 480 - last.x; braidView.y = 300 - last.y;
}
function updateBraidView(dt) {
  if (!braidView.ready) brOpen();
  const sp = 560 * dt;
  if (inD('LEFT')) braidView.x += sp;
  if (inD('RIGHT')) braidView.x -= sp;
  if (inD('UP')) braidView.y += sp;
  if (inD('DOWN')) braidView.y -= sp;
  if (inD('JUMP')) braidView.z = clamp(braidView.z * (1 + 1.8 * dt), 0.35, 3);
  if (inD('ATK')) braidView.z = clamp(braidView.z * (1 - 1.6 * dt), 0.35, 3);
  if (inP('INT')) brOpen();
}
function drawBraidView() {
  if (!braidView.ready) brOpen();
  const u = universe(), b = braid();
  c.fillStyle = 'rgba(4,7,12,0.94)'; c.fillRect(0, 0, 960, 540);
  ftxt(t('br_title'), 480, 36, 24, '#eef3fa', 'center', '#37ffd0');
  c.save();
  c.beginPath(); c.rect(0, 52, 960, 400); c.clip();
  c.translate(braidView.x, braidView.y); c.scale(braidView.z, braidView.z);
  const pts = brLayout();
  c.lineWidth = 2.4;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], p = pts[i];
    c.strokeStyle = p.p === 'L' ? 'rgba(125,232,160,0.75)' : p.p === 'X' ? 'rgba(255,90,106,0.8)' : 'rgba(255,215,106,0.7)';
    c.beginPath(); c.moveTo(a.x, a.y);
    c.bezierCurveTo(a.x, a.y + 24, p.x, p.y - 24, p.x, p.y); c.stroke();
  }
  pts.forEach((p, i) => {
    const cur = i === pts.length - 1;
    c.fillStyle = p.p === 'L' ? '#7de8a0' : p.p === 'X' ? '#ff5a6a' : p.p === 'R' ? '#ffd76a' : '#cfe8ff';
    c.beginPath(); c.arc(p.x, p.y, cur ? 8 : 4.5, 0, 7); c.fill();
    if (cur) {
      c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 2;
      c.beginPath(); c.arc(p.x, p.y, 13, 0, 7); c.stroke();
    }
    if (p.k === 'boss') { c.fillStyle = '#ffffff'; c.fillRect(p.x - 2, p.y - 14, 4, 4); }
  });
  c.restore();
  // the world this path built
  dimPanel(24, 60, 250, 168);
  ftxt(u.id, 149, 82, 19, '#eef3fa', 'center');
  ftxt(t('br_depth').replace('%s', u.depth) + '  ·  ' + t('br_worlds').replace('%s', Object.keys(b.seen).length),
    149, 104, 11, '#7d93a8', 'center');
  const bars = [
    [t('br_mercy'), u.mercy, '#7de8a0'], [t('br_sever'), u.sever, '#ffd76a'],
  ];
  bars.forEach((bb, i) => {
    const y = 126 + i * 20;
    ftxt(bb[0], 40, y, 11, bb[2], 'left');
    c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(120, y - 4, 130, 8);
    c.fillStyle = bb[2]; c.fillRect(120, y - 4, 130 * clamp(bb[1], 0, 1), 8);
  });
  let iy = 196;
  ftxt(t('br_inf'), 40, iy, 11, '#8aa2b5', 'left');
  BR_ZONES.forEach((z, i) => {
    const x = 118 + i * 22;
    const v = u.inf[z];
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x, iy - 8, 16, 16);
    c.fillStyle = 'rgba(224,90,255,' + (0.25 + v * 0.75) + ')'; c.fillRect(x, iy - 8 + 16 * (1 - v), 16, 16 * v);
    ftxt(z, x + 8, iy + 16, 9, '#6d8496', 'center');
  });
  // the laws of this world
  dimPanel(686, 60, 250, 168);
  ftxt(t('br_laws'), 811, 82, 13, '#eef3fa', 'center');
  if (!u.anom.length) ftxt('—', 811, 120, 13, '#7d93a8', 'center');
  u.anom.slice(0, 4).forEach((a, i) => {
    const y = 108 + i * 30;
    ftxt(BR_ANOM[a].n, 700, y, 13, '#aef7d8', 'left');
    ftxt(BR_ANOM[a].d, 700, y + 13, 9.5, '#7d93a8', 'left');
  });
  ftxt(t('br_ctl'), 480, 500, 12, '#5f7488', 'center');
  ftxt(t('br_seed').replace('%s', b.led.slice(-40) || '—'), 480, 520, 10, '#46586a', 'center');
}
