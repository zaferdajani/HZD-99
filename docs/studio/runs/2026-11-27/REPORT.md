# CLAWBYTE Senior Studio Review — 2026-11-27

## Executive decision

**RELEASE HOLD — P1. Do not merge or deploy production.**

The latest production source contains a material terrain/grass presentation improvement and this review restores a bounded set of independently verified Chapter One safeguards. It does not clear the release gate. The repository still records an uninterrupted campaign stall in A2, the browser payload is absent, the active Chapter Two teaser contradicts the current exit route, the story authority files disagree, all 32 manhwa edition pages remain uncertified, and key boss/art/accessibility work remains incomplete.

This branch was pushed for integration review only. It was not merged and was not deployed.

## Intake, identity and branch policy

| Surface | Revision | Decision |
|---|---|---|
| Remote `main` | `21282600f88aab4c15a14d26d04f2c741a5a4606` | Latest production intake |
| Remote integration | Same tree and commit as `main` | Aligned |
| Previous studio review | `origin/codex/studio-review-2026-11-26-r2` at `d475d074` | Compared semantically; never merged wholesale |
| Bounded source fix | `7120685a6ed00d89859e34119259823b00a95db5` | Source/contracts/rebuilt pages |
| Exact audited source | `ce3753fad68372afbf78580a8e2cf5dbd6bfa8e0` | Browser-test metadata corrected before audit |
| Review branch | `codex/studio-review-2026-11-27` | Push only; no production mutation |

The previous R2 branch contains a truncated `js/game.js` tail and correspondingly unsafe generated HTML. A read-only comparison showed that the intended early-file changes were small, but the branch as a whole is not mergeable. This review reconstructed only reviewed semantic hunks over clean current `main`, added fail-closed contracts, rebuilt all four pages, and preserved current art.

## What changed since the previous review

Production added three commits after the R2 intake, representing one feature:

1. `b7f3901` — continuous ground bands, rooted grass and a staged visual harness.
2. `ce7a733` — merge commit.
3. `2128260` — ledger wording.

No quest, NPC, boss, manhwa, accessibility or story-authority P1 was changed by those commits. The terrain change is a credible source improvement, but its `ground-seamless` browser harness could not launch here.

Compared with R2:

- Restored here: browser preflight, post-NULLFANG Alpha order, atomic forge/harness hand-ins with recovery, legacy Pack migration, same-summon Alpha stamina, private NULLFANG cover RNG, Alpha bow persistence, clean-kin infection authority, NULLFANG rear eye anchors and rider boot preloads.
- Still absent from current production/review: caption backlog FIFO, centralized ferry overlay ownership, complete purification-language reconciliation, sewer-return safeguard, coordinate-sensitive tile signatures, full dynamic room-asset manifest safeguards and content-hash AAC provenance.
- Still open from R2: A2 traversal, story/manhwa authority drift, crystal-weapon queue, boss phase-two art, MIREJAW authority/contacts, UNDERTOW duel identity, frame invariance, Pack-purchase atomicity, Ratchet restoration atomicity, semantic UI and 200% text.

## Bounded fixes on this branch

