# CLAWBYTE senior studio review — 2026-10-22

## Executive decision

**Keep this as a review branch. Do not merge or deploy yet.**

The owner-reported rescued-Sage defect was real and is fixed on this branch. A
purified Sage previously translated under its calm AI while the renderer forced
the stationary rescued/kneeling plate, producing the sleeping slide. It now eases
into the shared ground gait, selects the existing eight-frame Sage walk with the
purified material, and returns to the rescued idle only when stopped. The new
production-path harness passes and a gameplay-size frame was inspected.

A second bounded change fixes the chapter-one evidence driver, not the game: a
player-width quarry hatch was already open, but the driver kept attacking the one
remaining decorative column. The driver now recognizes any complete open column
through both breakable rows. The fresh post-fix route then certified B1 in 17:36
without injecting flags, inventory, teleports, damage or terrain changes.

The story, combat-impact system and finite red/purple eye trails remain strongly
implemented in source and targeted checks. Release is still held by phone/device,
full-collector and production-art gates: GRAVEHORN, bound-creature recovery,
Furnace poses, authored hero purification motion, four ritual films, three panel
corrections, real-device input/haptics/performance and listened audio endings.

## Repository and publication state

| Item | Value |
|---|---|
| Review branch | `codex/studio-review-2026-10-22` |
| Parent review commit | `4863de931ac2e3604b72c614a5f0a6e00c078b26` |
| Production `main` at final fetch | `62d75d204c6f6264f25150bb419fc262ff2c18ea` |
| Integration branch at final fetch | `62d75d204c6f6264f25150bb419fc262ff2c18ea` |
| Upstream production/integration movement since prior report | None |
| New/generated production art | None |
| Merged | No |
| Deployed | No |

This branch deliberately continues the cumulative October 17–21 review lineage.
That lineage is not yet integrated into `main`.

## What changed

### `NPC-SAGE-WALK-22` / P1 — fixed

**Player consequence:** after rescue, the first Sage looked asleep while sliding
across the ground.

**Cause:** the calm branch moved the entity; `WALKERS` excluded `sage`; and
`drawSage()` classified every tamed Sage as kneeling regardless of velocity.

**Fix:** add Sage to the shared gait, distinguish moving rescued state from idle,
select `sageWalk8` with `pure:true` while moving and preserve `sagePure` at rest.
Hostile duel logic, speed, damage, defenses, collision and save facts are unchanged.

**Evidence:** `postfix/sage-walk.log` and `sage-walk.png`. The retained run measures
128.47 px body movement, 123.86 px distance gait, acceleration 34.62 → 86.41 px/s,
the eight-cell strip with purified material, rescued idle and reload persistence.

### `QA-HATCH-DRIVER-22` / P1 — fixed in certification only

**Player consequence:** none in production. The real-input evidence run could
misreport a usable route as blocked and pogo on a leftover decorative tile.

**Cause:** it tested whether any `B` remained in a three-column slice. The saved
run showed columns 12 and 13 open through both rows—a 64 px shaft—while column 14
remained solid.

**Fix:** consider the shaft usable when any one of columns 12–14 is open through
both breakable rows. The driver still uses ordinary movement to enter it.

**Result:** the review-branch route is certified: 17:36, easiest difficulty,
ordinary keyboard, two deaths, all nine missions, all sixteen panels in order,
zero missed panels and zero page errors. Repeat it on the final integrated snapshot.

## Fifteen senior-role verdicts

The 15 responsibilities were instantiated in grouped design, art and engineering
reviews. Each verdict remains independent.

| # | Senior responsibility | Verdict | Primary evidence/reason |
|---:|---|---|---|
| 1 | Cinematic Designer | Issues | Correct event order; literal physical manhwa actions remain incomplete. |
| 2 | Game Designer — Player Systems | Issues | Desktop real-input opening completes; phone-mode and physical touch completion remain open. |
| 3 | Mission Designer — Quest Craft | Issues | Cave purposes exist; several optional acquire/return/consequence loops lack natural-play proof. |
| 4 | Principal Encounter Designer | Issues | Combat/placement contracts exist; optional encounters and device feel are not fully certified. |
| 5 | Senior Boss Designer | Issues | Alpha is optional and wolf-specific; GRAVEHORN/ritual performances remain incomplete. |
| 6 | Mission Designer — Campaign | Issues only for optional scope | Mandatory post-fix route certifies; Alpha/all optional caves remain outside the run. |
| 7 | Character Artist | Issues | Sage state fixed; GRAVEHORN, bound-down, Furnace and ritual body art remain open. |
| 8 | Cinematic Director | Issues | Lion film exists; four principal films and exact action continuity remain open. |
| 9 | VFX Artist | Pass for bounded infection-eye system; device gate open | Red/purple anchors and finite lifecycle pass; sustained real-device budget unverified. |
| 10 | Technical Director — World Systems | Issues | Mandatory route/topology pass; device and retained full-collector evidence remain open. |
| 11 | Gameplay Engineer — Combat | Pass in source/automation; device gate open | Hit flash, sound routes, particles, recoil/knockback, hit-stop, charge and purification contracts exist. |
| 12 | Gameplay Engineer — Mission | Pass for mandatory route | Hatch driver fixed; 17:36 run certifies all missions/panels. Optional scope remains open. |
| 13 | Gameplay Engineer — NPC | Pass for Sage fix | Saved clean Sage uses authored purified gait, rescued idle and persists across reload. |
| 14 | Lead UI Engineer | Issues | Desktop opening completes; phone-mode stops after repair; physical touch/orientation remains open. |
| 15 | Senior Mission Producer | Hold integration/release | Bounded fixes are sound; art, unsegmented, device and audio gates remain open. |

