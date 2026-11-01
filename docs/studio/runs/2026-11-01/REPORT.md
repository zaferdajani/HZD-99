# CLAWBYTE senior studio review — 2026-11-01

## Executive verdict

**HOLD production. Do not merge or deploy this review branch.**

Production and both active integration refs are unchanged from the October 31
review: `main`, `odyssey`, and `claude/clawbyte-repo-migration-byhyl8` all point
to `7da3c87e6b43a2357a2f52080814ae1d6adad618`. Consequently, October 31's four
verified bounded fixes and its fail-closed audit safeguards were still absent
from production. This fresh branch starts at that production commit and carries
only those reviewed changes forward:

1. the rescued Sage uses its purified walk strip while moving and returns to
   its purified kneeling plate at rest;
2. quest payout is internally once-only when a callback is replayed;
3. Gravehorn's infected eye core and halo agree with the purple boss trail
   class while hazard/nozzle red stays separate;
4. the living story script describes Alpha as an optional post-Purifier depth
   branch rather than part of the mandatory road; and
5. the collector blocks missing browsers before launch, retains same-byte log
   snapshots, stops owned descendant writers, and validates every log again at
   completion.

The final supervised full collector accounted for all **196 gameplay
harnesses**: **31 non-browser harnesses passed** and **165 browser-dependent
harnesses were blocked** before launch because Chromium is absent. Build,
packaging, start/end served-build identity, and final log integrity passed. The
collector correctly remains overall red because blocked checks cannot certify
gameplay.

The first post-fix collector detected `weapons.log` changing after capture and
failed its integrity gate. That run is preserved separately under
`automated-integrity-fail/`; it was not rewritten or promoted. A distinct
supervised rerun completed with every raw log matching its retained snapshot.

No November 1 staged-browser result, uninterrupted real-input chapter-one run,
or physical-device check is claimed. No raster, animation, manhwa page, audio,
or cinematic asset was regenerated or altered.

## Repository and comparison

| Item | Evidence |
|---|---|
| Previous review | `codex/studio-review-2026-10-31@4e86fcc1d2a657727f6be68e50ff2a7e302754bf` |
| Production base | `main@7da3c87e6b43a2357a2f52080814ae1d6adad618` |
| Integration refs | `odyssey` and `claude/clawbyte-repo-migration-byhyl8`, both `7da3c87` |
| Delta after previous review | none in production or integration refs |
| Review branch | `codex/studio-review-2026-11-01` |
| Audited source commit | `2cbd9300e31d1f414a7e0d902019c047f47c9a5c` |
| Built identity | `index.html` SHA-256 `823137a95b8e76b7cff7f37d310d5315001097a31cfb95c355999e203ff4693a` |
| Production action | none; review branch only |

The October 31 branch is not merged wholesale. The current branch begins at
current `main` and selectively carries its isolated source, contract, audit,
and regenerated-page changes. Prior daily evidence directories are not copied.

## Evidence classes

1. **Source contract:** logic or metadata evaluated without a rendered browser.
2. **Staged browser harness:** a test may inject room, save, entity, inventory,
   position, or progress state.
3. **Uninterrupted real-input campaign:** cleared storage and ordinary player
   input only; `campaign-ch1` is the only current certificate for this class.
4. **Checkpoint diagnostic:** ordinary input from a game-written save; useful
   for diagnosis but never a full campaign certificate.
5. **Gameplay-size visual inspection:** a still is inspected at native or
   gameplay scale; it establishes neither motion nor input behavior.
6. **Physical-device evidence:** real touch/controller, frame time, memory,
   thermals, haptics, and audio; not completed.

## November 1 execution

### Commands and results

| Command | Result |
|---|---|
| `git fetch --all --prune` | pass; production/integration refs all `7da3c87` |
| `npm ci` | pass; 160 packages installed |
| browser inventory | blocked; no Chromium/Chrome executable found |
| `PLAYWRIGHT_BROWSERS_PATH=/tmp/clawbyte-pw npx playwright install chromium` | exit 1; five 0 MiB downloads, each an invalid/truncated ZIP |
| `python -m unittest tools.studio.test_audit -v` | pass, 10/10 |
| four new source contracts | pass: Sage walk, quest payout, Gravehorn eye, Alpha optionality |
| `node --check` on edited game sources | pass |
| `node build.cjs` | pass; four targets |
| `node tools/pack-www.cjs` | pass; 694 assets, 244.3 MB; two pages, 8.2 MB; total 252.5 MB |
| first full collector | integrity fail; `weapons.log` changed after capture; retained separately |
| supervised final full collector | expected exit 1; 165 browser checks blocked, all scope accounted, identity/integrity pass |
| `git diff --check` | pass |

