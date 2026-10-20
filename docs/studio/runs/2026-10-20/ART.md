# Senior art, cinematic and VFX review — 2026-10-20

## Responsibility and evidence boundary

Candidate intake is October19 `f19aee0bc93400944402aeee45db00068abd8ebd` on
`codex/studio-review-2026-10-20`. Main and integration remain
`62d75d204c6f6264f25150bb419fc262ff2c18ea`; inherited review changes are not
production. This reviewer read complete AGENTS, CLAUDE, DEVELOPMENT_AUTHORITY,
ART_BIBLE, STORY_CANON, local PIPELINE and the three role mandates, plus the
[previous art review](../2026-10-19/ART.md), previous consolidated report and
relevant current queues/parity/source. Runtime/tests/build belong to the producer.
No artwork, movie or sound generation job was submitted; approved completed
assets are not regenerated. No runtime source is edited by this reviewer.

| Responsibility | Verdict | Evidence boundary |
|---|---|---|
| Senior Character Artist | Issues; bounded flight registration accepted for final validation | Source/original sheet and all18 fresh gameplay-size state frames inspected; actual chest now intersects its collider and optics remain on the head. All84 registration cases pass after the correction. Broader banked-cruise scale scope, temporal transitions, planted gaits and authored coverage remain separate. |
| Senior Cinematic Director | Issues | Current event/parity ledgers, movie production record and runtime registry inspected. Existing resolved lion ending preserved. Four matching principal films and exact comic-action parity remain open; no new listened film review. |
| Senior VFX Artist | Issues; sampled placement/termination accepted | Original random pass and deterministic40/84 failure retained, followed by84/84 registration success on the corrected build; same source optic pixels/map and finite red plume. No all-pose/device/performance/comfort claim. |

These are assigned review responsibilities, not human credentials. Source/stills
and automated fixtures do not establish an uninterrupted input campaign.

## FLIER-EYE-19: source diagnosis, not a relaxed acceptance rule

The inherited readability improvement uses `TALON_MINI.w:3.75` on both flight
strips, with unchanged26×22 collider and `EDRAW_ROBO.flier:0.96`
(`js/entities.js`, `drawFlierMini`). The October19 full roster failed its original
downward bound: eye about+19px below collider center versus16.5px allowance.
That failure remains valid evidence; the test must not be exempted or widened.

Direct inspection of `assets/characters/talon/cruise8.webp` shows the optic on
the head in the lower portion of every192px square cell, not at square center.
The actual `assets/eyes.json` points are x0.31–0.34/y0.63–0.72 (cruise) and
x0.30–0.31/y0.66–0.71 (chase). `drawStripCell` in `js/media.js` draws and marks
eyes using the same rectangle. Moving the normalized eye alone would detach
it from the real head. The shared flight rectangle is centered on the collider,
although much of the upper cell is empty sky/raised wings and the chest/core
is in the lower third. Enlargement increases that registration error as well
as the useful body scale.

**Proposed smallest correction, not yet measured here:** a constant authored
flight registration origin near the chest/head instead of the square's center,
moving the body and eye together under the bank transform. Determine the origin
from actual source cells/physical body, not the16.5px acceptance number. Keep the
common size and full-cycle wing-height variation, all assets, timings, hitbox,
global scale, damage, fallback and unrelated actors unchanged. Compare strip→tell/
recovery/perch continuity; those are separate sources/framing. Do not vertically
normalize every pose or relocate the eye to make the log green.

[Diagnostic](art/roster-flier-diagnostic.cjs) instruments the **original**
`tests/infection-roster.cjs` without changing its stages, assertions or exit status.
It records the exact measured flier room, animation, velocity, bank/facing, cell,
asset readiness/tier, normalized eye, incoming and world transforms, collider,
reported eye and original body bound for both directions. It retains a raw cell,
optic crosshair, same-cell transformed strip mask, collider/eye/bound overlay and
gameplay frame. The mask is the actual drawn strip, **not a claimed semantic
head segmentation**. Diagnostic overlay is2× world scale for inspection; the
gameplay frame is unscaled. Run only during the producer's browser slot.

### Graphics reopened today (historical captures, not fresh execution)

