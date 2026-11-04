# CLAWBYTE senior studio review — 2026-11-04

## Executive verdict

**HOLD production. Do not merge or deploy this review branch.**

Production did not move. `main`, `odyssey`, and the authorized integration ref
`claude/clawbyte-repo-migration-byhyl8` remain identical at
`7da3c87e6b43a2357a2f52080814ae1d6adad618`. No side branch newer than the two
already reviewed on November 3 was found. This branch starts from fresh `main`,
selectively carries the previously verified November 3 source fixes, and adds
only bounded authority/test/audit corrections. It does not merge or deploy.

The final exact-commit collector accounted for **201 result entries: 36 pass,
165 blocked**. The 36 passes are build, packaging, start/end served identity,
and 32 source/non-browser contracts. Every one of the 165 browser-dependent
checks was stopped before launch because no executable Chromium was available.
Blocked is not passed. There is therefore no fresh staged-browser certificate,
uninterrupted real-input chapter-one playthrough, or physical-device result.

The 15-role studio panel agrees on a production hold. The branch improves the
review baseline, but the experience is not studio-ready: Gravehorn is still a
procedural translucent stand-in; held charge/heal input and campaign-to-B1 are
not certified; 40-page manhwa parity is incomplete; optional cave journeys
lack natural-player proof; four current-contract purification films are
missing; and UI queues, translations, performance, motion, touch, haptics and
audio remain unverified in a live browser/device.

No raster, animation, audio, manhwa or video asset was regenerated or altered.
Completed hero, sword, crystal, Alpha/pack, NULLFANG and accepted ritual assets
were preserved.

## Repository, ancestry, and comparison

| Item | Evidence |
|---|---|
| Production base | `main@7da3c87e6b43a2357a2f52080814ae1d6adad618` |
| Authorized integration | `claude/clawbyte-repo-migration-byhyl8@7da3c87e6b43a2357a2f52080814ae1d6adad618` |
| Mirror | `odyssey@7da3c87e6b43a2357a2f52080814ae1d6adad618` |
| Previous review | `codex/studio-review-2026-11-03@7992f53275c5678d1c960b32e74fc79b99b7b1ca` |
| Side refs rechecked | `claude/perf@55b4d2697424b4271ccf62c83a68d24058c0e45b`; `claude/appstore-compliance@4968f0e0b45073597a2df23f958238e5b9e49896` |
| Review branch | `codex/studio-review-2026-11-04` |
| Exact audited source commit | `6382c87d4c99e580bd304e642929580b5adb5e31` |
| Published authored-source ancestor | `f0265a35e0b3b5987619638352c05625f947712c` |
| Built `index.html` SHA-256 | `67e73b89cb6a03ae21b1cf146d8a2eceb27e5f9b3870bbf982d7bd0c84146855` |
| Final evidence integrity SHA-256 | `a9902117fced37505c2e47578ad16a067b5d48e3cca563448631c898d74d69ec` |
| Production action | none; review branch only |

The published authored-source ancestor contains every reviewed source, test,
authority and audit change. The four generated multi-megabyte HTML bundles are
left at the production base in the remote commit because the authenticated
Git-data publisher cannot transfer blobs above its response cap; the final
audit rebuilt those bundles from the published source and records their exact
hashes. Integrators must run `node build.cjs` after selecting the source commit.
This limitation is explicit rather than presenting a remotely unreproducible
commit as the exact local audit object.

Compared with November 3, production has no new commit. The same two Claude
side branches remain the newest integration candidates; neither gained
production authority. The carried source tree retains the Sage gait, once-only
quest payment, optional Alpha authority, Gravehorn purple eye contexts,
15-second campaign-pack timeout, and fail-closed audit collector.

## Evidence classes and limits

