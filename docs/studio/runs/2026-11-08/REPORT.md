# CLAWBYTE Senior Studio Review — 2026-11-08

## Release decision

**HOLD — do not merge or deploy.** Main and both authorized integration refs
have not moved since yesterday. This review fixes three bounded state/authority
defects on top of the verified November 7 branch, but rendered gameplay, the
uninterrupted campaign, and physical-device proof remain unavailable.

| Item | Result |
|---|---|
| Production `main` | `7da3c87e6b43a2357a2f52080814ae1d6adad618`, unchanged |
| Integration refs | `origin/odyssey` and `origin/claude/clawbyte-repo-migration-byhyl8` also `7da3c87...` |
| Verified review base | `d2302a8f1189e37b533e3c45eb954924d80e2297` (Nov 7) |
| Exact audited source | `b9eb06656d793edf782f5af3b3079d378832c86c` |
| Review branch | `codex/studio-review-2026-11-08` |
| Build/package | PASS |
| Automated evidence | 205 entries: 40 pass, 165 blocked |
| Raw-log integrity | PASS: 203/203 actual log files match their embedded snapshots |
| Staged rendered gameplay | BLOCKED: Chromium executable unavailable |
| Uninterrupted ordinary-input campaign | BLOCKED before launch |
| Physical iOS/Android/controller | NOT RUN |
| Production merge/deploy | NOT ATTEMPTED |

The 40 passes comprise 36 source/headless harnesses and four infrastructure
gates (build, package, served identity at start/end). They do not certify motion,
timing, audio, haptics, input feel, or a natural player journey.

### Remote publication attestation

The published source/evidence commit is
`c753cc0737e122364995842f3762ac88f110beea` with tree
`e870d6fb5949413c53636d62040e57c2724566b4`. That tree exactly equals local
evidence commit `a42a326...`; all 24 new blobs were accepted only after the
connector-returned SHA matched the local Git blob, and 199 unchanged-content
blobs reuse objects already present in the verified November 7 tree. A fresh
fetch confirmed the complete tree equality, `js/game.js` remains 988,450 bytes /
18,223 lines and parses, and corrupt November 6 commit `2718f6e...` is not an
ancestor. This attestation paragraph is a documentation-only fast-forward on
top of that verified tree.

## Change since November 7

There is no production, integration, authored-art, sound, VFX, or cinematic
delta. No completed asset was regenerated. Today's candidate adds:

1. **Atomic quest settlement.** `questPay()` now builds the complete durable
   result in a cloned save, persists once, rolls back in-memory state on write
   failure, and performs cards/sound/VFX only after the successful commit.
   `servo_coil`, `ratchet_deep`, and `ratchet_forge` are covered for exact
   rewards, fetch removal, ownership, replay, forge state, and failed writes.
2. **Gravehorn quarry gate.** The visible CV3 marble pillar can no longer be
   burst-quarried before `bossHorn`; this closes the evade→marble→reload path
   that migration would otherwise reinterpret as a defeated Gravehorn.
3. **Room-bake identity.** Equal counts of different broken tiles no longer
   alias in `tileSig`; sorted room-local coordinates now participate in the
   cache signature.
4. **Eye authority reconciliation.** The Gravehorn combat brief now reserves
   purple `#ba5cff` for the boss infection eye and red for attack nozzles,
   cracks, and hazards. A contract protects the distinction.
5. Four generated HTML pages were rebuilt from the changed source.

## Newly confirmed blockers

### P1 — cave reward identity collision

