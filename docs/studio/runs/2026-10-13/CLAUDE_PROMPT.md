# Single Claude integration prompt

You are the integrator for `zaferdajani/HZD-99`. Integrate the bounded CLAWBYTE studio-review work from branch `codex/studio-review-2026-10-13` (source/evidence commit `a9fd9ba64f76be20f7f04dfe4ce6be99974ec828`) into the latest `claude/clawbyte-repo-migration-byhyl8`, preserving all newer work. Do not merge or deploy until the complete browser and campaign gates below are green. Read `docs/DEVELOPMENT_AUTHORITY.md`, `docs/STORY_CANON.md`, `docs/studio/PIPELINE.md`, `docs/studio/runs/2026-10-13/REPORT.md` and `VALIDATION.md` first.

The review was based on `main` and integration both at `d4f9c04fa5c53d72a84c2eddd72aa52870b0278c`. Fetch again and compare before applying. Prefer a normal merge/cherry-pick if ancestry is still clean; otherwise port only the bounded source/test changes. Never replace current `js/game.js`, `js/panels.js` or built HTML wholesale with an older file. Rebuild all four HTML outputs from source after resolving.

Integrate and preserve these fixes:

1. `js/game.js`: A2 quarry hatch columns 12–14 / rows 15–16 gives its normal knock but cannot break before `nfMeet`; after the first NULLFANG meeting it behaves normally. Keep the rest of breakable terrain unchanged.
2. `js/panels.js`: ordinary `alsoRoom` is a valid alternative to the primary room, so NULLFANG `break` can play in A2 or A3. Preserve the current doorway/event panel architecture and the intentional Chapter Two teaser over the A3→B1 crossing. Do not restore the obsolete settle-delay/boundary patch wholesale.
3. `tests/campaign-ch1.cjs` + `campaign-contract.cjs`: a full certificate requires exactly the current 16 essential scene IDs in causal order—wake, bay, gate, letter, drawer, ratchet, meet, cave, marble, forge, passage, sage, break, chime, free, ch2—zero missed panels, zero page errors and no `CAMPAIGN_SEGMENT`/`CAMPAIGN_STOP`. Keep current B1 teaser navigation. Missing, late, partial and error-bearing cases must exit nonzero.
4. `js/grapple.js`: only live hostile targets can be acquired/assisted/retained. Dead, disabled, rescued, calm, tame/tamed, purified, friendly, yielded and pet actors are rejected; cure during reel releases. `dealDmg <= 0` gives no knockback, volts, audio, particles, camera shake, freeze, rumble or bounce. Preserve the browser geometry test and the independent `grapple-contract`.
5. Grapple first-use text: keyboard shows its key; touch shows the wheel glyph; bound pad shows the mapped button; unbound pad shows Pause→Controls→Grapple. No unresolved `{GRAPPLE}` token in any of five robot-world languages or NOSTOS theme variants.
6. `tools/studio/audit.py`: derive every outer timeout from `tests/run.cjs` metadata plus 180 seconds of runner overhead, kill the owned process group on timeout, save campaign result metadata, and clear inherited segment/stop variables. Keep all four `test_audit.py` regressions.
7. `tests/roomcache.cjs`: the post-guardian fixture includes `nfMeet` and retains crossing-state diagnostics; do not hide a real cache regression or widen performance budgets.

Important current-main decisions to preserve:

- Do **not** reintroduce `repair.webp` or the October 11 repair candidate. The old hero-identity defect is closed by the current `ratchet_wake` film plus `r_cell` and `r_marble` panels.
- Keep the Ratchet wake film provenance and the current B1 teaser placement.
- Keep Alpha optional after the forge and outside the lion gate. Keep the completed Alpha/pack and 30-frame lion assets; do not regenerate them.
- Keep finite infection trails: ordinary enemies red, bosses purple, bounded lifetime/pools, cleanup on cure/death/despawn/room change and reduced-motion behavior.

Before integration or release, run in an environment with a Playwright-compatible Chromium. This Codex worker had no executable and its browser download returned an empty archive, so its 159 browser-backed results are blocked evidence, not passes or established regressions. Run, in this order:

1. `npm ci`
2. `node build.cjs && node tools/pack-www.cjs && node tests/build-integrity.cjs`
3. `python -m unittest discover -s tools/studio -p 'test_audit.py' -v`
4. Focused browser checks: `node tests/run.cjs panels secrettell grapple roomcache filmflow repair-browser story-order chapter-one den-gate gravehorn infection-eyes infection-roster infection-poses opening-order campaign-contract grapple-contract`
5. Full collector in a new evidence directory: `CHROMIUM_PATH=<real executable> python tools/studio/audit.py --profile full --output docs/studio/runs/2026-10-13/integration-full`
6. A new cleared-storage uninterrupted `campaign-ch1` run: title menu, ordinary keyboard input only, no game-state writes, flags, injected inventory or teleports; no segment/stop. It must produce `certified: true`, the 16 required scenes in order, zero missed scenes, zero page errors and reach the B1 teaser. Clearly distinguish this from staged harnesses.
7. Inspect actual gameplay frames at 1280×720, 844×390 and 390×844, then test a real touch device/native package and controller mapping. Listen to key boss/audio transitions and feel haptic cues; viewport emulation is not mobile certification.

Do not weaken assertions, widen budgets, mark absent art as a pass or reuse the October 12 campaign as proof of this build. Fix reproducible failures and rerun the affected check plus the full gate.

Remaining production priorities, in order:

- P1 art gate: fulfill the existing GRAVEHORN queue once—14 authored rig plates and the four required manhwa beats (`gh_intro_a`, `gh_intro_b`, `gh_phase2`, `gh_down`)—then verify planted feet, both facings, horn detach, every tell/recovery, phase transition and purple infection-eye anchors at gameplay scale. Do not substitute generic art.
- P2 targeted correction: change only NULLFANG's red eyes in `assets/manhua/ch1/game/m_down.webp` to the established infection purple; preserve composition and purple seams.
- P2 targeted correction: in `r_cell.webp`, dim inactive Servo's amber eyes/chest or make the standby state unambiguous; the caption says he is switched off. Preserve the new on-model hero and Ratchet.
- P3 targeted correction: keep the sword in `r_marble.webp` unmistakably diagrammatic so the player understands the cave gives raw marble and Ratchet forges the blade.
- P3 targeted correction: repair HZD-99's elongated rear-view arms/legs in `passage_b.webp` without changing tunnel composition.
- Produce only FURNACE's six already-queued authored poses and validate vent/drop/parry transitions; do not regenerate completed cast assets.
- Reproduce TER-1 missed-jump recovery before changing A2 geometry; define and test one cross-boss checkpoint policy; correct NOSTOS `terminal20` wording without changing its read reward.

Use the approved image/media tool for raster changes, archive provenance, keep candidates separate until visually compared in the actual panel/game, and obtain owner approval. A single picture is not an animation. When all gates are green, commit normally to the integration branch, rebuild, verify source and built hashes, then follow the repository's authorized merge/deployment workflow. Report exact commits, tests, gameplay evidence and live BUILD_ID; never claim deployment from source presence alone.
