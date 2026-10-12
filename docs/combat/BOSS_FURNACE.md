# BOSS_FURNACE — FURNACE CHOIR

Written from `BOSS_TEMPLATE.md`, rewritten 2026-10-12 for the bespoke move set
(handoff Part 2 **A5**, the NULLFANG treatment for zone C). The machine is
`js/furnace-fight.js` (`fcStep`, `fcStart`, `fcDraw`, `fcVeto`); he is drawn by
`js/furnace.js` from the owner's sheet. Every number below was read off his own
simulation clock (`b.fcLog`, stamped by `fcLogStep`) by `tests/furnace.cjs`,
stepping the real build at 1/60 s — where the log differs from the tuning
sheet (`FC`) the measured value is quoted and the sheet value is in brackets.
The log is stamped once per step, so a measured duration reads up to 17 ms
over its sheet value. Timings in **ms**.

| | |
|---|---|
| Kind / name | `atlas` / **FURNACE CHOIR** — the owner's corrupted mecha dragon |
| Zone | C — the Foundry, room **C3** (32 tiles; ledges at row 11, tiles 5–8 and 21–24; the moving plate at 7,9) |
| **Difficulty slot** | **Greed test** (registry §4) |
| ID prefix | `fc` (`G.dmgLog` keys: `atlas.vent`, `atlas.drop`, `atlas.hymn`) |
| Palette | telegraph amber on every wind-up; parry lime on the backdraft only; lock cyan (the drop's lock brackets); danger red (the drop's landing mark); molten `MAT.molten.*` and hazard `#ff9430` for fire |
| Gate | `jet` |
| Art | **class B** — the authored sheet `dragon_parts.webp` (IDLE, WALK, FLY, HERO figures + parts). New poses are briefed in `docs/ART_QUEUE.md` §2bn; until they land the new states transform the existing figures (see B5) |

**The one sentence.** *FURNACE CHOIR is the fight that punishes the third hit.*
Every opening he leaves fits two hits. The third, inside an opening he is
guarding, wakes **the bellows** in his chest — and the greedy hit then has to be
answered, by stepping out of the fire, jumping it, or turning it with a perfect
guard. The parry is the precise answer, and it is paid: he chokes on his own
fire for a second.

---

## B1. Move table

`opening_ms = recovery_ms − 33`. Phase one / phase two where they differ.