### Final full collector

- Requested gameplay harnesses: **196/196 accounted for**.
- Non-browser gameplay/source harnesses passed: **31**.
- Browser-dependent harnesses blocked before launch: **165**.
- Build and package tasks: pass.
- Served identity: pass at both start and end.
- Retained snapshot/raw log integrity: pass, zero mismatches.
- Overall release result: fail/hold because blocked scope is not a pass.

Passing harnesses:

`combat-impact-contract`, `repair-lifecycle`, `quest-payment-contract`,
`story-opening`, `script-route`, `alpha-optional-contract`, `scratch-reach`,
`hero-feedback`, `tutorial-controller`, `offline-release`, `sage-specials`,
`tutorial-clarity`, `story-progression`, `input-focus`, `voice-handoff`,
`desktop-protocol`, `cave-ground`, `seam-route`, `shadow-ground`,
`dialogue-audio`, `weapons`, `gear`, `motion-sampling`, `combo-routing`,
`credits`, `tails`, `gravehorn-eye-contract`, `grapple-contract`,
`reel-contract`, `campaign-contract`, and `sage-walk-contract`.

These establish source/state contracts, not rendered gameplay.

## Fifteen senior-role verdicts

| # | Senior responsibility | Verdict | Evidence boundary |
|---|---|---|---|
| 1 | Senior Cinematic Designer | HOLD P1/P2 | Sixteen event IDs and skip logic exist; 40-page Draft 3 parity, rendered pacing, phone crop, and localization remain uncertified. |
| 2 | Senior Game Designer — Player Systems | HOLD P1 | Direction and Memory Node source improved, but applicable real-input evidence still shows held charge/heal failure. |
| 3 | Senior Mission Designer — Quest Craft | source FIXED / journey HOLD | Quest payout and Alpha authority are corrected; natural optional-cave loops remain unproven. |
| 4 | Principal Encounter Designer | HOLD P1 | Cave topology is coherent; Gravehorn reliability and natural encounter/return evidence are absent. |
| 5 | Senior Boss Designer | HOLD P1/P2 | NULLFANG and Purifier gates are coherent; Gravehorn art/mechanics and four ritual films remain open. |
| 6 | Senior Mission Designer — Campaign | source FIXED / campaign HOLD | Alpha authority is corrected; no clean ordinary-input run reaches B1 or proves a mandatory route that skips Alpha. |
| 7 | Senior Mission Producer | HOLD | Branch safety and evidence retention pass; browser/campaign/device release gates remain red. |
| 8 | Senior Character Artist | HOLD P1/P2 | Approved hero/Alpha remain strong; Gravehorn, bound beasts, and Sage strip cleanup remain below target. |
| 9 | Senior Cinematic Director | HOLD P1/P2 | Draft 3 parity, Gravehorn intercuts, four current ritual films, and three panel corrections remain open. |
| 10 | Senior VFX Artist | source FIXED / rendered HOLD | Gravehorn source now agrees with purple boss class; complete pose/device proof is absent. |
| 11 | Senior Technical Director — World Systems | source PASS / performance HOLD | Route contracts pass; historical room-cache spike and terrain/boss-space timeouts have no fresh browser result. |
| 12 | Senior Gameplay Engineer — Combat | source PASS / real-input HOLD P1 | Fixed-step thresholds are plausible; held input, gait invariance, and Gravehorn transitions are not certified. |
| 13 | Senior Gameplay Engineer — Mission | source FIXED / campaign HOLD | Payout replay is fixed and optional Alpha locked; natural acquisition/recovery and B1 remain open. |
| 14 | Senior Gameplay Engineer — NPC | source FIXED / rendered HOLD | Moving rescued Sage now selects purified gait; natural purify→walk→reload is blocked. |
| 15 | Lead UI Engineer | source-improved / rendered HOLD | Tutorial arrows, text and reveal logic are plausible; queue bounds, five-language render and physical inputs remain open. |

