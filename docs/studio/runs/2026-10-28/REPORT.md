# CLAWBYTE senior studio review — 2026-10-28

## Executive verdict

**HOLD production. Do not merge or deploy this review branch.**

There is no new upstream game/art delta since the October 27 review. The review
nonetheless found fresh red evidence in held input, Gravehorn mechanics,
enemy-gait clock determinism, CJK wrapping, opening reliability, and several
host-budget/render suites. The clean chapter-one run timed out after forty minutes
in Ratchet's heal lesson and cannot certify B1.

One bounded fix is included: the **campaign evidence driver** now retains failed
traversal-edge penalties across recovery model rebuilds. A game-written CV1B pod
checkpoint diagnostic escaped the exact October 27 CV2 x=672/x=744 loop and crossed
CV2 -> CV3 at 05:21 using ordinary keyboard input. No gameplay, geometry, physics,
save, story, animation, VFX, or production art was changed.

## Repository and comparison

| Item | Evidence |
|---|---|
| Review base | `codex/studio-review-2026-10-27` at `33df48884858253013363212547bef2463f7174d` |
| Latest `main` inspected | `573d09d48d6278cf1afb51f66db3d9d014bafefe` |
| Claude integration inspected | `62d75d204c6f6264f25150bb419fc262ff2c18ea` |
| Runner-only branch | `d91f24785278c6cedebdce92c41c6a75713dc242`; workflow declarations only |
| New production delta | none |
| Review branch | `codex/studio-review-2026-10-28` |
| Production action | none; branch push only |

Important integration constraint: the review history does not include `main`'s
unrelated `.claude/skills/founder-*` commit. Integration must merge/rebase
selectively and preserve those files. Never replace `main` with the review tree.

## Evidence model

This report keeps five evidence states separate:

1. **Source-inspected** — code/content exists, but playability is not implied.
2. **Staged harness** — save, room, entity, or position may be prepared.
3. **Real-input journey** — normal input from a clean browser, no progression or
   position injection.
4. **Checkpoint diagnostic** — normal input from the game's own pod save; useful
   for a route defect, never a full campaign certificate.
5. **Physical device** — touch/controller/performance/thermal evidence; not
   completed in this review.

## Automated execution

### Build and packaging

- `npm ci` — pass.
- Browser preflight — Chromium 153.0.8010.0, Latin/Arabic/CJK fonts present,
  WebGL available.
- `node build.cjs` — pass, all four targets.
- `node tools/pack-www.cjs` — pass: 696 assets, 247.3 MB; two pages, 8.2 MB;
  total 255.5 MB.
- `python -m unittest tools.studio.test_audit -v` — 8/8 pass.
- `node tests/campaign-contract.cjs` — pass, including three new route-memory
  contract checks.

### Harness coverage

The original full collector eventually ran all 197 game harnesses. A workspace
transport loss hid its live process; later review-side rebuilds changed the served
files while its tail was still running. Its final summary is consequently not a
certificate: 174 pass, 26 fail, one blocked end identity, and failed overall log
integrity. Fifteen tail failures were immediate served-build refusals caused by
that interference, not product failures. Those 18 tail checks were rerun on a new
pinned build and all passed; `campaign-contract` passed separately. Thus every
non-campaign harness has at least one completed run, but the aggregate as a whole
is not integrity-valid.

Fresh aggregate failures:

| Check | Fresh evidence | Classification |
|---|---|---|
| combat-impact-input | held `KeyX` did not reach charge threshold | reproduced isolated; P1 combat |
| wake | reached A0, not workshop, before journey window | evidence/tutorial reliability |
| textreveal | Chinese remained one line; 467 px inside 548 px box | reproduced isolated; P2 UI/i18n |
| bosspace | 300 s timeout | red, cause unlocalized |
| gravehorn | fixture/state cascade; later isolated mechanics failures | reproduced isolated; P1 encounter |
| terrainrun | 300 s timeout | red, cause unlocalized |
| enemygait | same distance/different clock changed 39 pixels | reproduced isolated; P1/P2 animation clock |
| infection-poses | 420 s timeout after Alpha/Glitch/Brood/Zero | incomplete VFX survey |
| roomcache | 114 ms crossing; 2998 ms bake-ahead frame | P1/P2 performance evidence |
| opening-order | desktop A0, phone-size A0B after 489.6 s | failed real-input certificate |

The aggregate's final identity was blocked and its log integrity was false.
Isolated rerun directories have completed results and integrity manifests. See
`AUTOMATED-INTERRUPTION.md`.

### Real-input chapter one

The clean campaign used cleared storage, keyboard input only, easiest disclosed
preset, and video disabled. It naturally completed:

- menu and difficulty selection;
- five wake panels;
- W1 and W2 tutorial traversal;
- fallen-beam jump and city gate;
- Ratchet booth entry;
- letter before battery;
- unique Ratchet battery acquisition;
- cell, positive lead, ground lead, and relay repair sequence;
- Ratchet revival;
- infected Mother song, protective necklace marble, battery self-removal, hero
  asleep through the broadcast, raw deposit below, and white purifier sword;
- spare Power Cell specifically for Old Servo;
- instruction to use the pod for save/recharge;
- actual pod save/recharge;
- Volt Pack explanation, Ratchet-funded 12 scrap, marked-row purchase, and the
  permanent pack reward card.

