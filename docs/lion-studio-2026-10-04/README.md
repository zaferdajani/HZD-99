# Nullfang motion and sound pass — 2026-10-04

This pass replaces the first guardian’s core locomotion and attack performances with original Higgsfield Seedance 2.5 footage referenced to the existing Nullfang design. No Lion King game art or sound is used. The custom Canvas engine is retained: the problem was incomplete poses and animation timing, not a missing rendering engine.

## Delivered

- Seven delivered takes, 174 runtime frames: stalk (24), gallop (24), single swipe (24), heavy rake (30), coil/pounce/landing (30), roar (30), hurt (12).
- Ground travel advances gait; drawing cannot advance animation or reset a wind-up. Chase acceleration is bounded, with distance hysteresis between stalk and gallop. Blocked movement no longer cycles the feet.
- Single claw strike in phase one; a distinct heavier second rake in phase two. Both retain the readable warning. Contact effects do not extend damage reach.
- The airborne sequence follows recorded flight duration. Ledge spring/dive, perch and gravity attacks reuse matching poses. Stagger/recoil use the same new lion body. Existing dormant/waking assembly and death performance are retained.
- Ten generated sound cues: arrival, awakening, breath, step, coil, leap, swipe, landing, pain and roar. Creature actions no longer trigger hero attack/jump voice routing, including gravity pounces.
- Contact claw traces, motion afterimages, existing landing dust, a single coil flash envelope, and timed launch/roar/landing haptics. Existing player feedback preferences and unsupported-device fallback remain in charge.

## Delivery and balance

Animation cells are 448×256. Empty margins were removed from the initial 512×384 delivery without resizing the subject, reducing decoded sheet memory by 41.7%. All poses use one scale per take and a common floor. The swipe registers against the hind paws so its filmed forepaw flash cannot lift the body off the floor.

Low-tier copies are quarter size at quality 0.28. Replaced legacy strips are no longer in the front-loaded low-tier manifest. Full-resolution sources are preserved. Only the lion room’s measured prefetch group and new asset sizes were changed; unrelated sampler differences were excluded.

Damage, health, hitbox sizes and player scale are unchanged. Phase-two rake duration is 0.48s, with contact at 0.12s; the first swipe stays 0.24s/contact 0.06s. Landing settle is unchanged; the following idle is 0.30–0.45s so the new acceleration remains inside the project’s existing punish-window limits. No balance threshold was widened.

## Provenance and review

Source clips, successful and failed generation job IDs, and exact audio cuts are in `assets/source/beast/studio-2026-10-04/`. `tools/lion-studio.py` extracts and keys source frames; `tools/lion-audio.py` cuts, normalizes and fades generated audio. `assets/CREDITS.md` records attribution.

`motion-review.jpg` shows sampled delivered poses. `frame-validation.json` records every cell’s bounds, body-pixel count and file hash. A keyed flash initially erased a body frame; the matte now preserves substantial armour components even when a flare touches the image edge. The browser regression rejects any strip that loses more than half its body coverage. This review is the assistant’s inspection, not a claim of owner art approval.

`gameplay.mp4` records the production renderer, simulation and sound event calls. Its focused mode keeps the shipped camera, prevents player/boss death during the fight, and lowers boss HP after 15s to exercise phase two. It does not force incomplete attack states. The final defeat is explicitly triggered for the review.

## Verification

- `npm run app:pack` assembles both native/web packages.
- All 138 repository harnesses have passing results across the full run and targeted reruns. The initial full run had two failures: the rematch expected the replaced generic slam, and the local Chromium installation lacked its adjacent SwiftShader libraries. The test now checks distinct arrival/awakening events; the environment libraries were restored and the unchanged 3D bake test passed. All logs are retained alongside this note.
- Dedicated lion harness checks loaded art, all-frame body coverage, browser-decoded audio signal/tails, render-independent clocks, planted gait, continuous flight, phase-two warning/attack count, distinct creature sound routing and bounded acceleration.
- Existing art, motion, opening, first-meeting, rematch and low-tier gates retained. The rematch test now requires exactly one awakening cue distinct from first arrival, reflecting the requested sound design.
- Physical gamepad/mobile vibration feel and subjective speaker/headphone mix still require device review. Automated routing and audio decoding are tested; these are not substitutes for hardware listening or art direction.
