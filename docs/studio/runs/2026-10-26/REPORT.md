# CLAWBYTE senior studio review — 2026-10-26

## Executive decision

**Keep this as a review branch. Do not merge or deploy.**

There is no new game-source or production-art delta from October 25. Production
`main` and the Claude integration ref are still at
`62d75d204c6f6264f25150bb419fc262ff2c18ea`; this review started from October
25's `daeff2977bc9ee614db2836bb1728a652a8f9907`.

The mandatory Chapter One route remains coherent and completable. A fresh,
cleared-storage, ordinary-keyboard campaign completed in **13:06**, easiest
difficulty, with **0 deaths**, all **9/9 mandatory missions**, all **16/16
required presentation sequence IDs in order**, no page/panel errors, and B1 as
the terminal room. It used normal input and a read-only planner; it did not
inject inventory, position, health, terrain, quest flags or save state.

That strong campaign result must not be overclaimed. Sixteen ordered runtime
presentation IDs are **not** parity with the 40-page Draft-3 manhwa. The run
disabled video, excluded optional Alpha, did not naturally complete every
optional cave return, and was not physical touch/controller/audio/haptic/device
testing.

The full collector ran all 201 checks: **198 pass / 3 fail**. The failures are
preserved. Build and package passed. Gravehorn passed in the full run with its
original 300 ms lower timing bound restored. The three aggregate failures were
purification-save harness initialization, desktop opening-order reliability and
a host SwiftShader extraction error. The first and third pass after bounded
test/host corrections; opening-order failed again in isolation. A later
combined isolated Gravehorn rerun also failed broadly in its staged setup, so
encounter harness reliability is not closed even though the full run passed.

The collector correctly ended with raw-log integrity false because four disk
logs were overwritten after capture. Their original closed-file bytes survived
inside `results.json` and were restored byte-for-byte with matching SHA-256
records, but the original integrity failure remains preserved. This corrects a
larger October 25 publication problem: yesterday's branch omitted
`automated/results.json` and 196 of 199 recorded raw logs, so its 199/2 result is
historical summary rather than independently auditable release evidence.

No production asset was regenerated. Release remains held for P1 Gravehorn
art, Draft-3 literal performance, reproducible opening evidence, notification
density, optional-loop proof and physical-device validation.

## Repository state

| Item | Value |
|---|---|
| Review branch | `codex/studio-review-2026-10-26` |
| Review parent | `daeff2977bc9ee614db2836bb1728a652a8f9907` |
| Production `main` at intake | `62d75d204c6f6264f25150bb419fc262ff2c18ea` |
| Claude integration at intake | `62d75d204c6f6264f25150bb419fc262ff2c18ea` |
| New upstream/source/art delta | None |
| Production game/art changed today | None |
| Test/evidence files changed | `tests/gravehorn.cjs`, `tests/purification-save.cjs` |
| Merged | No |
| Deployed | No |

The pipeline, role registry and all fifteen role mandates were read from
`main`. Responsibilities were grouped into design (1–6), art/cinematic/VFX
(7–9), engineering (10–14) and producer (15).

## Fifteen senior-role verdicts

