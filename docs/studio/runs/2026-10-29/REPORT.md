# CLAWBYTE senior studio review — 2026-10-29

## Executive verdict

**HOLD production. Do not merge or deploy this review branch.**

There is no new production-game, story, art, or VFX commit after the October 28
review. `main` remains at `573d09d48d6278cf1afb51f66db3d9d014bafefe` and the
last inspected Claude integration lineage remains `62d75d204c6f6264f25150bb419fc262ff2c18ea`.
The newer `claude/runner-box` ref changes workflow runner declarations only.

Today's environment could build, package, serve, and execute source contracts,
but it did not contain Chromium. Playwright's browser installer was attempted and
returned empty/truncated archives. Therefore no October 29 browser harness,
staged rendered check, or uninterrupted real-input campaign is claimed as a pass
or a product failure. October 28 browser evidence remains the newest applicable
runtime evidence because the production source is unchanged.

One bounded pipeline fix is included. The studio collector now detects whether a
harness directly requires Playwright and records a missing/non-executable browser
as **blocked before launch**. Non-browser contracts continue to run. This prevents
environment absence from being reported as a product failure and avoids detached
error writers changing logs after capture. It changes no gameplay, art, story,
physics, saves, animation, VFX, or production HTML.

## Repository, comparison, and branch safety

| Item | Evidence |
|---|---|
| Review base | `codex/studio-review-2026-10-28` at `67d7338d9eb68aeb4b62b57a850c6b5a9be52934` |
| Latest `main` inspected | `573d09d48d6278cf1afb51f66db3d9d014bafefe` |
| Claude integration inspected | `62d75d204c6f6264f25150bb419fc262ff2c18ea` |
| Runner-only branch | `d91f24785278c6cedebdce92c41c6a75713dc242` |
| Review branch | `codex/studio-review-2026-10-29` |
| New production delta | none |
| Production action | none; review branch only |

The review lineage does not contain `main`'s unrelated `.claude/skills/founder-*`
commit. Any future integration must merge/rebase selectively and preserve those
files. Four dot-prefixed lazy-checkout temporary files were present in the fresh
clone; they were not edited, staged, or included.

## Evidence classes kept separate

1. **Source contract:** logic or asset declarations inspected/executed without a browser.
2. **Staged browser harness:** save, room, position, or entity may be prepared.
3. **Uninterrupted real-input campaign:** cleared storage and ordinary input only.
4. **Checkpoint diagnostic:** ordinary input from a game-written save; never a campaign certificate.
5. **Visual inspection:** frame inspected at gameplay size; does not prove motion or interaction.
6. **Physical device:** touch/controller/performance/thermal evidence; not completed.

## October 29 execution

### Build, package, and contracts

| Command | Result |
|---|---|
| `npm ci` | pass; 160 packages installed |
| `node build.cjs` | pass; four targets, 4.71/3.48/4.73/3.50 MB |
| `node tools/pack-www.cjs` | pass; 696 assets, 245.6 MB; pages 8.2 MB; total 253.8 MB |
| `python -m py_compile tools/studio/audit.py` | pass |
| `python -m unittest tools.studio.test_audit -v` | pass, 10/10 after fix |
| source-contract collector subset | pass, 8/8 plus build and both identity gates |
| direct non-browser contract set | pass, 29/29 |

The integrity-valid source-contract collector is retained in
`reruns/source-contracts/`. It passed `campaign-contract`, `story-opening`,
`story-progression`, `cave-ground`, `combat-impact-contract`, `repair-lifecycle`,
`tutorial-clarity`, and `weapons` on one pinned served identity.

The additional direct contracts covered build identity, campaign import, combo
routing, credits, desktop protocol, dialogue audio, gear, grapple protection,
haptics, focus clearing, motion sampling, offline release, reel contracts, Sage
specials, scratch reach, script route, seam route, shadows, audio tails, controller
contracts, voice handoff, and weapon progression. These are source/contract results,
not rendered gameplay.

### Browser and real-input scope

