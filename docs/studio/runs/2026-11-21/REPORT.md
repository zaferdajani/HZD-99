# CLAWBYTE Senior Studio Review — 2026-11-21

## Executive decision

**RELEASE HOLD — P1.** Thirteen commits landed on `main` after the previous intake and they are meaningful. Preserve them. NULLFANG now has a signature chained dash, a stronger first glimpse and a solid second showing; Alpha has distinct wolf/material audio, an in-world bow, sealed arena and callable pack reward; TALLYMAN reacts with authored struck bodies; rescued agents use their own walk strips; the city gate has convincing material depth; the marble arrow points through the cave; chapter two now has a CARRIER → UNDERTOW → TALONHOST road; lives, map and reward messaging are clearer.

The owner’s campaign is still not the campaign the game certifies. Current runtime/tests enforce `forge → Eye agent → CHIME → NULLFANG`, offer Alpha immediately after forging and describe the clean Wolf King as corrupted/purifiable. Canon requires `GRAVEHORN → NULLFANG → optional clean Alpha covenant → pack-controlling Eye agent`. A passing route certificate currently proves the obsolete route consistently rather than proving canon.

The November 20 safety fixes were again absent from `main`. This review restored them over the new work: caption FIFO, PURIFY/PURIFIED ritual language, atomic forge settlement, explicit infection-eye authority and honest browser preflight. It also fixed coordinate-blind terrain-cache signatures, finished seven hot-ending one-shots, supplied all 55 missing AAC derivatives for the newly integrated Alpha/material sound bank, and refreshed gate/TALLYMAN preload metadata.

The full registry now has **40 PASS, 227 BLOCKED, 0 FAIL and 0 TIMEOUT**. It is still an overall non-pass: Chromium is unavailable, so no staged browser assertion, uninterrupted ordinary-input playthrough, physical phone/controller, perceptual audio/haptic or accessibility proof ran. Stored assets were inspected at calculated gameplay size; this is not a live capture.

This is a review branch only. **Nothing was merged to `main`, mirrored to `odyssey` or deployed.**

## Pins and branch safety

| Item | Value |
|---|---|
| Repository | `zaferdajani/HZD-99` |
| Intake `main` | `655f35156cd158342ead036473ef70b0dcb2168c` |
| Intake tree | `ce58e30569e9751d1d5505f3c29ad2b64c3a610c` |
| Intake `odyssey` | same commit as `main` |
| Intake integration branch | `claude/clawbyte-repo-migration-byhyl8`, same commit as `main` |
| Previous review | `codex/studio-review-2026-11-20` at `74a99f239cf69b95dabcd0366ac1f9563556da86`; not an ancestor of `main` |
| Review branch | `codex/studio-review-2026-11-21` |
| Safety/world commit | `8d2200d` |
| Rebuilt-page commit | `3734ee2` |
| Audio/AAC commit | `0ca7b94` |
| Preload-manifest commit / audit base | `b60801c` |
| Production/live verification | Not performed; no deployment claim |

The branch started from a clean exact `origin/main`. All current main art, motion, audio, encounter and chapter-two changes remain in ancestry. No approved raster character or environment was regenerated.

## Comparison with the 2026-11-20 report

### Material improvements on `main`

- NULLFANG’s dash is now the fight’s signature: one link in phase one, two in phase two and three below 25%, with authored crouch tells and spent recovery.
- NULLFANG’s return is fully visible and standing; his glimpse uses fight scale, filmed turn, leap, gallop and roar.
- Alpha now has REND/FURY/QUAKE behavior, a sealed arena, distinct recorded wolf cues, three-take material impact banks, a gameplay bow and a ten-second pack summon reward.
- TALLYMAN has higher pressure, authored high/low struck plates and less statue-like knockback.
- Purified agents now choose each room’s authored walk strip instead of sliding while kneeling. Only TALLYMAN has a full parts rig, but the original slide defect is resolved in source.
- The city gate is re-fired as rusted armor plate with hinges and a readable lit opening.
- The route arrow points to `CV3`; Ratchet gives the Volt Pack in one step; lives are scarce; map/reward messaging improved.
- Kingdom two has a real source-level road: CARRIER → UNDERTOW → TALONHOST.
- Comic/image density is restrained to key moments instead of one picture per line.

### Regressions or missing integration

The prior branch was not integrated. Exact `main` therefore again dropped:

