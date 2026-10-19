# Engineering studio review — 2026-10-19

## Authority, identity and evidence boundary

Five separate senior engineering responsibilities are instantiated below. This
review read `AGENTS.md`, `docs/DEVELOPMENT_AUTHORITY.md`, `docs/STORY_CANON.md`,
the complete `CLAUDE.md`, `docs/studio/PIPELINE.md`, `roles.json` and all five
engineering mandates. The current explicit review-branch-only instruction
overrides the older standing production-publishing directions.

Source intake is `69640ed83d72d451cfb6f0b59fafb2c029cc5802`, inherited by
`codex/studio-review-2026-10-19`. The producer reports both production `main`
and integration `claude/clawbyte-repo-migration-byhyl8` unchanged at
`62d75d204c6f6264f25150bb419fc262ff2c18ea`; this agent did not independently
fetch external refs. Compare [Oct18 REPORT](../2026-10-18/REPORT.md) and
[Oct18 ENGINEERING](../2026-10-18/ENGINEERING.md). Oct17/18 fixes are inherited,
not new implementations, and must not be duplicated during integration.

Evidence here is **source-inspected**, or **historical Oct18** where explicitly
identified. This reviewer ran no build, browser, gameplay harness or campaign,
and edited only this report. Today's executable, visual and continuous-input
outcomes belong to the producer's final consolidated report. Historical passes
are not fresh certificates; current-source inspection is not live verification.

## Five role verdicts

| Senior responsibility | Verdict | Evidence and limit |
|---|---|---|
| Technical Director — World Systems | Issues | Earned sword/Sage/CHIME gates and safe bench migration remain in `js/progress.js:34–64`. No source change today is needed to reorder the lion or make Alpha mandatory. Fresh collision/package/same-build checks and optional-cave traversal remain producer-owned. |
| Gameplay Engineer — Combat | Issues | Actual armor, cadence, weighted impacts and capped ledger remain in `js/combat-stats.js`; charge/dodge timing and intended-art readiness are unresolved, not missing combat-system implementation. Preserve original failed gates and measure input/simulation timing before tuning. |
| Gameplay Engineer — Mission | Issues; inherited bounded fixes present | Atomic principal rescue commit remains in `js/braid.js:437–460`, `js/purification.js:81–90`, `js/game.js:287–291`; semantic material hint retirement is the smallest newly proposed correction below. No broad save rewrite is justified. |
| Gameplay Engineer — NPC | Issues | Ratchet quest ownership/revival and optional post-forge Alpha offer remain explicit; friendly lion follow chooses stalk and ground placement (`js/entities.js:12142–12169`). Source does not certify grounded contacts, surrender pose quality or first-time comprehension. |
| Lead UI Engineer | Issues; inherited scoped cleanup retained | Typed/paged/dwell-protected dialogue and real-binding rescue prompts remain. The acquired-marble frame still needs a separate semantic notice scope; this is not a regression in the fixed boss-opening cleanup or proof of unreadable overlap. Physical phone/pad/haptics remain unverified. |

## NOTICE-CONTEXT-18 — stale material-extraction hint

**Priority:** P2 clarity. **Owners:** UI and Mission. **Status at this source
intake:** cause traced; smallest patch proposed to producer, not implemented by
this reviewer.

### Historical observation, not a fresh playtest

Oct18's ordinary-keyboard campaign acquired the raw marble at 12:14 and changed
the objective to bringing it back to Ratchet. The old “Claws glance off the raw
marble…” instruction is still logged at 12:17 and appears beside the acquisition
notices in [the actual acquired-marble frame](../2026-10-18/automated/campaign-ch1/frames/016-done-marble.png).
See [preserved complete trace](../2026-10-18/automated/campaign-ch1.log).
This establishes obsolete context immediately after acquisition, not permanent
persistence or demonstrated unreadability. The producer must collect fresh
before/after evidence for today's candidate.

### Exact source chain

1. Ordinary swing/pillar collision at `js/entities.js:2508–2514` emits
   `G.toast(t('pl_hint'))`, throttled by `G._pillarToldT`. It has no provenance.
2. `G.toast(text, scope)` already preserves an optional `scope`
   (`js/game.js:192–196`). The existing feature can be reused without a second
   notification subsystem.
3. Successful `Player.releaseCharged()` extraction (`js/entities.js:2811–2826`)
   removes the pillar, writes `flags.pl_cshard`, emits impact feedback and calls
   `questTake('cshard')`; it does not retire the obsolete instruction.
