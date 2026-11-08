# One copyable Claude integration prompt

You are the senior integration owner for `zaferdajani/HZD-99`. Fetch current
`main`, then read `docs/DEVELOPMENT_AUTHORITY.md`, `docs/STORY_CANON.md`,
`docs/studio/PIPELINE.md`, `docs/studio/roles.json`, and the complete November 8
report on `codex/studio-review-2026-11-08` before editing. Do not merge or deploy.

SAFETY: production and authorized integration refs are still
`7da3c87e6b43a2357a2f52080814ae1d6adad618`. Use
`codex/studio-review-2026-11-07` commit `d2302a8...` as the safe review ancestry.
Never base, merge or cherry-pick wholesale from corrupt November 6 commits
`2718f6e857d6af608a981d25b3d2fef884ce1f42` or
`ca8bf2457a58679fdca7fdfb0d415abc1852cc1f`. Preserve unrelated changes and
verify every selected local/remote blob, tree, size and syntax after publication.

Selectively integrate the bounded November 8 source delta from exact audited
commit `b9eb06656d793edf782f5af3b3079d378832c86c`:

1. atomic `questPay` settlement in `js/quests.js` with the presentation-only
   paths in `js/game.js` and the expanded payment contract;
2. the CV3 `pillarRewardReady` Gravehorn quarry gate and contract;
3. coordinate-stable broken-tile room-bake identity and contract;
4. Gravehorn combat-brief purple boss-eye correction and eye contract;
5. generated HTML rebuilt from the integrated source.

Recheck semantics, not just patches. A quest hand-in must validate active/done,
clone/build the entire durable outcome, apply exact scrap/IQ, fetch removal,
relic/Purifier ownership, `ratchetCamp`, weapon mode and `done`, persist exactly
once, roll back in-memory state if persistence fails, and show sound/cards/VFX
only after success. Replayed callbacks write nothing. Required exact outcomes:
`servo_coil` +60 scrap/+10 IQ/coil removed; `ratchet_deep` +80 scrap/coin once;
`ratchet_forge` shard removed/+10 IQ/crystal+Purifier/weapon single/ratchetCamp.
Browser-reload and natural-campaign proof are still required; source contracts
are not enough. Consider a narrow migration for legacy saves with
`ratchet_forge=done` but missing Purifier only after authority review.

The CV3 marble may remain visibly present, but no attack can remove/reward it
before legitimate `bossHorn`. Test attack, death, room exit and reload; an
evade→marble→reload route must never erase Gravehorn. Different equal-count
broken-tile coordinate sets must produce different cache signatures and one
correct rebake; run the full rendered `roomcache` pixel/timing suite.

Do not hide the new mission blocker: `ratchet_deep` and multiple cave secrets
all use durable relic ID `coin`; `grantRelic`/`sr_coin` deduplicate globally.
Do not invent lore or silently rename IDs. Obtain mission/story authority for
distinct durable IDs or explicitly revised payoffs, then test every acquisition
order across death/reload and prove each source is understandable and paid once.

Do not generate new manhwa panels until authority resolves the canonical target.
`docs/STORY_CANON.md` says Draft 3 and a forty-page target; `manhua/full-story.md`
and `manhua/edition.json` say Draft 4, while the edition has 32 illustrated
entries and says expanded scenes remain unillustrated. Record the owner's chosen
revision and parity unit (page, shot, or beat), then build a literal manifest
mapping each unit to source hash, cast/equipment/action, runtime asset/trigger,
text, VFX/audio, skip/reload behavior and gameplay-size evidence.

Preserve completed hero, Alpha/pack, NULLFANG, crystal, marble, sword and Sage
walk assets and every accepted composition. Preserve
`assets/video/purify_glitch_ritual.mp4`; do not regenerate it. Create only proven
missing work: authored Gravehorn gunmetal/bronze rig with tells/contact/recovery,
projectiles, damage, defeat and retreat; required Gravehorn intercuts; and
current-contract rituals for Brood, Atlas, Zero and Prism. Every ritual must show
white gather→luminous raised sword→cinematic slash→flash/hit-stop→black-red virus
extraction into blade→friendly/golden restoration, then smoothly fade picture
and music. Never end by cutting the soundtrack.

Boss infection eyes are purple `#ba5cff`; ordinary infected eyes are red.
Red/orange on bosses is allowed only for attack tells, hazards, vents or cracks.
Eye trails must originate from current-pose anchors for both facings, emit only
while moving, fade completely on stop/hide/purify/remove, stay in world space,
never cross rooms, obey a hard particle/GPU cap, and suppress smoke while
retaining glow under reduced motion. Do not repaint `m_down.webp`; after the
canonical parity row is approved, mask only its red boss eyes to purple.

Restore a pinned working Chromium lane. Label evidence as: source/headless;
staged browser with every injected save/room/flag/inventory/position disclosed;
uninterrupted cleared-storage ordinary-input campaign; or physical device.
Run the unchanged `campaign-ch1` without state injection through wake→letter→
battery puzzle→Ratchet→pod/Volt Pack→A2 landmark→A5/CV1/CV1B/CV2/CV3→
Gravehorn→one marble→forge→first Sage purification→CHIME→NULLFANG→B1. Run once
with Alpha and once skipping A10; both must reach B1 and survive death/reload.
Prove each cave discovery is visible, purposeful, rewarded once and reflected
later. Staged tests do not certify this route.

Fault-inject Ratchet and Servo power/intro boundaries so reload is either fully
old or fully continued, never a powered NPC with a skipped/lost continuation.
Capture the purified Sage start, turn, walk, stop, room return and reload at
1280×720 and 844×390; no sleeping slide or contact damage.

For combat, instrument raw input down/up, focus/cancel, charge, release consumer,
volts/cores and busy locks. Prove one 12-point normal claw hit and one 38-point
≥0.6 s burst costing exactly 25V, with no cancel release. White flash, metallic
debris, recoil/knockback, hit-stop, shake, sound and haptics fire once per
confirmed contact, scale for charge and expire. Friendly/purified targets take
zero damage. Use physical keyboard/controller/iOS/Android for final certification.

For UI, complete five-locale parity (current base inventory EN 619, AR 600,
TR/ZH/RU 215), then verify 4+ caption FIFO, nested overlays, reset, separate
reveal/advance presses, wrap/page/RTL and one input consumer at 1280×720 and
844×390 DPR2. Add queue telemetry and safe coalescing; never cap by discarding
critical story. Centralize or assert exclusive full-screen overlay ownership.

Run `npm ci`, syntax, build, pack, audit units, all targeted contracts, the full
collector, staged browser suites, uninterrupted campaign and separate devices on
the exact committed source. Expected November 8 baseline is 205 collector
entries (40 pass, 165 browser-blocked), 203 actual logs with
`log_integrity.ok=true`; after integration totals must reconcile with the current
runner inventory. Attach chronological raw logs, captures, final saves, exact
commit/tree, and per-file local/remote blob manifest. If a lane is unavailable,
say BLOCKED—not pass. Report what changed, preserved and remains unverified.
Push only an integration/review branch. Do not merge or deploy production until
all P0/P1 acceptance gates pass.
