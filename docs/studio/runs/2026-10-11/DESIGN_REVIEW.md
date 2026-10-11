# Design review — 2026-10-11

Baseline: `7b48b89d5fb2643ef58965eed36b6b8a06dddfd7`. Six design responsibilities reviewed by one specialist. Read AGENTS, DEVELOPMENT_AUTHORITY, CLAUDE, STORY_CANON, PIPELINE, the six role mandates, the original 2026-10-10 REPORT, its later INTEGRATION/NEXT_REVIEW, and CHAPTER_ONE_CAMPAIGN. **The integration report supersedes the original report's open-status list.**

Evidence in this review: fresh source inspection; isolated execution of actual `js/panels.js` in a Node VM with explicit mock save/room state; inspection of two committed historical images. No browser, build, or uninterrupted playthrough was run by this specialist. Producer-owned fresh suite/campaign results belong in the consolidated report. Historical reports are attributed, not converted into fresh passes.

## Role verdicts

| Responsibility | Verdict | Evidence / limit |
|---|---|---|
| Senior Cinematic Designer | Two bounded defects fixed; broader timing issue open | CIN-4/CIN-5 below, `js/panels.js`; scene groups exist, but safety/room timing still lets brisk players miss beats |
| Senior Game Designer — Player Systems | No new opening defect confirmed; fresh play pending | Existing pod/pack/monument/Servo chain is documented with input-only historical evidence; do not revive yesterday's booth claim |
| Senior Mission Designer — Quest Craft | Previous A7 finding resolved in source | `js/quests.js:49–58,115–153,197–206` now uses terminal evidence, retains early discovery, preserves paid saves |
| Principal Encounter Designer | Open traversal-quality issue; default difficulty not certified | TER-1 below; historical campaign chose Kitten, not default difficulty |
| Senior Boss Designer | Improved, not human-feel certified | Alpha redesign integrated per source/assets ledger; BOSS-1 death persistence remains an attributed historical observation, not a fresh reproduced defect |
| Senior Mission Designer — Campaign | Canon route supported; new-run certification deferred | `js/progress.js:34` requires crystal/Sage/CHIME before lair; prior uninterrupted keyboard campaign is documented; optional Alpha was bypassed |

## New confirmed defects and bounded fixes

### CIN-4 — P2 — Alternate-room NULLFANG break panels were unreachable

- **Evidence:** actual baseline source `js/panels.js:141–147` configures `break` for A2 and `alsoRoom: 'A3'`. Baseline `panelsDue` at line302 returned only the `ch2` sequence for an alternate room and continued for every other sequence.
- **Reproduction:** evaluate unmodified panels.js with known panel record, `nfBreak=1`, no CHIME/lion resolution. `panelsDue()` returned null in A3 and `break` in A2. This is a logic reproduction, not a playthrough.
- **Player consequence:** a player witnessing or waiting after the break in the supported camp room could never receive its two panels there, even when safe. This is a concrete cause distinct from CIN-2's general timing risk.
- **Fix made:** alternate rooms now share each sequence's ordinary event predicate. B1 retains its specific Chapter Two fallback because arrival there replaces standing on the camp climb. Existing seen/past/stale checks remain ahead of selection.
- **Verification:** Node syntax check passes; same VM fixture now returns `break` in A3. Added staged browser coverage in `tests/panels.cjs` for A3 playback and negative pre-break/post-CHIME/post-NULLFANG conditions. Browser execution is producer-owned and not claimed here.
- **Owner:** Cinematic Designer / Mission Engineer.

### CIN-5 — P2 — Sage replay said CHIME was still ringing after it was silenced

- **Evidence:** baseline Sage bell predicate `js/panels.js:163` reads `s.flags.bossChime`; baseline `panelsList` at lines340–343 passed the panel-record object, which has no story flags.
- **Reproduction:** with `G.save.flags.bossChime=1`, `panelsList(panelsSeq('sage'))` still included `game: sage_bell`. This affects delayed presentation/replay; ordinary main-route ordering normally shows the first Sage before CHIME and therefore hides the fault.
- **Player consequence:** replayed narrative asserts an ongoing command reinforcement that the player has already stopped.
- **Fix made:** conditional panels receive explicit `(panelState, flags)` context; the Sage bell tests flags while the corridor panel keeps its recorded `meetHit` condition unchanged.
- **Verification:** Node syntax and diff checks pass. The same VM fixture now omits the bell after CHIME. Added a browser regression checking bell present while active and absent when silenced, alongside the existing hit/miss corridor regression. Fresh browser result is deferred to producer.
- **Owner:** Cinematic Designer / Mission Engineer.