| Stable ID | Source change | Verification | Status |
|---|---|---|---|
| `AUDIT-BROWSER-CLASSIFICATION-27` | Direct/transitive Playwright detection, executable/socket preflight and explicit `blocked` results. Three mislabeled hero visual tests are now browser-backed. | 8 Python collector tests pass; full collector reports no false gameplay failures. | Fixed in source |
| `ALPHA-ORDER-26` | `alpha_pack`, Ratchet talk and `alphaQuestOffer()` require `bossGlitch`. | `alpha-order-contract` pass. | Fixed in source |
| `QUEST-PAYMENT-ATOMIC-01` | Forge/harness settlement uses clone → apply → one checked persist → rollback; interrupted historical saves recover unique rewards. | `quest-payment-contract` pass, including forced persistence failure. | Fixed in source |
| `PACK-LADDER-MIGRATION-26` | Versioned, idempotent Pack migration preserves rung 1 and legacy ride owners without touching NOSTOS. | `pack-migration-contract` pass. | Fixed in source |
| `WOLF-STAMINA-RESET-26` | The same called Alpha retains stamina through dismount/remount; only a new summon starts full. | `wolf-mount-contract` pass. | Fixed in source |
| `NULLFANG-COVER-RNG-26` | Cover sound and leaf impulses use the private scenery RNG. | Static clause in `wolf-mount-contract` pass. | Fixed in source |
| `ALPHA-BOW-PERSIST-26` | The once-per-save covenant flag persists when the bow becomes visible. | `alpha-bow-persist-contract` pass. | Fixed in source |
| `ALPHA-INFECTION-ORACLE-26` | Alpha and Eye-built clean kin do not emit infection trails; infected ordinary bodies remain red and infected guardians purple. | `infection-eye-authority-contract` pass. | Fixed in source |
| `NULLFANG-REAR-EYE-27` | Restored 30 inspected `beastStudioRear` eye anchors. | Authority contract validates 30/30 cells; static gameplay-size sheet inspected. | Fixed in source; live motion blocked |
| `RIDER-PRELOAD-27` | Approved gallop/leap/rear whole-rider strips are in boot manifest and warmed at the prompt. | Mount contract pass. | Fixed in source |

No production artwork was regenerated. The approved rider, wolf, Alpha, NULLFANG, MIREJAW, hero, UI and crystal-reference assets were preserved.

## Evidence boundary

### Executed

- Locked dependency install.
- All four web builds.
- Application package: 1,154 assets, two pages, 274.2 MB.
- Full 290-harness registry through the evidence collector, plus build, package and two served-identity checks.
- 42 build/static/component checks.
- Six new source contracts plus collector unit tests.
- Static gameplay-size inspection of current rider, NULLFANG rear and MIREJAW roll/turn strips.
- Read-only review of all 15 senior responsibilities.

### Not executed

- 252 browser-backed staged harnesses.
- The `ground-seamless` gameplay-size runtime capture.
- An uninterrupted fresh-save ordinary-input playthrough.
- Keyboard/controller/physical-touch route comparison.
- Real audio mix, haptic, performance, screen-reader and 200% text validation.
- A live production/deployment comparison.

`/opt/pw-browsers/chromium` is absent and `/usr/bin/chromium` points to missing `/usr/lib/chromium/chromium`. Browser checks were therefore blocked before launch. This is infrastructure evidence, not a game failure and not a pass.

## Automated result

Exact command:

```sh
CHROMIUM_PATH=/opt/pw-browsers/chromium python3 tools/studio/audit.py \
  --profile full --output docs/studio/runs/2026-11-27/automated
```

| Result | Count |
|---|---:|
| PASS | 42 |
| BLOCKED | 252 |
| FAIL | 0 |
| TIMEOUT | 0 |
| Total checks | 294 |

The audit base is `ce3753fad68372afbf78580a8e2cf5dbd6bfa8e0`. Machine-readable evidence and per-check logs are under [`automated/`](automated/).

Important non-browser passes include build/package, repair lifecycle, combat impact contract, story opening/progression, tutorial clarity, campaign certificate logic, weapons/gear, motion sampling, dialogue audio, ledger, archive cleanup, weapon registry bookkeeping, the six new safeguards, and served-build identity at start/end.

## Fifteen senior-role verdicts

