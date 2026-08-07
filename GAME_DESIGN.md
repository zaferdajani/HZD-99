# CLAWBYTE / ODYSSEY — Comprehensive Game Design Document
*For art and gameplay feedback. Reflects the live build as deployed at
https://zaferdajani.github.io/odyssey/ — every fact below is taken from the
shipped code and assets, not from intention.*

---

## 1. GAME OVERVIEW

- **Game title:** CLAWBYTE (working family: two themes in one engine — *CLAWBYTE:
  The Machine Depths* starring robo-cat NYA-9, and *Odyssey*, the same world
  reskinned around a human wanderer hero; the player picks the theme at new
  game, and the two are planned to split into separate releases).
- **Genre:** 2D action platformer / metroidvania with Mega Man X-style boss-power
  progression and a Pokémon-inspired elemental type chart.
- **Target platform:** Web (desktop + mobile browsers), installable as a
  save-to-homescreen PWA-style app with auto-update; PS4/Xbox Bluetooth
  controller support.
- **Game engine/framework:** Fully custom vanilla JavaScript on HTML5 Canvas 2D
  (no Phaser/Unity). One optional WebGL subsystem (three.js r147, vendored) for
  a real-3D boss model, with graceful 2D fallback. Single-page build:
  `build.cjs` concatenates 18 JS modules + a self-contained animated loading
  screen into one `index.html` (~1.1 MB); art/audio stream as separate files;
  a service worker gives instant repeat loads and offline play.
- **Current development stage:** Late alpha — core loop, 2 fully-arted bosses of
  6, all systems functional; remaining bosses use interim pre-rendered art.
- **Game resolution/aspect ratio:** Fixed internal canvas 960×540 (16:9), scaled
  to fit any screen; mobile letterboxes into side control gutters.
- **Target frame rate:** 60 fps (requestAnimationFrame; dt-clamped at 1/30 so
  slow devices slow down rather than tunnel through walls).

---

## 2. ART STYLE & GRAPHICS (CRITICAL)

- **Current art style:** Hybrid, converging on **painterly pixel-art** —
  AI-generated pixel-art character sheets (commissioned by the owner, applied
  verbatim by rule) over painted cinematic backdrops, with procedural
  vector-style FX (slashes, glows, particles) and one code-built 3D model.
  The player cat and hero remain procedural vector characters.
