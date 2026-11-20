# CLAWBYTE Senior Studio Review — 2026-11-20

## Executive decision

**RELEASE HOLD — P1.** Four new `main` commits materially improve how chapter one is presented: less text, Ratchet explanations paired with existing comic shots or demonstrations, redundant comics removed where films already tell the event, an owed panel carried through a doorway, a defeated cheetah allowed to finish its fold, and NULLFANG given an authored turn–leap–gallop exit instead of sliding away. Preserve that work.

The underlying campaign remains out of alignment with the owner's latest story. Runtime and a passing route test still enforce `forge → Eye agent → CHIME → NULLFANG`; Alpha is offered immediately after forging and is still described as infected/purifiable. Six rescued agents can move in a kneeling plate, NPC restoration is non-atomic, two world-integrity defects remain, later cave networks repeat one template, and manhwa authority is still split.

Exact `main` also introduced a deterministic red source-test regression: `campaign-contract` referenced the removed `forge` panel when constructing its late-cave fixture. This review repaired the fixture explicitly, without weakening fail-closed chronology.

The four bounded safety corrections from 2026-11-19 were not integrated into `main`. They still applied cleanly over today's story work and were restored here: non-lossy caption FIFO, PURIFY/PURIFIED terminology and clean-entity eligibility, atomic quest/forge settlement, and explicit red/purple infection-eye authority. Their contracts pass.

No browser page could open on this host because Chromium cannot create its required Unix socket. There is therefore **no fresh uninterrupted ordinary-input playthrough, no live current-build gameplay capture, and no physical phone/controller/audio/haptic/accessibility proof**. Shipping assets and diagnostic screenshots were inspected at reduced/calculated gameplay size and are labelled separately.

This is a review branch only. **Production was not merged or deployed.**

## Pins and branch safety

| Item | Value |
|---|---|
| Repository | `zaferdajani/HZD-99` |
| Intake `main` | `e7b1e8dd549c0c82fe7428372d11f618c59a1412` |
| Intake tree | `9aa3b5f24f5e8f35392915c446df6ce65ab44f9e` |
| Intake `odyssey` | same commit as `main` |
| Intake integration branch | `claude/clawbyte-repo-migration-byhyl8`, same commit as `main` |
| Previous review | `codex/studio-review-2026-11-19` at `cb54d14…`; not an ancestor of intake `main` |
| Review branch | `codex/studio-review-2026-11-20` |
| Bounded source-fix commit | `986a8df` |
| Rebuilt-page commit / audit base | `7400831a20e97f574e6e7a8d94d6366bb0ace1c6` |

The branch was created from a clean exact remote `main`. No finished raster asset was regenerated. The new lite-text, panel, glimpse, cheetah, touch, media, projectile, rig and defringe work remains in ancestry.

## What changed since the 2026-11-19 review

### Positive changes on `main`

- `e13d006`: the memory nodes no longer spawn road comics, the defeated cheetah's animation clock continues, and NULLFANG turns, leaps and gallops away instead of sliding.
- `64e0c98`: a 112-key concise chapter-one layer exists in all five configured languages, with current-binding tutorial prompts, hold progress and dialogue-shot support.
- `e0f78f5`: a story beat that became due in a departed room can be queued over the next doorway instead of being silently lost.
- `e7b1e8d`: Ratchet's cell/marble explanations use line-level comic shots and comics are suppressed where wake/forge/purification films already carry the beat.
- Static inspection confirms the 112 lite keys exist in English, Arabic, Turkish, Chinese and Russian with no missing keys.
- The authored Ratchet shots are readable at their intended 384×216 area. The new direction—one short line plus one relevant image—is materially clearer than the earlier paragraph flow.

### New defects or risks

| ID | Severity | Finding |
|---|---:|---|
| `CAMPAIGN-CONTRACT-20` | P1 test gate | Exact-main `campaign-contract` used removed `forge` to place `cave`; suite failed despite the certificate failing closed. Fixed here by moving `cave` explicitly after `marble`. |
| `GLIMPSE-COLD-LOAD-01` | P2 | NULLFANG's teaser begins only before an X threshold and after all five strips decode; a cold phone can cross before decode and miss the scene. The staged test preloads manually. |
| `PANEL-DUE-PERSIST-01` | P2 | Cross-doorway `PN.due`/queue is memory-only. Save/quit between departure and playback may lose the owed beat. |
| `R-MARBLE-CONTINUITY-01` | P1 visual story | `r_marble.webp` shows a sword-shaped glow under the meadow before forging, contradicting raw rounded marble being found and the sword being forged later. |
| `DIALOG-SHOT-A11Y-01` | P2 | Dialogue shots improve sighted comprehension but have no semantic alternative/description for assistive technology. |
| `PURIFICATION-CAPTURE-01` | P2 | Refreshed diagnostic screenshots still show Free/Release copy; the restored capture contains debug/editor overlays. They are not studio-ready proof. |

