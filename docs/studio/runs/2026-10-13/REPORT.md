# CLAWBYTE senior studio review — 2026-10-13

## Decision

**The review branch contains valuable bounded corrections, but Chapter One is not release-certified by this run.** The implementation restores the lost quarry-order gate, fail-closed campaign certificate, alternate-room story panel, protected-creature grapple boundary, device-aware grapple introduction and audit timeout/process cleanup. The four shipped pages build with `BUILD_ID ccb500010b20`; a final byte-pinned non-browser gate passes all 25 selected checks.

The browser gate is red for environmental—not asserted gameplay—reasons: this worker had no Chromium executable and browser provisioning returned an empty archive. Consequently the 159 browser-backed harnesses, including `opening-order`, live panels/grapple tests and the uninterrupted real-input campaign, were attempted and failed at launch. They are **unverified**, not gameplay regressions and not passes. No production merge or deployment occurred.

The latest art direction is better than yesterday's report understood. The bad `repair.webp` has been deliberately removed; the Ratchet wake film and `r_cell`/`r_marble` panels keep HZD-99 on-model. Do not reintroduce the old repair candidate. Targeted art gaps remain: `m_down` has red boss eyes, `r_cell` visually powers the supposedly switched-off Servo, `passage_b` drifts off-model, GRAVEHORN still has no authored character plates or four manhwa beats, and FURNACE still lacks its six queued poses.

## Versions and evidence

| Item | Version / status |
|---|---|
| Frozen `main` | `d4f9c04fa5c53d72a84c2eddd72aa52870b0278c` |
| Frozen integration | `claude/clawbyte-repo-migration-byhyl8` at the same `d4f9c04` |
| Review branch | `codex/studio-review-2026-10-13` |
| Remote source/evidence commit | `a9fd9ba64f76be20f7f04dfe4ce6be99974ec828` |
| Built game | All four HTML files, `BUILD_ID ccb500010b20` |
| Previous review | `codex/studio-review-2026-10-12` / `28846ce`; selectively compared, never wholesale-merged |
| Live production | Not inspected, merged or deployed |

Evidence labels: **source** is direct implementation inspection; **contract** is a non-browser executable test; **staged** is browser state deliberately prepared for one feature; **campaign** is a cleared-storage ordinary-input chapter run; **visual-source** is direct asset/film inspection; **visual-gameplay** is a rendered game frame. This run has source, contract and visual-source evidence. Browser staged/campaign/visual-gameplay evidence is blocked.

Six grouped specialist agents covered current design, art and engineering plus independent prior-report reconciliation. The producer records a distinct verdict for every one of the 15 responsibilities; these are review responsibilities, not claims of 15 human employees.

## Fifteen role verdicts

| Senior responsibility | Verdict | Evidence / limit |
|---|---|---|
| Cinematic Designer | **Issues / runtime blocked** | Doorway/event architecture and B1 teaser are preserved; ordinary `alsoRoom` selection is fixed for the A3 break. Live transition timing could not run. |
| Game Designer — Player Systems | **Improved / issues** | Grapple first-use message now follows keyboard, touch, bound pad and unbound-pad Controls route. Physical touch and default-difficulty feel are unverified. |
| Mission Designer — Quest Craft | **Source pass** | Ratchet battery, Servo cell, Volt Pack, cave marble, forge and optional post-forge Alpha keep distinct motivations/rewards. Runtime route is unverified today. |
| Principal Encounter Designer | **Improved / issues** | A2 quarry hatch now physically waits for `nfMeet`; TER-1 missed-jump recovery remains source/historical only. |
| Boss Designer | **Issues** | NULLFANG/Alpha mechanics and optionality remain. GRAVEHORN and FURNACE art gaps and cross-boss checkpoint policy remain. |
| Mission Designer — Campaign | **Contract pass; campaign blocked** | Certificate now requires all 16 scenes in order, no misses/errors and no segment/stop. No fresh uninterrupted browser campaign. |
| Mission Producer | **Pass for review delivery** | Prior findings reconciled, superseded repair advice withdrawn, bounded branch only, evidence limits explicit. |
| Character Artist | **Issues** | Ratchet replacement is on-model in source samples; NULLFANG eye colour, Servo state, passage anatomy, GRAVEHORN and FURNACE remain targeted gaps. |
| Cinematic Director | **Issues** | New Ratchet film materially improves continuity, but four GRAVEHORN beats are absent and source panels retain three parity inconsistencies. |
| VFX Artist | **Conditional / runtime blocked** | Finite red/purple system remains in source. `m_down` contradicts purple-boss language; GRAVEHORN pose anchor coverage is absent. |
| Technical Director — World Systems | **Improved** | Collector uses declared per-harness budgets and kills descendant process groups; room-cache fixture records `nfMeet`. Browser performance unverified. |
| Gameplay Engineer — Combat | **Contract pass; staged blocked** | Ten protected states are rejected and zero-damage grapple gives no knock/charge/FX/freeze/rumble. Full geometry/reel browser test is blocked. |
| Gameplay Engineer — Mission | **Improved / staged blocked** | Quarry and campaign evidence gates are fixed; current B1 teaser behavior is preserved. Browser sequence tests must still run. |
| Gameplay Engineer — NPC | **Improved / runtime blocked** | Grapple cannot retarget or retain rescued/cured creatures. Lion/Sage rescued gait has no fresh gameplay footage. |
| Lead UI Engineer | **Improved / physical-device blocked** | Dynamic grapple hint and progressive panel text source remain. Touchscreen, RTL reading and pad remap behavior need device/browser evidence. |

