# CLAWBYTE Senior Studio Review — 2026-11-19

## Executive decision

**RELEASE HOLD — P1.** Current `main` adds three worthwhile improvements over the 2026-11-18 baseline: the phone rotation screen can recover after a viewport change, all 160 shipped music/film containers are plain and index-first, and long feather/lance/shard projectiles now use their drawn length for damage and blade contact. The recent cyan-defringe pass and TALLYMAN stand/rig mixing are also useful presentation work and must be preserved.

The chapter is not ready to merge or deploy. Runtime, objectives, documentation and `script-route` still certify a story graph that conflicts with the owner's latest canon. Alpha is offered too early and still concludes through guardian-like logic; six purified agents can move in static kneeling art; Ratchet/NPC restoration is not atomic; two world-integrity defects remain; later caves repeat one template; and manhwa authority is split between Draft 3 and Draft 4.

This review restored four bounded safety fixes onto today's newer base: caption FIFO, PURIFY/PURIFIED terminology plus ritual eligibility, atomic quest/forge settlement, and explicit red/purple infection-eye authority. It also restored honest browser preflight without discarding the prior process-ownership tests. All corresponding source contracts pass.

No browser page could open in this environment. Therefore there is **no fresh uninterrupted ordinary-input playthrough, no current runtime gameplay-size capture, and no physical phone/controller/audio/haptic/accessibility proof**. Stored shipping assets were inspected at calculated gameplay size, and that evidence is labelled separately.

This is a review branch only. **Production was not merged or deployed.**

## Pins and branch safety

| Item | Value |
|---|---|
| Repository | `zaferdajani/HZD-99` |
| Intake `main` | `2e7fd90d67ff66e2876e0163abce6eaec2d411da` |
| Intake tree | `644ba9431d0540c524065cd88456c1eed03805b6` |
| Intake `odyssey` | same commit as `main` |
| Intake integration branch | `claude/clawbyte-repo-migration-byhyl8`, same commit as `main` |
| Previous review | `codex/studio-review-2026-11-18` at `5d417a548eb582ebe130067a6f06dad55e437082`; not an ancestor of intake `main` |
| Review branch | `codex/studio-review-2026-11-19` |
| Bounded source-fix commit | `6a083b1` |
| Rebuilt-page commit / audit base | `277cca2c7ec204ba86980631b1536c4d998b4081` |

The review began from a clean fresh branch at exact remote `main`. No completed raster asset was regenerated. The latest media, art, rig, projectile and touch changes remain in ancestry. Two apply-ready patches are packaged beside this report for environments that cannot fetch the review branch directly.

## Delta from the 2026-11-18 review

### Confirmed improvements on `main`

- `2e7fd90` records the viewport dimensions with touch visibility measurements, rejects stale portrait measurements after rotation and re-arms observation.
- `fb97336` rewrites 160 music/video containers without re-encoding their content; the static container contract passes.
- Feather, void-lance and ice-shard collision now follows the authored flight-axis length for both player contact and blade swats. Browser verification remains blocked.
- Twenty-one keyed plates plus low-resolution derivatives received cyan-specific defringing. Direct source-asset inspection shows materially less cyan edge on the cheetah.
- TALLYMAN now uses its painted stand plate while the rig carries walking and stand-to-pose transitions.

### Regressions still absent from `main`, restored on this branch

| Fix | Review-branch result | Passing contract |
|---|---|---|
| Four fast captions could evict the oldest unread line | Three visible captions plus FIFO waiting lane; read/shown/reset cover both lanes | `scene-caption-contract.cjs` |
| Ritual language had reverted to Free/Release and PRISM was eligible | Localized PURIFY/PURIFIED copy and ARIA; clean PRISM excluded | `purification-language-contract.cjs` |
| Quest/forge payment used multiple persistent writes | Clone-and-publish settlement, rollback, idempotent presentation and legacy done/no-Purifier repair | `quest-payment-contract.cjs` |
| Generic boss classification gave clean rivals virus smoke | Ordinary infected red, infected guardians purple, clean Alpha/GRAVEHORN/PRISM/instruments none | `infection-eye-authority-contract.cjs` |
| Browser failures could be misclassified | Direct/transitive Playwright detection, executable and AF_UNIX preflight; original timeout/process tests retained | `tools/studio/test_audit.py` (8/8) |