| # | Senior responsibility | Verdict | Evidence-backed decision |
|---:|---|---|---|
| 1 | Senior Cinematic Designer | **HOLD P1** | The B1 trigger is correct, but `js/panels.js:264-278` still opens with the deleted camp hatch and `js/text-manhwa.js:78` narrates it. Fade/audio/skip/replay are blocked. |
| 2 | Senior Game Designer — Player Systems | **HOLD P1; source-strong** | The opening is authored as a forward one-action tutorial, and `tutorial-clarity` passes. `docs/OWNER_ORDERS.md:329-335` still records the fresh campaign stuck in A2. |
| 3 | Senior Mission Designer — Quest Craft | **CONDITIONAL IMPROVEMENT / HOLD P1** | Alpha now follows NULLFANG and caves have differentiated source payoffs. The five-rung covenant still lacks enough post-NULLFANG narrative consequence and live proof. |
| 4 | Principal Encounter Designer | **CONDITIONAL IMPROVEMENT / HOLD P1** | Wolves have authored display/feint/flank/commit behavior and a called-wolf bite promise. All fairness tests remain 60 Hz source/staged logic. |
| 5 | Senior Boss Designer | **HOLD P1** | NULLFANG is substantive, but phase two is recolored phase-one art. MIREJAW contacts are state/rectangle based and UNDERTOW remains a generic Sage duel. |
| 6 | Senior Mission Designer — Campaign | **HOLD P1** | Owner canon is GRAVEHORN → CHIME → TALLYMAN → NULLFANG; several scripts/docs/tests still certify Sage/keeper before CHIME. |
| 7 | Senior Mission Producer | **HOLD P1** | Provenance and evidence are pinned; R2 was reconciled safely. A2 and runtime gates prevent release. |
| 8 | Senior Character Artist | **CONDITIONAL ASSET PASS / HOLD P1** | Rider film is coherent at gameplay size and unchanged by blob. Twenty-five crystal-weapon strips plus three air variants remain unfinished; NULLFANG phase-two bodies remain absent. |
| 9 | Senior Cinematic Director | **HOLD P1** | All 32 `manhua/edition.json` pages remain “Not certified for the full scene”; Chapter Two has no certified A4/A14/B1, Rivet, MIREJAW, shell or UNDERTOW bridge. |
| 10 | Senior VFX Artist | **SOURCE-STRONG / HOLD P1** | Finite 1.5-second trails, cleanup, quality caps and reduced motion are authored. Clean-kin authority and NULLFANG rear anchors are fixed here; MIREJAW has 30 unanchored roll/turn cells and unresolved infection authority. |
| 11 | Senior Technical Director — World Systems | **CONDITIONAL IMPROVEMENT / HOLD P1** | Continuous terrain bands/rooted grass materially improve source presentation. Runtime proof is blocked and destination-row vertical collision can tunnel on long frames. |
| 12 | Senior Gameplay Engineer — Combat | **HOLD P1** | Combat contract passes; hit feel, boss tells, audio, haptics and frame invariance are not live-certified. |
| 13 | Senior Gameplay Engineer — Mission | **HOLD P1** | Alpha order, forge/harness settlement and Pack migration are guarded here. Pack purchases and full Ratchet restoration remain non-atomic. |
| 14 | Senior Gameplay Engineer — NPC | **CONDITIONAL SOURCE PASS / HOLD P1** | Ratchet lifecycle and `sageWalk8` friendly movement are authored; the full repair-to-reward sequence and live post-purification walk remain unverified. |
| 15 | Lead UI Engineer | **HOLD P1** | Reveal/RTL/binding abstractions are strong in source. Pack/ferry remain canvas-only without semantic focus, 200% text, reveal-first ferry, binding-aware tree hint or reduced-motion-safe selection. |

## Story, tutorial and campaign findings

### `CAMPAIGN-A2-STUCK-26` — P1

The repository records that `tests/campaign-ch1.cjs` became stuck in A2 at 4:24 and could not find A5 (`docs/OWNER_ORDERS.md:329-335`). No current commit changes A2 topology or transition logic. The new terrain renderer cannot close this finding.

Acceptance: archive one exact-SHA fresh-save W1→W2→A0B→A0→A1→A2→A5→CV1→CV1B→CV2→CV3 run using ordinary input only, no injected inventory/flags/rooms/teleports, with keyboard, controller and physical touch variants plus reload checkpoints.

