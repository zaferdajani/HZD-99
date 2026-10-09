# Chapter one's caves — what the player discovers

Owner's order, 2026-10-09: *"MAKE CAVES WORTH ENTERING. Inspect every
chapter-one cave in actual gameplay and document what the player discovers …
Optional caves need distinct benefits … Avoid repeating enemies plus scrap as
the primary payoff everywhere. Reward early exploration … Make the required
return to the quarry after forging feel different and purposeful."*

This ledger is measured, not asserted: `tests/caves-ch1.cjs` loads every row
in the real build, takes each payoff through the player's own interaction and
prints the census below. `tests/den-gate.cjs` walks every way into the two
locked places. Code: `js/progress.js` (guidance, wards, cleansing, early
finds), strings: `js/text-progress.js`.

## The required road

Find raw marble → return to Ratchet → forge the Purifier → cleanse the first
Sage → learn about CHIME → silence CHIME → face and cleanse NULLFANG. Alpha is
optional and outside it.

| Hold | Where | How it is held (physically) | Opens on |
|---|---|---|---|
| The lion's enclosure (A4) | A3's east seam | a song ward pushes her back 2.2 tiles short of the seam (any speed: walk, dash, air dash), `checkTransitions` clamp behind it; one sheet of the ward dissolves per milestone met | `crystal` + `sageTame_GA1D` + `bossChime` (or `bossGlitch`) |
| The lion's enclosure (A4) | GA1's back door | the door is not built (`need: 'bossGlitch'`): no structure, no chevron, no walk | `bossGlitch` |
| The lion's enclosure (A4) | a saved bench | `progressBenchGuard` moves a bench parked in A4/A9/A11 to the camp bench (A3) on Continue and respawn | the same milestones |
| The bell (A9) | A8's way up | gated exit `{flag: 'sageTame_GA1D'}`: no floor above (vlinkTile), no seamless handover, a ward drawn over the hole that pushes her down and says why | `sageTame_GA1D` |
| The staged lion | A2 meeting, A2/A3 break | `storyProtected` and `Boss.die` refuse any blow on a `meet` body — nothing frees him out of order | — |

No vertical link anywhere leads into A4; its only exit is L.

## Guidance (environmental, not dialogue)

- **The hub's landmark (A2, 12–14):** while the marble is still to find, the
  cracked floor glows with marble dust and a column of pale light rises out of
  it, visible from the hub's west seam; a caption (one sentence a line) on the
  approach, the strike prompt up close. After the floor is cut, the hole keeps
  breathing light. After the forge the same light turns sage-blue.
- **The quarry marks (A5, CV1, CV1B, CV2, CV3):** chalk arrows and a rounded
  stone — the Deaf quarrymen's own road to the marble (terminal 20 says they
  drew them). White before the forge, pointing at the pillar; sage-blue after,
  the CV3 marks re-aimed at the maintenance passage. Hidden while she carries
  the marble home, and after the Sage is free.
- **The ward itself** is the objective made visible: three violet sheets at the
  enclosure before the forge, two before the Sage, one before the bell, none
  after.
- `progressGoal()` returns the current chapter-one goal as an i18n key
  (`pg_goal_*`) for the objective-line HUD (OPENING workstream).

## Cave by cave

