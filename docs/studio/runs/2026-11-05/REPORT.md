# CLAWBYTE senior studio review — 2026-11-05

## Executive verdict

**HOLD production. Do not merge or deploy this review branch.**

Production did not move. `main`, `odyssey`, and the authorized integration ref
`claude/clawbyte-repo-migration-byhyl8` are still identical at
`7da3c87e6b43a2357a2f52080814ae1d6adad618`. The newest non-review Claude
branches are also unchanged from the previous review. This branch therefore
carries the already verified November 4 authored fixes, rebuilds their generated
pages, and adds fresh evidence only. It does not invent a daily gameplay change,
merge production, or deploy.

The exact local source/build commit is
`ecc45d7ac1da36c4874d7f5a37af5eb8d9550fa7`. The full collector accounted for
**201 entries: 36 pass and 165 blocked**. The passing set is the build, package,
two served-identity gates, and 32 source/non-browser harnesses. Every browser
check was blocked before launch because Chromium was unavailable and five
installation downloads were empty or truncated. `complete_requested_scope=true`
means every requested check received a result; it does **not** mean gameplay
passed. The overall `passed=false` is correct.

No fresh staged browser run, uninterrupted ordinary-input campaign, physical
device run, motion capture, audio/haptic pass, or gameplay-size runtime frame
sweep exists for this date. Static asset inspection is explicitly not treated
as live-game proof.

No raster, animation, audio, manhwa, or video asset was regenerated or altered.
Accepted hero, sword, crystal, Alpha/pack, NULLFANG and Glitch purification
assets were preserved.

## Repository and comparison

| Item | Evidence |
|---|---|
| Production base | `main@7da3c87e6b43a2357a2f52080814ae1d6adad618` |
| Authorized integration | `claude/clawbyte-repo-migration-byhyl8@7da3c87e6b43a2357a2f52080814ae1d6adad618` |
| Mirror | `odyssey@7da3c87e6b43a2357a2f52080814ae1d6adad618` |
| Previous review | `codex/studio-review-2026-11-04@4effae629d67a5c0ea498fc772e257635c44a021` |
| Latest side refs rechecked | `claude/perf@55b4d2697424b4271ccf62c83a68d24058c0e45b`; `claude/appstore-compliance@4968f0e0b45073597a2df23f958238e5b9e49896` |
| Review branch | `codex/studio-review-2026-11-05` |
| Carried authored source | local `ecd9f944b3de181f46e6018bf93a5e3b4e31a20d`; tree matches published `f0265a35e0b3b5987619638352c05625f947712c` |
| Exact audited local build | `ecc45d7ac1da36c4874d7f5a37af5eb8d9550fa7` |
| Built `index.html` SHA-256 | `67e73b89cb6a03ae21b1cf146d8a2eceb27e5f9b3870bbf982d7bd0c84146855` |
| Evidence-integrity SHA-256 | `a9902117fced37505c2e47578ad16a067b5d48e3cca563448631c898d74d69ec` |
| Production action | none; review branch only |

Compared with November 4, there is no production, authorized-integration, side-
branch, gameplay-source, or asset delta. The review source still contains 17
authored files over production and preserves the previously bounded Sage gait,
once-only quest payment, optional Alpha authority, Gravehorn purple-eye
authority, 15-second pack timeout, and fail-closed audit hardening. The four
generated HTML targets were rebuilt locally from that source.

## Evidence classes and hard boundary

1. **Source/state contract** proves static or headless logic only.
2. **Staged browser harness** may inject room, save, entity, inventory, position,
   or progress state; it is not a campaign.
3. **Uninterrupted real-input campaign** begins from cleared storage and uses
   ordinary controls only. Of the 197 harnesses, only `campaign-ch1` can provide
   this certificate.
4. **Gameplay-size still** proves visible facts in one frame, not motion, timing,
   input, audio, performance, or persistence.
5. **Physical-device evidence** is required for real touch, controller,
   safe-area, haptics, interruption, thermals, memory and audio claims.

