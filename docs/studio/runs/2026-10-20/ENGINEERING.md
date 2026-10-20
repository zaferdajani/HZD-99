# Engineering studio review — 2026-10-20

## Authority and evidence boundary

This grouped reviewer instantiates five separate engineering responsibilities.
Read in full: `AGENTS.md`, `docs/DEVELOPMENT_AUTHORITY.md`, `CLAUDE.md`,
`docs/STORY_CANON.md`, `docs/studio/PIPELINE.md`, the five engineering mandates,
and the relevant Oct19 engineering/consolidated evidence. The current explicit
review-only instruction supersedes old automatic production publishing rules.

Intake source: `f19aee0bc93400944402aeee45db00068abd8ebd`, carried into
`codex/studio-review-2026-10-20`. The producer pins main and integration to
`62d75d204c6f6264f25150bb419fc262ff2c18ea`; this reviewer did not independently
fetch the external refs. No runtime, browser configuration, build or test source
was changed by this reviewer. Only this report is owned here.

Evidence is **source-inspected** unless expressly labeled **historical Oct19**.
No browser, build, harness or fresh continuous campaign was run by this worker.
The producer owns today's fresh executable/visual evidence and final build ID.
Staged assertions, internal state observation, continuous ordinary input and
physical-device play remain separate categories.

## Five responsibility verdicts

| Responsibility | Verdict | Evidence and remaining boundary |
|---|---|---|
| Senior Technical Director — World Systems | Issues | Mandatory gates/migration remain explicit in `js/progress.js:34–64`, not a toast-only lion lock. Source payoffs are not proof of every optional cave traversal, collision outcome or physical package performance. |
| Senior Gameplay Engineer — Combat | Issues | Contact feedback/stats/capped ledger remain implemented. Keep the previous flier presentation candidate held until actual loaded flight eye placement is resolved. Historical timing passes are not new fixes. Full authored ritual-body motion and device impact feel remain unverified. |
| Senior Gameplay Engineer — Mission | Issues; retained bounded fixes | Principal rescue choice/reward commits atomically after film; raw-marble extraction retires only its semantic instruction. These inherited changes must be integrated once, not reimplemented. Current full-suite/save outcomes belong to producer evidence. |
| Senior Gameplay Engineer — NPC | Issues | Ratchet revival/own-battery identity, useful Servo and post-forge optional Alpha offer remain. Friendly lion chooses stalk while following and places itself on ground-column data, but source alone does not demonstrate all planted contacts, transitions or first-time NPC comprehension. |
| Lead UI Engineer | Issues | Typed reader/reveal-vs-advance and real mapped rescue controls remain. The sampled Oct19 portrait crop, Chinese glyph/layout gate and original-log integrity gap require distinct investigations; none is established as a general dialogue-system failure. |

## PORTRAIT-CUT-19 — source investigation, not an assumed renderer fix

**P2; UI owner. Status: historical observed issue, current cause not yet proven.**
Oct19's [actual 390×844 capture](../2026-10-19/automated/opening-frames/phone-portrait-390x844.png)
shows a cropped early story frame without usable rotation guidance. Its harness
only photographs and rotates back; `tests/opening-order.cjs:50–65` contains a
comment asserting guidance, not a test that it was visible. Do not infer a
working orientation policy from that comment or a landscape pass.

The source does **not** support blaming `draw()`'s CUT early return alone:

1. `draw()` selects CUT/PANELS/PURIFY renderers (`js/game.js:16128–16138`).
2. `mainLoop()` invokes `drawTouchUI()` **after** `draw()` returns, independent
   of those states (`js/game.js:18155–18158`).
3. `drawTouchUI()` (`js/touch.js:779–796`) checks touch availability, then pad
   mode; otherwise it reads actual visual viewport dimensions, clears the touch
   canvas and paints an opaque portrait rotate overlay before state controls.
4. Touch capability is sampled once when `TOUCH` is initialized
   (`js/touch.js:3–5`), and `tcSetup()` runs only if it is true (`:996`). Setup
   exposes `#tc`, sets its 2D context and installs resize/orientation listeners.
5. `tcResize()` (`:78–119`) uses `visualViewport`, an optional observed visible
   sub-rectangle and a fixed 16:9 game frame. It writes both canvases' actual CSS
   geometry; intrinsic 960×540 alone is not the presented viewport.
6. `padConnected()` (`js/engine.js:177–189`) can hide `#tc`, and `drawTouchUI()`'s
   pad guard returns before the portrait path. A missing touch layer, pad mode,
   actual visual viewport or stopped frame loop must be measured at capture.

