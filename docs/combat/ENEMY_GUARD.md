# ENEMY_GUARD

Measured from `js/entities.js` case `'guard'` (shares its branch with `crawler`)
and `js/types.js dealDmg()` lines 152–165. Timings in **ms**.

---

## Assignment

| | |
|---|---|
| Kind | `guard` |
| **Role** | **anchor** |
| **Threat value** | 3 — the highest in the roster |
| ID prefix | `e.gd` |
| Base stats | 30×22, hp 44, spd 52 |
| Zones | A, B, C, D, E |

**What it is for.** *The guard asks the question the whole game is built on and
that nothing else in the roster asks: can you wait?* It holds a riot plate and
takes **12% damage** through it, and it drops that plate only while it is winded
from its own lunge. Mashing does not work. The punish window does.

**Used alone, it becomes a wall** — a health bar you chip at while nothing else
happens. It needs something beside it that makes *waiting* cost something, or the
patience it demands is free patience, which teaches nothing.

Mechanically it is a crawler with one field changed. No new AI, no new state
machine — which is the cheapest way there is to teach patience before a boss
demands it.

---

## B1. Move table

| id | state | startup (tell) | active | recovery | hitbox | tell | tell ms | channels | dmg | intended_counter | opening_ms | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `e.gd.plate` | passive, whenever `windedT ≤ 0 && lungeT ≤ 0` | — | continuous | — | — | **the plate is visible in the silhouette at all times** | — | silhouette + `sfx('bosshit')` clink on every blocked hit + amber-white spark burst | — | **wait** | n/a | `dealDmg` returns 0 and applies `max(1, round(dm × 0.12))` |
| `e.gd.lunge` | `coilT` | **350** (`TELL_FAST`) | 220 + iq×60 ms at spd×4.2 | **550 − iq×220 ms** (`windedT`) | body | `coilT` | **350** | amber ring + wedge + `sfx('tell')` + stops dead | 1 core | **move** perpendicular | **517 → 297** | **and the plate is DOWN for exactly this window** |
| `e.gd.contact` | — | — | continuous | — | 30×22 | none | — | — | 1 core | out-range | n/a | roster-wide, see Stage C |

### B1 audits

**Empty or ambiguous `intended_counter`:** `e.gd.contact`, as for every family.
Carried to Stage C.

**`opening_ms ≤ 0`:** none — and this is the family where it matters most,
because the opening is not merely when you *can* hit it, it is the only time you
can hit it *properly*. At full cunning the window is **297 ms**, which fits one
attack cycle (150 active + 230 recovery = 380 ms — so one hit lands inside the
window and the recovery finishes outside it). That is tight but correct: it means
the answer is one clean hit, not a combo, and greed is punished by the plate
coming back up rather than by damage.

**Deliberately not immunity.** 12% is not zero. A player who keeps swinging still
makes very slow progress and is never hard-stuck — they are simply being taught
that there is a better moment. That distinction is the difference between a
teaching enemy and a wall, and it should not be tuned to 0%.

---

## B4. Composition

| With | Legal? | Reason |
|---|---|---|
| crawler | ✓ | **the designed pair.** The crawler is what makes waiting expensive. |
| hopper | ✓ | same function, vertical — and better in a room with platforms |
| flier | ✓ | a disruptor overhead while you wait for a ground window is a real dilemma |
| turret | ✓ | but only with cover: waiting inside a turret's line is not patience, it is standing in fire |
| blob | ⚠ | both punish standing still, and the guard *requires* standing still. Legal only if the room's floor is wide enough to wait somewhere the pools are not. |
| guard | ✗ | two anchors is two walls. Nothing in the roster makes a second one add a question. |

### Rooms

| Room | Paired with | Peak/screen | **Intended solution shape** | **Failure mode if ignored** |
|---|---|---|---|---|
| A1 | crawler | 4 | *Kill the crawler, then trade one hit per lunge with the guard.* The game's first patience lesson, with exactly one distraction. | Mashing the plate: 12% per swing while a crawler lunges behind you. |
| A2 | crawler, flier, hopper | 6 | *Do not fight it in the open hall — pull it back to the narrow end.* | Fighting it where the hopper can reach means the wait window is never safe. |

### Rest beats

A3 (bench, trader, 0 threat) sits between A2 and the boss door. It is the zone's
required rest beat and it is correctly placed: immediately after the zone's
highest-threat room and immediately before NULLFANG.

---

## Scaling

| | First (A) | Last (E) |
|---|---|---|
| HP | 44 | 75 (`ZONE_K` 1.7) |
| Effective HP vs. a mashing player | 44 / 0.12 ≈ **367** | ≈ 625 |
| Speed | 52 | 56 |
| Decision gap | 2200–3400 ms | 1100–1800 ms |
| **Tell** | **350 ms — never scales** | **350 ms** |
| Punish window | 550 ms | 330 ms |

The guard's difficulty curve is almost entirely in the *window*, not the health —
which is what an anchor should be. The 8× effective-HP figure is the number that
makes the point: this enemy is not hard, it is *specific*.

---

## B5. Telegraph render directives

| id | Silhouette delta | Hue | Particle | Audio | Recovery read |
|---|---|---|---|---|---|
| `e.gd.plate` | **the plate is the silhouette.** Up = a slab with a slit; down = a walking mech. The state is legible at a glance with no overlay at all. | hazard yellow on the plate edge (art), warning red for the sensor slit | 7-particle pale burst on every blocked hit | `bosshit` clink — pitched clearly apart from the flesh `hit` | plate visibly drops as `windedT` starts |
| `e.gd.lunge` | stops dead, gathers | amber ring + wedge | — | `tell` | decelerating slide, plate still down |

**Verification** at 960×540 in motion: the plate up/down state is the single
clearest silhouette read in the whole roster, and it is the state the player must
know. The new turnaround art (this session) makes it clearer still — the guard
now has its own six-angle sheet rather than borrowing the crawler's, so the plate
is visible from every facing instead of only head-on.

### Authored-art ledger

| asset | move ids | prompt | generated | verified | status |
|---|---|---|---|---|---|
| `npc_6yaw.png` row 6 | `e.gd.plate`, `e.gd.lunge` | see commit *"The waking floor teaches the loop…"* — 3D turnaround strip, world-fixed key light, riot plate with a narrow slit and one red sensor eye, hazard striping | this session | `tests/regress`, in-game screenshots | shipped |

**Known compromise:** this row is the one mirrored asset in the game. The
generator would not render the guard's other profile across five attempts, and a
guard facing the wrong way is a gameplay defect — where its shield points is the
whole fight — while a guard lit from the wrong side, on flat gunmetal, is very
nearly nothing. Documented in `tools/turnsheet.cjs`.

---

## B6. Close-out

### INTERFACES
Consumed: registry §1, §2, §3 (`e.gd`), §4 (anchor / 3), §5.
Needed from Stage C: a ruling on `*.contact` — every family has an untelegraphed
contact-damage move with no designed answer. It may be correct (bodies are
solid) but it is currently the roster's largest unexamined damage source.

### UNKNOWN
1. Real time-to-kill for a patient player versus a mashing player, measured. The
   367 effective-HP figure above is arithmetic, not a measurement.
2. Whether 12% is the right number. It was chosen to be "clearly not immunity"
   and has never been playtested against a target TTK.

### Changelog
No guard values changed this pass. Its art changed — see the ledger.
