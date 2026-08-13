---
name: underdog-arc
description: Build and audit CLAWBYTE's progression as a felt underdog story — the protagonist starts as nothing, is treated as nothing, and becomes formidable by surviving obstacles. Use when adding skills, evolutions, NPC dialogue, boss gating, death handling, or when progression is reported as unearned, flat, or "she just gets stronger for no reason".
---

# The underdog arc, for this game

The strongest shape in action fiction is not "hero gets stronger". It is **a
character the world dismissed, who is still standing after each thing that
should have ended them.** Power is the evidence, not the point.

Games get the power and miss the arc, because power is mechanical and the arc is
authored. This skill is how to author it here.

---

## 0. The four things that make growth FELT

Growth is felt when all four are true. Miss one and the run becomes a shopping
list of upgrades.

1. **She was genuinely weak, and it cost her something.** Not "had fewer
   buttons" — actually lost.
2. **The world noticed, and said so.** Somebody dismissed her. Later, somebody
   didn't.
3. **Each power is attached to the obstacle that taught it.** A menu purchase is
   a transaction. A power named after the thing that nearly killed you is a scar.
4. **She looks different.** The silhouette changes, and it changes ON a victory,
   not on a hidden threshold three rooms later.

Audit any progression change against these four before writing code.

---

## 1. What this game already has

| Machinery | Where | State |
|---|---|---|
| Chassis evolution, 4 tiers | `evoTier()` in `js/entities.js` — 5 / 14 / 26 pts | Art changes; thresholds are invisible and unaligned with victories |
| Skill tree, 7 skills, 3 gated tiers | `SKILLS` in `js/riddles.js` | Bought from a menu with IQ; nothing ties a skill to a hardship |
| A trophy per guardian | `RELIC_TROPHY` in `js/riddles.js` | Exists; carries no story weight |
| The Braid — a ledger of mercy/severance | `js/braid.js` | The best structure in the game and the most underused |
| Purified guardians become companions | `Boss.purified` | Already an earned-respect beat; the only one |
| Six NPCs with errands | `js/quests.js`, `js/i18n.js` | Dialogue is static — nobody's opinion of her ever changes |

**The machinery is 80% built.** What is missing is authored: loss, acknowledgement,
and attribution.

---

## 2. The five changes that would build the arc, in order of impact

### 2.1 One unwinnable first encounter — the beat the whole arc hangs on

She must meet something that swats her aside and walks away, **early, before the
first real boss**, and survive it by escaping rather than winning.

This is not a scripted loss (players hate those) — it is a scripted *survival*.
The difference matters: she is not defeated, she is outclassed and gets out. Then
the entire game becomes "come back for that."

Implementation shape: a corridor encounter in zone A where NULLFANG appears,
lands one hit that cannot be avoided, and the floor collapses her out of the room.
Costs one room, one flag, no new systems. Everything after it is recontextualised
for free — which is why it is first on this list.

**Then pay it off.** The A4 fight against the same guardian must explicitly be
the rematch: same music sting, an NPC line about it, and the Braid recording it.

### 2.2 The world must change its opinion out loud

The cheapest large win available. Every NPC line should be indexed by how many
guardians she has freed or felled.

    const standing = (G.save.flags.bossCount || 0);   // 0 / 1-2 / 3-4 / 5+

Three tiers of line per NPC — *dismissive → surprised → deferential* — is 18
strings and it will do more for the arc than any mechanic in this document.
Servo calling her "little frame" in the first hour and something else in the
fifth is the entire technique.

Rule: the shift must be **specific**, not flattering. "You're still alive" beats
"you're amazing".

### 2.3 Attach every power to the thing that taught it

Right now a skill is a menu purchase. Make the unlock text name the obstacle:
the third jump is not "Triple Thrusters", it is the thing she worked out in the
shaft she kept falling down.

Two levels, cheap to expensive:

- **Cheap:** the unlock dialogue references where the IQ came from — the Mind
  Node that funded it, and the zone it was in. One string, real weight.
- **Better:** gate one or two skills behind a *hardship counter* rather than
  currency — deaths in a zone, falls into a pit, a boss survived at one core.
  A power that arrives because you suffered is the whole genre in one mechanic.

### 2.4 Move the evolutions onto the victories

`evoTier()` fires at 5/14/26 hidden points. The transformation should land **on
a guardian's defeat**, in the moment, with the world reacting — not silently in a
corridor afterwards.

Align the thresholds so tier 1 lands on guardian 1, tier 2 around guardian 3,
tier 3 on guardian 5. The art already exists (`evo1`/`evo2`/`evo3` in i18n); it
is the timing that is wasted.

### 2.5 Make defeat a beat, not a reload

Every death currently costs progress and says nothing. The Braid already records
choices — record deaths too, and let one NPC acknowledge the worst one. "You came
back" is the underdog sentence.

Do not add a mechanical penalty. The point is acknowledgement, not punishment.

---

## 3. What NOT to do

- **Do not make her weak by making her controls bad.** Weakness is the *world*
  being large, never the character being clumsy. Her movement should feel
  excellent from the first frame — that is what makes the early rooms survivable
  and the growth legible as *her*, not as the pad.
- **Do not gate the arc behind grinding.** The obstacle teaches; repetition does
  not. A hardship counter should track meaningful events (a boss survived on one
  core), never kills.
- **Do not let the mentor be the reason she wins.** The world may believe in her;
  it must never rescue her.
- **Do not state the theme.** No NPC says "you have grown so much". They say the
  specific thing that implies it.

---

## 4. Procedure — auditing any progression change

1. Which of §0's four does this serve? If none, it is a number change, not an arc
   change — fine, but do not expect it to be felt.
2. Is the power **attached** to something the player did, or bought from a menu?
3. Does anybody in the world **notice**? If not, add one line.
4. Does the silhouette change, and does it change **on the victory**?
5. Can the player point at the moment they stopped being weak? If there is no
   such moment, §2.1 is missing.

---

## 5. Where to look in the code

| Concern | File |
|---|---|
| Evolution tiers and their thresholds | `js/entities.js` — `evoTier`, `evoPts` |
| Skills, costs, tier gating | `js/riddles.js` — `SKILLS`, `tierOpen` |
| The Braid ledger and the fork | `js/braid.js` |
| NPC dialogue and errands | `js/quests.js`, `js/i18n.js` (`n_*`, `t*`) |
| Boss defeat, purification, trophies | `js/entities.js` — `bossFork`, `purified` |
| Death and respawn | `js/game.js` — `respawn` |
| The standing prompt / HUD feedback | `js/game.js` — `skillAffordable`, `howToOpen` |
