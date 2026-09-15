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

### Palette, sampled off the shipped master (not described from memory)

| part | hex |
|---|---|
| ceramic body, lit | `#e4daca` |
| ceramic body, mid shadow | `#c9b8a9` |
| ceramic body, core shadow | `#96847a` |
| highlight / rim | `#fce7c8` |
| visor band | `#393543` |
| eye-lights | `#84fdf3` |
| ear interiors, seam hairlines, chest core | `#8bccaa` |
| cape and scarf, lit | `#823235` |
| cape and scarf, shadow | `#591d25` |
| cape deep fold | `#69232c` |
| shoulder discs, brass | `#a47c42` |

The cape is **deep crimson**. Several rejected plates came back with a bright
orange underside — that is wrong.

### Parts checklist

Tall pointed ears, mint interiors · charcoal visor band across the face with two
bright cyan eye-lights · four thin steel whiskers · crimson scarf at the neck
running into a long crimson cape · two brass shoulder discs · a small cyan core
light centred on the chest · three dark vertical vent slots on the belly · white
mitten hands with steel wrist cuffs · short legs · one thin tail.

**Retractable steel claws.** Four dark-steel blades that extend from each hand.
Out or in is a *per-pose decision that the brief states explicitly*, and it must
be obeyed — a sheet where the claws flicker in and out between frames is the
single most visible defect. §6 measures this.

### Never

No sword, no blade, no glowing green weapon, no katana on her back, no held
weapon of any kind. No jet flames or rocket exhaust under her feet. **The canon
reference image in §7 shows her holding a green sword with jets lit — that is
the part to ignore.** Every prompt must negate it explicitly or it comes back.

---

## 2. Rendering

**Painted 2D game-sprite illustration.** Soft cel shading with visible painterly
brush texture on the armour, a thin dark warm-grey edge line around the forms,
pale mint hairline seams between panels, one committed warm key light from the
upper left.

Not a 3D render. Not glossy plastic. Not flat vector. **Not pixel art** — no
staircase edges, no dithering, no 8/16-bit look.

A note that cost real money here: if the tool starts producing pixel art, the
cause is usually the *reference*, not the prompt. A style anchor under about
600px has a visible pixel grid, and the grid is the most confident feature in
the picture, so it gets copied. Upscale the anchor before using it.

---

## 3. Camera and framing — identical in every plate of a set

- **Three-quarter view from her front-left**, so she faces the **right** side of
  the frame, where her target is.
- **Both eye-lights visible**, with the far one foreshortened close to the near
  one. Not full profile (loses the two-eye visor read). Not front-on (the game
  measures this and fails it — see §6).
- Whole body, head to feet, with clear margin all round. Never cropped at the
  legs, never a bust, never a close-up.
- Feet on an invisible ground line near the bottom of the frame.
- **The same camera distance and the same figure height in every plate of a
  set.** Assembly rescales uniformly, so a plate that frames her larger does not
  get "fixed" — it comes out as a different-sized cat mid-swing.
- Square canvas, 1:1.

---

## 4. Background

**Pure flat black, edge to edge.** Nothing else: no ground, no floor line, no
cast shadow, no vignette, no corner glow, no gradient, no text, no watermark.

Black because she is near-white and keys cleanly off it. A white background is a
rejection — roughly one plate in ten came back that way and each one is wasted.

**No energy effects in the plate.** No aura, no sparks, no lightning, no glow
trails, no slash arcs, no motion streaks. The game draws all of that
procedurally over the sprite (`Player.releaseCharged` in `js/entities.js`).
Painting light into the plate doubles it up in-game. The body carries the charge
through *posture alone*.

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

- **Format** PNG, RGB, on the black field described above. No alpha needed —
  keying happens here.
- **Size** 1024×1024 or larger, square. Bigger is fine.
- **Naming** `<move>_<NN>.png`, zero-padded, numbered in **play order** from 00.
- One folder per move.

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

## 9. The list — what the game still needs (2026-09-15)

Wired and done: **walk**, **idle**.

Ranked by how much of the game each unblocks, not by how hard it is.

### Priority 1 — locomotion, which is on screen constantly

| animation | frames | state |
|---|---|---|
| **run** | 8 | delivered at 15% height spread — re-render at constant size |
| **jump start** | 4 | not delivered |
| **air rise** | 4 | not delivered |
| **air fall** | 4 | not delivered |
| **land** | 4 | not delivered |
| **skid** (the turn-and-stop) | 4 | not delivered, and the game has no art for it at all |
| **dash** | 6 | delivered at 24% spread — re-render at constant size |
| **wall slide** | 4 | not delivered |

### Priority 2 — combat, replacing art the owner rejected

| animation | frames | state |
|---|---|---|
| **supercharged scratch** | 12 | delivered at 188px — half the height of every other strip. Re-render at ~330px with the FX on their own layer. This one replaces the rejected `burst`. |
| **claw jab** | 5 | bodies are clean (3% spread); only the gutters need widening |
| **double slash** | 6 | 19% spread — re-render at constant size |
| **uppercut** | 6 | 78% spread, and its frames weld together — re-render at constant size with clear gutters |
| **air attack** | 6 | not delivered as a strip |
| **down attack / plunge** | 6 | not delivered as a strip |

### Priority 3 — reactions and flavour

| animation | frames | state |
|---|---|---|
| **hurt / hit react** | 4 | not delivered |
| **death** | 6 | not delivered |
| **heal** | 4–6 | not delivered, no art in the game |
| **fidget** (the impatient idle, after 5s standing) | 6–8 | not delivered |
| **walk-away / gate entry** | 8 | **delivered and wanted** — replaces the two static back plates `gateEnter()` flips between today |
| **run-away / gate entry** | 8 | delivered, same use |

### The effects layer

The very first sheet's section 23 had this right: arcs, impacts, dust and sparks
as their own frames. Deliver them that way — one FX strip per attack, aligned
frame for frame with the body strip — and both problems go away at once: the
gutters stay clean, and the engine can tint, scale and time the FX independently,
which is what it already does for every procedural effect it draws.