## Implemented bounded fixes

### `NPC-SAGE-WALK-31` — carried, source-tested, rendered hold

Before, Sage was excluded from `WALKERS`, and `drawSage()` treated every tamed
Sage as kneeling. Calm movement therefore translated the sleeping/purified
plate across the floor. The current branch adds Sage distance gait, selects
`sageWalk8` with purified material while actual velocity exceeds the walking
threshold, and returns to `sagePure` while stopped.

Verification: source contract, syntax, build, and package pass. The browser
test is blocked. Acceptance remains natural purification→walk→stop/turn→leave/
return→reload with planted feet and no hostile-state regression.

### `QUEST-IDEMPOTENCY-31` — carried and source-tested

Before, replaying `questPay(servo_coil)` changed 60 scrap/10 IQ into 120
scrap/20 IQ and repeated persistence, cue, and burst side effects. The function
now rejects missing/already-complete quests and returns an explicit boolean.

Verification: the second callback leaves save JSON, inventory removal,
persistence count, win cue, burst count, scrap, IQ, and relic state unchanged.

### `GH-EYE-CLASS-31` — carried, source-tested, rendered hold

Gravehorn's procedural eye core and halo now use boss purple `#ba5cff`; the
animated current-frame `infEyeMark` anchor remains intact. Hazard markings,
missile nozzles, molten cracks, and telegraph amber remain separate. The art and
story briefs require an unlit aperture in authored plates so runtime emission
does not double.

Verification: source contract and build pass. A complete rendered state/facing
sweep is blocked.

### `ALPHA-DOC-31` — carried and source-tested

`STORY_SCRIPT.md`, `CAVES_CH1.md`, and runtime now agree: Alpha is an optional
A2 depth-door branch available after the Purifier, never a requirement for the
mandatory A2→A3→A4 path or B1. The contract locks the blade gate and wording.

### `AUDIT-INTEGRITY-31` — carried and unit-tested

The collector now preflights direct Playwright harnesses, marks a missing or
non-executable browser blocked, preserves each closed log as `content_base64`,
stops owned descendants, and revalidates raw and snapshot bytes at completion.
Ten unit tests pass. The first November 1 execution demonstrated the safeguard
by catching an actual post-capture write; the second execution passed integrity.

## Priority findings

### `INPUT-HOLD-01` — P1, open

Applicable real-input evidence remains unchanged: a normal 12-damage tap works,
but a 950 ms held attack did not reach the 0.6 s charge, and the mandatory heal
lesson stalled with 99 volts and 6/7 cores. No production change after that run
touches raw input lifetime, focus, overlay ownership, or release handling.

Acceptance: three clean real-event runs per keyboard, controller, and touch
proving tap, uninterrupted hold, release, blur/cancel, charged contact, exact
0.85 s heal cost, one restored core, one lesson advance, and reload continuity.
Do not reduce thresholds or auto-complete the lesson.

### `GH-MECH-01` / `GH-ART-01` — P1, open

The current Gravehorn implementation has no new green browser evidence for
intro/name card, charge/jump, parry, horn return, recoveries, phase two, rear
kick, chained charge, defeat/retreat, or retry. Gameplay-size inspection still
shows a large translucent pale procedural animal beside the finished painted
hero. `assets/characters/gravehorn/` contains no authored rig, and all four
planned `gh_*` encounter intercuts are absent.

Acceptance: authored gunmetal/bronze rig with both facings, planted hooves,
complete joint overdraw, separate horns/sockets, phase-two separation and
retreat; four intercuts at their actual beats; three consecutive full mechanics
passes; ordinary-input CV1B→CV3 win/death/retry.

### `COMBAT-GAIT-01` — P1/P2, open

Historical rendered evidence found equal traveled distance changing 39 pixels
when only time changed. Locomotion rendering still receives both animation time
and `walkD`. Equal state/distance must produce identical gait pixels while idle,
airborne, and telegraph motion retain their intended clocks.

### `CAMPAIGN-B1-01` — P1, open

