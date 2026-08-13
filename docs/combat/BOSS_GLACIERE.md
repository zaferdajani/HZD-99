# BOSS_GLACIERE

Measured from `js/entities.js` case `'zero'` (line 4631+). Timings in **ms**.

| | |
|---|---|
| Kind / name | `zero` / **GLACIERE, the Frozen Purifier** |
| Zone | D — the Frozen Archives, room **D3** (ice) |
| **Difficulty slot** | **Pattern memory** |
| ID prefix | `gl` |
| Palette | telegraph amber; purifier violet `#d24bff`; frost blue `#a5d8ff` |
| Gate | `slag` |

**The one sentence.** *GLACIERE is the fight you learn by heart.* Five named
powers on an explicit five-beat cycle (`this.cycle++ % 5`), and death #3 should
be "I know what comes after the shard fan."

---

## B1. Move table

| id | state | tell | active | recovery | tell state | tell ms | channels | dmg | intended_counter | opening_ms |
|---|---|---|---|---|---|---|---|---|---|---|
| `gl.lance` | `lancewarn` | **700** | 1 (p1) / 2 (p2) bolts, 185 px/s, r13, life 4.2 s | **2100 (p1) / 1500 (p2)** | ✓ | 700 | amber + **the horn drinks void light** + cue → `cast` | 1 core | **move off the line** — it is aimed once and does not steer | **2067 / 1467** |
| `gl.shard` | `shardwarn` | **500** | 5 (p1) / 7 (p2) shards at 350 px/s, 0.19 rad apart, in a two-rank **ripple** 70 ms apart | **2000 / 1400** | ✓ | 500 | amber + ice condenses along the spine crystals + cue | 1 core | **out-range or gap** | **1967 / 1367** |
| `gl.dash` | `dashwarn`→`dash`→`recover` | **550** | 620 ms at 640 px/s along a fixed angle, laying a biting ice trail every 70 ms | **700** (`recover`) | ✓ | 550 | amber + **squares up and coils, charge line drawn in the air** + cue → `dash` | 1 core | **move perpendicular** — the angle is locked at warn end | **667** |
| `gl.nova` | `novawarn` | **600** | expanding frost ring from the body | **1600** + `stagT 550` | ✓ | 600 | amber + **drops onto the standing frame and gathers** + cue | 1 core | **out-range** — it is reactive, so *do not crowd her* | **1567**, plus a guaranteed 550 ms stagger |
| `gl.orbs` | `orbs` | **1000** | void orbs summoned and held | 2200 | — (windT 500) | 1000 | violet + cue → `cast` | 1 core | **destroy or avoid** | n/a |
| `gl.prison` | (in `idle`) | — | a cage of frozen void around your position, life 2600 (p1) / 3400 (p2) | 2200 | — | — | `cast` | positional | **leave before it closes** | n/a |
| `gl.absolutezero` | `azhush` | **1100** | the hush — be outside the aura when the silence lands | — | — (windT 500) | 1100 | **the expanding aura IS the tell** + cue | 1 core | **out-range** | n/a |
| `gl.datacorrupt` | `dccast` | **900** | your HUD lies; she runs 1.45× while it does | — | — (windT 500) | 900 | violet + cue | 0 direct | **endure** | n/a |

### B1 audits

**Empty `intended_counter`:** none.
**`opening_ms ≤ 0`:** none. The tightest is `gl.dash` at **667 ms** — one hit
guaranteed, two if you are already beside her.
**Wind-ups with no audio channel:** **none.** GLACIERE is the only boss in the
game that was already fully compliant, because every one of its states was named
`*warn` from the start. It is the reason the naming convention exists and the
proof the convention works.

---

## B2. Opening design

| Move | Mechanism | The arithmetic |
|---|---|---|
| `gl.dash` | **specific** | 667 ms and the trail she just laid is still biting. The punish position is inside her wake. Only a perpendicular approach works. |
| `gl.nova` | **conditional** | it fires only when you are within 140 px horizontally and 120 px vertically, on a 7 s cooldown. The opening is 1567 ms + 550 ms stagger — the biggest in the fight — and you get it *by choosing to be close*, which is the same choice that triggered it. |
| `gl.lance` | **plain, and deliberately so** | 2067 ms. Pattern-memory fights need a beat the player wins every time once they have learned it, or memory buys nothing. |
| `gl.shard` | **specific** | the ripple. Ranks fire 70 ms apart, so the fan is not a wall: even ranks leave now, odd ranks a moment later along the *same* angles. The gap exists in time, not in space. |

