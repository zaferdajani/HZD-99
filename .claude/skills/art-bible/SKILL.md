---
name: art-bible
description: The binding rules for every character in CLAWBYTE/NOSTOS — which of the four classes it is, what its 3D requirements are, how its art is generated, and how compliance is measured rather than claimed. Load this before touching any character's art, adding any character, changing any boss pose or state, or generating anything through Higgsfield. Also load it when the Higgsfield connector appears to be unavailable.
---

# The art bible, and how to not have to be checked

Read `ART_BIBLE.md` at the repo root. It is the document; this is the operating
procedure. The short version:

- **Every character is one of four classes** (§1) and the class decides
  everything. Choosing it is the first and most expensive decision.
- **The rules that can be measured are measured.** `tests/artbible.cjs` runs in
  `node tests/run.cjs`. If it is green, the bible was followed.
- **The user should never have to open a contact sheet to find out whether you
  did the work.** That is the entire point. If you find yourself about to write
  "the leap now has a real motion" in a summary, the sentence is only allowed
  if `artbible` is green — and if the property you are claiming is not one it
  measures, add the measurement.

---

## Before generating anything

**You do not have the authority to make art or music yourself.** Art and music
come from Higgsfield — always. Not procedurally, not by hand, not as a
placeholder, not "for now". Writing the prompt, keying the plate, wiring it and
measuring it is your job; making the pixels and the notes is not.

**When it looks disconnected, assume you are wrong.** That has been true every
time so far. The failure is never the connector — it is the reasoning that
concludes "it is down, so I will do this another way", which is what produced
line-art mini-bosses in a 3D game. Investigate, retry, tell the owner, wait.
Never substitute. If it is genuinely unreachable, the correct output is a report
and an unfinished task.

If it looks unavailable, follow this and nothing else:

1. `ToolSearch("select:mcp__higgsfield__generate_image_batch")`. Schema back →
   connected. Go.
2. Otherwise `ListConnectors(["higgsfield"])`. **Read `connected`, not
   `enabledInChat`.**
3. `enabledInChat: false` **does not mean the user switched it off.** It reports
   whether *this session* has the tools bound, and a session can start before
   its MCP servers attach. In the observed case the tools appeared mid-turn, and
   the tell was that a *different* server (Supermetrics) was re-registered from
   a UUID to a readable name in the same notice — a user toggling one connector
   cannot rename another.
4. So: do the non-art part of the task, then retry step 1.
5. **Only if `connected` is false** may you say it is the user's to fix — once,
   describing what you observed and what it does and does not prove.

**Never tell the user to go and flip a switch because a field read `false`.**
That happened, it was wrong, and it cost a session.

---

## The workflow for any character work

1. **Classify** (§1). If it needs a pose that is a continuous function of game
   state, it is a parts rig, not an atlas row.
2. **Generate** the plates through Higgsfield with the §3.2 brief. Separate
   SHAPE from STYLE explicitly, name the palette in words, state the negatives.
3. **Archive in the same commit** (§7). `assets/source/<subject>/`, crushed to
   1024/q90 with `tools/img-crush.cjs`, indexed in `assets/source/README.md`.
   *If it is not in that directory, it did not happen.*
4. **Wire it**, and check it is actually reachable. Declared-and-never-drawn is
   a test failure now, because it shipped once and was true for a year.
5. **Photograph it.** `tools/leapshot.cjs <out> [scale] [labelFilter]` — use the
   filter and look at the wind-up LARGE. A four-beat tell reviewed at a tenth of
   a sheet is how its ground arcs shipped under the animal's belly. Commit the
   sheet to `assets/source/_sheets/`.
6. **Measure.** `node tests/run.cjs artbible daze`. Then the full suite.

---

## The four failures this exists to prevent

Each is now arithmetic. Each was prose first, and prose did not stop it.

| The failure | The rule | Measured by |
|---|---|---|
| A whole leap drawn as one standing picture at six scales | §3.3 — states must differ in SILHOUETTE, IoU ≤ 0.86 | `artbible` |
| A wind-up the same colour as the idle | §3.5 — the tell RAISES the amber above that guardian's own rest, ≥ +8 points | `artbible` |
| A crouch translate the limb fold did not pay for | §3.4 — feet within ±10 px of the floor | `artbible` |
| Art generated, archived, declared, never wired | §7 / §2 | `artbible` |
| A guardian that only ever loses HP | §3.8 — the hit-group break | `daze` |

---

## Things that are true and easy to get wrong

- **Angles must commit.** Limbs are short against a body mass; a quarter radian
  of hip changes no silhouette at all. If the sheet comes back "merely tilted",
  the numbers are about a third of what they need to be.
- **Solve limb chains for two constraints**, not one: the vertical reach the
  pose needs AND zero horizontal drift of the contact point. Only the first and
  the paw lands forty pixels out in front.
- **`c.rotate` is clockwise and the guardians face LEFT**, so positive pitch
  drops the nose. The comment in `BEAST_LEAP` claims otherwise; its numbers were
  tuned empirically against a sheet and are right, the sentence is not.
- **The surge starts at frame one.** `pow(k, ~0.6)`, never `k·k·(3−2k)` — a
  smoothstep throws away the third of the tell where the player can still act.
- **Additive light has no edge**, and claws, blades and teeth are nothing but
  edge. Draw those `source-over` with a dark base and a hot tip.
- **A trail walks the limb's real forward-kinematic path**, sampled backwards
  along the same curve. Four lanes for a hand, one for a blade.
- **`G.artProbe`** suppresses ground-anchored decoration so the harness can
  measure feet rather than the shockwave under them. Any new ground FX that
  draws below the foot line must respect it, or it will be measured as anatomy.
