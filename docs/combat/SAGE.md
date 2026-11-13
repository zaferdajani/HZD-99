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

## The exhale has a body (2026-10-08, plan §1 fix 5)

The exhale (`windedT`, the duel's opening) drew the standing plate, so the
window the duel is built round looked like the sage waiting to strike. It now
BOWS over the spent breath — pitched 0.2 rad toward her about its feet, ×1.08 /
×0.80 — until an authored exhale plate is fired (ART_QUEUE §2cc). Timings
unchanged. `tests/artbible.cjs`: rest/exhale IoU 0.60, coil/exhale 0.57.

## Measured by

`tests/sage.cjs`: tells fire on both channels; claws stop at the floor and
cannot finish; crystal purifies to tame; the tame persists across room
reloads; the gift pays once; the halo flips black→blue.


## 2026-11-13 — first-Sage profile (GA1D only)

The researched creature-motion-combat skill now routes the actual Meadow Sage
to js/sage-motion.js. Other networks retain the earlier behavior. The double
lunge keeps its500ms anticipation and two220ms strikes but inserts a180ms
stationary replant; recovery stays700ms and is contact-safe. The ring has a
550ms release recovery, a fixed world origin and matching ground-lane collision.
An interrupted attack cancels into350ms recovery instead of returning as an
untold lunge. The ring keeps its independent clock if the caster is knocked back.
Purification amount, gifts, identities, room access and save facts are unchanged.

Source art is unchanged: no new limb performance is claimed. Existing walk
frames are distance-clocked without a second floating bob; active-strike facing
is committed; the oversized height jump between the old small lunge plate and
standing plate is corrected. A moving rescued Sage walks rather than gliding
in its kneeling picture. Rendering does not advance a combat timer.

See SAGE_MOTION_PASS_2026-11-13.md for values and limitations, and
`tests/sage-motion.cjs` for before/after gameplay and actual-rendering probes.
