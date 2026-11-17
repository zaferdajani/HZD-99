# One branch, the session fleet, kingdoms as the unit

Moved from `CLAUDE.md` on 2026-11-17, unedited. **`docs/DEVELOPMENT_AUTHORITY.md`
(2026-09-11) supersedes whatever here conflicts with it**: this Project thread is
the sole development and publishing thread, and other sessions are not spawned.
What still binds every session is the branch protocol, which `CLAUDE.md` keeps
in short: one integration branch, fetch before work, never force, built pages
are never hand-merged, `docs/ART_QUEUE.md` is the ledger of what is fired.

## ONE BRANCH (owner's standing order, 2026-08-15)

**Every session working on this game — code sessions, art sessions, all of
them — commits to the SAME branch: `claude/clawbyte-repo-migration-byhyl8`.
No forks. No side branches. The two sessions are one.**

The last side branch cost a full merge with conflicts in both built pages;
the owner's ruling ends the pattern. The protocol that replaces it:

1. **Before starting any work:** `git pull --rebase origin
   claude/clawbyte-repo-migration-byhyl8`. Always. A session that skips the
   pull is editing a game that no longer exists.
2. **After every commit:** push immediately — `git push origin
   claude/clawbyte-repo-migration-byhyl8`, then mirror the same commit to
   `main` and `odyssey` (`git push origin <branch>:main <branch>:odyssey`).
   Small frequent pushes; the other session may be minutes behind you.
3. **If the push is rejected** (the other session pushed first): pull
   --rebase, re-run `node build.cjs && node tests/run.cjs`, push again.
   Never force-push; never resolve by branching.
4. **Built pages are never hand-merged.** On any conflict in `index.html` /
   `odyssey.html`: take either side, run `node build.cjs`, commit what it
   emits. The sources are the truth; the pages are output.
5. `docs/ART_QUEUE.md` stays the coordination ledger — what is fired, what
   is wired, what is next — so the sessions never fire the same brief twice.

The retired branch `claude/art-queue-section-1-fire-yqlyc0` is fully merged
and must never receive another commit.

### THE SESSION FLEET (owner's protocol, 2026-08-16; roles formalized 2026-09-11)

The owner opens a session per JOB, when asked, and each session does only
its job — all on the ONE branch above. The owner's words founding this:
*"we need to divide into a company like structure... whatever instruction
I give you here, you deliver it for the appropriate session and appropriate
hierarchy... as filters to give orders to the appropriate session."*

- **THE PROJECT MANAGER — the CODE session** (this protocol's reader,
  usually). Every instruction the owner gives arrives here first and this
  session decides who does it. A request that touches more than one domain
  (his example: "improve the fight scene" is art AND audio AND hero/enemy
  logic) is DECOMPOSED, not forwarded whole — a brief queued for ART, a
  brief queued for AUDIO, a brief queued for VIDEO if the moment needs one,
  and the logic/wiring/hitbox/state-machine work done here, directly, in
  code. It is also THE INTEGRATOR: pulls frequently, merges what every
  other session pushes, verifies with the full suite, ships, and reports.
  A job is not done until the integrator has pulled it, tested it, and
  confirmed it live — and a decomposed request is not done until every
  branch of it has landed, not just the code branch.
- **The ART session**: holds the Higgsfield image/3D binding. Fires THE
  FIRING LIST in docs/ART_QUEUE.md top to bottom, WITH THE OWNER REVIEWING
  each result before it is keyed and committed — the owner refuses art he
  does not like, and credits are his. It never edits game logic beyond
  wiring notes.
- **The AUDIO session**: holds the Higgsfield audio binding (music, SFX,
  voice). Fires docs/AUDIO_QUEUE.md the same way ART fires its list — owner
  reviewing each cue before it is cut and committed. Read the `composer`
  skill before scoring anything. Never touches game logic beyond wiring a
  cue into `js/audio.js`'s manifest.
- **The VIDEO session**: holds the Higgsfield video binding (cinematics,
  filmed motion strips, cutscenes). Fires docs/VIDEO_QUEUE.md the same way.
  Read the `manga-direction` skill before staging a cinematic. Never touches
  game logic beyond wiring a clip into the manifest.
- **The TERRAIN session**: the one worker role that is NOT Higgsfield-bound
  and NOT owner-opened — the code session spawns and commands it directly,
  same as a kingdom session. It implements level geometry, elevation,
  platform/collision shaping and room-layout skeletons (the NO RIGHT ANGLES
  domain below); it ASKS the ART session for whatever plate a structure
  needs (queuing the brief in ART_QUEUE like anyone else) but never
  generates or fires art itself, and it IMPLEMENTS whatever the code
  session or a kingdom session asks of it rather than choosing its own
  work. A kingdom session that needs a room's structural skeleton built or
  fixed delegates that piece to TERRAIN and keeps the enemies/NPC/story for
  itself.
- **The STORY session** (owner-ordered, 2026-09-19): holds a Higgsfield binding
  and draws the coloured manhua of the game from `docs/STORY_SCRIPT.md`, to the
  letter, one kingdom per chapter, owner reviewing every page. Its protocol is
  `docs/MANHUA_SESSION.md`; its ledger is `docs/MANHUA.md`; its link rule is
  https://zaferdajani.github.io/HZD-99/manhua/ at the end of every report. The
  script it draws from is the code session's and is revised with the game.
- Any further specialist session follows the same shape: one job, named at
  open, same branch, coordinated through its own ledger.

**Only ART, AUDIO and VIDEO are owner-opened**, because connector bindings
and approval of what they generate are his — the code session cannot
substitute for that (see ART IS HIGGSFIELD'S below) and never sits on the
work silently. Everything else (TERRAIN, kingdom sessions, any other pure
implementation role) the code session CAN and SHOULD spawn and command
directly (create_session / send_message) — the owner is not a relay for
those. When a needed owner-opened session does not exist yet, the correct
move is to ASK THE OWNER to open one and hand him its kickoff instruction.

### KINGDOMS ARE THE UNIT (owner's protocol, 2026-08-16)

The fleet is organised BY KINGDOM, and the kingdom has a shape:

- **A kingdom runs from its opening to ITS SAGE and the sage's cave.**
  Kingdom 1 begins the moment the character wakes and ends at the first
  sage. The next kingdom begins fresh — new visual art, new enemies, new
  skills.
- **Every kingdom has at least one NPC with its own IDENTITY and its own
  PLACE** — a workshop, office or home (the booth/den pattern from A0 is
  the template). The NPC may stand outside it, but the place is theirs.
- **Every kingdom has at least one save point** (bench).
- **One session per kingdom** does everything in-world for it: rooms,
  enemies, the NPC and their place, the sage and its cave. All kingdom
  data moves to and is done in that session.
- ART, AUDIO and VIDEO (owner-opened, Higgsfield-bound, owner reviewing —
  see THE SESSION FLEET) each serve every kingdom through their own FIRING
  LIST; TERRAIN builds each kingdom's room skeletons on request; the code
  session (the project manager) holds gameplay, story and twists, and
  INTEGRATES everyone.
- The code session CAN and SHOULD spawn and command kingdom and TERRAIN
  sessions directly (create_session / send_message) — the owner is not a
  relay for those. Only ART, AUDIO and VIDEO are owner-opened, because
  connector bindings and generation approval are his.
