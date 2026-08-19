# THE DRAWN CAST — a style branch, not a fork

**Why this exists.** The owner asked for two versions of the game to choose
between: the cast as it ships today (3D renders) and the cast redrawn by hand,
Hollow Knight's craft applied to our own characters. This branch holds the
second one.

**IT CONTAINS ART ONLY.** No code change, no gameplay change, no engine
divergence — same build, same rooms, same collision, same tests. That is a
deliberate constraint against the ONE BRANCH order in CLAUDE.md, which exists
because a side branch once cost a full merge with conflicts in both built pages.
Keeping the code identical means choosing a winner is a FILE COPY, not a merge:
either the drawn sheets replace the rendered ones at the same paths, or this
branch is deleted and nothing else has to be unpicked.

**The geometry contract from ART_QUEUE §1f binds every plate here:**

| family | sheet | rule |
|---|---|---|
| the protagonist | 22-cell state sheet + 8-yaw turnaround | the cell grid is addressed by INDEX — same cell, same size, same footprint on the floor line |
| the guardians | six parts atlases | addressed by ABSOLUTE PIXEL RECT. A part that moves 3px dislocates the rig. Re-fire PART BY PART, back into its own rect |
| NPCs + creatures | npcs / roster atlases | same cell-grid rule as the protagonist |

**And her eyes stay unbaked** (ART_BIBLE §2). Two lights carry every expression
she has; a baked expression gives her one face per pose forever. Every drawn
cell goes through `tools/heroeyeclean.cjs` after placement, and the order
matters — place, re-measure anchors into `tools/heroeye.json`, THEN clean. Run
against a stale anchor it once painted over her scarf.

## The hero, fired — style A (broken ink), 2026-08-18

The owner picked **A** from the three-hand trial: a fine dark contour that
BREAKS — thickening on the shadow side, tapering to nothing on the lit side —
over three or four flat steps of value, matte with a dry-brush grain, the red
scarf the one saturated note.

All 22 state cells are fired and keyed: `assets/source/hero/drawnA/`, and the
sheet to judge them by is `docs/drawn_hero_styleA.png`. They are NOT placed
into `assets/characters/hero/states.png` yet — that waits on the owner's word,
and then the order is: place → re-measure anchors into `tools/heroeye.json` →
`tools/heroeyeclean.cjs`.

**What the firing taught, so the rest of the cast does not re-learn it:**

- **Framing must be the loudest line, and it still drifts.** Pass 1 zoomed
  `rise` and `apex` to twice their neighbours' scale. Anchor scale is not
  something to argue with a generator about — normalise it at composite time
  against the source cell's own bounding box.
- **The field cannot be won by prompting.** Told "flat black, no ground", the
  model paints an ink wash; told it louder, it paints a WHITE PAPER BORDER with
  a brushed black rectangle inside. Pass 2 was worse than pass 1 on exactly the
  thing pass 2 was fired to fix. Stop negotiating and key it.
- **The style fights the keyer, by design.** A contour that deliberately breaks
  is a doorway: a border-in flood walks through the gap and eats the torso while
  the outline survives. `tools/inkkey.cjs` closes what is boxed in on all eight
  sides — the colour is still in the plate, only the alpha was wrong.
- **"Biggest component" is not "the character".** The FINISHER pose keys into
  1205 pieces, the largest of them 58k px — one half of her cape. Spatter is
  what is small AND clear of the mass; either alone is innocent.

Three tools landed with this and are branch-neutral — they belong on the main
branch whichever cast wins: `tools/contact.cjs` (a labelled contact sheet of any
plate directory), `tools/inkkey.cjs` (the keyer above), `tools/alphastat.cjs`
(coverage, subject box, and whether the frame border survived the cut).

## The rest of the cast, fired — 64 plates, 2026-08-19

Every enemy, every machine, the duelling sage and all seven NPCs are redrawn in
the same broken-ink hand: `assets/source/cast/drawnA/`, judged in
`docs/drawn_cast_beasts.png` and `docs/drawn_cast_rest.png`.

| family | plates | what it is |
|---|---|---|
| alpha | 10 | the armoured pack leader |
| cheetah | 7 | the fast one |
| wolf | 7 | the pack |
| bat | 5 | the ceiling |
| breaker / kiln / rime / snare | 12 | the four machines |
| sage | 6 | the duellist that can only be cleansed |
| eye | 10 | the Eye's five, each in rest and wind-up |
| npc | 7 | the busts and Ratchet at his bench |

