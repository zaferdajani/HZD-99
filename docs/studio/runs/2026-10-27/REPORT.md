# CLAWBYTE senior studio review — 2026-10-27

## Executive decision

**Keep this as a review branch. Do not merge or deploy.**

No game-source or production-art delta landed after October 26. `main` moved
from `62d75d204c6f6264f25150bb419fc262ff2c18ea` to
`573d09d48d6278cf1afb51f66db3d9d014bafefe`, but that commit only adds
`.claude/skills/founder-*` files. The Claude integration ref remains at
`62d75d204c6f6264f25150bb419fc262ff2c18ea`. This review continues from
October 26's `327da1dee3f05bf4ee8eb9d6d7ee9cfaca902076`.

The full collector completed all 201 result records: **198 pass / 3 fail**.
The failures are opening-order, the fresh continuous campaign, and host WebGL
`bake3d`. Build and package passed. The served page hash stayed pinned from
start to end. Finite red/purple eye suites passed. Gravehorn mechanics passed
the aggregate and three separate integrity-clean isolated reruns with the
original assertions intact, including a 366 ms horn lock.

Today's cleared-storage, ordinary-keyboard campaign is **not certified**. It
completed opening, Servo, first meeting, raw marble and forge with zero deaths,
then oscillated between two CV2 platforms while trying to return to CV3. It
made 179 recovery attempts and ended at 40:00. The driver used ordinary input
and a read-only planner; it did not inject inventory, position, health, terrain,
quest flags or save state. Staged cave tests passed and October 26's campaign
completed B1, so this is a reproducible continuous-driver/traversal certificate
failure, not proof of a human hard lock or a new game regression.

The collector also correctly failed final log integrity because two test logs
were mutated by detached descendants after capture. A bounded collector fix now
uses Linux subreaper ownership, process-group cleanup and adopted-child reaping.
All eight unit regressions pass, and a separate real audit of the two affected
checks passes with integrity true. The original aggregate integrity failure is
preserved; its two logs were recovered byte-for-byte from their embedded closed-
file snapshots.

Gameplay-size inspection reconfirms the established art direction: Ratchet's
repair board and forge are strong; Servo is readable and purposeful; Gravehorn
is still a P1 procedural placeholder; bound creatures remain too small/flat;
and reward/story notices crowd the Sage and lion moments. No asset was regenerated.

## Repository and version state

| Item | Value |
|---|---|
| Review branch | `codex/studio-review-2026-10-27` |
| Review parent/base | `327da1dee3f05bf4ee8eb9d6d7ee9cfaca902076` |
| Production `main` at intake | `573d09d48d6278cf1afb51f66db3d9d014bafefe` |
| Claude integration at intake | `62d75d204c6f6264f25150bb419fc262ff2c18ea` |
| New upstream game/art delta | None; `main` change is unrelated founder skills |
| Served `index.html` SHA-256 | `8992e9e43c585cf804af178c9dba4adee7b797e4aca077f0d67e5220fdb94d1d` at start and end |
| Live production version | Not reverified; no deployment claim |
| Production game/art changed today | No |
| Bounded source change | Collector ownership/integrity only |
| Integrated | No |
| Deployed | No |

The pipeline, role registry and all fifteen role mandates were read from `main`.
Roles were instantiated as design (1–6), art/cinematic/VFX (7–9), engineering
(10–14), and producer (15). Discipline reports are [DESIGN.md](DESIGN.md),
[ART.md](ART.md) and [ENGINEERING.md](ENGINEERING.md).

## Fifteen senior-role verdicts

