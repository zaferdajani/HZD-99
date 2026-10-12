# E1 — Linking CLAWBYTE and NOSTOS (proposal, for the owner's decision)

*Handoff Part 2 item E1. It is a design spike, not a ticket. Nothing here is
built. The questions at the end need the owner's answer.*

## What exists today

- **One engine, two games.** `build.cjs` emits `index.html` (CLAWBYTE, the
  robot cat in the machine city) and `odyssey.html` (NOSTOS, the hero's
  world). Each page is hard-locked by `window.GAME_LOCK`. `themeId()` in
  `js/theme.js` answers "which world" from `G.save.theme`, and falls back to
  the lock.
- **Two saves, kept apart.** `saveKeyFor(theme)` stores each world under its
  own key (`…_robo`, `…_hero`). Neither world reads the other's save.
- **`isHero()` answers two questions at once.** It has 61 call sites in
  `game.js`, 15 in `entities.js`, and more in other files. Some of them ask
  "which WORLD is this?" (palette, rooms, story, music). Others ask "which
  BODY is she?" (sprites, swing art, voice). Today the two answers are always
  the same. A link is the first thing that would make them differ.

## What the study session proved (Kingdoms Linked)

A gate at a bench writes a **handoff record**. The other world reads that
record. The traveller **keeps her own look**, and the world's kit
**translates** around her.

## Three ways to do it here

| | A. Crossing inside one page | B. Handoff record between the two pages | C. Leave them apart |
|---|---|---|---|
| How she crosses | A gate at a bench switches `G.save.theme` and loads the other world's rooms in the same page | A gate at a bench writes a record, then opens the other page; that page offers "arrive from CLAWBYTE" | No crossing |
| The save | One save with a mapped section per world | Two saves, plus a small shared record (`…_link`) | Unchanged |
| Her look | Needs the "world" and "body" split everywhere `isHero()` is used | Needs the same split, but only where the visitor is drawn | — |
| RULE ONE (every platform gets the same game) | Holds: both worlds are in every build already | Holds on the web and in the app. In the app both pages are in `www/`, so the hop is a local navigation | Holds |
| Cost | Large: audit all ~80+ `isHero()` sites, a save migration, and every story gate that assumes one world | Medium: the record, the gate, the arrival flow, and the body/world split on the drawing path | None |
| Risk | Highest. A missed site means robot rooms with hero music, or the reverse. Saves can be corrupted mid-run | Contained. Each world's own save is never written by the other | — |

## Recommendation

**B, in two steps, starting only at a chapter's end.**

1. **The split, with no behaviour change.** Add `worldIs(id)` and `bodyIs(id)`.
   Route each `isHero()` call to one of them. A harness proves that both pages
   render identically before and after (the `platform` and `artbible`
   baselines).
2. **The crossing.** Put it at the bench after each chapter's sage, the natural
   pause point, so no in-progress story state needs translating. It writes
   `{ from, chapter, cores, scrap, abilities, look }`. The other page reads the
   record once and offers the arrival. The visitor keeps her look
   (`bodyIs('robo')` inside `worldIs('hero')`). Her kit translates through one
   table:

| CLAWBYTE | NOSTOS (proposed) | why |
|---|---|---|
| claws | the sword | the same melee rows in `ATTACKS` |
| dash | the hero's dash | already shared |
| double jump + glide | the winged sandals | the same physics |
| grappling claw | (none) | needs NOSTOS art, so it is queued, not translated |
| volts | the hero's energy | the same loop (handoff C3) |
| scrap | drachmae, 1:1 | currency |

Harnesses: a round trip (CLAWBYTE → NOSTOS → CLAWBYTE) leaves both saves
byte-identical except the record. The visitor draws in her own art in the other
world. No `isHero()` site is left unrouted (a static check, like the parry
colour check).

## What the owner decides

1. **Do the two games link at all?** (A, B or C.) The recommendation is B.
2. **Where may she cross?** Only at chapter ends (recommended), or at any bench?
3. **Does the visitor keep her own look**, or wear the host world's hero?
4. **Is the translation table right?** In particular, the claws map to the sword.
5. **Story:** does a crossing exist in the canon (`docs/STORY_CANON.md`,
   `docs/STORY_SCRIPT.md`), or is it a free mode outside the story?

Until these are answered, nothing in E1 is built.
