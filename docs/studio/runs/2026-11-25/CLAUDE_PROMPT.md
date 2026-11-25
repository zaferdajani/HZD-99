# Claude integration prompt — CLAWBYTE review 2026-11-25

Copy everything inside the block below as one prompt.

```text
Integrate the verified CLAWBYTE studio review without merging or deploying blindly.

Repository: zaferdajani/HZD-99
Production intake: e960189b989850b6f83257179bbba72c9dd9b10a
Integration branch: claude/clawbyte-repo-migration-byhyl8
Integration intake: e960189b989850b6f83257179bbba72c9dd9b10a (merged and aligned with main)
Review branch: codex/studio-review-2026-11-25
Verified bounded source commit: 31cd0a9713d4c533b354dba7c8a802c213c1bd71
Full evidence: docs/studio/runs/2026-11-25/REPORT.md

Work from a clean fetch of main, odyssey, the integration branch and the review branch. The review source commit is a direct child of the pinned merged main/integration head and preserves the boss-duel/VFX, bending-grass and redrawn broken-floor sewer-hatch work. Preserve every newer sewer, MIREJAW, hero, NULLFANG, Alpha, GRAVEHORN and boss-VFX asset. Do not regenerate completed art. Use the review source commit as the bounded source delta; do not replace built pages by hand and do not copy the report commit as gameplay source.

First integrate and revalidate these bounded fixes:
1. Robot-world GB1 returns to B6 instead of bypassing into late B4; hero-world GB1 retains its original B4 cave route. Keep the Carrier-gated B6 hatch.
2. Caption FIFO, localized PURIFY wording/ARIA, atomic quest payment and legacy repair, centralized ferry overlay ownership, Alpha ceremony persistence, coordinate-sensitive tile cache, complete agent/MIREJAW/held-hero cold preload, explicit clean infection authority, and the 30-cell beastStudioRear eye anchors.
3. Audit browser preflight must classify this host's launch/socket denial as BLOCKED, never a product FAIL.
4. AAC completeness must use assets/aac/hashes.json source/output SHA-256 provenance, not checkout mtimes. Do not regenerate the already complete 162 derivatives.

Then address the remaining P1 work in this order, in migration-safe commits:
A. One canonical campaign graph: GRAVEHORN -> NULLFANG -> optional Wolf King -> controlling Eye agent. Alpha is a clean optional covenant after NULLFANG, never auto-offered after forge and never shown with purple infection/purification optics. Update canon-linked script, STORY_SHEET, runtime gates, objectives, dialogue, panels, Continue/load migrations, campaign contract and boss ladder together. Prove both Alpha-skipped and Alpha-completed routes.
B. Sewer causality: either gate MIREJAW discovery behind Rivet or persist pre-discovery and give Rivet adapted dialogue. Prove an ordinary-input Rivet -> MIREJAW -> Rivet round trip. Persist black across the B6 hatch load and ease into GB1 with destination art/audio ready.
C. Give UNDERTOW a distinct water/current-based professional duel rather than TALLYMAN's shared behavior. Every damaging move needs anticipation, visible contact, matching hitbox, sound/haptic ownership and recovery. Keep the merged finite VFX cap and no-body-halo rule.
D. Make boss rewards and Ratchet restoration/gifts versioned, atomic and idempotent. Add failpoints/reload repair for partial legacy states, duplicate callbacks and already-owned rewards. Repair any bossMirejaw && !shellMade && !mjSkin save regardless of the old swSkinGiven flag.
E. Sweep every tile row crossed by vertical motion. Prove player/enemy/boss/sewer-lift/water contact equivalence at 30/60/120 Hz plus a 1/30 spike.
F. Pin one Chapter 2 script/manhwa edition and map Bilge, Silt Mire, MIREJAW, sewer, Rivet, shell and UNDERTOW before generating new pages. Fix the pre-forge marble panel only. Preserve all existing approved hero and completed sewer/MIREJAW art. Produce only missing MIREJAW tail contact/recovery and NULLFANG/GRAVEHORN phase-two body states after source gameplay is ready for them.
G. Finish ferry text reveal, semantic dialog/focus/announcement behavior and persisted 100/125/150/200% text scale in five languages.

Required validation, without weakening tests:
- npm ci
- node build.cjs
- npm run app:pack
- python3 -m unittest tools.studio.test_audit
- all review contracts, including sewer-route-contract and aactier-provenance-contract
- node tests/tails.cjs
- node tools/aactier.cjs --check (must say 162 files and leave Git clean)
- node tests/campaign-contract.cjs and node tests/script-route.cjs, with the obsolete route made to fail
- full CHROMIUM_PATH audit against the exact build
- exact-commit staged captures plus an uninterrupted fresh-save ordinary-input desktop route
- physical phone/touch/controller/audio/haptic and screen-reader/RTL/CJK/200% text checks

Keep staged bot tests separate from uninterrupted playthrough evidence. If browser or hardware remains unavailable, report it BLOCKED and do not certify chapter one, professional art, mobile, accessibility, live deployment or release. Commit further verified changes to a review/integration branch only until every required gate passes; do not merge to main or deploy as part of this handoff.
```
