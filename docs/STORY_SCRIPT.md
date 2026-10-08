# CLAWBYTE — THE STORY, SCENE BY SCENE

**What this is.** The complete storyline of CLAWBYTE as the game actually plays it,
in play order, one scene per room-beat, with every line the player reads quoted
verbatim from `js/i18n.js`. It exists so a comic book can be drawn from it and
match the game panel for panel. Where a scene has a choice, both branches are here.
Where the game and the older documents disagree, §8 lists it for the owner to
rule on. This document is revised with the game; a scene that changes in code
changes here in the same commit.

**Authority.** `docs/STORY_CANON.md` (owner, 2026-09-08) rules the premise. This
file is the *play-through* of that canon. When they conflict, the canon wins and
this file is wrong — say so in §8 and fix the game.

**Re-synced 2026-10-08 with the story-order pass.** Every save now plays this story
(old saves are migrated on load — `migrateStory`, js/story-opening.js); the order of
chapter one is enforced by the game and walked by `tests/story-order.cjs` against
`docs/STORY_SHEET.md`, which lists every beat with its room, required flags, speaker,
what they know and who points the player there. Lines quoted here are the English
of what the robot world actually shows (`t()` resolves `STORY_ORDER_TEXT`, then the
Oct-4 and Draft-2 tables, then `I18N`).

**Owner's direction folded in (2026-09-19):** the volt pack. HZD-99 cannot heal or
supercharge when she wakes. The first thing she ever buys, Ratchet's volt pack,
wires both. Until then the ring of charge at the top of the screen fills and
cannot be spent. §2.5 is that scene.

---

## 0. THE CAST — WHO THEY ARE AND WHAT THEY LOOK LIKE

