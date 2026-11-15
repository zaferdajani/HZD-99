// Headless regression for the real moveEnt source. At the largest simulation
// step, terminal velocity moves feet 34 px through 32 px tiles. The collision
// resolver must stop on the first crossed surface instead of sampling only the
// final row. The browser harness exercises the assembled game separately.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'entities.js'), 'utf8');
const start = source.indexOf('function moveEnt(e, dt) {');
const end = source.indexOf('\n// WHAT STOPS A SHOT', start);
assert(start >= 0 && end > start, 'moveEnt source must remain extractable');
const moveEntSource = source.slice(start, end);

const context = { Math };
vm.createContext(context);
vm.runInContext(`
  const TILE = 32;
  let tileLinkOn = false;
  const player = {};
  let surface = 'floor';
  function setSurface(value) { surface = value; }
  function tileAt(_x, y) {
    if (surface === 'floor') return (y === 5 || y === 6) ? '#' : '.';
    if (surface === 'ledge') return y === 5 ? '#' : '.';
    if (surface === 'oneway') return y === 5 ? '=' : '.';
    return '.';
  }
  function solidAt(x, y) { const c = tileAt(x, y); return c === '#' || c === 'B'; }
  ${moveEntSource}
  globalThis.runMove = moveEnt;
  globalThis.chooseSurface = setSurface;
`, context);

const TILE = 32;
const top = 5 * TILE;
const drop = (surface, dt, thruPlat = false) => {
  context.chooseSurface(surface);
  let missed = 0;
  let worstSink = 0;
  for (let k = 0; k < 68; k++) {
    const phase = k / 2;
    const e = {
      x: 4, y: top - 1 - phase - 48, w: 24, h: 48,
      vx: 0, vy: 1020, on: false, noHeightfield: true, thruPlat
    };
    context.runMove(e, dt);
    const feet = e.y + e.h;
    if (e.vy !== 0) {
      if (feet > top) missed++;
      continue;
    }
    worstSink = Math.max(worstSink, feet - top);
  }
  return { missed, worstSink };
};

assert(1020 / 30 > TILE, 'premise: terminal fall crosses more than one tile per slow step');
for (const surface of ['floor', 'ledge', 'oneway']) {
  for (const dt of [1 / 30, 1 / 60]) {
    const result = drop(surface, dt);
    assert.equal(result.missed, 0, `${surface} must not be crossed at dt=${dt}`);
    assert(result.worstSink <= 1, `${surface} sink ${result.worstSink}px at dt=${dt}`);
  }
}

const deliberate = drop('oneway', 1 / 30, true);
assert(deliberate.missed > 0, 'thruPlat must preserve deliberate one-way descent');

console.log('PASS fallthrough contract: swept terminal falls stop on floor, ledge, and one-way; thruPlat remains deliberate');
