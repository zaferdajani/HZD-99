# CLAWBYTE v4.4 — Gear and combat release

2026-09-06. This release integrates the shared-branch work in 6124df8 into the live branches.

## Changes

- Robot Crest screen replaced with Gear: character preview, authored boot/jet inspection art, installed traversal hardware, optional equipment, power capacity, touch scrolling, English and Arabic labels, compatible saves.
- Base jump boots are present at the start. Jets follow NULLFANG; later air-jump boots replace the base boot entry. Phase installation requires jets.
- Hero combo inputs 0/1/2 route to distinct authored attack states. Running stride follows distance traveled.
- Glaciere commits its cage warning and final charge direction; Prism decoy projectiles originate at the decoys. Production state tests cover both phases.
- Motion extraction preserves source chronology and rejects static, noisy and alternating copied poses. It never silently lowers motion acceptance.
- Forge now applies reviewed JSON operations locally and exports a room brief for an assistant. The public editor no longer collects API keys or calls Anthropic; credentials saved by older versions are removed without reading or transmitting them. Painting, entity placement, room editing and pack export remain available.

## Validation

Built all four pages and packaged 695 assets for the app (155.4 MB including game pages). Full 84-harness suite completed: 80 passed, four failed. Beacon passed an isolated repeat without a gameplay change; its full-run failure is recorded, not erased. Revised Forge and beacon both passed after the final editor rebuild. Local and browser-runtime hashes match for all four final pages.

Outstanding quality findings on existing unchanged assets:

- hzdvox: hzd_atk2 strongest partial 95 Hz and hzd_yalla 216 Hz below the 300 Hz register threshold.
- tinker: closest pose pair similarity 0.880 exceeds 0.86.
- hero: first claw/burst facing widths 0.113/0.116 exceed walk maximum 0.099.
- beacon full-run screenshot comparison lost contrast (68%) and increased torso brightness by 28; isolated repeat retained 101% contrast with -0.6 brightness difference. Possible timing/asset-readiness sensitivity remains unresolved.

The full run preceded the editor-only change. The subsequent game pages differ only in their build stamp; editor behavior was tested separately after that change. No test thresholds were weakened.

Final index.html SHA-256: 96bdf28d9afe9506bf52fdffa921b4ccdca6f06f244cb2866e7b02f42e894ca1.

## Art and story scope

Scratch takes 1 and 2 were rejected; take 3 improves the unarmed profile and return but still holds the extended paw too long. Its contact sheet is archived for owner review. No replacement scratch is integrated.

The requested claws → first forged sword → permanent dual swords with charged hurricane → connector and charged returning double-blade progression is specified in SWORD_STORY.md, but this release does not implement those separate stages. Existing crystal/twin progression remains. Gear and combat fixes must not be reported as completion of that storyline.
