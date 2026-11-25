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
| `beast/` | NULLFANG, the Virus Beast (+ `stalk.webp`, the retired first-take stalk strip kept as the §2cb scale reference) | 15 |
| `beast/motion/` | NULLFANG motion plates — roar, daze, claw, coil, leap | 11 |
| `eagle/` | TALONHOST, the Iron Eagle | 19 |
| `furnace/` | FURNACE CHOIR | 14 |
| `glaciere/` | GLACIERE, the Frozen Purifier | 11 |
| `mother/` | MOTHER-V, the Null Core | 16 |
| `lairs/` | The six boss lairs, as generated | 6 |
| `takes/` | Generated VIDEO takes the animation strips were cut from | 2 |
| `hero/` | HZD-99 herself, every plate locked to `ref/hzd99_canon.jpg` | 26 |
| `crystal/` | The purifier crystal: the weapon, the grips, the four slash light-sheets (the sheets were never drawn; their shipped copies were deleted 2026-10-09) | 15 |
| `eye/` | The Eye's five constructs, rest + wound-up | 10 |
| `beasts/` | The Alpha's nine states and the cheetah line (the Alpha plates and the cheetah's two-frame walk/run pairs are ARCHIVE ONLY since 2026-10-09 — their shipped copies were deleted when the filmed strips replaced them); `beasts/cycles/` the cheetah's filmed takes; `beasts/wolf2/` THE PACK FILMED WHOLE (2026-10-09) — start plates, eleven take sheets, the cut spec and the strip sheet | 26 |
| `roster/cycles/`, `talon/`, `bat/cycles/`, `sage/cycles/` | THE ROSTER WALKS (ART_QUEUE §2cc-iv…vii): the guard, blob, flying minion, bat and sage — green start plates, takes, the perch and exhale plates | 14 |
| `flora/` | Alien plant life, two species per kingdom | 12 |
| `gear/` | Thrust boots and the save pod, dormant + active; Ratchet's repair board, its cell, the wake-room lamp | 7 |
| `_sheets/` | Contact sheets and before/after comparisons | 18 |
| `manhua/ch1/game/`, `manhua/ch1/clean/` | THE GAME'S CHAPTER-ONE PANELS (2026-10-10): the seventeen as-fired game-only panels (`*_asfired.jpg`) and the twelve unlettered page re-draws (`*_clean_asfired.jpg`), each folder with its `prompts.json` (exact prompts, refs, job ids) | 31 |
| `manhua/ch1/game/ratchet-wake-2026-10-12.json`, `films/ratchet_wake_*` | THE WAKING (2026-10-12): the film's opening frame and as-fired take, the two after-panels `r_cell` / `r_marble` (`*_asfired.jpg`), every refused take with its reason | 4 |
| `manhua/ch1/` | THE MANHUA, chapter one — the 27 as-fired pages of the second edition (`*_asfired.jpg`, 1024/q90), the refused first edition kept beside them (`*_ed1_asfired.jpg`), and `prompts.json`, the exact prompt and every take of every page; ledger in `docs/MANHUA.md` | 55 |

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

`beasts/cycles/` is where the pack stopped sliding on two drawings (ART_QUEUE §2cc,
2026-10-09). Each cycle is ONE stride filmed by Higgsfield and cut by
`tools/vidstrip.cjs`: the identity plate was first re-plated onto flat chroma green
(GPT Image 2.5, jobs 3d8fd5de wolf / 192f0959 cheetah — the plates are ink-lined on
white, and a black key eats ink that touches the field), then animated IN PLACE with
Seedance 2.5 (4 s, 720p, locked camera; jobs 234fd93b wolf walk, 78565285 wolf run,
34083fbf cheetah walk, 6e273ec1 cheetah run). The stride period was measured from the
keyed silhouettes and exactly one period cut, sampled at cell midpoints so the last
cell never repeats the first. Every pair of cells differs (silhouette XOR / union):
wolf walk ≥ 0.165, wolf run ≥ 0.242, cheetah walk ≥ 0.270, cheetah run ≥ 0.410. The
wolf run's first cut found TWO strides (period 1.71 s, two cells 1.3% apart — the
same pose twice) and was re-cut to one (0.54 s). Files: `*_green_start.jpg` (the
start frames), `*_take.jpg` (each take as a contact sheet).

`beasts/alpha2/` is the Alpha re-made as the pack's own breed (2026-10-10):
the first Alpha was a different animal from the pack the owner approved on
2026-10-09 (bronze and black, spines, red ribs). `green_plate.jpg` is the boss
plate drawn from `wolf2/green_plate.jpg` (GPT Image 2.5, job 97a4c845, the
first of three candidates in `plate_candidates.jpg`); `green_plate_padded.jpg`
is the same plate shrunk to 0.693 and pushed right, the start frame for the
bite and clinch takes after the first ones lunged out of frame. Every
`*_take.jpg` is a 6 fps sheet of a 4 s Seedance 2.5 take (job ids in
docs/ART_QUEUE.md §2be); the `*2_take.jpg` sheets are the re-fires. The strips
were cut by `tools/fixcut.py` from `cut_spec.json` at one scale (0.34; the
padded takes carry `mul` 1.442) and one floor line; `strips_sheet.jpg` is
what shipped, `eye_anchors_*.jpg` the eye map on every cell, `ingame_states.jpg`
every state in A10 at the exploration framing, both facings. What the cut
avoids: the claw take's dust and spark at the strike (the strike is the swipe's
blur frames, recovery resumes after the dust), the roar's last frames where the
muzzle leaves the frame, and the clinch's frames that held a stick.