The first focused collector correctly failed overall but initially launched ten
checks without a browser. All ten exited in under one second because
`/opt/pw-browsers/chromium` did not exist. Two detached writers subsequently
changed `opening-order.log` and `roomcache.log`, so that first aggregate has failed
log integrity and is retained only as the reproduction of the collector defect.

After the bounded fix, the same ten checks were recorded as blocked before launch:

- `combat-impact-input`
- `opening-order`
- `gravehorn`
- `infection-eyes`
- `infection-roster`
- `infection-poses`
- `textreveal`
- `roomcache`
- `sage-walk`
- `campaign-ch1`

The rerun has valid log integrity, passes both served-identity gates, and remains
red because blocked evidence cannot certify the product. No October 29
uninterrupted real-input playthrough occurred.

## Fifteen senior-role verdicts

| # | Role | Verdict | Evidence and required action |
|---|---|---|---|
| 1 | Senior Cinematic Designer | HOLD P1 | Forty-page Draft 3 still lacks a forty-row literal gameplay parity ledger; only 32 revised page files exist. |
| 2 | Senior Game Designer — Player Systems | HOLD P1 | October 28 clean journey stalled in the mandatory held-heal lesson; held charge also failed. Fresh browser proof blocked. |
| 3 | Senior Mission Designer — Quest Craft | HOLD P2 | Cave topology/rewards exist, but natural offer→discovery→action→reward→return evidence remains incomplete. |
| 4 | Principal Encounter Designer | HOLD P1 | Gravehorn's newest mechanics evidence is red; intro, move chains, recovery, and phase two are not certified. |
| 5 | Senior Boss Designer | HOLD P1/P2 | No-kill hold ritual exists; only Glitch has a mapped current-contract ritual film. |
| 6 | Senior Mission Designer — Campaign | HOLD P1 | No uninterrupted cleared-save ordinary-input run reaches B1; Alpha optionality lacks natural campaign proof. |
| 7 | Senior Mission Producer | HOLD | Scope, branch, evidence classes, unresolved findings, and one Claude handoff are controlled; release gates remain red. |
| 8 | Senior Character Artist | HOLD P1/P2 | Gravehorn is procedural placeholder art; bound beasts lack readable down/breathe/recover strips; approved art is preserved. |
| 9 | Senior Cinematic Director | HOLD P1/P2 | Manhwa parity, four guardian rituals, Gravehorn intercuts, and three masked panel corrections remain open. |
| 10 | Senior VFX Artist | HOLD | Source eye contract is correct; full pose sweep and physical-device budget/cleanup certificate remain open. |
| 11 | Senior Technical Director — World Systems | HOLD P1/P2 | October 28 roomcache spike/terrain timeout and absent clean campaign remain unresolved; CV2 geometry is not proven broken. |
| 12 | Senior Gameplay Engineer — Combat | HOLD P1 | Real held charge/heal, gait determinism, Gravehorn mechanics, and boss pacing remain red or blocked. |
| 13 | Senior Gameplay Engineer — Mission | PASS evidence-driver; HOLD campaign | Route-memory fix remains bounded/green; chapter-one, caves, rewards, and Alpha still need ordinary-input proof. |
| 14 | Senior Gameplay Engineer — NPC | PASS staged Sage; HOLD journey | Staged Sage walk no longer uses kneeling slide; natural purification, Servo, and device evidence remain open. |
| 15 | Lead UI Engineer | HOLD P1/P2 | Opening reliability, CJK fixture intent, finite toast queue, physical touch, and controller/remap proof remain open. |

## Stable findings and acceptance conditions

### `INPUT-HOLD-01` — P1, open

October 28 staged real-keyboard evidence showed a normal claw tap working while a
950 ms `KeyX` hold never reached the 0.6 s charged threshold. The clean campaign
also repeatedly held `F` with 99 volts and 6/7 cores without completing the heal
lesson. Investigate raw key state, focus/visibility, overlay ownership, fixed-step
`dt`, and `inD` timer ownership together. Do not reduce thresholds or add automatic
completion. Acceptance is three integrity-valid tap/hold/release/heal runs plus a
fresh campaign continuation.

### `GH-MECH-01` and `GH-ART` — P1, open

