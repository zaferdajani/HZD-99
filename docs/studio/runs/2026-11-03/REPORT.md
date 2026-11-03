# CLAWBYTE senior studio review — 2026-11-03

## Executive verdict

**HOLD production. Do not merge or deploy this review branch.**

Production did not move. `main`, `odyssey`, and the authorized integration ref
`claude/clawbyte-repo-migration-byhyl8` remain identical at
`7da3c87e6b43a2357a2f52080814ae1d6adad618`. The November 2 branch was not
integrated, so this branch starts from fresh `main` and selectively carries the
previously verified fixes rather than replacing production with an old tree.

Two newer Claude side branches were examined:

- `claude/perf@55b4d2697424b4271ccf62c83a68d24058c0e45b` contains one
  bounded gameplay-adjacent improvement: a 15-second pack JSON timeout.
- `claude/appstore-compliance@4968f0e0b45073597a2df23f958238e5b9e49896`
  contains useful scaffolding but placeholder legal text, an invalid support
  address, no installed Capacitor Browser plugin, and no native navigation
  evidence. It was not carried.

Verified source changes on this review branch:

1. rescued Sage movement uses the purified walk strip and returns to the
   purified rest plate only when stopped;
2. shared quest payment is internally once-only;
3. Alpha remains an optional post-Purifier branch in living story authority;
4. Gravehorn's infection eye class is boss purple in the live body, halo,
   dark-intro silhouette and dialogue portrait, while red hazards remain
   distinct;
5. stalled campaign-pack headers or JSON bodies abort after 15 seconds and
   release a queued Start through the existing failure path; and
6. fail-closed browser classification, log snapshots, writer cleanup, quiet
   checks, final integrity and served-build identity remain in the collector.

The final full collector accounted for **197/197 gameplay harnesses**:
**32 source/non-browser harnesses passed** and **165 browser-dependent
harnesses were blocked before launch** because no executable Chromium exists.
Build, package, start identity and end identity also passed, for **201 result
entries: 36 pass, 165 blocked**. Overall remains red because blocked is not
passed.

The first November 3 execution detected `reel-contract.log` changing after its
snapshot and failed integrity. It is retained separately under
`automated-integrity-fail/`; it was not rewritten or promoted. A separate rerun
completed with zero raw/snapshot mismatches.

No fresh staged-browser run, uninterrupted real-input chapter-one campaign, or
physical-device result is claimed. No raster, animation, manhwa, audio or video
asset was generated or altered.

## Repository and ancestry

| Item | Evidence |
|---|---|
| Previous review | `codex/studio-review-2026-11-02@16560b476e4abf49ad671b7137905ba1e39949fd` |
| Production base | `main@7da3c87e6b43a2357a2f52080814ae1d6adad618` |
| Authorized integration | `claude/clawbyte-repo-migration-byhyl8@7da3c87` |
| Mirror | `odyssey@7da3c87` |
| New side refs inspected | `claude/perf@55b4d269`; `claude/appstore-compliance@4968f0e` |
| Review branch | `codex/studio-review-2026-11-03` |
| Local audited source | `f53155943857ef316de7ab00b1c430ace78808ac` |
| Published source commit | `6f6fefe665107aa44a3fb2b3ce6752dc070bc8f8` |
| Audited/published source tree | `b0dd98abc733b6cd14b7c20ba15cabb40a6f9523` |
| Built `index.html` SHA-256 | `3d8093fdbbf17fe981ed344812129d9f780504f54f27457c2aea88ddd9b16ea9` |
| BUILD_ID | `e58f8841e5c9` |
| Production action | none; review branch only |

The published source commit is a real remote ancestor of the evidence/report
commit. This corrects a November 2 provenance weakness: its named local source
commits were flattened remotely into `16560b4`; the bytes exist, but those
local commit objects are not remotely reproducible.

Comparison correction: the November 2 first retained failed execution contains
three mismatches (`tutorial-controller.log`, `voice-handoff.log`, and
`credits.log`), not only the first name used in that report's summary. The
underlying retained evidence was not changed.

