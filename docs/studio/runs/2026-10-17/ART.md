# Senior art review — 2026-10-17

## Scope and three verdicts

Reviewed main `62d75d204c6f6264f25150bb419fc262ff2c18ea`, the October 16 studio report, current authority/canon/event/parity ledgers, and the subsequent combat, purification, film-ending and bound-body changes. Fresh staged captures use review build **`a2e6994d283e`**, which includes the producer's device-aware purification prompt fix. They are not pristine-main screenshots. No runtime code or raster was edited by this reviewer; no new generation was requested.

| Senior responsibility | Verdict | Evidence |
|---|---|---|
| Character Artist | Issues | Fresh 844×390 A2 and GRAVEHORN captures; current purification captures; retained panel defects; missing authored GRAVEHORN, Furnace and bound-body poses. Completed hero/pack/Alpha/lion/crystal/sword work preserved. |
| Cinematic Director | Issues; lion ending improved | Shipped lion outro source/media evidence and closing contact sheet; current generated-film and in-engine-fallback screenshots; current event map and unresolved per-page parity ledger. Four new guardian films remain unavailable. |
| VFX Artist | Issues | Finite-trail source contract intact; current bound-body cleanup and GRAVEHORN eye classification captured. GRAVEHORN still renders a red emitter beneath a purple infection classification. Full moving-pose/device/performance certification is not supplied by these stills. |

This review does **not** certify an uninterrupted campaign, physical mobile, listened audio mix, haptics or professional animation quality. See the producer's aggregate test results for the complete run; this document does not presume pending tests pass.

## Fresh visual evidence

`art-current/capture.cjs` starts a local server and Chromium in one process tree, warms current media and renders the actual game at 844×390. It deliberately injects save facts, camera/actor placement and boss states. `capture.json` records build identity, state observations and zero page errors. Camera framing is staged and does not prove ordinary exploration framing. The temporary capture script typo `ghDraw` was corrected to the actual `drawGravehorn` before the final successful capture; it was a harness error, not a runtime defect.

| Capture | Observed at displayed size | Limit |
|---|---|---|
| [A2 live](art-current/a2-live.png) / [bound](art-current/a2-bound.png) | The active wolf reads against the backdrop. The bound body is substantially lower, loses its bright rim and has a gold interaction marker. The shaft spreads into a floor pool. | Bound state is injected; this does not prove which combat/environmental events bind an enemy. The low pose is a transformed held crouch, not a newly authored breathing animation. Shaft bands remain perceptible; this is a polish observation, not a reproduced progression fault. |
| [GRAVEHORN idle](art-current/gravehorn-idle.png) / [phase-two tell](art-current/gravehorn-phase2-tell.png) | Large readable rhino silhouette, but flat procedural construction compared with the detailed hero. Red/pink optic remains visible in both images. | One idle and one kick-preparation pose are not complete move coverage. Atmosphere/room grade contributes to final colour; the conflicting red source is independently confirmed below. |
| [Hold](art-current/prompt.png), [gather](art-current/gather.png), [fallback](art-current/extract.png), [touch](art-current/mobile-button.png) | Deliberate action is legible; snow-like particles converge on a bright upright blade; touch button remains visible at landscape phone size. | These are fresh producer-run staged purification harness outputs, copied from their historical output path. The file named `extract.png` actually shows the gathering portion of the fallback and is **not** proof of extraction direction. |
| [Generated film](art-current/movie.png) / [restored](art-current/restored.png) | A real lion movie is present; stage guardian is gold after completion. | Restored fixture contains a stack of progression toasts and an earlier objective because it injects an incomplete save; do not report that fixture as a reproduced ordinary campaign sequence. |

The current purification harness and controls logs under `automated/` report passes, including real MP4 advancement. That is stronger than last review's missing-browser evidence, but remains staged acceptance.

## Findings and smallest next action

