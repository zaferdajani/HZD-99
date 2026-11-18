# CLAWBYTE Senior Studio Review — 2026-11-18

## Executive decision

**RELEASE HOLD — P1.** The current game builds and its strongest systems are materially better than the 2026-11-17 baseline: all seven Eye agents now have distinct fired pose families, TALLYMAN has a moving rig, GRAVEHORN has authored rear/turn/tail coverage, the wolf work is visually coherent, 18 manhwa panels are now in the November refire set, and the combat-impact source contract remains strong. This review also restored four regressed safety contracts and the owner-mandated PURIFY terminology on the review branch.

It is not ready to merge or deploy. The playable chapter still certifies a campaign graph that contradicts the latest owner canon, Alpha is offered at the wrong time and concludes with guardian-like purification semantics, six rescued agents can still slide in a kneeling/pure plate, Ratchet/NPC restoration is not atomic, two world-integrity regressions remain, and no browser could open in this environment. Consequently, there is no fresh uninterrupted real-input playthrough, gameplay-size runtime capture, physical audio/haptic check, or device proof.

This branch is a review and bounded-safety-fix branch only. **Production was not merged or deployed.**

## Pins and branch safety

| Item | Value |
|---|---|
| Repository | `zaferdajani/HZD-99` |
| Intake `main` | `81a6cabc4c62d878a97c1a4689ba6fafaaa1e362` |
| Intake tree | `f25a8bbd60df7a1577295df6e764fa2099cae53e` |
| Intake `odyssey` | same commit as `main` |
| Intake integration branch | `claude/clawbyte-repo-migration-byhyl8`, same commit as `main` |
| Previous review | `codex/studio-review-2026-11-17` at `01a4c684…`; not an ancestor of intake `main` |
| Review branch | `codex/studio-review-2026-11-18` |
| Bounded source-fix verification commit | `9279a3675c381dc30b9ce8b775051efe3b72f58a` |
| Rebuilt-page verification commit | `12e785fa55bd5177bbf08c4e8bd4e034bfc43513` |
| Automated audit base | `12e785fa55bd5177bbf08c4e8bd4e034bfc43513` |

The review began from a clean fresh branch at exact remote `main`. Other contributors' new art and code were preserved. No completed art was regenerated. The bounded source corrections were built and tested in the verification workspace. For connector-safe later integration they are also packaged as [`0001-studio-restore-review-safety-contracts-on-latest-art.patch`](0001-studio-restore-review-safety-contracts-on-latest-art.patch); apply it to the newest `main`, resolve semantically around newer work, and rebuild the tracked pages.

## What changed since the 2026-11-17 review

### Confirmed improvements on `main`

- All seven Eye agents now have distinct asset families under `assets/characters/agents/` and distinct six-pose source sheets under `assets/source/agents/`.
- TALLYMAN has `js/agentrig.js`, mixing continuous rig motion with fired large pose plates.
- GRAVEHORN received rear, three-quarter, tail, and turn work; returning-horn collision and anti-pogo buck shock were strengthened.
- Alpha and wolf stored gameplay sheets show a readable wolf-specific silhouette and multiple states; preserve these assets.
- The November manhwa refire set grew from 17 to 18 with `m_stalk`; TALLYMAN naming improved in the event map.
- Wolf Run's pod/door interaction overlap was corrected.
- Combat source still contains HP, attack, defense/armor, attack cadence, bounded combat logging, normal/heavy/charged impact hierarchy, flash, metallic debris/sparks, clash sound, recoil, hit-stop, shake, and haptic calls.

### Regressions found on `main` and repaired on this review branch

| Fix | Review-branch result | Contract |
|---|---|---|
| Guardian ritual wording had reverted to “Free/Release” in five languages and ARIA | Restored localized **PURIFY/PURIFIED** effective-layer copy without renaming internal save IDs | `tests/purification-language-contract.cjs` |
| Four fast captions evicted the oldest unread line | Restored visible-three plus FIFO queue; read/shown gates and reset include both buffers | `tests/scene-caption-contract.cjs` |
| Quest and forge settlement had reverted to multiple persistent writes | Restored clone-and-publish settlement, rollback, idempotent presentation, and legacy “done/no Purifier” repair | `tests/quest-payment-contract.cjs` |
| Generic boss classification gave virus smoke to clean constructs/rivals | Restored explicit authority: ordinary infected red, infected guardians purple, clean Alpha/GRAVEHORN/PRISM and other constructs no virus smoke | `tests/infection-eye-authority-contract.cjs` |
| Audit registry incorrectly marked three browser-dependent hero checks as no-browser and browser failure was opaque | Corrected metadata and added direct/transitive Playwright, Chromium executable, AF_UNIX, and explicit no-browser preflight | `tools/studio/test_audit.py` (4/4) |

