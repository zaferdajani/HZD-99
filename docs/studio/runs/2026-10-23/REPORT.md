# CLAWBYTE senior studio review — 2026-10-23

## Executive decision

**Keep this as a review branch. Do not merge or deploy yet.**

No production source or art moved after the October 22 review: `main` and the
Claude integration branch remain at `62d75d2`, while this cumulative review
continues from `c259a7c`. The rescued Sage remains fixed, mandatory story order
and finite red/purple eye trails are intact, and today's full collector passed
198 of 201 harnesses with complete raw-log/snapshot integrity.

Today's bounded implementation is evidence-only. `opening-order` now saves a
state-transition timeline, exact terminal tutorial/dialog/video state, per-mode
JSON and a terminal screenshot while retaining its 240-second limit. That trace
converted an ambiguous failure into a measured result: no cut/video/overlay or
page-error deadlock exists. An independent phone-sized run completed all fifteen
steps, entered A1, woke Servo and accepted his coil errand. In the later full
collector, both desktop and phone reached all fifteen steps and the final `go`
prompt but exhausted the fixed budget before A1.

Release remains held by production art, optional natural-play,
physical-device and listened-audio gates. GRAVEHORN, bound recovery, Furnace,
hero ritual body motion, four ritual films and three localized panels are still
open; approved hero, Alpha/pack, crystal, sword, lion and Talon work was not
regenerated.

## Repository and publication state

| Item | Value |
|---|---|
| Review branch | `codex/studio-review-2026-10-23` |
| Review parent | `c259a7c3c850474f6217e921b57820918fa89d55` |
| Pinned evidence source | `7c3cefeb6bda7aa59e9ae34520e50bbdd6d45237` |
| Production `main` at intake | `62d75d204c6f6264f25150bb419fc262ff2c18ea` |
| Claude integration at intake | `62d75d204c6f6264f25150bb419fc262ff2c18ea` |
| Upstream movement since October 22 | None |
| New/generated production art | None |
| Merged | No |
| Deployed | No |

The pipeline and `roles.json` are present on `main`; the cumulative review has
three additional evidence-integrity/browser clauses. All 15 responsibilities
were instantiated in separate grouped design, art and engineering reviews.

## What changed

### `PHONE-TRACE-23` / P1 evidence blocker — improved

**Problem:** `opening-order` previously reported only a final room/step, while
calling phone viewport evidence “with touch controls.” A finite miss could not be
attributed to cut media, overlay state, tutorial hold, recharge or host timing.

**Fix:** record each room/state/step/dialog/panel/cut transition with elapsed time;
save terminal room/state, hold/recharge, dialog queue, video ready/current/duration/
failure state; emit a terminal screenshot and per-mode JSON; correct the comment
to state that phone mode is a touch-capable viewport driven by keyboard/mouse.

**Guardrails:** no production file changed; no assertion, input sequence or
240-second limit changed; no flag, item, terrain or position was injected.

**Observed:**

- Independent run: phone completed A1/Servo; desktop reached `atk` at 233.7 s.
- Full collector: both modes reached all 15 steps and terminal PLAY/A0/`go`,
  with null dialog/cut, no overlay conflict and zero page errors; each missed A1
  only when its finite budget closed.

Acceptance remains a deterministic finite run through Servo plus a separate
actual-touch route and physical-device pass. Raising the timeout alone is not a
product fix.

## Fifteen senior-role verdicts

