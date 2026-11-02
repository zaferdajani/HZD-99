# Copyable Claude integration prompt

```text
You are the senior implementation owner for zaferdajani/HZD-99. Integrate and act on the November 2 studio review on a new integration branch. Do not merge main and do not deploy.

SOURCE OF TRUTH
- Review branch: codex/studio-review-2026-11-02
- Production base: main@7da3c87e6b43a2357a2f52080814ae1d6adad618
- Read completely:
  - docs/studio/runs/2026-11-02/REPORT.md
  - docs/studio/runs/2026-11-02/automated/results.json
  - docs/studio/runs/2026-11-02/automated/log-integrity.json
  - docs/studio/runs/2026-11-02/automated-integrity-fail/log-integrity.json
  - docs/studio/runs/2026-11-02/automated-integrity-fail-2/log-integrity.json
  - docs/studio/runs/2026-11-02/automated-integrity-fail-3/log-integrity.json
  - docs/STORY_CANON.md, docs/CAVES_CH1.md, docs/studio/PIPELINE.md
  - docs/studio/roles.json and every referenced role file
- Start from latest main and selectively integrate review changes. Never replace main with an older review tree.
- main, odyssey and claude/clawbyte-repo-migration-byhyl8 remained at 7da3c87; the November 1 review was not integrated.
- Preserve approved hero, Alpha/pack, NULLFANG, sword, crystal, Sage, Talon, NPC and completed beast art. Do not regenerate completed assets merely to create a change.

EVIDENCE RULES
- The final collector accounted for 196/196 gameplay harnesses: 31 source/non-browser passes and 165 browser BLOCKED results because Chromium was absent. Build/package, start/end served identity and final log integrity passed. This is not a staged-browser, uninterrupted campaign or physical-device certificate.
- Three earlier executions caught late writes to tutorial-controller.log, voice-handoff.log and credits.log. They are retained separately and must never be rewritten or promoted.
- Retain the quiet-log safeguard and delayed-writer regression in tools/studio/audit.py and tools/studio/test_audit.py. Also retain browser preflight, owned-descendant cleanup, same-byte snapshots, final integrity and served identity. All 11 audit tests must pass.
- Keep source contracts, staged browser tests, checkpoint diagnostics, uninterrupted ordinary-input campaigns, gameplay-size stills and physical devices distinct. Blocked, timeout, source presence and viewport emulation are never gameplay passes.

INTEGRATE THESE BOUNDED FIXES FIRST
1. Rescued Sage: moving purified Sage uses distance-driven sageWalk8 with purified material; stopped Sage returns to sagePure. Keep both Sage contracts. Rendered acceptance is natural purification -> walk two body widths -> stop/turn -> leave/re-enter -> reload with planted feet and no hostile regression.
2. Quest payout: questPay() rejects missing/already-done quests and returns a boolean. Replayed completion must leave exactly 60 scrap/10 IQ, one removal/persist/cue/burst and byte-identical save. Keep quest-payment-contract.
3. Gravehorn infection class: ordinary infected eyes are red; boss/Sage/Alpha/Gravehorn eyes and smoke are purple. Keep core/halo #ba5cff, current-frame infEyeMark and distinct hazard/nozzle/crack/telegraph colors. Authored plates need unlit eye apertures. Prove all states/facings have no red core inside purple smoke.
4. Alpha authority: Alpha is an optional A2 depth-door branch after the Purifier; A2 -> A3 -> A4 and B1 never require it. Keep alpha-optional-contract and align stale prose/comments.

P1 — FIX HELD INPUT BEFORE POLISH
- Latest real-input evidence: tap hit works; 950 ms held attack never reaches the 0.6 s charge; mandatory 0.85 s heal stalls with 99 volts and 6/7 cores.
- Diagnose raw keyboard/touch/controller down/up -> inD -> tutorial ownership -> fixed-step chargeT/healT, including focus, visibility, overlays and release/cancel.
- Do not lower thresholds, inject progress, auto-complete or add blind waits.
- Acceptance: three clean real-event runs per input family proving tap, 950 ms hold, release, blur/cancel, charged contact/damage, exact heal cost, one restored core, one lesson advance and reload.

P1 — GRAVEHORN MECHANICS AND ART
- Use existing ghLog in a real browser and repair only the first missing/stuck transition: intro/name card, horn fire/return, charge/jump, parry, recovery, phase two, rear kick, chained charge, defeat dialogue, retreat, once-only bossHorn, death and retry. Preserve telegraphs, collision, damage, parry, raw-marble reward and no-kill semantics.
- Require three consecutive mechanics runs and ordinary-input CV1B -> CV3 win/death/retry.
- Replace the translucent procedural stand-in through the approved art workflow with the queued identity-locked gunmetal/bronze rig: both facings, planted hooves, complete joint overdraw, separate horns/sockets, phase-two separation and defeat/retreat. Do not borrow another creature body or alter mechanics to fit art.
- Trigger gh_intro_a, gh_intro_b, gh_phase2 and gh_down at their real beats.

CAMPAIGN, STORY AND CAVES
- Preserve canon: Mother's harmony song is hacked; the sleeping hero avoids it; letter before battery; Ratchet removed his own cell; inherited marble slows infection; repair puzzle; pod save/recharge; Volt Pack; raw marble before forge; white Purifier before Sage; CHIME before NULLFANG; deliberate hold-to-purify; guardians are freed, not killed; Alpha optional.
- Keep the tutorial moving forward; do not require backtracking to the monument.
- Every optional cave must prove ordinary-input offer -> landmark -> action -> distinct reward -> visible consequence -> return/reload.
- Run one cleared-storage uninterrupted ordinary-input campaign to B1 with no injected flag, item, save, position, progress, room or teleport, then a second mandatory run that explicitly skips Alpha.

COMBAT, WORLD, NPC AND UI
- Remove wall-clock dependence from visible gait. Equal state/distance/direction/velocity must render identically at 30/60/120 Hz while idle, airborne and telegraph clocks remain animated.
- Profile roomcache three times; repair the historical 114 ms crossing and 2998 ms bake-ahead spike without raising budgets. Rerun terrainrun and bosspace.
- Prove Ratchet and Servo wake, purpose, quest completion, post-quest behavior, return and reload. Payment must remain once-only.
- Add real keyboard/controller/touch Memory Node evidence: demonstration input never enters the answer; misses retry in place; Back/re-entry/reload work; success rewards once.
- Validate arrows/keycaps at W1/W2/A0/A0B for direction, backtracking, remaps, phone safe areas and reload.
- Bound overlay/toast/caption presentation with deterministic priority, dedupe, capacity and retirement. Never silently delete unread narrative; decorative toasts evict first.
- Validate English, Arabic, Turkish, Chinese and Russian on desktop/phone: font coverage, no clipping, correct RTL/CJK shaping, reveal/debounce, reduced motion and skip-first/advance-second.

ART, MANHWA AND PURIFICATION
- Create a literal 40-row Draft 3 parity ledger: cast, props/equipment, exact action, VFX, audio, trigger, gameplay-size capture and owner verdict. Source presence/event IDs are not parity.
- Produce or restage only genuinely missing/rejected pages through owner approval.
- Create identity-locked wolfDown4 and cheetahDown4 floor-anchored down/breathe/recover strips; eyes/trails clear immediately after cure.
- Clean sage/walk8 grey matte remnants without changing identity, cell geometry or floor anchors; verify the integrated gait at gameplay size.
- Preserve accepted Glitch film. Create current-contract Brood, Atlas, Zero and Prism films with earned hero/sword, white gather, one slash, black-red extraction, neutralization, the same guardian restored friendly/golden, smooth picture and audible music fade, skip/retry and atomic save/reward. Do not relabel legacy clips.
- Make masked local corrections only: m_down boss eyes purple; r_cell inactive background Servo indicators off; passage_b rear hero compact/on-model. Preserve dimensions, framing, light, props and unrelated pixels.

EYE VFX ACCEPTANCE
- Preserve current-frame transformed anchors, world-space body-travel emission, fixed simulation, 1.125-1.875 s lifetime, 90/170/260/320 caps, >90 px discontinuity clear, cure/death/removal/teleport/room cleanup, duplicate suppression and reduced-motion glow-only.
- Pass infection-eyes, infection-roster and the complete pose sweep on one pinned build. Add low/mid/high physical-device frame-time, pool, memory, thermal and post-cure/reload counts.

VERIFICATION AND HANDOFF
- Obtain executable pinned Chromium. Record exact version, font/glyph preflight, WebGL/canvas environment, source SHA, BUILD_ID, served identity, commands, exits, durations, logs and gameplay-size captures.
- Run node build.cjs; node tools/pack-www.cjs; python -m unittest tools.studio.test_audit -v; all affected isolated harnesses; desktop/phone opening order; and a fresh campaign-ch1.
- Do not weaken assertions, erase any of the three retained integrity failures, hide blocked scope or overwrite unrelated changes.
- Push only a new integration branch for review. Do not merge main and do not deploy until every P1 gate and the clean B1 campaigns are green.
```
