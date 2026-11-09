# CLAWBYTE Senior Studio Review — 2026-11-09

## Release decision

**HOLD — do not merge or deploy.** Production and the authorized integration
refs have not moved since the November 8 review. This branch adds two bounded,
tested durability repairs, but it does not provide rendered gameplay, an
uninterrupted Chapter One playthrough, physical-device proof, or canonical
manhwa parity. No completed art, audio, VFX or film was regenerated.

| Item | Result |
|---|---|
| Production `main` | `7da3c87e6b43a2357a2f52080814ae1d6adad618`, unchanged |
| Authorized integration refs | `origin/odyssey` and `origin/claude/clawbyte-repo-migration-byhyl8` also `7da3c87...` |
| Previous review | `codex/studio-review-2026-11-08` at `b25e66d291b58e1306601002d8701403326d07f1` |
| Exact audited source | `27121725487a0758c80d29bfe0337e600874350e` |
| Audited source tree | `b9be3eba184827d887fad4711c54f763de586b8f` |
| Evidence content commit | `EVIDENCE_COMMIT_TO_BE_ATTESTED` |
| Review branch | `codex/studio-review-2026-11-09` |
| Build/package | PASS |
| Automated evidence | 206 records: 41 pass, 165 blocked |
| Raw-log integrity | PASS: 204/204 actual logs match their embedded snapshots |
| Staged rendered browser tests | BLOCKED: Chromium is unavailable |
| Uninterrupted ordinary-input campaign | BLOCKED before launch |
| Physical iOS/Android/controller | NOT RUN |
| Production merge/deploy | NOT ATTEMPTED |

The 41 passes are 37 source/headless harnesses plus four infrastructure gates.
They certify only the assertions they execute. They do not certify animation,
attack feel, audio, haptics, input timing, finite rendered particles, campaign
comprehension, or sustained device performance.

## Status boundary

| Claim | Status | Evidence boundary |
|---|---|---|
| Implemented on review branch | YES | Atomic NPC restore and legacy completed-forge recovery, plus rebuilt pages |
| Tested as source/headless contracts | YES | Targeted tests and full collector runnable lanes pass |
| Visually inspected | LIMITED | Six existing still/sprite assets inspected at gameplay scale; no fresh runtime frames |
| Integrated into `main`/authorized integration | NO | All three refs remain `7da3c87...` |
| Deployed to production | NO | Explicitly not attempted |

## Change since November 8

There is no production, integration, authored-art, sound, VFX or cinematic
delta. The November 8 functional pack is retained unchanged. Today's candidate
adds only the following bounded fixes:

1. **Crash-safe NPC restoration.** Battery/cell removal, awake state,
   `ratchetRepaired`, kit/spare-cell gift or generic scrap now settle on one
   cloned save with one persist. A failed write rolls memory back. Animation,
   dialogue, sound and gift presentation begin only after durable success.
2. **Legacy Purifier recovery.** A save with `ratchet_forge=done` but no
   `flags.crystal` receives exactly one Purifier and Ratchet-camp state during
   migration. Active or unoffered quests are never promoted; rerunning migration
   is idempotent.
3. **Generated pages rebuilt.** `index.html`, `odyssey.html`, `forge.html` and
   `forge-odyssey.html` were rebuilt from the changed source.
4. **No asset regeneration.** Approved hero, Alpha/pack, NULLFANG, crystal,
   marble, sword, Sage and ritual media were preserved byte-for-byte.

## Stable finding register

