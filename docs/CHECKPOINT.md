> Historical snapshot, not current release authority. See `DEVELOPMENT_AUTHORITY.md`.
> Keep the original evidence below; do not use old scale values or workflow status as current facts.

# HZD-99 continuation checkpoint — 2026-09-08

Repository: `zaferdajani/HZD-99`. Working branch:
`claude/clawbyte-repo-migration-byhyl8`. A main/deployment update was explicitly
denied during this continuation. Do not mirror to `main` or `odyssey` without
resolving that approval boundary, regardless of older standing instructions.

## Owner story and tutorial continuation

### Follow-up: charged combat and connected chapter validation

- Fixed `Player.releaseCharged` and `swirlPass` bypassing `dealDmg`. Before
  the fix a charged attack drove a sage below zero HP instead of respecting
  the 30% song-lock floor. Specials now obey purification, protected allies,
  guarding and elemental counter rules; protected hits cannot farm volts.
- `tests/sage-specials.cjs` reproduced that failure before the patch and now
  checks both specials, cleansing, once-only gifts, protected targets and
  ordinary enemy damage. `tests/chapter-one.cjs` carries one actual save from
  battery rescue through held-input quarrying, return/forge and real swing
  cleansing, with reloads before the forge and after the sage. It grants no
  quest items, weapons or boss flags. Rooms/positions are staged, so this is
  connected gameplay integration, not a human campaign playthrough.
- Separately audited actual cave collision/movement from A5 through CV1/CV2
  to the CV3 pillar and back, plus the optional CV1B bench route. Ordinary
  claws clear rubble and basic jumps suffice; no abilities or sword granted,
  no repositioning after initial A5 placement. Enemies were removed for this
  collision audit; combat and stone collection are tested separately.
- Corrected the meadow measurement: old frame pairs advanced the simulation
  and counted unrelated pixels. Same-state rendering yields hue 103 degrees,
  saturation 45.1 and zero unrelated control pixels. Original limits remain;
  an in-memory faded-grass mutation fails them. No art/rendering colour change.
- Focused chapter-one, sage-specials, meadow, twin, crystal and sage passed.
  All 98 harnesses were exercised across the initial run and a resumed run
  from `wolves` after execution was interrupted. Four remain failing:
  `kingdom`, `hzdvox`, `tinker`, and `hero`; this is not a green release gate.
- Kingdom sampling now waits for declared fallback artwork, clears arrival
  dialogue and uses canvas-scaled crops. Isolated A4/B3 door samples pass,
  but sequential kingdom runs still measure 1.2%/1.3% against the unchanged
  1.5% minimum. That sequence-dependent visibility failure is unresolved.
  Voice register (95/216 Hz), Ratchet silhouette (IoU 0.880), and hero frontal
  claw/burst motion remain art/audio review failures; thresholds are unchanged.
- Windows x64 packaging succeeded with the pinned checked runtime. Native
  Windows execution remains unverified for this revision; building its EXE
  does not substitute for the Windows workflow's two-launch smoke test.

The current art ledger supersedes older jab requests with the owner's claw
scratch brief. Archived scratch/weapon-motion candidates are not approved.
No approved unused replacement was found for the remaining hzdvox/tinker/hero
failures; do not silently wire a rejected take or weaken an art threshold.

Read `docs/STORY_CANON.md` first. It permanently records the owner's latest
account: the evil robot hijacked Mother's song; the sleeping cat escaped;
Ratchet's necklace protected him; restoring his battery leads to the cave,
return, cleansing-sword forge, first sage, later dual swords and connector.
`AGENTS.md`, `CLAUDE.md`, `STORY.md` and `docs/SWORD_STORY.md` point to this
authority. Older incompatible archive/immunity explanations are superseded.

- English and Arabic opening and Ratchet dialogue now use that account.
  The cave/return/forge objective is readable even when the memory film is skipped.
- The first sage chamber requires ownership of the forged cleansing sword.
  The material cave and return route remain reachable beforehand. Switching
  back to claws does not relock the chamber; NOSTOS is unaffected.