| id | sentence (tell → active → recovery) | tell ms | active | recovery ms | hitbox | channels | dmg | intended_counter (≥ 2) | opening_ms | rung |
|---|---|---|---|---|---|---|---|---|---|---|
| `fc.lob` | `lobwarn` → fireball → `idle` walk-in | **467** [450] | arc proj r 8, 900 gravity, aimed `d×1.1` (±300 px/s), leaves on the last step of the tell (measured 450) | walk-in: no wind-up for `openT` 450, then the rest beat (`bossRest`×1.1): measured **867 / 583** | the fireball | mouth heat climbs (`drgGlow`), amber, `tell_atlas` | 1 core | **move** out of the arc · **deflect** (any swing bursts it) · **brace** facing it | **834 / 550** | 1 |
| `fc.slam` | `slamwarn` → tail strike + two floor waves → `recover` (tail planted) | **567** [550] | waves ±340 px/s from ±40 px, r 8, 1.6 s | **517 / 433** [500 / 420], then the walk (×0.7) | floor waves | the tail coils overhead (authored tail piece), amber, cue → `slam` | 1 core | **jump** the waves · **brace** facing them · be beyond the wave before it is drawn | **484 / 400** | 1 |
| `fc.forgebell` | `forgebell` → three clapper strikes, three weapons fall at `px ± 110` → `idle` walk-in | **1517** [1500]; **first strike at 450**, then 750, 1033 | weapons land, 3 s fuse, burst r 54 | walk-in 450 + rest ×1.35: measured **1200 / 633** | weapon bursts | reared HERO figure, a spark shower per strike, amber, cue → `bosshit` ×3 | 1 core each | **break** a weapon (one swing) · **be elsewhere** when the fuse runs out | **1167 / 600** | 3 |
| `fc.hymn` | `hymn` → expanding heat rings → `recover` (the bells ring down) | **1000** | 2 / **3** rings, 260 px/s, take a GROUNDED body only; cooldown 6.5–8.5 s | **567 / 467** [550 / 450] | ring edge ±16 px | reared HERO figure + amber bloom on the upper body (added this pass), roar wave, rumble, cue | 1 core | **jump** the ring · **brace** facing the bell · **sing** (the Song cancels it and staggers him 1.1 s) | **534 / 434** | 2 |
| **`fc.backdraft`** *(new)* | `ventwarn` → `vent` (the cone) → `recover` (vents cooling) | **467 / 417** [450 / 400] | 183 [180]; a cone out of the FRONT of him, 132 px long from 18 px ahead of his centre, 78 px tall from his feet; the facing locks when the breath begins | **600 / 517** [600 / 500] — **never a guarded opening** | the cone (`fcVentBox`) | the IDLE figure rocks back and draws up (0.9×1.1), the core in the chest swells to white, steam off the plates, amber, cue; **the lime parry glint on the chest for the last 150 ms of the breath and the blast** | 1 core | **step behind him** or out of the cone · **jump** (measured: take-off 100–400 ms before the blast clears it; 50 ms is too late) · **brace** (holds, costs heat) · **PARRY** (perfect guard ≤ 140 ms before it bursts) · or do not take the third hit | **567 / 484** | 5 (baited) |
| `fc.backdraft` parried | the perfect guard turns it → `stagger` (he chokes) → `idle` walk-in | — | — | **1000** stagger, then the walk-in | — | the shared clash (`js/parry.js`), smoke from every vent, the slumped cooled figure shaking | she takes **0**; the counter opens (600 ms, 36 fixed, measured 14 through his plating) | — | **967** | the fight's one gift-sized window |
| **`fc.drop`** *(new, phase two)* | `dropcrouch` → `rise` (tracks her, ≤ 560 px/s) → `droplock` (the mark is fixed) → `dive` → `recover` (sprawled) | **600** crouch; then **467** rise + **383** lock [450 + 380] | falls at 1500 px/s (**100 ms**); lands EXACTLY where the lock marked (measured 0 px drift); splash r 66 at the landing takes a grounded body; two waves ±300 px/s for 550 ms | **633** [620] planted, then a 450 walk-in | body, splash, waves | the FLY figure gathered low on the floor (wings up, sunk onto the haunches), amber, cue; at the lock a second cue, cyan lock brackets and a danger-red mark on the floor under him | 1 core | **leave the mark** after the lock (lock → impact **483 ms**; she outruns the wave) · **dash** off it · **brace** the waves | **600** | 2 |
| `fc.meltdown` | `meltwarn` → the pour (6.5 s) → `recover` | **1200** | the floor pours 30 px of slag; 1 core every 700 ms in it; he walks at 0.55× | **467 / 417** [450 / 400]; the pour's end staggers him 1.0 s | the slag line | the bell runs white-hot, steam from every joint, amber, cue | 1 core / 0.7 s | **climb** a ledge or the moving plate · **ride** it out up there | **434 / 384** (+967 at the end of the pour) | 4 |
| `fc.ember` | phase two, ambient | — | one ember every 1.1 s at `px ± 130`, falling from y 40 | — | ember r 6 | visible for its whole fall | 1 core | **keep moving** · **deflect** | n/a — pressure, not a move | — |

### The bellows (what "guarded" means)

An opening begins when a move goes off (`fcOpen`) and ends when his next wind-up
begins (`fcBegin`). Every hit she lands (`dealDmg` → `onStruck` → `fcStruck`)
inside a **guarded** opening counts; the **third** starts the breath at once,
from his recovery or his walk-in — never out of a wind-up or a blow already
going off.

| | guarded openings | measured in `tests/furnace.cjs` |
|---|---|---|
| phase one | the planted ones: slam, hymn, meltdown | slam and hymn: hits 1 and 2 land in `recover`, the third starts `ventwarn`. After a lob, three hits land in the walk-in and nothing answers |
| phase two | **every** opening | lob, forge bell and drop: the third hit starts `ventwarn` |
| never | the backdraft's own recovery; any window she EARNED or was given — the hit-group break, the choke, the Song's stagger, the midpoint, the end of the pour | three hits inside a Song stagger in a guarded opening: no breath |

