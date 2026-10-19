# Senior design review — 2026-10-19

## Scope, authority and evidence boundary

The six design responsibilities below were instantiated together. This reviewer
read `AGENTS.md`, `docs/DEVELOPMENT_AUTHORITY.md`, the complete `CLAUDE.md`,
`docs/STORY_CANON.md`, `docs/studio/PIPELINE.md`, `roles.json`, all six applicable
role mandates, and October 18's REPORT/DESIGN before reviewing source. The current
owner request authorizes the review branch only and overrides older automatic
main/mirror publishing instructions. No merge or deployment is authorized here.

Producer-pinned intake: main and integration
`62d75d204c6f6264f25150bb419fc262ff2c18ea`; review branch
`codex/studio-review-2026-10-19` inherits October 18's
`69640ed83d72d451cfb6f0b59fafb2c029cc5802`. This reviewer performed no git operation,
build, browser run, game-state edit, generation or runtime edit. Only this file is
assigned to this reviewer. The producer owns today's build identity, validation,
bounded implementation and final REPORT.

**Source** below means today's inspected candidate; **historical** means retained
October 18 evidence, not a new run. This review does not certify a fresh continuous
chapter, all caves, physical touch/controller use, subjective audio or motion.
New producer evidence must be reported separately rather than relabeling the
October 18 certificate as fresh.

## Six role verdicts

| Senior responsibility | Verdict | Evidence and limit |
|---|---|---|
| Cinematic Designer | Issues | Event/doorway intercuts, conditional injury image, separate reveal/advance and skip continuation are implemented in `js/panels.js`. GRAVEHORN's four named intercuts and exact comic action parity are still missing. Video ending/music quality is not established by source. |
| Game Designer — Player Systems | Issues | Distinct battery, spare cell, save pod, permanent pack, heal/Burst and forward monument remain causally ordered in `js/opening.js`. An obsolete extraction instruction survives acquisition in a historical actual frame; a narrow cleanup candidate is identified below. Broad reward/equipment density remains separate. |
| Mission Designer — Quest Craft | Issues | Required material changes the world through forging and rescue. Alpha has an explicit optional offer, landmark, pack-allegiance change and cache. Cave payoffs differ in source; this is not evidence that every payoff is noticed or satisfying. |
| Principal Encounter Designer | Issues | Safe Servo conversation, guarded material and physically enforced lair/Sage/CHIME sequence are retained. October 18's dodge/charge timing discrepancies require fresh root evidence; no damage/telegraph change or assertion relaxation is justified by this source review. |
| Boss Designer | Issues | Wolf-specific pounce/bite/clinch/howl identity is distinct from lion behavior. Principal guardians require deliberate hold-to-free and atomic completion. A drawn sword overlay is not an authored arm-raise/hold/slash/recovery performance; a golden still is not gait certification. |
| Mission Designer — Campaign | Issues | Blade → Sage → CHIME → NULLFANG remains mandatory; Alpha does not appear in the lair's milestones. The script corrections from October 18 remain. Optional branches and complete manhwa parity require separate evidence. |

## Delta from October 18

No new narrative requirement or replacement asset is proposed. The inherited
script already corrects boss-eye colors, Sage-gated CHIME, optional Alpha and the
deliberate rescue; GLACIERE's cast description now says the ritual frees it alive
(`docs/STORY_SCRIPT.md:57`). Do not repeat those patches or regenerate their assets.

October 18's bounded `boss-opening` cleanup remains in
`js/purification.js:54–62`; only those combat hints are removed. That fix is not
supposed to erase the material-extraction hint described below. The inherited
campaign-log import guard is a test/evidence fix, not a new gameplay feature.

Historical October 18 results: 186/192 full harnesses passed; fresh keyboard
chapter certificate was complete in 25:20 with six deaths and 12 recovered driver
stalls, not frictionless. The mandatory route excluded optional Alpha and several
side caves. Today this reviewer did not rerun any harness. Historical full-suite
`foescale` pass must not hide the separate traced fully loaded flier's 0.338×
height result; root/art owns new loaded-renderer evidence and any change.

## NOTICE-CONTEXT-18 — narrow candidate, not implemented by this reviewer

**Priority P2; owner UI/mission engineering. Evidence: source plus historical
actual route frame.** I opened
`../2026-10-18/automated/campaign-ch1/frames/016-done-marble.png` at its actual
1280×720 dimensions. The frame simultaneously displays:

- “Claws glance off the raw marble. Hold ATTACK to supercharge…”;
- “ACQUIRED — raw cave marble” and “Errand ready — go back”;
- “Bring the raw marble to Ratchet.”