**The telegraph amber survived the restyle, and that was the point.** These
plates are not decoration: `tests/artbible.cjs` measures that a wind-up raises
the amber above that creature's own rest, because it is how a player reads what
is about to hit them. A style pass that says "desaturate everything" silently
deletes the game's warning system. So every prompt carries the lights as an
explicit EXCEPTION to its own colour rule, named per plate — the amber blaze on
a wind-up, the red seams on a resting body, the cold blue on the frost machine,
and, on `alpha_free`, `kiln_spent` and `snare_limp`, an equally explicit
instruction NOT to add a glow those poses do not have.

**What the cast pass added to what the hero pass taught:**

- **The model draws graphic furniture.** Black wedges, bars and triangles behind
  the subject, and floating chips of debris beside it. No keyer can tell those
  from the creature's own dark plate — they are drawn, not field — so they have
  to be banned in the prompt, and six plates were re-fired to do it.
- **One keyer setting does not fit every plate.** The walk tolerance that cuts a
  dark beast cleanly hollows out a pale robe, and the one that keeps a pale robe
  whole leaves a wedge attached to a dark machine. `tools/inkkey.cjs` takes the
  step as an argument for exactly this: 11 for pale subjects (the sage standing,
  Servo, Lumen), 20 by default, 32 where a dark shape needs reaching into.
- **Fragment count is not a defect signal.** `finisher` keyed into 1205 pieces
  and `wolf_runb` into a handful; both were whole afterwards. What matters is
  whether the pieces are near the mass, not how many there are.

**One plate still needs a hand: `npc__servo`.** Fired three times, including
once with the composition rule as the loudest line and a demand for margin on
all four sides, and it comes back with the chin running off the bottom edge
every time. Everything else in the set framed correctly.

## The guardians — NULLFANG done, and how the rig is kept, 2026-08-19

A guardian is not a picture, it is a RIG: `BEAST_P` and its five siblings
address the atlas by absolute pixel rect, and a head that comes back four
pixels taller is not scaled — it is drawn from the same rect, and the animal
comes apart at the neck. No prompt can promise that. So the promise is made
mechanically instead, by two tools:

- **`tools/rigcut.cjs`** reads the rect table out of the source itself (never a
  copy that can drift), cuts each rect onto flat black with padding, and
  records the part's own outline.
- **`tools/rigpaste.cjs`** puts each restyled part back by FITTING ITS BOX to
  the box the original occupied, then CLIPPING IT to the original silhouette.
  Whatever the generator did to scale, position or outline is undone. The cost
  is that the new ink contour lands a pixel inside the old edge instead of on
  it; that is invisible at play size, and a leg four pixels out is a broken boss.

Both tools MEASURE what "empty" means on the sheet rather than assuming it —
some of these atlases are alpha-cut and some are opaque with black between the
parts, and guessing wrong fails in opposite directions: an alpha test on an
opaque sheet marks every pixel as part, and a tone test on an alpha sheet eats
every dark plate the creature has. Getting this wrong the first time put an
opaque black box around all sixteen of NULLFANG's parts.

**NULLFANG is done and verified in the game**, not on the sheet:
`docs/drawn_nullfang.png` is its own `draw()` in its own room, in four states.
`tools/bossshot.cjs` takes that photograph, and draws to a bare canvas rather
than screenshotting the room — the first version photographed the room and
produced four frames of a tutorial panel with the boss behind it.

Green afterwards: `artbible`, `tells`, `daze`, `bosspace`, `lowres`, `platform`.
The lowres harness matters most here — it re-derives, from the source, that no
sheet addressed by absolute pixel rect gets a small copy, and it still names
all six guardian files.

Fragments restyle less reliably than whole figures, and that is worth knowing
before the next five: `full`, `aIdle`, `aWalk`, `aRoar` and `aAtk` came back
excellent, while `body` was returned as a small whole lion and `fleg0` as a
cylinder. The box-fit and the clip make even those usable, because what
survives is the surface, not the shape.

## Three guardians drawn, and two more things the rig taught

NULLFANG, TALONHOST and GLACIERE are redrawn and verified in the game:
`docs/drawn_nullfang.png`, `docs/drawn_talonhost.png`, `docs/drawn_glaciere.png`.
Green after all three: `artbible`, `tells`, `bosspace`, `daze`, `lowres`,
`platform`.

**The allowance has to scale with the part.** A clip to the exact old outline
shredded GLACIERE — her standing assembly and her gallop both drifted slightly
inside their boxes and came back as fragments without a head. But a flat 3px
was wrong the other way: real on a 70px leg, nothing on a 445px figure. It is
now 5% of the part's short side, floored at 3px, so a leg keeps a tight seam
because it must meet a neighbour, while a whole-figure panel — which meets
nothing and is placed by its own anchor — gets the room a redrawn pose needs.