### Hit-group break (`dazeAt` 6, span 2.6 s)

Unchanged: six hits inside 2.6 s, out of anything he is not committed to, put
him in `daze` for **1.6 s / 1.3 s** (measured 1.32 s through `tests/guardians.cjs`)
taking `DAZE_MUL`; cooldown 6 / 7.5 s. Committed (`BREAK_KIT.atlas.busy`):
`meltwarn`, `ventwarn`, `vent`, `rise`, `droplock`, `dive` — a break requested
during the bellows waits for its recovery, so greed cannot skip the answer.

### B1 audits

**Empty `intended_counter`:** none. Every move has at least two.
**`opening_ms < 250`:** none. Smallest: the phase-two slam, **400 ms**.
**Wind-ups not matching `TELL_ST`:** none — `lobwarn`, `slamwarn`, `forgebell`,
`hymn`, `meltwarn`, `ventwarn` (warn), `dropcrouch` (crouch), `droplock` (lock).
No active or recovery state matches (`vent`, `rise`, `dive`, `recover`,
`stagger`, `idle`), measured by `tests/furnace.cjs`; `tests/tells.cjs` drives
him through both phases and finds no one-channel telegraph.
**Tell floors:** zone C sits at 400–600; the shortest is the phase-two breath,
**417 ms**, answered by a STEP (out of a 132 px cone she is standing at the near
end of), from a place she chose to stand, after a hit she chose to take.

---

## B2. Opening design — the greed test, as a mechanism

The openings are still generous (400–1167 ms) — that is the bait. Until this
pass nothing in the machine answered greed; the slot was a sentence in this
document. Now:

| Move | Mechanism | The arithmetic |
|---|---|---|
| `fc.slam` / `fc.hymn` | **conditional** (rung 3): guarded | 484 / 534 ms (p1) — two hits at her 260/230 ms recoveries. The third is the breath. |
| `fc.lob` / `fc.forgebell` | **free** in phase one, **guarded** in phase two | 834 / 1167 ms in p1: phase one's place to take three. Phase two closes it. |
| `fc.backdraft` | **baited** (rung 5) | she created it. Answer it and she has its recovery (567 / 484) — never guarded, so the greedy player who reads the breath still gets paid. Parry it and she has the choke: **967 ms** and a counter. |
| `fc.drop` | **positional** (rung 2) | 600 ms beside a sprawled dragon, wherever she made him land. |
| `fc.meltdown` | **specific** (rung 4) | be up on a ledge for 6.5 s; the cooling vents at the end are a 967 ms stagger. |

**The greed metric (§C3) is still this fight's primary success signal**, and it
is now measurable directly: `atlas.vent` in `G.dmgLog` counts the greed that was
punished, `G.parryLog` entries of kind `atlas` the greed that was answered
precisely.

**The cold-dice floor** (boss-openings §4): when the last three moves all
reached her (`fcGotHer`, read off her cores), the next one — when the rest beat
runs out, with nothing allowed to jump the queue — is the lob, his plainest
move with the longest walk-in. Measured: three moves stood in → `lobwarn`; the
same spot with a cold ledger → `slamwarn`.

### Veto list (`fcVeto`)

| pair | why |
|---|---|
| hymn while the slag pours | the ledges are the only floor; a ring across them is a toll |
| drop while the slag pours | he would dive onto the only safe floor |
| drop while forge weapons are live | "be elsewhere" twice, in two different places |
| drop → drop, hymn → hymn | cooldowns (5–7 s, 6.5–8.5 s) |
| drop → slam (inside the walk-in) | two sets of floor waves from beside her with no beat between |
| backdraft → backdraft | its own recovery is never guarded |

Measured: 200 far draws with weapons live → 0 drops; with the slag pouring →
0 drops, 0 hymns (near and far).

---

## B3. Phases — the second one changes the question

| Phase | HP | Added | Modified | **Teaches** |
|---|---|---|---|---|
| 1 | 100–50 % | slam, lob, forge bell, hymn, the bellows (on the planted openings) | — | *Every opening here is bigger than it needs to be. Take two. The third wakes him — and a guard at the right instant turns it.* |
| *midpoint* | 50 % | — | the shared beat: 1.5 s stagger, hits in it do not count | — |
| 2 | < 50 % | **the drop** (far deck); **every** opening guarded; ember rain; **meltdown** once at 35 % | hymn rings 2 → 3; the breath 450 → 400; recoveries tighten (`FURN_REC` p2, `bossRest` p2) | *Distance is not safety any more, and no opening is free. Count to two.* |

