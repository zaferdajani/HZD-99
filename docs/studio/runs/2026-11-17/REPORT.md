# CLAWBYTE senior studio review — 2026-11-17

## Executive verdict

**HOLD — the review branch contains verified bounded repairs, but it is not approved for merge or deployment.**

The 15 senior responsibilities reviewed the same pinned source. Build, packaging, syntax, collector tests, and the focused source contracts passed. No executed assertion failed and no check timed out. The full audit recorded **35 pass and 207 blocked** records. Chromium exists, but this host denies the AF_UNIX singleton socket it requires, so no browser page opened. Therefore no fresh gameplay-size render and no uninterrupted ordinary-input chapter-one playthrough is claimed.

Nothing was merged into `main`, `odyssey`, or the integration branch. Nothing was deployed.

## Immutable pins and branch safety

| Item | Pin / result |
|---|---|
| Reviewed `main` | `9248529edc7f7b9503d9c373c169593da419117d` |
| Reviewed `odyssey` | same as `main` |
| Reviewed integration branch | same as `main` |
| Reviewed base tree | `ccd649f286a5d72fc222a1df3936a9e2b804c9a0` |
| Previous review | `codex/studio-review-2026-11-15`, report source `b28dc2ab…` |
| Today's source/audit pin | `644693e13fb7dab1ca409a2c12acedcf27816a63` |
| Today's source tree | `61380a158c02013ca6732769767cbc2a49fcd6a8` |
| Review branch | `codex/studio-review-2026-11-17` |
| Worktree at audit start | clean |
| Production merge/deploy | **not performed** |

## What changed since the 2026-11-15 review

Current `main` advanced substantially and those changes were preserved:

- Gravehorn now has authored mechanical-rhino parts, pose coverage, a coherent gameplay-scale silhouette, and dedicated fight logic. It is no longer the procedural-box boss reported on November 15.
- The wolf pack and Alpha have wolf-specific stalk, snarl, coil, lunge, rend, bay, roll, and yield behavior.
- The Wolf Run room, ring gates, hero plunge, sword reach, enemy motion, and several first-kingdom presentation fixes landed.
- NULLFANG's purification now stages the hero and lion before the hold prompt, and the redundant post-purification comic is library-only.
- The repository now identifies the seven robed `sage*` entities as distinct Eye agents. This supersedes the November 15 “Meadow Keeper” interpretation. Internal IDs may remain for save compatibility, but player-facing identity must follow the newer canon.

Important November 15 engineering protections did not survive into current `main`: atomic NPC restoration, swept terminal-fall collision, exact broken-tile coordinate signatures, and rescued-agent walking. Caption FIFO and atomic quest/forge settlement were also absent, but were restored on this review branch. The evidence collector had regressed; this branch restores honest browser classification and dependency detection, but not yet the former immutable log-snapshot and descendant-cleanup system.

## Bounded fixes implemented on this review branch

### Story and interface

- Replaced “free/release” with **purify/purified** for the guardian ritual in English, Arabic, Turkish, Chinese, and Russian, including the accessible label and effective objective/caption layers.
- Restored a visible-three plus FIFO story-caption queue. A fourth line waits instead of evicting unread text; reset clears both visible and queued lines.
- Added fail-closed contracts for purification language and caption ordering.

### Missions and persistence

- Made quest settlement clone-and-publish, idempotent, and rollback-safe.
- Made forge completion settle the quest, item removal, rewards, Purifier, and Ratchet-camp state in one durable write.
- Added one-time recovery for a legacy completed-forge save missing the Purifier.

### Infection optics

- Replaced “every boss is infected” with explicit infection authority.
- Ordinary infected creatures retain finite red eye trails; infected guardians retain finite purple trails.
- Alpha, Gravehorn, PRISM, CHIME, Carrier, Moth, Lattice, and Lens no longer receive virus smoke merely because they are large or boss-like.
- Gravehorn's authored red optic was preserved as a construct identity. It is not evidence of infection, and attack telegraphs/molten cracks were not recolored.

### Evidence collection

- Restored direct and transitive Playwright detection and explicit `noBrowser` handling.
- Added preflight classification for missing/non-executable Chromium and denied AF_UNIX sockets.
- Corrected three tests that actually launch Playwright but had been incorrectly marked `noBrowser`.
- Browser infrastructure failures now record **blocked before launch**, not false gameplay failures.

### Built pages

- Rebuilt `index.html`, `odyssey.html`, `forge.html`, and `forge-odyssey.html` from the reviewed source.

## Automated evidence

Evidence root: `docs/studio/runs/2026-11-17/automated/`