| Who | Role | Look (for the pencils) | Where they stand |
|---|---|---|---|
| **HZD-99** | The hero. A small maintenance robo-cat, the last uninfected unit awake. | White chassis, black visor face with two cyan eyes, red scarf-cape, claws. Head-and-a-half tall against Ratchet. Never carries a sword on the cover of chapter 1. | Everywhere |
| **MOTHER-V** | The broadcast heart of the Depths. She sang the Song that ran the city. Hijacked, not evil. The last fight — and she is cleansed and lives. | "Not a machine and not a creature: a transmission that grew mass." Radial, no face, one golden core inside a violet-grey shell of plates, everything beating at ~0.9 Hz. | E3, the bottom of the Nest |
| **The evil robot — the Eye** | Hijacked the Song and hid the virus in it. The command was his. Built the five constructs. | **Never seen in the game.** Reported, then named at the end as what remains. See §8.1. | Nowhere (yet) |
| **Ratchet** | The trader and tinker. First NPC. Wears the crystal necklace that burned the virus out of him. Pulled his own battery and waited. | Big, round, copper-brass body, domed; the crystal on a cord at his chest; a canister rack on his back that vents heat; a bench of salvage. His tic: the hand reaches for a tool that is not there. | A0B (his den) until he forges the blade; then A3 (the camp). One machine, one battery, one waking. |
| **Old Servo** | The meadow's winch-keeper. Raised every gantry over the meadow. | Old, boxy, half turned into the winding drum behind him. | A1 |
| **Mono** | The Oracle. Archived the network; now archives its ruins. Runs the Cognition Trials. | A CRT face on a shroud of dead cables, reading a river of data in the dark. | B3B, the Parlor |
| **Kerf** | The Deaf System's cutter. Deaf from the factory, so the Song never reached her; never switched off. Her people's harvester gave Ratchet's ancestor his marble; she shaped the second blade. | A cutter unit with one hand always on the floor — she reads the world through the rock. | V1B, the Kerf |
| **Patch-7** | The Foundry's repair unit. | Copper-domed unit at a hearth. | C5B, the Forge |
| **The Nine-Lives Sage** | On its ninth life. Knows GLACIERE, the Archives' sentinel, guards the Kernel Key. | A sage in a carrel; the one warm floor in a frozen kingdom. | D1B |
| **Lumen** | The Lost Nymph. Glows harder when afraid; always glowing. | A small luminous unit whose glow keeps one pocket of the Nest clean. | E1B, the Hollow |
| **The seven chamber sages** | The kingdoms' protectors, kneeling under the Song two rooms behind each guardian. | Kneeling figures with a black halo and an ember rim while infected; the halo goes blue when purified. | Every G\*D deep chamber |
| **NULLFANG** | Guardian of the Meadows. A virus-infected robot lion with whelps. | Lion-frame, red light behind the eyes. | A2 (the meeting), A4 (the fight) |
| **THE ALPHA** | Leader of the wolf pack. Not a guardian; not the Eye's. | A great wolf-frame with the pack behind it. | A10 |
| **TALONHOST** | Guardian of the Conduits. The Iron Eagle. | Hangs from above, drops and slams. | B4 |
| **The Prism Prowler** | The rival robo-cat. The one machine the network never indexed, so the Song never touched it — never infected. Keeps Kerf's second blade. | A clear, blue crystal cat under a skin of virus-red; the same body either way. | X1 |
| **FURNACE CHOIR** | Guardian of the Foundry. A corrupted mecha dragon. | Roosts high; breaks into parts when it falls — wings, then head, then body. | C3 |
| **GLACIERE** | Guardian of the Archives — *THE FROZEN SENTINEL* (never "Purifier": that is the sword's name). The corrupted unicorn of the void. | Ice and void; shatters into parts on death. | D3 |
| **The Eye's five constructs** | CHIME, CARRIER, KILN-MOTH, LATTICE, THE LENS. Built by the source of the Song, not infected — there is nobody inside. | Instruments, not monsters; each built around a Power Cell. | A9, B8, C7, D6, E6 |

**The three rules of the picture** (from the art direction): red light behind the
eyes means infected; nothing down here is new, everything is somebody's afterwards;
the deeper she goes, the less it looks built and the more it looks grown.

---

## 1. THE PROLOGUE — THE OPENING FILM

Title screen: **CLAWBYTE** — *A robo-cat metroidvania in the Machine Depths.* "Who
are you?" — *A robo-cat ninja. The Machine Depths await.* Difficulty: **Select
Protocol** — Kitten / Standard / Nine Lives (*Double damage, faster foes — and
exactly nine lives.*).

Eight shots, forty-six seconds, no dialogue — the reel is carried by the music.
Each shot is one panel, and the caption is its text box:

1. *KERNEL DEPTHS. A city of machines, run on one broadcast — the Mother's Song.*
2. *MOTHER-V, the broadcast heart. While she sang, the Depths were kind.*
3. *Until an evil robot hijacked her Song.*
4. *Hidden in the melody, a virus spread from machine to machine.*
5. *The Song became a command: OBEY.*
6. *Even the protectors of the kingdoms fell under its command.*
7. *Forgotten in a service cradle, a small maintenance cat slept through the broadcast.*
8. *HZD-99 woke to a silent city — and went to give the Song back.*

**Story.** The Depths were a city of robots, divided into kingdoms — each with its own
air, its own people, its own music — and one Song, Mother's, ran through all of it.
An evil robot hijacked the Song and hid a virus in the melody. Every machine that
listened turned toward the tower, mid-sentence, and obeyed. The guardians of the
kingdoms went last: they were made to protect, so the Song had to shout them down,
and it took all of them before anyone stopped fighting it. One maintenance cat, in
sleep mode in a service cradle, heard nothing. Sleep is why she escaped. She is not
immune. She is late.

**Panel note.** Shot 8 ends on her eyes opening. The next thing the reader sees is
§2.1 — do not cut to anything else between them.

---

## 2. CHAPTER ONE — THE SCRAP MEADOWS (the free chapter)

### 2.1 The cradle — W1

**Where.** A service bay. She is still in the cradle.
**What happens.** For two seconds she cannot move: the machine is letting go of her.
A power-up hum, a shudder, then — at the last moment — *the clunk of the last
umbilical coming off.* She stands. No words. The first text the player ever reads is
the tutorial chip: **Move** — *Walk right toward the light.* She walks. The door at
the end has been open a long time: **Leave** — *the door has been open a long time.*
**Story.** Nothing in this room can touch her; nothing is in it at all. That is the
point. She is alone in a way that has not been true of anyone down here for a long
time.
**Panels.** Dark bay, one shaft of light from the right, cables letting go one by one,
a small white cat standing up in a cradle too big for her.

### 2.2 The road and the gates — W2

**Where.** Outside, under sky, the city gates at the far end.
**What happens.** A step and a gap: **Jump** — *Press once to jump over the obstacle.*
Then the gates: **The gates** — *stand beneath them and press UP.* The gates are the
only way in, and they close behind her. The opening is one-way, like waking up is.
**Story.** The city is standing. It is silent. The gates were built to be enormous —
the only monument in the kingdom — and nobody has walked through them in a long time.
**Panels.** A wide shot of the road with the gates small at the end; then the gates
huge above her; then the gates closing on the road behind her.

### 2.3 The waking floor — A0

**Where.** The first street inside the gates: one machine, a booth, a Mind Node.
**What happens, in order.**
1. **Scratch** — *Strike the marked machine.* The machine (a crawler) is calm; it does
   not fight back. **Finish it** — *keep going — it breaks.* It breaks into a wreck;
   the wreck breaks into scrap.
2. **Take the scrap** — *walk over it — scrap is what you pay with.* The first pickup
   explains itself: *Scrap — What a broken machine leaves behind, and the only money
   down here. The trader takes it for repairs, parts and upgrades — so a machine you
   break is a machine you spend.*
3. Twelve scrap in hand, the booth door opens in the street wall. **Buy a volt cell** —
   *Speak to Ratchet and buy one volt cell.* (Ratchet is asleep at this point, so
   the chip reads **Read Ratchet's note** — *Interact with the sleeping robot.*)
**Story.** The first machine she ever breaks was somebody. The game does not say so
yet. Old Servo will, next room.
**Panels.** A cramped street; a single red-eyed crawler; the booth — *built from four
dead haulers and a parade banner* — set into the wall.

### 2.4 Ratchet's den — A0B (the letter, the drawer, the repair, the kit)

**Where.** Behind the booth door: a den, a crafting bench of a room, a pod built into
the wall, a drawer, and a big round unit sitting dark at the bench. This is his one
home; he stands here, and only here, until he has forged her blade (§2.10).
**What happens.** She reads the letter at his empty socket:
> *A handwritten letter is tucked against his empty battery socket:*
> *“Mother’s song has been infected. My marble slowed the virus, but cannot stop it. I removed my battery before it could take me. It is in the drawer beside this chair.”*
> *“Seat my battery in its socket. Connect the positive wire, then the ground, and bridge the relay. Restore power. If you are reading this, perhaps there is still hope. — R.”*

She opens the drawer — **Ratchet's battery** — and the repair board opens: seat the
battery, the amber positive wire, the blue ground, the bridge across the relay, then
**Restore power** (no timer; a wrong socket can always be retried; leaving keeps the
placements). He wakes: *Ratchet is awake.* He gives her the **Repair Kit** and — kept
separately — a spare Power Cell for Servo. If the memory film is on disk it plays here.
Then the pod and the pack (the cradle lesson, then *And when you have scrap, come to my
counter. I keep a volt pack…*), and straight into his story and the errand:
> *Mother’s song kept the kingdoms at peace. An unknown intruder infected its frequency. Our neighbours turned on one another.*
> *This marble came to me through my family. It slowed the virus, but it was not enough to stop it.*
> *I removed my own battery before the infection took me. You were asleep for recharging, long before this happened. That is how you missed the broadcast.*
> *There is a large deposit of raw marble in the caves beneath the meadow. Bring a piece back to my workshop.*
> *I can forge it into a glowing white sword that neutralizes the virus. The sages and our neighbours can become our friends again.*
> *I left a spare cell for Servo in your pouch. His gantries overlook the meadow; the marble lies below.*
> *Bring me: raw cave marble*
> *The way down is in the meadow hub, at its west end by the climb: a loose floor. Jump onto it and strike straight down — it gives, and the caves are under it.*

The last line is **who points her down** (`q_where_ratchet_forge`): it is said with the
ask and again every time she talks to him while still looking.
**Story.** The founding of the plot in one room. He nearly fell; the inherited marble
slowed the song long enough for him to choose; he switched himself off. She was asleep,
not immune. There is one Ratchet and one revival — the old second, dark Ratchet at the
camp is gone (§2.15).
**Panels.** The letter at the empty socket; the drawer; the battery seated, the wires,
the bridge; his eyes coming up; the marble on its cord; the pod in the wall.

### 2.5 The volt pack — A0B (the shop, the pack, the two verbs)

**Where.** Ratchet's counter, same room.
**What happens.** She talks to him again and the counter opens: **Ratchet's
Emporium**. The first line on the list is the only thing she can afford: **Volt Cell**,
12 scrap — *Refills your volts. The first one wires the Repair Protocol and the Volt
Burst into you.* She buys it. The card:
> **Volt Pack** — *Ratchet's charger, wired into you. The shards you knock out of machines are VOLTS now — hold HEAL to spend them mending a core, hold ATTACK to spend them on a Volt Burst.*

Then, on the same floor, the two lessons the pack bought:
- **Repair** — *hold it — volts become a core.* (The wreck she just made discharges
  once — one core, scripted, in the only room where nothing can hurt her — so there
  is something to mend.)
- **Volt Burst** — *hold ATTACK until she crackles, then let go.* The air around her
  ionises, current runs her chassis foot to ear, and the claws go off in a ring.

Then: **Solve the puzzle** — *Use the marked node and solve its puzzle* (the Mind
Node on the waking floor, her first IQ); **Buy a skill** — *Open Skills and buy your
first skill*; **Go on** — *the way out is right.*

**Story — this is the owner's rule and it must be drawn this way.** She wakes with no
way to spend what she knocks out of other machines. The ring fills and sits there.
Ratchet's pack is the mean: one purchase, two verbs. From this panel on she can mend
herself and she can burst — and the burst is what the pillar in the cave needs.
Before this panel, holding the claw is just holding the claw.
**Panels.** The counter; the pack going into her back; the first surge — jagged
cyan-white arcs running up and down her body, the air around her hazed, sparks thrown
off the frame, no rings; the claws releasing.

### 2.6 The meadow — A1 (Old Servo, the first fight)

**Where.** The Scrap Meadows proper; a winding house with an old unit turned into
its drum.
**What happens.** Old Servo is dark. She has one spare cell — the one Ratchet handed
her for him — and this is the first "who do I wake" decision: Servo now, or keep the cell.
Woken, he gives a Repair Kit and speaks:
> *Mrrow… a working unit! I haven't seen one since Mother's song went wrong.*
> *Move with ← →, leap with Z, and swipe those claws with X.* — the controls are the
> player's OWN: on a controller he names the buttons she bound, on a phone the
> on-screen glyphs (`{JUMP}` / `{ATK}` / `{HEAL}` filled by `ctlFill`).
> *Claw the corrupted to harvest volts. Once Ratchet has wired a pack into you, stand still and hold F, and your frame will mend a core.*
> *The virus corrupts every machine it touches. Purge it, little paw — or rust with the rest of us.*
> *See the winding house behind me? I raised every gantry over this meadow off that drum, cable by cable. The drum still turns. My climbing days are what rusted.*

Then the first real fight: a crawler, and a guard hidden past a rise.
**Story.** The Depths are not empty. Every machine person was switched off the night
the Song went out — that is why they are still themselves, and why they are standing
dark: nobody has charged them since. Cells are the rarest thing in the world. There is
never a spare one.
Once, after his greeting, his own escape: *My receiver was unplugged inside the shielded
lift housing when the song changed. / I spent the last charge holding the bridge for
the workers… / Ratchet sent a spare? Tell him the last passenger got home.*
**Panels.** The winding house; Servo half-drum; the first guard rising over the crest.

### 2.7 The hub and the corridor — A2 (NULLFANG's first meeting)

**Where.** The widest room in the kingdom; the east third is a vista.
**What happens.** On the crest, with no warning, the guardian of the Meadows drops
out of the sky east of her. The music stops. The controls go. It walks up. The paw
rises and is held a hair too long. One swipe — hit-stop, white flash — one core
taken, never her last. It stands and looks at where she landed. It gets bored of her.
It bounds east. Not one word is spoken. Afterwards — before the blade exists — Ratchet:
*It threw you once — I saw the dent in the corridor. Not with claws. Bring me the
marble first.* (He only says *Go and put one in it* once the sage is free and the bell
silent, §2.15.)
**Story.** She is nothing to it. That is the whole scene. The comic's first big
splash: the lion, red-eyed, standing over a cat it did not bother to finish.
**Panels.** Seven beats exactly as listed: fall, land, wind, swipe, watch, coil, leave.

### 2.8 Under the meadow — A5 (the buried mouth)

**Where.** Below the hub through a brittle floor. A terminal, a Mind Node, a crest
chest (Magnet Core), and a pile of fallen rock in the wall.
**What happens.** *Something is calling from behind the fallen rock. STRIKE it.* →
*The pile shifts. The sound behind it comes closer.* → *The rock gives way — the
tunnel is open, and it is breathing.* The terminal: *MAINTENANCE LOG 0x2F: sub-hatch
sealed after an anomalous signal. If found — do not answer it.*
**Story.** The sound she has been hearing since the meadow has a source, and it is
under the rock.

### 2.9 The crystal cave — CV1, CV1B, CV2, CV3 (the beacon and the pillar)

**Where.** A carved cavity with light from the mouth behind her (CV1); the Seam, a
side tunnel with a bench (CV1B, behind more rubble); the long dark middle (CV2); the
end of the dark (CV3).
**What happens.** In CV2 she reaches THE BEACON: *THE SOUND HAD A SOURCE. It has been
calling into the rock for a long time, and nothing was ever listening.* Its log is the
Deaf System's:
> *LOG // THE DEAF SYSTEM*
> *When the song came, the broken were the lucky ones. Cracked receivers, stripped antennae, factory rejects — every unit whose ears were dead heard NOTHING. And nothing is what saved them.*
> *They went under. Into the rock, where the signal dies. They rebuilt down here — a system of the deaf, wired by touch and light. No radio. No song.*
> *The caves do not connect to each other. That is not a flaw. A tunnel the song cannot walk is a tunnel worth keeping short.*

In CV3, two crawlers and then THE MARBLE — a rounded raw nodule in its host rock, never a
pointed crystal. Plain claws: *Claws glance off the raw marble. Hold ATTACK to supercharge,
then release beside it.* The burst frees it (the pack is what makes the burst — §2.5).
> **Raw marble** — *A rounded nodule freed from the host rock. Bring the material to Ratchet; it is not yet a blade.*

Carrying the shard switches on her **aura sense**: she glows white; hostiles read
purple; guardians red; woken and purified machines blue; an infected sage wears a
black halo with an ember rim.
**Story.** A second people lived down here — the deaf, who could not hear the Song and
so survived it — and they quarried this seam. The stone Ratchet wears came from here.
The burst the pack gave her is the only thing that cracks it.
**Panels.** The mouth breathing; the beacon; the pillar, white, taller than her; the
storm on her chassis; the shard falling; her aura coming on in the dark.

### 2.10 The forging — A0B (and Ratchet moves to the camp)

**Where.** Back at Ratchet's workshop — where his errand told her to bring it.
**What happens.**
> *You brought the marble. Steady the clamp. I will shape the edge, then fit the grip. Cut what is holding them—not what is left of them.*
> *When the blade is done I'm taking my tools to the camp by the lion's enclosure. That is where this ends. Find me there.*

The forging film plays (*The Forging*). The card:
> **THE PURIFIER** — *Ratchet forged this glowing white sword from the cave marble. It neutralizes the virus and frees infected robots. Its handle can later connect to another weapon.*

He offers the optional Alpha errand (§2.14). From now on he stands at the camp (A3), not
in the den — the same machine, awake on the same battery. His standing line there:
*The maintenance passage beside the marble quarry leads to the first Sage. Clear their
binding before you face the guardian.*
**Story.** The first sword is shaped, not found. The blade is now the only thing that
can free anything: sages, the Alpha and every guardian refuse claws (§2.16).

### 2.11 The wings of the meadow — A6, A13, A7 (optional)

- **The Gantries (A6).** Servo's shaken-loose coil is up here. *A coil shook loose in
  the gantries above us. I cannot climb any more.* → *That is the one. Take this — I
  have no use for it and you will.*
- **The Deaf System's pocket (A13).** Through a brittle plug: a terminal with their
  log, a coin's worth of their salvage, nothing that hunts.
- **The Shaft (A7).** Straight down in the dark, for the errand nobody takes. After the
  forge, Ratchet: *There is a shaft under the meadow nobody has stood in since the
  fall. See it for me.* → *You stood in it. Nobody has, in a long time. Here.*

### 2.12 The maintenance door and the first sage — GA1T, GA1D (the blade's first work)

**Where.** Not behind the lair. **Beside the quarry.** The moment she carries the
forged blade, a maintenance door opens in the wall of CV3, one room from the pillar she
cut it out of — a tunnel with a terminal and a bat, and past it a deep chamber where a
sage kneels. It needs the blade and nothing else: the guardian's reward is never a
prerequisite for the thing that makes the guardian winnable.
**What happens.** The tunnel's log is the sage's own prologue:
> *One of the wise ones counted our dead from the meadow above. We carried it under when the counting stopped making sense — but its ears were too good, and the song found it even in the rock.*
> *We could not silence it and we would not end it. We sealed it in the deep chamber. It kneels there still, counting the other way.*
> *If you carry clean light, go in to it. It kept one cell charged through everything. It always said somebody would come.*

In the chamber: *The sage kneels — the song holds its body together. Broken, but not
CLEAN.* Claws do nothing: *Claws cannot cleanse the song. The PURIFIER can.* Four cuts
of the white blade and the halo goes from black to blue:
> **A SAGE, PURIFIED** — *The song lets go. The sage remembers everything — and gives what it kept for whoever would come with clean light.*
> **THE MEADOW SAGE** — *It counted every machine that fell in the scrap fields — and kept one power cell safe for whoever came with clean light.* (+1 Power Cell)

**And then it tells her why she keeps losing.** The revelation is the kingdom's hinge
and it fires the moment she stands up in that chamber:
> *I called for the ones who had not answered. The order made me call louder.*
> *Every answer told it where another survivor was hiding.*
> *NULLFANG is still resisting. But CHIME writes the command back whenever he breaks it.*
> *Take the climb above the meadow. Silence that bell, then return to his enclosure. I will keep this end quiet.*

**What it says is what is true when she stands up** (`sageRevealLines`). The climb is
open from the hub, so a player can silence the bell first; the sage then says instead:
*NULLFANG is still resisting — and the bell that wrote the command back into him is
already silent. You did that.* / *Go to his enclosure past the camp. With the bell
quiet, the binding will not come back. I will keep this end quiet.* (An old save that
freed the lion first hears *NULLFANG is free…* with or without the bell.)

**And the promise is kept as it is made.** Whatever is still hunting her in the
chamber stands down at the moment the halo turns — cyan sensors, no more contact —
and the whole of that sage's network stays quiet from then on: the tunnel she walked
in through is not the tunnel she walks back out of. One sage closes one end; the next
cave and the meadow above are exactly as they were. (Comic p26.)

Ratchet, after (at the camp now): *Word crawls up even from the deaf places: a sage knelt down there
and STOOD UP clean. My forge did that. You did that. Prices still stand, mind.*
**Story.** The sword's first work is a rescue, not a kill — and the rescue is what
hands her the plan. The sage is not a trophy behind a boss; it is the informant that
makes the boss beatable. It also names the enemy properly for the first time: NULLFANG
is fighting the order, and something else keeps rewriting it into him.
**Panels.** The door in the quarry wall; the tunnel log; the black halo; four cuts;
the halo turning blue; the sage's hand pointing up at the climb.

### 2.13 The Chime — A8, A9, A11 (the Eye's first construct)

**Where.** The climb above the hub, and an arena at the top. She goes because the sage
sent her, not because the map ran out of rooms — though the climb is open from the
start, and a player who rings it first is told so by the sage (§2.12).
**What happens.** *CHIME — it is singing at you.* It hovers, rings, sings a note,
falls. It is destroyed, not tamed: *Destroyed. There was nobody in it.* It leaves the
Power Cell it was built around. Behind its wall: a secret coin and the scrap its
congregation never spent.
**Story.** A guardian is a machine that was infected. This was not. It was MADE by the
source of the Song — the Eye — and there is nothing under the virus to give back. The
Eye does not build monsters; it builds instruments. Five of them, one per kingdom.
And this one is a repeater: while it rings, NULLFANG's binding is rewritten as fast as
he breaks it. Silence is the first thing she ever takes away from the Eye.

### 2.14 The Alpha's den — A10

**Where.** On the road, not off it: the first fight you can lose. Hulk middens at both
ends of a clean floor.
**What happens.** *THE ALPHA — the pack answers to this.* Three hundred points of wolf.
There is no fork here; taming is the only ending. *THE PACK IS YOURS — It yielded.
Every wolf in the machine world knows it now — they will not raise a tooth to you
again.* A Power Cell, sixty scrap, and every wolf in every room turns friendly. A cave
mouth opens in the den: the Pack Sage's grotto (*It ran with the wolves before the
song. It gives what a pack values: mending, and something for the road.*)
**Story.** The first thing she wins is not a kill. The pack was never the Song's; it
was a pack, and it answers to whoever stands.

### 2.15 The camp — A3, A12

**Where.** The meadow's breath before the lair: a bench, and — once he has forged her
blade and moved — Ratchet at his second counter. Before the forge the camp has no
trader: he is still in his den, dark or awake. Under the camp, through a brittle cellar
floor, a vault of spikes that needs the dash (a Star Fragment at the end). Above the
camp, the climb to the Data Conduits — the Meadows' only way out, its hatch jammed
until NULLFANG is free: *The conduit hatch above the camp is jammed by NULLFANG's
binding. Free the lion before you climb.*
**And once, in the window between the sage and the bell, he comes out on his own.**
It happens where the sage sends her: in the hub, at the foot of the climb above the
meadow (A2, west end) — *NULLFANG comes along the road from his enclosure and stops.
The purple goes out of him. He is looking at you, and nothing is driving it.* — or, for
a player who walks east instead, at the camp's east end by the lair (*NULLFANG walks out
of the enclosure and stops…*). He stops well outside his own reach and the purple goes
out of him — the same authored veins running clean that the purifier will one day make
permanent. Then *a bell answers from above the meadow. The order is written back into
him, and he turns away.* He does not speak; he never has. Nothing is taken from her and
nothing holds her controls. It happens once, and only after the corridor meeting.
**Why it is here.** This is the sage's sentence happening in front of her instead of
being quoted at her: he is resisting, and something else keeps winning. It is also why the
climb above the meadow stops being an errand. (Comic p29; `flags.nfBreak`.)

