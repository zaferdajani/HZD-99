# CLAWBYTE senior studio review — 2026-10-31

## Executive verdict

**HOLD production. Do not merge or deploy this review branch.**

Unlike October 30, production changed. `main`, `odyssey`, and
`claude/clawbyte-repo-migration-byhyl8` now point to
`7da3c87e6b43a2357a2f52080814ae1d6adad618`. That commit improves the
Memory Node retry, prevents copied demonstration presses from entering the
answer buffer, adds directional tutorial arrows/touch guidance, and increases
dialogue and film-caption size. These are useful source-level improvements, but
there is no fresh rendered or uninterrupted campaign certificate.

This review found and fixed four bounded regressions/contract defects on the
review branch:

1. restored the rescued Sage's distance-driven purified walk instead of moving
   the kneeling rescue plate;
2. made quest payout internally once-only when a callback is replayed;
3. aligned Gravehorn's procedural eye core/halo and art brief with the purple
   boss-infection trail class; and
4. corrected the living story script so Alpha remains an optional forged-blade
   depth-door branch.

All fast source contracts, the four-target build, packaging, served-build
identity, and evidence integrity pass. The full collector accounted for all
196 current harnesses: 31 non-browser harnesses passed and 165 browser-dependent
harnesses were blocked before launch because Chromium is absent. The overall
collector correctly remains red.

No fresh staged browser result, uninterrupted real-input chapter-one run, or
physical-device check is claimed. The Sage and Gravehorn presentation fixes are
implemented and built, but remain visually unverified. No approved raster,
animation, manhwa, or cinematic asset was regenerated.

## Repository and comparison

| Item | Evidence |
|---|---|
| Previous review | `codex/studio-review-2026-10-30@98a4ad1dd64a29b5a0f13d362d6affb2da492418` |
| Latest production `main` | `7da3c87e6b43a2357a2f52080814ae1d6adad618` |
| Latest integration refs inspected | `odyssey` and `claude/clawbyte-repo-migration-byhyl8`, both `7da3c87` |
| Production delta | 12 files; Memory Node, tutorial direction, touch cue, dialogue/film text and built pages |
| Review branch | `codex/studio-review-2026-10-31` |
| Post-fix audited commit | `effeecae99dc0e5ba9fe79904907146acb76b447` |
| Built identity | `BUILD_ID d07f272de46a`; `index.html` SHA-256 `823137a95b8e76b7cff7f37d310d5315001097a31cfb95c355999e203ff4693a` |
| Production action | none; review branch only |

The previous review branch is a separate lineage. This branch starts from the
new `main` and selectively carries forward only the fail-closed audit
safeguards plus verified bounded changes. It does not replace `main` with the
older review tree.

## Evidence classes

1. **Source contract:** logic or metadata evaluated without rendering.
2. **Staged browser harness:** room/save/entity/position may be prepared.
3. **Uninterrupted real-input campaign:** cleared storage and ordinary input only.
4. **Checkpoint diagnostic:** ordinary input from a game-written save; never a full certificate.
5. **Gameplay-size visual inspection:** a frame is evaluated; motion is not implied.
6. **Physical device:** touch/controller/performance/thermal evidence; not completed.

## October 31 execution

### Environment and commands

| Command | Result |
|---|---|
| `npm ci` | pass; 160 packages installed |
| browser inventory (`chromium`, `chromium-browser`, `google-chrome*`) | blocked; no executable found |
| `PLAYWRIGHT_BROWSERS_PATH=/tmp/clawbyte-pw npx playwright install chromium` | exit 1; five downloads reported 0 MiB and invalid/truncated ZIPs |
| `python -m unittest tools.studio.test_audit -v` | pass, 10/10 |
| `node tests/quest-payment-contract.cjs` | pass |
| `node tests/gravehorn-eye-contract.cjs` | pass |
| `node tests/sage-walk-contract.cjs` | pass |
| `node tests/alpha-optional-contract.cjs` | pass |
| `node build.cjs` | pass; four targets |
| `node tools/pack-www.cjs` | pass; 694 assets, 244.3 MB; two pages, 8.2 MB; total 252.5 MB |
| first post-fix full collector | failed integrity; `repair-lifecycle.log` changed after capture; preserved under `automated-integrity-fail/` and excluded from certification |
| supervised final full collector | expected exit 1 because 165 checks were blocked; all 196 harness slots accounted for; identity/integrity pass |
| `git diff --check` | pass |

