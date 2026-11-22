# CLAWBYTE Senior Studio Review — 2026-11-22

## Executive decision

**RELEASE HOLD — P1.** Seven commits landed on `main` after the previous review baseline and they contain substantial work worth preserving. NULLFANG now has a strong authored rear/swats/slam signature move, recorded lion vocal banks and clearer purification staging. Kingdom Two gained the Silt Mire, Bilge's ferry choice, a traversal errand, an optional cache, MIREJAW, a vault seal and rear-facing gate traversal. The purification film now fades both picture and audio correctly; the previous hard-cut complaint is not reproduced in the current encoded asset.

The game still does not follow the owner's Chapter One causality. Runtime and its passing route certificates enforce `GRAVEHORN -> forge -> Eye agent -> CHIME -> NULLFANG`; canon requires `GRAVEHORN -> NULLFANG -> optional clean Wolf King covenant -> pack-controlling Eye agent`. Alpha is offered immediately after forging and is still described as corrupted/purifiable. A passing campaign contract therefore proves a superseded storyline consistently rather than proving the owner's storyline.

This review restored the bounded fixes that had not been integrated from the November 21 review and preserved all newer work: unread-caption FIFO, five-language PURIFY/PURIFIED copy and localized accessibility text, explicit infection authority, atomic quest/forge settlement, coordinate-sensitive terrain caches and truthful browser preflight. It also fixed the new Kingdom Two order gate, the ferry's overlay ownership, Alpha's once-per-save bow, complete cold preloads for dynamically selected agent/MIREJAW motion families, and the missing AAC delivery tier for all 159 OGG cues.

The full registry reports **42 PASS, 233 BLOCKED, 0 FAIL and 0 TIMEOUT** across 275 checks. This is not a release pass. Chromium could not create its process socket in this environment, so no browser-backed staged assertion executed. No uninterrupted ordinary-input campaign, physical phone/touch/controller, perceptual mix/haptic, screen-reader or large-text run was performed.

This is a review branch only. **Nothing was merged to `main`, mirrored to `odyssey` or deployed.**

## Pins and branch safety

| Item | Value |
|---|---|
| Repository | `zaferdajani/HZD-99` |
| Intake `main` | `03990f335cef6573b41097e1b77494a153fd82fc` |
| Intake tree | `b9bd5dd5fce35e0c091d3c51beacced227f5baa8` |
| Intake `odyssey` | Same commit and tree as `main` |
| Intake integration branch | `claude/clawbyte-repo-migration-byhyl8`, same commit and tree |
| Previous review | `codex/studio-review-2026-11-21` at `356149cb594403efd49703569587a261d88aaee2`; not an ancestor of `main` |
| Review branch | `codex/studio-review-2026-11-22` |
| Bounded-fix/audit content tree | `13f5a48d99258214e1f218a2923812058a2c716b` |
| Rebuilt-page content tree | `1f411698e07b8410a8e4af57039573891fa99499` |
| Production/live verification | Not performed; no deployment claim |

The branch began at exact `origin/main`. Git credential-less transport required publishing through the connected repository API; the audit and rebuilt-page tree hashes above are transport-independent verification targets. No approved hero, agent, Alpha, wolf, gate, MIREJAW or first-stage NULLFANG raster was regenerated.

## Comparison with the 2026-11-21 report

### Material improvements on `main`

- NULLFANG's 30-cell rear/swats/slam strip is on-model, readable and worth preserving. Phase two also gains recorded lion roars, a red rage grade and faster dash logic.
- Purification now clears hurt residue, stages both actors on the floor, faces them, uses the hero's own sword art and clamps the camera.
- `purify_glitch_ritual.mp4` is 1280x720, 24 fps, 13.25 seconds. Picture reaches black from approximately 12.833 seconds and audio is effectively silent after 12.25 seconds. Preserve this ending.
- Silt Mire is a meaningful quest area: Bilge offers payment or a pole-recovery errand; SW5 teaches traversal; SW4 contains an optional cache; SW3 pays Vault Seal II through MIREJAW.
- MIREJAW has a cohesive professional base model and ten authored strips: idle, walk, swim, bite, leap, roll, tail slam, bellow, hurt and down.
- The gate climb/hop set covers bare, single, dual and joined loadouts from the rear without losing the hero's identity.
- Purified agents retain their authored walk system rather than sliding while asleep.

