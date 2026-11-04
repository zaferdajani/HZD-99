# Copyable Claude integration prompt

```text
You are the senior implementation owner for zaferdajani/HZD-99. Integrate and act on the November 4 senior studio review on a new integration branch. Do not merge main and do not deploy production.

SOURCE OF TRUTH
- Review branch: codex/studio-review-2026-11-04
- Production base: main@7da3c87e6b43a2357a2f52080814ae1d6adad618
- Exact audited-source ancestor: 6382c87d4c99e580bd304e642929580b5adb5e31
- Published authored-source ancestor: f0265a35e0b3b5987619638352c05625f947712c
- Read completely:
  - docs/studio/runs/2026-11-04/REPORT.md
  - docs/studio/runs/2026-11-04/automated/results.json
  - docs/studio/runs/2026-11-04/automated/log-integrity.json
  - docs/studio/runs/2026-11-04/automated/AUTOMATED.md
  - docs/STORY_CANON.md, docs/STORY_SCRIPT.md, docs/CAVES_CH1.md
  - docs/studio/PIPELINE.md, docs/studio/roles.json and every referenced role file
- Start from latest main and selectively integrate the audited source ancestor. Never replace main with an older review tree.
- The published authored-source ancestor intentionally leaves the four generated HTML bundles at the production base; run node build.cjs after integrating source and verify the audited index SHA 67e73b89cb6a03ae21b1cf146d8a2eceb27e5f9b3870bbf982d7bd0c84146855. Do not mistake stale generated bundles for source authority.
- Preserve approved/current hero, sword, crystal, Alpha/pack, NULLFANG, Sage, Talon, NPC and completed beast art. Do not port the old September 14 hero branch over newer hero art. Do not regenerate completed assets merely to create a change.

EVIDENCE RULES
- Final exact-commit collector: 201 entries = 36 pass, 165 browser BLOCKED. The 36 are build, package, start/end identity and 32 source/non-browser contracts. Chromium was absent; there is no fresh staged-browser, uninterrupted campaign or physical-device certification.
- Four earlier November 4 collectors caught late writers changing logs and are retained under automated-integrity-fail*. Preserve them. The namespace-PID repair then produced 199 stable logs and zero mismatches.
- Keep source contracts, staged browser checks, checkpoint diagnostics, uninterrupted ordinary-input campaigns, gameplay-size stills and physical devices separate. Blocked, timeout, source presence and viewport emulation are never gameplay passes.
- Retain namespace-aware descendant/log-writer cleanup, browser preflight, quiet-window snapshots, same-byte evidence retention, served identity, final integrity, and all 12 audit unit tests.

INTEGRATE VERIFIED BOUNDED FIXES FIRST
1. Rescued Sage: moving purified Sage uses distance-driven sageWalk8; stopped Sage uses sagePure. Preserve hostile/purified separation and both contracts.
2. Quest payment: missing/completed quests pay nothing; first valid completion pays/persists/cues once. Preserve the idempotency contract.
3. Alpha authority: optional post-Purifier A2 depth-door branch. A2 -> A3 -> A4 and B1 never require Alpha. Preserve STORY_SCRIPT, CAVES_CH1 and world-comment agreement plus alpha-optional-contract.
4. Gravehorn eye class: ordinary infected eyes red; bosses/Sages/Alpha/Gravehorn purple. Preserve #ba5cff live core/halo, dark intro, dialogue portrait, current-frame anchors and distinct red hazards. Preserve the stricter story contract rejecting stale red-eye descriptions.
5. Pack startup: keep the 15-second AbortController around headers/body and release queued Start exactly once through the existing failure path. Clear timers. Do not present this as room-performance evidence.
6. Audit integrity: preserve namespace_pid(NSpid) translation for child discovery and log-writer signalling plus its regression test.

P1 — FIX HELD INPUT BEFORE POLISH
- Applicable real-input evidence: tap works; a 950 ms attack hold did not reach the 0.6 s charge; required 0.85 s heal stalled at 99 volts and 6/7 cores.
- Diagnose keyboard/touch/controller raw down/up through inD, overlays/tutorial ownership, chargeT/healT, focus, visibility, release and cancel.
- Do not lower thresholds, inject progress, auto-complete lessons or add blind waits.
- Acceptance: three clean real-event runs per input family proving tap, uninterrupted hold, release, blur/cancel, charged contact/cost, exact heal deduction, one restored core, one lesson advance and reload.

P1 — PROFESSIONAL COMBAT IMPACT
- On normal contact coordinate: short white enemy flash; attacker contact and target/metal clash audio; robotic screws/shards/small metal parts; defender knockback plus a tiny attacker recoil; restrained screen/body shake; brief hit-stop; readable damage/defense result.
- Charged hold attack uses a stronger but bounded version: clearer flash/VFX, larger fragments, slightly longer hit-stop/shake/recoil, and about double base claw damage only if the authoritative balance data supports it.
- Every combatant must have authoritative HP, attack power, attack speed and defense data; weapon upgrades modify the same data path. Log combat math and keep the character-stat/card document generated from that source, not hand-maintained duplicates.
- Validate timing and accessibility/reduced-motion on 30/60/120 Hz and physical low/mid/high devices. Do not stack indefinite shake, flash or particles.

P1 — GRAVEHORN BOSS
- Use existing ghLog in a pinned browser. Repair the first missing/stuck transition across intro/name card, both horn fire/return, hornless opening, charge/jump, toss/parry, recoveries, rear kick, phase two/chained charge, defeat dialogue, retreat, once-only raw-marble reward, death and retry.
- Require three consecutive mechanics passes and ordinary-input CV1B -> CV2 -> CV3 win/death/retry.
- Replace only the translucent procedural stand-in via the approved identity-locked workflow: gunmetal/bronze mechanical rhino, both facings, planted hooves, complete joint overdraw, separate horns/sockets, phase separation and defeat/retreat. Do not alter mechanics to fit art.
- Trigger gh_intro_a, gh_intro_b, gh_phase2 and gh_down at real beats. Authored eye apertures are unlit; runtime supplies purple infection.

CAMPAIGN, STORY, CAVES AND NPCS
- Preserve canon: Mother's harmony song is hacked; sleeping hero avoids it; letter before battery; Ratchet removed his own cell; inherited marble slowed infection; repair-board puzzle; pod save/recharge; Volt Pack; raw marble before forge; white Purifier before Sage; CHIME before NULLFANG; deliberate hold-to-purify; guardians freed, not killed; Alpha optional.
- Keep tutorial movement forward: repair monument immediately after entering Ratchet's booth area; no mandatory backtracking. Clearly identify pickups, pod purpose, next objective and why each step occurs. Use letter-by-letter reveal with skip-first/advance-second.
- Every cave/side quest must prove ordinary-input offer -> readable landmark -> action -> distinct reward -> visible consequence -> return/reload. Preserve early-find memory and make the post-forge quarry return visibly different.
- Prove Ratchet and Servo natural wake, identity/purpose, acquisition, exactly-once consequence, return and reload. Enlarge/clarify inactive NPCs where needed without changing hitboxes blindly.
- Run one cleared-storage uninterrupted ordinary-input campaign to B1 without injected flag/item/save/position/progress/room/teleport, then a second mandatory-route run explicitly skipping Alpha.

BOSS PURIFICATION RITUAL
- At final boss HP, do not kill. Enter a safe purification-ready state and show one contextual hold button.
- While held: hero raises the earned white marble sword; white snow-like flakes gather from the scene into the blade; glow builds; release/cancel semantics are explicit.
- Completion: cinematic slash; white flash; target-white frames; bounded hit-stop/shake; fade to black; play the identity-locked ritual; black/red viral motes extract from boss into the sword and neutralize; boss returns friendly/golden; fade picture and music smoothly back to gameplay. Never cut music abruptly.
- Save/reward/state transition must be atomic and once-only across skip, retry, interruption and reload.
- Preserve accepted assets/video/purify_glitch_ritual.mp4 (1280x720, 13.25 s). Create only the missing current-contract Brood, Atlas, Zero and Prism films; do not relabel legacy 960x540 clips.

MANHWA AND CINEMATICS
- Create a literal 40-row Draft 3 parity ledger: page, cast, props/equipment, exact action, room/runtime keys, VFX/audio, trigger, gameplay-size capture and owner verdict. The 32 revised pages and 43 gameplay shots do not by themselves prove parity.
- Insert relevant manhwa slices at story/level transitions as authored narrative beats, with readable progressive text and skip handling. Do not interrupt control unpredictably.
- Produce/restage only genuinely missing or rejected pages. Preserve accepted compositions and character identity.

ART-SPECIFIC CORRECTIONS
- Mask-correct m_down boss infection eyes from red/pink to boss purple; preserve every unrelated pixel.
- Turn off only the inactive background Servo indicators in r_cell; preserve composition and lighting.
- Correct only the off-model tall/long-limbed rear hero in passage_b to the compact approved silhouette.
- Create identity-locked, floor-anchored wolfDown4 and cheetahDown4 down/breathe/recover strips; current wolf_crouch4 is not that family. Cure clears eyes/trails immediately.
- Clean sage/walk8 grey matte remnants without changing identity, cell geometry or anchors.

MOTION, WORLD AND UI
- Remove wall-clock dependence from visible gait. Equal state/distance/direction/velocity must render identically at 30/60/120 Hz while idle, airborne, turn and telegraph clocks remain animated.
- Profile roomcache three times; repair historical 114 ms crossing and 2,998 ms bake spike without raising budgets. Rerun terrainrun and bosspace.
- Add real keyboard/controller/touch Memory Node evidence: demonstration input never enters the answer; misses retry; Back/re-entry/reload work; reward occurs once.
- Bound overlays/toasts/captions with deterministic priority, dedupe, capacity and retirement. Never silently evict unread narrative; remove decorative duplicates first.
- Complete localization from the authoritative tables: base keys en 619, ar 600, tr/zh/ru 215; STORY_DRAFT2 en/ar 20 and tr/zh/ru 0; STORY_ORDER all 43. Validate English, Arabic, Turkish, Chinese and Russian for glyphs, wrap, RTL/CJK/kinsoku, reveal/debounce, reduced motion, safe areas and skip-first/advance-second on desktop and phone.

FINITE INFECTION-EYE VFX
- Preserve red ordinary infection and purple boss/Sage/Alpha/Gravehorn infection.
- Preserve current-frame transformed anchors, body-travel world-space emission, fixed simulation, 1.125-1.875 s life, caps 90/170/260/320, >90 px discontinuity clear, cure/death/removal/teleport/room cleanup, duplicate suppression and reduced-motion glow-only.
- Run infection-eyes, infection-roster and complete pose/facing sweeps on one pinned build. Add physical low/mid/high frame-time, pool, memory, thermal and post-cure/reload counts. The trail must be short smoky light, never an indefinite line.

VERIFICATION AND HANDOFF
- Obtain pinned executable Chromium. Record version, fonts/glyph preflight, WebGL/canvas environment, source SHA/tree, BUILD_ID, served identity, commands, exits, durations, logs and gameplay-size captures.
- Run node build.cjs; node tools/pack-www.cjs; python -m unittest tools.studio.test_audit -v; all affected isolated contracts; desktop/phone opening order; complete cave/NPC/boss/VFX suites; and fresh campaign-ch1.
- Distinguish staged tests from the two uninterrupted campaigns and from physical-device checks in the report.
- Do not weaken assertions, erase retained failures, hide blocked scope, overwrite unrelated changes, merge main or deploy.
- Push only a new integration branch for review. Production stays HOLD until every P1 gate, both clean B1 campaigns, exact evidence integrity, gameplay-size visual acceptance and required physical-device checks are green.
```
