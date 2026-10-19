# CLAWBYTE senior studio review — 2026-10-19

## Decision, identity and comparison

**Review branch only: `codex/studio-review-2026-10-19`. Not merged or deployed.**
This is not a certification of studio-quality artwork, every cave, physical
devices or listened sound. The latest explicit review-only request supersedes
older standing production-publishing directions.

**Decision:** scoped material-hint cleanup is verified in staged EN/AR and actual
English acquisition. The flier readability candidate is **held for integration**
on FLIER-EYE-19. Collector reports **192/194 gameplay checks passing, not green**;
fresh mandatory keyboard chapter is certified complete. Chinese font/layout and
the sampled cropped portrait cutscene remain open. No production action.
Final evidence audit also exposes **QA-EVIDENCE-19**: one original log is
header-only/hash-mismatched. Its separate byte-identical-to-expected rerun passes,
but the original provenance gap remains and the strict integrity check fails.

At intake, main and `claude/clawbyte-repo-migration-byhyl8` both remained at
[`62d75d204c6f6264f25150bb419fc262ff2c18ea`](https://github.com/zaferdajani/HZD-99/commit/62d75d204c6f6264f25150bb419fc262ff2c18ea).
There are **no new main/integration commits** since the previous review. This
fresh branch inherits
[`69640ed83d72d451cfb6f0b59fafb2c029cc5802`](https://github.com/zaferdajani/HZD-99/commit/69640ed83d72d451cfb6f0b59fafb2c029cc5802)
by ancestry, not by reimplementing Oct17/18 work. Compare the
[Oct18 report](../2026-10-18/REPORT.md). Its save/prompt/eye, principal-opening
notice, script and campaign-import fixes remain outside intake main. Integrate
that ancestry once, preserving newer work; do not apply the same patch twice.

Fresh reproduction uses inherited build **`7984b6ea8f08`**. The candidate and all
final runtime checks use **`1d3a7c72250c`**. No runtime/test source or generated
page is edited during the full collector. [Identity](identity.json) records nine
frozen source/test hashes; [syntax](syntax.json) checks the same files. Four
rebuilt HTML pages are included as the reviewed snapshot; generated `www/` is
untracked. Rebuild, rather than manually merge HTML, after integration.

The restored checkout began without tracked edits. Unrelated untracked work and
harness overwrites of older dated evidence are excluded from this branch, not
removed. No tracked art/audio/video bytes were changed and no generation job
was submitted. No live asset or deployment claim is made.

## Implemented today

### NOTICE-CONTEXT-18 — completed extraction retires its instruction

**P2 UI/mission clarity; bounded fix verified.** Ordinary claws still produce
`pl_hint`, now with scope `marble-extraction`. A successful production extraction
removes the pillar and sets its ownership flag, then retires **only** that scope
before issuing acquisition/quest notices. A miss leaves useful guidance intact.
No English/Arabic string matching, blanket queue clearing, shorter TTL, changed
quest/reward, damage or charge cost. Principal `boss-opening` cleanup is separate.

Changed implementation: `js/entities.js`, rejected-claw producer and successful
`releaseCharged` pillar block. New registered
[`tests/marble-notices.cjs`](../../../../tests/marble-notices.cjs).
[Before JSON](before/marble/result.json) and [before log](before/tests.log) fail:
the actual claw producer has no scope and its instruction survives acquisition.
[After JSON](after/marble/result.json) and [after log](after/tests.log) pass in
**English and Arabic** with zero page errors. The fixture exercises production
ordinary-hit update, out-of-range charged miss, successful extraction and retry;
it does not merely hand-enqueue the scope. Earned notices, a same-worded unscoped
control and the unrelated boss-opening scope survive. The pillar/bag/flag are
correct and retry leaves the queue unchanged.

This is **staged** save/placement with animation scheduling stopped, not a chapter
playthrough. It uses the early-discovery acquisition path, not proof of active
`q_ready` pacing, every dialog/panel layout, low-volts refusal, reload or all locales.
Existing `crystal` covers extraction/no-regrowth separately. General post-lion
reward/equipment crowding is not claimed solved.

**Fresh ordinary-input English acquisition corroboration:** today's separate
campaign trace at **06:09–06:16** records the plain claw, visible extraction
instruction, held/released Burst, both marble panels and the changed return
objective. At 06:12 the toasts become only `ACQUIRED — raw cave marble` and
`Errand ready — go back`; the obsolete claw/Burst instruction is gone. The raw
[done-marble frame](automated/campaign-ch1/frames/010-done-marble.png), inspected
at 1280×720, shows both earned notices and `Bring the raw marble to Ratchet`
without the stale instruction. This closes the sampled actual English return
moment beyond the staged fixture, not all intermediate overlay frames, Arabic
route, low-volts/reload or broad post-lion reward presentation. Campaign-wide
completion is a separate verdict below.

### FLIER-SCALE-01 — readable loaded flight, honest readiness acceptance

**P2 character presentation; bounded existing-art improvement.** Both authored
flight strips use one common size calibration, `TALON_MINI.w: 2.42 → 3.75`
(about 1.55×). No per-frame normalization, new pixels, changed wingbeat/cell
timing, collider, global actor/world scale, damage, perch, tell, recovery or
roster fallback. The change is in the robo mini-flier renderer, not the hero or
NOSTOS actor scale. A drawing is not renamed a new animation.

The upgraded [`foescale`](../../../../tests/foescale.cjs) keeps the **same 0.5
floor and 1.0 ceiling**, but now waits for tier-3 cruise/chase artwork, checks
the actual renderer, and measures **80 full-cycle samples**, not a conveniently
tall pose or unloaded substitute. Its [before log](before/tests.log) fails at
0.34×, with **48/80 samples too small**. Its [after log](after/tests.log) passes,
with zero too small/big. Hero yardstick remains 71px, authored idle.

| Loaded cycle | Samples | Before height / hero | Candidate height / hero | Candidate opaque area |
|---|---:|---:|---:|---:|
| Cruise | 32 | 0.324–0.606× | 0.507–0.944× (36–67px) | 1822–1975px |
| Chase | 24 | 0.324–0.549× | 0.507–0.859× (36–61px) | 1735–2004px |
| Banked chase | 24 | 0.352–0.577× | 0.535–0.915× (38–65px) | 1735–2007px |

[Before diagnostic](before/flier/result.json), [after diagnostic](after/flier/result.json),
[script](flier-diagnostic.cjs). The same pinned authored cruise pose changes
**24/71 → 38/71px**, 0.338× → 0.535×. The natural cold read remains 56px atlas
fallback; both states are retained. Intended asset keys, dimensions, readiness,
renderer/cell and unclipped bounds are recorded. Embedded data URLs are compacted
to MIME/byte count/content and URL SHA-256 references, not duplicated as megabytes
of base64. No source asset bytes are rewritten.

The art reviewer inspected all **six fresh candidate extrema plus 18 state
frames at 844×390**. Root also inspected before/after cruise, perch, hold and
recovery. Core/talon/armor details are more legible; broad wings remain plausible
bird anatomy while the tallest silhouette stays below the hero. No obvious
size/identity blocker appears in the sampled stills. [ART.md](ART.md) contains
the independent acceptance and caveats.

The [state gallery](graphics/result.json) serves the exact parent assembled page
for six baseline states and the candidate for both facings of cruise/chase/perch/
hold/packet/rise. It does not rewind the worktree. `actorStrip` is deliberately
separate from `lastGlobalStrip` (usually the hero); tell/recovery use the existing
figure renderer rather than a strip. Both builds retain **26×22** collider.
Floating perch/frozen hero are deliberate staging, not ordinary-route defects.
These stills cannot prove temporally seamless transitions, natural AI, grounded
perching or dynamic wing-tip hitbox perception. Existing figure/strip framing and
material differences remain a separate animation-quality gate.

### QA-IMPORT-18 — retention check promoted into the suite

The inherited guard already prevents importing campaign helpers from erasing a
completed route log. Today its filesystem regression becomes registered
[`campaign-import`](../../../../tests/campaign-import.cjs), with `noBrowser:true`.
Actual isolated subprocess imports preserve a sentinel log and leave an absent
output directory absent; zero errors. [Result](campaign-import.json). No new
campaign driver/input/planning or game behavior is claimed. The separate
certificate contract remains responsible for missing/late/error/partial evidence.

## Fifteen responsibility verdicts

The main agent read authority, story canon, complete CLAUDE/ART_BIBLE, the main
pipeline/roles and producer mandate. Three grouped reviewers instantiated six
design, three art and five engineering responsibilities; root owns production.
These are agent responsibilities, not human credentials.

| Responsibility | Verdict | Evidence / remaining limit |
|---|---|---|
| Senior Cinematic Designer | Issues | [DESIGN](DESIGN.md): safe mapped beats and text reveal; four GRAVEHORN panels/action parity open. |
| Senior Game Designer — Player Systems | Issues | Scoped material-hint lifecycle fixed; broad reward density and first-time comprehension not certified. |
| Senior Mission Designer — Quest Craft | Issues | Distinct cave outcomes and optional Alpha reward; optional branch traversal remains separate. |
| Principal Encounter Designer | Issues | Causal gates retained; input/dodge outcomes must be read from final validation, not old labels. |
| Senior Boss Designer | Issues | Deliberate rescue and unique wolf identity retained; full authored ritual body motion open. |
| Senior Mission Designer — Campaign | Issues | Blade → Sage → CHIME → NULLFANG and corrected script preserved; fresh route reported below. |
| Senior Mission Producer | Issues | Deduplicated assets, preserved ancestry and branch-only scope; no release-quality claim. |
| Senior Character Artist | Issues | [ART](ART.md): loaded flier visibly improved; remaining authored-art gates not hidden. |
| Senior Cinematic Director | Issues | Existing lion ending retained; four matching movies and exact manhwa staging still open. |
| Senior VFX Artist | Issues | Fresh finite red flier sample; all-pose/device coverage not inferred. |
| Senior Technical Director — World Systems | Issues | Source/HTTP identity and pack checks below; no physical-device performance certificate. |
| Senior Gameplay Engineer — Combat | Issues | Unchanged impact/stats; full timing/scale results retain failures, not weakened assertions. |
| Senior Gameplay Engineer — Mission | Issues | Material hint bounded fix and inherited atomic rescue; old histories not rewritten. |
| Senior Gameplay Engineer — NPC | Issues | Friendly lion stalk/ground logic retained; down/recovery art and exact contacts open. |
| Lead UI Engineer | Issues | Scoped cleanup/localized regression; actual touch/pad and broad HUD presentation still separate. |

[DESIGN](DESIGN.md), [ART](ART.md), [ENGINEERING](ENGINEERING.md) are independent
reviews. Their intake/pending language is superseded only by linked fresh proof
in this consolidated report, not by assumptions about a later result.

## Owner story, meaningful caves and manhwa parity

The source-reviewed walkthrough in DESIGN retains sleep-based survival,
Mother's hacked song, Ratchet's protective pendant/self-shutdown, his own drawer
battery versus Servo's spare, pod saving/recharge, purchased pack before spending
charge, forward monument, useful grounded Servo, raw material before first blade,
Sage before CHIME before lion, deliberate living rescue and relevant B1 teaser.
The sword frees infected robots; no early ready-made sword or innate immunity.

Alpha remains a forged-blade **optional detour**: Lost Wardens backstory, marked
den, friendly world pack, cell/60 scrap and supply-cache continuation. It is absent
from `PG_LAIR_NEEDS`; never make it the lion prerequisite to simplify testing.
Source stale Alpha comments are P3 maintenance, not an instruction to change route.

| Cave/group | Distinct source payoff | Coverage requirement |
|---|---|---|
| A5 | Riddle/Magnet, quarry landmark and maintenance evidence | Hatch noticed without bot map knowledge. |
| A7 | Read survey, remembered early, Ratchet pays once | Terminal read, not mere arrival. |
| CV1 | Spare core and later bound-creature rescue | Reachable chest and visible changed body. |
| CV1B | Survey pod, map/chart, shortcut/rest | Facility consequence, not generic bench repetition. |
| CV2 | Deaf System founding evidence and lure/beacon | Lore earns the traversal time; pacing needs player review. |
| CV3 | GRAVEHORN then raw marble; changed forged return | New hint retirement; visible stump/passage onward. |
| GA1T / GA1 / GA1D | Refuge log, rest/loop, Sage/network rescue | Mandatory Sage and optional rest differ. |
| A11 / A12 / A13 | Coin; later dash/star; Servo evidence/coin | Optional/later visits, not implied by required route. |
| A10 / GA2 / GA2T / GA2D | Alpha, friendly pack, cache/ledger/Pack Sage | Complete optional input traversal and persistent consequence. |

| Manhwa beat | Retained correspondence | Limit |
|---|---|---|
| Wake/bay/gate/letter/drawer/repair | `PANEL_SEQ`, gradual captions and separate advance | Trigger success is not physical reaching/installation parity. |
| Cave/marble/forge/passage | Raw rounded material then earned single blade | Carrying/manufacture/anatomy/staging remain exact-page checks. |
| Sage/break/CHIME/lion freedom | Ordered, conditional injury, completed rescue | Cable assistance/catch/case-opening still open. |
| GRAVEHORN intro/closeup/phase2/retreat | Fight/source exists | Four queued `gh_*` panels absent; no unrelated replacements. |
| B1 teaser | Relevant next-chapter crossing | Not a completed chapter two. |

Displaying a flattened panel does not implement the scene. Preserve artist queues,
approved identities, exact equipment timing and `GAME_ART_PARITY`/comic gap ledgers.

## Motion, effects and sound boundaries

Flight retains actual authored wing variation; this presentation fix is not a new
attack kit. Existing lion/wolf motion, charged flash/metal fragments/recoil/hit-stop,
defense/cadence/HP ledger and printable combat guide remain, not recreated.
Friendly lion source selects stalk and ground placement, not sleeping-body slide;
full planted contacts and every facing require motion evidence, not a gold still.

**FLIER-EYE-19 remains an integration hold on the enlarged flight calibration.**
The fresh full `infection-roster` test reports the flier's left anchor at about
`(-17,+19)` from the unchanged collider center, beyond its downward allowance
`22 × 0.75 = 16.5px`. This is an actual failed acceptance check, not a pass
inferred from the stills. All 27 sampled kinds expose the expected eye colors;
all moving trails originate at their reported eyes with worst offset 0px.
Those successes do not close the failed body-bound test. Diagnose the exact
flight cell/transform against opaque head pixels and collision perception in
both facings; do not move a correctly attached eye merely to satisfy a collider
proxy or relax the bound without evidence. The source, test and browser settings
remain frozen during this collector. The notice cleanup is a separate patch;
do not integrate the enlarged calibration unconditionally.

Fresh manual-travel flier sample: **34 red / zero purple** wisps, then **zero owner
wisps after 2.5 simulated seconds stopped**, glow retained; zero page errors.
This samples the new flight transform, not all attack/cure/teleport/device cases.
General eye suites and historical both-facing/two-phase GRAVEHORN evidence are
separate. Small infected optics red, bosses purple; preserve red hazard paint and
amber tells. Finite world-space lifetimes/caps/reduced-motion behavior are retained.

Open authored gates remain: approved GRAVEHORN parts/poses/four panels; true
wolf/cheetah down/recovery rather than flattened crouch; Furnace's six queued
poses; hero arm-raise/hold/slash/recover; localized `m_down` boss optics,
`r_cell` inactive Servo lights and `passage_b` anatomy. No duplicate generation.

The unchanged lion ritual/outro is completed work. Four other matching new ritual
movies are absent; old `purify_*` clips are not equivalent. Runtime movie audio
is muted and score separately routed: encoded soundtrack fade is **not** proof
the player hears a resolved ending. No subjective listen/haptics certification.

| Actor/effect | Existing evidence | Unclosed acceptance |
|---|---|---|
| Lion, infected → friendly | Existing gait/rescue source and registered suites; completed ritual/outro retained | Planted contacts through full rescued gait, transitions and listened stage-music handoff. |
| Alpha and ordinary wolves | Unique stalk/coil/bite/leap/howl; roster samples nine wolf states with distinct eye positions | True down/breath/recovery artwork; optional quest's complete natural-input route. |
| Mini flier | Loaded full-cycle size and before/after cruise/chase/perch/tell/recovery stills; finite red sample | FLIER-EYE-19 body-bound failure; continuous transitions, grounded perch and contact perception. |
| GRAVEHORN | Existing encounter and purple-eye checks, not duplicated | Approved articulated body/poses and four matching story panels; no procedural stand-in quality certificate. |
| Furnace | Existing runtime/encounter checks | Six approved missing pose assets and full motion continuity. |
| Hero purification | Existing held-input/state/save/fallback checks; lion film completed | Authored body raise/hold/slash/recovery and hand/hilt continuity; four other matching films. |
| Eye smoke | Finite-system and pose suites; all 27 roster colors/origins sampled | Roster placement failure remains; no all-device/performance or all-animation anatomical certificate. |
| Impact feedback | Existing flash/fragments/recoil/shake/hit-stop and stronger charged profile checks | Subjective sound, physical vibration and comfort/performance on actual devices. |

## Build, gameplay and uninterrupted route

Full collector finished **2026-10-19 08:42:13 UTC**, exit **1**, requested scope
complete, aggregate `passed:false`. [Results](automated/results.json),
[summary](automated/AUTOMATED.md), [collector output](automated/collector.log).

| Validation | Actual outcome | Scope |
|---|---|---|
| Registered gameplay/test harnesses | Collector reports **192 pass / 2 fail / 194 run** | No missing/skipped/timeouts; most stage saves/positions. One original pass log has the retention gap below. |
| Build and pack-www | Both pass, exit 0 | Four assembled pages and web/native-shell www snapshot; not Xcode/Gradle compilation or installed physical shell. |
| HTTP build identity | Start and end pass | Same index/odyssey/sw/eyes.json/lowres Alpha bite bytes; five selected files, not exhaustive delivery. |
| Entire collector | 196 pass / 2 fail / 198 entries | Includes build, pack and two identity records; exit 1 retained. |
| Frozen-source syntax and hash inventory | Nine source/test files pass | Same runtime/test source throughout full run. |
| Final evidence integrity | **FAIL**, 195/196 log hashes match | Source/HTTP/campaign consistency checks pass; original input-focus log is truncated/hash-mismatched. |
| Gameplay-size graphics | Loaded flier cycles/states and selected opening frames inspected | Readability sampled; flight integration held and portrait issue open. |
| Mandatory keyboard chapter | Certified complete | Fresh evidence and assists/limits below. |

The only full-run failures are [textreveal](automated/textreveal.log) and
[infection-roster](automated/infection-roster.log), described below/above.
No assertion, timing budget, original result or frozen browser environment was
changed to turn the collector green. The import regression and campaign contract
both pass; the nested trace still ends in its complete 16:59 result.

**QA-EVIDENCE-19 / P2 — original input-focus log retention gap.**
[Strict integrity output](evidence-integrity.json) verifies the 194 requested
entries, all nine frozen-source hashes, both five-file identity records,
campaign artifact/embedded-record equality and **195 of 196** log hashes. It
exits 1 because [input-focus.log](automated/input-focus.log) contains only its
83-byte header, SHA256 `5a64759c7cb51acadbd220e39a20a3e19719bec46e5f93b9dcfc7dff8271c1a8`,
not the collector's recorded
`2644ee90d30e50f6f0c093c9c6ca8a22be440c3abe617426d14bf4de28a13b44`.
The mechanism and timing of lost bytes are **not established**. Original
metadata and truncated file are retained, not rewritten/rehashed into agreement.

After the completed collector, unchanged `node tests/run.cjs input-focus` exits
0; its [separate rerun log](after/input-focus-rerun.log) is byte-identical to the
recorded expected SHA256. That corroborates the production-handler property on
this source, **not original-run artifact provenance**. Do not silently substitute
the rerun for the original file or claim all evidence hashes pass.
[verify-evidence.cjs](verify-evidence.cjs) records every mismatch before retaining
the strict failing assertion ([execution](after/evidence-integrity.log)). QA must
isolate log lifecycle/output retention before closing this issue; no speculative
collector fix was made. This is separate from the two gameplay-harness failures.

**Fresh uninterrupted mandatory keyboard route: certified complete in 16:59.**
[Result](automated/campaign-ch1/result.json),
[nested retained trace](automated/campaign-ch1/campaign.log),
[harness log](automated/campaign-ch1.log) and
[frames](automated/campaign-ch1/frames/) belong to today's frozen build, not the
Oct18 recording. All nine missions complete: opening, Servo, first meeting,
marble, forge, Sage, CHIME, lion, teaser. All **16 ordered panel sequences** are
seen, with no missing/order errors: wake, bay, gate, letter, drawer, Ratchet,
meet, cave, marble, forge, passage, Sage, break, CHIME, free, ch2. The hero reaches
B1 through the earned transition; `segment:null`, `stopAt:null`, zero page errors.
The campaign-contract import does not erase its completed trace.

Disclosed assists/limits: difficulty row **0 (easiest)** chosen through the menu;
read-only internal map/state observation and physics-based input planner; **two
deaths and eight recovered driver stalls**. Inputs, not injected inventory,
quest flags, teleports, invulnerability or staged victory, advance this run.
The driver adapts its planner to observed frame timing, not the game clock.
`CAMPAIGN_VIDEO=0`: raw screenshots, actual game-written saves and logs are
retained, **no complete video**. This is not human first-time navigation, normal
difficulty, physical touch/controller, listened audio or every optional branch.
Alpha/A10/GA2, A7, A11–13 and optional GA1 rest are not certified by this route;
incidental A8 visits do not certify Servo's climb/retrieval side quest.

Actual chronology: marble 06:15 → forge 08:49 → Sage 13:05 → CHIME 15:14 → lion
16:36 → teaser 16:58. The final fight enters `PURIFY` at 16:04; the driver holds
Interact, then traverses CUT, rewards/dialogs and freedom panels. Reader/Enter
input continues during CUT/CINE, so this is **not proof of a fully unskipped
13.25s movie, ending audio or actual cinematic frame continuity**. Post-lion
trace still contains several earned route/equipment notices together; the
material cleanup does not resolve that separate density concern. Shorter time
than Oct18's 25:20/six deaths is not attributed to these small patches.

Fresh [opening-order](automated/opening-order.log) passes in **500.2s**: both
desktop and phone viewport traverse `move → out → jump → gate → booth → note →
drawer → repair → pod → pack → heal → attack → Burst → monument → meadow` in
order, then wake Servo; zero page errors and no simultaneous overlays/goal-chip
collision in those sampled states. His own battery card, separate spare for
Servo, explicit pod saving, funded permanent pack and forward monument geometry
are checked. Servo is on the floor, wakes, explains the cave and gives the coil
errand; the desktop branch **injects the coil item** before playing its paid
hand-in, so it does not prove the climb/acquisition. The opening harness also
starts via `startGame(newSave(1))`, not an input-only menu selection. Its main
tutorial route uses keyboard input; it is not the fully fresh, unsegmented
campaign certificate. This is new evidence of existing behavior, not all
features implemented today. Actual phone touch is
not exercised. [Opening frames](automated/opening-frames/manifest.json) retain
hashes for **95** raw captures (47 per mode plus portrait); **17** selected image
files are archived here, not all 95. The repair board and grounded awake Servo
were inspected at captured gameplay size; this does not certify full motion or
subjective first-time comprehension.

**PORTRAIT-CUT-19 / P2:** the fresh
[390×844 portrait capture](automated/opening-frames/phone-portrait-390x844.png)
shows a mostly dark frame with a cropped story panel/caption and skip hint;
no usable rotate guidance is visible in that sampled early CUT state. The
harness merely photographs portrait, then switches to landscape; it does not
assert that rotation guidance is visible. This concrete emulated presentation
issue remains open despite the landscape keyboard pass and separate safety
tests. Reproduce early CUT/panels/repair and rotate both ways, verify visible
guidance and no cropped active reader, then confirm actual touch devices. No
portrait layout fix or generalized all-state failure is claimed today.

`textreveal` fails its Chinese fixture's required multi-line wrapping: one line,
widest 467px, while `DLG_W=548`. This is **not demonstrated overflow or character
loss**; the multi-line expectation fails. Other recorded reader assertions
(incremental text, separate advancement/grace, Arabic RTL, long-token retention,
queued overlays and preferences) pass with no page errors. The unchanged browser
environment's [Fontconfig probe](setup/font-coverage.json) lists no zh-capable
font and falls back to Open Sans. This is a relevant host observation, not a
Chrome per-glyph trace or proven root cause. Retain the failed gate and reproduce
with actual CJK glyph/font coverage before altering code, sample or assertion.
No browser/font/runtime/test configuration was changed during the collector.
After it finished, [cjk-diagnostic.cjs](cjk-diagnostic.cjs) compared the unchanged
fixture/font on an owned server: the original browser again measures one line,
467px, JS text preserved, no page errors. A matching DOM platform-font trace
reports **URW Bookman / URWBookman-Demi, 89 glyphs**, not the CLI's Open Sans
fallback. This is a DOM trace and canvas width measurement, **not** a canvas
per-glyph trace or proof of a product wrapping bug. [Partial result](setup/cjk-diagnostic/result.json)
and [raw diagnostic frame](setup/cjk-diagnostic/original.png).

A locally available PyMuPDF built-in CJK font was prepared in a separate,
unsearched-by-the-full-run directory ([provenance/hash](setup/cjk-preparation.json));
no font binary was added to the game or committed. The separate font-complete
browser **did not launch**: EACCES executing its wrapper, observed mode 644.
The comparison exits 1, [attempt log](setup/cjk-diagnostic/attempt.log); no
privilege, alternate-launch workaround or successful rerun is claimed. The
Chinese acceptance gate remains unresolved. This optional diagnostic blocker
does not invalidate or stop publication of the completed review/evidence.
`QA-TEXT-ZH-19` in the engineering review is the same finding as consolidated
`TEXT-CJK-19`, not a second failure.

### Reproduction and patch inventory

Repository setup: `npm ci` (exit 0), with unchanged package/lock; browser setup
and extraction evidence are in [setup](setup/README.md). Set `CHROMIUM_PATH` to
the absolute path of `setup/browser-wrapper.cjs` in this run directory after
preparing its documented external browser payload. Do not copy this host's
missing CJK coverage as a release environment.

- `node tests/run.cjs marble-notices foescale`: inherited-build reproduction
  exits 1 ([before](before/tests.log)); candidate exits 0
  ([after](after/tests.log)). `MARBLE_NOTICES_OUT` selects the corresponding
  `before/marble` or `after/marble` evidence directory.
- `node build.cjs`: candidate build exits 0 ([build log](after/build.log)).
- `node docs/studio/runs/2026-10-19/flier-diagnostic.cjs`: exits 0 for each
  diagnostic capture, not an overall game acceptance. `FLIER_DIAGNOSTIC_OUT`
  selects before/after; the inherited capture was made before runtime edits.
  [Before diagnostic](before/flier.log), [after diagnostic](after/flier.log).
- `node docs/studio/runs/2026-10-19/flier-states.cjs`: exits 0
  ([capture](graphics/capture.log)); exact-parent baseline and candidate coexist
  on its owned server. This is staged, not ordinary player traversal.
- `node docs/studio/runs/2026-10-19/cjk-diagnostic.cjs`: post-collector diagnostic
  exits 1 on alternate wrapper EACCES after the original-browser sample; no
  font-complete textreveal rerun is claimed.
- `node docs/studio/runs/2026-10-19/collect-evidence.cjs`: checks the frozen nine
  source/test hashes and syntax, records browser/font environment, copies logs.
- `node tests/run.cjs input-focus`: isolated post-collector rerun exits 0;
  does not replace its original collector log.
- `node docs/studio/runs/2026-10-19/verify-evidence.cjs`: strict final integrity
  check exits 1 with the original-log mismatch retained.

Full collector command (paths here are relative to repository root; the browser
environment used its resolved absolute wrapper path):

```sh
CAMPAIGN_VIDEO=0 \
CAMPAIGN_IMPORT_OUT=docs/studio/runs/2026-10-19/campaign-import.json \
MARBLE_NOTICES_OUT=docs/studio/runs/2026-10-19/automated/marble-notices \
PURIFICATION_NOTICES_OUT=docs/studio/runs/2026-10-19/automated/purification-notices \
PURIFICATION_SAVE_OUT=docs/studio/runs/2026-10-19/automated/purification-save \
python tools/studio/audit.py --profile full --output docs/studio/runs/2026-10-19/automated
```

Intentional code/generated files: `js/entities.js`, `tests/foescale.cjs`, new
`tests/marble-notices.cjs`, new `tests/campaign-import.cjs`, `tests/run.cjs`, and
rebuilt `index.html`, `odyssey.html`, `forge.html`, `forge-odyssey.html`. Remaining
additions are this dated report/evidence/reproduction directory. Older dated
harness outputs and unrelated work are excluded. No tracked `assets/` changes.
`docs/studio/PIPELINE.md` also clarifies browser/font/permission preflight and
the portrait/touch/staged-hand-in evidence boundaries exposed by this review.

## Findings and Claude acceptance

| ID / priority | Today | Next acceptance / owner |
|---|---|---|
| NOTICE-CONTEXT-18 / P2 | Scoped extraction cleanup, reproduced before/passed staged after | UI/mission: preserve reward/unscoped notices; verify actual route and broader HUD separately. |
| FLIER-SCALE-01 / P2 | Loaded flight presentation/readiness corrected, full-cycle staged pass and visual acceptance | Art/QA: keep actual assets/renderer and same bounds; full motion/device perception not inferred. |
| QA-IMPORT-18 / P2 | Inherited guard retained; property regression registered today | QA: no import filesystem mutation; completed campaign nested trace remains intact. |
| QA-EVIDENCE-19 / P2 | 195/196 original log hashes match; input-focus header-only; separate rerun passes with expected bytes | QA: retain both provenances and failed integrity guard; reproduce/isolate output lifecycle, never silently replace/re-hash old evidence. |
| TEXT-CJK-19 / P2 | Fresh `textreveal` fails Chinese wrapping: one line, widest 467px | UI/QA: reproduce in a font-complete browser and inspect actual glyph/layout behavior; retain this failed gate until verified. |
| FLIER-EYE-19 / P2 | Fresh full roster fails enlarged flier downward eye/body bound (+19px vs 16.5px) | Art/QA: hold flight calibration integration until exact cell/transform/head and collision perception are reconciled; keep original acceptance. |
| PORTRAIT-CUT-19 / P2 | Fresh early CUT portrait screenshot is cropped, no visible rotation guidance | UI: reproduce actual emulated state, repair visual/rotation coverage without hiding safety pauses; verify both orientations and physical touch. |
| PUR-SAVE/UX/TOAST, GH-EYE / P1–P2 | Inherited Oct17/18 work | Integrator: do not double-apply; verify final merged build and correct device bindings. |
| QA-CHARGE / QA-GH-JUMP / FILM-HANDOFF / P2 | Historical discrepancies retained, current outcomes below | Combat/cinematic QA: retain actual dispatch/simulation/readiness evidence; no weakened thresholds. |
| GH-ART / P1 | Open authored fidelity gate | Character/cinematic: approved parts/poses and four matching panels, not extra glow. |
| DOWN/FURNACE/PURIFY-ART/FILM / P2 | Open coverage gates | Use approved missing poses/films once; preserve completed lion. |
| ART-4/5/6 / P2–P3 | Unchanged localized panel issues | Preserve composition/identity; edit only actual defect through approved pipeline. |
| DEVICE/AUDIO/PERF/PARITY / P2 | Unverified | Physical touch/pad/haptics, listened ending, sustained device cost, every optional cave and comic action. |

No release certification from a staged success or green subset. Use the single
copyable block in [CLAUDE_PROMPT.md](CLAUDE_PROMPT.md). Fetch current refs before
integration, preserve other changes, rebuild all outputs/packages and retest one
final build. No automatic production merge, deployment, force-push or external
message is authorized by this review.

Handoff-coherence checkpoint: [result](after/handoff-check.json) validates the
353 staged paths against the owned-file whitelist, 15 changed JS/CJS syntaxes,
109 local Markdown links, one copyable prompt, archived opening-frame hashes,
unchanged tracked assets/dependency files and the **retained failed** strict
integrity gate. It is not release approval. Main/integration were rechecked
before publication and still match intake; the review ref was absent. Only this
review branch is to be created, followed by exact tree/path/mode read-back.
