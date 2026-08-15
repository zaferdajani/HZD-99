---
name: encounter-gen
description: Generate whole fights — room encounters, enemy pairings, wave scripts, mini-boss setups, and zone pacing. Use when populating a new room or zone with combat, when a stretch of the game feels flat or exhausting, or when composing which enemies appear together and in what order.
---

# Encounter generation — fights are sentences too

A room's combat is authored the same way a boss's deck is: picked shapes,
stated solution, measured openings. This file composes ENEMIES the way
boss-patterns composes moves. Roles and the pairing law come from
combat-design §4 (pressure/zoner/anchor/swarm/disruptor; author in pairs;
two disruptors forbidden; swarm+zoner needs cover). Build on that, don't
restate it.

---

## 1. The encounter brief — five lines, before placement

Every combat room gets these five lines in a comment above its world.js entry
or in the zone doc:

```
shapes:    what threat shapes are in the room (from boss-movegen §1)
solution:  the intended play, one sentence ("kill the turret first by
           dashing past the crawler on the low route")
failure:   what happens if the player ignores it ("the turret fences every
           jump and the crawlers herd her into it")
lesson:    which teaching station this is (combat-education §1) for which shape
budget:    threat points spent (see §3) and the rest beat that follows
```

A room that can't fill `solution` in one sentence is not an encounter, it is
a bag of enemies. A room that can't fill `lesson` is spending the player's
attention teaching nothing.

## 2. Composition patterns — the pairings that work

Beyond the role table, the specific compositions worth generating from, each
with its intended feel:

- **gauntlet** — pressure enemies in series with rests; teaches movement flow.
  Series, never simultaneous stacking of same-role pressure.
- **lock-and-key** — an anchor guarding a zoner (or vice versa); the room asks
  ORDER of kills. The classic first pairing; zone A/B staple.
- **turret nest** — zoner covering terrain the player must cross, pressure
  flushing them out of cover. Requires the cover to be real (measure sightlines
  at 960×540, not on the tile grid).
- **ambush** — spawn triggered mid-room. Legal only if the spawn is
  telegraphed 500 ms before the enemy is live (spawn FX = the tell) and never
  behind her within a body length. Off-screen instant spawns are unattributable
  damage — an education bug.
- **escort of the elite** — an elite (boss-scale §3) plus its pack; the pack
  is the elite's moveset. Kill-order question again, at higher stakes.
- **siege** — waves defending a point (the repair hold, an NPC). Wave scripts
  follow §4.
- **the mixed exam** — one room late in a zone that pairs the zone's two NEW
  shapes with one old shape at its raised rung. This is the room that proves
  the zone taught what it claims; every zone gets exactly one.

Forbidden compositions, beyond combat-design's: three roles all denying the
same answer (e.g. everything punishes jumping); any composition whose solution
is "wait" for longer than one enemy's cycle; enemies whose vertical reach sums
to cover the whole room height with no gap timing.

## 3. Threat budget — pacing is arithmetic

Points per live enemy: pressure 2, zoner 2, anchor 1, swarm 1 per 3 bodies,
disruptor 3, elite 4. House rules:

- a standard room spends ≤ 6; the mixed exam ≤ 8; corridors between ≤ 2;
- after any room ≥ 6, the next combat room spends ≤ 3 (the rest beat is a
  ROOM, not a pause);
- a zone's rooms, in order, form a sawtooth rising to the boss — never a
  plateau at max. Plot the numbers for the zone; if the plot is flat, the
  zone is exhausting regardless of how good each room is;
- taming-path enemies (wolves, sages) count full price while hostile — the
  budget measures pressure on the player, not kills available.

## 4. Wave scripts

Waves are scripted like boss sentences, not RNG faucets:

- ≤ 3 waves per encounter; each wave a declared composition from §2;
- wave N+1 spawns on wave N's LAST DEATH (or tame), never on a timer that can
  stack waves — stacking silently doubles the budget;
- each wave escalates by ONE of: +1 role, +1 rung on a known shape, terrain
  loss (a platform retracts). Never all at once;
- the final wave contains the encounter's only disruptor, if it has one;
- spawn points are fixed and visible (vents, doors, the Eye's beams —
  the spawn FX vocabulary already exists), so the player can play the NEXT
  wave, not just the current one.

## 5. Mini-bosses and set-pieces

A mini-boss (the Eye's destroyed-never-tamed lieutenants, task #66 line) is an
elite or duelist (boss-scale) run under encounter rules: it uses the ROOM
brief of §1, draws from a deck of ≤ 4 moves with sentences ≤ 2 links, and
holds ONE rung above the zone's regular enemies. No phases — phase grammar is
what separates bosses from mini-bosses. If a mini-boss wants phases, it is
asking to be a boss; give it a door and a lair or cut the phases.

## 6. Verification

- The five-line brief exists for every room that spawns a hostile.
- Budget plot per zone (sawtooth check) — a one-off script over world.js
  entity lists is fine; keep it in tools/ once written.
- Drive-through harness per new encounter: scripted player crossing the room
  on the stated solution takes ≤ 1 core of damage; crossing on the failure
  route measurably fails (takes ≥ 2, or is fenced). If the stated solution
  doesn't win in the harness, the brief is fiction — fix the room or the brief.
- `node tests/run.cjs combat deadend` after placement (reachability + the
  viewport rule are already enforced there).
