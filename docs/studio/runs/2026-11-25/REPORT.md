# CLAWBYTE Senior Studio Review — 2026-11-25

## Executive decision

**RELEASE HOLD — P1.** Production materially improved since the previous review: it now contains a purpose-built sewer route, a redrawn broken-floor hatch, Rivet, MIREJAW's hide-shell quest, a three-room UNDERTOW path, the boss-ladder/attack-VFX pass and bending grass. It still does not resolve the current campaign-order conflict, Alpha's clean-side-quest semantics, chapter-two manhwa parity, atomic boss/NPC rewards, continuous-play evidence, or physical-device evidence.

This review branch preserves every new sewer asset and makes only bounded, verified source fixes. It is **not merged and not deployed**.

## Intake and pinned revisions

| Surface | Revision | Tree / status |
|---|---|---|
| Production intake `main` | `e960189b989850b6f83257179bbba72c9dd9b10a` | tree `1416bbf6d340a10a83fdb07bb3c6b1b087ab4e84` |
| Production mirror `odyssey` | same as `main` | aligned at intake |
| Integration `claude/clawbyte-repo-migration-byhyl8` | `e960189b989850b6f83257179bbba72c9dd9b10a` | merged and aligned with `main` at intake |
| Previous review | `f5540d4425afab1ca7dc4f7db40576a480023d03` | fixes were not ancestors of production |
| Review source fix | `31cd0a9713d4c533b354dba7c8a802c213c1bd71` | tree `72ab0e4cf9d6954e181f72b701bb6f01b82c8a1f`; direct child of current `main` |
| Review branch | `codex/studio-review-2026-11-25` | review/report commit follows source commit |
| Built bundle | `BUILD_ID 92d969cc148f` | built and packaged from the final repinned review source tree |
| Live site | not read or changed | no live-version or deployment claim |

The former integration delta—professionalized TALLYMAN/NULLFANG duels, seeded boss gauntlets, 13 attack-local VFX strips and bending grass—is now in production. It does not change the story graph, ferry UI, quest causality, infection authority, or manhwa mapping. Production advanced twice during this review; the source commit was repinned to the final merged `main`, rebuilt and re-audited so the duel/VFX/grass systems, redrawn hatch and all completed sewer work are preserved.

## Fifteen senior-role verdicts

| # | Responsibility | Verdict | Evidence-backed summary |
|---:|---|---|---|
| 1 | Cinematic Designer | HOLD P1 | Hatch opening is an authored one-shot with equipment-aware hero poses, sound, shake, haptics and fade; caption loss and purification wording were fixed here. Destination-side hatch fade-in remains source-unproven. |
| 2 | Player Systems | HOLD P1 | Tutorial source contracts are strong. The sewer had an asymmetric shortcut from GB1 into late B4; the return now leads to B6 and is contract-tested. No uninterrupted fresh-save route ran. |
| 3 | Mission Designer — Quest Craft | CONDITIONAL SOURCE IMPROVEMENT / HOLD P1 | Rivet → MIREJAW hide → shell → UNDERTOW is meaningful and has a systemic reward. MIREJAW can still be reached before Rivet, so quest causality is not enforced. |
| 4 | Encounter Designer | STRONG PRODUCTION IMPROVEMENT / HOLD P1 | Production now has counters, openings, greed punishment and attack-local VFX. Its ladder deliberately measures the wrong campaign order, and UNDERTOW does not receive the new duel layer. |
| 5 | Boss Designer | CONDITIONAL SOURCE PASS / HOLD P1 | NULLFANG and Alpha combat improve in production. Alpha infection optics, MIREJAW authority/tail/hitbox/weak-point, older phase bodies and live purification remain open. |
| 6 | Mission Designer — Campaign | HOLD P1 | Canon requires GRAVEHORN → NULLFANG → Wolf King → controlling agent; source tests still certify forge → agent → CHIME → NULLFANG. |
| 7 | Mission Producer | HOLD P1 | Heads were pinned, sewer work preserved, previous fixes semantically reapplied and new changes bounded. Runtime, device and deployment gates remain unproven. |
| 8 | Character Artist | CONDITIONAL ASSET PASS / HOLD P1 | Hero hatch family, MIREJAW and completed sewer art are preserved. At gameplay size, Rivet reads grounded and purposeful but stylistically more realistic/humanoid than the hero. |
| 9 | Cinematic Director | HOLD P1 | Sewer staging is credible, but K2/Rivet/MIREJAW/UNDERTOW have no authoritative script/manhwa parity. Pre-forge marble and mixed page editions remain open. |
| 10 | VFX Artist | SOURCE-STRONG / HOLD P1 | Finite red/purple trails, clean-body authority and NULLFANG's 30-cell signature-rear anchors pass source contracts. Dynamic rendering and MIREJAW authority remain unverified. |
| 11 | World Systems | HOLD P1 | Sewer is a real three-room topology and the B6↔GB1 loop is repaired here. Vertical collision still samples the final row instead of sweeping every crossed row. |
| 12 | Combat Engineer | STRONG INTEGRATION DELTA / HOLD P1 | New duel timers are simulation-driven and attack effects are bounded. Frame-rate, contact alignment, real-input difficulty, audio and rumble remain unproven. |
| 13 | Mission Engineer | HOLD P1 | Forge settlement is atomic on this branch. Campaign graph, boss-reward atomicity, MIREJAW recovery and clean-Prism semantics remain open. |
| 14 | NPC Engineer | HOLD P1 | Freed Sage walk-source defect remains resolved. Ratchet restoration/gifts still cross multiple persistence boundaries. |
| 15 | UI Engineer | HOLD P1 | Grapheme reader/RTL foundation is strong; caption FIFO and ferry overlay ownership are fixed here. Ferry reveal, semantic accessibility and 200% text scale remain open. |

