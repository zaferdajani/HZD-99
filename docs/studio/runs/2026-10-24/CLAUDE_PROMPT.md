# Single Claude integration prompt

Copy the entire block below as one prompt.

```text
You are the senior integrator for zaferdajani/HZD-99. Work on a fresh integration branch. Do not merge or deploy production. Read these files completely before editing:
- docs/studio/PIPELINE.md
- docs/studio/roles.json and all 15 docs/studio/roles/*.md mandates
- docs/STORY_CANON.md
- docs/studio/runs/2026-10-24/REPORT.md
- docs/studio/runs/2026-10-24/DESIGN.md
- docs/studio/runs/2026-10-24/ART.md
- docs/studio/runs/2026-10-24/ENGINEERING.md
- docs/studio/runs/2026-10-23/REPORT.md
- this prompt

SOURCE AND SAFETY
Integrate from codex/studio-review-2026-10-24. Its review parent is 40bd9dc370c76d54b896c59b2b69e08bc9bbcf75. At intake, main and claude/clawbyte-repo-migration-byhyl8 both remained at 62d75d204c6f6264f25150bb419fc262ff2c18ea, so there was no new upstream production delta. Fetch all refs again, report movement/conflicts, preserve unrelated work and push only your integration/review branch. Never merge or deploy without separate authorization.

NON-NEGOTIABLE STORY
Mother's song kept the robot kingdoms peaceful until an unknown entity infected its frequency. HZD-99 survived only because the hero was asleep/recharging and missed the broadcast, not because of innate immunity. A short circuit wakes the forgotten hero. Ratchet's real marble pendant slowed infection; he removed his battery to protect himself. The player reads his letter, finds his unique hidden battery, completes the repair board, receives a separate spare for Old Servo, uses the save/recharge pod, and is taught/funded to buy the permanent Volt Pack before healing and Burst lessons. The monument is forward and nearby. Old Servo is grounded, visible, richly readable and purposeful. Mandatory order is GRAVEHORN/raw marble → Ratchet forge/first white purifier sword → Meadow Sage → CHIME → NULLFANG → B1. Guardians and Sages are purified, never killed. Alpha is an optional post-forge Lost Wardens quest and must never gate the marble, Sage, CHIME, NULLFANG or B1.

INTEGRATE; DO NOT REIMPLEMENT VERIFIED WORK
Preserve the cumulative review work:
1. Purified Sage movement in js/entities.js: sage participates in WALKERS; a moving tamed Sage selects authored sageWalk8 with pure:true; a stopped rescued Sage returns to sagePure. Keep hostile duel behavior, collision, speed, stats and save facts unchanged. Preserve the Sage walk test.
2. Campaign hatch recognition: any one fully opened column through both breakable rows is a usable player-width shaft. Keep it in the evidence driver only.
3. Opening-order diagnostics: unchanged 240-second limit, state timeline, terminal state/cut/video details, per-mode JSON and terminal screenshot. Phone-size mode is keyboard/mouse in a touch-capable viewport, not physical touch.
4. QA-RECOVERY-24 in tests/campaign-ch1.cjs: retain chosen planner-edge recording, simultaneous direction+jump recovery, planned setup-edge priority and navigation resets on recovery/room/death. This is ordinary input only. Never mutate terrain, save, inventory, mission flags, hero position/health, enemy stats, damage, invulnerability or teleports to make a route pass.
5. Preserve approved hero, pack/Alpha, crystal, purifier sword, NULLFANG/lion and Talon assets. Search ledgers and repository before any generation.

TODAY'S EVIDENCE
A cleared-storage easiest-difficulty campaign completed in 15:04 using ordinary keyboard events, video disabled and a read-only planner. It completed 9/9 mandatory missions and all 16 panels in exact order, reached B1, reported zero page/panel errors and recovered from one legitimate Sage-fight death via the game's own CV1B respawn. Alpha was excluded because optional. This closes the October 23 driver recovery blocker; it is not physical-device or optional-content proof.

The fixed 240-second opening-order harness still fails: desktop ends in A0 and phone-size in A0B before Servo, with zero page errors and real ordered interactions. The full campaign reaches A1/Servo and continues, so do not call this a gameplay soft-lock. Make the harness wait on semantic transitions and reach Servo within the unchanged budget; do not hide the issue by increasing timeout.

Normal targeted checks pass purification save, combat impact input, wake, boss pace, GRAVEHORN mechanics, terrain, enemy gait, infection poses and room cache. An initial Chinese-wrap failure was caused by a stale test-browser font path; a corrected isolated textreveal run passes without game changes. An isolated declared software-WebGL bake passes unchanged assertions in 3.53 seconds. A full WebGL collector attempt produced 180 raw log files but was aborted because that wrapper repeatedly stalled its campaign tutorial; it has no final aggregate result and must never be reported as a complete full-suite pass. October 23's 198/201 run remains the latest completed full collector baseline.

P1 ART — GRAVEHORN
The mandatory marble guardian is still visually unacceptable beside the hero/Alpha/lion: a translucent, flat procedural/fallback rhino is not final art. Produce an articulated heavy gunmetal/bronze robotic rhino with clear body, limb and horn separation, purple infected eyes, detachable returning horns, planted weight and phase-two armor/molt cracks. Required states: idle, walk/run, horn throw/return, charge, rear kick, stagger, phase-two transform, down/retreat/recovery and both facings. Produce four matched intercuts: gh_intro_a, gh_intro_b, gh_phase2 and gh_down. Wire actual intro/phase/down triggers. A still, bloom, wireframe, unrelated panel or procedural fallback is not acceptance. Use the approved media pipeline, archive prompt/master/provenance and inspect every pose at gameplay scale before replacement.

P2 CHARACTER/PANEL WORK
- BOUND-ART-01: author real wolf and cheetah down, breathing and recovery strips (wolfDown4, cheetahDown4). Remove the flattening treatment that makes them tiny floating crouch cells.
- FURNACE-ART: retain identity/timing/damage and add breath, blast, spent, gather, dive and bell poses.
- PURIFY-ART-01: authored hero single-sword raise → gather/hold → slash → recover, with continuous hand/hilt contact and preserved earned weapon.
- Localized edits only: NULLFANG eyes purple in assets/manhua/ch1/game/m_down.webp; inactive background Servo eyes/chest dark in r_cell.webp; correct the off-model skinny hero in passage_b.webp. Preserve composition, camera, environment and earned equipment.

PURIFICATION FILMS AND ENDING
Preserve the deliberate hold-to-free action. The hero raises the purifier; finite white flakes gather; the sword becomes brilliant; a cinematic slash lands with flash, stronger hit-stop and shake; dark red-black virus energy extracts from the living boss into the sword and is neutralized; picture and music fade through black and resolve back to the same friendly golden guardian. Interrupted charge grants no reward and stays retryable. Never hard-cut picture or music. Runtime film is muted in source, so a master soundtrack is not listened-runtime proof.

Produce guardian-specific Brood, Atlas, Zero and Prism extraction films matching that contract. Do not relabel old generic 960×540 clips. Preserve the completed 1280×720, 13.25-second lion ritual and resolved ending. Alpha remains a quieter in-engine optional rescue and should not receive the same guardian film.

COMBAT AND STATS
Preserve centralized HP, attack power, attack speed and defense. Normal hits require white enemy flash, separate hero-impact and target-metal sound routes, robotic screws/shards, target knockback, a small hero recoil, camera/target shake and brief hit-stop. Held attack must remain more dramatic and stronger (current tested profile is about 3.2×) with greater freeze/shake/VFX. Sword progression meets higher HP/defense enemies. Preserve the bounded 200-event damage log and character-card/PDF documentation. Never duplicate constants at call sites. Any balance change requires an explicit weapon × defense × difficulty × boss matrix and updated cards.

FINITE INFECTION EYE CONTRACT
Ordinary infected creatures have red eyes; Alpha, Sages and bosses have purple eyes. Trails originate at transformed current-frame eye anchors and remain world-locked. Emit only from body travel, never camera or idle motion. A discontinuity over 90 px clears history. Trails live 1.125–1.875 seconds, obey 90/170/260/320 tier caps, and clear on cure, death, removal, teleport and room change. Reduced motion preserves glow and removes trail. Preserve infection-eyes, infection-roster and infection-poses tests. Add sustained physical-device frame-time/memory before performance claims.

MANHWA PARITY
Preserve gradual letter-by-letter reveal, deliberate advance/debounce, paging, RTL/CJK, remapped-control labels and all 16 ordered panel beats. A panel is not physical acting. Close literal parity for cradle/lamp reach, battery/socket installation, visible marble carry, continuous forge hand/tool/material contact, NULLFANG cable assistance/catch, CHIME casing opening and hero ritual body motion. Build a parity ledger that maps each source beat to trigger, runtime body/prop action, panel, audio and evidence frame. Do not invent lore to replace a missing action.

CAVES AND OPTIONAL ALPHA
Keep every cave meaningful:
- A5 loose-floor landmark, Magnet riddle, history and quarry mouth.
- A7 survey read and paid return.
- CV1 bound crawler and max-core pocket.
- CV1B survey/map/shortcut/rest and legitimate respawn.
- CV2 Deaf System evidence and beacon/lure.
- CV3 GRAVEHORN, raw marble and changed return.
- GA1 refuge, Sage and network rescue.
- A11–A13 optional currency, traversal and Servo evidence.
- A10/GA2 optional Alpha offer, cache, cell, scrap, ledger and Pack Sage.

Do not add caves just to increase quantity. Do not count an exit ID, source constant or injected item as player-facing payoff. Record ordinary-input discovery → acquisition → return → visible consequence → save/reload for every optional loop. For Alpha, prove offer → search → rescue rather than kill → friendly pack → reward → reload, while demonstrating B1 remains independently reachable.

VALIDATION AND ACCEPTANCE
Run npm ci, node build.cjs, npm run app:pack and tools/studio/audit.py --profile full on one immutable served snapshot. Verify browser wrapper execute permission, nonzero Latin/Chinese/Arabic layout metrics, server identity and closed-file log integrity. Preserve every original failure and label reruns separately.

Rerun the entire cleared-save keyboard campaign to B1 with no progression mutation. Separately run the complete Alpha loop and all optional cave loops by ordinary input. Add actual browser touch-event coverage, then test on physical iOS/Android for portrait/landscape transitions, safe areas, controller, haptics, listened audio/music fades, thermal behavior and sustained frame time/memory. Inspect all art at gameplay size, both facings and across temporal windows. Require owner art approval before replacing production assets.

Return one evidence-backed report with exact refs, conflicts, all 15 independent role verdicts, cave/manhwa/animation matrices, commands/exits, original-versus-rerun provenance and five separate states: implemented, tested, visually inspected, integrated and deployed. Never call staged tests a continuous playthrough, keyboard in a touch viewport physical touch, source presence player discovery, mechanics fallback finished art, generated stills integrated animation, or an incomplete collector a full-suite result. Keep the release held until P1 GRAVEHORN art and device/accessibility acceptance are genuinely closed.
```
