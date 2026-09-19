# Supplied art recovery and move feedback

The owner expanded the scope to every supplied artwork, including all eight later effect composites. All eight now have recovered bodies packed and routed locally. A generated draft or an archived source is not a completed game asset. The supplied-hero integration is published and verified; see RELEASE_INTEGRATION_2026-09-19.md.

| Supplied sheet | Move | Current state |
|---|---|---|
| B2-01 | Single-sword charged move | Ten body poses: three held-charge poses and seven release/recovery poses; separate six-cell FX strip |
| B2-02 | Dual-sword combo | Eight body poses routed through three combos; separate eight-cell FX strip |
| B2-03 | Charged dual-sword spin | Ten body poses: three held-charge poses and seven release/recovery poses; separate timed FX |
| B2-04 | Joined-blade combo | Eight body poses routed through three combos; 384px cells preserve overhead weapon extension |
| B2-05 | Joined-blade throw/return | Six body poses tied to hold/release/catch clocks; separate physical projectile image |
| B2-06 | Claw jab | Five body poses routed to the first unarmed combo hit |
| B2-07 | Charged claw burst | Twelve body poses split six held-charge / six release; existing separate burst FX retained |
| B2-08 | Single-sword normal combo | Eight body poses routed through three combos; separate timed FX |

Validation: 291 manifest frames pass source-hash, single-scale-per-source, dimensions, floor and edge checks; minimum inter-frame gutter is 19px. Combo input/routing, charge/release separation and haptic adapter tests pass. A 42-sample actual-renderer contact sheet was inspected from local build `29a0b0c5d829`. These checks do not prove every pose meets the original 400px source-height, eye-spacing or palette targets. Preserving the owner's supplied design remains the priority.

Older-source reconciliation is complete: `c1_walkramp.png` drives unarmed gate departure with perspective compensation, `v2/supercharge.png` supplies an alternating recovered charge variant, and `b5_interact.png` supplies the body-only recharge sequence. Existing `v3/supercharge_fx.png` and `v4/heal_fx.png` map to their active separate effect strips. `source-to-runtime.json` maps all 37 ZIP entries (including two duplicates) to runtime assets. The newly supplied combat overview also supplies dedicated six-frame air and six-frame downward attacks; plunge impact poses require real ground contact.

For each move, verify body selection, facing, scale, frame timing, separate VFX, windup/release sound, confirmed-contact sound/particles/flash, recovery, and supported-device vibration. Preserve gameplay hitboxes and progression. Confirmed-hit feedback must not fire just because an animation played. Existing effects remain as loading fallbacks, not duplicate layers over loaded authored FX.

Gameplay haptics now use the existing native/mobile adapter when no controller actuator is available. A 40ms duplicate guard avoids retriggering the same event from camera shake. Light attack/dash cues are distinct from confirmed contact. Haptic adapter tests pass; physical controller/phone vibration has not been tested here.

Voice constraint from the owner: any additional protagonist vocal must use the established Higgsfield audio character/source pipeline. Preserve the supplied recordings. Do not substitute a preset, another provider, or an invented voice identifier. The saved character is NYA-9-1, element ad57f3f2-2372-4c21-8578-a6cb52612979. The owner approved the pronunciation of regenerated Yalla take 37007143-3fb3-43b8-b4fb-6cd09b33351f on September 19. That take replaces the rejected pitch-shifted recording at playback rate 1. Two rejected Arabic-text attempts are excluded.

Release evidence is recorded in RELEASE_INTEGRATION_2026-09-19.md: live build c40f96f4bdbf, 49 matching page/art/voice hashes, successful web verification and native packaging.

