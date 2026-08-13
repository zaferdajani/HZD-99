# ENEMY_HOPPER

Measured from `js/entities.js` case `'hopper'`. Timings in **ms**.

---

## Assignment

| | |
|---|---|
| Kind | `hopper` |
| **Role** | **pressure (vertical)** |
| **Threat value** | 1 |
| ID prefix | `e.ho` |
| Base stats | 26×24, hp 36, spd **180** — the fastest ground unit |
| Zones | A, B, C, E |

**What it is for.** *The hopper is the crawler's answer to "I will just stand on
this ledge."* It is the only ground enemy that changes altitude, and it is the
reason a platform is not automatically safe.

**Used alone, it becomes a chase** — the same failure as the crawler, faster.

It also carries the roster's one **untelegraphed** damage source that is not
contact: the landing shock.

---

## B1. Move table

| id | state | startup (tell) | active | recovery | hitbox | tell | tell ms | channels | dmg | intended_counter | opening_ms | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `e.ho.leap` | `crouchT` | **350** (`TELL_FAST`, never scales) | ballistic, `vy` launch, nose-first | landing → `t = 1100–1900 ms − iq` | body | `crouchT` | **350** | amber ring + wedge + **it compresses and faces you** + `sfx('tell')` | 1 core | **move** perpendicular, or **jump over** — it commits nose-first | **1067 → 267** | it faces its prey while gathering, so the leap goes where it is pointing |
| `e.ho.landing` | — | **0 — none** | on the frame it touches down | — | ±62 px horizontal, ±40 px vertical, **grounded targets only** | **none** | **0** | camera shake 2 + a 7-particle dust burst, **on the frame it lands** | 1 core | **do not be standing beside it when it lands** | n/a | see the audit |
| `e.ho.contact` | — | — | continuous | — | 26×24 | none | — | — | 1 core | out-range | n/a | roster-wide |

### B1 audits

**Moves with `opening_ms ≤ 0`:** none.

**Moves with no telegraph — the one real finding in this family:**
`e.ho.landing` deals a full core with **zero warning frames**. It is not
contact damage (it hits at ±62 px, more than twice the body width) and it fires
on the frame of touchdown, so the shake and dust that announce it arrive *with*
the damage rather than before it.

**Is it a fairness violation?** The contract says *"every damage source visible
before it lands."* Strictly, no: the leap that precedes it is telegraphed for
350 ms and the arc is ballistic and readable, so the *landing point* is visible
for the whole flight. The player has 350 ms plus the flight time to know where
not to be. That is a genuinely different thing from an untelegraphed strike.

The source is explicit about why it exists: *"the shock is a moment of danger on
the ground next to it, which is what stops the answer from being 'stand where it
was and swing' every single time."* That is a real design job and removing it
would make the hopper a crawler that jumps.

**But it only checks `player.on`** — the shock cannot hit an airborne player. So
the counter is "be in the air when it lands", which is discoverable and free.
Recorded as **accepted, not a defect**, with the reasoning above, so that a later
pass reading the table does not delete it as an untelegraphed hit.

---

## B4. Composition

| With | Legal? | Reason |
|---|---|---|
| crawler | ✓ | two pressures in different planes — footwork, not a wall |
| turret | ✓ | **strong** — the hopper closes the ground the turret is defending |
| guard | ✓ | the hopper is what makes waiting for the plate window cost something, in a room with platforms |
| flier | ⚠ | both vertical; needs horizontal room or it is noise |
| blob | ✓ | the blob denies the floor, the hopper denies the ledge |
| hopper | ✓ in a wide room | two in B2, 20 tiles apart, is the shipped case and it works because the hall is 60 wide |

### Rooms

| Room | Paired with | Peak | **Intended solution shape** | **Failure mode** |
|---|---|---|---|---|
| A2 | crawler, flier, guard | 6 | *It is at the far end with the guard — treat them as one problem and pull them apart.* | Fighting the guard where the hopper can reach. |
| B2 | turret ×2, hopper, guard | 7 | *One line at a time. The hall is long enough to fight only one turret's line, and the hoppers come to you.* | Standing in the middle where both turret lines cross. |
| B6 | turret, flier | 5 | *It holds the mid ledges — the ones you have to land on.* | Landing on an occupied riser. |
| C2 | turret, guard | 6 | zone C's pass |
| E1 | blob ×2 | 5 | zone E's pass |

---

## Scaling

| | First (A) | Last (E) |
|---|---|---|
| HP | 36 | 61 |
| Speed | 180 | 192 |
| Decision gap | 1100–1900 ms | 700–1300 ms |
| **Tell** | **350 ms — never scales** | **350 ms** |
| Punish after landing | 1067 ms | 267 ms |
| Traits | none | swift ×1.32 speed makes it genuinely hard to out-run |

The punish window closing from 1067 to 267 ms is the steepest scaling in the
roster — a 4× reduction — and it sits right at the edge of the one-hit floor
(her cycle is 380 ms, so at 267 ms the finisher's recovery lands outside the
window). That is deliberate at zone E but worth watching: it is the closest
thing in the game to a window shrinking toward zero, which §B2 says difficulty
should not do. **Flagged to Stage C** as the one place the shipped scaling
argues with the design principle.

---

## B5. Telegraph render directives

| id | Silhouette delta | Hue | Particle | Audio | Recovery read |
|---|---|---|---|---|---|
| `e.ho.leap` | **compresses vertically and turns to face you** — the squash is the largest per-pixel silhouette change any small enemy makes | amber ring + wedge in the leap direction | — | `sfx('tell')` | it lands, `vx = 0`, and sits through 1067 ms of decision gap |
| `e.ho.landing` | — | — | 7 grey particles, camera shake 2 | — | (simultaneous with the damage — see audit) |

---

## B6. Close-out

### INTERFACES
Consumed: registry §1–§5.
**To Stage C:** the zone-E punish window at 267 ms, which is the one shipped
number that argues with §B2's "difficulty must not come from shrinking the
window".

### UNKNOWN
1. Landing-shock behaviour on a moving platform — `player.on` is true there, and
   the ±40 px vertical check may or may not hold across a platform's own motion.

### Changelog
| Value | Before | After | Reason |
|---|---|---|---|
| A2 | flier at (52,7) | **hopper** at (52,15) | registry §6.1 — two disruptors on one screen |
| B6 | — | hopper at (18,18) | new room; it holds the mid risers |
