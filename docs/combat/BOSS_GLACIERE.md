# BOSS_GLACIERE

Measured from `js/entities.js` case `'zero'` (search `case 'zero': {`). Timings in **ms**.
Size class: **giant** (boss-scale §1) — a long floating quadruped, 112×62 collider,
drawn 1.9× its collider height. Arena: D3, one screen (32×17), two four-tile ledges
at row 11, floor hole cols 15–17 down to E1 (sealed until `bossZero`).

> **2026-10-08 — the punish-window pass (the Hollow Knight study, plan §3).**
> The B1–B3 tables below are rewritten for it; §B7 is the pass itself, and the
> changelog has every value. In one line: *every power now ends with her
> sinking to hitting height and holding still, a group of six hits drops her
> to the floor, she picks her power from where you stand, and she flies.*

| | |
|---|---|
| Kind / name | `zero` / **GLACIERE, the Frozen Purifier** |
| Zone | D — the Frozen Archives, room **D3** (ice) |
| **Difficulty slot** | **Pattern memory** |
| ID prefix | `gl` |
| Palette | telegraph amber; purifier violet `#d24bff`; frost blue `#a5d8ff` |
| Gate | `slag` |

**The one sentence.** *GLACIERE is the fight you learn by heart.* The sentence
you learn is the same after every power — **dodge it, and she comes down to
you** — and the power she opens with is the one your distance asks for. Death #3
should be "close she fans, far she charges, and after either one she sinks."

---

## B1. Move table

