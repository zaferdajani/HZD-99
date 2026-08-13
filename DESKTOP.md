# The desktop build

Same game, same build, in an Electron window. There is no port and no second
copy of anything: `tools/pack-www.cjs` assembles exactly what the web gets, and
the shell loads it.

## Try it on Windows

One command, in PowerShell, in whatever folder you want it:

```powershell
iwr -useb https://raw.githubusercontent.com/zaferdajani/odyssey/main/tools/install-windows.ps1 | iex
```

or download `tools/install-windows.ps1` and right-click → Run with PowerShell.

It fetches the Electron runtime from Electron's own release page and the game
from this repository, assembles them into `.\CLAWBYTE\`, and you run
`CLAWBYTE.exe`. About 190 MB of download, ~300 MB installed.

**SmartScreen will warn on first launch** — "Windows protected your PC",
publisher unknown. That is what an unsigned executable looks like, not a
problem with the build: *More info* → *Run anyway*. Code signing is a
Steam-release step (a certificate, and the reputation that accumulates behind
it), not something a test build needs.

### Why a script instead of a download

The finished app is ~340 MB, the great majority of which is the Chromium
runtime Electron ships. That is too big to send through chat, and too big to
keep in git without every future clone paying for it. Both halves are already
published — the runtime on Electron's releases, the game here — so nothing is
stored twice. It also means re-running the script is how you update.

## Build it yourself

```bash
npm install
node tools/pack-desktop.cjs win32     # Windows x64  -> build/dist/CLAWBYTE-win32-x64/
node tools/pack-desktop.cjs linux     # Linux x64
node tools/pack-desktop.cjs darwin    # macOS
```

**Cross-building Windows from Linux works and needs no Wine.**
`@electron/packager` compiles nothing: it downloads the prebuilt runtime for the
target and lays your files beside it. The one thing it cannot do off-Windows is
rewrite the .exe's embedded icon and version resource — those need `rcedit`,
which is itself a Windows binary — so on a non-Windows host they are skipped and
the app wears Electron's default icon until it is built on Windows or with Wine
present. It runs identically.

If the packager's own download dies mid-stream (it does, behind some proxies,
with an undici assertion that says nothing useful), fetch the runtime with curl
and the build will use it:

```bash
V=33.4.11
curl -L -o build/zips/electron-v$V-win32-x64.zip \
  https://github.com/electron/electron/releases/download/v$V/electron-v$V-win32-x64.zip
```

## What the shell changes, and why

**It serves over `http://127.0.0.1` rather than opening the page as `file://`.**
file:// looks simpler and is a trap: media elements, ranged requests for the
streamed score, and anything the browser treats as cross-origin all behave
differently there, so the desktop build would quietly become its own platform
with its own bugs. A small static server on a random free port means the
shipped game runs on exactly the terms it was tested on — including honouring
`Range`, without which every seek in a music track re-downloads it.

**The score starts with the picture.** No browser will play audio nobody asked
for, which is why the game carries a "tap for sound" badge — and it is why a
player on a controller got a silent game, since a pad press is not a user
gesture as far as a browser is concerned. Inside our own shell that policy is
ours: `autoplayPolicy: 'no-user-gesture-required'`, and the opening simply
begins.

**Nothing is throttled in the background.** `backgroundThrottling: false` — a
simulation that pauses because the window lost focus is a bug, not a saving.

**F11 fullscreen, Escape leaves it.** Escape is the game's own pause key, so it
is only intercepted while actually fullscreen.

## What it does not change

Performance. Electron *is* Chromium, so the app runs the same engine as the web
build at the same speed. The quality tiers (`js/perf.js`) do the adapting, and
on a desktop they will usually land on `ultra` — which supersamples above native
resolution rather than merely filling it.

## Steam

See `docs/STEAM.md`.