## Findings and disposition

| ID | Severity | Player consequence / reproduction | Evidence | Owner / paths | Status and acceptance |
|---|---|---|---|---|---|
| STORY-1 | P1 | Player could cut the A2 quarry hatch before meeting NULLFANG, reordering the chapter. | Source + contract fixture | Mission/World; `js/game.js`, `tests/secrettell.cjs` | **Fixed in source.** Pre-`nfMeet` hatch strikes knock but do not break; after meeting they break normally. Browser acceptance blocked. |
| QA-09 | P1 | Campaign could exit zero with missing/late panels, page errors, restored segment or developer stop. | Contract | Producer/Mission; `tests/campaign-ch1.cjs`, `tests/campaign-contract.cjs` | **Fixed and contract-tested.** Only complete 16-scene ordered, error-free, full run certifies. Fresh campaign still required. |
| QA-05 | P1 | Collector killed long harnesses at 360 s and could leave browser descendants running. | Four unit tests | World/Producer; `tools/studio/audit.py`, `test_audit.py` | **Fixed/tested.** Budgets come from `tests/run.cjs` + 180 s runner overhead; timeout kills owned process group. |
| COMBAT-4 | P1 | Rescued/disabled/friendly creature could be grappled, moved and used to farm volts even when damage was rejected. | Source + contract | Combat/NPC; `js/grapple.js`, grapple tests | **Fixed at safety boundary.** Browser motion test blocked. |
| CIN-4 | P2 | NULLFANG break pages declared A3 but selector ignored all alternate rooms. | Source | Cinematic/Mission; `js/panels.js`, `tests/panels.cjs` | **Fixed in source.** A2 and A3 staged coverage added; browser run blocked. B1 teaser remains B1-only. |
| UX-05 | P2 | First-use grapple prompt always said U, unusable for touch/remapped or unbound pads. | Source + contract | Player/UI; `js/grapple.js`, `js/i18n.js`, `js/theme.js` | **Fixed in source.** Prompt resolves U, touch glyph, bound pad label, or Pause→Controls→Grapple. Physical-device check blocked. |
| QA-07 | P2 | Post-lion room-cache fixture omitted `nfMeet`, letting story panels consume held crossing input and misreport cache failure. | Source | World/Producer; `tests/roomcache.cjs` | **Fixed fixture.** Adds milestone plus trace diagnostics; browser performance run blocked. |
| ART-3 | P1 historical | Old repair page changed HZD-99 into a bare-faced cream cat. | Visual-source | Character/Cinematic | **Closed by current-main replacement.** Deleted panel replaced by Ratchet wake film + `r_cell`/`r_marble`; never port yesterday's candidate. Runtime playback remains unverified. |
| ART-5 | P2 | `m_down` gives infected boss NULLFANG red eyes, contradicting purple boss rule. | Visual-source | Character/VFX; `assets/manhua/ch1/game/m_down.webp` | **Open targeted art correction.** Change eyes only to established infection purple; preserve composition/seams. |
| ART-6 | P2 | `r_cell` caption says Servo is switched off while background Servo has lit amber optics/chest. | Visual-source | Character/Cinematic; `r_cell.webp`, `text-manhwa.js` | **Open targeted correction.** Dim Servo indicators or make inactive state explicit without redrawing scene. |
| ART-7 | P3 | `r_marble` floating outline sword may read as a found blade rather than a forge diagram. | Visual-source | Cinematic; `r_marble.webp` | **Open clarity review.** Preserve raw marble; keep sword unmistakably diagrammatic or clarify caption. |
| ART-4 | P3 | `passage_b` rear hero has elongated limbs/fingers compared with adjacent hero art. | Visual-source | Character; `passage_b.webp` | **Open targeted anatomy correction.** Preserve tunnel composition/camera. |
| CIN-6 / GH-ART | P1 art gate | Mandatory pre-forge GRAVEHORN remains a procedural 14-part stand-in and lacks intro/phase/down comic beats. | Source | Character/Cinematic/Boss; `js/gravehorn.js`, missing character directory, `STORY_SCRIPT.md` | **Open.** Produce existing queued plates/beats once; validate both facings, feet, horn separation, tells, phase transition and purple anchors. |
| FURNACE-ART | P2 | Bespoke mechanics reuse transformed dragon atlas rather than six queued authored poses. | Source | Character/Boss; `js/furnace.js` | **Open.** Add only queued poses; do not regenerate completed lion/Alpha assets. |
| TER-1 | P2 | Missed A2 bell-climb jump can return player through quarry route. | Carried source/historical | Encounter/World; `js/world.js` | **Open; fresh reproduction required before edit.** Add readable recovery without blocking deliberate descent. |
| BOSS-1 | P3 | Death/checkpoint persistence differs or is undocumented across bosses. | Carried source | Boss/Combat | **Open policy.** Define/test one rule without revoking earned rescues. |
| HERO-1 | P3 | NOSTOS A7 `terminal20` can use robot-world wording. | Source | Mission/UI; `js/text-progress.js` | **Open localized text correction.** Preserve read-based reward semantics. |

