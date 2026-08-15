---
name: combat-design
description: Design, audit and change CLAWBYTE's fights — enemy state machines, boss phases, telegraphs, punish windows, encounter composition. Use when adding or tuning an enemy or boss, when a fight is reported as unfair or boring, or when composing which enemies share a room.
---

# Combat design, for this game

This is an operating procedure, not an essay. Follow it in order and finish with
the checklist. Every number it depends on lives in `docs/combat/GLOBAL_REGISTRY.md`
and was measured, not assumed — re-measure rather than remember.

**This file is the arithmetic. The rest of the combat family:**

| skill | reach for it when |
|---|---|
| `boss-openings` | designing/auditing punish windows; the owner's opening doctrine and its escalation ladder |
| `boss-movegen` | inventing a new attack — the threat-shape catalog and per-shape counters |
| `boss-patterns` | writing step/deck logic — sentences, weighted decks, the recognizability law |
| `boss-scale` | choosing boss size — giant vs hero-scale duelist vs elite, and what each changes |
| `combat-education` | placing enemies as lessons — the teaching chain, death as curriculum |
| `encounter-gen` | composing whole rooms/waves/mini-bosses — briefs, pairings, threat budget |

---

## 0a. Read the hero's side first

Before designing a boss move, read `docs/combat/HERO_ANSWERS.md`. It is the
matrix of every threat SHAPE against every verb the player actually has, read
out of the code rather than out of intent, and it names the three holes that
every new move inherits:

- **Passing through an attack is optional equipment.** `dash` grants no
  invulnerability without the `phantom` crest (js/entities.js, the hurt guard),
  so for most of a run the only answer to anything is to not be where it is.
- **Expanding areas have exactly one answer** — outrun the radius. Check the
  radius against her real run speed over the real wind-up, or the telegraph is
  decoration.
- **Control effects have no counter at all.** An unanswerable status is the
  fastest way to make a fight feel unfair.

A threat with no answer is a toll. A threat with one answer is a QTE. Aim for
two or three, or write down which future skill is the key to the door.

## 0. What this game is, mechanically

Before designing anything, internalise four facts about CLAWBYTE that make most
general combat-design advice inapplicable:

1. **Time, not frames.** `SIM_STEP = 1/30` with a fixed accumulator; every timer
   is a float in seconds. Work in **milliseconds**. Quoting frame integers here
   is fabricating precision the engine does not have.
2. **No block. No parry.** The defensive verbs are *move*, *jump*, *dash*,
   *out-range*. If you write `intended_counter: block`, you have designed for a
   different game.
3. **Dash has no i-frames** unless the player has the `phantom` crest. A dash is
   displacement. "Dash through it" is only a valid answer if dashing genuinely
   leaves the hitbox.
4. **Her attack startup is zero** and the input buffer is 200 ms. So
   `opening_ms = attacker_recovery_ms − 33`. Openings here are structurally
   generous, and there is nothing meaningful to shrink. **Difficulty in this game
   must come from the nature of the opening, not its size.**

---

## 1. Frame-data literacy, in ms

- **Startup** — from commitment to hitbox live. This is what the player reacts to.
- **Active** — hitbox live. Longer active is more forgiving *for the attacker*.
- **Recovery** — from hitbox off to next action possible. **Recovery is the only
  number that creates a punish window.** A move with a beautiful tell and 60 ms
  of recovery is unpunishable and therefore not a fight, it is weather.
- **Total** = startup + active + recovery.

The opening equation:

```
opening_ms = attacker_recovery_ms − player_fastest_startup_ms − input_latency_ms
           = attacker_recovery_ms − 0 − 33          (CLAWBYTE)
```

**If `opening_ms ≤ 0` the move has no counterplay.** That is a bug regardless of
how the move looks. A boss may have at most one such move, and only if it is a
repositioning or phase-transition move that deals no damage.

Useful reference points, since the player's own recovery sets the scale:
her fastest recovery is **230 ms**. An opening below ~250 ms fits *no* full
attack cycle and is decorative. An opening of 500 ms fits two hits. 900 ms fits
three and is where greed becomes a design tool.

---

## 2. Telegraph budget

- **250 ms is the human reaction floor.** Nothing below it is reactable; it can
  only be *learned*, which is a different (and legitimate) design goal — but say
  which one you are doing.
- Early game: **400–600 ms**. This repo's `TELL_SWIPE = 500 ms`.
- Late game: compress toward **250–350 ms** (`TELL_FAST = 350 ms`) **and
  compensate with distinctness, never with shortness alone.** A shorter tell that
  looks like another tell is not harder, it is unreadable.
- Heavy, arena-changing moves: **700 ms** (`TELL_HEAVY`).

**At least two channels per telegraph.** In this repo:

- **Audio is free and automatic.** Any boss state whose name matches
  `TELL_ST = /warn|charge|crouch|coil|lock|prep|spin|gather/i` fires `sfx('tell')`
  on entry, once. **Name your wind-up states accordingly and the audio channel is
  handled.** A state called `windup` gets no cue; a state called `prep` does.
  This is the single easiest mistake to make in this file.
- **Visual** must be a *silhouette change* plus the reserved hue `TELL_COL`
  (`#ffc24a`). Never a small detail: at 960×540 with the camera moving, detail is
  not information.

---

## 3. Readability at native size

A tell verified at 4× zoom in a screenshot is not verified. Check it the way the
player meets it:

```bash
node tests/combat.cjs        # reports measured tell length per enemy
```

and for anything new, render at 960×540 **in motion** and look at it. If you
cannot name the move from the silhouette alone with the colour removed, the
silhouette is not doing its job and the hue is carrying the whole telegraph.

Uniqueness is **per fight**, not per game. Two bosses may share a tell shape if
the player never sees them together. Two moves in the same fight may not.

---

## 4. Enemy roles

| Role | For | Alone it becomes |
|---|---|---|
| **pressure** | forcing movement, denying the repair hold | a chase |
| **zoner** | denying space, shaping the arena | tedium — you just wait it out |
| **anchor** | a thing that must be dealt with in place | a wall |
| **swarm** | making positioning expensive | noise |
| **disruptor** | breaking the player's plan | a loss of agency |

**Author in pairs, never solo.** A zoner alone is tedious; a zoner behind an
anchor is an encounter. Rules that hold:

- Two disruptors together removes player agency → **forbidden**.
- Swarm + zoner with no cover is unfair damage, not difficulty → **forbidden**
  unless the room provides hard cover.
- Every room states its **intended solution shape** ("kill the zoner first by
  dashing past the anchor") and its **failure mode** if ignored.

---

## 5. Boss phase grammar

**Introduce a moveset → complicate it → recombine it.** Never "same moves, more
damage".

Each phase declares:
- HP threshold, moves added / removed / modified, arena state change
- **one line saying what the phase teaches**
- what the player learns on death #1, #3, #10. *If a phase teaches nothing on
  repeat attempts it is a random number generator, not a boss.* Redesign it.

**Fairness contract — every phase, no exceptions:**
1. at least one guaranteed punish window
2. no unreactable damage
3. no phase transition that punishes a player mid-commitment
4. every damage source visible before it lands

---

## 6. The three legitimate difficulty axes

Because window size is not available to you (§0.4), these are what you have:

- **Conditional** — the opening exists only in a context. *After the third hit of
  a chain. Only while she is on the left half. Only after a parried projectile.*
- **Specific** — only one counter works. A sidestep is not enough; it must be a
  dash-through. This forces the player to *identify* the move, not merely react.
- **Greedy** — the window fits exactly two hits and tempts three. The third is
  punished. **This is the most important one for this game**, because the
  difficulty lives in player discipline rather than reaction speed, and CLAWBYTE's
  generous openings make discipline the scarce resource.

Illegitimate, and to be argued against if requested: raw HP inflation, invisible
tells, unreactable startup, unavoidable random damage.

Note that CLAWBYTE's `foeIQ()` / `foePow()` / `TRAITS` scaling is *not* raw HP
inflation — the same scalar buys reaction quality and target leading as well as
durability. Keep it that way; if a change makes it only add HP, it has become
illegitimate.

---

## 7. Game feel primitives — what this build already has

Do not re-implement these. Audit them and extend.

| Primitive | State | Where |
|---|---|---|
| Input buffer | **200 ms attack, 120 ms jump** | `entities.js` 551, 463 |
| Coyote time | **100 ms** | `entities.js` 693 |
| Hitstop scaled to damage | **50 / 60 / 85 ms** | `entities.js` 763 |
| Knockback | present, per-hit, with recoil on her too | `entities.js` 751–767 |
| Rumble scaled to hit weight | present | `padRumble` |
| Audio per telegraph | **automatic** via `TELL_ST` | `entities.js` `Boss.update` |
| Animation-cancel on hit | **absent** | — |
| Camera pull toward telegraph | **absent** | — |

Camera rule: **never shake during a frame the player must read.** Check this
whenever you add `cam.shake` near a wind-up.

---

## 8. Changing a value

Every gameplay value changed goes in a changelog with **before → after and the
reason**. Do not silently retune. A number with no recorded reason is a number
the next person will change back.

---

## RUNNABLE CHECKLIST

Run this before claiming a fight or enemy is done.

```bash
node --check js/entities.js && node build.cjs
(nohup npx http-server -p 8220 -s >/dev/null 2>&1 &) ; sleep 5
node tests/run.cjs combat regress
```

Then, by hand:

- [ ] Every move has a non-empty, unambiguous `intended_counter`, and it is one
      of: move / jump / dash-through / out-range / bait-and-punish / interrupt.
      **Not** block, **not** parry.
- [ ] Every move has `opening_ms = recovery_ms − 33 > 0`. At most one exception,
      and it deals no damage.
- [ ] Every wind-up state name matches `TELL_ST`, so the audio cue fires.
- [ ] Every telegraph ≥ 250 ms, and ≥ 400 ms if the player meets it in zone A or B.
- [ ] Every telegraph has **two** channels, and the visual one is a silhouette
      change, not a detail.
- [ ] No two telegraphs in the *same fight* read alike at 960×540 in motion.
- [ ] Every phase satisfies all four clauses of the fairness contract.
- [ ] Every phase has one line saying what it teaches, and that line survives
      the death #1 / #3 / #10 question.
- [ ] Enemies are placed in pairs with a stated solution shape and failure mode.
- [ ] No room pairs two disruptors, or a swarm with a zoner and no cover.
- [ ] The zone's threat budget is not overspent, and there is a rest beat after
      every spike.
- [ ] `cam.shake` is not raised during any frame the player must read.
- [ ] Changelog written: every value, before → after, why.