1. unread-caption FIFO;
2. five-language PURIFY/PURIFIED and localized ritual ARIA;
3. atomic quest/forge settlement and done-without-Purifier migration;
4. explicit clean/infected eye authority;
5. browser/executable/AF_UNIX audit preflight and its extra unit coverage.

All five were restored here without reverting the new main work.

### Newly exposed defects

| ID | Severity | Finding |
|---|---:|---|
| `PACK-AUTHORITY-DRIFT-21` | P1 | Runtime gifts the Volt Pack at Ratchet wake, but canon/story sheet/machine JSON still describe a 12-scrap purchase and retracing sequence. |
| `ALPHA-BOW-PERSIST-01` | P2 | `alphaBowed` is set but not persisted at assignment; current test reloads the room in the same JS state, not a true save/page reload. |
| `ALPHA-PACK-BOW-ART-01` | P2 visual | Alpha’s own yield strip reads as a bow; pack wolves reuse a predatory crouch, not a ceremonial bow. |
| `NULLFANG-PHASE2-ART-01` | P1 visual | Mechanics improved, but phase-two still uses the first-stage body; the owner-rejected second-stage graphic is still unfired. |
| `GRAVEHORN-PHASE2-ART-01` | P1 visual | Phase-two escalation is lighting over phase-one plates; the queued phase-two plates remain missing. |
| `AUDIO-TAIL-21` | P1 quality | Seven new one-shots ended between −22.0 and −34.9 dB relative to peak and sounded cut. Fixed here; all 137 measured one-shots now finish below −35 dB. |
| `AAC-TIER-21` | P1 mobile | New Alpha and material-impact OGGs had no AAC tier; 55 missing `.m4a` derivatives and the index are supplied here. |
| `GATE-MANIFEST-BYTES-01` | P2 | Gate art grew to 530,092 bytes while preload metadata remained 445,190. Fixed here. |
| `TALLYMAN-HIT-COLDLOAD-01` | P2 | New hit plates were absent from GA1D preload metadata, so the first cold hit could fall back while decoding. Fixed here. |

## Bounded fixes implemented in this review

| Fix | Before | After / verification |
|---|---|---|
| Scene captions | Fourth fast line evicted the oldest unread line | Three visible plus FIFO waiting lane; read/shown/reset include both; `scene-caption-contract` passes |
| Ritual vocabulary | Free/Release/free and hard-coded English ARIA | PURIFY/PURIFIED in five locales, localized ARIA; `purification-language-contract` passes |
| Infection authority | Generic bosses and Alpha received purple virus smoke | Explicit clean kinds; ordinary infected red, infected guardian/agent purple, clean rivals/instruments none; contract passes |
| Quest/forge settlement | Multiple writes could consume marble or finish quest without Purifier | Clone-and-publish transaction, rollback, idempotent presentation and legacy repair; contract passes |
| Terrain bake signature | Signed only the number of broken tiles | Stable sorted coordinate signature; equal-count/different-cell states differ; contract passes |
| Audio endings | 7/137 one-shots ended above −35 dB | Short exponential decays on the shipped OGGs and corresponding AACs; `tails` passes all 143 files/137 one-shots |
| iPhone sound tier | 55 new Alpha/material cues lacked AAC derivatives | Complete 142-entry AAC index and 55 derived files; `aactier --check` passes |
| Gate preload bytes | Stale 445,190-byte record | Exact 530,092-byte record; contract passes |
| TALLYMAN cold first hit | High/low reaction plates absent from GA1D preload | Both keys in room manifest; contract passes |
| Audit truthfulness | Missing Chromium became repeated gameplay failures | Direct/transitive browser classification, executable/AF_UNIX preflight and 8 audit unit tests |

## Automated evidence

### Build and package

| Check | Result |
|---|---|
| `npm ci` | PASS — 161 packages |
| `npm run build` | PASS — index 5.31 MB, odyssey 4.09 MB, forge 5.33 MB, forge-odyssey 4.11 MB |
| `npm run app:pack` | PASS — 1,005 assets (253.6 MB) + two pages (9.4 MB), 263.0 MB |
| `python3 tools/studio/test_audit.py` | PASS — 8/8 |
| Restored safety contracts | PASS — 4/4 |
| New tile/preload contracts | PASS — 2/2 |
| `node tests/tails.cjs` | PASS — 137 one-shots measured, six loops skipped |
| `node tools/aactier.cjs --check` | PASS — 142 indexed OGG/AAC pairs |
| Current campaign certificate | PASS but certifies obsolete graph; not canon approval |

