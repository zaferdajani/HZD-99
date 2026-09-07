# Cave route and overhead-pocket correction

## Player report

The entered side chamber did not lead onward. Another cave passage appeared
sealed where overhead plates met the raised ground.

## Changes

- The Seam (CV1B) now connects onward to the beacon hall (CV2), with a
  reciprocal cave mouth. Its existing return to CV1 and save point remain.
  Arrival is before the beacon, preserving the route toward the sword material.
- Both new door approaches have flat support, five open tile rows, and clear
  space around nearby props. Existing cave-mouth artwork is reused.
- Cave heightfields now read bottom-connected ground. Hollow overhead pockets
  keep their tile collision and breakable hatches, but no longer generate
  fictitious ground rising into the passage below.
- The correction is restricted to cave rooms; other terrain keeps its existing
  surface selection.

## Evidence

The former floor selector read an overhead pocket at CV2 tile22 as ground at
y=256, where the real floor begins at y=416. At CV1 tile14 and CV2 tile48 it
read y=160 instead of y=512. This was a collision problem as well as a visual
one: the resulting curve is also the surface the character stands on.

`tests/cave-ground.cjs` checks 1,006 columns across all 25 cave rooms.
`tests/seam-route.cjs` checks reciprocal doors, quest order, retained exits,
the save point, entrance clearance and prop spacing.
`tests/cave-passage.cjs` drives the real player beneath all four crystal-cave
pockets in both directions with basic movement/jump, then completes both new
gate-walk transitions. All three targeted harnesses pass.

No art asset was replaced and no existing test threshold was lowered.

## Release verification

The full 91-harness regression run completed: 88 passed. The three failures
are the previously documented asset-quality checks: hzdvox (two recordings
outside the expected register), tinker (near-duplicate work poses), and hero
(two attack strips facing the camera). All cave, route, collision, movement,
rendering-structure and platform-packaging checks passed. The unrelated asset
failures remain visible in the test suite.

The local and browser-tested pages have identical SHA-256 values:

- index.html: 2195701afc5f746d33307130c048a3c8115cf5317951525286e6fe31bebc7b72
- odyssey.html: 5947d34db596258370bfd4bce8a2f25a91584e134bff04dd9d67698b9bc211af
