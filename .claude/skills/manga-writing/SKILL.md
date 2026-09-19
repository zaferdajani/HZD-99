---
name: manga-writing
description: Write the words of a manga / manhua / comic page — captions, dialogue, thought, lettering — from a game script. Use before firing any comic page that carries text, when a page reads like a screenshot instead of a story, or when converting game UI (tutorial chips, item cards, choice menus, HUD warnings) into narrative. Owner's rule, 2026-09-19 — "the prompts I receive when I play, such as attack, jump, are not a conversation written in manhwa."
---

# Writing a comic page from a game script

The `manga-direction` skill is about the PICTURES: paneling, escalation, impact
frames. This one is about the WORDS. They are separate crafts and they fail
separately: a beautifully staged page with a tutorial chip in it is a screenshot
with panels drawn on.

The owner's rule, on seeing chapter one's first pass: **"you are typing the
prompts that I receive when I play, such as attack, jump, which is not a
conversation written in manhwa."** A comic is read, not played. Nothing on the
page may address the reader as a player.

---

## 0. The one test

Read every text box on the page and ask: **could this sentence be printed in a
comic that had no game behind it?** If it names a button, a key, a menu, a stat,
a screen, or tells someone what to press, it fails. It is UI, and UI is not
story. Delete it, or say what it MEANS in the story's voice.

---

## 1. The four kinds of text a comic page carries, and nothing else

| Kind | What it is | Drawn as |
|---|---|---|
| **Caption** | The narrator, or the world speaking (a log, a sign, a card someone reads). Past or present tense, third person, short. | A rectangular box, cream, at a panel edge |
| **Dialogue** | A character speaking to another character who is present. | A balloon with a tail to the speaker's mouth or face |
| **Thought** | A character's inner voice. HZD-99 has no mouth and never speaks aloud in the game, so her voice on the page IS thought. Use it sparingly, a line or two a page. | A cloud balloon with bubble tail |
| **Diegetic text** | Writing that exists in the world: a tag, a terminal screen, a shop sign, a nameplate. | Drawn ON the object, in the object's own lettering |

Not on the list: tutorial chips, item cards, HUD warnings, choice menus, stat
numbers, button names, sound-effect words (see §4). If it is in the game as UI,
it does not go on the page as UI.

---

## 2. Converting game UI into story

The script (`docs/STORY_SCRIPT.md`) quotes every string the player reads,
because the comic must not contradict the game. **That does not mean every
string is drawn.** Three verbatim classes, and one conversion class:

**Keep VERBATIM, word for word** — these are the story itself:
- Everything a character SAYS (Ratchet, Servo, the sages, Mono, Kerf...). A
  spoken line goes in a balloon exactly as the game has it, even when it names a
  key: Servo's *"Move with the arrows, leap with Z, and swipe those claws with
  X"* is what he says in the game, and the joke of an old robot who talks in
  controls is his character. Do not fix him.
- Diegetic text: Ratchet's tag, terminal logs, the beacon's log, shop signs.
- The opening film's captions, the boss title cards (*NULLFANG, THE VIRUS
  BEAST.*), the end-of-chapter card. These are the game's narrator speaking.

**CONVERT into narration or action** — these are the game talking to the player:
- **Tutorial chips** (*Move — Walk right toward the light.*). Show the action;
  if a caption is needed, narrate the moment: *She walked toward the light.*
  The verb the chip teaches becomes a thing she does in the panel.
- **Item cards** (*Scrap — What a broken machine leaves behind...*). The card's
  body text is usually good prose already; it becomes a caption in the
  narrator's voice, or Ratchet says the useful part. The card's title and its
  numbers do not appear.
- **HUD warnings** (*⚡ NULLFANG is reeling — hit it NOW.*). Draw the stagger.
  If words are wanted, narrate: *It reeled. This was the moment.*
- **Choice menus** (*◀ TAME ... ▶ FINISH*). A comic has no menu. Draw the choice
  as a held beat: the blade raised, her eyes, the kneeling beast. Both branches
  may be drawn as two futures side by side, labelled by narration (*If she cut
  the virus out...* / *If she ended it...*), never by arrows.
