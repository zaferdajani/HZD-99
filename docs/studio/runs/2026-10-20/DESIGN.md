# Senior design review — 2026-10-20

## Scope and authority

Six senior design responsibilities were instantiated together: Cinematic
Designer, Player Systems, Quest Craft, Principal Encounter Designer, Boss
Designer and Campaign Mission Designer. This reviewer read the complete
`AGENTS.md`, `CLAUDE.md`, `docs/DEVELOPMENT_AUTHORITY.md`, `docs/STORY_CANON.md`,
`docs/studio/PIPELINE.md`, `roles.json` and all six applicable mandates, plus
October 19's complete REPORT/DESIGN. Latest owner authorization is **review
branch only**, not the historical main/integration/mirror publishing routine.

Producer intake pins main and integration to
`62d75d204c6f6264f25150bb419fc262ff2c18ea`, unchanged from yesterday. Today's
branch is `codex/studio-review-2026-10-20`, based on
`f19aee0bc93400944402aeee45db00068abd8ebd`. This responsibility initially owned only
this report; the producer later assigned three comment-only blocks in
`js/world.js`, verified below. No executable game source was changed, and this
reviewer ran no browser, build or gameplay harness. Root owns
today's frozen build, bounded implementation, actual runtime evidence and final
REPORT. Later producer evidence supplements rather than silently relabels the
source/historical review below.

Evidence labels: **source-reviewed** is inspected current code; **historical**
is retained October 19 evidence; **visually inspected historical** means this
reviewer opened that prior capture today, not that it is a fresh capture. No
new uninterrupted playthrough, all-cave visit, physical touch/controller,
listened soundtrack or human first-time comprehension is claimed here.

## Separate responsibility verdicts

| Senior responsibility | Verdict | Evidence and limit |
|---|---|---|
| Cinematic Designer | Issues | `js/panels.js:306–386,451–544` retains safe doorway/event timing, separate reveal/advance and skip continuation. Four GRAVEHORN intercuts/action parity remain missing. Historical portrait capture is cropped; actual viewport/overlay state must be diagnosed before changing art. |
| Game Designer — Player Systems | Issues | `js/opening.js:71–196,266–335` retains letter → own battery → board → explanation → explicit pod → funded permanent pack → heal/Burst → forward monument. Scoped material-hint cleanup is inherited, not newly implemented. CJK/portrait and broad reward density remain separate acceptance gates. |
| Mission Designer — Quest Craft | Issues | Quarry material has a purpose and a changed return, Servo has a distinct paid coil errand, and optional Alpha has a motivation/landmark/global consequence. Source census is not proof that every cave's payoff is discovered or satisfying. |
| Principal Encounter Designer | Issues | `js/opening.js:247–259` protects Servo's first conversation; `js/progress.js:34–61` preserves physical lair/Sage/CHIME gates and bench migration. Historical mandatory route succeeds with deaths and recovered stalls; no fresh temporal fairness claim is made by this reviewer. |
| Boss Designer | Issues | Wolf pounce/bite/clinch/howl identity remains distinct; final principal-guardian hit begins deliberate rescue rather than death. Authored hero raise/hold/slash/recovery and complete rescued gait/contact quality are not certified by overlays/gold stills. |
| Mission Designer — Campaign | Issues | Mandatory **raw marble → Ratchet forge → Meadow Sage → CHIME → NULLFANG → B1 teaser** remains intact; Alpha is outside the prerequisite list. Exact comic action parity and optional branch input traversal remain open. |

## Comparison with October 19

No new main/integration changes or replacement assets are evidenced at intake.
The previous review already implemented scoped extraction-hint retirement in
`js/entities.js:2514,2819–2821`; do not apply it twice. Before acquisition the
hint remains useful; only successful extraction retires its `marble-extraction`
scope before reward delivery. The separate principal `boss-opening` retirement
remains in `js/purification.js:54–62`. Neither authorizes blanket toast clearing.

Historical October 19 full collector: 192/194 harnesses passed; `textreveal`
and `infection-roster` failed. Strict evidence integrity separately failed one
original log hash. The fresh mandatory keyboard chapter then certified complete
in 16:59 at easiest difficulty with two deaths and eight recovered driver stalls;
it is not frictionless/human/physical-touch evidence. Optional Alpha, A7,
A11–13, optional GA1 rest and actual coil acquisition were not certified by that
route. Today's final runtime outcomes belong in the producer's report; these
historical numbers must not be presented as a new run.

