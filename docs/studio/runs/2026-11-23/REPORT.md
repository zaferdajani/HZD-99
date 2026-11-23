# CLAWBYTE Senior Studio Review — 2026-11-23

## Executive decision

**RELEASE HOLD — P1.** The two commits added after the November 22 intake materially improve MIREJAW and must be preserved. The replacement roll is a genuine longitudinal body rotation, seven additional motion families complete the species vocabulary, locomotion cells are tied to distance, and four weapon-aware hero sheets keep HZD-99 visibly in the jaws. The prior `MIREJAW-ROLL-ART-01` finding is visually resolved in the stored assets and review footage, although live timing could not be reverified.

The central campaign is still not canon-aligned. Runtime and passing route certificates continue to enforce `forge -> Eye agent -> CHIME -> NULLFANG`, while current canon requires `GRAVEHORN -> NULLFANG -> optional clean Wolf King covenant -> pack-controlling Eye agent`. Alpha is still offered immediately after forging and described as corrupted/purifiable. Kingdom Two's MIREJAW/Bilge/Silt Mire arc is absent from the authoritative script/manhwa parity documents, and the clean Prism Prowler is still described as purified.

This branch restores the bounded fixes dropped from `main`: caption FIFO, PURIFY copy in five languages, explicit infection authority, atomic forge settlement, coordinate-sensitive terrain caches, truthful browser preflight, K2 order gate, centralized ferry ownership, Alpha bow persistence and complete AAC delivery. It also fixes the newly exposed cold-cache MIREJAW defect by preloading all 17 MIREJAW motion families and all four held-hero tiers before the encounter.

The full registry reports **42 PASS, 234 BLOCKED, 0 FAIL and 0 TIMEOUT** across 276 checks. This is not a release pass. Chromium exists at `/usr/bin/chromium`, but this host denies the Unix process socket required before page creation. No browser-backed staged assertion, uninterrupted ordinary-input campaign, physical phone/touch/controller, perceptual audio/haptic, screen-reader or 200% text-scale run was completed.

This is a review branch only. **Nothing was merged to `main`, mirrored to `odyssey` or deployed.**

## Pins and branch safety

| Item | Value |
|---|---|
| Repository | `zaferdajani/HZD-99` |
| Intake `main` | `69112bc00ff88d98550ac3283f61c85af6822ea2` |
| Intake tree | `21ae6e53894681b3e285b14c3a93f02184e1f554` |
| Intake `odyssey` | Same commit as `main` |
| Intake integration | `claude/clawbyte-repo-migration-byhyl8`, same commit as `main` |
| Previous review | `codex/studio-review-2026-11-22` at `3d69a7967fb8e3e01badb9fdf80d3358e85e06c2`; not an ancestor of `main` |
| Review branch | `codex/studio-review-2026-11-23` |
| Bounded-fix evidence commit | Local `9cfbd346ead0f6811d4beaa8602fdc1bbc28b45c`; published equivalent `577621e4ab93a99b816ff28f1ea84cba16bf7ad6` |
| Bounded-fix tree | `b1574f8655c1288da19a8a977e2ab6c54aa9e5fe` |
| Production/live verification | Not performed; no deployment claim |

The two bounded-fix commit IDs differ only because credential-less Git transport required publication through the connected repository interface; both point to the exact tree `b1574f8655c1288da19a8a977e2ab6c54aa9e5fe`. The branch began at exact `origin/main`. No approved hero, Alpha, wolf, agent, NULLFANG, GRAVEHORN, gate, MIREJAW or purification-film raster was regenerated. New art already on `main` was inspected and preserved.

## Comparison with the 2026-11-22 review

### Material improvements on `main`

- `f314ce7` adds authored MIREJAW notice, crouch, land, gape, daze, run and turn strips and replaces the false roll with a real longitudinal rotation.
- `69112bc` adds bare/single/dual/joined held-hero sheets and draws HZD-99 under MIREJAW's jaw layer during the roll.
- MIREJAW swim/walk/run cells now advance from traveled distance rather than wall-clock drift.
- The complete species ledger and test describe the new-species artwork rule. Preserve this work.
- NULLFANG rear eye anchors are already complete: 30/30 cells are mapped through the shared eye renderer. The prior `INFECTION-ANCHOR-1122` finding is closed as not reproduced.
- The purification film hash is unchanged from the November 22 inspection; its fade-to-black and audio fade remain preserved.

