# ENEMY_TURRET

Measured from `js/entities.js` case `'turret'` and `drawTurretLock()`. Timings in **ms**.

---

## Assignment

| | |
|---|---|
| Kind | `turret` |
| **Role** | **zoner** |
| **Threat value** | 2 |
| ID prefix | `e.tu` |
| Base stats | 28×30, hp 45, spd **0** — it does not move |
| Zones | A, B, C, D, E |

**What it is for.** *The turret asks whether you can cross this ground.* It is
the only enemy in the game that cannot come to you, so everything it does is
about the space between you.

**Used alone, it becomes tedium** — you wait out the lock, you walk up, you kill
it. It only becomes an encounter when something else makes waiting expensive.

---

## B1. Move table

| id | state | startup (tell) | active | recovery | hitbox | tell | tell ms | channels | dmg | intended_counter | opening_ms | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `e.tu.lock` | `lockT` | **550** (never scales) | — | — | — | `lockT` | **550** | **the beam** — a dashed line from the eye to you, faint and wide at first, thin and bright at the end — + eye pulse quickening + `sfx('ui')` | 0 | — | n/a | acquires at ≤ 440 px |
| `e.tu.shot` | fires at lock end | 0 | proj r6, 340 px/s, aimed at `leadX(px, iq×0.42)` | **2000 / `espd`** between bursts | proj | (the lock) | — | `sfx('shoot')` | 1 core | **move** — but the shot leads you | **1967** (or **127** mid-burst) | |
| `e.tu.burst` | at range > 240 px | **160** between shots | 2–4 shots by cunning | as above | proj | the beam **re-locks each time** | 160 | beam + eye | 1 core each | **cross anyway, or break line** | **127** | close up it is a single shot; far away it is a burst |
| `e.tu.contact` | — | — | continuous | — | 28×30 | none | — | — | 1 core | out-range | n/a | roster-wide |

### B1 audits

**Empty or ambiguous `intended_counter`:** none.

**`opening_ms ≤ 0`:** none — but **`e.tu.burst`'s inter-shot gap is 160 ms, which
gives an opening of 127 ms, below the 250 ms reaction floor.** This is the one
sub-floor window in the game so far, and it is *correct*: the burst is not a move
you punish between shots, it is a move you are inside of. The punish window is
the 1967 ms after the burst ends, and the burst's own gaps are not openings and
are not presented as any. Recorded here so it is not "fixed" later by someone
reading a table.

The design intent is explicit in the source: *"the question it asks is 'can you
cross this ground?', and a burst is what makes crossing a decision instead of a
stroll."* A burst you can punish between shots would not make crossing a
decision.

---

## B4. Composition

| With | Legal? | Reason |
|---|---|---|
| crawler | ✓ | **the designed pair** — the turret punishes approaching, the crawler punishes standing still. Two enemies, one room, no third needed. |
| blob | ✓ | the same shape, harder: the blob makes the *ground* the punishment |
| hopper | ✓ | the hopper closes the distance the turret is defending |
| flier | ✓ | strong; the flier stops you camping outside the acquire radius |
| guard | ⚠ | **only with cover.** Waiting for a guard's plate window inside a turret's line is not patience, it is standing in fire. |
| turret | ⚠ | crossfire is legal only if the room provides a line that breaks one of them |

### Rooms

| Room | Paired with | Peak | **Intended solution shape** | **Failure mode** |
|---|---|---|---|---|
| A6 | flier, crawler | 5 | *Break line behind a riser, then climb.* | Climbing in the open with a flier above. |
| A7 | blob ×2 | 6 | *Kill the turret first — the blobs are slow and the pools are what actually kills you.* | Fighting blobs inside the turret's line. |
| B1 | flier | 4 | *Take the tower.* It sits at (5,12) on the left tower; the room is built so you can approach along the top. | Crossing the spike gap while locked. |
| B2 | hopper ×2, guard | 7 | *Two turrets at 20 and 38 — deal with them one at a time; the hall is long enough to fight only one line.* | Standing in the middle, where both lines cross. |
| B6 | hopper, flier | 5 | *Kill it from cover before committing to the climb — you cannot dodge on a ladder.* | Meeting it mid-riser. |
| C1 | flier ×2 | 6 | flagged for zone C |

---

## Scaling

| | First (A) | Last (E) |
|---|---|---|
| HP | 45 | 77 |
| **Lock** | **550 ms — never scales** | **550 ms** |
| Burst length | 2 shots | 4 shots |
| Lead | none | `leadX(px, 0.42)` — the strongest lead in the roster |
| Cadence | 2000 ms | 2000 / `espd` (1667 ms on hard) |

**What gets smarter:** it shoots where you will be, and it shoots more. The lock
never shortens — which is the whole reason a turret is fair: the beam always
gives you the same 550 ms, and what changes is how much it costs to be wrong.

---

## B5. Telegraph render directives

| id | Silhouette delta | Hue | Particle | Audio | Recovery read |
|---|---|---|---|---|---|
| `e.tu.lock` | none — **the beam is the telegraph**, and it is the only enemy in the game whose tell is a drawn line rather than a pose | lock cyan is the registry's targeting hue, but this uses `TELL_COL` amber; see below | dashes march along the beam | `sfx('ui')`, pitched apart from `tell` | the eye dims and the beam vanishes |

**A registry question, flagged not resolved.** `drawTurretLock()` draws the beam
in `TELL_COL` amber. Registry §2 reserves **lock cyan `#8ff6ff`** for "you are
targeted specifically" and amber for "a move is coming". The turret's beam is
arguably both. Two readings:

- Amber is right, because it is a wind-up like any other and consistency across
  the roster matters more than a second hue.
- Cyan is right, because "a move is coming somewhere" and "a move is coming **at
  you specifically**" are genuinely different pieces of information, and the
  turret is the only enemy that carries the second.

This is exactly the kind of question a per-subject agent must not answer alone,
so it goes to Stage C. My own view, for the record: **amber**, and the aim line
itself already carries the specificity — adding a hue to say what the geometry
already says would spend a reserved colour on redundancy.

---

## B6. Close-out

### INTERFACES
Consumed: registry §1–§5.
**To Stage C:** the beam-hue question above.

### UNKNOWN
1. Whether the 440 px acquire radius exceeds the visible screen at any camera
   position — if so, the turret can lock from off-screen, which would be an
   invisible damage source and a fairness-contract violation.
2. Burst behaviour when the player crosses the 240 px threshold *during* a burst.

### Changelog
No turret values changed this pass.