1. **Source/state contract:** static or headless logic evidence; no rendered browser.
2. **Staged browser harness:** may inject room, save, entity, inventory, position or progress state.
3. **Uninterrupted real-input campaign:** cleared storage and ordinary player input only; `campaign-ch1` is the fail-closed certificate when runnable.
4. **Checkpoint diagnostic:** begins from a game-written save and never replaces the campaign certificate.
5. **Gameplay-size inspection:** a still establishes visible facts, not motion, timing, input, audio or performance.
6. **Physical-device evidence:** real touch/controller, frame time, memory, thermals, haptics, audio and interruption recovery.

The audit began with only its own evidence directory untracked; the named base
commit was clean and exact. Browser installation failed with five truncated or
zero-byte invalid ZIPs, so the collector used its configured missing-browser
preflight and classified all browser work as blocked.

## Commands and results

| Command/check | Result |
|---|---|
| fetch/ref comparison | pass; production/integration refs unchanged; no newer side branch |
| `npm ci` | pass; 160 packages |
| browser inventory | blocked; no Chrome/Chromium executable |
| Playwright Chromium install | exit 1; five invalid/truncated downloads |
| `python -m unittest tools.studio.test_audit -v` | pass, 12/12 |
| `python -m py_compile tools/studio/audit.py tools/studio/test_audit.py` | pass |
| Alpha, Gravehorn eye, payment, Sage gait and pack timeout contracts | pass, 5/5 |
| edited JavaScript syntax | pass |
| `node build.cjs` | pass; 4.71/3.49/4.73/3.51 MB targets |
| `node tools/pack-www.cjs` | pass; 694 assets (244.3 MB), two pages (8.2 MB), total 252.5 MB |
| final full collector | expected overall red; complete requested scope; 36 pass, 165 blocked |
| final log integrity | pass; 199 captured logs, zero disk/snapshot mismatches |
| served identity | pass at start and end; identical hashes |
| `git diff --check` | pass |

The final collector has `complete_requested_scope=true`, records base
`6382c87d`, and preserves all result bytes inside `results.json`. Its overall
`passed=false` is correct because browser scope is blocked.

Four earlier November 4 attempts are retained under
`automated-integrity-fail*`. They caught late detached writers changing one or
more captured logs. The cause was a nested PID-namespace mismatch: writers were
found through host `/proc` PIDs but killed using those host numbers inside the
container namespace. `namespace_pid()` now translates `NSpid` consistently for
both child discovery and log-writer cleanup, with a regression test. The final
post-commit run has zero mismatches; the failed evidence was not rewritten or
promoted.

## Fifteen senior-role verdicts

| # | Senior responsibility | Verdict | Evidence-backed reason |
|---|---|---|---|
| 1 | Senior Cinematic Designer | **HOLD P1/P2** | Draft 3 has 40 scripted pages while the revised page set has 32 images; no 40-row rendered parity/trigger/skip certificate. |
| 2 | Senior Game Designer — Player Systems | **HOLD P1** | Historical real input still shows charge/heal hold failure; no production delta fixes ownership of held input. |
| 3 | Senior Mission Designer — Quest Craft | **source fixed / journey HOLD** | Alpha and payment authority are coherent here; optional loops lack ordinary-input offer-to-consequence proof. |
| 4 | Principal Encounter Designer | **HOLD P1/P2** | Cave topology is purposeful in source; Gravehorn and natural cave journeys are not rendered/certified. |
| 5 | Senior Boss Designer | **HOLD P1/P2** | Boss gates are coherent; Gravehorn art/mechanics and four current ritual films remain open. |
| 6 | Senior Mission Designer — Campaign | **source fixed / campaign HOLD** | Alpha is optional and the required road is documented; no clean campaign reaches B1. |
| 7 | Senior Mission Producer | **HOLD** | Ancestry, exact build identity and final evidence integrity pass; browser/campaign/device gates remain red. |
| 8 | Senior Character Artist | **HOLD P1/P2** | Hero/Alpha are preserved; Gravehorn, beast recovery strips and Sage matte cleanup remain below target. |
| 9 | Senior Cinematic Director | **HOLD P1/P2** | Forty-page parity, four Gravehorn intercuts and four current ritual films are incomplete. |
| 10 | Senior VFX Artist | **source pass / rendered HOLD** | Finite shared trails are coherent; full pose/roster/device proof is absent. |
| 11 | Senior Technical Director — World Systems | **source pass / performance HOLD** | Startup pack is bounded; room crossing/bake spikes and device budgets are not remeasured. |
| 12 | Senior Gameplay Engineer — Combat | **source pass / real-input HOLD P1** | Impact contracts are plausible; held input, gait invariance and Gravehorn transitions are uncertified. |
| 13 | Senior Gameplay Engineer — Mission | **source fixed / campaign HOLD** | Payment and optionality contracts pass; natural recovery and B1 remain open. |
| 14 | Senior Gameplay Engineer — NPC | **source fixed / rendered HOLD** | Rescued Sage selects the walk strip; Ratchet/Servo/Sage natural return/reload remains blocked. |
| 15 | Lead UI Engineer | **source pass / rendered HOLD** | Tutorial and letter-reveal logic are credible; queues, localization and physical controls are uncertified. |

