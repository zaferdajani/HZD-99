# Single Claude integration prompt

Copy the entire block below as one prompt.

```text
You are the senior integrator for zaferdajani/HZD-99. Work on a fresh integration branch. Do not merge or deploy production. Read these files completely before editing:
- docs/studio/PIPELINE.md
- docs/studio/roles.json and all 15 docs/studio/roles/*.md mandates
- docs/STORY_CANON.md
- docs/studio/runs/2026-10-25/REPORT.md
- docs/studio/runs/2026-10-25/DESIGN.md
- docs/studio/runs/2026-10-25/ART.md
- docs/studio/runs/2026-10-25/ENGINEERING.md
- docs/studio/runs/2026-10-24/REPORT.md
- this prompt

SOURCE AND SAFETY
Integrate from codex/studio-review-2026-10-25. Its review parent is 9ccdba3a1be707a2f53fdf61c61078090d7eaa69. At intake, main and claude/clawbyte-repo-migration-byhyl8 both remained at 62d75d204c6f6264f25150bb419fc262ff2c18ea; there was no upstream source or art delta since October 24. Fetch all refs again, report movement/conflicts, preserve unrelated work and push only your integration/review branch. Never merge or deploy without separate authorization.

NON-NEGOTIABLE STORY
Mother's song kept the robot kingdoms peaceful until an unknown entity infected its frequency. HZD-99 survived only because the hero was asleep/recharging and missed the broadcast, not because of innate immunity. A short circuit wakes the forgotten hero. Ratchet's real marble pendant slowed infection; he removed his battery to protect himself. The player reads his letter, finds his unique hidden battery, completes the repair board, receives a separate spare for Old Servo, uses the save/recharge pod, and is taught/funded to buy the permanent Volt Pack before healing and Burst lessons. The monument is forward and nearby. Old Servo is grounded, visible, richly readable and purposeful. Mandatory order is GRAVEHORN/raw marble → Ratchet forge/first white purifier sword → Meadow Sage → CHIME → NULLFANG → B1. Guardians and Sages are purified, never killed. Alpha is an optional post-forge Lost Wardens quest and must never gate the marble, Sage, CHIME, NULLFANG or B1.

INTEGRATE; DO NOT REIMPLEMENT VERIFIED WORK
Preserve cumulative work:
1. Purified Sage movement in js/entities.js: Sage participates in WALKERS; a moving tamed Sage selects authored sageWalk8 with pure:true; stopped rescued Sage returns to sagePure. Keep hostile duel behavior, collision, speed, stats and save facts unchanged.
2. Campaign evidence-driver fixes through October 24: player-width hatch recognition, planner-edge recording, simultaneous direction+jump recovery, planned setup-edge priority and navigation reset on recovery/room/death. These remain evidence-driver-only and ordinary input.
3. October 25 GH-HARNESS-25 in tests/gravehorn.cjs: retain the stable 0.36-second charge-jump request and simulation-clock dispatch of real KeyL guard events. These fix host polling races. Do not modify GRAVEHORN timing, collision, damage, tells, recoveries or player state to make evidence pass.
4. Opening-order diagnostics and semantic progression. The current unchanged finite harness passes desktop and phone-size modes through A1/Old Servo. Phone-size is keyboard/mouse in a touch-capable viewport, not physical touch.
5. Approved hero, pack/Alpha, crystal, purifier sword, NULLFANG/lion and Talon assets. Search ledgers and repository before any generation. Never regenerate completed assets.

TODAY'S EVIDENCE
On parent 9ccdba3a1be707a2f53fdf61c61078090d7eaa69, a fresh cleared-storage easiest-difficulty campaign completed in 21:57 using ordinary keyboard events, video disabled and a read-only planner. It completed 9/9 mandatory missions and all 16 panels in exact order, reached B1, reported zero page/panel errors and recovered from three ordinary deaths. Alpha was excluded because optional. This is a continuous mandatory certificate, not physical-device or optional-content proof.

The full immutable-snapshot collector completed all requested scope with closed-file log integrity: 199 pass / 2 fail. Preserve those original failures. GRAVEHORN failed because an external poll delivered jump at ~0.19 seconds before the test's measured 0.30–0.52-second safe window and could miss the whole guard wind-up. The bounded driver fix schedules the same real inputs from the simulation clock; the final isolated GRAVEHORN run passes every assertion and production game files are unchanged. Room-cache reported one 630 ms full-suite pre-bake frame, then passed independently with all cache/frame assertions. Treat that as non-reproduced host-load variance, not a proven device pass. Standard Playwright Chromium download failed with zero-byte/truncated CDN payload; a declared local Chromium wrapper passed nonzero Latin/CJK/Arabic text preflight. Do not report host tooling failures as product defects.

GAMEPLAY-SIZE VISUAL FINDING
Fresh repair and Servo frames read well. Forge, Sage and restored lion are coherent, but Sage/lion reward moments stack three or more notices across the same upper/center region while objective, HUD and item/reward copy are active. Implement a finite prioritized notification queue and safe zones: one narrative/reward card at a time, objective never covered, duplicate/low-priority notices coalesced, deterministic expiry, pause/overlay safety, reduced-motion support, RTL/CJK wrapping and phone proof. Do not hide required information or speed text so it cannot be read.

P1 ART — GRAVEHORN
The mandatory marble guardian is still visually unacceptable beside the hero/Alpha/lion. There is no assets/characters/gravehorn production set and runtime explicitly uses fallback rendering. Produce an articulated heavy gunmetal/bronze robotic rhino with clear body, limb and horn separation, purple infected eyes, detachable returning horns, planted weight and phase-two armor/molt cracks. Required states: idle, walk/run, horn throw/return, charge, rear kick, stagger, phase-two transform, down/retreat/recovery and both facings. Produce four matched intercuts: gh_intro_a, gh_intro_b, gh_phase2 and gh_down. Wire actual intro/phase/down triggers. A still, bloom, wireframe, unrelated panel or procedural fallback is not acceptance. Use the approved media pipeline, archive prompt/master/provenance and inspect every pose at gameplay scale before replacement.

P2 CHARACTER/PANEL WORK
- BOUND-ART-01: author wolfDown4 and cheetahDown4 down, breathing and recovery strips. Remove the flattening treatment that makes them tiny floating crouch cells.
- FURNACE-ART: retain identity/timing/damage and add breath, blast, spent, gather, dive and bell poses.
- PURIFY-ART-01: authored hero single-sword raise → gather/hold → slash → recover, with continuous hand/hilt contact and preserved earned weapon.
- Localized edits only: NULLFANG eyes purple in assets/manhua/ch1/game/m_down.webp; inactive background Servo eyes/chest dark in r_cell.webp; correct the off-model skinny hero in passage_b.webp. Preserve composition, camera, environment and earned equipment.

PURIFICATION FILMS AND ENDING
Preserve the deliberate hold-to-free action. The hero raises the purifier; finite white flakes gather; the sword becomes brilliant; a cinematic slash lands with flash, stronger hit-stop and shake; dark red-black virus energy extracts from the living boss into the sword and is neutralized; picture and music fade through black and resolve back to the same friendly golden guardian. Interrupted charge grants no reward and stays retryable. Never hard-cut picture or music. Runtime film is muted in source, so a master soundtrack is not listened-runtime proof.

Produce guardian-specific Brood, Atlas, Zero and Prism extraction films matching that contract. Do not relabel generic 960×540 clips. Preserve the completed NULLFANG ritual and its resolved ending. Alpha remains a quieter in-engine optional rescue and should not receive the guardian-film template.

COMBAT AND STATS
Preserve centralized HP, attack power, attack speed and defense. Normal hits require white enemy flash, separate hero-impact and target-metal sound routes, robotic screws/shards, target knockback, small hero recoil, camera/target shake and brief hit-stop. Held attack remains more dramatic and stronger (tested around 3.2×) with greater freeze/shake/VFX. Sword progression meets higher HP/defense enemies. Preserve the bounded 200-event damage log and character-card/PDF documentation. Never duplicate constants at call sites. Any balance change requires an explicit weapon × defense × difficulty × boss matrix and updated cards.

FINITE INFECTION EYE CONTRACT
Ordinary infected creatures have red eyes; Alpha, Sages and bosses have purple eyes. Trails originate at transformed current-frame eye anchors and remain world-locked. Emit only from body travel, never camera or idle motion. A discontinuity over 90 px clears history. Trails live 1.125–1.875 seconds, obey 90/170/260/320 tier caps, and clear on cure, death, removal, teleport and room change. Reduced motion preserves glow and removes trail. Preserve infection-eyes, infection-roster and infection-poses tests. Add sustained physical-device frame-time/memory before performance claims.

MANHWA PARITY
Preserve gradual letter-by-letter reveal, deliberate advance/debounce, paging, RTL/CJK, remapped-control labels and all 16 ordered panel beats. A panel is not physical acting. Close literal parity for cradle/lamp reach, battery/socket installation, visible marble carry, continuous forge hand/tool/material contact, NULLFANG cable assistance/catch, CHIME casing opening and hero ritual body motion. Build a parity ledger mapping each source beat to trigger, runtime body/prop action, panel, audio and evidence frame. Do not invent lore to replace a missing action.

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

Do not add caves just to increase quantity. Do not count an exit ID, source constant or injected item as player-facing payoff. Record ordinary-input discovery → acquisition → return → visible consequence → save/reload for every optional loop. For Alpha, prove offer → search → rescue rather than kill → friendly pack → reward → reload while demonstrating B1 remains independently reachable.

VALIDATION AND ACCEPTANCE
Run npm ci, npm run build, npm run app:pack and tools/studio/audit.py --profile full on one immutable served snapshot. Verify browser wrapper execution, nonzero Latin/Chinese/Arabic metrics, server identity and closed-file log integrity. Preserve original failures and label reruns separately.

Rerun the full cleared-save keyboard campaign to B1 without progression mutation. Separately run Alpha and every optional cave loop by ordinary input. Add actual browser touch-event coverage, then physical iOS/Android portrait/landscape transitions, safe areas, controller, haptics, listened audio/music fades, thermal behavior and sustained frame time/memory. Inspect all art at gameplay size, both facings and across temporal windows. Require owner art approval before replacing production assets.

Return one evidence-backed report with exact refs, conflicts, all 15 independent role verdicts, cave/manhwa/animation matrices, commands/exits, original-versus-rerun provenance and five separate states: implemented, tested, visually inspected, integrated and deployed. Never call staged tests a continuous playthrough, keyboard in a touch viewport physical touch, source presence player discovery, mechanics fallback finished art, generated stills integrated animation, or an incomplete collector a full-suite result. Keep release held until P1 GRAVEHORN art and device/accessibility acceptance are genuinely closed.
```