## Existing issues still requiring work

### TER-1 — P2 — Bell climb shares the quarry fall line

Fresh source `js/world.js:733–753`: A2 exits down to A5 and up to A8; breakable floor is columns12–14 at rows15–16, while the upward shaft is columns11–14. Platforms at rows3/6/9 do not guarantee a catch near the broken floor. `docs/CHAPTER_ONE_CAMPAIGN.md` reports four falls back into A5 while climbing toward the bell. The committed `docs/campaign/05-a2-loose-floor.jpg` was visually inspected; it is historical and shows the introductory floor interaction, not a fresh fall reproduction.

Smallest candidate: a reachable one-way recovery ledge that catches an ordinary missed climb, while leaving intentional descent and the A5 return route accessible. Verify keyboard/touch jumps and down-through behavior, including after reload. Do not silently move vertical room seam coordinates. No terrain change made by this specialist.

### CIN-2 — P2 — Fast traversal can still suppress intended scene moments

Fresh source `js/panels.js:268–288,310–335` requires no nearby hostile/projectile and grounded safety for 0.5s after arrival settles. Room-bound sequences become unavailable after leaving their room, and some intentionally go stale after later story beats. Historical campaign explicitly waits for the break (`tests/campaign-ch1.cjs:879–881`), so a 13/13 campaign result does not prove brisk-player delivery. CIN-4 fixes A3 selection, not this broader timing issue.

Acceptance: a normal-input brisk route should deliver essential beat panels at a safe narrative boundary or retain an understandable optional replay opportunity, without interrupting combat or showing events out of chronological order. Do not simply remove safety checks. A bounded explicit end-of-beat hook is a candidate, but requires testing what happens to nearby threats and held input.

### BOSS-1 — P3 — Death persistence consistency remains a design review item

`docs/studio/runs/2026-10-10/INTEGRATION.md` and CHAPTER_ONE_CAMPAIGN report Sage damage retained after death while CHIME/NULLFANG reset. This specialist has not freshly reproduced the behavior or established that a uniform reset is desired. Decide the intended checkpoint/assist rule, explain it, and test all three plus save/reload before modifying combat persistence. Preserve earned rescue flags and rewards. Do not elevate this historical observation into a newly verified bug.

### CIN-3 — Remaining production scope, not a Chapter One regression

Chapter Two now has three original teaser panels plus hatch/title; a complete illustrated Chapter Two remains unmade. That does not invalidate the requested Chapter One teaser. Do not regenerate the existing 17 game panels or 12 unlettered pages. New Alpha takes and new panels are integrated generated work; owner approval is still not established by test passes.

## Resolved prior findings — do not duplicate work

| Prior finding | Current evidence | Review decision |
|---|---|---|
| MIS-01 visit-only A7 reward | `kind:'read', term:20`; `questRead`, `qReadDone`, migration and early reads in quests.js | Resolved in source; use survey-a7 harness for fresh validation |
| CIN-01 eight missing groups | `PANEL_GAME` mappings in panels.js and current MANHWA_EVENT_MAP | All groups have wired assets; examine quality/timing instead of generating duplicates |
| UX-03 baked English in gameplay panels | Captioned crops use PANEL_CLEAN; map lists clean-page provenance | Resolved architecture; historical phone contact sheet inspected, not fresh animation validation |
| ART-01 old Alpha breed | Integration ledger lists ten new filmed strips from pack design | Do not request old redesign again; art specialist owns current visual verdict |
| QA-03 no uninterrupted campaign evidence | Later INTEGRATION records completed keyboard-only Kitten runs and current campaign harness | Historical evidence now exists; producer rerun needed for today's certification |
| UI-02 contradictory booth prompt | Integrated prior bounded fix | Do not reopen without new reproduction |

## Cave and route assessment

Previous cave census remains valid with A7 corrected: A5 puzzle/quarry entrance; A7 survey; CV1 spare core; CV1B rest/survey chart/shortcut; CV2 beacon lore; CV3 raw marble and later maintenance route; GA1T history/junction; GA1 rest/later lion connection; GA1D rescue/CHIME revelation; A11 coin; A12 dash-gated fragment; A13 Servo log/coin; optional Alpha pack rescue/rewards. These are source/historical outcomes, not a fresh feel/pacing judgment. The withdrawn CV1/CV2/CV3 map-connectivity hypothesis remains withdrawn.

