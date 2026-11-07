# CLAWBYTE Senior Studio Review — 2026-11-07

## Release decision

**HOLD — do not merge or deploy.** Production is not damaged, but the
November 6 review branch is unsafe to integrate. This review reconstructs the
bounded source work on a verified base, adds two small safety fixes, and
publishes it for later integration only.

| Item | Result |
|---|---|
| Production `main` | `7da3c87e6b43a2357a2f52080814ae1d6adad618`, unchanged |
| Authorized integration refs | `origin/odyssey` and `origin/claude/clawbyte-repo-migration-byhyl8` are also `7da3c87...` |
| Safe reconstruction base | `f0265a35e0b3b5987619638352c05625f947712c` |
| Exact locally audited source | `5b05f20066613264dca10affeeca17b43554b0d1` |
| Review branch | `codex/studio-review-2026-11-07` |
| Build/package | PASS |
| Automated evidence | 203 entries: 38 pass, 165 blocked |
| Raw-log integrity | PASS, 203/203 captured records valid; no mismatches |
| Staged rendered gameplay | BLOCKED: Chromium unavailable |
| Uninterrupted ordinary-input campaign | BLOCKED: `campaign-ch1` needs Chromium |
| Physical device | NOT RUN |
| Production deployment | NOT ATTEMPTED |

The candidate is intentionally **not release-certified**. Thirty-four passing
suite entries are source/headless contracts; four more are build, package and
served-identity infrastructure gates. None substitutes for rendered gameplay,
the uninterrupted campaign, or a physical-device run.

### Remote publication attestation

The branch was fetched back after publication rather than trusted from the
upload response alone.

| Object | Remote commit/tree | Verified local object |
|---|---|---|
| Authored source | `e7f64c2cd38b6dd793905e547a841019cbb4cc82` / `952179949c89e60c5f391a0b936e628529c288b0` | source tree from `5b05f20...` is exactly `952179...` |
| Evidence before this attestation note | `0901114429a18da0548686a31518dfab38a7fa1f` / `1728c6d4f1d53eeb879f633cd66c33b2f8803c61` | evidence tree from `953c39a...` is exactly `1728c6...` |
| Canonical game core on remote branch | blob `c8c027fbf7bc2159103b5dce1f1082b8102d08a4` | 987,836 bytes, 18,206 lines, syntax PASS |

All 222 changed blobs were created only after their returned Git blob SHA
matched `git rev-parse <local-commit>:<path>`. A fresh `git fetch` then proved
both complete remote tree SHAs equal their local trees, and proved the corrupt
Nov 6 commit is not an ancestor. This attestation note is a documentation-only
fast-forward on top of those verified objects.

## P0 correction to the November 6 report

The previous report described a safe source publication. Remote readback now
proves that claim was wrong.

| Object | Valid source | Published Nov 6 source |
|---|---:|---:|
| Commit | `f0265a35...` | `2718f6e857d6af608a981d25b3d2fef884ce1f42` |
| `js/game.js` blob | `c8c027fbf7bc2159103b5dce1f1082b8102d08a4` | `a51b9f130a4d84c0592ab03095af53b66859273a` |
| Bytes | 987,836 | 786,444 |
| Lines | 18,206 | 7,276 |
| Syntax | PASS | FAIL near line 7,272 |
| Diff from clean source | none | approximately `+7/-10,936` |

The corrupt file ends inside `renderTileLayer` with binary/base64-like garbage
and omits the runtime tail. The Nov 6 review tip
`ca8bf2457a58679fdca7fdfb0d415abc1852cc1f` therefore must not be merged,
cherry-picked wholesale, or used as a base. Main and the integration refs never
received the bad object and remain intact.

The most likely cause is a large-file publication path whose command output was
silently capped while transporting base64. The upload step did not verify the
remote blob against the local committed blob. This review corrects the result:

- the branch starts from full source `f0265a35...`;
- the corrupt commits are not ancestors;
- `js/game.js` is untouched and retains blob `c8c027...`;
- the intended caption reset is implemented in small `js/overlay.js`;
- every remote changed blob must be read back and matched before the branch is
  called published.

Five hidden checkout residues produced during the fresh clone were preserved at
`/tmp/hzd99-clone-residue-20261107/`; they were not deleted or committed.

## Change since the previous review

There is no new production, integration, gameplay, art, cinematic, or VFX
delta. The useful new information and bounded work are:

1. **New P0:** the Nov 6 remote review branch is corrupt and superseded.
2. **New P1:** quest payment is guarded against repeated callbacks but is not
   one durable transaction across reload/crash boundaries.
3. The prior intended Alpha, eye-authority, caption-FIFO, browser-classification
   and documentation corrections were reconstructed on clean source.
4. Caption reset was moved from the huge game file to the existing
   `overlayClear()` hook and source-tested.
5. Collector logs now publish from a closed `.running` source into a canonical
   `.log` through `fsync` plus atomic rename. Eight late temporary-path writes
   occurred during the full run; canonical logs and embedded snapshots remained
   identical. Temporary paths were excluded from evidence.
6. The full collector now reports `log_integrity.ok=true`; November 6 had two
   raw-log mismatches.
7. No completed art, animation, sound, or video asset was regenerated.

## Verified bounded source changes

| Change | Evidence | Result |
|---|---|---|
| Scene captions retain three visible readers and queue later unread text FIFO | `tests/scene-caption-contract.cjs` | PASS |
| Reset clears visible and queued captions through `overlayClear()` | same real-module contract | PASS |
| Ordinary infected eyes red; bosses, guardians and Alpha purple | `tests/infection-eye-authority-contract.cjs` | PASS |
| Alpha is optional A10 depth branch; mandatory road is A1→A2→A3→A4 | `tests/alpha-optional-contract.cjs` | PASS |
| Three Playwright harnesses no longer bypass browser preflight | `tools/studio/test_audit.py` | PASS |
| Collector canonical log is atomically finalized | audit unit test and full run | PASS |
| Large game core remains canonical | blob `c8c027...`; `node --check js/game.js` | PASS |
| Generated pages reflect source | `node build.cjs` | PASS |
| Packaged web assets | `node tools/pack-www.cjs` | PASS, 694 assets / 252.5 MB total |

Files changed from the safe source are limited to documentation authority,
generated pages, `js/overlay.js`, the Alpha topology comment in `js/world.js`,
test registration/contracts, and the studio audit scripts. No artwork or media
file changed.

## Test and evidence ledger

### Commands run

