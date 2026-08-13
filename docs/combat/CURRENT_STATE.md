# CURRENT STATE — measured, not intended

Everything below was read out of the shipping code on the date of this commit.
Where a value could not be determined it says `UNKNOWN — needs measurement` and
appears again in §7. **No number here was invented.** File and line references
are given so every row can be re-checked rather than trusted.

---

## 0. A conflict with the directive, stated up front

The directive is written for a **frame-based** engine and asks for
`startup_f / active_f / recovery_f` in frames. CLAWBYTE does not have frames in
that sense and deliberately does not:

- `js/game.js` — `SIM_STEP = 1/30`, `SIM_MAX = 0.1`. The simulation runs a fixed
  step accumulator; the render rate is decoupled and variable (12–144 fps was
  measured identical by `tests/speed2.cjs`).
- Every timer in the game is a float in **seconds**, decremented by `dt`. There
  is no frame counter anywhere in the combat path.

Reporting frame integers would therefore be a fiction dressed as a measurement —
exactly the failure §A1.4 of the directive exists to prevent. So:

> **All timings in these documents are in milliseconds, with a `f@30` column
> giving the equivalent in simulation steps.** The two are related by
> `f@30 = ms × 0.03`. The opening equation is computed in ms and is unchanged in
> meaning.

This is a notation change, not a weakening. Everything the directive wants from
frame data — punish windows, telegraph budgets, advantage — survives intact.

A second, larger consequence is recorded in §6 (art parity), because it changes
what B5 can honestly deliver.

---

## 1. Player capability sheet — MEASURED

Source: `js/entities.js` class `Player` unless noted.

| Property | Value | f@30 | Line | Notes |
|---|---|---|---|---|
| Attack input buffer | **200 ms** | 6.0 | 551 | `atkBuf = 0.2` on press, spent the instant `atkCD ≤ 0` |
| Attack startup | **0 ms** | 0 | 571 | The hitbox is live in the same update that creates the swing. There is no wind-up. |
| Attack active | **150 ms** | 4.5 | 571 | `swing.t = 0.15` |
| Attack recovery, hit 1 | **260 ms** | 7.8 | 559 | `atkCD`; ×0.7 with the `over` crest |
| Attack recovery, hit 2 | **230 ms** | 6.9 | 559 | |
| Attack recovery, hit 3 (finisher) | **330 ms** | 9.9 | 559 | |
| Recovery *after active ends* | **110 / 80 / 180 ms** | 3.3 / 2.4 / 5.4 | derived | `atkCD − active` |
| Combo window | **900 ms** | 27 | 568 | `comboT`; drops to hit 1 if it lapses |
| Dash duration | **160 ms** | 4.8 | 491 | ×1.2 with the `sprint` crest |
| Dash speed | 940 px/s horizontal, 880 px/s vertical | — | 489 | |
| Dash distance | **~150 px** | — | derived | 940 × 0.16 |
| Dash cooldown | **450 ms** | 13.5 | 492 | |
| **Dash i-frames** | **NONE by default** | — | 898 | Invulnerability during a dash exists *only* with the `phantom` crest. See §5. |
| Jump buffer | **120 ms** | 3.6 | 463 | |
| Coyote time | **100 ms** | 3.0 | 693 | |
| Hurt i-frames | **1300 ms** | 39 | 935 | **1650 ms** with the `reflex` skill |
| Post-hit contact grace | **180 ms** | 5.4 | 817 | after her hitbox connects, that body cannot also contact-damage her |
| Block / parry | **does not exist** | — | — | There is no block button. See §5. |
| Base damage | **12** | — | 323 | ×1.25 `claws` crest, ×1.18 `resolve`, ×1.08 `fang`, ×1.06 `whisker`, × difficulty `pdmg` |
| Finisher multiplier | **×1.35** | — | 741 | **×1.55** with the `calc` skill |
| Claw-mode multiplier | **×1.45** | — | 745 | while `clawT > 0` |
| Volts gained per melee hit | **+11** | — | 755 | ×1.5 with `siphon`, +2 with `silk` |
| Volt ceiling | **99** | — | 324 | 110 with `collar` |
| Repair | **850 ms hold, 33 volts, +1 core** | 25.5 | 641–651 | 28 volts with `coolant`. Movement is locked (`vx = 0`) and it is cancelled by taking a hit. |
| Cores (max HP) | **7 / 5 / 5** by difficulty | — | `DIFFS` 2–6 | Damage is denominated in **cores**, not points. |
| Hitstop, normal hit | **50 ms** | 1.5 | 763 | |
| Hitstop, finisher | **85 ms** | 2.6 | 763 | |
| Hitstop, boss hit | **60 ms** | 1.8 | 763 | |

### Hitbox rects (sprite space, relative to her centre)

