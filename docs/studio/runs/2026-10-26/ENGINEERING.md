# Engineering review — 2026-10-26

## Roles 10–14

| # | Responsibility | Verdict |
|---:|---|---|
| 10 | World Systems | Fresh mandatory route and world checks pass; optional/device proof remains open. |
| 11 | Combat | Source/browser contracts pass broadly; audio/haptics are routed, not physically heard/felt. |
| 12 | Mission | Mandatory battery → marble → forge → Sage → CHIME → lion route passes continuously; optional loops remain staged. |
| 13 | NPC | Purified Sage uses authored walking while moving and kneels only while idle; Servo purpose/scale pass staged checks. |
| 14 | UI | Text/RTL/CJK/rotation contracts pass; notification density and physical touch remain open. |

## Fresh aggregate

The full immutable-snapshot collector ran **201 checks: 198 pass / 3 fail**.
Build and package passed. The 13:06 cleared-storage campaign passed. The three
aggregate failures were:

1. `purification-save`: a staged harness read `G.save.braid` before the lazy
   `braid()` initializer had created it. A bounded test-only fix now calls the
   initializer; the isolated rerun passes without changing assertions or game
   logic.
2. `opening-order`: phone-size completed to A1/Servo, while the desktop driver
   stopped in A0 before monument/Servo. The separate uninterrupted campaign
   completed the mandatory route. Its isolated rerun also failed: desktop
   reached the booth, then an 8-second semantic wait expired before the letter;
   the phone phase never started. Treat `OPEN-ORDER-26` as a reproducible
   evidence-driver/reliability blocker, not a closed issue.
3. `bake3d`: the temporary host wrapper placed SwiftShader libraries one
   directory too deep. Correcting the temporary extraction made the unchanged
   bake test pass. This is host tooling, not a game-source fix.

The restored `gravehorn` 0.30–0.45 second horn-lock assertion passed inside the
full run. A later combined isolated rerun became nondeterministic much earlier
in the staged setup and failed broadly; it does not erase the full-run pass and
must not be described as a clean second pass.

## Evidence-retention correction

The October 25 branch did not publish `automated/results.json`; only three of
199 referenced raw logs were present. Therefore its reported 199/2 result is a
historical summary, not independently auditable release evidence.

Today's collector embedded every closed-file snapshot in `results.json`, but
four disk logs (`marble-notices`, `winch-purpose`, `visual-depth`, `deadend`)
were overwritten after capture, so the original aggregate correctly ended
with `log_integrity: false`. The original failure is preserved. The four raw
logs were reconstructed byte-for-byte from the embedded snapshots and checked
against their recorded SHA-256 values in `recovered-log-integrity.json`.

## Bounded fixes

- Restored the Gravehorn lock lower bound from the unreported 0.29-second
  tolerance to the original **0.30 seconds**. The full-run assertion passed at
  367 ms; no encounter timing or balance changed.
- Initialized the braid ledger in `tests/purification-save.cjs` before reading
  it. Isolated purification-save passes; production code is unchanged.

## Confirmed UI risk

`G.toast()` appends without a priority, dedupe or visible-count cap. Rendering
stacks entries 30 px apart and pushes the objective under the whole stack.
Fresh Sage and lion frames reproduce the player-visible congestion.

Acceptance: one finite-priority queue, dedupe by scope/text, deterministic
expiry, remaining lifetime preserved across blocking overlays, scoped stale
retirement, and max-visible/safe-zone assertions at desktop and phone widths
including RTL/CJK, boss UI, reward and purification controls.

## Device boundary

No physical iOS/Android touch, controller, haptic, listened-audio, thermal,
sustained frame-time or memory run was possible in this host. The phone-size
opening evidence uses browser keyboard/mouse input and must not be relabeled as
touch acceptance.