The owner’s intended motivation is preserved by the current route: Ratchet’s own battery → pod and purchased Volt Pack → optional Servo work → quarry material → Ratchet forge → first Sage → CHIME → NULLFANG → chapter transition. Optional Alpha must remain off this critical path. Do not conflate the Meadow Sage, NULLFANG guardian, and the hostile CHIME construct.

## Small documentation drift

`docs/MANHWA_EVENT_MAP.md:43` still says the hostile radius is600 px; actual panelsSafe uses true distance 300 px. This is a stale explanation, not a runtime fault. Correct the fixed prose without modifying scene crop data.

## Verification limits

No subjective audio/haptics check, physical device, default-difficulty human play, new full campaign, or new asset generation was performed by this specialist. Viewed archived panel contact sheet supports existence/localized layout only. Do not equate source presence, mocks, or staged browser regressions with a natural uninterrupted player journey.

## Follow-up — QA-08: opening-order fails its current traversal gate

**Status: failed fresh harness; root cause unestablished.** Evidence: `automated/opening-order.log`, run duration483.4s. Desktop visits lessons move → out → jump → gate → booth → note → drawer → repair → pod → pack → heal → atk, then ends in A0B. Phone-sized mode visits move → out → jump → gate → booth → note → drawer → repair → pod → pack, also ends in A0B. Both report zero page errors. Neither reaches the monument or Servo.

The16 failed assertions are downstream consequences of these two incomplete routes, **not16 independently established NPC/game defects**. Desktop did verify letter/battery/repair order, story explanation, pod save, Volt Pack explanation/payment/purchase, and healing progression before stopping. Phone-sized mode never reaches the counter (`scrapAtShop:null`). The whole opening gate remains failed.

Fresh screenshots inspected: `tests/out/opening-order/desktop-30-atk-up.png` shows the hero at the booth exit with “Back outside / press ↑”; this is the correct post-heal instruction, not a recurrence of UI-02. `phone-24-pack-int.png` shows the hero near Ratchet with the “Volt Pack / press E” instruction. These are the last first-occurrence step captures, **not final-timeout state snapshots**; they cannot establish how long either action stalled or whether later dialogue consumed the remaining budget.

### Evidence semantics correction

- `tests/opening-order.cjs:61` calls `startGame(newSave(1))`. It exercises a fresh-save opening segment, bypassing title/prologue/difficulty selection. It is not an uninterrupted title-to-chapter-end run.
- Phone configuration at lines50–55 enables a touch-capable viewport and screenshots portrait/landscape. Movement, jump, interaction, menus and dialogue still use `page.keyboard`; repair uses `page.click` at lines153–156. There is no touch-event or touchscreen API in this harness. Report **keyboard/pointer input in desktop and phone-sized contexts**, not touch-control validation.
- Lines280–282 explicitly inject `G.save.bag.coil=1` for the later hand-in. That portion is staged reward/dialogue testing, not proof of the coil retrieval route. Neither mode reached it in this failed run.
- Puzzle solving reads the internal `TRI.memSeq` at line106 and sends the matching keys at lines179–183. The route uses browser input but an internal-state-informed driver, not a human visual comprehension test.
- The current root-owned `campaign-ch1` run is separate evidence and must retain its own outcome and limits.

### Source-confirmed harness limitations; none yet established as the failure cause

