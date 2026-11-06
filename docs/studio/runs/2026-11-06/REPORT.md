# CLAWBYTE senior studio review — 2026-11-06

## Executive verdict

**HOLD production. Do not merge or deploy this review branch.**

Production did not move. `main`, `odyssey`, and the authorized integration ref
`claude/clawbyte-repo-migration-byhyl8` remain identical at
`7da3c87e6b43a2357a2f52080814ae1d6adad618`. The latest non-review Claude refs
also remain unchanged: `claude/perf@55b4d2697424b4271ccf62c83a68d24058c0e45b`
and `claude/appstore-compliance@4968f0e0b45073597a2df23f958238e5b9e49896`.
There is therefore no new production gameplay or art delta to certify against
the November 5 review.

This review adds four bounded authored-source corrections:

1. unread scene captions are retained in a FIFO queue instead of being evicted
   after three visible entries;
2. three Playwright harnesses are no longer falsely marked browser-free, and an
   audit unit test now prevents that regression;
3. the Alpha authority diagram and contract now preserve the required
   `A1→A2→A3→A4` road and keep A10 optional;
4. story/art authority now agrees with runtime: ordinary infected eyes are red,
   while bosses and guardians are purple.

The exact audited source/build commit is
`f02e519e1cb52bc69df15932c51703e2a85e439e`. The collector accounted for **203
entries: 38 pass and 165 blocked**. The passing set is build, package, two served
identity gates, and 34 source/non-browser harnesses. Every browser check was
blocked before launch because no browser executable exists and five Playwright
download attempts returned empty/truncated ZIP files.
`complete_requested_scope=true` means every requested check received a result;
it does **not** mean the
gameplay passed. Overall `passed=false` is correct.

The collector also failed closed on its evidence-integrity gate. Two raw logs,
`offline-release.log` and `reel-contract.log`, were later truncated to their
first line even though their complete byte snapshots and hashes remain embedded
in `results.json`. A clean full rerun reproduced the race on two *different*
passing logs. The run is therefore non-certifying; the embedded snapshots are
retained for diagnosis, not substituted for the damaged raw files.

No fresh staged browser run, uninterrupted ordinary-input campaign, physical
device run, motion capture, audio/haptic pass, or live gameplay-size frame sweep
exists for this date. Static asset inspection is not treated as live-game proof.
No raster, animation, audio, manhwa, or video asset was generated or altered.

## Repository and comparison

| Item | Evidence |
|---|---|
| Production / mirror / integration | all `7da3c87e6b43a2357a2f52080814ae1d6adad618` |
| Previous review | `codex/studio-review-2026-11-05@9b3801af5fdd5467a1442e88a6ec9f006d079e79` |
| Review branch | `codex/studio-review-2026-11-06` |
| Prior bounded authored source | `f0265a35e0b3b5987619638352c05625f947712c` |
| Exact Nov 6 audited build | `f02e519e1cb52bc69df15932c51703e2a85e439e` |
| Built `index.html` SHA-256 | `121b9b228a5e90314849b11765ea97f32cb3c00b2c797a814b233387bd96d3c2` |
| Evidence `results.json` SHA-256 | `41636cf1465bd6d1567c504ccbc1034fe32c13f7b4a49cd6650d233ae847663f` |
| Production action | none; review branch only |

The evidence directory is collector-created and therefore appears in
`dirty_at_start`; the named source/build commit itself was exact. Do not present
the remote review head as production or as deployed. If the Git publisher cannot
transfer the four generated multi-megabyte HTML blobs, select the authored
source and run `node build.cjs` before any candidate verification.

## Evidence classes and hard boundary

1. **Source/state contract** proves static or headless logic only.
2. **Staged browser harness** may inject room, save, entity, inventory, position,
   or progress state; it is not a campaign.
3. **Uninterrupted real-input campaign** begins from cleared storage and uses
   ordinary controls only. Of the 199 harnesses, only `campaign-ch1` can issue
   this certificate; it was blocked today.
4. **Gameplay-size still** proves visible facts in one frame, not motion, timing,
   input, audio, persistence, or performance.
5. **Physical-device evidence** is required for touch, controller, safe-area,
   haptics, interruption, thermals, memory, and real audio claims.

## Commands and results

| Command/check | Result |
|---|---|
| ref comparison | pass; production, integration, mirror, and side refs unchanged |
| `npm ci` | pass; 160 packages |
| browser inventory | blocked; no Chrome/Chromium executable |
| `PLAYWRIGHT_BROWSERS_PATH=/tmp/clawbyte-pw-20261106 npx playwright install chromium` | blocked; five empty/truncated invalid ZIPs |
| `python -m unittest tools.studio.test_audit -v` | pass, 13/13 |
| Python compile for audit tools | pass |
| seven targeted contracts | pass, 7/7 |
| relevant JavaScript syntax and `git diff --check` | pass |
| `node build.cjs` | pass; 4.71/3.49/4.73/3.51 MB targets |
| `node tools/pack-www.cjs` | pass; 694 assets (244.3 MB), two pages (8.2 MB), total 252.5 MB |
| full collector | complete accounting; 38 pass, 165 blocked, overall red |
| served identity | pass at start and end; identical hashes |
| raw-log integrity | fail closed; 2/199 raw logs truncated, embedded snapshots still hash-correct |

