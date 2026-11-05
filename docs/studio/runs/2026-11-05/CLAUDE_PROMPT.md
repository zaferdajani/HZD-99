# Copy this entire prompt to Claude

Work in `zaferdajani/HZD-99`. Treat `main` and the authorized integration ref as
production authority. Review and selectively integrate
`codex/studio-review-2026-11-05`; do not blindly merge it, do not deploy, and do
not overwrite unrelated work. Read these first:

- `AGENTS.md`
- `CLAUDE.md`
- `docs/DEVELOPMENT_AUTHORITY.md`
- `docs/STORY_CANON.md`
- `docs/STORY_SCRIPT.md`
- `docs/CAVES_CH1.md`
- `docs/ART_QUEUE.md`
- `docs/studio/PIPELINE.md`
- `docs/studio/roles.json`
- `docs/studio/runs/2026-11-05/REPORT.md`
- `docs/studio/runs/2026-11-05/automated/AUTOMATED.md`
- `docs/studio/runs/2026-11-05/automated/results.json`

Repository facts:

- Reviewed production base:
  `7da3c87e6b43a2357a2f52080814ae1d6adad618`.
- Production, `odyssey`, and `claude/clawbyte-repo-migration-byhyl8` had not
  moved at review time.
- The bounded authored-source tree is published in ancestor
  `f0265a35e0b3b5987619638352c05625f947712c`; the local reviewed branch carries
  it as `ecd9f944...` and rebuilds generated pages at exact local commit
  `ecc45d7ac1da36c4874d7f5a37af5eb8d9550fa7`.
- Run `node build.cjs` after selecting authored source; do not trust stale
  generated HTML.
- The Nov 5 collector accounted for 201 entries: 36 pass and 165 blocked.
  Browser work was blocked because Chromium was unavailable. This is a HOLD,
  not a gameplay pass.
- Only `campaign-ch1` is an uninterrupted real-input certificate. Most browser
  tests are staged. Never present staged tests, source contracts, still images,
  mobile viewport emulation, or `complete_requested_scope=true` as a natural
  campaign or physical-device pass.

Integrate the bounded fixes together unless superseded by a verified newer
implementation:

1. Purified moving Sage uses distance-driven `sageWalk8`; stopped Sage uses
   `sagePure` and never slides in a sleeping/kneeling pose.
2. `questPay` rejects missing/completed quests before awards or effects and
   remains byte-stable on replay/reload.
3. Alpha is an optional post-Purifier A2 depth-door side quest. It never gates
   A2→A3→A4, NULLFANG, or B1.
4. Gravehorn and all bosses use purple infection eyes; ordinary infected
   creatures use red. Preserve current-frame eye anchors and finite trails.
5. Pack fetch headers/body abort after 15 seconds through the existing failure
   path.
6. Preserve the fail-closed audit collector and its PID-namespace, identity,
   snapshot, quiet-window and log-integrity checks.

Do not regenerate accepted hero, sword, crystal, Alpha/pack, NULLFANG, or
`assets/video/purify_glitch_ritual.mp4`. Do not redesign already meaningful
caves before observing them in ordinary play. Preserve unrelated changes.

Implement and verify in this order:

## 1. Restore the evidence lane

Provide a pinned Chromium compatible with Playwright 1.62.1. Run `npm ci`, audit
unit tests, syntax, all four builds, package, targeted contracts, and then the
full collector on one exact committed candidate. Require zero blocked/failed P1
entries and zero log-integrity mismatches. Report staged, uninterrupted,
gameplay-size and physical-device evidence separately.

## 2. Fix mandatory held-input ownership

Instrument raw down/up ownership, timestamp, device, focus/visibility/cancel,
charge accumulator and release consumer across keyboard, controller and touch.
Reproduce and fix the first lost path. Do not lower the 0.6 s attack-charge or
0.85 s heal thresholds and do not auto-complete lessons. Remove noisy tracing
after tests exist.

Acceptance: three consecutive runs per input family; tap never charges; a
950 ms hold charges exactly once; heal completes exactly once; blur, visibility
loss, pointer cancel and disconnect cancel safely; a fresh input recovers; save
and reload preserve tutorial continuity.

## 3. Protect story presentation

Fix `sceneCaption()` so unread critical narrative is never evicted. Replace
unbounded/nondeterministic overlay and panel queues with bounded typed queues:
stable priority, FIFO within priority, dedupe key, explicit retirement reason
and overflow telemetry. Story/dialogue outranks shop/decorative messages.
First input completes progressive reveal; a distinct later input advances.