Required reproduction record: `TOUCH.enabled`, `PAD.on`, `TOUCH.rawW/rawH`,
`vw/vh/ox/oy/portrait`, `innerWidth/innerHeight`, `visualViewport` dimensions,
both canvas backing sizes/CSS/computed display/rectangles, current CUT/PANELS/
REPAIR phase, frame-loop advancement, page errors and actual frame. Reproduce
both orientation directions before choosing the smallest source correction.
Do not simply force touch enabled in the test to certify auto-detection.

Acceptance must assert the **visible** rotation affordance and contained active
reader at the actual emulated state, not just `TOUCH.portrait === true`. Keep
input/hold/reset safety; measure whether gameplay or video advances invisibly.
Only purification has a dedicated portrait hold guard in the inspected source
(`js/purification.js:15,118`); the touch overlay itself is drawing, not evidence
of a general simulation/media pause. Physical phone orientation/touch behavior
still needs a device pass even after an emulated regression is green.

## TEXT-CJK-19 — retain exact failure and test real glyph coverage

**P2; UI/QA owner. Alias `QA-TEXT-ZH-19`; one finding, not two.**
Historical Oct19 `textreveal` fails required multi-line Chinese layout: **one
line, 467px**, within `DLG_W=548`. It is not observed overflow or JavaScript
character loss. Other recorded English/Arabic pacing/queue/RTL checks pass.

The separate Oct19 diagnostic reproduces that canvas measurement and reports
URW Bookman/Demi in a matching DOM platform-font trace; CLI Fontconfig reports
Open Sans. Neither a CLI family name nor a DOM trace alone identifies canvas
per-glyph rendering. Original host had no listed zh-capable font. The prepared
PyMuPDF CJK font did **not** produce a completed comparison: alternate-wrapper
launch was permission-blocked. Preserve that result, do not describe it as a
successful rerun or bypass the block.

A newly prepared, legitimate font-complete environment should be preflighted,
then frozen **before** today's collector. Measure browser-rendered unchanged
fixture, glyph/layout behavior and original `textreveal` assertion. Do not
change the sample, force its line count, relax box width or call tofu a reader
certificate. A verified environment explanation does not establish font
coverage on every shipping browser or physical device.

## QA-EVIDENCE-19 — evidence retention, separate from gameplay

**P2; QA/producer owner.** The previous collector records input-focus success
and expected digest, but the original `input-focus.log` is header-only and has
a different digest. Strict verification reports **195/196** original log hashes
matching. A later unchanged passing rerun matches the expected bytes but is a
**different execution**. Both original record and damaged log must be retained.
The cause/timing of original byte loss is unknown.

A bounded mitigation can capture the actual raw log bytes alongside their
digest at collection time, then fail closed if final raw files diverge. This
would improve retention and expose corruption; it does not prove or repair an
unknown lifecycle root cause or retroactively restore Oct19 provenance.
Contracts should exercise normal, missing, malformed and deliberately truncated
log records; preserve the captured original and reject a changed file rather
than silently recomputing its digest. The producer owns implementation and
verification, not this source-only reviewer.

## Inherited implementations — preserve and integrate once

| Contract | Current source | What source does not certify |
|---|---|---|
| Marble → blade → Sage → CHIME → lion | `PG_LAIR_NEEDS`, `pgLairOpen`, `pgBellOpen`, safe bench migration in `js/progress.js:34–64`; goal/material return in `:72–89` | Ordinary-input completion of every branch, every legacy save or no visual confusion. |
| Optional Alpha causality | `alphaQuestOffer`, `js/wolves.js:625–629`, requires first forged crystal and writes quest/lead; absent from lair milestones | Natural full optional encounter/return route, authored down/recovery quality. Never make Alpha the mandatory marble or lion prerequisite. |
| Material-hint lifetime | Actual rejected claw producer uses `'marble-extraction'`; successful pillar block filters only that scope before `questTake` (`js/entities.js:2514,2816–2822`) | Every locale/low-volts/reload/overlay presentation. Oct19 EN/AR staged and English route proof remain historical, not new work. |
| Principal opening-hint lifetime | Boss producers tagged `'boss-opening'`; guarded `purificationBegin` removes only it | General post-rescue notice crowding or all HUD accessibility. |
| Atomic principal rescue | `brAnswer` defers principal choice (`js/braid.js:437–460`), `purificationCommitChoice` matches exact guardian/room (`js/purification.js:81–90`), completion invokes it | Existing historical saves are not safely repayable at random; do not rewrite ledgers or duplicate spoils. |
| Intentional purification | `PURIFICATION_HOLD=1.6`; release-armed actual Interact/dedicated button; blur/visibility/portrait resets; phased gathering/slash/impact/black/film/return (`js/purification.js`) | A blade glow overlay is not authored hero raise/hold/slash/recovery, and staged controls are not physical pad/touch proof. |
| Friendly lion walking | `js/entities.js:12142–12169` selects stalk while following, with ground-column positioning | All facing/terrain planted contacts or temporally seamless motion. |
| Finite eye effects | `js/infection-eyes.js` excludes friendly/tamed/purified/disabled owners, bounds trail age/count and reduced-motion smoke | An exactly matching eye-to-smoke origin can still be anatomically misplaced. Retain flier held gate until exact pose proof. |
| Helper import safety | `tests/campaign-ch1.cjs` CLI-only output initialization; registered `campaign-import` no-browser harness | Actual complete campaign; contract/import checks are independent from ordinary-input traversal. |

