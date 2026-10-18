# Senior design review — 2026-10-18

## Scope and versions

Six design responsibilities were instantiated together after reading `AGENTS.md`,
`docs/DEVELOPMENT_AUTHORITY.md`, `docs/STORY_CANON.md`, the studio pipeline, role
mandates, and the October 17 report. Main and integration remain
`62d75d204c6f6264f25150bb419fc262ff2c18ea`; today's review branch inherits
`84f44587fc57fcc00d1fc40fba1a6640636fc0c7` so yesterday's bounded fixes are not
recreated. No runtime source was edited by this reviewer. The only implementation
assigned here was a bounded correction of `docs/STORY_SCRIPT.md`.

Evidence labels below matter: **source** means inspected current source;
**historical runtime** means October 17's retained actual frames/results;
**today's runtime** belongs to the producer's new collector and must be read in
today's consolidated report. This document does not claim a new uninterrupted
playthrough, every cave visited, a human playtest, or phone/controller validation.

## Six separate role verdicts

| Responsibility | Verdict | Basis and release limit |
|---|---|---|
| Senior Cinematic Designer | Issues | Doorway/event panel timing, separate reveal/advance and skip continuation exist in source; script now describes the deliberate rescue. GRAVEHORN intercuts and exact comic action parity remain absent. |
| Senior Game Designer — Player Systems | Issues | Opening separates unique battery, spare cell, pod, purchase, heal and Burst. Historical repair frame is readable. Post-rescue stacked notifications were visibly confusing; today's producer is checking a bounded fix, not assumed passed here. |
| Senior Mission Designer — Quest Craft | Issues | Mandatory marble has a material/forge/cure purpose; optional Alpha has an offer, landmark and world-state reward; each cave has a source payoff. A source census is not proof each payoff is noticed or enjoyable. |
| Principal Encounter Designer | Issues | Locked lair, protected meeting and Sage-gated CHIME enforce causality. Historical GRAVEHORN timing and flier-size gates remain open until today's evidence resolves them; no assertion changes are recommended. |
| Senior Boss Designer | Issues | Unique wolf kit and deliberate principal-guardian ritual are present. Golden restored lion appears in historical frames. VFX over an existing hero pose is not a complete raised-sword body performance or studio-quality animation certification. |
| Senior Mission Designer — Campaign | Issues | Source supports Blade → Sage → CHIME → NULLFANG, optional Alpha and B1 teaser. Yesterday's 17-minute keyboard certificate is historical and excludes several optional branches; no all-cave/mobile approval is inferred. |

## New finding and bounded correction

### SCRIPT-DRIFT-18 — P2, fixed in documentation, not a runtime change

The script is specifically presented to future artists as an exact playable
walkthrough (`docs/STORY_SCRIPT.md:3–13`). Before this patch it contradicted the
working candidate in four consequential places:

- Cast/panel directions requested red NULLFANG/GRAVEHORN eyes despite the purple
  boss policy and yesterday's eye correction.
- Sections 2.12–2.13 described the CHIME climb as open from the start. Fresh-run
  source gates it on `sageTame_GA1D` (`js/world.js:1492`), with legacy exceptions
  deliberately retained (`js/progress.js:41–44`). Compatibility dialogue is not
  evidence of an alternate fresh-run route.
- Section 2.14 described Alpha as "on the road, not off it". Current entrance is a
  depth door from A2 (`js/game.js:9293–9294`); the main road bypasses A10. The offer
  explicitly says "This is a detour" (`js/i18n.js:1543–1549`).
- Section 2.16 collapsed final combat hit into automatic film/freeing and said the
  mercy was recorded on the spot. The actual ritual requires released input and
  a 1.6-second hold (`js/purification.js:3,54–72,115–128`); corrected choice
  persistence is deferred to completion (`js/purification.js:78–105`,
  `js/game.js:287–291`).

Corrected script references: review-status note `:28–32`; eye policy `:51–63`;
Sage/CHIME compatibility distinction `:382–411`; optional Alpha motivation,
landmark and consequence `:424–441`; ritual and completion `:484–513`.
Hazard-red armor/horns, body identity, existing dialogue and rewards are preserved.
The script explicitly labels review-source behavior and does not claim deployment.
`git diff --check -- docs/STORY_SCRIPT.md` passed. No build/test result is implied
by a prose correction.

Owner: campaign/cinematic design. Acceptance: future art instructions describe
the current route and button sequence, preserve the same character and equipment
timing, and never revive an obsolete critical-path Alpha or red boss-eye brief.
The stale explanatory Alpha comments in `js/world.js:763–768,790–795` remain
source-comment maintenance only; actual room topology, not comments, owns routing.