### Still open

- Owner-canon campaign sequence is not implemented.
- Alpha timing and surrender/covenant semantics remain wrong.
- Ratchet and generic NPC restoration remain non-atomic.
- Six non-TALLYMAN purified agents can slide in static pure/kneeling art.
- Terminal fall is not swept through crossed rows; broken-tile cache signs only count, not coordinates.
- PRISM's eye authority is corrected here, but its separate ritual eligibility required this branch fix and still needs the intended stand-down path.
- Duplicate `coin` persistence identity and thin later quest consequences remain.
- Draft 3/Draft 4 manhwa authority remains split; scene parity is uncertified.
- The combat-card PDF remains stale relative to runtime combat constants.

## Automated evidence

### Build and package

| Check | Result |
|---|---|
| `npm ci` | PASS — 161 packages |
| `npm run build` | PASS — `index` 5.20 MB, `odyssey` 3.97 MB, `forge` 5.21 MB, `forge-odyssey` 3.99 MB |
| `npm run app:pack` | PASS — 896 assets (252.5 MB) + 2 pages (9.2 MB), 261.6 MB total |
| syntax / diff checks | PASS |
| audit unit tests | PASS — 8/8 |
| four restored safety contracts | PASS — 4/4 |

### Full audit

Command:

```sh
CHROMIUM_PATH=/usr/bin/chromium python3 tools/studio/audit.py \
  --profile full --output docs/studio/runs/2026-11-19/automated
```

| Result | Count |
|---|---:|
| PASS | 38 |
| BLOCKED | 214 |
| FAIL | 0 |
| TIMEOUT | 0 |
| Total | 252 |

The registry completed without missing or failing checks, but the audit did **not** pass overall. Every browser-dependent check was blocked before page creation because this host denies Chromium's required AF_UNIX socket (`Operation not permitted`). Default Playwright Chromium is also absent. These are infrastructure blocks, not gameplay passes or failures.

Important passing source/headless checks include build, pack, served identity, combat-impact contract, repair lifecycle, panel continuity, media containers, story opening, ledger, all four restored contracts, tutorial controller/clarity, offline release, story progression, input focus, voice handoff, desktop protocol, cave ground, seam route, shadow ground, dialogue audio, weapons, gear, motion sampling, combo routing, grapple/reel contracts, campaign contract and credits.

`script-route` passing is evidence of the problem: it still asserts the obsolete `forge → agent/Sage → CHIME → NULLFANG` order.

Evidence files:

- `automated/AUTOMATED.md`
- `automated/results.json` — SHA-256 `83b18521017cb476c5d0b7b9aaedd0967328ab9648d9ccb87905d28c1f5a952a`
- `automated/AUTOMATED.md` — SHA-256 `11e25bf7782deedfa1af1b4b93495dae59c61dd1b5db6b8b1ad744f9583c0eff`

### Evidence classes

| Evidence class | Status | Honest interpretation |
|---|---|---|
| Exact-source and headless contracts | Completed | Deterministic invariants and source relationships only |
| Staged browser checks | Blocked before page creation | No current rendered assertion ran |
| Stored shipping assets reduced to code-derived size | Inspected | Identity/pose/edge evidence, not a running scene |
| Uninterrupted ordinary-input chapter route | Not completed | No wake-to-chapter-end reachability/fairness claim |
| Physical touch/controller/audio/haptics | Not completed | No hardware or perceptual claim |
| RTL/CJK/200% text/screen-reader | Not completed | No accessibility certification |

## Fifteen-role review matrix

