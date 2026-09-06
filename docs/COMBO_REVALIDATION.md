# Hero combo: source verification and repair

Base: `9425f4ee99480a81c428c2d7295e2e9a2bd4a145`, branch
`claude/clawbyte-repo-migration-byhyl8`. Reviewed 2026-09-06.

## Confirmed defect and correction

`Player.update` creates ordinary attacks with combo values 0, 1, 2.
`heroState` and `drawRoboSwing` instead interpreted 1, 2, 3 as the three
ordinary attacks. Actual input therefore selected jab, jab, cross. The
uppercut was not reachable through the ordinary three-hit chain.

The shared `heroSwingState` selector now maps 0 -> jab, 1 -> cross,
2 -> uppercut. Explicitly charged swings retain the separate burst.
Gameplay damage, attack cooldowns, aim, physics, and boss tuning are unchanged.
The fallback pose and loaded strip now use the same selector.

The old `tests/frames.cjs` manufactured one-based combo values, concealing
this mismatch. Its fixture and `tools/swingshot.cjs` now use gameplay's
zero-based convention. The frames harness also preloaded obsolete strip
keys (`swingClaw2`, `swingFinisher`) instead of the active `swingHook` and
`swingUppercut`. It now warms the actual manifest entries and explicitly
fails if they do not load before measurement.

## Evidence

`node tests/run.cjs combo-routing` passes. This new Node harness executes
the production entities file and real `Player.update` with attack inputs,
then checks the fallback pose and intercepted strip draw key. Scene and
audio services are stubbed; it does not measure pixels, audio or game feel.
It checks three attacks, chain wrap, timeout and `releaseCharged`.

The same harness against the unmodified base source fails on the second
attack: expected `claw_2`, actual `claw_1`. This is a reproduced regression,
not a test of a separately rewritten selector.

Syntax checks for entities, frames and swingshot pass. `node build.cjs`
successfully rebuilt all four pages. `node tools/pack-www.cjs` successfully
staged both game pages and 695 assets for the native shell.

Historical first-pass limitation (superseded by the Higgsfield Chromium run
documented in `ANIMATION_COMBAT_UPDATE.md`): browser visual tests were blocked: `node tests/frames.cjs` exits
before loading the game because `/opt/pw-browsers/chromium` is absent.
The Playwright browser installer exhausted its retries with download timeouts.
No full-suite result or live gameplay verification is claimed for this patch.
No commit was pushed and the live game was not changed.

## Corrections to HZD99_HANDOVER.md

- Walk/run strips are already wired in `HERO_GAIT`; later statements that
  only two/three stills are currently used conflate fallback/history with the
  active strip path. No new gait artwork was generated in this repair.
- The ordinary finisher issue is an indexing mismatch, not evidence that
  normal third attacks are automatically charged. Normal attacks use 0..2;
  charge/swirl set their own flags and synthetic combo value separately.
- The reported cross motion score must be rerun after fixing asset warming.
  Its exact number is not reliable evidence about the currently selected
  strip while that strip can be missing during the frozen measurement.
- A contact sheet of the actual hook strip does show several extended-arm
  frames and changing scarf motion. Whether a re-cut improves the whole
  attack needs a correctly loaded, in-context sequence comparison. The source
  video is present at `assets/source/hero/takes2/hook.mp4`.
- A hit at 0.06 s within a 0.24 s action is 25% elapsed, not 75% elapsed.
- Recovery minus one time step is not a complete fairness measurement:
  starting distance, player commitment, residual hazards and the next attack
  affect whether the opening is usable. No boss was retuned from that formula.

## Integration gate

Apply to the stated base or review against a newer working branch; do not
overwrite concurrent changes. Run `node tests/run.cjs combo-routing` first,
then `node build.cjs`, `npm run app:pack`, and the full browser suite in an
environment with the project's browser executable. Keep unrelated pre-existing
failures distinct from regressions, without weakening assertions.

Visually check both facings, the three-hit chain, queued inputs, charged
burst, weapon variants and transitions back to movement at gameplay size.
Then exercise a complete Nullfang encounter, including retry and victory.
An input-routing fix alone does not certify the fight's overall quality.

The project requires full integration validation before shipment; that gate
has not been met here. Keep this as a review patch until it has. Before a
release, bump GAME_VERSION, rebuild, and follow the shared-branch protocol.