| # | Senior responsibility | Verdict | Evidence / required action |
|---:|---|---|---|
| 1 | Cinematic Designer | **P1 issue** | 16 ordered presentation IDs pass; Draft 3 is 40 pages and literal prop/body actions remain incomplete. Build a per-page parity ledger and gameplay captures. |
| 2 | Game Designer — Player Systems | Mandatory campaign pass; opening/device issue | Cleared campaign passes. Desktop opening-order fails twice; physical touch/controller are untested. Fix semantic reliability without loosening order. |
| 3 | Mission Designer — Quest Craft | Mandatory pass; optional issue | Cause/effect route completes. Alpha, A7 and optional returns remain staged rather than naturally played through payoff/reload. |
| 4 | Principal Encounter Designer | Mechanics broadly pass; presentation/reliability issue | Gravehorn passes full run but isolated setup is nondeterministic. P1 authored body/intercuts and target-device feel remain absent. |
| 5 | Senior Boss Designer | Identity pass; ritual presentation issue | NULLFANG and Alpha stay distinct. Four films and continuous hero body acting remain open; video-on full ritual is unverified. |
| 6 | Senior Mission Designer — Campaign | Fresh mandatory continuous pass | 13:06, zero deaths, B1, 9/9 missions. Optional routes and page parity are separate certificates. |
| 7 | Senior Character Artist | **P1/P2 issues** | Gravehorn production set, bound recovery strips, Furnace state plates and hero ritual performance remain unfinished. |
| 8 | Cinematic Director | Issues | Four Gravehorn intercuts, four guardian ritual films and three localized panel corrections remain open. |
| 9 | Senior VFX Artist II | Host contract pass; device open | Red/purple finite trail tests pass; sustained phone frame-time/memory/thermal are unknown. |
| 10 | Associate Technical Director — World Systems | Mandatory host pass; optional/device open | World graph/cache/map checks and continuous route pass fresh. No physical-device performance certificate. |
| 11 | Gameplay Engineer — Combat | Contracts pass broadly; harness/device open | Impact/stat/held-hit/eye/purification contracts pass staged checks; Gravehorn isolated setup is not stable; sound/haptics not physically assessed. |
| 12 | Gameplay Engineer — Mission | Mandatory continuous pass; optional open | Marble → forge → Sage → CHIME → lion → B1 completes. Optional loops remain staged. |
| 13 | Gameplay Engineer — NPC | Host pass | Rescued Sage uses authored walk while moving and kneels only idle; Servo scale/purpose passes staged checks. Physical touch open. |
| 14 | Lead UI Engineer | Contract pass; density/opening issue | Gradual text/RTL/CJK/rotation pass. Reward stacks crowd gameplay; desktop opening-order is reproducibly unreliable. |
| 15 | Senior Mission Producer | **Hold** | Mandatory story is playable, but P1 art/parity plus evidence/device gates remain. |

Discipline reports: [DESIGN.md](DESIGN.md), [ART.md](ART.md), and
[ENGINEERING.md](ENGINEERING.md).

## Findings register

| ID | Severity | Status | Player/evidence consequence | Acceptance |
|---|---|---|---|---|
| `GH-ART` | P1 art | Open | Mandatory marble boss is a flat procedural silhouette beside finished hero art. | Fourteen authored plates, both facings, planted pivots, phase material/body change, four triggered intercuts. |
| `MANHWA-PERF-01` | P1 presentation | Open | Ordered panels are being mistaken for literal 40-page parity. | Per-page cast/prop/equipment/action/VFX/audio/trigger/capture ledger; all 40 pages pass or comic is revised. |
| `OPEN-ORDER-26` | P1 evidence/reliability | **Open, reproduced** | Aggregate desktop stopped before monument/Servo; isolated desktop stopped at booth before letter. | Semantic waits tied to actual UI/game states, three fresh desktop+phone-size passes, then physical touch. Do not increase blind sleeps or skip steps. |
| `EVID-RETENTION-26` | P1 evidence | Partially corrected | Oct25 raw evidence was not published; Oct26 detected four post-capture log overwrites. | Retain results, all logs, hashes/snapshots, frames and original failures; prevent later writers touching closed logs. |
| `DEVICE-24` | P1/P2 evidence | Open | No physical phone, controller, listened audio, haptics, thermal or sustained performance proof. | Target-device matrix. |
| `UI-DENSITY-25` | P2 UI | Open | Sage/lion reward cards collide with objective/HUD and status labels. | Finite prioritized/deduped queue, one narrative/reward card, safe zones, desktop/phone RTL/CJK proof. |
| `OPT-QUEST-24` | P2 mission evidence | Open | Alpha and optional cave loops have no natural discovery→consequence→reload certificate. | Ordinary-input loop for each, while proving B1 stays non-gated. |
| `RITUAL-FILMS` | P2 cinematic | Open | Brood/Atlas/Zero/Prism use fallback; automation video was off. | Guardian-specific resolved extraction films and a video-on live return run. |
| `BOUND-ART-01` | P2 art | Open | Freed/down wolf/cheetah reads tiny and flattened. | Authored down/breathe/recover strips and infection cleanup. |
| `FURNACE-ART` | P2 art | Open | Six actions transform generic existing figures. | Six authored states preserving mechanics. |
| `PURIFY-ART-01` | P2 art | Open | Sword VFX exists without continuous hand/hilt body action. | Raise → hold/gather → slash → recover strip. |
| `PANEL-CORRECT-23` | P2/P3 art | Open | Red NULLFANG eyes, lit inactive Servo and off-model passage hero remain. | Localized masked corrections only. |
| `GH-HARNESS-26` | P2 evidence | Open | Full Gravehorn passes restored lock bound; combined isolated rerun fails earlier setup/dialog/state checks. | Make staged initialization deterministic without weakening product assertions; repeat under immutable server. |
| `EYE-VFX-24` | Host pass | Device gate | Fresh infection-eyes/roster/poses pass. | Sustained physical-device frame/memory run. |

