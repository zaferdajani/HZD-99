# BOSS_GRAVEHORN — the Eye's soldier on the marble

Written from `BOSS_TEMPLATE.md`. The machine is `js/gravehorn.js` (`ghStep`,
`ghDecide`, `ghPose`); the fight is played and measured by `tests/gravehorn.cjs`
(in `tests/run.cjs`). Every number below was read off his own simulation clock
(`b.ghLog`, stamped in `ghStep`) by that harness, not copied from the tuning
sheet — where the two differ the measured one is quoted, and the sheet value
is in brackets. Timings in **ms**.

The owner, 2026-10-11: *"a very dangerous, evil rhino that works under the robot
that stole the mother's song ... let it introduce itself as its right hand or its
soldier ... this rhino shoots missiles as its horn leaves its body. It charges at
you ... if it's next to you, it can just hit you with its horn to push you far
away. It will make you dizzy ... You can parry with the normal hit ... second
phase ... two horns being shot ... its charge will be faster, its hit will be
stronger, but also it can kick if you're standing behind it."* And earlier:
*"make it worth fighting, not just something that goes left and right and jumps."*

---

## Assignment

| | |
|---|---|
| Kind / name | `horn` / **GRAVEHORN, First Soldier of the Eye** |
| Zone | A (chapter one) — the quarry cavern **CV3**, standing on the raw marble |
| **Difficulty slot** | *proposed* — **the answer test** (registry §4 is frozen: see INTERFACES) |
| ID prefix | `horn.` (`G.dmgLog` keys: `horn.missile`, `horn.blast`, `horn.charge`, `horn.trample`, `horn.toss`, `horn.kick`, `horn.rock`) — *proposed*, see INTERFACES |
| Palette | telegraph amber `#ffc24a` (every wind-up; his identity red lerps toward it); lock cyan `#8ff6ff` (the missile's lock flash, the small horn's aim line — "you are targeted specifically"); danger red `#ff5f6d` (the rock shadows' rim, the blast); his own identity red `#ff3b2a` (eye, nozzles, phase-two cracks) |
| Art | **class B parts rig** (ART_BIBLE §1/§3). Plates briefed in `docs/ART_QUEUE.md` §2bf, none fired yet; every part draws a flat gunmetal **stand-in** in its plate's frame until `assets/characters/gravehorn/<part>.webp` exists (see *Authored-art ledger*) |
| State machine | `js/gravehorn.js` `ghStep` (dispatched from `Boss.update` before any guardian logic: no fork, no midpoint, no purification) |
| HP | `BSTAT.horn.hp` 220 → **329 per phase** on Normal (×1.15 FOE_HP ×1.3 ZONE_ATK.A; 247 on the easiest preset); two phases. Fought with **claws and the Volt Burst only** (the blade is forged from what he guards) |
| Body | collider 176×120; hump top **132 px**, snout to tail **243 px** (her drawn height measured **66 px**, collider 36; her running-jump apex measured **216 px**). See *Changelog: size* |

**The one sentence.** *GRAVEHORN is the fight where every move has a different
answer — jump the charge, step out of the horn's lock, meet the toss with a
strike — and the first fight that teaches a parry.* NULLFANG proved that amber
plus a sound means "something is coming"; GRAVEHORN asks the next question:
*which thing, and so which verb.*

**Who he is.** Not infected by accident and not a guardian: the Eye's own heavy
trooper, posted on the raw marble so that the blade that cures is never made.
There is nothing in him to cure, so he is not cured; beaten, he backs into the
rock and leaves, vowing the Eye will come — a recurring lieutenant, never a kill.

---

## B1. Move table

`opening_ms = recovery_ms − 33`

| id | state (tell → active → recovery) | tell ms | active | recovery ms | hitbox | channels | dmg | intended_counter | opening_ms | notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `horn.missile` | `hornprep` → `hornfire` → `hornless` → `hornseat` | **700–733** [700] | launch 350–367 [340]; the horn climbs out of the head (steep, 420 px/s), homes ≤ 3.2 rad/s until **LOCK at 350–400 ms** [350] — at the lock it turns ONTO her and dives, 300 px/s accelerating 700 px/s² to 640, dead straight from there; 2.0 s life | `hornless` **2416–2483** [2.5 s away] + `hornseat` 333 | 22×22 at the tip; blast r 46 px | amber nozzle glow + head drop & shake + smoke + `tellbig`; lock: cyan flash + `chirp` | 1 core | **move** (out of the line after the lock) / **deflect** (a claw swat bursts it harmlessly) / then **bait-and-punish** the bare head | **2483–2750** | hornless he cannot charge or toss; hits on the HEAD deal **+40%** (measured 17 vs 12). The horn flies home **harmless** |
| `horn.charge` p1 | `chargewarn` → `rush` → `skid`+`recover` **or** `wallslam`+`stunned`+`recover` | **800–833** [800] | rush **640 px/s**, accel 2600 px/s² | skid 433–450 + recover 633–650 = **1067**; wall: 217 + **1200–1233** + 350–383 | his body (front/rear boxes, to the floor) + head | two hoof scrapes (grit thrown back, `step`+`grind`), head lowers, amber, eye flare 160 ms before | 1 core + thrown (540, −440) | **jump** it | skid **1034**; wall **≥ 1535** | the take-off window, measured with the keyboard: **0.25–0.52 s before contact clears him; 0.10–0.20 is hit** (at ~10 fps headless; finer at 60). A charge that ends in rock brings **3 rocks** down, each with a **650 ms** shadow first |
| `horn.charge` p2 | `chargewarn` → `rush` → `wallturn` → `chargewarn` (long) → `rush` → end | 833, then **1066–1083** [1050] | rush **830 px/s** (1.3×) | first leg: `wallturn` (no window); last leg as p1 (stun 1000) | as p1 | the second wind-up has a **third scrape** and is 250 ms longer — the end of the chain does not look like its middle | 1 core | **jump** both | last leg only | boss-movegen *chained* |
| `horn.toss` | `tossprep` → `toss` → `tossrecover` | **450–483** [450] | 300; hits in its first 200 ms (the scoop in front of the snout to 140 ms, then horn/head) | **666–683** [680] (p2 600) | scoop 46×78 ahead of the snout, horn, head | snort (steam), head drops LOW, weight back onto the haunches, amber; the lime parry glint on the horn for its whole parry window (`js/parry.js`) | 1 core, thrown **far** (p1 520/−700 → measured rose **107 px**, carried **229 px**), **DIZZY 1.4 s** (p2 640/−820, 1.8 s) | **out-range** (stay off his snout) / **parry** | **633–650** (p2 567) | only when she is within 78 px of the snout, in front, near the floor |
| `horn.parry` *(her move)* | her strike on the horn/head/scoop in the last **150 ms of `tossprep`** or the first **200 ms of `toss`**, facing him | — | — | he `stagger`s **900** | her claw box | steel ring (`block`+`bosshit`+`crack`), white/steel sparks, 140 ms hit-stop, both shoved apart | she takes **0** | — | **867** | measured: a strike at t=0.067 s clashes; one at t=0.367 s does not and the toss lands. Taught once, the first time a toss is used (`grv_parry_hint`) |
| `horn.parry` *(perfect guard)* | GUARD raised ≤ **140 ms** before the toss lands, facing him (the A4 parry, `js/parry.js`) | — | — | the same `stagger` **900** via `ghClashed` | — | the shared clash; the counter opens (600 ms, 36 fixed, invulnerable) | she takes **0** | — | **867** | measured in `tests/gravehorn.cjs`: raised at t=0.033 s turns it; held from the wind-up only blocks |
| `horn.kick` p2 | `kickprep` → `kick` → `kickrecover` | **350–383** [350] | 220–250; live 30–160 ms | **550–566** | 92×74 behind the rump | hind legs gather, head comes up and the eye-light is thrown back over the shoulder, amber | 1 core + driven away (560, −380) | **out-range** (step out from behind) / **jump** | **517–533** | drawn only when she stands behind him within 104 px of the rump; never in phase one (he turns, and the turn is the opening) — 150/150 vs 0/150 measured |
| `horn.rock` | shadow on the floor → fall | **650** | ~500 fall | — | 22–30 px rock | the shadow grows with a danger-red rim; grit trickles from the roof | 1 core | **move** | n/a | only after a wall slam; one rock aimed near her if she is within 640 px |
| contact | `rush` (any box), or a body moving > 150 px/s | — | — | — | front/rear/head | — | 1 core | — | — | **a standing rhino is a wall, not a weapon**: still, he pushes her out of his body and does not hurt her (so a stun can be punished up close) |

### Hit-group break (`dazeAt` 6, span 2.6 s)

Six hits inside 2.6 s, out of anything he is not committed to (and never inside the hornless window), put him in `daze`
for **1.4 s** (p2 1.1), taking `DAZE_MUL` damage; then 6 s (p2 7 s) before it can
open again. Committed (`GH_BUSY`): `rush`, `toss`, `kick`, `hornfire`,
`wallslam`, `wallturn`, the cinematic beats, `stunned` and `daze` themselves.

### B1 audits

**Empty or ambiguous `intended_counter`:** none.

**`opening_ms ≤ 0`:** none. The smallest is the phase-two kick, **517 ms**.

**Wind-ups not matching `TELL_ST`:** none — `hornprep` (prep), `chargewarn`
(warn/charge), `tossprep` (prep), `kickprep` (prep). No active or recovery state
matches (`hornfire`, `hornless`, `hornseat`, `rush`, `skid`, `recover`,
`wallslam`, `stunned`, `toss`, `tossrecover`, `stagger`, `kick`, `kickrecover`,
`wallturn`), measured by `tests/gravehorn.cjs`. `tests/tells.cjs` drives him
with the other bosses and finds no one-channel telegraph.

---

## B2. Opening design

| Move | Mechanism | The design, with the arithmetic |
|---|---|---|
| `horn.missile` | **conditional** | The window is 2.5 s (p2 3.0–3.3 s) — but it opens with a horn in the air coming at her. Survive the shot (out of its line after the lock, or swat it) and the head is bare for the rest: 2483 ms nominal, about **1.2–1.5 s** after the missile resolves, at +40% on the head. The hit-group break is neither taken NOR COUNTED inside this window (it would stack two payouts). Fits three hits; the shot is the price. |
| `horn.charge` (wall) | **baited** (rung 5) | She CREATES this one: stand with rock behind her, jump the charge, and he runs into the rock — 1200 ms stunned + 350 ms getting up = **≥ 1535 ms**, the fight's gift, reached only by reading the arena. A charge she dodges in the open skids: **1034 ms**, behind him, two hits. |
| `horn.toss` | **specific** (rung 3) | Two answers with opposite shapes: stay off the snout (then there is no toss), or meet it — the parry turns a 1-core throw into an **867 ms** stagger in front of his face. A toss that whiffs leaves 633 ms. |
| `horn.kick` | **positional** (rung 2) | Behind him is phase one's safe place; phase two takes it away. 517 ms if she stepped out. |
| hit-group | **greedy** | Six hits in 2.6 s break him for 1.4 s — the third combo inside a missile window is where greed lives. |

---

## B3. Phase structure and teaching

| Phase | HP threshold | Moves added | removed | modified | Arena change | **What it teaches** |
|---|---|---|---|---|---|---|
| **1** | 329 → 0 | missile, charge, toss (+parry), the turn | — | — | the cavern (CV3, tiles 2–37), rock shelf at the east end, the cave-mouth rock at the west | *Each move has its own verb: jump the charge, step out of the lock, strike the horn.* |
| *transition* | 0 HP in phase one | — | — | — | — | `kneel` 900 → `rage` 1700 (the phase-two line, armour blown off, the second horn lights, HP refills). She is **held** and he **takes nothing** (measured: a 50-point hit during the kneel changes nothing). No damage source is live: horns in flight are turned home harmless, rocks are cleared. |
| **2** | 329 → 0 | twin missiles (the small horn **450–483 ms** after the big, direct, with a lock-cyan aim line in the gap); the **rear kick** | the turn (from behind he kicks instead) | charge 1.3× and **chained** off the wall (the second wind-up longer, three scrapes); toss throws harder and leaves **1.8 s** of stars; recoveries shorter (`bossRest` p2) | — | *The same three verbs, closer together — and behind him is no longer safe.* |
| *end* | 0 HP in phase two | — | — | — | the room unlocks | `beaten` 1000 → his two lines → `retreat` 2800 (he backs into the rock and is gone). Flag `bossHorn`, saved; the cave's crawlers and bats come back on the next entry; the marble pillar is walked to and freed by the Volt Burst exactly as before. |

### Teaching pass

| | Death #1 | Death #3 | Death #10 |
|---|---|---|---|
| **P1** | "His horn flew at me — and I could hit it." | "Jump when he is half a body away, and if there is rock behind me he hits it and stands there." | "I stand with the shelf at my back, jump him, punish the stun, and strike the horn when it glints." |
| **P2** | "Two horns, and the second one comes straight." | "The second charge comes back off the wall — and its wind-up is longer, so I know which one ends." | "Behind him is not safe any more: the hind legs gather, and I step out." |

Neither phase is a random number generator: every death is attributable to one
read, and the reads do not alias (the three wind-ups move different parts — the
head drops and SHAKES, a forefoot SCRAPES, the haunches LOAD — and the kick is
the only one where the head comes UP).

### Fairness contract

| Phase | ≥1 guaranteed punish | no unreactable damage | no transition punishing mid-commitment | every damage source visible first |
|---|---|---|---|---|
| 1 | ✓ toss recovery 667 ms, skid 1050, hornless 2400 | ✓ shortest tell 450 ms (toss); the missile's lock 350 ms after a 700 ms tell | ✓ the kneel holds both of them and deals nothing; shots in flight go home harmless | ✓ every move has a wind-up; rocks show their shadows 650 ms first |
| 2 | ✓ kick 517 ms, stun 1000, hornless ~3000 | ✓ shortest tell 350 ms (the kick — answered by a STEP, from a place she chose to stand) | ✓ the second charge's wind-up is 250 ms longer than the first's | ✓ the small horn's line is drawn for the 450 ms before it leaves |

### Played through (tests/campaign-ch1.cjs, ordinary input, easiest preset)

The chapter-one autopilot reads him off the screen and plays the keyboard (jump
the charge at time-to-contact ≤ 0.38 s, strike the toss in its last 140 ms, back
off a kick, sidestep the dive, punish the head). From the servo save, final
build: **intro 02:36 → bellow 02:41 → phase two 03:11 → beaten 03:25**, 4 cores
lost, **0 deaths, 0 page errors**, marble mission done. Phase one took three
missile cycles and two charges (29 s); phase two 14 s on this run, 30 s on the
previous one (it is decided by how many hornless windows she reaches his head in).

**Dizzy is not allowed to be a trap.** It lasts 1.4 s (p2 1.8 s), she has 1.3 s
of i-frames from the hit, and while she is dizzy he does not START a move
(measured: standing at his snout through a whole dizzy, nothing lands).

### DIZZY — a status any boss can use (`playerDizzy(sec)`)

Stars circle her head. **She can walk, at 45% speed (measured 153 px/s), and do
nothing else** — no jump, strike, dash, burst, heal, guard or power (`DIZZY_BLOCK`
in `js/entities.js`, applied once in `Player.update` for every input device). It
never stacks (`playerDizzy` refuses while one is running). A body thrown by a
boss (`player.flungT`) keeps its flight: low friction, no input steering, and
the jump-release cut does not eat the throw.

---

## B5. Telegraph render directives

| id | Silhouette delta | Hue | Particle signature | Audio | Recovery read |
|---|---|---|---|---|---|
| `horn.missile` | the head drops and shakes; the big horn's nozzle lights | red nozzle lerping to amber; lock: cyan | smoke from the socket; on launch a red burst; a smoke trail behind the flying horn | `tellbig` → `launch`+`shoot` → `chirp` at lock → `blast` | **the socket is EMPTY** (a dark hole where the horn was), the head hangs low and he snorts steam |
| `horn.charge` | the head goes to the floor, the body crouches, a forefoot scrapes back (twice; three times for the chain's second) | amber; eye flare | grit thrown BACKWARDS off each scrape | `tellbig` → `step`+`grind` per scrape → `launch` | skid: dug-in front feet and a dust wake; wall: the roof falling, **stars** (pale steel, not amber) over a head hanging low |
| `horn.toss` | the head drops LOWEST, the weight goes back onto the haunches | amber | steam from the nostrils; a white glint on the horn 150 ms before | `tellbig` → `vent` → `launch` → `slam` when the forelegs land | forelegs crash down, dust, the head shakes |
| `horn.kick` | hind legs step in under him; the head comes UP; the eye-light thrown back over the shoulder | amber | — | `tellbig` → `launch` → `slam` | rear drops back, a heavy `land` |
| phase change | on his knees, then rearing | red cracks, red jets along the spine | armour plates thrown off; a red ring | `slam` → `quake`+`roar`+`blast` | — |

**Verification** — the harnesses, in motion, and the 844×390 photographs in
`docs/studio/runs/2026-10-11/images/gravehorn-*.png`:

| id | reads at native size | distinct from every other tell in THIS fight | amber used only while winding up | verdict |
|---|---|---|---|---|
| `horn.missile` | ✓ IoU vs rest 0.52 | ✓ head shakes; the only tell with smoke at the snout | ✓ 45.3% amber vs rest 0.0% | pass |
| `horn.charge` | ✓ IoU vs rest 0.52 | ✓ the only one with a foot moving | ✓ 46.7% vs 0.0% | pass |
| `horn.toss` | ✓ IoU vs rest 0.45 | ✓ lowest head, weight back | ✓ 56.4% vs 0.0% | pass |
| `horn.kick` | ✓ IoU vs rest 0.82 | ✓ the only one with the head up | (p2) | pass |

(`tests/artbible.cjs`, GRAVEHORN: every pair under its ceiling, cold states 0.0%
amber, five value bands, feet on the floor at +2 px in every grounded state.)

### The gait

Feet are planted in WORLD space: a hoof in stance does not move (measured max
drift 0.00–0.37 px while he walks 229–234 px) and stands on the drawn floor
(`groundColumnAt`, measured |hoof − floor| 0.00–2.46 px worst over runs). The step is judged one
frame ahead, so a slow device's long frame never draws a leg past its reach. A foot lifts when its hip has
carried far enough past it **and** it is that foot's turn (hind-left, fore-left,
hind-right, fore-right — the 4-beat walk), or whenever it would leave the leg's
reach; it lands ahead of the hip on the floor under it. So cadence comes from
speed, order from the gait, and the reach never runs out. Above 300 px/s the same
rule makes a gallop (shorter, overlapping steps). Two-segment IK per leg, the
fore-knee forward and the hock back; the hoof is drawn level on the floor; the
body dips as each foot takes weight and the head counters it. Dust on every
plant; the charge's plants shake the camera. Turning is weighted: plant, pivot
over **350 ms**, dust as the body passes edge-on.

### Authored-art ledger

| asset (`assets/characters/gravehorn/`) | move ids | prompt | generated | verified | status |
|---|---|---|---|---|---|
| `body`, `head`, `head_roar`, `horn_big`, `horn_small`, `fleg_up`, `fleg_low`, `hleg_up`, `hleg_low`, `tail` (`.webp`) | all | ART_QUEUE §2bf rows 2–11 | **no** | — | stand-in drawn in the plate's frame |
| `body2`, `head2`, `horn_big2`, `horn_small2` (`.webp`) | phase two | §2bf rows 12–15 | **no** | — | stand-in (cracks, vents, red tips) |
| `design.png` (archive only) | — | §2bf row 1 | **no** | — | — |

Wiring: `build.cjs` lists the `.webp` files present as `window.GH_FILES`;
`js/gravehorn.js` registers only those as `gh_<part>` media keys (nothing names a
file that is not on disk), and `ghPart` draws a plate wherever one exists, fitted
to `GH_BOX[part]` with its pivot at `(ax, ay)` (fractions of the plate). When a
plate lands: drop it in, rebuild, photograph it, and correct that part's
`GH_BOX` fractions from the keyed plate if its joint is not where the stand-in's
was. Lower-leg plates carry their own hoof (the stand-in draws its hoof level at
the foot; a plate's hoof will turn with the shin until a counter-rotation is
added — re-run `tests/gravehorn.cjs` §9 and `tests/artbible.cjs` after).

---

## B6. Close-out

### INTERFACES

**Consumed from the registry:** player capability sheet (§1); telegraph amber,
lock cyan, danger red (§2); zone A.

**Registry ambiguities — flagged, not resolved:**
1. **There is a parry now.** The registry (§1 "Block / parry: DOES NOT EXIST"),
   the combat bible and `combat-design` §0 say so; the owner ordered one for this
   fight ("you can parry with the normal hit"). It is scoped to his toss (a strike
   on the horn in a 350 ms window) — no general parry verb exists. Stage C should
   amend §1 and HERO_ANSWERS §2.
2. **No ID prefix in §3.** `horn.` is used (matching the `alpha.` keys the Alpha
   already writes). Proposed: `gh`.
3. **No difficulty slot in §4** — the six were assigned before he existed.
   Proposed: *the answer test* (above). Zone A now holds two named fights before
   NULLFANG's reaction test; GRAVEHORN comes first in the story (the marble is
   before the forge, which is before the lion).
