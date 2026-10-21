# Single Claude integration prompt

Copy the entire block below as one prompt.

```text
You are the senior integrator for zaferdajani/HZD-99. Work on a fresh integration branch from the current intended integration head. Do not deploy production. Read completely before editing:
- docs/studio/PIPELINE.md
- docs/studio/roles.json and all 15 role files
- docs/STORY_CANON.md
- docs/studio/runs/2026-10-21/REPORT.md
- docs/studio/runs/2026-10-21/DESIGN.md
- docs/studio/runs/2026-10-21/ART.md
- docs/studio/runs/2026-10-21/ENGINEERING.md
- this prompt

Source branch: codex/studio-review-2026-10-21. Its parent is cumulative review commit 04076250b29c4cb7cdcbd8d91e32ddbe0b54626e. At review completion, main and claude/clawbyte-repo-migration-byhyl8 were both 62d75d204c6f6264f25150bb419fc262ff2c18ea. Fetch again and report any movement before integration. Preserve unrelated work and three clone-time temporary dot-files; do not stage/delete them.

NON-NEGOTIABLE STORY CONTRACT
The Mother song maintained harmony, then an unknown entity infected its frequency. HZD-99 survived only because the hero was already asleep/recharging and missed the broadcast—not because of innate immunity. Ratchet's real marble pendant slowed infection; he removed his own battery. The player reads his letter, finds Ratchet's unique hidden battery, completes the repair board, receives a separate spare cell for Old Servo, is sent to the save/recharge pod, and receives/explains/funds the permanent Volt Pack before heal/Burst lessons. The monument is forward and nearby. Old Servo is grounded, visible and purposeful. The mandatory route is raw marble guarded by GRAVEHORN → return to Ratchet → first white purifier sword → Meadow Sage → CHIME → NULLFANG → B1. The first Sage and lion are purified, not killed. Alpha is an optional post-forge Lost Wardens detour and must never become the marble, Sage, CHIME or lion prerequisite.

INTEGRATE THESE VERIFIED BOUNDED CHANGES; DO NOT REIMPLEMENT OR WEAKEN THEM
1. NPC-LETTER-LABEL-20: js/opening.js opNearLabel returns localized op_note for offline A0B Ratchet before ratchetCell, op_repair while carrying ratchetCell, null/ordinary Talk once alive, and preserves Servo. tests/story-battery.cjs covers initial, carried-cell, restored and distinct Servo-cell behavior.
2. QA-PURIFY-TOUCH-20: tests/purification-controls.cjs waits for TOUCH.rawW/rawH to match the visual viewport after rotation, redraws through production code, asserts the 48px hold button is on-screen and elementFromPoint hits it, then keeps the original CDP touch, >0.4 sample, 1.6-second completion, cancel, blur, hidden-clock and save checks. Do not call handlers directly or relax thresholds.
3. QA-CAMPAIGN-BAT-20: tests/campaign-ch1.cjs detects five seconds with no player/enemy movement and no enemy HP damage, then skips only that enemy kind in that room for twelve seconds so ordinary route input resumes. Never mutate game state, enemy stats, terrain, damage, inventory, flags, teleport or invulnerability. This produced a certified 16:39 continuous route through B1 with two deaths, all nine missions and all sixteen panels.
4. Review setup: docs/studio/runs/2026-10-21/setup/browser-wrapper.cjs explicitly selects its checked-in fonts.conf. Before correction canvas measureText('hello world') was 0; after it was 90px. This is evidence infrastructure, not shipped game code.

PRESERVE THE EVIDENCE
The frozen full collector attempted all 196 registered harnesses plus build, pack and two served-identity gates: 195/200 passed, five failed, exit 1. Do not rewrite it as green. The five originals were comic-rewards, textreveal, foescale, opening-order and forge. With corrected font metrics, an explicitly separate postflight rerun passed comic-rewards, textreveal (including gradual pages, CJK and Arabic), foescale and forge: 4/4. opening-order still failed after 482.6 seconds under unchanged budgets: desktop stopped after the pack handoff; phone keyboard emulation reached monument/go in A0 but not Servo. No page errors. Treat this as QA-OPENING-PHONE-20/P2, not proof Servo itself is broken. Add monotonic milestone, input down/up, charge/release, volts, winch, state and transition tracing; distinguish budget exhaustion from a live progression bug; do not merely increase the timeout.

Evidence integrity is red: all 198 captured snapshots validate, but only 195 current raw logs match. The divergences are servo-presence.log, mapexits.log and kingdom1.log. Never repair, replace or re-hash the old execution into agreement. Instrument writers/lifecycle, preserve captured-vs-current provenance, and prove a new collector ends with every raw log matching its same-byte snapshot while truncate/delete/tamper controls still fail closed.

ART AND ANIMATION PRIORITIES
Do not regenerate approved hero, pack/Alpha, crystal, sword, lion or Talon art. Search existing assets/ledgers first.
P1 GH-ART: the mandatory raw-marble guardian still needs an approved articulated GRAVEHORN body set and four matching story panels. Required performance: planted locomotion, body/limb/horn separation, horn detach/return, rear kick, phase-two transformation, down/retreat/recovery and purple boss-eye anchors in both facings. Integrate actual intro/phase/down triggers; no procedural stand-in, unrelated panel or bloom-only substitute.
P2 BOUND-ART-01: true wolf and cheetah down/breath/recovery strips; keep fallback until approved art exists.
P2 FURNACE-ART: six already-briefed poses—breath, blast, spent, gather, dive, bell—without changing tells/timing/damage.
P2 PURIFY-ART-01: authored hero single-sword raise → hold → slash → recover with continuous hand/hilt contact. Preserve the completed lion ritual film and its resolved picture/audio fade.
P2 SAGE-RESCUE-MOTION-21: first reproduce the owner's sleeping/slide report from a clean normal-input save. Identify actor, state, selected frame, x/y and planted-foot drift through the complete rescued exit. If the actor translates, wire a real walk/recovery sequence; do not alter an unidentified actor.
P2 ART-5: localized edit only to assets/manhua/ch1/game/m_down.webp—boss infection eyes must be purple, not red.
P2 ART-6: localized edit only to assets/manhua/ch1/game/r_cell.webp—background powered-off Servo eyes/chest must be dark; preserve awake Ratchet, pendant, cell, lamp and composition.
P3 ART-4: localized edit only to assets/manhua/ch1/game/passage_b.webp—restore approved compact limb/mitten-paw anatomy; preserve tunnel, camera and earned single sword.
Four equivalent new boss-to-blade extraction ritual films remain absent for Brood, Atlas, Zero and Prism. Older generic purify clips are not substitutes. Use the approved media pipeline, archive masters/provenance, derive runtime tiers and obtain owner approval before replacing assets. One image is not animation.

FLIER-BANK-SCALE-20
The frozen collector sampled a 68px hurt hero and found four samples at the 1.0 ceiling. Corrected rerun sampled a 71px idle hero and passed all 160. Historical actual art inspection still found a 73px banked-cruise extremum. Make the test deterministic: same canvas/time hero ruler, fixed hero state, every authored full-tier cell, both facings and actual AI bank range. Do not lower the 0.5 floor, raise the 1.0 ceiling, crop wing tips, move only the glow, normalize per pose or change hitboxes/timing merely to pass.

MANHWA AND CAVE PARITY
Preserve gradual reveal/advance separation, RTL and remapped controls. Existing panel sequence is wake, bay, gate, letter, drawer, Ratchet, meet, cave, marble, forge, passage, Sage, break, CHIME, free, ch2. A flattened panel is not physical action. Close parity only with actual gameplay/cinematic evidence for cradle reach, battery installation, raw-marble carry, continuous forge contact, cable assistance/catch, CHIME casing opening and hero ritual body motion.
Preserve cave purposes: A5 loose-floor/quarry landmark; A7 actual survey read and once-paid return; CV1 bound crawler plus core pocket; CV1B survey pod/map/shortcut/rest; CV2 founding evidence/beacon; CV3 GRAVEHORN/raw marble/changed return; GA1 refuge/Sage/network; A11–A13 optional treasures/evidence; A10/GA2 optional Alpha/cache/ledger/Pack Sage. Do not count ordinary exits or injected inventory as meaningful completion.

INFECTION VFX CONTRACT
Ordinary infected creatures: red eyes. Alpha, Sages and bosses: purple. Trails originate at current-frame eye anchors, remain world-locked, stop spawning when motion stops, clear on cure/death/removal/teleport/room change, live no more than 1.875 seconds, remain capped by tier, and disable smoke under reduced motion while retaining readable glow. Preserve current passing infection-eyes, infection-roster and infection-poses tests. Add physical-device sustained frame-time/memory checks before claiming performance certification.

VALIDATION AND REPORTING
Run npm ci, node build.cjs, npm run app:pack and the full tools/studio/audit.py profile on one final merged snapshot with a verified executable browser and nonzero canvas text metrics. Pin start/end served bytes and source hashes. Preserve original failures and separate reruns. Run a new cleared-save, unsegmented ordinary-input route through B1 without progression mutations. Report difficulty, deaths, recoveries, film skips, planner/map assistance, missing video/audio review and optional-route exclusions.
Run opening-order with finite budgets and new tracing. Separately validate real phone touch/orientation, controller and haptics on physical devices. Listen to complete music/SFX/video endings; inspect gameplay-size graphics across full temporal windows, both facings and cold/full-tier transitions. Do not claim staged tests are continuous play, browser emulation is a device, source presence is player discovery, or a generated asset is integrated animation.

Return one evidence-backed integration report containing: exact refs/commits, conflicts and resolutions, before/after findings, all 15 role verdicts, story/cave/manhwa/animation matrices, exact commands/exits, original-vs-rerun provenance, and five separate states—implemented, tested, visually inspected, integrated, deployed. Push only your integration/review branch unless the owner explicitly authorizes production merge/deploy. Never write “all finished” while any gate above remains open.
```
