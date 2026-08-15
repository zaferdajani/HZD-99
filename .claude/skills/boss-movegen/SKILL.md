---
name: boss-movegen
description: Generate new attack moves for bosses and enemies — the move grammar, threat-shape catalog, and per-shape counter table. Use when a boss needs another move, when filling a new phase's deck, or when a requested attack must be translated into tell/active/recovery numbers and art requirements.
---

# Move generation

A move is not an animation with a hitbox. In this engine a move is a sentence
with fixed grammar, and every slot must be filled before any art is fired:

```
TELL (named so TELL_ST hears it) → ACTIVE (a shape from §1) → RECOVERY (the opening)
```

Numbers come from `docs/combat/GLOBAL_REGISTRY.md`; the opening arithmetic and
telegraph budget from `.claude/skills/combat-design/SKILL.md` §§1–2; which rung
of difficulty the opening sits on from `.claude/skills/boss-openings/SKILL.md` §3.
This file is the CATALOG: the shapes that exist, what counters each, and how to
combine them into a move that is new rather than a reskin.

---

## 1. The threat-shape catalog

Every attack in every reference game reduces to one of these shapes. Generate
by picking a shape, then a modifier, then checking the counter table — never by
free-associating "a cool attack".

| shape | it is | honest counter(s) here | note |
|---|---|---|---|
| **lunge** | attacker displaces at her | sidestep, jump over, dash past | speed must be outrunnable or jumpable, not both closed |
| **sweep** | arc through space beside the attacker | jump, out-range | which LIMB rises = which side — telegraph per-part |
| **slam** | vertical, point impact + often a shockwave | step out of point, jump the wave | wave speed vs her run speed — measure it |
| **projectile** | one travelling hitbox | move, jump, out-wait | must be visible at 960×540 against the zone's palette |
| **volley** | many projectiles in a pattern | find the gap, move through it | the GAP is the opening — it must fit her body ×1.5 |
| **beam** | instant or sweeping line | be elsewhere before it fires, jump the sweep | instant beams need the longest tells in the game (≥ TELL_HEAVY) |
| **zone** | area that persists | leave, fight elsewhere, wait it out | zoning with no safe floor is a toll — forbidden |
| **ring** | expanding area from a point | outrun the radius or jump it | check radius growth vs run speed over the wind-up — HERO_ANSWERS' known hole |
| **grab** | unblockables elsewhere; here just a lunge that beats dash | jump ONLY | at most one per boss; longest tell in its fight |
| **summon** | adds move to the deck via minions | kill adds, or ignore + dodge | cap live adds (Alpha caps at 3 — copy that) |
| **mirror** | copies HER verb (pounce like a jump, dash like hers) | fight it as a duelist | best on hero-scale bosses; see boss-scale skill |
| **rhythm** | repeating environmental beat during the fight | learn the beat | the fight's metronome; must never sync with a tell it hides |

## 2. Modifiers — how one shape becomes many moves

Apply at most TWO to a shape; three makes it unreadable:

- **feint** — tell, hold, then the move (or a different one). Only legal when
  both outcomes share the tell honestly and both have openings. Rung 5–6 only.
- **chained** — the shape repeats N times with micro-recoveries; only the last
  recovery is a real opening. The last wind-up MUST differ visibly (the Souls
  lesson: the end of a chain must not look like its middle).
- **tracking** — the shape aims at her live position up to a lock point. The
  lock must be visible (head stops turning, eye flashes) — after lock, dodging
  works; before lock, it doesn't. Never track through active frames.
- **paired** — two shapes fired as one move (slam + ring, lunge + volley).
  The counters must not contradict: "jump the wave" + "stay low for the volley"
  in one move is unanswerable — that's a forbidden combo, not a hard one.
- **delayed** — detonation after a marked delay. The mark must persist on
  screen; memory tests are for rung 5+, and even then the mark exists at cast.

## 3. Per-part telegraphs (parts-rig guardians)

The Monster Hunter lesson, and our rigs support it: a guardian with authored
parts atlases (beast/eagle/glaciere/furnace/prism/mother.js) telegraphs with
the PART that will act. Left paw rises → left sweep. Wings gather → ring.
This is strictly better than whole-body flashes because it scales to rung 3+
(conditional openings) without new tells — the player reads anatomy.

Requirements per new move:
- wind-up state name matches `TELL_ST` (`/warn|charge|crouch|coil|lock|prep|spin|gather/i`)
  so the audio channel is automatic;
- the acting part crosses the silhouette boundary (measured by
  `tests/artbible.cjs` — telegraph amber above that guardian's own rest);
- `G.artProbe` still suppresses any ground FX the move adds.

## 4. Art and audio the move must ship with

A move without its plates is a spec, not a move. Per new move, queue in
`docs/ART_QUEUE.md` (Higgsfield fires it — never generate art yourself):

- wind-up plate(s) with the acting part raised — the silhouette IS the tell;
- active plate(s) — the strike frame, plus trail/light-sheet if the shape moves;
- recovery plate — visibly SPENT (slump, exhale, dug-in claws). The opening
  must look like an opening, or the player never learns to take rung 2+.

Audio: wind-up is free via `TELL_ST`. Impact SFX goes through js/audio.js —
give heavy shapes a low component (the 74–110 Hz thumps already in the
vocabulary) and keep per-weapon slash voices (`wielded()`) untouched.

## 5. Generation procedure

1. Read the boss's doc in `docs/combat/BOSS_*.md` — list its current shapes.
2. Pick a shape the boss does NOT have, or a new modifier on one it does.
3. Fill the sentence: tell ms (≥ the zone's floor), active, recovery
   (`opening_ms ≥ 250`), rung, honest counters (≥ 2, or name the future skill
   that is the second answer).
4. Check against `docs/combat/HERO_ANSWERS.md` — the three holes: dash has no
   i-frames, rings have one answer, control effects have none.
5. Veto pass: does it pair with any existing move into a forbidden combo?
   Add the pair to the boss's veto list.
6. Write the spec into the boss's doc, queue the plates, wire the state, then
   `node tests/run.cjs combat` plus that boss's own harness.
