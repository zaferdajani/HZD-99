# THE ART BIBLE

**What this is for.** You should be able to ask for a character and get one,
without then having to open a contact sheet and check whether the animal's legs
move. Every rule below exists because something shipped without it, and every
rule that *can* be measured **is measured** — by `tests/artbible.cjs`, which
runs in `node tests/run.cjs` with everything else. A rule that is only written
down is a rule that gets skipped; the ones with a ✅ are enforced by a machine
and cannot be skipped quietly.

This applies to **every character that exists and every character added later**.
There is no grandfathering. If a rule here is wrong, change the rule and change
the test — do not make an exception in a comment.

---

## 0.00 YOU DO NOT HAVE THE AUTHORITY TO MAKE ART OR MUSIC

**Art and music are generated through Higgsfield. Always. That is not a
preference about quality — it is a limit on what you are allowed to do.**

You may not draw a character procedurally, hand-roll a sprite, or synthesise a
score as a substitute for the pipeline. Not as a placeholder, not "for now", not
because the result would be "close enough", and above all not because the
connector looked unavailable. Composing the prompt, keying the plate, crushing
it, wiring it, and measuring it are your job. MAKING the pixels and the notes is
not.

**And when it looks disconnected, the default assumption is that you are wrong.**
That has now been the case every single time it has come up. The failure mode is
not the connector; it is the reasoning that concludes "it is down, so I will do
this another way" — which produced line-art mini-bosses in a 3D game and a
message telling the owner to go and flip a switch he had never touched.

So, in order: **investigate, retry, tell the owner, wait.** Never substitute.
See §0 for the exact diagnostic. If the pipeline is genuinely unreachable, the
correct output is a report and an unfinished task — not a hand-made stand-in.

---

## 0.0 EVERY CHARACTER IS 3D. THIS NEVER HAS TO BE ASKED FOR.

**Default, for every character in this game, existing or new: rendered 3D
authored art.** Not flat art. Not line art. Not "procedural because it is
geometry". Not "stylised 2D because it suits this one".

This is written at the top because it has had to be said out loud more than
once — most recently when the Eye's constructs shipped as line drawings and the
owner had to point out they looked 2D in a 3D game. He should never have had to
say it, and after this he does not.

The three exceptions are exhaustive, and each is a decision on the record with
its reason in this file:

1. **HZD-99 / the hero** (§2) — procedural because her arms are IK-solved, her
   scarf is simulated and her double jump is a real rotation. A sprite cannot do
   any of that. She gets her volume from committed lighting instead.
2. **Pure additive glow** (§6) — halos, lava rings, lit cores. The renderer
   treats them as light, not as objects, and a model returns a beautifully lit
   solid instead.
3. **Nothing else.**

If a character is about to be drawn any other way, the reason must be one of
those two — and if the reason is "the generator is unreachable", that is not a
reason, it is a §0 problem. Fix the pipeline, or wait for it. See §0.00: you do
not have the authority to substitute your own work for the pipeline's.

---

## 0. THE PIPELINE IS NOT OPTIONAL

**All authored character art is generated through Higgsfield.** Not sourced,
not hand-drawn, not approximated procedurally when the pipeline looks
inconvenient.

**If the connector looks unavailable, that is a claim you have to prove before
you act on it.** This cost a session once, and the diagnosis was wrong in a
specific way worth writing down:

- `ListConnectors` returning `enabledInChat: false` **does not mean the user
  turned it off.** It reports whether *this session* has the tools bound. A
  session can start before its MCP servers attach, and then that field is
  simply stale.
