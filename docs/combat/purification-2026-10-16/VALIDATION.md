# Validation — guardian purification
Date: 2026-10-16. Shipping BUILD_ID: **f9863af94c78**.

## Evidence and limits
The broad candidate run executed 188 registered harnesses in three groups (63/63/62), on build 9d2fffa668da. 184 passed; four failed:
1. Kingdom: real final-hit callback cleared the active swing too early. Fixed by expiring the swing and clearing it on the next ritual update. The actual five-kingdom recheck passes.
2. Warp: room-entry initialization reached the new button variable before initialization. Fixed module order. Warp recheck passes.
3. Bake3d: this environment lacked the official Chromium SwiftShader libraries. Restored those runtime libraries; unchanged tool/test passes.
4. Platform: native www package was stale and lacked the new film. Repacked; platform recheck passes.

The final build was rebuilt after the fixes. Build integrity passes. All **16 release harnesses** pass on the final build, including packaged parity. Both built games load all 77 rooms without page errors. Story-order and survey-a7 pass. The focused purification test passes, including actual MP4 decoding/advancing, hold cancellation, five guardian gates, earned-sword protection, restoration and failed-media recovery.

The first affected recheck also caught a test sequencing mistake: after simulating a hidden tab, the test pressed again before allowing a released-input frame. The fixture now supplies that frame; the separate final controls run passes. It covers actual browser touch events, touch cancellation, focus loss, hidden-tab clock suspension, portrait blocking, landscape target size and saved restoration. These are emulated browser checks, not physical-device certification.

The full 188-test candidate run and the final affected/release reruns are retained separately under checks/. This is not a claim that all 188 were rerun from scratch against the final hash.

## Real-input campaign
- campaign/ and campaign-final/: earlier diagnostic attempts were stopped after driver route/input issues. They are not passes.
- campaign-route/: fresh browser, keyboard-only progression through wake, repair, pod, marble cave, forging, sage, CHIME and lion. It reproduced the final-hit swing crash on the pre-fix candidate at 16:42. It was stopped; **not certified**.
- campaign-continuation/: final build, resumed from the game's unedited save-after-chime.json. Normal keyboard combat reached PLAY → PURIFY at 00:35, CUT at 00:40, restored reward at 00:51, lion objective complete at 01:06 and chapter-two teaser complete at 01:29. Zero deaths, zero page errors, zero stuck events. The harness correctly reports **partial-diagnostic**, not fresh-run certification, because this was a saved continuation.
- No uninterrupted fresh chapter pass on the final build is claimed.

## Graphics and film
Reviewed generated lion film contact frames and actual in-game video capture. The shipped film is 1280×720 H.264 with AAC, duration 12.256 seconds, 2,809,877 bytes. Git blob SHA: d5909d66056c222fdacf5fbc0a80985066de0066.
Screens capture prompt, gathering, slash, fallback, actual movie, restored stage and mobile button. Old guardian films were separately inspected: they show restoration but omit the new hero/sword extraction choreography, so they were not substituted as matching new films.

## Remaining
Four guardian movies require Higgsfield credits. Their in-engine fallback is functional but is not a generated cinematic. Full fresh-run chapter certification and physical-device validation remain unverified.
Publishing is reported only after remote refs and the actual live build/movie are checked; passing these local tests alone is not a deployment claim.

## Live release verification and CI follow-up
Commit 33bdb39221d5b533765072337abfdf783b152e8a was fast-forwarded to integration, main and odyssey. GitHub Pages served build f9863af94c78; the live index and lion movie matched local bytes exactly. Movie SHA-256: 8d8b5bb7a982ca3990ed837b64073ec7fccf216dd32feceb5e8ddf9e266ea646.
The purification browser harness also passed against the public site, including 114 advancing movie samples and no page errors. This browser used the environment's network proxy; local proxy-certificate handling was confined to that disposable public-site test context.

The hosted verification job failed its wake harness twice: first at the workshop's final transition, then still in the opening panels. Investigation found the harness's zero-duration Enter presses could occur wholly between frames. updatePanels samples HELD input and confirms on release, so it never saw those presses. The follow-up changes only tests/wake.cjs to a 60-ms Enter press, leaving the 90-second deadline and every assertion unchanged. This is the same real press/release behavior used by the successful campaign driver. Hosted rerun status must be checked separately; this note does not claim a future CI result.