4. `questTake` (`js/quests.js:235–247`) writes the bag, emits acquisition and
   ready/keep notices, then persists. It also does not retire the old hint.
5. TTL decrement/filter is inside PLAY (`js/game.js:3046–3047`). Film/dialog
   pauses preserve ordinary earned notices, but also preserve an obsolete
   objective hint unless the transition explicitly retires it.

`pl_hint` is not one of `STORY_NOTE_KEYS` (`js/overlay.js:180–184`), so this
particular line is an ordinary toast, not an acknowledged story card. Do not
change the dialogue-reader architecture to fix this narrow lifetime problem.

### Smallest patch recommendation

Tag the one `pl_hint` producer with a dedicated semantic scope such as
`'marble-extraction'`. In the successful pillar-extraction block, after the
pillar is actually removed/flagged and before `questTake('cshard')`, filter only
that scope. This keeps cleanup owned by the event that invalidates the guidance,
without broadening all item acquisitions or changing save/reward behavior.
An alternative is a narrowly guarded `item === 'cshard'` cleanup in `questTake`
if the intended contract is all raw-marble acquisition paths; use one owner,
not both. The current production path is the successful extraction block.

Do not filter by English/translated text or globally clear `G.toasts`. Preserve
earned pickup/reward, unrelated tutorial notices, and an identically worded
notice without this scope. Keep `'boss-opening'` separate; purification already
owns that lifecycle. No geometry, burst cost/damage, charge threshold, story
order, item identity, TTL or accessibility setting needs changing.

### Required regression acceptance

- Trigger the real production ordinary-hit/pillar path and confirm it still
  emits the scoped hint before extraction. A fixture that only hand-enqueues
  the scope does not prove the producer was tagged.
- Execute successful production charged extraction with an earned Volt Pack,
  adequate volts and the raw pillar in range. Assert pillar removal,
  `pl_cshard`, bag ownership and return objective; assert the scoped hint gone.
- Preserve unrelated earned notices and identical-worded unscoped text, plus
  any separate boss-opening scope. Check more than one locale without matching
  translated text in the cleanup implementation.
- A miss/ordinary hit/insufficient-charge refusal must not retire valid
  guidance; reloading/returning must not resurrect the extracted pillar or
  obsolete hint. Retain quest payout/idempotence behavior.
- Exercise panel/dialog pause around the transition; capture before/after at
  gameplay size. Run existing `crystal`, `caves-ch1`, `den-gate`, opening/story
  checks and the new notice regression against the exact rebuilt candidate.

Existing `tests/crystal.cjs:57–82,293–298` already covers ordinary-claw refusal,
charged extraction, material bag/flag and no regrowth. It does **not** assert
notice lifecycle. `tests/purification-notices.cjs` validates only its distinct
principal-guardian scope using staged setup; it must not be relabeled as marble
coverage. The producer owns the actual new test and final results.

## Retained fixes — do not reimplement

### Principal guardian choice/reward atomicity

`brAnswer` defers principal mercy choice/reward rather than persisting it before
the film; `purificationCommitChoice` matches exact prior kind/room and consumes
pending choice once; `G.onBossDead` sets completion and invokes that commit.
This is separate from ordinary creatures, optional Alpha and Mother's ending.
`tests/purification-save.cjs` remains registered. Historical duplicates are not
rewritten or randomly repaid. Source presence is not proof this reached main.

### Device prompts and finite eyes

`purificationText` (`js/purification.js:23–32`) resolves the actual mapped
Interact token or localized dedicated-button text for touch/unbound pads.
Hold is release-armed, focus/visibility safe and 1.6 seconds. Registered
`purification-controls` remains staged device-emulation coverage, not a physical
controller/phone certificate.

`js/infection-eyes.js:89–101` excludes friendly/tamed/purified/disabled actors;
existing world-space trails age finitely and reduced motion removes smoke.
GRAVEHORN's inherited purple-eye fix must preserve amber telegraphs. The broad
pose harness historically omits GRAVEHORN; Oct18's four idle-travel phase/facing
samples supplement but do not close every attack/head-pose/performance gap.

### Scoped principal opening notices

