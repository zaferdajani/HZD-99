# CLAWBYTE v4.5 — equipment, dialogue and scene depth

2026-09-07. This release repairs gameplay state and presentation bugs. It does not certify the broader artwork overhaul as complete.

## Player-facing changes

- Gear separates ownership from the equipped weapon. Start with claws, forge the first sword from the quest material, earn a permanent second sword, then find the separate connector to unlock joined mode. Existing earned weapons migrate safely.
- Holding attack with dual swords produces the hurricane; joined mode throws the blade and returns it. Ordinary joined attacks remain melee. The thrown blade cannot duplicate, and room changes/death clear lingering combat state.
- The opening and conversations own the voice channel. Unmatched dialogue no longer plays an unrelated recording or random chirps. Changing lines stops old speech; waking and doorways no longer trigger an automatic hero purr.
- Player shadows follow nearby real ground and platforms. Scenery tinting no longer paints opaque boxes. Distant architecture remains rigid; inexpensive zone lighting persists at low quality.

## Verification

Build and native asset packaging were run from the same sources as the browser tests. Focused equipment, sword, charge, dialogue and scene-depth checks passed. The 88-harness suite ran through denlight; the remote environment expired at bake3d before its result and the final forge harness were captured. Both were recovered in a focused final run and passed. The final run also passed dialogue-audio, wake and slashsnd. The hzdvox combat fixture now explicitly starts after waking and confirms the same-frame voice gate (delta 1). Thresholds have not been lowered.

Three existing asset-quality checks remain red: hzdvox detects the hzd_atk2/hzd_yalla register mismatch (95/216 Hz), tinker detects near-duplicate work poses (closest sampled pair 0.905 against maximum 0.86), and hero detects camera-facing claw_1/burst frames (0.113/0.116). These assets were not replaced. The suite is not represented as fully green.

Final local and browser-tested page SHA-256 values match:

- index.html: c80bc496eff95821e9f29952478834f929d3c4f05a29ff431eaf64b92c1a8ac9
- odyssey.html: bfd9536f7852f59d5df225c5bc43df1846b2884a995cd3e28775bfc9b0715b4b

The packaged build includes 695 runtime assets and both game pages (155.4 MB). Rejected source artwork is excluded from the package.

## Visible limitations

Weapon ownership and attacks now follow the story, but the body renderer still lacks accepted continuous weapon-specific animation strips. Armed attacks can therefore retain the old unarmed body motion. This is a visible defect, not a completed sword animation implementation.

Five new Higgsfield motion takes and two reference images were reviewed. None passed grip, facing, geometry and motion requirements; none was wired into gameplay. Contact sheets and rejection reasons are archived in `assets/source/hero/weapon-review/`. Existing Ratchet pose repetition and hero attack facing defects remain tracked in `docs/ART_QUEUE.md`.

The full visual direction, including terrain, platforms, backgrounds, controls, boss choreography and contextual sound, is in `docs/VISUAL_GAMEPLAY_DIRECTION.md`.
