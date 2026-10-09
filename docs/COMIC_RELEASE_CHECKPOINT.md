# Comic reward release checkpoint — 2026-09-27

## Current software release candidate

Build: `2b8e8e34dcc7`. All 15 gameplay harnesses required by pages.yml passed
on this rebuilt version, as did reconciliation, build integrity and manifest
validation. Native web assets were repacked (811 assets, 242.7 MB); no APK/EXE
installation or physical-device certification is claimed.

Fixed the actual survivor-dialogue greeting order and improved the next-kingdom
light so its dim phases remain visible. Updated battery, legacy encounter and
charged-weapon test fixtures to respect the revised story. Corrected boss
telegraph classification, startup request-order measurement, and visual probes
that mixed changing frames or sampled an actor instead of the scenery. Kept
the existing acceptance thresholds; added control-frame and light-cycle checks.

The eight originally identified failing harnesses have passing reruns. An
additional 49-harness run completed, with four failures then corrected and
individually rerun successfully: shopread, boot, demo and crystal. This is not a
claim that the entire historical suite was rerun in one clean invocation.
Current logs are in the parent workspace under work/: blockers.log (initial
mixed result), story-regressions.log, bosspace-fixed.log, remaining-suite.log
(initial four failures), followup-fixes.log, visual-fixes.log (shop passes),
demo-final.log, final-story-check.log, release-final.log, and
release-reconciliation.log.

The seven unfinished comic episodes now correctly have `draft` status. They
are excluded from automatic rewards until the owner publishes corrected
chapters using docs/COMIC_REWARDS.md. The 32-page draft reader remains available
for review. Playback/update/offline tests use an explicitly published test
edition and also check draft exclusion and the actual embedded offline edition.
No new artwork was generated. See COMIC_PARITY_AUDIT.md for all 32 page gaps.

Expected file hashes after publishing:

- index.html: `b460364a0c12a4301de865374d505cfcb45e901996a81636cd480cfc319a64a9`
- odyssey.html: `0b548d8090e76e88500d46bee57d31d5258f39fd48869a5cd1b756e0881fe934`
- assets/manhua/chapters.json: `47a49d4225a5db7548d9514d7d9d6a834a8586cc031d2bf392b10b5020992ddc`

Publication and live verification remain separate from these local passes.

### Integrator verification of 47240d4 — 2026-09-27

- Clean rebuild reproduces all four committed pages byte for byte.
- Full suite on Linux (tests/run.cjs): **all 133 harnesses ran**, none failed.
- Publication did NOT happen. pages.yml detected the legacy branch publisher,
  skipped its own deploy, and waited for that publisher to ship 47240d4 — but
  GitHub never queued a `pages build and deployment` run for this push (every
  earlier push to main got one; last was 44425e9). Production stayed on the
  44425e9 page, so the job failed at "Confirm the legacy publisher shipped this
  commit" after 20 polls. This commit is pushed to main to queue that build.
- Published tree is 884 MB of the 1 GB Pages limit (808 MB at 44425e9); the
  revised manhwa pages added about 76 MB. The next few chapters will not fit
  unless images move to a lighter tier or out of the published branch.

### Integrator verification of 2779339 — 2026-10-09

- The roster's filmed strides (ART_QUEUE §2cc-iii…vii) on top of a9cca18.
- Full suite in an isolated namespace: every harness green except `wolves` and
  `seam`, the two that measure the Alpha den's place on the meadow route — an
  owner decision, unchanged from a9cca18 and not weakened.
- pages.yml's own build, rebuild check and release-blocking gameplay checks
  passed; it then waited on the legacy publisher, and GitHub again never queued
  a `pages build and deployment` run for the push (the last one was a9cca18).
  This note is pushed to main to queue that build, as on 2026-09-27.
- Published tree: 914 MB of the 1 GB Pages limit (912 MB at a9cca18;
  `assets/source/` alone is 609 MB). The headroom is now about 110 MB.

## Earlier checkpoint (superseded by the candidate above)

User pushed integration commit 2eedaf8 successfully. Production main and odyssey were still at 44425e967b51870591d96b0967342b0cf177337c when checked this turn. No production publication is claimed here.

Rebuilt all four HTML outputs from LF-normalized source bytes, correcting their build fingerprint to db3028ecbf45. The committed source was LF but the original Windows build had hashed CRLF bytes, which would have failed the deployment workflow's clean rebuild comparison.

Fixed tests/run.cjs local server recovery: no Unix sleep or npx shell dependency; uses the bundled Node server, waits for readiness, and bypasses proxies for localhost. The server supports media byte ranges and only binds loopback.

Passed against the rebuilt game:

- Build integrity and reconciliation.
- Ten targeted harnesses: story-opening, comic-rewards, story-battery, story-rescue, story-meeting, first-sage-route, winch-integration, chapter-one, tutorial-clarity, gait.
- Thirteen additional deployment harnesses: entrance-integration, hero-cache-regression, voice-handoff, scratch-reach, scratch-visual, release-polish, tutorial-controller, offline-release, input-focus, frames, feel, wake, speed2.
- These runs cover all 15 gameplay harnesses named by pages.yml; no test assertions were relaxed for these passes.

The prior broad suite was not green. It included failures in tutor, tap, bosspace, meet, tails, kingdom, battery, and hzdvox before a timeout/server-restart failure stopped execution. Tutorial-clarity and gait subsequently passed. Some historical tests expect superseded story behavior (starting battery, forced encounter damage); others require further investigation. Do not describe the whole suite as passing.

The reward system uses seven episodes and 29 existing draft illustrations. It does not constitute newly illustrated final chapters or full comic/game action parity. See docs/COMIC_REWARDS.md and docs/story-draft2/GAME_ART_PARITY.md. Complete remaining story/art corrections and investigate outstanding broad-suite failures before claiming the full requested release is finished.

Local logs in the parent workspace: work/release-followup.log, work/predeploy-followup.log, work/reconciliation-followup.log, and work/full-suite.log.