| # | Senior responsibility | Verdict | Evidence/reason |
|---:|---|---|---|
| 1 | Cinematic Designer | Issues | Sixteen ordered triggers pass; literal physical manhwa actions remain incomplete. |
| 2 | Game Designer — Player Systems | Issues | Tutorial order is correct; phone-sized run can complete, but the full finite gate varies with host timing and no true-touch run exists. |
| 3 | Mission Designer — Quest Craft | Issues | Mandatory fetch/forge/rescue loop is strong; several optional acquire/return/consequence loops lack natural-play proof. |
| 4 | Principal Encounter Designer | Issues | Den and mandatory encounter contracts pass; optional routes, GRAVEHORN final art and device feel remain open. |
| 5 | Senior Boss Designer | Issues | NULLFANG/Alpha identity and deliberate purification pass; body/film/device gates remain. |
| 6 | Mission Designer — Campaign | Issues for fresh/optional evidence | October 22 mandatory route is certified. Today's fresh run completed five missions through forge, then timed out after a Sage-fight death because its ordinary-input recovery stalled in CV2. Alpha/all optional caves remain excluded. |
| 7 | Character Artist | Issues | Approved high-quality work is preserved; GRAVEHORN, bound recovery, Furnace and hero ritual body art remain open. |
| 8 | Cinematic Director | Issues | Panel order passes; four ritual films and three localized visual corrections remain. |
| 9 | VFX Artist | Pass for bounded eye system; device gate open | Fresh eye/roster/pose checks pass red/purple anchors, finite lifecycle and reduced-motion behavior. |
| 10 | Technical Director — World Systems | Issues | Mandatory graph/topology/cache checks pass and the isolated WebGL bake rerun passes; optional natural route and device streaming remain open. |
| 11 | Gameplay Engineer — Combat | Pass in source/browser; device gate open | Hit feel, charge, stats/logs and purification contracts pass; listened mix/haptics remain unverified. |
| 12 | Gameplay Engineer — Mission | Pass mandatory sequence; optional issues | Gates and saves pass; optional Alpha/cave loops are staged only. |
| 13 | Gameplay Engineer — NPC | Pass Sage fix | Authored purified gait, rescued idle and persistence pass. Servo responsive trace improved. |
| 14 | Lead UI Engineer | Issues | Text/RTL/CJK/overlay/rotation contracts pass; full finite opening and actual touch/device proof remain open. |
| 15 | Senior Mission Producer | Hold integration/release | Evidence is honest and bounded; production-art, fresh continuous route, optional, device and listened-audio gates remain. |

Discipline reports: [DESIGN.md](DESIGN.md), [ART.md](ART.md) and
[ENGINEERING.md](ENGINEERING.md).

## Findings register

| ID | Severity | Status | Player consequence / reproduction | Evidence | Owner and acceptance |
|---|---|---|---|---|---|
| PHONE-TRACE-23 | P1 evidence | Diagnostic fixed; acceptance open | Full gate can expire at final tutorial step without explaining why. Run `opening-order`. | Fresh source + two executions + JSON/screenshots | UI/QA: complete finite Servo route, then true touch and physical phone. |
| CAMPAIGN-ENV-23 | P1 evidence | Original failed; rerun separate | Full collector could not create a page because FFmpeg was missing. | Fresh failed log before gameplay | QA: retain original; install declared dependency; report rerun independently. |
| BAKE-WEBGL-23 | P2 tooling | Closed in isolated rerun | Full collector could not validate GLB sheets because its wrapper disabled GPU. | Original failed log plus separate passing WebGL rerun | Tech art: preserve a declared WebGL-capable wrapper in the integration environment. |
| CAMPAIGN-RECOVERY-23 | P1 evidence | Open | After one legitimate Sage-fight death, the ordinary-input driver reloads in CV1B and cannot make the required CV2 central-platform jump. It times out at 40:00 after 166 recoveries. | Separate campaign log/result + inspected gameplay-scale frame | QA/mission: fix and test the route planner without state injection, then rerun; separately verify the same traversal by a human. |
| GH-ART | P1 art | Carried | Mandatory marble guardian reads below hero/Alpha quality. | Ledger/source/visual inspection | Character/cinematic art: approved body set + four intercuts at gameplay scale. |
| BOUND-ART-01 | P2 art | Carried | Defeated wolf collapses to a tiny flat crouch cell. | Fresh gameplay-scale comparison | Character art: true wolf/cheetah down-breathe-recover strips. |
| FURNACE-ART | P2 art | Carried | Mechanics pass without six authored performance states. | Ledger/source | Character art: breath/blast/spent/gather/dive/bell poses. |
| PURIFY-ART-01 | P2 art | Carried | Ritual VFX runs without authored continuous hero body contact. | Source/visual review | Character/VFX: raise/hold/slash/recover strip, continuous hand/hilt. |
| RITUAL-FILMS | P2 cinematic | Carried | Four guardians use engine fallback, not guardian-specific extraction films. | Media metadata + source | Cinematic: Brood/Atlas/Zero/Prism films matching lion contract. |
| PANEL-CORRECT-23 | P2/P3 art | Carried | Red boss eyes, lit inactive Servo and off-model passage hero break continuity. | Fresh visual inspection | Local edits only; preserve composition/earned gear. |
| OPT-CAVE-NATURAL | P2 evidence | Open | Optional cave rewards may exist in source without player-discovered loop proof. | Staged tests/source | Mission: ordinary-input acquire/return/consequence/reload for every optional cave. |
| ALPHA-NATURAL | P2 evidence | Open | Optional wolf story/reward lacks full fresh offer-to-reload proof. | Source/staged tests | Mission/boss: natural offer, rescue, friendly pack, rewards and reload; B1 remains independent. |

