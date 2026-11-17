---
name: rig-animation
description: Animate a character from ONE fired sheet of body parts instead of one picture per move — brief the parts sheet, cut and anchor it, write moves as pose rows, and let the engine blend between them. Use when a character needs a new move or smoother motion between moves, when deciding whether art should be generated per pose at all, when adding a character to the agent rig, or when the owner asks to cut the amount of artwork a character needs.
---

# One sheet of parts, every move

The owner, 2026-11-17: *"Do you have the ability to animate those agents between
those moves?... instead of generating the artwork for every single move. And
this way we can make everything smoother... to minimize the amount of artwork
needed."*

A character drawn as **plates** costs one finished picture per move, and the
game cuts from one picture to the next. A character drawn as a **rig** costs one
sheet of parts; every move after that is a row of numbers, and the motion
between two moves is free. GRAVEHORN has always been drawn this way
(`js/gravehorn.js`, `tools/ghparts.cjs`). The robed agents are the proof for a
clothed biped (`js/agentrig.js`, `tools/agentparts.cjs`, `tests/agent-rig.cjs`).

Measured on TALLYMAN: plates cost about 24 credits an agent (a stand plate, six
state plates, a filmed walk). The rig's whole art cost was **one parts sheet at
1 credit**, first attempt.

## 0. Decide first: rig or plates

Read `ART_BIBLE.md` §1. The test is one sentence: *if the pose is a continuous
function of game state, it is a rig.*

| the character | draw it as |
|---|---|
| has many moves, or will get more | rig |
| must flow from one move into the next | rig |
| is hard-surfaced (armour, machine, bone) | rig — it will look best of all |
| is mostly loose cloth, fur or hair | rig only with the cloth rules in §4, and prove one before converting a set |
| has one or two iconic poses seen close up | plates — a painted pose beats a posed one in a still |
| must TURN to face the camera or away | separate fired views for the turn (`GH_TURN`); a rig does not turn |

**Say the trade plainly when you report it.** A rig is smoother and cheaper; a
plate is a better single picture. In the TALLYMAN proof the gathering pose is
the clearest case: the plate has painted flame in the palms, the rig has light.
The owner judges that trade — do not decide it for him by converting a shipped
character. A NEW rig ships beside the plates, switched off, until he has seen
it. Having seen TALLYMAN's, his decision for the agents was neither: **"mix
them, rig for motion and plates for big poses"** (2026-11-17) — §5a.

## 1. The parts sheet — the only art

One generation, against the character's approved standing plate as the
reference. What makes it usable is all in the brief:

- **Name every piece and its cut.** "HOOD AND HEAD … ending in a flat cut at the
  base of the neck. Nothing else." A piece described loosely comes back fused to
  its neighbour.
- **One row, left to right, in a stated order**, wide gaps, nothing touching.
  The cutter names pieces by their order; a sheet in two rows needs a new order.
- **Limbs hang straight down, the prop stands vertical**, and every piece is in
  the same view as the reference. A part drawn already bent bakes that bend into
  every pose.
- **Close what the body hid.** "NO arms (the shoulder openings are closed with
  cloth)". Otherwise the torso arrives with holes where the arms were.
- **"All at the same scale" will be ignored for the prop.** A staff comes back
  fitted to the frame. The rig does not trust sheet scale: each part's size is a
  number in the skeleton (§3).
- The plate rules as always: one flat chroma field, no floor line, no cast
  shadow, no labels, no outlines. A subject near the screen's hue needs a
  tighter key (`PARTS_KEY`), exactly as `tools/plate.cjs` does.

The biped set is seven pieces: `head, torso, skirt, uarm, farm, leg, prop` —
one arm and one leg, each drawn twice. The brief that worked, word for word, is
in `assets/source/agents/jobs.json` under `tally.parts`.

Archive it in the same commit: `assets/source/<subject>/parts_asfired.webp`.

