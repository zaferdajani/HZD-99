# Senior art and VFX review — 2026-10-18

## Scope, versions and verdicts

Main and integration remain `62d75d204c6f6264f25150bb419fc262ff2c18ea`. This review branch inherits yesterday's `84f44587fc57fcc00d1fc40fba1a6640636fc0c7`; the saved-purification, control-prompt and purple GRAVEHORN-eye fixes are therefore **present in this candidate, not yet integrated into main**. Read authority, canon, ART_BIBLE, studio pipeline and the three role mandates, current production queues, the event/parity ledgers and October 17's report. No assets were generated, no source was edited and no build was run by this reviewer.

| Senior responsibility | Verdict | Evidence and boundary |
|---|---|---|
| Character Artist | Issues | Fresh staged 844×390 wolf/bound, both-facing/phase GRAVEHORN and purification frames plus current source/assets confirm remaining authored-art/identity gaps. Existing hero, pack, Alpha, lion, crystal and sword artwork is preserved. |
| Cinematic Director | Issues | Lion ritual and corrected ending retained; four principal-guardian ritual films still absent from the ritual registry; exact drawn-page/gameplay parity remains incomplete. No subjective soundtrack or live-site verification. |
| Senior VFX Artist | Issues / finite-trail behavior sampled | Fresh staged build `7984b6ea8f08` confirms GRAVEHORN purple-only trails in both facings/phases, hornless variants, then zero wisps after stopping. Physical-device and every attack-pose certification remain absent; GRAVEHORN is still omitted from the broad eye-pose harness. |

No full campaign, physical-phone/controller, listened-audio, haptic, frame-time or studio-quality animation certification is claimed by this art report. The producer's report owns today's aggregate behavioral results and build identity.

## Delta against October 17

There are no newly integrated art/media changes on main at intake. Yesterday's review is a branch awaiting integration, not evidence that its fixes reached production. The candidate correctly inherits its purple `#c174ff` optic and matching transparent gradient in `drawGravehorn`, and its production brief preserves purple runtime eyes separately from hazard-red armor/nozzle exhaust. Do not repeat the eye fix or regenerate completed artwork.

All three shipped panel problems below were re-opened as asset originals today. They are **current asset inspection**, not fresh gameplay screenshots. Their SHA-256 values match October 17 exactly. The lion ritual file is also unchanged (`99674f514b052e53fc57bb006acdf69f69430d83c91d5a9ea0bca85bb1b60e04`); its corrected ending must not be replaced by a fresh generation.

## Carry-forward findings and acceptance

