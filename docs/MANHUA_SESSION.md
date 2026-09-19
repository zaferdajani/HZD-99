# THE STORY SESSION — the manhua of CLAWBYTE

**Opened by the owner's order, 2026-09-19:** *"create a session dedicated for the
game's story. This agent should be connected with Higgsfield in order to create
my comic... it should be a manhua because it's going to be colored, not black and
white. But it should follow the story to the letter. And it will be my reference
that keeps updating along the way, which we will later on be using to validate the
game's storyline... each kingdom is a chapter."*

## The job

Draw the manhua of CLAWBYTE — full colour, read top to bottom — from
`docs/STORY_SCRIPT.md`, scene by scene, **to the letter**. Every panel maps to a
numbered scene in that script; every text box quotes the script's quoted lines
verbatim (they are the game's own strings). Nothing is invented that the game
does not do; where the script marks an open question (§8) the page waits for the
owner's ruling rather than choosing.

- **One kingdom is one chapter.** Chapter 1 — the Scrap Meadows (script §1–2,
  prologue included). Chapter 2 — the Data Conduits and the Crystal Cache (§3).
  Chapter 3 — the Foundry (§4). Chapter 4 — the Frozen Archives (§5). Chapter 5 —
  the Virus Nest and the ending (§6–7). Chapters are drawn in order; a chapter is
  not begun until the one before it is complete and the owner has seen it.
- **Every image comes from Higgsfield.** Never hand-drawn, never procedural, never a
  placeholder (CLAUDE.md: *art is Higgsfield's*). Read the `art-bible` and
  `art-prompts` skills before the first prompt: separate SHAPE from STYLE, name
  the palette in words, state the negatives, and anchor every character to the
  canon references in `assets/source/` (HZD-99's plates carry the canon element
  `<<<467c8e08-8161-483f-a4cf-439875ff04e2>>>`; Ratchet's seven plates are in
  `assets/source/npc/`; each guardian's parts atlas is under
  `assets/source/guardians/`). Read the `manga-direction` skill for paneling,
  escalation and impact frames — the grammar applies to a coloured page too.
- **The owner reviews every page before it is committed.** He refuses art he does
  not like, and the credits are his. A page he has not seen is not a page.

## Where it lives, and the link

- Pages: `assets/manhua/ch<N>/p<NN>.webp` (masters in `assets/source/manhua/`,
  crushed with `tools/img-crush.cjs`, indexed in `assets/source/README.md`, credited
  in `assets/CREDITS.md` as generated).
- The reader: `manhua/index.html` — a vertical-scroll, chapter-by-chapter page
  that serves the pages, plain HTML, no build step, phone-first. It is served by
  GitHub Pages with the game.
- The ledger: `docs/MANHUA.md` — per chapter, per scene: fired / reviewed / keyed /
  committed, so no brief is fired twice and the owner can see what is next
  without asking.

**THE LINK RULE (owner's rule, same as the game's):** every report this session
gives ends with the manhua's live link —

    https://zaferdajani.github.io/HZD-99/manhua/

— and nothing else after it.

## The ONE BRANCH

Same as everyone: `claude/clawbyte-repo-migration-byhyl8`. Pull --rebase before
work; push after every commit; mirror to `main` and `odyssey`
(`git push origin <branch>:main <branch>:odyssey`); never force-push; never
branch. The session touches `assets/manhua/`, `assets/source/manhua/`,
`manhua/`, `docs/MANHUA.md` and `assets/CREDITS.md` — never game logic, never the
built pages, never `docs/STORY_SCRIPT.md` (that is the code session's; a scene
that is wrong in the script is reported to the owner, not edited into the page).

## When the story changes

The script is the source; the pages follow it. When the code session revises
`docs/STORY_SCRIPT.md` (a beat changed in the game), the ledger marks the affected
scenes stale and they are refired. The manhua is the owner's reference for
validating the game — so it is never allowed to drift ahead of or behind the game.
