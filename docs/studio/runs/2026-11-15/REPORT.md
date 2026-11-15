# CLAWBYTE senior studio review — 2026-11-15

## Executive verdict

**HOLD — the review branch is materially safer and more coherent than current `main`, but it is not a production approval.**

The bounded source fixes are implemented, built, packaged and covered by 46 passing source/staged checks. No executed check failed and no check timed out. However, this host forbids Chromium's required Unix socket, so 185 rendered/browser checks were recorded as **blocked before page creation**. That includes the only uninterrupted ordinary-input chapter-one playthrough. The result is strong source evidence, not end-to-end gameplay certification.

Nothing was merged into `main`, `odyssey` or the integration branch. Nothing was deployed.

## Immutable pins and branch safety

| Item | Pin / result |
|---|---|
| Reviewed `main` | `bb71fe2e50e3e9d648fe9275da35b66feaecad68` |
| Reviewed `odyssey` | same as `main` |
| Reviewed integration branch | same as `main` |
| Previous review branch | `codex/studio-review-2026-11-14` at `33c51cae811eeddd87d25848b82597b5f47f83d5` |
| Previous reviewed source | `6f7e84a43dd0d5443dee00cd0f9d7f6a4c1ad41e` |
| Previous work integrated by ancestry? | **No** — neither previous pin is an ancestor of current `main` |
| Today's source/audit pin | `4c0162206068630f7df041f1cfc728270857f37e` |
| Today's source tree | `1374cd45da3339094ec69cd7a55b1ad20b9eec24` |
| Review branch | `codex/studio-review-2026-11-15` |
| Production merge/deploy | **Not performed** |

The first connector transfer truncated two large runtime blobs. It was rejected, the two blobs were replaced in a follow-up commit, and the remote tree was then compared byte-for-byte with the local reviewed tree before the audit ran. The final source tree above is the verified one.

## What changed on `main` since the previous review

Current `main` contains meaningful work that the integration must preserve:

- a much clearer opening: early claws and first fight, three-beat Ratchet booth, motivated Volt Pack, nearby monument, early NULLFANG glimpse, better reward/save-point cadence;
- a substantially improved NULLFANG set, including a 24-frame studio turn, new roar, re-keyed strips and purple boss optics;
- generalized boss hit feel and recoil, including fliers and boss-specific openings;
- hostile-body solidity and body-box work;
- metallic Ratchet artwork and a hero impatient pose;
- iOS/Xcode packaging and AAC audio copies;
- a NULLFANG purification ritual with authored picture/audio fade instead of the abrupt ending reported by the owner.

These were preserved. The Nov. 14 branch was **not** merged wholesale.

## Bounded fixes implemented on this review branch

### Story, tutorial and UI

- Corrected the owner ruling everywhere touched by chapter-one guidance: **NULLFANG is the Meadow Sage and first Sage; GA1D is the Meadow Keeper.**
- Updated the objective and manhwa-caption layers in English, Arabic, Turkish, Chinese and Russian.
- Added `keeper-identity-contract` so player-facing copy cannot swap those identities again while stable internal `sage*` IDs remain compatible.
- Preserved the new two-line Ratchet cadence while making Ratchet and Servo settlement atomic.
- Fixed fixed-direction controller labels so UP/DOWN use D-pad labels instead of a remapped pause route.
- Made Mind Node Back exit every countdown/input phase without paying or saving.
- Added a visible-three plus FIFO scene-caption queue so a fourth line cannot evict unread story text.

### Missions and persistence

- Made quest payment atomic and idempotent, including the forge hand-in and completed-save Purifier recovery.
- Made Ratchet, Servo and generic NPC restoration settle cell consumption, awake state, flags and once-only gifts in one durable transaction with rollback.
- Kept Alpha explicitly optional in route authority and topology.
- Made Gravehorn's legitimate retreat own the CV3 marble reward; the pillar remains readable but cannot award early.

### World, combat and bosses

- Swept every crossed tile row during terminal falls, closing the measured 31.99 px 30 Hz sink.
- Made broken-tile room signatures depend on exact coordinates rather than only the count.
- Restored fail-closed PRISM timing/move coverage instead of accepting synthesized or exception-skipped moves.
- Unified Gravehorn's visible eye core, glow, trail and art brief on purple boss infection.
- Kept ordinary infected optics red, bosses/Alpha purple, and the finite world-space trail authority consistent.
- Restored moving purified-Keeper walk selection so calm bodies do not translate in a kneeling plate.

### Evidence tooling

- Hardened the collector around owned processes, immutable log snapshots, actual per-harness budgets and Unix-socket browser preflight.
- Added transitive local-helper detection so browser harnesses such as cadence are blocked at preflight rather than falsely reported as gameplay failures.
- Preserved explicit `noBrowser` contracts that import pure helpers from browser modules without launching a browser.

## Automated evidence

Evidence root: `docs/studio/runs/2026-11-15/automated/`