## Implemented, tested, inspected, integrated, deployed

| Layer | Status |
|---|---|
| Implemented on review branch | Quarry gate; fail-closed campaign certificate; alternate-room panel selector; grapple hostility/zero-damage boundary; device-aware grapple prompt; collector budgets/process cleanup; coherent room-cache fixture. |
| Tested | Syntax; build/package/integrity; four collector unit tests; campaign negative contract; grapple safety contract; final 25-check non-browser frozen-build subset. |
| Browser staged tests | **Blocked by missing Chromium; not passed.** |
| Uninterrupted real-input campaign | **Blocked at browser launch; not run.** Yesterday's 19:27 campaign belongs to a different review commit and is not reused as certification. |
| Visually inspected | Five current source-art/film samples at 844×390. Not live-game frames. |
| Integrated into main/integration | **No.** |
| Deployed live | **No.** |

## Chapter One route and cave census

Intended route remains: wake → movement/jump → gate → Ratchet letter/drawer/repair film → Volt Pack/pod → Servo → NULLFANG meeting → quarry → GRAVEHORN → raw marble → forge → maintenance passage → first Sage → CHIME → NULLFANG cleanse → camp/B1 teaser. Alpha remains an optional post-forge detour and is not a lion prerequisite.

| Location | Meaningful outcome | Current assessment |
|---|---|---|
| A5 | Magnet puzzle and quarry entrance | Distinct purpose; browser traversal unverified today. |
| A7 | Read survey terminal to start/complete marble direction | Source/contract retained; HERO-1 wording open. |
| CV1 | Spare core and cave orientation | Distinct reward; no fresh live frame. |
| CV1B | Pod save/recharge, chart and shortcut | Distinct utility; no fresh live traversal. |
| CV2 | Deaf System beacon/lore and approach | Distinct story/navigation role. |
| CV3 | GRAVEHORN protects raw marble; later Sage return route | Strong mechanical purpose, weakest authored art/panel coverage. |
| GA1T | Maintenance-passage story and Sage junction | Purposeful connector; alternate/current panels need browser timing check. |
| GA1 / GA1D | Rest route, first Sage cleanse and CHIME revelation | Mandatory causal payoff. |
| A11 | Coin cache | Small optional payoff. |
| A12 | Dash-gated Star Fragment | Ability-gated revisit. |
| A13 | Servo watch log and coin | NPC-specific discovery. |
| Alpha den | Optional wolf history, pack friendship and supply cache | Correctly optional after forge; do not place immediately before lion by default. |

