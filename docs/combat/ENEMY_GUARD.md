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
| `e.gd.plate` | passive, whenever `windedT ≤ 0 && lungeT ≤ 0` | — | continuous | — | **its `dir` side, body height** | **the plate is visible in the silhouette at all times, on ONE side** | — | silhouette + `sfx('bosshit')` clink on every blocked hit + amber-white spark burst | — | **wait / jump over it and strike its back / strike from above** | n/a | `dealDmg` returns 0 and applies `max(1, round(dm × 0.12))` **only for a hit from the front at body height** (js/types.js). Behind or above (y < top + 0.3h) lands whole. **Changed 2026-09-19:** it denied from every side; the owner hit it "from up, below, left and right" and it did not die. |
| `e.gd.lunge` | `coilT` | **350** (`TELL_FAST`) | 220 + iq×60 ms at spd×4.2 | **max(500, 750 − iq×220) ms** (`windedT`) | body | `coilT` | **350** | amber ring + wedge + `sfx('tell')` + stops dead | 1 core | **move** perpendicular | **717 → 497** | **and the plate is DOWN for exactly this window.** Changed 2026-09-19: was 550 − iq×220 (297 ms at full cunning — under her own 230 ms recovery twice over, one hit then the plate is back). Floored at 500 ms: two hits, always. |
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

**Motion pass (2026-10-08, plan §1).** The guard walks on the crawler's gait —
acceleration, braking, brake → turn → accelerate, a stride clocked by floor
covered, no head-scan (table in `ENEMY_CRAWLER.md`). Its atlas body now POSES
each state through the cut-out rig (`ATLAS_POSE` in js/atlas.js): **coil** —
hips sunk 42 % of leg height on folded legs, weight rocked back 0.16 rad;
**lunge** — body pitched 0.30 rad forward, legs trailing; **winded** — sunk
30 %, pitched 0.34 rad forward over splayed legs. Measured by
`tests/artbible.cjs` (rest/coil 0.70, rest/winded 0.69, coil/winded 0.71).

| Value | Before | After | Reason |
|---|---|---|---|
| The open-window ring (plate down) | `TELL_COL` amber, pulsing on the wall clock | pale plate steel `#e4f0fb`, on the simulation clock, off under `G.artProbe` | **registry §2, hard rule 1**: amber is on screen only while something winds up. This ring says the opposite ("open — hit it now"), and the bible's hue law measured the guard's recovery at 24.5 % amber against a 7.6 % rest |


**The armoured walker (2026-11-25, owner: "I don't want this small hero. This
should be a big one. It looks like an armored one that walks. Seeing me should
activate it, make it come to me").** Built `GUARD.size` (3.0) times its measured
30×22 the way a cave cat is built `CAT_SIZE` times a crawler (`sizeK`: body,
walls from `assets/bodybox.json`, hurt box and drawing together). Its hurt box
is its whole drawn height (`hurtBoxOf`, js/types.js), and "from above" means
above the drawn plate. It looks before it comes (js/sight.js). Measured by
`tests/enemy-sight.cjs` and `tests/foescale.cjs`.

| Value | Before | After | Reason |
|---|---|---|---|
| body | 30×22 | **90×66** | drawn ~126 px against her ~71 (0.77× → ~1.8×) |
| hurt box | the body | **108×119**, feet-anchored | a blow on the drawn body lands |
| hp | 44 | **90** | an armoured body; the longer window pays for it |
| patrol speed | 52 | **38** px/s | heavy and deliberate; 1.4× that when it comes for her |
| stride | 48 px a cycle | **144** px a cycle | its step is its size's, or its feet skate |
| tell (`coilT`) | 350 (`TELL_FAST`) | **500** (`TELL_SWIPE`, `tellmid`) | a heavy body's wind-up is longer, never shorter |
| bash | spd×4.2 for 220+iq×60 ms (~50 px) | spd×4.2×**2** (~80 px) | the reach of a body three times the size |
| winded | max(500, 750 − iq×220) | **+200 ms** | the window grows with the hp |
| armed band | 160 × 70 px | **210 × 90** | out from its wider front and taller middle |
| the open-window ring round the body | pale steel ring | **removed** | the ledger: no ring round any body. The opening is the plate coming down and the body slumping (`ATLAS_POSE.winded`) |
| the drawn stand-in plate beside it | a 6 px bar, always | **only while its art is not in** | the fired body holds its own plate as tall as it is; the bar was a stub at its shins |
| awareness | none: it walked its beat until she was inside 160 px | **sees** her in front of it inside 300 px, not through rock; turns, stands 0.7 s and sets its plate down (`notice_guard`, a recorded plate take); comes along the ground, holding at an edge or a wall; forgets her 3 s after losing her | the owner's order |

Art: the turntable (`npc_6yaw` row 6, 300×390 cells) and the walk strip
(`guard_walk8`, 192 px cells) are drawn DOWN at this size (~126 and ~125 px),
so nothing blurs. What it lacks is a fired plate-lowered / winded take: the open
window is read from the puppet's slump only (docs/ART_QUEUE.md).
