# Copyable Claude integration prompt

```text
You are the senior implementation owner for zaferdajani/HZD-99. Integrate and act on the October 31 studio review on a new integration branch. Do not merge main and do not deploy.

SOURCE OF TRUTH
- Review branch: codex/studio-review-2026-10-31
- Production base: main@7da3c87e6b43a2357a2f52080814ae1d6adad618
- Read completely:
  - docs/studio/runs/2026-10-31/REPORT.md
  - docs/studio/runs/2026-10-31/automated/results.json
  - docs/studio/runs/2026-10-31/automated/log-integrity.json
  - docs/studio/runs/2026-10-31/automated-integrity-fail/log-integrity.json
  - docs/STORY_CANON.md
  - docs/CAVES_CH1.md
  - docs/studio/PIPELINE.md
  - docs/studio/roles.json and every referenced role file
- Start from latest main. Selectively integrate review changes; do not replace main with an older review tree.
- Preserve approved hero, NULLFANG, Alpha/pack, sword, crystal, Sage, Talon, NPC and completed beast artwork. Do not regenerate completed assets merely to create a change.

EVIDENCE RULES
- The final full collector accounted for 196/196 harnesses: 31 source/non-browser passes and 165 browser-dependent BLOCKED results because Chromium was absent. Build/package, start/end served identity and log integrity passed. This is not a staged-browser or gameplay certificate.
- One earlier post-fix run detected a real repair-lifecycle.log mutation and failed integrity; it is preserved separately. Do not rewrite or promote it.
- Keep source contracts, staged browser harnesses, checkpoint diagnostics, uninterrupted ordinary-input campaigns, gameplay-size stills and physical-device evidence separate.
- Blocked, timeout, source presence, viewport emulation and checkpoint results are never gameplay passes.

INTEGRATE THESE BOUNDED FIXES FIRST
1. Rescued Sage motion:
   - moving purified Sage uses distance-driven sageWalk8 with purified material;
   - stopped purified Sage returns to sagePure;
   - retain tests/sage-walk-contract.cjs and tests/sage-walk.cjs.
   - Browser acceptance: natural purification -> walk -> stop/turn -> leave/return -> save/reload, planted feet, no hostile regression.
2. Quest payout idempotency:
   - questPay() must no-op after done;
   - replayed callback must retain exactly 60 scrap/10 IQ, one inventory removal, one persist/win/burst and unchanged save on replay;
   - retain quest-payment-contract.
3. Gravehorn infection class:
   - ordinary infected eyes red; every boss/Sage/Alpha/Gravehorn purple;
   - keep Gravehorn procedural core/halo #ba5cff and transformed current-frame anchor;
   - keep hazard/nozzle red separate;
   - authored plates contain eye apertures with no baked emission;
   - render all states/facings and prove no red core inside purple smoke.
4. Alpha canon:
   - Alpha stays an optional A2 depth-door branch after the Purifier;
   - mandatory A2 -> A3 -> A4 and B1 never require Alpha;
   - preserve alpha-optional-contract and align any stale comments/prose.
5. Retain the fail-closed browser preflight and same-byte log snapshot/integrity safeguards in tools/studio/audit.py plus all 10 audit unit tests.

P1 — FIX HELD INPUT BEFORE POLISH
- Latest applicable real-input evidence: tap hit works; 950 ms held attack never reaches the 0.6 s charge; mandatory heal held with 99 volts and 6/7 cores until campaign timeout.
- Diagnose raw keyboard/touch/controller state -> inD -> fixed-step dt -> chargeT/healT, including focus, visibility, overlays and tutorial ownership.
- Do not lower 0.6/0.85 thresholds, auto-complete, inject progress or add blind waits.
- Acceptance: three clean real-event runs per input family proving tap, uninterrupted hold, release, blur/cancel, charged damage, exact heal cost, one restored core, one lesson advance, finite hit VFX/audio/knockback/freeze/shake and reload continuity.

P1 — GRAVEHORN MECHANICS AND ART
- Repair intro/name card, charge/jump, parry, missile/horn return, recovery, phase two, rear kick, chained charge, defeat/retreat and retry without changing telegraphs, collision, damage, parry, raw-marble reward or no-kill semantics.
- Require three consecutive full mechanics passes and ordinary-input CV1B -> CV3 win/death/retry.
- Replace the translucent procedural stand-in with the queued authored gunmetal/bronze rig: both facings, planted hooves, complete joint overdraw, separate horns/sockets, phase-two separation and defeat/retreat.
- Trigger gh_intro_a, gh_intro_b, gh_phase2 and gh_down at actual encounter beats. Do not borrow another creature body or modify mechanics to fit art.

CAMPAIGN, STORY AND CAVES
- Preserve canon: Mother's harmony song is hacked; the sleeping hero avoids it; letter before battery; Ratchet removed his cell; protective marble explanation; repair puzzle; pod save/recharge; Volt Pack; raw marble before forge; white Purifier before Sage; CHIME before NULLFANG; deliberate hold-to-purify; guardians freed, not killed; Alpha optional.
- Keep tutorial movement forward; no mandatory backtracking to the monument.
- Every optional cave must prove ordinary-input offer -> landmark -> action -> distinct reward -> visible consequence -> return/reload.
- Run one cleared-storage uninterrupted ordinary-input campaign to B1 with no flag, inventory, save, position, progress, room or teleport injection, then a second mandatory run that explicitly skips Alpha.

COMBAT, WORLD AND UI
- Remove wall-clock dependence from visible gait. Equal state and traveled distance must render identically at 30/60/120 Hz while preserving foot banking and airborne plates.
- Profile roomcache three times; fix the 114 ms crossing and 2998 ms bake-ahead spike without raising budgets. Rerun terrainrun and bosspace.
- Add a real keyboard/controller/touch Memory Node test: demonstration copies never enter the answer, misses retry in place, Back/re-entry and reload work, success rewards once. Decide whether phone demonstration taps echo or are clearly locked.
- Render directional arrows/keycaps at W1/W2/A0/A0B for left/right/up, backtracking, remaps, phone safe areas and reload.
- Bound toast/overlay queues with deterministic priority, dedupe, capacity and retirement while preserving narrative/reward order and paused lifetimes.
- Validate 21/22 px dialogue/captions in English, Arabic, Turkish, Chinese and Russian on desktop and phone: no clipping, correct RTL/CJK shaping, reveal/debounce, reduced motion and skip/next behavior.

ART, MANHWA AND PURIFICATION
- Create a literal 40-row Draft 3 parity ledger: cast, props/equipment, exact action, VFX, audio, trigger, gameplay-size capture and owner verdict per page.
- Produce/restage missing pages through owner approval; do not treat IDs or source presence as parity.
- Create identity-locked wolfDown4 and cheetahDown4 four-cell down/breathe/recover strips with floor anchors and immediate eye-trail cleanup after cure.
- Create current-contract ritual films for Brood, Atlas, Zero and Prism. Preserve the accepted Glitch film. Each needs earned hero/sword, white gather, single slash, black-red extraction into sword, neutralization, same guardian restored friendly/golden, smooth picture and audible music fade, skip/retry and atomic save/reward. Do not relabel legacy clips.
- Make masked local corrections only: m_down boss eyes purple; r_cell inactive Servo indicators off; passage_b rear hero compact/on-model. Preserve dimensions, framing, light, props and unrelated pixels.

EYE VFX ACCEPTANCE
- Preserve current-frame transformed anchors, world-space body-travel emission, fixed simulation clock, 1.125-1.875 s lifetime, 90/170/260/320 caps, >90 px discontinuity clear, cure/death/removal/teleport/room cleanup, duplicate suppression and reduced-motion glow-only.
- Pass infection-eyes, infection-roster and complete pose sweep on one pinned build. Add low/mid/high physical-device frame time, pool, memory, thermal and post-cure/reload counts.

VERIFICATION AND HANDOFF
- Use executable Chromium and record exact version, font/glyph preflight, WebGL, source SHA, BUILD_ID, served identity, commands, exits, durations, logs and gameplay-size captures.
- Run: node build.cjs; node tools/pack-www.cjs; python -m unittest tools.studio.test_audit -v; all affected isolated harnesses; opening-order desktop and phone; and one fresh campaign-ch1.
- Do not weaken assertions or omit blocked scope. Preserve completed art and unrelated changes.
- Push only a new integration branch for review. Do not merge main and do not deploy until every P1 gate and the clean B1 campaign are green.
```

