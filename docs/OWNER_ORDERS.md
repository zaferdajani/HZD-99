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
- **NULLFANG's burst and cover.** *"Try to use whatever art we have to create whatever missing
  from Nilfang. Burst art."* (built from the clump's own leaves: they open round him and tear) ·
  *"you only added two trees. So nilfang will either go to one or the other ... adding more
  different shapes of trees ... that covers the whole space"* (seven clumps, five shapes).
- **The door to Kingdom 2, and the paid game.** *"cover the door with leaves and plants that stick
  to it, just like the climbing plants. That when I free Nilfang, it simply removes it. It does a
  move like a roar ... And the trees will just respond and create an opening ... we can let
  whatever Nilfang gives give it to me right now, while this door leads to the second kingdom,
  which I will provide for users for payments. Now, the first kingdom will be free testing. If
  they want to go to the second kingdom, they will have to buy the full game ... instead of going
  up into the sky, into the light, which means you will remove the light from the screen before
  it ... Going to the door will give me an entrance to a place where I will have to use my dash to
  reach the second kingdom. And this door should look different than the ones before and similar
  to the ones within the second kingdom. To make the story connected."*
- **The web is for testers, always.** *"as long as we're on the web app, all people who access the
  web are actually testers. So even if it shows it's a paid version or buy it or whatever, which
  will direct users later on for the full version, depending on their platform, still users on
  the link can access the second kingdom and all other kingdoms freely."* The paid gate stops
  only store builds without the full game; the web link never stops anyone.
  The stores (owner, 2026-11-25): *"The stores I'm talking about are going to be for mobile as iOS,
  Android store, and probably Steam."* — the paid gate checks the App Store, Google Play and Steam
  entitlements on those builds; the web link stays open to testers.
  At the threshold, first an end-of-kingdom moment: *"You can show it as end of, okay, or
  something catchy for the first kingdom. And moving on to the next one. The quest is still
  going. And then it shows the payment or whatever gate or the message."*

## THE WOLF MOUNT — ordered 2026-11-25; started the same day (owner: *"Actually start the wolf right now."*)

The owner: *"the logic of alpha wolf that gives me the ability to summon wolves. Improving this
skill by spending shards at certain NPCs should allow me to later on mount the wolf ... I can use
the wolf when it's summoned as mounted and fight with it. Hits will reduce the wolf's hit until
it's tired and depleted. That's when the wolf will run back away, will retire and leave you back
to fight. Mounting a wolf should give me extra abilities, have its own artwork, have its own
abilities and fun to play with. I should be able to use it to defeat certain enemies ... maybe
Kingdom 3 or 4, I should be needing this, where I find an NPC that tells me about the secret of
mounting wolves through a certain task that allows me to learn it when I finish the task ...
Maybe not in the next kingdom, make it in the one after that. Keep it recorded when you do the
kingdom adjustments. Try to create the artwork yourself if you can, from whatever you have. This
adjustment should start after next Friday, 9 p.m. so that we wouldn't consume the remaining of
the tokens that I have"* · *"While mounted, I should also be able to use dash as a skill and
create skills that I can use using the wolf, such as scratch, jumping, howling. Maybe that will
stun the enemy a little bit."*

What it is, so the kingdom work keeps room for it:
- **Unlock path:** the Alpha's summon (already hers) → upgraded with shards at chosen NPCs → the
  MOUNT itself is learned in **Kingdom 3** (not 2): an NPC there tells the secret and sets a task;
  finishing the task teaches it. The task is still to be designed — record the NPC and the task
  in that kingdom's plan when it is built.
- **Mounted:** she rides the summoned wolf and fights from it. The wolf has its own health: hits
  wear it down until it is spent; then it runs off and leaves her on foot. Its own art (from the
  wolf art we have where possible), its own moves: **dash** (her dash, mounted), **scratch**,
  **jump**, **howl** (a short stun). Some later enemies are built to need it.
- **When:** started 2026-11-25 on the owner's word (the earlier "after next Friday" is withdrawn).

