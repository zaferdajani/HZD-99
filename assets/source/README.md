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
| `eye/` | The Eye's five constructs, rest + wound-up | 10 |
| `beasts/` | The wolf line, the Alpha's nine states, and the cheetah line | 16 |
| `flora/` | Alien plant life, two species per kingdom | 12 |
| `gear/` | Thrust boots and the save pod, dormant + active | 4 |
| `_sheets/` | Contact sheets and before/after comparisons | 17 |

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

`beasts/` is the animal bestiary the owner asked for: electronic WOLVES to
replace the small lions as zone A's first enemy (prowl / coil / pounce), THE
ALPHA in nine states, and the electronic CHEETAH line for the later kingdoms
(stand / sprint / wind-up) which has no alpha and is simply killed.

THE WOLF WAS REGENERATED ONCE AND THE ALPHA TWICE, and both for the same
reason: a plate set is only a character if every plate is the SAME character.
The first wolf rest plate was photoreal while its coil and lunge were painted,
and the coil had gold eyes and a curled tail the other two did not have — three
drawings of three animals. The first `alpha_roar` had a bushy metal tail and no
mace ball, so the boss changed species every time it wound up. Both are now
generated against a locked reference image of the prowl plate, which is the only
method that has held.

THE ALPHA'S NINE STATES exist because it has five skills and two of them have
their own recovery (`ART_BIBLE.md` §3.3 — a five-move boss sharing two drawings
has two moves as far as the player's eye is concerned):

| plate | state | what it is |
|---|---|---|
| `alpha` | prowl | crimson seams, mace tail, double spine row. The rest pose |
| `alpha_howl` | broodcall / howl | muzzle straight up, calling the betas in |
| `alpha_roar` | roarwarn / roar | braced and screaming — the stun |
| `alpha_leap` | leap | airborne, corkscrewed, amber spiralling round it |
| `alpha_claw` | clawwarn / claw | the near foreleg thrown across in a rake |
| `alpha_bite` | bitewarn / bite | jaws wide, head out over the forepaws |
| `alpha_clinch` | clinch / shake | jaws locked and WRENCHING. The bite holds |
| `alpha_recoil` | recoil | it landed the leap and kicks back off her |
| `alpha_turn` | turn | it missed, and spins to bring its head round |
| `alpha_free` | after it yields | the red gone out of it. Permanent |

All nine are wired, all nine are measured by `tests/wolves.cjs`, and the
wind-ups clear the silhouette law against the prowl by a wide margin — the
worst of them, the roar, sits at IoU 0.69 against a 0.86 ceiling.

`eye/` is the five mini-bosses, two plates each — at rest and wound up. They
were procedural line art first, on the argument that they are "geometry and
light rather than creatures"; that argument was written while the generator was
unreachable and it was a rationalisation. Photographed next to a guardian they
read as flat 2D drawings in a 3D game, which is what they were. Both plates are
needed because a class with no rig cannot change its silhouette any other way.

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

---

## The world she walks through

`flora/` is the alien plant life, two species per kingdom, generated in 3D on
the same terms as the bestiary. Every room in the game was mineral before this —
tiles, girders, spikes, a vista — so nothing in the world was ALIVE except the
things trying to kill you, and a corridor read as a corridor rather than as a
place. Some of them are robotic (the scrap-meadow bloom is a satellite dish
grown on a spine of scavenged vertebrae; the conduit reed is a fibre-optic
bundle with data visibly climbing it), some are mineral (the ice spindles, the
prism lily), and exactly one — the deep lantern in zone E — is grown rather than
assembled, which is the point being made about that kingdom.

They are DRESSING and hold no collision: a plant that can hurt you is a trap,
and traps live in the trap system where the player can be taught about them.
Where they grow is hashed off the room's name and cached, never rolled — a
plant that moves when you walk back through a door is worse than no plant.

`gear/` is the hardware:

| plate | what it is |
|---|---|
| `boots` / `boots_fire` | THE THRUST BOOTS. She is a machine, so the dash is a bolt-on, not a talent she discovers. The firing plate is drawn along the dash vector at her feet — the procedural cone was always there, the boots making it were not |
| `pod` / `pod_on` | THE SAVE POD, at the size a save point deserves. It was thirty pixels of procedural tube; it is a horseshoe cradle on anti-vibration feet with a beacon mast, servicing arms and pressure tanks, standing four tiles tall. Dormant and awake are two plates, so stepping in is a state change and not a tint |
