# Current comic/game consistency review — September 27

Reviewed all 32 existing pages as a visual sequence, with full-size inspection
of pages 20 and 27. This is a continuity audit, not a per-panel identity approval.
The reward manifest now keeps all seven candidate episodes in `draft` status.
Draft art remains in the public-facing reader source for review; it is not
automatically awarded as finished content.

## Fixed gameplay and verified behavior

The workshop battery must be found and cannot be spent on Servo. Ratchet grants
a separate spare exactly once. The repair/Burst pack must be bought. The quarry
contains raw rounded marble; Ratchet forges the blade. Ordinary machines can be
disabled and later cleansed without repeated payouts. The modular yard winch
has a telegraphed attack and persistent disabled/cleansed states. The first
guardian encounter is dodgeable on new saves. The maintenance passage reaches
the Sage before the guardian, and the current final route requires CHIME first.
Survivor histories now preserve the progress-sensitive greeting at the start
of the conversation. NULLFANG now visibly breaks the order once, between the Sage
and CHIME, and the bell visibly restores it. A purified sage's promise to keep
its end quiet is kept: its network's machines stand down and stay down. Tests cover these behaviors;
drawings alone do not.

## Page changes still needed

| Page | Story beat | Remaining consistency work |
|---|---|---|
| 1 | Peaceful morning song | Match the peaceful city, train, work robots and Mother's broadcast to staged runtime assets. |
| 2 | Everyday cast and old-unit storage | Verify every cast design; implement or redraw the storage procession. |
| 3 | Deliberate sleep and blank wake date | Match cradle, attendant, label and broadcast cutover to the opening. |
| 4 | Command intrusion | Match citywide coercion and Ratchet's self-shutdown staging. |
| 5 | Reserve wake | Verify cradle geometry, reserve display and reaching motion. |
| 6 | Lamp, parts box and pouch | Implement the physical interactions or redraw as supported exploration. |
| 7 | Street repair machine | Match its design and compelled work/lunge behavior; it is not the yard winch. |
| 8 | Disable the winch | Modular machine exists; severed belt, scarf damage and wrist injury are not staged. Keep excluded. |
| 9 | Find Ratchet's own cell | Cell rules pass; drawer/pulley geometry and installation staging need matching. |
| 10 | Ratchet wakes | Match shutter, spanner, wrist release and spoken timing. |
| 11 | Pendant and receiver isolation | Pendant protection is canon; implement or redraw physical receiver disconnection. |
| 12 | Buy the pack and learn its cost | Purchase and abilities pass; match wrist repair and pack appearance panel by panel. |
| 13 | Inherited marble and cave directions | Canon preserved; verify prop scale, map geography and current route. |
| 14 | Restore Servo | Spare-cell restoration passes; rigging/pulley assistance is not staged. |
| 15 | Guardian warning | Playable dodgeable encounter exists; align movement, damage and shelter geometry. |
| 16 | Escape under the claw | Prior hero-identity rejection remains. Replace against approved game references. |
| 17 | Speaker-free cave approach | Match cave entrance, signs and traversable platforms to the actual route. |
| 18 | Knock at the cave shelter | Add supported contact/knock scene or redraw around existing interaction. |
| 19 | Spend the pack charge | Real charged quarry interaction exists; align injury, charge meter and rock geometry. |
| 20 | Raw marble and wolf interruption | Raw pickup exists; carrying pose and temporary wolf interruption do not. Keep excluded pending revision. |
| 21 | Return the material | Real forge handoff exists; verify marble, workbench and return dialogue. |
| 22 | Shape the first sword | Forge requirement passes; match manufacturing stages and finished blade reference. |
| 23 | Cleanse the winch | Cleansing is implemented; the literal strand cut and arm-assisted lift differ. |
| 24 | Reach the Sage | Route exists; map climb, contact and attack staging to actual room. |
| 25 | Break the Sage's control | Cleansing and survivor-call reveal exist; match combat/strand geometry. |
| 26 | Trace the command | **Implemented.** The reveal already existed; the shutdown does now. Everything still hunting her in the chamber stands down as the halo turns, and all three rooms of that sage's network wake calm from the save fact afterwards — one sage does not quiet another cave or the surface. `tests/sage-quiet.cjs`. Remaining: match the drawn machines and their poses to the ones actually standing there. |
| 27 | Plan the cable rescue | Servo holding a cable and Ratchet buying one ring are not implemented. Restage the plan or implement it. |
| 28 | Cross the guardian's reach | Cooperative cable movement is not implemented. |
| 29 | A brief break in control | **Implemented.** He walks out of the enclosure in A3 between the sage and the bell, the authored virus veins run clean, a bell answers from above the meadow and the order is written back. Costs no core, holds no input, fires once (`flags.nfBreak`). `tests/guardian-break.cjs`. Remaining: match the page's framing and her distance to the staged scene. |
| 30 | Reach CHIME | Order is settled and this page is on the right side of it: the Sage (23–26) sends her to the bell, and the bell is silenced before the guardian is resolved. Remaining work is staging, not sequence — match the climb and the arena to A8/A9/A11. |
| 31 | Open CHIME's case | Literal case-opening and climbing interaction are not implemented. |
| 32 | Catch and cliffhanger | Guardian catch/cable action is not implemented; illustrated arc still lacks its completed ending. |

