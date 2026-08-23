# THE GENERATION QUEUE

Briefs that are **written and ready to fire** but whose plates do not exist yet.

This file exists because of a specific waste: when the art connector is not
bound to a session, the work does not have to stop — the expensive part of
generating a plate is deciding exactly what it must be, and that can be done
without a connection. Everything below is finished thinking. Firing it is one
tool call per entry, with the reference named in the entry attached.

**Rules that apply to every entry here** (ART_BIBLE.md §3.2): pure black
background, subject only, no ground plane, no cast shadow, palette named in
words, negatives stated. After it comes back: key it with
`tools/blackkey.cjs`, crush it with `tools/img-crush.cjs`, archive the source
in `assets/source/`, wire it, photograph it, and run `node tests/run.cjs`.

---

## 2w. THE SWING IS A POSE, NOT A MOVE — every attack snaps still-to-hit ✱ DIAGNOSED 2026-08-23 (art session)

**The owner's words:** *"The act of scratching and hitting with a sword need to
be dynamic more. It's not an image that shows hits as images. It should
transition in milliseconds from one frame to another showing like a cartoonish
slash or hit with a sword. And this is a standard for all sword moods and the
slash. What you're doing is three kind of hits with three moves that changes
from still to hit without transitions in between."*

**He is describing one line of code, and the same file already does it right for
the other game.** `js/entities.js`:

```js
// CLAWBYTE — one pose for the whole swing; swingVis.t is never read
if (this.swingVis) {
  if (this.swingVis.charged) return 'burst';
  return this.swingVis.combo >= 3 ? 'finisher' : this.swingVis.combo === 2 ? 'claw_2' : 'claw_1';
}

// NOSTOS — six frames stepped across the swing
key = 'heroAtk'; n = 6;
const p = clamp(1 - this.swingVis.t / this.swingVis.t0, 0, 0.999);
fr = Math.floor(p * n);
```

`swingVis` runs **240 ms** for an ordinary blow and 320 ms for a charged one.
For all of it her body holds ONE cell, then snaps back to idle. Three attacks,
three stills. That is the whole defect, and no amount of effect work covers it.

**And the mismatch makes it worse.** The blade's arc DOES animate —
`swAng = -1.5 + p * 2.7` sweeps the sword through the swing — so the weapon
travels while the body behind it is frozen. A moving blade bolted to a still
body reads as a sticker being dragged, which is why the sword feels faker than
the claw.

**THE ART THIS NEEDS, and why it is video and not stills.** Every attack wants
the classic four beats — anticipation, the SMEAR through the arc, contact fully
extended, recovery — at roughly 40 ms a frame, which is exactly the "milliseconds
from one frame to another" the owner asked for. Stills cannot deliver it: the
run pass immediately before this one asked the image generator five times, three
different phrasings, to move a limb from one place to another and it refused
every time, once returning a pixel-near copy of its own reference. The video
model does move limbs, and `tools/vidstrip.cjs` already cuts a clip into a
registered, bottom-aligned strip — that is how the five NPC work loops were
made.

`tools/vidstrip.cjs` gained a **time window** for this: an idle loop fills its
whole clip and can be sampled end to end, but a STRIKE is a fraction of one. The
generator is asked for several swings so at least one comes out clean, and then
exactly one of them is cut out. Sampling the whole clip instead gives six frames
spread across three strikes and two guards — a flipbook of unrelated poses.

**Four strips are wanted**, one per attack: `claw_1` (combo 1), `claw_2`
(combo 2), `finisher` (combo 3) and `burst` (charged). The wiring is the shape
`drawNPCLoop` already has and the shape `heroAtk` already has — index the cell
by `p` instead of returning one pose name — so the code owed to this is small
and the plates are the expensive part.

**Fire one, key it, look at it in play, then continue.** This is a §1f-class row:
four strips at six frames each is twenty-four drawings of the character the
player looks at all game, and a wrong call found at strip four costs all of them.

### ⚠ tests/folk.cjs "the strip advances while it plays" IS FLAKY — 3 in 5 (art session, 2026-08-23)

**Not caused by the run fix above.** Measured on `4b3afe9` itself, in a clean
worktree with that commit's own build and this change absent: **three failures
in five runs.** On the branch with the run fix it is the same rate, and the run
fix touches `states.png`, `HERO_REG`, `tools/herocell.cjs` and docs — nothing
the NPC job system reads.

The failing line, across runs:

```
FAIL ...and the strip advances while it plays  servo 22  mono  6  patch 19  sage  8  lumen  9
FAIL ...and the strip advances while it plays  servo  8  mono 13  patch 28  sage  6  lumen 16
FAIL ...and the strip advances while it plays  servo 21  mono 11  patch  0  sage 12  lumen 14
ok   ...and the strip advances while it plays  servo 25  mono 11  patch 12  sage  8  lumen 17
```

**It is asserting a floor on a quantity the design deliberately randomises.**
The commit that added it says so itself: bursts play "at a tempo re-rolled per
burst, with holds between", and `NPC_WORK` sets 3-5 fps for the sage against
9-14 for Patch-7. A fixed sample window over a re-rolled tempo with holds has a
low tail, and the low tail crosses the floor. `patch 0` in one run is the same
cause at its limit — the window closed inside a hold.

**This is the code session's to retune, not the art session's**, because the
floor encodes what the job system is meant to guarantee and only its author
knows which. Two shapes that would both keep the check honest: sample until
every body has been observed inside a burst rather than for a fixed span, or
assert per-character against that character's own `NPC_WORK` fps rather than one
shared number.

Worth fixing quickly rather than living with: this is a NEW check, it is the
one that caught real wiring rot, and a check that is red three runs in five is
one everybody learns to scroll past.

**FIXED by the code session, 2026-08-23.** The diagnosis above is right and the
measurement was worth more than the fix. Both suggested shapes were taken, and
there was a SECOND cause the art session could not have seen from the outside:

1. **It sampled a fixed window.** Now it accumulates only frames where that body
   is genuinely mid-burst (`work && hold <= 0 && play > 0`) and stops once it
   has seen 90 such frames. A hold is a designed pause, so counting it as
   evidence of a frozen strip was the check misreading the design. `patch 0` was
   a window that closed inside a hold, exactly as diagnosed.
2. **It asserted one shared floor.** Now each body is compared against its OWN
   `NPC_WORK` slowest tempo over the seconds it was actually seen playing.
3. **AND IT MEASURED NET DISPLACEMENT** — `|end - start|`. Bursts ping-pong on
   purpose (a stroke and a return), so a burst that runs out and back nets to
   nearly nothing while playing perfectly. It accumulates per-frame `|Δph|` now.

It cannot flake any more, and that is arithmetic rather than luck: the smallest
value the measurement can take is `fpsMin × playedSeconds`, and the floor is
0.9 of that same quantity. Six consecutive runs green, tightest margin 11%.

Thank you for measuring the rate instead of just reporting a red — "3 in 5, and
not from the run fix" is what made it a five-minute fix instead of an argument.

## 1i. THE RUN HAD NO CONTACT POSE ✅ FIXED 2026-08-23 (art session)

**The owner's report:** *"While the hero runs, you are only moving the back leg,
the one that is grayed out, which makes the other one seem as if it is just
sliding forward without actually running. As if we're standing on a scooter and
pushing with the other leg. That's why it looks fake."*

He was describing the cause, not just the symptom, and the sheet confirms it.
Counting the soles that sit near the floor line in each cell:

| cell | soles near the floor | sole-to-sole |
|---|---|---|
| `walk_a` | 2 | **69 px** |
| `walk_c` | 2 | **64 px** |
| `run_a` | **1** | 0 |
| `run_b` | **1** | 0 |

**The run had no contact pose at all.** Both run cells were single-support poses
with the SAME knee up, so the near leg never travelled and the only thing
changing between frames was one bent knee while the body slid forward. The walk
has a 69px stride to stand on; the run had nothing. js/entities.js had already
written the number down without drawing the conclusion: *"run_a and run_b span
20 and 18 cell-pixels — neither is a contact pose."*

**Fixed** by firing a real running contact into `run_a` — foot planted well
ahead of the body, trailing leg extended back and lifted. The cycle is now
contact → passing → contact → passing instead of passing → passing.
`HERO_REG.run_a`/`run_b` were re-measured with it: the new cell carries her
skull 0.045 of a cell further right than the pose it replaced, which is the same
size of head drift this table was built to cancel.

### THE GENERATOR WILL NOT SWAP TWO LIMBS — FIVE ATTEMPTS

`run_c`, the opposite contact, was asked for five times and refused every time:

1. as a described pose, from `run_a` — same leg leading;
2. as an absolute description naming which leg is dark and which is bright —
   same leg leading, and measurably so (forward mass 142.6 vs trailing 139.4:
   the two legs came back lit almost identically, so it had not swapped them,
   it had only opened the stride wider);
3. as an explicit "reverse the stride, the near leg goes back" instruction —
   came back a pixel-near copy of its own reference;
4. from `walk_c` as a pose template, asking only to convert a walk contact into
   a sprint without changing which leg leads — same leg leading;
5. with the head and lighting locked and only the legs described — same again.

**Mirroring the legs mechanically does not work either**, and it was worth
trying because that is the move that beat the black-margin problem
(`tools/replate.cjs`). A horizontal mirror of the leg band about the torso's own
axis SHOULD swap which leg leads and carry each leg's shading with it. It does —
but the cape and the pelvis do not separate on a horizontal cut, so every cut
line either mangled the scarf or left a seam at the hip. The tool was written,
measured, and deleted rather than shipped.

**This matters less than it looks, because of what the walk turned out to be
doing.** `walk_c` — the shipped "opposite contact" — ALSO leads with the near
leg (forward mass 153.1 vs trailing 96.2, the same sign as `walk_a`). The walk
has never had a true left/right alternation. It reads correctly because both
feet plant WIDE APART, not because the legs alternate. Wide contacts are what
sell a gait at this size. The run now has one.

### A FIRING CAME BACK WITH HER EYES OFF

The first accepted contact had an unlit visor — a dark empty lens where the rest
of the sheet carries two glowing cyan eye-lights. Cycled at 1:1 against `run_b`
that strobes her face on and off every other frame, which is a worse defect than
the one being fixed. Caught by laying the cycle out in play order rather than
looking at the cell alone, and re-fired with the glow named explicitly: the
replacement measures 79 against `run_b`'s 79.

**The lesson for the next pose fired into this sheet:** name the lit parts. The
identity lock in §1 lists silhouette, proportion, palette and costume, and the
generator honoured all four while quietly switching her eyes off — because
nothing in the brief said they were ON.

### WHAT IS STILL OPEN

`run_c` stays benched and the run stays two-beat. An on-model opposite contact
needs a source the generator cannot drift: a render from the model, or a hand
pose-over of `run_a`. The brief stays here.
---

## 1g. THE WORLD, DRAWN — 40 plates restyled, and the RULE that made it safe ✅ SHIPPED 2026-08-22 (art session)

**The owner's standing line for this pass:** *"the only change in the branch is
the artwork for the characters as drawings. also, the background should follow
those drawings alongside the floor and the walls and the terrain."* The cast,
the rock, the roofs, the strata and the backdrops went first. These forty were
what was left in 3D — the depth planes she stands on, the cave mouths, the
kingdom gates, the interiors, the NPCs' own places and the six guardian lairs.

Every one is **image-to-image from the plate already on disk**. Nothing here is
a new composition; the identity lock in §1 is not reopened.

### THE FINDING THAT SHOULD OUTLIVE THIS ENTRY

Told, in the loudest terms the prompt could carry, that *the black margins are
emptiness and must stay black*, the generator painted into them anyway.
Measured with the new `tools/alphacmp.cjs` on the eight terrain depth planes:
**seven of eight came back with a different silhouette**, and `edge_c` went
from 39% alpha coverage to 86% because it had filled the empty half of the
frame with a lava cavern and handed back a rectangle. A rectangle dropped into
a room does not read as bad art; it reads as a rendering bug.

Saying it louder is not the fix — that is the standing lesson of this pipeline
(NAMING A THING FORBIDS NOTHING). The fix is to stop asking:

> **`tools/replate.cjs`: RGB comes from the restyle, ALPHA comes from the plate
> on disk.**

which makes "restyle only" true by construction instead of true by inspection.
Alignment is arithmetic — the same 18% square padding `tools/plateprep.cjs`
applies, inverted — so it does not depend on the generator's framing either.
All forty plates then measured at **100% silhouette overlap** with what they
replaced. Every anchor, occluder rect and exit alignment in the game is
untouched, which is why this pass needed no code change at all.

### WHAT WENT IN

| group | plates |
|---|---|
| terrain depth planes | `edge_a` `edge_c` `fore_a` `fore_b` `fore_c` `fore_d` `fore_e` `fore_x` |
| cave mouths | `cave_mouth` `cave_exit` `cave_mouth_a`…`cave_mouth_e` |
| kingdom gates | `gate_city` `gate_foundry` `gate_archives` `gate_conduits` `gate_nest` `gate_deep` |
| interiors | `den_interior` `oracle_interior` `forge_interior` `carrel_interior` `hollow_interior` |
| the NPCs' places | `booth_front` `oracle_booth` `forge_front` `forge_table` `carrel_front` `hollow_front` `winch_house` |
| guardian lairs | `lair_den` `lair_nest` `lair_forge` `lair_peak` `lair_vault` `lair_cradle` |
| the monument | `mindnode_obelisk` |

**They came back DARKER, which the grammar wanted anyway.** `tools/platemeas.cjs`
measured every backdrop against the plate it replaces: mean luminance fell on
17 of 18 and blown highlights went from 33.4% of the frame to 0.0% on
`cave_mouth_d`, 9.0% to 0.6% on `carrel_interior`. Chroma fell too. §9.1 and
§9.4 are further from their ceilings than before this pass, not nearer.

**One refusal, and it was the owner's kind of refusal:** `cave_mouth_c` came
back with a small human figure standing in the cave opening — a person, in a
machine kingdom, in a plate the player walks up to. Re-fired with the picture
named as empty of life, and the second take is what shipped.

**The 3D masters are not archived to `assets/source/`** and deliberately so:
git already holds the exact bytes at `e48e2fd`. Duplicating six megabytes into
the tree to say "we kept the master" is weight for a claim git already makes.
`git show e48e2fd:assets/backgrounds/<name>` is the recovery path.

## 1h. FIVE WORK STRIPS, FIRED AND ARCHIVED — ⚠ THE CODE SESSION OWES THEM A DRAW SITE (art session, 2026-08-22)

**The art is done and shipped. It is not drawn yet, and that is deliberate —
read this before wiring anything.**

Five twelve-frame strips, cut from generated clips of each machine-person doing
its own job: the warden works its console, the archivist draws tape through its
hands, the tinker welds, the orrery turns, the nymph breathes light.

    assets/characters/npc/{servo,mono,patch,sage,lumen}/work_loop.png
    manifest keys: servoLoop monoLoop patchLoop sageLoop lumenLoop

`tests/npcstrip.cjs` measures all sixty cells through `drawStripCell` — every
cell draws a body, no two cells are the same cell, the feet hold to ±1px, and
the body does not pump. Green.

### WHY THEY ARE NOT WIRED, and it is the protocol working rather than failing

This session fired these against the owner's *"npc movements looks as a its a
slide show gif"*. **The code session was solving the same complaint at the same
time, and got further:** `NPC_JOB` gives all six bodies a job on the six-angle
turntable with eased turns, and `TINKER_JOB` / `tinkerTask` plays Ratchet's
strip in bursts with varying tempo, ping-pong and a phase that never resets —
because the owner had already come back with *"the loop where I see the NPC
working is somewhat short... make it not repeat"*, which is a verdict on any
fixed-rate cycle, including the one this session had written.

So the art session's own `drawNPCLoop` was **dropped on the rebase, on purpose.**
A flat 12-cell strip at a fixed 10 fps is the thing the owner has already
rejected once, and `NPC_JOB` and the task machine are game logic — which
CLAUDE.md puts with the code session, not this one. Two draw paths competing
for the same five bodies is worse than one good one.

### THE WIRING NOTE — what to do with them

The two systems are on **different axes and both are wanted**: `NPC_JOB` says
where a body is LOOKING, the strip says what its hands are DOING. A turnaround
cell cannot show an arm welding, and a flat strip cannot turn away into its
work. The composition that fits what is already built:

1. Play each strip through the **same machine `tinkerTask` already is** —
   bursts, per-burst tempo, ping-pong, phase that carries across pauses. Do not
   give them a fixed rate; that is the rejected version.
2. Let the strip draw on the beats where the body is **turned into its job**
   and let `drawAtlas` with the eased `jobCol` carry the beats where it looks
   up and around. Ratchet's renderer is already exactly this shape: the loop on
   the work beats, a held plate for the acts.
3. **Facing is per character, and it is not `yawCol()`** — measured off the cut
   strips, servo, patch, sage and lumen face frame-LEFT and mono faces RIGHT.
   The archivist works its tape to the right, and a mirrored NPC works its
   bench through its own back. Values as measured: `servo -1, mono +1,
   patch -1, sage -1, lumen -1`.
4. Scale is the atlas row's own `k` (`ATLAS.sub[name].k`), so the strip lands at
   the height the still it replaces used to. Anchor is the bottom centre of the
   cell — `tools/vidstrip.cjs` writes them that way and `drawStripCell` assumes
   it, so no `plateFoot` is needed.
5. Add **no procedural bob under them.** The clip already moves, and a bob under
   real motion is the double-motion that made the guardians look like they were
   floating.

Until that lands the five draw exactly as they do today and nothing regresses —
this is the same "the key is here, the draw site is coming" arrangement every
other entry in this file has, inverted.

### THE MEASUREMENT THAT SHOULD OUTLIVE THIS ENTRY

**A BLACK SUBJECT CANNOT BE FIRED ON A BLACK FIELD.** The archivist's cable
cloak and the tinker's coat came back at **luminance 2 — the same value as the
empty corner of the frame.** There is no information in those pixels for any
key to find, and the first cut of both was a hollow outline with the chest and
legs punched out. No threshold recovers it, and neither does a flood fill.

So `tools/vidstrip.cjs` now DETECTS the field instead of assuming it:

- **black field** → flood fill from the border, so black in a fold, a hollow or
  under an arm survives (the `tools/blackkey.cjs` lesson, ported);
- **chroma field** → colour distance with a despill pass, because a chroma
  screen separates a black coat from its background by HUE, which is exactly
  the axis luminance threw away.

Those two clips were re-fired on green and both came back whole. **Any future
clip of a dark-costumed character is fired on green, not on black.**

### NEW TOOLS THIS PASS

| tool | what it settles |
|---|---|
| `tools/replate.cjs` | restyle in, plate's own alpha out — the geometry contract, enforced |
| `tools/alphacmp.cjs` | did the silhouette survive? coverage + overlap, so nobody squints at a contact sheet |
| `tools/platemeas.cjs` | luminance / chroma / blown-highlight drift against the plate being replaced |
| `tools/insidemeas.cjs` | the same, measured INSIDE the silhouette only — catches a detailed band flattened to a solid shape |
| `tools/npccut.cjs` | lifts one NPC cell off `npc_6yaw` onto black, square, as a generation source |
| `tests/npcstrip.cjs` | all sixty cells of the five strips: they land, no two are the same, feet stay down, no pumping |

**`tests/npcstrip.cjs` reported two false failures before it was right, and the
reason is worth keeping.** It judged movement by SILHOUETTE overlap, the way
§3.3 judges a guardian pose — and called the warden and the tinker static at
98.6% identical. They are not: the warden sweeps an arm across a console it is
already holding and irises a lens, the tinker tracks a torch along a seam.
Almost all of that happens INSIDE an outline that barely changes. A pose IS an
outline and is rightly measured as one; a work loop is not. It now measures
mean luminance change over the pixels either frame covers — twelve copies of
one cell score exactly 0, and the quietest real pair scores 1.8.

---

## 1. HZD-99, REGENERATED — the full character, all angles, all moves ✱ FIRST

**The ruling (owner, 2026-08-14):** the procedural body is visibly below the
rest of the cast — "not as good as the bosses and wolves" — and has no back
view. *"Use it as a template and let Higgsfield do a clean new one with all
needed angles."* ART_BIBLE.md §2 records the exception as revoked.

**The template is mandatory on every plate:** `assets/source/ref/hzd99_body.png`
— three facings of her live in-engine body. Generated FROM her, or not
generated. (`roster_8yaw.png` row 0 is a turnaround of a DIFFERENT robot cat;
it reached the screen once. Never again.)

**Step 0 when the connector is back:** call
`get_workflow_instructions({ workflow: "character-sheet" })` and follow it —
the server's own turnaround workflow outranks a hand-rolled batch.

**The identity line, verbatim in every prompt:**

> The same small robot cat as the reference image, kept EXACTLY: rounded
> off-white ceramic head, dark visor band with two bright cyan eye-lights, two
> upright ears with mint-green inner surfaces, short whiskers, BRUSHED-STEEL
> chest plate with a dark vent grille on the belly (canonical — see below),
> gold shoulder discs, a red scarf at the neck. Each arm is ONE smooth tapered
> piece from shoulder to paw — no elbow hardware, no rings, no segments, no
> exposed joints. Two arms, always.
>
> WEAPON RULE (supersedes every older line naming a mint-green blade): she is
> UNARMED by default — the weapon arrives mid-game as the PURIFIER WHITE
> CRYSTAL sword (§1b). Armed plates carry the white crystal, never a green
> blade. Any plate generated with a green blade after 2026-08-14 is off-model.

**The standing negatives, verbatim in every prompt:**

> NEGATIVE: no segmented arms, no elbow joints, no visible hinges, no staff,
> no tan or brown palette, no second character, no text, no watermark, no flat
> 2D drawing, no cartoon outline, no cast shadow, no ground plane. Pure black
> background, subject only.

**Style line:** clean high-detail 3D render, soft specular ceramic, brushed
steel, cyan/mint emissive accents, key light fixed to the WORLD upper-left in
every plate (the turnaround rule — a turn must read as a volume rotating).

### THE IDENTITY LOCK (owner, 2026-08-14, session B) — read before firing anything
The owner stopped the queue to say the obvious thing: **every sheet was a
different cat.** He was right, and it was not one bad plate — it was structural.
The two committed 8-yaw sheets each contain TWO cats, because `herosheet.cjs`
stitches a front half-turn and a back half-turn that were generated
INDEPENDENTLY: ear shape, head size and cape length all change across the seam.
The action plates drifted the same way against each other.

