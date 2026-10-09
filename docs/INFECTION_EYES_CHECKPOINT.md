# Infection eyes — checkpoint

What the infection looks like from outside: the eyes of every infected machine
burn, and an eye that MOVES leaves incense smoke behind it. This file is the
record of what is built, where it hooks in, and what measures it. The code is
`js/infection-eyes.js`; the eye positions are `assets/eyes.json`.

## The owner's brief, and where each rule lives

| rule | how | measured by |
|---|---|---|
| Ordinary infected enemies: RED eyes. Guardians, the Alpha included: PURPLE | `infEyeClass(e)` — boss instances, mini-bosses and the sage are purple; the Alpha is purple until `alphaFreed()`; everything else red | `infection-eyes`, `infection-roster` (every placed kind) |
| Moving eyes leave incense-like smoke | particles owed by travel (`INF_EYE_SPACING` px of eye path per wisp), laid along the eye's own path, rising and curling as they age | `infection-eyes` |
| Anchored to the ACTUAL eyes in every frame — facing, crouch, jump, attack, land — not the forehead or body centre | every renderer reports its eye per frame: `infEyeMark` (procedural eyes) or `infEyeArt` (authored art, per-cell points from `assets/eyes.json`), mapped through the canvas transform the body was drawn with | `infection-roster` (per kind, per frame, per facing; the wolf per state) |
| World coordinates; the camera must not create trails | the transform captured at `infEyeWorldBegin` is inverted, so points and particles live in world space; nothing emits from a draw | `infection-eyes` (a pan with the body still) |
| Restrained | small, short-lived (`INF_EYE_LIFE` 1.5 s), additive, young wisps bright and old ones faint; idle bodies emit nothing | visual |
| Stop on purification or friendliness; let existing wisps fade | `infEyeClass` returns null for purified / tame / calm / friendly / rescued / yielded / disabled / hypnotised bodies — emission stops that frame, the pool ages out | `infection-eyes` |
| Clear on teleport, room change, removal and load | eye jump > `INF_EYE_JUMP` kills that body's trail; `infEyeClearAll()` at the top of `loadRoom`; a body no longer in the room is cleared on the next step | `infection-eyes` |
| A stopped creature's plume dissipates, leaving only the glow | emission requires the BODY to travel (`INF_EYE_MIN_V`, held `INF_EYE_HOLD`); a filmed idle steps its eye between cells and that must not count as motion | `infection-eyes` |
| Mobile performance bounded | one structure-of-arrays pool; cap by quality tier (`INF_EYE_CAP`: low 90, mid 170, high 260, ultra 320); cached sprites, no per-frame allocation | `infection-eyes` (25 wolves on `low`) |
| Reduced motion | the OS setting or `G.save.opts.reduceMotion`: the glow stays, no smoke | `infection-eyes` |
| Nothing advances while paused | `infEyeUpdate` runs only inside the fixed-step PLAY update (and hit-stop at quarter speed, and DEAD) | `infection-eyes` |
| Body animation and the eye VFX stay separate | no smoke is baked into any art; the wolf takes were filmed with "no smoke, no particles" and cut frame by frame around anything baked in | `assets/source/beasts/wolf2/` |

## Where it hooks in

- `js/game.js` — `infEyeWorldBegin(c)` after the camera translate;
  `infEyeDraw(c)` before `drawParts` (skipped under `G.artProbe`);
  `infEyeUpdate(dt)` beside `updateParts`; `infEyeClearAll()` in `loadRoom`.
- Body wrappers — `Enemy`, `Boss` and `YardWinch` draws are wrapped so a report
  knows whose eye it is (`infEyeBodyBegin/End`).
- Renderers — `media.js` (`drawStripCell`, `drawPlateAnchored`, `drawSetPlate`),
  `entities.js` (`drawSheet`, procedural eyes, bat optic, sage, held boss,
  roster walks), `wolves.js` (pack and Alpha plates and strips), `atlas.js`
  (`atlasEyes`, both branches), `beast.js`, `eagle.js`, `glaciere.js`,
  `furnace.js`, `prism.js`, `mother.js`, `winch.js`.

## The eye map

`node tools/eyemap.cjs` (repo served on :8220) measures every piece of hostile
art listed in `tools/eyespecs.cjs` and writes `assets/eyes.json`
(`{key: {c, r, e: [[x, y, …] per cell]}}`, fractions of the cell). Detection
looks for the eye's own glow; where the art's eye does not glow the point is
placed by hand from a 10% grid render and says so in the spec.
`--sheet out.png` draws every anchor on its art for review;
`EYEMAP_ONLY=<regex>` checks without writing. `build.cjs` compiles the map into
the page as `window.EYE_MAP` and into the build id.

**Regenerate it whenever hostile art changes.** The 2026-10-09 wolf set was the
first full regeneration after the map shipped: ten new strips, every anchor
checked on the sheet.

Intentional gaps (no anchor, by design): the Alpha's yield cells 7–11 (it is
turning friendly), the bat hanging asleep, the beast's fall cells 7–11, the
purified prism frames, and the tamed wolf's purify and sit strips.

## Status

Implemented and measured: everything in the table above. `tests/infection-eyes.cjs`
(21 checks) and `tests/infection-roster.cjs` (every placed hostile kind and
guardian, and the wolf state by state) run in the full suite.
