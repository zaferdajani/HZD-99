---
name: terrain-doors
description: The owner's standing orders on terrain, platforms, doors and roofs — no right angles, ground that is a real heightfield, decks only where they are the way up, machine ring gates on levelled pads, the roof law. Load before building or changing any room, tile grid, platform, step, door, gate, cave mouth or ceiling, and when the owner reports something about terrain, platforms, portals or being stuck in the ground.
---

# Terrain, platforms, doors and roofs

Moved from `CLAUDE.md` on 2026-11-17, unedited. These are standing orders, in
the owner's words, with what each one changed in the engine and the harness
that holds it.

## NO RIGHT ANGLES (owner's standing order, 2026-08-15)

**"No 90-degree elevation or walls in all game."** Nothing the player reads
as terrain may present a perfect vertical face, a perfect horizontal ledge
lip, or a square step — anywhere, not just in caves. Elevation changes are
OBJECTS (rocks, wrecks, mounds, roots) or eroded ground, never extruded
rectangles. The cave rule ("caves are never spheres, squares or
perpendicular") was the first statement of this; the owner has since made
it global. Consequences:

- `erodeCaveEdges` was the cave-only fix; the whole tile renderer needs the
  same treatment everywhere (edge scallops, corner breakup, face texture).
- A "step" in a room build is a placeholder for an object with an organic
  silhouette. New rooms must not add bare `rect(..., '#')` steps.
- ~~Collision may stay tile-based (the engine has no slopes); the RULE IS
  VISUAL~~ — **SUPERSEDED (owner, 2026-08-18).** "The curves are not about
  drawing lines or curved lines as much as an actual terrain structure that
  allows character to jump on or move on instead of a straight line." Keeping
  the collider square is what made this rule unfixable for weeks: every pass
  decorated a staircase the body still walked as a flat line, and a drawn hill
  she passes through is worse than no hill. The surface curve is now a
  HEIGHTFIELD the body stands on (`groundColumnAt` in game.js, applied in the
  vertical resolver in entities.js). It lifts ONLY where the curve rises above
  the tile top — real material was added there — and never lets a body sink
  below the square, because that is how a floor stops being trustworthy.
- Gates/doors: cave entrances look like CAVE MOUTHS — irregular rock
  openings — never rectangular doors; built gates vary in shape per zone
  (see ART_QUEUE briefs). Only the CITY gate is the huge epic multilayer
  monument.
- **A walk-in passage is a MACHINE RING** (owner, 2026-11-15, refusing outline
  arches drawn in light: "you end up with neon doors?... We are in a universe
  full of robots... something that looks like a Stargate"). Every depth door
  that is not a shop front, the city monument or a kingdom's guardian gate
  stands a fired ring plate with a real hole in it (`RING_GATE`,
  `drawRingGate` in js/game.js; ART_QUEUE §2bp). A cave's ring is braced INTO a
  rock mouth, so the line above still holds. The field in the ring is the
  engine's light and carries the state — live, gold for the errand's door,
  dead while buried. **Never mark a door with a drawn outline, arrow-arch or
  sign again**: a door is recognised by being an object. `tests/ring-gate.cjs`.
- **A ring stands on a LEVELLED PAD, apart from any other ring, and a ring a
  fight opens is WOKEN, not popped in** (owner, 2026-11-16: "two doors next to
  each other, superimposing"; "if the ground is elevated, it shows out of
  space"; "make it like a dormant door... the sage will activate it for me
  after I defeat it"). `levelDoorPads` (world.js) flattens the tiles under every
  ring and `buildSurfaceCurve` lays the curve flat across its foot on an S; a
  door row with `lock: <flag>` STANDS there dark and refuses her with its
  `lockLine` (use `lock`, never `need`, for a door a fight opens); when the flag
  is set `ringWakeStep` holds her controls, brings the freed guardian to the
  ring to roar at it, and raises the field (`RING_WAKE`, flag `rw_<room>><to>`).
  A ring must lead somewhere NEW: the A4↔GA1 ring is withdrawn once that
  chamber is finished. `tests/ring-pads.cjs`, `tests/ring-wake.cjs`.
- **A deck exists only where it is the way up** (owner, 2026-11-16: "platforms
  that do not make any sense... the floor is elevated there"). `platformHeadroom`
  (world.js) removes any `=` with one tile of air under it, or two where the
  floor rose under part of the same deck; a level two-tile step is authored and
  stays, and a room whose low deck is furniture says `decks: 1` (the den's
  table). Caves carry no carved shelves (`caveCarve`, `o.shelves`). A new room
  that adds a deck over raised ground fails `tests/ring-pads.cjs`.
- **The teeth do not teleport her** (owner, 2026-11-16: "When I dropped down, I
  actually went up... like a loop"). Spikes and the room's floor used to set her
  at `lastSafe` on the same frame; `hazardRescue` (game.js) closes the picture
  for a quarter of a second, sets her down, and opens it again.
- **Elevations, steps and obstacles MIMIC OBJECTS FROM THE ROOM'S
  BACKGROUND** (owner, 2026-08-15): a ledge in the city is a vent housing, a
  crate stack, a fallen sign — the same furniture the backdrop paints — so
  the platform feels like part of the room, not a block placed on it. Caves
  use rock; the Foundry uses slag and machine housings; and so on per zone.
  This binds both authored terrain plates (task #76 / ART_QUEUE §2) and any
  procedural stand-in.
- **The ground under the surface is ONE BODY, and its grass grows out of it**
  (owner, 2026-11-26, on an iPhone in W2: "It still looks like patches of
  square-shaped grasses stuck together instead of blending it with the
  surrounding and the next patch, especially when it's up and down"). Every
  pass that draws per TILE leaves the tile in the picture once the curve has
  moved the surface off the tile line: a lit band at each tile top, a step's
  face, a corner notch (a hole the backdrop shows through), a per-tile tone.
  So after the passes, `groundBandSteps` relays the band under the curve in
  the zone's own plate on a smooth, feathered lower line and cuts back what
  stands proud of the curve; nothing tonal is chosen per tile; the grass roots
  on the curve wherever its tile is the curve's ground and thins into the
  soil. A new pass that draws per tile near the surface must draw from the
  curve, not the tile line. `tests/ground-seamless.cjs` measures it on the
  finished frame at phone size.

## THE ROOF LAW (owner's standing order, 2026-08-24)

**"The roof should only exist if there is a continuation as another room on
top of this one... Not all of them needs a roof directly in the same frame.
It can be one or two frames above."** The walls order (seams) now binds the
lid: a ceiling pressed into the same frame with nothing above it is the same
doorway problem turned sideways. Two instruments in `js/world.js`:

- **`sky: 1`** — outdoors: no lid at all (`skyLid`), no ceiling plate, jumps
  rise past the frame and gravity is the ceiling. The meadow and the gantries
  carry it.
- **`air: N`** — indoors: the roof rises N rows above the authored space; the
  authored grid keeps its coordinates at the bottom of a taller frame, walls
  climb, the floor stays level with neighbors (air-aware side crossings in
  `applyTransition`). B6, the relay gallery, is the exemplar.

A room with a T exit HAS a continuation — its roof is load-bearing and stays.
Boss arenas resize with their own fights, per kingdom session, not by a
blanket pass. `tests/seam.cjs` carries the lid's amended law.