| # | Senior responsibility | Verdict | Highest-value finding |
|---:|---|---|---|
| 1 | Cinematic Designer | HOLD P1 | Runtime scenes certify obsolete story order; caption and ritual language repaired here |
| 2 | Game Designer — Player Systems | TUTORIAL SOURCE PASS / HOLD P1 | One-control tutorial structure is strong; restoration transaction, device route and 200% text are open |
| 3 | Mission Designer — Quest Craft | HOLD P1 | Forge settlement repaired here; Alpha timing, duplicate coin IDs and later consequences remain |
| 4 | Principal Encounter Designer | CONDITIONAL SOURCE PASS / HOLD P1 | Boss kits are distinct; Alpha story resolution and rendered fairness are not acceptable/proven |
| 5 | Boss Designer | HOLD P1 | NULLFANG ritual source is strong; PRISM stand-down, later guardian film policy and runtime proof remain |
| 6 | Mission Designer — Campaign | HOLD P1 | Runtime/tests still certify superseded graph; later cave networks repeat one template |
| 7 | Mission Producer | HOLD P1 | Review branch is bounded and preserves newer work; release evidence and authority gates remain open |
| 8 | Character Artist | CONDITIONAL ASSET PASS / RUNTIME HOLD P1 | Core character art is worth preserving; six agents slide and cheetah pose identity is inconsistent |
| 9 | Cinematic Director | HOLD P1 | Refires and NULLFANG film should be preserved; Draft authority and exact scene parity remain open |
| 10 | VFX Artist | SOURCE PASS / RUNTIME HOLD | Finite eye trails and authority are correct here; runtime/reduced-motion/device proof is blocked |
| 11 | Technical Director — World | HOLD P1 | Terminal falls can tunnel at low Hz; equal-count broken-tile states share a cache signature |
| 12 | Gameplay Engineer — Combat | SOURCE PASS / RUNTIME+LEDGER HOLD | Impact and long-projectile source improved; cards and perceptual/device proof lag runtime |
| 13 | Gameplay Engineer — Mission | HOLD P1 | Atomic forge fixed here; campaign graph, gates and migrations still disagree with canon |
| 14 | Gameplay Engineer — NPC | HOLD P1 | Restoration is non-atomic; only TALLYMAN has a moving rig |
| 15 | Lead UI Engineer | HOLD P1 | Caption FIFO and ritual ARIA fixed here; overlay ownership, localization, scale and hardware proof remain |

## Prioritized findings

| Stable ID | Severity | Player consequence / evidence | Owner and required acceptance | Status |
|---|---:|---|---|---|
| `CAMPAIGN-GRAPH-01` | P1 | Objectives, gates, story sheet and passing test use `forge → agent → CHIME → NULLFANG`, contradicting owner canon | Campaign/Narrative/Mission Eng: update one graph everywhere; ordinary-input Alpha-skip and Alpha-complete routes with death/Continue at every gate | Open |
| `ALPHA-SEMANTICS-01` | P1 | Alpha offer interrupts post-forge main path and generic guardian logic misstates a clean Wolf King | Encounter/Narrative: move after NULLFANG; dedicated living yield/covenant, friendly cyan pack, reward once, controlling agent revealed | Open |
| `QUEST-PAYMENT-ATOMIC-01` | P1 | Multi-write forge could consume marble/finish quest without Purifier | Mission Eng: one cloned save publish, rollback and conservative migration; failure/replay contracts | **Fixed and tested on review branch** |
| `NPC-ATOMIC-01` | P1 | Cell removal, awake/repaired flags, quest and gift persist at separate boundaries | NPC/Save Eng: one transaction; injected failure changes nothing; reload/replay cannot lose cell or duplicate gift | Open |
| `AGENT-WALK-01` | P1 | Six moving purified agents can show a static kneeling plate | Character/NPC Eng: authored pure walk/rig for all seven; stationary pure plate only at zero movement; gameplay-size reload captures | Open |
| `WORLD-FALL-01` | P1 | Final-row-only vertical collision can tunnel or sink about 31.99 px at 30 Hz | World Eng: sweep crossed Y rows; same landing at 30/60/120 Hz; preserve drop-through | Open |
| `WORLD-TILE-01` | P1 | Equal-count/different-coordinate damage states can reuse stale baked terrain | World Eng: sign sorted coordinates; reload visuals/collision agree | Open |
| `PURIFICATION-LANGUAGE-01` | P1 | Visible/ARIA copy contradicted mandated PURIFY and PRISM could enter virus ritual | Boss/UI/Narrative: five-language wording; clean entities excluded; PRISM gets stand-down | **Bounded wording/eligibility fix tested here; stand-down open** |
| `INFECTION-AUTHORITY-01` | P1 | Clean Alpha/GRAVEHORN/PRISM could receive boss-purple virus eyes | VFX/Encounter: explicit infection authority; finite cleanup on cure/death/room/reduced motion | **Fixed and tested on review branch** |
| `SCENE-CAPTION-01` | P1 | Fourth fast caption could destroy unread first caption | UI/Cinematic: visible-three + FIFO; reset/read/shown include both lanes | **Fixed and tested on review branch** |
| `MANHWA-AUTH-01` | P1 | Draft 3 and Draft 4 both claim authority; all edition rows remain uncertified | Cinematic/Narrative: pin one edition and certify identity/equipment/action/room/spoiler/runtime capture per scene | Open |
| `RUNTIME-EVIDENCE-01` | P1 gate | No current browser page, playthrough, device, audio, haptic or accessibility evidence | Producer/QA: browser-capable host plus physical devices and recorded build commit | Blocked |
| `QUEST-COIN-ID-01` | P2 | A7/D2/A11/A13 share persistent `coin` identity and can suppress later rewards | Mission Eng: unique placement IDs, conservative migration, all acquisition orders | Open |
| `CAVE-VARIETY-01` | P2 | Later kingdom caves reuse grotto/tunnel/deep bat-terminal-scrap-agent template | World/Mission: kingdom-specific verb, payoff, persistent transformation and later callback | Open |
| `CHEETAH-IDENTITY-01` | P2 | Rest is slim quadruped; coil/lunge change build and palette | Character Art: re-author only inconsistent states from one locked model/palette/scale/light reference | Open |
| `COMBAT-CARDS-01` | P2 | PDF says 45/65/85 ms and 5/9/14 fragments; runtime uses 110/140/170 ms and 10/15/22 | Combat/Data: regenerate from exact build and contract-extract values | Open |

