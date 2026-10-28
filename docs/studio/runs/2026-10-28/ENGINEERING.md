# Engineering review — 2026-10-28

## 11. Senior Technical Director — World Systems — HOLD

Build and pack passed: four HTML targets built; `www/` packaged 696 assets
(247.3 MB) plus two pages (8.2 MB), total 255.5 MB. Tail checks for preload, boot,
low resolution, demo boundary, platform, packs, warp, den lighting, GLB bake, and
Forge passed. Fresh `terrainrun` timed out at 300 seconds and `roomcache` failed a
114 ms crossing frame plus a 2998 ms bake-ahead frame. Physical-device frame-time,
memory, and thermal evidence remain open.

## 12. Senior Gameplay Engineer — Combat — HOLD, P1

`combat-impact-input` failed both aggregate and isolated runs: a real held `KeyX`
did not reach the 0.6-second charge threshold. The normal tap path still passed
inside the same harness. The clean campaign separately held `F` throughout the
forced heal lesson without restoring a core, despite 99 volts. These may share an
input/clock/focus cause and must be diagnosed together. `bosspace` timed out at
300 seconds. Gravehorn fresh mechanics are red. These are not cleared by passing
source contracts.

Acceptance: diagnose charge clock/input ownership under the normal loop; prove tap,
hold, release, charged damage/audio/particles on the pinned build; isolate boss
pace and Gravehorn state-clock failures; repeat three clean runs.

## 13. Senior Gameplay Engineer — Mission — bounded fix verified

Root cause of the October 27 CV2 loop was in the evidence driver, not proven game
geometry. Failed-edge penalties lived only in `model.pen`; `unstick()` called
`resetNavigation()`, and `ensureModel()` recreated an empty map. The driver could
therefore forget and alternate the same plans indefinitely.

The bounded change in `tests/campaign-ch1.cjs`:

- keeps penalties by room/layout signature across recovery rebuilds;
- caps retained model signatures at 32 and edges per signature at 64;
- caps one edge penalty at 6;
- records the failed edge before reset;
- changes no gameplay code, geometry, physics, save, or progression.

New contract checks prove persistence, signature isolation, and the 32-model bound.
The saved-checkpoint diagnostic logged retained penalties, escaped the historical
x=672/x=744 loop, and crossed CV2 -> CV3 at 05:21 with ordinary keyboard input.
Because it used a pod save, it remains diagnostic and not campaign certification.

The clean campaign timed out in Ratchet's held-heal lesson, so B1 remains
unverified.

## 14. Senior Gameplay Engineer — NPC — PASS WITH OPEN DEVICE SCOPE

Fresh tail checks passed `sage`, `sage-walk`, and `kingdom1`. The rescued Sage uses
authored purified walk frames instead of sliding in a sleeping/kneeling pose, and
save/reload behavior is covered by the harness. Ratchet's clean journey dialogue
contained all owner-required causal facts. Servo's full fresh ordinary-input arc
did not complete. Physical touch/device acceptance is open.

## 15. Lead UI Engineer — HOLD, P1/P2

- `opening-order` failed on desktop and phone-size.
- `textreveal` failed aggregate and isolated: Chinese remained one line, measured
  467 px wide inside a 548 px box, instead of wrapping to at least two lines.
- Source still appends notifications to `G.toast` and draws an unbounded 30 px
  stack; raw-marble gameplay frames visibly reproduce center-stack density.
- Repair board is strong and legible at 1280x720.

Acceptance: finite priority/dedupe/cap policy, one narrative/reward notice at a
time, deterministic paused lifetimes, scoped retirement, and desktop/phone/RTL/CJK/
reduced-motion tests. Do not fix CJK by forcing arbitrary breaks that damage other
languages; identify the actual font/measurement contract.

## Automated evidence summary

The full collector continued after a workspace transport loss, but later
review-side rebuilds changed the served files while its tail was still active.
Final raw summary: 174 pass, 26 fail, one blocked end identity, overall log
integrity false. Fifteen tail failures were immediate served-build refusals and
were replaced by an integrity-valid pinned tail rerun in which all 18 checks
passed. `campaign-contract` passed separately. All 196 non-campaign harnesses have
at least one completed run. The fresh campaign has a real `timeout` result at
40:04 in A0B's held-heal lesson.

Fresh aggregate failures:

1. `combat-impact-input`
2. `wake`
3. `textreveal`
4. `bosspace`
5. `gravehorn`
6. `terrainrun`
7. `enemygait`
8. `infection-poses`
9. `roomcache`
10. `opening-order`
11. `campaign-ch1` — forced heal lesson never completes; 40:04 timeout

Isolated reproduction:

- `combat-impact-input`: fail;
- `textreveal`: fail;
- `enemygait`: fail (39 changed pixels at identical traveled distance);
- `gravehorn`: fail/time out without the aggregate null-fixture exception;
- eye core/roster: isolated timeout despite aggregate pass;
- campaign route-memory contract: pass;
- CV2 checkpoint diagnostic: crossed to CV3, later timed out in combat/heal loop.