`js/entities.js hitbox()`:

| Case | Reach `R` | Half-height | Notes |
|---|---|---|---|
| Grounded, hit 1–2 | 44 | 30 | |
| Finisher (combo 2) | 50 | 35 | |
| Finisher with `reach` skill | 68 | 46 | the long rake |
| Down-attack | 46 | 32 | straight down; diagonal aim is suppressed |

---

## 2. The opening equation, instantiated

```
opening_ms = attacker_recovery_ms − player_fastest_startup_ms − input_latency_ms
```

With the measured sheet:

- `player_fastest_startup_ms` = **0**. Her hitbox goes live on the same step the
  button is spent.
- `input_latency_ms` — the buffer means a press up to 200 ms **early** still
  lands, so the effective latency term is **≤ 0** for a player who anticipates.
  For the equation we use **33 ms** (one simulation step) as the honest floor for
  a player reacting rather than anticipating.

> **`opening_ms = attacker_recovery_ms − 33`**

This is why CLAWBYTE's openings are structurally generous and why difficulty in
this game must come from §B2 conditionality, specificity and greed rather than
from shrinking windows: there is almost nothing to shrink *against*. A boss
recovery of 200 ms is already a real opening here, where in a 12-frame-startup
game it would be nothing.

---

## 3. The telegraph system — MEASURED

CLAWBYTE already has a central, enforced telegraph contract. This is unusually
good and should not be redesigned. `js/entities.js`:

| Constant | Value | Line |
|---|---|---|
| `TELL_SWIPE` | **500 ms** | 3767 |
| `TELL_FAST` | **350 ms** | 3767 |
| `TELL_HEAVY` | **700 ms** | 3767 |
| `TELL_ST` | `/warn\|charge\|crouch\|coil\|lock\|prep\|spin\|gather/i` | 3772 |
| `TELL_COL` | `#ffc24a` | 3779 |

**The enforcement mechanism.** In `Boss.update`, any state transition into a name
matching `TELL_ST` fires `sfx('tell')` exactly once. This means the audio channel
is automatic and cannot be forgotten by a boss author — a genuinely strong piece
of design that satisfies half of the directive's "at least two channels"
requirement for free, for every boss, forever.

The visual channel is **procedural**, not authored frames: `TELL_COL` rings,
`drawTurretLock()`'s narrowing dashed beam, and per-boss wind-up poses driven by
`windT`.

`tests/combat.cjs` already asserts every enemy telegraphs and reports measured
tell lengths. Current output:

```
crawler   telegraphed=true  tell 1.10 s   lunge+recovery
flier     telegraphed=true  tell 1.10 s   dive+withdraw
turret    telegraphed=true  tell 2.27 s   walks
hopper    telegraphed=true  tell 1.47 s   leap
blob      telegraphed=false tell 0        pool
```

**Finding, carried to Stage C:** `blob` reports `telegraphed=false`. Its damage
is the pool it leaves, not a strike, so this may be correct — but it is the one
enemy in the game with no tell and it must be justified or fixed, not left
ambiguous. Assigned to the `blob` Stage B agent.

---

## 4. Zone scaling — MEASURED

`js/entities.js ZONE_K = { A:1.0, B:1.15, C:1.32, D:1.5, E:1.7, X:1.6 }`

Applied to HP and, more weakly, to speed. Measured by `tests/combat.cjs`:

```
crawler  zone A hp 30 spd 62
         zone B hp 35 spd 63
         zone C hp 40 spd 64
         zone D hp 45 spd 66
         zone E hp 51 spd 67
```

Plus a *player-progress* scalar, not a zone one:

- `foeIQ() = clamp(mods×0.11 + bossesWon×0.10 + skills×0.035, 0, 1)`
- `foePow() = 1 + foeIQ() × 0.55`
- `TRAITS = { swift ×1.32 spd ×0.92 hp, tough ×0.9 spd ×1.75 hp, volatile ×1.06 spd ×0.9 hp }`,
  rolled by `rollTraits(iq)`

This is the game's answer to "stronger as well as smarter", and it is already
shipped. It is **not** raw HP inflation in the illegitimate sense: the same
scalar buys reaction quality (`leadX` target leading, shorter decision gaps) as
well as durability.

---

## 5. Two capabilities the directive assumes that DO NOT EXIST

Recorded here because every downstream punish-window and "intended counter"
calculation depends on knowing this:

1. **There is no block and no parry.** The directive's `advantage_on_block` and
   "parryable hue" have no referent in this game. The defensive verbs are:
   *move*, *jump*, *dash*, and *out-range*. Any Stage B agent writing
   `intended_counter: block` has designed for a different game.

