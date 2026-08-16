// CLAWBYTE — world data: palettes, rooms, map layout
const TILE = 32;

const PAL_ROBO = {
  A: { sky: ['#07161a', '#0b2b28'], far: '#0e3a38', mid: '#155049', solid: '#1d6b5e', dark: '#124238', edge: '#3adfb2', spike: '#8ff0d4', glow: '#37ffd0', acc2: '#ffb347' },
  B: { sky: ['#050a1e', '#0a1440'], far: '#0e1e5a', mid: '#14307c', solid: '#1b3f92', dark: '#122a63', edge: '#57a8ff', spike: '#a8d4ff', glow: '#4db8ff', acc2: '#ff5ec8' },
  C: { sky: ['#160a05', '#331508'], far: '#4a1f0c', mid: '#63300f', solid: '#7c4414', dark: '#552e0d', edge: '#ffab4a', spike: '#ffd08a', glow: '#ff9430', acc2: '#ffe08a' },
  D: { sky: ['#0a1218', '#14283a'], far: '#1d3a55', mid: '#2b5578', solid: '#3a719c', dark: '#28506f', edge: '#bfeaff', spike: '#eefcff', glow: '#9fe8ff', acc2: '#b48cff' },
  E: { sky: ['#120518', '#2a0a3a'], far: '#3a1055', mid: '#521a75', solid: '#6b2596', dark: '#491968', edge: '#e05aff', spike: '#ff9df5', glow: '#d94aff', acc2: '#7dff9a' },
  X: { sky: ['#180512', '#38102e'], far: '#551d44', mid: '#77295f', solid: '#993878', dark: '#6b2754', edge: '#ff7ad1', spike: '#ffc2ea', glow: '#ff5ec8', acc2: '#ffd76a' },
};
let PAL = PAL_ROBO;

// --- grid builders ---
function mk(w, h) { const g = []; for (let y = 0; y < h; y++) { const r = []; for (let x = 0; x < w; x++) r.push('.'); g.push(r); } return g; }
function put(g, x, y, c) { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; }
function hline(g, x0, x1, y, c) { for (let x = x0; x <= x1; x++) put(g, x, y, c); }
function vline(g, x, y0, y1, c) { for (let y = y0; y <= y1; y++) put(g, x, y, c); }
function rect(g, x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) hline(g, x0, x1, y, c); }
// standard 17-row frame: ceiling, floor(15-16), side walls; openings carved after
function frame(g) {
  const w = g[0].length, h = g.length;
  hline(g, 0, w - 1, 0, '#');
  rect(g, 0, h - 2, w - 1, h - 1, '#');
  vline(g, 0, 0, h - 1, '#'); vline(g, w - 1, 0, h - 1, '#');
}
function openL(g) { rect(g, 0, 11, 0, 14, '.'); }
function openR(g) { const w = g[0].length; rect(g, w - 1, 11, w - 1, 14, '.'); }
// ---------------------------------------------------------------------------
// THE CAVE SHAPE RULE (owner, 2026-08-15): "you can never find caves as
// spheres or squares or perpendicular. It's always caves." So no cave room
// is ever drawn with frame() and runway platforms. Every cave is CARVED:
// solid rock first, then a cavity whose ceiling and floor breathe on two
// wavelengths with per-column jitter — no straight line survives. Ledges
// are short and staggered. And the rock keeps SECRETS: pockets sealed
// behind a breakable bite ('B'), because tunnels and hidden places are how
// the caves pay — the hiding is structural, not decorative.
//
// Deterministic per seed (the room id): the same cave is always the same
// cave, and no two caves are alike. The floor is clamped to steps of one so
// every rise is a walk or a hop; anchors flatten a guaranteed spot under
// everything that must stand somewhere (a door, a bench, a pillar).
function caveCarve(g, seedStr, o) {
  o = o || {};
  const W = g[0].length, H = g.length;
  let s = 2166136261;
  for (let i = 0; i < seedStr.length; i++) { s ^= seedStr.charCodeAt(i); s = (s * 16777619) >>> 0; }
  const R = () => (s = (s * 1103515245 + 12345) >>> 0, (s >>> 9) / (1 << 23));
  const ph = [R() * 6.28, R() * 6.28, R() * 6.28, R() * 6.28];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g[y][x] = '#';
  // a TUNNEL, not a hall: the ceiling hangs low enough to stay on screen, so
  // the rock above her is a presence. The surfaces follow slow waves through
  // HYSTERESIS — the level only steps when the wave has truly moved a tile —
  // which makes rolling mounds with treads of natural, varying width. Never
  // per-column jitter in the level itself: that made STAIRCASES, and the
  // owner's correction stands — "almost never in nature you would find
  // caves that have ups and downs vertical like stairs."
  let flLv = null, clLv = null, lastBump = -9;
  for (let x = 1; x < W - 1; x++) {
    const t = x / W;
    const clF = H - 12.4 + Math.sin(t * 8.3 + ph[0]) * 2.3 + Math.sin(t * 19 + ph[1]) * 1.1;
    const flF = H - 3.4 + Math.sin(t * 6.7 + ph[2]) * 1.7 + Math.sin(t * 13 + ph[3]) * 0.9;
    if (flLv == null) flLv = Math.round(flF);
    if (clLv == null) clLv = Math.round(clF);
    if (flF > flLv + 0.9) flLv++; else if (flF < flLv - 0.9) flLv--;
    if (clF > clLv + 0.9) clLv++; else if (clF < clLv - 0.9) clLv--;
    const fl = Math.min(flLv, H - 2);
    const cl = Math.max(2, Math.min(clLv, fl - 5));
    for (let y = cl; y <= fl; y++) g[y][x] = '.';
    // ceiling teeth — the rock reaches down, one tile, sometimes two
    if (R() < 0.16 && fl - cl > 6) {
      g[cl][x] = '#';
      if (R() < 0.35 && fl - cl > 7) g[cl + 1][x] = '#';
    }
    // floor knobs — a lone bump breaks a long tread; spaced, never stacked
    if (R() < 0.16 && x - lastBump > 3 && fl - cl > 6) { g[fl][x] = '#'; lastBump = x; }
  }
  // where a door or an exit meets the room, the rock steps aside: a cleared
  // approach with a flat shelf, so arrivals land and departures climb out
  for (const side of (o.open || [])) {
    const xs = side === 'L' ? [0, 1, 2, 3, 4] : [W - 1, W - 2, W - 3, W - 4, W - 5];
    for (const x of xs) {
      for (let y = 11; y <= 14; y++) g[y][x] = '.';
      if (x !== 0 && x !== W - 1) { g[15][x] = '.'; g[16] && (g[16][x] = '#'); }
    }
  }
  // anchors: a flat, open spot for everything that must stand somewhere —
  // with three rows of headroom, because a bowl she can stand in but cannot
  // JUMP out of is a trap wearing a floor
  for (const a of (o.anchor || [])) {
    const w2 = a.w2 || 1, h2 = a.h2 || 3;
    for (let x = a.x - w2; x <= a.x + w2; x++) {
      for (let y = a.y - h2; y <= a.y; y++) if (g[y]) g[y][x] = '.';
      if (g[a.y + 1]) g[a.y + 1][x] = '#';
    }
  }
  // ledges: short, staggered, never a runway
  const nL = o.ledges == null ? 4 : o.ledges;
  for (let i = 0; i < nL; i++) {
    const lx = 4 + Math.floor(R() * (W - 12));
    const ly = 6 + Math.floor(R() * Math.max(2, H - 12));
    const len = 3 + Math.floor(R() * 3);
    for (let k = 0; k < len; k++) {
      const yy = ly + (k > len / 2 && R() < 0.4 ? 1 : 0);
      if (g[yy] && g[yy][lx + k] === '.') g[yy][lx + k] = '=';
    }
  }
  // NO PIT DEEPER THAN A JUMP. Anchors dig flat bowls into a rolling floor,
  // and where the roll was high the bowl's wall could pass the three tiles a
  // jump clears (tests/climbout.cjs measured it: CV2 trapped three cells this
  // way). Walk the floor profile and shave any step taller than three down
  // to three, on both sides, until it settles. Mounds survive; traps do not.
  const ground = [];
  const groundAt = (x) => {
    for (let y = H - 2; y >= 1; y--)
      if (g[y][x] !== '#' && g[y + 1][x] === '#') return y;
    return H - 2;
  };
  for (let x = 1; x < W - 1; x++) ground[x] = groundAt(x);
  for (let pass = 0; pass < 4; pass++)
    for (let x = 2; x < W - 2; x++)
      for (const nx of [x - 1, x + 1])
        if (ground[x] - ground[nx] > 3) {
          const ny = ground[x] - 3;
          for (let y = ground[nx] + 1; y <= ny; y++) g[y][nx] = '.';
          ground[nx] = ny;
        }
  // pockets: hidden chambers EMBEDDED IN ROCK — the surrounding mass is
  // stamped first so the chamber is always inside something, whether that is
  // the ceiling or a hanging boulder; the way in is the breakable bite in
  // its underside. Break it from below, climb up into what the Deaf System
  // put away.
  for (const p of (o.pocket || [])) {
    for (let x = p.x - 2; x <= p.x + 2; x++)
      for (let y = p.y - 1; y <= p.y + 2; y++) if (g[y] && g[y][x] != null) g[y][x] = '#';
    for (let x = p.x - 1; x <= p.x + 1; x++)
      for (let y = p.y; y <= p.y + 1; y++) if (g[y]) g[y][x] = '.';
    if (g[p.y + 2]) g[p.y + 2][p.x] = 'B';
  }
}

