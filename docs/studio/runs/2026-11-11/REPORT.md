# CLAWBYTE Senior Studio Review — 2026-11-11

## Release decision

**HOLD — do not merge or deploy.** There is no production, authorized
integration, gameplay-source, art, audio, VFX, cinematic, or review-source
delta since November 10. This run therefore publishes fresh evidence and a
studio decision only. It does not regenerate approved assets or treat blocked
browser work as passing gameplay.

| Item | Result |
|---|---|
| Production `main` | `7da3c87e6b43a2357a2f52080814ae1d6adad618`, unchanged |
| Authorized integration | `origin/odyssey` and `origin/claude/clawbyte-repo-migration-byhyl8` also `7da3c87...` |
| Previous review | `codex/studio-review-2026-11-10` at `99533cc104bc580f3cc1b6c58b08e05e62352efd` |
| November 10 audited gameplay source | `db9eb3bd156219c803a5b89c26e0d6b31749678f`, tree `4171a5d14c1f9b8b5e7dac5ce969bd82c7833bbd` |
| Exact November 11 audited base | `99533cc104bc580f3cc1b6c58b08e05e62352efd` |
| Review branch | `codex/studio-review-2026-11-11` |
| Build/package | PASS |
| Automated evidence | 206 records: 41 pass, 165 blocked, 0 executed failures/timeouts |
| Raw-log integrity | PASS: 204/204 logs match embedded snapshots |
| Staged browser checks | BLOCKED before page creation: Unix sockets forbidden |
| Uninterrupted ordinary-input campaign | BLOCKED before page creation |
| Physical iOS/Android/controller | NOT RUN |
| Gameplay/art change today | NONE; no safe new delta existed |
| Production merge/deploy | NOT ATTEMPTED |

The 41 passes are narrow source/headless and infrastructure assertions. They do
not certify animation weight, player comprehension, attack feel, audio,
haptics, real input timing, finite rendered trails, cinematic continuity, or
sustained device performance.

## Comparison with November 10

`main`, `odyssey`, the authorized Claude integration branch, and every reviewed
art/source path are unchanged. The verified chain remains audited source
`db9eb3bd...` → evidence `e9db5b3b...` → documentation attestation
`99533cc...`. Corrupt November 6 commits `2718f6e...` and `ca8bf245...` are not
ancestors and must never be integrated.

November 11 adds only a new full evidence collection, static inspection,
15-role review, report, and Claude integration prompt. The correct engineering
decision was **no speculative code or asset edit**.

## Version, environment, and publication identity