**Some entries in these tables are not parts at all.** `mane` and `tailW` are
not pieces of GLACIERE; they are CROPS of her `hero` figure, windows the effect
pass looks through. Fired as if they were their own drawings they come back no
longer lining up with the figure they were cut from, and pasting them stamps a
mismatched rectangle over the animal — which is how her head spent three rounds
behind a black wedge. `rigpaste` now detects any rect that lies wholly inside
another and RE-CUTS it from its parent's new pixels instead of firing it. Pure
geometry, read from the table, nothing to keep in step by hand.

**Two defects the owner should know about rather than find:**

- **GLACIERE still carries a dark wedge at the chest.** Three re-fires of the
  parts around it did not shift it. It reads as a dark armour plate at play
  size rather than as damage, but it is not what the original had, and her tail
  now sits shorter than its anchor expects.
- **`npc__servo`** still frames with its chin off the bottom edge (see above).

THE CHOIR, PRISM and MOTHER-V still wear their rendered art. The pipeline that
does them is built, tuned and proven on three: cut with `rigrects` + `rigcut`,
fire, key with `inkkey`, put back with `rigpaste`, photograph with `bossshot`.

## ⚠ INTEGRATOR FINDING, 2026-08-19 — two of the last three are not usable yet

The code session merged the shipping branch in and photographed all six
guardians through their own rigs. **Four read; two do not**, and the harnesses
cannot see it — all 45 are green on this branch, which is the important part of
this note rather than an aside.

| guardian | verdict |
|---|---|
| NULLFANG | good |
| TALONHOST | good |
| GLACIERE | usable, with the chest wedge and short tail already logged above |
| PRISM PROWLER | `idle` and `pounce` are good; **`aim` and `beam` come apart** into disconnected fragments |
| THE FURNACE CHOIR | **lost.** He assembles as a featureless black egg with two amber dots — no head, no wings, no tail, no limbs |
| MOTHER-V | tendrils and crown read; **the central shell is a flat black disc with two dots** |

**The CHOIR is the clearest case and the one to debug first.** Shot side by side
from the same tool: rendered, he is a full mechanical dragon with lit wings, a
segmented neck and a burning tail. Drawn, he is an egg. That is not a restyle
that came back ugly — it is a keyed-out plate, the same failure mode
`tools/inkkey.cjs` was written for, landing on the body parts instead of the
field. MOTHER-V's shell is the same signature at smaller scale.

**Why green tests missed it, and this is worth fixing in the harness.**
`tests/artbible.cjs` asks three things of a guardian: do its states differ in
SHAPE, does a wind-up raise the amber above its own rest, and are its feet on
the floor. A black egg with an animated lava ring and two amber eyes passes all
three. Nothing in the suite asks whether the animal still has the parts it is
made of. The measurable version of that question is INTERNAL CONTRAST inside
the silhouette — a rig assembled from twenty drawn parts cannot be one flat
value — and it belongs in `artbible` before the next restyle, because it would
have caught this and it will catch the next one.

Everything else on this branch is sound and merged up to the shipping branch, so
re-firing the CHOIR's and MOTHER-V's body parts and PRISM's `aim`/`beam` rects
is all that stands between this and a complete cast.

### Answered, same day — and the harness gap was real

Photographed again after the re-fires, from the same tool, and the sheets are
in `docs/`:

- **PRISM's `aim` and `beam` were real and are fixed.** Seven of its forty-five
  frames came apart, and every one of them was a whole-body pose while every
  walk and run frame was clean. Re-fired anchored on the original frame.
- **THE CHOIR assembles as a full mechanical dragon** — head, neck, four limbs,
  both wings, burning tail — in all four states. What made him read as an egg
  was the photograph, not the plate: `bossshot` was shooting at GAME scale, and
  a 62×74 boss in a 560 px cell is a dark speck with two lit dots whatever it
  is made of. It now measures a zoom and applies it before `draw()`.
- **MOTHER-V's dark disc is her design, not a keyed-out plate.** Shot with the
  ORIGINAL atlas she has the same flat dark circle: she is built cold-around-warm
  so the one golden core reads as the only living thing in the room
  (`js/mother.js`, first paragraph). The drawn version is brighter than the
  rendered one, not darker.

**The suggested check was worth writing and is now in the suite.** `artbible`
asked whether states differ in shape, whether a tell wears the amber and whether
the feet are down — and a flat blob with two eyes and a lava ring passes all
three. It now also asks whether the silhouette still has PARTS: bucket the lit
pixels into eight value bands and require at least three of them to carry real
area. A rig assembled from sixteen drawn pieces cannot be one flat value, and
that is measurable without looking.