| ID | Sev. | Finding and evidence | Owner / smallest authorized action | Acceptance | Status |
|---|---:|---|---|---|---|
| PROD-07-01 | P1 | The Nov 8 report advertised intermediate SHAs `b9eb066...` and `a42a326...` that a fresh clone cannot resolve; only combined `c753cc0...` is remote-reachable. | Producer: publish source first, fetch it, then run evidence on that exact reachable parent. | `results.json.base_commit` resolves remotely and equals the audited checkout. | **Fixed here:** source `2712172...` was published/read back before audit. |
| PROD-07-02 | P1 | Nov 8 omitted the pipeline's stable-ID register, cave census, parity matrix, animation/VFX matrix and performance/device matrix. | Producer: retain the complete mandatory schema in every review. | All required sections are present and populated. | **Fixed in this report.** |
| CIN-01 | P1 | `docs/STORY_CANON.md` names September Draft 3/current and a forty-page direction; `manhua/full-story.md` and `manhua/edition.json` name Draft 4, while all 32 edition entries say expanded Draft 4 is incomplete and runtime parity is uncertified. | Owner + cinematic designer: record one canonical revision and parity unit (page, shot or beat). Do not generate replacements first. | Every manifest row maps to runtime asset/room/state and is signed pass/fail. | **Open.** |
| QST-03 | P1 | `ratchet_deep` grants relic `coin`; D2, A11 and A13 each author a secret `coin`. `grantRelic()` deduplicates the relic and global `sr_coin` suppresses secret instances, collapsing four sources into one durable identity. | Mission/story authority: assign source-specific IDs/payoffs and migration; do not invent lore in engineering. | Acquire all four sources in every order with death/reload; each pays once and only once. | **Open.** |
| NPC-14-01 | P1 | Old restore flow persisted cell removal, powered flag, repaired flag and gifts separately. A crash after the first write could reload a dark Ratchet with no cell. | NPC engineering: one cloned settlement, one persist, rollback, presentation after commit. | Ratchet, Servo and generic cases each write once; failed write restores exact prior memory; replay cannot double-pay. | **Fixed here; headless pass. Rendered journey blocked.** |
| MIS-13-02 | P1 | Historical `ratchet_forge=done` saves could lack the Purifier if interrupted between quest settlement and forge persistence. | Mission engineering: narrow completed-state migration only. | Broken completed save gains one blade; active/none unchanged; repeat is identical. | **Fixed here; headless pass.** |
| ART-08-01 | P1 | Gameplay-scale `gravehorn-intro.png` shows a pale procedural animal beside finished hero art; no authored `assets/characters/gravehorn/` rig exists. | Character + boss art: author only the missing Gravehorn plate/rig after its shot/state list is frozen. | Idle, planted locomotion, turn, anticipation/contact/recovery, hurt, retreat and purple eye anchors pass gameplay-scale review. | **Open; do not replace with another procedural pass.** |
| ART-08-02 | P2 | `wolf_crouch4.webp` is a four-cell crouch/tell, not a down/breathe/recover set. | Character art: add only missing recovery coverage; preserve approved wolf identity. | No sleeping slide; readable down, breath and planted recovery at gameplay size. | **Open.** |
| ART-08-03 | P2 | `m_down.webp` has red infected boss eyes, `r_cell.webp` shows lit background Servo, and `passage_b.webp` reads taller than approved hero proportions. Canon/parity is not pinned. | Art/cinematic: bounded masks or proportion correction only after a certified parity-row failure. | Corrected row matches approved runtime identity without composition drift. | **Blocked by CIN-01; no edit made.** |
| CIN-09-01 | P1 | Only `purify_glitch_ritual.mp4` satisfies the current ritual contract. Brood/Atlas/Zero/Prism clips are 960×540 legacy silent films and lack the required current ending contract. | Cinematic director: preserve Glitch; create only the four proven missing rituals and Gravehorn intercuts. | White gather → sword raise → slash → dark virus extraction → restored form; deliberate picture/music fade; runtime wiring verified. | **Open.** |
| VFX-10-01 | P1 | Source authority is red ordinary eyes, purple bosses/guardians/Alpha, motion-gated finite wisps, 1.5 s life, cap 320, cleanup and reduced-motion glow-only. Browser roster/stop/cross-room/purify proof did not run. | VFX + engineering: capture current build, do not change source values without measured failure. | Trail is born at the animated eye only while moving and fully dies on stop, hide, purify, remove, teleport and room change; cap holds. | **Source pass; rendered blocked.** |
| CAM-06-01 | P1 | `campaign-ch1` is the sole uninterrupted real-input certificate and was blocked before launch. `campaign-contract` is a logic contract, not a playthrough. | Campaign + QA: run cleared-storage ordinary input without flags, inventory or teleport injection. | Alpha-complete and Alpha-skip runs reach B1 with all ordered beats, death/reload and legal gates. | **Blocked.** |
| UI-15-01 | P2 | Locale inventory is EN 619, AR 600, TR/ZH/RU 215 each; fallback works but five-locale parity does not. | UI/localization: complete keys, then review page/wrap/RTL. | Zero missing keys and signed 1280×720 plus 844×390 DPR2 captures in all locales. | **Open.** |
| UI-15-02 | P2 | Caption reset/FIFO contracts pass, but queues are unbounded and overlay ownership remains convention-based. | UI engineering: measured coalescing/backpressure that never discards critical story text; one overlay input owner. | 4+ queued captions, nested overlays, skip/reload and long session remain ordered and bounded. | **Open; rendered blocked.** |
| PERF-11-01 | P1 | Package is 252.5 MB and rendered lanes are unavailable; no low-end phone FPS, memory, thermal, GPU trail cost or loading-spike evidence exists. | Technical director: profile representative low/mid devices after Chromium/device access. | Published budgets and 10-minute captures for cave, swarm, boss, purification and room transitions. | **Unverified.** |

