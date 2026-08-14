---
name: manga-direction
description: Direct CLAWBYTE's cutscenes, boss reveals, comic panels and fight staging using shonen action-manga visual grammar — paneling, escalation, impact frames, expression language, silhouette reads. Use when composing the opening film, a boss awakening, a story beat, a comic sequence, a title card, or when a dramatic moment is reported as flat, confusing, or not landing.
---

# Manga direction, for this game

Shonen action manga solved a problem this game has: how to make a fight between
two characters read as **enormous** on a small, silent, low-information surface.
No sound, no motion, no colour, roughly six panels a page — and it still lands.
Every technique below is there because of that constraint, which is why it ports
cleanly to a 960×540 canvas with a 32px tile.

This is craft, not pastiche. It describes how the grammar works so you can apply
it; it does not reproduce, trace, or derive from any published pages. **Never
copy panel layouts, character designs, poses or compositions from a specific
copyrighted work into this repo** — CLAWBYTE ships commercially, `assets/CREDITS.md`
records the provenance of every third-party asset, and a rejected CC-BY-SA pack
is already documented there. Study the principle; author the panel.

---

## 0. The one idea underneath all of it

**A fight is a conversation about who is winning, and the reader must never be
lost about the answer.**

Every technique below serves that. Impact frames, speed lines, the cut to a
watching face, the sudden white page — none of them are decoration. They are
answers to "where are we, who has the upper hand, and did that hurt?"

When a moment does not land, the failure is almost always that the reader lost
the answer to one of those three questions. Diagnose in that order.

---

## 1. The escalation ladder

Shonen fights are built as a **staircase of revealed capability**, not a
continuous ramp. Each step is a discrete, legible "oh — it can do THAT."

    establish → counter → reveal → reversal → cost → resolution

- **Establish.** The threat does a normal thing well. The reader learns the
  baseline. Skipping this is why an opening super-move reads as noise.
- **Counter.** The hero answers with what they already have. The reader learns
  the hero's baseline and believes the fight is winnable.
- **Reveal.** The threat does something the baseline did not predict. This is
  the beat the whole fight is built around; give it the biggest frame.
- **Reversal.** The hero adapts — using something *previously established*,
  never something new. A new power at the reversal is the cardinal sin: it
  retroactively makes the danger fake.
- **Cost.** Winning takes something. Damage, a spent resource, a broken thing.
- **Resolution.** Short. The reader already knows the answer; do not re-argue it.

**In CLAWBYTE this maps onto boss phases directly.** Phase 1 is establish +
counter, the phase transition IS the reveal, phase 2 is reversal + cost. If a
boss's phase 2 introduces a move that phase 1 gave no hint of, the fight will
read as arbitrary rather than escalating. See `docs/combat/BOSS_TEMPLATE.md`.

---

## 2. Panel rhythm: the beat is the size

Panel size is duration. A big panel is a long beat; a strip of small panels is
fast. This is the single most transferable idea to a cutscene timeline.

- **Many small panels** = speed, exchange, confusion, rapid-fire.
- **One wide panel** = a held moment, a breath, geography, arrival.
- **A full page (or full screen)** = one event that changes everything. Spend
  these. Two in a row and neither counts.
- **A tall narrow panel** = a vertical action (a fall, a rise, a strike from
  above) or a held tension beat.

**Rhythm before content.** Lay out the beat sizes for a sequence *before*
deciding what is in them, exactly as you would block a silhouette before adding
detail. If the rhythm is flat — six equal panels — the scene will feel flat no
matter what is drawn in them.

The trap: a sequence where every beat is loud. Loudness is relative. A reveal
only reads as big if it follows something small.

---

## 3. Impact: how a hit is sold

A hit is three beats, and skipping any one of them makes it feel weightless.

1. **Anticipation** — the wind-up, held slightly too long. This is the same
   thing as a combat telegraph, and it is the beat players and readers both use
   to feel the danger. In-game it is `windT`; on a page it is the coiled frame.
2. **The impact frame** — the moment of contact, usually the *least* readable
   frame: high contrast, abstracted, sometimes inverted, sometimes just a shape.
   It is meant to be a flash, not a diagram. One or two frames only.
3. **The aftermath** — the frame that carries the *information*. Where did they
   land, what broke, what does their face say. This is the beat readers actually
   read; the impact frame only makes them believe it.

**The common error is spending all the effort on beat 2.** A beautifully
rendered contact frame between a weak wind-up and no aftermath reads as a
screensaver. The wind-up and the aftermath do the work.

In CLAWBYTE: hit-stop is beat 2, the knockback pose and camera shake are beat 3,
and `TELL_ST` in `js/entities.js` is beat 1. All three already exist — direct
them together rather than tuning them separately.

---

## 4. Speed lines, and what they actually do

Two distinct tools, constantly confused:

- **Motion lines** run *along* the direction of travel, attached to the moving
  thing. They say "this is moving, this way, this fast."
- **Focus lines** radiate from a point behind the subject, filling the frame.
  They say "look HERE" and carry emotional intensity, not physical speed. A
  character standing perfectly still can have focus lines.

