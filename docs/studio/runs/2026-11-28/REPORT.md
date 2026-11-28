# CLAWBYTE Senior Studio Review — 2026-11-28

## Executive decision

**RELEASE HOLD — P1. Do not merge or deploy production.**

Production gained meaningful player-facing work after the 2026-11-27 review: recorded combat and Alpha audio, called-wolf bites and room following, control-aware arm lessons, raw-marble glint, strike-to-use pods, a low-detail default, stronger CHIME/GRAVEHORN counters, closer horizontally tracking boss framing, arena ground carried to the screen foot, and a redrawn CHIME panel. Those improvements are worth preserving.

This review restores ten bounded safeguards that did not reach `main`, but it cannot certify Chapter One. The repository still records a fresh-campaign stall in A2, the owner-authorized story order disagrees with several passing documents/tests, the Chapter Two teaser depicts a deleted camp hatch, all 32 manhwa edition pages remain uncertified, two required boss art queues remain open, and 267 browser-backed checks—including the only uninterrupted ordinary-input campaign—were blocked before launch because Chromium is absent.

The branch is for integration review only. It was not merged and was not deployed.

## Intake, identity and change comparison

| Surface | Revision | Review decision |
|---|---|---|
| Remote `main` | `35e954ea186f2075b7a86a3891a19db0baf8b43c` | Production intake |
| Remote `odyssey` / Claude migration branch | Same `35e954e` | No divergence at intake |
| Dedicated remote `integration` | Not present | No separate integration head to review |
| Previous review | `origin/codex/studio-review-2026-11-27` at `57760f684df5d15ba025a72be9e31c429c694598` | Compared semantically; not an ancestor and never merged wholesale |
| Common production base with previous review | `21282600f88aab4c15a14d26d04f2c741a5a4606` | Used to distinguish new production work from prior review work |
| Bounded source/build commit | `f8ddc16597a1fb5f2f8ce0c5fc8d90de6960bfd0` | Remote checkpoint with exact audited source tree `3551d75ccbdc2a1512eae450d69ae653ffac7dee` |
| Review branch | `codex/studio-review-2026-11-28` | Push only; no merge/deploy |

Production added 12 feature/merge commits and 143 changed files after the prior common base. The previous review branch also contains safeguards absent from production. This branch ports only reviewed semantic changes onto current `main`; it does not replace the newer combat, audio, camera, terrain, panel or artwork work.

No artwork was regenerated. The approved hero, Alpha/rider, wolf, NULLFANG, MIREJAW, crystal references and existing manhwa pages were preserved.

## Bounded fixes implemented on this branch

| Stable ID | Change | Verification | Status |
|---|---|---|---|
| `AUDIT-BROWSER-CLASSIFICATION-27` | Direct/transitive Playwright detection plus executable/socket preflight; three hero visual tests are no longer falsely source-only. | Eight collector unit tests pass. Full audit records missing Chromium as `blocked`, not gameplay failure. | Fixed |
| `ALPHA-ORDER-26` | `alpha_pack`, Ratchet dialogue and `alphaQuestOffer()` all require purified NULLFANG (`bossGlitch`). | `alpha-order-contract` pass, including the direct Ratchet path initially missed during porting. | Fixed |
| `QUEST-PAYMENT-ATOMIC-01` | Forge/harness settlement clones the save, applies all effects, persists once, rolls back on failure and repairs historical done-without-reward saves. | `quest-payment-contract` pass including forced persist failure and idempotent migration. | Fixed |
| `PACK-LADDER-MIGRATION-26` | Versioned Pack migration preserves legacy Pack and ride owners without touching NOSTOS. | `pack-migration-contract` pass. | Fixed |
| `WOLF-STAMINA-RESET-26` | Same-summon Alpha stamina survives voluntary dismount/remount; only a new summon starts full. | `wolf-mount-contract` pass. | Fixed |
| `NULLFANG-COVER-RNG-26` | Cover audio/foliage impulses use private scenery RNG instead of gameplay `Math.random()`. | Static contract clause passes. | Fixed |
| `ALPHA-BOW-PERSIST-26` | Covenant bow flag persists when the ceremony becomes visible. | `alpha-bow-persist-contract` pass. | Fixed |
| `ALPHA-INFECTION-ORACLE-26` | Alpha and Eye-built clean constructs emit no infection smoke; infected ordinary enemies remain red and infected guardians purple. | `infection-eye-authority-contract` pass. | Fixed in source; live motion blocked |
| `NULLFANG-REAR-EYE-27` | Restored the previously inspected 30-cell `beastStudioRear` eye map. | Contract accounts for all 30 cells; static contact sheet inspected. | Fixed in source; live motion blocked |
| `RIDER-PRELOAD-27` | Gallop/leap/rear whole-rider sheets are in the boot manifest and warmed in the Pack tree and ride prompt. | `wolf-mount-contract` pass. | Fixed |