## Build and evidence ledger

### Commands and observed results

- `node --check js/game.js` and `node --check js/quests.js` — PASS.
- `node tests/npc-restore-contract.cjs` — PASS, one-write restore,
  rollback and replay protection.
- `node tests/quest-payment-contract.cjs` — PASS, including completed legacy
  forge recovery and active/none non-promotion.
- repair, story progression, Alpha optionality, Gravehorn quarry, tile identity,
  Gravehorn purple-eye and audit unit contracts — PASS.
- `python3 -m unittest tools.studio.test_audit` — PASS, 14 tests.
- `node build.cjs` — PASS: four pages, 3.49–4.74 MB each.
- `node tools/pack-www.cjs` — PASS: 694 assets / 244.3 MB plus two pages /
  8.2 MB, total 252.5 MB.
- Playwright Chromium install — BLOCKED after five separate downloads returned
  zero-megabyte invalid ZIP archives.
- Full collector on exact remote source `2712172...` — 206 records: 41 pass,
  165 blocked, zero executed failures/timeouts; `complete_requested_scope=true`,
  `log_integrity.ok=true`.

| Class | Count | Meaning |
|---|---:|---|
| Runner harnesses | 202 | 37 runnable source/headless; 165 direct-browser lanes |
| Infrastructure gates | 4 | build, package, served identity at start/end |
| Pass | 41 | Narrow contracts and infrastructure only |
| Blocked | 165 | Chromium missing; neither pass nor executed failure |
| Executed fail/timeout | 0 | No runnable check failed |
| Canonical logs | 204 | Two identity records intentionally have no log; all others match snapshots |

Evidence lives in `automated/results.json`, `automated/log-integrity.json` and
adjacent canonical logs. The collector's `base_commit` is the remotely
retrievable audited source `27121725487a0758c80d29bfe0337e600874350e`.

### Staged versus uninterrupted proof

| Evidence type | Ran? | What it can prove |
|---|---:|---|
| Source/headless contracts | YES | Only explicit state, math, topology, persistence and source assertions |
| Staged browser harnesses | NO — blocked | Would inject rooms/saves/flags/position for focused rendered checks; never counts as campaign proof |
| `campaign-contract` | YES | The campaign harness itself forbids diagnostic injection; not the journey |
| `campaign-ch1` ordinary-input journey | NO — blocked before launch | Sole full Chapter One certificate |
| Existing stills/sprite sheets | YES, visually inspected | Appearance/composition only; never motion, sound, input or trail lifetime |
| Physical devices/controller | NO | No touch, safe-area, interruption, thermal, haptic or hardware-controller certification |

## Owner story and Chapter One route

The source-authoritative route remains: corrupted Mother Song → electrical wake
→ clue → Ratchet battery-board repair → crystal explanation → early cave →
Gravehorn → one raw marble → white Purifier forged → first Sage purified rather
than killed → CHIME → NULLFANG purification → B1. Alpha/A10 is optional and
must be rewarding without blocking the A1→A2→A3→A4 road.

The November 8 review closed early quarry access and made quest settlement
atomic. This review closes the NPC restore crash window and repairs already
completed legacy forge saves. The route is source-coherent but still **not
certified as a player's experience** because no clean ordinary-input campaign
launched.

## Cave census and meaning audit

