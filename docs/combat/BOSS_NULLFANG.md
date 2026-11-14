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
| `nf.pounce` | `crouch`→`pounce` | 450 | ballistic body | landing → `stalk` | body | `crouch` ✓ | **450** | amber + flatten silhouette + cue | 1 core | **move** perpendicular; it commits to a launch vector | see §UNKNOWN | `air = 0.70 (p2 0.62) + min(0.12, dist/4000)` s, `vy = −2100·air/2`, `vx = clamp(lead/air, ±760)`; falls through `=` ledges at a player below (2026-09-27, GLOBAL_REGISTRY changelog) |
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

## B7. The template pass (2026-10-08, the Hollow Knight study, plan §3)

NULLFANG already was the template — a recovery after every move, a range-read
deck (swipe < 130 px, coil 170–470 px, perch/roar on clocks) and the hit-group
break — so it is where the other five were measured against. Two defects in its
openings were found and fixed, both by `tests/openings.cjs`
(`pounce>recover`, worst **0 ms** on the base) and pinned by
`tests/guardians.cjs` ("NULLFANG, the landing"):

1. **It landed on the furniture.** The leap led to a player standing at the
   foot of A4's hulk (tiles 36–42), and an 84 px body centred on her came down
   ON the hulk — 70 px over her floor, out of a grounded strike's reach for
   the whole settle. `bossLandClear` now slides the led landing spot back
   along the leap, half a tile at a time, until the body's footprint is clear
   of solid tile over the two rows above her floor.
2. **The anti-wedge watchdog took the window.** It watched x only, so a coil,
   a leap that went straight up (she was standing where it left) and its
   landing settle read as 2.6 s of "no movement" and it wrenched a pounce out
   of the recovery 67 ms in. A vertical move over 24 px now counts as motion.

Across 24 extra seeds (the openings scenarios at 200 and 320 px, both phases)
the worst `pounce>recover` is **600 ms**, median 733.

The break: unchanged (`dazeAt 5`, 1.1 s window, 1.7 / 1.25 s), except that a
Song cast into an already-broken NULLFANG no longer freezes the break's own
clock (`BOSS_SELF_STAG.daze`) — the two used to stack into one long stun.

**Reward check (plan §3.6).** FireDash (`dash`) — the only power the climb
audit (`tests/climbout.cjs`) finds a room gated on (A12), and the crossing for
the dash pit in `tests/secrets.cjs` — plus the **shard** arm, which is the key
to TALONHOST's plating (`BOSS_GATE.brood`). Both matter next; unchanged.

### Changelog

