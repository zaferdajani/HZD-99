# Art, cinematic and VFX review — 2026-10-21

No image, animation, film or sound asset was generated in this review. Approved hero, pack/Alpha, crystal, sword, lion and Talon assets were preserved.

## Role verdicts

| Senior responsibility | Verdict | Basis |
|---|---|---|
| Character Artist | Issues | Gameplay-size frames and direct source assets expose remaining prototype/mismatched art. |
| Cinematic Director | Issues | Lion film exists; four other principal ritual movies and exact action parity remain absent. |
| VFX Artist | Issues; finite eye-trail implementation accepted | Source and automated lifecycle checks pass; device budgets and full temporal polish remain unverified. |

## Character art findings

| ID | Priority | Evidence | Required action |
|---|---:|---|---|
| `GH-ART` | P1 | No authored `assets/characters/gravehorn/` body set; mandatory guardian reads as prototype against the hero. Four `gh_*` panels remain absent. | Produce one approved articulated set with planted locomotion, horn detach/return, rear kick, phase transition, down/recovery and purple boss-eye anchors. |
| `BOUND-ART-01` | P2 | Disabled wolf still reuses crouch under a flattening transform; true wolf/cheetah down strips are absent. | Produce queued down/breath/recovery strips before removing fallback. |
| `FURNACE-ART` | P2 | Six queued authored poses—breath, blast, spent, gather, dive and bell—are absent. | Produce only these existing briefs; preserve live tells, glow and timings. |
| `PURIFY-ART-01` | P2 | Engine VFX overlays the current hero; there is no continuous authored raise → hold → slash → recover body performance. | Add the sequence with stable hand/hilt contact and the earned single blade. Do not regenerate the completed lion film. |
| `FLIER-BANK-SCALE-20` | P2 | Full collector sampled a 68px hurt hero and found four 1.0-band violations; corrected-font rerun sampled a 71px idle hero and passed 160 cases. Historical bank probe still reached 73px. | Make the test deterministic with a same-frame hero ruler and actual AI bank range; do not relax the 0.5–1.0 law, crop wings or alter hitboxes. |
| `SAGE-RESCUE-MOTION-21` | P2 unverified owner report | Eight-frame Sage walk art exists, but no fresh targeted exit recording identifies which rescued actor appears to slide/sleep. | Reproduce from a clean route, name actor/state and capture selected pose plus planted-foot drift before changing art. |
| `ART-5` | P2 | Direct inspection: `assets/manhua/ch1/game/m_down.webp` paints the boss eyes red, conflicting with purple boss infection. | Localized eye-emission edit only. |
| `ART-6` | P2 | Direct inspection: powered-off background Servo in `r_cell.webp` has bright amber eyes and cyan chest. | Darken only inactive Servo indicators. |
| `ART-4` | P3 | Direct inspection: `passage_b.webp` gives HZD-99 elongated rear limbs and a finger-like hand. | Localized anatomy correction using approved hero references. |

## Cinematic findings

- Preserve the completed lion ritual film and its 13.25-second picture/audio fade. No fresh listened-audio review was performed.
- `PURIFICATION_MOVIES` assigns the requested new ritual only to NULLFANG. Brood, Atlas, Zero and Prism still use engine choreography; older `purify_*` clips do not replace the requested boss-to-blade extraction ritual.
- Exact parity remains open for the battery, raw-marble carry/forge, cable assistance/catch, CHIME casing and GRAVEHORN states.
- Acceptance requires a page-by-page matrix of room, save state, runtime asset key, physical action/animation and fresh gameplay capture.

## Infection eyes and finite trails

- Ordinary infected creatures classify red; Alpha/Sage/principal bosses classify purple.
- Friendly, purified, dead and removed actors emit no new infected particles.
- Particles are born at current-frame eye anchors, remain world-locked and stop when movement stops.
- Lifetime is `1.5s ±25%`, therefore bounded to `1.875s`; caps remain 90/170/260/320 by tier.
- Room change, teleport/removal and cure clear the relevant trail. Reduced motion disables smoke while retaining the readable glow.
- `infection-eyes`, `infection-roster` and `infection-poses` passed in the full audit.
- Physical-device sustained frame time, memory use, comfort and every pose/facing transition remain unverified.