## Evidence classes

1. **Source/state contract:** no rendered browser.
2. **Staged browser harness:** may inject room, save, entity, inventory,
   position or progress state.
3. **Uninterrupted real-input campaign:** cleared storage and ordinary player
   input only; `campaign-ch1` is the current fail-closed certificate.
4. **Checkpoint diagnostic:** starts from a game-written save and cannot replace
   the full campaign.
5. **Gameplay-size inspection:** establishes visual facts in a still, not
   motion, input, audio or performance.
6. **Physical-device evidence:** real touch/controller, frame time, memory,
   thermals, haptics, audio and interruption recovery.

## Commands and results

| Command/check | Result |
|---|---|
| clone/fetch and ref pin | pass; production and authorized integration unchanged |
| `npm ci` | pass; 160 packages |
| browser inventory | blocked; no Chrome/Chromium executable |
| Playwright Chromium install | exit 1; five 0 MiB invalid/truncated ZIPs |
| `python -m unittest tools.studio.test_audit -v` | pass, 11/11 |
| `node tests/pack-timeout.cjs` | pass; stalled headers and body release Start and clear timer |
| payment, Alpha, Gravehorn eye and Sage contracts | pass, 4/4 |
| edited JavaScript syntax | pass |
| `node build.cjs` | pass; four targets |
| `node tools/pack-www.cjs` | pass; 694 assets (244.3 MB), two pages (8.2 MB), total 252.5 MB |
| first full collector | integrity fail; `reel-contract.log` changed; retained separately |
| second full collector | expected overall red; complete scope, identity and integrity pass, browser scope blocked |
| `git diff --check` | pass |

Final collector facts:

- requested harnesses: 197/197 accounted for;
- gameplay/source harnesses: 32 passed;
- browser-dependent harnesses: 165 blocked before launch;
- build, package, identity at start and identity at end: four additional passes;
- final log integrity: pass, zero mismatches;
- result: 36 pass, 165 blocked, overall false.

Passing harnesses:

`pack-timeout`, `combat-impact-contract`, `repair-lifecycle`,
`quest-payment-contract`, `story-opening`, `script-route`,
`alpha-optional-contract`, `scratch-reach`, `hero-feedback`,
`tutorial-controller`, `offline-release`, `sage-specials`,
`tutorial-clarity`, `story-progression`, `input-focus`, `voice-handoff`,
`desktop-protocol`, `cave-ground`, `seam-route`, `shadow-ground`,
`dialogue-audio`, `weapons`, `gear`, `motion-sampling`, `combo-routing`,
`credits`, `tails`, `gravehorn-eye-contract`, `grapple-contract`,
`reel-contract`, `campaign-contract`, and `sage-walk-contract`.

These are source/state contracts, not rendered gameplay.

## Fifteen senior-role verdicts