// ents: [kind, tileX, tileYFeetOn, extra?, condFlag?]
const ROOMS = {
  // ============ THE WAKING FLOOR ============
  // Where she comes to. No enemy that can hurt her, no pit that can kill her,
  // no way to go but right — a room whose only job is to teach three verbs, in
  // the order they are needed, with the thing being taught standing in front of
  // her when the lesson starts: open ground to walk, a step to jump, and one
  // dormant machine to scratch. Every good platformer opens with a room like
  // this and it is the one room this game never had.
  // ============ THE WAKING — before the meadow, before any enemy ============
  //
  // The film ends with her opening her eyes. The GAME used to begin two rooms
  // and one dormant machine later, which meant the first thing the player did
  // after "she wakes up" was learn to punch something. So the waking is
  // playable now, and it is two rooms long:
  //
  //   W1 — she is still in the cradle. It lets her go, she stands, she walks.
  //        That is the whole room. MOVE is taught here, with nothing else on
  //        screen and nothing that can touch her.
  //   W2 — outside, in the light, with the city gates at the far end. A step
  //        and a gap teach JUMP on the way to them.
  //
  // Only then does A0 exist, with the trader, the node and the first machine —
  // and by the time she meets it she can already walk and jump, which is the
  // whole reason the order was wrong before. See TUT_ROOMS in game.js.
  W1: { zone: 'A', w: 32, h: 17, exits: { R: 'W2' },
    ents: [],                                 // nothing. That is the point.
    build(g) {
      frame(g); openR(g);
      // a low shelf on the far wall so the room has a depth to read against,
      // and nothing to jump onto: this room teaches ONE verb
      hline(g, 14, 18, 12, '=');
    } },
  // THE GATES ARE THE DOOR. W2 used to also have an ordinary right-hand exit
  // into A0 — so a player holding right simply side-scrolled past the gates
  // into the city, and the whole walk-into-the-depth moment never fired.
  // Reported as "I'm just keep walking to the side". The right wall is solid
  // now; the ONLY way into the city is UP at the gates (gateEnter), and the
  // gates close behind her — the opening is one-way, like waking up is.
  W2: { zone: 'A', w: 40, h: 17, exits: { L: 'W1' },
    ents: [],
    build(g) {
      frame(g); openL(g);
      // THE STEP. One tile, inside one jump, and nothing else — the gap that
      // used to sit at tile 22 was a hole in the road right in front of the
      // city gates, which is exactly where the ground should look most
      // deliberate. It read as a pothole at the front door and it is gone.
      rect(g, 12, 14, 14, 15, '#');
      // ...and the THRESHOLD: the ground rises a step as she reaches the gates,
      // so the approach ends on a made surface rather than on more of the same
      // dirt. It is walk-up height, so it never asks for a jump she has not
      // been taught yet.
      rect(g, 33, 14, 39, 15, '#');
      // the practice shelf has moved TWICE now: from 28-31 (over the old gate
      // approach) to 18-21 — which the gate then moved onto ("why is there a
      // plate in the middle of the gate?!"). It lives at 7-10 now, over the
      // walk-up BEFORE the step at 12: first the shelf teaches the hop, then
      // the step confirms it, and the gate at tile 20 stands alone.
      hline(g, 7, 10, 11, '=');
      // THE CITY WALL HAS A BODY. Sealing the side exit left the right edge a
      // single frame() column — one tile of green against the dark, which the
      // owner read as the wall having been REMOVED. A city's outer wall is the
      // biggest made thing the opening ever shows; three tiles of mass, full
      // height, so the room visibly ENDS and the gates are a door THROUGH
      // something rather than a spot beside nothing.
      rect(g, 37, 0, 39, 16, '#');
    } },
  A0: { zone: 'A', w: 34, h: 17, exits: { R: 'A1' },
    // The waking floor teaches the whole loop, not just the verbs: the machine
    // is what she scratches, the trader is what the scrap it drops is FOR, and
    // the node is where the thinking she is about to need comes from.
    // Ratchet is not standing in the weather any more — his BOOTH stands at
    // tile 26 (the depth door in GATE_ROOM) and he rests inside it (A0B).
    ents: [['crawler', 21, 15], ['riddle', 30, 15, 8]],
    build(g) {
      frame(g); openR(g);
      rect(g, 16, 14, 18, 15, '#');       // the step she has to jump
      hline(g, 4, 7, 12, '=');            // a lit shelf, for looking at
      // (the second shelf at 27-30 stood exactly where the booth stands now)
    } },
  // THE TRADER'S BOOTH (owner's design): she finds the booth on the meadow,
  // walks INTO it through the depth door, and inside is a den — a crafting
  // bench of a room where the disconnected unit RESTS instead of standing in
  // a field, with a spare power cell kept beside him. Wake him with hers or
  // with that one; either way the first light she gives away has a roof
  // over it.
  A0B: { zone: 'A', w: 30, h: 17, exits: {},
    // THE DEN IS THE KINGDOM'S FIRST ROOF, so it is also its first rest.
    // The bench audit (kingdom protocol: every kingdom has at least one save
    // point, PLACED for the arc) found the only touchable bench before the
    // Alpha was… none: the save stayed on the cradle default, so losing the
    // game's first losable fight (A10) respawned her five rooms back in W1,
    // gate cutscene included. The den pod fixes the retry loop at the place
    // the story already built for shelter — she wakes Ratchet under this
    // roof, and from then on the roof is where she comes back to. A3's bench
    // keeps its job as the meadow's own breath after the pack.
    ents: [['npc', 17, 15, 'ratchet'], ['chest', 20, 15, 'it:batt'], ['bench', 25, 15]],
    build(g) {
      frame(g);
      hline(g, 19, 23, 12, '=');          // the workbench loft over his corner
    } },
  // ============ ZONE A — Scrap Meadows ============
  A1: { zone: 'A', w: 32, h: 17, exits: { R: 'A2', T: 'A6', L: 'A0' },
    ents: [['npc', 6, 15, 'servo'], ['crawler', 18, 15], ['guard', 24, 15], ['scrap', 12, 15, 10]],
    build(g) {
      // the way BACK to A0. Leaving the first room used to be permanent, which
      // quietly took the trader, the Mind Node and the tutorial's whole economy
      // out of the run the moment the player stepped right.
      frame(g); openR(g); openL(g);
      hline(g, 5, 8, 12, '='); hline(g, 18, 21, 10, '=');
      // the climb into the gantries — the first thing in the game that is not
      // on the way to anywhere
      hline(g, 24, 27, 7, '='); hline(g, 19, 22, 4, '=');
      rect(g, 19, 0, 22, 0, '.');
    } },
  // ---- THE GANTRIES: a wing, not a corridor. Up, across, and back down with
  // the thing somebody asked for. Nothing here is required to finish the game.
  A6: { zone: 'A', w: 32, h: 21, exits: { B: 'A1' },
    // Same fix as A2, and it matters more here: the gantries are a climb over
    // spikes, so being harassed from two angles while airborne is not a fight
    // you can lose well. One flier to keep you honest in the air, one crawler
    // holding a ledge you have to land on — a threat you can choose to deal
    // with, which is what makes the climb a route rather than a gauntlet.
    ents: [['flier', 8, 8], ['crawler', 16, 12], ['turret', 22, 12], ['scrap', 4, 12, 25],
           ['item', 23, 6, 'coil'], ['plat', 10, 14, [0, -6, 3.2]]],
    build(g) {
      frame(g);
      // THE WAY BACK DOWN TO A1 — and it has to go through BOTH floor rows.
      // frame() lays solid across h-2 AND h-1, and this used to clear only h-1,
      // so the hole was a cellar under an unbroken floor. A6 is the first hidden
      // wing in the game and its only exit is this drop: you could climb in and
      // never get out. The bottom of the shaft was reachable, the room read as
      // finished, and the run was over.
      rect(g, 8, 19, 11, 20, '.');
      hline(g, 2, 6, 16, '='); hline(g, 13, 17, 13, '='); hline(g, 6, 10, 10, '=');
      hline(g, 15, 19, 8, '='); hline(g, 20, 24, 7, '#');
      hline(g, 11, 14, 18, '^');              // the floor is not safe to fall to
    } },
  // ---- THE SHAFT: straight down, in the dark, for the errand nobody takes.
  A7: { zone: 'A', w: 32, h: 26, exits: { T: 'A5' },
    ents: [['blob', 6, 24, 0], ['blob', 15, 24, 0], ['turret', 19, 18],
           ['scrap', 10, 24, 45], ['secret', 3, 24, 'sigil3']],
    build(g) {
      frame(g);
      rect(g, 9, 0, 12, 0, '.');              // the drop in from A5
      // THE LADDER OUT, AT THREE TILES A RUNG.
      //
      // This was five rungs at FOUR tiles, and four tiles is not a jump she has.
      // Integrated the way the game integrates it, one jump rises about 125 px —
      // three tiles and most of a fourth — so a four-tile step is impossible by
      // about three pixels. Which made this shaft a trap: you cut the brittle
      // floor in A5 to find out there is anything under the meadow, you drop in,
      // and the only way out is a climb that needs the double jump. The double
      // jump is TALONHOST's, two kingdoms later. The room was a hole in zone A
      // that swallowed the run, and the only exit was dying.
      //
      // Seven rungs at three tiles, alternating sides, all inside one jump both
      // up and across. The climb is still the room's whole point; it is just a
      // climb she can make. See tests/climbout.cjs.
      hline(g, 3, 8, 21, '='); hline(g, 12, 19, 18, '=');
      hline(g, 4, 9, 15, '='); hline(g, 13, 18, 12, '=');
      hline(g, 3, 8, 9, '='); hline(g, 12, 17, 6, '=');
      hline(g, 8, 13, 3, '=');                // the last rung, under the way out
      hline(g, 15, 20, 24, '^');
    } },
  A2: { zone: 'A', w: 60, h: 17, exits: { L: 'A1', R: 'A10', B: 'A5', T: 'A8' },
    // TWO DISRUPTORS ON ONE SCREEN WAS THE GAME'S SECOND FIGHT. Fliers dive and
    // withdraw; two of them harassing from opposite angles leaves nothing to do
    // about either, which is agency removal rather than difficulty. The second
    // one is a hopper now: a vertical PRESSURE threat that asks the same
    // question the guard beside it asks — can you wait for the right moment —
    // instead of asking the player to be in two places at once.
    ents: [['crawler', 20, 15], ['flier', 30, 7], ['guard', 46, 15], ['hopper', 52, 15], ['scrap', 8, 15, 8], ['scrap', 35, 11, 12]],
    build(g) {
      frame(g); openL(g); openR(g);
      // spike pits
      hline(g, 24, 28, 15, '^'); rect(g, 24, 15, 28, 15, '^');
      hline(g, 40, 44, 15, '^');
      hline(g, 25, 28, 11, '='); hline(g, 40, 44, 11, '=');
      // secret breakable floor down to A5 (pogo it)
      rect(g, 12, 15, 14, 16, 'B');
      hline(g, 33, 36, 12, '='); hline(g, 15, 18, 9, '='); hline(g, 48, 51, 12, '=');
    } },
  // ---- THE DEN. The first fight in the game you can lose, and it is on the
  // way rather than off it: the pack has been in the meadow since the first
  // room, and this is where the thing that leads it has been the whole time.
  // It sits between the meadow and the save point on purpose — you meet the
  // Alpha, you take the pack, and THEN you walk into the room with the bench
  // and the trader in it, which is where the run's first breath is.
  A10: { zone: 'A', w: 34, h: 17, exits: { L: 'A2', R: 'A3' },
    ents: [['boss', 22, 15, 'alpha']],
    build(g) {
      frame(g); openL(g); openR(g);
      // Two low shelves and nothing else. The Alpha's leap is the move the room
      // is built around, and a room full of geometry is a room where a
      // committed pounce lands on a corner instead of on the floor.
      hline(g, 5, 9, 11, '='); hline(g, 25, 29, 11, '=');
    } },
  A3: { zone: 'A', w: 32, h: 17, exits: { L: 'A10', R: 'A4', T: 'B1' },
    ents: [['bench', 8, 15], ['npc', 14, 15, 'ratchet']],
    build(g) {
      frame(g); openL(g); openR(g);
      hline(g, 18, 21, 12, '='); hline(g, 23, 26, 9, '='); hline(g, 19, 22, 6, '='); hline(g, 25, 28, 3, '=');
      rect(g, 25, 0, 28, 0, '.'); // ceiling opening to B1
    } },
  A4: { zone: 'A', w: 32, h: 17, exits: { L: 'A3' },
    ents: [['boss', 20, 15, 'glitch']],
    build(g) { frame(g); openL(g); hline(g, 4, 7, 11, '='); hline(g, 22, 25, 11, '='); } },
  A5: { zone: 'A', w: 32, h: 17, exits: { T: 'A2', B: 'A7' },
    ents: [['chest', 20, 15, 'magnet'], ['term', 25, 15, 1], ['riddle', 15, 15, 0], ['scrap', 5, 15, 30], ['scrap', 7, 15, 25], ['scrap', 17, 15, 20]],
    build(g) {
      frame(g);
      hline(g, 2, 4, 12, '='); hline(g, 6, 8, 9, '='); hline(g, 9, 11, 6, '='); hline(g, 12, 14, 3, '=');
      rect(g, 12, 0, 14, 0, '.'); // ceiling opening back to A2
      // the brittle floor over the shaft: you have to cut it to learn there is
      // anything under the meadow at all
      rect(g, 9, 15, 12, 16, 'B');
    } },
  // ============ ZONE B — Data Conduits ============
  // THE BREAKER'S FIRST ROOM (registry §6.4: a new machine gets one room to
  // be read in — one other machine here, threat 4, same as before the swap).
  // It replaces the turret on the left tower: the kingdom's first screen now
  // asks its OWN question — the surge charges as you climb its tower, and
  // the floor is briefly not yours — instead of re-asking zone A's turret
  // question. Solution shape: wait below the tower lip through the vent,
  // then climb and punish the open vents (0.9 s, two hits); failure mode:
  // climbing during the charge meets the wave with nowhere to land.
  B1: { zone: 'B', w: 32, h: 17, exits: { B: 'A3', R: 'B2', T: 'B6' },
    ents: [['flier', 15, 6], ['surge', 5, 12], ['scrap', 22, 12, 10]],
    build(g) {
      frame(g);
      rect(g, 1, 12, 10, 14, '#');          // left tower
      rect(g, 19, 12, 28, 14, '#');         // right tower
      hline(g, 11, 18, 15, '^');            // spike gap (needs dash)
      rect(g, 25, 12, 28, 16, '.');         // shaft down to A3
      hline(g, 25, 28, 12, '=');
      rect(g, 29, 8, 29, 11, '.');          // exit R (upper level)
      rect(g, 3, 0, 6, 0, '.');             // and up, into the relay gallery
      hline(g, 2, 7, 4, '='); hline(g, 8, 11, 8, '=');   // the way to reach it
    } },
  // THE RELAY GALLERY — the Conduits' own wing.
  //
  // Zone B had two fighting rooms to zone A's five: the second kingdom was
  // thinner than the first, which is the wrong shape for a difficulty curve and
  // the wrong shape for a place. This is B's answer to A6 and A7 — a climb up
  // the cable risers to a relay that stopped answering, and the errand that
  // sends you there is the Oracle's.
  //
  // Composition (registry §4/§6): turret ZONER anchoring the bottom of the
  // climb, hopper PRESSURE on the mid ledges, one flier DISRUPTOR at the top.
  // Peak 5 in any one screen, under the measured ceiling of 9, and never two
  // disruptors. The solution shape is "kill the turret from cover before you
  // commit to the climb, because you cannot dodge on a ladder."
  B6: { zone: 'B', w: 32, h: 24, exits: { B: 'B1' },
    ents: [['turret', 6, 22], ['hopper', 18, 18], ['flier', 13, 5],
           ['item', 22, 5, 'relay'], ['scrap', 3, 18, 30], ['plat', 9, 13, [0, -5, 3.4]]],
    build(g) {
      frame(g);
      rect(g, 3, 23, 6, 23, '.');             // the way back down to B1
      // the risers: staggered, so the climb is a route and not a stack
      hline(g, 2, 7, 19, '='); hline(g, 12, 17, 19, '=');
      hline(g, 16, 22, 15, '='); hline(g, 4, 9, 11, '=');
      hline(g, 13, 19, 8, '='); hline(g, 20, 24, 6, '=');
      hline(g, 10, 15, 22, '^');              // the floor is not a place to fall
    } },
  B2: { zone: 'B', w: 60, h: 17, exits: { L: 'B1', R: 'B3', B: 'V2', T: 'B7' },
    // The hall used to ask the same turret+hopper question twice. The second
    // pair's turret is the BREAKER now (taught one room back): mid-hall the
    // hopper's leap and the surge's floor wave stack into a genuinely new
    // read — be airborne on the wave's beat WITHOUT landing under the leap.
    // Solution shape: bait the vent from the 42-45 ledge, drop in behind the
    // wave, kill the breaker in its window, then take the hopper on open
    // ground. Threat and peak unchanged (turret and surge are both 2).
    ents: [['turret', 20, 15], ['hopper', 24, 15], ['surge', 38, 15], ['hopper', 42, 15], ['guard', 50, 15], ['scrap', 14, 15, 10], ['riddle', 55, 15, 1], ['secret', 51, 10, 'collar']],
    build(g) {
      frame(g); openR(g);
      rect(g, 0, 8, 0, 11, '.');            // entry from B1 (upper left)
      rect(g, 1, 12, 8, 14, '#');           // left ledge
      hline(g, 28, 31, 15, '^');            // spike strip
      // THE BRITTLE RAIL. Stand on it and cut down. Without the Grounding
      // Crest that is simply death, which is exactly why nobody finds this
      // before they have it.
      // Row 15 is the live rail; row 16 stays a solid floor slab that has to be
      // broken separately. Making BOTH rows hazard would have handed the vault
      // to anyone with the crest for free — hazard tiles are not solid, so she
      // would simply have fallen through without ever cutting anything.
      hline(g, 43, 46, 15, 'v'); hline(g, 43, 46, 16, 'B');
      hline(g, 27, 32, 11, '=');
      hline(g, 2, 4, 4, '='); hline(g, 5, 7, 7, '='); hline(g, 2, 4, 10, '=');
      hline(g, 42, 45, 12, '='); hline(g, 50, 53, 10, '=');
    } },
  B3: { zone: 'B', w: 32, h: 17, exits: { L: 'B2', R: 'B4', B: 'C1' },
    // The Oracle no longer stands in the corridor. Her PARLOR is the depth
    // door at mid-room (GATE_ROOM B3, the A0/A0B booth pattern): walk UP into
    // the cable-shrine and she is inside, in a place of her own — the same
    // promotion Ratchet got when the meadow stopped being his shop floor.
    ents: [['bench', 12, 15], ['term', 22, 15, 2], ['trial', 25, 15]],
    build(g) { frame(g); openL(g); openR(g); rect(g, 4, 15, 6, 16, '.'); } },
  // THE ORACLE'S PARLOR (kingdom 2's own interior, the B-side of A0B): a
  // one-room den behind the cable-shrine in B3 where mono actually LIVES —
  // the CRT face on its shroud of dead cables, reading a river of data in the
  // dark. Dressing mimics the Conduits backdrop per the mimic rule (cable
  // drapery, a rack loft, junction clutter); the procedural interior is a
  // stand-in — the authored plate is queued (ART_QUEUE §2h, oracleInterior).
  B3B: { zone: 'B', w: 30, h: 17, exits: {},
    ents: [['npc', 16, 15, 'mono'], ['scrap', 21, 15, 25]],
    build(g) {
      frame(g);
      hline(g, 18, 22, 12, '=');          // the rack loft over her data corner
    } },
  B4: { zone: 'B', w: 32, h: 17, exits: { L: 'B3', R: 'B5' },
    ents: [['boss', 15, 15, 'brood']],
    build(g) {
      frame(g); openL(g);
      hline(g, 5, 8, 11, '='); hline(g, 21, 24, 11, '=');
      rect(g, 28, 11, 29, 14, 'B');         // secret wall → B5
    } },
  B5: { zone: 'B', w: 32, h: 17, exits: { L: 'B4', T: 'X1', R: 'V1' },
    ents: [['chest', 12, 15, 'phantom'], ['scrap', 16, 15, 25], ['riddle', 19, 15, 2], ['vault', 21, 15]],
    build(g) {
      frame(g); openL(g); openR(g); hline(g, 8, 15, 12, '=');
      // the secret shaft up to the Crystal Cache — the kingdom's true end,
      // beyond TALONHOST, behind a breakable ceiling
      rect(g, 6, 0, 8, 0, '.'); rect(g, 6, 1, 8, 1, 'B');
      hline(g, 3, 6, 11, '='); hline(g, 5, 8, 7, '='); hline(g, 4, 7, 4, '=');
    } },
  V1: { zone: 'X', w: 32, h: 17, exits: { L: 'B5' },
    ents: [['chest', 12, 15, 'rl:aegis'], ['scrap', 5, 15, 60], ['scrap', 8, 15, 60], ['scrap', 16, 15, 60], ['scrap', 19, 15, 40], ['term', 9, 15, 4]],
    build(g) { frame(g); openL(g); hline(g, 8, 15, 11, '='); } },
  // THE GROUNDED VAULT. There is no door and no key. The only way in is to
  // stand ON a live hazard rail — which is fatal without the Grounding Crest —
  // and cut through the brittle section of it. Until somebody does that, this
  // room does not exist on the map, because the map only ever draws rooms that
  // have actually been stood in.
  V2: { zone: 'X', w: 32, h: 17, exits: { T: 'B2' },
    ents: [['chest', 11, 15, 'nine'], ['scrap', 4, 15, 80], ['scrap', 17, 15, 80],
           ['scrap', 8, 11, 60], ['bench', 14, 15], ['term', 6, 15, 4]],
    build(g) {
      frame(g);
      rect(g, 9, 0, 12, 0, '.');            // the hole she cut, overhead
      hline(g, 6, 10, 11, '='); hline(g, 13, 17, 8, '=');
    } },
  // ============ ZONE X — Crystal Cache (secret) ============
  X1: { zone: 'X', w: 32, h: 17, exits: { B: 'B5' },
    // THE OTHER END sleeps here — the buried half of the purifier (the one
    // secret in the game that is not a relic; see doInteract). Past the
    // Prowler, at the far wall of the deepest secret in the game: the blade
    // was split on purpose, and the half was hidden where only somebody who
    // finds everything would look. The join fires the crystalJoin sting and
    // opens the boomer node in the tree.
    ents: [['boss', 20, 15, 'prism'], ['chest', 24, 15, 'nine', 'bossPrism'], ['scrap', 4, 15, 20], ['riddle', 3, 15, 7],
           ['secret', 29, 15, 'crystal2']],
    build(g) {
      frame(g);
      rect(g, 6, 15, 8, 16, '.');           // floor opening back down to B5
      hline(g, 12, 17, 11, '='); hline(g, 20, 24, 8, '=');
    } },
  // ============ ZONE C — The Foundry ============
  C1: { zone: 'C', w: 32, h: 34, exits: { T: 'B3', B: 'C2' },
    // The shaft's two fliers sat ten tiles apart in Y — one screen — and the
    // audit missed it because it only slid a window sideways, which in a room
    // 30 wide and 34 tall is the whole room. Descending past two disruptors
    // with nothing to stand on is the worst version of the forbidden pair: you
    // cannot even choose which one to answer. The lower one is a hopper now,
    // holding the ledge at y=23 that the descent has to land on.
    ents: [['plat', 12, 22, [0, -8, 4.6, 2]], ['mod', 26, 18, 'wall'], ['flier', 15, 15], ['hopper', 8, 22], ['turret', 20, 27], ['scrap', 3, 23, 15], ['riddle', 6, 23, 3], ['secret', 8, 23, 'sigil3']],
    build(g) {
      hline(g, 0, 29, 0, '#'); rect(g, 0, 32, 29, 33, '#');
      vline(g, 0, 0, 33, '#'); vline(g, 29, 0, 33, '#');
      rect(g, 4, 0, 6, 0, '.');             // top opening from B3
      hline(g, 1, 10, 5, '#'); hline(g, 18, 28, 9, '#');
      hline(g, 1, 12, 13, '#'); hline(g, 16, 28, 18, '#');
      hline(g, 1, 10, 23, '#'); hline(g, 14, 24, 27, '#');
      hline(g, 8, 14, 31, '^');
      rect(g, 22, 32, 25, 33, '.');         // bottom opening to C2
    } },
  // THE POUR GALLERY — the Foundry's wing, and the room that makes the Tinker's
  // errand a thing you do in his own kingdom. He asks for four gun emplacements
  // silenced; the Foundry shipped two. Two more live here, in a crossfire that
  // the registry allows only when the room provides a line that breaks one of
  // them — so the gallery is built around a central pour column you can put
  // between yourself and either gun, and the crawler is what stops you camping
  // behind it.
  // The Tinker LIVES here now (kingdom 3): the depth door at the right end of
  // the gallery (GATE_ROOM C5, the A0/A0B booth pattern) leads into his
  // workshop, C5B — and the second turret sits on the platform directly over
  // his doorway. The errand was always "silence the four guns"; now two of
  // them are the guns outside his own door, and the wing that holds his
  // errand's targets is also the wing where he hands it out.
  C5: { zone: 'C', w: 32, h: 19, exits: { R: 'C2' },
    ents: [['turret', 4, 17], ['turret', 27, 11], ['crawler', 16, 17],
           ['scrap', 15, 11, 35], ['saw', 20, 17, [5, 0, 2.6]],
           // a leaf has to PAY. This one cost a fight and a saw run and gave
           // back a handful of scrap, which is a toll, not a discovery.
           ['chest', 3, 8, 'cr:forge']],
    build(g) {
      frame(g); openR(g);
      rect(g, 14, 4, 17, 15, '#');            // the pour column: the cover
      hline(g, 2, 8, 13, '='); hline(g, 23, 30, 13, '=');
      hline(g, 9, 13, 8, '='); hline(g, 18, 22, 8, '=');
      hline(g, 9, 12, 17, '^'); hline(g, 19, 22, 17, '^');
    } },
  // THE TINKER'S FORGE (kingdom 3's own interior, the C-side of A0B/B3B): a
  // one-room smithy behind the quench-hood door in C5 where Patch-7 actually
  // WORKS — the copper-domed unit at his own hearth instead of standing in
  // the traffic of the pour hall. Dressing mimics the Foundry backdrop per
  // the mimic rule (a slag-crusted tool loft, ladle clutter, the hearth's
  // molten light); the procedural interior is a stand-in — the authored
  // plate is queued (ART_QUEUE §2k, forgeInterior). Per the kingdom bench
  // audit (see A0B) this roof is also zone C's rest: the Foundry had NO
  // touchable bench at all, so a death anywhere in the kingdom respawned
  // her a kingdom back in B3. The forge pod is the retry loop's fix, placed
  // where the story already built shelter.
  C5B: { zone: 'C', w: 30, h: 17, exits: {},
    ents: [['npc', 16, 15, 'patch'], ['bench', 21, 15], ['scrap', 6, 11, 25]],
    build(g) {
      frame(g);
      hline(g, 3, 9, 12, '=');            // the slag-crusted tool loft
    } },
  C2: { zone: 'C', w: 60, h: 17, exits: { T: 'C1', R: 'C3', B: 'D1', L: 'C5' },
    // Patch-7 no longer stands in the corridor — his forge is behind the
    // depth door in C5 (the same promotion Ratchet and the Oracle got).
    // And the door to that wing WORKS now: exits.L said C5 since the wing
    // was built, but the build never carved openL, so the Pour Gallery —
    // with two of the errand's four guns in it — sat sealed behind a solid
    // frame wall. Found walking the wall, not the graph: deadend.cjs reads
    // exits, and exits lie when the wall disagrees.
    ents: [['plat', 33, 12, [5, 0, 3.6]], ['blob', 16, 15], ['turret', 22, 15], ['hopper', 42, 15], ['guard', 46, 15], ['blob', 55, 15], ['scrap', 5, 15, 12],
           ['saw', 40, 15, [6, 0, 3.0]]],
    build(g) {
      frame(g); openR(g); openL(g);
      rect(g, 22, 0, 25, 0, '.');           // ceiling opening from C1
      hline(g, 8, 13, 15, '^'); hline(g, 33, 38, 15, '^'); hline(g, 48, 52, 15, '^');
      hline(g, 9, 12, 11, '='); hline(g, 47, 52, 11, '=');
      rect(g, 18, 15, 20, 16, 'B');         // breakable floor → D1
    } },
  C3: { zone: 'C', w: 32, h: 17, exits: { L: 'C2', R: 'C4', T: 'C6' },
    ents: [['boss', 22, 6, 'atlas'], ['plat', 7, 9, [9, 0, 4.2]]],
    build(g) {
      frame(g); openL(g);
      hline(g, 5, 8, 11, '='); hline(g, 21, 24, 11, '='); rect(g, 28, 11, 29, 14, 'B');
      hline(g, 19, 25, 6, '#');           // the dragon's roost ledge, high right
    } },
  C4: { zone: 'C', w: 32, h: 17, exits: { L: 'C3' },
    ents: [['chest', 10, 15, 'slot'], ['scrap', 14, 15, 40], ['riddle', 6, 15, 4]],
    build(g) { frame(g); openL(g); } },
  // ============ ZONE D — Frozen Archives ============
  D1: { zone: 'D', w: 32, h: 17, exits: { T: 'C2', R: 'D2' }, ice: true,
    ents: [['bench', 6, 15], ['npc', 12, 15, 'sage'], ['term', 24, 15, 3]],
    build(g) { frame(g); openR(g); rect(g, 18, 0, 20, 0, '.'); hline(g, 15, 18, 11, '='); } },
  D2: { zone: 'D', w: 60, h: 17, exits: { L: 'D1', R: 'D3', T: 'D4', B: 'D5' }, ice: true,
    // The two fliers sat at y=6 and y=7 — the same screen — and the audit read
    // the heavier ground-level window three tiles below them and called the
    // room clean. On ice, where you cannot stop, being pushed by two things at
    // once is not a fight. The second is a hopper on the ledge now: it still
    // owns the air above the spikes, and on a slippery floor a leap you have to
    // read is worth more than a dive you cannot answer.
    ents: [['flier', 20, 6], ['guard', 25, 15], ['hopper', 41, 11], ['guard', 44, 15], ['turret', 55, 15], ['plat', 30, 10, [6, 0, 3.4]], ['scrap', 41, 11, 15], ['riddle', 21, 8, 5], ['secret', 41, 12, 'coin'],
           ['saw', 19, 15, [7, 0, 3.4]]],
    build(g) {
      frame(g); openL(g); openR(g);
      hline(g, 10, 16, 15, '^'); hline(g, 30, 37, 15, '^'); hline(g, 46, 51, 15, '^');
      hline(g, 11, 15, 11, '='); hline(g, 46, 50, 11, '=');
      hline(g, 20, 23, 8, '='); hline(g, 40, 43, 12, '=');
    } },
  // THE COLD STACKS — the Archives' wing.
  //
  // Zone D shipped with ONE fighting room, which made the game's second-hardest
  // kingdom also its thinnest: rest, fight, boss. The stacks are the climb the
  // Archivist sends you on, and they are built around the one thing this zone
  // owns that no other does — you cannot stop. Every ledge is a commitment.
  //
  // Composition: a guard ANCHOR at the top of the climb, because an anchor on
  // ice is a genuinely new problem (you must arrive at a stop to use its
  // window); one flier DISRUPTOR and one crawler PRESSURE below it. Peak 6.
  D4: { zone: 'D', w: 34, h: 21, exits: { B: 'D2' }, ice: true,
    ents: [['guard', 28, 7], ['flier', 12, 9], ['crawler', 7, 18],
           ['item', 30, 7, 'index'], ['scrap', 4, 12, 40], ['plat', 16, 15, [7, 0, 3.2]]],
    build(g) {
      frame(g);
      rect(g, 15, 20, 18, 20, '.');            // the way back down to D2
      hline(g, 2, 9, 19, '='); hline(g, 24, 32, 16, '=');
      hline(g, 3, 10, 13, '='); hline(g, 20, 27, 12, '=');
      hline(g, 9, 15, 9, '='); hline(g, 24, 32, 8, '#');   // the shelf the guard holds
      hline(g, 11, 22, 20, '^');               // the floor of the stacks is not floor
    } },
  D3: { zone: 'D', w: 32, h: 17, exits: { L: 'D2', B: { to: 'E1', flag: 'bossZero' } }, ice: true,
    ents: [['boss', 15, 15, 'zero']],
    build(g) { frame(g); openL(g); hline(g, 5, 8, 11, '='); hline(g, 21, 24, 11, '='); rect(g, 15, 15, 17, 16, '.'); } },
  // ============ ZONE E — The Virus Nest ============
  E1: { zone: 'E', w: 32, h: 17, exits: { T: 'D3', R: 'E2' },
    ents: [['blob', 10, 15], ['blob', 20, 15], ['hopper', 25, 15], ['riddle', 5, 15, 6], ['npc', 13, 15, 'lumen']],
    build(g) { frame(g); openR(g); rect(g, 15, 0, 17, 0, '.'); hline(g, 6, 9, 11, '='); } },
  // THE HATCHERY — the Nest's wing, and the room that makes lumen's errand
  // possible at all.
  //
  // `lumen_light` has always asked for a beacon lens. The lens was never placed
  // anywhere in the world: the quest could be accepted and could never be
  // finished, and nothing in the game would have said so — an errand's goal is
  // checked against the bag, and an item that does not exist simply never
  // arrives. Found by listing every `item` entity and comparing it against every
  // fetch quest, which is now what `tests/quests.cjs` does on every run.
  //
  // Composition: blob DENIAL owning the floor of a chamber you have to cross
  // slowly, one turret ZONER above it, one crawler. Peak 5. The solution shape
  // is "the blobs are the room — go over them, not through."
  E4: { zone: 'E', w: 32, h: 20, exits: { B: 'E2' },
    ents: [['blob', 8, 18], ['blob', 20, 18], ['turret', 26, 10], ['crawler', 14, 12],
           ['item', 4, 12, 'lens'], ['scrap', 25, 18, 40]],
    build(g) {
      frame(g);
      rect(g, 13, 19, 16, 19, '.');            // the drop back to E2
      hline(g, 2, 8, 13, '='); hline(g, 12, 18, 13, '=');
      hline(g, 22, 28, 11, '='); hline(g, 5, 11, 8, '=');
      hline(g, 17, 24, 6, '=');
    } },
  E2: { zone: 'E', w: 60, h: 17, exits: { L: 'E1', R: 'E3', T: 'E4', B: 'E5' },
    ents: [['plat', 22, 10, [5, 0, 2.8]], ['plat', 37, 12, [0, -4, 3.0]], ['turret', 31, 15], ['flier', 18, 6], ['guard', 34, 15], ['blob', 45, 15], ['hopper', 50, 15], ['bench', 52, 15], ['scrap', 11, 11, 20], ['secret', 17, 8, 'star'],
           ['saw', 43, 15, [6, 0, 2.6]], ['saw', 29, 9, [0, 4, 3.2]]],
    build(g) {
      frame(g); openL(g); openR(g);
      hline(g, 8, 14, 15, '^'); hline(g, 22, 27, 15, '^'); hline(g, 36, 41, 15, '^');
      hline(g, 9, 13, 12, '=');
      hline(g, 16, 19, 8, '=');
    } },
  E3: { zone: 'E', w: 34, h: 17, exits: { L: 'E2' },
    ents: [['boss', 17, 15, 'mother']],
    build(g) { frame(g); openL(g); hline(g, 4, 7, 11, '='); hline(g, 26, 29, 11, '='); } },

  // ==========================================================================
  // THE SPURS — five side branches, one per kingdom, each ending on one of the
  // Eye's constructs and the Power Cell it was built around.
  //
  // The game was too short, and the honest reason is that every kingdom was a
  // corridor: hub, fight, boss, next kingdom. Adding corridor would have made
  // it longer without making it bigger. A spur adds length that is ABOUT
  // something — a climb or a descent you take because you know a machine
  // person is standing dark two rooms back and this is where its cell is.
  //
  // Each spur is two rooms: a traversal room that asks one question of the
  // moveset you have by then, and an arena with the construct in it. Both are
  // built so the way back out is always inside one jump — see
  // tests/climbout.cjs, which is the harness that caught A7 being a hole the
  // run fell into.

  // ---- ZONE A: the Chime, up above the meadow ------------------------------
  A8: { zone: 'A', w: 32, h: 21, exits: { B: 'A2', T: 'A9' },
    ents: [['crawler', 8, 15], ['flier', 18, 9], ['scrap', 4, 15, 20], ['scrap', 21, 9, 25]],
    build(g) {
      frame(g);
      rect(g, 11, 19, 14, 20, '.');            // the way back down to A2
      rect(g, 11, 0, 14, 0, '.');              // and up to the Chime
      // a staggered climb, every rung inside one jump of the last
      hline(g, 3, 9, 15, '='); hline(g, 14, 21, 12, '=');
      hline(g, 4, 10, 9, '='); hline(g, 15, 22, 6, '=');
      hline(g, 9, 16, 3, '=');
    } },
  A9: { zone: 'A', w: 32, h: 17, exits: { B: 'A8' },
    ents: [['boss', 18, 15, 'chime']],
    build(g) {
      frame(g);
      rect(g, 12, 15, 15, 16, '.');            // the drop back to A8
      hline(g, 3, 8, 11, '='); hline(g, 20, 25, 11, '=');
    } },

  // ==== THE CRYSTAL CAVE — quest 1's wing, entered through A5's BACKDROP ====
  // The first use of the depth door outside the opening (GATE_ROOM in game.js:
  // UP at the cave mouth in A5 walks her INTO the painting; the same door in
  // CV1 walks her back out). Three big rooms, and the brief is the owner's:
  // obstacles to jump "challenging but easy", a small enemy here and there,
  // and the pillar SHINING at the end of the dark — the shine is the guide.
  // Also the first stroke of the world tripling: every room here is wider
  // than the viewport ever was.
  CV1: { zone: 'X', cave: 1, w: 46, h: 17, exits: { R: 'CV2' },
    // the entry hall: light from the mouth behind her, a CARVED cavity (the
    // cave shape rule — no straight lines), one crawler patrolling, and the
    // first hidden pocket so the cave teaches on entry that its rock keeps
    // things
    ents: [['crawler', 26, 15], ['scrap', 14, 7, 15], ['scrap', 34, 15, 10]],
    build(g) {
      caveCarve(g, 'CV1', {
        open: ['R'],
        anchor: [{ x: 4, y: 15, w2: 2 }, { x: 26, y: 15, w2: 2 }, { x: 34, y: 15 }],
        pocket: [{ x: 14, y: 6 }],
      });
    } },
  CV2: { zone: 'X', cave: 1, w: 52, h: 17, exits: { L: 'CV1', R: 'CV3' },
    // the long dark middle: hoppers in the hollows, a crawler on the far
    // slope, two pockets for the thorough
    ents: [['hopper', 14, 15], ['hopper', 33, 15], ['crawler', 44, 15],
           ['bat', 28, 6],
           ['scrap', 22, 7, 25], ['scrap', 40, 7, 20], ['scrap', 8, 15, 20]],
    build(g) {
      caveCarve(g, 'CV2', {
        open: ['L', 'R'], ledges: 5,
        anchor: [{ x: 14, y: 15 }, { x: 33, y: 15 }, { x: 44, y: 15 }, { x: 8, y: 15 }],
        pocket: [{ x: 22, y: 6 }, { x: 40, y: 6 }],
      });
    } },
  CV3: { zone: 'X', cave: 1, w: 46, h: 17, exits: { L: 'CV2' },
    // the end of the dark: two crawlers between her and the PILLAR — which
    // needs the supercharged claw, and the crawlers are where the volts for
    // it come from. That is the room teaching the tool.
    ents: [['crawler', 16, 15], ['crawler', 30, 15], ['bat', 24, 6], ['bat', 36, 6],
           ['scrap', 10, 7, 20], ['pillar', 41, 15]],
    build(g) {
      caveCarve(g, 'CV3', {
        open: ['L'],
        anchor: [{ x: 16, y: 15 }, { x: 30, y: 15 }, { x: 41, y: 15, w2: 2, h2: 4 }],
        pocket: [{ x: 10, y: 6 }],
      });
    } },

  // ---- ZONE B: the Carrier, still running its route ------------------------
  B7: { zone: 'B', w: 32, h: 22, exits: { B: 'B2', T: 'B8' },
    ents: [['turret', 6, 15], ['flier', 20, 8], ['blob', 24, 15], ['scrap', 12, 15, 30]],
    build(g) {
      frame(g);
      rect(g, 13, 20, 16, 21, '.');
      rect(g, 13, 0, 16, 0, '.');
      // conveyor shelves: the climb is off moving-platform stops, so it reads
      // as the canals rather than as a ladder wearing a different palette
      hline(g, 2, 8, 16, '='); hline(g, 12, 19, 13, '=');
      hline(g, 3, 9, 10, '='); hline(g, 13, 20, 7, '=');
      hline(g, 4, 10, 4, '='); hline(g, 14, 21, 3, '=');
      hline(g, 22, 27, 12, '^');               // the drop you do not want
    } },
  B8: { zone: 'B', w: 32, h: 17, exits: { B: 'B7' },
    ents: [['boss', 20, 15, 'carrier']],
    build(g) {
      frame(g);
      rect(g, 14, 15, 17, 16, '.');
      hline(g, 3, 9, 10, '='); hline(g, 21, 27, 10, '=');
    } },

  // ---- ZONE C: the Kiln-Moth, gone to the heat -----------------------------
  C6: { zone: 'C', w: 32, h: 22, exits: { B: 'C3', T: 'C7' },
    ents: [['hopper', 9, 15], ['turret', 20, 11], ['blob', 15, 15], ['scrap', 4, 15, 35]],
    build(g) {
      frame(g);
      rect(g, 11, 20, 14, 21, '.');
      rect(g, 11, 0, 14, 0, '.');
      hline(g, 2, 8, 16, '='); hline(g, 13, 20, 13, '=');
      hline(g, 3, 9, 10, '='); hline(g, 14, 21, 7, '=');
      hline(g, 8, 15, 4, '=');
      hline(g, 17, 23, 17, '^');
    } },
  C7: { zone: 'C', w: 32, h: 18, exits: { B: 'C6' },
    ents: [['boss', 20, 16, 'moth']],
    build(g) {
      frame(g);
      rect(g, 12, 16, 15, 17, '.');
      hline(g, 3, 9, 11, '='); hline(g, 21, 27, 11, '=');
    } },

  // ---- ZONE D: the Lattice, growing under the archives ---------------------
  D5: { zone: 'D', w: 32, h: 24, exits: { T: 'D2', B: 'D6' }, ice: true,
    ents: [['blob', 8, 22, 0], ['turret', 21, 16], ['flier', 14, 8], ['scrap', 4, 22, 40]],
    build(g) {
      frame(g);
      rect(g, 12, 0, 15, 0, '.');
      rect(g, 12, 22, 15, 23, '.');
      // a descent, and the rungs still have to work going UP, because the only
      // way home is back through here
      hline(g, 3, 9, 5, '='); hline(g, 14, 21, 8, '=');
      hline(g, 4, 10, 11, '='); hline(g, 15, 22, 14, '=');
      hline(g, 3, 9, 17, '='); hline(g, 14, 21, 20, '=');
    } },
  D6: { zone: 'D', w: 32, h: 17, exits: { T: 'D5' }, ice: true,
    ents: [['boss', 20, 15, 'lattice']],
    build(g) {
      frame(g);
      rect(g, 13, 0, 16, 0, '.');
      hline(g, 3, 9, 10, '='); hline(g, 21, 27, 10, '=');
      hline(g, 11, 18, 5, '=');                // the rung back up to the door
    } },

  // ---- ZONE E / the Eye: the Lens, watching the nest -----------------------
  E5: { zone: 'E', w: 32, h: 24, exits: { T: 'E2', B: 'E6' },
    ents: [['blob', 7, 22, 1], ['hopper', 17, 22], ['turret', 25, 15], ['scrap', 4, 22, 45]],
    build(g) {
      frame(g);
      rect(g, 13, 0, 16, 0, '.');
      rect(g, 13, 22, 16, 23, '.');
      hline(g, 3, 9, 5, '='); hline(g, 15, 22, 8, '=');
      hline(g, 4, 10, 11, '='); hline(g, 16, 23, 14, '=');
      hline(g, 3, 9, 17, '='); hline(g, 15, 22, 20, '=');
      hline(g, 20, 27, 21, '^');
    } },
  E6: { zone: 'E', w: 32, h: 17, exits: { T: 'E5' },
    ents: [['boss', 22, 15, 'lens']],
    build(g) {
      frame(g);
      rect(g, 13, 0, 16, 0, '.');
      hline(g, 3, 9, 10, '='); hline(g, 22, 29, 10, '=');
      hline(g, 11, 18, 5, '=');
    } },
};

