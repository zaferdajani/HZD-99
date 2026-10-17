# Design responsibilities — 2026-10-17

Source pin: `62d75d204c6f6264f25150bb419fc262ff2c18ea`. Six senior responsibilities instantiated in this review group. Read-only source review against `docs/STORY_CANON.md`, role mandates, the October 16 studio report and the subsequent combat/purification evidence. This reviewer made no runtime edits, ran no browser/build concurrently with the producer, and claims no new uninterrupted playthrough. The producer's current-run logs and captures must supply runtime acceptance.

## Material changes since the previous studio report

The previous report was based on main `14bef4b` and described review fixes as unintegrated. Current main contains `6ab1437` and the later combat/purification commits. **Do not carry the previous “unintegrated” label forward.**

- STORY-1: the specific pre-meeting A2 cracked hatch is gated at `js/game.js:198–205`. Other cracked tiles are not swept into the restriction.
- CIN-4: `panelsDue` now accepts the ordinary sequence's `alsoRoom` at `js/panels.js:328–342`; the A2/A3 break explicitly declares both rooms at `:183–190`.
- QA-09: `tests/campaign-ch1.cjs:60–89` requires all 16 existing panel sequences in order, zero page errors/missed panels, and no segment/developer stop for certification. This is source evidence, not a fresh campaign result.
- COMBAT-4/5 and UX-05: protected target screening and device-aware grapple guidance are present (`js/grapple.js:53–75`); retain them.
- Principal guardians now have a protected, deliberate hold-to-free ritual (`js/purification.js:38–101`). Only the lion has a newly generated film in its manifest (`:2–6`); four other kinds deliberately use the in-engine choreography. Alpha and Mother's ending are excluded from this principal-guardian path.
- `c3e892e` already corrects the lion film ending. `docs/combat/purification-2026-10-16/HIGGSFIELD_SCRIPT.md:34–38` records a 13.25-second edited runtime, picture fade 11.5–13.0 seconds, soundtrack fade 10.25–12.25 seconds. `js/game.js:5700–5704` avoids a redundant long black hold. Do not regenerate or “fix” this again without a current reproduction. The same production note distinguishes standalone soundtrack from muted in-game video with separate game music.
- Latest `62d75d2` changes soft light shafts and bound-body rendering, and prevents incidental falls/spikes from creating persistent bound rescues. The commit explicitly calls the disabled-wolf transform a stand-in, with authored art still queued. This is not completion of an authored prone animation.

## Separate role verdicts

| Role | Verdict | Evidence and acceptance still owed |
|---|---|---|
| Senior Cinematic Designer | Issues; improved source coverage | Alternate-room trigger fix integrated; 16 panel beats and typed captions remain. New purification outro exists. Actual hold/slash/body alignment and transitions need current gameplay-size capture. Four new guardian movies remain unavailable. |
| Senior Game Designer — Player Systems | Issues | Pod objective/confirmation and item identification exist (`js/opening.js:101–144,272–278,339–352,481–505`). New ritual instructions hardcode E despite controller input being accepted. First-NPC clarity must be judged in ordinary play, not from presence of strings. |
| Senior Mission Designer — Quest Craft | Source pass for quest intent; experiential acceptance open | Forge fetch has a material and reward; Servo coil and Ratchet survey are different errands; early fetch/read discovery is retained (`js/quests.js:23–58,93–125`). New cave census documentation omits the required rhino encounter. |
| Principal Encounter Designer | Issues | Correct limited hatch gate, physical lion/bell wards, authored CV3 rhino arena and post-rhino ambient population are present. Fairness, boss telegraph comprehension, return-route traversal and visual collision need fresh play. |
| Senior Boss Designer | Issues | Five principal guardians require earned sword and deliberate release/hold, with cancellation and delayed reward ownership. Alpha remains optional. GRAVEHORN still needs authored plates/panels; generic hero charge plus separate ritual blade overlay does not by itself certify the requested raised-sword performance. |
| Senior Mission Designer — Campaign | Issues; no certification by this review | Blade → Sage → CHIME → NULLFANG is enforced in `js/progress.js:34–63`, with Alpha absent from required flags. Required cave return gains changed marks, exposed stump, opened passage and rescued bodies (`:185–219`). Previous successful lion continuation was restored-save diagnostic, not fresh full chapter. |

## Findings / carry-forward acceptance