| # | Senior responsibility | Verdict | Evidence boundary |
|---|---|---|---|
| 1 | Senior Cinematic Designer | HOLD P1/P2 | Forty Draft 3 pages still lack a literal 40-row rendered parity ledger and skip/phone proof. |
| 2 | Senior Game Designer — Player Systems | HOLD P1 | Historical real input still shows held charge/heal failure; no production delta addresses it. |
| 3 | Senior Mission Designer — Quest Craft | source FIXED / journey HOLD | Payment and Alpha authority are corrected here; optional loops lack natural-player proof. |
| 4 | Principal Encounter Designer | HOLD P1/P2 | Cave topology is coherent; Gravehorn execution and natural cave journeys remain uncertified. |
| 5 | Senior Boss Designer | HOLD P1/P2 | Gates are coherent; Gravehorn art/mechanics and four current ritual films remain open. |
| 6 | Senior Mission Designer — Campaign | source FIXED / campaign HOLD | Alpha authority is corrected; no clean B1 campaign or explicit mandatory skip run exists. |
| 7 | Senior Mission Producer | HOLD | Branch ancestry, identity and final integrity pass; browser/campaign/device gates remain red. |
| 8 | Senior Character Artist | HOLD P1/P2 | Preserve hero/Alpha; Gravehorn, beast recovery and Sage matte cleanup remain below target. |
| 9 | Senior Cinematic Director | HOLD P1/P2 | Forty-page parity, four Gravehorn intercuts and four current ritual films are incomplete. |
| 10 | Senior VFX Artist | source FIXED / rendered HOLD | Finite shared trails are coherent; complete rendered pose/device certification is absent. |
| 11 | Senior Technical Director — World Systems | source PASS / performance HOLD | Pack startup is bounded; room crossing/bake spikes remain untested in browser. |
| 12 | Senior Gameplay Engineer — Combat | source PASS / real-input HOLD P1 | Thresholds are plausible; held input, gait invariance and Gravehorn transitions remain uncertified. |
| 13 | Senior Gameplay Engineer — Mission | source FIXED / campaign HOLD | Payment/optionality pass contracts; natural recovery and B1 remain open. |
| 14 | Senior Gameplay Engineer — NPC | source FIXED / rendered HOLD | Sage gait is wired; Ratchet/Servo/Sage natural return/reload remains blocked. |
| 15 | Lead UI Engineer | source PASS / rendered HOLD | Tutorial/reveal logic is credible; queues, locales and physical controls are uncertified. |

## Verified bounded fixes

### `PACK-TIMEOUT-03` — new November 3 fix

`js/packs.js` now bounds both response headers and JSON body with a 15-second
`AbortController`. A stalled request releases queued Start through the existing
error path and clears its timer. The isolated regression, syntax, four builds,
package and full source collector pass.

Still required: browser/native happy path, abort path, save isolation and bench
behavior. This fix is not evidence for room frame time or device performance.

### `GH-EYE-CLASS-31` — extended November 3

Gravehorn's live core/halo, dark-intro eye and dialogue portrait now use
`GHC.eye` (`#ba5cff`). Hazard stripes, missile nozzles, molten cracks and name
card danger red remain distinct. The source contract now locks both additional
eye states. Rendered all-state/facing proof is blocked.

### Retained verified fixes

- `NPC-SAGE-WALK-31`: moving rescued Sage uses distance-driven `sageWalk8` with
  purified material; stopped Sage uses `sagePure`.
- `QUEST-IDEMPOTENCY-31`: missing/already-done payments return false; the first
  valid callback pays and persists once.
- `ALPHA-DOC-31`: living story authority agrees that Alpha is optional after
  the Purifier and never gates A2→A3→A4 or B1.
- `AUDIT-INTEGRITY-31/02`: browser preflight, descendant cleanup, same-byte
  snapshots, quiet-window capture, delayed-writer regression, end validation
  and served identity remain fail closed.

## Priority findings

### `INPUT-HOLD-01` — P1, open

Applicable real-input evidence remains: tap attack works, but a 950 ms attack
hold did not reach the 0.6 s charge and mandatory 0.85 s heal stalled at 99
volts and 6/7 cores. Source thresholds look correct, so diagnose raw down-state
ownership through keyboard, touch and controller; do not lower thresholds or
auto-complete the lesson.

Acceptance: three clean real-event runs per input family covering tap, hold,
release, blur/cancel, charged contact/cost, exact heal deduction, one restored
core, one lesson advance and reload.

### `GH-MECH-01` / `GH-ART-01` — P1, open

The state machine contains horn launch/return, charge, jump, toss/parry,
recoveries, rear kick, phase two, defeat dialogue and retreat, but has no fresh
browser trace. The retained gameplay capture still shows a pale translucent
procedural animal beside the finished hero. No authored Gravehorn rig or
`gh_intro_a`, `gh_intro_b`, `gh_phase2`, `gh_down` assets exist.

