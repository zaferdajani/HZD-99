# Art, cinematic direction, and VFX review — 2026-10-28

No approved asset was regenerated. Hero, Alpha/pack, crystal, purifier sword,
NULLFANG, and Talon assets are preserved. Direct gameplay-size inspection used the
fresh repair capture and existing current-build Gravehorn/bound-wolf captures.

## 8. Senior Character Artist — HOLD, P1/P2

### `GH-ART` — P1

`assets/characters/gravehorn/` and `assets/source/gravehorn/` remain absent.
`js/gravehorn.js` draws an articulated procedural stand-in. At gameplay size it is
a translucent pink silhouette beside the finished hero, with weak material,
joint, hoof, horn, and phase identity. It reads as debug art.

Acceptance: the queued fourteen-part gunmetal/bronze rig, both facings, planted
hooves, complete joint overdraw, separate horn sockets/weapons, phase-two armor
separation, down/retreat continuity, and all four trigger-bound intercuts.

### `BOUND-ART-01` — P2

`wolfDown4` and `cheetahDown4` remain absent. The bound-wolf gameplay capture uses
a tiny flattened crouch strip that does not read as a breathing defeated machine.

Acceptance: four-cell down/breathe/recover strips for wolf and cheetah, established
floor line and identity, visible chest breath, deliberate recovery, no slide/float,
and immediate eye-smoke clear after cure.

### `FURNACE-ART` — P2

Six authored action plates remain absent: breath, blast, spent, gather, dive, bell.
Acceptance: identity-matched plates wired to existing states with unchanged timing,
collision, and damage; distinct gameplay-size silhouettes and purple eye anchors.

### `PURIFY-ART-01` — P2

The current ritual layers sword light and flakes over the regular hero body. There
is no authored raise/hold/slash/recover strip with continuous paws-to-hilt contact.

## 9. Senior Cinematic Director — HOLD, P1/P2

- `MANHWA-PERF-01` — P1: Draft 3 has forty pages; the revised art folder has 32
  page files. Editorial still requires pages 16–40 to be produced/restaged. No
  complete forty-page parity certificate exists.
- `GH-CINEMATIC` — P1/P2: `gh_intro_a`, `gh_intro_b`, `gh_phase2`, and `gh_down`
  remain absent.
- `RITUAL-FILMS` — P2: older 960x540 guardian clips do not contain the required
  hero raise, white gather, purifier slash, black-red extraction, neutralization,
  and controlled return. Only the Glitch ritual is mapped as accepted.
- `PANEL-CORRECT-23` — P2/P3, hashes unchanged:
  - `m_down.webp` `c65be806…`: NULLFANG eyes are red instead of boss-purple.
  - `r_cell.webp` `800ab5ba…`: inactive Servo has lit eyes/chest.
  - `passage_b.webp` `9ca50c2c…`: rear hero is elongated/humanoid.

Use masked local corrections only; preserve framing, lighting, props, characters,
and unrelated pixels.

## 10. Senior VFX Artist — HOLD, evidence inconsistent

The source contract remains correct:

- red ordinary infected eyes; purple bosses, Sages, and Alpha;
- anchors transformed from the currently drawn frame;
- trails driven by body travel, not camera or idle motion;
- randomized 1.125–1.875 second lifetime;
- 90/170/260/320 quality caps;
- clear after >90 px discontinuity, cure, death, removal, teleport, room change;
- reduced motion keeps glow and suppresses smoke.

In the interrupted aggregate run, `infection-eyes` and `infection-roster` passed;
`infection-poses` timed out after staging Alpha, Glitch, Brood, and Zero. In later
isolated reruns, core and roster themselves timed out at 300 and 240 seconds.
Therefore October 28 has no clean complete VFX certificate despite correct source
and historical October 27 green evidence.

Acceptance: all three rendered suites on a stable pinned host, followed by physical
low/mid/high-tier device profiling with several ordinary enemies plus a boss,
reduced motion, room changes, cure, teleport cleanup, frame time, memory, thermal,
and post-cure particle count.

## Gameplay-size inspection

- Fresh repair board: strong visual hierarchy, legible labels, distinct metal
  parts, clear inactive targets, persistent keyboard/touch guidance. It looks
  production-ready.
- Gravehorn: composition is readable, but the boss body is an untextured translucent
  line/silhouette and is far below the hero's finish.
- Bound wolf: body is too small and horizontally collapsed to communicate identity,
  breathing, or recovery.
- Existing raw-marble frames still show stacked central notices, carrying
  `UI-DENSITY-25`.

