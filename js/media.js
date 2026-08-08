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
    // the first boss: virus-infected robot beast, parts atlas for the cutout rig
    beastParts: 'assets/characters/beast_parts.png',
    // boss 01: virus-infected robot eagle, parts atlas for the cutout rig
    eagleParts: 'assets/characters/eagle_parts.png',
    // the frost boss: GLACIERE, corrupted unicorn — figures, parts and fx
    glaciereParts: 'assets/characters/glaciere_parts.png',
    // the forge boss: FURNACE CHOIR, corrupted mecha dragon — poses, parts,
    // the glow core and the lava ring
    dragonParts: 'assets/characters/dragon_parts.png',
    // authored STRATA: four platform decks (clean / virus-grown / forge /
    // frozen) cut from the owner's sheet, and the four scene bands behind them
    platforms: 'assets/tiles/platforms.png',
    strataRubble: 'assets/backgrounds/strata_rubble.jpg',
    strataIceA: 'assets/backgrounds/strata_iceA.jpg',
    strataLava: 'assets/backgrounds/strata_lava.jpg',
    strataIceB: 'assets/backgrounds/strata_iceB.jpg',
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
    // NPC proximity voices: drop a loopable file at any of these paths and
    // it replaces that character's synthesized hum automatically (a missing
    // file 404s silently and the synth voice keeps singing instead)
    hum_servo: 'assets/sfx/hum_servo.ogg',
    hum_ratchet: 'assets/sfx/hum_ratchet.ogg',
    hum_mono: 'assets/sfx/hum_mono.ogg',
    hum_sage: 'assets/sfx/hum_sage.ogg',
    hum_patch: 'assets/sfx/hum_patch.ogg',
    hum_lumen: 'assets/sfx/hum_lumen.ogg',
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
  im.onload = () => {
    MEDIA_IMG[k] = im;
    // the tile layer is cached once per room — a sheet that lands after that
    // first render would never appear, so force a repaint when art arrives
    if (k === 'platforms') { try { tileDirty = true; } catch (e) {} }
  };
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
