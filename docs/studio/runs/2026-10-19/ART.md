# Senior art, cinematic and VFX review — 2026-10-19

## Scope and separate role verdicts

Intake: main and integration `62d75d204c6f6264f25150bb419fc262ff2c18ea`;
candidate inherits October 18 review `69640ed83d72d451cfb6f0b59fafb2c029cc5802`.
The review branch is `codex/studio-review-2026-10-19`, not a production deployment.
Authority, complete CLAUDE/ART_BIBLE, story canon, studio pipeline and the three
role mandates were read. Current source, production queues, event/parity ledgers,
October 18 report and flier diagnostic were compared. This reviewer edits only
this document: no runtime edits, build, browser, test execution or generation.

| Senior role | Verdict | Evidence boundary |
|---|---|---|
| Character Artist | Issues; flier integration held after failed eye-placement gate | Original assets, six October 18 images, six fresh candidate extrema and all 18 fresh before/after state frames inspected. Candidate body readability improves, but `infection-roster` now fails an anchor/body bound. Stills cannot clear that gate. |
| Cinematic Director | Issues | Current sequence/film registry and parity ledgers inspected. Lion's completed ritual/outro remains unchanged; four principal ritual movies and GRAVEHORN's four panels are not delivered in this registry. No new subjective listen, frame-by-frame movie review or exact page parity certification. |
| Senior VFX Artist | Issues; finite sample passes, placement gate fails | Current source, fresh red optics and manual-travel/stop result inspected. Full collector reports flier below-body proxy bound failure. Integration held pending exact-cell/head-pixel reconciliation; all-pose and physical-device certification remain absent. |

## Delta and deduplication

At this review's source intake, relevant flier, eye, purification and panel code
matched the inherited October 18 candidate. No completed image or movie needs
regeneration to address the loaded-flier issue. Existing hero identity, wolf/Alpha
motion, rounded marble, single/dual/joined swords and gold lion film must be kept.
October 17 save/prompt/purple-rhino fixes and October 18 notice/script corrections
are inherited candidate changes, not proof they reached main.

Fresh hash reads confirm these exact unchanged assets:

| Asset | SHA-256 |
|---|---|
| `assets/manhua/ch1/game/m_down.webp` | `c65be806cf5fdc6b005d551504625dd0d38ffec4f7afcb260205f2a45930acaa` |
| `assets/manhua/ch1/game/r_cell.webp` | `800ab5ba11aab84cbf7a13e8a38d6c37acc924505558df945e76b490362c98c4` |
| `assets/manhua/ch1/game/passage_b.webp` | `9ca50c2cbeb05b9769a5d11d360bf0ae9a1792ceb8bc02b9ad15d86995944203` |
| `assets/video/purify_glitch_ritual.mp4` | `99674f514b052e53fc57bb006acdf69f69430d83c91d5a9ea0bca85bb1b60e04` |

## FLIER-SCALE-01 — loaded strips and a bounded candidate

**P2, character/QA owners.** October 18's traced diagnostic directly measured
fallback at 56px / 71px hero, then loaded `talonMiniCruise8:5` at 24px / 71px
(0.338). Its full-suite scale result was 0.79; fallback explains that pass as an
inference, since the old harness did not trace its renderer. Retain both outcomes.
`tests/foescale.cjs` waits for hero readiness but not the intended enemy art. An
unloaded substitute must not certify the final enemy's presentation.

Current source: `drawFlierMini` in `js/entities.js`; `TALON_MINI` gives cruise and
chase the same `w:2.42`. These are **cell-height multipliers in hitbox widths**:
`sh = e.w * T.w`. Authored cruise is 1536×192 (8 cells); chase is 1152×192
(6 cells). Both are square 192px cells. `EDRAW_ROBO.flier=0.96` and collider
26×22 are separate. Perch uses its own `e.w*2.3` square; tell/recovery use
`egFigA`, with `(e.w*3.2)/532` scale. These branches must not be changed globally
to compensate for empty pixels in the two flight strips.

