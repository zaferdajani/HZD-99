# CLAWBYTE senior studio review — 2026-10-14

## Decision

**The review branch improves Chapter One, but it is not release-certified.** Main and the integration branch advanced to `14bef4baba6b12d78b7ba2e41c221e8b95b9f938` with two owner-directed traversal fixes: seamless shaft landings are player-steered, and terrain smoothing no longer creates elevated loops across cliffs. Those changes are preserved.

The October 13 review corrections had not been integrated. They were selectively reapplied over the new traversal code, then extended so Alpha-tamed wolves and staged meeting actors cannot become grapple anchors. The campaign certificate now fails closed unless all 16 essential story scenes occur in order without misses, page errors, segmentation or a developer stop. The A2 quarry hatch waits for the first NULLFANG meeting, the A3 NULLFANG break panel can play, grapple first-use text follows the active device, and the collector uses each harness's declared budget and cleans descendant processes.

All four game pages build as `BUILD_ID 07f3967fe8dc`. A byte-pinned static gate passed 28 results: build, two served-identity checks and 25 selected non-browser harnesses. The full collector completed all 188 requested results: 29 passed and 159 browser-backed checks failed at launch because this worker had no Chromium and Playwright repeatedly downloaded a zero-byte archive. These are **blocked runtime evidence**, not 159 demonstrated gameplay failures and not passes. No uninterrupted real-input campaign, physical-touch run, listened audio, felt haptics, production merge or deployment occurred.

The art review directly re-inspected four current 1600×893 panels and 844×390 source renders. The Ratchet replacement remains the correct direction. NULLFANG's panel eyes are still red, inactive Servo still appears powered, and `passage_b` still stretches HZD-99's limbs. A generated purple-eye candidate corrected the colour but also re-rendered the full frame and changed its dimensions, so it remains review-only and is **not** production art. The queue was corrected instead: Alpha is marked complete, and FURNACE now explicitly receives purple boss-eye emission at runtime rather than red baked into new plates.

## Versions and evidence

| Item | Version / status |
|---|---|
| Frozen `main` | `14bef4baba6b12d78b7ba2e41c221e8b95b9f938` |
| Frozen integration | `claude/clawbyte-repo-migration-byhyl8` at the same `14bef4b` |
| Review branch | `codex/studio-review-2026-10-14` |
| Local implementation commit | `ea9f710` |
| Published source/evidence commit | `5d1b6101b4f8ff6458a078673864d744d114ca45` |
| Built game | Four HTML files, `BUILD_ID 07f3967fe8dc` |
| Previous review | `codex/studio-review-2026-10-13`; reconciled finding by finding, never wholesale-merged |
| Production | Not merged, deployed or live-verified |

Evidence labels used below: **source** is current implementation inspection; **contract** is an executable non-browser assertion; **staged** deliberately prepares state/position for one feature; **campaign** is a cleared-storage normal-input chapter run; **visual-source** is direct asset inspection; **visual-gameplay** is a rendered game frame. This run has source, contract and visual-source evidence. Browser staged, campaign and visual-gameplay evidence is blocked.

Six grouped specialist agents covered current design, art and engineering plus independent prior-report reconciliation. The producer records a distinct verdict for every one of the 15 responsibilities; these are responsibilities, not claims of 15 human employees.

## Fifteen role verdicts

