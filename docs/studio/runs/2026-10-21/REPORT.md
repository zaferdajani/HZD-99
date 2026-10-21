# CLAWBYTE senior studio review — 2026-10-21

## Executive decision

**Review branch only. Do not merge or deploy yet.**

The strongest result is new: a single cleared-save, ordinary-keyboard chapter-one run completed the intended causal route through B1 in **16:39**, with every required mission and all 16 manhwa beats recorded. This closes yesterday's campaign-driver starvation diagnosis, but it is not a flawless release certificate: the route used easiest difficulty and a read-only planner, recorded **two deaths** and several navigation recovery frames, skipped optional Alpha, and did not certify physical touch, controllers, haptics, listened audio or device performance.

Today's bounded changes also correct Ratchet's misleading powered-down interaction label and harden the purification touch fixture without changing gameplay thresholds. The full collector attempted all 196 registered harnesses, plus build, pack and two HTTP identity gates: **195/200 entries passed and 5 failed**. Four short failures were traced to the review browser accidentally loading an unrelated Fontconfig file; after correcting the wrapper, all four passed. `opening-order` still failed under its unchanged finite budgets. The frozen full collector remains red and its raw-log integrity remains red; follow-up passes do not overwrite it.

The principal art gates remain: an authored GRAVEHORN set and four panels, true bound-creature down/recovery art, six Furnace poses, an authored hero purification body sequence, four non-lion ritual films and three localized panel corrections. Existing approved hero, pack/Alpha, crystal, sword, lion and Talon assets were not regenerated.

## Repository and publication state

| Item | Value |
|---|---|
| Review branch | `codex/studio-review-2026-10-21` |
| Review base before today's commit | `04076250b29c4cb7cdcbd8d91e32ddbe0b54626e` |
| Production `main` at final pre-push check | `62d75d204c6f6264f25150bb419fc262ff2c18ea` |
| Integration branch at final pre-push check | `62d75d204c6f6264f25150bb419fc262ff2c18ea` |
| Production/integration changed during review | No |
| Merged | No |
| Deployed | No |
| New/generated art | None |
| Preserved unrelated clone-time files | Three temporary dot-files under music/hero/terrain; not staged or deleted |

The branch deliberately starts from October 20's cumulative review commit, preserving the October 17–20 review work. Those changes are still not present on `main` or the integration branch.

## What changed today

### 1. Powered-down Ratchet now names the real action

Before, the tutorial said “Read the letter” or restore the battery while the world marker said “Talk.” `opNearLabel()` now uses already-localized keys and the current interact binding:

- no own battery: Read the letter;
- Ratchet cell carried: Restore his battery;
- Ratchet alive: ordinary Talk/shop behavior;
- Old Servo behavior remains separate and unchanged.

`story-battery` now asserts all three Ratchet states and the distinct Servo cell path.

### 2. Purification touch test waits for real layout readiness

The fixture now waits until `TOUCH.rawW/rawH` matches the visual viewport after portrait/landscape changes, redraws with production code, checks that the actual 48px button is fully inside 844×390 and verifies `elementFromPoint()` before dispatching the same CDP touch event. It preserves the real `>0.4` hold sample, 1.6-second completion threshold, cancel, blur, hidden-clock and save/reload assertions. Three consecutive targeted runs and the frozen collector passed.

### 3. Campaign evidence driver escapes unchanged unreachable threats

The driver records player/enemy movement and enemy HP. Five seconds with no position/damage progress causes a bounded 12-second route-input interval for only that enemy kind in that room. No game state, AI, terrain, physics, HP, defense, damage, flags or inventory is edited. This allowed the fresh route to cross CV1B, obtain raw marble and finish the chapter.

### 4. Review browser uses the intended font configuration

The wrapper had pointed `FONTCONFIG_PATH` at `/tmp/clawbyte-21-browser`, whose package-supplied `fonts.conf` references unrelated nonexistent deployment paths. Canvas font metrics were therefore zero: `measureText('hello world') === 0`, producing empty text plates and false pagination/Forge/comic/scale results. The wrapper now explicitly selects the checked-in per-run `fonts.conf`; the same measurement becomes `90px`.

This is a review-environment correction, not game code. The invalid-font full collector is retained exactly; only separately identified postflight diagnostics use the correction.

## Fifteen senior-role verdicts

These are fifteen independent review responsibilities, grouped among senior review agents and the producer. “Issues” means at least one acceptance gate remains; it is not a claim that the whole discipline failed.