All six [historical gameplay composites](../2026-10-18/flier-diagnostic/) were
reopened at their recorded **844×390** size, alongside the original cruise,
chase and perch sheets. The flight is genuinely articulated across a wingbeat;
the flat-wing poses look low and wide, not frozen. Nevertheless, the small core
body and thin legs/details have much less visual mass than the hero. Increasing
only one short frame is wrong, but a common flight-strip calibration is a
reasonable presentation trial rather than missing-asset generation.

Historical measurements from the actual rendered 80-sample diagnostic:

| Loaded cycle | Height | Width | Alpha>24 area | Hero |
|---|---:|---:|---:|---|
| Cruise | 23–43px | 46–59px | 755–825px | 71px tall, 49px wide, 2356px area |
| Chase | 23–39px | 39–60px | 725–834px | Same pinned authored idle |
| Banked chase | 25–41px | 40–61px | 731–841px | Same pinned authored idle |

**Recommended experiment, not yet a verified fix in this art subsection:** a
constant **1.55× only on loaded cruise/chase**, `2.42 → 3.75`, preserves the
relative wing silhouettes and does not rescale the hero, hitbox, atlas fallback,
perch or guardian figures. Analytic predictions, **not new measured pixels**:
roughly 36–67px tall, 60–95px wide and 1742–2020px opaque area (74–86% of the
hero area). This suggests improved body weight while the tallest wing remains
under the 71px hero yardstick. Rasterization/banking can differ; numbers alone
cannot approve the result. Wider wings than the hero are normal anatomy, not a
reason to squeeze the bird horizontally. Reject per-cell/pose normalization,
global `EDRAW_ROBO` boosts and lowered scale-test thresholds.

Acceptance for the producer's fresh trial:

1. Trace full-tier intended cruise/chase assets and hero yardstick before measuring;
   fail closed if absent. Retain cold/fallback traces separately.
2. Sample complete cruise/chase beats and both-facing banks, not one low frame;
   preserve wing-shape variation and report width, height, area and clipping.
3. Compare flight→tell→dive→recover→perch at gameplay size for core-body scale,
   eye position and no excessive pop. Separate strip and figure source framing
   is a risk; a flight fix is not all-state animation certification.
4. Hold hurt/telegraph/cure/reduced-motion states separately. Red eye overlays
   must remain on the optic under the enlarged transform, not the old center.
5. Keep exact artwork bytes, collider, damage/range and other-world behavior.
   Source-only presentation needs no new lowres artwork, but rebuild/package/test
   the same output and pin its served identity.

## Remaining authored-art and motion gates

| Stable finding | Current evidence / consequence | Smallest accepted completion |
|---|---|---|
| GH-ART / P1 | `ghPart`/`GH_DRAW` procedural multipart fallbacks remain; §2bf queues the approved rhino parts/phase two and four panels. Flat fallback fidelity does not match the hero. | Integrate the one reviewed physically rendered rhino identity, articulated parts and matching panels; inspect all attacks/facings, horn detachment/return, phase two and hoof contacts. Do not add bloom to disguise missing authored surfaces. |
| BOUND-ART-01 / P2 | `WOLF_ART.down` holds crouch cell0 and `BEAST_RECOVER.down` uses `ky:0.62`; missing `wolfDown4`/`cheetahDown4` remain §2cc-ix. | Only the missing down/breath/transition coverage; preserve already authored walk/run/claw/bite/leap. No flattened crouch presented as a complete breathing animation. |
| FURNACE-ART / P2 | §2bn still requires six breath/blast/spent/gather/dive/bell poses. Some distinct states transform old shared figures. | Distinct approved silhouette/contact/recovery coverage and per-pose eyes, not a recolored duplicate. |
| PURIFY-ART-01 / P2 | `drawPurificationWorld` adds vertical sword/light and analytic slash to an existing hero body. | Authored arm-raise→gather hold→one-sword slash→recover with hand/hilt continuity; white gather alone is not the body animation. |
| ART-5 / P2 | Unchanged `m_down` panel's red boss eyes conflict with purple runtime infection. Historical full-panel visual inspection retained. | Localized purple optic correction only; preserve lion anatomy/composition. |
| ART-6 / P2 | Unchanged `r_cell` background Servo indicators are lit although he shut himself down. Foreground awake Ratchet is not the error. | Darken only inactive Servo indicators. |
| ART-4 / P3 | Unchanged `passage_b` hero anatomy differs from approved paws/one-piece arms. | Localized identity edit using current canon and earned single-sword timing; preserve tunnel scene. |
| ART-7 / P3 | No new evidence that `r_marble` diagram harms comprehension. | Preserve; test actual reader comprehension before generating anything. |

