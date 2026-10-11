# Start the next studio review here

Read this run's final REPORT.md and VALIDATION.md, then compare current main and
integration against `codex/studio-review-2026-10-11`. Do not assume the review
branch was integrated. This audit is expressly branch-only.

The Oct10 integration already supplied complete new Alpha strips, 17 game panels,
clean unlettered pages, A7 read-based rewards, Mother lens anchors, the media-pending
cleanup and a historical continuous Kitten campaign. Those are not missing work.

This review fixes CIN-4 (A3 alternate-room scene selection), CIN-5 (Sage's stale
bell replay) QA-05 (collector deadline/process cleanup), and QA-07 (post-lion roomcache fixture). Check whether they
have landed before editing them again.

There is one non-runtime art candidate:
`assets/source/manhua/ch1/candidates/2026-10-11/repair-identity.png`.
Its provenance and preview evidence are present; it is not owner-approved. Check
whether the integrator has already normalized, tiered and wired it before asking
to generate another repair panel. ART-3 concerns the wrong original hero face;
ART-4 concerns thin segmented limbs in passage_b. Targeted identity correction is
different from requesting all 17 scenes again.

Carry forward TER-1 recovery below the bell climb, CIN-2 scene timing (fresh cave introduction shown after marble extraction),
HERO-1 NOSTOS terminal20, the partially fresh BOSS-1 Sage-retention evidence and historical UI-3/UI-4/ART-2
observations, and VFX-2 Mother low-tier saturation (freshly measured at 90/90). Reproduce uncertain defects before changing behavior. Chapter Two
currently has a genuine teaser; an entire second chapter is separate scope.

QA-08: opening-order failed at atk/pack before the meadow, with no page errors.
Preserve the failed log; investigate elapsed stages and final state before changing
its 240-second-per-mode budget. This harness injects start/coil and drives keyboard/pointer
even in its phone context; it is not real-touch or full title-to-end evidence.

Use the updated full collector, a frozen build and no campaign segment/stop flags.
Inspect result.json as well as harness exit status: report actual page errors,
missed panels, difficulty, deaths and completion, not merely a green process exit.
Keep retries separate and avoid claiming physical devices, subjective sound,
haptics or human default-difficulty play from automated evidence.

Final run: 166 harnesses executed, 164 original passes; roomcache fixed/pass separately, opening-order still failed. Fresh campaign completed 13:36 with 1 death and 0 page errors, but passage missing (12/13) and cave intro late. QA-09: complete/panelsMissed:[] is not sufficient; derive the actual missing set and check chronology. Full original logs are retained.
