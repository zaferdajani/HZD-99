// CLAWBYTE — media manager: CC0 image/audio assets (see assets/CREDITS.md)
// Multi-file mode loads from assets/…; the single-file build injects
// window.EMBEDDED_MEDIA with data: URIs and these paths are overridden.
const MEDIA_SRC = {
  images: {
    bgFar: 'assets/backgrounds/sci_fi_bg1.jpg',
    bgMid: 'assets/backgrounds/scifi_platform_BG1.jpg',
    indFar: 'assets/backgrounds/ind_far.png',
    indMid: 'assets/backgrounds/ind_mid.png',
    indFg: 'assets/backgrounds/ind_fg.png',
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
    // pre-rendered 3D turnaround atlas: 11 subjects x 8 yaw angles
    roster: 'assets/characters/roster_8yaw.png',
    // 3D-rendered zone vistas: 2 cols x 3 rows, A B / C D / E X
    zones: 'assets/backgrounds/zones_far.jpg',
    // full-frame futuristic vistas (newer set; the gloomy atlas stays for later)
    vistaCity: 'assets/backgrounds/vista_city.jpg',
    vistaCrystal: 'assets/backgrounds/vista_crystal.jpg',
    driller: 'assets/characters/driller_12x6.png',
  },
  audio: {
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
  },
};
if (typeof window !== 'undefined' && window.EMBEDDED_MEDIA) {
  for (const k in window.EMBEDDED_MEDIA) {
    if (MEDIA_SRC.images[k]) MEDIA_SRC.images[k] = window.EMBEDDED_MEDIA[k];
    else MEDIA_SRC.audio[k] = window.EMBEDDED_MEDIA[k];
  }
}
const MEDIA_IMG = {}, MBUF = {};
for (const k in MEDIA_SRC.images) {
  const im = new Image();
  im.onload = () => { MEDIA_IMG[k] = im; };
  im.src = MEDIA_SRC.images[k];
}
let mediaAudioLoaded = false;
function loadMedia() {
  if (mediaAudioLoaded || typeof AC === 'undefined' || !AC) return;
  mediaAudioLoaded = true;
  for (const k in MEDIA_SRC.audio) {
    fetch(MEDIA_SRC.audio[k])
      .then(r => r.arrayBuffer())
      .then(b => AC.decodeAudioData(b))
      .then(buf => { MBUF[k] = buf; })
      .catch(() => {});
  }
}