`beasts/wolf2/` replaces the whole earlier wolf line (its plates, its walk/run
pairs and its first strips were deleted with it — a different animal from the
design the owner approved on 2026-10-09). The design reference
(`hf_20261009_112803_0980f6e8`) was re-plated onto chroma green with GPT Image
2.5 (jobs 3531e0bb full size, 29486c59 the start plate), then filmed IN PLACE
with Seedance 2.5 — 4 s, 720p, locked camera, "no smoke, no particles", eleven
takes: idle 4acb0201, prowl 08f0c6e8, run db65ada5, wind-up 1e2fb3dd, bite
0f2b46ec, leap 758efc7b, land d9186ac3, recoil 2cdade02, hurt 34794e00,
purified a6620b9c (the motion preview `115137_a515f829` was reference only:
its smoke is baked in). Every strip was cut by `tools/fixcut.py` from
`cut_spec.json` at ONE source→cell scale (0.3) and ONE floor line (source y
616), so the animal never changes size between states. What the takes got
wrong and the cut avoids: the land take fell flat in a cloud of dust and the
bite take flashed at the muzzle, so the landing is the leap take's own
touchdown and the bite skips the flash frames; the hurt take was hit by a
visible projectile, so the flinch is the recoil take's rear-back; the winded
pant is the recoil take's head-down tail (0.5 s period). Cycles measured
distinct: prowl ≥ 0.239, gallop ≥ 0.432 (silhouette XOR / union).

`hero/held-roll/` is HER IN MIREJAW'S JAWS (2026-11-22, owner: "create artwork for my hero when it's caught in the alligator's mouth and rolling with it"): four sheets as fired, one per weapon tier, of her clamped at the waist and spun round; `jobs.json` has the ids and how the fog backdrop was keyed. The clip `swamp/review/held_roll.mp4` shows it in the build.

