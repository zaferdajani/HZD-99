# Engineering studio review — 2026-10-18

## Scope and authority

Five senior engineering responsibilities were instantiated in one reviewer. Read
`AGENTS.md`, `docs/DEVELOPMENT_AUTHORITY.md`, `docs/STORY_CANON.md`, the complete
`CLAUDE.md`, pipeline/roles and all five role mandates. The current explicit
review-only request overrides historical production-publishing directions.

Evidence in this document is **source-inspected**, unless explicitly called
historical. This reviewer did not launch a browser, edit runtime code, build,
inject saves or claim a fresh playthrough. The producer owns today's executable
validation and consolidated verdict.

At intake main and `claude/clawbyte-repo-migration-byhyl8` both resolve to
`62d75d204c6f6264f25150bb419fc262ff2c18ea`. Yesterday's reviewed commit
`84f44587fc57fcc00d1fc40fba1a6640636fc0c7` remains outside those refs. Today's
review branch inherits that commit by ancestry; its fixes are not new work and
must not be recreated or cherry-picked twice. Previous report:
[2026-10-17](../2026-10-17/REPORT.md).

## Five separate role verdicts

| Responsibility | Verdict | Concrete evidence and limits |
|---|---|---|
| Senior Technical Director — World Systems | Issues | Source gates and recovery remain coherent: `js/progress.js` `PG_LAIR_NEEDS`, `pgLairOpen`, `pgBellOpen`, `progressBenchGuard`; `js/game.js` crossing refuses GA1D without the earned single sword. Today's room/collision/package results belong to the producer. No all-cave traversal or physical-device certification. |
| Senior Gameplay Engineer — Combat | Issues | Existing weighted hit feedback, armor, attack power/cadence and ledger are implemented, not merely proposed: `js/combat-stats.js` and production callers in `js/entities.js`. Retire stale opening hints at ritual transition; retain unsolved timing/throw/scale gates from yesterday until today's evidence establishes their status. No subjective audio/haptic judgment from source. |
| Senior Gameplay Engineer — Mission | Issues; inherited bounded fix present on candidate | `brAnswer` defers principal-guardian mercy records and spoil until `onBossDead` invokes `purificationCommitChoice`; retry matches exact kind+room legacy nodes. This remains absent from production intake. `tests/purification-save.cjs` is staged persisted-reload coverage, not continuous campaign evidence. Legacy duplicate history is intentionally not rewritten. |
| Senior Gameplay Engineer — NPC | Issues | Ratchet revival and quest ownership are explicit in `openingTalk`, `doInteract`, `progressGoal`; optional Alpha offer is after forging (`js/wolves.js:625`). Friendly lion logic selects `stalk` plus world-ground placement while moving (`js/entities.js:12142–12169`). This source does not prove all authored contacts/facings; down/surrender artwork remains incomplete. |
| Lead UI Engineer | Issues; inherited device fix present on candidate | Candidate `purificationText` uses actual `{INT}`/`ctlFill` or localized dedicated-button text for touch/unbound pads, unlike current main. Reveal/pagination/grace/dwell/mash protection is in `js/overlay.js:92–168`. The opening-toast lifetime issue is traced below. Device emulation is not physical-device evidence. |

## Priority finding: PUR-TOAST-01 (P2, carried forward, cause traced)

**Player consequence:** “NULLFANG is reeling — hit it NOW” can survive the fight
and return alongside rescue/equipment notices, contradicting the new hold-to-free
action. Yesterday's actual clean campaign recorded this through the aftermath;
this review traces the source cause rather than claiming a new observation.

**Source chain at inherited commit `84f44587`:**

- Combat hint producers: `js/entities.js:11912` (`gd_open`) and `:12428`
  (`daze_open`); GRAVEHORN also uses `js/gravehorn.js:614` (`gd_open`).
- `G.toast` (`js/game.js:192–197`) stores text and TTL with no semantic scope.
- Toast TTLs decrement only inside PLAY (`js/game.js:3046–3047`). The PURIFY
  early return and later CUT/DIALOG pause those TTLs, intentionally preserving
  ordinary rewards but accidentally preserving obsolete combat instructions.
- `purificationBegin` (`js/purification.js:54–72`) resets projectiles, swing and
  hit-stop but does not retire combat hints.
- HUD `G.toasts.forEach` (`js/game.js:14100`) draws all retained entries together.
  This also explains why timing alone is not a reliable cleanup strategy.

**Smallest robust fix proposed to producer:** give the three opening-hint calls
an optional semantic tag, retain that tag in `G.toast`, and remove only that scope
when a valid guardian purification begins. Do not clear all toasts: permanent
unlock, reward and guidance notices must remain. Avoid English/localized-text
matching, which couples lifecycle to language or a wording edit.

**Acceptance test:** stage an earned opening plus an unrelated notice; start the
valid ritual through the real production path; the opening disappears, unrelated
notice survives; interrupted hold/cancel/retry never revives it; normal combat
still emits it; test multiple locales without text equality. Retain the historical
campaign screenshot/log as before evidence. Producer owns fix and fresh result.

The separately reported overlap of reward/equipment messages is broader queue
presentation work. Fixing obsolete combat scope does not by itself prove that
every aftermath notice is serialized or that all HUD overlap is resolved.

## Existing combat/stat implementation — do not duplicate

- `js/combat-stats.js:5–9` defines species/zone armor; `:17–30` initializes enemy
  defense, attack power and cadence. HP remains in EKIND/BSTAT and save scaling,
  avoiding a contradictory second HP pool.
