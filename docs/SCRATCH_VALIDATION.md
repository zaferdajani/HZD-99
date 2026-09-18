# Scratch correction — 2026-09-18

The owner's full combat sheet defines jab, double slash, then uppercut. The
runtime had the first two in reverse order, used small procedural rakes, and
discarded the visual effect when the body animation ended.

The corrected sequence uses the supplied body strips and existing authored cyan
FX as independent world-space layers. The double slash has two passes; the
uppercut rises above the paw. The charge fan faces the target, including left.
Trails persist for 180 ms after the body animation and fade without damage.
They do not modify the character artwork, palette, scale, or voice recordings.

Normal claw contact reach, measured from player centre along a horizontal hit,
is now 86 px for jab/double slash (previously 74) and 100 px for the uppercut
(previously 85). The earned Long Rake reaches 126 px. Weapon ranges and NOSTOS
range stay unchanged. Charged radius remains the existing 165 px; its damage,
particles, hit stop, sound and haptics remain driven by confirmed gameplay.

Validation:

- `scratch-reach.cjs` runs actual Player.update collision processing at both
  sides of each boundary, both facings, all three combo beats. Checks one hit
  per swing, charged facing, trail persistence and expiration, no tail damage.
- `scratch-visual.cjs` measures 16 actual canvas FX samples: visible cyan tip
  stays within the contact extent, reaches at least 82% of it, mirrors within
  one pixel, and fades during recovery. This is a reach check, not a claim of
  pixel-identical reconstruction of the reference poster.
- Existing input routing, weapon progression, sage protection, aerial attack,
  frame sequencing, haptic, movement renderer and release checks are retained.

The scratch fix is integrated over concurrent kingdom-enemy updates. New enemy
art queued by those sessions remains separate outstanding work in ART_QUEUE.