### Full registry

```sh
CHROMIUM_PATH=/usr/bin/chromium python3 tools/studio/audit.py \
  --profile full --output docs/studio/runs/2026-11-21/automated
```

| Result | Count |
|---|---:|
| PASS | 40 |
| BLOCKED | 227 |
| FAIL | 0 |
| TIMEOUT | 0 |
| Total | 267 |

`complete_requested_scope` is true because every registered check received a result. `passed` is false because blocked evidence is not a pass. Browser-dependent checks were blocked before page creation because `/usr/bin/chromium` is unavailable on this host. No rendered assertion was silently counted as success.

Evidence hashes:

- `automated/results.json`: `8533ffb892a1d9fe702e2adc2cafebb0cd9054967e340f2858b38c1960fdc08c`
- `automated/AUTOMATED.md`: `0d37cf7b6b76aca65ce3f6a3a63524e398b095e237ddd18553142ba7195845c6`
- `visual-gameplay-size-sample.png`: `e0dff04204a6001ed6026e4d50a23a38253b43e8f73f9b0a3d5f9cb57b44b067`

### Staged versus uninterrupted evidence

| Evidence class | Status | What it proves |
|---|---|---|
| Source/headless contracts | Completed | Deterministic data, language, transaction, manifest, audio and route invariants |
| Browser/staged encounter tests | Blocked before page creation | Test designs exist; no current rendered assertion executed |
| Stored assets at calculated gameplay size | Inspected | Composition/model/pose issues; not timing or live integration |
| Uninterrupted ordinary-input campaign | Not run | No reachability, clarity, difficulty or recovery certificate |
| Physical phone/touch/controller/audio/haptics | Not run | No hardware, mix, latency or perceptual certificate |
| Screen reader/RTL/CJK/200% text | Not run | No accessibility certificate |

## Fifteen-role review matrix

| # | Senior responsibility | Verdict | Highest-value evidence |
|---:|---|---|---|
| 1 | Cinematic Designer | HOLD P1 | Better image restraint and NULLFANG glimpse; campaign order, marble panel and authority remain wrong |
| 2 | Game Designer — Player Systems | CONDITIONAL SOURCE PASS / HOLD P1 | Pack gift, route arrow, lives/map clearer; story authority, atomicity and real novice proof remain |
| 3 | Mission Designer — Quest Craft | HOLD P1 | Meaningful quarry/Alpha reward work; Alpha timing/semantics and duplicate reward identity remain |
| 4 | Principal Encounter Designer | CONDITIONAL SOURCE PASS / HOLD P1 | Stronger NULLFANG/Alpha/TALLYMAN/seals; phase art, cold load and real play remain |
| 5 | Boss Designer | MECHANICS SOURCE PASS / HOLD P1 | Signature kits and ritual choreography are authored; Alpha canon and runtime feel remain |
| 6 | Mission Designer — Campaign | HOLD P1 | Chapter-two road improved; first-kingdom graph still contradicts canon |
| 7 | Mission Producer | HOLD P1 | Bounded fixes preserved thirteen new commits; full runtime evidence absent |
| 8 | Character Artist | CONDITIONAL ASSET PASS / HOLD P1 | Gate, TALLYMAN, agent walks and Alpha yield strong; phase-two bodies and pack bow weak/missing |
| 9 | Cinematic Director | HOLD P1 | Fewer redundant panels; single authority and pre-forge marble continuity unresolved |
| 10 | VFX Artist | STRONG SOURCE PASS / RUNTIME HOLD | Finite trails are well bounded; authority fixed here; live red/purple/zero-clean proof blocked |
| 11 | Technical Director — World | HOLD P1 | Fight seals and tile cache improved; fall sweep remains unsafe |
| 12 | Gameplay Engineer — Combat | CONDITIONAL SOURCE PASS / RUNTIME HOLD | Dash chains, hit reactions and sound banks are substantial; staged/browser/physical feel unverified |
| 13 | Gameplay Engineer — Mission | HOLD P1 | Atomic settlement restored here; canonical graph and save migrations remain coordinated work |
| 14 | Gameplay Engineer — NPC | IMPROVED SOURCE / HOLD P1 | Kneeling slide fixed; restoration still multi-write; six non-TALLYMAN transitions use plates only |
| 15 | Lead UI Engineer | HOLD P1 | FIFO and ritual copy fixed here; overlay ownership, semantic images, text scale and device proof remain |

