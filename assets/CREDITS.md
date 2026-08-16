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
| epic_combat.ogg | Chester01 | https://opengameart.org/content/epic-combat |
| battleThemeA.mp3 | cynicmusic (pixelsphere.org) | https://opengameart.org/content/battle-theme-a |
| boss_encounter.wav | cynicmusic (pixelsphere.org) | https://opengameart.org/content/dramatic-boss-encounter |
| ambient_observing_the_star.ogg | yd | https://opengameart.org/content/another-space-background-track |

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
| `characters/sage/*.png` | Higgsfield, Seedream 4.5 | the sage's six states (§2e); five matted with `remove_background`, all six one identity |
| `video/sword_forge.mp4` / `.webm` | Higgsfield, Seedance 2.5 | the forging cinematic (§1d), animated from a Seedream opening frame |
| `characters/hero/*`, `characters/hzd_8yaw*.png` | Higgsfield | HZD-99's body and turnarounds (§1), all pinned to the canon reference element |
| `characters/npc_6yaw.png`, `characters/roster_8yaw.png` | Higgsfield | the NPC and creature turnaround sheets |
| `characters/beasts/*`, `characters/flora/*`, `characters/gear/*` | Higgsfield | the animal line, the flora deck, the equipment plates |
| `backgrounds/ceil_*.jpg`, `backgrounds/lair_*.png`, `backgrounds/gate_city.jpg` | Higgsfield | ceiling tiers, guardian lairs, the city gate monument |
| boss parts atlases (per-guardian) | Higgsfield | restyled through `tools/bossparts.cjs`; see ART_BIBLE.md §3 |
| `video/*.mp4` | Higgsfield | the intro films and cinematics |

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