The 165 browser checks are **blocked**, not failed and not passed. Historical
observations—950 ms charge not firing, heal stalling at 99 volts and 6/7 cores,
114 ms doorway crossing and 2,998 ms bake-ahead frame—were not rerun and remain
historical only.

## Fifteen senior-role verdicts

| # | Senior responsibility | Verdict | Evidence-backed reason |
|---|---|---|---|
| 1 | Senior Cinematic Designer | **HOLD P1/P2** | Progressive reveal/skip source is credible, but the literal 40-page parity ledger, four Gravehorn intercuts, rendered pacing, and four current ritual films remain open. |
| 2 | Senior Game Designer — Player Systems | **HOLD P1** | Tutorial contracts pass; held charge/heal ownership, campaign flow, and device controls are not freshly certified. |
| 3 | Senior Mission Designer — Quest Craft | **source fixed / journey HOLD** | Payment and Alpha optionality pass in source; cave and Ratchet-to-cave presentation lack natural-play proof. |
| 4 | Principal Encounter Designer | **HOLD P1/P2** | Cave outcomes are distinct in authority; natural cave journeys and Gravehorn execution are unrendered. The stale A2/A10/A3 diagram was corrected. |
| 5 | Senior Boss Designer | **HOLD P1/P2** | Boss gates are coherent; Gravehorn remains a procedural stand-in, and four current-contract ritual films are missing. |
| 6 | Senior Mission Designer — Campaign | **source fixed / campaign HOLD** | Required road and optional Alpha route now agree in source; no clean ordinary-input run reaches B1. |
| 7 | Senior Mission Producer | **HOLD** | Scope accounting and exact served identity pass; browser, campaign, device, and raw-log integrity gates remain red. |
| 8 | Senior Character Artist | **HOLD P1/P2** | Accepted hero/Alpha assets are preserved; Gravehorn rig, beast recovery coverage, inactive Servo lighting, and boss-eye correction remain open. |
| 9 | Senior Cinematic Director | **HOLD P1/P2** | Page parity, authored Gravehorn beat panels, and consistent current purification films are incomplete. |
| 10 | Senior VFX Artist | **source pass / rendered HOLD** | Finite trail authority exists and eye-color authority now agrees; pose/facing/roster/performance/device proof is blocked. |
| 11 | Senior Technical Director — World Systems | **source pass / performance HOLD** | Topology and pack timeout are coherent; doorway/bake budgets and natural traversal are unmeasured. |
| 12 | Senior Gameplay Engineer — Combat | **source pass / real-input HOLD P1** | Impact/stat contracts pass; held input, gait timing, haptics/audio ownership, and boss transitions are uncertified. |
| 13 | Senior Gameplay Engineer — Mission | **source fixed / campaign HOLD** | Idempotent payment and optionality pass; natural recovery, reload, and B1 completion remain open. |
| 14 | Senior Gameplay Engineer — NPC | **source fixed / rendered HOLD** | Ratchet/Servo purpose and Sage walk selection exist; ordinary wake/return/reload and live gait proof are absent. |
| 15 | Lead UI Engineer | **caption source fixed / rendered HOLD P1/P2** | Critical captions now queue instead of evicting unread text; localization, queue ownership, phone layout, and physical controls remain unresolved. |

## Bounded changes verified on this branch

### Unread caption retention

`sceneCaption()` keeps three visible readers and queues additional captions in
`G.sceneCapQ`. The fourth critical caption no longer removes the oldest unread
reader. `sceneCaptionShown()` and `sceneCaptionRead()` include active and queued
entries; queued readers promote only after the active reader has been read and
faded. New-game reset clears both collections. `scene-caption-contract` passes.

### Test classification

`hero-delivery`, `hero-frame-alpha`, and `hero-alpha` directly import
Playwright, so their false `noBrowser:true` flags were removed. The audit unit
suite now scans suite metadata and rejects any browser harness declared
browser-free. This corrects reporting; it does not create browser evidence.

### Alpha route authority

The world seam comment and contract now state the required road as
`A1|A2, A2|A3, A3|A4`; A10 is an optional depth-door branch, never an inline
replacement for A2→A3. `alpha-optional-contract` rejects the stale topology.

### Infection-eye authority

Runtime already defines ordinary infected creatures as red and bosses as
purple. `STORY_SCRIPT.md` and `ART_QUEUE.md` now agree: NULLFANG's red/orange
marks are hazard/tell accents, not red infection optics. The baked red/pink eyes
in `m_down.webp` remain a queued masked asset correction; no image was regenerated.

## Priority findings and acceptance gates

### P1 — uninterrupted chapter-one story and meaningful caves

