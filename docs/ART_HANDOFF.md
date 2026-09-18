> **2026-09-18 correction:** [Approved source-preserving delivery](ART_IMPORT_2026-09-18.md) defines this delivery's palette, alpha, scale and tail decisions. Do not force its original dark visor into the obsolete 3–7% ink target.

# HZD-99 — external art handoff

**Who this is for:** any image tool or artist producing HZD-99's plates outside
this repo. Hand them this file and the four reference images in §7. Everything
they send back drops into the game through §5 and is accepted or rejected by
§6, which is a command that prints numbers, not an opinion.

**Why it exists** (2026-09-15): five passes of in-repo generation produced 27
plates and roughly three that survived review. The model holds her *identity*
fine — the canon reference element does its job — and does not hold **body
mass, claw state or facing** across independent generations. A move sheet needs
exactly those three to be constant. So generation moves out; specification,
assembly, measurement and wiring stay here.

---

## 1. What she is

A small **bipedal** robot cat. Rounded ceramic armour over a compact body, cape,
no visible mouth. She reads as a toy-scaled knight, not as an animal.

**She stands and fights on two legs.** This is the single rule that broke the
most generations. Her forelimbs are **arms** with shoulders and elbows; her paws
are **hands**. They do not touch the floor. She is never on all fours, never
prowling, never crouched like a real cat, never stretching like one. When a pose
brief says "crouch" or "low", it means a *fighter's* stance — knees bent, feet
planted, spine hinged forward — not an animal's.

### Palette, measured off the OWNER'S DELIVERED ARTWORK (2026-09-15)

Sampled across `b1_walk`, `b4_idle`, `b5_interact` and `c1_walkramp` in
`assets/source/hero/delivered/`. These supersede the values this table held
before: the delivered design is brighter and cleaner, its visor is near-black
rather than slate, its cape is a bright crimson rather than a dark brick, and its
ear interiors are ice BLUE where the old sheet had mint green.

| part | hex |
|---|---|
| ceramic body, lit | `#faead7` |
| ceramic body, highlight | `#fcf4e6` |
| ceramic body, mid | `#ead7c7` |
| ceramic body, shadow | `#d7b9a7` |
| visor band / outline | `#040304` — with `#030918` and `#051429` in the cooler falloff |
| eye-lights | `#8cfafd` |
| ear interiors | pale ice blue, not green |
| cape, lit | `#c42b32` |
| cape, shadow | `#8c1c2d` |
| gold trim | `#eca433` |

### Parts checklist

Chibi proportions — her head is about as large as her torso. Smooth bone-white
ceramic armour · tall pointed ears with pale ice-blue interiors · a wide
near-black visor band across the face carrying two bright cyan rounded-rectangle
eye-lights · a small round cyan light at each temple · four thin whiskers · a deep
crimson cape from the shoulders with a red collar · one brass-gold shoulder disc ·
three short dark vertical vent slots on the belly · small cyan lights at shoulder,
hip and knee · ball-jointed segmented arms and legs with visible joint rings ·
white mitten hands · short rounded boots with darker soles. No mouth. **No tail.**

**THE RICHER VARIANT IS CANON — and is now the only one.** The first delivery
carried two versions of her: `b5_interact` and `c1_walkramp` had the gold shoulder
disc, the belly vents and the whiskers, while `b1_walk` and `b4_idle` had none of
them. The richer one was ruled canon because it matches the design the game
already shipped and is the more finished drawing; the second delivery re-rendered
walk and idle to match, and everything wired is the richer variant. The plainer
sheets survive only in `assets/source/hero/delivered/` as the record.

**Retractable steel claws.** Dark-steel blades that extend from each hand. Out or
in is a per-pose decision the brief states explicitly, and it must be obeyed: a
sheet where the claws flicker between frames is the most visible defect there is.
§6 measures it.

### Never

No sword, no blade, no glowing green weapon, no katana on her back, no held
weapon of any kind. No jet flames or rocket exhaust under her feet. **The canon
reference image in §7 shows her holding a green sword with jets lit — that is
the part to ignore.** Every prompt must negate it explicitly or it comes back.

