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

### 0.1 THE SECOND CAUSE: THE WORKER RESTARTED

There is a second, completely different reason the tools can vanish, and it is
NOT the session-attach lag above. Telling them apart matters, because the owner
asked the fair question — "why do you keep seeing it as disconnected when my
side says connected, and I have not touched it?" — and the honest answer is
that two different layers are being reported:

- **His UI reports the ACCOUNT.** Is the connector installed and authenticated?
  That lives on the server and does not change when anything local dies.
- **My tool list reports THIS PROCESS.** Is there a live MCP session held by the
  worker running this conversation? That is a socket, and a socket dies with the
  process that owns it.

So `connected: true` and a missing tool list are not a contradiction. They are
two true statements about two layers.

**The fingerprint of a worker restart** — as opposed to anything the user did:

- The harness says so outright ("The container was restarted").
- Background shell jobs are killed in the same instant. A connector toggle
  cannot kill a running `node tests/run.cjs`.
- **Several servers drop together, and only some come back.** Observed here:
  Higgsfield and Supermetrics both vanished on the restart; Supermetrics
  re-attached under a NEW `installedServerId`, so every one of its tool names
  changed prefix, while Higgsfield did not re-attach at all. One shows
  `enabledInChat: true` and the other `false` with IDENTICAL account status.
  No user action can do that to two connectors at once.

**What it means for the work:** the art is not blocked on the owner and there
is nothing for him to fix. It is blocked on this session getting its socket
back. Retry step 1 periodically; a fresh session rebinds cleanly. Report it
ONCE, in those terms — "this process lost its connection, your account is
fine" — and never as "your connector is off".

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

## 2. CLASS A — the protagonist. THE EXCEPTION IS REVOKED.

**The owner has ended the procedural exception** (2026-08-14): with the whole
cast on the pipeline, her live-drawn body was visibly the weakest art on the
screen — flatter than the wolves standing next to her, and with no back view at
all. "Use it as a template and let Higgsfield do a clean new one with all
needed angles" is the ruling, and it is the right one.

**So she is authored now, like everything else, on these terms:**

- **Generated FROM one locked plate, never from a description of her.**
  ✅ **The canon is `assets/source/ref/hzd99_canon.jpg`**, chosen by the owner on
  2026-08-14, and it is bound to the generator as the reference element
  `hzd99-canon` = `467c8e08-8161-483f-a4cf-439875ff04e2`. **Every plate, every
  sheet and every VIDEO of her embeds `<<<467c8e08-8161-483f-a4cf-439875ff04e2>>>`
  in its prompt.** Not "attaches a reference" — embeds the element.

  This replaced attaching `hzd99_body.png` and describing her in words, and the
  reason is measured rather than argued: with prose plus a loose reference, the
  front half and back half of the SAME turnaround sheet came back as two
  different cats — different ears, different head size, the scarf grown into a
  cape. Both shipped sheets have it. A description cannot pin geometry; the same
  image injected into every generation can.

  This is also the standing guard against the stranger-cat incident:
  `roster_8yaw.png` row 0 IS a generated turnaround of a *different* robot cat,
  it went on screen once, and a stale element named `NYA-9` describing yet
  another cat still sits in the generator workspace. Neither is her.

- **HER EYES ARE THE ONLY PART OF HER THAT ACTS, AND THEY ARE NEVER BAKED.**
  She has no mouth and no brows: two lights carry every feeling she has. So the
  eye-lights on every plate are COVERED at runtime and repainted live
  (`drawRoboPlate` → `drawHeroEyes`), because art with an expression baked into
  it gives her one face per pose forever — the same face landing a jump as
  taking a hit.

  **Her resting face is CUTE, and that is a rule and not a default.** `calm` is
  two big soft rounded lights with a slow blink; every other mood is a departure
  that decays back to it. A protagonist whose neutral face is neutral reads as
  an appliance. Hers reads as a kid, and the game is what hardens it.

  **Shape carries the emotion, never hue.** Red is the virus and amber is the
  reserved telegraph (§3.5), so her feelings may not reach for either — an angry
  cat with red eyes reads as infected. Her range is her own cyan-to-mint, and
  what changes is the shape: narrowed to slits, inner corners down for anger,
  outer corners down for sadness, shut upward for a smile, one eye small for a
  question. The mood names match `drawPortrait`'s expressions on purpose, so the
  bust in the dialogue box and the body on the floor never wear different faces.

  ✅ **Enforced** by `tests/hero.cjs`: every mood must differ from `calm` across
  a real fraction of her lit pixels, measured on cyan only. Nine moods that
  render as three faces is the failure it exists to catch.

