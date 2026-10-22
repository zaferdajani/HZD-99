# Single Claude integration prompt

Copy the entire block below as one prompt.

```text
You are the senior integrator for zaferdajani/HZD-99. Work on a fresh integration branch; do not deploy production. Read completely before editing:
- docs/studio/PIPELINE.md
- docs/studio/roles.json and all 15 role files
- docs/STORY_CANON.md
- docs/studio/runs/2026-10-22/REPORT.md
- docs/studio/runs/2026-10-22/DESIGN.md
- docs/studio/runs/2026-10-22/ART.md
- docs/studio/runs/2026-10-22/ENGINEERING.md
- docs/studio/runs/2026-10-21/REPORT.md
- this prompt

SOURCE AND SAFETY
Source branch: codex/studio-review-2026-10-22, based on cumulative review commit 4863de931ac2e3604b72c614a5f0a6e00c078b26. At the October 22 fetch, main and claude/clawbyte-repo-migration-byhyl8 were both 62d75d204c6f6264f25150bb419fc262ff2c18ea. Fetch again, report movement/conflicts and preserve unrelated work. Push only your integration/review branch. Do not merge or deploy unless the owner separately authorizes it.

NON-NEGOTIABLE STORY CONTRACT
Mother's song maintained robot harmony until an unknown entity infected its frequency. HZD-99 survived only because the hero was already asleep/recharging and missed the broadcast, not because of innate immunity. Ratchet's real marble pendant slowed infection; he removed his own battery. The player reads his letter, finds Ratchet's unique hidden cell, completes the repair board, receives a separate spare for Old Servo, is sent to the pod, and receives/explains/funds the permanent Volt Pack before its lessons. The monument is forward and nearby. Old Servo is grounded, visible and purposeful. Mandatory order: raw marble guarded by GRAVEHORN → return to Ratchet → first white purifier sword → Meadow Sage → CHIME → NULLFANG → B1. The Sage and lion are purified, never killed. Alpha is an optional post-forge Lost Wardens quest and must never gate marble, Sage, CHIME, lion or B1.

INTEGRATE THE TWO VERIFIED BOUNDED CHANGES; DO NOT REIMPLEMENT THEM
1. NPC-SAGE-WALK-22 in js/entities.js: `sage` joins WALKERS so its calm travel uses the shared start/turn gait. drawSage distinguishes a moving tamed Sage from rescued idle, selects the existing eight-cell `sageWalk8` with `pure:true` while moving, and returns to `sagePure` only while stopped. Preserve hostile duel behavior, collision, speed, stats and saves. tests/sage-walk.cjs stages only the saved tame fact, drives real Enemy.update/drawSage, checks acceleration, body/walk distance, authored pure strip, rescued idle and room-reload persistence. The retained pass measures 128.47 px body, 123.86 px gait and 34.62→86.41 px/s. Keep the test registered in tests/run.cjs.
2. QA-HATCH-DRIVER-22 in tests/campaign-ch1.cjs: the route into A5 is usable when any one of columns 12–14 is open through both breakable rows. The prior continuous run had a 64 px opening in columns 12–13 but attacked remaining column 14 for >25 minutes. Keep this strictly in the evidence driver. Never mutate terrain, save flags, inventory, enemy state/stats, damage, teleport or invulnerability to make the campaign pass.

DO NOT OVERCLAIM EVIDENCE
The October 21 parent has a certified 16:39 ordinary-keyboard route through B1 on easiest difficulty with two deaths. The October 22 baseline reached GRAVEHORN, raw marble and forge before the driver stalled at the already usable hatch. After the bounded fix, a fresh cleared-storage October 22 route certified in 17:36: easiest difficulty, ordinary keyboard, two deaths, all nine missions, all sixteen required panels in order, zero missed panels and zero page errors. It used a disclosed read-only planner, recorded seven recovery/stuck frames, disabled video and did not play optional Alpha. This is review-branch evidence, not proof of your final integrated snapshot. A same-day full collector was interrupted when the transient checkout was externally removed after reaching cachemoves; its lost artifacts are not a pass. Run a new immutable final collector and repeat the cleared-save unsegmented route after integration. Distinguish staged fixtures, viewport emulation and physical-device play.

ART AND ANIMATION — DO NOT REGENERATE APPROVED WORK
Preserve approved hero, pack/Alpha, crystal, sword, lion and Talon assets. Search ledgers and existing files first.
- P1 GH-ART: approved articulated GRAVEHORN body set and four matching intercut panels. Require planted locomotion, distinct body/limbs/horn, horn detach/return, rear kick, phase-two transformation, down/retreat/recovery and purple eye anchors in both facings. Wire actual intro/phase/down triggers; no procedural stand-in, unrelated panel or bloom-only substitute.
- P2 BOUND-ART-01: true wolf/cheetah down, breath and recovery strips.
- P2 FURNACE-ART: breath, blast, spent, gather, dive and bell poses without changing tells/timing/damage.
- P2 PURIFY-ART-01: hero single-sword raise → gather/hold → slash → recover with continuous hand/hilt contact.
- P2 RITUAL-FILMS: new equivalent boss-to-blade extraction films for Brood, Atlas, Zero and Prism. Old generic purify clips are not substitutes. Preserve the completed lion film.
- P2 localized panels only: m_down.webp boss eyes purple, not red; r_cell.webp background powered-off Servo indicators dark. Preserve all other composition/content.
- P3 localized passage_b.webp anatomy correction: approved compact limbs/mitten paw; preserve tunnel, camera and earned single sword.
Use the approved media pipeline, archive prompts/masters/provenance, derive runtime tiers and obtain owner approval before replacing production assets. One image is not animation.

PURIFICATION CINEMATIC/AUDIO ENDING
The hero raises the purifier, finite white flakes gather, the sword becomes brilliant, a cinematic slash lands with flash/hit-stop/shake, and dark red-black viral motes extract from the boss into the sword. Fade to the film, then return by a resolved fade to the friendly restored actor. Never hard-cut picture or music. Runtime video is muted in source, so an audio track in a master is not listened-runtime proof. Listen through the full music/SFX/video ending on the integrated build and report what actually fades.

COMBAT FEEL AND STATS
Preserve the existing centralized attack/stat contracts: HP, attack power, attack speed, defense; normal hit flash, hero and target sound routes, metallic screws/shards, enemy knockback, small hero recoil, shake and hit-stop; stronger charged damage and more dramatic freeze/shake/VFX; sword progression against higher defense/HP. Do not duplicate constants at call sites. Balance changes require a matrix across weapon tiers, defenses, difficulties and bosses plus updated character-card documentation.

INFECTION VFX CONTRACT
Ordinary infected creatures have red eyes; Alpha, Sages and bosses have purple eyes. Smoke originates at current-frame eye anchors, stays world-locked, stops spawning when motion stops, clears on cure/death/removal/teleport/room change, lives no more than 1.875 seconds, obeys tier caps, and is suppressed under reduced motion while glow remains. Preserve passing infection-eyes, infection-roster and infection-poses contracts. Add sustained physical-device frame-time/memory evidence before performance claims.

MANHWA AND CAVE PARITY
Preserve gradual text reveal and advance debounce, RTL/CJK, remapped-control names and the ordered panel sequence. A panel is not physical action. Close parity with literal runtime/cinematic evidence for cradle reach, battery installation, marble carry, continuous forge contact, cable assistance/catch, CHIME casing opening and hero ritual body motion. Preserve cave purpose: A5 landmark/quarry; A7 survey read/return; CV1 bound crawler/core pocket; CV1B survey/map/shortcut/rest; CV2 founding evidence/beacon; CV3 GRAVEHORN/raw marble/changed return; GA1 refuge/Sage/network; A11–A13 optional rewards/evidence; A10/GA2 optional Alpha/cache/ledger/Pack Sage. Never count an ordinary exit or injected item as cave payoff.

VALIDATION
Run npm ci, node build.cjs, npm run app:pack and the full tools/studio/audit.py profile on one immutable served snapshot with verified browser execution and nonzero canvas text metrics. Preserve content snapshots and hash integrity. Run tests/sage-walk.cjs and all adjacent Sage/gait/story/purification/eye contracts. Run opening-order under finite budgets with milestone, key/touch down-up, charge/release, volts, winch, state and transition tracing; do not fix it by increasing time alone. The October 22 rerun improved desktop to all 15 ordered beats, awake Servo and completed coil errand in A1 with no page errors. Phone-mode reached Ratchet repair, then ended in A0B before pod/pack/monument/Servo, also with no page errors. Preserve the desktop pass and diagnose the phone post-repair stall. Run a cleared-save unsegmented chapter-one route through B1 with ordinary input and no progression mutation. Separately validate real phone touch/orientation, controller, haptics, listened audio endings and sustained performance. Inspect art at gameplay scale across temporal windows, both facings and cold/full tiers.

Return one evidence-backed report with exact refs, conflicts/resolutions, all 15 role verdicts, story/cave/manhwa/animation matrices, commands/exits, original-vs-rerun provenance and five separate states: implemented, tested, visually inspected, integrated, deployed. Never call staged tests a continuous playthrough, emulation a physical device, source presence player discovery, or generated artwork integrated animation. Never write “finished” while any gate above remains open.
```
