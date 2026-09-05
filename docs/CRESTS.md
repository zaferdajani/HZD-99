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