## Findings register

| Stable ID | Severity | Player consequence and evidence | Acceptance condition | Status |
|---|---:|---|---|---|
| `CAMPAIGN-GRAPH-01` | P1 | `tests/script-route.cjs` passes while printing `forge < sage < CHIME < NULLFANG`, contradicting current canon. Production's ladder acknowledges but still measures that obsolete route. | One graph across canon, script, story sheet, runtime, objectives, dialogue, panels, Continue, migrations and tests; ordinary-input Alpha-skip and Alpha-complete routes. | Open |
| `CAMPAIGN-LADDER-CANON-25` | P1 | Production tunes difficulty around GRAVEHORN → TALLYMAN → CHIME → NULLFANG, not the owner's route. | Ladder and runtime both enforce GRAVEHORN → NULLFANG → optional Wolf King → controlling agent. | Open |
| `ALPHA-SEMANTICS-01` | P1 | Alpha is still offered after forge and described/treated as infected instead of a clean post-NULLFANG covenant. | Gate after NULLFANG; clean optics and copy; pack defeat reveals controlling agent; migrate old saves. | Open |
| `PACK-AUTHORITY-DRIFT-21` | P1 | Runtime and canon still disagree on whether the Volt Pack is gifted or bought. | One approved exactly-once flow and migration. | Open |
| `K2-MANHWA-PARITY-22` | P1 | Bilge, Silt Mire, MIREJAW, sewer, Rivet, shell and UNDERTOW are absent from `STORY_SCRIPT.md`/manhwa parity. | Pin one K2 edition and map every runtime beat, room, prop, reward and action before new pages. | Open; gap expanded |
| `K2-SAGE-SEMANTICS-22` | P1 | Clean Prism Prowler is still “purified.” | Clean yield/stand-down with no virus extraction or purple infection optics. | Open |
| `SEWER-RETURN-ROUTE-25` | P1 | Intake reused GB1's unconditional cave exit to B4 while reverse B4→GB1 required `bossBrood`, exposing late territory. | Robot GB1 returns to B6; hero cave retains B4; contract and ordinary-input round trip. | **Source fixed/tested; live blocked** |
| `K2-SEWER-QUEST-ORDER-25` | P2 | Ferry/MIREJAW can be reached before Rivet, so the intended “go fight the crocodile for Rivet” motivation is optional in practice. | Gate the route after Rivet, or remember pre-discovery and adapt dialogue/tests; prove Rivet→MIREJAW→Rivet without injected flags. | Open |
| `SEWER-HATCH-TRANSITION-25` | P2 | Source fades to black, calls `loadRoom`, then drops the overlay; a destination-side fade-in is not authored. | Persist black into GB1, ready destination art/audio, ease out without flash/pop in exact-build capture. | Source-inferred; live blocked |
| `UNDERTOW-DUEL-COVERAGE-25` | P1 | Production's new agent duel applies only to TALLYMAN/GA1D; the named sewer climax uses older shared behavior. | A distinct current/sewer kit with tells, contact, recovery, counters and a verified difficulty rung. | Open |
| `R-MARBLE-CONTINUITY-01` | P1 visual | Pre-forge panel depicts a completed sword/hilt instead of raw material. | Repaint only the panel as raw rounded marble or an explicitly schematic future inset. | Open |
| `MANHWA-AUTH-01` | P1 | Runtime mixes page editions and no complete set is parity-certified. | Certify identity, equipment, room, action, spoiler timing and crop for each used panel. | Open |
| `NULLFANG-PHASE2-ART-01` | P1 visual | Common phase-two states are grades over phase-one bodies. | Authored damaged/vented idle/prowl, primary attack, leap/land and hurt/recovery. | Open |
| `GRAVEHORN-PHASE2-ART-01` | P1 visual | Escalation is lighting over phase-one plates. | Authored opened-plate/molten/vented body/head and live transition. | Open |
| `RIVET-STYLE-25` | P2 visual | Gameplay-size footage shows a readable, grounded smith, but his gritty humanoid proportions/materials diverge from the smooth chibi robot hero. | Preserve role/motion; owner-review one 960×540 dialogue shot for robot identity and style-family fit. | Open; do not regenerate blindly |
| `SEWER-FOCAL-HIERARCHY-25` | P2 visual | Large circular apertures dominate several sewer/Rivet frames and compete with character focus. | Owner-reviewed 960×540 framing makes hero/Rivet primary and avoids competing portal-like structures. | Open |
| `MIREJAW-TAIL-SYNC-01` | P1 combat art | Tail strip lacks descending contact/recovery while damage/VFX begin at active-state entry. | Replace only tail strip; trace visible contact to damage/audio/haptic. | Open |
| `MIREJAW-INFECTION-AUTHORITY-01` | P1 narrative/VFX | Canon does not declare MIREJAW infected/clean; resolution uses a normal defeat/reward path. | Decide authority and align optics, dialogue, resolution, anchors and reward timing. | Open |
| `MIREJAW-WEAKPOINT-SPATIAL-01` | P2 | Leap accepts full damage from every coordinate. | Facing-aware belly region sampled at early/mid/late leap. | Open |
| `MIREJAW-HITBOX-22` | P2 | Rendered body and general hurt box do not match. | Pose-aware hurt regions plus real swing hit/miss tests. | Open |
| `FRAME-INVARIANCE-22` | P2 | MIREJAW and revised fights lack 30/60/120 Hz plus spike equivalence evidence. | Simulation clock and seeded timing/damage/contact matrix across rates, pause and hit-stop. | Open |
| `WORLD-FALL-01` | P1 | Vertical movement probes the final row rather than every crossed row; long frames can tunnel through ground. | Sweep crossed rows; identical player/enemy/boss/lift/water contacts at 30/60/120 Hz and a 1/30 spike. | Open |
| `BOSS-REWARD-ATOMIC-22` | P1 | Boss flags, unique rewards and persistence still settle across separate operations. | One idempotent transaction with failpoint/reload migrations. | Open |
| `NPC-ATOMIC-01` | P1 | Ratchet cell, awake/released flags, Pack and spare gift persist separately. | Versioned idempotent transaction, one publish, rollback and partial-state migrations. | Open |
| `RUNTIME-EVIDENCE-01` | P1 gate | Chromium cannot create its Unix socket in this host; all browser-dependent checks are blocked. | Exact-commit staged captures, uninterrupted ordinary-input routes and physical phone/controller/accessibility evidence. | Blocked |
| `QUEST-PAYMENT-ATOMIC-01` | P1 | Production could mark quest complete without granting the Purifier. | Clone/apply/one publish/rollback; duplicate callbacks harmless; legacy repair. | **Fixed/tested here** |
| `SCENE-CAPTION-01` | P1 | Production evicted the oldest unread fourth caption. | Visible-three FIFO plus wait lane and completion-aware gates. | **Fixed/tested here** |
| `PURIFICATION-LANGUAGE-01` | P1 | Production still used FREE in localized story surfaces. | PURIFY/PURIFIED in five languages and localized hold instruction. | **Fixed/tested here** |
| `INFECTION-AUTHORITY-01` | P1 | Production marked clean Alpha/constructs purple. | Explicit clean kinds; infected ordinary red; infected guardian/agent purple; finite cleanup. | **Source fixed/tested; live blocked** |
| `NULLFANG-REAR-INFECTION-ANCHOR-24` | P1 VFX | `beastStudioRear` lacked an eye map, losing the trail during the signature rear counter. | 30/30 measured points plus both-facing exact-build capture. | **Source fixed/static-inspected; live blocked** |
| `MIREJAW-COLD-MOVESET-23` | P1 visual | Production preloaded only idle at SW3. | All MIREJAW moves and held-hero tiers resident before encounter. | **Manifest fixed/tested; live blocked** |
| `FERRY-OVERLAY-QUEUE-24` | P1 UI | Ferry bypassed centralized overlay ownership. | Queue ownership; no replacement/overlap with active dialogue/card. | **Source fixed/tested; live blocked** |
| `FERRY-TEXT-REVEAL-01` | P2 UI | Ferry question/options render instantly instead of using the shared grapheme reader. | First confirm reveals; second chooses; Arabic/CJK keyboard/touch/controller capture. | Open |
| `FERRY-A11Y-01` | P2 UI | Canvas-only choice has no semantic dialog/options/focus announcement. | Localized semantic surface, focus trap/restore and screen-reader proof. | Open |
| `TEXT-SCALE-01` | P2 UI | No persisted 100/125/150/200% typography scale. | Shared wrapping/layout scale and five-language desktop/phone captures at 200%. | Open |
| `AAC-MTIME-CHECK-24` | P2 tooling | Clean checkout reported all 162 AAC files stale because it compared Git checkout mtimes. | Validate pinned source/output bytes instead of mtimes. | **Fixed/tested here; 162/162** |

