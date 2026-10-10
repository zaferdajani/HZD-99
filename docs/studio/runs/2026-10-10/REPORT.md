# CLAWBYTE studio audit — 2026-10-10

## Decision

First-run evidence: 36/37 selected harnesses passed after environment retries; eye-roster timeout remains open. Both builds rendered77 rooms without page errors. This is not the full161-harness release suite.

**Conditional integration of bounded fixes; chapter-one quality certification remains open.** This is the first run of a new recurring 15-role review. The audited baseline is `47fea7bef2e88c971cc6875c736a3a8d91012ae1`. The owner explicitly requested a separate branch for Claude: `codex/studio-review-2026-10-10`. No production merge or deployment is performed by this audit.

## Baseline and scope

The main page fetched during this run and the pinned baseline page are byte-identical, build `504570b027e7`; see live.json for SHA-256. This resolves the previous stale-page observation. It verifies the HTML only, not every asset or physical-device experience. The review branch changes are not live.

Three independent specialist agents covered design (six roles), art (three roles) and engineering (five roles); the root agent acted as Senior Mission Producer. Fifteen reusable role prompts and a machine-readable roster are included. Roles describe senior review duties; they are not fifteen human employees or permanent running processes. The recurring automation reconstitutes the review on each run.

Evidence types: **observed** = inspected actual rendered image; **automated** = harness result; **source** = inspected implementation; **historical** = repository evidence predating this run; **unverified** = required work not demonstrated. The report does not convert historical passes into fresh evidence.

## Fifteen role verdicts

| Role | Verdict | Evidence / remaining gate |
|---|---|---|
| Senior Cinematic Designer | Issues | Event map and panels lifecycle; eight missing scene groups |
| Senior Player Systems Designer | Issues | Opening now sequences battery/pod/pack; transient contradictory booth prompt fixed |
| Senior Mission Designer, Quest Craft | Issues | Cave census improved; A7 still rewards visit without survey evidence |
| Principal Encounter Designer | Not certified | Staged encounters and gates checked; no continuous full chapter |
| Senior Boss Designer | Issues | Alpha/pack visual mismatch; boss difficulty/feel not certified by scripted checks |
| Senior Mission Designer, Campaign | Not certified | Canon route implemented; unbroken journey still required |
| Senior Mission Producer | Conditional | Evidence/branch discipline in place; production withheld pending integration |
| Senior Character Artist | Issues | Real strips inspected; Alpha identity mismatch; preserve richer existing Servo |
| Senior Cinematic Director | Issues | Missing parity scenes and baked English text |
| Senior VFX Artist | Issues | Finite smoke and budgets implemented; Mother multi-optic mapping uncertain |
| Senior World Systems Technical Director | Partial | Room/gate and cave checks; survey connection defect withdrawn after inspection |
| Senior Combat Gameplay Engineer | Partial | Lion and VFX focused checks; physical haptics/audio not verified |
| Senior Mission Gameplay Engineer | Issues | Improved early discovery; A7 completion semantics remain weak |
| Senior NPC Gameplay Engineer | Partial | Source revival/dialogue and rescue persistence; fresh Servo presentation evidence required |
| Lead UI Engineer | Fixed defects + open gates | Long-word wrap and booth prompt fixed; touch/full opening evidence separately recorded |

## Findings and branch fixes

### QA-01 — P1: tests could succeed without running requested coverage — FIXED
`tests/run.cjs` accepted unknown names and silently skipped missing registered files. A misspelling could certify nothing. It now fails both conditions. Isolated runner validation exercised both cases; the evidence collector also rejects unknown names and records missing tests as failures. Owner: engineering/producer.

### UI-01 — P2: long second word overflow — FIXED
`js/reveal.js` bypassed splitting when an oversized word followed ordinary text. Reproduction at width five: `Hi abcdefghijklmnop`. The renderer now flushes the prior line before its existing grapheme-safe split. Real Canvas URL-width regression added in `tests/textreveal.cjs`; browser result is logged. No new artwork or character geometry changed.

### UI-02 — P2: entering Ratchet's booth briefly told the player to leave — FIXED
Observed in fresh `desktop-08-booth-up.png`: objective Wake Ratchet, but tutorial card Back outside with an exit marker. This was a completion-delay artifact, not a stuck campaign. `tutPrompt` suppresses the completed booth instruction inside A0B; `drawTutor` clears the stale card through the hold. `tests/tutorial-clarity.cjs` covers both phases. Acceptance: no exit instruction between entering booth and the letter lesson.

### QA-02 — P2: ordinary transit doors counted as cave rewards — FIXED
`tests/caves-ch1.cjs` used door destinations in reward signatures. Different empty corridors could pass as distinct payoffs. It now uses explicit payoff categories, includes an empty-transit negative case, and accounts for already-collected marble using the observed pre-forge pillar. This strengthens meaning, not an arbitrary count. Runtime cave rewards are unchanged.

### DOC-01 — P3: stale quest comments contradicted current canon — FIXED
`js/quests.js` still described the marble burning infection away, waking Ratchet with the hero's cell and quest items appearing only after acceptance. Comments now match inherited marble slowing infection, his drawer battery and early discovery. Narrative behavior was not rewritten to fit stale comments.

