# BOSS_PRISM — PRISM PROWLER

Measured from `js/entities.js` case `'prism'`. Timings in **ms**.

| | |
|---|---|
| Kind / name | `prism` / **PRISM PROWLER** |
| Zone | X — the Crystal, room **X1** |
| **Difficulty slot** | **Mixup / identification** |
| ID prefix | `pp` |
| Palette | telegraph amber; `PAL.X.glow`; splinter white `#e0e0ff` |
| Gate | `frost` |

**The one sentence.** *PRISM PROWLER is the fight where knowing what is coming
is the whole skill*, because two of its moves start from the same crouch and
need opposite answers.

---

## B1. Move table

| id | state | tell | active | recovery | tell state | tell ms | channels | dmg | intended_counter | opening_ms |
|---|---|---|---|---|---|---|---|---|---|---|
| `pp.dash` | `dashwarn`→`dashslash` | **350** (`TELL_FAST`) | 420 ms at **720 px/s** | `rest` **850 (p1) / 500 (p2)** | ✓ | 350 | amber + coils low + cue | 1 core | **jump** — it runs the floor | **817 / 467** |
| `pp.pounce` | `pouncewarn`→`pounce` | **300** (`TELL_FAST × 0.86`) | ballistic arc | `rest` **700** | ✓ | 300 | amber + coils low + cue | 1 core | **move laterally** — it commits to an arc | **667** |
| `pp.spread` | from `idle` | none | 3 bolts at ±0.3 rad, 300 px/s, while it hops back (`vy −480`) | `rest` **950 / 600** | — | — | `shoot` | 1 core | **out-range or gap** | **917 / 567** |
| `pp.lightsplit` | `lsvanish` | **950** | three glowing spots appear; **one holds the real body**, the two fakes fire aimed bolts, the real one pounces | — | hand-cued: `sfx('wave')` on entry | **950** | amber + the body vanishes + three lit afterimages + cue | 1 core | **identify** — watch which spot is not a decoy | n/a |
| `pp.arcoverload` | `arcspin` | **1200** | it vanishes into its own lightning; `stormT` makes it untouchable | — | ✓ (`spin`) | 1200 | amber + turntable overcharge + cue → `cast` | — | **wait it out** | n/a (see audit) |

### B1 audits

**`intended_counter` empty or ambiguous:** none.

**`opening_ms ≤ 0`:** none. The tightest is `pp.dash` in phase two at **467 ms**
— one hit comfortably, two only from the right side.

**Wind-ups with no audio channel:** none, but two are worth recording because
neither is covered by the automatic rule:

- `lsvanish` does not match `TELL_ST` and does not set `windT`. It is cued by
  hand with `sfx('wave')` at the moment the body disappears. Correct, and
  fragile — it survives only because that one call is there.
- `arcspin` matches on `spin`, which is luck rather than design.

**The one move with no punish window is `pp.arcoverload`**, and it qualifies
under the rule: it is a phase transition, it deals no damage of its own, and
`stormT` explicitly makes every hit land as a puff rather than a wasted swing —
the player is told "not now", not punished for trying.

**A historical note that belongs in the record.** This was the fastest boss in
the game and it had *no tells at all*: a 720 px/s dash — twice her run speed —
fired straight out of idle, and the same for the pounce. Nothing to read,
nothing to beat. Both gather now, on the shared budget, and the cycle is still
the tightest in the game; it is simply a fair one.

---

## B2. Opening design

| Move | Mechanism | The arithmetic |
|---|---|---|
| `pp.dash` / `pp.pounce` | **specific, and this is the fight** | Both start from the same low coil. Their tells differ by **50 ms** (350 vs 300) and by silhouette alone. Dash is answered by **jumping**; pounce is answered by **moving sideways** — and each answer is *wrong* for the other move. The skill is identification, not reaction. |
| `pp.lightsplit` | **conditional** | 950 ms in which the body is not on screen. The opening after it exists only if you picked the right spot to be standing near; pick wrong and the pounce lands on you while two bolts arrive from the sides. |
| `pp.spread` | **greedy** | 917 ms while it is airborne and retreating. Chasing it into the corner it is hopping toward is the trap. |

**Why the 50 ms tell difference is legitimate.** It is well under the reaction
floor and could not be told apart on timing — so it is not asked to be. The
telegraphs differ in *shape*: the dash squares up along the floor line, the
pounce gathers under itself. Timing is not the discriminator, and the fight does
not pretend it is.

---

## B3. Phases

| Phase | Threshold | Added | Modified | **Teaches** |
|---|---|---|---|---|
| 1 | 100–35% | dash, pounce, spread, light split | — | *These two look the same and are not.* |
| 2 | < 35% | `pp.arcoverload` once | dash rest 850→500; pounce cycle tightened; spread rest 950→600 | *The same tell, with less room to be wrong in.* |

### Teaching pass

| | Death #1 | Death #3 | Death #10 |
|---|---|---|---|
| P1 | "It moved too fast." | "It crouches before both. One goes along the floor, one goes up." | "Dash squares up; pounce gathers under itself. I jump the first and step the second." |
| P2 | "Same thing, faster." | "Nothing new down here — I just have less time." | "I stop guessing and read the shape." |

### Fairness contract

| Phase | ≥1 guaranteed punish | no unreactable damage | no mid-commitment transition | every source visible |
|---|---|---|---|---|
| 1 | ✓ dash rest, 817 ms | ✓ shortest tell 300 ms | ✓ | ✓ the split's fakes are lit before they fire |
| 2 | ✓ dash rest, 467 ms | ✓ **no tell shortens in phase two** | ✓ `arcspin` deals no damage and makes it untouchable rather than dangerous | ✓ |

---

## B5. Telegraph render directives

| id | Silhouette | Hue | Particle | Audio | **Recovery read** |
|---|---|---|---|---|---|
| `pp.dash` | **squares up along the floor line**, body long and low | amber | trail dots during the run | `tell` | `rest`: stopped dead, `vx = 0` |
| `pp.pounce` | **gathers under itself**, body compact and high-hipped | amber | — | `tell` | lands, `rest` |
| `pp.lightsplit` | **the body is gone** — three lit afterimages instead | `PAL.X.glow` | burst at vanish, burst at arrival | `wave` → `dash` | it is simply *somewhere*, and that is the read |
| `pp.arcoverload` | vanishes into a storm | amber | lightning | `tell` → `cast` | untouchable, and visibly so |

**The dash/pounce pair is the one place in this game where two telegraphs in the
same fight are deliberately similar.** Registry §B5 requires uniqueness per
fight; this is a stated, argued exception, because the fight's assigned slot IS
identification. The silhouettes are genuinely different — long-and-low against
compact-and-high — and that difference is the content. If it ever fails to read
at 960×540, the fix is to exaggerate the two poses, **not** to separate the tell
lengths, which would turn an identification test into a reaction test and
duplicate NULLFANG's slot.

---

## B6. Close-out

### INTERFACES
Consumed: registry §1–§5.
**To Stage C:** `dashwarn` is shared with GLACIERE. Different zones, so not a
same-fight collision — but it is the clearest cross-boss homogeneity candidate
in the game and wants a ruling.

### UNKNOWN
1. Whether `lsvanish`'s three spots can ever place the real body off screen at
   the camera's clamped positions in X1.
2. `stormT`'s exact duration was not read.

### Changelog
No PRISM values changed this pass.