At their recorded844×390 gameplay framing, reopened
`../2026-10-19/after/flier/gameplay-cruise-min.png` and `gameplay-cruise-max.png`
retain an articulated wingbeat and visibly more core/talon detail than the older
undersized flight. Broad wings are plausible anatomy, not a reason to distort
width. Reopened `graphics/after-hold-1.png`, `after-perch-1.png` and
`after-rise--1.png` show distinct fold/tell/recovery silhouettes but also different
figure material/framing. These stills cannot settle temporal scale-pop or correct
collider placement. Their floating perch/hero positions are deliberate fixtures,
not normal traversal defects. Prior acceptance remains **conditional**, not green.

The reopened portrait image
`../2026-10-19/automated/opening-frames/phone-portrait-390x844.png` confirms the
previous concern: mostly dark, cropped right-side panel/caption, skip text, and no
usable visible rotation cue in that specific state. One captured CUT frame does
not prove all portrait states broken. The producer/UI owner handles a fresh
reproduction/fix and reports its own exact orientation scope.

## Authored motion coverage and deduplication

| Stable issue | Current source/queue evidence | Player consequence and minimum acceptance |
|---|---|---|
| GH-ART /P1 | `js/gravehorn.js` `GH_DRAW`/`ghPart` fallback remains. `docs/ART_QUEUE.md` §2bf queues reviewed rhino identity, separate horns/limbs, phase2 and four `gh_*` panels. | The mandatory material guard still lacks hero-relative physically rendered surfaces. Integrate approved parts/poses/panels once; inspect both facings, missile detachment/return, rear kick, phase2 and hoof contacts. Extra bloom is not authored anatomy. |
| BOUND-ART-01 /P2 | `js/wolves.js:175` holds crouch0; `BEAST_RECOVER.down` at255 flattens to ky0.62. Queue§2cc-ix still calls for `wolfDown4`/`cheetahDown4`. | Disabled creatures lack a true resting/breath/transition performance. Generate only missing approved down coverage, preserve completed locomotion/attack strips, and remove flattening only when genuine artwork replaces it. |
| FURNACE-ART /P2 | Queue§2bn: breath, blast, spent, gather, dive, bell missing; standing/flight figures are transformed/shared. | Distinct biological/robotic loading, contact and recovery are not supplied by a silhouette metric alone. Approved6poses, matching optics and physical contacts required. |
| PURIFY-ART-01 /P2 | `js/purification.js:135–152` draws raised blade/light and analytic slash over existing hero body. | White motes are not an authored arm raise. Need approved one-sword raise→gather hold→slash→recover with continuous hand/hilt connection and exact earned equipment. |
| ART-5 /P2 | Prior localized `m_down.webp` red boss-optic issue is not changed by this review. | Match purple infected boss optics while preserving composition/anatomy; do not blanket recolor. |
| ART-6 /P2 | Prior `r_cell.webp` inactive background Servo indicators remain a localized continuity issue. | Darken only powered-down Servo lights, not awake foreground Ratchet. |
| ART-4 /P3 | Prior `passage_b.webp` paw/arm anatomy mismatch remains. | Localized canon identity edit; keep passage staging and earned single blade. |
| ART-7 /P3 | No fresh evidence that `r_marble` diagram is incomprehensible. | Preserve rather than regenerate speculatively; test actual reader comprehension. |

Approved hero, wolf/Alpha locomotion/attack variations, rounded raw marble,
single/dual/joined sword identities and the completed lion ritual are existing
work. Do not buy or generate them again. Authored-art completion/owner approval
and measured in-engine presentation are different gates.

## Cinematic and manhwa parity

Current canon still requires sleep-based survival, Ratchet's protective pendant
and self-removed own battery, purchased Volt Pack before spending charge, raw
rounded quarry material then first forged white blade, optional Alpha and
Blade→Sage→CHIME→NULLFANG. `docs/MANHWA_EVENT_MAP.md` and current panel sequences
retain gradual text and earned boundary events. Displaying a flattened comic
does not implement reaching, battery insertion, carrying, manufacturing, cable
assistance/catch or case opening. See `docs/COMIC_PARITY_AUDIT.md` rows3–5,14,20,
27–28,31–32; exact page closure requires room/state/asset and actual game capture.