- The tell that it is a session-attach lag and not a user setting: **other**
  MCP servers change identity at the same moment (in the observed case
  Supermetrics was re-registered from a raw UUID to a readable name in the same
  notice that made higgsfield's tools appear). A user toggling one connector
  cannot rename a different one.

**The procedure, in order:**

1. `ToolSearch("select:mcp__higgsfield__generate_image_batch")`. If the schema
   comes back, it is connected — go.
2. If not, `ListConnectors(["higgsfield"])` and read `connected`, not
   `enabledInChat`. `connected: true` means the account is authenticated and the
   binding is the session's problem, not the user's.
3. Do the non-art work in the task, then retry step 1. Attachment has been
   observed to complete mid-turn.
4. **Only if `connected` is false** is this the user's to fix, and only then may
   you say so — once, with what you actually observed.

**Never tell the user to go and toggle something because a field said `false`.**
State what you observed and what it does and does not prove.

---

## 1. THE FOUR CHARACTER CLASSES

Every character is exactly one of these, and the class decides everything else.

| Class | Rendering | Examples | Authored art? |
|---|---|---|---|
| **A. Live-drawn protagonist** | procedural Canvas 2D, IK limbs, simulated cloth | HZD-99 / the hero | **No** — see §2 |
| **B. Parts-rig guardian** | authored parts, posed live by a rig | NULLFANG, TALONHOST, FURNACE CHOIR, GLACIERE, MOTHER-V, PRISM PROWLER | **Yes** — §3 |
| **C. Atlas creature** | one 8-yaw turnaround, cell-selected | crawler, hopper, blob, flier, turret | **Yes** — §4 |
| **D. Standing NPC** | one 6-yaw sheet, no combat poses | merchants, sages, wardens | **Yes** — §5 |
| **E. The Eye's construct** | two authored plates, rest + wound-up, moved by code | CHIME, CARRIER, KILN-MOTH, LATTICE, THE LENS | **Yes** — §5.5 |

Choosing the class is the first decision and the one that is expensive to
reverse. The test:

> **Does this character need to hold a pose that is a continuous function of
> the game state?** If yes it is B, not C. If it also needs simulated
> secondary motion — cloth, hair, a tail with its own physics — it is A.

---

## 2. CLASS A — the live-drawn protagonist

**She is deliberately NOT generated art, and that is a decision, not an
oversight.** `assets/characters/roster_8yaw.png` row 0 contains a generated
`nya` turnaround that **nothing has ever drawn**. It was generated, archived,
declared in `js/atlas.js`, and never wired — and for a year the claim "every
character was given 3D art" was true of the guardians and false of the player.

She stays procedural because her arms are IK-solved, her scarf is simulated and
her double jump is a real rotation about a real axis. A sprite atlas can do none
of that.

**So her "3D" is bought with light, not with a render:**

- One committed light direction for the whole character, stated in a constant,
  never per-limb.
- A core shadow on every rounded form — the darkest band is *inside* the
  silhouette, not at its edge. A form lit edge-dark reads as a sticker.
- A cast shadow from every part onto the part behind it.
- Recessed features are recessed: the visor sits *in* the skull, with an
  occlusion gradient at its rim.
- Never a flat fill for a curved surface, and never a pure outline for depth.

✅ **Enforced:** any subject declared in `ATLAS.sub` / `ATLAS2.sub` must either
be drawn by something in `js/`, or be listed in the bible's known-unwired set
with a reason. Silent dead art is a test failure.

---

## 3. CLASS B — the parts-rig guardian

This is the class that carries the fights, and it has the most rules because it
has produced the most failures.

### 3.1 The parts

- One JPEG per part in `assets/source/<boss>/`, **committed in the same commit
  that uses it**. If it is not in that directory, it did not happen.
- Part filenames match their rect keys exactly, so `furnace/wingL.jpg` is the
  art at `DRG_P.wingL`. ✅ **Enforced** — every key in a boss's parts map must
  have a file, and every file must have a key.
- Reference copies are 1024 px / q90. Crush with `tools/img-crush.cjs`; the repo
  has no ImageMagick and ships nothing from npm.
- Every limb is cut as a **separate two-segment chain** — upper and lower. A
  limb delivered as one piece cannot bend, and a guardian whose legs cannot bend
  will be animated by scaling its whole body, which is exactly the failure §3.3
  exists to stop.

### 3.2 The render brief, for every part

Stated in words in the prompt, every time, because a reference image pulls style
at least as hard as it pulls shape:

- Take from the reference **only** the geometry — silhouette, proportions,
  orientation. Take **nothing** of its rendering style.
- Do not redesign, do not re-pose, do not add or remove a plate.
- One committed light direction, PBR terms, name what is emissive.
- **Name the palette in words.** This is the consistency anchor across
  independent generations; the reference will not carry it.
- Negatives: no pixel grid, no dithering, no outline, no cel shading.
- Plate rules: pure black background, whole subject in frame, no ground, no cast
  shadow, no text.

### 3.3 THE SILHOUETTE LAW

> **A pose is a pose. Scaling a drawing is not a pose.**

NULLFANG's entire leap — coil, launch, rise, apex, fall, strike — was one
standing drawing at six different scales. It photographed as a cat sliding along
a parabola, and no amount of tuning the parabola was ever going to fix it.

**Every state a character can be in must be reachable from the rig, and must
change the silhouette.** Concretely:

- ✅ **Enforced:** for each declared state pair (rest ↔ wind-up, wind-up ↔
  strike, ground ↔ airborne), the silhouettes must have **IoU ≤ 0.86**.
  Identical-shape-different-scale scores near 1.0 and fails.
- Angles must **commit**. Limbs are short next to a body mass, so a quarter
  radian of hip does not change a silhouette at all. If the sheet comes back
  looking "merely tilted", the numbers are about a third of what they need to
  be.
- Solve limb chains for **two** constraints, not one: the vertical reach the
  pose needs, **and** zero horizontal drift of the contact point. Solving only
  the first drops the chest correctly and throws the paw forty pixels out in
  front — a sphinx, not a crouch.

### 3.4 GROUND TRUTH

✅ **Enforced:** in any state flagged grounded, the lowest opaque pixel of the
character sits within **±10 px** of the ground line. Feet floating above it or
sunk through it both fail.

The usual cause is a `crouch` translate that the limb fold does not pay for.
Compute the fold; do not eyeball it.

### 3.5 THE HUE LAW

`TELL_COL` = **`#ffc24a`** is the game's one reserved "this is coming" amber and
belongs to telegraphs alone.

- ✅ **Enforced:** any state whose name matches `TELL_ST`
  (`warn|charge|crouch|coil|lock|prep|spin|gather|roar|volley|broodcall|forgebell|hymn`)
  must show measurable amber. A wind-up the player cannot see coming is the
  single most common complaint this game has had.
- ✅ **Enforced:** states that are *not* telegraphs must not. Amber spent on
  decoration is amber the player learns to ignore.
- A guardian's own identity colour (NULLFANG's virus violet, GLACIERE's ice
  blue) **lerps toward** the amber during a wind-up. It does not get replaced,
  and the amber does not get pasted on top as a badge. It is the animal that
  changes.

