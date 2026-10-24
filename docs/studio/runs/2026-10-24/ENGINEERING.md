# Engineering discipline review — 2026-10-24

## Scope

Senior responsibilities 10–14 reviewed world, combat, mission, NPC and UI
contracts. The only source edit is to the campaign evidence driver; production
game state, rooms, assets and balance are unchanged.

## Role verdicts

| # | Responsibility | Verdict | Evidence and required action |
|---:|---|---|---|
| 10 | Associate Technical Director — World Systems | Pass mandatory graph/recovery; optional/device open | Fresh campaign survives the game's own CV1B respawn and completes CV2/B1. Room cache, terrain and isolated WebGL bake pass. Optional streaming and physical device remain open. |
| 11 | Gameplay Engineer — Combat | Pass source/browser; device gate open | HP/power/speed/defense, attack profiles, armor, bounded damage log, flash, debris, knockback/recoil, hit-stop, shake, rumble routes, SFX and 3.2× held hit pass. Listened mix/haptics remain unverified. |
| 12 | Gameplay Engineer — Mission | Pass mandatory; optional open | Gates, saves and purification sequence pass continuously. Alpha and optional caves are staged/source evidence only. |
| 13 | Gameplay Engineer — NPC | Pass | Purified Sage authored walk/idle persists; Servo is grounded and legible in phone-sized keyboard evidence. Actual touch remains open. |
| 14 | Lead UI Engineer | Pass text/layout host checks; P1 device evidence open | Gradual reveal, deliberate advance, paging, Arabic RTL, CJK wrap, overlays, reduced motion, story cards and rotation contracts pass. Fixed-budget opening still misses Servo; physical touch/haptics are untested. |

## QA-RECOVERY-24 — bounded implementation

October 23's ordinary-input campaign died legitimately during the Sage fight,
respawned at the game's CV1B pod and then repeated 166 ineffective recovery
attempts from a CV2 suspended platform. The old test driver tapped jump, released
it, and only afterward chose a random horizontal direction. That cannot execute
the moving jump an actual player uses.

\`tests/campaign-ch1.cjs\` now:

- records the chosen planner edge;
- performs an ordinary simultaneous direction+jump recovery;
- trusts a planned setup edge over the final exit direction, because a route to
  the right can begin with a left setup jump;
- resets only its navigation model on recovery, room change and death.

It does **not** alter save data, terrain, hero position, health, inventory,
mission flags, enemy stats, invulnerability, damage or teleports.

## Evidence classification

| Evidence | Result | Honest scope |
|---|---|---|
| Cleared-storage campaign | Certified, 15:04, easiest, 9/9 missions, 16/16 panels, one legitimate death, B1, zero errors | Uninterrupted ordinary keyboard route; video disabled; Alpha excluded |
| Legitimate-save recovery diagnostic | Complete remaining route in 05:10 | Segmented driver diagnostic, not a new continuous certificate |
| Targeted normal-browser reruns | 10 product checks pass; text initially failed only under stale font config; opening-order failed | Staged/contract evidence |
| Corrected CJK rerun | Pass | Test-host font setup fixed; no game source change |
| Isolated software-WebGL bake | Pass in 3.53 s | Host bake contract, not GPU/device performance |
| WebGL full-collector attempt | Incomplete/aborted | 180 raw log files were created, but that wrapper repeatedly stalled its campaign tutorial and has no final collector verdict |
| Physical phone/controller/listened audio | Not run | No touch, haptic, thermal, frame-time or subjective mix certification |

## Fresh staged results

Normal-wrapper passes: purification save, combat impact input, wake, boss pace,
GRAVEHORN mechanics, terrain run, enemy gait, infection poses and room cache.
The corrected isolated text reveal passes gradual Latin/CJK/Arabic behavior.
The unchanged isolated bake3d assertions pass with populated yaw cells,
grounding, silhouette difference and retained vertical motion.

\`opening-order\` remains the single fresh staged product/evidence failure. Its
desktop route ends in A0 after the final tutorial beats; phone-size ends in A0B.
Both have zero page errors and real ordered interactions. The separate full
campaign reaches A1/Servo and continues, so this is not evidence of a player
soft-lock. Acceptance is an event-driven deterministic harness that reaches
Servo inside the unchanged 240 seconds; raising the timeout is not a fix.

## Commands

| Command | Result |
|---|---|
| \`npm ci\` | Pass |
| \`npm run build\` | Pass; four pages generated |
| \`node --check tests/campaign-ch1.cjs\` | Pass |
| \`git diff --check\` | Pass |
| \`CAMPAIGN_VIDEO=0 CAMPAIGN_MAX_MIN=40 node tests/campaign-ch1.cjs\` | Certified 15:04 |
| Normal-wrapper targeted studio audit | 12/14 entries pass including build/identity; text and opening failed in that immutable run |
| Corrected-font \`--tests textreveal\` | Pass |
| SwiftShader \`--tests bake3d\` | Pass |

## Remaining engineering gates

1. Make opening-order wait on semantic state transitions while retaining its
   fixed finite budget and assertions.
2. Add actual touch-event route evidence, then physical iOS/Android rotation,
   haptics and sustained frame-time/memory.
3. Listen to hero impact, enemy metal clash, charged hit and the complete
   purification/music fade on target hardware.
4. Record the Alpha and every optional cave loop through save/reload without
   state injection.
