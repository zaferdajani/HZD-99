# CLAWBYTE senior studio review — 2026-10-30

## Executive verdict

**HOLD production. Do not merge or deploy this review branch.**

There is no production-game, story, art, cinematic, or VFX change after the
October 29 review. `main` remains at
`573d09d48d6278cf1afb51f66db3d9d014bafefe`; the last inspected Claude
integration lineage remains `62d75d204c6f6264f25150bb419fc262ff2c18ea`;
`claude/runner-box` at `d91f24785278c6cedebdce92c41c6a75713dc242`
contains workflow-runner declarations only.

The October 29 browser-preflight correction is now proven across the full studio
collector: all 197 requested harness slots were accounted for on one pinned
served identity. Twenty-nine non-browser harnesses passed and 168 browser-dependent
harnesses were recorded as blocked before launch because Chromium was absent.
Both identity gates passed and all captured log hashes remain valid. The overall
collector correctly remains red; blocked evidence is never a release certificate.

No October 30 staged rendered harness, uninterrupted real-input campaign, or
physical-device check is claimed. No approved artwork was regenerated. No new
production fix was attempted because there is no new production delta and the
known gameplay defects cannot be safely validated without a browser.

## Repository and comparison

| Item | Evidence |
|---|---|
| Review base | `codex/studio-review-2026-10-29` at `7c74bb5359a1bd3a12391d4d94260ed8484e4d43` |
| Latest `main` inspected | `573d09d48d6278cf1afb51f66db3d9d014bafefe` |
| Claude integration inspected | `62d75d204c6f6264f25150bb419fc262ff2c18ea` |
| Runner-only ref | `d91f24785278c6cedebdce92c41c6a75713dc242` |
| Review branch | `codex/studio-review-2026-10-30` |
| New production delta | none |
| Production action | none; review branch only |

The review lineage does not include `main`'s unrelated `.claude/skills/founder-*`
commit. Future integration must merge/rebase selectively and preserve those files.
Four dot-prefixed lazy-checkout temporary files appeared in the fresh clone and
were neither edited nor staged.

## Evidence classes

1. **Source contract:** logic or metadata evaluated without rendering.
2. **Staged browser harness:** room/save/entity/position may be prepared.
3. **Uninterrupted real-input campaign:** cleared storage and ordinary input only.
4. **Checkpoint diagnostic:** ordinary input from a game-written save; never a full certificate.
5. **Gameplay-size visual inspection:** a frame is evaluated; motion is not implied.
6. **Physical device:** touch/controller/performance/thermal evidence; not completed.

## October 30 execution

### Environment and commands

| Command | Result |
|---|---|
| `npm ci` | pass; 160 packages installed |
| `npx playwright install chromium` | blocked; repeated zero-byte/truncated archives |
| `python tools/studio/audit.py --profile full --output docs/studio/runs/2026-10-30/automated` | expected nonzero: full scope accounted for, 29 harness pass / 168 blocked |
| `node build.cjs` through collector | pass; all four targets |
| `node tools/pack-www.cjs` through collector | pass; 696 assets, 245.6 MB; pages 8.2 MB; total 253.8 MB |
| start/end served identity | pass; pinned `index.html` SHA-256 `9409aedb…` |
| `python -m py_compile tools/studio/audit.py` | pass |
| `python -m unittest tools.studio.test_audit -v` | pass, 10/10 |
| JSON validation for run artifacts | pass |

### Full collector result

- Requested gameplay harnesses: **197/197 accounted for**.
- Source/non-browser harnesses passed: **29**.
- Browser-dependent harnesses blocked before launch: **168**.
- Build and package: pass.
- Served identity: pass at start and end.
- Log integrity: pass.
- Overall release result: fail/hold because blocked checks cannot certify gameplay.

Passing harnesses were:

`combat-impact-contract`, `campaign-import`, `repair-lifecycle`, `story-opening`,
`script-route`, `scratch-reach`, `hero-feedback`, `tutorial-controller`,
`offline-release`, `sage-specials`, `tutorial-clarity`, `story-progression`,
`input-focus`, `voice-handoff`, `desktop-protocol`, `cave-ground`, `seam-route`,
`shadow-ground`, `dialogue-audio`, `weapons`, `gear`, `motion-sampling`,
`combo-routing`, `credits`, `tails`, `grapple-contract`, `reel-contract`,
`campaign-contract`, and `studio-collector`.

