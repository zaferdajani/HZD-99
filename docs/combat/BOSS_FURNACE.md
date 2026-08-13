# BOSS_FURNACE — FURNACE CHOIR

Measured from `js/entities.js` case `'atlas'`. Timings in **ms**.

| | |
|---|---|
| Kind / name | `atlas` / **FURNACE CHOIR** |
| Zone | C — the Foundry, room **C3** |
| **Difficulty slot** | **Greed test** |
| ID prefix | `fc` |
| Palette | telegraph amber; molten `MAT.molten.mid`; hazard `#ff9430` |
| Gate | `jet` |

**The one sentence.** *FURNACE CHOIR is the fight that punishes the third hit.*
Everything it does opens a window that fits two and looks like it fits three.

---

## B1. Move table

| id | state | tell | active | recovery | tell state | tell ms | channels | dmg | intended_counter | opening_ms |
|---|---|---|---|---|---|---|---|---|---|---|
| `fc.slam` | `slamwarn` | **550** | two ground shockwaves at ±340 px/s from the feet | **3000** | `slamwarn` ✓ | 550 | amber + rear + cue → `boom` | 1 core | **jump** — the waves hug the floor | **2967** |
| `fc.lob` | from `idle` | none — it is the *idle* action | arc proj, 8 dmg, 900 gravity | 2200 (p2) / 3200 (p1) | — | — | `shoot` | 1 core | **move** | n/a — this is its resting state, not a punishable move |
| `fc.forgebell` | `forgebell` | **300** to the first strike | 3 clapper strikes 300 ms apart, each dropping a white-hot weapon at `px ± 110` | **1600 (p2) / 2400 (p1)** | `forgebell` ✓ **(fixed this pass)** | 300 | amber + bell + spark shower + cue → `bosshit` ×3 | 1 core each | **break them before they burst** — they are destructible | **1567 / 2367** |
| `fc.hymn` | `hymn` | **1000** | 2 (p1) / 3 (p2) expanding heat rings | **2000 / 3000** | `hymn` ✓ **(fixed this pass)** | 1000 | amber + bells winding + roar wave + rumble + cue | 1 core | **out-range or thread the gaps** | **1967 / 2967** |
| `fc.meltdown` | `meltwarn` | **1200** | floor pours for 6500 ms; the boss slows to 0.55× | 2000 | `meltwarn` ✓ | 1200 | amber + **bell runs white-hot** + steam from every joint + cue | area | **relocate** | n/a |
| `fc.ember` | phase 2 only | none | one falling ember per 1100 ms at `px ± 130` | — | — | — | — | 1 core | **keep moving** | n/a — ambient pressure, not a move |

### B1 audits

**Empty `intended_counter`:** none.
**`opening_ms ≤ 0`:** none — this is the most generous boss in the game on
paper, which is exactly the trap. See B2.

**Wind-ups with no audio channel — two, both fixed this pass:**

| State | Was | Now |
|---|---|---|
| `forgebell` | 300 ms of ringing before three white-hot weapons fall. Visual only. | added to `TELL_ST` |
| `hymn` | a full second of winding the bells before expanding heat rings. Visual only. | added to `TELL_ST` |

**And the harness reported this boss clean.** It held the player at one range for
four thousand steps, and at that range the Foundry sat in `slamwarn` forever —
`forgebell` and `hymn` were never reached. The harness sweeps distance now.

---

## B2. Opening design — the greed test

The windows here are enormous: 1967 to 2967 ms, five to seven attack cycles.
That is deliberate, and it is not generosity — it is **bait**.

| Move | Mechanism | The arithmetic |
|---|---|---|
| `fc.slam` | **greedy** | 2967 ms of opening. But the shockwaves travel at 340 px/s from the feet and the room is 30 tiles: the punish position is *beside the boss*, which is exactly where the next slam's waves originate. Taking the whole window means being there when it ends. |
| `fc.forgebell` | **greedy, conditional** | 1567 ms in phase two — and the three weapons it just dropped are landing during it. The window is real and it is shared with a hazard the player themselves triggered by staying close enough to be punishing. |
| `fc.hymn` | **conditional** | 1967 ms, but the rings expand from the boss. The opening is not "after the hymn" — it is "after the last ring passes you", and where you stand decides how much of it you get. |
| `fc.meltdown` | **specific** | the floor pours. There is exactly one answer and it is to be somewhere else, permanently, for 6.5 s. |