### Still open or newly demonstrated

- The approved campaign graph is not implemented.
- Ratchet and generic NPC restore transactions remain non-atomic.
- Six of seven purified moving Eye agents can still select a static kneeling/pure plate.
- Terminal-fall collision and broken-tile cache identity regressions remain.
- The character-card PDF is stale versus runtime combat constants.
- `docs/CAVES_CH1.md` misdescribes CV1B, and later agent cave networks remain templated.
- The manhwa authority remains split between Draft 3 and Draft 4; all 32 edition entries remain uncertified for full-scene parity.

## Automated evidence

### Build and package

| Check | Result |
|---|---|
| `npm ci` | PASS — 161 packages |
| `npm run build` | PASS — all four tracked pages built |
| `npm run app:pack` | PASS — 896 assets (252.9 MB) + 2 pages (9.2 MB), 262.0 MB total |
| `node --check` for changed JS | PASS |
| `python3 tools/studio/test_audit.py` | PASS — 4/4 |

### Full audit

Command:

```sh
CHROMIUM_PATH=/usr/bin/chromium python3 tools/studio/audit.py \
  --profile full --output docs/studio/runs/2026-11-18/automated
```

| Result | Count |
|---|---:|
| PASS | 37 |
| BLOCKED | 211 |
| FAIL | 0 |
| TIMEOUT | 0 |
| Total | 248 |

The audit completed its requested registry scope but did **not** pass overall. Browser checks were consistently blocked before page creation because Chromium could not create its required Unix socket: `Operation not permitted`. This is an infrastructure block, not evidence that the gameplay assertions passed or failed.

Important passing source/headless checks include build, pack, combat-impact, repair lifecycle, story opening, panel continuity, ledger, caption FIFO, PURIFY language, eye authority, atomic quest payment, tutorial clarity/controller, campaign contract, script route, story progression, input focus, cave ground, seam route, shadow ground, dialogue audio, weapons, gear, motion sampling, combo routing, grapple/reel contracts, and credits.

`script-route` passing is not approval: it currently certifies the obsolete `forge → agent → CHIME → NULLFANG` route.

Full machine evidence: [`automated/AUTOMATED.md`](automated/AUTOMATED.md).

### Staged checks versus uninterrupted play

| Evidence class | Status | What it establishes |
|---|---|---|
| Source/headless contracts | Completed | Invariants, data relationships, and deterministic source behavior |
| Staged browser checks | Blocked before page creation | Nothing about current rendered behavior |
| Stored source/gameplay sheets | Inspected | Asset identity, pose coverage, and prior scale composition only |
| Fresh gameplay-size current build | Not completed | No current render claim |
| Uninterrupted ordinary-input chapter route | Not completed | No wake-to-end reachability/fairness claim |
| Physical touch/controller/audio/haptics | Not completed | No hardware or perceptual claim |

Several boss tests stage rooms, health, phases, positions, requested moves, or synthetic input. They prove that authored mechanics are reachable under controlled conditions, not that cues are discoverable, the route is fair, or a player can complete the campaign without internal-state assistance.

## Gameplay-size art and animation inspection

Stored source sheets were inspected directly, including all seven Eye-agent state sheets, `assets/source/gravehorn/ingame.jpg`, `assets/source/beasts/alpha2/ingame_states.jpg`, and `assets/source/beasts/wolf3/ingame_hunt.jpg`. These are useful production evidence, but they are not fresh captures from commit `12e785fa…`.