## Full collector and provenance

`CHROMIUM_PATH=docs/studio/runs/2026-10-21/setup/browser-wrapper.cjs
python tools/studio/audit.py --profile full --output
docs/studio/runs/2026-10-23/automated`

- Base commit: `7c3cefe`; dirty at start: empty.
- Build and app package: pass.
- Browser preflight: Chromium 153; canvas widths were nonzero for Latin (120),
  Chinese (72) and Arabic (51.07) at 24 px.
- Harnesses: **198 pass, 3 fail, 201 total**.
- Served identity stayed pinned to BUILD_ID `6d3db4ac3ebd`.
- Log integrity: pass; every disk log equals its captured closed-file snapshot.

| Failed check | Exact classification |
|---|---|
| `opening-order` | Product order/content assertions through all 15 steps passed; finite route did not enter A1/Servo. Both terminal states were PLAY/A0/`go`, without cut/dialog/page error. |
| `campaign-ch1` | Environment failure before gameplay: missing Playwright FFmpeg. Not a playthrough and not a product assertion. |
| `bake3d` | Environment/tooling failure: Three.js could not create WebGL under the software wrapper. Not an art certification. |

The original failures above remain immutable. A separate declared WebGL-capable
rerun then passed `bake3d` in 3.5 seconds: all eight yaw cells were populated,
feet stayed on one row, silhouettes differed, root motion was stripped, the
vertical bob remained and the driving video was written. That closes the host
tooling blocker without rewriting the full collector's 198/201 result.

Passing checks cover build/package, story order, repair, caves, den gate, panels,
manhwa reader, Sage/rescue, wolf/Alpha contracts, infection eyes/roster/poses,
combat impact, stats/logging, purification, audio routing, text reveal/RTL/CJK,
room graph/cache and saves. Most are staged/contract harnesses and are not called
continuous play.

## Continuous play versus staged evidence

| Evidence | Result | What it proves / excludes |
|---|---|---|
| October 22 continuous campaign | Certified in 17:36, easiest, ordinary keyboard, 2 deaths, 9/9 missions, 16/16 ordered panels, zero missed/page errors | Strong mandatory route evidence on parent; video off, read-only planner, seven recovery frames, Alpha excluded. |
| October 23 full-collector campaign attempt | Failed before gameplay | Missing FFmpeg only; no route evidence. |
| October 23 same-day campaign rerun | Timeout at 40:00: 5 missions through forge, 11 ordered panels, 1 Sage-fight death, then 166 failed CV2 recoveries; 0 page errors and 0 panel-order errors | Real ordinary keyboard input from cleared storage; not certified. The inspected terminal frame shows a live hero on CV2's central platform with the correct Sage objective. This proves a driver/recovery failure, not that a human is trapped. Separate provenance never rewrites the original failed collector log. |
| October 23 independent `opening-order` | Mixed: phone-sized route completed A1/Servo; desktop expired at attack lesson | Real keyboard/mouse input in desktop/touch-sized viewports; not physical touch. |
| October 23 full-collector `opening-order` | Fail: both modes reached all 15 beats and final `go`, not A1 | Finite timing result with terminal trace; no deadlock/page error observed. |
| 198 full-collector passes | Pass | Staged and contract coverage on one served snapshot; not an uninterrupted route. |
| Physical phone/controller/listened audio | Not run | No device, haptic, thermal or subjective mix certification. |

## Cave census

| Area | Intended value | Verdict |
|---|---|---|
| A5 | Loose-floor landmark, Magnet riddle, history, quarry mouth | Mandatory and causal; route evidence exists. |
| A7 | Survey read and once-paid return | Meaningful source; natural return open. |
| CV1 | Bound crawler and optional max-core pocket | Distinct; final bound art and natural revisit open. |
| CV1B | Survey/map/shortcut/rest | Useful and exercised by campaign. |
| CV2 | Deaf System evidence and beacon/lure | Purpose exists; comprehension not measured. |
| CV3 | GRAVEHORN/raw marble/changed return | Mandatory payoff; gameplay passes, art P1. |
| GA1 | Refuge/Sage/network rescue | Core payoff; Sage movement fixed/passing. |
| A11–A13 | Optional currency/traversal/Servo evidence | Natural acquisition open. |
| A10/GA2 | Optional Alpha/cache/ledger/Pack Sage | Correctly optional; full natural loop open. |

