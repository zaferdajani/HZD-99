> **Current authority (2026-09-11):** Read `docs/DEVELOPMENT_AUTHORITY.md` first.
> This HZD-99 Project thread is the sole development/publishing authority.
> Conflicting historical session, branching or autonomous-deployment directions below are superseded.

# CLAWBYTE / NOSTOS — working notes

## Story authority

Read `docs/STORY_CANON.md` for the owner's robot-cat narrative, first NPC,
cave-before-sage quest and one-control-at-a-time tutorial. It takes precedence
over conflicting older story descriptions.

## Finish the complete task (owner-authorized, 2026-09-07)

Treat every requested feature and accepted correction as part of the completion criteria. Continue autonomously through implementation, integration, testing, fixes, and any authorized deployment. A completed phase, commit, plan, or queued generation is not completion of the task.

Give brief progress updates while continuing to work. Do not end a turn merely to announce unfinished work or ask whether to continue.

Stop only when the complete task is verified or a concrete blocker requires the owner's input. Before stopping, finish all independent work that remains possible. Explain the exact blocker and ask only for the minimum action needed.

Never claim completion without verification, silently reduce scope, or weaken tests to obtain a pass. These instructions do not override security controls or required approvals.

## Standing deployment authorization (owner-authorized, 2026-09-07)

For `zaferdajani/HZD-99`, the owner authorizes publishing completed, verified updates to `main` and mirroring them to `odyssey`, including deployment to GitHub Pages. Do not force-push or bypass branch protections.

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

### THE SESSION FLEET (owner's protocol, 2026-08-16; roles formalized 2026-09-11)

The owner opens a session per JOB, when asked, and each session does only
its job — all on the ONE branch above. The owner's words founding this:
*"we need to divide into a company like structure... whatever instruction
I give you here, you deliver it for the appropriate session and appropriate
hierarchy... as filters to give orders to the appropriate session."*

- **THE PROJECT MANAGER — the CODE session** (this protocol's reader,
  usually). Every instruction the owner gives arrives here first and this
  session decides who does it. A request that touches more than one domain
  (his example: "improve the fight scene" is art AND audio AND hero/enemy
  logic) is DECOMPOSED, not forwarded whole — a brief queued for ART, a
  brief queued for AUDIO, a brief queued for VIDEO if the moment needs one,
  and the logic/wiring/hitbox/state-machine work done here, directly, in
  code. It is also THE INTEGRATOR: pulls frequently, merges what every
  other session pushes, verifies with the full suite, ships, and reports.
  A job is not done until the integrator has pulled it, tested it, and
  confirmed it live — and a decomposed request is not done until every
  branch of it has landed, not just the code branch.
- **The ART session**: holds the Higgsfield image/3D binding. Fires THE
  FIRING LIST in docs/ART_QUEUE.md top to bottom, WITH THE OWNER REVIEWING
  each result before it is keyed and committed — the owner refuses art he
  does not like, and credits are his. It never edits game logic beyond
  wiring notes.
- **The AUDIO session**: holds the Higgsfield audio binding (music, SFX,
  voice). Fires docs/AUDIO_QUEUE.md the same way ART fires its list — owner
  reviewing each cue before it is cut and committed. Read the `composer`
  skill before scoring anything. Never touches game logic beyond wiring a
  cue into `js/audio.js`'s manifest.
- **The VIDEO session**: holds the Higgsfield video binding (cinematics,
  filmed motion strips, cutscenes). Fires docs/VIDEO_QUEUE.md the same way.
  Read the `manga-direction` skill before staging a cinematic. Never touches
  game logic beyond wiring a clip into the manifest.
- **The TERRAIN session**: the one worker role that is NOT Higgsfield-bound
  and NOT owner-opened — the code session spawns and commands it directly,
  same as a kingdom session. It implements level geometry, elevation,
  platform/collision shaping and room-layout skeletons (the NO RIGHT ANGLES
  domain below); it ASKS the ART session for whatever plate a structure
  needs (queuing the brief in ART_QUEUE like anyone else) but never
  generates or fires art itself, and it IMPLEMENTS whatever the code
  session or a kingdom session asks of it rather than choosing its own
  work. A kingdom session that needs a room's structural skeleton built or
  fixed delegates that piece to TERRAIN and keeps the enemies/NPC/story for
  itself.