The generic guardian, lion and GRAVEHORN opening producers retain
`'boss-opening'` at `js/entities.js:11912,12428` and `js/gravehorn.js:614`.
`purificationBegin` filters only that scope after actor/blade/already-open guards
(`js/purification.js:54–61`). This bounded Oct18 fix is retained. It does not
serialize all reward/equipment UI, solve the separate material hint, or prove
every locale and input device visually acceptable.

### Campaign import evidence guard

The Oct18 guard is retained in `tests/campaign-ch1.cjs:48–55`: output directory,
frame directory and log truncation are inside `require.main === module`.
The entry distinction at `:1316–1318` exports helpers on import and launches
the actual campaign only as CLI. `tests/campaign-contract.cjs:3` still imports
these helpers. Without the initialization guard, that contract erases a
completed nested campaign log even though its certificate assertions pass.

The targeted historical regression is
[campaign-import-regression.cjs](../2026-10-18/campaign-import-regression.cjs):
it imports in a child process with existing sentinel and absent output paths,
then verifies preservation/no creation. The fix and that evidence remain; the
specific import-side-effect regression is run-local, **not a registered suite
harness**. Re-run it explicitly when modifying the campaign helper/init path.
The certificate contract covers missing/late/error/partial evidence, not this
filesystem side effect. Do not infer fresh uninterrupted play from either one.

## Open timing/readiness gates — carry actual evidence, not stale labels

| ID | Historical Oct18 result | Current source and next evidence |
|---|---|---|
| QA-CHARGE-18 | Full and isolated `combat-impact-input` fail at the nominal 950ms charge sample. Diagnostic measured 0.533s charge then 0.633s at key-up and an actual 38-damage burst. | `tests/combat-impact-input.cjs:25–28` uses wall hold then samples; `Player.update` adds simulation `dt` (`entities.js:2240–2243`); `SIM_MAX=0.1`, `G.simClock` and art-ready gating are in `game.js:18092–18140`. Measure frame/input/simulation clock before changing any gameplay or assertion. This is not evidence the special attack is absent. |
| QA-GH-JUMP | Full keyboard dodge samples 0.178s to contact and loses a core; wider 0.30–0.52s sweep clears. | `tests/gravehorn.cjs:233–258` polls state, takes its sample and only then dispatches Space when TTC <=0.25. No separate assertion that actual dispatch occurred at exactly 0.25s exists there. Trace state/input-to-simulation delay and collision timing; preserve lost-core failure rather than widening the window or weakening it. |
| FLIER-SCALE-01 | Full `foescale` passes 0.79×, but directly traced loaded strip is 24px/71px=0.338×; whole-wingbeat heights vary 0.324–0.606×. | `tests/foescale.cjs:39–43` waits for hero art, not each foe strip. Its fixed anim=1.2 sample has no foe renderer identity. `TALON_MINI` keys cruise/chase at `entities.js:10404–10405`. Fail closed on intended foe readiness and trace exact renderer before accepting scale or altering art. A fallback explanation of the full pass remains an inference; loaded-strip discrepancy is directly measured historically. |
| FILM-HANDOFF-18 | Full `filmflow` worst hold 0.80s fails, isolated unchanged 0.10s passes. | Keep both and profile readiness/frame scheduling. No movie edit was made. Not evidence of the lion outro or listened audio fade. |

Historical full `crystal` **passed** Oct18, so its earlier throw discrepancy must
not be reported as a current reproduced failure without new evidence. Likewise,
the three initial multi-context errors separately passed after browser-wrapper
correction; retain original collector failures without calling them newly fixed
gameplay. No fresh result is asserted by this source-only report.

## Systems/story contracts and remaining certification limits

`PG_LAIR_NEEDS=['crystal','sageTame_GA1D','bossChime']`, `pgBellOpen` and
`progressBenchGuard` preserve material → forge → first Sage → CHIME → lion,
with legacy-save compatibility and safe A3 continuation. `progressGoal` switches
to material return from bag/flag and prioritizes the earned pack/GRAVEHORN road.
The material hint is redundant with that new return goal after pickup, making
semantic retirement preferable to hiding the objective or changing the story.

`alphaQuestOffer` (`js/wolves.js:625–629`) requires the forged sword, persists
`alphaLead`, opens its quest and gives Ratchet's backstory. It is absent from
lion prerequisites by design. Early find remembering and read-based A7 survey
progress are preserved in `js/quests.js`, not replaced with a mere room visit.
The producer/design reviewer owns today's cave census; source payoffs alone do
not establish ordinary-input exploration of every optional branch.

