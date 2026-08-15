---
name: boss-openings
description: The opening doctrine — design and audit the punish windows in any boss or enemy. Use when creating a boss, when a fight feels unwinnable or trivially safe, when scaling difficulty across zones, or when deciding how an opening should get harder without disappearing.
---

# The opening doctrine

The owner's law, verbatim, and it overrides taste:

> "They try to give a minimal opening for the user to fight and kill it. These
> openings start as obvious, but also still minimal. With time, the bosses get
> harder, so the openings get harder to notice, but there should always be an
> opening. There should always be a pattern that we can recognize no matter how
> hard it is."

Read this together with `.claude/skills/combat-design/SKILL.md` (the numbers)
and `docs/combat/GLOBAL_REGISTRY.md` (the measured values). This file is about
the SHAPE of openings; that one is about their arithmetic.

---

## 1. What an opening is, here

An opening is a span of time in which the boss cannot hurt her AND she can
reach it. Both halves are required:

- Recovery with the boss across a pit is not an opening, it is a cutscene.
- Reachability with the boss still swinging is not an opening, it is a trade.

In this engine `opening_ms = recovery_ms − 33` (her startup is zero, input
latency is one step). Her full attack cycle is 230 ms, so:

| opening_ms | fits | verdict |
|---|---|---|
| < 250 | nothing | decorative — a bug unless the move deals no damage |
| 250–500 | one hit | **minimal.** The doctrine's default |
| 500–900 | two hits | generous — early game, or the reward for a hard read |
| > 900 | three+ | a gift. One per fight at most, tied to the hardest bait |

**"Minimal" means one clean hit, not zero.** The doctrine says minimal AND
always present. When tuning harder, you shrink toward 250–500, never below.

## 2. The lesson bank — what other games' bosses actually teach

Study distilled to what transfers into a no-block, no-parry, zero-startup game:

- **Hollow Knight / Silksong**: every boss is choreography — the opening is
  after the move, in a fixed place. Hornet (a hero-scale duelist) proves the
  doctrine's hard case: fast, small, but every string ends with an exhale the
  player learns to stand inside. Lesson: the opening can be SHORT if it is
  ALWAYS in the same place in the pattern.
- **Souls-likes**: openings live in recovery, and greed is the real boss.
  Chains that look finished but have one more hit are the legitimate way to
  punish impatience — the "greedy" axis in combat-design §6. Lesson: the last
  hit of a chain must be distinguishable from the middle of it.
- **Sekiro**: rhythm over reaction — the fight is learnable as music. We have
  no parry, but the transferable part is CADENCE: a boss whose moves land on a
  learnable beat feels fair at speeds that would be unfair as noise.
- **Cuphead**: pattern decks, not uniform RNG. Each phase draws from a small
  deck of readable moves; difficulty is deck composition, never tell removal.
- **Prince of Persia: The Lost Crown**: colour-coded unavoidables — one hue
  means one answer, game-wide. Our equivalent: `TELL_COL` amber means "read
  me", and that meaning must never be diluted by decorative amber.
- **Monster Hunter**: the tell is in the LIMB — which paw rises tells you
  which arc comes. Parts-rig guardians can and should telegraph per-part.
- **Furi**: a boss can be nothing but duel phases and remain a whole game's
  worth of content, if every phase changes the QUESTION, not the damage.

## 3. The escalation ladder — how an opening gets "harder to notice"

Never by shrinking below one hit, never by removing the tell. In order of
introduction across the game, each rung keeps every rung below it learnable:

1. **Obvious** (zone A/B): the opening is after every attack, the boss visibly
   pants or slumps, `TELL_HEAVY` wind-ups. Wolves and Alpha live here.
2. **Positional**: the opening exists after every attack, but only on one side
   of the boss — behind the swipe, under the leap. You must be pre-moved.
3. **Conditional**: only some moves open — the 3-hit chain opens, the single
   swipe does not. The player must distinguish moves, not just see them.
4. **Delayed**: the opening is not after the move but after the SEQUENCE — the
   deck runs coil→pounce→howl and only the howl opens. Pattern recognition,
   the owner's exact phrase, is the required skill.
5. **Baited**: the opening only exists if the player did something — stood in
   the ring to draw the slam, ate distance to draw the lunge. The player
   CREATES the opening. Hardest rung; final-third bosses only.
6. **Disguised**: the recovery pose resembles a wind-up pose at a glance and
   differs in one readable channel (silhouette, sound, hue — never all three
   hidden). At most one boss in the game earns this, and its silhouette
   difference must still pass `tests/artbible.cjs` state-separation.

**Audit rule:** name the rung of every boss move. A zone-B boss on rung 5 or a
final boss on rung 1 is mistuned. A move on no rung — no opening at all — is
forbidden except the one damage-free repositioning exception.

## 4. The always-a-pattern clause

Randomness is allowed only INSIDE a pattern, never instead of one:

- Draw from a **weighted deck**, re-weighted by state (distance, her position,
  boss HP) — never uniform-random from the full moveset. `alphaStep` in
  js/wolves.js is the house example: coil/pounce when near, broodcall when
  hurt. Copy its shape.
- **Forbidden combos list** per boss: pairs of moves that back-to-back create
  no reachable opening. The step function must veto them.
- After N consecutive denials (the player never got an opening they could
  reach, e.g. cornered), the deck MUST serve a rung-1 move. This is the
  doctrine's floor: always an opening, even when the dice are cold.

## 5. Ship gate

- [ ] Every move: `opening_ms ≥ 250` (or the one damage-free exception).
- [ ] Every move: escalation rung named, and it matches the zone.
- [ ] The deck has state-dependent weights, a forbidden-combos veto, and the
      cold-dice floor of §4.
- [ ] Death #1 / #3 / #10 each teach a sentence you can write down. If death
      #10 teaches nothing, the pattern is noise — redesign, don't retune.
- [ ] `node tests/run.cjs combat` green; new bosses get their own harness that
      MEASURES the opening (drive the boss into recovery, count the ms she can
      land a hit) rather than trusting this file.
