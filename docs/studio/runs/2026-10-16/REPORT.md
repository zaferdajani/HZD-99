# CLAWBYTE senior studio review — 2026-10-16

## Verdict

**Chapter One is not certified. No production merge or deployment was performed.** Main and integration are unchanged from the previous review. Today's useful delta is a bounded correction to evidence tooling: missing/contradictory move manifests, audio errors, served-build mismatch and failed encoding must not masquerade as a successful reel.

The 15 responsibilities were instantiated through three read-only reviewer groups: design/production (7), art (3), engineering (5). The primary implemented and tested the bounded fixes. Existing completed assets were preserved; no raster was regenerated.

## Versions and evidence boundaries

| Item | Pin / status |
|---|---|
| Main | `14bef4baba6b12d78b7ba2e41c221e8b95b9f938` |
| Integration `claude/clawbyte-repo-migration-byhyl8` | `911893775559e189418705a5d841bf29d4fe992e` |
| Previous report / branch | [2026-10-15](../2026-10-15/REPORT.md), `99ca5e50f31b112f252f441c429d2d7a42d31bd2` |
| New review branch | `codex/studio-review-2026-10-16`, based on the previous review |
| Local tested source commit | `b7a01415511b568796dba3dc66d1b707fa2b625c` |
| Build | `07f3967fe8dc`; four rebuilt HTML files tested locally, not included as new generated-page changes |
| Live production | Not tested or changed |

Integration remains two reel-tool commits ahead of main; neither branch contains the carried review gameplay fixes. This branch retains that tool work and the prior review fixes as file content; Claude must reconcile against the newest integration head, not assume integration ancestry or overwrite newer work. The published review commit may differ from the local tested commit because publication packages source and report together. The audit records the actual local test pin.

Fresh evidence: source/diff inspection, independent certificate reproduction, build/package/integrity checks, complete collector attempt, static tests, original-image inspection by art reviewer, and primary re-inspection of archived 844×390 panel-layout crops. **No fresh browser-rendered gameplay, real-input traversal, film, physical touch/controller test, audio listening or haptic test occurred.** The archived crops are source-layout evidence, not new gameplay screenshots.

### Corrections to yesterday's report

- A7 survey is **Ratchet's `ratchet_deep` errand**, not Servo's. `js/quests.js:49–58`: read terminal 20 after the forge; reward 80 scrap plus coin relic. Servo's coil errand is separate (`:37–40`, 60 scrap and 10 IQ). No gameplay rewrite is needed for this report correction.
- Yesterday's claim that reel certification was fail-closed was too broad. An absent manifest and contradictory empty `missing` array could still succeed; encoding could fail after success was written. Today's tests cover these holes.
- The rejected October 14 image candidate remains in inherited archival evidence; it is **not wired into production**. Do not integrate it merely because the file exists on the branch.

## Fifteen senior-role verdicts

| Responsibility | Verdict | Evidence and remaining gate |
|---|---|---|
| Senior Cinematic Designer | Issues | Alternate-room panel fix remains review-only; shot timing needs real traversal. |
| Senior Game Designer — Player Systems | Issues | Device-aware guidance carried; clarity and save/recharge tutorial not freshly played. |
| Senior Mission Designer — Quest Craft | Source pass; traversal blocked | Quest motives/rewards exist; corrected A7 ownership above. |
| Principal Encounter Designer | Issues | Pre-meeting hatch gate carried; ordinary route/fairness unverified. |
| Senior Boss Designer | Issues | New certificate fixes tested, but staged state observations cannot certify fair combat or grounded gait. |
| Senior Mission Designer — Campaign | Issues | Ordered 16-beat certificate carried; uninterrupted campaign absent. |
| Senior Mission Producer | Issues | Scope deduplicated, review-only publishing; browser release gate blocked. |
| Senior Character Artist | Issues | Three localized panel defects and GRAVEHORN/FURNACE asset queues remain. |
| Senior Cinematic Director | Issues | Existing panels retained; four GRAVEHORN beats queued; manhwa pacing not played. |
| Senior VFX Artist | Source pass; visual blocked | Finite red/purple trail lifecycle remains; no fresh moving/expiry/anchor capture. |
| Senior Technical Director — World Systems | Issues | Served identity strengthened; terrain/shaft steering preserved, traversal blocked. |
| Senior Gameplay Engineer — Combat | Issues | Protected grapple fixes carried; balance/contact/audio/haptics not played. |
| Senior Gameplay Engineer — Mission | Issues | Hatch, alsoRoom and campaign certification fixes remain unintegrated. |
| Senior Gameplay Engineer — NPC | Source pass; motion blocked | Rescue/follow logic retained; one `petWalk` observation is not proof against sliding. |
| Lead UI Engineer | Issues | Progressive reveal retained; device-specific copy carried; physical-device evidence missing. |