| Classification | Count | Meaning |
|---|---:|---|
| Pass | 35 | Executed successfully against source pin `644693e…` |
| Fail | 0 | No executed assertion failed |
| Timeout | 0 | No executed process exceeded its budget |
| Blocked | 207 | Chromium could not create its required AF_UNIX socket; no page opened |
| Total | 242 | Every requested audit record received a terminal classification |

`results.json` records `complete_requested_scope: true` and `passed: false`. The first means every requested check received a record; it does **not** mean blocked renderer scope passed.

Commands and results:

| Command | Result |
|---|---|
| `npm ci` | pass |
| `npm run build` | pass |
| `npm run app:pack` | pass; 822 packaged assets plus two pages |
| changed-JavaScript syntax checks | pass |
| `python3 tools/studio/test_audit.py` | 4/4 pass |
| focused `node tests/run.cjs …` | pass: combat impact, repair lifecycle, story opening, caption FIFO, purification language, infection authority, atomic quest payment, current script route |
| full `tools/studio/audit.py --profile full` | 35 pass, 207 blocked, 0 fail, 0 timeout |

The passing `script-route` test proves internal consistency of the current route; it does **not** prove that route matches the November 16 owner canon.

### Staged versus uninterrupted evidence

| Lane | Result | Honest interpretation |
|---|---|---|
| Exact source inspection | completed | All 15 responsibilities reviewed the pinned tree. |
| Source/headless contracts | pass/hold mix | Strong evidence for the bounded fixes and identified regressions. |
| Staged browser checks | blocked | These would teleport, seed saves, or drive a component directly; no page opened here. |
| Gameplay-size render | blocked | No fresh current-build desktop/phone, RTL/CJK, WebGL/Canvas, or reduced-motion capture. |
| Uninterrupted ordinary-input route | blocked | `campaign-ch1` did not run. No wake-to-teaser playthrough is claimed. |
| Historical route evidence | not reproduced | The reviewed main commit message reports a 17:59 keyboard route with one death and no page errors; this is historical commit evidence only. |
| Physical device | unverified | No real phone, controller, vibration, speaker/headphone mix, iOS, or Android test. |

## Fifteen-role sign-off matrix

| # | Senior responsibility | Verdict | Primary evidence / blocker |
|---:|---|---|---|
| 1 | Cinematic Designer | **Hold P1** | Better opening and ritual staging; Eye-agent rewrite and Draft 3/4 manhwa split remain. |
| 2 | Game Designer — Player Systems | **Conditional source pass / hold** | One-action tutorial and Ratchet chain are clear; no current continuous, touch, controller, RTL/CJK, or 200% text proof. |
| 3 | Mission Designer — Quest Craft | **Hold P0/P1** | Atomic forge fixed here; relic identity collision and Alpha timing/verb remain. |
| 4 | Principal Encounter Designer | **Conditional source pass / hold** | Gravehorn/Alpha are materially improved; Alpha still concludes like a purification and runtime is unverified. |
| 5 | Senior Boss Designer | **Hold P1** | NULLFANG ritual mechanics are strong and terminology is fixed; PRISM contradiction and four missing ritual films remain. |
| 6 | Mission Designer — Campaign | **Hold P1** | Current runtime route conflicts with the newest canon; later agent networks remain template-like. |
| 7 | Senior Mission Producer | **Release hold** | Pins and source evidence are valid; renderer, campaign, device, and full collector-integrity gates are incomplete. |
| 8 | Senior Character Artist | **Component pass / overall hold** | Gravehorn and wolves improved; seven agents still share one body, Ratchet film is off-model, some manhwa panels are stale. |
| 9 | Senior Cinematic Director | **Hold P1** | NULLFANG film/fade pass at asset level; Ratchet continuity, four rituals, manhwa parity, and current playback remain open. |
| 10 | Senior VFX Artist | **Source-system pass / visual hold** | Finite trails are well bounded and clean-body authority is fixed; wider shader FX lack reduced-motion policy. |
| 11 | World Systems Technical Director | **Hold P1** | Terminal-fall sweep and coordinate terrain signatures regressed; CV1B documentation is stale. |
| 12 | Combat Gameplay Engineer | **Source partial pass / runtime hold** | Stats, armor, hit-stop, hardware debris, recoil, and camera impact exist; real boss fights were not run. |
| 13 | Mission Gameplay Engineer | **Hold P1** | Atomic quest/forge fixed here; campaign graph still contradicts the newest owner order. |
| 14 | NPC Gameplay Engineer | **Hold P1** | NPC restoration is non-atomic and rescued agents still slide in kneeling art. |
| 15 | Lead UI Engineer | **Conditional source pass / hold** | Language and caption fixes pass; overlay ownership, full localization, 200% text, reduced motion, and touch remain open. |