Discipline detail: [DESIGN.md](DESIGN.md), [ART.md](ART.md),
[ENGINEERING.md](ENGINEERING.md).

## Story and chapter-one contract

The source still follows the owner-approved causal route:

1. Mother's song maintained robot harmony.
2. An unknown entity infected the frequency.
3. The hero was already asleep/recharging, missed the broadcast and was forgotten.
4. An electrical short woke the hero.
5. Ratchet's marble pendant slowed infection; he removed his own battery.
6. The player reads his letter, finds the unique cell and completes the board repair.
7. Ratchet gives a separate Servo spare and explains the pod/Volt Pack path.
8. The forward monument and Old Servo point toward the quarry.
9. GRAVEHORN guards raw marble; Ratchet forges the first white purifier sword.
10. The Meadow Sage is rescued, CHIME is silenced, and NULLFANG is purified.
11. The friendly restored lion and B1 teaser close chapter one.

The lion cannot be resolved before the sword. Alpha remains an optional post-forge
Lost Wardens side quest and cannot become a prerequisite for marble, Sage, CHIME,
NULLFANG or B1.

## Continuous play versus staged evidence

| Evidence | Result | What it does and does not prove |
|---|---|---|
| October 21 continuous campaign on parent | Passed to B1 in 16:39, two deaths, ordinary keyboard, easiest difficulty | Strong prior route evidence; not a new execution of today's changed driver. |
| October 22 baseline continuous attempt | Reached GRAVEHORN, marble and forge; then spent >25 minutes at a usable partial hatch | Found the driver defect. It did not complete and is not certification. |
| October 22 post-fix continuous campaign | **Certified complete in 17:36**; easiest difficulty; ordinary keyboard; 2 deaths; 9/9 missions; 16/16 panels in order; 0 missed; 0 page errors | Fresh cleared storage and no progression mutations. Read-only planner, seven recovery/stuck frames, video off and optional Alpha exclusion are disclosed. |
| October 22 focused Sage harness | Passed | Real production update/draw/save paths; staged tame flag, not a complete campaign. |
| October 22 focused browser set | 9/9 pass after correcting test-only fixture mistakes | `sage-walk`, Sage/quiet, enemy gait, infection eyes, story rescue/order and both purification checks pass together. |
| October 22 `opening-order` | Mixed: desktop passed all beats through Servo; phone ended in A0B after repair | Real-input desktop improvement is verified. Phone-mode is still a failed finite gate; no page errors. |
| October 22 full collector attempt | Infrastructure interrupted; transient checkout removed after reaching `cachemoves` | Lost artifacts are not durable evidence and are not counted as a passing suite. |
| Physical phone/controller | Not run | Viewport emulation is not device certification. |

## Cave census

| Area | Intended value | Review verdict |
|---|---|---|
| A5 | Loose-floor landmark, Magnet riddle, maintenance history, quarry mouth | Mandatory and causal; hatch driver corrected. |
| A7 | Survey terminal read and once-paid return | Meaningful source; fresh natural return not certified. |
| CV1 | Bound crawler and optional max-core pocket | Distinct content; optional acquisition/revisit not fully certified. |
| CV1B | Survey pod, map/chart, shortcut/rest | Useful navigation/save space. |
| CV2 | Deaf System evidence and beacon/lure | Story purpose exists; player comprehension not measured. |
| CV3 | GRAVEHORN, raw marble, changed post-forge return | Mandatory payoff; art remains P1. |
| GA1 | Refuge, Sage and network rescue | Core story payoff; rescued motion fixed. |
| A11–A13 | Optional currency, traversal reward and Servo evidence | Natural acquisition remains unverified. |
| A10/GA2 | Alpha, friendly pack, cache, ledger and Pack Sage | Correctly optional; full offer→reload side quest not freshly played. |

## Manhwa parity matrix