Fill the 19 missing Arabic base keys and 404 missing base keys in each of
Turkish, Chinese and Russian, plus missing draft story text. Add parity checks
that fail the build. Verify five locales at desktop and phone sizes, including
RTL joining/alignment, CJK wrapping and glyph coverage.

## 4. Prove the complete campaign twice

With cleared storage and ordinary input only, record:

1. wake→letter→battery board→Ratchet→pod/Volt Pack/heal→CV1/CV1B/CV2/CV3→
   Gravehorn→raw marble→Ratchet forge→first Sage→CHIME→NULLFANG purification→B1;
2. the same required route while explicitly declining/skipping Alpha and never
   entering A10.

Do not inject saves, rooms, entities, inventory, flags, positions, teleports or
completion. Test death/retry and reload at every gate. The marble must precede
the forge, the forged Purifier must precede the first Sage rescue, and the lion
den/B1 must remain physically inaccessible before their milestones.

For every optional cave loop, prove offer→readable landmark→distinct action→
distinct reward→visible world/NPC consequence→return dialogue→reload
persistence. Early coil/survey/marble discoveries must adapt later dialogue and
must not force an empty revisit.

## 5. Finish Gravehorn without changing the hero

There is no authored Gravehorn rig. Produce only the queued identity-locked set:
gunmetal/bronze body, both facings, planted hooves, joint overdraw, separate horn
sockets/projectiles, charge/jump/toss/parry/recovery/rear-kick/phase-two/retreat
coverage. Add only `gh_intro_a`, `gh_intro_b`, `gh_phase2`, and `gh_down` at
their real gameplay beats. Keep the existing state machine unless a test proves
a defect.

Acceptance: gameplay-size approval, three consecutive staged mechanics passes,
then ordinary-input CV1B→CV2→CV3 win/death/retry, readable telegraphs, one raw-
marble reward, and no collision/save regression.

## 6. Certify combat feel, motion and finite eye trails

Normal and charged contacts must apply bounded white hit flash, attacker and
target audio, robotic screws/shards, defender knockback, small attacker recoil,
camera impulse and hit-stop; charge is stronger but never obscures telegraphs.
Reduced motion removes shake/hit-stop while retaining readable contact.

All characters must draw HP, attack power, attack speed and defense from one
authoritative data source and keep the existing balance ledger current.

Ordinary infected eyes are red; boss eyes are purple. Trails originate at the
current sprite-frame eye anchor for both facings, emit only while appropriate,
and decay to zero in finite time after stop, hide, purification, removal or room
change. Bound particles and GPU cost. Test every roster member and pose at
30/60/120 Hz and on real devices. Equal state, distance, direction and velocity
must select the same gait pose at all three frame rates.

## 7. Complete literal manhwa and ritual parity selectively

Before generating art, create a literal 40-row Chapter One ledger with image
hash, cast, props/equipment, exact action, runtime key/room, trigger, VFX/audio,
skip/reload, gameplay-size capture and verdict. Generate or correct only failed
rows. Known candidates for bounded correction include the baked red/pink boss
eyes in `m_down.webp`, off-model rear hero in `passage_b.webp`, inactive lights
in `r_cell.webp`, and Sage matte remnants. Do not touch accepted rows.

Preserve the accepted Glitch ritual. Produce only Brood, Atlas, Zero and Prism
current-contract films: earned hero+sword, white flake gather into raised sword,
cinematic slash, white impact flash/hit-stop, black-red virus extraction into
the blade, neutralization, friendly/golden restoration, and a smooth picture
and music fade. Skip/retry/reload must settle state and rewards atomically and
never duplicate purification.

## 8. Device and performance sign-off

Profile doorway crossing, room cache and bake-ahead three times without raising
budgets. Split/prewarm measured blocking work. Certify landscape iPhone-class
and Android devices plus controller: safe areas, orientation, touch holds,
cancellation, haptics, reduced motion, text reveal, audio, background/resume,
thermal/memory behavior and save continuity.

Before handing off:

- commit source separately from generated/evidence files;
- run `git diff --check`;
- include exact commit/tree, commands, pass/fail/blocked counts and evidence
  paths;
- identify every staged start or injected state;
- attach two uninterrupted campaign recordings and physical-device evidence;
- do not merge or deploy unless every P1 acceptance gate passes on the same
  exact candidate.
