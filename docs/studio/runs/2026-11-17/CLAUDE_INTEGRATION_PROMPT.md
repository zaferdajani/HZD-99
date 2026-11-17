# Single Claude integration prompt — 2026-11-17

Copy the complete block below as one prompt.

```text
You are integrating the senior studio review for zaferdajani/HZD-99. Work from the latest remote main in a fresh branch. Read these files first:

- docs/studio/PIPELINE.md
- docs/studio/roles.json
- docs/studio/runs/2026-11-17/REPORT.md from branch codex/studio-review-2026-11-17
- docs/studio/runs/2026-11-17/automated/results.json from that branch
- docs/STORY_CANON.md
- manhua/full-story.md
- manhua/edition.json

Review pin: main, odyssey, and integration were all 9248529edc7f7b9503d9c373c169593da419117d at audit intake. The integration branch then advanced concurrently to bba411fc1b4b99238bbec7d41170deb375ae2a77. The verified bounded-fix source pin on codex/studio-review-2026-11-17 is 644693e13fb7dab1ca409a2c12acedcf27816a63, tree 61380a158c02013ca6732769767cbc2a49fcd6a8. Integrate the final review-branch tree difference onto the latest source, not just the prose and not by overwriting concurrent work. Preserve every newer main change and the late integration assets/runtime changes at bba411f. Do not merge or deploy production automatically.

KEEP AND VERIFY THESE REVIEW-BRANCH FIXES:

1. Five-language PURIFY/PURIFIED terminology and accessible label in js/purification.js, js/text-opening.js, js/text-manhwa.js, and js/text-progress.js, plus tests/purification-language-contract.cjs. Do not rename stable internal save IDs/functions.
2. Visible-three plus FIFO story captions in js/overlay.js and tests/scene-caption-contract.cjs. The fourth line must wait, reveal in order, and never evict unread text.
3. Atomic/idempotent quest and forge settlement in js/quests.js and presentation-only post-settlement paths in js/game.js, plus tests/quest-payment-contract.cjs. One durable write must contain quest done, item removal, rewards, Purifier, and Ratchet-camp state; storage failure must leave live state unchanged; replay must pay nothing; legacy done-without-Purifier repairs once.
4. Explicit infection authority in js/infection-eyes.js and tests/infection-eye-authority-contract.cjs. Ordinary infected creatures have finite red trails; infected guardians have finite purple trails; clean rivals/constructs such as Alpha, Gravehorn, PRISM, CHIME, Carrier, Moth, Lattice, and Lens have no virus trail. Preserve Gravehorn's authored red construct optic, red-orange attack telegraphs, hazard stripes, and molten phase-two cracks.
5. Browser preflight/direct+transitive Playwright classification in tools/studio/audit.py and tools/studio/test_audit.py. Browser infrastructure failure must be BLOCKED before launch, never a gameplay FAIL. Keep the corrected test metadata for hero-delivery, hero-frame-alpha, and hero-alpha because they launch Playwright.
6. Rebuilt tracked pages must match source.

DO NOT RESTORE THE NOVEMBER 15 “MEADOW KEEPER” RULING. It was superseded on November 16. The seven robed entities are distinct Eye agents: TALLYMAN, LEASH, UNDERTOW, SLAGFATHER, REDACTOR, LAPIDARY, and PUPIL. Keep internal sage*/sg_* IDs only for compatibility.

IMPLEMENT IN THIS ORDER, WITH SMALL REVIEWABLE COMMITS:

A. CAMPAIGN AUTHORITY — BLOCKING DESIGN DECISION
Current runtime/tests enforce marble/forge -> robed agent -> CHIME -> NULLFANG, while the newest owner canon states Gravehorn constructs -> NULLFANG -> Wolf King -> the Eye agent working the pack. Reconcile docs, room gates, progress objectives, panels, saves/migrations, and tests around one approved graph. Do not silently move rooms or invent lore. If owner approval is unavailable, isolate the graph behind an explicit documented decision and stop short of production approval.

B. DURABILITY AND WORLD CORRECTNESS
- Restore one clone-and-publish NPC restoration transaction for Ratchet, Servo, and generic NPCs: item removal, awake flag, repair flags, and once-only gifts in one write; rollback on failure; presentation only after success; reload tests at every boundary.
- Restore crossed-row downward collision sweep in moveEnt without removing newer step-up logic. Pass 30/60 Hz solid and one-way floor tests and render high-fall landings.
- Restore a sorted exact-coordinate broken-tile terrain signature. Equal count/different coordinates must differ; insertion order must not.
- Fix rescued Eye-agent walking: add the internal sage entity to distance-gait accumulation; a moving tamed agent selects the authored walk with purified tint; a stationary one uses the purified idle/kneel. Render every named variant after rescue.

C. ALPHA AND PRISM ENDINGS
- Alpha is a clean rival/Wolf King, not a Song-infected guardian. Replace generic cleanse/virus extraction with a dedicated yield/covenant sequence and wording. Keep the optional pack-friendship reward durable. Resolve its placement only after campaign authority is approved.
- PRISM is currently described as never infected but included in virus purification. Obtain an owner-approved non-virus stand-down/consent ritual or explicitly change canon before producing a film. Do not fabricate virus extraction while the story says there is no virus.

D. ART, MOTION, CINEMATICS, AND CAVES
- Do not regenerate the completed NULLFANG film/strips, Alpha strips, pack-wolf strips, hero art, or the landed Gravehorn rig.
- Late integration bba411f already adds distinct TALLYMAN, LEASH, and UNDERTOW bodies/strips, a rear/three-quarter Gravehorn turn, object platform plates, Mono plates, and 17 refired manhwa panels. Preserve them, inspect them at gameplay scale, and fix only verified defects; do not regenerate them blindly.
- Create equivalent distinct Eye-agent silhouettes and stand/walk/lunge/exhale coverage only for the still-missing SLAGFATHER, REDACTOR, LAPIDARY, and PUPIL. Preserve stable internal IDs.
- Finish only missing Gravehorn phase-two parts, a true hind leg, and a high-quality rear-three-quarter turn.
- Replace or grade the old pale-grey Ratchet wake film to match the live copper/bronze Ratchet; validate normal, skip, and fallback handoffs.
- Pin one manhwa edition before further refiring. First review the 17 panels already replaced by late integration bba411f; keep correct replacements and repair only remaining verified off-model/obsolete panels. Certify parity per scene.
- Keep CV1B as a one-ring side chamber; update stale documentation rather than restoring the removed second ring.
- Give each later GB1/GC1/GD1/GX1/GE1 agent network one kingdom-specific action, one durable visible consequence, and one later callback.
- Produce only approved missing guardian ritual films (Brood/Atlas/Zero; PRISM only after canon decision). Preserve NULLFANG's 13.25-second authored film and its audio/picture fade.

E. UI, ACCESSIBILITY, AND EVIDENCE
- Complete full-screen overlay ownership for PAUSE/MAP/BAG/CREST/SKILLS/RELICS/FILMS/PANELLIST. Coalesce duplicate non-story requests and bound repetition without dropping unique story FIFO items.
- Define a global reduced-motion policy for fxgl pressure, cracks, slash, cone, flash, pillar, and gather while preserving combat readability.
- Inventory effective chapter-one and pause-menu strings through the actual t() resolution order. Eliminate critical-route English fallback in Turkish, Chinese, and Russian. Render Arabic RTL, CJK wrapping, and every relevant screen at 200% text without clipping or lost hit targets.
- Restore the stronger audit guarantees still missing: immutable log snapshots, post-capture log-integrity validation, and descendant cleanup after a successful leader. Keep honest browser preflight.

REQUIRED ACCEPTANCE — DO NOT SUBSTITUTE STAGED TESTS FOR PLAY:

1. npm ci, npm run build, npm run app:pack, syntax checks, tools/studio/test_audit.py, all focused contracts, and the full studio audit.
2. Two uninterrupted ordinary-input fresh-save routes at gameplay size:
   - Alpha skipped.
   - Alpha completed.
   Both must include death/Continue, forge, approved agent/CHIME order, NULLFANG fight, final-hit prompt, hold-cancel-retry, cinematic or truthful fallback, purified golden/friendly return, and chapter teaser.
3. Separate staged/component evidence may seed rooms and saves, but label it STAGED. Never call it an uninterrupted playthrough.
4. Capture fresh desktop 960x540 and real landscape phone-touch routes. A mobile viewport driven by keyboard is not touch certification.
5. Test physical controller/remapping, controller hold, vibration/haptics, audible hit/roar/film fades, WebGL and Canvas fallback, reduced motion, RTL/CJK, and 200% text. Report any unavailable lane as UNVERIFIED, not passed.
6. Inspect every changed sprite/animation at actual gameplay scale for foot contact, anchors, hit boxes, telegraph readability, and camera framing.
7. Re-run persistence tests with reloads and simulated storage failure for forge and NPC restoration.
8. The full audit must report exact source SHA/tree, clean start, per-test pass/fail/timeout/blocked classifications, and intact logs.

OUTPUT:

- A concise integration changelog mapped to stable finding IDs in the November 17 report.
- Exact commit SHA/tree and branch.
- Test/evidence table separating source, staged browser, uninterrupted play, gameplay-size render, and physical-device evidence.
- Remaining blockers with honest scope.
- Push only the integration branch for review. Do not merge main and do not deploy production.
```
