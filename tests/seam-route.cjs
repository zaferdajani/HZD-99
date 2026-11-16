// THE SEAM HAS A REASON (owner, 2026-11-16: "One portal transfers me to a room
// empty, except for another portal... what is the point of having them"). It
// was a bypass: Seam -> beacon hall, two rooms she could walk between. It is the
// quarrymen's HAUL ROAD now: its far ring runs to the quarry's loading floor and
// stands dark until the rhino is gone — the way BACK with the marble — and the
// cache on its high shelf is out of a jump's reach and inside a double jump's.
// Execute the real room builders and gate table without a browser.
const fs = require('node:fs'), path = require('node:path');
const vm = require('node:vm'), assert = require('node:assert/strict');
const read = file => fs.readFileSync(path.join(__dirname, '../js', file), 'utf8');
const game = read('game.js'), ctx = vm.createContext({ Math });
vm.runInContext(read('world.js'), ctx);
const start = game.indexOf('const GATE_ROOM = {');
const end = game.indexOf('\n};', start) + 3;
assert(start >= 0 && end > start, 'real gate table found');
vm.runInContext(game.slice(start, end), ctx);
const state = vm.runInContext(`({rooms: ROOMS, gates: GATE_ROOM,
  seam: buildRoom('CV1B'), hall: buildRoom('CV2'), quarry: buildRoom('CV3')})`, ctx);
const doors = id => Array.isArray(state.gates[id]) ? state.gates[id] : [state.gates[id]];
// ONE RING (owner, 2026-11-16, between two rings beside the marble: "why two
// portals"). The Seam's east ring ran for a day to the stone's side in CV3,
// nine tiles from the ring to the Sage's tunnel. It is withdrawn at both ends:
// the Seam is a side room with the way she came in and nothing else to walk into.
const home = doors('CV1B').find(d => d.to === 'CV1');
assert(home, 'original return preserved');
assert.equal(doors('CV1B').length, 1, 'the Seam has ONE ring: the way she came in');
assert(!state.gates.CV3 || !doors('CV3').some(d => d.to === 'CV1B'), 'no second ring stands beside the marble');
assert(!doors('CV1B').some(d => d.to === 'CV2'), 'the Seam no longer bypasses to the beacon hall');
assert(!state.gates.CV2 || !doors('CV2').some(d => d.to === 'CV1B'), 'the beacon hall has no ring to the Seam');
assert(state.rooms.CV1B.ents[0][0] === 'term' && state.rooms.CV1B.ents[0][3] === 'survey' && state.rooms.CV1B.ents[0][1] === 20, 'the seam hall keeps the slot its pod held, as the survey terminal');
assert(!state.rooms.CV1B.ents.some(e => e[0] === 'bench'), 'the seam hall is not a save point');
assert(state.rooms.CV2.ents.some(e => e[0] === 'bench'), "the cave's save point stands in the beacon hall, before the quarry");
assert.equal(state.rooms.CV2.exits.L, 'CV1', 'original main route preserved');
assert.equal(state.rooms.CV2.exits.R, 'CV3', 'material route preserved');
// the cache: last in the list (entity order is a save key), on a shelf a jump
// cannot reach and a double jump can (her jump rises 208 px, her double 321)
const ents = state.rooms.CV1B.ents, cache = ents[ents.length - 1];
assert(cache[0] === 'chest' && cache[3] === 'core', 'the cache is appended last');
const TILE = 32, cx = cache[1];
let shelf = -1; for (let y = cache[2]; y < state.seam.length; y++) if (state.seam[y][cx] === '=') { shelf = y; break; }
assert(shelf > 0, 'the cache sits on a shelf');
let floor = -1; for (let y = shelf + 1; y < state.seam.length; y++) if (state.seam[y][cx] === '#') { floor = y; break; }
// (a standing place: something solid with two tiles of air over it, below the shelf)
let best = floor; for (let x = cx - 9; x <= cx + 9; x++) for (let y = shelf + 1; y < state.seam.length; y++) { const ch = state.seam[y][x];
  if ((ch === '#' || ch === '=') && state.seam[y - 1][x] === '.' && state.seam[y - 2][x] === '.') { best = Math.min(best, y); break; } }
const rise = (best - shelf) * TILE;
assert(rise > 208 + 12, 'no standing place near the shelf puts it inside one jump (' + rise + ' px to climb)');
assert(rise < 321 - 16, 'a double jump reaches it (' + rise + ' px to climb)');
for (const [id, grid, gate] of [['CV1B', state.seam, home]]) {
  const tx = Math.round(gate.at * state.rooms[id].w);
  // the floor: the lowest rock with air on it
  const floorAt = (x) => { for (let y = grid.length - 1; y > 5; y--) if (grid[y][x] === '#' && grid[y - 1][x] === '.') return y; return -1; };
  const top = floorAt(tx);
  assert(top > 0, `${id}: the ring stands on ground`);
  for (let x = tx - 2; x <= tx + 2; x++) {
    const t2 = floorAt(x);
    assert.equal(t2, top, `${id}: the ring's pad is level at column ${x}`);
    for (let y = top - 5; y < top; y++) assert.equal(grid[y][x], '.', `${id}: approach ${x},${y} open`);
  }
  assert(!state.rooms[id].ents.some(e => ['bench', 'term', 'pillar', 'scrap'].includes(e[0])
    && Math.abs(e[1] - tx) < 3), `${id}: no static prop or collectible in the mouth`);
}
console.log('PASS: the Seam is a side room — one ring, a level pad, and a cache only a double jump reaches');
