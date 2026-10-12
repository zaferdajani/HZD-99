# Validation evidence — 2026-10-12

## Verdict

The final clean campaign certificate is green; the studio art/release gate is not. A full registry run after the main fixes completed all requested checks with only one load-sensitive GRAVEHORN timing sample failing; that run’s seven-point charge window and every other GRAVEHORN assertion passed. The representative sample moved from the edge to the measured centre of the unchanged safe window and passed under subsequent full load. A later complete run preserved three failures: a staged `chapter-one` fixture had not acknowledged the new passage page, one unchanged room-cache timing check spiked under load, and a seven-death campaign correctly failed because gate arrived late and CHIME never appeared. Those results exposed intermittent event ownership rather than being hidden.

Post-fix focused checks pass for the final runtime. A first campaign retry was stopped at 02:21 after its log proved bay had already been skipped; spending another twenty minutes could not change that certificate. W2/A0/GA1T/A9 boundary ownership was then completed. The final cleared-storage campaign passes in **19:27 with two deaths, all 16 beats in order, zero misses/order errors/page errors, and no segment/stop**.

No test deadline, gameplay window or cache threshold was widened to produce a pass. The GRAVEHORN mechanics were not changed by the timing-test correction.

## Environment and versions

- Linux; Node and Python from the workspace runtime.
- Chromium: `/tmp/chromium-20261012`.
- SwiftShader/WebGL environment: `LD_LIBRARY_PATH=/tmp:/tmp/al2023-20261012/lib`, `VK_ICD_FILENAMES=/tmp/vk_swiftshader_icd.json`.
- Audited source base: `1bf250f0c7e758e7ea907d1adbba9504adeba21f`.
- Final built `BUILD_ID`: `32a3376e3537`.
- Registry: 180 unique registered tests plus build, package/start and served-identity checks.

## Exact commands

| Command | Result / evidence |
|---|---|
| `PYTHONDONTWRITEBYTECODE=1 CAMPAIGN_VIDEO=0 CHROMIUM_PATH=/tmp/chromium-20261012 LD_LIBRARY_PATH=/tmp:/tmp/al2023-20261012/lib VK_ICD_FILENAMES=/tmp/vk_swiftshader_icd.json python3 tools/studio/audit.py --profile full --output docs/studio/runs/2026-10-12/automated` | Initial complete diagnosis: GRAVEHORN timing sample, campaign narrative contract and headless WebGL failed. Evidence retained. |
| `PYTHONDONTWRITEBYTECODE=1 ... python3 tools/studio/audit.py --profile focus --output docs/studio/runs/2026-10-12/post-fix-focused --tests opening-order panels story-order roomcache secrettell gravehorn grapple campaign-contract` | Focused fixes; all except the then-inconsistent panel fixture pass in their recorded attempts, followed by corrected panel rerun. |
| `PYTHONDONTWRITEBYTECODE=1 ... python3 tools/studio/audit.py --profile full --output docs/studio/runs/2026-10-12/final-automated` | All requested scope completed; 183/184 collector entries passed. Only representative GRAVEHORN edge sample failed; campaign certified 16/16 in 18:34, 6 deaths, zero page errors. Build/package/identity/WebGL passed. |
| `PYTHONDONTWRITEBYTECODE=1 ... python3 tools/studio/audit.py --profile full --output docs/studio/runs/2026-10-12/final2-automated` | Complete run after passage boundary: GRAVEHORN passes under load; staged chapter fixture, one room-cache sample and fail-closed campaign fail. Campaign evidence identifies late gate/missing CHIME rather than claiming success. |
| `PYTHONDONTWRITEBYTECODE=1 ... python3 tools/studio/audit.py --profile focus --output docs/studio/runs/2026-10-12/story-boundary-focused --tests panels chapter-one campaign-contract story-order opening-order roomcache` | Runtime boundary regressions, corrected chapter fixture, opening-order and unchanged room cache pass. Original graph fixture failure preserved and corrected separately. |
| `PYTHONDONTWRITEBYTECODE=1 ... python3 tools/studio/audit.py --profile focus --output docs/studio/runs/2026-10-12/bay-boundary-focused --tests panels chapter-one story-order campaign-contract` | Final event-boundary runtime/fixtures: all pass. |
| `PYTHONDONTWRITEBYTECODE=1 CAMPAIGN_VIDEO=0 ... python3 tools/studio/audit.py --profile focus --output docs/studio/runs/2026-10-12/final-campaign-2 --tests campaign-ch1` | Final campaign passes: 19:27, 2 deaths, 16/16 ordered panels, zero errors. |
| `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tools/studio -p 'test_audit.py' -v` | Four collector regression tests: metadata budgets, failure code, unreadable metadata and child/grandchild timeout cleanup. |
| `node --check` on changed JS/CJS files; `git diff --check` | Syntax and whitespace checks; no functional claim by themselves. |