## Causal chapter-one walkthrough from current source

1. HZD-99 wakes unarmed in W1, having slept through the corrupted broadcast.
   Movement precedes later verbs. Bay/gate intercuts happen at crossings; the
   tutorial points at the booth, not an unexplained shop.
2. At Ratchet's dark body, the letter explains Mother's infected song, his
   protective marble and self-shutdown, then names **his own battery in the
   drawer**. `openingTalk`/`opRatchet` (`js/opening.js:63–93`) owns that order.
   Reconnecting it opens the repair board; installing it wakes him once.
3. His waking film may be skipped/unavailable without skipping the explanation
   (`js/opening.js:115–145`). He requests raw marble to forge the white cure sword,
   identifies the separate spare cell for Servo, then directs the player to the
   pod. This is not purchasing Ratchet's battery.
4. The pod saves/recharges before more teaching (`js/opening.js:266–275`). Ratchet
   explains the **Volt Pack**, pays the exact 12-scrap repair fee, and opens the
   marked permanent pack row; other purchases are locked until it is bought
   (`js/opening.js:147–196`). The pack unlocks spending charge on healing/Burst,
   making the purchase causally necessary rather than unexplained shopping.
5. The jammed winch teaches successful Burst contact; an out-of-reach release
   does not complete the lesson (`js/opening.js:284–305,317–335`). The monument
   puzzle is forward on the teaching road. Servo takes the **separate spare**,
   wakes safely before combat can intrude, names the underground marble road and
   offers the gantry-coil errand (`js/opening.js:199–233,247–259`).
6. NULLFANG's corridor meeting is a warning, not the resolvable final fight.
   Marble dust and the cracked hub floor guide the down-strike into A5; chalk
   arrows guide the quarry. `progressGoal` always chooses the next current
   prerequisite (`js/progress.js:71–85,92–107,126–137`).
7. CV3's GRAVEHORN deliberately guards the cure material. He is an Eye soldier,
   not a sage being purified. Defeat him, then Burst the raw rounded nodule free.
   The objective changes to returning it, not visiting the lion early.
8. Ratchet forges the first sword, then moves to camp. The optional Alpha offer
   follows the forge's film/card, not an unmotivated ambush on the road
   (`js/game.js:2397–2420`, `js/wolves.js:625–628`). Return to the quarry is changed:
   blue marks, cut stump, open maintenance passage and bound robots the new blade
   can now free (`js/progress.js:185–219`).
9. The passage reaches the Meadow Sage **before** the final lion. Rescue restores
   its local network and reveals CHIME's rewriting of NULLFANG's orders. This
   unlocks the climb; CHIME is a made instrument with no person to restore.
10. A4 cannot be reached normally without blade + Sage + CHIME. `pgLairOpen`
    (`js/progress.js:34–39`), wards, transition clamps and bench migration enforce
    this; Alpha is not in `PG_LAIR_NEEDS`. The quarry quest is a main-story
    prerequisite, not an optional errand that can be ignored until the boss.
11. NULLFANG's final hit offers deliberate release-and-hold purification. White
    gathering → slash → brief impact → black → matching lion film/fallback →
    golden live guardian → completion/rewards → freedom panels → the B1 teaser.
    No killing, no reward at initial zero HP, no duplicate mercy on interrupted
    retry. Source exists; final certification requires the producer's tests.

### Optional Alpha branch: reason, guidance, enforcement, consequence

The offer's four English lines explain former worker escorts, corrupted howl,
marked den, rescue/cache reward and optionality (`js/i18n.js:1545–1549`).
`alpha_pack` is a flag-based quest after forging (`js/quests.js:22–34`), and its
offer sets `alphaLead`/active once (`js/wolves.js:625–628`). The forged blade gates
the den; the main-route lair milestones never include Alpha. Winning changes
**all wolves** to friendly and opens cache/Pack Sage access; it pays a cell and
60 scrap (`js/game.js:311–325`). This is stronger than another coin-only cave.
It still needs a complete ordinary-input branch visit and readable in-context
evidence, not just a staged victory assertion. Do not move it back in front of
the mandatory lion road to make coverage easier.

## Cave census and meaningful outcomes

Source basis: `docs/CAVES_CH1.md:49–83`, `js/progress.js:185–219`,
`js/quests.js:31–58,109–135,164–174`, `js/text-progress.js:26–43`.
These are source-reviewed payoffs, not fresh claims of visiting every row.