The enlarged flier candidate from yesterday is held on eye/body placement; size
readability success does not close it. This design report does not change visual
or collision thresholds, topology, combat statistics, canon or artwork.

## Chapter-one causal walkthrough — current source

| Player occurrence | Why / guidance | Consequence and source |
|---|---|---|
| Wake without a sword; move, leave bay, jump and enter gate | Deliberate sleep explains missed broadcast, not innate immunity. Current verb is taught alone. | Keep unearned equipment out of both game and intercuts; `js/text-opening.js:13–28`, `js/panels.js:55–89`. |
| Find dark Ratchet; read tag/letter before drawer | The letter says his necklace slowed infection and he removed his own battery. | Own battery is found, **not purchased**; `js/opening.js:71–96`, `js/text-opening.js:31–40`. |
| Seat own battery; wire board; restore power | Safe, retryable circuit task has explicit ordered parts. | Unique cell consumed once; wake film cannot omit explanation; `js/opening.js:115–129`, `js/text-opening.js:41–52`. |
| Hear short explanation; receive separate Servo spare; use pod | Ratchet tells why marble matters and says pod saves/recharges. | Material errand active; spare is not installed Ratchet cell; save confirmation completes before next lesson; `js/opening.js:132–145,266–277`. |
| Learn charge economy; buy permanent Volt Pack | Ratchet explains what/why/cost and pays 12 scrap for repair, avoiding mandatory grinding. | Permanent heal/Burst unlock differs from later refill; `js/opening.js:150–196`, `js/text-opening.js:63–89`. |
| Heal, strike winch, Burst beside it, solve monument ahead | Successful nearby release stops motor; failed distant release explains retry. | Physical road opens; no mandatory backwards tutorial detour; `js/opening.js:284–335`. |
| Wake grounded Old Servo with separate spare | Winding-house keeper names himself, points to loose hub floor and offers coil climb for 60 scrap/10 IQ. | Distinct NPC purpose and protected first speech; optional errand does not replace required quarry; `js/opening.js:203–259`, `js/text-opening.js:91–108`. |
| Meet lion warning; open loose floor and follow chalk road | Warning is not a prematurely resolved boss; landmarks identify underground route. | Safe story-protected body and meaningful directional marks; `js/game.js:199–208`, `js/progress.js:90–145`. |
| Enter CV3; defeat GRAVEHORN; extract rounded raw marble | Eye soldier guards the material; ordinary claw hint explains pack-powered extraction. | Return goal, not ready-made blade; success retires only old extraction instruction; `js/entities.js:2506–2515,2812–2831`. |
| Return to Ratchet; forge first white sword | Material has a causal payoff; Ratchet manufactures the purifier. | Earned single blade; optional Alpha offer becomes available; `js/quests.js:25–35`, `js/wolves.js:625–628`. |
| Revisit changed quarry; enter lit maintenance passage | Cut stump, sage-blue marks, bound robots and once-only line lead onward. | Return is purposeful, not identical corridor repetition; `js/progress.js:185–219,380–389`. |
| Rescue Meadow Sage; silence CHIME; enter lion enclosure | Sage reveals relay reasserting command; three milestones strip visible ward. | Sage network stands down; fresh order enforced; `js/progress.js:34–61,71–85`, `docs/CAVES_CH1.md`. |
| Land final hit; deliberately hold actual Free/Interact action | Existing attack input is released first; 1.6s hold gathers white energy; slash/impact transitions through black. | No automatic kill/reward; movie or matching fallback ends in alive golden guardian; `js/purification.js:54–128`. |
| Return to stage and climb beyond camp | NULLFANG's release opens chapter exit; relevant teaser appears at B1 crossing. | Not an interrupting mid-climb comic or completed chapter two; `js/panels.js:233–243`, `js/world.js:820–823`. |

This is a source walkthrough, **not a new recorded playthrough**. Objective
readability, deaths/confusion, actual input, skipped/unskipped films and optional
coverage must be supplied by the producer's separate fresh evidence.

## Alpha: optionality, backstory and enforcement

`js/i18n.js:1543–1549` retains *The lost wardens*: wolves escorted lost workers;
the corrupted Alpha now drives them against people; marked den + earned white
blade can return them; pack friendship and supply cache provide reward. The
fourth line explicitly calls this a detour and says the first marble came from
the cave. `alphaQuestOffer` waits for `crystal`, records `alphaLead` once, and
activates `alpha_pack` (`js/wolves.js:625–628`, `js/quests.js:23`).