| Stable ID / priority | Status and evidence | Player consequence / smallest fix / acceptance / owner |
|---|---|---|
| GH-EYE-01 / P2 | **Open, observed and source-inspected.** `js/gravehorn.js:1405–1415` starts the optic at `#ff3b2a`, blends toward amber on tells and draws its own glow; `infEyeMark` reports the same actor as purple. `art-current/capture.json` confirms class `purple` and the renderer's red literal; images show the red/pink optic. | Boss colour language conflicts with owner rule. Change eye emission only to the shared purple language; keep hazard paint, missiles and nozzle heat distinct. Capture both facings, phases, horn-loss, charge/toss/kick and motion trail; test cleanup. Character/VFX + combat renderer owner. The production brief is being corrected separately by producer; a brief correction alone does not fix this renderer. |
| ART-5 / P2 | **Open, unchanged.** `m_down.webp` still has red boss eyes. Source hash unchanged; archived 844×390 crop re-inspected. | Localized purple-eye correction only, preserving composition/anatomy. Reinspect actual panel after replacement; do not substitute the rejected October 14 candidate. Character artist. |
| ART-6 / P2 | **Open, unchanged.** Background Servo in `r_cell.webp` has lit optics, while `js/text-manhwa.js` says he switched himself off. This finding concerns Servo outside the booth, **not** the already-awake foreground Ratchet. | Darken only inactive Servo indicators; preserve lamp, battery, pendant and active Ratchet. Compare caption plus rendered panel. Character/cinematic. |
| ART-4 / P3 | **Open, unchanged.** `passage_b.webp` rear-view hand/limb anatomy remains inconsistent with approved hero; archived displayed crop inspected. | Localized anatomy correction against current hero references, preserve tunnel and earned single-sword timing. Character artist. |
| ART-7 / P3 | **Verification only.** `r_marble.webp` retained; no new evidence that its raw-stone/future-sword diagram misleads. | Check comprehension in normal reading. Do not regenerate on speculation. Cinematic director. |
| GH-ART / P1 art gate | **Open, visibly confirmed.** `GH_DRAW` is still the procedural fallback. Queue includes multipart rhino/phase-two art and four manhwa beats. | Produce approved identity once; rig articulated parts with floor/eye anchors and verify every state at hero-relative scale. A procedural silhouette is not delivered studio-quality character art. Character/cinematic. |
| FURNACE-ART / P2 | **Open, source.** `ART_QUEUE.md` §2bn still queues six distinctive plates; transforms of existing idle/fly/hero drawings remain. | Integrate breath, blast, spent, gather, dive and bell once; preserve no baked eye emission and runtime purple. Compare tells against recoveries, both facings. Character/VFX. |
| BOUND-ART-01 / P2 | **New queue, partial improvement observed.** `WOLF_ART.down` holds crouch cell 0, `BEAST_RECOVER.down` flattens to 0.62 height; other disabled bodies use `foeDrawDown`. Queue §2cc-ix explicitly requires `wolfDown4`, then cheetah. | Better defeated silhouette is delivered; authored lying/breathing motion is still owed. Replace stand-in with approved four-cell down strip, remove extra flattening, verify floor contact and cure transition. Character artist. |
| PURIFY-ART-01 / P2 | **Open quality gap, observed/source.** `drawPurificationWorld` draws a vertical luminous line/crossguard while the hero retains its existing body pose. Fallback similarly calls `h.draw` and overlays a blade. | White-energy effect exists, but full arm-raise→charged hold→slash→recover performance is not authored yet. Use approved single-sword pose/transition assets and verify hand-to-hilt attachment, silhouette and timing, rather than regenerating the whole hero. Character/cinematic. |
| PURIFY-FILM-01 / P2 | **Partly complete.** Lion film and corrected outro shipped. `PURIFICATION_MOVIES` contains only lion; four other guardians use an in-engine sequence. Production record states next Higgsfield generation rejected for exhausted credits. | Preserve lion and approved source identities; generate remaining distinct films only when service permits, never relabel fallback or reuse lion footage. Verify exact extraction direction and golden intact guardian for each. Cinematic director. |
| PURIFY-RM-01 / P3 | **Source-only follow-up.** Reduced motion suppresses runtime full-screen flash/shake and reduces world motes, but fallback film's gathering still draws 48 orbiting flakes and uses a fixed 16-pixel sword glow. | Review reduced-motion comfort in the fallback and optionally reduce orbit count/amplitude consistently; do not claim a preference violation merely from a glow. VFX/accessibility owner. |

## Animation and VFX matrix

| Family / moment | Current delivery | Review boundary / next evidence |
|---|---|---|
| Hero / pack / Alpha | Existing approved multi-pose/filmed assets retained; no duplication | Complete anticipation/contact/recovery, feet, facing and size comparison still requires motion footage, not this roster. |
| Rescued lion | Gold filtered presentation and existing follow/gait routes; new purification sequence | Grounded stop/start walking and no sleeping slide need continuous footage. A `petWalk` flag or still is insufficient. |
| Bound wolf / cheetah | Flattened held crouch / coil fallback | Capture authored down loop once supplied; verify head/feet and transition into friendly motion. |
| GRAVEHORN | Procedural articulated body and authored move logic | Missing production parts/panels; current red source eye conflicts purple overlay. Add to full eye-pose harness (existing guardian list omits `horn`). |
| Furnace | Existing body plates transformed for several newer attacks | Six queued distinct poses remain required. |
| Normal infected | Red runtime eyes and world-space trails | Verify every pose/facing anchor; ordinary stop needs smoke to finish, not remain forever. |
| Bosses / Alpha / Sage | Purple classified eye/trail system | Classification alone cannot guarantee rendered eye colour when a renderer supplies its own red glow. |
| Trail life / cleanup | Source caps low/mid/high/ultra 90/170/260/320; life 1.125–1.875 seconds; 0.1-second travel hold; 10 px/s emission threshold; 90 px teleport break | `infEyeClass` excludes disabled, purified, tamed and rescued. A2 bound capture confirms disabled class null. No new moving/expiry film from this reviewer; use producer's runtime test logs and retain physical-device/performance gap. |
| Room / cure cleanup | `loadRoom` clears pool; ritual restoration clears boss owner; ordinary existing wisps age naturally after cure | Verify no re-emission, zero survivors after lifetime, room transitions and both reduced-motion settings. |
| Light shafts / contrast | New shared soft shaft, wide halo/floor pool; enemy rim feathered; disabled bodies omit rim | Actual A2 screenshot is improved but banding remains visible. Do not change global contrast thresholds to hide quality problems. |
| Lion film ending | Encoded 13.25-second asset with final shot, picture fade 11.5–13.0 and soundtrack fade 10.25–12.25 | Archived ending sheet and decoded luma/RMS evidence inspected; no new subjective listening or live-site verification by this reviewer. Runtime plays movie muted and uses separate music routing, so baked-audio fade alone does not certify in-game soundtrack continuity. |

