# CLAWBYTE Senior Studio Review — 2026-11-14

## Release decision

**HOLD — do not merge or deploy production.** The review candidate preserves the
new NULLFANG, First Sage, Ratchet and hit-feedback work on `main`, selectively
restores the verified November 13 protections that production did not inherit,
and fixes the real Ratchet/Servo opening callbacks. Build, packaging, 45
headless/source checks and raw-log integrity pass. Chromium cannot create its
required Unix socket on this host, so current rendering, ordinary-input routes,
audio, haptics, physical devices and sustained performance remain uncertified.

| Boundary | Result |
|---|---|
| Review date | 2026-11-14 UTC |
| Production `main` / `odyssey` / authorized integration | `73f7705cb53a68a483618c54a30513932d616e02`, unchanged |
| Previous review | `codex/studio-review-2026-11-13`; source `24493542230e7738267e3d4bb1639b841ace037d` |
| Previous review ancestry | Neither previous source nor report is an ancestor of current `main` |
| Exact audited source | `6f7e84a43dd0d5443dee00cd0f9d7f6a4c1ad41e`; tree `d9ba467d507fe432f56d6c30e90293cf170fc81f` |
| Review branch | `codex/studio-review-2026-11-14` |
| Built version | Four pages built: 4.78 / 3.55 / 4.80 / 3.57 MB |
| Package | PASS: 702 assets (245.3 MB) + two pages (8.3 MB), 253.6 MB total |
| Live version | `73f7705...` was the published pin in workflow run 43524929089; this review did not deploy or revalidate live identity |
| Automated evidence | 216 records: **45 pass, 171 blocked, 0 executed failures/timeouts** |
| Raw-log integrity | PASS: 214/214 retained logs match closed-file snapshots |
| Staged browser checks | BLOCKED before page creation: `socket() failed: Operation not permitted` |
| Uninterrupted campaign | NOT RUN; browser preflight blocked both ordinary-input variants |
| Production merge/deploy | NOT ATTEMPTED |

The 45 passes are deliberately narrow. They do not certify animation weight,
attack readability, live shaders, touch/controller behavior, music transitions,
vibration, or first-time-player comprehension.

## Comparison with November 13 and current main

`main` advanced 13 commits from the prior production base. It now contains a
material NULLFANG pass (24-cell idle, 18-cell filmed turn, expanded attacks,
collision-aware recoil and bounded shader effects), a First Sage motion pass,
Ratchet's four-pose wrist reaction, and stronger hit feedback. These additions
are preserved. At source scale, NULLFANG's profile/front/profile turn, airborne
pounce, raised-paw swipe and purple optics are readable and on-model; this was a
proxy inspection, not an engine capture.

Production did not inherit November 13's collision, transaction, quarry, eye,
caption, cache, Alpha, input, Mind Node, boss-window or collector hardening. This
branch reapplies those fixes selectively instead of merging an old review branch.
It also closes the prior report's largest explicit P1 gap: the actual opening
callbacks now settle Ratchet, Servo, the forge quest and the spare cell atomically.

The prior collector recorded 211 checks (44 pass, 167 blocked). This run records
216 (45 pass, 171 blocked). The added actual-callback settlement contract passes;
new rendered motion lanes are present but blocked. No raster, audio or video asset
was regenerated.

## Verified bounded changes on this review branch

1. Terminal falls sweep every crossed tile row while preserving intentional
   NULLFANG one-way descent.
2. Quest rewards and the Purifier hand-in commit once and roll back failed writes;
   legacy completed-without-sword saves recover idempotently.
3. CV3's marble remains visible but cannot reward until Gravehorn legitimately
   retreats.
4. Generic NPC restoration commits cell, powered state and durable gift once.
5. The real Ratchet callback commits cell + awake + repaired + pending reaction in
   one write; Servo commits cell + awake + owed introduction in one write.
6. Ratchet's explanation, forge quest and spare cell settle in one write; a failed
   write rolls back and retry cannot duplicate the cell. An unavailable wrist beat
   is retired before explanation so it cannot replay afterward.
