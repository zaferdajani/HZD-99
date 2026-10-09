# The manhwa at story moments — event-to-panel map

Owner's order (2026-10-09): *use the existing manhwa at story moments; preserve
chronology, character identity and story meaning; never use superseded pages or
invent events to fit pictures; report missing panels instead of substituting.*

The runtime copy of this map is `PANEL_SEQ` in `js/panels.js`; the words are in
`js/text-manhwa.js` (all five languages). `tests/panels.cjs` checks that every
crop lies inside its page, that each sequence fires once at its event, and the
player's input rules.

## Sources

- **Approved:** the second edition of chapter one, `assets/manhua/ch1/p01–p27.webp`
  (1200×1789), ledger `docs/MANHUA.md` (every page "reviewed — passes, ed.2").
  Crops are rectangles in the page's own pixels, drawn from the master at
  runtime (RULE ZERO: nothing re-authored, no smaller copies). Pages are fetched
  only when their sequence is near (`prefetch` rooms), never at boot.
- **Not used:** the draft set `assets/manhua/revised-2026-09/` ("The Machine That
  Said No", status draft, parity not certified).
- **Teaser:** chapter two has no drawn pages. The teaser uses the Conduits tunnel
  from p27 (no figure in the crop) and the game's own Conduits gate backdrop
  `assets/backgrounds/gate_conduits.jpg`, with hint lines that name the place and
  the threat (a keeper of routes; iron talons) and none of their outcomes.

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

- **Event / trigger:** woke — first arrival outside the service bay (W1 → W2). Plays in room `W2` at the first safe moment (see below).
- **Completion flag:** `G.save.panels.seen.bay` (set when it starts; `past.bay` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/p04.webp` (p04 panel 2) | [52, 599, 385, 362] | — (silent) |  |
| 2 | `assets/manhua/ch1/p04.webp` (p04 panel 3) | [461, 599, 685, 362] | `pc_quiet` · lettered on the page | ...quiet. |
| 3 | `assets/manhua/ch1/p04.webp` (p04 panel 5) | [52, 1308, 1094, 337] | `pc_door` | The door had been open a long time. |
| 4 | `assets/manhua/ch1/p05.webp` (p05 panel 1) | [400, 33, 762, 341] | `pc_city` | The city was standing. It was silent. |

### gate — The city gate

- **Event / trigger:** gateOpened — first arrival inside the city gate (W2 → A0). Plays in room `A0` at the first safe moment (see below).
- **Completion flag:** `G.save.panels.seen.gate` (set when it starts; `past.gate` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/p05.webp` (p05 panel 3) | [38, 722, 1125, 626] | `pc_gates` · lettered on the page | The gates were the only monument in the kingdom, and nobody had walked through them in a long time. |
| 2 | `assets/manhua/ch1/p05.webp` (p05 panel 4) | [38, 1370, 1124, 386] | `pc_closed` · lettered on the page | They closed behind her. Waking up is one-way too. |

### ratchet — Ratchet's battery

- **Event / trigger:** Ratchet's battery restored (ratchetRepaired / on_A0B|ratchet), after his wake talk and errand. Plays in room `A0B` at the first safe moment (see below).
- **Completion flag:** `G.save.panels.seen.ratchet` (set when it starts; `past.ratchet` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/p07.webp` (p07 panel 4) | [420, 1202, 361, 549] | — (silent) |  |
| 2 | `assets/manhua/ch1/p07.webp` (p07 panel 5) | [792, 1202, 367, 380] | `pc_awake` | Ratchet was awake. |
| 3 | `assets/manhua/ch1/p09.webp` (p09 panel 1) | [19, 17, 650, 389] | `pc_necklace` (n_ratchet) | The marble in my necklace was an old gift to my ancestor. It slowed the virus long enough for me to think. It could not stop the infection. |
| 4 | `assets/manhua/ch1/p09.webp` (p09 panel 2) | [19, 418, 670, 359] | `pc_song` (n_ratchet) | Mother's song kept the robots of every kingdom in harmony. Someone unknown hacked its frequency and hid a virus inside it. |

### cave — The marble cave

- **Event / trigger:** first entry into the marble cave (CV1), through the buried mouth under the hub. Plays in room `CV1` at the first safe moment (see below).
- **Completion flag:** `G.save.panels.seen.cave` (set when it starts; `past.cave` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/p15.webp` (p15 panel 5) | [395, 1200, 770, 558] | `pc_breathing` | The rock gave way. The tunnel was open, and it was breathing. |
| 2 | `assets/manhua/ch1/p16.webp` (p16 panel 1) | [69, 74, 690, 427] | — (silent) |  |
| 3 | `assets/manhua/ch1/p16.webp` (p16 panel 3) | [69, 523, 1068, 305] | — (silent) |  |

### forge — The forging

- **Event / trigger:** the first sword forged from the raw marble (crystal), after the forge film and its card. Plays in room `A0B` at the first safe moment (see below).
- **Completion flag:** `G.save.panels.seen.forge` (set when it starts; `past.forge` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/p18.webp` (p18 panel 2) | [42, 617, 1114, 355] | `pc_forge` (n_ratchet) | You brought the marble. Steady the clamp. I will shape the edge, then fit the grip. Cut what is holding them — not what is left of them. |
| 2 | `assets/manhua/ch1/p18.webp` (p18 panel 3) | [52, 1120, 426, 620] | `pc_blade` | Ratchet forged a glowing white sword from the cave marble. It frees infected robots — and its handle can later connect to another weapon. |
| 3 | `assets/manhua/ch1/p18.webp` (p18 panel 5) | [505, 1345, 300, 396] | — (silent) |  |

### meet — The corridor

- **Event / trigger:** NULLFANG's first appearance — the corridor meeting (nfMeet), once it has left the room. Plays in room `A2` at the first safe moment (see below).
- **Completion flag:** `G.save.panels.seen.meet` (set when it starts; `past.meet` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/p14.webp` (p14 panel 1) | [23, 18, 1154, 334] | — (silent) |  |
| 2 | `assets/manhua/ch1/p14.webp` (p14 panel 2) | [23, 371, 1154, 660] | `pc_core` · only if the swipe took a core | It took one core. Never her last. |
| 3 | `assets/manhua/ch1/p14.webp` (p14 panel 3) | [48, 1185, 540, 360] | — (silent) |  |
| 4 | `assets/manhua/ch1/p14.webp` (p14 panel 4) | [605, 1185, 547, 275] | `pc_bored` | She was nothing to it. It got bored of her. |

### sage — The Meadow Sage

- **Event / trigger:** the first Sage cleansed (sageTame_GA1D), after its gift card and revelation. Plays in room `GA1D` at the first safe moment (see below).
- **Completion flag:** `G.save.panels.seen.sage` (set when it starts; `past.sage` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/p25.webp` (p25 panel 3) | [20, 562, 1161, 455] | `pc_knelt` | The sage knelt. The song held its body together. Broken, but not CLEAN. |
| 2 | `assets/manhua/ch1/p26.webp` (p26 panel 1) | [52, 42, 1096, 310] | `pc_cuts` | Claws could not cleanse the song. The PURIFIER could. |
| 3 | `assets/manhua/ch1/p26.webp` (p26 panel 2) | [52, 380, 1097, 605] | `pc_letgo` · lettered on the page | The song let go. The sage remembered everything — and gave what it had kept for whoever would come with clean light. |
| 4 | `assets/manhua/ch1/p26.webp` (p26 panel 3) | [52, 1013, 1097, 299] | `pc_cell` · lettered on the page | It had counted every machine that fell in the scrap fields — and kept one power cell safe for whoever came with clean light. |

### chime — CHIME

- **Event / trigger:** CHIME silenced (bossChime), once its cell is paid. Plays in room `A9` at the first safe moment (see below).
- **Completion flag:** `G.save.panels.seen.chime` (set when it starts; `past.chime` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/p20.webp` (p20 panel 2) | [425, 49, 725, 505] | `pc_singing` | It was singing at her. |
| 2 | `assets/manhua/ch1/p20.webp` (p20 panel 4) | [425, 1091, 725, 298] | `pc_nobody` · lettered on the page | Destroyed. There was nobody in it. |
| 3 | `assets/manhua/ch1/p20.webp` (p20 panel 5) | [425, 1417, 725, 323] | `pc_made` | A guardian is a machine that was infected. This was not. It had been MADE by the source of the Song, and there was nothing under the virus to give back. |

### free — NULLFANG, free

- **Event / trigger:** NULLFANG purified (bossGlitch), after the purification film and its rewards. Plays in room `A4` at the first safe moment (see below).
- **Completion flag:** `G.save.panels.seen.free` (set when it starts; `past.free` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/p24.webp` (p24 left panel 1) | [68, 580, 520, 313] | — (silent) |  |
| 2 | `assets/manhua/ch1/p24.webp` (p24 left panel 2) | [69, 917, 585, 391] | `pc_oath` · lettered on the page | The virus was destroyed. NULLFANG was free. He seemed to like her, and once in every room the blow that would have broken her came out of the dark and roared them off her instead. |

### ch2 — Next: the Data Conduits

- **Event / trigger:** chapter-two teaser: NULLFANG free and she stands on the climb to the Data Conduits (A3), or first B1 arrival. Plays in room `A3` (or `B1`) at the first safe moment (see below).
- **Completion flag:** `G.save.panels.seen.ch2` (set when it starts; `past.ch2` if the save had already passed the event).

| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |
|---|---|---|---|---|
| 1 | `assets/manhua/ch1/p27.webp` (p27 (tunnel only)) | [600, 100, 600, 700] | `pt_behind` | The Scrap Meadows are behind her. The Data Conduits are not. |
| 2 | `assets/backgrounds/gate_conduits.jpg` (gate_conduits.jpg) | [700, 300, 560, 420] | `pt_keeper` | Somewhere in the cables, a keeper of routes is waiting for one clean message. |
| 3 | `assets/backgrounds/gate_conduits.jpg` (gate_conduits.jpg) | [250, 0, 1420, 1072] | `pt_talons` | And above the dark lines, iron talons are waiting too. |
| 4 | title card | — | `pt_title` | CHAPTER TWO — THE DATA CONDUITS |

Captions marked *lettered on the page* are crops that already carry the page's
own English lettering; in English the plate is not repeated, in the other four
languages the plate carries the translation.

Where a page's words were superseded but its picture still matches, the caption
is the game's current line instead: `pc_necklace` / `pc_song` (Ratchet's own
account, Oct 4 revision — p09's balloons were replaced), `pc_forge` / `pc_blade`
(the Draft 2 forge line and item text — p18's balloons speak of a "pillar shard").
These were copied into `js/text-manhwa.js`; if the opening's wording changes,
update them there.

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
| p27 (figures) | Ratchet is drawn off-model (visor face), and she walks into a ground-level tunnel while the game's way on is the climb through the camp's ceiling hatch. Only the tunnel is used, as a place-hint in the teaser. |

## MISSING PANELS (no suitable approved panel — nothing substituted)

1. **Raw marble quarried at the pillar** (`pl_cshard`, CV3). p17 draws the wrong
   material. Needs: HZD-99 bursting the rounded raw-marble boulder (game plate
   `assets/characters/gear/raw_marble.png`) and a rounded piece falling to her paws.
2. **Ratchet's letter as the game writes it** (`sl_note1–3`): the drawer, the
   battery, the repair steps.
3. **NULLFANG's break** (`nfBreak`, A2/A3): he walks up, the purple goes out of
   him, the bell answers and he turns away. Drawn only in the draft set (p29).
4. **The sage's revelation** (`sg_rev3`: *NULLFANG is still resisting. But CHIME
   writes the command back whenever he breaks it*) — p26 lacks it (ledger: STALE).
5. **The maintenance door in the quarry wall and the tunnel** to the sage (GA1T)
   — p25 draws the old grotto behind the lair.
6. **NULLFANG's corridor meeting and the lair fight with the game's lion** — p13
   and p23 draw an off-model lion; only p14 (the swipe and its aftermath) and
   p24's cleansing match.
7. **Her departure from the camp up the conduit hatch** (end of chapter one) —
   p27 draws a ground-level tunnel and an off-model Ratchet.
8. **Chapter two** — no pages exist; the teaser uses p27's tunnel and the
   Conduits gate backdrop only.