### Regressions on `main` restored here

The November 22 review was not integrated. `main` again dropped caption FIFO, PURIFY copy, atomic quest settlement, infection authority, terrain coordinate signatures, the K2 gate, ferry overlay ownership, Alpha bow persistence, complete room preloads, AAC parity and browser preflight. Exact prior contracts failed or were deleted. All are restored and revalidated on this branch without reverting the newer MIREJAW work.

### Newly exposed finding fixed here

`assets/roomassets.json` preloaded only `mjIdle` in SW3. `mjDraw` asks for a state sheet on first use and falls back to idle until decoding completes; the current browser tests explicitly preload every `mj*` sheet and therefore mask the cold-first-fight defect. The review manifest now preloads all MIREJAW states and the four held-hero tiers, and the source contract fails if any are absent.

## Fifteen-role review matrix

| # | Senior responsibility | Verdict | Highest-value evidence |
|---:|---|---|---|
| 1 | Cinematic Designer | HOLD P1 | Caption loss and forbidden FREE copy regressed on intake and are fixed here; canonical scene order remains wrong. |
| 2 | Game Designer — Player Systems | HOLD P1 | Tutorial source contracts pass; Alpha auto-offer, campaign causality and device/accessibility proof remain. |
| 3 | Mission Designer — Quest Craft | HOLD P1 | Chapter One and Silt Mire caves have meaningful rewards; Alpha premise/timing still contradict canon. |
| 4 | Principal Encounter Designer | CONDITIONAL ASSET/SOURCE PASS / HOLD P1 | MIREJAW vocabulary is much stronger; cold preload fixed here, but bypass/tail/contact/fair-play proof remain. |
| 5 | Boss Designer | STRONG MIREJAW ART UPGRADE / HOLD P1 | Roll and held-hero art are resolved; tail contact, infection meaning and live fairness are not. |
| 6 | Mission Designer — Campaign | HOLD P1 | Physical K2 gate fixed here; Chapter One graph and K2 script/manhwa authority remain wrong. |
| 7 | Mission Producer | HOLD P1 | Exact heads aligned, newer art preserved and bounded fixes verified; no runtime certification. |
| 8 | Character Artist | CONDITIONAL ASSET PASS / HOLD P1 | MIREJAW and held hero stay on-model at gameplay size; tail contact and older boss phase bodies remain. |
| 9 | Cinematic Director | HOLD P1 | Held-roll continuity and film ending are strong; K2 has no authoritative manhwa/script mapping. |
| 10 | VFX Artist | SOURCE PASS / HOLD P1 | Finite trail system and clean-rival authority pass contracts; MIREJAW's infection status/anchors are undefined and live proof is blocked. |
| 11 | Technical Director — World | HOLD P1 | K2 gate and tile signature fixed; fast vertical movement can still tunnel through an intermediate row. |
| 12 | Gameplay Engineer — Combat | CONDITIONAL SOURCE PASS / HOLD P1 | New MIREJAW motion logic parses and is authored; tail sync, hitbox, spatial weak point and rate proof remain. |
| 13 | Gameplay Engineer — Mission | HOLD P1 | Forge settlement and K2 gate are fixed; boss rewards and canonical graph are not atomic/aligned. |
| 14 | Gameplay Engineer — NPC | HOLD P1 | Alpha ceremony persistence fixed; NPC repair/gift transactions still span persistence boundaries. |
| 15 | Lead UI Engineer | HOLD P1 | Caption/ferry ownership fixed; ferry reveal/semantics, text scale and device proof remain open. |

## Findings register