| Subject | Evidence-backed assessment | Decision |
|---|---|---|
| Seven Eye agents | TALLYMAN, LEASH, UNDERTOW, SLAG, REDACT, LAPID, and PUPIL now have recognizably different silhouettes, materials, props, infected/pure color states, and pose sheets | Preserve; do not regenerate |
| Eye-agent chroma/plates | Source sheets have strong subject separation; runtime keying, edge cleanup, scale consistency, feet contact, and transitions remain unverified | Runtime capture required |
| TALLYMAN movement | Dedicated rig exists for GA1D | Preserve and verify |
| Other six agents | Distinct plates exist, but moving purified entities can select kneeling/pure plates and `sage` is not in grounded gait walkers | P1 movement fix |
| GRAVEHORN | Strong scale and readable turn/rear/tail sheet; source encounter silhouette clearly exceeds placeholder quality | Preserve completed plates; verify current runtime |
| GRAVEHORN phase two | Runtime molten seams/light overlay current body because authored phase-two parts do not exist | Optional only after owner approval; do not overwrite current art |
| Alpha | Stored state sheet shows wolf-specific prowl, howl, leap, bite, claw, clinch, recoil/yield shapes and readable scale | Preserve; fix story semantics and runtime proof |
| Pack wolves | Stored hunt sheet shows readable snarl/walk/run/coil/lunge/bay/roll states | Preserve; verify eye authority and finite trails |

## Owner story and campaign authority

The newest explicit owner canon in `docs/STORY_CANON.md` requires:

1. GRAVEHORN constructs guard the raw marble.
2. The Purifier is forged from the marble.
3. NULLFANG is the first corrupted guardian and is **purified**, not killed or “freed.”
4. The optional Wolf King branch occurs after NULLFANG.
5. The Wolf King yields and exposes the pack-controlling Eye agent; Alpha is not a corrupted guardian.

Current runtime/test authority still encodes `forge → TALLYMAN/first Sage → CHIME → NULLFANG`, offers Alpha immediately after the forge, and uses “purify/release” semantics for Alpha. One graph must be approved and then propagated atomically through objectives, doors, gates, rooms, map reward, panels, dialogue, saves/migrations, tests, and documentation.

## Caves and quest value

| Space | Current value | Review |
|---|---|---|
| A5 | puzzle/upgrade route | Meaningful |
| A7 | survey evidence and terminal objective | Meaningful; deep quest completes on reading terminal 20, not mere entry |
| CV1 | permanent core reward | Meaningful |
| CV1B | one-ring survey, scrap, visibly teased future-skill cache | Meaningful implementation; documentation is wrong |
| CV2 | Deaf System evidence | Meaningful |
| CV3 | marble, GRAVEHORN, return passage | Meaningful and story-critical |
| A10R/A10 | Wolf Run rest, Alpha encounter, pack allegiance/cache | Meaningful topology; wrong timing/semantics |
| GB1/GC1/GD1/GX1/GE1 families | repeated grotto/tunnel/deep pattern with bat, scrap, terminal, agent | P2: individual art improved, verbs/payoffs/consequences remain templated |

Quest strengths: Ratchet's marble testimony motivates the cave; raw crystal is earned before the sword; Alpha's durable pack allegiance is a meaningful optional reward; the sword is not granted at startup.

Quest weaknesses: the Alpha offer interrupts the post-forge main path; several later errands pay numbers without a persistent visible world change; A7/D2/A11/A13 share `coin` identity and can suppress one another after reload.

## Manhwa parity

The refired panels are material visual progress and must be preserved. They do not close authority/parity review:

- `docs/STORY_CANON.md` declares Draft 3.
- `manhua/full-story.md` and `manhua/edition.json` declare Draft 4.
- All 32 edition rows remain “Not certified for the full scene.”
- Runtime/story documents still contain “seven chamber sages,” “Meadow Sage,” and retired halo/ember language despite the named Eye-agent art and owner order “NO LIGHT ROUND A BODY.”
- The new `ch2_b` teaser captions UNDERTOW but depicts a generic black hood based on a TALLYMAN reference; repair only this teaser against UNDERTOW's sea-green cable-weed/sluice-wheel identity.
- The NULLFANG purification movie now has a verified visual and audio fade to black at the asset level; preserve it. Ratchet's wake film remains visually mismatched to the live copper/orange character and has no embedded audio.

Acceptance requires one pinned edition and a scene-level parity matrix recording identity, equipment timing, action, room, spoiler level, source panel, and a current runtime capture. Refiring imagery alone must not silently choose story order.

## Combat, bosses, VFX, audio, and haptics

### Strong source evidence to preserve

