# TERRAIN SOURCES — where the silhouette grammar's techniques come from

The owner's order (2026-08-17): improve the terrain silhouette grammar by
searching repositories and libraries that inform perspective on game terrain
and killing linear surfaces. Same contract as `MOVEMENT_SOURCES.md`: **we take
the TECHNIQUE — the idea, the construction, the numbers — never the code and
never the assets.** The game ships no packages (CLAUDE.md, Style); everything
below is re-derived in vanilla JS inside `js/game.js`, and each entry records
what was taken, what was refused, and why.

The enforcement lives in `tests/grammar.cjs` (ART_BIBLE §9/§10) — it measures
the ASSEMBLED FRAME, and every technique here was adopted or rejected against
its numbers, not against taste.

## 1. fBm / fractal value noise — ADOPTED (re-derived, ~12 lines)

- **Sources:** Auburn/FastNoiseLite (MIT; JS port on npm), josephg/noisejs,
  joshforisha/fractal-noise-js, Red Blob Games "Making maps with noise
  functions".
- **What was taken:** the construction only — octaves of smoothly
  interpolated lattice noise, summed with halving amplitude and a
  non-integer lacunarity (2.3) so octaves never phase-lock. Implemented as
  `fbm1(x, seed)` on the game's own `hash2` lattice.
- **The measured lesson that forced it:** the crest and erosion passes
  varied their depths with PER-PIXEL hash noise, and the grammar harness
  still measured the floor as an 800px ruled line. **White noise has a flat
  mean** — jitter every pixel ±3px and the statistical edge is exactly
  straight. What breaks a line is low-frequency wander with detail on top,
  which is fBm's whole construction.
- **Second measured lesson:** summed octaves bunch around 0.5 (they are an
  average), so the raw output whispered ±1px around its mean — a ruler with
  fuzz, again. The output is contrast-stretched ×2.1 about the centre.
- **Where it now runs:** the erosion wave that sinks every exposed top face
  0-10px (`erodeCaveEdges`), the crest depth (`edgeGrammarPass`), the wall
  edges, the first-buried-row shade boundary (`drawTiles`), the fringe
  baseline and rime pooling (`buildFringe`), and the platform decks' long
  edges (`drawPlatformRuns`).

## 2. Per-instance stochastic variation — ADOPTED

- **Sources:** Inigo Quilez, "texture repetition" article; the standard
  per-tile offset/mirror treatments discussed across gamedev forums; Wang /
  stochastic tiling literature.
- **What was taken:** the idea that identical stamps are what the eye (and
  the autocorrelation detector) locks onto, and that a hash-driven source
  offset per stamp breaks the lock at zero asset cost. Applied to the
  platform decks: every mid slice samples a wandering window of its plate,
  so no two decks — and no two slices — are the same pixels.
- **What was refused:** IQ's full blend-of-two-samples (needs a second
  texture fetch and a blend per pixel — a shader technique; the tile layer
  is a one-time canvas render and the simple offset already breaks the
  match), and Wang tile sets (an authored-asset commitment that belongs to
  the art session if it is ever wanted).

## 3. Marching squares + contour smoothing — RECORDED, NOT ADOPTED

- **Sources:** the Godot destructible-terrain family (richardhyy,
  milesturin, belzecue), BorisTheBrave's marching squares/cubes tutorials,
  Phaser destructible-terrain (xjxxjx1017).
- **What they offer:** a true continuous silhouette — trace the solid mass's
  contour, smooth it (interpolated marching squares / Chaikin corner
  cutting), draw the polygon instead of tile edges. This is the full-strength
  version of ART_BIBLE §10.1's two-mesh separation.
- **Why not now:** the erosion + fBm + grammar passes already operate on the
  cached tile canvas and pass 4 of the 5 sampled rooms with zero straight
  runs; a contour renderer would replace the whole tile-face pipeline for
  marginal measured gain. **Revisit trigger:** if a future zone wants
  genuinely curved terrain (slopes the eye must read as slopes), or if the
  residual D3-class segments (~100-160px, see §5) resist two more passes.

## 4. Reference-game edge reading — ADOPTED VIA ART_BIBLE §10

