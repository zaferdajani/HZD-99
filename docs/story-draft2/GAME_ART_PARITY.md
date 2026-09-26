# Manhwa and game asset parity

Owner requirement: every image of anything in the manhwa must be producible in the game.

Release gate: each page's visible cast, objects, environment, equipment, effects
and actions map to implemented assets and behavior, with captured game evidence.
Concept approval, generated art, matching text and a pasted comic panel do not
satisfy this gate. Use the same source designs in both media; preserve camera
flexibility without inventing a different world or unearned capabilities.

## Opening proof audit — not release-ready

| Page | Shared elements | Current gaps that prevent certification |
|---|---|---|
| 5 | HZD-99 unarmed, maintenance cradle, reserve wake, failing lamp | Exact cradle/lamp geometry, visible reserve indicator and reaching action need asset-to-runtime comparison |
| 6 | Same hero, workshop, parts box, lamp, pouch | Box moving, lamp contact repair and pouch pickup must be playable or staged with real scene assets |
| 7 | Scrap Meadows, work cranes/conveyor, street repair robot, speaker, forge sign | Painter and its compelled stripe/lunge behavior, conveyor blockage and sign need matching runtime assets |
| 8 | Industrial winch, cable, chute, recess, drive belt, scrap, scarf nick, wrist damage | Current opening turret is an interim implementation and does not match the winch; replace with matching mechanism and salvage interaction; preserve disabled housing |
| 9 | Copper Ratchet, pendant, workshop, unique battery | Battery rules are implemented; note, matching socket, pulley/drawer puzzle and exact prop geometry need integration; correct oversized cape tears in artwork |
| 10 | Ratchet awakening, workshop shutter, dust outline, spanner | Match physical staging, wrist release, shutter interaction and tool handover; all currently only in comic art |
| 11 | Ratchet pendant, command intrusion, receiver hatch, isolated broadcast cable | Add corresponding in-game receiver-isolation scene/effects; corrected comic uses a flush service hatch, not an unearned pack |
| 12 onward | Script and equipment timing recorded in production manifest | Inventory each visible element before final artwork; no page is certified by default |

## Required evidence per page

### Hero identity gate — owner corrections, 19 September 2026

The published guardian-confrontation and quarry/driller pages fail HZD-99
identity review. They are not approved character references. The former changes
head/body proportions and ears; the latter removes the charcoal visor and
changes the arms and paws. Neither may justify changing the game hero.

Every replacement panel must match the approved game artwork: ivory ceramic
head, tall pointed ears with cyan inner surfaces, charcoal visor with cyan
eye-lights, steel whiskers, red scarf and cape, gold shoulder discs, compact
ivory torso with vertical belly grille, one-piece tapered arms, steel wrist
cuffs, mitten paws and short legs. Perspective and drawing style may change;
anatomy and identifying features must remain consistent. Tiny distant views
may simplify detail but must not substitute a different design.

Audit every hero appearance across the entire chapter, including existing
replacement proofs. Record page/panel failures and reference asset used. No
chapter is identity-approved merely because one representative panel passes.

- Script/version and reviewed art hash.
- Runtime room/location and asset keys/paths for every visible element.
- Required animation, interaction, sound/VFX and equipment/save-state conditions.
- Capture from the actual game, plus behavioral check for interactive beats.
- Reviewer result, unresolved differences and release status.

The raw rounded marble source has been generated with real alpha but is not
yet wired into the quarry. The older pointed-crystal asset must not serve as
the new story's fallback once the rounded material is integrated.
