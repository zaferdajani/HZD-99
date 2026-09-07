# Desktop playtest builds

The Windows workflow builds an offline x64 application from the same generated
game pages and `tools/pack-www.cjs` payload as other platforms. Download its
`CLAWBYTE-Windows-x64-<commit>` artifact, extract the entire ZIP, and launch
`CLAWBYTE.exe`. Keep the runtime libraries, resource archive and license notices.
This is a portable folder, not a self-contained single-file executable.

## Build locally

Use Node.js 24.20.0 (the pinned CI version):

```sh
npm ci --prefix desktop --ignore-scripts --no-audit --no-fund
node tools/pack-desktop.cjs win32
```

Output: `build/dist/CLAWBYTE-win32-x64/`. For a staging-only validation without
downloading a runtime, add `--stage-only`. `linux` and `darwin` can be passed to
the packer, but this workflow certifies neither target. They need their own
native execution tests and distribution work before being advertised.

The separate desktop lockfile pins Electron 44.2.0 and Packager 20.3.0 with
registry integrity hashes. Installation deliberately skips lifecycle scripts;
Packager downloads the target runtime with its checksum verification. No cached,
manually supplied runtime bypass is accepted. The build is repeatable from a
commit and lockfile; OS metadata/toolchain changes can still change output bytes,
so this is not a promise of bit-for-bit reproducible executable files.

CI rejects stale generated pages, checks the Windows executable and required
payload, then starts the packaged app twice in a disposable profile to exercise
offline loading and save persistence. Artifacts are uploaded only after those
checks pass and retained for 30 days. These are smoke checks, not a complete
campaign playthrough, controller certification or a performance benchmark.

`build-info.json` records the source commit, dirty status and every packaged
game-file hash. `SHA256SUMS.txt` covers all other files in the delivered folder.
Neither file is a digital signature. The playtest is unsigned and no Steam
credentials, upload, store publication, SDK, achievements or cloud-save service
are configured by this build.

The runtime uses a fixed `app://clawbyte` origin and `%APPDATA%/CLAWBYTE`
profile, so changing installation folders or restarting does not change the
save location. A random localhost port would change the localStorage origin
on each run; the old shell's HTTP server has been removed. Local media supports
byte ranges; path traversal, external navigation and remote network requests
are blocked. Renderer Node integration is disabled, with sandboxing and context
isolation enabled. Losing window focus pauses active gameplay; F11 toggles
fullscreen and Escape remains the game's pause/back key.

Verified upstream references (2026-09-07):

- [Electron stable releases](https://releases.electronjs.org/)
- [Electron Packager API](https://electron.github.io/packager/main/)
- [Node.js 24.20.0 release](https://nodejs.org/en/blog/release/v24.20.0)