7. The new Sage-specific blue walk remains active while a rescued Sage travels;
   kneeling is restricted to rest.
8. Gravehorn's eye core and finite trail use the same boss-purple authority.
9. Critical captions retain unread lines and promote them FIFO.
10. Room-bake signatures include broken-tile coordinates.
11. Alpha is documented and tested as an optional post-Purifier depth branch.
12. Controller doors show fixed D-pad Up/Down; Mind Node Back exits every phase.
13. PRISM's warning harness is fail-closed and requires named real moves/actors.
14. The collector preflights browser capability, pins source/served identity,
    separates blocked from failed and verifies every retained log.

## Fifteen senior role verdicts

| # | Senior responsibility | Verdict | Evidence and next acceptance step |
|---:|---|---|---|
| 1 | Cinematic design | **HOLD P1** | Caption FIFO and Ratchet settlement/order now pass source contracts. Draft 3/4 authority, current panel parity and live wake→wrist→explanation timing remain open. |
| 2 | Player systems | **SOURCE PASS / RUNTIME HOLD** | D-pad directions, Mind Node Back, focus loss and tutorial source contracts pass. Physical pad, touch, 200% text and RTL require real-device/render evidence. |
| 3 | Quest craft | **HOLD P1** | Atomic forge and CV3 guard pass. A7 survey plus D2/A11/A13 still collapse to `coin`/`sr_coin`; owner must approve four identities/payoffs and migration. |
| 4 | Encounter design | **SOURCE PASS / RUNTIME HOLD** | Swept collision, quarry gate and Alpha optional authority pass. Fast landings and both Alpha routes need ordinary-input play. |
| 5 | Boss design | **HOLD P1/P2** | NULLFANG source art/motion is materially better and impact contract passes. Owner-eye approval, current fight capture, PRISM canon, Gravehorn art and ritual coverage remain open. |
| 6 | Campaign design | **HOLD P1** | Causal source order passes and scripted NPC settlement is now atomic. Five later grotto networks remain repeated placeholders; no continuous route ran. |
| 7 | Mission production | **HOLD** | Source/tree/evidence are pinned and only the review branch was pushed. No merge/deployment. Promotion requires unblocked P1 evidence. |
| 8 | Character art | **COMPONENT PASS / OVERALL HOLD** | New NULLFANG, Sage gait and Ratchet reaction are coherent at source scale with retained provenance. Gravehorn has no authored parts; owner-eye/live seams remain open. |
| 9 | Cinematic direction | **HOLD P1** | Ratchet beat is a bounded improvement and Glitch ritual ends on black/silence. Draft authority, stale pages p20–p26 and four fallback rituals block parity completion. |
| 10 | VFX | **SOURCE PASS / RENDER HOLD** | Finite red ordinary/purple boss trails, cleanup, caps and Canvas fallback pass source review. Shader reduced-motion policy and live GPU/fallback captures remain open. |
| 11 | World systems | **SOURCE PASS / RENDER HOLD** | Swept floors and coordinate-sensitive cache signature pass. Real traversal, boss ledges and save-switch bakes are blocked. |
| 12 | Combat engineering | **SOURCE PASS / RUNTIME HOLD** | Impact/stats/ledger, motion ownership and fail-closed PRISM contracts pass. Hit-stop, shards, clash, rumble and frame-rate feel need live input. |
| 13 | Mission engineering | **HOLD P1** | Quest, forge, generic NPC and actual opening callbacks pass fault injection/replay. QST-03 identities still need an owner ruling. |
| 14 | NPC engineering | **SOURCE PASS / RUNTIME HOLD** | Ratchet/Servo durable settlement and new rescued-Sage gait pass. Wrist contact, reload/skip and walking remain browser-blocked. |
| 15 | UI engineering | **SOURCE PASS / RENDER HOLD** | Caption FIFO, controller labels, Mind Node exit and focus loss pass. Overlay ownership is still unbounded and effective locale rendering is unverified. |

