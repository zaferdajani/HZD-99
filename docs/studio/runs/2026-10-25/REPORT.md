# CLAWBYTE senior studio review — 2026-10-25

## Executive decision

**Keep this as a review branch. Do not merge or deploy yet.**

The current Chapter One mandatory route is coherent and completable. A fresh,
cleared-storage, ordinary-keyboard run completed in **21:57**, reached B1,
completed all **9/9 mandatory missions**, displayed all **16/16 manhwa panels
in exact order**, and reported no panel or page errors. It used the game's own
rules, suffered three ordinary deaths, and recovered without save, inventory,
position, health, terrain or mission-state injection.

The full immutable-snapshot collector completed its requested scope with
closed-file log integrity: **199 pass / 2 fail**. The two original failures are
preserved. Room-cache passed independently, classifying its 630 ms full-suite
spike as host-load variance rather than a reproduced product defect. GRAVEHORN
reproduced two test-driver races: an external poll pressed jump before the
measured safe window and could miss the entire perfect-guard wind-up. The
bounded change in `tests/gravehorn.cjs` schedules the same real keyboard events
against the encounter simulation clock; no game code or balance changed.

Release remains held. GRAVEHORN still lacks production artwork, literal
body/prop continuity is missing from important manhwa beats, four guardian
purification films are absent, optional Alpha/cave loops lack uninterrupted
natural-play proof, and no physical phone/controller/haptic/thermal/listened
audio certificate exists. Gameplay-scale captures also reveal excessive
simultaneous notification stacking during Sage and lion rewards.

No production asset was regenerated. Approved hero, pack/Alpha, crystal,
purifier sword, NULLFANG/lion and Talon work is preserved.

## Repository and publication state

| Item | Value |
|---|---|
| Review branch | `codex/studio-review-2026-10-25` |
| Review parent | `9ccdba3a1be707a2f53fdf61c61078090d7eaa69` |
| Parent tree | `7a56dd36b691f89eb81d28b6ed5bb8fa27ce114c` |
| Production `main` at intake | `62d75d204c6f6264f25150bb419fc262ff2c18ea` |
| Claude integration at intake | `62d75d204c6f6264f25150bb419fc262ff2c18ea` |
| Upstream/source/art delta since October 24 | None |
| Production game files changed today | None |
| Evidence-driver files changed | `tests/gravehorn.cjs` only |
| Merged | No |
| Deployed | No |

The pipeline, role registry and all 15 role mandates were read. Responsibilities
were grouped into design (1–6), art/cinematic/VFX (7–9), engineering (10–14)
and producer (15), with independent verdicts below.

## Fifteen senior-role verdicts