## Manhwa parity matrix

| Beat | Runtime status | Remaining acceptance |
|---|---|---|
| Wake/bay/gate | Ordered triggers/panels | Literal cradle/lamp reach and release body action. |
| Letter/drawer/Ratchet | Ordered, repair board playable | Continuous physical cell/socket installation. |
| First guardian meeting | Correct pre-escalation trigger | Preserve warning and player agency. |
| Cave/marble | Causal reward route | GRAVEHORN body/intercuts and visible carry continuity. |
| Forge | Correctly precedes Sage/lion | Continuous hand/tool/material contact. |
| Passage | Correct threshold | Localized `passage_b` anatomy correction. |
| Sage | Rescue/save/gait pass | Richer approved leg/robe separation only if art review requires it. |
| NULLFANG break | Correct order | Literal cable assistance/catch. |
| CHIME | Before lion | Literal casing opening. |
| Lion freeing | Hold ritual + authored film | Hero body strip and purple `m_down` eyes. |
| B1 teaser | Correct chapter threshold | Keep gradual, readable and spoiler-safe. |

## Animation, combat and VFX matrix

| System | Status | Open gate |
|---|---|---|
| Normal hit feel | Flash, dual sound routes, metal debris, target knockback, hero recoil, shake and hit-stop pass | Listened mix and physical haptics. |
| Charged hit | Stronger damage/freeze/recoil/VFX pass | Final weapon × defense × difficulty × boss balance. |
| Character stats/log | HP/power/speed/defense tables and damage logs pass | Cards document values; they do not certify balance. |
| Rescued Sage | Authored purified walk + rescued idle pass | Optional richer robe/leg art. |
| Alpha/pack | Approved wolf identity preserved | Natural optional quest/device feel. |
| NULLFANG | Authored lion motion, gold return and film preserved | Hero ritual body and listened ending. |
| GRAVEHORN | Mechanics pass | P1 body/poses/intercuts. |
| Bound creatures | Live wolf reads well; bound state visibly flattened/tiny | True down/breathe/recover strips. |
| Eye trails | Fresh red/purple finite contracts pass | Sustained real-device memory/frame time. |

## Commands and exact outcomes

| Command | Outcome |
|---|---|
| `npm ci` | Pass; 160 packages installed. |
| Browser wrapper `--version` + Playwright canvas preflight | Chromium 153; Latin/CJK/Arabic metrics nonzero. |
| `node --check tests/opening-order.cjs` / `git diff --check` | Pass before checkpoint commit. |
| `CHROMIUM_PATH=... node tests/run.cjs opening-order` | Fail after 493.8 s; independent phone complete, desktop finite miss; artifacts retained. |
| `python tools/studio/audit.py --profile full ...` | 198/201 pass; three classified failures; log integrity pass. |
| `npx playwright install ffmpeg` | Pass through fallback mirror; dependency installed after original failure. |
| `CAMPAIGN_VIDEO=0 CAMPAIGN_MAX_MIN=40 ... audit.py --tests campaign-ch1 ...` | Fail/timeout at 40:00; five missions through forge, 11 panels, 1 death, 166 recoveries, zero page errors. |
| `CHROMIUM_PATH=/tmp/clawbyte-21-browser/chromium-webgl-wrapper.cjs python tools/studio/audit.py --tests bake3d ...` | Pass; unchanged bake assertions completed in 3.5 s with log integrity. |

## Five-state handoff

| State | Truth on this branch |
|---|---|
| Implemented | Trace-only `opening-order` evidence improvement; cumulative Sage/hatch/review fixes preserved. |
| Tested | Build/package + 198 passing full-collector harnesses; three retained failures; separate opening and campaign evidence. |
| Visually inspected | Sage gameplay frame, live/bound wolf comparison, Alpha body, restored gold lion and three problem panels at gameplay/panel scale. |
| Integrated | No. Main/integration remain `62d75d2`. |
| Deployed | No deployment attempted. |

The one handoff to Claude is [CLAUDE_PROMPT.md](CLAUDE_PROMPT.md).