## All six guardians, and the art book — 2026-08-19

THE CHOIR, PRISM and MOTHER-V are redrawn, which finishes the cast: 22 hero
cells, 64 cast plates, six guardian sheets, 131 archived rig parts. The book
that shows all of it is `docs/artbook.tpl.html` + `tools/artbook.cjs`, and the
tool derives its own image tier the way `tools/lowres.cjs` does — crop each
1024 cutout to its own alpha box, fit it to a short edge, encode webp — so a
page that would have been 90 MB of masters is 4.4 MB and opens on a phone.

**The crop is what makes the book readable, not the encode.** A 1024² plate of
a bat is mostly nothing; without cropping to the ink, ninety plates in a grid
are ninety stamps floating in ninety empty squares.

**A photograph of a guardian is a measurement, and it needed three fixes.**
`tools/bossshot.cjs` now:

- **Zooms before it draws, not after.** These animals are 46–120 px tall in a
  560 px cell; at game scale the contact sheet was a row of specks. Scaling the
  CONTEXT means the atlas is sampled larger and the plate is sharper, where
  scaling the finished bitmap only blurs it. One zoom for the whole sheet,
  taken from the largest pose, so a crouch still reads smaller than a roar.
- **Lets the mass set that zoom, not whatever reaches furthest.** TALONHOST
  hangs from a cable that runs off the top of the cell. Measured naively the
  hairline set the scale and photographed the eagle as a speck under a thread;
  rows and columns are counted first and a line of one or two pixels gets no
  vote.
- **Clears the boss's draw-side memory between cells.** Guardians hold a pose
  for a beat after the state has moved on — that is what makes a roar land.
  Photographing states back to back leaves that memory primed, and the measure
  pass primed it for the render pass: all four cells of THE CHOIR came out as
  the same reared figure.

**THE CHOIR's feet were never the art.** `artbible` failed at exactly +11 px on
two unrelated states, and a constant that identical is never a drawing. It was
his lava ring — floor decoration spreading 20 px past his claws — being
measured as his lowest lit pixel. `G.artProbe` exists to switch exactly that
off and the ring was never gated: the old plate's lower half was too dim to
pass the lit test, so a brighter plate turned an old hole into a failure.

**Both disclosed defects are gone.** GLACIERE's dark chest wedge and her
detached tail were `body`, `asm` and `hero` coming back broken, not a rig
problem. Re-fired with the failure named in the prompt — *the tail is attached,
draw the join; the torso is solid, there is no hole* — and `hero` re-pasted
with a wide allowance, because a whole-figure panel meets no neighbour and
clipping it to the old outline is what cut the tail off in the first place.

**PRISM had seven bad frames out of forty-five**, and only whole-body ones:
`i_beam`, `i_burst`, `i_hurt`, `i_roar_0`, `i_roar_2`, `i_slash`, `p_turn` came
back as scattered fragments while every walk, run and idle frame was clean. Fragments
restyle worse than figures, and a reared pose is read as fragments. Re-fired
anchored on the original frame with the connection named — *one connected
animal, no detached floating pieces* — and all seven landed.

**Still open, and it is one plate: `npc__servo`** frames with its chin off the
bottom edge. Four firings, including one with composition as the loudest line.

### CORRECTION TO THAT FINDING (integrator, 2026-08-19)

Two of the three were real and are fixed; **one of them was my error and the
art session should not spend a credit on it.**

- **THE CHOIR is whole.** He assembles as a full drawn mechanical dragon —
  head, wings, segmented neck, burning tail, orange plating. The egg is gone.
- **PRISM's `aim` and `beam` are whole.** Both read as the animal firing,
  not as fragments.
- **MOTHER-V's shell was never broken.** Photographed side by side from the
  same tool, her core is a near-black sphere with two violet eyes in the
  RENDERED build too — it is her design, not a keyed-out plate. I called it a
  defect from the drawn shot alone without shooting the original to compare,
  which is the same mistake this file warns about in the other direction: judge
  the assembled rig, and judge it against what it is supposed to look like.

So the drawn cast is complete: six guardians, all six assembling correctly.

The parts check has moved to the shipping branch, where it guards the rendered
cast too. Measured there on art it was not written for: NULLFANG 5 bands,
TALONHOST 5, THE CHOIR 5, GLACIERE 8, the five constructs 5-6, against a floor
of 3. Worth knowing for the next restyle: it is a whole-silhouette measure, so
it would NOT have caught a flattened MOTHER-V shell if that had been real —
her tendrils and crown carry enough bands on their own. A per-part version is
the stronger check if one is ever wanted.
