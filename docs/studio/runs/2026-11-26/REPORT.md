# CLAWBYTE Senior Studio Review — 2026-11-26

## Executive decision

**RELEASE HOLD — P1. Do not merge or deploy production.**

The production baseline has improved materially: Chapter One's runtime order now follows **GRAVEHORN → CHIME → TALLYMAN → NULLFANG**, the first cave has differentiated discoveries and a story-critical marble payoff, NULLFANG has a full-arena camera and authored metal-leaf ambush, the freed lion opens the A4→A14 road, and the wolf mount has a real Kingdom 3 quest and completed integrated rider film.

This review branch restores safeguards that were present only on yesterday's unmerged review branch, wires the already-completed mount film, prevents same-wolf stamina resets, isolates foliage randomness from combat RNG, and moves the Alpha offer after NULLFANG. It does **not** claim that these systems feel correct in live play. The browser payload is absent, so there is no uninterrupted ordinary-input playthrough, no executed browser-staged gameplay suite, and no physical phone/controller/accessibility evidence.

## Intake and pinned revisions

| Surface | Revision | Status |
|---|---|---|
| Production `main` | `b46e6c1fbd59d7910a48b705af7dc4eb4dcbe4e5` | Pinned intake |
| Production `odyssey` | same | Aligned at intake |
| Integration `claude/clawbyte-repo-migration-byhyl8` | same | Aligned; no unmerged integration delta |
| Previous review branch | `codex/studio-review-2026-11-25` at `2a368cf` | Not an ancestor of production |
| Previous review source fixes | `31cd0a9` | Semantically reapplied, then reconciled with current main |
| Current review source fix | Local audit commit `18d547c741761f6744b248f980be4019d0dfaec0`; remote tree-equivalent commit `380ee8042b091cfc37e54a631871522b296b72ac` | Identical source tree; exact local source audited below |
| Current review branch | `codex/studio-review-2026-11-26` | Review only; not merged/deployed |

## Evidence boundary

### What was actually executed

- Clean dependency installation and all four builds.
- Full audit registry against exact source commit `18d547c`.
- 48 non-browser/static/component checks, including new contracts for caption FIFO, purification language, infection authority, atomic quest settlement, Alpha order, sewer routing, manifest completeness, AAC provenance, and wolf-mount film/stamina.
- Gameplay-size inspection of the approved mount film at its actual review draw height. The extracted sample is [`visual/wolf-mount-gameplay-size.png`](visual/wolf-mount-gameplay-size.png).

### What was not executed

- Browser-staged combat, tutorial, caves, story, boss, VFX, mount, or cinematic harnesses.
- An uninterrupted fresh-save playthrough using ordinary player inputs.
- Controller, physical touch device, haptic, audio mix, screen-reader, store-entitlement, or performance validation.

The configured `/usr/bin/chromium` launcher has no `/usr/lib/chromium/chromium` payload; the default Playwright browser is also absent. The audit preflight therefore marks browser cases **BLOCKED** before dispatch. A blocked case is neither a pass nor a product failure.

Publication used the connected GitHub object API because the workspace HTTPS remote had no credential. That reconstruction preserves the audited source tree exactly but assigns a new commit SHA; the mapping is recorded above.

## Fifteen senior-role verdicts

