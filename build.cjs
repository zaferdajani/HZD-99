// NOSTOS build: emits play.html (single file) with the CC0/CC-BY assets
// embedded as data: URIs (credits: assets/CREDITS.md). Run: node build.cjs
const fs = require('fs');
const EMBED = {
  bgFar: 'assets/backgrounds/sunset_temple_bg.png',
  bgMid: 'assets/backgrounds/santorini_mid_bg.png',
  boss: 'assets/music/battle_theme_a.mp3',
  ambient: 'assets/music/mediterranean_breeze.ogg',
  hit1: 'assets/sfx/sword_hit_01.ogg',
  hit2: 'assets/sfx/sword_hit_02.ogg',
  metal: 'assets/sfx/metal_clang.ogg',
  explosion: 'assets/sfx/stone_crash.ogg',
  glass: 'assets/sfx/amphora_break.ogg',
  laser: 'assets/sfx/arrow_whoosh.wav',
  zap: 'assets/sfx/zap_shimmer.flac',
  powerup: 'assets/sfx/powerup_complete.mp3',
  low: 'assets/sfx/low_thud.ogg',
  bell: 'assets/sfx/divine_bell.ogg',
  gong: 'assets/sfx/gong.ogg',
};
const MIME = { jpg: 'image/jpeg', png: 'image/png', ogg: 'audio/ogg', mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac' };
const media = {};
for (const k in EMBED) {
  const f = EMBED[k];
  if (!fs.existsSync(f)) { console.warn('skip missing asset:', f); continue; }
  const ext = f.split('.').pop().toLowerCase();
  media[k] = 'data:' + MIME[ext] + ';base64,' + fs.readFileSync(f).toString('base64');
}
const files = ['i18n', 'media', 'audio', 'engine', 'lang', 'riddles', 'world', 'entities', 'trials', 'comics', 'game', 'touch']
  .map(f => fs.readFileSync('js/' + f + '.js', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const out = html.replace(/<script src="js\/i18n\.js"><\/script>[\s\S]*<\/body>/,
  '<script>window.EMBEDDED_MEDIA=' + JSON.stringify(media) + '</script>\n' +
  '<script>\n' + files.join('\n') + '\n</script>\n</body>');
fs.writeFileSync('play.html', out);
console.log('play.html built:', (fs.statSync('play.html').size / 1048576).toFixed(2) + 'MB');