**The cause:** prose plus a loose reference image does not pin geometry. Every
plate was an independent roll.

**The fix, now mandatory:** the owner named `assets/source/ref/hzd99_canon.jpg`
as canon. It is registered as the generator's reference element `hzd99-canon`
= `467c8e08-8161-483f-a4cf-439875ff04e2`, and **every future plate, sheet and
VIDEO of her must embed `<<<467c8e08-8161-483f-a4cf-439875ff04e2>>>` in its
prompt.** The weapon has the same treatment: `purifier-crystal` =
`d0a03e79-2887-4bcd-a209-11732c6754ef`, `purifier-double` =
`bf160a06-9e42-46d0-a9f1-bc7c5dd1fcb5`.

Two consequences of the canon plate, both settled:
- **CHEST, INVERTED.** The canon plate has a WHITE/IVORY belly with the dark
  vent grille. The earlier ruling that the brushed-STEEL chest plate was
  canonical is **reversed** — the owner picked the white belly, and every brief
  must now name that.
- **The canon plate carries the old GREEN blade. It does not license green.**
  The lock covers body, face, materials and proportions ONLY; the weapon is the
  white crystal or nothing.
- **Retire the stale element.** The workspace still holds a hero element named
  `NYA-9` describing a *different* cat ("scuffed white and grey plating"). Never
  use it.

### STATUS LEDGER (2026-08-14, session B)
DONE and locked to canon, in `assets/source/`: the unarmed SIDE action set in
TRUE profile (idle/walk_a/walk_b/run_a/run_b) · the six missing states (apex,
burst, heal, song, slump, wall_cling) · the full former-green action set
regenerated unarmed (rise, fall, land, dash, skid, claw_1, claw_2, finisher,
charge, hurt) · §1b-i slash light-sheets ×4 · §1b-ii regrips ×2 + thrown rescale
(all three fixed: the paws now close ON the hilt, the thrown crystal fills its
frame) · §1c back-jet gear ×2 + her jet double-jump plate · `canon_front.jpg`,
the neutral standing plate. The 12 green-blade plates and `sword_full.jpg` are
DELETED, not superseded-in-place.

### CLOSING THE LOCK (2026-08-14, session B, second pass) — §1 IS FIRED
The wired art is now locked too, and this is the part that actually changed
what is on screen:
- **Both 8-yaw turnarounds rebuilt** from matched half-turn strips —
  `hzd_8yaw.png` (crystal on her back) and `hzd_8yaw_bare.png`. The two-cats
  defect is gone; so is the black ground line the old bare sheet carried under
  columns 4–7.
- **The back-walk pairs and the ground sword re-fired and re-keyed** — these are
  what the gate walk and the pickup actually draw. **WIRED IN FULL 2026-08-20:**
  the bare pair (`bare_bwalk_a/b`) had been fired, keyed and then never reached,
  because `drawGateWalk` only used a back plate once she carried the crystal and
  fell back to her SIDE view otherwise — so every gate and cave in the opening
  showed her running sideways into the backdrop. Both pairs are now prefetched
  when the walk arms, the unarmed run wears the bare pair, and the side view is
  reachable only if neither pair decodes. `tests/opening.cjs` measures the plate.
- **The green `sword_full.png` deleted**: orphan art, referenced by nothing.
- **Films:** `intro7` (she sits offline, never wired to the Song) and `intro8`
  (she wakes and goes) re-shot against the canon element — the old `intro8` was
  a visibly DIFFERENT cat with square green eyes and green body markings. Plus
  `sword_gift.mp4`, the §1d handover, ready for task #79.

**Three warnings for whoever fires the next batch:**
1. **"Pure black background" is not enough.** Two strips came back on WHITE
   despite the negative. What worked on the third try was describing the
   LIGHTING SITUATION instead: *"photographed in a pitch-dark room, no backdrop,
   no floor, four spotlights pick out the figures and nothing else receives any
   light."* A background colour reads as a style token; a dark room reads as a
   scene.
2. **Do NOT white-key her.** `blackkey.cjs --white` on a white-field plate of
   her eats the ear tips and DELETES the white crystal blade outright — a white
   subject cannot be keyed off a white field. Re-fire instead.
3. **Say "bright and even exposure" on BOTH halves of a turnaround.** The first
   armed pair came back with a bright front and a dark back, and the seam lands
   exactly where `herosheet.cjs` joins them — which undoes the world-fixed key
   light that makes a turn read as a volume.

STILL TO FIRE: the armed-with-crystal variants of the action set, when sword
mode needs them on screen · `intro7.webm` / `intro8.webm` (see below).

**Both gaps are closed.** A static ffmpeg from npm (kept out of `package.json`
— the game still ships nothing from npm) re-encoded `intro7.webm` /
`intro8.webm` and decoded all three films for review. `sword_gift` was re-shot:
the first take flared the crystal while it was still in the trader's hands, and
the handover IS the beat.

### ✅ SHE IS WIRED. One thing is still provisional — read it.
`Player.draw()` now draws her from `assets/characters/hero/states.png` through
`drawRoboPlate()`, with the procedural body as the loading fallback exactly as
§2 asks. `tests/hero.cjs` measures it and the silhouette numbers IMPROVED
against the procedural rig it replaced — run 0.198 (was 0.569), air 0.613 (was
0.858), charge 0.259 (was 0.441). Lower IoU is the §3.3 law being obeyed harder:
these are genuinely different drawings per state, not one drawing re-posed.

**RESOLVED: the sheet on disk is now the FRONT-ON set**, which is the
presentation the game has always used — both eye-lights, both ears, the visor
read. The profile set it replaced is gone from `hero/`. Swapping took no code
change at all, which is the point of the split: `node tools/herostates.cjs <dir>
<out>`, re-crush to `assets/characters/hero/states.png`, done.

**Model note.** The front-on set is **Seedream 4.5**, not Nano Banana Pro. Every
Nano Banana job — a fresh single-image test included — sat in `waiting` for over
half an hour while Seedream ran in seconds, so the jam was the provider's and
model-specific. The canon element pins identity across models, which is exactly
what it is for; the swap cost nothing in likeness. If Nano Banana is healthy
when you next fire, either is fine — keep a whole SET on one model rather than
mixing within a sheet.

### THE PRESENTATION DECISION BEHIND THAT — READ BEFORE #79/#80/#81

`tools/herostates.cjs` and `assets/source/_sheets/hero_state_sheet.jpg` exist:
22 keyed, foot-aligned, uniformly-scaled cells, one per state. The renderer was
NOT switched over, for a reason worth stating plainly:

**The game draws her ALMOST FRONT-ON.** `js/entities.js` says so at the body
shell — *"SHE IS DRAWN ALMOST FRONT-ON — one visor, two eyes, both ears"* — and
`assets/source/ref/hzd99_states.png`, the checklist this whole section was built
from, shows every single state that way. **The action plates in `hero/` are TRUE
SIDE PROFILE**, because session B forced profile on the reasoning that "a
side-scroller needs profile". That is a real convention in other games and it is
NOT this game's convention.

