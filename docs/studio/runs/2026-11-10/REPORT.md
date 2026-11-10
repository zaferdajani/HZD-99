# CLAWBYTE Senior Studio Review — 2026-11-10

## Release decision

**HOLD — do not merge or deploy.** Production and the authorized integration
refs have not moved since the November 9 review. This branch retains the
verified November 9 candidate, corrects the CV3 cave authority ledger, and
repairs the studio collector so a present-but-unlaunchable Chromium is reported
as blocked instead of fabricating gameplay failures. It does not provide
rendered gameplay, an uninterrupted Chapter One playthrough, physical-device
proof, canonical manhwa parity, or professional Gravehorn art.

| Item | Result |
|---|---|
| Production `main` | `7da3c87e6b43a2357a2f52080814ae1d6adad618`, unchanged |
| Authorized integration refs | `origin/odyssey` and `origin/claude/clawbyte-repo-migration-byhyl8` also `7da3c87...` |
| Previous review | `codex/studio-review-2026-11-09` at `f0c2204052e2c95ece2d14df7a4561fe9ae39227` |
| Exact audited source | `db9eb3bd156219c803a5b89c26e0d6b31749678f` |
| Audited source tree | `4171a5d14c1f9b8b5e7dac5ce969bd82c7833bbd` |
| Review branch | `codex/studio-review-2026-11-10` |
| Build/package | PASS |
| Automated evidence | 206 records: 41 pass, 165 blocked, 0 executed failures/timeouts |
| Raw-log integrity | PASS: 204/204 logs match their embedded snapshots |
| Staged rendered browser tests | BLOCKED before page creation: Unix sockets forbidden by environment |
| Uninterrupted ordinary-input campaign | BLOCKED before page creation |
| Physical iOS/Android/controller | NOT RUN |
| Production merge/deploy | NOT ATTEMPTED |

The 41 passes are 37 source/headless harnesses plus four infrastructure gates.
They certify only their assertions. They do not certify animation weight,
attack feel, audio, haptics, real input timing, finite rendered particles,
campaign comprehension, or sustained device performance.

## Status boundary

| Claim | Status | Evidence boundary |
|---|---|---|
| Implemented on review branch | YES | CV3 authority ledger/contract and collector Unix-socket preflight |
| Retained from prior candidate | YES | November 9 source fixes and earlier reviewed candidate work |
| Tested as source/headless contracts | YES | Targeted validation and all runnable full-collector lanes pass |
| Visually inspected | LIMITED | Six existing still/sprite assets inspected at gameplay-relevant scale; no fresh runtime frames |
| Integrated into production/authorized integration | NO | All authoritative refs remain `7da3c87...` |
| Deployed | NO | Explicitly not attempted |

## Change since November 9

There is no production, integration, authored-art, sound, VFX or cinematic
delta. The only November 10 source changes are:

1. **QST-04 fixed:** `docs/CAVES_CH1.md` now states that Gravehorn owns CV3,
   the pillar stays visible but unrewarded, and only the legitimate retreat
   flag `bossHorn` releases the marble. The existing quarry contract now
   rejects a ledger that erases this encounter.
2. **QA-10-01 fixed:** `tools/studio/audit.py` now probes the Unix socket
   Chromium requires. In this managed container `/usr/bin/chromium` exists and
   is executable, but `socket(AF_UNIX, SOCK_STREAM)` returns `EPERM`; browser
   lanes are therefore correctly recorded as blocked before launch.
3. **Collector regression coverage:** two unit paths prove an executable is
   accepted when its socket prerequisite works and blocked when it does not.
4. **No asset regeneration:** all approved art, audio and video remain
   byte-for-byte unchanged.

## Stable finding register

