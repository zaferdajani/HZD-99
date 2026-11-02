# CLAWBYTE senior studio review — 2026-11-02

## Executive verdict

**HOLD production. Do not merge or deploy this review branch.**

`main`, `odyssey`, and `claude/clawbyte-repo-migration-byhyl8` are still the
same production commit, `7da3c87e6b43a2357a2f52080814ae1d6adad618`. The
November 1 review was not integrated. This review therefore begins from fresh
`main` and selectively carries only the previously verified bounded changes:

1. a rescued Sage uses the purified walk strip while moving and the purified
   rest plate only while stopped;
2. quest payment is internally once-only when a completion callback repeats;
3. Gravehorn's infected eye core/halo uses boss purple while red hazards remain
   a separate visual language;
4. story authority identifies Alpha as an optional post-Purifier depth branch;
5. the evidence collector fails closed on unavailable browsers, preserves raw
   bytes, validates served-build identity, and now waits for a closed log to
   remain quiet before snapshotting it.

The final full collector accounted for all **196 gameplay harnesses**. The
**31 non-browser source/state harnesses passed**; **165 browser-dependent
harnesses were blocked before launch** because no executable Chromium exists.
Build, packaging, start/end server identity, and retained log integrity passed.
The collector correctly reports overall failure because blocked tests are not
gameplay passes.

Three earlier November 2 executions exposed late writes to
`tutorial-controller.log`, `voice-handoff.log`, and `credits.log`. Each invalid
run is retained separately. None was rewritten or promoted. A small collector
fix waits for a stable size and modification time before snapshotting. Its
delayed-writer regression and ten existing audit regressions pass; the final
execution has zero integrity mismatches.

No fresh staged-browser run, uninterrupted real-input chapter-one campaign,
or physical-device check is claimed. No raster, animation, manhwa, audio, or
cinematic asset was regenerated.

## Repository and comparison

| Item | Evidence |
|---|---|
| Previous report | `codex/studio-review-2026-11-01@ef90cfa` |
| Production base | `main@7da3c87e6b43a2357a2f52080814ae1d6adad618` |
| Integration refs | `odyssey` and `claude/clawbyte-repo-migration-byhyl8`, both `7da3c87` |
| Production delta since prior report | none |
| Review branch | `codex/studio-review-2026-11-02` |
| Audited source commit | `06474d103108fa799e1d0c8a8501bbbe6692028d` |
| Built `index.html` SHA-256 | `823137a95b8e76b7cff7f37d310d5315001097a31cfb95c355999e203ff4693a` |
| Production action | none; review branch only |

The previous review tree was not merged wholesale. Prior evidence was not
copied. The carried source and audit changes are isolated and reverified.

## Evidence classes used

1. **Source/state contract** evaluates logic or metadata without a browser.
2. **Staged browser harness** may inject a room, save, entity, inventory,
   position, or progress state.
3. **Uninterrupted real-input campaign** starts with cleared storage and uses
   ordinary player input only; `campaign-ch1` is the current certificate.
4. **Checkpoint diagnostic** starts from a game-written save and cannot replace
   a full campaign certificate.
5. **Gameplay-size inspection** evaluates a still at native/gameplay scale; it
   does not establish animation, input, audio, or performance.
6. **Physical-device evidence** covers real touch/controller behavior, frame
   time, memory, thermals, haptics, audio, and interruption recovery.

## Execution and evidence integrity

| Command/check | Result |
|---|---|
| `git fetch --all --prune` | pass; production and active integration refs unchanged |
| `npm ci` | pass; 160 packages installed |
| browser inventory | blocked; no Chromium/Chrome executable |
| Playwright Chromium installation | exit 1; five 0 MiB invalid/truncated ZIP downloads |
| `python -m unittest tools.studio.test_audit -v` | pass, 11/11 |
| four bounded source contracts | pass: Sage walk, payment, Gravehorn eye, Alpha optionality |
| edited JavaScript syntax | pass |
| `node build.cjs` | pass; four targets |
| `node tools/pack-www.cjs` | pass; 694 assets (244.3 MB), two pages (8.2 MB), total 252.5 MB |
| collector run 1 | integrity fail; late write to `tutorial-controller.log`; retained separately |
| collector run 2 | integrity fail; late write to `voice-handoff.log`; retained separately |
| collector run 3 | integrity fail; late write to `credits.log`; retained separately |
| collector run 4 | expected overall red; scope complete, identity/integrity pass, browsers blocked |

Final execution facts:

- 196/196 requested gameplay harnesses accounted for.
- 31 source/non-browser harnesses passed.
- 165 browser harnesses blocked before launch.
- Four other task passes: build, package, and served identity at start and end.
- 200 result entries: 35 pass and 165 blocked.
- Every recorded `log_quiet` check passed.
- Raw/snapshot integrity passed with zero mismatches.
- Overall `passed` remains false because blocked scope is not a pass.

Passing harnesses:

`combat-impact-contract`, `repair-lifecycle`, `quest-payment-contract`,
`story-opening`, `script-route`, `alpha-optional-contract`, `scratch-reach`,
`hero-feedback`, `tutorial-controller`, `offline-release`, `sage-specials`,
`tutorial-clarity`, `story-progression`, `input-focus`, `voice-handoff`,
`desktop-protocol`, `cave-ground`, `seam-route`, `shadow-ground`,
`dialogue-audio`, `weapons`, `gear`, `motion-sampling`, `combo-routing`,
`credits`, `tails`, `gravehorn-eye-contract`, `grapple-contract`,
`reel-contract`, `campaign-contract`, and `sage-walk-contract`.

These establish contracts, not rendered gameplay.

## Fifteen senior-role verdicts

| # | Senior responsibility | Verdict | Evidence boundary |
|---|---|---|---|
| 1 | Senior Cinematic Designer | HOLD P1/P2 | Draft 3 has 40 pages but only 32 revised images and no literal 40-row rendered parity ledger. |
| 2 | Senior Game Designer — Player Systems | HOLD P1 | Applicable real-input evidence still shows held charge and mandatory heal failure. |
| 3 | Senior Mission Designer — Quest Craft | source FIXED / journey HOLD | Payment and Alpha authority are corrected; optional loops lack natural journey proof. |
| 4 | Principal Encounter Designer | HOLD P1 | Source topology is coherent; Gravehorn reliability and ordinary encounter/return are uncertified. |
| 5 | Senior Boss Designer | HOLD P1/P2 | Purifier/NULLFANG gates are coherent; Gravehorn art/mechanics and four current ritual films remain open. |
| 6 | Senior Mission Designer — Campaign | source FIXED / campaign HOLD | Alpha is optional in source; no clean campaign reaches B1 or proves the skip route. |
| 7 | Senior Mission Producer | HOLD | Branch isolation and evidence controls pass; browser, campaign, and device gates remain red. |
| 8 | Senior Character Artist | HOLD P1/P2 | Preserve approved hero/Alpha; Gravehorn, beast recovery and Sage strip cleanup remain below target. |
| 9 | Senior Cinematic Director | HOLD P1/P2 | No complete 40-page certification, four `gh_*` intercuts, or four current guardian ritual films. |
| 10 | Senior VFX Artist | source FIXED / rendered HOLD | Shared trails are bounded and Gravehorn now purple in source; full rendered roster/device proof is absent. |
| 11 | Senior Technical Director — World Systems | source PASS / performance HOLD | Route contracts pass; historical crossing/bake spikes and timeouts lack fresh browser evidence. |
| 12 | Senior Gameplay Engineer — Combat | source PASS / real-input HOLD P1 | Thresholds are plausible; held input, gait invariance and Gravehorn transitions are uncertified. |
| 13 | Senior Gameplay Engineer — Mission | source FIXED / campaign HOLD | Payout and optionality are locked; natural acquisition, recovery and B1 remain open. |
| 14 | Senior Gameplay Engineer — NPC | source FIXED / rendered HOLD | Moving rescued Sage now selects gait; natural purify→walk→reload proof is blocked. |
| 15 | Lead UI Engineer | source PASS / rendered HOLD | Reveal/tutorial logic is plausible; queue bounds, five-language render and physical input remain open. |

## Verified bounded fixes on this branch

### `NPC-SAGE-WALK-31`

Sage is included in the walker distance clock. A moving purified Sage selects
`sageWalk8` with purified material; a stopped Sage returns to `sagePure`.
Source contract, syntax, builds and package pass. Rendered acceptance remains a
natural purification→walk two body widths→stop/turn→leave/re-enter→reload run
with planted feet and no hostile regression.

### `QUEST-IDEMPOTENCY-31`

`questPay()` rejects missing or completed quests and returns an explicit
boolean. The contract proves that the second completion leaves serialized save,
inventory, scrap, IQ, relic state, persistence calls, cue and burst unchanged.

### `GH-EYE-CLASS-31`

Gravehorn's infection core/halo is boss purple `#ba5cff` and uses the current
`infEyeMark` anchor. Missile nozzles, cracks and telegraphs remain separate.
Source contract and build pass; a rendered state/facing sweep is blocked.