| Moment | Available correspondence | Unclosed exact-art/action requirement |
|---|---|---|
| Wake/bay/gate/Ratchet repair | On-model panel chain and separate own-battery/spare-cell events | Cradle/reaching/shutter/installation physical staging per page. |
| Quarry/marble/forge | Causal raw-material mission before first blade | Physical carrying/manufacture and matching cave staging. |
| GRAVEHORN | CV3 heavy soldier encounter | Four `gh_intro_a/b`, `gh_phase2`, `gh_down` panels are queued, not unrelated-image replacements. |
| Sage/CHIME/guardian | Sequence retained and deliberate living purification | Cable/cooperation/catch and literal case opening remain open. |
| Purification films | `PURIFICATION_MOVIES` maps **glitch only** to new ritual movie | Other four principal matching movies absent; old `purify_*` clips are not equivalents. |
| B1 boundary | Relevant next-kingdom teaser | Not a completed chapter2/action-parity certificate. |

`docs/combat/purification-2026-10-16/HIGGSFIELD_SCRIPT.md` retains the completed
lion's13.25s resolved outro: picture fade11.5–13.0s, soundtrack fade10.25–12.25s,
silence toEOF. Do not trim/regenerate it. Source `js/game.js:5264–5265` mutes
video; music routes separately. Encoded soundtrack fade is therefore not proof
the in-game heard ending resolves. No new listening/complete unskipped-film
certificate is claimed. Completion/skip/error/mute/stage-music return need actual
playback evidence, separate from state/cue-call checks.

## Finite infection light and purity cleanup

Current `js/infection-eyes.js` classification still makes ordinary infected
robots red and boss/Alpha/Sage purple, with null class for cured/friendly/dead/
removed bodies. `INF_EYE_LIFE:1.5` with±25% gives maximum1.875s; caps90/170/260/
320; travel minimum10px/s, grace0.1s, teleport break90px. Rendering uses actual
art transforms; world-space wisps stop birthing when travel ends and existing
ones expire. Reduced motion retains optic glow without smoke. Preserve red
hazard paint and amber tells separately from infection color.

Historical October19 scripted flier movement yielded34red/0purple wisps and
zero live after2.5simulated seconds stopped, glow retained. October18 GRAVEHORN
samples cover both facings and horned/hornless idle travel. Neither establishes
every AI pose/anatomical placement, actual-device cost or all-state reduced-motion
comfort. `PURIFY-RM-01` remains a source follow-up: world motes reduce64→18 and
flash/shake are suppressed, while fallback still draws48flakes. This is not a
reproduced comfort defect or authority to redesign its aesthetic blindly.

## Fresh execution addendum — original fixture and deterministic reproduction

The first [instrumented original roster](art/roster-before.log) exits0.
Its [actual sample](art/roster-before/result.json) randomly selects cruise cell5
in A6, both facings, optic(-14.976,+12.608) from collider center, within16.5px.
The constructor initializes `anim=rnd(0,9)`; a single random pass therefore does
not disprove October19's different-cell failure or certify the enlarged cycle.
This run does **not** reproduce the failed gate and is never relabeled as a fail.
The script owns an ephemeral server and records served indexSHA/root before
launch, rather than relying on another executor invocation's localhost.

The separate [deterministic full-cell probe](art/flier-registration.cjs) then
runs the actual renderer without advancing the simulation:8cruise+6chase cells,
both facing values, with unbanked/negative/positive bank, **84samples** total.
Animation is pinned to each cell center; velocity selects the existing bank and
the intended cruise/chase branch. It keeps the original roster's body-bound
calculation unchanged. It does not edit original test/game source, shrink the
body, change the eye map or substitute fallback pixels.

[Before result](art/registration-before/result.json),
[execution](art/registration-before.log): build`1d3a7c72250c`, exit1,
**40/84 body-bound failures**, all intended full-tier strips confirmed,
zero clipped masks and zero page errors. Unbanked cruise cell1 gives
**(-16.848,+19.160)** in both facings, reproducing the recorded~(-17,+19)
failure. Cell0 gives+21.032; banked maximum is+24.212. Complete sampled eyeY
range is+9.047…+24.212. This is deterministic staged reproduction, not the
unchanged original run's randomly chosen cell or a natural-input flight.