## Combat and cinematic acceptance

`js/combat-stats.js` already implements HP/cores, defense, power, cadence
multiplier, hero swings per second, normal/heavy/charged hit weighting, flash,
finite hardware fragments, contact-owned recoil/shake/hit-stop, protected
contacts and a capped 200-event/exportable ledger. Do not duplicate that system
or mislabel an enemy cadence multiplier as measured attacks per second.
Reuse existing card/field-guide outputs; no new PDF or artwork is made here.

Oct19 full `combat-impact-input`, GRAVEHORN dodge and filmflow passed without
new timing/source changes; their Oct18 failures remain historical. Do not carry
old failures as current reproduction or present an unchanged rerun as a fix.
Today's collector must preserve current timing outcomes, not widen thresholds.

The completed lion purification is the only new matching principal ritual film
listed by `PURIFICATION_MOVIES`. Four other guardians use their own in-engine
extraction fallback, not the lion's film; old `purify_*` clips are not the new
matching choreography. Preserve the lion's existing 13.25-second resolved
outro. Its encoded picture/audio fades are documented, but runtime plays video
muted with separately routed music, so they do not certify a listened in-game
handoff. The ordinary-input driver can deliberately skip CUT/CINE; a chapter
certificate alone does not prove an unskipped film or complete soundtrack.

## Review limits

No production merge or deployment is authorized or performed by this review.
All-role/artwork approval, true all-pose eye/head anchoring, all optional caves,
physical keyboard/controller/touch/haptics, subjective sound/music continuity,
native compilation/installation and sustained device frame time/memory remain
separate acceptance work. A successful package snapshot or viewport emulation
must not be labeled a physical-device certificate.

Today's final source/test identities, bounded fixes, full results and fresh
continuous route are producer-owned in [REPORT.md](REPORT.md). They supersede
this intake report only where linked evidence actually demonstrates the claim.

## Fresh targeted investigation and assigned bounded correction

This section supersedes the source-only boundary **only** for the diagnostic
and code described here. With the producer's exclusive browser slot, this
reviewer executed [portrait-diagnostic.cjs](portrait-diagnostic.cjs) on inherited
build **`1d3a7c72250c`**, before runtime edits. The diagnostic directly hashes
the served page against disk, and retains [raw data](portrait/result.json),
[execution](portrait-run-owned.log) and eight rotation frames plus the Chinese
fixture. Zero page errors. Two earlier executions never reached a browser:
`portrait-run.log` and `portrait-run-served.log` record ECONNREFUSED when a server
was outside the command's local network namespace. The successful invocation
owns its server in the same process tree; no permission escalation occurred.

### Portrait cause directly reproduced

The exact opening-order setup (`startGame(newSave(1))`, change 844×390 to
390×844, wait 500ms) is **PANELS/wake**, not CUT. This corrects the unmeasured
early-CUT label from the historical report; the observed cropped presentation
was real. Fresh data has `TOUCH.enabled:true`, `PAD.on:false`, live advancing
frames, current `visualViewport:390×844`, `TOUCH.rawW/rawH:390×844`, but stale
`TOUCH.vis:844×390` and wrongly retained `vw/vh:844×390`, `portrait:false`.
The game canvas remains CSS x130.6,width582.8, extending to713.4 outside390;
the touch canvas remains844×390. Source `tcResize()` overwrites the valid new
viewport with that stale observer rectangle. The observer's intersection ratio
can remain1 across rotation, so waiting for another threshold notification is
not sufficient. CHIME panels reproduce the same crop.

The reviewer inspected the raw opening and CHIME portrait PNGs: only the right
story portion/caption is visible, with no rotation guidance. In contrast, the
portrait repair DOM card is contained and readable; it owns z10000 above the
z5 canvas. Do not raise the rotation canvas over that working modal or call its
hidden behind-modal instruction a cropped-board failure.

Assigned implementation: `js/touch.js` now clears `TOUCH.vis` when raw viewport
dimensions differ, **before** replacing `TOUCH.rawW/rawH`. Same-viewport host
obstruction still uses its measured sub-rectangle. No scale/collider, tutorial,
reader/hold timing, game progression or assets change. New registered
`tests/portrait-rotation.cjs` stages real CUT, PANELS and repair, rotates both
ways with a retained prior intersection, checks actual canvas containment,
visible painted portrait text/background/top layer outside repair, and a
contained repair modal. It does not force touch auto-detection or broadly raise
overlays. The purposeful same-viewport clipping control must remain green.