**Story.** Ratchet's standing lines follow the story's order (`ratchetStandingKey`):
the blade (*The maintenance passage beside the marble quarry leads to the first
Sage…*) → the sage (*Word crawls up even from the deaf places…*) → the sage AND the bell:
*It threw you once. The corridor still has the dent. Go and put one in it.* → the lion
free: *The lion is quiet, and the hatch over my camp unjammed with him. That climb goes
up into the Data Conduits. Go on — I'll keep the stall open.* Between milestones, the
war's tiers: *Cat-frame. Cute. Don't touch the stock with those claws.* → *Heard the
Meadows went quiet…* → *Take what you need…* And once, after her first death: *You came
back. Your husk was still warm when I passed it.*

### 2.16 NULLFANG — A4 (the first guardian, freed, and the cave that closes the loop)

**Where.** The end of the kingdom — and the last thing she does in it. The lair refuses
her until the story is ready, saying what is missing at the door, in order: *Bring raw
marble from the cave beneath the meadow to Ratchet. You need his cleansing blade.* →
*The Sage knows the binding. Take the maintenance door beside the marble quarry and
free them first.* → *CHIME keeps restoring the order. Take the climb above the meadow
and silence the bell before returning to NULLFANG.*
**What happens.** *NULLFANG, THE VIRUS BEAST.* *It remembers the corridor.* Two
phases — at half health it stalks faster, crouches shorter, chains its leaps. It is
the one guardian that can be dazed: *⚡ NULLFANG is reeling — hit it NOW.* When it is
down it kneels, still looking at her — and the blade frees it. **There is no kill
choice in the shipped game** (`TAME_ONLY`, js/braid.js: the fork machinery records a
mercy on the spot) and **no freeing without the blade**: a guardian brought down by
claws alone is held together by the song at a sliver of health — *Claws cannot cleanse
the song. The PURIFIER can.* — and nothing is written to the Braid until the blade does
it.
- → the purification film → *The virus is destroyed — NULLFANG is free. He seems to like
  you.* → **NULLFANG'S OATH** — *Once each room, the blow that would break you is
  answered instead — it comes out of the dark and roars them off you.*

