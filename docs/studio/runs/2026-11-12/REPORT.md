# CLAWBYTE Senior Studio Review — 2026-11-12

## Release decision

**HOLD — do not merge or deploy production.** Today’s review found and fixed
one bounded P1 world-physics defect on the review branch: at the 30 Hz
simulation step, terminal falls could skip a 32 px landing row. The fix sweeps
every crossed row, preserves NULLFANG’s deliberate `thruPlat` pounce, and has a
new exact-source headless contract. Build and packaging pass. Browser gameplay,
the uninterrupted Chapter One campaign, physical-device behavior, rendered
animation/VFX, audio, haptics, and performance remain unverified here.

| Item | Result |
|---|---|
| Production `main` | `7da3c87e6b43a2357a2f52080814ae1d6adad618`, unchanged |
| Authorized integration | `origin/odyssey` and `origin/claude/clawbyte-repo-migration-byhyl8` also `7da3c87...` |
| Previous review | `codex/studio-review-2026-11-11` at `00acd990c03ce79948c9560e73f284cedfcb991f` |
| Exact audited source | `c2c3208795ee56e920d6c99d79b4d3929cde3f20`, tree `a66d329fdd39d0ea22e7f81d0e5f08d88265f2ac` |
| Review branch | `codex/studio-review-2026-11-12` |
| Build/package | PASS |
| Automated evidence | 208 records: 42 pass, 166 blocked, 0 executed failures/timeouts |
| Raw-log integrity | PASS: 206/206 logs match embedded snapshots |
| Staged browser checks | BLOCKED before page creation: Unix sockets forbidden |
| Uninterrupted ordinary-input campaign | BLOCKED before page creation |
| Physical iOS/Android/controller | NOT RUN |
| Verified bounded fix | Swept downward collision rows plus two regression harnesses |
| Production merge/deploy | NOT ATTEMPTED |

The 42 passes are narrow build, source, headless, and infrastructure
assertions. They do not certify player comprehension, animation weight,
attack feel, real input timing, audio, haptics, finite rendered eye trails,
cinematic continuity, or sustained device performance.

## Comparison with November 11

`main`, `odyssey`, and the authorized Claude integration branch did not move.
The previous report recorded 206 checks: 41 pass, 165 blocked, with 204 logs.
This run adds two fallthrough checks: the exact-source contract passes and the
rendered browser harness is blocked. The totals are therefore 208 checks: 42
pass, 166 blocked, with 206 integrity-valid logs.

A new ref-only branch, `origin/claude/clawbyte-nostos-art-tpwt9j` at
`236dd6fc2560ae4d8cdc4fc000c880696d36c11a`, is 154 commits behind and one
commit ahead of its merge base. Its one useful idea was the swept fall check,
but it also carries stale source and generated pages. It is not an authorized
integration branch and must not be merged wholesale. The bounded physics
change was independently reapplied to current reviewed source and verified.

Corrupt November 6 commits `2718f6e...` and `ca8bf245...` remain excluded.

## Version, environment, and publication identity

| Boundary | Identity |
|---|---|
| Source tested | `c2c3208795ee56e920d6c99d79b4d3929cde3f20` |
| Source tree | `a66d329fdd39d0ea22e7f81d0e5f08d88265f2ac` |
| Built pages | `index.html` 4.72 MB; `odyssey.html` 3.49 MB; `forge.html` 4.74 MB; `forge-odyssey.html` 3.51 MB |
| Packaged site | 694 assets, 244.3 MB; two pages, 8.2 MB; total 252.5 MB |
| Collector server SHA-256 | `aa7e9328af2eb2335c4503c8c21cc0482c02ec667247ccf2fd0db0f419fabba9` |
| Live production | Not queried or changed; no deployment claim |
| Review publication | `codex/studio-review-2026-11-12` only |
| Environment | Linux workspace; locked Node dependencies; `/usr/bin/chromium`; Unix sockets denied with `EPERM` |

The collector began on the clean, remotely reachable source commit. Generated
HTML was built locally for validation and then excluded from the source patch;
the integrator must rebuild it from source. Evidence and this report are a
child of the audited source commit, not part of the gameplay patch.

## Change ledger and acceptance

