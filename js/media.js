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
    // the second turnaround sheet: the six machine folk and the shield guard,
    // 6 yaw angles each, assembled by tools/turnsheet.cjs from two half-turns
    npcs: 'assets/characters/npc_6yaw.png',
    // 3D-rendered zone vistas: 2 cols x 3 rows, A B / C D / E X
    zones: 'assets/backgrounds/zones_far.jpg',
    // the ROOF of each kingdom, rendered from directly below with real
    // overhangs, so a room has a top as well as a bottom. One plate per zone;
    // ceilTex() wraps and fades them, and ceilWeather() decides what drips off.
    ceilA: 'assets/backgrounds/ceil_a.jpg',
    ceilB: 'assets/backgrounds/ceil_b.jpg',
    ceilC: 'assets/backgrounds/ceil_c.jpg',
    ceilD: 'assets/backgrounds/ceil_d.jpg',
    ceilE: 'assets/backgrounds/ceil_e.jpg',
    ceilX: 'assets/backgrounds/ceil_x.jpg',
    // THE EYE'S CONSTRUCTS. Two plates each — at rest, and wound up — so the
    // wind-up is a different DRAWING and not the same drawing tinted, which is
    // the silhouette law applied to a class that has no rig to pose.
    eyeChime: 'assets/characters/eye/chime.png',
    eyeChimeW: 'assets/characters/eye/chime_w.png',
    eyeCarrier: 'assets/characters/eye/carrier.png',
    eyeCarrierW: 'assets/characters/eye/carrier_w.png',
    eyeMoth: 'assets/characters/eye/moth.png',
    eyeMothW: 'assets/characters/eye/moth_w.png',
    eyeLattice: 'assets/characters/eye/lattice.png',
    eyeLatticeW: 'assets/characters/eye/lattice_w.png',
    eyeLens: 'assets/characters/eye/lens.png',
    eyeLensW: 'assets/characters/eye/lens_w.png',
    // THE PACK. The first thing in the game that is ALIVE rather than
    // industrial — three plates for the wolf and three for the one that leads
    // it, keyed off black by tools/blackkey.cjs so each has real alpha.
    //
    // Three and not two: a wolf's whole read is coil-then-pounce, and the
    // pounce happens in the air where a grounded plate cannot go. Rest, coil,
    // lunge — one per phase of the only move it has.
    wolfRest: 'assets/characters/beasts/wolf.png',
    wolfCoil: 'assets/characters/beasts/wolf_coil.png',
    wolfLunge: 'assets/characters/beasts/wolf_lunge.png',
    // NINE PLATES FOR THE ALPHA, one per state, because it has five skills and
    // two of them have their own recovery. A boss with five moves sharing two
    // drawings is a boss with two moves as far as the player's eye is concerned.
    alphaRest: 'assets/characters/beasts/alpha.png',        // prowling
    alphaRoar: 'assets/characters/beasts/alpha_roar.png',   // the stunning roar
    alphaHowl: 'assets/characters/beasts/alpha_howl.png',   // calling the betas
    alphaLeap: 'assets/characters/beasts/alpha_leap.png',   // the spiral, airborne
    alphaClaw: 'assets/characters/beasts/alpha_claw.png',   // the swipe
    alphaBite: 'assets/characters/beasts/alpha_bite.png',   // the bite lands
    alphaClinch: 'assets/characters/beasts/alpha_clinch.png', // ...and worries it
    alphaRecoil: 'assets/characters/beasts/alpha_recoil.png', // landed a hit — kicks back
    alphaTurn: 'assets/characters/beasts/alpha_turn.png',   // missed — spins to face her
    alphaFree: 'assets/characters/beasts/alpha_free.png',   // after it yields
    // THE LAIRS. One authored prop per guardian, keyed off its generation
    // plate's black field by tools/blackkey.cjs, so each has real alpha and
    // occludes the room properly. Lazy like everything else: a lair is only
    // ever fetched when you are standing in the arena that has it.
    lairDen: 'assets/backgrounds/lair_den.png',        // NULLFANG    — scrap den
    lairNest: 'assets/backgrounds/lair_nest.png',      // TALONHOST   — mast nest
    lairForge: 'assets/backgrounds/lair_forge.png',    // FURNACE     — the crucible
    lairPeak: 'assets/backgrounds/lair_peak.png',      // GLACIERE    — ice over a frozen spring
    lairVault: 'assets/backgrounds/lair_vault.png',    // PRISM       — geode shelf
    lairCradle: 'assets/backgrounds/lair_cradle.png',  // MOTHER-V    — fibre cradle
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
    // ONE FRAME LIFTED FROM EACH SHOT OF THE OPENING FILM. A browser that
    // cannot decode the video still gets the same eight images in the same
    // order, so the story is never replaced by a different one.
    introS1: 'assets/intro/intro1.jpg',
    introS2: 'assets/intro/intro2.jpg',
    introS3: 'assets/intro/intro3.jpg',
    introS4: 'assets/intro/intro4.jpg',
    introS5: 'assets/intro/intro5.jpg',
    introS6: 'assets/intro/intro6.jpg',
    introS7: 'assets/intro/intro7.jpg',
    introS8: 'assets/intro/intro8.jpg',
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
    laser: 'assets/sfx/laser2.mp3',
    zap: 'assets/sfx/zapTwoTone.mp3',
    // NPC proximity voices: drop a loopable file at any of these paths and
    // it replaces that character's synthesized hum automatically (a missing
    // file 404s silently and the synth voice keeps singing instead).
    // These are OVERRIDE SLOTS, not missing assets — see MEDIA_OPTIONAL below,
    // which is how that promise stops being a comment and becomes something
    // tests/platform.cjs can tell apart from a genuine hole in the package.
    hum_servo: 'assets/sfx/hum_servo.ogg',
    hum_ratchet: 'assets/sfx/hum_ratchet.ogg',
    hum_mono: 'assets/sfx/hum_mono.ogg',
    hum_sage: 'assets/sfx/hum_sage.ogg',
    hum_patch: 'assets/sfx/hum_patch.ogg',
    hum_lumen: 'assets/sfx/hum_lumen.ogg',
    // NYA-9's voice and the guardians' roars. Short, mono, decoded once — about
    // 2.5 MB of PCM for the whole cast, against the 62 MB the music used to cost
    // before it was moved to streaming.
    // NYA-9's OWN VOICE. Cloned from a reference the game's owner supplied and
    // spoken WORDLESSLY on purpose — sharp exhales, a cry, a sigh — for the two
    // reasons that agree: it is the Silksong register (a character who sounds
    // rather than speaks), and this game ships in five languages, so a bark
    // with a word in it is a bark that is wrong in four of them.
    // Trimmed to the frame the voice starts by tools/voxtrim.cjs, because the
    // room tone in front of a generated take IS latency on a combat sound.
    nya_atk1: 'assets/sfx/vox/nya_atk1.wav',
    nya_atk2: 'assets/sfx/vox/nya_atk2.wav',
    nya_atk3: 'assets/sfx/vox/nya_atk3.wav',
    nya_hurt: 'assets/sfx/vox/nya_hurt.wav',
    nya_hurtbad: 'assets/sfx/vox/nya_hurtbad.wav',
    nya_die: 'assets/sfx/vox/nya_die.wav',
    nya_dash: 'assets/sfx/vox/nya_dash.wav',
    nya_djump: 'assets/sfx/vox/nya_djump.wav',
    nya_land: 'assets/sfx/vox/nya_land.wav',
    nya_heal: 'assets/sfx/vox/nya_heal.wav',
    nya_evo: 'assets/sfx/vox/nya_evo.wav',
    nya_win: 'assets/sfx/vox/nya_win2.wav',
    nya_purr: 'assets/sfx/vox/nya_purr2.wav',
    vox_win: 'assets/sfx/vox/win.ogg',
    vox_purr: 'assets/sfx/vox/purr.ogg',
    vox_roar_beast: 'assets/sfx/vox/roar_beast.ogg',
    vox_roar_eagle: 'assets/sfx/vox/roar_eagle.ogg',
    vox_roar_glc: 'assets/sfx/vox/roar_glc.ogg',
    vox_roar_drg: 'assets/sfx/vox/roar_drg.ogg',
    vox_roar_prism: 'assets/sfx/vox/roar_prism.ogg',
    vox_roar_mother: 'assets/sfx/vox/roar_mother.ogg',
    // Impacts stay recorded — a hit has to sound like it hit something. Her
    // small cues do not: jumping, landing, dashing, picking up, getting hurt
    // and killing something are played, not sampled (see CUE in audio.js), so
    // the samples they used to use are no longer fetched or decoded here.
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
// SLOTS THAT ARE ALLOWED TO BE EMPTY. Everything else in MEDIA_SRC must exist
// on disk and must be in the package on every platform (RULE ONE in CLAUDE.md,
// checked by tests/platform.cjs). These six are extension points by design: the
// game synthesises each NPC's voice, and dropping a file at the path takes over.
// Declaring that here rather than only in a comment is the difference between a
// harness that can enforce the rule and one that has to be told to ignore things.
const MEDIA_OPTIONAL = new Set([
  'hum_servo', 'hum_ratchet', 'hum_mono', 'hum_sage', 'hum_patch', 'hum_lumen',
]);
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
['roster', 'npcs', 'platforms', 'driller', 'slashFx'].forEach(mediaFetch);
// Asking "is this sheet here yet?" must NOT be what fetches it. Several guards
// test four boss atlases in one condition to decide which renderer to use, and
// through the lazy map that innocent-looking check pulled 2.7 MB of art for
// guardians that were not even in the room.
function mediaHas(k) { return !!MEDIA_RAW[k]; }

