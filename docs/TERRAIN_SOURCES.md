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
| E Nest      | 5  | 3 | 10 | 0.15 | prism glints   | glass    |
| X Deep      | 12 | 4 | 24 | 0.80 | infected red   | tendrils |

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
