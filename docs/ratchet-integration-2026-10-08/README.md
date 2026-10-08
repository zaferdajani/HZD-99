# Ratchet repair integration verification

Base: integration commit `30e34ca7cf7155ef4290bd1356f6a655793d8fd0`.
Production inspected at `cdce38b1c98d5cd4d6a23a80a6c232bed60e70fc`.

The integration base already registers story-repair before game in source-files.json,
routes version-2 Ratchet dialogue into repairOpen, updates REPAIR before simulation,
and closes repair on room/restart. This change reuses those hooks and adds the missing
dev.html entry. It does not duplicate or rewrite the pending Alpha redesign.

Lifecycle fixes validate room, save identity, state, battery and NPC before mutations
and completion; close on blur/hidden document; release pointer capture; remove visit
listeners; and recover PLAY from an orphaned REPAIR state after room changes.
Only durable placements persist. Interrupted boot retains the battery and placements.
Completion uses the existing NPC reward/dialogue/forge-quest continuation.

Local validation: 5 focused harnesses passed (regression.log). The new lifecycle
harness executes production repair, NPC, persistence, quest and update functions with
an inert DOM. It fails on the recovered baseline at interrupted boot. This is state
coverage, not a rendered-browser or physical-device claim.

Existing story-battery, chapter-one and battery browser tests now complete the real
repair controls instead of assuming dialogue instantly wakes Ratchet. Syntax checks
pass. The verification-only Actions workflow builds and runs those plus first-sage-route
and regress against the assembled game. Its result must be checked separately.

Local browser execution is unavailable: Chromium is absent and the attempted
Playwright download returned an invalid/truncated archive. Local files are a targeted
source snapshot, not a full media checkout. The integration tree also lacks the
referenced repair_panel.webp and repair_battery.webp; browser behavior without those
assets and complete candidate release validation remain explicit checks.

No main/odyssey update, built-page publication, or production deployment is claimed.
The integration branch contains other unfinished story/Alpha/media changes and must
not be blindly promoted as a Ratchet-only release.

## Confirmed assembled-game result

Actions run https://github.com/zaferdajani/HZD-99/actions/runs/37744414667
passed all 10 selected harnesses on commit `8ab3340e1497f3e3ddd7ed6c679236d14f92309a`.
All four generated pages built. Both index and odyssey loaded all 77 rooms with
no room or page errors. The connected chapter test completed rescue, quarry,
forge, first Sage and saved reward recovery. Extracted job evidence is retained
in actions-37744414667.log; the full workflow artifact is linked from that run.
A separate real-pointer/page-reload repair harness is added for the final check.

## Browser-discovered cancellation fix

Run 37744890462 caught loss of keyboard focus during power-up: disabling the
focused power button could move focus outside the dialog and prevent Escape
cancellation. Keep Close enabled, focus it when power-up starts, and process
controller Back/Pause before advancing the boot timer. The browser test now
asserts PLAY immediately after Escape, and the lifecycle test checks boot
focus and controller cancellation. This fix is subject to the final CI run.

## Final verified result

**PASS:** https://github.com/zaferdajani/HZD-99/actions/runs/37745405458

Tested runtime commit: `ffdab9e16699ec8cdc2d807098e0055c6bcdbe0c`.
All 11 selected harnesses passed, including actual mouse dragging, wrong-terminal
retry, partial-progress page reload, Escape during boot, durable once-only reward,
forge-quest continuation and direct room-transition recovery. Both assembled games
loaded all 77 rooms with no room errors or JavaScript page errors. All four build
outputs were generated successfully. No thresholds were weakened.

The missing optional repair image files did not prevent these gameplay tests from
passing; the board uses its existing background and text labels as fallback. This
is not an artwork-completion or physical-device-certification claim.

Changes are on the existing integration branch only. Alpha/world/combat/story-route
sources were not modified by these integration commits. No production promotion
or deployment was performed. Full job logs and the verification artifact are
available from the run; selected result lines are retained in actions-37745405458.log.
