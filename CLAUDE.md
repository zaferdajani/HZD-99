# CLAWBYTE / NOSTOS — working notes

## ONE BRANCH (owner's standing order, 2026-08-15)

**Every session working on this game — code sessions, art sessions, all of
them — commits to the SAME branch: `claude/clawbyte-repo-migration-byhyl8`.
No forks. No side branches. The two sessions are one.**

The last side branch cost a full merge with conflicts in both built pages;
the owner's ruling ends the pattern. The protocol that replaces it:

1. **Before starting any work:** `git pull --rebase origin
   claude/clawbyte-repo-migration-byhyl8`. Always. A session that skips the
   pull is editing a game that no longer exists.
2. **After every commit:** push immediately — `git push origin
   claude/clawbyte-repo-migration-byhyl8`, then mirror the same commit to
   `main` and `odyssey` (`git push origin <branch>:main <branch>:odyssey`).
   Small frequent pushes; the other session may be minutes behind you.
3. **If the push is rejected** (the other session pushed first): pull
   --rebase, re-run `node build.cjs && node tests/run.cjs`, push again.
   Never force-push; never resolve by branching.
4. **Built pages are never hand-merged.** On any conflict in `index.html` /
   `odyssey.html`: take either side, run `node build.cjs`, commit what it
   emits. The sources are the truth; the pages are output.
5. `docs/ART_QUEUE.md` stays the coordination ledger — what is fired, what
   is wired, what is next — so the sessions never fire the same brief twice.

The retired branch `claude/art-queue-section-1-fire-yqlyc0` is fully merged
and must never receive another commit.

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
- Collision may stay tile-based (the engine has no slopes); the RULE IS
  VISUAL: the drawn silhouette must bury the square underneath it.
- Gates/doors: cave entrances look like CAVE MOUTHS — irregular rock
  openings — never rectangular doors; built gates vary in shape per zone
  (see ART_QUEUE briefs). Only the CITY gate is the huge epic multilayer
  monument.
