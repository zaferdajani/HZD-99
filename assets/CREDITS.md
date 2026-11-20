# CLAWBYTE — Third-Party Asset Credits & Licenses

**Published by VibeSolutions.** Every release out of this repository — the web
build, the native app and the desktop shell — carries that name, and it is the
entity the licence obligations below are met by.

Every asset in this folder was downloaded from OpenGameArt.org and is published
under **CC0 1.0 (public domain dedication)** — verified on each source page at
the time of download (2026-07-19). CC0 permits commercial use, modification and
redistribution with no attribution required; we credit the authors anyway out
of respect. License text: https://creativecommons.org/publicdomain/zero/1.0/

## backgrounds/

| File | Author | Source |
|---|---|---|
| sci_fi_bg1.jpg | hassekf | https://opengameart.org/content/sci-fi-background |

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
| hit_01.ogg, hit_02.ogg, metal_05.ogg, explosion.ogg | rubberduck | https://opengameart.org/content/100-cc0-sfx |
| laser2.mp3, zapTwoTone.mp3 | Kenney (kenney.nl) | https://opengameart.org/content/63-digital-sound-effects-lasers-phasers-space-etc |

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
| `backgrounds/kerf_front.webp`, `source/kingdomX/kerf_front.png` | Higgsfield, GPT Image 2.5 | THE KERF — the Cutter's cloven stone, kingdom X's structure (ART_QUEUE §2aq); fired 2026-09-29 to the written brief, keyed with `tools/blackkey.cjs` |
| `backgrounds/kerf_interior.jpg`, `source/kingdomX/kerf_interior.png` | Higgsfield, GPT Image 2.5 | V1B, the inside of the Kerf (ART_QUEUE §2aq): the cutting jig, the sawn back wall and the crystal that is the room's only light |
| `characters/npc_6yaw.webp` row 8, `source/kingdomX/kerf_turn.png` | Higgsfield, GPT Image 2.5 | KERF's six-view turnaround (ART_QUEUE §2aq), appended to the shared NPC sheet by `tools/npcrow.cjs`; rows 1-7 are unchanged |
| `characters/npc/kerf/work_loop.webp`, `source/kingdomX/kerf_work.png` | Higgsfield, GPT Image 2.5 | KERF's work loop — THE CUT (ART_QUEUE §2aq), eight cells, fired against her own turnaround as the identity reference |
| `characters/npc/bust/kerf.webp` | derived, not generated | KERF's dialogue bust, cut from column 2 of her turnaround row by `tools/npcbusts.cjs` — same provenance as the other six |
| `backgrounds/den_interior.jpg` | Higgsfield | the A0B workshop backdrop (§2g) |
| `characters/npc/ratchet_resting.png` | Higgsfield, Seedream 4.5 | Ratchet powered down (§2g); fired against his own atlas row as reference |
| `characters/npc/ratchet/work_1.png` | Higgsfield, Nano Banana Pro | Ratchet at work: hammering (§2t) |
| `characters/npc/ratchet/work_2.png` | Higgsfield, Nano Banana Pro | Ratchet at work: folded over, turning the piece (§2t) |
| `characters/npc/ratchet/tic.png` | Higgsfield, Nano Banana Pro | Ratchet's tic — the reach that never completed (§2t) |
| `characters/npc/ratchet/notice.png` | Higgsfield, Nano Banana Pro | Ratchet looks up: she is here (§2t) |
| `characters/npc/ratchet/talk_1.png` | Higgsfield, Nano Banana Pro | Ratchet talking, hand on his own helmet (§2t) |
| `characters/npc/ratchet/talk_2.png` | Higgsfield, Nano Banana Pro | Ratchet talking, presenting the part (§2t) |
| `characters/npc/ratchet/vent.png` | Higgsfield, Nano Banana Pro | Ratchet braced, blowing off heat (§2t) |
| `characters/npc/ratchet/work_loop_six.webp` | Higgsfield | Ratchet's six-frame work cycle, the owner's 2026-09-24 upload (`character-artwork-20260924-212948.zip`, fetched from the Higgsfield CDN), wired as `ratchetLoop`; sha256 and pivot in `source/ratchet/work-loop-six/manifest.json` |
| `characters/npc/ratchet/{work_1,work_2,tic,notice,talk_1,talk_2,vent}.webp`, `characters/npc/ratchet_resting.webp`, `characters/npc/bust/ratchet.webp`, `characters/npc/ratchet/{work_loop_six,wrist_release}.webp` (as shipped from 2026-11-15) | Higgsfield, Nano Banana Pro | RATCHET REPAINTED AS METAL (ART_QUEUE §2r-ii). The same eleven images — same poses, same boxes — restyled from the plates they replace: `talk_1` first as the style anchor, the other ten against the old plate (shape) and the anchor (finish). The two strips are restyles of the owner's own 2026-09-24 uploads, which are kept byte for byte in `source/ratchet/work-loop-six/supplied.webp` and `source/ratchet/wrist-release/supplied.webp`; the nine earlier plates are in `source/ratchet/pre-metal/`. As-fired takes in `source/ratchet/metal/`, cut by `tools/reframe.cjs` |
| `characters/hero/impatient.webp`, `source/hero/impatient/*` | Higgsfield, GPT Image 2.6, the HZD-99 canon element embedded | HZD-99's impatient wait — arms crossed, foot tapping, eight cells (ART_QUEUE §1-imp). Generated against her own delivered three-quarter sheet (`source/hero/delivered/b5_interact.png`); the as-fired sheet and the two refused rounds are archived, cut by `tools/gridstrip.cjs` |
| `backgrounds/toolbox.webp`, `backgrounds/toolbox_open.webp`, `manhua/ch1/game/toolbox.webp`, `manhua/ch1/game/l_cell.webp`, `source/den/toolbox/*`, `source/manhua/ch1/game/toolbox-2026-11-15.json` | Higgsfield, Nano Banana Pro 2k | THE DEN TOOLBOX and the two comic panels round it (owner, 2026-11-15: the battery is in the toolbox on the floor, not a drawer, and the toolbox is not the work table). An oxblood-red steel toolbox with brass latches, shut with the battery's cyan light under its lid, and open and empty; then the panel where she takes the battery out of it and the letter panel where he puts it in, both drawn from the plate. AI-generated; prompts and job ids in the two JSON files. |
| `characters/sage/*.png` | Higgsfield, Seedream 4.5 | the sage's six states (§2e); five matted with `remove_background`, all six one identity |
| `characters/bat/*.png` | Higgsfield, Seedream 4.5 | the robot bat's five states (§2d); one plate anchored the design, four fired against it |
| `backgrounds/cave_mouth.jpg` / `cave_exit.jpg`, `characters/gear/pillar.png` | Higgsfield, Seedream 4.5 | the crystal cave (§2c); the exit fired against the mouth so both sides are one rock |
| `backgrounds/gate_*.jpg`, `backgrounds/cave_mouth_[a-e].jpg` | Higgsfield, Seedream 4.5 | the five kingdom gates and five grotto mouths (§2f); the mouths fired against `cave_mouth.jpg` |
| `backgrounds/oracle_booth.png` / `oracle_interior.jpg`, `characters/breaker/*.png` | Higgsfield, Seedream 4.5 | the Oracle's shrine and parlor (§2h) and the Breaker's three states (§2i) |
| `video/sword_forge.mp4` / `.webm` | Higgsfield, Seedance 2.5 | the forging cinematic (§1d), animated from a Seedream opening frame |
| `video/ratchet_wake.mp4` / `.webm` | Higgsfield, Kling 3.0 | THE WAKING — she pushes Ratchet's cell home and he comes on (2026-10-12), animated from a Nano Banana opening frame drawn with both canon elements; as fired in `source/films/` |
| `video/meet.mp4` / `.webm` | Higgsfield, Seedance 2.5 | THE CORRIDOR — the first meeting with NULLFANG, from her canon element and a screenshot of the lion; as fired in `source/films/` |
| `characters/chime/*.webp`, `source/alpha/takes/*.mp4`, `source/chime/takes/*.mp4` | Higgsfield, Seedance 2.5 | CHIME's move strips and the first Alpha's takes (ART_QUEUE §2ax; the first Alpha's strips are retired): takes started from each rig's own assembled rest frame, cut by `tools/vidstrip.cjs` |
| `characters/alpha/{rest,prowl,roar,howl,leap,air,claw,bite,clinch,yield}.webp` | Higgsfield, GPT Image 2.5 + Seedance 2.5 | THE ALPHA, THE PACK'S BREED (2026-10-10, ART_QUEUE §2be): a boss plate re-drawn from the pack's approved design and filmed in place, every state cut at one scale and one floor line by `tools/fixcut.py`; plate, take sheets, cut spec and anchor sheets in `source/beasts/alpha2/` |
| `characters/beast/*.webp`, `source/beast/takes/*.mp4` | Higgsfield, Seedance 2.5 | NULLFANG's move strips: the `studio-*` takes (2026-10-04) and the first-take `fall`, cut by `tools/vidstrip.cjs`; the takes archived in `source/beast/`. The rest of the first-take set (ART_QUEUE §2ax) was retired 2026-10-09; its `stalk` strip is kept as a scale reference at `source/beast/stalk.webp` |
| `characters/hero/gait/*`, `hero/idle.webp`, `hero/hurt.webp`, `hero/swing/uppercut.webp`, `source/hero/takes2/*.mp4`, `source/hero/rig/*` | Higgsfield — Seedance 2.5, Meshy multi_image_to_3d / 3d_rigging | HZD-99's filmed move strips (ART_QUEUE §2aw): takes started from her own painted plates; the rigged model and its clips archived for the record |
| `characters/hero/idle.webp`, `hero/gait/walk|run.webp`, `hero/fidget.webp`, `hero/heal.webp`, `hero/heal_fx.webp`, `hero/death.webp`, `hero/hurt.webp`, `hero/trans_{air,land,skid,dash,wall,takeoff}.webp`, `hero/gate_walk.webp`, `hero/gate_run.webp`, `hero/gate_walk_{single,dual,joined}.webp`, `hero/swing/{claw_1,claw_2,burst,burst_fx}.webp` (claw_2 and burst are 2026-09-18 delivery outputs pinned by tests/hero-delivery.cjs; SWING_STRIP draws claw_1/uppercut/claw_charge for those blows), `source/hero/delivered/*` | OpenAI GPT Image, prompted and reviewed by the owner | HZD-99's DRAWN animation sheets (2026-09-15/16). Generated outside this repo to the briefs in `docs/ART_PROMPTS_GPT.md` and handed over as finished sheets; every one is archived unaltered in `source/hero/delivered/` and cut into strips here by `tools/sheetslice.cjs` + `tools/movestrip.cjs` (bodies) or `tools/fxstrip.cjs` (effects). These supersede the filmed and Higgsfield-painted versions of the same moves, which stay on disk as the record |
| `characters/hero/*`, `characters/hzd_8yaw*.webp` | Higgsfield | HZD-99's body and turnarounds (§1), all pinned to the canon reference element; restyled 2026-09-03 into the corridor film's painted look (ART_QUEUE §2am), every plate archived in `source/hero/style_d/` |
| `characters/gear/jetpack.webp` | Higgsfield | the back-jet gear (§1c) |
| `characters/{kiln,rime,snare}/*.png` | Higgsfield, Seedream 4.5 | the zone C/D/E enemies (§2l, §2n, §2p) |
| `backgrounds/{forge,carrel,hollow}_front.png` / `_interior.jpg` | Higgsfield, Seedream 4.5 | the Tinker's forge (§2k), the Archivist's carrel (§2m) and Lumen's hollow (§2o) |
| `characters/npc_6yaw.webp`, `characters/roster_8yaw.png` | Higgsfield | the NPC and creature turnaround sheets; the NPC sheet refired 2026-09-03 into the corridor film's painted look, 42 cells, every plate in `source/npc/style_d/`; the roster's five enemy rows refired the same day, 40 cells, in `source/roster/style_d/` (ART_QUEUE §2am) |
| `characters/beasts/*`, `characters/flora/*`, `characters/gear/*` | Higgsfield | the animal line, the flora deck, the equipment plates; the wolf line (the cheetah plates; the Alpha's plates, the two-frame walk/run pairs and every earlier wolf plate were retired 2026-10-09) refired 2026-09-03 into the corridor film's painted look, in `source/beasts/style_d/` (ART_QUEUE §2am) |
| `characters/gear/spare_cell.webp`, `scrap_pile.webp` | Higgsfield, GPT Image 2.5 | the opening's Spare Power Cell (for Servo) and the handful of scrap Ratchet pays for the repair — styled against `repair_battery.webp`, keyed off chroma green (2026-10-09); sources in `source/gear/` |
| `characters/gear/repair_panel.webp`, `repair_battery.webp`, `wake_lamp.webp` | Higgsfield, GPT Image 2.5 | Ratchet's repair board and power cell (loaded by URL from js/story-repair.js), the wake-room lamp (2026-10-09); sources in `source/gear/` |
| `characters/beasts/cheetah_{walk8,run6}.webp` | Higgsfield, GPT Image 2.5 + Seedance 2.5 | the cheetah's filmed walk and run cycles, one stride each, cut by `tools/vidstrip.cjs` (2026-10-09); takes in `source/beasts/cycles/` |
| `manhua/ch1/game/*.webp`, `manhua/ch1/clean/*.webp` | Higgsfield, Nano Banana Pro (+ one GPT Image 2.5 edit) | THE GAME'S CHAPTER-ONE PANELS (2026-10-10): seventeen unlettered panels for the scenes the approved pages never drew, and the approved pages re-drawn with their lettering removed so the game can letter them in five languages; prompts and job ids in `source/manhua/ch1/{game,clean}/prompts.json` |
| `characters/beasts/wolf_{idle6,prowl8,gallop6,coil6,bite6,crouch4,leap6,landing4,recoil6,pant6,purify6,sit6}.webp` | Higgsfield, GPT Image 2.5 + Seedance 2.5 | THE PACK, FILMED WHOLE (2026-10-09): the owner's new wolf design re-plated onto chroma green and filmed in eleven takes off one start plate, every state cut at one scale and one floor line by `tools/fixcut.py`; plates, take sheets and the cut spec in `source/beasts/wolf2/`. Replaces every earlier wolf plate and strip |
| `characters/beasts/wolf_{snarl8,lunge6,thrash8,bay6,roll12,stalk10,charge8}.webp` | Higgsfield, Seedance 2.5 | THE PACK'S AGGRESSIVE SET (2026-11-15): the same wolf, from the same start plate, re-filmed in three takes — threat display / lunge / bite held and thrashed; hunting stalk / charge; thrown off its feet, the roll and the low snarl it comes up in. Each take is performed over a MOTION REFERENCE of a realistic wolf doing the same thing, and those three references were themselves generated with Higgsfield Seedance 2.5 (no freely licensed side-view footage of these behaviours was found; no third-party footage was used; the references are never shipped). Masters, reference sheets, prompts, job ids and the cut spec in `source/beasts/wolf3/`. `wolf_bite6` stays in use as the air snap a wolf at bay makes between bites |
| `characters/gravehorn/*.webp`, `source/gravehorn/*` | Higgsfield, GPT Image 2.6 | GRAVEHORN (2026-11-15): the Eye's rhino as a machine built on real white-rhinoceros anatomy — design plate and a body-and-heads sheet, fired against the stand-in rig (geometry only) and one cell of the Wolf King (finish only). Horns, leg segments, hoof and tail are cut from the design plate by `tools/ghparts.cjs`. The eye, the nozzle glow, the wind-up amber and phase two's molten seams are the game's own light. Job ids in `source/gravehorn/provenance.json`. |
| `characters/gravehorn/turn34.webp`, `characters/gravehorn/turn_front.webp`, `source/gravehorn/turn.webp` | Higgsfield, GPT Image 2.6 (1k, MEDIUM quality — credits) | GRAVEHORN'S TURN (2026-11-16, owner: "now it's just rotating as a simple paper leaf instead of actually rotating like a normal animal"): one plate of the same machine at three-quarter and head-on, fired against the design plate (job `0637ba68-7940-4ce1-b14a-3bb3aef167c6`), cut and anchored by `tools/ghturn.cjs`. The plate came back with a part-transparent haze: it is keyed at alpha >= 235 and opened. A HIGH-quality re-fire is on ART_QUEUE §2br. |
| `manhua/ch1/game/passage_b.webp`, `source/manhua/refire-2026-11/*` | Higgsfield, GPT Image 2.6 | THE PASSAGE, RE-DRAWN ON MODEL (2026-11-16, owner: "This one is for the hero that does not look like our hero from behind. He looks more like a ninja"): the panel fired again with the canon hero element embedded (job `d903567c-c576-40c9-89e7-8e268c53a9da`); the panel it replaces is kept beside it as `passage_b_before.jpg`. The other off-model panels are listed on ART_QUEUE §2bs. |
| `backgrounds/ring_{quarry,meadow,den,cave}.webp`, `source/gates/ring_*` | Higgsfield, GPT Image 2.6 | THE RING GATES (2026-11-15): the machine ring that stands at every walk-in passage — set in cut marble at the quarry, overgrown in the meadow, fanged and crowned with the pack's skull at the Wolf King's den, braced into a rock mouth in the caves. Fired against `gate_conduits.jpg` for finish only. The live field inside each ring, the lamps on its band and its light on the floor are the game's own, drawn behind and over the plate. Prompts and job ids in `source/gates/ring_prompts.json`. |
| `characters/hero/swing/down.webp`, `hero/swing/down_{single,dual,joined}.webp`, `source/hero/plunge/*` | Higgsfield, GPT Image 2.6 | THE DIVE (2026-11-15): her down-strike as its own move — claws first, and the same dive with each blade point-down in her paws. Eight drawn cells a sheet (tuck, dive, two falling, landed, held, rising, standing), every one embedding her canon element, the blades copied from her own swing strips. The blue she falls in and the blue that comes back up where she lands are the game's own light, drawn over the plates. Prompts, job ids and the cut are in `source/hero/plunge/prompts.json`. |
| `characters/beasts/cheetah_{winded6,land4}.webp`, `characters/roster/*`, `characters/talon/*`, `characters/bat/flight6.webp`, `characters/sage/{walk8,exhale}.webp` | Higgsfield, GPT Image 2.5 + Seedance 2.5 | the pack's openings and the roster's filmed walks and flights, plus the minion's perch and the sage's exhale (ART_QUEUE §2cc-iii…vii, 2026-10-09); sources in `source/beasts/cycles/`, `source/roster/cycles/`, `source/talon/`, `source/bat/cycles/`, `source/sage/` |
| `backgrounds/ceil_*.jpg`, `backgrounds/lair_*.png`, `backgrounds/gate_city.jpg` | Higgsfield | ceiling tiers, guardian lairs, the city gate monument |
| boss parts atlases (per-guardian) | Higgsfield | restyled through `tools/bossparts.cjs`; see ART_BIBLE.md §3. NULLFANG's atlas refired 2026-09-03 into the corridor film's painted look, 16 parts in `source/beast/style_d/` (ART_QUEUE §2am) |
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
| `characters/npc/mono/work_loop.webp` (robe backing) | derived | `tools/shroudback.cjs` fills the inside of the cable shroud that the key removed, behind the Higgsfield take; the keyed master is `assets/source/npc/mono/work_loop_keyed.webp`. No new art. |
| `sfx/vox/hzd_*.wav` | Higgsfield | HZD-99's own voice: the kiai that escalates with the combo, hurt, death, dash, jump, land, heal, evolution, the charge release. −17 LUFS, mono, trimmed to game length |
| `sfx/vox/roar_*.ogg`, `purr.ogg`, `win.ogg` | Higgsfield | the guardians' roars — each one its own animal — and her purr and win (the first-pass barks were retired for the `hzd_*.wav` set) |
| `vox/*.ogg` | Higgsfield | the machine folk speaking: eighteen lines, six characters, one voice each. Streamed, never decoded |
| `manhua/ch1/game/{cv_mouth,cv_walk,m_stalk}.webp` | Higgsfield, GPT Image 2.6 | CONTINUITY (2026-11-17, owner: "why images show me entering cave with marble holding my sword when i dont have it yet ?"): the two cave panels fired again with her hands empty, and one new panel of NULLFANG in his own gunmetal for the corridor meeting, which used to crop a white lion off page 14. Masters, the refused sworded versions and job ids in `source/manhua/refire-2026-11/`; what was looked at is recorded in `source/manhua/continuity.json`. |
| `sfx/hz_*.ogg` | Higgsfield | her foley (§2ae): paired swings, the finisher, the volt burst, dash, the charge swell, the ready chime, jump, land, and five authored footstep pairs — metal, grass, rock, ice, and the Nest's roots. Gain-matched to −6 dB peak; near-silent takes refused on measurement and re-fired |
| `sfx/hz_evosting.ogg`, `hz_winsting.ogg` | cut from `mus_hero.m4a` | her motif quoted at her moments — the same five notes, not a soundalike |
| `sfx/fz_*.ogg` | Higgsfield | the foes' shared combat vocabulary (§2ae): three telegraph tiers, slam, phase, wave, spike, summon, wreck, part-break, the three elemental casts — plus a roar per guardian, picked at play time by who is roaring. Gain-matched to −4 dB peak |
| `sfx/hum_*.ogg` | Higgsfield | the NPC presence loops (§2ae): six ambient beds, each cut to a seamless three seconds with the tail crossfaded into the head. The cave keeps its synth on purpose — its line changes when the beacon is found |
| `manhua/ch1/p01.webp` … `p27.webp` | Higgsfield | THE MANHUA, chapter one, second edition (docs/MANHUA.md): 27 full-colour pages drawn from `docs/STORY_SCRIPT.md` §1–2 to the `manga-writing` skill — spoken lines, logs, signs and narrator cards verbatim, the game's UI told as narration — with every character anchored to elements made from the plates the game draws today (HZD-99, Ratchet, the crawler, the ivory NULLFANG, the quilled pack and its Alpha, the hooded sage, Chime, Old Servo, the shield guard); as-fired masters in `source/manhua/ch1/` (`*_asfired.jpg`, the refused first edition kept as `*_ed1_asfired.jpg`), exact prompts and every take in `source/manhua/ch1/prompts.json`; **generated with Higgsfield** |

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

## Hero voice cleanup — 2026-09-11

The existing hzd_atk2 recording has low-frequency rumble removed; hzd_yalla is pitch-shifted with preserved duration. Both keep mono output, a 0.78 peak ceiling, and smooth attack/tail fades. No new source recording or license was introduced. Original and result SHA-256 values and exact filters are in docs/AUDIO_POLISH.json.


### HZD-99 source-preserving delivery (2026-09-18)

The owner supplied the ChatGPT-generated hero PNGs inventoried in `source/hero/delivery-2026-09-18/supplied-inventory.json`. Sixteen new run frames were generated with OpenAI ChatGPT image generation using the approved guard as reference (`source/hero/delivery-2026-09-18/run{A,B,C,D}.png`). These hero assets are not Higgsfield generations. Source hashes and transformations are in the delivery manifest; see `docs/ART_IMPORT_2026-09-18.md`.

Recovered single/dual/joined weapon actions, claw variants, recharge and aerial actions, and the two additional effect sheets were generated with OpenAI ChatGPT image generation from the owner-supplied references. The unmodified inputs, recovered outputs and source-to-runtime mapping are archived under `source/hero/delivery-2026-09-18/`. Existing Higgsfield child-voice recordings are preserved; this delivery generates no new vocals.

## Nullfang motion and creature foley — 2026-10-04

`characters/beast/studio-*.webp` are frames from original Higgsfield Seedance 2.5 performances, anchored to this repository's Nullfang reference. No third-party game frames or recordings were used. Original takes and job IDs are retained under `assets/source/beast/studio-2026-10-04/`. The turn and the standing idle (`studio-turn.webp`, `studio-idle.webp`, 2026-11-13) are two further Seedance 2.5 takes started from frame 0.02 s of the pounce master; masters, prompts and job ids in `source/beast/studio-2026-11-13/`. All nine strips were re-derived that day to one tone curve (`source/beast/studio-2026-10-04/grade.json`); no pixel in them is hand-drawn. **Generated with Higgsfield.**

`sfx/nullfang/{step,coil,leap,swipe,land,hurt,roar,arrive,awake,breath}.ogg` are generated creature sound and foley from those same Higgsfield performances, trimmed to event timing, peak-normalized, and faded with `tools/lion-audio.py`. `audio-cuts.json` records exact source windows and timing. These are generated audio, not field recordings or a licensed Disney soundtrack.

`source/brand/appicon.png` — the app icon (HZD-99, bust, claw raised), Higgsfield GPT Image 2.6 from the canon HZD-99 element, 2026-11-14; prompt and job ids in `source/brand/jobs.json`. Every launcher icon and launch image in `ios/` and `android/` is cut from it by `tools/appicon.cjs`. **Generated with Higgsfield.** `aac/**` is a derived copy of `sfx/**/*.ogg` and `vox/*.ogg` (AAC, for devices that cannot decode Ogg) — no new recordings.

`characters/beast/studio-turn.webp` was re-filmed 2026-11-14 (Higgsfield Seedance 2.5; master `source/beast/studio-2026-11-13/turn2.mp4`), performed over a motion reference of a realistic lion turning round that was itself generated with Higgsfield Seedance 2.5 (`turn2-reference-lion.mp4`, archived, never shipped). No third-party footage was used. The first take stays in the archive as `turn.mp4`.

`characters/beast/studio-roar.webp` was re-filmed 2026-11-14 (Higgsfield Seedance 2.5, clean black, from the same standing frame; master `source/beast/studio-2026-11-13/roar.mp4`); the 2026-10-04 take it replaces stays in `source/beast/studio-2026-10-04/`.

`characters/agents/{tally,leash,undertow}/*.webp` — three of the Eye's agents, eight states each (2026-11-17): stills by Higgsfield GPT Image 2.6, walks filmed with Higgsfield Kling 4.0 Flash from each agent's own stand plate; masters, job ids and the cut in `source/agents/`. `tiles/platobj_{a,x,b}.webp` — deck objects for the city, the caves and the Conduits (GPT Image 2.6; `source/platforms/`, cut by `tools/platobj.cjs`). `characters/beasts/cheetah_down6.webp` — the cat folding down (Kling 4.0 Flash; `source/beasts/cycles/cheetah_down_take.jpg`). `characters/npc/mono/{resting,talk_1,talk_2}.webp` — the Oracle resting and speaking (GPT Image 2.6; `source/npc/mono/`). `characters/gravehorn/turn{34,_front,_rear,_tail}.webp` — GRAVEHORN's turn at 2k with the rear and tail-on views (GPT Image 2.6; `source/gravehorn/turn3.webp`, `turn_tail.webp`, cut by `tools/ghturn.cjs`). `manhua/ch1/game/ch2_b.webp` re-fired with UNDERTOW's own figure (`source/manhua/refire-2026-11/`). **Generated with Higgsfield.** No third-party artwork or footage was used.

`manhua/ch1/game/{passage_a,cv_mouth,cv_walk,d_door,d_walk,f_blade,f_strike,fight_a,break_a,f_walk,m_down,s_ring,sage_rev,s_cell,s_cleanse}.webp` were re-fired 2026-11-17 (Higgsfield GPT Image 2.6) so the hero, NULLFANG and TALLYMAN are on model; masters, the refused panels and job ids in `source/manhua/refire-2026-11/`. **Generated with Higgsfield.**

`manhua/ch1/game/{d_walk,d_door,d_road}.webp` — the road pages, which played as she stepped out of the service bay — were taken out of the game 2026-11-19 on the owner's word (comics only from the city gate on) and moved, unchanged, to `source/manhua/ch1/game/retired-bay/`.

`characters/agents/{slag,redact,lapid,pupil}/*.webp` — the other four of the Eye's agents (SLAGFATHER, REDACTOR, LAPIDARY, PUPIL), eight states each (2026-11-17): stills by Higgsfield GPT Image 2.6, walks filmed with Higgsfield Kling 4.0 Flash from each agent's own stand plate; masters, job ids and the cut in `source/agents/`. **Generated with Higgsfield.**

`characters/agents/tally/rig/*.webp` — TALLYMAN's body as seven separate parts for the rig (2026-11-17, Higgsfield GPT Image 2.6 against his own stand plate; master `source/agents/tally/parts_asfired.webp`, cut by `tools/agentparts.cjs`). **Generated with Higgsfield.**
`backgrounds/gate_city.jpg` re-fired 2026-11-20 — the city gate in armour plate, rust and hydraulic hinges, its own old plate as the composition reference (Higgsfield GPT Image 2.6, job `f2147536-ce5b-4e5c-a7dd-3a76b12c8f64`; master `source/gates/gate_city_asfired.jpg`). **Generated with Higgsfield.**
`characters/agents/tally/hit{high,low}.webp` — TALLYMAN struck and staggered (2026-11-20, Higgsfield GPT Image 2.6 against his own stand plate; masters `source/agents/tally/hit{high,low}_asfired.jpg`, cut by `tools/plate.cjs`). **Generated with Higgsfield.**

## The Alpha's voice and the struck-metal hits — 2026-11-20

`sfx/alpha/howl.ogg` — a real wolf: National Park Service recording, Denali National Park
(`nps.gov/subjects/sound/sounds-wolf.htm`, `nri-WolfDENA.mp3`), a work of the U.S. Government,
public domain. Cut and level-normalised; master `source/audio/alpha/nps_wolf_dena.mp3`.

`sfx/alpha/howl_far.ogg` — real wolves: National Park Service recording, Yellowstone National Park,
25 December 2013 (`yell-YELLWolvesDec252013.mp3`, the park's sound library), public domain. Cut,
low-passed and normalised; master `source/audio/alpha/nps_yell-YELLWolvesDec252013.mp3`.

`sfx/alpha/{bark,snap,bite,claw,leap,growl,fury,rend}.ogg` — generated wolf foley (Higgsfield,
Mirelo text-to-audio), declared as generated; masters `source/audio/alpha/hf_*.mp3`.

`sfx/hits/*.ogg` — 45 impacts (metal, plate, tin, glass, bell, punch, soft, generic; three takes
each) from **Impact Sounds** by Kenney (www.kenney.nl), CC0 1.0 — no attribution required, given
anyway. Licence: `source/audio/kenney-impact/License.txt`.
