# Design review — 2026-10-28

## Scope and evidence boundary

The design group covered roles 1–6 from `docs/studio/roles.json`. There is no new
production-game delta after the October 27 review branch: `main` remains
`573d09d48d6278cf1afb51f66db3d9d014bafefe`; the Claude integration ref remains
`62d75d204c6f6264f25150bb419fc262ff2c18ea`; `claude/runner-box` changes only
workflow runner declarations. Findings therefore carry forward unless fresh
October 28 evidence below changes them.

## 1. Senior Cinematic Designer — HOLD, P1

Draft 3 contains forty pages and literal physical actions: cradle and lamp acting,
battery/socket contact, marble handling, forge tool/material contact, Sage timing,
CHIME casing/vent work, and NULLFANG cable assistance. Runtime sequence IDs and a
displayed panel do not prove those actions. The fresh clean journey reached
Ratchet's repair, pod, and Volt Pack purchase before stalling in the heal lesson.

Acceptance: a forty-row parity ledger with cast, prop, earned equipment, literal
body action, VFX, audio, runtime trigger, and gameplay-size capture. Every row must
pass or its comic page must be revised.

## 2. Senior Game Designer — Player Systems — HOLD, P1

`opening-order` failed in 489.6 seconds. Desktop stopped in A0 after
`move -> out -> jump -> gate -> booth`; phone-size stopped in A0B after adding
`note`. This is a failed real-input certificate. The separate clean campaign did
progress farther, naturally completing letter, drawer, repair, Ratchet revival,
story explanation, spare Servo cell, pod use, and Volt Pack purchase. It then
repeatedly held `F` in the forced heal lesson without restoring the missing core
and timed out at 40:04. Thus the tutorial is authored and traversable farther than
the opening driver showed, but held-input progression is not reliable enough to
certify.

The phone-size run used keyboard traversal. Physical touch, controller, remapping,
and assist-mode evidence remain open.

Acceptance: semantic state-bound actions and per-step diagnostics; three clean
desktop and phone-size runs to Servo; then physical touch/controller/remap proof.
Do not add blind sleeps or inject progress.

## 3. Senior Mission Designer — Quest Craft — HOLD, P2

Mandatory logic remains present. Optional discovery and return loops are still
mostly staged/source evidence. Alpha must remain optional and must not appear as an
unexplained mandatory pre-lion fight.

| Area | Authored purpose/payoff | October 28 evidence boundary |
|---|---|---|
| A5 | loose floor, Mind Node, Magnet crest, quarry history | staged/historical |
| A7 | quarry survey and once-only Ratchet payment | staged/source; natural return open |
| CV1 | bound crawler and max-core chest | staged/historical |
| CV1B | survey pod, map, shortcut, rest/respawn | fresh checkpoint resume |
| CV2 | Deaf System/beacon and quarry route | checkpoint diagnostic crossed to CV3 |
| CV3 | Gravehorn, raw marble, changed return route | historical marble; boss fresh red |
| GA1T/GA1/GA1D | refuge, bench, Meadow Sage, network rescue | staged/historical |
| A11 | secret coin | staged/source |
| A12 | traversal challenge and star fragment | staged/source |
| A13 | coin and gantry-watch log | staged/source |
| A10/GA2/GA2T/GA2D | Alpha, friendly pack, Warden log, Pack Sage | staged/source; natural loop open |

Acceptance: ordinary-input offer -> search -> rescue -> reward -> reload evidence
for each optional loop, plus a separate clean mandatory B1 run proving Alpha never
gates progression.

## 4. Principal Encounter Designer — HOLD, P1

Fresh Gravehorn mechanics are red. The aggregate and isolated runs failed. In the
isolated run, intro dialogue/name-card state did not advance, charge and missile
chains did not complete, recoveries measured zero, phase two was never reached,
and the harness timed out at 300 seconds. This supersedes yesterday's green staged
mechanics as the fresh verdict; it does not identify a new upstream regression
because upstream game code did not change.

The CV2 checkpoint diagnostic is materially improved: after three recoveries it
crossed CV2 -> CV3 at 05:21 using ordinary keyboard input. It did not finish the
Sage route and later stalled on combat/heal behavior in CV3.

Acceptance: isolate Gravehorn's intro/state-clock failure, restore every move and
phase assertion, then obtain three integrity-clean passes. Keep the CV2 geometry
unchanged unless a human can reproduce a real traversal block.

## 5. Senior Boss Designer — HOLD, P1/P2

The deliberate, interruptible hold-to-free logic and no-kill contract exist in
source/staged tests. Only `glitch` maps to the accepted current ritual film. Older
Atlas/Brood/Zero/Prism clips are boss-only montages and must not be relabeled as
the current raise/gather/slash/extract/neutralize ritual. The hero still lacks a
continuous authored raise -> hold -> slash -> recover body performance.

Acceptance: four identity-specific current-contract films; earned sword in hand;
white gather; cinematic slash; black-red corruption absorbed into the blade;
same living friendly/golden guardian; controlled picture and audible-score fade;
cancellation without reward and retry without duplication.

## 6. Senior Mission Designer — Campaign — HOLD, P1

The fresh clean run timed out at 40:04 in A0B's forced heal lesson. It had completed
the full Ratchet repair/story, pod save/recharge, Volt Pack explanation, funded
purchase, and reward card. The driver repeatedly held `F` from 07:09 onward, but
the hero stayed at 6/7 cores with 99 volts. It recorded zero deaths and zero page
errors, but no mission completion. It cannot certify chapter one.

The separate ten-minute checkpoint diagnostic is explicitly partial. It resumed
from the game's own CV1B pod save, escaped the October 27 CV2 two-edge loop, crossed
to CV3, and then spent the remaining window fighting/healing. It cannot replace a
cleared-browser B1 run.

Acceptance: a fresh uninterrupted cleared-save run to B1, a separate optional
Alpha loop certificate, and the forty-page parity ledger.

## Story/manhwa matrix

| Beat | Fresh evidence | Literal/acceptance gap |
|---|---|---|
| Wake/bay/gate | clean campaign traversed W1/W2/A0 | cradle, umbilical, lamp acting |
| Letter/drawer/repair | naturally completed; repair board captured | body/hand continuity around board |
| Ratchet explanation | all required story facts spoken | physical necklace/battery acting |
| Pod/Volt Pack/Servo | pod and Pack purchase completed; heal looped | heal, Servo, physical touch |
| First guardian meeting | source/staged/historical | fresh clean journey |
| Cave/marble | source/staged/historical | fresh clean acquisition; finished Gravehorn |
| Forge | source/staged/historical | hands/tools/material contact |
| Passage/Sage | source/staged; tail Sage tests passed | fresh continuous rescue and UI density |
| NULLFANG break/CHIME | source/staged/historical order | fresh body-action parity |
| Lion purification | staged logic | unique full ritual and hero body acting |
| B1 teaser | historical | fresh spoiler-safe completion |

