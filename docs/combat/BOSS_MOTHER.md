# BOSS_MOTHER — MOTHER-V

Measured from `js/entities.js` case `'mother'`. Timings in **ms**.

| | |
|---|---|
| Kind / name | `mother` / **MOTHER-V** |
| Zone | E — the Virus Nest, room **E3** |
| **Difficulty slot** | **Resource management** |
| ID prefix | `mv` |
| Palette | telegraph amber; virus violet `#b48cff`; broadcast red `#e63946` |
| Gate | `arc` |

**The one sentence.** *MOTHER-V attacks the economy, not the body.* Every other
guardian takes cores; this one takes your ability to get them back — it locks
the Song, reverses your inputs, and turns the lights off, and the fight is
decided by what you had banked when it started.

---

## B1. Move table

| id | state | tell | active | recovery | tell state | tell ms | channels | dmg | intended_counter | opening_ms |
|---|---|---|---|---|---|---|---|---|---|---|
| `mv.nullwave` | `nwcharge` | **1100** | ring expands at 240 px/s to r620; 1 ring (p0) or **2** (mPhase ≥ 1) | **1000** `stagT` after the last ring | ✓ | 1100 | amber + **the halo freezes and the core runs black** + cue → `no` | 1 core **+ 640 px/s shove + 1200 ms slow** | **jump it** — it is a ring at ground level | **967** |
| `mv.ringcharge` | `ringcharge` | **700** | wider rings from the exposed core (mPhase ≥ 3) | — | ✓ | 700 | amber + core flare + cue | 1 core | **jump / gap** | see UNKNOWN |
| `mv.grab` | `grabwarn` | **500** | tendril reach (mPhase ≥ 2) | — | ✓ | 500 | amber + tendril rears + cue → `cast` | 1 core | **out-range** | see UNKNOWN |
| `mv.beam` | `beam.warn` | **beam.t** then 500 ms live | 500 | — | the warn rect is drawn before it fires | — | the marked rectangle + `boom` on fire | 1 core | **leave the rectangle** | n/a |
| `mv.song` | `msong` | **1600** | `G.songLockT = 10 s`, `G.revT = 5 s` — **your Song is locked and your inputs are mirrored** | **800** `stagT` | — (hand-cued `sfx('cast')` on entry) | 1600 | violet + red motes spiralling in + cue → `phase` | **0 direct** | **endure** — and do not need the Song for ten seconds | **767** |
| `mv.totalnull` | `tnull` | — | `G.darkT = 8.4 s`: every light in the arena dies; you see yourself, her core, and nothing else | — | toast + `roar` + flash + shake | — | **sound becomes the telegraph** | — | **listen** | n/a |
| `mv.phaseshift` | — | — | at 75 / 50 / 25% two more shell plates shatter | **500** `stagT` | `phase` + burst + flash | — | — | — | free window | **467** |

### B1 audits

**`intended_counter` empty or ambiguous:** none.

**`opening_ms ≤ 0`:** none measured. Every phase shift hands over a guaranteed
500 ms and the Null Wave a guaranteed 1000 ms.

**Wind-ups with no audio channel:** none. `nwcharge`, `ringcharge` and
`grabwarn` all match `TELL_ST`; `msong` is hand-cued.

**The comment and the code disagree about the Null Wave, and the code is right.**
The source says *"the tell is SILENCE: the halo freezes and the core runs
black"* — a lovely idea, and if it were the only channel it would be a
one-channel telegraph dressed as an aesthetic. In practice `nwcharge` matches
`TELL_ST`, so the cue fires and the silence is the *music* dropping out
underneath it. Two channels, and the better version of the intent. Recorded so
nobody "restores" the silence by removing the cue.

**TOTAL NULL is the game's one deliberate suspension of the fairness contract**,
and it is bought honestly: it is announced by a toast, a screen flash, a roar
and a full second of blackout before anything happens, it fires once, below
20%, and the Song — the thing she just spent ten seconds locking — buys three
seconds of sight back. The contract says *every damage source visible before it
lands*; here the damage sources are **audible** before they land, which is the
substitution the fight is built on. It is the last thirty seconds of the game
and it earns the exception.

---

## B2. Opening design

