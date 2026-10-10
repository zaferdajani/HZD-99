# The manhwa at story moments — event-to-panel map

Owner's order (2026-10-09): *use the existing manhwa at story moments; preserve
chronology, character identity and story meaning; never use superseded pages or
invent events to fit pictures; report missing panels instead of substituting.*

The runtime copy of this map is `PANEL_SEQ` in `js/panels.js`; the words are in
`js/text-manhwa.js` (all five languages). `tests/panels.cjs` checks that every
crop lies inside its page, that each sequence fires once at its event, and the
player's input rules.

## Sources

- **Approved pages, unlettered (what the game crops, 2026-10-10):**
  `assets/manhua/ch1/clean/pNN.webp` — the second edition re-drawn through
  Higgsfield with every caption, balloon and word painted out, keyed at the
  master's own 1200×1789 so every crop rectangle is the same on either. The
  player letters each panel itself, in the player's language, typed out at the
  reading speed. The lettered masters `assets/manhua/ch1/pNN.webp` stay the
  manhua reader's pages (`docs/MANHUA.md`). Provenance:
  `assets/source/manhua/ch1/clean/prompts.json`.
  Two of the cropped pages carried superseded words in their balloons
  (p09's "crystal pillar" errand, p18's "pillar shard"); the old map
  captioned over them, so the screen showed both. That cannot happen now:
  `tests/panels.cjs` fails any captioned crop taken from a lettered page.
- **Panels made for the game's chapter one (2026-10-10):**
  `assets/manhua/ch1/game/<name>.webp` — single unlettered panels for the
  scenes the approved pages never drew (the eight groups below), in the
  chapter's style, every recurring body bound to its manhua element.
  Provenance and exact prompts: `assets/source/manhua/ch1/game/prompts.json`.
- **Not used:** the draft set `assets/manhua/revised-2026-09/`.
- **Regenerate "The map" below with `node tools/manhwamap.cjs`** — it is written
  from `PANEL_SEQ` and the caption table, so it cannot drift from the runtime.

## How a sequence plays

- **Trigger.** `panelsTick` (called at the top of `update`) watches the save's
  flags and the room. A sequence starts only when the room has settled (0.8 s
  after arrival — a crossing always finishes as a crossing), the player is
  grounded and `panelsSafe()` holds: state `PLAY`; no dialogue, item card, shop,
  offer, film, wake, gate walk, crossing, staged meeting/break, boss entry,
  finisher, pending boss reward, tutorial lock or hit-stop; no live projectile;
  no hostile within 600 px; any boss dead, tamed, purified or dormant.
- **Once.** Marked `G.save.panels.seen[id]` as it begins and persisted, so a
  reload never replays it. A save that had already passed an event when it was
  first seen by this build marks that sequence `past` instead of handing the
  player a recap.
- **Reading.** A caption reveals progressively; the first confirm completes it,
  a separate confirm advances; a caption never advances on its own. Silent
  panels turn by themselves after their hold. Reduced motion (OS setting or
  `G.save.opts.reduceMotion`) removes the ≤ 4 % push/drift and shows text whole.
  Arabic captions are right-aligned. The caption reveal sits behind a four-call
  adapter (`panelsReveal*`) for js/reveal.js to take over.
- **Skip.** Hold any confirm/back key (or the screen on touch) for
  `CUT_SKIP_HOLD`, the same deliberate hold as the films, with a filling bar.
- **Replay.** Pause ▸ *Story panels* lists the sequences this save has seen
  (only those) and replays them; the row appears once one exists.
