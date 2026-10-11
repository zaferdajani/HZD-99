# Engineering studio review — 2026-10-11

Reviewed source baseline: `7b48b89d5fb2643ef58965eed36b6b8a06dddfd7`.
Five role responsibilities were grouped into one engineering reviewer. Read authority, canon, role mandates, the previous audit, and the later `INTEGRATION.md` / `NEXT_REVIEW.md`. Source review and isolated collector tests are fresh. The producer owns today's build, gameplay tests and visual evidence; this review does not independently claim those passes.

## Role verdicts

| Role | Verdict | Fresh source evidence and scope |
|---|---|---|
| Senior Technical Director — World Systems | Issues, bounded audit fix implemented | Physical story gates and unsafe-bench migration remain present (`js/progress.js:34–63`), including previously freed-save compatibility. General runner now verifies served pages/assets and pins the build (`tests/run.cjs:41–82,279–317`), closing yesterday's QA-04 implementation gap. New collector deadline defect fixed below. Terrain return-route feel requires gameplay review. |
| Senior Gameplay Engineer — Combat | Source continuity; gameplay verdict deferred | Rescued lion follows with `petWalk` / velocity (`js/entities.js:11732–11761`); gait advances from actual distance (`js/beast.js:1187–1196`) and renders stalk rather than sleeping (`js/beast.js:1259`). Eye particles have bounded caps/lifetimes, fixed-step aging and cleanup (`js/infection-eyes.js:40–57,244–318`). Sound/haptic timing is implemented, but not heard/felt by this reviewer. |
| Senior Gameplay Engineer — Mission | Previous A7 defect resolved in source; mirror-text issue remains | `ratchet_deep` is READ/terminal20 (`js/quests.js:49–59`); interaction records the read (`js/game.js:2503–2506`); early evidence, migration and progress are explicit (`js/quests.js:116–154,192–208`). Paid quests remain done; tests/survey-a7.cjs covers old paid/active saves. NOSTOS lacks the terminal text described below. |
| Senior Gameplay Engineer — NPC | Source continuity; presentation verdict deferred | Ratchet has one identity/home and moves after forge (`js/story-opening.js:47–63`); load reapplies saved Sage cure and the restored network (`js/game.js:1119–1134`). Current hero/Servo spacing already has dedicated `tests/servo-presence.cjs` and integration evidence: do not revert or regenerate his artwork. Fresh gameplay-size inspection belongs to today's producer/art evidence. |
| Lead UI Engineer | Previous bounded defects retained; layout issues require visual review | Long second-word wrap fix retained (`js/reveal.js:120–137`); booth suppression and chip clearing retained (`js/game.js:13008–13015,13262`). Progressive reveal API separates reveal from later advance (`js/reveal.js:1–31`), and the newer text-rules/Servo tests exist. Historical suit-pill overlap/dialogue-leg occlusion remain carried for visual reproduction, not newly certified bugs here. |

## QA-05 — P1: collector prematurely terminates supported long harnesses — FIXED ON REVIEW BRANCH

**Evidence type:** source-confirmed defect plus isolated regression.

Before this change, `tools/studio/audit.py` allowed only 360 seconds per harness except opening-order (960 seconds). The registered runner now grants `infection-poses` 420 seconds and `campaign-ch1` 3,600 seconds (`tests/run.cjs:212–213,247–248`). The documented completed campaign took 15:30, so the prescribed full pipeline would stop that legitimate run at six minutes. This was a collector/runner disagreement, not proof the game cannot finish.

**Change:** `suite_budgets` reads each declared runner timeout and its 300-second default, adding 180 seconds for the runner's two identity-check deadlines and server startup. Result records include `timeout_seconds`; no harness deadline or assertion is relaxed. Budgets are now campaign 3,780 seconds, infection-poses 600 seconds, infection-roster 420 seconds, opening-order 1,080 seconds and default 480 seconds. Invalid known timeout metadata or missing suite/default metadata fails closed.

The old subprocess timeout killed the runner only. A harness/browser in its process group could continue consuming resources and writing logs while subsequent checks ran. `run_owned` starts a dedicated POSIX session and kills the owned group at the outer deadline. It does not terminate a pre-existing shared test server. Non-POSIX fallback kills the command only; descendant cleanup validation is POSIX-specific.

**Files:** `tools/studio/audit.py:10–63,72,89–94,142`; `tools/studio/test_audit.py`.

**Fresh verification:** `python -m unittest discover -s tools/studio -p 'test_audit.py' -v`: 4/4 PASS. Tests assert real registered deadlines, reject unsupported timeout metadata, preserve success/failure exit status, and start a real child heartbeat process whose output stops after timeout. Log: `engineering/collector-regression.log`. Python compilation and `git diff --check` passed. No browser or server was launched by these isolated regressions.

**Acceptance:** Today's full collector must retain the declared long-harness budgets in evidence. A runtime failure or timeout is still failure, not a retry/pass. Success of the isolated tests does not imply campaign completion.

## Previous findings reconciled