| Stable ID | Severity | Player consequence and evidence | Acceptance condition | Status |
|---|---:|---|---|---|
| `CAMPAIGN-GRAPH-01` | P1 | Source and passing route tests still certify forge -> agent -> CHIME -> NULLFANG, contradicting current canon. | One state graph across canon/sheet/script/runtime/objectives/dialogue/panels/Continue/migrations/tests; ordinary-input Alpha-skip and Alpha-complete routes. | Open |
| `ALPHA-SEMANTICS-01` | P1 | Alpha is auto-offered after forge, called corrupted and receives purification semantics although canon makes it a clean post-NULLFANG covenant. | Gate after NULLFANG; remove virus/purification optics and copy; pack defeat reveals its controlling agent; migrate old saves. | Open |
| `PACK-AUTHORITY-DRIFT-21` | P1 | Runtime and documents still disagree on whether the Volt Pack is gifted or purchased. | One approved flow with exactly-once ownership and clean/legacy migration. | Open |
| `K2-MANHWA-PARITY-22` | P1 | Bilge, Silt Mire, MIREJAW, UNDERTOW and the revised seal road are absent from the authoritative script/manhwa parity files. | Pin one K2 edition and map every beat, prop, room, reward and action to runtime keys before new pages. | Open |
| `K2-SAGE-SEMANTICS-22` | P1 | Clean Prism Prowler is still “purified,” undermining the virus ritual's meaning. | Clean yield/stand-down; no virus extraction or purple optics; sheet/dialogue/VFX/reward/tests agree. | Open |
| `R-MARBLE-CONTINUITY-01` | P1 visual story | Pre-forge `r_marble.webp` visibly contains a completed sword/hilt instead of raw material. | Repaint only this panel to raw rounded marble or a clearly schematic future inset; blind read says “material, not weapon.” | Open |
| `MANHWA-AUTH-01` | P1 | Runtime mixes editions and no complete page set is parity-certified. | Pin one edition and certify identity, equipment, room, action, spoiler timing and crop for each used panel. | Open |
| `NULLFANG-PHASE2-ART-01` | P1 visual | Common phase-two states remain a red grade over phase-one bodies. | Preserve rear signature; add only damaged/vented phase idle/prowl, primary attack, leap/land and hurt/recovery. | Open |
| `GRAVEHORN-PHASE2-ART-01` | P1 visual | Escalation is lighting over phase-one plates. | Authored opened-plate/molten/vented body/head and live transition capture. | Open |
| `MIREJAW-ROLL-ART-01` | P1 visual | New sheet/source shows real longitudinal rotation; stored held-roll footage shows HZD-99 in the jaws. | Fresh exact-build live capture remains required for timing/occlusion. | Asset-resolved; live blocked |
| `MIREJAW-COLD-MOVESET-23` | P1 visual | Intake SW3 preloaded only idle, allowing first-use idle fallback. | All 17 MIREJAW sheets and four held-hero tiers resident before first encounter; empty-cache SW2->SW3 capture has no fallback. | Source fixed/tested; live blocked |
| `MIREJAW-TAIL-SYNC-01` | P1 combat art | All 12 tail cells rise from neutral; no descending/contact frame exists while wave/damage/sound/shake begin at active-state entry. | Replace only the tail strip with warning-lift, descending contact and recovery; trace contact to damage/audio/haptic. | Open |
| `MIREJAW-INFECTION-AUTHORITY-01` | P1 narrative/VFX | Generic boss logic classifies MIREJAW purple, but story never declares it infected/clean, it has no anchors and sinks rather than being purified. | Explicit canon decision with matching optics, dialogue, anchors/trails if infected, and resolution. | Open |
| `WORLD-FALL-01` | P1 | Vertical collision probes the final row rather than every crossed row; a long frame can tunnel through intermediate ground. | Sweep crossed rows; identical player/enemy/boss contacts at 30/60/120 Hz and one 1/30 spike. | Open |
| `BOSS-REWARD-ATOMIC-22` | P1 | Alpha/MIREJAW boss flags and unique rewards persist separately. | Clone/publish once; failpoint and reload migrations repair partial Pack arm/Seal II states. | Open |
| `NPC-ATOMIC-01` | P1 | Cell use, awake flag, Ratchet flag and gift persist in separate steps. | One idempotent transaction with partial-state migration; VFX after publish. | Open |
| `RUNTIME-EVIDENCE-01` | P1 gate | Browser creation is host-blocked; no continuous or physical-device run exists. | Exact-commit staged captures, uninterrupted ordinary-input routes, phone/controller/accessibility matrices. | Blocked |
| `QUEST-PAYMENT-ATOMIC-01` | P1 | Intake could persist quest done without the Purifier. | Clone/apply/one publish/rollback; duplicate callbacks harmless; legacy repair. | Fixed/tested here |
| `SCENE-CAPTION-01` | P1 | Intake evicted the oldest unread fourth caption. | Visible three plus FIFO wait lane; read/shown/reset cover both lanes. | Fixed/tested here |
| `PURIFICATION-LANGUAGE-01` | P1 | Intake used FREE in five locales. | PURIFY/PURIFIED in five languages; hold instruction remains localized ARIA. | Fixed/tested here |
| `INFECTION-AUTHORITY-01` | P1 | Intake marked clean Alpha/constructs purple. | Explicit clean kinds; ordinary infected red, infected guardian/agent purple; finite cleanup. | Source fixed/tested; live blocked |
| `K2-ORDER-GATE-22` | P1 | Carrier alone could enter UNDERTOW before MIREJAW. | Both B6/GB1T require `bossMirejaw`; negative Carrier-only and positive reload assertions. | Source fixed; browser blocked |
| `AAC-TIER-22` | P1 mobile | Intake lacked 159 current AAC derivatives. | Complete indexed AAC package and physical iOS playback check. | Source/package fixed; device blocked |
| `AUDIT-TRUTHFULNESS-23` | P1 evidence | Intake focus audit mislabeled 14 host launch failures as product FAIL. | Direct/transitive Playwright preflight, executable/socket checks, blocked classification and 8/8 units. | Fixed/tested here |
| `MIREJAW-WEAKPOINT-SPATIAL-01` | P2 | Every coordinate takes full damage during leap, including armored head/back. | Facing-aware belly region sampled at early/mid/late leap. | Open |
| `MIREJAW-HITBOX-22` | P2 | Approx. 405x190 rendered body uses a 300x64 general hurt box. | Pose-aware hurt regions and real hero-swing hit/miss tests. | Open |
| `FRAME-INVARIANCE-22` | P2 | Some MIREJAW cells use `performance.now()`; tests step only 60 Hz. | Simulation animation clock; 30/60/120 Hz, pause, hit-stop and spike matrix. | Open |
| `MIREJAW-HELD-TIER-COVERAGE-23` | P2 | Runtime has four held tiers, but current harness executes only single/dual and does not assert jaw registration. | Exercise bare/single/dual/joined and compare waist to measured jaw anchors/occlusion. | Open |
| `CAVE-VARIETY-01` | P2 | Later grotto families still repeat bench/terminal/bat/agent grammar. | One kingdom-specific verb, evidence, payoff, visible transformation and callback per network. | Partially improved |
| `FERRY-TEXT-REVEAL-01` | P2 | Ferry question/options appear immediately rather than through the shared grapheme reader. | Shared reader; first confirm reveals, second chooses; Arabic/CJK capture. | Open |
| `FERRY-A11Y-01` | P2 | Full-screen canvas choice lacks semantic dialog/options/focus/selected-state announcement. | Semantic localized surface/focus trap and screen-reader keyboard/touch proof. | Open |
| `TEXT-SCALE-01` | P2 | No persisted 100/125/150/200% typography scale. | Shared wrapping/layout scale with five-language desktop/phone captures at 200%. | Open |
| `INFECTION-ANCHOR-1122` | P1 VFX | Prior report said NULLFANG rear lacked anchors; exact current map has 30/30 and the shared renderer reports them. | Contract/capture may be extended, but the stated missing-anchor defect is absent. | Closed — not reproduced |