- **Hooks.** `panelsPlay(id)` plays now (exact timing from another system, e.g.
  a dialogue's `onEnd`); `panelsQueue(id)` plays at the next safe moment;
  `panelsBusy()`.

## The map

### bay — The service bay

- **Event / trigger:** woke — first arrival outside the service bay (W1 → W2). Plays in room `W2` at the first safe moment.
- **Completion flag:** `G.save.panels.seen.bay` (set when it starts; `past.bay` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/clean/p04.webp` (p04 panel 2) | [52, 599, 385, 362] | — (silent) |  |
| 2 | `assets/manhua/ch1/clean/p04.webp` (p04 panel 3) | [461, 599, 685, 362] | `pc_quiet` | ...quiet. |
| 3 | `assets/manhua/ch1/clean/p04.webp` (p04 panel 5) | [52, 1308, 1094, 337] | `pc_door` | The door had been open a long time. |
| 4 | `assets/manhua/ch1/clean/p05.webp` (p05 panel 1) | [400, 33, 762, 341] | `pc_city` | The city was standing. It was silent. |

### gate — The city gate

- **Event / trigger:** gateOpened — first arrival inside the city gate (W2 → A0). Plays in room `A0` at the first safe moment.
- **Completion flag:** `G.save.panels.seen.gate` (set when it starts; `past.gate` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/clean/p05.webp` (p05 panel 3) | [38, 722, 1125, 626] | `pc_gates` | The gates were the only monument in the kingdom, and nobody had walked through them in a long time. |
| 2 | `assets/manhua/ch1/clean/p05.webp` (p05 panel 4) | [38, 1370, 1124, 386] | `pc_closed` | They closed behind her. Waking up is one-way too. |

### ratchet — Ratchet's battery

- **Event / trigger:** Ratchet's battery restored (ratchetRepaired / on_A0B|ratchet), after his wake talk and errand. Plays in room `A0B` at the first safe moment.
- **Completion flag:** `G.save.panels.seen.ratchet` (set when it starts; `past.ratchet` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/game/letter.webp` (game: letter) | [0, 0, 1600, 893] | `pc_letter` | A tag on his chest, in his own hand: his battery was in the drawer. |
| 2 | `assets/manhua/ch1/game/drawer.webp` (game: drawer) | [0, 0, 1600, 893] | `pc_drawer` | His own battery, exactly where he had left it. |
| 3 | `assets/manhua/ch1/game/repair.webp` (game: repair) | [0, 0, 1344, 752] | `pc_awake` | Ratchet was awake. |
| 4 | `assets/manhua/ch1/clean/p09.webp` (p09 panel 1) | [19, 17, 650, 389] | `pc_necklace` (n_ratchet) | The marble in my necklace was an old gift to my ancestor. It slowed the virus long enough for me to think. It could not stop the infection. |
| 5 | `assets/manhua/ch1/clean/p09.webp` (p09 panel 2) | [19, 418, 670, 359] | `pc_song` (n_ratchet) | Mother's song kept the robots of every kingdom in harmony. Someone unknown hacked its frequency and hid a virus inside it. |

### cave — The marble cave

- **Event / trigger:** first entry into the marble cave (CV1), through the buried mouth under the hub. Plays in room `CV1` at the first safe moment.
- **Completion flag:** `G.save.panels.seen.cave` (set when it starts; `past.cave` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/clean/p15.webp` (p15 panel 5) | [395, 1200, 770, 558] | `pc_breathing` | The rock gave way. The tunnel was open, and it was breathing. |
| 2 | `assets/manhua/ch1/clean/p16.webp` (p16 panel 1) | [69, 74, 690, 427] | — (silent) |  |
| 3 | `assets/manhua/ch1/clean/p16.webp` (p16 panel 3) | [69, 523, 1068, 305] | — (silent) |  |

### marble — The raw marble

- **Event / trigger:** the raw marble freed from its host rock in CV3 (pl_cshard). Plays in room `CV3` at the first safe moment.
- **Completion flag:** `G.save.panels.seen.marble` (set when it starts; `past.marble` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/game/marble_a.webp` (game: marble_a) | [0, 0, 1600, 893] | `pc_m_burst` | Claws glanced off it. The charge the pack gave her did not. |
| 2 | `assets/manhua/ch1/game/marble_b.webp` (game: marble_b) | [0, 0, 1600, 893] | `pc_m_freed` | Raw marble — rounded, unfinished. Not a blade yet. Ratchet would make it one. |

### forge — The forging

- **Event / trigger:** the first sword forged from the raw marble (crystal), after the forge film and its card. Plays in room `A0B` at the first safe moment.
- **Completion flag:** `G.save.panels.seen.forge` (set when it starts; `past.forge` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/clean/p18.webp` (p18 panel 2) | [42, 617, 1114, 355] | `pc_forge` (n_ratchet) | You brought the marble. Steady the clamp. I will shape the edge, then fit the grip. Cut what is holding them — not what is left of them. |
| 2 | `assets/manhua/ch1/clean/p18.webp` (p18 panel 3) | [52, 1120, 426, 620] | `pc_blade` | Ratchet forged a glowing white sword from the cave marble. It frees infected robots — and its handle can later connect to another weapon. |
| 3 | `assets/manhua/ch1/clean/p18.webp` (p18 panel 5) | [505, 1345, 300, 396] | — (silent) |  |

### passage — The maintenance door

- **Event / trigger:** first arrival in the maintenance tunnel (GA1T) through the door beside the quarry. Plays in room `GA1T` at the first safe moment.
- **Completion flag:** `G.save.panels.seen.passage` (set when it starts; `past.passage` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/game/passage_a.webp` (game: passage_a) | [0, 0, 1600, 893] | `pc_p_door` | Beside the stump she had cut, a door opened that had stayed shut for everyone else. |
| 2 | `assets/manhua/ch1/game/passage_b.webp` (game: passage_b) | [0, 0, 1600, 893] | `pc_p_tunnel` | The survivors had carried a sage down here once, and sealed it in. |

### meet — The corridor

- **Event / trigger:** NULLFANG's first appearance — the corridor meeting (nfMeet), once it has left the room. Plays in room `A2` at the first safe moment.
- **Completion flag:** `G.save.panels.seen.meet` (set when it starts; `past.meet` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/clean/p14.webp` (p14 panel 1) | [23, 18, 1154, 334] | — (silent) |  |
| 2 | `assets/manhua/ch1/clean/p14.webp` (p14 panel 2) | [23, 371, 1154, 660] | `pc_core` · conditional | It took one core. Never her last. |
| 3 | `assets/manhua/ch1/clean/p14.webp` (p14 panel 3) | [48, 1185, 540, 360] | — (silent) |  |
| 4 | `assets/manhua/ch1/clean/p14.webp` (p14 panel 4) | [605, 1185, 547, 275] | `pc_bored` | She was nothing to it. It got bored of her. |

### break — NULLFANG resists

- **Event / trigger:** NULLFANG's break (nfBreak): the purple goes out of him, then the bell writes the order back. Plays in room `A2` (or `A3`) at the first safe moment.
- **Completion flag:** `G.save.panels.seen.break` (set when it starts; `past.break` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/game/break_a.webp` (game: break_a) | [0, 0, 1600, 893] | `pc_b_stop` | The purple went out of him. Nothing was driving him. |
| 2 | `assets/manhua/ch1/game/break_b.webp` (game: break_b) | [0, 0, 1600, 893] | `pc_b_bell` | Then a bell answered from above the meadow, and the order was written back into him. |

### sage — The Meadow Sage

- **Event / trigger:** the first Sage cleansed (sageTame_GA1D), after its gift card and revelation. Plays in room `GA1D` at the first safe moment.
- **Completion flag:** `G.save.panels.seen.sage` (set when it starts; `past.sage` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/clean/p25.webp` (p25 panel 3) | [20, 562, 1161, 455] | `pc_knelt` | The sage knelt. The song held its body together. Broken, but not CLEAN. |
| 2 | `assets/manhua/ch1/clean/p26.webp` (p26 panel 1) | [52, 42, 1096, 310] | `pc_cuts` | Claws could not cleanse the song. The PURIFIER could. |
| 3 | `assets/manhua/ch1/clean/p26.webp` (p26 panel 2) | [52, 380, 1097, 605] | `pc_letgo` | The song let go. The sage remembered everything — and gave what it had kept for whoever would come with clean light. |
| 4 | `assets/manhua/ch1/clean/p26.webp` (p26 panel 3) | [52, 1013, 1097, 299] | `pc_cell` | It had counted every machine that fell in the scrap fields — and kept one power cell safe for whoever came with clean light. |
| 5 | `assets/manhua/ch1/game/sage_rev.webp` (game: sage_rev) | [0, 0, 1600, 893] | `pc_s_point` | It pointed up, toward the climb above the meadow. |
| 6 | `assets/manhua/ch1/game/sage_bell.webp` (game: sage_bell) | [0, 0, 1600, 679] | `pc_s_bell` · conditional | NULLFANG is still resisting. But CHIME writes the command back whenever he breaks it. |

### chime — CHIME

- **Event / trigger:** CHIME silenced (bossChime), once its cell is paid. Plays in room `A9` at the first safe moment.
- **Completion flag:** `G.save.panels.seen.chime` (set when it starts; `past.chime` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/clean/p20.webp` (p20 panel 2) | [425, 49, 725, 505] | `pc_singing` | It was singing at her. |
| 2 | `assets/manhua/ch1/clean/p20.webp` (p20 panel 4) | [425, 1091, 725, 298] | `pc_nobody` | Destroyed. There was nobody in it. |
| 3 | `assets/manhua/ch1/clean/p20.webp` (p20 panel 5) | [425, 1417, 725, 323] | `pc_made` | A guardian is a machine that was infected. This was not. It had been MADE by the source of the Song, and there was nothing under the virus to give back. |

### free — NULLFANG, free

- **Event / trigger:** NULLFANG purified (bossGlitch), after the purification film and its rewards. Plays in room `A4` at the first safe moment.
- **Completion flag:** `G.save.panels.seen.free` (set when it starts; `past.free` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/game/fight_a.webp` (game: fight_a) | [0, 0, 1600, 893] | — (silent) |  |
| 2 | `assets/manhua/ch1/game/fight_b.webp` (game: fight_b) | [0, 0, 1600, 893] | `pc_f_cut` | One clean cut. The virus came off him like ash — and he was still there. |
| 3 | `assets/manhua/ch1/clean/p24.webp` (p24 left panel 1) | [68, 580, 520, 313] | — (silent) |  |
| 4 | `assets/manhua/ch1/clean/p24.webp` (p24 left panel 2) | [69, 917, 585, 391] | `pc_oath` | The virus was destroyed. NULLFANG was free. He seemed to like her, and once in every room the blow that would have broken her came out of the dark and roared them off her instead. |

### ch2 — Next: the Data Conduits

- **Event / trigger:** chapter-two teaser: NULLFANG free and she stands on the climb to the Data Conduits (A3), or first B1 arrival. Plays in room `A3` (or `B1`) at the first safe moment.
- **Completion flag:** `G.save.panels.seen.ch2` (set when it starts; `past.ch2` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/game/hatch.webp` (game: hatch) | [0, 0, 1600, 1073] | `pt_hatch` | The hatch above the camp stood open. Ratchet stayed. NULLFANG watched her go. |
| 2 | `assets/manhua/ch1/game/ch2_a.webp` (game: ch2_a) | [0, 0, 1600, 893] | `pt_behind` | The Scrap Meadows are behind her. The Data Conduits are not. |
| 3 | `assets/manhua/ch1/game/ch2_b.webp` (game: ch2_b) | [0, 0, 1600, 893] | `pt_keeper` | Somewhere in the cables, a keeper of routes is waiting for one clean message. |
| 4 | `assets/manhua/ch1/game/ch2_c.webp` (game: ch2_c) | [0, 0, 1600, 893] | `pt_talons` | And above the dark lines, iron talons are waiting too. |
| 5 | title card | — | `pt_title` | CHAPTER TWO — THE DATA CONDUITS |

## Excluded panels, and why

| Page / panel | Why it is not used |
|---|---|
| p01, p02, p03 | The cover and the prologue are the opening film's own shots; repeating them in-game would replay the film. |
| p07 panel 2 (the tag) | Its letter is superseded: the game's letter now names the drawer and the repair steps (`sl_note2/3`). |
| p07 panel 3 | Caption says she was carrying a cell; in the game she recovers *his own* battery from the drawer. |
| p09 panels 3–5 | Balloons are the old errand ("crystal pillar", "hold ATTACK"), and the insets draw the pointed crystal pillar. |
| p13 (all) | NULLFANG is drawn as a soft-maned lion; the game's NULLFANG is the faceted crystal-maned ivory lion with violet hex joints (p14, p24 match it). Identity drift. |
| p14 panel 5 | Ratchet's "Go and put one in it" — the game now says "Not with claws" (`sl_ratchet_dent`). |
| p17 (all) | Draws a three-spired crystal pillar and an angular shard. The game draws rounded raw marble (`rawMarble`) and forbids the pointed crystal in this scene. Also p17's visor drift (flagged in the ledger). |
| p18 panel 1 | She holds a blade-shaped shard *before* the forging — "never a found blade" (STORY_CANON). |
| p18 panel 4 | A skill-tree inset (game UI). |
| p19 | Optional errands; no matching beat in this order. |
| p20 panels 1, 3 | Consistent with the game, left out only to keep the beat to three panels; panel 1's caption ("A guardian is a machine that was infected...") is carried by panel 5. |
| p21, p22 | STALE (route ruling); the camp page's trader lines are not the game's Ratchet. |
| p23 (all) | Same soft-maned lion as p13 — identity drift. |
| p24 top strip, right column, bottom strip | The fork ("if she ended it") does not exist under TAME_ONLY; the bottom strip opens a cave *in the lair*, but the game opens the grotto at the far end of the quarry tunnel. |
| p25 panels 1–2, 4–6 | Panel 1 is the wrong entrance (a grotto behind the lair, STALE); panel 2's log is fine but is a wall of text better read in the game's own terminal; 4–6 are covered by p26's four cuts. |
| p26 panels 4–5 | Ratchet's camp line and the lit map are a later beat / UI. |
| p27 (all) | Ratchet is drawn off-model (visor face), and she walks into a ground-level tunnel while the game's way on is the climb through the camp's ceiling hatch. The teaser now opens on the game's own hatch panel and the Conduits panels. |

## THE EIGHT MISSING GROUPS — DRAWN (2026-10-10)

The audit's list, each now a sequence or part of one, played at its game event:

| # | Scene | Sequence | Panels | Trigger |
|---|---|---|---|---|
| 1 | Raw rounded marble freed | `marble` | `game/marble_a`, `marble_b` | `pl_cshard`, in CV3 |
| 2 | Ratchet's letter, drawer and repair, as the game plays them | `ratchet` | `game/letter`, `drawer`, `repair` (+ clean p09 ×2) | `ratchetRepaired` |
| 3 | NULLFANG resists and is re-infected | `break` | `game/break_a`, `break_b` | `nfBreak`, in A2 or A3, before the bell or the lion |
| 4 | The sage explains CHIME's reinforcement | `sage` | `game/sage_rev`, `sage_bell` (bell panel only while it rings) | `sageTame_GA1D` |
| 5 | The quarry maintenance door and tunnel | `passage` | `game/passage_a`, `passage_b` | first arrival in GA1T with the blade |
| 6 | The on-model lion encounter and fight | `free` | `game/fight_a`, `fight_b` (+ clean p24 ×2); the corridor meeting is p14, on model | `bossGlitch` |
| 7 | The camp-hatch departure | `ch2` | `game/hatch` | the climb above the camp |
| 8 | Chapter two | `ch2` | `game/ch2_a` (the Conduits), `ch2_b` (the keeper of routes — outline only), `ch2_c` (the talons — nothing else shown), then the title card | as above |

Old saves: a save made before these sequences existed is judged by what it has
already done (`panelsState`, the `k` record) — it is not handed the marble or
the hatch as a recap. The ten original sequences keep their verdicts.

**What this is not.** It is a teaser, not a drawn chapter two: three panels of
place and threat. The chapter-two manhwa itself is unmade.