These confirm the intended rules, lifecycle, bounded evidence driver, audio decay,
credit coverage, input-focus clearing, source combat contracts, story ordering,
and several topology contracts. They do not prove rendering or playability.

## Fifteen senior-role verdicts

| # | Senior responsibility | Verdict | Evidence boundary |
|---|---|---|---|
| 1 | Cinematic Designer | HOLD P1 | Forty-page Draft 3 still lacks literal forty-row runtime parity. |
| 2 | Game Designer — Player Systems | HOLD P1 | Last real-input journey stalls in mandatory held-heal lesson; current browser evidence blocked. |
| 3 | Mission Designer — Quest Craft | HOLD P2 | Cave purposes exist in source, but natural discovery/return loops remain unproven. |
| 4 | Principal Encounter Designer | HOLD P1 | Gravehorn's newest mechanics evidence remains red and incomplete. |
| 5 | Senior Boss Designer | HOLD P1/P2 | No-kill ritual source exists; only Glitch has a current mapped ritual film. |
| 6 | Mission Designer — Campaign | HOLD P1 | No cleared-save ordinary-input journey reaches B1. |
| 7 | Mission Producer | HOLD | Scope, evidence classes, branch safety, deduplication and handoff are controlled; release gates remain red. |
| 8 | Character Artist | HOLD P1/P2 | Gravehorn placeholder and flattened bound beasts remain below hero-relative quality. |
| 9 | Cinematic Director | HOLD P1/P2 | Manhwa parity, Gravehorn intercuts, four rituals and three panel corrections remain open. |
| 10 | VFX Artist | source PASS / rendered HOLD | Eye contract is correct in source; complete rendered pose/device certificate absent. |
| 11 | Technical Director — World Systems | HOLD P1/P2 | Roomcache spike, terrain/boss-space timeouts and clean campaign remain unresolved. |
| 12 | Gameplay Engineer — Combat | HOLD P1 | Held charge/heal, gait determinism and Gravehorn state chain remain red. |
| 13 | Gameplay Engineer — Mission | driver PASS / campaign HOLD | Route-memory and fail-closed contracts pass; B1 and optional loops do not. |
| 14 | Gameplay Engineer — NPC | staged Sage PASS / journey HOLD | Authored rescued walk exists; natural purification/Servo/device proof remains open. |
| 15 | Lead UI Engineer | HOLD P1/P2 | Opening reliability, CJK fixture intent, toast capacity and physical input remain open. |

## Priority findings

### `INPUT-HOLD-01` — P1, open

The latest applicable browser evidence shows a normal claw tap delivering 12
damage and knockback while a 950 ms real `KeyX` hold never reaches the 0.6 s charge
threshold. The uninterrupted campaign separately held `F` with 99 volts and 6/7
cores from 07:09 until the 40-minute timeout without healing. Source contracts and
focus clearing pass, but do not explain the runtime failure.

Investigate raw key state → `inD` → fixed-step `dt` → `chargeT`/`healT` through
focus, visibility, overlays and lesson ownership. Do not shorten 0.6/0.85 s
thresholds, auto-complete the lesson or add blind waits. Acceptance is three clean
real-input runs proving tap, hold, release, charged contact, finite particles,
knockback/freeze/shake ownership, heal cost, one restored core, one lesson advance,
and save/load continuity.

### `GH-MECH-01` / `GH-ART` — P1, open

Freshest mechanics evidence fails introduction/name-card progression, charge and
missile chains, recoveries, horn return, phase two, rear-kick impact and chained
charge before timeout. Direct gameplay-size reinspection shows a translucent pink
procedural rhinoceros beside a finished painted hero. Neither
`assets/characters/gravehorn/` nor `assets/source/gravehorn/` exists.

Fix state/clock behavior without changing tells, collision, damage, parry, reward
or no-kill semantics. Separately produce the queued fourteen-part gunmetal/bronze
rig with both facings, planted hooves, complete joint overdraw, separate horns,
phase-two separation and down/retreat continuity. Require three clean mechanics
passes and gameplay-size idle/tell/contact/recovery/phase/down/retry captures.