**The deck** (`fcDraw`, bands < 170 / < 380 / ≥ 380 px; the slam under 100 px
and the forge bell on its own 11–15 s clock sit outside it). Measured over 400
seeded draws each:

| | near | far |
|---|---|---|
| phase one | hymn 70 %, lob 30 % | lob 81 %, hymn 19 % |
| phase two | hymn 69 %, lob 31 % | lob 41 %, **drop 40 %**, hymn 19 % |

`tests/guardians.cjs` (the driven fight): near draws hymn / lob / slam, far
draws drop / hymn / lob, total variation 0.39.

### Teaching pass

| | Death #1 | Death #3 | Death #10 |
|---|---|---|---|
| P1 | "It breathed fire on me while I was hitting it." | "Two hits and out — or jump when it breathes." | "I take two, wait for the glint, and guard it back down its throat." |
| P2 | "It jumped on me from across the room." | "When the cyan brackets close, I run." | "Nothing is free now — two hits, every time, and I watch the sky when I back off." |

### Fairness contract

| Phase | ≥ 1 guaranteed punish | no unreactable damage | no transition punishing mid-commitment | every source visible first |
|---|---|---|---|---|
| 1 | ✓ every move opens; the free lob/bell walk-ins 834–1167 | ✓ shortest tell 450 (the bell's first strike, the breath) | ✓ the breath only answers what she did | ✓ |
| 2 | ✓ the drop's sprawl 600, the slam 400 | ✓ the breath 417; lock → impact 483 | ✓ the midpoint takes a half-drawn breath with it (`fcStep`); a Song stagger waits for a drop to land rather than hanging him in the air | ✓ the landing is marked from the lift-off, fixed at the lock |

---

## B5. Telegraph render directives (as shipped on the existing sheet)

| id | Silhouette | Hue | Particle | Audio | **Recovery read** |
|---|---|---|---|---|---|
| `fc.lob` | standing IDLE, mouth heat | amber | — | `tell_atlas` → `lob` | the walk at her |
| `fc.slam` | the authored tail piece coiled overhead | amber | — | → `slam` | tail planted, grit |
| `fc.forgebell` | reared HERO figure (shared with the hymn — §2bn `bell` fixes it) | amber bloom | sparks per strike | → `bosshit` ×3 | the walk |
| `fc.hymn` | reared HERO figure | amber bloom on the upper body | roar wave | → `roar` | the reared figure holds while the first ring leaves |
| `fc.backdraft` | IDLE rocked back and drawn up; then lunged forward into the cone | amber + **lime glint** (chest) | steam off the plates; fire along the cone | `vent` → `castfire` + `blast` | **cooled**: slumped IDLE under the sheet's warm-shadow copy, the core dark |
| `fc.drop` | FLY figure gathered on the floor; on the wing; nose-down | amber; cyan lock brackets; danger-red mark | dust on lift-off and landing | `launch` + `dash` → `chirp` (lock) → `slam` + `land` | **sprawled**: the same cooled slump |
| `fc.meltdown` | the whole sheet crossfades to white-hot | white, then molten | steam, the slag line | → `roar` | slowed 0.55× for the pour |

**One picture for "now".** Every opening the new moves leave — the vents
cooling, the sprawl, the choke — and the hit-group break use the same slumped,
cooled figure. A player who learns it once reads every window in the fight.

**Verification** — `tests/artbible.cjs` (FURNACE cast extended this pass):

| pair | IoU (ceiling) |
|---|---|
| idle (walk) / lobwarn | 0.582 (0.94) |
| idle / slamwarn | 0.548 (0.90) |
| idle / ventwarn | 0.565 (0.90) |
| ventwarn / vent | 0.409 (0.90) |
| idle / dropcrouch | 0.501 (0.90) |
| ventwarn / dropcrouch | 0.605 (0.90) |
| ventwarn / recover | 0.593 (0.90) — the opening does not look like the breath |
| dropcrouch / hymn | 0.426 (0.90) |
| idle / recover | 0.631 (0.90) |

Amber over a 10.6 % rest: lobwarn 24.4, slamwarn 25.6, ventwarn 47.7,
dropcrouch 38.7, hymn 46.2 (was 17.9 — under the bible's +8; the bloom fixed
it); recover **4.7** (cold). Feet within −5…+3 px of the floor in every grounded
state. `tests/infection-poses.cjs`: his eye on the art in all 18 poses, both
facings.

---

## B6. Close-out

### INTERFACES

**Consumed from the registry:** §1 (the parry window, her recoveries, the
reaction floor), §2 (amber, lime, lock cyan, danger red), §4 (greed test).

**Registry ambiguities — flagged, not resolved:**
1. **Hymn and forge bell share one tell shape** (the HERO figure). The pose is
   briefed (§2bn `bell`); until it lands they are told apart by sound (one held
   roar vs three clapper strikes) and by the spark showers.
2. **Reward gold in his fire.** The hymn's roar wave and some of his glow use
   `#ffd76a` (registry: player-positive only). Predates this pass; left alone.

### UNKNOWN

| # | Value | Why |
|---|---|---|
| 1 | The breath at 400 ms for an eight-year-old | it answers a hit she chose to take, from 0–30 px; the step back is the easy answer. Watch `atlas.vent` vs `atlas.*` in play |
| 2 | Whether players find the parry without the toast | `fc_bellows` says it once per save; the glint is the same one GRAVEHORN taught |
| 3 | The drop over the ledges | he falls through `=` (`thruPlat`) and lands on the floor; a player on a ledge under the lock still meets his body on the way down |

### Changelog

| Value | Before | After | Reason |
|---|---|---|---|
| the machine | inline in `Boss.update` `case 'atlas'` | `js/furnace-fight.js` (`fcStep`), with `FURN_REC`/`furnRecover` moved there | A5: a bespoke move set needs room; one file per guardian, as GRAVEHORN |
| greed | a sentence in this doc | **the bellows**: the third hit in a guarded opening → `ventwarn` 450/400 → `vent` 180 → `recover` 600/500 | the slot was never implemented |
| a parry in zone C | none | the backdraft wears the glint; a perfect guard → `stagger` 1.0 s + the counter | A4's parry had no use between chapter one and the Nest |
| phase two | same moves, faster, plus the pour | **the drop** (far deck 0/1.5/2.5), **every opening guarded**, the breath 400 | "phase two changes the problem, not just speed" |
| veto list, cold-dice floor | none | `fcVeto`; lob after three moves that reached her | boss-openings §4 |
| openings' picture | the walk / an upright idle | the cooled slump (the sheet's warm-shadow copy at 0.85) | artbible: the slumped idle measured 18.7 % amber — a recovery that passed for a wind-up |
| hymn tell | 17.9 % amber (rest 10.6) | 46.2 % — an amber bloom on the reared upper body while the bells (and the forge bell) wind up | the hymn had never been measured; the reared figure outgrew the shared wash |
| `BREAK_KIT.atlas.busy` | `meltwarn` | + `ventwarn`, `vent`, `rise`, `droplock`, `dive` | a break must not delete the answer to greed, nor drop him out of the air |
| outside stagger mid-drop | — | waits for the landing (`FC_AIR`) | a frozen flier hangs over her head |
| NOSTOS (Talos) | the brain ran without the drop/cone marks | `fcDrawFx` under/over his sprite too | same gameplay on both games |
| `tests/guardians.cjs` FURNACE row | 4 releases, 5 tells | + `dive`→drop, `vent`→backdraft; tells + `ventwarn`, `dropcrouch`, `droplock`; strikes `rise`, `dive`, `vent` | the new states, classified; no threshold moved |
| `tests/artbible.cjs` FURNACE cast | idle, lobwarn | + slamwarn, ventwarn, vent, dropcrouch, hymn, recover; `fcStep` read for state names | the new states held to the laws |
| `tests/infection-poses.cjs` atlas | 8 poses | 18 | the eye in every new pose |
| history | — | the 2026-10-08 template pass (planted recoveries, the range deck, the break) and the 2026-09-19 hymn fixes (grounded-only ring, brace, cooldown) are kept unchanged inside this machine | — |