`PORTRAIT_BASELINE=1` is an explicitly diagnostic failed-before mode: it restores
only the exact Oct19 `tcResize` function inside the browser page from pinned Git
source, not the entire old build. Sources on disk are never rewound. Producer
owns the before/after executions and full validation; at this edit point only
syntax of the runtime and new harness has been checked, not a passing regression.

### Chinese environment comparison, not a game wrapping patch

The same successful diagnostic renders the **unchanged** `tests/textreveal.cjs`
Chinese fixture/font/548px box in the producer's new, preflighted CJK-capable
browser environment. It measures **three lines, widest544px, full width1424px,
text preserved** on inherited build1d3a. Matching DOM platform-font trace names
Droid Sans Fallback for87 glyphs and URW Bookman for2. The raw
[fixture PNG](portrait/cjk-fixture.png) was inspected and shows legible Chinese
characters across three lines, not the prior thin/tofu-like fallback marks.
This is a DOM glyph trace plus canvas metrics/screenshot, not canvas per-glyph
instrumentation. Oct19 original467px/one-line result remains historical; no
paired original-font browser was run today. The unchanged textreveal pass is
producer-owned. No runtime wrapping, sample or assertion was modified, and no
font binary was added to the game by this reviewer.

## Fresh full-run hold — QA-PURIFY-TOUCH-20

**P2 integration hold; UI/Combat/QA. Fresh automated failure, cause unproven.**
During the producer's frozen full collector,
[purification-controls.log](automated/purification-controls.log) fails the first
touch-hold assertion at `tests/purification-controls.cjs:27`:
`G.purification.hold > .4` after 30 manual 1/60 updates. The preceding binding,
localization and minimum button-height assertions did not throw. Actual hold,
pointer target, arming, button coordinates and page state are **not recorded**
by that failure, so do not infer a particular delivered input or a dead entire
purification system. The later touch-cancel, blur, hidden-clock, completed hold
and restored-save assertions in this harness are not reached. Other purification
harness passes do not replace this failed path or certify physical touch.

This reviewer inspected source/log only while the full collector runs; no new
browser, source change, assertion/timing adjustment or rerun was performed.
Retain the original failure even if a later diagnostic or unchanged rerun passes.

### Relevant source chain and competing hypotheses

The fixture disables `requestAnimationFrame` immediately after only waiting for
the `purificationBegin` symbol. It stages the arena and calls `tick(1); draw()`.
It rotates portrait and back to landscape, each time immediately doing another
manual tick/draw. It does **not** await touch resize/layout convergence, advance
`drawTouchUI()`/the full frame loop, verify the button lies inside the current
viewport, or record `elementFromPoint` at its dispatched CDP touch position.

`drawPurification()` (`js/purification.js:175–188`) positions the DOM button from
the **current game canvas CSS rectangle**. `tcResize()` changes that rectangle
on resize/visual-viewport callbacks; the new bounded fix now correctly centers a
300×168.75 frame in 390×844 portrait. A **possible, unproven fixture race** is a
landscape manual draw before its resize callback: the button could be positioned
from the previous portrait rectangle (top≈337.6 + 0.8×168.75 =472.6), outside a
390px-high landscape viewport. A later resize moves the canvas, but the frozen
frame loop cannot automatically reposition the button. `boundingBox().height
>=48` alone does not detect offscreen coordinates. This source calculation is
a diagnostic lead, **not an observed failed bounding box or proof the new fix
caused the failure**.

A boot/readiness or hidden/blur/input path is another lead. The fixture does
not wait for `heroArtReady()`/boot overlay removal before freezing RAF. However,
the loader's z99 is below the positioned purification button's z10000, so
loader presence by itself would **not** establish interception of an onscreen
button. `updatePurification()` resets hold/arming/pointer when document.hidden
or portrait is true; release must arm before a new hold. Pointer capture loss,
wrong targets or hidden state require actual event/phase evidence, not guessing.

### Required post-collector diagnosis

After the producer finishes the frozen collector, reproduce the exact fixture
without modifying production/test sources. Record at every rotation and just
before/after dispatched touch: viewport/visual dimensions, `TOUCH.rawW/rawH`,
`vw/vh/portrait`, canvas rect, actual button rect and center, whether that point
is inside viewport, `elementFromPoint`, computed styles, loader presence,
`document.hidden`/focus/input suspension, pointer event targets/capture, and
purification phase/armed/pointer/hold. Capture a real frame at the failing point.
Only then compare an ordinary boot-ready, settled-layout input path separately.