### `COMBAT-GAIT-01` — P1/P2, open

At equal traveled distance, changing only wall-clock time changed 39 pixels in the
October 28 guard. Make visible gait depend on state and traveled distance, preserving
facing, authored distance banking, planted feet and airborne plates.

### `CAMPAIGN-B1-01` — P1, open

The newest uninterrupted journey completed Ratchet's letter, battery, repair,
explanation, pod, funding and Volt Pack purchase, then stalled in heal teaching.
It never certified Servo, raw marble, forge, Sage, CHIME, NULLFANG or B1. The
CV1B checkpoint diagnostic crossing CV2→CV3 is useful but cannot replace a clean
campaign. Acceptance is one cleared-storage ordinary-input run to the B1 teaser
without any flag, inventory, save, position, progress or teleport injection.

### `MANHWA-PERF-01` — P1, open

Draft 3 defines forty pages; the revised folder contains 32 page images and the
editorial review requires pages 16–40 to be produced/restaged. Sequence IDs and a
displayed panel do not prove cradle/lamp acting, battery/socket contact, necklace
handling, marble/forge contact, Sage timing, CHIME casing/vent work or NULLFANG
cable assistance. Acceptance is a literal forty-row ledger with cast, props,
earned equipment, exact action, VFX, audio, trigger, gameplay capture and verdict.

### `CAVE-JOURNEY-01` — P2, open

Source contracts confirm mandatory ordering and distinct cave topology, but not
natural meaning. Alpha remains correctly optional in source and does not gate camp,
NULLFANG or B1. Acceptance is ordinary-input offer → landmark → discovery/action →
reward → visible consequence → return/reload for every optional loop, plus a
separate mandatory B1 completion without Alpha.

### `EYE-VFX-01` — source pass / rendered hold

`js/infection-eyes.js` preserves red ordinary eyes; purple bosses, Sages and Alpha;
current-frame transformed anchors; world-space emission from body travel; fixed
simulation clock; 1.125–1.875 s lifetime; 90/170/260/320 caps; >90 px discontinuity
clear; cure/death/removal/teleport/room cleanup; duplicate suppression; and
reduced-motion glow without smoke. October 28 core/roster passed once, but the
105-pose sweep timed out and later isolated attempts were unstable. Acceptance is
all three integrity-valid suites on one pinned build plus low/mid/high physical
device frame-time, pool, memory, thermal and post-cure counts.

### `WORLD-PERF-01` — P1/P2, open

Latest applicable evidence records a 114 ms B2→B7 crossing against a 90 ms budget
and a 2998 ms bake-ahead frame; functional caching assertions passed. `terrainrun`
and `bosspace` timed out. Reproduce three times on one pinned host, profile the
exact slice and divide the work. Do not raise budgets to hide it.

### `UI-CJK-01` / `UI-DENSITY-25` — P2, open

The Chinese fixture fit as a single 467 px line inside a 548 px box, contradicting
the test's two-line expectation but not proving clipping. Validate the production
font and kinsoku with a genuinely over-width sample. `G.toast` remains unbounded;
add finite priority, deduplication, capacity and deterministic retirement while
preserving paused lifetimes and narrative priority.

## Cave census

| Area | Intended value | Evidence |
|---|---|---|
| A5 | cracked floor, Mind Node, Magnet crest, quarry history | source/staged |
| A7 | survey and once-only Ratchet payment | source/staged |
| CV1 | bound crawler and max-core chest | source/staged/historical |
| CV1B | survey pod, chart, shortcut, rest/respawn | historical journey/checkpoint |
| CV2 | Deaf System/beacon and quarry route | checkpoint diagnostic |
| CV3 | Gravehorn, raw marble, changed return route | source/staged; encounter red |
| GA1T/GA1/GA1D | refuge, bench, first Sage, network rescue | source/staged |
| A11 | secret coin | source/staged |
| A12 | dash-return challenge and star relic | source/staged |
| A13 | Servo/Warden history and coin | source/staged |
| A10/GA2/GA2T/GA2D | optional Alpha, friendly pack, Warden ledger, Pack Sage | source/staged; natural loop open |

