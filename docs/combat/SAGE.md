# THE SAGE — the purifier's whole reason

**Class:** DUELIST (boss-scale §2) — hero-scale, uses her verbs, whole-body
tells, temporal openings. **Resolution: TAME ONLY** (owner's standing rule).
Claws can break a sage down; they can never cleanse one.

## The lore

The sages were the wise units who went under with the Deaf System — but their
ears were too good. The song found them even in the rock. The Deaf System
sealed them in the deep chambers rather than destroy them, and they kneel
down there still, half-held by the song, chanting it back at the dark.
While she carries crystal light, an infected sage shows the **black halo
with the ember rim** (the owner's aura spec); a purified one shows blue.

## The fight (sentences, per boss-patterns)

Decision beat 0.9 s. Two sentences and the fairness floor:

- **coil → lunge → lunge → EXHALE.** The double lunge is her own dash worn
  by something that hates her; the exhale (700 ms) is the opening, always in
  the same place in the sentence — the Hornet lesson.
- **gather → EMBER RING.** `TELL_HEAVY` wind-up, grounded expanding ring,
  **jumpable** (the ring answers to jump as well as out-running — never the
  one-answer ring HERO_ANSWERS warns about).
- **Cold dice:** three denied openings in a row force a long exhale
  (boss-openings §4). The player is never starved.

Tells: state names `coil` / `gather`, both channels (silhouette + `tell`
sfx). Openings ≥ 250 ms everywhere; the exhale is rung 2 (positional —
be next to it when the sentence ends).

## The purification loop

1. Fight it down with anything. At **30 % hp** it does not die — it
   **SONG-LOCKS**: kneels, chants, and knits itself back toward 45 %.
2. Locked, claws **glance off** (sparks, a hint line, zero damage): "your
   claws break the small machines, but they cannot CLEANSE" — Ratchet's
   line, now a mechanic. A claw-only player must come back with the sword.
3. **Crystal strikes fill purity** (4 single-crystal hits, 3 joined). Full
   purity = **purified**: calm, blue halo, cannot be harmed (pokes, like
   tamed wolves), and it GIVES — the network's gift, once per save
   (`sageGift_<room>`): the cave giving "instead of taking from the tamed
   sage", exactly as the owner framed it.

## Placement and the reveal rule

One sage kneels in every guardian network's deep chamber (world.js GROTTOES).
"Defeating a boss or a sage always reveals a cave" — chamber sages are
already IN their cave; any future surface sage takes a GATE_ROOM `need` row
like the guardians and reveals its own.

## Art

Atlas creature (authored plates queued in ART_QUEUE): robed machine monk,
hooded, ember eyes; kneeling chant pose; the purified variant re-lit blue.
`drawSage` in js/entities.js is the engine-drawn first pass and the
placement reference.

## Measured by

`tests/sage.cjs`: tells fire on both channels; claws stop at the floor and
cannot finish; crystal purifies to tame; the tame persists across room
reloads; the gift pays once; the halo flips black→blue.
