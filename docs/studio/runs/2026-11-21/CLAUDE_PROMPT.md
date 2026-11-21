# Copy this entire prompt to Claude

Work in `zaferdajani/HZD-99` as the integration engineer for the November 21 senior studio review.

Start by fetching current `main`, `odyssey`, `claude/clawbyte-repo-migration-byhyl8` and `codex/studio-review-2026-11-21`. Read `AGENTS.md`, `docs/DEVELOPMENT_AUTHORITY.md`, `CLAUDE.md`, `docs/STORY_CANON.md`, `docs/studio/PIPELINE.md`, `docs/studio/roles.json`, and `docs/studio/runs/2026-11-21/REPORT.md`. Preserve all commits already on `main`, especially the new NULLFANG dash/glimpse/return, Alpha audio/bow/pack reward, fight seals, TALLYMAN hit bodies, rescued-agent walk selection, city gate, marble route arrow, Pack gift, lives/map/reward changes and CARRIER → UNDERTOW → TALONHOST road. Do not regenerate completed hero, seven-agent, Alpha, wolf, gate, TALLYMAN or first-stage NULLFANG artwork.

Integrate the review branch’s bounded fixes without copying generated HTML by hand; merge/cherry-pick source/assets and rebuild all four pages. The required review commits are:

1. `8d2200d` — caption FIFO; five-language PURIFY/PURIFIED + localized ARIA; explicit infection-eye authority; atomic quest/forge settlement and migration; coordinate-sensitive terrain bake signatures; audit browser preflight; six contracts.
2. `3734ee2` — generated pages; rebuild rather than hand-resolving if main moved.
3. `0ca7b94` — exponential endings for seven hot one-shots; all 55 missing AAC derivatives/index for the new Alpha/material banks.
4. `b60801c` — current city-gate byte metadata and TALLYMAN high/low first-hit preload keys/contract.

After those are integrated, implement the remaining P1 story/state correction as one coordinated graph, not isolated text edits:

- owner canon is `GRAVEHORN raw marble → Ratchet forges Purifier → NULLFANG first corrupted guardian is purified → optional clean Alpha territorial covenant → pack-controlling Eye agent reveal`;
- Alpha must not be infected, purple-eyed, purified, released or gated merely by owning the blade; offer it only after NULLFANG, keep it optional, resolve by yield/bow/covenant, grant pack allegiance once, and persist `alphaBowed` through a true save/page reload;
- rename visible “Meadow Sage/Sage” authority to TALLYMAN / Eye’s agent everywhere; internal legacy flag names may remain behind an explicit compatibility boundary;
- reconcile `STORY_CANON.md`, `STORY_SHEET.md`, `tests/story-sheet.json`, story script, goals, dialogue, gates, panels, map reward, save migration and route tests together;
- reconcile the owner-approved one-step Volt Pack gift with canon/sheet/machine JSON/script/comments; remove obsolete 12-scrap purchase/retracing authority without reintroducing extra dialogue;
- rewrite the campaign certificate only after runtime changes. It must assert both ordinary-input routes: skip Alpha and complete Alpha, including death/Continue at every gate.

Then implement these bounded engineering fixes:

- make Ratchet/Servo restoration one clone-and-publish idempotent transaction with injected persistence-failure, reload and replay tests;
- sweep every vertically crossed tile row in `moveEnt`; prove identical landings at 30/60/120 Hz and no regression to one-way platforms/NULLFANG pounces;
- latch the NULLFANG glimpse when the player reaches the trigger so cold decode cannot make it disappear;
- persist/reconstruct `PN.due` so an owed doorway panel plays once after save/reload;
- centralize or explicitly prioritize/coalesce full-screen overlay ownership;
- add concise localized semantic alternatives for dialogue images and a persisted 100/125/150/200% text scale.

Artwork is a separate approval gate. Do not fake completion with recolors or one still. Prepare exact Higgsfield briefs and integrate only approved outputs for:

- NULLFANG phase-two plates derived from his approved first-stage identity;
- GRAVEHORN opened-plate/molten/vented phase-two set;
- one dedicated pack-wolf ceremonial bow strip (keep the existing motion library);
- a bounded correction of `r_marble.webp` removing the premature sword/hilt silhouette while preserving hero, environment and composition.

Do not regenerate anything else. Pin one manhwa edition and certify every runtime panel for character identity, equipment already earned, action, room, spoiler timing and gameplay-size crop.

Validation is mandatory and fail-closed:

```sh
npm ci
python3 tools/studio/test_audit.py
node tests/scene-caption-contract.cjs
node tests/purification-language-contract.cjs
node tests/infection-eye-authority-contract.cjs
node tests/quest-payment-contract.cjs
node tests/tile-signature-contract.cjs
node tests/roomasset-manifest-contract.cjs
node tests/tails.cjs
node tools/aactier.cjs --check
npm run build
npm run app:pack
CHROMIUM_PATH=<working Chromium> python3 tools/studio/audit.py --profile full --output docs/studio/runs/<date>/automated
```

Run a browser-capable uninterrupted ordinary-input playthrough from wake through the chapter-two road without injected flags, inventory, room changes or teleports. Record objective/arrow/gate changes, Alpha-skip and Alpha-complete routes, deaths/Continue, the raw-marble/forge boundary, NULLFANG ritual, Alpha covenant and CARRIER → UNDERTOW → TALONHOST. Separately run staged combat tests. Test keyboard, controller and physical phone touch; listen to Alpha/hit/purification cues over music; verify vibration/haptics; check Arabic RTL, CJK, 200% text, reduced motion and screen reader output.

Report source/headless, staged-browser, uninterrupted-playthrough, physical-device and perceptual evidence separately. Do not call blocked evidence a pass. Rebuild generated pages; never hand-merge them. Push the integration branch for review, but do not merge to `main`, mirror to `odyssey` or deploy production unless explicitly instructed in that session.