## Cave and quest census

| Space | Current purpose | Decision |
|---|---|---|
| A5/A7/CV1/CV1B/CV2 | Puzzle, survey/evidence, reward and beacon | Meaningful; preserve |
| CV3 | GRAVEHORN, raw marble and return | Strong and story-critical |
| GA1T/GA1/GA1D | Tunnel/rest/TALLYMAN | Meaningful content; wrong campaign position |
| A10R/A10 | Wolf road, Alpha den, covenant/Pack reward | Meaningful optional topology; wrong timing/infection premise |
| SW1/SW5/SW2/SW4 | Bilge ferry, dash errand, hub, optional cache | Meaningful; preserve |
| SW3 | MIREJAW and Vault Seal II | Meaningful; combat/infection findings remain |
| GB1 | Hatch arrival, lift, Rivet forge and safe B6 return | New meaningful hub; return shortcut fixed here |
| GB1T | Shell-gated water-channel traversal | New meaningful traversal |
| GB1D | UNDERTOW and sigil3 | New meaningful climax; duel depth remains open |
| GC1/GD1/GX1/GE1 families | Repeated grotto/tunnel/deep-agent grammar | `CAVE-VARIETY-01` remains P2 |

An exit ID or source-defined reward is not counted as proof that a real player understood, reached or enjoyed a cave.

