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
const files = ['vendor-three', 'model3d', 'beast', 'eagle', 'theme', 'mat', 'types', 'i18n', 'media', 'atlas', 'audio', 'engine', 'lang', 'riddles', 'trials', 'world', 'entities', 'game', 'touch']
  .map(f => fs.readFileSync('js/' + f + '.js', 'utf8'));
const html = fs.readFileSync('dev.html', 'utf8');
const buildId = Date.now().toString(36);
// the loading screen paints while the megabytes below it still stream in
const loader = fs.readFileSync('loader.html', 'utf8');
// SLIM build: media is NOT embedded — the deployed repo serves assets/ as
// separate files that stream in after boot (media.js already loads lazily and
// every draw path has a fallback until its art arrives). This cuts the
// blocking download from ~12MB to ~1MB.
const out = html.replace(/<script src="js\/theme\.js"><\/script>[\s\S]*<\/body>/, () =>
  loader + '\n' +
  '<script>window.BUILD_ID=' + JSON.stringify(buildId) + '</script>\n' +
  '<script>\n' + files.join('\n') + '\n</script>\n</body>');
fs.writeFileSync('index.html', out);
console.log('index.html built:', (fs.statSync('index.html').size / 1048576).toFixed(2) + 'MB');