## Prioritized findings

| Stable ID | Severity | Player consequence / evidence | Acceptance condition | Status |
|---|---:|---|---|---|
| `CAMPAIGN-GRAPH-01` | P1 | Game/tests still run forge → agent → CHIME → NULLFANG, not owner canon | One state graph across rooms, goals, gates, dialogue, panels, saves and tests; ordinary-input Alpha-skip/complete with Continue at every gate | Open |
| `ALPHA-SEMANTICS-01` | P1 | Clean optional Wolf King is called sick/corrupted/purifiable and is available before NULLFANG | Post-NULLFANG territorial covenant, no infection/purify/blade premise, cyan friendly pack and controlling-agent reveal | Open |
| `STORY-SHEET-AUTH-01` | P1 | Sheet/machine text call TALLYMAN “Sage” and certify the obsolete order | Visible identity is TALLYMAN/Eye agent; only NULLFANG is first Sage; contract rejects wrong speaker/objective names | Open |
| `PACK-AUTHORITY-DRIFT-21` | P1 | Runtime gifts Pack once, authority docs still require buying/retracing | Owner-approved gift order in canon, sheet, machine JSON, script/comments and clean-save contract | Open |
| `QUEST-PAYMENT-ATOMIC-01` | P1 | Interrupted forge could lose item/reward | One cloned publish, rollback, migration and replay contract | **Fixed/tested here** |
| `NPC-ATOMIC-01` | P1 | Ratchet/Servo cell, charge, flags and gift persist separately | One idempotent transaction with injected failure/reload matrix | Open |
| `SCENE-CAPTION-01` | P1 | Fourth line could erase unread story | Visible-three FIFO plus read/shown/reset semantics | **Fixed/tested here** |
| `PURIFICATION-LANGUAGE-01` | P1 | UI/ARIA contradicted PURIFY canon | Five-language PURIFY/PURIFIED, localized ARIA | **Fixed/tested here** |
| `INFECTION-AUTHORITY-01` | P1 | Clean Alpha/GRAVEHORN/PRISM/instruments could emit purple virus smoke | Explicit authority, finite cleanup and live clean/infected captures | **Source fixed/tested here; live capture blocked** |
| `WORLD-TILE-01` | P1 | Equal-count different broken cells reused stale terrain | Sorted coordinate signature and regression | **Fixed/tested here** |
| `WORLD-FALL-01` | P1 | Fast fall probes only final row and can cross an intermediate floor | Sweep every crossed row; identical 30/60/120 Hz landings | Open |
| `NULLFANG-PHASE2-ART-01` | P1 visual | Phase mechanics change but body does not | Approved phase-two plates derived from stage-one identity; gameplay-size continuity across transition | Open |
| `GRAVEHORN-PHASE2-ART-01` | P1 visual | Visual escalation is only lighting | Authored opened-plate/molten/vented phase-two set and live transition capture | Open |
| `R-MARBLE-CONTINUITY-01` | P1 visual story | Ratchet’s raw-marble panel visibly shows a sword/hilt before forging | Bounded repaint to unmistakable raw marble/deposit or future-plan inset; preserve composition/cast | Open |
| `MANHWA-AUTH-01` | P1 | Draft 3/second edition/32-page audit conflict | Pin one edition; certify every used panel for identity, equipment, room, action, spoiler timing and crop | Open |
| `AUDIO-TAIL-21` | P1 quality | New hit/Alpha cues cut while audible | All one-shots below −35 dB in final 25 ms | **Fixed/tested here** |
| `AAC-TIER-21` | P1 mobile | New OGG-only cues would disappear/fallback on older iPhones | Every requested OGG has indexed AAC, equivalent duration and packaged delivery | **Derived/indexed; browser/device proof blocked** |
| `RUNTIME-EVIDENCE-01` | P1 gate | No current browser or uninterrupted/device proof | Exact-commit recordings, full ordinary-input routes and physical-device matrix | Blocked |
| `GLIMPSE-COLD-LOAD-01` | P2 | Slow phone can cross trigger before five strips decode | Latch arrival until decoded; delayed-load ordinary-input test | Open |
| `PANEL-DUE-PERSIST-01` | P2 | Save/quit during doorway carry may lose an owed beat | Persist or reconstruct and play exactly once after reload | Open |
| `ALPHA-BOW-PERSIST-01` | P2 | Bow can replay after page reload | Persist assignment; true localStorage/page reload contract | Open |
| `ALPHA-PACK-BOW-ART-01` | P2 visual | Pack reads as stalking crouch rather than allegiance | Generate only dedicated wolf bow strip; preserve completed wolf set | Open |
| `AGENT-RIG-02` | P2 | Six agents have authored walks/plates but not continuous rig transitions | One parts rig per remaining agent; retain identity/pose plates | Open |
| `CAVE-VARIETY-01` | P2 | Later kingdoms repeat the same terminal/bat/scrap/agent template | Kingdom-specific verb, evidence, payoff, transformation and callback | Open |
| `OVERLAY-OWNERSHIP-01` | P2 | Direct trial/repair/story openings can overtake queued information | One priority/coalescing acquisition API plus overlap harness | Open |
| `DIALOG-SHOT-A11Y-01` | P2 | Canvas dialogue images have no semantic alternative | Localized concise description announced once, decorative redundancy hidden | Open |
| `TEXT-SCALE-01` | P2 | No persisted 100/125/150/200% scale | Shared typography/layout scale with phone/RTL/CJK capture matrix | Open |
| `QUEST-COIN-ID-01` | P2 | Reused `coin` IDs can suppress distinct rewards | Unique placement IDs and conservative migration | Open |