4. **The Eye is named in chapter one.** `tests/story-sheet.json` now lists
   `ghMet` as a way the Eye becomes known; STORY_SCRIPT §0 notes it. The script's
   §8.1 ("named at the end") is the owner's to reconcile.

### UNKNOWN

| # | Value | Why |
|---|---|---|
| 1 | The jump window at 60 fps | measured at ~10 fps headless (0.25–0.52 s before contact); finer frames should widen it at the short end |
| 2 | Plate pivots | no plate exists; `GH_BOX` fractions are the stand-ins' |
| 3 | Threat budget | `tests/threat.cjs` reads authored room contents; a boss room is not budgeted (registry §5) |

### Changelog

| Value | Before | After | Reason |
|---|---|---|---|
| CV3 contents | 2 crawlers, 2 bats, scrap, pillar | + `['boss', 33, 16, 'horn']`; crawlers and bats gated on `bossHorn` | the owner's boss on the marble; a crawler under a charge is noise, not a read. His fight pays the volts the crawlers used to |
| CV3 floor | rolling knobs + a one-tile plateau (tiles 22–34) + knobs at 5, 9 | anchors `{x:12,w2:10,h2:5}`, `{x:30,w2:7,h2:5}`: one rolling floor from the mouth to the shelf (tiles 2–37) | a charge needs a line; a 243 px body on a staircase is a body stepping, not charging. The surface curve still rolls it; the shelf at 38–47 is the east wall |
| size: hump top | brief: 2.2× her height; order: 2.4–2.6× | **132 px = 2.0× her drawn 66 px (3.7× her collider)** | measured: her running jump rises 216 px and spends ~0.49 s above 160 px — a 160+ px back left a frame-perfect window. At 132 px the measured take-off window is 0.25–0.52 s |
| size: length | 3.6× | **243 px snout to tail = 3.7×** | — |
| `away` (hornless, p1 / p2) | — | 2.5 s / **3.4 s** | p2 at 3.2 s measured only 265 ms longer than p1; the brief asks for a "longer hornless opening" |
| gait reach | 32 px + 8 | **30 px + 6** | at 32+8 the far hind leg ran 1 px out of reach (measured drift 1.07 px, floor gap 3.07 px) |
| toss | head to 0.66 rad, no lurch | head to 0.96 rad, a 24 px lurch, the scoop box | measured: the first cut never reached her standing at the snout (the horn passed over her head) |
| `BSTAT.horn.hp` | 150 | **220** | the chapter-one autopilot ended phase one inside ONE hornless window (168 → 0 in 4 s on the easiest preset: +60% head bonus and a hit-group break stacked on it) |
| head bonus / break in the window | +60%, break allowed | **+40%, no break in `hornless`/`hornseat`** | same run |
| clash sparks | lock cyan | steel `#dfe6ee` | cyan is reserved for "you are targeted" (registry §2) |
| stunned stars | `#ffe08a` | steel `#eef0f4` | the yellow measured as amber in a cold state |
| the big horn's flight | launched forward-up, homed until the lock, then straight on whatever heading it had | launched **steeply up**, homed until the lock, then at the lock it **turns onto her and dives** (300 px/s, +700 px/s² to 640) | the autopilot stood at his head and took the whole window while the horn wandered off: the shot was not a price. Now the window opens with a dive aimed at her that must be sidestepped after the cyan flash |
| hip height | 10 px under the barrel line | **13 px** | measured: on CV3's rolling floor a hoof planted 5 px below his body line was 84 px from its hip — 2 px past the leg — and was drawn dragged (1.78 px drift, 3.93 px floor gap) |
| step trigger | lag past reach | lag past reach **one frame ahead** | at 10 fps a frame is 10 px of walk; the foot lifted a frame late |
| hits in the hornless window | counted toward the hit-group break (the break itself refused) | **not counted** | measured: the count carried over and the first blow after the horn seated broke him — 247 → 97 in the window, then 97 → 0 in the break; phase one lasted 9 s |
| infection eye | none reported | `infEyeMark` at the drawn eye, in the head's transform | tests/infection-roster.cjs: every guardian looks out through a purple infection eye; his rides every state, both phases, hornless (measured: 1 eye, inside the head box, in 20 poses × 2 facings) |
| drawing an un-stepped body | crashed (`b.missiles` undefined) | missiles/rocks/horns defaulted in `drawGravehorn` | the roster spawns and draws every boss without stepping it |
| a stagger from outside (`stagT`: the Song, a weakness) | set, never spent | holds him where he stands, shots keep flying, cinematic beats untouched | tests/kingdom.cjs's stagger contract; without it a Song stagger would have stuck |
