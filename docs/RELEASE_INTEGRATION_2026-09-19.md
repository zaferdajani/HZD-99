# Supplied hero integration — verified release

Live game: https://zaferdajani.github.io/HZD-99/

Runtime build **c40f96f4bdbf**, integration commit
7356d362af556307a6f18ee1378703ef6dadbcf6. Voice reconciliation checksum
follow-up: c274dd53610e813d78b82296311400017ebcf4f2. The latter changes a test,
not runtime bytes. Concurrent production changes through e0021f4 are preserved.

## Delivered

- All 37 supplied ZIP entries accounted for; 42 sheets and 291 registered frames.
- Movement, idle, guard, reactions, weapon attacks, aerial/plunge, charge,
  recharge and departure integrated with separate effects and move feedback.
- Third scratch rejects incompatible cached layouts; all six uppercut cells
  and all 64 idle frame/mood/facing cases pass against production.
- Approved Yalla pronunciation at natural playback rate. Excited wordless
  completion uses NYA-9-1 job 0e5908f7-2257-4888-90c1-f2f83a1523da. Softer take
  preserved. Ordinary action voices cannot interrupt the completion cue.
- Cave/door world alignment, duplicate-mouth removal, textured rubble,
  clearer terrain crests and ground-aligned frontier lighting.
- First-frame desktop viewport fitting corrected; standing ownership rule saved.

## Evidence

- 49 production page, supplied-art and voice SHA256 hashes match the local release.
- Twenty selected local integration harnesses passed, plus deterministic build
  identity and final entrance/cache/platform checks.
- Live reconciliation, scratch/idle cache regression, entrance alignment and
  release-polish passed. All eight production intro clips decode and advance.
- Web predeploy and live gameplay verification:
  https://github.com/zaferdajani/HZD-99/actions/runs/35438746636
- Android canonical Capacitor APK, including exact packaged idle, uppercut,
  both replacement voices and HapticsPlugin:
  https://github.com/zaferdajani/HZD-99/actions/runs/35438454297
- Windows packaged assets, offline launch and save persistence across restarts:
  https://github.com/zaferdajani/HZD-99/actions/runs/35438454246

## Limits and separate work

Physical phone/controller vibration has not been verified on hardware. Software
dispatch and native plugin packaging are verified. The owner's exact stale phone
cache was unavailable; incompatible-sheet behavior was reproduced and tested.

The entire historical suite is not all green: the existing Ratchet work-loop
similarity test also fails against the prior production baseline; the separate
offline 3D export tool produces a header-only WebM in this Windows environment.
Neither check was weakened or disabled. Neither is part of the supplied hero
runtime integration. Historical enemy-art queue entries are not claimed complete.

One live movie probe initially failed on intro2; an unchanged rerun and the
independent CI live playback check passed. This is recorded rather than omitted.

The UI comparison is in UI_DESIGN_REVIEW_2026-09-19.md. A broader prompt/tutorial
redesign is a recommendation from the owner's comparison request, not a delivered
redesign. Original source artwork takes precedence over mechanically recoloring
it to meet every numeric target in the inherited generation brief.