### Final full collector result

- Requested gameplay harnesses: **196/196 accounted for**.
- Source/non-browser harnesses passed: **31**.
- Browser-dependent harnesses blocked before launch: **165**.
- Build and package: pass.
- Served identity: pass at start and end.
- Log integrity: pass with no mismatch.
- Overall release result: fail/hold because blocked checks cannot certify gameplay.

Passing harnesses:

`combat-impact-contract`, `repair-lifecycle`, `quest-payment-contract`,
`story-opening`, `script-route`, `alpha-optional-contract`,
`scratch-reach`, `hero-feedback`, `tutorial-controller`,
`offline-release`, `sage-specials`, `tutorial-clarity`,
`story-progression`, `input-focus`, `voice-handoff`,
`desktop-protocol`, `cave-ground`, `seam-route`, `shadow-ground`,
`dialogue-audio`, `weapons`, `gear`, `motion-sampling`,
`combo-routing`, `credits`, `tails`, `gravehorn-eye-contract`,
`grapple-contract`, `reel-contract`, `campaign-contract`, and
`sage-walk-contract`.

These establish source/state contracts, not rendered gameplay.

## Production delta assessment

### Improvements in `7da3c87`

- Memory Node misses retry in place instead of ejecting the player.
- Inputs copied during the demonstration no longer populate `memIn`.
- The handoff explicitly says “Your turn.”
- World arrows distinguish left/right/up and edge chevrons; touch highlights the
  correct stick side.
- Dialogue body text rises to 21 px/19 px and film captions to 22 px with
  corresponding layout changes.
- `tests/memnode-retry.cjs` stages miss→retry→success behavior.

### What the delta does not prove

- `memnode-retry` directly loads A0 and drives internal state; it is staged.
- No current browser executed the arrow, touch, text, film or Memory Node changes.
- Held heal/charged attack code was not changed.
- Cave topology, Gravehorn mechanics, guardian rituals, manhwa art and eye-trail
  simulation were not changed.
- The last ordinary-input campaign still stalled at the mandatory held-heal
  lesson before the caves.

## Fifteen senior-role verdicts

| # | Senior responsibility | Verdict | Evidence boundary |
|---|---|---|---|
| 1 | Senior Cinematic Designer | HOLD P1 | Larger text is source-positive; five-language rendered pacing, skip continuity and forty-row parity remain open. |
| 2 | Senior Game Designer — Player Systems | HOLD P1 | Direction and Memory Node logic improved; held heal/charge and physical input are unproven. |
| 3 | Senior Mission Designer — Quest Craft | source PASS / journey HOLD P2 | Forward causality and once-only payout now pass; natural cave loops remain unproven. |
| 4 | Principal Encounter Designer | HOLD P1 | Mandatory Gravehorn lifecycle evidence remains red/historical and no uninterrupted encounter was reached. |
| 5 | Senior Boss Designer | HOLD P1/P2 | Sword/Alpha/NULLFANG gates are coherent; Gravehorn and four ritual films remain open. |
| 6 | Senior Mission Designer — Campaign | HOLD P1 | Alpha documentation is corrected; no cleared-save ordinary-input journey reaches B1. |
| 7 | Senior Mission Producer | HOLD | Branch/evidence scope is controlled; one corrupt run is retained separately; release gates remain red. |
| 8 | Senior Character Artist | HOLD P1/P2 | Gravehorn is still procedural; bound beasts and three panels remain below hero-relative quality. |
| 9 | Senior Cinematic Director | HOLD P1/P2 | Draft 3 parity, Gravehorn intercuts, four rituals and localized panel corrections remain open. |
| 10 | Senior VFX Artist | source PASS / rendered HOLD | Gravehorn source color conflict is fixed; complete pose/device proof is absent. |
| 11 | Senior Technical Director — World Systems | HOLD P1/P2 | Cache spike, terrain/boss-space timeouts and clean traversal remain unresolved. |
| 12 | Senior Gameplay Engineer — Combat | HOLD P1 | Real held input, gait invariance and Gravehorn state chain remain unresolved. |
| 13 | Senior Gameplay Engineer — Mission | source PASS / campaign HOLD | Callback payout is now once-only; natural route, touch Memory Node and B1 remain open. |
| 14 | Senior Gameplay Engineer — NPC | source FIXED / rendered HOLD | Moving Sage now selects purified walk; natural purify→walk→reload is blocked. |
| 15 | Lead UI Engineer | source-improved / rendered HOLD | Direction/text/RTL/reveal logic is plausible; browser, queue capacity and physical devices remain open. |

