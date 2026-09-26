# Update the milestone manhwa

The game reads `assets/manhua/chapters.json`. Each published entry is a reward
episode with ordered images and **all** required milestones. No JavaScript or
gameplay changes are needed to add a chapter using an existing milestone.

1. Add your finished page images under `assets/manhua/<chapter-name>/`.
   Use a new filename for changed art, or increase the chapter revision.
2. Copy an entry in `assets/manhua/chapters.json`. Give new chapters a permanent,
   unique lowercase `id`. Keep existing IDs when revising the same chapter.
3. Set `title`, `revision`, `unlock`, and the ordered `slides`. Use `status: "draft"`
   until ready; drafts never unlock or appear in the game library.
4. Each slide needs `src` (relative to the game root) and an accessible `alt`.
   Include the exact lettering in `caption`. Silent pages should describe their
   action. Choose `motion`: `still`, `push-in`, `drift-left`, or `drift-right`.
   Set `seconds` between 4 and 60; 14–20 seconds suits a page with several panels.
   Individual panels can be separate images/slides for finer cinematic pacing.
5. Set `status: "published"`, run `node tools/validate-comics.cjs`,
   `node build.cjs`, and `node tests/run.cjs comic-rewards manhwa-reader`.
   Inspect phone-size lettering and every character before publishing.
6. Commit on `claude/clawbyte-repo-migration-byhyl8`, push, and mirror the tested
   commit to `main` and `odyssey`. Verify the live manifest and image hashes.

The website refreshes this manifest when a save starts and whenever the memories
library opens. Newly published chapters also unlock for saves that already earned
their milestone. Revising an existing chapter keeps it in the library without
automatically interrupting the player again. Its updated revision restarts reading
at page one when selected. New IDs denote new rewards, not cosmetic corrections.
An already open slideshow keeps its edition until closed, avoiding mid-page changes.

The game does **not** interpret instructions written inside an image or PDF. The
manifest is the instruction file. Export PDF pages to images and specify their
order here. Adding a file alone does not select a milestone or publish it.
The reader never executes scripts supplied in a chapter and never grants weapons.

## Example

```json
{
  "id": "chapter-two-the-relay",
  "title": "The voice behind the signal",
  "revision": 1,
  "status": "published",
  "unlock": ["talonhost-freed"],
  "slides": [
    {
      "src": "assets/manhua/chapter-two/page-01.webp",
      "alt": "Mono discovers that the corrupted instruction came from another relay.",
      "caption": "MONO: That order did not come from Mother.",
      "motion": "push-in",
      "seconds": 14
    }
  ]
}
```

Add the entry inside the top-level `chapters` array; keep `version: 1`.

## Milestones

| Key | Actual save fact |
|---|---|
| awakened | Completed wake (`flags.woke`) |
| ratchet-restored | Restored workshop Ratchet (`on_A0B\|ratchet`) |
| volt-pack | Purchased the repair/Burst pack (`heal`) |
| servo-restored | Restored Servo (`on_A1\|servo`) |
| raw-marble | Quarry pickup recorded, material held, or first sword forged |
| first-sword | First sword earned (`crystal`) |
| first-sage | First sage cleansed (`sageTame_GA1D`) |
| first-rescue | At least one persistent ordinary-machine rescue |
| chime-silenced | CHIME defeated (`bossChime`) |
| nullfang-freed | NULLFANG resolved (`bossGlitch`) |
| talonhost-freed | TALONHOST resolved (`bossBrood`) |
| furnace-freed | FURNACE CHOIR resolved (`bossAtlas`) |
| glaciere-freed | GLACIERE resolved (`bossZero`) |
| prism-freed | PRISM resolved (`bossPrism`) |
| mother-freed | Ending earned (`won`) |

Names describe the current rescue-only campaign. Unknown milestone names fail the
build rather than unlocking a chapter accidentally. A brand-new gameplay event
needs a code change to the registry in `js/comics.js` and a corresponding test.

## Playback and preservation

The reward waits until the player is stationary on safe ground, after tutorials,
conversations and transitions. Nearby hostile machines and projectiles postpone
it. Gameplay freezes while reading. Return to game never removes a reward.
Pause → **Manhwa memories** lists unlocked and locked chapters. Reading position,
offered status and completion live inside the existing save, under `comics`.
Starting a new game resets its rewards; existing saves keep their weapons/items.
NOSTOS uses its separate world and does not receive CLAWBYTE chapters.

Use Previous/Next, arrow keys, controller directions/confirm/back, or touch buttons.
Full-size mode allows scrolling through lettering on small screens. Transcripts
remain available; reduced-motion preference removes the animation and defaults to
manual advance. Hidden browser tabs do not advance the slideshow. Failed images
offer Retry and Return to game without marking the page finished.

Web pages/images become available offline after loading, subject to browser cache
capacity. Android/desktop packages include the manifest and images; a new package
is needed to update an installed native version. Native packages do not silently
download a different website game or remote art. The built-in manifest also permits
offline startup and protects against an unavailable or malformed content update.

## Current edition boundary

Seven reward episodes use 29 of the existing revised illustrations. Pages 8, 16
and 20 are excluded from automatic rewards because their machine/hero continuity
needs correction. These are explicitly labelled illustrated drafts, not newly
generated or fully parity-certified artwork. The expanded written opening and
all-page game/art parity remain tracked separately. Displaying a comic inside the
game is not proof that every action drawn in it is playable.