| Classification | Count | Meaning |
|---|---:|---|
| Pass | 46 | Executed successfully against source pin `4c016220…` |
| Fail | 0 | No executed assertion failed |
| Timeout | 0 | No owned process exceeded its declared budget |
| Blocked | 185 | Chromium could not create its required Unix socket; no page opened |
| Total records | 231 | Includes build, package, identity and harness records |

`results.json` records `complete_requested_scope: true`, `passed: false`, a clean start, the source pin, server identity and `log_integrity.ok: true`. “Complete requested scope” means every requested check received a record; it does **not** mean the blocked renderer scope passed.

Representative passes:

- build and pack;
- atomic quest, NPC, Ratchet and Servo settlement;
- repair lifecycle;
- Keeper/Sage five-language identity;
- story route and optional Alpha authority;
- terminal-fall sweep and exact tile signature;
- controller tutorial and clarity;
- Mind Node Back;
- PRISM fail-closed boss-window contract;
- caption FIFO;
- Gravehorn purple eye and quarry ownership;
- infection-eye authority;
- purified-Keeper walk selection;
- source combat stats/impact, audio credits/tails, offline release, desktop protocol and campaign certificate validation.

## Evidence boundary: staged versus uninterrupted

| Lane | Result | Honest interpretation |
|---|---|---|
| Source inspection | Pass/hold mix | Exact pinned files were reviewed by all 15 responsibilities. |
| Headless/source contracts | 46 pass | Strong regression evidence for the bounded fixes. |
| Staged browser tests | Blocked | Would load a room/save, teleport or directly drive component states; none opened a page here. |
| Gameplay-size render | Blocked | No fresh 960×540, phone, touch, RTL, GPU/Canvas or reduced-motion capture. |
| Uninterrupted ordinary input | Blocked | `campaign-ch1` did not run. No wake-to-teaser playthrough is claimed. |
| Physical device | Unverified | No real phone, controller, vibration, iOS or Android smoke test. |

The current “phone” opening harness uses a mobile viewport but keyboard input. It is not a touch playthrough.

## Gameplay and story review

The approved chapter-one causal line is now:

**wake → first combat → Ratchet letter/battery/repair → pod → Volt Pack → monument → meadow → meaningful quarry route → Gravehorn retreat → marble → Ratchet forge → Meadow Keeper → learn CHIME's role → silence CHIME → purify NULLFANG, the first Sage → Data Conduits.**

Alpha remains a blade-gated optional side branch. It may pay pack friendship, a cell, scrap and the Pack Keeper's cache, but it may not block A2 → A3 → A4 or chapter progression.

The first cave chain is meaningfully differentiated in source: A5 teaches the buried route and pays a Mind Node/upgrade; CV1 pays a core; CV1B provides rest/map function; CV2 supplies Deaf-System evidence; CV3 is a real Gravehorn-owned marble encounter; the return route visibly changes and opens the Keeper network. This is improved and causally sound in source.

The later five Keeper networks remain too template-like: GB1/GC1/GD1/GX1/GE1 still reuse the same scrap/rest grotto, terminal/bat tunnel and deep-chamber structure. Different cards and currency payouts are not enough. Each needs one kingdom-specific action, one durable visible change and one later callback.

## Visual and motion inspection

The visual review used source-scale strips and committed provenance captures only. It did **not** substitute these for a fresh gameplay render.

- **NULLFANG:** strong component improvement. Nine dedicated strips now present a stable mechanical-lion identity, planted paws, distinct pounce/rake/swipe/roar shapes and purple optics. The new 24-frame turn has head/shoulder lead, cross-step, hindquarter follow and tail follow-through. Its motion reference was itself a generated realistic-lion reference, not documentary mocap. Metadata still says assistant-reviewed and awaiting the owner's eye.
- **Alpha:** ten wolf-specific strips remain a sound base: prowl, howl, leap, claw, bite, clinch and yield read as wolf behavior rather than a reskinned lion.
- **Ratchet:** the copper/bronze/steel repaint reads much closer to the hero's finish in the committed gameplay provenance sheet. The live wake movie still shows the old grey Ratchet, creating a visible film-to-sprite discontinuity.
- **Hero impatient pose:** readable at source scale, but only the bare costume exists; weapon-tier variants remain open or need an explicit scope decision.
- **Eye trails:** source authority is finite and professional in design: 1.125–1.875 second life, quality caps, per-body cap, movement threshold, teleport reset, world coordinates, cure/removal/room cleanup, red ordinary optics and purple boss optics. Runtime appearance is blocked.
- **NULLFANG purification:** 13.25-second source film includes gather, white blade, extraction, golden return, picture fade, audio fade and final silence. Runtime handoff is blocked.
- **Gravehorn:** mechanics are rich, but `assets/characters/gravehorn/` is absent and the renderer explicitly uses procedural stand-ins. This is below the requested studio boss bar.

Do not regenerate the completed NULLFANG or Alpha assets. Preserve and validate them.

## Open release blockers, ordered

### P1 — must resolve or verify before merge/deploy

