# CLAWBYTE design review — 2026-10-23

Pinned source: `7c3cefeb6bda7aa59e9ae34520e50bbdd6d45237` on
`codex/studio-review-2026-10-23`. Production and Claude integration remain at
`62d75d204c6f6264f25150bb419fc262ff2c18ea`; no upstream gameplay or art delta
exists since the October 22 review.

## Six independent responsibilities

| Responsibility | Verdict | Evidence and consequence |
|---|---|---|
| Senior Cinematic Designer | Issues — carried | `js/panels.js` preserves all 16 ordered sequences and the October 22 uninterrupted route showed all 16 in order. `docs/story-draft2/GAME_ART_PARITY.md` still lists physical actions not reproduced literally: cradle/lamp reach, cell/socket installation, carried marble, continuous forge contact, NULLFANG cable catch, CHIME casing opening and authored hero purification body motion. Flattened panels do not close those gaps. |
| Senior Game Designer — Player Systems | Issues | The one-control tutorial, pod-before-pack causality, readable permanent-pack purchase, heal/attack/Burst lessons and forward monument placement remain correct. Today's independent phone-sized diagnostic reached A1, woke Servo and accepted the coil errand. The full collector's two modes reached all 15 steps but exhausted their fixed 240-second budgets on the final `go` step before A1. Both are keyboard/mouse harnesses, not physical touch evidence. |
| Senior Mission Designer — Quest Craft | Issues — optional scope | The mandatory Ratchet → marble → forge → Sage quest has motivation, landmark, action, reward and consequence. A7, CV1's optional pocket, A11–A13 and Alpha's offer → rescue → friendly pack → reward → reload loop still lack a fresh natural-input completion. |
| Principal Encounter Designer | Issues — carried | Den gating prevents sword/Sage/CHIME bypass and mandatory placement/telegraph contracts pass. Optional encounter feel, GRAVEHORN's final body/intercuts and physical-device impact remain uncertified. |
| Senior Boss Designer | Issues — carried | NULLFANG's fair gate, deliberate hold/cancel/retry purification and Alpha's wolf-specific optional identity remain intact. GRAVEHORN body/intercuts, authored hero ritual motion, four guardian-specific ritual films and listened/device endings remain production gates. |
| Senior Mission Designer — Campaign | Mandatory route previously certified; fresh/optional scope open | The October 22 continuous keyboard run reached B1 in 17:36 with 9/9 missions and 16/16 panels. Today's full-collector attempt never started because Playwright FFmpeg was missing. A separate cleared-storage rerun completed opening, Servo, first meeting, marble and forge, then died once during the Sage fight and timed out at 40:00 after 166 ordinary-input recovery attempts on CV2's central platform. It had zero page and panel-order errors but is not a completed playthrough. |

## Causality and tutorial verdict

The source still expresses the owner's required sequence:

1. Mother's peaceful song is infected while HZD-99 sleeps.
2. A short wakes the forgotten hero.
3. The player learns movement, jump and interaction separately.
4. Ratchet's letter leads to his hidden battery and the repair board.
5. Ratchet explains the protective marble and gives the separate Servo cell.
6. The player uses the pod before learning and buying the Volt Pack.
7. The forward monument and Servo point toward the meaningful cave route.
8. GRAVEHORN guards raw marble; Ratchet forges the first purifier sword.
9. The Sage is rescued, CHIME is silenced and NULLFANG is deliberately purified.
10. Alpha remains an optional post-forge Lost Wardens quest and never gates B1.

`tests/opening-order.cjs` now records a transition timeline, terminal state, JSON
and terminal screenshot without extending its finite limit. This is an evidence
improvement only; it changes no tutorial or gameplay state.

## Cave value census

| Area | Value in source | Evidence status |
|---|---|---|
| A5 | Loose-floor landmark, Magnet riddle, maintenance history, quarry entrance | Mandatory and causal; continuous route previously certified. |
| A7 | Survey terminal read and once-paid return | Meaningful implementation; fresh natural return not certified. |
| CV1 | Bound crawler and optional max-core pocket | Distinct optional outcome; acquisition/revisit not naturally replayed today. |
| CV1B | Survey pod, map/chart, shortcut and rest | Useful navigation/save space. |
| CV2 | Deaf System evidence and beacon/lure | Story purpose exists; player comprehension is not measured by the harness. |
| CV3 | GRAVEHORN, raw marble and changed post-forge return | Mandatory payoff; gameplay passes, final art does not. |
| GA1 | Refuge, Sage and network rescue | Core payoff; rescued Sage walk is fixed and passing. |
| A11–A13 | Optional currency, traversal and Servo evidence | Natural acquisition/return remains unverified. |
| A10/GA2 | Alpha, friendly pack, cache, ledger and Pack Sage | Correctly optional; full offer-to-reload route remains unplayed. |

## Acceptance conditions

- Keep Alpha optional and prove its complete loop with ordinary input and reload.
- Prove every optional cave outcome through natural acquisition, return, visible
  consequence and idempotent payment; staged flags are insufficient.
- On the integrated snapshot, repeat the mandatory route from cleared storage.
- Add a distinct true-touch route; `hasTouch` plus keyboard is not touch proof.
- Implement or revise each literal manhwa action before calling parity complete.
