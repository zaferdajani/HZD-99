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

---

## V-WAKE-2. The Waking, in his new metal ✱ QUEUED 2026-11-15 (code session)

Ratchet was repainted as metal on 2026-11-15 (ART_QUEUE §2r-ii): polished copper
plates, oiled bronze joints, a brushed steel pack, verdigris in the seams, rust on
the belly and boots. The film below still shows the machine he was — a dull
grey-brown hulk — and it plays at the one moment the player is looking hardest at
him: the repair board powers him, the film runs six seconds of the grey Ratchet,
and it cuts to the copper one standing in the same chair. Nothing is broken; it is
a continuity cut the owner will see the first time he replays the opening.

- **For:** the same cutscene beat, `PURIFY_VID.revive`. Same six seconds, same
  five beats in the same order (the cell into the hatch · light up to the chest
  crystal · visor on amber · head lifts · hand opens toward her). Not a new scene.
- **What changes:** his materials only. Opening frame redrawn (Nano Banana Pro)
  with `hzd99-canon` and, as his reference, the repaint's anchor —
  `assets/source/ratchet/metal/talk_1_asfired.jpg` — plus the resting plate for
  the chair and the slump (`assets/source/ratchet/metal/resting_asfired.jpg`).
  Shape from the current film's first frame, finish from the anchor
  (art-prompts §2, two references, two stated jobs).
- **Negatives that already cost a take last time:** nothing in her paw but the
  cell — no blade, green or otherwise. She has no tail (the current film gave her
  one; do not carry it over). No sword on her back: this is before the forging.
- **Contract:** silent, 6 s, 16:9, the same cut points so the audio bed and the
  skip behave as they do; `mp4` (H.264) + `webm` + `light/` via
  `node tools/lightvid.cjs`. The owner reviews the take before it is cut in.
- **Until it lands the old film stays.** It is the owner's approved take, and a
  six-second colour mismatch is better than no waking.

## THE WAKING — Ratchet's cell goes home (FIRED + WIRED 2026-10-12)

Owner, 2026-10-12: *"there is no need now for the video that shows Ratchet
taking off its battery because we already introduced the comics. Instead ...
create a new video ... when it actually receives its battery and wake up."*

- `assets/video/ratchet_wake.mp4` / `.webm` / `light/` — 6 s, Kling 3.0 pro,
  silent, from a Nano Banana Pro opening frame drawn with `hzd99-canon` and
  `ratchet-canon` in the forging film's set and render style. She pushes the
  brass cell into the round hatch in his belly; the light runs up to his chest
  crystal; his visor comes on amber; his head lifts; his hand opens toward her.
- Wired as `PURIFY_VID.revive`: plays the moment the repair board powers him
  (`opRatchetRestored`, and the den wake's older path), then his words. In the
  film gallery as "The Waking". Replaces `memory.mp4`, which is retired.
- One take refused (a green blade appeared in her paw), one clean alternate
  kept in the provenance only. Jobs and reasons:
  `assets/source/manhua/ch1/game/ratchet-wake-2026-10-12.json`.