### 3.6 THE SURGE RULE

A wind-up's energy must be visible **from its first frame** and grow. A
smoothstep ramp spends the first third of a tell at nearly nothing, which throws
away the third that matters most — the part where the player still has time to
act. Use `pow(k, ~0.6)`, not `k·k·(3−2k)`.

And the wind-up needs **one discrete event** near its end — a flash, a bloom, a
sound — so the cue to move is an event and not a ramp the eye can sit through.

### 3.7 THE READ IS THE ANIMAL

- Sparks are pulled **inward** during a charge and thrown **outward** on
  release. A particle system that always throws outward reads as venting, which
  is the opposite of storing.
- Light has a **falloff**. A flat additive fill over a mid-grey room is fog: no
  centre, no edge, no direction. Use a gradient.
- Additive light has no edge, and some things are nothing *but* edge — claws,
  blades, teeth. Draw those in `source-over` with a dark base and a hot tip, or
  they come back as an orange flame.
- One wide swoosh is a sword. **Four thin ones are a hand.** If the character
  has fingers or claws, the trail has that many lanes.
- A motion trail must walk the **actual** forward-kinematic path of the limb,
  sampled backwards along the same curve. A trail drawn where the arc "ought to
  be" will disagree with the limb within one patch.

### 3.8 THE DAMAGE STATES EVERY GUARDIAN OWES

Hit reactions are not decoration; they are how a player learns that pressing an
advantage is worth doing.

| State | Requirement |
|---|---|
| `hurt` | a flinch, ≤ 0.2 s, must not interrupt a committed move |
| `daze` | after a **group** of hits inside a rolling window: head shake, guttering light, no attacks, extra damage taken, a cooldown so it cannot be held open |
| `stagger` | element-counter reaction, distinct from `daze` |
| `death` | a staged collapse, not a fade |

✅ **Enforced** for any boss with `dazeAt` set: the window opens on a group, does
not open on spaced hits, pays more damage, closes, and cannot be stunlocked
(`tests/daze.cjs`).

### 3.9 EVERY GUARDIAN HAS A LAIR, AND IT SAYS WHAT THE GUARDIAN IS

A creature asleep on an empty floor tells you nothing about itself. Each arena
carries **one authored prop the guardian was sleeping in**, and it must come
from the animal's own nature, not from the zone's colour scheme:

| Guardian | Lair |
|---|---|
| NULLFANG | a den scraped out of wrecked server racks, bedded with shredded boards |
| TALONHOST | a nest woven from antenna spars and cable, on the crown of a mast |
| FURNACE CHOIR | the cracked crucible it was cast in, still holding cooling slag |
| GLACIERE | an ice peak standing out of a frozen spring, flat-crowned |
| PRISM PROWLER | a geode alcove with a worn crystal ledge across its mouth |
| MOTHER-V | a hanging cradle of braided fibre-optic root |

Rules:

- **It is scenery, not a cutscene.** The prop is drawn in the room layer, at the
  boss's SPAWN position, and it stays there for the whole fight. The animal
  walks away from its bed; the bed does not disappear.
- **Anchored by where the boss's foot sits inside the plate** (`ax`/`ay` in
  plate-fractions, `LAIR` in `js/game.js`). Not by a corner offset — corners
  need re-guessing every time the art is regenerated, and it will be.