### Restored bounded corrections

| Fix | Branch result | Passing contract |
|---|---|---|
| Four fast captions evicted unread story | Three visible entries plus FIFO waiting lane; read/shown/reset include both | `scene-caption-contract.cjs` |
| Ritual copy said Free/Release and clean PRISM could enter extraction | Localized PURIFY/PURIFIED copy and ARIA; PRISM excluded | `purification-language-contract.cjs` |
| Quest/forge payment used multiple persistent writes | Clone-and-publish, rollback, idempotent presentation and legacy done/no-Purifier repair | `quest-payment-contract.cjs` |
| Generic boss classification gave clean rivals virus smoke | Ordinary infected red, infected guardian purple, clean Alpha/GRAVEHORN/PRISM/instruments none | `infection-eye-authority-contract.cjs` |
| Browser checks could be misclassified | Direct/transitive Playwright, executable and AF_UNIX preflight; original budget/exit/descendant tests retained | `tools/studio/test_audit.py` — 8/8 |
| Campaign negative fixture was stale | Fixture now constructs the intended cave-after-marble violation and still fails closed | `campaign-contract.cjs` |

## Automated evidence

### Build and package

| Check | Result |
|---|---|
| `npm ci` | PASS — 161 packages |
| `npm run build` | PASS — `index` 5.24 MB, `odyssey` 4.02 MB, `forge` 5.26 MB, `forge-odyssey` 4.04 MB |
| `npm run app:pack` | PASS — 893 assets (252.3 MB) + 2 pages (9.3 MB), 261.6 MB total |
| syntax and diff checks | PASS |
| audit unit tests | PASS — 8/8 |
| restored safety contracts | PASS — 4/4 |
| repaired campaign contract | PASS |

### Full audit

```sh
CHROMIUM_PATH=/usr/bin/chromium python3 tools/studio/audit.py \
  --profile full --output docs/studio/runs/2026-11-20/automated
```

| Result | Count |
|---|---:|
| PASS | 38 |
| BLOCKED | 215 |
| FAIL | 0 |
| TIMEOUT | 0 |
| Total | 253 |

The registry completed with no missing test and no executed failure, but the audit did **not** pass overall. All browser-dependent checks—including the new `text-budget` suite—were blocked before page creation because the host denies Chromium's required AF_UNIX socket. This is an infrastructure block, not evidence that rendered assertions passed or failed.

Important passing source/headless checks include build, package, served identity, combat-impact contract, repair lifecycle, panel continuity, media containers, story opening, ledger, all four restored safety contracts, tutorial controller/clarity, story progression, input focus, cave ground, seam route, shadow ground, dialogue audio, weapons, gear, motion sampling, combo routing, grapple/reel contracts, campaign contract and credits.

`script-route` passing remains evidence of the campaign mismatch: it explicitly announces `forge < sage < CHIME < NULLFANG`.

Evidence:

- `automated/AUTOMATED.md`
- `automated/results.json` — SHA-256 `9fd6af65a0c3e1a7f7eaffbe64604fbc67294f77196c09f4b64b94aea93e7caf`
- `automated/AUTOMATED.md` — SHA-256 `4552f16b930e748f2df7deb4d040ab4ac08d84eef6720146ad5729283a65c575`

### Staged versus uninterrupted evidence

| Evidence class | Status | Interpretation |
|---|---|---|
| Exact source/headless contracts | Completed | Deterministic invariants and data relationships |
| Staged browser checks | Blocked before page creation | No current render assertion executed |
| Stored assets and diagnostic frames | Inspected | Identity/composition evidence, not a live scene |
| Uninterrupted ordinary-input campaign | Not completed | No wake-to-teaser reachability/fairness certificate |
| Physical touch/controller/audio/haptics | Not completed | No hardware or perceptual certificate |
| RTL/CJK/200% text/screen reader | Not completed | No accessibility certificate |

## Fifteen-role review matrix