Then **FireDash**, a Power Cell, the **SCRAPPLATE** suit (Shard Volley), the fang
relic. *The ground shifted — a CAVE MOUTH has opened in the lair.* And **who points her
on**: *Above the camp, the conduit hatch unjams. The climb to the Data Conduits is
open.* — then Ratchet at the camp says it again (§2.15).

**And the cave behind the lair is a room she has already been in the far end of.** The
grotto GA1 — scrap, a pocket, a bench — opens onto the same tunnel the maintenance door
let her into from the quarry (GA1T). The kingdom's map closes on itself: the way she
sneaked in to free the sage becomes the front door once the guardian is no longer
standing in it.
**Story.** The first kingdom is restored, the sword works, and the road on is open.
(The FINISH branch — *RESOLVE* — still exists in code for a future mode and is not
drawn for the book.)

### 2.17 End of the free chapter

Leaving the camp for the Conduits — possible only once NULLFANG is free and the blade
forged — in the free build: *END OF THE FREE CHAPTER — The Scrap Meadows are behind
her. The Data Conduits are not. — Four kingdoms, four more guardians and Mother's
hijacked song are waiting in the full game.*

---

## 3. CHAPTER TWO — THE DATA CONDUITS

### 3.1 The Breaker's tower — B1, B6
**What happens.** The surge charges as she climbs its tower and the floor is briefly
not hers. Above: THE RELAY GALLERY, a climb up cable risers to a relay that stopped
answering — the Oracle's errand (*Bring me: the dead relay*).

