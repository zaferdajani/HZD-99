# Separate post-collector diagnostics

These are NOT registered full-suite runs and do not replace original failed
executions. Both browser helpers refuse to start before the full collector
closes and refuse to overwrite a nonempty diagnostic-output directory. Their
original test assertions stay intact; added observation can perturb timing.
Each invocation owns a local server and checks served index bytes against disk.
They are not physical touch/controller/device or full campaign acceptance.

Run from the repository root, sequentially, using the preflighted executable
`CHROMIUM_PATH`. First execute purification with `PURIFY_TOUCH_MODE=original`,
then the SEPARATE `PURIFY_TOUCH_MODE=settled` hypothesis control, then the winch
helper. Do not run another browser alongside the frozen full collector.

```sh
PURIFY_TOUCH_MODE=original node docs/studio/runs/2026-10-20/postflight/purification-touch-diagnostic.cjs
PURIFY_TOUCH_MODE=settled node docs/studio/runs/2026-10-20/postflight/purification-touch-diagnostic.cjs
node docs/studio/runs/2026-10-20/postflight/winch-endpoint-diagnostic.cjs
```

Default output folders are `purification-touch-original`,
`purification-touch-settled` and `winch-endpoint` here. Any subsequent execution
MUST use a fresh `PURIFY_DIAG_OUT` / `WINCH_DIAG_OUT` and fresh log path; never
delete, replace or rehash the first execution into agreement. Preserve failure
exit codes even if a separately labeled control passes.

`cv1b-static.cjs` evaluates unchanged world/planner source in an isolated Node
VM. Its geometry and approximate predictions are NOT live ordinary-input
escape evidence. `opening-timing.cjs` analyzes capture-file timestamps only;
the portrait marker is NOT a directly measured case-loop start.

The failed process-control attempt is archived as
[evidence-only source](stop-stalled-campaign.cjs.txt). Do not execute it against
a later process. [Attempt note](interruption-attempt.md) records the respected
permission boundary and confirms no signal was sent.