## 2. Cut and anchor — a tool, never by eye

`node tools/agentparts.cjs <name>` keys the sheet, takes the big connected
pieces left to right, and writes each as its own plate plus `rig/rig.json`.
`build.cjs` compiles every `rig.json` into the page, and the rig registers only
parts that are on disk.

What it measures, and why it is measured and not typed:

- every part's **top and bottom centre** — the default joints;
- the **shoulders** on the torso, the **elbow** in the sleeve, the **hand** in
  the forearm, the **ankle** and toe of the leg, the **eyes** in the head.

All of them are **fractions of the part**, so the quarter-scale copy
`tools/lowres.cjs` makes is still the same part. (A rig addressed by absolute
pixel rect cannot have a small copy — that is the six guardian atlases'
exception, and it is not one to add to.)

**Look at the cut on a neutral field before posing anything.** The two mistakes
that came up: a dark stripe on a cuff was measured as the hand (fixed by looking
only where the hand can be — forward of the sleeve), and a black-field flood
eating a belly's own shadow (keep the flood threshold at the field's real
level, not a comfortable one).

## 3. The skeleton and a move

`js/agentrig.js`, top to bottom:

- `AGENT_RIG_UNITS` — how big each part stands, in body heights. One skeleton
  for every agent of the same build.
- `AGENT_POSE_BASE` — the standing body.
- `AGENT_POSE` — **a move is a row**: only the numbers that differ from standing.

Angles are in the body's own terms so a row can be read without a diagram:

- a **limb** hangs straight down at 0 and swings **forward** as the number grows;
- the **spine, head, shin and prop** stand straight up at 0 and lean forward;
- lengths are body heights (1 = hood top to floor); the art faces LEFT.

```js
// spent: both hands on the planted prop, the head hung
exhale: { rate: 7, hp: 0.44, sp: 0.42, hd: 0.5, aF: 0.25, bF: 1.0, aB: 0.35, bB: 0.95, … }
```

To add a move: write its row, add its condition to `agentRigMove`, photograph
it, measure it. Read `boss-movegen` for what the move must *be*; this skill is
only how its body is drawn.

Traps, each of which cost a pass:

- **The engine already scales the body.** Agents are drawn inside a ×1.22
  scale. Size the rig to what the PLATE is drawn at before that scale
  (`AGENT_RIG_BODY`), then measure both through the same call. The first rig
  stood a fifth too tall.
- **Solve the joints before drawing.** A part needs the position of joints on
  parts drawn after it (the prop is in a hand that is drawn last).
- **Two ways round a circle.** An arm cocked back overhead can be written as a
  forward or a backward elbow angle; they look identical settled and completely
  different in motion. Pick the one whose path the arm would really take.
- **A planted prop finds the floor itself** (`stP`): never type a grip height.
- **Kneeling legs go under the robe**, not behind it.

## 4. Cloth — why a robed body is the hard case

Armour hinges. Cloth does not, and a rigid cuff turned sideways reads as a
paddle. What is done about it, in order of how much it helps:

1. **The robe is not hinged, it is fitted.** The skirt runs from the hips to the
   floor at whatever height the hips are (`skL`), and widens as it shortens
   (`skW`). Cloth folds; it does not rotate about a pin.
2. **It trails.** A spring swings the robe behind a moving body and back when it
   stops. That one overlay does more for "alive" than any pose.
3. **Keep sleeves near hanging at rest.** The cuff was painted hanging; the more
   a pose lifts the forearm, the more the paint disagrees with gravity.
4. **If a sleeve must be raised often, fire it raised too** — a second forearm
   part, cross-faded by elbow angle. One more piece on the sheet, not a new plate.

## 5. The blend — where "smoother" comes from

The body is never switched to a pose. Every number in the pose is on a spring,
slightly under-damped, driven toward the current move's row (`agentRigStep`).
So a move change is a motion with its own follow-through at any frame rate, and
`rate` in the row says how hard it is driven: a strike snaps (24), a kneel
settles (6).