## Verified bounded source changes

### `ALPHA-AUTHORITY-04`

`js/world.js` no longer says the Alpha den sits on the mandatory road. It now
matches `STORY_SCRIPT`, `CAVES_CH1` and live routing: a post-Purifier A2 depth
door, optional, never gating A2→A3→A4 or B1. The contract reads world authority
and rejects the stale mandatory-road wording.

### `GH-EYE-AUTHORITY-04`

Two remaining story-panel descriptions said Gravehorn had a red eye. They now
use the boss-class purple infection eye, and the contract rejects either stale
phrase. This aligns story authority with the already-carried runtime core,
halo, dark intro and dialogue portrait. Red remains for ordinary infection and
non-eye hazards.

### `AUDIT-PIDNS-04`

The collector translates host `/proc/<pid>/status` `NSpid` values before
signalling descendants or log writers. The new unit test locks current-process
translation. Four genuine integrity failures demonstrated the bug; the final
exact-commit full run proves the repair with 199 stable logs and zero
mismatches.

### Carried verified fixes

- rescued moving Sage uses distance-driven `sageWalk8`; stopped Sage returns to `sagePure`;
- quest payments reject missing/completed quests and pay/persist once;
- Gravehorn live/dark/portrait infection eyes use boss purple and current-frame anchors;
- Alpha remains an optional post-Purifier branch;
- pack download headers/body abort after 15 seconds and release queued Start through the existing failure path; and
- browser preflight, snapshots, quiet windows, end identity and fail-closed classification remain intact.

## Priority findings

### P1 — held input and combat proof

The latest applicable real-input evidence remains: a 950 ms attack hold did not
reach the 0.6 s charge, and required 0.85 s heal stalled at 99 volts and 6/7
cores. Source thresholds look reasonable; the missing evidence is raw down/up
ownership across keyboard, touch, controller, focus, visibility and cancel.
Do not lower thresholds or auto-complete the tutorial. Require three clean runs
per input family covering tap, uninterrupted hold, release, blur/cancel,
charged contact/cost, exact heal deduction, one restored core, lesson advance
and reload.

Impact feedback is designed around hit flash, dual contact/target audio,
robotic fragments, attacker/defender recoil, camera shake and hit-stop, with
stronger values for charge attacks. Those behaviors are not freshly rendered
or timed here. HP, attack power/speed and defense data must remain logged and
balanced from one authoritative data source.

### P1 — Gravehorn art and mechanics

Gameplay-size inspection confirms the retained capture is a pale,
semi-transparent procedural animal beside the finished hero. There is no
`assets/characters/gravehorn` authored set and no `gh_*.webp` plate. The
state-machine source includes horn launch/return, charge, jump, toss/parry,
recoveries, rear kick, phase two, defeat dialogue and retreat, but browser
traces are blocked.

Acceptance: identity-locked gunmetal/bronze rig, both facings, planted hooves,
complete joint overdraw, separate horn sockets/missiles, phase separation and
retreat; four intercuts at actual beats; three consecutive mechanics passes;
ordinary-input CV1B→CV2→CV3 win/death/retry; once-only raw-marble reward.

