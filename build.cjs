// CLAWBYTE build: emits play.html (single file) with curated CC0 assets
// embedded as data: URIs. Run: node build.cjs
const fs = require('fs');
const EMBED = {
  bgFar: 'assets/backgrounds/sci_fi_bg1.jpg',
  indFar: 'assets/backgrounds/ind_far.webp',
  indMid: 'assets/backgrounds/ind_mid.webp',
  indFg: 'assets/backgrounds/ind_fg.webp',
  roster: 'assets/characters/roster_8yaw.webp',
  zones: 'assets/backgrounds/zones_far.jpg',
  vistaCity: 'assets/backgrounds/vista_city.jpg',
  vistaCrystal: 'assets/backgrounds/vista_crystal.jpg',
  driller: 'assets/characters/driller_12x6.webp',
  beastParts: 'assets/characters/beast_parts.webp',
  eagleParts: 'assets/characters/eagle_parts.webp',
  heroIdle: 'assets/characters/gothic-hero-idle.png',
  heroRun: 'assets/characters/gothic-hero-run.png',
  heroJump: 'assets/characters/gothic-hero-jump.webp',
  heroAtk: 'assets/characters/gothic-hero-attack.png',
  houndRun: 'assets/characters/hell-hound-run.webp',
  houndIdle: 'assets/characters/hell-hound-idle.png',
  ghost: 'assets/characters/ghost-idle.webp',
  skull: 'assets/characters/fire-skull.png',
  beast: 'assets/characters/hell-beast-idle.png',
  demon: 'assets/characters/demon-idle.png',
  // HER OWN FOLEY (ART_QUEUE: the hero sound set, fired 2026-08-26) — every
  // key here has a synth fallback in audio.js, so a missing file costs nothing
  hz_swing1: 'assets/sfx/hz_swing1.ogg',
  hz_swing2: 'assets/sfx/hz_swing2.ogg',
  hz_fin: 'assets/sfx/hz_fin.ogg',
  hz_burst: 'assets/sfx/hz_burst.ogg',
  hz_dash: 'assets/sfx/hz_dash.ogg',
  hz_charge: 'assets/sfx/hz_charge.ogg',
  hz_ready: 'assets/sfx/hz_ready.ogg',
  hz_jump: 'assets/sfx/hz_jump.ogg',
  hz_land: 'assets/sfx/hz_land.ogg',
  hz_evosting: 'assets/sfx/hz_evosting.ogg',
  hum_servo: 'assets/sfx/hum_servo.ogg',
  hum_ratchet: 'assets/sfx/hum_ratchet.ogg',
  hum_mono: 'assets/sfx/hum_mono.ogg',
  hum_sage: 'assets/sfx/hum_sage.ogg',
  hum_patch: 'assets/sfx/hum_patch.ogg',
  hum_lumen: 'assets/sfx/hum_lumen.ogg',
  fz_tell: 'assets/sfx/fz_tell.ogg',
  fz_tellmid: 'assets/sfx/fz_tellmid.ogg',
  fz_tellbig: 'assets/sfx/fz_tellbig.ogg',
  fz_slam: 'assets/sfx/fz_slam.ogg',
  fz_phase: 'assets/sfx/fz_phase.ogg',
  fz_wave: 'assets/sfx/fz_wave.ogg',
  fz_spikeup: 'assets/sfx/fz_spikeup.ogg',
  fz_summon: 'assets/sfx/fz_summon.ogg',
  fz_wreck: 'assets/sfx/fz_wreck.ogg',
  fz_break: 'assets/sfx/fz_break.ogg',
  fz_roar: 'assets/sfx/fz_roar.ogg',
  fz_castarc: 'assets/sfx/fz_castarc.ogg',
  fz_castice: 'assets/sfx/fz_castice.ogg',
  fz_castnull: 'assets/sfx/fz_castnull.ogg',
  fz_roar_glitch: 'assets/sfx/fz_roar_glitch.ogg',
  fz_roar_brood: 'assets/sfx/fz_roar_brood.ogg',
  fz_roar_atlas: 'assets/sfx/fz_roar_atlas.ogg',
  fz_roar_zero: 'assets/sfx/fz_roar_zero.ogg',
  fz_roar_prism: 'assets/sfx/fz_roar_prism.ogg',
  fz_roar_mother: 'assets/sfx/fz_roar_mother.ogg',
  hz_winsting: 'assets/sfx/hz_winsting.ogg',
  hz_step1: 'assets/sfx/hz_step1.ogg',
  hz_step2: 'assets/sfx/hz_step2.ogg',
  hz_stepgrass1: 'assets/sfx/hz_stepgrass1.ogg',
  hz_stepgrass2: 'assets/sfx/hz_stepgrass2.ogg',
  hz_steprock1: 'assets/sfx/hz_steprock1.ogg',
  hz_steprock2: 'assets/sfx/hz_steprock2.ogg',
  hz_stepice1: 'assets/sfx/hz_stepice1.ogg',
  hz_stepice2: 'assets/sfx/hz_stepice2.ogg',
  hz_steporg1: 'assets/sfx/hz_steporg1.ogg',
  hz_steporg2: 'assets/sfx/hz_steporg2.ogg',
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
const files = ['beast', 'eagle', 'glaciere', 'furnace', 'mother', 'theme', 'mat', 'prism', 'types', 'i18n', 'media', 'quests', 'atlas', 'audio', 'engine', 'lang', 'riddles', 'trials', 'world', 'preload', 'entities', 'wolves', 'pets', 'braid', 'game', 'perf', 'touch', 'packs', 'warp']
  .map(f => fs.readFileSync('js/' + f + '.js', 'utf8'));
// THE MUSIC MANIFEST. Scored tracks are dropped into assets/music/ and turned
// on by rebuilding — no code edit per track, and no reference to a file that is
// not there (a missing stream would start an <audio> element that silently
// never plays instead of falling back to the synth score).
// THE ROOM→ART MANIFEST, compiled in. js/preload.js uses it to fetch the art
// for rooms she can REACH before she reaches them, breadth-first over the room
// graph. It cannot be derived by reading the source — which sheets a room wants
// depends on its zone, its enemy list, its boss, its NPCs and its ceiling tier —
// so it is MEASURED by tools/roomassets.cjs playing every room, and regenerated
// whenever rooms or art change. Missing is not fatal: preload.js does nothing
// without it and the lazy map behaves exactly as it did before.
let roomAssets = 'null';
try { roomAssets = fs.readFileSync('assets/roomassets.json', 'utf8').trim(); }
catch (e) { console.log('  (no assets/roomassets.json — prefetch disabled; run tools/roomassets.cjs)'); }
// THE LOW TIER. A quarter-scale copy of every sheet that is safe to have one —
// the whole game's art in 0.55 MB, against 24.2 MB at full size. media.js asks
// for both when it needs a sheet immediately and draws whichever lands first,
// so the room is RIGHT (correct art, just soft) instead of being the procedural
// fallback that then gets replaced. Generated by tools/lowres.cjs; missing is
// not fatal, the game simply waits for full-size sheets as it always did.
let lowres = 'null';
try { lowres = fs.readFileSync('assets/lowres/index.json', 'utf8').trim(); }
catch (e) { console.log('  (no assets/lowres/index.json — progressive art off; run tools/lowres.cjs)'); }
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
// THE LIGHT FILM TIER — the same films at about half the bytes, for a phone on
// mobile data. RULE ZERO: the masters above are untouched and the game picks
// between them at runtime. Generated by tools/lightvid.cjs; missing is not
// fatal, every browser simply gets the full-weight film as before.
let vidLight = 'null';
try { vidLight = fs.readFileSync('assets/video/light/index.json', 'utf8').trim(); }
catch (e) { console.log('  (no assets/video/light — full-weight films only; run tools/lightvid.cjs)'); }
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
// the loading screen paints while the megabytes below it still stream in
const loader = fs.readFileSync('loader.html', 'utf8');
// SLIM build: media is NOT embedded — the deployed repo serves assets/ as
// separate files that stream in after boot (media.js already loads lazily and
// every draw path has a fallback until its art arrives). This cuts the
// blocking download from ~12MB to ~1MB.
// TWO LIBRARIES, one engine: the cat's game and the hero's game ship as
// separate pages, each hard-locked to its own world — no chooser, no bleed.
// THE FORGE pages carry one extra file: js/editor.js, appended after the game
// so its top level can wrap what game.js declared. The game pages never
// include it — the editor exists only where window.EDITOR says so.
const editorJs = fs.readFileSync('js/editor.js', 'utf8');
// ---------------------------------------------------------------------------
// SEO — the head the shared shell cannot carry
// ---------------------------------------------------------------------------
//
// dev.html is one shell for four pages, so anything page-specific has to be
// injected here, exactly as the <title> already is. Until now the built pages
// shipped a <title> and nothing else: no lang, no description, no Open Graph,
// no canonical. This is the only part of the project that is actually online,
// so a link to it rendered as a bare URL with no summary and no picture.
//
// The social images are REAL SCREENSHOTS of each game's title screen
// (assets/social/*.png, 1200x630), not artwork made for the purpose — the same
// rule the rest of the project follows about not showing something the thing
// itself is not.
//
// The Forge pages are the owner's editor and are marked noindex: they are not
// a product, and a search result pointing at someone's level editor is noise.
const SITE = 'https://zaferdajani.github.io/HZD-99';

function seoBlock(fname, lock, forge) {
  if (forge) {
    // Nothing to promote, and it must never be indexed.
    return '<meta name="robots" content="noindex,nofollow">\n'
      + '<meta name="viewport" content="width=device-width,initial-scale=1">';
  }
  const hero = lock === 'hero';
  const url = SITE + (hero ? '/odyssey.html' : '/');
  const name = hero ? 'NOSTOS' : 'CLAWBYTE';
  const tagline = hero
    ? 'An Odyssey metroidvania — the long way home to Ithaca.'
    : 'A robo-cat metroidvania in the Machine Depths.';
  const desc = tagline + ' A hand-built action game that runs in the browser — '
    + 'no install, no account. Explore, fight guardians, earn skills, and find the way through.';
  const img = SITE + '/assets/social/' + (hero ? 'nostos' : 'clawbyte') + '.png';

  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: name,
    description: desc,
    url: url,
    image: img,
    genre: ['Action', 'Metroidvania', 'Platformer'],
    gamePlatform: 'Web browser',
    applicationCategory: 'Game',
    operatingSystem: 'Any (modern web browser)',
    author: { '@type': 'Person', name: 'Zafer Dajani' },
    inLanguage: ['en', 'ar', 'tr', 'zh', 'ru'],
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD',
              availability: 'https://schema.org/InStock', url: url },
  // JSON.stringify does not escape '/', so "</script>" in any value would close
  // this block and the rest would parse as markup. Nothing here is user input
  // today, but the escape costs nothing and the rule should not have exceptions.
  }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  return [
    '<meta name="description" content="' + desc + '">',
    '<link rel="canonical" href="' + url + '">',
    '<meta name="robots" content="index,follow">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="' + name + '">',
    '<meta property="og:title" content="' + name + ' — ' + tagline + '">',
    '<meta property="og:description" content="' + desc + '">',
    '<meta property="og:url" content="' + url + '">',
    '<meta property="og:image" content="' + img + '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="' + name + ' title screen">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + name + '">',
    '<meta name="twitter:description" content="' + tagline + '">',
    '<meta name="twitter:image" content="' + img + '">',
    '<meta name="theme-color" content="#04060a">',
    '<script type="application/ld+json">' + ld + '</script>',
  ].join('\n');
}

