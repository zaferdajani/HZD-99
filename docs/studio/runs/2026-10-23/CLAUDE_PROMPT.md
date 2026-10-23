# Single Claude integration prompt

Copy the entire block below as one prompt.

```text
You are the senior integrator for zaferdajani/HZD-99. Work on a fresh integration branch. Do not merge or deploy production. Read these files completely before editing:
- docs/studio/PIPELINE.md
- docs/studio/roles.json and all 15 docs/studio/roles/*.md mandates
- docs/STORY_CANON.md
- docs/studio/runs/2026-10-23/REPORT.md
- docs/studio/runs/2026-10-23/DESIGN.md
- docs/studio/runs/2026-10-23/ART.md
- docs/studio/runs/2026-10-23/ENGINEERING.md
- docs/studio/runs/2026-10-22/REPORT.md
- this prompt

SOURCE AND SAFETY
Integrate from codex/studio-review-2026-10-23. Its October 23 review commit descends from c259a7c3c850474f6217e921b57820918fa89d55. At intake, both main and claude/clawbyte-repo-migration-byhyl8 remained at 62d75d204c6f6264f25150bb419fc262ff2c18ea, so no upstream source/art delta existed after October 22. Fetch all refs again, report any movement or conflicts and preserve unrelated work. Push only your integration/review branch. Do not merge or deploy unless separately authorized.

NON-NEGOTIABLE STORY AND ORDER
Mother's song kept robot kingdoms peaceful until an unknown entity infected its frequency. HZD-99 survived because the hero was asleep/recharging and missed the broadcast, not because of innate immunity. A short wakes the forgotten hero. Ratchet's real marble pendant slowed infection; he removed his own battery. The player reads his letter, finds his unique hidden battery, completes the board repair, receives a separate spare for Old Servo, uses the save/recharge pod, and is taught/funded to buy the permanent Volt Pack before healing and Burst lessons. The monument is forward and nearby. Old Servo is grounded, visible and purposeful. Mandatory order is GRAVEHORN/raw marble → Ratchet forge/first white purifier sword → Meadow Sage → CHIME → NULLFANG → B1. Sages and guardians are purified, not killed. Alpha is an optional post-forge Lost Wardens quest and must never gate marble, Sage, CHIME, NULLFANG or B1.

INTEGRATE; DO NOT REIMPLEMENT VERIFIED WORK
Preserve the cumulative October review fixes already on this branch:
1. Purified Sage movement in js/entities.js: `sage` participates in WALKERS; a moving tamed Sage selects authored `sageWalk8` with `pure:true`; a stopped rescued Sage returns to `sagePure`. Keep hostile duel behavior, collision, speed, stats and save facts unchanged. Preserve tests/sage-walk.cjs and its registration.
2. Campaign hatch recognition in tests/campaign-ch1.cjs: any one fully opened column through both breakable rows is a usable player-width shaft. Keep this in the evidence driver only; never mutate terrain, inventory, quest flags, enemy stats, damage, teleports or invulnerability to make the route pass.
3. October 23 terminal diagnostics in tests/opening-order.cjs: keep the unchanged 240-second limit, transition timeline, terminal state/cut/video details, per-mode JSON and terminal screenshot. The phone mode is honestly labeled as a touch-capable viewport driven by keyboard/mouse, not a physical-touch playthrough. Do not delete the diagnostics or hide finite failures.

TODAY'S EVIDENCE
The full collector ran against clean commit 7c3cefeb6bda7aa59e9ae34520e50bbdd6d45237 with pinned served-file hashes and verified Latin/Chinese/Arabic canvas metrics. Build, package and 198/201 harnesses passed. All captured raw logs match their immutable snapshots. Preserve the three failures as evidence:
- opening-order: both modes reached all 15 steps in order, the forward monument and final `go` step with zero pickups and zero page errors, but the 240-second budgets closed before A1/Servo. An independent same-day phone-sized diagnostic did reach A1, wake Servo and accept the coil errand; desktop reached `atk` at 233.7 seconds. This is host timing/evidence, not proof of a new game deadlock. Do not fix it by raising the timeout alone.
- campaign-ch1: the full collector attempt failed before gameplay because Playwright FFmpeg was absent. After installing it, a separate no-video, cleared-storage run completed opening, Servo, first meeting, marble and forge, died once during the Sage fight, then timed out at 40:00 after 166 ordinary-input recoveries from the same CV2 central platform. It had zero page errors and no panel-order errors. Treat this as a route-driver recovery failure until a human traversal reproduces it; do not claim a product soft-lock. Fix the planner without teleporting or mutating state, rerun, and keep original-versus-rerun provenance separate.
- bake3d: the full collector's software wrapper disabled GPU/WebGL, so Three.js could not create a context. A separate SwiftShader/WebGL rerun then passed the unchanged bake assertions in 3.5 seconds. Preserve the original failure and separate passing provenance; establish a declared WebGL-capable integration wrapper rather than weakening silhouette/grounding/clip/video assertions.
Most passing harnesses stage saves/positions. The separate campaign is the only uninterrupted ordinary-input route. Viewport emulation is not physical touch/device evidence.

ART — DO NOT REGENERATE APPROVED ASSETS
Preserve approved hero, pack/Alpha, crystal, sword, NULLFANG/lion and Talon assets. Search ledgers and the repository before generation.
- P1 GH-ART: produce the approved articulated GRAVEHORN design/body set and four matching intercuts. Require planted locomotion, distinct body/limbs/horn, horn detach/return, rear kick, phase-two transformation, down/retreat/recovery and purple eye anchors in both facings. Wire actual intro/phase/down triggers; no procedural stand-in, unrelated panel or bloom-only substitute.
- P2 BOUND-ART-01: real wolf and cheetah down, breathing and recovery strips. The current bound wolf is visibly a tiny flattened held crouch cell compared with the authored live wolf.
- P2 FURNACE-ART: breath, blast, spent, gather, dive and bell poses without changing tells/timing/damage.
- P2 PURIFY-ART-01: authored hero single-sword raise → gather/hold → slash → recover with continuous hand/hilt contact.
- P2 RITUAL-FILMS: guardian-specific Brood, Atlas, Zero and Prism extraction films. Do not relabel the old generic 960×540 clips. Preserve the completed 1280×720, 13.25-second lion ritual and its resolved picture/music fade.
- Localized panel edits only: make NULLFANG's eyes purple in assets/manhua/ch1/game/m_down.webp; darken the powered-off background Servo's eyes/chest in r_cell.webp; correct the compact hero anatomy in passage_b.webp. Preserve composition, environment, camera and earned equipment.
Use the approved media pipeline, archive prompts/masters/provenance, derive runtime tiers, and require owner review before replacing production assets. A single image is not an animation.

PURIFICATION ENDING
Preserve the deliberate hold-to-free action. The hero raises the purifier; finite white flakes gather; the sword becomes brilliant; a cinematic slash lands with flash/hit-stop/shake; dark red-black virus energy extracts from boss to sword and neutralizes; the picture fades through black and returns by a resolved fade to the same living friendly golden guardian. Interrupted charge grants no reward and remains retryable. Never hard-cut picture or music. Runtime film is muted in source, so master audio is not listened-runtime proof. Listen through the full integrated music/SFX/film ending and report the actual fade.

COMBAT AND STATS
Preserve centralized HP, attack power, attack speed and defense; normal enemy white flash, separate hero/target sound routes, robotic screws/shards, target knockback, small hero recoil, shake and hit-stop; stronger held-hit damage and more dramatic freeze/shake/VFX; sword progression against higher HP/defense; damage logging and the character-card/PDF documentation. Do not duplicate constants at call sites. Any balance change requires a weapon × defense × difficulty × boss matrix and updated cards.

INFECTION EYE CONTRACT
Ordinary infected creatures use red eyes; Alpha, Sages and bosses use purple. Trails originate at current-frame eye anchors, remain world-locked, emit only from body travel, stop when motion stops, clear on cure/death/removal/teleport/room change, live no more than 1.875 seconds, obey tier caps and disappear under reduced motion while glow remains. Preserve the fresh passing infection-eyes, infection-roster and infection-poses checks. Add sustained physical-device frame-time/memory before performance claims.

MANHWA AND CAVE PARITY
Preserve gradual letter-by-letter reveal, advance debounce, RTL/CJK, remapped-control labels and all 16 ordered panel beats. A panel is not a physical action. Close literal parity for cradle reach, battery installation, marble carry, continuous forge contact, NULLFANG cable assistance/catch, CHIME casing opening and hero ritual body motion. Keep every cave meaningful: A5 landmark/quarry; A7 survey read/return; CV1 bound crawler/core pocket; CV1B survey/map/shortcut/rest; CV2 evidence/beacon; CV3 GRAVEHORN/raw marble/changed return; GA1 refuge/Sage/network; A11–A13 optional rewards/evidence; A10/GA2 optional Alpha/cache/ledger/Pack Sage. Do not count an exit ID or injected item as payoff.

VALIDATION AND ACCEPTANCE
Run npm ci, node build.cjs, npm run app:pack and tools/studio/audit.py --profile full on one immutable served snapshot. Verify wrapper execute permission, nonzero browser glyph/layout metrics and stored log integrity. Rerun the complete cleared-save keyboard campaign to B1 with no progression mutation. Separately play the full Alpha offer→rescue→friendly pack→reward→reload loop and every optional cave acquire→return→visible-consequence loop using ordinary input. Add a true-touch route using actual touch events, then test physical phone orientation, controller, haptics, listened audio fades and sustained performance. Inspect art at gameplay scale across all poses, both facings and temporal windows.

Return one evidence-backed report with exact refs, conflict resolutions, all 15 independent role verdicts, cave/manhwa/animation matrices, commands/exits, original-versus-rerun provenance and five separate states: implemented, tested, visually inspected, integrated, deployed. Never call staged tests a continuous playthrough, keyboard in a touch viewport physical touch, source presence player discovery, a mechanics fallback finished artwork, or generated stills integrated animation. Do not claim completion while these gates remain open.
```
