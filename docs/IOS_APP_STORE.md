# CLAWBYTE on the App Store

The iOS app is the same build as the web page, wrapped by Capacitor (NATIVE.md).
This file is the line between **what the repository already guarantees** and
**what only the owner's Apple account can do**.

## What is in the repository, and checked

| Requirement | Where | Checked by |
|---|---|---|
| Xcode project, bundle id `io.github.zaferdajani.clawbyte`, version 1.0.0 (build 1) | `ios/App/` | `tests/ios-ready.cjs` |
| Compiles and archives on Apple's toolchain, unsigned | — | `.github/workflows/ios.yml` (macOS runner) |
| iOS 14+ (the art is WebP), 64-bit only, iPhone and iPad | `project.pbxproj`, `Podfile`, `Info.plist` | both |
| Landscape only, full screen, no status bar, home indicator dimmed, edge swipes deferred, screen kept awake | `Info.plist`, `GameViewController` in `AppDelegate.swift` | `ios-ready`; behaviour needs a device |
| Music and the opening film start without a tap; video plays inline | `GameViewController.webViewConfiguration` | `ios-ready`; behaviour needs a device |
| The game's own icon (1024, no alpha) and launch image — not the template's | `Assets.xcassets`, derived by `tools/appicon.cjs` from `assets/source/brand/appicon.png` | `ios-ready` |
| Export compliance answered (`ITSAppUsesNonExemptEncryption = false`) | `Info.plist` | both |
| Privacy manifest: no tracking, no data collected | `PrivacyInfo.xcprivacy` | both |
| No permission prompts (no camera, mic, location, photos, tracking) | `Info.plist` | `ios-ready` |
| Sound an iPhone can decode: every Ogg has an AAC copy, handed out where Ogg cannot play (iOS before 18.4) | `assets/aac/`, `tools/aactier.cjs`, `audioSrc()` | `ios-ready` |
| Fully offline: every asset in the bundle, no service worker | `tools/pack-www.cjs` | `platform`, `ios-ready`, the workflow |
| No outside purchase link, no mention of other stores, never the demo | `js/game.js` (`demoOn`), `js/i18n.js` | `ios-ready` |
| Haptics through the native plugin (Safari has no `navigator.vibrate`) | `js/touch.js` | `platform` |
| Touch controls clear of the notch and home indicator (`viewport-fit=cover`, safe-area insets) | `build.cjs`, `js/touch.js` | `tap`, `opening-order` (phone run) |

## What only the owner can do

1. **Apple Developer Program** membership (US$99 a year), enrolled under the name
   the app should be published as — VibeSolutions needs an organisation account
   with a D-U-N-S number; an individual account publishes under the person's name.
2. On a Mac with Xcode 16 or later:
   ```bash
   git clone https://github.com/zaferdajani/HZD-99 && cd HZD-99
   npm ci && npm run app:ios        # builds, packs, pod-installs and opens Xcode
   ```
   In Xcode: **App target → Signing & Capabilities → Team** (pick the account;
   leave "Automatically manage signing" on). If the bundle id is taken or should
   carry the studio's name, change it here **and** in `capacitor.config.json`.
3. **Play it on a real iPhone first** (Product → Run with the phone plugged in).
   The things no test here can see are listed below.
4. **Product → Archive → Distribute App → App Store Connect.**
5. In **App Store Connect**: create the app record, then supply what the store
   page needs and the binary cannot carry —
   - screenshots: 6.9-inch iPhone (2868 × 1320 landscape) and 13-inch iPad (2752 × 2064);
   - description, keywords, support URL, **privacy policy URL** (required even for an app that collects nothing);
   - **App Privacy**: "Data Not Collected";
   - **age rating** questionnaire (cartoon/fantasy violence);
   - category: Games → Action (and Adventure);
   - price and territories;
   - **the content-rights question**: the art, video, music and voices are AI-generated
     (Higgsfield) and synthesized, all original to this project — `assets/CREDITS.md` is the ledger.
6. Submit for review. If Review cites Guideline 4.2 (minimum functionality — a
   "web wrapper"), the answer is in NATIVE.md: a complete offline game, every
   asset in the bundle, native haptics, no network needed after install.

## Check on a real device before submitting

These depend on hardware and on WebKit itself, and nothing in this repository can stand in for them:

- **Frame rate** through a boss fight on the oldest phone you mean to support (the quality dial in `js/perf.js` adapts; the floor it reaches is the question).
- **The mute switch.** WebKit decides the audio session; confirm music and effects behave the same way with the switch on.
- **Interruptions**: a phone call, Control Centre, backgrounding mid-fight and returning — the game should pause and the music resume.
- **The notch and the home indicator** on a Dynamic Island phone, both landscape directions.
- **A controller** (the pad path exists; MFi/DualSense on iOS has not been tried).
- **Save persistence** across an app update: the save is in the web view's local storage.

## Rebuilding the derived pieces

```bash
node tools/appicon.cjs      # every icon and launch image, both shells, from the one master
node tools/aactier.cjs      # the AAC copy of every Ogg (run after adding or changing a sound)
```