Generated pages were rebuilt from source. The changes are implemented and tested at the source/static level; they are not integrated into `main` and are not deployed.

## Evidence boundary

### Executed

- Locked dependency install (`npm ci`).
- Syntax checks for every changed gameplay module.
- Four web builds: `index.html`, `odyssey.html`, `forge.html`, `forge-odyssey.html`.
- App package: **1,176 assets, 264.1 MB + two pages, 10.5 MB = 274.6 MB**.
- Full collector registry against clean source tree `3551d75ccbdc2a1512eae450d69ae653ffac7dee`: 305 registered harnesses plus build, package and two served-build identity checks.
- Forty-two build/static/component checks.
- Six restored fail-closed contracts and eight collector unit tests.
- Static cave-ground census: **25 caves / 1,004 floor columns**.
- Static Seam-route contract.
- Static gameplay-size contact sheets for hero states, Alpha gallop, NULLFANG rear, and MIREJAW roll/turn.
- Read-only review of all 15 senior responsibilities, grouped across six agents but recorded separately below.

### Blocked or not executed

- 267 browser-backed staged harnesses.
- Any live rendered gameplay capture, including boss framing, ground-to-screen-foot and trails in motion.
- The uninterrupted fresh-save ordinary-input campaign. `campaign-ch1` is the only such harness and was blocked.
- Keyboard/controller/physical-touch parity.
- Physical audio mix, haptics, mobile performance, screen reader and 200% text validation.
- A production deployment comparison.

`/opt/pw-browsers/chromium` is absent; `/usr/bin/chromium` points to a missing `/usr/lib/chromium/chromium`. The collector classified every browser-dependent test before launch. This is an infrastructure blocker, not a game pass and not a game failure.

## Automated result

Command:

```sh
CHROMIUM_PATH=/opt/pw-browsers/chromium python3 tools/studio/audit.py \
  --profile full --output docs/studio/runs/2026-11-28/automated
```

| Result | Count |
|---|---:|
| PASS | 42 |
| BLOCKED | 267 |
| FAIL | 0 |
| TIMEOUT | 0 |
| Total collector checks | 309 |

The audit began from a clean local checkpoint `e5e34f059fa5e70f4ea26790dd71aa2646e361e6`, whose tree is exactly `3551d75ccbdc2a1512eae450d69ae653ffac7dee`; the pushed source checkpoint `f8ddc16597a1fb5f2f8ce0c5fc8d90de6960bfd0` has that same tree. Machine-readable evidence and every per-check log are under [`automated/`](automated/). The registry scope was complete, but the audit result is not a pass because blocked checks do not count as passing.

Notable passes: build/package, served identity at start/end, combat impact source contract, repair lifecycle, panel continuity, archive/ledger/weapon bookkeeping, story opening, six restored safeguards, tutorial/static story checks, cave ground, Seam route, weapons/gear/motion sampling, dialogue audio, credits, campaign certificate logic and several source-only input contracts.

## Fifteen senior-role verdicts