### `ALPHA-DOC-31`

The living story and cave authority now agree with runtime: Alpha is an
optional A2 depth-door branch after the Purifier. A2→A3→A4 and B1 never require
Alpha. The optionality contract passes.

### `AUDIT-QUIET-02`

The collector waits for each closed log to maintain a stable size and
modification time before snapshotting. Failure to become quiet fails the task
rather than blessing incomplete bytes. A delayed closed-log writer regression
proves the final bytes are captured. All 11 audit tests pass. This supplements,
not replaces, browser preflight, owned-descendant cleanup, same-byte snapshots,
end-of-run integrity, and start/end served identity.

## P1 and P2 findings

### `INPUT-HOLD-01` — P1

The latest applicable real-input run still shows a normal tap working while a
950 ms held attack fails to reach the 0.6 s charge and the required 0.85 s heal
stalls at 99 volts and 6/7 cores. No production delta changes ownership or
lifetime of raw held input.

Acceptance: three clean real-event runs for keyboard, touch, and controller,
covering tap, 950 ms hold, release, blur/cancel, charged contact and cost, exact
heal duration/deduction, one restored core, one lesson advance and reload.
Do not lower thresholds or auto-complete the lesson.

### `GH-MECH-01` / `GH-ART-01` — P1

The source state chain is substantial but has no fresh rendered proof for name
card, horn fire/return, charge, jump, parry, recovery, rear kick, phase two,
defeat dialogue, retreat, once-only reward, death or retry. The existing
gameplay capture shows a pale translucent procedural animal beside the polished
hero. There is no authored Gravehorn rig and no `gh_intro_a`, `gh_intro_b`,
`gh_phase2`, or `gh_down` intercut asset.

Acceptance: identity-locked gunmetal/bronze rig with both facings, planted
hooves, full joint overdraw, separate horns/sockets, phase separation and
retreat; four intercuts at real beats; three consecutive mechanics runs; and
ordinary-input CV1B→CV3 win/death/retry.

### `COMBAT-GAIT-01` — P1/P2

Historical rendered evidence found equal traveled distance changing 39 pixels
when only wall-clock time changed. Locomotion still receives time and distance
inputs. Equal state/distance/direction/velocity must render identical pixels at
30/60/120 Hz while idle, airborne and telegraph motion retains its own clocks.

### `CAMPAIGN-B1-01` — P1

No fresh cleared-storage ordinary-input campaign reaches B1. Required proof is
one full run with no injected flag, item, save, position, progress, room or
teleport state, then a second mandatory run explicitly skipping Alpha.

### `MANHWA-PARITY-01` — P1

Draft 3 specifies 40 pages; the revised game folder holds 32 images and no
complete page is certified. Require one literal row per page with cast,
equipment/props, exact action, VFX, audio, trigger, gameplay capture and owner
verdict. Source presence and event IDs are not parity.

### `CAVE-JOURNEY-01` — P2

Topology and intended reward contracts pass, but meaningful play remains
uncertified. Each optional cave must prove ordinary-input offer→landmark→action
→distinct reward→visible consequence→return/reload.

### `RITUAL-IDENTITY-01` — P2

Only Glitch/NULLFANG has a current-contract purification film. Brood, Atlas,
Zero and Prism still need identity films with earned hero/sword, white gather,
one slash, black-red extraction, neutralization, the same guardian restored,
skip/retry/atomic save, and smooth picture plus audible music fade.

### `EYE-VFX-01` — source pass / rendered hold

Shared implementation defines red for ordinary infection and purple for bosses,
Sages and Alpha; current-frame transformed anchors; body-travel world-space
emission; fixed simulation; 1.125–1.875 s lifetime; caps 90/170/260/320;
discontinuity and cure/death/removal/teleport/room cleanup; duplicate
suppression; and reduced-motion glow only. Full pose/roster and physical-device
proof remain absent.

### `WORLD-PERF-01` — P1/P2

Applicable historical evidence records a 114 ms crossing against a 90 ms
budget and a 2,998 ms bake-ahead frame; `terrainrun` and `bosspace` timed out.
Profile three runs and split/prewarm work rather than raising budgets.

### `UI-QUEUE-01` / `UI-LOCALE-01` — P2

`OVERLAY_Q` and toasts are unbounded/undeduplicated. Scene captions can discard
the oldest unread item after three. English, Arabic, Turkish, Chinese and
Russian lack current desktop/phone captures proving glyph coverage, wrap,
kinsoku, RTL shaping, reveal, debounce and reduced motion.

## Cave census

