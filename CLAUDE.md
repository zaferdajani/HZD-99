# CLAWBYTE / NOSTOS — working notes

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

## Architecture

| file | what lives there |
|---|---|
| `game.js` | loop, room loading, camera, HUD, menus, the opening film, tutorials, map |
| `entities.js` | Player, Enemy, Boss, MovingPlat, SawRig — physics and combat |
| `audio.js` | the synth engine, the SFX vocabulary, music streaming, NPC voices |
| `beast/eagle/glaciere/furnace/prism/mother.js` | one guardian's art and moves each |
| `world.js` | every room: tile grid, entity list, exits |
| `touch.js` | the on-screen controller, the power wheel, layout editor |
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
