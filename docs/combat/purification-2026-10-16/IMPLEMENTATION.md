# Deliberate guardian purification
Date: 2026-10-16
Base: a393877327d0c32a80bca254d7162cced47ac06d

## Implemented
- New PURIFY state owns the final-hit transition for Glitch, Brood, Atlas, Zero and Prism. The marble sword remains mandatory. Alpha and Mother's ending retain their separate paths.
- A fresh release and continuous 1.6-second E/Interact or on-screen button hold are required. Partial release, touch cancellation and focus loss cannot complete a rescue.
- Raised white sword, converging white flakes, curved slash, brief white impact, frozen action and black transition. Reduced-motion settings suppress the screen flash and shake.
- New 12-second Higgsfield lion movie, encoded for local playback. The actual generated frames show gathering, slash, dark red extraction into the blade and golden restoration.
- Other guardians use their own runtime character artwork in a gather/slash/extract/restore fallback. No guardian is substituted with the lion film.
- A film that cannot start falls back to the authored in-engine sequence. Existing deliberate movie skipping remains supported.
- Restored guardians receive a gold rendering treatment, retain friendly behavior and reload restored from existing save flags.
- Existing reward ledger is reused once. Deferred rewards cannot be stranded behind a post-rescue dialogue. Impact effects are cleared when the cinematic ends.
- Infection eye particles continue aging during the ritual and are removed from the restored guardian.
- Story canon, production script, browser tests, screenshots and generation provenance are included.

## Not complete / not equivalent
Four additional Higgsfield movies were not produced: the connected workspace rejected the next job for insufficient credits. Their runtime fallback is implemented; it is not a generated short movie. Only the lion film has been generated and frame-reviewed.
Desktop Chromium with an emulated touch screen is not physical iOS/Android validation.
Tests that stage a room or save are not an uninterrupted chapter playthrough. Campaign attempts and their exact outcomes are recorded separately in VALIDATION.md.

## Test maintenance
The old story-order assertion expected automatic taming on the lethal blow. It now asserts the new protected prompt and no early reward; dedicated purification tests exercise the actual hold and eventual ledger.
The Ratchet survey test had staged a post-forge save without marking story panels viewed. The arrival panel loader swallowed its six simulation ticks. The focused fixture now records the already-viewed presentations and waits for motion assets; the quest assertions remain intact.
The campaign driver now follows the existing nonlethal A2 meeting before attempting its locked cave hatch, supports the new hold action, and releases physical held keys across room transitions. It does not teleport, grant equipment, set quest flags or mutate combat state.

## Reproduction
CHROMIUM_PATH=/path/to/chromium node tests/run.cjs purification purification-controls story-order survey-a7
node build.cjs
node tests/build-integrity.cjs

For a real-input campaign, use tests/run.cjs campaign-ch1 and retain the result.json. A timeout, stopped segment, missing panel or page error is not certification.