Opened the fresh cell1
[raw optic overlay](art/registration-before/cruise-f-1-bank0-cell1-rawOverlay.png)
and [body/collider overlay](art/registration-before/cruise-f-1-bank0-cell1-overlay.png),
plus [banked chase](art/registration-before/chase-f1-bank-1-cell0-overlay.png).
The optic crosshair is on the red head light in the original pixels. Cyan
is the unchanged collider; yellow is its original downward allowance; magenta
is the reported eye. The head/torso hang below the collider, whose upper area
mostly encloses empty pixels/wing roots. This supplies concrete same-cell
support for correcting **whole-strip registration**, not moving a correctly
attached optic or dismissing the acceptance rule as a false positive.

The rawcell is192px and the mask/overlay is300px, one image pixel per world
pixel in this second diagnostic (unlike the2× inspection overlay of the first
roster instrument). Rendered-body/eye transforms and masks are retained for all
84samples. These are actual source pixels and transform evidence, not a semantic
head mask or professional-animation approval. The producer owns the bounded
registration patch and after-build validation; before evidence alone cannot
clear integration. All earlier historical evidence remains historical. No
physical touch/pad/haptics, listened audio, sustained frame-time/memory or
whole-roster studio-quality certificate is implied.

## Corrected candidate graphics assessment — build `5b19cbfbf709`

The producer changes only the flight rectangle's common vertical origin from
square center0.50 to chest registration0.70 (`TALON_MINI_ORIGIN_Y`). Both cycles,
their authored cells/clock, common `w:3.75`, bank, eye map,26×22 collider, actor/
world scales, damage and separate perch/tell/recovery remain unchanged. The
source comment records why: chest/core are near70% of the square cell, not50%.
This is a physically justified whole-body registration fix, **not an eye-only
move to pass a collider number**.

[After deterministic result](art/registration-after/result.json),
[execution](art/registration-after.log) exit0: **84/84 original body bounds pass**,
zero intended-renderer/readiness failures, zero clipping/page errors.
Cell1's eyeY becomes**+0.440px** instead of+19.160px; complete sampled eyeY range
is**−9.222…+5.944px**. A byte comparison of every84 corresponding rawcell PNG
confirms unchanged artwork; all84 normalized eye arrays are identical. The
drawn silhouette's height differs by at most1raster pixel between registrations,
consistent with moving the same artwork onto a different subpixel phase, not
flattening or scaling individual cells.

Opened after overlays for cruise cells0,1,5 and banked chase0. In
[corrected cell1](art/registration-after/cruise-f-1-bank0-cell1-overlay.png),
cyan now intersects the real torso/core rather than enclosing mainly empty sky
above it. The magenta optic remains attached to the same authored head. Wings
and talons extend beyond the collider naturally; the entire wing silhouette is
not claimed to be a damage surface. This is stronger body-alignment evidence
than merely bringing a detached glow under a test threshold.

Opened **all18 fresh raw gameplay PNGs** in [graphics](graphics/): six exact
parent19 states facing right, six candidate states in each direction. Capture
[metadata](graphics/result.json) records both served index hashes, full-tier
asset readiness, actual actor renderer and unchanged hitbox. At**844×390**,
corrected cruise/chase retain the detailed torso/talons and broad articulated
wings beside the same hero; their body height now sits nearer the separate
hold/recovery figure at the same staged collider position. Perch/tell/recovery
are deliberately unchanged, and their material/framing differences remain
visible. No obvious new identity/placement mismatch appears in these sampled
stills. A background plate loads later in the first baseline frame; that is
not a visual improvement attributable to this patch.

**Bounded art verdict:** the whole-strip vertical registration is accepted for
the producer's frozen full validation. It corrects actual body/collision
misalignment and preserves readable motion cells. This does not approve
temporal no-pop transitions, grounded perch contacts, natural AI hit perception,
all-state pose fidelity or whole-roster studio quality. A fixed staged floating
perch and stationary hero are not observed ordinary-play bugs.

