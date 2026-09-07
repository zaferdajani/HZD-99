// Run the real room generator and real heightfield builder. Hollow overhead
// pockets must not become a second floor blocking the route beneath them.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const path = require('node:path');
const ctx = vm.createContext({ G: { save: { broken: {} } } });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/world.js'), 'utf8'), ctx);
const src = fs.readFileSync(path.join(__dirname, '../js/game.js'), 'utf8');
vm.runInContext(src.slice(src.indexOf('const SURF_STEP'), src.indexOf('function surfaceCurve()')), ctx);
const result = vm.runInContext(`(() => {
  const problems = []; let columns = 0, rooms = 0;
  for (const id in ROOMS) {
    if (!ROOMS[id].cave) continue;
    rooms++; G.roomId = id; G.roomDef = ROOMS[id]; G.grid = buildRoom(id);
    const curve = buildSurfaceCurve(), g = G.grid;
    for (let x = 1; x < g[0].length - 1; x++) {
      let y = g.length - 1;
      while (y > 0 && g[y - 1][x] === '#') y--;
      if (!y) continue;
      // An actual platform immediately above the floor is a supported lip.
      if (g[y - 1]?.[x] === '=') y--;
      else if (g[y - 2]?.[x] === '=') y -= 2;
      const actual = curve.raw[x * TILE / SURF_STEP]; columns++;
      if (actual !== y * TILE) problems.push({id,x,actual,want:y*TILE});
    }
  }
  return {rooms, columns, problems};
})()`, ctx);
assert.equal(result.problems.length, 0, JSON.stringify(result.problems));
assert(result.rooms >= 20 && result.columns > 700);
console.log(`PASS: ${result.rooms} caves, ${result.columns} floor columns; overhead pockets never become ground`);
