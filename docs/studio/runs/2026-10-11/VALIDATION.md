# Validation evidence — 2026-10-11

## Verdict

**Not release-ready.** Full collector completed its requested scope and exited 1. All 166 harnesses ran: 164 passed, roomcache and opening-order failed. One diagnosed roomcache fixture correction passed separately; opening-order remains failed. Build, package and both served-identity checks passed. No logs were edited to manufacture a green full suite.

The independent campaign completed at 13:36 (result file 13:37 including video closure), Kitten difficulty, one death, five recovered planner-stuck diagnostics and zero page errors. It observed12/13 sequences, missing passage, and showed the cave introduction after extraction. Narrative acceptance is therefore failed despite the harness exit 0. See campaign/review.json and campaign/PLAYTHROUGH.md.

Full collector UTC interval:2026-10-11 07:44:28–08:31:27. All 65 frozen source/build/runner hashes matched again after completion. The four collector unit tests also passed.

## Tested version and environment

- Sampled baseline/live BUILD_ID: `49988b950264`, inferred from byte-identical baseline/live HTML, separate from the reviewed build.
- Audited main and integration: `7b48b89d5fb2643ef58965eed36b6b8a06dddfd7`.
- Frozen source build includes CIN-4/CIN-5 and collector fixes. BUILD_ID: `aee134b4b5ee`.
- Tested index SHA256: `0f893f1d10622fbd1f4a7c28e8396860a30d991f554d0c2c8cd211e65e917923`.
- Tested odyssey SHA256: `c65dc10d7fb13d6aaaf514b327bef5d3ae80549942440668dcd9c7a2409865d1`.
- `frozen-hashes.json` preserves 65 source/build/runner hashes. `automated/served-identity.json` pins served pages and sampled loose assets. No runtime source, artwork or built page was changed during the suite.
- Roomcache's test fixture alone changed after its failure, then ran separately against the same frozen built game; `post-freeze-test-change.json` records that exact file. The original failed log is unchanged.
- Linux, Node 24.19.0, Python 3.12.14, Chromium 153.0.8010.0 at `/tmp/chromium`, repository Playwright dependencies installed from lockfile. Browser was extracted from `@sparticuz/chromium` into a temporary tools directory after the standard extraction path encountered an environment `chown` error. FFmpeg's initial CDN download failed; its alternate download succeeded. Neither is a game pass/failure.
- Full campaign uses its default easiest difficulty, Kitten (row 0), recording enabled; no CAMPAIGN_SEGMENT/STOP/DIFF overrides. It is an automated route-aware keyboard player with internal state/map reads, not a blind human assessment.

## Commands and result sources

| Command | Evidence / interpretation |
|---|---|
| `npm ci --ignore-scripts` | Lockfile dependencies; no application modifications |
| `CHROMIUM_PATH=/tmp/chromium python tools/studio/audit.py --profile full --output docs/studio/runs/2026-10-11/automated` | Build, package, every registered harness, start/end served identity; full original results in `automated/results.json` |
| `python -m unittest discover -s tools/studio -p 'test_audit.py' -v` | 4/4 isolated collector regressions, including actual child-process timeout cleanup; `collector-regressions.log` |
| `CHROMIUM_PATH=/tmp/chromium node tests/run.cjs roomcache` | One diagnostic failure then one corrected pass in distinct logs under `roomcache-investigation/`; each with its own same-checkout server |
| `INFPOSE_ONLY='alpha\|glitch\|mother' CHROMIUM_PATH=/tmp/chromium node tests/infection-poses.cjs --sheet docs/studio/runs/2026-10-11/images/guardian-poses.jpg` | Separately staged three-guardian subset, 50 poses / 300 samples, exit 0; `art-poses.log` |
| `CHROMIUM_PATH=/tmp/chromium node docs/studio/runs/2026-10-11/capture-panels.cjs` | Reproducible script preserving the staged panel capture procedure; six original views, no page errors; `art-panels.log` |
| `CANDIDATE_PREVIEW=1 CHROMIUM_PATH=/tmp/chromium node docs/studio/runs/2026-10-11/capture-panels.cjs` | Reproducible candidate-preview procedure; two views, no page errors; route substitutes temporary normalized image; `art-candidate.log` |
| `node tools/manhwamap.cjs` | 13 sequences regenerated; only intended introductory prose differs |
| `node --check` on edited JS tests/source and preserved capture script; `git diff --check` | Syntax/whitespace checks, no claim of functional coverage from lint |