| # | Senior responsibility | Verdict | Evidence-backed decision |
|---:|---|---|---|
| 1 | Senior Cinematic Designer | **HOLD P1** | Runtime trigger is the A14→B1 crossing, but `js/panels.js` and `js/text-manhwa.js` still open with the deleted camp hatch. Fade, music ending, skip and replay were browser-blocked. |
| 2 | Senior Game Designer — Player Systems | **SOURCE IMPROVEMENT / HOLD P1** | Arm lessons, pod use and low-detail default are stronger. The repository still records the fresh campaign stuck in A2 and all live input checks were blocked. |
| 3 | Senior Mission Designer — Quest Craft | **CONDITIONAL IMPROVEMENT / HOLD P1** | Caves have distinct authored purposes and Alpha is now gated after NULLFANG on this branch. K2 causality can still bypass Rivet and live route readability is unproven. |
| 4 | Principal Encounter Designer | **CONDITIONAL IMPROVEMENT / HOLD P1** | Alpha, CHIME and TALLYMAN have more readable counters. UNDERTOW remains generic and frame-rate equivalence is absent. |
| 5 | Senior Boss Designer | **HOLD P1** | NULLFANG is substantive, but phase two is recolored phase-one art; MIREJAW contact volumes do not match belly/tail poses; UNDERTOW lacks identity. |
| 6 | Senior Mission Designer — Campaign | **HOLD P1** | Runtime follows owner canon `forge → CHIME → TALLYMAN → NULLFANG`; several documents and `script-route` still pass while asserting the obsolete Sage-first route. |
| 7 | Senior Mission Producer | **HOLD P1** | Provenance, current/previous comparison and bounded port are sound. A2, browser/runtime, authority, art and accessibility gates remain open. |
| 8 | Senior Character Artist | **CONDITIONAL ASSET PASS / HOLD P1** | Current hero/Alpha/rider/NULLFANG/MIREJAW sheets remain coherent and unchanged. Twenty-five wrong/missing crystal-weapon strips and authored NULLFANG phase-two bodies remain open. |
| 9 | Senior Cinematic Director | **HOLD P1** | All 32 edition pages remain uncertified, the exit teaser depicts the wrong route, and Chapter Two lacks certified Rivet/MIREJAW/shell/UNDERTOW bridges. |
| 10 | Senior VFX Artist | **SOURCE-STRONG / HOLD P1** | Finite world-space red/purple trails have bounded life/caps/cleanup/reduced-motion. Clean authority and NULLFANG rear anchors are fixed here; MIREJAW roll/turn has 30 unresolved cells and no live trail capture exists. |
| 11 | Senior Technical Director — World Systems | **CONDITIONAL IMPROVEMENT / HOLD P1** | Boss camera and arena-floor source improved; 25-cave ground static check passes. A2 traversal and destination-row-only vertical collision remain release blockers. |
| 12 | Senior Gameplay Engineer — Combat | **SOURCE-STRONG / HOLD P1** | Flash, fragments, hit-stop, recoil, knockback, audio, rumble and boss gates are authored. Live feel, audio/haptics and frame invariance are unverified. |
| 13 | Senior Gameplay Engineer — Mission | **HOLD P1** | Alpha order, forge/harness atomic settlement and Pack migration are guarded here. Pack purchases, Ratchet restoration, shell craft and boss rewards remain non-atomic. |
| 14 | Senior Gameplay Engineer — NPC | **CONDITIONAL SOURCE PASS / HOLD P1** | Ratchet release and `sageWalk8` movement are authored. Full wake/reward recovery and live post-purification walking remain unverified. |
| 15 | Lead UI Engineer | **HOLD P1** | Shared reveal/RTL/input abstractions are strong. Captions can discard unread text, ferry bypasses the overlay queue/reveal reader, Pack/ferry are canvas-only, and 200% text scaling is absent. |

## P1 findings and acceptance conditions

### `CAMPAIGN-A2-STUCK-26`

The last recorded ordinary-input campaign stopped in A2 at 4:24 and could not reach A5 (`docs/OWNER_ORDERS.md`). `js/world.js` topology is unchanged from the prior review. Static graph links and the passing cave-ground/Seam tests are not traversal proof.