| Stable ID / priority | Current evidence and consequence | Smallest next action / acceptance / owner |
|---|---|---|
| GH-EYE-01 / P2 | **Candidate fixed; integration outstanding.** `js/gravehorn.js` eye uses `#c174ff`, while amber remains on horn/nozzle tells. Main's older renderer remains red. | Integrate the existing bounded diff; verify both facings, phase two, horn loss, head toss, kick and moving/ending trail. Do not recolor red hazard paint or exhaust. Character/VFX + combat owner. |
| GH-ART / P1 art gate | **Open, source/assets.** `GH_DRAW` remains the procedural multipart fallback, `ghPart` selects it when a plate is absent. `docs/ART_QUEUE.md` §2bf still queues the approved design, articulated parts, phase two and four matching story panels. | Generate the one approved rhino identity through the established artwork pipeline once; archive provenance and integrate articulated parts. Inspect shoulder/hoof grounding, head/eye pivots and every attack at hero-relative gameplay size. Procedural motion passing tests does not close authored-art quality. Character/cinematic owners. |
| BOUND-ART-01 / P2 | **Open, source/assets.** `WOLF_ART.down` holds crouch cell 0; `BEAST_RECOVER.down` further flattens it to `ky:0.62`, with shallow procedural breathing. Cheetah falls back to coil. §2cc-ix still queues `wolfDown4`, then `cheetahDown4`; no such completed strips were found. | Produce only the missing down/breath cycle. Remove stand-in hold/flattening when wired; retain floor line, readable defeated posture and a coherent transition to cure/friendly motion. Existing walk/run/attack takes are not missing and must not be regenerated. Character owner. |
| FURNACE-ART / P2 | **Open, source/queue.** §2bn still queues breath, blast, spent, gather, dive and bell. Current move presentation transforms idle/fly/hero drawings; hymn and forge-bell tell share the same authored figure. | Integrate six distinct approved poses and eye anchors, preserving body identity. Compare anticipation/contact/recovery, facing, ground line and bell-vs-hymn silhouette; passing transform metrics alone is insufficient. Character/VFX owners. |
| PURIFY-ART-01 / P2 | **Open, source.** `drawPurificationWorld` overlays a vertical blade/crossguard and analytic gathering/slash on the existing hero body. Fallback calls `h.draw` and overlays another upright blade. This is not a new authored arm-raise→hold→slash→recover performance. | Use approved single-sword identity and only missing pose/transition coverage. Verify hand-to-hilt attachment and continuous body silhouette through the entire ritual at gameplay size; no unearned second sword or borrowed claw swing. Character/cinematic owners. |
| PURIFY-FILM-01 / P2 | **Partial delivery retained.** `PURIFICATION_MOVIES` registers only `glitch: purify_glitch_ritual.mp4`; brood/atlas/zero/prism use explicit engine choreography. Older `purify_brood/atlas/zero/prism` files exist, but are **not** the new owner-requested ritual movies. | Keep lion; generate only remaining four exact guardian identities when service permits. Verify white gathering, one sword, boss→blade black-red extraction, neutralization, intact golden same guardian, final resolve and fade. October 16 exhausted-credit failure is historical; this review did not recheck credits or submit generation. Cinematic owner. |
| PURIFY-RM-01 / P3 | **Source follow-up, not a reproduced comfort failure.** World motes drop from 64 to 18 and full-screen flash/shake are suppressed by reduced motion. Fallback gathering still draws 48 orbiting flakes and fixed sword glow. | Inspect actual reduced-motion fallback comfort and reduce orbit amplitude/count if needed; do not equate any glow with a violation. VFX/accessibility owner. |
| ART-5 / P2 | **Open; original visually re-inspected.** `m_down.webp` still paints the boss's two eyes red while the guardian's virus accent is purple. | Localized purple-eye edit only, preserving face/anatomy/composition; inspect rendered panel with current lion reference. Reject the previously rejected candidate rather than recycling it. Character owner. |
| ART-6 / P2 | **Open; original visually re-inspected.** `r_cell.webp` paints the small background Servo's eyes and chest indicator lit, although its caption says he switched himself off. Foreground awake Ratchet is not the defect. | Darken only inactive Servo indicators; preserve foreground Ratchet, light, pendant and gifted spare cell. Verify current caption and displayed panel together. Character/cinematic owners. |
| ART-4 / P3 | **Open; original visually re-inspected.** `passage_b.webp` has long humanoid fingers/limb treatment inconsistent with approved kitten-paw/one-piece-arm hero art. | Localized anatomy correction against the approved hero, preserving tunnel staging and earned single-sword timing; inspect actual full panel at phone size. Character owner. |
| ART-7 / P3 | **Verification only.** No new evidence that `r_marble`'s raw-material/future-blade diagram misleads normal readers. | Preserve it; test comprehension before any regeneration. Cinematic owner. |
| EYE-COVERAGE-01 / P2 verification gap | **Partly addressed by fresh staged evidence.** `tests/infection-poses.cjs` still omits `horn`; `infection-eyes.cjs` basic behavior uses wolf/Alpha/lion. Today's separate capture checks GRAVEHORN both facings, phases, hornless phase two and stop-to-zero (details below), but uses idle with manual travel, not all attack/head poses. | Retain today's four-sample evidence; add toss/kick/charge/tell/retreat early/mid/late states to comprehensive pose coverage. Do not call idle manual travel a full combat-motion test. VFX/test owner. |

## Finite red/purple eye trail contract

Source-inspected `js/infection-eyes.js` retains the requested red ordinary / purple boss classification, render-transform eye anchors, world-space particles and fixed-step aging. Tier caps are 90/170/260/320, life is 1.5 s ±25% (maximum 1.875 s), travel hold 0.1 s, minimum travel 10 px/s, teleport break 90 px. A still body stops emission; old wisps rise/expire. Cure/friendly/disabled/dead states stop new infection emission; teleport/removal/room changes clear owner/pool. `purificationRestoreStage()` clears the restored boss owner. Reduced motion keeps the glow but drops trail smoke.