| Area | Intended meaning | Current evidence |
|---|---|---|
| A5 | cracked floor, Mind Node, Magnet crest, quarry history | source/history only; current browser blocked |
| A7 | survey and once-only Ratchet payment | fresh payment contract; natural loop open |
| CV1 | bound crawler and max-core chest | source/staged history |
| CV1B | survey pod, chart, shortcut, rest/respawn | historical journey/checkpoint only |
| CV2 | Deaf System/beacon and quarry route | checkpoint diagnostic only |
| CV3 | Gravehorn, raw marble, changed return route | source only; encounter blocked |
| GA1T/GA1/GA1D | refuge, bench, first Sage, network rescue | Sage source-fixed; rendered recovery blocked |
| A11 | secret coin | source/staged history |
| A12 | dash-return challenge and star relic | source/staged history |
| A13 | Servo/Warden history and coin | source/staged history |
| A10/GA2/GA2T/GA2D | optional Alpha, pack, Warden ledger, Pack Sage | optional contract pass; natural loop open |

## Story/manhwa flow

| Beat | Best evidence | Open gap |
|---|---|---|
| Wake/bay/gate | source contracts and historical journey | current direction, acting and physical touch |
| Letter/drawer/repair | repair lifecycle source pass; historical journey | rendered hand/socket continuity |
| Ratchet explanation | source/history | pendant and removed-battery acting |
| Pod/Volt Pack | source/history | held-heal completion and device proof |
| Memory Node | source/staged | real miss/retry/success and touch |
| Cave/Gravehorn/raw marble | source/staged/checkpoint | encounter reliability and natural return |
| Forge | source/staged | natural hand/tool/material contact |
| Passage/Meadow Sage | source; gait fixed | uninterrupted rescue/friendly recovery |
| CHIME/NULLFANG | source/staged history | clean journey and casing/cable acting |
| Purification | staged logic; Glitch film current | four identity films and device/audio proof |
| B1 teaser | historical | fresh uninterrupted completion |

## Gameplay-size visual inspection

The following retained/native assets were reopened at gameplay or original
scale on November 2:

- `docs/studio/runs/2026-10-11/images/gravehorn-intro.png`: Gravehorn remains a
  pale translucent flat procedural form beside the finished painted hero. Its
  retained capture also has a red core; the source purple fix is not a rendered
  certificate.
- `assets/manhua/ch1/game/m_down.webp`: the finished NULLFANG panel bakes red/
  pink boss eyes instead of the purple boss class.
- `assets/manhua/ch1/game/r_cell.webp`: the supposedly inactive background
  Servo still has amber eyes and a cyan chest indicator.
- `assets/manhua/ch1/game/passage_b.webp`: the rear hero is tall and humanoid,
  with elongated limbs instead of the established compact body.
- `assets/characters/beasts/wolf_crouch4.webp`: four near-identical crouches,
  not a floor-anchored down/breathe/recover strip.
- `assets/characters/sage/walk8.webp`: usable eight-cell upright gait with
  visible grey rectangular matte/backdrop remnants around cells.

Any panel correction must be a masked local edit at original dimensions and
preserve framing, light, props and unrelated pixels. None was edited here.

## Status ledger

| Category | November 2 status |
|---|---|
| Implemented game source | Sage gait, once-only quest payment, Gravehorn boss-purple source eye |
| Implemented authority/review | optional Alpha wording, Gravehorn brief, collector quiet-window safeguard |
| Tested | four builds, package, 196-harness accounting, 31 contracts, 11 audit units, identity and final integrity |
| Visually inspected | retained Gravehorn capture, three manhwa panels, wolf and Sage strips |
| Fresh staged browser | none; 165 harnesses blocked before launch |
| Uninterrupted campaign | none |
| Physical device | none |
| Integrated to `main` | no |
| Deployed | no |

## Blockers and release recommendation

- Chromium/Chrome is absent; the attempted download produced invalid archives.
- No fresh rendered Sage, Gravehorn, tutorial, text, film or eye-trail proof.
- No clean real-input campaign or mandatory Alpha-skip campaign.
- No physical touch/controller/remap, performance, memory, thermal, haptic or
  audio-fade test.
- No complete 40-page manhwa parity certificate.
- Approved art generation was intentionally skipped.

Keep production on hold. Selectively integrate this branch onto a new
integration branch, obtain a pinned executable Chromium, verify the bounded
fixes in rendered gameplay, then fix held input and diagnose Gravehorn's first
failing transition before attempting the clean B1 campaign. Never promote a
source contract, staged state, blocked harness, checkpoint diagnostic, retained
still or emulated viewport as uninterrupted gameplay evidence.
