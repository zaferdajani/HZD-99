# Art, cinematic and VFX review — 2026-10-25

## Scope and preservation

Senior responsibilities 7–9 inspected repository bindings, art ledgers and
fresh gameplay-scale frames. Approved hero, pack/Alpha, crystal, purifier
sword, NULLFANG/lion and Talon assets remain protected. No art was regenerated.

## Role verdicts

| # | Responsibility | Verdict | Evidence and action |
|---:|---|---|---|
| 7 | Senior Character Artist | P1/P2 issues | GRAVEHORN has no production character directory and uses fallback rendering. Bound recovery, Furnace and hero ritual pose sets remain incomplete. |
| 8 | Cinematic Director | Issues | Sixteen panel beats pass. Four GRAVEHORN intercuts, four guardian ritual films and three localized panel corrections remain. |
| 9 | Senior VFX Artist II | Host pass; device open | Infection eyes/roster/poses pass: red ordinary, purple bosses/Sages/Alpha, finite travel-only trails and clearing. Device performance remains unmeasured. |

## Production queue

### P1 — GH-ART

Create an articulated heavy gunmetal/bronze robotic rhino with distinct body,
limb and horn separation, purple infected eyes, detachable returning horns,
planted weight and readable phase-two armor/molt cracks. Required authored
states: idle, walk/run, horn throw/return, charge, rear kick, stagger,
phase-two transform, down/retreat/recovery and both facings. Required intercuts:
`gh_intro_a`, `gh_intro_b`, `gh_phase2`, `gh_down`. Inspect every state at actual
gameplay scale. Do not replace it with a still, bloom, wireframe or unrelated
panel.

### P2 — BOUND-ART-01

Add real `wolfDown4` and `cheetahDown4` down, breathing and recovery strips.
Remove the flattening treatment that makes defeated animals look like tiny
floating cells.

### P2 — FURNACE-ART

Preserve identity, timing and damage. Add authored breath, blast, spent, gather,
dive and bell states.

### P2 — PURIFY-ART-01

Author one continuous single-sword body performance: raise → gather/hold →
slash → recover. Hands remain on the hilt and the earned crystal/sword identity
must not change.

### P2 — ritual films

Produce Brood, Atlas, Zero and Prism films using the NULLFANG contract: finite
white energy gathering, brilliant sword, cinematic slash, dark red-black virus
extraction into the sword, neutralization, resolved image and music fade, then
the same living guardian friendly and gold. Alpha stays a quieter in-engine
rescue.

### Localized panel corrections

- `assets/manhua/ch1/game/m_down.webp`: boss eyes purple, not red.
- `r_cell.webp`: inactive Servo eye/chest lights off.
- `passage_b.webp`: correct the skinny/off-model hero while retaining the shot.

## Finite eye-trail contract

Trails originate at transformed current-frame eye anchors and emit only while
the body travels. Camera motion and idle animation never emit. Movement jumps
over 90 px clear history. Lifetimes remain 1.125–1.875 seconds with tier caps
90/170/260/320. Cure, death, removal, teleport and room change clear trails.
Reduced motion keeps glow and removes the trail.

## Gameplay-size inspection

| Moment | Verdict |
|---|---|
| Ratchet repair | Strong visual hierarchy and readable component art. |
| Servo introduction | Grounded, larger than hero and visibly inactive before repair. |
| Marble acquisition | Crystal reads; reward and recovery text compete in the center. |
| Forge return | Environment/Ratchet strong; earned blade/body performance needs more cinematic emphasis. |
| Sage purification | VFX readable; three center notices obscure the restored Sage beat. |
| NULLFANG restoration | Gold body reads clearly; upper-third reward copy overlaps. |
| GRAVEHORN | Mechanics read, but fallback material/silhouette is far below the approved roster. |

These are host captures, not physical phone approval.
