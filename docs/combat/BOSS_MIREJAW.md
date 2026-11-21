# BOSS_MIREJAW — the swamp crocodile (a mini-boss of the Conduits)

Code: `js/mirejaw.js` (`mjStep`, `mjDraw`, `mjHide`), room `SW3` (js/world.js), harness
`tests/mirejaw.cjs`. Built on the lion engine: Higgsfield takes of this machine performing a
real crocodile's moves, cut by `tools/lion-studio.py` (assets/source/swamp/).

**Owner, 2026-11-21.** "crocodiles usually have a special power... biting on you and rolling
over... If it catches you and takes you into the water, that will be bad... reduces 2 points" ·
"biting should be epic... one of the strongest bites in the whole world" · "crocodile skin is
super thick, so it needs a weak point to hit" · "a swamp with water, platforms on the water,
like small islands... zoom out".

**The one sentence.** *MIREJAW is the fight where the danger is never the gap between the
islands, it is what is in it* — he is under the water most of the fight, and he comes up at
the edge nearest her, jaws first.

## The arena
Open water wall to wall, four islands (mounds on the bed; every gap a jump, at most 8 tiles).
`camFit` pulls the camera back so the whole pool is one picture (zoom 0.75). The culvert on
the east bank is dormant (`lock: bossMirejaw`) until he is beaten.

## Moves (seconds)
| state | tell | active | opening | counter |
|---|---|---|---|---|
| `sub` → `bitewarn` (THE AMBUSH, signature) | 0.8 s: the water boils, the eyes rise and STOP (the lock), a recorded hiss | `leap` 0.62 s out of the water at where she WAS; the jaws can close 0.22–0.5 of it | `beached` 1.15 s, jaws hanging open — the only time the inside of the mouth can be struck | move off the locked spot (the dash crosses a gap); jump the belly for a hit in the air |
| `roll` (THE DEATH ROLL) | — (it is what a landed bite becomes) | dragged under and rolled 1.9 s, ATTACK presses take 0.13 s off each; **2 cores**, thrown onto the nearest island | — | do not be where the jaws lock |
| `tailwarn` → `tail` (phase 2, she is behind him on his island) | 0.7 s | 0.38 s: the tail behind him, and a wave both ways along the ground | `spent` 0.75 s, jaws open again | jump the wave |
| `roarwarn` (THE BELLOW, phase 2 at half) | 2.6 s: head and tail up, the water dancing on his back, a recorded alligator (NPS) | — | — | — |

No warning is shortened between phases: phase two shortens his time UNDER (1.5–2.3 s →
0.9–1.4 s), swims faster, and a leap that lands in water is followed at once by another from
another gap (the end of a chain is always a beaching).

## The hide (types.js dealDmg → `e.hideAt`)
Back and flanks: 1/8 of a blow, with a clink. Inside the open jaws (`beached`, `spent`, within
95 px of the head): whole. The pale belly while he is in the air (`leap`): whole. Under the
water: nothing. Dazed (the hit-group break, `dazeAt` 6): open everywhere.

## Reward
Beaten (not purified — he is a mini-boss): he collapses, rolls onto his side and sinks; the
cell, 40 scrap and **Vault Seal II**, which he swallowed (`K2_MINI_SIGIL`).

## Measured (tests/mirejaw.cjs)
A masher dies in about 14 s, three death rolls; a bot that reads him wins in about 105 s.