These are concrete implementation bounds, not a promise that every pictured optic has correct color/anchor: a renderer can draw an independent baked/red emitter, which is exactly why yesterday's GRAVEHORN fix mattered. Existing staged trail tests measure stop-to-zero, cure/no new births, world/camera separation, teleport, removal, room change, pause, budget and reduced motion. The producer's aggregate report owns those harness results; the separate fresh capture below supports its exact four GRAVEHORN samples only.

## Fresh gameplay-size inspection — build `7984b6ea8f08`

Opened all seven actual PNG files under [graphics/](graphics/), rendered at **844×390**. [Capture script](capture.cjs) and [result.json](graphics/result.json) disclose injected save facts, room/actor placement, paused automatic animation scheduling, manual GRAVEHORN travel, phase/horn toggles and one deliberately seeded ritual-toast fixture. These are current local **staged frames**, not an uninterrupted campaign, real AI combat or production screenshots. Zero page errors were recorded. The frozen hero, stale room banner/map hint and title overlays in this staging must not be promoted into ordinary-route defects.

| Current image | At displayed size | Acceptance boundary |
|---|---|---|
| [Wolf active](graphics/wolf-live.png) / [bound](graphics/wolf-bound.png) | Active pack has a readable detailed machine-wolf shape, dark armor and red optic beside the much brighter ivory hero. Bound body is visibly chest-low and flatter, with a small gold marker and no bright infected rim. Grass/detail competes with its extremely low silhouette. | Improved defeated read is real; a held/flattened crouch still does not equal a well-authored lying/breathing performance. Transition, foot contacts and interaction readability need motion and ordinary play. |
| [Left phase 1](graphics/gravehorn--1-1-moving.png) / [right phase 1](graphics/gravehorn-1-1-moving.png) | Rhino dominates the hero in scale; full body, legs and long horns read. Eye is purple/magenta rather than the old red. Large pale pink flat surfaces, sparse lines and bright rim remain visibly less material-rich than the hero. | Color correction does not solve the authored-art gate. Do not compensate with extra bloom, whiteness or a global scale change; integrate the queued physically rendered parts. |
| [Left hornless phase 2](graphics/gravehorn--1-2-moving.png) / [right hornless phase 2](graphics/gravehorn-1-2-moving.png) | Missing horns and red-orange phase cracks change the silhouette/material cue; purple optic/trail survives both facings. | Phase/body toggles are deliberate fixtures. They do not prove missile detachment/reseat, the full transition, head toss or kick motion reads smoothly. |
| [Purification gather](graphics/purification-gather.png) | Dedicated button and 50% progress are large/readable. White upright sword/light cue sits above the hero; lion remains a detailed recognizable faceted guardian. Hero body is an existing fixture pose, not an authored arms-up ceremony. The selected boss-opening toast is absent in the resulting frame. | This frame supports prompt visibility and removal of that staged stale combat cue, not an ordinary rescue-to-film flow, every toast, all languages or an authored sword-raise/slash animation. |

The four GRAVEHORN result samples classify `purple`, report an eye anchor and **29–30 live purple / zero red particles** during staged travel. After 150 fixed 1/60-second steps (2.5 s) standing still, each sample has **zero surviving particles with eye glow retained**. This directly supports the owner's finite-trail requirement in the sampled both-facing, two-phase/horn configuration; it does not measure every attack's anchor or physical-device frame time. All four use `st='idle'` and forced world movement. The red armor/vents remain intentionally separate from infection color.

## Manhwa and cinematic parity

