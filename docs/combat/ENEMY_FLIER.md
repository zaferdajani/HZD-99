# ENEMY_FLIER

Measured from `js/entities.js` case `'flier'`. Timings in **ms**.

---

## Assignment

| | |
|---|---|
| Kind | `flier` |
| **Role** | **disruptor** |
| **Threat value** | 2 |
| ID prefix | `e.fl` |
| Base stats | 26×22, hp 24, spd 120 — the **fastest and frailest** thing in the roster |
| Zones | A, B, C, D, E — and summoned by TALONHOST |

**What it is for.** *The flier is the enemy that makes you stop doing what you
were doing.* It stations itself 120 px above you and holds there; you cannot
ignore it, you cannot out-walk it (120 px/s against her 340), and dealing with it
means interrupting whatever else the room was asking.

**Used alone, it becomes a loss of agency** — which is precisely why the registry
forbids two of them on one screen (§6.1). One disruptor is a decision. Two is
being told what to do from both sides at once, and this session found **four**
rooms doing it, including the game's second fight.

---

## B1. Move table

| id | state | startup (tell) | active | recovery | hitbox | tell | tell ms | channels | dmg | intended_counter | opening_ms | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `e.fl.station` | `near` | — | continuous | — | — | it holds 120 px directly above you | — | position | 0 | **move** — it has to re-station | n/a | fires only when `|px−cx| < 46 + iq×26` **and** it is ≥ 60 px above you |
| `e.fl.dive` | `holdT` | **350** (`TELL_FAST`, never scales) | **750** at `vy 430`, steering toward `leadX(px, iq×0.36)` | **900 − iq×350 ms** (`riseT`) | body | `holdT` | **350** | amber ring + downward wedge + **it stops dead in the air** + `sfx('tell')` | 1 core | **move** laterally — but see below | **867 → 517** | it aims where you are *going* once cunning is high |
| `e.fl.contact` | — | — | continuous | — | 26×22 | none | — | — | 1 core | out-range | n/a | roster-wide, Stage C |

### B1 audits

**Empty or ambiguous `intended_counter`:** none, but `e.fl.dive`'s counter is
**conditional on cunning**: at `iq 0` it dives where you stand and stepping aside
is free; at `iq 1` it leads you by 36% of your velocity and stepping aside walks
into it. The answer becomes *stop first, then step* — a genuinely different
skill, and the clearest example in the game of intelligence scaling changing the
answer rather than the numbers.

**`opening_ms ≤ 0`:** none. At full cunning the withdrawal still leaves
**517 ms** — one full attack cycle with room to spare, and the flier has 24 HP,
so that window is usually the whole enemy.

**Two creatures share this kind.** TALONHOST's brood-call summons are `flier`
with `hp = 1` and `expireT = 10 s`. They are not this enemy — they are a timed
hazard wearing its art, they die to any contact, and they should never be
counted at threat 2. Flagged to Stage C: the threat table keys on `kind`, so a
brood summon currently costs the same budget as a real flier.

---

## B4. Composition

| With | Legal? | Reason |
|---|---|---|
| crawler | ✓ | the standard readable pair: ground pressure under air disruption |
| hopper | ✓ | but both are vertical; the room needs horizontal space or it becomes noise |
| turret | ✓ | **strong** — the turret denies the ground, the flier denies standing still on it |
| guard | ✓ | a real dilemma: the guard's window demands you stand still and the flier punishes it |
| blob | ✓ | same dilemma, cheaper |
| **flier** | ✗ | **forbidden, registry §6.1** |

### Rooms

| Room | Paired with | Peak | **Intended solution shape** | **Failure mode** |
|---|---|---|---|---|
| A2 | crawler, guard, hopper | 6 | *Kill the flier on the approach — it has 24 HP and one hit is usually enough.* | Leaving it alive means every guard window is contested. |
| A6 | crawler, turret | 5 | *Climb under it; it cannot dive at you while you are under a ledge.* | Diving while you are airborne over spikes. |
| B1 | turret | 4 | *Take the turret's tower first, then the flier has nowhere to push you.* | Being pushed into the spike gap. |
| B6 | turret, hopper | 5 | *Kill the turret from cover before committing to the climb — you cannot dodge on a ladder.* | Meeting the flier mid-riser with a turret at your back. |
| C1 | flier, turret | 6 | **VIOLATION — two disruptors.** Flagged for zone C's pass. |
| D2 | flier, guard ×2 | 10 | **VIOLATION — two disruptors**, in the game's highest-threat screen. Flagged for zone D's pass. |

---

## Scaling

| | First (A) | Last (E) |
|---|---|---|
| HP | 24 | 41 |
| Speed | 120 | 128 |
| Decision gap | 2400–3600 ms | 1300–2100 ms |
| **Tell** | **350 ms — never scales** | **350 ms** |
| Withdrawal (the punish window) | 900 ms | 550 ms |
| **Target leading** | none — dives where you stand | `leadX(px, 0.36)` — dives where you will be |
| Firing cone | ±46 px | ±72 px |

**What gets smarter:** the lead. Everything else is a percentage; the lead
changes what the correct input *is*.

---

## B5. Telegraph render directives

| id | Silhouette delta | Hue | Particle | Audio | Recovery read |
|---|---|---|---|---|---|
| `e.fl.dive` | **it stops dead in the air and rises slightly** (`vy → −20`) — a hovering thing going still is a large silhouette event | amber ring + a wedge pointing **down** | — | `sfx('tell')` | `riseT`: it climbs away at −180 px/s, visibly retreating and not turning |

The downward wedge matters more here than anywhere else in the roster: the dive
steers, so *when* is not enough information — the player needs *where*, and the
wedge is the only thing that carries it.

---

## B6. Close-out

### INTERFACES
Consumed: registry §1–§5.
**Needed from Stage C:** a ruling on brood-call summons sharing `kind === 'flier'`
while being a 1-HP timed hazard. Either they get their own kind, or the threat
table needs to key on something finer than kind.

### UNKNOWN
1. Whether `leadX` overshoots when the player is dashing (940 px/s) rather than
   running (340). The lead factor is a fraction of velocity and dash is 2.8× run.

### Changelog
| Value | Before | After | Reason |
|---|---|---|---|
| A2 flier #2 | present | → hopper | registry §6.1 |
| A6 flier #2 | present | → crawler | registry §6.1, over spikes |