### Regressions or missing integration

The November 21 review branch was not integrated. Exact `main` therefore again lacked:

1. scene-caption FIFO;
2. five-language PURIFY/PURIFIED and localized ritual accessibility copy;
3. atomic quest/forge settlement and completed-without-Purifier migration;
4. explicit clean/infected eye authority;
5. executable/AF_UNIX browser preflight and truthful blocked classification.

All five are restored here without reverting the seven newer commits.

### Newly exposed findings

| Stable ID | Severity | Finding |
|---|---:|---|
| `K2-ORDER-GATE-22` | P1 | CARRIER alone unlocked UNDERTOW before MIREJAW; fixed here by requiring the MIREJAW proof flag. |
| `K2-MANHWA-PARITY-22` | P1 | The authoritative story script has no Bilge, Silt Mire, MIREJAW, three-seal vault or UNDERTOW road. |
| `K2-SAGE-SEMANTICS-22` | P1 | Prism Prowler is described as clean/never infected and then “purified,” contradicting the central ritual premise. |
| `BOSS-REWARD-ATOMIC-22` | P1 | Alpha and MIREJAW can persist the boss flag before the unique Pack arm/seal is safely published. |
| `MIREJAW-ROLL-ART-01` | P1 visual | The signature death roll is cut from down footage; it partly turns belly-up and snaps back rather than rotating longitudinally. |
| `MIREJAW-TAIL-SYNC-01` | P1 visual/combat | Tail lift/contact frames do not align with the active damage, sound, shake and wave. |
| `INFECTION-ANCHOR-1122` | P1 VFX | NULLFANG's new rear strip has no measured eye anchors, so infection glow/trail disappears during the signature move. |
| `MIREJAW-INFECTION-AUTHORITY-01` | P1 narrative/VFX | MIREJAW is not established as infected or clean, yet generic boss logic gives it purple infection treatment and it has no purification path. |
| `MIREJAW-WEAKPOINT-SPATIAL-01` | P2 | Every coordinate takes full damage during leap, not only the visible belly. |
| `MIREJAW-HITBOX-22` | P2 | Rendered body is about 405x190 but its general hurt box is 300x64; direct-damage tests bypass real swing reach. |
| `FRAME-INVARIANCE-22` | P2 | MIREJAW tests run only at 60 Hz and pose animation uses wall clock, so pause/rate invariance is unproven. |
| `FERRY-TEXT-REVEAL-01` | P2 | Ferry choice presentation does not use the shared letter-by-letter reveal policy. |
| `FERRY-A11Y-01` | P2 | Ferry choice lacks the semantic/focus behavior expected of a full-screen decision surface. |

## Bounded fixes implemented in this review

| Fix | Verification |
|---|---|
| Scene-caption FIFO | Three visible captions plus FIFO waiting lane; all unread lines survive and promote in order; contract passes. |
| Purification language | PURIFY/PURIFIED in English, Arabic, Turkish, Chinese and Russian; localized ARIA; contract passes. |
| Infection authority | Infected ordinary enemies red; infected guardians/agents purple; clean Alpha/GRAVEHORN/PRISM/instruments none; source contract passes. Live capture remains blocked. |
| Atomic quest/forge settlement | Clone/publish/rollback, idempotent presentation and legacy repair; failpoint contract passes. |
| Terrain bake signature | Stable sorted broken-cell coordinates replace count-only cache key; contract passes. |
| Kingdom Two gate | B6/GB1T remain locked until MIREJAW, which is reachable only after CARRIER; source and staged test assertion updated. Browser execution blocked. |
| Ferry overlay ownership | `FERRY` joins centralized overlay states and opens through `overlayRequest`; contract passes. |
| Alpha ceremony persistence | `alphaBowed` persists at the moment the bow begins; contract passes. |
| Cold motion preloads | Complete dynamic families for all seven agents and all MIREJAW strips; manifest contract passes. |
| AAC tier | Generated/rebuilt 159 indexed AAC derivatives, including Alpha, material impacts, NULLFANG lion and swamp/MIREJAW banks; `aactier --check` passes. |
| Audit truthfulness | Direct and transitive browser checks classify as blocked when executable/AF_UNIX launch is unavailable; 8/8 audit unit tests pass. |

