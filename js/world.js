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

// ents: [kind, tileX, tileYFeetOn, extra?, condFlag?]
const ROOMS = {
  // ============ ZONE A — Scrap Meadows ============
  A1: { zone: 'A', w: 30, h: 17, exits: { R: 'A2' },
    ents: [['npc', 6, 15, 'servo'], ['crawler', 18, 15], ['crawler', 24, 15], ['scrap', 12, 15, 10]],
    build(g) { frame(g); openR(g); hline(g, 5, 8, 12, '='); hline(g, 18, 21, 10, '='); } },
  A2: { zone: 'A', w: 60, h: 17, exits: { L: 'A1', R: 'A3', B: 'A5' },
    ents: [['crawler', 20, 15], ['flier', 30, 7], ['hopper', 46, 15], ['crawler', 52, 15], ['scrap', 8, 15, 8], ['scrap', 35, 11, 12]],
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
  A3: { zone: 'A', w: 30, h: 17, exits: { L: 'A2', R: 'A4', T: 'B1' },
    ents: [['bench', 8, 15], ['npc', 14, 15, 'ratchet']],
    build(g) {
      frame(g); openL(g); openR(g);
      hline(g, 18, 21, 12, '='); hline(g, 23, 26, 9, '='); hline(g, 19, 22, 6, '='); hline(g, 25, 28, 3, '=');
      rect(g, 25, 0, 28, 0, '.'); // ceiling opening to B1
    } },
  A4: { zone: 'A', w: 30, h: 17, exits: { L: 'A3' },
    ents: [['boss', 20, 15, 'glitch']],
    build(g) { frame(g); openL(g); hline(g, 4, 7, 11, '='); hline(g, 22, 25, 11, '='); } },
  A5: { zone: 'A', w: 30, h: 17, exits: { T: 'A2' },
    ents: [['chest', 20, 15, 'magnet'], ['term', 25, 15, 1], ['riddle', 15, 15, 0], ['scrap', 5, 15, 30], ['scrap', 7, 15, 25], ['scrap', 17, 15, 20]],
    build(g) {
      frame(g);
      hline(g, 2, 4, 12, '='); hline(g, 6, 8, 9, '='); hline(g, 9, 11, 6, '='); hline(g, 12, 14, 3, '=');
      rect(g, 12, 0, 14, 0, '.'); // ceiling opening back to A2
    } },
  // ============ ZONE B — Data Conduits ============
  B1: { zone: 'B', w: 30, h: 17, exits: { B: 'A3', R: 'B2' },
    ents: [['flier', 15, 6], ['turret', 5, 12], ['scrap', 22, 12, 10]],
    build(g) {
      frame(g);
      rect(g, 1, 12, 10, 14, '#');          // left tower
      rect(g, 19, 12, 28, 14, '#');         // right tower
      hline(g, 11, 18, 15, '^');            // spike gap (needs dash)
      rect(g, 25, 12, 28, 16, '.');         // shaft down to A3
      hline(g, 25, 28, 12, '=');
      rect(g, 29, 8, 29, 11, '.');          // exit R (upper level)
    } },
  B2: { zone: 'B', w: 60, h: 17, exits: { L: 'B1', R: 'B3', B: 'V2' },
    ents: [['turret', 20, 15], ['turret', 38, 15], ['flier', 33, 7], ['hopper', 45, 15], ['crawler', 50, 15], ['scrap', 14, 15, 10], ['riddle', 55, 15, 1], ['secret', 51, 10, 'collar']],
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
  B3: { zone: 'B', w: 30, h: 17, exits: { L: 'B2', R: 'B4', B: 'C1' },
    ents: [['bench', 12, 15], ['npc', 18, 15, 'mono'], ['term', 22, 15, 2], ['trial', 25, 15]],
    build(g) { frame(g); openL(g); openR(g); rect(g, 4, 15, 6, 16, '.'); } },
  B4: { zone: 'B', w: 30, h: 17, exits: { L: 'B3', R: 'B5' },
    ents: [['boss', 15, 15, 'brood']],
    build(g) {
      frame(g); openL(g);
      hline(g, 5, 8, 11, '='); hline(g, 21, 24, 11, '=');
      rect(g, 28, 11, 29, 14, 'B');         // secret wall → B5
    } },
  B5: { zone: 'B', w: 24, h: 17, exits: { L: 'B4', T: 'X1' },
    ents: [['chest', 12, 15, 'phantom'], ['scrap', 16, 15, 25], ['riddle', 19, 15, 2], ['vault', 21, 15]],
    build(g) {
      frame(g); openL(g); hline(g, 8, 15, 12, '=');
      // the secret shaft up to the Crystal Cache — the kingdom's true end,
      // beyond TALONHOST, behind a breakable ceiling
      rect(g, 6, 0, 8, 0, '.'); rect(g, 6, 1, 8, 1, 'B');
      hline(g, 3, 6, 11, '='); hline(g, 5, 8, 7, '='); hline(g, 4, 7, 4, '=');
    } },
  V1: { zone: 'X', w: 24, h: 17, exits: { L: 'B5' },
    ents: [['chest', 12, 15, 'rl:aegis'], ['scrap', 5, 15, 60], ['scrap', 8, 15, 60], ['scrap', 16, 15, 60], ['scrap', 19, 15, 40], ['term', 9, 15, 4]],
    build(g) { frame(g); openL(g); hline(g, 8, 15, 11, '='); } },
  // THE GROUNDED VAULT. There is no door and no key. The only way in is to
  // stand ON a live hazard rail — which is fatal without the Grounding Crest —
  // and cut through the brittle section of it. Until somebody does that, this
  // room does not exist on the map, because the map only ever draws rooms that
  // have actually been stood in.
  V2: { zone: 'X', w: 22, h: 17, exits: { T: 'B2' },
    ents: [['chest', 11, 15, 'nine'], ['scrap', 4, 15, 80], ['scrap', 17, 15, 80],
           ['scrap', 8, 11, 60], ['bench', 14, 15], ['term', 6, 15, 4]],
    build(g) {
      frame(g);
      rect(g, 9, 0, 12, 0, '.');            // the hole she cut, overhead
      hline(g, 6, 10, 11, '='); hline(g, 13, 17, 8, '=');
    } },
  // ============ ZONE X — Crystal Cache (secret) ============
  X1: { zone: 'X', w: 30, h: 17, exits: { B: 'B5' },
    ents: [['boss', 20, 15, 'prism'], ['chest', 24, 15, 'nine', 'bossPrism'], ['scrap', 4, 15, 20], ['riddle', 3, 15, 7]],
    build(g) {
      frame(g);
      rect(g, 6, 15, 8, 16, '.');           // floor opening back down to B5
      hline(g, 12, 17, 11, '='); hline(g, 20, 24, 8, '=');
    } },
  // ============ ZONE C — The Foundry ============
  C1: { zone: 'C', w: 30, h: 34, exits: { T: 'B3', B: 'C2' },
    ents: [['plat', 12, 22, [0, -8, 4.6, 2]], ['mod', 26, 18, 'wall'], ['flier', 15, 15], ['flier', 10, 25], ['turret', 20, 27], ['scrap', 3, 23, 15], ['riddle', 6, 23, 3], ['secret', 8, 23, 'sigil3']],
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
  C2: { zone: 'C', w: 60, h: 17, exits: { T: 'C1', R: 'C3', B: 'D1' },
    ents: [['plat', 33, 12, [5, 0, 3.6]], ['hopper', 16, 15], ['hopper', 42, 15], ['turret', 28, 15], ['blob', 55, 15], ['scrap', 5, 15, 12], ['npc', 25, 15, 'patch'],
           ['saw', 40, 15, [6, 0, 3.0]]],
    build(g) {
      frame(g); openR(g);
      rect(g, 22, 0, 25, 0, '.');           // ceiling opening from C1
      hline(g, 8, 13, 15, '^'); hline(g, 33, 38, 15, '^'); hline(g, 48, 52, 15, '^');
      hline(g, 9, 12, 11, '='); hline(g, 47, 52, 11, '=');
      rect(g, 18, 15, 20, 16, 'B');         // breakable floor → D1
    } },
  C3: { zone: 'C', w: 30, h: 17, exits: { L: 'C2', R: 'C4' },
    ents: [['boss', 22, 6, 'atlas'], ['plat', 7, 9, [9, 0, 4.2]]],
    build(g) {
      frame(g); openL(g);
      hline(g, 5, 8, 11, '='); hline(g, 21, 24, 11, '='); rect(g, 28, 11, 29, 14, 'B');
      hline(g, 19, 25, 6, '#');           // the dragon's roost ledge, high right
    } },
  C4: { zone: 'C', w: 20, h: 17, exits: { L: 'C3' },
    ents: [['chest', 10, 15, 'slot'], ['scrap', 14, 15, 40], ['riddle', 6, 15, 4]],
    build(g) { frame(g); openL(g); } },
  // ============ ZONE D — Frozen Archives ============
  D1: { zone: 'D', w: 30, h: 17, exits: { T: 'C2', R: 'D2' }, ice: true,
    ents: [['bench', 6, 15], ['npc', 12, 15, 'sage'], ['term', 24, 15, 3]],
    build(g) { frame(g); openR(g); rect(g, 18, 0, 20, 0, '.'); hline(g, 15, 18, 11, '='); } },
  D2: { zone: 'D', w: 60, h: 17, exits: { L: 'D1', R: 'D3' }, ice: true,
    ents: [['flier', 20, 6], ['flier', 40, 7], ['turret', 25, 15], ['turret', 44, 15], ['blob', 55, 15], ['plat', 30, 10, [6, 0, 3.4]], ['scrap', 41, 11, 15], ['riddle', 21, 8, 5], ['secret', 41, 12, 'coin'],
           ['saw', 19, 15, [7, 0, 3.4]]],
    build(g) {
      frame(g); openL(g); openR(g);
      hline(g, 10, 16, 15, '^'); hline(g, 30, 37, 15, '^'); hline(g, 46, 51, 15, '^');
      hline(g, 11, 15, 11, '='); hline(g, 46, 50, 11, '=');
      hline(g, 20, 23, 8, '='); hline(g, 40, 43, 12, '=');
    } },
  D3: { zone: 'D', w: 30, h: 17, exits: { L: 'D2', B: { to: 'E1', flag: 'bossZero' } }, ice: true,
    ents: [['boss', 15, 15, 'zero']],
    build(g) { frame(g); openL(g); hline(g, 5, 8, 11, '='); hline(g, 21, 24, 11, '='); rect(g, 15, 15, 17, 16, '.'); } },
  // ============ ZONE E — The Virus Nest ============
  E1: { zone: 'E', w: 30, h: 17, exits: { T: 'D3', R: 'E2' },
    ents: [['blob', 10, 15], ['blob', 20, 15], ['hopper', 25, 15], ['riddle', 5, 15, 6], ['npc', 13, 15, 'lumen']],
    build(g) { frame(g); openR(g); rect(g, 15, 0, 17, 0, '.'); hline(g, 6, 9, 11, '='); } },
  E2: { zone: 'E', w: 60, h: 17, exits: { L: 'E1', R: 'E3' },
    ents: [['plat', 22, 10, [5, 0, 2.8]], ['plat', 37, 12, [0, -4, 3.0]], ['turret', 31, 15], ['flier', 18, 6], ['flier', 34, 6], ['blob', 45, 15], ['bench', 52, 15], ['scrap', 11, 11, 20], ['secret', 17, 8, 'star'],
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
};

// map screen layout: [gridX, gridY, wCells, hCells]
const MAPPOS = {
  A1: [0, 3, 1, 1], A2: [1, 3, 2, 1], A3: [3, 3, 1, 1], A4: [4, 3, 1, 1], A5: [1, 4, 1, 1],
  B1: [3, 2, 1, 1], B2: [4, 2, 2, 1], B3: [6, 2, 1, 1], B4: [7, 2, 1, 1], B5: [8, 2, 1, 1], V1: [9, 2, 1, 1], V2: [5, 5, 1, 1],
  X1: [8, 1, 1, 1],
  C1: [6, 3, 1, 2], C2: [5, 5, 2, 1], C3: [7, 5, 1, 1], C4: [8, 5, 1, 1],
  D1: [5, 6, 1, 1], D2: [6, 6, 2, 1], D3: [8, 6, 1, 1],
  E1: [8, 7, 1, 1], E2: [9, 7, 2, 1], E3: [11, 7, 1, 1],
};

const gridCache = {};
function buildRoom(id) {
  if (gridCache[id]) return gridCache[id];
  const def = ROOMS[id];
  const g = mk(def.w, def.h);
  def.build(g);
  gridCache[id] = g;
  return g;
}