## Owner story and campaign authority

The latest explicit authority in `docs/STORY_CANON.md` is:

1. GRAVEHORN guards the raw marble repository.
2. Ratchet forges the Purifier from earned marble.
3. NULLFANG is the first corrupted guardian and is purified, never killed or merely “freed.”
4. The optional Wolf King branch occurs after NULLFANG.
5. The Wolf King yields and exposes the pack-controlling Eye agent; Alpha is not infected.

Current objectives, progress gates, story sheet, opening objectives and `script-route` still express an older path. Fixing isolated copy is insufficient. The chosen graph must be propagated atomically through room gates, objective selection, dialogue, panels, map reward, quest availability, save/Continue migration and tests.

## Cave and quest census

| Space | Current value | Decision |
|---|---|---|
| A5 | puzzle, Magnet/Volt upgrade and quarry route | Meaningful; preserve |
| A7 | survey evidence; Ratchet errand completes on reading terminal 20 | Meaningful; preserve read-based completion |
| CV1 | permanent spare-core reward | Meaningful |
| CV1B | one-ring survey, scrap and visibly teased future-skill cache | Meaningful implementation; documentation wrongly claims onward mouth/shortcut/rest |
| CV2 | Deaf System evidence and beacon resolution | Meaningful |
| CV3 | GRAVEHORN, raw marble and changed return passage | Meaningful and story-critical |
| A10R/A10/GA2 branch | Alpha, pack allegiance and cache | Meaningful topology; wrong timing and resolution semantics |
| GB1/GC1/GD1/GX1/GE1 families | repeated grotto/tunnel/deep with bat, terminal, scrap and agent | P2 repetition; each needs a distinct verb and lasting consequence |

Quest strengths remain: Ratchet motivates the cave and Purifier; marble is earned; A7 uses evidence rather than room entry; Alpha has a meaningful pack-allegiance reward concept. Weaknesses remain: several later errands mainly pay scrap/IQ without a visible persistent world consequence, and duplicate reward identity can suppress content.

## Manhwa and cinematic parity

| Area | Current evidence | Decision |
|---|---|---|
| Edition authority | `STORY_CANON` says Draft 3; full story/edition say Draft 4 | P1: pin one authority |
| November refires | 18 completed panels remain present | Preserve; do not regenerate wholesale |
| Full-scene parity | All 32 edition rows remain not certified | Scene-level certification required |
| `ch2_b` UNDERTOW teaser | Flooded cyan cable-ring/weed composition is closer to UNDERTOW; defining sluice wheel not unequivocal | Owner identity-lock review; bounded correction only if rejected |
| NULLFANG ritual film | 1280×720, 24 fps, 13.25 s, H.264/AAC; prior asset-level visual/audio fade remains valid | Preserve; current live handoff unverified |
| Ratchet wake film | 1920×1080, 24 fps, 6.04 s, video-only; live-character mismatch remains | Bounded correction/audio handoff review |
| Intro/forge films | Container rewritten only; shot content unchanged | Preserve container fix; verify perceptual ending on phone |

