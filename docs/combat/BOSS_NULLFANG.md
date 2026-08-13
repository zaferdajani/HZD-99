# BOSS_NULLFANG — the reference implementation

> **Deviation from the directive, stated.** §A5 nominates GLACIERE as the worked
> example. This is NULLFANG instead, on instruction to finish one kingdom at a
> time: Zone A is the first kingdom, so doing the reference here means one pass
> produces both the reference *and* a finished kingdom, rather than a reference
> in zone D that nothing yet builds on. GLACIERE is fully measured in
> `CURRENT_STATE.md` and is next.

Everything below is measured from `js/entities.js` case `'glitch'` (line 4061+).
Timings in **ms**; this engine has no frames (`CURRENT_STATE.md §0`).

---

## Assignment

| | |
|---|---|
| Kind / name | `glitch` / **NULLFANG** |
| Zone | A — Scrap Meadows, room **A4** |
| **Difficulty slot** | **Reaction test** |
| ID prefix | `nf` |
| Palette | telegraph amber `#ffc24a`; virus violet `#b06aff` for its own damage |
| Art | `beast.js`, `beast_parts.png` |
| Elemental gate | **none** — `BOSS_GATE` has no entry for `glitch`. It is the first fight and nothing is locked behind an arm you may not have. |

**The one sentence.** *NULLFANG is the fight that proves the telegraph contract
is real.* Every later boss spends the trust this one earns: if a player leaves
A4 believing that amber-plus-a-sound always means "a thing is coming and you
have time", the whole rest of the game can compress its tells. If they leave
believing they were hit by something they could not see, nothing later recovers
it. That is why this fight is wide, slow, and never surprises.

---

## B1. Move table

`opening_ms = recovery_ms − 33`

| id | state | startup (tell) | active | recovery | hitbox | tell state | tell ms | channels | dmg | intended_counter | opening_ms | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `nf.swipe` | `swipewarn`→`swipe` | 500 | 60 ms live at t≤0.18 of a 240 ms state | 500–900 (p1) / 350–600 (p2) | 108 w × (h+28), from `cx+6` forward | `swipewarn` ✓ | **500** | amber ring + paw raise + `sfx('tell')` | 1 core | **out-range** (walk out of 108 px) or **bait-and-punish** | **467–867** / **317–567** | p2 always swipes twice; second tell is full length |
| `nf.pounce` | `crouch`→`pounce` | 450 | ballistic body | landing → `stalk` | body | `crouch` ✓ | **450** | amber + flatten silhouette + cue | 1 core | **move** perpendicular; it commits to a launch vector | see §UNKNOWN | `vx = clamp(dist×1.6, ±640)`, `vy = −(420 + min(260, dist×0.5))` |
| `nf.roar` | `roar` | 500 (inhale) | shove at t≤0.75 | **750** | radius 250, no damage | `roar` ✓ **(fixed this pass)** | **500** | amber + orb in throat + debris lifting + cue | **0 — it shoves, it does not hurt** | **out-range** (be past 250 px) | **717** | also summons one crawler (two in p2) |
| `nf.dive` | `perch`→`dive` | 450 (last 450 ms of a 1000–1400 ms perch) | drop | `stalk` | body | `perch` — **hand-cued** ✓ **(fixed this pass)** | **450** | amber + flatten + cue | 1 core | **move** — it targets where you *are* at commit | see §UNKNOWN | reached only if the room has a `=` run ≥ 3 |
| `nf.nullgrav` | `nullcharge` | 1100 | room-wide gravity change | — | — | `nullcharge` ✓ | **1100** | amber + cue | 0 direct | **adapt** — it changes the arena, it does not strike | n/a | once per fight, below 50% HP |

### B1 audits

**Moves with empty or ambiguous `intended_counter`:** none.

**Moves with `opening_ms ≤ 0`:** none. The smallest opening in the fight is
**317 ms** (the phase-two swipe recovery at its shortest), which fits exactly one
hit — see §B2.

**Wind-up states not matching `TELL_ST` — this pass's two real findings:**

| State | Was | Now |
|---|---|---|
| `roar` | **no audio cue.** 500 ms inhale, visual only. The only sound was `roar_beast`, which plays 500 ms *later* and is the hit, not the warning. | `roar` added to `TELL_ST` |
| `perch` | **no audio cue.** 450 ms flatten before a claws-first dive, visual only. | cue fired by hand at `t ≤ 0.45`, because the tell is the *last* 450 ms of the perch and a cue on entry would warn before there is anything to warn about |

