# BOSS_TALONHOST

Measured from `js/entities.js` case `'brood'`. Timings in **ms**.

---

## Assignment

| | |
|---|---|
| Kind / name | `brood` / **TALONHOST** |
| Zone | B — Data Conduits, room **B4** |
| **Difficulty slot** | **Arena / positional** |
| ID prefix | `th` |
| Palette | telegraph amber `#ffc24a`; brood red `#ff4c5c`; coolant blue `#8fd8ff` |
| Art | `eagle.js` |
| Elemental gate | `shard` |

**The one sentence.** *TALONHOST is the fight about where you are standing when
its wings give out.* It lives on a ceiling mount and cannot be reached there. Its
entire moveset exists to make the floor unpleasant while it is up, and the fight
is decided by whether you are in claw range at the moment it comes down — which
you know is coming, because it is on a fixed four-beat cycle.

---

## B1. Move table

`opening_ms = recovery_ms − 33`

| id | state | startup (tell) | active | recovery | hitbox | tell state | tell ms | channels | dmg | intended_counter | opening_ms | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `th.volley` | `volley` | **900** (p1) / **550** (p2) | fan of 5 (p1) / 7 (p2) feathers, 330 px/s, gravity 180 | 1800 (p1) / 1200 (p2) | per-feather proj r7 | `volley` ✓ **(fixed this pass)** | **900 / 550** | amber + hauls to centre-top + wings load + `sfx('tell')` → `shoot` | 1 core | **out-range** — get under a ledge, the fan spreads 0.28 rad per rank | **1767 / 1167** | p2 fires a second fan 450 ms after the first |
| `th.swoop` | `swoopwarn`→`swoop` | **550** | 1050 ms bezier through where you stood | 1600 (p1) / 1100 (p2) | body | `swoopwarn` ✓ | **550** | amber + talons splay + lock + cue | 1 core | **move** perpendicular — it commits to `tx,ty` at warn end | **1567 / 1067** | it targets where you *were*, so moving at all beats it |
| `th.broodcall` | `broodcall` | **500** | 3 (p1) / 4 (p2) fliers, one per 500 ms, hp 1, `expireT` 10 s | **1500**, plus `stagT 900` | — | `broodcall` ✓ **(fixed this pass)** | **500** | amber + head thrown back + core strobing + cue → `roar` | 0 direct | **interrupt** is impossible; **out-range** the summons as they enter from the edges | **1467**, and a *guaranteed* 900 ms stagger on top | the summons are 1 HP: they die to a single touch of anything |
| `th.rest` → `restlow` → `rise` | 3 states | **1000** (`rest`, visibly descending) | — | `restlow` **2900** (p1) / **2000** (p2), then `rise` 1200 | body, in claw range | descent itself | **1000** | it drops out of the ceiling — the largest positional change in the fight | 0 | **be there** | **2867 / 1967** | **this is the fight** |
| `th.cfcrash` → `cffloor` | 2 states | — | falls at 2600 px/s², floor freezes (`G.iceT = 7.5`) | `cffloor` **1700** with `stagT 400` | body | `sfx('hurt')` at the rupture + coolant trail | — | blue + sparks + toast | 0 direct | **be there, again** | **1667** | once per fight, below 40% |

### B1 audits

**Empty or ambiguous `intended_counter`:** none.

**`opening_ms ≤ 0`:** none. The smallest is **1067 ms** — this fight is the most
generous in the game, correctly, because its difficulty is not in the windows.

**Wind-up states with no audio channel — this pass's two findings:**

| State | Was | Now |
|---|---|---|
| `volley` | **no audio cue.** 900 ms hauling to centre-top with the wings loading before a seven-feather fan. The only sound was `shoot`, which is the fan leaving. | `volley` added to `TELL_ST` |
| `broodcall` | **no audio cue.** 500 ms head-thrown-back before the screech. | `broodcall` added to `TELL_ST` |

**And the harness that was supposed to catch them did not.** `tests/tells.cjs`
was matching state names against a wider list of wind-up-sounding words, which
found NULLFANG's `roar` and `perch` and then missed `volley` — because "volley"
is not a word anybody puts on a list of wind-ups. A lexical rule can only find
the ones somebody already thought of, which are exactly the ones already fixed.

It is structural now: a state that sets `windT` **is** the engine declaring "I am
winding up" — that field exists for nothing else — so any state that declares it
and earns no cue is a one-channel telegraph by construction, whatever it is
called. The lexical list is kept alongside it because neither is a superset:
MOTHER-V telegraphs with named states that never set `windT`.

---

## B2. Opening design

| Move | Mechanism | The arithmetic |
|---|---|---|
| `th.rest` | **conditional, and it is the whole fight** | 2867 ms of the boss sitting in claw range — seven hits. But it descends at a fixed point in a four-beat cycle (`volley, swoop, volley, rest`), at a position it chooses, and the window opens *there*. The opening is enormous and the condition is **being in the right place when the cycle turns.** That is what "arena / positional" means as a difficulty slot. |
| `th.volley` | **specific** | The fan spreads 0.28 rad per rank from centre-top. Dodging sideways does not work — the fan is wider than you can run. The answer is **vertical cover**: B4 builds `hline(g, 5, 8, 11, '=')` and `hline(g, 21, 24, 11, '=')`, two ledges either side, and getting under one is the only counter. |
| `th.swoop` | **plain** | it commits to your position at warn end and flies a fixed bezier. Moving at all beats it. Deliberately the easy one — the fight needs a beat the player always wins. |
| `th.broodcall` | **greedy** | 1467 ms of recovery **plus** a guaranteed 900 ms stagger, while three or four 1-HP fliers converge from the edges. The window is huge and the room is filling. Taking all of it is correct exactly until it is not. |
| `th.cfcrash` | **conditional** | 1667 ms grounded with the chest cracked, but `G.iceT = 7.5` makes the floor glass for seven and a half seconds. The window costs you your footing for longer than the window lasts. |