If the test samples before presentation is ready, repair its explicit readiness
contract while retaining the original hold amount and input assertions. If the
actual settled gameplay path is broken, fix that responsible runtime owner and
add a failing-before regression. Never hide the issue by forcing hold state,
dispatching to the handler instead of the visible button, relaxing .4, changing
the hold duration or deleting the portrait/focus safety cases. Final current
status and any separate results belong to [REPORT.md](REPORT.md).

## Fresh full-run hold — QA-WINCH-ENDPOINT-20

**P2 test/presentation acceptance hold; World/QA owner.** The producer's frozen
[winch-purpose.log](automated/winch-purpose.log) fails the walking-stop bound:
player.right579.8589339323496 exceeds recorded tip579.0825713293923 +0.5.
The difference from the stored tip is about0.776px. The same harness's remaining
checks pass: lesson readiness, jump barrier, pushing explanation, no wrong-side
pullback, actual strike progression/scrap cap/collection, far-Burst refusal,
near-Burst stop/lift/reward, open road, reload/legacy/no-tutorial and NOSTOS,
with zero page errors. Do not describe the complete road gate as bypassed or
general combat failure from this subpixel comparator alone.

**Source-inspected comparison mismatch:** the fixture takes `tip=e.armPoint()`
before `walk(1,240)` but compares that stored point to the final player edge
afterward (`tests/winch-purpose.cjs:101–114`). `YardWinch.barrier()` deliberately
uses `armPoint(YARD_WINCH.tip,WINCH_JAM)` and a minus1px stop; visible `armAngle`
judders around JAM each update (`js/winch.js:50–65,147–149`). The returned
`angle` is the final angle, not necessarily the stored tip's angle.

Using the unchanged source constants, observed cx656 and face−1, an independent
arithmetic calculation gives static jam tip580.8589339323496 and stop limit
579.8589339323496: exactly the logged final player edge. This is **source
arithmetic**, not a fresh browser endpoint observation or complete visual-contact
certificate. The failed comparison may be sampling a stale moving visual point;
neither enlarge tolerance nor change the barrier until same-step old/current/
static endpoints and actual contact geometry are retained.

Prepared [postflight/winch-endpoint-diagnostic.cjs](postflight/winch-endpoint-diagnostic.cjs)
adds those observations to the actual original harness in memory, preserving
its assertions and clock. It refuses to run until the full collector has a
finished timestamp and redirects only historical output files. It has been
syntax-checked, **not executed by this reviewer**. Prepared
[purification touch diagnostic](postflight/purification-touch-diagnostic.cjs)
similarly preserves the original source/assertions and retains a failing exit;
its separate `settled` mode is explicitly a hypothesis control, not an original
run replacement. Instrumentation adds observation time and may perturb races.
No frozen production/test source was modified to create either diagnostic.

## Fresh full-run hold — QA-OPENING-PHONE-20

**P2; UI/Player Systems/QA. Fresh partial phone-viewport opening, not a proven
broken Burst mechanic or physical phone result.** The producer's frozen
[opening-order.log](automated/opening-order.log) records the desktop case
passing all sampled checks, reaching A1 through all15 ordered lesson steps,
47 screenshots, useful Servo revival/intro and the **staged** coil hand-in.
The coil is placed in inventory by this harness; those checks do not prove
climbing to acquire it.

The phone case uses keyboard controls inside a mobile/touch-capable emulated
viewport. It ends in **A0**, with13 steps through `burst`,37 screenshots and no
page errors. `node`/`go`, meadow, monument and Servo outcomes were not reached;
their checks fail. This is one failing harness with multiple unmet outcomes,
not six independent demonstrated gameplay defects. Do not mark the phone route
complete, describe actual touch traversal, or use the desktop result as its
replacement. Other properties that this phone case did reach—one-control and
fully filled guidance, funded pack without floor scrap, no observed simultaneous
overlays and goal/chip separation—remain recorded passes.

### Timing evidence and its limits

`tests/opening-order.cjs:77` sets a **240,000ms per-case loop deadline**. The
test runner permits900,000ms for the whole harness. The collector adds180s
overhead for its wrapper, producing the actual recorded `timeout_seconds:1080`.
The collector entry measures **476.517285s**; the nested runner prints476.2s.
Neither is a900-second harness timeout or a1080-second collector timeout. These
are three distinct limits, not interchangeable deadlines. The driver checks its deadline
only at the next while iteration. In the Burst branch (`:216–220`) it holds X
for900ms, takes a charging screenshot, releases X and waits400ms. A charging
photo is therefore captured **before release**, not evidence of release failure.

[Pure-filesystem analysis](postflight/opening-timing.json), reproduced by
[opening-timing.cjs](postflight/opening-timing.cjs), reads the closed archive
manifest without launching a browser or changing source/tests. Its stored phone
portrait marker is **2026-10-20T08:50:37.221Z** and its one phone charging marker
is **08:54:37.742Z**, a240.521-second interval. These are **filesystem write-time
markers**, not the loop's logged start/end. Portrait was photographed before
returning to landscape and before initializing the loop deadline. The case's
first ordinary movement photo is08:51:22.981Z; it is also not the loop start.

