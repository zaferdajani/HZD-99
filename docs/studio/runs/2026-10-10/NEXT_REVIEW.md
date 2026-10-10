# Handoff to the next studio review (after the 2026-10-10 integration)

Copy this into the next daily review as its starting point.

---

You are running the next CLAWBYTE senior studio review (docs/studio/PIPELINE.md,
15 roles in docs/studio/roles.json). The 2026-10-10 review was integrated and
released; read docs/studio/runs/2026-10-10/INTEGRATION.md first — it records
what closed, with evidence, and what is carried forward. Do not re-raise a
closed finding without new evidence; do not regenerate any asset listed there
as integrated (the Alpha strips, the 17 game panels, the 12 unlettered pages).

Pin main and claude/clawbyte-repo-migration-byhyl8 at the start. Serve the
checkout and let `tests/run.cjs` verify the served build (it now refuses a
mismatch). Run the full registered suite on a frozen build, plus
`campaign-ch1` (the normal-input chapter-one autopilot, ~15 min; it records
video with CAMPAIGN_OUT=<dir>).

Carried forward — review each, with fresh evidence, and propose bounded fixes:

1. TER-1 (P2): the bell climb in A2 sits over the quarry's broken floor; a
   missed jump falls two rooms. TERRAIN: a ledge or catch under the climb.
2. CIN-2 (P2): room-bound panels need a standing, unthreatened player; a brisk
   player can leave the break pages owed. Decide: a hook from the staged beat's
   own end (panelsPlay) instead of a room watch.
3. BOSS-1 (P3): damage carried over a death — the Sage keeps it, CHIME and
   NULLFANG reset. Pick one rule and apply it to all three.
4. UI-3 / UI-4 (P3): suit badge over the Neural Tree pill; the dialogue box
   covers both speakers' legs (layout decision for the owner).
5. CIN-3 (P2): chapter two has a teaser, not pages.
6. ART-2 / VFX-2 / HERO-1 (P3): freed Alpha's collar keeps faint violet;
   MOTHER-V fills the phone smoke pool; NOSTOS shows "t20" on the A7 terminal.
7. Owner review is still owed for the new Alpha takes and the 17 game panels
   (generated and integrated, not approved).

Certify nothing on a physical device, on audio, or on haptics from emulation.