The Lost Crown / Hollow Knight reading is already codified in ART_BIBLE
§10.2-§10.4 (the sibling session's work): long machined runs are legal ONLY
decorated — lit lip, material body, broken skirt — and no bare 90° corner
survives. The passes above are the mechanical enforcement of that reading;
nothing new was taken from outside beyond what §10 already recorded.

## 5. State after this pass (measured, 2026-08-17)

Baseline → now, `tests/grammar.cjs` over A0/A1/B4/C3/D3:

- longest straight run: **896px → ~160px** (D3)
- bare long edges: **14 → 3-6** (all D3, all ≤164px; the count breathes
  because GLACIERE animates through the measured band)
- bare 90° corners: **0 → 0** (held)
- tile repeats: real matches only, best Δ2.6-2.8 against a threshold of 3
  (B4 — the two clean decks; per-slice jitter shipped, borderline remains)
- three-plane value law and background desaturation: green throughout

The harness itself took three measurement corrections in the same commit,
each documented inline: the repeat band must sample CONTENT (a void cannot
repeat), the decorative viewport bezel is UI and not terrain, the lip
detector must recognise crests of any legal thickness and the crest's own
air-side edge, and the ground has no underside for the skirt law to bind.
The harness stays `pending` in tests/run.cjs (tied to #76) until the D3
residue and the B4 borderline are gone and the count stops breathing.

## 6. PER-KINGDOM TERRAIN THEMES (owner's spec, 2026-08-17)

The §10 grammar shipped as ONE grammar — the same wave, crest and hang in all
six kingdoms. The owner's second terrain spec names that as the defect: the
silhouette stopped being straight everywhere at once, and became uniform,
which is its own kind of flat. `TERRAIN_THEME` in `js/game.js` now gives each
kingdom its own numbers and its own decoration, and the three §10 passes read
from it:

| zone | rough | lip | skirt | crack | crest grows | hang is made of |
|---|---|---|---|---|---|---|
| A Meadows   | 6  | 4 | 12 | 0.30 | neon glow      | plates   |
| B Conduits  | 8  | 5 | 18 | 0.50 | crystal teeth  | roots    |
| C Foundry   | 10 | 6 | 20 | 0.40 | molten seams   | slag     |
| D Archives  | 7  | 5 | 16 | 0.20 | icicles        | frost    |
| E Nest      | 12 | 4 | 24 | 0.80 | infected red   | tendrils |
| X Cache     | 5  | 3 | 10 | 0.15 | prism glints   | glass    |

**E and X were swapped in the first version of this table, and the sibling
session caught it in play.** The owner's spec names its zones ZIZT (arc prism
facility) and VIZRR (the void) — a zone list from another game. In THIS world
E is the Virus Nest (`ZONE_LIGHT`: infection red) and X is the Crystal Cache
(prism glow), so the table was giving the Nest cracked glass and the Cache
hanging flesh. The lesson is the one this file already states for code and
assets, now extended to lore: **take the technique from a brief, never its
world.** A pasted spec's zone names, palette labels and enemy names are about
whatever game the brief was written against; the repo is the authority on
this one.

**Two deliberate departures from the spec, both recorded where they are made:**

1. **The crack test is hashed, not `Math.random()`.** The spec's version
   re-rolls on every call; the terrain draws into a CACHED layer that
   re-renders on room load and quality change, so a random test would crack
   the world differently every rebuild — the exact flicker the per-room seed
   exists to prevent. `hash2(tx, ty)` gives the same crack in the same tile
   forever.
2. **The decoration is baked, not per-frame.** The spec paints crest and
   skirt detail in the draw loop, some of it animated off
   `performance.now()`. This engine renders terrain once per room into
   `tileCv` and blits it, so all of the above costs nothing at frame time —
   which is also why the animated variants (pulsing flesh, flickering molten)
   are painted as static state rather than as animation. If a kingdom ever
   wants a genuinely breathing edge it belongs in a per-frame overlay pass,
   not in the cached layer.

Measured after the theme pass: bare long edges 3 → **2** (both D3, ≤152px),
corners 0, §10.7 green in all five sampled rooms, all 45 harnesses green.

## 7. THE FLOOR ROLL — measured before it was believed (2026-08-17)

The owner's report: the floor is a flat bar in every kingdom. Measured first,
on the CACHED TILE LAYER directly (no lighting, no fringe, no backdrop — just
where the drawn rock starts, per column, across 860px of floor):

| room | sd of surface height | range | longest run at ONE height |
|---|---|---|---|
| A1 | 3.66px | 12px | 23px |
| C3 | 4.66px | 25px | 24px |
| D3 | **1.28px** | **5px** | **96px** |

So the report was half right in a way that matters: A1 and C3 genuinely roll,
and **D3's floor genuinely was a bar** — which is also the room that has been
failing §10.2/§10.3 all along. Two findings came out of the fix:

**1. The obvious fix is wrong, and the spec asking for it does not say why.**
"Deepen the erosion wave" cannot work: erosion only REMOVES. Sink the drawn
surface 10px into a dip and the collider stays where it was, so the player
crosses that dip standing 10px above the floor she can see. So the roll is
built UPWARD from the collision line instead — each exposed top column copies
a strip of the tile's own face up by an fBm height, making the collision line
the FLOOR of the roll rather than its middle. The player is never above the
drawn surface, at worst slightly bedded into it, which is how a real figure
stands on real ground. §10.1's two-mesh separation, used in the one direction
that is safe for gameplay. No collider changed.

**2. Wavelength, not amplitude, is what makes a floor read as a bar.** At
fbm1's base period (~61px) a smooth wave is nearly level for tens of pixels
around every crest and trough — which is exactly where the 67-96px dead-flat
stretches were coming from. Sampling ~2.4× faster puts a full rise-and-fall
inside ~25px, with a slower term mixed under it so the ground rolls instead
of corrugating.

Measured after: longest flat run **A1 67→27px, C3 71→24px**. **D3 is still
96px and is NOT fixed** — its floor row is structurally identical to A1's
(same chars, same two rows), so the cause is zone-specific and not yet found.
It is the same room as the residual §10.2 failures. Next session takes the
D3 floor specifically, with the profiler above as the instrument.

### §7 FOLLOW-UP: D3 solved by the sibling session (2026-08-17)

The Archives floor left open above — sd 1.28px, a 96px stretch at one exact
height — was found and fixed by the sibling ("the ground floor rolls too, and
the seam that was hiding it"). Re-measured with the same profiler, on the
merged tree:

| room | sd before | sd after | longest flat run before → after |
|---|---|---|---|
| A1 | 2.11px | 13.28px | 27 → 28px |
| C3 | 3.48px | 15.03px | 24 → 64px |
| D3 | **1.93px** | **12.57px** | **96 → 22px** |

**A measurement note worth keeping, because it nearly produced a false
alarm:** the first re-measure reported every room clamping at exactly -20px
with flat runs jumping to ~105px, which reads like a hard clip flattening the
tops of the roll. It was not the renderer — -20 was the profiler's own scan
window, which started 20px above the tile line and could not see a surface
that now rises further than that. Widening the window to 48px produced the
table above. The instrument needed re-ranging before its output meant
anything; a profiler that saturates reports a plateau that is entirely its
own.

## 8. THE D3 CREST, AND FOUR FALSE POSITIVES OF ONE SPECIES (2026-08-17)

Chasing the last red in the suite produced three fixes, one instrument
upgrade, and one recorded dead end.

**Fixed in the renderer.** The surface roll (§7) lifts ground by up to ~13px,
but the crest pass searched for the surface only 6px above the tile line. On a
raised column it found rock at once and painted the lit lip SIX PIXELS INSIDE
the mass, where nothing can see it — a bug introduced by the roll itself. The
search now starts 28px up, clearing the deepest roll any kingdom asks for. The
sub-crest shadow also scales with the crest's own luminance now (30% on dark
rock, up to 48% on the Archives' near-white ice), because a lift has nowhere
to go on a face that already clamps at 255 — the STEP is what reads.

**Fixed in the harness.** `grounded` asked a luminance scan to find the bottom
of a mass, and the floor's own new texture — roll, shade, fractures — stopped
that scan mid-body, so real ground read as a hanging slab and was failed for
lacking an under-hang it cannot grow. It asks the GRID now: a column solid to
the last row of the room is ground. And every failure names the edge and what
it owes (`160px@y475 NO-LIP (grounded)`), because a count tells you the frame
fails without telling you whether to go and fix a crest or a hang.

**Made repeatable.** The count breathed 0-3 bare edges on identical code.
Freezing the clock was not enough — a guardian's POSITION depends on how long
the room took to load — so the cast now leaves the shot for a terrain
measurement, as the speech panel already does. Removing GLACIERE made the
failure *consistent*, which is the better outcome: it had been covering the
defect.

**The dead end, kept so it is not repeated.** Routing the §10 detectors at the
terrain layer instead of the composited frame looks obviously right and is
not: their thresholds are calibrated against the GRADED frame, and on raw
terrain pixels the same numbers reported 30 of 39 edges bare across all five
rooms. Reverted; the layer is still handed over, for diagnosis only.

**What remains, with evidence.** D3 keeps two edges (~160px and ~97px, both
NO-LIP, both grounded). The crest there is provably DRAWN — sampled out of
`tileCv` at 60/57/51 where the composited frame reads 26 — and what sits over
it is the lair's ice sheet. That is scenery in front of ground, the fourth
false positive of the same species as the speech panel, the viewport bezel,
and the boss. The floor itself rolls: D3 sd 12.4, longest flat run 22px. The
harness keeps its `pending` flag until prop occlusion is excluded the way the
other three now are.

## 9. THE THING THAT WAS ACTUALLY WRONG (2026-08-18)

Eight sections of this file are silhouette theory, and the defect the owner kept
photographing was not a silhouette defect at all. It was one line in
`buildSurfaceCurve`.

The ground curve found a column's surface as **"the first solid OR platform
below the ceiling"**. Under a mid-air `=` deck — D3 has two, B4 has one, most
rooms have several — that returned the DECK's height as the ground height of
the columns beneath it. The ±1.5-tile ramp then blended that height into the
real floor on both sides, and `surfaceCurvePass` built the ramp as material.

What that draws is a **table**: the deck as a top, two solid legs sloping from
its ends down to the floor, and an untouched rectangle of backdrop between them.
It is in no collision grid, she walks straight through it, and the inner faces
of the two legs are the straightest vertical edges in the room. Every "flat
boxes on the floor" report was this.

The fix is `surfaceOf(tx)`: a platform is this column's surface only when there
is ground within a tile underneath it — a LIP on the terrain, which is the case
the `soft` branch was written for. A deck in mid-air is drawn by
`drawPlatformRuns`, which owns its own crest and skirt, and the ground curve now
walks underneath it without seeing it. `buildSurfaceCurve` also returns the
surface array it computed, because the pass used to recompute its own with a
different definition of solid, and the sign of their disagreement decided
whether material got added or cut.

**Three more followed from looking at the picture instead of the metric:**

- **The fringe was on the wrong horizon.** Snow crusts, blades and slag lumps
  were rooted on the TILE LINE plus a small sink, while the curve lifts the
  drawn silhouette up to 46px above it. Two ground lines, one rolling and one
  ruled, and the eye finds the ruled one. `buildFringe` now samples the curve.
- **The added mass ended in a 22% black step exactly on the tile line**, where
  the body below it carried none — so it read as a shadow lying on the floor
  rather than as floor. The depth gradient now fades to nothing at the join.
- **The added mass stopped at the tile line**, leaving `drawTiles`' own lit
  12px walking-surface band showing underneath the new crest: a second
  ruler-straight highlight one tile down. It now paints 16px past the line.

**And two things the harness was measuring that were not there.**

`tests/grammar.cjs` welded the floor left of D3's three-tile hole, the depth
door drawn down inside the hole, and the floor right of it into one 160px "flat
run", then failed it for carrying no crest — because a third of its length was
a door. Runs are now clipped to the walk-top spans the grid reports, and each
surviving piece is judged on its own length. Two short real edges and a prop
between them are not one long edge, and no amount of drawing on the floor could
have satisfied that measurement.

The tile-repeat failure that kept moving between B4 and C3 was real and was
`drawDepthPlane`: the authored plate is stamped along the room at its own width,
and in the Foundry that width is 868px — inside one screen. Alternate stamps are
now mirrored, which doubles the period past a screen and cannot open a seam,
because a mirrored copy meets the one before it along the same edge pixels.

`tests/grammar.cjs` is green and its `pending` flag is off.