The close proximity to the source budget makes deadline exhaustion a strong
diagnostic lead, but the original harness does not retain explicit case-start,
deadline-expiry, actual charge simulation duration, post-release state or failure
reason. There is only **one** retained phone `burst-charging` filename. It does
not demonstrate repeated unsuccessful charged releases, nor establish whether
one final attempt progressed immediately after the last sampled state. Preserve
the original failure; do not invent a mechanic regression, unlogged input timing
or a completed phone route from this evidence.

### Required next acceptance

On a separately identified run after the collector finishes, retain a monotonic
case-start/deadline and milestone trace, step/action/room/state, every input
down/up time, rAF/simulation progress, chargeT/volts/earned pack, actual release
result/winch distance and lift/lesson flags. Record why the loop exits and its
last post-release state. Distinguish a slow reader/host plus finite driver budget
from an actual ignored or insufficient charge, and test the visible control path
without setting progression flags or simulating a successful Burst directly.

If a longer justified case budget is required, keep it finite and ensure the
two cases plus Servo follow-through remain inside the registered900-second
runner envelope; record the measured reason, do not simply remove deadlines or
soften completion assertions. Any changed driver is new coverage, not a rewrite
of this failed full run. Verify node → go → A1 → Servo outcomes with retained
frames and unchanged success contracts, then separately exercise real touch
and physical devices. No source/test/browser change was made during the frozen
run for this finding; the producer owns final status and fresh campaign scope.

## In-progress continuous route — QA-CAMPAIGN-BAT-20

**P2 verification/driver hold; World/Combat/QA. Not a final campaign result.**
Read-only inspection of the still-running
[campaign trace](automated/campaign-ch1/campaign.log) observes CV1 → CV1B
at04:19, bat fighting at04:27, and bat HP falling54→26 by04:40. From04:40
through at least11:30 the periodic state is unchanged: hero x896,y156,vx0,
grounded,6/7 cores,99volts, mission`marble`, heldArrowLeft; bat x784,y201,
24×18,HP26. Repeated `FIGHT bat` lines do not show repeated successful hits.
The clock continues near1× wall, with33ms frames. This is observed lack of
progress, **not** a frozen simulation, a completed route or an established
unavoidable gameplay collision softlock. No process or input was interrupted,
no extra browser launched and no driver/runtime source edited by this reviewer.

### Source explains a driver starvation path

Using the logged rounded coordinates and the driver's24×36 hero yardstick,
hero center≈908,174 and bat center≈796,210: horizontal separation112px,
vertical36px. `threat()` (`tests/campaign-ch1.cjs:830–841`) admits a bat within
150px horizontally and140px vertically without line-of-sight or route
reachability. `fight()` (`:843–860`) computes target-edge distance100px.
Its jump/up-strike branch only handles an enemy **above** the hero and within
80px; this bat is **below**, so that branch is not applicable. At distance>40,
the remaining policy either waits for a pit or holds toward the enemy for50ms;
the logged heldArrowLeft is consistent with the latter. It never asks the
terrain planner for a jump/alternate approach in this branch.

Most importantly, `runMissions()` (`:1304–1308`) resets `stall.since` on every
threat selection, calls `fight()` and returns before mission navigation. The
normal `walkTo()` nine-second progress watchdog (`:668–670`), graph jump
selection and its callers' `unstick()` path therefore cannot recover while
this threat remains selected. This is a concrete **driver-policy starvation
mechanism** supported by source and the unchanged log, not proof that a human
player cannot leave or reach the bat by different legitimate input.

The bat's hang/dive rule also fits the stationary arrangement: the production
`near` check requires hero centerY > bat centerY−20 (`js/entities.js:7980`),
which is approximately174>190 and false in this sample. It may stay hanging
while the bot stands above it. The trace does not record `hang`, actual tile
contact, bat timers or raw—not rounded—coordinates; do not claim the precise
bat state or a live collision defect from this inference alone. The subsequent
static reconstruction below narrows the source geometry without observing the
live grid or actual player escape.

### Required separate diagnosis and acceptance

Preserve the owned run's actual status and termination. The producer reports
its attempted stop reached a read-only `/proc/51711/cwd` check that returned
**EACCES before any signal or write**. That boundary was respected, with no
retry or bypass. **No interruption has occurred** at this review point; the
original55-minute campaign timer continues. Do not label an unperformed signal
an interrupted run, invent a timeout before it occurs or synthesize a campaign
certificate. The collector's remaining checks are separate. A corrected-driver
attempt cannot retroactively complete this execution. Afterward retain a same-state room-grid/contact
snapshot, bat hang/dive/timers, actual world/collider positions and visible
frame. Use legitimate input to test an alternate terrain approach, drop/jump,
retreat or return to the pod. Distinguish inaccessible target selection from
a reproducible player collision/exit failure before changing production terrain,
bat behavior or damage.

