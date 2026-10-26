# Art, cinematic and VFX review — 2026-10-26

There is no new production-art delta from October 25. Approved hero,
pack/Alpha, crystal, purifier sword, NULLFANG/lion and Talon assets were
preserved. No asset was regenerated.

## Roles 7–9

| # | Responsibility | Verdict |
|---:|---|---|
| 7 | Senior Character Artist | **P1 Gravehorn; P2 bound forms, Furnace and purifier body acting remain open.** |
| 8 | Cinematic Director | **Four Gravehorn intercuts, four guardian ritual films and three localized panel corrections remain open.** |
| 9 | Senior VFX Artist II | **Finite red/purple eye contract passes on host; sustained physical-device performance remains unverified.** |

## Gameplay-size inspection

- The Ratchet repair board has strong hierarchy, clear component identity and
  readable retry guidance.
- Ratchet and the forge read well at 1280×720; the authored environment has
  substantially more depth than the fallback enemy work.
- The freed Sage moment is understandable, but two center story cards, status
  labels, goal copy and the HUD compete at once. The freed bound creature is
  tiny and flattened.
- Restored NULLFANG has a clear gold friendly silhouette. The reward card,
  objective and underlying notice stack occupy the same upper band.
- Gravehorn remains a flat translucent procedural rhino beside the finished
  hero. Purple optics and phase cracks do not substitute for articulated art.

Fresh campaign frames are retained under `automated/campaign-ch1/frames/`.
Prior gameplay-size Gravehorn captures remain under the October 18 graphics
folder because no art changed today.

## Open art register

### `GH-ART` — P1

`assets/characters/gravehorn/` and `gh_intro_a.webp`, `gh_intro_b.webp`,
`gh_phase2.webp`, `gh_down.webp` are absent. `js/gravehorn.js` explicitly draws
stand-ins.

Acceptance: all fourteen production rig plates, both facings, planted feet,
separated horn sockets, authored phase-two armor separation, down/retreat and
all four trigger-bound intercuts. Inspect pivots, scale and temporal continuity
in the real arena.

### `BOUND-ART-01` — P2

`wolfDown4` and `cheetahDown4` remain absent. Runtime uses crouch/coil fallback
plus vertical squash. Acceptance is a four-cell down/breathe strip for each,
deliberate recovery, correct floor line and no retained infection smoke after
freeing.

### `FURNACE-ART` — P2

Authored breath, blast, spent, gather, dive and bell states remain absent.
Acceptance is six identity-matched plates wired to the existing state machine
without changing collision, damage or timing.

### `PURIFY-ART-01` and ritual films — P2

The world VFX gathers motes around a drawn sword, but the hero does not
physically raise, hold, slash and recover with continuous hand/hilt contact.
Only the `glitch`/NULLFANG ritual movie is accepted by the runtime mapping;
Brood, Atlas, Zero and Prism use the in-engine fallback. Runtime video remains
muted, so the master soundtrack is not listened-runtime fade evidence.

Acceptance: a single earned sword; white gather; brilliant slash; visible
black-red corruption extraction into the blade; neutralization; resolved
picture and audible score fade; return to the same living friendly gold
guardian; retry without early reward.

### Localized panel corrections

| Asset | Hash prefix | Required masked correction |
|---|---|---|
| `m_down.webp` | `c65be806…` | NULLFANG boss eyes red instead of purple |
| `r_cell.webp` | `800ab5ba…` | Powered-off background Servo still lit |
| `passage_b.webp` | `9ca50c2c…` | Rear hero has elongated humanoid anatomy |

Preserve framing, environment, Ratchet, lamp, cell, sword timing and unrelated
pixels. Do not revive the rejected full-frame purple-eye candidate.

## Finite eye-trail contract

- red ordinary infected eyes; purple bosses, Sages and Alpha;
- world-locked transformed current-frame eye anchors;
- body-travel emission only, never camera motion or idle sway;
- 1.5 seconds ±25% life, i.e. 1.125–1.875 seconds;
- 90/170/260/320 quality-tier caps;
- movement discontinuity above 90 px clears history;
- cure, death, removal, teleport and room transition clear the trail;
- reduced motion keeps the glow and removes smoke.

Fresh `infection-eyes`, `infection-roster` and `infection-poses` checks pass.
That is a host contract, not sustained phone frame-time, memory or thermal
approval.
