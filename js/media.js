// CLAWBYTE — media manager: CC0 image/audio assets (see assets/CREDITS.md)
// Multi-file mode loads from assets/…; the single-file build injects
// window.EMBEDDED_MEDIA with data: URIs and these paths are overridden.
const MEDIA_SRC = {
  images: {
    bgFar: 'assets/backgrounds/sci_fi_bg1.jpg',
    bgMid: 'assets/backgrounds/scifi_platform_BG1.jpg',
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