| Room/group | Unique purpose/outcome | Remaining quality question |
|---|---|---|
| A5 | Riddle, Magnet crest upgrade, quarry entrance and chalk-road discovery | Is the cracked-floor route noticed without driver knowledge? |
| A7 | Read the quarry survey; Ratchet acknowledges early discovery and pays coin/scrap | Does the player read the evidence rather than merely see another terminal? |
| CV1 | Spare core increases max health; bound crawler can later be freed | Does the climb-only chest pocket read as an attainable discovery? |
| CV1B | Restores survey pod, charts CV1–CV3, opens shortcut/rest access | Distinct facility payoff; not just another bench. |
| CV2 | Deaf System founding evidence; beacon/lure resolution | Long traversal must earn the lore; no fresh pacing review here. |
| CV3 | GRAVEHORN encounter then raw material; on return, cut stump and lit Sage passage | New body/panel art still needed; no generic replacement image. |
| GA1T | Refuge log explains the Sage and frames its rescue; junction/return route | Historical route stalled once here before recovering; readability needs human observation. |
| GA1 | Pre-Sage rest; post-lion shortcut closes the kingdom loop | Historical mandatory run did not visit every rest branch. |
| GA1D | Sage rescue, CHIME knowledge, network stand-down and cell | Visible changed people/room are essential, not reward text alone. |
| A11 | Secret coin behind CHIME's wall | Reward-only pocket is acceptable in a mixed set, not a template for every cave. |
| A12 | Dash-gated star after lion; explicit reason to revisit | Later optional revisit, not counted in mandatory route certificate. |
| A13 | Servo receiver/cell history plus coin | Make evidence relevant even if Servo was already restored. |
| A10 / GA2 / GA2T / GA2D | Optional Alpha, global friendly pack, cache/rest, wardens ledger and Pack Sage mending | Complete branch with ordinary input and inspect the visible world-state change. |

Early coil, survey and raw-material discoveries are remembered; discovery is not
deleted merely because its request is late. The survey checks the actual terminal
read, not room arrival. Cull errands deliberately count from acceptance; they are
not pre-discovery quests. No new empty cave is needed to solve the existing value
problem: the next step is observing whether these distinct purposes communicate.

## Manhwa and cinematic parity

| Beat | Current mapping/source | Status and limit |
|---|---|---|
| Wake/bay/gate | `js/panels.js:49–89` | Source mapped; dated October 17 chronology certificate is historical. |
| Letter/drawer/repair | `js/panels.js:91–126`; `js/opening.js:73–145` | Gameplay reason survives film skip. Historical repair-board image inspected and readable. |
| Quarry/marble/forge/passage | `js/panels.js:128–167` | Material precedes blade; not a found sword. |
| GRAVEHORN intro/closeup/phase2/down | Queued `docs/ART_QUEUE.md:304–307`, absent from `PANEL_SEQ` | **Open**: four named beats are not existing runtime panels. Do not substitute unrelated manhwa shots. |
| Meeting/break/Sage/CHIME | `js/panels.js:168–215` | Mapped and conditional hit panel; exact anatomy/staging remains open. |
| Freedom/next-chapter teaser | `js/panels.js:216–243` | Teaser triggers crossing into B1, not midway up the camp ledges. |
| Full manhwa actions | `docs/story-draft2/GAME_ART_PARITY.md:3–15,49–61`; `docs/COMIC_PARITY_AUDIT.md:24–59` | Full page parity not certified. Cooperative cable, carrying/contact and case-opening gaps must not be hidden by displaying flattened comic art. |

Panel timing is defended in `panelsSafe`/`panelsTick`
(`js/panels.js:305–405`): arrival crossing or completed safe event, not a timed
interruption while fighting. Text uses shared reveal, first confirm completes,
separate confirm advances, silent panels alone auto-turn
(`js/panels.js:451–502,509–544`). Physical Arabic/mobile legibility is not proven
by source. Existing known `m_down`, inactive Servo and `passage_b` art corrections
remain localized queue items, not permission for wholesale regeneration.

## Historical runtime inspected, not rerun

I directly inspected October 17's `campaign-clean/frames/001-repair-board.png`
and `023-done-lion.png`. The board clearly names battery/socket/polarities/relay,
gives safe retry instructions and disables Restore Power before completion. The
post-lion frame clearly shows the golden lion alive beside HZD-99, but gift/relic
and equipment notification text overlaps across the HUD. This corroborates
`PUR-TOAST-01`; it does not establish today's fix status, lion gait quality,
subjective hit feel, audio fading or physical haptics.