## Character, animation, VFX, audio and combat

| Subject | Assessment | Acceptance |
|---|---|---|
| Seven Eye agents | Distinct silhouettes and props survive reduction to about 100–115 px | Record infected combat, ritual, idle, walk, turn and reload for each; no slide/scale pop/foot drift |
| TALLYMAN | Fired plates plus current mixed rig/stand are coherent | Preserve; verify big-pose cuts and transitions live |
| Other six agents | No dedicated rig; moving tamed agent can select static pure plate | P1 authored pure movement for each identity |
| Alpha and wolves | Coherent wolf-specific silhouettes/states at calculated gameplay size | Preserve art; fix sequence and covenant semantics |
| GRAVEHORN | Strong scale, horn, turn and rear coverage | Preserve; validate tells/contact/recovery live |
| Cheetah | Defringe improved cyan edge, but pose family changes body/palette | Re-author only mismatched states |
| Infection trails | 1.5 s ±25%, quality caps 90/170/260/320, threshold/spacing/teleport reset, fixed cleanup, reduced-motion suppression | Source pass here; record red ordinary and purple infected guardian examples plus zero clean/reduced-motion smoke |
| Purification VFX | Hold, inward white motes, bright sword, slash, flash/shake, black transition, dark extraction and gold return exist in source | Record full ritual, skip/reload, audio fade and engine fallback |
| Hit feel | 110/140/170 ms flash; 10/15/22 metal fragments; stronger stop/shake/recoil/rumble | Source contract pass; physical listening/haptics and real-input feel still required |
| Long projectiles | Drawn-length collision added for feather/lance/shard | Run staged check; add/confirm explicit blade-tip swat assertion and live capture |
| Media | 160 containers non-fragmented and index-first | Static pass; phone start/loop/seek and non-abrupt ending still required |

## UI, localization and accessibility gaps

- Caption FIFO and localized ritual ARIA are fixed on this branch.
- Full-screen overlay ownership remains incomplete and duplicate non-story requests are not centrally bounded/coalesced.
- English has 620 keys, Arabic 601; Turkish/Chinese/Russian critical paths still rely heavily on English fallback.
- There is no 100/125/150/200% persisted text-scale setting.
- Canvas dialogue, objectives and rotate notice lack a complete semantic focus/live-announcement layer.
- Reduced motion is not yet one authoritative policy across every VFX, camera, cinematic and repair path.
- Rotation source is improved, but viewport emulation is not physical iOS/Android proof.

## Implemented, tested, inspected, integrated and deployed

| State | Result |
|---|---|
| Implemented on this review branch | Four bounded safety fixes, four contracts, honest browser preflight, generated pages |
| Tested | Build, pack, 38 source/headless audit entries; impacted contracts pass |
| Visually inspected | Exact shipping asset samples at calculated gameplay size, not live runtime |
| Integrated to `main` | **No** |
| Deployed to production | **No** |

## Exact commands and results

```sh
npm ci                                      # PASS, 161 packages
npm run build                               # PASS
npm run app:pack                            # PASS
python3 tools/studio/test_audit.py          # PASS, 8 tests
node tests/scene-caption-contract.cjs       # PASS
node tests/purification-language-contract.cjs # PASS
node tests/infection-eye-authority-contract.cjs # PASS
node tests/quest-payment-contract.cjs       # PASS
CHROMIUM_PATH=/usr/bin/chromium python3 tools/studio/audit.py --profile full --output docs/studio/runs/2026-11-19/automated
# 38 PASS, 214 BLOCKED, 0 FAIL, 0 TIMEOUT; overall non-pass
```

## Release recommendation

Keep this branch isolated. Integrate the four bounded fixes while preserving the newer rotation/media/art/projectile work, then resolve campaign authority before adding more generated scenes or characters. The next implementation pass should prioritize sequence/state correctness, all-agent movement, NPC atomicity and world collision. Existing hero, agent, Alpha, wolf, GRAVEHORN, manhwa and NULLFANG ritual assets should be reused.