Three things are overlays, not pose numbers, because no row can hold them: the
**stride** (driven by the floor the body covers — `walkD` — like every walker,
never by the clock), the **breath**, and the **robe's sway**.

Do not shorten a wind-up to make a blend look snappier. The tell's length is
the fight's (`TELL_SWIPE`, `TELL_HEAVY`); the rig only draws it.

## 5a. The mix — what ships for the agents

*"mix them, rig for motion and plates for big poses."* The rig and the plates
are both right, about different frames:

| the frame | who has the body |
|---|---|
| standing, walking | the rig |
| the way INTO a big pose (wind-up, lunge, gather, the spent bow, the kneel) | the rig, from wherever the body was |
| the pose itself, once reached | its fired plate, faded in OVER the rig in about 70 ms |
| the first frame of the next move | the rig again |

`agentRigDraw` returns who has the body (`1` rig, `2` plate, a share between
0 and 1 while the plate fades in over the rig) and `drawSage` draws the plate
chain at that share. The rules that keep it honest:

- **The rig keeps stepping while the plate is shown**, so when the next move
  starts it leaves from the pose the plate was painted in.
- **The plate fades in over a solid rig**; the two are never both translucent
  (that reads as a ghost).
- **"Reached" is measured** (`AGENT_RIG_ARRIVE`), never a timer: a short
  wind-up that the rig has not finished stays on the rig.
- **A body met already settled** — a room entered, a harness probe — is met in
  its plate, not in a rig that never travelled there.
- `G.agentRig = 0` / `?rig=0` is plates only, `1` is the rig only. A test that
  measures the PLATES pins `0`; one that measures the rig pins `1`.

A character with no rig on disk is untouched: its plates draw as they always did.

## 6. Light is the engine's, and it stays inside the body

The plates paint a wind-up as ember on the hem and cuffs. On a rig that is
light, and light is the one kind of art the engine may make. Two rules:

- **No light round a body.** A glow laid over the cloth spills past its edge.
  Each hanging part has an EMBER copy — its own silhouette, clear at the top,
  amber toward the edge that hangs — added over it (`agentRigEmber`). The light
  cannot leave the cloth.
- **The tell must still rise.** `tests/artbible.cjs`'s rule holds for a rig: a
  wind-up shows more amber than the body at rest. The first rig failed it with
  eyes and a ring alone; the ember is what passed it.

Purified is the same parts recoloured (`sagePureWalkImage`) and cross-faded by
the pose's `pure`, so a body turns blue instead of being replaced.

## 7. Measure — `tests/agent-rig.cjs`

A rig is not "smoother" because it was built; it is smoother if these hold:

| claim | measured as |
|---|---|
| it can be switched off | `G.agentRig = 0`: the plates alone draw |
| the mix is the rig in motion and the plate in the pose | first frame of a move is the rig; the plate has the body within a third of a second; a whole body in every frame |
| it is the same character | head height within 12% of the plate, feet on the floor in every grounded move |
| moves are different bodies | hips drop in the crouch, the leap leaves the floor, the kneel is lower |
| it moves between them | no frame carries more than a quarter of a move (a plate carries all of it), and it has arrived in about half a second |
| the tell reads | more amber in the wind-up than at rest |

Then **photograph it beside the plates** — every move settled, and the motion
frame by frame — and send the owner the clip. He should not have to take
"smoother" on trust.

## 8. What to tell the owner, and what not to

- What one sheet cost, and what the plates cost.
- Where the rig is better (motion, new moves, credits) and where the plate is
  better (the single painted pose).
- For a new rig: that it is off, and how to turn it on. It is a proof until he
  says what to do with it — convert, keep the plates, or mix.
- For the mix: which characters have a rig at all. One parts sheet per
  character; a character without one is still all plates.