// THE BUILD ID IS A CONTENT HASH, NOT A CLOCK.
//
// It was Date.now(), which meant a rebuild on an unchanged tree emitted four
// pages differing by one string — churn that has to be recognised and thrown
// away by hand on every merge, and that is exactly what broke tests/platform
// twice in one night: `npm run app:pack` runs build.cjs before it copies, so
// discarding the page churn AFTERWARDS left www/ carrying a different stamp
// than the pages it is supposed to be a copy of. One build, four platforms —
// and the timestamp was the only thing making them four builds.
//
// A hash serves the one job this id has strictly better. js/game.js compares
// the stamp in the deployed page against its own to decide whether a player is
// running yesterday's code; a hash changes exactly when the code changes,
// where a clock changed on every build and never on a merge that produced
// identical output. Everything that reaches a page goes in: the shell, the
// loader, every js file in order, the editor, and all the manifests the pages
// carry. Nothing else does, so the id is reproducible from the tree.
const buildId = require('crypto').createHash('sha256')
  .update(html).update(loader).update(editorJs).update(files.join('\n'))
  .update(JSON.stringify(musFiles)).update(JSON.stringify(vidFiles))
  .update(JSON.stringify(vidAlt)).update(String(vidLight))
  .update(JSON.stringify(voxFiles)).update(String(roomAssets)).update(String(lowres))
  .digest('hex').slice(0, 12);