The smallest driver acceptance is finite progress detection **during combat**:
if neither target HP, actor position nor encounter state changes, do not reset
the sole watchdog indefinitely. Re-enter the existing path planner or a bounded
normal-input recovery; do not teleport, set inventory/quest flags, kill the bat
through an API, ignore page errors or waive missing chapter milestones. Verify
the stalled geometry then repeat the uninterrupted route on the same identified
build. All final run counts and certification remain producer-owned.

### Exact static CV1B reconstruction — not live intervention

With producer authorization, [cv1b-static.cjs](postflight/cv1b-static.cjs) evaluates
the unchanged **complete `js/world.js`** in an isolated Node VM and calls its
actual `buildRoom('CV1B')`. No DOM/browser, live game attachment, input, process
signal, production/test edit or environment change is involved. The
[JSON evidence](postflight/cv1b-static.json) retains source SHA256 values, the
40×17 output grid, local tile bounds and explicit rounded-start assumptions.
`loadRoom` assigns this builder output (`js/game.js:1171`); this diagnostic does
not capture later live mutations, breakable state, heightfields or gate geometry.

The reconstructed local geometry explains a normal west collision:

| Tile | Source material | World bounds / significance |
|---|---|---|
|27,4|Solid `#`|x864–896,y128–160, intersects the upper part of a24×36 hero at896,156.|
|27,5|Air `.`|x864–896,y160–192; only32px vertical clearance below the rock, less than the36px body.|
|28,6|One-way `=`|x896–928,top192, supports the logged hero's feet.|
|29,6 and30,6|Air `.`|Eastward opening beyond that upper shelf.|
|29,7 and30,7|One-way `=`|Lower landing surface at224,32px below the first shelf.|

Production `moveEnt()` (`js/entities.js:234–259`) checks the body's head and
foot tile rows for westward solids and places its left edge at the obstructing
column's east boundary plus0.01. For column27 this is896.01, consistent with
the rounded invariant x896. A west jump is bounded by the same hanging rock
and ceiling. This is expected collision with authored material, not evidence
that the resolver has frozen or that terrain must be deleted.

The helper also evaluates the **unchanged planner-function block as source**
in that VM, at separate1/60 and observed1/30 steps. It predicts a rightward
walk-off from rounded rest position896,156 lands after0.30s at953.49,187.99
(1/60) or955.99,187.99 (1/30), on the lower shelf. Its navigation graph has
an eastward walk-off followed by a westward fall/approach to the bench region
in both step cases. Thus the bot's own terrain model offers an alternate
right/down approach while its threat policy insists on left.

These are **static conservative planner predictions**, not production
`Player.update` execution or a successful ordinary-input escape. The planner
uses905px/s jump launch versus production920, omits the current heightfield
and actors, starts from rounded coordinates and can assume running speeds
on graph edges. Do not certify the whole cave or a literal input sequence from
them. A separately witnessed live input path remains necessary; the static
evidence supports fixing bounded combat-planner recovery before proposing a
speculative production collision/terrain rewrite.

## Final producer evidence readback — frozen run and separate diagnostics

This section supersedes the earlier **in-progress** language only for the
explicit outcomes below. This reviewer read the completed JSON/log artifacts;
no new browser/test, production source or frozen test edit was performed.
The producer owns full execution, release disposition and publication.

### Full collector is complete, not green

[Full results](automated/results.json) close at
**2026-10-20T09:51:32.014954+00:00**, build **`5b19cbfbf709`**,
`complete_requested_scope:true`, `passed:false`. There are **196 registered
harnesses:192 pass /4 fail**. Including build, pack and two served-identity
records yields **200 entries:196 pass /4 fail**. The failed harnesses are
`purification-controls`, `winch-purpose`, `opening-order` and `campaign-ch1`.
Neither a staged subset nor postflight hypothesis control overrides that result.

[Strict integrity](evidence-integrity.json) also fails correctly, independently
of those four checks. All281 frozen-file identities are retained; one original
raw log diverges from its captured snapshot: `desktop-protocol`,89 current
bytes versus207 captured bytes. Its original captured bytes/digest remain valid
inside the collector record, while raw/snapshot equality is false. Do not
replace the original raw file or rewrite its expected digest. The new snapshot
retention and fail-closed comparison are useful **mitigation/detection**, not a
proven repair of the unknown mechanism of later byte loss. Producer-owned
retention analysis and preserved captured-copy are separate evidence. The
[retention analysis](postflight/retention-analysis.json) confirms198/198 valid
original snapshots and197/198 matching raw logs. It preserves distinctly named
decoded captured-original and observed-damaged copies, never substitutes either
for the raw file. The outer collector progress transcript retains only62 named
progress lines and omits136 expected names; this is **transcript loss**, not
136 missing harness executions. Its incompleteness does not override the
per-test records. No common cause for these separate losses is established.