This census is source/contract evidence, not a claim that a player walked every cave today.

## Manhwa parity matrix

| Beat | Current delivery | Verdict |
|---|---|---|
| wake/bay/gate | Existing current pages at wake/doorways | Source present; runtime blocked. |
| letter/drawer | Manual read then drawer page | Source order correct; runtime blocked. |
| Ratchet wake | Dedicated `ratchet_wake` film, then `r_cell`/`r_marble` | Old identity defect closed in samples; Servo state and sword-diagram clarity open. |
| meet | p14 crops plus conditional `m_down` | Source present; boss-eye colour wrong. |
| cave/marble/forge | Cave arrival, raw-marble pages, forged-blade pages | Source causal order intact; campaign blocked. |
| passage/Sage/break/CHIME/free | Current game/clean pages | A3 alternate break fixed; live delivery unverified. |
| Chapter Two teaser | B1 crossing only | Intentional current direction preserved. |
| GRAVEHORN | Script calls for intro A/B, phase2 and down | **Missing art and wiring.** |

## Animation and VFX matrix

| Actor/effect | Present | Remaining evidence/work |
|---|---|---|
| Hero | Authored multi-pose artwork and newer loadout/face/glide work | No fresh live animation or device feel. |
| Ordinary infected | Red eye anchors, finite smoke lifecycle/caps in source | Browser roster/pose suite blocked. |
| Boss infected | Purple runtime rule | `m_down` eyes red; GRAVEHORN pose anchors not covered. |
| Alpha/pack | Ten dedicated Alpha strips and wolf-specific mechanics | Preserve; do not regenerate. Human transition review still useful. |
| NULLFANG | 30-frame strip, range-based moves and rescued distance gait | Preserve; no fresh gameplay motion/audio/haptic review. |
| GRAVEHORN | Distinct procedural mechanics/phase logic | Highest authored-enemy-art priority; 14 plates + four story beats. |
| FURNACE | Bespoke mechanic states using existing atlas | Six queued poses and transition captures. |
| Eye smoke | Source life 1.125–1.875 s, bounded pools, cleanup/suppression | No fresh runtime trail capture or low-tier performance result. |

## Performance and device gaps

- No local browser executable: all live gameplay, performance and screenshot harnesses are unverified today.
- The opening phone profile, when available, is a mobile viewport driven by keyboard; it is never physical-touch certification.
- No physical phone/native package launch, actual controller remap, listened mix, felt vibration, accessibility device, default-difficulty human run or owner art approval.
- Direct asset samples are useful art evidence but do not prove crop, caption, overlay queue, runtime colour management or gameplay scale.

## Patch list

- `js/game.js`, `tests/secrettell.cjs`: narrow A2 pre-`nfMeet` hatch guard.
- `js/panels.js`, `tests/panels.cjs`: ordinary `alsoRoom` eligibility and A3 break case.
- `js/grapple.js`, `js/i18n.js`, `js/theme.js`, grapple tests: hostile predicate, zero-damage side-effect guard and device-aware introduction.
- `tests/campaign-ch1.cjs`, `campaign-contract.cjs`, `tests/run.cjs`: 16-beat fail-closed certificate and negative cases.
- `tools/studio/audit.py`, `test_audit.py`: runner-derived budgets, campaign artifact capture, clean campaign environment and process-group cleanup.
- `tests/roomcache.cjs`: coherent post-lion fixture and crossing diagnostics.
- Four locally rebuilt HTML outputs; the remote review commit carries source/tests and the two results summaries. Claude must rebuild all four pages after integration. Five current source assets/film samples were inspected locally; canonical media remain in their existing asset paths.

Exact commands, exits and limitations are in `VALIDATION.md`. The single integration handoff is `CLAUDE_PROMPT.md`.
