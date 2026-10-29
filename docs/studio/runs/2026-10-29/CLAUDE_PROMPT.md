# Copyable Claude integration prompt

```text
You are the senior implementation owner for zaferdajani/HZD-99. Integrate and act on the October 29 studio review on a new review/integration branch. Do not replace main, merge production, or deploy.

SOURCE OF TRUTH
- Review branch: codex/studio-review-2026-10-29
- Read completely:
  - docs/studio/runs/2026-10-29/REPORT.md
  - docs/studio/runs/2026-10-29/automated/results.json
  - docs/studio/runs/2026-10-29/reruns/browser-preflight/results.json
  - docs/studio/runs/2026-10-29/reruns/source-contracts/results.json
  - docs/STORY_CANON.md
  - docs/studio/PIPELINE.md
  - docs/studio/roles.json and every referenced role file
- main is 573d09d48d6278cf1afb51f66db3d9d014bafefe. Preserve its unrelated .claude/skills/founder-* files; never replace main with the review tree.
- There is no new production-game/art delta after October 28. Do not regenerate or overwrite approved hero, Alpha/pack, crystal, purifier sword, NULLFANG, Talon, or completed beast locomotion/attack assets.

FIRST INTEGRATE THE BOUNDED REVIEW-TOOL FIX
- Selectively bring in tools/studio/audit.py and tools/studio/test_audit.py.
- The collector now identifies harnesses that directly require Playwright and records missing/non-executable Chromium as BLOCKED before launch while still running non-browser contracts.
- Preserve the two new unit tests. This is evidence infrastructure only; it must not change gameplay, story, saves, physics, production art, or built pages.
- Evidence: python -m unittest tools.studio.test_audit -v passes 10/10; the corrected browser subset is integrity-valid and blocked; the source-contract subset passes with both served-identity gates and log integrity true.

P1: FIX HELD INPUT BEFORE POLISH
- October 28 real-keyboard evidence showed a normal claw tap working while holding KeyX for 950 ms never reached the 0.6 s charged threshold. The clean campaign separately held F in Ratchet's required heal lesson from 07:09 to 40:04 with 99 volts and remained at 6/7 cores.
- Diagnose these as a potentially shared input/clock/focus/overlay ownership defect: raw keyboard state -> inD -> fixed-step dt -> chargeT/healT -> release/commit. Inspect visibility/focus clearing and lesson overlay ownership.
- Do not shorten thresholds, auto-complete the lesson, inject progress, or add blind waits.
- Acceptance: three integrity-valid real-input runs proving tap, uninterrupted hold, release, charged damage, ordinary/heavy contact audio, finite metal/screw particles, knockback, freeze/shake ownership, heal cost, exactly one restored core, no duplicate hit, and lesson progression; then one fresh campaign continuation.

P1: REPAIR GRAVEHORN MECHANICS AND PRESENTATION INDEPENDENTLY
- Freshest mechanics evidence remains red: intro/name-card progression, missile/charge chains, recoveries, horn return, phase two, kick impact and chained charge failed before timeout.
- Find the actual state/clock/fixture defect without changing tells, collision, damage, parry windows, rewards, or no-kill story.
- Replace the translucent procedural stand-in with the queued fourteen-part gunmetal/bronze rig: both facings, planted hooves, full joint overdraw, separate horn sockets/weapons, phase-two separation, down/retreat continuity. Add gh_intro_a, gh_intro_b, gh_phase2 and gh_down tied to real triggers.
- Require three clean mechanics passes plus gameplay-size idle/tell/contact/recovery/phase/down/retry captures. Never borrow another creature's body.

P1/P2 ENGINEERING
- Remove wall-clock dependence from visible enemy gait. Equal traveled distance and state must render identically regardless of performance.now, preserving facing, authored distance banking, planted feet and airborne plates.
- Reproduce roomcache three times on one pinned host. Profile the 114 ms crossing and 2998 ms bake-ahead slice; do not simply raise budgets. Re-run terrainrun and bosspace, then profile physical low/mid/high-tier devices.
- Preserve the bounded campaign route-memory fix from October 28. The CV1B checkpoint diagnostic crossing CV2->CV3 is diagnostic only; do not change CV2 geometry without human or clean-campaign reproduction.
- Chinese text: validate the production font and kinsoku behavior with a genuinely over-width sample. The previous fixture fit as one 467 px line in a 548 px box; do not add arbitrary line breaks merely to satisfy a mistaken expectation.
- Add a finite deterministic toast priority/dedupe/cap/retirement policy while preserving paused lifetime and narrative/reward priority.

MISSION AND CAMPAIGN CONTRACT
- Preserve canon exactly: Mother's harmony song is hacked; the sleeping hero avoids infection; letter before battery; Ratchet removed his own cell; protective marble explanation; spare cell for Servo; pod save/recharge instruction; raw marble before forge; white purifier sword before Sage; CHIME before NULLFANG; deliberate hold-to-purify; bosses are freed, not killed; Alpha remains optional.
- Keep tutorial progression moving forward. The monument remains just after Ratchet's booth, never behind the player as mandatory backtracking.
- Prove each meaningful cave via ordinary-input offer -> landmark -> discovery/action -> reward -> visible consequence -> return/reload. Separately prove mandatory B1 completion without Alpha and optional Alpha offer -> discovery -> rescue -> friendly pack/reward -> reload.
- Run one fresh uninterrupted cleared-browser ordinary-input campaign to the B1 teaser. No inventory, flag, position, progress, save, or teleport injection. A checkpoint diagnostic cannot certify the campaign.

ART, MANHWA, AND PURIFICATION
- Build the literal forty-row Draft 3 parity ledger. For every page record visible cast, props, earned equipment, exact body action, VFX, audio, runtime trigger and gameplay-size capture. Produce/restage missing pages or revise them through the approved story process; sequence IDs and displayed panels are not parity.
- Create wolfDown4 and cheetahDown4 four-cell down/breathe/recover strips using the existing identities and floor line. Show visible chest breath and deliberate return; clear infected eyes/smoke immediately on cure.
- Add only Furnace's missing identity-specific breath, blast, spent, gather, dive and bell plates; preserve existing timing, collision and damage.
- Author the hero purifier raise -> hold/gather -> slash -> recover body strip with continuous paw-to-hilt contact, both facings, interrupted-hold recovery and no early reward.
- Create current-contract identity-specific ritual films for Brood, Atlas, Zero and Prism. Show earned hero/sword; white flake gathering; purifier slash; black-red corruption leaving the living guardian; sword absorption/neutralization; same guardian friendly/golden; clean picture and audible music fade to silence with no hard cut. Preserve skip/retry/atomic-save behavior. Only Glitch currently has an accepted mapped ritual film; do not relabel older clips.
- Make masked local corrections only: m_down boss eyes purple, r_cell inactive Servo unlit, passage_b rear hero compact/on-model. Preserve every unrelated pixel, framing, light and prop.

EYE VFX ACCEPTANCE
- Preserve red ordinary infected eyes and purple bosses/Sages/Alpha; anchors transformed from the currently drawn frame; world-space body-travel trails; randomized 1.125-1.875 s lifetime; 90/170/260/320 caps; >90 px discontinuity clear; cleanup on cure/death/removal/teleport/room change; reduced-motion glow-only.
- Obtain integrity-valid infection-eyes, infection-roster and complete 105-pose results on one pinned build, then physical low/mid/high-tier frame-time, memory, thermal and post-cure particle counts.

VERIFICATION AND HANDOFF
- Use an executable Chromium and record browser version, glyph/font preflight, WebGL, served-build identity, exact commands, exit codes, durations, logs and gameplay-size screenshots.
- Run node build.cjs; node tools/pack-www.cjs; python -m unittest tools.studio.test_audit -v; the affected isolated harnesses; opening-order desktop and phone-size; and one fresh campaign-ch1.
- Keep source contracts, staged browser harnesses, checkpoint diagnostics, uninterrupted real-input playthroughs and physical-device tests explicitly separate.
- Do not call blocked, timeout, source presence, viewport emulation, or a checkpoint diagnostic a gameplay pass.
- Push only a new integration branch for review. Do not merge main and do not deploy until all P1 gates and the clean B1 campaign are green.
```