| Beat | Runtime status | Remaining acceptance |
|---|---|---|
| Wake/bay/gate | Ordered triggers/panels exist | Literal cradle reach and release body performance. |
| Letter/drawer/Ratchet | Ordered and repaired through board | Continuous socket installation action beyond abstraction. |
| First guardian meeting | Triggered before escalation | Preserve earned warning and player agency. |
| Cave/marble | Causal route and reward exist | Approved GRAVEHORN body/intercuts and visible carry continuity. |
| Forge | Correctly precedes Sage/lion | Continuous hand/tool/material contact. |
| Passage | Correct story threshold | Localized hero anatomy correction in `passage_b`. |
| Sage | Rescue/save persistence pass | New walk is functional; richer leg/robe separation may still need approved art. |
| NULLFANG break | Ordered after Sage | Literal cable assistance/catch action. |
| CHIME | Ordered before lion resolution | Literal casing-opening correspondence. |
| Lion freeing | Hold ritual and completed film exist | Authored hero body sequence and purple-eye panel correction. |
| B1 teaser | Correct chapter threshold | Keep gradual readable text and spoiler-safe panel timing. |

## Animation, combat and VFX matrix

| System | Status | Open gate |
|---|---|---|
| Light hit feel | Implemented: enemy flash, layered strike/impact routes, metallic debris, target knockback, hero recoil, shake and hit-stop | Listened mix and physical-device haptics. |
| Charged hit | Implemented with stronger damage/impact rows and longer freeze/recoil cues | Balance across all difficulty/defense tiers. |
| Character stats | Central HP/attack speed/power/defense structures and combat logs exist | Final card/PDF remains a documentation deliverable, not proof of balance. |
| Rescued Sage | Fixed and targeted pass | Art-rich leg/robe separation if owner still finds silhouette weak. |
| Alpha/pack | Approved wolf identity preserved | Full optional natural-input route and device feel. |
| NULLFANG | Authored motion and rescue film preserved | Hero ritual body strip and listened ending. |
| GRAVEHORN | Gameplay exists | P1 authored body/poses/intercuts. |
| Eye trails | Passing red ordinary/purple boss finite contract | Real-device sustained memory/frame time. |

## Open production priorities

1. **P1 GH-ART:** approved articulated GRAVEHORN body set and four matching panels.
2. **P2 BOUND-ART-01:** real wolf/cheetah down, breath and recovery.
3. **P2 FURNACE-ART:** six missing authored states.
4. **P2 PURIFY-ART-01:** hero raise/hold/slash/recover body performance.
5. **P2 RITUAL-FILMS:** Brood, Atlas, Zero and Prism extraction films.
6. **P2 panel corrections:** purple `m_down` boss eyes and dark inactive Servo in `r_cell`.
7. **P3 panel correction:** approved hero anatomy in `passage_b`.

Do not regenerate the approved hero, pack/Alpha, crystal, sword, lion or Talon
assets. Search ledgers and existing files before creating anything.

## Commands and evidence

| Command | Result |
|---|---|
| `node build.cjs` | Pass after source edit. |
| `npm run app:pack` | Pass: 694 assets (244.3 MB) plus two pages (8.2 MB), 252.5 MB total. |
| `CHROMIUM_PATH=... node tests/run.cjs sage-walk sage sage-quiet enemygait infection-eyes story-rescue story-order purification purification-controls` | 9/9 pass; retained in `postfix/focus.log`. An earlier first version of the new fixture exposed test-only strict-boolean/context mistakes and was corrected without changing production code or weakening assertions. |
| `CHROMIUM_PATH=... SAGE_WALK_SHOT=... node tests/run.cjs sage-walk` | Pass; retained in `postfix/sage-walk.log`; screenshot inspected. |
| `CHROMIUM_PATH=... node tests/run.cjs cacheroster npcstrip opening opening-order` | `cacheroster`, `npcstrip`, `opening` pass; `opening-order` mixed/fail after 496.5s: desktop all 15 beats and Servo/coil pass, phone stops after repair in A0B. Retained in `final/tail-opening.log`. |
| `CAMPAIGN_VIDEO=0 CAMPAIGN_MAX_MIN=40 node tests/campaign-ch1.cjs` | Certified complete in 17:36; 2 deaths; 9 missions; 16 ordered panels; 0 missed/page errors. Retained in `campaign/` and `final/campaign-console.log`. |
| `node tests/run.cjs campaign-contract studio-collector` | 2/2 pass; certificate fails closed for missing/late/partial/error cases and evidence snapshots reject loss/corruption. |
| `git diff --check` | Pass. |

The test browser is the checked-in October 21 software-rendered wrapper. It is not
a physical-device result. A server startup failure in `http-server` came from the
host's network-interface enumeration; a loopback-only Python static server served
the same checkout for browser checks.

## Five-state handoff

| State | Truth on this branch |
|---|---|
| Implemented | Purified Sage gait/render selection; new Sage regression harness; quarry-hatch campaign-driver recognition; dated studio reports/prompt. |
| Tested | Build/app pack pass; focused 9/9 pass; 17:36 continuous campaign certified; desktop opening passes and phone opening fails; full same-day collector not retained/certified. |
| Visually inspected | Fresh 844×390 Sage gameplay frame; prior approved asset/panel evidence reviewed. |
| Integrated | No. Production and integration remain at `62d75d2`. |
| Deployed | No production deployment attempted. |

The one handoff to Claude is [CLAUDE_PROMPT.md](CLAUDE_PROMPT.md).
