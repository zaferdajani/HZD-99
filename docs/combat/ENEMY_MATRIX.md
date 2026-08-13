# ENEMY MATRIX — assembled

Stage C. Which machines may share a room, what each pairing is *for*, and what
every room in the game is currently asking. Roles and threat values from
`GLOBAL_REGISTRY.md §4`; concentration measured by `tests/threat.cjs`.

---

## 1. The pairing matrix

`✓` legal · `⚠` legal only with the stated condition · `✗` forbidden

| | crawler | hopper | flier | turret | guard | blob |
|---|---|---|---|---|---|---|
| **crawler** (pressure) | ⚠ swarm | ✓ | ✓ | ✓ **best** | ✓ | ✓ |
| **hopper** (pressure ↕) | ✓ | ⚠ wide room | ⚠ both vertical | ✓ | ✓ | ✓ |
| **flier** (disruptor) | ✓ | ⚠ | **✗** | ✓ | ✓ | ✓ |
| **turret** (zoner) | ✓ **best** | ✓ | ✓ | ⚠ crossfire | ⚠ cover | ✓ |
| **guard** (anchor) | ✓ | ✓ | ✓ | ⚠ cover | **✗** | ⚠ floor |
| **blob** (denial) | ✓ | ✓ | ✓ | ✓ **best** | ⚠ floor | ✓ |

**The three forbidden cells, and why:**

- **flier + flier** — two disruptors removes player agency. Not "hard": there is
  no answer to being pushed from two sides at once. Registry §6.1. Four rooms
  shipped this and all four are fixed.
- **guard + guard** — two anchors is two walls. Nothing in the roster makes a
  second one add a *question*.
- **turret + turret**, **turret + guard**, **guard + blob** are all conditional
  on the room, not the pair: a crossfire needs a line that breaks one gun; a
  guard's window needs somewhere to stand that is not on fire, and not dissolving.

**The two best pairings in the game**, both for the same reason — each half
punishes the answer to the other:

- **turret + crawler**: the turret punishes approaching, the crawler punishes
  standing still.
- **turret + blob**: the same shape, harder — the *ground* is the punishment.

---

## 2. Every room

| Room | Zone | Peak/screen | Composition | Intended solution shape |
|---|---|---|---|---|
| A0 | A | 1 | crawler | *Hit it. It cannot hurt you.* — the tutorial dummy |
| A1 | A | 4 | crawler + guard | *Kill the crawler, then trade one hit per lunge.* |
| A2 | A | 6 | crawler, flier, guard, hopper | *Take the crawler on the approach; the far end is one problem.* |
| A3 | A | **rest** | bench, trader | — |
| A4 | A | boss | NULLFANG | — |
| A5 | A | **rest** | chest, node, scrap | — |
| A6 | A | 5 | flier, crawler, turret | *Clear the ledge you must land on, then climb under the flier.* |
| A7 | A | 6 | blob ×2, turret | *Kill the turret first; the pools are what actually kill you.* |
| B1 | B | 4 | flier + turret | *Take the tower.* |
| B2 | B | 7 | turret ×2, hopper ×2, guard | *One line at a time — the hall is long enough.* |
| B3 | B | **rest** | bench, Oracle, terminal, Trials | — |
| B4 | B | boss | TALONHOST | — |
| B5 | B | **rest** | secret | — |
| B6 | B | 3 | turret, hopper, flier | *Kill the turret from cover before you commit to the climb.* |
| C1 | C | 5 | flier, hopper, turret | *Descend the shaft one ledge at a time; the hopper owns the landing.* |
| C2 | C | 6 | turret, hopper, guard, blob ×2, saw | *The saw sets the tempo — move on its clock, not yours.* |
| C3 | C | boss | FURNACE CHOIR | — |
| C4 | C | **rest** | chest, node | — |
| C5 | C | 5 | turret ×2, crawler, saw | *Put the pour column between you and one gun; the crawler stops you camping.* |
| D1 | D | **rest** | bench, Archivist, terminal | — |
| D2 | D | 7 | guard ×2, hopper, flier, turret, saw | *On ice you cannot stop — pick which guard you are committing to.* |
| D3 | D | boss | GLACIERE | — |
| D4 | D | 5 | guard, flier, crawler | *An anchor on ice: you must arrive at a stop to use its window.* |
| E1 | E | 5 | blob ×2, hopper | *Take the hopper, then walk the blobs in circles.* |
| E2 | E | 8 | turret, guard, blob, hopper, flier, saw ×2 | *Clear the middle before you commit to the bench.* |
| E3 | E | boss | MOTHER-V | — |
| E4 | E | 5 | blob ×2, turret, crawler | *The blobs are the room — go over them, not through.* |
| V1 V2 X1 | X | **rest** / boss | vault, PRISM PROWLER | — |

---

## 3. The curve

```
zone A   1 → 4 → 6 → rest → 5 → 6 → BOSS
zone B   4 → 7 → 3 → rest → BOSS
zone C   5 → 6 → 5 → rest → BOSS
zone D   rest → 7 → 5 → BOSS
zone E   5 → 8 → 5 → BOSS
zone X   0 → 0 → BOSS

median 5 · 90th percentile 7 · max 8 · ceiling 9
```

Every zone rises and falls. Every zone has at least one rest beat, and the room
before every boss door is one — a monotonic ramp exhausts players and flattens
the boss's impact.

**Zone D is the deliberate spike** (7 in a room where you cannot stop) and it is
the second-hardest kingdom. Zone E peaks higher (8) but on a floor you can brake
on, which is why D is the one that feels worse.

---

## 4. The three room-composition rules worth remembering

1. **Author in pairs, never solo.** A zoner alone is tedious; a zoner behind an
   anchor is an encounter.
2. **Every room states a solution shape** — a sentence a player could say out
   loud. If you cannot write one, the room is attrition, not an encounter.
3. **A new machine gets one room to be read in.** No enemy's first appearance in
   the game shares a screen with two others.
