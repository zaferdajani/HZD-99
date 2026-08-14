---
name: art-prompts
description: Author generation prompts for CLAWBYTE's art pipeline and composite the results back into the game — boss rig restyles, turnarounds, NPC sheets, ceilings, tiles. Use whenever art is being generated for this game, when a generated asset comes back wrong, or when deciding whether a subject should be generated at all.
---

# Writing prompts for this game's art

Everything here was learned by doing it — 75 boss parts, two turnaround sheets,
six ceiling plates — and by getting it wrong first. It is written down because
the failures repeat and the fixes are not obvious.

The pipeline is `tools/bossparts.cjs` (cut → restyle → paste back), with
`tools/contact.cjs` to look at a batch and `tools/bossshot.cjs` to check the
result in the running game.

---

## 0. First decide whether to generate at all

Generation is right for **authored sprite rigs** and wrong for one thing:

- **Pure additive glow.** Lava rings, halo rings, lit core states. Handed to a
  model they come back as beautifully lit solid objects, which is the wrong
  thing rendered well. The compositor blends them as light, not as objects.

**HZD-99 used to be the other exception and is not any more** (owner, 2026-08-14):
her body is authored now, and only the scarf, glow, jets, aura and claw arcs
stay procedural, drawn over the plates. Generate her — but never freehand: every
plate of her embeds the canon element
`<<<467c8e08-8161-483f-a4cf-439875ff04e2>>>`. See ART_BIBLE.md §2.

Ask: *does the renderer treat this as an object or as light?* Only generate
objects.

---

## 1. The one rule: separate SHAPE from STYLE, explicitly

A reference image pulls style at least as hard as it pulls shape. Ask for "the
same but smoother" and you get something beautiful with every part moved.

Every prompt therefore says, in this order:

1. **What the reference is for** — "The reference is a low-resolution PIXEL-ART
   sprite. Take from it ONLY the geometry: the exact silhouette, proportions and
   orientation."
2. **What to take nothing of** — "Take NOTHING of its rendering style."
3. **The subject, named concretely** — "the detached FORELIMB of a mechanical
   dragon — armoured upper arm, hinged elbow, forearm, clawed foot, cut flat at
   the shoulder. One limb only, nothing attached."
4. **The forbidden edits** — "Do not redesign it, do not re-pose it, do not add
   or remove a single plate."
5. **The render brief** — PBR terms, one committed light direction, what is
   emissive.
6. **The palette, in words.** This is the consistency anchor across independent
   generations. Name the colours; do not rely on the reference to carry them.
7. **The negatives** — no pixel grid, no dithering, no outline, no cel shading.
8. **The plate rules** — pure black background, whole subject in frame, no
   ground, no cast shadow, no text.

---

## 2. When the model will not stop drawing pixels

Two escalating fixes, in order.

**First: give it a reference with no grid to copy.** A 43-pixel joint with a
hard keyline has one legible feature — the staircase — and the model reproduces
it faithfully because it is the most confident thing in the picture. Two rounds
of "no pixel art, smooth antialiased silhouette" moved NULLFANG's small parts
*not at all*, because the instruction was arguing with the reference and the
reference wins.

`bossparts.cjs extract` now upscales 4× **and applies a real blur** — about one
and a half source pixels. `imageSmoothingQuality` alone does nothing on an
integer upscale; this was measured, not assumed. What arrives is a soft picture
of the right shape with no rendering style worth stealing.

**Second: give it a finished example of the same character.** Two references,
two jobs, stated as such:

> IMAGE 1 is a soft blurred plate: take from it ONLY the shape. IMAGE 2 is a
> finished 3D render of the SAME robotic lion: copy its MATERIAL, LIGHTING and
> FINISH exactly, but take NOTHING of its pose and ignore which body part it
> shows.

This is what finally fixed the lion. Restyle one hero part first, then use it as
the style anchor for that boss's whole rig — it also guarantees the parts match
each other.

---

## 3. Aspect ratio is a rig problem, not a framing problem