## Owner story and campaign authority

The required first-kingdom causality remains:

1. GRAVEHORN guards the raw marble repository.
2. Ratchet forges the Purifier from that earned marble.
3. NULLFANG is the first corrupted guardian and is purified.
4. Alpha is an optional, clean territorial covenant after NULLFANG.
5. The covenant exposes the infected pack-controlling Eye agent.

Current `script-route` passes while printing `forge < sage < CHIME < NULLFANG`. That is a useful regression signal: the game is internally consistent with a superseded story. Do not merely rewrite the test. Change runtime, objectives, dialogue, room gates, panels, map reward, saves/Continue migration and the certificate in one coordinated implementation.

## Cave and quest census

| Space | Current value | Decision |
|---|---|---|
| A5 | Puzzle, Volt/Magnet upgrade and quarry route | Meaningful; preserve |
| A7 | Survey evidence completed by reading | Meaningful; preserve |
| CV1 | Early permanent reward | Meaningful; verify current docs/reward authority |
| CV1B | Ring survey/scrap/future-skill cache | Meaningful implementation; docs drift remains |
| CV2 | Deaf System evidence and beacon | Meaningful; preserve |
| CV3 | GRAVEHORN, raw marble and return passage | Strong and story-critical |
| GA1T/GA1/GA1D | Tunnel/rest/TALLYMAN | Meaningful content, wrong campaign position/name authority |
| A10R/A10 | Wolf road, sealed Alpha fight, covenant and pack summon | Meaningful optional topology/reward, wrong timing/premise |
| B7/B8/GB1D/B4 | CARRIER → UNDERTOW → TALONHOST | Strong new source road; uninterrupted traversal unverified |
| GB1/GC1/GD1/GX1/GE1 families | Same grotto/tunnel/chamber grammar | P2 repetition; give each kingdom a distinct verb/payoff/callback |

## Manhwa and cinematic parity

| Area | Evidence | Decision |
|---|---|---|
| Authority | Canon names Draft 3; MANHUA publishes another edition; 32-page audit remains uncertified | P1 pin one visual edition |
| November refires | Off-model hero/NULLFANG/TALLYMAN panels remain corrected | Preserve; no wholesale regeneration |
| Image density | Ratchet uses key pictures only; films suppress redundant comics | Positive; preserve |
| `r_marble` | Visible sword/hilt glow beneath hero before forge | Bounded correction required |
| NULLFANG first glimpse | Fight-scale full body, turn/leap/gallop | Strong stored source; live cold-load capture missing |
| Purification proof | Existing diagnostic frames still contain stale/debug presentation | Refresh only after live language/build proof |

## Character, animation, VFX and audio matrix