- `npm ci` — PASS, 160 packages installed.
- `node --check js/game.js` — PASS.
- `node --check js/overlay.js` — PASS.
- targeted caption, eye-authority and Alpha contracts — PASS.
- `python3 -m unittest tools.studio.test_audit` — PASS, 14 tests.
- `node build.cjs` — PASS; four pages built.
- `node tools/pack-www.cjs` — PASS.
- full collector against clean commit `5b05f20...` — 203 entries.
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/clawbyte-pw-20261107 npx playwright install chromium` — BLOCKED; five official downloads each returned a 0 MiB invalid/truncated ZIP.

### Full collector accounting

| Class | Count | Meaning |
|---|---:|---|
| Runner harnesses | 199 | 32 declared non-browser; 167 browser lanes |
| Infrastructure gates | 4 | build, package, served identity at start/end |
| Pass | 38 | 34 source/headless + 4 infrastructure |
| Blocked | 165 | Chromium executable missing |
| Fail/timeout | 0 | No executed check failed |
| Overall | HOLD | Blocked is not pass |

Raw evidence is in `automated/results.json` and its adjacent canonical logs.
The report started clean at exact commit `5b05f20...`; `dirty_at_start` is empty.
`log_integrity.ok` is true with no bad logs.

### Evidence boundaries

- Source/headless contracts prove narrow state or source invariants only.
- A staged browser test may inject saves, flags, rooms or inventory and cannot
  prove a natural player journey.
- `tests/campaign-ch1.cjs` is the only uninterrupted ordinary-input chapter-one
  certificate; it was blocked before launch.
- Playwright phone emulation is not a physical touch, haptic, safe-area,
  interruption, thermal, audio, controller or memory test.
- Gameplay-size stills prove visible appearance only, never motion, timing,
  audio, input feel or sustained performance.

## Owner-story and chapter-one verdict

Source authority still expresses the intended chain:

1. Mother’s harmony song is hacked and corrupts the kingdoms.
2. The sleeping hero misses the signal and wakes after an electrical fault.
3. The hero reads the first clue, repairs Ratchet’s battery board and wakes him.
4. Ratchet explains the protective crystal and sends the hero toward the caves.
5. Distinct cave discoveries lead through preparation, Gravehorn and the single
   raw marble.
6. Ratchet forges the white Purifier sword.
7. The first Sage is purified, not killed, and reveals CHIME.
8. NULLFANG is a mandatory rescued boss; Alpha is a rewarding optional branch.
9. Purification ends in friendly/golden restoration and chapter handoff.

The source sequence is coherent, but it is not yet certified as the experience
of a real player. The natural campaign, staged browser suites and all physical
device gates remain absent. Caves must not be called meaningful until the
ordinary-input route shows that each discovery is noticed, understood, earned
once, remembered later, and remains correct after death/reload.

## Fifteen-role review

### 1. Senior Cinematic Designer — HOLD P1/P2

- Forty scripted pages are claimed by `docs/story-draft3/CHAPTER-ONE.md`; there
  are 32 revised-page WebPs and 43 named gameplay panels. Counts do not prove
  parity.
- No certified 40-row ledger maps page/hash/cast/equipment/action to runtime
  trigger, text, VFX, audio, skip/reload behavior and gameplay-size capture.
- Caption FIFO/reset now passes a source contract, but rendered 4+ line pacing,
  five locales and skip/reload remain unverified.
- Gravehorn intercuts and four current-contract purification films remain open.

Acceptance: certify 40/40 ledger rows before generating more art; capture each
runtime trigger after normal entry and reload; prove no unread caption loss;
complete only missing intercuts/films with smooth picture and music fades.

### 2. Senior Game Designer, Player Systems — HOLD P1

- Tutorial controller/clarity/progression source contracts pass.
- Historical 950 ms charged-hit and 99V/6-of-7 heal stalls were not reproduced
  today and remain unverified observations, not fresh failures.
- No keyboard/controller/touch sequence or physical haptic/audio evidence ran.

Acceptance: instrument one raw input path, then execute three cleared-state
tap/hold/release/cancel/heal/save/reload cycles per input family. A charged hit
fires once above threshold, never on cancel/focus loss; healing completes and
deducts once; tutorial never freezes movement or enemies.

### 3. Senior Mission Designer, Quest Craft — HOLD P1

- Once-only same-session `questPay` guard passes its narrow contract.
- Cave and campaign browser suites are blocked; Alpha completion and skip are
  source assertions, not naturally understood routes.
- New durable transaction defect is detailed under P1 priorities below.

Acceptance: ordinary-input Ratchet→caves→marble→forge journey twice, once with
Alpha and once skipping A10; exactly one payment, marble and forge across
callback replay, death, tab close and reload.

### 4. Principal Encounter Designer — HOLD P1/P2

- Cave authority assigns distinct discovery/payoff roles to A5, A7, CV1, CV1B,
  CV2, CV3, GA1T/GA1/GA1D and A11–A13.
- `tests/caves-ch1.cjs` stages state, loads rooms and invokes interactions; it
  proves configuration, not discovery, guidance, traversal or motivation.
- Gravehorn’s arena and preparation loop have no fresh rendered proof.

Acceptance: ordinary-input A2→A5→CV1→CV1B→CV2→CV3, plus win and death/retry;
capture every landmark/discovery and exactly-one reward without injection.

### 5. Senior Boss Designer — HOLD P1/P2

- Gravehorn has a substantial state machine but no authored character plates;
  current geometry is explicitly stand-in art.
- NULLFANG gate intent and accepted ritual exist, but live tells, bypass
  resistance, clean friendly state and return from film remain unverified.
- Alpha is physically optional in code; the reconstructed topology contract
  now protects this authority.

Acceptance: authored Gravehorn tell/contact/recovery rig and natural CV1B run;
NULLFANG early-entry denial plus once-only purification/reload; Alpha complete
and Alpha skip routes both reach B1.

### 6. Senior Mission Designer, Campaign — HOLD P1

- Progress source agrees on marble→Purifier→first Sage→CHIME→NULLFANG→B1.
- `campaign-ch1` is the sole no-injection campaign certificate and is blocked.

Acceptance: cleared-storage ordinary-input runs with Alpha completed and
skipped; no direct state writes, teleports or inventory injection; gates,
objectives, deaths, reloads and one-time rewards remain legal throughout.

### 7. Senior Mission Producer — P0 HOLD

- Nov 6 remote review ancestry is corrupt and previous exact audited commit was
  not reachable.
- Today’s source is reconstructed cleanly, built and fully collected, but
  browser, uninterrupted campaign and physical device gates remain absent.
- Production and integration did not change.

Acceptance: publish branch with per-blob remote readback; report exact source
and evidence commits; keep merge/deploy closed until all P1 gates pass.

### 8. Senior Character Artist — HOLD P1/P2

- Preserve the approved hero, Alpha/pack, NULLFANG, crystal, marble and sword
  assets.
- Gravehorn remains visibly procedural and below the hero’s finish level.
- Baked lion optic authority, inactive Servo lighting, one rear hero plate and
  beast recovery coverage require bounded corrections only.
- The alleged Sage-walk grey matte was not reproduced; preserve the accepted
  strip until live evidence proves a defect.

Acceptance: create only missing Gravehorn rig/states and missing wolf recovery;
use eye/light/proportion masks for existing compositions, never wholesale
regeneration.

### 9. Senior Cinematic Director — HOLD P1/P2

- Only Glitch/NULLFANG has a current-contract ritual:
  `purify_glitch_ritual.mp4`, H.264/AAC 1280×720, 13.25 s, SHA-256
  `99674f514b052e53fc57bb006acdf69f69430d83c91d5a9ea0bca85bb1b60e04`.
- Legacy Brood/Atlas/Zero/Prism clips are lower-resolution silent films and do
  not satisfy the current ritual contract.

Acceptance for missing films: white gather→luminous sword raise→slash→impact
flash/hit-stop→black-red extraction into blade→friendly/golden restoration→
smooth picture and music fade; skip/retry commits state atomically. Do not
regenerate Glitch.

### 10. Senior VFX Artist — SOURCE PASS / RENDERED HOLD

- Source implements red ordinary eyes, purple boss/guardian/Alpha eyes,
  pose/facing anchors, world-space finite wisps, cleanup and reduced-motion
  glow without smoke.
- No fresh rendered roster, pose, stop/purify cleanup or sustained budget proof.

Acceptance: every pose/facing anchor remains attached; emit only while moving;
fade completely on stop/hide/purify/remove; never cross rooms or screen-lock;
hard-cap particles; reduced motion suppresses smoke and retains glow.

### 11. Associate Technical Director, World Systems — SOURCE PASS / HOLD

- Required A1→A2→A3 road and optional A10 depth door are source-coherent.
- Cave payoff tests and tile cache are staged/browser work, not natural proof.
- Historical doorway/bake timings are not current evidence.

Acceptance: natural mandatory route without A10; all cave rewards once across
death/reload; no live doorway bake/save hitch; staged cache equivalence plus
uninterrupted campaign and phone-width/device pass.

### 12. Gameplay Engineer, Combat — SOURCE PASS / HOLD P1

- Combat source contains HP/defense/attack values, white flash, debris,
  knockback/recoil, hit-stop, shake and charged impact; source contract passes.
- Browser input, real campaign input, audio, rumble and reduced-motion behavior
  were not executed.

Acceptance: normal claw and ≥0.6 s charged release deal their authoritative
post-defense damage exactly once; charge costs volts once; feedback scales and
expires; protected/friendly/purified targets cannot be damaged; clean campaign
performs pack→heal→burst without injection.

### 13. Gameplay Engineer, Mission — HOLD P1

- Same-session quest callback replay is guarded.
- `grantRelic()` persists before the quest is done; a crash can reload an active
  `ratchet_deep` quest with part of its reward already saved and duplicate scrap.
- `ratchet_forge` is marked/persisted done before `forgeCrystal()`; interruption
  can reload a completed quest without the Purifier and block the story.

Acceptance: settle reward, fetch removal, relic/weapon state and done state as
one durable transaction; persist once; fire presentation afterward. Fault-inject
and reload at every phase for `servo_coil`, `ratchet_deep` and
`ratchet_forge`; no duplicate reward and no done-without-Purifier save.

### 14. Gameplay Engineer, NPC — SOURCE PASS / RENDERED HOLD

- Ratchet repair lifecycle, same-session payment and Sage walk contracts pass.
- Purified Sage source selects `sageWalk8` while moving and `sagePure` at rest,
  addressing the sleeping-slide complaint.
- NPC browser suites and the natural Ratchet/Servo journey are blocked.

Acceptance: ordinary-input Ratchet repair/wake/pod and Servo quest/reload with
no replay; gameplay-size Sage start/turn/walk/stop/room-return/reload with no
sleeping slide or contact damage.

### 15. Lead UI Engineer — CAPTION SOURCE PASS / HOLD P1/P2

- FIFO caption and reset source contract passes without touching game core.
- Locale inventory remains EN 619, AR 600, TR/ZH/RU 215 keys. Missing versus EN:
  AR 19; TR 404; ZH 404; RU 404.
- `OVERLAY_Q` has no cap/dedupe/priority/telemetry. Do not add eviction that can
  discard story; measure, coalesce and protect critical story instead.
- No rendered overflow, five-locale, nested overlay, controller/touch or physical
  device verification ran.

Acceptance: 4+ caption overflow/reset/nested-order footage; separate reveal and
advance presses; five-locale wrap/page/RTL matrix at 1280×720 and 844×390 DPR2;
single input consumption; separate physical iOS/Android proof.

## Gameplay-size visual inspection

The following existing files were inspected directly at their authored or
captured gameplay dimensions. This is static evidence only.

| Priority | Evidence | Observation | Bounded action |
|---|---|---|---|
| P1 | `docs/studio/runs/2026-10-11/images/gravehorn-intro.png`, 844×390 | Pale/translucent segmented placeholder beside finished hero | Authored gunmetal/bronze Gravehorn rig, both facings, planted feet, joint overdraw, projectiles, damage/recovery/retreat states |
| P1 | `assets/manhua/ch1/game/m_down.webp`, 1600×893 | Polished boss panel has visibly red/pink infected eyes | After parity row is certified, mask eyes purple only; preserve composition |
| P2 | `assets/manhua/ch1/game/r_cell.webp`, 1600×893 | Background inactive Servo has lit amber eyes and cyan chest | Mask those lights only |
| P2 | `assets/manhua/ch1/game/passage_b.webp`, 1600×893 | Rear hero proportions are tall/long-limbed | Correct identity/proportion only if parity row fails |
| P2 | `assets/characters/beasts/wolf_crouch4.webp`, 848×97 | Four-cell crouch/tell, not complete collapse/breathe/recover | Add only missing recovery states |
| Preserve | `assets/characters/sage/walk8.webp`, 1536×192 | Transparent eight-cell gait; alleged matte not reproduced | Do not change without gameplay capture proving it |

## Priority backlog

### P0 — before any integration

1. Never use `2718f6e...` or `ca8bf245...` as a base.
2. Verify every changed remote blob equals the local committed blob; explicitly
   verify `js/game.js` remains `c8c027...`, 987,836 bytes and parses.
3. Keep production merge/deploy closed.

### P1 — next implementation cycle

1. Make quest settlement one durable transaction with fault-injection tests.
2. Restore a real Chromium lane, run staged suites, then the unchanged
   uninterrupted `campaign-ch1` before tuning gameplay.
3. Produce the 40-row manhwa parity ledger before new scene generation.
4. Create missing Gravehorn authored rig/states and intercuts only.
5. Prove the natural cave journey, Alpha-complete and Alpha-skip routes.
6. Produce only four missing current-contract purification films; preserve
   Glitch/NULLFANG.

### P2 — polish after certification

1. Bounded lion-eye, Servo-light, hero-proportion and beast-recovery corrections.
2. Five-locale completion and rendered UI matrix.
3. Overlay queue instrumentation/backpressure without story eviction.
4. Physical iOS/Android, controller, audio, haptics, safe-area, interruption and
   sustained performance certification.

## Preserve list

- `assets/characters/hero/**`
- `assets/characters/alpha/**`
- approved `assets/characters/beasts/**`
- `assets/characters/beast/studio-*.webp`
- `assets/sfx/nullfang/**`
- existing approved sword, crystal and marble art
- `assets/video/purify_glitch_ritual.mp4` and its existing fade/audio finish
- `assets/characters/sage/walk8.webp` until live evidence proves a defect
- existing manhwa compositions; use bounded masks/identity corrections only

## Final studio decision

This review improves source safety and evidence integrity but does not certify
the chapter. The exact source builds, packages and passes every runnable check;
the browser-dependent majority, the uninterrupted campaign, and device testing
remain blocked or unrun. The November 7 branch is for selective integration and
continued work only. **No merge and no production deployment were performed.**
