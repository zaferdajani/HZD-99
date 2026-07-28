# Cognition Trials — design research

Research basis: the classic Facebook brain-trainer genre (2007-2013 era), whose
best-known example was Playfish's brain-testing game. Game *mechanics* are not
copyrightable — our implementation ("Cognition Trials") is fully original:
own name, theme, art, sounds, and generated puzzle content.

## What the research established (mechanics facts)

- **Four categories**: Logic, Memory, Visual, Calculation.
- **Session structure**: one "test" = 4 mini-games back-to-back (one per
  category), each lasting **60 seconds**.
- **Difficulty ramp**: within a single mini-game, each correct answer raises
  the difficulty of the next question (bigger numbers, longer sequences,
  more objects).
- **Scoring → brain size**: the four game scores summed and were presented as
  the player's brain size (reported in cm³), which grew as you improved —
  plus friend leaderboards.
- **Signature game types** (as described in period reviews/discussions):
  counting 3D block stacks, judging which pan of a scale is heavier, quick
  arithmetic with a missing term, repeat-the-sequence memory games, jigsaw
  piece matching.
- **Modes**: practice an individual game, or take the full 4-game test.

Sources consulted (descriptions of mechanics only):
- archive.org/details/whtbb (archived copy listing)
- playfish.wordpress.com blog posts on the game
- physicsforums.com thread describing the mini-games
- whatapps.com 2007 review describing scales/blocks/60-second structure
- en.wikipedia.org/wiki/Playfish

## Our original implementation (clawbyte/js/trials.js)

| Category | Our game | Ramp per correct answer |
|---|---|---|
| Calculation | **Volt Math** — missing-term equations | bigger numbers → ×/− → two-step |
| Memory | **Echo Glyphs** — repeat flashing Rustsong glyph pads | +1 length, faster flashes |
| Visual | **Cube Count** — count cubes in an isometric pile (hidden ones too) | bigger piles |
| Logic | **Scale Judgment** — which pan is heavier (item weights shown) | more items, closer totals |

- 45-second rounds (tuned snappier than the classic 60).
- Score per answer = base + level bonus + streak bonus; wrong answer costs
  points and resets the streak.
- Full Trial (4 games) → **Mind Volume in cm³** + IQ award (feeds the Neural
  Tree skill system). Practice mode gives a smaller IQ trickle.
- Host: Mono the Archivist / the Trial Console in the Data Conduits hub.
- In the Odyssey world (same game, chosen at "Who are you?") the very same
  trials are presented as "the Trials of Wisdom", hosted by the Oracle.