### ART-01 — P1: Alpha and pack are visibly different designs — OPEN
Actual prowl art inspected: upgraded pack uses clean graphite/ivory armour; Alpha uses a spiky bronze/black body and exposed red ribs. `docs/ART_QUEUE.md` already queues the mismatch. Generate the complete Alpha state set from the pack reference, not a still image. Preserve distinct boss size/moves. Acceptance: state/facing contact sheet plus gameplay clips and runtime purple eyes. Owner: Character Artist/Boss Designer.

### CIN-01 — P1: required manhwa moments lack matching panels — OPEN
Missing groups: marble extraction; corrected letter/repair; lion resistance/reinfection; Sage revelation; maintenance passage; on-model lion encounter/fight; hatch departure; chapter-two pages. `docs/MANHWA_EVENT_MAP.md` discloses these. Existing teaser uses a tunnel crop and a background. Do not present it as a new chapter-two manga. Owner: Cinematic Director/Designer.

### UX-03 — P2: baked English image text does not progressively reveal — OPEN
Some panels carry raster lettering and suppress duplicate English captions. New captions typewrite, existing image lettering does not. Use carefully authored unlettered variants plus localized overlays for important narrative. Preserve original art and wait-for-confirm behavior.

### MIS-01 — P2: A7 survey is still a visit checkbox — OPEN
`ratchet_deep` remains kind reach, room A7. Early discovery reads visited.A7, not terminal20 activation. Reward can precede the intended survey discovery. Link new completion to actual evidence, remember early completion and preserve paid old saves. Owner: Mission Designer/Engineer.

### VFX-01 — P2: multi-optic coverage uncertain — OPEN, visual validation required
`infEyeMark` caps two eyes per body; Mother registrations map core plates. Inspect intended actual eyes before expanding anchors. A luminous core is not automatically an eye. Global budgets must stay bounded. Smoke lifetime is 1.5 ±25%, i.e. 1.125–1.875 seconds; avoid reporting an exact universal 1.5 seconds.

### QA-03 — P1: no uninterrupted chapter-one campaign evidence — OPEN
The existing walkthrough explicitly distinguishes the opening's real-input play from later staged saves. `chapter-one` stops after the Sage. Complete normal-input traversal through CHIME, NULLFANG and the teaser remains mandatory for campaign certification. This audit does not disguise staged tests as that run.

### QA-04 — P2: shared test-server identity — MITIGATED IN NEW PIPELINE
The old runner accepts any successful index.html on port8220. The new collector compares the served bytes to this checkout and blocks mismatch. Isolate concurrent builds; do not rebuild a served artifact during a release verification run. The old general runner still merits the same protection.

### Withdrawn hypothesis
Surveyed quarry rooms appeared potentially disconnected because connector lines require visits. Inspection showed CV1/CV2/CV3 rectangles touch by design. No map-renderer change was made; this is not listed as a defect.

## Cave census

| Area | Current distinct outcome | Review |
|---|---|---|
| A5 | Puzzle, Magnet crest, buried quarry entrance | Purposeful gateway |
| A7 | Survey log + Ratchet coin errand | Completion tied only to visit; improve |
| CV1 | Spare core upgrade, hidden branch | Meaningful capability reward |
| CV1B | Rest/survey pod charts quarry, shortcut | Useful facility; verify navigation in play |
| CV2 | Deaf System founding log / beacon | Knowledge payoff, not new equipment |
| CV3 | Raw marble, later maintenance route | Main objective; return changes guidance |
| GA1T | Sage history and junction | Story context; transit itself not reward |
| GA1 | Rest point, later lion shortcut | Practical utility |
| GA1D | Sage rescue, revelation, friendly network | Strong world-state change |
| A11 | Coin relic | Small optional secret |
| A12 | Dash-gated Star Fragment | Return-with-ability reward |
| A13 | Servo-related watch log + coin | Distinct history, modest loot |
| Alpha network | Friendly pack, cell/scrap, Pack Sage | Optional; preserve bypass |

Census is source and staged-harness evidence. It does not establish exploration pacing or prove every reward feels worthwhile.

## Art and effects evidence

See ART_REVIEW.md. Actual assets and archived shots were visually inspected, plus fresh opening screenshots. Existing Servo art is detailed; do not replace it merely because old screenshots were poor. No new raster generation or full animation replacement is claimed in this audit. The UI presentation fixes are the bounded visual changes shipped on this branch. Alpha and missing panels remain production work in the handoff.

## Automation and integration

Daily review automation was created successfully for Europe/Madrid mornings. It reads this branch's pipeline until integrated, compares future changes, runs tests and produces a new review branch/report/prompt. Execution still reports tool/runtime blockers honestly. The source collector defaults to full regression; focus/subset runs are explicitly partial.

Generated HTML is not included in the handoff commit: Claude must rebuild all four pages after merging source to avoid stale output and unnecessary generated-file conflicts. Source edits and tests were validated against locally rebuilt pages. The branch must not be called deployed.

Fresh visual evidence: images/booth-before.jpg (observed contradictory instruction), images/booth-after.jpg (staged transition after fix), images/servo-desktop.jpg (fresh opening capture), images/art-contact.jpg (source/archived comparison). The after image is staged and not a full campaign replay.

See VALIDATION.md for this run's exact results and limitations. See CLAUDE_PROMPT.md for the single integration instruction.
