# CLAWBYTE development authority — owner-approved reconciliation, 2026-09-11

This HZD-99 Project conversation is the sole development and publishing thread.
This directive supersedes conflicting branch, session-fleet, autonomous-publishing
and historical checkpoint instructions. It does not erase story canon or art approvals.

- Repository: zaferdajani/HZD-99. One integration branch:
  claude/clawbyte-repo-migration-byhyl8. No new development branches without
  a specific instruction in this Project thread.
- main is production; odyssey is a mirror, not a separately edited game/publisher.
  Only .github/workflows/pages.yml may publish Pages, from main. Packages are
  outputs of the same source, not alternative development authorities.
- Pull/read current integration and production refs before work. Preserve local
  modifications. Never reset, clean or force-push to overcome another author's work.
- Other conversations and external agents are reference-only. Do not continue
  independent commits or deployments under an older continuation instruction.
  This document cannot technically stop an external session; its operator must
  confirm it paused and export its uncommitted and ignored media before retirement.
- The six historical feature/staging refs are preservation-only; no new work or
  publishing on them. Their complete reachable history is in the pre-cutover
  backup (Actions run 34580105496, artifact 10191247757, retained 90 days).
- **CORRECTED 2026-09-17: production is NOT blocked, and was never blocked.**
  The paragraph this replaces said it was, and five sessions repeated that to the
  owner while the game shipped normally. What is true: Pages build_type is still
  `legacy`, so the LEGACY BRANCH PUBLISHER serves the site, and it publishes from
  main within minutes of every push. Verified by hashing production against main
  at two separate commits — byte-identical index.html and matching assets both
  times. The art, the fixes, all of it has been live all along.
  What was actually broken was the REPORTING. `.github/workflows/pages.yml` had
  `test "$mode" = workflow || exit 1` as its FIRST step, so 524 consecutive runs
  built nothing, tested nothing, and reported failure — a permanently red
  repository in which a real regression would have been invisible. Fixed the same
  day: verification always runs, publishing is conditional on the setting, and
  when the legacy publisher owns the site the run proves production actually
  caught up (`tools/verify-live-legacy.cjs`). A superseded run is now a no-op
  rather than a failure, because two sessions push minutes apart.
  The HTTP 403 in the old text is also not GitHub refusing administration: it is
  Anthropic's agent proxy refusing the `/repos/:owner/:repo/pages` path outright
  ("Access to this GitHub API path is not permitted through this proxy"), while
  the same token gets 200 on the repository itself. No agent session can read or
  change that setting, so no session should promise to.
  Setting Pages Source to GitHub Actions is still worth doing — it hands
  publishing to the tested, verified path instead of an untested branch build —
  but it is an improvement, not an unblocking. Only the owner can do it.
  Still required before calling any release live: tests, and live BUILD_ID and
  asset hashes checked against the commit.

## Preserved game intent and current sizing

Read docs/STORY_CANON.md, docs/ART_QUEUE.md and the owner's current Project
instructions. CLAWBYTE keeps its robot-cat/sages/corrupted song story, earned
single/dual/joined weapons, authored motion and machine-world sonic identity.
New or rejected artwork/recordings are not approved simply because they exist.

The current smaller-hero instruction from 086f62a is preserved: actor scale
1.335 and world exploration zoom 1.90. They have separate jobs and are each
applied once, not through duplicate body wrappers. Do not silently return to
1.78, widen acceptance thresholds to hide a regression, or change hitboxes to
match a visual experiment without measuring combat and passage consequences.

Superseded in part (owner, 2026-09-18): the WORLD ZOOM is now 1.615 — "you need
to zoom out 15% in game to show more of the screen" — and the actor scale is
1.0, reached by two further cuts on 2026-09-11. The rule the paragraph above
exists to protect is unchanged and still binds: they remain two separate dials,
each applied once, and neither is moved by widening a threshold.

The cleaned hzd_atk2 and hzd_yalla files remain byte-identical to the verified
polish release. They are processed existing recordings, NOT the owner's approved
replacement Yalla performance. Preserve that distinction in every progress report.

## Source integration decisions

The two staging-only commits are merged by ancestry, with their unique export
workflow and follow-up script retained as inert .txt records under
 docs/archive/reconciliation/. The latter targets obsolete assets/audio/vox
paths and must not execute against the current assets/sfx/vox tree. Its useful
held-jump requirement is covered by the single current tutorial controller.
Actor-only animation measurement is already retained in the current tests.

Retain the latest startup media embedding, movement transitions, input buffering,
tutorial progression, audio priority, camera, saves and verified package pipeline.
The duplicate charged-effect wrapper is archived; the canonical Player renderer
still renders charge. Mono's light and marker now run in the NPC world draw pass,
after the frame clear and before the shared camera projection. Near-target fallback
is explicit, not a wrapper of clearP or draw. Shop and boss repairs remain enabled;
removing their filenames indiscriminately would remove working behavior.

## Rollback and evidence

Preserve verified releases a927681 and 086f62a and their stamped manifests. A
rollback uses the exact archived artifact or a normal revert; never erase newer
history or the user's saves. Report tested scope, actual failed gates and missing
physical-device/art approval separately. A successful subset is not AAA/Steam
certification or completion of the owner's full ten-point quality programme.