- **The canon plate governs body, face, materials and proportions ONLY.** It
  carries the retired green blade, and that licenses nothing: the weapon is the
  white purifier crystal (elements `purifier-crystal` /`purifier-double`) or she
  is unarmed. Her chest is the canon plate's WHITE/IVORY belly with the dark
  vent grille — this reversed an earlier "brushed steel is canonical" ruling.
- **The arm rule survives the conversion.** One-piece limbs, two of them, no
  joint hardware — stated in every brief's negatives. A generator loves to add
  greebles at the elbow; the brief forbids them by name.
- **Full coverage, measured.** An 8-yaw turnaround (the same grammar as the
  roster: world-locked key light, never mirrored) PLUS action plates for every
  state `tools/statesheet.cjs` renders. The statesheet is the checklist: a
  state on that sheet with no authored plate is an open task, not a style.
- **The simulation survives as OVERLAY.** Scarf spring-chain, blade glow, jets,
  charge aura and the claw arcs stay procedural, drawn over the plates — that
  is what the simulation was always good at. What ends is the procedural BODY.
- The full brief, ready to fire, lives in `docs/ART_QUEUE.md` §1.

Until the plates land she keeps the procedural body — a worse body on screen
beats no body — and `tests/hero.cjs` holds its rules either way.

**What the procedural body's "3D" was bought with, kept for the overlays:**

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

## 9. STAGE READABILITY — the frame is the unit, not the asset

**Everything before this chapter constrains ONE ASSET. That is why the game can
be green on every rule in it and still lose to a competent side-scroller
frame.** A teardown against *Prince of Persia: The Lost Crown* (2026-08-16)
found eleven defects and every one of them was a RELATIONSHIP between assets —
which `tests/artbible.cjs` cannot see, because it measures one sheet at a time.

So this chapter and the next have a different unit: **the assembled picture**,
and they are enforced by `tests/grammar.cjs`.

### 9.1 THE THREE-PLANE VALUE LAW

✅ **Enforced.** Every frame is three luminance bands, and they never overlap:

| plane | luminance | treatment |
|---|---|---|
| background | **10–25%** | desaturated, cooled, soft edges, haze layer at 5–10% |
| playable mid-plane | **35–60%** | hard edges, full material detail |
| actors and objectives | **70–95%** | the brightest things in frame, always |

**The squint test is the acceptance test:** blur the frame until shapes go, and
the player and the current objective must be the two brightest elements left.
If a background lamp survives that test, the background is wrong.

- ✅ **Enforced:** character-vs-background mean luminance delta **≥ 30 points**.
- ✅ **Enforced:** far, mid and near thirds ordered monotonically in luminance.

### 9.2 THE SACRED GROUND PLANE

✅ **Enforced.** Every walkable surface carries a **lit top edge**, and every
standing object casts a **hard contact shadow**. No pure-black floors: the
shadow floor never drops below **8% luminance**.

The reason is not beauty. A floor the player cannot distinguish from the wall
behind it is a playability defect, and this game shipped one — `platforms.png`
was lighter and lower-contrast than the backgrounds it sat on.

### 9.3 ONE SIGNATURE ACCENT PER CHARACTER

✅ **Enforced.** Every character reads as a unique pure-black cutout, and each
carries **exactly one** saturated signature accent, documented here:

| character | signature accent |
|---|---|
| HZD-99 (the protagonist) | the red scarf, at full saturation |
| NULLFANG | virus violet |
| GLACIERE | ice blue |
| TALONHOST | brass amber-gold |
| THE CHOIR | furnace orange |
| PRISM | rose magenta |

