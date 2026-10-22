# Engineering review — 2026-10-22

Five senior engineering responsibilities reviewed the restored October 21 parent,
the bounded fixes and the test contracts.

| Responsibility | Verdict | Evidence and consequence |
|---|---|---|
| Senior Technical Director — World Systems | Issues | Mandatory topology, migration and a 17:36 continuous route pass; full-collector retention and device evidence remain open. |
| Senior Gameplay Engineer — Combat | Pass for source contracts; device feel open | Stats, attack table, hit-stop, flash, recoil/knockback, particles, purification and eye VFX are implemented/tested. Physical haptics, listened sound mix and performance remain unverified. |
| Senior Gameplay Engineer — Mission | Pass for mandatory chapter route; optional scope open | The quarry-driver defect is fixed and a fresh 17:36 unsegmented route certifies all required missions/panels. |
| Senior Gameplay Engineer — NPC | Bounded fix passes | The rescued Sage now joins walker gait logic and selects `sageWalk8` with purified material while moving, returning to `sagePure` only while idle. |
| Lead UI Engineer | Issues | Desktop opening completes; phone-mode stalls after repair. Physical touch/orientation remains open. |

## Implemented source fix: rescued Sage motion

Before:

- the calm AI translated a tamed Sage;
- `WALKERS` excluded `sage`, so its calm velocity snapped rather than using the
  shared start/turn gait;
- `drawSage()` treated every tamed frame as kneeling and always selected
  `sagePure`.

After:

- `sage` participates in the shared gait while calm;
- moving tamed Sages select the existing eight-cell `sageWalk8` strip;
- the existing `pure` render argument applies the clean material;
- idle tamed Sages return to `sagePure`;
- hostile duel back-away behavior and gameplay stats are unchanged.

Targeted production-path evidence (`postfix/sage-walk.log`) verifies saved tame/
calm state, 128.47 px body movement, 123.86 px gait distance, acceleration from
34.62 to 86.41 px/s, authored eight-cell selection with `pure:true`, idle rescued
plate and room-reload persistence.

## Implemented certification fix: quarry hatch

`tests/campaign-ch1.cjs` now treats one completely opened column across both hatch
rows as a usable shaft. The old assertion required all three columns to be empty
and could repeatedly attack one nonblocking tile. No production game code or
campaign rules changed.

## Validation scope

- `node build.cjs`: pass after source edit.
- Focused browser set: 9/9 pass after the newly reconstructed Sage fixture was
  corrected without weakening gameplay assertions: `sage-walk`, `sage`,
  `sage-quiet`, `enemygait`, `infection-eyes`, `story-rescue`, `story-order`,
  `purification` and `purification-controls`.
- `sage-walk`: independent pass with a retained log and gameplay-size screenshot.
- Continuous campaign: certified in 17:36 on easiest difficulty, ordinary keyboard,
  two deaths, 9/9 missions, 16/16 ordered panels, zero missed panels/page errors.
  Video was disabled; the read-only planner and seven recovery/stuck frames are
  disclosed in the retained log.
- The October 21 parent retains its 196-harness evidence and continuous campaign;
  today's report does not relabel that prior execution as a new full run.
- A same-day full collector was interrupted by external removal of the transient
  checkout after it had reached `cachemoves`; because its artifacts disappeared,
  those observations are not durable release evidence.

## Open engineering gates

1. Finish a fresh full collector on one immutable served build and retain all
   content snapshots/hashes.
2. Repeat the certified review-branch campaign on the final integrated snapshot;
   keep difficulty, deaths, planner assistance and video/audio exclusions visible.
3. Diagnose finite `opening-order` desktop/phone completion with milestone and
   down/up/charge/transition tracing, focusing on the phone A0B post-repair state,
   not a larger timeout alone.
4. Validate real touch, controller, haptics, listened audio endings and sustained
   frame-time/memory on physical devices.
5. Keep staged tests, viewport emulation and an unsegmented player journey labeled
   separately.