const emit = (fname, lock, forge) => {
  let shell = html;
  if (lock === 'hero')
    shell = shell.replace(/<title>[^<]*<\/title>/,
      '<title>NOSTOS — an Odyssey metroidvania</title>');
  if (forge)
    shell = shell.replace(/<title>[^<]*<\/title>/, '<title>THE FORGE</title>');
  shell = shell.replace('<!--PCN-SEO-->', seoBlock(fname, lock, forge));
  const out = shell.replace(/<script src="js\/theme\.js"><\/script>[\s\S]*<\/body>/, () =>
    loader + '\n' +
    '<script>window.BUILD_ID=' + JSON.stringify(buildId) +
    (forge ? ';window.EDITOR=1' : '') +
    ';window.GAME_LOCK=' + JSON.stringify(lock) +
    ';window.MUS_FILES=' + JSON.stringify(musFiles) +
    ';window.VID_FILES=' + JSON.stringify(vidFiles) +
    ';window.VID_ALT=' + JSON.stringify(vidAlt) +
    ';window.VID_LIGHT=' + vidLight +
    ';window.VOX_FILES=' + JSON.stringify(voxFiles) +
    ';window.ROOM_ASSETS=' + roomAssets +
    ';window.LOWRES=' + lowres + '</script>\n' +
    '<script>\n' + files.join('\n') + (forge ? '\n' + editorJs : '') + '\n</script>\n</body>');
  fs.writeFileSync(fname, out);
  console.log(fname + ' built (' + lock + (forge ? '+forge' : '') + '):', (fs.statSync(fname).size / 1048576).toFixed(2) + 'MB');
};
emit('index.html', 'robo');    // CLAWBYTE — the machine depths
emit('odyssey.html', 'hero');  // NOSTOS — the long way home
emit('forge.html', 'robo', true);          // THE FORGE — the owner's editor
emit('forge-odyssey.html', 'hero', true);  // ...and the hero's world's