| ID | Severity / status | Evidence, player consequence and smallest action | Acceptance / owner |
|---|---|---|---|
| PUR-UX-01 | P2 / new, source-confirmed | `js/purification.js:9–13,155–156` embeds “E” in the displayed instruction and aria-label in every language, while `:89` accepts `inD('INT')`. Default controller INT is button 1 (`js/engine.js:56`) and controller mapping is configurable. A pad player is told a keyboard key at the climax. Reuse device-aware interaction-label logic; retain accessible button and localized hold wording. | On keyboard, touch and remapped controller, instruction names the actual available input, and both rendered/accessible descriptions agree. Owner: UI + player systems. |
| CAVE-LEDGER-01 | P3 / new documentation drift | `docs/CAVES_CH1.md:58` jumps from arriving in CV3 directly to bursting marble. `js/world.js:1693–1703` contains GRAVEHORN guarding it, and `js/progress.js:78` makes him the current objective. This misleads future walkthroughs/implementers. Update the ledger with his prerequisite, encounter outcome and the existing legacy-save handling, without changing progression to match the old prose. The ledger's universal no-shake rescue description must also distinguish ordinary rescue from the new owner-directed principal-guardian cinematic impact. | Cave/script/ritual ledger matches current source and clearly labels staged verification. Owner: mission design + production. |
| GH-ART | P1 / carried production gate | `docs/ART_QUEUE.md:259–311` still queues modular GRAVEHORN plates and four `gh_*` manhwa beats. The current campaign certificate itself explicitly excludes nonexistent GRAVEHORN panels (`tests/campaign-ch1.cjs:60–65`). Passing that certificate therefore cannot certify all owner's manhwa parity. | Produce/integrate each missing approved beat once; capture corresponding actions/gear timing in-game. Owner: character/cinematic art. |
| PUR-FILM-01 | P2 / known blocked asset scope | `PURIFICATION_MOVIES` has only `glitch`. `js/purification.js:97–101,125–149` supplies a finite in-engine fallback for brood/atlas/zero/prism. Existing production validation records the generation credit blocker. Do not describe these as four completed Higgsfield movies and do not substitute old films that lack sword absorption. | Four matching reviewed films, or explicit owner acceptance of the authored fallback. Functional fallback acceptance remains separate. Owner: cinematic production. |
| PUR-POSE-01 | P2 / visual verification required, not a reproduced defect | The ritual drives `player.chargeT`, and draws a blade as world-space lines (`js/purification.js:91,105–122`); fallback draws normal hero then another blade (`:129–139`). `Player.heroState` selects ordinary charge (`js/entities.js:3084`). Source alone cannot establish that the paw rises, grips the same blade, follows the slash, or avoids two visible swords. | Inspect both facings at actual gameplay size through hold/slash/return. Reuse approved matching poses before generating; only change art/renderer if the capture demonstrates detachment or wrong pose. Owner: boss + character/cinematic design. |
| QA-09 | P1 / integrated tooling; runtime gate outstanding here | Strict certificate now present. Historical October 16 fresh run crashed on an earlier candidate at the lion; the final saved continuation reached chapter two but is explicitly partial-diagnostic (`docs/combat/purification-2026-10-16/VALIDATION.md`, Real-input campaign). | Fresh save, ordinary input, full uninterrupted chapter, ordered panels, no console errors; report optional caves separately from mandatory route. Owner: campaign + producer. |
| STORY-1 / CIN-4 | Previously open / integrated, awaiting current-run runtime evidence | Specific hatch restriction and alsoRoom fix are in current source, as cited above. | Retain and verify; do not duplicate the patch or label it unintegrated. Owner: mission/cinematic engineering. |

GRAVEHORN art brief also still asks for RED eyes (`docs/ART_QUEUE.md:277,283,305`) despite the owner's general purple-boss rule. This is handed to the art reviewer for identity/runtime-policy reconciliation, not asserted here as a freshly observed gameplay defect. Avoid spending generation credits from a contradictory brief.

## Chapter-one walkthrough contract — source reconstruction only

Wake and movement teaching precede the bay/city panels. Ratchet's letter explains his removed battery before its drawer pickup and repair board. Revival then provides the spare cell, marble purpose and pod direction. Volt-pack purchase unlocks healing and Burst, with the tutorial proceeding forward before deliberate exploration/backtracking. The NULLFANG meeting precedes opening the quarry hatch. In the quarry network, GRAVEHORN guards the raw marble; the material must be carried to Ratchet, who forges the white cleansing sword. The changed return route leads to the first Sage, who reveals CHIME. Silence CHIME, enter the physically gated lion den, win combat, deliberately hold to free the guardian, view purification, receive the rescue outcome, then leave through the chapter-two transition. The Alpha offer is an optional post-forge detour with a pack-wide friendly consequence.

This describes source intent, **not “I played it today.”** Whether each pickup/objective/panel feels legible rather than cluttered requires the producer's recorded ordinary-input journey.

