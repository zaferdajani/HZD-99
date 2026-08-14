// CLAWBYTE build: emits play.html (single file) with curated CC0 assets
// embedded as data: URIs. Run: node build.cjs
const fs = require('fs');
const EMBED = {
  bgFar: 'assets/backgrounds/sci_fi_bg1.jpg',
  indFar: 'assets/backgrounds/ind_far.png',
  indMid: 'assets/backgrounds/ind_mid.png',
  indFg: 'assets/backgrounds/ind_fg.png',
  roster: 'assets/characters/roster_8yaw.png',
  zones: 'assets/backgrounds/zones_far.jpg',
  vistaCity: 'assets/backgrounds/vista_city.jpg',
  vistaCrystal: 'assets/backgrounds/vista_crystal.jpg',
  driller: 'assets/characters/driller_12x6.png',
  beastParts: 'assets/characters/beast_parts.png',
  eagleParts: 'assets/characters/eagle_parts.png',
  heroIdle: 'assets/characters/gothic-hero-idle.png',
  heroRun: 'assets/characters/gothic-hero-run.png',
  heroJump: 'assets/characters/gothic-hero-jump.png',
  heroAtk: 'assets/characters/gothic-hero-attack.png',
  houndRun: 'assets/characters/hell-hound-run.png',
  houndIdle: 'assets/characters/hell-hound-idle.png',
  ghost: 'assets/characters/ghost-idle.png',
  skull: 'assets/characters/fire-skull.png',
  beast: 'assets/characters/hell-beast-idle.png',
  demon: 'assets/characters/demon-idle.png',
  boss: 'assets/music/epic_combat.ogg',
  ambient: 'assets/music/ambient_observing_the_star.ogg',
  hit1: 'assets/sfx/hit_01.ogg',
  hit2: 'assets/sfx/hit_02.ogg',
  metal: 'assets/sfx/metal_05.ogg',
  explosion: 'assets/sfx/explosion.ogg',
  glass: 'assets/sfx/glass_01.ogg',
  laser: 'assets/sfx/laser2.mp3',
  zap: 'assets/sfx/zapTwoTone.mp3',
  powerup: 'assets/sfx/powerUp1.mp3',
  low: 'assets/sfx/lowDown.mp3',
};
const MIME = { jpg: 'image/jpeg', png: 'image/png', ogg: 'audio/ogg', mp3: 'audio/mpeg', wav: 'audio/wav' };
const media = {};
for (const k in EMBED) {
  const f = EMBED[k];
  const ext = f.split('.').pop().toLowerCase();
  media[k] = 'data:' + MIME[ext] + ';base64,' + fs.readFileSync(f).toString('base64');
}
// vendor-three + model3d are NOT here on purpose. They render the driller in
// live 3D, and nothing has called into them since that model was baked down to
// the sprite atlas the game actually draws (driller_12x6.png) — verified: no
// symbol in either file is referenced anywhere else. They stayed in the bundle
// anyway, shipping 600 KB of Three.js to every player, which matters on the web
// and matters more inside an app download. The files remain in the repo as the
// offline tool that regenerates that atlas.
const files = ['beast', 'eagle', 'glaciere', 'furnace', 'mother', 'theme', 'mat', 'prism', 'types', 'i18n', 'media', 'quests', 'atlas', 'audio', 'engine', 'lang', 'riddles', 'trials', 'world', 'entities', 'wolves', 'pets', 'braid', 'game', 'perf', 'touch']
  .map(f => fs.readFileSync('js/' + f + '.js', 'utf8'));
