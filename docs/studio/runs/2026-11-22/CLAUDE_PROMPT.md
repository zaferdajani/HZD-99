# Single Claude integration prompt

```text
You are integrating the November 22, 2026 senior studio review for zaferdajani/HZD-99. Work from the latest origin/main in a clean worktree. Read, in order: AGENTS.md, docs/DEVELOPMENT_AUTHORITY.md, CLAUDE.md, docs/STORY_CANON.md, docs/studio/PIPELINE.md, docs/studio/roles.json, and docs/studio/runs/2026-11-22/REPORT.md from branch codex/studio-review-2026-11-22. Compare the review branch to your exact main before applying anything. Preserve all newer compatible work. Do not merge or deploy until every acceptance gate below is evidenced.

Integrate the bounded, tested changes from branch codex/studio-review-2026-11-22 (or reapply their exact logical changes if main moved). Use the audit/rebuilt content trees recorded in REPORT.md to verify the source and packaged-page states:
- unread scene-caption FIFO;
- PURIFY/PURIFIED wording and localized ARIA in five languages;
- explicit infection authority separating infected status from Boss class;
- atomic/idempotent quest hand-in and Purifier forge with migration repair;
- coordinate-sensitive broken-tile cache signatures;
- truthful Chromium/executable/AF_UNIX audit preflight;
- complete AAC tier/index for all 159 OGG cues;
- complete dynamic preload families for seven agents and every MIREJAW state;
- Kingdom Two ring stays locked until MIREJAW (which already implies CARRIER);
- Bilge ferry opens through centralized overlay ownership;
- Alpha covenant bow persists once per save;
- rebuilt standalone pages.

Do not regenerate completed assets. Preserve the hero, all existing agents, Alpha, wolves, gate climb/hop set, MIREJAW base model and good strips, NULLFANG first-stage identity and new 30-cell rear/swats/slam strip, lion sound bank, and purification film. The current purification film has a correct picture fade and audio fade; do not replace it to fix a hard cut that is no longer present.

Then implement the following in priority order as one coherent campaign/state migration, not isolated text edits:

P1 — make Chapter One follow the owner's canon:
1. Canonical sequence is GRAVEHORN -> Ratchet forges Purifier -> NULLFANG is the first corrupted Sage/guardian and is purified -> optional clean territorial Wolf King Alpha covenant -> Alpha reveals the infected pack-controlling Eye agent.
2. Remove the current forge -> Eye agent -> CHIME -> NULLFANG authority from runtime, objectives, gates, dialogue, panels, story sheet, machine JSON and tests.
3. Alpha must not be offered before NULLFANG, must never be called infected/corrupted/purifiable, and must resolve as a territorial covenant. Its friendly pack reward and controlling-agent clue must be exactly once and save-safe.
4. Resolve Volt Pack authority: runtime currently gifts it on Ratchet wake while canon/sheet/machine JSON still say 12-scrap purchase. Choose the owner-approved gift flow, update every authority, and migrate clean and legacy saves without duplicates.
5. Pin one authoritative story/manhwa edition. Add the already playable Bilge/Silt Mire/MIREJAW/three-seal/UNDERTOW sequence to the authoritative script and parity manifest before creating more panels. Resolve Prism Prowler: if it is the Conduits Sage it must be infected and purified; do not call a clean being purified.
6. Bounded art correction only: assets/manhua/ch1/game/r_marble.webp currently shows a complete sword/hilt before forging. Repaint only that hovering shape into unmistakable raw rounded material or a clearly framed schematic future-plan inset. Preserve hero, deposit, composition and style. Blind reviewers must read “material to bring Ratchet; no weapon yet.”

P1 — durability and world correctness:
7. Make Alpha and MIREJAW boss rewards atomic. A crash/reload must never leave the boss permanently gone while the Pack arm or sigil2 is missing. Publish the whole branch once and add migration repairs for partial legacy/current states.
8. Make Ratchet/Servo restoration atomic: cell consumption, awake flag, quest/gift and spare cell settle once; VFX/dialogue happen only after persistence succeeds; migrate partial saves.
9. Fix vertical collision tunnelling by sweeping every crossed tile row from previous feet to final feet for player, normal enemy and long boss bodies. Preserve one-way and thruPlat behavior. Prove identical first contact at 30/60/120 Hz plus a 1/30 catch-up step.

P1 — boss art/combat/VFX, preserving completed work:
10. NULLFANG: keep the new rear strip. Add measured normalized eye anchors for all 30 cells so purple glow/trail never disappears. Add only the minimum distinct phase-two damaged/vented body states: idle/prowl, primary attack, leap/landing and hurt/recover. No recolor-only phase and no replacement of stage one.
11. MIREJAW: explicitly decide in story authority whether it is infected wildlife or clean territorial machinery before applying VFX. If infected, explain why it is defeated rather than purified and anchor every mj* strip; if clean, remove infection-purple authority and use authored non-virus optics.
12. Replace only MIREJAW's false death-roll take. It must rotate longitudinally around the snout-to-tail axis, loop/release without a snap, keep the jaw hold readable and align damage beats to visible quarter-turns.
13. First attempt a code-only tail-slam mapping: warning must use visible tail lift and active must descend into contact; sound, shake, wave and damage must land within one frame of contact. If reverse/remapping does not read naturally at gameplay size, generate only the tail-slam replacement.
14. Fix MIREJAW real-swing geometry: use pose-aware hurt regions matching the roughly 405x190 rendered body; only the local-space belly weak region takes full leap damage, while head/back remain armored. Tests must swing normally rather than call dealDmg directly.
15. Drive MIREJAW pose animation from simulation time and prove warning, bite, roll, wave, phase and landing behavior at 30/60/120 Hz plus a 1/30 spike and pause.
16. Keep Alpha's authored yield strip. If art is added, add only a small dedicated wolfBow strip readable near 50 px; do not regenerate the pack.

P2 after the P1 state graph is stable:
- give remaining full-screen overlays one priority/coalescing ownership API;
- make ferry text follow shared letter-by-letter reveal and semantic focus rules;
- add localized semantic descriptions for in-game canvas panels;
- add persisted 100/125/150/200% typography scaling with English/Arabic/CJK desktop/phone captures;
- make later grotto families kingdom-specific in verb, evidence, payoff, transformation and callback instead of repeating terminal/bat/scrap/agent grammar.

Required acceptance evidence:
- Run every no-browser contract from the report, npm run build, npm run app:pack, tails, AAC check and the full studio registry.
- Campaign/story tests must reject the obsolete forge -> agent -> CHIME -> NULLFANG order rather than certify it.
- Clean-save uninterrupted ordinary-input Chapter One on desktop twice: Alpha skipped and Alpha completed. Continue/reload at every milestone. Do not seed flags, teleport rooms, set boss HP or directly mutate state.
- Uninterrupted Kingdom Two route must prove CARRIER -> Bilge/ferry -> MIREJAW -> UNDERTOW; CARRIER alone cannot enter the B6 ring.
- Record full final-hit -> hold PURIFY -> gather/slash -> fade -> film -> living golden friendly guardian return, including cancel/retry, skip-hold, reload and blocked-video fallback. Music/effects must crossfade without a cut.
- Record cold-cache first NULLFANG rear and first MIREJAW leap/roll/bellow/tail. No idle fallback or long frame.
- VFX captures: infected common red; infected guardian/agent purple; clean Alpha/GRAVEHORN/PRISM/instruments zero infection smoke; every NULLFANG rear cell anchored; trail fully expires by 1.875 s; room/teleport/cure clears; reduced motion keeps glow but emits no smoke; MIREJAW follows its explicit ruling.
- Boss reward, quest settlement and NPC restoration failpoint/page-reload matrices must prove either complete exactly-once settlement or no settlement, never partial state.
- Physical phone/touch/controller/audio/haptic and screen-reader/RTL/CJK/200% text checks must be reported separately from staged browser tests.

Be honest in the final report. Distinguish source/headless contracts, staged browser harnesses, uninterrupted ordinary-input playthroughs and physical-device/perceptual checks. Report blockers as blocked, not passed. Push a new integration branch and open a review request; do not merge main or deploy production without owner approval.
```