## Findings register

| ID | Sev. | Status | Player consequence / reproduction | Evidence | Paths / owner | Smallest fix and acceptance |
|---|---:|---|---|---|---|---|
| STU-101 | P1 | **fixed/tested** | A 30 Hz terminal fall could cross a floor by ~31.99 px. | exact source contract | `js/game.js`; world systems | Swept rows; pass floor/ledge/one-way at 30/60/120 Hz, then live pounce/landing. |
| STU-102 | P1 | **fixed/tested** | Interrupted hand-in could duplicate rewards or complete without the Purifier. | fault-injected contract | `js/quests.js`; mission engineering | One candidate save + one persist + rollback/replay; contract passes. |
| STU-103 | P1 | **fixed/tested** | Marble could be paid while Gravehorn still stood. | exact contract | `js/entities.js`; quest/encounter | Require `bossHorn`; pre/post/reload contract passes. |
| STU-104 | P1 | **fixed/tested** | Ratchet/Servo could consume the only cell yet remain dark; an interrupted explanation could lose the spare. | actual callback fault injection | `js/opening.js`, `tests/opening-settlement-contract.cjs`; NPC/mission | One durable settlement per beat; failed writes roll back, retries converge once. |
| STU-105 | P1 | **fixed/tested** | A fourth critical caption evicted unread story. | production-function contract | `js/overlay.js`; UI/cinematic | FIFO visible three + queue + reset; contract passes. |
| STU-106 | P1 | **fixed/tested** | Gravehorn showed a red core inside purple boss smoke. | source authority contract | `js/gravehorn.js`, art docs; character/VFX | One boss-purple eye authority; contract passes, live render pending. |
| STU-107 | P1 | **fixed/tested** | Controller door prompt said `Start ▸ pa_UP`; Mind Node ignored Back during countdown. | exact contracts | `js/story-opening.js`, `js/trials.js`; player/UI | Fixed D-pad labels and early all-phase Back; contracts pass. |
| STU-108 | P1 | **fixed/tested** | Missing PRISM actors/moves or update exceptions could be reported as success. | fail-closed contract | `tests/bosswindow.cjs`; combat/boss | Require actors/named moves and propagate exceptions; source contract passes. |
| STU-109 | P2 | **fixed/tested** | Equal broken-tile counts at different coordinates could reuse a stale bake. | exact contract | `js/world.js`; world systems | Coordinate signature; contract passes. |
| STU-110 | P1 | **open — owner** | A7, D2, A11 and A13 discoveries suppress each other through `coin`/`sr_coin`. | source inspection | `js/quests.js`, `js/world.js`; quest craft | Approve distinct IDs/payoffs and conservative legacy migration; test all claim orders/reloads. |
| STU-111 | P1 | **open — design** | GB1/GC1/GD1/GX1/GE1 repeat terminal 5 and near-identical bat/scrap/rest structure, so caves feel empty. | source census; runtime blocked | `js/world.js`, `docs/CAVES_CH1.md`; campaign | Approve one local action, durable change and later callback per network; first/revisit tests. |
| STU-112 | P1 | **open — owner** | `STORY_CANON.md` says Draft 3; edition/full story say Draft 4; stale p20–p26 can contradict play. | authority/ledger | story + `manhua/`; cinematic direction | Pin one edition and certify page-by-page state/identity parity before refiring. |
| STU-113 | P1 | **open — owner** | Copy says PRISM was never infected, but purification extracts virus energy. | source contradiction | PRISM story/purification docs; boss/cinematic | Rule on corruption and align copy, eyes, ritual and reward. |
| STU-114 | P2 | **open** | Generic overlays can open in PAUSE or grow an unbounded duplicate queue under dialogue. | source probe | `js/overlay.js`; UI | Define PAUSE ownership, coalesce/bound duplicates; test pause/dialogue contention. |
| STU-115 | P2 | **open** | WebGL combat layer does not consult reduced motion even when eye/purification effects do. | source inspection | `js/fxgl.js`; VFX | Define suppression/attenuation and capture normal/reduced GPU + Canvas. |
| STU-116 | P1 | **blocked** | No current rendered gameplay, continuous chapter route, physical touch/pad, audio/haptic or performance evidence. | browser preflight | environment / producer | Run on a host where Chromium creates AF_UNIX sockets; preserve full logs/video/hashes. |