| # | Senior responsibility | Verdict | Primary reason |
|---:|---|---|---|
| 1 | Cinematic Designer | Issues | Correct event order; GRAVEHORN intercuts and literal manhwa actions remain absent. |
| 2 | Game Designer — Player Systems | Issues | Causal tutorial source is strong; long desktop/phone opening still fails finite completion. |
| 3 | Mission Designer — Quest Craft | Issues | Caves have named source purposes; several optional discoveries lack fresh natural play evidence. |
| 4 | Principal Encounter Designer | Issues | Full route completes, but two deaths/recovery events and unplayed optional encounters remain. |
| 5 | Senior Boss Designer | Issues | Alpha is correctly optional/wolf-specific; authored ritual/down performances remain incomplete. |
| 6 | Mission Designer — Campaign | Issues | Mandatory route reaches B1; Alpha and all optional caves are not certified. |
| 7 | Character Artist | Issues | GRAVEHORN, bound-down, Furnace and purification body art remain incomplete. |
| 8 | Cinematic Director | Issues | Lion film exists; four equivalent principal ritual films and exact action parity remain open. |
| 9 | VFX Artist | Issues; bounded eye system accepted | Red/purple finite lifecycle passes; device and whole-roster temporal polish remain open. |
| 10 | Technical Director — World Systems | Issues | Mandatory route is viable; evidence retention and optional/device scope remain open. |
| 11 | Gameplay Engineer — Combat | Issues | Impact/purification contracts pass; physical-device feedback and authored ritual motion remain open. |
| 12 | Gameplay Engineer — Mission | Issues | Chapter route passes; opening-order and optional Alpha do not. |
| 13 | Gameplay Engineer — NPC | Issues | Ratchet label corrected; rescued-Sage slide report still lacks targeted reproduction. |
| 14 | Lead UI Engineer | Issues | Text/RTL/CJK pass after host fix; physical touch and phone tutorial completion remain open. |
| 15 | Senior Mission Producer | Issues / hold integration | Evidence is substantially better, but failed opening and integrity/art gates prevent release approval. |

Full discipline reports: [DESIGN.md](DESIGN.md), [ART.md](ART.md), [ENGINEERING.md](ENGINEERING.md).

## Story and tutorial verdict

The implemented mandatory story now follows the owner's canon in source and in one complete continuous route:

1. the Mother song maintains robot harmony;
2. an unknown entity infects its frequency;
3. the already-sleeping hero misses the broadcast and is not innately immune;
4. an electrical short wakes the forgotten hero;
5. Ratchet's letter explains his marble pendant and removed own battery;
6. the hero finds and installs that unique battery through the board puzzle;
7. Ratchet gives a distinct Servo spare, points to the pod and funds/explains the permanent Volt Pack;
8. the forward monument and Old Servo lead toward the quarry;
9. GRAVEHORN guards raw marble;
10. Ratchet forges the first white purification sword;
11. Meadow Sage is rescued rather than killed;
12. CHIME is silenced, then NULLFANG is purified;
13. the friendly golden lion and B1 teaser close chapter one.

The continuous run recorded missions `opening, servo, first-meeting, marble, forge, sage, chime, lion, teaser` and panels `wake, bay, gate, letter, drawer, ratchet, meet, cave, marble, forge, passage, sage, break, chime, free, ch2` with no missing or order errors.

## Continuous playthrough versus staged checks

### Continuous real-input chapter run

Evidence: `automated/campaign-ch1/`.

| Property | Result |
|---|---|
| Input | Ordinary keyboard events |
| Save | Cleared/new save |
| Difficulty | 0 / easiest |
| Progress mutations | None: no inventory, flag, teleport, invulnerability or staged victory |
| Internal assistance | Read-only map/state planner |
| Result | Complete; campaign contract certified |
| Wall time | 16:39 |
| Deaths | 2 |
| Required missions | 9/9 |
| Required panels | 16/16, correct order |
| End | B1 / chapter-two teaser |
| Video | Disabled; selected frames and full input/state log only |
| Audio/cinematics | Not listened through as a film-quality review; Enter may advance skippable states |
| Optional Alpha | Not played |

The route visibly used the repair board, shop, monument, Servo, caves, GRAVEHORN, forge, Sage, CHIME, lion and B1. Recovery frames are retained, not cropped from the record.

### Focused marble run

The earlier `campaign-focus-marble-3/` diagnostic also crossed CV1B and defeated GRAVEHORN to obtain raw marble in 06:49 with zero deaths. It intentionally stopped at the marble milestone and is not a chapter certificate. Two earlier attempts ended immediately on a dead localhost server and are infrastructure failures, not game results.

### Staged evidence

- `opening-order` creates a fresh save and uses real keyboard input in desktop and phone-sized viewports, but it is a bounded tutorial harness, not a continuous chapter or physical-touch test. Its coil hand-in is injected.
- Purification, impact, cave and boss harnesses generally stage rooms/saves to isolate one contract.
- Browser touch emulation and CDP events do not certify a physical phone, haptic motor, controller or native package.

