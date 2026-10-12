# CLAWBYTE senior studio review — 2026-10-12

## Decision

**Chapter One is functionally much stronger, but the production gate is not green.** The final clean automated campaign reaches the Chapter Two teaser in 19:27 with two ordinary deaths, all 16 required story sequences in canonical order, zero page errors and fail-closed certification. The review closes concrete progression/evidence defects: the quarry can no longer be entered before the NULLFANG meeting; the service-bay, city-gate, maintenance-passage and CHIME pages own the boundary after their event and cannot be outrun; protected creatures cannot be grappled for charge; and the audit can no longer certify partial/error-bearing campaigns or abandon child browser processes.

Artwork is still below the requested studio bar in three specific places. The first Ratchet repair image changes the hero into a bare-faced cream cat; `m_down.webp` gives a boss red rather than purple eyes; and GRAVEHORN is a procedural fourteen-part stand-in with no authored character plates or four required manhwa beats. FURNACE has authored mechanics but still reuses and transforms its existing atlas instead of having the six queued poses. These are targeted gaps: the 25 recent Chapter One redraws, ten Alpha strips, 30-frame lion strip, repair components and finite infection-eye system already exist and must not be regenerated wholesale.

No production merge or deployment was performed. Only `codex/studio-review-2026-10-12` is prepared for integration.

## Versions and evidence boundary

| Item | Version / status |
|---|---|
| Audited `main` | `1bf250f0c7e758e7ea907d1adbba9504adeba21f` |
| Audited integration branch | `0850da1e29b48ec6f5eaeb81da9bc1e30e523107` |
| Remote at publish check | `main` and integration advanced to `abbeb97cb2fbed628a9e3927537fec6ea8e14626`; not silently rebased into the frozen audit |
| Review branch | `codex/studio-review-2026-10-12` |
| Bounded source-fix commit | `e9f50af3d2f6c91c834287603cdb49a8495d850a` |
| Built game | `BUILD_ID 32a3376e3537`; all four HTML outputs rebuilt |
| Live production | Not inspected or changed; no deployment claim |
| Previous review | `ba5f6dd28b8b1ebf4e92218d2417e2dd9231b876`; divergent from current main, compared selectively rather than merged |

Evidence labels used below: **source** means implementation inspection; **staged** means a test intentionally set a save, room, pose or fixture; **campaign** means the cleared-storage, title-menu, keyboard-input campaign with internal-state-aware navigation and no writes to game state; **visual** means an actual rendered gameplay-size frame; **historical** means an earlier retained capture. Phone-size viewport checks are not physical touch-device certification.

The final fetch found newer crest-combat/contrast/cave-ground work on `abbeb97` after the audit had frozen its candidate. It is not assessed by this report and must be preserved/retested during integration; the review branch was intentionally not rebased after evidence collection.

Six specialist agents covered the design, art and engineering groups. The producer consolidated a distinct verdict for every one of the 15 responsibilities. These are review responsibilities, not claims of 15 human employees.

## Fifteen role verdicts

| Senior responsibility | Verdict | Evidence / limit |
|---|---|---|
| Cinematic Designer | **Pass with art dependencies** | Campaign presents all 16 required sequences in order; W2, A0, GA1T and A9 now own their arrival/event pages before the next beat. Four GRAVEHORN pages remain absent because their art does not exist. |
| Game Designer — Player Systems | **Issues** | Forward tutorial causal chain is certified on keyboard. Grapple introduction still says “press U” on touch/pad; physical touch and default-difficulty feel were not assessed. |
| Mission Designer — Quest Craft | **Pass** | Ratchet repair, Volt Pack distinction, A7 read reward, raw-marble/forge causality and optional post-forge Alpha offer remain intact. |
| Principal Encounter Designer | **Issues** | NULLFANG encounter now physically precedes quarry descent. A2 missed-jump recovery (TER-1) remains open; new pre-forge GRAVEHORN increases first-chapter load. |
| Boss Designer | **Issues** | GRAVEHORN and FURNACE have distinct authored mechanics; GRAVEHORN presentation is stand-in art and cross-boss death persistence still lacks an explicit policy. |
| Mission Designer — Campaign | **Pass functionally** | Clean campaign certifies 16/16 beats, no page errors, required route and teaser. It uses Kitten difficulty and an automated keyboard planner, not a blind human player. |
| Mission Producer | **Pass** | Prior findings reconciled; bounded fixes and preserved failures separated; branch only, no merge/deploy. |
| Character Artist | **Issues / P1 art gate** | Gameplay-size inspection confirms repair hero mismatch and procedural GRAVEHORN; Alpha redesign and lion strips should be retained. |
| Cinematic Director | **Issues** | Recent 25-panel redraw set improves parity, but repair identity, NULLFANG eye colour and four GRAVEHORN beats remain. `passage_b` is a lower-priority consistency review, not a proven progression blocker. |
| VFX Artist | **Conditional pass** | Red/purple finite trail suites pass and lifecycle caps remain bounded. GRAVEHORN lacks dedicated pose/anchor coverage; `m_down` paints boss eyes red. |
| Technical Director — World Systems | **Pass for reviewed fixes** | Dynamic outer budgets, process-group cleanup, coherent room-cache fixture and frozen served identity pass. Physical-device performance is untested. |
| Gameplay Engineer — Combat | **Pass for bounded defect** | Friendly/rescued/disabled targets are rejected during aim and mid-reel; no zero-damage charge/knock/VFX reward. Functional tests do not certify subjective impact/audio. |
| Gameplay Engineer — Mission | **Pass with open text item** | Fail-closed campaign contract, quarry order and passage door ownership are covered. NOSTOS A7 terminal20 localization remains open. |
| Gameplay Engineer — NPC | **Pass** | Rescued lion gait/persistence retained; grapple no longer re-attacks protected creatures. No fresh human review of every companion animation. |
| Lead UI Engineer | **Issues** | Progressive text and reveal/advance separation retained. Grapple control hint is not device-aware; physical touch/RTL reading was not completed. |

