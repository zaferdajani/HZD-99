// The suite. Every one of these harnesses started life as the answer to a
// specific "is this actually working?" — and every one of them has caught at
// least one thing that reading the code did not. They all drive the REAL build
// in a real browser; none of them tests a copy of the logic.
//
//   node tests/run.cjs            everything
//   node tests/run.cjs saw cues   just those
//
// A local server must be serving THIS checkout's root on :8220 —
//   npx http-server -p 8220 -s &
// and the runner proves it is this checkout before trusting it (see
// servedCheck below): a different build on the port refuses the run.
const { execFileSync, spawn, spawnSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const identity = require('./served-identity.cjs');

// THE SERVER DIES. Not sometimes — regularly, mid-suite, and every time it
// does, a dozen harnesses report ERR_CONNECTION_REFUSED and the run reads as
// a code failure when it is an infrastructure one. So the runner OWNS the
// server now: before every harness it checks :8220 and revives it if it has
// gone, which turns "restart the server and rerun" from a human chore into a
// line of code.
function ensureServer() {
  try {
    execFileSync('curl', ['--noproxy', '*', '-fs', '-o', require('os').devNull, '-m', '2', 'http://127.0.0.1:8220/index.html'], { stdio: 'ignore' });
    return;
  } catch (e) { /* dead or never started */ }
  const child = spawn(process.execPath, [path.join(__dirname, 'serve.cjs')],
    { cwd: path.join(__dirname, '..'), detached: true, windowsHide: true, stdio: 'ignore' });
  child.unref();
  for (let attempt = 0; attempt < 20; attempt++) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
    try {
      execFileSync('curl', ['--noproxy', '*', '-fs', '-o', require('os').devNull, '-m', '2', 'http://127.0.0.1:8220/index.html'], { stdio: 'ignore' });
      return;
    } catch (_) { /* wait for the local server */ }
  }
  throw new Error('Local test server failed to start on 127.0.0.1:8220');
}

// ...AND A LIVE SERVER IS NOT NECESSARILY OURS. ensureServer() only asks
// "does something answer"; several worktrees and sessions serve on :8220, so
// "something" can be another checkout's build, and every browser harness
// would then pass or fail about code that is not this code (audit QA-04).
// The first check pins the build: this checkout's pages and a few loose
// assets, hashed from disk, must be byte-identical to what is served. Every
// later check compares against that SAME snapshot, not against disk again —
// a rebuild of these very pages mid-run changes disk and server together and
// would otherwise look consistent while half the suite tested one build and
// half another. SERVED_IDENTITY_EXPECT=<snapshot.json> supplies the pin from
// outside (tools/studio/audit.py pins once for its whole multi-run audit).
let SNAP = null, SNAP_FILE = null;
function dropSnapshot() {
  if (SNAP_FILE && !process.env.SERVED_IDENTITY_EXPECT) { try { fs.rmSync(path.dirname(SNAP_FILE), { recursive: true }); } catch (e) {} }
}
function servedCheck(when) {
  if (!SNAP) {
    SNAP_FILE = process.env.SERVED_IDENTITY_EXPECT || null;
    if (SNAP_FILE) SNAP = JSON.parse(fs.readFileSync(SNAP_FILE, 'utf8'));
    else {
      SNAP = identity.diskSnapshot();
      SNAP_FILE = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'served-identity-')), 'snapshot.json');
      fs.writeFileSync(SNAP_FILE, JSON.stringify(SNAP));
    }
  }
  // a child process because the check is async (http) and this loop is not;
  // it costs ~0.1 s against harnesses that take tens of seconds
  const r = spawnSync(process.execPath, [path.join(__dirname, 'served-identity.cjs'), '--expect', SNAP_FILE, '--json'],
    { encoding: 'utf8', timeout: 60000, maxBuffer: 10 * 1024 * 1024 });
  let res = null; try { res = JSON.parse(r.stdout); } catch (e) { /* reported below */ }
  if (r.status === 0 && res && res.ok) return true;
  if (!res) { console.error('SERVED BUILD UNVERIFIED ' + when + ': ' + (r.stderr || (r.error && r.error.message) || 'no result')); return false; }
  let cause = '';
  try {
    const now = identity.diskSnapshot(SNAP.root);
    const moved = Object.keys(SNAP.files).filter(p => !now.files[p] || now.files[p].sha256 !== SNAP.files[p].sha256);
    cause = moved.length ? '\n  this checkout\'s own files changed on disk since the build was pinned: ' + moved.join(', ')
      + ' (someone rebuilt it during the run)' : '';
  } catch (e) { /* the report above already says what differs */ }
  console.error(identity.report(res, when) + cause);
  return false;
}

