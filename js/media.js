// NOSTOS — media manager: CC0/CC-BY image & audio assets (see assets/CREDITS.md)
// Multi-file mode loads from assets/…; the single-file build injects
// window.EMBEDDED_MEDIA with data: URIs and these paths are overridden.
const MEDIA_SRC = {
  images: {
    bgFar: 'assets/backgrounds/sunset_temple_bg.png',
    bgMid: 'assets/backgrounds/santorini_mid_bg.png',
  },
  audio: {
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
    const src = MEDIA_SRC.audio[k];
    if (src.startsWith('data:')) {
      // decode inline (strict CSPs may refuse fetch() on data: URIs)
      try {
        const bin = atob(src.slice(src.indexOf(',') + 1));
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        Promise.resolve(AC.decodeAudioData(buf.buffer))
          .then(b => { MBUF[k] = b; }).catch(() => {});
      } catch (e) {}
    } else {
      fetch(src)
        .then(r => r.arrayBuffer())
        .then(b => AC.decodeAudioData(b))
        .then(buf => { MBUF[k] = buf; })
        .catch(() => {});
    }
  }
}
