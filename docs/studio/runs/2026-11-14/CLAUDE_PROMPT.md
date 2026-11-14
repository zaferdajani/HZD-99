# Single Claude integration prompt — 2026-11-14

You are integrating the CLAWBYTE senior studio review for `zaferdajani/HZD-99`.
Work from current `main` only if it is `73f7705cb53a68a483618c54a30513932d616e02`
or a descendant you have first compared. Fetch `codex/studio-review-2026-11-14`.
The reviewed source commit is `6f7e84a43dd0d5443dee00cd0f9d7f6a4c1ad41e`
with tree `d9ba467d507fe432f56d6c30e90293cf170fc81f`. Read
`docs/studio/runs/2026-11-14/REPORT.md` and
`docs/studio/runs/2026-11-14/automated/results.json` before changing anything.

Integrate the reviewed source diff `73f7705..6f7e84a` selectively. Do not merge an
older review branch wholesale. Preserve all current-main work: the new 24-frame
NULLFANG idle, 18-frame filmed turn, expanded action strips, `boss-motion.js`,
`fxgl.js`, `sage-motion.js`, Sage-specific blue rescued walk, Ratchet wrist-release
scene, current hit feedback, workflow protections and every completed asset. Do not
regenerate or replace existing raster/audio/video assets. Do not copy generated
HTML or prior evidence; regenerate the four pages once after source integration.

The integrated behavior must retain all reviewed fixes and their exact tests:

1. swept downward collision across every crossed row while preserving deliberate
   NULLFANG `thruPlat` descent;
2. coordinate-sensitive broken-tile room-bake signatures;
3. atomic quest rewards and Purifier forge with failed-write rollback, replay
   idempotence and legacy completed-without-sword recovery;
4. CV3 marble visible but unrewarded until legitimate `bossHorn` retreat;
5. generic NPC restore plus the actual scripted Ratchet/Servo callbacks settling
   cell, powered state, repaired/intro/pending state once; Ratchet explanation,
   forge quest and spare cell must also settle once, and a skipped/unavailable
   wrist reaction must be retired before explanation so it cannot play afterward;
6. moving rescued Sage uses the new Sage-specific purified blue walk and kneels
   only at rest—resolve conflicts in favor of current `sage-motion.js`, not the old
   generic walker expectation;
7. Gravehorn eye core and finite trail both boss-purple; ordinary infected eyes
   remain red, bosses/guardians/Alpha/Sage purple, with lifetime/caps/cure/room/
   teleport cleanup intact;
8. caption FIFO preserves unread lines and reset clears visible plus queued text;
9. Alpha remains an optional forged-blade A2 depth branch, never the required road;
10. controller UP/DOWN show fixed D-pad labels and Mind Node Back exits every phase
    without payment/progress mutation;
11. PRISM boss-window checks fail on missing actors, exceptions, missing named moves
    or collapsed attack pairs;
12. collector preflight, source/served pins, blocked classification and raw-log
    integrity remain fail-closed.

Run at minimum: `npm ci`, `npm ls --depth=0`, `npm run build`, all no-browser
contracts named in the report, `python3 -m unittest tools.studio.test_audit`, package,
then the full collector. Use a host where Chromium can actually create a page. Do
not report browser-blocked checks as passes. Keep staged boss/Lion/Sage/Ratchet
checks separate from two uninterrupted ordinary-keyboard campaign runs from a
cleared browser: one skips Alpha and one completes Alpha; both must reach the
chapter-two teaser, include a deliberate death plus Continue/save recovery, and
must not inject rooms, flags, inventory or teleports. Add physical touch/controller,
RTL/200% text, reduced-motion, mute, GPU and Canvas-fallback passes. Preserve logs,
video, screenshots, hashes and exact source/built/live identity.

Do not invent the unresolved story. Stop and request owner decisions for: (a) Draft
3 versus Draft 4 and stale pages p20–p26, (b) whether PRISM is infected/purified,
(c) distinct identities/payoffs plus conservative migration for A7, D2, A11 and
A13 currently sharing `coin`/`sr_coin`, and (d) one specific local action, durable
consequence and later callback for each repeated GB1/GC1/GD1/GX1/GE1 cave network.
Also define and test bounded overlay ownership and a reduced-motion policy for
`fxgl.js`; do not claim them solved from source inspection alone.

Before any production action, produce a reconciliation table listing every changed
path, conflicts and resolutions; prove all exact contracts pass; obtain gameplay-
size owner review of NULLFANG and current captures of Ratchet, Sage, Gravehorn and
eye trails. Then report the final commit/tree, commands, results and remaining
blocked scope. Push only the authorized integration branch. Do not merge `main`,
update `odyssey`, deploy Pages or alter production until all P1 acceptance lanes are
unblocked and explicitly approved.
