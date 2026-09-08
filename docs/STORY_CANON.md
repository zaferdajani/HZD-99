# HZD-99 / CLAWBYTE — owner-confirmed story canon

Authority: the owner's explicit story clarification in this project, 2026-09-08.
Read this before changing narrative, tutorials, quests, rooms, music or weapons.
This overrides conflicting older lore. It specifies intent, not completion.
NOSTOS remains a separate world sharing the engine.

## World, song and infection

This is a world of robots divided into kingdoms. Each kingdom has its own
atmosphere, characters, places and musical identity, protected by sages.
Mother Robot sings a song throughout that world. An evil robot hijacks the
song and embeds a virus that commands every infected robot to obey it.
Mother is the hijacked singer, not the willing author of the infection.
The evil robot's final name, motives and ending are not fixed by this account.

The hero is the robot cat. It was asleep/in sleep mode, forgotten in a chair
or cradle, when the infection spread, and wakes to a changed world. Sleep is
the established reason it escaped that event; innate immunity is not established.
The cat is the only active uninfected survivor known at the opening. The
protected, powered-down NPC below is an explicit rescueable exception. Other
robots are infected, not necessarily destroyed; the mission includes freeing them.

## First NPC — existing implementation name: Ratchet

1. He nearly succumbed to the infection, but a special tranquil/protective stone
   in his necklace protected him.
2. Frightened and alone, he removed his battery and entered a reversible
   powered-down state, hoping somebody would reconnect it someday.
3. The cat finds him and restores his battery. This begins their story.
4. He explains the stone and points the cat to a cave containing more of it.
5. The cat brings the material back, and the NPC forges the first cleansing sword.
6. That sword enables the cat to disinfect/free the sages. The material cave
   and first forge must come BEFORE the first sage, never depend on its reward.

The necklace is a physical object, not unexplained generic immunity. Essential
quest information must remain readable if a memory film is skipped or unavailable.
Extra histories may expand the foundation but are not owner-confirmed facts.

## Required story progression

| Order | Player action | Result |
|---|---|---|
| 1 | Wake and learn movement | Discover the changed world |
| 2 | Learn jumping and interaction individually | Reach the first NPC |
| 3 | Restore the NPC's battery | Learn about the protective stone |
| 4 | Explore the early cave and collect the stone | Obtain forging material |
| 5 | Return to the NPC | Forge one cleansing sword |
| 6 | Reach and free the first sage | Begin restoring the kingdoms |
| 7 | Later find a second sword | Permanently unlock two separate swords |
| 8 | Later find a separate connector | Unlock a joined double-bladed weapon |

An early guardian encounter must not replace or silently reorder the first
sage quest. Preserve the distinction between sages and guardians where the
existing implementation uses both. Check every added dependency for circular
locks, clear objectives and a reachable return route.

## Weapons and movement

- Start with claws and no sword in inventory or opening artwork.
- Single, dual and joined swords are distinct earned equipment modes. Finding
  two swords does not grant the connector; joining does not erase dual mode.
- Each mode has its own special attack activated by holding attack.
- Previously established specials: dual swords perform the hurricane; joined
  swords perform the returning throw. This clarification does not name the
  single-sword special, so retain its existing move unless explicitly revised.
- Continuous anticipation, contact and recovery must match the equipped weapon.
  A sword pasted onto claw motion is not completed sword animation.
- Save/load, death, room changes and switching controls preserve ownership and
  recover thrown weapons without duplication.

## Tutorial contract

- Teach one current control at a time in a deliberate order: movement before
  jumping, interaction at a usable object, attack before required combat.
- Show the actual keyboard, controller or touch binding. Do not pile future
  controls onto the screen or request an ability the player has not earned.
- Say WHAT to do and WHERE: the visible exit, actual obstacle, NPC, battery or
  marked cave. Avoid unexplained prompts such as "claws out".
- Advance on the successful action, not a timer. Failed attempts retain the
  instruction and a safe retry. Save/load and room returns preserve progress.
- Skipping a film must not skip the objective or gameplay lesson. Door prompts
  must match the actual interaction and remapped controller controls.

## Mood and music

Reference qualities: Hollow Knight / Silksong and Prince of Persia: The Lost
Crown atmosphere, depth, musical continuity and smooth, responsive movement.
Use original or licensed assets, not copied melodies, recordings or characters.
Mother's original theme can unite distinct kingdom soundtracks, with corrupted
and restored treatments expressing the story. Use smooth transitions and leave
space for dialogue rather than unrelated vocals or competing music.

## Continuity and production

`STORY.md` is the overview; `docs/SWORD_STORY.md` maps weapon progression;
`docs/ART_QUEUE.md` tracks production; `docs/CHECKPOINT.md` records evidence.
Never change this canon merely to make incomplete implementation appear finished.
A Null Core/archive may remain as infrastructure or a runtime identifier. The
old claim that an archive independently decided to remove free will is superseded
by the evil robot hijacking Mother's song.