| Beat | Current mapping / retained delivery | Remaining exact-parity gate |
|---|---|---|
| Sleep, electrical wake, service bay, gate | `docs/MANHWA_EVENT_MAP.md`, `PANEL_SEQ`; sleep remains survival explanation | Per-page props/actions, geometry and framing need matching gameplay, not merely an inserted panel. |
| Letter, own hidden battery, repair, Ratchet | Existing distinct letter/drawer/repair beats and progressive captions | Physical hand/installed-cell actions and tutorial pacing remain separate from trigger coverage. |
| Spare cell / Servo | Distinct spare-cell purpose retained | ART-6 off-state indicators above. |
| Cave, raw marble, forge | Existing rounded marble and first-forge art retained | Raw material before weapon, meaningful cave action/payoff and reachable return; ordinary campaign evidence belongs to producer. |
| Passage, Sage, CHIME, lion | Existing reveal and relevant break/free sequences retained | ART-4/5; exact combat/binding/carrying/cable staging remains open in parity ledgers. |
| GRAVEHORN | CV3 fight/phase/retreat logic exists | Four queued intro/identity/phase-two/retreat panels lack delivered matching art. |
| Principal purification | Deliberate hold→gather→slash→black→film/fallback→gold return retained | Full authored hero performance; four generated ritual films; correct extraction direction in actual shots. |
| Chapter-two teaser | Relevant hatch/conduit/threat panels retained | Teaser is not a completed drawn chapter two. Check gradual captions, no premature equipment/spoilers and transition timing. |

`docs/story-draft2/GAME_ART_PARITY.md` and `docs/COMIC_PARITY_AUDIT.md` explicitly retain open staging/page gates, including cooperative cable and literal CHIME case-opening actions. They are gap ledgers, not proof newly implemented features remain absent. Close a page only with exact runtime room, asset keys, behavior and capture evidence.

### Lion picture/music ending

The existing production record and unchanged encoded asset retain the 13.25-second resolved two-shot, picture fade 11.5–13.0 s and soundtrack fade 10.25–12.25 s, with silence through EOF. This is **historical decoded-media evidence**, not a new subjective listen. `startPurifyCut` tags this exact asset as `authoredOutro`; the normal completed cut uses a short 0.15-second exit rather than adding the old long black hold. Skips/errors keep their normal handling; media that never ran falls back to in-engine extraction.

`purifyPreload` explicitly sets videos muted. The game routes score separately, so a baked soundtrack fade does not alone establish the music heard by a player fades/resolves correctly. Retain the owner's concern as a separate actual-game audio acceptance: observe/listen through gather, slash, extraction, peaceful last shot, fade, stage return and stage music, including skip/error/mute paths. No live or subjective audio claim is made here.

## Unchanged shipped-panel identity

| Asset | SHA-256 |
|---|---|
| `m_down.webp` | `c65be806cf5fdc6b005d551504625dd0d38ffec4f7afcb260205f2a45930acaa` |
| `r_cell.webp` | `800ab5ba11aab84cbf7a13e8a38d6c37acc924505558df945e76b490362c98c4` |
| `r_marble.webp` | `82f68a235fad9e1de0b559c90c8d295a71fcfa6857fb8dbe1f67e4ae01fce410` |
| `passage_b.webp` | `9ca50c2cbeb05b9769a5d11d360bf0ae9a1792ceb8bc02b9ad15d86995944203` |

## Evidence classification and limits

Asset originals reopened today are current inspection, while October 17 gameplay/campaign images and decoded-film measurements remain historical even where source/assets are identical. A contact sheet or rest frame cannot certify full anticipation/contact/recovery, grounded feet, all facings or frame pacing. Physical touch/controller, haptics, listened audio, performance and every cave/page are not certified by this art review. No completed asset was regenerated or replaced.

## Today's ordinary-input campaign — opening visual sample only

Inspected five **completed 1280×720 PNGs** from the producer's fresh-storage keyboard campaign while it was still running. These come from ordinary UI/input traversal, unlike the injected 844×390 graphics fixtures above. This subsection does **not** say the campaign completed or certify later caves/bosses; the final result belongs to the producer.