| Move | Mechanism | The arithmetic |
|---|---|---|
| `mv.nullwave` | **conditional** | 967 ms + 1000 ms stagger — the largest window in the fight — but the ring that opened it also shoved you 640 px/s away and slowed you for 1200 ms. The window is enormous and you spend most of it walking back. |
| `mv.song` | **greedy, and the fight's signature** | 767 ms of stagger, and then ten seconds in which repair is unavailable and your controls are mirrored. The correct play is to take the window and then *stop* — and the window is right there, and taking one more swing is how the mirrored controls kill you. |
| `mv.phaseshift` | **plain** | 467 ms, three times, at fixed HP. Reliable, predictable, and the only thing in the fight you can plan around — which is exactly what a resource fight needs. |
| `mv.totalnull` | **specific** | one answer: the Song, for three seconds of sight. If you spent your volts you do not have it. |

**The resource loop this fight is testing:** volts → repair → cores. She takes
the middle term away (`songLockT`), makes movement cost more (slow), and makes
sight cost volts. A player who arrives at 99 volts fights a different fight from
one who arrives at 20, and that difference is the design.

---

## B3. Phases

Four, on HP fractions — the only boss with more than two.

| mPhase | Threshold | Added | **Teaches** |
|---|---|---|---|
| 0 | 100–75% | null wave (1 ring), beam, song | *The ring is a jump. The Song is a countdown.* |
| 1 | < 75% | null wave becomes **2 rings** | *One jump is no longer enough.* |
| 2 | < 50% | `mv.grab` | *You can no longer stand at mid range and wait.* |
| 3 | < 25% | `mv.ringcharge` from the exposed core | *The core is open — and it is also what is shooting at you.* |
| — | < 20% | `mv.totalnull`, once | *Everything you were reading is gone. Listen.* |

Each shift shatters two shell plates and hands over 500 ms — the fight gets
harder and pays for it in the same instant, which is the cleanest phase
transition in the game.

### Teaching pass

| | Death #1 | Death #3 | Death #10 |
|---|---|---|---|
| P0–1 | "A black ring killed me." | "Jump it — twice, below 75%." | "I bank volts through phase one because I know what is coming." |
| P2–3 | "It grabbed me from across the room." | "Below half I have to stay close or far, never mid." | "I fight the last quarter on the volts I saved, not the ones I earn." |
| Total Null | "The screen went black and I died." | "The Song gives me sight." | "I arrive at 25% with the Song in hand. That is the whole fight." |

### Fairness contract

| Phase | ≥1 guaranteed punish | no unreactable damage | no mid-commitment transition | every source visible |
|---|---|---|---|---|
| 0–3 | ✓ 967 ms + 1000 ms after every wave; 467 ms at every shift | ✓ shortest tell 500 ms | ✓ a shift **staggers her**, it does not strike | ✓ |
| Total Null | ✓ the Song's reveal | ✓ 1400 ms of warning before the first attack in the dark | ✓ it cannot fire during `msong` or `nwcharge` — explicitly guarded | ⚠ **audible, not visible** — the game's one stated exception, argued above |

---

## B5. Telegraph render directives

| id | Silhouette | Hue | Particle | Audio | **Recovery read** |
|---|---|---|---|---|---|
| `mv.nullwave` | **the halo stops turning** and the core goes black — a light going OUT, where every other tell in the game is a light coming on | amber cue over a black core | none, deliberately: the stillness is the signal | `tell` → `no` → `boom` | `stagT` 1000 ms, halo restarting |
| `mv.song` | head back, core strobing red | violet + broadcast red | motes spiralling **inward** | `tell` → `phase` | 800 ms drooped |
| `mv.grab` | a tendril rears out of the shell | amber | — | `tell` → `cast` | tendril retracting |
| `mv.ringcharge` | the exposed core flares | amber | — | `tell` | — |
| `mv.totalnull` | **the arena** — every light dies | black | — | `roar`, then attack sounds as tells | — |

---

## B6. Close-out

### INTERFACES
Consumed: registry §1–§5. Nothing needed from another subject.

### UNKNOWN
1. `mv.ringcharge` and `mv.grab` recovery were not read — both return to `idle`
   but the delay was not measured. **The two highest-value unknowns left in the
   combat docs**, because they are the moves that define phases 2 and 3.
2. Whether `G.revT`'s mirrored controls apply to the touch stick and the pad
   d-pad as well as the keyboard.
3. Total Null's audio tells were not measured against the ambience — the whole
   exception rests on them being clearly separable, and that has never been
   verified with a meter.

### Changelog
No MOTHER-V values changed this pass.