The newest isolated mechanics evidence failed introduction/name-card progression,
charge/missile chains, recovery, horn return, phase two, kick impact and chained
charge before timing out. At gameplay size Gravehorn remains a translucent pink
procedural rhinoceros beside a finished painted hero. Produce the already-queued
fourteen-part gunmetal/bronze rig, but fix mechanics independently. Acceptance is
three clean mechanics passes and gameplay-size idle/tell/contact/recovery/phase/
down/retry captures with planted hooves, joint overdraw, separate horns, and both
facings.

### `COMBAT-GAIT-01` — P1/P2, open

October 28 `enemygait` changed 39 pixels at identical traveled distance when only
wall-clock time changed. Make visible gait a function of distance/state, preserving
authored banking, facing, planted feet, and airborne plates.

### `CAMPAIGN-B1-01` — P1, open

The last uninterrupted campaign naturally completed Ratchet's letter, battery,
repair, causal explanation, pod save/recharge, Volt Pack funding and purchase. It
then timed out in the heal lesson. The CV1B checkpoint diagnostic later crossed
CV2→CV3 at 05:21, but checkpoint evidence cannot certify chapter one. Acceptance is
one cleared-browser ordinary-input run to the B1 teaser, with no flag, inventory,
position, progress, or teleport injection.

### `MANHWA-PERF-01` — P1, open

Draft 3 specifies forty pages; the revised folder contains 32 page files and the
editorial review calls for pages 16–40 to be produced/restaged. Sequence IDs and a
displayed image do not prove cradle/lamp acting, battery/socket contact, necklace
handling, marble/forge hand contact, CHIME casing/vent work, or NULLFANG cable
assistance. Acceptance is a literal forty-row parity ledger and either passing
runtime evidence or an approved page revision for every row.

### `CAVE-JOURNEY-01` — P2, open

The caves have authored topology and rewards but lack complete ordinary-input
discovery/return proof. Alpha must remain optional and must not gate NULLFANG or B1.
Acceptance is offer→landmark→discovery/action→reward→visible consequence→reload for
each optional loop, plus a separate mandatory B1 completion without Alpha.

### `EYE-VFX-01` — source pass, rendered/device HOLD

The current source preserves the owner's contract: red ordinary eyes; purple
bosses/Sages/Alpha; current-frame transformed anchors; body-travel/world-space
emission; 1.125–1.875 s lifetime; 90/170/260/320 caps; clear after >90 px
discontinuity and on cure/death/removal/teleport/room change; reduced-motion glow
without smoke. October 28 core/roster passed once, but the 105-pose sweep timed out
and later isolated attempts were unstable. Acceptance requires all three suites on
one pinned build and physical low/mid/high-tier profiling.

### `UI-CJK-01` and `UI-DENSITY-25` — P2, open

The Chinese fixture fit as one 467 px line inside a 548 px box, contradicting the
test's two-line expectation but not demonstrating clipping. Validate production
font/kinsoku with a genuinely over-width sample rather than inserting arbitrary
breaks. `G.toast` remains unbounded; add deterministic priority, deduplication,
capacity and retirement while preserving paused lifetimes and narrative priority.

### `WORLD-PERF-01` — P1/P2, open

October 28 recorded a 114 ms room crossing against a 90 ms budget and a 2998 ms
bake-ahead slice; terrain and boss-space suites timed out. Reproduce three times on
one pinned host, profile the exact work unit, and test low/mid/high physical devices.
Do not raise budgets to hide the defect.

## Cave census

| Area | Intended meaning/payoff | Evidence status |
|---|---|---|
| A5 | loose floor, Mind Node, Magnet crest, quarry history | source/staged |
| A7 | survey and once-only Ratchet payment | source/staged |
| CV1 | bound crawler and max-core chest | source/staged/historical |
| CV1B | survey pod, map, shortcut, rest/respawn | historical journey/checkpoint |
| CV2 | Deaf System/beacon and quarry route | checkpoint diagnostic crossed |
| CV3 | Gravehorn, raw marble, changed return route | source/staged; encounter red |
| GA1T/GA1/GA1D | refuge, bench, Meadow Sage, network rescue | source/staged |
| A11 | secret coin | source/staged |
| A12 | traversal challenge and star fragment | source/staged |
| A13 | coin and gantry-watch log | source/staged |
| A10/GA2/GA2T/GA2D | Alpha, friendly pack, Warden log, Pack Sage | source/staged; natural loop open |

