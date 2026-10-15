# CLAWBYTE senior studio review — 2026-10-15

## Executive verdict

Chapter One is **not certified**. Production is unchanged from yesterday, while the integration branch adds a useful directed NULLFANG reel but no runtime gameplay or artwork. The reel is staged presentation evidence and, before this review, could finish despite missing moves or page/runtime errors.

This review branch preserves both upstream reel commits, reuses the bounded 2026-10-14 fixes by commit rather than recreating them, and makes reel evidence fail closed. Nothing was merged or deployed.

## Pins and evidence scope

| Item | Pin / status |
|---|---|
| Production `main` | `14bef4baba6b12d78b7ba2e41c221e8b95b9f938` |
| Integration | `911893775559e189418705a5d841bf29d4fe992e` |
| Previous review | `codex/studio-review-2026-10-14` at `a7bf31253550d79f5ba6a34472e973d97385e857` |
| Review branch | `codex/studio-review-2026-10-15` |
| Local implementation head before report | `73be40495ad3638c8ceeec6ca21c25061d0dc791` |
| Published source/evidence commit | [`c860fa9b54f11bc8f96fb480ed1e425e3b3b5c1f`](https://github.com/zaferdajani/HZD-99/commit/c860fa9b54f11bc8f96fb480ed1e425e3b3b5c1f) |
| Built pages | local only, `BUILD_ID 07f3967fe8dc`; deliberately not deployed |
| Live production | not tested and not changed |

Fresh evidence includes repository comparison, source inspection, a local locked install, build/package/integrity checks, 29 passing static audit results, a full collector attempt, and direct inspection of four 1600×893 story images. It does **not** include a browser-launched gameplay session, an uninterrupted real-input campaign, touch/controller hardware, listened audio, haptics, or new gameplay captures. Chromium installation again returned zero-byte invalid archives.

## Upstream change since 2026-10-14

Integration is two commits ahead of production and changes only `tools/castreel.cjs` and the new `tools/nullfangreel.cjs`. It stages the meeting, attack chapters, phase transition, purification and rescued follow. It also relocates actors, controls cooldowns/HP, assigns neutral setup states, suppresses reward/cut handlers, may request a daze fallback, and appends the purification movie. These are legitimate director controls, but the result cannot prove natural move selection, encounter fairness, campaign order, earned equipment, survival, audio mixing in ordinary play, or uninterrupted traversal.

No production gameplay, story, test, art or built-page change landed since yesterday. Therefore all unresolved 2026-10-14 findings remain current unless noted below.

## Fifteen senior-role verdicts

| Responsibility | Verdict | Evidence / consequence |
|---|---|---|
| Senior Cinematic Designer | Issues | Directed reel improves shot review, but A3 alternate NULLFANG panel and complete campaign certification remain review-branch-only. |
| Senior Game Designer — Player Systems | Issues | Device-aware grapple guidance is review-only; no fresh ordinary-input or accessibility run. |
| Senior Mission Designer — Quest Craft | Source pass, traversal blocked | Ratchet, Servo, forge, survey and Alpha motivations remain in source; no fresh player journey. |
| Principal Encounter Designer | Issues | Pre-meeting quarry hatch gate is absent upstream; current terrain/shaft changes were not walked today. |
| Senior Boss Designer | Issues | Reel is useful staged inspection, not encounter validation. Missing-move certification is fixed on this branch. |
| Senior Mission Designer — Campaign | Issues | Strict ordered 16-scene certificate and progression fixes remain unintegrated upstream. |
| Senior Mission Producer | Issues | Existing fixes were reused, scope was deduplicated, branch isolated; full browser gate remains blocked. |
| Senior Character Artist | Issues | Fresh inspection reconfirms NULLFANG eye, inactive Servo and passage anatomy concerns; GRAVEHORN/FURNACE gaps remain. |
| Senior Cinematic Director | Issues | New reel covers intended beats but is not manhwa-parity or campaign evidence; four GRAVEHORN story beats remain missing. |
| Senior VFX Artist | Source pass, visual block | Finite red/purple runtime contract is unchanged; no fresh trail-expiry/anchor footage. |
| Senior Technical Director — World Systems | Issues | No world delta today; cave/terrain conclusions remain source/static, not fresh traversal evidence. |
| Senior Gameplay Engineer — Combat | Issues | Protected-target grapple and zero-damage fixes are carried onto this branch; no live combat run. |
| Senior Gameplay Engineer — Mission | Issues | Quarry gate, panel alternate-room handling and strict campaign certificate are carried; upstream still lacks them. |
| Senior Gameplay Engineer — NPC | Source pass, motion blocked | Purified lion follow logic and reel chapter exist; no rendered rescued-walk certification. |
| Lead UI Engineer | Issues | Text-reveal foundation remains; device-aware grapple copy is carried. Phone viewport tests are not physical touch proof. |

## Findings

| ID | Sev. | Status | Player consequence / evidence | Owner and acceptance |
|---|---:|---|---|---|
| REEL-01 | P2 | Fixed here | The NULLFANG “every move” film logged missing meeting/states and page errors but still encoded successfully. Source-inspected. | Engineering: certificate records required/observed/missing beats, errors and forced fallbacks; incomplete capture exits nonzero. `reel-contract` passes. |
| REEL-02 | P2 | Fixed here | Reel trusted anything serving port 8220. Source-inspected. | Engineering: verify local disk/served hashes before browser capture and embed identity in certificate. |
| STORY-1 | P1 | Carried fix, unintegrated | Upstream can open the quarry hatch before meeting NULLFANG. | Mission: A2 hatch resists before `nfMeet`, breaks afterward, unrelated tiles unchanged. |
| QA-09 | P1 | Carried fix, browser blocked | Upstream campaign runner can call a partial/error-bearing route complete. | QA: all 16 scenes in order, no misses/page errors/segment/stop; uninterrupted clean-save run passes. |
| COMBAT-4/5 | P1 | Carried fix, browser blocked | Upstream grapple can target rescued/friendly actors and add effects after zero damage. | Combat: protected target matrix rejected; no knock/charge/FX/freeze/rumble on rejected damage. |
| CIN-4 | P2 | Carried fix, browser blocked | A3 alternate-room NULLFANG break panel is skipped upstream. | Cinematic: ordinary `alsoRoom` works while B1 teaser restrictions remain. |
| UX-05 | P2 | Carried fix, static pass | Upstream grapple prompt hardcodes keyboard U. | UI: keyboard, touch, mapped controller and unbound-controller guidance render correctly. |
| ART-5 | P2 | Open | Fresh direct inspection of `m_down.webp` shows NULLFANG with red eyes although bosses require purple. | Character/VFX: localized eye-only edit; preserve all other pixels/dimensions; compare at panel and gameplay scale. |
| ART-6 | P2 | Open | Fresh inspection of `r_cell.webp` shows the supposedly powered-down Servo with bright amber eyes and cyan chest. | Character/Cinematic: darken only inactive indicators while preserving the lamp, battery and composition. |
| ART-4 | P3 | Open | Fresh inspection of `passage_b.webp` retains off-model rear limb/hand proportions. | Character: localized anatomy correction with unchanged tunnel, sword timing and framing. |
| ART-7 | P3 | Verify, not proven defect | `r_marble.webp` clearly shows raw stone plus a diagrammatic future sword. Do not redraw unless gameplay-size review confuses this with a found sword. | Cinematic: user test correctly reads “raw marble becomes sword.” |
| GH-ART | P1 art gate | Open | No new GRAVEHORN authored production assets; 14 plates and four manhwa beats remain queued. | Art: produce once, wire, inspect at gameplay scale, validate all states/anchors. |
| FURNACE-ART | P2 | Open | Six authored poses remain queued. The corrected brief keeps infection emission out of source art and uses runtime purple boss eyes. | Art/VFX: complete six poses once; preserve runtime eye colour/trails. |
| TER-1 | P2 | Unverified | Prior missed-jump concern predates newest manual shaft steering; not reproduced today. | World: reproduce with ordinary input before any geometry edit. |

## Implemented on this review branch

1. Reused commit `8edebd4` from the previous review over the newest integration head. This carries the bounded quarry gate, panel trigger, strict campaign certificate, protected grapple logic, device-aware copy, audit cleanup/deadlines, tests, and art-queue corrections without regenerating work.
2. Added `assessFilm()` and `tests/reel-contract.cjs`.
3. Added pre-capture served-build identity verification.
4. Persisted a `*.certificate.json` containing served file hashes, sections, runtime/page errors and coverage.
5. NULLFANG now declares required meeting/states/double-swipe/purified-follow beats, records observed/missing beats and discloses the daze fallback.
6. Reel encoding may be retained diagnostically, but certification fails nonzero when errors or required beats are missing.
7. Corrected the reel header: neutral setup states are assigned; trajectory-dependent attack states are not forced.

No raster asset was regenerated. The rejected 2026-10-14 purple-eye full-frame candidate was not carried or wired.

## Cave census (carried; no fresh traversal)

| Space | Intended outcome | Current evidence |
|---|---|---|
| Early quarry route A2/A3 | NULLFANG warning, then raw-marble route | Gate/panel corrections exist on review branch; browser traversal blocked. |
| Marble cave | Raw rounded cleansing material, return route | Static story/route checks pass; ordinary-input collection not rerun. |
| A7 shaft/survey | Read survey to complete Servo errand | Source/static contract retained; newest steering not physically walked. |
| Alpha den | Optional pack story and reward/consequence | Completed Alpha/wolf assets preserved; no fresh run. |
| Lion den A4 | Locked until blade + Sage + CHIME; purify, do not kill | Source gate retained; new reel is staged and not gate proof. |

No ordinary exit ID alone is counted as a meaningful cave payoff.

## Manhwa parity matrix

| Beat | Status |
|---|---|
| Wake, bay, gate, letter, drawer, Ratchet | Runtime assets/source exist; strict certification is on this branch, browser blocked. |
| Cave, marble, forge, passage | Assets/source exist; raw marble remains distinct from forged sword; traversal blocked. |
| Sage, break, CHIME, free, Chapter 2 teaser | Ordered certificate exists here; uninterrupted run blocked. |
| NULLFANG `m_down` | Composition exists; red boss eyes violate purple rule. |
| GRAVEHORN four story beats | Missing/queued. |

## Animation and VFX matrix

| Subject | Current status | Required evidence |
|---|---|---|
| Hero | Completed authored system preserved | No regeneration; physical input/gameplay-scale survey still useful. |
| Pack / Alpha | Ten landed strips and wolf set preserved | Do not regenerate; capture optional quest and tame consequence. |
| NULLFANG | Authored strips and new 13-section directed reel | Run certificate successfully in a browser; separately complete ordinary fight/playthrough. |
| Purified lion | Source follow logic plus staged reel beat | Verify planted walk at gameplay size without sleep-slide. |
| Minor infected eyes | Red, finite 1.125–1.875 s trail, capped | Fresh moving capture, anchor check and expiry check. |
| Boss/Alpha/Sage eyes | Purple, finite trail, lifecycle cleanup | Fresh boss capture and cure cleanup; no baked red emission. |
| GRAVEHORN | Procedural/incomplete authored coverage | 14 plates + four beats. |
| FURNACE | Existing parts plus six missing authored poses | Produce/wire once; inspect anchors and transitions. |

## Validation summary

- `npm ci`: pass, 160 packages.
- JS syntax checks: pass.
- `node tests/run.cjs reel-contract campaign-contract grapple-contract`: 3/3 pass.
- Audit unit tests: 4/4 pass.
- `node build.cjs`, `node tools/pack-www.cjs`, `node tests/build-integrity.cjs`: pass.
- Static collector: 29/29 recorded results pass (build, two served-identity checks, 26 harnesses).
- Full collector: 189 recorded results — 30 pass, 159 fail at browser launch because `/opt/pw-browsers/chromium` is absent.
- `npx playwright install chromium`: failed five downloads, each reporting 100% of 0 MiB and an invalid ZIP.

The 159 browser results are **blocked infrastructure evidence**, not demonstrated gameplay regressions and not passes. There was no uninterrupted real-input campaign, rendered reel, live animation review, touch/controller run, listened audio test or haptic test.

## Visual inspection hashes

| Asset | SHA-256 | Fresh observation |
|---|---|---|
| `m_down.webp` | `c65be806cf5fdc6b005d551504625dd0d38ffec4f7afcb260205f2a45930acaa` | Red boss eyes; localized purple correction still required. |
| `r_cell.webp` | `800ab5ba11aab84cbf7a13e8a38d6c37acc924505558df945e76b490362c98c4` | Inactive Servo indicators read powered. |
| `r_marble.webp` | `82f68a235fad9e1de0b559c90c8d295a71fcfa6857fb8dbe1f67e4ae01fce410` | Raw material and future sword outline are distinct. |
| `passage_b.webp` | `9ca50c2cbeb05b9769a5d11d360bf0ae9a1792ceb8bc02b9ad15d86995944203` | Rear hero anatomy remains the weak point. |

## Integration and release status

- Implemented: yes, review branch only.
- Tested: static/build scope above.
- Visually inspected: four source panels, not live gameplay frames.
- Integrated to authoritative branch: no.
- Merged to production: no.
- Deployed/live verified: no.

Claude should selectively integrate this branch over the current integration head, rebuild all four generated HTML pages, run the new reel certificate and then run the full browser suite plus a clean-save ordinary-input Chapter One campaign before any production merge.