| Network / room | Authored content and payoff | Meaning verdict | Proof state |
|---|---|---|---|
| `CV1` | Entry teaches carved terrain and hidden pocket; crawler, core chest, 10 scrap; return mouth and Seam door | Useful introduction with health payoff | Source-inspected; rendered traversal blocked |
| `CV1B` | Optional Seam branch, bench, bat, 80 total scrap, rejoin route | Useful rest/branch; avoids forced backtracking | Source/topology contracts only |
| `CV2` | Long dark, enemies, two pockets, terminal 5 Deaf System beacon, 65 scrap | Strongest narrative cave room; beacon explains disconnected cave doctrine | Source-inspected; comprehension unverified |
| `CV3` | Gravehorn arena, delayed ordinary enemies, pocket, gated marble pillar | Main-story climax/payoff; quarry is locked until legitimate retreat | Source contracts pass; fight/render blocked |
| `A7` shaft | Quarry survey terminal 20, enemies and 115 scrap; `ratchet_deep` completes only by reading | Purposeful optional history, but its `coin` reward collides | Source contract only; QST-03 open |
| `GA1/GA1T/GA1D` | NULLFANG grotto/tunnel/deep trio | Same shared template as every guardian network | Rendered journey blocked |
| `GA2/GA2T/GA2D` | Alpha optional grotto/tunnel/deep trio | Optional topology is correct; content is templated | Source contract pass; journey blocked |
| `GB1/GB1T/GB1D` | Brood trio | Identical structural/reward pattern | Meaningful unique story not yet authored |
| `GC1/GC1T/GC1D` | Atlas trio | Identical structural/reward pattern | Meaningful unique story not yet authored |
| `GD1/GD1T/GD1D` | Zero trio | Identical structural/reward pattern | Meaningful unique story not yet authored |
| `GX1/GX1T/GX1D` | Prism trio | Identical structural/reward pattern | Meaningful unique story not yet authored |
| `GE1/GE1T/GE1D` | Mother trio | Identical structural/reward pattern | Meaningful unique story not yet authored |

All seven guardian networks currently repeat the same three-room recipe: grotto
with 140 scrap and bench; tunnel with terminal 5, bat and 70 scrap; deep chamber
with a bat, a generic Sage and 140 scrap. This validates the owner's complaint
that later caves are structurally present but narratively redundant. The engine
supports unique rooms; each network now needs an authority-approved local story,
distinct interaction/challenge and consequence. Do not manufacture seven new
relic names in code before mission/story approval.

The four authored `coin` sources are `ratchet_deep`, D2, A11 and A13. Their
identity collision must be resolved before any cave can be certified as paying
its own discovery.

## Manhwa parity matrix

| Scope | Repository evidence | Runtime mapping / result | Status |
|---|---|---|---|
| Canonical revision | `STORY_CANON.md`: Draft 3/current and forty-page direction; `full-story.md` + `edition.json`: Draft 4 | No single target revision | **P1 authority conflict** |
| Edition pages 1–8 | Eight 1024×1536 earlier-script illustrations | Every row says expanded Draft 4 incomplete and full scene not certified | HOLD |
| Edition pages 9–16 | Eight 1024×1536 earlier-script illustrations | Same status; no signed asset/room/state parity row | HOLD |
| Edition pages 17–24 | Eight 1024×1536 earlier-script illustrations | Same status; no signed asset/room/state parity row | HOLD |
| Edition pages 25–32 | Eight 1024×1536 earlier-script illustrations | Same status; no signed asset/room/state parity row | HOLD |
| Wake → Ratchet repair | Runtime source/panels exist | Strict natural campaign blocked; no full-scene certification | HOLD |
| Cave → marble → forge | Runtime route and assets exist | Ordering contracts pass; natural play and reader intercuts blocked | HOLD |
| Sage → CHIME → NULLFANG | Runtime source/assets exist | Rendered motion, ritual and ordinary-input causality blocked | HOLD |
| `m_down.webp` | Polished lion scene, visibly red infected eyes | Boss authority is purple; edit deferred until target row is canonical | HOLD / bounded mask candidate |
| `r_cell.webp` | Strong Ratchet scene, background Servo visibly lit | Powered-down state not parity-certified | HOLD / bounded mask candidate |
| `passage_b.webp` | Strong cave composition; rear hero reads tall | Approved hero proportion mapping not certified | HOLD / bounded correction candidate |

No edition page is certified for the full runtime scene. New panel generation is
therefore prohibited until the owner records the revision and parity unit.

## Animation, cinematic and VFX matrix

