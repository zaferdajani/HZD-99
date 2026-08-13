# The hero's answers — what she can DO about a boss

Boss design is usually written from the boss's side: what does it throw. This
document is the other side, and it is the one that decides whether a fight is
fair: **for every shape of threat, what verb does the player have?**

A threat with no answer is not difficulty, it is a toll. A threat with one
answer is a QTE with extra steps. A threat with three answers is a fight.

Everything below is read from the code, not from intent. Line references are to
`js/entities.js` unless stated.

---

## 1. Threat shapes

Boss actions in this game reduce to eight shapes. The name does not matter; the
shape decides the answer.

| Shape | States in this game |
|---|---|
| **Contact rush** — the boss moves through space at you | `dash`, `dashslash`, `swoop`, `dive`, `pounce`, `spring`, `nullhop` |
| **Melee arc** — a swing in place | `swipe`, `slam` |
| **Aimed projectile** | `volley`, `lance`, `shard` |
| **Persistent orbiter** | `orbs` |
| **Expanding area** — a radius that grows from a point | `nova`, `azhush`, `ringcharge`, `nullcharge`, `tnull`, `roar` |
| **Summon** | `broodcall`, `forgebell` |
| **Control / status** | `prison`, `dccast`, `msong`, `hymn` |
| **Grab** | `grab` |
| *(plus)* **Open window** — the boss is punishable | `rest`, `restlow`, `recover`, `cffloor`, `nullend`, `crouch` |

---

## 2. The hero's verbs, as actually implemented

| # | Verb | Cost | Where |
|---|---|---|---|
| A | **Spatial evasion** — run, jump, double jump, wall cling, glide | free | movement |
| B | **Triple jump** | skill `triple` | `SKILLS`, `js/riddles.js` |
| C | **Pass-through** — dash *ignoring damage* | **crest `phantom` only** | line 905 |
| D | **Deflect** — any swing destroys an enemy projectile | free | line 791 |
| E | **Interrupt** — the Song staggers a boss | volts | `msong` / stagger |
| F | **Punish** — 3-hit combo, 8-way aim | free | swing |
| G | **Burst** — claw burst, 360°, 2.6× | 25 volts | hold attack |
| H | **Buff** — feral claws, 7 s | 30 volts | `clawT` |
| I | **Ranged chip** — shuriken, suit/arm | ammo / volts | `Proj` |
| J | **Rebound** — bounce off what you hit | free | air + down + attack |
| K | **Wave** — slashes fire a projectile | skill `wave` | `SKILLS` |
| L | **Heal** — repair, standing still | 33 volts | `healT` |
| M | **Allies** — purified guardians | earned | `purified` |

---

## 3. The matrix, and the holes in it

✅ answers it · ⚠️ partial or conditional · ❌ no answer

| Threat | Evade | Pass-through | Deflect | Interrupt | Punish after |
|---|---|---|---|---|---|
| Contact rush | ✅ | ⚠️ crest | ❌ | ✅ | ✅ `recover` |
| Melee arc | ✅ | ⚠️ crest | ❌ | ✅ | ✅ |
| Aimed projectile | ✅ | ⚠️ crest | ✅ | ✅ | ⚠️ |
| Persistent orbiter | ⚠️ | ⚠️ crest | ❌ | ❌ | ❌ |
| **Expanding area** | ⚠️ *outrun only* | ⚠️ crest | ❌ | ✅ | ✅ |
| Summon | n/a | n/a | ❌ | ✅ | ✅ |
| **Control / status** | ❌ | ❌ | ❌ | ⚠️ | ❌ |
| **Grab** | ✅ *pre-* | ⚠️ crest | ❌ | ✅ | ✅ |

### The three findings that matter

**1. Passing through an attack is optional equipment, not a baseline verb.**
`dash` grants no invulnerability — line 905 skips damage only
`if (this.dashT > 0 && hasCrest('phantom'))`. In most action games the dodge IS
the answer to everything, and here it is a crest the player may never find. Until
they do, the *only* way to survive any attack is to not be where it is. That is
one verb doing the work of five, and it is why the fights read as spacing puzzles
rather than duels.

This is a deliberate design choice, not a bug — but it should be a *known* one,
because every threat below inherits it.

**2. Expanding areas have exactly one answer: be outside the radius.**
`nova`, `azhush`, `ringcharge`, `tnull` all grow from a point. If the radius is
larger than the distance she can cover in the wind-up, the hit is unavoidable and
the telegraph is decoration. Every expanding attack needs its radius checked
against her actual run speed over the actual wind-up.

**3. Control effects have no counter at all.** `dccast` scrambles the HUD for
eight seconds; `prison` cages her. There is no cleanse, no resist, no shorten.
An unanswerable status is the most reliable way to make a fight feel unfair,
because the player is denied the thing they came to do — play.

---

## 4. Escalation: a skill should be an ANSWER, not a number

This is the design rule the tree currently misses. Of seven skills:

| Skill | Opens a new answer? |
|---|---|
| `triple` — third jump | ✅ more evasion, more vertical reach |
| `wave` — slashes fire projectiles | ✅ a ranged answer she did not have |
| `reach` — longer finisher | ⚠️ more range on an answer she has |
| `reflex` — longer i-frames after a hit | ⚠️ softens failure, answers nothing |
| `calc` — finisher hits harder | ❌ a number |
| `router` — cheaper EMP | ❌ a number |
| `mind` — +1 crest socket | ❌ a number (though it may fit `phantom`…) |

**Four of seven are numbers.** A number makes an existing fight shorter; an
answer makes a previously impossible fight possible. The second is what makes
progression feel like growth — and it is the mechanical half of the underdog arc
(see the `underdog-arc` skill): *the power that arrives is the answer to the
thing that beat you.*

The strongest available change is to re-point the tree so each tier grants one
new **verb**:

- Tier 0 — an answer to projectiles (already: deflect is free; make it *taught*).
- Tier 1 — an answer to **contact rush**: a real i-frame dash, taken off the
  crest and put on the tree, where it can be *earned from the boss that ran you
  down*.
- Tier 2 — an answer to **expanding areas**: a vertical escape (`triple`) or a
  cleanse for **control effects**.

That also fixes finding 1 without removing the crest: `phantom` becomes the
upgrade (longer window, or i-frames on every dash) rather than the gate.

---

## 5. Procedure — auditing a new boss move

1. Which of §1's shapes is it? If it is a new shape, it needs a new verb, not a
   new stat.
2. List every verb in §2 that answers it. **Fewer than two is a red flag.**
3. If the only answer is "be elsewhere", check the geometry: radius or reach
   against her run speed over the actual wind-up.
4. Where is the punish window, and is it long enough to land the 3-hit combo?
   A window that fits one poke teaches poking.
5. Does it have a counter that a *later* skill will provide? If yes, that is a
   good move — it is a locked door with a key elsewhere. Write down which key.
