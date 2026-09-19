# CLAWBYTE presentation review — September 19

Reference: the owner's screenshot with the single “RT · Bind” interaction.
Evidence: actual local opening at a 1920×1080 browser viewport, plus the supplied cave screenshots. A still screenshot cannot establish the reference game's tutorial timing or accessibility behavior.

| Area | Reference screenshot | CLAWBYTE observed | Recommended direction |
|---|---|---|---|
| Screen use | Scene fills the video picture | Cold desktop start initially occupied 960×540 inside 1920×1080 | Fit viewport from the first frame, preserve aspect ratio and camera scale |
| Action prompt | One button glyph and one verb | Bright outlined card above the hero with action and secondary instruction | Stable teaching region, compact contextual interaction prompt, clear device glyph |
| Attention | Character and interaction object dominate | Room title, card, bright HUD and visual effects compete | Prioritize the current action and reduce unrelated emphasis during teaching |
| Terrain | Strong foreground silhouette and softer distant scenery | Painted walls and playable surfaces have similar visual weight | Keep walkable crests distinct; align doors and rubble with the painting |
| Typography | Large readable action with few words | Small secondary hint inside a dense card | Larger high-contrast instruction, constrained line length, localization-aware wrapping |
| Walkthrough | Not assessable from one screenshot | Sequential lessons exist in code | Validate learning through actual actions; provide help when stalled; avoid stacked explanations |

## Verified local change

The desktop layout skipped initial sizing because `lastBoxW` began as the same empty string as the canvas's untouched inline width. Initializing it to `null` makes the first frame perform layout. Repeated capture now reports canvas 1920×1080 and display 1920×1080 at the same viewport. Hero scale and camera zoom remain unchanged. This is viewport fitting, not a claim that the browser entered exclusive fullscreen.

## Status

Design comparison delivered; cold-start viewport fix implemented and captured locally. Broader prompt redesign remains a recommendation, not a completed or deployed change. The viewport fix is live in build c40f96f4bdbf; cold-start sizing and live gameplay checks pass.