| Senior responsibility | Verdict | Evidence / limit |
|---|---|---|
| Cinematic Designer | **Improved; runtime blocked** | A3 is now eligible for the owed NULLFANG break sequence; current arrival/event architecture and B1 teaser are preserved. Live timing did not run. |
| Game Designer — Player Systems | **Improved; device blocked** | Player-directed shaft landing is preserved and grapple guidance now resolves keyboard, touch, bound pad or Controls route. Physical device feel is unverified. |
| Mission Designer — Quest Craft | **Source pass; journey blocked** | Battery repair, spare Servo cell, Volt Pack purchase, raw-marble forge and optional Alpha retain distinct motivations and rewards. |
| Principal Encounter Designer | **Improved; traversal blocked** | The quarry hatch now physically waits for `nfMeet`; the new cliff/shaft behavior requires ordinary-input traversal before TER-1 can be judged. |
| Boss Designer | **Issues** | NULLFANG and Alpha retain distinct mechanics and optionality. GRAVEHORN authored art/manhwa coverage and a cross-boss checkpoint policy remain open. |
| Mission Designer — Campaign | **Contract pass; campaign blocked** | Certification requires the 16 scenes in order, no misses/errors and a full run. No current-build campaign could launch. |
| Mission Producer | **Pass for review delivery** | Latest refs pinned, prior fixes reconciled, completed assets protected, bounded branch only, blockers explicit. |
| Character Artist | **Issues** | Ratchet replacement and completed Alpha/lion sets are preserved. Three directly observed panel inconsistencies and two authored-boss production gaps remain. |
| Cinematic Director | **Issues** | Current wake film and sequence improve identity; Servo state, passage anatomy and four absent GRAVEHORN beats remain. |
| VFX Artist | **Source pass; visual runtime blocked** | Finite red ordinary/purple boss trail code and cleanup remain. Static NULLFANG panel colour and GRAVEHORN pose anchors are not compliant. |
| Technical Director — World Systems | **Improved; runtime blocked** | Latest manual shaft steering/cliff splitting is preserved; audit budgets and descendant cleanup are restored and unit-tested. |
| Gameplay Engineer — Combat | **Contract pass; browser blocked** | Grapple rejects 11 protected states, pets, globally tamed wolves and mid-reel cures; zero-return interactions do not add duplicate reward/FX. Live geometry is blocked. |
| Gameplay Engineer — Mission | **Improved; browser blocked** | Quarry order, alternate-room panel and fail-closed campaign evidence are repaired without replacing the latest campaign steering. |
| Gameplay Engineer — NPC | **Improved; motion capture blocked** | Grapple cannot latch rescued/cured/tamed machines. Source still drives purified lion movement with distance gait, but no fresh moving footage exists. |
| Lead UI Engineer | **Improved; physical-device blocked** | Dynamic grapple hint and existing grapheme/Arabic progressive reveal remain. Touch, RTL and actual controller remap need device evidence. |

## Findings and disposition

| ID | Severity | Player consequence / reproduction | Evidence | Owner / paths | Status and acceptance |
|---|---|---|---|---|---|
| STORY-1 | P1 | Breaking the A2 quarry hatch before meeting NULLFANG reorders Chapter One. | Source + contract fixture | Mission/World; `js/game.js`, `tests/secrettell.cjs` | **Fixed in source.** Only A2 columns 12–14, rows 15–16 wait for `nfMeet`; ordinary knock remains. Browser acceptance blocked. |
| QA-09 | P1 | The campaign previously exited zero despite missing/late panels, page errors or partial diagnostic runs. | Contract | Producer/Mission; `tests/campaign-ch1.cjs`, `campaign-contract.cjs` | **Fixed and contract-tested.** A clean 16-scene route is the only certificate. |
| QA-05 | P1 | The collector could kill long harnesses at 360 seconds and leave browser descendants. | Four unit tests | World/Producer; `tools/studio/audit.py`, `test_audit.py` | **Fixed/tested.** Runner metadata +180 seconds; owned process group is terminated on timeout. |
| COMBAT-4 | P1 | Grapple could select rescued, friendly, disabled or staged story bodies and farm movement/charge. | Source + contract | Combat/NPC; `js/grapple.js`, grapple tests | **Fixed at target boundary.** Eligibility is rechecked during reel. Browser motion blocked. |
| COMBAT-5 | P1 | Alpha's global pack flag does not set per-wolf `friendly`, so tamed wolves remained selectable. | Source + contract | Combat/NPC; `js/grapple.js`, `wolves.js` | **Fixed.** `isWolf(e) && packTamed()` is rejected; source contract passes. |
| CIN-4 | P2 | `break.alsoRoom='A3'` existed but the selector skipped alternate rooms. | Source | Cinematic/Mission; `js/panels.js`, `tests/panels.cjs` | **Fixed in source.** A2 and A3 cases are staged in the browser harness; launch blocked. |
| UX-05 | P2 | First-use grapple message always said U, misleading touch/remapped/unbound pads. | Source + contract | Player/UI; `js/grapple.js`, `i18n.js`, `theme.js` | **Fixed in source.** No unresolved token across five languages/themes; physical device blocked. |
| QA-07 | P2 | Room-cache staging omitted `nfMeet`, allowing story UI to contaminate crossing timing. | Source | World/Producer; `tests/roomcache.cjs` | **Fixed fixture** with milestone and diagnostics; live cache check blocked. |
| ARTQ-2 | P2 | FURNACE brief asked for red eyes while boss VFX requires purple and forbids baked emission. | Source | Art/VFX; `docs/ART_QUEUE.md` | **Fixed instruction.** Preserve eye geometry; runtime supplies purple light/trail. |
| ARTQ-3 | P3 | Queue still called Alpha “the old animal,” inviting wasteful regeneration of completed strips. | Source | Producer/Character; `docs/ART_QUEUE.md` | **Fixed instruction.** Ten landed Alpha strips are named and protected. |
| ART-5 | P2 | `m_down.webp` gives infected boss NULLFANG red eyes. | Visual-source | Character/VFX | **Open production correction.** Generated purple-eye candidate is directionally right but full-frame variance prevents integration. Perform a true localized edit and owner compare. |
| ART-6 | P2 | `r_cell.webp` says Servo is switched off while his amber eyes/cyan chest are lit. | Visual-source | Character/Cinematic | **Open targeted correction.** Darken Servo indicators only; preserve hero/Ratchet. |
| ART-4 | P3 | `passage_b.webp` gives HZD-99 long rear-view arms, legs and hand-like fingers. | Visual-source | Character | **Open targeted anatomy correction.** Preserve tunnel, sword and camera. |
| ART-7 | P3 | `r_marble.webp` uses a bright sword diagram above raw marble. | Visual-source | Cinematic | **Review, not a proven violation.** Hero remains unarmed; keep the sword unmistakably future/diagrammatic. |
| GH-ART | P1 art gate | GRAVEHORN remains procedural and lacks 14 plates plus `gh_intro_a`, `gh_intro_b`, `gh_phase2`, `gh_down`. | Source | Character/Cinematic/Boss | **Open.** Fulfil the existing queue once; verify feet, facings, horn states, tells, transition and purple anchors. |
| FURNACE-ART | P2 | Six mechanics still transform older idle/fly/hero art rather than authored poses. | Source | Character/Boss | **Open.** Produce only the six queued poses under corrected purple-runtime rule. |
| TER-1 | P2 | Earlier missed-jump evidence may no longer describe A2 after manual shaft steering and cliff correction. | Historical + source | Encounter/World | **Unverified, do not patch yet.** Reproduce on current build with ordinary input. |
| BOSS-1 | P3 | Checkpoint/death behavior lacks one explicit cross-boss rule. | Source | Boss/Combat | **Open policy.** Define and test without revoking earned rescues. |
| HERO-1 | P3 | NOSTOS A7 `terminal20` can inherit robot-world wording. | Source | Mission/UI | **Open localized wording.** Preserve read-based reward semantics. |