- **Color palette:**
  - Zone A (Scrap Meadows): teal/mint neon city — cyan `#37ffd0` signature glow,
    pink/violet neon signage, dark blue-green shadows.
  - Zone B (Data Conduits): amethyst crystal catacombs — violet `#b48cff`,
    deep blues, warm parchment light shafts.
  - Zones C/D/E/X: forge oranges, frost whites, arc violets, infected crimson
    (from the pre-rendered vista atlas, held in reserve as "the gloomy set").
  - **Hue law:** crimson/red light = infected machine; cyan/cool = clean.
    Purple = the virus itself (NULLFANG's element). Gold `#ffd76a` = player
    power/finishers.
- **Sprite/texture resolution:** Boss sheets ~1536×1024 source; extracted parts
  70–530 px; backgrounds 1536-wide JPEG; characters drawn 24–150 px in-world
  on the 960×540 canvas.
- **Animation style:** Layered per character type:
  1. **Authored flip-book** (TALONHOST wings-down/up frames, attack sequences)
     with short cross-blends;
  2. **Cutout skeletons** (NULLFANG: parts on nested pivots — two-segment legs,
     skull rotating at the mane line, tangent-curve tail);
  3. **Authored key poses** for signature moments (crouch, roar, pounce);
  4. **Procedural** (player cat: coded run cycles, scarf physics, arm rig);
  5. **Real 3D** (legacy Driller: three.js mesh with painted canvas textures,
     kept as fallback);
  6. Particles everywhere (custom system: dust, sparks, virus motes, wind wakes).
- **Current asset types:** Character part-sheets (white-keyed, auto-extracted
  into runtime atlases with component masking), an 11-subject × 8-yaw
  pre-rendered turnaround roster, full-frame vista paintings, 2×3 vista atlas,
  CC0 sprite sheets (Odyssey-theme creatures: gothic hero, hell hound, ghost,
  fire skull), 34 CC0 SFX files, 4 music tracks, procedural canvas UI.
- **Visual references:** Hollow Knight (boss telegraphs, atmosphere), Mega Man X
  (boss-suit loop), Katana ZERO / Dead Cells (slash FX language), PUBG/COD
  Mobile (touch controls), Blasphemous (painterly backdrop contrast).
- **Screens:**
  - **Loading:** black screen replaced by an instant-paint vignette — a random
    cast member animates (NYA-9 sprinting/slashing, NULLFANG galloping,
    TALONHOST flapping on its cable, the Wanderer drilling sword cuts) over a
    name tag, glowing CLAWBYTE wordmark, shimmer bar. Theme-aware for the
    future split; `?lchar=` forces a character.
  - **Title:** starfield, big glowing CLAWBYTE, tagline, menu (Play / Controls /
    Language / Sound / Music), large procedural NYA-9 mascot bust right,
    version stamp "CLAWBYTE v4.3", update banner when a new build is live.
  - **Gameplay HUD:** cat-head life cores top-left, volt meter ring, scrap ⚙
    and IQ ◆ counters, suit wheel + arm badge, 6 shuriken pips (next pip
    visibly spins/brightens while a star regenerates), Song ♪ readiness,
    boss bar bottom-center with name + plating status line
    ("⛨ PLATED — short its armor with SCRAPPLATE" → "⛨ ARMOR SHORTED — 6").
  - **Pause:** Resume / Map / Crests / Skills / Relics / Controller /
    Touch Layout / Save & Quit.
  - **Touch Layout editor:** all buttons shown, drag anywhere, +/− resize,
    ⟲ reset, ✓ save.
  - **Controller screen:** live PS4/Xbox button-to-action map, remappable,
    conflicts auto-stolen, saved locally.
  - **Death:** red vignette, "SYSTEM FAILURE" style text, Husk recovery spawns.
  - **Map / Shop / Riddle terminals / Trials / Skills / Crests / Relics screens**
    all styled as in-world machine terminals.

---

## 3. ALL CHARACTERS

### Playable

**NYA-9** — *Playable (CLAWBYTE theme)*
- Visual: small white ceramic robo-cat, ~36 px tall; cyan LED visor eyes,
  triangular antenna-ears, red scarf with real flutter physics, segmented
  torso with vent seams, articulated front arm (shoulder→elbow→paw rig).
- Personality: silent, diligent maintenance unit; reads as brave-small.
- Animations: idle (breath + visor scan sweep), run (ninja stride, speed-scaled
  cycle, sprint lean with arm swept back), jump/double-jump (thruster jets),
  dash (combustion exhaust with shock diamonds), claw scratch ×3 combo (bared
  hooked talons from the paw, no weapon), supercharged X-slash, down-attack
  pogo, throw shuriken, keytar Song cast, hurt, death, turn (eased ~100 ms
  flip with dust, Turn Law compliant).
- Backstory: duct-crawler maintenance unit asleep in a service cradle when the
  Null Core's broadcast rewrote every networked machine; wakes to a world of
  familiar machines with red light behind their eyes; her Song is a repair
  diagnostic the mimics have no defense against.

**THE WANDERER** — *Playable (Odyssey theme)*
- Visual: CC0 gothic knight sprite set (idle/run/jump/attack sheets), bronze
  and gold armor, red plume, carries the volt-blade (the one character who
  keeps a sword — the cat never had one).
- Animations: from sprite sheets + shared player systems (dash, pogo, stars).

### Bosses (in order; each drops a suit/arm; the plating chain binds them)

**NULLFANG, THE VIRUS BEAST** (`glitch`) — Zone A · Element SKARN · drops SCRAPPLATE
- Visual: virus-infected robot lion; grey stone-plate armor, jagged dark mane
  ring, purple virus lights at eye/joints, segmented tail with spade tip.
  Built from the owner's part-sheet as a cutout skeleton; four authored poses
  (idle/walk/roar/crouch-attack) used verbatim; constructed front view
  (mirror-composited head) for through-the-front turns.
- Moves (real-lion design, every one telegraphed): STALK (low head prowl,
  165–210 px/s) → paw-rise tell → SWIPE (double when enraged) · CROUCH tell →
  POUNCE (distance-matched leap, landing hit, recover window) · crouch+dust
  tell → SPRING onto an arena platform → ledge prowl → flatten+eye-flare tell
  → DIVE at the player (enraged: landing shock ring) · ROAR (authored open-jaw
  figure): shoves the player and summons a whelp.
- Stats: 84×56 box, 220 HP, hurtbox 2.6×/2.1× (visual-sized), aggro 1.0.

**TALONHOST, THE IRON EAGLE** (`brood`) — Zone B · Element VANN · drops COOLANT
- Visual: virus-infected robot eagle, gunmetal + rust-orange plating, red core
  lights, hangs from a ceiling mount on a cable. Every rendered state is an
  authored sheet figure (hanging idle, wings-down/up flip-book, charge/fire/
  recover attack row, feather projectiles).
- Moves: FEATHER VOLLEY (centre-top, authored charge→fire→recover, fans of 5–7
  metallic feathers to take cover from; ×2 fans enraged) · SWOOP (diagonal dive
  through the player's position with a wind wake) · REST (descends into claw
  range, breathing — the honest window) · spawns mini-eagle flock (cap 1–2).
- Stats: 96×64 box, 320 HP, hurtbox 2.4×/2.2×, aggro 1.12; plated (SCRAPPLATE
  shorts it).

**FURNACE CHOIR** (`atlas`) — Zone C · Element HOTT · drops FORGE
- Visual: the owner's CORRUPTED MECHA DRAGON sheet (`dragon_parts.png`) —
  authored IDLE/WALK/FLY poses, the large flying figure for the roar/summon/
  meltdown, the parts column as his death (he breaks into the artist's own
  pieces), the glow core as the summoned orbs, the lava ring under his feet.
- Moves: slow advance, lobbed fireball, TAIL SLAM (authored tail coils
  overhead, then plants), THE HYMN → the Forge Roar (he rears; expanding heat
  rings — silenced by the player's Song), forgebell → summoned molten orbs,
  meltdown (white-hot + slag tide). Plated (COOLANT shorts it). 460 HP,
  aggro 1.22.

**THE ARCHIVIST** (`zero`) — Zone D · Element GLAZZ · drops HALT
- Visual (interim): pre-rendered 8-yaw frost archival unit.
- Moves: marks positions then beams them; THE PRISON (cage that taxes scrap).
  Plated (FORGE shorts it). 500 HP, aggro 1.32.

**THE PRISM PROWLER** (`prism`) — Zone E · Element ZIZT · drops ARCLIGHT
- Visual (interim): pre-rendered turntable-spinning prism cat — the only
  CLEAN-lit boss (cyan, not crimson). 520 HP, aggro 1.42. Plated (HALT).

**MOTHER-V, the Null Core** (`mother`) — Zone X final · Element VIZRR
- Visual (interim): huge central core, 120×120, 750 HP, aggro 1.55.
  Plated (ARCLIGHT shorts it). The source of the broadcast.

### Minions

- **Whelps** (`crawler`/`hopper` in Zone A): literal smaller NULLFANGs from the
  same skeleton; walk gait / nose-first leaps; die on spikes; summoned by the
  roar. Elements SKARN/VANN.
- **Mini TALONHOSTs** (`flier`, all zones): the eagle flip-book at small scale;
  bank into dives, talons only, no feathers. Element ZIZT.
- **Blob** (`hott`): foundry spillage that cooled into legs (8-yaw roster).
- **Turret** (`zizt`): fixed emplacement, sensor sweep via authored yaw scan.
- **Odyssey-theme swaps:** hell hound (crawler), ghost (flier), fire skull
  (hopper) from CC0 hand-animated sheets.
- **Husk**: the death-recovery vessel — a calm cocoon-like shell that holds
  your dropped scrap where you fell; soothed/claimed via the Song. Unique to
  this game's death loop.
- **NPC "Mono"**: bench-side merchant/terminal keeper in B3.

---

## 4. GAMEPLAY MECHANICS

- **Core 30-second loop:** run/dash/jump through a machine room → read enemy
  sensor colors → open with shuriken or arm shot → claw combo → pogo off a
  head to reposition → collect scrap/volts from wrecks → hit a bench to bank,
  restock stars, and spend.
- **Controls:**
  - *Keyboard:* arrows/WASD move · Z/Space jump · X/J claw · C/K dash ·
    V/K-cast arm fire · G/1 cycle suit · R/2 shuriken · B/N Song · F claw-mode ·
    Down+attack pogo · E interact · Esc/P pause · M map · U apply update.
  - *Touch (COD/PUBG-grade):* floating follow-stick spawns under the thumb
    anywhere on the left half; right-side buttons Jump/Attack/Heal/Dash/Cast/
    Claw/Star; left gutter Interact (28%), Song (42%), Suit (56%); corner menu
    buttons; full drag-anywhere/resize **Touch Layout** editor persisted per
    device; press haptics on Android.
  - *Gamepad (PS4/Xbox):* auto-detected (hides touch UI, expands screen);
    default map ✕ jump, □ attack, R1 dash, R2 cast, L1 suit, L2 Song, R3 star,
    L3 claw, Options pause, Share map, touchpad skills; fully remappable on
    the Controller screen with live labels.
- **Progression:**
  - **Boss suits (Mega Man X loop):** each boss drops its arm — SCRAPPLATE
    shard cone / COOLANT pressure jet / FORGE slag pool / HALT freeze /
    ARCLIGHT chain — cycled on a wheel; slot 0 always keeps the plain bolt.
  - **The Plating Chain (skill gating):** every boss past the first takes 15%
    damage until shorted for 6 s by the *previous* boss's element (fired or
    struck with the suit equipped). Escape valves: the Song stagger opens
    anyone; TALONHOST is bare while resting. Each boss is natively faster
    (aggro ladder 1.0→1.55).
  - **Skills (IQ currency from riddle terminals):** mind (+crest socket),
    calc (stronger finisher), reflex (longer i-frames), router (cheaper EMP),
    triple (third jump), wave (slash beams) — tier-gated.
  - **Crests (equippable, socket-limited):** claws, over, plate, magnet,
    siphon, phantom, sprint, nine — bought with scrap or found.
  - **Relics:** wreck drops (bell/lens/coolant/spring) + one trophy per boss.
  - **Difficulty:** Kitten (7 cores, weak enemies, +25% player damage) /
    Alley Cat (baseline) / Nine Lives (2× enemy damage, +15% HP, +20% speed,
    only 9 total lives per save).
- **Combat:** real-time melee-first. 3-hit claw combo → golden claw-X finisher;
  hold to supercharge → closing double-claw X nova. Down-attack pogo rebound
  (−660, −880 with jump held; chains). **Volt Shuriken** ×6 (pierce 2, stick in
  walls and are reclaimable, kill-refund, bench restock, and auto-regenerate
  one per 8 s with a visible charging pip). **The Song** (keytar, costs volts):
  hypnotizes mimics ~3 s (they take ×1.5 damage), staggers bosses, silences
  the Choir's hymn, calms the Husk. **Type chart:** closed ring
  zizt→vann→hott→glazz→skarn→zizt (×2.6 super-effective with stagger + hit-stop,
  ×0.5 same-element, melee never penalized; glazz also beats vizrr — cold is
  the one thing the broadcast cannot cross).
- **Unique mechanics:** the plating chain (boss powers as mandatory keys),
  spatial ammo (stars live in the world, not a magazine), the Song as a
  universal-but-costed opener, Husk death recovery, sensor-color legibility
  law (hue = infection, brightness = escalation), every boss tell drawn from
  the owner's authored artwork poses.
- **Difficulty curve:** Zone A teaches melee + pogo + stars vs. a boss with
  long tells; each subsequent boss is faster, plated behind the previous arm,
  and layers projectile pressure (feather fans → heat rings → beams) onto the
  movement test; Nine Lives mode compresses the whole game into a 9-death run.
- **Feedback systems:** hit-stop on super-effective hits, camera shake scaled
  to impact, elemental popups, plating "clink" arcs vs. shield-shatter bursts,
  screen flash on roars/updates, contact shadows, reactive character shadows,
  dust on every turn/landing/pivot, wind wakes on dives, controller-etiquette
  tells before every boss hit.

---

## 5. AUDIO & ATMOSPHERE

- **Music:** 4 tracks — `ambient_observing_the_star.ogg` (exploration; drifting
  ambient), `epic_combat.ogg` (boss), plus `battleThemeA.mp3` and
  `boss_encounter.wav` in reserve. Music swaps to the boss theme on arena
  trigger and back on victory; final boss silences music entirely.
- **Sound design:** 34 CC0 samples — 12 metal impacts, 4 hits, glass ×3,
  lasers ×5, zaps/power-ups, explosion — mapped through a single `sfx()`
  funnel (atk/hit/phit/edie/jump/djump/dash/pogo/land/step/pick/bench/roar/
  boom/phase/cast/shoot/wave/ui/win…). Approach: crunchy-exaggerated arcade
  feedback over the ambient bed.
- **Atmosphere:** melancholy-tense industrial ruin — a factory world still
  politely running its jobs while infected; neon signage advertising to no
  one; the player is small, quick, and glowing clean-cyan against it.

---

## 6. CURRENT PAIN POINTS (honest checklist)

- [x] **Cast art consistency** — NULLFANG/TALONHOST/minions/backdrops are on
  the owner's commissioned pixel-art style; the four later bosses still use
  the older pre-rendered roster, and the *player characters remain procedural
  vector* — the single largest style gap. Needs: NYA-9 + Wanderer sheets in
  the same style, then sheets for FURNACE CHOIR / ARCHIVIST / PRISM / MOTHER-V.
- [x] **Animations** — big-cast animation is strong now (cutout + flip-book +
  tells); whelp gait and player-cat limbs could use more frames of polish.
- [ ] UI confusing — largely solved (plating hints, tell language, layout
  editor); shop/skill screens are functional but text-heavy.
- [x] **Gameplay repetition risk** — Zones C–E still run on the older, simpler
  boss brains; they need the NULLFANG/TALONHOST treatment (bespoke move sets
  from artwork).
- [ ] Performance — solved (1.1 MB slim build, streamed assets, service
  worker; 60 fps on mid phones).
- [ ] Missing visual feedback — largely solved; remaining: damage numbers are
  absent by design (elemental popups instead).
- [ ] Muddy palette — no; palette law is enforced per zone.
- [x] **Characters lack personality** — bosses now have it; NYA-9 has motion
  personality but no *face* acting (no expressions, no dialogue portraits).
- [x] Other: **iOS haptics impossible on web**; volume-button controls
  impossible on web (documented); Odyssey/CLAWBYTE theme split pending.

---

## 7. DELIVERABLES NEEDED (status + requests to the art generator)

- [x] Character concept art — DONE for NULLFANG + TALONHOST (owner-provided
  sheets, fully integrated). **NEEDED next, same sheet format** (side view +
  ANIMATIONS EXAMPLE row + BODY PARTS row, white background, max ~8 MB):
  1. NYA-9 the robo-cat (priority one — the star is the last vector holdout),
  2. FURNACE CHOIR, 3. THE ARCHIVIST, 4. PRISM PROWLER, 5. MOTHER-V,
  6. The Wanderer (Odyssey split).
- [x] Sprite-sheet references — pipeline proven: white-key flood + enclosed
  pocket removal + shadow-band strip + connected-component masked extraction;
  THE AUDITOR (silhouette IoU vs authored art, refuse-below-threshold) and
  THE TURN LAW are standing rules.
- [ ] UI/UX redesign — worthwhile pass: iconography legend (a "what do these
  symbols mean" card), shop/skills visual upgrade.
- [ ] Color palette overhaul — not needed; document per-zone ramps instead.
- [x] Animation guidelines — encoded in the persistent art skill (failure
  taxonomy, construction order, render-and-look loop, Turn Law).
- [x] Gameplay mechanic suggestions — plating chain, ambush, star regen shipped;
  next candidates: boss rematch rush mode, NG+ with remixed tells.
- [ ] Level/environment art direction — two vistas live; NEEDED: matching
  futuristic vistas for C/D/E/X + a mid-layer parallax sheet per zone.
- [ ] Particle/VFX concepts — in-engine; could add boss-specific death
  cinematics.
- [ ] Marketing/promo art — loading-screen vignettes double as promo language;
  a key-art piece (NYA-9 vs NULLFANG under the neon city) would be the poster.

---

## 8. SCREENSHOTS & ASSET INVENTORY (what the player sees)

- **Loading:** dark `#05080d` field; a lone animated cast member runs/flaps
  above a moving ground line; name tag, glowing wordmark, shimmer bar; fades
  into the title on first frame.
- **Title:** starfield night, CLAWBYTE in glowing mint capitals, English/
  Arabic/Turkish/Chinese/Russian localization, NYA-9 bust with slow-blinking
  visor and beaded tail.
- **Zone A gameplay:** teal neon cityscape ("ZONE 03", paw-print billboards,
  TECH/NEXT-GEN signage) panning in parallax behind green-lit platforms and
  grass-fringed floors; spike pits of pale teal blades; whelps prowling,
  mini-eagles overhead; NYA-9 trailing scarf, cyan claw-arcs hanging in air.
- **NULLFANG arena (A4):** two elevated platforms; the lion stalks between
  them, springs onto ledges, dives; boss bar + "PLATED" line below; dust and
  purple motes everywhere.
- **Zone B gameplay:** amethyst crystal catacombs, cat-silhouette banners,
  robed shrine lights; TALONHOST hanging from its cable over the arena,
  feather fans falling, wind wakes on swoops.
- **Menus:** machine-terminal panels, mint-on-dark, RTL-correct Arabic.
- **Asset folders:** `assets/characters/` (beast_parts, eagle_parts,
  roster_8yaw, driller_12x6, hero/hound/ghost/skull CC0 sets),
  `assets/backgrounds/` (vista_city, vista_crystal, zones_far atlas, legacy
  sci-fi layers), `assets/music/` ×4, `assets/sfx/` ×34, `loader.html`,
  `sw.js`, `BESTIARY.md` (combat bible), `STORY.md` (world bible),
  `GAME_DESIGN.md` (this document).