**One accent means one.** A guardian whose whole body glows has no accent; it
has a colour. `beasts/wolf_coil.png` currently wears the reserved telegraph
amber over its entire resting body, which spends the game's one "this is
coming" signal on an animal standing still.

### 9.4 THE TWO-COLOUR SCRIPT PER ZONE

Each zone declares **one dominant environmental key hue**. **Teal is reserved,
globally, for interactive and UI** — nothing environmental may wear it.

- Interactive objects edge-light in teal when in range. That is the only way
  the player is told a thing can be touched.
- UI draws in the accent hue alone.

### 9.5 EDGE DISCIPLINE

**Hard edges mean gameplay-relevant. Soft edges mean atmosphere.** The mid-plane
is sharpened; background plates are blurred. An atmospheric detail rendered at
mid-plane sharpness is a lie about what the player can stand on.

This also kills the sticker problem: a binary matte gives every asset a uniform
hard rim all the way round, so nothing has air around it. Matting erodes alpha
by 1px, feathers 1.5–2px, and multiplies the outermost ring by ~0.6.

### 9.6 SINGLE-KEY LIGHT LOGIC

✅ **Enforced by brief.** Every scene declares **one key light** in its
metadata and all prop shading obeys it. Secondary sources are local accents
only.

**The house key is: warm, upper-left, ~40° elevation; cool ambient fill from
the lower right; the shadow side of every form falls into near-darkness.**
That paragraph goes at the TOP of every generation prompt from here on.

**And this line is struck from every brief in the repository:**

> ~~"photographed in a pitch-dark room, spotlights pick out the subject and
> nothing else receives any light"~~

That is a product-photography brief. It is correct for isolating a subject to
matte and wrong for an object that must stand in someone else's room, and it
is why six shipped plates each carry a different key direction.

### 9.7 THE GLOBAL ZONE LUT

Per zone: lifted blacks, a shadow tint complementary to the key hue, a gentle
vignette. This is `lightPass()` in `js/game.js`, and it is the instrument that
makes independently-generated assets share a room.

**It must never run at zero.** It is currently the first thing dropped when the
frame rate slips, which means the one thing holding the picture together is the
first thing switched off. It gets its own floor.

---

## 10. TERRAIN SILHOUETTE GRAMMAR

> **The world is ruined machines, caves and tunnels. Nothing here was built
> yesterday and nothing is level. The Mario grid is banned.**

The owner's standing order — "no 90-degree elevation or walls in all game" —
has been in `CLAUDE.md` since 2026-08-15 and the game kept shipping rectangles
anyway. The reason is that the order was a prohibition without a grammar: it
said what not to draw and never said what to draw instead. This chapter is the
grammar, and `tests/grammar.cjs` is its enforcement.

### 10.1 TWO-MESH SEPARATION — the idea everything else rests on

**Terrain is authored as two layers that are allowed to disagree:**

- **(a) the collision polyline** — simplified, forgiving, boring on purpose.
  Gameplay stays clean. This engine has no slopes, so the collider stays
  tile-quantised, and *that is fine* — it is layer (b) that the player looks at.
- **(b) the visual surface mesh** — deliberately **4–12px rougher** than the
  collider: overhang, crumble, protrusion, sag.

**The player walks on the collider; the eye sees the ruin.** Every rule below
is a rule about layer (b). None of them touch collision, which is why all of
them can ship without an engine change.

### 10.2 NO **UNDECORATED** AXIS-ALIGNED RUNS

**The original form of this rule was "no axis-aligned run may exceed 96px",
and it was checked against the reference before it was written down here. It
does not survive the check.**

*Prince of Persia: The Lost Crown* — the game this chapter is modelled on —
breaks that rule in almost every frame. Its ruins are cut masonry: long
horizontal ledges, square-stepped staircases, rectangular stone blocks with
intact 90° corners. So does *Hollow Knight*. A law that the reference itself
fails is not a law, it is a superstition, and enforcing it here would have
meant rebuilding a tile engine to chase something that was never the
difference.

