# Sword storyline — owner direction, 2026-09-06

This is the governing progression for CLAWBYTE. It supersedes older descriptions
in which obtaining the second sword automatically joins the weapons or dual
swords exist only briefly after a charged move. This document specifies intent;
it does not certify that the runtime already implements every stage.

| Stage | Story requirement | Equipment and combat |
|---|---|---|
| Claws | Start the game without a sword | Bare-paw scratches; no sword in hands, on back, in opening footage or movement artwork |
| First sword | Gather special material and bring it back to the forge | The smith forges one sword; equipped normal attacks use sword cuts |
| Dual swords | Later discover a second sword, or obtain another material and return to forge it | Two independently held swords; holding attack charges a hurricane swirl and releasing performs it |
| Joined weapon | Later discover a special connector | Join the two swords into one double-bladed weapon; holding attack charges a boomerang throw, releasing throws it, and it returns |

For the first implementation, retain the existing second-sword discovery
route; the owner explicitly permits either discovery or a second forging quest.
The connector must be a separate later reward. Finding two swords is not proof
of owning the connector. Progression and equipped mode are different concepts:
ownership persists when weapons are put away.

## Animation and input contract

- Scratch studies belong to the opening, unarmed stage. They must show no sword.
- After acquiring a sword, ordinary combat defaults to the equipped weapon.
  Scratching is available only when the weapons are actually put away or absent
  from the hands; hands, carried equipment, sound, hitbox and damage must agree.
- Single sword, dual swords and joined weapon need their own authored attacks,
  anticipation, contact, follow-through and recovery. Do not paste a sword over
  a claw scratch and call it a sword animation.
- Dual-sword mode is a lasting combat stage, not a timed buff. Its charged move
  is the hurricane swirl. It must not auto-join after a timer expires.
- The joined weapon's charged move is the returning throw. Do not trigger it
  automatically on an ordinary three-hit combo. Prevent duplicate weapons while
  it is airborne; recover the same weapon on catch, death or room transition.
- Unlock messaging, tutorial, inventory, save/load, storefront and cinematic
  sequences must respect these prerequisites. The shop cannot bypass the quest.
- Existing saves need an explicit migration that preserves legitimately earned
  equipment. Never infer new-story connector ownership from a second-sword flag
  in new saves; old and new progression versions must be distinguished.

## Verified implementation gaps

On base 9425f4ee99480a81c428c2d7295e2e9a2bd4a145 plus the local repair patch:

- `forgeCrystal` and the shard-return interaction in `js/game.js` already
  support the first forging story; preserve and test that quest.
- The `crystal2` secret in room X1 currently grants the joined form immediately.
  Separate second-sword ownership from connector ownership and equipped mode.
- `Player.releaseCharged` currently routes `crystal2` to `swirl`; ordinary
  third-hit input can throw the joined weapon. These must become mode-specific.
- `twinT` currently expires and joins the swords; it cannot represent permanent
  dual-sword progression.
- `drawRoboSwing` selects claw strips without distinguishing equipped weapons.
  Add weapon-specific asset routing and validate both loaded and fallback paths.
- `wielded` in `js/audio.js` has no independent dual-sword equipment state.
  Audio and visuals must use the same equipment resolution as combat.

Acceptance must exercise a fresh save through all four stages, a reload at each
stage, putting weapons away, both facings, charged input by keyboard/touch/pad,
and return/cleanup of the thrown weapon. New art requires the owner's review
under CLAUDE.md before integration. No changes are deployed by this document.