### 3.2 The hall — B2, B7, B8
**What happens.** The hall, with a live rail she cannot stand on yet (the Grounding
Crest lets her, and cutting it from above drops her into the Grounded Vault, §3.5).
Up the conveyors: *CARRIER — it never finished its route.* Destroyed; a Power Cell.

### 3.3 The Oracle — B3, B3B
**Where.** A corridor with a bench, a terminal, the Cognition Trials, and a parlor door.
Terminal: *ARCHIVE FRAGMENT, day 1042: the virus does not destroy. It repurposes. That
is worse.*
**Mono (dark until a cell):**
> *I archived the whole network, once. Now I archive its ruins.*
> *The order comes up from beneath the Archives in Mother's voice. The voice is hers. The command is not.*
> *Cracked walls hide old maintenance shafts. Strike them. The Depths reward the curious.*

Standing: *Query: purpose. A single maintenance unit against a network is not a plan.*
→ *Correction logged. One unit is not a plan. It is, apparently, a method.* → *I have
rewritten your entry three times. I am going to stop rewriting it now.*
**Story.** The first time anyone says where the order comes from — and that the voice
is Mother's while the command is someone else's.

### 3.4 TALONHOST — B4
*TALONHOST, THE IRON EAGLE.* It hangs above, spawns and slams. The fork: TAME → *The
virus is destroyed — TALONHOST is free. She perches, watching over you.* Drops: **Twin
Thrusters**, a Power Cell, the **COOLANT** suit (Pressure Jet), the silk relic. Cave
mouth → the Canal Sage: *It archived the data canals inside its own head. Its gift
cannot be carried in a bag — it teaches.* (+25 IQ)