## Implemented, tested, inspected, integrated, deployed

| Layer | Status |
|---|---|
| Implemented on review branch | Quarry gate; strict campaign certificate; alternate-room panel; grapple hostility/ally rules; device-aware prompt; collector timeouts/cleanup; room-cache fixture; FURNACE/Alpha queue corrections. |
| Tested | Syntax, build/package/integrity, four collector unit tests, campaign negative contract, grapple safety contract, 25 selected static harnesses, byte identity. |
| Browser staged tests | **Blocked by missing Chromium; not passed.** |
| Uninterrupted real-input campaign | **Blocked at browser launch; not run.** Earlier campaigns cannot certify this build. |
| Visually inspected | Four current source panels and 844×390 source renders; one generated candidate compared. Not live gameplay frames. |
| Integrated into main/integration | **No.** |
| Deployed live | **No.** |

## Chapter One route and cave census

Intended current route remains: wake → movement/jump → gate → Ratchet letter/drawer/repair film → Volt Pack/pod → Servo → NULLFANG meeting → quarry → GRAVEHORN → raw marble → forge → maintenance passage → first Sage → CHIME → NULLFANG cleanse → B1 teaser. Alpha remains an optional post-forge detour and is not a lion prerequisite.

| Location | Meaningful outcome | Current assessment |
|---|---|---|
| A5 | Magnet puzzle and quarry entrance | Distinct purpose; live traversal blocked. |
| A7 | Survey terminal starts/completes raw-marble direction | Source/contract retained; NOSTOS wording open. |
| CV1 | Spare core and orientation | Distinct reward; no current live frame. |
| CV1B | Pod save/recharge, chart and shortcut | Distinct utility; live route blocked. |
| CV2 | Deaf System beacon/lore | Distinct story/navigation role. |
| CV3 | GRAVEHORN, raw marble and later Sage return | Strong purpose; weakest authored boss/panel coverage. |
| GA1T | Maintenance passage and Sage junction | Mandatory causal connector; panel timing blocked. |
| GA1 / GA1D | Rest route, first Sage cleanse and CHIME revelation | Mandatory story payoff. |
| A11 | Coin cache | Small optional payoff. |
| A12 | Dash-gated Star Fragment | Ability-gated revisit. |
| A13 | Servo watch log and coin | NPC-specific discovery. |
| Alpha den | Optional wolf history, pack friendship and supply cache | Correctly after forge and outside lion prerequisites. |