// THE MUSIC MANIFEST. Scored tracks are dropped into assets/music/ and turned
// on by rebuilding — no code edit per track, and no reference to a file that is
// not there (a missing stream would start an <audio> element that silently
// never plays instead of falling back to the synth score).
const MUS_EXT = /\.(ogg|mp3|m4a|wav)$/i;
const musFiles = {};
try {
  for (const f of fs.readdirSync('assets/music')) {
    if (MUS_EXT.test(f)) musFiles[f.replace(MUS_EXT, '')] = 'assets/music/' + f;
  }
} catch (e) { /* no music directory yet */ }
// THE FILM MANIFEST, for the same reason as the music one. The ending is a
// reel of eight clips that plays only the ones the player earned, and naming a
// clip that is not on disk would park the ending on black while a watchdog
// counted down — once per missing file.
// EVERY CLIP SHIPS IN TWO CODECS, and both paths are handed over. H.264 is what
// Safari and iOS will decode; VP9 is what a browser without the patent-licensed
// decoder has. Naming only one of them is how a film ends up "not playing" on
// somebody's machine with nothing in the log to say why — so the page offers
// both and lets the browser take the one it can actually run.
const VID_EXT = /\.(mp4|webm|mov)$/i;
const vidFiles = {}, vidAlt = {};
try {
  for (const f of fs.readdirSync('assets/video')) {
    if (!VID_EXT.test(f)) continue;
    const base = f.replace(VID_EXT, '');
    if (/\.webm$/i.test(f)) vidAlt[base] = 'assets/video/' + f;
    else vidFiles[base] = 'assets/video/' + f;
  }
  // a clip that ships ONLY as webm is still a clip
  for (const k in vidAlt) if (!vidFiles[k]) { vidFiles[k] = vidAlt[k]; delete vidAlt[k]; }
} catch (e) { /* no video directory yet */ }
// THE VOICE MANIFEST, on the same principle. Each file is <npc><line>.ogg —
// servo0, sage2 — so a character gains a spoken line by dropping the file in
// and rebuilding, and any line that was never recorded simply keeps the
// synthesized voice it always had.
const VOX_EXT = /\.(ogg|mp3|m4a|wav)$/i;
const voxFiles = {};
try {
  for (const f of fs.readdirSync('assets/vox')) {
    if (VOX_EXT.test(f)) voxFiles[f.replace(VOX_EXT, '')] = 'assets/vox/' + f;
  }
} catch (e) { /* no voice directory yet */ }
const html = fs.readFileSync('dev.html', 'utf8');
const buildId = Date.now().toString(36);
// the loading screen paints while the megabytes below it still stream in
const loader = fs.readFileSync('loader.html', 'utf8');
// SLIM build: media is NOT embedded — the deployed repo serves assets/ as
// separate files that stream in after boot (media.js already loads lazily and
// every draw path has a fallback until its art arrives). This cuts the
// blocking download from ~12MB to ~1MB.
// TWO LIBRARIES, one engine: the cat's game and the hero's game ship as
// separate pages, each hard-locked to its own world — no chooser, no bleed.
const emit = (fname, lock) => {
  let shell = html;
  if (lock === 'hero')
    shell = shell.replace(/<title>[^<]*<\/title>/,
      '<title>NOSTOS — an Odyssey metroidvania</title>');
  const out = shell.replace(/<script src="js\/theme\.js"><\/script>[\s\S]*<\/body>/, () =>
    loader + '\n' +
    '<script>window.BUILD_ID=' + JSON.stringify(buildId) +
    ';window.GAME_LOCK=' + JSON.stringify(lock) +
    ';window.MUS_FILES=' + JSON.stringify(musFiles) +
    ';window.VID_FILES=' + JSON.stringify(vidFiles) +
    ';window.VID_ALT=' + JSON.stringify(vidAlt) +
    ';window.VOX_FILES=' + JSON.stringify(voxFiles) + '</script>\n' +
    '<script>\n' + files.join('\n') + '\n</script>\n</body>');
  fs.writeFileSync(fname, out);
  console.log(fname + ' built (' + lock + '):', (fs.statSync(fname).size / 1048576).toFixed(2) + 'MB');
};
emit('index.html', 'robo');    // CLAWBYTE — the machine depths
emit('odyssey.html', 'hero');  // NOSTOS — the long way home