// map screen layout: [gridX, gridY, wCells, hCells]
const MAPPOS = {
  W1: [-3, 3, 1, 1], W2: [-2, 3, 1, 1], A0: [-1, 3, 1, 1], A0B: [-1, 2, 1, 1], A1: [0, 3, 1, 1], A2: [1, 3, 2, 1], A10: [3, 3, 1, 1], A3: [4, 3, 1, 1], A4: [5, 3, 1, 1],
  A5: [1, 4, 1, 1], A6: [0, 2, 1, 1], A7: [1, 5, 1, 1], A8: [1, 2, 1, 1], A9: [1, 1, 1, 1],
  CV1: [2, 4, 1, 1], CV2: [3, 4, 1, 1], CV3: [4, 4, 1, 1],
  B1: [3, 2, 1, 1], B2: [4, 2, 2, 1], B3: [6, 2, 1, 1], B3B: [6, 1, 1, 1], B4: [7, 2, 1, 1], B5: [8, 2, 1, 1], V1: [9, 2, 1, 1], V2: [5, 5, 1, 1],
  B6: [3, 1, 1, 1], B7: [4, 1, 1, 1], B8: [4, 0, 1, 1],
  X1: [8, 1, 1, 1],
  C1: [6, 3, 1, 2], C2: [5, 5, 2, 1], C3: [7, 5, 1, 1], C4: [8, 5, 1, 1], C5: [4, 5, 1, 1], C5B: [4, 6, 1, 1],
  C6: [7, 4, 1, 1], C7: [7, 3, 1, 1],
  D1: [5, 6, 1, 1], D2: [6, 6, 2, 1], D3: [8, 6, 1, 1], D4: [6, 5, 1, 1],
  D5: [6, 7, 1, 1], D6: [6, 8, 1, 1],
  E1: [8, 7, 1, 1], E2: [9, 7, 2, 1], E3: [11, 7, 1, 1], E4: [9, 6, 1, 1],
  E5: [9, 8, 1, 1], E6: [9, 9, 1, 1],
};