// ---------------------------------------------------------------------------
// SOFT EDGES. The guardians' art arrived as figures cut out of a painted
// background, and a cut-out has a hard edge: every pixel is either fully opaque
// or fully gone. Against a dark room that reads as a sticker laid on the scene —
// which is exactly how it looked next to the cat, who is drawn with vector
// shapes and is anti-aliased for free.
//
// Two things happen here, once per sheet, and both only touch the boundary:
//
//   FEATHER — a pixel's alpha is capped at the average alpha around it, so a
//   solid interior is untouched and the rim ramps out over a pixel or two.
//   CLEAN   — the outermost pixels of a keyed cut-out carry a halo of whatever
//   was behind them. Those are pulled toward their opaque neighbours, so the
//   ghost of the old background stops outlining the figure.
// ---------------------------------------------------------------------------
const SOFT_ART = {};
function softArt(key) {
  if (SOFT_ART[key] !== undefined) return SOFT_ART[key];
  const im = MEDIA_RAW[key];
  if (!im || !im.naturalWidth) return null;              // not here yet; ask again
  let out = im;
  try {
    const W = im.naturalWidth, H = im.naturalHeight;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    x.drawImage(im, 0, 0);
    const img = x.getImageData(0, 0, W, H), d = img.data;
    const a0 = new Uint8ClampedArray(W * H);
    for (let i = 0, p = 3; i < W * H; i++, p += 4) a0[i] = d[p];
    for (let y = 0; y < H; y++) {
      for (let xx = 0; xx < W; xx++) {
        const i = y * W + xx;
        if (!a0[i]) continue;                            // already empty
        let sum = 0, n = 0, br = 0, bg = 0, bb = 0, bw = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy; if (yy < 0 || yy >= H) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const x2 = xx + dx; if (x2 < 0 || x2 >= W) continue;
            const j = yy * W + x2;
            sum += a0[j]; n++;
            if (a0[j] === 255 && j !== i) {              // a solidly interior neighbour
              bw++; br += d[j * 4]; bg += d[j * 4 + 1]; bb += d[j * 4 + 2];
            }
          }
        }
        const mean = sum / n;
        if (mean < 255) {
          d[i * 4 + 3] = Math.min(a0[i], mean);          // feather
          if (bw && a0[i] < 250) {                       // and de-fringe the rim
            d[i * 4] = (d[i * 4] + br / bw) / 2;
            d[i * 4 + 1] = (d[i * 4 + 1] + bg / bw) / 2;
            d[i * 4 + 2] = (d[i * 4 + 2] + bb / bw) / 2;
          }
        }
      }
    }
    x.putImageData(img, 0, 0);
    // every renderer in the game tests im.naturalWidth to know whether a sheet
    // has arrived, and sizes its own scratch copies from it. A canvas has no
    // such property, so it is given one and stays a drop-in for the image.
    cv.naturalWidth = W; cv.naturalHeight = H;
    out = cv;
  } catch (e) { out = im; }                              // tainted canvas: ship it raw
  SOFT_ART[key] = out;
  return out;
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
