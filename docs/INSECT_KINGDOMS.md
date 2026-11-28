# THE INSECT KINGDOMS — design (owner's order, 2026-11-28)

**The order:** *"add insect kingdoms."* Asked which he meant, the owner chose
**new kingdoms on top**: added to the six, each with an insect sage. The six
existing sages stay as they are (ledger: *"we do not change sages, but we add
other bosses"*). Everything below that is a name, a gift or a fragment is a
**proposal** until he has read it. The rules it is built to are the ledger's:
a kingdom is played, two mini-bosses that each give a piece and speak of its
agent, its agent right before its sage, a boss beaten by fighting it on its
signature move and its weak point, motion like the real animal, a real
recorded voice.

**Status:** design only. Higgsfield has 0.12 credits. Under the ledger's
first rule (*a new species gets art for every move first*), no fight is
coded before its art exists, so nothing here is reachable in the game yet.

---

## Where they sit

| # | kingdom | zone | sage |
|---|---|---|---|
| 1 | Scrap Meadows | A | NULLFANG |
| 2 | Data Conduits | B | TALONHOST |
| 3 | The Foundry | C | (as now) |
| 4 | Frozen Archives | D | (as now) |
| 5 | Crystal Cache | X | (as now) |
| **6** | **THE HUM** — the hive | **F** | **HUSHQUEEN**, the hornet queen |
| **7** | **THE UNDERLEAF** — the forest floor | **G** | **ORCHIDSCYTHE**, the mantis |
| 8 | The Virus Nest | E | Mother (the end) |

The two come after the Crystal Cache and before the Virus Nest. The Nest stays
last because it is where the story ends. The Crystal Cache's sage leaves the
ring to the Hum, the Hum's sage opens the road to the Underleaf, and the
Underleaf's sage opens the Nest.

**Why insects belong in this world:** the hive's pollinators are the machines
that CARRIED Mother's song from kingdom to kingdom; their hum is the song in
the air. When the Eye took the song, it took the hive first. The Underleaf is
where everything that falls is broken down and made into ground: its beetles
roll the world's scrap to the forges. Both kingdoms are machines, like every
creature here, made as insects in plate and hinge.

**Why insects are a parts rig:** an insect is rigid plates on hinges (head,
thorax, abdomen, six jointed legs, wing plates). That is exactly what the
rig-animation pipeline builds well: one fired parts sheet posed by code,
smooth between every move. Only each boss's SIGNATURE move is filmed, from a
real-insect reference converted to metal (task #3's method). This keeps the
motion true to the animal and the cost down (see the art list).

---

## KINGDOM 6 — THE HUM (zone F)

A hive the size of a mountain: comb galleries hung under a stone overhang,
wax-sealed halls, nectar channels, the queen's chamber at the heart. Hex
pattern lives in the walls and the BACKDROP only. The ground she stands on is
shaped wax and stone, rounded, never squares or right angles
(terrain-doors rules).

**The way through:** the road in → the comb galleries → WAXWARD → the swarm
halls → DRONEMASS → SMOKER's chamber (three rooms, like every agent's
network) → HUSHQUEEN.

### The enemies (each from the real insect)
| | real behaviour it takes | what she reads |
|---|---|---|
| **WORKER** (honeybee) | flies in threes, holds a loose formation, peels off one at a time | the one that drops out of formation is the one coming |
| **LANCER** (wasp) | hovers, aims, a straight sting-dive; stuck in the ground a beat after a miss | the hover-and-aim is the tell; the stuck sting is the opening |
| **GRUB** (larva) | lies in a floor cell, rears up and spits wax that sticks (slows her) | it rears before it spits |
| **NURSE** (bee) | mends the others and keeps away from her | cut it down first or the fight never ends |

### Mini-boss 1 — WAXWARD, the guard bee
Real guard bees plug the hive's entrance with their own heads.
- **Signature:** THE SEALING. It rams across the floor, and each pass lays a
  wax wall that shuts part of the arena, so the room grows smaller. There is
  no place to hide, by construction. Its third wall halves the floor.
- **Weak point:** it turns its back to lay each wall, and its abdomen is open
  for that beat. Blows to the front ring off its plated head.
- **Gives:** the first HIVE SEAL. Beaten, it says the hive no longer keeps
  its own door: *the smoke-keeper does*.

### Mini-boss 2 — DRONEMASS, the swarm
One enemy made of a hundred drones.
- **Signature:** THE SHAPES. The swarm becomes a fist (a slam), a scythe (a
  sweep along the floor) and a wheel (it rolls the length of the room). Each
  shape is announced by the drones streaming into it: you see it being built.
- **Weak point:** the BEAT-KEEPER, one drone that holds the swarm's rhythm. It
  is bare at the moment between shapes. Each hit to it scatters the swarm for
  a breath.
- **Gives:** the second HIVE SEAL. Its last drones hum the agent's name.

### The agent — SMOKER (dark name)
Beekeepers use smoke to calm a hive. The Eye made SMOKER to keep the hive
dull and obedient.
- **Look:** robed like the agents, but must not read like any of them: a
  censer swung on a chain, a hood of layered wax-paper, smoke always at his
  feet.
- **Signature:** THE SMOKE BANK. He fills half the room, vanishes in it and
  strikes out of it with the chain.
- **Weak point:** the CENSER. Strike it as he swings it and the smoke goes out
  for a beat, which bares him.
- **Fragment:** THE CARRIER NOTE, a bar of Mother's song as the hive carried
  it. (Proposed use: the map shows where the song is still pure, which is the
  hidden rooms.)

### The sage — HUSHQUEEN, the hornet queen
Huge: about three times her height, flying.
- **Signature:** THE CALL. She hums, the comb cells along the floor crack
  open in a line, and drones pour out of them toward her. Then she makes
  the STING DIVE (a tell: the abdomen curls under).
- **Weak point:** her song-drum under the thorax. It is open only while she
  hums, and to hum she must hover low, within reach. The way to beat her is
  to go in while she calls, through the drones.
- **Phase two (at half):** her torn wing-plates fail and she fights on the
  ground: a charge, a mandible grab, a ground-shaking wing-beat. It is shorter
  than phase one, never long.
- **Gift (proposed):** THE HUM WINGS. Hold jump in the air to hold her height
  for a moment, a hover on the hive's own wings.
- She is **purified**, never killed. A life for the sage (ledger).

### The cast
**WICK**, an old wax-chandler bot who kept the hive's light. He sealed himself
inside a cell before the smoke came. He is found and woken as Ratchet was, and
sells the kingdom's goods.

---

## KINGDOM 7 — THE UNDERLEAF (zone G)

The floor of a forest of machine plants: leaves as big as roofs, roots like
bridges, rot-light in the mould. Here she is the size of an insect: the
ground is root, leaf-litter and soft rising earth, never decks. The plants
are the platforms only where they are the way up (a leaf she climbs, solid).

**The way through:** the drop in → the litter → PITMAW → the root halls →
DUNGTHRONE → PINNER's chamber → ORCHIDSCYTHE.

### The enemies
| | real behaviour it takes | what she reads |
|---|---|---|
| **HORNBACK** (stag beetle) | armoured front, grapples with its mandibles, throws | flank it; a blow from behind tips it on its back (bare belly, a short beat) |
| **SKIPPER** (cricket) | a loud chirp, then a long leap at her | you HEAR the tell: the chirp |
| **PILL** (woodlouse) | rolls into a ball and rolls at her; uncurls to look | open only when it uncurls |
| **TWIGLING** (stick insect) | stands as a twig until she is past, then strikes from behind | its sway in no wind |

### Mini-boss 1 — PITMAW, the antlion
Real antlions dig a sand funnel and flick sand at whatever falls in.
- **Signature:** THE FUNNEL. The arena is a bowl of shaped ground (a real
  heightfield, no steps) sloping to its jaws at the bottom. It flicks sand that
  slides her down the slope toward it.
- **Weak point:** to bite, it surges up out of the sand, and its head and
  throat are out for a beat. Climbing the rim forever is no hiding place
  either: its flick reaches the rim.
- **Gives:** the first ROOT SEAL. It speaks of the collector who pins.

### Mini-boss 2 — DUNGTHRONE, the dung beetle
A scrap ball twice her size, rolled the length of the floor.
- **Signature:** THE BALL. Pushed head-down and walking backwards (as the
  real beetle does), it rolls across the floor and comes back off the wall. She
  jumps it, and the ball's bounce changes with its size: it grows as it rolls
  scrap up.
- **Weak point:** when the ball strikes a wall the beetle is thrown off it,
  belly up, for a beat. Hitting the ball does nothing.
- **Gives:** the second ROOT SEAL.

### The agent — PINNER (dark name)
Made by the Eye to collect the Underleaf's creatures: to pin them to its
boards, catalogued and still.
- **Look:** tall, a long coat lined with pinned specimens, a case on its
  back; must not read like any agent before it.
- **Signature:** THE PINS. Thrown in a fan, a pin that hits her FIXES her for
  half a second, and the next throw is aimed at a fixed target.
- **Weak point:** the CASE. When it reloads, the case opens on its back and
  it turns to do it.
- **Fragment:** THE SPECIMEN KEY, the Eye's own catalogue of where its hands
  are. It points the way to the Nest: the story's road to the end.

### The sage — ORCHIDSCYTHE, the orchid mantis
Tall, NULLFANG's scale, pink-white plate like the orchid she mimics.
- **Signature:** THE SNAP. The fastest strike in the game, a raptorial catch
  that takes anything inside its reach. The tell is the real mantis's: it
  sways like a leaf in the wind, then goes still. Still is the warning.
- **Weak point:** after a snap that misses, both forelegs are out straight and
  the elbow joints are bare. She has to bait the snap, step out, and come back
  in.
- **Phase two (at half):** it takes wing (mantises fly) and lands somewhere
  else on the floor. Each landing is a snap. The frame slides sideways with
  it, never up or down (ledger).
- **Gift (proposed):** THE COUNTER. Strike at the instant a blow would land
  and turn it back.
- **Purified**, never killed. A life for the sage.

### The cast
**MULCH**, a woodlouse-bot who curled into a ball and powered down when the
Eye came, as Ratchet did. She wakes him, and he knows the Underleaf's roads.

---

## What every fight must pass before it ships (the harnesses that hold the ledger)

- **The boss ladder** (`tests/boss-ladder.cjs`): each of the six new bosses is
  harder than the last kingdom's, and the masher, the back-bouncer and the
  heal-trader lose to every one.
- **No hiding place:** each arena is swept by the bots (WAXWARD's walls and
  PITMAW's rim exist for this).
- **Motion:** every move is drawn, and the species' whole moveset is in
  `assets/movesets.json` (`tests/species-moveset.cjs`).
- **Heard:** recorded insect sound, CC0 and credited: wingbeat, buzz,
  stridulation, mandible clack. It is heard over the score on a phone
  (`tests/voice-heard.cjs`).
- **Standing:** the walkers stand ON the ground (`tests/stand-ground.cjs`),
  and fliers cast nothing that floats.
- **No light round any body**, no outline, no halo. Wax glows only where it
  is wax.

---

## The art it needs, and what it costs (Higgsfield's own estimator, 2026-11-28)

A still (GPT Image 2.6, high, 1k) is **1.25 credits**. A 5-second filmed take
(Seedance 2.5) is **15 credits at 480p**, 35 at full size; takes are cut to
strips, so 480p is enough for an in-game strip. Every boss and enemy is a
PARTS RIG (one parts sheet and a turnaround, posed by code) plus FILMED takes
of its signature move only, from a real-insect reference.

| per kingdom | what | credits |
|---|---|---|
| the sage | turnaround 3 + parts sheet 1 + key poses 2 (7.5); signature and phase-two takes, 2 × 15 | ~38 |
| two mini-bosses | each: turnaround + parts + 2 poses (5); one signature take (15) | ~40 |
| the agent | the eight plates (10); the walk and signature takes, 2 × 15 | ~40 |
| four enemies | each: parts sheet + turnaround (2.5); one reference take (15) | ~70 |
| the kingdom's look | backdrop in 3 layers, ground plate, plant/comb platform object, ceiling, monument, ring dressing (8 stills) | ~10 |
| the NPC | turnaround + talk loop (still 2.5 + take 15) | ~18 |
| comic, key moments only | 4 panels (ledger: a picture only at the key moments) | ~5 |
| the sage's purification | one film (full size) | ~35 |
| music | kingdom theme + boss theme (AUDIO_QUEUE) | ~10 |
| **one kingdom** | | **~265** |
| **both kingdoms** | | **~530** |

The cheapest proof first: **HUSHQUEEN alone, ~38 credits**, to settle the
insect rig's look and motion before the rest is fired.

## The order of the work once credits are in
1. HUSHQUEEN's turnaround and parts sheet → rig her → film THE CALL → build
   her fight → boss-ladder. Show it to the owner as a clip.
2. With his yes: the Hum's look, enemies, mini-bosses, SMOKER, WICK; then the
   rooms (built around the arenas the moves need); then the Underleaf.
3. The doors: the Crystal Cache's ring to the Hum; the Underleaf's sage opens
   the Nest; the map, the story order (`tests/story-order.cjs`), the kingdom
   income (`tools/shardincome.cjs`) and the pack-ladder prices recounted.