## Cinematic/manhwa acceptance

`docs/MANHWA_EVENT_MAP.md` maps `PANEL_SEQ` to wake, bay, gate, own-battery
letter/drawer/repair, marble, forge/passage, Sage, CHIME, freed guardian and B1
teaser. Source retains gradual captions, separate complete/advance actions,
deliberate skip and safe event/arrival playback. This is trigger/source evidence,
not a fresh traversal or proof every drawn interaction exists in gameplay.

| Beat | Retained mapping | Open exact-parity gate |
|---|---|---|
| Wake / gate / Ratchet | Current on-model assets and separate own-battery/spare-cell beats | Exact cradle/reaching/installation/shutter geometry and physical actions remain per-page checks. |
| Quarry / raw marble / forge | Rounded material before first sword; same causal mission | Physical carrying/manufacture/action staging and current cave captures, not found blade substitution. |
| Sage → CHIME → NULLFANG | Settled order, temporary lucidity/reinfection and distinct construct identity | Literal cable assistance, catch and CHIME case-opening remain gaps in comic parity ledgers. |
| GRAVEHORN | CV3 logic and first-soldier identity | `gh_intro_a/b`, `gh_phase2`, `gh_down` queued, not substituted with unrelated images. |
| Principal purification | Deliberate hold, gather, slash, black, film/fallback, intact friendly gold return | Only lion has the new ritual movie registry entry; four other old `purify_*` files are not the new movies. |
| Next chapter | Relevant hatch/conduit/keeper/talons teaser | Teaser is not a completed drawn chapter two or full spoilers approval. |

Keep `docs/story-draft2/GAME_ART_PARITY.md` and `docs/COMIC_PARITY_AUDIT.md`
as gap ledgers, not stale-proof certainty. Close exact pages only with runtime
room, state, asset keys and actual capture. Gameplay and current script must
match sleep-based survival, protective pendant, own battery, purchased pack,
raw marble forged into first white blade, optional Alpha and earned later modes.

The lion movie SHA above preserves the existing **13.25s** resolved ending.
Historical decoded measurements place picture fade11.5–13.0s and soundtrack
fade10.25–12.25s with silence to EOF. Do not regenerate or truncate it. Runtime
`purifyPreload` mutes movie audio and score is routed separately: encoded audio
fade is not proof that the player hears a clean musical ending. Actual in-game
listening must cover completion, skip, error/fallback, mute and stage music
return. No subjective listening claim is made here.

## Eye-trail acceptance and finite termination

Current `js/infection-eyes.js` source retains red ordinary robots and purple
boss/Alpha/Sage classification; render-transform anchors via `infEyeArt`/mark;
world-space pool; 10px/s travel threshold, 0.1s travel grace, 90px teleport break;
1.5s ±25% life (max1.875s); tier caps90/170/260/320; stop/cure/dead/removal/room
cleanup; reduced motion keeps optic glow without smoke. Same canvas transform
should carry flier anchors with any strip scale, but that is a testable inference,
not all-cell proof. Hazard-red armor and amber attack tells remain distinct from
purple boss infection; never recolor the whole body to fix an eye.

October 18's four staged GRAVEHORN samples had 29–30purple/0red wisps in manual
idle travel and 0live particles after2.5simulated seconds stopped. They cover
both facings and horned phase1/hornless phase2, not natural AI/head toss/kick.
The broad `infection-poses` harness omitted `horn`; adding a still-roster image
cannot close that coverage. An apparent trail ending must be measured after
motion stops with glow retained, plus cure/no new births, teleport/camera/pause,
removal/room transition and reduced-motion behavior.