The latest applicable uninterrupted ordinary-input journey reached the early
cave/forge route and later timed out; it did not certify Sage→CHIME→NULLFANG→B1.
The current collector could not launch `campaign-ch1`.

Acceptance: one cleared-storage ordinary-input run to B1 with no injected flag,
item, save, position, progress, room, or teleport state; a second mandatory run
must explicitly skip Alpha.

### `MANHWA-PARITY-01` — P1, open

Draft 3 defines 40 pages. The revised asset folder has 32 images, the maintained
manhwa ledger still describes a 27-page edition, and the existing parity file
says no complete page is certified. There is no literal 40-row runtime parity
ledger.

Acceptance: one row per page covering cast, props/equipment, exact action, VFX,
audio, trigger, gameplay-size capture, and owner verdict. Approved assets remain
untouched unless a page-specific mismatch requires revision.

### `CAVE-JOURNEY-01` — P2, open

Source contracts establish topology and intended rewards, but not player-
experienced meaning. Every optional loop still needs ordinary-input offer→
landmark→action→distinct reward→visible consequence→return/reload proof.

### `RITUAL-IDENTITY-01` — P2, open

Only Glitch/NULLFANG maps to an accepted current-contract purification film.
Brood, Atlas, Zero, and Prism still use fallback/legacy material that does not
prove the required earned hero/sword, white gather, slash, dark extraction,
neutralization, restored guardian, or smooth picture/music fade.

### `EYE-VFX-01` — source pass / rendered hold

The shared implementation specifies red ordinary infection; purple bosses,
Sages, and Alpha; transformed current-frame anchors; world-space body-travel
emission; fixed simulation; 1.125–1.875 s lifetime; caps 90/170/260/320;
discontinuity and cure/death/removal/teleport/room cleanup; duplicate
suppression; and reduced-motion glow only. The complete pose sweep and device
certificate are absent.

### `WORLD-PERF-01` — P1/P2, open

Applicable historical evidence records a 114 ms crossing against a 90 ms budget
and a 2998 ms bake-ahead frame; `terrainrun` and `bosspace` timed out. Profile
three times and split work rather than raising budgets.

### `UI-QUEUE-01` / `UI-LOCALE-01` — P2, open

`OVERLAY_Q` and toast insertion remain unbounded/undeduplicated. Scene captions
discard the oldest after three, which needs narrative-loss stress evidence.
The 21/22 px source change has no current English/Arabic/Turkish/Chinese/Russian
desktop/phone capture proving wrap, kinsoku, RTL shaping, reveal, debounce, or
reduced-motion behavior.

## Cave census

| Area | Intended value | Current evidence |
|---|---|---|
| A5 | cracked floor, Mind Node, Magnet crest, quarry history | source/staged historical; current browser blocked |
| A7 | survey and once-only Ratchet payment | fresh payout source contract; natural loop open |
| CV1 | bound crawler and max-core chest | source/staged historical |
| CV1B | survey pod, chart, shortcut, rest/respawn | historical journey/checkpoint |
| CV2 | Deaf System/beacon and quarry route | checkpoint diagnostic only |
| CV3 | Gravehorn, raw marble, changed return route | source/staged; encounter browser blocked |
| GA1T/GA1/GA1D | refuge, bench, first Sage, network rescue | Sage source-fixed; rendered recovery blocked |
| A11 | secret coin | source/staged historical |
| A12 | dash-return challenge and star relic | source/staged historical |
| A13 | Servo/Warden history and coin | source/staged historical |
| A10/GA2/GA2T/GA2D | optional Alpha, friendly pack, Warden ledger, Pack Sage | optional contract pass; natural loop open |

## Story/manhwa parity matrix

| Beat | Best evidence | Open acceptance gap |
|---|---|---|
| Wake/bay/gate | source contracts and historical real-input journey | current rendered direction/touch and acting |
| Letter/drawer/repair | historical journey; repair lifecycle source pass | body/hand/socket continuity in pinned build |
| Ratchet explanation | historical journey | pendant and removed-battery acting |
| Pod/Volt Pack | historical journey | held-heal completion and physical touch |
| Memory Node | source/staged harness | rendered miss/retry/success and real touch |
| Cave/Gravehorn/raw marble | source/staged/checkpoint entry | reliable encounter, acquisition, and return |
| Forge | source/staged | natural hand/tool/material contact |
| Passage/Meadow Sage | source/staged; walk source fixed | uninterrupted rescue/friendly recovery |
| CHIME/NULLFANG | source/staged historical | clean journey and casing/cable acting |
| Purification | staged logic; Glitch film current | four missing identity films and device/audio proof |
| B1 teaser | historical | fresh uninterrupted completion |