Both were on the boss whose entire job is to prove telegraphs are trustworthy.
`tests/tells.cjs` now drives every boss in the game through its own state machine
and fails on any wind-up state that earns no cue, so this class of defect cannot
return silently.

---

## B2. Opening design

| Move | Mechanism | The design, with the arithmetic |
|---|---|---|
| `nf.swipe` p1 | **plain** | recovery 500–900 → opening **467–867 ms**. Her cycle is 150 active + 230 recovery = 380 ms, so this fits **two hits** comfortably and three at the top of the range. Deliberately generous: this is the move the player learns the contract on. |
| `nf.swipe` p2 | **greedy** | recovery drops to 350–600 → opening **317–567 ms**. One hit is always safe. Two is safe only at the top of the range, and the range is invisible. **This is the fight's greed test** and it is the only one, because a reaction-test boss should teach discipline once, not make it the whole lesson. |
| `nf.roar` | **conditional** | opening **717 ms** — two hits — but the roar *shoves you 520 px/s away* first. The opening exists only if you were already outside 250 px when it landed, or if you spend your dash closing back in. The window is large; reaching it is the cost. |
| `nf.pounce` | **specific** | it commits to a launch vector at `crouch` end. Backing away does not work — the arc is computed from your distance and lands on you. The only answer is **lateral**: move perpendicular to the line. This forces the player to *identify* pounce versus swipe, which share a low silhouette. |
| `nf.dive` | **specific** | targets where you *are* at commit, not where you go. Same answer as pounce, learned in a different plane — which is the point of having both. |

**The greed metric to watch** (§C3): hits attempted per phase-two swipe opening
versus hits safely available. Near 1.0 means the window is too safe and the greed
test is not being taken. Near 3.0 means players are being punished for correct
reads and the recovery range needs widening.

---

## B3. Phase structure and teaching

| Phase | Threshold | Added | Removed | Modified | Arena | **What it teaches** |
|---|---|---|---|---|---|---|
| **1** | 100–50% | swipe, pounce, roar, dive | — | — | perches usable | *Amber plus a sound means a thing is coming and you have time.* One move at a time, one answer each. |
| **2** | < 50% | `nf.nullgrav` (once, at the threshold) | — | swipe **always** doubles; stalk 165→210 px/s; idle gaps 500–900→350–600 ms; ambush cooldown 9–12→6–9 s; pack call 1→2 | gravity altered once | *The same moves, closer together.* Nothing new to read — only less room to be greedy in. |

**The phase-two swipe is the whole design.** It used to fire on a coin flip with
a 220 ms tell. Two faults in one line: 220 ms is below the simple-visual reaction
floor of an adult, let alone the eight-to-ten-year-old this game is for; and
firing half the time means the same read produces different outcomes, which is
the definition of unlearnable. It is now **always** twice, with a full 500 ms
tell on the second, and the pressure comes back as a shorter gap afterwards —
the one lever that costs nothing in readability.

### Teaching pass

| | Death #1 | Death #3 | Death #10 |
|---|---|---|---|
| **P1** | "The paw goes up before it hits." | "I can get two hits after a swipe and then I have to leave." | "I can bait the swipe by standing at 130 px and stepping back." |
| **P2** | "It hit me twice." | "It *always* hits twice down here — the second one is telegraphed too." | "Two hits after the first swipe, one after the second. Greed on the second is what kills me." |

Neither phase is a random number generator: every death in P2 is attributable to
a specific, repeatable read.

### Fairness contract

| Phase | ≥1 guaranteed punish | no unreactable damage | no transition punishing mid-commitment | every source visible first |
|---|---|---|---|---|
| 1 | ✓ swipe recovery, 467 ms minimum | ✓ shortest tell 450 ms | ✓ nothing transitions in P1 | ✓ all four moves telegraph |
| 2 | ✓ swipe recovery, 317 ms minimum — one full hit | ✓ shortest tell still 450 ms; **no tell shortens in phase two** | ✓ `nullgrav` costs 1100 ms of standing still and deals no damage | ✓ the summoned crawler arrives with its own burst and its own tell |

---

## B5. Telegraph render directives