`PURIFY-RM-01` remains a source follow-up: world motes reduce64→18 and suppress
flash/shake, while fallback still draws48orbiting flakes. That is not a reproduced
comfort defect. Review actual reduced-motion playback before changing glow/count.

## Verification boundary

All October 18 pictures/tests mentioned here are historical and explicitly
linked. Fresh October 19 build/gameplay/capture results are owned by the producer's
report and will be assessed separately below when actual files are available.
No fresh game was launched by this reviewer. No all-cave route, all-pose planted
gait, physical touch/pad/haptics, listened soundtrack, frame-time/memory or
studio-quality art certification follows from source inspection or staged stills.

## Fresh candidate graphics assessment — build `1d3a7c72250c`

The producer supplied completed same-checkout captures. This reviewer opened
**all six candidate full-wingbeat extrema** in [after/flier](after/flier/) and
**all 18 state PNGs** in [graphics](graphics/): six parent-build states facing
right, then six candidate states in each facing. All are actual **844×390**
game composites. The exact parent was served for before (`7984b6ea8f08`), not
a manually guessed inverse transformation. Actor placement/state/clock/facing
are injected, so these are fresh **staged stills**, not continuous AI flight,
motion video or a normal-input chapter. Zero page errors are recorded.

The [fresh loaded diagnostic](after/flier/result.json) traces tier-3 intended
strips, not the earlier roster fallback. Hero remains 71px high / 2356px area.
Actual candidate measurements after the flight-only `w:3.75` change:

| Complete loaded beat | Samples | Height / hero | Width | Alpha>24 area |
|---|---:|---:|---:|---:|
| Cruise | 32 | 36–67px / 0.507–0.944 | 71–93px | 1822–1975px |
| Chase | 24 | 36–61px / 0.507–0.859 | 61–93px | 1735–2004px |
| Banked chase | 24 | 38–65px / 0.535–0.915 | 63–93px | 1735–2007px |

The pinned loaded cruise is **38/71 = 0.535**, versus the short inherited
loaded result; no sample is measurement-canvas-clipped. The 80-sample sequence
retains meaningful wing-height changes rather than normalizing cells. Core,
talons and segmented armor are visibly more legible beside the hero in the
[flat-wing minimum](after/flier/gameplay-cruise-min.png) and
[upstroke maximum](after/flier/gameplay-cruise-max.png). Wider wings read as bird
anatomy, while the tallest vertical silhouette remains below the protagonist.

**Initial bounded acceptance, before the later failed gate below:** this constant
flight-strip change was accepted for full-suite validation, not for integration.
There is no observed size/identity blocker in these
frames. The unchanged perch/hold/packet/rise presentations are also inspected:
folded perch naturally reads smaller, while tell/recovery still use the existing
different figure material/framing. They are not newly authored poses. The still
comparisons do not reveal an obvious excessive size mismatch, but cannot prove
temporally smooth no-pop transitions, planted perch contact, or dynamic hitbox
perception. The floating perch and frozen hero are deliberate capture placement,
not ordinary-play bugs. Do not expand this into a global actor/hitbox/art change.

[State metadata](graphics/result.json) now explicitly records `actorStrip`
separately from `lastGlobalStrip`. Cruise and chase name the intended talon
strips, perch names `talonMiniPerch:0`; tell/packet/recovery correctly have no
strip because their existing renderer uses `egFigA`. The global last strip is
the hero idle and must not be misreported as the enemy renderer. Both facings
retain red optic classification/visible light, with unchanged 26×22 collider.
One scripted travel sample records **34 red / zero purple** wisps; after stopping,
**zero live wisps with glow retained**. This supports finite termination under
the revised flight transform, not full all-cell/all-state cure or device proof.

This is a measured reuse/presentation improvement to completed artwork, **not a
cleared integration candidate**. It is not regenerated art, a new attack
animation, whole-roster professional-quality certification, full gameplay
validation or a deployment claim. The producer's final report owns
build/package/full-suite and continuous-route outcomes.

