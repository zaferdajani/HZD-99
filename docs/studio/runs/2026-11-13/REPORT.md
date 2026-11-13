# CLAWBYTE Senior Studio Review — 2026-11-13

## Release decision

**HOLD — do not merge or deploy production.** This review branch is a cumulative,
rebased candidate: it keeps today's PRISM timing change from `main` and restores
the bounded November 12 fixes that production never inherited. Build, packaging,
44 headless/source checks, and raw-log integrity pass. The host forbids Chromium's
Unix socket before a page can open, so rendered gameplay, ordinary-input routes,
audio, haptics, physical devices, and sustained performance remain uncertified.

| Boundary | Result |
|---|---|
| Production `main` / `odyssey` | `82cce7926e13edfb2bacc832bf2ae5b450aa5317`, unchanged |
| Authorized Claude integration | `7da3c87e...`, parent of current `main` |
| Previous review | `codex/studio-review-2026-11-12` at `cdba97ce...`; audited source `c2c32087...` |
| Exact audited source | `24493542230e7738267e3d4bb1639b841ace037d`, tree `a61e09076024294a1bc5fb27eec9823eab6269f9` |
| Review branch | `codex/studio-review-2026-11-13` |
| Build/package | PASS: four pages; 694 assets + two packaged pages, 252.5 MB |
| Automated evidence | 211 records: **44 pass, 167 blocked, 0 executed failures/timeouts** |
| Raw-log integrity | PASS: 209/209 logs match their embedded snapshots |
| Staged browser checks | BLOCKED before page creation: `AF_UNIX` socket creation returned `EPERM` |
| Uninterrupted campaign | NOT RUN; browser preflight blocked both ordinary-input lanes |
| Production merge/deploy | NOT ATTEMPTED |

The 44 passes are deliberately narrow. They do not certify animation weight,
first-beat attack recognition, current-build artwork, touch/controller behavior,
music handoff, vibration, or campaign comprehension.

## Comparison with November 12

Production advanced by one PRISM warning-timing commit, but it did not inherit
the November 12 candidate. Exact comparison showed the collision sweep, atomic
quest hand-ins, generic NPC settlement, Gravehorn quarry guard and purple optic,
rescued-Sage gait, caption FIFO, coordinate-sensitive tile cache, Alpha optional
documentation, and collector hardening were all missing from `main`. They were
selectively reapplied; generated HTML and evidence were not copied.

The prior run contained 208 records (42 pass, 166 blocked). This run contains
211 (44 pass, 167 blocked): the new headless Mind Node and PRISM contracts pass,
while the rendered boss-window check is blocked. No asset was regenerated.

## Verified bounded changes on this review branch

1. Terminal falls sweep every crossed tile row at 30/60 Hz while preserving
   deliberate NULLFANG `thruPlat` descent.
2. Quest rewards and the Purifier forge hand-in settle atomically; completed
   legacy forge saves recover idempotently.
3. The CV3 marble pillar cannot pay before Gravehorn's retreat ledger is valid.
4. Generic NPC restoration commits cell, awake/repaired state and durable gift
   in one write. The scripted opening callbacks remain an explicit P1 gap below.
5. The rescued Sage selects the existing eight-cell walk strip while travelling
   and the kneeling plate only at rest.
6. Gravehorn's infected optic is consistently boss purple; amber warnings and
   red environmental hazards remain separate.
7. Critical scene captions promote unread text in FIFO order and reset safely.
8. Room-cache signatures include broken-tile coordinates, not only their count.
9. Alpha is documented and tested as an optional post-Purifier depth branch.
10. Controller door directions show fixed D-pad labels rather than an invented
    pause-menu route; keyboard, touch and remapped action labels are preserved.
11. Back exits a Mind Node from initial countdown, retry countdown, demonstration,
    and input without paying or changing progress.
12. PRISM's document and harness now agree on 350/500/700 ms nominal warnings;
    the harness fails on missing real room actors, update exceptions, absent named
    moves, and collapsed dash/pounce/spread pairs.
