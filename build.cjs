// CLAWBYTE build: emits play.html (single file) with curated CC0 assets
// embedded as data: URIs. Run: node build.cjs
const fs = require('fs');
const EMBED = {
  bgFar: 'assets/backgrounds/sci_fi_bg1.jpg',
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
const files = ['i18n', 'media', 'audio', 'engine', 'lang', 'riddles', 'world', 'entities', 'game', 'touch']
  .map(f => fs.readFileSync('js/' + f + '.js', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const out = html.replace(/<script src="js\/i18n\.js"><\/script>[\s\S]*<\/body>/,
  '<script>window.EMBEDDED_MEDIA=' + JSON.stringify(media) + '</script>\n' +
  '<script>\n' + files.join('\n') + '\n</script>\n</body>');
fs.writeFileSync('play.html', out);
console.log('play.html built:', (fs.statSync('play.html').size / 1048576).toFixed(2) + 'MB');