### P1 — uninterrupted chapter-one campaign

No fresh cleared-storage ordinary-input run proves wake→letter→battery puzzle→
Ratchet→pod/Volt Pack/heal→marble caves→Gravehorn→raw marble→return→forge→
Sage→CHIME→NULLFANG purification→B1. A second mandatory-route run must
explicitly skip Alpha. Staged room/save injection cannot certify either run.

### P1 — manhwa parity and story presentation

`docs/story-draft3/CHAPTER-ONE.md` specifies 40 pages; the revised September
page folder contains 32 images. The game-panel folder contains 43 named shots,
but shot count is not page parity. Require a literal 40-row ledger covering
cast, props/equipment, exact action, room/runtime key, VFX/audio, trigger,
gameplay-size capture and owner verdict. Dialogue/captions must reveal
progressively and remain skippable without silently losing unread narrative.

### P1/P2 — motion, caves, world performance and NPC purpose

- Historical gait evidence found different poses for equal traveled distance
  when only wall-clock time changed. Equal state/distance/direction/velocity
  must render identically at 30/60/120 Hz.
- `CAVES_CH1` gives each room a distinct intended discovery, but browser
  evidence for those journeys is blocked. Every optional loop still needs
  offer→landmark→action→distinct reward→visible consequence→return/reload.
- Historical 114 ms doorway crossing and 2,998 ms bake-ahead frame are not
  fixed by the pack timeout. Profile three times; split/prewarm work without
  raising budgets.
- Ratchet and Servo need natural wake, readable identity/purpose, acquisition,
  once-only consequence, return and reload proof. The background Servo in
  `r_cell.webp` visibly retains amber eyes and a cyan chest light while meant
  to be inactive.

## Caves: meaningful in authority, unproved in play

| Route/room | Intended discovery and payoff | Current evidence |
|---|---|---|
| A5 / A7 | Mind Node, Magnet crest, quarry survey, story evidence and remembered errand | documented/source contracts; browser blocked |
| CV1 / CV1B | spare core, restored survey pod, chart and shortcut/rest | documented; browser blocked |
| CV2 / CV3 | Deaf System origin, raw marble, post-forge changed return route | documented; browser blocked |
| GA1T / GA1 / GA1D | refuge history, rest, first Sage rescue, CHIME revelation and visible freed network | documented; browser blocked |
| A11 / A12 / A13 | coin/star relics and Servo evidence, including later-ability revisit | documented; browser blocked |
| A10 / GA2 chain | optional Alpha backstory, friendly pack, Pack Sage, cell and scrap | authority corrected; natural optional/skip runs blocked |

The concept is now materially better than repeated enemies plus scrap in the
ledger. The production gate is proving those meanings through ordinary play,
not merely having flags and strings in source.

## Art and gameplay-size inspection

| Asset/capture | Finding | Action |
|---|---|---|
| Gravehorn intro capture | procedural, pale/translucent, weak silhouette/material hierarchy versus hero | P1 authored rig/plates; do not reshape mechanics around art |
| `m_down.webp` | polished composition but boss eyes are visibly red/pink, contradicting purple boss infection | masked eye-only correction; preserve framing and all other pixels |
| `r_cell.webp` | rich NPC scene; background inactive Servo still looks powered | turn off only inactive indicators; preserve identity/composition |
| `passage_b.webp` | rear hero is tall/long-limbed and off the compact hero model | local silhouette correction; preserve tunnel/light/props |
| `wolf_crouch4.webp` | crouch sequence, not a floor-anchored down/breathe/recover family | create only genuinely missing wolf/cheetah recovery strips |
| `sage/walk8.webp` | usable eight-cell gait; grey matte remnants remain visible | edge cleanup only; keep identity, cells and floor anchors |

No listed asset was changed during this review because exact identity-locked
generation/editing and live acceptance were unavailable. The prior hero art
remains newer authority; do not port the September 14 hero branch over it.

## Infection-eye VFX

Source review passes the requested finite trail design:

- ordinary infected creatures use red; bosses, Sages, Alpha and Gravehorn use purple;
- trail anchors use current transformed frames, not fixed head guesses;
- emission follows actual body travel in world space;
- fixed simulation gives 1.125–1.875 s life with caps 90/170/260/320;
- discontinuities over 90 px clear the trail;
- cure, death, removal, teleport and room change clear state;
- duplicate suppression prevents double emission; and
- reduced-motion mode keeps glow but disables smoke trails.

What remains blocked: complete rendered pose/facing sweep and low/mid/high
physical-device frame time, pool size, memory, thermals and post-cure/reload
counts. The effect must remain short and smoky—never an indefinite laser line.

## Purification ritual and films

Preserve `assets/video/purify_glitch_ritual.mp4`: 1280×720, 13.25 s, with the
earned hero/sword, white gather, slash, dark extraction/neutralization,
restored guardian and a composed ending. The music and picture must fade out,
not cut abruptly.

The Brood, Atlas, Zero and Prism films are legacy 960×540 guardian-only
transformations and do not meet the current choreography. Create only those
four missing films. Each must transition atomically from hold-to-purify prompt
to white energy gather, cinematic slash, white impact/hit-stop, black-red virus
extraction into the blade, neutralization, restored friendly/golden guardian,
then smooth picture and audible music fade back to gameplay. Skip/retry must
grant neither duplicate reward nor half-saved state.

## UI and localization

Static source counts remain:

| Table | en | ar | tr | zh | ru |
|---|---:|---:|---:|---:|---:|
| base `I18N` | 619 | 600 | 215 | 215 | 215 |
| `STORY_DRAFT2_TEXT` | 20 | 20 | 0 | 0 | 0 |
| `STORY_ORDER_TEXT` | 43 | 43 | 43 | 43 | 43 |

Arabic is missing 19 base keys; Turkish, Chinese and Russian each miss 404 and
fall back to English. Overlay/toast queues remain unbounded and scene captions
can shift unread material. Require deterministic priority, dedupe, capacity and
retirement, plus desktop/phone proof for glyphs, wrap, RTL/CJK, kinsoku,
reveal/debounce, reduced motion, safe areas and skip-first/advance-second.
Viewport emulation is not physical touch evidence.

## Release blockers and acceptance order

1. Fix and certify held input on keyboard, controller and touch.
2. Author and integrate Gravehorn; certify all mechanics and reward semantics.
3. Run two cleared-storage real-input campaigns to B1, one explicitly skipping Alpha.
4. Complete the literal 40-page manhwa parity ledger and only missing/rejected shots.
5. Certify every cave's meaningful journey and NPC consequences through return/reload.
6. Remove wall-clock gait dependence and meet world-frame budgets without relaxing them.
7. Create the four missing ritual films with proper fade-out; preserve accepted Glitch.
8. Bound UI queues, close translation gaps and verify five locales.
9. Run complete eye/VFX roster sweeps and physical-device performance/haptics/audio.
10. Re-run the fail-closed full collector on the exact candidate commit; require zero blocked or failed P1 gates before merge/deploy consideration.

## Files and evidence map

- `docs/studio/runs/2026-11-04/automated/results.json` — complete final machine result set.
- `docs/studio/runs/2026-11-04/automated/log-integrity.json` — final zero-mismatch integrity certificate.
- `docs/studio/runs/2026-11-04/automated/AUTOMATED.md` — generated check table and evidence limitations.
- `docs/studio/runs/2026-11-04/automated-integrity-fail*` — retained failed attempts; diagnostic only.
- `docs/studio/runs/2026-11-04/CLAUDE_PROMPT.md` — single implementation handoff.

## Honest unverified scope

This review does **not** claim that chapter one is playable end to end, that
Gravehorn/Alpha/Sage motion looks professional in motion, that trails are
performant on devices, that sound/haptics work, that all text is readable in
five languages, or that purification cinematics integrate smoothly. Those
claims require a pinned executable browser and physical devices. The bounded
source fixes and collector integrity are verified; the production experience
remains on hold.
