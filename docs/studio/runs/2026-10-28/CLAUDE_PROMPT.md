# Copyable Claude integration prompt

```text
You are the senior implementation owner for zaferdajani/HZD-99. Integrate and act on the October 28 studio review without replacing main, merging production, or deploying.

SOURCE OF TRUTH
- Review branch: codex/studio-review-2026-10-28
- Read completely:
  - docs/studio/runs/2026-10-28/REPORT.md
  - docs/studio/runs/2026-10-28/DESIGN.md
  - docs/studio/runs/2026-10-28/ART.md
  - docs/studio/runs/2026-10-28/ENGINEERING.md
  - docs/studio/runs/2026-10-28/AUTOMATED-INTERRUPTION.md
  - docs/STORY_CANON.md
  - docs/studio/PIPELINE.md
  - docs/studio/roles.json and every referenced role file
- Preserve all unrelated main changes, especially main's .claude/skills/founder-* files. The review history does not contain that commit. Merge/rebase selectively; never replace main with the review tree.
- Do not regenerate or overwrite approved hero, Alpha/pack, crystal, purifier sword, NULLFANG, or Talon assets.
- Do not relabel the older Atlas/Brood/Zero/Prism clips as the current purification ritual. Only Glitch currently has an accepted mapped ritual film.

FIRST INTEGRATE THE BOUNDED EVIDENCE-DRIVER FIX
- Bring in tests/campaign-ch1.cjs and tests/campaign-contract.cjs from the review branch.
- The fix retains failed traversal-edge penalties by room/layout signature across recovery rebuilds, bounded to 32 model signatures, 64 edges per signature, and penalty 6.
- It changes no production gameplay, geometry, physics, save, story, art, or VFX.
- Keep the new persistence/isolation/bounds contract checks.
- Evidence: a game-written CV1B pod checkpoint diagnostic escaped the historical CV2 x=672/x=744 loop and crossed CV2 -> CV3 at 05:21 using keyboard input only. This is diagnostic evidence, not full campaign certification.

P1 ENGINEERING — DIAGNOSE BEFORE POLISH
1. Held input: combat-impact-input fails in aggregate and isolation because held KeyX never reaches the 0.6-second charge threshold while the normal tap path passes. The clean campaign also repeatedly held F in Ratchet's forced heal lesson from 07:09 to 40:04 without restoring a core, despite 99 volts. Diagnose shared input/clock/focus ownership before treating these as separate tuning problems. Do not weaken thresholds or inflate waits to make tests green. Prove tap, hold, release, heal, burst damage, contact/release audio, finite metal particles, and no duplicate hit.
2. Gravehorn: fresh aggregate and isolated mechanics are red. Intro dialogue/name card does not advance reliably; charge/missile chains and recoveries fail; phase two is not reached; the isolated harness timed out. Fix the actual state/clock/fixture defect while preserving tells, damage, parry, collision, phase logic, reward, and no-kill story. Require three clean integrity-valid passes.
3. Enemy gait: enemygait reproduces 39 changed pixels at identical traveled distance when only wall-clock time changes. Remove the wall-clock dependency without altering authored distance banking, facing, planted feet, or airborne plates.
4. Opening: opening-order fails at A0/A0B after ~490 seconds while the separate clean campaign naturally completed Ratchet's repair and explanation. Replace global-window ambiguity with semantic state-bound actions, per-step watchdogs, and diagnostics. No blind sleeps, progress injection, or position injection. Require three clean desktop and phone-size runs to Servo. Phone-size keyboard is not physical touch certification.
5. UI/i18n: textreveal reproduces Chinese as one line (467 px in a 548 px box) instead of at least two. Find the font/measurement/wrap cause. Preserve Arabic RTL, five-language cards, gradual reveal, one-press reveal-vs-dismiss, pause semantics, and reduced motion.
6. Performance: investigate roomcache's 114 ms crossing and 2998 ms bake-ahead frame plus terrainrun/bosspace timeouts. Reproduce on a stable host and physical low/mid/high-tier devices before changing budgets.

P1 ART / BOSS PRESENTATION
- Replace Gravehorn's translucent procedural silhouette with the approved-quality fourteen-part gunmetal/bronze rig: both facings, planted hooves, full joint overdraw, separate horn sockets/weapons, phase-two armor separation, down/retreat continuity, and gh_intro_a, gh_intro_b, gh_phase2, gh_down intercuts tied to real triggers. Do not alter mechanics to compensate for art.
- At gameplay size, verify anticipation, contact, recovery, floor anchors, silhouette, purple boss eyes, finite world-space trails, and continuity across phase/down/retry.
- Do not use another creature's body while art loads.

P2 ART / CINEMATIC / STORY
- Create wolfDown4 and cheetahDown4 four-cell down/breathe/recover strips; keep identity, floor line, visible chest breath, and immediate infection-eye cleanup on cure.
- Create Furnace breath/blast/spent/gather/dive/bell plates using its own identity and existing timing/collision/damage.
- Author the hero purifier raise -> hold/gather -> slash -> recover body strip with continuous paw/hilt contact, both facings, interrupted-hold recovery, and no early reward.
- Create four identity-specific current-contract ritual films (Brood, Atlas, Zero, Prism): earned hero and sword visible; white flakes gather; cinematic slash; black-red corruption leaves the living boss and is absorbed/neutralized by the blade; same guardian returns friendly/golden; picture and audible music fade out cleanly with no hard cut. Wire each to its actual guardian and preserve skip/retry/atomic-save behavior.
- Build the forty-row Draft 3 parity ledger: every page's visible cast, props, earned equipment, literal physical action, VFX, audio, runtime trigger, and gameplay-size capture. Produce/restage the missing required pages rather than claiming parity from sequence IDs.
- Make masked local corrections only: m_down boss eyes purple, r_cell inactive Servo unlit, passage_b rear hero compact/round. Preserve framing, lighting, props, Ratchet, and unrelated pixels.

MISSION / CAMPAIGN ACCEPTANCE
- Preserve canon exactly: Mother song hacked; hero protected by sleep; letter before battery; Ratchet's own battery repair; protective marble explanation; spare cell for Servo; pod save/recharge instruction; raw marble before forge; white purifier sword before Sage; CHIME before NULLFANG; deliberate hold-to-purify; no killing; Alpha optional.
- Keep forward tutorial flow and meaningful caves. Do not move the monument backward or make the player backtrack to learn it.
- Prove optional Alpha and cave returns through ordinary-input offer -> discovery -> rescue -> reward -> reload, and separately prove mandatory B1 completion without Alpha.
- The October 28 clean campaign completed Ratchet, pod, and Volt Pack purchase, then timed out in the forced held-F heal lesson. Fix the actual lesson/input cause and run a fresh uninterrupted cleared-browser campaign to B1 using ordinary input only. A checkpoint run is diagnostic and cannot certify the campaign.

EYE VFX ACCEPTANCE
- Preserve red ordinary infected eyes and purple bosses/Sages/Alpha; current-frame transformed anchors; world-space body-motion trails; 1.125–1.875 s lifetime; 90/170/260/320 caps; >90 px discontinuity clear; clear on cure/death/removal/teleport/room change; reduced motion glow-only.
- October 28 aggregate core/roster passed but isolated reruns timed out and the 105-pose sweep timed out. Obtain stable green core, roster, and pose results, then physical-device frame-time/memory/thermal/post-cure counts.

VERIFICATION AND HANDOFF
- Run node build.cjs, node tools/pack-www.cjs, python -m unittest tools.studio.test_audit -v, the affected isolated harnesses, opening-order, and one fresh campaign-ch1.
- Record exact commands, exit codes, durations, served-build identity, browser/font/WebGL preflight, logs, screenshots at gameplay size, and staged-vs-real-input labels.
- Do not call a timeout a pass. Do not call a checkpoint diagnostic a campaign certificate. Do not call source presence visual acceptance.
- Update the report with before/after evidence and unresolved physical-device scope.
- Push only a new integration branch for review. Do not merge main and do not deploy production until all P1 gates and the clean B1 campaign are green.
```

