# Animation and combat update — 2026-09-06

Base: `9425f4ee99480a81c428c2d7295e2e9a2bd4a145`.

## Owner direction

The attack is a **claw scratch**: open paw, visible claws, diagonal arc,
shoulder wind-up, follow-through, recoil and return. It must be continuous
body animation, not copied poses decorated with moving scarf or effects.
Higgsfield supplies all character artwork. The credit blocker cleared on retry.
Scratch take 1 completed and was archived, but visual inspection found a long
raised-paw hold and missing return to the initial stance. It was not integrated.
Correction job `24a75599-3590-4edd-addf-0b80ccc65b60` is rendering with an
earlier strike and explicit full recovery. The jab study remains superseded.

## Implemented changes

| Area | Before → after | Reason |
|---|---|---|
| Combo selection | 1-based renderer / 0-based input → shared 0-based selection | The second press repeated the first animation; third-hit artwork was unreachable |
| Visual test | Obsolete strip keys and 1-based fixtures → actual manifest keys and production combo indices | Missing loads fell through to still poses and produced a misleading near-zero movement score |
| Content sampling | Stop when early frames fill count → scan whole window, preserve return | An action could lose its recovery even when the source contained it |
| Weak source | Automatically lower difference threshold → reject too few distinct poses | Static/noisy takes and two-pose alternation must not be padded into accepted strips |
| Measurement | Whole image only → optional normalized body/limb ROI | Moving scarf or sparks must not stand in for body motion |
| Provenance | Console only → source times, ROI, threshold and unreviewed status in sidecar | The cut must be reproducible and must not imply human approval |
| Glaciere charge | Tracks until launch → final 300 ms committed | A sidestep can leave the announced line; facing remains along velocity |
| Glaciere cage | Spawns at player's latest position → warned position fixed for 500 ms | Movement can escape the warning's location |
| Prism decoys | Both shots originate at real boss → each visible decoy origin | Telegraph position and damage source agree |
| NOSTOS stride | Fixed 16 fps → shared distance-driven stride phase | Walking speed and animation cadence agree; human artwork retained |
| Test environment | Hard-coded Chromium only → `CHROMIUM_PATH` override | The same assertions run in the available Higgsfield Chromium environment |

Attack damage, cooldowns, player speeds, HP, save format and the deliberate
Phantom-only dash invulnerability rule are preserved.

## Evidence and limits

The baseline browser run reproduces the `frames` second-attack failure and
`hero` facing failure. After the combo/test-loading fixes, all four attacks
pass the existing rendered-motion test (second attack mean change 26%,
largest step 42.2%). The jab and burst still fail its independent facing
test. A pixel-change test is not a certificate of natural articulation.

Direct inspection of `takes2/hook.mp4` and `takes2/jab.mp4` confirms long
extended-arm holds with moving scarf. The strict hook re-cut was rejected
for insufficient distinct samples. It was not installed and thresholds
were not relaxed. Missing intermediate poses require better source motion.

Node regressions exercise actual player input and reject static/noisy/two-pose
source fixtures while preserving a full action's return. `boss-counters`
drives the actual Glaciere and Prism state machines in both phases.

Validation completed on 2026-09-06:

- Latest candidate: `regress`, `frames`, `combat`, `tells`, `gait` and
  `boss-counters` pass in Chromium. Both builds traverse all 77 rooms without
  page errors. The two Node regressions also pass locally.
- The complete suite on the intermediate combo/pipeline patch finished with
  five failed harnesses: `hzdvox`, `tinker`, `hero`, `platform`, `bake3d`.
  `platform` passed after generating the missing remote `www/` package.
  The first three are the observed voice/pose/facing problems; `bake3d`
  produced identical clip cells and no driving video and remains unresolved.
- The full suite was not rerun on the final boss/NOSTOS candidate. Its focused
  passes do not replace that release gate. No claim of all-suite success.
- All four pages rebuild; native packaging and `git diff --check` pass.

The full required browser suite is the release gate. Changes remain local
until that gate and new-art review pass. No deployment is implied by this file.

## Applying continuous-motion acceptance

1. Watch the raw source, with effects absent: the required limbs must move.
2. Confirm identity, fixed scale/camera/facing and a complete action or stride.
3. Select one complete window. Use even sampling for gait cycles; content
   retiming for attacks only when all required motion exists in the source.
4. Inspect independent arm/leg regions with `MOTION_ROI`; global image motion
   alone cannot qualify a take. Never interpolate missing anatomy or pad copies.
5. Check the resulting strip at native size, both facings, in the actual game.
6. Match authored contact/recovery to the combat clock, derive the low tier,
   regenerate room assets when references change, rebuild and run the suite.

The five later guardians still require a broader per-move reachability and
hazard audit. The focused counter tests here do not claim that coverage.