1. **Hard wall-time budget:** lines77–80 give each mode240s, including screenshots, dialogues, panels and movement. There is no progress-aware extension or frame/simulation-rate measurement. The runner's900s outer limit does not change the internal deadline. The483.4s total is consistent with both240s loops plus setup; this does not prove that increasing the deadline would finish them.
2. **No useful final diagnostic:** leaving the loop records only the room at lines224–227. It does not capture final state, active dialogue/page, position, intended action, elapsed time per step or time since last progression. Screenshots occur only when a step/action first appears. Add diagnostics before choosing a remedy.
3. **Fixed brief movement pulses:** line205 uses45ms near-target presses. On slow frames these may cover less than one simulation update. The separate campaign harness compensates direction taps to at least1.6 observed frames (`campaign-ch1.cjs:289–293`); opening-order does not.
4. **No terrain recovery in MOVE:** lines199–206 repeatedly walk toward the prompt; there is no no-progress detection or hop around a step. Campaign followChip has that recovery at lines525–526. This is a driver limitation, not evidence that terrain trapped the player here.
5. **Wall-clock dialogue presses versus game-clock guards:** opening-order waits320ms for dialogue and350ms for panels. The game measures dwell/mash windows using simulated delta time (`js/overlay.js:153–160`, `js/panels.js:421–426`). Slow simulation can make a wall-clock press too early; this possibility needs pace and state evidence, not speculation.
6. **Overlay assertion coverage:** the overlay list at lines85–89 does not include `PANELS`, although the loop handles that state later. Its “no two overlays” pass cannot certify all manhwa overlap combinations.

No source/test edits, browser launch, deadline relaxation, or rerun was performed during this follow-up. Preserve the failing log and investigate with explicit final-state/per-step diagnostics before classifying a game defect or changing budgets.

## Fresh campaign follow-up — CIN-2 observed chronological delay

The producer-owned input-only campaign now provides a concrete occurrence, beyond the earlier source-based risk. In `tests/out/campaign-ch1/campaign.log`:

| Timestamp | Recorded occurrence |
|---|---|
|04:26|Objective becomes “Bring the raw marble to Ratchet”; `+pl_cshard`, bag `cshard`, marble mission complete (lines332–338)|
|04:32–04:33|`MANHWA marble` panels1/2 and2/2 play at extraction (lines344–346)|
|04:53|Returning through the caves: CV2 → CV1 (line356)|
|04:58–05:00|`MANHWA cave` panels1/3 through3/3 play (lines360–363)|

The cave-introduction sequence is explicitly mapped to **first entry** in `js/panels.js:87–94`, yet played on the return after material acquisition and its extraction scene. This is a verified event-order mismatch, not a subjective claim that the sequence is too slow or unenjoyable. The observed delay does not block the quest itself. The campaign is still in progress at the time of this note; no completion claim follows from this segment.

Source explains why it can happen: cave `when:()=>true` has no runtime `stale` condition; its `past` predicate is for record initialization/migration, not repeated current-run chronology checks. `panelsDue` only checks current room and those predicates, while `panelsTick` waits for a safe grounded interval. An unplayed introduction can therefore remain owed until a later CV1 visit. Safety remains necessary: do not force a cinematic over an attack merely to satisfy ordering.

**Scoped acceptance:** first-entry cave introduction should play at a safe entry boundary before extraction, or deliberately become an explicitly labeled optional remembered/replay sequence if the player proceeds without it. Once raw marble has been acquired, it must not automatically interrupt the return journey as though the cave is newly discovered. Cover a brisk input-only first pass, a hostile-delayed pass, the post-extraction return, save/reload, and explicit replay. Preserve the actual quest objective and safe combat resumption. No runtime changes were made during the frozen run.

## Fresh campaign follow-up — BOSS-1 partial retention evidence

`tests/out/campaign-ch1/campaign.log` records Sage HP417 at08:31, HP367 at08:44 and08:50, player death#1 at08:52, ordinary respawn to CV1B at08:54, and re-entry GA1D at09:34 with Sage HP233. The Sage has retained damage across this death/re-entry. **The last pre-death log sample is367, not233**; damage between logged samples is not an exact pre-death measurement, so this is not proof of byte-identical HP preservation.

This freshly establishes the Sage portion of the historical observation only. CHIME/NULLFANG reset behavior has not been freshly established by this evidence. Keep the checkpoint-policy decision open rather than automatically resetting progress, especially permanent rescue flags or paid rewards. This run chose Kitten through the normal menu; do not extrapolate a default-difficulty policy from that selection without checking it.

## Producer final validation addendum

The final producer-owned full suite ran all 166 harnesses: 164 original passes and two failures (roomcache, opening-order). Roomcache was diagnosed/corrected and separately passed; opening-order remains unresolved. Build/package/start-end identity passed. The fresh Kitten keyboard campaign completed 13:36 with one death and zero page errors, but only 12/13 sequences appeared: passage is missing and the cave introduction came after marble recovery. See REPORT.md, VALIDATION.md and campaign/review.json; no physical-device, audio/haptic or human-feel certification is added by this result.