## Implemented bounded fixes

### `NPC-SAGE-WALK-31` — source fixed, rendered hold

**Before:** `WALKERS` excluded Sage; calm AI moved the body while
`drawSage()` always selected `sagePure`, so the kneeling rescue plate slid
across the floor.

**After:** Sage accrues distance gait; a moving rescued Sage selects the
eight-cell `sageWalk8` strip with purified material; a stopped rescued Sage
returns to `sagePure`.

**Verification:** `sage-walk-contract`, syntax, build and package pass.
`sage-walk` is present but blocked before Chromium launch. Acceptance still
requires natural purification→walk→stop→leave/return→reload and gameplay-size
feet/turn review.

### `QUEST-IDEMPOTENCY-31` — fixed and source-tested

**Before:** calling `questPay(servo_coil)` twice changed 60 scrap/10 IQ into
120 scrap/20 IQ.

**After:** `questPay()` exits when that quest is already done and returns an
explicit success/failure value.

**Verification:** replaying the callback leaves save, inventory, persist count,
win cue and burst count unchanged after the first payment.

### `GH-EYE-CLASS-31` — source fixed, rendered hold

**Before:** retained gameplay-size captures showed a red Gravehorn eye core
inside a purple boss smoke trail. `js/gravehorn.js` and the art brief both
specified red.

**After:** the procedural eye core and halo use boss purple `#ba5cff`, the
animated transformed anchor remains `infEyeMark`, and `ART_QUEUE.md` plus
`STORY_SCRIPT.md` require purple runtime infection with no baked emission.
Nozzle/hazard red remains separate.

**Verification:** source contract and build pass. A new gameplay capture and
complete pose sweep remain blocked.

### `ALPHA-DOC-31` — fixed and source-tested

The living story now agrees with `CAVES_CH1.md` and production wiring: Alpha
is an optional A2 depth-door branch after the Purifier, never the mandatory
A2→A3→A4 or B1 road. A source contract locks that statement and the blade gate.

## Priority open findings

### `INPUT-HOLD-01` — P1, open

Applicable real-input evidence shows a normal 12-damage claw hit, but a 950 ms
held attack never reaches the 0.6 s charge. The uninterrupted campaign held heal
with 99 volts and 6/7 cores until timeout. Current source contracts do not prove
raw keyboard/touch/controller event lifetime.

Acceptance: three clean real-event runs per input family proving tap, hold,
release, blur/cancel, charged contact, 0.85 s heal, exact cost, one restored
core, one tutorial advance and reload continuity. Do not reduce thresholds or
auto-complete the lesson.

### `GH-MECH-01` / `GH-ART` — P1, open

The latest applicable mechanics evidence fails intro/name-card flow, recoveries,
charge/jump, parry, horn return, phase two, rear kick, chained charge and retry.
Gameplay-size frames show a translucent pale-pink procedural rhinoceros beside a
finished painted hero. No authored `assets/characters/gravehorn/` rig exists.

Acceptance: three complete mechanics passes on one pinned build; ordinary-input
CV1B→CV3 win/death/retry; authored gunmetal/bronze part rig with planted feet,
both facings, horn/socket states, phase two and retreat; four triggered intercuts.