- **Generated on pure black and keyed with `tools/blackkey.cjs`**, which finds
  the background by FLOOD FILL from the borders. A luminance key looks fine on
  the ice peak and destroys the lion's den, half of which *is* near-black
  gunmetal; only black connected to the plate's edge is background.
- **Lazy-loaded** like every other sheet — a lair is fetched when you are
  standing in the arena that has it, never before.

### 3.10 EVERY MOTION GETS A CONTACT SHEET, AND THE SHEET IS COMMITTED

`tools/leapshot.cjs <out.png> [scale] [labelFilter]` lays a motion out beat by
beat. Look at it. Then put it in `assets/source/_sheets/`.

Reviewing a four-beat wind-up at a tenth of a sheet is how its ground arcs
shipped sitting under the animal's belly — use the label filter and look at it
large.

**Reference plates for a fight go in `assets/source/<boss>/motion/`** — one per
pose the rig must hit. They are reference, not shipped art; nothing in `js/`
loads them. They exist so "the leap has a real motion now" can be checked
against a drawing of what that means instead of against a description of what
was done.

---

## 4. CLASS C — the atlas creature

- One 8-yaw turnaround, 8 columns × N rows, one subject per row.
- Every cell is the **same** subject at the **same** scale from the **same**
  camera; that consistency is the entire reason a turn reads as a turn.
- Declared in `ATLAS.sub` with `row`, `k` (cell height in hitbox-heights) and
  `yOff`. Hovering creatures do not stand on the cell floor — that is what
  `yOff` is for.
- ✅ **Enforced:** a declared subject that nothing draws is a failure (§2).

Class C characters get **no** per-state art. If a creature needs a wind-up pose,
it has been promoted to class B and needs a rig.

---

## 5. CLASS D — the standing NPC

- One 6-yaw sheet, `npc_6yaw.png`.
- Volumetric, not flat: the same light/core-shadow/cast-shadow rules as §2.
- They must **stand over or under** the player believably — a boss at 34 px next
  to a 36 px player is not a boss.
- No combat poses, no telegraph colours. An NPC that never fights must never
  wear the fight's amber.

---

## 5.5 CLASS E — the Eye's constructs

The mini-bosses. Objects rather than animals — a wind-chime, a courier drone, a
sheet-metal moth, a growing frost lattice, an optical instrument — because
"made by the enemy" does not have to mean teeth, and the Eye builds INSTRUMENTS.

**They are generated and rendered like everything else.** The first cut of them
was procedural line art on the argument that they are "geometry and light, not
creatures" — that argument was written while the art connector was unreachable,
and it was a rationalisation. Next to a rendered guardian they read as flat 2D
drawings in a 3D game, which is exactly what they were. If you catch yourself
reasoning your way out of the pipeline, check whether the pipeline is simply
down (§0) before you believe the reasoning.

- **Two plates each**: at rest, and wound up. Not one plate tinted — the
  wind-up must be a different DRAWING, because a class with no rig cannot
  satisfy the silhouette law (§3.3) any other way.
- Generated on a plain field and keyed with `tools/blackkey.cjs`. The field is
  usually black; roughly one plate in ten comes back on white, so the keyer
  takes `--white` rather than assuming.
- **Moved by code, not posed**: bob, lean into their own velocity, a swell on
  the wind-up, constant rotation for the ones with no up. A static plate slid
  around a room is the failure NULLFANG's leap was rebuilt to stop being.
- Same hue law, same ground truth, same harness (`tests/artbible.cjs`), same
  fight grammar (`tests/minis.cjs`).

---

## 6. WHAT IS NEVER GENERATED

Ask: *does the renderer treat this as an object, or as light?* Generate objects
only.

- **Pure additive glow** — lava rings, halos, lit core states. Handed to a model
  they come back as beautifully lit *solid objects*, which is the wrong thing
  rendered well.
- **Anything with simulated secondary motion** — see §2.
- **UI**. Text is localised into five languages; art cannot carry it.

---

## 7. THE ARCHIVE RULE

> Any generated asset is committed to `assets/source/` **in the same commit that
> uses it**. If it is not in that directory, it did not happen.

This exists because the pipeline once kept generated art in a scratch directory
and committed only the composited atlases — so "the guardian was restyled" could
not be checked against anything. `assets/source/README.md` is the index and is
updated in the same commit.

---

## 8. RUNNING THE CHECKS

```bash
node build.cjs
npx http-server -p 8220 -s &
node tests/run.cjs artbible daze     # the art rules
node tests/run.cjs                   # everything
```

`tests/artbible.cjs` prints a table of every character and every rule it was
measured against. If it is green, the bible was followed — that is the whole
point of it being a test and not a document.