| Subject | Existing evidence | Verdict / missing acceptance |
|---|---|---|
| Hero | Approved variation/motion assets retained | Preserve; browser movement/impact review blocked |
| Alpha and pack | Authored identity and move strips retained; A10 remains optional | Staged/rendered move coverage and ordinary optional quest runs blocked |
| Ordinary wolf | `wolf_crouch4.webp` is a clean crouch/tell | Missing explicit down/breathe/recover; do not redraw full wolf |
| NULLFANG | Authored assets and source state machine retained | Meeting, planted gait, attacks, ritual, purified follow and finite purple trail need fresh rendered review |
| Gravehorn | Procedural drawing in historical 844×390 frame; current source purple-eye contract passes | Requires authored plate rig and current gameplay capture; historical red eye is obsolete evidence |
| Purified Sage | Transparent `sage/walk8.webp` is an eight-cell gait; walk selection contract passes | Preserve; sleeping-slide fix needs live gameplay-size proof |
| Combat impact | White flash, debris, recoil, hit-stop, shake and charged-strength contracts pass | Audio, haptic, tap/hold/release timing and feel blocked |
| Infection eyes | Ordinary red; bosses/guardians/Alpha purple; eye anchors and finite source system | Rendered roster, stop, cleanup, reduced-motion and cap proof blocked |
| Purification ritual | `purify_glitch_ritual.mp4`: H.264/AAC, 1280×720, 13.25 s, deliberate black/audio tail | Preserve; Brood/Atlas/Zero/Prism current-contract films missing |
| Manhwa intercuts | Runtime panel/reader mechanisms exist | Canonical row mapping, progressive text pacing and full campaign triggers blocked |

## Performance and device gaps

| Area | Known evidence | Missing release proof |
|---|---|---|
| Package/load | 694 assets / 244.3 MB; packaged web total 252.5 MB | Cold/warm load timings, cache behavior, offline install on target devices |
| Render budget | Source eye pool cap 320 and reduced-motion no-smoke path | Actual draw/GPU cost with swarm, boss, cave and purification overlap |
| Browser | Build/headless pass; Chromium download failed five times | Desktop Chromium/Firefox/Safari runtime, errors, screenshots and sustained frame pacing |
| Mobile | Viewport emulation lanes blocked | Real iOS/Android touch, DPR, safe area, rotation, suspend/resume, memory and thermal |
| Controller | Source mapping only | Real hardware mapping, disconnect/reconnect, focus/cancel and haptics |
| Audio | Existing files/source contracts | Listening pass for attack layers, roar, NPC wake, ritual and deliberate music/video fade |
| Long session | No current rendered run | Ten-minute cave/swarm/boss run, queue growth, memory, particles and room-cache stability |

## Fifteen senior-role verdicts

### 1. Senior Cinematic Designer — HOLD P1

Draft authority conflicts and no page/shot/beat parity unit is signed. Caption
FIFO/reset source contracts pass, but rendered progressive text, skip/reload,
locale wrapping, manhwa intercuts and picture/music endings remain unverified.

### 2. Senior Game Designer, Player Systems — SOURCE PASS / HOLD

Tutorial, focus, feedback and progression contracts pass. Real tap/hold/release,
cancel, heal, controller and touch sequences did not execute.

### 3. Senior Mission Designer, Quest Craft — HOLD P1

Quest settlement and the new completed-forge migration are atomic/idempotent at
contract level. The four-way `coin` collision prevents distinct cave payoffs.

### 4. Principal Encounter Designer — HOLD P1/P2

The early four-room cave has a coherent teaching arc and legitimate Gravehorn
gate. Seven later grotto networks repeat one generic recipe; Gravehorn remains a
procedural visual stand-in. No fight or death/retry traversal ran.

### 5. Senior Boss Designer — HOLD P1

Gravehorn source logic and purple-eye authority pass narrow contracts, but it
lacks an authored rig. NULLFANG/Alpha live tells, attacks, recovery, purification
and friendly cleanup remain rendered blockers.

### 6. Senior Mission Designer, Campaign — HOLD P1

Required route and optional Alpha topology are source-coherent. `campaign-ch1`
never launched; neither Alpha-complete nor Alpha-skip reached B1 by ordinary input.

### 7. Senior Mission Producer — HOLD

Main/integration are unchanged. November 6 corrupt commits `2718f6e...` and
`ca8bf245...` remain forbidden. The source-first publication corrects the prior
unreachable-SHA handoff; this branch only may be reviewed, never auto-merged.

### 8. Senior Character Artist — HOLD P1/P2

Approved hero, Alpha/pack, NULLFANG, crystal, marble, sword and Sage assets were
preserved. Gravehorn needs authored coverage; wolf needs only missing recovery.
The three panel discrepancies require a canonical parity verdict before masks.

### 9. Senior Cinematic Director — HOLD P1

Preserve `purify_glitch_ritual.mp4`. Produce only proven missing Gravehorn
intercuts and Brood/Atlas/Zero/Prism current-contract rituals, each with deliberate
picture and audio fade. No new film was generated today.