The evidence directory is collector-created and therefore appears untracked at
collector start. The named source commit itself was exact. The collector ended
with 199 captured logs and zero disk/snapshot integrity mismatches.

## Commands and results

| Command/check | Result |
|---|---|
| ref fetch and comparison | pass; production/integration refs unchanged |
| `npm ci` | pass; 160 packages |
| browser inventory | blocked; no Chrome/Chromium executable |
| Playwright Chromium install | blocked; five empty/truncated invalid ZIPs |
| `python -m unittest tools.studio.test_audit -v` | pass, 12/12 |
| Python compile for audit tools | pass |
| Alpha, Gravehorn eye, payment, Sage gait, pack-timeout contracts | pass, 5/5 |
| relevant JavaScript syntax | pass |
| `node build.cjs` | pass; 4.71/3.49/4.73/3.51 MB targets |
| `node tools/pack-www.cjs` | pass; 694 assets (244.3 MB), two pages (8.2 MB), total 252.5 MB |
| full collector | complete accounting; 36 pass, 165 blocked, overall red |
| final integrity | pass; 199 logs, zero mismatches |
| served identity | pass at start and end; identical hashes |

The 165 browser checks are **blocked**, not failed and not passed. Historical
November 4 observations—950 ms charge not firing, heal stalling at 99 volts and
6/7 cores, 114 ms doorway crossing and 2,998 ms bake-ahead frame—were not rerun
and are identified as historical wherever used.

## Fifteen senior-role verdicts

| # | Senior responsibility | Verdict | Evidence-backed reason |
|---|---|---|---|
| 1 | Senior Cinematic Designer | **HOLD P1/P2** | Progressive reveal/skip source is credible, but the literal 40-page parity ledger, four Gravehorn intercuts, rendered pacing and four guardian ritual films remain open. |
| 2 | Senior Game Designer — Player Systems | **HOLD P1** | Tutorial contracts pass; held charge/heal ownership, campaign flow and device controls are not freshly certified. |
| 3 | Senior Mission Designer — Quest Craft | **source fixed / journey HOLD** | Payment and Alpha optionality pass in source; cave and Ratchet-to-quest presentation lack natural play proof. |
| 4 | Principal Encounter Designer | **HOLD P1/P2** | Cave outcomes and encounter topology are distinct in authority; Gravehorn and natural cave journeys are unrendered. |
| 5 | Senior Boss Designer | **HOLD P1/P2** | Boss gates are coherent; Gravehorn remains a procedural stand-in and four current-contract ritual films are missing. |
| 6 | Senior Mission Designer — Campaign | **source fixed / campaign HOLD** | Required road and optional Alpha route agree in source; no clean ordinary-input run reaches B1. |
| 7 | Senior Mission Producer | **HOLD** | Ancestry, exact build, scope accounting and evidence integrity pass; browser/campaign/device gates remain red. |
| 8 | Senior Character Artist | **HOLD P1/P2** | Accepted hero/Alpha assets are preserved; Gravehorn rig, beast recovery coverage, inactive Servo lighting and Sage matte cleanup remain open. |
| 9 | Senior Cinematic Director | **HOLD P1/P2** | Page parity, authored Gravehorn beat panels and consistent current purification films are incomplete. |
| 10 | Senior VFX Artist | **source pass / rendered HOLD** | Finite red/purple eye-trail authority is present; pose/facing/roster/performance/device proof is blocked. |
| 11 | Senior Technical Director — World Systems | **source pass / performance HOLD** | Topology and pack timeout are coherent; doorway/bake budgets and natural traversal are unmeasured. |
| 12 | Senior Gameplay Engineer — Combat | **source pass / real-input HOLD P1** | Impact/stat contracts pass; held input, frame-rate-invariant gait, haptics/audio ownership and boss transitions are uncertified. |
| 13 | Senior Gameplay Engineer — Mission | **source fixed / campaign HOLD** | Idempotent payment and optionality pass; natural recovery, reload and B1 completion remain open. |
| 14 | Senior Gameplay Engineer — NPC | **source fixed / rendered HOLD** | Ratchet/Servo purpose and Sage walk selection exist; ordinary wake/return/reload and live gait proof are absent. |
| 15 | Lead UI Engineer | **source pass / rendered HOLD P1/P2** | Reveal/tutorial affordances are credible; unread-caption loss, unbounded queues, locale gaps and physical controls remain unresolved. |