Acceptance: identity-locked gunmetal/bronze rig, both facings, planted hooves,
complete overdraw, separate horn sockets/missiles, phase separation and retreat;
four intercuts at real beats; three consecutive mechanics passes; ordinary-input
CV1B→CV2→CV3 win/death/retry; once-only `bossHorn`.

### `COMBAT-GAIT-01` — P1/P2, open

Historical rendering found a 39-pixel change for equal traveled distance when
only time changed. Equal state, distance, direction and velocity must render
identically at 30/60/120 Hz while idle, airborne, turn and telegraph motion stay
animated.

### `CAMPAIGN-B1-01` — P1, open

No fresh cleared-storage ordinary-input campaign reaches B1. Require the full
wake→letter→battery→Ratchet→Volt Pack/heal→marble caves→Gravehorn→raw marble→
return→forge→Sage→CHIME→NULLFANG purification→B1 route without injected state,
plus a second mandatory run explicitly skipping Alpha.

### `MANHWA-PARITY-01` — P1, open

Draft 3 contains 40 pages; the revised folder contains 32 images and the parity
audit certifies no complete page. Require 40 rows with cast, equipment/props,
exact action, room/runtime keys, VFX/audio, trigger, gameplay-size capture and
owner verdict. Flattened panels and source presence are not gameplay parity.

### `CAVE-JOURNEY-01` — P2, open

Source topology and intended rewards pass, but each optional loop still needs
ordinary-input offer→landmark→action→distinct reward→visible consequence→
return/reload proof.

### `RITUAL-IDENTITY-01` — P2, open

Glitch/NULLFANG's 13.25 s 1280×720 ritual visibly contains the hero, earned
sword, white gather, black-red extraction, golden lion and peaceful finish;
preserve it. Brood, Atlas, Zero and Prism are legacy 960×540 guardian-only
transformations and do not meet the current choreography. Create only those
four missing films, with smooth picture and audible music fade.

### `EYE-VFX-01` — source pass / rendered hold

The shared system defines red ordinary infection; purple bosses, Sages and
Alpha; transformed current-frame anchors; movement-only world-space emission;
fixed simulation; 1.125–1.875 s lifetime; caps 90/170/260/320; >90 px
discontinuity clear; cure/death/removal/teleport/room cleanup; duplicate
suppression; and reduced-motion glow only. No indefinite trail is present in
source. Full roster/pose and low/mid/high device proof remain absent.

### `WORLD-PERF-01` — P1/P2, open

The pack timeout does not address historical 114 ms doorway crossing, 2,998 ms
bake-ahead frame, or `terrainrun`/`bosspace` timeouts. Profile three times and
split/prewarm work; do not raise budgets.

### `UI-QUEUE-01` / `UI-LOCALE-01` — P2, open

Overlay and toast queues are unbounded/undeduplicated; scene captions can evict
an unread oldest item. English, Arabic, Turkish, Chinese and Russian lack fresh
desktop/phone rendering proof for glyphs, wrap, kinsoku, RTL, reveal/debounce
and reduced motion. Mobile viewport emulation is not physical touch.

### `APP-LEGAL-UI-03` — side branch not carried

The App Store branch adds a five-language Pause row and four packaged pages,
but the pages identify themselves as placeholders, use
`support@OWNER-TO-FILL-IN.example`, remain English-only, prefer a Capacitor
Browser plugin not installed in `package.json`, and have no native return/focus
test. Integrate only after owner/legal content and iOS/Android validation.

## Cave census

| Area | Intended value | Current evidence |
|---|---|---|
| A5 | cracked floor, Mind Node, Magnet crest, quarry history | source/history; browser blocked |
| A7 | survey and once-only Ratchet payment | payment contract; natural loop open |
| CV1 | bound crawler and max-core chest | source/staged history |
| CV1B | survey pod, chart, shortcut, rest/respawn | historical checkpoint only |
| CV2 | Deaf System/beacon and quarry route | checkpoint diagnostic only |
| CV3 | Gravehorn, raw marble, changed return | source only; encounter blocked |
| GA1T/GA1/GA1D | refuge, bench, first Sage, network rescue | Sage source fixed; rendered recovery blocked |
| A11 | secret coin | source/staged history |
| A12 | dash-return challenge and star relic | source/staged history |
| A13 | Servo/Warden history and coin | source/staged history |
| A10/GA2/GA2T/GA2D | optional Alpha, friendly pack, ledger, Pack Sage | optional contract; natural loop open |