### `STORY-AUTHORITY-DRIFT-26` — P1

`docs/STORY_CANON.md:112-120` and owner orders require GRAVEHORN → CHIME → TALLYMAN → NULLFANG. `docs/STORY_SCRIPT.md`, `docs/CAVES_CH1.md`, `docs/CHAPTER_ONE_CAMPAIGN.md`, `docs/studio/roles.json`, `tests/script-route.cjs` and parts of `docs/STORY_SHEET.md` retain the superseded keeper/Sage-before-CHIME history. Some static tests pass precisely because they assert the obsolete route.

Acceptance: one machine-readable story graph and all player-facing documentation/tests agree that TALLYMAN is the Eye’s agent, never a Sage/keeper, and follows CHIME.

### `K1-EXIT-PANEL-CONTINUITY-26` — P1

The correct trigger is the A14→B1 crossing, but the first teaser shot is `game/hatch` with the caption “The hatch above the camp stood open.” That route no longer exists.

Acceptance: replace only the first teaser image/caption with approved A4 door or A14 frontier-road art; preserve the three threat panels and title card; verify crossing, replay, skip, reload, landing and music/fade continuity.

### Opening clarity

Source currently gives a coherent forward chain: wake → move → exit → jump → first fight → gate → booth → letter/drawer → repair → Ratchet gift → pod/heal/burst → monument → meadow. `tutorial-clarity` passes. This is not an uninterrupted playthrough certificate.

## Cave census

| Space | Authored purpose | Decision |
|---|---|---|
| A5→CV1 | Hidden descent, cave mouth and entry lesson | Preserve; route into it is unverified |
| CV1B | Optional rubble/survey branch, cache and deferred upgrade | Meaningful optional branch |
| CV2 | Deaf System beacon/founding log, pockets and pre-fight pod | Meaningful evidence space |
| CV3 | GRAVEHORN, raw marble and return | Strong story-critical payoff |
| GA1T/GA1/GA1D | TALLYMAN approach/rest/duel after CHIME | Runtime intent good; authority files stale |
| A10R/A10 | Wolf road, den, covenant and Pack origin | Meaningful sidequest, now source-gated after NULLFANG |
| A4/A14/B1 | Freed NULLFANG opens the route to Chapter Two | Strong source causality; teaser contradicts it |
| SW1–SW5/SW3 | Bilge and MIREJAW chain | Meaningful, but Rivet causality can be skipped |
| GB1/GB1T/GB1D | Rivet, shell traversal and UNDERTOW | Strong structure; climax behavior too generic |

The cave concept is not redundant in source. The unresolved problem is player-readable causality and uninterrupted navigation proof.

## Manhwa and cinematics

- 32/32 edition pages say “Not certified for the full scene.”
- Chapter Two manhwa production is not begun beyond a teaser.
- The runtime has no certified illustrated A4 door/A14 road/B1 threshold, Rivet, MIREJAW, shell or UNDERTOW bridge.
- Dialogue and scene readers reveal progressively in source; ferry text and caption overflow do not yet obey the same safe model.

Acceptance: pin exactly one approved edition and certify cast identity, room, action, equipment timing, spoiler timing, crop and corresponding gameplay behavior for every runtime panel.

## Character art, animation and VFX

### Gameplay-size static inspection

- [`visual/alpha-rider-gameplay-size.png`](visual/alpha-rider-gameplay-size.png): all 15 gallop, 10 leap and 11 rear cells at approximately current gameplay draw height. The whole-rider silhouette is coherent, the hero does not duplicate, and the rider remains registered to the Alpha across the cycles. Preserve these assets.
- [`visual/nullfang-rear-gameplay-size.png`](visual/nullfang-rear-gameplay-size.png): 30-cell rise/swats/slam/recovery reads coherently. The restored eye map accounts for all 30 cells. Live floor registration, timing and smoke remain blocked.
- [`visual/mirejaw-unanchored-poses-gameplay-size.png`](visual/mirejaw-unanchored-poses-gameplay-size.png): the 16 roll and 14 turn cells visibly expose/occlude eyes through changing poses, but no per-cell infection anchors exist. This is an observable VFX gap, not a theoretical manifest issue.