| id | Silhouette delta | Hue | Particle signature | Audio | **Recovery read** |
|---|---|---|---|---|---|
| `nf.swipe` | paw rises above the head line | amber ring | — | `tell` → `atk` | paw hangs extended, body unweighted — clearly not braced |
| `nf.pounce` | body **flattens** to the floor | amber | dust off the hind paws at launch | `tell` → `dash` | airborne, no ground contact: it cannot change its mind and it looks like it cannot |
| `nf.roar` | head rears, throat swells | amber + violet orb | debris drifts **upward**, orb gathers inward | `tell` → `roar_beast` | 750 ms head-down, mouth open, motionless |
| `nf.dive` | flattens on the ledge, eye flares | amber | — | `tell` → `dash` | same as pounce |
| `nf.nullgrav` | rears and holds | amber | — | `tell` → `cast` | 1100 ms fully static |

Note that `nf.pounce` and `nf.dive` deliberately share a silhouette (flatten) and
require the same answer (move laterally). That is not homogeneity — it is one
verb taught in two planes, and the shared read is the reward.

**Verification** — 960×540, in motion:

| id | reads at native | distinct within this fight | amber only while winding up | verdict |
|---|---|---|---|---|
| `nf.swipe` | ✓ paw above head is a silhouette change | ✓ | ✓ | pass |
| `nf.pounce` | ✓ flatten is the largest silhouette change in the fight | ✓ vs swipe | ✓ | pass |
| `nf.roar` | ✓ rear + upward debris | ✓ unique — only move with rising particles | ✓ | pass |
| `nf.dive` | ✓ | **shares with pounce, by design** | ✓ | pass |
| `nf.nullgrav` | ✓ 1100 ms | ✓ | ✓ | pass |

### Authored-art ledger

| asset | move ids | prompt | generated | verified | status |
|---|---|---|---|---|---|
| `beast_parts.png` | all | (pre-existing, earlier session) | prior | in-game | shipped |

No new art was generated for this fight. Per `CURRENT_STATE.md §6`, NULLFANG's
telegraphs are procedural — amber rings, particle signatures, `windT` pose
deformation — and have no per-move frame table for the engine to display.
Generating telegraph frames would produce assets with no render path. The
telegraph specification above **is** the deliverable, and it is verified in the
build rather than in a preview.

---

## B6. Close-out

### INTERFACES

**Consumed from the registry:** player capability sheet (§1) for every opening
calculation; telegraph amber `#ffc24a` (§2); prefix `nf` (§3); the reaction-test
slot (§4); zone A's per-screen ceiling (§5).

**Needed from another subject:** the `crawler` family — NULLFANG's roar summons
one (two in phase two). Its threat value counts against A4's budget while it
lives, and its tell must remain distinct from the boss's own.

**Registry ambiguities — flagged, not resolved:** none.

### UNKNOWN

| # | Value | Why |
|---|---|---|
| 1 | `nf.pounce` recovery on landing | The landing branch was not read in this pass; the state returns to `stalk` but the delay was not measured. Needs a harness that times `pounce` → next actionable state. |
| 2 | `nf.dive` recovery | Same. |
| ~~3~~ | ~~Whether `nf.dive` is reachable in A4~~ | **RESOLVED this pass.** `nf.spring`/`nf.dive` need a `=` run ≥ 3 tiles. A4 builds `hline(g, 4, 7, 11, '=')` and `hline(g, 22, 25, 11, '=')` — two four-tile perches at y=11, one either side of the arena. The move fires, and the boss can reach a perch from anywhere in the room. |

### Changelog

| Value | Before | After | Reason |
|---|---|---|---|
| `TELL_ST` | `/warn\|charge\|crouch\|coil\|lock\|prep\|spin\|gather/i` | `…\|roar/i` | NULLFANG's 500 ms roar inhale had no audio channel. One-channel telegraph on the boss that exists to prove telegraphs are trustworthy. |
| `perch` cue | none | `sfx('tell')` at `t ≤ 0.45`, once | Same defect, opposite fix: the dive's tell is the last 450 ms of the perch, so a state-entry cue would fire a second too early. Hand-cued and declared in `tests/tells.cjs`. |
| A2 second flier | `['flier', 52, 7]` | `['hopper', 52, 15]` | Two disruptors on one screen in the game's second fight. Registry §6.1. |
| A6 second flier | `['flier', 17, 6]` | `['crawler', 16, 12]` | Same, over a spike pit, where being harassed from two angles while airborne cannot be lost well. |
