# One copyable Claude integration prompt

You are the senior integration owner for `zaferdajani/HZD-99`. Work from a fresh
fetch of `main`. Read `docs/DEVELOPMENT_AUTHORITY.md`, `docs/STORY_CANON.md`,
`docs/studio/PIPELINE.md`, `docs/studio/roles.json`, and the complete report at
`codex/studio-review-2026-11-07:docs/studio/runs/2026-11-07/REPORT.md` before
editing anything.

CRITICAL SAFETY RULE: do not merge, cherry-pick, or base work on
`2718f6e857d6af608a981d25b3d2fef884ce1f42` or
`ca8bf2457a58679fdca7fdfb0d415abc1852cc1f`. The November 6 remote branch has a
truncated/corrupt `js/game.js` (786,444 bytes / 7,276 lines / invalid syntax)
while the valid file is blob `c8c027fbf7bc2159103b5dce1f1082b8102d08a4`
(987,836 bytes / 18,206 lines / valid syntax). Production `main` is intact.
Use only the reconstructed November 7 branch and verify every selected blob.

First integrate the bounded source delta from `codex/studio-review-2026-11-07`
onto current `main`, preserving unrelated changes. The intended delta is only:

1. caption FIFO and reset in `js/overlay.js` plus
   `tests/scene-caption-contract.cjs`;
2. Alpha optional-route authority/comment and contract;
3. ordinary infected red eyes versus boss/guardian/Alpha purple authority and
   contract;
4. removal of false `noBrowser:true` labels from `hero-delivery`,
   `hero-frame-alpha`, and `hero-alpha`;
5. audit regression for browser classification;
6. atomic canonical-log finalization and its unit regression;
7. generated pages rebuilt from the integrated source.

Do not accept any change to `js/game.js` from the Nov 6 branch. The Nov 7
caption reset deliberately uses existing `overlayClear()` so the huge valid game
core stays untouched. Before continuing, run syntax, build, pack, targeted
contracts and audit units. Fetch/read the resulting remote branch and compare
every changed blob SHA and size with the committed local object; never transport
a large blob through unverified capped command output.

Then implement the highest-priority new P1 defect as a small reviewed change:
make `questPay` settlement one durable transaction. Today `grantRelic()` persists
before the quest becomes done, so `ratchet_deep` can reload active with partial
reward and duplicate scrap; conversely `ratchet_forge` is persisted done before
`forgeCrystal()`, so interruption can reload a completed quest without the
Purifier and block the story. Validate active/complete, mutate scrap/IQ, remove
the fetch item, apply relic/weapon/forge durable state without nested persistence,
mark the quest done directly, persist exactly once after the complete durable
state exists, then fire non-durable sound, particles, cards and dialogue. Add
fault-injection/reload tests at each settlement phase for `servo_coil`,
`ratchet_deep`, and `ratchet_forge`. Repeated callback, death, reload, tab close,
room transition, and interruption must yield exactly one reward; no reachable
save may have `ratchet_forge=done` without crystal/Purifier or active
`ratchet_deep` with already-paid scrap.

Do not regenerate completed artwork or media. Preserve hero, Alpha/pack,
NULLFANG, crystal/marble/sword art, accepted Sage walk, all existing compositions,
and `assets/video/purify_glitch_ritual.mp4` (SHA-256
`99674f514b052e53fc57bb006acdf69f69430d83c91d5a9ea0bca85bb1b60e04`).
Create or edit art only after the exact failed evidence row is known:

- P1: authored gunmetal/bronze Gravehorn rig and required tell/contact/recovery,
  projectile, damage, defeat and retreat states; four missing intercuts.
- P1: certify a literal 40-row manhwa parity ledger before generating scenes.
- P1: create current-contract purification films only for Brood, Atlas, Zero and
  Prism. Each requires white gather, glowing sword raise, cinematic slash,
  flash/hit-stop, black-red extraction into blade, friendly/golden restoration,
  and smooth picture plus music fade. Do not regenerate Glitch/NULLFANG.
- P2 after parity failure only: mask `m_down.webp` boss eyes purple, mask inactive
  Servo lights in `r_cell.webp`, correct rear hero proportions in
  `passage_b.webp`, and add missing wolf down/breathe/recover states. Do not
  repaint whole compositions. Do not modify `sage/walk8.webp` without a live
  gameplay-size capture proving a defect.

Keep infection VFX finite and professional: ordinary infected eyes red;
bosses, guardians and Alpha purple; trail originates from current-pose eye
anchors for both facings, emits only while moving, fades completely on stop,
hide, purification or removal, never screen-locks or crosses rooms, obeys a hard
particle/GPU cap, and suppresses smoke while retaining glow under reduced motion.
Red/orange on a boss may remain only as a hazard marking or attack tell.

Do not redesign cave topology from source alone. Restore a real pinned Chromium
lane, then run and label evidence honestly:

1. source/headless contracts;
2. staged browser tests, clearly identifying save/flag/room/inventory injection;
3. the unchanged `campaign-ch1` uninterrupted cleared-storage ordinary-input
   run with no state injection;
4. separate physical keyboard/controller/iOS/Android checks for touch, haptics,
   audio, safe areas, interruption and performance.

The natural chapter must prove: wake→letter→battery repair→Ratchet→pod/Volt
Pack→A2 landmark→A5/CV1/CV1B/CV2/CV3→Gravehorn→exactly one raw marble→Ratchet
forge→first Sage purification→CHIME→NULLFANG purification→B1. Run one route that
completes Alpha and one that explicitly skips A10; both must reach B1 and survive
death/reload. A4 must remain unreachable before forged blade + first Sage +
CHIME. Each cave discovery must be visible, purposeful, rewarded once and
reflected later. Source contracts or staged saves are not substitutes for this
journey.

For combat, do not tune thresholds speculatively. Instrument raw input down/up,
focus/cancel, charge accumulator, release consumer, volts/cores and busy/state
locks. Prove tap, ≥0.6 s charged release and heal from 6/7 at 99V using ordinary
input. White flash, metal debris, knockback/recoil, hit-stop, shake, sound and
damage must scale and expire; friendly/purified targets must not take damage.

For UI, prove a rendered 4+ caption overflow where the oldest unread line is
never evicted and the fourth promotes only after read/fade. Test nested
dialog/item/offer/cinematic ordering, reset, separate reveal/advance presses,
wrap/pagination, RTL and single input consumption at 1280×720 and 844×390 DPR2.
Locale inventory is EN 619, AR 600, TR/ZH/RU 215; fallback is not parity. Do not
add a queue cap that discards story text—instrument and coalesce safely.

Run `npm ci`, syntax checks, build, pack, all audit units, the full collector,
staged browser suites, and the uninterrupted campaign on the exact committed
source. Require collector totals to reconcile with runner inventory and
`log_integrity.ok=true`. Attach raw chronological logs, gameplay-size captures,
final save, exact commit/tree, and a per-changed-file local/remote blob manifest.
If Chromium or device testing is blocked, say BLOCKED and do not translate that
to pass. Do not merge or deploy production until all P0/P1 acceptance gates pass.
Report exactly what changed, what was preserved, which evidence is source,
staged, uninterrupted or physical-device, and the remaining blockers.