## Findings and acceptance

| ID / priority | Status, evidence and consequence | Owner / acceptance |
|---|---|---|
| REEL-01 / P2 | Reopened from yesterday, bounded fix here. Exact previous `assessFilm` returned success for null coverage, `{}`, and expected roar + no observations + `missing:[]`. `tools/castreel.cjs` now validates required manifests and recomputes missing states; NULLFANG requires coverage. | Engineering: required missing/empty/malformed and contradictory manifests fail; generic capture explicitly says no move certification. Regression tests pass. |
| REEL-02 / P2 | Extended fix here. Identity respected `SERVED_BASE` but capture navigated hardcoded localhost. Capture now uses the verified base, blocks service workers and verifies again afterward. | World engineering: run against alternate base and changed served bytes in browser; failure must prevent certification. Source/contract evidence only today. |
| REEL-03 / P2 | Fixed here. Audio render/fetch/decode exceptions were swallowed. They now enter runtime errors; HTTP failures throw. | Audio/engineering: inject each failure in browser and require incomplete certificate. Not listened or browser-injected today. Missing boot-decoded takes after timeout remain a separate open gap. |
| REEL-04 / P2 | Fixed here. Certificate used to say complete before ffmpeg finished. It now persists pending/incomplete first, records failed encode, and finalizes only after nonempty artifact with SHA-256. | Engineering: injected throw, empty output, pending state and successful output/hash tests pass. Successful encoding cannot erase failed coverage. Actual playable video is not proven by fixture tests. |
| STORY-1 / P1 | Carried, unintegrated. Pre-meeting A2 quarry hatch could open upstream. | Mission: gate only intended hatch until `nfMeet`; unrelated tiles unchanged; ordinary traversal required. |
| QA-09 / P1 | Carried, browser blocked. Upstream campaign can certify partial/error-bearing route. | Mission/QA: all 16 beats ordered, no missing scenes/page errors/segment/stop; clean-save uninterrupted real-input run. |
| COMBAT-4/5 / P1 | Carried, static pass. Upstream grapple can target protected actors and add secondary effects after rejected damage. | Combat: protected-target matrix rejected at selection and reel; no knock/charge/FX/freeze/rumble on zero damage. |
| CIN-4 / P2 | Carried, browser blocked. Ordinary `alsoRoom` panels skipped upstream. | Cinematic: A2/A3 panel triggers work without weakening B1 teaser constraints. |
| UX-05 / P2 | Carried, static pass. Grapple guidance upstream hardcodes keyboard U. | UI: correct keyboard, touch, mapped and unbound controller copy. |
| ART-5 / P2 | Open. `m_down.webp` shows red boss eyes; bosses require purple. Direct source-image inspection. | Character/VFX: localized eye-only correction, preserve composition/identity, inspect actual panel and gameplay size. |
| ART-6 / P2 | Open. `r_cell.webp` inactive Servo has bright eyes/chest despite off-state text. | Character/cinematic: darken inactive indicators only; preserve lamp, battery, framing. |
| ART-4 / P3 | Open. `passage_b.webp` rear limbs/hands remain off-model. | Character: localized anatomy correction, preserve tunnel/sword timing. |
| ART-7 / P3 | Verify only. `r_marble.webp` depicts raw stone and future-sword diagram, not a demonstrated continuity error. | Cinematic: test comprehension at displayed size; no regeneration without demonstrated confusion. |
| GH-ART / P1 art gate | Open. Procedural `GH_DRAW` remains; 14 authored plates and four manhwa beats queued. | Art: produce once, integrate all states, anchors and both facings; compare against hero at gameplay scale. |
| FURNACE-ART / P2 | Open. Six authored poses queued; corrected brief already says no baked red emission. | Art/VFX: preserve runtime purple eyes/trails and existing assets. |
| TER-1 / P2 | Unverified, not reproduced. Prior missed jump predates newest shaft steering. | World: ordinary-input reproduction before changing geometry. |

