---
name: engine-map
description: The map of the engine — what lives in each file of js/, the row for every system (bosses, the pack, the cats, the agents, the map, the shop, the gear screen, rings, decks, the rig), how build.cjs concatenates the sources and what that breaks, global state, rendering, audio, style, testing and character art classes. Load before editing any file in js/ or tools/, when looking for where something lives, and when a build boots to a black page.
---

# The engine, file by file

Moved from `CLAUDE.md` on 2026-11-17, unedited. **Keep it current**: a change
to a system updates its row here in the same commit, as it always did.

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

**A loaded sheet is not a decoded sheet** (measured 2026-11-15, after the owner
reported the APK lagging "to point of a second"). The first canvas draw of a
sheet decodes it on the main thread, in that frame: 50–190 ms each on a desktop
CPU, several times that on a phone. `img.decode()` does NOT help a canvas, and
`createImageBitmap(<img>)` blocks for the whole decode; only
`createImageBitmap(Blob)` is both off the main thread and cheap to draw.
`js/media.js` (DECODED BEFORE IT IS DRAWN) does that — in a Worker, so it holds
on iOS's WebKit too, which cannot be run in this environment — for every sheet
that is wanted or within a door of her, under a per-device memory ceiling, and
one patched `drawImage` uses the bitmap. `docs/DELIVERY.md` §5.2 has the table;
`tests/decode-ahead.cjs` measures it. Do not read a canvas back (`getImageData`
on the frame) in the play loop either: on a phone's GPU that stalls the frame.

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
| `audio.js` | the synth engine, the SFX vocabulary, music streaming, NPC voices — and the VOICE BUS: every synth helper connects to `sfxDest()`, and a sound named in `SFX_VOICE` goes through a gain, a soft saturator, a presence shelf and a limiter so a guardian is heard over the score on a phone speaker; `SFX_DIP`/`musDip` step the stream back under a roar; `musKick` wakes a suspended context, rebuilds a dead stream and hands a dying one to the next candidate (`tests/voice-heard.cjs`) |
| `tools/faststart.cjs`, `tools/defringe.cjs` | derive-with-a-tool for what a phone and the owner's eye need: every track and film a plain index-first MP4 (`tests/media-container.cjs`); no plate with a cyan rim on its outer edge (`tests/no-rim-baked.cjs`) |
| `beast/eagle/glaciere/furnace/prism/mother.js` | one guardian's art and moves each |
| `world.js` | every room: tile grid, entity list, exits |
| `touch.js` | the on-screen controller, the power wheel, layout editor |
| `preload.js` | room-graph prefetch and the low tier: see `docs/DELIVERY.md` |
| `i18n.js` | all six languages. Never hard-code display text |
| `trials.js` | the puzzle games (memory / cubes / balances) and Mind Nodes |
| `braid.js` | THE BRAID — the run's ledger and what it changes |
| `atlas.js` | sprite-atlas slicing and the colour/light grade |
| `media.js` | the lazy asset manifest |
| `packs.js` | campaign packs: `?pack=<id>` loads `packs/<id>/pack.json` over the world — see `docs/PACKS.md` |
| `editor.js` | THE FORGE (owner's editor) — only in `forge*.html`, never the game pages. `docs/PACKS.md` |
| `solid.js` | she cannot walk through a hostile body: the wall round each one, built from `assets/bodybox.json` (`tools/bodybox.cjs`) |
| `wolfhunt.js` | the pack hunts: a wolf notices her, shows its teeth, charges, stalks, bites from the distance its lunge covers, thrashes a bite that lands, and rolls under her finisher (`tests/wolf-hunt.cjs`). A HILL IS NOT A LEDGE: the charge's brake-length probe walks the ground between (`huntGround`) and a walker steps DOWN what it steps up (`STEP_DOWN` 34), so a hunter crosses a heap instead of standing penned on its crest. THE RUN (`A10R`, world.js) is the road to the Wolf King — hulks, a tooth-pit, the pack posted along it, and his call the whole way (`alphaCall`); `tests/alpha-run.cjs` |
| `cheetahhunt.js` | the cats hunt like cats: the long creep that freezes when she looks at it (and a patience that runs out), the sprint from far enough out to reach full speed, the skid when it overshoots, and ON GUARD between bites — it backs up FACING her (its stride run backwards, `wolves.js`) and never walks with its back to her (owner, 2026-11-16); a cornered cat comes sooner; the leaping cat keeps the same guard. No warning is shortened anywhere (`tests/cheetah-hunt.cjs`) |
| `alphakit.js` | the Wolf King's own moves — the REND, the FURY, the fury leap's QUAKE — the effect every Alpha move wears (`tests/alpha-kit.cjs`), and what makes it a test of skill: the HIDE (a blow thrown into its attack lands at two fifths), the SPRING out of a mash, the SKYBITE at anyone bouncing on its back, the fury's chained pounces (`tests/boss-skill.cjs`: a masher and a pogo bot must LOSE, a bot that reads it must WIN) |
| `sewer.js` | THE SEWER (owner, 2026-11-24): in the robot world UNDERTOW's caves GB1/GB1T/GB1D are a sewer (`SW_ROOMS`; `sewerApply` swaps them in per save, clears their grids, and the hero's world keeps the caves). The relay gallery's door is a floor HATCH (`GATE_STORY.B6`, `style: 'hatch'`): `swHatchBegin`/`swHatchStep`/`swHatchDrawHer` ride the gate walk — she opens it from the side she came from in her own eight-cell strip (mirrored from the east, never a flip), the lid's four cells follow her hands, creak and clang are CC0 recordings — then she falls in at the top of GB1's shaft onto `SwLift`, which takes her down. RIVET the pipe-smith (`swsmith` static, filmed loop) asks for MIREJAW's shed skin (`swSkinDrop`, from `onBossDead`), forges the HIDE SHELL (`swForge`, on the game clock), and holds the tunnel shut until then. The shell (`flags.shellOn`, a Gear row): `swShellSpeedK` ×0.86, `swShellTurn` turns blows from behind with heat like the brace (never water or teeth), `swShellCut` takes a core off a heavy blow; drawn BEHIND her at her back, measured per cell off the cell itself (`swBackOf`). The channels are water (`SW_WATER`). A locked door that is not a ring opens when its flag is set (`ringAsleep`). `tests/sewer.cjs` |
| `gravehorn.js` | GRAVEHORN, the Eye's rhino (CV3): a parts rig wearing fired plates cut and anchored by `tools/ghparts.cjs`; the charge, the toss and its one-clean-strike parry, the horn missiles, the rear kick, the BUCK that answers anyone on his back (`tests/gravehorn.cjs`, `tests/boss-skill.cjs`, `docs/combat/BOSS_GRAVEHORN.md`). His floor runs to the back wall and the stone stands at the end of it (no ground he cannot reach); the stone does not break while he lives (`ghHoldsStone`), a win is recorded as `ghWon`, and `ghMigrate` puts right a save where the marble was taken mid-fight (`tests/gravehorn-ground.cjs`). He TURNS through fired three-quarter and head-on plates (`GH_TURN`, `ghTurnView`, cut by `tools/ghturn.cjs`) — never a mirrored squash — and every second turn goes round AWAY from the camera through the rear and tail-on plates (`b.turnAway`) (`tests/turn-roar.cjs`) — the BUCK answers the air over his back and throws a floor shock both ways (`b.shocks`, `GH.quake*`) and ends in no opening; the flying horn's hit is its drawn length (`ghMissilePts`) and it cuts on the way home too. Player side: a down-strike on any Boss is counted in a five-second MEMORY (`POGO_FADE` whole/half/nothing, `POGO_MEMORY`, entities.js) and a blow that rings off plate gives no rebound (`tests/boss-skill.cjs` mash/pogo/hop bots) |
| *(entities.js)* NULLFANG'S STAGES | three, each SAID: at half the midpoint stagger then a break ROAR that bends the frame (`breakRoar`, `roarBig`, `nf_break1`), at a quarter the `fury` (no ledge, `nfPace` 240/330, `nf_break2`). No tell is shortened in any stage. On the perch a blow, or her standing under it, ends the wait and he dives with the full warning. `tests/turn-roar.cjs`, `docs/combat/BOSS_NULLFANG.md` |
| `boss-fx.js` | the guardians' shared effect beats — a wind-up gathers light, the strike that follows fires one at the body, a hard landing goes through the ground — for every sage and micro-boss but NULLFANG and the Alpha, which place their own (`tests/boss-fx.cjs`) |
| `ripple.js` | a shock that bends the screen: the finished frame redrawn through ring-shaped windows so the picture itself bows as a wave passes, with a soft wash, a shimmer behind the front, a frame nudge and an optional step back — the Alpha's howl, roar and fury (`shockRipple`) |
| *(game.js)* THE MAP | each room is charted from its AIR — the cavity, six pixels a tile, softened and cut back to a clean wandering line (`roomMini`, `MINI_S`); no frames; YOU ARE HERE is her helmet in a beating ring at one screen size at any zoom; the errand's room wears a gold mark (`pgGoalRoom`). `tests/map-read.cjs` |
| *(game.js)* THE SHOP | `shopOpen(ask)` opens as a QUESTION when a conversation leads into it, nothing can be bought for half a second or by a key that was already down (`shopGuard`, `shopArmed`), and one row is Ratchet's pick with a reason (`shopPick`, `SHOP_PICK_ORDER`). Guardians pay `bossScrap` however they go. `tests/shop-ask.cjs` |
| *(entities.js)* A PURIFIED MACHINE GIVES SOMETHING BACK | `finishCleanse` pays through `pureGift`: the FIRST machine she purifies gives a core she keeps, and the ladder pays again at 3, 6, 10 and 15 (`PURE_GIFTS`); every purification says the count and how many to the next gift. The verb is PURIFY in every language — never "free" (docs/STORY_CANON.md). `tests/pure-gift.cjs` |
| `gear.js` THE GEAR SCREEN | the one place that says what she has and how to use it: equipment, her BLADES (Enter equips one she owns), the SUITS guardians leave her (`arm:<id>` rows — Enter wears, again takes off) and, on every part she has, the key that uses it in her own bindings (`gearHow`, `howToOpen`). The Inventory points at it and its key opens it from there; a new part's card says where it lives. `tests/gear-how.cjs` |
| *(wolves.js)* THE BODY LIES ALONG THE GROUND | `drawBeastPlate` reads the slope under a wolf's or cat's fore and hind paws and pitches the plate to it about the paws, eased (`BEAST_TILT_MAX`, `e._tilt`). The collider already stood on the curve; the picture had stayed level |
| *(entities.js)* THE DASH | every echo is HER — the cell she was drawn with that frame (`HERO_ECHO`, recorded in `drawStripCell` while her body is drawn), as light cooling white→cyan→violet — behind a launch ring (`shockRipple`) and a wake of ribbons (`dashFx`). Never a stand-in silhouette |
| *(game.js)* SHE STEPS OUT OF A RING ONTO ITS PAD | `gateSetDown` sets her on the ground under the far ring when a door walk lands (it used to keep the y of the room she left, which buried her a tile deep outside every guardian chamber and the quarry). ONE RING TO A FRAME: no two rings of a room stand within 640 px (the haul ring beside the marble is withdrawn; the Alpha's dormant ring is at the far end of his floor). `tests/ring-pads.cjs` F and B |
| *(game.js)* SHE STEPS UP INTO A RAISED DOOR | through a machine ring she climbs over its sill and into the swamp's culvert she hops (`GATE_STEP`, `gateStepKind`, `gateStepKey`; `G.gateWalk.stepKey`): after the turn, the step strip of her weapon tier plays at the door (cells 0-5), then her stride on top (6-7) while she recedes; `gateWalkDur` gives a step 1.4 s. Strips cut by `tools/stepstrip.cjs`, which keeps the height she gains. `tests/gate-step.cjs` |
| *(game.js)* AN NPC WEARS ITS FILMED BODY | `NPC_TALL` — the Oracle draws his strip everywhere he is, at a merchant's stature (flat-lined screen while unpowered), never the old atlas wisp; `tools/shroudback.cjs` derives the strip from its keyed master by backing the robe. Unpowered he rests on his own plate (`rest`), and speaking he goes between his talking pair (`talk`, `beat`) |
| *(wolves.js)* THE CATS | `CAT_SIZE` 1.5 — body, wall and drawing together, set in Enemy's constructor (`sizeK`); a cat her blow binds plays its own filmed FOLD (`CHEETAH_ART.down`, six cells over `fall` seconds from `e._fallAt`) and lies in the last cell, breathing — never the warning plate |
| *(sage-motion.js)* THE AGENTS ARE NOT ONE BODY | `AGENT_ART` keys each agent's own eight plates by its chamber (TALLYMAN GA1D, LEASH GA2D, UNDERTOW GB1D, SLAGFATHER GC1D, REDACTOR GD1D, LAPIDARY GX1D, PUPIL GE1D — `assets/characters/agents/<name>/`); `agentKey` swaps the picture, `agentHeight`/`AGENT_H` is the ONE size table both drawings read (the duel's and `drawSage`'s), `agentLeft` turns the left-facing art toward her. A chamber with no row keeps the shared set. Each walk strip is ONE stride of its take (the period measured off the take; `assets/source/agents/jobs.json`). `tests/fired-art.cjs` |
| `agentrig.js` AN AGENT POSED FROM PARTS (a proof, OFF) | the other way to draw an agent: ONE fired sheet of parts (`tools/agentparts.cjs` cuts it and measures every joint as a fraction of its part into `rig/rig.json`, which `build.cjs` compiles in), a move as a ROW of numbers (`AGENT_POSE`), every number on a spring so one move flows into the next (`agentRigStep`), the stride/breath/robe as overlays, the tell as ember INSIDE the cloth (`agentRigEmber`). Only TALLYMAN (GA1D) has a rig and it draws only with `?rig=1` or `G.agentRig`; the plates stay the shipped drawing until the owner says convert. `tests/agent-rig.cjs`; the method is the `rig-animation` skill |
| *(game.js)* A DECK IS AN OBJECT | `PLAT_OBJ` (city gantry, cave shelf, Conduits tray; rows printed by `tools/platobj.cjs`) and `platObjFinish`, which runs LAST in the tile bake: it clears what the terrain passes made of each `=` run and lays the object with its surface on the curve. Never indoors, in a `decks` room or in NOSTOS; a zone without a set keeps the old deck. `tests/fired-art.cjs` |
| `tools/plate.cjs` | one fired still into a plate: keyed (chroma or a black flood), trimmed, seated on the cell floor, webp. `PLATE_SCALE` gives a SET one scale; `PLATE_KEY`/`PLATE_DESPILL=edge` for a subject near the screen's hue |
| `conduits-road.js` | KINGDOM 2'S ROAD (owner, 2026-11-21): the seals from the Conduits' fights (`K2_MINI_SIGIL`, UNDERTOW's in `SAGE_GIFT`), the Prowler's second sword (`k2GiveSecondSword`), TALONHOST away until the throw (`k2BossAway`), the save migration (`k2Migrate`), the goal order (`k2Goal`). THE SILT MIRE (rooms SW1-SW5 in world.js): drain-culvert doors (`style: 'culvert'`), Bilge's raft (`K2Raft`, a platform he poles) and his offer (`G.state 'FERRY'`: a high fare or his errand), the water (`K2_WATER`: open rows over a solid bed, a body below the surface is rescued), the insects. The armour chain's order per world is `BOSS_ORDER` in types.js. `tests/ch2-road.cjs`, `tests/story-order.cjs` |
| `mirejaw.js` | MIREJAW, the swamp crocodile (SW3): his own machine, like GRAVEHORN's — the ambush from the water, the death roll (2 cores), the hide and its weak points (`e.hideAt`, read by dealDmg), the bellow at half. `docs/combat/BOSS_MIREJAW.md`, `tests/mirejaw.cjs` He stands ON the islands: posed from the ground under his fore and hind paws (`mjSeat`, `mjPoseStep`; the hind legs go under the surface past a bank), and he surfaces on the slant, swimming forward as he rises (`MJ.glide`). His WHOLE move set is drawn (`MJ_ART`; `assets/movesets.json`, `tests/species-moveset.cjs`): notice, swim/idle in the water, the rise then the coil, the leap with the bite's slam, land then gape, walk back (phase 1) or turn and run (phase 2), daze, roll, down; every moving strip turns over by distance (`MJ_STRIDE`, `M.trav`). In the death roll SHE is drawn by him: her held sheet for her weapon tier (`MJ_HELD`, `mjHeldKey`) at his grip in each roll cell (`MJ_ROLL_JAW`), his snout band redrawn across her waist, and her ordinary body skipped (`mjHoldsHer`, game.js) |
| *(game.js)* A LONG BODY STANDS ON THE GROUND UNDER ITS FEET | `groundSeat(cx, footY, xA, xB, tiltMax, belly)`: the pitch and drop that put both ends of a level-drawn plate on the curve under them, held up only as far as the belly clears a crest. NULLFANG wears it in `drawBeast` (paws measured off his takes); the wolves and cats have their own (`BEAST_TILT_MAX`). `tests/stand-ground.cjs` |
| `warp.js` | `?room=<id>` — the owner's jump into any room, behind the Forge's own passphrase. Inert without the query string; its own save slot |

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