## Findings and disposition

| ID | Severity | Player consequence / reproduction | Evidence | Paths / owner | Status and acceptance |
|---|---|---|---|---|---|
| STORY-1 | P1 | A curious player could break the A2 quarry hatch and start the marble route before meeting NULLFANG. | Source, staged, campaign | `js/game.js`, `tests/secrettell.cjs`, campaign; Mission/World | **Fixed.** Tiles 12–14 on rows 15–16 ring and shed grit but remain intact until `nfMeet`; campaign visits the east crest before quarry. |
| CIN-2 | P1 | Safe/settle delay let fast routes overtake event pages: bay before city, gate before Ratchet, passage before Sage, and CHIME before arena exit. An intermediate seven-death campaign exposed late gate and missing CHIME; the first final retry exposed skipped bay and was stopped early. | Source, staged, three campaign chronologies | `js/game.js`, `js/panels.js`, `tests/panels.cjs`, `tests/chapter-one.cjs`; Cinematic/Mission | **Fixed.** W2/A0/GA1T/A9 own their next boundary only while the specific beat is owed; bay/gate alone may coexist with the opening lesson lock. Final campaign shows all 16 in order. |
| QA-09 | P1 | A run could return success while required panels were missing/out of order, page errors existed, or `CAMPAIGN_SEGMENT/STOP` restored partial progress. | Source plus 7 negative contract tests | `tests/campaign-ch1.cjs`, `tests/campaign-contract.cjs`, `tools/studio/audit.py`; Mission/Producer | **Fixed.** Full result now requires all 16 beats in order, zero misses/errors, and no segment/stop. Negative cases fail closed. |
| COMBAT-4 | P1 | The claw could target a rescued/disabled creature, move it and farm volts even when damage was rejected; cure during reel stayed attached. | Source reproduction, browser regressions | `js/grapple.js`, `tests/grapple.cjs`; Combat/NPC | **Fixed.** Shared hostile predicate is used for targets/assist/reel; zero damage grants no knock, charge, freeze, FX or rumble. |
| QA-05 | P1 | Collector allotted campaign 360 s despite the runner permitting 3600 s and killed only the parent on timeout. | Source and 4 isolated unit tests | `tools/studio/audit.py`, `tools/studio/test_audit.py`; World/Producer | **Fixed.** Registry budgets +180 s overhead and POSIX process-group cleanup restored; inherited campaign segment/stop cleared. |
| CIN-4 | P2 | NULLFANG break pages declared A3 but ordinary `alsoRoom` sequences were ignored. | Source/staged | `js/panels.js`, `tests/panels.cjs`; Cinematic/Mission | **Fixed.** Ordinary alternate room uses the same predicate; Chapter Two fallback remains special. |
| BAY-1 | P2 | Opening lesson-lock frames could suppress bay or gate arrival pages. | Source/staged/campaign | `js/panels.js`, `tests/panels.cjs`; Cinematic/UI | **Fixed.** Only `bay` and `gate` may coexist with that lesson lock; every real combat/cutscene unsafe owner and all later pages remain rejected. |
| QA-07 | P2 | Room-cache test replayed NULLFANG meeting during a post-lion fixture, clearing held input and producing a false seam failure. | Staged diagnostics | `tests/roomcache.cjs`; World/Producer | **Fixed fixture.** Adds `nfMeet`, forbids panel interception and retains original timing/cache assertions. A single full-suite load spike is preserved and an unchanged isolated rerun is required. |
| ART-3 | P1 | First Ratchet repair image visibly changes the hero into a cream cat with dot eyes, no visor/cyan optics/scarf. | Fresh 1280×720, 844×390 and 390×844 visual captures | `assets/manhua/ch1/game/repair.webp`; Character/Cinematic | **Open.** Selectively retrieve the existing Oct11 candidate, normalize/crop to runtime geometry, compare in actual panel, package and obtain approval. Do not regenerate the 25-panel set. |
| ART-5 | P2 | `m_down.webp` shows infected boss NULLFANG with red eyes despite the purple-boss rule. | Fresh gameplay-size visual | `assets/manhua/ch1/game/m_down.webp`; Character/VFX | **Open.** Eye-only colour correction; preserve composition and purple seams. |
| CIN-6 / GH-ART | P1 | Mandatory pre-forge GRAVEHORN is a flat procedural rhino beside finished hero art and has no intro/phase/down comic beats. | Source plus historical 844×390 gameplay frame | `js/gravehorn.js`, missing `assets/characters/gravehorn/`, `docs/STORY_SCRIPT.md`; Character/Cinematic/Boss | **Open.** Produce the queued 14 rig plates and 4 manhwa beats once; inspect all tells, both facings, seams, feet, horn separation and phase transition. |
| FURNACE-ART | P2 | Bespoke later-zone mechanics reuse/transform existing dragon atlas rather than the six queued poses. | Source/art ledger | `js/furnace.js`, `assets/characters/dragon_parts.webp`; Character/Boss | **Open.** Add only queued poses and capture vent/drop/parry/transition continuity. |
| UX-05 | P2 | Grapple tutorial hardcodes keyboard U while touch exposes a wheel seat and pads are remappable. | Source | `js/grapple.js`, `js/i18n.js`, `js/theme.js`, `js/story-opening.js`; Player Systems/UI | **Open.** Keyboard, touch, bound-pad and unbound-pad introductions must each name a usable action. |
| TER-1 | P2 | Missed A2 bell-climb jumps can drop the player back through the quarry route. | Carried source/historical evidence | `js/world.js`; Encounter/World | **Open.** Reproduce with ordinary input, then add a readable catch/recovery without removing deliberate descent. |
| BOSS-1 | P3 | Encounter damage/death persistence policy differs or is undocumented across bosses. | Carried campaign/source evidence | Sage/CHIME/NULLFANG/GRAVEHORN; Boss/Combat | **Open policy decision.** Define and test one checkpoint/assist rule without revoking earned rescues. |
| HERO-1 | P3 | NOSTOS A7 terminal20 can fall back to raw robot-world key text. | Source | `js/text-progress.js`; Mission/UI | **Open.** Add hero-appropriate localized text while preserving read-based reward semantics. |