| ID | Current assessment |
|---|---|
| QA-01 unknown/missing harness acceptance | Fix retained at `tests/run.cjs:267–276`; no silent skip. |
| QA-04 wrong served build | Closed in current source: shared served-identity implementation and pinned snapshot before/after harnesses. The old report's general-runner gap is obsolete. |
| UI-01/UI-02 wrap/booth | Both fixes retained; fresh runtime results are in producer's automated evidence. |
| QA-02 cave transit rewards | Strengthened cave check remains; no map-layout change is warranted from the withdrawn prior hypothesis. |
| MIS-01 A7 visit checkbox | Fixed in current source and backed by a dedicated regression. Do not recreate the obsolete reach-based issue. |
| VFX-T roster timeout | The integration record explains the measured cause: MEDIA_PEND entries never cleared, plus broad background prefetch during measurement. Current roster test waits for requested art with explicit traces (`tests/infection-roster.cjs:36–84`). Fresh runtime result must determine current status. Do not repeat yesterday's unresolved diagnosis as fact. |
| VFX-01 Mother's two-eye cap | Current code supports per-body maximum 8 (`js/infection-eyes.js:46–57,123–131`), and Mother explicitly marks actual plate lenses (`js/mother.js:114–116,173,742`). The core is described separately. Global caps remain unchanged. Pixel quality belongs to visual review. |
| QA-03 no continuous campaign | Historical gap was closed by integration's documented 15:30 keyboard-only easiest-difficulty run with 13 sequences. Fresh rerun required for today's independent verdict. `campaign-ch1` also permits SEGMENT/STOP development modes, which must not be used or claimed as a fresh full run. |

## Remaining source-confirmed and carried issues

### HERO-1 — P3: NOSTOS A7 terminal content missing — OPEN

`js/text-progress.js:3–4` makes the entire text layer robot-only; terminal20 is defined there (`:26`, plus four translations). `js/i18n.js:2060–2065` deliberately skips that layer for the hero theme and `:2090–2091` falls back to the raw key. The terminal interaction assumes an array (`js/game.js:2503–2504`), so a missing key is not meaningful reading material. The prior integration report observes raw `t20` in NOSTOS. This is not a CLAWBYTE robot-theme blocker.

Smallest fix in a future gameplay revision: supply theme-appropriate terminal20/quest prose through the hero theme or a shared compatible layer, keep the robot lore unchanged, then validate meaningful dialogue arrays and A7 read/early-read behavior in both themes and all five languages. Do not simply enable all robot story text for NOSTOS.

### BOSS-1 / TER-1 / UI-3 / UI-4 — carried observations, no new reproduction in this subreview

The integration report carries inconsistent retained fight damage after death (Sage versus CHIME/NULLFANG), punishing missed-jump return at the A2 quarry/bell climb, suit badge overlapping the Neural Tree pill, and dialogue covering speakers' legs. These require today's gameplay/visual review before changing behavior. Damage persistence is a design decision; do not silently reset earned progress solely to make encounters identical.

### QA-06 — P3: `noBrowser` metadata means “no local game server,” not literally no browser

`tests/run.cjs:113–115` labels hero-delivery, hero-frame-alpha and hero-alpha `noBrowser:true`, but all three launch Playwright. They work on local source/data images/about:blank and do not load the served game, so skipping served identity for them is not a cross-checkout certification defect. They nevertheless require a valid CHROMIUM_PATH. Keep it supplied to the entire suite. Consider renaming metadata to `noServer` with a mechanical validated change later; do not treat these three as browser-free checks.

## Limits

No runtime game source changed in this engineering patch. No fresh browser run, continuous playthrough, default-difficulty enjoyment review, phone-hardware test, sound listening, or haptic inspection was conducted by this specialist. The producer's final report must cite actual current results and keep historical integration evidence separate.

## QA-07 — P2: roomcache's post-guardian fixture replays the introductory lion panels — FIXED

During today's full run the producer observed first A2→A3 failing to arrive while the repeat passed. At the producer's request, this specialist added diagnostics and reproduced the same failure against the frozen pages in a separate server execution environment. `roomcache-investigation/diagnostic-original.log` proves frame10 entered `PANELS/meet`, cleared RIGHT and stopped the player at x2777; the harness then forced PLAY without restoring input and remained there through frame119.

The fixture already marks bossGlitch and other guardians complete but omitted `nfMeet`. Set only that earlier milestone before `startGame`, letting normal panel migration recognize it. Do not mark every panel seen. All original assertions and timing budgets remain; a new assertion rejects story-panel interception during measured crossings, and failed arrivals now print state/position/input diagnostics.

Fresh corrected rerun: **PASS, exit0,37.3seconds**, first A2→A3 cost31ms, zero crossing-frame bakes, no page errors, all original cache/pixel/save/sheet-budget checks passing. Logs and method: `roomcache-investigation/README.md`, `diagnostic-original.log`, `fixed.log`. Original `automated/roomcache.log` remains unchanged and failed; final reporting must show failure → diagnosed fixture correction → separate pass. `node --check tests/roomcache.cjs` and `git diff --check` passed. No gameplay/build files changed.

This follow-up supersedes only the earlier limit stating this specialist ran no browser: one diagnostic and one corrected **staged cache harness** were run. Neither is campaign or human-play evidence.

## Producer final validation addendum

The final producer-owned full suite ran all 166 harnesses: 164 original passes and two failures (roomcache, opening-order). Roomcache was diagnosed/corrected and separately passed; opening-order remains unresolved. Build/package/start-end identity passed. The fresh Kitten keyboard campaign completed 13:36 with one death and zero page errors, but only 12/13 sequences appeared: passage is missing and the cave introduction came after marble recovery. See REPORT.md, VALIDATION.md and campaign/review.json; no physical-device, audio/haptic or human-feel certification is added by this result.