| # | Senior responsibility | Verdict | Evidence-backed summary |
|---:|---|---|---|
| 1 | Cinematic Designer | HOLD P1 | Opening dissolves and the NULLFANG door ceremony are source-strong. The B1 teaser still depicts the deleted camp-hatch route, and dynamic film/audio/skip flow is blocked. |
| 2 | Player Systems | HOLD P1 | Tutorial enforcement and route objectives are strong in source. Mount stamina reset is fixed here; device-aware mount affordances and uninterrupted tutorial evidence remain open. |
| 3 | Mission Designer — Quest Craft | CONDITIONAL SOURCE IMPROVEMENT / HOLD P1 | First-cave and harness tasks have purpose. Quest settlement is atomic here, but Rivet can still be met after MIREJAW and Alpha's full post-NULLFANG backstory is incomplete. |
| 4 | Encounter Designer | CONDITIONAL SOURCE PASS / HOLD P1 | NULLFANG now has readable authored cover logic and a warning/burst/recovery loop. Fairness at gameplay size, UNDERTOW, and frame-rate equivalence remain unproved. |
| 5 | Boss Designer | NULLFANG SOURCE IMPROVEMENT / HOLD P1 | Full-arena framing, ambush contact shapes, effects and recovery are substantive. Phase-two bodies, MIREJAW defects, and the generic UNDERTOW climax remain P1. |
| 6 | Mission Designer — Campaign | HOLD P1 | Runtime order is now correct under the latest owner ruling. Story script, walkthrough, cave ledger, role mandate, story sheet labels and teaser imagery still certify conflicting history. |
| 7 | Mission Producer | HOLD P1 | Heads are pinned, current integration preserved, prior fixes reapplied, and the evidence boundary is honest. Runtime/device gates prevent release. |
| 8 | Character Artist | CONDITIONAL ASSET PASS / HOLD P1 | Approved mount film, cover art, NULLFANG, Alpha and MIREJAW work are preserved. Mount film is wired here; crystal-weapon strips and boss phase bodies remain unfinished. |
| 9 | Cinematic Director | HOLD P1 | A4→A14→B1 has causal source staging, but the active teaser and uncertified manhwa tell another route. K2 has no authoritative illustrated bridge. |
| 10 | VFX Artist | SOURCE-STRONG / HOLD P1 | Finite red/purple eye trails and cleanup contracts are restored; cover RNG is isolated here. MIREJAW roll/turn anchors and live trail continuity are open. |
| 11 | World Systems | HOLD P1 | First cave, A14 road, palms, boss framing and K2 door are meaningful source improvements. Sewer return is restored here; swept vertical collision and hatch arrival fade remain open. |
| 12 | Combat Engineer | HOLD P1 | Combat timing is broadly `dt`-based and NULLFANG uses authored boxes. Mount contact/impact ownership, MIREJAW spatial contacts, and 30/60/120 Hz equivalence are not proved. |
| 13 | Mission Engineer | HOLD P1 | Forge and harness settlement/recovery are atomic here; Alpha order is gated here. Boss rewards, Rivet ordering and normal-input quest completion remain open. |
| 14 | NPC Engineer | HOLD P1 | Purified-agent walk uses the authored eight-frame strip in source; NULLFANG has an authored freed task. Ratchet's multi-step repair/release/Pack/spare settlement remains non-atomic. |
| 15 | UI Engineer | HOLD P1 | Caption FIFO and ferry ownership are restored. Ferry reveal-first behavior, semantic overlay accessibility, binding-aware prompts and 200% text scaling remain open. |

## Changes made on this review branch

| Stable ID | Bounded change | Verification | Status |
|---|---|---|---|
| `SCENE-CAPTION-01` | Three visible captions plus FIFO wait lane; completion waits for both lanes. | `scene-caption-contract` PASS | Source fixed; live blocked |
| `PURIFICATION-LANGUAGE-01` | PURIFY/PURIFIED terminology restored across five languages and ritual copy. | `purification-language-contract` PASS | Source fixed; live blocked |
| `FERRY-OVERLAY-QUEUE-24` | Ferry now uses centralized overlay ownership. | `ferry-overlay-contract` PASS | Source fixed; live blocked |
| `QUEST-PAYMENT-ATOMIC-01` | Clone/apply/persist-once/rollback for quest rewards; duplicate hand-in inert. | `quest-payment-contract` PASS | Fixed |
| `HARNESS-PAYMENT-ATOMIC-26` | Mount flag joins the same atomic snapshot; old done-without-mount saves repair idempotently. | `quest-payment-contract` PASS | Fixed |
| `SEWER-RETURN-ROUTE-25` | Robot GB1 returns to B6; NOSTOS B4 route remains. | `sewer-route-contract` PASS | Source fixed; live blocked |
| `INFECTION-AUTHORITY-01` | Explicit infected eligibility, red ordinary/purple boss classification, finite cleanup, and reduced-motion suppression restored. | `infection-eye-authority-contract` PASS | Source fixed; live blocked |
| `NULLFANG-REAR-INFECTION-ANCHOR-24` | Existing 30-cell measured rear-eye map restored without regenerating art. | authority + manifest contracts PASS | Source fixed; live blocked |
| `MIREJAW-COLD-MOVESET-23` | Complete dynamic agent/MIREJAW/held-hero families retained in preload manifest. | `roomasset-manifest-contract` PASS | Source fixed; live blocked |
| `AAC-MTIME-CHECK-24` | AAC verification now pins source/output hashes instead of checkout mtimes. | `aactier-provenance-contract`; 162/162 PASS | Fixed |
| `WOLF-MOUNT-FILM-WIRING-26` | `alRideGallop`, `alRideLeap`, and `alRideRear` are preloaded and drawn as one rider/wolf silhouette; duplicate bodies suppressed; cold-cache fallback retained. | `wolf-mount-contract` PASS; gameplay-size static sample inspected | Source fixed; dynamic blocked |
| `WOLF-STAMINA-RESET-26` | Remaining stamina lives on the summoned wolf; voluntary remount retains it; a fresh summon starts full. | `wolf-mount-contract` PASS | Fixed at component level |
| `NULLFANG-COVER-RNG-26` | Rustle choice, pitch, clump impulse and leaf impulses use the cover's private RNG rather than combat `Math.random`. | source contract in `wolf-mount-contract` PASS | Source fixed; seeded runtime matrix blocked |
| `ALPHA-ORDER-26` | New Alpha offers require `bossGlitch`; Ratchet cannot activate the side quest before NULLFANG; existing completed rewards remain untouched. | `alpha-order-contract` PASS | Runtime order fixed; story depth open |
| `AUDIT-BLOCKER-CLASSIFICATION-25` | Browser launch denial is reported as BLOCKED instead of hundreds of false product failures. | audit unit logic + full registry behavior | Fixed |