| Room | How she reaches it | What she discovers | Payoff | Flags | On revisit |
|---|---|---|---|---|---|
| **A5** under the hub | down-strike through A2's cracked floor | a Mind Node (riddle 0), a chest, maintenance log 1 ("sub-hatch sealed after an anomalous signal"), the buried cave mouth answering a strike, the first chalk marks | **puzzle** + **upgrade** (Magnet crest) + the way to the quarry | `rubbleA5`, `ch_A5_0`, node key | marks turn blue after the forge, then disappear |
| **A7** the deep shaft | A5's brittle floor | the quarrymen's survey (terminal 20): the white seam's chart, why only pillar stock holds a song out, the chalk road | **story evidence** + Ratchet's errand `ratchet_deep` (coin relic) | `visited.A7` | if she stood here before Ratchet asks, he says so and pays on the ask |
| **CV1** entry hall | A5's mouth (rubble) | one bound crawler, a second buried mouth, a chest in the climb-only pocket | **useful upgrade**: a spare core (`coresMax + 1`, refilled) | `ch_CV1_1`, `rubbleCV1B` | bound bodies left here ask to be freed after the forge |
| **CV1B** the Seam | CV1's buried side mouth | a rest pod, a mouth onward to CV2 | **restored facility**: resting wakes the quarrymen's survey pod and charts CV1–CV3 on the map; **shortcut** past CV1's corridor | `pgSurvey`, `charted.*` | a rest point on the quarry road |
| **CV2** the long dark | CV1 R, or CV1B's mouth | the Deaf System's founding log (terminal 5) — the sound she has followed since the meadow | **story evidence**; the lure settles | `beacon` | — |
| **CV3** the quarry | CV2 R | the marble, shining at the end of the dark; claws glance, the Volt Burst frees it | **the sword material** (`cshard`) | `pl_cshard` | **after the forge:** the pillar is a dark cut stump with a glowing cut line; the maintenance passage beside it is built and breathes cold blue light; the marks point at it; a line says so, once (`pgCv3Back`) |
| **GA1T** maintenance tunnel | CV3's passage (needs the forged blade) | the meadow refuge's own log (terminal 6): how the counting sage was carried under | **story evidence**; the junction (grotto west, chamber east) | — | wakes freed after the Sage |
| **GA1** grotto | GA1T west | a rest pod and scrap | **rest before the Sage**; after NULLFANG, the **shortcut** door into his enclosure | `bossGlitch` builds the door | — |
| **GA1D** deep chamber | GA1T east | the Meadow Sage, kneeling in the song-lock | **rescue** (cleansing, never a kill) + **revelation** (CHIME; lines adapt if the bell or lion is already done) + **visible change** (the chamber's people freed on the spot with the cure's circle; GA1–GA1T wake freed on every load) + a cell and the Sage's card; the bell's ward falls | `sageTame_GA1D`, `chimeRevealed`, `sageGift_GA1D` | calm, freed network |
| **A11** behind CHIME's wall | A9's hollow west wall (now after the Sage) | a hidden pocket | **coin relic** | `sr_coin` | — |
| **A12** cellar under the camp | A3's brittle floor | a spike pit only the dash crosses (NULLFANG's gift) | **star relic** | `sr_star` | the reason to come back with the dash |
| **A13** under the vent climb | A6's west hollow wall | the Deaf watch log (terminal 21): they watched Servo on the gantries; his receiver was already unplugged, his cell ran dry | **story evidence** (points at Servo's cell) + coin | `sr_coin` | — |
| **A10 / GA2 / GA2T / GA2D** the Alpha's den (optional) | A2's depth door at 0.84 (needs the blade); Ratchet's offer at the forge | the Alpha; behind it the wardens' cache: a rest pod, the wardens' route ledger (terminal 22), the Pack Sage | **the pack becomes friendly** (every wolf, everywhere) + cell + 60 scrap; the Pack Sage's mending kit + 80 scrap | `alpha`, `bossAlpha`, `sageTame_GA2D` | never required; the road A2 → A3 → A4 does not pass it |

### Errands remember early finds

| Errand | Found early when | What changes |
|---|---|---|
| `servo_coil` (A6 coil) | the coil now lies in the gantries from the start (until handed in); picking it up early says "Somebody must be missing this" | Servo: "That coil — you found it before I could even ask…" and pays on the ask |
| `ratchet_deep` (A7) | she has already stood in the shaft | Ratchet: "You have already stood at the bottom of that shaft?…" and pays on the ask |
| `ratchet_forge` (marble) | marble already in her bag when he asks | "Is that raw marble? You found the seam before I could even tell you where it was." then the forge |

Culls (`servo_swarm`) still count from the ask: machines broken before it are
not the thing anybody asked for.

### The return to the quarry is different

After the forge the same road reads differently: the marks turn sage-blue and
lead past the stump to the lit passage, every machine she knocked down on the
way in is still lying there bound and the room says so once
(`pg_bound_wait`) — the blade can free them now, each with the rescue's light
and the word FREED.

## Cleansing reads as a rescue

`cleanseBegin` (js/progress.js) is the one picture of a rescue, used by the
Sage, by every freed guardian that has no film (the Alpha; any guardian whose
film cannot play), after the purification film ends, and by every bound
machine she cleanses: a column of clean light, three slow white rings, dark
violet motes rising off the body and thinning out (nothing falls; there is no
debris), the soft `heal` cue instead of the kill's wreck sting, and the word —
RESCUED / FREED — on a dark plate over the body. No detonation, no shake, no
wreck. The text agrees: `pg_sage_free` ("rescued, not destroyed") and
`pure_beast` ("cleansed, not killed").

## Art the integrator may want to fire

- NULLFANG's filmed idle/stalk strips have no clean variant: the freed pet in
  A4 keeps the purple virus nodes painted into the takes (the vein glow does
  turn teal). Brief: NULLFANG pet idle + stalk strips, same framing as the
  existing takes, with the virus nodes healed to the clean teal of
  `BEAST_LIVE.pure`.
- The wards and the quarry marks are effects and markings, not structures;
  no plate is required. If the owner wants the lair ward as a painted thing,
  brief: "the song wound across NULLFANG's enclosure: three translucent
  violet sheets, sound-rings crawling up them, organic edges, transparent
  background, 3 states (3/2/1 sheets)".
