# CLAWBYTE — Third-Party Asset Credits & Licenses

Every asset in this folder was downloaded from OpenGameArt.org and is published
under **CC0 1.0 (public domain dedication)** — verified on each source page at
the time of download (2026-07-19). CC0 permits commercial use, modification and
redistribution with no attribution required; we credit the authors anyway out
of respect. License text: https://creativecommons.org/publicdomain/zero/1.0/

## backgrounds/

| File | Author | Source |
|---|---|---|
| sci_fi_bg1.jpg | hassekf | https://opengameart.org/content/sci-fi-background |
| ind_far.png / ind_mid.png / ind_fg.png | Luis Zuno (ansimuz) | https://opengameart.org/content/industrial-parallax-background (CC0, verified 2026-07-24) — 3 parallax layers from the Industrial Parallax pack; colourised per zone in-engine |
| scifi_platform_BG1.jpg | Eris | https://opengameart.org/content/sci-fi-platform-tiles |
| scifi_platformTiles_32x32.png | Eris | https://opengameart.org/content/sci-fi-platform-tiles |

## characters/

| Files | Author | Source |
|---|---|---|
| gothic-hero-{idle,run,jump,attack}.png | Luis Zuno (ansimuz) | https://opengameart.org/content/gothicvania-patreons-collection — pack's own `public-license.txt` states **public domain, free for personal or commercial use, credit appreciated** (verified 2026-07-26). Hand-animated hero used for the Odyssey world's player character (idle 4 / run 12 / jump 5 / attack 6 frames). |
| hell-hound-{run,idle}.png, ghost-idle.png, fire-skull.png | Luis Zuno (ansimuz) | same pack/licence. Odyssey-world enemies: hound → crawler (run 5 / idle 6), ghost → flier (7), fire-skull → hopper (12). |
| hell-beast-idle.png, demon-idle.png | Luis Zuno (ansimuz) | same pack/licence. Odyssey-world bosses: beast → the Bronze Boar (6), demon → Talos the Forge-Giant (6); the ghost sheet doubles as the Judge of the Dead. |

The robo-cat world deliberately keeps its ORIGINAL code-drawn robots — the two
worlds are meant to look like different games.