The depth entrance is off A2, rather than inserting Alpha before the lion on the
main road (`js/game.js:9293–9294`). `PG_LAIR_NEEDS` is exactly blade, Meadow Sage
and CHIME, never Alpha (`js/progress.js:34`). Completion records friendly wolves
globally from saved `alpha`, marks quest done, gives cell +60 scrap and opens its
own continuation (`js/game.js:311–325`, `js/wolves.js:58–60`). This is a real source
consequence, not just reward prose. A full ordinary-input optional route is still
needed to verify navigation, encounter, cache and persisted friendship together.

**ALPHA-COMMENTS-19 / P3 — comment-only correction implemented.**
Before this patch, `js/world.js:36,763–768,790–795` described the Alpha as the
road before the camp, contradicting actual optional topology and canon. On the
producer's explicit file assignment, this reviewer corrected only those three
comment blocks: main meadow seams now name A1 → A2 → A3 → A4; the eastern vista
points toward camp; the den explanation names the optional forged-blade depth
detour, Lost Wardens motivation and pack/cache reward. No route, room object,
exit, gate or entity was edited to fit obsolete commentary.

`node --check js/world.js` exits 0. A source identity check removes only complete
`//` comment lines from HEAD and candidate, then compares the remaining text
byte-for-byte: **equal**. SHA256 before and after is
`c0a39e1492c8dab32c5ed8982ff8fc53d46725a5f45c32552faa07cfa473c994`.
Explicit checks find the corrected road, optional blade detour and statement that
camp/NULLFANG do not require Alpha. This proves the bounded non-executable change,
not a newly played optional quest. `PG_LAIR_NEEDS`, bench migration and physical
route remain untouched; producer owns their fresh gameplay regression checks.

## Cave census — outcomes in source, not fresh all-cave inspection

Reviewed `docs/CAVES_CH1.md`, `js/quests.js:23–58,112–174`,
`js/progress.js:185–219`, relevant room definitions and progress text. Different
benefits exist; ordinary exits or a staged room load alone are not a meaningful
player discovery certificate.

| Cave/group | Distinct discovery/payoff | Required player-facing acceptance |
|---|---|---|
| A5 | Riddle/Magnet crest, maintenance log, buried quarry mouth and chalk road | Loose hub floor/mouth recognized from guidance, not internal map knowledge. |
| A7 | Quarrymen's survey explains white seam; read errand earns relic/scrap | Read terminal 20, not merely arrive; pre-read discovery remembered and paid once. |
| CV1 | Bound crawler plus climb-pocket spare core/max-health improvement | Reachable chest and later visibly freed same body; not identical enemies/scrap reward. |
| CV1B | Survey pod restores facility, charts CV1–CV3, shortcut/rest | Map/route consequence visible, not just another generic bench. |
| CV2 | Deaf System founding evidence and lure/beacon resolution | Readable evidence justifies long traversal; fresh pacing judgment still needed. |
| CV3 | Guarded raw marble; forged return has cut stump/blue passage | Useful hint before extraction, no obsolete hint afterwards, clear forward Sage route. |
| GA1T | Refuge log and chamber/grotto junction | Story and east path readable; west rest clearly optional. |
| GA1 | Rest before Sage; post-lion shortcut into enclosure | Door physically absent until completion; later return creates a meaningful loop. |
| GA1D | Sage rescue/revelation, local network calm, cell/card | Changed friendly people now and after reload; not kill/reward text alone. |
| A11 | Hidden coin relic beyond CHIME's wall | Small reward-only pocket is one variety, not template for every cave. |
| A12 | Dash-gated star below camp | Later earned dash motivates revisit; do not claim mandatory route visited it. |
| A13 | Receiver/dry-cell history for Servo and coin | Discovery stays coherent after Servo awakens. |
| A10 / GA2 / GA2T / GA2D | Optional Alpha → friendly global pack → cache/rest/wardens ledger/Pack Sage mending | Ordinary-input navigation/rescue/cache/reload proof distinct from mandatory route. |

Early coil/material/survey discoveries remain valid through `questItemLive`,
`qReadDone` and `questFoundEarly`; culls intentionally count from request. Preserve
that distinction. The historical opening test injects the coil for paid hand-in;
it did **not** prove the actual gantry climb/acquisition.

## Manhwa, captions and physical-action parity

