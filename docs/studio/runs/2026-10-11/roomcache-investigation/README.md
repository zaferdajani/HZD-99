# Room-cache failure investigation

## Original failure preserved

The full-suite log is `../automated/roomcache.log`. First A2 east→A3 failed to arrive, while a later repetition passed. All other cache/pixel/budget/save assertions passed. No retry overwrites that result.

## Diagnosis before correction

Added failure-state capture in `tests/roomcache.cjs`, retaining all original assertions and budgets, then ran the unchanged fixture against the frozen built pages using a separate test-server execution environment.

`diagnostic-original.log` reproduced the failure (exit1):

- Frame0: roomA2, PLAY, x2706, RIGHT1.
- Frame10: roomA2, PANELS, sequence`meet`, x2777, vx0; held keys cleared.
- Frame119: roomA2, PLAY, x2777, vx0; RIGHT remained absent.

The harness's staged save marks bossGlitch complete but omits its earlier nfMeet milestone. During the first A2 crossing, the introductory lion encounter therefore creates the meeting-panel event. `panelsClearInput` correctly clears held RIGHT. The existing harness `quiet()` forcibly changes PANELS back to PLAY, but does not restore the consumed key, so the character stops. On the next repetition, the sequence has been recorded, explaining the inconsistent result.

This is a contradictory performance-test fixture, not evidence of a broken room transition or a performance regression.

## Bounded change

Set only `sv.flags.nfMeet = 1` before starting this post-guardian fixture. Normal panel migration recognizes the already-passed event. No blanket marking of all panels, disabling story code, gameplay edits, bigger budgets, retries inside the test, or relaxed assertions.

Keep failed-crossing diagnostics and add an assertion that no story panel intercepted the measured cache walk. The test still measures original crossing-frame cost, no live rebake, pixel equality, stale tile invalidation, tier budgets, deferred save writes and sheet preparation.

Fresh corrected result is recorded separately in `fixed.log`; see the engineering report for the exit status after completion.

## Corrected result

`fixed.log`: exit0,37.3seconds. First A2→A3 crosses in31ms with0live bakes; all original assertions and the additional no-panel-interception assertion pass. No page errors. JavaScript syntax check and diff whitespace check also pass. One diagnostic failure and one corrected run were performed; there were no repeated attempts until green.
