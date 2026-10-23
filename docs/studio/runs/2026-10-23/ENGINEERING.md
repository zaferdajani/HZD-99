# CLAWBYTE engineering review — 2026-10-23

Pinned source before the evidence run:
`7c3cefeb6bda7aa59e9ae34520e50bbdd6d45237`. Main and Claude integration
remain unchanged at `62d75d204c6f6264f25150bb419fc262ff2c18ea`.

## Five independent responsibilities

| Responsibility | Verdict | Evidence |
|---|---|---|
| Senior Technical Director — World Systems | Issues — no new regression | Mandatory room graph, cave topology, collision, shortcuts, cache and save contracts pass. The October 22 normal-input route covered the mandatory caves. Optional GA2/A11–A13 natural traversal, physical streaming and device save migration remain open. |
| Senior Gameplay Engineer — Combat | Pass for source/browser contracts; device feel blocked | Hit flash, layered sound routing, metal debris, knockback/recoil, shake/hit-stop, charged impact, stats/logging and deliberate purification pass. Listened mix, haptic strength and sustained device performance are unverified. |
| Senior Gameplay Engineer — Mission | Pass mandatory sequence; optional scope issues | Quest flags, pre-accept discovery, forge → Sage → CHIME → lion gates and reload behavior pass. Alpha and optional caves are not naturally completed today. |
| Senior Gameplay Engineer — NPC | Pass bounded Sage fix | A rescued moving Sage selects authored `sageWalk8` with purified material and returns to `sagePure` only at rest. `sage-walk`, `sage`, `sage-quiet` and enemy-gait checks pass. Servo's responsive route now has a terminal trace; the coil acquisition in `opening-order` remains intentionally injected and is not acquisition proof. |
| Lead UI Engineer | Issues | Text reveal, debounce, CJK/Arabic, overlay queue, portrait rotation contract and the 15-beat tutorial pass. Today's independent phone-sized run reached Servo; the full collector modes hit their fixed budgets on the final `go` step. Neither run uses true touch input or a physical device. |

## Bounded implementation

`tests/opening-order.cjs` now records:

- every room/state/tutorial/dialog/panel/cut transition with elapsed time;
- exact terminal room, state, tutorial hold/recharge, dialog queue and video
  readiness/error state;
- per-mode JSON and a terminal screenshot;
- an accurate comment that phone mode is a touch-capable viewport driven by
  keyboard/mouse, not physical touch certification.

The 240-second per-mode limit is unchanged. No game source, state, inventory,
quest flag, route or assertion was weakened.

The new evidence distinguishes two timing outcomes:

- Independent diagnostic: phone reached A1, woke Servo and took the coil errand;
  desktop reached the attack lesson at 233.7 seconds and expired.
- Full collector: both modes reached all 15 steps and the final `go` prompt;
  each expired before entering A1, with no cut, dialog, overlay or page error.

## Full collector

The same clean commit ran `tools/studio/audit.py --profile full` through 201
harnesses: 198 passed and 3 failed. Log-integrity validation passed for every
captured raw log and snapshot.

| Failure | Classification | Evidence |
|---|---|---|
| `opening-order` | Finite timing/evidence failure | Both modes reached all 15 ordered steps; terminal state was PLAY/A0/`go`; no page errors. Did not reach Servo inside 240 s. |
| `campaign-ch1` | Environment blocker before gameplay | Playwright video initialization could not find FFmpeg. Dependency was installed afterward; original log retained. |
| `bake3d` | Environment/WebGL blocker | Software wrapper used `--disable-gpu`; Three.js could not create a WebGL context. No authored asset or runtime assertion failed. |

The original full-collector failure remains retained. A separate rerun using
the extracted SwiftShader libraries and a wrapper without `--disable-gpu`
passed the unchanged `bake3d` assertions in 3.5 seconds, including grounded
eight-yaw output, silhouette distinction, root-motion removal, retained bob and
driving-video creation. This closes the host tooling blocker; it does not alter
the full collector's result.

All other build, package, story, cave, manhwa, motion, combat, audio-routing,
Sage, wolf/Alpha, eye-trail, text/RTL and save checks passed. The collector's
server identity remained pinned and all evidence hashes validated.

## Evidence boundaries

- The October 22 17:36 campaign remains the most recent certified uninterrupted
  route. The separate October 23 run timed out at 40:00 after five completed
  missions, one Sage-fight death and 166 failed CV2 recovery attempts. It had
  zero page errors and no panel-order errors, but did not reach B1.
- Most of the 198 passes are staged or contract harnesses, not continuous play.
- Viewport emulation is not physical touch, controller, haptic, audio or thermal
  certification.
- The passing isolated `bake3d` rerun proves the host tool works when WebGL is
  declared correctly; it does not certify any unfinished production asset.