### 3.5 THE CRYSTAL CACHE — B5, V1, V1B, V2, X1 (the second sword)

**Where.** Past the eagle: a vault door that wants three sigils (B5 → V1) — and B5's
east side, which leads to the same place, is sealed with it (*This passage belongs to
the sealed vault. Three sigils open it.*); a breakable ceiling up to X1; and the live
rail from above (V2). Sigil I comes from the Prowler, II from every Mind Node, III from
a ledge nobody climbs (*Hidden on a ledge where nobody climbs. The last seal of the old
vault.*). So Kerf is met late — after the Prowler.
**The Prism Prowler, X1.** The rival robo-cat — never indexed, never infected, red on
the outside and clear blue underneath. When it is down: *The Prowler stands down. There
was never a virus in it — only a guard keeping its word.* Behind it, with the PURIFIER
in hand, the second blade: **Second Purifier Sword** — *A second blade, still separate.
Dual swords are equipped. Hold attack to charge, then release for a hurricane swirl.*
Held attack is now the **hurricane**. The Crystal Sage: *It harvested this seam before
the song. It knows exactly what your marble blade is worth — and pays tribute to it.*
**Kerf, V1B — awake, the only unit that never went dark:**
> *Do not shout. My receivers were stamped dead at the factory and I have never heard a sound — which is the only reason I am still myself.*
> *Kerf. The Deaf System has quarried this seam for generations. Long before me, one of our harvesters gave a marble to a workshop keeper above. Your trader still wears it.*
> *The second edge in the cache above is mine. I shaped it from this seam, the way his line shaped yours. It was never half of anything. It is its own blade.*
> *The white cat up there keeps it for me. There was never a song in that one — it was guarding, not infected. If it let you pass, it decided you were asking, not taking.*
> *Two blades stay two. Joining them is a different piece of work.*

Standing (read off the floor): *I felt you three rooms out. Even step, light weight,
no hurry. Nothing the Song drives walks evenly.*
**Story.** Two separate swords, each shaped from the same seam; neither is half of an
older blade. The Prowler is a boundary, not a disease. (See §8.2 for what is still
missing from the canon version of this chapter.)

---

## 4. CHAPTER THREE — THE FOUNDRY

