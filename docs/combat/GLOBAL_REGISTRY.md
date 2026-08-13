# GLOBAL REGISTRY — frozen

**Status: FROZEN.** Read-only for every Stage B agent. Nothing in this file may
be changed by a per-subject agent. If a Stage B agent finds an ambiguity here, it
records the question in its own `INTERFACES` block and Stage C resolves it — so
that the same question does not get six different answers.

The registry exists because combat design contains **globally scarce resources**.
Two bosses both claiming the cyan telegraph, or both designed as "the greed
test", is a defect that no individual agent can see from inside its own task.

---

## 1. Player capability sheet — the basis of every punish calculation

Measured, `js/entities.js`. Full derivation and line numbers in `CURRENT_STATE.md §1`.
**If these are wrong, every downstream frame calculation is wrong and still looks
correct.** Re-measure, do not remember.

| Property | Value |
|---|---|
| Fastest attack startup | **0 ms** — hitbox live on the same step |
| Attack active | **150 ms** |
| Attack recovery (hit 1 / 2 / finisher) | **260 / 230 / 330 ms** |
| Attack input buffer | **200 ms** |
| Combo window | **900 ms** |
| Dash duration / distance / cooldown | **160 ms / ~150 px / 450 ms** |
| **Dash i-frames** | **NONE** (only with the `phantom` crest) |
| Jump buffer / coyote | **120 ms / 100 ms** |
| Hurt i-frames | **1300 ms** (1650 with `reflex`) |
| Block / parry | **DOES NOT EXIST** |
| Base damage | **12** before crest/relic/difficulty multipliers |
| Cores (HP) | **7 / 5 / 5** by difficulty; damage is denominated in cores |
| Repair | **850 ms hold, 33 volts, +1 core**, movement locked, cancelled by damage |
| Input latency floor used in the equation | **33 ms** (one simulation step) |

### The opening equation, for this game

```
opening_ms = attacker_recovery_ms − 33
```

Scale reference: her own fastest recovery is 230 ms.

| Opening | Fits |
|---|---|
| < 250 ms | nothing — decorative |
| 250–500 ms | one hit |
| 500–900 ms | two hits |
| > 900 ms | three hits — greed territory |

---

## 2. Palette registry — a combat contract, not a style choice

Allocated once, globally. A hue in this table means the same thing in every fight
in the game. **Using a reserved hue for anything else is a registry violation and
Stage C will report it.**

| Hue | Hex | Reserved meaning | Already in code |
|---|---|---|---|
| Telegraph amber | `#ffc24a` | **A move is coming. Read it.** Every wind-up, every boss. | `TELL_COL`, `entities.js` 3779 |
| Danger red | `#ff5f6d` | **Unavoidable-if-you-stay.** Area denial: pools, nova radius, the floor going hostile. Not a strike. | player hurt burst, pools |
| Lock cyan | `#8ff6ff` | **You are targeted specifically.** Aim lines, turret locks, tracking shots. | `stormT` burst |
| Purifier violet | `#d24bff` | **Void / null.** GLACIERE's lance, MOTHER-V's null effects. Damage that ignores position rather than occupying it. | lance proj |
| Frost blue | `#a5d8ff` | **Cold.** Slow, freeze, brittle floor. | shard proj |
| Repair green | `#aef7d8` | **Player-positive only.** Never on a hostile effect. | heal burst |
| Reward gold | `#ffd76a` | **Player-positive only.** Scrap, relics, opened things. | scrap, relics |
| Kingdom glow | `PAL[zone].glow` | Ambience. **Never** a telegraph — it is the room's own colour and reads as background. | palettes |

**The two hard rules:**
1. `#ffc24a` appears **only** during a telegraph. If it is on screen and nothing
   is winding up, the contract is broken and every telegraph in the game is worth
   less.
2. `#aef7d8` and `#ffd76a` never appear on anything that can hurt the player.

---

## 3. Move ID namespace

One reserved prefix per subject so telemetry never collides. Format:
`<prefix>.<move>` — lowercase, dot-separated, stable forever once shipped.

| Subject | Prefix | Example |
|---|---|---|
| Player | `pc` | `pc.slash1`, `pc.finisher`, `pc.dash` |
| NULLFANG | `nf` | `nf.swipe` |
| TALONHOST | `th` | `th.dive` |
| FURNACE CHOIR | `fc` | `fc.pour` |
| GLACIERE | `gl` | `gl.lance` |
| PRISM PROWLER | `pp` | `pp.pounce` |
| MOTHER-V | `mv` | `mv.nullwave` |
| crawler | `e.cr` | `e.cr.lunge` |
| guard | `e.gd` | `e.gd.plate` |
| flier | `e.fl` | `e.fl.dive` |
| turret | `e.tu` | `e.tu.burst` |
| hopper | `e.ho` | `e.ho.leap` |
| blob | `e.bl` | `e.bl.pool` |

