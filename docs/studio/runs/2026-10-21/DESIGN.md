# Design review — 2026-10-21

Evidence base: cumulative review commit `04076250b29c4cb7cdcbd8d91e32ddbe0b54626e`. Production `main` and the integration branch were both still `62d75d204c6f6264f25150bb419fc262ff2c18ea` at final pre-push inspection. Source inspection is kept separate from the fresh continuous playthrough in `automated/campaign-ch1/`.

## Role verdicts

| Senior responsibility | Verdict | Basis |
|---|---|---|
| Cinematic Designer | Issues | Event triggers and B1 teaser exist, but four GRAVEHORN intercuts and several physical manhwa actions do not. |
| Game Designer — Player Systems | Issues | The intended causal tutorial is present; the long opening-order driver still exhausts its finite budget before Servo. |
| Mission Designer — Quest Craft | Issues | Caves have source-defined purposes, but not every optional route has fresh ordinary-input evidence. |
| Principal Encounter Designer | Issues | Required lair gates are correct and the continuous chapter route completes; two deaths and six recovery frames show tuning/navigation debt. |
| Senior Boss Designer | Issues | Alpha is correctly optional and wolf-specific; several authored defeat/recovery/ritual performances remain absent. |
| Mission Designer — Campaign | Issues | Fresh continuous evidence proves marble → forge → Sage → CHIME → lion → B1, but Alpha and every optional cave were not played. |

## Canonical chapter-one walkthrough

1. HZD-99 wakes because an electrical fault restarts the forgotten recharge system. Sleep—not innate immunity—made the hero miss the corrupted broadcast.
2. Movement, jump and interaction are taught separately before Ratchet.
3. Offline Ratchet's letter explains the Mother song, infection, his protective marble pendant and his deliberate battery removal.
4. The hero finds **Ratchet's own battery** in the drawer and completes the retryable repair-board wiring puzzle.
5. Ratchet wakes, explains the raw marble below and activates the forge quest. He gives a **different spare Power Cell** for Old Servo.
6. Ratchet explicitly sends the hero to the save/recharge pod, then explains and funds the permanent Volt Pack purchase before heal/Burst lessons.
7. The nearby forward monument and winch teach the next controls; Old Servo becomes a grounded guide and offers the coil errand.
8. A5 → CV1 → CV1B → CV2 → CV3 leads to GRAVEHORN and raw rounded marble. This is material, not a ready-made sword.
9. Returning to Ratchet forges the first white purifier sword.
10. The changed quarry route leads to the Meadow Sage; the final hit starts a deliberate hold-to-free ritual rather than a kill.
11. The rescued Sage unlocks CHIME; CHIME unlocks NULLFANG; the purified lion becomes gold/friendly.
12. The B1 crossing plays the chapter-two teaser panels.

Fresh continuous evidence reaches every numbered beat. It used ordinary keyboard input and read-only planner/map inspection, easiest difficulty, no inventory/flag/teleport/invulnerability injection. It is not physical-touch or listened-cinematic certification.

## Open design findings

### `QA-OPENING-PHONE-20` — P2, unresolved

With corrected font metrics, desktop reached the pack handoff and phone keyboard emulation completed through the monument/`go` lesson, but both finite cases ended before A1/Servo. Reached ordering assertions, one-control prompts, Ratchet's explanation and zero-floor-pickup purchase checks passed; there were no page exceptions. Add monotonic milestone/input/simulation/charge/exit tracing before changing gameplay. A phone viewport with keyboard input is not a physical-touch test.

### `GH-STORY-PARITY` — P1, open

The mandatory material guardian still lacks approved articulated body art and the queued GRAVEHORN story beats. Required acceptance is on-model art tied to the actual intro, phase change, down/retreat states. Do not substitute unrelated panels or procedural bloom.

### `MANHWA-ACTION-PARITY` — P1/P2, open

Panel triggers cover wake, bay, gate, letter, drawer, Ratchet, meeting, cave, marble, forge, passage, Sage, break, CHIME, freeing and B1. Still missing as literal gameplay/cinematic actions: cradle reach, battery installation, carrying raw marble, continuous forge contact, cable help/catch, CHIME casing opening and an authored hero raise/hold/slash/recovery performance. A displayed panel does not implement the action drawn inside it.

### `ALPHA-OPTIONAL-ROUTE` — source-correct; fresh play evidence open

Alpha remains a post-forge Lost Wardens detour with prowl/coil/pounce/clinch/howl identity. Completion persistently befriends the pack and awards a cell, scrap and cache/ledger consequences. It is not a marble, Sage, CHIME or lion prerequisite. The complete offer → den → rescue → friendly revisit → save/reload route was not played today.

## Cave census

| Cave/group | Meaningful source purpose | Evidence still required |
|---|---|---|
| A5 | Loose-floor landmark, Magnet riddle, quarry mouth | Discover without internal map knowledge. |
| A7 | Read terminal 20; remembered, once-paid survey errand | Actual read and return, not room entry. |
| CV1 | Bound crawler and max-core climb pocket | Obtain chest; later see the same body freed. |
| CV1B | Survey pod, map/chart, shortcut and rest | Fresh full route used this; phone/device comprehension remains open. |
| CV2 | Deaf System founding evidence and beacon/lure | Natural pacing and comprehension. |
| CV3 | GRAVEHORN, raw marble and changed forged return | Fresh full route proves mandatory extraction/return. |
| GA1T/GA1/GA1D | Refuge, optional rest, Sage/network rescue | Fresh full route proves Sage leg; persisted network revisit remains separate. |
| A11/A12/A13 | Coin, later dash-star revisit, Servo evidence | Natural optional acquisition. |
| A10/GA2/GA2T/GA2D | Alpha, friendly pack, cache, ledger and Pack Sage | Complete optional route and reload consequence. |