| ID | Sev. | Finding and evidence | Smallest authorized action / owner | Acceptance | Status |
|---|---:|---|---|---|---|
| QA-10-01 | P1 | System Chromium aborted before a page with `process_singleton_posix.cc: socket() failed: Operation not permitted`; the collector previously labeled 165 lanes `fail`. | QA/tooling: preflight the required Unix socket without weakening any harness. | Same environment produces 165 `blocked`, no page-level failure claims; unit regression passes. | **Fixed here.** |
| QST-04 | P1 | The cave ledger previously described CV3 as a loose pillar/Volt Burst pickup while runtime gates it behind Gravehorn retreat. | Mission + encounter: make ledger, runtime and contract name the same chronology. | CV3 row states Gravehorn ownership, visible/unrewarded pillar and `bossHorn`; contract fails if removed. | **Fixed here; source contract pass.** |
| CIN-01 | P1 | `docs/STORY_CANON.md` calls September Draft 3 current; `manhua/full-story.md` and `manhua/edition.json` call Draft 4; all 32 edition rows say expanded scenes are incomplete and parity uncertified. | Owner + cinematic direction: record one canonical revision and parity unit: page, shot or beat. | Every approved manifest row maps to runtime asset, room, state, equipment timing and text with signed evidence. | **Open; art generation blocked.** |
| QST-03 | P1 | `ratchet_deep`, D2, A11 and A13 share durable relic ID `coin`; relic dedupe and global `sr_coin` can collapse four rewards into one. | Mission/story authority: assign source-specific IDs/payoffs and migration; engineering must not invent lore. | Acquire all four in every order through death/reload and old-save migration; each pays exactly once. | **Open.** |
| NPC-14-01 | P1 | Prior review made NPC restore one cloned settlement/one persist with rollback and replay protection. | Integrator: port selectively, then run real wake/reload journeys. | Cell, awake state and gift appear atomically for Ratchet, Servo and generic NPCs; no double pay. | **Candidate source pass; rendered blocked.** |
| MIS-13-02 | P1 | Prior review repairs only historical `ratchet_forge=done` saves missing the Purifier. | Integrator: preserve narrow idempotent migration. | Completed broken save gains one blade; active/none saves never do. | **Candidate source pass; reload journey blocked.** |
| CAVE-05 | P1 | GA1, GA2, GB1, GC1, GD1, GX1 and GE1 reuse the same grotto/tunnel/deep recipe: scrap/bench, terminal/bat, generic Sage/scrap. | Mission + encounter: authority-approved local story, unique interaction, distinct consequence and callback per network. | Each network is identifiable by gameplay purpose without room ID or palette and changes something persistent. | **Open.** |
| ART-08-01 | P1 | No `assets/characters/gravehorn/` authored rig exists; gameplay still uses pale procedural plates beside finished hero art. | Character + boss art: freeze state/pivot list, then author only the missing rig. | Idle, planted locomotion, turn, attack anticipation/contact/recovery, hurt, phase, hornless and retreat pass gameplay-size review. | **Open.** |
| ART-08-02 | P2 | `wolf_crouch4.webp` is a four-cell crouch/tell, not down/breathe/planted recovery. | Character art: add only proven missing recovery poses and preserve approved wolf identity. | No sleeping slide, frozen contact or active hitbox during recovery. | **Open.** |
| ART-08-03 | P2 | `m_down.webp` has red boss eyes; `r_cell.webp` has an amber/cyan-lit background Servo; `passage_b.webp` makes the rear hero taller/more humanoid. | Art/cinematic: bounded masks/proportion correction only after CIN-01 and a specific parity-row failure. | Corrected row matches approved identity without composition drift. | **Blocked by CIN-01; no edit.** |
| CIN-09-01 | P1 | Only `purify_glitch_ritual.mp4` meets the current ritual contract; Brood/Atlas/Zero/Prism are legacy silent clips. | Cinematic: preserve Glitch, author only four proven missing rituals plus required Gravehorn intercuts after shot freeze. | White gather → sword raise → slash → dark extraction → restored form → deliberate picture and music fade; runtime wiring verified. | **Open.** |
| VFX-10-01 | P1 | Candidate source specifies red ordinary eyes, purple bosses/guardians/Sage/Alpha, motion-gated finite wisps, cleanup, cap 320 and reduced-motion glow only. No browser rendered it. | VFX + engineering: capture the current build; do not retune from source alone. | Animated-eye origin, finite stop tail, teleport/removal/room/purify cleanup and cap pass at 844×390 and 1280×720. | **Source pass; rendered blocked.** |
| CAM-06-01 | P1 | `campaign-ch1` is the only uninterrupted ordinary-input certificate. It was blocked before page creation; `campaign-contract` is only a fail-closed logic check. | Campaign + QA: run fresh storage with ordinary input and no flag/inventory/room/position injection. | Alpha-complete and Alpha-skip runs reach B1 with death/reload and all legal beats. | **Blocked.** |
| UI-15-01 | P2 | Locale inventory remains EN 619, AR 600, TR/ZH/RU 215 each. Fallback is not five-locale parity. | UI/localization: finish keys, then review wrapping and RTL. | Zero missing keys and signed 1280×720 plus 844×390 DPR2 captures in all locales. | **Open.** |
| UI-15-02 | P2 | Caption FIFO/reset source contract passes, but caption/general overlay queues are unbounded and input ownership is convention-based. | UI engineering: measured coalescing/backpressure that never drops critical story text; one overlay owner. | Four-plus captions, nested overlays, skip/reload and long sessions remain ordered and bounded. | **Open; rendered blocked.** |
| PERF-11-01 | P1 | Package/device, low-end FPS, memory, thermal, trail GPU cost and load-spike evidence remain absent. | Technical director: profile representative low/mid devices after browser/device access. | Published budgets and ten-minute cave/swarm/boss/purification/transition captures. | **Unverified.** |