| # | Senior responsibility | Verdict | Highest-value finding |
|---:|---|---|---|
| 1 | Cinematic Designer | HOLD P1 | New concise shot/panel flow is better; campaign order, captions and manhwa authority still block |
| 2 | Game Designer — Player Systems | TUTORIAL SOURCE PASS / HOLD P1 | One-control onboarding is clearer; restoration atomicity, text scaling and real-input proof remain |
| 3 | Mission Designer — Quest Craft | HOLD P1 | Marble hunt is meaningful; Alpha premise/timing, duplicate coin identity and thin later consequences remain |
| 4 | Principal Encounter Designer | CONDITIONAL SOURCE PASS / HOLD P1 | NULLFANG exit and cheetah clock improved; Alpha resolution, cold-load and live fairness remain |
| 5 | Boss Designer | HOLD P1 | Strong distinct kits and ritual choreography; clean-rival authority and physical proof remain |
| 6 | Mission Designer — Campaign | HOLD P1 | New presentation makes the obsolete graph clearer rather than fixing it; cave families still repeat |
| 7 | Mission Producer | HOLD P1 | Bounded review fixes preserved the new work; release authority and runtime evidence remain incomplete |
| 8 | Character Artist | CONDITIONAL ASSET PASS / RUNTIME HOLD P1 | NULLFANG/cheetah motion work is useful; six agent slides and cheetah family mismatch remain |
| 9 | Cinematic Director | HOLD P1 | Duplicate beats reduced; Draft split, marble/sword continuity and clean handoff proof remain |
| 10 | VFX Artist | SOURCE CONDITIONAL PASS / RUNTIME HOLD | Finite trails are strong; authority corrected here, runtime/reduced-motion/device proof blocked |
| 11 | Technical Director — World | HOLD P1 | Terminal fall and broken-tile signatures remain; doorway panel debt is not persisted |
| 12 | Gameplay Engineer — Combat | SOURCE PASS / RUNTIME+LEDGER HOLD | Impact and motion sources are strong; cards and real feel/haptics remain unverified |
| 13 | Gameplay Engineer — Mission | HOLD P1 | Campaign fixture repaired and atomic forge restored here; canonical graph/migrations still open |
| 14 | Gameplay Engineer — NPC | HOLD P1 | Restoration remains non-atomic; six purified agents still lack real moving states |
| 15 | Lead UI Engineer | HOLD P1 | Lite text/visual prompts improve clarity; overlay ownership, alt text, scale and device proof remain |

## Prioritized findings

