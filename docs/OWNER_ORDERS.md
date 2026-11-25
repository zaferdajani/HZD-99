# The owner's standing orders — in full

`CLAUDE.md` carries each of these as one line (THE LEDGER and HOW TO WORK HERE).
This is the whole text of every order, in his words, with why it was given and
what it changed. It was moved here from `CLAUDE.md` on 2026-11-17, unedited, so
that the rules file could be short enough to be read first and followed. Read
the section an order's ledger line points to before changing anything it
governs.

## Story authority

Read `docs/STORY_CANON.md` for the owner's robot-cat narrative, first NPC,
cave-before-sage quest and one-control-at-a-time tutorial. It takes precedence
over conflicting older story descriptions.

## Finish the complete task (owner-authorized, 2026-09-07)

Treat every requested feature and accepted correction as part of the completion criteria. Continue autonomously through implementation, integration, testing, fixes, and any authorized deployment. A completed phase, commit, plan, or queued generation is not completion of the task.

Give brief progress updates while continuing to work. Do not end a turn merely to announce unfinished work or ask whether to continue.

Stop only when the complete task is verified or a concrete blocker requires the owner's input. Before stopping, finish all independent work that remains possible. Explain the exact blocker and ask only for the minimum action needed.

Never claim completion without verification, silently reduce scope, or weaken tests to obtain a pass. These instructions do not override security controls or required approvals.

## Standing deployment authorization (owner-authorized, 2026-09-07)

For `zaferdajani/HZD-99`, the owner authorizes publishing completed, verified updates to `main` and mirroring them to `odyssey`, including deployment to GitHub Pages. Do not force-push or bypass branch protections.

## NO BACKLOG RECITALS (owner's standing order, 2026-08-16)

**"Never tell me 'still not done' at all. You are not a kid that I need to
keep monitoring. You have the resources and approvals that you needed."**

Do not close a report with a list of what remains. The owner has already
given the approvals and the credits; enumerating the backlog at him is asking
to be supervised, and it spends his attention on work he has already
authorised instead of on the work that landed.

- **Report what SHIPPED**, what it fixes, and anything he must decide or that
  another session must wire.
- **The queue lives in `docs/ART_QUEUE.md`.** That file is the backlog. It is
  where remaining work is tracked, and it is complete enough that no verbal
  recital adds anything.
- Say something is unfinished ONLY when he needs it: a blocker he alone can
  clear, or a defect shipped that he would otherwise discover himself.
- Then keep firing. The list is run top to bottom without being narrated.

## A CORRECTION IS A RULE FOR THE WHOLE GAME (2026-11-17)

**"Why do you not remember what I told you and improve?"** — the owner, after
being told that a session starts with no memory of the last one. He is right to
ask, and the answer has two halves that must not be confused.

**What carries over is only what is written here.** No session remembers the
one before it. A correction survives as a rule in this file, a harness in
`tests/`, a skill in `.claude/skills/`, or the code — and nowhere else. A
correction that is fixed in one place and written nowhere is a correction he
will have to make again, and that is this session's failure, not his.

**And a correction has been applied too narrowly.** He refused the light round
enemies three times before it was removed outright. After NO LIGHT ROUND A BODY
became a standing order, the ember ring behind the Eye's agents — the same
thing — stayed in the game until it was noticed by accident and he was ASKED
whether to keep it. The rule already answered that.

So, for every correction he gives:

1. **Fix the instance he pointed at.**
2. **Sweep.** Search the whole game for every other place that breaks the same
   rule — other enemies, other rooms, other kingdoms, the comic, NOSTOS — and
   fix those in the same change. If one is a real judgement call, fix the clear
   ones and name that one; do not ask about things the rule already decides.
3. **Write it down**: the rule here in his words with the date, and a harness
   that fails if it comes back. A fix with neither is not finished.
4. **Report the sweep**: what else was found and fixed, in one or two lines.