The gallery's separate scripted movement records**34red/0purple** wisps,
then**0 owner wisps after2.5simulated seconds stopped, optic glow retained**.
Zero page errors. Both facings retain red classification. This supports finite
termination under the new registration, not all animation/cure/removal/device
cases. The producer's full `infection-roster` and160-sample `foescale` results
must be reported separately; this art review does not fabricate their outcome.

### Extra scope finding — `FLIER-BANK-SCALE-20` /P2, art/QA

The84-cell diagnostic includes **banked cruise** at±0.22rad; the current
160-sample `foescale` covers unbanked cruise/chase and banked chase, not banked
cruise. Cruise cell0 at negative bank measures**73px** in both facing values,
**both before and after** registration; the existing pinned hero yardstick is
71px. Complete probe height range is36–73px before and after. This is an
additional scope/scale concern, not a newly caused size regression or an
original `foescale` failure. No same-probe hero capture or natural-input bank
encounter is claimed. Do not call every banked pose cleared by160 green samples.

Retain these actual masks/metadata. Next acceptance: include banked cruise and
the same-canvas loaded hero yardstick in scale coverage, verify the actual AI
bank range, and resolve any confirmed height-ceiling conflict without lowering
the0.5floor, raising the1.0ceiling, normalizing poses or changing hitboxes. A
wing-tip extremum must not be silently hidden by measuring only the torso.
No further runtime/test/browser edits or execution are made after the producer's
full-run freeze. This residual scope gate does not undo the separately proved
anatomical registration correction; it prevents an unsupported all-bank scale
certificate.

## Fresh full-collector opening frames — visually inspected, phone route failed

Opened **all17 newly archived raw PNGs** in
[opening-frames](automated/opening-frames/), not yesterday's images. The
[manifest](automated/opening-frames/manifest.json) records **85 captured**:
47desktop,37phone-landscape and1portrait. Only17 selected files are archived;
the other68 are hashes, not images reviewed here. Read-only SHA256 verification
of all17 archived files matches the manifest, zero mismatches. Build is
`5b19cbfbf709`. Desktop raw frames are1280×720. Phone landscape is844×390CSS,
DPR2, raw1688×780; portrait390×844CSS, raw780×1688. These are emulated viewports,
not physical-device captures.

**The full `opening-order` harness fails.** The completed
[log](automated/opening-order.log) records desktop reaching the meadow and
Servo, but the keyboard-driven phone route ends inA0 at Burst within its
240-second route deadline. Its37 captures stop at `phone-36-burst-charging`;
phone monument, Servo-off, Servo-awake and coil-return frames were **not reached**.
Those four selected names are explicitly missing, not silently represented by
desktop or historical phone shots. Readability in an earlier phone still cannot
turn that route failure into a pass. No extra browser, source/test/build edit or
rerun was performed for this inspection while the producer's collector runs.