| # | Senior responsibility | Verdict | Evidence / required action |
|---:|---|---|---|
| 1 | Cinematic Designer | **P1 issue** | Draft 3 is forty pages; today saw ten sequence IDs and October 26 saw sixteen. Build literal per-page action/prop/equipment/trigger/capture parity. |
| 2 | Game Designer — Player Systems | **Journey evidence failed** | Opening-order stopped before meadow/Servo; continuous run stopped in CV2. Use semantic state waits/actions and real touch/controller proof. |
| 3 | Mission Designer — Quest Craft | Mandatory logic present; optional proof open | Opening→forge completed naturally. Alpha/A7/A11–A13 natural discovery→reward→reload remains uncertified. |
| 4 | Principal Encounter Designer | Mechanics pass; presentation/campaign issue | Gravehorn passes aggregate + 3 isolated runs. P1 authored body/intercuts absent; CV2 continuous driver loops. |
| 5 | Senior Boss Designer | Identity pass; ritual presentation issue | Purification contracts pass. Four films and continuous hero raise/hold/slash/recover acting remain open. |
| 6 | Senior Mission Designer — Campaign | **Not certified today** | 40:00, 0 deaths, 5 missions, 10 IDs, CV2 timeout. October 26 B1 pass is historical only. |
| 7 | Senior Character Artist | **P1/P2 issues** | Gravehorn set, bound recovery strips, Furnace states and hero ritual acting remain unfinished. |
| 8 | Cinematic Director | **P1/P2 issues** | Forty-page parity, four Gravehorn intercuts, four guardian films and three panel corrections remain open. |
| 9 | Senior VFX Artist II | Host contract pass; device open | Eye, roster and 105-pose suites pass; sustained physical-device performance is unverified. |
| 10 | Technical Director — World Systems | Staged pass; continuous/device open | Graph/cache/map pass; fresh route loops in CV2; no physical-device certificate. |
| 11 | Gameplay Engineer — Combat | Contracts pass; physical feel open | Impact/stats/eyes/purification/Gravehorn green; listened audio, haptics and device feel open. |
| 12 | Gameplay Engineer — Mission | Source/staged pass; journey issue | Mandatory flags coherent; opening-order and campaign do not finish today; optional loops staged. |
| 13 | Gameplay Engineer — NPC | Staged/observed pass | Sage authored walk passes. Servo is grounded, larger and purposeful. Fresh Sage follow/reload not reached. |
| 14 | Lead UI Engineer | Contracts pass; density/touch issue | Text/RTL/CJK/rotation pass. Unbounded toast stack still crowds Sage/lion; physical touch untested. |
| 15 | Senior Mission Producer | **Hold** | P1 art/parity, continuous reliability, clean full-run integrity and device gates remain. |

## Findings register

