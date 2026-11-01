# Copyable Claude integration prompt

```text
You are the senior implementation owner for zaferdajani/HZD-99. Integrate and act on the November 1 studio review on a new integration branch. Do not merge main and do not deploy.

SOURCE OF TRUTH
- Review branch: codex/studio-review-2026-11-01
- Production base: main@7da3c87e6b43a2357a2f52080814ae1d6adad618
- Read completely:
  - docs/studio/runs/2026-11-01/REPORT.md
  - docs/studio/runs/2026-11-01/automated/results.json
  - docs/studio/runs/2026-11-01/automated/log-integrity.json
  - docs/studio/runs/2026-11-01/automated-integrity-fail/log-integrity.json
  - docs/STORY_CANON.md
  - docs/CAVES_CH1.md
  - docs/studio/PIPELINE.md
  - docs/studio/roles.json and all referenced role files
- Start from latest main and selectively integrate review changes. Do not replace main with an older review tree.
- Production and integration refs did not move after October 31. The November 1 branch therefore carries the same verified bounded fixes forward from current main with fresh evidence.
- Preserve approved hero, Alpha/pack, NULLFANG, sword, crystal, Sage, Talon, NPC, and completed beast artwork. Do not regenerate completed assets merely to create a change.

EVIDENCE RULES
- The final supervised collector accounted for all 196 gameplay harnesses: 31 source/non-browser passes and 165 browser-dependent BLOCKED results because Chromium was absent. Build/package, start/end served identity, and final log integrity passed. This is not a staged-browser, uninterrupted campaign, or physical-device certificate.
- The first post-fix run caught weapons.log changing after capture and failed integrity. It is retained separately and must not be rewritten or promoted. A later distinct run passed integrity.
- Keep source contracts, staged browser harnesses, checkpoint diagnostics, uninterrupted ordinary-input campaigns, gameplay-size stills, and physical-device evidence separate.
- Blocked, timeout, source presence, viewport emulation, and staged state are never gameplay passes.

INTEGRATE THESE VERIFIED BOUNDED FIXES FIRST
1. Rescued Sage motion:
   - moving purified Sage uses distance-driven sageWalk8 with purified material;
   - stopped purified Sage returns to sagePure;
   - retain sage-walk-contract and sage-walk browser test;
   - browser acceptance: natural purification -> walk -> stop/turn -> leave/re-enter -> save/reload, planted feet, no hostile regression.
2. Quest payout idempotency:
   - questPay() no-ops for missing/already-done quests and returns a boolean;
   - replay retains exactly 60 scrap/10 IQ, one inventory removal, one persist/win/burst, and byte-identical save on the second call;
   - retain quest-payment-contract.
3. Gravehorn infection class:
   - ordinary infected eyes are red; every boss/Sage/Alpha/Gravehorn eye and smoke class is purple;
   - keep Gravehorn core/halo #ba5cff and the current-frame infEyeMark anchor;
   - keep hazard, missile nozzle, molten crack, and telegraph colors distinct;
   - authored plates contain an unlit eye aperture with no baked emission;
   - render all states/facings and prove no red core inside purple smoke.
4. Alpha canon:
   - Alpha remains an optional A2 depth-door branch after the Purifier;
   - mandatory A2 -> A3 -> A4 and B1 never require Alpha;
   - retain alpha-optional-contract and align stale prose/comments.
5. Retain tools/studio/audit.py fail-closed browser preflight, owned-descendant cleanup, same-byte snapshots, completion-time raw/snapshot validation, and all 10 audit unit tests.

P1 — FIX HELD INPUT BEFORE POLISH
- Latest applicable real-input evidence: tap hit works; a 950 ms held attack never reaches the 0.6 s charge; mandatory heal held with 99 volts and 6/7 cores until timeout.
- Diagnose raw keyboard/touch/controller down/up -> inD -> tutorial ownership -> fixed-step chargeT/healT, including focus, visibility, overlays, and release/cancel.
- Do not lower the 0.6/0.85 thresholds, auto-complete, inject progress, or add blind waits.
- Acceptance: three clean real-event runs per input family proving tap, uninterrupted hold, release, blur/cancel, charged contact/damage, exact heal cost, one restored core, one lesson advance, and reload continuity.

P1 — GRAVEHORN MECHANICS AND ART
- Repair intro/name card, charge/jump, parry, missile/horn return, recovery, phase two, rear kick, chained charge, defeat/retreat, death/retry, without changing intended telegraphs, collision, damage, parry, raw-marble reward, or no-kill semantics.
- Require three consecutive full mechanics passes and ordinary-input CV1B -> CV3 win/death/retry.
- Replace the translucent procedural stand-in through the approved art workflow with the queued gunmetal/bronze rig: both facings, planted hooves, complete joint overdraw, separate horns/sockets, phase-two separation, and defeat/retreat.
- Trigger gh_intro_a, gh_intro_b, gh_phase2, and gh_down at real encounter beats. Do not borrow another creature body or change mechanics to fit art.

CAMPAIGN, STORY, AND CAVES
- Preserve canon: Mother's harmony song is hacked; the sleeping hero avoids it; letter before battery; Ratchet removed his own cell; inherited marble slows infection; repair puzzle; pod save/recharge; Volt Pack; raw marble before forge; white Purifier before Sage; CHIME before NULLFANG; deliberate hold-to-purify; guardians freed, not killed; Alpha optional.
- Keep the tutorial moving forward; no mandatory backtracking to the monument.
- Every optional cave must prove ordinary-input offer -> landmark -> action -> distinct reward -> visible consequence -> return/reload.
- Run one cleared-storage uninterrupted ordinary-input campaign to B1 with no flag, item, save, position, progress, room, or teleport injection, then a second mandatory run that explicitly skips Alpha.

COMBAT, WORLD, AND UI
- Remove wall-clock dependence from visible gait. Equal state and traveled distance must render identically at 30/60/120 Hz while preserving idle, airborne, telegraph, and foot-banking behavior.
- Profile roomcache three times; fix the historical 114 ms crossing and 2998 ms bake-ahead spike without raising budgets. Rerun terrainrun and bosspace.
- Add a real keyboard/controller/touch Memory Node test: demonstration inputs never enter the answer, misses retry in place, Back/re-entry and reload work, success rewards once.
- Validate direction arrows/keycaps at W1/W2/A0/A0B for left/right/up, backtracking, remaps, phone safe areas, and reload.
- Bound toast/overlay queues with deterministic priority, dedupe, capacity, and retirement while preserving narrative/reward order and paused lifetimes.
- Validate 21/22 px dialogue/captions in English, Arabic, Turkish, Chinese, and Russian on desktop and phone: no clipping, correct RTL/CJK shaping, reveal/debounce, reduced motion, and skip/next behavior.

ART, MANHWA, AND PURIFICATION
- Create a literal 40-row Draft 3 parity ledger: cast, props/equipment, exact action, VFX, audio, trigger, gameplay-size capture, and owner verdict per page.
- Produce/restage only genuinely missing or rejected pages through owner approval; source presence or event IDs are not parity.
- Through the approved art workflow, create identity-locked wolfDown4 and cheetahDown4 down/breathe/recover strips with floor anchors and immediate eye-trail cleanup after cure.
- Clean sage/walk8 transparency/backdrop remnants without changing identity, cell geometry, or floor anchors; validate the integrated gait at gameplay size.
- Create current-contract ritual films for Brood, Atlas, Zero, and Prism. Preserve accepted Glitch. Each requires earned hero/sword, white gather, one slash, black-red extraction into the sword, neutralization, the same guardian restored friendly/golden, smooth picture and audible music fade, skip/retry, and atomic save/reward. Do not relabel legacy clips.
- Make masked local corrections only: m_down boss eyes purple; r_cell inactive background Servo indicators off; passage_b rear hero compact/on-model. Preserve original dimensions, framing, light, props, and unrelated pixels.

EYE VFX ACCEPTANCE
- Preserve current-frame transformed anchors, world-space body-travel emission, fixed simulation clock, 1.125–1.875 s lifetime, 90/170/260/320 caps, >90 px discontinuity clear, cure/death/removal/teleport/room cleanup, duplicate suppression, and reduced-motion glow-only.
- Pass infection-eyes, infection-roster, and complete pose sweep on one pinned build. Add low/mid/high physical-device frame-time, pool, memory, thermal, and post-cure/reload counts.

VERIFICATION AND HANDOFF
- Use executable pinned Chromium and record exact version, font/glyph preflight, WebGL/canvas environment, source SHA, BUILD_ID, served identity, commands, exits, durations, logs, and gameplay-size captures.
- Run node build.cjs; node tools/pack-www.cjs; python -m unittest tools.studio.test_audit -v; all affected isolated harnesses; opening-order desktop and phone; and one fresh campaign-ch1.
- Do not weaken assertions, hide the retained integrity failure, or omit blocked scope. Preserve completed art and unrelated contributors' changes.
- Push only a new integration branch for review. Do not merge main and do not deploy until every P1 gate and the clean B1 campaign are green.
```
