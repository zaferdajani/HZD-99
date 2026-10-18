# CLAWBYTE senior studio review — 2026-10-18

## Decision and identity

**Review branch only: `codex/studio-review-2026-10-18`. Not integrated or deployed.**
This report is an evidence review, not a claim that the complete game, its artwork,
physical controls or sound are professionally certified.

At intake, `main` and `claude/clawbyte-repo-migration-byhyl8` both remained at
[`62d75d204c6f6264f25150bb419fc262ff2c18ea`](https://github.com/zaferdajani/HZD-99/commit/62d75d204c6f6264f25150bb419fc262ff2c18ea).
There were **no new main/integration commits** since yesterday. The new review
branch inherits yesterday's
[`84f44587fc57fcc00d1fc40fba1a6640636fc0c7`](https://github.com/zaferdajani/HZD-99/commit/84f44587fc57fcc00d1fc40fba1a6640636fc0c7)
by ancestry, preserving its save/UI/eye fixes and evidence without recreating them.
Compare [yesterday's report](../2026-10-17/REPORT.md); yesterday's source fixes are
still absent from the intake production/integration refs.

Today's new runtime patch was reproduced on inherited build `fbfa046c42b4` and
validated on **`7984b6ea8f08`**. The full collector pins the latter build's served
pages/assets; no runtime source or generated page was edited during it. Fresh
graphics belong to the same latter build. No live URL/asset verification or
production write was attempted. See [identity](identity.json) and
[served-byte evidence](automated/served-identity.json).

The main agent read repository authority, story canon, CLAUDE instructions,
pipeline and producer mandate. Three grouped senior reviewers read their own
mandates and supplied six design, three art and five engineering verdicts.
The Senior Mission Producer is the fifteenth responsibility. These are agent
responsibilities, not claims of human credentials. The explicit review-only
instruction supersedes older standing deployment directions.

## What changed today

1. **PUR-TOAST-01, bounded lifecycle fix.** `G.toast` accepts optional semantic
   scope; three guardian-opening producers tag `boss-opening`; a valid principal
   purification retires only that scope. This stops the obsolete “hit it NOW”
   instruction surviving rescue. Earned/unrelated notices are preserved, even
   when their text is identical. No translated-string matching or clearing of
   the whole notification queue. No combat power, geometry, save or input timing
   change. General aftermath notification overlap is **not** claimed resolved.
2. **SCRIPT-DRIFT-18, production-script correction.** The script now describes
   purple boss eyes, mandatory Sage-before-CHIME progression, motivated optional
   Alpha detour, deliberate release/1.6-second hold, and completion-time save.
   Existing character identities, red hazard paint, reward amounts and dialogue
   are preserved. A documentation correction does not implement new gameplay.
   The obsolete GLACIERE cast direction “on death” is also corrected to a living
   guardian rescue, matching the five-principal-guardian canon. This final prose
   correction occurred during the collector, without changing game bytes; the
   script-route check is rerun separately after it.
3. Added registered `purification-notices` regression and new source/runtime/art
   evidence. No artwork, music, voice, film or enemy moveset was regenerated.
4. **QA-IMPORT-18, bounded evidence-preservation fix after the collector.**
   `campaign-contract` imports helpers from `campaign-ch1.cjs`; the imported module
   initialized its output and erased the completed campaign's `campaign.log`.
   Output creation/truncation now runs only when the campaign is the CLI entry.
   An isolated subprocess regression fails before and passes after, preserving
   an existing sentinel log and leaving an absent output directory absent.
   The campaign certificate checks pass afterward. This does not change any game
   byte, driver input/planning rule or campaign result. No second long campaign
   was run after this test-only initialization fix.

Changed runtime: `js/game.js`, `js/entities.js`, `js/gravehorn.js`,
`js/purification.js`. Test/registry: `tests/purification-notices.cjs`,
`tests/run.cjs`, `tests/campaign-ch1.cjs`. Script: `docs/STORY_SCRIPT.md`. Previous bounded save/control/
eye/driver/documentation work is inherited, not counted as newly implemented.

The four regenerated HTML pages are included as the reviewed build snapshot,
unlike yesterday's source-only fix payload. Native package assembly was checked;
the generated `www/` folder is not committed. Claude must rebuild pages/packages
after reconciling newer source rather than manually merging generated HTML.
Harness-generated overwrites of older dated evidence are excluded from this
commit; only today's dedicated evidence and intentional source/script/test/page
changes are staged. Other unrelated local work is not included or removed.

### Before/after proof

The new regression initially ran on inherited source with a staged earned blade
and arena. Before: all three notices survived purification and retry; the
assertion failed ([actual JSON](before/result.json), [log](before/run.log)).
After: the scoped combat notice is gone, the unrelated reward and identical-worded
unscoped notice remain; retry does not revive the obsolete hint. Zero page errors
([actual JSON](after/result.json), [log](after/run.log)). This exercises production
toast and purification functions in the assembled browser game, with injected
initial setup. It is **not** a fresh-input chapter playthrough, exhaustive locale
test, or proof every boss reached its daze producer dynamically. The independent
[engineering review](ENGINEERING.md) verifies all three producer call sites.

## Fifteen separate role verdicts

| Responsibility | Verdict | Evidence and remaining boundary |
|---|---|---|
| Senior Cinematic Designer | Issues | Script/ritual continuity corrected; [DESIGN](DESIGN.md); GRAVEHORN intercuts and exact comic-action parity open. |
| Senior Game Designer — Player Systems | Issues | Battery/repair/pod/pack teaching order inspected; obsolete combat notification fixed, broader aftermath overlap not certified. |
| Senior Mission Designer — Quest Craft | Issues | Distinct source cave payoffs and optional Alpha offer; full optional-branch ordinary traversal not claimed. |
| Principal Encounter Designer | Issues | Earned blade/Sage/CHIME gates; previous dodge/throw/scale findings retained pending fresh outcomes below. |
| Senior Boss Designer | Issues | Deliberate rescue and wolf identity preserved; authored full-body purification performance still missing. |
| Senior Mission Designer — Campaign | Issues | Script now matches required road and optional Alpha; actual input certificate separately reported below. |
| Senior Mission Producer | Issues | No duplicate generation; branch inheritance/review-only scope preserved; release/art/device gates remain explicit. |
| Senior Character Artist | Issues | [Fresh gameplay-size frames](graphics/result.json); procedural GRAVEHORN and flattened bound bodies still fail fidelity goals. |
| Senior Cinematic Director | Issues | Existing lion movie preserved; four matching new guardian movies and four GRAVEHORN panels absent. |
| Senior VFX Artist | Bounded samples pass; broader issues | Four GRAVEHORN facing/phase samples emit purple only and expire; not every attack/head pose tested. |
| Senior Technical Director — World Systems | Issues | Same-build served hashes, room/source checks; no physical-device/performance certification. |
| Senior Gameplay Engineer — Combat | Issues | Existing impact/stat ledger retained; final test failures remain release gates, not rewritten assertions. |
| Senior Gameplay Engineer — Mission | Bounded inherited fix verified; broader issues | Deferred principal rescue choice/reward preserved; historical duplicate history is not rewritten. |
| Senior Gameplay Engineer — NPC | Issues | Friendly lion walking/source recovery preserved; bound surrender artwork incomplete. |
| Lead UI Engineer | Bounded fix verified; device gap | Scoped hint cleanup and inherited binding guidance; physical phone/pad and full aftermath layout unverified. |

Detailed independently written reports: [design](DESIGN.md), [art](ART.md),
[engineering](ENGINEERING.md). This consolidated report supersedes their pending
validation labels only where linked fresh evidence supports it.

## Story, caves and manhwa

The [design review](DESIGN.md) contains the source-backed causal walkthrough,
complete chapter-one cave census and panel matrix. The required journey remains
wake → own battery/repair → pod/Volt Pack → Servo → lion warning → quarry/raw
marble → Ratchet forge → first Sage → CHIME → NULLFANG rescue → B1 teaser.
Sleep, not innate immunity, explains survival; Ratchet's necklace buys time for
self-shutdown. His own battery and Servo's spare are distinct. Raw rounded marble,
not a found sword, is forged into the first cure blade.

| Cave/branch | Distinct source purpose | Coverage caution |
|---|---|---|
| A5 | Quarry entry, puzzle/upgrade, material-route landmark | Not merely a forward exit. |
| A7 | Read survey for Ratchet's errand/reward; early discovery remembered | Entering alone does not finish it. |
| CV1 | Spare core | Main-route pickups differ from random rooms. |
| CV1B | Survey/map, pod, return shortcut | Save/recharge purpose must be noticed in context. |
| CV2 | Founding evidence/log | Story payoff, not another battle reward. |
| CV3 | GRAVEHORN blocks raw marble; then extract material | Guardian soldier is not a sage to cleanse. |
| GA1T / GA1 / GA1D | Refuge log, rest/shortcut, first Sage/network restoration | Required Sage route and optional rest branch differ. |
| A11 / A12 / A13 | Coin, later dash/star, Servo evidence/coin | Not all optional payoffs certified by the main route. |
| A10 / GA2 / GA2T / GA2D | Optional Alpha, friendly world pack, cache and Pack Sage | Not a lion-den prerequisite; full input detour remains open. |

The script had reintroduced an obsolete mandatory Alpha and open-from-start bell
despite runtime gates. Correcting that source for artists prevents future
contradictory scenes. Manhwa trigger presence is not full physical-action parity:
approved identities, equipment timing, room staging and animations must match.
Existing wake/letter/repair/cave/marble/forge/passage/Sage/CHIME/free/teaser mappings
remain; GRAVEHORN's `gh_intro_a`, `gh_intro_b`, `gh_phase2`, `gh_down` are still
missing. See [ART matrix](ART.md) and [DESIGN matrix](DESIGN.md).

## Graphics, motion and finite light trails

Fresh staged captures were inspected at **844×390** rather than only enlarged
asset sheets. [Live wolf](graphics/wolf-live.png) and
[bound wolf](graphics/wolf-bound.png) show that the disabled chest is low and its
infection is removed, but grass competes with the tiny flattened silhouette.
GRAVEHORN still has pale flat planes and a strong pink rim beside the detailed
hero: the purple-eye correction is not completion of its authored part set.

[Capture script](capture.cjs) and [measurements](graphics/result.json) cover both
facings and phase-one horns/phase-two hornless configurations. Four moving samples
have **29–30 purple, zero red** particles. After **2.5 simulated seconds stopped**,
each has zero live owner particles while eye glow remains. This closes a bounded
GRAVEHORN coverage gap from yesterday; it does not exercise every charge, head
turn, horn flight, retreat or frame-rate condition. The fixture manually moves
the body and calls production eye update/draw; it is not natural AI combat.

[Gathering frame](graphics/purification-gather.png) shows readable half-complete
hold UI and no scoped combat instruction. Its frozen hero pose/banner artifacts
are staged setup, not new evidence of ordinary-route bugs.

| Area | Current state | Professional gate |
|---|---|---|
| Hero/ordinary hit impact | Existing flash, release/contact cues, finite metal parts, recoil, hit-stop and charged profiles retained | Fresh numeric checks are not subjective sound/haptic approval. |
| Wolf/Alpha | Authored animal motion and optional pack-rescue identity retained | Down/recovery pose sets remain queued; don't substitute scaling one crouch for animation. |
| GRAVEHORN | Purple idle-travel samples pass; procedural body remains | Approved parts/poses + four story panels + full attack-facing eye review. |
| Principal purification | White gather/slash/impact/black/return logic and protected reward path | Authored arm-raise/hold/slash/recover not complete; four new matching movies absent. |
| Restored lion | Historical Oct17 live samples showed all 24 stalk cells; inherited source unchanged | Today's campaign evidence is separate; no all-facing planted-foot certification. |
| Eye smoke | Finite world-space paths, movement threshold, caps, reduced-motion no-smoke behavior | Fresh full tests below; sustained phone cost not measured. |

No existing art was regenerated. Carry forward `m_down.webp` red boss eyes,
`r_cell.webp` lit inactive Servo indicators, `passage_b.webp` anatomy, Furnace's
six queued poses and the fixed-count reduced-motion fallback review. These are
localized edits/approved pose integration, not invitations to replace the hero.
The existing lion ritual/outro remains intact. Encoded soundtrack fade is **not**
proof of what the player hears: runtime video is muted and music separately routed.
No subjective listening or physical vibration certification occurred today.

Fresh ordinary-input 1280×720 captures add a separate opening/material sample:
[repair board](automated/campaign-ch1/frames/001-repair-board.png),
[counter](automated/campaign-ch1/frames/002-counter.png) and
[marble acquired](automated/campaign-ch1/frames/016-done-marble.png).
The board names Ratchet's own battery and socket; the shop visibly prioritizes
the permanent Volt Pack. The marble's return objective is explicit. However,
the pre-extraction “Claws glance off…” notice is still visible beside the new
acquisition/return notices immediately afterward. They are legible in this frame,
not overlapping into unreadability, but the old instruction is semantically stale.
This is fresh evidence for broader notice-lifecycle work, **not** a failure of
today's specifically scoped principal-guardian cleanup. See ART's separate actual
opening-frame assessment; neither these frames nor viewport emulation certify
first-time comprehension or physical-phone usability.

## Validation and uninterrupted playthrough

### Full collector — complete scope, not all-pass

[Machine-readable results](automated/results.json),
[all checks](automated/AUTOMATED.md), [served snapshot](automated/served-identity.json).
The HTTP pin covers five selected files: index/odyssey, service worker, eyes JSON
and one low-resolution image. It is not an exhaustive asset-delivery audit.
[Final disk checks](final-checks.json) show no drift in those files and the same
build ID/hash inventory for all four generated pages locally.
The collector finished **2026-10-18 09:00:02 UTC**, exit **1**:
**192/192 registered harnesses executed, 186 passed, six failed**. Build, native
package assembly and both start/end served-identity checks also passed (190/196
total recorded entries). No missing harnesses, suppressed failures or changed
assertions. `complete_requested_scope=true` is not `passed=true`.

| Failed harness | Retained observation | Separate disposition |
|---|---|---|
| [combat-impact-input](automated/combat-impact-input.log) | Held real input did not reach the 0.6-second charge threshold after the test's fixed 950ms wall hold. | Corrected-wrapper rerun also fails; diagnostic below. No damage/threshold change. |
| [mobile-platform](automated/mobile-platform.log) | Browser closed creating the second built-page context. | Initial single-process setup; separate corrected-wrapper rerun passes. |
| [winch-purpose](automated/winch-purpose.log) | CLAWBYTE assertions completed, browser closed before NOSTOS context. | Separate corrected-wrapper rerun passes both games; the original harness still failed. |
| [panels](automated/panels.log) | Desktop assertions completed, browser closed before phone context. | Separate corrected-wrapper result below; no physical-phone approval. |
| [filmflow](automated/filmflow.log) | Intro handoff picture held 0.80s against a 0.25s limit; eight shots and no-error checks passed. | A real timing assertion, not context creation or lion-outro evidence; rerun below. |
| [gravehorn](automated/gravehorn.log) | Keyboard dodge sampled at 0.178s to contact against a 0.25s minimum and lost a core; 0.30–0.52s sweep clears. | Reproduced timing gate remains open. No assertion weakening or new dodge fix. |

Fresh full passes include the new notice regression, inherited purification
save/controls, ritual, repair, story order, cave payoffs, gates, optional-wolf
contracts, body/gait and all three general eye suites. `infection-poses` still
omits GRAVEHORN, supplemented only by today's four staged samples.
**Both `foescale` and `crystal` pass today**: flier 0.79×71px hero, bat 0.61×,
12 kinds, maximum 0.9×; the purifier throw checks pass. Yesterday's flier/throw
failures are not erased. Crucially, today's separate loaded-art diagnostic
reproduces the short flier and exposes a readiness gap: the full scale pass
does **not** establish the final authored strip's scale. No flier/throw correction
was implemented. The measurements and inference boundary are below.

The initial single-process browser setup was corrected during the collector;
game bytes were unchanged. This is a complete **same-build** audit with a disclosed
environment adjustment, not one pristine all-pass environment. See
[setup](setup/README.md). No gameplay/performance claim follows from npm/browser
installation success.

### Fresh continuous chapter — passed, with friction

[Actual certificate](automated/campaign-ch1/result.json),
[intact captured route trace](automated/campaign-ch1.log),
[frames](automated/campaign-ch1/frames/) and actual game-written save snapshots.
Result **complete / certified:true**, easiest preset **0**, **25:20** wall,
**six deaths**, **12 recovered driver stalls**, **zero page errors**, all nine
missions and all 16 required story beats in order, no missed panels/order errors.
`segment=null`, `stopAt=null`: no restored segment, injected inventory/flags,
teleports, health edits or skipped quest completion. Input uses actual Playwright
keyboard events with read-only state/map observation, not human play.

The route demonstrates unique battery → repair → pod → pack → forward monument
→ Servo → warning → quarry → raw marble → forge → Sage → CHIME → lion rescue →
B1 teaser. Ratchet actually delivers the optional Alpha backstory/offer at
13:43–13:47, but that branch is not played. The run visits W1/W2, A0/A0B/A1/A2/A8,
A5, CV1/CV1B/CV2/CV3, GA1T/GA1D, A3/A9/A4 and B1. It does **not** certify every
optional cave: A7/A10/A11/A12/A13, GA1's rest branch and GA2/GA2T/GA2D remain
outside this mandatory-route certificate.

The trace retains floor/exit navigation stalls and repeated combat deaths rather
than concealing them. These are bot/route friction under this software-rendered
environment, not sufficient evidence to retune difficulty or declare human
first-time comprehension. Existing route knowledge, easiest difficulty and
read-only internal observation must be disclosed. `CAMPAIGN_VIDEO=0`: screenshots,
logs and saves only, **no complete movie or subjective audio review**.

The later `campaign-contract` import erased nested `campaign.log`, not the
collector-captured [campaign-ch1.log](automated/campaign-ch1.log). That intact
output contains the entire chronology, terminal result and zero-error count;
the actual result JSON/30 screenshots/saves also survive. The empty nested log
is retained as observed, not silently reconstructed. The fix has
[before](campaign-import/before.json), [after](campaign-import/after.json),
[CLI logs](campaign-import/) and [certificate-contract rerun](campaign-import/contract-after.log).
No browser/game run was needed to reproduce the destructive import.

[After-lion frame](automated/campaign-ch1/frames/027-done-lion.png) corroborates
the gold intact friendly guardian and absence of the obsolete combat instruction.
It does not alone certify planted gait or resolve reward/equipment density.
The actual route includes PURIFY → CUT → dialogue → free panels → teaser;
encoded media and these logs do not certify the music heard on a physical device.

### Supplementary checks and exact commands

[Supplementary command results](rerun/results.json) and
[unchanged-subset output](rerun/unchanged-subset.log): **five of six pass**, exit
**1**. Mobile-platform, winch-purpose, panels, filmflow and final script-route
pass; held-input charge still fails. Filmflow's isolated worst handoff is **0.10s**,
versus the full run's failed 0.80s. That is a timing discrepancy, not a movie fix.
The three early context failures are separately cleared under the corrected
wrapper, not retroactively removed from the collector.

**Charge diagnostic:** [actual observations](charge-diagnostic-result.json),
[log](rerun/charge-diagnostic.log), [script](charge-diagnostic.cjs), exit **0**
means collection completed, not that all original conditions passed. At the
nominal 950ms sample, measured wall delta is **1113ms**, seven observed frames,
**0.700s simulation/save time**, and **0.533s charge**, below the asserted 0.6s.
The visible PLAY actor has the actual attack binding held, 99 volts and no
hit-stop at the sample. At key-up the observer records **0.633s charge**; the
subsequent production ledger records a **38-damage burst**, versus **12** for the
normal claw, both release/contact sound calls and expired hardware particles.
Zero page errors. Slow-frame clamping (`SIM_MAX=0.1`) and input/sample scheduling
are relevant measured/source context, not a complete performance diagnosis or
proof the fixed-wall-time assertion should be weakened. No thresholds, damage,
time clamp or test waits were changed.

**Flier readiness/whole-wingbeat diagnostic:**
[data](flier-diagnostic/result.json), [log](rerun/flier-diagnostic.log),
[script](flier-diagnostic.cjs) and [art assessment](ART.md). The first natural
read finds the talon strips absent and directly traces roster-atlas fallback:
**56px** tall. After measured tier-3 readiness, the exact same animation time
draws `talonMiniCruise8:5`, **24px / 71px hero = 0.338×**, width 59px. The
1536×192 cruise and 1152×192 chase strips are loaded from their actual registered
URLs; no cache deletion, fake unloaded state, altered scale or substitute asset.

| Loaded cycle | Samples | Height / hero range | Mean height |
|---|---:|---:|---:|
| Cruise | 32 | 0.324–0.606× | 30px |
| Chase | 24 | 0.324–0.549× | 31.83px |
| Banked chase | 24 | 0.352–0.577× | 33.83px |

All 80 samples trace the intended authored strip, none is canvas-clipped, and
six 844×390 gameplay frames show minimum/maximum wing silhouettes. Root inspected
both cruise extremes; the art reviewer inspected all six. Flat wing phases look
shorter and upstrokes read taller; width and body mass matter too, so do not
blindly enlarge every pose to satisfy one vertical metric. The directly measured
cold ratio **0.789×** matches the full harness's 0.79×; that suggests its pass may
have measured fallback, **an inference**, because that harness retained no renderer
trace. The new diagnostic does directly reproduce the loaded 0.338× result.
Close readiness in the scale harness and judge the intended full cycle before
accepting or changing the artwork. No scale or asset fix is claimed today.

The diagnostic completes with zero page errors and served index bytes matching
this checkout. Embedded base64 media URLs in its JSON were mechanically compacted
to MIME, byte count and SHA-256 references, retaining asset keys/dimensions/tier
and renderer evidence. The diagnostic now does this on future saves; no image
or game asset byte was edited. Original gameplay PNGs remain.

After the full collector, the test-only import guard's regression passes (before
exit 1, after exit 0); all certificate-contract assertions pass, exit 0. Final
[source inventory](identity.json) and [nine syntax checks](syntax.json) include
that final harness edit; all seven run-local diagnostic/helper scripts also pass
`node --check`. Runtime/pages remain `7984b6ea8f08`; no second full
collector or long campaign was run after that evidence-initialization-only edit.

Main commands (all in this checkout, browser wrapper disclosed in setup):

```sh
npm ci
CHROMIUM_PATH=/tmp/clawbyte-18-browser/run.cjs CAMPAIGN_VIDEO=0 \
  PURIFICATION_NOTICES_OUT=docs/studio/runs/2026-10-18/automated/purification-notices \
  PURIFICATION_SAVE_OUT=docs/studio/runs/2026-10-18/automated/purification-save \
  python tools/studio/audit.py --profile full --output docs/studio/runs/2026-10-18/automated
CHROMIUM_PATH=/tmp/clawbyte-18-browser/run.cjs \
  node docs/studio/runs/2026-10-18/post-checks.cjs
CAMPAIGN_IMPORT_OUT=docs/studio/runs/2026-10-18/campaign-import/after.json \
  node docs/studio/runs/2026-10-18/campaign-import-regression.cjs
node tests/campaign-contract.cjs
node docs/studio/runs/2026-10-18/collect-evidence.cjs
```

`post-checks.cjs` records exact child commands, logs and exit codes; it waits for
the full collector's finished marker and starts no competing browser during the
chapter. Source/documentation whitespace checks exclude raw logs, whose original
trailing spaces are retained. No physical touch/controller, vibration, listened
audio ending, sustained device performance, all-optional-cave traversal or full
manhwa action/art parity certification occurred.

## Findings and integration gates

| ID / priority | Status today | Acceptance / owner |
|---|---|---|
| PUR-TOAST-01 / P2 | Scoped stale combat hint fixed and staged-tested | UI/combat: preserve earned notices, do not resurrect hint on cancel/retry; broad aftermath overlap remains separate. |
| NOTICE-CONTEXT-18 / P2 quality | Fresh CV3 acquisition frame retains pre-extraction claw instruction alongside earned notices | UI/mission: separately retire superseded objective hints and lay out rewards without deleting earned messages. Immediate post-panel frame is evidence of stale context, not demonstrated unreadability or permanent persistence. |
| SCRIPT-DRIFT-18 / P2 | Corrected production script | Campaign/cinematic: optional Alpha, purple boss eyes, Sage-gated bell and deliberate atomic rescue stay aligned. |
| PUR-SAVE-01 / P1 | Inherited from Oct17, not production intake | Mission: interrupted/completed/legacy retries must stay idempotent; don't append or reroll old choice. |
| PUR-UX-01 / P2 | Inherited binding/touch guidance | UI: actual mapped binding or dedicated button; physical device still required. |
| GH-EYE/BRIEF / P2 | Inherited purple eye and brief; fresh bounded phase/facing smoke proof | VFX/art: preserve red armor/amber telegraphs; extend to attacks, not a global purple wash. |
| QA-GH-JUMP / P2 | Reproduced in today's full collector: actual jump contact 0.178s versus required 0.25s | Combat/QA: measure actual input/simulation timing, no weakened dodge assertion; sweep at 0.30–0.52s clears. |
| QA-CRYSTAL / P2 verification | Today's full `crystal` passes; yesterday's discrepancy remains historical | Combat/QA: retain both outcomes; no throw fix was made today and the separate held-input charge failure is still open. |
| QA-IMPORT-18 / P2 | Test-only evidence-preservation fix, failed-before/passed-after | QA: imports preserve existing logs and create no output; CLI still owns initialization. Full campaign stdout/result remain intact; no second long run after the guard. |
| QA-CHARGE-18 / P2 | Collector and isolated rerun fail; diagnostic measures 0.533s at sample, 0.633s at release and actual 38-damage burst | Combat/QA: resolve sample/input/simulation timing with retained trace; do not call this a missing charged attack or weaken thresholds. |
| FILM-HANDOFF-18 / P2 | Full handoff 0.80s fails; isolated unchanged rerun 0.10s passes | Cinematic/QA: profile readiness/load; retain both. Not a lion-outro fix or subjective audio evidence. |
| QA-ENV-18 / P2 | Three early context failures; all three separate corrected-wrapper reruns pass | QA: preserve initial collector failures. No physical-phone inference or retroactive all-pass result. |
| FLIER-SCALE-01 / P2 | Full scale passes 0.79×, but traced fully loaded strip freshly reproduces 0.338× | Character art/QA: fail closed on intended asset readiness/renderer identity, then assess whole wingbeat/body mass. No scale/render fix today; cold-fallback explanation of full pass remains an inference. |
| GH-ART / P1 | Open fidelity gate | Approved part/pose set and four panels; no duplicate generation. |
| PURIFY-ART/FILM / P2 | Open authored body/four-movie gate | Art/cinematic: preserve lion; guardian-specific reviewed movies or truthfully labeled fallback. |
| ART-4/5/6, DOWN-ART, FURNACE / P2–P3 | Open localized art/pose gates | Character/cinematic: preserve approved identities, finish actual coverage, capture at gameplay size. |
| DEVICE/AUDIO/PERF / P2 | Unverified | Physical touch/pad/haptics, listened in-game endings, sustained memory/frame-time, complete manhwa parity. |

No final release certification while any reproduced gate fails. A staged victory,
viewport emulation, source census or green subset cannot substitute for an
uninterrupted route, all-cave inspection, complete artwork, or real-device review.

## Handoff

Use the single block in [CLAUDE_PROMPT.md](CLAUDE_PROMPT.md). Integrate this branch
once, preserve others' changes, rebuild source outputs/packages, and retest the
reconciled build. Do not treat the inherited Oct17 fix as already on main or apply
it twice. No automatic merge, production deployment, force push or external message
is authorized by this review run.