- Normal/heavy/charged impact profiles are differentiated: current runtime uses 110/140/170 ms flash and 10/15/22 fragments, with progressively stronger stop, shake, recoil, and rumble.
- GRAVEHORN has 0.32–0.80 s tells, 0.55–1.2 s recoveries, jumpable floor shock, an anti-repeat deck, rest after three landed attacks, quiet-gap parry, full returning-horn collision, and anti-pogo buck.
- Alpha has wolf-specific howl/rend/leap/roar/claw/bite/spring/fury states.
- NULLFANG has distinct roar/swipe/leap/dive/perch behavior and phase pacing.
- The eye-trail particle implementation is finite and bounded: limited lifetime/caps, travel threshold, spacing, teleport reset, reduced-motion suppression, and cure/death/room cleanup.
- The ritual source clamps an infected guardian at 1 HP, requires a hold, gathers white flakes, charges/slashes, flashes/fades, extracts dark energy, returns the guardian gold/friendly, and has a retryable in-engine fallback.

### Open issues

| ID | Severity | Issue | Acceptance |
|---|---:|---|---|
| ALPHA-SEMANTICS | P1 | Alpha is auto-tamed through generic guardian cleanse, records `purified`, and is offered at forge | Post-NULLFANG optional surrender/covenant; no extraction, `purified`, free/release language, or lion gate |
| PRISM-AUTHORITY | P1 | PRISM remains in `PURIFICATION_KINDS` although canon says it was never infected | Non-virus stand-down/consent route or explicit owner canon change |
| RITUAL-FILMS | P2 | Only NULLFANG has an authored ritual movie; Brood/Atlas/Zero use the 8.5 s engine fallback | Owner accepts fallback or supplies approved films for infected guardians only; no PRISM film under current canon |
| HARDWARE-PROOF | P1 gate | No real-input rendered hit feel, listening, controller rumble, phone haptics, or reduced-motion proof | Recorded desktop/mobile runs with platform/device/browser and captures |
| COMBAT-CARDS | P2 | `output/pdf/CLAWBYTE-Character-Cards.pdf` is dated 2026-10-16/build `28c9dd55fec4` and reports stale impact constants | Regenerate from exact build; contract-check PDF/ledger against runtime |

## Fifteen-role review matrix

| # | Senior role | Verdict | Highest-value finding |
|---:|---|---|---|
| 1 | Cinematic Designer | HOLD P1 | New agent/panel art is ahead of an obsolete campaign graph and split manhwa authority; PURIFY/caption regressions were fixed here |
| 2 | Game Designer — Player Systems | HOLD P1 | One-action tutorial is strong; Ratchet restore, current rendered readability, device paths, and 200% text remain unproven |
| 3 | Mission Designer — Quest Craft | HOLD P1 | Forge settlement fixed here; Alpha timing/semantics, duplicate coin IDs, and thin later consequences remain |
| 4 | Principal Encounter Designer | CONDITIONAL SOURCE PASS / HOLD P1 | Distinct boss kits and stronger GRAVEHORN; Alpha conclusion and uninterrupted fairness remain wrong/unproven |
| 5 | Boss Designer | HOLD P1 | NULLFANG ritual source is strong; PRISM authority, later films, and real device proof remain |
| 6 | Mission Designer — Campaign | HOLD P1 | Runtime/tests still certify a superseded graph; later cave networks repeat the same template |
| 7 | Mission Producer | HOLD P1 | Branch is safe and deduplicated, but release evidence is incomplete and P1 authority/save/runtime gates remain |
| 8 | Character Artist | CONDITIONAL ASSET PASS / RUNTIME HOLD | Seven agents, GRAVEHORN, Alpha, and wolves are materially improved; feet/scale/keying/transitions need current runtime proof |
| 9 | Cinematic Director | HOLD P1 | Eighteen November refires are progress; Draft 3/4 split, the incorrect UNDERTOW teaser, and 32 uncertified scenes prevent parity sign-off |
| 10 | VFX Artist | SOURCE PASS / RUNTIME HOLD | Finite red/purple trails and explicit authority contract are sound on this branch; captures and reduced-motion/device proof blocked |
| 11 | Technical Director — World | HOLD P1 | 30 Hz terminal fall can sink ~31.99 px; broken-tile cache signs count, not coordinates |
| 12 | Gameplay Engineer — Combat | SOURCE PASS / RUNTIME+LEDGER HOLD | Impact/stat architecture passes; current combat-card PDF and perceptual/device verification do not |
| 13 | Gameplay Engineer — Mission | HOLD P1 | Atomic forge fixed here; campaign graph/gates/migrations remain inconsistent |
| 14 | Gameplay Engineer — NPC | HOLD P1 | NPC/Ratchet revival is non-atomic; six purified agents can move in kneeling art |
| 15 | Lead UI Engineer | HOLD P1 | Caption FIFO fixed here; browser/RTL/CJK/touch/200%-text/overlay proof remains unavailable |