| Subject | Assessment | Acceptance / next action |
|---|---|---|
| NULLFANG movement | Turn/gallop/dash logic materially stronger and on-model | Preserve; verify live cold-load, tell/contact/recovery and phase transition |
| NULLFANG phase two | Same body despite mechanical escalation | Create only missing phase-two plates from approved stage-one identity |
| Alpha bow | 12-cell step/fold/hold reads clearly | Preserve; persist once-per-save and prove true reload |
| Pack bow | Existing crouch reads predatory | Add only dedicated wolf bow strip |
| TALLYMAN hits | High/low plates are distinct and readable | Preserve; cold preload metadata fixed here; live first-hit capture blocked |
| Seven agents | Distinct art/walks; rescued slide defect resolved | Preserve all art; rigs remain optional transition polish for six |
| City gate | Strong rusted armor material and readable light gap | Preserve; byte manifest fixed here |
| Infection eyes | 1.5 s ±25%, finite caps, spacing, teleport/reset, cleanup and reduced-motion suppression | Authority fixed here; live red ordinary/purple infected guardian/zero clean capture required |
| Purification VFX | White gather, sword charge/slash, impact, black transition, dark extraction and gold return exist | Record film/fallback/cancel/skip/reload on browser/device |
| Hit feel | Source supports escalating flash/fragments/stop/shake/recoil/rumble and varied material banks | Perceptual audio/haptic test blocked |
| New audio | 10 Alpha cues and 45 material hits; seven hot tails corrected | Preserve masters; OGG/AAC parity packaged; phone mix unverified |

## UI, localization and accessibility

- Caption FIFO and ritual ARIA are fixed on this branch.
- Lite chapter-one text remains concise across five configured languages.
- Dialogue images still lack semantic alternatives.
- Full-screen overlay ownership is not centralized.
- No persisted 100/125/150/200% text scale exists.
- Reduced motion is not one authoritative policy across every camera/VFX/hit-stop path.
- Physical rotation, safe areas, touch targets, controller focus, RTL/CJK at scale and screen readers remain unverified.

## Implemented, tested, inspected, integrated and deployed

| State | Result |
|---|---|
| Implemented on review branch | Four restored safety fixes, audit preflight, tile signature, audio tails/AAC tier, gate/TALLYMAN preload manifest, rebuilt pages |
| Deterministically tested | 40 source/headless/build/package entries; focused contracts all pass |
| Visually inspected | Existing shipping frames/panels at calculated gameplay size; not a live render |
| Staged browser tested | No — browser launch blocked before page creation |
| Uninterrupted real-input tested | No |
| Physical device tested | No |
| Integrated to `main` | **No** |
| Deployed | **No** |

## Patch list

1. `0001-studio-restore-safety-contracts-and-terrain-cache-au.patch`
2. `0002-build-regenerate-November-21-review-pages.patch`
3. `0003-audio-finish-new-one-shots-and-complete-AAC-tier.patch`
4. `0004-assets-refresh-gate-and-TALLYMAN-preload-manifest.patch`

## Commands and outcomes

```sh
npm ci                                              # PASS, 161 packages
python3 tools/studio/test_audit.py                  # PASS, 8/8
node tests/scene-caption-contract.cjs               # PASS
node tests/purification-language-contract.cjs       # PASS
node tests/infection-eye-authority-contract.cjs     # PASS
node tests/quest-payment-contract.cjs               # PASS
node tests/tile-signature-contract.cjs              # PASS
node tests/roomasset-manifest-contract.cjs          # PASS
node tests/campaign-contract.cjs                    # PASS, obsolete graph still certified
node tests/script-route.cjs                         # PASS, prints forge < sage < CHIME < NULLFANG
node tests/tails.cjs                                # PASS, 137 one-shots
node tools/aactier.cjs --check                      # PASS, 142 files
npm run build                                       # PASS
npm run app:pack                                    # PASS, 263.0 MB
CHROMIUM_PATH=/usr/bin/chromium python3 tools/studio/audit.py --profile full --output docs/studio/runs/2026-11-21/automated
# 40 PASS, 227 BLOCKED, 0 FAIL, 0 TIMEOUT; overall non-pass
```

## Release recommendation

Keep this branch isolated until Claude integrates the bounded fixes over the same or a newer `main`. Do not regenerate completed hero, agent, Alpha, wolf, gate, TALLYMAN or first-stage NULLFANG assets. The next coordinated implementation must correct the first-kingdom state graph and Alpha’s clean covenant meaning before adding more scenes. Then address NPC atomicity, fall sweeping, phase-two art, the pre-forge marble panel and a browser/device evidence run.