## Cave and quest census

| Space | Current purpose | Decision |
|---|---|---|
| A5/A7/CV1/CV1B/CV2 | Puzzle, survey/evidence, permanent reward and beacon | Meaningful; preserve |
| CV3 | GRAVEHORN, raw marble and return passage | Strong and story-critical |
| GA1T/GA1/GA1D | Tunnel/rest/first Eye agent | Meaningful content, wrong campaign position and authority graph |
| A10R/A10 | Wolf road, Alpha den, covenant/pack reward | Meaningful optional topology, wrong timing and infection premise |
| SW1 | Bilge and ferry; payment or pole errand | Meaningful |
| SW5 | NULLFANG-dash traversal and pole recovery | Meaningful |
| SW2 | Reedbank hub, save bench and route split | Meaningful |
| SW4 | Optional high-roost cache | Meaningful optional branch |
| SW3 | MIREJAW and Vault Seal II | Meaningful and story-critical; tail/infection/live findings remain |
| GB1/GC1/GD1/GX1/GE1 families | Repeated grotto/tunnel/deep-agent grammar | `CAVE-VARIETY-01` remains P2 |

No ordinary exit ID or source-defined payoff is being counted as proof that a player understood, reached or enjoyed the cave.

## Manhwa parity matrix

| Beat | Runtime | Authoritative page/script | Verdict |
|---|---|---|---|
| Wake, tutorial, Ratchet repair | Implemented in source; continuous run absent | Draft 3 direction exists; mixed runtime panel editions | Not certified |
| Raw marble before forge | Quest exists | `r_marble.webp` shows a completed blade too early | P1 mismatch |
| Forge and first Purifier | Implemented; atomic settlement fixed here | Story foundation agrees | Source-aligned; live blocked |
| First agent/CHIME/NULLFANG | Old order enforced | Current canon requires NULLFANG before Wolf King/pack agent | P1 causal mismatch |
| MIREJAW held-roll | Runtime and four equipment tiers exist | No authoritative K2 script/manhwa mapping | Strong runtime art; parity open |
| Bilge/Silt Mire/UNDERTOW/seals | Playable source arc exists | Absent/outdated in `STORY_SCRIPT` and parity files | P1 parity gap |
| Purification film ending | Stored asset fades picture/audio cleanly | Ritual canon agrees | Stored asset pass; live chain blocked |

