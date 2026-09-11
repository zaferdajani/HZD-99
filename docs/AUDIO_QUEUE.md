# THE AUDIO GENERATION QUEUE

Briefs that are **written and ready to fire** but whose cues do not exist yet.
The AUDIO session's counterpart to `docs/ART_QUEUE.md`, same shape, same
reason: the expensive part of a cue is deciding exactly what it must DO, and
that can be written down before a Higgsfield audio connector is even bound.

**Read the `composer` skill before writing or firing anything here.** It
covers what a cue must do for the moment it serves, how to brief the model so
it comes back doing that, how to measure the result instead of guessing, and
how to cut it into the game so it loops, ducks and fades correctly.

**Rules that apply to every entry here:**

- State the cue's **function** first — what the player should feel, in the
  verbs of the scene — not a genre or a mood word. "Epic" briefs nothing.
- Name the **technical contract**: loop point or one-shot, target length,
  what it plays under (must duck for dialogue? survive a hit-stop?), and how
  it ends (fades on cut, or has a real musical stop).
- The owner reviews every cue before it is cut and committed — credits and
  refusals are his, same as art.
- After it comes back: cut it with the project's audio tooling, archive the
  source, wire it into `js/audio.js`'s manifest (`js/media.js` for the asset
  entry), and run `node tests/run.cjs` — cuepitch/voxmeas and any cue-specific
  harness must stay green.
- **Never** touch game logic beyond the manifest wiring. Combat balance, UI
  behavior and state machines belong to the code session.

---

*(No briefs queued yet — this ledger is new as of 2026-09-11, opened when
the fleet split ART/AUDIO/VIDEO into separate owner-opened sessions. The
project manager (code session) queues a brief here whenever a decomposed
request needs one; the AUDIO session fires top to bottom, same as ART_QUEUE.)*
