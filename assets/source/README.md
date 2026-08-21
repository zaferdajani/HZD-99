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
| `hero/` | HZD-99 herself, every plate locked to `ref/hzd99_canon.jpg` | 26 |
| `crystal/` | The purifier crystal: the weapon, the grips, the four slash light-sheets | 15 |
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
