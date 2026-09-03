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
  ['cutskip',   'a tap does not spend the story, and a film starts at its start'],
  ['frames',    'every verb is a move, not one pose held for a quarter second'],
  ['whatplays', 'every music cue resolves to the intended track'],
  ['overlap',   'never two music streams audible outside a cross-fade'],
  ['cuepitch',  'every written note is the strongest pitch in its own window'],
  ['cues',      'level, onset and length of each melodic cue'],
  ['herofoley', 'her authored move sounds decode with real signal in them'],
  ['feel',      'input latency, hit-stop and camera lead, as frames'],
  ['credits',   'every shipped sound traces to a line in assets/CREDITS.md'],
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
  ['openings',  'every boss move opens for at least one hit, and only the bait pays out three'],
  ['arc',       'the world notices, she changes on the victory, a death is a beat'],
  ['meet',      'it swats her aside and walks away, and she is still standing'],
  ['secrets',   'two hollow walls, a cellar hatch, and a pit only the dash crosses'],
  ['tails',     'every authored sound decays to silence instead of stopping'],
  ['kingdom',   'the kingdom protocol driven live: art, enemies, guardian, places, bench, every door walked, sound, music'],
  ['artbible',  'ART_BIBLE.md, measured: silhouettes differ, tells wear the amber, feet on the floor'],
  // grammar was the ACCEPTANCE TEST for task #76 (terrain depth): it landed
  // before the work it measures and read red on every sampled room, so it ran
  // without failing the build while the work caught up. It is green as of the
  // floating-deck fix (the ground curve no longer treats a mid-air platform as
  // the ground under it), the fringe moving onto the drawn silhouette, and the
  // depth plate mirroring alternate stamps. The flag is off; it guards like
  // everything else, and a room that goes flat again fails the build.
  ['grammar',   'ART_BIBLE §9/§10 measured on the ASSEMBLED FRAME: value bands, straight runs, corners, skirts, tiling'],
  ['battery',   'one cell, one machine, and the shop waits for the lion'],
  ['minis',     "the Eye's five: they wake, telegraph, alternate, die and pay"],
  ['hzdvox',    'her voice: on the frame she moves, never clipping, never twice at once'],
  ['wolves',    'the pack, the Alpha and the flag that changes a whole species'],
  ['gait',      'she runs ON the ground: no bouncing, no falling plate mid-stride'],
  ['motion',    'the fired guardian plates are on screen, not just in the manifest'],
  ['tinker',    "Ratchet's plate set is seven poses, not one picture seven times"],
  ['folk',      'the machine folk have jobs, and no two of them share a beat'],
  ['rubble',    'the first tunnel is buried, it calls, and it takes the blade'],
  ['cavedark',  'the cave is dark, and light is the only map of it'],
  ['terrainrun', 'irregularity is not elevation: she runs it, and so do they'],
  ['reach',     'she hits what she is standing next to, and she turns to it'],
  ['gatecue',   'the first built thing the player finds sounds like one'],
  ['cuefamily', 'the things she is shot at with do not all sound alike'],
  ['shopread',  'a structure she can enter is never the wall behind it'],
  ['beacon',    'a marker lights the way TO a character, never over one'],
  ['doorway',   'the painted door is where she walks in, not the wall beside it'],
  ['cross',     'a room crossing is a move, not a cut'],
  ['seam',      'a room boundary is a place she walks through, not a door'],
  ['mapgrid',   'two rooms cannot stand on the same square of the map'],
  ['glowcost',  'the most expensive thing the renderer does, counted'],
  ['meadow',    'the greenery keeps its colour all the way to the screen'],
  ['npcstrip',  'the five work strips are twelve frames of work, foot-aligned and steady'],
  ['opening',   'she wakes, she walks, she arrives — and only then does anything move'],
  ['hero',      'her arm is ONE piece, she has two of them, nothing bolted on'],
  ['preload',   'the art for the rooms she can reach is fetched before she reaches them'],
  ['boot',      'a cold open spends what it needs and buys the rest behind itself'],
  ['lowres',    'the whole world at quarter size, and nothing sliced by pixel gets one'],
  ['demo',      'the free chapter ends at one door, and she can walk back in'],
  ['twin',      'the swirl: four passes, a ring not a punch, and two blades afterwards'],
  ['crystal',   'the purifier: gift, tree, reach, rising finisher, launcher, the throw that returns'],
  ['sage',      'the duelist that can only be cleansed: floor, lock, purity, tame, the once-paid gift'],
  ['kingdom1',  'kingdom 1 holds its rules: the den rest catches deaths, the tunnel tells the sage, NPCs own their places'],
  ['memnote',   'the memory game is audible: phone-register bells, and the music steps aside'],
  ['platform',  'RULE ONE: web, phone, app and desktop shell are the same game'],
  ['packs',     'a campaign pack is a folder of JSON: loads by query, saves apart, base game untouched'],
  ['warp',      "?room= drops the owner into any room: locked, loud when refused, and never his save"],
  ['denlight',  'every interior at full glow, the way a strong phone shows it: lit, not a disc'],
  ['bake3d',    'any authored GLB bakes to a turnaround the atlas can wear: grounded, rotating, silhouettes apart'],
  ['forge',     'the Forge: gated to the owner, every op changes the live world, main rooms edit like DLCs'],
];

const want = process.argv.slice(2);
const run = SUITE.filter(([n]) => !want.length || want.includes(n));
let failed = 0, pending = 0;
for (const [name, what, opt] of run) {
  const file = path.join(__dirname, name + '.cjs');
  if (!fs.existsSync(file)) { console.log('· ' + name + ' — missing'); continue; }
  console.log('\n── ' + name + '  — ' + what);
  ensureServer();
  try {
    console.log(execFileSync('node', [file], { encoding: 'utf8', timeout: 300000 }).trim());
  } catch (e) {
    if (opt && opt.pending) {
      pending++;
      console.log('PENDING (' + opt.pending + '): ' + (e.stdout || '') + (e.stderr || e.message));
    } else {
      failed++;
      console.log('FAILED: ' + (e.stdout || '') + (e.stderr || e.message));
    }
  }
}
console.log('\n' + (failed ? failed + ' harness(es) failed' : 'all ' + run.length + ' harnesses ran')
  + (pending ? ' (' + pending + ' pending, see suite notes)' : ''));
process.exit(failed ? 1 : 0);