`hero/gate-step/` is HER STEP UP INTO A RAISED DOOR (2026-11-21, owner: "it raises
a leg and climbs like a ladder or an elevated object, or it hops inside of it,
which is also cute"). Eight sheets as fired, seen from behind — the climb over a
ring's sill and the hop into a pipe, for claws, single blade, twin blades and the
joined blade — and the bare climb that was refused for painting her belly vents on
her back; job ids and references in `jobs.json`. Cut by `tools/stepstrip.cjs`
into `characters/hero/gate_{climb,hop}_*.webp`.

`hero/plunge/` is THE DIVE (2026-11-15, owner: "going down should be with a
claw, not just a fist... also create the same motion or different motion for
swords, but the same concept"). Four sheets as fired — claws, single blade,
twin blades, joined blade — the fist take whose motion they copy, the take that
was refused, the six-cell strip they replace, a size check against her jab's
standing cell and the dive photographed in the game. `prompts.json` has the
prompts, the job ids and the exact cut.

`gravehorn/turn.webp` is HIS TURN (2026-11-16): the three-quarter and head-on
views `tools/ghturn.cjs` cuts into `characters/gravehorn/turn34.webp` and
`turn_front.webp` — fired at medium quality on the last half-credit. It is the
first take now: `gravehorn/turn3.webp` (2026-11-17, GPT Image 2.6 at 2k HIGH
against the design plate, job `162d01c2-6d32-44e0-bc6d-108d20cfc665`) is the
same two views and a REAR three-quarter on a black field, and
`gravehorn/turn_tail.webp` (job `df985622-6430-42d5-afce-cd08a95ee7d8`) is him
tail-on. `tools/ghturn.cjs` keys the black by a flood from the border and cuts
all four: `turn34`, `turn_front`, `turn_rear`, `turn_tail`.

`agents/<name>/` is ONE OF THE EYE'S AGENTS each (2026-11-17, owner: "it looks
exactly like the first one I fought"): `stand_asfired.webp` and the six states
`<state>_asfired.jpg` exactly as fired on their green screens, and
`states_asfired.jpg`, the six side by side. `agents/walks_take.jpg` and
`walks_take_2.jpg` are the seven filmed walks' contact sheets (one stride each). `agents/jobs.json` has every job id and the
exact cut. Shipped as `characters/agents/<name>/<state>.webp`.

`agents/tally/parts_asfired.webp` is TALLYMAN TAKEN APART (2026-11-17, GPT
Image 2.6, job `0d8bc2f9-5503-480d-a629-1cd36830c30c`): seven pieces in a row
on a green screen, the one sheet a rig needs. `tools/agentparts.cjs tally` cuts
them into `characters/agents/tally/rig/` with every joint measured; the brief is
in `agents/jobs.json` (`tally.parts`).

`beast/studio-2026-11-21/` is NULLFANG REARING (2026-11-21): `rear-reference-lion.mp4` (a generated real lion, motion reference only, never shipped) and `rear.mp4` (his take over it); jobs and the cut in its `jobs.json`. `audio/lion/` holds the CC0 lion recordings his voice is cut from (Freesound 69570 by Bidone, 437980 by craigsmith).

`swamp/` is THE SILT MIRE (2026-11-21), Kingdom 2's swamp: `2026-11-21/` the as-fired stills (three paintings, the culvert, the raft, Bilge, the insects, MIREJAW's two designs — the first refused for its glow); `croc-takes/` MIREJAW's filmed takes (his whole move set since 2026-11-22, with the refused roll and rise kept and named) and Bilge's two loops, and `grade.json`; every job id, the refused roll and the unused turn in `jobs.json`. `audio/swamp/` holds the recordings its sounds are cut from (CC0 Freesound pages and the NPS alligator, public domain), with `SOURCES.json`. `music/mus_swamp_*_asfired.m4a`, `mus_mirejaw_asfired.m4a` are the scores as fired. `review/` holds the two clips shown to the owner: `mirejaw_takes.mp4` (the filmed takes) and `silt_mire_mirejaw.mp4` (the swamp and the fight, played in the build by a test bot, with the game's own recordings).

`sewer/` is THE SEWER (2026-11-24), UNDERTOW's caves in the robot world: `2026-11-24/` the as-fired stills (three paintings, the hatch, Rivet, MIREJAW's shed skin, the shell from the side and the back, and her four hatch-opening sheets, one per blade); `takes/smith_talk.mp4` Rivet's filmed loop; every job id and how each was cut in `jobs.json`. `audio/sewer/` holds the CC0 recordings its sounds are cut from, with `SOURCES.json`. `music/mus_sewer_asfired.mp3` is the score as fired. `sewer/review/sewer_hatch_rivet_shell.mp4` is the clip shown to the owner: the hatch, the drop and the lift, Rivet's ask and his forge, and her running with the shell, played in the build by a test bot with the game's own recordings.

`gates/gate_city_asfired.jpg` is THE CITY GATE RE-FIRED (2026-11-20, GPT Image 2.6 2k high 16:9, job
`f2147536-ce5b-4e5c-a7dd-3a76b12c8f64`, the old plate as composition reference; a second take,
`515fcab0-c365-4ea3-a94c-0d163bba49a2`, was flatter and not used). Shipped as
`backgrounds/gate_city.jpg` (1920x1072, scaled and centre-cropped).

`agents/tally/hit{high,low}_asfired.jpg` are TALLYMAN STRUCK (2026-11-20, GPT Image
2.6 against his stand plate, jobs `f15cf3f5-523c-4b89-988c-eecc7b56985c` struck high,
`37b46ba1-5e77-4c62-9ef8-43d970e600e6` doubled over): the blow drawn on a body. Cut by
`tools/plate.cjs` to `characters/agents/tally/hit{high,low}.webp`; brief in `agents/jobs.json` (`tally.hits`).

`platforms/platobj_{a,x,b}_asfired.jpg` are THE DECKS AS OBJECTS (2026-11-17,
GPT Image 2.6, jobs `e42fe118-c048-40f4-8919-ad6df8ba0f87` city gantry,
`4bb8b776-29c9-411d-a53a-9b8c6e870052` cave rock shelf,
`3718b223-742a-4bf5-a0a7-27cfaf6f5f31` Conduits cable tray): three lengths
stacked on one plate. `tools/platobj.cjs` cuts them, measures where the walking
surface and the slab are, and packs `assets/tiles/platobj_*.webp`.

`beasts/cycles/cheetah_down_take.jpg` is the cat FOLDING DOWN (2026-11-17,
Kling 4.0 Flash from `cheetah_green_start.jpg`, job
`bb766327-5568-4482-a1d8-04cdc869b067`): six beats picked by hand off the take
(0.35, 0.9, 1.2, 1.5, 1.85, 2.6 s) are `characters/beasts/cheetah_down6.webp`.

`manhua/refire-2026-11/` holds comic panels fired again because a character was
off model: the new panel under its game name, and the refused one as
`*_before.jpg`. All seventeen are in (2026-11-17); `jobs.json` there has each
job id and what each was fired against.
`ch2_b` (2026-11-17, job `0ce2e62e-f84f-4557-87a1-ffd302b0e05c`) is UNDERTOW in
the cable ring, fired against UNDERTOW's own stand plate.

`gravehorn/` is GRAVEHORN'S BODY (2026-11-15, owner: "the rhino looks so fake...
it's the same box"). He had been drawn in flat stand-ins since October. The
design plate (real white-rhino anatomy, built as a machine, in the Wolf King's
finish), the body-and-heads sheet, the stand-in he replaced, the rig wearing
the plates in nine states and in the quarry. `provenance.json` has the job ids
and what could not be fired; `tools/ghparts.cjs` cuts the eleven plates and
measures their anchors.

`gates/ring_*` are THE RING GATES (2026-11-15, owner: "we are in a universe
full of robots... something that looks like a Stargate"). Four machine rings as
fired — quarry, meadow, the Wolf King's fanged den, and one braced into a cave
mouth — each with a true hole in it; the field in the hole is the engine's
light. `ring_prompts.json` has the brief, the job ids and what is not done;
`ring_ingame.jpg` is the four standing in the game; `tools/ringgate.cjs` cuts
the shipped copies and measures the openings.

`beasts/wolf3/` is THE PACK'S AGGRESSIVE SET (2026-11-15, owner: "find wolves,
see how they move, how they attack, how they roll, and replicate it with the
wolves that we have as robots ... concentrate on the aggressive attacking moods
of the wolf"). Three Seedance 2.5 takes of the same wolf (`attack.mp4`,
`stalk.mp4`, `roll.mp4` — the masters are archived this time), each performed
over a generated motion reference of a REAL wolf doing the same thing
(`reference_wolf_*_sheet.jpg`; the references are never shipped). `jobs.json`
has every job id and the prompt shape; `cut_spec.json` cuts seven strips with
`tools/fixcut.py` at the wolf2 size (one standing wolf = 124 cell px) — the
lunge and the roll with `anchor: cx`, so each cell follows the body and the
game's own physics does the travelling. `strips_sheet.jpg` is what shipped,
`ingame_hunt.jpg` a hunt photographed in A1. What the takes got wrong and the
cut lives with: the roll take was re-framed at full size, so the tail tip
leaves the right edge for part of the roll; the thrash is mostly motion blur
(the head is whipping), so its eye anchors are placed by hand.

The rest of §2cc followed the same day, the same way, and the same test: no strip
ships with two cells that are the same picture. The pack's OPENINGS — winded (6, a
loop) and land (4, once) — needed second takes: the first pants were so gentle the
cells were 0.7-1.0% apart, which is the "copies of the same move" the owner ruled
out, and were re-fired with the heave spelled out (wolf ≥ 7.4%, cheetah ≥ 5.3%); the
first wolf landing leapt out of the top of the frame and flashed white, and was
re-fired as a short hop. Landings are cut at hand-picked beats (`VIDSTRIP_TIMES`),
the strike on the first frame the paws are down. Then the roster, each re-plated onto
green from its shipped identity first (guard `style_d/guard_4`, blob `style_d/blob_0`,
TALONHOST `eagle/kCharge`, bat `bat/flap_up`, sage `sage/stand`): guard walk 8
(≥ 8.1%), blob crawl 8 (≥ 4.8%), minion chase 6 (≥ 32%) and cruise 8 (≥ 25%), bat flight 6
(≥ 18.5%), sage walk 8 (≥ 9.8%), plus two stills — the minion's perch and the
sage's exhale. Fliers are cut with `VIDSTRIP_FLOAT=1` (no floor line to clip the
downstroke; shed flecks dropped). The first cruise take touched the frame edge on
every downstroke and was re-fired from a smaller-framed start plate
(`talon/green_start_small.jpg`). Every job id is in the commit that wired it.

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

