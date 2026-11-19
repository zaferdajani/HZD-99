> **Current authority (2026-09-11):** Read `docs/DEVELOPMENT_AUTHORITY.md` first.
> This HZD-99 Project thread is the sole development/publishing authority.
> Conflicting historical session, branching or autonomous-deployment directions are superseded.

# CLAWBYTE / NOSTOS — working notes

## THE LEDGER — what the owner has had to say more than once

**"Why do you not remember what I told you and improve?"** — the owner, 2026-11-17.

No session remembers the one before it. This list is the memory. Each line is
something he has ALREADY corrected, in his words, with how many times he has had
to say it. A high count is not history: it is how tired he is of that mistake.
**Read it before you start, and check your work against every line before you
tell him anything is done.**

| said | the rule | his words | held by |
|---|---|---|---|
| 5× | **Motion looks like the real animal or machine** — never a slideshow, a tic or a paper flip | "rotating as a simple paper leaf" · "It looks glitchy and fake" · "why do you have 6 identical frames ?!!!!!" | `frames` `enemygait` `turn-roar` `agent-rig` · skill `creature-motion-combat` |
| 4× | **No light, rim, halo, outline or ring round any body** | "Why still framed with light ?!!!" · "remove the ring" | `contrast` `fired-art` `no-rim-baked` |
| 4× | **Tell the player what they have, where to go and why** | "I have no idea what to get" · "no idea how to use them" · "I'm confused. I have no idea where I am" | `shop-ask` `gear-how` `map-read` |
| 4× | **A character looks like itself and holds only what it has yet**, in the game and in the comic | "more like a ninja, not like my hero" · "does not look like the actual Nilfang" · "holding my sword when i dont have it yet" | `fired-art` `artbible` `panels` `panel-continuity` |
| 4× | **A door is an object that leads somewhere new; one ring to a frame, nothing standing in it** | "you end up with neon doors?" · "why two portals" · "pods... superimposed on doors which makes it hard to choose enter or rest" | `ring-gate` `ring-pads` `ring-wake` `pod-door` |
| 3× | **Terrain is shaped ground she stands on** — never squares, straight lines or decoration | "No 90-degree elevation or walls in all game" · "these platforms are not organic" | `seam` `ring-pads` · skill `terrain-doors` |
| 3× | **A body stands ON the ground** — never in it, never over it | "came out of door glitched and trapped sub terrrain" · "The freed lion now is under the terrain" | `ring-pads` `gravehorn-ground` |
| 2× | **No one move, repeated, beats a boss** — sweep every boss with the bot that does it | "hitting the rhino downward with a hit constantly is a easy hack" · "do not allow player to keep hitting rhino with an endless down hit" | `boss-skill` `gravehorn` |
| 2× | **An enemy is HEARD over the score, on a phone; the score never dies** — measure the level, never trust the number typed | "There is no sound for the howling" · "alfa still has no sound" · "why music stoped ?" | `voice-heard` `whatplays` `media-container` |
| 2× | **No place to hide from a boss** | "I can just simply hide where the crystal is" · "again, just like the rhino" | `gravehorn-ground` `alpha-run` `boss-skill` |
| 2× | **An enemy is big enough, and visibly alive or visibly down** | "This enemy is so small" · "its standing still !!!" | `cheetah-hunt` `fired-art` |
| 2× | **A deck exists only where it is the way up, and it is a solid object** | "platforms that do not make any sense" · "so translucent" | `ring-pads` `fired-art` |
| 2× | **Nothing opens or buys by surprise** | "And it happened again... suddenly the window opened" | `shop-ask` |
| 2× | **All art, video and structures come from Higgsfield; the code is ours** | "You are not good at it. You can create the code... but not the art." | `artbible` · skills `art-bible` `rig-animation` |
| 2× | **Do the whole job; never recite what is left** | "You are not a kid that I need to keep monitoring." | no harness — check your report before sending it |
| 1× | **The verb is PURIFY, never free; the robed ones are AGENTS, never sages** | "it should be purifying, not freeing" · "this is not a sage" | `pure-gift` `panels` |
| 1× | **Turning the phone always brings the game up** — test it on a phone, upright first | "User stuck on rotate with nothing" | `rotate` |
| 1× | **What looks sharp cuts: the hit is the drawn shape, coming and going** | "his flying horn is not hurting me when toutching them" | `gravehorn` `sharp` |
| 1× | **Do not waste the player's time** | "don't waste the player's time" | `campaign-ch1` |
| 1× | **Few words to read: pictures, markers and icons do the telling** | "minimize all the text that we see while keeping the scenario understandable" · "small images, shots... instead of typing it with a small text unreadable" | `text-budget` `campaign-ch1` |

**When he corrects something — every time:**

1. **Fix what he pointed at.**
2. **Sweep.** Find every other place in the game that breaks the same rule
   (other enemies, rooms, kingdoms, the comic, NOSTOS) and fix those in the same
   change. Do not ask him about anything a line above already decides.
