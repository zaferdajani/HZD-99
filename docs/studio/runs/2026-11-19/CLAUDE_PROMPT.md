# Claude integration prompt — CLAWBYTE 2026-11-19 studio review

You are integrating the senior studio review for `zaferdajani/HZD-99`. Work on a fresh branch from the newest remote `main`. Do not merge or deploy production until every gate below is met.

First read, in order:

1. `docs/studio/runs/2026-11-19/REPORT.md`
2. `docs/studio/runs/2026-11-19/automated/AUTOMATED.md`
3. `docs/STORY_CANON.md`, `docs/STORY_SHEET.md`, `manhua/full-story.md`, `manhua/edition.json`
4. `docs/studio/PIPELINE.md` and `docs/studio/roles.json`

Review branch: `codex/studio-review-2026-11-19`.
Reviewed main: `2e7fd90d67ff66e2876e0163abce6eaec2d411da`.
Locally verified review commit: `277cca2c7ec204ba86980631b1536c4d998b4081`.

Integrate semantically, not by overwriting newer work. Prefer cherry-picking the two review commits if ancestry permits. If it does not, apply `0001-studio-restore-review-safety-contracts-on-latest-mai.patch` and `0002-build-regenerate-review-pages.patch` against the newest `main`, resolve by meaning, then rebuild all four tracked pages. Preserve all newer phone rotation, media-container, defringed art, TALLYMAN rig/painted stand, projectile collision, hero, seven agents, Alpha/wolf, GRAVEHORN, manhwa and NULLFANG ritual work.

The bounded review changes that must survive integration are:

- three visible scene captions plus FIFO waiting queue; read/shown/reset cover both lanes;
- five-language PURIFY/PURIFIED visible copy and accessible label; no Free/Release wording;
- clean PRISM excluded from virus ritual eligibility;
- atomic clone-and-publish quest/forge settlement with rollback, idempotent presentation and conservative `ratchet_forge done && no Purifier` migration;
- explicit infection authority: ordinary infected enemies red, actually infected guardians purple, clean Alpha/GRAVEHORN/PRISM/Eye instruments no virus trail;
- browser audit preflight for direct/transitive Playwright, Chromium executable and AF_UNIX restrictions while retaining runner-budget, exit-status and descendant-cleanup tests;
- all four contract files registered in `tests/run.cjs`.

After that, implement the remaining P1s in this order:

1. **One campaign graph everywhere.** The approved authority is GRAVEHORN/raw marble → Ratchet forges Purifier → NULLFANG is purified → optional Wolf King/Alpha branch → pack-controlling Eye agent consequence. Replace the obsolete forge → first agent/Sage → CHIME → NULLFANG certification in objectives, progress gates, rooms, dialogue, panels, map reward, story docs, saves/migrations and tests. Do not make Alpha required for chapter completion.
2. **Alpha is a clean Wolf King.** Offer the side quest only after NULLFANG. End it in a dedicated living yield/covenant, never guardian extraction, `purified`, Free/Release copy or guardian film. Pack becomes friendly/cyan; cache/reward settles once; completing the branch reveals the controlling agent. Define a discoverable non-blocking lead when Alpha is skipped.
3. **Atomic NPC restoration.** Ratchet, Servo and generic restore must clone one save and publish once: cell removal, awake/repaired flags, quest, spare gift and continuation. Inject failure at every former persistence boundary; nothing changes on failure; retry/reload cannot lose a cell or duplicate a gift.
4. **All seven agents move correctly.** Keep the current TALLYMAN mixed rig/plate system. Give the other six their own authored pure-graded walk/rig path. A kneeling/pure plate is legal only while stationary. Verify infected combat, purification, idle, walk, turn, room reload and save reload for every identity at gameplay size.
5. **World collision integrity.** Sweep every crossed vertical tile row and resolve the first valid solid/one-way floor at 30/60/120 Hz while preserving intentional drop-through. Sign sorted broken-tile coordinates, not only their count.
6. **PRISM stand-down.** PRISM is clean under current canon; implement a non-virus consent/stand-down resolution with no extraction and no `purified` flag.
7. **Pin manhwa authority.** Obtain/record owner choice of Draft 3 or Draft 4. Then certify every scene for identity, equipment timing, action, room, trigger, spoiler level, source panel and current runtime capture. Keep the 18 November refires. Do not regenerate the whole sequence; if owner rejects `ch2_b`, make only the bounded UNDERTOW identity correction.
8. **Caves and quests.** Correct CV1B documentation to the implemented one-ring survey/cache. Give GB1/GC1/GD1/GX1/GE1 a kingdom-specific verb, payoff, persistent transformation and later callback. Give A7/D2/A11/A13 unique durable placement IDs and migrate conservatively. Add visible persistent consequences to number-only errands.
9. **Bounded art correction only.** Preserve existing completed assets. Re-author only the cheetah's inconsistent coil/lunge family from one locked rest-model reference, palette, scale and lighting. Inspect all defringed bodies in the darkest actual rooms for cyan, white and neutral baked halos.
10. **UI/accessibility.** Centralize full-screen overlay ownership and focus return; finish critical-path localization in all five languages; add persisted 100/125/150/200% text scale with repagination; provide semantic controls/live announcements for critical canvas UI; make saved reduced motion authoritative across VFX, camera, cinematic and repair paths.
11. **Combat evidence/ledger.** Keep runtime impact values (110/140/170 ms flash, 10/15/22 fragments) and long-projectile collision. Add an explicit blade-tip swat assertion if absent. Regenerate character cards/stat ledger from exact runtime and contract-check PDF/ledger values against HP, attack, defense, speed and impact constants.

Validation is mandatory and must fail closed:

- Run `npm ci`, `npm run build`, `npm run app:pack`, syntax/diff checks, the four safety contracts and `python3 tools/studio/test_audit.py`.
- Run the full audit from a host where a browser page actually opens. Do not call browser checks passed when Chromium is missing or AF_UNIX is denied.
- Run two fresh uninterrupted ordinary-input routes from empty storage through the chapter-two teaser: Alpha skipped and Alpha accepted/completed. No injected flags, inventory, room teleport or staged boss health. Include death/Continue and reload at every mission gate.
- Separately label staged tests that inject saves, rooms, phases, HP, positions or synthetic input.
- Record gameplay-size video for all seven agents, GRAVEHORN, NULLFANG, Alpha/wolves, red/purple eye trails and purification. Verify no kneeling slide, foot drift, scale pop, clean-body smoke, infinite trail or abrupt film/music ending.
- Test real keyboard, controller, iOS/Android touch/rotation, speaker/headphones, haptics, reduced motion, Arabic RTL, Chinese wrapping, screen reader and 200% text. Record OS, device, browser/shell, input and exact commit.
- Prove build/served identity before and after tests.

Do not create replacement art for assets already completed. Do not merge or deploy. Push only your integration branch and return: commit SHA, changed-file list, exact test counts/log paths, two route traces, device evidence, remaining blockers and a short production recommendation.