The run then entered the forced heal lesson at 07:09. The driver repeatedly held
`F`, but the hero stayed at 6/7 cores with 99 volts until the 40-minute ceiling.
Result: `timeout`, `certified:false`, zero deaths, zero page errors, rooms through
A0B, panels `wake,bay,gate,letter,drawer,ratchet`. This is a failed uninterrupted
real-input certificate. Because review-side rebuilds later invalidated the
collector's final served identity, it is not a formal aggregate certificate; the
held-heal loop is still a preserved observation from the already-loaded page.

### CV2 checkpoint diagnostic

The checkpoint diagnostic resumed from the game-written October 27 CV1B pod save.
It is not a campaign certificate. It logged retained penalties, crossed CV1B ->
CV2, escaped the historical x=672/x=744 alternation, and crossed CV2 -> CV3 at
05:21 using ordinary keyboard input. It later stalled in a CV3 combat/heal loop
and ended at 10:05 with no death and no page error.

## Direct gameplay-size inspection

- **Ratchet repair board:** strong hierarchy, distinct authored parts, legible
  labels, clear inactive targets, keyboard/touch instructions, production-ready.
- **Gravehorn:** readable composition but translucent pink procedural silhouette;
  dramatically below the hero's finish and not shippable boss art.
- **Bound wolf:** flattened tiny strip; does not read as a breathing defeated wolf.
- **Raw-marble UI:** stacked central notices remain dense (`UI-DENSITY-25`).

## Fifteen-role sign-off

| # | Senior role | Verdict | Primary reason |
|---:|---|---|---|
| 1 | Cinematic Designer | HOLD P1 | no literal forty-page performance ledger |
| 2 | Game Designer — Player Systems | HOLD P1 | opening-order failed; no physical-input proof |
| 3 | Mission Designer — Quest Craft | HOLD P2 | optional discovery/return loops not naturally certified |
| 4 | Principal Encounter Designer | HOLD P1 | fresh Gravehorn mechanics red; CV3 combat stall |
| 5 | Boss Designer | HOLD P1/P2 | missing full hero ritual acting and four current films |
| 6 | Mission Designer — Campaign | HOLD P1 | clean run timed out in held-heal lesson |
| 7 | Mission Producer | HOLD | production gates unmet; no merge/deploy |
| 8 | Character Artist | HOLD P1/P2 | Gravehorn debug art; bound/Furnace/purifier gaps |
| 9 | Cinematic Director | HOLD P1/P2 | 40-page and ritual-film gaps; panel defects |
| 10 | VFX Artist | HOLD | correct source; inconsistent/incomplete fresh render evidence |
| 11 | Technical Director — World | HOLD | roomcache/terrain/device performance unresolved |
| 12 | Gameplay Engineer — Combat | HOLD P1 | charged input and fresh boss mechanics red |
| 13 | Gameplay Engineer — Mission | PASS bounded fix / HOLD campaign | CV2 loop escaped; B1 still unverified |
| 14 | Gameplay Engineer — NPC | PASS staged / HOLD journey | Sage walk fixed; Servo arc not freshly completed |
| 15 | Lead UI Engineer | HOLD P1/P2 | opening, CJK wrapping, toast density |

## Producer priority register

### P0 — no ship

- Do not merge/deploy while the clean B1 campaign is unverified.
- Preserve `main`'s unrelated founder-skill files during any integration.
- Keep Alpha optional and keep raw marble -> forge -> Sage -> CHIME -> NULLFANG
  order intact.

### P1 — next engineering/art gate

1. Diagnose and fix held-charge input in the normal real-time loop.
2. Restore Gravehorn intro, move/recovery clocks, phase two, and three clean runs.
3. Produce approved Gravehorn rig/intercuts; do not ship the procedural silhouette.
4. Repair opening-order semantics and obtain three clean desktop/phone-size runs.
5. Fix/diagnose the held-`F` heal lesson and obtain one uninterrupted cleared-save
   B1 campaign after the driver fix.
6. Fix enemy gait's wall-clock dependency.
7. Investigate roomcache's 114/2998 ms frames on stable and physical devices.

### P2 — quality and parity

- bound wolf/cheetah down strips;
- six Furnace action plates;
- hero purification raise/hold/slash/recover strip;
- four guardian-specific current ritual films with soft picture/audio ending;
- forty-page manhwa parity ledger and missing/restaged pages;
- masked corrections to `m_down`, `r_cell`, `passage_b`;
- finite toast priority/dedupe/cap and CJK wrapping;
- ordinary-input optional Alpha/cave return certificates;
- physical low/mid/high-tier eye-trail and performance profiling.

## Files in this review

- `DESIGN.md` — roles 1–6 and cave/manhwa matrices.
- `ART.md` — roles 8–10 and gameplay-size findings.
- `ENGINEERING.md` — roles 11–15 and full check classification.
- `AUTOMATED-INTERRUPTION.md` — transport/interference and identity boundary.
- `CLAUDE_PROMPT.md` — one copyable implementation/integration prompt.
- `automated/` and `reruns/` — retained raw logs, results, captures, and diagnostics.

## Release decision

**Branch may be reviewed and selectively integrated. Production remains HOLD.**
No merge or deployment was performed by this review.