| Moment | Source correspondence | Unclosed acceptance |
|---|---|---|
| Wake/bay/gate | `js/panels.js:55–89`, `docs/MANHWA_EVENT_MAP.md` | Exact cradle/reaching/physical scene correspondence, not just illustration displayed. |
| Letter/drawer/Ratchet repair | `js/panels.js:91–126`, `js/opening.js:71–145` | Own battery and timing agree; drawer/socket/installation and inactive Servo optics need exact comparison. |
| Cave/material/forge/passage | `js/panels.js:128–168` | Raw rounded marble then earned blade; hand-carry/manufacturing/contact anatomy still require parity. |
| GRAVEHORN intro/closeup/phase2/retreat | `docs/ART_QUEUE.md:304–307` | Four specific `gh_*` panels are queued, not delivered/integrated; no unrelated substitutes. |
| Warning/break/Sage/CHIME | `js/panels.js:170–215` | Injury panel conditional on actual injury, bell writing while active; literal cable/case-opening actions not implemented. |
| Guardian freedom and B1 teaser | `js/panels.js:216–243`, `js/purification.js` | Completed rescue triggers and equipment timing retained; hero body raise/hold/slash and four non-lion matching ritual films remain separate. |
| Whole pages | `docs/COMIC_PARITY_AUDIT.md`, `docs/story-draft2/GAME_ART_PARITY.md` | Cooperative cable rescue, hand-carrying, knock/contact and literal case opening remain unsupported or need redraw; no complete chapter/page parity certificate. |

The shared reader (`js/panels.js:451–544`) progressively reveals captions; first
confirm reveals and a separate debounced confirm advances. Captioned panels do
not auto-dismiss, silent shots can hold/turn, failed media cannot strand progress,
and Arabic is right aligned. This source behavior is not actual CJK glyph support
or phone legibility. Preserve the original Chinese fixture until a font-complete
browser comparison establishes its cause; do not reduce text or relax wrapping
assertions to declare a pass.

## PORTRAIT-CUT-19 — historical visible failure; fresh diagnosis required

**P2 UI/cinematic presentation.** I opened the retained
`../2026-10-19/automated/opening-frames/phone-portrait-390x844.png` at its native
780×1688 raster. It shows a mostly dark portrait with the right portion of a
wide story panel/caption/gutter clipped offscreen and a skip hint, without usable
rotation guidance. This is a concrete sampled failure, not an assertion that all
portrait screens are broken. The original harness (`tests/opening-order.cjs:50–65`)
assumes “rotate” appears, photographs once and turns landscape; it does not assert
visible guidance. It programmatically starts a save and uses keyboard traversal
even in `hasTouch` context.

Relevant source: `drawTouchUI` always follows draw in `mainLoop`
(`js/game.js:18157`). It computes `TOUCH.portrait = H > W` from stored `vw/vh`
and explicitly draws the translated rotate instruction (`js/touch.js:779–796`).
`tcResize` derives those dimensions from `visualViewport`, then potentially
`TOUCH.vis`/IntersectionObserver, with CSS canvas bounds (`js/touch.js:78–113`).
Thus the source has a guidance branch; the capture alone does not establish
whether viewport measurement, stale geometry, overlay visibility/stacking or
another route caused it to miss the sampled frame.

Fresh reproduction should record innerWidth/Height, visualViewport dimensions,
TOUCH.rawW/rawH/vw/vh/vis/portrait, #cv/#tc client rectangles and display state
before/after rotating CUT, PANELS, PLAY and REPAIR. Do not change art crops or
disable safety pauses without that evidence. Verify visible, contained guidance
in portrait, intact active reader after return, no held input carrying a skip/
purification completion, and repair persistence. Add a behavioral/visual
assertion, not another screenshot-only comment. Physical phone confirmation is
separate from successful emulation. This reviewer does not claim a fix.

## Integration acceptance

1. Consume final producer results for today's fixes and same-build checks;
   preserve retained before/after failures and evidence provenance. Do not
   double-apply inherited notice, save, eye, script or campaign-import changes.
2. Keep the mandatory material/forge/Sage/CHIME/lion order and optional Alpha;
   verify mandatory fresh input separately from optional Alpha/all-cave route.
3. Reconcile each actual comic panel with physical supported action and earned
   equipment before approval. Prompts, flattened panels and source-presence
   claims do not close missing authored assets/performance.
4. Preserve the completed lion ritual/outro. Verify unskipped ending plus actual
   separately routed music; encoded soundtrack fade and Enter-driven CUT passage
   are not proof of what the player hears.