**Retired 2026-10-09:** the Alpha draws only its filmed takes (`characters/alpha/*.webp`); these plates are archive only. When they shipped, all nine were wired, all nine were measured by `tests/wolves.cjs`, and the
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

## The hero IS in here now, and there is one plate that rules the rest

`hero/` holds her authored set. It replaced a green-blade set that is gone from
this directory on purpose — see the identity rule below, which is the reason all
of it had to be made twice.

**`ref/hzd99_canon.jpg` is the canon.** The owner chose it (2026-08-14) out of
the plates then on disk, and it is the ONLY description of her that outranks
prose. It is registered with the generator as the reference element
`hzd99-canon` (`467c8e08-8161-483f-a4cf-439875ff04e2`), and **every plate in
`hero/` was generated with that element embedded in its prompt.**

**Why the element and not a written description.** Every earlier plate was an
independent generation anchored only by words plus a loose reference image, and
words do not pin geometry: the committed turnaround sheets each ended up
containing TWO different cats, because their front half and back half were
separate generations stitched together — different ear shape, different head
size, and a scarf that became a full-length cape across the seam. Prose could
not stop that and did not. The element does, because the same image is injected
into every generation.

Two things the canon plate does NOT govern, and both are deliberate:

- **The weapon.** The canon plate carries the old green blade. Green was retired
  on 2026-08-14; the weapon is the white purifier crystal (`crystal/`), which
  has its own two elements — `purifier-crystal` and `purifier-double` — for the
  same reason she does. The canon governs body, face, materials and proportions
  only.
- **Nothing else.** It is an airborne pose. It is an identity anchor, not a
  posing reference; `hero/canon_front.jpg` is the neutral standing plate
  generated from it, kept for eyeballing the lock.

