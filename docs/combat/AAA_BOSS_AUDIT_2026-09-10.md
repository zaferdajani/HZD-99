# CLAWBYTE — AAA boss combat audit (2026-09-10)

This is a source-grounded audit of **all boss encounters currently spawned by the world**. It distinguishes measured facts already present in the combat docs from code-level findings and unknowns that still require runtime capture. No unknown is silently converted into a claim.

## Audit standard
Each encounter is checked for: telegraph readability; movement/animation continuity; active hit shape; recovery/punish window; VFX/SFX and persistent after-effects; arena interaction; phase escalation; exploitability; input/platform risk; and whether the player can force the AI into one safe answer.

## Roster
World/castreel currently exposes 12 boss encounters: ALPHA (A10), NULLFANG (A4), CHIME (A9), TALONHOST (B4), CARRIER (B8), FURNACE CHOIR (C3), KILN-MOTH (C7), GLACIERE (D3), LATTICE (D6), MOTHER-V (E3), THE LENS (E6), PRISM PROWLER (X1).

## Cross-fight findings

### Critical — all five Eye constructs can be range-locked
`MINI_KIT` drives CHIME/CARRIER/MOTH/LATTICE/LENS through one state machine. At each decision, if `adist > K.near`, the state is **always** `K.far + 'warn'`; only inside `near` does the machine alternate close/far. This means a player who can hold the far band can intentionally suppress the close attack and force a single repeated answer. That is deterministic exploitation, not mastery.

The affected thresholds/actions are:
- CHIME >190 px => always RING (8 slow notes at 180; source says slow enough to walk out of).
- CARRIER >230 px => always TOSS; close LUNGE at 480 is removed from the fight.
- KILN-MOTH >210 px => always CINDER; close DROP at vy 620 is removed.
- LATTICE >260 px => always GROW; close SPIKE fan is removed. GROW is at least persistent, so this is the least trivial of the five.
- THE LENS >300 px => always BEAM; close LUNGE at 420 is removed.

AAA correction required: far range may *weight* the far move, but may not guarantee it indefinitely. Add anti-repeat/deck memory, a distance-closing move, or a far-band punish so spacing is a choice rather than an AI off-switch.

### High — construct family risks feeling templated
All five use the same grammar: drift/stand -> one `TELL_FAST` warning -> committed close/far action -> recovery. The object silhouettes are distinct, which is good, but fight cadence and decision structure are too similar. Unique persistent consequences are needed per construct, not just different projectile geometry.

### High — several major-boss uncertainties are exactly in the exploit/fairness layer
Existing combat docs still mark critical unknowns: NULLFANG pounce/dive recovery; TALONHOST full-spread ledge safety and feather danger map; FURNACE destructible-weapon viability and hymn gaps; GLACIERE prison geometry and Absolute Zero screen visibility; PRISM split spots/off-screen placement and storm duration; MOTHER-V grab/ring recovery, mirrored-control parity across touch/pad, and Total Null audio separation.

## Encounter-by-encounter

### THE ALPHA — A10
**Role:** pack mini-boss / band-based pressure.
**Moves:** close claw/bite (350 ms authored warning strips), mid-range coil -> leap, far roar or brood call. The authored strips include prowl, roar, howl, coil/leap/recoil, claw, bite and clinch/shake. AI tracks range bands and has a denial counter: after three denied openings it deliberately returns to the close pair after an extra 0.7 s beat.
**Strength:** substantially stronger AI structure than the Eye constructs; it does not let one failed interaction starve the player forever. Dedicated wind-ups and recovery strips support readable body language.
**Exploit risk:** medium. Range bands remain player-manipulable, but unlike the constructs, far range has more than one outcome and the denial rule pushes the fight back toward an opening.
**Runtime audit needed:** clinch/shake hit ownership and release timing; leap landing/recoil collision; pack summon density; whether 350 ms close tells read clearly at phone scale.