### 10. Senior VFX Artist — SOURCE PASS / RENDERED HOLD

Red ordinary/purple boss authority, motion gating, finite life, cleanup, cap and
reduced-motion fallback are present in source. No current rendered effect proof ran.

### 11. Associate Technical Director, World Systems — SOURCE PASS / HOLD

Road, A10 optional topology, cave carving, coordinate-stable broken-tile cache
and Gravehorn quarry gate pass contracts. Room-cache pixels, sustained cost and
real traversal remain blocked.

### 12. Gameplay Engineer, Combat — SOURCE PASS / HOLD P1

HP/defense/attack, normal/charged damage, flash, metal debris, recoil, hit-stop
and shake contracts pass. Browser input, audio, vibration and feel did not execute.

### 13. Gameplay Engineer, Mission — FIXED CONTRACT / RUNTIME HOLD

Legacy completed forge saves now recover exactly one Purifier; active/none saves
are untouched. Natural save/reload and the full campaign remain blocked.

### 14. Gameplay Engineer, NPC — FIXED CONTRACT / RUNTIME HOLD

Ratchet, Servo and generic NPC restoration now settle cell, awake/repaired state
and durable gift in one write with rollback. Wake animation/dialogue and Sage
walking remain unverified in a browser.

### 15. Lead UI Engineer — SOURCE PASS / HOLD P1/P2

Caption FIFO/reset contracts pass. Five-locale parity, bounded queues, exclusive
overlay input ownership, gameplay-scale wrapping and physical-device proof remain open.

## Gameplay-size static inspection

| Evidence | Observed at gameplay scale | Bounded action |
|---|---|---|
| `gravehorn-intro.png`, 844×390 | Finished hero beside a pale procedural boss; historical eye is red | Author the missing rig, then capture current purple eye/trail; do not recolor the old screenshot as proof |
| `m_down.webp`, 1600×893 | Strong lion composition; infected boss eyes visibly red | Purple-eye-only mask after canonical row approval |
| `r_cell.webp`, 1600×893 | Strong booth composition; background Servo has amber/cyan light | Mask only if the certified row requires powered-down Servo |
| `passage_b.webp`, 1600×893 | Strong cave composition; rear hero reads taller/more humanoid than approved hero | Identity/proportion-only correction after parity failure |
| `wolf_crouch4.webp`, 848×97 | Four distinct crouch/tell cells | Add only missing down/breathe/recover frames |
| `sage/walk8.webp`, 1536×192 | Transparent eight-cell gait; no grey matte reproduced | Preserve until live capture proves a defect |

## Integration order and acceptance

### P0

1. Use only safe November 8 ancestry; reject corrupt November 6 commits.
2. Selectively integrate audited source `2712172...`; preserve newer unrelated work.
3. Rebuild all generated pages and verify source/built/served identity.
4. Keep production merge/deploy closed.

### P1

1. Re-run NPC restore and completed-forge migration tests after integration.
2. Owner/story authority resolves Draft 3 versus Draft 4 and parity unit.
3. Mission/story authority resolves four `coin` sources with migration and all-order tests.
4. Author unique purposes for the seven templated guardian cave networks.
5. Restore a pinned browser; run focused staged suites, then the unchanged
   cleared-storage ordinary-input campaign in Alpha-complete and Alpha-skip paths.
6. Produce only missing Gravehorn rig/intercuts and four missing ritual films.

### P2

1. Apply bounded eye/light/proportion/recovery edits only after certified failures.
2. Complete five locales and measured overlay queue ownership/backpressure.
3. Run real phone/controller/audio/haptic/safe-area/interruption/performance proof.

## Preserve list

- `assets/characters/hero/**`, Alpha/pack and approved wolf identity
- NULLFANG authored assets and existing boss logic
- approved sword, crystal and marble art
- `assets/video/purify_glitch_ritual.mp4` (SHA-256
  `99674f514b052e53fc57bb006acdf69f69430d83c91d5a9ea0bca85bb1b60e04`)
- `assets/characters/sage/walk8.webp` pending live contrary evidence
- existing manhwa compositions; bounded masks only after canonical parity review

## Final studio decision

Today's branch materially closes two progression-loss windows and makes the
handoff auditable from a remotely reachable source parent. It does not certify
Chapter One, artwork, motion, VFX, audio, devices or production. The exact
candidate builds and all runnable checks pass; 165 browser lanes, the sole
uninterrupted campaign and all physical-device lanes remain blocked or unrun.
**No production merge or deployment occurred.**