**Acceptance:** archive one exact-SHA W1→W2→A0B→A0→A1→A2→A5→CV1→CV1B→CV2→CV3 run using only ordinary input, no injected rooms/flags/items/positions, then repeat critical gates with controller and physical touch plus reload checkpoints.

### `STORY-AUTHORITY-DRIFT-26`

Owner orders and current runtime require `forge → CHIME → TALLYMAN → NULLFANG`. `docs/STORY_SCRIPT.md`, `docs/CAVES_CH1.md`, `docs/CHAPTER_ONE_CAMPAIGN.md`, `tests/script-route.cjs` and related authority still describe/validate the superseded Sage-before-CHIME route. The static `script-route` pass is therefore evidence of document consistency with the wrong history, not current canon.

**Acceptance:** establish one machine-readable graph; make every document, objective, panel unlock and test agree that TALLYMAN is the Eye's agent below the quarry and comes after CHIME, before NULLFANG.

### `K1-EXIT-PANEL-CONTINUITY-26`

The current trigger is the frontier crossing, but the teaser begins with `game/hatch` and “The hatch above the camp stood open.” That location no longer exists in the route.

**Acceptance:** replace only the first shot/caption with approved A4 door/A14 road/B1 threshold art; preserve the threat panels/title card; verify trigger, replay, skip, reload, landing, fade-in/fade-out and a music tail that does not cut.

### `CRYSTAL-WEAPON-CANON-26`

`docs/ART_QUEUE.md` still records 25 armed strips using the wrong weapon forms plus missing single/dual/joined aerial attacks.

**Acceptance:** re-fire only registered missing/wrong states from the approved crystal references; empty the queue/missing list; inspect gameplay-size ground, air, charge and contact sheets. Preserve already approved hero motion.

### `NULLFANG-PHASE2-ART-01`

Phase two still grades phase-one strips red instead of changing the damaged silhouette.

**Acceptance:** authored damaged/vented idle/prowl, primary, leap/land and hurt/recovery bodies with stable pivots and gameplay-size transition proof.

### `WORLD-FALL-01`

`moveEnt()` integrates vertical position and checks the destination row only. A long frame/high-speed fall can cross solid rows and finish in an open row.

**Acceptance:** sweep every crossed row upward/downward while preserving one-way ledges; prove identical contacts at 30/60/120 Hz and representative 100–250 ms spikes.

### Combat/boss P1

| ID | Player consequence | Required acceptance |
|---|---|---|
| `FRAME-INVARIANCE-22` | Tells, contacts, stamina and RNG may vary with frame rate. | Deterministic 30/60/120 Hz + spike matrix for wolves, Alpha, mount, MIREJAW and NULLFANG. |
| `MIREJAW-WEAKPOINT-SPATIAL-01` | Any hit during leap gets belly bonus, even away from the visible belly. | Facing/frame-aware belly region with positive and negative boundary tests. |
| `MIREJAW-TAIL-SYNC-01` | Fixed proximity can hurt outside visible tail frames. | Pose-aware swept tail volume; left/right and edge-overlap tests. |
| `UNDERTOW-DUEL-COVERAGE-25` | Distinct art resolves to a generic Sage fight. | Three sewer/current-specific moves, ≥250 ms reachable openings, phase change, arena interaction, audio/VFX and atomic reward. |
| `MIREJAW-INFECTION-AUTHORITY-01` | Optics/canon can disagree. | Decide infected vs clean; if infected map all 226 cells, including 16 roll + 14 turn, with explicit occlusion; if clean suppress optics consistently. |

### Mission/persistence P1

| ID | Player consequence | Required acceptance |
|---|---|---|
| `PACK-PURCHASE-ATOMIC-26` | Shards and entitlement can split on storage failure. | One checked transaction per rung/ride; rollback, double-confirm, re-entry and reload tests. |
| `NPC-ATOMIC-01` | Ratchet battery, wake, release and gifts cross multiple save boundaries. | Versioned idempotent state machine or failpoint-recoverable checkpoints with no loss/duplication. |
| `K2-SEWER-QUEST-ORDER-25` | MIREJAW can be defeated before meeting Rivet. | Gate it or author a full early-discovery route; atomic shell craft. |
| `BOSS-REWARD-ATOMIC-22` | Boss completion and unique rewards can split. | Idempotent per-boss transaction plus forced-failure/reload tests. |

