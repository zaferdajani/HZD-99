# THE SWIRL — the two-hand technique, and the window it leaves open

The purifier is one blade in two halves. `docs/combat/` already carries the
boss side of every fight; this is the hero side of the move that arrives when
she is holding both halves at once — what it does, what it costs, and why every
number in it is the number it is.

Read `HERO_ANSWERS.md` first if you are here to change a boss. Read
`GLOBAL_REGISTRY.md` if you are here to change a value. Nothing below was
guessed: every figure is read out of `js/entities.js` and measured live by
`tests/twin.cjs`.

---

## 1. What it is, in one paragraph

With **one** half of the purifier, holding attack and releasing spends 25 volts
on the **burst** — a single 2.6× shove, radius 128 px, everything in the circle
thrown outward, over in a moment.

With **both** halves the same input does something else entirely. She comes up
onto one toe and *turns*, and the two crystals draw a five-petal flower in the
air around her: **four passes over 640 ms inside a 62 px ring**, each pass
lifting what it hits rather than throwing it away. When she lands, the blade
stays **split for six seconds** and her ordinary combo swings **both** — that is
the two-hand technique itself, not a one-off flourish. At the end of the window
the halves lock again with a chime.

The fantasy arrives in that order on purpose: she finds the second half and can
fight with the *pair*; **joining** them permanently is the thing she grows into
later, not the thing she is handed.

---

## 2. Frame data, in ms

Timings are floats in seconds in the code; here they are in ms per the house
rule (`SIM_STEP = 1/30`, no frame integers).

| | Burst (one half) | **Swirl (both halves)** |
|---|---|---|
| Commitment | hold 600 ms, release | same |
| Cost | 25 volts | 25 volts |
| Startup | 0 | 0 |
| Active | one instant | **640 ms**, sampled every **160 ms** → **4 passes** |
| Recovery | none (`atkCD` untouched) | **300 ms** floor on `atkCD` |
| Radius | 128 px | **62 px** |
| Damage | 2.6× once | **0.95× × 4 = 3.8×** if the target stays for all four |
| Volts returned | 11 per target | 4 per target **per pass** (16 over four) |
| Knockback | 420 px/s outward, −180 up | 120 px/s outward, **−60 up (a lift)** |
| Leaves the floor | no | **yes** — `vy` clamped to ≤ −110 |
| Camera | `cam.shake = 13` | **none** |

**The opening equation, applied to her.** The swirl is the only charged move in
the game that gives her real recovery: `opening_ms = 300 − 33 = 267 ms` in which
she is standing there having just done something loud. That is deliberate and it
is the whole balance of the move — see §3.

---

## 3. Why these numbers

**Radius 62, not 128.** The burst already owns "clear the screen". A second move
that also cleared the screen, only prettier, would be the burst with new
particles — which is the exact failure the combat skill calls out (a "new move"
that is a burst with different particles, one hit, same reach, no cost). Halving
the radius is what makes the swirl a *different question*: it does far more to
something that stays and far less to something that leaves.

**Four passes at 160 ms, not one big hit.** Splitting the damage across time is
what turns a radius into a **position**. The window fits three passes
comfortably and tempts you to stand there for the fourth — the **greedy axis**
from the combat skill, which is the axis this game has, because her generous
openings make discipline the scarce resource, not reaction speed.

**The pass LIFTS instead of throwing.** `vy = min(vy, −60)` with only 120 px/s
of outward push, against the burst's 420/−180. A thing juggled inside the ring
is still inside it on the next pass. If the swirl threw like the burst, pass one
would empty the ring and passes two through four would hit nothing — the move
would read as four hits and pay as one.

**No `cam.shake`.** The combat skill's camera rule: never shake through a frame
the player has to read. This is a 640 ms move the player is meant to *watch* and
time the end of. The flash (0.4) and the expanding ring carry the weight instead.

**300 ms recovery.** Without it the swirl is strictly better than the burst at
the same price and the burst stops existing. With it the choice is real: burst
when something is *approaching*, swirl when something is *committed*.