## Automated evidence

### Build, package and deterministic checks

| Check | Result |
|---|---|
| `npm ci` | PASS — 161 packages installed |
| `npm run build` | PASS — index 5.41 MB, odyssey 4.19 MB, forge 5.43 MB, forge-odyssey 4.21 MB |
| `npm run app:pack` | PASS — 1,097 assets (263.7 MB) plus two pages (9.6 MB), 273.3 MB |
| `python3 -m unittest tools.studio.test_audit` | PASS — 8/8 |
| Eight review contracts | PASS — captions, language, infection, quest, tiles, preloads, ferry, Alpha bow |
| `node tests/tails.cjs` | PASS — 154 one-shots measured, six loops skipped; hottest tail -35.6 dB |
| `node tools/aactier.cjs --check` | PASS — 159 files |
| `node tests/campaign-contract.cjs` | PASS, but certifies the obsolete graph |
| `node tests/script-route.cjs` | PASS, and prints `forge < sage < CHIME < NULLFANG`; negative canon evidence |

### Full registry

```sh
CHROMIUM_PATH=/usr/bin/chromium python3 tools/studio/audit.py \
  --profile full --output docs/studio/runs/2026-11-22/automated
```

| Result | Count |
|---|---:|
| PASS | 42 |
| BLOCKED | 233 |
| FAIL | 0 |
| TIMEOUT | 0 |
| Total | 275 |

`complete_requested_scope` is true because every registered check received a result. `passed` is false because blocked evidence is not success. Chromium failed before page creation with `socket() failed: Operation not permitted (1)`. No rendered assertion was counted as a pass.

Evidence hashes:

- `automated/results.json`: `543a8060a9a2a4cc43d5b735ffcd710e5d75dd81d7217044b9de969db725b8a0`
- `automated/AUTOMATED.md`: `af8b452e262817692ccf504a5786c3e6d639171a1a9d3723554119b50bc44b5e`
- `visual-gameplay-size-sample.png`: `1b29e4519186de83e6f41cca5e7166183fdf7f9406e0fa7e39e03c3397df0fd4`

### Staged versus uninterrupted evidence

| Evidence class | Status | What it proves |
|---|---|---|
| Source/headless contracts | Completed | Deterministic language, transaction, manifest, audio, data and route invariants |
| Browser/staged encounter checks | Blocked before page creation | Test designs exist; no current rendered assertion executed |
| Stored assets at gameplay size | Inspected | Model, pose, silhouette and panel continuity; not live timing/integration |
| Uninterrupted ordinary-input campaign | **Not run** | No reachability, clarity, difficulty, save/retry or recovery certificate |
| Physical phone/touch/controller/audio/haptics | **Not run** | No hardware, mix, latency or perceptual certificate |
| Screen reader/RTL/CJK/200% typography | **Not run** | No accessibility certificate |

## Fifteen-role review matrix

| # | Senior responsibility | Verdict | Highest-value evidence |
|---:|---|---|---|
| 1 | Cinematic Designer | HOLD P1 | Purification staging/film improved; campaign order and pre-forge sword panel remain wrong. |
| 2 | Game Designer — Player Systems | CONDITIONAL SOURCE PASS / HOLD P1 | Tutorial contracts are coherent; Pack authority, campaign state and device/accessibility proof are not. |
| 3 | Mission Designer — Quest Craft | HOLD P1 | Silt Mire is meaningful; Alpha premise/timing still contradict canon. |
| 4 | Principal Encounter Designer | CONDITIONAL SOURCE PASS / HOLD P1 | MIREJAW has a distinct kit; weak-point geometry, cold/live proof and fair-play evidence remain. |
| 5 | Boss Designer | MECHANICS SOURCE PASS / HOLD P1 | NULLFANG choreography improved; phase bodies, Alpha canon and live fairness remain. |
| 6 | Mission Designer — Campaign | HOLD P1 | Kingdom Two road improved; Chapter One graph still certifies the wrong story. |
| 7 | Mission Producer | HOLD P1 | Seven new commits preserved and bounded fixes verified; no runtime certification. |
| 8 | Character Artist | CONDITIONAL ASSET PASS / HOLD P1 | NULLFANG rear, gate movement and MIREJAW base are strong; death roll/tail sync/phase bodies are not. |
| 9 | Cinematic Director | HOLD P1 | Film ending is resolved; manhwa authority and live ritual chain remain uncertified. |
| 10 | VFX Artist | STRONG FINITE SYSTEM / HOLD P1 | Trail lifetime/caps/cleanup are good; missing anchors and MIREJAW authority are P1. |
| 11 | Technical Director — World | HOLD P1 | New room graph is purposeful; fast vertical fall still probes only the final crossed row. |
| 12 | Gameplay Engineer — Combat | CONDITIONAL SOURCE PASS / HOLD P1 | Boss kits and finite VFX are authored; hitbox/rate/live evidence gaps remain. |
| 13 | Gameplay Engineer — Mission | HOLD P1 | Quest settlement and K2 gate are fixed here; boss rewards and canonical graph are not atomic/aligned. |
| 14 | Gameplay Engineer — NPC | IMPROVED SOURCE / HOLD P1 | Purified walks work; Ratchet/Servo restoration still spans multiple persistence boundaries. |
| 15 | Lead UI Engineer | HOLD P1 | Caption/ferry ownership improved; text scale, panel semantics and device proof remain open. |