5. Keep actual touch/pad/haptics, real-device performance, full motion contact
   and readable CJK/RTL captions as explicit gates. A green subset or a single
   gold/rest frame is not studio-quality certification.

## Fresh producer evidence appendix — opening scope and NPC label

This appendix records fresh evidence from the producer's frozen build
**`5b19cbfbf709`**. I read the completed
[opening-order log](automated/opening-order.log) and the
[capture manifest](automated/opening-frames/manifest.json), inspected the retained
desktop and phone letter frames at native size, and re-read the related source.
I did not start another browser, change runtime/tests or disturb the concurrent
unsegmented campaign. The appendix updates these specific conclusions only; the
October 19 route above remains historical, never a substitute for today's route.

| Fresh case | Actual outcome | What it establishes / does not establish |
|---|---|---|
| Desktop opening | All 15 ordered tutorial steps reach A1; 47 captures; Servo initially dark, restored, introduced, repeat dialogue and paid coil hand-in; zero page errors | Fresh keyboard execution confirms inherited causal tutorial behavior. The harness starts via `startGame(newSave(1))` and injects the coil before hand-in; not menu-only whole chapter or actual coil acquisition. |
| Phone viewport opening | **FAIL**: 13 steps through `burst`; end A0; 37 captures; monument/meadow/Servo not reached; zero page errors | A failed keyboard-driven mobile-viewport case, not a successful touch playthrough. Reached lesson/counter/repair states remain bounded observations; later required outcomes are absent. |
| Overall `opening-order` | **FAIL**, 476.2 seconds reported | Desktop success does not erase phone failures or make the whole harness green. |
| Raw capture archive | 85 captured files hashed: 47 desktop +37 phone +1 portrait; **17 selected actual files retained** | Four planned phone monument/Servo selections are explicitly missing. Other captures have hash records, not retained raw images; do not claim all 85 were archived/visually reviewed. |

### OPENING-PHONE-20 / P2 — incomplete phone case, cause not isolated

The harness's per-case loop uses a wall-clock **240,000ms** deadline
(`tests/opening-order.cjs:77`). The manifest's phone portrait capture is
`08:50:37.221Z`; its final `phone-36-burst-charging.png` is
`08:54:37.742Z`, **240.521 seconds later**. The producer separately reports the
raw portrait mtime rounded one millisecond earlier (240.522 seconds); neither
measurement is an exact recorded loop-start time. Only one phone charging
attempt is retained. The harness's charge branch presses X, waits 900ms,
photographs charge, releases X, waits 400ms and only then reads another loop
state (`:219–222`). The failed final summary alone does not show that last
release's simulation/input outcome.

Consequently this is **not evidence that the charge mechanic is broken**, nor
proof that merely extending the deadline fixes it. Possible test/setup/time
budget versus dispatch/simulation/progression causes remain to distinguish.
Acceptance: record milestone wall/simulation timestamps and actual input down/
up, charge amount, volts, winch contact/disabled state, tutorial flags and the
post-release state; preserve the existing failed run. Reproduce the full phone
opening without injected progression, determine the first broken boundary,
then fix the demonstrated cause and rerun unchanged gameplay expectations. Do
not certify monument or Servo by staged arrival, relax assertions or blindly
increase timeout. Actual touch and physical device validation remain separate.
Owner: UI/input QA and player-systems engineering.

### NPC-LETTER-LABEL-20 / P2 — world cue contradicts the actual action

**Fresh actual-frame observation plus source.** In retained
[desktop letter frame](automated/opening-frames/desktop-11-note-int.png),
1280×720, the tutorial says **Read the letter** and explicitly describes a
switched-off robot, while the marker above Ratchet says **E — Talk**. The same
generic Talk label appears partly beneath the lesson in the retained
[phone letter frame](automated/opening-frames/phone-11-note-int.png),
1688×780 raw. This is an action-label mismatch, not evidence that the letter
interaction itself fails: desktop/phone logs both proceed beyond it.

`js/game.js:12884–12897` defaults every NPC marker to `t('talk')`, asking
`opNearLabel(s)` for a more specific override. That override
(`js/opening.js:469–472`) handles **Servo only**. For offline Ratchet,
`opRatchet` actually reads the letter when his own cell is absent and prompts
installation/repair when it is held (`js/opening.js:71–96`). A robot marked Talk
before power-up weakens both the letter clue and the intended switched-off story
state, even though the lesson itself is correct.