1. **No rendered or uninterrupted proof.** Run a clean normal-input chapter route with Alpha skipped and another with Alpha completed; include death/Continue, quarry ownership, forge, Keeper, CHIME, NULLFANG hold-cancel/retry, cinematic fade and restored friendly state. Capture 960×540 and phone-touch separately.
2. **Manhwa authority is split.** `docs/STORY_CANON.md` says Draft 3; `manhua/full-story.md` and `manhua/edition.json` say Draft 4; every edition row says runtime parity is not certified. Pin one edition before refiring any pages. The new Keeper/Sage ruling specifically affects the older p20–p26 identity/order.
3. **PRISM canon contradicts purification.** The script says PRISM was never indexed and never infected, but the gameplay path still performs virus extraction/purification. Owner decision required: a non-virus stand-down/cleansing ritual, or make PRISM infected. Do not fabricate a virus extraction film while the story says there was no virus.
4. **Gravehorn lacks authored art.** Finish the queued part set against the existing pivots/mechanics; require provenance, source contract, gameplay-scale capture and owner approval.
5. **Ratchet wake continuity.** Replace or grade the old grey wake film to match the approved metallic Ratchet, then verify repair → film → live handoff and skip/fallback.
6. **Four purification films remain unapproved for the requested ritual.** Existing Brood/Atlas/Zero/PRISM files are older clips, not proof of the new gathering/extraction/fade choreography. Resolve PRISM first and do not regenerate NULLFANG.
7. **Relic identity collision.** A7's quest and D2/A11/A13 world secrets all pay `coin`; world flags use `sr_coin`. Approve distinct durable IDs/payoffs plus conservative migration and every-order reload tests.

### P2 — next hardening pass

8. Give every later Keeper cave network a unique local action, persistent visual consequence and callback.
9. Fix generic overlay ownership: PAUSE is excluded from `overlayOpenNow`, and the general queue can grow without duplicate coalescing/bounds. Preserve unique story FIFO.
10. Define reduced-motion policy for `js/fxgl.js`; eye trails already reduce correctly, but shader pressure/cracks/slash/cone/gather do not share that authority.
11. Complete chapter-one localization inventory and render Arabic shaping/RTL, CJK wrapping and 200% text. Current broad base tables still fall back to English outside the ordered-story layer.
12. Validate all seven Keepers walking after rescue in the renderer, not only the source selection contract.

## Fifteen-role sign-off matrix

| # | Senior responsibility | Verdict | Key reason |
|---:|---|---|---|
| 1 | Cinematic Designer | **Hold P1** | Opening source is much clearer; rendered cadence/panels and manhwa authority remain unverified/conflicted. |
| 2 | Game Designer — Player Systems | **Source partial pass / Hold** | Tutorial/economy improved and fixed contracts pass; touch/pad/runtime proof blocked. |
| 3 | Mission Designer — Quest Craft | **Conditional source pass / Hold** | Atomic settlement and quarry ownership fixed; coin identity collision remains. |
| 4 | Principal Encounter Designer | **Conditional source pass / Hold** | Fallthrough/quarry/tile fixes pass; real traversal and enemy solidity are blocked. |
| 5 | Senior Boss Designer | **Hold P1/P2** | NULLFANG/Alpha/hit feel improved; Gravehorn art, PRISM canon and real fights remain open. |
| 6 | Mission Designer — Campaign | **Hold P1** | Chapter-one cause/effect is aligned; later caves repeat and no uninterrupted route ran. |
| 7 | Senior Mission Producer | **Release hold** | Source pin/evidence are valid; browser, device and campaign gates are incomplete. |
| 8 | Senior Character Artist | **Component pass / overall hold** | Lion, wolf, Ratchet and hero pose improved; Gravehorn and owner-eye approval remain. |
| 9 | Senior Cinematic Director | **Hold P1** | NULLFANG fade fixed; Ratchet continuity, four rituals, manhwa and PRISM remain. |
| 10 | Senior VFX Artist | **Source pass / render hold** | Finite red/purple trail authority passes; GPU/Canvas/reduced-motion render unverified. |
| 11 | World Systems Engineer | **Conditional source pass / hold** | Swept collision and tile signature fixed; rendered body/terrain behavior blocked. |
| 12 | Combat Engineer | **Source partial pass / hold** | Impact and fail-closed tell contracts pass; real boss combat blocked. |
| 13 | Mission Engineer | **Conditional source pass / hold** | Transactions and quarry gate pass; migration/coin and end-to-end route remain. |
| 14 | NPC Engineer | **Conditional source pass / hold** | Atomic restore and walk selection pass; seven-Keeper rendered motion blocked. |
| 15 | Lead UI Engineer | **Conditional source pass / hold** | Caption, D-pad and Mind Node fixes pass; overlay ownership, touch, RTL and 200% render remain. |

## Integration decision

The review branch is suitable for **selective integration and another validation run**, not direct deployment. Integrate the final tree difference against the latest `main`; do not replay intermediate transfer commits as meaningful work and do not merge the Nov. 14 branch wholesale. Preserve any newer main changes, run all named contracts, then obtain the missing rendered and uninterrupted evidence before production approval.