3. **Put it in this table.** A new mistake is a new row with his words. A
   mistake that is ALREADY a row gets its count raised and his new words added:
   that is the signal that the last fix was too narrow.
4. **Give it a harness** that fails if it comes back, and name it in the row.
5. **Tell him what the sweep found**, in a line or two. Never answer a
   correction by explaining why it was that way.

Keep this table short. A row leaves it only when he says so.
`tests/ledger.cjs` holds the table's shape and this file's size.

## How he wants to be answered (2026-11-17)

He asked for this directly, more than once in one evening: **"Be honest."** ·
"I'm simply not convinced on what you're selling" · "this is not what I'm
looking for. I'm looking for your honest description."

- **Plain and true, even when it is unflattering to the work or to you.** Say
  what is worse as well as what is better. Do not sell.
- **Answer first, short.** No agent-speak, no recital, no defending.
- **He plays the game; you cannot.** What he reports from playing outranks
  anything a harness says.
- **He wants the work to grow with him.** It grows only through what is written
  here, in the skills and in the tests. Leave each session's understanding of
  him better written than you found it. (Working preferences only: this
  repository is published, so nothing personal about him goes in it.)

## How to work here

- **Finish the complete task** (owner-authorized, 2026-09-07): implement, test,
  fix, ship, verify live. Stop only when it is verified or he alone can clear
  the blocker. Never claim completion without verification, never reduce scope
  silently, never weaken a test to pass.
- **Report what shipped** and anything he must decide. Do not list what remains:
  the backlog is `docs/ART_QUEUE.md`.
- **One branch**: `claude/clawbyte-repo-migration-byhyl8`. Fetch before work.
  Verify, then push it and mirror the same commit to `main` (production) and
  `odyssey`. Never force-push, never branch, never reset another author's work.
  Built pages (`index.html`, `odyssey.html`) are never hand-merged: rebuild.
- **Standing deployment authorization** (2026-09-07): completed, verified
  updates may be published to `main` and mirrored to `odyssey`.
- **Live: https://zaferdajani.github.io/HZD-99/** — the only URL to quote, and
  the one a deploy is checked against.
- **Story**: `docs/STORY_CANON.md` overrides older story text.
- **The studio is VibeSolutions**: one constant, `STUDIO`, in `js/game.js` and
  `build.cjs`; never an i18n key (`tests/brand.cjs`).
- **Art**: generated through Higgsfield, the owner reviewing it; archived in
  `assets/source/` in the same commit; credited in `assets/CREDITS.md`.
- **RULE ZERO**: author at full quality, derive every cheaper tier with a tool.
- **RULE ONE**: web, phone, the app and the desktop shell are ONE build. After
  touching assets, pages or input: `node build.cjs && npm run app:pack`.
- **Display text** is never hard-coded: `js/i18n.js`, five languages.

## Commands

```bash
node build.cjs                 # the whole build. Emits index.html + odyssey.html
node tests/serve.cjs &         # the tests need the repo served on :8220
node tests/run.cjs             # every harness (see tests/run.cjs for the list)
node tests/run.cjs saw wake    # or just some
npm run app:pack               # assemble www/ for the native shell
```

Three things that will bite, every time:

- `build.cjs` **concatenates** `js/*.js` into one script. Two files declaring
  the same `const` is a black page. `node --check js/<file>.js`, then build.
- **Nothing in code may name a file that is not on disk.** After art changes:
  `node tools/lowres.cjs`, `node tools/roomassets.cjs` (served), then build.
  After a new track or film: `node tools/faststart.cjs` (phones need a plain MP4).
  After a new plate: `node tools/defringe.cjs --check` (models paint a cyan rim by habit).
- **Never edit sources or rebuild in a tree a harness run is using**, and run
  the suite in batches: the container restarts under long runs.

## Where the rest is — read it when the work touches it

| when you are about to | read |
|---|---|
| change a room, platform, door, gate or ceiling | skill `terrain-doors` |
| edit anything in `js/` or `tools/`, or find where something lives | skill `engine-map` |
| add or change an asset, or how anything reaches a device | skill `platform-delivery`, `docs/DELIVERY.md` |
| touch a character's art, or generate anything | skills `art-bible`, `art-prompts`; `ART_BIBLE.md` |
| give a character a new move or smoother motion | skill `rig-animation` |
| build or tune a fight | skills `combat-design`, `boss-movegen`, `boss-openings`, `boss-patterns` |
| know exactly what an order of his says, and why | `docs/OWNER_ORDERS.md` |
| know the branch protocol's history, the session fleet, kingdoms | `docs/SESSION_FLEET.md` |

These were sections of this file until 2026-11-17 and were moved, unedited, so
that this file is short enough to be read first. Nothing was deleted.
