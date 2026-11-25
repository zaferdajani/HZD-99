# A new species gets its whole move set before it is wired

**The owner's rule, 2026-11-22:** "From now on, when you create a new species
enemy, it all needs to have complete artwork concept, and then you adjust
accordingly. So you have to have a template for each function: dying, hitting,
defending, jumping, crouching, etc. So you have to see all the movements possible
and create artwork for it. It's a rule."

What brought it on: MIREJAW shipped with his signature death roll cut out of his
collapse take (the roll take came back as a twist and was refused), his daze
borrowed from his hurt cells, his wind-up drawn with his swim, his opening drawn
with the last cell of his bite. Each looked like a different move only to code.

## The template: every function, its own art

Every new enemy species is fired, in Higgsfield, with a take (or a sheet) for
each of these before its fight is built — then the fight is adjusted to the art:

| function | what it is | what the template asks the model for |
|---|---|---|
| `idle` | standing, breathing | the rest it returns to between moves |
| `walk` | its slow gait | the species' real gait, a short distance, in frame |
| `run` | its fast gait | the gallop, sprint, bound — whatever the animal really does |
| `turn` | turning round | the body coming round through three-quarter views, never a mirror flip |
| `notice` | it sees her | head up, the alert, the first sound |
| `crouch` | the wind-up | the coil before the strike: this is the tell |
| `attack` | each strike, one take per move | the move itself, committed |
| `jump` | leaving the ground | take-off and air |
| `land` | meeting the ground | the impact absorbed |
| `defend` | guarding | a block, a threat display, a dodge — what the animal does |
| `hurt` | hit | the flinch |
| `daze` | staggered | the long opening, dizzy, swaying |
| `die` | going down | the collapse |
| `dead` | lying still | may be the last frame of `die` — the one allowed alias |

Plus the species' own: its **signature** (named), and its element — `swim`,
`rise`, `dive` for a swimmer, `fly`/`glide` for a flyer, `roar` for a boss's
phase.

## How it is held

- `assets/movesets.json` lists every species: each function, the strip it is
  drawn with, and the Higgsfield job it came from. A species marked `"rule": true`
  (every species from 2026-11-21 on) must have every function, each its own
  strip on disk, each strip drawn by the game, no strip standing in for two
  functions (only `dead` may be a frame of `die`).
- `tests/species-moveset.cjs` fails if any of that is not true.
- Older species are listed with `"rule": false` and what they lack, as an audit.

## Procedure

1. Fire the design still (side view, the facing the engine draws, flat black,
   no rim light).
2. Fire one take per function from that still (Kling 3.0 Turbo start frame, 5 s,
   locked camera, black background — the croc's prompts in
   `assets/source/swamp/jobs.json` are the pattern). Two tries for anything hard
   (a roll, a turn); a refused take is recorded, never shipped.
3. Deliver with `tools/lion-studio.py` (same `--envelope`, `--cell`, `--grade`
   for the whole species), add the keys to `js/media.js`, write the manifest row.
4. Build the fight on the art: every state names the function it draws.
5. Show the owner the move set as a CLIP, never a sheet of stills.