**The cycle is the content:** `alt = cycle++ % 5` → lance, shard, lance, dash,
orbs-or-prison. Reactive interrupts (`nova` on proximity, `azhush` on cooldown,
`dccast` once below 40%) are layered over it. Learning the five-beat spine is
what phase-two survival is made of.

---

## B3. Phases

| Phase | Threshold | Added | Modified | **Teaches** |
|---|---|---|---|---|
| 1 | 100–40% | the five-beat cycle + nova + absolute zero | — | *There is an order, and it repeats.* |
| 2 | < 40% | `gl.datacorrupt` once | lance 1→2 bolts, recovery 2100→1500; shard 5→7, 2000→1400; prison life 2600→3400; she runs 1.45× while the HUD lies | *You know the order. Now you have to trust it while the HUD tells you not to.* |

**DATA CORRUPTION is the best idea in this fight** — a pattern-memory boss whose
late-game trick is to falsify the instruments, so the memory is the only thing
left that is true.

### Teaching pass

| | Death #1 | Death #3 | Death #10 |
|---|---|---|---|
| P1 | "Something purple hit me." | "Lance, shard, lance, dash — and then she cages me." | "I stand at 150 px: outside nova range, inside dash punish range." |
| P2 | "My health bar was lying." | "Ignore the HUD, count the beats." | "The corruption is free damage if I keep counting." |

### Fairness contract

| Phase | ≥1 guaranteed punish | no unreactable damage | no mid-commitment transition | every source visible |
|---|---|---|---|---|
| 1 | ✓ dash recover, 667 ms | ✓ shortest tell 500 ms | ✓ | ✓ |
| 2 | ✓ same; nova stagger 550 ms on top | ✓ **no tell shortens in phase two** — only recoveries do | ✓ `dccast` deals no damage | ⚠ the HUD lies *by design*; the damage sources are all still visible in the world |

---

## B5. Telegraph render directives

| id | Silhouette | Hue | Particle | Audio | **Recovery read** |
|---|---|---|---|---|---|
| `gl.lance` | the horn lowers and **drinks light** | violet gathering at the horn tip | inward | `tell` → `cast` | she drifts back to hover height, horn empty |
| `gl.shard` | spine crystals **rise and condense** | frost blue | ice forming along the spine | `tell` | spine flat |
| `gl.dash` | **squares up and coils**, and a charge line is drawn in the air along `dashAng` | amber line | — | `tell` → `dash` | `recover`: 700 ms visibly spent, lerping back to hover |
| `gl.nova` | **drops onto the standing frame and gathers** — she is a floating boss, so touching the ground is the largest silhouette event available | amber | — | `tell` → `break` | `stagT`: staggered where she stands |
| `gl.absolutezero` | the aura itself | frost | expanding ring | `tell` → `cast` | — |

---

## B6. Close-out

### INTERFACES
Consumed: registry §1–§5.
**To Stage C:** GLACIERE and PRISM PROWLER both own a `dashwarn` state with a
`dash` that commits to a locked angle. Different zones, so not a
same-fight uniqueness violation — but it is the clearest cross-boss
homogeneity candidate in the game and Stage C should rule on it.

### UNKNOWN
1. The prison's exact geometry — `{x, y, t, life, held}` is placed at the
   player's position but the closing radius was not read.
2. Whether `azhush`'s aura radius is visible before it lands at all camera
   positions, or whether it can exceed the screen.

### Changelog
| Value | Before | After | Reason |
|---|---|---|---|
| D2 second flier | flier (40,7) | **hopper** (41,11) | registry §6.1 — two disruptors on one screen, on ice, where you cannot stop |
| `ROOMS.D4` | — | the Cold Stacks | zone D had ONE fighting room — the second-hardest kingdom was the thinnest |
| `QUESTS.sage_index` | — | new fetch errand | the Archivist had nothing to ask |
