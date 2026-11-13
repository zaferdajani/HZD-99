---
name: creature-motion-combat
description: Apply species-specific movement and readable attack choreography to CLAWBYTE's approved Sage and guardian roster. Use for gait, foot plants, committed strikes, flight, recoil, recovery or purification motion. Verify the actor's actual design before assigning an animal profile.
---

# Creature motion and combat — project adapter

This is original project-specific guidance, not an installed Blender runtime or a
claim that a downloaded skill created art. Research provenance (author/repository,
path and content hash) is in `docs/combat/research/creature-motion-skills-2026-11-13.json`.
The upstream skills were read, not executed. Never inherit another project's
account restrictions, rig-specific joint limits or its approval claims as ours.

Read ART_BIBLE.md, STORY_CANON.md, combat-design, boss-openings, boss-patterns
and HERO_ANSWERS.md. The current hero DOES have a limited guard/parry system;
older no-block/no-parry text is historical. Use the current source to resolve it.

## Select the actual actor, not a guessed species

The seven chamber Sages currently share a robed biped design. Pack Sage is not
an Alpha wolf just because of its name. Animal guardians have separate identities.
Use `references/roster.md`. Do not redesign approved art or introduce a species.

## Shared implementation contract

1. Pin current source/live identity. Preserve original art/audio and hero gait.
2. Record the old behavior with the same inputs and assets before editing.
3. Define anticipation, committed contact, exit/turn, recovery and interruption
   separately. Store direction at commitment; do not make a lunging body track
   a player who crossed behind it. A second strike needs a readable redirection.
4. Keep foot/root registration fixed. Clock locomotion by distance. Place threat
   origin and contact geometry in the same world coordinates as their visuals.
5. Rendering samples simulation state; it never advances a timer, spawns damage,
   pays a reward or consumes a cue. Render repeatedly to prove that.
6. Hold impacts on confirmed contact. Use existing voice/VFX ownership; no new
   random voices or generic explosions. A tell is not a hit.
7. Examine full-resolution source and native-camera animation. A rescaled plate
   is not a newly authored multi-frame performance. State that limitation.
8. Test sides, range boundaries, elevated floors, jump responses, interruption,
   pause, missing art, duplicate rendering, save/reload and once-only rewards.
9. Re-run existing world/hero/boss gates; deploy only tested code through the
   established route. Verify public bytes and an actual browser, not only CI.

## Body-specific rules

- **Biped duelist:** plant the rear foot before driving; keep hood/head size
  consistent across coil and strike; show a non-attacking exhale. Turn at a
  stopped/replanted beat. A rescued actor must not glide in a kneeling portrait.
- **Feline:** distinguish stalk, crouched hind-leg load, airborne extension,
  forepaw landing and weight settling; no leg-running in flight. Tail follows
  balance; it does not arbitrarily spin during a committed swipe.
- **Canine:** distinguish measured walk/trot, acceleration, leap and braking.
  Bite/clinch/release owns jaw contact. Do not use one universal phase table for
  all gaits or force a wolf into a cat's flexible-spine cycle.
- **Avian:** shoulder drives the wing; elbow/wrist folding follows. Separate
  flapping, banking, dive, braking and landing. A pendulum/cable is simulated
  once; no leg gait masquerading as flight.
- **Heavy quadruped / rhino:** mass is in acceleration and deceleration, not
  camera shake. The horn/projectile socket and charge collision must coincide.
  A wall hit should stop momentum and leave a readable recovery.
- **Dragon:** coordinate four-legged support with wings, neck and tail; a wing
  stroke is not a ground step. Fire/release originates from the actual mouth or
  mechanism. Do not accumulate two whole-body bob/squash systems.
- **Magical equine:** separate grounded hoof phases from the deliberate hover
  pose. Magic explains lift, not arbitrary foot slipping. Horn release and body
  recoil have one source event, followed by accessible recovery.
- **Core / construct:** use hinges, radial parts, phase-locked mechanisms and
  controlled recoil, not invented animal gait. Keep the attack silhouette clear.

## First implementation target

The Meadow Sage in GA1D. Preserve its 500ms coil, two 220ms lunges, 700ms exhale,
700ms ring gather, 30% song-lock, four single-Purifier cleansing hits and once-only
Power Cell. The new 180ms replant and 550ms ring recovery must be logged as explicit
behavior changes. Contact damage is active-strike-only, not a hidden tax during
its advertised opening. Other chambers remain unchanged until individually audited.