## Story, tutorial, and campaign authority

The tutorial source is much clearer than earlier builds:

**wake → first combat → Ratchet booth → letter → drawer/battery repair → pod → winch need → Volt Pack → monument → meadow.**

The player is given one actionable objective at a time, the tutorial guarantees enough currency for the Volt Pack, the monument is adjacent to the forward path, and Ratchet's essential explanation survives film skip/fallback.

The campaign after the forge is **not canon-safe**. Current code, tests, and progress copy still enforce:

**marble/forge → robed agent → CHIME → NULLFANG.**

The November 16 owner canon instead states:

**Gravehorn constructs → NULLFANG → Wolf King → the Eye agent working the pack.**

This is not a safe one-file repair. It affects gates, room order, objectives, story panels, saves/migrations, tests, and the meaning of the Alpha conclusion. Integration must choose and encode one authoritative graph before production.

## Cave census and meaning

| Space | Current purpose | Review |
|---|---|---|
| A5 buried route | teaches breakable route and quarry direction; upgrade/node payoff | meaningful |
| CV1 entry hall | bounded crawler threat, buried mouth, climb pocket, permanent core | meaningful |
| CV1B Seam | one-ring side chamber with survey/cache utility | meaningful in code; `docs/CAVES_CH1.md` wrongly describes an onward CV2 mouth/shortcut/rest route |
| CV2 long dark | Deaf System founding evidence and lure resolution | meaningful |
| CV3 / Gravehorn | authored construct encounter and marble ownership | meaningful in source; fresh traversal unverified |
| A10R / A10 / GA2 branch | wolf run, Alpha, pack friendship, cache, fragment-bearing agent | strong optional concept; currently offered too early and ends with purification language/mechanics |
| GB1 / GC1 / GD1 / GX1 / GE1 networks | repeated grotto/terminal/deep-agent template with different cards/rewards | insufficiently distinct; each needs a kingdom-specific action, durable visible change, and later callback |

## Manhwa parity matrix

| Beat | Runtime | Illustrated authority | Verdict |
|---|---|---|---|
| Opening / Ratchet repair | ordered and playable in source | several panels exist; wake film Ratchet remains pale-grey while live Ratchet is copper/bronze | hold |
| Marble / forge | current source supports the loop | some cave/door/forge panels still use the wrong tan cat | hold |
| First robed chamber | runtime partly says Eye agent | docs and panels still call it the Sage/Meadow Sage and reuse a generic robe | P1 conflict |
| NULLFANG fight | authored motion and ritual staging exist | `fight_a` remains pale/lilac; other panels show ice-blue/white NULLFANG | hold |
| Purification | runtime duplicate comic is library-only; film has authored fade | film is coherent; historical screenshots still show obsolete “free” copy | source fix passed, fresh render blocked |
| Next chapter teaser | names UNDERTOW in newer text | `ch2_b` lacks UNDERTOW's unique silhouette | hold |

Authority is split: `docs/STORY_CANON.md` declares Draft 3, while `manhua/full-story.md` and `manhua/edition.json` declare Draft 4. All 32 edition entries state that full-scene runtime parity is not certified. Do not refire broad manhwa sets until the story edition and Eye-agent identities are pinned.

## Character, animation, VFX, and cinematic review

The graphics review used stored provenance sheets and gameplay-size captures, not a fresh current-build render.

| Subject | Current quality | Keep / fix |
|---|---|---|
| Hero | strong, consistent, multiple poses/variants | preserve |
| Ratchet live actor | readable copper/bronze finish, good hero-relative scale | preserve; replace/grade old grey wake film |
| NULLFANG | nine studio strips, readable lion attacks, strong ritual film | preserve; do not regenerate |
| Alpha | ten wolf-specific strips with readable prowl/howl/leap/claw/bite/yield | preserve; give a dedicated yield/covenant ending, not virus extraction |
| Pack wolves | distinct hunt, snarl, coil, lunge, winded, bay, roll coverage | preserve and runtime-validate |
| Gravehorn | authored mechanical-rhino silhouette and strong scale | preserve rig; finish only true hind leg, phase-two parts, and rear 3/4 turn |
| Seven Eye agents | one enlarged generic `sage*` body reused seven times | create seven distinct silhouettes and stand/walk/lunge/exhale coverage |
| Finite infection trails | 1.125–1.875 s life, quality caps 90/170/260/320, per-body cap 8, 10 px/s motion threshold, 2.2 px spacing, teleport reset >90 px, world-space cleanup | source authority passes; fresh render blocked |
| Reduced motion | eye smoke correctly disables while glow remains | extend policy to `fxgl` pressure/cracks/slash/cone/flash/pillar/gather |
| NULLFANG film | 1280×720, 24 fps, 13.25 s, H.264/AAC; white gather, dark extraction, golden return, picture/audio fade | preserve; runtime playback blocked |

