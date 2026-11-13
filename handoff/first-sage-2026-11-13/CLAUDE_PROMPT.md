# CLAWBYTE — take over the verified Sage/creature-combat handoff

Repository: https://github.com/zaferdajani/HZD-99
Handoff branch: handoff/claude-sage-combat-20261113
Start here: handoff/first-sage-2026-11-13/README.md
Game-source baseline: 4d487b27cded062fb16fe16750557efa1be73937
Baseline BUILD_ID: 3960cef191f9

I authorize you to handle this scoped implementation handoff. This continues the existing HZD-99 Project work; it does not authorize a second independent publisher or rewriting the accepted game identity. The full files are in GitHub because the chat attachment limit rejected the evidence ZIP. Do not ask me to attach it again.

## Establish the actual state

Fetch current main, odyssey, claude/clawbyte-repo-migration-byhyl8 and the handoff branch. Preserve all existing local changes and newer valid commits. Use a separate worktree when necessary. Never reset --hard, clean away work, force-push, erase history or delete original assets.

Read the handoff README, CLAUDE_PROMPT.md, MANIFEST.json and run verify_package.py from that folder. Inspect files/ for the five exact original deliverables and evidence/ for the entire extracted ZIP, including all screenshots, logs, JSON measurements and the original candidate bundle. This is a complete copy, not pointers to expiring CI artifacts. Do not execute or overlay the archived bundle/scripts automatically.

The handoff branch already contains the full game source inherited from the baseline. The first-Sage update was previously deployed at that source commit; independently verify current production rather than assuming the historical receipt proves today's state. Do not reinstall an old patch or promote this archive branch wholesale. Its new handoff files and packaging workflow are not game updates.

## Read the design and implementation contracts

Read AGENTS.md, CLAUDE.md, docs/DEVELOPMENT_AUTHORITY.md, ART_BIBLE.md and docs/STORY_CANON.md. Then read:
- .claude/skills/creature-motion-combat/SKILL.md
- .claude/skills/creature-motion-combat/references/roster.md
- docs/combat/SAGE.md
- docs/combat/SAGE_MOTION_PASS_2026-11-13.md
- docs/combat/research/creature-motion-skills-2026-11-13.json
- docs/combat/HERO_ANSWERS.md and the current combat/openings/pattern skills.

Use current source to resolve outdated rules. The Meadow Sage in GA1D is the robed biped duelist, NOT NULLFANG the lion. The other chamber Sages currently share that biped design; do not invent animal identities from their titles. The animal guardians have their own motion profiles.

## Work to perform

First independently review the Meadow Sage's actual fight and the supplied 30fps sample. Separate implemented gameplay fixes from remaining animation shortcomings. Preserve its committed attacks, planted redirection, matching ground-ring visual/collision origin, real recovery openings, rescue state, once-only gift and save persistence.

Fix any reproducible remaining defect. Where the approved single-pose artwork still limits natural movement, improve the necessary authored anticipation/contact/turn/recovery sequence using the project's authorized artwork pipeline and exact approved identity. Do not describe scaling, bobbing or holding a single pose as newly authored multi-frame limb animation. Reject identity drift, sliding feet, a rigid translated portrait, instant mid-attack flipping or mismatched visual/hit reach.

Once the first Sage passes its dedicated review, continue to the next actual animal guardian in the roster, starting with NULLFANG's lion movement and attacks. Handle one bounded, tested creature pass at a time. Use each creature's anatomy and mechanical design: feline crouch/pounce/landing, canine gait/braking/bite, avian wings/dive/brake, dragon ground support/neck/wings, equine support/hover, rhino mass/horn/charge, and the core/constructs' own mechanisms. Never apply one generic bounce or attack cycle to all of them.

The target is responsive, readable, physically credible fighting with anticipation, contact, follow-through, hit-versus-miss outcomes and recognizable attack openings—not raw health inflation, random attacks or shorter unreadable warnings. Preserve the existing hero walk/run assets, gait timing, responsive input, approved audio including Yalla, story/weapon progression and the preceding boss-motion improvements unless a measured regression requires a documented change.

## Validate and deliver

Record baseline commit, BUILD_ID, relevant asset hashes and reproducible before-captures. Use locked dependencies. Rebuild with the existing project tools. Run the Sage motion, Sage purification/network/route tests; combat-impact checks; boss-motion; artbible; hero gait/frames; wrist-release; and the current production workflow's required checks. Follow the README's commands as starting points, not permission to omit newer tests.

Test both approach directions, actual attack ranges, walls/ledges, interruptions, airborne/grounded transitions, missed attacks, recovery safety, loading, low-resolution assets, saves/reloads, keyboard/touch/controller paths and repeated draws. Inspect rendered sequences at actual game size and normal speed. A passing subset is not full campaign or physical-controller certification. Add regression tests that fail on the old defect. Never weaken thresholds merely to make tests green.

Use the existing integration branch for reviewed runtime changes. Do not create additional release publishers. Before promoting, compare current remote refs, preserve concurrent work and retain a rollback reference. Publish only tested runtime changes through the existing production route; do not merge the large handoff archive or its packaging workflow into main simply to obtain the code already present there. If publishing is unavailable, report the exact access/error boundary and leave a tested, clearly identified candidate.

After any deployment, fetch the public page, BUILD_ID and DEPLOY_COMMIT/release.json where available, compare relevant source and asset hashes to the intended artifact, and run live gameplay checks. If release.json is absent, state that and prove identity by exact served-page/asset comparisons. A push or green workflow alone does not establish that the new game is live.

Finish with actual implemented changes, exact commit/branch and build identity, measured test results, normal-speed gameplay footage, live verification or its precise gap, and explicitly unfinished work. Continue through implementation and verification rather than returning only a plan. Do not claim work is running after the session ends.
