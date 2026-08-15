---
name: boss-scale
description: Boss size classes — giant arena bosses, hero-scale duelists, and small elites — and what each scale changes about readability, camera, arena, art class, and openings. Use when deciding how big a new boss should be, when designing a duelist-type boss the hero's own size, or when a fight's scale fights its arena.
---

# Boss scale — size is a design decision, not a grandeur setting

The owner's ruling: "most bosses are big. Some of them can be smaller… as big
as the hero character, or bigger." Size is the first decision in a boss brief
because everything downstream — art class, tells, camera, arena, opening rungs
— follows from it. Three classes, and a boss declares one.

---

## 1. GIANT (3×+ her height) — the wall that moves

The current guardians (NULLFANG, GLACIERE, FURNACE CHOIR, MOTHER-V…). What the
scale buys and costs:

- **Tells are anatomical** — per-part telegraphs (boss-movegen §3). A giant
  that flashes its whole body wastes its one advantage: limbs big enough to
  read individually at 960×540.
- **Openings are positional by default** — under it, behind it, on a limb that
  is spent. Rung 2 is the natural floor; rung 1 needs an explicit slump.
- **The arena is part of the moveset** — a giant that only stands in the
  middle is a turret. Shapes that use walls (ring, zone, volley) are the
  reason to be big.
- **Art class: parts-rig guardian** (ART_BIBLE class 2) — Higgsfield parts
  atlas, per-part wind-ups measurable by `tests/artbible.cjs`.
- **Cost:** hitting it is trivial, so difficulty must live entirely in the
  opening's rung and the player's positioning. HP is allowed to be deep here —
  the fight is a route, not a duel.

## 2. DUELIST (0.8×–1.5× her size) — the mirror

The Hornet / Sekiro-duel class; the owner's "as big as the hero character".
The hardest class to build and the most memorable when it lands:

- **Tells are whole-body** — a duelist's silhouette IS its limb. Wind-ups are
  stance changes (coil, blade-back, crouch), and they need MORE ms than a
  giant's, not fewer, because the shape is small: floor `TELL_SWIPE` even late
  game; compress with distinctness, never below.
- **It uses her verbs** — run, jump, dash, pounce. The mirror-shape
  (boss-movegen §1) is the class's identity: the player reads it because they
  DO it. A duelist with turret moves is a small giant, which is nothing.
- **Openings are temporal, not positional** — after strings (rung 3–4), whiff-
  punishable dashes, a landing recovery mirroring her own `landT`. The Hornet
  lesson: short openings are fair when they are always in the same place in
  the sentence.
- **It moves as much as she does** — the cadence (boss-patterns §3) is fast,
  decision interval ~0.8 s, strings short (2–3 links), rests real.
- **Art class: atlas creature** (like the wolves/cheetah) — full-body plates
  per state, stride-driven gait (`_stride` accumulator, the wolves' walk),
  NOT a parts rig; a rig reads as assembled at this size.
- **HP is shallow** — a duel that lasts 8 phases of chip damage is a grind.
  Duelists get 2 phases, big deltas.
- **Camera:** never zoom for a duelist; both bodies stay in frame at native
  scale, and `cam.shake` stays OFF during its wind-ups (small tells drown in
  shake first).

## 3. ELITE (0.5×–0.8×) — the pack lieutenant

Smaller than her: the Alpha-wolf class. Not a boss fight alone — a boss fight
as a CONTEXT: the elite plus its pack, the elite plus its room.

- **Tells are exaggerated** — a small body must over-act: the coil before the
  pounce is held longer than physics wants (`TELL_HEAVY` on broodcall/howl).
- **Its power is the deck it summons** — adds, buffs, terrain use. Cap live
  adds (Alpha: 3) and make the summon itself the rung-1 opening.
- **Openings are interrupts** — the summon/howl is long, visible, and
  punishable; hitting it during the call is the intended play.
- **Art class: atlas creature**, same pipeline as wolves.

## 4. Scale × arena contract

| class | min arena | camera | forbidden |
|---|---|---|---|
| giant | 2 screens wide or 1.5 tall | may frame the boss on entry | corridors its own width |
| duelist | one screen, flat-ish floor | fixed, no zoom, no shake in tells | pits that outsize its jumps |
| elite | any room its pack fits | normal play camera | arenas without add spawn points |

A giant in a corridor and a duelist in a cathedral both waste their class.
The room is declared in the boss doc next to the size class.

## 5. Brief checklist for a new boss

- [ ] Size class declared first line of `docs/combat/BOSS_*.md`.
- [ ] Art class matches (giant→parts rig, duelist/elite→atlas creature);
      plates queued in `docs/ART_QUEUE.md` for Higgsfield — never self-drawn.
- [ ] Tell budget respects class (duelist ≥ TELL_SWIPE always).
- [ ] Opening rungs match class defaults (giant: positional; duelist:
      temporal; elite: interrupt) before any exotic rungs.
- [ ] Arena contract of §4 satisfied by the room in world.js.
- [ ] Harness measures what the class promises: giants — per-part amber above
      rest; duelists — silhouette IoU between stances ≤ the guardian line
      (0.86); elites — add cap never exceeded in a logged fight.