No artwork was regenerated. Deleted rejected, superseded, “before,” trial, review and unused manhwa assets were not restored.

## Previous-review comparison

| Previous finding | Current status |
|---|---|
| Old campaign graph/language in the 2026-11-25 report | **Superseded by later owner ruling.** Runtime now follows GRAVEHORN → CHIME → TALLYMAN → NULLFANG. Documentation/oracle drift remains. |
| Caption FIFO, purification wording, ferry ownership, sewer return, quest atomicity, infection authority, preloads, AAC provenance | Previous fixes were absent from `main`; **reapplied and verified on this branch**. |
| Alpha offered at forge time | **Order fixed here** by `bossGlitch` gate. Full pack-agent/backstory semantics and save-migration playthrough remain open. |
| First cave redundancy | **Source materially improved.** CV1B is a survey/cache branch, CV2 has beacon/evidence/pod, CV3 has GRAVEHORN + raw marble. Player comprehension and enjoyment are unverified. |
| Purified Sage sliding | **Source remains resolved.** Calm AI selects authored `sageWalk8`; no fresh runtime capture. |
| K2/manhwa parity, weapon canon, MIREJAW, UNDERTOW, vertical collision, Ratchet atomicity, accessibility | **Open.** |
| Runtime evidence gate | **Still blocked**, now classified honestly. |

## P1 findings register

### Story, campaign and cinematics

| Stable ID | Consequence and evidence | Acceptance condition |
|---|---|---|
| `STORY-AUTHORITY-DRIFT-26` | `docs/STORY_SCRIPT.md`, `docs/CAVES_CH1.md`, `docs/CHAPTER_ONE_WALKTHROUGH.md`, `docs/studio/roles.json`, the mission role, and route tests retain obsolete order/identity/exit language. Future agents can reintroduce a fixed regression while following project documentation. | One contract asserts GRAVEHORN < CHIME < TALLYMAN < NULLFANG < optional Wolf King < A4 door < A14 < B1; no player-facing “Meadow Sage/keeper” for TALLYMAN and no robot camp-hatch exit. |
| `K1-EXIT-PANEL-CONTINUITY-26` | The first `ch2` panel/caption still shows a ceiling hatch above Ratchet's camp while runtime exits through NULLFANG's vine door and A14. | Replace only the first teaser panel/caption with A4/A14 continuity; preserve the three threat panels; replay/skip/reload agree. |
| `MANHWA-AUTH-01` | All seven chapter entries remain draft; all 32 edition pages are uncertified for full scenes. | Pin one approved edition and certify identity, room, action, equipment, spoiler timing and crop for every runtime panel. |
| `K2-MANHWA-PARITY-22` | A4 door, A14 road, B1 threshold, Rivet, MIREJAW, shell and UNDERTOW lack authoritative illustrated parity. | A certified A4→A14→B1 bridge plus per-beat K2 mapping. |
| `ALPHA-SEMANTICS-01` | Ordering is repaired here, but the post-NULLFANG quest still lacks the promised controlling-agent reveal/covenant depth and has no uninterrupted migration proof. | Approved post-NULLFANG backstory, preserved old rewards, one offer, clean causal link to the pack agent, and ordinary-input Alpha-skip/complete routes. |

### Character art, bosses, combat and VFX

