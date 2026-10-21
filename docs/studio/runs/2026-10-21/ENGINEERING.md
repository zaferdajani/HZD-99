# Engineering review — 2026-10-21

## Role verdicts

| Senior responsibility | Verdict | Evidence |
|---|---|---|
| Technical Director — World Systems | Issues | Continuous route reaches B1, but optional routes/device performance and raw-evidence retention remain open. |
| Gameplay Engineer — Combat | Issues | Impact/purification suites pass; missing authored ritual performance and physical-device checks remain. |
| Gameplay Engineer — Mission | Issues | Full causal route now passes; opening-order and optional Alpha remain uncertified. |
| Gameplay Engineer — NPC | Issues | Ratchet action label is fixed and tested; targeted rescued-Sage motion proof remains absent. |
| Lead UI Engineer | Issues | Corrected font wrapper validates gradual/RTL/CJK text; phone opening and physical touch remain open. |

## Bounded changes

### `NPC-LETTER-LABEL-20`

`js/opening.js` now returns the existing localized `op_note` action for powered-down Ratchet before his cell is found and `op_repair` while the cell is carried. Once alive it returns to ordinary Talk/shop behavior. `tests/story-battery.cjs` covers all three states and preserves Servo's separate behavior.

### `QA-PURIFY-TOUCH-20`

The registered test now waits for the production touch viewport (`TOUCH.rawW/rawH`) to converge after rotation, redraws through production code, asserts the 48px hold control is fully on-screen and hit-testable, then dispatches the same real CDP touch events. It does not force handlers, shorten the 1.6-second hold, relax the `>0.4` sample, or remove cancel/blur/hidden/save checks. Three consecutive targeted runs and the full collector passed.

### `QA-CAMPAIGN-BAT-20`

The evidence driver now watches hero/enemy movement and enemy HP. If the same room/enemy shows no position or damage progress for five seconds, it ignores only that kind in that room for twelve seconds and resumes ordinary route input. It does not change enemy/game state, terrain, damage, physics or inventory. The fresh route crossed CV1B, acquired raw marble and completed chapter one to B1.

### Review browser font readiness

The wrapper now sets `FONTCONFIG_FILE` to the checked-in per-run configuration instead of accidentally loading the package's unrelated `/tmp` configuration. Before: canvas `measureText('hello world') === 0`; after: `90`. This is evidence infrastructure only. Corrected targeted reruns passed comic rewards, full gradual text/RTL/CJK, enemy scale and Forge.

## Remaining engineering findings

### `QA-OPENING-PHONE-20` — P2

Corrected-font rerun still exhausted its finite budget. Desktop stopped after the pack handoff; phone keyboard emulation reached monument/`go` in A0 but not Servo. Reached order/content assertions passed and no page errors occurred. Add milestone/input/charge/transition tracing; do not merely increase the timeout. Validate actual touch separately.

### `QA-EVIDENCE-19` — P2

The collector saved 198 valid byte snapshots but three current raw logs no longer match their snapshots: `servo-presence.log`, `mapexits.log`, `kingdom1.log`. Detection works and the aggregate correctly fails closed; the writer/lifecycle cause remains unknown. Preserve both forms. Do not repair/re-hash the old execution into agreement.

### `FLIER-BANK-SCALE-20` — P2

The original collector's 68px hurt frame caused four band failures; corrected rerun's 71px idle frame passed. This proves nondeterministic reference-frame selection, not resolution of the 73px historical banked-cruise extremum. Pin the same hero state and sample actual AI banking.

## Evidence classification

- `campaign-ch1`: one uninterrupted ordinary-keyboard route with read-only planner/map access, easiest difficulty, no progression mutation. Certified by its contract, 16:39 wall time, two deaths, all nine missions and all sixteen panel beats. No full video; cutscenes may be advanced by Enter.
- `opening-order`: staged fresh-save desktop and phone-viewport keyboard routes; its coil hand-in is injected. Not physical touch and not a complete side-quest acquisition proof.
- Most other harnesses stage rooms/saves to test one contract.
- Headless/software rendering does not certify native packaging, physical controller/touch/haptics, listened audio continuity, shipping-device performance or accessibility across installed fonts.