13. The collector preflights browser capability, separates blocked from failed,
    pins source/served identities, and verifies every raw log.

## Senior role findings

| # | Senior responsibility | Verdict | Evidence and required next step |
|---:|---|---|---|
| 1 | Cinematic design | **HOLD P1** | `STORY_CANON.md` names Draft 3 while the edition and full story name Draft 4; all 32 illustrated rows remain uncertified for full-scene parity. Page 29 and 32 actions do not match runtime. Prism's fallback extracts a virus although current copy says Prism was never infected. Owner must pin edition, parity unit, and Prism's canon before art changes. |
| 2 | Player systems | **SOURCE PASS / RUNTIME HOLD** | Fixed D-pad door labels and Mind Node Back behavior pass exact production-function contracts. Physical pad, touch, focus and rendered tutorial remain unverified. PRISM timing is not proof that players identify attacks in time. |
| 3 | Quest craft | **HOLD P1** | Atomic quest/forge and CV3 guard pass. QST-03 remains open: Ratchet's survey, D2, A11 and A13 share `coin`/`sr_coin`; one claim suppresses the others. Approve four distinct discovery IDs/payoffs and a migration that does not pretend ambiguous legacy `sr_coin` proves three claims. |
| 4 | Encounter design | **SOURCE PASS / RUNTIME HOLD** | Swept collision, CV3 ledger and Alpha optional topology contracts pass. Actual landings, one-way pounce behavior, ordinary-input Alpha-skip and Alpha-complete routes remain blocked. |
| 5 | Boss design | **HOLD P1/P2** | Extracted PRISM timers separate 367/333/367 ms to 367/533/733 ms at 30 Hz, but warning art still reuses the idle clip and shared amber language. The new harness is fail-closed but could not render. Gravehorn remains procedural; rear-kick cue-to-contact needs measurement before retuning. |
| 6 | Campaign design | **HOLD P1** | Source ordering passes; neither uninterrupted route ran. Ratchet and Servo's actual opening callbacks still persist cell removal, wake and completion in separate writes, bypassing the repaired generic helper. GB1/GC1/GD1/GX1/GE1 still repeat terminal 5 and the same layout without local consequence. |
| 7 | Mission production | **HOLD** | Only this review branch was published. Source, build and served identities are recorded. No merge, production push, or deployment occurred. |
| 8 | Character art | **HOLD P1/P2** | No art changed. Gravehorn has no runtime files for its 14 frozen part keys. `wolf_crouch4.webp` is anticipation, not recovery. The existing Sage `walk8.webp` is 1536×192 (eight 192×192 cells) and is now wired in source; current motion remains unrendered. |
| 9 | Cinematic direction | **HOLD P1** | Only Glitch uses the current authored ritual. Four guardians use in-engine extraction fallbacks; legacy clips are not proof. The Glitch master is 1280×720, 13.25 s and ends on uniform black/digital silence, but game music fade, skip/error/reload and return remain unverified. |
| 10 | VFX | **SOURCE PASS / RENDER HOLD** | Exact-source checks cover red small-enemy and purple boss trails, finite tier caps, lifetime, cure/removal/teleport cleanup and reduced-motion emission suppression. Gravehorn's purple anchor is restored. Current gameplay-size trails and live reduced-motion toggling remain unverified. |
| 11 | World systems | **SOURCE PASS / RENDER HOLD** | Collision sweep and coordinate-sensitive tile signature pass. Current-build landings, save-switch bakes and platform traversal could not render. |
| 12 | Combat systems | **SOURCE PASS / RUNTIME HOLD** | Impact/stat/ledger contract passes and PRISM timing contract is fail-closed. Rendered hit stop, shards, knockback, screen shake, sound, vibration and attack recognition remain blocked. A 24% active-state share is not an attack-count proof. |
| 13 | Mission engineering | **HOLD P1** | Atomic generic mission paths pass. QST-03 migration needs owner-approved identities. Actual scripted opening settlement remains split-write and needs fault-injected tests through the real callbacks. |
| 14 | NPC systems | **HOLD P1** | Generic restore and Sage gait pass. Ratchet/Servo scripted restoration can still consume a cell before the awake flag survives; Ratchet's spare presentation can also be skipped by an interrupted explanation. Use one durable settlement with an owed/pending presentation state. |
| 15 | UI engineering | **SOURCE PASS / RENDER HOLD** | Caption FIFO and focus-loss contracts pass. Overlay ownership is still unbounded (generic PAUSE requests can queue during dialogue). Effective locale inventory remains EN 619, AR 600, TR/ZH/RU 215 each; rendered RTL, wrapping and physical-device checks remain open. |

