# Single Claude integration prompt

Copy the entire block below as one prompt.

```text
You are the senior integrator for zaferdajani/HZD-99. Work on a fresh integration branch. Do not merge or deploy production. Fetch every ref, preserve unrelated changes, and read these files completely before editing:
- AGENTS.md
- docs/DEVELOPMENT_AUTHORITY.md
- docs/STORY_CANON.md
- docs/studio/PIPELINE.md
- docs/studio/roles.json and every docs/studio/roles/*.md mandate
- docs/studio/runs/2026-10-27/REPORT.md
- docs/studio/runs/2026-10-27/DESIGN.md
- docs/studio/runs/2026-10-27/ART.md
- docs/studio/runs/2026-10-27/ENGINEERING.md
- docs/studio/runs/2026-10-26/REPORT.md
- this prompt

SOURCE AND SAFETY
Integrate from codex/studio-review-2026-10-27. Its parent is 327da1dee3f05bf4ee8eb9d6d7ee9cfaca902076. At October 27 intake, main was 573d09d48d6278cf1afb51f66db3d9d014bafefe and claude/clawbyte-repo-migration-byhyl8 was 62d75d204c6f6264f25150bb419fc262ff2c18ea. Main's only new delta was unrelated .claude/skills/founder-* content; there was no new game-source or production-art delta. Fetch again and report movement/conflicts. Push only your review/integration branch. Do not merge or deploy without separate authorization.

PRESERVE THE OWNER'S STORY
Mother's song kept the robot kingdoms peaceful until an unknown entity infected its frequency. HZD-99 survived because the hero was asleep/recharging and did not hear the broadcast, not because of innate immunity. A short circuit wakes the forgotten hero. Ratchet's inherited marble pendant slowed infection; he removed his own battery to protect himself. The player reads his letter, finds his unique hidden battery, completes the repair board, receives a different spare cell for Old Servo, uses the save/recharge pod, and is taught/funded to buy the permanent Volt Pack before healing/Burst. The monument is forward and nearby. Servo is grounded, visible, richly readable and purposeful. Mandatory order is GRAVEHORN/raw marble → Ratchet forge/first white purifier sword → Meadow Sage → CHIME → NULLFANG → B1. Guardians and Sages are purified, never killed. Alpha is an optional post-forge Lost Wardens quest and never gates the mandatory route.

PRESERVE VERIFIED WORK
- Approved hero, Alpha/pack, crystal, purifier sword, NULLFANG/lion and Talon assets. Search provenance and ledgers before generating anything. Do not regenerate completed assets.
- Purified Sage movement: moving tame Sage uses authored sageWalk8 with pure:true; a stopped rescued Sage uses sagePure. Preserve hostile behavior, collision, speed, stats and saves.
- Centralized HP, attack power, attack speed, defense, hit feedback, bounded damage log and character-card/PDF contracts.
- Finite eyes: red ordinary infected, purple bosses/Sages/Alpha; transformed current-frame anchors; world-locked body-travel emission only; 1.125–1.875 s life; 90/170/260/320 caps; >90 px discontinuity clear; cleanup on cure/death/removal/teleport/room; reduced motion keeps glow and removes smoke.
- Gravehorn timing and mechanics. Do not weaken tests. The horn locks around 0.35 s and the accepted assertion remains 0.30–0.45 s.
- Purification save/reload idempotence and explicit staged braid initialization.
- Every original failure and every rerun in a separate evidence directory.

OCTOBER 27 EVIDENCE — DO NOT OVERCLAIM
The full collector completed 201 result records: 198 pass / 3 fail. Build and package passed. Served index SHA-256 stayed 8992e9e43c585cf804af178c9dba4adee7b797e4aca077f0d67e5220fdb94d1d from start to end. Failures:

1. opening-order failed after 484 s. Desktop completed movement, exit, jump, gate, booth, note, drawer, repair, pod, Volt Pack and heal, then ended in A0B. Phone-size completed through attack, Burst and node, then ended in A0. Neither reached meadow/Servo. Keep OPEN-ORDER-26 open. Use semantic UI/game-state waits and explicit transition diagnostics. Do not add blind sleeps, skip controls, inject state, teleport, or delete assertions. Require three clean desktop and phone-size browser runs, then real touch/controller/remap/safe-area proof.

2. campaign-ch1 timed out at 40:00. It used cleared storage, easiest difficulty, ordinary keyboard events and a read-only planner; it injected no inventory, flags, health, terrain, position or save state. It had 0 deaths and naturally completed opening, Servo, first meeting, marble and forge. After forge it returned to CV2 and oscillated between x=672 and x=744 while trying to reach CV3, logging 179 recovery attempts. It saw ten ordered presentation IDs through forge and missed passage/Sage/break/CHIME/free/ch2 only because it stopped. Staged cave tests pass and October 26's continuous run reached B1 in 13:06, so do not call this a human hard lock or definite game regression. Diagnose the planner/transition with the saved result/log/frames. Fix evidence-driver behavior unless ordinary human reproduction proves a product collision/affordance defect. Require a fresh cleared-save B1 certificate.

3. bake3d failed because this host could not create WebGL even with SwiftShader. Standard Playwright download returned zero-byte archives. Fallback Chromium 153 rendered Latin/CJK/Arabic correctly but WebGL preflight failed. Do not change game art code for this host fault. Rerun on a WebGL-capable environment and preserve the failed host log.

The aggregate ended log_integrity:false because input-focus.log and seam.log were mutated by detached descendants after capture. Their closed-file snapshots remained valid and were restored byte-for-byte; recovered-log-integrity.json records matching hashes while log-integrity.json preserves the original failure.

COLLECTOR FIX TO INTEGRATE
The review branch makes tools/studio/audit.py own the full Linux descendant tree: cleanup runs after normal exit and timeout; PR_SET_CHILD_SUBREAPER adopts detached children that create new sessions; pre-existing audit server children are baselined and preserved; adopted children are killed/reaped before log capture; an exact-log-inode scan remains a bounded fallback. tools/studio/test_audit.py adds normal-child and detached-session late-writer regressions. All 8 units pass. A real isolated audit of input-focus and seam passes with integrity true using the final fix. Preserve this fix. Next full collector must prove every raw log remains unchanged; do not rewrite an integrity-failed aggregate into a clean run.

GRAVEHORN MECHANICS VS ART
Gravehorn passed the aggregate and three separate isolated reruns, each with integrity true and every original assertion intact. One run measured 366 ms horn lock; tells, jump, damage, toss/parry, phase change, rear kick, gait, planted hooves, save/retry and marble release all pass. Treat GH-HARNESS-26 as resolved on the current snapshot. Do not change these mechanics merely because the art is missing.

GH-ART remains P1. The mandatory marble guardian is a flat translucent procedural rhino beside the finished hero; assets/characters/gravehorn and assets/source/gravehorn remain absent. Produce an articulated heavy gunmetal/bronze robotic rhino with separate body/limbs/horn sockets, planted weight, purple infected eyes, detachable returning horns and authored phase-two armor separation/molt cracks. Required states: idle, walk/run, horn throw/return, charge, rear kick, stagger, phase transform, down, retreat/recovery, both facings. Produce four matched trigger-bound intercuts: gh_intro_a, gh_intro_b, gh_phase2, gh_down. A still, bloom, wireframe, unrelated panel or procedural fallback is not acceptance. Archive prompt/master/provenance, inspect every pose at gameplay size and obtain owner approval before replacing production art.

MANHWA PARITY — P1
The runtime sequence has sixteen presentation IDs; Draft 3 has forty pages. Today's interrupted campaign saw ten. Neither number is page parity. Build a forty-row ledger mapping cast, props, earned equipment, literal body action, VFX, audio, runtime trigger and actual-game capture. Close cradle/lamp reach, battery/socket continuity, visible marble carry, forge hand/tool/material contact, NULLFANG cable assistance/catch, CHIME casing opening and hero purifier raise/hold/slash/recover. Do not replace missing acting with a panel or invent lore.

UI-DENSITY-25
Gameplay-size frames reproduce excessive stacking: raw-marble cards, Sage RESCUED/FREED story cards and lion reward copy compete with objectives/HUD. G.toast appends without priority, dedupe or a visible cap. Implement a finite priority queue: one narrative/reward card at a time; dedupe by scope/text; deterministic expiry; pause/overlay lifetime safety; retire only scoped stale notices; never hide required information. Add maximum-visible and non-overlap assertions for objective, boss UI, rewards and purification controls at desktop/phone widths with RTL/CJK and reduced motion.

P2 CHARACTER/CINEMATIC ART
- BOUND-ART-01: create wolfDown4 and cheetahDown4 down/breathe/recover strips. Stable floor line, visible chest breath, smooth transition, no float/slide/snap, and eye smoke clears on cure.
- FURNACE-ART: create identity-matched breath, blast, spent, gather, dive and bell plates without changing timing, collision or damage.
- PURIFY-ART-01: authored single-sword raise → gather/hold → slash → recover with continuous hands/hilt and the actually earned sword. Interrupted hold returns cleanly with no reward.
- Local masked corrections only: change NULLFANG's infected eyes from red to boss-purple in assets/manhua/ch1/game/m_down.webp; darken the inactive background Servo eyes/chest in r_cell.webp; correct the elongated humanoid rear hero in passage_b.webp. Preserve framing and every unrelated pixel.
- Produce unique reviewed Brood, Atlas, Zero and Prism purification films. Do not relabel generic older clips. Preserve completed NULLFANG work. Runtime must resolve picture and audible music through controlled fade, return to the same living friendly gold guardian, and prove video-on behavior. Alpha remains a quieter optional in-engine rescue.

CAVES AND OPTIONAL ALPHA
Keep every cave purposeful: A5 loose floor/Magnet/history/quarry; A7 survey and paid return; CV1 bound crawler/max core; CV1B survey/map/shortcut/rest/respawn; CV2 Deaf System/beacon/lure; CV3 Gravehorn/marble/changed return; GA1 refuge/Sage/network rescue; A11–A13 optional currency/traversal/Servo evidence; A10/GA2 Alpha offer/cache/cell/scrap/ledger/Pack Sage. Do not add caves for quantity or count source constants as player payoff. Record ordinary-input discovery → acquisition → return → visible consequence → save/reload. Prove Alpha offer→search→rescue→friendly pack→reward→reload while B1 remains independently reachable.

VALIDATION
Run npm ci, npm run build, npm run app:pack and tools/studio/audit.py --profile full against one pinned served snapshot. Preflight the exact browser executable, text metrics and WebGL before acceptance. Preserve original failures and use separate rerun directories. Require final raw-log integrity true with the integrated collector fix. Rerun the cleared-save campaign and opening-order three times after semantic fixes. Add natural Alpha/optional-cave runs. Add real browser touch events, then physical iOS/Android portrait+landscape/safe areas, controller, haptics, listened audio/music fades, thermal, sustained frame time and memory. Inspect art at gameplay size, both facings and across temporal windows.

Return one evidence-backed report with exact refs/conflicts, all fifteen role verdicts, cave/manhwa/animation matrices, commands/exits, original-versus-rerun provenance and five separate states: implemented, tested, visually inspected, integrated, deployed. Never call staged tests a continuous playthrough, keyboard in a phone viewport physical touch, sequence IDs forty-page parity, source presence player discovery, procedural fallback finished art, generated stills integrated animation, a master audio track listened-runtime proof, a host WebGL failure a product failure, or an integrity-failed aggregate a clean full-suite pass. Keep release held until P1 Gravehorn art, manhwa performance, continuous-route reliability and device/accessibility acceptance genuinely close.
```