### Continuous campaign naturally times out; no completed chapter certificate

The [actual campaign result](automated/campaign-ch1/result.json) records
`result:'timeout'`, **55:00**, `certified:false`, zero deaths, zero page errors,
`segment:null`, `stopAt:null`. Only `opening`, `servo`, `first-meeting` complete.
The CV1B bat plateau continues through54:55; the normal55-minute loop emits its
end frame and result. The earlier process-control attempt stopped at EACCES
before sending a signal; **this run was not externally interrupted**.
The producer's collector entry measures3301.213058s and exit1.

Eight required later sequences are missing: `marble`, `forge`, `passage`,
`sage`, `break`, `chime`, `free`, `ch2`. This is a fresh attempted uninterrupted
ordinary-input run, **not a completed chapter**, and Oct19's separate completion
cannot fill its missing milestones. Static terrain/planner analysis above
supports a driver starvation lead, not a successful live escape or certified
mandatory route on today's candidate.

[Trace comparison](trace-comparison.json) retains another evidence distinction:
the outer campaign runner log has1575 timestamped progress lines versus1572 in
the nested duplicate. Four outer lines are absent from nested (three01:02
tutorial lines and a04:17 rock-opening toast), while nested has one extra
00:00 BOOT line. Their hashes/line sequences differ. This does not invent
additional traversal, reconstruct unknown lost bytes or certify the campaign;
retain both and use the hash-checked original outer record as the producer's
stated authority. Do not silently normalize the duplicates into agreement.

### Purification diagnostic confirms an offscreen fixture target

The separate [original-mode diagnostic](postflight/purification-touch-original/result.json)
retains exit1 and the original hold assertion. Returning to844×390 after
portrait leaves the manually drawn button at **x135,y472.625,width120,height48**;
the original touch point is **195,496.625**, outside the viewport. Actual
pointer/touch events target **HTML**, not the button; `purificationPointer`
stays false and hold stays0 despite armed:true, hidden:false and30 manual ticks.
This directly establishes the sampled wrong-target mechanism; it is no longer
merely the earlier source-derived coordinate hypothesis. Loader interception
is not needed to explain this failure.

The **distinct** [settled-layout control](postflight/purification-touch-settled/result.json)
waits for actual resize geometry and services drawing before retaining the
same original input/hold/safety assertions. The button center is then
**421.9765625,317.328125** inside844×390; events target the actual button,
pointer becomes true and30 ticks yield0.49999999999999994s hold. Its
[log](postflight/purification-settled.log) and output record exit0 and final PASS,
covering the original downstream cancel/blur/hidden/completed-hold/restored-save
assertions as well. This is **staged emulation and a readiness hypothesis
control**, not a production code correction, unchanged full-harness pass,
physical touch certificate or replacement of the original failed execution.
Observation itself adds time and can perturb races; source/test hashes and
separate output directories preserve that boundary.

### Winch diagnostic measures distinct old/current/static endpoints

The separate [same-step endpoint record](postflight/winch-endpoint/endpoint.json)
shows old sampled angle0.5889169802938051/tipX580.1533176460897 before walking,
then final angle0.6323503505920143/currentTipX582.9772607245483 afterward.
The actual static jam tip is580.8589339323496, and minus1 gives exactly the
final player.right579.8589339323496. The original fixture's stored tip and
final angle are therefore demonstrably different animation phases, just as
the source analysis predicted. The diagnostic's comparison happens to pass
with this randomized old phase; that is **not a runtime fix** or a reason to
erase the frozen failed phase.

The producer reports this observation-only invocation exited0. At this readback,
the retained [log](postflight/winch-endpoint.log) ends after the CLAWBYTE
page-error check and does not contain its final NOSTOS/PASS lines. Treat the
captured endpoint/source conclusions as supported, but do not infer complete
archived final assertion coverage from absent lines. No second run or log
substitution was performed by this reviewer. A robust subsequent regression
must compare the intended physical stop and visual/contact geometry at the
same step across phases, without relaxing the existing tolerance merely to
make this old comparison green.

### Disposition

Five engineering role verdicts remain **Issues**, not release approval. The
portrait geometry correction and finite-eye/art presentation work are bounded
changes; current full-suite and continuous-route failures, evidence retention,
physical devices, authored motion/film gaps and audible ending continuity remain
distinct gates. No merge, production deployment or all-device/all-art-quality
certificate is made by this reviewer.