## Animation, character and VFX matrix

| Subject | Current evidence | Decision |
|---|---|---|
| Hero | Approved motion/loadout families preserved | Do not regenerate |
| NULLFANG | Strong rear/swats/slam, lion vocals; 30/30 rear eye anchors | Preserve; phase-two common bodies remain P1 |
| Alpha/pack | Distinct identity, den, yield and covenant; clean-authority fix restored | Preserve art; move/rewrite semantics; dedicated small wolf bow still useful |
| GRAVEHORN | Signature rig/fight present | Phase-two damaged body still P1 |
| MIREJAW base/new moves | Cohesive, on-model, readable at gameplay size | Preserve all completed strips |
| MIREJAW roll/held hero | Real longitudinal roll; four on-model equipment tiers | Asset-resolved; live capture blocked |
| MIREJAW tail | Rise-only take, no contact/recovery | Replace only this strip; do not regenerate the boss |
| MIREJAW preload | Intake cold-fallback risk | Fixed in manifest/contract here |
| Infection eyes | 1.5 s ±25%, bounded pools, speed gate, teleport/room cleanup, reduced-motion smoke suppression | Source system strong; MIREJAW authority/anchors and live proof open |
| Purification | Hold action, white gather, black transition and stored film fade | Language/ARIA fixed; complete live chain blocked |

The stored gameplay-size inspection is `visual-gameplay-size-sample.png`. It is a static/stored-footage contact sheet, not a fresh live render.

## Automated evidence

### Build, package and deterministic checks

| Check | Result |
|---|---|
| `npm ci` | PASS — 161 packages installed |
| `node build.cjs` | PASS — index 5.42 MB, odyssey 4.20 MB, forge 5.44 MB, forge-odyssey 4.21 MB |
| `npm run app:pack` | PASS — 1,120 assets (265.3 MB) plus two pages (9.6 MB), 274.9 MB |
| `python3 -m unittest tools.studio.test_audit` | PASS — 8/8 |
| Eight restored review contracts | PASS |
| Extended cold-preload contract | PASS — complete agents, MIREJAW and held-hero families |
| `node tests/tails.cjs` | PASS — 154 one-shots measured, six loops skipped |
| `node tools/aactier.cjs --check` | PASS — 159 files |
| `node tests/campaign-contract.cjs` | PASS, but certifies obsolete graph |
| `node tests/script-route.cjs` | PASS, and prints `forge < sage < CHIME < NULLFANG`; negative canon evidence |

### Full registry

```sh
CHROMIUM_PATH=/usr/bin/chromium python3 tools/studio/audit.py \
  --profile full --output docs/studio/runs/2026-11-23/automated
```