**Rejected during sourcing (recorded so we don't revisit):** rgsdev's "Animated
Knight Character Pack v2.0" — **CC-BY-SA 4.0**, a share-alike licence that would
force the whole game to become share-alike. Never use SA-licensed art here.

## music/

| File | Author | Source |
|---|---|---|
| battleThemeA.mp3 | cynicmusic (pixelsphere.org) | https://opengameart.org/content/battle-theme-a |
| boss_encounter.wav | cynicmusic (pixelsphere.org) | https://opengameart.org/content/dramatic-boss-encounter |

**Removed 2026-08-30.** `epic_combat.ogg` (Chester01) and
`ambient_observing_the_star.ogg` (yd) were the last two CC0 music files and are
no longer in the repo. The authored score replaced every slot they filled, and
leaving them in the fallback chains is how five commissioned guardian themes
became unreachable — a table edit put `epic_combat` in front of them. Deleting
the files means the reach cannot come back by reordering. Both remain CC0 and
freely re-downloadable from OpenGameArt if a slot ever wants them again.

Larger CC0 tracks reviewed but not stored in the repo (download if wanted):
- "Determined Pursuit" epic orchestra loop by Emma_MA (18 MB WAV) —
  https://opengameart.org/content/determined-pursuit-epic-orchestra-loop
- "Epic Endgame Cinematic" by cynicmusic (31 MB WAV) —
  https://opengameart.org/content/epic-endgame-cinematic

## sfx/

| Files | Author | Source |
|---|---|---|
| hit_*.ogg, shot_*.ogg, metal_*.ogg, glass_*.ogg, explosion.ogg | rubberduck | https://opengameart.org/content/100-cc0-sfx |
| laser*.mp3, powerUp*.mp3, zapTwoTone.mp3, phaserUp3.mp3, lowDown.mp3 | Kenney (kenney.nl) | https://opengameart.org/content/63-digital-sound-effects-lasers-phasers-space-etc |
| kenney/sfx_edie.ogg, kenney/sfx_jump.ogg, kenney/sfx_pick.ogg | Kenney (kenney.nl) | Sci-Fi Sounds 1.0, **CC0** per the pack's own `LICENSE_kenney.txt` shipped alongside them in `sfx/kenney/` — free for commercial use, credit not mandatory and given anyway |

## Generated art — declared, per Steam's disclosure requirement

Everything in this section was **generated with Higgsfield** (image models,
the model named per entry in `docs/ART_QUEUE.md`) and then keyed, crushed and
composited by the tools in `tools/`. It is original to this project: no entry
is derived from, traced over, or trained on a specific copyrighted published
artwork, and no scans of third-party art exist in this repo. Steam requires AI
generation to be disclosed at store-page level — `docs/STEAM.md` carries that
plan, and this table is the source it draws from.

The as-fired originals live in `assets/source/<subject>/`, so every shipped
plate can be traced back to the generation it came from.

| Files | Generated | Notes |
|---|---|---|
| `backgrounds/booth_front.png` | Higgsfield, Seedream 4.5 | Ratchet's kiosk (ART_QUEUE §2g); matted with Higgsfield `remove_background` |
| `backgrounds/den_interior.jpg` | Higgsfield | the A0B workshop backdrop (§2g) |
| `characters/npc/ratchet_resting.png` | Higgsfield, Seedream 4.5 | Ratchet powered down (§2g); fired against his own atlas row as reference |
| `characters/npc/ratchet/work_1.png` | Higgsfield, Nano Banana Pro | Ratchet at work: hammering (§2t) |
| `characters/npc/ratchet/work_2.png` | Higgsfield, Nano Banana Pro | Ratchet at work: folded over, turning the piece (§2t) |
| `characters/npc/ratchet/tic.png` | Higgsfield, Nano Banana Pro | Ratchet's tic — the reach that never completed (§2t) |
| `characters/npc/ratchet/notice.png` | Higgsfield, Nano Banana Pro | Ratchet looks up: she is here (§2t) |
| `characters/npc/ratchet/talk_1.png` | Higgsfield, Nano Banana Pro | Ratchet talking, hand on his own helmet (§2t) |
| `characters/npc/ratchet/talk_2.png` | Higgsfield, Nano Banana Pro | Ratchet talking, presenting the part (§2t) |
| `characters/npc/ratchet/vent.png` | Higgsfield, Nano Banana Pro | Ratchet braced, blowing off heat (§2t) |
| `characters/sage/*.png` | Higgsfield, Seedream 4.5 | the sage's six states (§2e); five matted with `remove_background`, all six one identity |
| `characters/bat/*.png` | Higgsfield, Seedream 4.5 | the robot bat's five states (§2d); one plate anchored the design, four fired against it |
| `backgrounds/cave_mouth.jpg` / `cave_exit.jpg`, `characters/gear/pillar.png` | Higgsfield, Seedream 4.5 | the crystal cave (§2c); the exit fired against the mouth so both sides are one rock |
| `backgrounds/gate_*.jpg`, `backgrounds/cave_mouth_[a-e].jpg` | Higgsfield, Seedream 4.5 | the five kingdom gates and five grotto mouths (§2f); the mouths fired against `cave_mouth.jpg` |
| `backgrounds/oracle_booth.png` / `oracle_interior.jpg`, `characters/breaker/*.png` | Higgsfield, Seedream 4.5 | the Oracle's shrine and parlor (§2h) and the Breaker's three states (§2i) |
| `video/sword_forge.mp4` / `.webm` | Higgsfield, Seedance 2.5 | the forging cinematic (§1d), animated from a Seedream opening frame |
| `characters/hero/*`, `characters/hzd_8yaw*.png` | Higgsfield | HZD-99's body and turnarounds (§1), all pinned to the canon reference element |
| `fx/slash_[h,d,u,dn].png`, `characters/gear/jetpack*.png` | Higgsfield | the crystal slash light-sheets (§1b-i) and the back-jet gear (§1c) |
| `characters/{kiln,rime,snare}/*.png`, `backgrounds/winch_house.png` | Higgsfield, Seedream 4.5 | the zone C/D/E enemies (§2l, §2n, §2p) and Servo's winch (§2t) |
| `backgrounds/{forge,carrel,hollow}_front.png` / `_interior.jpg` | Higgsfield, Seedream 4.5 | the Tinker's forge (§2k), the Archivist's carrel (§2m) and Lumen's hollow (§2o) |
| `characters/npc_6yaw.png`, `characters/roster_8yaw.png` | Higgsfield | the NPC and creature turnaround sheets |
| `characters/beasts/*`, `characters/flora/*`, `characters/gear/*` | Higgsfield | the animal line, the flora deck, the equipment plates |
| `backgrounds/ceil_*.jpg`, `backgrounds/lair_*.png`, `backgrounds/gate_city.jpg` | Higgsfield | ceiling tiers, guardian lairs, the city gate monument |
| boss parts atlases (per-guardian) | Higgsfield | restyled through `tools/bossparts.cjs`; see ART_BIBLE.md §3 |
| `video/*.mp4` | Higgsfield | the intro films and cinematics |

### Generated audio — the score, the voices and the foley

Same declaration, same rule: everything below was **generated with Higgsfield**
and then normalised, trimmed, looped or cut by hand into the shipped file. None
of it samples a published recording, and nothing here is a performance by a
person. It is listed separately from the picture table only because it is
measured differently — a take is refused on peak level and loudness range
rather than on a contact sheet.

| Files | Generated | Notes |
|---|---|---|
| `music/mus_title.m4a`, `mus_intro.m4a`, `mus_meadows.m4a`, `mus_conduits.m4a`, `mus_foundry.m4a`, `mus_archives.m4a`, `mus_nest.m4a`, `mus_cache.m4a`, `mus_eye.m4a`, `mus_ending.m4a` | Higgsfield | the score: title, the comic intro, the six kingdoms and the ending. Every track carries the same four-note falling motif. Normalised to −3 dBFS on encode, 128 kbps AAC so Safari decodes it |
| `music/mus_boss.m4a`, `mus_nullfang.m4a`, `mus_talonhost.m4a`, `mus_furnace.m4a`, `mus_glaciere.m4a`, `mus_prism.m4a`, `mus_mother.m4a`, `mus_alpha.m4a`, `mus_alphatame.m4a` | Higgsfield | one theme per guardian, plus the alpha duel and the tamed reprise |
| `music/mus_hero.m4a` | Higgsfield | HER motif (ART_QUEUE §2ae) — the rising five-note music-box line the score never had. Three takes fired, the flat one refused on loudness range (LRA 5.2 against 14.1), the keeper mastered to −14 LUFS. Leads the title slot |
| `sfx/vox/hzd_*.wav` | Higgsfield | HZD-99's own voice: the kiai that escalates with the combo, hurt, death, dash, jump, land, heal, evolution, the charge release. −17 LUFS, mono, trimmed to game length |
| `sfx/vox/roar_*.ogg`, `atk*.ogg`, `dash.ogg`, `djump.ogg`, `hurt.ogg`, `land.ogg`, `purr.ogg`, `win.ogg` | Higgsfield | the guardians' roars — each one its own animal — and the first pass of her barks |
| `vox/*.ogg` | Higgsfield | the machine folk speaking: eighteen lines, six characters, one voice each. Streamed, never decoded |
| `sfx/hz_*.ogg` | Higgsfield | her foley (§2ae): paired swings, the finisher, the volt burst, dash, the charge swell, the ready chime, jump, land, and five authored footstep pairs — metal, grass, rock, ice, and the Nest's roots. Gain-matched to −6 dB peak; near-silent takes refused on measurement and re-fired |
| `sfx/hz_evosting.ogg`, `hz_winsting.ogg` | cut from `mus_hero.m4a` | her motif quoted at her moments — the same five notes, not a soundalike |
| `sfx/fz_*.ogg` | Higgsfield | the foes' shared combat vocabulary (§2ae): three telegraph tiers, slam, phase, wave, spike, summon, wreck, part-break, the three elemental casts — plus a roar per guardian, picked at play time by who is roaring. Gain-matched to −4 dB peak |
| `sfx/hum_*.ogg` | Higgsfield | the NPC presence loops (§2ae): six ambient beds, each cut to a seamless three seconds with the tail crossfaded into the head. The cave keeps its synth on purpose — its line changes when the beacon is found |

Every one of these has a **synthesised floor underneath it** in `js/audio.js`.
That is a licensing fact as much as an engineering one: no shipped moment
depends on a generated file being present, so a take that ever had to be pulled
could be pulled.

**Rule for adding to this table:** a generated asset is not finished until it
has a line here and its as-fired original is in `assets/source/`, both in the
same commit as the asset itself.

## Integration notes

- The playable single-file build (`play.html`) still uses the procedural
  art/audio so it stays a small self-contained artifact.
- The multi-file build (`index.html` + `js/`) is where these assets get wired
  in: backgrounds as parallax image layers, music via an `<audio>`/WebAudio
  buffer path replacing or layering over the synth OST, SFX buffers replacing
  the synth effects one by one.
- Rule for any future additions to this folder: only CC0 or CC-BY (with the
  credit recorded here BEFORE committing); never "free for personal use",
  never ripped game assets.