| ID | Before | Change | Verification | Remaining hold |
|---|---|---|---|---|
| WORLD-11-03 / ENC-04-02 | At 30 Hz, terminal velocity is 1020 px/s, or 34 px/tick, enough to cross a 32 px row. Across 68 subpixel phases, thick floor had three 31.99 px penetrations; one-tile ledge and one-way each had three complete misses. | `moveEnt` now checks every downward row crossed between old and new bottom and stops at the first valid solid/one-way surface. Existing `e.thruPlat` semantics are retained. | `tests/fallthrough-contract.cjs` extracts and executes current `moveEnt`: floor, ledge, and one-way pass at 30 and 60 Hz; deliberate `thruPlat` passes. Syntax, build, package, and related contracts pass. | Rendered fall/landing at both gameplay sizes and representative devices is blocked. |
| Evidence | November 11: 206/41/165 and 204 logs. | Added exact-source and browser fallthrough records. | November 12: 208/42/166 and 206 matching logs. | Browser record remains blocked, not passed. |

Changed gameplay/test paths in the source commit:

- `js/entities.js`
- `tests/fallthrough-contract.cjs`
- `tests/fallthrough.cjs`
- `tests/run.cjs`

No art, audio, video, story, mission, combat tuning, or generated HTML was
changed. No asset was regenerated.

## Evidence boundary

| Evidence | State | What it proves |
|---|---|---|
| Build/package | PASS | Exact audited source builds and packages |
| Source/headless contracts | PASS where listed | Narrow deterministic invariants only |
| Staged Playwright harnesses | BLOCKED | Chromium could not create its Unix socket; no page began |
| `campaign-ch1` | BLOCKED | No uninterrupted real-input playthrough exists for this run |
| Static visual inspection | COMPLETE/LIMITED | Existing pixels/strips at native or captured gameplay size only |
| Physical phone/controller/audio/haptics | NOT RUN | No hardware, listening, rumble, thermal, or safe-area claim |
| Production integration/deploy | NO | Authoritative refs remain unchanged |

The collector records `complete_requested_scope=true`,
`log_integrity.ok=true`, and 206/206 matching raw logs. A blocked check is
neither a pass nor a game failure. Staged tests manipulate saves, positions, or
rooms and must not be represented as an uninterrupted player journey.

## Validation ledger

- JavaScript syntax for `game.js`, `quests.js`, `entities.js`, and
  `gravehorn.js` — PASS.
- `python3 -m unittest tools/studio/test_audit.py` — PASS, 15 tests.
- New swept-fall contract — PASS at 30/60 Hz for floor, ledge, one-way, and
  intentional `thruPlat` behavior.
- Combat impact, repair lifecycle, atomic quest payment, atomic NPC restore,
  Alpha optionality, Gravehorn eye/quarry, tile signature, infection-eye
  authority, caption FIFO, Sage walk, story progression, focus loss, and
  campaign-certificate logic — PASS.
- `node build.cjs` and `node tools/pack-www.cjs` — PASS.
- Full collector on `c2c320...` — 208 records: 42 pass, 166 blocked, zero
  executed failures/timeouts; 206/206 log snapshots match.
- `/usr/bin/chromium` exists, but `socket(AF_UNIX, SOCK_STREAM)` returns
  `EPERM`; browser lanes were correctly stopped before launch.

Repeatable evidence is in `automated/`; the compact independent rerun is in
`targeted-validation.log`.

### Exact commands and exits

| Command | Exit | Result |
|---|---:|---|
| `npm ci` | 0 | 160 locked packages installed; warnings only |
| `node build.cjs` | 0 | Four generated pages built |
| `node tools/pack-www.cjs` | 0 | 252.5 MB package assembled |
| `CHROMIUM_PATH=/usr/bin/chromium python3 tools/studio/audit.py --profile full --output docs/studio/runs/2026-11-12/automated` | 1 | Required fail-closed aggregate: 42 pass, 166 blocked; result complete/integrity-valid |
| `node --check` on four gameplay files | 0 | `targeted-validation.log` |
| `python3 -m unittest tools/studio/test_audit.py` | 0 | 15/15 pass |
| Fifteen named fall/combat/repair/quest/NPC/Alpha/Gravehorn/tile/eye/caption/Sage/story/input/campaign contracts | 0 | All pass |

The collector’s nonzero aggregate is the required result when requested
browser evidence is unavailable; it is not an executed assertion failure.

## Stable finding register