---

## 2. Rendering

**Painted 2D game-sprite illustration.** Smooth cel shading with a soft painterly
finish, a thin dark outline around the forms, one committed warm key light from
the upper left.

Not a 3D render. Not glossy plastic. Not flat vector. **Not pixel art** — no
staircase edges, no dithering, no 8/16-bit look.

A note that cost real money here: if the tool starts producing pixel art, the
cause is usually the *reference*, not the prompt. A style anchor under about
600px has a visible pixel grid, and the grid is the most confident feature in
the picture, so it gets copied. Upscale the anchor before using it.

## 3. Camera and framing — identical in every plate of a set

- **Three-quarter view from her front-left**, so she faces the **right** side of
  the frame, where her target is.
- **Both eye-lights visible**, with the far one foreshortened close to the near
  one. Not full profile (loses the two-eye visor read). Not front-on for anything
  she does facing a target — `tests/hero.cjs` measures the eye gap and fails a
  strip wider than her walk's widest, 0.099. The IDLE and the FIDGET are the
  deliberate exceptions: those face the camera, and the renderer cancels the body
  mirror for them so they never flip with her facing.
- Whole body, head to feet, with clear margin all round. Never cropped at the
  legs, never a bust, never a close-up.
- Feet on an invisible ground line near the bottom of the frame.
- **The same camera distance and the same figure height in every plate of a
  set.** Assembly rescales uniformly, so a plate that frames her larger does not
  get "fixed" — it comes out as a different-sized cat mid-swing.
- Square canvas, 1:1.

---

## 4. Background

**Transparent.** PNG with a real alpha channel, nothing behind her: no ground, no
floor line, no cast shadow, no vignette, no gradient, no text, no watermark.

This changed with the first real delivery (2026-09-15) and it is a straight win.
The spec used to ask for a flat black field because the pipeline keyed her off it
by luminance — which cost a dark fringe on her outline, roughly one plate in ten
coming back on white and being wasted, and a whole class of "the key ate her
gunmetal" failures. Delivered with alpha, none of that exists: `sheetslice` and
`movestrip` read the alpha directly and the keyer never runs.

A black field is still *accepted* — the luminance key is still in `movestrip` and
still works — but it is the fallback, not the ask.

**No energy effects on the body plate.** No aura, no sparks, no lightning, no glow
trails, no slash arcs, no motion streaks. They belong on their own sheet (§4a), and
the game also draws its own procedurally over the sprite
(`Player.releaseCharged` in `js/entities.js`). Painting light into the body plate
doubles it up in-game. The body carries the charge through *posture alone*.

---

## 4a. Two rules learned from the first real delivery (2026-09-15)

**One size across a strip.** Every frame of an animation must draw her at the
same height. `tools/movestrip.cjs` applies a single scale for the whole strip, so
a frame authored larger is not "fixed" — it plays as a different-sized cat. The
first delivery ran 1% spread on the walk (perfect) and 15–79% on others.

The exception is deliberate and the game asks for it: a **walk-away** — she turns
her back and recedes into a door or cave mouth. Send those at constant size too.
The receding is `drawGateWalk`'s job, and it has to stay there because the engine
shrinks her 84% into a lit gateway and only 16% into a cave, where darkness takes
her instead. A baked-in shrink would be right for one and wrong for the other.

**Effects must not bridge the gutters.** Frames are found by the transparent
columns between them, so a slash arc that reaches into the next frame welds two
frames into one. In the first delivery the jab's "frame 1" measured 916px wide
because a single arc spanned three frames. Either leave a wide clear gutter, or
— better — deliver the FX as their own strip, aligned frame for frame with the
body. The engine composites them anyway.

## 5. Delivery contract

- **Format** PNG with a real alpha channel, transparent background.
- **Layout** one PNG per animation, frames left to right in play order, with a
  clear transparent gutter of 20px or more between them that nothing crosses.