## Today's bounded patch: before → after

Only `tools/castreel.cjs`, `tools/nullfangreel.cjs`, `tests/reel-contract.cjs` changed today, plus this run's evidence.

1. Optional/untrusted coverage → required validated NULLFANG manifest, recomputed missing states, explicit generic capture scope.
2. Silent audio exceptions → certificate errors including HTTP status failures.
3. Verified one URL but filmed another → shared served base, service-worker block, end identity check.
4. Pre-encode success → pending/failed/complete encoding lifecycle and artifact bytes/SHA-256 after encode.
5. Swipe counter counted any phase → phase-two condition explicitly required.
6. Added injected encoder and manifest regressions without weakening existing assertions.

**Scope limitation:** the certificate hashes the staged arena artifact, not the later appended purification movie. Meeting observation means it began, not completed; `purified-follow` means a walk flag was seen, not planted feet. State coverage does not prove all three hops, landing impacts, phase transition quality, natural move selection or full audio availability. Generic cast boss states still contain stale `function` and omit some Furnace/GRAVEHORN coverage. These remain follow-up work, not certified features.

Carried fixes preserve hatch ordering, alternate panels, campaign completion strictness, protected grapple targets, device-aware prompts, collector deadlines/descendant cleanup and art-queue corrections. No new gameplay or art rewrite was made today.

## Chapter One and cave census — source review, not a played walkthrough

Owner canon remains: Mother's hacked harmony song corrupts robots; sleeping hero avoids it, an electrical short reboots the hero; letter and battery puzzle restore the NPC; protective marble slowed infection and the NPC removed its own battery; raw marble is found in the cave and forged into the white cleansing sword; guardians are purified, not killed. Alpha is optional, motivated and has a visible pack/reward consequence.

Acceptance for the first tutorial remains forward-leading: identify floor pickup, explain battery purpose/acquisition, place teaching monument after booth entrance in the same forward screen, explicitly direct save/recharge at pod, give the next NPC readable artwork and a useful role, reveal text progressively with deliberate advance. Do not call these player-understood solely because strings/flags exist.

| Space / quest | Meaningful outcome and constraint | Evidence today |
|---|---|---|
| A2/A3 quarry | Guardian warning then opened maintenance/marble route, not premature hatch | Carried gate/panel patch; no fresh traversal |
| Marble cave | Collect raw cleansing material, return to forge, not a pre-forged sword | Source/static contracts; no collected-in-play proof |
| A7 shaft survey | Ratchet `ratchet_deep`: read terminal 20; 80 scrap + coin relic | `js/quests.js:49–58`; early-read/load traversal not rerun |
| Servo coil task | Separate useful NPC errand; 60 scrap + 10 IQ | `js/quests.js:37–40`; not A7 survey ownership |
| Alpha den | Optional post-forge hunt/purification with pack consequence/reward | Quest gate at `js/quests.js:23`; completed art preserved |
| Lion den A4 | Blade/crystal + Sage + CHIME required; Alpha is not a mandatory gate | `js/progress.js:34–39`; no bypass/save-load play today |

An exit ID, empty chamber or repeated pickup alone does not establish meaningful cave content. No fresh physical cave traversal is claimed.

## Manhwa / art / animation / VFX

| Scope | Current evidence | Required next evidence |
|---|---|---|
| Wake → bay → gate → letter → drawer → Ratchet → meet | Assets/source present; strict ordered campaign check carried | Relevant panels at actual trigger, gradual text, skip/advance continuity |
| Cave → marble → forge → passage | Existing images preserved; marble diagram not proven wrong | Earned equipment, readable discovery and return route |
| Sage → break → CHIME → free → Chapter 2 | Source beats retained | Continuous input run, purification and relevant spoiler-safe teaser |
| GRAVEHORN story | Four beats queued | Authored manhwa parity, no invented canon |
| Hero, wolves, Alpha, lion, crystals, swords, Ratchet | Completed authored work retained | Do not regenerate; inspect movement/poses at actual gameplay size |
| Rescued lion | Source follow/gait present | Grounded walk, no sleeping slide, stop/start and follow transitions |
| Ordinary infected | Red runtime eyes | Eye anchors through motion, not just rest roster |
| Bosses/Alpha/Sages | Purple runtime eyes | Both facings and all relevant states, no baked red conflict |
| Trail lifecycle | Caps 90/170/260/320; life 1.125–1.875 s; motion hold 0.1 s, threshold 10px/s, teleport break 90px | Film stop/expiry, cure/death/room-change cleanup, reduced motion and peak load |

