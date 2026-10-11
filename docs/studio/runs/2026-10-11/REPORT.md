# CLAWBYTE senior studio review — 2026-10-11

## Decision and scope

This review found and corrected two narrative-panel selection defects, a pipeline timeout defect and an inconsistent performance-test fixture. It also found a newly visible hero-identity mismatch in the integrated repair panel and prepared a corrected, non-destructive art candidate. The candidate is visually reviewed but **not wired into the game or owner-approved**.

**Release gate: NOT GREEN.** All 166 registered harnesses ran: 164 passed and 2 failed (`roomcache`, `opening-order`). The roomcache fixture was diagnosed, corrected and separately passed; opening-order remains unresolved. Build, package and start/end served identity passed. The fresh keyboard campaign completed in 13:36 with one death and zero page errors, but showed only 12/13 sequences and a late cave introduction. See VALIDATION.md for exact scope and preserved failures. No production merge or deployment is performed by this audit. The review branch is [`codex/studio-review-2026-10-11`](https://github.com/zaferdajani/HZD-99/tree/codex/studio-review-2026-10-11).

## Baseline, changes and evidence

- Prepared source-fix commit: [`31d761d476a7097a12fa70d9eed41d3784628bc6`](https://github.com/zaferdajani/HZD-99/commit/31d761d476a7097a12fa70d9eed41d3784628bc6). Critical source/test blobs were fetched back and matched before publishing the report branch.
- Main and integration (`claude/clawbyte-repo-migration-byhyl8`) both resolved to `7b48b89d5fb2643ef58965eed36b6b8a06dddfd7` at intake. Base tree: `99772d8a4859064f035c4aecd516417d871c8d98`.
- The checkout began clean. The audit's code changes are confined to `js/panels.js`, its regression test, the collector/test, and a diagnosed room-cache test fixture; documentation and a source-only image candidate are separate deliverables. No live hero, Alpha, wolf or lion asset is replaced.
- The original Oct10 report is superseded, for status, by its later `INTEGRATION.md` and `NEXT_REVIEW.md`. There are 198 changed files between the prior review commit and today's baseline; `changes-since-review.txt` records the comparison.
- Build/package ran once after gameplay source edits. `frozen-hashes.json` records 65 source, runner and built-file hashes; the collector pins and rechecks served identity. Subsequent report writing and candidate generation did not change the served game.
- Fresh live comparisons in `live.json` match the pinned baseline (BUILD_ID `49988b950264`; reviewed local build `aee134b4b5ee`) for `index.html`, Alpha air strip, repair panel and eye map. This confirms those sampled deployed files, **not today's review fixes or candidate** and not every live asset.
- Three specialist agents covered six design, three art and five engineering responsibilities; the producer covered the fifteenth. This is fifteen review responsibilities, not fifteen independent human reviewers.

Evidence labels: **source** = inspected implementation; **staged** = injected save/room/pose state, then real rendering or input; **input-only** = fresh browser, game controls, no game-state writes; **historical** = prior integration evidence; **observed** = inspected actual image; **candidate preview** = temporary request substitution, not integrated runtime.

## Fifteen role verdicts

| Role | Verdict | Evidence and remaining limit |
|---|---|---|
| Senior Cinematic Designer | Issues — two fixed, timing open | CIN-4/CIN-5 source and staged regressions; fresh campaign reproduces late cave-entry and missing passage scenes (CIN-2/QA-09) |
| Senior Game Designer — Player Systems | Issues — opening gate failed | QA-08 fresh opening fails before meadow; keyboard/pointer in desktop/mobile viewports, injected start and staged Servo reward |
| Senior Mission Designer — Quest Craft | Pass — read-based quest checks | Terminal20 read semantics, early discovery and paid-save migration; survey-a7/caves-ch1 evidence |
| Principal Encounter Designer | Issues — traversal recovery | TER-1 quarry fall line; campaign uses easiest preset and automated control |
| Senior Boss Designer | Issues — feel/persistence review open | Existing ten-strip Alpha retained; Sage damage retention freshly observed; cross-boss policy still open |
| Senior Mission Designer — Campaign | Issues — route completes, narrative timing fails | Fresh title-to-teaser campaign completes; passage scene missing and cave intro late; optional Alpha not traversed |
| Senior Mission Producer | Pass — review scope | Changes/evidence preserved; no production actions; candidate clearly separated from tested runtime |
| Senior Character Artist | Issues — candidate prepared | ART-3 repair face and ART-4 passage limbs; new Alpha generation is already complete |
| Senior Cinematic Director | Issues — identity parity | 17 integrated panels and clean captions exist; repair candidate resolves one visual mismatch in preview |
| Senior VFX Artist | Issues — low-tier competition | Fresh guardian subset 50 poses/300 samples; complete functional suite results listed separately; Mother low-tier saturation carried |
| Senior Technical Director — World Systems | Issues — validation gate still open | QA-05 deadline agreement and owned-process cleanup; frozen server identity checks; terrain recovery remains open |
| Senior Gameplay Engineer — Combat | Pass — functional scope only | Planted rescued-lion gait and finite VFX retained; no subjective sound/haptic/default-difficulty certification |
| Senior Gameplay Engineer — Mission | Issues — NOSTOS text open | Explicit story flags for predicates; A3 alternate room; NOSTOS terminal20 lacks meaningful text |
| Senior Gameplay Engineer — NPC | Pass — staged NPC checks | Ratchet repair/rescue state and Servo stand-off/grounding; no duplicate NPC art generation |
| Lead UI Engineer | Issues — layout items carried | Reveal/advance separation, localization, booth suppression; suit-pill overlap/dialogue-leg occlusion not newly resolved |

Detailed role findings: [DESIGN_REVIEW.md](DESIGN_REVIEW.md), [ART_REVIEW.md](ART_REVIEW.md), [ENGINEERING_REVIEW.md](ENGINEERING_REVIEW.md).

## New findings and implemented changes

### CIN-4 — P2 — NULLFANG break panels could not open in their alternate room — FIXED

`break` declares A2 plus `alsoRoom:'A3'`. The old selector skipped every alternate room except Chapter Two, so the break sequence never became due in A3 even after its event and while safe. The source reproduction returned null in A3 and break in A2 with the same save.

`js/panels.js` now evaluates ordinary sequence predicates in either declared room, preserving the special B1 teaser fallback and seen/past/stale rules. `tests/panels.cjs` exercises actual staged A3 playback and prevents playback before the event or after CHIME/NULLFANG resolution. Owner: Cinematic Designer/Mission Engineer. Broader CIN-2 timing risk remains distinct.

### CIN-5 — P2 — Sage replay claimed CHIME still rang after it was silenced — FIXED

The Sage bell panel read `flags` from the panel-history record, which has no story flags. A post-CHIME replay therefore still included the obsolete bell panel. Conditional panels now receive `(panelState, flags)` explicitly. The existing corridor hit/miss predicate retains its recorded state. Regression checks the bell before and after CHIME. Owner: Cinematic Designer/Mission Engineer.

### QA-05 — P1 — Full pipeline cut the campaign short at six minutes — FIXED

The collector's generic 360-second outer budget contradicted the runner's 3,600-second campaign budget and 420-second guardian-pose budget. A valid 15-minute campaign could never complete through the prescribed pipeline. The collector now derives registered budgets and adds 180 seconds for server/identity overhead, without changing harness deadlines. It kills its owned POSIX process group on outer timeout so a child harness cannot keep writing evidence after cancellation.

Four isolated tests pass, including real registered budgets, unreadable metadata, failure-code preservation and a real descendant heartbeat that stops on timeout. `collector-regressions.log` and `engineering/collector-regression.log` preserve evidence. Windows descendant cleanup is not established; this run uses Linux. Owner: World Systems/Producer.

### QA-07 — P2 — Post-lion cache fixture replayed the introductory meeting — FIXED; ORIGINAL FAIL PRESERVED

The full suite recorded one failed first A2→A3 crossing in `roomcache`. A diagnostic rerun reproduced the same failure: its staged save marked the lion defeated but omitted `nfMeet`. At frame 10, the meeting panels correctly cleared held RIGHT; the harness dismissed the panel without restoring input. This is a contradictory fixture, not evidence of a broken room seam.

`tests/roomcache.cjs` now includes that one prerequisite milestone, preserves every original budget/assertion, captures failed-crossing state and asserts that no story panel intercepts measured crossings. One corrected rerun passes in 37.3 seconds, first crossing 31 ms and zero live bakes. Original full-suite failure, diagnostic failure and corrected pass are separate in `roomcache-investigation/`. No runtime source or served build changed. Owner: World Systems/Producer.

### CIN-2 — P2 — Cave introduction appears after marble extraction — FRESH REPRODUCTION, OPEN

Today's uninterrupted keyboard campaign collected the raw marble at 04:26 and showed its panels at 04:32–04:33. The cave-entry panels did not appear until 04:58–05:00, on the return through CV1. The earlier theoretical timing risk is now observed as a specific chronology defect: the player receives the cave introduction after the cave's main objective. `campaign/campaign.log` preserves the event order. A final panel count cannot certify narrative timing.

Owner: Cinematic Designer/Mission Engineer. Deliver an essential first-entry scene at a safe narrative boundary before extraction, or explicitly classify late content as replay rather than presenting it as the current beat. Preserve combat safety, input clearing and earned-state checks. Add an input-driven timing assertion, not merely a “seen” count. CIN-4's alternate-room correction does not resolve this.

### QA-08 — P1 validation gate — Opening traversal does not finish — OPEN

`automated/opening-order.log` failed after 483.4 seconds: the desktop attempt reached `atk` and remained in A0B; the phone-sized attempt reached `pack` and remained in A0B. Neither reached the monument or Servo. Both reported no JavaScript page errors. Treat later failed Servo assertions as unvisited coverage, not proof of sixteen separate NPC defects.

The harness has a 240-second internal budget per viewport and no final-state timing trace. It injects `startGame(newSave(1))`, drives both viewports with keyboard events (repair uses pointer clicks), and stages a Servo coil for the reward check. It therefore does not certify actual touch controls or uninterrupted title-to-end play. The observed stop is consistent with hitting that budget, but a larger budget is not a demonstrated fix. Short input pulses, wall-time versus simulation-time debounce and lack of stuck-jump recovery are source-confirmed harness fragilities; none is established as this failure's cause.

Owner: Player Systems/Lead UI/Producer. Acceptance: preserve this failure, add final-state and elapsed-stage diagnostics, reproduce the actual stall/slow section against a pinned build, correct its demonstrated cause without weakening progression assertions, and run both viewport cases again. A separate campaign pass cannot erase this failed opening gate. No opening gameplay change or deadline extension was made.

### QA-09 — P2 — Campaign process success does not certify story delivery — OPEN

The fresh campaign exits 0 with `result: complete` and `panelsMissed:[]`, but its `panelsSeen` contains only 12 of the13 configured sequences: `passage` is absent. The result also does not reject cave-entry panels arriving after marble recovery. `tests/campaign-ch1.cjs:1212–1222` checks completion/teaser for process status, while individual errors and observed/missed arrays require separate interpretation.

This review fails the narrative gate explicitly in `campaign/review.json`; it does not rewrite the raw harness pass. Owner: Mission Engineer/Producer. Add validation of the expected essential sequence set, page errors and causal beat ordering to campaign acceptance, preserving chronological logs and difficulty/input disclosure. Do not mark scenes seen or remove sequence requirements to obtain a green result. Runtime timing also needs CIN-2 correction. No campaign-harness source change was made in this frozen run.

### ART-3 — P1 — Repair panel visibly changes protagonist identity — CANDIDATE PREPARED, RUNTIME OPEN

Fresh source and 1280×720/844×390 staged captures show `assets/manhua/ch1/game/repair.webp` with a plain cream face, black dot eyes, nose/mouth and absent scarf. The canonical hero has a dark visor, cyan eyes, tall ears, mechanical whiskers and red scarf. Asset loading and scene coverage had passed, but identity did not.

The generated candidate at `assets/source/manhua/ch1/candidates/2026-10-11/repair-identity.png` restores those defining features, retains the workshop/battery/Ratchet composition, and has no unearned sword. Its exact prompt, inputs and tool are in `provenance.json`. The art specialist independently inspected it. Candidate previews temporarily substitute a resized derivative in the browser; **the full gameplay suite still uses the original panel**.

The master is 1677×938; runtime crop expects 1344×752. Integration must normalize the image or deliberately update crop geometry, derive the runtime WebP/tier, preserve provenance, and validate actual panel/package delivery. Do not swap a larger file under unchanged crop coordinates. Owner: Character Artist/Cinematic Director.

### ART-4 — P2 — Maintenance passage hero has thin segmented limbs — OPEN

`passage_b.webp` depicts elongated legs, elbow hardware and finger-like hands, differing from the compact one-piece limbs and mitten paws in the canon. Fresh phone-size capture makes this visible. Preserve its earned sword, tunnel and terminal; correct only the protagonist after validating against adjacent passage art. No duplicate whole-panel-set generation is warranted.

### DOC-ART-1 / DOC-CIN-1 — P3 — Production instructions contradicted current implementation — FIXED

Updated the obsolete ART_QUEUE paragraph that still asked to regenerate Alpha after its completed ten-strip integration. Preserved approval/quality caveats. Corrected MANHWA_EVENT_MAP from600 px horizontal exclusion to the actual300 px Euclidean threat radius. Its generator preserves this introductory prose; regenerating the map introduced no unintended table change.

## Previous findings reconciled and remaining priorities

| Item | Today's status | Next acceptance evidence |
|---|---|---|
| Old Alpha/pack mismatch | Completed redesign already integrated; do not recreate | Inspect full motion in human play; preserve all current states |
| Eight missing Chapter One scene groups | Assets/wiring now present | Character identity and trigger timing still require review |
| Baked English gameplay panels | Clean pages and localized reveal implemented | Preserve localized overlay and separate reveal/advance input |
| A7 visit-only reward | Fixed by actual terminal read | Fresh survey migration/early-read tests |
| Eye-roster timeout cause | MEDIA_PEND fix already integrated | Today's roster runtime, not yesterday's timeout diagnosis |
| Mother optics/two-eye cap | Eight mapped lenses implemented | Pose/cleanup tests, measured low-tier readability |
| Wrong test server | Shared identity implementation already integrated | Pinned start/end hashes and refusal on mismatch |
| No continuous campaign evidence | Historical integration supplies one; today reruns it | Fresh result and limits in VALIDATION.md |
| TER-1 — P2 | Quarry broken floor remains under A2 bell climb | Normal-input missed-jump recovery without blocking deliberate descent |
| CIN-2 — P2 | Fresh cave introduction follows marble extraction | First-entry chronology plus brisk-route delivery or clear replay, without unsafe interruption/out-of-order scenes |
| BOSS-1 — P3 | Fresh campaign confirms Sage does not fully reset (417 first sample, 367 last pre-death sample, 233 on return); other-fight comparison remains historical | Decide explicit checkpoint/assist policy before changes |
| UI-3/UI-4 — P3 | Prior suit-pill overlap/dialogue-leg occlusion carried | Comparable fresh layout captures before modifying UI |
| HERO-1 — P3 | NOSTOS terminal20 text is robot-only, raw key fallback | Hero-appropriate localized arrays and quest-read behavior in both builds |
| ART-2 — P3 | Freed Alpha faint violet collar is a painted-tint issue | Fix only if neutral armour stays intact across purified sheets |
| VFX-2 — P3 | Fresh infection-eyes reaches 90 of 90 wisps for Mother on the low tier | Physical-device readability/performance, retain global caps |
| Chapter Two | Original teaser exists; full next chapter remains later scope | Do not request missing teaser art again |

The prior CV1/CV2/CV3 map-connectivity accusation was withdrawn and remains withdrawn. There is no new evidence supporting a topology change.

## Chapter One route and cave census

The implemented intended route remains wake → movement/jump → Ratchet letter/drawer battery/repair → pod → purchased Volt Pack → monument/forward route → Servo opportunity → quarry marble → Ratchet forge → first Sage → CHIME → NULLFANG → camp climb/teaser. Alpha remains optional. The Meadow Sage, guardian NULLFANG and construct CHIME are distinct; do not conflate their treatment or gates.

| Location | Distinct purpose/payoff | Evidence limit |
|---|---|---|
| A5 | Puzzle, Magnet crest, quarry entrance | Source plus cave harness; subjective pacing not certified |
| A7 | Quarry survey; read-based Ratchet errand | Early-read and old-save semantics tested separately |
| CV1 | Spare core | Route reward, not merely a transit door |
| CV1B | Rest, survey chart, shortcut | Checkpoint/map consequence |
| CV2 | Deaf System beacon lore | Narrative discovery |
| CV3 | Raw marble; later maintenance entrance | Required before forge/den |
| GA1T | Sage history and junction | Story linkage |
| GA1 | Rest and later lion connection | Return-route utility |
| GA1D | Sage rescue, CHIME revelation, friendly network | Main progression consequence |
| A11 | Coin | Small optional reward |
| A12 | Dash-gated Star Fragment | Ability-gated return |
| A13 | Servo watch log and coin | NPC-specific discovery |
| Alpha route | Pack rescue/friendship and rewards | Optional branch, not the required sword-marble source |

This census does not claim the reviewer physically walked every optional branch in one run. Staged cave tests validate content/reward presence; campaign traversal demonstrates the mandatory route if complete. `docs/CHAPTER_ONE_CAMPAIGN.md` remains the prior detailed 27-step walkthrough; today's observed route and exact milestones are in [campaign/PLAYTHROUGH.md](campaign/PLAYTHROUGH.md).

## Animation, manhwa and VFX matrices

| Area | Fresh observation / implementation | What this does not prove |
|---|---|---|
| Alpha | Existing complete ten-strip identity retained; diagnostic coil/claw/bite/air silhouettes differ | Still images do not establish smoothness or enjoyable wolf combat |
| Rescued lion | Distance-clocked petWalk/stalk path retained; functional harness | Human judgment of gait/contact and sound |
| Alpha/lion/Mother optics | Fresh subset 50 poses, 300 facing/time samples; maximum opaque-body distance 1 px, wisp birth distance 0 px | Being on an opaque pixel alone cannot prove an eye; sheet visually inspected too |
| All infected bodies | Full roster/pose/lifecycle results in VALIDATION.md | Physical-phone performance or subjective light quality |
| Eye smoke |1.125–1.875 seconds lifespan; caps 90/170/260/320; idle/cure/despawn/teleport/room cleanup | Mother low-tier competition remains a quality item |
| Manhwa events |13 sequences;17 supplementary panels and clean pages | Asset existence is not identity parity; repair/passage findings remain |
| Text | Progressive captions and separate reveal/advance retained | Human reading pace across every language |
| Repair candidate | Independent full-scene and phone-size preview inspection | Not integrated, deployed or owner-approved |

## Manhwa event parity ledger

This source-derived ledger maps current sequences to their actual art; it is not a claim that each illustration exactly reproduces every canonical detail. Source inspection and staged panel checks support coverage. Fresh campaign delivery is assessed separately in VALIDATION.md. Clean page IDs refer to existing manhwa crops; named game assets are supplementary illustrations with recorded provenance.

| Sequence | Existing sources | Current review status |
|---|---|---|
| bay — The service bay | p04, p05 | No new parity defect confirmed in this review |
| gate — The city gate | p05 | No new parity defect confirmed in this review |
| ratchet — Ratchet's battery | p09, drawer, letter, repair | ART-3 wrong hero identity; previewed correction only |
| cave — The marble cave | p15, p16 | Fresh CIN-2: introduction shown after marble recovery |
| marble — The raw marble | marble_a, marble_b | No new parity defect confirmed in this review |
| forge — The forging | p18 | No new parity defect confirmed in this review |
| passage — The maintenance door | passage_a, passage_b | ART-4 limbs open; sequence missing in fresh campaign |
| meet — The corridor | p14 | No new parity defect confirmed in this review |
| break — NULLFANG resists | break_a, break_b | CIN-4 A3 selection fixed; broader timing still open |
| sage — The Meadow Sage | p25, p26, sage_bell, sage_rev | CIN-5 post-CHIME bell replay fixed |
| chime — CHIME | p20 | No new parity defect confirmed in this review |
| free — NULLFANG, free | p24, fight_a, fight_b | No new parity defect confirmed in this review |
| ch2 — Next: the Data Conduits | ch2_a, ch2_b, ch2_c, hatch | Existing teaser only; no claim of full Chapter Two |

## Evidence and delivery

- [VALIDATION.md](VALIDATION.md): exact commands, results, failures/retries and campaign scope.
- [campaign/PLAYTHROUGH.md](campaign/PLAYTHROUGH.md), [campaign/result.json](campaign/result.json), [campaign/review.json](campaign/review.json): fresh critical-route walkthrough and the distinction between a campaign process pass and failed narrative delivery.
- [automated/results.json](automated/results.json), individual logs and served snapshot: full requested harness coverage.
- [art-poses.log](art-poses.log), [art-panels.log](art-panels.log), [art-candidate.log](art-candidate.log): separately staged visual checks.
- [images/panel-ratchet-844.png](images/panel-ratchet-844.png) and [images/panel-candidate-ratchet-844.png](images/panel-candidate-ratchet-844.png): current versus candidate preview.
- [images/panel-passage-844.png](images/panel-passage-844.png), [images/guardian-poses.jpg](images/guardian-poses.jpg): identity concern and diagnostic pose sheet. Cyan rings on the sheet are test annotations, not infection-eye colour.
- [CLAUDE_PROMPT.md](CLAUDE_PROMPT.md): single consolidated integration prompt.

Generated HTML is intentionally excluded from the review commit; Claude must rebuild all four pages from integrated source. The separate candidate master lives under excluded `assets/source`, so it is not silently added to shipped packages. The recurring review remains active; this run does not create another schedule.

No physical phone, native package, subjective audio/haptic check, human default-difficulty play or owner art approval is claimed. Tests and generated pictures cannot substitute for those judgments.
