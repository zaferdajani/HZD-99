# Copyable Claude integration prompt — 2026-11-06

You are integrating the CLAWBYTE/HZD-99 senior studio review. Work from branch
`codex/studio-review-2026-11-06`. Read
`docs/studio/runs/2026-11-06/REPORT.md`,
`docs/studio/runs/2026-11-06/automated/results.json`,
`docs/studio/PIPELINE.md`, `docs/studio/roles.json`,
`docs/DEVELOPMENT_AUTHORITY.md`, and `docs/STORY_CANON.md` before editing.

Do not merge or deploy production automatically. Preserve other contributors'
changes and accepted hero, sword, crystal, Alpha/pack, NULLFANG, manhwa, audio,
and Glitch purification assets. Do not regenerate an asset merely because it is
listed in a queue. Make bounded, reviewable commits and report exact tests,
screenshots, failures, and unverified scope.

Integrate the authored-source changes from exact audited commit
`f02e519e1cb52bc69df15932c51703e2a85e439e`:

1. Preserve the scene-caption FIFO fix in `js/overlay.js` and the reset in
   `js/game.js`. Three captions may be visible; additional critical captions
   queue without evicting unread readers. Keep `scene-caption-contract` passing,
   then add a rendered overflow test proving the fourth caption appears only
   after the first is read/faded.
2. Preserve the corrected audit classification: `hero-delivery`,
   `hero-frame-alpha`, and `hero-alpha` use Playwright and must never be marked
   `noBrowser:true`. Keep the new audit unit regression passing.
3. Preserve the required road `A1→A2→A3→A4` and keep A10 as an optional Alpha
   depth-door branch. Never route the required campaign through A10.
4. Preserve infection-eye authority: ordinary infected eyes/trails are red;
   bosses and guardians are purple. NULLFANG's red/orange seams are hazard/tell
   accents only. Correct `assets/manhua/ch1/game/m_down.webp` with a masked
   purple-eye edit only after it fails the 40-row parity ledger; do not redraw
   the composition.

Then execute these gates in order:

## 1. Verification infrastructure

- Install/use a pinned Chromium executable and record its exact version/path.
- Diagnose the collector raw-log race. The Nov 6 run retained valid embedded
  byte snapshots but raw `offline-release.log` and `reel-contract.log` were
  truncated; a clean rerun affected two different logs. Fix the ownership or
  atomic-write cause, do not conceal it by blindly rewriting damaged logs.
- Run `npm ci`, `python -m unittest tools.studio.test_audit -v`, JavaScript/Python
  syntax checks, `node build.cjs`, `node tools/pack-www.cjs`, and the full
  collector on one exact clean commit. Require zero integrity mismatches.
- Classify evidence honestly: source contract, staged browser, uninterrupted
  real-input, gameplay-size still, and physical device are different classes.

## 2. Uninterrupted chapter-one campaigns

From cleared storage and ordinary controls only, run:

`wake → letter → battery board → Ratchet → pod/Volt Pack/heal → CV1 → CV1B →
CV2 → CV3 → Gravehorn → raw marble → Ratchet forge → first Sage → CHIME →
NULLFANG purification → B1`.

Run it twice: complete Alpha once and explicitly skip A10 once. Do not inject
flags, inventory, rooms, positions, saves, teleports, or debug completion.
Prove forward-only tutorial logic, visible objectives, lion-den lock until the
marble sword exists, meaningful cave discoveries/rewards, changed return
dialogue, once-only payment, death/retry, reload, and legal B1 arrival.

## 3. Held input and combat feel

Instrument raw down/up ownership, device, timestamps, focus/visibility/cancel,
charge accumulator, and release consumer. Repair the first lost ownership path;
do not lower thresholds or auto-complete tutorials. Certify tap, hold, release,
cancel, charge, heal, exact cost, save/reload, and attack statistics on keyboard,
controller, and touch. Every hit must apply one bounded bundle: white target
flash, attacker and target audio layers, robotic shards/screws, small defender
knockback, smaller attacker recoil, camera shake, and hit-stop. Charged attacks
must be stronger and more dramatic but bounded and reduced-motion aware.

## 4. Gravehorn, caves, and boss purification

- Replace the procedural Gravehorn placeholder with identity-locked authored
  gunmetal/bronze art: both facings, planted hooves, complete joint overdraw,
  horn socket/projectile layers, attack/warn/recovery/phase-two/retreat coverage,
  and four authored live-beat intercuts.
- Certify horn throw/return, charge, jump, toss/parry, recoveries, rear kick,
  phase two, retreat, win/death/retry, and exactly one raw-marble reward.
- Keep caves mechanically and narratively distinct; prove each offer,
  discovery, consequence, return, and reload in natural play.
- Preserve `assets/video/purify_glitch_ritual.mp4`. Produce only the missing
  current-contract Brood, Atlas, Zero, and Prism films: white flakes gather into
  the raised sword, cinematic slash, impact flash/hit-stop, black-red virus
  extraction into the blade, friendly/golden restoration, smooth picture fade,
  and smooth music fade. Skip/retry must settle state/rewards atomically.

## 5. Manhwa parity, NPC art, and UI

- Create a literal 40-row chapter-one parity ledger before generating anything:
  page/image hash, cast, equipment, action, room/key, trigger, VFX/audio,
  skip/reload, gameplay-size capture, and reviewer verdict. Generate/correct only
  failed rows.
- `r_cell.webp`: if the ledger/runtime state confirms Servo is inactive, mask
  only the amber eye and cyan chest illumination.
- `passage_b.webp`: correct the off-model rear hero only if its ledger row fails.
- `wolf_crouch4.webp`: add only genuinely missing down/breathe/recover coverage.
- Do not edit `assets/characters/sage/walk8.webp` unless a live gameplay-size
  capture reproduces a defect; the claimed grey matte was not reproduced in the
  Nov 6 checkerboard inspection.
- Finish queue ownership, dedupe, bounded capacity, retirement telemetry, and
  five-locale parity. Current base counts are EN 619, AR 600, TR/ZH/RU 215.

## 6. Finite infection-eye trails and final evidence

For every infected roster member, derive eye anchors from the current animation
pose and facing. Emit red trails for ordinary infected and purple trails for
bosses/guardians only while moving. Trails must fade to exactly zero after stop,
hide, purify, or removal; particle count and GPU cost must remain bounded. Test
30/60/120 Hz equivalence and long idle/removal cases. Capture gameplay-size
before/move/stop/purified frames and performance measurements.

Run all 15 senior role gates. Deliver a changed-files list, exact commits,
commands/results, staged versus uninterrupted evidence labels, screenshots at
gameplay size, remaining blockers, and a release verdict. Merge/deploy only if
every P1 gate passes on the same exact candidate commit; otherwise push a review
branch and leave production untouched.
