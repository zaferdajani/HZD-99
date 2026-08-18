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
