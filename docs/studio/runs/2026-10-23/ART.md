# CLAWBYTE art and VFX review — 2026-10-23

No production art changed after the October 22 review. Approved hero,
Alpha/pack, crystal, sword, NULLFANG/lion and Talon assets were preserved and
must not be regenerated.

## Three independent responsibilities

| Responsibility | Verdict | Evidence |
|---|---|---|
| Senior Character Artist | Issues — carried | Hero-relative quality remains uneven. GRAVEHORN has no authored rig/body set; true bound wolf/cheetah down-breathe-recovery remains absent; Furnace lacks six required poses; the hero purification raise/hold/slash/recover body performance is still procedural. |
| Senior Cinematic Director | Issues — carried | Story trigger order passes, but `m_down.webp`, `r_cell.webp` and `passage_b.webp` retain localized continuity/art defects. Only the lion ritual has a reviewed authored extraction film; Brood, Atlas, Zero and Prism use the explicit engine fallback. |
| Senior VFX Artist | Pass for the bounded eye system; device performance open | Ordinary infected eyes are red, boss/Sage/Alpha eyes purple, anchors are pose-local, trails follow world-space travel, lifetime/caps are finite, cured/removed/room-changed owners clean up, and reduced motion suppresses smoke while keeping the eye glow. Fresh `infection-eyes`, `infection-roster` and `infection-poses` harnesses pass. |

## Gameplay-scale character inspection

- Pack wolves retain twelve authored strips selected directly by
  `js/wolves.js`: idle, prowl, gallop, coil, bite, crouch, leap, landing,
  recoil, pant, purify and sit. Measured `wolfProwl8` cells have 116–119 px
  opaque body height and 4–5 px floor padding.
- Alpha retains ten dedicated strip files and the 17-state selector. Measured
  `alProwl` cells have 223–226 px body height and 3–4 px floor padding.
- `sageWalk8` has eight cells, 186–187 px body height and a common floor line.
  The fresh October 22 gameplay frame shows the rescued Sage standing and
  walking rather than sleeping/sliding. Robe/leg separation remains visually
  subtle compared with the hero; that is a quality note, not a new regression.
- `docs/ART_QUEUE.md` and `docs/combat/BOSS_GRAVEHORN.md` still record the
  GRAVEHORN design, fourteen rig plates and four intercut panels as ungenerated.
  Runtime therefore still depends on a procedural/flat stand-in.
- `js/wolves.js` still holds a crouch cell for a defeated bound creature; real
  wolf/cheetah breathing-down and recovery strips remain pending.

## Panel continuity

| Asset | Observed issue | Bounded correction |
|---|---|---|
| `assets/manhua/ch1/game/m_down.webp` | NULLFANG's infected boss eyes are red instead of purple. | Localized eye-color edit; preserve framing/composition. |
| `assets/manhua/ch1/game/r_cell.webp` | The supposedly powered-off Servo has orange eyes and a bright cyan chest. | Darken only the inactive indicators; preserve the panel. |
| `assets/manhua/ch1/game/passage_b.webp` | Compact hero anatomy drifts from the approved model. | Localized anatomy correction using the approved hero identity. |

## Purification media

- `assets/video/purify_glitch_ritual.mp4` is the approved lion ritual:
  1280×720, 13.25 seconds, with the specified picture and audio fade in
  `docs/combat/purification-2026-10-16/HIGGSFIELD_SCRIPT.md`.
- Older Brood/Atlas/Zero clips are 960×540 and 8.04 seconds; Prism is 960×540
  and 5.5 seconds. They do not show the required guardian-to-sword extraction
  choreography and are correctly excluded from `PURIFICATION_MOVIES`.
- `js/purification.js` maps only NULLFANG to reviewed authored media. The other
  four use the explicit in-engine fallback; do not relabel old clips as done.

## Eye-trail implementation

`js/infection-eyes.js` preserves red/purple classes, transformed per-frame
anchors, travel-only emission, teleport/removal/room cleanup, 1.125–1.875 s
lifetime, fixed 90–320 tier caps and reduced-motion suppression. Friendly
`wolfPurify6`, `wolfSit6` and `sagePure` correctly have no hostile anchors.

## Production acceptance

- Do not regenerate approved/completed hero, Alpha/pack, crystal, sword, lion
  or Talon assets.
- Produce only the ledgered GRAVEHORN, bound recovery, Furnace, hero ritual
  body and four missing guardian-film assets, with provenance and owner review.
- Inspect every candidate at actual gameplay size and across all required poses;
  a single still is not an animation.
- Measure sustained eye-trail frame time and memory on a physical phone before
  certifying the effect budget.