## Build and evidence ledger

### Commands and observed results

- `python3 -m unittest tools/studio/test_audit.py` — PASS, 15 tests.
- `node --check js/game.js`, `js/quests.js`, `js/entities.js`,
  `js/gravehorn.js` — PASS.
- Combat-impact, repair lifecycle, quest payment, NPC restoration, Alpha
  optionality, Gravehorn purple-eye, Gravehorn quarry, tile signature,
  infection-eye authority, caption FIFO and Sage-walk contracts — PASS.
- `node build.cjs` — PASS in the full collector.
- `node tools/pack-www.cjs` — PASS in the full collector.
- Full collector on exact remotely reachable source `db9eb3b...` — 206
  records: 41 pass, 165 blocked, zero fail/timeout;
  `complete_requested_scope=true`, `log_integrity.ok=true`.
- Chromium diagnostic — executable `/usr/bin/chromium` found; Playwright launch
  aborted before a page because Unix socket creation is forbidden. Python
  reproduction of `AF_UNIX/SOCK_STREAM` also returns `EPERM`.

| Class | Count | Meaning |
|---|---:|---|
| Runner harnesses | 202 | 37 runnable source/headless; 165 direct-browser lanes |
| Infrastructure identity records | 4 | build/package/served identity boundaries counted by collector |
| Pass | 41 | Source/headless and infrastructure assertions executed successfully |
| Blocked | 165 | Browser dependency impossible before page creation |
| Fail / timeout | 0 | No executed assertion failed and no harness timed out |
| Captured raw logs | 204 | All 204 disk files match recorded bytes and SHA-256 snapshots |

The full raw evidence is in `automated/`; targeted validation is in
`targeted-validation.log`. A blocked browser lane is neither a pass nor a game
failure. It proves only that this environment cannot execute that scope.

### Staged versus uninterrupted proof

| Evidence | State | What it proves |
|---|---|---|
| Source/headless contracts | PASS | Narrow code/state invariants only |
| Staged Playwright harnesses | BLOCKED | No DOM/canvas/audio/input assertion began |
| `campaign-ch1` | BLOCKED | No uninterrupted real-input playthrough exists for this run |
| Static asset inspection | COMPLETE/LIMITED | Existing pixels and dimensions only, not runtime animation |
| Physical phone/controller | NOT RUN | No hardware, haptics, safe-area, interruption or thermal claim |

## Owner story and Chapter One route

The candidate source remains aligned to the intended mandatory order:

`wake by electrical short → restore Ratchet with the battery-board puzzle →
learn the crystal slows corruption → enter CV1/CV1B/CV2 → repel Gravehorn in
CV3 → take raw marble → forge the white Purifier → rescue the first Sage →
silence CHIME → purify NULLFANG → reach B1`.

Alpha/GA2 is an optional forged-blade side branch from A2 and must not sit
between the player and NULLFANG. Source contracts confirm the topology and the
CV3 gate. Only a cleared-storage campaign can confirm that a player understands
the causal chain, objectives, floor pickup, pod/recharge, repair monument,
return route, forge, rescue prompt and ritual without hidden state manipulation.

## Cave census and meaning audit

| Network | Current authored purpose | Review verdict |
|---|---|---|
| A5 | Mind Node, Magnet crest, log and quarry mouth | Meaningful early discovery; rendered readability blocked |
| A7 | Quarry survey and Ratchet errand completion by reading | Distinct story evidence, but reward is entangled in QST-03 |
| CV1 | Bound crawler, chest and spare core | Useful teaching/reward room |
| CV1B | Rest pod, map charting and shortcut | Meaningful optional facility branch |
| CV2 | Deaf System founding log and lure settlement | Distinct narrative bridge |
| CV3 | Gravehorn encounter, retreat gate, then raw marble | QST-04 ledger fixed; fight/traversal still rendered-blocked |
| GA1T/GA1/GA1D | First Sage route, CHIME revelation and rescue consequence | Mandatory and source-coherent; campaign blocked |
| A10/GA2/GA2T/GA2D | Optional Alpha, pack friendship, cache and Pack Sage | Optionality contract passes; complete/skip campaigns blocked |
| GB1/GC1/GD1/GX1/GE1 | Repeated grotto/tunnel/deep template | CAVE-05 open: lacks kingdom-specific action/payoff/callback |
| A11/A13/D2 | Coin secrets/story pocket | QST-03 collision can suppress later discoveries |
| A12 | Dash-return star relic | Distinct ability-gated return |

Do not invent seven collectible names in engineering. Mission/story authority
must first assign the distinct local stories, actions, consequences and durable
reward identities.

## Manhwa parity matrix

| Evidence | Observed at source size | Runtime/parity status | Action |
|---|---|---|---|
| `manhua/edition.json` | 32 entries; every entry says expanded Draft 4 is incomplete and full-scene parity uncertified | CIN-01 P1 | Pin revision and parity unit before art work |
| `m_down.webp` 1600×893 | Strong composition; infected boss eyes red, conflicting with purple boss authority | Not certified | Eye-only correction after canon approval |
| `r_cell.webp` 1600×893 | Ratchet booth composition strong; background Servo visibly lit amber/cyan | Not certified | Bounded lighting mask only after approved row failure |
| `passage_b.webp` 1600×893 | Cave composition strong; rear hero reads taller/more humanoid | Not certified | Bounded proportion correction, no redraw, after approval |
| Caption system | FIFO/reset source contract passes | Rendered timing/skip/wrap blocked | Verify progressive text, dwell, skip and reload in browser |

## Animation, cinematic and VFX matrix

| Subject | Existing evidence | Gap / acceptance |
|---|---|---|
| Hero | Approved authored variations and poses retained | Do not regenerate; runtime delivery and real-input feel blocked |
| Sage | `walk8.webp`, 8 transparent gait cells; source chooses walk from rescued velocity and kneel at rest | Render planted walking and save/reload; no sleeping slide |
| Pack wolf | Authored locomotion/attack/tell set; `crouch4` visibly a crouch tell | Add only proven down/breathe/recover coverage |
| Alpha | Ten authored move strips retained | Staged move reel plus Alpha-complete/skip campaigns required |
| NULLFANG | Authored move/parts set and dedicated SFX retained | Render anticipation/contact/recovery and final purification; coil eye-only purple mask remains |
| Gravehorn | Historical 844×390 still shows pale procedural body; candidate eye source is purple | Author full rig/state coverage; verify planted joints/hitboxes and finite trail |
| Eye trails | Source: red ordinary, purple boss; motion threshold 10 px/s; nominal life 1.5 s ±25%; cap 320; cleanup/reduced motion | Capture ordinary, Alpha/guardian, Gravehorn and Sage at both gameplay sizes |
| Purification films | Glitch ritual H.264 1280×720 + AAC, 13.25 s, preserved | Brood/Atlas/Zero/Prism current-contract films and Gravehorn intercuts missing; endings must fade picture and music |