- **Shop lists, prices, stats** (*12 scrap*, *18% harder*). Never. Say
  *cheap*, *stronger*, or say nothing.
- **Control names** in narration (HEAL, ATTACK, UP). Never in a caption. In
  dialogue only if the character says them in the game.

When a converted line carries story information the reader needs (the pack
wires two new abilities; the shard falls when the pillar is burst), the
information stays, in prose. Nothing the game establishes is lost; only the
form changes.

---

## 3. Voice

- **The narrator is dry, present-tense or simple past, and short.** One clause
  where two would do. It never explains a mechanic; it describes what happened
  and lets the picture carry the rest. It never says "you".
- **Ratchet** talks in short declaratives with a wry tail (*Prices stand,
  mind.*). Keep his lines whole; do not split a line across two balloons unless
  a beat is wanted, and then split at his own full stop.
- **Old Servo** is warm, old, and funny without knowing it.
- **HZD-99** thinks in fragments. Three words is a long thought for her. She
  never narrates the plot.
- **Logs and tags** keep their own register (a maintenance log is terse and
  numbered; the Deaf System writes like people who chose silence).

---

## 4. Lettering rules for the page

- **Balloons carry ONE line each**, complete, in order, with a tail to the
  speaker. A long line gets a bigger balloon, not two.
- **No sound-effect words.** No CLICK, no KRAK, no "!!". The impact frame does
  that job with shape and contrast (`manga-direction` §3).
- **No labels.** Nothing on the page names a place, a character or a beat unless
  it is diegetic (a sign) or the narrator's caption. "THE FORGING" over a
  forging panel is a label; delete it.
- **One idea per box.** A caption that runs to a paragraph belongs to a log
  screen, drawn as one; otherwise cut it.
- **Silence is allowed.** A page with no words is a page (chapter one's page
  13). Do not fill quiet panels because the layout has room.
- **Everything that is written is listed.** The prompt names every text box
  and its exact words; a box that is not listed must not appear. A drawn page
  is compared box by box against the list, and any box that drifted, doubled,
  split or was invented sends the page back.

---

## 5. Procedure — writing the page before drawing it

1. Take the scene from `docs/STORY_SCRIPT.md`. List every quoted string in it.
2. Sort each string into: spoken (verbatim), diegetic (verbatim), narrator card
   (verbatim), or UI (convert or drop).
3. Write the page's text list in reading order, top to bottom: for each panel,
   the boxes it carries, each box one kind from §1. Check every box against §0.
4. Count the boxes. Put the count in the prompt ("five boxes on this page and
   not one more"). The generator invents text when the count is left open.
5. Put the list in `assets/source/manhua/ch<N>/prompts.json` as the page's
   `text`, and describe in `shape` which panel carries which box and of what
   kind. The ledger's panel script and the reader's transcript are generated
   from that file, so the words the reader can check against are the words that
   were asked for.
6. After the page comes back, read it box by box against the list before anyone
   else does.

---

## 6. What this looks like, from chapter one

The script's §2.1: *Move — Walk right toward the light.* / *Leave — the door has
been open a long time.*

- Wrong (first pass): two dark chips on the page reading exactly that.
- Right: the panel shows her walking toward the light; the last panel's caption
  reads *The door had been open a long time.* The verb is in the drawing; the
  line that was already prose stays as prose in the narrator's tense.

The script's §2.15 fork: *◀ TAME — Cut the virus out. It lives, and it owes you.
▶ FINISH — End it. Take its strength for your own.*

- Wrong: two arrowed boxes.
- Right: the top strip holds the beat, the kneeling lion still looking at her,
  the blade lowered; two columns below, each opened by a narrator caption —
  *She could cut the virus out. It would live, and it would owe her.* and *She
  could end it, and take its strength for her own.* — and closed by what each
  road gave her, in prose, no percentages.