### UI/accessibility P1

| ID | Player consequence | Required acceptance |
|---|---|---|
| `SCENE-CAPTION-FIFO-26` | A fourth caption deletes the oldest unread line. | Three visible + FIFO backlog; no loss across read/shown/reset/replay. |
| `FERRY-OVERLAY-OWNERSHIP-26` | Bilge's question can collide with pending overlays. | Register and queue FERRY centrally; overlap tests. |
| `FERRY-TEXT-REVEAL-01` | Full text appears instantly and first confirm can choose. | Shared reveal-first reader and held/mash/touch debounce in five locales. |
| `CANVAS-OVERLAY-A11Y-26` | Dialogue/Pack/ferry lack semantic focus and announcements. | Localized DOM mirrors, focus entry/return, selected/disabled state, NVDA/VoiceOver evidence. |
| `TEXT-SCALE-01` | No 100/125/150/200% persisted scale. | Reflow every surface at 200% on desktop and phone landscape in five locales. |

## Cave census

| Space | Authored purpose | Verdict |
|---|---|---|
| A5→CV1 | Hidden descent, rubble lesson, first useful cave reward | Preserve; entry discoverability is not live-verified |
| CV1B | Optional survey/cache branch and shortcut | Meaningful optional branch |
| CV2 | Deaf System log/beacon, pockets and pre-fight rest | Meaningful evidence space |
| CV3 | GRAVEHORN, raw marble, post-forge maintenance passage | Strong story-critical payoff |
| GA1T/GA1/GA1D | TALLYMAN approach/rest/agent duel after CHIME | Runtime intent strong; authority documents stale |
| A10/GA2 chain | Alpha, pack friendship, Pack Sage/covenant | Meaningful side quest; source-gated after NULLFANG on this branch |
| A4/A14/B1 | Freed NULLFANG opens the road onward | Strong source causality; teaser contradicts location |
| SW1–SW5 | Bilge/MIREJAW traversal chain | Meaningful, but Rivet motivation can be skipped |
| GB1/GB1T/GB1D | Rivet, shell movement and UNDERTOW | Strong structure; climax behavior too generic |

Static ground coverage passes for 25 cave rooms and 1,004 columns. No uninterrupted cave route was executed, so readability, backtracking, exit discovery and reward cadence remain unverified.

## Manhwa/cinematic parity matrix

| Beat | Runtime trigger | Current art/text | Decision |
|---|---|---|---|
| Ratchet repair/letter/forge | Present | Panels and progressive reader exist | Source-consistent; live timing/focus blocked |
| Cave/marble/forge | Present | Existing pages retained | Equipment/crop certification still open |
| CHIME | `bossChime` | Redrawn `c_bell.webp` is on-model and readable | Preserve; full edition not certified |
| TALLYMAN | `sageTame_GA1D` legacy flag/name split | Text names TALLYMAN, documents often call it Sage | Authority drift P1 |
| NULLFANG meet/break/purify | Present | Existing panels/ritual retained | Phase-two body and live timing open |
| Chapter Two threshold | A14→B1 | First shot/caption shows deleted camp hatch | Replace first shot/caption only |
| Edition certification | 32 pages | All marked “Not certified for the full scene” | HOLD |
| Rivet/MIREJAW/shell/UNDERTOW | Runtime source exists | No certified bridge sequence | HOLD |

## Animation and VFX matrix

