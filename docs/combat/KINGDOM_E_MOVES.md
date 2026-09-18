# KINGDOM 5 — THE VIRUS NEST'S OWN MOVES

Owner, 2026-09-18: *"Improve enemy level and skills point with more moves that
need to be created for them with every kingdom."*

The mechanism is the integrator's (`foeLevel` / `foeSkillPts` / `FOE_MOVES` in
`js/entities.js`, measured by `tests/foelevel.cjs`). This file is what kingdom
E built with it. Three moves, `@E`-scoped so no other kingdom sees them, all
three behaviour-complete and measured by `tests/nestmoves.cjs`.

## Why the Nest gets biology and not bigger numbers

Every kingdom before this one has a machine that does a thing. The Nest's
premise — the one MOTHER-V is the end of — is that **the machinery has stopped
being machinery**. So the three moves are not sharper versions of the roster's
existing questions; they are the roster growing tissue. That is also what keeps
them off the guardian's ground: MOTHER-V's vocabulary is the null ring, the
broadcast, the total dark and the tendril grab, and not one of these is a
smaller copy of any of them.

## What the kingdom can afford, and why a 3 lands here

`FOE_ZONE_LV.E === 5`, so a Nest machine has **4 skill points before the run
adds anything** (`foeSkillPts(5)`). A cost-3 row needs 4 points, which needs
level 4 — reachable in kingdom D only after most of a run, and at the Nest's
floor on a fresh save. So `infest` is the first move in the game priced where
one kingdom can pay for it and nobody else can, which is exactly what the
scoped-row mechanism is for.

| move | kind | cost | role | threat | the question it asks |
|---|---|---|---|---|---|
| `thornbed` | `blob@E` | 1 | denial | +0 | *the floor answer was "go over it" — is it still?* |
| `shed` | `guard@E` | 2 | anchor | +0 | *will you pay for the window if you refuse to wait?* |
| `infest` | `snare@E` | 3 | disruptor | +0 | *what are you going to kill first?* |

Threat is unchanged per kind (`tests/threat.cjs`, registry §4): these moves
change what a machine DOES, not how much of a room it is worth, and the room
compositions in `js/world.js` are budgeted on the kind.

## thornbed — the drip takes root

A Nest blob's pool sprouts a barbed stalk. It **rises for `THORN_RISE` (0.5 s)**
— drawn at its true height from the first frame of growth, amber, translucent,
harmless — then is **live for `THORN_LIVE` (1.6 s)**, owning a 26 px column to
36 px above the pool, grounded or airborne alike. One stalk per blob at a time;
it dies with the blob that grew it.

- **The tell is 0.5 s, longer than `TELL_FAST`, on purpose.** The pool it grows
  out of is already under her feet by the time it starts, so the warning has to
  pay for the ground it costs.
- **Why it is not the blob with a bigger pool**: the blob has always been the
  one enemy that punishes standing still, and the answer the game teaches is
  *go over it*. This is the only thing in the game that argues with that
  answer, and it argues for 1.6 s and then stops.

## shed — the plate is grown tissue

The guard asks *can you wait?* and it is the cheapest patience lesson in the
game: the plate is up, hitting it is nearly useless, and it comes down only
while the guard is winded from its own lunge. The Nest guard asks the sharper
version, which is *and if you refuse to wait, will you pay for the window you
make?*

Each hit the plate denies splits the tissue — visibly, a step per hit — and at
`SHED_HITS` (3) the guard **gathers for `TELL_SWIPE` (0.5 s) with the plate
still up**, then the tissue tears loose:

- the **creep**: a low, wide mat of thorn-tissue that **homes** on her at about
  twice the guard's walk for `CREEP_LIFE` (2.4 s), damaging on contact while
  grounded, and dying at a gap. It **cannot be jumped past**, only walked away
  from or out-lived — which is the whole difference between it and the
  Conduits' charge wave (`surge`), a thin fast line that asks "can you be
  airborne on a beat".
- the **guard is bare for good**: `plateShed` is permanent, drawn as a torn
  socket where the plate hung, and `dealDmg` stops denying.

