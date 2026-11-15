# Single Claude integration prompt

```text
You are the senior integrator for zaferdajani/HZD-99. Integrate the verified final TREE from branch codex/studio-review-2026-11-15 into the latest main without deploying production. The reviewed base was bb71fe2e50e3e9d648fe9275da35b66feaecad68. The source/audit pin is 4c0162206068630f7df041f1cfc728270857f37e with tree 1374cd45da3339094ec69cd7a55b1ad20b9eec24. Read docs/studio/runs/2026-11-15/REPORT.md, docs/studio/PIPELINE.md, docs/studio/roles.json, docs/DEVELOPMENT_AUTHORITY.md and docs/STORY_CANON.md before editing.

Important integration rule: integrate the branch's FINAL TREE DIFF versus base, not the meaning of its intermediate connector-transfer commits. The first transfer briefly contained truncated large blobs and was repaired; the final verified tree is correct. Rebase or three-way apply the final diff against the latest main, preserving all newer work. Do not wholesale merge codex/studio-review-2026-11-14 and do not overwrite newer opening, lion, iOS, solid-body, Ratchet or combat work.

Preserve and integrate these verified fixes:
1. Atomic/idempotent quest payment, including the forge and completed-save Purifier recovery.
2. Atomic Ratchet, Servo and generic NPC restoration with rollback and once-only gifts.
3. Gravehorn's legitimate retreat owns the CV3 marble reward; the pillar stays visible/readable before victory but cannot award.
4. Swept terminal-fall collision at low frame rates and exact-coordinate broken-tile cache signatures.
5. Caption visible-three + FIFO queue, Mind Node Back from every phase, fixed D-pad UP/DOWN labels, and the current two-line Ratchet cadence.
6. Fail-closed PRISM boss-window coverage, purple Gravehorn/boss eye authority, finite red ordinary/purple boss eye trails, and purified-Keeper walk selection.
7. Alpha remains an optional forged-blade A2 depth branch and never blocks A2→A3→A4.
8. Canon and all five objective/manhwa languages: NULLFANG is the Meadow Sage and first Sage; GA1D is the Meadow Keeper. Keep internal sage*, sageTame_* and chapter IDs stable for saves/tests.
9. The hardened evidence collector, including transitive browser-helper preflight and explicit noBrowser contracts.

Preserve current-main improvements: the early fight and three-beat opening, motivated Volt Pack, nearby monument, NULLFANG glimpse, 24-frame lion turn/new roar/re-keyed strips, generalized boss recoil/hit feel, solid hostile bodies, metallic Ratchet, hero impatient pose, iOS/AAC packaging, and the NULLFANG ritual's picture/audio fade. Do not regenerate completed NULLFANG or Alpha artwork.

Run these no-browser acceptance contracts after conflict resolution and make every one pass:
python3 tools/studio/test_audit.py
npm ci
npm run build
node tests/run.cjs pack-timeout combat-impact-contract repair-lifecycle quest-payment-contract npc-restore-contract opening-settlement-contract story-opening keeper-identity-contract script-route alpha-optional-contract fallthrough-contract scratch-reach sage-specials tutorial-controller tutorial-clarity memnode-contract bosswindow-contract story-progression input-focus scene-caption-contract gravehorn-eye-contract gravehorn-quarry-contract tile-signature-contract infection-eye-authority-contract sage-walk-contract

Then run the full studio collector against a remote-reachable integration pin. Distinguish source/headless passes, staged browser tests, gameplay-size render checks and uninterrupted ordinary-input playthroughs. Do not call staged saves/teleports an end-to-end playthrough. If Chromium or the device lab is unavailable, mark those lanes BLOCKED, never passed.

Before any production merge/deploy, obtain two fresh ordinary-input chapter-one routes: (A) Alpha skipped and (B) Alpha completed. Each must start from a cleared browser, include a deliberate death and successful Continue, reach the chapter-two teaser, show no page errors, and preserve required panels. Separately test actual phone touch controls (not keyboard in a mobile viewport), physical controller prompts, vibration, 200% text, Arabic RTL, CJK wrapping, GPU and Canvas fallback, and normal/reduced motion. Capture current 960×540 and phone evidence for NULLFANG, Alpha, Gravehorn, eye trails, hit feel, Keeper walking, purification hold cancel/retry, cinematic fade/audio ending and golden/friendly return.

Do not silently implement unresolved owner decisions. Report these as blockers with a concrete recommendation:
- pin one manhwa authority: STORY_CANON says Draft 3 while full-story/edition say Draft 4 and runtime parity is uncertified;
- resolve PRISM: story says never infected, but gameplay performs virus extraction; choose a non-virus stand-down ritual or explicitly make it infected before generating a film;
- approve distinct durable IDs/payoffs and migration for the A7/D2/A11/A13 coin collision;
- approve/produce Gravehorn's missing authored part art using existing pivots and mechanics;
- replace/grade the old grey Ratchet wake film to match metallic Ratchet;
- produce the four missing ritual-quality guardian films only after canon/reference approval; do not regenerate NULLFANG;
- give each later Keeper cave network one kingdom-specific action, one durable visible change and one later callback;
- fix PAUSE/duplicate ownership in the generic overlay queue, define fxgl reduced-motion policy, complete reachable chapter-one localization, and render-check all seven rescued Keepers.

Commit only verified integration work to an integration/review branch. Do not push main, merge a PR, dispatch deployment workflows or deploy Pages/apps. Finish with: exact source SHA/tree, changed-file summary, every command/result, staged-vs-continuous evidence table, blockers, and a production recommendation. A build or source-contract pass alone is not permission to deploy.
```
