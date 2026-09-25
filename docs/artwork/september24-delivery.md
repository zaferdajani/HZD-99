# September 24 upload integration

This pass imports the usable six-frame Ratchet work cycle into the playable
workshop, not a gallery. It keeps the job scheduler and the original strip.
The current source actually wrapped 12 frames while slicing 13; both now use
6, as supplied. The low-resolution stand-in is regenerated to the same layout
so a cold load cannot briefly slice old artwork with a new count.

Tests must demonstrate actual draw selection for every cell, negative-phase
wrapping, the slow-load path, planted feet and existing varied job behavior.
The hero's current walk/run art, movement and attacks, approved September19
Yalla, current blocking and boss fixes must remain unchanged.

## Not silently treated as finished

- Alpha claw-v2 was user-rejected; guard-v2 is quarantined; lunge-rake-v3 is
  explicitly unapproved. None is published as an accepted replacement.
- Alpha pounce-v2 is a miss-landing candidate. It lacks the hit-recoil branch
  and needs phase/anchor/impact alignment, not a global sprite-file swap.
- Ratchet wrist release needs a two-actor scene and exact hand alignment.
- Winch parts need the story encounter and belt-cut state; the handoff says
  the intact belt is baked into the base. No new encounter is invented here.
- The manhwa upload contains a 40-page Draft3 screenplay but only32 illustrated
  candidates, and a separate Draft4 requiring scene adaptation and review. It
  is not substituted for completed playable story scenes or silently published
  as a final book. Original uploaded archives remain unchanged.

This release does not claim to finish every character's library, all artwork,
or full game quality. Its acceptance is the supplied Ratchet motion appearing
in the actual live game with verified bytes and existing controls intact.