The lines are legible; this is **semantic staleness**, not demonstrated physical
overlap, permanent persistence or unreadability. The instruction was useful
before acquisition but contradicts the now-completed extraction. The player is
being told both to obtain and return the same object.

Source reproduction:

1. An ordinary claw contacts a pillar: `js/entities.js:2506–2515` emits `pl_hint`
   through `G.toast` with no scope.
2. The charged release extracts a nearby pillar: `js/entities.js:2807–2831`
   removes it, sets `pl_*`, calls `questTake('cshard')`, and supplies acquisition
   effects, but never retires that superseded instruction.
3. `G.toast(text, scope)` already supports narrow ownership
   (`js/game.js:192–197`). Toast timers are decremented in PLAY
   (`js/game.js:3046–3047`), not during the intervening cards/panels. Pausing those
   clocks protects readability, but preserves obsolete prerequisites too.

Smallest candidate: tag the rejected-claw pillar instruction with a stable
objective scope, then retire only that scoped instruction at **successful**
extraction. Preserve acquisition, quest-ready and all unrelated earned notices.
Avoid blanket `G.toasts=[]`, translated-text matching, reducing all toast lifetimes,
or modifying tutorial progress. If more than one pillar can coexist, scope by
objective/instance so extracting one does not silence useful guidance for another.
Do not claim this resolves post-lion equipment/reward crowding.

Acceptance for root/integrator:

- Before extraction, ordinary claw produces the instruction; an unsuccessful or
  out-of-range charged release does not clear it.
- On actual acquisition, that scoped prerequisite is absent across the item card,
  marble panels and resumed PLAY, while `ACQUIRED`, `q_ready`, unrelated notices
  and an identical-text **unscoped** control remain.
- Successful extraction pays once; retry/reload does not duplicate material or
  erase other notices; NOSTOS/common-engine paths remain intact.
- Capture before/after at gameplay size and run original impacted/full checks.

This is a recommendation with historical reproduction, not a fresh runtime pass.

## Chapter-one causal walkthrough — source reviewed

| Player moment | Reason and guidance | Required consequence |
|---|---|---|
| Wake unarmed, move, jump, cross bay/gate | Sleep explains survival, not innate immunity. Current opening teaches verbs individually. | No sword, pack or future control granted to match an illustration. |
| Inspect dark Ratchet and read letter | `openingTalk`/`opRatchet`, `js/opening.js:63–113`: letter precedes drawer and repair. | Find **his own battery**, not buy it; spare cell remains distinct. |
| Seat battery and complete repair board | `opRatchetRestored`, `:115–129`: consume unique cell, wake once, then explanation even if waking film is skipped. | Restored NPC explains marble protection, self-shutdown and sleeping hero. |
| Receive material task and Servo spare, use pod | `opExplain`, `:132–145`; pod confirmation `:266–275`. `js/text-opening.js:53–60` names the material/forge and save/recharge purpose. | Pod save completes before later teaching; Servo's spare is not the installed Ratchet cell. |
| Buy permanent Volt Pack | `opPackTalk`/`opShopRow`, `:147–196`; `js/text-opening.js:64–67` explains charge spending, cost and repair fee. | Exact 12-scrap repair pay prevents grind lock; permanent heal/Burst unlock is distinguished from refill. |
| Heal, Burst winch, solve forward monument | Successful hit proximity, not any release, owns progress (`js/opening.js:284–335`). | Winch road physically opens; no mandatory backward trip to learn the monument. |
| Wake Servo | `opServo`/intro, `:199–233`; protected yard `:247–259`. His text names the loose hub floor and a separate coil job. | A visible person with a job, information and optional paid errand, not silent decoration. |
| Survive warning, open hub hatch, follow chalk road | `js/game.js:199–208` protects the hatch until the corridor meeting. `js/progress.js:71–107,129–145` and objective texts identify where/what. | Warning is not an out-of-order resolved lion; ordinary claws can disable robots without permanently killing them. |
| Enter quarry and defeat GRAVEHORN | The Eye soldier guards the raw material, not a cleansable principal guardian. | Charged extraction yields rounded material; goal becomes return to Ratchet, never a found ready-made sword. |
| Return, forge, choose optional Alpha lead | Forge establishes earned single blade; `alphaQuestOffer` is after it (`js/wolves.js:625–628`). | The material quest is mandatory. Alpha is a detour and never supplies the first required marble. |
| Return through changed quarry to Meadow Sage | Blue marks, cut stump, lit maintenance passage and bound robots (`js/progress.js:185–219`). | Blade can cleanse; Sage rescue stands local network down and reveals CHIME's rewrite. |
| Silence CHIME, then reach NULLFANG lair | `PG_LAIR_NEEDS`, `js/progress.js:34–44`; lair wards and protected transitions. | Fresh-run blade + Sage + CHIME required; compatibility flags do not authorize a fresh alternate order. |
| Final combat hit, deliberate rescue, restored world | `js/purification.js:54–128`: release previous input, hold actual Interact/button for 1.6s, white gather → slash → impact → black → matching film/fallback → live gold guardian. | No automatic kill or initial-zero-HP reward. Cancel/focus/portrait cannot complete hold. Reward/mercy once on completion. |
| Leave kingdom | `PANEL_SEQ.ch2`, `js/panels.js:230–243`. | Relevant spoiler-safe intercut at B1 crossing, not mid-climb combat interruption. |