- `combatStats` (`:52–73`) distinguishes hero swings/second, enemy authored
  cadence multiplier, HP/cores, defense, protected NPC integrity, weapon and
  special power. Enemy cadence is **not** mislabeled attacks/second. Enemy and
  boss state machines consume `attackSpeed` in `js/entities.js:7544,12365`.
- Normal/heavy/charged impact profiles are `:11–15`; actual contact flash,
  hardware fragments, bounded once-per-special recoil/hit-stop/rumble live in
  `combatImpact` (`:97–123`). Protected targets are excluded by `combatProtected`.
- `COMBAT_LOG` is a capped 200-event local session ledger; export includes
  exact build and current equipment (`:76–95`). It is not an analytics service
  or a permanent all-time combat archive.
- `tests/combat-impact-contract.cjs` measures production armor, protected hits,
  charged once-only recoil, cap, weapon progression `[12,16,19,23]`, and claw
  burst 38 versus normal 12. Its staged/VM method is not a human playtest.
- Preserve `docs/combat/impact-2026-10-16` and existing field guide/cards rather
  than recreating them. Final fresh suite results must verify today's build.

## Story and mission safeguards inspected

`PG_LAIR_NEEDS = ['crystal','sageTame_GA1D','bossChime']` makes the lion's fight
depend on sword → first Sage → CHIME. `progressBenchGuard` migrates locked-room
bench continuation back to safe A3; explicit geometry/gate guards supplement HUD
text. `progressGoal` gives material return, pack purchase, GRAVEHORN, Sage, CHIME
and lion objectives in causal order. `MARBLE_TRAIL` and the quarry landmark give
world guidance, but source presence does not prove every player notices them.

The corrected cave ledger includes CV3's GRAVEHORN before extraction. CV1 core,
CV1B survey/pod/map, CV2 founding evidence, raw marble, maintenance passage and
Sage rescue have distinct source outcomes; optional A10/GA2 Alpha grants a
friendly pack and rewards. `alphaQuestOffer` requires forged crystal and is
idempotent through `alphaLead`/`alpha`; its absence from the lion prerequisites
is intentional. Do not make the Alpha mandatory to repair narrative pacing.

Principal guardian hold-to-free remains separate from ordinary quiet cleansing,
the optional Alpha and Mother's ending. The inherited save fix preserves that
scope rather than replacing those reward paths.

## Finite eye-trail implementation inspected

`js/infection-eyes.js:35–50` classifies red/purple colors and sets quality caps
90/170/260/320, base life 1.5 seconds with ±25% random variation (maximum 1.875
seconds), minimum body speed 10 px/s and 0.1-second movement hold. World-space
anchors follow actual draw transforms (`infEyeMark`, `infEyeArt`); turn/eye-identity
changes restart threads and >90px displacement clears owner wisps. Removed/room
cleared owners are cleared explicitly; age expiration recycles finite particles.
Reduced motion retains eye glow without smoke; friendly/purified/tamed actors
have no infection class (`:89–101`).

The inherited GRAVEHORN eye-only purple correction preserves amber horn/nozzle
telegraphs. Runtime correctness still needs fresh `infection-eyes`, roster/pose
and GRAVEHORN checks plus visible samples. A still roster cannot prove trail fade,
every animation anchor, or sustained phone performance.

## Open validation and production limits

Historical Oct17 full collector failed `gravehorn` (actual jump timing late),
`foescale` (flier 0.34×71px hero), `crystal` (joined throw zero-range) and the
recording setup of `campaign-ch1` (missing encoder before gameplay). Isolated
GRAVEHORN/crystal later passed; flier failed again. These are not silently
resolved by inheriting yesterday's code. Today's producer must retain the new
full result and distinguish timing/infrastructure from gameplay defects.

The lion movie/outro is already authored and must not be regenerated. Runtime
video is muted and audio is separately routed, so encoded music fade does not
certify what a player hears in the game. Four other guardian-specific films
remain explicit engine fallback; no asset-generation credit/access check occurred
in this engineering review. Physical touch/controller, vibration, subjective
audio, sustained performance and full manhwa parity remain outside this reviewer's
evidence. No production deployment claim is made.

## Producer fix follow-up — scoped notice retirement

Re-inspected the producer's bounded fix after implementation. All three existing
opening producers now pass `'boss-opening'`: generic guardian break
`js/entities.js:11912`, NULLFANG `:12428`, and GRAVEHORN
`js/gravehorn.js:614`. `G.toast(text, scope)` retains optional provenance in the
stored notice (`js/game.js:192–196`). The validated `purificationBegin` path
filters only that scope (`js/purification.js:58–61`), after actor/blade/already-open
checks and before beginning the ritual. No localized-string matching or wholesale
reward deletion was introduced.

Read the fresh staged evidence: [before/result.json](before/result.json) on build
`fbfa046c42b4` retains all three seeded notices through ritual/retry;
[after/result.json](after/result.json) on `7984b6ea8f08` removes the tagged opening
while preserving the earned reward and an intentionally **identically worded but
unscoped** notice. Retry preserves the same two notices; both runs report no page
errors. The registered `purification-notices` harness repeats those assertions
against the assembled game, and its [collector result](automated/purification-notices/result.json)
records the same fixed build/result. These are producer-run staged browser
results reviewed here, not an uninterrupted campaign or a claim that every
guardian producer was dynamically triggered in this fixture.

**PUR-TOAST-01 status: bounded lifecycle fix implemented and staged regression
verified; integration/deployment still separate.** All three producers are
source-confirmed tagged. This does **not** solve or certify general HUD reward
serialization, all locale rendering, physical input, or the separate aftermath
equipment-message overlap. Full audit/browser-environment failures and any
isolated reruns remain producer-owned and must be retained separately in the
consolidated report.
