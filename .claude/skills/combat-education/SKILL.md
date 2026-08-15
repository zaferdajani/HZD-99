---
name: combat-education
description: How the game teaches fighting — tutorialization of combat verbs, first encounters as lessons, escalation of reads across zones, and death as curriculum. Use when placing a new enemy or mechanic in the world, when players report not understanding a fight, or when designing what each zone teaches before its boss demands it.
---

# Combat education — the game is the teacher, the boss is the exam

Difficulty the player was never taught is not difficulty, it is a paywall paid
in deaths. This skill is the curriculum side of the combat family: what gets
taught, where, and how to verify a lesson landed without a tutorial popup
doing the teaching.

The tutorial arc that exists (TUT_ROOMS/TUT_STEPS in js/game.js — wake, walk,
gate, jump) teaches MOVEMENT. This file is about teaching COMBAT the same way:
by arranged encounters, not by text.

---

## 1. The teaching chain — every mechanic, in order

A combat mechanic enters the game through four stations, in world order:

1. **Safe read** — the player SEES the threat shape where it cannot hurt them:
   a wolf pouncing at an NPC barricade, a turret sweeping a pit they haven't
   crossed. Cost of the lesson: zero.
2. **Cheap rehearsal** — the shape, live, in isolation, from the weakest
   enemy that can carry it, in a room with room to run. Cost: chip damage.
3. **Graded use** — the shape inside a pair (encounter-gen's pairing rules),
   where the known answer must now be timed or placed. Cost: real.
4. **The exam** — the zone boss uses the shape at its zone's rung
   (boss-openings §3). Nothing appears in a boss that skipped stations 1–3
   in that zone or an earlier one.

Audit method: for each boss move, name the room where its shape was rehearsed.
`docs/combat/ENEMY_MATRIX.md` maps enemies to shapes; the gap you find is a
missing lesson, and the fix is placing a rehearsal enemy, not nerfing the exam.

## 2. Wolves are the primer — protect their job

The first fight (wolves, zone A) carries the whole alphabet's first letters:
a lunge you sidestep, a pack that makes position matter, an Alpha whose howl
is the first interrupt-opening, and taming as the resolution. Any change to
early wolves is a change to the curriculum — check it against stations 1–2
before tuning them for "challenge". Zone A enemies are teachers first.

## 3. Death as curriculum — the #1 / #3 / #10 test, operationalized

combat-design §5 requires each phase to teach on repeat deaths. Concretely:

- **Death #1** teaches the EXISTENCE of a move ("it has a grab").
- **Death #3** teaches its GRAMMAR ("the grab follows the double sweep").
- **Death #10** must not be happening for the same reason as #3. If telemetry
  (docs/combat/TELEMETRY_SPEC.md) shows one move causing deaths long after
  first contact, the move's tell aliases another or its rung outranks its
  zone — a readability bug, never a skill-issue verdict.

The player must always be able to SAY why they died. Unattributable damage —
off-screen hits, overlapping FX hiding an active hitbox (the scratch-effect
bug, task #47, was this) — is an education bug of the first order.

## 4. Teaching harder reads — how lessons escalate between zones

Each zone re-teaches the previous zone's shapes one rung up (boss-openings
§3), and introduces at most TWO new shapes. More than two new shapes per zone
and the exam tests vocabulary the player is still memorizing.

The escalation must be visible-first: the first enemy in zone N+1 that uses a
known shape at the higher rung should show it in a station-1 or -2 context
again — one room, one cheap rehearsal — before it appears in pairs. The
player's reward for zone N is recognizing the shape instantly; the new zone
charges only for the new rung.

## 5. Teaching new verbs (crystal arc and after)

When SHE gains a verb (crystal slash types, boomerang throw, back-jet boost),
the curriculum inverts — the game must teach the verb, then pose questions
only that verb answers:

- the verb arrives in a safe room, with a target dummy or breakable that
  demands it once (the gift is station 1+2 in one place);
- the next combat room contains an enemy that is MERELY EASIER with the verb;
- only a zone later may a door/enemy REQUIRE it (the four double-jump-gated
  doors pattern). A verb required in the room after its gift punishes players
  still binding it to muscle memory.

Per skill-tree node: one line in its doc naming the room where it is taught
and the first room where it is required. Nodes with no such rooms are stat
noise, and stat noise dilutes the tree the owner asked for.

## 6. Verifying a lesson landed

- Harness: drive a scripted player through the teaching room and assert the
  lesson is UNMISSABLE — the safe-read enemy performs its shape within the
  room's crossing time; the rehearsal room's exit only opens after the shape
  has fired once (TUT_DOOR-style fence, already the house pattern).
- Telemetry: per-move death counts, bucketed by encounter number with that
  move. A flat curve (deaths not falling with exposure) marks a move as
  unlearnable — route it back through §3.
- On any player report of "unfair": find the station where the chain broke
  (was it ever safely shown? rehearsed? paired before examined?) and fix THAT
  station. Tuning the exam is the last resort, not the first.