**Six seconds of twin.** Long enough to be a phase of play (roughly three full
combos) rather than a stinger on the end of the animation, short enough that it
is a thing you spend rather than a thing you have.

**The twin swing widens; it does not lengthen.** In `hitbox()` the twin
multiplier `tw = 1.45` is applied to `half` only, never to `R`. Measured:
**81 px → 117 px wide, centre unchanged**. A second sword buys **coverage**, not
reach — a chain that used to catch one thing in front of her now sweeps a wedge
either side. Letting it reach further would have quietly rewritten every
spacing in the game, which is a boss-design change disguised as a hero-art
change.

**A chime when the window closes** (`sfx('crystalJoin')`). She is never quietly
weaker than the player thinks she is.

---

## 3a. The cue, and why it is not the burst's

The swirl deliberately does **not** reuse `chargedHit`. That cue is a shove: a
70 Hz sawtooth falling to 30 under a hiss, over in an instant. A move that looks
like a dance and sounds like a punch reads as a reskin, however good the art is.

`crystalSwirl()` in `js/audio.js` is built on the **move's own clock** — four
whooshes and four rising notes at `SWIRL_STEP`, the same 160 ms spacing as the
damage passes:

| | |
|---|---|
| The lift | 240 Hz triangle sweeping **up** to 620 (the burst sweeps 70 **down** to 30) |
| The run | G5 · B5 · D6 · G6 at 0 / 160 / 320 / 480 ms, one per pass |
| The sparkle | a **fifth** above each note, not an octave — 784 doubled is 1568, which *is* the fourth note, and a harmonic sitting on a later note makes the phrase unreadable |
| The settle | 988 + 1480 at 660 ms — after the last pass, so it reads as her landing |

The ear therefore **counts the passes**: you can hear that a fourth is still
coming, which is exactly the information the greedy trade needs. And it settles
on the same pair `crystalJoin` ends on, so the two halves in her paws are
audibly the same instrument as the two halves locking together.

Both claims are measured in `tests/twin.cjs` rather than asserted: each written
note must be the loudest of the four in its own 160 ms window (a narrow DFT, so
the broadband whooshes read through), and the swirl's low:high energy ratio is
compared against `chargedHit`'s rendered in the same run — **0.32 vs 3.62**, an
order of magnitude brighter. Comparing the two cues rather than testing an
absolute threshold is the point: a threshold would only encode whatever this
build happens to do today.

---

## 4. Counterplay — the boss's side

The swirl is the player's move, so the fairness contract runs the other way:
what can a boss do about it?

| Answer | Works because |
|---|---|
| **Leave the ring** | 62 px is small and the move lasts 640 ms. Anything with a dash, a hop or a swoop out of the circle takes one pass and keeps the rest. |
| **Punish the recovery** | 300 ms of `atkCD` with her standing in the open is a real window — the only one her charged attacks have ever offered. |
| **Be a boss** | Bosses and turrets take the damage but not the lift, so the juggle that makes the ring pay against ordinary enemies does nothing to them. Against a guardian the swirl is 3.8× spread over 640 ms of standing still, which is a *worse* trade than the burst unless the guardian is already committed. |

That last row is the design in one line: **against a boss, the swirl is only
correct during a punish window you have already earned.** It does not create
openings; it cashes them.

---

## 5. Changelog — every value, before → after, why

Per the combat skill §8. Nothing here was retuned silently.