## Open findings, ordered

### P0 / P1 — required before merge or deployment

1. **CAMPAIGN-GRAPH-01 — canon route conflict.** Reconcile room gates, objectives, panels, saves, and tests with the approved order. Acceptance: one documented graph and two uninterrupted routes, Alpha skipped and Alpha completed.
2. **EVIDENCE-RUNTIME-01 — no current rendered or continuous proof.** Run ordinary-input wake-to-teaser routes including death/Continue, forge, agent/CHIME order, NULLFANG final-hit hold-cancel-retry, film/fallback, golden/friendly return, and teaser. Capture desktop and real touch separately.
3. **NPC-ATOMIC-01 — restoration is multi-write.** Ratchet, Servo, and generic NPC restoration can consume a unique cell before awake/gift state persists. Acceptance: one clone-and-publish write, rollback on failed storage, idempotent gifts, reload tests at every boundary.
4. **WORLD-FALL-01 — terminal-fall sweep regressed.** `moveEnt` samples the final feet row only; prior contract measures a 31.99 px sink at 30 Hz. Acceptance: crossed-row sweep at 30/60 Hz for solid and one-way floors plus rendered fall checks.
5. **NPC-WALK-01 — rescued agent kneeling slide.** `sage` is absent from distance gait and every tamed body selects `sagePure`. Acceptance: moving tamed agent selects purified `sageWalk8`; stationary agent kneels/stands; render all seven variants.
6. **ALPHA-END-01 — wrong ritual semantics.** Alpha is not Song-infected but still uses blade gating and generic cleanse presentation. Acceptance: dedicated surrender/covenant sequence and copy; friendly pack outcome remains optional and durable.
7. **PRISM-END-01 — canon contradiction.** PRISM is described as never infected but remains in purification/virus extraction authority. Acceptance: owner-approved non-virus stand-down/consent ritual or an explicit canon change before film production.
8. **ART-AGENT-01 — seven named agents share one body.** Acceptance: distinct silhouettes, animation coverage, eye anchors, gameplay-scale captures, and room-specific identity for TALLYMAN, LEASH, UNDERTOW, SLAGFATHER, REDACTOR, LAPIDARY, and PUPIL.
9. **MANHWA-AUTH-01 — Draft 3/4 and identity split.** Acceptance: one pinned edition, updated agent terminology/order, and scene-level runtime parity certification.
10. **RELIC-ID-01 — coin identity collision.** A7 and multiple secrets share the same durable coin/relic authority. Acceptance: approved distinct IDs/payoffs, conservative migration, every-order/reload tests.

### P2 — next hardening pass

11. **WORLD-TILE-01:** restore a sorted exact-coordinate broken-tile signature; equal count/different cells must differ.
12. **CAVE-DOC-01:** update CV1B documentation to its actual one-ring topology; do not restore the removed second ring.
13. **CAVE-VARIETY-01:** give each later agent network a unique local action, persistent visual consequence, and later callback.
14. **UI-OVERLAY-01:** complete full-screen overlay ownership; coalesce duplicate non-story requests and bound the queue without dropping unique story lines.
15. **UI-ACCESS-01:** add a global reduced-motion policy, finish critical-route/pause localization, and test Arabic RTL, CJK wrapping, and every screen at 200% text.
16. **CINE-RATCHET-01:** replace or grade the wake movie so film and live Ratchet match.
17. **CINE-RITUALS-01:** produce only the missing approved Brood/Atlas/Zero rituals after story approval; resolve PRISM first; do not regenerate NULLFANG.
18. **AUDIT-INTEGRITY-01:** restore immutable log snapshots, post-capture integrity validation, and cleanup of descendants that survive a successful test leader.

## Integration decision

This branch is suitable for **selective integration and a new validation run**, not direct production. Preserve newer `main` work, integrate the verified source fixes, resolve the campaign graph before changing gates, and then obtain the missing renderer, continuous-route, phone-touch, controller, audio, and haptic evidence.

The single implementation handoff is in `CLAUDE_INTEGRATION_PROMPT.md` beside this report.