## Prioritized findings

| Stable ID | Severity | Player consequence / evidence | Acceptance condition | Status |
|---|---:|---|---|---|
| `CAMPAIGN-GRAPH-01` | P1 | Runtime/tests still run forge -> agent -> CHIME -> NULLFANG | One canonical state graph across gates, goals, dialogue, panels, Continue/migrations and tests; ordinary-input Alpha skip/complete routes | Open |
| `ALPHA-SEMANTICS-01` | P1 | Clean optional Wolf King is called corrupted/purifiable and appears before NULLFANG | Post-NULLFANG territorial covenant; no infection/purification premise; pack-controlling agent reveal | Open |
| `PACK-AUTHORITY-DRIFT-21` | P1 | Runtime gifts Volt Pack; canon/sheet/machine JSON still require a 12-scrap purchase | One owner-approved flow, exactly-once reward, clean/legacy save migration | Open |
| `K2-MANHWA-PARITY-22` | P1 | Major playable swamp arc has no authoritative script/manhwa counterpart | Pin story edition and map every new beat/prop/room/reward to runtime keys before new panels | Open |
| `K2-SAGE-SEMANTICS-22` | P1 | Clean Prism Prowler is “purified” | Choose one infection state; sheet, dialogue, VFX, reward and tests agree | Open |
| `R-MARBLE-CONTINUITY-01` | P1 visual story | Pre-forge panel visibly shows a completed sword/hilt over raw crystal | Bounded repaint to raw deposit or clearly schematic future-plan inset; blind review sees “material, not weapon” | Open |
| `MANHWA-AUTH-01` | P1 | Runtime mixes visual editions while no complete page set is certified | Pin one edition; certify identity, equipment, room, action, spoiler timing and crop for each used panel | Open |
| `NULLFANG-PHASE2-ART-01` | P1 visual | Rear move is excellent, but common phase-two states reuse phase-one body | Preserve rear; add only phase idle/prowl, primary attack, leap/land and hurt/recover damaged/vented variants | Open |
| `GRAVEHORN-PHASE2-ART-01` | P1 visual | Escalation is lighting over phase-one plates | Authored opened-plate/molten/vented body/head and live transition capture | Open |
| `MIREJAW-ROLL-ART-01` | P1 visual | Signature death roll is repurposed down footage and snaps | One longitudinal snout-to-tail rotation take, clean loop/release and visible quarter-turn damage beats | Open |
| `MIREJAW-TAIL-SYNC-01` | P1 combat art | Tail contact does not match damage/sound/wave | Map visible lift to warning and descending contact to active frame, or replace only the strip | Open |
| `INFECTION-ANCHOR-1122` | P1 VFX | NULLFANG loses infection eye/trail during new rear move | Measured per-cell anchors for all 30 rear cells; contract covers every infected render key | Open |
| `MIREJAW-INFECTION-AUTHORITY-01` | P1 narrative/VFX | Creature receives purple infection treatment without defined story status or purification | Explicit clean/infected ruling, matching optics/dialogue/ledger/resolution and anchors if infected | Open |
| `WORLD-FALL-01` | P1 | Fast fall can cross an intermediate floor because only final row is probed | Sweep all crossed rows; identical player/enemy/boss contact at 30/60/120 Hz plus 1/30 spike | Open |
| `BOSS-REWARD-ATOMIC-22` | P1 | Crash can save dead boss without Pack arm or unique seal | Clone/publish once; migrations repair partial Alpha/MIREJAW states; failpoint/page-reload matrix | Open |
| `NPC-ATOMIC-01` | P1 | Cell use, awake flag and gifts persist separately | One idempotent transaction per NPC, VFX after successful publish, legacy partial-state repair | Open |
| `QUEST-PAYMENT-ATOMIC-01` | P1 | Interrupted forge could consume material without Purifier | One cloned publish, rollback, migration and duplicate-callback contract | **Fixed/tested here** |
| `SCENE-CAPTION-01` | P1 | Fast fourth line could erase unread story | Visible-three FIFO, read/shown/reset semantics | **Fixed/tested here** |
| `PURIFICATION-LANGUAGE-01` | P1 | Free/release vocabulary contradicted ritual canon | Five-language PURIFY/PURIFIED and localized ARIA | **Fixed/tested here** |
| `INFECTION-AUTHORITY-01` | P1 | Clean rivals/constructs could emit purple virus smoke | Explicit authority and finite cleanup; live infected/clean capture | **Source fixed/tested; live blocked** |
| `K2-ORDER-GATE-22` | P1 | UNDERTOW could precede MIREJAW | CARRIER alone cannot enter B6 ring; MIREJAW wakes it; Continue preserves gate | **Source fixed; browser blocked** |
| `AAC-TIER-22` | P1 mobile | 159 OGG cues lacked current indexed AAC parity | Complete indexed derivatives and packaged delivery | **Fixed/tested; device blocked** |
| `RUNTIME-EVIDENCE-01` | P1 gate | No current browser, uninterrupted or physical-device proof | Exact-commit recordings and ordinary-input/device/accessibility matrices | Blocked |
| `MIREJAW-WEAKPOINT-SPATIAL-01` | P2 | Armored back/head take belly damage during leap | Local-space belly ellipse in both facings and early/mid/late leap samples | Open |
| `MIREJAW-HITBOX-22` | P2 | Visible jaws/belly may lie outside general hurt box | Pose-aware hurt region; real swing tests hit visible body and miss outside silhouette | Open |
| `FRAME-INVARIANCE-22` | P2 | 60 Hz-only tests and wall-clock poses | Simulation animation clock; 30/60/120 Hz + spike/pause matrix | Open |
| `ALPHA-PACK-BOW-ART-01` | P2 visual | Pack crouch reads as stalking, not allegiance | Add only `wolfBow`, readable around 50 px gameplay height | Open |
| `CAVE-VARIETY-01` | P2 | Later grotto families still repeat terminal/bat/scrap/agent grammar | Each kingdom gets a distinct verb, evidence, payoff, transformation and callback | Partially improved by Silt Mire |
| `OVERLAY-OWNERSHIP-01` | P2 | Remaining direct overlays can overtake story information | One priority/coalescing acquisition API and simultaneous-request harness | Open |
| `DIALOG-SHOT-A11Y-01` | P2 | In-game canvas panels have no semantic alternative | Localized concise description announced once; visual duplicate decorative | Open |
| `TEXT-SCALE-01` | P2 | No persisted 100/125/150/200% typography scale | Shared wrapping/layout scale with desktop/phone/RTL/CJK captures | Open |

