# Desktop playtest and commercial-release quality gates

The Windows executable is a development playtest. Producing it does not make
the game commercially release-ready or equivalent to any reference game.

## Required release evidence

| Area | Acceptance evidence |
|---|---|
| Campaign | A recorded fresh-save playthrough to the ending, with mandatory gates, material collection, forging and each weapon upgrade exercised; no unrecoverable route or save blocker. |
| Combat | Every boss tested with minimum earned gear, readable warnings, avoidable attacks and recovery opportunities; checkpoint retries verified. |
| Animation | Approved continuous movement/weapon clips with consistent facing, anatomy, grip and foot contact. Existing hero and Ratchet art failures must pass without relaxed thresholds. |
| Audio | Consistent voice identity, contextual actions, no stale dialogue or clipping; existing voice-register failures corrected. |
| Controls | Full keyboard and real controller playthroughs, menus reachable without a mouse, unplug/reconnect and focus-loss recovery. API presence alone is not controller certification. |
| Performance | Profile representative exploration, crowded combat and all bosses on actual minimum-spec hardware; target stable 60 fps and measure frame-time spikes. Publish only measured requirements. |
| Reliability | Offline launch, media playback/seek, exit/relaunch save recovery, installation-folder changes and update-over-existing-save tests. |
| Presentation | Readable HUD/text at supported resolutions, fullscreen/windowed modes, coherent environment layers and approved commercial-use asset provenance. |
| Distribution | Correct platform package, licenses, build identity, accurate feature/platform claims and the platform's own review process. |

## Current delivery scope

The desktop workflow builds Windows x64, checks the local asset protocol, and
runs the packaged executable twice to test offline boot, movement, media ranges
and saved progress. Only a passing native smoke run publishes its downloadable
artifact. The application is unsigned, with no Steam SDK, achievements, cloud
saves, overlay certification or Steam publication configured. macOS, Linux and
Steam Deck are not claimed as tested platforms.

The cave fixes have a completed 91-harness run: 88 passed, with the three
pre-existing voice/animation asset failures documented in CAVE_PASSAGE_FIX.md.
Those failures are release blockers for a polished commercial launch, even
though they do not prevent a development playtest build.

Valve reviews the store presence and executable build separately; that process
does not replace the game's own quality gates. See the official
[Steam review documentation](https://partner.steamgames.com/doc/store/review_process).
Controller integration/testing should follow the official
[Steam Input developer guidance](https://partner.steamgames.com/doc/features/steam_controller/getting_started_for_devs).
The desktop security boundary follows the
[Electron security checklist](https://www.electronjs.org/docs/latest/tutorial/security).
