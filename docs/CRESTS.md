# CRESTS — what they are, why they exist, and the story under them

The owner, 2026-09-05: *"I have no idea what's the point of crest so far.
Nobody does. So why was it created? How would it work? And what is the
background story of it? If you don't have one yet, create it creatively."*

There was a system and no story. This is the story, and the game now tells it
(`crest_lore`, `crest_none`, `crest_port`, `crest_first`, `crest_first2` in
`js/i18n.js`; the first seal she takes says it once in its own card).

## The mechanic, in one paragraph

A crest is a socketed passive: seat it and it changes what her body does
(Sharpened Claws +25 % claw damage, Thick Plating +1 core, Magnet Core pulls
scrap, Phantom Coil makes the dash untouchable, Ninth Life revives once per
rest…). Each crest costs a number of **sockets** (`CRESTS` in `js/game.js`,
1–3) and she has a socket budget (`G.save.slots`, +1 from the Sharp Mind
skill). Crests come from chests and from Ratchet's shop; more sockets come
from the shop (Crest Socket, 400) and the tree. Equip and unequip from
Pause ▸ Crests. It is the Hollow Knight charm pattern, and it was shipped as
nouns — "Crests", "Sockets" — with nothing that said what a crest *was*.

## The story

**Before the song, every unit that left the Foundry wore a CREST**: a ceramic
seal fused over its chest port, stamped with the one thing it was rated to do,
and carrying the firmware for that rating. Plating for the wall-walkers. Sprint
for the couriers. Magnet for the salvage crews. The seal was not decoration:
the port under it was where the Foundry poured the rating in, and the seal
held it there. A unit *was* its crest. Nobody asked what you could do; they
read your chest.

**HZD-99 left the Foundry with an empty port.** No rating, no seal — a
maintenance frame, the kind nothing is stamped on because nothing is expected
of it. That is why the machine folk look at her chest before her face, and why
they say what they say to her (the standing lines, `sl_*_0`). It is the
underdog arc's first sentence made physical: the world reads her port and
finds it blank.

**When the song took the city it took the units, not the seals.** The seals
are still out there — on the wrecks, in cold storage, in the drawers of the
one trader who strips them from what the song left. Pry one loose, seat it in
her port, and her chassis runs a dead unit's rating as if it had always been
hers. That is a crest: **a dead unit's certified purpose, worn by the unit
nobody certified.**

**The sockets are the port's width.** A seal takes a set width of port (its
socket cost). The port can be widened at the trader's bench (Crest Socket) or
by a sharper mind (the Sharp Mind skill) — a unit that thinks more can carry
more of what others were.

**The Ninth Life** (`nine`, 3 sockets) was the Foundry's last prototype: the
one crest that rates no function but a refusal — the unit wearing it does not
stay down. The Prowler stole it and ran for the crystal seams (`t3`, the cold
storage note). That is the seal the deep is guarding.

## Where it is told

- **Pause ▸ Crests with none held**: the full paragraph, then where the seals
  are. The empty screen is where the question gets asked.
- **The first crest she takes**: two extra lines in its ACQUIRED card, once
  (`flags.crestTold`), whether it came from a chest or the shop.
- **Under the port** on the Crests screen once she holds any: one line.
- The crest button left the touch HUD the same day (it was stealing the map's
  taps); Crests live under Pause, key I, or the pad's mapped button.

## For the kingdom sessions

Every kingdom's NPC can read her chest. A unit that notices the seal she
wears — "a courier's sprint on a maintenance frame" — is one line of dialogue
that makes the whole system legible. Bosses were rated units too: a guardian's
crest is a legitimate drop, and the seal should say what the guardian *was*.

## Seals that change how she fights (handoff Part 2 C1, owner-approved 2026-10-12)

The owner: *"expensive crests should change how she fights, give her something
tangible that helps in the game. Think of something that is applicable for all
weapons, whether it's claw, sword, double sword, etc."*

A rating is a way of moving, so a seal that takes **two or more sockets** now
carries an **attack block** as well as its passive (the passive is kept, every
socket cost is kept). The block is a set of multipliers laid over her swing at
one place — `CREST_ATTACK` beside `CRESTS` in `js/game.js`, read by
`Player.hitbox()` (reach, width), the swing start (active window, recovery,
step, chain, the down-strike), `attackKnock`/`attackFreeze` through the A1
table's `crest` rows (`slash`, `finisher`), the recoil, and the authored hit
shapes (`js/hitshape.js`). Because it is applied after the weapon's own factors,
the same seal shapes the bare claws, the single sword, the twin blades, the
joined blade and NOSTOS's hero identically, in proportion. The one-socket seals
(magnet, siphon, sprint) stay passives: a courier's sprint was rated to run, not
to fight — the handoff's "quicker, shorter swipes" went to the seal whose rating
*is* speed, the Actuator Overclock.

Fixed blows stay fixed: the parry counter and Volt Soar (`flat` rows), and the
charged moves — burst, swirl, the thrown blade — are their own moves and are not
shaped by a seal. Damage is never changed by a block.