| id | state | tell | active | recovery | tell state | tell ms | channels | dmg | intended_counter | opening_ms |
|---|---|---|---|---|---|---|---|---|---|---|
Recovery is now the same state after every power: **`recover`** — a capped sink
(≤ 600 ms, stiff arrive, must be stopped to count as arrived) to feet 40 px over
the player's own ground, beside her, then a **hold** of the listed length. The
opening column is what `tests/guardians.cjs` measures in a driven fight: frames
after the power releases in which her hurtbox is inside a GROUNDED strike's band
(54 px above the player's feet down to them), up to the next wind-up — worst
sample / median over p1 and p2 at three ranges (one run; the floor it asserts is
600 ms).

| id | state | tell | active | recovery (hold p1 / p2) | tell state | tell ms | channels | dmg | intended_counter | opening_ms (worst / med) |
|---|---|---|---|---|---|---|---|---|---|---|
| `gl.lance` | `lancewarn` | **700** | 1 (p1) / 2 (p2) bolts, 185 px/s, r13, life 4.2 s | `recover` **800 / 700** | ✓ | 700 | amber + **the horn drinks void light** + cue → `cast` | 1 core | **move off the line** — it is aimed once and does not steer | **817 / 1017** |
| `gl.shard` | `shardwarn` | **500** | 5 (p1) / 7 (p2) shards at 350 px/s, 0.19 rad apart, in a two-rank **ripple** 70 ms apart | `recover` **800 / 700** | ✓ | 500 | amber + ice condenses along the spine crystals + cue | 1 core | **out-range or gap** | **733 / 1000** |
| `gl.dash` | `dashwarn`→`dash` | **550** | 620 ms at 640 px/s along a fixed angle, laying a biting ice trail every 70 ms | `recover` **800 / 650**, after braking out of the charge | ✓ | 550 | amber + **squares up and coils, charge line drawn in the air** + cue → `dash` | 1 core | **move perpendicular** — the angle is locked 300 ms before launch | **967 / 1283** |
| `gl.nova` | `novawarn` | **600** | expanding frost ring from the body | `recover` **900 / 750** (was `stagT 550` in the air) | ✓ | 600 | amber + **drops onto the standing frame and gathers** + cue | 1 core | **out-range** — it is reactive, so *do not crowd her* | **833 / 1050** |
| `gl.orbs` | `orbs` | **1000** | 3 (p1) / 4 (p2) void orbs orbit her and fire every 2.1 / 1.5 s for 9 s | `recover` **950 / 750** | — (windT 500) | 1000 | violet + cue → `cast` | 1 core | **avoid the shots; hit her while they orbit** | **900 / 1167** |
| `gl.prison` | `prisonwarn` | **500** | a cage of frozen void around your position, life 2600 (p1) / 3400 (p2) | `recover` **750 / 650** | ✓ | 500 | amber + void gathering at the aim point + cue | positional | **leave before it closes** | **733 / 967** |
| `gl.absolutezero` | `azhush` | **1100** | the hush — be outside the aura when the silence lands; two follow-up columns | `recover` **1000 / 850** | — (windT 500) | 1100 | **the expanding aura IS the tell** + cue | 1 core | **out-range** | **883 / 1233** |
| `gl.datacorrupt` | `dccast` | **900** | your HUD lies; she runs 1.45× while it does | `recover` **650 / 650** | — (windT 500) | 900 | violet + cue | 0 direct | **endure** | forced-state hold 733 |

### B1 audits

**Empty `intended_counter`:** none.
**`opening_ms ≤ 0`:** none. Every power's worst measured window is **≥ 733 ms**
in a driven fight, and every power forced by hand holds **≥ 633 ms** at hitting
height in both phases (`tests/guardians.cjs`, "power by power"). Before this
pass the tightest was the dash at 667 ms — and it was the *only* power with a
recovery; the other seven went straight back to a station 72–183 px over the
floor.
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

**The deck is the content** (was: `alt = cycle++ % 5` → lance, shard, lance,
dash, orbs-or-prison, the same five beats whatever the distance). Weights per
band, recency debt ×0.5 on the last two draws (`bossDraw`):

| power | near < 200 px | mid | far ≥ 380 px | on a ledge |
|---|---|---|---|---|
| shard | **4** | 2 | 0.5 | — |
| lance | 1 | **3** | 2 | +1 |
| dash | 1 | 2 | **3** | +1 |
| orbs | 0.5 | 1 | 2 | (0 while orbs live) |
| prison | 1 | 1 | 1 | +1 (0 while a cage stands) |

Measured (`tests/guardians.cjs`): near draws are about half shards, far draws
lean on the dash, lance and orbs with shards ≤ 12 %. Reactive interrupts (`nova`
on proximity, `azhush` on cooldown, `dccast` once below 40 %) are layered over it
exactly as before.

---

## B3. Phases

| Phase | Threshold | Added | Modified | **Teaches** |
|---|---|---|---|---|
| 1 | 100–50% | the range deck + nova + absolute zero; a recovery after every power | — | *Dodge it, and she comes down to you.* |
| midpoint | 50% | — | the 1.5 s phase stagger now sinks her to hitting height (was frozen in the air) | *the free punish is in reach* |
| 2 | < 50% (phase) / < 40% (`dccast`) | `gl.datacorrupt` once; **two sentences recombined from known powers**: every dash is followed by the shard fan from where the charge ended; at ≥ 380 px the lance is followed by a dash | lance 1→2 bolts; shard 5→7; prison life 2600→3400; holds tighten (table above); she runs 1.45× while the HUD lies | *The same powers, now in pairs — and the opening comes after the second one.* |

**DATA CORRUPTION is the best idea in this fight** — a pattern-memory boss whose
late-game trick is to falsify the instruments, so the memory is the only thing
left that is true.

### Teaching pass

| | Death #1 | Death #3 | Death #10 |
|---|---|---|---|
| P1 | "Something purple hit me." | "Every time she throws something she comes down — that is when I hit her." | "Close she fans, far she charges. I choose which by where I stand, and I stand just outside nova range." |
| P2 | "My health bar was lying." | "The dash always brings the fan behind it — wait for the second one." | "The corruption is free damage if I keep waiting for the sink." |

### Fairness contract

| Phase | ≥1 guaranteed punish | no unreactable damage | no mid-commitment transition | every source visible |
|---|---|---|---|---|
| 1 | ✓ a recovery after **every** power, worst 733 ms | ✓ shortest tell 500 ms | ✓ | ✓ |
| 2 | ✓ same, holds 650–850 ms; chain ends carry the recovery | ✓ **no tell shortens in phase two**; a chained power gets its full tell (`glcCast`) | ✓ `dccast` deals no damage | ⚠ the HUD lies *by design*; the damage sources are all still visible in the world |

---

## B5. Telegraph render directives

| id | Silhouette | Hue | Particle | Audio | **Recovery read** |
|---|---|---|---|---|---|
| `gl.lance` | the horn lowers and **drinks light** | violet gathering at the horn tip | inward | `tell` → `cast` | she drifts back to hover height, horn empty |
| `gl.shard` | spine crystals **rise and condense** | frost blue | ice forming along the spine | `tell` | spine flat |
| `gl.dash` | **squares up and coils**, and a charge line is drawn in the air along `dashAng` | amber line | — | `tell` → `dash` | `recover`: brakes out of the charge, sinks, holds |
| `recover` (every power) | **nose down, legs hanging out of the gallop, a slow heave** (`glcHeroRig` pitched −0.1, tuck 0.14) — low, beside you | no amber (measured cold by `tests/artbible.cjs`) | — | — | **this IS the read** |
| `daze` | out of the air and **down on her hooves on the ice** — the standing assembly, head bowed (`glcFig 'asm'`) | no amber | landing frost | `phase` + `bosshit` + toast | IoU vs flight ≤ 0.90, hooves on the floor ±10 px (`tests/artbible.cjs`) |
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

## B7. The punish-window pass (2026-10-08)

The plan's six fixes, as built:

1. **A recovery after every power** — `recover`, `glcRecover`. Sink ≤ 600 ms
   (arrive gain 8, ≤ 640 px/s), then hold at feet = her ground − 40 px. 40 is
   arithmetic, not taste: her forward swing reaches 54 px above her feet, and
   she is 36 px tall, so the hurtbox is in a grounded strike's reach and the
   underside clears her head. The spot is beside her (`bossRecSpot`: a
   body-width gap), never on her; the level tracks her ground while it holds
   (`bossRecTrack`). Holds in the B1 table.
2. **A stagger after six grouped hits** — `dazeAt 6`, `dazeSpan 3.6 s` (a hit
   stays "recent" for 3.6 s, so two consecutive punishes group; NULLFANG's
   1.1 s would make the break unreachable on a flier that is only in reach
   during recoveries). `daze`: she falls to the floor, **1.8 s (p1) / 1.5 s
   (p2)**, takes ×1.6 damage, plating open whatever arm is worn, cannot break
   again for 6 / 7.5 s. The break shatters live orbs and clears the nova, the
   hush, its follow-up columns and the ice trail (they would otherwise hang
   frozen while her machine is paused). The dash and `dccast` are committed:
   a break requested during them lands when they end.
3. **Move choice by distance and height** — the deck in §B2. **Phase 2 chains
   known powers** — dash → shards, lance → dash at range; full tells on every
   link; only the last link carries the recovery.
4. **Real flight** — `glcFly`: arrive steering, cruise 420 px/s × aggro,
   acceleration 1500 px/s² × aggro; wind-ups brake (`glcBrake`, e^−6..9·dt);
   one integration per frame for every state. She leans into acceleration
   (the weight pass) and banks into her velocity (the roll in
   `js/glaciere.js`), both now fed by a real `vx`.
5. **Reach, not a taller arena** — verified: her hurtbox bottom already sat
   72–183 px over the floor against a 201 px jump apex, so she was never out
   of reach, only out of *grounded* reach. The recovery fixes that where it
   matters; D3 is unchanged. **The phase-change arena beat (ice floor
   shattering) was not built**: it needs a plate (ART_QUEUE) and would put new
   terrain next to the sealed floor hole whose `bossZero` gating is the way
   down to the Nest. Every stagger now sinks her to hitting height instead
   (the midpoint's 1.5 s, the Song's 0.85 s).
6. **Her reward** — the **Kernel Key** breaks the seal in D3's floor (the only
   way down into the Virus Nest, kingdom E) and the **frost arm** is the key to
   PRISM PROWLER's plating (optional X1). Both matter next; unchanged.
   `tests/guardians.cjs` asserts the plating chain and the seal.