**Still procedural, and still deliberately so:** the scarf spring-chain, the
blade glow, the jets, the charge aura and the claw arcs stay simulated and are
drawn OVER these plates. What ends is the procedural BODY.

**What is on screen, and what is not.** The art the game actually draws today —
both 8-yaw turnaround sheets, the two back-walk pairs and the grounded sword —
IS locked to the canon and has been replaced. The action plates in `hero/` are
archived and reviewed but NOT yet wired: `media.js` fetches only the back-walk
plates and the sword, and `Player.draw()` is still procedural. Wiring the action
set is tasks #79/#80/#81. Until then the procedural body remains what ships.

---

## `hero/death/` — the state that shipped with zero art

Owner brief, 2026-09-14: "dying... is something you have been failing at." He
was exactly right — `draw()` returned on its very first line the instant
`this.dead` flipped true, so from the moment she died the only thing left
onscreen was `die()`'s particle burst fading out. No art, procedural or
authored, had ever covered this state.

Three stills, all generated with the `hzd99-canon` element embedded exactly
per the rule above — `stagger.jpg` (the hit that kills her), `collapse.jpg`
(buckling), `down.jpg` (offline) — composited into `assets/characters/hero/
death.webp` (300px cells, matching `idle.webp`'s convention) and WIRED:
`HERO_DEATH_STRIP` in `entities.js`, drawn by the new `Player.drawDeath()`,
indexed by `G.deadT` (the timer `G.onPlayerDeath()` already owned and counted
down before this). This is the one action-plate case that shipped past the
review-but-not-wired line above, because the gap it closes is a state with
no fallback at all rather than a procedural body still standing in.

An owner-supplied reference sheet (a flat 2D pixel-art "combat animation
sprite sheet", ChatGPT-sourced per its own accompanying doc) was reviewed and
explicitly NOT used as art: wrong render class entirely (§0.0 is every
character is 3D; this was flat), wrong palette (blue eyes, plain scarf, no
cape) against the canon's cyan eye-lights and scarf-into-cape. It was used
only for which STATES to cover — the brief's own words, "using all the moves
in it... change whatever you need... to make the character matching with my
character." The actual plates are canon-element generations, not derivatives
of that sheet.

---

## `hero/guard/` — the row with no mechanic behind it

Owner sheet, 2026-09-15: a second "CLAWBYTE combat animation sprite sheet"
(same flat pixel-art render class as the one reviewed above, same "not used
as art" verdict — §0.0 is 3D-only), with a BLOCK/GUARD row this repo's combat
code had no equivalent for at all: no block, parry, shield or guard mechanic
existed anywhere in `entities.js` before this.

Cross-checked the rest of that sheet against the shipped game first, state by
state, rather than assuming it needed new art: IDLE, RUN, WALK, JUMP,
FALL/LAND, DASH, the three light attacks, the charged heavy attack, the 3-hit
combo, air attack, down-attack/plunge, hit/hurt and idle variations were ALL
already covered by real, wired, canon-element Higgsfield art (gait strips,
`HERO_TRANS`, `SWING_STRIP.burst`, `hzdHurt`, `HERO_FIDGET`) — none of that
needed regenerating. BLOCK/GUARD was the one true gap, on both counts: no
art and no game verb.

`guard.jpg` reuses a still already generated earlier this session for exactly
this purpose (a defensive brace, crossed forearms catching an impact spark,
`hzd99-canon` embedded) rather than spending a fresh generation on a pose
already on file and already reviewed as on-model. Composited into
`assets/characters/hero/guard.webp` (one 300px cell, `idle.webp`'s
convention) and wired as `HERO_TRANS.guard` in `entities.js`, drawn through
the same `drawRoboTrans` machinery as `hurt`/`land`/`dash` rather than a
special case.

The mechanic itself is new, minimal, and said so in code: a new `GUARD`
input (hold), keyboard `L` / touch shield button / gamepad unbound-by-default
(every real button already has a home — same honest-unbound treatment as
`SKILL`/`CREST`, routed to Options ▸ Controls). Held and grounded, it cuts
incoming damage by `GUARD_REDUCTION` (0.65, a first pass, not a tuned final
number) and drops knockback to 35%, in `Player.hurt()`. It does not stop a
hit outright — a repeatable, free, full-invincibility block would undercut
every fight already balanced around dodging, which the one-shot Aegis relic
and the Oath save are not. No boss tell is unblockable yet; that is real
follow-up balance work this change does not claim to have done.

---

## `hero/swing/claw_1`, `hero/swing/burst`, `hero/hurt` — the owner's "what about hit/supercharge" check

Owner, 2026-09-15: after the Block/Guard fix, asked directly what was still
wrong with "hit" and "supercharge" (the charged burst) from the sheet review.
Rather than answer from the earlier claim that these were "already covered",
pulled the actual shipped strips apart and looked, which is what should have
happened the first time:

- **`swingClaw1`** was still the ORIGINAL camera-facing footage documented in
  ART_QUEUE §2av and never replaced — she opens toward the lens on the first
  hit of every combo.
- **`swingBurst`** was worse: the 6e642bc re-cut (ART_QUEUE, "2av is half-
  fixed") turned out to be a cropped close-up on her head and shoulders with
  no legs in frame at all, a completely different scale from every other
  strip — the "headbutting" the owner had already reported and that nobody
  had actually gone and looked at.
- **`hurt`** had never been flagged by any test (the facing law does not
  cover it) but five of its six cells carried a sword hilt slung on her back
  — an object that belongs to no established pose of hers — and the flung
  cell's eyes rendered green instead of her canon cyan.

All three re-fired: four stills each for claw_1 and burst (guard/wind-
up/contact/recovery; crouch/wind-up/release/recovery), six for hurt (flung/
curl/land/stagger/steady/recover), hzd99-canon embedded, three-quarter
profile matching the already-passing claw_2/finisher strips, full body in
frame every time.

**The canon element itself is a landmine worth naming.** `hzd99-canon`'s own
reference photo shows her flying with a glowing sword and jet-boot flames —
which is NOT how she is drawn anywhere else in the shipped game (bare-clawed
fighter, feet on the ground). Every prompt in this batch had to fight that
image with an explicit "her paws are bare, no sword, no blade, no held
weapon, no jet flames" negative; the first batch of all 8 claw_1/burst
generations, fired without that negative, came back with every single one
holding a lightsaber-like blade. The element should probably be replaced
with a bare-pawed, grounded reference photo so future generations stop
needing to fight their own identity anchor — flagged here rather than fixed,
since replacing a shared reference element is a bigger, riskier change than
this brief needs to make.

Fit to idle.webp's convention (crop to bbox, scale into a 300px cell, bottom-
anchored), so all three land on k: 1.0 like HERO_DEATH_STRIP and
HERO_TRANS.guard before them. `tests/hero.cjs`'s attack-facing law passes on
both claw_1 and burst for the first time.

---

## `hero/swing/burst` — the ART session re-fire, ten frames instead of four (2026-09-16)

The four-still `burst` above (crouch/wind-up/release/recovery) was always a
stopgap composited during the 2026-09-15 emergency facing fix, and the owner
asked the ART session to redo it properly: as many frames as possible, no
duplicate frames, covering the full charge build-up through the explosive
release his own reference sheet's HEAVY ATTACK row describes — rising energy
glow at the paws through the wind-up, then a flash-and-shockwave release.

Ten stills, one Higgsfield batch: `ready` (settling into the low crouch, no
glow) → `crouch` (deep coil, first spark) → `charge1` (glow wraps the
forearms) → `charge2` (crackling arcs, harder tension) → `peak` (both paws
blazing, maximum coil) → `ignite` (the release flash, launching forward) →
`midlunge` (claws flung forward-and-wide, trailing streaks) → `extension`
(full reach, a radiating shockwave ring at the point of impact) → `follow`
(decelerating, glow scattering) → `recovery` (ready stance, residual
shimmer). Same `hzd99-canon` embed and the same "bare paws, no sword, no
blade, no held weapon, no jet flames" negative in every prompt as the batch
above — still needed, still fights the element's own sword-and-jets
reference photo. Same three-quarter profile facing right as `claw_2`/
`finisher`; the "headbutting" facing defect does not reproduce in any of the
ten. Verified before compositing: pure black background on all ten (no
polarity flip), no duplicate poses, and the glow genuinely rises frame over
frame rather than jump-cutting from dark to full brightness.

Keyed with `tools/blackkey.cjs`, laid into a 10-cell strip with
`tools/stillstrip.cjs` at the idle.webp convention (300 px cell, bottom-
anchored, one shared scale), encoded with `tools/towebp.cjs`. `k` stays 1.0
by construction, same as the four-frame take it replaces. `burst_windup.jpg`
and `burst_release.jpg` from the four-frame take are removed — nothing in
the new strip corresponds to those beats; `burst_crouch.jpg` and
`burst_recovery.jpg` are overwritten with the new take's frames of the same
name.

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
| `repair_panel` / `repair_battery` / `wake_lamp` | RATCHET'S REPAIR (js/story-repair.js) and the opening's fault. The board is the open service panel inside his chest, fired dark and low-contrast with a calm centre so the puzzle's buttons read over it (2.48:1, shipped 1000×403); the cell is the one power cell she seats (shipped 256²); the lamp is the caged tube over the cradle in W1, fired UNLIT because the game draws the fault's light on it (shipped 208×88, drawn 104×44). Fired 2026-10-09, gpt_image_2_5 against `pod.jpg` / Ratchet's plate for material; jobs 4f38e453, 645f5755, b4d72717 (the other variant of each rejected: a busier panel centre, a thinner cell, a lamp with the conduit leaving the wrong way) |
| `pod` / `pod_on` | THE SAVE POD, at the size a save point deserves. It was thirty pixels of procedural tube; it is a horseshoe cradle on anti-vibration feet with a beacon mast, servicing arms and pressure tanks, standing four tiles tall. Dormant and awake are two plates, so stepping in is a state change and not a tint |

---

## `ratchet/` — the tinker's plate set, and how it was got wrong twice

Seven poses of the first NPC, plus every plate fired to reach them. He stopped
being an atlas row here (ART_BIBLE §1 class D — one 6-yaw sheet and a breathe
cycle) because none of what the owner asked for fits in that class: a work loop,
an uncontrollable tic, a heat vent, and two talking poses.

`*_asfired.jpg` is the first firing, `*_v2_asfired.jpg` the second, `work2_v3`
and `work1_v3` the third. That count is the record of two real mistakes, and
both are worth knowing before firing the next set:

**The first firing did not animate.** Every plate was fired against the anchor
plate with "same camera, same framing, CHANGE ONLY THE POSE" — and an editing
model told to preserve a composition preserves it. `notice` and `work_1` came
back with a silhouette IoU of **0.992**: the same drawing with the hands moved.
Five other pairs were over the line too. The fix was to fire from the SEATED
reference instead — a pose the new one cannot be an edit of — with the pose
described first, at length, and the framing lock removed.

**The second firing did not register.** The generator decides for itself how
much of the frame to fill and varies it by a third between plates of the same
character, so a set is not registered by construction and cannot be made so by
asking. It is registered by MEASUREMENT, at load, in `plateFoot`: feet to the
bottom of the mask, horizontal to the centroid of the mask's bottom slice, and
scale to silhouette AREA. Area, not bounding box — this character's box is
topped by his canister rack, so a small body under a high rack measures the
same as a big body under a low one, and that is how a visibly wrong set
measured within 2%.

`tests/tinker.cjs` is those two failures as arithmetic. `tools/tinkershot.cjs`
is the photograph.

- `beast/studio-2026-11-13/` — NULLFANG's turn and standing idle: two Seedance 2.5 masters (`turn.mp4`, `idle.mp4`), their start frame (`start_left.png`, frame 0.02 s of `studio-2026-10-04/pounce.mp4`), prompts and job ids in `jobs.json`. Cut to `characters/beast/studio-{turn,idle}.webp` by `tools/lion-studio.py`. Since 2026-11-14 the shipped turn is cut from `turn2.mp4` — the mechanical lion performing the turn of `turn2-reference-lion.mp4`, a generated realistic lion used as a motion reference only; `turn.mp4` is the rejected turntable take. `beast/studio-2026-10-04/grade.json` is the one tone curve every lion strip is matched to. All nine strips were re-keyed 2026-11-14 from these same masters (same sample times) so the body keeps its own dark interior — the first key cut a window through the chest wherever a shadowed socket touched a dark seam.
- `brand/` — the app icon master (`appicon.png`, 1024 square, opaque), the alternate take, and `jobs.json`. `tools/appicon.cjs` derives every store and launcher size from it.

## `ratchet/metal/` — the same Ratchet, repainted as metal (2026-11-15)

The owner, looking at the den: *"It looks like scrap of metal blended with the
background... The colors are very dull, needs to be brighter, richer in color, and
give it the metallic, nice metallic tint color with a little bit of rust, a little
bit of shine here and there."* His plates were one copper from helmet to boot, and
no filter gives a figure a second colour. Brief: `docs/ART_QUEUE.md` §2r-ii.

- `talk_1_asfired.jpg` is the STYLE ANCHOR (take A; `talk_1_takeB_asfired.jpg` is
  the one not chosen). Fired alone first, from the old `talk_1` as the shape
  reference with the palette in words.
- The other ten were then fired with TWO references and two stated jobs
  (art-prompts §2): image 1 the old plate — geometry only — and image 2 the
  anchor — materials, lighting and finish only. All of them held their shape:
  `tools/reframe.cjs` printed an aspect drift under 1% for every plate and every
  strip cell, which is why none had to be stretched or refired for shape.
- `work_loop_six` and `wrist_release` are STRIPS. No frame is wide enough to
  generate one, so each was restacked 3×2 / 2×2 on black for the generator and
  cut back cell by cell onto its own cell of the original row.
- `wrist_release` came back on WHITE the first time (the one in ten). It was
  refired with the field colour said three ways rather than keyed off white — a
  white key frays a polished highlight at the silhouette.
- `bust` fills its frame, so it wears the old bust's alpha (`--mask`).
- **What was replaced is kept.** `ratchet/pre-metal/` holds the seven plates, the
  resting plate and the bust exactly as they shipped until this commit;
  `ratchet/work-loop-six/supplied.webp` and `ratchet/wrist-release/supplied.webp`
  are the owner's own two strips, byte for byte (their manifests' sha256 still
  match). Reverting any of it is a file copy, then
  `node tools/lowres.cjs && node build.cjs`.
- Render side: `NPC_LOOK_PAINTED` in js/media.js. The lift that rescued the flat
  copper overcooked the repaint, so a repainted NPC wears a gentler one.
- Sheets: `_sheets/ratchet_metal_before_after.jpg`, and in the game
  `_sheets/metal_and_impatient_ingame.jpg`.

## `den/toolbox/` — the box his battery is in (2026-11-15)

The owner, the same day: *"the hero is looking in the drawers for the battery when
it's actually in the toolbox down"*, then *"improve the art of the toolbox to make
it show uniquely on the ground when I enter the room"*, then *"differentiate between
a toolbox and working station ... this is the working table station, not the
toolbox."* Three orders, one object: a small oxblood-red steel toolbox on the den
floor at Ratchet's LEFT (the work table is his station, on his right, and lent this
plate nothing but its drawing style).

- `closed_asfired.jpg` — shut, the lid a finger ajar, the battery's cyan under it
  (take B, shipped as `assets/backgrounds/toolbox.webp`); `closed_takeA_refused.jpg`
  is the take with a hard line and no light on the metal.
- `open_asfired.jpg` — the same box from the same camera with the lid up and
  nothing in it (`assets/backgrounds/toolbox_open.webp`).
- `prompts.json` — both prompts, the job ids, and how the two were cut onto one
  scale with one right edge and one floor line.

The two comic panels drawn FROM this plate are indexed with the game's panels:
`manhua/ch1/game/toolbox_asfired.jpg` (she takes the battery out of it — replaces
the drawer panel), `manhua/ch1/game/l_cell_toolbox_asfired.jpg` (he puts it in),
their refused takes, and `manhua/ch1/game/toolbox-2026-11-15.json`.

## `hero/impatient/` — arms crossed, foot tapping (2026-11-15)

The owner: *"Look for how Sonic used to stamp with his feet and cross his hand when
he's idle and waiting, and give the character the same move when it says yalla."*
Brief: `docs/ART_QUEUE.md` §1-imp. `g1_asfired.png` is the sheet in the game
(`assets/characters/hero/impatient.webp`, cut by `tools/gridstrip.cjs`). It took
four rounds, and the three that failed are the useful part:

1. **A front-view reference for a three-quarter pose** (the fidget strip). She came
   back slimmer than her sprites and with no dark outline. Sheets:
   `_sheets/impatient_rounds_1_2.jpg`.
2. **Her own three-quarter cells as the lead reference**
   (`hero/delivered/b5_interact.png`). Outline and style right; HEAD TOO SMALL
   (`c_refused.jpg`) — about 42% of her height where the game draws about half.
3. **"Her head is half her height."** It overshot to a bobblehead, about 60%
   (`e_refused.jpg`). A proportion said as a number is not obeyed in either
   direction.
4. **Both failures handed back as references — "this one too small, this one too
   big, draw halfway between" — with the model sheet as the tiebreak.** All four
   takes landed on the game's proportion (`_sheets/impatient_round4_vs_game.jpg`,
   the dashed lines are her idle's ear-tip, chin and sole). G1 was taken because
   its eight cells sit on a perfectly regular grid (left edge 63 px in all eight,
   height 283 in all eight), so nothing had to be re-registered.

The lesson for the next pose: bracket a proportion with two wrong pictures; do not
describe it.

## npc/mono/

- `work_loop_keyed.webp` — the Oracle's filmed work loop exactly as it was keyed (16 cells, 320 px): the dark inside of the cable shroud went with the plate, so the lower body is loose strands. `tools/shroudback.cjs` derives the shipped `assets/characters/npc/mono/work_loop.webp` from it by filling the robe behind the art (2026-11-16). A take keyed with its interior intact is queued (ART_QUEUE §2bv).
- `resting_asfired.webp`, `talk_1_asfired.webp`, `talk_2_asfired.webp` — the Oracle powered down, and his talking pair (2026-11-17, GPT Image 2.6 against a cell of his own work loop; jobs `9e601989-075b-4c9c-b2c8-5d0bfc71042c`, `d6e096d8-3dd8-49c9-b565-c50ee7cd12d6`, `b131109b-c7ce-44da-94e3-7acdb8869cc0`). Cut with `tools/plate.cjs` at ONE scale (`PLATE_SCALE=0.314 PLATE_ANCHOR=x`) so a raised hand does not shrink the body: `characters/npc/mono/{resting,talk_1,talk_2}.webp`.

## `vfx/boss-2026-11-24/` — the bosses' attacks, as generated effects (2026-11-24)

- Thirteen Seedance 2.0 Mini clips on black (archived re-encoded at CRF 30, no audio), their job ids and
  briefs in `jobs.json`, and `strips.json`, the exact sample times and crops `tools/vfxstrip.py` cut
  them at into `fx/boss/*.webp`. The agent's ember bolt, burst, fire pillar, staff slash and fire
  wave; NULLFANG's floor shock, null bolt, claw rake and glitch burst; the Wolf King's bite and
  landing; CHIME's ice shard and shatter. Owner, 2026-11-24: "Why is the boss attk graphics so
  basic?" — they had been circles and strokes drawn in code. The flash frames the generator opens
  some clips with (a white field) are left out of the sample times, and the staff slash uses only
  its first, crescent cells: its later cells close into a whole circle, a ring round the agent.