| seal | sockets | t | cd | R | half | kb | freeze | step | recoil | chain | down | tint |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `claws` | 2 | 1 | 1.15 | 1.25 | 0.9 | 1 | 1 | 1 | 1 | 3 | straight | `#2dff1e` acid green |
| `plate` | 2 | 1.2 | 1.25 | 1 | 1.35 | 1.4 | 1.3 | 1 | 1 | 3 | diag | `#5c7aa8` slate |
| `over` | 2 | 0.8 | 1 | 0.85 | 1 | 0.75 | 0.6 | 1 | 1 | 3 | straight | `#ff9be0` pink |
| `phantom` | 2 | 1 | 1.1 | 0.9 | 1 | 1 | 1 | 2.5 | 1 | 3 | straight | `#b8a0ff` lavender |
| `ground` | 2 | 1 | 1.1 | 1 | 1.15 | 1.3 | 1 | 0 | 0 | 3 | straight | `#16a596` teal |
| `nine` | 3 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 2 | straight | `#69872d` moss |

`t` scales the swing's active window (0.15 s) and its drawn clock (0.24 s); `cd`
her recovery after each beat (0.26 / 0.23 / 0.33 s — Overclock's own passive
×0.7 still applies); `R` the cut's reach, measured at its FAR EDGE (where the cut stops — a wider seal grows the cut across the aim without pushing that edge on), `half` its half-width across the aim; `kb`
the knockback (horizontal and the blow's vertical component; the lift is not
scaled) and `freeze` the hit-stop of the swing rows; `step` the push into each
grounded beat (96 / 230 px/s); `recoil` her own blow's push back (62 / 130
px/s); `chain` 3 is jab, jab, finisher and 2 is jab, finisher; `down: diag`
sends the air down-strike forward-down at 45° and its pogo rebounds her forward
at her run speed (`DIAG_POGO_VX`, 340 px/s).

What each one is, as played (claws opener, normal difficulty; the same ratios
hold with every weapon — `tests/crestfight.cjs` prints the whole table):

- **Sharpened Claws — Long reach.** The cutter's rating. Every cut reaches 25 %
  further (the claw opener’s far edge 86 → 107.5 px from her centre) and is 10 % narrower; she
  recovers 15 % slower (0.26 → 0.30 s). Spacing becomes the weapon: she can hit
  what cannot yet hit her, and pays for a whiff. Keeps +25 % damage.
- **Thick Plating — Heavy slam.** The wall-walker's rating. A 35 % wider cut
  with the flat-faced `slam` shape, 40 % more knockback and 30 % more hit-stop,
  bought with a 20 % longer swing and 25 % slower recovery (0.26 → 0.325 s). Her
  air down-strike becomes the **diagonal pogo**: it lands 45° ahead-below and
  the rebound carries her forward over what she struck. Keeps +1 core.
- **Actuator Overclock — Quick swipes.** The actuator's rating (the courier
  idea, moved here). A 20 % shorter active window on top of the passive's 30 %
  faster recovery, paid for with 15 % less reach, 25 % less push and 40 % less
  hit-stop: the foe stays inside the next beat and the string flows.
- **Phase Coil — Lunge.** The phase-dasher's rating. Every grounded beat carries
  her in 2.5× as hard (jab 96 → 240 px/s, finisher 230 → 575 px/s), so the
  string closes distance; 10 % less reach, 10 % slower recovery, and she ends
  every exchange in the foe's face. Keeps the dash's untouchability.
- **Insulated Soles — Rooted.** The insulated unit's rating. She plants: no step
  into the beat and no recoil from it; 15 % wider and 30 % more knockback, 10 %
  slower recovery. She holds her ground and the foe does not.
- **Emergency Restart Unit — Two-beat.** The prototype's rating, the most
  expensive seal. Every second cut is the finisher (×1.35 damage, the heavy
  push, the crystal's rising cut): jab, finisher, jab, finisher. Recovery per
  beat unchanged, so the pair takes 0.59 s against the plain three-beat 0.82 s —
  about 3 % less damage per second, for twice the finishers. Keeps the revive.

**One style at a time.** If she wears several, the seal taking the **most port
width** sets her fighting style; between equals, **the one she seated first**
(`crestStyle`). Gear says so on the rows themselves — the active seal's line
reads *Sets your fighting style*, a worn seal it overrules reads *Style held by
…* — and the hero's Crests panel says the same under the seal's card.

**How it reads on screen.** Every style-setting seal draws its own edge on the
slash layer (`drawCrestEdge`, D1's layer): one crescent of additive light in the
seal's tint, built from the box the swing really has — its outer rim lands at
the cut's reach, its span is the cut's width, its thickness its weight. The
long reach draws the longest arc, the slam the widest and heaviest, the quick
swipes a short thin flick, the diagonal pogo a crescent on the 45° line. It
sits over each weapon's own cut, whatever body drew it; the authored arc plates
that will replace it are queued in `docs/ART_QUEUE.md` §2bo. The seal's card
(the item card, Gear, the Crests panel) says the block in plain words in all
five languages (`js/text-crestfight.js`), and the shop line names the style.
