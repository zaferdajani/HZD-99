# Combat implementation validation

Final runtime build: **28c9dd55fec4**. Combat data version: **2026-10-16.1**.

## Final-build checks

All 11 checks below passed. Logs are in `final-checks/`; the final rerun of `combat-impact-browser` supersedes its earlier timeout caused by the harness allowing the frame loop to clear a keyboard edge before its staged update. The production keyboard behavior was not bypassed: the final harness sends KeyL through Playwright and calls the actual Gear update with the frame clock paused.

| Check | Evidence |
|---|---|
| Production damage/armor and protection contract | combat-impact-contract.log |
| Actual silhouette flash, expiry, particle cap/lifetime, special stats and keyboard log export | combat-impact-browser.log; ../visual/result.json |
| Real-time keyboard tap and held/released charge, contact audio, damage and knockback | combat-impact-input.log; ../input/result.json |
| Tutorial winch normal strikes, scrap and charged opening | winch-purpose.log |
| Guard/counterattack | guard.log |
| Directional shield and armor | shield.log |
| All attack formulas, knockback and multi-hit timing | attacks.log |
| Equipment state and input geometry | gear.log |
| Earned weapons and charged controls | weapons.log |
| Finite infection eye effects | infection-eyes.log |
| Full infection roster | infection-roster.log |

The final build was served separately on localhost:8222 so the earlier broad run retained its pinned bytes. `final-checks/build.json` records all four page hashes. Harness source was unchanged except the localhost port. A subsequent ordinary `node build.cjs` produced the same final build, and the source/documentation whitespace check passed (raw test logs are preserved byte-for-byte).

### Measured impact results

`visual/result.json`: normal raw/actual loss 12, charged 38, normal hardware 5, charged hardware 14, charged pause 0.12 seconds, hero recoil -90, hardware cap 80 and remaining hardware after 0.7 simulated seconds 0. White silhouette pixels increased from 20 to 1,798 during impact and fell to 140 after expiry; the total opaque area remained a character silhouette, not a filled rectangle. Protected targets lost no health.

`input/result.json` separately proves actual keyboard tapping and holding/releasing through the normal real-time loop. It uses a staged arena and inert target; it is not a campaign traversal. Sound dispatch was verified, not a subjective listening/mixing review. No physical phone, native haptic device or gamepad was certified.

### Broad regression attempt

Pinned earlier build: **ea051c2c83ca**. `full/results.json` contains 124 completed checks: 122 passed (including the build), 2 failed. This represents 123 completed harnesses, 121 passing. The broad run was interrupted during `infection-poses`; remaining checks, including `campaign-ch1`, were not completed. This is **not a full-suite pass** and **not an uninterrupted playthrough**.

The failures were:

1. `winch-purpose`: the first protection implementation rejected the calm tutorial machine. Fixed by exempting the tutorial winch from the calm-actor guard. The final-build winch harness passes, and the source contract covers this exception.
2. `survey-a7`: standing beside Ratchet did not select him for interaction, so the side errand was not offered through that staged input route. Reproduced on the pre-combat worktree (`baseline-survey.log`); the earlier worktree failed 10 assertions and the combat broad build failed 8. Reading/payout logic had passing direct-path cases. This evidence does not prove whether the underlying issue is staging geometry, interaction geometry or both. Do not label it fixed, dismiss it as merely a test problem, or deploy on the assumption it is harmless.

The earlier `focused/` and `confirmed/` logs retain discovery failures rather than concealing them. Directional shield expectations now explicitly account for new 12% armor (20 raw becomes 18), and the counter test still requires exactly 36 raw and exactly 32 resolved HP. Assertions were updated for the intended formula, not relaxed to broad ranges.

## Artwork and PDF

37 cards captured from the final assembled game; 0 missing media images and no capture page errors. All 12 PDF pages were rendered and visually inspected; after the final Gear-only runtime change the PDF was regenerated with the final build ID and text/page-count checked. Existing artwork was reused, including current procedural/fallback appearances; this work does not claim to replace all enemy art.

## Publishing scope

The implementation, generated game pages, PDF and evidence are prepared for the authorized integration branch `claude/clawbyte-repo-migration-byhyl8`. The integration commit preserves both its previous head and the October 16 studio-review head as parents. The review's prior source/reel safeguards remain present. No production merge, Pages deployment or live-build verification is claimed. Resolve the Ratchet interaction failure and run the remaining release gates before promotion to main.
