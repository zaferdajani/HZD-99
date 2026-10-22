# Design review — 2026-10-22

Six senior design responsibilities reviewed the October 21 review parent against
the owner's canon and the current production/integration head.

| Responsibility | Verdict | Evidence and consequence |
|---|---|---|
| Senior Cinematic Designer | Issues | Event order is coherent, but several manhwa actions are represented only by panels or overlays rather than physical performance. |
| Senior Game Designer — Player Systems | Issues | Desktop completed the whole real-input opening to Servo; the phone path exhausted its finite budget after Ratchet's repair and remains open. |
| Senior Mission Designer — Quest Craft | Issues | Mandatory caves have authored purpose. Optional acquisition and return loops still lack a new natural-input proof. |
| Principal Encounter Designer | Issues | Combat contracts and encounter identities are substantial; device feel and the unsegmented optional Alpha route remain uncertified. |
| Senior Boss Designer | Issues | Alpha is correctly optional and NULLFANG is rescued, not killed. GRAVEHORN art and authored purification performances remain below the hero benchmark. |
| Senior Mission Designer — Campaign | Issues only for optional scope | The 17:36 ordinary-input run certifies raw marble → forge → Sage → CHIME → NULLFANG → B1. Optional Alpha and every optional cave are not certified by that route. |

## Canon and routing

The current source preserves the owner's essential causality:

1. Mother's song maintained harmony before an unknown entity infected it.
2. The hero survived because it was already asleep and missed the broadcast.
3. Ratchet removed his own battery after his marble pendant only slowed infection.
4. The player reads the letter, repairs Ratchet, learns the pod/Volt Pack systems,
   finds raw marble, returns to forge the white purifier sword, rescues the first
   Sage, silences CHIME and then purifies NULLFANG.
5. The lion den remains gated until the purifier is forged.
6. Alpha remains an optional post-forge Lost Wardens detour, never a marble or
   lion prerequisite.

## Player-facing issues carried forward

- The desktop normal-input opening now completes every ordered beat through Old
  Servo, including the coil errand. The phone-mode run stops in A0B after repair;
  a finite completion and separate physical-touch proof are still required.
- Cave purpose exists in source, but optional rewards are not automatically
  meaningful to a player unless the offer, landmark, acquisition, return and
  consequence are all encountered naturally.
- Manhwa beats for cradle reach, battery installation, carrying raw marble,
  forging contact, cable assistance, CHIME casing opening and purification still
  need literal action continuity rather than panel-only equivalence.
- The reported rescued-Sage slide was reproducible in code: a tamed Sage could
  translate while `drawSage()` forced its stationary rescued plate. The bounded
  fix and targeted production-path test are on this branch.

## Campaign-driver finding

The previous continuous run had already broken a 64 px, player-width opening at
the A2 quarry hatch (columns 12 and 13 in both breakable rows). The driver tested
whether *any* breakable tile remained in columns 12–14 and kept down-striking the
last decorative column. It spent more than 25 minutes pogoing rather than using
the open route. The driver now checks whether at least one full column is open.
This changes only certification navigation; it does not alter terrain, saves,
player inventory, enemy state or production gameplay. The post-fix run then used
the opening normally, completed all nine missions and reached B1 in 17:36.

## Acceptance

- Preserve the retained 17:36 review-branch route, then repeat it on the final
  integrated snapshot rather than treating branch evidence as merge evidence.
- Complete Alpha naturally from offer through rescue, friendly pack, rewards and
  reload, while proving the mandatory route works without it.
- Exercise every cave outcome without injected flags/items and record the visible
  consequence.
- Keep dialogue gradual and input-debounced; a panel is not proof of the physical
  action it depicts.
