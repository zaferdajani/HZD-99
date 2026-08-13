# ENEMY_<FAMILY> — template

Copy this file, do not edit it. One agent, one file, exclusive write access.
Read `GLOBAL_REGISTRY.md` first; it is frozen. Timings in **ms**.

---

## Assignment

| | |
|---|---|
| Kind | |
| **Role** (registry §4 — do not re-derive) | |
| **Threat value** (registry §4) | |
| ID prefix (registry §3) | |
| Base stats (`EKIND`) | w× h, hp, spd |
| Zones it appears in | |

One sentence: *what this machine is for.* If that sentence is the same as
another family's, one of them is redundant.

And one more: *what it becomes unbearable as, used alone.* Every role has a
failure mode and the room designer needs to know it.

---

## B1. Move table

`opening_ms = recovery_ms − 33`

| id | state | startup ms | active ms | recovery ms | hitbox | tell state | tell ms | tell channels | dmg | intended_counter | opening_ms | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

Include **contact damage** as a move if the body can hurt the player by touch —
it is the most common source of damage in the game and the least specified.

### B1 audits

**Empty or ambiguous `intended_counter`:**

**`opening_ms ≤ 0`:**

**Wind-up state names not matching `TELL_ST`** (silently one-channel):

---

## B4. Composition

### Pairings

| With | Legal? | Reason |
|---|---|---|
| crawler | | |
| hopper | | |
| flier | | |
| turret | | |
| guard | | |
| blob | | |

Check against registry §6 forbidden compositions before writing "legal".

### Rooms it appears in

| Room | Paired with | Threat spend / ceiling | **Intended solution shape** | **Failure mode if ignored** |
|---|---|---|---|---|

The solution shape is a sentence a player could say out loud: *"kill the zoner
first by dashing past the anchor."* If you cannot write one, the room is
attrition, not an encounter.

### Rest beats

Which rooms in this family's zones are deliberately under budget, and after
which spike.

---

## Scaling

How `ZONE_K`, `foeIQ()`, `foePow()` and `TRAITS` change this family between its
first appearance and its last. State what gets *smarter*, not only what gets
bigger — if the answer is only HP, that is illegitimate difficulty and must be
redesigned here.

| | First appearance | Last appearance |
|---|---|---|
| HP | | |
| Speed | | |
| Decision gap | | |
| Target leading | | |
| Traits available | | |

---

## B5. Telegraph render directives

| id | Silhouette delta | Hue (registry §2) | Particle signature | Audio | Recovery read |
|---|---|---|---|---|---|

**Verification** at 960×540, in motion:

| id | reads at native size | distinct within its rooms | verdict |
|---|---|---|---|

---

## B6. Close-out

### INTERFACES
### UNKNOWN
### Changelog
| Value | Before | After | Reason |
|---|---|---|---|
