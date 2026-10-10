# CLAWBYTE senior studio review pipeline

Owner-authorized 2026-10-10. This pipeline audits direction and player experience,
prepares verified improvements on a review branch, and hands one integration prompt
to Claude. It never equates automated success with professional art quality.

## Team

`roles.json` contains all 15 roles from the supplied recruitment image, promoted
to senior responsibility; `roles/*.md` are reusable agent mandates. Mission Designer
owns individual quests; Senior Mission Designer owns campaign continuity. Cinematic
Designer owns playable triggers; Cinematic Director owns visual storytelling.
The Senior Mission Producer coordinates and signs the consolidated report.

Instantiate the roles for every review. With limited worker slots, group related
roles into design, art and engineering agents, but record a separate verdict for
every role. Agents are review responsibilities, not claims of human credentials.
Read-only reviews run in parallel. Assign disjoint files before any edits.

## Frequency and scope

Run a daily review while active development continues, and manually after major
story/art merges. Pin main and the integration branch at the start. Compare the
previous report; carry unresolved issues forward without duplicate generation.
Use a new `codex/studio-review-YYYY-MM-DD` branch (suffix if it already exists).
The owner's request expressly authorizes these review branches. Do not merge or
deploy them automatically; Claude integrates using the generated handoff.

## Stages

1. **Intake:** read repository authority, story canon, current art/panel ledgers,
   latest owner corrections and prior report. Record commit, source tree, dirty
   files, environment and main/integration divergence. Preserve all other work.
2. **Evidence:** install locked dependencies; prepare browser, build and packages.
   Confirm localhost serves this checkout by byte/hash comparison before testing.
   Run `CHROMIUM_PATH=/path/to/chromium python tools/studio/audit.py --profile full
   --output docs/studio/runs/YYYY-MM-DD/automated`. Use `--profile focus` for
   intermediate checks only. Missing tools, timeout, missing tests and unknown test
   names are failures/blocked evidence, never passes. Save all logs and hashes.
3. **Player journey:** fresh save, ordinary input, wake through chapter-two teaser.
   Record objective changes, deaths, confusion, pickups, pod, repair, forge, Sage,
   CHIME, lion and every cave. No injected inventory/flags/teleports in the campaign
   evidence. Staged tests are useful separately. Exercise keyboard and phone touch.
4. **Studio review:** all roles inspect relevant source and actual frames/footage.
   Compare hero/pack/Alpha at gameplay scale; inspect all pose states, grounded feet,
   eye anchors and fade, rescue, text pacing, panel identity and sound/haptic cues.
   Every cave needs an outcome; ordinary exit IDs do not establish a payoff.
5. **Fix:** prioritize P0 crashes/data loss, P1 progression/identity blockers, P2
   clarity/quality, P3 maintenance. GPT fixes reproducible bounded defects and art
   presentation where supported; record before/after. Use approved assets first.
   New raster artwork must use an image tool; archive provenance and keep generated
   candidates distinct from integrated assets. A single image is not an animation.
6. **Validate:** rebuild after source edits; rerun impacted checks then full suite
   before integration. Do not weaken assertions. Label physical-device, audio,
   visual and complete-playthrough gaps explicitly. Verify representative live
   assets plus BUILD_ID if making a deployment claim; source presence is insufficient.
7. **Deliver:** push only the review branch, read back changed-file hashes, write
   REPORT.md and CLAUDE_PROMPT.md in the run directory. Include commit URLs, role
   verdicts, findings, fixes, test scope, missing art, exact acceptance criteria and
   one copyable prompt. Never send Claude a message automatically.

## Mandatory report schema

- Date, base SHA, review branch, source/built/live versions, evidence scope.
- Fifteen role verdicts: pass / issues / blocked / not assessed, with evidence.
- Findings: stable ID, severity, player consequence, reproduction, evidence type,
  paths, owner, fix, acceptance condition, current status.
- Separate implemented, tested, visually inspected, integrated and deployed.
- Cave census; manhwa parity matrix; animation/VFX matrix; performance/device gaps.
- Before/after patch list and exact commands with logs and exit status.
- One Claude prompt scoped to integrating this branch and remaining priorities.

## Release gates

Do not certify chapter one while normal-input continuous traversal is absent.
Do not certify artwork while Alpha/pack identity or required panel parity is open.
Do not certify mobile from viewport emulation alone. Do not certify all effects
from a rest-pose roster screenshot. Tests must fail closed and target the same build.
If a gate cannot run, publish the honest audit and branch, not a fabricated pass.