Using focus lines for movement makes everything feel hysterical; using motion
lines for a dramatic reveal makes it feel like the character is falling over.

Density is volume. Sparse lines are a jog; the frame packed edge to edge is a
scream. Do not run at maximum, for the same reason you do not put two full-page
panels in a row.

---

## 5. Faces carry the fight, not the fists

The most reliable escalation device is **cutting away from the action to
someone's face**. A reaction shot does three jobs at once: it tells the reader
how big the thing was, it buys a beat of tension before the result, and it costs
almost nothing to stage.

The hierarchy of readable expression, most to least legible at small size:

1. **Eyes** — aperture and direction. Wide = shock; narrow = focus or threat;
   averted = doubt. This is 70% of it.
2. **Brow** — one plate, angled. Not two floating marks (see the
   `game-character-art` skill's emoji-face failure).
3. **Mouth shape** — open square = shout, small = tension.
4. **Head tilt** — a few degrees does more than any amount of detail.

**HZD-99 has a visor and no mouth**, so her entire expressive range is eye
aperture, eye colour, head tilt, ear angle and body lean. That is a real
constraint and it is the same one every helmeted character faces. Use the ears
as the brow — they are the largest, most readable moving part on her silhouette
and they already carry inertia.

---

## 6. Silence, and the empty frame

The most underused technique. A beat with nothing in it — no lines, no effect,
a character small in a large empty space — is what makes the loud beats loud.

Use it for:
- The moment before a fight starts.
- Immediately *after* a reveal, before the reaction. The pause is the reaction.
- A death, a loss, an arrival somewhere vast.

In a game this is the frame where the music drops out, the screen shake stops
and nothing moves. CLAWBYTE's boss awakenings already have a dormant beat before
the roar — that beat is this technique, and it should be *longer* than feels
comfortable.

---

## 7. Staging: geography before drama

Before any dramatic angle, the reader needs one clear frame that answers **where
everyone is standing**. The establishing beat is boring to draw and every
sequence that skips it becomes incomprehensible three beats later.

Then hold the line: keep the two combatants on consistent sides of frame. If the
hero is screen-left, they stay screen-left unless a beat is explicitly about the
reversal of position. Flipping arbitrarily is the fastest way to make a fight
unreadable — the same rule as the 180° line in film, and the same reason
CLAWBYTE's turn law exists (`game-character-art`).

---

## 8. Procedure — directing a sequence in this game

1. **State the question.** One sentence: what does the reader/player know at the
   end that they did not know at the start? If you cannot write it, the sequence
   has no reason to exist yet.
2. **Ladder it.** Place the beats on the escalation ladder in §1. Name which
   beat is the reveal.
3. **Block the rhythm.** Beat sizes and durations only — no content. Check that
   loud beats are outnumbered by quiet ones.
4. **Establish geography.** One wide beat, early, showing where everyone is.
5. **Stage the impact triples.** For every hit that matters: wind-up, flash,
   aftermath. Confirm all three exist.
6. **Add a face.** At least one reaction beat per escalation step.
7. **Add a silence.** At least one empty beat, placed after the reveal.
8. **Render and LOOK.** Screenshot the sequence, read it back, and critique it
   against §0's three questions. This is not optional — it is the same
   render-and-look discipline as `game-character-art`, and the same reason
   `tools/uishot.cjs` and `tools/bossshot.cjs` exist.

---

## 9. Where this already lives in the codebase

| Concern | File |
|---|---|
| The opening film, shot list, skip system | `js/game.js` — `INTRO_FILM`, `drawCine` |
| Boss awakening: dormant pose → stir → roar | `js/entities.js` — `st === 'dorm'`, `'intro'` |
| Telegraphs (beat 1 of every impact) | `js/entities.js` — `TELL_ST`, `windT` |
| Hit-stop, shake, knockback (beats 2–3) | `js/entities.js`, `cam.shake`, `hurtPoseT` |
| Dialogue staging and portraits | `js/game.js` — `drawPortrait`, the DIALOG panel |
| Per-boss phase structure | `docs/combat/BOSS_*.md` |
| Photographing a beat to critique it | `tools/bossshot.cjs`, `tools/uishot.cjs` |

---

## 10. Studying the form legitimately

To study shonen action grammar from real work, read it legally — the technique
is what transfers, and it transfers just as well from a legal copy:

- **Shonen Jump / VIZ digital subscription** — the entire back catalogue,
  officially licensed, a few dollars a month.
- **Official art books and "how to draw" volumes** published by the rights
  holders, which are explicitly instructional and often contain the artist's own
  breakdown of their layout thinking.
- **Scott McCloud, *Understanding Comics*** — the best general treatment of
  panel transition and closure that exists, and directly applicable.
- **Library and bookshop copies.** Reading a page and learning why a beat works
  is fair; putting that page in this repository is not.

**Never place scans in this repo, and never derive an asset directly from a
published page.** Everything in `assets/` must trace to a licence in
`assets/CREDITS.md`, and a Steam release makes that a commercial obligation
rather than a nicety.