| Boundary | Identity |
|---|---|
| Source tested | `99533cc104bc580f3cc1b6c58b08e05e62352efd` |
| Selectively integrable gameplay source | [`db9eb3bd...`](https://github.com/zaferdajani/HZD-99/commit/db9eb3bd156219c803a5b89c26e0d6b31749678f) |
| Built pages | `index.html` 4.72 MB; `odyssey.html` 3.49 MB; `forge.html` 4.74 MB; `forge-odyssey.html` 3.51 MB |
| Packaged site | 694 assets, 244.3 MB; two pages, 8.2 MB; total 252.5 MB |
| Collector server SHA-256 | `7330826ae3768e3bef3a9572bbc865add231b987968e36dfa0953612332af986` |
| Live production | Not queried or changed; no deployment claim |
| Review publication | [`codex/studio-review-2026-11-11`](https://github.com/zaferdajani/HZD-99/tree/codex/studio-review-2026-11-11) only |
| Environment | Linux workspace; locked Node dependencies; `/usr/bin/chromium`; Unix sockets denied with `EPERM` |

Collector start state contained only generated `tools/studio/__pycache__/`; no
tracked source was dirty. The evidence base was already remotely reachable.

## Evidence boundary

| Evidence | State | What it proves |
|---|---|---|
| Build/package | PASS | Current audited checkout builds and packages |
| Source/headless contracts | PASS where listed | Narrow invariants only |
| Staged Playwright harnesses | BLOCKED | Chromium could not create its Unix socket; no page began |
| `campaign-ch1` | BLOCKED | No uninterrupted real-input playthrough exists for this run |
| Static asset inspection | COMPLETE/LIMITED | Existing pixels/strips only, not runtime animation |
| Physical phone/controller/audio/haptics | NOT RUN | No hardware or listening claim |
| Production integration/deploy | NO | Authoritative refs remain unchanged |

The collector records `complete_requested_scope=true`,
`log_integrity.ok=true`, and 204/204 matching raw logs. A blocked check is
neither a pass nor a game failure.

## Fresh validation ledger

- JavaScript syntax for `game.js`, `quests.js`, `entities.js`, and
  `gravehorn.js` — PASS.
- `python3 -m unittest tools/studio/test_audit.py` — PASS, 15 tests.
- Combat impact, repair lifecycle, atomic quest payment, atomic NPC restore,
  Alpha optionality, Gravehorn eye/quarry, tile signature, infection-eye
  authority, caption FIFO, Sage walk, story progression, focus loss, and
  campaign-certificate logic — PASS.
- Build and package — PASS in the full collector.
- Full collector on `99533cc...` — 206 records: 41 pass, 165 blocked, zero
  executed failures/timeouts; 204/204 log snapshots match.
- `/usr/bin/chromium` exists, but `socket(AF_UNIX, SOCK_STREAM)` returns
  `EPERM`; browser lanes were correctly stopped before launch.

Evidence is in `automated/`; repeatable narrow checks are in
`targeted-validation.log`.

### Exact commands and exits

| Command | Exit | Log/result |
|---|---:|---|
| `npm ci` | 0 | 160 locked packages installed; deprecation warnings only |
| `CHROMIUM_PATH=/usr/bin/chromium python3 tools/studio/audit.py --profile full --output docs/studio/runs/2026-11-11/automated` | 1 | Required fail-closed aggregate: 41 pass, 165 blocked; `results.json` complete/integrity-valid |
| `node --check` on `game.js`, `quests.js`, `entities.js`, `gravehorn.js` | 0 | `targeted-validation.log` |
| `python3 -m unittest tools/studio/test_audit.py` | 0 | 15/15 pass in `targeted-validation.log` |
| Fourteen named combat/repair/quest/NPC/Alpha/Gravehorn/tile/eye/caption/Sage/story/input/campaign contracts | 0 | All pass in `targeted-validation.log` |

The collector's nonzero aggregate is not an executed assertion failure: it is
the required result when requested browser evidence is unavailable.

### Before/after patch list

| Scope | Before November 11 | After November 11 |
|---|---|---|
| Gameplay/runtime | November 10 verified candidate | Unchanged |
| Artwork/audio/video | Approved existing assets | Unchanged; nothing regenerated |
| Production/integration | All authority refs at `7da3c87...` | Unchanged |
| Evidence | November 10 collection | Fresh November 11 206-record collection and targeted log |
| Review handoff | November 10 report/prompt | New comparison report and one November 11 Claude prompt |

## Stable finding register

| ID | Sev. | Finding / consequence | Smallest authorized action | Acceptance | State |
|---|---:|---|---|---|---|
| CIN-01 | P1 | `docs/STORY_CANON.md` names Draft 3 while `manhua/full-story.md` and `manhua/edition.json` name Draft 4; compare revision fields to reproduce. All 32 rows are uncertified. Evidence: source inspection. | Owner + cinematic direction choose one revision and parity unit. | Every approved row maps to runtime asset, room, state, equipment timing, text, and signed evidence. | Open; blocks panel edits. |
| CIN-01-02 | P1 | Candidate caption FIFO/reset passes; production can still evict the oldest unread fourth caption. | Selectively port reviewed FIFO/reset. | Four-plus lines stay ordered; scene waits; reset clears visible and queued. | Candidate pass, not integrated. |
| QST-03 | P1 | `js/quests.js`/`js/world.js`: `ratchet_deep`, D2, A11, A13 share `coin`; collect any one then visit the others. Source inspection shows dedupe/global `sr_coin`. | Story/mission assigns four IDs/payoffs plus migration; mission engineering implements. | Every order, death/reload, and old save pays all four exactly once. | Open. |
| QST-04 | P1 | CV3 now agrees with runtime: Gravehorn retreat sets `bossHorn` before marble settlement. | Preserve ledger and gate. | Ordinary route and contract agree on `bossHorn → pl_cshard`. | Source fixed; runtime blocked. |
| CAVE-05 | P1 | `js/world.js`: compare generated GA1/GA2/GB1/GC1/GD1/GX1/GE1; source inspection shows the same three-room template and interchangeable payoff. | Mission/campaign/encounter authority approves one local story, action, consequence, callback per network. | Each is recognizable by purpose and changes something durable. | Open. |
| CAM-06-01 | P1 | `tests/campaign-ch1.cjs`/`automated/campaign-ch1.log`: run the collector here; preflight blocks before a page. No natural campaign evidence exists. | Campaign design + QA run cleared storage with ordinary input in a compatible environment. | Alpha-complete and Alpha-skip reach B1 with death/reload and all beats. | Blocked, not failed. |
| ART-08-01 | P1 | `assets/characters/gravehorn/` has no rig; `js/gravehorn.js` draws procedural plates and the 844×390 still shows the quality mismatch. | Character/boss art freezes design/pivots, then authors only the 14 keyed parts and approved story beats. | Idle, gait/turn, missile, charge, toss, kick, hurt, phase, hornless/reseat, retreat pass both sizes/facings. | Open. |
| ART-08-02 | P2 | `wolf_crouch4.webp` is a tell, not down/breathe/planted recovery. | Add only proven recovery coverage. | Settled down pose, breathing, weight-bearing stand; no slide/live hitbox. | Open. |
| ART-08-03 | P2 | `m_down` has red boss eyes; `r_cell` shows lit Servo; `passage_b` has tall/humanoid hero. | After CIN-01, make localized eye/light/silhouette edits only. | Correct identity without composition drift at native and game size. | Blocked by canon. |
| CIN-09-01 | P1 | Only Glitch meets the current ritual contract; Brood/Atlas/Zero/Prism are legacy silent films/fallbacks. | Freeze shot list, preserve Glitch, author only four missing rituals. | White gather → raise → slash → extraction → restore → deliberate picture/music fade. | Open. |
| VFX-10-01 | P1 | Source defines red ordinary/purple boss eyes, travel-gated finite wisps, cleanup, cap 320, reduced-motion glow; no browser rendered it. | Capture before retuning; eye-only mask baked red NULLFANG optic. | Correct anchors; tail ends ≤~1.875 s; teleport/remove/room/purify cleanup at both sizes. | Source pass; rendered blocked. |
| COMBAT-12-01 | P1 | Stats, armor, weapon tiers, charged ≥2×, flash, debris, recoil, hit-stop, shake, reduced motion, bounded log pass source contract. | Validate real input, sound, rumble, direction, cleanup. | One action/impact per successful press/release; none on miss/block/protected/cancel. | Source pass; feel blocked. |
| NPC-14-01 | P1 | Atomic restore/rollback/replay protection passes; wake/gift presentation is unrendered. | Selectively integrate and run save/reload journeys. | Cell, powered state, gift appear together exactly once. | Candidate pass; runtime blocked. |
| NPC-14-02 | P1 | Rescued Sage uses distance-based walk only while moving and rests when stopped. | Render actual displacement. | Planted feet; no sleeping slide; stable rest after reload. | Source pass; runtime blocked. |
| UI-15-01 | P2 | Locale counts remain EN 619, AR 600, TR/ZH/RU 215. Fallback is not parity. | Complete translations and review all five locales. | Zero missing keys plus signed wrapping/RTL/touch captures. | Open. |
| UI-15-02 | P2 | Caption/overlay queues are unbounded; input ownership is convention-based. | Measure, coalesce only duplicate noncritical items, enforce one owner. | Long nested sessions stay ordered/bounded without losing story. | Open. |
| PERF-11-01 | P1 | Low-end FPS, memory, thermal, trail cost, transition spikes, and device input are absent. | Profile representative phones/controllers. | Budgets plus ten-minute cave/swarm/boss/ritual/transition captures. | Unverified. |

### Reproduction, paths, evidence owners

- **CIN-01-02:** enqueue four story captions in `js/overlay.js`; inspect the
  fourth promotion/reset with `tests/scene-caption-contract.cjs`. Evidence is a
  source contract. Owner: integration + UI/cinematic.
- **QST-04:** inspect `docs/CAVES_CH1.md`, `js/entities.js`
  `pillarRewardReady()`, and `tests/gravehorn-quarry-contract.cjs`; attempt CV3
  settlement before/after legitimate retreat. Evidence is source/headless.
  Owner: mission + encounter + integration.
- **ART-08-02/03:** inspect `wolf_crouch4.webp` as a strip and the three named
  panels at native 1600×893. Evidence is static visual, not runtime. Owner:
  character art/cinematic after owner canon approval.
- **CIN-09-01:** inspect `assets/video/purify_*.mp4` with `ffprobe` and the
  current map in `js/purification.js`; only `purify_glitch_ritual.mp4` is the
  current H.264/AAC 1280×720, 13.25-second ritual with intentional end fade.
  Owner: cinematic direction + runtime integration.
- **VFX-10-01:** inspect `js/infection-eyes.js`, `js/gravehorn.js`, and the two
  eye-authority contracts; reproduce visually by moving, stopping,
  teleporting, removing, purifying, changing room, reaching the cap, and using
  reduced motion. Owner: VFX + gameplay engineering.
- **COMBAT-12-01:** `js/combat-stats.js` and
  `tests/combat-impact-contract.cjs` prove the narrow contract; repeat tap,
  hold/release, cancel, miss, block, protected target, and multi-target cases
  on real inputs. Owner: combat, audio, and UI/input engineering.
- **NPC-14-01/02:** use `tests/npc-restore-contract.cjs` and
  `tests/sage-walk-contract.cjs`, then replay wake/gift/walk through
  save/reload in the rendered game. Owner: NPC engineering + animation.
- **UI-15-01/02:** enumerate `js/i18n.js` keys; stress `js/overlay.js` with
  nested overlays and four-plus captions. Evidence is source inventory and one
  headless contract. Owner: UI/localization.
- **PERF-11-01:** no current runtime artifact exists; reproduce only on exact
  served build with ten-minute profiler/device sessions. Owner: technical
  direction + QA.

Gravehorn's frozen rig inventory is `body`, `head`, `head_roar`, `horn_big`,
`horn_small`, upper/lower foreleg, upper/lower hindleg, `tail`, and phase-two
`body2`, `head2`, `horn_big2`, `horn_small2`, plus four separately approved
manhwa beats. Transparent parts must contain no baked ground, shadow, text, or
infection glow; horns must visibly detach and reseat.

## Owner story and Chapter One route

Reviewed source expresses the intended chain:

`electrical short wakes hero → Ratchet battery-board repair → crystal clue →
Volt Pack → early caves → Gravehorn quarry → raw marble → white Purifier forge
→ first Sage rescue → CHIME → NULLFANG purification → B1`.

Alpha/GA2 is optional after the forged blade and must not block NULLFANG.
Source contracts support the order; no cleared-storage player has certified the
floor item, pod/recharge, monument, cave direction, return, forge, rescue
prompt, or ritual without hidden state manipulation.

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
| GA2/A10 | Optional Alpha, pack friendship/cache/Sage | Optionality passes; complete/skip blocked |
| GB1/GC1/GD1/GX1/GE1 | Repeated guardian template | CAVE-05 open |
| A11/A13/D2 | Coin secrets/pocket | QST-03 may suppress discoveries |
| A12 | Dash-return star relic | Distinct ability-gated return |

Engineering must not invent reward lore. Authority owns durable identities and
the seven local cave purposes.

## Manhwa parity and gameplay-size inspection

| Evidence | Observation | Decision |
|---|---|---|
| `edition.json` | 32 rows; expanded Draft 4 incomplete/full-scene uncertified | CIN-01 blocks generation/correction |
| Gravehorn intro, 844×390 | Finished hero beside pale procedural boss; historical eye red | Current source says purple, but no rig/render proof |
| `m_down.webp`, 1600×893 | Strong composition, red boss optics | Eye-only edit after canon |
| `r_cell.webp`, 1600×893 | Strong booth, background Servo lit | Indicator-only mask after canon |
| `passage_b.webp`, 1600×893 | Clear cave, hero too tall/humanoid | Silhouette-only correction after canon |
| `wolf_crouch4.webp`, 848×97 | Four readable crouch/tell cells | Not recovery |
| `sage/walk8.webp` | Eight varying transparent gait cells | Source wiring passes; planted runtime walk unverified |

No screenshot was recolored and no asset was regenerated.

## Animation, cinematic, VFX, and device matrix

| Subject | Preserved evidence | Missing proof/work |
|---|---|---|
| Hero | Approved variations/poses | Runtime delivery/feel; do not regenerate |
| Sage | Eight-cell walk plus distance-gait/rest source | Planted motion/reload |
| Pack/Alpha | Approved wolf set and ten Alpha strips | Proven recovery only; move reel; complete/skip routes |
| NULLFANG | Authored parts/moves/SFX | Runtime anticipation/contact/recovery and final ritual |
| Gravehorn | Detailed logic, purple-eye contract | Authored parts/anchors/hitboxes/planted motion |
| Eye trails | Red ordinary, purple bosses; 10 px/s threshold; 1.5 s ±25%; cap 320 | Rendered finite tail/cleanup/reduced motion |
| Purification | Glitch ritual: H.264/AAC 1280×720, 13.25 s, intentional audio/picture fade | Four current rituals and approved intercuts; runtime skip/reload |
| Browser/device | Build/package pass | 165 browser lanes, physical phones/controller/audio/haptics/performance |

## Fifteen senior-role verdicts

1. **Senior Cinematic Designer — HOLD P1.** Canon/parity is contradictory;
   caption FIFO passes candidate source, but production, pacing, skip/reload,
   and ending continuity are unverified.
2. **Senior Game Designer, Player Systems — SOURCE PASS / HOLD P1.** Tutorial,
   progression, repair retry, and focus contracts pass; real input and
   new-player comprehension do not.
3. **Senior Mission Designer, Quest Craft — HOLD P1.** CV3 stays corrected;
   four discoveries still collapse through `coin`.
4. **Principal Encounter Designer — HOLD P1.** Early topology/CV3 are coherent;
   traversal, retreat, optional Alpha, and seven unique cave purposes are not.
5. **Senior Boss Designer — HOLD P1.** Gravehorn lacks professional plates;
   NULLFANG/Alpha need runtime move and ritual proof. Gravehorn retreats;
   NULLFANG is purified.
6. **Senior Mission Designer, Campaign — HOLD P1.** Chronology/optionality pass
   narrow contracts; the uninterrupted campaign and death/reload did not run.
7. **Senior Mission Producer — HOLD.** Safe unchanged lineage, but no new
   gameplay delta; evidence must remain separate from integration.
8. **Senior Character Artist — HOLD P1/P2.** Preserve finished art; author only
   frozen Gravehorn parts and proven wolf recovery; manhwa waits for CIN-01.
9. **Senior Cinematic Director — HOLD P1.** Preserve Glitch; do not create four
   rituals/intercuts until canon and shot/ending contract are frozen.
10. **Senior VFX Artist — SOURCE PASS / RENDERED HOLD P1.** Finite red/purple
    authority exists; anchors, extinction, cleanup, cap are unrendered.
11. **Senior Technical Director — World Systems — SOURCE PASS / HOLD.** Tile
    signature/CV3/Alpha pass; crossings, cache cost, maps, devices do not.
12. **Gameplay Engineer, Combat — SOURCE PASS / HOLD P1.** Stats/impact pass;
    weight, direction, sound, rumble, cleanup, real timing do not.
13. **Gameplay Engineer, Mission — FIXED CONTRACT / RUNTIME HOLD.** Atomic
    payments/forge migration pass; QST-03 and natural journeys remain open.
14. **Gameplay Engineer, NPC — FIXED CONTRACT / RUNTIME HOLD.** Atomic restore
    and Sage selection pass; wake/gift/reload/planted motion are unrendered.
15. **Lead UI Engineer — SOURCE PASS / HOLD P1/P2.** Caption/focus pass; locale
    parity, queue bounds, overlay ownership, RTL/touch/device proof are open.

## Integration order

1. Owner chooses Draft 3/4 and parity unit; approves four reward identities and
   seven cave purposes.
2. Selectively port reviewed gameplay source from `db9eb3bd...`; never merge
   evidence or corrupt November 6 commits.
3. Rerun all 206 records where Chromium can create Unix sockets against exact
   build/served identity.
4. Run cleared-storage Alpha-complete and Alpha-skip campaigns, ordinary input
   only, each with death/reload through B1.
5. Produce the frozen Gravehorn rig, proven wolf recovery, rendered finite eye
   trails, real hit feel, NULLFANG ritual, deliberate picture/music fade.
6. Complete five locales, overlay bounds/ownership, physical devices,
   audio/haptics, and sustained profiling.

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

The codebase did not regress, but it also did not advance. The next useful
work is owner authority resolution, selective integration of the reviewed
bounded source, a browser-capable uninterrupted campaign, and a professional
Gravehorn rig. Until those gates are met, the game is **not release-ready** and
production must remain untouched.