- Tutorial guidance gives one current action and matching target: approach
  the actual workshop door, enter with UP, then interact beside Ratchet.
  Returning from the workshop points to its door instead of an impossible
  right-hand exit. Dialogue hides competing tutorial cards. Saved lesson
  indices and learned controls are preserved.
- A powered-down Ratchet prompts reading his note before shopping. The map
  announcement waits until the current tutorial/power lesson ends. Controller
  action cards use actual remapped bindings; Skills names its pause-menu route.
  Browser screenshots verified the door and note prompts without page errors.
- New production-code regression harnesses: `story-progression` and
  `tutorial-clarity`; both pass. Focused dialogue-audio, weapons and nine
  browser harnesses pass (tutorial, opening, errands, deadend, padlife, tap,
  sage, platform, dialogue-audio). Generated game pages and app staging rebuilt.
  After the final prompt edits, tutorial-clarity, story-progression, tutor,
  lesson, tap and platform were rerun successfully on the rebuilt files.

The full 95-harness run completed with four known failures: hzdvox (95/216 Hz),
tinker (closest work frames 0.867 vs maximum 0.86), meadow (hue 131 vs maximum
112), and hero (claw_1/burst face ratios 0.113/0.116 vs walk 0.099). No new
failure category appeared. Both pages loaded all 77 rooms without room or page
errors. The final tutorial-only refinements landed during the long run; the
six affected source/browser/package checks listed above were rerun afterward.
The platform check also passed in the full run.

This continuation is not a claim
that the campaign, approved weapon artwork, voice identity, native Windows
build or commercial release is finished. No new art or music was substituted.

## Recovered baseline

`31e923159c3fcf7f313f86cd951c874e3696b6cf`: offline Windows desktop package.
GitHub Windows run 34150154923 passed packaged launch, movement, media ranges
and saved-progress recovery. Cave floor and reciprocal Seam connections are
already fixed in its parent; do not redo them from the old screenshots.

## Current continuation

- Clear pending/held input and touch ownership on focus loss. Ignore background
  input and require neutral controller input on return. Cancelled touch gestures
  cannot select a power-wheel action.
- Fade the preceding character bark before a new vocal starts. Mechanical
  foley remains independent. Charge vocals keep the channel through readiness
  cues; damage and dialogue can interrupt them.
- Desktop blur uses the shared input reset and selects the Resume pause row.
- Retire the incompatible legacy Windows assembler and direct existing entry
  points to the checked Windows workflow package.

New regression harnesses: `input-focus`, `voice-handoff`. Existing test
thresholds and assets have not been weakened or replaced.

## Next production work and boundaries

The art ledger remains `docs/ART_QUEUE.md`; rejected weapon motion is recorded
in `assets/source/hero/weapon-review/review.json`. No rejected take is approved
by this continuation. Preserve the owner's Higgsfield and review workflow.

The existing `hzdvox` register failure is reproduced (hzd_atk2 95 Hz,
hzd_yalla 216 Hz). This playback change does not repair recording identity.
The previously documented hero-facing and Ratchet work-pose failures need
accepted replacement artwork. See `docs/STEAM_READINESS.md` for commercial
release evidence, including actual hardware and controller playthroughs.

## Validation record

The full 93-harness suite ran to completion in Chromium 149. It reported five
failures: hzdvox, tinker, hero, meadow, platform. Platform caught the local
package becoming stale after the final charge-interruption edit; `app:pack`
was rerun, followed by focused platform and audio revalidation.

The meadow hue failure was independently reproduced with the untouched
`31e9231` index page and the same assets/browser (131 degrees, limit 112).
It is an additional baseline visual/test issue, not caused by these input or
voice changes. No meadow code, artwork or threshold has been changed.

Both game pages loaded all 77 rooms with no room or JavaScript errors in the
full run. Focused padlife, tap, slashsnd, input-focus, voice-handoff,
dialogue-audio, equipment, cave-ground and seam-route checks passed. The wake
harness reported no page errors but is observational and still describes an
older opening flow; do not call it a fresh-save campaign completion test.

Local desktop staging verified 698 game files. Windows native verification
must come from the new commit's workflow, not from the earlier baseline run.
