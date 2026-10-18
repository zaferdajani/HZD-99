# Test environment and diagnostics

- Locked repository dependencies: `npm ci`; package/lock files unchanged.
- Standard Playwright Chromium download failed with truncated/non-ZIP responses.
  A system-package attempt failed on unsupported UID/GID operations; no privilege
  escalation was attempted. Those logs are retained, not counted as gameplay.
- Ordinary npm package fallback: `@sparticuz/chromium@153.0.0` installed outside
  the repository. Its executable reports Chromium 153.0.8010.0. Packaged Brotli
  executable/software-renderer/fonts were expanded locally; no game dependency
  or browser binary is committed. [Preparation](prepare-browser.cjs),
  [wrapper](browser-wrapper.cjs). No tool installation is a game change.
- Local test servers are started by each collector/runner in its own command
  context. Served identity compares actual HTTP bytes with this checkout. An
  unrelated answering port cannot certify the build.

## Wrapper adjustment during the full collector

The initial packaged argument set included `--single-process`. Closing a page
context could close the whole browser before a subsequent context was created.
`mobile-platform`, `winch-purpose` and `panels` encountered `Target closed` at that
boundary. The preceding completed assertions are retained in their logs, but
each harness is a failure, not a partial pass. The wrapper was corrected after
the first `panels` attempt, before later new browser launches. It removes
single-process/in-process-GPU and unnecessary web-security/site-isolation flags.
The game source, generated pages and asset hashes did not change.

The isolated [mobile rerun](mobile-platform-rerun.log) passes both built pages
with that corrected wrapper. The initial full collector still reports its
failure. The full result is thus same-build evidence with a disclosed browser
setup adjustment, **not** one pristine unmodified-environment all-pass run.

The first real-input charge-threshold assertion and the filmflow 0.8s handoff
failure are different: they are actual assertions, not browser-creation errors.
Simulation-time loss under software-rendering load is a hypothesis for charge,
not a demonstrated cause. Do not relabel them or weaken the tests. The fresh
graphics fixture briefly overlapped the early collector and is not a performance
benchmark. Later isolated reruns, if any, are reported separately.

## Playthrough limits

`CAMPAIGN_VIDEO=0` explicitly disables complete footage; screenshots, route logs
and actual saved states remain. No physical phone/controller, subjective audio,
haptic feedback or sustained hardware performance is certified. Synthetic touch
or a phone viewport is not a full physical touch playthrough.