### `COMBAT-GAIT-01` — P1/P2, open

Equal traveled distance previously changed 39 pixels when only wall-clock time
changed. Visible gait must derive from state and distance, not
`performance.now`, while preserving facing, foot banking and airborne plates.

### `CAMPAIGN-B1-01` — P1, open

The latest uninterrupted journey reached letter, unique battery, Ratchet repair,
explanation, pod, funding and Volt Pack, then stalled at held heal. It did not
certify Servo, Gravehorn, raw marble, forge, Sage, CHIME, NULLFANG or B1.

Acceptance: one cleared-storage ordinary-input run to B1 with no flag, inventory,
save, position, progress, room or teleport injection; a second run skips Alpha.

### `MANHWA-PARITY-01` — P1, open

Draft 3 defines forty pages. The revised folder/reader do not expose a literal
forty-page final edition or a forty-row runtime parity ledger. Pages 16–40 still
require production/restaging under the editorial review.

Acceptance: one row per page with cast, props/equipment, physical action, VFX,
audio, trigger, gameplay-size capture and owner verdict.

### `CAVE-JOURNEY-01` — P2, open

Source contracts establish topology and authored rewards, but not natural
meaning. Each optional loop still needs ordinary-input offer→landmark→action→
distinct reward→visible consequence→return/reload evidence. Alpha must remain
optional.

### `RITUAL-IDENTITY-01` — P2, open

Only Glitch/NULLFANG maps to an accepted current-contract ritual film. Brood,
Atlas, Zero and Prism still use in-engine fallback or legacy clips that do not
satisfy the current hero/sword/extraction grammar.

### `EYE-VFX-01` — source pass / rendered hold

The shared implementation still specifies red ordinary infection; purple bosses,
Sages and Alpha; current-frame transformed anchors; world-space body-travel
emission; fixed simulation; 1.125–1.875 s lifetime; caps 90/170/260/320; >90 px
discontinuity clear; cure/death/removal/teleport/room cleanup; duplicate
suppression; reduced-motion glow only. The complete pose sweep and physical
device certificate remain absent.

### `WORLD-PERF-01` — P1/P2, open

Applicable evidence records 114 ms crossing against a 90 ms budget and a 2998 ms
bake-ahead frame; `terrainrun` and `bosspace` timed out. Reproduce and profile
three times; divide work instead of raising budgets.

### `UI-QUEUE-31` / `UI-CJK-01` — P2, open

`G.toasts` and `OVERLAY_Q` remain unbounded/undeduplicated. Scene captions
drop the oldest after three, requiring narrative-loss stress evidence. Larger
text may improve the Chinese fixture, but no production-font phone capture proves
wrapping, kinsoku, clipping or RTL shaping.

## Cave census

| Area | Intended value | Evidence |
|---|---|---|
| A5 | cracked floor, Mind Node, Magnet crest, quarry history | source/staged historical; new retry rendered blocked |
| A7 | survey and once-only Ratchet payment | source/staged historical; payout guard fresh pass |
| CV1 | bound crawler and max-core chest | source/staged historical |
| CV1B | survey pod, chart, shortcut, rest/respawn | historical journey/checkpoint |
| CV2 | Deaf System/beacon and quarry route | checkpoint diagnostic |
| CV3 | Gravehorn, raw marble, changed return route | source/staged; encounter red |
| GA1T/GA1/GA1D | refuge, bench, first Sage, network rescue | source/staged; rescued walk source-fixed/render blocked |
| A11 | secret coin | source/staged |
| A12 | dash-return challenge and star relic | source/staged |
| A13 | Servo/Warden history and coin | source/staged |
| A10/GA2/GA2T/GA2D | optional Alpha, friendly pack, Warden ledger, Pack Sage | source/staged; optional contract fresh pass; natural loop open |

## Story/manhwa parity

