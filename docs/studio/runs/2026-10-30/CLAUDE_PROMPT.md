# Copyable Claude integration prompt

```text
You are the senior implementation owner for zaferdajani/HZD-99. Integrate and act on the October 30 studio review on a new integration branch. Do not replace main, merge production, or deploy.

SOURCE OF TRUTH
- Review branch: codex/studio-review-2026-10-30
- Read completely:
  - docs/studio/runs/2026-10-30/REPORT.md
  - docs/studio/runs/2026-10-30/automated/results.json
  - docs/studio/runs/2026-10-30/automated/log-integrity.json
  - docs/STORY_CANON.md
  - docs/studio/PIPELINE.md
  - docs/studio/roles.json and every referenced role file
- main remains 573d09d48d6278cf1afb51f66db3d9d014bafefe. Preserve its unrelated .claude/skills/founder-* files; never replace main with the review tree.
- There is no production-game, story, art, cinematic or VFX delta after the October 29 review. Do not regenerate or overwrite the approved hero, NULLFANG, Alpha/pack, crystal, purifier sword, Talon, Sage or completed beast locomotion/attack artwork.

EVIDENCE RULES
- The October 30 full collector accounted for all 197 requested harnesses on one pinned served identity: 29 non-browser harnesses passed and 168 browser-dependent checks were correctly BLOCKED because Chromium was unavailable. Both identity gates and log integrity passed. This is not a gameplay certificate.
- Keep source contracts, staged browser harnesses, checkpoint diagnostics, uninterrupted real-input campaigns and physical-device evidence separate.
- Do not call blocked, timeout, source presence, viewport emulation or checkpoint evidence a gameplay pass.
- Selectively integrate the October 29 browser-preflight fix from tools/studio/audit.py and tools/studio/test_audit.py if your branch does not already contain it. Preserve its unit tests and execute bit.

P1 — FIX HELD INPUT BEFORE POLISH
- The latest real-keyboard evidence shows a normal claw tap works, but holding KeyX for 950 ms never reaches the 0.6-second charged threshold. The uninterrupted campaign separately held F in Ratchet's mandatory heal lesson with 99 volts and 6/7 cores from 07:09 until timeout without healing.
- Diagnose both symptoms together through raw key state -> inD -> fixed-step dt -> chargeT/healT, including focus, visibility, overlays and lesson ownership.
- Do not reduce the 0.6/0.85 thresholds, auto-complete the lesson, inject progress or add blind sleeps.
- Acceptance: three integrity-valid real-input runs proving tap, uninterrupted hold, release, charged damage, finite metal/screw particles, contact/release audio, knockback, freeze/shake ownership, heal cost, exactly one restored core, exactly one lesson advance and save/load continuity.

P1 — GRAVEHORN MECHANICS AND ART
- The newest mechanics evidence fails intro/name-card progression, charge/missile chains, recoveries, horn return, phase two, rear-kick impact and chained charge before timeout.
- Find the actual state/clock/fixture defect without changing telegraphs, collision, damage, parry windows, phase gates, raw-marble reward or no-kill story. Require three clean full-mechanics passes.
- Replace the translucent procedural stand-in with the queued fourteen-part gunmetal/bronze rig: both facings, planted hooves, complete joint overdraw, separate horn/socket parts, phase-two separation and down/retreat continuity. Add gh_intro_a, gh_intro_b, gh_phase2 and gh_down tied to actual encounter triggers. Do not borrow another body or alter mechanics to compensate for art.

P1/P2 ENGINEERING
- Remove wall-clock dependence from visible enemy gait. Equal state and traveled distance must render identically regardless of performance.now while preserving facing, authored distance banking, planted feet and airborne plates.
- Reproduce roomcache three times on one pinned host. Profile the 114 ms crossing and 2998 ms bake-ahead slice; divide the work rather than raising budgets. Re-run terrainrun and bosspace, then profile physical low/mid/high devices.
- Preserve the bounded campaign route-memory fix. Its CV1B checkpoint crossing into CV3 is diagnostic only; do not change CV2 geometry without clean-campaign or human reproduction.
- Validate Chinese wrapping with the production CJK font and a genuinely over-width sample. Preserve kinsoku, all characters, Arabic RTL, reveal/advance semantics and reduced motion; do not insert arbitrary breaks to satisfy a mistaken fixture.
- Add finite deterministic toast priority, deduplication, capacity and retirement while preserving paused lifetimes and narrative/reward priority.

CAMPAIGN AND CAVES
- Preserve canon exactly: Mother's harmony song is hacked; the sleeping hero avoids infection; letter before battery; Ratchet removed his own cell; protective marble explanation; spare cell for Servo; pod save/recharge instruction; raw marble before forge; white purifier sword before Sage; CHIME before NULLFANG; deliberate hold-to-purify; bosses are freed, not killed; Alpha remains optional.
- Keep the tutorial moving forward. The monument remains immediately after Ratchet's booth, never mandatory backtracking.
- Prove every meaningful cave with ordinary-input offer -> landmark -> discovery/action -> reward -> visible consequence -> return/reload. Separately prove mandatory B1 completion without Alpha and optional Alpha offer -> discovery -> rescue -> friendly pack/reward -> reload.
- Run one fresh uninterrupted cleared-browser ordinary-input campaign to B1 with no inventory, flag, save, position, progress or teleport injection. A checkpoint diagnostic cannot certify the campaign.

ART, MANHWA AND PURIFICATION
- Build the literal forty-row Draft 3 parity ledger. Each page needs visible cast, props, earned equipment, exact physical action, VFX, audio, runtime trigger, gameplay-size capture and verdict. Produce/restage missing pages or revise them through the approved story process; panel IDs are not parity.
- Create wolfDown4 and cheetahDown4 identity-locked four-cell down/breathe/recover strips. Preserve floor line, show chest breath and deliberate friendly recovery, and clear infection eyes/smoke immediately on cure.
- Add only Furnace's missing breath, blast, spent, gather, dive and bell plates using its existing identity and mechanics.
- Author the purifier hero raise -> hold/gather -> slash -> recover body performance with both facings, continuous paw-to-hilt contact, interrupted-hold recovery and no early reward.
- Create current-contract identity-specific ritual films for Brood, Atlas, Zero and Prism: earned hero/sword; white gather; purifier slash; black-red corruption leaves the living guardian; sword absorbs/neutralizes it; same guardian returns friendly/golden; picture and audible music fade smoothly to silence without a hard cut. Preserve identity mapping, skip/retry and atomic save/reward. Do not relabel older clips; only Glitch currently has an accepted mapped ritual film.
- Make masked local corrections only: m_down NULLFANG eyes purple, r_cell inactive Servo unlit, passage_b rear hero compact/on-model. Preserve every unrelated pixel, framing, lighting and prop.

EYE VFX ACCEPTANCE
- Preserve red ordinary infected eyes and purple bosses/Sages/Alpha; anchors transformed from the current drawn frame; world-space body-travel emission; fixed simulation clock; 1.125-1.875 s lifetime; 90/170/260/320 caps; >90 px discontinuity clear; cleanup on cure/death/removal/teleport/room change; duplicate suppression; reduced-motion glow-only.
- Obtain integrity-valid infection-eyes, infection-roster and complete 105-pose results on one pinned build, then physical low/mid/high-tier frame-time, pool, memory, thermal and post-cure counts.

VERIFICATION AND HANDOFF
- Use an executable Chromium. Record its version, production-font/glyph preflight, WebGL, served-build identity, exact commands, exit codes, durations, logs and gameplay-size screenshots.
- Run node build.cjs; node tools/pack-www.cjs; python -m unittest tools.studio.test_audit -v; the affected isolated browser harnesses; opening-order desktop and phone-size; and one fresh campaign-ch1.
- Update the report with before/after evidence and unresolved physical-device scope.
- Push only a new integration branch for review. Do not merge main and do not deploy until all P1 gates and the clean B1 campaign are green.
```