- **Elevations, steps and obstacles MIMIC OBJECTS FROM THE ROOM'S
  BACKGROUND** (owner, 2026-08-15): a ledge in the city is a vent housing, a
  crate stack, a fallen sign — the same furniture the backdrop paints — so
  the platform feels like part of the room, not a block placed on it. Caves
  use rock; the Foundry uses slag and machine housings; and so on per zone.
  This binds both authored terrain plates (task #76 / ART_QUEUE §2) and any
  procedural stand-in.

## RULE ZERO: author at full quality, DERIVE everything cheaper

**Never author down. Make the good version once, and let a tool in `tools/`
produce the small one — automatically, reproducibly, from the master.**

The owner's standing instruction, and it is the cheapest way to work as well as
the best-looking: taste and effort go in once, and every platform after that is
a script. The alternative — deciding at authoring time that a phone will not
need the detail — is a decision that cannot be undone and has to be re-made
every time a new platform appears.

The masters are the archive; the shipped tiers are generated:

| what | master | derived tier | tool |
|---|---|---|---|
| art sheets | `assets/characters`, `assets/backgrounds`, … | `assets/lowres/` — 0.55 MB for 24.2 MB | `tools/lowres.cjs` |
| films | `assets/video/*.mp4` | `assets/video/light/` — about half | `tools/lightvid.cjs` |
| rendering | the full effect stack | the quality dial: resolution, ceilings, weather, glow, bloom | `js/perf.js` |
| generation plates | `assets/source/` — 11 MB, never shipped | the composited sheets | `tools/*.cjs` |

Consequences that bind every change:

- A new heavy asset is not finished until its cheaper tier exists. Regenerate
  with `node tools/lowres.cjs && node build.cjs` after any art change.
- The engine never assumes it has the good version. Every renderer already
  guards on "the sheet is not here yet"; a derived tier is the same situation.
- **The one exception is measured, not assumed**: six guardian parts atlases are
  addressed by absolute pixel rect and must have no small copy.
  `tests/lowres.cjs` re-derives that from the source rather than trusting a list.
- The delivery path this feeds is `docs/DELIVERY.md`. Read it before changing
  how anything reaches a device.

**Multi-platform is the target, not an afterthought**: browser and phone first,
desktop (Steam) next, console possible later. Every tier above exists so that
adding a platform is a configuration decision rather than an art project.

## RULE ONE: every platform gets the same game

**Web page, mobile web, the Capacitor app, the desktop shell — one build, one
game, updated together. No change ships to one and not the others.**

This is the highest rule in this file. It is not a preference; it is the thing
that decides whether "I fixed it" means anything.

It is already true STRUCTURALLY, and that is on purpose: `build.cjs` emits
`index.html` + `odyssey.html`, and every platform consumes those two files.
`tools/pack-www.cjs` copies them into `www/` for Capacitor; `tools/pack-desktop.cjs`
stages `www/` for the desktop shell; `sw.js` is a runtime cache with no
precache manifest, so there is no list of files to keep in sync. `www/` is
generated and untracked — it can never be stale in git because it is never in
git.

So the ways this rule actually gets broken are narrow, and they are what
`tests/platform.cjs` checks every run:

- **An asset the game references that the packer does not copy.** The packer
  walks the whole `assets/` tree with no allowlist, which is the safe default —
  an allowlist is a list somebody has to remember, and forgetting it means a
  new file silently missing on Android while the web build is fine.
- **A page difference that is not one of the two deliberate ones.** The app
  strips the service-worker registration (inside a package there is nothing to
  be newer than) and nothing else. Any other divergence is a bug.
- **Input.** Keyboard, gamepad and touch are three paths to the same actions;
  a feature reachable by only one of them is broken on the platforms that lack
  it. Every new screen needs a touch hit-box derived from its own drawing (see
  `tests/tap.cjs`) and a pad binding.
- **Weight.** `assets/source/` is the generation archive, 11 MB that nothing
  loads. It is excluded from the package by name.

After any change that touches assets, pages or input: `node build.cjs && npm
run app:pack && node tests/run.cjs`.

Two games, one engine. `index.html` is CLAWBYTE (robo-cat, machine city);
`odyssey.html` is NOSTOS (the hero's world). Same code, hard-locked to one
world each by `window.GAME_LOCK`; `isHero()` is the switch.

Live: https://zaferdajani.github.io/odyssey/

## Commands

```bash
node build.cjs                 # the whole build. Emits index.html + odyssey.html
npx http-server -p 8220 -s &   # the tests need the repo served here
node tests/run.cjs             # every harness (see tests/run.cjs for the list)
node tests/run.cjs saw wake    # or just some
npm run app:pack               # assemble www/ for the native shell
npm run app:sync               # ...and push it into android/
```

## How the build works, and why it matters when editing

`build.cjs` **concatenates** `js/*.js`, in the order of the `files` array, into
one `<script>` inside each page. Consequences that will bite you:

- **One shared scope.** A `const` or `function` in `entities.js` is visible in
  `game.js`. There are no modules and no `import`/`export` — adding one breaks
  the build.
- **Name collisions are silent until they aren't.** Two files declaring the
  same `const` throws `Identifier has already been declared` and the *entire*
  script fails to parse — the game boots to a black page with one console
  error. This has happened twice. `node --check js/<file>.js` after editing,
  and `node build.cjs` before believing anything.
- **Order matters for top-level execution, not for functions.** Function
  declarations hoist across the whole concatenated file, so `game.js` may call
  something defined later in `touch.js`. Top-level `const` does not: it is in
  the temporal dead zone until its line runs.

Assets are **not** inlined. `build.cjs` scans `assets/music`, `assets/video`
and `assets/vox` and hands the page a manifest, so adding a track is: drop the
file in, rebuild. Nothing in code may name a file that is not on disk.

It also compiles in **`assets/roomassets.json`** — which art each room needs,
measured by `tools/roomassets.cjs` actually playing every room, because that
cannot be read off the source (it depends on zone, enemy list, boss, NPCs and
ceiling tier). `js/preload.js` uses it to fetch ahead over the room graph.
**Regenerate it whenever rooms or art change** — serve the repo, then
`node tools/roomassets.cjs && node build.cjs`. It is not fatal if it is stale or
missing: prefetch simply does less, and the lazy map behaves as it always did.

**The package is two different problems and the numbers decide everything**
(measured 2026-08-15): 132 MB total, of which **100 MB is music and video that
is STREAMED and must never be preloaded**, and 32 MB is art — 11.6 MB of shared
boot set plus 18.9 MB spread over 43 rooms, 24 of which add nothing at all. So
the whole prefetch problem is 32 MB, small enough that on a good connection the
right end state is "all of it". `sw.js` counts art and streams in separate
buckets for the same reason: one ceiling let a handful of 4 MB tracks evict the
entire art set, and the next open bought the same bytes twice.

And there is a **quarter-scale copy of nearly all of that art** —
`tools/lowres.cjs`, 68 webp files, **0.55 MB for 24.2 MB of sheets**. It is
front-loaded ahead of everything, so within a second or two every room in the
game can be drawn correctly rather than falling back to the procedural
renderer, and the full sheets sharpen it from behind. Six sheets are excluded
and must stay excluded: the guardian parts atlases are addressed by **absolute
pixel rect**, so a smaller copy assembles the boss out of the wrong quarter of
itself. `tests/lowres.cjs` re-derives that rule from the source rather than
trusting the list. **The whole delivery path is `docs/DELIVERY.md`; regenerate
the tier with `node tools/lowres.cjs && node build.cjs` whenever art changes.**

## Architecture

| file | what lives there |
|---|---|
| `game.js` | loop, room loading, camera, HUD, menus, the opening film, tutorials, map |
| `entities.js` | Player, Enemy, Boss, MovingPlat, SawRig — physics and combat |
| `audio.js` | the synth engine, the SFX vocabulary, music streaming, NPC voices |
| `beast/eagle/glaciere/furnace/prism/mother.js` | one guardian's art and moves each |
| `world.js` | every room: tile grid, entity list, exits |
| `touch.js` | the on-screen controller, the power wheel, layout editor |
| `preload.js` | room-graph prefetch and the low tier: see `docs/DELIVERY.md` |
| `i18n.js` | all six languages. Never hard-code display text |
| `trials.js` | the puzzle games (memory / cubes / balances) and Mind Nodes |
| `braid.js` | THE BRAID — the run's ledger and what it changes |
| `atlas.js` | sprite-atlas slicing and the colour/light grade |
| `media.js` | the lazy asset manifest |

**State.** One global `G` holds the run (`G.state`, `G.enemies`, `G.save`,
`G.roomId`…), plus a handful of loose top-level globals: `player`, `cam`,
`keys`/`keysP`, `parts`, `TOUCH`, `MUS`, `AC`, `LANG`. `G.save` is the only
thing that persists; `persist()` writes it.

## Rendering — and the correction worth making

Mostly **procedural Canvas 2D**: characters, effects, terrain and UI are drawn
with paths, gradients and composite modes. But it is **not** sprite-free — the
game also composites authored art from `assets/characters/` (an 11×8 turnaround
atlas, per-boss parts atlases, backgrounds, tile decks). Both paths are real
and both matter; a change that assumes "no sprite sheets" will break bosses.

There is no WebGL in the shipped build. `vendor-three.js` + `model3d.js` are an
**offline tool** that baked the driller model down to a sprite atlas; they are
deliberately excluded from the `files` array. Do not re-add them.

## Audio

Synthesized through Web Audio: oscillators, noise buffers, biquads. Music is
**streamed** through `<audio>` (never `decodeAudioData` — that turned 2 MB into
60 MB of resident PCM); short SFX are decoded into buffers.

Two rules learned the hard way:

- **A GainNode holds its default of 1.0 until its first scheduled event.** Any
  layer given a delay must set `.value` as well as `setValueAtTime`, or it runs
  at full gain through the block where its source starts.
- **Sound is testable.** Render it through an `OfflineAudioContext` and measure
  it — onset, peak, note pitches, band energy. `tests/cuepitch.cjs` checks that
  the notes coming out are the notes written; `tests/voxmeas.cjs` caught a
  voice chain that was clipping at 1.28 while claiming to filter.

## Style

- Vanilla ES6. No npm packages **in the game** — `package.json` exists only for
  the native shell and the test harnesses, and nothing it installs is shipped.
- No TypeScript, no frameworks, no bundler beyond `build.cjs`.
- The loop runs a fixed step: `update()` may be called several times per frame
  (see `SIM_STEP`/`SIM_MAX`), so all motion must be `dt`-scaled.
- Keep the loop allocation-light: reuse scratch canvases, cap particle counts.
- Comments explain **why**, especially why something is not the obvious way.

## Characters and their art — read `ART_BIBLE.md` first

Every character is one of four classes (live-drawn protagonist, parts-rig
guardian, atlas creature, standing NPC) and the class decides everything else.
All authored character art is generated through **Higgsfield**; if the connector
looks unavailable, the bible's §0 has the diagnostic procedure and it is not
"tell the user to toggle it".

The rules that can be measured **are** measured, by `tests/artbible.cjs`:
silhouettes must differ between states, wind-ups must raise the telegraph amber
above that guardian's own rest, feet must be on the floor, and declared art must
actually be drawn. If that harness is green the bible was followed — which is
the point of it being a test and not a document.

`G.artProbe` is the one measurement hook in the game: it suppresses
ground-anchored decoration so the harness measures feet rather than the
shockwave under them. New ground FX must respect it.

## Testing

Harnesses in `tests/` drive the real build in a real browser. They exist
because reading this code is not enough — each one caught something reasoning
had missed (music playing over itself, a rig deleted the frame it spawned, a
blade that rendered as a white star, the game running in slow motion below
30 fps). Add one when you fix something you could not see.

## Native

`capacitor.config.json` + `android/` wrap the same build as an app;
`tools/pack-www.cjs` assembles `www/` (and strips the service worker, which an
app does not want). `MainActivity.java` turns off the media-gesture requirement
— the reason the app can start its music without asking. See `NATIVE.md`.