// ==== THE GUARDIAN GROTTOES — every fall or taming REVEALS A CAVE ==========
// The owner's rule, verbatim: "defeating a boss or a sage always reveals a
// cave"; and the caves ARE the story: when the corrupted song came, the
// BROKEN were the lucky ones — every unit whose ears were dead heard
// nothing, and nothing is what saved them. They went under, into rock where
// the signal dies, and rebuilt as THE DEAF SYSTEM. Each grotto is the
// doorway to one of their refuges.
//
// AND THE CAVES ARE THE WORLD-GROWTH DOCTRINE (docs/DEAF_SYSTEM.md): the
// game grows through MANY SMALL UNCONNECTED cave networks, not one giant
// connected map. This engine makes that free — rooms are procedural tile
// grids built lazily per-room (buildRoom/gridCache), the networks share the
// zone-X palette and tile deck, and a network costs nothing until she walks
// into it. Small parallel maps, cheap memory, no loading spikes: the
// owner's call, and structurally true here.
//
// Every lair grows a depth door (GATE_ROOM in game.js, gated on the boss's
// flag) into a two-room start of a network: the GROTTO (scrap and a rest —
// a reveal always pays SOMETHING) and the TUNNEL behind it, where a Deaf
// System terminal tells the story. Deeper rooms per network are added per
// cave, each its own story.
const GROTTOES = [
  // [grotto, tunnel, deep chamber, lair, flag, grotto/tunnel/deep map cells]
  ['GA1', 'GA1T', 'GA1D', 'A4', 'bossGlitch', [5, 4], [6, 4], [10, 4]],
  ['GA2', 'GA2T', 'GA2D', 'A10', 'alpha', [2, 2], [2, 1], [1, 1]],
  // GB1's tunnel/deep cells moved up a row: [6,1] is the Oracle's parlor now
  ['GB1', 'GB1T', 'GB1D', 'B4', 'bossBrood', [7, 1], [7, 0], [6, 0]],
  ['GC1', 'GC1T', 'GC1D', 'C3', 'bossAtlas', [8, 4], [9, 4], [9, 5]],
  ['GD1', 'GD1T', 'GD1D', 'D3', 'bossZero', [10, 6], [10, 5], [11, 5]],
  ['GX1', 'GX1T', 'GX1D', 'X1', 'bossPrism', [9, 1], [10, 1], [11, 1]],
  ['GE1', 'GE1T', 'GE1D', 'E3', 'bossMother', [11, 6], [12, 6], [13, 6]],
];
for (const [gid, tid, did, lair, flag, gcell, tcell, dcell] of GROTTOES) {
  ROOMS[gid] = {
    zone: 'X', cave: 1, w: 36, h: 17, exits: { R: tid },
    ents: [['scrap', 8, 15, 40], ['scrap', 18, 7, 40], ['scrap', 28, 15, 60], ['bench', 32, 15]],
    build(g) {
      caveCarve(g, gid, {
        open: ['R'],
        anchor: [{ x: 3, y: 15, w2: 2 }, { x: 8, y: 15 }, { x: 28, y: 15 }, { x: 32, y: 15, w2: 2 }],
        pocket: [{ x: 18, y: 6 }],
      });
    },
  };
  ROOMS[tid] = {
    zone: 'X', cave: 1, w: 40, h: 17, exits: { L: gid, R: did },
    ents: [['term', 20, 15, 5], ['bat', 14, 6], ['scrap', 8, 15, 30], ['scrap', 30, 7, 40]],
    build(g) {
      caveCarve(g, tid, {
        open: ['L', 'R'],
        anchor: [{ x: 8, y: 15 }, { x: 20, y: 15, w2: 2 }],
        pocket: [{ x: 30, y: 6 }],
      });
    },
  };
  // the DEEP CHAMBER — where each network's own story will live (a tamed
  // sage's gift, a challenge, a settlement). Until that story is written it
  // is the richest dig in the network: two pockets, real scrap, and the
  // bats own the ceiling.
  // ...and the SAGE kneels at the far end of it (docs/combat/SAGE.md): the
  // duel ground is anchored flat, and the chamber's other machines thin out
  // so the duel is a duel, not a brawl
  ROOMS[did] = {
    zone: 'X', cave: 1, w: 44, h: 17, exits: { L: tid },
    ents: [['bat', 14, 5], ['sage', 33, 15],
           ['scrap', 8, 15, 30], ['scrap', 22, 7, 50], ['scrap', 40, 15, 60]],
    build(g) {
      caveCarve(g, did, {
        open: ['L'], ledges: 4,
        anchor: [{ x: 8, y: 15 }, { x: 33, y: 15, w2: 5 }, { x: 40, y: 15 }],
        pocket: [{ x: 22, y: 6 }],
      });
    },
  };
  MAPPOS[gid] = [gcell[0], gcell[1], 1, 1];
  MAPPOS[tid] = [tcell[0], tcell[1], 1, 1];
  MAPPOS[did] = [dcell[0], dcell[1], 1, 1];
}

// KINGDOM 1 ENDS AT THIS SAGE, so its tunnel carries the ledger's own page
// rather than the generic Deaf System log: the meadow refuge log (t6) tells
// how the counting sage was carried under, sealed in the deep chamber, and
// kept a cell charged for whoever came with clean light — two rooms before
// she kneels in front of it, so the chamber is an arrival rather than a
// surprise. The other networks keep t5 until their kingdoms' own sessions
// write their pages.
ROOMS.GA1T.ents = ROOMS.GA1T.ents.map(e => (e[0] === 'term' ? ['term', e[1], e[2], 6] : e));

const gridCache = {};
function buildRoom(id) {
  if (gridCache[id]) return gridCache[id];
  const def = ROOMS[id];
  const g = mk(def.w, def.h);
  def.build(g);
  gridCache[id] = g;
  return g;
}