| Result | Count |
|---|---:|
| PASS | 42 |
| BLOCKED | 234 |
| FAIL | 0 |
| TIMEOUT | 0 |
| Total | 276 |

`complete_requested_scope` is true because every registered check received a result. `passed` is false because blocked evidence is not success. Chromium was found but could not create its required Unix socket, so every direct/transitive browser harness was classified blocked before page creation.

Evidence hashes:

- `automated/results.json`: `4152aa9d0d8f662ce68016668a70150419492d68c623b42537adc1035e3c6abb`
- `automated/AUTOMATED.md`: `f0a50bec95b9f2446a8cb4ff25b1fab543c6499c21be3ea1a26e0454457d9e25`
- `visual-gameplay-size-sample.png`: `74216373bb4210e9f386def4f23e73fa301c80b43ac243baceb4977bf873cf44`

### Staged versus uninterrupted evidence

| Evidence class | Status | What it proves |
|---|---|---|
| Source/headless contracts | Completed | Deterministic language, transactions, manifests, audio, data and route invariants |
| Stored art/review footage | Inspected | Identity, silhouette, pose coverage and approximate gameplay readability; not current live timing |
| Browser/staged encounter checks | Blocked before page creation | Harnesses exist; no current rendered assertion executed |
| Uninterrupted ordinary-input campaign | **Not run** | No reachability, clarity, difficulty, save/retry or recovery certificate |
| Physical phone/touch/controller/audio/haptics | **Not run** | No hardware, mix, latency or perceptual certificate |
| Screen reader/RTL/CJK/200% typography | **Not run** | No accessibility certificate |

## Implemented, tested, inspected, integrated and deployed

| State | Result |
|---|---|
| Implemented on review branch | Restored bounded safeguards; fixed MIREJAW cold preload; rebuilt pages/AAC/package |
| Deterministically tested | 42 registry checks pass; impacted contracts and audit units pass |
| Visually inspected | Current assets and stored gameplay footage at gameplay scale |
| Staged browser tested | **No — blocked before page creation** |
| Uninterrupted real-input tested | **No** |
| Physical device/accessibility tested | **No** |
| Integrated to `main` | **No** |
| Deployed | **No** |

## Before/after patch list

| Before on intake | After on review branch |
|---|---|
| Fourth caption evicted unread text | Visible-three FIFO plus waiting lane and completion-aware gates |
| FREE copy in five locales | PURIFY/PURIFIED copy and localized hold instruction |
| Quest done could persist without blade | Clone/apply/one-publish/rollback and legacy repair |
| Clean rivals classified purple | Explicit clean-kind authority and contract |
| Terrain cache keyed by broken count | Stable coordinate-sensitive signature |
| Carrier alone unlocked UNDERTOW | MIREJAW proof required both directions |
| Ferry bypassed overlay queue | Centralized overlay ownership |
| Alpha bow replayed after reload | Persisted when ceremony becomes visible |
| SW3 preloaded only MIREJAW idle | All 17 MIREJAW sheets plus held tiers preloaded |
| 159 AAC files missing/stale | 159 indexed AAC files current and packaged |
| Host launch denial counted as product FAIL | Direct/transitive browser preflight reports BLOCKED; 8 unit tests |

## Performance and device gaps

- Empty-cache MIREJAW presentation needs a real network-throttled SW2->SW3 capture even though the manifest contract now passes.
- MIREJAW timing needs 30/60/120 Hz, pause, hit-stop and spike validation.
- No phone thermal/memory/decode measurement was run after adding the larger preload family.
- No physical touch/controller input, rumble intensity, speaker/headphone mix or screen-reader proof exists for this commit.
- Viewport emulation, static assets and source contracts must not be reported as physical-device approval.

## Release recommendation

Keep this branch isolated. Integrate its bounded fixes over the same or newer `main` while preserving all new MIREJAW and held-hero assets. Next, correct the Chapter One graph and Alpha semantics as one migration-aware change, decide MIREJAW's infection meaning, make boss/NPC rewards atomic, sweep vertical collision, produce only the missing tail-contact and older phase-two art, and update K2 script/manhwa authority. Then run an exact-commit uninterrupted desktop/phone route and the staged/accessibility/device matrices before any release claim.
