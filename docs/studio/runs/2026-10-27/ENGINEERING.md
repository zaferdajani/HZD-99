# Engineering discipline review — 2026-10-27

## 10. Senior Technical Director — World Systems

**Verdict:** staged world graph/cache/map checks pass; fresh continuous campaign
not certified. The route completed marble and forge, then the read-only planner
made 179 CV2 recovery attempts between x=672 and x=744 until 40:00. This does
not prove a human hard lock because staged traversal checks and the October 26
campaign pass. Diagnose the CV2 graph/input transition and repeat a fresh run.
Physical-device performance remains open.

## 11. Senior Gameplay Engineer — Combat

**Verdict:** contracts broadly pass. Combat impact, stats/damage log, held hit,
purification and finite eyes passed. Gravehorn passed aggregate plus three clean
isolated reruns; the earlier isolated nondeterminism is not reproduced on this
snapshot, so `GH-HARNESS-26` is resolved for mechanics. Gravehorn production art,
listened audio, real haptics and target-device feel remain separate gates.

## 12. Senior Gameplay Engineer — Mission

**Verdict:** mandatory flags/order remain coherent in source/staged tests, but
today's continuous certificate stops after forge. `opening-order` also fails to
reach the meadow/Servo segment on desktop and phone-size. Fix the evidence driver
with explicit repair/tutorial/transition states, not longer sleeps, deleted
assertions, injected flags or teleports. Optional Alpha and cave return loops
still need natural-input proof.

## 13. Senior Gameplay Engineer — NPC

**Verdict:** staged pass. `sageWalk8` remains active for a moving purified Sage
and `sagePure` only while stopped; `sage-walk` passed. Servo rescue is grounded,
larger than the hero and purposeful in today's continuous frame. A fresh
rescue→follow→leave→reload Sage sequence and physical touch interaction were not
reached today.

## 14. Lead UI Engineer

**Verdict:** text reveal, RTL/CJK, rotation and browser layout contracts pass;
notification density and physical touch remain open. `G.toast` still appends
without priority, dedupe or a visible cap. Gameplay frames show two center cards
at marble/Sage and reward/objective competition after NULLFANG. Implement a finite
prioritized queue with scope/text dedupe, one narrative/reward card, deterministic
expiry, overlay lifetime safety and desktop/phone RTL/CJK non-overlap tests.

## Bounded evidence-collector fix

`tools/studio/audit.py` now treats every test as an owned Linux process tree:

- process groups are stopped after normal return as well as timeout;
- Linux subreaper mode adopts detached descendants that create a new session;
- the pre-existing audit server is recorded as baseline and preserved;
- adopted children are killed/reaped before the log is captured;
- an exact-log-inode scan remains a bounded fallback where procfs permits it.

`tools/studio/test_audit.py` adds normal-child and detached-session writer
regressions. All eight unit tests pass. A real isolated audit of the two logs that
mutated in the aggregate (`input-focus`, `seam`) passes with final integrity true.
The original aggregate remains integrity false and is not rewritten into a clean
run; its two closed-file snapshots were recovered byte-for-byte with hashes in
`automated/recovered-log-integrity.json`.

## Browser/build evidence

- `npm ci`, build and package passed.
- Standard Playwright Chromium download failed because the host returned a
  zero-byte/truncated archive.
- Fallback Chromium 153 rendered nonzero Latin/CJK/Arabic widths.
- WebGL context creation failed despite SwiftShader; `bake3d` therefore failed as
  a host/browser limitation. No game art code was changed for that host fault.

