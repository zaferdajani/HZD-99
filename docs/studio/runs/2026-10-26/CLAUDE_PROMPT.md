# Single Claude integration prompt

Copy the entire block below as one prompt.

```text
You are the senior integrator for zaferdajani/HZD-99. Work on a fresh integration branch. Do not merge or deploy production. Fetch every ref, preserve unrelated work, and read these files completely before editing:
- docs/DEVELOPMENT_AUTHORITY.md
- docs/STORY_CANON.md
- docs/studio/PIPELINE.md
- docs/studio/roles.json and all fifteen docs/studio/roles/*.md mandates
- docs/studio/runs/2026-10-26/REPORT.md
- docs/studio/runs/2026-10-26/DESIGN.md
- docs/studio/runs/2026-10-26/ART.md
- docs/studio/runs/2026-10-26/ENGINEERING.md
- docs/studio/runs/2026-10-25/REPORT.md
- this prompt

SOURCE AND SAFETY
Integrate from codex/studio-review-2026-10-26. Its parent is daeff2977bc9ee614db2836bb1728a652a8f9907. At the October 26 intake, main and claude/clawbyte-repo-migration-byhyl8 were both 62d75d204c6f6264f25150bb419fc262ff2c18ea; no new source or art landed since October 25. Fetch again and report any movement/conflicts before applying work. Push only your review/integration branch. Never merge or deploy without separate authorization.

NON-NEGOTIABLE STORY
Mother's song kept the robot kingdoms peaceful until an unknown entity infected its frequency. HZD-99 survived because the hero was asleep/recharging and did not hear the corrupted broadcast, not because of innate immunity. A short circuit wakes the forgotten hero. Ratchet's marble pendant slowed infection; he removed his own battery to protect himself. The player reads his letter, finds his unique hidden battery, completes the repair board, receives a different spare cell for Old Servo, uses the save/recharge pod, and is taught/funded to buy the permanent Volt Pack before healing and Burst lessons. The monument is forward and nearby. Servo must be grounded, visible, richly readable and purposeful. Mandatory order is GRAVEHORN/raw marble → Ratchet forge/first white purifier sword → Meadow Sage → CHIME → NULLFANG → B1. Guardians and Sages are purified, never killed. Alpha is an optional post-forge Lost Wardens quest; it never gates marble, Sage, CHIME, NULLFANG or B1.

PRESERVE VERIFIED WORK
- Approved hero, pack/Alpha, crystal, purifier sword, NULLFANG/lion and Talon assets. Search provenance and ledgers before generation. Do not regenerate completed assets.
- Purified Sage movement: moving tame Sage uses authored sageWalk8 with pure:true; rescued stopped Sage uses sagePure. Preserve hostile behavior, collision, speed, stats and save facts.
- Campaign evidence-driver recovery work through October 25 remains evidence-only and ordinary input.
- Keep the 0.36-second Gravehorn charge-jump request and simulation-clock dispatch of real KeyL guard input, but restore and preserve the original 0.30–0.45-second horn-lock assertion. Never weaken a requirement or game behavior to make a test pass.
- Keep the purification-save test's explicit braid() initialization before it reads led/forks. It corrects a staged harness precondition and changes no product assertion.
- Preserve all finite eye, combat-impact, gradual-text, RTL/CJK, save/reload and atomic purification contracts.

OCTOBER 26 EVIDENCE — DO NOT OVERCLAIM
Fresh cleared-storage ordinary-keyboard campaign: PASS/certified, easiest, 13:06, zero deaths, all nine mandatory missions, all sixteen required presentation sequence IDs in exact order, no page/panel errors, terminal B1. Video was off. Alpha was excluded. The planner was read-only and did not mutate progression. This is one continuous mandatory-route certificate; it is not physical touch/controller proof, optional quest proof, listened audio/haptic proof, or 40-page manhwa parity.

Full immutable-snapshot collector: 201 checks, 198 pass / 3 fail. Preserve the original failures. Build and pack passed. Full-run Gravehorn passed with its restored 300 ms minimum (367 ms observed). Failures:
1. purification-save read a lazily initialized braid object before initialization; the bounded test-only fix calls braid(), and the isolated rerun passes.
2. opening-order desktop stopped in A0 before monument/Servo while its phone-size phase reached A1/Servo. An isolated rerun failed earlier, after desktop reached the booth and before the letter; the phone phase did not start. Treat OPEN-ORDER-26 as open and reproducible. Do not close it by increasing blind sleeps, skipping tutorial steps, injecting state or deleting assertions. Use semantic UI/game-state waits and produce three clean runs before closure.
3. bake3d failed only because the temporary host wrapper extracted SwiftShader one directory too deep. Correcting the temporary extraction made the unchanged test pass. Do not change game art code for this host fault.

The later combined bounded rerun passed purification-save and bake3d but Gravehorn failed broadly before the measured mechanics because staged dialogue/state initialization was nondeterministic. The full-run Gravehorn pass remains real, but GH-HARNESS-26 is open until deterministic setup and repeated passes exist. Do not weaken timing, collision, damage, tells, recoveries or player state.

EVIDENCE RETENTION
October 25 omitted automated/results.json and 196/199 referenced raw logs; treat its 199/2 number as historical summary, not independently auditable release evidence. October 26 retained results.json with every closed-file snapshot. Four raw logs were overwritten after capture; the collector correctly ended log_integrity false. They were reconstructed byte-for-byte from embedded snapshots and verified in recovered-log-integrity.json. Preserve both the original failure and recovered files. Fix the later-writer collision so future closed logs are immutable; never edit a failed result into a pass. Retain results, all raw logs, hashes/snapshots, campaign log/result/save checkpoints and representative gameplay frames.

P1 — GRAVEHORN ART
The mandatory marble guardian is still a flat translucent procedural rhino beside the approved hero. There is no assets/characters/gravehorn production set. Produce an articulated heavy gunmetal/bronze robotic rhino with separate body/limbs/horn sockets, planted weight, purple infected eyes, detachable returning horns and authored phase-two armor separation/molt cracks. Required states: idle, walk/run, horn throw/return, charge, rear kick, stagger, phase transform, down, retreat/recovery, both facings. Produce four matched intercuts: gh_intro_a, gh_intro_b, gh_phase2, gh_down and bind them to real triggers. A still, bloom, wireframe, unrelated panel or procedural fallback is not acceptance. Archive prompt/master/provenance and inspect every pose at gameplay size before replacement.

MANHWA PARITY — P1
The sixteen campaign items are presentation sequence IDs, not Draft-3 pages. Draft 3 has forty pages and explicitly says actions/props and pages 16–40 remain uncertified. Build a forty-page ledger mapping cast, props, equipment, literal body action, VFX, audio, runtime trigger and evidence capture. Close cradle/lamp reach, battery/socket continuity, visible marble carry, forge hand/tool/material contact, NULLFANG cable assistance/catch, CHIME casing opening and hero purifier raise/hold/slash/recover. Do not replace missing acting with a panel or invent lore.

UI-DENSITY-25
Fresh gameplay-size captures reproduce excessive stacking: raw-marble cards, Sage RESCUED/FREED story cards and lion reward copy compete with objective/HUD. G.toast currently appends with no priority/dedupe/visible cap and pushes the objective below the whole stack. Implement one finite prioritized notification queue: one narrative/reward card at a time, dedupe by scope/text, deterministic expiry, pause/overlay lifetime safety, retire only scoped stale notices, never hide required information. Add maximum-visible and non-overlap assertions for objective, boss UI, rewards and purification controls at desktop/phone widths with RTL/CJK and reduced motion.

P2 CHARACTER/ART
- BOUND-ART-01: create wolfDown4 and cheetahDown4 down/breathe/recover strips. Remove flattening when authored strips are active; verify floor line, chest breath, transition, no float/slide/snap, and eye smoke clears on cure.
- FURNACE-ART: add identity-matched breath, blast, spent, gather, dive and bell plates. Preserve timing, collision and damage; actions must read without glow alone.
- PURIFY-ART-01: authored single-sword raise → gather/hold → slash → recover with continuous hands/hilt and the actually earned sword. Interrupted hold returns cleanly with no reward.
- Localized masked corrections only: make NULLFANG's infected eyes purple in assets/manhua/ch1/game/m_down.webp; turn inactive background Servo eyes/chest dark in r_cell.webp; correct the elongated humanoid rear hero in passage_b.webp. Preserve framing, environment, Ratchet, lamp, cell, sword timing and every unrelated pixel.

PURIFICATION FILMS AND ENDING
Preserve deliberate hold-to-free: white flakes gather to the raised purifier, sword becomes brilliant, cinematic slash lands with stronger flash/hit-stop/shake, dark red-black virus energy leaves the living guardian and is absorbed/neutralized by the sword, then picture and audible music resolve through a controlled black fade back to the same living friendly gold guardian. Interrupted charge grants no reward and is retryable. Never hard-cut picture or music. Runtime video is currently muted, so an audio track inside the master is not listened-runtime proof.

Produce unique Brood, Atlas, Zero and Prism ritual films. Do not relabel generic 960×540 clips. Preserve completed NULLFANG work. Alpha remains a quieter optional in-engine rescue.

COMBAT AND STATS
Preserve centralized HP, attack power, attack speed and defense. Normal hits require white target flash, separate hero-hit and target-metal sounds, screws/shards, target knockback, small hero recoil, shake and brief hit-stop. Held attack remains stronger and more dramatic with greater freeze/shake/VFX; sword progression meets higher HP/defense enemies. Preserve the bounded 200-event damage log and character-card/PDF synchronization. Any balance change needs an explicit weapon × defense × difficulty × boss matrix.

FINITE INFECTION EYES
Ordinary infected creatures red; bosses, Sages and Alpha purple. Use transformed current-frame eye anchors. Trails are world-locked and emit only from body travel, never camera/idle. Clear on >90 px discontinuity, cure, death, removal, teleport and room change. Life is 1.125–1.875 seconds; caps are 90/170/260/320 by quality tier. Reduced motion retains glow and removes smoke. Keep infection-eyes, infection-roster and infection-poses green and add sustained physical-device frame/memory evidence before claiming performance.

CAVES AND OPTIONAL ALPHA
Keep every cave purposeful: A5 loose floor/Magnet/history/quarry; A7 survey plus paid return; CV1 bound crawler/max core; CV1B survey/map/shortcut/rest/respawn; CV2 Deaf System/beacon/lure; CV3 Gravehorn/marble/changed return; GA1 refuge/Sage/network rescue; A11–A13 optional currency/traversal/Servo evidence; A10/GA2 Alpha offer/cache/cell/scrap/ledger/Pack Sage. Do not add caves merely for quantity and do not count source constants or injected items as player-facing payoff. Record ordinary-input discovery → acquisition → return → visible consequence → save/reload. Alpha must prove offer → search → rescue, friendly pack, reward and reload while B1 remains independently reachable.

VALIDATION
Run npm ci, npm run build, npm run app:pack and tools/studio/audit.py --profile full against one pinned served snapshot. Preflight the exact browser wrapper, execution permission and nonzero Latin/CJK/Arabic metrics. Preserve original failures and put reruns in separate directories. Fix raw-log later-writer collision and prove final integrity. Rerun the cleared-save campaign. Add natural ordinary-input Alpha/optional-cave runs. Add real browser touch events, then physical iOS/Android portrait+landscape/safe areas, controller, haptics, listened audio/music fades, thermal, sustained frame time and memory. Inspect art at gameplay size, both facings and across temporal windows. Require owner approval before production asset replacement.

Return one evidence-backed report with exact refs/conflicts, all fifteen independent role verdicts, cave/manhwa/animation matrices, commands/exits, original-versus-rerun provenance and five separate states: implemented, tested, visually inspected, integrated, deployed. Never call staged tests a continuous playthrough, keyboard in a phone viewport physical touch, sixteen IDs forty-page parity, source presence player discovery, procedural fallback finished art, generated stills integrated animation, a master audio track listened-runtime proof, or an integrity-failed aggregate a clean full-suite pass. Keep release held until P1 Gravehorn art, manhwa performance and device/accessibility acceptance genuinely close.
```