## Manhwa parity matrix

| Beat | Runtime | Authoritative script/manhwa | Verdict |
|---|---|---|---|
| Wake, tutorial, Ratchet repair | Implemented in source | Mixed draft/page editions | Not certified |
| Raw marble before forge | Quest exists | Panel shows a completed blade too early | P1 mismatch |
| Forge and first Purifier | Atomic settlement fixed here | Story foundation agrees | Source-aligned; live blocked |
| First agent/CHIME/NULLFANG | Obsolete order enforced | Current canon requires NULLFANG before Wolf King/agent | P1 causal mismatch |
| Bilge/MIREJAW/sewer/Rivet/UNDERTOW | Playable source arc now exists | Missing from authoritative K2 script/page mapping | P1 parity gap |
| Purification film ending | Stored asset fades picture/audio | Ritual canon agrees | Stored-asset pass; live chain blocked |

## Animation, character and VFX matrix

| Subject | Evidence | Decision |
|---|---|---|
| Hero | Approved pose/loadout families plus four hatch-open tiers | Preserve; do not regenerate |
| Sewer hatch | Redrawn broken-floor opening plus four equipment-aware 8-cell strips, lid sync, recorded creak/clang, shake/haptic and fade | Strong staged source; destination fade-in/live input open |
| Rivet | Grounded, visible, animated, purposeful at gameplay size | Preserve mechanics/motion; style-family owner review |
| NULLFANG | Production duel/VFX is a major improvement; both rear sheets now have 30/30 anchors on review branch | Preserve; phase-two bodies and live trail/contact proof remain |
| Alpha/Pack | Distinct identity and mechanics; production bite/land VFX | Preserve art; move/rewrite clean semantics |
| GRAVEHORN | Useful calibration floor | Phase-two damaged body remains P1 |
| MIREJAW | Strong completed base/held art and meaningful quest reward | Preserve; replace only tail if approved; resolve authority/contact/hitbox |
| UNDERTOW | Walk/stand art and anchors exist | Needs a distinct duel, not TALLYMAN reuse |
| Infection eyes | ~1.5 s finite life, bounded pools, speed gate, room/teleport/cure cleanup and reduced-motion suppression | Source strong; dynamic render blocked |
| Production boss VFX | 13 finite strips with 48-live cap and no body halo design | Promising merged delta; exact-contact captures required |