| # | Senior responsibility | Verdict | Evidence / required action |
|---:|---|---|---|
| 1 | Cinematic Designer | Issues | All 16 triggers pass; cradle/lamp reach, battery insertion, marble carry, forge contact, cable catch, CHIME opening and hero ritual acting remain literal-action gaps. |
| 2 | Game Designer — Player Systems | Pass host mandatory route; device open | Fresh campaign and desktop/phone-size opening route pass. Phone-size is keyboard input in a touch-capable viewport, not physical touch. |
| 3 | Mission Designer — Quest Craft | Pass mandatory; optional issue | Mandatory cause/effect loop completes. Optional acquisition → return → consequence → reload remains staged rather than naturally played. |
| 4 | Principal Encounter Designer | Mechanics pass; presentation issue | Mandatory encounters and topology pass. GRAVEHORN art is P1; physical feel remains unverified. |
| 5 | Senior Boss Designer | Mechanics pass; art/film issue | NULLFANG and Alpha remain distinct. Hero ritual performance and four guardian-specific films remain open. |
| 6 | Senior Mission Designer — Campaign | Pass mandatory continuous route | Fresh 21:57 run reaches B1 with all missions/panels; Alpha and optional cave returns were excluded. |
| 7 | Senior Character Artist | Issues | GRAVEHORN, bound-recovery strips, Furnace pose set and hero ritual body set remain unfinished. |
| 8 | Cinematic Director | Issues | Correct sequence passes. Four ritual films, four GRAVEHORN intercuts and three panel corrections remain. |
| 9 | Senior VFX Artist II | Host contract pass; device open | Red/purple finite eye contracts pass fresh; sustained physical-device profiling is absent. |
| 10 | Associate Technical Director — World Systems | Pass mandatory; timing/device open | World graph, terrain, bake, campaign recovery and cache contracts pass; one full-suite cache spike did not reproduce independently. |
| 11 | Gameplay Engineer — Combat | Pass source/browser; device open | Central stats, held-hit scaling, feedback stack and bounded log pass; listened mix and real haptics remain open. |
| 12 | Gameplay Engineer — Mission | Pass mandatory; optional open | Gates, saves and purification sequence complete; optional loops lack uninterrupted evidence. |
| 13 | Gameplay Engineer — NPC | Pass host | Rescued Sage walk/idle and Servo role/scale pass. Physical touch interaction remains open. |
| 14 | Lead UI Engineer | Pass automated contracts; visual issue/device open | Gradual text, RTL/CJK and ordered opening pass; reward-notification density is excessive in captured gameplay. |
| 15 | Senior Mission Producer | Hold integration/release | Mandatory evidence is strong; P1 art, literal acting, optional-route and device gates remain. |

Discipline reports: [DESIGN.md](DESIGN.md), [ART.md](ART.md), and
[ENGINEERING.md](ENGINEERING.md).

## Findings register

| ID | Severity | Status | Evidence / player consequence | Acceptance owner |
|---|---|---|---|---|
| OPEN-ORDER-24 | P1 evidence | **Host closed; device open** | Fresh full collector reaches Servo in desktop and phone-size modes with every ordered step and no errors. | UI/QA: preserve semantic waits; add real touch hardware. |
| QA-RECOVERY-24 | P1 evidence | Closed | Fresh campaign recovered through three ordinary deaths and reached B1. | QA: preserve input-only planner behavior. |
| GH-HARNESS-25 | P1 evidence | **Closed by bounded driver fix** | Original run pressed jump at 0.194 s although measured clear window began near 0.30 s; another run produced no guard input. Real key events are now simulation-clock scheduled; final isolated GRAVEHORN run passes. | QA: preserve original failures and corrected evidence; never alter encounter balance to satisfy harness. |
| ROOMCACHE-25 | P2 performance evidence | Non-reproduced | Full suite saw 630 ms pre-bake frame; isolated rerun passed all cache/frame assertions. | Tech/QA: profile on target devices under sustained load. |
| GH-ART | P1 art | Open | No `assets/characters/gravehorn/`; runtime explicitly uses fallback rendering. | Character/cinematic art: full authored set plus four intercuts. |
| MANHWA-PERF-01 | P1/P2 presentation | Open | Panels are correct, but seven key physical actions lack body/prop continuity. | Cinematic/animation: parity ledger and gameplay evidence. |
| DEVICE-24 | P1/P2 evidence | Open | Physical touch, controller, haptics, thermal/frame-time and subjective audio are unknown. | QA/UI/audio: device matrix. |
| UI-DENSITY-25 | P2 UI | Open | Fresh Sage/lion reward frames show 3+ concurrent notices competing with goal, stats and reward text. | UI: priority queue, safe zones, finite notice count, phone proof. |
| RITUAL-FILMS | P2 cinematic | Open | Brood/Atlas/Zero/Prism still use fallback presentation. | Cinematic: four resolved extraction films. |
| BOUND-ART-01 | P2 art | Open | Bound wolf/cheetah defeated forms are tiny/flattened. | Character art: down/breathe/recover strips. |
| FURNACE-ART | P2 art | Open | Breath/blast/spent/gather/dive/bell states lack authored poses. | Character art. |
| PURIFY-ART-01 | P2 art | Open | Sword/light effects exist without continuous hero hand/hilt body acting. | Character/VFX: raise → hold → slash → recover. |
| PANEL-CORRECT-23 | P2/P3 art | Open | Red boss eyes, powered inactive Servo and off-model passage hero break continuity. | Art: localized edits only. |
| OPT-QUEST-24 | P2 evidence | Open | Alpha and optional cave returns are not naturally proven end-to-end. | Mission/QA: discovery through reload. |
| EYE-VFX-24 | Host pass | Device gate open | Fresh infection-eyes, infection-roster and infection-poses tests pass. | VFX/QA: sustained physical-device test. |