## Story, caves, manhwa and artwork review

- The owner's Chapter One causal spine exists in source: wake, Ratchet letter,
  battery repair, meaningful cave route, marble, forge, Sage cleansing, CHIME,
  NULLFANG. Source contracts cannot prove that a first-time player understands it.
- GA1 has a story consequence and GA2 has Alpha-specific pack behavior. The five
  later guardian networks remain mechanically repetitive. Do not invent their
  stories in code; require one local action, durable consequence and later callback
  for each, then test first visit and return.
- Draft 3/Draft 4 authority is unresolved. Native panels `m_down`, `r_cell` and
  `passage_b` contain localized visual continuity errors, but their compositions
  should be preserved until the edition is pinned.
- No completed asset was regenerated. Preserve these reviewed identities:
  - `assets/characters/beast_parts.webp`: `ccc6589629af106f624e86444945f805adc02f4a4c972bfdcc73612b970cafb1`
  - `assets/characters/sage/walk8.webp`: `b3dd2e1e32a63ae83a788958eb987784bf3cbb8ace07f8a3c9363210bce5bb4f`
  - `assets/video/purify_glitch_ritual.mp4`: `99674f514b052e53fc57bb006acdf69f69430d83c91d5a9ea0bca85bb1b60e04`

## Staged tests versus real play

The audit collector requested all 211 registered checks. Headless/source checks
ran normally. Browser capability was tested once and failed before page creation;
all 167 dependent records were marked **blocked**, not failed or passed. The
campaign contract itself passed because it correctly rejects missing/partial
evidence; that is not a playthrough. Neither the Alpha-skip nor Alpha-complete
ordinary-input route, deliberate death/Continue, physical touch/controller, nor
fresh gameplay-size visual inspection is certified.

Evidence is in `docs/studio/runs/2026-11-13/automated/`. `results.json` is the
machine record; `AUTOMATED.md` is the readable index; `log-integrity.json` proves
209/209 raw logs match the collector snapshots.

## Integration order and stop conditions

1. Start from current `main`; integrate this review branch by reviewed source
   commits, never by copying generated HTML or old evidence.
2. Preserve today's PRISM timings and the completed assets listed above.
3. Add atomic settlement to the real Ratchet and Servo opening callbacks and
   fault-inject/replay those callbacks before claiming NPC restore complete.
4. Obtain owner decisions for Draft 3/4, Prism infection, QST-03 discoveries,
   and the five repeated cave stories. Stop rather than invent canon.
5. Regenerate all four pages once after source integration.
6. On a host where Chromium can open a page, run the full collector, both
   uninterrupted campaign variants, current-build 844×390 and 1280×720 captures,
   mute/reduced-motion passes, and physical controller/touch checks.
7. Merge or deploy only after zero executed failures/timeouts, no blocked P1
   acceptance lanes, signed role verdicts, and verified branch/tree identities.

## Files changed by the review candidate

Source and documentation changes are confined to the reviewed collision, quest,
NPC helper, Sage, Gravehorn, captions, packs, cache, tutorial, trials, PRISM
documentation/harness, tests and collector. No image, audio, video, generated HTML,
`main`, `odyssey`, or production deployment was changed.