**The greed metric (§C3) is this fight's primary success signal.** Hits attempted
per opening versus hits safely available. Near 1.0 → the windows are too safe
and the fight is a damage race. Near 3.0 → players are being punished for
correct reads and the shockwave speed needs lowering.

---

## B3. Phases

| Phase | Threshold | Added | Modified | **Teaches** |
|---|---|---|---|---|
| 1 | 100–35% | slam, lob, forgebell, hymn | — | *Every opening here is bigger than it needs to be. Take some of it.* |
| 2 | < 35% | `fc.meltdown` once; `fc.ember` continuous | forgebell recovery 2400→1600; hymn rings 2→3 and recovery 3000→2000; lob gap 3200→2200 | *Take less of it.* Same moves, and the floor is now a clock. |

### Teaching pass

| | Death #1 | Death #3 | Death #10 |
|---|---|---|---|
| P1 | "It hit me while I was hitting it." | "Two hits and out, every time." | "I punish the hymn from outside the last ring, not from beside it." |
| P2 | "The floor killed me." | "The meltdown is not a move, it is a deadline." | "I bank damage in phase one so phase two is short." |

### Fairness contract

| Phase | ≥1 guaranteed punish | no unreactable damage | no mid-commitment transition | every source visible |
|---|---|---|---|---|
| 1 | ✓ slam, 2967 ms | ✓ shortest tell 300 ms — **above the floor but the shortest in the game**; see UNKNOWN | ✓ | ✓ |
| 2 | ✓ forgebell, 1567 ms | ✓ | ✓ meltdown deals no damage during its own tell | ✓ embers are telegraphed by their fall from y=40 |

---

## B5. Telegraph render directives

| id | Silhouette | Hue | Particle | Audio | **Recovery read** |
|---|---|---|---|---|---|
| `fc.slam` | rears back over the strike foot | amber | — | `tell` → `boom` | 3 s planted, no wind-up pose |
| `fc.forgebell` | clapper arm swings — three times, visibly counting | amber | spark shower per strike, molten palette | `tell` → `bosshit` ×3 | arm hangs; the weapons are already falling |
| `fc.hymn` | bells lift and hold | amber | roar wave + rumble | `tell` → `roar` | rings visibly leave the body |
| `fc.meltdown` | **the whole bell runs white-hot** (`whiteHot` ramps over 830 ms) | white, then molten | steam from every joint, 0.9/frame | `tell` → `roar` | it slows to 0.55× and stays slow — the only permanent silhouette change in the fight |

---

## B6. Close-out

### INTERFACES
Consumed: registry §1–§5. Nothing needed from another subject.

### UNKNOWN
1. `fc.forgebell`'s 300 ms tell is the shortest in the game. It clears the
   250 ms floor by 50 ms — for an adult. This game is for eight- to
   ten-year-olds, whose choice-reaction time is materially slower. **Flagged to
   Stage C** as the single most likely place the reaction floor is set wrong for
   the actual audience.
2. Whether the three forge weapons can be destroyed fast enough to matter, or
   whether "break them before they burst" is advice the player cannot act on.
3. Hymn ring thickness vs. the gap between rings in phase 2 (3 rings) — is
   threading them actually possible?

### Changelog
| Value | Before | After | Reason |
|---|---|---|---|
| `TELL_ST` | `…\|broodcall/i` | `…\|forgebell\|hymn/i` | two one-channel telegraphs |
| C1 lower flier | flier (10,25) | **hopper** (8,22) | registry §6.1 |
| `ROOMS.C5` | — | the Pour Gallery | zone C had two fighting rooms; and the Tinker's cull of four turrets had only two in his own kingdom |