The current rider blobs are identical to R2. No approved image needed regeneration in this run.

### Remaining art/VFX P1

| ID | Evidence and consequence | Acceptance |
|---|---|---|
| `CRYSTAL-WEAPON-CANON-26` | `weapon-canon` passes registry bookkeeping while reporting 25 queued wrong-weapon strips and missing `swingAirSingle/Dual/Joined`. | Re-fire only registered states from approved crystal references; empty queue/missing list and gameplay-size contact sheets. |
| `NULLFANG-PHASE2-ART-01` | Phase two applies a grade to phase-one bodies. | Authored damaged/vented idle, prowl, primary, leap/land and hurt/recovery bodies. |
| `MIREJAW-INFECTION-AUTHORITY-01` | Generic Boss logic treats MIREJAW as infected, but canon does not decide clean versus infected. | Decide authority, then align optics, dialogue, resolution and reward. |
| `MIREJAW-EYE-POSE-GAP-26` | 196/226 cells are mapped; all 16 roll and 14 turn cells are missing. | If infected, account for all 226 cells with explicit occlusion; if clean, suppress optics consistently. |

## Boss and combat findings

| ID | Evidence and consequence | Acceptance |
|---|---|---|
| `UNDERTOW-DUEL-COVERAGE-25` | GB1D spawns a generic Sage duel despite distinct Undertow art. | At least three sewer/current-specific telegraphed moves, fair counters/recovery, shell interaction, unique audio/VFX and atomic purification/reward. |
| `MIREJAW-WEAKPOINT-SPATIAL-01` | Every hit during leap receives the belly bonus; visible region is not tested. | Facing/frame-aware belly region with positive/negative contacts. |
| `MIREJAW-TAIL-SYNC-01` | Tail damage uses fixed state/time proximity rather than the visible tail cell. | Pose-aware swept early/contact/recovery region. |
| `FRAME-INVARIANCE-22` | Wolf, Alpha, mount, MIREJAW and NULLFANG harnesses step at 1/60 only. | Equivalent tells, contacts, hit counts, stamina and RNG at 30/60/120 Hz plus long spikes. |
| `RUNTIME-EVIDENCE-01` | Browser gameplay never launched. | Exact-commit staged suite plus continuous encounters with keyboard/controller/touch, audio, haptics and captures. |

The production combat contract confirms basic damage/armor, charged contact, bounded VFX/logging and weapon multipliers. It does not certify professional feel.

## Mission, NPC and persistence findings

| ID | Evidence and consequence | Acceptance |
|---|---|---|
| `PACK-PURCHASE-ATOMIC-26` | Shop deducts at `js/game.js:4195-4198`; `ptBuy()` mutates and persists separately at `js/packtree.js:50-56`. | One checked transaction per rung/ride; rollback, re-entry lock, double-confirm, reload and forced-failure tests. |
| `NPC-ATOMIC-01` | Battery consumption, Ratchet wake/release, kit/spare/Pack grant and quest activation cross persistence boundaries. | One idempotent versioned transaction or recoverable checkpoint migrations with failpoint tests. |
| `K2-SEWER-QUEST-ORDER-25` | MIREJAW can be discovered/defeated before Rivet. | Gate it or author a complete early-discovery path with exactly-once craft/reward. |
| `BOSS-REWARD-ATOMIC-22` | Named boss flags and unique rewards can settle separately. | Idempotent per-boss transactions with failure/reload tests. |

Purified Sage walking is correctly authored with `sageWalk8` while moving and `sagePure` while idle. Live purify → leave → reload → revisit motion remains blocked.