**Built 2026-11-25** (`js/wolfmount.js`, held by `tests/wolf-mount.cjs`):
- **The upgrade (shards):** Ratchet's shelf sells **THE PACK, LONGER** (760 shards) once the pack
  is hers — through the ask-before-buy shop, never by the question that opens it. Her called
  wolf stays 15 s instead of 10 and bites for 22 instead of 14 (`packStat`, `G.save.packLv`).
- **The Kingdom 3 task — THE TINKER'S HARNESS:** in the Foundry (zone C) the Tinker (`patch`),
  once his own errand (`patch_quiet`) is done and she has the pack, says a wolf that trusts her
  will carry her, and asks that **her called wolf bring down three of his machines**. Only kills
  the wolf makes count (`questPackKill`), not hers. Paid, he fits its harness: `flags.wolfMount`.
- **Mounting:** call the wolf, stand beside it, press the interact key (or UP). Off at will:
  DOWN + JUMP. The wolf grows to carry her (1.9× its pack size) and she sits on its back in her
  own landing crouch, bobbing with its stride — the filmed wolf strips and her own cells; no new
  art was generated (0 credits).
- **Mounted moves:** it runs 1.45× and leaps 1.22× higher; ATTACK is its **scratch** (the
  lunge strip, hitting a box at the claws' reach in front of it, recorded claw and bite); DASH
  is its **lunge** (1.4× further, hurts what it runs through, none of her dash's light — no
  echoes, wake, ring or flare); the ARM button is its **howl** (the recorded howl; machines
  within 280 px are staggered 1.2 s; a guardian only flinches 0.35 s; dust, no ring of light).
- **The wolf's stamina:** a bar on the HUD (WOLF). Blows land on the wolf, not on her cores;
  the howl costs a little; it tires with use. Spent, it shakes her off onto her feet and lopes
  away, and the call waits its cooldown.

**Reversed 2026-11-26** (owner: *"the wolf I'm riding on should be at the same size as the wolf I
am summoning — you're summoning a small one and then riding a big one. You probably should summon
the beaten Alpha and ride it ... at the beginning I can only summon one of the small ones ... I
upgrade, it becomes stronger, which allows me to summon the Alpha instead ... alongside the upgrades
I can mount it ... a new skill tree opening ... showing at the end Alpha mount"* · *"it's only going
to happen in the later stages of the game. Shard amounts will be tested ... It should not be easy,
but it should not be hard."*). The 1.9×-scaled small wolf with her landing crouch on its back is
deleted. What stands now (`js/packtree.js`, `js/wolfmount.js`):

### THE PACK LADDER

| rung | where | price | what |
|---|---|---|---|
| THE PACK | the Alpha's yield (Kingdom 1) | — | one small wolf, 10 s, bites 14 |
| A STRONGER WOLF | Ratchet's shelf | **700** | the small wolf stays 15 s, bites 22 |
| CALL THE ALPHA | Ratchet's shelf | **1150** | the purified Alpha comes instead, at his own size (the boss's box and draw scale), 12 s, call cooldown 22 s; fights with his filmed CLAW (26 a rake); she keeps all her attacks; he never touches her |
| THE ALPHA'S HOWL | Ratchet's shelf | **400** | his second power: every ~6.5 s he howls (recorded) and machines within 300 px stagger 1.1 s (a guardian 0.3 s) |
| RIDE THE ALPHA | Patch-7's shelf (the Foundry, Kingdom 3) after his harness task | **800** | ride the Alpha she calls: dash = lunge, attack = scratch (rear and swipe), arm = howl, his own stamina; drawn only from the filmed whole-rider strips (`alRideGallop/Leap/Rear`) |

Ratchet sells his three rungs on ONE row of his shelf, always the next rung. The harness task
(`patch_harness`) now waits for CALL THE ALPHA and counts only machines the called Alpha brings
down. Everything is bought by asking (the shop's question card); the tree screen buys nothing.
The tree screen opens from Pause ▸ Skill trees, the O key, and a corner button on a phone.

### What the kingdoms pay, and how it was measured (2026-11-26)

`node tools/shardincome.cjs` counts every source of shards in every room the way the code pays it
(purified person-machine 14 + the purification ladder; a construct's wreck 4-9; floor scrap;
quarry caches 80; bosses' `bossScrap` + the Alpha's 60 / a mini-boss's 40; agents' gifts; errands;
woken NPCs 25). A cave or chamber counts for the kingdom whose door leads into it. That is a
**clean sweep**: every room once, every foe, every errand.

| | rooms | clean sweep | cumulative | of which floor scrap | bosses |
|---|---|---|---|---|---|
| Kingdom 1 | 29 | **3827** | 3827 | 1593 | Alpha, NULLFANG, CHIME, GRAVEHORN |
| Kingdom 2 | 24 | **2539** | 6366 | 1365 | TALONHOST, MIREJAW, PRISM, CARRIER |
| Kingdom 3 | 11 | **1380** | 7746 | 512 | FURNACE, MOTH |
| Kingdom 4 / 5 | 10 / 10 | 1278 / 1231 | 9024 / 10255 | | |

Partway through Kingdom 2 (half its rooms) is about **5100** cumulative.
Kingdom 1's critical path alone (the campaign bot's route, 18 rooms, no Alpha den, no LEASH) counts
**1695** plus its errands and ladder.

**What was NOT measurable, said plainly:** the chapter-one campaign bot (`tests/campaign-ch1.cjs`)
was run against this build and got STUCK in A2 at 4:24 (it cannot find the way down to A5 any
more): it had collected every shard in reach by then (98 held after the
12-shard Volt Pack), so it confirms floor scrap is picked up, but it gives no end-of-kingdom figure,
and there is no bot for Kingdoms 2 and 3. The owner's own play gives a lower anchor: *"632 scrap in
the first kingdom"* held after buying (2026-11-16) and the shop's note *"chapter one pays about 700"*
(2026-11-20) — both from the critical path, before the Alpha's den and the agents' chambers were
full of scrap. So a REAL player has roughly **55-80 % of the clean sweep** (missed side rooms,
errands not taken, pouches lost to deaths) — an estimate, not a measurement.

What the shelf competes with: crests 450-740 (five, 2830), Power Regulator 990, the dear life 1600,
the horn-star volley 600/900/1300 — 8220 in all, more than Kingdoms 1-3 pay. A player cannot buy
everything; the wolf is a choice.

**The prices against the income** (held by `tests/pack-prices.cjs`, which recounts the kingdoms
live and fails when a price leaves its band):

| rung | price | share of its kingdom's clean sweep | band | goal of |
|---|---|---|---|---|
| A Stronger Wolf | 700 | 18 % of K1 | 12-30 % | the end of Kingdom 1 |
| Call the Alpha | 1150 | 45 % of K2 | 30-65 % | the end of Kingdom 2 |
| The Alpha's Howl | 400 | 29 % of K3 | 15-45 % | Kingdom 3 |
| Ride the Alpha | 800 | 58 % of K3 | 40-85 % | Kingdom 3, after the harness |

The howl and the ride together are 87 % of Kingdom 3's clean sweep (band 60-100 %): at a real
player's 55-80 % they need some of Kingdom 2's savings — not easy, not out of reach. The wolf's
whole ladder is 3050, 39 % of everything Kingdoms 1-3 pay. These are the numbers to change when
the owner has played them.

## 2026-11-28 — insect kingdoms

*"Add insect kingdoms."* Asked whether he meant turning Kingdoms 3-5 into insect kingdoms, new
kingdoms on top, or insect foes inside the existing ones, he chose **new kingdoms on top**, each
with an insect sage. Designed in `docs/INSECT_KINGDOMS.md` (THE HUM and THE UNDERLEAF, between the
Crystal Cache and the Virus Nest); art queued as ART_QUEUE 2ch, ~530 credits, HUSHQUEEN first as
the proof (~38). Higgsfield held 0.12 credits that day, so nothing is in the game yet.