| Actual-route capture | Visual assessment at the recorded size |
|---|---|
| [Repair board](automated/campaign-ch1/frames/001-repair-board.png) | Material-rich metal board and distinct battery, empty socket, relay, wires and terminals give the repair a clear physical object vocabulary. The first instruction explicitly asks for Ratchet's own battery; 0/4 progress, selected-part border and no-timer/retry guidance are legible. This is a real opening UI capture, not proof of touch dragging or all puzzle states. |
| [Counter](automated/campaign-ch1/frames/002-counter.png) | The 12-scrap Volt Pack row is visibly prioritized by gold border and “BUY THIS FIRST”; its text explains permanent healing/Burst ownership. Other upgrades remain dim with “After the Volt Pack” copy. The screenshot supports current hierarchy and meaning, not subjective first-time-player comprehension. |
| [Monument puzzle](automated/campaign-ch1/frames/003-monument-puzzle.png) | Four large directional glyphs, “Repeat the sequence,” 0/3 progress and +10 IQ have a consistent dark/purple UI hierarchy. A single frame cannot judge the temporal demonstration/repeat pace. |
| [Before Servo wake](automated/campaign-ch1/frames/004-done-opening.png) / [after Servo](automated/campaign-ch1/frames/005-done-servo.png) | Servo has a distinct full robot body, grounded base, local halo/interaction ring and readable “wake Old Servo”→“Talk” affordance. At this framing he is comparable to or taller than the hero, not a tiny shapeless ground speck. The log records spare-cell seating, awakening and his cave/gantry-errand dialogue before the second frame. Map/objective notifications are also visible, so overall prompt density still merits ordinary-player review. |

The two Servo images plus current log support a purposeful visible NPC opening, not full animation quality, dialogue comprehension or physical-phone readability. No additional browser was launched and no runtime file was changed for this inspection.

### Later completed campaign frames — raw marble and rescue aftermath

Opened the following completed **1280×720 actual-route frames** as they became available; no new browser or source change was involved. They are visual evidence of these moments, not a claim that a still certifies gait, perceived responsiveness, audio or all cave branches.

| Frame | Observed current presentation / limit |
|---|---|
| [Raw marble before release](automated/campaign-ch1/frames/015-pillar-claws.png) / [acquired](automated/campaign-ch1/frames/016-done-marble.png) | The material is a large rounded white/cyan mass in host rock, not a found sword. Its very bright highlight loses much surface detail in this frame. Acquisition produces a strong circular pink/white impact and blue trail; the next objective explicitly says to bring the raw marble to Ratchet. **Remaining clarity issue:** the earlier “Claws glance off… Hold ATTACK… release beside it” toast is still readable at the same time as “ACQUIRED — raw cave marble” and “Errand ready — go back.” This is a current ordinary-route stale quarry-action cue, not the now-filtered boss-opening cue. UI owner: retire that obsolete action hint on acquisition while retaining reward/return messages; verify through real interaction rather than hiding all toasts. |
| [Sage rescued](automated/campaign-ch1/frames/022-done-sage.png) | “RESCUED” and a separate “FREED” nearby machine, cleansing rings and explicit “rescued, not destroyed” text communicate a nonlethal outcome. Objective changes to silencing the bell and gives a climb landmark. Several large messages coexist; this confirms visible consequence, not final UI-density polish or exact manhwa-body staging. |
| [NULLFANG rescued](automated/campaign-ch1/frames/027-done-lion.png) | Same faceted lion remains intact, gold and alive, in a walking-looking pose with lifted paw. Hero and guardian are separate/readable against the stage. The obsolete “hit it NOW” combat cue is absent in this actual-route aftermath frame. The two older faded messages, large full-width Glitch Fang gift line, equipment banner and next objective still create broad upper-screen text density. **One frame does not prove a planted-foot gait or rule out sliding**, and cannot certify the movie/music fade. |
| [Teaser arrival](automated/campaign-ch1/frames/028-done-teaser.png) / [last captured stage](automated/campaign-ch1/frames/029-end.png) | The Data Conduits have a distinct cool tower/cable environment; the later meadow frame retains the onward climb objective. These are post-trigger stage frames, not the manhwa teaser panels themselves or proof every page matches the game. Producer's final campaign result owns completion and panel-order claims. |

No artwork was regenerated. The fresh gold-lion aftermath supports continuity of the existing identity and rescue color treatment; missing authored performance, remaining art queues, page parity and actual-game soundtrack acceptance above remain open.

## Flier scale — readiness and full-wingbeat diagnostic

