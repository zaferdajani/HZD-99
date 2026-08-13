# BOSS_<NAME> — template

Copy this file, do not edit it. One agent, one file, exclusive write access.
Read `GLOBAL_REGISTRY.md` first; it is frozen. Timings in **ms** with `f@30`
where useful — this engine has no frames (see `CURRENT_STATE.md §0`).

---

## Assignment

| | |
|---|---|
| Kind / name | |
| Zone | |
| **Difficulty slot** (from registry §4) | |
| ID prefix (registry §3) | |
| Palette allocations used (registry §2) | |
| Art | |
| State machine | `js/entities.js` line — |

State the slot in one sentence: *what a player should be able to say about this
fight that they cannot say about any other fight in the game.*

---

## B1. Move table

`opening_ms = recovery_ms − 33`

| id | state | startup ms | active ms | recovery ms | hitbox | tell state | tell ms | tell channels | dmg | intended_counter | opening_ms | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | | | |

`intended_counter` must be one of: **move / jump / dash-through / out-range /
bait-and-punish / interrupt**. Not block, not parry — they do not exist.

### B1 audits — run both, report here

**Moves with empty or ambiguous `intended_counter`:**

**Moves with `opening_ms ≤ 0`:** (a boss may have at most one, and only if it is
repositioning or a phase transition dealing no damage)

**Wind-up states whose names do NOT match `TELL_ST`** — these get no audio cue
and are silently one-channel telegraphs:

---

## B2. Opening design

For each opening, say which mechanism it uses and show the arithmetic.

| Move | Mechanism | The design, with frame math |
|---|---|---|
| | conditional / specific / greedy | |

- **Conditional** — the opening exists only in a context.
- **Specific** — only one counter works, so the player must *identify* the move.
- **Greedy** — the window fits exactly two hits and tempts three.

At least one opening in every fight must be **greedy**, because greed is where
CLAWBYTE's difficulty can honestly live (openings here are structurally generous;
see registry §1).

---

## B3. Phase structure and teaching

| Phase | HP threshold | Moves added | removed | modified | Arena change | **What it teaches** |
|---|---|---|---|---|---|---|
| | | | | | | |

### Teaching pass

| Phase | Death #1 | Death #3 | Death #10 |
|---|---|---|---|
| | | | |

If a phase teaches nothing on repeat attempts it is a random number generator.
Say so and redesign it here.

### Fairness contract

Tick per phase, with the evidence:

| Phase | ≥1 guaranteed punish | no unreactable damage | no transition punishing mid-commitment | every damage source visible first |
|---|---|---|---|---|
| | | | | |

---

## B5. Telegraph render directives

Per `CURRENT_STATE.md §6`, this repo renders telegraphs procedurally; there is no
per-move frame table for the engine to display. So each move ships a directive
the renderer can consume, not a sprite sheet.

| id | Silhouette delta | Hue (registry §2) | Particle signature | Audio | Recovery read |
|---|---|---|---|---|---|
| | | | | | |

**Recovery read** is the most commonly skipped and the most important: what
visibly changes to announce that the opening is open? If recovery looks like
active, the opening you designed is invisible and the fight reads as unfair.

**Verification** — at 960×540, in motion, not zoomed:

| id | reads at native size | distinct from every other tell in THIS fight | amber used only while winding up | verdict |
|---|---|---|---|---|
| | | | | |

### Authored-art ledger

Only for art with a real render path (parts atlases, turnaround sheets).

| asset | move ids | prompt | generated | verified | status |
|---|---|---|---|---|---|
| | | | | | |

---

## B6. Close-out

### INTERFACES
Consumed from the registry:
Needed from another subject:
**Registry ambiguities — flagged, not resolved:**

### UNKNOWN

### Changelog
| Value | Before | After | Reason |
|---|---|---|---|