| Value | Before | After | Why |
|---|---|---|---|
| `releaseCharged()` with `crystal2` | the burst | **`swirl()`** | The two-hand technique needed to be reachable by an input she already has, not a fourth button. Gated on `crystal2` and on the blade not being airborne (`!G.boomer`). |
| `SWIRL_T` | — | **0.64 s** | Four passes at 160 ms. Long enough to be a dance, short enough that 300 ms of recovery after it is a cost rather than a death sentence. |
| `SWIRL_STEP` | — | **0.16 s** | Fast enough to read as one continuous turn, slow enough that a target can leave between passes. |
| `SWIRL_R` | — | **62 px** | Half the burst's 128, so the two moves answer different questions (§3). |
| `SWIRL_TWIN` | — | **6 s** | ~three combos: a phase of play, not a stinger. |
| Swirl pass damage | — | **0.95 × `dmg()`** | 3.8× total beats the burst's 2.6× *only* if all four land, which is the greedy trade being paid for. |
| Swirl pass knockback | — | **120 px/s out, −60 up** | A lift, not a throw — otherwise pass one empties the ring (§3). |
| Swirl volts returned | — | **4 per target per pass** | 16 over four passes vs the burst's 11: standing in it is rewarded, consistent with the damage. |
| Post-swirl `atkCD` floor | — | **0.30 s** | The move's only real cost. Without it the burst stops existing. |
| Swirl `vy` | — | **≤ −110** | She leaves the floor for the whole move. Reads as buoyant; also stops the ring being spammable from a crouch against a floor-hugging enemy. |
| Swirl `cam.shake` | — | **none** (burst uses 13) | Camera rule: never shake through a frame the player must read. |
| `hitbox()` twin multiplier | — | **`tw = 1.45` on `half` only** | Coverage, not reach. Measured 81 → 117 px, centre unchanged. |
| `swing.twin` / `swingVis.twin` | — | new flags | So the drawing and the hitbox agree. A hitbox the picture does not admit to is the lie the long-rake fix was about. |
| Swirl cue | `sfx('chargedHit')` | **`sfx('crystalSwirl')`** | The burst's thud made a 640 ms dance read as a reskin. The new cue runs on the pass clock so the ear counts the passes (§3a). |
| `crystalSwirl` lift tone | — | **240 Hz → 620, gain 0.030** | First pass was 160 → 420 at 0.055 and left the cue only 1.6× brighter than the burst; the harness caught it. Now 11× brighter, and it sweeps **up** where the burst sweeps down. |
| `crystalSwirl` sparkle | — | **×1.5, not ×2** | The octave of the first note (784 × 2) *is* the fourth note (1568). The harness read the phrase as `0 1 2 1` until this changed. |
| `crystalSwirl` settle | — | **660 ms** | Was 600 ms, inside the fourth pass's window — it read as a fifth turn, to the ear and to the harness. |

**Unchanged on purpose:** `BURST_VOLTS` (25), the single-half burst in every
respect, the crystal chain grammar and its rising finisher, `wield` reach
multipliers, and the thrown-blade path (`G.boomer` suppresses the swirl, so a
blade in flight cannot be danced with).

---

## 6. Where it is measured

`tests/twin.cjs`, eleven checks, driving the real build:

```
node tests/run.cjs twin
```

- the cue runs on the pass clock, and is bright where the burst is a thud
- one half → still the burst
- both halves → the swirl, and she leaves the floor for it
- four passes, not one
- it costs real recovery afterwards (≥ 300 ms, sampled during the move — `atkCD`
  decays, so reading it at leisure measures the decay and not the cost)
- it is a **ring**: something *behind* her takes damage
- the twin window opens, the twin swing is wider, and it reaches no further

---

## 7. The art

Four plates, generated against the canon element so she is the same cat she is
everywhere else (`docs/ART_QUEUE.md`, THE IDENTITY LOCK):

| Plate | Archived at |
|---|---|
| `twin_guard` — both halves up, the ready stance | `assets/source/crystal/` |
| `swirl_wind` — onto the toe, the turn beginning | `assets/source/crystal/` |
| `swirl_peak` — mid-dance, both blades out | `assets/source/crystal/` |
| `swirl_fx` — the five-petal crystalline flower | `assets/source/crystal/` |

The in-game ring is **procedural** and drawn from that last plate's shape: a
five-petal rose curve, additive, squashed to `scale(1, 0.46)` so it lies on the
ground plane instead of standing up like a decal. Per the art rules, the crystal
cut is the one channel that stays procedural light rather than a sheet.