## Story/manhwa parity

| Beat | Best evidence | Open acceptance gap |
|---|---|---|
| Wake/bay/gate | October 28 real-input journey | literal cradle/umbilical/lamp acting |
| Letter/drawer/repair | journey; polished repair frame | body/hand/socket continuity |
| Ratchet explanation | journey | necklace/battery acting |
| Pod/Volt Pack | journey | held-heal completion; physical touch |
| Cave/Gravehorn/raw marble | source/staged/checkpoint entry | reliable encounter, acquisition and return |
| Forge | source/staged | hand/tool/material contact in journey |
| Passage/Meadow Sage | source/staged | uninterrupted rescue/friendly recovery |
| CHIME/NULLFANG | source/staged/historical | clean journey; casing/cable acting |
| Purification | staged logic; Glitch film only | hero performance and four current films |
| B1 teaser | historical | fresh uninterrupted completion |

## Animation, cinematic and VFX matrix

| Subject | Current verdict | Required acceptance |
|---|---|---|
| Hero | approved/preserved | do not regenerate |
| NULLFANG | authored motion assets present | fresh rendered timing/contact certificate |
| Alpha/pack | identity-specific strips present | optional natural rescue/reload proof |
| Sage walk | staged green | natural purify→walk→return→reload |
| Gravehorn | procedural placeholder | fourteen-part rig and four triggered intercuts |
| Bound wolf/cheetah | flattened crouch/down fallback | four-cell down/breathe/recover strips |
| Furnace | body exists; six plates absent | breath/blast/spent/gather/dive/bell |
| Purifier hero | regular body under VFX | raise→hold/gather→slash→recover, both facings |
| Guardian rituals | Glitch current; four absent | identity film, audio and picture fade |
| Eye trails | source contract correct | stable core/roster/105-pose and device certificate |

## Gameplay-size visual inspection

No new capture could be produced without Chromium. Because production source is
unchanged, retained current-build frames and source panels were freshly reopened at
gameplay size:

- Gravehorn remains readable but looks like translucent line-art/development
  visualization beside the finished hero.
- Bound wolf remains too tiny and horizontally compressed to communicate breathing,
  injury, identity or rescue.
- `m_down.webp` visibly gives NULLFANG red eyes instead of boss-purple.
- `r_cell.webp` visibly gives the supposedly inactive background Servo lit amber
  eyes and a cyan chest.
- `passage_b.webp` retains an elongated, humanoid rear hero instead of the compact
  robot-cat anatomy.
- The Ratchet repair board remains the strongest production-ready tutorial frame.

Any correction to the three comic panels must be a masked local edit preserving
dimensions, camera, lighting, props, Ratchet and unrelated pixels. The previous
full-frame rerender is not acceptable.

## Implemented, tested, integrated and deployed

| Category | October 30 status |
|---|---|
| Implemented production change | none |
| Implemented review-tool change | none; October 29 preflight fix revalidated at full scope |
| Tested | build/package, 197 harness accounting, 29 source passes, identity, integrity, 10 audit units |
| Visually inspected | retained current-build gameplay frames and three source panels |
| Integrated into `main` | no |
| Deployed | no |

No speculative production edit was made: the known P1 gameplay problems require a
working browser for safe reproduction and validation, and no completed asset should
be regenerated merely to create a daily branch delta.

## Blockers and unverified scope

- Chromium absent; Playwright archive downloads are empty/truncated.
- No fresh staged rendered browser evidence.
- No October 30 uninterrupted clean-save campaign.
- No physical touch/controller/remap test.
- No physical low/mid/high-tier performance, memory or thermal profile.
- No fresh audio playback/fade verification for guardian films.
- No complete forty-page parity certificate.

## Release recommendation

Keep production on hold. Selectively integrate the October 29 collector preflight
fix if it has not yet reached the implementation branch. Then fix held input and
Gravehorn, obtain a pinned-browser focused suite, and complete one clean campaign
to B1. Do not treat source contracts, viewport emulation, checkpoint diagnostics or
blocked harnesses as substitutes for gameplay acceptance.