## Automated evidence

### Frozen full collector

Evidence: `automated/results.json`, `automated/AUTOMATED.md`.

- start/end served-build identities: pass;
- build and package: pass;
- registered harnesses: 196, all attempted;
- total entries including build/pack/two identity gates: 200;
- passed: 195;
- failed: 5;
- collector exit: 1;
- campaign contract: pass/certified;
- raw-log integrity: fail closed.

Original failures:

| Check | Frozen result | Diagnosis / postflight |
|---|---|---|
| `comic-rewards` | Fail: updated heading remained hidden | Zero canvas font metrics distorted reader state; corrected-font rerun passes. |
| `textreveal` | Fail: dialogue closed, null `pg` | `measureText()` returned zero, so the long paragraph became one line/page; corrected rerun passes 13 groups including CJK/Arabic. |
| `foescale` | Fail: four samples at 1.0× using 68px hurt hero | Corrected rerun sampled 71px idle hero and passes; nondeterministic reference frame remains a real test flaw and historical 73px bank issue remains open. |
| `opening-order` | Fail: desktop ended A0B, phone A0 | Corrected-font rerun also fails: desktop stops after pack handoff; phone reaches monument/`go` but not Servo. Keep open. |
| `forge` | Fail waiting for PLAY | Corrected font metrics let the opening CUT complete; rerun passes all editor/gate/operation checks. |

Corrected-font postflight short set: **4/4 passed** (`comic-rewards`, `textreveal`, `foescale`, `forge`). Corrected-font `opening-order`: **failed** after 482.6 seconds under unchanged finite budgets, zero page errors.

### Evidence integrity

All 198 captured byte snapshots validate against their recorded hashes. Only 195 current raw files still match; the three divergences are:

- `servo-presence.log`;
- `mapexits.log`;
- `kingdom1.log`.

This is detected correctly, so the aggregate is red. The cause is not known. Do not replace the raw files, re-hash the old result or present the corrected postflight as if it were the original full collector.

## Opening tutorial findings

### Closed today: `NPC-LETTER-LABEL-20`

Source and targeted assembly test now agree on Read letter → Restore battery → Talk. Fresh visual proof across all languages/input devices remains separate; no new art was required.

### Open: `QA-OPENING-PHONE-20` / P2

In the corrected-font rerun:

- desktop reached move → exit → jump → gate → booth → letter → drawer → repair → pod → pack, then exhausted its budget before purchase/heal/monument/Servo;
- phone keyboard emulation reached move → exit → jump → gate → booth → letter → drawer → repair → pod → pack → heal → attack → Burst → monument → go, then ended in A0 before Servo;
- all reached prompts named one real control;
- Ratchet's letter preceded his own battery;
- the unique Ratchet cell and separate Servo spare were correctly named;
- the explanation named song, marble, battery, sleep, raw marble and white sword;
- no page errors occurred.

Acceptance: add timestamped milestone, key/touch down-up, charge/release, volts, winch and transition state tracing; reproduce within a finite budget; then perform a separate physical-touch run. Do not merely increase timeout or count unreached Servo checks as product failures.

## Cave and side-quest findings

| Area | Meaningful content | Current verdict |
|---|---|---|
| A5 | Loose floor, Magnet riddle, maintenance history, quarry mouth | Mandatory route played. |
| A7 | Survey terminal read, remembered once-paid reward | Source/staged evidence; fresh natural return not played. |
| CV1 | Bound crawler and climb-pocket max-core chest | Route played; optional chest/revisit not fully certified. |
| CV1B | Survey pod, map/chart, shortcut/rest | Used in continuous route. |
| CV2 | Deaf System evidence and beacon/lure | Traversed; comprehension is not measured. |
| CV3 | GRAVEHORN, raw marble, changed forged return | Fully exercised on mandatory route. |
| GA1 | Refuge, rest and Sage/network rescue | Sage route exercised. |
| A11–A13 | Coins, later traversal reward, Servo evidence | Optional natural acquisition unplayed. |
| A10/GA2 | Alpha, friendly pack, cache, ledger, Pack Sage | Correctly optional in source; full route unplayed. |

Alpha must remain a post-forge optional Lost Wardens story, never a marble or lion prerequisite. Acceptance is offer → den → wolf-specific fight → rescue → persistent friendly pack → rewards/cache/ledger → save/reload.

## Art, motion, cinematic and VFX findings

### Gameplay-size inspection

Fresh campaign frames show:

- repair-board art is detailed and readable;
- the hero, cave effects and purified lion are visually stronger than several enemy/world actors;
- the golden friendly lion appears grounded and distinct after purification;
- the software-rendered frozen audit has empty text plates because of the invalid font environment and cannot certify text layout;
- corrected-font targeted checks prove text metrics and reveal logic but were not a replacement full visual capture.

### Open production art

1. `GH-ART` / P1: authored articulated GRAVEHORN body/poses and four matching story panels.
2. `BOUND-ART-01` / P2: real wolf/cheetah down, breath and recovery rather than flattened crouch.
3. `FURNACE-ART` / P2: breath, blast, spent, gather, dive and bell poses.
4. `PURIFY-ART-01` / P2: hero raise/hold/slash/recover with continuous hand/hilt contact.
5. `SAGE-RESCUE-MOTION-21` / P2: targeted clean-route reproduction of the reported sleeping-slide before changing an unidentified actor.
6. `ART-5` / P2: purple, not red, NULLFANG eyes in `m_down.webp`.
7. `ART-6` / P2: inactive Servo indicators dark in `r_cell.webp`.
8. `ART-4` / P3: correct hero limb/paw anatomy in `passage_b.webp`.

### Purification films

Preserve the completed lion ritual and its resolved fade. Equivalent new boss-to-blade extraction ritual films remain absent for Brood, Atlas, Zero and Prism. Older generic `purify_*` clips are not substitutes. No fresh listened-audio ending review occurred today.

### Infection eye trails

`infection-eyes`, `infection-roster` and `infection-poses` pass. Ordinary infected creatures are red; bosses/Sages/Alpha are purple; friendly/cured/dead/removed actors stop emitting. Particles originate at current-frame eye anchors, are world-locked, stop when motion stops, clear on cure/room change/removal, live at most 1.875 seconds and are capped by tier. Reduced motion suppresses smoke while keeping the glow. Physical-device sustained memory/frame-time and all-pose temporal polish are not certified.

## Manhwa parity matrix

| Beat | Runtime status | Remaining parity gate |
|---|---|---|
| Wake/bay/gate | Triggered and seen | Exact cradle reach/body performance. |
| Letter/drawer/Ratchet | Triggered and seen | Literal socket installation action beyond panel/board abstraction. |
| First guardian meeting | Triggered and seen | Preserve earned warning and player agency. |
| Cave/marble | Triggered and seen | GRAVEHORN authored intercuts/body art. |
| Forge | Triggered and seen | Carrying/manufacture contact and continuous tool/hand action. |
| Passage | Triggered and seen | Correct hero anatomy in panel. |
| Sage | Triggered and seen | Authored rescued walk/recovery; no sliding/sleep pose. |
| NULLFANG break | Triggered and seen | Exact cable help/catch action. |
| CHIME | Triggered and seen | Literal casing opening/action correspondence. |
| Lion freeing | Triggered and seen | Authored hero ritual body sequence; panel boss-eye hue correction. |
| B1 teaser | Triggered and seen | Preserve chapter threshold timing and readable gradual text. |

## Acceptance order for the next integrator

1. Preserve today's original collector, corrected diagnostics and all prior review evidence.
2. Integrate the bounded Ratchet label, purification fixture, campaign driver and review-font wrapper without reimplementing them.
3. Diagnose `opening-order` with tracing; do not increase its budget blindly.
4. Fix evidence-log lifecycle and prove all raw logs equal their captured snapshots.
5. Make flier scale reference-frame sampling deterministic and cover actual banked cruise.
6. Complete/approve GRAVEHORN before polishing lower-priority panel defects.
7. Reproduce the owner-reported rescued-Sage slide before changing the actor.
8. Apply only localized approved edits to the three named manhwa panels.
9. Produce the missing authored motion/ritual assets through the existing approval pipeline; do not regenerate completed assets.
10. Run one final merged-snapshot full collector, a cleared-save continuous route, and separate physical-device touch/controller/haptics/audio/performance checks.

## Five-state handoff

| State | Truth on this branch |
|---|---|
| Implemented | Ratchet contextual label; touch-fixture readiness; bounded campaign-driver recovery; review font config fix. |
| Tested | Build/pack pass; continuous chapter campaign pass; frozen full collector 195/200 red; corrected short diagnostics 4/4 pass; corrected opening-order fail. |
| Visually inspected | Repair board, marble/Sage/lion gameplay frames, three named manhwa panels and prior flier evidence; software renderer limits disclosed. |
| Integrated | No—`main` and integration branch remain at `62d75d2`. |
| Deployed | No production deployment attempted. |

The single implementation handoff is [CLAUDE_PROMPT.md](CLAUDE_PROMPT.md).
