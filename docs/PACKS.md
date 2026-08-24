# CAMPAIGN PACKS — the game as a platform

The owner's ask (2026-08-24): the StarCraft-editor economy for this game —
endless custom campaigns and DLCs, authored the same way everything here is
authored: by describing them to a session. This file is the contract that
makes that repeatable.

## What a pack is

A folder: `packs/<id>/pack.json`. Loading `index.html?pack=<id>` (or
`odyssey.html?pack=<id>`) lays its rooms over the built-in world at boot.

- **The base game never knows.** Without the query string, `js/packs.js` does
  nothing: no fetch, no changed behavior, every harness sees the shipped world.
- **A pack's save is its own.** The save key is suffixed `_pk_<id>`, so a
  campaign cannot bench the main save in a room that stops existing.
- **A broken pack degrades to the base game, loudly** — a refused room logs
  why. `tests/packs.cjs` measures all three promises.

## pack.json

```json
{
  "id": "demo",
  "title": "THE PROVING GROUND",
  "game": "clawbyte",
  "start": { "room": "P1", "x": 96, "y": 412 },
  "rooms": {
    "P1": {
      "zone": "A", "w": 40, "h": 17,
      "exits": { "R": "P2" },
      "ents": [["bench", 6, 15], ["scrap", 20, 15, 25]],
      "grid": ["<h strings of w tile characters>"]
    }
  },
  "map": { "P1": [0, 0, 1, 1] }
}
```

A room may also carry `"sky": 1` (outdoors: no lid, no ceiling plate — THE
ROOF LAW) or `"air": N` (indoors: the roof sits N rows above the authored
grid, which keeps its own coordinates at the bottom of the taller frame).

Rooms are exactly the `ROOMS` shape in `js/world.js` with the grid as data:
same tile characters (`#` solid, `.` air, `=` shelf, `^` hazard rail), same
`ents` tuples (`[kind, tileX, tileYFeetOn, extra?, condFlag?]` — enemy kinds
from `EKIND`, plus `bench`/`scrap`/`chest`/`term`/`plat`/`saw`/`boss`/…),
same `exits` (`L/R/U/D` to a room id), `map` cells in `MAPPOS` form. `zone`
picks the palette, backdrop, ceiling and flora of an existing kingdom.

## The laws still bind

A pack is authored content, and the sessions authoring one hold it to the same
rules as the shipped world — the harnesses that measure the base game are the
checklist:

- **Seams agree on both sides** (tests/seam.cjs's law): a row open on the side
  she leaves and solid where she arrives puts her inside rock. The packs
  harness measures the demo's seam; author packs to the same rule.
- **NO RIGHT ANGLES**: elevation is heaps and objects, one tile per column of
  rise, grounded at both feet — never bare `#` rectangles (see
  `packs/demo/pack.json` P2 for the shape of it).
- **Every campaign has a bench** (`start` should stand near one).
- **Art is Higgsfield's.** A pack that needs new characters, structures or
  plates puts briefs on `docs/ART_QUEUE.md` like everything else.

## Custom 3D models as characters — tools/bake3d.cjs

```
node tools/bake3d.cjs <model.glb> <subject> [--class=atlas|npc] [--cell=512] [--pitch=0]
```

RULE ZERO for characters: the master is a real mesh — from Higgsfield
`generate_3d`, or any model the owner authored — and the shipped sheet is
DERIVED. The bake renders the GLB the way the roster atlas was rendered
(locked orthographic camera, key light fixed to the WORLD, the subject
rotating one yaw per column: 8 columns for a class C creature, 6 for a class D
NPC), grounds the feet on the cell floor, emits
`assets/characters/<subject>_<n>yaw.png`, and archives the master under
`assets/source/<subject>/` (ART_BIBLE §7).

Baking is mechanical; wiring is a decision — the tool prints the `ATLAS.sub`
entry to add, and the crush/lowres/build steps. `tests/bake3d.cjs` proves the
bake stays honest: cells populated, feet level, silhouettes apart, a rotation
rather than a mirror.

## THE FORGE — the owner's editor (forge.html / forge-odyssey.html)

The editor is the running game with the owner's chrome on it. It ships as two
extra pages `build.cjs` emits (never packaged into the app), opened at the
live link `/forge.html` behind a passphrase. The gate keeps players out; the
REAL lock is that the Forge can publish nothing — it edits the browser's own
copy over a pack, autosaves the draft to localStorage, and EXPORTs pack.json.
Only a git push changes what anyone else plays.

- **The prompt console is the primary interface.** The owner describes the
  change; Claude (`claude-opus-5`, called with the owner's own API key, pasted
  once under KEY and kept in that browser only) answers with structured ops
  the page applies to the live world. The op grammar is in `js/editor.js`
  (`contract()`): tiles, heaps (the no-right-angles rise), entities, exits,
  rooms, dialogue, NPCs, start, title.
- **Direct manipulation covers the rest**: SELECT / PAINT / PLACE modes on the
  game canvas, an entity list, FREEZE to stop the simulation while editing,
  F2 hides the chrome.
- **Main-game rooms edit exactly like DLC rooms**: touching one snapshots it
  into the working pack, and the pack overrides it by id — so the export is
  equally a new campaign or a patch to the shipped scenario. Rewriting a main
  character's conversation is one `dialog` op (pack `i18n` overrides).
- **Custom characters**: the `npc` op gives an identity a borrowed body
  (`npcBody` cloning an existing atlas row) with its own name and lines; a
  truly new body comes from a mesh through `tools/bake3d.cjs`.
- The Forge plays on its own save key and its pages never carry the editor
  into `index.html`/`odyssey.html` — `tests/forge.cjs` measures the gate, the
  ops, the click mapping and the isolation.

## The DLC loop

1. Owner describes the campaign to a session (rooms, cast, story, twist).
2. The session writes `packs/<id>/pack.json`, validates against the harness
   laws, and queues any new art on THE FIRING LIST.
3. Custom characters arrive as meshes and go through `bake3d`.
4. `node build.cjs && node tests/run.cjs packs` — then push. The pack is live
   on the same link with `?pack=<id>`, on every platform (`pack-www.cjs`
   ships `packs/` into the app — RULE ONE).