## Story/manhwa parity matrix

| Beat | Best applicable evidence | Open gap |
|---|---|---|
| Wake/bay/gate | October 28 real-input journey | literal cradle/umbilical/lamp acting |
| Letter/drawer/repair | real-input journey; polished board frame | body/hand/socket continuity |
| Ratchet explanation | real-input journey | necklace/battery physical acting |
| Pod/Volt Pack | real-input journey | held-heal completion and physical touch |
| Cave/Gravehorn/raw marble | source/staged/checkpoint entry | boss reliability, acquisition, natural return |
| Forge | source/staged | hand/tool/material contact in journey |
| Passage/Meadow Sage | source/staged | uninterrupted rescue/friendly recovery |
| CHIME/NULLFANG | source/staged/historical | clean journey and casing/cable acting |
| Purification | staged logic; Glitch film only | hero performance and four current films |
| B1 teaser | historical | fresh uninterrupted completion |

## Animation, art, cinematic, and VFX matrix

| Subject | Current status | Required acceptance |
|---|---|---|
| Hero | approved and preserved | do not regenerate |
| Alpha/pack | extensive identity-specific strips | preserve; prove optional natural rescue |
| Sage walk | staged green on October 28 | natural purify→walk→reload proof |
| Gravehorn | procedural translucent placeholder | fourteen-part authored rig + four intercuts |
| Bound wolf/cheetah | flattened crouch/down fallback | dedicated four-cell down/breathe/recover strips |
| Furnace | body present; six action plates absent | breath/blast/spent/gather/dive/bell plates |
| Purifier hero | regular body under VFX | raise→hold/gather→slash→recover, both facings |
| Guardian rituals | Glitch mapped; four current films absent | identity-specific film, audio and picture fade |
| Infection eyes | source contract correct | stable core/roster/105-pose + device certificate |

## Gameplay-size visual inspection

No new rendered capture could be produced without Chromium. Because production
source is unchanged, the current-build captures retained from October 17/18/28 were
re-inspected at gameplay size:

- Ratchet repair board: production-ready hierarchy, legible parts, distinct targets,
  clear keyboard/touch instructions, and restrained industrial texture.
- Gravehorn: readable silhouette but translucent line/procedural material far below
  the hero's finish; joints, hooves, horns and mass do not read as a studio boss.
- Bound wolf: tiny horizontally compressed body that does not communicate breathing,
  pain, rescue, or identity.
- Forge/checkpoint frame: hero and environment read clearly, but it cannot prove
  literal forge hand/tool/material acting.

No approved asset was regenerated.

## Implemented and verified patch

| File | Change | Verification |
|---|---|---|
| `tools/studio/audit.py` | detect direct Playwright harnesses; block missing/non-executable Chromium before launch; leave non-browser contracts runnable | compile; 10/10 unit tests; blocked browser subset with integrity true; green source subset |
| `tools/studio/test_audit.py` | tests for browser-only detection, missing executable, non-browser continuation, and executable acceptance | 10/10 pass |

The original failed subset is retained under `automated/`; the corrected rerun is
retained separately under `reruns/browser-preflight/`. Nothing was rewritten to
turn the original into a pass.

## Unverified scope and blockers

- No installed Chromium; Playwright download returned truncated/empty archives.
- No October 29 staged rendered harness or uninterrupted real-input campaign.
- No physical touch/controller/remapping run.
- No physical low/mid/high-tier performance, memory, thermal, haptic, or audio-room test.
- No fresh audible end-fade verification for ritual films.
- No complete forty-page manhwa parity certificate.

## Release recommendation

Keep production on hold. Selectively integrate the audit preflight fix, then repair
the held-input path and Gravehorn before art polish is treated as acceptance. Run a
fresh pinned-browser focused suite, then one uninterrupted clean campaign to B1.
Only after those gates are green should the branch be considered for production
integration. This review does not merge or deploy anything.