## THE ROUTE RULING — September 30

The audit asked for one causal order for the Sage, CHIME and guardian encounters.
It is now chosen, and it is the one the build has always played:

> **blade → the Sage (through the quarry's maintenance door) → CHIME → NULLFANG**

Measured against the running game rather than read off the source:

```
gateDoors('CV3')  with no blade → []          the maintenance door is not there
gateDoors('CV3')  with crystal  → ['GA1T']    it opens on the BLADE alone
gateDoors('GA1T') with crystal  → ['CV3']     and back
openingGateHint('A4'):  no blade → fetch the marble, forge the blade
                        blade    → free the Sage through the maintenance door
                        + sage   → silence CHIME before returning to NULLFANG
                        + chime  → ""  (the lair opens)
```

The guardian's own reward is never a prerequisite for the thing that makes the
guardian winnable: the Sage is the informant (*CHIME writes the command back whenever
he breaks it*), so the bell is an errand she is sent on. NULLFANG's fall then opens
the grotto at the far end of the tunnel she already walked from the quarry.

**What changed to match it.** `docs/STORY_SCRIPT.md` §2.12–§2.16 were rewritten into
this order — the script had the Sage behind the lair and CHIME before it, and was the
document out of step. `docs/MANHUA.md` marks the ch1 redraw's pages p20–p26 STALE with
their new section mapping; refiring them is the STORY session's, with owner review.

**The shipped reward set already obeys it.** In `assets/manhua/revised-2026-09/` the
Sage is pages 23–26 and CHIME is pages 30–32, and `chapter-one-guardian` unlocks only
on `first-sage` + `chime-silenced` + `nullfang-freed`. No slide order changes here.
The remaining work on pages 27–32 is staging, not sequence — which is why they stay
`draft`. Page 29's staging landed with this ruling: NULLFANG's brief lucidity is
implemented and tested. Cooperative cable movement (27, 28, 32) and the literal
case-opening (31) still have no game behind them.

## Production rules for the replacements

Use the approved current game references, never these proofs as anatomy masters.
Keep the visor, pointed ears, single-piece arms, mitten paws, scarf/cape and
equipment stage consistent in every panel. Preserve a silent hero's agency.
The causal order is settled (see THE ROUTE RULING, above): **blade → Sage → CHIME →
NULLFANG**. Draw that order; captions cannot repair contradictory actions.
Do not use a found sword in the quarry. Do not grant innate viral immunity.

After each replacement: record the image hash, exact reference assets, runtime
room and save conditions, corresponding behavioral test, and a game capture.
Review the complete page at phone size before marking its episode published.
No new images were generated as part of this audit. For this software release,
the owner's instruction that they will update the manhwa is followed: unfinished
episodes remain drafts until replacements satisfy the review. No generator choice
is required to deliver the chapter-loading system.
