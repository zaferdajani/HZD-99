# CLAWBYTE senior studio review — 2026-10-17

## Release verdict

**Review branch only. No production merge or deployment. The final candidate completed a certified ordinary-input Chapter One route; full-suite, art and physical-device release gates remain open.**

This review found and reproduced an interrupted-purification save defect, corrected device-specific rescue instructions, and corrected GRAVEHORN's red eye underneath the purple boss infection layer. Existing completed artwork and the lion film/outro were preserved. No paid generation was requested.

## Pinned versions and review method

- Repository: `zaferdajani/HZD-99`; base/main/integration at intake: [`62d75d204c6f6264f25150bb419fc262ff2c18ea`](https://github.com/zaferdajani/HZD-99/commit/62d75d204c6f6264f25150bb419fc262ff2c18ea).
- Review branch: [`codex/studio-review-2026-10-17`](https://github.com/zaferdajani/HZD-99/tree/codex/studio-review-2026-10-17).
- Previous report: [2026-10-16](../2026-10-16/REPORT.md), whose evidence predates the later combat, purification, outro and lighting commits.
- Main and `claude/clawbyte-repo-migration-byhyl8` had no divergence at intake. A fresh checkout preserves unrelated files; no reset, clean, forced update or production ref write is authorized in this run.
- Pipeline and all fifteen mandates came from `docs/studio/PIPELINE.md`, `roles.json`, and the role files on main; no fallback branch was necessary.
- Three reviewer agents owned disjoint report files: six design mandates, three art mandates, five engineering mandates. Primary owned the Senior Mission Producer responsibility, fixes, validation and handoff.
- Full collector candidate: build `a2e6994d283e` (base plus device-aware purification instructions). Later bounded save/eye corrections were developed in an isolated worktree so the collector's served files could not change during its run.
- Isolated bounded-fix candidate: build `64bc72365fdf`. Consolidated clean build: `fbfa046c42b4`. [identity.json](identity.json) records source hashes. Generated pages are local validation outputs; Claude must rebuild them from the final source when integrating.
- Source inspection, staged browser assertions, staged 844×390 images, and fresh-save ordinary keyboard campaign evidence are explicitly separated. No physical phone/controller, subjective audio listening, haptic or performance certification is claimed.

## What changed since yesterday

The older report's unintegrated hatch ordering, alternate-room panel, strict campaign certificate, grapple protection and evidence-tool corrections are now present on main. Do not reapply them as though absent. New combat impact/stats/cards and deliberate guardian purification followed that report. The latest main adds softer shafts, low bound-body poses, and prevents fall/spike deaths from persisting a player-inflicted bind.

The lion's existing 13.25-second film now has its authored visual/audio fade-out. This review did not regenerate or re-edit it. Runtime movie playback is muted and music is routed separately; the encoded audio fade does not by itself certify in-game soundtrack continuity. No subjective listening or live deployment check was performed. Four other principal guardians still use explicit in-engine extraction, not new generated films. The last recorded Higgsfield failure was exhausted credits on October 16; today's review did not recheck credits or submit new generation.

## Fifteen role verdicts

| Senior responsibility | Verdict | Evidence / remaining gate |
|---|---|---|
| Cinematic Designer | Issues | Corrected hold guidance; observed ritual and film handoff in staged checks; full manhwa page parity remains open. |
| Game Designer — Player Systems | Issues | Current controls, hold cancellation, portrait/focus handling tested; fresh tutorial traversal is separately recorded below. |
| Mission Designer — Quest Craft | Issues | [DESIGN.md](DESIGN.md) cave census; CV3/GRAVEHORN ledger corrected; source purpose is not proof every cave was played. |
| Principal Encounter Designer | Issues | Main includes protected hatch ordering; full fairness/telegraph judgment requires sustained real combat. |
| Boss Designer | Issues | Lion ritual, GRAVEHORN and finite-eye tests; generic raised-blade performance and unfinished body art remain. |
| Mission Designer — Campaign | Issues | Blade → Sage → CHIME → NULLFANG, optional Alpha retained; see exact campaign result below. |
| Mission Producer | Issues | Deduplicated work, preserved production, evidence pinned; remaining release/art/device gates explicitly open. |
| Character Artist | Issues | Fresh gameplay-size before/after eyes and bound bodies; GRAVEHORN/Furnace/down-pose queues and panel defects remain. |
| Cinematic Director | Issues | Existing lion film/outro preserved; four new films, four GRAVEHORN panels and exact manhwa parity incomplete. |
| VFX Artist | Bounded fix verified; broader issues | GRAVEHORN optic now violet in idle/preparation; finite trail tests pass; all poses/physical performance not certified. |
| Technical Director — World Systems | Issues | Served-build pin and room tests; ordinary route friction must be distinguished from driver limitations. |
| Gameplay Engineer — Combat | Issues | Weighted-impact and protected-hit checks; interrupted rescue choice fix verified; art/contact feel still needs observation. |
| Gameplay Engineer — Mission | Bounded fix verified | Reproduced reload duplicates; final regression prevents early choice and duplicate retry while preserving completed reward. |
| Gameplay Engineer — NPC | Issues | Bound wolf is low and has no infection/rim; held crouch remains a placeholder, not an authored down animation. |
| Lead UI Engineer | Bounded fix verified; device gap | Dynamic keyboard/PS/Xbox labels, touch/unbound button guidance, five languages tested; physical devices unverified. |

Detailed independent reviews: [DESIGN.md](DESIGN.md), [ART.md](ART.md), [ENGINEERING.md](ENGINEERING.md). Their before-state findings remain valid historical evidence; the producer's fixed status below supersedes their earlier “pending” labels only where demonstrated.

## Findings, consequences and acceptance

| ID / priority | Finding and reproduction | Action / acceptance / status |
|---|---|---|
| PUR-SAVE-01 / P1 | Reload during lion CUT before completion, then repeat rescue. Actual persisted save changed ledger `L` to `LL`, forks 1→2, with `bossGlitch=false`. Staged initial save; reload used the actual unedited disk save. [Before evidence](engineering/ledger-interruption.json). | Fixed on review candidate: principal ritual defers choice and spoil to `onBossDead`, alongside completion flag. Exact prior mercy node by kind+room is preserved. [Regression](fixes/purification-save.json) passes interrupted/retry, completed once, legacy retry, and non-lion fallback. Existing duplicate history is not rewritten; for an old interrupted non-first guardian, prior random-spoil payment is unknowable, so the fix avoids rerolling rather than inventing compensation. |
| PUR-UX-01 / P2 | All five purification instructions hardcoded E despite a remapped gamepad. | Fixed using existing `ctlFill` plus explicit dedicated-button wording for touch/unbound pad. Keyboard F, Xbox/PS mappings, unbound, touch and five languages checked. Pointer cancellation, focus, portrait and restored-save checks remain intact. |
| GH-EYE-01 / P2 | GRAVEHORN's renderer supplied a red/amber eye despite purple infection classification. [Before](art-current/gravehorn-idle.png). | Eye-only purple correction, including transparent glow stop. Horn/nozzle telegraphs and red hazard paint preserved. [After idle](art-after/gravehorn-idle.png), [after preparation](art-after/gravehorn-phase2-tell.png); GRAVEHORN and finite-eye tests pass. Two poses do not certify every facing/phase anchor. |
| GH-BRIEF-01 / P2 | Queued GRAVEHORN plates/panel brief requested red eyes, contradicting boss policy. | Brief corrected to purple; runtime emission not baked into plates. No new asset generated. |
| QA-HATCH-01 / P2 | Real-input driver attempted DOWN/attack whenever airborne, even far from A2 hatch, suppressing navigation. Initial attempt repeatedly stalled. | Driver now navigates into hatch alignment before striking; no map, inventory, completion assertion or deadline changed. Fresh run recorded separately. One attempted interruption left an old process alive after SIGINT; both owned diagnostic process trees were then terminated and the contaminated overlapping log was excluded from certification. |
| PUR-TOAST-01 / P2 | Clean campaign still logged the combat hint “NULLFANG is reeling — hit it NOW” through the post-purification dialogue/rewards (16:09–16:29), together with rescue/cave/gift messages. [Route log](campaign-clean/campaign.log). | Open clarity issue: retire stale combat-only prompts at the deliberate ritual transition; queue aftermath rewards so each has a readable purpose. Preserve permanent unlock notifications. The [post-rescue frame](campaign-clean/frames/023-done-lion.png) also shows gift/equipment text overlapping in the HUD. This is observed log/image evidence, not a subjective audio or physical-device claim. |
| CAVE-LEDGER-01 / P3 | Cave ledger omitted mandatory GRAVEHORN before raw marble and overgeneralized quiet rescue effects. | Documentation corrected: CV3 guard precedes extraction; ordinary/Alpha cleanse distinguished from principal ritual impact. Gameplay order unchanged. |
| QA-GH-JUMP-01 / P2 validation gate | Full collector GRAVEHORN check requested a 0.25-second jump lead but sampled the action at 0.16 seconds and lost a core. Its own sweep clears at 0.30–0.52 seconds; earlier isolated final-candidate GRAVEHORN check passed. [Failing log](automated/gravehorn.log). | Open timing/reproducibility investigation. Do not silently rerun away the failed result or relax the dodge assertion. Separate sampling delay under browser load from actual charge fairness using captured frame/input timing. |
| QA-CRYSTAL-01 / P2 validation gate | The full collector failed three joined-blade throw assertions: held release did not launch, the paw was not empty, and range was zero. [Collector log](automated/crystal.log). The isolated final-candidate rerun passed and measured 211px travel. [Rerun](fixes/crystal.log). | Open reproducibility investigation. Source changes in this branch do not alter throw physics; the isolated pass does not prove this failure resolved. Capture charge/hit-stop/input state and retain both outcomes; do not weaken throw assertions. |
| FLIER-SCALE-01 / P2 visual gate | `foescale` measured the flier at 0.34× the 71-pixel hero, below its 0.5 floor. Reproduced on both the collector and final candidate, with zero page errors. [Isolated log](fixes/foescale.log). | Open. Inspect the full authored cruise/chase wingbeat at actual gameplay scale and confirm loaded-sheet identity before a bounded size/framing correction. The current fixed-pose height check is useful evidence, not a complete perceptual-size judgment. Preserve the minion-under-hero ceiling; do not merely increase global scale or lower the assertion to turn it green. |
| GH-ART / P1 art gate | Procedural rhino is visibly less detailed than hero at gameplay size; authored parts and four manhwa beats remain queued. | Open. Integrate full approved pose/part set, both facings and horn-loss phases; do not treat the eye fix as completion. |
| PURIFY-ART-01 / P2 | White raised blade is an effect over the existing hero performance, not a complete authored arm-raise/hold/slash/recovery sequence. | Open. Reuse approved sword poses, verify hand-to-hilt attachment and grounded body performance before new generation. |
| PURIFY-FILM-01 / P2 | Only lion has new matching movie; other four use in-engine fallback. | Open; no new credit attempt today. Distinct guardian-specific films and review required, preserving lion. |
| ART-5 / P2 | `m_down.webp` still depicts red boss eyes. | Open localized panel edit; preserve identity/composition and inspect at actual displayed size. |
| ART-6 / P2 | `r_cell.webp` shows lit inactive Servo indicators despite off-state story. | Open localized indicator edit, preserve lamp/battery/framing. |
| ART-4 / P3 | `passage_b.webp` anatomy remains off-model. | Open localized correction; no wholesale regeneration. |
| DOWN-ART / P2 | Bound wolves/cheetahs use flattened held poses; current main deliberately labels them stand-ins. | Open authored down/surrender and recovery transitions; current low-body/rim behavior verified in stills. |
| FURNACE-ART / P2 | Six authored move poses remain queued. | Open; preserve runtime purple eyes and approved base art. |
| PURIFY-RM-01 / P3 | Fallback has fixed gathering count/glow despite reduced-motion handling elsewhere. | Source follow-up, not a demonstrated comfort failure. Review actual reduced-motion presentation before broad changes. |

## Cave and story coverage

The complete source census is in [DESIGN.md](DESIGN.md): A5 puzzle/upgrade/quarry entry; A7 Ratchet survey and coin reward; CV1 spare core; CV1B survey pod/map/shortcut; CV2 founding log; CV3 GRAVEHORN then raw marble; GA1T refuge log; GA1 rest/return shortcut; GA1D Sage rescue/network restoration; A11 coin; A12 later dash/star; A13 Servo evidence/coin; optional A10/GA2/GA2T/GA2D Alpha/pack/cache/Sage consequences. Alpha is not a lion-den prerequisite.

A raw marble must precede the forged white sword; Blade → Sage → CHIME → NULLFANG remains the route. A named reward and valid exit in source cannot establish that a player noticed, understood or enjoyed a cave. The fresh campaign's actually visited rooms and incomplete objectives are recorded in its result, not inferred from the census.

### Final-candidate ordinary-input walkthrough

[Certified result](campaign-clean/result.json), [timestamped route](campaign-clean/campaign.log), and [runner exit 0](campaign-clean/runner.log) belong to build `64bc72365fdf`. Fresh browser storage, difficulty row 0 (easiest preset; disclosed assist), keyboard/UI input, no injected inventory/flags/position, no restored segment, no developer stop. Duration **17:00**, two deaths, zero page errors, all nine missions complete, all sixteen required manhwa beats seen in order with none missed. Video recording was explicitly disabled for this run; 26 numbered frames and actual pod/mission saves are retained. Scripted ordinary-input traversal is still not a human playtest.

1. Wake in W1, cross the bay/gate, reach the letter and battery drawer, solve Ratchet's repair, and receive the forward objective. Visit the pod and restore Servo; meet NULLFANG before entering his later fight.
2. Open the A2 hatch and A5 route into CV1; use CV1B's survey/map pod, cross CV2, fight GRAVEHORN in CV3, and recover raw marble. Return to Ratchet and forge the white sword.
3. Return through the cave route and GA1T to GA1D. The first Sage attempt causes the second death; the uninterrupted session respawns at CV1B and retries successfully. The restored Sage explains CHIME's role and directs the climb.
4. See NULLFANG's break, recharge at A3, climb via A8 to A9, and silence CHIME. Return to the enclosure with the earned sword and completed prerequisites.
5. Fight NULLFANG, perform the release-and-hold purification action, return from the cinematic to restoration dialogue and rewards, see the freedom panels, and reach B1's Chapter Two teaser.

Eight driver `STUCK` events recovered through ordinary input. They are recorded route friction, not proven player-blocking geometry defects: A0, A1, A5, GA1T, A2 and A9 exits need targeted human readability/navigation review. The source census's optional Alpha/A10/GA2 branch, GA1 rest branch, and A11–A13 side rewards were not all traversed by this mandatory-route run. Do not claim every cave or a complete touch playthrough from this certificate.

## Manhwa, animation and visual evidence

[ART.md](ART.md) contains the beat-by-beat manhwa and animation/VFX matrices. Wake, letter, repair, cave, marble, forge, passage, Sage, CHIME, rescue and teaser have mappings; GRAVEHORN's four new story images remain absent. Presence and trigger tests do not certify all page actions, composition or readable pacing. No exact-parity claim is made.

New staged gameplay-size captures show A2's floor pool and subdued disabled wolf, GRAVEHORN before/after eye correction, and purification. Main's light shaft has softer sides and a broad floor pool, but visible banding remains a quality limitation. Finite red/purple trail behavior is tested separately from these stills. The existing `extract.png` capture is a gathering moment, not proof that every extraction beat was photographed.

The restored-lion movement check now has [live staged evidence](restored-motion/result.json): eight elapsed-time samples, x 568.81→795.01, all 24 `beastStudioStalk` cells observed, no infection class and no page errors. [Final frame](restored-motion/walk-7.png) shows the golden walking actor at gameplay size. The initial setup paused in restoration dialogue; its [diagnostic result](restored-motion/diagnostic-dialog-paused.json) is retained and excluded. The corrected fixture dismisses dialogue with ordinary Enter presses before sampling. This verifies resumed animation, not every foot contact, facing, or uninterrupted rescue-to-walk sequence.

Fresh [combat-render measurements](combat-current/visual/result.json) on collector build `a2e6994d283e` record the staged wolf's white pixels increasing 15→1,798 on hit, then receding; particles expire to zero under a cap of 80. The fixture records normal/charged power 12/38 and 5/14 hardware particles, plus 0.12-second hit-stop and -90 recoil. [Before](combat-current/visual/before.png) and [impact](combat-current/visual/during.png) show the isolated renderer, not a complete encounter or subjective sound/haptic evaluation. The [ordinary-keyboard staged combat check](combat-current/input/result.json) is separately retained. These are observations of already integrated impact work, not newly authored effects in this branch.

## Validation

The [full collector](automated/results.json) completed its requested scope and exited **1**: **190 registered harnesses attempted, 186 passed, four failed**. Build, package generation and both start/end served-identity checks passed, making **190 pass / 4 fail entries including those four infrastructure checks**. The runtime remained pinned to build `a2e6994d283e` for the entire collector.

| Check group | Outcome | Evidence / limit |
|---|---|---|
| Full collector, build `a2e6994d283e` | 186/190 harnesses pass; overall FAIL | [Full index](automated/AUTOMATED.md), [raw results](automated/results.json), [served identity](automated/served-identity.json). |
| `gravehorn` | FAIL | Late observed jump timing; earlier isolated final-candidate run passed. Unresolved, not silently erased. |
| `foescale` | FAIL, reproduced on final candidate | Flier 0.34× hero; visual acceptance remains open. |
| `crystal` | FAIL; isolated final-candidate rerun PASS | Joined-blade hold/release discrepancy; no throw-physics fix claimed. |
| Collector `campaign-ch1` | Infrastructure failure before gameplay | Playwright could not create the recording page: missing `/root/.cache/ms-playwright/ffmpeg-1011/ffmpeg-linux`. [Log](automated/campaign-ch1.log). No campaign certificate or footage exists for this attempt. |
| Final candidate `64bc72365fdf` | 10 unique registered checks PASS, 1 FAIL | Passing: purification-save, purification-controls, purification, gravehorn, infection-eyes, artbible, contrast, campaign-contract, crystal, and campaign-ch1. Failing: foescale. [Focused log](fixes/impacted-tests.log), [visual gates](fixes/visual-gates.log), [crystal](fixes/crystal.log), [flier](fixes/foescale.log), [clean campaign](campaign-clean/result.json). |
| Consolidated build `fbfa046c42b4` | 5/5 critical checks PASS, exit 0 | purification-save, purification-controls, purification, infection-eyes and campaign-contract. [Consolidated log](fixes/consolidated/tests.log). No new full-suite or ordinary-input campaign is claimed under this build ID; the exact payload/asset comparison ties it to the isolated candidate. |
| Expanded save regression | PASS rerun | [Save regression](fixes/save-regression.log): interrupted/retry/completed/legacy/non-lion fallback; staged setup explicitly declared. |
| Restored movement / source syntax | PASS within stated scope | [Movement](restored-motion/result.json), [eight edited JS files parse](fixes/syntax.json). |

The final candidate's clean 17-minute campaign ran with `CAMPAIGN_VIDEO=0`; this avoids the missing encoder and retains frames/logs/saves, not full footage. There was no full 191-harness rerun on the later candidate (the added save regression brings its registry to 191). Claude must run the full suite on the reconciled integration build. The consolidation comparison found an unreferenced temporary music-copy residue in the isolated worktree that affected the build digest without entering the music manifest. All 694 runtime assets match, and all four pages are byte-identical after normalizing only BUILD_ID. [Exact comparison](fixes/consolidation-identity.json). No residue is included in the branch. No mixed candidate is represented as one clean full-suite pass.

Commands run:

```sh
npm ci
CHROMIUM_PATH=/tmp/clawbyte-browser python tools/studio/audit.py --profile full --output docs/studio/runs/2026-10-17/automated
# Isolated final candidate:
node build.cjs
CHROMIUM_PATH=/tmp/clawbyte-browser node tests/run.cjs purification-save purification-controls purification gravehorn infection-eyes
CHROMIUM_PATH=/tmp/clawbyte-browser node tests/run.cjs purification-save
CHROMIUM_PATH=/tmp/clawbyte-browser node tests/run.cjs artbible contrast campaign-contract
CHROMIUM_PATH=/tmp/clawbyte-browser node tests/run.cjs foescale  # exit 1
CHROMIUM_PATH=/tmp/clawbyte-browser node tests/run.cjs crystal   # isolated exit 0
CHROMIUM_PATH=/tmp/clawbyte-browser CAMPAIGN_OUT=docs/studio/runs/2026-10-17/campaign-clean CAMPAIGN_VIDEO=0 node tests/run.cjs campaign-ch1
```

One initial fix-test invocation named nonexistent `braid`; runner rejected it, no tests were counted. The corrected invocation used registered harnesses. An expanded fallback regression initially read lazy `save.braid` before creation; the fixture now uses production `braid()` and retains its assertions. No gameplay assertion or deadline was relaxed. The new save regression defaults to ignored `tests/out/purification-save`, preventing future runs from overwriting this dated report; `PURIFICATION_SAVE_OUT` remains available for explicit evidence collection. Campaign driver alignment ordering was changed before the collector reached campaign-ch1; built game bytes remained pinned. Earlier [interrupted/mixed diagnostic attempts](diagnostics/README.md) are not clean-run evidence.

## Integration handoff

Use [CLAUDE_PROMPT.md](CLAUDE_PROMPT.md). Review and integrate only the bounded source/docs/tests changes against latest main/integration, rebuild all pages/packages, run final full checks, and finish outstanding art/device/story gates. This run grants no production deployment authorization.
