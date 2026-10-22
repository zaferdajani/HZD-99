# Art and cinematic review — 2026-10-22

Three senior art responsibilities inspected current assets, runtime selection and
gameplay-size evidence. Existing approved hero, pack/Alpha, crystal, sword, lion
and Talon work was preserved; no completed asset was regenerated.

| Responsibility | Verdict | Evidence and consequence |
|---|---|---|
| Senior Character Artist | Issues | The rescued Sage now uses an authored gait, but GRAVEHORN, true bound/down motion, Furnace poses and the hero ritual body sequence remain incomplete. |
| Senior Cinematic Director | Issues | The lion ritual exists; four equivalent principal extraction films and several literal manhwa actions remain absent. |
| Senior VFX Artist | Pass for bounded eye lifecycle; device gate open | Runtime/tests enforce red ordinary eyes, purple boss/Sage/Alpha eyes, current-frame anchors, finite smoke, cure/removal cleanup, caps and reduced-motion behavior. Physical-device sustained performance remains unverified. |

## Gameplay-size inspection

`sage-walk.png` is a fresh 844×390 software-rendered frame from the production
room. It shows the hero and clean cyan/white rescued Sage together at gameplay
scale. The actor is grounded and clearly no longer using the sleeping/kneeling
plate while translating. The robe's leg separation remains subtle and the Sage
still has less material/detail richness than the hero; this branch fixes the
wrong animation state, not an art-direction overhaul.

## Preserve

- Approved hero variations and poses.
- Pack/Alpha wolf identity and authored motion.
- Raw marble, crystal and sword artwork.
- NULLFANG/lion authored body and completed lion purification film.
- Talon assets and already approved panels.

## Open production art

| ID | Priority | Missing or defective work | Acceptance |
|---|---:|---|---|
| GH-ART | P1 | Articulated GRAVEHORN body and four matching intercut panels. | Planted locomotion; readable body/limb/horn separation; detach/return, rear kick, phase change, down/retreat/recovery; purple eye anchors in both facings; actual runtime triggers. |
| BOUND-ART-01 | P2 | Real wolf/cheetah down, breathing and recovery strips. | No flattened crouch or rest-pose substitute; feet and mass remain grounded. |
| FURNACE-ART | P2 | Breath, blast, spent, gather, dive and bell poses. | Every existing tell/state selects a distinct approved pose without changing combat timing. |
| PURIFY-ART-01 | P2 | Hero single-sword raise, charge hold, slash and recover. | Continuous hand/hilt contact and readable white gathering → slash → dark extraction grammar. |
| RITUAL-FILMS | P2 | Brood, Atlas, Zero and Prism extraction films. | Same resolved fade-in/fade-out and audio ending standard as the lion; older generic clips are not substitutes. |
| PANEL-5 | P2 | `m_down.webp` uses the wrong infection hue. | Localized edit: purple boss eyes; preserve composition. |
| PANEL-6 | P2 | `r_cell.webp` gives powered-off background Servo lit indicators. | Localized edit: indicators dark; preserve Ratchet, pendant, cell, lamp and framing. |
| PANEL-4 | P3 | `passage_b.webp` hero anatomy drifts. | Restore compact approved limb/mitten-paw shape without reframing. |

## Infection eye/trail authority

The runtime authority is purple for Alpha, Sages and bosses, even where an older
brief or panel mentions red. Ordinary infected creatures remain red. Trails must:

- originate at the current pose's eye anchor, not body centre;
- remain world-locked during camera motion;
- stop emitting when the body stops;
- clear on cure, death, removal, teleport and room change;
- expire in at most 1.875 seconds and obey tier budgets;
- retain the eye glow but suppress smoke under reduced motion.

## Cinematic ending standard

The ritual may not cut picture or music abruptly. It needs an intentional resolved
hold, image fade, music/SFX tail and return fade into the friendly restored actor.
Runtime video playback is muted in source, so the presence of an audio track in a
master is not listened-audio evidence. A human must listen to the complete runtime
transition before approval.