The generator offers a fixed set of frames. A part shaped 4:1 (the dragon's
tail) cannot be requested at all — 21:9 is the widest — so it comes back the
wrong proportion and the rebuild has to decide what to do about it.

Three behaviours, and the choice is per part:

- **Stretch (default, ≤18% drift).** These parts are meant to be the SAME shape,
  so drift is the model's invention, not intent. Stretch and the joint lands
  where the rig expects it. A leg 6% short leaves a 6% gap at the hip.
- **`stretchMax` override.** For parts whose true aspect no frame can match —
  the tail, the tendrils. Stretching a chain of segments 35% longer is invisible.
- **`fill`.** For anything with **no joint**: thrown feathers, ice shards, debris
  shards, and whole-figure action frames. Nothing connects to them, so they
  simply fill their rect. Whole-figure frames especially — they are alternative
  drawings of one animal aligned by rect, so letterboxing them independently
  makes the boss *pop between sizes*, which is worse than any proportion drift.

Always request the closest available ratio to the source rect. It reduces the
problem even when it cannot remove it.

---

## 4. Things that will bite

- **Ask for black and you will get white.** One dragon forelimb came back on a
  white field despite the prompt. The keyer now reads the backdrop's polarity
  from the corner pixels rather than assuming.
- **Derived rects are not parts.** Some entries read the same pixels twice —
  glaciere's `mane` is a window into `hero`, eagle's `pRest` is the bottom of
  `pIdle`. Restyling one separately pastes a mane over the mane. List them in
  `derived` and they inherit their parent for free.
- **Seeds need the tile coordinate.** Unrelated but the same class of bug: a
  procedural pattern seeded without `tx` draws identically in every tile, which
  is how the lava grew a course of bricks.
- **Proportion needs saying twice.** "About three times as wide as it is tall
  and filling the frame edge to edge — a heavy spear, NOT a thin laser beam."
  One clause is ignored; a clause plus its negation is obeyed.

---

## 5. Procedure

1. `node tools/bossparts.cjs verify <boss>` — the rect table here is a mirror of
   the one in `js/`. If they have drifted, every slice is wrong and the damage is
   invisible until the boss animates.
2. `extract` to a scratch directory. Look at the contact sheet before writing a
   single prompt — you cannot describe a part you have not seen.
3. Restyle **one** hero part. Use it as the style anchor for the rest.
4. Batch the remainder, one prompt per part, palette named in every one.
5. `node tools/contact.cjs <dir> sheet.png` and **read it**. Sixty files, one
   look: the wrong-coloured limb is obvious and nothing else finds it.
6. `rebuild`, and read the aspect-drift warnings — they are telling you which
   parts to regenerate or reclassify.
7. `node tools/bossshot.cjs <room> shot.png` — an atlas can be perfect as a
   sheet and wrong once the rig slices, rotates and tints it.
8. Regenerate the failures. Two rounds is normal. Three means the *reference* is
   the problem, not the prompt — go to §2.

---

## 5a. ARCHIVE EVERY GENERATED PART, IN THE SAME COMMIT

Generated parts used to live in a scratch directory and only the composited
atlas was committed, which meant a claim like "the guardian was restyled" could
not be checked against anything. That is how a claim about the hero's art
survived unchallenged while being false — the turnaround existed, the atlas row
was declared, and the wiring was never done.

Every generated asset goes to `assets/source/<subject>/<part>.jpg` **in the same
commit that uses it**, along with the batch's contact sheet. Names match the rect
keys, so a part can be traced from the archive to the tool table to the game.

If it is not in `assets/source/`, it did not happen.

## 6. Licensing, non-negotiable

Every file under `assets/` traces to a line in `assets/CREDITS.md`. Generated art
is declared as generated — Steam requires the disclosure and it is already
planned for (`docs/STEAM.md`). Never derive an asset from copyrighted published
artwork, and never place scans in this repo: a commercial release makes that a
legal exposure rather than an etiquette question.