## Continuous play versus staged evidence

| Evidence | Result | Honest scope |
|---|---|---|
| Fresh cleared-storage campaign | **Certified 21:57**, easiest, 3 deaths, 9/9 missions, 16/16 ordered panels, B1, zero errors | One uninterrupted ordinary-keyboard mandatory route. Video off; Alpha excluded; read-only planner. |
| Opening-order | Pass in desktop and phone-size emulation; reaches A1/Servo, takes coil errand | Real keyboard/mouse browser input. Phone-size is not physical touch. |
| Full collector | 199 pass / 2 fail; complete requested scope; log integrity true | Immutable host snapshot. Original GRAVEHORN and room-cache failures retained. |
| Room-cache isolated rerun | Pass | Failure did not reproduce outside full-suite load; not a device-performance certificate. |
| GRAVEHORN original/reruns | Original races retained; final corrected isolated run passes all assertions | Staged arena harness, not continuous campaign or finished-art evidence. |
| Physical phone/controller/listened audio | Not run | No physical touch, haptic, thermal, sustained performance or subjective mix certification. |

## Mandatory campaign certificate

| Property | Observed |
|---|---|
| Base commit | `9ccdba3a1be707a2f53fdf61c61078090d7eaa69` |
| Start state | Cleared browser storage |
| Input | Ordinary keyboard events |
| Difficulty | Easiest (0) |
| Wall time | 21:57 |
| Deaths | 3 ordinary deaths |
| Missions | opening, servo, first-meeting, marble, forge, sage, chime, lion, teaser |
| Panels | wake, bay, gate, letter, drawer, ratchet, meet, cave, marble, forge, passage, sage, break, chime, free, ch2 |
| Terminal room | B1 |
| Missing/order/page errors | None |
| Progression mutation | None |
| Video | Disabled for automation |
| Alpha | Excluded as optional |

## Cave purpose census

| Area | Purpose | Verdict |
|---|---|---|
| A5 | Loose-floor landmark, Magnet riddle, history, quarry mouth | Mandatory and causal |
| A7 | Survey read and once-paid return | Purpose exists; natural return proof open |
| CV1 | Bound crawler and max-core pocket | Distinct; bound art/revisit open |
| CV1B | Survey/map/shortcut/rest/respawn | Useful and exercised |
| CV2 | Deaf System evidence and beacon/lure | Purpose exists; comprehension proof open |
| CV3 | GRAVEHORN, raw marble, changed return | Mandatory mechanics pass; art P1 |
| GA1 | Refuge, Sage and network rescue | Core payoff passes |
| A11–A13 | Optional currency, traversal and Servo evidence | Natural loop open |
| A10/GA2 | Optional Alpha/cache/ledger/Pack Sage | Correctly optional; natural loop open |

## Manhwa parity matrix