2. **Dash has no invincibility frames by default.** `phantom` is an optional
   crest, so a dash is a *displacement* tool, not an *invulnerability* tool. A
   move whose designed answer is "dash through it" is only valid if dashing
   genuinely leaves the hitbox — not if it merely overlaps it faster.

Both are design facts, not bugs, and both are load-bearing: they are why this
game's fights are about **spacing** rather than about timing a defensive button.
Stage B must design inside that, not around it.

---

## 6. Art parity (directive §B5) — a conflict that changes the deliverable

The directive requires every move to ship with generated telegraph / active /
recovery **frames**. CLAWBYTE cannot display them, and this is architectural:

- Boss and enemy telegraphs are drawn **procedurally** — `TELL_COL` rings,
  `drawTurretLock`, `windT`-driven pose deformation, particle bursts. There is
  no per-move animation frame table anywhere in the renderer.
- Authored art enters through **parts atlases** (`beast_parts.png`,
  `glaciere_parts.png`, …) which are cut-out rigs posed by code, and through the
  yaw turnaround sheets (`roster_8yaw.png`, `npc_6yaw.png`) which are *angles*,
  not *actions*.
- Generating per-move frames would produce assets with no code path to render
  them. That is the worst possible outcome: real cost, zero shipped effect.

**Adaptation, per directive §6 ("say so and argue the case"):** B5's intent —
*no move ships spec-only; the telegraph must be authored, verified at native
size, and unique within its fight* — is preserved. Its mechanism changes:

| Directive asks for | This repo delivers |
|---|---|
| Telegraph frames | A **telegraph render directive** the engine can consume: silhouette delta, reserved hue, particle signature, audio cue id |
| Active frames | The existing parts-atlas pose + the hitbox rect it must not exceed |
| Recovery frames | An explicit **recovery read** — what visibly changes to announce the opening |
| Verified at native size, in motion | A Playwright harness that renders the tell at 960×540 in motion and measures it |
| Prompt saved with the asset | Prompt saved in the ledger for the parts-atlas art that *is* authored |

Budget note: the Higgsfield balance at the time of writing is **175.55 credits**.
Per-move generation across 12 subjects would exceed it several times over. Art is
therefore generated where it has a render path, and briefed-but-not-generated
where it does not, with the cost of each pending item stated. Flagged, not
fabricated.

---

## 7. The complete cast — this determines the Stage B fan-out

### Bosses (6)

| Kind | Name | Zone | Art | State machine |
|---|---|---|---|---|
| `glitch` | NULLFANG | A | `beast.js` | `js/entities.js` |
| `brood` | TALONHOST | B | `eagle.js` | `js/entities.js` |
| `atlas` | FURNACE CHOIR | C | `furnace.js` | `js/entities.js` |
| `zero` | GLACIERE | D | `glaciere.js` | `js/entities.js` 4631+ |
| `prism` | PRISM PROWLER | X | `prism.js` | `js/entities.js` |
| `mother` | MOTHER-V | E | `mother.js` | `js/entities.js` |

`BOSS_GATE = { brood:'shard', atlas:'jet', zero:'slag', prism:'frost', mother:'arc' }`
— the elemental plating gate. `glitch` has none: it is the first fight.

### Enemy families (6)

`js/entities.js EKIND`:

| Kind | w×h | HP | Speed | Behaviour (measured) |
|---|---|---|---|---|
| `crawler` | 28×20 | 30 | 62 | notice → turn → coil → lunge → winded |
| `guard` | 30×22 | 44 | 52 | riot plate up; 12% damage through it; plate drops only while winded |
| `flier` | 26×22 | 24 | 120 | station → hold → dive → withdraw |
| `turret` | 28×30 | 45 | 0 | lock (leads the shot) → burst |
| `hopper` | 26×24 | 36 | 180 | crouch → leap → landing shock |
| `blob` | 34×26 | 52 | 30 | drips damaging pools |

**Stage B fan-out = 12 agents.**

---

## 8. UNKNOWN — needs measurement

| # | Value | Why it is unknown |
|---|---|---|
| 1 | Real end-to-end input latency (browser event → simulation step) | Never measured. The 33 ms floor in §2 is one simulation step and is a *lower bound*, not a measurement. Needs a harness that timestamps a synthetic keydown against the step that consumes it. |
| 2 | Per-move hitbox rects for boss attacks | Boss hitboxes are computed inside each state's branch rather than declared. Extracting them is per-boss work and is assigned to Stage B. |
| 3 | Whether `blob` should have a telegraph | See §3. Assigned to the `blob` agent. |
| 4 | Actual player death→retry time | §C4 requires < 2 s. `respawn()` exists but the fade/`deadT` path has not been timed. |
| 5 | Contact-damage hitbox for each enemy body | `aabb(this, player)` uses the full body rect; whether that matches the drawn silhouette per family is unverified. |