Three hits because two is a slip and four is a chore: it is the number of
swings a player who has decided the plate is the answer lands before looking
for another one. The counting reads `hurtT`'s rising edge inside the guard's own
update, so the move never reaches into the shared damage path in `js/types.js`
— four other sessions are standing in that file.

## infest — the Nest recruits the machine

The `snare` already spends its failure on a **1.0 s limp window** — the punish
window she earns by breaking the reel or making it whiff. `infest` makes that
window a decision:

1. The limp beat opens and the polyp **chooses a host**: the nearest other
   machine in the room within `INFEST_REACH` (420 px), marked immediately by a
   dashed ring closing on it and a filament reaching from the snare.
2. A **spore sac swells on the slack maw for the whole window** — amber for the
   first 60%, spore-green for the last. This is the longest tell any minion in
   the game wears, and the countdown *is* the telegraph.
3. **One hit on the snare pops it.** The window still pays exactly what it
   always paid; it has simply stopped being a window she can spend walking away.
4. If it finishes, the host becomes a **carrier**: veined spore-green and
   marked from that instant, per the traits law — read before it is discovered.
5. A carrier that dies **bursts into a spore bed** where it fell — the blob's
   own pool, because "this floor is hostile" already has a vocabulary in this
   game and a second one for the same meaning is how a room stops being
   readable. The bed opens from a radius of **zero** and spreads, so the burst
   announces it while the ground is still safe.

`INFEST_MAX` is 2 per snare, ever. A cascade would turn the room into one event
instead of a decision, and the decision is the move.

**Where it is felt**: E1 (snare + blob + hopper) and E4, the Hatchery (two
blobs + snare + crawler, with the lens climb inside the latch radius). In E4
the kill order and the footing are the same problem, which is the hardest thing
the game asks before the Null Core.

## The law, and why this kingdom is where it matters most

> An enemy is never harder because it warned you less.

Cunning (`foeIQ`) buys reach, grip, count and persistence in all three of these
and **nothing else**. `tests/nestmoves.cjs` rolls each machine at iq 0 and at
iq 1 and compares the tell length, because a number multiplied by nothing
cannot be checked by reading — and a player this deep is already handling the
hardest machines in the game.

## Art

Four reads are procedural stand-ins awaiting plates: `nestThorn`, `nestCreep`,
`nestSac`, `nestCarrier`. Briefs are queued in `docs/ART_QUEUE.md` §2ba. Art is
the owner-opened ART session's job and Higgsfield's alone.

## Found next door, and handed over

While measuring `shed`'s creep this session found the same fault in **kingdom
B's breaker** (`surge`), which this kingdom does not own and has not touched.

The creep's first version died on the frame it was born, because it copied the
charge wave's rail probe: `tileAt(tx, floor((w.y + 4) / TILE))`. Terrain in
this game is a heightfield (NO RIGHT ANGLES — `groundColumnAt`, applied in the
vertical resolver), so a body resting on organic ground stands **above** the
tile it stands on, and a probe at the body's foot lands a row too high and
reads air. The creep now probes down one tile and rides the surface curve.

The breaker still has the original. Measured on the shipped build, in both
rooms that actually spawn one:

| room | wave y | rail row | tile read | rail ok? | air blocked? | longest wave |
|---|---|---|---|---|---|---|
| B1 | 382.1 | 12 | `.` | **no** | no | **1 frame** |
| B2 | 464.4 | 14 | `.` | **no** | no | **1 frame** |

The vent fires — 3 to 4 times in 900 frames, with its full `TELL_SWIPE` charge
and its 0.9 s open-vent window — and every wave it lays dies on its first step,
with the rail probe as the single killing condition (the `solidAt` air check
passes in both rooms). So the Conduits' signature move currently lays no floor
hazard at all in either room it ships in, and `tests/combat.cjs` reads `wave`
as present because the wave object exists for that one frame.

Not kingdom E's row to fix. The fix is the probe in the `surge` case of
`Enemy.update`, the same shape as `shedStep`'s.