These are the same ids `G.dmgLog` already keys on (`entities.js hurt(d, fromX, src)`),
so the telemetry in §C3 is a formalisation of something the build already does
rather than a new system.

---

## 4. Difficulty slot assignment — ASSIGNED BEFORE FAN-OUT

**This is the single most important reason not to parallelise blind.** Six agents
independently told to "design a hard boss" produce six versions of the same
fight, because they all reach for the same instincts: tighter windows, more
damage, longer chains.

Each boss owns exactly one slot. An agent designing outside its slot is a
homogeneity defect and Stage C will report it.

| Boss | Zone | Slot | Means |
|---|---|---|---|
| **NULLFANG** | A | **Reaction test** | The teaching fight. Wide tells, clean punishes, one thing at a time. It exists to prove the telegraph contract is real, so every later fight can rely on the player trusting it. |
| **TALONHOST** | B | **Arena / positional** | The fight is about *where you stand*. It flies; the answer is ground control and denial, not out-trading. |
| **FURNACE CHOIR** | C | **Greed test** | Openings that fit two hits and tempt three. The measured greed metric (§C3) is this fight's primary success signal. |
| **GLACIERE** | D | **Pattern memory** | Five named powers on a cycle. Death #3 should be "I know what comes after the shard fan." Reference implementation. |
| **PRISM PROWLER** | X | **Mixup / identification** | Two moves that share an opening pose and require *different* answers. The specificity axis, concentrated. |
| **MOTHER-V** | E | **Resource management** | Volts, repair timing, and the cost of healing under pressure. The final exam: she attacks the economy, not just the body. |

**Enemy family role assignment** (§B4 must use these, not re-derive them):

| Family | Role | Threat value |
|---|---|---|
| `crawler` | pressure | 1 |
| `hopper` | pressure (vertical) | 1 |
| `flier` | disruptor | 2 |
| `turret` | zoner | 2 |
| `guard` | anchor | 3 |
| `blob` | area denial (zoner, static) | 2 |

---

## 5. Threat budget — measured per SCREEN, not per room

The first version of this section set a flat per-room ceiling per zone. Those
numbers were an opinion written before anything was measured, and measuring
promptly showed they were the wrong *shape*, not merely the wrong values:

**CLAWBYTE's rooms are not the same size.** They run from 22 tiles wide to 60,
nearly three to one. Four machines spread down a 60-tile hall and four machines
in a 22-tile box are the same room total and completely different encounters —
and a player never experiences a room, they experience a **screen**: 960 px,
which is thirty tiles.

So the budget is the **worst 30-tile window** in a room. `tests/threat.cjs`
slides a viewport across every room in the game and reports the highest total it
ever contains. Run it; do not estimate it.

### Measured distribution (12 fighting rooms)

```
median peak 6      90th percentile 9      max 10 (D2)
```

| Zone | Peak per screen, shipped | Comment |
|---|---|---|
| A | 1 → 4 → 6 → 5 → 6 | a clean ramp with a rest beat before the boss door |
| B | 4 → 7 | |
| C | 6 → 6 | |
| D | 10 | the game's spike, in its hardest non-final zone |
| E | 5 → 9 | |
| X | 0 | the Prowler's approach is deliberately empty |

**Ceiling: 9 per screen** (the measured 90th percentile), with D2's 10 accepted
as the deliberate spike. A room proposing more than 9 needs an argument, not a
tweak.

A **rest beat** is a 0-threat room. Every zone has at least one and the room
before a boss door is always one — a monotonic ramp exhausts players and
flattens the boss's impact.

### Why this is worth the extra machinery

The per-room number would have passed A2 (total 8, spread over 60 tiles) and
failed A1 (total 4, in 30 tiles) — exactly backwards. The per-screen number
ranks them 6 and 4, which is what they feel like.

---

## 6. Forbidden compositions — global

Binding on every room in every zone.

1. **Two disruptors together.** Removes player agency.
2. **Swarm + zoner with no hard cover.** That is unfair damage, not difficulty.
3. **An anchor placed so that the only route past it is inside a zoner's line.**
   This produces a room with no solution shape, only attrition.
4. **Any enemy whose first appearance in the game is in a room with two others.**
   A new machine gets one room to be read in.

---

## 7. What Stage B may NOT do

- Change any number in §1.
- Use a hue from §2 for a different meaning, or introduce a new reserved hue.
- Design outside its assigned slot in §4.
- Exceed its zone's ceiling in §5.
- Write to `COMBAT_BIBLE.md`, `ENEMY_MATRIX.md` or `ASSET_LEDGER.md` — those are
  assembled in Stage C. **One agent, one file, exclusive write access.**
- Resolve a registry ambiguity. Flag it in `INTERFACES` instead.
