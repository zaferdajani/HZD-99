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