This table is not a new walkthrough recording. Today's actual ordinary-input
chronology, errors/deaths/stalls, devices and branch omissions belong in REPORT.

## Optional Alpha: motivation, guidance and enforcement

`js/i18n.js:1543–1549` gives **The lost wardens** four explicit causal lines:
wolves escorted lost workers → corrupted howl redirected protective behavior →
marked den/white blade → friendly pack plus supply cache → explicit optionality.
`js/quests.js:23` records its flag quest; `js/wolves.js:625–628` offers it after the
blade, once; `js/game.js:9293–9294` places its depth door off A2.

`PG_LAIR_NEEDS` excludes Alpha. `js/game.js:311–325` completes its quest, turns all
wolves friendly, gives one cell/60 scrap and opens its own continuation. Wolf
allegiance reads the saved `alpha` fact (`js/wolves.js:58–60`), so the consequence
is not limited to the encounter room. Pack Sage/cache is additional, not a substitute
for the required quarry-to-forge road. This satisfies source causality and reward
identity; only ordinary-input optional-branch evidence can show that it feels guided.

**Stale source comments remain** at `js/world.js:763–768,790–795`, describing Alpha
as on the road before the camp. Runtime topology and corrected script disagree with
those comments. Treat as P3 documentation maintenance; do not “fix” routing to obey
obsolete comments. No comment edit was made here.

## Cave census — source outcomes, not all-cave certification

Reviewed `docs/CAVES_CH1.md`, `js/quests.js:23–58,112–135,164–174`,
`js/progress.js:185–219` and `js/text-progress.js:26–43`. No new cave is needed to
invent value; these distinct outcomes must be communicated and visited.

| Room/group | Distinct discovery and payoff | Revisit/acceptance question |
|---|---|---|
| A5 | Riddle, Magnet crest, maintenance log, quarry mouth and chalk road | Can a first-time player locate the cracked floor and read the route without internal map knowledge? |
| A7 | Quarry survey, white-seam explanation and coin/scrap errand | `termRead[20]`, not room arrival, must count; early read is remembered. |
| CV1 | Climb-pocket spare core/max-health improvement and bound crawler | Chest must read as reachable, and later cleansing must visibly change the same body. |
| CV1B | Survey pod restores facility, maps CV1–CV3, opens shortcut/rest access | Show chart/shortcut consequence rather than another indistinguishable bench. |
| CV2 | Deaf System founding evidence and lure/beacon resolution | Check that traversal duration is earned by discovery; no fresh pacing judgment here. |
| CV3 | Guarded raw marble; after forge, cut stump and lit Sage passage | Retire completed extraction instruction; changed return journey must lead onward. |
| GA1T | Refuge history and Sage-route junction | Surface the log and east chamber path; optional west rest is not a dead-end penalty. |
| GA1 | Rest before Sage, later post-lion lair shortcut | Physically blocked before guardian completion; meaningful loop after it. |
| GA1D | Sage rescue, CHIME reveal, local network stand-down, cell | Show calm friendly network now and after reload, not reward text alone. |
| A11 | Hidden coin relic behind CHIME wall | A small reward-only pocket is acceptable as part of this varied set, not every cave's template. |
| A12 | Dash-gated star beneath camp | Later revisit is motivated by earned dash; do not count it as mandatory route coverage. |
| A13 | Servo's disconnected receiver/dry-cell history and coin | Ensure discovery still makes sense after Servo is restored. |
| A10 / GA2 / GA2T / GA2D | Optional Alpha, friendly pack everywhere, rest/cache, wardens ledger and Pack Sage mending | Full ordinary-input detour must show navigation, nonlethal resolution, cache and saved global change. |

Early coil/material/survey discoveries remain valid (`questItemLive`, `qReadDone`,
`questFoundEarly`). Culls intentionally count from request; they are not the same
kind of pre-discovery evidence. Do not reset early finds or pay merely for arrival.

