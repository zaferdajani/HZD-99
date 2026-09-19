# HZD-99 integration completion checklist

Owner scope: supplied protagonist artwork and every requested move, separate
effects, sound, haptics, flashes, usable packages, release checks and live proof.
Concurrent kingdom-move additions and their queued art must be accounted for;
archived/rejected experiments are not automatically approved replacements.

## Completed with existing evidence

- [x] All 37 supplied ZIP entries mapped to runtime/source records; 42 body and
  projectile sheets, 291 registered frames. `source-to-runtime.json` and
  `tests/hero-delivery.cjs` are the provenance/geometry checks.
- [x] Movement, states, backwalk variants, guard, reactions, weapon-mode combat,
  aerial/plunge, recharge and departure wired.
- [x] Scratch combo order, reach and 180ms recovery wake corrected and verified
  in live build `54d2563b30ce`; see `SCRATCH_VALIDATION.md`.
- [x] Existing child voice preserved; no unapproved synthetic voice substituted.
- [x] Latest kingdom A–E move commits preserved and their 5 harnesses pass.
- [x] Previous web deployment and Windows build succeed at `1b8dd9239c59`.

## Current completion work

- [x] Reject incompatible cached third-hit sheets and verify sequential gameplay input and every uppercut frame locally. Exact owner-device cache contents remain unavailable; live checks follow below.
- [x] Correct idle playback from the supplied sheet, including mood changes and the transition out of combat. Geometry and actual mood pixels pass locally.
- [x] Integrate owner-approved Yalla take 37007143-3fb3-43b8-b4fb-6cd09b33351f using Higgsfield NYA-9-1 at natural playback rate. Rejected takes excluded. Live publication pending.
- [x] Replace clipped completion voice with an excited wordless NYA-9-1 cheer; preserve the softer take. Whole-cue priority, voice register, clipping and tail decay pass locally. Live publication pending.
- [x] Integrate cave/door world anchors, remove duplicate mouths, texture rubble and separate terrain from painted walls. Entrance alignment, cave-light, passage and door tests pass locally.
- [ ] Persist the owner's exact standing rule in the published project.
- [x] Audit every requested move for artwork, VFX, audio, flash and haptic event
  coverage; fix missing or unreachable events without causing false impacts.
- [x] Reconcile queued kingdom-move art with the current renderer; integrate
  required approved/generated art and record any genuinely blocked dependencies.
- [ ] Fix Android SDK setup and use the canonical app/assets/haptic pipeline.
- [ ] Verify native packages contain the actual runtime assets and plugin hooks.
- [ ] Run appropriate integration and release gates; resolve in-scope failures.
- [ ] Publish the complete integrated result, verify live identity/assets and
  interaction, and collect successful package/release workflow evidence.
- [ ] Update stale status documents and deliver one final evidence-backed status.

Physical phone/controller vibration cannot be claimed from software-only checks.
Any new protagonist voice must use the user's existing Higgsfield character
source; locating that source is required only if a new vocal is actually needed.
