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
    // the crystal boss: PRISM PROWLER, authored pose atlas. Unlike the other
    // guardians this sheet carries BOTH halves of the character — the virus-lit
    // red cat it became, and the clear blue cat underneath it
    prismParts: 'assets/characters/prism_parts.png',
    motherParts: 'assets/characters/mother_parts.png',
    // NYA-9's claw arc, painted as glowing light on pure black so it can be
    // composited additively with no alpha channel to cut
    slashFx: 'assets/fx/slash.png',
    // authored STRATA: four platform decks (clean / virus-grown / forge /
    // frozen) cut from the owner's sheet, and the four scene bands behind them
    platforms: 'assets/tiles/platforms.png',
    strataRubble: 'assets/backgrounds/strata_rubble.jpg',
    strataIceA: 'assets/backgrounds/strata_iceA.jpg',
    strataLava: 'assets/backgrounds/strata_lava.jpg',
    strataIceB: 'assets/backgrounds/strata_iceB.jpg',
  },
  // Music is STREAMED, never decoded. decodeAudioData turns a 2 MB ogg into
  // ~60 MB of raw float PCM and holds it in RAM for the whole session — on a
  // phone that is the single most expensive thing this game did.
  // Anything in assets/music/ is available under its own basename: the build
  // scans the directory and hands the list over, so a new score is turned on by
  // dropping the file in and rebuilding. Nothing here ever names a file that is
  // not on disk — a missing stream would start an <audio> that silently never
  // plays instead of falling back to the synth score.
  stream: Object.assign({
    boss: 'assets/music/epic_combat.ogg',
    ambient: 'assets/music/ambient_observing_the_star.ogg',
  }, (typeof window !== 'undefined' && window.MUS_FILES) || {}),
  audio: {
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
    // NYA-9's voice and the guardians' roars. Short, mono, decoded once — about
    // 2.5 MB of PCM for the whole cast, against the 62 MB the music used to cost
    // before it was moved to streaming.
    vox_atk1: 'assets/sfx/vox/atk1.ogg',
    vox_atk2: 'assets/sfx/vox/atk2.ogg',
    vox_atk3: 'assets/sfx/vox/atk3.ogg',
    vox_land: 'assets/sfx/vox/land.ogg',
    vox_dash: 'assets/sfx/vox/dash.ogg',
    vox_win: 'assets/sfx/vox/win.ogg',
    vox_hurt: 'assets/sfx/vox/hurt.ogg',
    vox_djump: 'assets/sfx/vox/djump.ogg',
    vox_purr: 'assets/sfx/vox/purr.ogg',
    vox_roar_beast: 'assets/sfx/vox/roar_beast.ogg',
    vox_roar_eagle: 'assets/sfx/vox/roar_eagle.ogg',
    vox_roar_glc: 'assets/sfx/vox/roar_glc.ogg',
    vox_roar_drg: 'assets/sfx/vox/roar_drg.ogg',
    vox_roar_prism: 'assets/sfx/vox/roar_prism.ogg',
    vox_roar_mother: 'assets/sfx/vox/roar_mother.ogg',
  },
};
if (typeof window !== 'undefined' && window.EMBEDDED_MEDIA) {
  for (const k in window.EMBEDDED_MEDIA) {
    if (MEDIA_SRC.images[k]) MEDIA_SRC.images[k] = window.EMBEDDED_MEDIA[k];
    else MEDIA_SRC.audio[k] = window.EMBEDDED_MEDIA[k];
  }
}
// ---------------------------------------------------------------------------
// ART ON DEMAND. Every sheet in the manifest used to start downloading the
// instant this file parsed — the Foundry dragon, the Archive unicorn, all of it,
// before the player had touched anything, whether or not they would ever get
// there. That is how a cloud game ends up behaving like a bundled one.
//
// The store is now a lazy map: asking for a sheet is what starts fetching it,
// and until it lands the answer is undefined. Every renderer in the codebase
// already guards on that (`if (!im || !im.naturalWidth) return`) because sheets
// have always been able to arrive late, so nothing else had to change.
// ---------------------------------------------------------------------------
const MEDIA_RAW = {}, MEDIA_PEND = {}, MBUF = {};
function mediaFetch(k) {
  if (MEDIA_RAW[k] || MEDIA_PEND[k] || !MEDIA_SRC.images[k]) return;
  MEDIA_PEND[k] = 1;
  const im = new Image();
  im.onload = () => {
    MEDIA_RAW[k] = im;
    // the tile layer is baked once per room — a sheet that lands after that
    // first render would never appear, so force a repaint when art arrives
    if (k === 'platforms' || k === 'strataRubble' || k === 'strataIceB' || k === 'strataLava') {
      try { tileDirty = true; } catch (e) {}
    }
  };
  im.src = MEDIA_SRC.images[k];
}
const MEDIA_IMG = (typeof Proxy === 'function') ? new Proxy(MEDIA_RAW, {
  get(t, k) {
    if (typeof k !== 'string') return t[k];
    if (t[k]) return t[k];
    mediaFetch(k);
    return undefined;
  },
}) : MEDIA_RAW;
// the handful that must never pop in late: the shared turnaround atlas, the
// player's own sheets and the decks she is standing on
['roster', 'platforms', 'driller', 'slashFx'].forEach(mediaFetch);
// Asking "is this sheet here yet?" must NOT be what fetches it. Several guards
// test four boss atlases in one condition to decide which renderer to use, and
// through the lazy map that innocent-looking check pulled 2.7 MB of art for
// guardians that were not even in the room.
function mediaHas(k) { return !!MEDIA_RAW[k]; }
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
