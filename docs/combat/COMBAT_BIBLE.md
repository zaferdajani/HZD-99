# COMBAT BIBLE — assembled

Stage C. Built from the twelve subject files, not hand-written. Every number
traces to a file that traces to the source. Timings in **ms** (`CURRENT_STATE.md §0`).

---

## 1. The game in one screen

```
opening_ms = attacker_recovery_ms − 33          (her startup is 0; one sim step of latency)

her cycle:   150 ms active + 230 ms recovery = 380 ms
             < 250 ms opening  fits nothing
             250–500          one hit
             500–900          two
             > 900            three — greed territory

telegraph:   250 ms  reaction floor
             350 ms  TELL_FAST    (every minion, and it NEVER scales)
             500 ms  TELL_SWIPE
             700 ms  TELL_HEAVY

no block. no parry. no dash i-frames (without the phantom crest).
the defensive verbs are: move, jump, dash, out-range.
```

---

## 2. Every boss

| Boss | Zone | Slot | Shortest tell | Smallest opening | Signature |
|---|---|---|---|---|---|
| **NULLFANG** | A | reaction test | 450 | **317** (p2 swipe) | proves the telegraph contract is real |
| **TALONHOST** | B | arena / positional | 500 | **1067** | the cycle's fourth beat brings it into claw range |
| **FURNACE CHOIR** | C | greed test | **300** | 1567 | windows too big to take all of |
| **GLACIERE** | D | pattern memory | 500 | **667** | five named powers on an explicit five-beat cycle |
| **PRISM PROWLER** | X | mixup | 300 | **467** | two moves, one pose, opposite answers |
| **MOTHER-V** | E | resource management | 500 | 467 | attacks the economy, not the body |

**Six distinct fights.** The homogeneity audit (§5) is the evidence, and the
difficulty slots being assigned *before* any per-subject work is the reason.

## 3. Every enemy

| Family | Role | Threat | HP → | Tell | Punish window → | What gets smarter |
|---|---|---|---|---|---|---|
| `crawler` | pressure | 1 | 30 → 51 | 350 | 550 → 330 | turns faster, tracks during the coil |
| `hopper` | pressure (vertical) | 1 | 36 → 61 | 350 | 1067 → **267** | decides faster |
| `flier` | disruptor | 2 | 24 → 41 | 350 | 900 → 517 | **leads your movement** |
| `turret` | zoner | 2 | 45 → 77 | 550 | 1967 | leads, and bursts longer |
| `guard` | anchor | 3 | 44 → 75 | 350 | 550 → 330 | the window, not the health |
| `blob` | area denial | 2 | 52 → 88 | none (argued) | n/a | drips faster |

**No tell shortens anywhere in the game.** Every minion's is 350 ms in zone A
and 350 ms in zone E. Difficulty arrives through decision speed, target leading
and punish-window size — never through making the warning harder to see.

---

## 4. Findings and fixes, this pass

### Fixed

| # | Finding | Where |
|---|---|---|
| 1 | **Six one-channel telegraphs.** NULLFANG's roar and perch, TALONHOST's volley and brood call, FURNACE CHOIR's forge bell and hymn — all real wind-ups with a visual and no sound. | `TELL_ST` + a hand cue |
| 2 | **Four rooms pairing two disruptors on one screen** (A2, A6, C1, D2), removing player agency. A2 was the game's *second* fight. | four room edits |
| 3 | **Three kingdoms thinner than the first.** C and E had two fighting rooms; D had **one** — the second-hardest kingdom was the smallest. | C5, D4, E4 |
| 4 | **An errand that could never be completed.** `lumen_light` asked for a lens that was placed nowhere in the world. | E4 holds it |
| 5 | **The trader stopped trading.** The errand system overwrote each NPC's own action, so an outstanding job made the shop and the Trials unreachable — and broke the tutorial, whose trader *is* the shop lesson. | `doInteract` |
| 6 | **The Mind Nodes were unplayable on a pad.** A stick crosses both axis thresholds on a diagonal, so the puzzle answered with whichever direction it tested first. | d-pad-only read, one press one answer |