| Stable ID | Severity | Player consequence / evidence | Owner and acceptance | Status |
|---|---:|---|---|---|
| `CAMPAIGN-GRAPH-01` | P1 | Runtime still sends forge → agent → CHIME → NULLFANG | Campaign/Narrative/Mission: one graph everywhere; ordinary-input Alpha-skip and Alpha-complete routes with death/Continue at each gate | Open |
| `ALPHA-SEMANTICS-01` | P1 | Concise copy now clearly calls clean Alpha infected and purifiable, before NULLFANG | Encounter/Narrative: post-NULLFANG living covenant, friendly cyan pack, reward once, controlling agent reveal | Open |
| `QUEST-PAYMENT-ATOMIC-01` | P1 | Partial persistence could finish forge without Purifier | Mission Eng: one cloned publish, rollback and migration | **Fixed/tested here** |
| `NPC-ATOMIC-01` | P1 | Ratchet/Servo cell, wake, flags, quest and gift persist separately | NPC/Save Eng: one idempotent transaction; injected failures and reload/replay matrix | Open |
| `AGENT-WALK-01` | P1 | Six moving purified agents can wear a kneeling plate | Character/NPC: authored pure movement for all seven; gameplay-size turn/reload captures | Open |
| `WORLD-FALL-01` | P1 | Final-row-only vertical collision can tunnel/sink about 32 px at 30 Hz | World: sweep crossed rows; same landing at 30/60/120 Hz | Open |
| `WORLD-TILE-01` | P1 | Equal-count/different-coordinate break states can reuse stale terrain | World: sign sorted coordinates; reload visuals/collision agree | Open |
| `R-MARBLE-CONTINUITY-01` | P1 | Panel visually places a sword under the meadow before Ratchet forges it | Cinematic/Art: bounded repaint to raw rounded marble repository; preserve hero/Ratchet/environment | Open |
| `PURIFICATION-LANGUAGE-01` | P1 | Visible/ARIA wording and clean PRISM eligibility contradicted canon | Boss/UI/Narrative: five-language PURIFY and clean-entity exclusion; PRISM stand-down | **Bounded copy/eligibility fix tested here; stand-down open** |
| `INFECTION-AUTHORITY-01` | P1 | Clean Alpha/GRAVEHORN/PRISM/instruments could wear purple virus smoke | VFX/Encounter: explicit authority plus finite cleanup | **Fixed/tested here** |
| `SCENE-CAPTION-01` | P1 | Fourth fast caption destroyed unread first line | UI/Cinematic: visible-three + FIFO and reset semantics | **Fixed/tested here** |
| `MANHWA-AUTH-01` | P1 | Draft 3 and Draft 4 both claim authority; 32 rows uncertified | Cinematic/Narrative: pin edition; certify identity/equipment/action/room/spoiler/runtime capture | Open |
| `RUNTIME-EVIDENCE-01` | P1 gate | No browser, uninterrupted playthrough, device, audio, haptic or accessibility proof | Producer/QA: browser-capable host plus recorded exact build and physical devices | Blocked |
| `CAMPAIGN-CONTRACT-20` | P1 test gate | Exact-main deterministic test failed after panel list change | Mission QA: construct explicit cave-after-marble violation; keep certificate fail-closed | **Fixed/tested here** |
| `GLIMPSE-COLD-LOAD-01` | P2 | A slow first load may cross trigger before turn/leap strips decode and miss teaser | Encounter/Engineering: latch arrival until decoded; artificial delayed-load ordinary-input test | Open |
| `PANEL-DUE-PERSIST-01` | P2 | Save/quit during doorway carryover may lose owed story beat | World/Cinematic: persist or reconstruct; save/reload contract | Open |
| `QUEST-COIN-ID-01` | P2 | A7/D2/A11/A13 share `coin` identity and can suppress rewards | Mission: unique placement IDs plus conservative migration | Open |
| `CAVE-VARIETY-01` | P2 | Later kingdom caves repeat one bat/terminal/scrap/agent template | World/Mission: kingdom-specific verb, payoff, transformation and callback | Open |
| `CHEETAH-IDENTITY-01` | P2 | Rest/down and warning/attack states change body build and palette | Character Art: bounded re-author from one locked model/palette/scale/light reference | Open |
| `COMBAT-CARDS-01` | P2 | PDF impact constants lag runtime 110/140/170 ms and 10/15/22 fragments | Combat/Data: regenerate from exact source and contract-check | Open |

## Owner story and campaign authority

The current owner authority remains:

1. GRAVEHORN guards the raw marble repository.
2. Ratchet forges the Purifier from the earned marble.
3. NULLFANG is the first corrupted guardian and is purified.
4. The optional Wolf King branch occurs after NULLFANG.
5. Alpha is clean, yields/forms a covenant and exposes the infected pack-controlling Eye agent.

Current objectives, lair requirements, Alpha offer and passing script test still implement another sequence. The new concise language makes that wrong sequence easier to understand; it does not make it canonical. The repair must cover rooms, objectives, gates, dialogue, panels, map reward, quest availability, saves/Continue migration and tests together.

## Cave and quest census

| Space | Current value | Decision |
|---|---|---|
| A5 | puzzle, Volt/Magnet upgrade and quarry route | Meaningful; preserve |
| A7 | survey evidence and read-based Ratchet quest | Meaningful |
| CV1 | permanent spare-core reward | Meaningful |
| CV1B | one-ring survey, scrap and future-skill cache | Meaningful implementation; documentation still wrong |
| CV2 | Deaf System evidence and beacon | Meaningful |
| CV3 | GRAVEHORN, raw marble and return passage | Strong and story-critical |
| GA1T/GA1/GA1D | tunnel, rest and Eye agent | Meaningful content, wrong campaign position |
| A10/GA2 | Alpha, pack allegiance and cache | Meaningful optional topology, wrong timing/semantics |
| GB1/GC1/GD1/GX1/GE1 | repeated grotto/tunnel/deep with bat, terminal, scrap and agent | P2 repetition |

## Manhwa and cinematic parity

