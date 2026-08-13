// The suite. Every one of these harnesses started life as the answer to a
// specific "is this actually working?" — and every one of them has caught at
// least one thing that reading the code did not. They all drive the REAL build
// in a real browser; none of them tests a copy of the logic.
//
//   node tests/run.cjs            everything
//   node tests/run.cjs saw cues   just those
//
// A local server must be serving the repo root on :8220 —
//   npx http-server -p 8220 -s &
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');

const SUITE = [
  ['regress',   'boots both builds, walks all 24 rooms, watches for page errors'],
  ['wake',      'the opening: film, waking floor, move -> jump -> scratch -> out'],
  ['lesson',    'every power teaches itself and completes on real use'],
  ['nodes',     'all eight Mind Nodes open a puzzle and pay out'],
  ['film',      'the intro reel plays all eight shots without falling back'],
  ['whatplays', 'every music cue resolves to the intended track'],
  ['overlap',   'never two music streams audible outside a cross-fade'],
  ['cuepitch',  'every written note is the strongest pitch in its own window'],
  ['cues',      'level, onset and length of each melodic cue'],
  ['slashsnd',  'the claw: onset, separate passes, heavy third hit'],
  ['voxmeas',   'the NPC voice chain: no clipping, band limit, speech intact'],
  ['speed2',    'movement speed is identical from 12 to 144 fps'],
  ['saw',       'the chainsaw rig: sparks, impacts, contact damage'],
  ['combat',    'every enemy telegraphs, does something different, and scales by zone'],
  ['pace',      'the game-speed dial slows the simulation and nothing else'],
];

const want = process.argv.slice(2);
const run = SUITE.filter(([n]) => !want.length || want.includes(n));
let failed = 0;
for (const [name, what] of run) {
  const file = path.join(__dirname, name + '.cjs');
  if (!fs.existsSync(file)) { console.log('· ' + name + ' — missing'); continue; }
  console.log('\n── ' + name + '  — ' + what);
  try {
    console.log(execFileSync('node', [file], { encoding: 'utf8', timeout: 300000 }).trim());
  } catch (e) {
    failed++;
    console.log('FAILED: ' + (e.stdout || '') + (e.stderr || e.message));
  }
}
console.log('\n' + (failed ? failed + ' harness(es) failed' : 'all ' + run.length + ' harnesses ran'));
process.exit(failed ? 1 : 0);