## Owner story and campaign authority

The required Chapter One causality remains:

1. GRAVEHORN guards the raw marble repository.
2. Ratchet forges the Purifier from the earned raw marble.
3. NULLFANG is the first corrupted Sage/guardian and is purified.
4. Alpha is an optional clean territorial covenant after NULLFANG.
5. Alpha's covenant exposes the infected pack-controlling Eye agent.

Do not “fix” this by changing only a test or one line of dialogue. Runtime gates, objectives, NPC offers, map rewards, panels, save/Continue migration and certificates must move together.

## Cave and quest census

| Space | Current purpose | Decision |
|---|---|---|
| A5/A7/CV1/CV1B/CV2 | Puzzle, upgrade, survey/evidence, permanent rewards and beacon | Meaningful; preserve |
| CV3 | GRAVEHORN, raw marble and return passage | Strong and story-critical |
| GA1T/GA1/GA1D | Tunnel/rest/TALLYMAN | Meaningful content, wrong campaign position/name authority |
| A10R/A10 | Wolf road, sealed Alpha challenge, covenant/pack reward | Meaningful optional topology, wrong timing and infection premise |
| SW1 | Bilge and ferry; 600-scrap choice or pole errand | Meaningful |
| SW5 | Hazard traversal using NULLFANG dash; recover pole | Meaningful |
| SW2 | Reedbank hub, save bench and route split | Meaningful |
| SW4 | Optional high-roost cache | Meaningful optional branch |
| SW3 | MIREJAW and Vault Seal II | Meaningful and story-critical; art/combat findings remain |
| GB1/GC1/GD1/GX1/GE1 families | Repeated grotto/tunnel/deep-agent grammar | `CAVE-VARIETY-01` remains P2 |