## Cave census

| Network | Current authored value | Verdict |
|---|---|---|
| A5 → A7 | Mind Node, Magnet crest, buried route, survey evidence and early-read callback | meaningful; rendered traversal blocked |
| CV1 → CV3 | Spare core, survey pod/map shortcut, Deaf log, Gravehorn-owned marble and changed post-forge return | meaningful; reward/gate source contracts pass |
| GA1T → GA1D | maintenance log, rest/shortcut, Sage rescue, CHIME revelation and visible network wake | meaningful; live rescue/walk blocked |
| A10 → GA2D | optional Alpha, friendly pack, cell/scrap, Pack Sage and mending reward | meaningful optional branch; both live variants blocked |
| A11 / A12 / A13 | hidden coin, dash-gated star, Servo history | QST-03 coin collision remains P1 |
| GB1 / GC1 / GD1 / GX1 / GE1 | repeated terminal 5, bat/scrap/rest templates | **not meaningful enough; owner/design brief required** |

## Manhwa parity matrix

| Beat | Runtime/source | Illustration authority | Verdict |
|---|---|---|---|
| Wake → Ratchet note/cell | ordered in source | chapter pages exist | live timing blocked |
| Ratchet wake → wrist → explanation | new bounded reaction, atomic state | gesture resembles Draft 4; no dedicated causal panel | partial parity |
| Marble → forge → Sage | source contracts pass | ch1 p25–p26 marked stale; revised set differs | P1 parity hold |
| Sage → CHIME → NULLFANG | source order passes | ch1 p20–p26 stale/reordered | P1 parity hold |
| Purification ritual | five in-engine choreographies; only Glitch has current film | no single pinned edition | fallback coverage, not full cinematic parity |
| Chapter edition | Draft 3 in canon, Draft 4 elsewhere | 32 rows not full-scene certified | owner ruling required |

## Animation and VFX matrix

| Subject/system | Source evidence | Visual evidence | Status |
|---|---|---|---|
| NULLFANG | 24 idle, 18 turn, expanded attack strips; distance/time-owned motion; collision-aware recoil | source-scale proxy readable; no current engine capture | component candidate, owner/live hold |
| First Sage | committed lunge/replant/exhale and blue 8-cell rescued walk | sheets coherent; runtime blocked | source pass |
| Ratchet wrist | 4 poses, measured hand anchor, 1.32 s, skip/reload/fallback handling | source-scale gesture readable; contact unrendered | bounded source pass |
| Hit feel | white flash, clash, metallic fragments, knockback, hit-stop, shake, rumble; stronger charged path | no audio/haptic/live feel | source pass, runtime hold |
| Eye trails | red ordinary / purple bosses; lifetime, movement/teleport limits, caps, cure/room cleanup | NULLFANG purple optics visible in sheets | source pass, render hold |
| Shader VFX | pressure, crack, slash, flash, cone, gather; 40-record cap and Canvas fallback | no GPU/Canvas comparison; reduced-motion gap | hold P2 |
| Ritual | hold, white gather, slash, impact, black, extraction, return | Glitch film ends black/silent; four guardians use fallback | hold P1/P2 |
| Gravehorn | procedural stand-in; purple eye fixed on branch | no authored body/motion plates | character-art blocker |

## Staged tests versus uninterrupted real play

The collector requested all 216 registered checks. Browser capability was tested
once and failed before page creation; all 171 dependent records were marked
**blocked**, never failed or passed. The boss, Lion, Sage and Ratchet harnesses
stage saves/rooms/actors and remain targeted checks even when they can run. The
campaign certificate contract passed only because it correctly rejects absent or
partial evidence; it is not a playthrough. Neither Alpha-skip nor Alpha-complete,
deliberate death/Continue, physical touch/controller, current gameplay-size visual,
sound, vibration, nor sustained frame time is certified.