The gameplay-scale inspection file is `visual/sewer-gameplay-size-sample.png`, extracted from the already completed current-production staged clip `assets/source/sewer/review/sewer_hatch_hole.mp4`. It is **staged footage, not an uninterrupted player run**. It confirms that the redrawn entry reads as a broken-floor drop and shows readable hero/Rivet scale and purpose, while also showing the Rivet style-family and large-aperture focal-hierarchy concerns. No completed artwork was regenerated.

## Automated evidence

### Exact commands and results

| Command | Result |
|---|---|
| `npm ci` | PASS — 161 packages installed |
| `node build.cjs` | PASS — index 5.54 MB, odyssey 4.31 MB, forge 5.56 MB, forge-odyssey 4.33 MB |
| `npm run app:pack` | PASS — 1,160 assets (270.8 MB) plus two pages (9.9 MB), 280.6 MB |
| `python3 -m unittest tools.studio.test_audit` | PASS — 8/8 |
| Ten bounded review contracts | PASS |
| `node tests/tails.cjs` | PASS — 157 one-shots measured; six loops skipped |
| `node tools/aactier.cjs --check` | PASS — 162 files, content provenance |
| `node tests/campaign-contract.cjs` | PASS mechanics; no real playthrough |
| `node tests/script-route.cjs` | PASS and prints obsolete route; negative canon evidence |

Full registry:

```sh
CHROMIUM_PATH=/usr/bin/chromium python3 tools/studio/audit.py \
  --profile full --output docs/studio/runs/2026-11-25/automated
```

| Result | Count |
|---|---:|
| PASS | 44 |
| BLOCKED | 239 |
| FAIL | 0 |
| TIMEOUT | 0 |
| Total | 283 |

`complete_requested_scope` is true because every registered check received a result. `passed` is false because blocked evidence is not success. Chromium was found but could not create its required Unix socket, so direct and transitive browser checks were classified **BLOCKED before page creation**. The first production-intake audit incorrectly reported 235 failures; the review's unit-tested preflight correction prevents that false product claim.

Evidence hashes:

- `automated/results.json`: `3128b2f6e0439dc55e11c5a6f414cb4167cba086dfa2185d97b2ef705d6f1d34`
- `automated/AUTOMATED.md`: `26d492c7d01b2d04d3b8189e072353d4dab6f26f7674215daef0a8640369f805`
- `visual/sewer-gameplay-size-sample.png`: `1e7efb157c554ad5a54b405eb7b11eaac99dedce71b5f0bfb456bdcc9c1dd28c`
- staged source clip: `a7fe37463f3cc1214713aabac9551faa68bac0aad0ab981e2fd33b84fd5c73fd`
- `assets/aac/hashes.json`: `8abd70cb91f9c38f07f298f53755f8990751114dd1d727badfee1586d09e89d5`

### Staged versus uninterrupted evidence

| Evidence class | Status | What it proves |
|---|---|---|
| Source/headless contracts | Completed | Deterministic text, transactions, manifests, routes, audio and data invariants |
| Stored exact-head sewer footage | Inspected | Gameplay-size art/framing and staged animation; not player navigation |
| Browser/staged encounter checks | Blocked before page creation | Harnesses exist; no current rendered assertion executed |
| Uninterrupted ordinary-input campaign | **Not run** | No reachability, clarity, difficulty, save/retry or recovery certificate |
| Physical phone/touch/controller/audio/haptics | **Not run** | No hardware, mix, latency or perceptual certificate |
| Screen reader/RTL/CJK/200% typography | **Not run** | No accessibility certificate |

## Implemented, tested, inspected, integrated and deployed

| State | Result |
|---|---|
| Implemented on review branch | Bounded prior safeguards; NULLFANG rear anchors; sewer return; AAC content provenance |
| Deterministically tested | 44 registry checks pass; impacted contracts and audit units pass |
| Visually inspected | Existing staged sewer clip at gameplay scale |
| Staged browser tested | **No — blocked before page creation** |
| Uninterrupted real-input tested | **No** |
| Physical device/accessibility tested | **No** |
| Integrated to `main` | **No** |
| Deployed | **No** |

## Before/after patch list

| Intake | Review branch |
|---|---|
| GB1 sewer return opened late B4 through an asymmetric gate | Robot GB1 returns to B6; hero-world cave retains B4 |
| Clean Alpha/constructs classified purple | Explicit clean-kind authority and contract |
| Signature NULLFANG rear lost its trail anchor | Separate 30-cell `beastStudioRear` map and contract |
| Fourth caption evicted unread text | Visible-three FIFO plus waiting lane |
| FREE copy in localized story surfaces | PURIFY/PURIFIED and localized hold instruction |
| Quest completion could persist without blade | Clone/apply/one publish/rollback and repair |
| Ferry bypassed overlay queue | Centralized overlay ownership |
| SW3/agent rooms preloaded only partial moves | Complete MIREJAW/held-hero/agent families |
| Broken-tile cache keyed only by count | Coordinate-sensitive stable signature |
| Browser-host denial counted as product failure | Unit-tested BLOCKED preflight |
| AAC clean-check depended on mtimes | 162 source/output SHA-256 pairs; no regeneration |

## Performance and device gaps

- Empty-cache sewer and MIREJAW presentation still needs a throttled B6→GB1→SW3 capture.
- MIREJAW and the newly merged duel timing need 30/60/120 Hz, pause, hit-stop and spike validation.
- No physical phone thermal/memory/decode measurement ran after the sewer assets and expanded preload lists.
- No physical touch/controller rumble, speaker/headphone mix, screen-reader or 200% typography proof exists for this source commit.
- Viewport emulation, stored footage and source contracts are not physical-device approval.

## Release recommendation

Keep this branch isolated. The bounded source commit already sits directly on the merged production head and preserves the duel/VFX/grass, sewer and completed character assets. Next correct the campaign graph/Alpha semantics as one migration-aware change, enforce or explicitly adapt the Rivet→MIREJAW quest order, add a destination hatch fade-in, give UNDERTOW a distinct duel, make boss/NPC settlements atomic, sweep vertical collision, update K2 script/manhwa authority, and produce only the missing tail/phase art. Finally run exact-commit staged, uninterrupted desktop/phone, controller, audio/haptic and accessibility matrices before any release claim.

