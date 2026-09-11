# THE VIDEO GENERATION QUEUE

Briefs that are **written and ready to fire** but whose clips do not exist
yet. The VIDEO session's counterpart to `docs/ART_QUEUE.md`, same shape, same
reason: deciding exactly what a clip must show is the expensive part, and
that can be written down before a Higgsfield video connector is even bound.

**Read the `manga-direction` skill before staging a cinematic** — paneling,
escalation, impact frames, expression language and silhouette reads, all of
it built for a small, silent, low-information frame. **Read the `art-prompts`
skill's SHAPE-vs-STYLE rule** before briefing any generator, video included.

**Rules that apply to every entry here:**

- Say what the clip is FOR — a cutscene beat, a boss awakening, a filmed
  motion strip for `tools/vidstrip.cjs` to cut into gameplay frames — not
  just what it shows. A strip brief and a cinematic brief are cut differently.
- For a motion strip: name the exact beats wanted (anticipation / smear /
  contact / recovery, or whatever the move's own grammar is) and the target
  frame count, matching the shape `tools/vidstrip.cjs` already expects.
- For a cinematic: stage it panel-by-panel in the manga-direction grammar
  before generating a single frame — a vague brief gets a vague clip.
- The owner reviews every clip before it is cut and committed — credits and
  refusals are his, same as art.
- After it comes back: cut it with `tools/vidstrip.cjs` (or the cinematic
  equivalent), archive the source, wire it into the manifest, photograph it
  in play, and run `node tests/run.cjs` — `frames.cjs` and any move-specific
  harness must stay green.
- **Never** touch game logic beyond the manifest wiring. Combat balance, UI
  behavior and state machines belong to the code session.

---

*(No briefs queued yet — this ledger is new as of 2026-09-11, opened when
the fleet split ART/AUDIO/VIDEO into separate owner-opened sessions. The
project manager (code session) queues a brief here whenever a decomposed
request needs one; the VIDEO session fires top to bottom, same as ART_QUEUE.)*