## Character, animation, VFX and cinematic decisions

- Preserve NULLFANG's new rear strip, lion voice bank, first-stage identity and purification staging.
- Preserve MIREJAW's model and nine good state families; replace only the false death roll and first try remapping tail-slam timing before generating anything.
- Preserve all hero gate climb/hop variants.
- Preserve Alpha's own yield strip; create only a dedicated small wolf bow if approved.
- Do not regenerate completed hero, agents, Alpha, wolves, gate, MIREJAW base, first-stage NULLFANG or purification film.
- Add measured anchors for NULLFANG rear. Decide MIREJAW's story infection status before adding eye trails.
- The finite eye system is technically sound: 1.5 seconds plus/minus 25%, maximum 1.875 seconds, bounded pools, speed gate, teleport/room cleanup and reduced-motion smoke suppression.
- Fix only `r_marble.webp` continuity: the player must see raw material, not a completed blade, before forging.

The gameplay-size inspection is stored in `visual-gameplay-size-sample.png`. It is a static contact sheet, not a live render.

## Implemented, tested, inspected, integrated and deployed

| State | Result |
|---|---|
| Implemented on review branch | Restored safety fixes, K2 gate, ferry ownership, Alpha persistence, cold preloads, AAC tier, rebuilt pages |
| Deterministically tested | 42 build/package/source/headless checks pass |
| Visually inspected | Shipping assets/panels at gameplay size; not live motion |
| Staged browser tested | **No — blocked before page creation** |
| Uninterrupted real-input tested | **No** |
| Physical device/accessibility tested | **No** |
| Integrated to `main` | **No** |
| Deployed | **No** |

## Commands and outcomes

```sh
npm ci                                           # PASS, 161 packages
npm run build                                    # PASS
npm run app:pack                                 # PASS, 273.3 MB
python3 -m unittest tools.studio.test_audit      # PASS, 8/8
node tests/scene-caption-contract.cjs            # PASS
node tests/purification-language-contract.cjs    # PASS
node tests/infection-eye-authority-contract.cjs  # PASS
node tests/quest-payment-contract.cjs            # PASS
node tests/tile-signature-contract.cjs           # PASS
node tests/roomasset-manifest-contract.cjs       # PASS
node tests/ferry-overlay-contract.cjs            # PASS
node tests/alpha-bow-persist-contract.cjs        # PASS
node tests/tails.cjs                             # PASS, 154 one-shots
node tools/aactier.cjs --check                   # PASS, 159 files
CHROMIUM_PATH=/usr/bin/chromium python3 tools/studio/audit.py \
  --profile full --output docs/studio/runs/2026-11-22/automated
# 42 PASS, 233 BLOCKED, 0 FAIL, 0 TIMEOUT; overall non-pass
```

## Release recommendation

Keep this branch isolated until the bounded fixes are integrated over the same or newer `main`. The next coordinated implementation should first correct the Chapter One graph/Alpha semantics and pin the story/manhwa authority. In the same pass, make boss/NPC rewards atomic, sweep world fall collisions, resolve MIREJAW's infection meaning, repair its death-roll/tail contact, and add NULLFANG rear eye anchors. Only then run an exact-commit uninterrupted desktop/phone verification and accessibility/device matrix.