The previous certificate is build `64bc72365fdf`, 17:00, easiest preset,
two deaths, zero page errors, sixteen ordered beats and recovered driver stalls.
It is useful historical progression evidence, not today's full run or a human
review of all caves. Keep today's new results/build identity separate in REPORT.md.

## Acceptance priorities for the integrator

1. Integrate reviewed save/button/eye fixes without replacing newer work; rebuild
   and run the complete unchanged suite on the integrated source.
2. Remove expired combat guidance at the ritual boundary and queue aftermath
   messages without losing permanent unlocks. Show before/after at gameplay size.
3. Read the corrected script, canon and event map together before producing art.
   Finish GRAVEHORN's approved parts/poses and four specific intercuts; retain the
   existing lion movie and authored ending. A prompt/queued asset is not completion.
4. Run fresh ordinary-input chapter one and explicitly visit optional Alpha and
   remaining side caves separately. Exercise physical touch/controller separately;
   record failure/friction without injecting completion or weakening assertions.
5. Verify hero raised-blade attachment/body movement, enemy contact/anticipation/
   recovery, finite red/purple trails, cleansed cleanup, actual audio handoff and
   reduced-motion presentation. Existing screenshots and source are not substitutes.

No merge, production deployment, new asset generation or external message was
performed by this reviewer.

## Today's ordinary-input observations — partial, through the forge

After the source review above, I read the already written portion of
[`automated/campaign-ch1.log`](automated/campaign-ch1.log)
through 14:33 and inspected today's saved
[`001-repair-board.png`](automated/campaign-ch1/frames/001-repair-board.png) and
[`018-done-forge.png`](automated/campaign-ch1/frames/018-done-forge.png).
I made no browser, game-state, input or runtime changes. This is a **partial
observation of today's running ordinary-input test**, not the October 17 evidence
and not a new full completion certificate. The producer's final REPORT owns the
served-build identity, complete route and result.

- At 00:02 the test records cleared storage, difficulty row 0 and video disabled.
  At 01:00–01:17 movement → leave → jump → gates teach separately. The booth
  objective then leads to Ratchet's letter (01:38), drawer (01:48), named unique
  battery card, and four-step repair board (01:54–02:00). The fresh frame clearly
  labels battery/socket, plus/minus wires and relay, with safe retry guidance;
  Restore Power is disabled at 0/4.
- Ratchet actually explains slowed infection, self-shutdown and the sleeping
  hero (02:10–02:15), then names raw marble, forge and Servo's separate cell.
  The log records the pod, the 12-scrap pack explanation (02:34–02:39), purchase
  at 02:42, heal lesson, winch Burst and **forward** monument puzzle
  (02:58–03:04). This verifies the sequence in this run rather than merely
  inferring it from source.
- Servo wakes and speaks at 03:12–03:15. He explains the hub's loose floor and
  offers a distinct gantry-coil job. The corridor meeting completes only after
  a death in A2 (04:16) and ordinary-input return; the next marble objective
  does not silently hand out a blade.
- Navigation friction is real in this log: five A2 `STUCK` reports while seeking
  the hatch (05:11–06:23), including excursions into A8, two CV2 stalls, and a
  CV3 return-exit stall (12:31). Each recovered without this reviewer modifying
  runtime. They are not automatically proof of an impossible route, but remain
  evidence against calling the tutorial/navigation frictionless.
- The CV1B survey pod is restored at 07:19. GRAVEHORN names the Eye and his
  material-guarding purpose at 08:30–08:34. A second death occurs in CV3 (09:46),
  followed by a retry from CV1B. He retreats at 12:04; the plain-claw refusal
  then teaches Burst, raw marble is acquired at 12:11, and the objective changes
  to returning it. This is no longer an empty cave or a found finished sword.
- At 13:31 Ratchet explains shaping and fitting the blade. `crystal` and single
  weapon mode arrive at 13:34. His **actual Alpha offer** follows at
  13:43–13:47: former worker escorts → corrupted howl → marked den → rescue
  and supply cache → explicit detour. The Alpha detour itself has **not** been
  played in the scope inspected here. The 13:54 forge frame visibly gives the
  next goal, “Free the first sage — the door beside the marble quarry.”

At this observation cutoff, two deaths and recovered stalls remain in the
evidence. Sage, CHIME, final lion ritual, aftermath clarity, B1 and optional
cave outcomes are **not certified by this appendix**. Do not turn this partial
review into a completed route claim; use the producer's eventual final result.
