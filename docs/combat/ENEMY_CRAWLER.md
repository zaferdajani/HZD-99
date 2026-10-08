# ENEMY_CRAWLER

Measured from `js/entities.js` case `'crawler'` (shares its branch with `guard`).
Timings in **ms**.

---

## Assignment

| | |
|---|---|
| Kind | `crawler` |
| **Role** | **pressure** |
| **Threat value** | 1 |
| ID prefix | `e.cr` |
| Base stats | 28×20, hp 30, spd 62 |
| Zones | A, B, C, D, E — and summoned by NULLFANG's roar |

**What it is for.** *The crawler is the machine that teaches you the shape of
every fight in this game: it stops, it tells, it commits, and then it is yours.*
It is the first enemy the player meets and the template the whole roster is a
variation on — which is why its tell is never allowed to shorten.

**Used alone, it becomes a chase.** One crawler on open ground is a thing you
walk past. It only becomes an encounter next to something that stops you walking.

---

## B1. Move table

| id | state | startup (tell) | active | recovery | hitbox | tell state | tell ms | channels | dmg | intended_counter | opening_ms | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `e.cr.notice` | — | — | — | `atkCD = 280 − iq×140 ms` | — | the **turn itself** | 280–140 | body rotation | 0 | — | n/a | It turns to face her *first* and lunges on the following pass, so the turn is part of the warning |
| `e.cr.lunge` | `coilT` | **350** (`TELL_FAST`, never scales) | 220 + iq×60 ms at spd×4.2 | **550 − iq×220 ms** (`windedT`) | body | `coilT` | **350** | amber dashed ring + directional wedge + `sfx('tell')` + it stops dead | 1 core | **move** perpendicular, or **bait-and-punish** | **517 → 297** | the punish window shrinks with cunning but never closes |
| `e.cr.contact` | — | — | continuous | — | 28×20 body | none | — | — | 1 core | **out-range** | n/a | see audit |

### B1k. Kingdom moves — what a level buys it, and where

A machine's level is its kingdom's depth plus the run's progress (`foeLevel`),
and the points it leaves over buy rows out of `FOE_MOVES`. Rows scoped `@<zone>`
reach one kingdom only, so the crawler below is the crawler in the Foundry and
NOT the crawler anywhere else — the table above is still the whole machine in
zones A, B, D and E.