## Verified bounded source carried on this branch

- Moving purified Sage selects distance-driven `sageWalk8`; stopped Sage returns
  to `sagePure`, avoiding the known sleeping-pose slide in source.
- `questPay` rejects missing or completed quests before any award, persist, SFX
  or VFX side effect; replay remains byte-stable in the source contract.
- Alpha is an optional post-Purifier A2 depth-door route and never gates the
  required A2→A3→A4/B1 road.
- Gravehorn's boss-class infection eye is purple across live, dark-intro,
  dialogue and story authority; ordinary infected creatures remain red.
- Pack fetch headers and body share a 15-second abort path and release queued
  Start through the existing failure handling.
- Audit PID-namespace translation, quiet windows, snapshots, final identity and
  fail-closed classification remain in place.

These are review-branch source fixes, not production deployment or live-game
certification.

## Priority findings and acceptance gates

### P1 — mandatory held input and combat feel

The latest applicable real-input observation remains historical: a 950 ms
attack hold did not cross the 0.6 s charge behavior and the 0.85 s heal stalled.
Instrument raw down/up ownership, device, timestamp, focus/visibility/cancel,
charge accumulator and release consumer; repair the first lost ownership path.
Do not lower thresholds or auto-complete tutorial lessons.

Acceptance: three consecutive keyboard, controller and touch runs prove tap,
hold, release, cancel, focus loss, one charged contact/cost, exact heal cost, one
restored core, tutorial advance, save and reload. Impact flash, hit/target audio,
robotic fragments, attacker/defender recoil, screen shake and hit-stop must fire
once, with stronger but bounded charged values and reduced-motion behavior.

### P1 — uninterrupted chapter-one story

Run a cleared-storage ordinary-input campaign through wake→letter→battery board→
Ratchet→pod/Volt Pack/heal→CV1/CV1B/CV2/CV3→Gravehorn→raw marble→Ratchet forge→
first Sage→CHIME→NULLFANG purification→B1. Run it twice: one path completes
Alpha and one explicitly skips A10. No injected flags, inventory, rooms, saves,
teleports or debug completion.

Acceptance: objectives advance one reasoned step at a time, gates are physically
enforced, early discoveries adapt later dialogue, reward/payment occurs once,
death/retry and reload preserve legal state, and both routes reach B1.

### P1 — Gravehorn art, animation and fight

There is still no authored `assets/characters/gravehorn/` rig or `gh_*.webp`
plate. The retained gameplay-size capture shows a pale translucent procedural
animal next to the finished hero. Source mechanics include horn launch/return,
charge, jump, toss/parry, recoveries, rear kick, phase two and retreat, but these
were not executed today.

Acceptance: identity-locked gunmetal/bronze art in both facings, planted hooves,
complete joint overdraw, separate horn sockets/projectiles, readable phase-two
damage, retreat, four authored live-beat intercuts, three consecutive staged
mechanics passes, then ordinary-input CV1B→CV2→CV3 win/death/retry and exactly
one raw-marble reward.

### P1 — manhwa parity and purification cinematics

Draft 3 contains 40 scripted pages; the revised page folder contains 32 images.
The game-panel folder has 43 named shots, but count is not literal page parity.
Create a 40-row ledger before generating anything, recording image hash, cast,
props/equipment, exact action, runtime room/key, trigger, VFX/audio, skip/reload,
gameplay-size capture and reviewer verdict. Generate or correct only failed rows.

Preserve `assets/video/purify_glitch_ritual.mp4` (1280×720, 13.25 s). Brood,
Atlas, Zero and Prism need current-contract films: earned hero and sword, white
gather, cinematic slash, impact flash/hit-stop, black-red extraction into the
blade, friendly/golden restoration, then smooth picture **and music** fade.
Skip/retry must settle state and rewards atomically.

