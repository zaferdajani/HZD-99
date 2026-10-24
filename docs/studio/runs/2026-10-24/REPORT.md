# CLAWBYTE senior studio review — 2026-10-24

## Executive decision

**Keep this as a review branch. Do not merge or deploy yet.**

The largest evidence blocker from October 23 is closed. A fresh cleared-storage,
ordinary-keyboard Chapter One run completed in **15:04**, reached B1, completed
all **9/9 mandatory missions**, displayed all **16/16 panels in exact order**,
reported zero page/panel errors and recovered from one legitimate Sage-fight
death using the game's own CV1B respawn. The bounded code change fixes only the
test driver's post-death jump recovery; it does not modify the game.

Release remains held. GRAVEHORN is still a flat procedural-looking fallback
beside the approved hero/Alpha/lion art. A fixed 240-second opening harness still
fails to reach Servo even though the continuous campaign does. Literal manhwa
body/prop acting, four guardian ritual films, optional Alpha/cave natural-play,
physical touch/controller/haptics, sustained performance and listened audio
remain unverified.

No production art was regenerated. Approved hero, pack/Alpha, crystal, sword,
NULLFANG/lion and Talon work is preserved.

## Repository and publication state

| Item | Value |
|---|---|
| Review branch | \`codex/studio-review-2026-10-24\` |
| Review parent | \`40bd9dc370c76d54b896c59b2b69e08bc9bbcf75\` |
| Parent tree | \`de799e13360722479966459610e244f175c3d80f\` |
| Production \`main\` at intake | \`62d75d204c6f6264f25150bb419fc262ff2c18ea\` |
| Claude integration at intake | \`62d75d204c6f6264f25150bb419fc262ff2c18ea\` |
| Upstream movement since October 23 | None |
| Production game files changed today | None |
| Evidence-driver files changed | \`tests/campaign-ch1.cjs\` only |
| Merged | No |
| Deployed | No |

The studio pipeline and role registry are present. All 15 senior
responsibilities were instantiated in grouped design, art and engineering
reviews, with the producer verdict recorded here.

## What changed

### QA-RECOVERY-24 — fixed and certified

The October 23 campaign died normally in the Sage fight, respawned at CV1B and
then repeated 166 ineffective CV2 recovery attempts. The driver tapped jump,
released it, and only afterward chose a random horizontal key. It therefore
could not perform the directional jump a player uses from a suspended platform.

The driver now records its selected planner edge, holds direction and jump
together during recovery, lets a planned setup edge override the final exit
direction, and resets its navigation model on recovery, room transition and
death. The campaign then reproduced the legitimate death/respawn and completed
the exact route to B1.

Guardrails: no save mutation, terrain edit, teleport, invulnerability, healing,
inventory grant, quest flag, enemy statistic or damage rule was added.

## Fifteen senior-role verdicts

| # | Senior responsibility | Verdict | Evidence/reason |
|---:|---|---|---|
| 1 | Cinematic Designer | Issues | All 16 triggers pass; literal cradle, battery, marble carry, forge, cable, CHIME and hero ritual acting remains incomplete. |
| 2 | Game Designer — Player Systems | Pass mandatory keyboard; device issue | Continuous route completes. Fixed opening harness is timing-sensitive; true touch is untested. |
| 3 | Mission Designer — Quest Craft | Pass mandatory; optional issue | Mandatory causal loop works; optional cave acquire/return/consequence/reload needs natural play. |
| 4 | Principal Encounter Designer | Issues | Mandatory mechanics/topology pass; GRAVEHORN art is P1 and device feel is open. |
| 5 | Senior Boss Designer | Pass mechanics; art/cinematic issue | NULLFANG and Alpha stay distinct; hero body ritual and guardian-specific films remain. |
| 6 | Senior Mission Designer — Campaign | Pass mandatory continuous route | Fresh 15:04 run closes recovery blocker; optional Alpha/caves excluded. |
| 7 | Senior Character Artist | Issues | Approved art preserved; GRAVEHORN, bound recovery, Furnace and hero ritual sets remain. |
| 8 | Cinematic Director | Issues | Panel order passes; GRAVEHORN intercuts, four ritual films and three panel edits remain. |
| 9 | Senior VFX Artist II | Pass host contract; device open | Fresh red/purple finite eye system contracts pass; sustained device profiling absent. |
| 10 | Associate Technical Director — World Systems | Pass mandatory; optional/device open | Continuous recovery, graph/cache/terrain and isolated bake pass. |
| 11 | Gameplay Engineer — Combat | Pass browser/source; device open | Stats, held-hit scaling, hit feedback and bounded logging pass; listened mix/haptics absent. |
| 12 | Gameplay Engineer — Mission | Pass mandatory; optional open | Gates/saves/sequence complete; Alpha/optional caves remain staged. |
| 13 | Gameplay Engineer — NPC | Pass | Purified Sage walk/idle and persistence pass; Servo is purposeful/visible. |
| 14 | Lead UI Engineer | Pass host text/layout; P1 device open | Gradual text, RTL/CJK, overlays and rotation pass; opening finite gate and physical touch remain. |
| 15 | Senior Mission Producer | Hold integration/release | Campaign evidence is now strong; P1 production art and device/accessibility gates are not closed. |

Discipline reports: [DESIGN.md](DESIGN.md), [ART.md](ART.md) and
[ENGINEERING.md](ENGINEERING.md).

## Findings register

| ID | Severity | Status | Player consequence / reproduction | Owner and acceptance |
|---|---|---|---|---|
| QA-RECOVERY-24 | P1 evidence | Closed | Previous driver could not execute the CV2 setup jump after a legitimate death. | QA: preserve ordinary-input planner fix and continuous result. |
| OPEN-ORDER-24 | P1 evidence/accessibility | Open | Fixed 240 s staged route ends in A0/A0B before Servo while full campaign proceeds. | UI/QA: semantic event waits, unchanged budget, Servo reached in desktop/phone-size modes, then actual touch. |
| GH-ART | P1 art | Open | Mandatory marble guardian reads far below hero/Alpha/lion quality. | Character/cinematic art: approved full body set and four intercuts at gameplay size. |
| MANHWA-PERF-01 | P1/P2 presentation | Open | Correct panels appear, but key actions lack literal body/prop continuity. | Cinematic/animation: author and certify seven physical beats. |
| DEVICE-24 | P1/P2 evidence | Open | Touch, haptics, controller, thermal/performance and subjective mix are unknown. | QA/UI/audio: physical phone/controller run and sustained profile. |
| RITUAL-FILMS | P2 cinematic | Open | Brood/Atlas/Zero/Prism use fallback presentation. | Cinematic: guardian-specific extraction films with resolved fades. |
| BOUND-ART-01 | P2 art | Open | Bound wolf/cheetah appear tiny and flattened. | Character art: down/breathe/recover strips. |
| FURNACE-ART | P2 art | Open | Six important performance states lack authored poses. | Character art: breath/blast/spent/gather/dive/bell. |
| PURIFY-ART-01 | P2 art | Open | Purifier effect lacks continuous held-sword hero body acting. | Character/VFX: raise/hold/slash/recover with hand/hilt contact. |
| PANEL-CORRECT-23 | P2/P3 art | Open | Red boss eyes, lit inactive Servo and off-model passage hero break continuity. | Art: localized edits only. |
| OPT-QUEST-24 | P2 evidence | Open | Alpha and optional cave rewards are not proven by discovery-to-reload play. | Mission/QA: ordinary-input natural loop evidence. |
| EYE-VFX-24 | Host pass | Device gate open | Finite red/purple hierarchy and clearing behavior pass. | VFX/QA: sustained physical-device frame/memory test. |
| CJK-HOST-24 | Tooling | Closed | Initial isolated wrap failure came from stale browser font path. | QA: declared local fallback; corrected rerun passes without game change. |

## Continuous play versus staged evidence

| Evidence | Result | What it proves / excludes |
|---|---|---|
| October 24 cleared-storage campaign | **Certified 15:04**; easiest; 1 death; 9/9 missions; 16/16 ordered panels; B1; zero errors | One uninterrupted ordinary-keyboard mandatory route. Video off, Alpha excluded, read-only planner. |
| October 24 legitimate-save diagnostic | Remaining route completed in 05:10 | Segmented recovery diagnostic from the game's own save; not a continuous certificate. |
| Targeted normal-browser audit | Product contracts pass except fixed-budget opening; initial CJK host-font miss retained | Staged and contract checks, not a playthrough. |
| Corrected CJK rerun | Pass | Host font setup and UI wrapping; no production change. |
| Isolated software-WebGL bake | Pass in 3.53 s | Unchanged 3D bake assertions under declared software WebGL; not device performance. |
| Full WebGL collector attempt | Incomplete and intentionally aborted after 180 raw log files | Wrapper repeatedly stalled its campaign tutorial; no final collector result or integrity aggregate, so no pass percentage is claimed. |
| Physical phone/controller/listened audio | Not run | No physical touch, haptic, thermal, performance or subjective mix certification. |

The aborted WebGL attempt is not substituted for a full audit result. October
23's completed 198/201 collector remains the latest complete baseline; today's
targeted reruns address its recovery, text and bake uncertainties.

## Mandatory campaign certificate

| Property | Observed |
|---|---|
| Start state | Cleared browser storage |
| Input | Ordinary keyboard events |
| Difficulty | Easiest (0) |
| Wall time | 15:04 |
| Deaths | 1 legitimate Sage-fight death |
| Recovery | Game-owned CV1B respawn; ordinary-input CV2 traversal |
| Missions | opening, servo, first-meeting, marble, forge, sage, chime, lion, teaser |
| Panels | wake, bay, gate, letter, drawer, ratchet, meet, cave, marble, forge, passage, sage, break, chime, free, ch2 |
| Terminal room | B1 |
| Missing/order/page errors | None |
| State/position injection | None |
| Video | Disabled for automation |
| Alpha | Excluded as optional |

## Cave census

| Area | Intended value | Verdict |
|---|---|---|
| A5 | Loose-floor landmark, Magnet riddle, history, quarry mouth | Mandatory and causal |
| A7 | Survey read and once-paid return | Purpose exists; natural return open |
| CV1 | Bound crawler and optional max-core pocket | Distinct; bound art/revisit open |
| CV1B | Survey/map/shortcut/rest/respawn | Useful and exercised |
| CV2 | Deaf System evidence and beacon/lure | Purpose exists; comprehension open |
| CV3 | GRAVEHORN/raw marble/changed return | Mandatory mechanics pass; art P1 |
| GA1 | Refuge/Sage/network rescue | Core payoff passes |
| A11–A13 | Optional currency/traversal/Servo evidence | Natural acquisition open |
| A10/GA2 | Optional Alpha/cache/ledger/Pack Sage | Correctly optional; natural loop open |

## Manhwa parity matrix

| Beat | Runtime status | Remaining acceptance |
|---|---|---|
| Wake/bay/gate | Ordered triggers and gradual text | Literal cradle/lamp reach |
| Letter/drawer/Ratchet | Ordered; repair board playable | Continuous cell/socket installation |
| First guardian meeting | Correct warning before escalation | Preserve agency |
| Cave/marble | Causal route | Finished GRAVEHORN and visible carry |
| Forge | Correctly precedes Sage/lion | Hand/tool/material contact |
| Passage/Sage | Correct threshold; rescued gait passes | \`passage_b\` anatomy edit |
| NULLFANG break | Correct order | Literal cable assistance/catch |
| CHIME | Before lion | Literal casing opening |
| Lion freeing | Hold ritual, film and gold return | Hero body set and purple \`m_down\` eyes |
| B1 teaser | Correct chapter threshold | Preserve gradual spoiler-safe delivery |

## Animation, combat and VFX matrix

| System | Status | Open gate |
|---|---|---|
| Normal/charged hit feel | White flash, dual sound routes, screws/shards, target knockback, hero recoil, shake and hit-stop pass; held damage is stronger | Listened mix/haptics and final balance matrix |
| Character stats/log | HP, power, speed, defense and bounded damage history pass | Cards document values; balance still requires matrix review |
| Hero/Alpha/pack/lion/Talon | Approved; preserved | Physical-device feel |
| Rescued Sage | Authored purified walk/idle pass | Optional visual richness |
| GRAVEHORN | Mechanics pass | P1 body/poses/intercuts |
| Furnace | Base identity present | Six pose set |
| Bound creatures | Live forms read; down forms flatten/tiny | Down/breathe/recover |
| Eye trails | Red ordinary, purple boss/Sage/Alpha, finite/clearing/reduced-motion contracts pass | Sustained device frame/memory |

## Commands and exact outcomes

| Command | Outcome |
|---|---|
| \`npm ci\` | Pass |
| \`npm run build\` | Pass; four pages generated |
| \`node --check tests/campaign-ch1.cjs\` | Pass |
| \`git diff --check\` | Pass |
| Fresh cleared-storage campaign, video off | Pass/certified in 15:04 |
| Targeted normal-wrapper audit | 12/14 recorded entries pass; initial text host-font failure and opening-order fail retained |
| Corrected-font isolated \`textreveal\` | Pass |
| Software-WebGL isolated \`bake3d\` | Pass in 3.53 s |
| Full software-WebGL audit attempt | Incomplete/aborted; no aggregate verdict claimed |

## Five-state handoff

| State | Truth on this branch |
|---|---|
| Implemented | Evidence-driver directional jump recovery only; cumulative earlier Sage/review fixes preserved. |
| Tested | Build, syntax, fresh certified campaign, targeted contract checks, corrected text and isolated bake. |
| Visually inspected | Repair, forge, rescued Sage, golden lion and GRAVEHORN comparison at gameplay scale. |
| Integrated | No. |
| Deployed | No deployment attempted. |

The single copyable Claude handoff is [CLAUDE_PROMPT.md](CLAUDE_PROMPT.md).