## Manhwa parity matrix

| Beat | Present mapping / source | Remaining parity gate |
|---|---|---|
| Sleep / electrical wake / service bay / gate | `PANEL_SEQ` and event ledger; current canon keeps sleep as survival reason | Per-page cradle/lamp/prop actions still require exact scene evidence, not panel insertion alone. |
| Letter / own battery / repair / Ratchet | Existing battery/repair panels, gradual text and explicit input handling | Match installed-cell geometry, hand actions and narrator timing to normal play. |
| Spare cell / Servo | `r_cell` scene and distinct spare-cell rule | ART-6 off-state drawing discrepancy above. |
| Cave / raw marble / forge | Existing `r_marble`, raw-marble art and forge progression retained | Raw material before sword; meaningful discovery/return route and character agency require uninterrupted traversal. |
| Maintenance passage / Sage / CHIME / lion | `passage_b`, `m_down`, break/CHIME/free sequences | ART-4/5; physical staging must match. No automatic full-page parity certification. |
| GRAVEHORN | Quest/fight exists; four new story images still queued | Intro, identity speech, phase-two reveal and retreat need matching art and in-game states. |
| Guardian purification | New deliberate ritual, lion film, gold return | Exact hero raise/slash attachment remains quality work; other four generated films missing. |
| Chapter-two teaser | Existing relevant teaser panels retained | Verify transition timing and progressive captions in ordinary route; full chapter-two art is not delivered by a teaser. |

`docs/story-draft2/GAME_ART_PARITY.md` and `docs/COMIC_PARITY_AUDIT.md` explicitly retain incomplete page certification. These older ledgers are gap registers, not proof that newly implemented behavior is still absent. The producer should reconcile them against fresh behavioral evidence before closing a page.

## Stable source identity

These originals remain byte-identical to the prior review, so the existing art findings were carried without duplicate generation:

| Asset | SHA-256 |
|---|---|
| m_down | `c65be806cf5fdc6b005d551504625dd0d38ffec4f7afcb260205f2a45930acaa` |
| r_cell | `800ab5ba11aab84cbf7a13e8a38d6c37acc924505558df945e76b490362c98c4` |
| r_marble | `82f68a235fad9e1de0b559c90c8d295a71fcfa6857fb8dbe1f67e4ae01fce410` |
| passage_b | `9ca50c2cbeb05b9769a5d11d360bf0ae9a1792ceb8bc02b9ad15d86995944203` |

The October 16 report prepended an erroneous `b` to the passage hash; this is a documentation correction, not an asset change.

## Follow-up inspection — bounded GRAVEHORN correction

The producer prepared a separate fixed candidate, build **`64bc72365fdf`**, without disturbing the running full-suite candidate. Its `art-after/gravehorn-idle.png` and `art-after/gravehorn-phase2-tell.png` were visually inspected at the same 844×390 size and framing as the before images. The optic is now visibly violet in idle and phase-two preparation. Red hazard paint and hot nozzle/vent colours remain; the broad procedural shape and missing authored-art gate are unchanged.

The actual source diff changes only the eye colour and its transparent gradient stop in `drawGravehorn`; its eye no longer blends toward amber during wind-up, while horn/nozzle telegraphs retain that signal. `art-after/capture.json` records the unchanged purple class, eye anchors and zero page errors. **GH-EYE-01 is corrected in the separate candidate and visually verified for these two staged poses, pending the producer's affected-test/integration gate.** The earlier finding above remains the truthful before-state of build `a2e6994d283e`.

Capture metadata caveat: `rendererSource` tests whether the entire renderer contains the red literal, which remains legitimately present for nozzles. Its `true` value in the after JSON is **not** evidence that the eye correction failed. The eye-specific source diff and comparable images establish the bounded correction; full move/facing/trail coverage still requires the targeted tests.
