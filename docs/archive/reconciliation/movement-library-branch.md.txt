# MOVEMENT SOURCES — open-source locomotion for the hero and the animals

Searched 2026-08-16. Every entry below was **opened and checked**, not recalled:
licences read on the source page, archives downloaded, frame counts measured off
the actual PNGs. Where something is unverified it says so.

Nothing here has been copied into `assets/` yet. `tools/fetch-movement.cjs`
downloads the verified free ones on demand, so the repo does not carry art the
game does not draw.

**The licence rule this file inherits:** CC0 and public-domain first, CC-BY only
with a credit line in `CREDITS.md`, and **never share-alike** — the same rule
that got rgsdev's knight pack rejected. A share-alike asset would force the
whole game share-alike.

---

## 0. Two facts about this repo that decide everything below

**`build.cjs` does not ship Three.js.** `vendor-three.js` and `model3d.js` are
excluded from the bundle on purpose — 600 KB was too much to send every player
for a model nothing draws any more. So "you already have a 3D engine, just add
`GLTFLoader`" is **wrong here**: adding animated 3D at runtime means putting that
600 KB back, plus the loader, plus a skinning path the renderer does not have.

**But the way the driller was made is the answer.** That model was baked down to
`assets/characters/driller_12x6.png` — twelve yaw columns by six frames — and
`atlas.js` reads it as `{ cols: 12, rows: 6 }`. The 3D existed offline, the game
draws a sheet. **That is the pipeline the CC0 animal rigs belong in**: take an
authored gallop or pounce cycle, render it to a yaw×frame sheet with a tool in
`tools/`, ship the PNG. No runtime cost at all, and the motion is animator-made
instead of hand-guessed.

`tools/turnsheet.cjs` already does the hard half of this (keying, gutter
detection, never mirroring against the fixed key light) and `playwright` is
already a devDependency, so a headless Three.js render is a tool, not a rewrite.

---

## 1. Movement code

### Yuka — the one worth taking
<https://github.com/Mugen87/yuka> — **MIT**, standalone, no dependencies, engine
independent. Verified downloadable: `yuka@0.7.8` minified is 123,214 bytes.

It gives, in one file: steering behaviors on a vehicle model (seek, flee,
pursue, evade, wander, arrive, obstacle avoidance, separation/alignment/
cohesion), **state-driven and goal-driven agents**, graph search and navmesh
navigation, perception with vision and memory, fuzzy logic, and JSON
serialisation of the whole agent.

Why it fits: `wolves.js` already runs *patrol → gather → commit → be winded*,
and the Alpha *calls the pack in*. That is a state machine plus flocking
separation plus a perception radius — three things written by hand here and
three things Yuka ships. The flock in `eagle.js` is the same story one axis up.

**The cost, stated honestly:** 123 KB into a bundle whose whole design is that it
is one self-contained file, to replace code that already works. Worth it if the
pack behaviour is going to get deeper (more members, real avoidance, the tamed
pack following her through rooms); not worth it to reproduce what `wolves.js`
does today.

### Smaller, if only the flock needs it
- <https://github.com/hughsk/boids> — **MIT**, tiny, 1,000 boids at 60 fps.
  Separation/alignment/cohesion and nothing else.
- <https://github.com/qiao/PathFinding.js> — **MIT**, grid A*/JPS, if room
  navigation ever outgrows patrol lines.

### Procedural legs
- <https://github.com/OnlyShoky/Procedural-Animation> — FABRIK inverse
  kinematics driving a lizard walk, a snake slither and a fish swim in
  JavaScript. Read it as a method, not a dependency: FABRIK is ~40 lines and
  terrain-adaptive feet are exactly what a four-legged machine on broken floor
  wants.

### Deliberately not recommended
- **Celeste's player controller** is public to read but carries no licence —
  reading it is fine, copying it is not.
- **Godot and Unity platformer controllers** (coyote time, jump buffering) are
  mostly MIT and worth reading, but they are engine code; the value is the
  constants and the ordering, not the source.
- **DragonBones** — the JS runtime is MIT, but the editor is discontinued and
  its download is dead. Do not build a pipeline on a tool nobody can install.
- **Spine** — proprietary, per-seat licence.

---

## 2. Animals — 2D sprite sheets

### Animated Wild Animals — the closest thing to a drop-in
<https://opengameart.org/content/animated-wild-animals> — ScratchIO, **CC0**.
Downloaded and measured (`All.zip`, 24,173 bytes):

| Animal | Sheets | Measured |
|---|---|---|
| Wolf | Walk / Run / **Howl** | 512×40 (8 frames), 384×40 (6), 640×40 (10) — cells 64×40 |
| Bear | Idle / Walk / Run | 40 px tall |
| Boar | Idle / Walk / Run | 40 px tall |
| Fox | Idle / Walk / Run | 40 px tall |
| Deer | Idle / Walk / Run | 52 px tall |
| Rabbit | Idle / Hop / Run | 26 px tall |

