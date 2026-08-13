# Source art archive

**Why this directory exists.** The pipeline used to keep generated art in a
scratch directory and commit only the *composited* atlases. That meant a claim
like "the guardian was restyled" could not be checked against anything — you
had to take my word for it, and on at least one occasion my word was wrong (see
the hero, below). Every generated part now lands here, permanently, before it is
composited.

**What is here.** The restyled parts that were pasted back into each boss atlas,
one JPEG per part, plus the contact sheets used to review each batch. These are
reference copies at 1024 px / q90 — the full-resolution originals are the
generator's output and are reproducible from the prompts, but these are what you
look at to answer "did that actually happen".

| Directory | Boss | Parts |
|---|---|---|
| `beast/` | NULLFANG, the Virus Beast | 15 |
| `eagle/` | TALONHOST, the Iron Eagle | 19 |
| `furnace/` | FURNACE CHOIR | 14 |
| `glaciere/` | GLACIERE, the Frozen Purifier | 11 |
| `mother/` | MOTHER-V, the Null Core | 16 |
| `_sheets/` | Contact sheets and before/after comparisons | 11 |

`_sheets/rake_before.jpg` and `rake_after.jpg` are not generated art — they are
`tools/slashshot.cjs` output, the claw rake photographed in the four states it
was reported broken in (standing, sprinting either way, mid-double-jump) at four
points of the swing. `rake_ingame.jpg` is the same swing thrown for real in room
A1. They are here for the same reason everything else is: so "the slash was
moved off her body" can be checked rather than believed.

Each part name matches its rect key in `tools/bossparts.cjs` and in the boss's
own `js/` file, so `furnace/wingL.jpg` is the art that occupies `DRG_P.wingL`.

---

## The hero is NOT in here, and that is the honest record

`assets/characters/roster_8yaw.png` contains a generated 8-yaw turnaround whose
row 0 is declared as `nya` in `js/atlas.js`. **Nothing in the game has ever drawn
it.** `Player.draw()` is entirely procedural — there is no `drawAtlas` call in
it, and a search for the `nya` subject returns only the declaration.

So the earlier claim that every character had been given generated 3D art was
true for the guardians and the NPCs and **false for the player**: the art was
generated, archived and declared, and the wiring was never done.

She is instead drawn live, and was given real form shading in a later pass —
committed light direction, core shadow, cast shadows, a recessed visor, formed
ears (see `.claude/skills/game-character-art` and the `sheet_before` /
`sheet_after` pair in `_sheets/`). That is a different thing from a rendered
model, and the two should not be described as if they were the same.

**Why she is still procedural, deliberately:** her arms are IK-solved, her scarf
is simulated, and the double jump is a real rotation. A sprite atlas cannot do
any of that, so swapping her to authored art would trade animation for fidelity.
That trade may still be worth making — but it is a decision, not an oversight,
and it should be made openly.

---

## Rule going forward

Any generated asset is committed here **in the same commit that uses it**. If it
is not in this directory, it did not happen.