## Performance and device gaps

| Area | Evidence | Verdict |
|---|---|---|
| Build/package | Collector build and package pass | Source/package only |
| Canvas rendering | 165 browser lanes blocked before page | Unverified |
| Trail budget | Source hard cap 320, reduced-motion suppresses smoke | Render/GPU cost unverified |
| Room cache | Coordinate-sensitive signature contract passes | Runtime crossings/memory unverified |
| Mobile | Viewport harness blocked; no physical device | Unverified |
| Controller/haptics | No physical controller; rendered input blocked | Unverified |
| Audio/fades | Source/audio inventory only | Listening and ending continuity unverified |
| Sustained play | No ten-minute capture, no uninterrupted campaign | Unverified |

## Fifteen senior-role verdicts

### 1. Senior Cinematic Designer — HOLD P1

CIN-01 blocks authoritative shot/page work. Caption FIFO/reset passes source,
but progressive text pacing, wrapping, dwell, skip/reload and audiovisual fades
are unrendered. Queues remain unbounded.

### 2. Senior Game Designer, Player Systems — SOURCE PASS / HOLD P1

Tutorial, focus, progression, equipment and charge-routing contracts pass.
Actual tap/hold/release/cancel/heal behavior, controller/touch paths and new-
player comprehension remain blocked.

### 3. Senior Mission Designer, Quest Craft — HOLD P1

QST-04 is fixed in the ledger and contract. QST-03 remains: four authored
rewards collapse through one `coin` identity. Atomic quest payment and narrow
forge migration pass.

### 4. Principal Encounter Designer — HOLD P1

CV3 is now coherently documented and source-gated; its actual approach, boss
readability, retreat and pickup are unplayed. Seven guardian networks remain
mechanically redundant.

### 5. Senior Boss Designer — HOLD P1

Gravehorn has substantial attack logic but no professional authored rig.
NULLFANG and Alpha retain authored identity but lack fresh move reels and
campaign certification. Gravehorn retreats; NULLFANG is purified.

### 6. Senior Mission Designer, Campaign — HOLD P1

Mandatory chronology and Alpha optionality are source-coherent. The sole
uninterrupted campaign was correctly blocked before launch, so neither Alpha
route nor death/reload is certified.

### 7. Senior Mission Producer — HOLD

Main/integration refs are unchanged. November 10 has a narrow reachable source
commit and complete schema/evidence, but production cannot advance while P1
authority, rendered, campaign, art and hardware gates remain open.

### 8. Senior Character Artist — HOLD P1/P2

Preserve hero, Alpha, pack, NULLFANG, Sage, crystal, marble and sword art.
Gravehorn needs the frozen authored plate set; wolves need only proven recovery
coverage. Manhwa corrections wait for CIN-01.

### 9. Senior Cinematic Director — HOLD P1

Canon is unresolved. Preserve the Glitch ritual; do not generate the four
missing current-contract rituals or Gravehorn intercuts until the shot list and
ending contract are frozen.

### 10. Senior VFX Artist — SOURCE PASS / RENDERED HOLD P1

Red/purple authority and finite cleanup values are correctly expressed in
candidate source. No current gameplay frame certifies anchor accuracy, tail
extinction, cleanup, cap appearance or reduced motion.

### 11. Associate Technical Director, World Systems — SOURCE PASS / HOLD

Tile signature, CV3 gate and Alpha optionality contracts pass. Rendered room
crossings, map/readability, cache behavior and device profiling remain blocked.

### 12. Gameplay Engineer, Combat — SOURCE PASS / HOLD P1

Stats, armor, weapon progression, charged ≥2× damage, flash, debris, recoil,
hit-stop, shake, reduced motion and bounded log pass source contracts. Real
weight, audio, rumble and input timing are not certified.