| Fresh scene inspected | Actual visible result | Evidence limit |
|---|---|---|
| [Desktop letter](automated/opening-frames/desktop-11-note-int.png) / [phone letter](automated/opening-frames/phone-11-note-int.png), plus both `16-repair-int` frames | Large authored Ratchet/workbench/pod establish a character and workshop, and clear tutorial chips say **Read the letter** then **Restore his battery**. But his simultaneous overhead label says **E—Talk** in both offline states. | This is a real contradictory affordance, recorded separately below; not a reason to regenerate his body. |
| [Desktop board](automated/opening-frames/desktop-18-repair-board.png) / [phone board](automated/opening-frames/phone-18-repair-board.png) | Material-rich metal board, separate battery/socket, relay, colored polarity terminals/wires and copper bridge; gold selected-part border,0/4 progress, **Place Ratchet's own battery in the empty socket**, disabled Restore power. All key first-step objects/labels fit and are legible in these captures. | These are first-step states, not proof of every wire state, actual finger dragging, localized layouts or completion animation. Desktop footer supplies retry/no-timer instructions; phone frame primarily relies on the top current-step instruction. |
| [Desktop pod](automated/opening-frames/desktop-22-pod-move.png) / [phone pod](automated/opening-frames/phone-22-pod-move.png) | Explicit **Use Ratchet's pod** objective, **Use the pod—Follow the gold marker** chip, visible capsule to the right and revived Ratchet make the next target concrete. | Still does not establish first-time comprehension of save/recharge; log/dialog behavior is separate. |
| [Desktop shop](automated/opening-frames/desktop-28-counter.png) / [phone shop](automated/opening-frames/phone-28-counter.png) | First gold row **BUY THIS FIRST—Volt Pack · permanent**, price12 with12 available, explains healing/Burst and bought-once ownership; later items are subdued with **After the Volt Pack**. | The shop still is pre-purchase, not proof it was bought. The completed log separately records purchase before heal/Burst on both routes, no floor scrap pickup. Keyboard footer in this keyboard-driven phone context is not touch-control certification. |
| [Desktop charging](automated/opening-frames/desktop-36-burst-charging.png) / [phone charging](automated/opening-frames/phone-36-burst-charging.png) | Target marker sits on the winch motor, charge aura surrounds the hero, hold→let-go explanation names stopping its arm. Phone Attack control visibly has a charge ring. | Bright aura obscures some body detail. The phone route **does not complete this lesson in this run**; a readable still is not release/impact/progression evidence or a diagnosis of why it stalled. |
| [Desktop monument](automated/opening-frames/desktop-39-monument-puzzle.png) | Quiet dark modal with four large directional glyphs, **Repeat the sequence**,0/3 progress and+10IQ. Hierarchy is readable. | No fresh phone monument frame; no finger-target or demonstration-speed certificate. The modal itself cannot prove forward geography. |
| [Desktop Servo off](automated/opening-frames/desktop-42-servo-dark-cue.png), [awake](automated/opening-frames/desktop-45-servo-awake.png), [coil return](automated/opening-frames/desktop-46-servo-coil-home.png) | Distinct modeled shell/head, visor and mechanical base have comparable presence to the hero. The base reads at the ground/grass line; wake marker/label changes to Talk and visor brightens after rescue. Return visibly pays+60scrap with the ongoing marble objective and Neural Tree notice. | The log separately checks onFloor/off→awake and task. No fresh phone Servo evidence. Desktop coil item is injected before hand-in, so this does not certify the climb/acquisition side quest. Grass obscures exact foot contact; a still cannot certify gait. |
| [Fresh portrait](automated/opening-frames/phone-portrait-390x844.png) | Large centered teal rotation icon and readable **Rotate your phone to landscape** clearly cover the dim cutscene. This captured state now has useful guidance rather than the previous cropped unguarded reader. | Corroborates this visible emulated orientation guard, not all states, every rotation timing or physical touch devices. It does not rescue the later failed phone tutorial route. |

### `NPC-LETTER-LABEL-20` /P2 — offline Ratchet is labeled “Talk”

**Observed fresh in desktop and phone letter/repair approach captures**, and
source-inspected: `js/game.js:12884` defaults NPC proximity labels to `t('talk')`;
the override `opNearLabel` in `js/opening.js:469` handles only switched-off
Servo. Consequently the correct current chip (**Read the letter** / **Restore
his battery**) competes with an overhead conversational label before Ratchet
has power. The control is the same, but the implied action and story state
are inconsistent during the owner's most sensitive onboarding sequence.

Smallest accepted fix: make the proximity label resolve through the same active
Ratchet opening stage/objective, localized and filled with the current keyboard/
pad/touch binding; letter, battery retrieval/restore and live conversation must
not share a misleading default. Verify approach at each stage, including after
reload, and keep real interaction behavior/own-versus-spare battery semantics.
Do not introduce a second prompt system or hide the objective chip merely to
eliminate the contradiction. No fix is claimed in this frozen build.

The turquoise glow around the protected/offline Ratchet in these frames is not
by itself proof he is powered or a new eye-light defect: the protective marble
is allowed passive light. The issue above is the concrete **Talk wording**;
do not alter his pendant or regenerate artwork based on that inference.

**Final opening art boundary:** fresh frames support readable repair materials,
clear permanent-pack hierarchy and a characterful, grounded-looking purposeful
Servo on desktop; portrait guidance is visibly present. They do not certify
the phone opening, uninterrupted chapter, actual touch/pad/haptics, every cave,
all comic actions or a resolved heard cinematic. The failed phone scope remains
an integration gate owned by the producer/UI/gameplay review.

## Closed campaign and postflight purification frames — failure retained