| Stable ID | Consequence and evidence | Acceptance condition |
|---|---|---|
| `HERO-WEAPON-CANON-26` | `assets/source/weapons/canon.json` has empty `canon`, 25 queued wrong-weapon strips and three missing air strips. Registration PASS is not fidelity. | Re-fire only registered weapon-bearing states from the three approved crystal references; queue empty, missing empty, gameplay-size contact matrix passes. |
| `NULLFANG-PHASE2-ART-01` | Common phase-two states still grade phase-one bodies. | Authored damaged/vented idle, prowl, primary attack, leap/land and hurt/recovery. |
| `GRAVEHORN-PHASE2-ART-01` | Escalation remains lighting over phase-one plates. | Authored opened/molten/vented bodies and live transition. |
| `UNDERTOW-DUEL-COVERAGE-25` | GB1D has unique art but still uses older shared Sage behavior; only GA1D receives the authored agent duel. | Three or more sewer/current-specific telegraphed moves, fair counters/recovery, shell interaction and exactly-once purification/reward. |
| `MIREJAW-INFECTION-AUTHORITY-01` | Code classifies MIREJAW purple because it is a Boss, but canon never decides infected versus clean. | Decide authority, then align optics, dialogue, resolution, anchors and reward. |
| `MIREJAW-EYE-POSE-GAP-26` | If infected, purple eye/trail disappears for all 16 roll and 14 turn cells despite visible brow optics. | Either suppress all infection optics if clean, or account for all 226 rendered cells with explicit occlusion gaps only. |
| `MIREJAW-TAIL-SYNC-01` | Tail contact/damage is state/time driven rather than visible-frame driven. | Pose-aware swept tail contact with early/contact/recovery tests and synchronized sound/VFX/haptic. |
| `MIREJAW-WEAKPOINT-SPATIAL-01` | Leap bonus damage lacks a belly-region spatial test. | Facing-aware weak region sampled across leap frames. |
| `WORLD-FALL-01` | Vertical collision probes only the final row; long frames can tunnel through ground/ceilings. | Sweep every crossed row; identical contacts at 30/60/120 Hz and a 1/30-second spike. |
| `FRAME-INVARIANCE-22` | New NULLFANG/mount tests use fixed 60 Hz. | 30/60/120 Hz + spike matrix for tells, contacts, hit count, cooldowns, sight memory and stamina. |

### Missions, NPCs and persistence

| Stable ID | Consequence and evidence | Acceptance condition |
|---|---|---|
| `NPC-ATOMIC-01` | Ratchet cell, wake, release, Pack, spare and inventory cross multiple persistence boundaries. | One versioned idempotent transaction with rollback and partial-save migrations. |
| `PACK-AUTHORITY-DRIFT-21` | Canon says the Volt Pack is the first purchase; runtime gifts it after waking. | Owner-approved buy-or-gift rule, then one exactly-once implementation and migration. |
| `K2-SEWER-QUEST-ORDER-25` | MIREJAW can be defeated before Rivet asks, reducing Rivet to a crafting terminal. | Gate behind the ask or adapt early-discovery dialogue; normal and early-skin paths both preserve one craft/reward. |
| `BOSS-REWARD-ATOMIC-22` | Boss flags, unique rewards and persistence can still settle separately. | Idempotent transaction plus failpoint/reload migrations for every named boss. |

### Runtime, UI and accessibility

| Stable ID | Consequence and evidence | Acceptance condition |
|---|---|---|
| `RUNTIME-EVIDENCE-01` | 247 browser checks never launched; feel, readability and continuity are not certified. | Exact-commit staged suite plus uninterrupted keyboard/controller/touch routes with reload checkpoints. |
| `FERRY-TEXT-REVEAL-01` | Ferry choice renders instantly instead of reveal-first. | Shared reader; first confirm reveals, later confirm chooses; five-language proof. |
| `CANVAS-OVERLAY-A11Y-26` | Dialogue, ferry, cards and end/store screens are canvas-only. | Semantic localized DOM mirror, focus management, NVDA/VoiceOver operation. |
| `TEXT-SCALE-01` | No persisted 100/125/150/200% text scale; browser zoom is disabled. | Rewrap/repaginate every surface at 200% on desktop and phone in five locales. |

## Cave and forward-flow assessment

| Space | Current purpose | Review decision |
|---|---|---|
| A5 → CV1 | Loose floor/gate into the first cave | Source-forward and story-motivated; live guidance blocked |
| CV1B | Side survey, later-skill cache shelf, scrap and combat | Meaningful optional branch; preserve |
| CV2 | Beacon, founding terminal, exploration pockets and pre-fight pod | Meaningful; preserve |
| CV3 | GRAVEHORN, raw marble, return | Strong story-critical payoff |
| GA1T/GA1/GA1D | TALLYMAN approach/rest/duel | Correct runtime position after CHIME; docs still stale |
| A10R/A10 | Wolf road and Alpha covenant/Pack | Meaningful optional topology; now gated after NULLFANG on review branch |
| A4/A14/B1 | Freed lion opens vine door; frontier dash road; K2 threshold | Strong source causality; teaser art contradicts it |
| SW1–SW5/SW3 | Bilge and MIREJAW arc | Meaningful; Rivet causality can be skipped |
| GB1/GB1T/GB1D | Rivet, shell traversal, UNDERTOW | Meaningful structure; climax behavior too generic |