**What the reference actually never does is show a BARE straight edge.** Every
long run it draws carries the three-part edge of §10.3 — a lit crest, a
material body, and a broken under-hang of vines, roots, rubble or hanging
debris — and sits in a different value band from what is behind it. The eye
reads "ruin" from the decoration and the depth, not from the absence of
straight lines.

✅ **Enforced, in the form that survives the reference:** a horizontal run
longer than **96px** is permitted **only if it carries both a lit lip and a
broken skirt** (§10.3). A long run with a flat top and a flat underside is a
failure. An undecorated straight edge of any length above 96px is a failure.

Where organic terrain IS the right answer — caves, earth, ice, growth — the
old advice still applies and is the cheapest way to pass: tilt segments ±3–15°,
height jitter 2–8px, chipped corners, sagging mid-spans, and rubble ramps
instead of clean quantised stairs. That is a technique, not the law.

**And this game's collider never has to change to comply**, because §10.1
separates the meshes. The engine has no slopes; it does not need any.

### 10.3 THE THREE-PART EDGE — every walkable edge owes three things

This is the single most transferable rule in the chapter, and the one the game
has never done:

1. **The lip** — a bright, irregular **2–4px lit crest** along the top, obeying
   the sacred-ground-plane law.
2. **The body** — the material face: cracked plating, rock strata, cable
   bundles, whatever the zone lexicon says.
3. **The skirt** — a **dark under-hang, 8–24px**, that breaks the bottom line:
   dripping wires, broken struts, stalactite rubble, torn mesh.

✅ **Enforced:** **a platform with a flat underside is a failure.** Undersides
hang, drip and trail. A rectangle with a nice top is still a rectangle.

### 10.4 THE CORNER DESTRUCTION RULE

**Same correction as §10.2, for the same reason:** the reference is full of
intact 90° masonry corners. What it has and we do not is that **no corner is
ever left bare** — every one is chipped, capped, silted, overgrown or in
shadow.

✅ **Enforced:** **no *bare* 90° outer or inner corner survives.**

- **Outer corners:** chipped, bent, or capped with a debris cluster.
- **Inner corners:** filled with silt, scrap piles, root or cable growth, or a
  curved fillet.

Each material owns a **corner-piece library of at least 6 variants**, and the
tiler is required to use it. Six is not decoration — below that the eye finds
the repeat inside one screen.

### 10.5 THE ZONE SURFACE LEXICON

**Every platform is assembled from its zone's lexicon, never from a blank
rectangle.** This is the mimic-the-background rule from `CLAUDE.md` made
specific:

| zone | surface lexicon |
|---|---|
| Machine Depths | buckled hull plating · snapped conveyor segments · frost-heaved panels · collapsed catwalks tilted 15–25° · walls of fused scrap-and-stone |
| Scrap Meadows | rusted vehicle carcasses · pressed-earth banks · root-split concrete · toppled fencing |
| The Foundry | slag crust · machine housings · spilled ingot runs · bent walkway grating |
| Glaciere | frost-heaved rock · rime shelves · cracked ice plates over dark water |
| The Nest | woven cable mats · shell debris · torn mesh · organic strut growth |
| Odyssey (NOSTOS) | eroded stone · root-broken ledges · fallen column drums · silted steps |

### 10.6 ELEVATION LOGIC — height changes tell a story

A "step up" is **a fallen girder, a slumped rock shelf, a tilted machine
carcass** — never a clean quantised stair. Where verticality is needed: irregular
ledges, spacing varied **±20%**, mixed slope approaches.

### 10.7 THE ANTI-TILING LAW

✅ **Enforced.** No visible tile repetition within one screen width:

- **≥ 4 variants** per terrain module
- random flip/rotation within slope tolerance
- overlay decals — stains, moss, frost, scorch — at **20–40% density**

---

---

## 11. RUNNING THE CHECKS

```bash
node build.cjs
npx http-server -p 8220 -s &
node tests/run.cjs artbible daze     # the art rules
node tests/run.cjs                   # everything
```

`tests/artbible.cjs` prints a table of every character and every rule it was
measured against. If it is green, the bible was followed — that is the whole
point of it being a test and not a document.
