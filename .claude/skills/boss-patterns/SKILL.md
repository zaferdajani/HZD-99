---
name: boss-patterns
description: Pattern language for boss AI — chaining moves into learnable sequences, weighted decks, state machines, and the recognizability law. Use when writing or tuning a boss's step/update logic, when a fight feels random or repetitive, or when scripting phase decks and move-selection weights.
---

# Pattern language — the fight must be learnable as a sentence

The owner's clause this skill enforces: **"there should always be a pattern
that we can recognize no matter how hard it is."** A boss whose next move
cannot be narrowed by watching it is a slot machine; a boss whose next move is
always known is a metronome. The craft is between, and it has rules.

Openings are `boss-openings`; individual moves are `boss-movegen`; this file is
how moves become BEHAVIOR.

---

## 1. Decks, not dice

Move selection is a **weighted deck re-weighted by state**, drawn per decision
point. The house example is `alphaStep` (js/wolves.js): coil/pounce when near,
broodcall when hurt, summon capped at 3. Every boss step function follows that
shape:

```js
// the state vector that reweights the deck — no more than these four
const near = dist < LUNGE_RANGE, hurt = this.hp < this.hp0*0.5,
      cornered = playerNearWall(), airborne = !player.on;
```

Rules:
- **Weights, never uniform.** Uniform RNG across a moveset is unrecognizable
  by construction — it outlaws the owner's clause.
- **Recency debt.** A move just used halves its weight for the next two draws.
  Kills the double-lunge feel-bad without forbidding it outright.
- **Forbidden pairs are a veto list**, checked after the draw — pairs that
  back-to-back leave no reachable opening. Redraw, don't rescale.
- **The cold-dice floor** (boss-openings §4): after N=3 denials where she
  never reached an opening, force a rung-1 move. Fairness is enforced in code,
  not hoped for.

## 2. Sentences — the grammar of a string

A pattern the player can SAY is a pattern they can recognize. Author strings as
sentences with three slot types:

- **openers** — moves safe to start from neutral (a sweep, a projectile);
- **connectors** — moves that only follow specific openers (the second slash
  of a chain, the ring after the slam lands);
- **closers** — moves that END a string and carry the real recovery. Every
  string terminates in a closer; connectors have micro-recoveries only.

The Cuphead lesson: a phase's whole deck is 3–5 sentences, not 12 moves. The
player's mental model is "sweep-sweep-slam" and "howl-then-pounce", never a
transition matrix. Write each boss's sentences as literal comment lines in its
step function — if a sentence can't be written in words, it can't be learned.

## 3. Cadence — the Sekiro lesson without the parry

A learnable fight has a beat. Decision points fire on the boss's own tempo
(e.g. every 1.2 s at rest, every 0.8 s enraged), not per-frame coin flips.
Consequences:

- gaps between strings are part of the pattern — the player hears the rest;
- speeding a phase up = shrinking the decision interval, NOT shrinking tells;
- two bosses may share a tempo; a boss may not share a tempo with its own
  arena hazard (a rhythm-shape hazard must be off-beat from the boss, or one
  hides the other).

## 4. Phases change the question

Phase grammar from combat-design §5 (introduce → complicate → recombine),
plus the Furi lesson: each phase changes what the player is being ASKED, not
how much damage the answer costs. Legal phase deltas, in escalation order:

1. add a sentence to the deck;
2. add a connector inside a known sentence (the chain grows a link — its new
   last wind-up must read differently);
3. re-weight toward the harder sentences;
4. move a known sentence's opening up a rung (positional → conditional…);
5. recombine: two known openers now share a connector (the player's model is
   deliberately, visibly broken ONCE — then the new model holds to the end).

Illegal: new tells that alias old ones; deleting the recovery from a known
move; any change the player cannot detect except by taking damage.

## 5. Recognition is measurable

Do not trust "it feels learnable". The harness pattern for any boss:

- drive the fight N times with a scripted dummy player; log the move stream;
- assert every emitted string matches a declared sentence (no orphan moves);
- assert per-sentence frequency stays inside its declared weight band;
- assert the cold-dice floor triggers (corner the dummy, count draws to a
  rung-1 move ≤ 3);
- assert no forbidden pair ever appears in the log.

Add these to the boss's own harness in `tests/` — `tests/combat.cjs` measures
tells and openings; the SEQUENCE properties live with the boss. A pattern that
is only in a comment is prose, and prose has been argued with before
(tests/hero.cjs's header tells that story).
