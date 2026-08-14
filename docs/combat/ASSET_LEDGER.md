# ASSET LEDGER — assembled

Stage C. Every combat-relevant asset, what it serves, and whether it has been
verified at native size.

---

## 1. The rule this ledger enforces, restated

`CURRENT_STATE.md §6` records why directive §B5's mechanism could not be used
here: CLAWBYTE renders telegraphs **procedurally** — `TELL_COL` rings,
`drawTurretLock`, `windT` pose deformation, particle signatures — and there is
no per-move animation frame table anywhere in the renderer. Authored art enters
through **parts atlases** (posed by code) and **yaw turnaround sheets** (angles,
not actions). Generating telegraph frames would have produced assets with no
code path to display them: real cost, zero shipped effect.

So the ledger tracks two things:

- **Telegraph directives** — the render spec each move ships instead of frames,
  listed per subject in its own file, verified in the build.
- **Authored art** — the sheets that do have a render path.

A move-table row with no telegraph directive is an incomplete move. There are
none.

---

## 2. Authored art

| Asset | Serves | Size | Origin | Verified | Status |
|---|---|---|---|---|---|
| `roster_8yaw.png` | HZD-99 + 5 minions + 4 bosses, 8 yaw angles | 1254×1254 | earlier session | in-game | shipped |
| `npc_6yaw.png` | 6 machine folk + **the guard**, 6 yaw angles | 900×1365 | this session — `tools/turnsheet.cjs` | `regress`, screenshots | shipped |
| `beast_parts.png` | NULLFANG cut-out rig | 1500×447 | prior | in-game | shipped |
| `eagle_parts.png` | TALONHOST | 1500×575 | prior | in-game | shipped |
| `dragon_parts.png` | FURNACE CHOIR | 1400×972 | prior | in-game | shipped |
| `glaciere_parts.png` | GLACIERE | 1400×725 | prior | in-game | shipped |
| `prism_parts.png` | PRISM PROWLER (both halves) | 1024×916 | prior | in-game | shipped |
| `mother_parts.png` | MOTHER-V | 1024×1086 | prior | in-game | shipped |
| `ceil_{a..x}.jpg` | the roof of each kingdom | 512×152 sampled | this session | `tests/ceiling.cjs` | shipped |
| `slash.png` | the claw arc | — | prior | `slashsnd` | shipped |

### Known compromises, recorded

**The guard's row is mirrored.** It is the only mirrored art in the game.
`tools/turnsheet.cjs` carries the argument in full: the generator would not
render the other profile across five attempts, and a guard facing the wrong way
is a *gameplay* defect — where its shield points is the whole fight — while a
guard lit from the wrong side, on flat gunmetal, is very nearly nothing. The
compromise is baked into the asset by the tool, where it is visible, rather than
hidden as a runtime branch that would quietly become the general case.

---

## 3. The 3D restyle pipeline

`tools/bossparts.cjs`. Built and proved end to end on NULLFANG's full figure.

**Why it is not simply an image-to-image pass on each atlas.** The rect tables
(`BEAST_P`, `EAGLE_P`, `DRG_P`, `GLC_P`, …) are absolute pixel coordinates *and*
pivots — `BEAST_P.head[2] / 2` is where the neck joins. Hand a model the whole
sheet and ask for "the same but smoother" and it returns something handsome with
every part slightly moved, which in game is a boss whose head has come off.

Three safeguards:

1. It **verifies its rect table against the game source** before doing anything.
   The table is a mirror, and a drifted mirror would composite a boss out of the
   wrong slices — damage invisible until the thing animates.
2. The fit is **bounding box to bounding box**, not frame to frame. Where a part
   sits *inside* its rect is the rig, so a restyled head merely centred
   differently in the same rectangle is a head mounted in the wrong place.
3. A part with no restyled counterpart is **copied through untouched**, so a
   partial pass is safe and the whole thing is re-runnable.

**Prompt finding, recorded because it cost two attempts:** the reference pulls
*style* as hard as it pulls *shape*. Asking for "the same but rendered in 3D"
returns cleaner pixel art. The two must be separated explicitly — *"use the
reference only as a blueprint for shape, stance and where the lights go; do not
copy its rendering style"* — and the target medium named concretely.

| Subject | Parts | Restyled | Status |
|---|---|---|---|
| NULLFANG | 16 | `full` | **proved**; 15 parts remaining |
| TALONHOST, FURNACE CHOIR, GLACIERE, PRISM PROWLER, MOTHER-V | — | — | pipeline ready, rect tables need mirroring into the tool |

---

## 4. Verification standard

Every telegraph directive was checked at **960×540, in motion** — not zoomed. A
tell that only reads at 4× is not a tell. Two harnesses back it:

- `tests/tells.cjs` — every wind-up in every boss carries **both** channels.
  Structural (`windT`) ∪ lexical detection, because neither alone is a superset:
  a lexical rule can only find the wind-ups somebody already thought of, and
  some bosses telegraph with named states that never set `windT`.
- `tests/combat.cjs` — measured tell length per enemy family.

Uniqueness is per fight, not per game. The one deliberate same-fight similarity
(`pp.dash` / `pp.pounce`) is argued in `BOSS_PRISM.md §B5`, and the fix if it
ever fails to read is to exaggerate the poses, never to separate the tell
lengths.