## Manhwa/cinematic parity matrix

| Beat | Source mapping | Result / limit |
|---|---|---|
| Sleep/wake, bay/gate | `js/panels.js:55–89` | Appropriate boundary/setup mapping; no fresh full-art review by this reviewer. |
| Letter → drawer → repaired Ratchet | `:91–126`; `js/opening.js:73–145` | Source causal order retained and objectives survive missing/skipped film. Physical comic staging still requires exact verification. |
| Cave → raw marble → forge → passage | `:128–168` | No found sword or unearned equipment; extraction hint lifecycle is a separate UI issue. |
| GRAVEHORN intro/closeup/phase2/retreat | `docs/ART_QUEUE.md:304–307` | Four specifically named panels remain queued, absent from PANEL_SEQ. Do not substitute unrelated comic images. |
| Meeting/break/Sage/CHIME | `js/panels.js:171–215` | Conditional injury only if hit; bell panel only while bell still active. Exact body/action/art parity remains open. |
| Guardian freedom and next chapter | `:216–243`; `js/purification.js` | Completion-based rescue and B1 teaser mapping exist. Matching hero body performance/four non-lion ritual films remain open. |
| Whole chapter pages/actions | `docs/COMIC_PARITY_AUDIT.md`; `docs/story-draft2/GAME_ART_PARITY.md` | Not certified: cooperative cable, hand-carrying, knock/contact and literal CHIME case-opening actions remain unsupported or require redraw. Displaying the illustration is not implementing its scene. |

Shared reader behavior is explicitly in `js/panels.js:451–544`: grapheme/Arabic
word-safe reveal, first confirm completes text, a separate debounced confirm
advances, captioned panels do not auto-dismiss, silent shots may hold/turn, and
failed media cannot strand progression. Source consistency is not physical-phone
Arabic legibility or a subjective timing/listening pass.

## Integration acceptance priorities

1. Read the producer's final before/after and same-build results for the narrow
   notice fix. Preserve earned messages and inherited save/input/eye patches;
   never mass-clear notification queues to make a frame look clean.
2. Preserve required causal order and separate optional Alpha. Run fresh ordinary
   input mandatory chapter and an explicitly separate Alpha/all-cave traversal;
   record route knowledge, observation hooks, deaths and recovered stalls.
3. Align the corrected production script, canon, event table and each actual
   comic image before approving art. Use approved assets first and retain lion's
   ritual ending. Missing parts/poses/intercuts are not closed by a prompt.
4. Verify actual equipped hero body/contact/recovery and restored creature gait,
   finite red/purple trails and cure cleanup at gameplay scale. Staged travel,
   static rosters and a gold screenshot are bounded proofs only.
5. Keep real-device touch/controller/haptics, listened music/video handoff,
   sustained frame-time/memory and full per-page manhwa parity explicit as
   separate gates. No release-quality claim follows from a green subset.

This file intentionally contains no fabricated October 19 playthrough or runtime
result. Final build/test/fix/publishing evidence must be supplied by the producer.

## Producer fix reviewed — fresh staged evidence, not route certification

After the review above, the producer implemented NOTICE-CONTEXT-18. I read the
updated source and both [before](before/marble/result.json) and
[after](after/marble/result.json) result files; I did not run a browser or modify
runtime. This appendix supersedes the **candidate-only** implementation status
above, not its scope limits.

`js/entities.js:2514` now tags the actual ordinary-claw instruction
`marble-extraction`. At successful extraction only, after removal and the `pl_*`
flag, `:2819–2821` retires that scope before the material reward is enqueued.
The implementation does not clear all notices or compare translated strings.

The producer's staged save/placement invokes the production claw update and
`releaseCharged`, in English and Arabic. Before (`7984b6ea8f08`) the actual hint
remains after acquisition. After (`1d3a7c72250c`) it survives ordinary claw and a
missed charged release, but its scoped copy is absent after successful extraction.
An earned reward, identical-text **unscoped** control, unrelated `boss-opening`
notice, acquisition notice and early-discovery message remain. The repeated release
does not add another acquisition; both languages record material acquired,
extraction flag set, pillar removed, and zero page errors.

This closes the narrow staged semantic-lifecycle case. The fixture's reward path
is early discovery, not an active-quest `q_ready` route, and does not independently
prove card/panel pacing, ordinary-input chapter traversal, all-cave behavior or
broad post-lion HUD layout. The producer's full 194-harness same-build review and
actual chapter route were still pending at this appendix's evidence cutoff.
