// The entered Seam must lead onward, not only back to its entrance.
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
  seam: buildRoom('CV1B'), hall: buildRoom('CV2')})`, ctx);
const doors = id => Array.isArray(state.gates[id]) ? state.gates[id] : [state.gates[id]];
const onward = doors('CV1B').find(d => d.to === 'CV2');
const back = doors('CV2').find(d => d.to === 'CV1B');
assert(onward && back, 'Seam and beacon hall have reciprocal onward doors');
assert(doors('CV1B').some(d => d.to === 'CV1'), 'original return preserved');
assert(state.rooms.CV1B.ents.some(e => e[0] === 'bench' && e[1] === 20), 'save point preserved');
assert.equal(onward.at, back.ax, 'return lands at onward mouth');
assert.equal(back.at, onward.ax, 'onward lands at return mouth');
assert(!onward.need && !back.need && !onward.rubble && !back.rubble, 'no new lock');
assert.equal(state.rooms.CV2.exits.L, 'CV1', 'original main route preserved');
assert.equal(state.rooms.CV2.exits.R, 'CV3', 'material route preserved');
assert(onward.ax * state.rooms.CV2.w < state.rooms.CV2.ents.find(e => e[0] === 'term')[1],
  'arrival precedes beacon, rather than skipping the quest destination');
for (const [id, grid, gate] of [['CV1B', state.seam, onward], ['CV2', state.hall, back]]) {
  const tx = gate.at * state.rooms[id].w;
  assert.equal(tx % 1, 0, `${id}: gate aligned with authored anchor`);
  for (let x = tx - 2; x <= tx + 2; x++) {
    for (let y = 11; y <= 15; y++) assert.equal(grid[y][x], '.', `${id}: approach ${x},${y} open`);
    assert.equal(grid[16][x], '#', `${id}: anchored floor ${x}`);
  }
  assert(!state.rooms[id].ents.some(e => ['bench', 'term', 'pillar', 'scrap'].includes(e[0])
    && Math.abs(e[1] - tx) < 3), `${id}: no static prop or collectible in mouth`);
}
console.log('PASS: Seam onward/return route, quest order, anchored clearance and prop spacing');
