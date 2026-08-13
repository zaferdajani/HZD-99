# ENEMY_BLOB

Measured from `js/entities.js` case `'blob'` and the pool update in `js/game.js`.
Timings in **ms**.

---

## Assignment

| | |
|---|---|
| Kind | `blob` |
| **Role** | **area denial** (a static zoner) |
| **Threat value** | 2 |
| ID prefix | `e.bl` |
| Base stats | 34×26, hp 52, spd 30 — the slowest and toughest minion |
| Zones | A (A7), E (E1, E2, E4) |

**What it is for.** *The blob is the only enemy in the game that punishes NOT
moving.* Everything else in the roster asks you to react; this one asks you to
leave. It does not chase well and does not need to — it drips, and what it drips
stays on the floor for 4.2 seconds.

**Used alone, it becomes tedium.** A slow thing you can walk around is not an
encounter. It exists to be paired with something that punishes *approaching* —
the turret is the designed partner, and the two together make a room out of two
enemies: one says "do not come here", the other says "do not stand there".

---

## B1. Move table

| id | state | tell | active | recovery | hitbox | tell ms | channels | dmg | intended_counter | opening_ms |
|---|---|---|---|---|---|---|---|---|---|---|
| `e.bl.pool` | `dripT` | **none** | pool spreads to r26 over ~760 ms, lives **4200 ms** | — | radius ≤ 26 px, only while `player.on` and within 16 px vertically | **0** | the pool itself, visible from the moment it lands | 1 core | **move** — and keep moving | n/a |
| `e.bl.contact` | — | — | continuous | — | 34×26 | — | — | 1 core | out-range | n/a |

Drip cadence: `1100 − iq×400` to `1800 − iq×600` ms. Global cap **14 pools**.

### B1 audits

**Moves with no telegraph.** `e.bl.pool` has none, and `tests/combat.cjs`
reports `blob telegraphed=false` — the only enemy in the game that does.

**This is correct, and here is the argument.** A telegraph exists so a player
can react to a strike. The pool is not a strike: it is *terrain*, it arrives
under the blob rather than at the player, and it is fully visible for its whole
4.2 second life before it can hurt anyone standing still. The thing the player
must react to is the pool's *presence*, which is on screen continuously — a
wind-up before a drip would be warning you about something that is about to
become visible anyway.

The fairness contract asks that every damage source be **visible before it
lands**. This one is visible for four seconds before it lands, which is more
warning than any telegraph in the game gives. Recorded here in full so that a
later pass reading the harness output does not "fix" the missing tell.

**What would be a real defect** is a pool that damages on the frame it appears.
It does not: it spreads from r0 at 34 px/s, so the first ~200 ms of its life
cannot reach anything but the blob's own footprint.

**`opening_ms`**: not applicable. The blob has no committed attack and therefore
no recovery — it is always punishable, which is the correct trade for an enemy
with 52 HP that makes the floor hostile.

---

## B4. Composition

| With | Legal? | Reason |
|---|---|---|
| turret | ✓ | **the designed pair** — the turret punishes approach, the blob punishes standing |
| crawler | ✓ | pressure that makes leaving the pool cost something |
| hopper | ✓ | the same, vertically — and the hopper's landing shock plus a pool is a genuine "where do I put my feet" problem |
| guard | ⚠ | the guard's window **requires** standing still and the blob punishes exactly that. Legal only where the floor is wide enough to wait somewhere clean. E2 ships this pairing and the hall is 60 tiles, which is the only reason it works. |
| flier | ✓ | the flier stops you camping on clean ground |
| blob | ✓ | two is the shipped case in A7 and E1, and it works because they are slow: two blobs is a *shrinking floor*, not a swarm |

### Rooms

| Room | Paired with | Peak | **Intended solution shape** | **Failure mode** |
|---|---|---|---|---|
| A7 | blob, turret | 6 | *Kill the turret first — the blobs are slow and the pools are what actually kills you.* | Fighting blobs inside the turret's line. |
| E1 | blob, hopper | 5 | *Take the hopper, then walk the blobs in circles; they cannot follow.* | Backing into a pool while reading the hopper's crouch. |
| E2 | turret, guard, hopper | 8 | *The blob is at the far end with the bench — clear the middle before you commit.* | Using the bench with pools on the approach. |
| E4 | blob, turret, crawler | 5 | *The blobs are the room — go over them, not through.* | Taking the floor route. |

---

## Scaling

| | First (A) | Last (E) |
|---|---|---|
| HP | 52 | 88 |
| Speed | 30 | 32 |
| Drip cadence | 1100–1800 ms | 700–1200 ms at full cunning |
| Pool life | 4200 ms | 4200 ms — **never scales** |
| Pool radius | 26 | 26 — **never scales** |

**What gets smarter:** only the cadence. The pool itself is a constant, which is
deliberate: the player's mental model of "how much floor does one of these cost
me" must not change between kingdoms, or the room stops being readable.

---

## B5. Telegraph render directives

| id | Silhouette | Hue | Particle | Audio | Recovery read |
|---|---|---|---|---|---|
| `e.bl.pool` | the pool spreading — r0 to r26 over 760 ms is itself the read | **danger red `#ff5f6d`** per registry §2, "unavoidable-if-you-stay": area denial, not a strike | — | — | the pool visibly dries at the end of its 4.2 s |

The blob is the registry's canonical use of danger red, and the reason that hue
exists as a separate reservation from telegraph amber: amber means *a move is
coming, read it*; red means *this ground is not yours*. Two different
instructions that must never wear the same colour.

---

## B6. Close-out

### INTERFACES
Consumed: registry §1–§5. Nothing needed from another subject.

### UNKNOWN
1. Pool-versus-pool overlap — two blobs dripping in the same place produce two
   entries with independent timers, and whether that reads as one hazard or two
   was never checked.
2. The 14-pool global cap is shared across the room. In E2 with two droppers
   plus a long hall it may silently stop a blob from working at the far end.

### Changelog
No blob values changed this pass.