---

## B3. Phase structure and teaching

| Phase | Threshold | Added | Modified | Arena | **What it teaches** |
|---|---|---|---|---|---|
| **1** | 100–40% | volley, swoop, broodcall, rest | — | ceiling mount, two ledges | *The cycle is four beats long and the fourth one is yours.* |
| **2** | < 40% | `th.cfcrash` once, at the threshold | volley tell 900→550 ms and fires twice; fan 5→7; swoop recovery 1600→1100; rest window 2900→2000; brood 3→4 | floor becomes ice for 7.5 s after the crash | *The same cycle, and now the floor is against you too.* |

The phase-two volley tell at **550 ms** is the shortest telegraph in this fight
and still well above the 250 ms reaction floor. It compensates with distinctness
rather than shortness: the haul to centre-top is a whole-screen positional change
no other move makes.

### Teaching pass

| | Death #1 | Death #3 | Death #10 |
|---|---|---|---|
| **P1** | "It shot me from up there." | "Volley, swoop, volley, *rest* — and rest is when I hit it." | "I stand under the left ledge for volleys and I am already moving to where it will land." |
| **P2** | "The floor went slippery and I died." | "The crash is a free window but I cannot stop afterwards." | "I bank the crash window and I do not chase on ice." |

### Fairness contract

| Phase | ≥1 guaranteed punish | no unreactable damage | no transition punishing mid-commitment | every source visible first |
|---|---|---|---|---|
| 1 | ✓ `rest`, 2867 ms, every fourth beat | ✓ shortest tell 500 ms | ✓ nothing transitions in P1 | ✓ all four telegraph |
| 2 | ✓ `rest` at 1967 ms, plus `cffloor` at 1667 ms | ✓ shortest tell 550 ms | ✓ `cfcrash` is the boss falling and dealing no damage — the transition is a *gift* | ✓ the ice is announced by a toast, a full-screen tint and `G.iceT` |

---

## B5. Telegraph render directives

| id | Silhouette delta | Hue | Particle | Audio | **Recovery read** |
|---|---|---|---|---|---|
| `th.volley` | hauls to **centre-top** — a whole-screen move nothing else makes; wings load | amber | recoil kicks it up the cable, which visibly swings | `tell` → `shoot` | the cable swings back and it drifts off centre |
| `th.swoop` | talons **splay**, body cocks toward the lock point | amber | — | `tell` → `dash` | it snaps back onto station; the cable takes the leftover momentum as a settling swing |
| `th.broodcall` | head **thrown back**, core strobing | amber + brood red | red motes rising from the chest | `tell` → `roar` | wings visibly drooped; `stagT` holds it there |
| `th.rest` | **descends out of the ceiling** | — | — | — | it is simply *low*, which is the clearest read in the fight and needs no overlay |
| `th.cfcrash` | uncontrolled fall — no lift, tumbling | coolant blue | sparks + coolant trailing | `hurt` → `boom` | chest cracked open, grounded, `stagT` |

The cable is doing real telegraph work here and is worth noting: `cabV` takes an
impulse from every action — fire recoil, departure, the screech, the catch — so
the empty cable's swing is a *second* readout of what the boss just did, visible
even when the boss itself is off screen.

**Verification** at 960×540 in motion:

| id | reads at native | distinct within this fight | amber only while winding up | verdict |
|---|---|---|---|---|
| `th.volley` | ✓ position change is the strongest possible signal | ✓ | ✓ | pass |
| `th.swoop` | ✓ | ✓ vs volley — one moves to centre, one cocks toward you | ✓ | pass |
| `th.broodcall` | ✓ | ✓ only move with rising red motes | ✓ | pass |
| `th.rest` | ✓ | ✓ unmistakable | n/a — not a threat | pass |

### Authored-art ledger

| asset | move ids | prompt | generated | verified | status |
|---|---|---|---|---|---|
| `eagle_parts.png` | all | (pre-existing) | prior | in-game | shipped |

No new art. Same reasoning as `BOSS_NULLFANG.md` and `CURRENT_STATE.md §6`.

---

## B6. Close-out

### INTERFACES
Consumed: registry §1–§5.
Needed: the `flier` family — TALONHOST summons them twice over (one per volley,
three or four per brood call). The brood-call ones are `hp 1` with `expireT 10`,
which is a *different* creature from the room-authored flier and should be
documented as such in `ENEMY_FLIER.md`.

### UNKNOWN
1. `th.volley`'s feather hitbox is `r7` with gravity 180 — the arc means the
   effective danger zone is not the spread angle. Never mapped.
2. Whether B4's two ledges are wide enough to shelter under at the fan's full
   7-rank spread. Four tiles each; unverified against the 0.28 rad spacing.

### Changelog
| Value | Before | After | Reason |
|---|---|---|---|
| `TELL_ST` | `…\|roar/i` | `…\|roar\|volley\|broodcall/i` | Two one-channel telegraphs on the second boss. |
| `tests/tells.cjs` wind-up detection | lexical only | structural (`windT`) ∪ lexical | The lexical rule missed `volley` and would miss every future one that is not named like a wind-up. |
| B1 exits | `{B:'A3', R:'B2'}` | `+ T:'B6'` | Zone B had two fighting rooms to zone A's five. |
| `ROOMS.B6` | — | new: the Relay Gallery | The Conduits' own wing, peak 5. |
| `QUESTS.mono_relay` | — | new fetch errand | Zone B had no errand at all; A, C and E did. |