VFX source: `js/infection-eyes.js:40–45,74,91,99,183,226,269–310`. Existing pose tests cover Alpha/NULLFANG/Furnace but need GRAVEHORN phases/facings/horn loss/charge/toss/kick and cleanup coverage. Runtime inspection is blocked.

Image originals inspected and unchanged from October 15:

| Asset | SHA-256 |
|---|---|
| m_down | `c65be806cf5fdc6b005d551504625dd0d38ffec4f7afcb260205f2a45930acaa` |
| r_cell | `800ab5ba11aab84cbf7a13e8a38d6c37acc924505558df945e76b490362c98c4` |
| r_marble | `82f68a235fad9e1de0b559c90c8d295a71fcfa6857fb8dbe1f67e4ae01fce410` |
| passage_b | `b9ca50c2cbeb05b9769a5d11d360bf0ae9a1792ceb8bc02b9ad15d86995944203` |

Primary also re-inspected [archived 844×390 source-layout crops](../2026-10-14/visual-source/). No new gameplay-size runtime captures were possible. No art change is represented as completed today.

## Validation and reproducibility

| Command / check | Result and scope |
|---|---|
| `npm ci` | Exit 0; 160 packages installed |
| `npx playwright install chromium` | Failed; five attempts delivered invalid zero-size ZIP metadata; no usable Chromium |
| `node --check tools/castreel.cjs` and `node --check tools/nullfangreel.cjs` | Exit 0 |
| `node tests/run.cjs reel-contract campaign-contract grapple-contract` | Exit 0; 3 contract harnesses pass |
| `python -m unittest discover -s tools/studio -p 'test_audit.py' -v` | Exit 0; 4 tests pass |
| `node build.cjs` | Exit 0; four HTML pages rebuilt locally |
| `node tools/pack-www.cjs` | Exit 0; 693 assets, total packed 249.7 MB |
| `node tests/build-integrity.cjs` | Exit 0 |
| `python tools/studio/audit.py --profile full --output docs/studio/runs/2026-10-16/automated` | Exit 1; 189 results: 30 pass, 159 fail; **not a passing full suite** |
| Static selection via audit | Exit 0; 29 results pass (26 tests + build + start/end identity), not 29 gameplay tests |
| 12 direct harness reruns | Exit 1 each at browser launch; resolves sparse collector logs, see below |
| `git diff --check` | Exit 0 |

[Full collector results/logs](automated/AUTOMATED.md), [machine results](automated/results.json), [static results/logs](final-static/AUTOMATED.md), [machine results](final-static/results.json), [direct-launch logs](direct-launch/).

Of 159 collector failures, 147 logs explicitly show missing-browser launch failures. Twelve logs were empty/header-only: lion-studio, winch-integration, release-polish, film, boss-counters, errands, minis, tinker, guard, face, foelevel, lowres. Each was separately rerun as `node tests/<name>.cjs`; all twelve explicitly failed launching the absent `/opt/pw-browsers/chromium`. Thus browser environment failure is demonstrated, but gameplay assertions have **not** passed. Sparse collector output is retained rather than rewritten. No timeout result is recast as successful gameplay.

Static collector command:

```sh
python tools/studio/audit.py --tests repair-lifecycle story-opening script-route scratch-reach hero-feedback tutorial-controller offline-release sage-specials tutorial-clarity story-progression input-focus voice-handoff desktop-protocol cave-ground seam-route shadow-ground dialogue-audio weapons gear motion-sampling combo-routing credits tails campaign-contract grapple-contract reel-contract --output docs/studio/runs/2026-10-16/final-static
```

Encoder tests use explicitly non-playable fixture bytes; they prove certificate state/hash behavior, not ffmpeg/video quality. No FPS, memory, audio-mix, haptic, physical mobile or accessibility acceptance claim is made.

## Handoff and release gate

Use [the single Claude integration prompt](CLAUDE_PROMPT.md). Integrate the cumulative review safely into a separate integration branch, rebuild all generated pages, run browser checks and an uninterrupted real-input campaign, then inspect art/motion/audio. This report authorizes neither merge nor deployment. The review is useful partial progress, not a finished or professional-quality certification.