### Changelog
| Value | Before | After | Reason |
|---|---|---|---|
| move selection | `cycle++ % 5` (lance, shard, lance, dash, orbs/prison) | weighted deck by range band and ledge height, recency debt ×0.5 (§B2) | plan §3.3: the rotation was learnable and deaf — the same five beats at every distance |
| recovery after lance / shard / prison / orbs / hush / corrupt | none — straight to `idle` (`glcRest` 0.63–0.83 s p1, 0.38–0.53 s p2) gliding back up | `recover`: sink, then hold 800/700, 800/700, 750/650, 950/750, 1000/850, 650/650 ms | plan §3.1: four of five powers had no opening |
| dash recovery | `recover` 700 ms, lerping back up to `hovY` | `recover`: brake, sink, hold 800 / 650 ms at hitting height | it floated out of reach during its own window |
| nova | `stagT 550` (frozen in the air) then `idle` | `recover` hold 900 / 750 ms | the power you crowd her into pays out where you can reach it |
| hit-group break | none | `dazeAt 6`, `dazeSpan 3.6`, `daze` 1800 / 1500 ms, cooldown 6 / 7.5 s, ×1.6 damage, plating open | plan §3.2 |
| idle flight | `x,y = lerp(.., dt*2.6 / dt*2.4)` | `glcFly` cruise 420 × aggro px/s, accel 1500 × aggro px/s², gain 3.2 /s | plan §3.4: accelerate, brake, bank |
| wind-up motion | `vx = vy = 0` on the frame | brake e^(−6·dt) (dash e^(−9·dt), nova e^(−8·dt)) | a flier stops like a flier |
| phase-2 sentences | lance 1→2 bolts, shard 5→7 only | + dash → shards always; lance → dash at ≥ 380 px | plan §3.3: recombine, do not only add projectiles |
| any stagger (Song, midpoint) | frozen where she hung | sinks to hitting height (`bossRecSpot`) | a free punish that needs a jump is not free |
| D2 second flier | flier (40,7) | **hopper** (41,11) | registry §6.1 — two disruptors on one screen, on ice, where you cannot stop |
| `ROOMS.D4` | — | the Cold Stacks | zone D had ONE fighting room — the second-hardest kingdom was the thinnest |
| `QUESTS.sage_index` | — | new fetch errand | the Archivist had nothing to ask |