### P1/P2 — caves, NPCs, UI and localization

| Area | Source intent | Missing proof / bounded correction |
|---|---|---|
| A5/A7 | Mind Node, crest, survey evidence and remembered errand | natural offer→discovery→return→reload |
| CV1/CV1B | spare core, survey pod, chart, shortcut/rest | distinct landmarks and visible reward consequence |
| CV2/CV3 | origin lore, Gravehorn, raw marble, changed post-forge return | natural win/retry/revisit and once-only marble |
| GA1T/GA1/GA1D | refuge history, rest, first Sage, CHIME and freed network | live Sage purification, walk/stop/turn and persistence |
| A11–A13 | coin/star relics, Servo evidence, later-ability revisit | natural motivation and changed return dialogue |
| A10/GA2 | optional Alpha backstory, friendly pack, Pack Sage and rewards | one completed route and one explicit skip route |

`r_cell.webp` still makes the inactive background Servo look powered through
amber eyes and a cyan chest light. Correct only those masked lights. The
`sage/walk8.webp` strip is usable but carries grey matte remnants; clean edges
without changing poses, registration, identity or foot anchors.

`sceneCaption()` can discard the oldest caption after three entries without
proving it was read. Overlay and panel queues are not uniformly bounded or
priority-owned. Fix unread critical retention first, then use stable priority,
dedupe keys, bounded capacity, explicit retirement reasons and overflow
telemetry. Base locale counts remain EN 619, AR 600, and TR/ZH/RU 215; Turkish,
Chinese and Russian each fall back on 404 base keys, Arabic on 19. Add parity
checks and certify all five locales at desktop and phone sizes.

### P1/P2 — finite infection-eye trails and motion

Ordinary infected creatures must have red eyes; bosses have purple eyes. Trails
must originate from current-frame eye anchors for each pose and facing, emit
while the creature moves, fade to zero in finite time when stopped/hidden/
purified/removed, and stay bounded in particle count and GPU cost. Source
contracts support this intent, but all live infection-eye suites were blocked.

Equal gameplay state, traveled distance, direction and velocity must select the
same gait frame at 30/60/120 Hz. Never certify motion from stills or a source
contract alone.

## Static graphics inspection at gameplay-relevant scale

| Asset/capture | Observed fact | Verdict |
|---|---|---|
| `docs/studio/runs/2026-10-11/images/gravehorn-intro.png` | pale translucent procedural animal beside finished hero | P1 replace with authored Gravehorn rig; no asset generated today |
| `assets/manhua/ch1/game/m_down.webp` | polished composition, but boss eyes are baked red/pink | P1 correct to boss purple after parity ledger |
| `assets/manhua/ch1/game/r_cell.webp` | inactive Servo eye/chest illumination contradicts state | P2 masked correction only |
| `assets/manhua/ch1/game/passage_b.webp` | rear hero is tall/long-limbed and off established model | P2 identity correction only if ledger fails |
| `assets/characters/beasts/wolf_crouch4.webp` | crouch family, not a complete floor-anchored down/breathe/recover set | P2 finish only missing state coverage |
| `assets/characters/sage/walk8.webp` | useful eight-frame gait with visible grey matte remnants | P2 cleanup only; preserve timing and anchors |

This was direct asset/still inspection. Chromium was unavailable, so no claim is
made that these frames were freshly rendered by the live game.

## Integration order

1. Select the bounded authored-source commit, then rebuild generated HTML.
2. Restore a pinned Chromium/browser lane and rerun the exact full collector.
3. Fix held-input ownership and unread-caption loss before art expansion.
4. Run two natural campaigns, including an Alpha-skip route.
5. Produce only the missing Gravehorn set, four Gravehorn panels, failed manhwa
   parity rows, and four missing current-contract ritual films.
6. Certify finite trails, animation, audio, haptics, performance, five locales
   and physical devices.
7. Merge/deploy only after all P1 entries pass on one exact candidate commit.

## Final producer decision

**HOLD.** The review source is materially safer than production and should be
considered for selective integration, but it is not a shippable certificate.
No production merge or deployment occurred.