After the full collector stopped, the producer ran [flier-diagnostic.cjs](flier-diagnostic.cjs) on its own ephemeral server, with unchanged build **`7984b6ea8f08`**. Reviewed its [completed result](flier-diagnostic/result.json) and all six 844×390 gameplay-size composites. No browser, source or asset changes were made by this reviewer. This is a separate **staged renderer/asset diagnostic**, not a real encounter or alteration of the registered test's verdict.

Today's registered [foescale check](automated/foescale.log) **passed**, reporting a fully loaded 71-pixel `hzdIdle:0` hero and flier **0.79×**, with all 12 kinds inside its existing bounds. It does not record which flier asset drew. The diagnostic establishes a specific mechanism that matches the discrepancy:

| Controlled state at the same flier `anim=1.2` | Recorded drawing | Alpha-height / 71-pixel hero | Meaning |
|---|---|---|---|
| Actual immediate first read | Cruise strip absent; eagle-parts fallback absent; trace reaches `drawAtlas('flier')`, 56 px high ×58 px wide | **0.789** | A genuinely cold first draw uses the old turnaround, not the new authored flight. No cache was deleted or unloaded state fabricated. |
| Confirmed full assets, tier 3 | Trace draws **`talonMiniCruise8:5`**, 24 px high ×59 px wide | **0.338** | Loaded current art reproduces the earlier short-height observation despite the unchanged renderer/scale. |

The full check's 0.79 result **matches** the traced cold fallback; concluding it sampled that fallback is a supported inference, **not a trace captured inside that full-suite check**. Do not rewrite the recorded pass as a failure. Equally, do not certify loaded flier size merely from that pass. The diagnostic proves that asset readiness can change the measured body and that the loaded short-height case still exists.

Confirmed current flight strips: `talonMiniCruise8` at 1536×192 and `talonMiniChase6` at 1152×192, each full tier 3 and at its registered local asset URL. `EDRAW_ROBO.flier` remains 0.96; collision box remains 26×22. The hero yardstick is the same pinned loaded idle; no numerical threshold, game scale or hitbox was modified.

| Complete sampled beat | Alpha-height range | Hero-relative range | Actual game composites |
|---|---|---|---|
| Cruise, 8 cells / 0.7 s, 32 samples | 23–43 px | **0.324–0.606×** | [Shortest](flier-diagnostic/gameplay-cruise-min.png), [tallest](flier-diagnostic/gameplay-cruise-max.png) |
| Chase, 6 cells / 0.42 s, 24 samples | 23–39 px | **0.324–0.549×** | [Shortest](flier-diagnostic/gameplay-chase-min.png), [tallest](flier-diagnostic/gameplay-chase-max.png) |
| Banked chase, 24 samples | 25–41 px | **0.352–0.577×** | [Shortest](flier-diagnostic/gameplay-banked-chase-min.png), [tallest](flier-diagnostic/gameplay-banked-chase-max.png) |

At the actual displayed size, the shortest frames read as a low, wide flying shape beside the taller hero; the upstroke frames become a clearer small metallic bird. The change is real wingbeat silhouette, not a held identical image. Wingspan is comparable to or wider than the hero even where height is low; tiny body details and rim/glow compete at this scale. This is why multiplying the entire bird from a single low-wing frame would be an unverified art decision: it would also inflate wingspan, the tall wing poses and other states.

**FLIER-SCALE-01 / P2 — reproduced loaded-art/readiness acceptance gap.** Keep the existing full-suite pass and this diagnostic together. The smallest engineering follow-up is a readiness-aware test that records the actual strip/tier/cell used, fails closed on missing intended art and samples a full beat plus perch/tell/recovery. The smallest art follow-up is to judge core-body mass, width, readable silhouette and hero-relative encounter presence across those states at gameplay size before choosing a bounded presentation change. Preserve the current acceptance thresholds until a principled replacement is agreed; do not lower the floor or uniformly enlarge art simply to turn this diagnostic green. No scale fix or completed enemy-quality improvement is claimed here.

Limitations: animation clocks, velocities and positions are injected; frames are selected, not watched through continuous real AI flight. No performance, touch, all-angle, telegraph/recovery or complete loaded-roster certification is supplied by this diagnostic. There were zero page errors and no clipped measurement canvases in its completed run.