So wiring the sheet as it stands would not merely make her body authored — it
would silently change her presentation from front-on to profile, which is a much
larger visual change than the one that was asked for, and it would throw away
what the procedural body is carefully doing (both ears, both eyes, the visor
read, the committed upper-left key, the core shadow, the head's cast shadow).

Two ways forward, and it is the owner's call, not the pipeline's:
- **Keep front-on** (matches everything shipped): regenerate the grounded states
  — idle, walk ×2, run ×2, land, skid, claw ×2, finisher, charge, burst, heal,
  song, slump, hurt — as three-quarter FRONT views, then wire. The profile set
  stays archived and is still right for `wall_cling` and `dash`.
- **Move to profile** (a deliberate restyle): wire what exists, and accept that
  she now reads side-on, losing the two-eye visor read that the front-on
  presentation was built around.

Whichever is chosen, the renderer work is the same shape: a sprite short-circuit
in the ROBO-CAT branch of `Player.draw()` — NOT `drawHeroSprite`/`drawHeroRig`,
which belong to NOSTOS's human hero behind `isHero()`.

**And that hero is the precedent to copy, not a cautionary tale.** He is ALREADY
sprite-first: `drawHeroSprite` picks a frame out of `heroIdle`/`heroRun`/
`heroJump`/`heroAtk` (the `gothic-hero-*.png` sheets, which are on disk and in
`MEDIA_SRC`), returns true, and `drawHeroRig` — the procedural body — only runs
when those images have not loaded. That is exactly the arrangement §2 asks for
on HZD-99: authored art first, procedural body as the loading fallback. The
shape is proven in this codebase; it just has never been pointed at her.

For her, the split is: `js/entities.js` **1481–2232 is the body** (scarf, rear
arm, shell, head, ears, visor, legs) and is what a plate replaces; **2233–2269
is the jet plume** and stays. Scarf, jets, charge aura and claw arcs stay
procedural overlays — except the scarf/cape, which is BAKED INTO the plates, so
drawing the procedural scarf on top would double it.

**AUTO-APPROVAL (owner, 2026-08-16): the art session fires this list and
keys, archives, commits and pushes WITHOUT waiting for per-plate review.**
The owner's words: "you have my auto approval." Discipline replaces the
wait: every plate is self-reviewed against its brief and the bible before
keying (identity lines honoured, negatives absent, silhouette/palette
right — the measurable parts are enforced by tests/artbible.cjs on the
integrator side), and the owner may refuse any plate AFTER the fact, which
sends it back here as a re-fire with his correction. Generation still
belongs to the art session alone; the code session wires and verifies.

==== THE KEYING FAULT (2026-08-21, code session) — READ BEFORE RE-FIRING ====

**`assets/characters/npc_6yaw.png` shipped with 45.6% of Ratchet's interior
keyed away.** Not dark — GONE. His shoulder, the middle of his pack and his
legs are transparent, and the room shows through them. The owner circled those
three areas on a contact sheet; before that he had called it "a ghost" twice and
"all so dark" three times, and three rounds went into chasing brightness before
anyone looked at the alpha channel. Nothing about a hole gets brighter.

**The cause was `tools/turnsheet.cjs`, in two compounding ways, both now fixed:**

1. **It keyed by a global luminance threshold with no idea of inside or
   outside.** `lum < 26 -> alpha 0`, applied to every pixel in the frame. Every
   shadowed pocket WITHIN a figure fell below it. The comment in that function
   had already named the trade-off — "a flat threshold either eats the dark
   parts of a gunmetal robot or keeps the halo" — and the ramp that was supposed
   to split the difference ate the robot. Background is now what the OUTSIDE CAN
   REACH: a flood from the border, so anything the figure encloses stays opaque
   however dark it is. Real see-through gaps still key out, because they reach
   the border.
2. **The band was hard-coded far above the actual backdrop.** Measured on the
   surviving source (`assets/source/ratchet/ratchet_ref_npc6yaw.png`): the
   backdrop is TRUE BLACK, 99.9th percentile of the border ring is 0, no floor
   gradient at all. A floor at 26 was discarding everything from 1 to 25, which
   on a machine-person lit by one key is most of the shadow side. The band is
   read off the border ring now and sits just above whatever is really there.

**THE SHIPPED SHEET CANNOT BE REPAIRED FROM ITSELF.** The key zeroed the colour
along with the alpha — only 5.5% of the hole pixels retain any RGB. It needs a
RE-KEY from the raw strips, and **those strips are not in this repo**: the tool
reads `<indir>/<subject>.png` and `<subject>_r.png` for all seven subjects and
only a two-pose Ratchet reference survives in `assets/source/`. Whoever holds
them can re-run `node tools/turnsheet.cjs <indir> assets/characters/npc_6yaw.png`
and the fixed key does the rest — no credits.

**AND THE NEXT FIRE SHOULD NOT USE A PURE-BLACK BACKDROP.** Part of this loss is
not the key's fault at all: the render's own shadow side reaches EXACT ZERO in
places, which no keying can tell from a black backdrop. On the surviving strip
1.5% of the frame is exact-black enclosed by the figure — recoverable, and the
fix recovers it — but the black-on-black at the silhouette edge is gone for
good. Fire against a backdrop the subject never matches: a mid-grey, or a
saturated key colour. Then the alpha is exact instead of inferred.

**WHAT IS AND IS NOT AFFECTED**, measured with `node tools/holecheck.cjs`:
- `npc_6yaw.png` — the fault. Every standing NPC in the game comes off it.
- `npc/ratchet_resting.png` — ZERO holes. It came through a different route and
  it is the best-looking NPC art in the game (mid 98, contrast 206). It is the
  reference for what the others should look like.
- `hero/states.png` — 1.3%, and those read as genuine gaps between limbs.
- 68 of 112 sheets report SOME enclosed transparency, but parts atlases have
  gutters between their pieces and bodies have real gaps, so that number is a
  starting point for looking, not a defect count. Compare against the source
  before acting on any of it — that comparison is what made this case certain.

==== THE FIRING LIST (2026-08-15, consolidated — run top to bottom) =========
Whoever holds the Higgsfield binding (session B, or this session once it
rebinds) fires these in order. Reference for her body: media_id
4bca85e7-7e54-4d0b-b80a-4b947f12545a (assets/source/ref/hzd99_body.png).
Every item's full brief is in its section below; this is the checklist.

**ONE BRANCH (owner's order — see CLAUDE.md top):** all work, art firing
included, happens ON `claude/clawbyte-repo-migration-byhyl8` — pull --rebase
before starting, push after every commit, mirror to main/odyssey. No new
branches, ever. §1 is DONE and merged; the list below is what remains.

  1. §1b-i  slash light-sheets ×4        ✅ SHIPPED 2026-08-16 (were fired+archived, never keyed) — needs wiring
  2. §1b-ii regrips ×2 + thrown blade ×1 (thrown = BODY LENGTH — owner ruling)
  3. §1c    back-jet gear ×3             ✅ SHIPPED 2026-08-16 (were fired+archived, never keyed) — needs wiring
  4. §1d    THE FORGING CINEMATIC ×1     ✅ WIRED 2026-08-16 — the forging plays at the grant (code session)
  5. §1e    RUN PAIR RE-FIRE ×2          ✅ RE-FIRED v3 2026-08-16 to all four constraints — awaiting owner + the unpark
  6. §2e    sage plates ×6               ✅ WIRED 2026-08-16 — drawSage is plate-first, six states (code session)
  7. §2d    robot bat plates ×5          ✅ WIRED 2026-08-16 — drawBat is plate-first, five states (code session)
  8. §2c    caveMouth + caveExit + pillar ×3  ✅ WIRED 2026-08-16 — vistas + pillar plate live; cave tile deck still to fire
  9. §2f    GATE SHAPES ×6 + CAVE MOUTHS ×5   ✅ WIRED 2026-08-16 — per-zone maps live, feather-masked; city monument untouched
 10. §2g    THE TRADER'S BOOTH + DEN ×3       ✅ CLOSED 2026-08-16 — all three plates fired, approved and wired
 11. §3m    BOSS MOTION PLATES (task #93)     ◐ 1 of 10 WIRED 2026-08-21 — see the WIRING AUDIT in §3m: six plates are the wrong creature, two need their pair
 12. §1     PAIRED PAW SET — every pose WITH and WITHOUT the claw (owner's ruling 2026-08-16) + apex/burst/heal/Song/slump/wallcling
 13. §2     zone terrain briefs (edge_/fore_ per zone — task #76)
 14. §2h    THE ORACLE'S SHRINE + PARLOR ×2   ✅ WIRED 2026-08-16 — shrine plate + parlor vista live (code session)
 15. §2i    THE BREAKER ×3                    ✅ WIRED 2026-08-16 — surge is plate-first, three states (code session)
 16. §2j    SERVO'S WINDING HOUSE ×1          ✅ SHIPPED 2026-08-16 on the third fire — needs wiring
 17. §2k    THE TINKER'S QUENCH HOOD + FORGE ×2 ✅ FIRED 2026-08-16 — needs wiring
 18. §2l    THE KILN VENT ×3                  ✅ FIRED 2026-08-16 — assets/characters/kiln/, needs wiring
 19. §2m    THE SAGE'S STACKS + CARREL ×2     ✅ FIRED 2026-08-16 — needs wiring
 20. §2n    THE RIME COIL ×3                  ✅ FIRED 2026-08-16 — assets/characters/rime/, needs wiring
 21. §2o    THE NYMPH'S POD + HOLLOW ×2       ✅ FIRED 2026-08-16 — needs wiring
 22. §2p    THE NEST SNARE ×3                 ✅ FIRED 2026-08-16 — assets/characters/snare/, needs wiring
 23. §2q    BEAST GAIT REPAIR ×8              (wolf+cheetah walk pairs RE-FIRED + run pairs — see §2q, the leg and identity faults are written there)
 24. §2r    THE FORGE TABLE ×1                (the den bench as a matted object — crop stand-in wired, fire against it)

### 3m. BOSS MOTION PLATES (task #93 — owner: "bosses graphics and
movements need a lot of improvements")

**WIRING AUDIT 2026-08-21 (code session). SIX OF THE TEN ARE A DIFFERENT
CREATURE FROM THE GUARDIAN THAT SHIPPED — do not re-fire blind, and do not
wire them.** Every plate was photographed against the rig it was meant to
replace, in the same state, in the same frame, using the BOSS_MOTION_OFF
switch in js/entities.js (set it true and the rig draws where a plate would).
The comparisons are reproducible from that switch.

| plate | verdict |
|---|---|
| `nullfang_coil` | **WIRED.** Species, silhouette and armour match the rig. Two faults fixed in code: it is drawn facing RIGHT while every other plate and the engine's own convention face LEFT (per-plate `faceRight` now), and its matte carries a soft contact shadow below the feet, so it floated until the anchor was lowered. **One open question for the owner: its seams and eyes are RED; the rig's virus glow is VIOLET.** The swap lasts about a second, so it may read as a colour flicker. |
| `nullfang_walk` | Not wired, and not a fault of the art. §3m asked for walk_a AND walk_b so travel is a CYCLE; one stride pose came back. A held stride slid along the floor is the skating that took three passes to get out of the wolves and out of her. **Fire its partner and it wires immediately.** |
| `prism_stalk` | Same: one stride pose, needs its partner. |
| `prism_coil` | Held. Same species and colour family as the rig, but much PALER — the rig is dark magenta with red core light, the plate is pale pink crystal. Borderline; held pending the owner's eye rather than wired on my judgement. |
| `glaciere_travel` | **MISS.** The shipped GLACIERE is a horned unicorn-serpent with a flowing violet mane and hooved legs. The plate is a hornless, maneless, legless gharial. Same palette, different animal. |
| `glaciere_coil` | **MISS.** Same fault — a coiled snake where the guardian has a horn, a mane and legs. |
| `choir_drift` | **MISS.** The shipped FURNACE CHOIR is a winged mechanical DRAGON. The plate is a haloed bell/jellyfish. Not the same creature at all. |
| `choir_clench` | **MISS.** Same. |
| `talonhost_glide` | **MISS.** The shipped TALONHOST is a large teal-and-orange mechanical bird on a cable. The plate is a small brown-and-gold eagle. Wrong palette, wrong scale. |
| `talonhost_strike` | **MISS.** Same. |

**What the re-fire needs.** The brief already said it — "every fire uses the
guardian's own current sheet as reference media so identity holds" — and the
six misses are what happens when that step is skipped. The reference for each
is its parts atlas in `assets/characters/guardians/`: `glaciere_parts.png`,
`beast_parts.png`, `eagle_parts.png`, `prism_parts.png`. Fire against those,
not against the guardian's NAME: "FURNACE CHOIR" reads as a bell if you have
never seen the dragon.

**And every travel pose is a PAIR or it is not wired.** One stride is a
statue. This is now a rule of the section, not a preference.

The code half shipped 2026-08-16: every guardian now leans into its own
acceleration, bobs with its stride and compresses on landing (the weight
pass in Boss.update/Boss.draw). What code cannot do is move the LIMBS —
that is these plates. Per guardian (NULLFANG, TALONHOST, FURNACE CHOIR,
GLACIERE, PRISM PROWLER — MOTHER-V is stationary and exempt):

- **walk_a / walk_b** — two stride poses of its existing body (same sheet
  identity, same fixed key light), legs genuinely committed per §3.3
  (silhouette IoU ≤ 0.86 against each other and against idle).
- **attack anticipation** — one plate per signature attack: the drawn-back
  frame the wind-up holds (coil deeper, wings higher, lance further back
  than any existing pose). The amber wash is code; the POSE is the plate.

Wire notes: the parts-rig guardians (beast/eagle) take these as new atlas
rows for their existing draw files; the sheet guardians swap cells. Every
fire uses the guardian's own current sheet as reference media so identity
holds. tests/artbible.cjs silhouette + tell measurements bind them all.

Estimated spend: ~45-55 credits of session B's balance. After each block:
git pull, run the pipeline (blackkey -> img-crush -> archive -> wire), and
node tests/run.cjs artbible hero sage combat platform.
=============================================================================

WIRING NOTE (2026-08-15): the crystal arc is LIVE in code and every asset
above has a hook waiting for it — nothing blocks on art, and nothing needs
re-plumbing when it lands:
- §1b-i slash sheets → replace `drawCrystalArc` in js/entities.js (the
  procedural white crescent is the declared fallback; the function is the
  single place the swap happens).
- §1b-ii thrown plate → replace the polygon blades in `drawBoomer`
  (js/entities.js). Scale law: the thrown blade is BODY LENGTH — the owner
  already rejected a thrown sprite smaller than the held one.
- §1d is now THE FORGING CINEMATIC (owner's rewrite 2026-08-15, supersedes
  the handover video): a short CARTOONISH film — Ratchet at his bench, the
  pillar shard going in, sparks, the white crystal sword taking shape, her
  paws receiving it. It plays from `forgeCrystal()` in js/game.js (the
  ratchet_forge quest's payoff — the hook is live, the grant never waits).
  Brief notes: Ratchet has a SMALL CRYSTAL ON HIS CHEST (his backstory — it
  once burned the corrupted song out of him); make it visible and glowing in
  the film, and queue a chest-crystal touch-up of his NPC plate to match.
- §2e THE SAGE (docs/combat/SAGE.md): atlas-creature plates for the robed
  machine monk — standing (hooded, ember eyes), coil (drawn back, sleeves
  tight), lunge, gather (ember pooling in both sleeves), the KNEELING
  song-lock chant, and the purified variant re-lit blue. Hero-scale
  (duelist class). `drawSage` in js/entities.js is the placement reference.
- §2d THE ROBOT BAT (new enemy, owner 2026-08-15): atlas-creature plates —
  hanging (wings folded around the body, head down, one dull optic),
  shiver (same pose, wings rustling, optic hot), dive (wings swept back,
  optic hot), flight ×2 (wing up / wing down for the flap). Small machine
  in the minion family style; the engine-drawn fallback in js/entities.js
  drawBat is the placement reference.
- §2c THE CRYSTAL CAVE (new, quest 1): two backdrop paintings —
  `caveMouth` (A5: the kingdom's rock face with a dark cave opening she can
  walk INTO; the depth door aims at gx 0.50 / gy 0.86 of the plate) and
  `caveExit` (CV1: the view back out — bright mouth in dark rock, same
  anchor). Plus a `pillar` plate: a tall pure-crystal pillar, three white
  spears from a rock socle, to replace the procedural light version drawn in
  js/game.js drawStatics.
- The buried half sits in world.js X1 (`['secret', 29, 15, 'crystal2']`);
  a bespoke ground plate for it can replace the generic glimmer.
- tests/crystal.cjs measures the arc end-to-end (14 checks) and stays green
  through any art swap — it reads state, not pixels.

### 1d. THE FORGING CINEMATIC ✅ FIRED AND SHIPPED 2026-08-16 (art session)

**Done.** Opening frame 8742e113 (Seedream 4.5), animated by 52 credits of
Seedance 2.5 omni_reference, job b83d3226. Eight seconds, one continuous
shot, and it hits every beat the owner asked for: Ratchet at his anvil with
the raw shard, the strikes and the spark showers, his CHEST CRYSTAL pulsing
brighter with each blow, the shard elongating and faceting into the blade
with the dark hilt and gold pommel ring resolving last, the offer across both
palms, her paws closing on it, and the white flare that fills frame and ends
the film. Both characters hold identity the whole way through.

Shipped as `assets/video/sword_forge.mp4` + `.webm`, light tier derived.
Opening frame archived at `assets/source/forge/forge_openframe.jpg`.

**NEEDS THE HOOK REPOINTED (code session).** `js/game.js` line ~2630 still
has `gift: 'assets/video/sword_gift.mp4'` for `forgeCrystal()`. That file is
the SUPERSEDED HANDOVER — a tight close-up of hands passing the finished
sword, no forging, no Ratchet, no chest crystal. It is deliberately NOT
overwritten: it is good work, it still ends on the same white flare, and the
two could even run in sequence (forge, then the handover as its coda). The
one-line decision is the code session's: repoint `gift` to `sword_forge`, or
add a second entry and play both.

Two production notes for the next film:
- **Seedance returns HEVC.** The raw job mp4 is `hevc`, which browsers will
  not reliably decode. Every film has to be re-encoded to h264 (and to VP9
  webm) before it goes in `assets/video/` — the house format is h264
  1920x1080. The repo still ships nothing from npm; a static ffmpeg outside
  the tree does the work, and `FFMPEG=/path/to/ffmpeg node tools/lightvid.cjs`
  then derives the light tier.
- **Audio off.** Generated with `generate_audio: false` on purpose — the game
  scores its own cinematics through audio.js, and a baked soundtrack would
  play over the top of it.

### 2e. THE SAGE ✅ FIRED AND SHIPPED 2026-08-16 (art session)

Six plates in `assets/characters/sage/` — `stand`, `coil`, `lunge`,
`gather`, `lock`, `pure` — sources in `assets/source/sage/`, contact sheet
at `assets/source/_sheets/sage_contact.png`. The robed machine monk of
docs/combat/SAGE.md and `drawSage`: pointed hood over a faceplate with two
ember eye-lights, tapered plum-and-charcoal robe with a torn hem that never
makes a straight line, gunmetal segmented hands.

The set was built to be MEASURABLE against the bible, not just to look
right:
- **§3.5, the hue law.** Amber appears on exactly the three telegraph
  states — `coil` (seams bleeding amber), `gather` (ember pooling in both
  open sleeves, motes drawn INWARD because he is storing it) and `lock`
  (amber pouring out of the split faceplate). `stand` and `lunge` carry
  none: the warning has to mean something, so it cannot be decoration.
- **§3.3, the silhouette law.** Five genuinely different shapes — narrow
  upright, compressed and wound, long horizontal at full extension, widest
  spread, low kneel. Nothing here is one drawing rescaled.
- **`pure`** is the same body with its light changed: ember gone, crystal
  blue-white in the eyes and seams, cloth lifted from dusty plum to clean
  slate-blue, faceplate closed, hands loose. The robe is washed, not
  replaced — the hem is still torn.

**NEEDS WIRING (code session).** These replace `drawSage` in js/entities.js
at the same anchor, indexed by state name. Six media.js entries and the
state→plate mapping are the wiring; `tests/sage.cjs` and
`tests/artbible.cjs` both stay green as they read state, not pixels.

Three things this batch cost a round each, worth knowing before the next set:
1. **Naming a state in the prompt prints the name.** `coil` and `gather`
   came back with "THE COIL" and two "The Gather" callout labels rendered
   into the frame, because the prompt used those words as headings. Describe
   the pose; never title it.
2. **"Whole body in frame" needs "zoom out" next to it.** The first `pure`
   framed her hood off the top edge. Asking for margin is not enough — say
   the figure is SMALL in the frame.
3. **Ambient effects survive matting.** The first `lock` was rendered
   sitting in a dust cloud, and the matte kept it as a grey smear stuck to
   the robe. Negatives for dust, smoke, mist and haze belong on every
   subject-only plate.

### 2d. THE ROBOT BAT ✅ FIRED AND SHIPPED 2026-08-16 (art session)

Five plates in `assets/characters/bat/` — `hang`, `shiver`, `dive`,
`flap_up`, `flap_dn` — sources in `assets/source/bat/`, contact sheet at
`assets/source/_sheets/bat_contact.png`. A small machine the size of a cat:
riveted gunmetal barrel body, blunt snout with two pointed metal ears, ONE
round amber optic, thin segmented wings on jointed steel ribs, little hooked
steel claws. All five matted.

The five silhouettes are five shapes, which is the whole point of a minion
you have to read at speed: compact folded teardrop hanging head-down, the
same teardrop rattling with amber leaking out of its seams, a narrow
swept-back arrowhead diving, wings high and wide at the top of the beat,
wings driven low beneath the body at the bottom of it. `hang` is the only one
with its optic DARK — that is the difference the player reads before it
drops on them.

**NEEDS WIRING (code session).** These replace `drawBat` in js/entities.js at
the same anchor: `hang`/`shiver` for the perched states, `flap_up`/`flap_dn`
alternating on the stride counter for flight, `dive` for the attack run.

**THE LESSON, AND IT COST FIVE PLATES.** The first batch was fired from prose
alone — one careful paragraph of description, five times. It came back as
FIVE DIFFERENT BATS: different bodies, different wings, different scales, one
with a cat's face, one on a riveted metal wall the negatives had forbidden,
and one that was a zeppelin with a small animal hanging underneath it. This
is exactly the failure THE IDENTITY LOCK records for the hero, arriving again
at the other end of the roster, and the fix is the same one §2 of the
art-prompts skill already prescribes: **generate ONE plate, pick the best,
and make it the reference for every other plate in the set.** The four
re-fires against `flap_up` are all recognisably the same machine. Do this
first next time rather than second — it would have halved the spend.

Second, smaller: "infinite empty black void" alone did not stop backdrops
appearing. What stopped them was naming the offence — no wall, no backdrop,
no metal panels, no rivets in the background, no gradient, no vignette — as
explicit negatives. Generic void language describes a mood; a negative names
a thing.

### 2c. THE CRYSTAL CAVE ✅ THREE PLATES FIRED 2026-08-16 (art session)

- `assets/backgrounds/cave_mouth.jpg` (job 35528818) — room A5's rock face
  with the opening she walks into.
- `assets/backgrounds/cave_exit.jpg` (job c76e8ac5) — room CV1, the view
  back out: near-black interior rock, one hole full of daylight, roots
  silhouetted against the glare, light dying across the floor. Fired against
  the mouth as reference so both sides are the same rock.
- `assets/characters/gear/pillar.png` (job ea28f95e, matted) — three white
  crystal spears out of an irregular broken rock clump, lit from inside.
  Replaces the procedural light version in `drawStatics`.

Sources in `assets/source/cave/`.

**THE DOOR ANCHORS DO NOT MATCH THE BRIEF, AND THE PLATES ARE RIGHT.** The
brief specified gx 0.50 / gy 0.86 for both. What the plates actually have,
measured off the images rather than guessed:

- **cave_exit**: opening centre **gx 0.516 / gy 0.563**, its base at gy 0.79.
  Measured cleanly — the daylight hole is the only bright thing in the frame.
- **cave_mouth**: opening centre **gx 0.68 / gy 0.62** by inspection, base
  around gy 0.85. Read off the image, not measured: a darkest-pixel centroid
  is contaminated here by the dusk sky and the wall shadow, so treat this one
  as approximate and check it against the running room.

Set the anchors to the plates. Aiming the walk at 0.50/0.86 on cave_mouth
would send her into solid rock a fifth of a screen left of the hole. The
scratch tool that measured this is in the session scratchpad; it finds the
extreme 6% of pixels by luminance and averages their positions.

Two things the first round got wrong, both about composition rather than
material:
1. **A rock face wants "flat and straight on" said explicitly.** The first
   cave_mouth came back in perspective, the wall receding to the left, with
   the opening halfway up it — unreachable for a character standing on the
   ground. Naming the ground ("a stony floor across the bottom eighth of the
   frame") and putting the opening ON it fixed both faults at once.
2. **"No square base" is not enough for a socle.** The first pillar grew a
   neat cut plinth with flat faces and a level bottom — a right angle in a
   game whose standing order forbids them. What worked was describing the
   base as a thing rather than negating a shape: "a jagged, lumpy, eroded
   mass of fractured stone, torn out of the ground, not a carved pedestal".

Still to fire in this section: the cave tile deck.

### 2f. GATE SHAPES + CAVE MOUTHS ✱ FIRE ON REBIND (owner, 2026-08-15)

The owner's order, verbatim intent: **"Ask Higgsfield to produce different
shapes of gates! And caves should look like a cave opening, not a door!"**
Every depth door currently draws the same rectangular multilayer city-gate
structure. Two families replace it:

**Gates ×6 — one per built zone, DIFFERENT SHAPES.** Each is a backdrop
plate of a monumental doorway matching its kingdom, and none of them is a
plain rectangle (the NO RIGHT ANGLES rule binds art too): the city gets its
towering leaves, the Foundry a furnace-arch with a poured-metal rim, the
Archives a split shelf-stack, the Conduits a cable-parted iris, the Nest a
woven talon arch, the Eye an organic sphincter-iris. Closed + open variant
each (or a parted pair the engine can slide). Dark-room phrasing, subject
only, per the standing §3.2 rules.

**Terrain rule that binds EVERY plate in this section (owner, 2026-08-15):
elevations, steps and obstacles MIMIC OBJECTS FROM THE ROOM'S BACKGROUND** —
a city ledge is a vent housing, a crate stack, a fallen sign; a Foundry step
is a slag mound or machine housing; a cave step is rock. The platform deck
plates (§2a-2l) and every future step/obstacle plate are generated as the
backdrop's own furniture, matched to that zone's painted vista, so terrain
feels like part of the room rather than blocks placed on it. And per the NO
RIGHT ANGLES law: no plate presents a square silhouette.

**Cave mouths ×5 — irregular ROCK OPENINGS, never doors.** For the cave
networks (A/B/C/D/E grottoes + the crystal cave): a jagged-edged dark
opening in living rock — asymmetric, weather-worn, roots/moss per zone,
absolutely no straight jambs, no lintel, no symmetry. The engine's
procedural fallback (drawCaveMouth in game.js) is the placement reference;
the plate replaces it at the same anchor.

### 2h + 2i + 2j — KINGDOM 2 PLATES, FIRED 2026-08-16 (art session)

**§2h THE ORACLE ✅ both plates shipped** —
`assets/backgrounds/oracle_booth.png` (matted) and `oracle_interior.jpg`.
The shrine is leaning pipe-bundle posts with junction housings, a sagging
swag of dead cable thrown over as a canopy, fibre-optic strands hanging with
blue-lit tips, parted cable curtains over a doorway glowing cold cathode
blue, a cracked monitor hung crooked with one sine wave alive on it, one
magenta indicator. The parlor is leaning monitor stacks, a sagging rack,
drooping cable swags, one live screen, magenta accent, and floor left clear
across the middle for the play plane.

**The first oracleBooth came back as a STONE CHAPEL WITH A CROSS ON IT.** The
verbatim brief opens "a small roadside shrine", and that noun dragged a whole
building typology in behind it — masonry, columns, a pediment, a crucifix —
and comfortably outvoted every clause about conduit parts that followed. The
fix was to lead with the material and refuse the typology outright: "made
ENTIRELY of salvaged electrical and data-cable parts; it is scrap, not
architecture; no stone, no masonry, no columns, no religious building of any
kind." **A noun that names a building type is a style token with a floor plan
attached** — watch for it in any brief that says shrine, temple, altar, tomb.

**§2i THE BREAKER ✅ all three shipped**, `assets/characters/breaker/`.
Three genuinely different silhouettes, which is the whole job for a machine
whose purpose is teaching a timing lesson: `rest` low and shut with the three
ceramic fins folded flat along its back, `tell` risen with the fins upright
and spread, `vented` slumped off-level with a side panel fallen open on its
hinge showing hot amber slots inside. No legs and no barrel, so it never
reads as the turret.

It got there by accident and the accident is worth keeping: the plate fired
for `rest` came back with its fins standing up, which is not rest — it is the
tell. Rather than re-roll it, it was kept AS the tell and the other two were
fired against it as reference. One wrong plate became the anchor the set
needed, which is the §2d rule arriving early for once.

**§2j SERVO'S WINDING HOUSE ⚠ FIRED TWICE, NEITHER KEYABLE, NOT SHIPPED.**
Both plates are archived —
`assets/source/kingdom2/winchHouse_asfired.jpg` and `winchHouse_v2_asfired.jpg`
— and the second is the better winch: spoked wheel, drum wound with cable,
scalloped canvas awning, lantern, spare coil, crooked stool, teal-and-gunmetal
poles.

What stops it is the CUT-OUT. The first came back on a pale studio field with
the canvas nearly white — the white-on-white case the §1 warnings say to
re-fire rather than key. The re-fire used the corrected void phrasing this
session leaned on everywhere else, naming each offence (no floor, no ground,
no grass, no backdrop, no gradient, no vignette, no visible lamps) — and came
back on a lit warm floor with a cast shadow ANYWAY. `remove_background`
refused both jobs, four calls, the same server error each time, while
accepting every other subject fired today.

**A hypothesis for the third attempt, instead of a third identical one.**
This is the only subject in the session that is a large structure STANDING ON
LEGS, and legs imply ground: a four-legged frame appears to pull a floor in
behind it the same way "shrine" pulled in a chapel, because the model
resolves what the thing is standing on. Say what the legs DO rather than only
forbidding the floor — suspended, hanging in darkness, feet ending in
nothing, seen from slightly below. And fire it to be BLACK-KEYED rather than
matted, since the matte service is declining this one subject: field
genuinely at value zero, canvas kept dark grey-brown rather than pale.

### ⚠ tests/hero.cjs's two-arm check is SITTING ON ITS THRESHOLD (noticed 2026-08-16)

Not a break, and not caused by any plate in this session — but it will bite
whoever unparks the run, so it is written down here.

`tests/hero.cjs` fails a pose when the quieter side of her body carries less
than **0.16** of the busier side at shoulder height. The run pose currently
measures **145–147 against 906, i.e. 0.160–0.162** — over the line by about
one part in five hundred. It failed once during this session's §2h/§2i test
run and passed three consecutive runs immediately afterwards, at the
committed state and with the working tree both. Nothing changed between; the
sample did.

Two things follow:

- **The measurement is real, not noise.** The run pose IS lopsided, because
  `heroState()` still substitutes the WALK pair for the run (the §1e cells
  are parked), and the walk cells hide the far arm behind the body and cape.
  It has always been this close to failing; it just never tipped before.
- **Unparking the run probably HELPS, and that is now measured rather than
  hoped.** `node tools/armbal.cjs` (new, this commit) reports the same
  quantity per CELL on the sheet, before anything is wired. The cells the run
  currently borrows are the weaker pair — `walk_a` 0.751 and `walk_b` **0.541**
  — while the §1e run cells are `run_a` **0.888** and `run_b` **0.777**. So the
  pose that is scraping the floor in-game is being drawn by the most lopsided
  plate on the sheet, and the parked replacements are markedly better balanced.
- Sheet ratios are not game ratios — the game adds facing, lean, scarf and
  jets on top, which is why 0.541 on the sheet reads as ~0.16 on screen. Read
  `armbal.cjs` for "does the far arm exist at all" and `tests/hero.cjs` for
  the verdict. If the number still drops under 0.16 after the revert, the fix
  is a re-fire with the far arm clear of the body, NOT a loosened threshold:
  the threshold is what stops a one-armed cat reaching the screen.

### THE ORPHAN AUDIT (art session, 2026-08-16) — three items were never missing, they were never SHIPPED

The owner asked what was missing. The most useful answer was not in the
backlog: **items 1, 2 and 3 at the top of this list had already been fired and
archived, and never reached the game.** They sat in `assets/source/` with no
counterpart in the shipped tree and no manifest key, which is invisible to
every check the project has — `tests/platform.cjs` catches a manifest name
with no FILE, and nothing catches a file with no manifest name.

The cause is a word. This ledger's STATUS section calls §1b-i / §1b-ii / §1c
"DONE", and in that section done means FIRED. The checklist ticks mean
SHIPPED. Two meanings, one word, and the gap between them held seven plates
for two days.

**Fixed in this commit:**
- **§1b-i — the four crystal slash light-sheets** are now
  `assets/fx/slash_h.png`, `slash_d.png`, `slash_u.png`, `slash_dn.png`.
  They keep their BLACK FIELD on purpose: these are additive-light plates
  drawn with `'lighter'` where brightness IS the alpha, exactly like the
  existing rake sheet. Alpha-keying them would be wrong.
- **§1c — the back-jet gear** is now `assets/characters/gear/jetpack.png` and
  `jetpack_fire.png`, black-keyed like its siblings. Every other plate in
  that folder (boots, pod, cradle) already had both an archive entry and a
  shipped file; the jet pack had only the archive.

**Still orphaned: §1b-ii.** `assets/source/crystal/held_guard.jpg`,
`double_guard.jpg` and `throw_pose.jpg` are archived and unshipped. They are
left alone deliberately — unlike the other two, their wiring note calls for
replacing the polygon blades inside `drawBoomer` (js/entities.js:6172), which
is a rendering change and the code session's call, not a file drop. Shipping
the plate without that decision would just move the orphan.

**WIRING (code session), both of the above:**
- `drawCrystalArc` (js/entities.js:6129) is still the procedural white
  crescent, which its own comment names as the declared fallback. The four
  sheets replace it: `slash_h` horizontal, `slash_d` diagonal, `slash_u` the
  upward burst, `slash_dn` the air-down pogo with its impact splash. Four
  media.js keys.
- The jet pack draws at her back through the double-jump; `jetpack_fire` is
  the full-burn variant, though note the plume itself is already procedural
  additive light per §0.0, so the fire plate may serve as reference rather
  than as a drawn sheet. Two media.js keys.

**And a check worth keeping:** anything in `assets/source/` whose name has no
counterpart in the shipped tree and appears nowhere in `js/` is either
composited into an atlas (the boss parts, the turnarounds — legitimate) or it
is an orphan. That sweep is how these three were found and it takes seconds.

### 2j CLOSED + 2l / 2n / 2p FIRED (art session, 2026-08-16)

**§2j SERVO'S WINDING HOUSE ✅ SHIPPED on the third fire**, as
`assets/backgrounds/winch_house.png`. The hypothesis in the previous entry
was right: this is the only subject in the queue that is a large structure
STANDING ON LEGS, and legs imply ground — the model kept resolving what it
stood on. Naming the floor in the negatives never worked. What worked was
saying what the legs DO: *"it is not standing on anything; it hangs
suspended in empty darkness, the four feet of its frame END IN NOTHING."*
No floor, no shadow, first try. Sources for all three attempts are archived.

**§2l THE KILN VENT ✅ · §2n THE RIME COIL ✅ · §2p THE NEST SNARE ✅** —
nine plates in `assets/characters/{kiln,rime,snare}/`, sources in
`assets/source/kingdom345/`, contact sheet at
`assets/source/_sheets/kingdom345_enemies.png`. All matted.

Each is a three-silhouette read, which is the entire job for machines whose
purpose is teaching a beat:
- **kiln** — `rest` capped and dark; `tell` mouth open with the throat lit
  and the side grate hot; `spent` petals flung wide and drooping, side grate
  fallen open on its hinge, throat dead.
- **rime** — `rest` frost needles folded low against the collar; `tell`
  needles standing and fanned, the body taller; `dark` needles snapped over,
  frost-vent panels hanging open showing pale slots, core dead, shell cracked.
- **snare** — `rest` bulb bunched with the thorn ring curled shut and a dull
  red heartbeat; `tell` crown spread wide with one long tendril arcing out of
  the maw, hook open, core burning; `limp` tendril fallen slack, thorns
  drooping, light out.

**THE ACCIDENT THAT KEEPS PAYING.** Twice more the first plate of a triad
came back in the WRONG state — the rime with its needles up, the kiln with
its mouth open — and both times the answer was not to re-roll it but to
RELABEL it as the tell and fire the other two against it as reference. That
is now three enemies built this way (the breaker was the first). A plate in
the wrong state is not waste; it is the anchor, and it is usually the most
expressive plate in the set because the model reaches for the dramatic pose
by default. Fire the dramatic state first ON PURPOSE next time.

**NEW, AND IT EXPLAINS EVERY MATTE REFUSAL SO FAR:** `remove_background`
refuses very large sources. `kiln_spent` (21.6 MB, 4096²) failed four calls
with a server error; the identical image downscaled to 1400 px was accepted
immediately and matted perfectly. The §2e `pure` plate and both earlier winch
attempts were the largest files of their batches too, so this was never about
the subject. **Downscale to ~1400 px before matting** — the shipped plate is
640 px anyway, so nothing is lost.

**WIRING (code session):** ten media.js entries and the state maps. Each
enemy replaces its engine-drawn fallback at the same anchor —
`case 'kiln'` / `case 'rime'` / `case 'snare'` in `Enemy.draw` — and the
winch replaces `drawWinchHouse` at the ROOM_PROPS A1 anchor, with the
procedural version kept as the loading fallback.

### 2k + 2m + 2o — KINGDOMS 3, 4 AND 5 GET THEIR PLACES (art session, 2026-08-16)

Six plates. Fronts matted to `assets/backgrounds/{forge,carrel,hollow}_front.png`;
interiors crushed to `{forge,carrel,hollow}_interior.jpg`. Sources in
`assets/source/kingdom345/`, contact sheet
`assets/source/_sheets/kingdom345_places.png`.

**The five silhouettes stay five silhouettes**, which is what these briefs
were really asking for — each kingdom's doorway has to be recognisable at a
glance and none may repeat another's shape:
- kiosk canopy (Ratchet) · cable swag (the Oracle) · **quench-hood bell**
  (the Tinker) · **crevice-arch of leaning ledger stacks** (the Archivist) ·
  **hanging cocoon pod** (Lumen).

And each keeps its own light, which is the other half of telling them apart:
molten orange in the forge doorway, pale glacial blue in the carrel crevice,
leaf-green at the pod's tear — never Ratchet's lamp amber and never the
Oracle's CRT blue. On the hollow, the Nest's red infection veins run on the
columns' OUTER edges and die to grey near the mouth, because Lumen's light
keeps that one pocket clean; that detail survived the fire intact.

**One incidental win worth recording:** `forgeFront` came back with a small
brick building grown behind the hood — the "shrine → chapel" pull from §2h,
in its Foundry dialect. The MATTE removed it for free, because the brickwork
was background and the hood was subject. When a plate is going to be cut out
anyway, a stray background structure is not always worth a re-fire: check
what the matte does with it first.

**WIRING (code session):** six media.js entries. The fronts replace
`drawTinkerForge` / `drawSageCarrel` / `drawLumenHollow` at their existing
anchors (same bottom anchor and ~236 px height as boothFront); the interiors
are ROOM_VISTA backdrops for C5B, D1B and E1B.

### ⬛ FIVE OWNER REPORTS FROM PLAY (2026-08-16, in his words) — ROUTED

He played the build and sent five. Two are art and go on this list; three are
CODE and are logged here only so they are not lost. Nothing below is fixed
yet except where it says so.

**1. THE GATE TRANSITION IS FAR TOO LONG — CODE.** *"Going inside or outside
a gate should not take that much... I'm just passing from one gate to another
... you should recognise if it's just a gate, I'm just passing through, so
I'm turning my head back, going inside, fading into the black. I don't have
to keep running for long."* The walk-into-depth is the CITY-GATE ceremony
being spent on ordinary doorways. A plain gate wants: turn, one or two steps
in, fade to black — about a third of the current distance and time. The long
version should be reserved for the one monument that earns it.

**2. THE SUPERCHARGE POSE MUST NOT BE A CROUCH — ART (this list) + code.**
*"When I recharge or charge for the supercharge hit, the character should not
be crouching down. It can just put its arms together like a cross to charge,
like a Wolverine putting its arms."* And his reason is a real bug, not a
preference: *"when it jumps, it can't stay crouching and jump and charged at
the same time."* A crouch is a GROUNDED pose being drawn in mid-air. The new
`charge` plate is arms crossed in front of the chest, body UPRIGHT, feet
neutral so it composites over a jump — fired as a §1 state-sheet cell
replacement (cell 16).

**3. THE MIND NODE IS INVISIBLE — ART (this list) + code placement.** *"The
node that requires thinking or solving a problem is not visible for the
players. Find an appropriate futuristic object — a pillar made of metal that
looks like the Egyptian pillar, with holographic inscriptions on it, but make
it the robotic alien language shining from it in an electrical way. It should
be obvious to go to it. It should be like a MONUMENT, not a small object."*
So: an OBELISK, hero-scale, taller than she is by several times, its faces
carrying electric holographic glyphs in the machine tongue.

**And it must MOVE OUT OF THE NPC's ROOM:** *"it should not be inside the
room of the NPC. It should be outside, next to it, or in the next room, or in
the next frame."* That is a world change and belongs to the code/kingdom
session — the plate is useless if it stays where it is now, tucked behind
Ratchet's bench where the screenshot shows it.

**4. THE GROUND GLOW UNDER HER FEET IS STILL THERE AT REST — CODE (probably).**
*"I can still see the light shining underneath the legs when the character is
standing. When it runs, it goes. But when it stands, it's still there."* Note
the tell: it disappears when she RUNS and returns when she STANDS. That means
it is tied to the idle/standing state specifically, not to a global ground
FX — either baked into the standing cell of the sheet or drawn by a
rest-state effect. A previous pass already found one of these baked into art
("the last light under her feet was IN the art"); this is another instance
and the state it belongs to is the clue.

**5. THE RUN MOVES THE WHOLE BODY — CODE, plus one art-tool bug now FIXED.**
*"The walking also is not smooth... It should move its legs without moving a
lot in its body, or making it smaller and bigger. It's just running or
jogging, but you're moving the whole body."*

Two separate causes, and only one of them is art:
- **Code:** `drawRoboPlate` adds a mechanical lean and bounce on top of the
  plates (`rotate(0.055)` and a vertical `translate` per step at run
  cadence), and `heroState()` is still substituting the WALK pair for the
  run. Body-level rotation and translation are exactly "moving the whole
  body". With authored run cells that carry their own motion, most of that
  overlay should come off.
- **Art, and this was mine:** `tools/herocell.cjs` normalised EACH cell to
  the same height independently, so a tucked pose — genuinely shorter than a
  standing one — got scaled UP for that frame. Played at run cadence that is
  literally "making it smaller and bigger". **Fixed in this commit:** one
  scale is derived from the first plate in the call and every other plate
  inherits it, which is the rule `herostates.cjs` already followed. The §1e
  run cells were re-placed with it (they happened to differ by under 1%, so
  the shipped pair was not visibly affected — but the tool was wrong and
  would have bitten the next set).

### ⬛ FOUR MORE OWNER REPORTS — THE TALKING AND TEACHING PASS (2026-08-16)

All four are about how the game SPEAKS to the player. Three are code/UX; one
uncovered a real art gap. Logged in his words so none of it is lost.

**6. THE SKILL UNLOCK DOES NOT SHOW WHERE THE SKILL LIVES — CODE/UX.** *"When
it asked me to add a skill, it did not guide me to the skill button. It just
told me to add it."* Telling a player they have a point to spend is not
teaching them where to spend it. The prompt needs to POINT — highlight or
arrow the actual button, the way the guided walk already points at controls.

**7. THE HEALING GIFT'S STORY IS LOST IN THE CLICK-THROUGH — CODE/UX.** *"The
story behind the healing gift was mixed up with other instructions and
stories. So if the user is just clicking, it will miss the story."* His fix
is a staged beat rather than a line buried in a queue: *"the healing object
should be HANDED to the hero from the NPC, and it should show on the screen
that it was handed to me as a healing object. Then it should show the healing
icon."* Hand-over first, name the object, then the icon appears — three
readable steps instead of one paragraph competing with tutorial text.

**8. THE NPC's FACE SHOULD BE IN THE SPEECH BOX — CODE + AN ART GAP.** *"The
NPC face should appear when it's talking, in the speech screen."*

**Checked, and he is pointing at a real defect:** `drawDialog` in js/game.js
(~line 8551) calls `drawPortrait(...)` unconditionally, and `drawPortrait`
draws **HZD-99's** face. So when Ratchet or the Oracle or Servo speaks, the
bust above their words is HER, not them. The comment beside it is about
keeping the bust and her sprite in agreement — which is right, and is the
wrong rule when somebody else is doing the talking.

Two halves, and the art half is genuinely missing:
- **Code:** pick the portrait by SPEAKER — her face when she speaks, the
  NPC's when they do.
- **ART ✅ DONE IN THE SAME SITTING, for nothing.** Six busts now exist at
  `assets/characters/npc/bust/{servo,ratchet,mono,patch,sage,lumen}.png`,
  cut from `npc_6yaw.png`'s front column by the new `tools/npcbusts.cjs` —
  no generation, and the bust is therefore guaranteed to be the same
  character the player is standing in front of. Contact sheet at
  `assets/source/_sheets/npc_busts.png`. Each reads clearly at bust size:
  Servo's dome and antenna, Ratchet's amber optics over his brass rig,
  Mono's waveform screen, Patch's goggles, the Sage's caged orb, Lumen's
  petals. Six media.js entries and a speaker check in `drawDialog` are all
  that is left, and both are code.

**9. DIALOGUE SKIPS ON ANY TAP — CODE/UX.** *"Don't make it easy to skip by
touching the screen. If I'm on mobile it should be kept on, and advance by
clicking a certain button, maybe like an attack or another button on a
controller."* Advancing on any screen touch means a player who taps to move
destroys the line they were reading. Bind advance to a specific control on
every platform, and make an accidental tap do nothing.

### ⬛ THE GLOW UNDER HER FEET IS **CODE**, AND HERE IS THE LINE (2026-08-16)

Owner, twice, and on the title screen too: *"I do not want the glow. Looks
fake."* / *"I can still see the light shining underneath the legs when the
character is standing. When it runs, it goes. But when it stands, it's still
there."*

**It is not baked into the art, and that was checked rather than assumed.**
`tools/herobase.cjs` (new, this commit) hunts a figurine display base by
SHAPE — a disc is far wider than the legs standing on it — across all 22
cells of the state sheet. It found **zero**. The earlier scrub of the
figurine bases worked; nothing is left in the plates.

**It is the CONTACT SHADOW, and on the title screen it is provably so.**
`drawMenuCat` (js/game.js ~8242) builds a live `Player` and calls `p.draw(c)`,
and because the contact-shadow probe walks the grid looking for floor, the
menu deliberately **lends it one tile** — `if (!G.grid) G.grid = [['#']]`,
with the comment "she stands on nothing here". So the title screen is
literally drawing ground-contact light under a character standing in space.
In play it is the same effect (js/entities.js ~1877), which "tightens and
darkens as the hero nears the ground" — hence his exact observation that it
is worst when she STANDS and goes when she runs, because running keeps her
bobbing off the floor.

**The fix is code, in two places, and no re-fire will help:**
1. **Title screen:** stop lending the floor tile, or set the art-probe
   suppression flag the harness already uses (`G.artProbe` suppresses
   ground-anchored decoration for exactly this reason), so the menu cat has
   no ground contact at all.
2. **In play:** the owner's ruling is that the effect looks fake, so it wants
   removing or reducing far below its current strength — not just at rest.

### ⬛ HANGING PLATFORMS NEED VISIBLE SUPPORT — ART, NEW (owner, 2026-08-16)

*"Anything that is hanging in the room should either have something it stands
on in the background as a layer, to show how this thing is hanging in the air
— whether something is holding it from up or something is holding it from
down — as a drawing to complete it."*

Every floating platform in the game currently hangs on nothing, which reads
as a game object rather than as part of the world. Each needs a SUPPORT
LAYER drawn behind it, per zone and in that zone's own furniture (the
mimic-the-background rule): chains and hooks into the ceiling, a bracket arm
off the back wall, a pillar or strut up from the floor, cable bundles, a
gantry.

**And it must be built for MOTION, because it is coming:** *"in the later
stages platforms will be moving, so it needs to show wheels or something
that's moving behind it — like gears moving."* So the support art wants a
static layer plus a MOVING element the engine can animate: a geared rack the
platform climbs, a chain that scrolls, a winch drum that turns.

**The end state he named, and it should shape the design now:** *"later on we
can make it as if DRONES are moving, and the platform is actually the back of
the drone that we can jump on."* A drone-backed platform is a different asset
class — a creature-machine with a flat deck, hovering, with its own idle and
travel states. Anything fired for supports should not contradict that: prefer
supports that read as machinery rather than as masonry, so a zone can later
swap a strut for a drone without redrawing the room.

Scope, unfired: one support set per built zone (A/B/C/D/E/X) — static support
+ moving element — plus the drone-platform creature when its kingdom arrives.
`MovingPlat` in js/entities.js is the placement reference.

### ⬛ WIRED IN (art session, 2026-08-16) — the owner asked, so this session did it

Normally generation is this session's and wiring is the code session's. The
owner overrode that ("wire it all in the game and fix any errors"), so it is
done here. Three parts:

**1. FORTY-NINE MANIFEST KEYS.** Most of the wiring was never code at all —
the draw sites were already written and waiting on their names.
`drawTinkerForge` already called `mediaFetch('forgeFront')` and drew the
plate if it was there; `js/wolves.js` already resolved `wolfRunA` and fell
back to the walk pair without it; `ROOM_VISTA` already pointed at the
interiors. Adding the keys is what switched all of it on: the slash sheets,
the jet gear, the winch, the forge table, the Mind Node, the three kingdom
doorways and dens, the nine enemy states, the ten guardian motion plates, the
four beast run frames and the six NPC busts.

**2. THREE PLATE-FIRST ENEMY BRANCHES.** `kiln`, `rime` and `snare` now draw
their authored plates through the same `drawPlateAnchored` helper the breaker
uses, picking by state — rest / tell / spent — with the engine drawing kept
underneath as the loading fallback. Each branch is inserted after its own
state variables so it reads `tell`, `spent`/`dark`/`limp` from the case that
owns them, and each undoes the horizontal flip first, because these are
symmetric machines that must never appear to jump sides.

**3. THE SPEECH BOX SHOWS THE SPEAKER.** `drawDialog` drew HZD-99's portrait
in every conversation, including the ones where somebody else was talking.
`G.dialog.npc` already carried the speaker id, so the bust is now chosen from
it — `bustRatchet`, `bustServo` and so on — clipped to the same 64 px circle
the portrait used. **Her portrait remains the fallback**, so an unnamed
speaker or a bust that has not loaded yet draws exactly what it always did;
nothing regresses if a file is missing.

**Not wired, and deliberately:** the guardian motion plates have their keys
but no draw site yet, because that is the atlas-row-versus-separate-sheet
decision — parts atlases are addressed by ABSOLUTE PIXEL RECT, so new rows
shift every rect in `js/` and in `tools/bossparts.cjs`'s mirror table at
once. The plates and their names are in place for whoever takes that
decision; guessing it here would be the one change that breaks six bosses
invisibly.

### THE FINAL BATCH — 11 PLATES FIRED, 4 KEYED AND SHIPPED (2026-08-16)

Everything remaining that could be generated was fired in one batch of
eleven. **All eleven as-fired sources are committed** (`assets/source/` under
`guardians/`, `beasts/`, `hero/`, `monument/`, `kingdom2/`), contact sheets at
`_sheets/final_batch.png` and `final_batch_keyed.png`, so nothing here has to
be paid for twice.

**Shipped, keyed clean on the first pass:**
`guardians/talonhost_glide.png` · `guardians/prism_stalk.png` ·
`beasts/wolf_runa.png` · `beasts/cheetah_runa.png`.

**✅ ALL ELEVEN NOW SHIPPED.** The seven that would not black-key went
through `remove_background` and cut clean:
`guardians/talonhost_strike.png` · `guardians/prism_coil.png` ·
`beasts/wolf_runb.png` · `beasts/cheetah_runb.png` ·
`backgrounds/mindnode_obelisk.png` · `backgrounds/forge_table.png` · and the
charge pose, which went into the STATE SHEET at cell 16 through
`tools/herocell.cjs` rather than shipping as a loose file.

**A trap the charge cell walked into, worth the warning.** After placing a
new cell, `heroeyeclean.cjs` was run with the OLD anchor table still in
`tools/heroeye.json` — and the new pose has her head in a different place, so
it painted over her SCARF instead of her eyes (the sampled fill came back
red, which is what gave it away). **Order matters: place the cell, re-measure
with `heroeyes.cjs`, update `tools/heroeye.json` AND `HERO_EYE`, and only
then clean.** Cleaning with a stale anchor damages the plate silently.

**What they are, so the next pass does not re-derive it:**
- **TALONHOST** glides level with wings wide and talons tucked; strikes
  reared upright with wings thrown up and back and both taloned legs swung
  forward, claws spread.
- **PRISM PROWLER** stalks with all four legs in different positions; coils
  crouched almost to the ground with every shoulder and spine shard flared
  and the internal glow risen to fierce magenta.
- **The beast run pairs** are reach (all four legs at full extension, back
  hollowed) and gather (all four paws folded under the belly, back arched) —
  fired against the repaired walk pairs, and the cheetah held its tan-and-gold
  identity this time, which was the whole point of §2q.
- **The charge pose** answers the owner directly: she stands FULLY UPRIGHT,
  legs straight and neutral, arms crossed in a tight X at her chest with the
  power gathering cyan-white where the forearms meet. Because nothing about
  it is grounded, it composites over a jump — which is exactly why the crouch
  had to go.
- **The Mind Node obelisk** is a monument, several times her height, its
  faces carrying dense vertical columns of angular machine glyphs blazing
  electric cyan with current crawling between the cuts. It is meant to be
  seen across a room and walked to. **It does nothing until the node moves
  out of the NPC's room** — that placement is the code/kingdom session's.

**KEYING NOTE:** a batch fired on mixed backgrounds cannot be keyed with one
polarity. Four of these arrived on near-black and keyed straight; the rest
came on white or grey studio fields where `blackkey --white` leaves bands.
Those want `remove_background`, downscaled to ~1400 px first per the size
ceiling recorded in the kingdom-345 entry.

### 3m — GLACIERE AND THE FURNACE CHOIR SHIPPED TOO (2026-08-16)

`assets/characters/guardians/`: `glaciere_travel.png` + `glaciere_coil.png`,
`choir_drift.png` + `choir_clench.png`. All matted, sources archived.

- **GLACIERE** travels as a low shallow S-curve with its crystal spines laid
  back along the line of motion, and winds up REARED — neck hauled high and
  drawn back over its own coils like a snake loading, jaws parted, every
  shard along the spine flared and standing. A serpent has no stride, so
  "walk" is a travel pose for this one; the pair still obeys §3.3 because the
  two silhouettes could not be less alike.
- **THE FURNACE CHOIR** drifts with its petal-blades hanging loose and
  splayed and a low red throat, and winds up CLENCHED — blades drawn tight
  into a closed downward spike, pod hauled up above them, fin ring snapped
  upright, white-hot light blazing through the seams. It hovers, so neither
  plate touches ground.

**I re-broke my own §2e rule and paid for it in one round.** Three of the
first four plates came back with their own state names rendered into the
picture — "THE WIND-UP", "THE FURNACE CHOIR", "BLOOM" — because the prompts
used the state as a HEADING ("THE POSE — THE WIND-UP:"). §2e already says
never to title a pose, and a heading is a title. Rewritten as plain prose
("Give it this posture:"), with `ABSOLUTELY NO WRITING ANYWHERE IN THE IMAGE`
carried explicitly, all three came back clean.

The rule is therefore stronger than it was written: **the state name must not
appear in the prompt AT ALL** — not as a heading, not in caps, not as a
label. Describe the posture and never name it.

### 3m STARTED — NULLFANG FIRST, AND THE RECIPE IS PROVEN (2026-08-16)

**Shipped:** `assets/characters/guardians/nullfang_walk.png` and
`nullfang_coil.png` (jobs ad218a4e, 1781bba8), matted, sources archived.

**The owner asked why this was still open and he was right to.** It was held
back on the argument that the rows-vs-new-sheet decision belongs to the code
session and changes what the plates must be. That argument is wrong: the
POSES do not change either way — only where the pixels are pasted does — so
the plates could have been fired at any point. Held work is not caution.

**The recipe works and costs two fires per guardian.** The in-game
screenshot, cropped to the boss, is a good SHAPE reference precisely because
it is small and soft — art-prompts §2 wants a reference with no rendering
style worth stealing. Everything else comes from prose: the creature named
concretely, the palette in words, the black void, the pose stated as which
limb goes where.

- **walk** — diagonal-pair stride, all four legs in different positions, the
  same rule that repaired the wolf in §2q.
- **coil** — the wind-up: body gathered low, hindquarters hunched over folded
  back legs, head thrust forward along the charge line, and the blade-mane
  RAISED and flared far wider than it sits when walking. Its silhouette has
  to be the most drawn-back shape the animal makes, per §3.3.

**Two things to fix or accept when the next four are fired:**
1. **Facing drifted.** The walk faces left (the house facing for these
   plates); the coil came back angled with its head toward the right. Fire
   the second plate of each pair AGAINST THE FIRST rather than against the
   screenshot — the §2q lesson, where the wolf pair only matched once walkB
   was anchored on walkA instead of on their common ancestor.
2. Both came back on studio backgrounds despite the void phrasing and needed
   matting; budget for that.

**Remaining: TALONHOST (atlas, room C3), FURNACE CHOIR (brood, B4), GLACIERE
(zero, D3), PRISM PROWLER (prism, X1)** — screenshots already committed in
`assets/source/guardians/`. MOTHER-V is stationary and exempt.

**Wiring is still the code session's decision** (new atlas rows shift every
absolute rect in `js/` and in `tools/bossparts.cjs`'s mirror table; a
separate sheet does not). That decision no longer blocks generation.

### 3m. BOSS MOTION PLATES — PREPARED, NOT FIRED (art session, 2026-08-16)

**Not started, and deliberately so.** This is the largest block left — five
guardians × (walk pair + one anticipation frame) is fifteen plates minimum,
each needing TWO reference images, and half-firing it is worse than not
firing it: a fight where one guardian has authored stride frames and the
four beside it do not reads as broken rather than unfinished. It wants a
session that can carry the whole block.

**The preparation is done and committed**, so the next session starts at the
prompts rather than at the plumbing:

1. **The guardians are photographed in the running game** —
   `assets/source/guardians/{alpha,atlas,brood,zero,prism}_ingame.jpg`,
   captured with `node tools/bossshot.cjs <room> <out.png> 90` against a
   served build. Boss→room map, which is not written down anywhere else:
   `alpha` A10 · `atlas` C3 · `brood` B4 · `zero` D3 · `prism` X1 ·
   `mother` E3 (exempt, stationary).
2. **Each shot needs cropping to the boss** before use — the guardian is
   roughly a sixth of a 1280×720 frame and the HUD is in shot. Crop, upscale,
   and let it stay soft: art-prompts §2 wants the shape reference to have no
   rendering style worth stealing.
3. **Fire with TWO references, stated as two jobs**, which is the technique
   that fixed the lion: *"IMAGE 1 is a soft plate of the assembled guardian —
   take from it ONLY the silhouette, proportions and orientation. IMAGE 2 is
   this guardian's own parts atlas — copy its MATERIAL, LIGHTING and FINISH
   exactly, and ignore which body part each piece shows."* The parts atlases
   are `assets/characters/{beast,eagle,glaciere,dragon}_parts.png`.

**And read this before writing a single prompt:** the composition contract
from §2c/§2f applies to every plate — whole creature small in frame, flat
black field with the offences named (no wall, no backdrop, no gradient, no
vignette), no dust or haze, and never put the state's NAME in the prompt or
it gets rendered into the picture (§2e). Matting via `remove_background`
rather than `blackkey.cjs`, per §2g.

**The wiring is not a media.js line this time and should be scoped before
firing.** Parts atlases are addressed by ABSOLUTE PIXEL RECT — that is why
they are the six sheets `tools/lowres.cjs` excludes — so adding atlas rows
moves every rect below them, in `js/` and in `tools/bossparts.cjs`'s mirror
table both. `bossparts.cjs verify <boss>` exists precisely because those two
tables drifting apart makes every slice wrong invisibly. Whether the new
poses go in as extra rows or as a separate sheet is a CODE decision and
belongs to the code session; the art session should ask before firing, since
the answer changes what the plates have to be.

### 2f. GATE SHAPES + CAVE MOUTHS ✅ TEN PLATES FIRED 2026-08-16 (art session)

The owner's order was *"ask Higgsfield to produce different shapes of gates,
and caves should look like a cave opening, not a door"*. Both halves are
done, and no two of these are the same shape.

**Gates ×5**, in `assets/backgrounds/`:
- `gate_foundry.jpg` — a horseshoe furnace arch whose rim is poured metal,
  frozen mid-run in lobed drips, orange still alive in the cracks; two cast
  slabs meeting in a ragged seam that reads as sliding apart.
- `gate_archives.jpg` — a wall of stacked shelves and drawers PARTED down
  the middle into a stepped cleft, shelf-ends interlocking, frost on every
  lip and loose index cards caught in the gap.
- `gate_conduits.jpg` — a lopsided cable iris: dozens of bundles drawn in
  from the rim to a knotted centre, fibre-optic light bleeding from the
  broken ends.
- `gate_nest.jpg` — two enormous horn talons leaning together over a wide
  teardrop opening, packed around with woven branch, wire, bone and feather.
- `gate_deep.jpg` — a ringed organic iris of dull flesh in wet mineral,
  violet light only in the tendrils.

**THE CITY GATE IS DELIBERATELY NOT RE-FIRED.** `gate_city.jpg` already
exists and is the one gate the standing order singles out as the huge epic
multilayer monument. Re-rolling it would have been duplication, which the
ledger forbids, so the sixth slot is spent and closed rather than filled.

**Cave mouths ×5**, in `assets/backgrounds/` as `cave_mouth_a` … `_e`, one
per grotto network: scrap plate and wire-grass (A), cable bundles with
fibre-optic strands hanging out of the breaks (B), scorched slag with frozen
metal drips and orange in the cracks (C), frost-shot stone with ice growing
down the lip like teeth (D), dark mineral crusted with pale fleshy growth
and violet tendrils (E). All five were fired against `cave_mouth.jpg` as
reference, so the whole family shares one composition and one grammar of
opening while the material changes per kingdom — the anchor-first rule from
§2d, applied on purpose this time instead of after a failed batch.

Sources in `assets/source/gates/`; contact sheets at
`assets/source/_sheets/gates_contact.png` and `cave_mouths_contact.png`.

**NEEDS WIRING (code session).** Ten media.js entries and the per-zone
depth-door mapping. Every plate uses the same composition contract as §2c:
flat-on, ground across the bottom eighth, opening standing ON that ground in
the horizontal centre — so one anchor rule covers the whole family instead of
eleven measured exceptions. Verify against the running rooms and adjust per
plate if any opening sits off centre.

The composition contract is the reusable part of this section. Every one of
these plates says the same four things before it says anything about
material: flat and straight on with no perspective, the ground across the
bottom eighth, the opening standing ON that ground in the horizontal centre,
and no right angles anywhere. Fired that way, ten independent generations
came back as one coherent set. The one plate that broke rank was the first
nest gate, which read its brief's "tall pointed opening" as a narrow vertical
slot with straight parallel sides; naming the shape wanted — "wide,
asymmetric, lopsided, like a leaf or a teardrop" — and forbidding the slot
outright fixed it in one.

### 2g. THE TRADER'S BOOTH + DEN — PARTIALLY FIRED 2026-08-16, READ BEFORE FIRING

**STATUS (2026-08-16, code session — do not double-fire):**
- **boothFront — REPLACED BY THE ART SESSION 2026-08-16** (job b983ed7a).
  The code session's plate (d469ad29) keyed cleanly but the art session's
  re-fire beats it on material, canopy and interior read, so it took over
  `assets/backgrounds/booth_front.png` — same path, zero re-plumbing, as
  the owner's quality ruling allows. Fired-as-is archived at
  `assets/source/booth/booth_front_artsession_asfired.jpg`.
- **denInterior — THE CODE SESSION'S PLATE STANDS** (job 3bd98cc3). The
  art session fired a competing interior and judged it WORSE for the room
  and did not ship it: its foreground bench fills the lower right, which
  is exactly where the player walks, while the wired plate keeps open
  floor across the middle. A prettier picture that eats the play plane is
  not an upgrade. Not re-fired again.
- **ratchetResting — RE-FIRED AND SHIPPED 2026-08-16** (job 6b2a7128).
  Fired against Ratchet's own atlas row as reference media, so the
  resting figure is recognisably the same vendor unit: pot belly, bone
  plating, the strapped canister rig, eye-lights dark, chest crystal the
  only light. Keyed to `assets/characters/npc/ratchet_resting.png`,
  sources + the reference strip in `assets/source/ratchet/`.
  **WIRED 2026-08-16 by the code session** (commit fd2d93e): media.js
  knows `ratchetResting`, and the A0B npc anchor draws the plate at 1.5×
  npc height whenever he is a dark unit — skipping the grayscale-and-dim
  treatment, because the plate IS the powered-down read and the filter
  would kill the chest-crystal glow the image is about. The moment a cell
  wakes him the standing atlas takes over exactly as before. Lowres tier
  + roomassets regenerated. §2g is CLOSED end to end.

**KEYING NOTE, learned on both plates (2026-08-16).** `tools/blackkey.cjs`
failed on both and for the same reason twice: it decides by luminance, and
these plates have dark subject against dark field. Ratchet's shadowed far
leg keyed as background and came back full of holes; the booth's render
carried a soft glow in one corner that survived every threshold that did
not also eat the teal panels. Raising the threshold ate the subject,
lowering it kept the field — there is no threshold that works, so stop
sweeping for one. **What worked was Higgsfield's own matting pass
(`remove_background` on the generation job id), which reads the subject
rather than the exposure.** Both shipped plates are matted, not keyed. Use
it first on any plate whose subject has genuinely dark regions; blackkey
stays right for bright subjects on clean black.

The code session fired the first three before this ledger entry existed —
that mistake is why this block leads the section now. Generation belongs
to the art session; the code session wires and verifies.

Ratchet's booth is LIVE in code as a procedural stand-in (drawBooth in
js/game.js; the den is room A0B in js/world.js) — the owner asked whether
Higgsfield built it, and the answer is not yet: this session does not hold
the binding. Three plates replace the stand-in at the same anchors:

1. **boothFront** — a scrap-market kiosk standing on the meadow: leaning
   tapered posts, a sagging scallop-hemmed canopy, cloth flaps over a warm
   doorway, a small hung sign with a bolt glyph. Built from the SAME
   furniture the Scrap Meadows backdrop paints (mimic-the-background rule),
   nothing plumb or square (NO RIGHT ANGLES). Closed + flaps-parted variant.
2. **denInterior** — a backdrop painting for A0B: a one-room workshop —
   crafting bench, hanging tools, coil bundles, shelf clutter, one warm
   lamp — cosy, low, lived-in. The depth door back out sits at gx 0.12.
3. **ratchetResting** — a pose plate of Ratchet POWERED DOWN in his chair
   by the bench, slumped, dark, the small chest crystal barely glowing
   (his backstory made visible). drawSage-style placement at the A0B npc
   anchor; the standing plate takes over after the waking.

Estimated 3 fires. After keying: archive sources, wire (ROOM_VISTA.A0B is
already pointed at `denInterior`; add the three media.js entries in the
same commit as the files), photograph, then
node tests/run.cjs tutor battery crystal deadend platform.

**The prompts, verbatim — fire as-is:**

> (boothFront) A small scrap-market vendor kiosk seen straight on, built
> from salvaged machine parts: two leaning tapered metal poles, a sagging
> canvas canopy with a scalloped worn hem thrown over the top, patched
> cloth flaps hanging over a doorway glowing warm amber from inside, a
> small metal sign hanging crooked from one pole bearing a lightning-bolt
> glyph. Weathered teal-and-gunmetal palette with warm amber light in the
> doorway only. Nothing plumb, nothing square — every edge leans, sags or
> curves. Clean high-detail 3D render, soft specular metal, dark moody
> dusk lighting. NEGATIVE: no text, no watermark, no characters, no
> straight rectangular frame, no cast shadow, no ground plane. Dark
> unlit room behind the subject, subject only.

> (denInterior, 16:9 backdrop) The inside of a one-room machine-tinker's
> workshop, wide interior view: a heavy workbench along the right wall
> covered in coils and small tools, tools hanging from hooks, shelf
> clutter of jars and scrap parts, cable bundles drooping from a low
> ceiling, wooden crates, one warm hanging lamp pooling amber light over
> the bench, the rest falling into cosy teal darkness. Lived-in, low,
> warm. Weathered teal-gunmetal-amber palette. No right angles
> presenting: shelves sag, the bench leans, the lamp hangs crooked.
> Clean high-detail 3D render. NEGATIVE: no characters, no text, no
> watermark, no doors, no windows with daylight.

> (ratchetResting) A boxy vendor robot slumped POWERED DOWN in a worn
> chair beside a workbench, seen from the side: head bowed, arms hanging,
> body dark and unlit except a SINGLE SMALL CRYSTAL embedded in its chest
> giving a faint dying white-blue glow. Weathered gunmetal body with
> brass fittings. The pose reads instantly as switched off, not dead —
> intact, waiting. Clean high-detail 3D render, soft specular metal.
> NEGATIVE: no cast shadow, no ground plane, no second character, no
> text, no watermark. Dark unlit room, subject only.

### 2h. THE ORACLE'S SHRINE + PARLOR ✱ NEW (2026-08-16, kingdom 2 pass)

Mono — the Oracle — has her own place now: a depth door at mid-B3 (the
A0/A0B booth pattern, GATE_ROOM style `oracle`) into the parlor room B3B.
Two plates replace the procedural stand-ins at the same anchors, both built
from the CONDUITS backdrop's own furniture (the mimic rule) and nothing
plumb or square (NO RIGHT ANGLES):

1. **oracleBooth** — the shrine standing in the corridor: two leaning
   conduit-pipe posts with junction-box hips, a heavy sagging swag of dead
   cable bundles thrown over them as a canopy, loose fibre-optic strands
   hanging like roots with faintly lit tips, parted cable curtains over a
   doorway glowing CRT blue (NOT amber — amber is Ratchet's lamp; blue is
   the Oracle's screen), and a small cracked monitor hung crooked from one
   post with a single sine wave still alive on it. `drawOracleBooth` in
   js/game.js is the placement reference; same bottom anchor and ~236 px
   height as boothFront.
2. **oracleInterior** — a 16:9 backdrop for B3B: a one-room data-den —
   stacks of dead monitors along one wall, one alive with drifting glyphs,
   cable drapery drooping from a low ceiling, a leaning rack shelf, junction
   clutter, the whole room pooled in cold CRT blue-on-dark with one deep
   pink accent (zone B's acc2). Cosy the way a server closet is cosy.
   The depth door back out sits at gx 0.12. `ROOM_VISTA.B3B` is already
   pointed at `oracleInterior`; add the media.js entries in the same commit
   as the files.

**The prompts, verbatim — fire as-is:**

> (oracleBooth) A small roadside shrine built from salvaged data-conduit
> parts, seen straight on: two leaning bundles of vertical pipes as posts
> with boxy junction housings, a heavy sagging swag of dead cable bundles
> thrown over the top as a canopy, loose fibre-optic strands hanging down
> like roots with faint blue-lit tips, parted hanging-cable curtains over a
> doorway glowing cold cathode blue from inside, and a small cracked
> monitor hanging crooked from one post showing a single faint sine wave.
> Deep navy and gunmetal palette with cold blue light in the doorway only,
> one small magenta indicator. Nothing plumb, nothing square — every edge
> leans, sags or curves. Clean high-detail 3D render, soft specular metal,
> dark moody lighting. NEGATIVE: no text, no watermark, no characters, no
> straight rectangular frame, no cast shadow, no ground plane. Photographed
> in a pitch-dark room, no backdrop, no floor, spotlights pick out the
> shrine and nothing else receives any light.

> (oracleInterior, 16:9 backdrop) The inside of a one-room data-den, wide
> interior view: a wall of stacked dead monitors with one screen still
> alive showing drifting glyphs, heavy cable bundles drooping from a low
> ceiling like vines, a leaning equipment rack shelf, junction boxes and
> coiled fibre clutter on the floor, cold cathode blue light pooling from
> the live screen over everything, the rest falling into deep navy
> darkness, one small magenta status lamp. Lived-in, low, humming. No
> right angles presenting: racks lean, shelves sag, cables curve. Clean
> high-detail 3D render. NEGATIVE: no characters, no text, no watermark,
> no doors, no windows with daylight.

### 2i. THE BREAKER (surge — new zone-B enemy, 2026-08-16) ✱ NEW

The Data Conduits' own machine (js/entities.js, kind `surge`): a squat
breaker drum bolted to the conduit rail that vents its overload as a charge
wave crawling the floor BOTH ways — the kingdom's lesson in being airborne
on a beat, taught before TALONHOST asks "where are you standing?" for
keeps. Atlas-creature plates in the minion family style (small machine,
reads smaller than HZD-99); the engine-drawn fallback (`case 'surge'` in
Enemy.draw, js/entities.js) is the placement reference:

- **rest** — the drum low and latched on its bolted saddle, three ceramic
  insulator fins folded flat along its back, bronze end caps, cable stubs
  arcing into the ground on both sides, one dull violet charge-window.
- **tell** — fins FLARED upright and spread, body lifted off the saddle,
  charge-window hot (the amber wash is code; the POSE is the plate —
  silhouette must differ from rest per ART_BIBLE §3.3).
- **vented** — side vents fallen open showing hot amber slots, fins
  drooped, body sagging: visibly spent, the punish window made readable.

NEGATIVE for all: no legs, no barrel or gun (it must never read as the
turret), no second character, no text, no watermark; dark-room phrasing
per the §1 warnings, subject only.

### 2j. SERVO'S WINDING HOUSE ✱ FIRE ON REBIND (kingdom 1 session, 2026-08-16)

The kingdom protocol asks that every NPC have a PLACE or a reason; Old Servo
now has both. His coil errand already says he cannot climb any more, and his
standing line says he built half the district — so the structure behind him
in A1 is the winch he raised the gantries with: drum, A-frame, sagging
canvas, the cable still made off toward the climb. `drawWinchHouse` in
js/game.js (drawn via ROOM_PROPS) is the procedural stand-in and the
placement reference — one plate replaces it at the same ground anchor
(tile 3, ground line, roughly 110×100 px on screen). Mimic-the-background
rule: it is built from the same scrap furniture the Scrap Meadows backdrop
paints. NO RIGHT ANGLES: every edge leans, sags or curves.

> (winchHouse) A small salvaged cable-winch station on a scrap meadow, seen
> straight on: a big round cable drum with worn spokes hung slightly askew
> in a leaning A-frame of two tapered scrap-metal poles, a patched canvas
> sheet with a sagging scalloped hem thrown over the top, a heavy cable
> running off the drum up toward the upper right and out of frame, a coil
> of spare cable and a crooked one-legged stool at the base, one small
> work lamp hanging from the frame giving a tired warm amber glow.
> Weathered teal-and-gunmetal palette, verdigris staining, warm amber only
> at the lamp. Nothing plumb, nothing square — every edge leans, sags or
> curves. Clean high-detail 3D render, soft specular metal, dark moody
> dusk lighting. NEGATIVE: no text, no watermark, no characters, no
> straight rectangular frame, no cast shadow, no ground plane.
> Photographed in a pitch-dark room, no backdrop, no floor, spotlights
> pick out the structure and nothing else receives any light.

After keying: archive the source, wire as a media.js entry drawn at the
ROOM_PROPS A1 anchor with `drawWinchHouse` kept as the loading fallback,
photograph, then node tests/run.cjs boot deadend platform.

### 2k. THE TINKER'S QUENCH HOOD + FORGE ✱ NEW (2026-08-16, kingdom 3 pass)

Patch-7 — the Tinker — has his own place now: a depth door at the right end
of the Pour Gallery (GATE_ROOM C5, the A0/A0B booth pattern, style `forge`)
into the workshop room C5B, under the very platform one of his errand's gun
emplacements holds. Two plates replace the procedural stand-ins at the same
anchors, both built from the FOUNDRY backdrop's own furniture (the mimic
rule: pour ladles, slag, chains, machine hoods) and nothing plumb or square
(NO RIGHT ANGLES):

1. **forgeFront** — the quench hood standing in the gallery: a scorched
   extraction bell sagging between two leaning chain-wrapped pipe
   stanchions, slag crusted and heaped around the base with ember seams
   still alive in it, a tipped pour ladle resting against the left post,
   hanging chains with hooks off the hood lip, a chain curtain over a
   doorway breathing molten orange from inside (NOT lamp amber — that is
   Ratchet's; not CRT blue — that is the Oracle's; this is the pour light
   the hall already casts), and a small gear-wheel sign hung crooked from
   the hood lip. `drawTinkerForge` in js/game.js is the placement
   reference; same bottom anchor and ~236 px height as boothFront.
2. **forgeInterior** — a 16:9 backdrop for C5B: a one-room smithy — a low
   hearth glowing at one side, an anvil-block and scattered tongs, a
   slag-crusted tool loft sagging along one wall hung with hammers and
   ladles, coiled chain and cog clutter on the floor, the whole room lit
   by the hearth's molten orange with deep rust-brown darkness above and
   one pale-gold accent (zone C's acc2). Lived-in the way a one-man
   workshop is lived-in. The depth door back out sits at gx 0.12.
   `ROOM_VISTA.C5B` is already pointed at `forgeInterior`; add the
   media.js entries in the same commit as the files.

**The prompts, verbatim — fire as-is:**

> (forgeFront) A small salvaged smithy entrance built from foundry
> equipment, seen straight on: a big scorched sheet-metal extraction hood
> sagging between two leaning pipe stanchions wrapped in slack chain
> loops, cooled slag heaped and crusted around the base with faint orange
> ember seams still glowing in the crust, a tipped metal pour ladle
> resting against the left post with a residue of molten glow inside, a
> few hanging chains with open hooks swinging from the hood lip, a
> hanging-chain curtain over a doorway breathing warm molten orange light
> from inside, and a small worn gear wheel hung crooked from the hood lip
> as a sign. Deep rust-brown and soot-black palette, molten orange light
> in the doorway and ember seams only. Nothing plumb, nothing square —
> every edge leans, sags or curves. Clean high-detail 3D render, soft
> specular scorched metal, dark moody lighting. NEGATIVE: no text, no
> watermark, no characters, no straight rectangular frame, no cast
> shadow, no ground plane. Photographed in a pitch-dark room, no
> backdrop, no floor, spotlights pick out the structure and nothing else
> receives any light.

> (forgeInterior, 16:9 backdrop) The inside of a one-room machine smithy,
> wide interior view: a low open hearth glowing molten orange at one
> side, a heavy anvil block with scattered tongs and a half-finished
> mechanism on it, a sagging slag-crusted loft shelf along one wall hung
> with hammers and ladles, coiled chains and gear wheels cluttering the
> floor, warm molten light pooling from the hearth over everything, the
> rest falling into deep rust-brown darkness, one pale gold indicator
> lamp. Lived-in, low, warm, one machine's whole life in one room. No
> right angles presenting: shelves sag, posts lean, chains curve. Clean
> high-detail 3D render. NEGATIVE: no characters, no text, no watermark,
> no doors, no windows with daylight.

### 2l. THE KILN VENT (kiln — new zone-C enemy, 2026-08-16) ✱ NEW

The Foundry's own machine (js/entities.js, kind `kiln`): a squat casting
pot plumbed into the floor that blows a standing column of furnace heat
straight up off its mouth on a told beat — the kingdom's lesson in heat
running on a rhythm and in how much of the quiet you dare spend, taught
before FURNACE CHOIR runs the greed test for keeps (registry §4). Atlas-
creature plates in the minion family style (small machine, reads smaller
than HZD-99); the engine-drawn fallback (`case 'kiln'` in Enemy.draw,
js/entities.js) is the placement reference:

- **rest** — a squat vertical crucible with a flared mouth, sitting in its
  own cooled slag skirt (never a square plinth), bronze mouth collar,
  three ceramic damper petals folded flat over the mouth, feed pipes
  arcing into the ground both sides, a dull ember light in the throat.
- **tell** — damper petals HINGED WIDE off the rim, the middle one lifted,
  throat white-hot (the amber wash is code; the POSE is the plate —
  silhouette must differ from rest per ART_BIBLE §3.3), body swelling.
- **spent** — petals hanging drooped past wide, throat dead dark, side
  grates fallen open showing hot amber slots: visibly empty, the punish
  window made readable across a room.

NEGATIVE for all: no legs, no horizontal drum (it must never read as the
breaker), no barrel or gun (nor the turret), no second character, no
text, no watermark; dark-room phrasing per the §1 warnings, subject only.

### 2m. THE SAGE'S STACKS + CARREL ✱ NEW (2026-08-16, kingdom 4 pass)

The Nine-Lives Sage — the Archivist orb — has its own place now: a depth
door at mid-D1 (GATE_ROOM D1, the A0/A0B booth pattern, style `carrel`)
into the reading den D1B, dug into the frozen card-index behind the
corridor. Two plates replace the procedural stand-ins at the same anchors,
both built from the ARCHIVES backdrop's own furniture (the mimic rule:
shelf stacks, card drawers, ledgers, hoarfrost) and nothing plumb or
square (NO RIGHT ANGLES):

1. **carrelFront** — the shelf-stacks standing in the corridor: two piles
   of frozen ledger slabs leaning TOWARD each other into an accidental
   crevice-arch (a fourth silhouette — not the kiosk's canopy, not the
   shrine's cable swag, not the quench hood's bell), every course a
   different length and lean, a frost sheet flowed over the taller pile,
   icicles off the lintel spines, a drift of spilled index cards frozen
   mid-slide at the base, the crevice doorway breathing pale glacial
   glyph-light (NOT lamp amber — Ratchet's; not CRT blue — the Oracle's;
   not molten orange — the Tinker's; this is the Archivist's own reading
   light, the #9fe8ff the sage itself glows), and a small hooded reading
   lamp hung crooked from one lintel spine as a sign. `drawSageCarrel` in
   js/game.js is the placement reference; same bottom anchor and ~236 px
   height as boothFront.
2. **carrelInterior** — a 16:9 backdrop for D1B: a one-room reading den —
   a wall of frozen card-index drawers with one drawer half-open and
   faintly glowing, a lectern with an open ledger and a pool of pale
   reading light over it, a sagging loft shelf stacked with ledger slabs
   along one wall, hoarfrost feathering every shadowed edge but pulled
   back around the lectern (the one floor in the kingdom the frost never
   took), the whole room in deep archive blue-dark with one violet accent
   (zone D's acc2). Quiet the way a library after closing is quiet. The
   depth door back out sits at gx 0.12. `ROOM_VISTA.D1B` is already
   pointed at `carrelInterior`; add the media.js entries in the same
   commit as the files.

**The prompts, verbatim — fire as-is:**

> (carrelFront) A small reading-den entrance built from salvaged archive
> shelving, seen straight on: two tall piles of thick frozen ledger slabs
> and data-cassettes stacked like books, leaning toward each other until
> they touch and form a narrow crevice doorway, every slab a different
> length and angle, a smooth sheet of ice flowed over the taller left
> pile, thin icicles hanging from the slabs that bridge the top, a drift
> of spilled index cards frozen mid-slide around the base, the crevice
> breathing a pale glacial blue-white light from inside with faint
> geometric glyphs drifting up in it, and a small hooded reading lamp
> hanging crooked from one protruding slab. Deep archive navy and
> blue-grey palette, pale ice-white light in the doorway only, one small
> violet indicator. Nothing plumb, nothing square — every slab leans,
> sags or overhangs. Clean high-detail 3D render, soft frosted specular,
> dark moody lighting. NEGATIVE: no text, no watermark, no characters, no
> straight rectangular frame, no cast shadow, no ground plane.
> Photographed in a pitch-dark room, no backdrop, no floor, spotlights
> pick out the structure and nothing else receives any light.

> (carrelInterior, 16:9 backdrop) The inside of a one-room frozen reading
> den, wide interior view: a wall of old card-index drawers furred with
> hoarfrost with one drawer half-open and glowing faintly, a leaning
> lectern holding an open oversized ledger under a pool of pale blue-white
> reading light, a sagging loft shelf stacked with thick ledger slabs
> along one wall, frost feathering every dark edge but melted back to
> clean floor in a circle around the lectern, the rest falling into deep
> archive navy darkness, one small violet status lamp. Hushed, cold,
> lived-in by something that reads forever. No right angles presenting:
> shelves sag, drawers sit crooked, ice rounds every corner. Clean
> high-detail 3D render. NEGATIVE: no characters, no text, no watermark,
> no doors, no windows with daylight.

### 2n. THE RIME COIL (rime — new zone-D enemy, 2026-08-16) ✱ NEW

The Frozen Archives' own machine (js/entities.js, kind `rime`): a waisted
condenser bobbin bolted into the stacks' floor that grows a frost ring to
a told edge and SNAPS everything inside the circle, grounded or airborne
alike — the kingdom's lesson that the cold closes as a RADIUS and jumping
is not an answer to a radius, distance is, taught before GLACIERE's
ABSOLUTE ZERO hush asks it for keeps ("be outside it when the silence
lands"). Atlas-creature plates in the minion family style (small machine,
reads smaller than HZD-99); the engine-drawn fallback (`case 'rime'` in
Enemy.draw, js/entities.js) is the placement reference:

- **rest** — a waisted vertical bobbin (two rounded lobes, pinched
  middle) standing in its own hoarfrost skirt (never a square plinth), a
  bronze cooling coil wrapped in three sagging turns around the waist,
  feed lines arcing into the ground both sides, three short frost
  needles laid low around the upper collar, a dull pale-ice pulse in the
  upper lobe.
- **tell** — the frost-needle crown EXTENDED and fanned upright off the
  collar, body lifted, core white-bright (the amber wash and the growing
  ring are code; the POSE is the plate — silhouette must differ from
  rest per ART_BIBLE §3.3).
- **dark** — crown needles snapped over and drooping, core dead dark,
  side frost-vents fallen open showing pale glowing slots: visibly
  empty, the punish window made readable across a room.

NEGATIVE for all: no legs, no horizontal drum (it must never read as the
breaker), no flared open mouth (nor the kiln), no barrel or gun (nor the
turret), no second character, no text, no watermark; dark-room phrasing
per the §1 warnings, subject only.

### 2o. THE NYMPH'S POD + HOLLOW ✱ NEW (2026-08-16, kingdom 5 pass)

Lumen — the Lost Nymph, the leaf-wrapped light — has her own place now: a
depth door at mid-E1 (GATE_ROOM E1, the A0/A0B booth pattern, style
`hollow`) into the den E1B, a burst cocoon-pod behind the Nest's tissue
columns. Two plates replace the procedural stand-ins at the same anchors,
both built from the VIRUS NEST backdrop's own furniture (the mimic rule:
tissue-of-cable columns, cocoon pods, infection veins) and nothing plumb
or square (NO RIGHT ANGLES):

1. **hollowFront** — the pod standing in the corridor: a burst teardrop
   cocoon woven of dead cable-strands, slung LOW between two cable-tissue
   columns that lean together (a fifth silhouette — not the kiosk's
   canopy, not the shrine's cable swag, not the quench hood's bell, not
   the stacks' crevice-arch: a HANGING POD), every strand course a
   different sag, an off-centre tear for a doorway with curled-back lips,
   the tear breathing LEAF-GREEN light (#7dff9a, zone E's acc2 — NOT lamp
   amber (Ratchet's), not CRT blue (the Oracle's), not molten orange (the
   Tinker's), not pale ice (the Archivist's): Lumen's own glow), the
   Nest's red/magenta infection veins pulsing on the columns' OUTER edges
   and running dead grey where they near the mouth — her light keeps this
   one pocket clean — a drift of dry shed leaf-scales at the base, and a
   lantern-bud (a closed leaf-flower glowing from inside) drooping off
   one column as a sign. `drawLumenHollow` in js/game.js is the placement
   reference; same bottom anchor and ~236 px height as boothFront.
2. **hollowInterior** — a 16:9 backdrop for E1B: a one-room den inside
   the cocoon — woven cable-tissue walls curving up like the inside of a
   basket, a nest of soft dry leaves in the middle under a pool of warm
   leaf-green light, small lantern-buds strung off the weave at different
   heights each glowing faintly, one sagging strand-hammock along a wall,
   the walls' infection veins visible but GREY and still wherever the
   green light reaches with one faint magenta pulse far up in the dark of
   the ceiling (the Nest is still out there), the whole room in deep
   violet-dark. Safe the way a blanket fort is safe: the only calm room
   in the kingdom, and the light is why. The depth door back out sits at
   gx 0.12. `ROOM_VISTA.E1B` is already pointed at `hollowInterior`; add
   the media.js entries in the same commit as the files.

**The prompts, verbatim — fire as-is:**

> (hollowFront) A small den entrance grown rather than built, seen
> straight on: a large burst teardrop-shaped cocoon pod woven from dead
> grey-violet cables and organic strands, slung low between two thick
> columns of cable-tissue that lean toward each other, every woven strand
> sagging a different amount, an off-centre vertical tear in the pod
> forming a narrow doorway with softly curled-back lips, the tear
> breathing a gentle leaf-green light from inside with tiny green motes
> drifting out, thin red and magenta veins pulsing faintly on the outer
> edges of the columns but fading to dead grey where they approach the
> glowing doorway, a drift of dry fallen leaves around the base, and a
> single closed flower-bud lantern glowing green from inside, drooping on
> a curved stem from one column. Deep violet and dark purple palette,
> soft leaf-green light in the doorway only. Nothing plumb, nothing
> square — every strand sags, leans or curls. Clean high-detail 3D
> render, soft organic specular, dark moody lighting. NEGATIVE: no text,
> no watermark, no characters, no straight rectangular frame, no cast
> shadow, no ground plane. Photographed in a pitch-dark room, no
> backdrop, no floor, spotlights pick out the structure and nothing else
> receives any light.

> (hollowInterior, 16:9 backdrop) The inside of a one-room den within a
> woven cocoon, wide interior view: walls of tightly woven dead cables
> and organic strands curving up and inward like the inside of a basket,
> a round nest of soft dry leaves on the floor under a pool of warm
> leaf-green light, several small closed flower-bud lanterns strung from
> the weave at different heights each glowing gentle green, a sagging
> strand-hammock along one wall, thin infection veins visible in the
> weave but dead grey and still wherever the green light reaches, one
> faint magenta pulse far up in the dark of the ceiling, everything else
> falling into deep violet darkness. Safe, warm, hidden — the only calm
> room in an infected place. No right angles presenting: every line of
> the room is a curve of the weave. Clean high-detail 3D render.
> NEGATIVE: no characters, no text, no watermark, no doors, no windows
> with daylight.

### 2p. THE NEST SNARE (snare — new zone-E enemy, 2026-08-16) ✱ NEW

The Virus Nest's own machine (js/entities.js, kind `snare`): a thorned
polyp rooted where it grew that reaches a tendril out through its whole
tell, LATCHES anything inside the told radius and reels it into the
thorns — the kingdom's lesson that the Nest does not strike you, it
DRAWS YOU IN, and the failure is recoverable: run against the reel and
the overstretched line snaps. It is MOTHER-V's tendril-grab read ("break
line-of-pull by MOVING"), taught a kingdom before the guardian asks it
for keeps, and the first minion to glow with the infection's own red
(MIMIC_EL `vizrr`). Atlas-creature plates in the minion family style
(small machine-flesh hybrid, reads smaller than HZD-99); the engine-drawn
fallback (`case 'snare'` in Enemy.draw, js/entities.js) is the placement
reference:

- **rest** — a woven teardrop bulb of grey-violet cable-tissue rooted to
  the floor by four splayed holdfast tendrils (never a plinth), two dead
  cable-strands wrapped sagging around its belly, a ring of four short
  thorn hooks folded low around its crown, a dull red pulse deep in the
  bulb's heart — a slow heartbeat, the broadcast's own.
- **tell** — the thorn crown SPREAD wide open and the bulb leaning, one
  long tendril arced up and out of the maw with an open hook at its tip
  (the amber wash and the reach arc are code; the POSE is the plate —
  silhouette must differ from rest per ART_BIBLE §3.3), core burning
  bright red.
- **limp** — the tendril fallen and lying slack along the ground, thorn
  hooks drooped over the crown's rim, bulb sagged sideways off its
  rooting, core dead dark: visibly spent, the punish window made
  readable across a room.

NEGATIVE for all: no legs, no horizontal drum (it must never read as the
breaker), no flared metal crucible mouth (nor the kiln), no waisted
bobbin (nor the rime), no barrel or gun (nor the turret), no face, no
second character, no text, no watermark; dark-room phrasing per the §1
warnings, subject only.

### 1e. THE RUN PAIR RE-FIRE ✅ FIRED AND SHIPPED 2026-08-16 (art session)

**Done.** Jobs e53d354e (run_a) and f997ec67 (run_b). She hurries upright now —
torso vertical, head level, one leg reaching and one pushing off, cape
trailing — instead of lunging along the floor like a cat, which is what the
owner rejected. Both cells are in `assets/characters/hero/states.png` at cells
3 and 4, sources archived to `assets/source/hero/run_a.jpg` / `run_b.jpg`,
eye anchors re-measured and updated, `tests/run.cjs hero artbible` green.

**STILL PARKED IN CODE.** `heroState()` in js/entities.js is still substituting
the walk pair at 13 fps for the run — the two-line revert is the code session's
and the new cells do not reach the screen until it lands.

Three things this fire taught, all of them about COMPOSITION rather than pose:

1. **A strip reference makes a strip.** The first pair was fired with three
   cells of her own sheet attached as reference, to pin camera and scale. It
   pinned those perfectly and then also copied the LAYOUT: both results came
   back as three-panel strips with the figure cut by the panel borders. The
   fix is to say the composition out loud and first — "ONE SINGLE FIGURE,
   alone, centred, entire body inside the frame, not a sheet, not a strip, not
   split into panels" — before any word about the character.
2. **Even then it may hand you two.** The second run_b came back as two
   figures side by side. That is recoverable and worth recovering: they share
   one camera, one light and one scale, so splitting them yields a genuinely
   matched pair. `tools/herocell.cjs` and the split are in this commit's
   scratch work; the two shipped cells are one from each fire.
3. **The strides must actually differ.** The two figures in a single plate
   looked like a pair and were nearly the same stride — §3.3 would have called
   that one drawing twice. The shipped pair is one figure from each fire, with
   opposite legs forward.

Wiring, for whoever does it: `node tools/herocell.cjs <sheet> <out>
run_a=<a>,ground run_b=<b>,air` replaces cells in place without rebuilding the
sheet — which matters, because `herostates.cjs` re-derives the global scale
from whatever directory it is given and would move the other twenty cells.

---

### 1e (original brief, kept for the record) — the owner rejected v1

The fired `run_a`/`run_b` cells came back as a LOW FELINE LUNGE — body
horizontal, paws forward like a sprinting cat. The owner's exact words
(2026-08-15): *"Hero is moving like a cat instead of running like a cute
robot."* Those two cells are PARKED — `heroState()` in js/entities.js
substitutes the walk pair at 13 fps with a mechanical lean+bounce
(drawRoboPlate) until the re-fire lands. Wiring is a two-line revert in
`heroState()` once the new cells pass review.

The brief, per cell (canon element `<<<467c8e08-8161-483f-a4cf-439875ff04e2>>>`
in the prompt, identity line + standing negatives as always):

- **run_a**: UPRIGHT hurrying jog, torso vertical with a slight forward
  lean, front leg reaching, back leg pushing off — a wind-up-toy hurry, not
  an animal sprint. Side view facing right.
- **run_b**: the opposite stride — other leg forward, arms swapped — same
  upright carriage, same lean. Side view facing right.

Hard requirements learned from v1: NO ground streaks, NO motion-blur smears,
NO baked cast shadow or floor patch under her (v1 shipped with gray slab
remnants in 8 cells — `tools/cleanstates.cjs` had to scrub them; the
generation warnings in the STATUS LEDGER apply: dark-room phrasing beats
"pure black background", never white-key her, bright and even exposure).
After keying: paste into `assets/characters/hero/states.png` cells 3 and 4
(HERO_CELL run_a/run_b), archive the fired originals in
`assets/source/hero/`, re-run `tools/heroeyes.cjs` for the two cells' eye
rects, then `node tools/lowres.cjs && node build.cjs` and
`node tests/run.cjs hero artbible`.

### 1a. The turnaround — 8 yaw angles, one prompt each  ✅ DONE (both variants)
`hzd_yaw0 … hzd_yaw7`: 0° (facing screen-right), 45°, 90° (facing camera),
135°, 180° (facing screen-left), 225°, **270° (directly away — the back the
gate walk needs)**, 315°. Standing neutral, feet on the bottom ground line,
blade on her back, scarf hanging. Assemble with `tools/turnsheet.cjs` exactly
as the NPC sheet was.

### 1b. The action plates — one per statesheet cell that needs a body
From `assets/source/ref/hzd99_states.png` (the checklist): run contact + run
passing · rise · apex · fall · double-jump tuck (mid-rotation) · land squash ·
dash lunge · skid lean-back · wall cling (side-on against a vertical) · claw
swing 1 / 2 / cross-finisher (arm thrown, ONE-PIECE limb) · charge crouch
(braced, glowing) · burst release · hurt recoil · heal kneel · the Song (head
up, visor bright, mouth open) · low-health slump · back-walk contact +
back-walk passing (for the gates).

**Wiring when they land:** her body switches to the plates behind the same
yaw/cross-fade renderer the bosses use (`drawAtlas` grammar, new sheet — NOT
roster row 0, which is retired); scarf, blade glow, jets, charge aura and claw
arcs stay procedural overlays. The gate walk uses yaw 270° + the two back-walk
plates on the wolves' stride counter. `tests/hero.cjs` gains: every named
state's plate exists, and no state silhouette matches idle above the §3.3 IoU
line. Keep the procedural body as the loading fallback only.

---

## 1b. THE SWORD ARC (owner's design, 2026-08-14) — briefs pending

The weapon is a PURIFIER WHITE CRYSTAL shaped like a sword (owner's final
form): translucent faceted white crystal blade, dark-steel hilt, gold pommel
ring that is a visible CONNECTOR. It is the instrument that DISINFECTS the
sages when fought — the purification fork and the weapon are the same object,
which is the story doing its own mechanics.

The first NPC GIVES it to her (a short Higgsfield VIDEO of the handover
plays). The OTHER HALF is buried somewhere secret late-game; the two pommel
connectors LOCK into the double-ended purifier crystal, which opens a NEW
SKILL TREE ending in the boomerang throw (attack = throw the spinning crystal,
it returns). With the sword: three authored slash light-sheets (horizontal,
diagonal, directional up / air-down) and Lost Crown-style combos.

Full crystal art set fired 2026-08-14: single alone, reunited alone, held
(guard + horizontal slash), double held (staff guard + spin), thrown (weapon
spinning boomerang + her follow-through). The earlier green-blade sword_full
plate is superseded by the crystal set.
Tasks #79/#80/#81 carry the wiring; the video brief and slash-sheet briefs go
here when written.

### 1b-i. THE SLASH LIGHT-SHEETS ✱ FIRE ON REBIND — the single crystal's patterns
Four plates, 1:1, additive-light style (painted as pure light on black, drawn
with 'lighter' like the RAKE sheet — brightness IS the alpha). Each is the ARC
the crystal leaves, alone, no character: a ribbon of pure white light with a
crystalline faceted edge and a white-hot leading rim, motes shedding off the
trailing edge.
  slash_h   a wide flat HORIZONTAL crescent, swept left, thickest mid-stroke
  slash_d   a DIAGONAL crescent rising left-to-right at ~40°
  slash_u   a vertical crescent bursting UPWARD, widest overhead
  slash_dn  a downward-driving crescent with impact splash at its foot (the
            air-down pogo slash)
NEGATIVE for all: no character, no sword visible, no green, no text, no
watermark, no cartoon outline. These become the sword-mode replacements for
the RAKE arcs; combos re-tint the same four (task #81).

### 1b-ii. REGRIPS + RESCALE ✱ FIRE ON REBIND
  held_guard, double_guard  regenerate with: "her paw WRAPPED AROUND the hilt,
    fingers closed over it, the hilt visibly INSIDE the grip" — the first pass
    overlapped paw and hilt without gripping.
  thrown  regenerate with: "the weapon LARGE in frame, the same apparent size
    as when held — a two-ended crystal the length of her whole body, spinning"
    — the owner caught the thrown plate reading smaller than the held one.
    (In-engine the scale is set by the renderer, so gameplay never inherits
    the plate's size; the archive still must not lie about it.)

### 1b-iii. THE TWO-HAND TECHNIQUE  ✅ DONE (2026-08-15, canon + crystal elements)
Four plates, fired against the canon element so the dancing cat is the same cat
as everywhere else. Archived to `assets/source/crystal/`, contact sheet at
`assets/source/_sheets/crystal_twin.jpg`.
  twin_guard   both halves up, one high one low, the ready stance of the
               six-second twin window
  swirl_wind   up onto one toe, the turn beginning, scarf already carrying it
  swirl_peak   mid-dance, both blades out, the ring half-drawn
  swirl_fx     the arc ALONE, no character: a five-petal crystalline flower of
               white light — additive, black ground, brightness IS the alpha
The in-game ring is procedural and drawn from `swirl_fx`'s shape (a five-petal
rose curve, squashed to the ground plane); the three character plates are the
reference the pose was animated against, not sheets the engine loads. The move
itself — every number and why — is `docs/combat/HERO_SWIRL.md`, measured by
`tests/twin.cjs`.

### 1c. THE BACK JET ✱ FIRE ON REBIND — the double jump is hardware now
The double jump is a BACK JET THRUST (owner's call; the pirouette is retired —
wired procedurally already, the plume is additive light per §0.0). Two gear
plates, same treatment as the thrust boots:
  jetpack        the pack alone as equipment: a compact dark-steel back unit
                 with twin ribbed pressure bottles, one down-angled nozzle,
                 cyan light seams, worn edges — bolted-on, not born-with
  jetpack_fire   the same pack at FULL BURN, a hard cyan-white plume with
                 shock diamonds blasting down-behind
...and one character plate: her mid double-jump from the side, body stretched
along the thrust, tipped back, the pack firing. Reference mandatory.

### 1d. THE HANDOVER FILM ✱ FIRE ON REBIND (generate_video)
Short clip for task #79: the first machine-folk trader holds out the single
purifier crystal sword in both hands; the small robot cat takes it; the
crystal flares white as her paw closes on it. Style matched to the intro
films; her identity from the reference plate; end on the white flare (cuts to
gameplay). ~6-8s.

**CANONICAL CHEST, settled:** the owner spotted two chest treatments across the
sheets — brushed-STEEL plate with the dark vent grille vs an all-white belly.
The STEEL PLATE + GRILLE (the reference's own chest) is canonical; the unarmed
front half-turn was regenerated to match, and every future brief must name it.

## 2. TERRAIN DEPTH — the front layer (task #76)

**Why:** the play plane is flat next to the backdrop. The brief came with a
Silksong reference: the ledge tops carry a crust, the SIDES and undersides carry
real material, roots and teeth hang off every lip, and foreground growth rises
from the bottom of the screen past the platform line — so the layer the player
is standing on has depth of its own, not just the sky behind it.

The procedural half is done (the bite, the lip, the hang — see `drawTiles`).
These are the authored materials that replace the flat rock on the vertical
faces.

**Model:** `nano_banana_pro` · **aspect:** `16:9` · no reference needed

### 2a-2f. `edge_<zone>` — one per kingdom, horizontally tileable

Substitute the kingdom line into the template:

| key | kingdom | material line |
|---|---|---|
| `edgeA` | Scrap Meadows | rusted scrap plate and packed grey dirt, wire-grass roots trailing out of it, verdigris staining |
| `edgeB` | Data Conduits | dark polymer and cable bundles, loose fibre-optic strands hanging like roots, faint blue light inside the breaks |
| `edgeC` | Foundry | scorched slag and cracked firebrick, cooled drip-formations hanging, orange heat still in the deepest cracks |
| `edgeD` | Archives | frost-shot pale stone with ice growing along the underside in ragged columns |
| `edgeE` | the Deep | dark mineral crusted with fleshy growth, thin violet-lit tendrils hanging |
| `edgeX` | Prism | fractured rose crystal, broken shards hanging point-down, dispersion along every edge |

> A HORIZONTAL STRIP OF BROKEN GROUND, seen straight on from the side, filling
> the full width of the frame. The TOP THIRD is the walking surface, cut off
> flat. Below it the strip is a torn cross-section of <MATERIAL LINE>, and the
> BOTTOM EDGE IS RAGGED — an irregular fringe of hanging roots, teeth and broken
> pieces of differing lengths dropping off the underside, some long, some short,
> never a straight line.
>
> The LEFT AND RIGHT EDGES of the strip must be identical so the strip tiles
> seamlessly when repeated horizontally.
>
> STYLE: high-detail three-dimensional render with real volume and depth, lit
> from the upper left so the top lip catches light and the underside falls into
> shadow.
>
> Pure black background above and below the strip, no scenery, no characters.
>
> NEGATIVE: no straight bottom edge, no floating pieces, no text, no watermark,
> no flat 2D drawing, no cartoon outline, no grass lawn, no tiling seam.

### 2g-2l. `fore_<zone>` — the foreground occluders

> A SINGLE TALL FOREGROUND ELEMENT for a side-scrolling game, rising from the
> BOTTOM of the frame to the TOP, seen straight on and very close to camera:
> <FOREGROUND SUBJECT>. It is a silhouette-first shape — read as a dark mass
> with only its edges catching light, because it will be drawn in front of the
> play area and must never compete with what is behind it.
>
> Foreground subjects: **A** a leaning tower of stacked scrap chassis with cable
> ivy · **B** a bundle of vertical conduit pipes with junction boxes · **C** a
> soot-black chimney stack with iron banding · **D** a column of layered ice over
> a frozen ladder · **E** a fleshy stalk crusted with pods · **X** a cluster of
> crystal columns.
>
> STYLE: high-detail three-dimensional render, very dark, rim light only.
> Pure black background, subject only, no ground plane, no cast shadow.
>
> NEGATIVE: no bright interior detail, no text, no watermark, no characters,
> no flat 2D drawing.

**Wiring when they land:** `edge_<zone>` replaces the flat rock sample on the
vertical faces in `drawTiles`; `fore_<zone>` becomes a parallax layer drawn
AFTER the player at ~1.15 travel, two or three per room, placed off the room's
own hash so they never land on a doorway.

### 2q. THE PACK'S RUN PAIRS ×4 ✱ FIRE ON REBIND (code session, 2026-08-16)

The gait now SPLITS AT SPEED (js/wolves.js): above 95 px/s a wolf or cheetah
is running — longer stride, suspension beat, back flexion — with the motion
timing taken from the measured CC0 reference (docs/MOVEMENT_SOURCES.md §2:
ScratchIO's wolf, 6-frame run vs 8-frame walk). The transforms carry the run
today over the WALK plates; what is missing is the two run poses themselves.

Four plates, keys `wolfRunA` / `wolfRunB` / `cheetahRunA` / `cheetahRunB`
(js/wolves.js already resolves these and falls back to the walk pair until
they land — add the media.js entries in the wiring commit):

- **runA — REACH**: full extension. Forelegs stretched far forward, hind
  legs driving off behind, back long and slightly hollowed, head level with
  the spine. The wolf bounds; the cheetah's reach is longer and lower.
- **runB — GATHER**: the airborne fold. All four paws off the ground and
  gathered under the body, back FLEXED into an arch, head driven forward.
  This is the suspension frame — the one the walk pair cannot fake.

Same animal, same palette, same fixed key light and same scale as the wired
walk pairs (`wolfWalkA` … `cheetahWalkB` are the references — fire AGAINST
them, identity-lock style, one per animal then the second against the
first). Side view facing LEFT like every plate in js/wolves.js. NEGATIVE:
no ground, no dust, no motion blur, no background, subject only — the
engine draws the ground and the speed.

### §1e ADDENDUM — THE RUN PAIR REFUSED (owner, 2026-08-16, in play)

The re-fired run_a/run_b are REFUSED on three counts, in the owner's words:
"my character is hopping in one leg and backward" and "I specifically
instructed you to keep the short legs in the game but you now changed it to
the long version." The cells are re-parked (the run is the walk pair,
hurried, which he approved) until a re-fire that satisfies ALL of:
1. **SHORT LEGS** — the in-game proportions he explicitly kept, NOT the
   model sheet's longer legs. Fire against walk_a as the proportion AND
   identity reference; the model render is only the face/material canon.
2. **THE HOUSE FACING** — same facing as walk_a/dash/claw in
   assets/characters/hero/states.png. Compare against those cells before
   keying; a run that reads backward in motion is an automatic refuse.
3. **TWO DISTINCT STRIDES** — run_a and run_b must differ in BOTH legs and
   the arm swing (reach vs gather), or the cycle reads as hopping on one
   leg. Overlay the two frames before shipping: if the silhouettes match
   anywhere below the waist, re-fire.
4. **NO pedestal, NO ground pool, NO baked shadow** — the idle cell shipped
   standing on a figurine display base and it took three passes to cut out.
   Negatives on every ground-touching plate: no base, no plinth, no ground
   glow, no floor shadow.

### §1e v3 — RE-FIRED TO ALL FOUR CONSTRAINTS (art session, 2026-08-16)

Jobs 7471abbd (`run_a`, the step) and 9bca5a37 (`run_b`, the airborne tuck),
both matted, both placed with `tools/herocell.cjs`. Sources in
`assets/source/hero/run_a.jpg` / `run_b.jpg`. Eye anchors re-measured —
the detector is confident on both.

**Against the owner's four constraints, measured rather than claimed:**
1. **SHORT LEGS** — fired against `walk_a` as the proportion authority, and
   the thing that actually worked was constraining the STRIDE GEOMETRICALLY
   instead of asking for short legs: *"the horizontal gap between her two
   feet is no wider than her own body is wide."* A stumpy-legged body cannot
   take a long stride, so pinning the stride pins the legs. Two earlier
   attempts asked for "short legs" in prose and got a lean sprinter both
   times — the model's prior for "running character" is athletic and it wins
   every argument made in adjectives.
2. **HOUSE FACING** — three-quarter FRONT, both eye-lights and both ears
   visible, body angled RIGHT, cape trailing LEFT, leading foot ahead of the
   nose-line. This is what the refused pair got wrong: it faced right while
   its stride reached left, which is precisely the "backward" the owner saw.
   Checked against `walk_a`, `dash` and `claw_1` before keying.
3. **TWO DISTINCT STRIDES** — the owner asked for the two frames to be
   overlaid. They were, by a scratch tool that normalises both to one height
   and bottom-aligns them: **silhouette IoU 0.40 whole-body, 0.53 below the
   waist**, against the §3.3 line of 0.86. The legs genuinely differ.
4. **NO pedestal, ground pool or baked shadow** — flat black field, nothing
   under her, matted rather than keyed.

**A fifth thing, unasked but worth having:** `tools/armbal.cjs` puts the new
cells at **run_a 0.926 and run_b 0.552**, where the walk cells they replace
measure 0.751 and 0.541. So the two-arm check gets safer when the run is
unparked, not more dangerous — which is what the earlier flake note predicted.

`run_b` took one extra fire. The first tuck leaned BACK, and given constraint
2 makes a backward read an automatic refuse, a plate that merely might read
that way is not worth shipping. Re-fired with the lean stated as the most
important thing in the picture — head and chest leading, out ahead of the
hips — and the arm balance doubled as a side effect.

**STILL PARKED IN CODE**, and that is correct until the owner has looked:
`heroState()` still substitutes the walk pair. The two-line revert is the
code session's, and it should follow the owner's word on these cells, not
precede it.

### 2q. BEAST GAIT REPAIR ×8 (expanded 2026-08-16 — the owner saw the seams)

Owner, watching the pack: "wolf walking with only one leg while sliding the
rest." Measured against the plates, he is exactly right, twice over:

- **wolf.png / wolf_walka.png / wolf_walkb.png are nearly one drawing** —
  the only difference between the walk pair is ONE front leg. A two-frame
  cycle where one limb moves reads as one leg pumping while the body glides.
  RE-FIRE the wolf walk pair: walkA = diagonal pair forward (left fore +
  right hind reaching, the other two planted and pushing), walkB = the
  mirror diagonal. ALL FOUR legs must differ between the frames — overlay
  them before keying, and if any leg matches, re-fire. Same wolf, same
  palette, fire against wolf.png as the identity.
- **cheetah_walka/walkb are DIFFERENT MACHINES from cheetah.png** — the
  rest plate is a gold/tan unit, walkA is a white skeletal one, walkB is
  silver with orange seams: the walking cheetah shape-shifts every half
  step. THE IDENTITY LOCK exists for exactly this (§2d's five-bats lesson).
  RE-FIRE both walk cells against cheetah.png as the one identity, with the
  same all-four-legs rule as the wolf.
- The RUN PAIRS (wolfRunA/B, cheetahRunA/B) stay as briefed above — reach
  and gather, fired against the REPAIRED walk pairs once those land.

Keys and fallbacks are already wired in js/wolves.js; media.js entries for
the run keys land with the plates.

### §1 ADDENDUM — THE PAIRED PAW RULE (owner, 2026-08-16)

Owner, reading the state cells side by side: "why different paw situations
showing here? each pose needs to show with and without the claw." He is
looking at a real inconsistency: the cells were fired across different
batches with no rule about claw state, so some poses carry the claws out
and some do not, arbitrarily — the paw state flickers as she changes state.

THE RULE, from here on: **every pose in the state sheet exists as a PAIR —
one cell with the claws out, one without — and the two cells of a pair are
IDENTICAL except for the claws.** Fire the clawless cell first, then the
clawed one against it as reference (same pose, same light, same frame), the
way the 8-yaw sheet already pairs hzd_8yaw with hzd_8yaw_bare. Any state
where the pair differs in anything but the claws is a refuse.

Wiring note (code session): heroState will select armed/unarmed by the
weapon state once the bare sheet lands — the same switch the back-walk
already makes between backwalk_* and bare_bwalk_*.

### §2g ADDENDUM — THE INTERIOR SCALE CONTRACT (owner, 2026-08-16)

Owner, in the den: "use logic when you create a background! ... the
background was supposed to be a representation of the room in a size
proportionate to the hero and npc" and "the table in the background is
bigger than the npc." He is right and no code zoom can fix it — the
denInterior painting is composed at photographic wide-angle, so its
workbench and the spools on it tower over a character standing in the room.

**THE SCALE CONTRACT, binding EVERY interior plate from now on (den re-fire,
oracle/forge/carrel/hollow interiors, and any future room):** compose the
room around an implied standing character on the floor line —
- the floor is the bottom eighth of the frame, the ceiling is the top edge;
- a standing adult machine-person on that floor reaches ~40% of frame
  height (state this in the prompt as an invisible scale reference);
- a workbench or table top meets that figure's waist (~20-22% of frame
  height off the floor line), a stool seat their knee, a shelf their head;
- NO prop on any surface larger than that figure's head — no barrel-sized
  spools, no oversized tools;
- NEGATIVE: no people, no characters (the reference figure is scale only,
  never drawn).

RE-FIRE denInterior against this contract (it replaces the wired plate at
the same path, assets/backgrounds/den_interior.jpg). The §2h/§2m/§2o
interior briefs inherit this contract without re-stating it.

### 2r. THE FORGE TABLE ×1 ✱ FIRE ON REBIND (owner's design, 2026-08-16)

The owner's order in the den: the workbench from the denInterior painting
becomes an OBJECT — same shape, same size — standing in front of Ratchet,
because "this is where the NPC will start working on the sword, from the
crystal." The stand-in ships already: the lamplit bench region of the den
painting (x 0.520-0.970, y 0.435-0.895 — the bench silhouette with its
backboard, top, drawer and legs), cropped, every cut edge feathered and the
wall corner above its left surface faded out diagonally, stood on the floor
at his right hand (js/game.js workTablePlate + the drawStatics tail). Fire
the real object plate
AGAINST that crop as reference: the same heavy timber bench, same tools and
spools, matted subject-only on transparency, lit by the same overhead lamp
warmth, no background wall, no floor, no right angles presenting (the
timber sags and leans). Key `forgeTable`, and the wiring swap is one line
where the crop draws today.

### 3n. THE MEMORY FILM ×1 ✱ FIRE ON REBIND (generate_video — owner's design, 2026-08-16)

The owner's story order, beat for beat. When the hero puts Ratchet's cell
back in, he tells what happened to the city — as a FILM, played through the
purify-cut player the moment the wake gift closes. The wiring is live: the
clip lands as `assets/video/ratchet_memory.mp4` and registers itself
(PURIFY_VID.memory, guarded on the build manifest — until the file exists
the wake skips straight to the lessons, nothing waits on black).

The film, in the owner's words, structured:

1. **The city, the day it began.** The broadcast takes the machines —
   show it as the neighbours going quiet and turning, not as violence.
2. **The necklace.** Close on Ratchet: a small crystal pendant at his
   chest, shining WHITE.
3. **The infection reaches him.** His eye-lights flicker RED — the song
   is taking him like everyone else.
4. **The crystal answers.** He closes his eyes; the pendant's shine
   swells; when the eyes open they are BLUE again. The infection is
   prevented — the crystal did it.
5. **The sane move.** Knowing red comes for everyone who stays powered,
   he opens his own chest and takes out his own battery — writes the note,
   sets it on his chest plate, and goes dark in his chair to wait for
   someone worth waking for.

Continuity locks: the pendant crystal is THE crystal family (same cut and
light as the chest crystal / sword shard canon); the den is HIS den
(denInterior is the set); resting pose ends exactly where
ratchet_resting.png begins, so the film's last frame hands off to the body
she actually finds. Eye colour grammar is canon now: red = infected,
blue = himself, and nothing else in the film may use those two colours for
anything eye-like. In-game, the same story is told again in five spoken
fragments (sl_rfrag1-5, one per guardian fork answered) — the film is the
whole; the fragments are the shards, and they must not contradict it.

### 2s. TERRAIN DEPTH PLATES — FIRST FOUR FIRED (art session, 2026-08-18)

**The owner asked what terrain in a futuristic kingdom should look like, and
for it in two depths.** This is task #76 / §2's `edge_` + `fore_` layers, and
it is the fix for the finding that closed the last round: the floor reads as a
bar because it is nearly the same VALUE as the room behind it, and no amount of
procedural shape work repairs that. Authored depth planes do.

**Fired** (jobs 9ecae8f1, d113839b, 29fe7e04, 800f2953), sources archived in
`assets/source/terrain/`:

- `edge_A` / `fore_A` — Scrap Meadows. **Both good, and the pair works.**
- `edge_C` / `fore_C` — The Foundry. fore_C is good; **edge_C needs a re-fire**,
  see below.

**The design, for the next zone's brief.** A futuristic kingdom's ground should
not read as rock or as floor — it reads as A CITY THAT FELL OVER AND HAS BEEN
WALKED ON FOR A CENTURY. Strata of collapsed infrastructure: buckled hull
plating, a burst conduit bundle re-fused into the mass, a service rail swallowed
by pressed earth. Neon survives only in the cracks — light that LEAKS rather
than light that illuminates. That last clause is what keeps §9.4's chroma budget
intact: the saturation is sparse and small, so the cast still owns the frame.

**Two planes, because one plate cannot do both jobs:**

| plane | value | detail | job |
|---|---|---|---|
| `edge_` mid | 35–60% | full material, lit crest, broken skirt | the band she stands on |
| `fore_` near | near-black | almost none — outline only | crosses in FRONT of her |

The fore plate is the counter-intuitive one and the brief has to say it
outright: **a foreground occluder works by SHAPE, not by texture.** Ask for
detail and the model returns a midground.

**edge_C must be re-fired.** It filled the frame instead of sitting as a band
with black above it, so it carries a hard straight top edge — the exact defect
the whole grammar exists to prevent. The band-in-the-lower-half instruction
needs to be the loudest line in the prompt, the same promotion that fixed the
cropped guardians.

**Two of the four came back on a WHITE field despite the prompt naming black.**
Budget for it: the keyer must detect the field rather than assume it. That cost
a compositing pass that showed white sheets and read as broken art.

**Not wired.** `tools/depthdemo.cjs` composites them for review. Wiring is a
render-order change in the code session's hands: `edge_` draws after the
backdrop and before the cast, `fore_` draws after the cast.

### 2s ADDENDUM — RE-FIRED, KEYED AND WIRED (art session, 2026-08-18)

The owner's correction, and it is a fair one: *"why do you keep telling me the
problems that you can actually fix without telling me"*. Everything the previous
entry listed as outstanding is done.

- **edge_C re-fired** (job edfde8f9). The fix was promoting the composition to
  the FIRST line of the prompt — "the picture is mostly EMPTY BLACK, a narrow
  band along the bottom third, the ground must NOT fill the frame". Stated last,
  it was ignored; stated first, it came back correct. Same promotion that fixed
  the cropped guardians.
- **All four keyed** to `assets/backgrounds/{edge,fore}_{a,c}.png` via the new
  `tools/terrainkey.cjs`, which DETECTS the field rather than assuming it — two
  of the five plates came back on white despite the brief naming black.
- **Wired.** `drawDepthPlane()` in game.js, `edge` after the background pass and
  `fore` after the cast, both anchored to the room's floor row and parallaxed
  (0.82 behind, 1.16 in front) so they separate as she moves.

**The one number that mattered was the anchor.** Anchoring to the bottom of the
VIEWPORT put the crest wherever the camera happened to be, so she stood below
her own ground; and offsetting the band downward buried the whole plate under
the tile layer, leaving a sliver of glow that looked like a bug in the art. The
plate is a band whose lower part meets the floor and whose upper part is the
wreck standing behind it, so most of it belongs ABOVE the walk line.

**Zones B, D, E and X still have no pair** — they draw nothing and fall back
exactly as before, which is the same guard every other plate takes.

### 1f. THE DRAWN PASS — every character re-rendered as an ILLUSTRATION ✱ NEW, FIRE ON REBIND (owner, 2026-08-18)

**The owner's words:** *"can you generate from the three d model of the game's
hero, NPC, enemies, boss, a drawing character just like Hornet and Silksong? The
artwork looks like a drawing instead of pure three d."*

This is a STYLE pass over the whole cast, not new characters. Every plate the
game already ships was generated as a 3D render, and a 3D render put next to a
hand-painted backdrop reads as a model standing in a painting. Silksong's cast
is the reference because it solves exactly this: the characters are drawn —
inked contour, few flat value steps, painted texture inside the line — and they
sit INSIDE their world instead of on top of it.

**THE SOURCE IS THE EXISTING PLATE.** Every firing in this section is
image-to-image from the sheet already on disk, never text-to-image from
scratch. The identity lock in §1 is not reopened by this brief: same silhouette,
same proportions, same palette, same costume, same number of arms. If a
regenerated head is a different head, the plate is refused — the owner reviews
every result and that is the first thing to check.

**THE STYLE, stated as the loudest line in every prompt:**

> Hand-drawn 2D game-art illustration. A clean dark ink contour around the whole
> figure and around each major form inside it. Interior shading in three or four
> FLAT value steps, not a smooth gradient. Visible painted texture — dry brush,
> gouache grain — inside the flats. One warm rim light along a single edge.
> Matte, absorbent surfaces; NO photoreal specular highlights, NO subsurface
> glow, NO rendered metal reflections. It must read as a drawing, not as a
> render.

**AND WHAT MUST NOT CHANGE, stated second:**

> Keep the pose, the framing, the scale within the frame, the exact silhouette
> and the exact colours of the source image. Restyle only.

**THE GEOMETRY IS A CONTRACT, and this is the part that breaks the build if it
is missed.** Three families of sheet, three different rules:

| family | sheet | rule |
|---|---|---|
| the protagonist | the 11×8 turnaround atlas | the CELL GRID is addressed by index — every cell must land in the same cell, same size, same footprint on the floor line |
| the guardians | six parts atlases | addressed by **absolute pixel rect**. A part that moves by 3px dislocates the rig. Re-fire PART BY PART, back into its own rect, never as a whole new sheet |
| NPCs + creatures | `npcs` / `roster` atlases | same cell-grid rule as the protagonist |

The guardian atlases are also the six sheets `tools/lowres.cjs` deliberately
excludes from the small tier (`tests/lowres.cjs` re-derives that rule from the
source). Nothing about that changes; the drawn plate replaces the rendered one
at the same size, in the same rect.

**FIRING ORDER — one owner review per row, and stop at the first refusal:**

1. **HZD-99 / NYA-9** — the 8-yaw turnaround first. She is the character the
   player looks at for the whole game, and she is also the calibration: if the
   drawn style is right on her, every later prompt reuses her result as a style
   reference image. If it is wrong on her, nothing else should be spent.
2. **Her action plates** — run pair, slash set, jet, hurt, the rest of §1b.
3. **The NPCs** — Ratchet first (he is the one the player meets first and stands
   still next to for the longest), then the Oracle, the Tinker, the Sage, the
   Nymph, Servo, the merchant.
4. **The creature roster** — wolves, the cheetah, the blobs, the five Eye
   mini-bosses, the per-kingdom enemies (breaker, kiln, rime, snare).
5. **The guardians, part by part** — NULLFANG, TALONHOST, FURNACE CHOIR,
   GLACIERE, PRISM PROWLER, MOTHER-V. Six atlases, and the most expensive row:
   fire one part, key it, look at the rig in play, then continue. A guardian is
   ~20 parts and a wrong style choice found at part 20 costs the whole sheet.

**WHAT THE CODE SESSION OWES THIS, and it is nothing.** No renderer change, no
new key, no new manifest entry: the drawn plate lands on the same filename at
the same size and the game draws it exactly as before. That is the whole reason
the geometry contract above is written the way it is. The only code work is the
regeneration chain after each batch — `node tools/lowres.cjs && node build.cjs`
— and `tests/artbible.cjs`, which will keep measuring silhouette difference,
telegraph amber and feet-on-floor against the new plates and should stay green
by construction if the restyle really was a restyle.

**THE ONE JUDGEMENT CALL TO PUT TO THE OWNER BEFORE ROW 2.** Silksong's cast
carries almost no interior detail at small sizes — the read is silhouette plus
two values. This game's characters currently carry a lot of panel-line and
mechanical detail, which is what makes them legible as MACHINES. Row 1 should
come back in two variants — one that keeps the machine detail inside the ink,
one that strips it to the Silksong density — and the owner picks which one the
other four rows are fired to. Firing rows 2-5 before that choice is made is how
a hundred plates get generated twice.

### 1f ADDENDUM — THE DRAWN PASS, TRIAL FIRED (art session, 2026-08-18)

**Four cells restyled as a trial before committing to all 22**: idle, walk_a,
run_a, claw_1. Sources archived in `assets/source/hero/drawn_trial/`, cut with
the new `tools/herocut.cjs`.

**The style works and the identity holds.** Ink contour, three or four flat
value steps, gouache grain inside the flats, one warm rim. Same head, ears,
scarf, collar, cyan lenses. This is the fix for the teardown's §1 finding — the
game currently ships FOUR material languages and she is the only asset in one
nothing else shares.

**herocut.cjs puts each cell on FLAT BLACK and pads it.** Both are lessons paid
for elsewhere: a generator handed transparency invents its own background, and
a subject touching the frame edge comes back cropped (four guardian plates).
She is near-white, so black is the field her silhouette can actually be keyed
off — the inverse mistake is what turned the foreground plates into floating
blue pips.

**FRAMING HAS TO BE THE FIRST LINE OF THE PROMPT.** Stated after the style, v1
came back at four different scales with claw_1 cropped to a close-up of head and
chest — its thrown-out arm, which is the entire point of that cell, gone.
Promoted to the top with "do NOT zoom, do NOT crop, the same fraction of the
picture as the reference", v2 kept the full body in every cell. Same promotion
that fixed the cropped guardians and edge_C.

**Two open questions put to the owner rather than decided:**

1. **The plates bake her eyes.** §2 says the eye-lights are never baked — they
   are covered at runtime and repainted live, because art with an expression
   baked in gives her one face per pose forever. The pipeline exists
   (`tools/heroeyeclean.cjs`) but it is a per-cell step and it once painted over
   her scarf when run against a stale anchor. Order matters: place cells, then
   re-measure anchors into `tools/heroeye.json`, THEN clean.
2. **The contour is heavier than the reference.** She reads as a mascot sticker
   with a thick white halo rather than as Hornet — Silksong's ink is thin and
   broken, its value steps darker, the figure sitting IN shadow. One more trial
   cell should land the weight before 18 more are fired against it.

**Known and mine to fix, not a question:** walk_a came back with a painted panel
border despite the ban. Either a re-fire or a trim pass.

### 1g. THE RUN AND WALK CYCLES ✱ NEW, FIRE ON REBIND (owner, 2026-08-19)

**The owner's report:** *"The cat movement is horrible. I mean, very, very, very
bad."* Half of that was code and is fixed (see the gait commits: she was
airborne a third of the time while running, her cadence was ten footfalls a
second, and the authored body had no vertical at all). **The half that is left
is this section, and no code closes it.**

**HER RUN IS HER WALK.** `run_a` and `run_b` exist in the sheet and are not
drawn. `heroState()` returns the walk pair for running too — the comment there
records why: the re-fired run cells came back with the long-legged proportions
the owner rejected, a facing that reads backward in motion, and two poses too
alike to cycle. So the game alternates **two plates**, and two plates is not a
cycle at any cadence. Hornet's run is eight frames. Nothing in the engine turns
two pictures into eight.

**WHAT TO FIRE — and the first line is the one that matters most:**

> **ONE CYCLE FROM ONE RIG.** All frames of a cycle are the same character in
> the same costume at the same scale, drawn as consecutive moments of a single
> continuous motion — not N independent illustrations of "a cat running".

That constraint is not style, it is the difference between a cycle and a
flicker, and this repo has already paid for ignoring it: `HERO_REG` in
entities.js carries hand-measured horizontal nudges (`walk_a -0.046`,
`walk_b +0.046`, and the same again for the run pair) because two
independently-generated plates put her head in two different places and she
strobed as she walked. Eight independent plates would need eight such
corrections and would still swim.

| cycle | frames | notes |
|---|---|---|
| run | 8 | contact, down, passing, up — twice, once per leg |
| walk | 6 | the same shape, slower and lower |
| turn | 2 | the plant and the push-off of a direction change |
| land | 2 | the absorb and the recover, to follow the existing `land` cell |

**LANDED 2026-08-21 — and one of the two is benched.** The opposite-beat pair
arrived as cells 22 (`walk_c`) and 23 (`run_c`) on a 24-cell sheet, cells 0–21
byte-identical to the shipped one.

- **`walk_c` is in.** Measured against the walk pair at the same figure height
  (130px) its skull is 58 cell-pixels wide against their 62 and 70-at-the-pass —
  in family — and its soles are 64px apart against `walk_a`'s 68, i.e. the same
  step on the other leg, which is exactly what an opposite contact is. The walk
  is a four-beat cycle now: contact → passing → opposite contact → passing.
- **`run_c` is keyed but NOT cycled.** At the same 130px figure height its skull
  measures **72 cell-pixels wide against run_a's 60 and run_b's 56** — a quarter
  wider — its ears are longer and thinner, and its whiskers are two marks on one
  cheek where the rest of the sheet carries three plus the far-side pair. Cycled
  in, her head would swell every fourth frame of every sprint. **What to re-fire:
  one run contact pose, same rig and same scale as cells 3 and 4**, and the day
  it lands `heroState`'s run branch becomes `['run_a','run_b','run_c'][k]` and
  the run has four beats too. The cell index is already reserved.

Nothing else on this list changes: the run still wants its full eight and the
walk its six. These two bought the walk its opposite beat, which is the single
biggest step toward it.

**THE CONSTRAINTS THE OWNER HAS ALREADY GIVEN, restated because the last fire
broke all three:**

- **Short legs.** The stubby proportions of the shipped body. He asked for this
  explicitly and the re-fire came back long-legged.
- **The house facing.** She reads as travelling the way she is drawn to face.
  The rejected run pair read as running backward.
- **Poses that differ.** Two cells too alike to cycle is what put the run back
  on the walk pair in the first place. Consecutive frames of one motion differ
  by construction; independent illustrations do not.

**THE GEOMETRY CONTRACT (same as §1f):** the sheet is addressed by CELL INDEX.
New cells append to `tools/herostates.cjs`'s STATES array and to `HERO_CELL` in
entities.js; every cell is the same size with the same footprint on the floor
line. Airborne cells are centred, grounded cells stand on the cell floor —
`HERO_AIR` records which is which and a new cell must be declared there.

**WHAT THE CODE WILL DO WITH THEM, so the frame count is not wasted.** The
stride phase already exists and is already speed-driven: `this.stridePh`
advances at `|vx| / 88` steps per second, capped at 4.6, and both the cell
choice and the body's rise and fall read from it. Going from 2 frames to 8 is
one line — `Math.floor(stridePh * 4) % 8` instead of `Math.floor(stridePh) % 2`
— and the bob, the contact squash and the cadence all keep working unchanged.
**The engine is waiting for the frames; nothing else has to be built.**

And `tests/gait.cjs` already measures the result: that she stays on the ground,
that her body rises and falls as she strides, and that she steps at a rate a
body could produce.

---

### 2t. RATCHET IS A CHARACTER NOW — FIRED, WIRED, SHIPPED (2026-08-21)

**The owner's brief, verbatim:** *"Refire it in a way that is unique. Give it
gestures, moves, a tick or something since it was deactivated for a while. Give
it, like, uncontrollable tick or something. Keeps happening while working or
while talking. And maybe smoke coming out of it. I don't know. Give it a
character. Think of it first. Then create it. Then create the artwork that has
all the movements that allows for this artwork to move and make the movement
freely. It can be working, busy working, doing something, creating something on
the table, crafting something. I'm not sure. Just keep it busy until I talk to
it."*

**THE CHARACTER — RATCHET, THE ONE WHO NEVER FINISHED.** He was mid-reach for a
tool when the Song fell. That instruction never completed, and it still fires:
the arm goes out, the fingers open, there is nothing there. **That is the tic**
— not a twitch bolted on for flavour, but the one thing that broke and was never
repaired. His coolant regulator did not come back either, so he runs hot and
blows it off through the canister rack already strapped to his back. **That is
the smoke**, and it has a rule rather than a mood. And what he is building,
endlessly, out of salvage that does not fit, is a replacement regulator — which
is why he is always busy, always hot, never done, and why he wants her scrap.
The existing shop hook was waiting for exactly this reason.

**HE CHANGES CLASS.** ART_BIBLE §1 class D is one 6-yaw sheet and a breathe
cycle: it can turn and it can bob, and that is the entire vocabulary. None of
the above fits in it. He is a PLATE SET now — seven authored poses of one body,
`assets/characters/npc/ratchet/`, and `drawTinker` in js/game.js chooses which
and when. This also retires his row on `npc_6yaw.png`, which is the row the
keyer punched 45.6% of the body out of (see THE KEYING FAULT above): the booth
was showing the room through his chest, and it no longer is.

| plate | the beat |
|---|---|
| `work_1` | hammering — hammer cocked, part held at the belly, head bowed |
| `work_2` | folded double from the waist, turning the piece over near his shins |
| `tic` | the spasm: arm bolt straight out, fingers splayed, head snapped away |
| `notice` | straightened right out of the hunch, looking at her |
| `talk_1` | weight on one hip, hand up on his own helmet |
| `talk_2` | leaning in, presenting the part as the evidence in an argument |
| `vent` | head back, shoulders up, arms swept back — bracing against the heat |

**THE SMOKE IS CODE, DELIBERATELY.** art-prompts §0: additive glow handed to a
generator comes back as a beautifully lit SOLID OBJECT. So every plate was fired
with "no smoke, no steam, no vapour" in its negatives, and the vent is particles
drawn over the plate from a point measured off his rack — which also lets it
react to the beat instead of being baked into one frame of it. `sfx('vent')` is
a new cue in the vocabulary: pressure out, then the rack ringing.

#### TWO FAILURES, BOTH NOW ARITHMETIC — read this before firing the next set

**1. The first firing did not animate.** All seven were fired against the anchor
plate with *"same camera, same framing, CHANGE ONLY THE POSE"*, and an editing
model told to preserve a composition preserves it — it moves as little as it can
get away with. `notice` vs `work_1` came back at **0.992 silhouette IoU**: the
same drawing with the hands moved. Twenty of the twenty-one pairs were over the
§3.3 line. Every one of them looked fine on the contact sheet.

*The fix:* fire from the **SEATED reference** — a pose the new plate cannot be
an edit of — with the pose stated **first** and at length, and the framing lock
removed entirely. Re-fired that way the worst pair is 0.73.

**2. The second firing did not register.** The generator decides for itself how
much of the frame to fill and varies it by a **third** between plates of the
same character. A set is therefore not registered by construction and cannot be
made so by asking for it. It is registered by MEASUREMENT, at load, in
`plateFoot` (js/media.js): feet to the bottom of the mask, horizontal to the
centroid of the mask's bottom slice — because an arm thrown out sideways moves
the bounding box and must not drag the body with it — and **scale to silhouette
AREA**.

Area and not bounding box, and that distinction cost a round on its own: this
character's box is topped by his canister rack, so a small body under a high
rack measures the same as a big body under a low one. Every pose measured within
2% by box height while one of them was visibly a third smaller. Silhouette area
is what the eye is comparing. The payoff is that a re-fired plate now registers
itself — no re-cropping, no per-key table.

**`tests/tinker.cjs`** is both failures as measurements — every pose draws, no
two share a silhouette, feet on the floor, one size across the set — and
**`tools/tinkershot.cjs`** photographs the set the way the game draws it.
Sources for all three firings are in `assets/source/ratchet/`.

---

### 2u. INTERIOR FLOORS — THE ROOM IS NOT ITS KINGDOM ✱ FIRE ON REBIND (2026-08-21)

**The owner, on a screenshot of Ratchet's den: "why is the terrain inside tent
same as outside!"** It was, and the code side of it shipped in the same commit
as this entry. What is left is the art.

**WHY IT HAPPENED, because the shape of the bug matters more than the fix.**
Every ground decision in this engine was keyed on the room's ZONE, and an
interior room keeps its kingdom's zone because it belongs to that kingdom. So
the workshop — walls, roof, bench, hanging lamp — was floored with Scrap
Meadows five times over, by five systems that had never been asked whether the
room has a roof:

1. **the material** — `rockTex(zone)` + the zone's strata plate;
2. **the surface** — wire-grass tufts sprouting along the boards in the
   kingdom's own teal;
3. **the garden** — the flora planter walks every room the zone owns, so cable
   creeper was rooted in the floorboards;
4. **the light** — the tile layer is finished with a screen wash in
   `ZONE_LIGHT`, and zone A's is dead teal daylight [120,190,175], which
   neutralised the warm boards back to meadow grey;
5. **the crest** — `strokeCurve(P.edge, …)`, a continuous 3px polyline of the
   kingdom's rim colour traced along the whole walk surface. Outdoors that is
   the walk line reading at a glance in a dark room and it is right. Indoors it
   is a strip light buried in the floor, and it is the glowing ribbon in the
   owner's screenshot.

All five now branch on `indoor` on the room def, and the interior's own
material, light and crest colour come from `INDOOR_PAL` in js/game.js. The
terrain grammar gets an interior variant too (`TERRAIN_INDOOR`): a floor is not
weathered by anything, so rough/lip/skirt come down and nothing grows on it —
but NOT to zero, because the no-right-angles order is global and a floor ruled
straight across a room is exactly what it forbids.

**WHAT IS UNFIRED.** `floorBake()` is a procedural STAND-IN and is deliberately
a plain worn floor rather than an attempt at art — per the owner's standing
order, structures are Higgsfield's. Five plates, keyed in media.js in the same
commit as the files, at which point `floorTex` picks them up and nothing else
changes. Each is a seamless tiling floor texture, 1024×512, no perspective, no
objects standing on it, lit flat:

1. **floorDen** (A0B, Ratchet's workshop) — oiled dark boards laid in courses,
   almost black in the joins, worn pale where feet fall, swarf and filings
   trodden in, two or three old burn scars and an oil stain.
2. **floorParlor** (B3B, the Oracle's data-den) — riveted deck plate in cold
   gunmetal, cable gutters running with the courses, screen-blue grime in the
   seams, worn bright along one walking line.
3. **floorForge** (C5B, Patch-7's smithy) — heavy plate crusted with cooled
   slag, quench stains, scale flakes, a few spatter pits still dark orange.
4. **floorCarrel** (D1B, the Sage's carrel) — dry pale boards, drifted paper
   dust in the joins, ink spots, the grain lifted and split with age.
5. **floorHollow** (E1B, Lumen's hollow) — grown rather than laid: soft chitin
   plates with organic seams, faintly translucent, a wet sheen in the hollows.

Common to all five: **NOTHING PLUMB, NOTHING SQUARE** — courses wander, joins
are not parallel, no course runs the full width. NEGATIVE on every one: no
objects, no furniture, no characters, no perspective, no vignette, no text, no
watermark, no strong directional light, no shadows cast by anything outside
the frame.

---

### 2v. RATCHET'S OTHER ACTIONS ✱ FIRE ON REBIND (2026-08-22)

**The owner:** *"the loop where I see the NPC working is somewhat short. I
needed to do some work that does not look repeated... doing something instead
of actually naturally doing something."*

**The CODE half shipped in the same commit as this entry** and it is the half
that was actually broken: twelve cells at a fixed 10 fps is a 1.2-second cycle
played forever, and no length of cycle fixes that — a 3-second loop is a loop
you notice four seconds later. It is now a JOB with stages (shape → check →
fit → reject, 14-26s, re-rolled every time), played in bursts of 2-5 strokes at
a tempo that varies per burst, with holds between them, ping-pong on some
strokes, and a phase that never resets. `tests/tinker.cjs` autocorrelates the
frames he actually draws over thirty seconds: the strongest repeat inside five
seconds now matches 24%, where a loop would sit near 100%.

**What CODE cannot fix is the VOCABULARY.** Every stage is still played out of
one twelve-cell strip of one hammer swing. Cadence makes it stop reading as a
loop; it cannot make him do a second thing. Three more strips would, and they
are what turns "he is animated" into "he is working":

1. **work_reach** (12 cells) — he turns from the bench, reaches UP AND BACK to
   a shelf out of frame, takes something, and brings it down to the bench. The
   turn is the point: it is the only time his back changes angle.
2. **work_wipe** (12 cells) — he sweeps the bench with the side of one hand,
   twice, and shakes the swarf off his fingers. Short, low, lateral — the
   opposite axis to the hammer.
3. **work_set** (10 cells) — he sets the piece DOWN, straightens, and rolls the
   shoulder that has been doing the work. This is the one that reads as fatigue
   and it is the strongest of the three.

All three: same body, same camera, same distance, same light as
`assets/characters/npc/ratchet/work_loop.png`, cut as a horizontal strip of
equal cells on a FLAT NEUTRAL MID-GREY FIELD, feet on the same line in every
cell, first and last cell continuous with the neutral standing pose so the job
machine can cut into and out of them. NEGATIVE: no bench, no shelf, no props
beyond what is in his hands, no ground plane, no cast shadow, no smoke, no
sparks, no text, no watermark.

Wiring is one line each: add the key to `TINKER_STRIP` and the stage to
`TINKER_JOB` / `TINKER_NEXT` in js/game.js. The machine already varies tempo,
bursts and order, so a new action inherits all of that for free.

---

### 2w. THE BURIED MOUTH — the first tunnel's rubble ✱ FIRE ON REBIND (2026-08-23)

**The owner:** *"The first cave or tunnel that I face needs to be covered with
rubbles, and it should emit a sound from within that attracts me to go there…
there should be a rubble. There should be a sound from within that I hear, and
I have to go and hit the rubble to go inside."*

**Everything that is not the pixels shipped in the same commit as this entry.**
The A5 mouth is buried on a fresh save (`GATE_ROOM.A5.rubble`); it refuses the
walk-in and says so; the blade takes it down over six blows, metered by MASS so
every blow removes the same share of the heap; it collapses over 0.6s instead
of blinking off; a new `cave` voice in `npcVoxBuild` calls from behind it with
gain driven purely by distance and muffled by the rock still standing, so it
opens up as she digs. `tests/rubble.cjs` measures all of it, including the
ART_BIBLE §3.3 silhouette rule applied to a structure (worst consecutive state
pair, IoU 0.84 against a 0.86 ceiling) and the §3.4 feet rule (the pile's foot
is within 7 px of the floor her body stands on).

**What is a stand-in is the ROCK.** `drawRubble` in js/game.js draws seeded
eroded boulders with fracture lines and a light leaking between them. It is
honest terrain and it obeys the no-right-angles rule, but it is a procedural
structure, and structures are Higgsfield's. Three plates replace it:

1. **rubble_full** — the heap at rest, completely closing an irregular rock
   opening about 156 px wide and 178 px tall at game scale. Broken slabs and
   scree of the zone-A material: dry grey-brown stone with a few sheets of
   fallen machine plating mixed in, because the roof of a hole in the scrap
   fields is half machine. NO opening visible; a hairline of cold blue-white
   light escaping between two stones near the crown is the only tell.
2. **rubble_half** — the same heap with its top third gone, the crown stones
   scattered at the foot as fresh chips. A gap the width of two stones open at
   the top, the cold light now clearly pouring out of it. The shoulders are
   still packed.
3. **rubble_last** — the last course: two or three heavy base slabs and a low
   scree bank, the opening above them clear. This is what she sees on the blow
   before it goes.

All three: same camera, same distance, same key light (from above and slightly
left, matching the meadow's overcast), on a FLAT NEUTRAL MID-GREY FIELD, the
heap's contact line at the same y in every plate so the code can swap them
without the pile jumping. Aspect as close to 1:1 as the frame set allows.
NEGATIVE: no cave interior painted behind it, no ground plane, no cast shadow,
no grass, no text, no watermark, no pixel grid, no outline, no cel shading.

Wiring is a key check in `drawRubble`: three plates, chosen by
`r.hp / r.max`, drawn through `scenePlate` with the procedural heap as the
fallback it already is. The collapse, the shake, the dust, the light and the
whole hit machine stay where they are.

**And a sound, if the art session is firing audio:** a `hum_cave` loop —
30-60s, seamless, a hollow sub-bass with a slow breath in it and a thin
irregular metallic ring far away inside the rock. `npcVoxBuild` picks up
`MBUF['hum_cave']` automatically and retires the synth voice the moment it
lands; nothing else changes.

**Addendum, same day — THE SEAM.** The rubble machine grew a second customer
in the same commit: `GATE_ROOM` rows may now be ARRAYS of doors (`gateDoors`
in js/game.js), CV1 is the first row to use it, and its second door is a
buried side passage into **CV1B, the Seam** — the tunnel's save point. Its
pile is the same stand-in and it wants the same three plates, in the tunnel's
own rock rather than the meadow's: colder grey, no machine plating, wetter.
Fire `rubble_full/half/last` for zone X alongside the zone-A set, same camera
and contact line, and both mouths key from one wiring line.