Do not answer a correction with an explanation of why it was that way.

## THE SEWER AND THE SHELL (owner, 2026-11-24)

"Instead of caves in the next kingdom... One of the caves would be a sewer...
just like in Super Mario, where you enter the sewer from an opening, with the
same graphics that you created the gates for the second kingdom... you hold the
door on the floor, the metallic door, which looks like a waffle... you open it
up with a cracking metallic rusty sound, and you dive inside... you start from
the top, falling on a platform that goes down... Imagine Ninja Turtles...
Crocodile should give you shield out of his skin... bring back to that kingdom
NPC to craft a shield... Putting the shield on will probably make you slower,
but adds defense bonus... make going to the crocodile a quest."

His answers when asked: the sewer is UNDERTOW's three caves; the smith is a
new robot pipe-smith in the sewer; swimming not yet (decide later); the shield
rides on her back like a shell.

What it is (`js/sewer.js`, `tests/sewer.cjs`): the relay gallery's ring is a
floor hatch she hauls open in her own art and drops through onto a lift down a
shaft; Rivet the pipe-smith asks for MIREJAW's shed skin, MIREJAW gives it,
Rivet forges the hide shell, and the tunnel to UNDERTOW opens. The shell slows
her, turns blows from behind (heating like the brace) and takes a core off a
heavy blow; Gear puts it on and takes it off. The sewer's enemies are the bats
and hopper the caves already had — a new sewer species would need its whole
move set first (the rule below).

## A NEW SPECIES GETS ITS WHOLE MOVE SET (owner's rule, 2026-11-22)

**"From now on, when you create a new species enemy, it all needs to have complete
artwork concept, and then you adjust accordingly. So you have to have a template for
each function: dying, hitting, defending, jumping, crouching, etc. So you have to see
all the movements possible and create artwork for it. It's a rule."** The template and
the procedure are `docs/SPECIES_MOVESET.md`; the record is `assets/movesets.json`;
`tests/species-moveset.cjs` fails a species under the rule that lacks a function, shares
a strip between two, or has a strip the fight never draws. Said the same day: **"The
alligator should go on diagonal move, not like sliding, but like either swimming using
its tail or legs... or to walk on the inclines"** — every strip that carries a body turns
over by the distance it covers (`MJ_STRIDE`, `tests/mirejaw.cjs` NOTHING SLIDES).

## ART IS HIGGSFIELD'S, CODE IS OURS (owner's standing order, restated 2026-08-16)

**"All arts, videos, images, STRUCTURES should be created through
Higgsfield. You are not good at it. You can create the code, you can
create the gameplay, but not the art."** Structures is the word that
changed: the booth, the city gate monument, the cave mouths — anything
that reads as a built or natural THING — are Higgsfield plates, not
procedural drawings. Every procedural structure currently in the game
(drawBooth, drawGateDoors, drawCaveMouth) is a wiring stand-in awaiting
its fired plate on THE FIRING LIST (§2f, §2g), and no new structure may
be added without its brief going on that list in the same commit.

## NO LIGHT ROUND A BODY (owner's standing order, 2026-11-16)