`js/combat-stats.js` already implements HP/cores inspection, defense, enemy
authored cadence multiplier, hero swings/second, normal/heavy/charged flash and
fragments, contact-owned recoil/shake/hit-stop, protected targets, a capped
200-event ledger and local export. Keep those units honest: enemy cadence is
not a measured attacks-per-second rate. Existing printable field-guide/card
assets should be reused, not regenerated under this review.

Friendly lion source uses stalk while following and world-ground placement;
that is stronger than sleeping-body sliding but does not itself demonstrate
authored planted contacts in every facing. Bound ordinary wolf/cheetah artwork,
GRAVEHORN authored body/parts, purification raise/hold/slash/recover body motion,
four matching ritual films and full manhwa physical-action parity remain open
production gates pending the art review. Preserve the existing lion ritual and
outro. Muted runtime video plus separately routed music means encoded fade is
not a listening certificate.

Physical touch/pad, haptics, subjective sound/music, sustained real-device
frame-time/memory, every optional cave and complete all-pose eye anchoring are
not assessed here. Any fresh staged pass, continuous campaign or release verdict
must cite today's producer evidence separately. No merge/deployment claim is made.

## Producer follow-up — bounded fixes independently inspected

This section supersedes the **intake** status above only for the specific fixes
and evidence named here. The reviewer inspected the final source/test diff,
new harnesses, [source identity](identity.json), fresh before/after JSON and
producer logs without launching a browser/build/test or changing runtime code.
The fixed candidate is **`1d3a7c72250c`**; baseline is `7984b6ea8f08`.
The producer's full 194-harness run is ongoing at this inspection point; neither
a final full-suite verdict nor a fresh continuous campaign is claimed here.

### Material notice — implemented and bounded staged regression verified

The actual ordinary-hit producer now passes `'marble-extraction'` at
`js/entities.js:2514`. Successful `releaseCharged()` removes/flags the pillar,
then filters only that exact scope before acquisition notices
(`js/entities.js:2816–2822`). The filter is inside the in-range pillar success
block, not at charged-attack entry, not in generic item acquisition and not at
room/dialog entry. Misses preserve guidance. The separate `'boss-opening'`
filter/producer contract is unchanged. No translated-text matching, broad queue
clear, TTL rewrite, attack-power change or inventory/schema rewrite was added.

Read the actual [before JSON](before/marble/result.json) and
[failed before log](before/tests.log): both English and Arabic reach extraction,
but the actual ordinary-claw hint lacks scope and remains afterward. The new
assertion fails on that original behavior; it is not a synthetic failing claim.
The [after JSON](after/marble/result.json) and [after log](after/tests.log) show
both languages on the new build with the producer-emitted semantic scope. The
miss retains it; successful extraction removes only it, while the earned notice,
identically worded unscoped notice, separate boss-opening scope and acquisition
messages remain. Material bag/flag/removal are true and immediate retry is
notice-idempotent. Both before and after record zero page errors.

`tests/marble-notices.cjs` is now registered. It calls actual production update,
ordinary-hit and `releaseCharged` paths in a staged save/placement with the rAF
loop stopped. It does not merely enqueue the tested scope by hand. This is
strong bounded lifecycle evidence, **not ordinary real-input gameplay**. It does
not test physical controls, insufficient-volts refusal, saved reload, every
locale, panel-pause presentation or general aftermath notice layout. Existing
extraction/save/route checks and producer campaign evidence remain separate.

**NOTICE-CONTEXT-18 status:** implemented, failed-before/passed-after staged
regression reviewed; full current-suite, integration and deployment are separate.

### Import preservation — promoted to an ongoing registered guard

The earlier note that the import-side-effect regression was only run-local is
now **superseded**: new `tests/campaign-import.cjs` is registered with
`{noBrowser:true}` in `tests/run.cjs`. It imports the actual campaign helpers in
two subprocesses with isolated temporary paths, checks exact sentinel log
preservation, absence of unintended output creation, zero subprocess exits and
no stderr. [Fresh collector log](automated/campaign-import.log) records both
properties true, exits `[0,0]`, errors `[]`. The underlying CLI initialization
guard remains inherited; this is new durable coverage, not a second game fix.
It certifies no actual campaign traversal or movie/audio recording.

### Loaded flier readiness and constant authored-flight presentation