## Animation, cinematic, and VFX matrix

| Subject | Current verdict | Required acceptance |
|---|---|---|
| Hero | approved/preserved | do not regenerate |
| NULLFANG | authored motion assets present | fresh rendered timing/contact; panel eye correction |
| Alpha/pack | authored identity strips present | optional natural rescue/reload proof |
| Sage walk | source-fixed/built; strip has visible rectangular transparency remnants | clean strip presentation plus natural purify→walk→stop→reload |
| Gravehorn | procedural placeholder; source eye fixed purple | authored rig, encounter mechanics, and four intercuts |
| Bound wolf/cheetah | crouched/standing weak variation, not down recovery | four-cell floor-anchored down/breathe/recover strips |
| Purifier hero | ordinary body under VFX | raise→gather→slash→recover, both facings |
| Guardian rituals | Glitch current; four absent | identity film, smooth picture/audio fade, skip/retry/save |
| Eye trails | source contract coherent | full pose/roster and low/mid/high device certificate |

## Gameplay-size visual inspection

Current retained/native assets were reopened at original or gameplay scale:

- `docs/studio/runs/2026-10-11/images/gravehorn-intro.png` still shows a pale,
  translucent, flat procedural Gravehorn beside the finished hero. The source
  eye class is fixed, but no new frame visually proves it.
- `assets/manhua/ch1/game/m_down.webp` still paints NULLFANG's boss eyes red/
  pink rather than purple.
- `assets/manhua/ch1/game/r_cell.webp` still leaves the supposedly inactive
  background Servo with amber eyes and a cyan chest light.
- `assets/manhua/ch1/game/passage_b.webp` still depicts a tall humanoid rear
  hero with elongated limbs rather than the compact established body.
- `assets/characters/beasts/wolf_crouch4.webp` contains four near-identical
  crouches, not a down/breathe/recover strip.
- `assets/characters/sage/walk8.webp` is a usable eight-cell upright gait but
  visibly retains grey rectangular transparency/backdrop remnants around cells.

Any panel correction must be a masked local edit at original dimensions,
preserving framing, light, props, and unrelated pixels. These assets were not
edited in this review.

## Implemented, tested, integrated, and deployed

| Category | November 1 status |
|---|---|
| Implemented game-source changes | Sage gait, once-only quest payout, Gravehorn boss-purple procedural eye |
| Implemented canon/review changes | Alpha optional script correction; Gravehorn art brief; fail-closed collector safeguards |
| Tested | four builds; package; 196 harness accounting; 31 source passes; start/end identity; final integrity; 10 audit units |
| Visually inspected | retained Gravehorn gameplay capture, three manhwa panels, wolf and Sage strips |
| Fresh staged browser evidence | none; 165 harnesses blocked before launch |
| Uninterrupted campaign | none |
| Physical device | none |
| Integrated into `main` | no |
| Deployed | no |

## Blockers and unverified scope

- Chromium/Chrome is absent; Playwright downloaded five invalid 0 MiB archives.
- No fresh rendered Sage, Gravehorn, tutorial, text, film, or eye-trail result.
- No November 1 uninterrupted clean-save campaign.
- No physical touch/controller/remap, performance, memory, thermal, haptic, or
  audio-fade test.
- No complete forty-page manhwa parity certificate.
- Approved asset generation was intentionally skipped.

## Release recommendation

Keep production on hold. Claude should selectively integrate this branch onto a
new integration branch, obtain a pinned executable Chromium, verify the four
bounded fixes in rendered gameplay, then repair held input and Gravehorn's state
chain before attempting the clean B1 campaign. Source contracts, staged saves,
blocked harnesses, viewport emulation, checkpoint diagnostics, and retained
stills must remain distinct from uninterrupted real-input acceptance.