This is source/contract evidence, not a claim that every cave was walked today.

## Manhwa parity matrix

| Beat | Current delivery | Verdict |
|---|---|---|
| wake/bay/gate | Current pages at wake/door transitions | Source present; runtime blocked. |
| letter/drawer | Manual letter then drawer page | Source order correct; runtime blocked. |
| Ratchet wake | Dedicated film, then `r_cell`/`r_marble` | Old identity defect remains closed; Servo state needs correction. |
| meet | p14 crops plus conditional `m_down` | Source present; boss-eye colour wrong. |
| cave/marble/forge | Cave arrival, raw material and forge pages | Source causal order intact; campaign blocked. |
| passage/Sage/break/CHIME/free | Current story pages | A3 selector fixed; live delivery blocked. |
| Chapter Two teaser | B1 crossing only | Intentional current placement preserved. |
| GRAVEHORN | Four named story beats required | **Missing art and wiring.** |

## Animation and VFX matrix

| Actor/effect | Present | Remaining evidence/work |
|---|---|---|
| Hero | Authored multi-pose art and current equipment states | No fresh live transition/device feel. |
| Ordinary infected | Red eye anchors and finite runtime smoke | Browser roster/pose capture blocked. |
| Boss infected | Purple runtime classification | Static NULLFANG page is red; GRAVEHORN anchors absent. |
| Alpha/pack | Ten Alpha strips, twelve pack strips, wolf-specific mechanics | Preserve; do not regenerate. Continuous weight still needs current footage. |
| NULLFANG | 30-frame strip, attacks and distance-based rescued gait | Preserve; no current audio/haptic/motion capture. |
| GRAVEHORN | Distinct procedural mechanics/phase logic | Highest authored-enemy-art priority: 14 plates + four story beats. |
| FURNACE | Bespoke mechanics using transformed atlas states | Six queued authored poses; corrected purple-runtime brief. |
| Eye smoke | 1.125–1.875 s life, 90/170/260/320 caps, motion hold, teleport and cure/death/despawn cleanup | No current trail capture or low-tier performance result. |

## Performance and device gaps

- Playwright Chromium provisioning returned `0 MiB` non-ZIP archives on all retries; every browser-backed result failed at launch.
- `opening-order` phone mode is a mobile viewport driven by keyboard, not physical-touch certification even when it runs.
- No physical phone/native package, controller remap, listened mix, felt vibration, reduced-motion device, default-difficulty human run or owner art approval.
- Direct panel renders prove source composition only; they do not prove in-game crop, overlay queue, colour management or caption timing.
- Latest shaft and surface changes have staged source tests but no current rendered gameplay or continuous route evidence.

## Patch list

- `js/game.js`, `tests/secrettell.cjs`: narrow A2 pre-`nfMeet` hatch guard.
- `js/panels.js`, `tests/panels.cjs`: ordinary `alsoRoom` eligibility and A3 break case.
- `js/grapple.js`, `js/i18n.js`, `js/theme.js`, grapple tests: protected/global-pack target predicate, mid-reel release, zero-return secondary-effect guard and device-aware guidance.
- `tests/campaign-ch1.cjs`, `campaign-contract.cjs`, `tests/run.cjs`: 16-beat fail-closed certificate while preserving current ledge steering.
- `tools/studio/audit.py`, `test_audit.py`: runner-derived budgets, campaign artifacts, environment cleanup and descendant termination.
- `tests/roomcache.cjs`: coherent post-meeting fixture and crossing diagnostics.
- `docs/ART_QUEUE.md`: boss-purple runtime rule for FURNACE and completed Alpha protection.
- Four HTML outputs rebuilt locally. Integrator must rebuild after merging rather than hand-merging generated pages.

Exact commands and evidence limitations are in `VALIDATION.md`. The only integration handoff is `CLAUDE_PROMPT.md`.