## FLIER-EYE-19 — integration hold after the full eye-roster gate

**P2; VFX/character/combat/QA owners.** The completed
[full-collector eye-roster log](automated/infection-roster.log) fails
`...on the body, not off in the room` for the enlarged flier. Its printed
left-facing eye offset is approximately **(-17,+19) world pixels from collider
center**, versus the test's downward bound **22×0.75 = 16.5px**. Right-facing
is printed approximately (-18,+17); this particular bound check evaluates the
left-facing sample. Other roster assertions pass: all 27 placed kinds report
eyes, red/purple classification is correct, moving smoke is present and new
wisps originate at the reported eye (flier22 frames/22births, worst0px).
These passes do not settle whether the reported eye is anatomically correct.

Source confirms a genuine acceptance mismatch to investigate, not grounds to
discard the test. `tests/infection-roster.cjs` describes its condition as within
the **drawn** extent but implements it using collider dimensions and an asymmetric
downward `0.75×height` proxy. The flight draw centers a square authored strip
on collider center; increasing its common scale expands its lower pixels as well
as its wings. Existing `assets/eyes.json` normalized flight anchors have y0.63–0.72
for cruise and0.66–0.71 for chase. `drawStripCell` passes the same actual drawn
rectangle to `infEyeArt`. This is **source context**, not proof that those
normalized points hit the head in the exact failing cell or proof the proxy is
wrong. The failed log does not retain that cell's renderer identity, opaque mask,
head-pixel overlay or screenshot. Our earlier staged cells/facings are different
fixtures and cannot fabricate the missing visual evidence.

**Current decision: hold integration of the enlarged flier until reconciled.**
Keep the failed result and the readability/finite-trail evidence together. Do not
call current art/runtime cleared, raise the16.5px allowance, exempt flier, lower
the foe-scale floor or move the light merely to satisfy a number.

Required next evidence/action:

1. Reproduce the exact failed roster state/cell with actual strip/tier, animation
   time, facing/bank, rectangle, collider and reported anchor recorded together.
2. Inspect a raw authored-cell/head-region overlay and rendered actor-only
   silhouette at that same transform. Determine whether the anchor is on the
   real optic, whether the whole body's alignment against collision is sensible,
   or whether the proxy misclassifies a correctly drawn eye.
3. If eye-map/body placement is wrong, make the smallest source/anchor correction
   and rerun original bounds plus full-cycle/readability/telegraph/contact checks.
   If a measurement-contract defect is proven instead, replace it with a stricter
   actual rendered-body/head-region check with failing-before controls (an
   intentionally off-head/off-body anchor must fail); do not add a permissive
   special case or hide the original failed run.
4. Rebuild/pin the reconciled candidate and rerun impacted eye/scale suites plus
   the required full validation. No such reconciliation or rerun is claimed by
   this document; this reviewer has not changed runtime, test or assets.

## Fresh completed opening frames — limited art/readability review

Opened **all 17 archived raw PNGs** from
[opening-frames](automated/opening-frames/), after the producer's completed
[opening-order run](automated/opening-order.log). The log reports PASS at 500.2s,
desktop and phone-emulation opening routes. The
[manifest](automated/opening-frames/manifest.json) hashes 95 captures, with only
17 image files archived here; unarchived hashes are not visually reviewed images.
Desktop uses 1280×720. Landscape phone emulation uses **844×390 CSS pixels, DPR2**,
producing 1688×780 raw screenshots; portrait uses 390×844 CSS, DPR2. The route is
keyboard-driven even in the phone context, not physical touch play. No browser,
build or test was launched for this inspection.