### 4.1 The tower and the pour gallery — C1, C5, C5B
Down the shaft (the Kiln's room; Grip Magnets on the wall). THE POUR GALLERY: two of
the four guns Patch-7 wants quiet. His forge is behind the quench hood — zone C's only
rest.
**Patch-7:**
> *Patch-unit 7. I fix what the virus breaks — which is everything, twice a day.*
> *The Foundry floor eats boots. Mind the molten seams.*
> *The walls hum near the old vault. Cracked plating sings, you know. Strike it and listen.*

Errand: *The gun emplacements never stood down. Quiet them and I can work.* → *Listen
to that. Nothing. Thank you.*

**Vault Sigil III** lies on a ledge in the tower (C1) — the last of the vault's three
seals and the only one no fight or puzzle hands over. The vault in B5, refused without
it, says so: *The third seal was carried down into the Foundry tower.*

### 4.2 The hall and the Kiln-Moth — C2, C6, C7
The main hall (a breakable floor down to the Archives). Up: *KILN-MOTH — it came for
the heat.* Destroyed; a Power Cell.

### 4.3 FURNACE CHOIR — C3
The corrupted mecha dragon on its high roost: a forge roar, orbs, a meltdown; when it
falls it breaks into parts — wings first, then head, then body. TAME → *The virus is
destroyed — FURNACE CHOIR is free. The furnace burns warm now.* Drops: **EMP Pulse**,
a Power Cell, the **FORGE** suit (Slag Burst), the ember relic. The Foundry Sage: *It
poured the city's bones. Its gift is weight: scrap enough to feel in the paws.*

### 4.4 The connector — C4 (the joined blade)
Behind the dragon's secret wall, with both swords and the Foundry guardian down: the
**connector**. The two handles join. Held attack is now the **returning throw** — it
cuts outward and on its return. Skill: **The Returning Blade**.
**Story.** *Its handle was made to CONNECT to something* (§2.10) pays off here.

---

## 5. CHAPTER FOUR — THE FROZEN ARCHIVES

### 5.1 The door and the carrel — D1, D1B
Ice underfoot everywhere but one room. Terminal: *COLD STORAGE NOTE: the Prowler stole
the ninth prototype crest and fled toward the crystal seams.*
**The Nine-Lives Sage**, in the one floor the frost never reached:
> *Nine lives the old fabricators gave us. I am on my ninth.*
> *Beyond the ice sleeps GLACIERE, the Archives' sentinel. It guards the Kernel Key.*
> *Spend your lives well, kitten. The ninth is the one that matters.*

Standing: *You have nine lives and no scars. That is a child's arithmetic.* → *You
came back. That is the only part of this anybody ever remembers.* → *I am on my ninth.
You are on your first, and you are further down than I ever went.* Errand: the frozen
index, from the Cold Stacks.

### 5.2 The Rime, the Stacks, the Lattice — D2, D4, D5, D6
The Rime teaches GLACIERE's absolute-zero read early. THE COLD STACKS: the sage's
climb, the index at the top. Down: *LATTICE — it is still growing.* Destroyed; a cell.

### 5.3 GLACIERE — D3
*GLACIERE, THE FROZEN SENTINEL* — the corrupted unicorn of the void: a void lance, ice
shards, nova crystals, void orbs; it shatters into parts. TAME → *The virus is
destroyed — GLACIERE is free. She glides at your side.* Drops: the **Kernel Key** — *The
seal below the Archives is broken* — a Power Cell, the **HALT** suit (Frost Lattice),
the shard relic. The floor to the Nest opens. The Archive Sage: *It read everything,
twice. It pays in what the Archives hoard: knowledge, and the metal to bind it.*

---

## 6. CHAPTER FIVE — THE VIRUS NEST

### 6.1 The Snare and the Hollow — E1, E1B, E4
The Nest does not strike you; it draws you in. **Lumen**, in the one pocket her glow
keeps clean:
> *You are bright. The Nest does not like bright things.*
> *Mother sings from below. Please do not listen too long.*
> *When I am scared I glow harder. I am always glowing.*

Standing: *You are small. The Nest eats small things first.* → *You are still bright.
I thought it would have gone out by now.* → *When you walk past, I glow less. I think
that means I am not afraid.* Errand: *A lens from the old beacon. Without it I cannot
see what I am mending.* (THE HATCHERY, E4) → *Light again. Small thing. Not to me.*

### 6.2 The hall and the Lens — E2, E5, E6
The Nest's hall, its bench. Down: *THE LENS — the Eye is looking back.* The last of the
five constructs. Destroyed; a cell.

### 6.3 MOTHER-V — E3
*MOTHER-V, THE HIJACKED SONG.* No fork — she is never asked, because she is never an
enemy to end: when the last band breaks, *The command burns out of MOTHER-V. Her song
stops — and she is still there.* Four phase bands; each shift
shatters two more plates, the core burns brighter, and one crueller trick unlocks.
Her moves, all warned on screen:
- **NULL WAVE** — the tell is silence: the halo freezes and the core runs black. A black
  ring with a red edge. Jump it.
- **MOTHER'S SONG** — the original broadcast, red where hers is cyan. *MOTHER'S SONG —
  your inputs are mirrored!*
- **DATA CORRUPTION** — *DATA CORRUPTION — your HUD is lying!*
- **TOTAL NULL** — once, near the end: every light dies. *TOTAL NULL — sing to reveal
  her!* Attacks come out of the dark with only sound for a tell; the Song buys three
  seconds of sight. When the lights return she hangs exposed, every plate open.
  Finish it.

**Story.** She is the singer, not the author. The virus made her Song a command; the
cat cuts the command out of it, and Mother lives. The comic should draw her as light that
grew mass, never as a villain with a face.

---

## 7. THE ENDING — A REEL, NOT A FILM

*SYSTEM PURGED. MOTHER-V is free. Her song is silent, and it is her own again. — What
remains is the Eye that stole her voice — exposed now, with nothing left to sing
through. Thank you for playing CLAWBYTE.*

That second line is deliberately all the ending says about the Eye: the game has no
Eye encounter yet (§8.1), so it tells the truth — he is exposed, not beaten.

The ending is cut from what the player answered. An opener and a closer always play;
between them, one short vignette per guardian, **only if that guardian is still
alive**. Order: Mother switching off (her switching off is what turns the lights back
on across the world), the sunrise, the machine folk, then NULLFANG, TALONHOST,
GLACIERE, FURNACE CHOIR, the Prowler — each present only if freed — then the last
frame. In the shipped game every guardian is freed, because freeing is the only answer
the fork gives (§2.16).

**For the comic:** draw the reel with every guardian alive. That is the book's ending.

---

## 8. OPEN QUESTIONS FOR THE OWNER (game and canon disagree here)

These are not fixed by this document. Each needs a ruling, and the game will follow it.

1. **The evil robot is never met — STILL MISSING (2026-10-08).** Canon (Draft 2,
   `story-draft2/CLAWBYTE-00-story-foundation.md`) has Mother cleansed and then the Eye
   confronted and defeated. The game now does the first half — MOTHER-V is cleansed and
   lives, and nothing calls her the Null Core — and ends truthfully on the Eye *exposed*,
   because there is no Eye room, art or fight. Building that encounter (art through
   Higgsfield, a room, a fight) is the remaining work. He exists in the film (*Until an evil robot
   hijacked her Song*), in Ratchet's fragments (*The command was his, not hers*) and in
   the forge errand — and nowhere else. The final fight is against MOTHER-V, the
   hijacked singer. Nothing in the game confronts, names or defeats him. The game also
   uses a second name for the same shadow: **the Eye**, which built the five constructs
   and is named on items (*It hums against the Eye's static*). Proposal: the Eye IS
   the evil robot — his instrument, his name in the Depths — and the Lens (*the Eye is
   looking back*) is the first time he looks at her. His own fight is chapter six,
   not yet built.
2. **Who made the swords — RESOLVED IN TEXT, one event still missing.** Kerf no longer
   says she split a purifier; Ratchet shapes the first blade from cave marble, and Kerf
   says she shaped the second from the same seam. Canon wants the second shaping to be
   PLAYED (harvest a raw nodule, Kerf shapes it at her bench); the game still grants the
   second sword as a pickup behind the Prowler, so Kerf speaks of it as already made.
   Old note: **Who made the first sword.** Ratchet forges the PURIFIER from the pillar shard
   (played). Kerf says she split a whole purifier and laid one end *where a clever
   machine would find it and forge it* (spoken). Compatible if the pillar is her laid
   end; no line says so yet. Proposal: one line in Ratchet's forging speech.
3. **The Null Core — RESOLVED.** Servo now says *since Mother's song went wrong*; the
   boss bar reads *MOTHER-V, THE HIJACKED SONG*; the ending frees her. Old note:
   **The Null Core.** Canon says the Null Core is infrastructure, not the broadcaster.
   The game still has Old Servo say *since the Null Core began broadcasting*, calls
   MOTHER-V *the Null Core*, and ends on *The Null Core dissolves*. Proposal: keep the
   name as MOTHER-V's housing and change Servo's line to *since the Song went wrong*.
4. **Sages after guardians — SETTLED, 2026-09-30, by what is built.** The old
   disagreement was that every sage knelt behind its guardian's lair, so the Meadow
   Sage could only be reached after NULLFANG fell. That is no longer what the game
   does. A maintenance door opens in the quarry wall (CV3 ⟷ GA1T) the moment she
   carries the forged blade — `gateDoorsAll` gates it on `crystal` alone, and the
   guardian's own reward is never a prerequisite. The route is therefore
   **blade → Sage → CHIME → NULLFANG**, and `openingGateHint('A4')` says so in three
   lines, in that order, at the lair's door. The sage is the informant who makes the
   guardian winnable, not a trophy for having beaten it; the guardian's fall opens the
   grotto at the *other* end of the same tunnel, closing the loop (§2.12, §2.16).
   The comic set in `assets/manhua/revised-2026-09/` already draws this order; the
   superseded `assets/manhua/ch1/` set does not, and is not what ships.
5. **Freeing the infected.** Canon: the mission includes freeing infected robots. In
   play, only guardians (TAME) and sages (the purifier) are freed; every other machine
   is broken for scrap. If rank-and-file machines are to be freed, that is a mechanic
   that does not exist yet.
6. ~~**Vault Sigil III is placed twice**~~ — **resolved (owner, 2026-10-08): it stays in
   C1, the Foundry tower.** A7's copy is gone (the shaft keeps a scrap cache for the
   errand), the card names the Foundry tower again, and the locked vault tells a player
   missing it where it lies (`vault_where3`).
7. **Two captions are written and never shown** in the film: *Every unit woke to it,
   worked to it, slept to it.* and *While she slept, the world changed. She had escaped
   the infection.* The comic may use them; the game does not.

---

## 9. THE SYSTEMS THE COMIC MUST NOT CONTRADICT

- **Cores** are her life: five cat faces at the top left. A hit takes one. The Repair
  Protocol mends one for 33 volts (28 with the Coolant Vial).
- **Volts ⚡** are the ring at the top left. Landing hits fills it (4 per hit, 11 per hit
  inside a burst). Nothing can be spent from it until the volt pack (§2.5). A bench
  refills it; a bought Volt Cell fills it. Cap 99 (110 with the Lost Collar).
- **The Volt Burst** costs 25 volts and is a full-circle claw burst; with two swords it
  is the hurricane; joined, it is the returning throw. It is the only thing that
  quarries pure crystal.
- **Scrap** is money. Only the shop takes it.
- **IQ ◈** is bought with thought — Mind Nodes, the Cognition Trials, errands — and
  spent on the Neural Tree.
- **Power Cells** wake machines. She starts with none: Ratchet's own battery is in his
  drawer, and waking him earns the spare he keeps for Servo;
  every guardian and every construct is built around one; two sages keep one. The
  supply is exactly the demand. *Wakes one machine. There are never spare ones.*
- **Crests** are ceramic seals over the chest port: *Before the song, every unit left
  the Foundry wearing a CREST … Nobody asked what a unit could do. They read its chest.*
  She left the Foundry with that port empty.
- **Death** is *CONNECTION LOST*. Her husk stands where she fell and keeps what she was
  carrying; she wakes at the last bench. In Nine Lives, the ninth death erases the save.
- **Errands start when they are given.** A cull counts kills made after it was accepted;
  a place counts once she stands in it after being asked; an errand's object is in the
  world only while somebody is waiting for it.
- **The Braid.** Every kill and every rest is answered three ways — MERCY (*Cure it. The
  ground remembers.*), SEVER (*End it. Take what is left.*), THE SIGNAL (*Take its gift.
  Something is owed.*) — and *what you do FIRST echoes loudest*. Each answered fork
  drips one more of Ratchet's five story fragments:
  1. *Mother’s song kept the robots of every kingdom in harmony. Someone unknown hacked its frequency and hid a virus inside it.*
  2. *The infected song turned our neighbours against each other. You were already asleep for recharging. You missed that broadcast; you were not made immune to it.*
  3. *The guardians went last, you know. They were made to protect us, so the song had to shout them down — and it took every one of them before anyone stopped fighting it.*
  4. *The marble in my necklace was an old gift to my ancestor. It slowed the virus long enough for me to think. It could not stop the infection.*
  5. *Everyone around me was infected. Before I lost myself, I removed my own battery and left that letter. You brought me back.*

---

*Sources: `js/world.js` (every room), `js/i18n.js` (every line), `js/quests.js`,
`js/weapons.js`, `js/game.js` (`NPC_GIFT`, `forgeCrystal`, `meetStep`, `TUT_STEPS`,
`INTRO_FILM`, `END_ORDER`), `js/entities.js` (`releaseCharged`, `BSTAT`, `MINIS`,
`SAGE_GIFT`, the MOTHER-V fight), `js/braid.js`. Measured, not remembered.*
