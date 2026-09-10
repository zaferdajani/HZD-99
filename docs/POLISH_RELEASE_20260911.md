# CLAWBYTE engineering polish release — 2026-09-11

## Scope and evidence

This release addresses the ten requested engineering/presentation areas. It is not a certification of Steam readiness, a claim that every art-quality issue is solved, or a claim that new animation/voice performances were generated.

The acceptance workflow is `.github/workflows/apply-polish.yml`. Its reports and screenshots identify the exact tested source commit. Pages rebuilds from source, runs blocking gameplay tests, stamps `DEPLOY_COMMIT` and `release.json`, then verifies live CDN file hashes, browser execution and a fresh-save opening. A source push, successful compilation, or queued deployment alone does not establish that the release is live.

| Requested area | Implementation and acceptance coverage |
|---|---|
| Protagonist size | Whole-world camera framing replaces the isolated 1.78x sprite wrapper. The idle body's opaque height is measured directly; exploration target is approximately 20% of the gameplay viewport height, not browser chrome or laptop bezel. |
| Camera | Shared projection, responsive horizontal lead, finite/clamped framing and encounter zoom; hero, world, interaction indicators and combat effects use coherent scale. Tested across seven representative rooms. |
| Canonical locomotion | States/walk/run/idle are embedded into CLAWBYTE and decoded before gameplay. Normal running does not fall back to the retired alternating run poses. The run loops its measured nine-frame stride, not an arbitrary sixteen-frame window. |
| Movement transitions | Remove redundant state-changing wrappers and double-applied procedural gait bob; preserve actual state timers and authored strips. Check foot lift, distinct frames, grounding, charge while moving and correct combat sequence routing. This is not new in-between artwork. |
| Control response | Input edges consumed once across substeps; held touch remains held; focus loss releases inputs. Attack/jump edges survive hitstop. Real-loop timing is asserted at 12/20/30/60/120/144 fps. Existing jump/dash geometry is preserved rather than arbitrarily changed. |
| Tutorial and progression | One controller derives allowed actions from the displayed, usable prompt. Travel never pins player position or clears directional inputs. Stale locks recover; menus/dialogue release control. W2's jump lesson detects its actual reachable one-way shelf, and its marker points to that shelf. A real-keyboard fresh save must reach the workshop without teleports or granted resources. |
| Room flow | Route, seam, cave passage, terrain step-up, door, workshop, map and first-chapter progression regressions. The room smoke test visits all 77 rooms in both game variants; that is not a substitute for a full campaign playthrough. |
| Combat | Validated combo/charge routing, physical reach, directional targeting, hitstop, protected-target and sage cleansing rules, boss warnings/counters and buffered input. Motion probes use the actual player renderer independently of camera position. |
| Audio | Foreground voice priority and foley separation; commissioned score routing and bounded music overlap. Two existing voice files were processed for register/rumble consistency and smooth tails, with exact provenance in AUDIO_POLISH.json. All authored one-shots are decoded and measured in QA. No new performances were generated. |
| Release presentation | Real eight-clip intro decoding in Chromium and WebKit, complete-reel/replay check, versioned app-scoped cache, storage-denied fallback, save feedback, asset-aware deterministic build identity and native no-service-worker packaging. Windows build validates an actual EXE, offline movement/media and save recovery across restarts. |

## Test-quality corrections

Earlier tests had misleading results: the motion probe cropped an unprojected screen location; a missing ffmpeg executable was reported as corrupt audio; the platform test did not assemble its input; the old film test could pass with zero shots; the old opening test printed a stalled lesson without asserting completion. These probes now check their actual stated contracts. Existing motion thresholds were retained, not lowered to conceal an animation failure. The regression runner flushes its complete log before exit.

## Known limitations retained explicitly

- `docs/ART_QUEUE.md` retains the reviewed first-claw and charged-burst facing/style issues. This engineering release does not claim those recordings were replaced.
- Passing sampled-frame/grounding checks does not certify every limb, every animation transition, or an entire campaign's subjective feel.
- WebKit automation is not a physical-iPhone/Safari certification. Physical touch/gamepad and prolonged-session checks remain part of release qualification.
- The portable Windows build is unsigned. Steam packaging, achievements/cloud integration, controller certification and storefront review are separate from a playable GitHub Pages deployment.
- Test evidence must name its actual commit. Deployment proof is the live-verification artifact and served release.json, not this document's existence.