Evidence: `docs/studio/runs/2026-11-14/automated/`. `results.json` is the machine
record; `AUTOMATED.md` is the index. The collector started with four rebuilt HTML
pages dirty because generated pages are deliberately excluded from the source
patch; it rebuilt them again and pinned their served hashes. Integrators must
regenerate all four pages once after source integration.

## Before/after patch and validation record

| Area | Before on `73f7705` | After on `6f7e84a` | Verification |
|---|---|---|---|
| World | final-row fall check; count-only terrain key | swept rows; coordinate signature | `fallthrough-contract`, `tile-signature-contract` PASS |
| Mission | multi-write rewards/forge; ungated CV3 | atomic reward/forge; `bossHorn` gate | quest/quarry contracts PASS |
| NPC opening | cell/wake/flags/gift split across writes | actual Ratchet/Servo callbacks settle/rollback once | opening settlement + generic restore PASS |
| Story/UI | conflicting Alpha copy; caption eviction; wrong pad label; trapped node | optional authority; FIFO; D-pad; all-phase Back | four exact contracts PASS |
| Boss/VFX | fail-open PRISM harness; red Gravehorn core | named fail-closed contract; purple authority | bosswindow/eye contracts PASS |
| Sage | new main-specific gait preserved during selective port | moving tame Sage walks blue; rest kneels | Sage source contract PASS; render blocked |
| Collector | browser attempts could misclassify and logs lacked final integrity guarantees | one preflight, blocked class, source/served pin, snapshots | 15 collector unit tests PASS; 214/214 log integrity |

Commands and exit status:

- `npm ci` — exit 0; 160 packages, dependency tree clean.
- `npm run build` — exit 0; all four pages built.
- Targeted `node tests/run.cjs <contract>` lane — exit 0 for all 19 selected checks.
- `python3 -m unittest tools.studio.test_audit` — exit 0; 15 tests.
- `CHROMIUM_PATH=/usr/bin/chromium python3 tools/studio/audit.py --profile full --output docs/studio/runs/2026-11-14/automated` — exit 1 because requested browser scope is blocked; 45 pass, 171 blocked, no executed failure/timeout, complete scope recorded.
- Direct `git push` — exit 128 because no CLI username was available; GitHub connector created the exact tree and branch, then local readback verified `6f7e84a...` / `d9ba467...`.

## Integration order and stop conditions

1. Start from `73f7705...` or a reviewed descendant and integrate source commit
   `6f7e84a...`; do not copy generated HTML or old evidence.
2. Preserve the new NULLFANG, Sage, Ratchet and shader assets/code already on main.
3. Regenerate all four pages once, build/package, run exact source contracts.
4. Stop for owner decisions on Draft 3/4, PRISM corruption, QST-03 identities and
   the five repeated cave outcomes; do not invent canon or regenerate approved art.
5. On a capable host, run the full collector and two fresh ordinary-input campaign
   routes (Alpha skipped/completed), each including a deliberate death/Continue.
6. Capture current 960×540 and phone frames for Ratchet, Sage, Lion, Gravehorn,
   finite eye trails, reduced motion and GPU/Canvas fallback; test physical pad/touch.
7. Merge or deploy only with zero executed failures/timeouts, no blocked P1 lane,
   signed owner/art decisions and verified source/built/live identity.

## Files changed by this candidate

Changes are confined to reviewed source, documentation, exact contracts and the
collector: `docs/ART_QUEUE.md`, `docs/CAVES_CH1.md`, `docs/STORY_SCRIPT.md`, combat
docs, `docs/studio/PIPELINE.md`, ten `js/` modules, tests and `tools/studio/`.
No image, audio, video, generated HTML, `main`, `odyssey` or deployment was changed.