### NULLFANG — A4
**Role:** reaction-test guardian.
**Measured kit:** swipe 500 ms tell; pounce 450; roar 500; dive 450; one null-gravity transition 1100 below 50%. Phase-two swipe always doubles. Minimum documented punish after the second swipe can fall to ~317 ms. Roar shoves but does not directly damage; null-gravity is an arena after-effect.
**Strength:** cleanest telegraph teaching fight. Every threat has a declared answer and phase two increases pressure without shortening tells.
**Intentional exploit/mastery:** baiting swipe around the edge of its 108 px reach is explicitly part of the design. This is acceptable because it requires spacing and phase-two discipline rather than switching the AI off.
**Risk:** pounce and dive recovery remain unmeasured. Until those are measured, it cannot be proven that every successful dodge produces a fair punish. Runtime check required for landing animation/collision continuity under null gravity.

### CHIME — A9
**Role:** Eye construct.
**Code kit:** hover, 120 movement speed, near=190; close NOTE, far RING; committed duration 0.5 s. RING emits 8 notes at speed 180 and is explicitly described in source as slow enough to walk out of. NOTE fires three aimed notes in a narrow ±0.22 rad fan.
**Exploit:** critical. Stay >190 px and RING is forced forever. Because RING is intentionally walkable, spacing can turn the entire encounter into one low-risk loop.
**AAA correction:** the ring must either reshape the arena/close space after firing, or far spacing must sometimes trigger a reposition/fast note pattern. Recovery must be measured before tuning damage.

### TALONHOST — B4
**Role:** arena/positional guardian.
**Measured kit:** VOLLEY 900/550 ms tell (5/7 feathers; phase two second fan), SWOOP 550, BROODCALL 500, and a fixed four-beat spine where REST is the fourth beat. REST places the boss in claw range for ~2.9 s p1 / ~2.0 s p2. Below 40%, coolant crash freezes the floor for 7.5 s and creates another ~1.7 s grounded opening.
**Strength:** strong arena identity; cable motion, ceiling station, cover ledges and ice after-effect all reinforce one positional question.
**Exploit risk:** high if REST landing location is easy to pre-position against. A fixed four-beat cycle plus 2–3 s vulnerability can become rote damage rather than positional mastery.
**Fairness risk:** current docs do not prove that B4's four-tile ledges fully shelter the phase-two seven-rank feather fan. That must be measured in runtime; otherwise the intended counter may fail.

### CARRIER — B8
**Role:** Eye construct.
**Code kit:** hover, speed 175, near=230; close LUNGE (480), far TOSS, duration 0.42. TOSS launches a heavy gravity arc using the player's horizontal position at fire time.
**Exploit:** critical. Hold >230 px and the 480-speed lunge disappears; only the telegraphed projectile remains. A continuously moving player can then reduce the fight to one projectile read.
**AAA correction:** far range should provoke route-crossing/reposition pressure, not remove it.

### FURNACE CHOIR — C3
**Role:** greed-test guardian.
**Measured kit:** SLAM 550 ms + floor shockwaves; FORGEBELL 300 ms + 3 falling weapons; HYMN 1000 ms + 2/3 heat rings; MELTDOWN 1200 ms then floor hazard for 6.5 s; phase-two ambient ember every 1.1 s. Documented punish windows are very large (~1.6–3.0 s).
**Strength:** excellent thematic after-effects; attacks leave things the player must continue managing after the boss itself becomes punishable.
**Balance risk:** high. The intended trap is greed, but a disciplined two-hit-and-leave loop may be too safe because the windows themselves are enormous. The 300 ms FORGEBELL warning is also the shortest documented major-boss tell and is explicitly flagged as questionable for the target child audience.
**Unverified:** whether the three forge weapons are actually destructible quickly enough for that to be a real counter; whether phase-two hymn gaps are physically threadable.

### KILN-MOTH — C7
**Role:** Eye construct.
**Code kit:** hover, speed 150, near=210; close DROP, far CINDER, duration 0.55. CINDER scatters 7 falling projectiles over a wide horizontal range; DROP sets vy=620 straight down.
**Exploit:** high. Stay >210 px and DROP is suppressed indefinitely. CINDER does provide area denial, so this is less trivial than CHIME/CARRIER, but the player's range still chooses the boss's moveset rather than influencing it.
**AAA correction:** cinders should shape where the next drop happens, creating a two-move sentence rather than independent alternating attacks.