## Story/manhwa flow matrix

| Beat | Best evidence | Open acceptance gap |
|---|---|---|
| Wake/bay/gate | source contracts and historical journey | current direction/acting/physical touch |
| Letter/drawer/repair | repair lifecycle source; historical journey | rendered hand/socket continuity |
| Ratchet explanation | source/history | pendant and removed-cell acting |
| Pod/Volt Pack | source/history | held-heal completion/device proof |
| Memory Node | source/staged history | real miss/retry/success/touch |
| Cave/Gravehorn/raw marble | source/staged/checkpoint | reliable encounter and natural return |
| Forge | source/staged | natural hand/tool/material contact |
| Passage/Meadow Sage | source; gait fixed | uninterrupted rescue/friendly recovery |
| CHIME/NULLFANG | source/staged history | clean journey and casing/cable acting |
| Purification | staged logic; Glitch film current | four identity films and device/audio proof |
| B1 teaser | historical | fresh uninterrupted completion |

## Gameplay-size visual inspection

Six retained/native assets were reopened on November 3:

- `docs/studio/runs/2026-10-11/images/gravehorn-intro.png`: pale translucent
  procedural Gravehorn remains far below the painted hero; the retained frame
  has a red eye and is not proof of today's source-purple fix.
- `assets/manhua/ch1/game/m_down.webp`: NULLFANG's baked boss eyes remain red/
  pink instead of the purple boss class.
- `assets/manhua/ch1/game/r_cell.webp`: supposedly inactive background Servo has
  amber eyes and cyan chest light.
- `assets/manhua/ch1/game/passage_b.webp`: rear hero is tall, humanoid and
  elongated rather than the established compact body.
- `assets/characters/beasts/wolf_crouch4.webp`: four near-identical crouches,
  not a floor-anchored down/breathe/recover sequence.
- `assets/characters/sage/walk8.webp`: useful eight-cell gait with visible grey
  rectangular matte/backdrop remnants.

Use masked local panel corrections at original dimensions. Preserve framing,
light, props, approved hero/Alpha/NULLFANG identity and unrelated pixels.

## Status ledger

| Category | November 3 status |
|---|---|
| Implemented source | Sage gait; once-only payout; optional Alpha; all Gravehorn infection-eye contexts; pack timeout |
| Tested | four builds; package; 197 harness accounting; 32 contracts; 11 audit units; identity; final integrity |
| Visually inspected | Gravehorn capture, three panels, wolf strip, Sage strip; ritual media reviewed separately |
| Fresh staged browser | none; 165 blocked before launch |
| Uninterrupted campaign | none |
| Physical device | none |
| Integrated into `main` | no |
| Deployed | no |

## Blockers and recommendation

- Chromium is absent and Playwright received five invalid 0 MiB archives.
- No rendered Sage, Gravehorn, tutorial, localization, ritual or eye-trail proof.
- No clean B1 campaign or explicit mandatory Alpha-skip run.
- No physical touch/controller/remap, performance, memory, thermal, haptic or
  audio-fade evidence.
- No complete 40-page parity certificate.
- Approved completed assets were intentionally not regenerated.

Keep production on hold. Claude should selectively integrate the published
source ancestor onto a new integration branch, obtain pinned Chromium, verify
the bounded fixes, then repair held input and the first observed Gravehorn
transition before the clean campaigns. Never promote blocked, source-only,
staged, checkpoint, still-image or emulated-viewport evidence into an
uninterrupted gameplay claim.