- **Size** her figure about **330px** from ear-tips to soles, identical in every
  frame of every animation. A 2172×724 sheet carrying eight frames is the shape
  the first good delivery arrived in and it is ideal.
- **Naming** `<move>.png`, and `<move>_fx.png` for the matching effects sheet.

Single plates (one pose per file) are still accepted as `<move>_<NN>.png`
numbered from 00 in play order, one folder per move — that is the route
`tools/movestrip.cjs` was built for and it is right when a pose needs re-rolling
on its own.

What happens to them here:

```bash
node tools/movestrip.cjs  <indir> <out.png> 320   # key, scale, foot-align, lay out
node tools/stripcheck.cjs <out.png> <cells>       # §6 — must pass
node tools/towebp.cjs     <out.png> <out.webp> 0.9
```

`movestrip.cjs` applies **one global scale** derived from the median body height
and anchors every cell on her **footprint** — not her bounding box, because the
box grows rightward as an arm extends, which slides her body left and makes her
moonwalk backwards through her own punch.

---

## 6. Acceptance — this is the gate, and it prints numbers

```bash
node tools/stripcheck.cjs <strip.png> <cells>
```

Every cell is measured against **the strip's own median**, normalised to that
cell's figure height:

| column | what it catches | band |
|---|---|---|
| `mass` | opaque pixels / height² — **body mass drift, the "fat cat"** | ±18% of median |
| `waist` | body width at 55% height / height — bulk at the belly | ±22% of median |
| `dark` | dark-steel fraction — **a proxy for whether the claws are out** | ≥ 55% of median |
| `eyes` | cyan pair gap / height — facing smell | ≤ 1.35× median |
| `h` | figure height — off-model plate, since scale is already uniform | — |

A non-zero exit means cells are out of band and names them. The `eyes` column is
a cruder method than the game's own; the authoritative facing test is:

```bash
npx http-server -p 8220 -s &
node tests/hero.cjs
```

which requires the strip's **median eye-gap over figure height to be at or below
0.099** — the widest her walk cycle shows. The strip this document replaced
measures **0.406**, four times over, because it was cut from a video take whose
chroma key left coloured blocks in frame that the test reads as her eyes.

Then the full suite, since art changes touch the package:

```bash
node tools/lowres.cjs && node build.cjs && npm run app:pack && node tests/run.cjs
```

**Iterate per frame, not per sheet.** The advantage of plates over a filmed take
is that one bad cell is one re-generation. Re-roll only the flagged cells.

---

## 7. Reference images to hand over

| file | what it is for |
|---|---|
| `assets/source/ref/hzd99_canon.jpg` | **identity only** — her parts and proportions. Ignore its sword and jet flames. |
| `assets/source/hero/style_d/states/claw_2.jpg` | **the rendering target** — the painted look, and a correct three-quarter facing. Upscale before using as an anchor (see §2). |
| `assets/source/hero/style_d/states/idle.jpg` | her neutral build and full parts list. |
| `assets/source/ref/hzd99_heavy_standard.jpg` | **the owner's keyframe sheet** — the pose standard for the charged scratch, §8. |

---

## 8. Open brief: the charged scratch (`burst`)

Replaces `assets/characters/hero/swing/burst.webp`, which is rejected.

The standard is the owner's sheet, `hzd99_heavy_standard.jpg`, twelve frames
along its HEAVY ATTACK row. Read from it: **she stays low, braced and bipedal
throughout, feet planted, facing right.** She never leaps, never goes airborne,
never drops to all fours. The escalation is in how deep and how tight the stance
gets, not in travel.

The aura and the cyan slash arcs in that sheet are the **game's** job — do not
paint them (§4).

Eight plates, `burst_00.png` … `burst_07.png`:

| # | pose | claws |
|---|---|---|
| 00 | Standing ready. Upright, weight even, arms low at her sides, cape hanging. Calm. | **in** |
| 01 | Wind-up begins. Feet shoulder-width and planted, knees bending, upper body hinging forward from the hips toward the target. Both arms swing back and down behind her hips, elbows pointing back, hands open at hip height and clear of the floor. Head forward, eyes right. A boxer loading a punch. | **out** |
| 02 | Deep loaded stance. Feet wide — front foot advanced, rear foot braced back — both knees bent hard, hips sunk low, torso leaning forward over the front knee. Both arms drawn back behind her hips, elbows raised. Head low and pushed forward, eyes locked right. Cape swept forward past her flanks. | **out** |
| 03 | The charge held at maximum, straining. Same stance, wound tighter: hips at their lowest, torso furthest forward, shoulders hunched toward the head, back arched, both arms wrenched as far back as they go with the blades spread wide. Ears flat, tail straight back. Trembling. | **out, widest spread** |
| 04 | Release. Hips driving forward, torso unwinding upward out of the crouch, the leading hand whipping up and forward from behind her hip, blades first. Trailing hand still back. Shoulders rotating right. Cape snapping backward. Feet still planted. | **out** |
| 05 | Mid-swing, the fastest part. Torso rotated hard right, the striking hand sweeping across and up in front of her at three-quarter reach, the other flung back and down for counterbalance. Head following the blades. Cape torn out straight behind. | **out** |
| 06 | **Full extension — the contact frame and the most extreme shape in the set.** Feet wide and braced, front knee deeply bent taking the drive, rear leg straight and stretched behind, torso thrown forward and low, the striking arm at its absolute limit toward the right edge of frame, blades at maximum spread. Cape one taut line. | **out, maximum** |
| 07 | The finish. Still low and turned right but settling, striking arm swept past the target and coming down across her far side, trailing hand drawn toward her chest, shoulders dropping. Head still right, watching. Cape collapsing around her legs. | **retracting** |

Frames 01–06 must all read as **the same weight of cat**. That is what §6's
`mass` and `waist` columns exist to enforce, and it is what the last attempt
failed: its brace frame came in 20% heavier and 46% wider than its neighbours.

---

## 9. The list — status 2026-09-15 (evening)

**Wired and live, all measured clean:** walk · idle · walk-away (gate entry) ·
run-away (cave entry) · claw jab · double slash · uppercut · dash.

That is eight of the nine sheets in the second delivery. Every one went
sheetslice -> movestrip -> stripcheck without a real flag, and the combo is now
one character end to end instead of a drawn opener into filmed follow-ups.

### The one that needs re-rendering

**SUPERCHARGED SCRATCH.** It is drawn at **230px** where every other sheet is
355-475px — roughly half scale — and its twelve frames arrive welded into seven
because the energy crosses the gutters. `tools/sheetslice.cjs` now splits bridged
frames automatically and recovered three of them, but it cannot invent
resolution. This is the sheet that replaces the strip the owner rejected, and
`tests/hero.cjs` fails on that strip alone: **burst at 0.406 against the walk's
widest 0.099.** It is the last red thing in the hero harness.

Ask for: twelve frames, her figure ~330px like the others, body only, with the
blue energy on its own frame-aligned sheet.

### Still never delivered

| animation | frames | why it matters |
|---|---|---|
| jump start | 4 | no art at all; the pose cell draws |
| air rise | 4 | " |
| air fall | 4 | " |
| land | 4 | a filmed strip exists, 12 cells |
| skid | 4 | the game has only a 2-cell filmed strip |
| wall slide | 4 | 3-cell filmed strip |
| hurt | 4 | 6-cell filmed strip |
| death | 6 | filmed |
| heal | 5 | no art |
| fidget | 8 | the impatient idle after 5s standing |
| **armed walk-away** | 8 | the delivered one has nothing on her back, so it is right unarmed and wrong once she carries the crystal — `drawGateWalk` falls back to the old plates when armed |
| air attack / down attack | 6 each | no strips |

### The effects layer

Still the outstanding format ask, and it now has a second reason. Beyond keeping
the gutters clean, the engine composites and times effects itself — and the
supercharge proves the cost of not doing it: its energy is what welded its frames
together and what will keep doing so at any resolution.