### GLACIERE — D3
**Role:** pattern-memory guardian on ice.
**Measured kit:** explicit 5-beat cycle: lance, shard, lance, dash, orbs/prison, with reactive nova and Absolute Zero layered over it. Dash leaves a biting ice trail. Below 40%, Data Corruption makes the HUD lie and speeds the boss 1.45×. Dash recovery is ~667 ms; other major openings are ~1.3–2.1 s.
**Strength:** one of the strongest fight concepts. The phase-two mechanic attacks the player's instrumentation while preserving the memorized pattern.
**Exploit risk:** medium-high. The fixed modulo-5 spine is deliberately learnable but can become fully solved if reactive interrupts do not meaningfully alter spacing/timing. Standing just outside nova's proximity trigger is already documented as a mastery position.
**Fairness risk:** PRISON is created from idle without a dedicated warning state in the table; exact closing geometry is still unknown. Absolute Zero visibility at camera extremes is unverified.

### LATTICE — D6
**Role:** Eye construct.
**Code kit:** grounded, speed 90 but described as not chasing, near=260; close SPIKE, far GROW, duration 0.6. GROW creates three floor columns marching toward the player and is the only construct attack explicitly described as persisting after it fires. SPIKE fires three forward shots vertically offset.
**Exploit:** medium-high. Far-lock still exists, but GROW's persistent geometry means repeatedly forcing the far move may eventually reduce safe space rather than trivialize the fight.
**AAA opportunity:** strongest construct foundation. Persisted growth should become stateful arena evolution (break/shatter/re-route) so the fight escalates instead of repeating identical columns.

### MOTHER-V — E3
**Role:** final guardian / resource-management fight.
**Measured kit:** NULLWAVE 1100 ms (1/2 rings) + 640 shove + 1.2 s slow + 1.0 s stagger; SONG 1600 ms locks Song 10 s and reverses controls 5 s; GRAB 500 ms; ring charge 700 ms; beam uses a marked rectangle; phase shifts at 75/50/25%; TOTAL NULL blacks the arena for 8.4 s below 20%. Song can buy 3 s of sight.
**Strength:** highest systemic ambition in the roster. The after-effects continue to change the player's economy and perception after each attack rather than ending at hitstop.
**Critical verification risk:** grab/ring recoveries are still unmeasured; mirrored controls have not been verified across touch and pad; Total Null's entire fairness exception depends on audio cues that have not been measured against ambience. Those are ship-blocking verification gaps for a final boss.

### THE LENS — E6
**Role:** Eye construct.
**Code kit:** hover, speed 140, near=300; close LUNGE at 420, far BEAM, duration 0.7. Source states the beam's focus draws the line first and the attack then arrives on that line.
**Exploit:** critical/high. >300 px forces BEAM forever, removing its lunge. If the beam line is readable, this becomes a single-answer rhythm.
**AAA correction:** lens focus should force displacement into a follow-up lunge/crossfire; it needs a sentence, not two independent attacks selected directly by player distance.

### PRISM PROWLER — X1
**Role:** mix-up / identification guardian.
**Measured kit:** DASH 350 ms, POUNCE 300 ms, SPREAD from idle, LIGHT SPLIT 950 ms, ARC OVERLOAD 1200 ms. Dash and pounce intentionally begin from similar low coils and require opposite answers. Phase-two dash recovery can fall to ~467 ms. Light Split creates three spots: two decoys fire bolts and the real body pounces. Arc Overload makes it temporarily untouchable.
**Strength:** high skill ceiling when silhouettes are readable; the opposite-answer mixup is legitimate design if visual distinction survives native resolution.
**Fairness risk:** 300/350 ms is aggressive, particularly on small displays. SPREAD is listed as firing from idle with no dedicated tell; that is a real telegraph inconsistency. Light Split can potentially place the real spot off camera (still unverified), and storm duration remains unknown.

## Priority order before calling the roster AAA-ready
1. Eliminate deterministic far-band move locking in all five constructs.
2. Runtime-capture and measure every still-UNKNOWN recovery/counter geometry listed above.
3. Fix no-wind-up damage sources (especially PRISM SPREAD; review GLACIERE PRISON/FURNACE LOB under the same rule).
4. Validate platform parity for MOTHER-V reversal and Total Null audio clarity.
5. Validate TALONHOST phase-two ledge cover and FURNACE hymn/forge-weapon counters with real hit geometry.
6. Run every fight at native 960×540 plus phone scale and compare telegraph silhouette, effect persistence, recovery pose, and collision to the state machine.
7. Only then tune HP/damage/openings. Tuning numbers before the counter is proven would hide bugs rather than balance the encounter.