**"Why still framed with light ?!!!"** — the third refusal of the same thing
("framed by a white frame, which is weird", 2026-10-16; "light aura... it
breaks the blending with the surrounding", 2026-11-15). From 2026-10-12 every
hostile body carried a pale rim outside its silhouette to lift it off dark
rooms. It was thinned twice and refused each time, because it is the LINE he
refuses, not its strength. It is removed from the engine (`js/foeread.js` keeps
only the stencil, for a body's pigment and its hit flash).

- **Never draw a rim, halo, keyline, outline or glow round an enemy, a guardian
  or an NPC to make it read.** A body that sinks into its room is a job for its
  own art and that room's light.
- **An infected agent wears nothing behind it either** (owner, 2026-11-17:
  "remove the ring"). While she carried crystal light `drawSage` laid a dark
  disc with an ember ring stroked round it behind the body. It is withdrawn;
  the crystal's sense still counts the agent, and `tests/fired-art.cjs` holds
  that the body draws the same pixels with the light in her hands as without.
- `tests/contrast.cjs` holds it: a body drawn through the frame's own call has
  no pixel the bare body lacks. It still prints how much of each silhouette
  reads off its room — a record for the art, not a bar to buy with a line.

## THE STUDIO IS VIBESOLUTIONS (owner's standing order, 2026-09-10)

**"VibeSolutions ... is the name using to become my creating company name. I
will add all the projects all the released and published projects to be from
this name so all the projects I created here or other platforms will be
registered under VibeSolutions."**

Everything this repository releases publishes under that name. It is ONE
constant in two places that must stay in step — `STUDIO` in `js/game.js` (the
in-game footer, drawn by `drawFooter` on the title screen and the pause card)
and `STUDIO` in `build.cjs` (the `author`/`publisher` meta and the structured
data in every built page). `package.json`, `assets/CREDITS.md`, `README.md` and
`docs/STEAM.md` carry it in prose.

- **It is not an i18n key.** A company name is a proper noun and is the same in
  every language the game speaks; routing it through `t()` invites a translated
  trademark.
- **The person is not erased.** The structured data publishes as the
  Organization and keeps `creator` as the person who made it.
- `tests/brand.cjs` measures it — the meta in both shipped pages, and the two
  screens actually drawing the name — because a footer is the kind of thing
  that disappears in a refactor and nobody looks twice at the bottom-left.

## THE LIVE LINK (owner's standing order, 2026-08-18)

**Live: https://zaferdajani.github.io/HZD-99/**

That is the ONLY URL any session may quote. The old
`zaferdajani.github.io/odyssey/` path is dead — it returns GitHub's
"Site not found" 404, so a report that ends with it hands the owner a
broken link. The name changed; the link changed with it.

It is also the URL the deploy check must md5 against: comparing
`git show HEAD:index.html` to a 404 page produces a mismatch that looks
exactly like a failed deploy, and that is how twenty minutes were spent
chasing a deploy that had in fact succeeded.

## 2026-11-25 — the agent before the lion; grass; game effects

- **The agent comes right before NULLFANG, and the mini-bosses build it up.** *"I think it's
  better for the story to build the suspense about the agent, hint about the agent from all of
  the mini bosses that talks about the agent that controls this kingdom. It's the agent from
  whoever took Mother's song, representing her or representing it in this kingdom. It should be
  right before Nilfang."* Chapter one is now: the forge → CHIME → TALLYMAN → NULLFANG.
  GRAVEHORN, beaten, warns that the Eye's hand rules the kingdom; CHIME's last note names
  TALLYMAN below the quarry and wakes its ring (docs/STORY_CANON.md, tests/story-sheet.json).
- **Grass.** *"find free library for the grass instead of these green lines"* · *"grass that can
  move with the characters ... whenever I walk on it or an enemy walk on it"* · *"do not make
  the game heavy"* · *"It shouldn't look like squares stuck together. It should be continuous
  without edges."* A CC0 painted card, bending columns, no edges (js/grass.js, tests/grass.cjs).
- **Effects are a game's, not a comic's.** Of the white impact frame with black action lines:
  *"As a gamer, do you think this is a proper effect? It looks more like a comic effect than an
  actual game effect."* (tests/no-comic-fx.cjs).
- **Enemies see her.** *"Give the enemies self awareness, not just roaming around ... once they
  see me, they come to me. All of them"* — and the small shield machine is a big armoured walker.
- **NULLFANG's arena:** zoomed out, metal banana-leaf cover he hides in; the leaves where he will
  burst from move first, a split second of warning.
- **Insects:** butterflies, dragonflies by the swamp, moths in caves — small, flying away, not
  interactive, for a richer world.