| Beat | Runtime status | Remaining literal acceptance |
|---|---|---|
| Wake/bay/gate | Ordered panels and gradual text pass | Cradle/lamp reach |
| Letter/drawer/Ratchet | Ordered; repair board is clear and playable | Continuous battery/socket installation |
| First guardian meeting | Warning precedes escalation | Preserve agency |
| Cave/marble | Causal route; visible reward notices | Finished GRAVEHORN and visible carry |
| Forge | Correctly precedes Sage/lion | Hand/tool/material contact |
| Passage/Sage | Correct threshold; rescued gait passes | `passage_b` anatomy; reduce notice stacking |
| NULLFANG break | Correct order | Literal cable assistance/catch |
| CHIME | Before lion | Literal casing opening |
| Lion freeing | Hold ritual, extraction, gold return | Hero body strip, purple `m_down` eyes, UI density |
| B1 teaser | Correct threshold | Preserve gradual spoiler-safe delivery |

## Animation, combat and VFX matrix

| System | Status | Open gate |
|---|---|---|
| Normal/charged hits | White flash, dual sound routes, metal debris, knockback/recoil, shake and hit-stop pass; held hit stronger | Listened mix, haptics, final balance matrix |
| Character stats/log | HP, power, speed, defense and bounded 200-event history pass | Continue card/PDF synchronization |
| Hero/Alpha/pack/lion/Talon | Approved; preserved | Physical-device feel |
| Rescued Sage | Authored pure walk/idle pass | Optional motion richness |
| GRAVEHORN | Mechanics and gait pass | P1 body/poses/intercuts |
| Furnace | Base identity present | Six-pose set |
| Bound creatures | Live forms read | Down/breathe/recover strips |
| Eye trails | Red ordinary, purple boss/Sage/Alpha; finite lifecycle and clearing pass | Sustained device frame/memory |

## Gameplay-size visual inspection

- Repair board: strong hierarchy, clear sockets/parts and retry instruction.
- Forge: environment and Ratchet read well; hero/sword reward remains small relative
  to the cinematic importance.
- Rescued Sage: action is readable, but three simultaneous center notices plus
  objective and HUD create avoidable visual noise.
- Restored NULLFANG: gold body is readable and distinct; reward/item/goal copy
  collides across the upper third.
- Opening/Servo: Servo is larger than the hero, grounded and has a clear wake
  prompt.
- GRAVEHORN: mechanics are legible, but the fallback body remains substantially
  below the approved hero/Alpha/lion quality bar.

These are host-viewport observations, not physical-device approval.

## Commands and exact outcomes

| Command | Outcome |
|---|---|
| `npm ci` | Pass; 160 packages |
| `npm run build` | Pass; four pages generated |
| `npm run app:pack` | Pass; 694 assets / 244.3 MB + two pages / 8.2 MB = 252.5 MB |
| Standard Playwright Chromium download | Host-tool failure: zero-byte/truncated CDN payload after retries; not a product result |
| Browser canvas preflight | Pass; nonzero Latin 116, CJK 144 and Arabic 103.02 metrics |
| Full `tools/studio/audit.py --profile full` | 199 pass / 2 fail; requested scope complete; closed-file log integrity true |
| Fresh `campaign-ch1` inside collector | Pass/certified, 21:57 |
| Fresh `opening-order` inside collector | Pass desktop and phone-size to Servo |
| Independent `gravehorn roomcache` | GRAVEHORN driver-timing failure retained; room-cache pass |
| Corrected GRAVEHORN runs | Final isolated run passes all assertions; all product files unchanged |
| `bake3d` in full collector | Pass |
| `git diff --check` | Pass |

## Five-state handoff

| State | Truth on this branch |
|---|---|
| Implemented | Two evidence-driver timing corrections in `tests/gravehorn.cjs`; no production game/art change. |
| Tested | Full collector, fresh campaign, opening-order, room-cache isolation and multiple preserved GRAVEHORN reruns. |
| Visually inspected | Repair, opening/Servo, marble, forge, Sage, restored lion and chapter handoff at gameplay size. |
| Integrated | No. |
| Deployed | No deployment attempted. |

The single copyable Claude handoff is [CLAUDE_PROMPT.md](CLAUDE_PROMPT.md).
