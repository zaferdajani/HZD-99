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
- Production promotion is BLOCKED while Pages settings build_type is legacy.
  The available connection was refused administration for changing it (HTTP 403),
  and the generated publisher cannot be disabled via Actions (HTTP 422). Do not
  bypass that boundary or trigger a race. The owner must set Pages Source to
  GitHub Actions. Verify that setting, absence of competing jobs, tests, live
  DEPLOY_COMMIT/BUILD_ID and asset hashes before describing a release as live.

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
