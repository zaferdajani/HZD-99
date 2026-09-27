# Comic reward release checkpoint — 2026-09-27

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