| id | kingdom | cost | state | startup (tell) | active | recovery | hitbox | channels | dmg | intended_counter | opening_ms | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `e.cr.cinder` | **C — the Foundry** | 1 (every Foundry crawler, from the kingdom's own floor) | rides `lungeT` | **350** — the SAME `coilT` as `e.cr.lunge`, unchanged | melt laid every **75 ms** across the whole commit; each pool r 13, **1150 ms** | unchanged (`windedT` 550 − iq×220) | pools, **grounded targets only** | the ordinary tell **plus** melt showering off the underside for every frame of the coil **plus** `sfx('vent')` under `sfx('tell')` | 1 core per pool | **move** perpendicular as before, then **punish from off the lane** | **517 → 297**, unchanged | it does not add a move, it adds a PLACE to the one that was there. Measured by `tests/foundry.cjs` |

**Audit.** `opening_ms` is untouched and measured as untouched; the wind-up is
measured against the same machine with the move stripped and has to be the same
number of frames. The new damage source (`foundry.slag`) is telegraphed by the
coil it is laid during, which is the roster's normal standard — unlike
`e.ho.landing`, it is not a new untelegraphed source.

### B1 audits

**Empty or ambiguous `intended_counter`:** `e.cr.contact` — body contact damage
has no telegraph and no designed answer beyond "do not touch it". This is true of
every enemy in the game and is a **roster-wide** question, not a crawler one:
carried to Stage C rather than answered here.

**`opening_ms ≤ 0`:** none. At maximum cunning (`iq = 1`) the lunge still leaves
**297 ms** — one full attack cycle. The floor is deliberate and commented in the
source: *"the punish window shrinks with cunning but never closes."*

**Wind-up names not matching `TELL_ST`:** n/a — enemies do not use the boss
state-name mechanism; `coilT` fires `sfx('tell')` explicitly at the call site,
and the amber ring is drawn by the shared wind-up renderer in `Enemy.draw`.

---

## B4. Composition

| With | Legal? | Reason |
|---|---|---|
| hopper | ✓ | two pressures in different planes; the answer is footwork, not a wall |
| flier | ✓ | pressure under a disruptor is the standard readable pair |
| turret | ✓ | **the best pairing** — the turret punishes approach, the crawler punishes standing still |
| guard | ✓ | pressure beside an anchor: the crawler is what makes waiting for the guard's window cost something |
| blob | ✓ | both punish standing; risks tedium if the room has no floor to move on |
| crawler | ✓ | but two is a swarm, not a pair — only with hard cover |

### Rooms

| Room | Paired with | Peak/screen | **Intended solution shape** | **Failure mode if ignored** |
|---|---|---|---|---|
| A0 | alone | 1 | *Hit it. It cannot hurt you.* The tutorial dummy — `calm`, held at arm's length. | none: the room cannot kill |
| A1 | guard | 4 | *Kill the crawler first, then wait out the guard's plate.* | Fighting the guard with a crawler behind you means eating the crawler's lunge every time you commit to the plate window. |
| A2 | flier, guard, hopper | 6 | *Take the crawler on the approach, then treat the guard and the hopper as one problem at the far end.* | Running the hall pulls all four into one screen. |
| A6 | flier, turret | 5 | *Clear the crawler off the ledge you have to land on, then climb under the flier.* | Landing on an occupied ledge over spikes. |

---

## Scaling

| | First appearance (A) | Last (E) |
|---|---|---|
| HP | 30 | 51 (`ZONE_K` 1.7) |
| Speed | 62 | 67 |
| Decision gap (`atkCD`) | 2200–3400 ms | 1100–1800 ms at full `iq` |
| Turn-to-face delay | 280 ms | 140 ms |
| **Tell length** | **350 ms** | **350 ms — never scales** |
| Punish window | 550 ms | 330 ms |
| Target leading | none | keeps its nose on her while coiling (`iq > 0.55`) |
| Traits | none early | swift / tough / volatile by `rollTraits(iq)` |

**What gets smarter, not just bigger:** it decides faster, it turns faster, and
above `iq 0.55` it tracks her *during* the coil so stepping around it stops being
a free answer. HP rises by 70% across the game; the decision gap halves. That is
the right ratio — the difficulty is in the timing, not the health bar.

---

## B5. Telegraph render directives

| id | Silhouette delta | Hue | Particle | Audio | Recovery read |
|---|---|---|---|---|---|
| `e.cr.lunge` | **it stops dead** and gathers — the walk rig freezes mid-stride | amber `#ffc24a` dashed ring + a wedge pointing where it will go | — | `sfx('tell')` | `windedT`: it slides to a halt with `vx *= 0.02^dt`, visibly decelerating and not turning |

**Verification** at 960×540 in motion: the stop-dead is the strongest silhouette
signal available on a 28×20 sprite, and the directional wedge means the tell
carries *where* as well as *when* — which is what makes "move perpendicular" a
readable instruction rather than a guess. `tests/combat.cjs` measures the tell at
**1100 ms** end-to-end including the notice-and-turn.

---

## B6. Close-out

### INTERFACES
Consumed: registry §1, §2 (amber), §3 (`e.cr`), §4 (pressure / 1), §5.
Needed: NULLFANG summons this family — its tell must stay distinct from
`nf.swipe`'s. It is: the crawler's ring is at body scale, the boss's is at boss
scale, and the boss's is accompanied by a paw above the head line.

### UNKNOWN
1. Whether the body contact hitbox matches the drawn silhouette at all yaw
   angles. `aabb(this, player)` uses the full 28×20 rect; the turnaround art is
   narrower in profile than head-on.

### Changelog
No crawler values changed this pass. Two rooms changed composition — see
`BOSS_NULLFANG.md`.

**Motion pass (2026-10-08, plan §1).** No combat number moved: tell, commit,
punish window, reach and damage are all as tabled above. What changed is how
the body gets from one of them to the next, and what it looks like while it
does. Shared by every walker (crawler, guard, blob, hopper on the ground,
the tamed pack); the guard, blob and hopper docs point here.

| Value | Before | After | Reason |
|---|---|---|---|
| Walker speed | `vx = dir × spd`, written outright every frame | **`enemyGait`**: standstill → patrol speed in **`WALK_ACC_T` 0.16 s**, patrol speed → standstill in **`WALK_BRAKE_T` 0.09 s** (≤ 4 px of floor at the fastest patrol in the roster, a swift crawler, so the ledge probe's look-ahead still covers it) | plan §1 fix 2: no acceleration made every start and stop a cut |
| Turning (patrol, ledge, wall, noticing her) | velocity flipped on the decision frame; the picture eased round afterwards at `FACE_RATE` 5.5/s, so the body slid backwards under the old facing for ~0.18 s — **the moonwalk** | **brake → turn → accelerate**: while moving, the picture holds the side it is moving to; only at a standstill does it turn (same 5.5/s); acceleration the new way waits until the picture has crossed to that side. `tests/enemygait.cjs`: 0 frames of vx against the facing outside a brake, in eight rooms over 30 000 walker-frames (329 on the old build) | plan §1 fix 2 |
| The lunge's facing | eased after the velocity, like a turn | **`faceCommit`**: the frame the lunge writes its velocity, the picture is brought just across (±0.2) to that side and eases the rest of the way | a commit is one frame; its picture has to be too |
| Grounded flag `on` | never set on any enemy — the downhill ground snap in `moveEnt` read it as undefined and never ran | set by every `moveEnt` (opt-in `groundTrack`), with `airT` (time off the floor) and `walkD` (floor covered) beside it | plan §1 fix 1: walkers skipped down every curve |
| Walk bob / stride phase (atlas fallback) | `t × (6 + |vx|/30)` — the wall clock | **floor covered**: `walkD / ATLAS_STRIDE (24 px) × π`, amplitude × `clamp(|vx|/40)`; standing still stands still | plan §1 fix 4 |
| Head-scan | ±0.22 yaw sweep for ever, cross-fading two authored angles (a permanent double exposure) | **gone** on every walker; the atlas draws ONE authored angle (the nearest) for walkers and anything still scanning | plan §1 fix 4 |
| Recovery read (`windedT`) | the standing plate — the punish window had no picture | **WINDED**: the rest plate re-posed head-down and sunk (`BEAST_RECOVER.winded`: pitch −0.12 rad about the feet, ×1.10 / ×0.80, flanks heaving); measured apart from rest (IoU 0.47 wolf / 0.40 cheetah) and from the coil by `tests/artbible.cjs` | plan §1 fix 5; its own plate is briefed in ART_QUEUE §2cc |

B5's "recovery read" is now true on screen as well as in the timer.