const SUITE = [
  ['combat-impact-contract', 'armor, protected contacts, charged weight and bounded combat ledger', {noBrowser:true}],
  ['combat-impact-browser', 'rendered hit flash and finite hardware particles, charged weight, equipped stats and ledger export'],
  ['purification-controls', 'mobile hold/cancel, focus-loss safety and restored save'],
  ['purification', 'deliberate guardian rescue hold, cancellation, choreography and protected rewards'],
  ['combat-impact-input', 'real keyboard tap and held charge through the normal game loop in a staged arena'],
  ['wrist-release', 'supplied Ratchet reaction, real contact, skip, saved interruption and unchanged rewards'],
  ['repair-browser', 'Ratchet drag controls, page reload and interrupted boot in the assembled game'],
  ['repair-lifecycle', 'Ratchet puzzle, interrupted visits, saved placements and story reward handoff', {noBrowser:true}],
  ['lion-studio', 'Nullfang motion clocks, planted gait, attack cadence and creature cue ownership'],
  ['lion-motion', 'Nullfang in the real loop: the filmed turn, committed launches, one spot and one colour across takes, the shader effects layer'],
  ['boss-hitfeel', 'all thirteen bosses: a blow in any opening steps them back, never moves a wind-up, always rings, flashes and throws scrap; and each one\'s blow freezes, lights and throws her', { timeout: 900000 }],
  ['first-foe', 'her first fight can be won: the opening\'s first machine stands on level ground and keeps to it, stings at full health, and at two cores loses its sting but can still be hit and broken — desktop and phone size', { timeout: 300000 }],
  ['hit-voices', 'a blow sounds like the body it landed on: wolves, cats, wings, robes, housings and gel answer with different voices, each rendered and measured apart in pitch band or length; guardians keep their clang, steel drones keep the ring; the Alpha\'s howl is a real voice, heard from the den\'s mouth and the moment she is through'],
  ['gear-how', 'the Inventory points at Gear and the Gear key goes there; Gear lists her blades (Enter equips one she owns), each suit a guardian left her (Enter wears it, again takes it off), and every part she has says the key that uses it in her own bindings'],
  ['alpha-run', 'the road to the Wolf King: the den\'s mouth opens onto the Run and the Run onto his floor, and back; at least six wolves posted along it; three hulks and a tooth-pit; she crosses on her feet and a plain jump; a wolf comes over a hulk after her; his arena is untouched'],
  ['pure-gift', 'a purified machine gives something back: the first gives a core she keeps; each one after says the count and how many to the next gift; the ladder pays again at 3 and 6; nothing pays twice; the word is purify in five languages'],
  ['ring-pads', 'rings stand on level ground and apart; no deck hangs over ground that rose under it (the first-jump step and the den table stay); the teeth close the picture and set her down where she last stood, never back in from the top; the Alpha climbs its own arena'],
  ['ring-wake', 'a ring a fight opens stands dark and refuses her; with the fight won it is woken once in front of her with her controls held and its field rising; the save remembers; a finished keeper\'s chamber is not offered again; the comic that replayed the purification is library-only'],
  ['shop-ask', 'the shop opens as a question; a mashed key on it buys nothing; the shelf marks Ratchet\'s pick with a reason; a first purse does not buy the shelf; a guardian that goes pays scrap'],
  ['turn-roar', 'GRAVEHORN turns through three-quarter and head-on plates, never edge-on, keeping his height and his feet; at the first meeting NULLFANG lands, roars and the roar holds her for about a second; on his ledge he dives at once when she stands under it or strikes him, with the full warning'],
  ['map-read', 'the map charts each room as its cavity, finer than a tile and soft-edged, with walls that wander; YOU ARE HERE covers a real patch of screen at any zoom; the errand\'s room wears a gold mark'],
  ['fired-art', 'each of the seven agents wears its own eight plates in its own chamber at one size in both drawings, no two alike, with nothing drawn round an infected one, and a chamber with no set keeps the shared one; a deck is an opaque object plate in the city, the caves and the Conduits and never in an interior or NOSTOS; a beaten cat plays its filmed fold to the last cell; the Oracle rests and speaks through his own plates'],
  ['agent-rig', 'an agent posed from one sheet of parts: every move a whole body at the plates\' size with its feet on the floor, no frame jumps between moves and settled within half a second, the wind-up said in light, purified by going blue; and THE MIX that ships: standing, walking and the way into every big pose are the rig, the pose once reached is its fired plate faded in over it, with a whole body in every frame'],
  ['pod-door', 'in every room of both builds a save pod is clear of every door its room can ever have and of every other thing she can interact with; on the Alpha road and in the Oracle corridor rest and enter are two places'],
  ['voice-heard', 'the Alpha howl is the loudest thing in the room and mostly above 400 Hz, every move he makes is as loud as her own hit, every guardian wind-up cue and roar clears the same floor without clipping, the score steps back under a roar and returns; a dead stream is rebuilt, a stream that keeps dying hands over, a suspended audio context is woken'],
  ['panel-continuity', 'every comic panel that plays before the blade is forged is declared empty-handed against the md5 of the picture that was looked at; the corridor meeting draws NULLFANG from his own gunmetal panel'],
  ['media-container', 'no shipped track or film is a fragmented MP4 and every one carries its index before its data, so a phone player starts it at once, seeks it and loops it; every track the game can ask for is on disk in that form'],
  ['sharp', 'a projectile that wears a sprite hurts along its whole drawn length: the eagle feather, the void lance and the ice shard are drawn, measured off the pixels and set against where they hurt, at the tip and the tail and not beside; a plain round shot is unchanged'],
  ['no-rim-baked', 'no keyed character plate carries a cyan rim on its outer edge that its inside does not have: the cheetah, the guard and the roster sheet stay clean, and what is cyan by design is still cyan'],
  ['rotate', 'on a phone, both builds: opened upright it asks to be turned, turned it brings the game up and a tap reaches it, upright and round again it follows every time, and opened in landscape it never asks'],
  ['ledger', 'the rules file opens with what the owner has had to repeat, each row with a count, his words and a harness or skill that exists, worst first; the correction procedure is there; the file stays under 160 lines and every section that was moved out is where the index says'],
  ['gravehorn-ground', 'GRAVEHORN\'s floor runs to the back wall and the stone stands at the end of it; standing at the stone (or anywhere) is no place to sit the fight out; the stone does not break while he lives; a real win is recorded; the save where the marble was taken mid-fight is put right, and the saves where it was not are left alone', { timeout: 420000 }],
  ['cheetah-hunt', 'the cheetahs hunt like cheetahs: watched, it holds; unwatched, it creeps in at a walk; its patience runs out; inside sprinting distance it runs at more than twice its patrol; overshooting, it skids; no warning is shortened and the winded window stands; ON GUARD — it backs up facing her and never walks with its back to her, its stride running backwards; the leaping cat keeps the same guard; the wolves are untouched', { timeout: 300000 }],
  ['seam-backdrop', 'the frame she crosses a shaft\'s line is a frame like any other: the picture above the seam changes no more than on the frames round it (and several times as much with the neighbour\'s backdrop switched off), no canvas is read back for 0.6 s after the line, and the room she leaves had its neighbour-fringe grown before she left', { timeout: 300000 }],
  ['sword-edge', 'a blade out-reaches a paw and its charged cut is its own: the single blade\'s far edge is a quarter past the claws\' on the jab and the finisher, the joined blade past that, the drawn cut scaled out with it; held and let go the single blade throws the crescent — more than twice the burst\'s radius, each thing in its line once, nothing behind her, stopped by a wall — and the claws\' charge is still the burst', { timeout: 300000 }],
  ['marble-seat', 'the raw marble stands on the quarry floor under it (it hung 18-23 px over a hollow), she stands beside it at its base, the charged claw takes it from there, and the stump is on the same ground', { timeout: 300000 }],
  ['boss-skill', 'a guardian is a test of skill, measured by three bots on the real build: one that only presses ATTACK and one that bounces on its back both LOSE to the Wolf King, the one that reads its wind-ups WINS in a real fight with cores to spare — and winning it means having been shown the howl, the rend, the leap, the roar, claw and bite, the spring and the fury\'s chained pounces; and GRAVEHORN beats the same two — his toss is not turned by a mash, and struck from above he bucks', { timeout: 900000 }],
  ['ring-gate', 'every door is a machine ring, and the errand points at its own: each walk-in passage of the chapter stands its fired ring in the cast\'s plane and the ring owns the picture there; each plate\'s hole re-measured matches the table and the live field shows through it and nowhere else; the Wolf King\'s door is the fanged ring; a buried ring is dead until the rubble breaks; no outline pass exists; from the meadow the route\'s next step, followed room by room, arrives at the keeper, pointed at, through the gold ring; nothing is pointed at mid-conversation', { timeout: 300000 }],
  ['bound-cue', 'a machine she can free says so: with the blade every bound body wears a marker (none without it, none once freed), the prompt is offered at the edge of the body that is drawn and names her own control, and the press frees it from there — the pack in the meadow and the cave', { timeout: 300000 }],
  ['decode-ahead', 'art is decoded before it is drawn: a sheet arrives with its pixels made off the main thread (first draw a fraction of a cold one, same picture), far-room art is decoded when she comes within a door, the memory ceiling holds and a closed sheet still draws, the packaged app\'s rooms are ready moments after entry, and the brightness probe reads the canvas back a sixth as often', { timeout: 300000 }],
  ['plunge', 'the way down: a down-strike thrown at any point of a jump reaches the floor, the meadow\'s hatch opens in one strike (or DOWN + ATTACK standing on it) and drops her into the room below, the room points at it while the marble is the errand, the buried mouth leads on to the cave — and the dive is drawn as a dive in every weapon form: its own strip, a blue meteor on the way down, blue back up where it lands, never the slash\'s rake', { timeout: 300000 }],
  ['boss-fx', 'the five sages after NULLFANG and the micro-bosses: every wind-up gathers light for as long as it runs, every strike that follows fires an effect at the body, a walker\'s hard landing goes through the ground, and nothing is drawn wider than the body', { timeout: 900000 }],
  ['alpha-kit', 'the Wolf King\'s own moves: the rend runs the ground and is jumped, the fury follows the midpoint and throws without hurting, a fury leap\'s quake is painted where it lands, and every old move wears an effect and a sound', { timeout: 420000 }],
  ['wolf-hunt', 'a pack wolf hunts: threat display, charge, stalk, a bite from the distance its lunge covers, the bite held and thrashed, at bay at a ledge, the roll under her finisher — tell and opening unchanged', { timeout: 420000 }],
  ['solid-enemies', 'she cannot walk through a hostile body: it stops her at its drawn edge, she can jump it, bound machines do not block, and a pounce still lands', { timeout: 420000 }],
  ['solid-bodies', 'a machine keeps its pigment under the room\'s light, its cut-out has no window through it, and ground effects follow the terrain'],
  ['ios-ready', 'the Xcode project, icon and privacy manifest meet the App Store\'s checks; every Ogg has an AAC copy and an iPhone is handed it'],
  ['story-opening', 'survivor histories and earned Sage/CHIME route', {noBrowser:true}],
  ['story-order', 'the story sheet walked through the real build: beat order, gates, named things, migration'],
  ['caves-ch1', 'every chapter-one cave pays something of its own; early finds remembered; a rescue never looks like a kill'],
  ['survey-a7', "Ratchet's shaft errand is finished by reading the A7 survey, not by entering the room; early reads remembered; old saves keep what they earned"],
  ['den-gate', "the lion's den and the bell, every entrance, dash/jump bypass and save/load, before and after their milestones"],
  ['comic-rewards', 'saved milestone slideshows, updates, accessibility and failure recovery'],
  ['story-battery', 'unique workshop battery and legacy save compatibility'],
  ['story-rescue', 'recoverable machines and persistent cleansing'],
  ['story-meeting', 'interactive guardian warning and real contact'],
  ['first-sage-route', 'pre-guardian route through quarry maintenance passage'],
  ['script-route', 'the story script draws the route the game plays', {noBrowser:true}],
  ['guardian-break', "comic page 29: NULLFANG lets go, and the bell writes the order back"],
  ['sage-quiet', "comic page 26: the sage's promise closes its end of the network"],
  ['mobile-platform', 'the shipped touch recognizer and the two-state pause, in both built pages'],
  ['gesture-input', 'the picture answers taps and swipes, and nothing the controller owns changes'],
  ['input-contract', 'one struct the game reads: the devices unchanged, and a struct alone can play'],
  ['winch-integration', 'modular yard machine and persistent cleansing'],
  ['winch-purpose', 'the jammed winch arm blocks the road, every strike knocks scrap she collects, the burst lifts the arm; reloads and NOSTOS unaffected'],
  ['manhwa-reader', 'revised illustrated edition and complete written opening'],
  ['panels', 'approved manhwa crops at story moments: once, safe, readable, skippable, replayable'],
  ['entrance-integration', 'painted entrances share world anchors without duplicate mouth overlays'],
  ['hero-cache-regression', 'third-hit cached sheet geometry and supplied idle in every mood'],
  ['scratch-visual', 'pixel-measured cyan scratch reach, mirroring and fading recovery'],
  ['scratch-reach', 'scratch contact boundary, facing and non-damaging recovery wake', { noBrowser: true }],
  ['hero-move-coverage', 'actual renderer coverage for movement, aerial attacks, reactions and departure'],
  ['hero-feedback', 'haptic device routing and duplicate pulse suppression', { noBrowser: true }],
  ['hero-delivery', 'source provenance, frame gutters, scale and floor registration', { noBrowser: true }],
  ['hero-frame-alpha', 'discrete sprites never blend into doubled silhouettes', { noBrowser: true }],
  ['hero-alpha', 'original transparent artwork retains its dark visor', { noBrowser: true }],
  ['tutorial-controller', 'complete production tutorial, contextual locks and transition recovery', { noBrowser: true }],
  ['offline-release', 'scoped version cache, media seeking and storage-denied fallback', { noBrowser: true }],
  ['release-polish', 'cold artwork, actual screen scale, camera, input edges, workshop and movies'],
  ['chapter-one', 'one earned rescue, quarry, forge and sage save chain'],
  ['sage-specials', 'charged attacks obey purification and protected-target rules', { noBrowser: true }],
  ['tutorial-clarity', 'one contextual action, one marker and saved lesson continuity', { noBrowser: true }],
  ['story-progression', 'battery, earned forge and sage/weapon story ordering', { noBrowser: true }],
  ['input-focus', 'focus loss clears input and cancelled touches cannot fire', { noBrowser: true }],
  ['voice-handoff', 'foreground voice ownership across actions and charge', { noBrowser: true }],
  ['desktop-protocol', 'desktop local origin, media streaming and path confinement', { noBrowser: true }],
  ['cave-passage', 'real cave traversal and reciprocal gate walks'],
  ['cave-ground', 'overhead pockets never become cave floor', { noBrowser: true }],
  ['seam-route', 'Seam onward route, quest order and anchored doors', { noBrowser: true }],
  ['shadow-ground', 'contact shadows follow real terrain and platforms', { noBrowser: true }],
  ['visual-depth', 'alpha-safe scenery tint, fixed architecture and low-tier light'],
  ['dialogue-audio', 'story voice priority, text-matched NPC lines and asynchronous cancellation', { noBrowser: true }],
  ['weapons', 'sword ownership, migration, permanent dual mode and real charged input', { noBrowser: true }],
  ['gear', 'physical equipment progression, saved loadout and input geometry', { noBrowser: true }],
  ['motion-sampling', 'static clips rejected and full action windows retained', { noBrowser: true }],
  ['combo-routing', 'real player inputs select jab, cross, uppercut and the charged burst', { noBrowser: true }],
  ['regress',   'boots both builds, walks every room in ROOMS, watches for page errors'],
  ['wake',      'the opening: film, waking floor, move -> jump -> gates -> straight into Ratchet\'s booth'],
  ['lesson',    'every power teaches itself and completes on real use'],
  ['nodes',     'all eight Mind Nodes open a puzzle and pay out'],
  ['memnode-retry', 'copying the lights never answers, and a miss at a Mind Node asks again instead of ejecting her'],
  ['denfloor', 'the den stands on one floor — her, the tinker and the table — and a door is a two-second run'],
  ['cadence', 'chapter one never goes flat: every room on the critical path gives her something she has not met, and a breath has to be earned'],
  ['glimpse', 'NULLFANG is seen before he is met: a head at the edge of the frame past the gates, one roar, gone east — once, and it takes nothing from her'],
  ['pet-motion', 'a freed guardian moves like itself: no answer tips, squashes or lifts its picture, the lion roars his own take, and no bloom, ring or halo rings a purified body'],
  ['fight-seal', 'no running from a fight: every boss room\'s rings sleep while the boss fights and wake when it is purified; the howl\'s shove is a braced skid, never a walk she did not ask for'],
  ['pack-call', 'the pack answers her: the Alpha\'s yield puts THE PACK on her wheel; cast, one wolf comes in on its feet, hunts and bites what hunts her for ten seconds, never touches her, and lopes off'],
  ['alpha-bow', 'the yielded Alpha backs off with its face to her and bows (its filmed yield); three of the pack come in behind it, face her and go down together; once per save'],
  ['tallyman', 'TALLYMAN is a fight: half as much again to break, a quicker mind, three lunges below half health, and a blow stops him where he stands instead of sliding him'],
  ['hero-still', 'standing still she is one drawing: the frames off a lip and a fidget whose take is not here both stay on her filmed idle, never the old pose-sheet still'],
  ['ch2-road', 'chapter two is played in order: the CARRIER, then the gallery ring it wakes down to UNDERTOW, then TALONHOST\'s hall; the arrow leads each step; a loading ring draws no stand-in'],
  ['hit-voices', 'the Alpha and its pack play recorded wolves (the howls real, public domain); every body and guardian has its own bank of recorded impacts, never the same take twice running'],
  ['prize', 'the first room shows a prize she cannot reach: every real jump misses it, the double jump lands on it, and it is in the frame'],
  ['bossbench', 'a save point near every boss — one door away or a short walk through one more — and nowhere else: every pod is near a boss, the den\'s, in a Sage\'s cave or at the bottom of a one-way drop, no two a short walk apart, and each standing clear on something'],
  ['grounded', 'every cannon is bolted to something and every trap has ground under it, room by room'],
  ['dighub', 'the hub hatch: nothing shown before the lion (no light, no crack, no prompt), and after him the lit floor breaks into the first cave'],
  ['camjump', 'a jump does not move the frame; landing, falling and the top edge do'],
  ['padfeel', 'on a controller: the stick runs, the Mind Nodes do not slip, prompts show the shapes, and yalla waits for real idleness'],
  ['impatient', 'arms crossed and a tapping foot over "yalla": wired, paced, turned with her — and inert until its sheet is approved'],
  ['text-budget', 'chapter one says less and shows more: short lines in five languages, no sentence on the chip, a ring for a held key, Ratchet over pictures'],
  ['route-arrow', 'the way arrow leads on through the rooms to each goal\'s real place, never back to the door she came in by'],
  ['lives', 'a life is a sage\'s: the ladder, the chests and the spoils pay none; Ratchet\'s one spare is dear and waits for a sage'],
  ['toolbox', 'his battery is in the toolbox on the den floor: the words, the comic panel, the fired plate, its light — and never the work table'],
  ['film',      'the intro reel plays all eight shots without falling back'],
  ['filmflow',  'the opening plays as one film: no black, no caption freeze, between shots'],
  ['cutskip',   'a tap does not spend the story, and a film starts at its start'],
  ['frames',    'every verb is a move, not one pose held for a quarter second'],
  ['whatplays', 'every music cue resolves to the intended track'],
  ['overlap',   'never two music streams audible outside a cross-fade'],
  ['cuepitch',  'every written note is the strongest pitch in its own window'],
  ['cues',      'level, onset and length of each melodic cue'],
  ['herofoley', 'her authored move sounds decode with real signal in them'],
  ['feel',      'input latency, hit-stop and camera lead, as frames'],
  ['attacks',   'one claw stat, a row per move: damage unchanged, knockback per attack, multi-hits on a clock that freeze once'],
  ['credits',   'every shipped sound traces to a line in assets/CREDITS.md'],
  ['brand',     'every release surface carries the studio name'],
  ['slashsnd',  'the claw: onset, separate passes, heavy third hit'],
  ['voxmeas',   'the NPC voice chain: no clipping, band limit, speech intact'],
  ['speed2',    'movement speed is identical from 12 to 144 fps'],
  ['saw',       'the chainsaw rig: sparks, impacts, contact damage'],
  ['boss-counters', 'committed targets and visible decoy projectile origins in both phases'],
  ['combat',    'every enemy telegraphs, does something different, and scales by zone'],
  ['pace',      'the game-speed dial slows the simulation and nothing else'],
  ['ceiling',   'every kingdom has a roof that sheds its own weather, at every quality tier'],
  ['ceillock',  'the roof plate is nailed to the room grid: it never slides against the rock it hangs from'],
  ['tutor',     'the opening chain: booth, letter, battery, repair, pod, Volt Pack, heal, winch, monument, road'],
  ['tells',     'every boss wind-up carries BOTH channels — no silently one-channel telegraphs'],
  ['boss-motion', 'simulation-owned boss motion, solid hit reactions, real landing and distinct tells'],
  ['bosswindow', 'how long every guardian warns, move by move, against its floor'],
  ['threat',    'threat concentration per screen, and the forbidden compositions'],
  ['errands',   'every errand has a goal that exists and can be reached'],
  ['deadend',   'no broken exits, no one-way doors, no unreachable rooms, every leaf pays'],
  ['benchloop', 'every one-way route (a drop she cannot climb back, a door with none behind it) still reaches a bench'],
  ['padlife',   'a yanked controller releases the game; a live one keeps it'],
  ['climbout',  'every floor she can land on she can leave, and every gate names its power'],
  ['cover',     'the platform she is standing on stops a shot, from either side'],
  ['tap',       'tap where a thing is drawn and that thing happens'],
  ['textreveal','words typed at a reading pace, paged, read before they turn, one overlay at a time'],
  ['text-rules', 'cards pause combat; one tap/press never reveals and dismisses; numbers stay immediate; five languages at phone width'],
  ['servo-presence', 'Old Servo stood beside, not inside: prompt before contact, talk stand-off, grounded, whole arc on desktop and phone'],
  ['bosspace',  'no guardian spends the fight standing still, measured against a moving player'],
  ['daze',      'a group of hits breaks NULLFANG open, pays out, closes, and cannot be held'],
  ['openings',  'every boss move opens for at least one hit, and only the bait pays out three'],
  ['guardians', 'every guardian opens after every move, breaks on a group of hits, and draws its moves by range'],
  ['arc',       'the world notices, she changes on the victory, a death is a beat'],
  ['meet',      'it swats her aside and walks away, and she is still standing'],
  ['secrets',   'two hollow walls, a cellar hatch, and a pit only the dash crosses'],
  ['secrettell','one tell for every secret: knock before it gives, the floor taught from above, the dig, the fracture'],
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
  ['gravehorn', "GRAVEHORN: the entrance, every move told and opened, the charge jumped, the toss thrown and parried, twin horns, the kick from behind, the exit"],
  ['furnace',   'FURNACE CHOIR: every move told and opened, the third hit answered by the bellows (and the parry that turns it), the phase-two drop, the veto list'],
  ['retired',   'the deleted art stays deleted, and no creature wears another body while its art loads'],
  ['gait',      'she runs ON the ground: no bouncing, no falling plate mid-stride'],
  ['motion',    'the fired guardian plates are on screen, not just in the manifest'],
  ['tinker',    "Ratchet's plate set is seven poses, not one picture seven times"],
  ['folk',      'the machine folk have jobs, and no two of them share a beat'],
  ['rubble',    'the first tunnel is buried, it calls, and it takes the blade'],
  ['cavedark',  'the cave is dark, and light is the only map of it'],
  ['terrainrun', 'irregularity is not elevation: she runs it, and so do they'],
  ['enemygait', 'machines stand on the floor, turn on their feet, fly the same at any frame rate, and step with the ground'],
  ['infection-eyes', 'red eyes for the rank and file, purple for guardians; incense smoke born at the eye, in the world, and ending'],
  // every placed kind and guardian in its own room: the one harness that is a
  // survey of the whole cast, so it gets a survey's time
  // measured 58-99 s (the slow end with other sessions loading the box) on the
  // 4-core studio machine once it stopped waiting for a
  // MEDIA_PEND that never empties (557-670 s before); 240 s is ~2.5x the worst
  // and still inside the studio collector's 360 s per-harness kill
  ['infection-roster', 'every hostile body and every guardian: an eye, its colour, on the head, facing, and the smoke born there', { timeout: 240000 }],
  ['infection-poses', 'every guardian, every drawn state, both facings: an eye on the art, never twice, never under the loading silhouette, the smoke born there', { timeout: 420000 }],
  ['reach',     'she hits what she is standing next to, and she turns to it'],
  ['gatecue',   'the first built thing the player finds sounds like one'],
  ['cuefamily', 'the things she is shot at with do not all sound alike'],
  ['shopread',  'a structure she can enter is never the wall behind it'],
  ['beacon',    'a marker lights the way TO a character, never over one'],
  ['doorway',   'the painted door is where she walks in, not the wall beside it'],
  ['cross',     'a room crossing is a move, not a cut'],
  ['look',      'hold up or down standing still and the frame pans that way; taps, walks and jumps never do'],
  ['seam',      'a room boundary is a place she walks through, not a door'],
  ['vlink',     'the way up ends on a ledge, and every up/down pair is one shaft: drawn, solid, crossed without a cut'],
  ['seam-look', 'a floor wears one face across a vertical seam: seen from below, stood on from above, nothing black in front of it'],
  ['roomcache', 'a doorway costs a frame: rooms baked ahead, never rebaked on a revisit, the save off the crossing'],
  ['mapgrid',   'two rooms cannot stand on the same square of the map'],
  ['mapexits',  'the map shows rooms where they really are: every shaft stacked, every side exit edge to edge'],
  ['shaftfit',  'a shaft is one hole through two rooms, and no sky hangs under another room\'s floor'],
  ['glowcost',  'the most expensive thing the renderer does, counted'],
  ['meadow',    'the greenery keeps its colour all the way to the screen'],
  ['drawclock', 'a frozen clock freezes the frame: draw never reads the wall clock'],
  ['guard',     'she braces, and bracing costs the hit its push'],
  ['shield',    'the brace holds, the plate has a side, the hymn can be jumped'],
  ['airattack', 'a strike in the air is its own move, once it has one'],
  ['grapple',   'the grappling claw: walls, enemies, aim assist, and everything that outranks it'],
  ['grapple-contract', 'protected and zero-damage grapple targets never grant combat side effects', { noBrowser: true }],
  ['reel-contract', 'capture reels fail closed for runtime errors and missing required beats', { noBrowser: true }],
  ['hitshape',  'authored hit shapes: every swing inside its old square, the far corners trimmed, the Forge overlay'],
  ['slashlayer','her cuts on their own layer, drawn after her, with a glow copy on the dial'],
  ['crestfight','the expensive seals change how she fights: each attack block measured with every weapon, drawn, one style at a time, in five languages'],
  ['face',      'face acting: effort on the reel, relief after a repair, fear at a roar, drawn'],
  ['glide',     'the glide: after the double jump, JUMP held caps the fall; let go and she drops'],
  ['dmglog',    'the damage log as a check: cores lost by source per room, the 40% flag, the Forge overlay'],
  ['loadout',   'arms, crests and relics each wear their own registered hue and frame, on every screen and the HUD'],
  ['soar',      'Volt Soar: UP + claw on the ground, six tiles straight up, to the first ceiling, cutting what she passes'],
  ['shopscale', 'a shop door has no depth, a gate and a cave do'],
  ['foescale',  'every machine reads in the hero\'s weight class'],
  ['contrast',  'nothing is drawn round a hostile body — no rim, no halo, no keyline (owner, 2026-11-16: "why still framed with light") — and the share of each silhouette that reads off its room is measured and printed, room by room', { timeout: 420000 }],
  ['foelevel',  'a machine\'s level is its kingdom plus the run, and it spends it'],
  ['scrapmoves','kingdom A picks the floor up — and never on a fresh save'],
  ['conduits',  'kingdom B\'s three moves fire, stay optional, and warn first'],
  ['foundry',   'kingdom C\'s machines learn to leave melt behind, and warn first'],
  ['archives',  'kingdom D files, strikes out and cross-references — and warns before each'],
  ['nestmoves', 'the Virus Nest\'s own three moves fire, warn first, and stay in kingdom E'],
  ['cachemoves','the Crystal Cache bends the answer — behind, off the arc and in the air'],
  ['cacheroster','the Cache has machines to bend it: V1 and V2 spawn them with the moves, V1B and X1 spawn none'],
  ['npcstrip',  'the five work strips are twelve frames of work, foot-aligned and steady'],
  ['opening',   'she wakes, she walks, she arrives — and only then does anything move'],
  // two full playthroughs (desktop, phone) read at a player's pace
  ['opening-order', 'the opening played with real input in the owner\'s order, desktop and phone, to Old Servo', { timeout: 900000 }],
  ['campaign-ch1', 'chapter one played end to end with keyboard input only, from a cleared browser to the chapter-two teaser (long, real time)', { timeout: 3600000 }],
  ['campaign-contract', 'chapter-one campaign certification fails closed for missing, late, partial and error-bearing evidence', { noBrowser: true }],
  ['hero',      'her arm is ONE piece, she has two of them, nothing bolted on'],
  ['preload',   'the art for the rooms she can reach is fetched before she reaches them'],
  ['boot',      'a cold open spends what it needs and buys the rest behind itself'],
  ['lowres',    'the whole world at quarter size, and nothing sliced by pixel gets one'],
  ['demo',      'the free chapter ends at one door, and she can walk back in'],
  ['twin',      'the swirl: four passes, a ring not a punch, and two blades afterwards'],
  ['crystal',   'the purifier: gift, tree, reach, rising finisher, launcher, the throw that returns'],
  ['sage-motion', 'Meadow Sage committed strikes, planted motion, matching ring contact and rescue invariants'],
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
const unknown = want.filter(n => !SUITE.some(([name]) => name === n));
if (unknown.length) {
  console.error('Unknown test harness(es): ' + unknown.join(', '));
  process.exit(1);
}
const run = SUITE.filter(([n]) => !want.length || want.includes(n));
let failed = 0, pending = 0, sinceCheck = [], browserRan = false;
for (const [name, what, opt] of run) {
  const file = path.join(__dirname, name + '.cjs');
  if (!fs.existsSync(file)) { failed++; console.error('FAILED: ' + name + ' — missing harness ' + file); continue; }
  console.log('\n── ' + name + '  — ' + what);
  if (!(opt && opt.noBrowser)) {
    ensureServer();
    if (!servedCheck(browserRan ? 'before ' + name : 'before the first browser harness')) {
      // fail closed: nothing after this point would be testing the pinned build,
      // and the harnesses since the last good check may not have been either
      console.error(browserRan ? 'Refusing to continue: the served build changed during the run. Results of '
        + (sinceCheck.join(', ') || 'none') + ' (run since the last good check) are suspect.'
        : 'Refusing to run browser harnesses against a build that is not this checkout.');
      dropSnapshot(); process.exit(2);
    }
    browserRan = true; sinceCheck = [];
  }
  if (!(opt && opt.noBrowser)) sinceCheck.push(name);
  // every harness says how long it took, so a timeout in SUITE can be set
  // from a measurement instead of raised until the failure goes away
  const began = Date.now();
  try {
    console.log(execFileSync('node', [file], { encoding: 'utf8', timeout: (opt && opt.timeout) || 300000, maxBuffer: 10 * 1024 * 1024 }).trim());
  } catch (e) {
    if (opt && opt.pending) {
      pending++;
      console.log('PENDING (' + opt.pending + '): ' + (e.stdout || '') + (e.stderr || e.message));
    } else {
      failed++;
      console.log('FAILED: ' + (e.stdout || '') + (e.stderr || e.message));
    }
  }
  console.log('   (' + name + ': ' + ((Date.now() - began) / 1000).toFixed(1) + ' s)');
}
// the last harness is not followed by a "before", so the end gets its own look
if (browserRan && !servedCheck('at the end of the run')) {
  failed++;
  console.error('FAILED: the served build changed during the run; results of '
    + (sinceCheck.join(', ') || 'none') + ' (run since the last good check) are suspect.');
}
dropSnapshot();
console.log('\n' + (failed ? failed + ' harness(es) failed' : 'all ' + run.length + ' harnesses ran')
  + (pending ? ' (' + pending + ' pending, see suite notes)' : ''));
process.exitCode = failed ? 1 : 0;

