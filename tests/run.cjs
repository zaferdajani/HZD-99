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
const { execFileSync, execSync, spawn } = require('child_process');
const fs = require('fs'), path = require('path');

// THE SERVER DIES. Not sometimes — regularly, mid-suite, and every time it
// does, a dozen harnesses report ERR_CONNECTION_REFUSED and the run reads as
// a code failure when it is an infrastructure one. So the runner OWNS the
// server now: before every harness it checks :8220 and revives it if it has
// gone, which turns "restart the server and rerun" from a human chore into a
// line of code.
function ensureServer() {
  try {
    execSync('curl -s -o /dev/null -m 2 http://127.0.0.1:8220/index.html', { stdio: 'ignore' });
    return;
  } catch (e) { /* dead or never started */ }
  const child = spawn('npx', ['http-server', '-p', '8220', '-s'],
    { cwd: path.join(__dirname, '..'), detached: true, stdio: 'ignore' });
  child.unref();
  execSync('sleep 4');
}

const SUITE = [
  ['regress',   'boots both builds, walks every room in ROOMS, watches for page errors'],
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
  ['ceiling',   'every kingdom has a roof that sheds its own weather, at every quality tier'],
  ['tutor',     'the waking floor teaches the whole loop: kill, take, spend, repair, think, spend'],
  ['tells',     'every boss wind-up carries BOTH channels — no silently one-channel telegraphs'],
  ['threat',    'threat concentration per screen, and the forbidden compositions'],
  ['errands',   'every errand has a goal that exists and can be reached'],
  ['deadend',   'no broken exits, no one-way doors, no unreachable rooms, every leaf pays'],
  ['padlife',   'a yanked controller releases the game; a live one keeps it'],
  ['climbout',  'every floor she can land on she can leave, and every gate names its power'],
  ['cover',     'the platform she is standing on stops a shot, from either side'],
  ['tap',       'tap where a thing is drawn and that thing happens'],
  ['bosspace',  'no guardian spends the fight standing still, measured against a moving player'],
  ['daze',      'a group of hits breaks NULLFANG open, pays out, closes, and cannot be held'],
  ['artbible',  'ART_BIBLE.md, measured: silhouettes differ, tells wear the amber, feet on the floor'],
  ['battery',   'one cell, one machine, and the shop waits for the lion'],
  ['minis',     "the Eye's five: they wake, telegraph, alternate, die and pay"],
  ['hzdvox',    'her voice: on the frame she moves, never clipping, never twice at once'],
  ['wolves',    'the pack, the Alpha and the flag that changes a whole species'],
  ['opening',   'she wakes, she walks, she arrives — and only then does anything move'],
  ['hero',      'her arm is ONE piece, she has two of them, nothing bolted on'],
  ['preload',   'the art for the rooms she can reach is fetched before she reaches them'],
  ['boot',      'a cold open spends what it needs and buys the rest behind itself'],
  ['lowres',    'the whole world at quarter size, and nothing sliced by pixel gets one'],
  ['demo',      'the free chapter ends at one door, and she can walk back in'],
  ['twin',      'the swirl: four passes, a ring not a punch, and two blades afterwards'],
  ['crystal',   'the purifier: gift, tree, reach, rising finisher, launcher, the throw that returns'],
  ['sage',      'the duelist that can only be cleansed: floor, lock, purity, tame, the once-paid gift'],
  ['platform',  'RULE ONE: web, phone, app and desktop shell are the same game'],
];

const want = process.argv.slice(2);
const run = SUITE.filter(([n]) => !want.length || want.includes(n));
let failed = 0;
for (const [name, what] of run) {
  const file = path.join(__dirname, name + '.cjs');
  if (!fs.existsSync(file)) { console.log('· ' + name + ' — missing'); continue; }
  console.log('\n── ' + name + '  — ' + what);
  ensureServer();
  try {
    console.log(execFileSync('node', [file], { encoding: 'utf8', timeout: 300000 }).trim());
  } catch (e) {
    failed++;
    console.log('FAILED: ' + (e.stdout || '') + (e.stderr || e.message));
  }
}
console.log('\n' + (failed ? failed + ' harness(es) failed' : 'all ' + run.length + ' harnesses ran'));
process.exit(failed ? 1 : 0);