| ID | Sev. | Evidence and consequence | Smallest authorized action | Acceptance | State |
|---|---:|---|---|---|---|
| CIN-01 | P1 | `docs/STORY_CANON.md` names Draft 3 while `manhua/full-story.md` and `manhua/edition.json` name Draft 4; all 32 rows remain uncertified for full scene. | Owner and cinematic direction choose one revision and parity unit. | Every approved row maps to asset, room, state, equipment timing, text, and signed evidence. | Open; blocks panel edits. |
| CIN-01-02 | P1 | Candidate caption FIFO/reset passes; production remains older. | Selectively port reviewed FIFO/reset. | Four-plus lines remain ordered; scene waits; reset clears visible and queued. | Candidate pass, not integrated. |
| QST-03 | P1 | `ratchet_deep`, D2, A11, A13 share `coin`; global `sr_coin` dedupe can suppress three discoveries. | Story/mission assigns four IDs/payoffs and migration. | Every order, death/reload, and old save pays all four exactly once. | Open. |
| QST-04 | P1 | CV3 source gate agrees with runtime: legitimate Gravehorn retreat sets `bossHorn` before marble settlement. | Preserve ledger and gate. | Ordinary route proves `bossHorn → pl_cshard`. | Source pass; runtime blocked. |
| CAVE-05 | P1 | GA1/GA2/GB1/GC1/GD1/GX1/GE1 still reuse a three-room guardian template with interchangeable consequence. | Approve one local story, action, durable consequence, and callback per network. | Each cave is recognizable by purpose and changes later play. | Open. |
| CAM-06-01 | P1 | `campaign-ch1` preflight blocks before a page; no natural campaign evidence exists. | Run cleared storage with ordinary input in a compatible environment. | Alpha-complete and Alpha-skip reach B1 with death/reload and all beats. | Blocked, not failed. |
| ART-08-01 | P1 | Gravehorn has no authored rig; runtime uses procedural plates and remains visibly below hero quality. | Freeze design/pivots; author only 14 keyed parts and approved story beats. | Full move/phase/retreat set passes both sizes and facings. | Open. |
| ART-08-02 | P2 | `wolf_crouch4.webp` is crouch/tell, not down/breathe/planted recovery. | Add only proven recovery coverage. | Settled down, breathing, weight-bearing stand; no slide/live hitbox. | Open. |
| ART-08-03 | P2 | `m_down` has red boss eyes; `r_cell` shows lit background Servo; `passage_b` uses a tall/humanoid hero. | After CIN-01, make localized eye/light/silhouette edits only. | Correct identity without composition drift. | Blocked by canon. |
| CIN-09-01 | P1 | Glitch meets the ritual contract; Brood/Atlas/Zero/Prism are legacy silent films/fallbacks. | Freeze shot list; preserve Glitch; author only four missing current rituals. | White gather, raise, slash, extraction, restore, deliberate picture/music fade. | Open. |
| VFX-10-01 | P1 | Source defines red ordinary/purple boss optics, travel-gated finite wisps, cleanup, cap 320, reduced-motion glow; no browser rendered it. | Capture before retuning; mask only baked NULLFANG red optic. | Correct anchors; tail ends ≤about 1.875 s; all cleanup paths pass. | Source pass; rendered blocked. |
| WORLD-11-03 | P1 | Slow-device downward collision could skip a tile row. | Integrate only `c2c320...` source delta and rebuild pages. | Headless plus rendered 30/60 Hz fall/landing pass; `thruPlat` retained. | Source fixed; rendered blocked. |
| COMBAT-12-01 | P1 | Stats, armor, weapon tiers, charged ≥2×, flash, debris, recoil, hit-stop, shake, reduced motion, bounded log pass source contract. | Validate real input, sound, rumble, direction, cleanup. | One action/impact per success; none on miss/block/protected/cancel. | Source pass; feel blocked. |
| NPC-14-01 | P1 | Atomic restore/rollback/replay protection passes; wake/gift presentation is unrendered. | Selectively integrate and run save/reload journeys. | Cell, powered state, gift appear together exactly once. | Candidate pass; runtime blocked. |
| NPC-14-02 | P1 | Rescued Sage selects walk art only while moving and rests when stopped. | Render real displacement. | Planted feet, no sleeping slide, stable rest after reload. | Source pass; runtime blocked. |
| UI-15-01 | P2 | Locale inventory: EN 619; AR 600 missing 19; TR/ZH/RU 215 missing 404 each. English copies remain AR 1, TR 3, ZH 1, RU 2. | Complete translations and signed locale review. | Zero missing keys plus wrapping/RTL/touch captures. | Open. |
| UI-15-02 | P2 | Caption/overlay queues are unbounded and input ownership is convention-based. | Bound/coalesce only duplicate noncritical items; enforce one input owner. | Long nested sessions remain ordered without losing story. | Open. |
| PERF-11-01 | P1 | FPS, memory, thermal, eye-trail cost, transition spikes, and device input are absent. | Profile representative phones/controllers. | Budgets and ten-minute cave/swarm/boss/ritual captures. | Unverified. |

## Owner story and Chapter One route

Reviewed source expresses the required chain:

`electrical short wakes hero → Ratchet battery-board repair → crystal clue →
Volt Pack → early caves → Gravehorn quarry → raw marble → white Purifier forge
→ first Sage rescue → CHIME → NULLFANG purification → B1`.

Alpha/GA2 is an optional post-Purifier side branch and must never block
NULLFANG. Gravehorn retreats and releases the quarry; it is not purified.
NULLFANG is the mandatory guardian purified by the hold prompt. Source
contracts support this order, but no cleared-storage player has certified the
floor item, pod/recharge, monument placement, cave direction, return, forge,
rescue prompt, or ritual without staged state.

## Cave census

| Network | Current purpose | Verdict |
|---|---|---|
| A5 | Mind Node, Magnet crest, log, quarry mouth | Distinct; rendered readability blocked |
| A7 | Quarry survey/terminal-20 Ratchet errand | Distinct; reward entangled in QST-03 |
| CV1 | Bound crawler, chest, spare core | Useful teaching/reward room |
| CV1B | Rest pod, map, shortcut | Meaningful optional facility |
| CV2 | Deaf System founding log and lure settlement | Distinct narrative bridge |
| CV3 | Gravehorn retreat gate, then raw marble | Source-correct; fight/traversal blocked |
| GA1 | First Sage, CHIME, rescue consequence | Mandatory/source-coherent; campaign blocked |
| GA2/A10 | Optional Alpha, pack friendship/cache/Sage | Optional source pass; complete/skip blocked |
| GB1/GC1/GD1/GX1/GE1 | Repeated guardian template | CAVE-05 open |
| A11/A13/D2 | Coin secrets/pocket | QST-03 can suppress discoveries |
| A12 | Dash-return star relic | Distinct ability-gated return |

Engineering must not invent reward lore. Story authority owns four durable
discovery identities and the seven local cave purposes.

## Manhwa parity and gameplay-size inspection

| Evidence | Observation | Decision |
|---|---|---|
| `edition.json` | 32 Draft 4 rows; incomplete/full-scene uncertified | CIN-01 blocks generation/correction |
| Gravehorn intro, 844×390 | Finished hero beside pale procedural boss; captured optic is red | Current authority requires purple; no rig/render proof |
| `m_down.webp`, 1600×893 | Strong composition, boss optics red | Eye-only edit after canon |
| `r_cell.webp`, 1600×893 | Strong booth composition; background Servo is visibly powered | Indicator-only mask after canon |
| `passage_b.webp`, 1600×893 | Cave is clear; hero silhouette is too tall/humanoid | Silhouette-only correction after canon |
| `wolf_crouch4.webp`, 848×97 | Four readable crouch/tell cells | Do not use as recovery |
| `sage/walk8.webp`, 848×187 | Eight varying transparent gait cells | Source wiring passes; planted runtime walk unverified |

No screenshot was recolored and no asset was regenerated.

## Animation, cinematic, VFX, and device matrix

| Subject | Preserved evidence | Missing proof/work |
|---|---|---|
| Hero | Approved variations and poses | Runtime delivery/feel; do not regenerate |
| Sage | Eight-cell walk plus distance-gait/rest source | Planted motion and reload |
| Pack/Alpha | Approved wolf set and ten Alpha strips | Proven recovery only; move reel; complete/skip routes |
| NULLFANG | Authored parts, moves, and SFX | Runtime anticipation/contact/recovery and final ritual |
| Gravehorn | Detailed logic and purple-eye contract | 14 authored parts, anchors, hitboxes, planted motion |
| Eye trails | Red ordinary, purple boss; >10 px/s emission; 1.5 s ±25%; cap 320 | Rendered finite tail, teleport/remove/room/purify cleanup, reduced motion |
| Purification | Glitch: H.264/AAC 1280×720, 13.25 s, deliberate end fade | Current Brood/Atlas/Zero/Prism rituals; runtime skip/reload |
| Physics | Swept downward rows; 30/60 Hz source contract | Rendered landings and representative devices |
| Browser/device | Build/package pass | 166 browser lanes; phones/controller/audio/haptics/performance |

Gravehorn’s frozen rig inventory is `body`, `head`, `head_roar`, `horn_big`,
`horn_small`, `fleg_up`, `fleg_low`, `hleg_up`, `hleg_low`, `tail`, `body2`,
`head2`, `horn_big2`, and `horn_small2`, plus approved `gh_intro_a`,
`gh_intro_b`, `gh_phase2`, and `gh_down` beats. Parts must be transparent with
no baked ground, shadow, text, or infection glow; horns must detach and reseat.

## Fifteen senior-role verdicts