## Prioritized findings and acceptance

### P1 — must close before merge/deploy

1. **CAMPAIGN-GRAPH-01 — Campaign/Narrative/Mission Engineering**
   Implement one owner-approved graph. Current canon is GRAVEHORN → NULLFANG → optional Wolf King → agent. Update gates, rooms, objectives, panels, dialogue, map reward, docs, saves/migrations, and tests together. Validate two uninterrupted normal-input routes: Alpha skipped and completed, including death/Continue at every gate.

2. **ALPHA-SEMANTICS-01 — Encounter/Narrative**
   Move offer/reveal after NULLFANG. Replace generic cleanse with dedicated yield/covenant. Persist Alpha alive, pack friendly/cyan, cache/reward exactly once. Never set `purified` or play guardian virus extraction.

3. **NPC-ATOMIC-01 — NPC/Save Engineering**
   Make Ratchet, Servo, and generic restoration one clone-and-publish transaction covering cell removal, awake/repaired state, flags, gift, and continuation. Failed persistence changes nothing; reload/replay cannot lose a cell or duplicate a gift.

4. **AGENT-WALK-01 — Character/NPC Engineering**
   Every moving purified agent must use its own authored moving rig/walk with pure grading. A static kneeling/pure plate is allowed only while stationary. Verify all seven at gameplay size before/after reload.

5. **WORLD-FALL-01 — World Engineering**
   Sweep every crossed Y row for solids and one-way floors at 30/60 Hz. Recovered test currently measures a 31.99 px sink at 30 Hz.

6. **WORLD-TILE-01 — World/Save Engineering**
   Sign sorted broken-tile coordinates, not only count. Same coordinates in any insertion order must match; equal count/different coordinates must differ.

7. **PRISM-AUTHORITY-01 — Boss/Narrative Engineering**
   Remove PRISM from virus extraction and give it a stand-down/consent path unless the owner explicitly changes canon.

8. **MANHWA-AUTH-01 — Cinematic/Narrative**
   Pin Draft 3 or Draft 4 and certify scene parity before story-order implementation.

9. **RUNTIME-EVIDENCE-01 — QA/Producer/UI/Audio**
   Obtain an environment where a browser page opens; perform fresh current-build gameplay-size review and uninterrupted keyboard/touch/controller routes. Record audio, haptics, reduced motion, RTL/CJK, and 200% text results honestly.

### P2 — next quality pass

- Make every later cave network use a kingdom-specific verb, payoff, persistent transformation, and later callback.
- Correct CV1B documentation to the one-ring survey/cache; do not restore the removed duplicate portal.
- Give A7/D2/A11/A13 unique persistent reward identities and migrate conservatively.
- Add persistent visible world consequences and explicit landmarks to later errands.
- Regenerate the character-card PDF and machine-readable stat ledger from exact runtime constants.
- Either approve the in-engine ritual fallback or add owner-approved Brood/Atlas/Zero films. Do not make a PRISM purification movie under current canon.
- Restore audit-log immutability/integrity snapshots and subreaper cleanup; the current compact audit runner does not prove those older guarantees.

## Audit limitations and honesty statement

- The audit runner enumerated all requested checks, but 211 browser checks were blocked before page creation.
- No fresh current-build gameplay image was captured. Stored source/gameplay sheets are identified as such throughout this report.
- No uninterrupted real-input chapter route completed.
- No physical phone, gamepad, speaker, headphone, vibration, or accessibility-device validation occurred.
- No deployment was attempted.
- Zero automated failures in the full audit does not mean release pass; it reflects 37 source/headless passes and 211 infrastructure blocks.

## Release recommendation

Keep this branch isolated. Integrate the bounded source-safety fixes only after review, then resolve campaign authority before adding more scenes or generated assets. The next implementation pass should prioritize state/sequence correctness and moving-agent behavior; existing completed character, boss, wolf, and manhwa art should be reused.

The copyable implementation handoff is in [`CLAUDE_INTEGRATION_PROMPT.md`](CLAUDE_INTEGRATION_PROMPT.md).