No room is called “meaningful” merely because it has an exit or scrap. The verdict requires a distinct discovery, decision, skill check, story fact, relationship, or progression payoff.

## Artwork and gameplay-size inspection

The completed mount strips were inspected at approximately the runtime draw height, not at source-poster scale:

| Strip | Grid | Observation |
|---|---:|---|
| `alRideGallop` | 15 × 372×260 | Coherent single silhouette; feet within 1–9 source pixels of the cell floor |
| `alRideLeap` | 10 × 372×282 | Gather is grounded, flight rises, landing returns within 0–1 source pixels |
| `alRideRear` | 11 × 367×263 | Rear/forepaw/howl silhouette remains grounded and readable |

The branch now maps ground travel to gallop, airborne movement to leap, and scratch/howl to the rear strip. This is a **static/component acceptance**, not proof of frame pacing or contact alignment during play.

Completed assets to preserve and reuse include the approved hero family, crystal reference plates, all three mount strips and source film/contact sheet, five NULLFANG cover clumps and six leaves, existing NULLFANG/Alpha/wolf/MIREJAW moves, sewer/Rivet art, metal palm platforms, and all already-valid eye anchors. Do not restore or regenerate deleted refused/superseded/trial/review assets.

## Automated evidence

Exact command:

```sh
CHROMIUM_PATH=/usr/bin/chromium python3 tools/studio/audit.py \
  --profile full --output docs/studio/runs/2026-11-26/automated
```

| Result | Count |
|---|---:|
| PASS | 48 |
| BLOCKED | 247 |
| FAIL | 0 |
| TIMEOUT | 0 |
| Total | 295 |

Notable passes: four-page build, package, server identity, combat-impact static contract, repair lifecycle, panel continuity, media containers, archive cleanup, weapon registry bookkeeping, ledger, story opening, story progression, tutorial controller/clarity, offline release, dialogue audio, campaign certificate, scene caption FIFO, purification language, infection authority, atomic quest settlement, wolf-mount film/stamina, Alpha order, tile signatures, room manifests, ferry ownership, Alpha ceremony persistence, sewer route, AAC provenance, grapple/reel contracts and tails.

The full machine-readable result and logs are under [`automated/`](automated/). Browser-backed entries are blocked before execution because the browser payload is absent.

## Required uninterrupted real-input validation

When a real browser is available, run a fresh-save ordinary-input route without direct state mutation:

1. Wake → movement/jump/combat lesson → booth letter → toolbox repair → Ratchet revival → pod → winch/monument.
2. First cave entry → CV1B discovery → beacon/evidence → GRAVEHORN → raw marble → return → atomic forge.
3. CHIME → TALLYMAN → NULLFANG ambush/purification → freed walk/roar → A4 door → A14 dash pits → B1.
4. Rivet ask → Bilge → MIREJAW → shell → UNDERTOW.
5. Post-NULLFANG Alpha offer, den, covenant, Pack reward, reload.
6. Kingdom 3 Patch task using real called-wolf final blows → hand-in → reload → mount gallop/leap/dash/scratch/howl → voluntary dismount/remount at retained stamina → exhausted retirement.

Archive exact SHA, timestamps, screenshots/clips, input device, viewport, locale, save/reload points, page errors, audio/haptic observations, and whether the evidence is staged or uninterrupted.

## Release gates

Before merge/deploy:

1. Clear the browser/runtime gate and run the uninterrupted routes above.
2. Align all story/document/test authorities and replace the contradictory K1-exit teaser.
3. Finish canonical crystal-weapon strips without changing approved hero motion.
4. Author a distinct UNDERTOW duel and resolve MIREJAW infection/contact authority.
5. Fix swept vertical collision and prove frame-rate equivalence.
6. Resolve Ratchet/Volt Pack authority and atomic settlement.
7. Validate mount art/contact, NULLFANG warning/fairness, trails, audio, vibration and camera at gameplay size on desktop and phone.
8. Validate semantic accessibility, text scaling and device-aware control prompts.

The one implementation handoff is [`CLAUDE_PROMPT.md`](CLAUDE_PROMPT.md).