1. **Senior Cinematic Designer — HOLD P1.** Draft authority conflicts; candidate
   caption FIFO passes, but production pacing, panels, skip/reload, and endings
   are unverified.
2. **Senior Game Designer, Player Systems — SOURCE PASS / HOLD P1.** Tutorial,
   progression, repair, and focus contracts pass; real tap/hold/release/cancel,
   healing, and new-player comprehension do not.
3. **Senior Mission Designer, Quest Craft — HOLD P1.** CV3 stays corrected;
   four discoveries still collapse through `coin`.
4. **Principal Encounter Designer — FIXED SOURCE / HOLD P1.** Terminal-fall
   tunneling is fixed headlessly; traversal, Gravehorn retreat, optional Alpha,
   and unique cave consequences lack natural-play proof.
5. **Senior Boss Designer — HOLD P1.** Gravehorn lacks professional rig/motion;
   NULLFANG and Alpha still require runtime move and ritual evidence.
6. **Senior Mission Designer, Campaign — HOLD P1.** Chronology and optionality
   pass narrow contracts; the uninterrupted campaign and death/reload did not
   run.
7. **Senior Mission Producer — REVIEW BRANCH ONLY.** Lineage and evidence are
   clean; stale ref-only source and generated pages must not be merged.
8. **Senior Character Artist — HOLD P1/P2.** Preserve finished art; create only
   frozen Gravehorn parts and proven wolf recovery; manhwa waits for CIN-01.
9. **Senior Cinematic Director — HOLD P1.** Preserve Glitch; freeze the shot and
   ending contract before producing four missing current rituals.
10. **Senior VFX Artist — SOURCE PASS / RENDERED HOLD P1.** Finite red/purple
    authority exists; anchors, extinction, cleanup, and cap are unrendered.
11. **Senior Technical Director, World Systems — FIXED SOURCE / DEVICE HOLD.**
    Swept landings, tile signatures, CV3, and Alpha pass headlessly; crossings,
    caches, maps, and device performance do not.
12. **Gameplay Engineer, Combat — SOURCE PASS / HOLD P1.** Stats/impact pass;
    weight, direction, sound, rumble, cleanup, and real timing do not.
13. **Gameplay Engineer, Mission — FIXED CONTRACT / RUNTIME HOLD.** Atomic
    payment and forge migration pass; QST-03 and natural journeys remain open.
14. **Gameplay Engineer, NPC — FIXED CONTRACT / RUNTIME HOLD.** Atomic restore
    and Sage gait selection pass; wake/gift/reload/planted motion are unrendered.
15. **Lead UI Engineer — SOURCE PASS / HOLD P1/P2.** Caption/focus pass; locale
    parity, queue bounds, ownership, RTL/touch/device evidence remain open.

## Integration order

1. Cherry-pick or selectively apply only source commit `c2c320...` over the
   latest authorized branch; rebuild generated pages. Do not merge
   `236dd6...`, reports, evidence logs, or corrupt November 6 commits.
2. Owner selects Draft 3 or Draft 4 and a page/shot/beat parity unit, then
   approves four reward identities and seven cave purposes.
3. Rerun all 208 records where Chromium can create Unix sockets against exact
   source/build/served identity.
4. Run cleared-storage Alpha-complete and Alpha-skip campaigns with ordinary
   input only, each including death/reload through B1.
5. Produce the frozen Gravehorn rig, proven wolf recovery, rendered finite eye
   trails, real hit feel, NULLFANG ritual, and deliberate picture/music fade.
6. Complete locale parity, overlay backpressure/ownership, physical-device
   input, audio/haptics, and sustained profiling.

## Preserve list

- `assets/characters/hero/**`; approved Alpha and pack strips.
- NULLFANG parts/moves; `beast_parts.webp` SHA-256
  `ccc6589629af106f624e86444945f805adc02f4a4c972bfdcc73612b970cafb1`.
- Sage `walk8.webp` SHA-256
  `b3dd2e1e32a63ae83a788958eb987784bf3cbb8ace07f8a3c9363210bce5bb4f`.
- Approved crystal, raw marble, sword, and existing manhwa compositions.
- `purify_glitch_ritual.mp4` SHA-256
  `99674f514b052e53fc57bb006acdf69f69430d83c91d5a9ea0bca85bb1b60e04`.

## Final studio decision

The review produced a real, bounded improvement: terminal falls no longer skip
landing rows in the exact current collision function, and intentional boss
pass-through remains intact. That does not make the game release-ready. Canon,
meaningful cave consequences, reward identity, a professional Gravehorn rig,
rendered finite eye trails, the uninterrupted Chapter One journey, physical
devices, audio/haptics, and performance remain release gates. Production must
remain untouched.