`ratchet_deep` rewards relic `coin`, while A11 and A13 also place secret
`coin` rewards (and another `coin` secret exists in A11's related route).
`grantRelic()` deduplicates by relic ID and the secret latch is global
`sr_coin`, so the first source can consume the durable payoff of the others.
The existing cave test stages rooms independently and cannot prove all three
orders across reload. Do not invent replacement relic lore in code. Mission and
story authority must assign distinct durable IDs/payoffs, then test every order.

### P1 — manhwa target authority conflict

`docs/STORY_CANON.md` calls September Draft 3 current and refers to a forty-page
target. `manhua/full-story.md` calls Draft 4 current; `manhua/edition.json` also
labels Draft 4 and contains 32 illustrated entries whose status says expanded
Draft 4 scenes are not all illustrated. Therefore yesterday's “40-row” target
is not a valid completion definition until the owner pins the canonical
revision and parity unit (page, shot, or beat). Generate no replacement panels
until that decision is recorded.

### P1/P2 — remaining durability and UI risks

- Ratchet/Servo battery seating persists the powered flag before later intro or
  repaired latches. Fault-injection is still required to prove that interruption
  cannot strand a powered NPC without its continuation.
- Locale inventory remains EN 619, AR 600, TR/ZH/RU 215; fallback is functional
  but not five-locale parity.
- Overlay queues remain unbounded and ownership is convention-based. Add
  measurement/coalescing without ever evicting critical story text.

## Test and evidence ledger

### Commands and results

- `npm ci` — PASS, 160 packages.
- syntax checks for `js/game.js`, `js/entities.js`, `js/quests.js` and new tests — PASS.
- targeted quest, quarry, tile signature, eye authority, story, repair, Alpha,
  caption, and Sage contracts — PASS.
- `python3 -m unittest tools.studio.test_audit` — PASS, 14 tests.
- `node build.cjs` — PASS, four pages built.
- `node tools/pack-www.cjs` — PASS, 694 assets / 252.5 MB package.
- full collector on exact source `b9eb066...` — 205 results: 40 pass, 165 blocked,
  zero executed failures/timeouts; `complete_requested_scope=true` and
  `log_integrity.ok=true`.
- Playwright Chromium install — BLOCKED after five 0 MiB invalid/truncated ZIPs.

| Class | Count | Meaning |
|---|---:|---|
| Runner harnesses | 201 | 36 runnable source/headless; 165 direct-browser lanes |
| Infrastructure gates | 4 | build, package, served identity start/end |
| Pass | 40 | narrow contracts and infrastructure only |
| Blocked | 165 | Chromium missing; not pass and not executed failure |
| Executed fail/timeout | 0 | no runnable check failed |

Evidence is in `automated/results.json`, `automated/log-integrity.json`, and the
adjacent canonical logs. The collector started from clean commit `b9eb066...`.
Two identity records intentionally have no log; the other 203 records have
byte-identical disk and embedded snapshots.

### Evidence boundaries

- Source/headless contracts prove only the asserted invariant.
- Staged browser harnesses may inject saves, rooms, flags, inventory or position.
- `campaign-ch1` is the sole uninterrupted cleared-storage ordinary-input
  chapter certificate; it was blocked before launch.
- A mobile viewport with keyboard traversal is not physical touch/device proof.
- Stills prove appearance only, never movement, attack feel, audio, input,
  finite particle lifetime, or sustained performance.

## Owner story and chapter-one route

Source authority still expresses the intended chain: corrupted Mother Song →
electrical wake → clue → Ratchet battery-board repair → crystal explanation →
caves → Gravehorn → single marble → white Purifier forge → first Sage purified,
not killed → CHIME → NULLFANG ritual → B1. A10/Alpha is optional and must be
rewarding without blocking the mandatory A1→A2→A3→A4 road.

The quarry bypass is now closed and quest settlement is transaction-safe at the
source-contract level. The chapter is still not certified as a player's
experience because its natural campaign never launched. Caves are not “meaningful”
until the no-injection route demonstrates that every discovery is noticed,
understood, paid once, survives death/reload, and changes later play.

## Fifteen senior-role findings

### 1. Senior Cinematic Designer — HOLD P1

- Story target is ambiguous: Draft 3/forty-page authority conflicts with Draft
  4/32 illustrated-entry material.
- Caption FIFO/reset source contracts pass; rendered pacing, locales, skip,
  reload, intercuts and four missing rituals remain unproved.
- Acceptance: owner pins revision/parity unit; certify every row before new art;
  capture normal-entry and reload triggers with smooth picture/music endings.

### 2. Senior Game Designer, Player Systems — SOURCE PASS / HOLD

- Tutorial, focus, feedback and progression contracts pass.
- Real tap/hold/release/cancel/heal sequences did not execute.
- Acceptance: three cleared-state keyboard/controller/touch cycles; exactly one
  charged release, no cancel/focus release, one heal deduction, no tutorial lock.

### 3. Senior Mission Designer, Quest Craft — HOLD P1

- Quest settlement is now one tested durable write with rollback.
- Cave `coin` rewards still collide by global identity.
- Acceptance: assign authorized distinct reward IDs/payoffs; test all acquisition
  orders and reloads; natural Ratchet→caves→forge journey pays each source once.

### 4. Principal Encounter Designer — HOLD P1/P2

- CV3 marble is now unavailable until legitimate Gravehorn retreat.
- Cave suites still stage state; navigation, preparation and reward comprehension
  are unproved. Gravehorn remains procedural stand-in art.
- Acceptance: no-injection A2→A5→CV1→CV1B→CV2→CV3 win and death/retry with
  every landmark and payoff visible once.

### 5. Senior Boss Designer — HOLD P1

- Gravehorn state-machine depth exists, but no authored plate rig exists.
- Purple boss-eye authority now agrees across runtime, art queue, story and
  combat brief. Historical capture still shows an obsolete red eye.
- NULLFANG friendly cleanup, live tells, ritual return and Alpha complete/skip
  remain rendered blockers.

### 6. Senior Mission Designer, Campaign — HOLD P1

- Required route and optional A10 topology are source-coherent.
- `campaign-ch1` was blocked; no ordinary-input run reached B1.
- Acceptance: cleared-storage Alpha-complete and Alpha-skip campaigns, no direct
  state writes/teleports/inventory injection, with death/reload and legal gates.

### 7. Senior Mission Producer — HOLD

- Main/integration are unchanged and the Nov 7 branch remains the only safe
  review base. Never use Nov 6 corrupt commits `2718f6e...`/`ca8bf245...`.
- Today's exact source builds and all runnable checks pass, but release gates do not.
- Publish this review branch only; no merge/deploy.

### 8. Senior Character Artist — HOLD P1/P2

- Preserve approved hero, Alpha/pack, NULLFANG, crystal, marble, sword and Sage
  walk assets. No art was regenerated.
- Gravehorn is visibly procedural; wolf crouch is a tell, not complete
  down/breathe/recover coverage. The alleged Sage matte was not reproduced.
- Use bounded masks/rig additions only after a failed parity/evidence row.

### 9. Senior Cinematic Director — HOLD P1

- Only `purify_glitch_ritual.mp4` meets the current ritual contract; preserve it.
- Brood/Atlas/Zero/Prism films and Gravehorn intercuts remain missing/currently
  noncompliant. Every video requires a deliberate audio and picture fade-out.

### 10. Senior VFX Artist — SOURCE PASS / RENDERED HOLD

- Runtime authority is red ordinary eyes, purple boss/guardian/Alpha eyes,
  pose/facing anchors, finite world-space wisps, cleanup and reduced-motion glow.
- No fresh rendered roster/stop/purify/room-crossing/budget proof ran.
- Acceptance: trail emits only while moving and fully dies on stop, hide,
  purification or removal; hard cap; no screen-lock or room leakage.

### 11. Associate Technical Director, World Systems — SOURCE PASS / HOLD

- Mandatory road/optional A10 topology remains coherent.
- New coordinate-stable `tileBrokenSig` closes equal-cardinality stale-bake reuse.
- Chromium `roomcache` pixel/timing proof and campaign traversal remain blocked.

### 12. Gameplay Engineer, Combat — SOURCE PASS / HOLD P1

- HP/defense/attack, white flash, debris, recoil, hit-stop, shake and charged
  impact contracts pass. Browser input/audio/haptics did not execute.
- Acceptance: tap=one normal hit, hold ≥0.6 s=one 38-point burst/25V deduction;
  cancel=none; protected/friendly/purified targets take zero.

### 13. Gameplay Engineer, Mission — FIXED CONTRACT / RUNTIME HOLD

- Independent reproduction confirmed Nov 7 partial-payment/forge-loss defects.
- New settlement commits full state once and replay/failed-persist contracts pass.
- Still required: browser save/reload and natural campaign; add narrow migration
  for legacy `ratchet_forge=done` without Purifier after authority review.

### 14. Gameplay Engineer, NPC — SOURCE PASS / HOLD P1

- Repair lifecycle and Sage-walk contracts pass; purified moving Sage selects
  walk art rather than the sleeping slide.
- Ratchet/Servo browser journey and gameplay-size Sage motion are blocked.
- Fault-inject NPC powered/intro boundaries before release.

### 15. Lead UI Engineer — SOURCE PASS / HOLD P1/P2

- Caption queue retains unread entries and reset clears visible/queued captions.
- Localization is incomplete; queue backpressure/telemetry and exclusive overlay
  ownership are absent; device/rendered UI evidence is blocked.
- Acceptance: 4+ caption FIFO, nested overlays, five-locale wrap/page/RTL at
  1280×720 and 844×390 DPR2, one input consumer, physical iOS/Android proof.

## Gameplay-size static inspection

| Evidence | Observation | Bounded action |
|---|---|---|
| `gravehorn-intro.png`, 844×390 | Finished hero beside pale procedural boss; historical red eye conflicts with current purple authority | Replace with authored rig; capture purple anchored eye/trail in current build |
| `m_down.webp`, 1600×893 | Polished lion composition, but infected boss eyes are visibly red | After revision/parity row is pinned, mask eyes purple only; preserve composition |
| `r_cell.webp`, 1600×893 | Inactive background Servo has lit amber/cyan elements | Mask only if certified row says powered-down |
| `passage_b.webp`, 1600×893 | Strong cave composition; rear hero proportions read taller than approved hero | Correct identity/proportion only after parity failure |
| `wolf_crouch4.webp`, 848×97 | Four-cell crouch/tell; not full recovery set | Add only missing down/breathe/recover frames |
| `sage/walk8.webp`, 1536×192 | Transparent eight-cell gait; no grey matte reproduced | Preserve until live capture proves a defect |

## Integration priorities

### P0

1. Use Nov 7 safe ancestry only; reject Nov 6 corrupt commits.
2. Verify every published blob/tree against the local committed object.
3. Keep merge/deploy closed.

### P1

1. Integrate and reverify today's quest, quarry, tile-signature and eye-brief fixes.
2. Resolve cave reward IDs through mission/story authority; test all orders.
3. Resolve Draft 3 versus Draft 4 and define the parity unit before art generation.
4. Restore pinned Chromium; run staged suites, then unchanged uninterrupted campaign.
5. Fault-inject NPC charge/intro durability.
6. Produce only missing Gravehorn rig/intercuts and four missing rituals.

### P2

1. Bounded eye/light/proportion/recovery masks only after certified failures.
2. Complete five locales and overlay ownership/backpressure.
3. Physical device/controller/audio/haptic/safe-area/interruption/performance proof.

## Preserve list

- `assets/characters/hero/**`, Alpha/pack, approved beast, NULLFANG assets
- approved sword, crystal and marble art
- `assets/video/purify_glitch_ritual.mp4`
- `assets/characters/sage/walk8.webp` pending live contrary evidence
- existing manhwa compositions; only bounded masks after canonical parity review

## Final studio decision

Today's branch materially improves durability and closes a story bypass, but it
does not certify the game. The exact candidate builds, packages and passes every
runnable check; 165 browser lanes, the uninterrupted campaign, and physical
devices remain blocked or unrun. **No production merge or deployment occurred.**

