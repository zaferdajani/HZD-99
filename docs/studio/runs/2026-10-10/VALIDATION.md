# Validation — first studio review

Baseline: `47fea7bef2e88c971cc6875c736a3a8d91012ae1`.

**36 of 37 distinct selected harnesses passed after environment retries; infection-roster timed out.** The repository registers161 harnesses. This is a focused first audit, not the full release suite.

- Opening-order: fresh-save desktop keyboard and phone touch to Servo passed. Later chapter-one checks use staged saves; no uninterrupted campaign to teaser.
- Regress: both index.html and odyssey.html booted;77 rooms each, no room/page errors, prism stress passed.
- First source batch omitted CHROMIUM_PATH for three mislabelled noBrowser harnesses. They failed due absent default executable. Environment-retry passed all three with /tmp/chromium. Original failed logs retained.
- Infection-roster exceeded collector timeout360s; no complete output. Cause unresolved; cannot certify all pose anchors. Eye lifecycle test passed separately.
- Final fixes rebuilt and passed tutorial-clarity, textreveal and caves-ch1. A staged browser frame also returned suppressed:true in A0B and captured booth-after.jpg.
- Initial runtime/journey runs were iterative developer checks, not one frozen release certification: source fixes landed while separate contexts were running. Final-fixes validates impacted paths on final build. Full integration regression must run on a frozen rebuilt snapshot.
- Unknown-harness command returns1; missing-file failure was exercised by the engineering agent using an isolated runner stub.
- git diff --check and Python syntax compilation passed. Physical phones, sound mix, haptic feel, full boss playthrough and all161 harnesses are not certified.

Commands use `CHROMIUM_PATH=/tmp/chromium python tools/studio/audit.py --tests ... --output ...`; each results.json records base, dirty state, timing, exit codes and log hashes.

### source

| Check | Result | Log |
|---|---|---|
| build | pass | [build.log](source/build.log) |
| repair-lifecycle | pass | [repair-lifecycle.log](source/repair-lifecycle.log) |
| story-opening | pass | [story-opening.log](source/story-opening.log) |
| script-route | pass | [script-route.log](source/script-route.log) |
| scratch-reach | pass | [scratch-reach.log](source/scratch-reach.log) |
| hero-feedback | pass | [hero-feedback.log](source/hero-feedback.log) |
| hero-delivery | fail | [hero-delivery.log](source/hero-delivery.log) |
| hero-frame-alpha | fail | [hero-frame-alpha.log](source/hero-frame-alpha.log) |
| hero-alpha | fail | [hero-alpha.log](source/hero-alpha.log) |
| tutorial-controller | pass | [tutorial-controller.log](source/tutorial-controller.log) |
| offline-release | pass | [offline-release.log](source/offline-release.log) |
| sage-specials | pass | [sage-specials.log](source/sage-specials.log) |
| tutorial-clarity | pass | [tutorial-clarity.log](source/tutorial-clarity.log) |
| story-progression | pass | [story-progression.log](source/story-progression.log) |
| input-focus | pass | [input-focus.log](source/input-focus.log) |
| voice-handoff | pass | [voice-handoff.log](source/voice-handoff.log) |
| desktop-protocol | pass | [desktop-protocol.log](source/desktop-protocol.log) |
| cave-ground | pass | [cave-ground.log](source/cave-ground.log) |
| seam-route | pass | [seam-route.log](source/seam-route.log) |
| shadow-ground | pass | [shadow-ground.log](source/shadow-ground.log) |
| dialogue-audio | pass | [dialogue-audio.log](source/dialogue-audio.log) |
| weapons | pass | [weapons.log](source/weapons.log) |
| gear | pass | [gear.log](source/gear.log) |
| motion-sampling | pass | [motion-sampling.log](source/motion-sampling.log) |
| combo-routing | pass | [combo-routing.log](source/combo-routing.log) |

### environment-retry

| Check | Result | Log |
|---|---|---|
| build | pass | [build.log](environment-retry/build.log) |
| hero-delivery | pass | [hero-delivery.log](environment-retry/hero-delivery.log) |
| hero-frame-alpha | pass | [hero-frame-alpha.log](environment-retry/hero-frame-alpha.log) |
| hero-alpha | pass | [hero-alpha.log](environment-retry/hero-alpha.log) |

### runtime

| Check | Result | Log |
|---|---|---|
| build | pass | [build.log](runtime/build.log) |
| textreveal | pass | [textreveal.log](runtime/textreveal.log) |
| infection-eyes | pass | [infection-eyes.log](runtime/infection-eyes.log) |
| infection-roster | timeout | [infection-roster.log](runtime/infection-roster.log) |
| den-gate | pass | [den-gate.log](runtime/den-gate.log) |
| panels | pass | [panels.log](runtime/panels.log) |
| story-rescue | pass | [story-rescue.log](runtime/story-rescue.log) |
| lion-studio | pass | [lion-studio.log](runtime/lion-studio.log) |

### journey

| Check | Result | Log |
|---|---|---|
| build | pass | [build.log](journey/build.log) |
| opening-order | pass | [opening-order.log](journey/opening-order.log) |
| caves-ch1 | pass | [caves-ch1.log](journey/caves-ch1.log) |
| chapter-one | pass | [chapter-one.log](journey/chapter-one.log) |
| mobile-platform | pass | [mobile-platform.log](journey/mobile-platform.log) |
| wolves | pass | [wolves.log](journey/wolves.log) |
| regress | pass | [regress.log](journey/regress.log) |

### final-fixes

| Check | Result | Log |
|---|---|---|
| build | pass | [build.log](final-fixes/build.log) |
| tutorial-clarity | pass | [tutorial-clarity.log](final-fixes/tutorial-clarity.log) |
| textreveal | pass | [textreveal.log](final-fixes/textreveal.log) |
| caves-ch1 | pass | [caves-ch1.log](final-fixes/caves-ch1.log) |