Smallest follow-up: extend the existing localized action-label override for
offline Ratchet at A0B, reflecting the actual letter/seat-repair branch and
current input binding. Preserve normal live talk/shop behavior, own-cell versus
Servo spare distinction and existing Servo cues; do not change the battery
quest to justify generic Talk. No fix is made during the frozen collector.

Acceptance: actual gameplay-size captures and behavior checks show correct
letter label without own battery, appropriate restore/seat label with it,
and ordinary dialogue/shop marker once awake; verify repeat/older-save cases,
keyboard remapping, controller/touch and at least EN/AR without hard-coded E.
Marker must not collide with tutorial/chip or falsely promise unavailable
interaction. Owner: UI/NPC engineering. This is a new, bounded clarity finding,
not a claim that the entire first-NPC sequence remains nonfunctional.

The Cinematic, Player Systems and NPC-adjacent design verdicts remain **Issues**
on this evidence. No other design responsibility is promoted to pass from these
opening checks. Fresh full-route outcome, portrait/CJK/flier diagnosis and final
integration decision are owned by the producer's REPORT and evidence; they are
not inferred here while the campaign is still running.

## Final fresh campaign outcome — incomplete, not certified

**This final appendix supersedes the pending-campaign wording above. October
20 does not have a completed continuous chapter certificate.** I read the closed
[authoritative campaign result](automated/campaign-ch1/result.json), the ending
of its [retained trace](automated/campaign-ch1/campaign.log), actual game-written
[latest save](automated/campaign-ch1/save-latest.json), and the closed
[full collector results](automated/results.json). No browser or runtime/test
edits were made for this appendix.

The fresh unsegmented ordinary-input campaign ends **`timeout`, `certified:false`,
55:00**, easiest difficulty 0, zero deaths, one recorded driver stuck event and
zero page exceptions. `segment:null` and `stopAt:null` confirm this was not an
intentionally partial segment. The producer reports no inventory/quest flag
injection or teleport progression. Read-only internal observations and a
physics/input planner remain assists, not human first-time play.

| Fresh coverage | Actual result |
|---|---|
| Completed missions | `opening`, `servo`, `first-meeting` only; **marble unfinished** |
| Rooms reached | W1 → W2 → A0 → A0B → A0 → A1 → A2 → A5 → CV1 → CV1B |
| Ordered panels seen | Eight: wake, bay, gate, letter, drawer, ratchet, meet, cave |
| Required sequences not reached | marble, forge, passage, sage, break, chime, free, ch2 |
| Panel ordering/page exceptions | No observed order errors; no page exceptions; neither implies completion |
| Mandatory downstream route | Raw marble extraction/forge/Sage/CHIME/lion rescue/B1 teaser **not certified today** |
| Optional branches | Alpha, other side caves and coil acquisition likewise not certified by this route |

The final trace repeatedly reports the same CV1B position and nearby bat threat
while the driver attempts combat. This is an observed stalled route, not proof
that a human cannot leave or that a particular art/collision/AI subsystem caused
it. Preserve the timeout and inspect the first broken input/physics/combat
boundary before assigning cause; no damage, collider, deadline or acceptance
change was made here to obtain a pass. A later successful staged encounter or
segment must not replace this failed whole-route execution.

**Meaningful cave outcome actually obtained:** at 04:23 the player rests at
CV1B's pod; at 04:24 the trace records its survey wake/map toast, `pgSurvey`
and savepoint change to CV1B. The retained save agrees: bench room CV1B,
`flags.pgSurvey:1`, and `charted.CV1/CV1B/CV2/CV3:1`. This fresh ordinary-input
observation corroborates a restored facility/map benefit, not merely scrap or
room arrival. **Charting CV2/CV3 does not mean those caves were entered.** It
does not certify the rest of the census or later forged return.

The closed full collector requests all **196 harnesses: 192 pass /4 fail**.
The failures are `purification-controls`, `winch-purpose`, `opening-order` and
`campaign-ch1`; complete requested execution is true but aggregate pass is false.
The collector closes at `2026-10-20T09:51:32.014954+00:00`. Original failed gates
remain original failed gates; root's post-run analyses and independent staged
checks have separate provenance and cannot rewrite them. Full diagnostic causes,
identity/integrity and publication status are owned by the producer's REPORT.

The Campaign and Encounter responsibility verdicts remain **Issues** with a
fresh failed end-to-end gate. The successful October 19 16:59 route above is
historical only. Chapter-one release certification is withheld today even though
source causality and a bounded cave payoff are corroborated.