| Beat | Best evidence | Open acceptance gap |
|---|---|---|
| Wake/bay/gate | historical real-input journey; source delta | rendered directional guidance and literal acting |
| Letter/drawer/repair | historical journey; repair lifecycle source pass | body/hand/socket continuity |
| Ratchet explanation | historical journey | pendant/battery acting |
| Pod/Volt Pack | historical journey | held-heal completion; physical touch |
| Memory Node | source/staged test present | current rendered miss/retry/success and touch behavior |
| Cave/Gravehorn/raw marble | source/staged/checkpoint entry | reliable encounter, acquisition and return |
| Forge | source/staged | hand/tool/material contact in journey |
| Passage/Meadow Sage | source/staged; walk source fixed | uninterrupted rescue/friendly recovery |
| CHIME/NULLFANG | source/staged historical | clean journey; casing/cable acting |
| Purification | staged logic; Glitch film only | hero performance and four current films |
| B1 teaser | historical | fresh uninterrupted completion |

## Animation, cinematic and VFX matrix

| Subject | Current verdict | Required acceptance |
|---|---|---|
| Hero | approved/preserved | do not regenerate |
| NULLFANG | authored motion assets present | fresh rendered timing/contact; panel eyes purple |
| Alpha/pack | identity-specific strips present | optional natural rescue/reload proof |
| Sage walk | source-fixed/built | rendered natural purify→walk→stop→return→reload |
| Gravehorn | procedural placeholder; source eye now purple | authored rig, mechanics and four intercuts |
| Bound wolf/cheetah | flattened crouch/down fallback | authored four-cell down/breathe/recover strips |
| Purifier hero | regular body under VFX | raise→hold/gather→slash→recover, both facings |
| Guardian rituals | Glitch current; four absent | identity film, audio/picture fade, skip/retry/save |
| Eye trails | source contract coherent | stable core/roster/full-pose and device certificate |

## Gameplay-size visual inspection

Fresh browser frames could not be produced. Existing current-build 844×390
captures and the shipped 1600×893 panels were reopened at native/gameplay size:

- Gravehorn's scale reads, but its translucent flat procedural body is materially
  below the hero; the retained capture visibly showed a red eye core inside a
  purple smoke trail. The source conflict is fixed, not visually certified.
- `m_down.webp` still gives NULLFANG red/pink eyes rather than boss purple.
- `r_cell.webp` still shows the inactive background Servo with amber eyes and
  a cyan chest indicator.
- `passage_b.webp` still uses an elongated humanoid rear hero with off-model
  limbs/hand anatomy.
- The bound wolf/cheetah still lack authored floor-anchored breathing strips.

Panel corrections must be masked local edits at original dimensions, preserving
camera, lighting, props and unrelated pixels. Do not wire the previous
full-frame `m_down` candidate automatically.

## Implemented, tested, integrated and deployed

| Category | October 31 status |
|---|---|
| Implemented production changes | Sage gait, once-only quest pay, Gravehorn boss-purple procedural eye |
| Implemented canon/review changes | Alpha optional script correction; Gravehorn art brief correction; fail-closed audit safeguards retained |
| Tested | build/package; 196 harness accounting; 31 source passes; start/end identity; integrity; 10 audit units |
| Visually inspected | retained gameplay-size Gravehorn captures and three shipped panels |
| Fresh staged browser evidence | none; 165 harnesses blocked before launch |
| Uninterrupted campaign | none |
| Integrated into `main` | no |
| Deployed | no |

## Blockers and unverified scope

- Chromium absent; Playwright downloads are 0 MiB/truncated.
- No fresh rendered Sage, Gravehorn, tutorial, text, film or VFX result.
- No October 31 uninterrupted clean-save campaign.
- No physical touch/controller/remap test.
- No low/mid/high physical-device performance, memory or thermal profile.
- No fresh audio playback/fade validation.
- No complete forty-page parity certificate.
- Approved asset generation was intentionally skipped.

## Release recommendation

Keep production on hold. Claude should selectively integrate the four bounded
fixes and audit safeguards onto a new integration branch, obtain a working pinned
Chromium, run the affected staged harnesses, then fix held input and Gravehorn
mechanics before attempting a clean campaign to B1. Source contracts, blocked
harnesses, viewport emulation, checkpoint diagnostics and retained still frames
are not substitutes for gameplay acceptance.

