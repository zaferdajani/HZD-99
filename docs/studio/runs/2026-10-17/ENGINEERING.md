# Engineering review — 2026-10-17

Reviewed source pin: `62d75d204c6f6264f25150bb419fc262ff2c18ea` (main and integration at intake). This group owns five senior responsibilities. The parent owns runtime edits and full validation; this reviewer only wrote this report and the isolated save-interruption reproduction under `engineering/`.

Read authority, story canon, pipeline, all five role mandates, prior October 16 report, and the combat/purification validation record. Reviewed new combat stats/impact, deliberate purification, film outro, softened shafts, bound-body presentation and environmental-death changes. No assets were generated. No production ref was changed.

## Separate verdicts

| Senior responsibility | Verdict | Evidence and acceptance |
|---|---|---|
| Technical Director — World Systems | Issues / traversal pending | `loadRoom` reapplies persisted rescue state and clears infection trails; `progressBenchGuard` guards locked lion/bell save destinations. Current source includes prior A2 pre-meeting hatch fix. A real saved guardian-interruption inconsistency is reproduced below. Full room/cave topology acceptance depends on the parent's current-build checks and ordinary-input campaign; source inspection alone cannot certify them. |
| Gameplay Engineer — Combat | Source pass for reviewed ownership; runtime evidence pending | `combat-stats.js` centralizes defense and impact profiles, records bounded damage events, keeps authored cadence rather than claiming fake uniform attacks/second, and prevents duplicate charged-impact pause through per-move tokens. `purificationBegin` expires rather than nulls the active swing inside a final-hit callback; next ritual update clears it. Five principal guardians require the earned sword and deliberate hold; optional Alpha and Mother remain separate. Need current-build final-hit, interrupted hold, damage, guardian and contact/audio checks. |
| Gameplay Engineer — Mission | Issues, P1 reproduced | Lion cinematic begins after `brRecord` has persisted a mercy entry but before `bossGlitch` is recorded. Reload and retry duplicates the entry. Other reviewed gates preserve crystal → first Sage → CHIME → lion, and Alpha remains post-forge optional. A7 remains Ratchet's survey READ errand, not Servo's errand. |
| Gameplay Engineer — NPC | Source pass; motion quality pending | `loadRoom` rehydrates rescued people and purified sages; purified guardian homes recreate friendly actors after completed saves. Latest environmental-death branch correctly avoids creating a persisted disabled-person rescue from spike/fall death. Bound wolf now uses held crouch plus a flattening transform; it is explicitly a stand-in, not authored lying-down animation. Need gameplay-size moving/following/stop-start inspection before ruling out sleeping-slide or stiff recovery. |
| Lead UI Engineer | Issues, bounded patch identified | Pin's purification prompt hardcodes E in all five languages, unlike the actual `inD('INT')` remapped input. Existing `ctlFill` / `ctlName` supply mapped controls. Parent has accepted the bounded fix and is validating it; this reviewer does not claim its test outcome. Hold button already has minimum 48px height, pointer cancellation, focus/visibility reset, portrait blocking and keyboard interaction. Physical touch and assistive-technology acceptance remain unverified. |

## ENG-17-01 — P1 — Guardian film interruption duplicates saved world history

**Evidence type: reproduced in a staged browser**, not an uninterrupted campaign. Build `a2e6994d283e` served at `http://127.0.0.1:8220/index.html`. The fixture grants chapter prerequisites and selects A4 to isolate this transaction. Subsequent reload uses the actual game-persisted save without editing it.

1. Fresh staged save starts with braid `led=""`, `forks=0`, `bossGlitch=false`.
2. Finish the lion fight and hold E to complete the new ritual. At `G.state="CUT"`, actual disk save already holds `led="L"`, `forks=1`, `bossGlitch=false`.
3. Reload the page before the film completes; start from `loadStored('robo')`, then select A4 for isolation. The guardian respawns alive because its completion flag remains false. The actual saved braid remains `L`.
4. Repeat the hold. Disk now holds `led="LL"`, `forks=2`, two `firstboss/A4` nodes, while `bossGlitch` is still false.
5. No page errors occurred.

Evidence: [script](engineering/ledger-interruption.cjs), [JSON](engineering/ledger-interruption.json), [log](engineering/ledger-interruption.log).