| ID | Severity | Status | Player/evidence consequence | Acceptance |
|---|---|---|---|---|
| `GH-ART` | P1 art | Open | Mandatory marble guardian looks like a translucent debug silhouette beside finished hero art. | Fourteen authored parts, both facings, planted pivots, detachable horns, phase material/body change and four trigger-bound intercuts. |
| `MANHWA-PERF-01` | P1 presentation | Open | Ordered runtime IDs are still being mistaken for literal forty-page parity. | Forty-row cast/prop/equipment/action/VFX/audio/trigger/capture ledger; every row passes or comic is revised. |
| `OPEN-ORDER-26` | P1 evidence/reliability | **Open, fresh fail** | Desktop stops in A0B after heal; phone-size stops in A0 after node; neither reaches meadow/Servo. | Semantic state waits/actions, three clean desktop+phone-size runs, then physical touch. |
| `CAMPAIGN-CV2-27` | P1 evidence/reliability | **New, reproduced in one 40-minute run** | Fresh continuous certificate times out after forge with 179 CV2 recovery loops. | Diagnose planner/transition; repeat cleared-save B1 run. Human hard lock must not be claimed without reproduction. |
| `EVID-RETENTION-26` | P1 evidence | Bounded fix verified; full aggregate not rerun | Aggregate correctly reports two post-capture mutations. Final fix passes 8 units and real two-check audit with integrity true. | Next full collector retains every raw log unchanged; original failure remains preserved. |
| `DEVICE-24` | P1/P2 evidence | Open | No physical phone, controller, listened audio, haptics, thermal or sustained performance proof. | Target-device matrix. |
| `UI-DENSITY-25` | P2 UI | Open | Sage/lion reward/story cards compete with objective, status and HUD. | Finite priority/dedupe/cap queue and desktop/phone RTL/CJK safe-zone assertions. |
| `OPT-QUEST-24` | P2 mission evidence | Open | Alpha and optional cave loops have only staged/source purpose. | Ordinary-input offer→search→rescue→reward→reload while B1 remains independent. |
| `RITUAL-FILMS` | P2 cinematic | Open | Brood/Atlas/Zero/Prism still use fallback. | Guardian-specific films plus video-on controlled picture/music fade and gold return. |
| `BOUND-ART-01` | P2 art | Open | Freed/down wolf/cheetah reads tiny and flattened. | Authored down/breathe/recover strips, stable floor and cured-eye cleanup. |
| `FURNACE-ART` | P2 art | Open | Six actions reuse/transmute generic figures. | Six identity-matched authored states preserving mechanics. |
| `PURIFY-ART-01` | P2 art | Open | Sword VFX exists without continuous body/hand/hilt performance. | Raise→hold/gather→slash→recover strip with interruption. |
| `PANEL-CORRECT-23` | P2/P3 art | Open | Red NULLFANG eyes, lit inactive Servo and off-model passage hero remain. | Local masked corrections only. |
| `GH-HARNESS-26` | P2 evidence | **Resolved on current snapshot** | Prior isolated fixture was nondeterministic. | Aggregate + three isolated passes with clean integrity and original assertions achieved today. |
| `EYE-VFX-24` | Host pass | Device open | Correct color/anchor/lifetime/caps/cleanup pass staged host checks. | Sustained physical-device frame/memory/thermal proof. |

## Automated and continuous evidence

| Evidence | Result | Meaning |
|---|---|---|
| Full collector | **198 pass / 3 fail**, all 201 records completed | Failures: opening-order, campaign-ch1, host WebGL bake3d |
| Full-run integrity | **False** | `input-focus.log` and `seam.log` mutated after capture; snapshots remained valid |
| Recovered logs | Pass | Both restored byte-for-byte from recorded snapshots; original failure preserved |
| Collector unit regressions | **8/8 pass** | Includes normal and detached-session late writers |
| Real cleanup rerun | Pass, integrity true | `input-focus` and `seam` in separate directory using final fix |
| Gravehorn aggregate | Pass | Original timings/assertions; 366 ms horn lock |
| Gravehorn isolated 1–3 | **3/3 pass, integrity true** | Closes current mechanical fixture reliability concern |
| Opening-order | Fail in 484 s | Real browser input; desktop/phone-size journey, not physical touch |
| Continuous campaign | Fail/timeout 40:00 | Cleared storage, ordinary keyboard, read-only planner, 0 deaths, stopped CV2 |
| Eye/roster/poses | Pass | Staged host-browser VFX contract, not device performance |
| Physical device/audio/haptic | Not run | No hardware acceptance |

## Continuous campaign certificate

| Property | Observed |
|---|---|
| Base commit | `327da1dee3f05bf4ee8eb9d6d7ee9cfaca902076` plus collector-only working fix |
| Start | Cleared browser storage |
| Input | Ordinary keyboard events |
| Planner | Read-only; no gameplay/progression mutation |
| Difficulty | Easiest (0) |
| Wall time | 40:00 |
| Result | `timeout`, `certified:false` |
| Deaths | 0 |
| Missions | opening, Servo, first meeting, marble, forge |
| Presentation IDs seen | wake, bay, gate, letter, drawer, Ratchet, meet, cave, marble, forge |
| Missing due stop | passage, Sage, break, CHIME, free, chapter-two teaser |
| Terminal room/state | CV2, mission `sage`, x alternating 672/744 |
| Recovery count | 179 |
| Page/panel errors | None |
| Video | Disabled for automation |
| Alpha | Excluded as optional |

## Manhwa parity matrix