### Recorded, deliberately not "fixed"

| # | Finding | The argument |
|---|---|---|
| 7 | `e.tu.burst` has a **127 ms** inter-shot opening, below the reaction floor | A burst is not a move you punish between shots; it is a move you are inside of. Its real window is the 1967 ms afterwards. |
| 8 | `e.ho.landing` deals a core with **no warning frames** | The leap before it is telegraphed for 350 ms and its arc is ballistic, so the landing point is visible for the whole flight — and it only hits a grounded player. |
| 9 | `e.bl.pool` has **no telegraph at all** | It is terrain, not a strike. It is visible for 4.2 s before it can hurt anyone, which is more warning than any telegraph in the game gives. |
| 10 | `pp.dash` and `pp.pounce` share a pose | That *is* the assigned slot. The fix if it ever fails to read is to exaggerate the two poses, never to separate the tell lengths — that would turn an identification test into a reaction test and duplicate NULLFANG. |
| 11 | `mv.totalnull` suspends "every damage source visible before it lands" | Bought honestly: announced, once, below 20%, with audible tells and the Song buying sight back. The last thirty seconds of the game. |

---

## 5. Cross-subject audits

### Homogeneity

**Mechanically identical moves with different art:** one candidate.
`GLACIERE.dashwarn→dash` and `PRISM.dashwarn→dashslash` are both a telegraphed
commit to a locked angle. **Ruling: not a defect.** They differ in the axis that
matters — GLACIERE dashes on any vector including through the air and leaves a
biting trail behind her; the Prowler runs the floor and leaves nothing. The
answers differ accordingly (perpendicular vs. jump). Different zones, so no
same-fight collision. **Kept, and noted so a future pass does not "discover" it.**

**Telegraphs too similar across fights:** none. The six bosses' tells are, in
order: a paw above the head line, a haul to centre-top, a clapper arm counting
three, a horn drinking light, a low coil, and a light going *out*. That last one
is the only telegraph in the game that is a light **stopping**, which is why
MOTHER-V's reads instantly even at the end of a long game.

**Converging solution shapes:** none. Jump / stand-in-the-right-place / take-less
/ remember-the-order / identify / budget. Six verbs, six fights.

### Difficulty curve across the whole game

Threat per screen, measured by `tests/threat.cjs`:

```
A  1 → 4 → 6 → rest → 5 → 6 → BOSS
B  4 → 7 → 3 → rest → BOSS
C  5 → 6 → 5 → rest → BOSS
D  rest → 7 → 5 → BOSS
E  5 → 8 → 5 → BOSS
X  0 (the Prowler's approach is deliberately empty)

median 5   ·   90th percentile 7   ·   max 8   ·   every zone has a rest beat
```

Every zone rises and falls rather than climbing, and the room before every boss
door is a rest beat.

### Registry compliance

| Rule | Status |
|---|---|
| Palette (§2) | one open question — the turret's beam uses telegraph amber where lock cyan is reserved for "targeted specifically". **Ruling below.** |
| ID namespace (§3) | clean; every prefix used once |
| Difficulty slots (§4) | clean; six distinct, verified above |
| Threat ceiling (§5) | clean; max 8 against a ceiling of 9 |
| Forbidden compositions (§6) | clean, after four fixes |

**Ruling on the turret's beam: amber stays.** The aim line already carries the
specificity — it is drawn from the eye to the player and to nowhere else — so a
second hue would spend a reserved colour restating what the geometry says.
Reserving cyan for a case the game does not yet have is cheaper than teaching
the player two colours for one idea. Registry §2 is amended to say so.

### Open INTERFACES, resolved