| Subject | Static/gameplay-size evidence | Runtime evidence | Decision |
|---|---|---|---|
| Hero 24-state strip | [`visual/hero-states-gameplay.png`](visual/hero-states-gameplay.png) | Blocked | On-model; weapon queue remains separate |
| Alpha whole-rider gallop | [`visual/alpha-ride-gallop-gameplay.png`](visual/alpha-ride-gallop-gameplay.png) | Blocked | Stable rider silhouette; preserve; leap/rear also preloaded |
| NULLFANG 30-cell rear sequence | [`visual/nullfang-rear-gameplay.png`](visual/nullfang-rear-gameplay.png) | Blocked | Rise/swats/slam/recovery read coherently; 30/30 anchors restored |
| MIREJAW roll | [`visual/mirejaw-roll-gameplay.png`](visual/mirejaw-roll-gameplay.png) | Blocked | Pose changes/eye occlusion prove per-cell authority is required |
| MIREJAW turn | [`visual/mirejaw-turn-gameplay.png`](visual/mirejaw-turn-gameplay.png) | Blocked | Same 14-cell anchor gap; no invented points added |
| Ordinary infected eyes | Red, finite 1.5 s ±25%, world-space, capped | Blocked | Source-strong |
| Infected guardian eyes | Purple, same bounded ownership | Blocked | Source-strong; NULLFANG rear fixed |
| Clean Alpha/Eye constructs | Explicitly no infection smoke | Source contract pass | Fixed |
| Hit feel/purification | Flash, fragments, knockback, recoil, shake, hit-stop, rumble and ritual source present | Blocked | Professional feel not certified without live input/audio/haptics |

## Before/after patch list

| Before on `main` | After on review branch |
|---|---|
| Alpha offered after forge from three paths | All paths wait for purified NULLFANG |
| Quest hand-in mutates/persists/rewards across several steps | Clone/apply/single checked persist/rollback; presentation after commit |
| Done forge/harness save can miss its unique reward | Idempotent migration repairs sword/mount entitlement |
| Voluntary remount resets stamina | Same summoned Alpha retains it |
| Alpha bow ceremony not durably marked | Flag persists when ceremony starts |
| Legacy ride ownership can lack current Pack ladder | Versioned Pack migration preserves earned capability |
| Clean Alpha/Eye constructs can emit infection optics | Explicit clean-kind oracle |
| NULLFANG rear has no eye map | 30 inspected cells restored |
| Leap/rear rider film can first-load late | All three ride sheets boot/prompt warmed |
| Cover effects consume combat RNG | Private scenery RNG only |
| Missing Chromium appears as generic test failure or false source pass | Browser dependency is detected and reported BLOCKED |

## Commands and exit status

| Command | Exit/result |
|---|---|
| `npm ci` | 0; 161 packages installed; ffmpeg-static install script warning only |
| `python3 tools/studio/test_audit.py` | 0; 8/8 pass |
| `node --check` on nine changed gameplay modules | 0 |
| Six restored `*-contract.cjs` files | 0; all pass |
| `node tests/cave-ground.cjs` | 0; 25 caves / 1,004 columns |
| `node tests/seam-route.cjs` | 0 |
| `node build.cjs` | 0; all four pages built |
| `npm run app:pack` | 0; 1,176 assets, 274.6 MB total |
| Full collector command above | 1 by design: 42 pass, 267 blocked, 0 fail/timeout |
| `git diff --check` | 0 |

Per-check logs and SHA-256 values are in `automated/results.json`. Staged browser evidence and uninterrupted evidence are intentionally not conflated.

## Release gates

1. Install a real Chromium payload and execute every browser-backed harness on the exact candidate SHA.
2. Clear or disprove `CAMPAIGN-A2-STUCK-26` with an archived ordinary-input route.
3. Align one story graph and replace the contradictory hatch teaser with a clean visual/audio ending.
4. Certify one manhwa edition and the Chapter Two bridge.
5. Empty the crystal-weapon queue and author NULLFANG phase-two bodies.
6. Resolve MIREJAW authority/pose contacts and create a distinct UNDERTOW duel.
7. Fix swept vertical collision and prove frame-rate equivalence.
8. Make Pack purchases, Ratchet restoration, shell craft and boss rewards transactional.
9. Validate finite trails, hit feel, purification, audio endings, haptics and boss camera live.
10. Validate semantic accessibility, five-locale 200% text and real controller/touch bindings.

The one implementation handoff is [`CLAUDE_PROMPT.md`](CLAUDE_PROMPT.md).
