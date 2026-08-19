# THE DRAWN CAST — a style branch, not a fork

**Why this exists.** The owner asked for two versions of the game to choose
between: the cast as it ships today (3D renders) and the cast redrawn by hand,
Hollow Knight's craft applied to our own characters. This branch holds the
second one.

**IT CONTAINS ART ONLY.** No code change, no gameplay change, no engine
divergence — same build, same rooms, same collision, same tests. That is a
deliberate constraint against the ONE BRANCH order in CLAUDE.md, which exists
because a side branch once cost a full merge with conflicts in both built pages.
Keeping the code identical means choosing a winner is a FILE COPY, not a merge:
either the drawn sheets replace the rendered ones at the same paths, or this
branch is deleted and nothing else has to be unpicked.

**The geometry contract from ART_QUEUE §1f binds every plate here:**

| family | sheet | rule |
|---|---|---|
| the protagonist | 22-cell state sheet + 8-yaw turnaround | the cell grid is addressed by INDEX — same cell, same size, same footprint on the floor line |
| the guardians | six parts atlases | addressed by ABSOLUTE PIXEL RECT. A part that moves 3px dislocates the rig. Re-fire PART BY PART, back into its own rect |
| NPCs + creatures | npcs / roster atlases | same cell-grid rule as the protagonist |

**And her eyes stay unbaked** (ART_BIBLE §2). Two lights carry every expression
she has; a baked expression gives her one face per pose forever. Every drawn
cell goes through `tools/heroeyeclean.cjs` after placement, and the order
matters — place, re-measure anchors into `tools/heroeye.json`, THEN clean. Run
against a stale anchor it once painted over her scarf.

## The hero, fired — style A (broken ink), 2026-08-18

The owner picked **A** from the three-hand trial: a fine dark contour that
BREAKS — thickening on the shadow side, tapering to nothing on the lit side —
over three or four flat steps of value, matte with a dry-brush grain, the red
scarf the one saturated note.

All 22 state cells are fired and keyed: `assets/source/hero/drawnA/`, and the
sheet to judge them by is `docs/drawn_hero_styleA.png`. They are NOT placed
into `assets/characters/hero/states.png` yet — that waits on the owner's word,
and then the order is: place → re-measure anchors into `tools/heroeye.json` →
`tools/heroeyeclean.cjs`.

**What the firing taught, so the rest of the cast does not re-learn it:**

- **Framing must be the loudest line, and it still drifts.** Pass 1 zoomed
  `rise` and `apex` to twice their neighbours' scale. Anchor scale is not
  something to argue with a generator about — normalise it at composite time
  against the source cell's own bounding box.
- **The field cannot be won by prompting.** Told "flat black, no ground", the
  model paints an ink wash; told it louder, it paints a WHITE PAPER BORDER with
  a brushed black rectangle inside. Pass 2 was worse than pass 1 on exactly the
  thing pass 2 was fired to fix. Stop negotiating and key it.
- **The style fights the keyer, by design.** A contour that deliberately breaks
  is a doorway: a border-in flood walks through the gap and eats the torso while
  the outline survives. `tools/inkkey.cjs` closes what is boxed in on all eight
  sides — the colour is still in the plate, only the alpha was wrong.
- **"Biggest component" is not "the character".** The FINISHER pose keys into
  1205 pieces, the largest of them 58k px — one half of her cape. Spatter is
  what is small AND clear of the mass; either alone is innocent.

Three tools landed with this and are branch-neutral — they belong on the main
branch whichever cast wins: `tools/contact.cjs` (a labelled contact sheet of any
plate directory), `tools/inkkey.cjs` (the keyer above), `tools/alphastat.cjs`
(coverage, subject box, and whether the frame border survived the cut).

## The rest of the cast, fired — 64 plates, 2026-08-19

Every enemy, every machine, the duelling sage and all seven NPCs are redrawn in
the same broken-ink hand: `assets/source/cast/drawnA/`, judged in
`docs/drawn_cast_beasts.png` and `docs/drawn_cast_rest.png`.