| Value | Before | After | Reason |
|---|---|---|---|
| `TELL_ST` | `/warn\|charge\|crouch\|coil\|lock\|prep\|spin\|gather/i` | `…\|roar/i` | NULLFANG's 500 ms roar inhale had no audio channel. One-channel telegraph on the boss that exists to prove telegraphs are trustworthy. |
| `perch` cue | none | `sfx('tell')` at `t ≤ 0.45`, once | Same defect, opposite fix: the dive's tell is the last 450 ms of the perch, so a state-entry cue would fire a second too early. Hand-cued and declared in `tests/tells.cjs`. |
| A2 second flier | `['flier', 52, 7]` | `['hopper', 52, 15]` | Two disruptors on one screen in the game's second fight. Registry §6.1. |
| A6 second flier | `['flier', 17, 6]` | `['crawler', 16, 12]` | Same, over a spike pit, where being harassed from two angles while airborne cannot be lost well. |
| `nf.stalk` gait (a7c2bb7, 2026-10-04) | one prowl state, `vx` set instantly to 165 (p2 210) | new `run` state at `adist > 520` (back to `stalk` below 370), pace 285; `vx` eases toward the pace at ≤ 1050 px/s² | The lion-studio gallop strip needs a gait to play on, and an instant speed change read as a sprite sliding rather than a body accelerating. Release note: `docs/lion-studio-2026-10-04/README.md`. |
| `nf.swipe` phase-2 follow-up (a7c2bb7) | 0.24 s, contact at `t ≤ 0.18` (0.06 s in) | 0.48 s, contact at `t ≤ 0.36` (0.12 s in); the first swipe is unchanged | The second blow is the authored heavy rake: a longer, heavier strike than the first. Damage and hitbox unchanged. |
| `nf.recover` → `idle` delay (a7c2bb7) | `rnd(0.35, 0.55)` | `rnd(0.30, 0.45)` | The sibling's release note says it was trimmed so the new eased acceleration stays inside the punish-window limits. It shortens the post-landing window by 0.05–0.10 s; `tests/openings.cjs` is the measure that it still fits. |
| `nf.pounce` landing spot (2026-10-08) | the led point, whatever is there | slid back along the leap until the body clears solid tile over her floor (`bossLandClear`) | landed on A4's hulk, 70 px over her: `tests/openings.cjs` pounce>recover worst 0 ms |
| anti-wedge watchdog (2026-10-08) | "moved" = \|Δx\| > 10 px | \|Δx\| > 10 px **or** \|Δy\| > 24 px | a straight-up leap + settle read as a 2.6 s wedge and stole the window (67 ms) |
| Song stagger during `daze` (2026-10-08) | froze the break's clock (stacked) | the break keeps counting (`BOSS_SELF_STAG.daze`) | no stunlock by stacking two windows |
| facing (2026-11-13) | `face` re-aimed every frame in `idle`/`stalk`/`perch`; `faceVis` chased it at 5.5/s while attacks began and leaps launched | one committed pivot at 4.76/s (0.42 s, the filmed take's length); nothing re-aims it while it plays; no wind-up begins and no leap leaves the ground until it has landed | Filmed on 3960cef191f9: the spring to a ledge behind it launched facing her and mirrored in the air; `tests/lion-motion.cjs` counts 2 backward launches and 34 mid-turn wind-ups in 70 s on that build, 0 and 0 now. creature-motion-combat §3. |
| `nf.pounce` after she crosses under the coil (2026-11-13) | launched backwards at coil end, the picture flipping in flight | **replant**: one pivot on the ground, still coiled and amber, flash and cue re-fired, then the leap — **+440 ms of tell** (1000 → 1440 ms measured). A second crossing is behind it: it leaps a body-length along its own line | A readable redirection instead of an unreadable one. The opening is unchanged; she buys warning, not a free miss. |
| being crossed twice with no attack between (2026-11-13) | turned again, and again | answers with `nf.roar` (same 500 ms inhale, same harmless 250 px shove, both sides) | A boss that must finish turning before it acts could be switched off by dancing under it. The roar needs no facing. |
| `idle` → `swipewarn` (2026-11-13) | via one frame of `stalk` | direct, same priority order (null field, ambush, then the swipe) | One cell of mid-stride prowl flashed between the standing lion and every swipe (22 flashes in 70 s). 16 ms sooner. |
| `nf.pounce` → `nf.swipe` chain (2026-11-13) | `recover` 360 ms → `idle` 300–450 ms → prowl | if she is within 135 px and in front when the settle ends, `recover` → `swipewarn` directly, full 500 ms tell | **opening after a pounce that lands beside her: 327 ms (one hit), was 627–777 ms.** The lion no longer hands the fight back after its biggest move; staying to trade is a choice. Out of reach or behind it, nothing changes. |
| `nf.swipe` p1 rest (2026-11-13) | `idle` 450–700 ms | 400–620 ms | pacing only; the swipe's own opening (its 240 ms follow-through + this idle) stays above 600 ms |

### The motion and effects pass (2026-11-13)

**Art.** Two new filmed takes, cut by `tools/lion-studio.py` from Seedance 2.5 masters in `assets/source/beast/studio-2026-11-13/` (prompts and job ids in its `jobs.json`): `studio-turn.webp` — an 18-cell planted pivot through the front, LEFT→RIGHT, played mirrored for the other way, replacing the squeezed side view and the swapped-in front composite — and `studio-idle.webp`, a 24-cell four-second standing loop replacing one still under a scale wobble. Both are assistant-reviewed and **await the owner's eye**.

**One animal across every take.** Each take is its own generation and came back with its own exposure (plating mean 106 on the pounce, 148 on the roar) and its own placement in the cell (the standing lion 25.7 px right of centre in the pounce, 1.7 in the stalk). The derivation tool now steadies each take's exposure frame to frame, matches every take to one reference tone curve (`studio-2026-10-04/grade.json`, read from the stalk), and records where the standing animal stands as `anchor`; `BEAST_STRIP.ax` carries it to the renderer. Worst sideways step at a cut: **21.5 px → 9.7 px** (the residue is the landed stretch against the stand, which has no frames between them). The roar could not be re-keyed from its master with the recorded settings, so the delivered strip was regraded in place; its keying is unchanged.

**Effects.** `js/fxgl.js`: the fight's rings, roar waves and hits are fragment shaders on one small WebGL canvas composited into the world where the Canvas rings used to draw. Shock bands with a gaussian body, a hot core and noise breakup; ground that cracks alight under a landing and cools; four swept claw arcs; a gather that pulls light inward through the coil; a hit light with a fast attack and shaped decay. The simulation owns every clock; with no GPU the Canvas rings draw as before. Glowing particles are velocity streaks instead of blurred squares.

### The pressure pass (2026-11-14, owner: "not challenging… not exciting", then "finish it")

Nothing here shortens a tell or touches HP or damage. The fight is harder because the lion strings its moves together and stops standing around; every link in a chain keeps its full wind-up and every chain ends in an opening.

| Value | Before | After | Reason |
|---|---|---|---|
| `nf.swipe` phase 1 follow-up | one paw, then rest | **the heavy rake follows if she is still within 150 px and in front of it when the first paw ends** — full 500 ms tell. Step out and nothing follows | A conditional chain: the first paw asks whether she is leaving. One paw / long rest / one paw was a metronome she could trade into forever. Phase 2 still always doubles. |
| `nf.swipe` phase 1 rest | 400–620 ms | 340–520 ms | less standing; `swipe>idle` measured: worst 350 ms, median 467 (floor 250) |
| `nf.pounce` phase 2 second leap | lands, settles, idles | **if she is at pounce range (170–470 px) and in front when the landing settles, it coils again: 750 ms** (≥ the 700 ms heavy-tell floor), flash and cue as the first — once per pair; skipped after two landed blows in a row (cold dice) | "It lands and goes again." The pair ends in the ordinary settle and rest. |
| after `nf.roar` | `stalk` 0.6–1.0 s before it may choose | 0.2–0.35 s | the shove has just thrown her to pounce range; a lion that roars and then strolls has wasted its roar |
| prowl / run speed, phase 1 | 165 / 285 px/s | 180 / 300 | closes the gap sooner; phase 2 prowl (210) unchanged |
| first decision after an idle, phase 1 | 0.4–0.8 s of prowl | 0.32–0.62 s | — |

Measured after the pass (`tests/openings.cjs`): `pounce>recover` worst 700 ms / median 800; `dive>recover` worst 667 / median 750; `swipe>idle` worst 350 / median 467 — every move still opens for at least one hit and none is a gift.

**The roar is re-filmed** (2026-11-14): the first take was shot over a lit floor and its cut-out lost chunks of the mane and legs. The new take is on clean black, from the same standing frame as the turn and the idle, cut to the same three roles the fight times it by (cells 0–7 inhale, 8–18 the roar, 19–29 settle). Awaiting the owner's eye.

**The turn is re-filmed from a lion (2026-11-14).** The owner, on the first take: *"He is turning as if it's a 3D object just rotating like a paper, instead of an actual lion turning around."* It was a turntable — one rigid figure revolving through the front — and no animal turns that way. He asked for a video of a lion turning round, replicated in metal. No freely licensed side-view clip of one exists in the stock libraries searched, so a realistic lion performing the turn was generated as a **motion reference** (`turn2-reference-lion.mp4`, never shipped), and the mechanical lion was filmed performing it (`turn2.mp4`, Seedance 2.5 with start frame, mirrored end frame and the reference video). What plays now: the head swings away first, the spine curls after it, the forepaws step round one at a time, the hindquarters walk the arc through a rear three-quarter view, the tail whips across last, and it settles onto the mirrored stand. 24 cells (`BEAST_TURN`), the first on the standing frame and the last within IoU 0.89 of its mirror. Four steps squeezed into 0.42 s read as a blur, so the turn is **0.52 s** now (`faceVis` at 3.85/s) and the replant during a coil buys 0.54 s instead of 0.44. The eye map carries no eye for the ten cells where the face is behind the mane (`tools/eyespecs.cjs`). The rejected take stays in the archive as `turn.mp4`. Assistant-reviewed; **awaits the owner's eye**.

**Solid, and on the ground (2026-11-14).** The owner: *"why isn't it opaque enough? feels like Nullfang is translucent"* and *"cracking floor looks fake and not blended with terrain."* Both measured, both fixed, both held by `tests/solid-bodies.cjs`.

- **Lit through, not see-through.** Drawn straight onto a flat colour the lion was already solid. In the frame it was drawn into the world and the world was then finished on top of it — additive light pools (it carries a 180 px one of its own), a bloom that adds a blurred copy of every bright thing over itself, the zone's colour wash. Its darkest twentieth went from luminance 44 in the art to 88 on screen and its ivory (117,102,99) came out grey-green (151,155,146): shadows lifted to the colour of the fog behind it. The hero never had this — she is drawn after the grade. Bodies now **keep their pigment** (`js/foeread.js` `FOE_PIG`): the rim's stencil marks each body, the frame under those stencils is copied aside after the last thing the world draws on a body and before the first thing that lights it, and laid back after the grade (with the effects layer laid over it again, so a claw arc is not cut out by the body). It applies to every rimmed machine in CLAWBYTE, not only this one. Light pools now move the lion's pixels by 1.8 luminance where they moved them 14.2.
- **A window through the chest.** `tools/lion-studio.py` called anything darker than its threshold background if a dark path reached the border, and a machine has dark insides: for the whole swipe wind-up the room showed through the shoulder socket behind the raised foreleg. A second, much lower key now says what is truly studio black; what lies between the two keys is the body's own shadow and is kept where plating walls it in on at least 15 of 16 sides (so the space under the belly stays open). All nine strips were re-derived from their masters with their recorded times; anchors unchanged.
- **Ground effects on the ground.** The landing's wave and cracks were ellipses — a ring on a floor plane a side view does not have, hung at one height over a meadow that rises and dips. They are drawn as 64 columns each standing on its own piece of the surface a body stands on (`fxWalk`: outward from the blow, climbing hills, stopping at a drop): the wave is two fronts running apart along the ground, the cracks are dark fissures with a hot seam running down into the soil, cooling to a scar. Every guardian's wind-up floor light was the same ellipse and follows the terrain now (`tellFloorLight`), from the floor under a body that is in the air.

**A bug this pass shipped and then removed (2026-11-14).** `stalk` still carried a patrol's reflex — `face *= -1` on any side contact. While facing was re-aimed every frame it was overwritten before anyone saw it; once a turn became one committed pivot it was not. Standing in the meadow's dip (x 620, a tile below the arena floor) with her beyond it, every step was a side contact: the lion pivoted away, pivoted back, was counted as danced-around, and roared — 11 turns and 2 roars in 7 s, never coiling (`tests/lion-motion.cjs`, on build 4327eed76e82, which was live for under an hour). The line is gone: `lookAt()` owns its facing. The film that found it is `tools/lionfilm.cjs --attack`.

