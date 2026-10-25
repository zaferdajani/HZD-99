# Engineering discipline review — 2026-10-25

## Scope

Senior responsibilities 10–14 reviewed world, combat, mission, NPC and UI
contracts. Production game files are byte-identical to the October 24 parent.
Only the GRAVEHORN evidence driver changed.

## Role verdicts

| # | Responsibility | Verdict | Evidence and action |
|---:|---|---|---|
| 10 | Associate Technical Director — World Systems | Pass mandatory; device open | Campaign, graph, terrain and bake pass. Full-suite cache spike did not reproduce independently. Profile sustained load on devices. |
| 11 | Gameplay Engineer — Combat | Pass source/browser; device open | Stats, attack profiles, armor, 200-event log, flash, debris, knockback/recoil, hit-stop, shake, rumble route, SFX routing and 3.2× held hit pass. Listen/feel on hardware. |
| 12 | Gameplay Engineer — Mission | Pass mandatory; optional open | Gates, saves and purification sequence pass continuously. Alpha/optional caves remain staged. |
| 13 | Gameplay Engineer — NPC | Pass host | Sage walk/idle and persistence pass; Servo presence and purpose pass. Real touch remains open. |
| 14 | Lead UI Engineer | Contracts pass; density/device issue | Gradual text, RTL/CJK, overlays, rotation and ordered opening pass. Reward bursts need priority/queue tuning and phone proof. |

## GH-HARNESS-25 — bounded evidence-driver fix

The full collector and independent rerun showed two scheduler-dependent races in
`tests/gravehorn.cjs`:

- a requested 0.25-second jump lead arrived at about 0.19 seconds, before the
  test's own observed 0.30–0.52-second safe window;
- an external 3 ms poll could miss the entire 450 ms toss wind-up and therefore
  send no guard input.

The driver now requests the stable 0.36-second jump lead and dispatches the real
`KeyL` down/up events from the encounter simulation clock, using the same
pattern already present for the strike-parry assertion. It does not alter
GRAVEHORN timing, collision, damage, tells, recovery, player stats, save state,
position, health, inventory, flags or production code.

Original failing logs and every corrected rerun are preserved separately. The
final isolated run passes every GRAVEHORN assertion.

## Evidence classification

| Evidence | Result | Honest scope |
|---|---|---|
| Full collector | 199 pass / 2 fail; complete scope; log integrity true | Immutable host snapshot; original failures retained |
| Cleared-storage campaign | Certified 21:57; 9 missions; 16 panels; three deaths; B1 | Uninterrupted ordinary keyboard; video off; Alpha excluded |
| Opening-order | Pass desktop and phone-size to Servo | Real browser keyboard/mouse; not physical touch |
| Room-cache isolated rerun | Pass | Non-reproduced full-suite spike; not device performance |
| GRAVEHORN reruns | Original races retained; final corrected isolated run passes all assertions | Staged arena evidence; not finished-art proof |
| `bake3d` | Pass in full collector | Host bake contract; not GPU/device certification |
| Physical phone/controller/listened audio | Not run | No touch, haptic, thermal, sustained performance or subjective mix proof |

## Commands

| Command | Result |
|---|---|
| `npm ci` | Pass; 160 packages |
| `npm run build` | Pass; four pages |
| `npm run app:pack` | Pass; 252.5 MB package |
| Browser text preflight | Pass: Latin/CJK/Arabic all nonzero |
| Full studio collector | Complete; 199 pass / 2 fail |
| `campaign-ch1` | Certified 21:57 |
| `opening-order` | Pass desktop and phone-size |
| Isolated `gravehorn roomcache` | GRAVEHORN evidence race retained; room-cache pass |
| Corrected GRAVEHORN reruns | Final isolated run passes all assertions; intermediate variance retained honestly |
| `git diff --check` | Pass |

## Remaining engineering gates

1. Add actual browser touch events and physical iOS/Android portrait/landscape,
   safe-area, controller, haptic, thermal and sustained frame/memory tests.
2. Listen to normal impact, enemy metal clash, charged hit and complete
   purification/music fade on target hardware.
3. Record Alpha and every optional cave loop through save/reload without state
   injection.
4. Add a finite, prioritized notification queue so objectives, story lines and
   reward cards cannot occupy the same gameplay region simultaneously.
5. Preserve failed-run provenance; never convert a host race into a product pass
   by weakening encounter assertions.