## Implemented, tested, inspected, integrated, deployed

| Layer | Status |
|---|---|
| Implemented on review branch | Quarry order gate; event-owned bay/gate/passage/CHIME boundaries; opening-arrival/alternate-room panel fixes; hostile grapple predicate; fail-closed campaign; collector cleanup/budgets; coherent test fixtures and regressions. |
| Tested | Built four pages; all 180 registered tests plus auxiliary build/package/identity checks in complete runs, focused post-fix regressions, and a final cleared-storage keyboard campaign. Exact failures and retries are in `VALIDATION.md`. |
| Visually inspected | 21 fresh panel captures at 1280×720, 844×390 and 390×844; repair, passage A/B, Sage, forge, NULLFANG down and Chapter Two samples; historical GRAVEHORN frame. |
| Integrated into production branch | **No.** Review branch only. Integration branch’s newer Eye-attribution line and FURNACE palette ruling were inspected but not overwritten. |
| Deployed live | **No.** Live site was not changed or claimed to match this build. |

## Chapter One route and cave census

The certified mandatory route is: wake → movement/jump → gate → Ratchet letter/drawer repair → pod/Volt Pack → forward monument/Servo → NULLFANG meeting → quarry → GRAVEHORN → raw marble → forge → maintenance passage → first Sage → CHIME → NULLFANG cleanse → camp/teaser. Alpha remains an explicitly optional post-forge detour with pack friendship and cache reward.