| family | plates | what it is |
|---|---|---|
| alpha | 10 | the armoured pack leader |
| cheetah | 7 | the fast one |
| wolf | 7 | the pack |
| bat | 5 | the ceiling |
| breaker / kiln / rime / snare | 12 | the four machines |
| sage | 6 | the duellist that can only be cleansed |
| eye | 10 | the Eye's five, each in rest and wind-up |
| npc | 7 | the busts and Ratchet at his bench |

**The telegraph amber survived the restyle, and that was the point.** These
plates are not decoration: `tests/artbible.cjs` measures that a wind-up raises
the amber above that creature's own rest, because it is how a player reads what
is about to hit them. A style pass that says "desaturate everything" silently
deletes the game's warning system. So every prompt carries the lights as an
explicit EXCEPTION to its own colour rule, named per plate — the amber blaze on
a wind-up, the red seams on a resting body, the cold blue on the frost machine,
and, on `alpha_free`, `kiln_spent` and `snare_limp`, an equally explicit
instruction NOT to add a glow those poses do not have.

**What the cast pass added to what the hero pass taught:**

- **The model draws graphic furniture.** Black wedges, bars and triangles behind
  the subject, and floating chips of debris beside it. No keyer can tell those
  from the creature's own dark plate — they are drawn, not field — so they have
  to be banned in the prompt, and six plates were re-fired to do it.
- **One keyer setting does not fit every plate.** The walk tolerance that cuts a
  dark beast cleanly hollows out a pale robe, and the one that keeps a pale robe
  whole leaves a wedge attached to a dark machine. `tools/inkkey.cjs` takes the
  step as an argument for exactly this: 11 for pale subjects (the sage standing,
  Servo, Lumen), 20 by default, 32 where a dark shape needs reaching into.
- **Fragment count is not a defect signal.** `finisher` keyed into 1205 pieces
  and `wolf_runb` into a handful; both were whole afterwards. What matters is
  whether the pieces are near the mass, not how many there are.

**One plate still needs a hand: `npc__servo`.** Fired three times, including
once with the composition rule as the loudest line and a demand for margin on
all four sides, and it comes back with the chin running off the bottom edge
every time. Everything else in the set framed correctly.

## The guardians — NULLFANG done, and how the rig is kept, 2026-08-19

A guardian is not a picture, it is a RIG: `BEAST_P` and its five siblings
address the atlas by absolute pixel rect, and a head that comes back four
pixels taller is not scaled — it is drawn from the same rect, and the animal
comes apart at the neck. No prompt can promise that. So the promise is made
mechanically instead, by two tools:

- **`tools/rigcut.cjs`** reads the rect table out of the source itself (never a
  copy that can drift), cuts each rect onto flat black with padding, and
  records the part's own outline.
- **`tools/rigpaste.cjs`** puts each restyled part back by FITTING ITS BOX to
  the box the original occupied, then CLIPPING IT to the original silhouette.
  Whatever the generator did to scale, position or outline is undone. The cost
  is that the new ink contour lands a pixel inside the old edge instead of on
  it; that is invisible at play size, and a leg four pixels out is a broken boss.

Both tools MEASURE what "empty" means on the sheet rather than assuming it —
some of these atlases are alpha-cut and some are opaque with black between the
parts, and guessing wrong fails in opposite directions: an alpha test on an
opaque sheet marks every pixel as part, and a tone test on an alpha sheet eats
every dark plate the creature has. Getting this wrong the first time put an
opaque black box around all sixteen of NULLFANG's parts.

**NULLFANG is done and verified in the game**, not on the sheet:
`docs/drawn_nullfang.png` is its own `draw()` in its own room, in four states.
`tools/bossshot.cjs` takes that photograph, and draws to a bare canvas rather
than screenshotting the room — the first version photographed the room and
produced four frames of a tutorial panel with the boss behind it.

Green afterwards: `artbible`, `tells`, `daze`, `bosspace`, `lowres`, `platform`.
The lowres harness matters most here — it re-derives, from the source, that no
sheet addressed by absolute pixel rect gets a small copy, and it still names
all six guardian files.

Fragments restyle less reliably than whole figures, and that is worth knowing
before the next five: `full`, `aIdle`, `aWalk`, `aRoar` and `aAtk` came back
excellent, while `body` was returned as a small whole lion and `fleg0` as a
cylinder. The box-fit and the clip make even those usable, because what
survives is the surface, not the shape.
