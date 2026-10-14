# Single Claude integration prompt

You are the integrator for `zaferdajani/HZD-99`. Integrate the bounded studio-review work from branch `codex/studio-review-2026-10-14` into the latest `claude/clawbyte-repo-migration-byhyl8`, preserving every newer change. Do not merge or deploy production until the complete browser and uninterrupted campaign gates below are green. Read `docs/DEVELOPMENT_AUTHORITY.md`, `docs/STORY_CANON.md`, `docs/studio/PIPELINE.md`, `docs/studio/runs/2026-10-14/REPORT.md` and `VALIDATION.md` first.

The review began with `main` and integration both at `14bef4baba6b12d78b7ba2e41c221e8b95b9f938`. Fetch them again before applying. Prefer an ordinary merge/cherry-pick while ancestry is clean; otherwise port only the bounded changes. Never replace `js/game.js`, `tests/campaign-ch1.cjs`, `js/panels.js` or generated HTML wholesale with an older version. Rebuild all four HTML outputs from source after resolving.

Preserve these current-main decisions exactly:

- `ba52bcd`/`14bef4b`: seamless upward crossings keep vertical carry but no forced lateral `climbStart`; the player chooses the landing. Actual cut crossings retain their scripted ledge handoff.
- Ground smoothing must continue to exclude cliffs over three tiles, cap lift relative to the column and split fill/crest drawing across cliffs.
- Keep the latest campaign bot's one-crossing `G.simClock` ledge steering; do not restore an older campaign file.
- Keep the Ratchet wake film plus `r_cell`/`r_marble`; never restore `repair.webp` or the October 11 candidate.
- Keep Alpha optional after the forge and outside lion prerequisites. Do not regenerate completed Alpha, pack or 30-frame NULLFANG assets.
- Keep finite infection trails: ordinary enemies red, bosses purple, bounded lifetime/pools, reduced-motion handling and cleanup on cure/death/despawn/room change.

Integrate these review changes:

1. `js/game.js`: only the A2 quarry hatch at columns 12–14/rows 15–16 refuses to break before `nfMeet`, while still giving the normal knock. It breaks normally after the first NULLFANG meeting. Preserve all other breakables and current terrain/shaft code.
2. `js/panels.js`: ordinary `alsoRoom` is a valid alternative, allowing NULLFANG `break` in A2 or A3. Preserve arrival/event policy and the intentional B1 teaser.
3. `tests/campaign-ch1.cjs` and `campaign-contract.cjs`: a full certificate requires these 16 scene IDs in causal order: `wake,bay,gate,letter,drawer,ratchet,meet,cave,marble,forge,passage,sage,break,chime,free,ch2`; require zero missed panels, zero page errors, no `CAMPAIGN_SEGMENT`, no `CAMPAIGN_STOP`, and `result=complete`. Keep the latest manual-landing bot logic. Missing, late, partial and error-bearing cases must exit nonzero.
4. `js/grapple.js`: target only live hostiles. Reject dead, disabled, rescued, meeting/staged, calm, tame/tamed, purified, friendly, yielded and pet actors. Also reject ordinary wolves when `packTamed()` is true, because Alpha's global flag does not set each wolf friendly. Recheck during the reel so a mid-reel rescue releases immediately. When `dealDmg` returns zero, preserve the guard/storm/Sage feedback already performed inside `dealDmg` but add no generic grapple knockback, charge, hit FX, freeze, rumble or arrival bounce.
5. Grapple first-use guidance follows the active device: keyboard key, touch glyph, mapped pad label, or Pause → Controls → Grapple for an unbound pad. No unresolved `{GRAPPLE}` token in any of the five languages or NOSTOS theme layers.
6. `tools/studio/audit.py`: derive each outer timeout from `tests/run.cjs` metadata plus 180 seconds, terminate the owned process group on timeout, capture campaign result metadata and clear inherited segment/stop variables. Keep all four `test_audit.py` cases.
7. `tests/roomcache.cjs`: retain the coherent post-meeting `nfMeet` fixture and crossing diagnostics without widening performance budgets.
8. `docs/ART_QUEUE.md`: keep the corrected FURNACE brief—no baked eye emission; runtime supplies purple boss eyes/trail—and the statement that the ten dedicated Alpha strips are completed, not a regeneration request.

The Codex environment built `BUILD_ID 07f3967fe8dc`; 28/28 final static results passed. Its full collector produced 29 passes and 159 browser launch failures because Chromium provisioning returned zero-byte files. Those failures are blocked evidence, not established game regressions and not passes. Run the real browser gates yourself in this order:

1. `npm ci`
2. `node build.cjs && node tools/pack-www.cjs && node tests/build-integrity.cjs`
3. `python -m unittest discover -s tools/studio -p 'test_audit.py' -v`
4. `node tests/run.cjs campaign-contract grapple-contract`
5. Focused browser checks: `node tests/run.cjs opening-order panels secrettell grapple roomcache vlink cross seam-look story-order chapter-one den-gate gravehorn infection-eyes infection-roster infection-poses`
6. Full collector with a real executable: `CHROMIUM_PATH=<real Chromium> python tools/studio/audit.py --profile full --output docs/studio/runs/2026-10-14/integration-full`
7. A fresh cleared-storage uninterrupted `campaign-ch1` from the title using ordinary keyboard input only—no flag/inventory/position writes, no segmentation or developer stop. Require `certified:true`, all 16 scenes in order, zero missed scenes/errors and arrival at the B1 teaser. Label this separately from staged harnesses.
8. Inspect actual gameplay frames at 1280×720, 844×390 and 390×844. Then test real touch/native and controller mapping; listen to boss/audio transitions and feel haptics. Viewport emulation is not device certification.

Do not weaken assertions, widen budgets, classify browser launch failures as gameplay failures, or reuse an older campaign as proof. Reproduce failures, make the smallest fix, rerun the affected check and then the full gate.

Remaining production priorities:

- P1: fulfil the existing GRAVEHORN queue once—14 authored rig plates plus `gh_intro_a`, `gh_intro_b`, `gh_phase2`, `gh_down`. Verify planted feet, both facings, horn detach, tells/recoveries, phase transition and purple eye anchors at gameplay size.
- P2: make a genuinely localized edit of `m_down.webp` changing only NULLFANG's eye emission from red to established boss purple. The review's generated candidate is directionally useful but altered the full raster/dimensions and must not replace production.
- P2: in `r_cell.webp`, darken only inactive Servo's eye/chest indicators so “switched off” is visually true.
- P3: correct HZD-99's elongated rear-view anatomy in `passage_b.webp` while preserving tunnel, camera and earned sword.
- Keep `r_marble.webp` clearly diagrammatic: the cave yields raw rounded marble and Ratchet later forges the blade.
- Produce only FURNACE's six already-queued poses under the corrected runtime-purple-eye rule; validate vent/drop/bell transitions.
- Add GRAVEHORN to eye-anchor pose coverage. Reproduce TER-1 on the new manual shaft behavior before changing geometry; define one cross-boss checkpoint policy; correct NOSTOS `terminal20` without changing its read reward.

Use the approved image/media workflow for raster changes, archive provenance, keep candidates separate and obtain owner comparison before wiring. A still image does not certify animation. When every gate is green, commit normally to integration, rebuild, verify source and built hashes, and follow the authorized release workflow. Report exact commits, browser/campaign/device evidence and live BUILD_ID; never claim deployment from source presence.