The standalone capture script was packaged and syntax-checked after the captures; the successful captures used the same procedure before it was packaged, not a second run of the committed wrapper. Servers used by separate executors were launched in the same executor as their browsers; localhost is isolated between tool executions.

## Original failure and corrected retry — roomcache / QA-07

The original full-suite first A2→A3 crossing failed. A diagnostic run reproduced `PANELS/meet` at frame 10 clearing held RIGHT; the fixture asserted a completed lion but omitted its earlier meeting. Setting only `nfMeet=1` made the fixture coherent. All original budgets/assertions remain and an additional assertion disallows panel interception during measured crossings. Corrected run exits 0 in 37.3 seconds, first crossing 31 ms, zero live bakes, no page errors. This is a test repair, not a production seam change. The original collector remains failed; its result was not edited to green.

## Unresolved failure — opening-order / QA-08

The registered run failed in 483.4 seconds. Desktop reached `move,out,jump,gate,booth,note,drawer,repair,pod,pack,heal,atk`, still in A0B. Phone-sized mode reached through `pack`, still in A0B. Both logged no page errors. Neither reached the meadow, monument or Servo; downstream assertions therefore fail from unvisited coverage, not sixteen independently confirmed game defects.

Source has a 240-second internal loop deadline per mode. It lacks final-state/timing diagnostics. Root cause is unestablished: fixed 45 ms steering, simulation-time input debounce versus wall-time waits, and no stuck-jump recovery are confirmed fragilities, not demonstrated causes. No deadline was increased and no rerun was performed to seek a green result. Diagnose this before integration release gates can pass.

This harness injects `startGame(newSave(1))` and later a Servo coil item. It uses keyboard events in both desktop and phone-sized contexts and pointer clicks for repair; `hasTouch:true` does not make those controls touch input. It is a staged-start opening traversal and staged hand-in test, not actual touch gameplay, title-menu boot evidence, or uninterrupted full-chapter play. Two first-occurrence screenshots are preserved in `images/opening-failed-*`; they are not screenshots at the timeout instant. All 57 emitted PNG hashes are in `opening-screenshots-manifest.json`; only the two selected PNGs are retained on this branch.

## Fresh functional/visual checks

- `panels`: staged regressions for A3 selection and CHIME replay; original loading/order/reveal checks retained.
- `infection-eyes`: finite emission/cleanup, cured lion 0 smoke, reduced-motion no smoke, phone cap 90; Mother 8 lenses reaches90/90. Bounded does not establish ideal readability.
- `infection-roster`: complete requested roster loads and succeeds with current pending-media fix.
- `infection-poses`: eight guardians, poses/times/facings; same renderer and explicit eye/wisp-anchor assertions. Opaque-body proximity alone cannot prove an anatomical eye, so the specialist also inspected a diagnostic sheet.
- Cave/den/story/save tests are staged functional evidence. The fresh campaign is assessed separately below.
- Original repair/passage/hatch imagery inspected at 1280×720 and 844×390. Repair candidate inspected separately through request substitution; it is not part of the tested game, approved art, or deployment.

## Campaign acceptance gap / QA-09

The unmodified harness reports complete and `panelsMissed:[]`, but deriving the difference between the13 configured sequences and 12 observed sequences yields `passage`. Its final status check does not enforce the whole required panel set, chronological order or zero collected page errors. This reviewer inspected those fields independently and recorded a narrative failure, not a full-story pass. Add fail-closed narrative assertions after correcting runtime delivery; do not merely pre-mark missing scenes as seen.

## Limits

No physical phone, native package launch, listened-to sound mix, felt haptics, human default-difficulty combat assessment, or owner art approval. Still pose sheets do not prove studio-quality animation. Internal-state-aware automated input proves reachability under its conditions, not discoverability for an uninformed player. The bot uses reveal/advance shortcuts at an automated pace; its elapsed time is not a human reading-time estimate. Optional caves/Alpha and all-language reading pace are not one continuous campaign unless explicitly listed in the fresh result. Prior Oct10 evidence is historical and does not replace today's checks.

Generated HTML is excluded from the review branch. Integration must rebuild all four outputs from integrated source and rerun required gates. Sampled live files match the intake baseline, not the reviewed source changes or unwired candidate; `live.json` has exact UTC fetch time and hashes.