- **The STORY session** (owner-ordered, 2026-09-19): holds a Higgsfield binding
  and draws the coloured manhua of the game from `docs/STORY_SCRIPT.md`, to the
  letter, one kingdom per chapter, owner reviewing every page. Its protocol is
  `docs/MANHUA_SESSION.md`; its ledger is `docs/MANHUA.md`; its link rule is
  https://zaferdajani.github.io/HZD-99/manhua/ at the end of every report. The
  script it draws from is the code session's and is revised with the game.
- Any further specialist session follows the same shape: one job, named at
  open, same branch, coordinated through its own ledger.

**Only ART, AUDIO and VIDEO are owner-opened**, because connector bindings
and approval of what they generate are his — the code session cannot
substitute for that (see ART IS HIGGSFIELD'S below) and never sits on the
work silently. Everything else (TERRAIN, kingdom sessions, any other pure
implementation role) the code session CAN and SHOULD spawn and command
directly (create_session / send_message) — the owner is not a relay for
those. When a needed owner-opened session does not exist yet, the correct
move is to ASK THE OWNER to open one and hand him its kickoff instruction.

### KINGDOMS ARE THE UNIT (owner's protocol, 2026-08-16)

The fleet is organised BY KINGDOM, and the kingdom has a shape:

- **A kingdom runs from its opening to ITS SAGE and the sage's cave.**
  Kingdom 1 begins the moment the character wakes and ends at the first
  sage. The next kingdom begins fresh — new visual art, new enemies, new
  skills.
- **Every kingdom has at least one NPC with its own IDENTITY and its own
  PLACE** — a workshop, office or home (the booth/den pattern from A0 is
  the template). The NPC may stand outside it, but the place is theirs.
- **Every kingdom has at least one save point** (bench).
- **One session per kingdom** does everything in-world for it: rooms,
  enemies, the NPC and their place, the sage and its cave. All kingdom
  data moves to and is done in that session.
- ART, AUDIO and VIDEO (owner-opened, Higgsfield-bound, owner reviewing —
  see THE SESSION FLEET) each serve every kingdom through their own FIRING
  LIST; TERRAIN builds each kingdom's room skeletons on request; the code
  session (the project manager) holds gameplay, story and twists, and
  INTEGRATES everyone.
- The code session CAN and SHOULD spawn and command kingdom and TERRAIN
  sessions directly (create_session / send_message) — the owner is not a
  relay for those. Only ART, AUDIO and VIDEO are owner-opened, because
  connector bindings and generation approval are his.

## THE STUDIO IS VIBESOLUTIONS (owner's standing order, 2026-09-10)

**"VibeSolutions ... is the name using to become my creating company name. I
will add all the projects all the released and published projects to be from
this name so all the projects I created here or other platforms will be
registered under VibeSolutions."**

Everything this repository releases publishes under that name. It is ONE
constant in two places that must stay in step — `STUDIO` in `js/game.js` (the
in-game footer, drawn by `drawFooter` on the title screen and the pause card)
and `STUDIO` in `build.cjs` (the `author`/`publisher` meta and the structured
data in every built page). `package.json`, `assets/CREDITS.md`, `README.md` and
`docs/STEAM.md` carry it in prose.

- **It is not an i18n key.** A company name is a proper noun and is the same in
  every language the game speaks; routing it through `t()` invites a translated
  trademark.
- **The person is not erased.** The structured data publishes as the
  Organization and keeps `creator` as the person who made it.
- `tests/brand.cjs` measures it — the meta in both shipped pages, and the two
  screens actually drawing the name — because a footer is the kind of thing
  that disappears in a refactor and nobody looks twice at the bottom-left.

## NO BACKLOG RECITALS (owner's standing order, 2026-08-16)

**"Never tell me 'still not done' at all. You are not a kid that I need to
keep monitoring. You have the resources and approvals that you needed."**

Do not close a report with a list of what remains. The owner has already
given the approvals and the credits; enumerating the backlog at him is asking
to be supervised, and it spends his attention on work he has already
authorised instead of on the work that landed.

- **Report what SHIPPED**, what it fixes, and anything he must decide or that
  another session must wire.
- **The queue lives in `docs/ART_QUEUE.md`.** That file is the backlog. It is
  where remaining work is tracked, and it is complete enough that no verbal
  recital adds anything.
- Say something is unfinished ONLY when he needs it: a blocker he alone can
  clear, or a defect shipped that he would otherwise discover himself.
- Then keep firing. The list is run top to bottom without being narrated.

## ART IS HIGGSFIELD'S, CODE IS OURS (owner's standing order, restated 2026-08-16)

**"All arts, videos, images, STRUCTURES should be created through
Higgsfield. You are not good at it. You can create the code, you can
create the gameplay, but not the art."** Structures is the word that
changed: the booth, the city gate monument, the cave mouths — anything
that reads as a built or natural THING — are Higgsfield plates, not
procedural drawings. Every procedural structure currently in the game
(drawBooth, drawGateDoors, drawCaveMouth) is a wiring stand-in awaiting
its fired plate on THE FIRING LIST (§2f, §2g), and no new structure may
be added without its brief going on that list in the same commit.

## NO LIGHT ROUND A BODY (owner's standing order, 2026-11-16)

**"Why still framed with light ?!!!"** — the third refusal of the same thing
("framed by a white frame, which is weird", 2026-10-16; "light aura... it
breaks the blending with the surrounding", 2026-11-15). From 2026-10-12 every
hostile body carried a pale rim outside its silhouette to lift it off dark
rooms. It was thinned twice and refused each time, because it is the LINE he
refuses, not its strength. It is removed from the engine (`js/foeread.js` keeps
only the stencil, for a body's pigment and its hit flash).

- **Never draw a rim, halo, keyline, outline or glow round an enemy, a guardian
  or an NPC to make it read.** A body that sinks into its room is a job for its
  own art and that room's light.
- **An infected agent wears nothing behind it either** (owner, 2026-11-17:
  "remove the ring"). While she carried crystal light `drawSage` laid a dark
  disc with an ember ring stroked round it behind the body. It is withdrawn;
  the crystal's sense still counts the agent, and `tests/fired-art.cjs` holds
  that the body draws the same pixels with the light in her hands as without.
- `tests/contrast.cjs` holds it: a body drawn through the frame's own call has
  no pixel the bare body lacks. It still prints how much of each silhouette
  reads off its room — a record for the art, not a bar to buy with a line.

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

## THE LIVE LINK (owner's standing order, 2026-08-18)

**Live: https://zaferdajani.github.io/HZD-99/**

That is the ONLY URL any session may quote. The old
`zaferdajani.github.io/odyssey/` path is dead — it returns GitHub's
"Site not found" 404, so a report that ends with it hands the owner a
broken link. The name changed; the link changed with it.

It is also the URL the deploy check must md5 against: comparing
`git show HEAD:index.html` to a 404 page produces a mismatch that looks
exactly like a failed deploy, and that is how twenty minutes were spent
chasing a deploy that had in fact succeeded.

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
| `packs.js` | campaign packs: `?pack=<id>` loads `packs/<id>/pack.json` over the world — see `docs/PACKS.md` |
| `editor.js` | THE FORGE (owner's editor) — only in `forge*.html`, never the game pages. `docs/PACKS.md` |
| `solid.js` | she cannot walk through a hostile body: the wall round each one, built from `assets/bodybox.json` (`tools/bodybox.cjs`) |
| `wolfhunt.js` | the pack hunts: a wolf notices her, shows its teeth, charges, stalks, bites from the distance its lunge covers, thrashes a bite that lands, and rolls under her finisher (`tests/wolf-hunt.cjs`). A HILL IS NOT A LEDGE: the charge's brake-length probe walks the ground between (`huntGround`) and a walker steps DOWN what it steps up (`STEP_DOWN` 34), so a hunter crosses a heap instead of standing penned on its crest. THE RUN (`A10R`, world.js) is the road to the Wolf King — hulks, a tooth-pit, the pack posted along it, and his call the whole way (`alphaCall`); `tests/alpha-run.cjs` |
| `cheetahhunt.js` | the cats hunt like cats: the long creep that freezes when she looks at it (and a patience that runs out), the sprint from far enough out to reach full speed, the skid when it overshoots, and ON GUARD between bites — it backs up FACING her (its stride run backwards, `wolves.js`) and never walks with its back to her (owner, 2026-11-16); a cornered cat comes sooner; the leaping cat keeps the same guard. No warning is shortened anywhere (`tests/cheetah-hunt.cjs`) |
| `alphakit.js` | the Wolf King's own moves — the REND, the FURY, the fury leap's QUAKE — the effect every Alpha move wears (`tests/alpha-kit.cjs`), and what makes it a test of skill: the HIDE (a blow thrown into its attack lands at two fifths), the SPRING out of a mash, the SKYBITE at anyone bouncing on its back, the fury's chained pounces (`tests/boss-skill.cjs`: a masher and a pogo bot must LOSE, a bot that reads it must WIN) |
| `gravehorn.js` | GRAVEHORN, the Eye's rhino (CV3): a parts rig wearing fired plates cut and anchored by `tools/ghparts.cjs`; the charge, the toss and its one-clean-strike parry, the horn missiles, the rear kick, the BUCK that answers anyone on his back (`tests/gravehorn.cjs`, `tests/boss-skill.cjs`, `docs/combat/BOSS_GRAVEHORN.md`). His floor runs to the back wall and the stone stands at the end of it (no ground he cannot reach); the stone does not break while he lives (`ghHoldsStone`), a win is recorded as `ghWon`, and `ghMigrate` puts right a save where the marble was taken mid-fight (`tests/gravehorn-ground.cjs`). He TURNS through fired three-quarter and head-on plates (`GH_TURN`, `ghTurnView`, cut by `tools/ghturn.cjs`) — never a mirrored squash — and every second turn goes round AWAY from the camera through the rear and tail-on plates (`b.turnAway`) (`tests/turn-roar.cjs`) |
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
| *(game.js)* AN NPC WEARS ITS FILMED BODY | `NPC_TALL` — the Oracle draws his strip everywhere he is, at a merchant's stature (flat-lined screen while unpowered), never the old atlas wisp; `tools/shroudback.cjs` derives the strip from its keyed master by backing the robe. Unpowered he rests on his own plate (`rest`), and speaking he goes between his talking pair (`talk`, `beat`) |
| *(wolves.js)* THE CATS | `CAT_SIZE` 1.5 — body, wall and drawing together, set in Enemy's constructor (`sizeK`); a cat her blow binds plays its own filmed FOLD (`CHEETAH_ART.down`, six cells over `fall` seconds from `e._fallAt`) and lies in the last cell, breathing — never the warning plate |
| *(sage-motion.js)* THE AGENTS ARE NOT ONE BODY | `AGENT_ART` keys each agent's own eight plates by its chamber (TALLYMAN GA1D, LEASH GA2D, UNDERTOW GB1D, SLAGFATHER GC1D, REDACTOR GD1D, LAPIDARY GX1D, PUPIL GE1D — `assets/characters/agents/<name>/`); `agentKey` swaps the picture, `agentHeight`/`AGENT_H` is the ONE size table both drawings read (the duel's and `drawSage`'s), `agentLeft` turns the left-facing art toward her. A chamber with no row keeps the shared set. Each walk strip is ONE stride of its take (the period measured off the take; `assets/source/agents/jobs.json`). `tests/fired-art.cjs` |
| *(game.js)* A DECK IS AN OBJECT | `PLAT_OBJ` (city gantry, cave shelf, Conduits tray; rows printed by `tools/platobj.cjs`) and `platObjFinish`, which runs LAST in the tile bake: it clears what the terrain passes made of each `=` run and lays the object with its surface on the curve. Never indoors, in a `decks` room or in NOSTOS; a zone without a set keeps the old deck. `tests/fired-art.cjs` |
| `tools/plate.cjs` | one fired still into a plate: keyed (chroma or a black flood), trimmed, seated on the cell floor, webp. `PLATE_SCALE` gives a SET one scale; `PLATE_KEY`/`PLATE_DESPILL=edge` for a subject near the screen's hue |
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

## Native

`capacitor.config.json` + `android/` wrap the same build as an app;
`tools/pack-www.cjs` assembles `www/` (and strips the service worker, which an
app does not want). `MainActivity.java` turns off the media-gesture requirement
— the reason the app can start its music without asking. See `NATIVE.md`.