Run a cleared-storage ordinary-input campaign through wake→letter→battery board→
Ratchet→pod/Volt Pack/heal→CV1/CV1B/CV2/CV3→Gravehorn→raw marble→Ratchet forge→
first Sage→CHIME→NULLFANG purification→B1. Run it twice: complete Alpha once and
explicitly skip A10 once. Do not inject flags, inventory, rooms, saves, teleports,
or debug completion.

Acceptance: each objective explains the next physical step; lion access is
blocked until the marble sword exists; cave rewards and discoveries change later
dialogue/state; payment occurs once; death/retry and reload remain legal; both
routes reach B1.

### P1 — held input and combat feel

Instrument raw down/up ownership, device, timestamp, focus/visibility/cancel,
charge accumulator, and release consumer. Do not lower thresholds or silently
auto-complete lessons. Three consecutive keyboard, controller, and touch runs
must prove tap, held charge, cancel, heal, exact costs, save/reload, and one-time
impact effects: white hit flash, two-layer audio, robotic fragments, bounded
attacker/defender recoil, screen shake, and hit-stop. Charged hits must be
stronger but bounded and respect reduced-motion settings.

### P1 — Gravehorn art, motion, and fight

There is still no authored `assets/characters/gravehorn/` rig or `gh_*.webp`
plate. The retained gameplay-size capture shows a pale procedural animal beside
the finished hero. Build an identity-locked gunmetal/bronze rig with both
facings, planted hooves, complete joint overdraw, separate horn sockets and
projectiles, readable damage states, recovery/retreat, and four authored live
intercuts. Certify three staged mechanics passes, then ordinary-input
CV1B→CV2→CV3 win/death/retry and exactly one raw-marble reward.

### P1 — manhwa parity and purification films

Draft 3 contains 40 scripted pages; the revised page folder contains 32 images.
The game-shot folder has 43 named images, but count is not parity. Create a
40-row ledger with image hash, cast, equipment, action, runtime room/key,
trigger, VFX/audio, skip/reload, gameplay-size capture, and reviewer verdict.
Generate or correct only failed rows.

Preserve `assets/video/purify_glitch_ritual.mp4` (1280×720, 13.25 s) and its
picture/music fade. Brood, Atlas, Zero, and Prism need current-contract films:
white gather, luminous sword raise, cinematic slash, impact flash/hit-stop,
black-red extraction into the blade, friendly/golden restoration, then smooth
picture and music fade. Skip/retry must settle state and rewards atomically.

### P1/P2 — finite eye trails, NPCs, UI, and localization

Eye trails must begin at current-pose eye anchors, follow both facings, emit only
while moving, fade to zero after stop/hide/purify/remove, and remain bounded in
particle count and GPU cost. Ordinary infected are red; bosses/guardians purple.

`r_cell.webp` still depicts the inactive background Servo with lit amber eyes
and a cyan chest. Correct only those masked lights. Locale counts remain EN 619,
AR 600, and TR/ZH/RU 215; Arabic lacks 19 base keys and Turkish/Chinese/Russian
each lack 404. Add parity checks and certify all five locales at desktop and
phone sizes.

## Static graphics inspection at gameplay-relevant scale

| Asset/capture | Observed fact | Verdict |
|---|---|---|
| `docs/studio/runs/2026-10-11/images/gravehorn-intro.png` | pale translucent procedural boss beside finished hero | P1 replace with authored Gravehorn rig |
| `assets/manhua/ch1/game/m_down.webp` | polished composition, but boss infection eyes are baked red/pink | P1 masked purple correction after parity ledger |
| `assets/manhua/ch1/game/r_cell.webp` | inactive Servo eye/chest illumination contradicts state | P2 masked correction only |
| `assets/manhua/ch1/game/passage_b.webp` | rear hero is tall/long-limbed and off established model | P2 identity correction only if the parity ledger fails it |
| `assets/characters/beasts/wolf_crouch4.webp` | crouch family, not a complete down/breathe/recover set | P2 finish only missing state coverage |
| `assets/characters/sage/walk8.webp` | eight-frame gait; the alleged grey-matte defect was not reproduced on checkerboard inspection today | **unverified**; do not alter without live capture |

This is direct file/still inspection. The conflicting Sage-matte reports are
resolved conservatively: preserve the strip until a live gameplay-size capture
shows a real defect.

## Integration order

1. Select the bounded authored source and rebuild generated HTML.
2. Restore a pinned browser lane, eliminate the collector raw-log race, and
   rerun the exact full collector.
3. Verify caption FIFO behavior in a rendered overflow scene.
4. Fix held-input ownership, then run two natural chapter-one campaigns.
5. Produce only the missing Gravehorn set, failed parity rows, and four missing
   purification films; preserve accepted assets.
6. Certify finite trails, animation, audio, haptics, performance, five locales,
   and physical devices.
7. Merge/deploy only after every P1 gate passes on one exact candidate commit.

## Final producer decision

**HOLD.** The branch contains useful bounded source improvements and complete
scope accounting, but no credible production release claim is possible without
an uninterrupted real-input campaign, rendered boss/cave/VFX verification,
physical-device evidence, and clean evidence-log integrity.