## Continuous play versus staged evidence

| Evidence | Result | Honest scope |
|---|---|---|
| Fresh cleared-storage campaign | **PASS/certified**, 13:06, easiest, 0 deaths, 9 missions, 16 ordered IDs, B1, zero errors | One uninterrupted ordinary-keyboard mandatory route; video off; Alpha excluded; read-only planner. |
| Full collector | **198 pass / 3 fail**, 201 requested checks executed | Host snapshot. Original failures retained; final raw-log integrity false due four post-capture overwrites. |
| Full-run Gravehorn | Pass, including 367 ms horn lock | Staged arena harness, not finished-art or continuous-play proof. |
| Combined bounded rerun | purification-save pass; bake3d pass; Gravehorn fail | First is test initialization correction; second host extraction correction; Gravehorn rerun is nondeterministic and retained. |
| Opening-order aggregate | Fail desktop at A0; phone-size reaches A1/Servo | Browser keyboard/mouse. Not physical touch. |
| Opening-order isolated rerun | Fail desktop at booth before letter; phone phase not reached | Reproduces harness/sequence reliability problem. |
| Optional Alpha/cave tests | Staged/source pass | Direct save/room/flag setup; not a natural continuous quest. |
| Physical device/audio/haptic | Not run | No hardware acceptance. |

## Mandatory campaign certificate

| Property | Observed |
|---|---|
| Base commit | `daeff2977bc9ee614db2836bb1728a652a8f9907` |
| Dirty-at-start | Restored Gravehorn evidence assertion only |
| Start | Cleared browser storage |
| Input | Ordinary keyboard events |
| Difficulty | Easiest (0) |
| Wall time | 13:06 |
| Deaths | 0 |
| Missions | opening, servo, first-meeting, marble, forge, sage, chime, lion, teaser |
| Ordered presentation IDs | wake, bay, gate, letter, drawer, ratchet, meet, cave, marble, forge, passage, sage, break, chime, free, ch2 |
| Terminal room | B1 |
| Missing/order/page errors | None |
| Progression mutation | None |
| Video | Disabled for automation |
| Alpha | Excluded as optional |

## Cave purpose census

| Area | Purpose | Verdict |
|---|---|---|
| A5 | Loose-floor landmark, Magnet riddle, history, quarry mouth | Mandatory and causal |
| A7 | Survey read and once-paid return | Purpose in source; natural return proof open |
| CV1 | Bound crawler and max-core pocket | Distinct; recovery art/revisit open |
| CV1B | Survey/map/shortcut/rest/respawn | Useful and exercised |
| CV2 | Deaf System evidence and beacon/lure | Traversed; comprehension interview absent |
| CV3 | Gravehorn, raw marble, changed return | Mandatory mechanics pass; P1 art |
| GA1 | Refuge, Sage and network rescue | Core payoff passes continuously |
| A11–A13 | Optional currency, traversal and Servo evidence | Natural loop open |
| A10/GA2 | Optional Alpha offer/cache/ledger/Pack Sage | Correctly optional; natural loop open |

## Manhwa parity matrix