| Area | Current evidence | Decision |
|---|---|---|
| Authority | `STORY_CANON` names Draft 3; full story/edition name Draft 4 | P1 pin one edition |
| November refires | 18 completed panels remain | Preserve; do not regenerate wholesale |
| Full scenes | 32 edition rows remain uncertified | Scene-level matrix required |
| Retired bay panels | Removed from runtime and archived | Positive; preserve archive |
| Ratchet line shots | `r_cell` is coherent; `r_marble` incorrectly previews sword under meadow | Preserve system; bounded marble correction |
| Wake/forge/purification | Comics correctly library-only where films tell event | Positive source direction; live handoff unverified |
| NULLFANG film | Existing authored fade should remain | Preserve; perceptual audio/return unverified |
| Purification screenshots | Show requested phases but retain Free/Release and debug overlay | Diagnostic only; refresh after runtime fix |

## Character, animation, VFX and combat

| Subject | Assessment | Acceptance |
|---|---|---|
| NULLFANG exit | Existing turn/leap/gallop art replaces slide; source motion has turn, lift, travel and anchor compensation | Preserve; verify cold load and live transition |
| Cheetah defeat | Disabled-state clock now lets 0.8 s fold reach lying cell | Preserve clock; capture full fight/fold/lie at 107–129 px |
| Cheetah family | Warning/attack states still change body/palette from rest/down | Bounded family correction only |
| Seven Eye agents | Distinct art remains; only TALLYMAN has a real rig | Record infected combat, ritual, idle, walk, turn and reload for all seven |
| Alpha/wolves/GRAVEHORN | Distinct completed art and kits remain | Preserve; fix story authority rather than regenerating |
| Infection trails | 1.5 s ±25%, caps 90/170/260/320, threshold/spacing/teleport reset, finite cleanup/reduced motion | Authority fixed here; live red/purple/zero-clean captures required |
| Purification VFX | White inward motes, charge, slash, flash/shake, black transition, dark extraction and gold restore exist | Record film/fallback/cancel/skip/reload and clean wording |
| Hit feel | 110/140/170 ms flash, 10/15/22 fragments and escalating stop/shake/recoil/rumble | Source pass; real input, sound and haptic proof required |
| Media | 160 containers remain plain/index-first | Static pass; phone playback/ending still required |

Visual evidence contact: `visual-gameplay-size-sample.png`. It contains the Ratchet shots, diagnostic ritual phases and reduced cheetah frames. It is not a live runtime capture.

## UI, localization and accessibility

- The concise 112-key layer is complete across five configured languages, but the wider product still falls back to English.
- Caption FIFO and purification ARIA are fixed on this branch.
- Dialogue images lack semantic alternatives.
- Full-screen overlay ownership remains incomplete; non-story requests are not centrally bounded/coalesced.
- There is no persisted 100/125/150/200% text scaling.
- Critical canvas messages lack complete focus/live-region equivalents.
- Reduced motion is not one authoritative policy across every VFX/camera/cinematic/repair path.
- Physical rotation, safe areas, touch targets, controller focus and screen readers remain unverified.

## Implemented, tested, inspected, integrated and deployed

| State | Result |
|---|---|
| Implemented on review branch | Four restored safety fixes, honest browser preflight, campaign fixture repair, rebuilt pages |
| Tested | Build/package, 38 source/headless audit entries and focused contracts |
| Visually inspected | Shipping panels/character frames and diagnostic screenshots at reduced/calculated gameplay scale |
| Integrated to `main` | **No** |
| Deployed to production | **No** |

## Commands and results

```sh
npm ci                                      # PASS, 161 packages
python3 tools/studio/test_audit.py          # PASS, 8 tests
node tests/scene-caption-contract.cjs       # PASS
node tests/purification-language-contract.cjs # PASS
node tests/infection-eye-authority-contract.cjs # PASS
node tests/quest-payment-contract.cjs       # PASS
node tests/campaign-contract.cjs            # PASS after bounded fixture repair
npm run build                               # PASS
npm run app:pack                            # PASS
CHROMIUM_PATH=/usr/bin/chromium python3 tools/studio/audit.py --profile full --output docs/studio/runs/2026-11-20/automated
# 38 PASS, 215 BLOCKED, 0 FAIL, 0 TIMEOUT; overall non-pass
```

## Release recommendation

Keep the branch isolated. Integrate the bounded safety/test fixes while preserving the concise-text, dialogue-shot, doorway-panel and motion work. Resolve the canonical campaign before generating more characters or scenes. The next implementation pass should prioritize campaign/state correctness, all-agent movement, NPC atomicity, world collision, the marble-before-sword visual contradiction and an environment where the game can actually be played and captured.