### 13. Gameplay Engineer, Mission — FIXED CONTRACT / RUNTIME HOLD

Atomic payments and completed-forge migration pass. QST-03 needs story-owned
IDs/migration. Natural save/reload/death and full campaign remain blocked.

### 14. Gameplay Engineer, NPC — FIXED CONTRACT / RUNTIME HOLD

Atomic NPC restoration and velocity-selected Sage walk pass source contracts.
Rendered wake/dialogue/gift/reload and planted Sage motion remain blocked.

### 15. Lead UI Engineer — SOURCE PASS / HOLD P1/P2

Caption FIFO/reset and focus contracts pass. Five-locale parity, queue
backpressure, overlay ownership, RTL/wrapping, touch and device captures remain
open or blocked.

## Gameplay-size static inspection

- `gravehorn-intro.png` (844×390): hero is finished and readable; Gravehorn is
  visibly pale/procedural. Its red eye is obsolete historical evidence; current
  candidate source is purple, not rendered proof.
- `m_down.webp` (1600×893): strong panel composition; red boss eyes conflict
  with current purple authority.
- `r_cell.webp` (1600×893): booth story reads clearly; background Servo appears
  powered/lit.
- `passage_b.webp` (1600×893): cave direction reads; rear hero proportions drift
  taller and more humanoid.
- `wolf_crouch4.webp` (848×97): four readable crouch/tell cells, not recovery.
- `sage/walk8.webp`: eight transparent cells with visible gait variation; source
  wiring passes, but runtime planting is unverified.

No screenshot was recolored and no asset was regenerated.

## Integration order and acceptance

### P0 — authority and safe integration

1. Owner selects Draft 3 or Draft 4 and defines page/shot/beat parity.
2. Integrator selectively ports the reachable reviewed source; never merge
   corrupt November 6 commits `2718f6e...` or `ca8bf245...`.
3. Mission/story authority resolves QST-03 and the seven cave identities.

### P1 — player and presentation proof

1. Restore a Chromium environment that permits Unix sockets; rerun all 206
   records with the exact served build.
2. Run cleared-storage Chapter One twice: Alpha complete and Alpha skipped,
   ordinary input only, with death/reload.
3. Author and integrate Gravehorn's frozen rig; capture boss/wolf/NULLFANG/Sage
   anticipation, contact, recovery and planted locomotion.
4. Capture finite red/purple eye trails across roster, stop, purification,
   teleport, removal and room transition.
5. Verify normal/charged impact, sound, rumble, purification hold and deliberate
   film/music fade on real input paths.

### P2 — content and device completion

1. Give each guardian network an approved unique story/action/consequence.
2. Complete locale parity and bounded overlay ownership/backpressure.
3. Run low/mid iOS, Android and physical controller performance/accessibility
   passes with ten-minute captures.

## Preserve list

- `assets/characters/hero/**`.
- Approved Alpha and pack strips; do not repurpose wolf tell/pant/sit frames.
- NULLFANG parts and studio move set; `beast_parts.webp` SHA-256
  `ccc6589629af106f624e86444945f805adc02f4a4c972bfdcc73612b970cafb1`.
- Sage `walk8.webp` SHA-256
  `b3dd2e1e32a63ae83a788958eb987784bf3cbb8ace07f8a3c9363210bce5bb4f`.
- Approved crystal, raw marble and sword artwork.
- `purify_glitch_ritual.mp4` SHA-256
  `99674f514b052e53fc57bb006acdf69f69430d83c91d5a9ea0bca85bb1b60e04`.
- Existing manhwa compositions pending signed bounded corrections.

## Final studio decision

The review branch is safer and more accurate than yesterday: it preserves the
entire prior candidate, makes the CV3 narrative authority match runtime, and
stops the collector from misreporting an infrastructure denial as 165 game
regressions. The game is still **not release-ready**. The next useful work is
authority resolution, selective integration, a real browser/campaign pass, and
professional Gravehorn production—not more speculative asset regeneration.
