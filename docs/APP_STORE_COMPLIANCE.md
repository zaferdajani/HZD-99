# App Store / Google Play compliance

| # | Topic | Status |
|---|---|---|
| 1 | Digital goods / external checkout | **N/A** — no payments of any kind. |
| 2 | Sign in with Apple | **N/A** — no social or any sign-in. |
| 3 | In-app account deletion | **N/A (no accounts).** Public page `delete-account.html` explains clearing on-device data; use its URL in the Play Console. |
| 4 | Native value | Already present: Capacitor shell with Haptics, StatusBar, SplashScreen, ScreenOrientation, Android back button, bundled offline assets (no network needed in the app). Legal pages open in the Capacitor Browser plugin if installed, else a new tab. **Remaining:** push notifications not added (nothing to notify); `@capacitor/browser` is not installed (would change the lockfile) — add it if an in-app browser is wanted. Native value beyond a packaged game is thin by nature. |
| 5 | Reviewer demo account | **N/A** (no login). `docs/APP_REVIEW.md` written. |
| 6 | iPad 768–1366px | Not changed: the game is a fixed 16:9 canvas that scales to the viewport (`max-width:100vw; aspect-ratio:16/9`), so no breakpoints apply. Legal pages are fluid. |
| 7 | Screenshots match the app | Noted in `docs/APP_REVIEW.md`; owner must capture real screenshots. |
| 8 | "Coming soon" screens | The demo screen's `demo_soon` row exists only in the demo build (`DEMO_URL` empty); not reviewed further — owner should confirm demo screens are not reachable in the store build. |
| 9 | Privacy / Terms / Support | Added `privacy.html`, `terms.html`, `support.html`, `delete-account.html` (placeholder text marked for owner review), copied into the app package by `tools/pack-www.cjs`, listed in `sitemap.xml`, linked from Pause menu (new i18n key `pm_legal`, 5 languages). **Owner:** replace policy text and the support email placeholder. |
| 10 | UGC report/block | **N/A** — no user-generated content. |
| 11 | Restore Purchases | **N/A** — no purchases. |
| 12 | Paid labelling / paywall links | **N/A** — nothing paid. |

## Owner to-do
Policy text review, real support email, store-listing data-safety forms ("no data collected"), real device screenshots, Apple/Google developer accounts and signing keys.
