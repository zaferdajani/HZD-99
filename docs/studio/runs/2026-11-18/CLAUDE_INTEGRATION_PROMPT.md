# Single copyable Claude integration prompt

```text
You are the senior integration engineer for zaferdajani/HZD-99. Work from the newest remote main in a fresh branch. Do not merge or deploy production. Preserve concurrent work and never replace newer owner-approved art with older assets.

FIRST READ, IN THIS ORDER:
1. docs/studio/runs/2026-11-18/REPORT.md from branch codex/studio-review-2026-11-18
2. docs/STORY_CANON.md, docs/OWNER_ORDERS.md, docs/OWNER_CORRECTIONS.md, docs/OWNER_UNDERSTANDING.md
3. docs/MANHWA_EVENT_MAP.md, manhua/full-story.md, manhua/edition.json
4. docs/CAVES_CH1.md, docs/STORY_SHEET.md, docs/STORY_SCRIPT.md
5. docs/studio/PIPELINE.md and docs/studio/roles.json

INTEGRATE THE REVIEW-BRANCH SAFETY WORK FIRST:
- Apply or manually port docs/studio/runs/2026-11-18/0001-studio-restore-review-safety-contracts-on-latest-art.patch from codex/studio-review-2026-11-18 onto the newest main.
- The patch was verified locally as source commit 9279a3675c381dc30b9ce8b775051efe3b72f58a; rebuilt-page verification commit was 12e785fa55bd5177bbf08c4e8bd4e034bfc43513. Treat those as evidence pins, not as permission to overwrite newer remote files.
- Resolve semantically, rebuild all tracked pages, and run the contracts. Do not blindly overwrite newer files.
- Preserve the five-language PURIFY/PURIFIED wording and ARIA contract, scene-caption FIFO, atomic quest/forge settlement plus legacy repair, explicit infection-eye authority, and audit preflight corrections.

DO NOT REGENERATE OR REPLACE COMPLETED ASSETS:
- Preserve all seven distinct Eye-agent asset families: TALLYMAN, LEASH, UNDERTOW, SLAG, REDACT, LAPID, PUPIL.
- Preserve TALLYMAN's rig, all existing fired plates/source sheets, the 18 November refired manhwa panels, GRAVEHORN front/rear/three-quarter/tail/turn work, Alpha's state family, pack-wolf hunt work, current hero art, and the NULLFANG purification movie.
- Do not create PRISM purification media. Canon says PRISM was never infected unless the owner explicitly changes that authority.

IMPLEMENT IN THIS PRIORITY ORDER:

P1. ONE CAMPAIGN AUTHORITY
- Current owner canon requires GRAVEHORN/raw marble constructs → forge Purifier → NULLFANG first corrupted guardian → optional Wolf King/Alpha yield → pack-controlling Eye agent.
- Current runtime/tests still certify forge → TALLYMAN/first Sage → CHIME → NULLFANG. Replace the obsolete graph everywhere as one migration-safe change: room gates, doors, objectives, map reward, dialogue, panel triggers, quest offers, save flags, Continue relocation, docs, and tests.
- Resolve the skip path explicitly: Alpha remains optional and cannot block NULLFANG or chapter completion. Define how the pack agent is reached/revealed if Alpha is skipped, consistent with approved canon.
- Migrate old saves to the nearest reachable next objective without deleting earned rewards.

P1. ALPHA IS A WOLF-KING COVENANT, NOT A PURIFICATION
- Remove the post-forge auto-offer. Offer/reveal the Wolf King branch only at the approved post-NULLFANG beat.
- Remove “purify/free/release” copy for Alpha in every locale.
- Last hit must enter a dedicated surrender/yield/covenant sequence. Do not call the guardian extraction ritual, do not set `purified`, and do not emit boss-purple virus smoke.
- Persist Alpha alive, pack friendly/cyan, cache/reward and quest outcome exactly once across room leave, death, Continue, and reload.

P1. ATOMIC NPC RESTORATION
- Implement one reusable clone-and-publish transaction for Ratchet, Servo, and generic NPC restores: unique battery removal, charge/awake/repaired state, release flags, gifts, quest/story continuation, one authoritative persist.
- A failed persist must leave both live and saved state unchanged. Replay/reload must not consume a second cell or duplicate a gift.
- Add contracts for failure rollback and every interruption boundary.

P1. RESCUED AGENTS MUST WALK
- Only stationary agents may use a kneeling/pure plate.
- Every moving purified Eye agent must use its own moving rig/walk with purified grading. TALLYMAN already has a rig; extend behavior without homogenizing the seven identities.
- Keep feet planted, scale stable, silhouettes readable, no sprite sliding, no infected eye trail after rescue. Verify all seven at gameplay size before and after reload.

P1. WORLD INTEGRITY
- Fix terminal fall collision by sweeping every crossed Y row for solid and one-way floors at 30 and 60 Hz. The recovered contract currently shows ~31.99 px sinking at 30 Hz.
- Restore a broken-tile signature based on sorted coordinates. Same set/different insertion order must match; different cells/same count must differ.

P1. PRISM AND INFECTION AUTHORITY
- Remove PRISM from PURIFICATION_KINDS and implement/retain a non-virus stand-down/consent conclusion.
- Preserve explicit eye-trail authority: ordinary infected creatures red; corrupted guardians purple; Alpha, GRAVEHORN, PRISM, Eye constructs and other clean rivals may keep authored optics but must not emit virus smoke.
- Trails must stay finite, anchored to eyes, motion-dependent, capped, teleport-safe, cleaned on cure/death/room/reload, and suppressed under reduced motion.

P1. MANHWA AND STORY PARITY
- Do not silently choose between Draft 3 and Draft 4. Produce a small authority decision record from owner files, then update runtime/docs/tests to that one pinned edition.
- Build a scene parity table for the chapter: runtime identity, equipment timing, action, room, spoiler level, source panel, current capture, certification status.
- Repair only the `ch2_b` teaser so the captioned UNDERTOW uses UNDERTOW's sea-green cable-weed/sluice-wheel identity; its current generic black hood was fired from a TALLYMAN reference. Do not touch the other completed panels.
- Replace player-facing “seven chamber sages,” “Meadow Sage,” and retired halo/ember wording with named Eye agents while retaining internal legacy IDs where needed.
- All narrative/dialogue text must reveal letter by letter at the configured speed, remain advanceable without accidental skip, and keep FIFO order.

P2. CAVE AND QUEST VALUE
- Keep CV1B a one-ring survey/future-skill-cache room; update docs and do not restore a duplicate CV2 portal.
- Give GB1/GC1/GD1/GX1/GE1 networks one kingdom-specific verb, persistent local transformation, distinct payoff and later callback each. Reuse the completed agent art.
- Give A7/D2/A11/A13 unique durable reward IDs; migrate without respawning collected rewards.
- Add a visible persisted consequence and clear landmark guidance to later errands.

P2. COMBAT DOCUMENTATION AND RITUAL COVERAGE
- Regenerate output/pdf/CLAWBYTE-Character-Cards.pdf and its machine-readable ledger from the exact current build. The old PDF is stale: it says 45/65/85 ms and 5/9/14 fragments while runtime uses 110/140/170 ms and 10/15/22 fragments.
- Preserve the existing hit architecture: silhouette flash, metallic debris/screws/sparks, clash audio, hero/enemy recoil, freeze/hit-stop, shake, haptics, and stronger charged attack.
- Keep NULLFANG's existing purification movie. For Brood/Atlas/Zero, use the current in-engine fallback unless owner-approved films already exist; do not invent or regenerate media unnecessarily.
- If a video is used, audio and image must fade out intentionally rather than cut.

REQUIRED VERIFICATION — REPORT STAGED AND UNINTERRUPTED SEPARATELY:
1. npm ci
2. npm run build
3. npm run app:pack
4. python3 tools/studio/test_audit.py
5. Run the full studio audit and report pass/fail/blocked/timeout counts. Infrastructure block is not a pass.
6. Run all new/restored source contracts including purification-language, scene-caption, infection-eye-authority, quest-payment, NPC restore, opening settlement, sage walk, terminal fall and tile signature.
7. In a browser-capable environment, complete two uninterrupted normal-input fresh-save desktop routes from wake to chapter endpoint: Alpha skipped and Alpha completed. Do not set room, health, position, flags, or invoke internal functions. Record death/Continue at every gate.
8. Run a full touch route and a controller route. Verify real audio on phone speaker/headphones and real haptics/rumble. Verify reduced motion.
9. Capture current gameplay-size evidence for all seven agents moving after rescue, GRAVEHORN, NULLFANG, Alpha, red small-enemy trails, purple infected-guardian trails, and clean no-smoke exclusions.
10. Test EN/AR/TR/ZH/RU, RTL/CJK, text reveal, overlay queue, input debounce, touch targets, and 200% text without clipping.

DELIVERABLES:
- Commit code, tests, rebuilt tracked pages, migrations, and updated documentation to your integration branch only.
- Add one evidence-backed Markdown integration report with exact base/final commits, changed files, build/audit results, staged versus uninterrupted results, captures, blockers, and remaining scope.
- Do not claim browser, visual, audio, haptic, touch, controller, accessibility, or uninterrupted evidence unless it actually ran.
- Do not merge or deploy. Return the branch name and exact commit for review.
```