| Beat | Current runtime evidence | Literal acceptance still missing |
|---|---|---|
| Wake/bay/gate | Ordered and gradual | Cradle/lamp reach |
| Letter/drawer/Ratchet | Continuous today; repair board strong | Continuous battery/socket body/prop contact |
| First guardian meeting | Ordered warning/escalation | Exact agency/action parity |
| Cave/marble | Continuous today | Finished Gravehorn and visible marble carry |
| Forge | Continuous today and correctly gates sword | Continuous hand/tool/material contact |
| Passage/Sage | Historical October 26 only | `passage_b` anatomy and notification density |
| NULLFANG break | Historical correct order | Literal cable assistance/catch |
| CHIME | Historical before lion | Literal casing opening |
| Lion freeing | Historical hold/extract/gold return | Hero body acting, panel-purple eyes, video-on/audio fade proof |
| B1 teaser | Historical correct threshold | Fresh completion and gradual spoiler-safe delivery |

## Animation, combat and VFX matrix

| System | Current result | Open gate |
|---|---|---|
| Normal/charged hits | Flash, dual sound routes, metal debris, knockback/recoil, shake/hit-stop and stronger held hit pass contracts | Listened mix, haptics and balance matrix |
| Stats/log/cards | HP, power, speed, defense and bounded log pass | Keep PDF/cards synchronized after balance changes |
| Hero/Alpha/pack/lion/Talon | Approved and preserved | Target-device feel |
| Rescued Sage | Authored moving walk; pure idle otherwise | Fresh continuous rescue/follow/reload footage |
| Gravehorn mechanics | Aggregate + three isolated passes | None for current host mechanics |
| Gravehorn art | Procedural translucent stand-in | P1 body/poses/intercuts |
| Furnace | Base identity/mechanics present | Six authored action plates |
| Bound creatures | Live identity present | Down/breathe/recover strips |
| Eye trails | Red ordinary; purple bosses/Sages/Alpha; finite/clearing contract passes | Sustained physical-device profile |

## Evidence retention

- `automated/results.json` retains all 201 aggregate records and closed-file
  base64 snapshots.
- `automated/log-integrity.json` honestly preserves the original two mismatches.
- `automated/recovered-log-integrity.json` records byte-for-byte restoration.
- The campaign result, save checkpoints and full log are retained. Eighteen
  representative frames preserve all major completed beats plus early, middle
  and terminal CV2 loop states from the 191 frames captured; redundant loop
  frames were not added to repository history.
- Reruns are separate; no failed result was overwritten by a retry.
- The final collector code is verified by unit tests and
  `reruns/log-cleanup`, but the expensive full aggregate was not repeated after
  that final collector-only change.

## Commands and outcomes

| Command | Outcome |
|---|---|
| `npm ci` | Pass; deprecation warnings only |
| `npx playwright install chromium` | Host failure: zero-byte/truncated archive |
| Fallback Chromium/font preflight | Chromium 153; nonzero Latin/CJK/Arabic; WebGL unavailable |
| `python -m unittest tools.studio.test_audit -v` | 8/8 pass after final fix |
| `CAMPAIGN_VIDEO=0 ... audit.py --profile full` | 198/201; full requested scope; original integrity false |
| `audit.py --tests input-focus seam` | Pass; integrity true with final collector fix |
| `audit.py --tests gravehorn` ×3 | Three passes; each integrity true |
| `git diff --check` | Pass |

## Five-state handoff

| State | Truth on this branch |
|---|---|
| Implemented | Collector-only descendant ownership and immutable-log fix; no production game/art change |
| Tested | Full 201-result collector, 40-minute campaign, 8 unit tests, cleanup rerun, 3 Gravehorn reruns |
| Visually inspected | Repair, Servo, marble, forge, CV2 loop, historical Sage/lion, Gravehorn and three panel defects |
| Integrated | No |
| Deployed | No deployment attempted; live version not claimed |

The one copyable integration handoff is [CLAUDE_PROMPT.md](CLAUDE_PROMPT.md).

