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
| `beast/motion/` | NULLFANG motion plates — roar, daze, claw, coil, leap | 11 |
| `eagle/` | TALONHOST, the Iron Eagle | 19 |
| `furnace/` | FURNACE CHOIR | 14 |
| `glaciere/` | GLACIERE, the Frozen Purifier | 11 |
| `mother/` | MOTHER-V, the Null Core | 16 |
| `lairs/` | The six boss lairs, as generated | 6 |
| `_sheets/` | Contact sheets and before/after comparisons | 16 |

`beast/motion/` is the reference set for NULLFANG's fight — eleven plates of the
same lion in the poses the rig has to hit: the open-jaw roar in profile, the
head-shake and the head-hang of the daze, the claw cocked / striking / studied
close up, the amber coil, the launch, full airborne extension, the claws-first
strike, and the stalk. They are **reference, not shipped art** — nothing in
`js/` loads them. They exist so that "the leap has a real motion now" and "the
swipe shows the claws" can be checked against a drawing of what those are
supposed to look like, instead of against my description of what I did.

Two of them changed the code after the fact, which is the point of having them:
`07_coil` holds the tail rigid and DEAD LEVEL behind the spine where the rig had
it low (a low tail reads as caution, a level one as commitment), and `05_claw_strike`
draws the rake as FOUR separate claw trails rather than one ribbon.

`_sheets/lion_leap_before.jpg` and `lion_leap_after.jpg` are `tools/leapshot.cjs`
output: NULLFANG's pounce laid out beat by beat, before and after. The "before"
is the evidence — coil, launch, rise, apex, fall and strike are the SAME
standing drawing at slightly different scales, which is what "the way it jumps
does not show a full motion of a lion jumping" looks like when you stop
believing the code comments and photograph it.

`lairs/` is where each guardian sleeps, generated on pure black and keyed out
by `tools/blackkey.cjs` into `assets/backgrounds/lair_*.png`. The JPEGs here are
the originals with their black field intact — keep them, because the key is a
lossy step and re-running it from the plate is the only way to change the
feather or the threshold without regenerating the art. `_sheets/boss_lairs.jpg`
is all six in the running game with the guardian still asleep in its bed.

`_sheets/tell_wash.jpg` is the shared telegraph wash, three guardians shown
rest-then-wind-up, which is the evidence for the two the harness caught having
no warning colour at all.

`_sheets/lion_coil_after.jpg` and `lion_claw_daze.jpg` are the same tool run on
the finished work: the one-second coil beat by beat (stalk → 15% → 55% → the
flash at 88% → launch), and the near game — the claw cocked, mid-rake and
following through, then the daze at its worst and on its way out.

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