| Fresh paired scene | Observed presentation at gameplay framing | Boundary |
|---|---|---|
| [Desktop repair](automated/opening-frames/desktop-18-repair-board.png) / [phone](automated/opening-frames/phone-18-repair-board.png) | Material-rich metal board, distinct battery, dashed socket, relay, polarity terminals and selected-part border supply a coherent physical repair vocabulary. Both explicitly ask for **Ratchet's own battery**, show 0/4 progress and a disabled final-power button. | First-step meaning is readable; this state cannot certify all wiring states, actual finger dragging or every language. |
| [Desktop counter](automated/opening-frames/desktop-28-counter.png) / [phone](automated/opening-frames/phone-28-counter.png) | Gold first row says **BUY THIS FIRST**, **Volt Pack · permanent**, price 12, and explains bought-once healing plus Burst. Other upgrades are subordinated with “After the Volt Pack.” | Current purchase hierarchy is explicit, not the old unexplained battery. Keyboard buy/leave hints in this phone context reflect the keyboard-driven test, not a touch-binding certification. |
| [Desktop pod cue](automated/opening-frames/desktop-22-pod-move.png) / [phone](automated/opening-frames/phone-22-pod-move.png) | Large recognizable Ratchet, workbench and open pod; **Use Ratchet's pod** objective and **Use the pod — Follow the gold marker** lesson. Ivory hero separates from the warmer workshop. | Visible direction is established; new-player understanding of save/recharge effects and planted movement remain separate checks. |
| [Desktop charge](automated/opening-frames/desktop-36-burst-charging.png) / [phone](automated/opening-frames/phone-36-burst-charging.png) | Tangible winch, marked target, cyan charge envelope and hold→release instruction connect Burst to stopping a motor. Phone Attack control has a charge ring. | Bright charge covers some hero detail. A still cannot certify release timing, impact, comfort, sound or haptics. |
| [Desktop monument](automated/opening-frames/desktop-39-monument-puzzle.png) / [phone](automated/opening-frames/phone-39-monument-puzzle.png) | Four large directional glyphs, “Repeat the sequence,” 0/3 progress and +10 IQ form legible hierarchy on a quiet dark field. | No demonstration-speed/finger-target certification. The completed log separately checks east-of-booth, before-exit, within-one-screen placement; a modal screenshot alone cannot prove geography. |
| [Desktop dark Servo](automated/opening-frames/desktop-42-servo-dark-cue.png) / [phone](automated/opening-frames/phone-42-servo-dark-cue.png) | Defined modeled head/visor/body/arms/base, comparable to or taller than the hero rather than a tiny ground speck. Gold ring/marker and **Wake Old Servo** make interaction intent visible; visor is subdued. | Grass crosses contact area. Still art cannot prove collision support; the log separately records off-state arrival and `onFloor:true`. This is not a full authored waking performance. |
| [Desktop awake Servo](automated/opening-frames/desktop-45-servo-awake.png) / [phone](automated/opening-frames/phone-45-servo-awake.png), then [desktop return](automated/opening-frames/desktop-46-servo-coil-home.png) / [phone return](automated/opening-frames/phone-46-servo-coil-home.png) | Awake visor lights and **Talk** replace the wake cue. Return shows +60 scrap and a Neural Tree notice beside the continuing marble objective: visible state change and reward-associated purpose. | Log separately records spare-cell awakening and accepted coil errand. Not proof of dialogue comprehension, gait or full cave traversal. HUD/reward density remains a human-review concern, though these sampled notices are readable. |

### Portrait caveat — do not infer a passed phone layout

[Portrait frame](automated/opening-frames/phone-portrait-390x844.png) is mostly
dark and shows a right-edge **cropped fragment** of an opening panel/caption
background plus “hold the screen to skip.” It does **not** show a usable full
portrait composition or a visible rotation explanation in this captured state.
The test comment says portrait shows “rotate your phone,” but the actual still
is the evidence; the keyboard opening PASS does not establish that comment is
visually true. Reproduce portrait/rotation handling and media reflow on an actual
device before certification. This one startup frame, taken 500ms after viewport
change, does not locate the cause, establish duration or prove every portrait
scene is broken. No layout fix was attempted.

These fresh observations improve evidence for purposeful Ratchet, repair/pack
guidance, forward monument placement and a visible useful Servo. They do not
approve the entire tutorial for first-time humans, physical touch, all panels or
caves, or listened audio. **FLIER-EYE-19 remains an integration hold**: opening
screenshots neither cover nor clear that failed full-roster placement gate.
The producer owns the ongoing continuous chapter and full audit.
