# HOW A CHARACTER MOVES — the study behind her walk and run

The owner, 2026-09-05: *"the dynamics of movement is so bad. How can I make
you study how a character should move?"* — and, reading the state sheet:
*"These are multiple moves instead of single one like walking and running."*

This is that study, written so its conclusions are numbers the harness holds
(`tests/gait.cjs`) rather than adjectives. It separates what CODE can fix
(cadence, foot-plant, registration, the walk/run split) from what only ART can
fix (the cycle itself), because the second half of the owner's sentence is the
diagnosis: a gait is ONE move, and she has never had one.

## 1. What a gait is

A walk or a run is a LOOP of one stride — both legs, back to the start — and
animators key it at four positions per leg:

| key | what the body is doing |
|---|---|
| **contact** | front heel down, back toe still touching; the widest the legs get |
| **down (recoil)** | weight lands, knee bends, body at its LOWEST, arms at their widest swing |
| **passing** | feet cross under the hips, body rising, the free leg bent |
| **up (high point)** | pushed off the back toe, body at its HIGHEST, the free leg swinging forward |

Eight keys per stride (four per leg), and the in-betweens between them are
what reads as weight. The run is the same four keys with an AIRBORNE moment
after the up — both feet off the ground — a longer stride, a forward lean of
the whole spine, and the arms driving instead of swinging.

What she has instead: **walk** = three stills (contact, passing, opposite
contact — no down, no up); **run** = two stills (contact and passing, the
third benched off-model). No recoil, no rise, no lean change, no arm cycle.
Each cell is a drawing of a *pose*, fired on its own; they were never one
move. Flipping between them at any rate is a flipbook of poses, and the eye
reads that as "the order of the art work is mixed up". Two cells cannot be
un-mixed by code, because the frames between them do not exist.

## 2. What the numbers say for her

She is 60 world units tall (`HERO_DH`). The floor speeds are 340 px/s at the
run (`speed()`), 185 at the pad's walk (`PAD_WALK_VX`), and the walk/run
split is 210 (`HERO_RUN_VX`). Her painted contacts put her soles 23 units
apart (`HERO_STEP_WALK`, measured off `walk_a` / `walk_c`); the run step is
that scaled by 1.6 (38) because the run cells hold no contact to measure.

Speed over step is the footfall rate the plates ask for:

| gait | speed | drawn step | beats/s asked (½ step each) | steps/s |
|---|---|---|---|---|
| walk | 185 | 23 | 8.0 | 4.0 |
| run | 340 | 38 | 8.9 | 4.5 |

A human walk turns over about 2 steps a second (4 beats); a sprint 3–3.5
(6–7 beats). **Both her gaits were asking for a rate faster than a sprinter's
legs, and almost the SAME rate as each other**, so the walk did not read as a
walk — it read as the run's strobe at a lower speed. This is what was left of
"the dynamics" once the skating (`HERO_STEP_WALK`), the head strobe
(`HERO_REG`), the backwards cell (`HERO_CELL_MIRROR`) and the airborne
flicker (the coyote guard in `heroState`) had each been found and fixed.

Why it happens: she moves at 3–5.7 body heights a second, which for a human
is a fast run to a sprint, but her drawn walk stride is 0.38 heights — a
walking stride. The speeds are the game's (tuned for rooms and fights); the
stride is the art's. They cannot both be honest at once, and every 2D action
game resolves that the same way:

> **Pick the cadence a body can produce; let the ground slip; hide the slip
> in a long drawn stride.**

Hollow Knight's Knight covers roughly seven of its own heights a second on a
run loop of about 2.5 strides a second — it "slides" nearly three heights per
step and nobody sees it, because the loop is a real run with legs flung wide.

## 3. What code does now (and holds)

- **Cadence is capped per gait** (`HERO_CADENCE`, walk 5 / run 7 beats/s),
  softly (`tanh`) so the rate still climbs with speed inside a gait. Measured:
  walk 4.6, run 6.0. `tests/gait.cjs` holds both bands and that the walk is
  slower-footed than the run.
- **The stride phase is advanced by speed, not time**, and freezes in the
  air; the foot-plant lock and the head registration ride on it.
- **The pad walks until the stick is clicked** (`RUN`, L3), so the walk cells
  are reachable on a controller at all.
- **A slot for the real cycles exists** — `HERO_GAIT` in `js/entities.js`,
  indexed by `stridePh % 4` over the strip, falling through to the pose cells
  while its `cells` is 0. Fire the loop and it plays; nothing else changes.

## 4. What only art can do — the brief is `docs/ART_QUEUE.md` §2au

Two takes, treadmill, locked camera, her walk's three-quarter profile facing
right, one full stride each, cut by content (`tools/vidstrip.cjs auto:12`):

- **walk cycle** — the four keys per leg above, upright spine, arms in a
  small counter-swing, head level (no bob larger than a few percent of her
  height — the game adds none).
- **run cycle** — lean the whole spine 10–15° forward, an airborne moment
  after each push-off, feet spread AT LEAST her body height at contact (this
  is the long stride that hides the slip), arms driving, the scarf trailing.

Keyed as `gaitWalk` / `gaitRun`, `k` measured by `tools/swingk.cjs` against
`walk_a` / `run_a`, cells filled in `HERO_GAIT`. When they land, the walk and
run stop being poses and become the moves the owner asked for.
