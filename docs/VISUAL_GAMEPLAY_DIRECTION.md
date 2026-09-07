# CLAWBYTE — visual and gameplay direction

Owner direction, 2026-09-07. Target an original machine-world action adventure with the readability, atmosphere and control quality requested in the reference games. These are design goals, not claims of equivalent production quality.

## The world should feel built and inhabited

| Area | Direction | How to verify |
|---|---|---|
| Terrain | Walkable surfaces come from rocks, collapsed machinery and eroded ground. The visible support lip, collider and shadow must agree. Keep jump destinations readable before takeoff. | Traverse rises, shelves, pits and room seams in both directions; inspect feet and landing points. |
| Platforms | Tie ledges to convincing supports: roots, beams, wrecks or rock shelves. Give the top edge contrast and a clear underside. Use moving machinery with a visible motion cycle and pause at boarding points. | Test landing during ascent/descent, edge recovery and mobile visibility. |
| Backgrounds | Distinct far skyline, middle architecture and sparse near silhouettes, each at its own camera rate. Keep buildings rigid. Let fog, hanging cables, plants and machinery carry ambient motion. | Stationary architecture does not scale or drift; walking reveals depth without doubling landmarks. |
| Lighting | One dominant source per scene with restrained local accents. Reserve strongest contrast for the player, valid platforms, exits and attack tells. Avoid cumulative glow obscuring shapes. | Read grayscale screenshots at phone size; ensure low quality keeps the same important landmarks. |
| Environmental story | Repeat evidence of each area's purpose: extraction, transport, manufacture, storage. Broken machinery and NPC repairs explain what happened without long exposition. | Every landmark has a gameplay or narrative reason to exist. |
| Animation | Animate a consistent articulated character through anticipation, action and recovery. Extract chronological source frames; reject duplicated poses, malformed grip, foot sliding and missing weapon geometry. | Compare raw motion, contact sheet, hitbox timing and in-game facings. Never attach a sword to a claw clip. |
| Controls | Predictable acceleration, short input buffering and jump grace, variable jump height, deliberate dash cancellation and clear recovery windows. Tune one variable at a time with input traces. | Repeat identical jumps and combat sequences on keyboard, controller and touch, including frame drops. |
| Enemies | Give each enemy a distinct approach, warning, attack and punishable recovery. Combine complementary roles without stacking unavoidable attacks. | Defeat without damage using earned abilities, then exercise close-range and retreat counters. |
| Bosses | Teach a small vocabulary, then combine it across phases. Lock aimed attacks before impact; do not track after the player commits to a counter. Put spectacle between decisions. | Test both phases, arena corners, minimum equipment, recovery windows and restart time. |
| Sound | Separate dialogue, character actions, impacts, UI, ambience and music. One foreground voice at a time; contextual foley by surface and equipment, restrained variants and repeat limits. | First wake/NPC sequence has no unrelated vocal cue; dialogue never replays a different sentence or overlaps stale speech. |

## Corrections implemented in the v4.5 working build

- Contact shadows resolve actual heightfield support, shelves and moving platforms, and disappear when no nearby support exists.
- Flora and lair tinting is isolated on cached transparent canvases, preventing tint boxes on the scene.
- Vista scale and position no longer breathe or sway independently of movement.
- Low quality retains a cheap cached zone-light grade.
- Dialogue playback matches recorded text, suppresses incidental vocal chatter during story scenes and cancels stale audio requests. Unrecorded lines remain readable and unvoiced.
- Sword ownership is separated from equipped mode, with permanent dual mode and connector-gated joining; each held attack follows its equipped mode.

## Production boundaries

The current background renderer still uses a lower-band copy of the same painting for some depth. Replacing that with separately authored foreground/midground plates is an art task. Terrain depressions and aggressive foreground occlusion need a further collision/readability pass, not cosmetic smoothing. New sword and scratch clips require acceptable anatomy, grip, facing and full recovery plus the owner's art review before integration. These limitations remain explicit; the code corrections do not certify that the full visual redesign is finished.