## World, UI and accessibility findings

| ID | Evidence and consequence | Acceptance |
|---|---|---|
| `TERRAIN-SEAM-RUNTIME-27` | Ground bands and grass roots are source-improved; `ground-seamless` could not launch and its body-seam samples are concentrated in W2/A rooms. | Exact-commit captures across A/B/C/D/E/X/NOSTOS and representative indoor/deck/teeth/loose-rock cases at phone and desktop sizes. |
| `WORLD-FALL-01` | `moveEnt()` checks only the destination row after vertical integration (`js/entities.js:617-652`), so long frames can tunnel. | Sweep every crossed row while preserving one-way behavior; prove 30/60/120 Hz and spike equivalence. |
| `SCENE-CAPTION-FIFO-26` | `sceneCaption()` shifts the oldest visible line after three (`js/overlay.js:229-233`), deleting unread story. | Three visible plus FIFO backlog; no loss; reset/read/shown account for backlog. |
| `FERRY-OVERLAY-OWNERSHIP-26` | `OVERLAY_STATES` omits FERRY and `k2FerryOpen()` writes `G.state` directly. | Register/queue FERRY and prove deterministic overlap handling. |
| `FERRY-TEXT-REVEAL-01` | Ferry question paints fully and confirm can choose immediately. | Shared reveal-first reader and held/mash/touch debounce in five locales. |
| `CANVAS-OVERLAY-A11Y-26` | Dialogue/Pack/ferry/cards lack a complete semantic focus mirror. | Localized DOM semantics, focus entry/return and NVDA/VoiceOver proof. |
| `TEXT-SCALE-01` | No persisted 100/125/150/200% scale; Pack/ferry use fixed canvas type. | Rewrap every surface at 200% on 960×540 and phone landscape in five locales. |
| `TREE-BINDING-HINT-27` | Pack hint does not name remapped keyboard/pad/touch controls. | Live binding-aware localized hint. |
| `TREE-REDUCED-MOTION-27` | Selected socket opacity pulses with `Math.sin(now * 5)` regardless of reduced motion. | Static high-contrast selection under reduced motion; two-frame equality contract. |

## Required uninterrupted real-input validation

1. Fresh save: wake → movement/jump/combat → booth/repair → Ratchet gift → pod → winch.
2. A2 descent → A5/CV1 → CV1B → CV2 beacon → CV3 GRAVEHORN/raw marble → return and atomic forge.
3. CHIME → TALLYMAN → NULLFANG ambush/purification → friendly walk/roar → A4 door → A14 road → B1.
4. Rivet → Bilge → MIREJAW → shell → UNDERTOW.
5. Post-NULLFANG Alpha offer → covenant → Pack ladder → called wolf → called Alpha/howl.
6. Patch harness → ride purchase/reload → gallop/leap/scratch/howl → dismount/remount → exhaustion.

Archive exact SHA, timestamps, device, viewport, locale, save/reload points, screenshots/clips, console/page errors, audio/haptic notes, and whether each artifact is staged or uninterrupted.

## Release gates

1. Clear the browser/runtime gate and the recorded A2 traversal failure.
2. Align story authority and replace the contradictory hatch teaser.
3. Certify one manhwa edition and Chapter Two bridge.
4. Finish canonical crystal-weapon strips and authored boss phase-two bodies.
5. Resolve MIREJAW authority/pose contacts and author a distinct UNDERTOW duel.
6. Fix swept collision and prove frame-rate equivalence.
7. Make Pack purchases, Ratchet restoration and boss rewards transactional.
8. Validate hit feel, finite trails, purification, audio endings, haptics and camera live.
9. Validate semantic accessibility, 200% text and binding-aware prompts.
10. Require all builds/package, staged registry and uninterrupted route to pass on the exact candidate SHA before merge or deployment.

The single implementation handoff is [`CLAUDE_PROMPT.md`](CLAUDE_PROMPT.md).