True side view, real gaits. **The wolf has a howl cycle** — which is the Alpha
calling the pack in, already drawn.

**The catch, and it is the whole catch:** these are 40 px tall and flat-shaded.
The game's authored plates are 70–313 px with a fixed key light and painted
volume (see `eagle.js`'s part table). Dropped in as-is they would read as a
different game. **Use them for the motion — pose order, frame timing, weight
transfer — and paint over.** That is legitimate and CC0 permits it outright.

### Others, verified
- <https://opengameart.org/content/forest-animals-sprite-sheet> — Vomdrache,
  **CC0**. Wolf, bear, rat, boar, from the Rising Spire RPG.
- <https://opengameart.org/content/cc0-2d-platform-creatures-characters> —
  josepharaoh99, **CC0**. 50+ animated sprites built for side-scrollers: birds,
  bats, spiders, slimes, robots, 25×25 to 64×64.
- <https://opengameart.org/content/lpc-bears-deer-lions-and-more> —
  tapatilorenzo, **CC-BY 4.0** (attribution, *not* share-alike, so it clears our
  rule with a credit line). Bears, deer, fox, lion, shark, at 64×64.
  **Two warnings:** parts are adapted from Sevarihk and keep their own
  attribution, and LPC art is four-direction top-down, so it does not fit a
  side-scroller without redrawing. **LPC as a project is mixed-licence — much of
  it is CC-BY-SA 3.0 / GPL. Check every LPC submission individually; most of
  them we must refuse.**

---

## 3. The hero — 2D sprite sheets

- <https://luizmelo.itch.io/martial-hero-2> — **CC0**, confirmed on the page
  ("can be used freely and commercially"). 33×56 character with idle 4, run 8,
  jump 2, fall 2, attack 4 + 4, take-hit 3, death 7. luizmelo's other packs
  (Huntress, Evil Wizard, Fire Warrior) are the same terms and the same hand.
- **ansimuz** — already the source of the Odyssey hero. <https://opengameart.org/users/ansimuz>
  His Sunny Land and Warped metroidvania packs are CC0 and come from the same
  hand as `gothic-hero-*.png`, so the silhouettes and the frame timing already
  match what is on screen. This is the lowest-risk place to widen the hero's
  move set — a dodge, a wall-slide, a ledge-grab in his timing.

---

## 4. 3D rigs — as bake material, not as runtime

All CC0, all free commercially, none requiring attribution. Feed these to a
`tools/` baker that renders yaw×frame sheets like `driller_12x6.png`.

- **Quaternius, Ultimate Animated Animal Pack** —
  <https://quaternius.com/packs/ultimateanimatedanimals.html>. **CC0**. 12
  animals, **12+ animations each**: walk, run, gallop, jump, attack, kick,
  death. FBX / OBJ / Blend / glTF. Distributed through Patreon early access
  before it lands free — check the itch page if the link asks for money.
- **Quaternius, LowPoly Animated Animals** —
  <https://quaternius.itch.io/lowpoly-animated-animals>. **CC0**, free
  (name-your-price, set 0), 6.6 MB, FBX/OBJ/Blend. Death, idle, jump, run, walk.
  *Verified caveat:* commenters report not every listed animation is present in
  the download. Open it before planning around it.
- **Quaternius, Universal Animation Library 1 & 2** —
  <https://quaternius.itch.io/universal-animation-library>. **CC0**, 120+
  animations on a universal humanoid rig, built for retargeting: locomotion in
  every direction, combat, emotes. This is the hero's move set, free, authored.
- **CMU Graphics Lab Motion Capture Database** — <http://mocap.cs.cmu.edu/>,
  free for commercial use, 2,548 human motions. BVH conversions by cgspeed:
  <https://sites.google.com/a/cgspeed.com/cgspeed/motion-capture>. Real mocap,
  but it needs a rig and retargeting before it is worth anything here.

### Refused, with reasons — do not revisit
- **Mixamo** — free to use, but Adobe-licensed and **not open source**;
  redistribution of the files is restricted. Fine for a hobby build, wrong for a
  Steam release that has to declare its provenance (`docs/STEAM.md`).
- **AMASS / SMPL / SMPL-X mocap** — **research licence only, no commercial
  use.** The largest and most tempting mocap corpus on the internet, and it
  would poison the release. Same trap as the share-alike knight pack.

---

## 5. What I would actually do

1. **Take the wolf's motion, not the wolf.** Six-frame run, eight-frame walk,
   ten-frame howl, CC0, side view, already timed. Repaint at the game's scale
   and the pack reads as animal instead of as machine-with-legs.
2. **Bake one Quaternius animal into a `cols × rows` sheet** with a new tool
   beside `turnsheet.cjs`, and see whether an authored gallop beats the current
   coil-and-pounce plates. If it does, that pipeline feeds every creature in the
   game and costs the player nothing at runtime.
3. **Leave Yuka alone until the pack gets deeper.** It is the right library and
   it is the wrong 123 KB today.