| Beat | Runtime evidence | Literal acceptance still missing |
|---|---|---|
| Wake/bay/gate | Ordered and gradual | Cradle/lamp reach |
| Letter/drawer/Ratchet | Campaign passes; repair board strong | Continuous battery/socket installation body/prop contact |
| First guardian meeting | Ordered warning/escalation | Preserve player agency and exact source action |
| Cave/marble | Causal and completed | Finished Gravehorn, visible marble carry |
| Forge | Correctly gates Sage/lion | Continuous hand/tool/material contact |
| Passage/Sage | Ordered and rescued gait present | `passage_b` anatomy; notification density |
| NULLFANG break | Correct order | Literal cable assistance/catch |
| CHIME | Before lion | Literal casing opening |
| Lion freeing | Hold, extraction state, gold return | Hero body acting, purple `m_down` eyes, video-on/fade proof |
| B1 teaser | Correct threshold | Preserve gradual spoiler-safe delivery |

## Animation, combat and VFX matrix

| System | Current result | Open gate |
|---|---|---|
| Normal/charged hits | White flash, dual sound routes, metal debris, recoil/knockback, shake, hit-stop and stronger held attack pass contracts | Listened mix, real haptics, final balance matrix |
| Stats/log/cards | HP, power, speed, defense and bounded log exist | Keep PDF/cards synchronized after balance changes |
| Hero/Alpha/pack/lion/Talon | Approved and preserved | Target-device feel |
| Rescued Sage | Authored walk while moving; pure idle otherwise | More motion richness optional |
| Gravehorn | Full-run mechanics pass; purple optic present | P1 body/poses/intercuts; stable isolated setup |
| Furnace | Base identity present | Six authored action plates |
| Bound creatures | Live identity present | Down/breathe/recover strips |
| Eye trails | Red ordinary; purple bosses/Sages/Alpha; finite/clearing contract passes | Sustained physical-device profile |

## Gameplay-size visual inspection

- Repair board: polished, clear hierarchy and component identities.
- Raw-marble reward: understandable, but two center cards plus objective/HUD
  begin the notification-density problem.
- Forge: Ratchet and environment read well; quest direction remains forward.
- Rescued Sage: causal result is clear, but center story cards, `RESCUED`/
  `FREED`, objective and HUD compete; bound creature is too small/flat.
- Restored NULLFANG: gold silhouette reads professionally; reward and objective
  compete across the upper field.
- Gravehorn: procedural translucent rhino remains far below the hero's art.
- Chapter handoff: clear, readable and spoiler-light.

These are 1280×720 host captures, not physical-device approval.

## Evidence retention

- `automated/results.json` preserves the 201-result aggregate plus closed-file
  base64 snapshots.
- All raw aggregate logs are published in today's branch.
- `automated/log-integrity.json` honestly preserves the original final failure.
- `automated/recovered-log-integrity.json` lists the four byte-for-byte restored
  logs and their matching SHA-256 records.
- Fresh campaign result, save checkpoints, campaign log and all 22 gameplay
  frames are retained.
- Original aggregate failures and every rerun remain separate; no failing log
  was overwritten by a retry.

## Commands and outcomes

| Command | Outcome |
|---|---|
| `npm ci` | Pass; deprecation warnings only |
| Standard Playwright Chromium install | Host failure: zero-byte/truncated CDN archives after retries |
| Manual Chromium/font preflight | Pass: Chromium 153; nonzero Latin 162, CJK 76, Arabic 133 canvas widths |
| Full `tools/studio/audit.py --profile full` | 198 pass / 3 fail; 201 checks; build/pack pass; original log integrity false |
| Fresh `campaign-ch1` in collector | Pass/certified, 13:06, 0 deaths |
| `purification-save bake3d gravehorn` rerun | purification-save pass; bake3d pass; Gravehorn fail |
| Isolated `opening-order` rerun | Fail after desktop booth; phone phase not reached; rerun integrity true |
| Full-run `gravehorn` | Pass with original 0.30–0.45 s bound; observed 367 ms |
| Fresh infection eye suite | eye, roster and poses pass |

## Five-state handoff

| State | Truth on this branch |
|---|---|
| Implemented | Two evidence-only corrections: restore Gravehorn 0.30 s minimum; initialize purification braid ledger before reading. No production game/art change. |
| Tested | Full 201-check collector; fresh continuous campaign; bounded and opening reruns with failures retained. |
| Visually inspected | Repair, marble, forge, Sage, lion, chapter handoff and Gravehorn at gameplay size. |
| Integrated | No. |
| Deployed | No deployment attempted. |

The single copyable integration handoff is [CLAUDE_PROMPT.md](CLAUDE_PROMPT.md).
