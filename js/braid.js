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
      led: '',                       // the whole multiverse, as a string
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
  if (brCache.key === b.led) return brCache.u;
  const seed = brHash('clawbyte/' + b.led);
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
  for (let i = 0; i < BR_ZONES.length; i++) {
    const z = BR_ZONES[i];
    // each kingdom answers at its own rate, so curing the world is never one
    // uniform slider and the map never reads as a single number repeated six times
    const bias = 0.72 + R() * 0.62;
    inf[z] = clamp(1 - cureF * bias * 1.9 + feedF * 0.75, 0, 1);
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
  brCache = { key: b.led, u };
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
  if (kind === 'kill') b.kills++;
  // only real divergences go on the chart — a chart of every kill is a wall
  if (kind !== 'kill') {
    b.forks++;
    b.nodes.push({ p: pick, k: kind, r: room || G.roomId, d: b.led.length });
    if (b.nodes.length > 220) b.nodes.shift();
  }
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
// THE OFFER. Three ways to answer, every kill and every rest.
//
// It never blocks. A prompt that stops a platformer dead on every kill would
// wreck the game's pace, so this is a ribbon with a clock on it: answer, or
// keep playing and let it lapse. Lapsing is itself a choice and is recorded as
// severance, because doing nothing to a dying machine IS severing it.
// ---------------------------------------------------------------------------
const BR_OFFER_T = 2.6;
function brOffer(kind, x, y) {
  if (!G.save || (typeof isHero === 'function' && isHero())) return;
  // rests and bosses always ask; kills ask on a ribbon that can lapse
  G.offer = { kind, t: kind === 'kill' ? BR_OFFER_T : 9e9, t0: BR_OFFER_T, x: x || 0, y: y || 0, done: false };
  if (kind !== 'kill') G.state = 'OFFER';
}
function brAnswer(pick) {
  const o = G.offer; if (!o || o.done) return;
  o.done = true;
  const u = brRecord(pick, o.kind, G.roomId);
  if (typeof sfx === 'function') sfx(pick === 'X' ? 'phase' : pick === 'L' ? 'powerUp' : 'ui');
  // the Signal's gift is real, and so is its price
  if (pick === 'X') {
    if (player) { player.volts = Math.min(player.maxVolts ? player.maxVolts() : 99, player.volts + 30); }
    if (typeof G.hudGlitchT === 'number') G.hudGlitchT = Math.max(G.hudGlitchT, 3);
    if (typeof cam !== 'undefined') cam.shake = Math.max(cam.shake, 6);
  } else if (pick === 'L' && player) {
    player.cores = Math.min(player.maxCores(), player.cores + (o.kind === 'kill' ? 0 : 1));
  } else if (pick === 'R') {
    if (typeof G.dropScrap === 'function' && o.kind === 'kill') G.dropScrap(o.x, o.y, 4);
  }
  // THE FIRST CHOICE resolves here, and it is the only offer that hands over a
  // power. Both branches give the DASH, because the way out of the Meadows can
  // never depend on the answer. What differs is the second gift, and it differs
  // in KIND rather than in size — a permanent edge, or a debt the lion repays.
  if (o.kind === 'firstboss' && G.forkBoss) {
    const b2 = G.forkBoss; G.forkBoss = null;
    if (pick === 'L') {
      G.save.flags.oath = 1;
      b2.hp = 0;
      b2.tamed = true;
      b2.die();                                  // the purification path: it lives
      if (typeof showItem === 'function') showItem(t('oath_name'), t('oath_desc'));
    } else {
      G.save.flags.resolve = 1;
      b2.hp = 0;
      b2.forceKill = true;
      // remembered, so the room never re-spawns it as a pet on the way back
      G.save.flags.killed = G.save.flags.killed || {};
      G.save.flags.killed[b2.kind] = 1;
      b2.die();
      if (typeof showItem === 'function') showItem(t('resolve_name'), t('resolve_desc'));
    }
  }
  if (G.state === 'OFFER') G.state = 'PLAY';
  G.offer = null;
  return u;
}
// the readout runs on the real clock, not on how fast the machine happens to draw
function updateBrDelta(dt) {
  const d = G.brDelta; if (!d) return;
  d.t -= dt; if (d.t <= 0) G.brDelta = null;
}
function updateOffer(dt) {
  const o = G.offer; if (!o) return;
  if (inP('LEFT')) return brAnswer('L');
  if (inP('RIGHT')) return brAnswer('R');
  if (o.kind !== 'firstboss' && (inP('UP') || inP('CAST') || inP('CLAW'))) return brAnswer('X');
  if (o.kind === 'kill') {
    o.t -= dt;
    if (o.t <= 0) { brAnswer('R'); }      // walking away is a choice
  }
}
// the ribbon, drawn in world space over the thing that just died
function drawOffer() {
  const o = G.offer; if (!o) return;
  const full = o.kind !== 'kill';
  const k = full ? 1 : clamp(o.t / o.t0, 0, 1);
  c.save();
  if (full) {
    c.fillStyle = 'rgba(4,7,12,0.82)'; c.fillRect(0, 0, 960, 540);
    ftxt(t(o.kind === 'firstboss' ? 'fb_title' : o.kind === 'bench' ? 'br_rest' : 'br_boss'), 480, 116, 22, '#eef3fa', 'center', '#37ffd0');
    ftxt(universe().id + '  ·  ' + t('br_depth').replace('%s', universe().depth), 480, 146, 13, '#7d93a8', 'center');
  }
  // THE PREMISE, SAID ONCE, IN THE GAME. The very first time she is asked, the
  // game states the rule outright rather than hoping the player infers it: the
  // story is fixed, the world is not, and what you do first echoes loudest.
  // Every readout after this is evidence for that sentence.
  if (braid().led.length === 0) {
    const bw = 660, bh = 90, bx0 = 480 - bw / 2, by0 = full ? 176 : 58;
    c.fillStyle = 'rgba(6,11,18,0.9)'; rr(c, bx0, by0, bw, bh, 10); c.fill();
    c.strokeStyle = 'rgba(120,220,255,0.45)'; c.lineWidth = 1.5;
    rr(c, bx0, by0, bw, bh, 10); c.stroke();
    ftxt(t('br_prime1'), 480, by0 + 24, 15, '#eef3fa', 'center');
    ftxt(t('br_prime2'), 480, by0 + 47, 12.5, '#9fd8e8', 'center');
    ftxt(t('br_prime3'), 480, by0 + 68, 12.5, '#ffd76a', 'center');
  }
  const bx = full ? 480 : clamp(o.x - cam.x, 130, 830);
  const by = full ? 348 : clamp(o.y - cam.y, 118, 430);
  // the first boss is a clean binary — tame or finish. Everywhere else keeps the
  // Signal's third door open.
  const two = o.kind === 'firstboss';
  const opts = two ? [
    { p: 'L', key: '◀', col: '#7de8a0', lab: t('fb_tame'), d: 'fb_tame_d' },
    { p: 'R', key: '▶', col: '#ffd76a', lab: t('fb_beat'), d: 'fb_beat_d' },
  ] : [
    { p: 'L', key: '◀', col: '#7de8a0', lab: t('br_mercy'), d: 'br_L_d' },
    { p: 'X', key: '▲', col: '#ff5a6a', lab: t('br_red'), d: 'br_X_d' },
    { p: 'R', key: '▶', col: '#ffd76a', lab: t('br_sever'), d: 'br_R_d' },
  ];
  const w = full ? (two ? 250 : 210) : 128, h = full ? 66 : 34, gap = full ? 18 : 8;
  opts.forEach((op, i) => {
    const ox = bx + (i - (opts.length - 1) / 2) * (w + gap), oy = by;
    c.globalAlpha = full ? 1 : 0.35 + k * 0.6;
    c.fillStyle = 'rgba(8,14,22,0.9)';
    rr(c, ox - w / 2, oy - h / 2, w, h, 8); c.fill();
    c.strokeStyle = op.col; c.lineWidth = full ? 2 : 1.4;
    rr(c, ox - w / 2, oy - h / 2, w, h, 8); c.stroke();
    ftxt(op.key + '  ' + op.lab, ox, oy - (full ? 8 : 0), full ? 17 : 12, op.col, 'center');
    if (full) ftxt(t(op.d), ox, oy + 16, 11, '#8aa2b5', 'center');
    c.globalAlpha = 1;
  });
  // the clock on a kill ribbon, so lapsing never feels like a bug
  if (!full) {
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.fillRect(bx - (w * 1.5 + gap), by + h / 2 + 5, (w * 3 + gap * 2) * k, 2);
  }
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
    [t('br_mercy'), u.mercy, '#7de8a0'], [t('br_sever'), u.sever, '#ffd76a'], [t('br_red'), u.red, '#ff5a6a'],
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