Static inspection only after the collector closed: opened the actual
[campaign final frame](automated/campaign-ch1/frames/009-end.png), both original
touch diagnostic frames, both settled-control frames and its `mobile-button.png`
(six images total). No new browser, code/test/build change or artwork generation.
The four before/after screenshots' SHA256 values match their respective
diagnostic JSON records. Final campaign frameSHA256 is
`752e2769c36da3e5623a0b5f8f94d8b35b347a60604bc8070a9f159466c90243`.

### Actual continuous attempt: visible CV1B stall, not a completed chapter

The1280×720 final frame shows the hero upright on a small lit overhang/platform
near the center, with a bat **to her left and lower down**. The ongoing objective
is still **Find the raw marble beneath the meadow**; six lit core icons and one
unlit icon remain, with the charge ring and214scrap displayed. This is not a
death screen, forge scene, guardian encounter or completed cave reward. The
frame alone does not establish that the bat is reachable by the current attack,
that the room is physically inescapable or that a route to the right was taken.

The completed [actual route result](automated/campaign-ch1/result.json) says
**timeout at55:00, certified:false**: only opening, Servo and first-meeting
missions completed; marble/forge/passage/Sage/CHIME/freedom/chapter2 panels are
missing. The retained log repeatedly reports the hero atCV1B x896/y156 and bat
x784/y201 while the planner chooses combat/left input. Those are failed-route
observations, not authored scene completion or a certification that a human
player cannot continue. A source-predicted rightward drop is a proposed recovery
path, **not evidence of an actual escape**. Yesterday's complete chapter cannot
be substituted for this run. Current all-cave value, material acquisition,
rescue and cinematic traversal are not certified by this attempt.

### Purification touch: original offscreen button versus separate settled control

| Evidence | Visible result inspected | Correct interpretation |
|---|---|---|
| Original [before touch](postflight/purification-touch-original/before-touch.png) and [after30ticks](postflight/purification-touch-original/after-30ticks.png) | Both844×390 frames show the dark rounded canvas/letterboxed field without a visible guardian button or playable scene. | The [instrumented original result](postflight/purification-touch-original/result.json) exits1. After portrait→landscape the button rect is y472.625–520.625 and its attempted point(195,496.625) is outside390px viewport height. Touch events targetHTML, not `purification-hold`; hold remains0. No permanent black-screen product defect or general broken-touch claim follows from these staged timing observations. |
| Settled [before touch](postflight/purification-touch-settled/before-touch.png), [after30ticks](postflight/purification-touch-settled/after-30ticks.png) and [mobile button](postflight/purification-touch-settled/mobile-button.png) | Clear staged two-shot: small hero left, large purple-marked lion right, calm darkened stage, centered **Release, then hold the Free the guardian button** instruction and white/gold-edged **Free the guardian0%** button. Button fits below the actors and within the viewport. | The [separate control](postflight/purification-touch-settled/result.json) waits for actual resize/layout settlement, then draws. Button rect x305.422/y293.328/w233.109/h48; point(421.977,317.328) is inside and targets the button. Pointer becomes true; after30manual ticks hold is0.500s. This is input-state evidence, not a replay of the original execution or a natural final-hit route. |

The settled [controls record](postflight/purification-touch-settled/controls.json)
passes touch hold/cancel, blur cancellation, hidden clock and portrait blocking,
plus actual keyboard/pad/localized guidance observations. Its success narrows
the reproduction toward **resize/layout sequencing**, without repairing or
overwriting the original failed test. The diagnostic's sampling can perturb
timing; it does not prove whether an ordinary device rotation has the same
transient or its duration. The producer/UI owner must retain the original failure
and separate control and verify normal event ordering before integration.

Both settled before/after pictures still visibly read0%. Source inspection of
the observation hook shows the30manual ticks occur without another draw before
that screenshot, so these frames are **not a measured animated progress display**.
Do not turn the metadata's0.5s hold into a claim of visible31% progress, snowflake
gathering, arm raise, slash, completed film or a heard outro. Those moments are
not shown by these six images. The footage, exact authored-body motion and
physical-device acceptance gates remain separate from the now-visible staged
button and the successfully dispatched touch in the settled control.