## Complete chapter-one cave census (source-inspected)

`docs/CAVES_CH1.md:51–65` is the existing ledger; source cross-checks below distinguish outcome from mere existence of an exit.

| Space | Purpose / distinct outcome | Guidance / revisit / evidence |
|---|---|---|
| A5 | Riddle, Magnet crest, maintenance log and quarry mouth | A2 limited hatch gate; chalk marks. Ledger :53; trail data `js/progress.js:92–107`. |
| A7 | Quarry survey; Ratchet's 80-scrap + coin errand | Must read terminal 20; early reads remembered. `js/quests.js:49–58,115–125`. Not Servo's errand. |
| CV1 | Climb-only pocket adds spare core; buried optional Seam entry | One crawler and chest authored, source `js/world.js:1602–1621`. Return permits rescue of bound machines. |
| CV1B | Rest facility + survey map unlock, alternate route | Rest charts CV1/CV1B/CV2/CV3; `js/world.js:1640–1649`, `js/progress.js:203–212`. |
| CV2 | Founding log/beacon resolves the sound lure | Terminal 5 at tile 26, varied hoppers/crawler/bat; `js/world.js:1651–1691`. Not just scrap, but actual listening/readability still unverified. |
| CV3 | GRAVEHORN encounter, then raw marble for forge | Boss/pillar and controlled ambient spawn `js/world.js:1693–1716`; current rhino goal `js/progress.js:78`. Return gains cut stump/passage/blue marks `:185–190`. |
| GA1T | Refuge story log + junction toward Sage | Terminal 6 replacement `js/world.js:1992`; canon is discovery after forging. |
| GA1 | Rest before Sage; later lion-den shortcut | Generated room network `js/world.js:1897`; shortcut remains after bossGlitch, not bypass into locked den. |
| GA1D | Sage rescue, CHIME revelation, calm network, cell/card | Sage milestone gates bell and lion (`js/progress.js:34–43`); no claim of new physical traversal. |
| A11 | Hidden coin relic and scrap | `js/world.js:1549–1559`; comparatively light payoff. Shared coin type warrants a repeated-reward comprehension check, not an invented unique lore reward. |
| A12 | Post-lion dash challenge for star relic | Twelve-tile spike gap and return climb `js/world.js:1561–1577`. Meaningful return with new ability. |
| A13 | Servo receiver/cell story + coin | Unique terminal 21, safe room `js/world.js:1579–1591`. Distinct evidence despite reused coin reward. |
| A10 / GA2 / GA2T / GA2D | Optional Alpha, friendly pack, cache/rest, wardens' ledger, Pack Sage reward | Quest after forge `js/quests.js:23`; `js/wolves.js:627–628`; generated network and terminal22 `js/world.js:1898,1996`. No Alpha flag in lion's required milestone array. |

The census shows distinct authored purposes. It cannot prove each purpose is found, understood, navigable, or enjoyable; especially inspect A11's light reward and repeated coin pickups, and the long CV2 traversal in ordinary input.

## Manhwa parity matrix

| Beat group | Current source evidence | Remaining visual/narrative check |
|---|---|---|
| Wake/bay/gate | `js/panels.js:60–88`; deliberate manual wake before movement, arrival-based transitions | Approved identities, no unearned blade, pacing and readable multilingual text. |
| Letter/drawer/repair aftermath | `:93–128`; letter before battery retrieval, Ratchet sequence after repair/quest | Preserve battery vs bought volt pack distinction; existing r_cell off-state art finding goes to art reviewer. |
| Meeting / temporary break | `:170–190`; damage panel conditional on actual core loss, break can occur A2 or A3 | Show only earned event; runtime panel shouldn't claim hit if player dodges. |
| Cave/marble/forge/passage | `:129–168`; raw material before forged blade; passage gated by crystal | GRAVEHORN's four missing beats are an explicit gap; existing passage anatomy concern goes to art reviewer. |
| Sage/CHIME/free/chapter2 | Required ordered sequence names `tests/campaign-ch1.cjs:64–65`; chapter2 triggered at crossing rather than climb toast (`js/progress.js:222–229`) | Fresh full-route trigger/skip evidence; final cinematic/body restoration agreement. |
| Principal purification films | New earned-sword choreography, lion movie + four fallback sequences | Actual video is not proof of every game pose; inspect raise/slash/golden return at gameplay scale, and distinguish standalone soundtrack fade from game music transition. |

Panel captions use progressive reveal with separate complete/advance semantics (`js/panels.js:455–477,515`); source implementation is not a reading-speed usability pass. Panels are already approved production assets: do not regenerate whole groups to address localized issues.