Ellipses in the table stand for the same Chromium/SwiftShader variables printed in full in the first command, not a different environment.

## Clean campaign certificate

The campaign starts from cleared storage and the real menu, chooses Kitten, and uses keyboard controls. It never writes flags/inventory or teleports; it does read room/player/mission state and uses a map-aware automated planner. It is therefore stronger than staged tests but is not a blind human playthrough.

The certified required order is:

`wake → bay → gate → letter → drawer → ratchet → meet → cave → marble → forge → passage → sage → break → chime → free → ch2`

Certification additionally requires:

- result `complete`;
- no `CAMPAIGN_SEGMENT` or `CAMPAIGN_STOP`;
- zero missing or explicitly missed panels;
- zero order errors;
- zero browser page errors.

The final run logs bay before city entry, gate before Ratchet, passage before the first GA1T→GA1D crossing, and CHIME before the first post-victory A9 exit. `tests/campaign-contract.cjs` independently makes missing, missed, out-of-order, page-error, segmented and stopped results fail.

## Staged versus uninterrupted evidence

Most of the 180 harnesses intentionally stage saves, rooms, actor states or test fixtures to isolate one contract. They establish deterministic mechanics and rendering but cannot certify whole-game discoverability. `campaign-ch1` is the only uninterrupted start-to-teaser input run in the collector. `opening-order` is a narrower injected-start tutorial traversal and uses keyboard/pointer in both desktop and mobile-sized viewports.

## Visual inspection

Twenty-one fresh screenshots cover seven panel subjects in desktop, landscape-phone and portrait-phone dimensions. The most important observations are:

- `repair.webp`: wrong protagonist identity remains obvious at 844×390.
- `m_down.webp`: NULLFANG’s red eyes violate the purple boss rule.
- `passage_a`/`passage_b`: both remain readable at gameplay size. B has stylized elongated proportions but today's captures do not justify calling it a progression blocker.
- Recent Sage, forge and Chapter Two samples retain the canonical visor/scarf language.
- Historical GRAVEHORN intro at 844×390 clearly shows the procedural rig quality gap; source confirms no authored asset directory exists.

Still frames do not certify motion smoothness, audio impact or controller vibration.

## Preserved failures and honest limits

- Initial campaign failure established the old harness could reach the end with a missing bay beat and wrong ordering; the contract now rejects this.
- Initial `bake3d` failure was an environment/library-path problem. A later identical code run passes after exposing SwiftShader libraries at `/tmp`.
- The final campaign before the passage-boundary patch already certified all 16 sequences, but first showed passage only after a death/retry. This exposed the skilled no-death edge case; the runtime gate was then added and the post-boundary campaign shows passage before first crossing.
- One full-run room-cache sample measured 380 ms versus its computed 204 ms budget. Earlier full runs passed (maximum 187 ms) and the final code keeps the budget unchanged.
- No physical touch device, native wrapper, subjective sound/haptic assessment, human default-difficulty boss play or owner art approval was performed.