| Request | From | Resolution |
|---|---|---|
| Brood-call summons share `kind === 'flier'` while being 1-HP timed hazards, so they cost a real flier's threat budget | `ENEMY_FLIER` | **Not a live defect** — they are spawned by a boss, and boss rooms are not budgeted by `tests/threat.cjs`, which reads authored room contents. Left as-is, recorded here so a future room never authors one directly. |
| A ruling on `*.contact` — every family has untelegraphed contact damage with no designed answer | `ENEMY_CRAWLER`, `ENEMY_GUARD` | **Correct as-is.** Bodies are solid; "do not walk into the machine" needs no telegraph because the machine is the telegraph. It is worth stating once, in a bible, that this is a decision and not an oversight. |
| The hopper's zone-E punish window falls to **267 ms**, which argues with "difficulty must not come from shrinking the window" | `ENEMY_HOPPER` | **The one real tension in the shipped numbers.** 267 ms is below her 380 ms cycle, so the finisher's recovery lands outside the window: the answer becomes one hit rather than a combo, which is a *change of shape*, not a closure. Accepted at the game's last zone, and flagged as the number to watch first if the ending reads as unfair. |
| `fc.forgebell`'s 300 ms tell is the shortest in the game and clears the adult reaction floor by 50 ms — for a game aimed at eight- to ten-year-olds | `BOSS_FURNACE` | **The most likely place the floor is wrong for the actual audience.** Ranked #1 in §7. |

---

## 6. Consolidated UNKNOWN

Every value still needing measurement, merged from all twelve files.

| # | Value | Owner |
|---|---|---|
| 1 | Real end-to-end input latency (browser event → the step that consumes it). The 33 ms in every calculation is one simulation step and a *lower bound*, not a measurement. | global |
| 2 | `mv.ringcharge` and `mv.grab` recovery — the moves that define MOTHER-V's phases 2 and 3 | MOTHER-V |
| 3 | `nf.pounce` and `nf.dive` landing recovery | NULLFANG |
| 4 | Per-move hitbox rects for boss attacks — computed inline per state, never declared | all bosses |
| 5 | Whether B4's two ledges are wide enough to shelter under at the volley's 7-rank spread | TALONHOST |
| 6 | Whether the turret's 440 px acquire radius can lock from off screen when the camera is clamped at a room edge | turret |
| 7 | Whether `leadX` overshoots when the player is dashing (940 px/s) rather than running (340) | flier |
| 8 | Total Null's audio tells measured against the ambience — the whole exception rests on separability | MOTHER-V |
| 9 | Death→retry time, against the < 2 s target | game feel |
| 10 | Whether the three forge weapons can be destroyed fast enough for "break them before they burst" to be actionable | FURNACE CHOIR |
| 11 | Pool-versus-pool overlap, and whether the 14-pool cap starves a long room | blob |
| 12 | Whether `G.revT`'s mirrored controls apply to the touch stick and pad d-pad | MOTHER-V |
| 13 | Whether contact hitboxes match the drawn silhouette at all yaw angles | all families |

---

## 7. The top five changes by impact to effort

1. **Lengthen `fc.forgebell`'s tell from 300 ms to 450.** One constant. It is the
   shortest telegraph in the game and the audience is eight to ten years old,
   whose choice-reaction time is materially slower than the 250 ms adult floor
   every number here was checked against. Highest impact, lowest effort, and the
   likeliest single cause of "that felt unfair".
2. **Measure input latency for real** (unknown #1). One harness. Every punish
   window in these twelve files is computed from an assumed 33 ms; if the true
   figure is 60–80 ms, the tightest windows (`pp.dash` 467, `e.ho.landing` 267)
   are meaningfully smaller than documented and two rulings above change.
3. **Instrument `G.dmgLog` into the telemetry spec** (`TELEMETRY_SPEC.md`). The
   build already records damage by attack id; it needs the attempt counter and
   the greed metric beside it. Turns every judgement in this bible into
   something checkable against real play.
4. **Declare boss hitboxes** (unknown #4). They are computed inline inside each
   state, so nobody can audit reach against visual reach — the exact defect §B5
   exists to prevent, and it is currently unauditable rather than wrong.
5. **Add the input buffer to the Mind Nodes.** She has 200 ms of attack buffer
   and the puzzles have none, so an answer pressed a frame early is simply lost.
   The same forgiveness, in the place a child is most likely to be pressing
   early.
