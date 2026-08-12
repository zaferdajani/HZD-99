# The app build

The same game, in a native shell. Capacitor, not a rewrite: the web build IS
the app's content, so there is one codebase and no port to keep in sync.

## Build it

```bash
npm install                # capacitor + the test harness deps (nothing shipped)
npm run app:sync           # build.cjs -> www/ -> android/
npm run app:apk            # needs the Android SDK; emits app-debug.apk
# or: npx cap open android   and press play in Android Studio
```

`npm run app:pack` alone just assembles `www/` (2 pages + 70.5 MB of assets,
~72.6 MB total) so you can inspect exactly what would ship.

## What the shell changes, and why

**The score starts with the picture.** On the web no browser will play audio
nobody asked for — which is why the game carries a "tap for sound" badge and
spends the player's first tap unlocking the score instead of skipping a shot.
Inside the app that policy is ours: `MainActivity` sets
`setMediaPlaybackRequiresUserGesture(false)`, and the opening simply begins.

**Haptics work on iPhone.** Every buzz in this game went through
`navigator.vibrate`, which **iOS Safari does not implement at all** — silently,
with no error. `tBuzz()` now routes to the Capacitor Haptics plugin when
running natively (short taps become impacts, longer ones a real vibration) and
keeps the web path in the browser.

**Nothing streams.** All 70 MB of film, score and art is on the device, so the
opening cannot buffer and a boss film cannot stall. This is the single biggest
practical difference for a player on mobile data.

**The back button means back.** On Android its default is to close the app —
mid-boss that is a quit button, not a back button. It now pauses the game, or
backs out of whatever screen you are on, and does nothing on the title screen.

**Landscape, immersive, awake.** Locked to `sensorLandscape`, system bars
hidden with sticky immersive (the touch controls live exactly where a nav bar
would sit), notch handled with `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES`, and
`FLAG_KEEP_SCREEN_ON` so a long fight never dims.

**No service worker.** `tools/pack-www.cjs` strips the registration from the
packaged copy: it exists to keep a web player on the newest code and to survive
being offline, and inside an app the code *is* the package.

## What it does NOT change

Performance. The Android WebView and iOS WKWebView run the same engines as the
browsers, so the app is not faster than the web build. If the game feels heavy
on a device it will feel the same here — that is a draw-cost problem, and the
place to fix it is the render path, not the packaging.

## iOS

`npx cap add ios` generates the Xcode project, but building it needs macOS,
Xcode and an Apple Developer account. Two things to set there, matching what
the Android side already does:

- `WKWebViewConfiguration.mediaTypesRequiringUserActionForPlayback = []`
  (the autoplay unlock)
- `UISupportedInterfaceOrientations` limited to the two landscape values

## Store note

Apple's Guideline 4.2 rejects thin wrappers around a website. A full offline
game with bundled assets, native haptics and (later) IAP normally clears it,
but it is not automatic. Worth knowing before submitting rather than after.