Source chain: `purificationFinish` in `js/purification.js` → `brOffer` → `brAnswer` → `brRecord` in `js/braid.js`. `brRecord` appends the ledger, tally, fork count and node, then calls `persist()` immediately. Movie completion eventually reaches `endPurifyCut` / `G.onBossDead`; only that later path persists the guardian completion. `loadRoom` spawns the hostile guardian from the completion flag. Each repeated interrupted film therefore changes the world history again for the same unresolved rescue.

**Player consequence:** closing the game during the film leaves a phantom mercy choice that changes the world simulation; retries append more choices. This is a persisted gameplay inconsistency, not merely a duplicate toast.

**Smallest safe remedy:** stage the principal guardian's choice/spoil until its purification is completed and commit ledger, reward and guardian flag together through the existing completion path. Keep the no-film fallback, skipped film and decode-failure fallback single-shot. Avoid globally deduplicating `kind='boss'`, which is shared by multiple distinct guardians. Existing interrupted saves require conservative exact guardian identity handling or an explicitly documented migration limitation; do not rewrite unrelated historical braid entries.

**Acceptance:** reload during hold, white gather/slash, black transition and video; none may add a completed rescue without its guardian completion. After retry/completion, exactly one guardian-specific record and one reward exist. Check successful video, deliberate skip, failed decode fallback and repeated completion calls. Parent owns implementation and fresh pass evidence.

## ENG-17-02 — P2 — Purification prompt names the wrong input

**Evidence type: source-inspected at intake.** `PURIFICATION_WORDS` contains literal E in every language, while `updatePurification` uses the logical INT action and controller remapping. This matters precisely at the new explicit action needed to free the boss.

Recommended bounded fix: use `{INT}` and existing `ctlFill`; supply button-specific instructions for touch and an unbound controller rather than telling the player to hold a pause-menu route. Parent is applying this. Acceptance: keyboard binding override; Xbox and generic/PlayStation remaps; unbound INT; touch; all five languages; no remaining placeholder; actual hold still completes only after release and deliberate press.

## Earlier findings: current status correction

The previous report's “unintegrated” labels are historical, not today's source status. Current main includes `6ab1437` and the later combat/purification commits. The pre-meeting hatch guard exists in `game.js`; `panels.js` checks `alsoRoom`; `grapple.js` protects hostile targeting and uses device-aware guidance; the stronger campaign/reel contracts remain. They require today's runtime evidence but should not be sent to Claude as missing source work.

The A7 survey's owner/reward correction stands: `ratchet_deep`, terminal 20 in A7, 80 scrap + coin relic after forging. `servo_coil` separately grants 60 scrap + 10 IQ. Alpha quest remains `after:'ratchet_forge'` with pack consequences, not part of `PG_LAIR_NEEDS`.

The October 16 purification record honestly distinguishes the 184/188 candidate result, subsequent affected/release passes, and checkpoint continuation from a fresh uninterrupted campaign. Today's report must preserve that distinction rather than promoting the historical continuation into fresh certification.

## Media / effects / save boundaries

- Only lion has the new `purify_glitch_ritual.mp4` mapping. Four other principal guardians use the explicitly authored in-engine fallback; this is not equivalent to four generated films. Preserve these completed assets and scripts.
- `c3e892e` resolves lion media picture/audio before EOF and reduces only its already-black outro dwell. This reviewer inspected the source/commit relationship, not a fresh audio audition or waveform.
- Infection effects remain bounded by quality caps, per-particle lifespan, motion threshold and teleport/owner/room cleanup. Finite-source logic is not sufficient evidence that every animated eye anchor looks correct.
- Combat stats report NPCs as protected integrity/zero attack and preserve authored enemy cadence. Character-card data is a snapshot; no new balance recommendation is justified without observed fight data.
- Environmental removal is intentionally per-visit and does not persist a rescue. It does not prove all existing erroneously disabled old saves have been migrated; historical saves must be assessed separately if the owner still observes old bound foes.

## Validation scope

This reviewer ran one isolated browser regression only, with ordinary keyboard down/up during the staged ritual and an actual page reload/disk save. Initial inventory, room and final-hit setup are injected. No complete route, physical phone, controller hardware, audio listening, haptic test or performance certification is claimed. Parent owns the full collector, fresh campaign, final-build consistency, patch retests and publication decision.