The strengthened `tests/foescale.cjs` explicitly fetches both flight strips,
requires full tier 3 with nonzero natural dimensions, throws rather than accepts
fallback, records the exact renderer and checks 80 cruise/chase/banked samples.
The original `FLOOR=0.5`, `CEIL=1.0` are unchanged, and the new full-wingbeat
checks apply those same bounds. Before source adjustment, the strengthened
harness **fails** at flier 0.34× and 48 too-small samples; afterward it passes at
flier 0.54×, sample range **0.507–0.944×**, no too-small/too-big samples and no
page errors. Both logs are retained in the same before/after files above.

The runtime change is one constant strip width, **2.42 → 3.75**, for both
`TALON_MINI.cruise` and `.chase`. No per-frame normalization, hitbox, health,
attack range, physics, asset pixels or animation beat was changed. The
[after diagnostic](after/flier/result.json) directly identifies full-tier assets
and exact authored strip rendering, rather than relying on inference from a
passing fallback. This closes the bounded readiness/scale-test hole and verifies
the intended presentation band, not professional body-mass/art approval,
all-state attack readability, pixel clipping in every camera situation or combat
fairness. The art reviewer/producer owns gameplay-size visual acceptance and
the full suite; physical-device/performance claims remain out of scope.

## In-progress full collector — two unresolved integration holds

The frozen candidate remains `1d3a7c72250c`. The following are **fresh
producer-run automated failures, independently read from logs**, not this
reviewer's browser observations. The full suite and continuous route are still
pending at this follow-up; their final counts/certificate belong to REPORT.md.
The preceding bounded successes do not override either failure.

### FLIER-EYE-19 — placement gate after authored-flight enlargement

[infection-roster.log](automated/infection-roster.log) fails the existing
“on the body” bound for the flier: reported first-eye offsets are approximately
`(-17,+19)` and `(-18,+17)` relative to the actor center. The harness compares
downward offset to collider height ×0.75 (`tests/infection-roster.cjs:249–253`);
for height 22 this is **16.5px**. The candidate's fixed authored-flight width
increase therefore passes the separate size test but exposes an unresolved eye
placement/bounds gate. Do not call the flier fully verified or integration-ready.

The same run reports all 27 placed kinds have an eye, all rank/file red and 14
guardians purple, every moving body emits smoke and newest smoke originates at
that frame's eye (worst recorded 0.0px discrepancy). Zero page errors. Those
passes establish color/origin consistency, **not** anatomical correctness of the
particular flier point. Matching a wrong anchor precisely would still be wrong.

The failed log does not preserve exact flight cell, facing-specific renderer
trace, crop/mask or the eye on its drawn head. It is therefore insufficient to
decide whether this is an actual off-head anchor, an outdated collider-relative
proxy after visual enlargement, or another pose/transform condition. Source
inspection of the proxy does not resolve that distinction. Required next proof:
reproduce the failing fully loaded pose/facing, capture actual head pixels and
eye/world transform, compare both facings and flight states, then fix the
responsible anchor/transform if indicated. Do not enlarge the collider, relax
the bound or broadly move every eye merely to turn the assertion green. Retain
the raw failure; the art/producer review owns the corresponding visual hold.

### QA-TEXT-ZH-19 — Chinese wrapping/coverage unresolved

[textreveal.log](automated/textreveal.log) fails the Chinese fixture's required
multi-line wrapping: **one line, widest 467px**. Its assertion requires both at
least two lines and width no greater than `DLG_W=548`
(`tests/textreveal.cjs:143–150,325`). This logged measurement is not an overflow:
467 is within the box; the failing condition is the one-line layout. Do not
report it as demonstrated clipped prose, missing characters or broken Arabic.
The same run passes reveal/skip/grace/dwell/mash protection, long-token character
retention, RTL Arabic alignment, overlay sequencing, save preferences and
reduced-motion/Instant behavior, with no page errors.

[font-coverage.json](setup/font-coverage.json) records the wrapper-configured
host Fontconfig CLI listing no Chinese-capable fonts and selecting Open Sans as
fallback. Missing CJK coverage is a relevant environment lead, not a Chrome
per-glyph observation or proven root cause. Capture browser-rendered fixture
text, actual glyph/font availability and layout on the pinned build with a
known-capable configured font before changing wrapping logic or the fixture.
Keep the original failed result, preserve the existing assertion, and separate
any corrected-environment rerun from the original collector. A known-width
fallback or green English/Arabic subset cannot certify Chinese text or physical
device font coverage.