| Location | Meaningful outcome | Current assessment |
|---|---|---|
| A5 | Magnet puzzle and quarry entrance | Functional; not an empty duplicate cave. |
| A7 | Survey terminal starts Ratchet’s marble errand only after reading | Staged checks retained; HERO-1 text open. |
| CV1 | Spare core and first cave orientation | Campaign traversed. |
| CV1B | Pod save/recharge, survey chart and shortcut | Campaign uses it deliberately before/after GRAVEHORN. |
| CV2 | Deaf System beacon lore and approach | Campaign traversed; no new payoff defect. |
| CV3 | GRAVEHORN protects the raw marble; later return route to Sage | Strong mechanical purpose; authored boss art/panels missing. |
| GA1T | Maintenance-passage story and Sage junction | Passage now delivered before chamber crossing. |
| GA1 | Rest/return connection toward lion route | Utility retained. |
| GA1D | First Sage cleanse and CHIME revelation | Mandatory causal payoff. |
| A11 | Coin cache | Small optional reward. |
| A12 | Dash-gated Star Fragment | Ability-gated revisit. |
| A13 | Servo watch log and coin | NPC-specific discovery. |
| Alpha den | Optional wolf history, pack cure/friendship and supply cache | Must remain optional and not appear directly before lion by default. |

This census combines source/staged checks and mandatory campaign traversal. It is not a claim that a human physically walked every optional branch in this run.

## Manhwa parity matrix

| Sequence | Current source | Delivery / art verdict |
|---|---|---|
| wake | revised pages / recent redraw | Delivered first. |
| bay | p04/p05 | Delivered after opening movement lesson. |
| gate | p05 | Delivered. |
| letter | new letter image | Delivered before drawer/repair. |
| drawer | new drawer image | Delivered. |
| ratchet | p09 + repair | Delivered; **repair identity mismatch open**. |
| meet | p14 / `m_down` conditional | Delivered before quarry; **boss eye colour open**. |
| cave | p15/p16 | Delivered before marble in certified campaign. |
| marble | marble A/B | Delivered after GRAVEHORN. |
| forge | p18 / forge redraws | Delivered before passage/Sage. |
| passage | passage A/B | Delivered before GA1D; B’s proportions remain a P3 art consistency review. |
| sage | p25/p26 + bell/revival | Delivered. |
| break | break A/B | Delivered in valid A2/A3 room after event. |
| chime | p20 | Delivered. |
| free | p24 + fight A/B | Delivered after cleanse. |
| ch2 | ch2 A/B/C + hatch | Delivered as teaser only; not a claim of complete Chapter Two art. |
| GRAVEHORN beats | `gh_intro_a`, `gh_intro_b`, `gh_phase2`, `gh_down` in script | **Missing assets/wiring; production gap deliberately not faked in the 16-beat certificate.** |

## Animation and VFX matrix

| Actor/effect | Present | Remaining production work |
|---|---|---|
| Hero | Multi-pose authored artwork, new loadout silhouettes and effects | Physical feel, touch and all-device performance not certified. |
| Ordinary infected | Red eye anchors, finite trails, cure/death/despawn/room cleanup | Retain global budgets and reduced-motion behavior. |
| Boss infection | Purple eye/trail rule and lifecycle suites | Correct red eyes painted into `m_down`; add GRAVEHORN pose-specific anchor coverage. |
| Alpha | Ten dedicated strips including airborne state; pack identity aligned | Do not regenerate. Human review of transitions/foot planting still useful. |
| NULLFANG lion | 30-frame authored strip, distinct attack ranges and rescued planted walk | Do not replace wholesale; inspect blend/audio/haptic feel in human play. |
| GRAVEHORN | Distinct phase/tell/recovery mechanics and functional procedural rig | Highest enemy-art priority: 14 authored parts + 4 story beats, then gameplay-scale motion review. |
| FURNACE | Bespoke greed/backdraft/drop mechanics, existing dragon atlas | Six queued poses and state-to-state continuity captures. |
| Eye smoke | 1.125–1.875 s finite life, bounded caps, no cured/despawn residue in suites | Physical low-tier readability and performance not measured. |

## Performance and device gaps

- `opening-order` passes desktop and phone-sized layouts, but both traverse with keyboard and pointer; this is not an actual touchscreen playthrough.
- The continuous campaign is keyboard-controlled, internal-state-aware and uses Kitten difficulty. It proves reachability and causal delivery under those conditions, not first-time-player discoverability or default-difficulty pacing.
- One `roomcache` run under full-suite load measured 380 ms against its unchanged dynamic 204 ms budget; prior full runs passed and the unchanged isolated rerun is recorded separately. Do not widen the threshold without a reproduced runtime cause.
- No physical phone/native package launch, listened sound mix, felt vibration, accessibility-device test, human animation critique or owner art approval is claimed.
- WebGL bake required the local SwiftShader Vulkan library path; that environment repair is not a game code change.

## Delivery

- `VALIDATION.md` records commands, passes, preserved failures/retries and campaign scope.
- `CLAUDE_PROMPT.md` contains one copyable integration prompt.
- `images/` contains the 21 fresh gameplay-size panel captures.
- Automated evidence directories preserve original, corrected and final attempts; they are not rewritten to manufacture a green history.

The recurring review remains appropriate while active development continues. This run does not create or modify another schedule.
