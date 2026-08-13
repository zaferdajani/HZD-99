# TELEMETRY SPEC

Combat design without data is taste, and taste alone does not scale across six
zones and twelve subjects. Everything in `COMBAT_BIBLE.md` is an argument; this
is how the arguments get checked against play.

**The build is already half-instrumented.** `Player.hurt(d, fromX, src)` takes
the attacking move's id as its third argument and counts it into `G.dmgLog`. The
comment there states the intent exactly: *"One parameter turns 'I think that
attack is unfair' into a ranked table."* What is missing is the attempt counter,
the timing, and the greed metric — and somewhere for it to go.

---

## 1. What is recorded

Written to `localStorage` under `cb_tel`, capped and rotated. Nothing is sent
anywhere. If a Supabase path exists later, the same records post unchanged.

### Per attempt (a boss room entered until death, win, or exit)

| Field | Meaning |
|---|---|
| `boss` | kind (`glitch`, `brood`, …) |
| `attempt` | 1-based, per boss, per save |
| `diff` | difficulty index |
| `outcome` | `win` / `death` / `left` |
| `ttk_ms` | entry to outcome |
| `phase_ms[]` | time in each phase |
| `killing_attack_id` | the move id from `hurt()`'s third argument |
| `hp_at_death` | cores remaining when the last blow landed |
| `dmg_by_id{}` | `{ 'nf.swipe': 3, 'nf.roar': 0, … }` |
| `retreat_ms[]` | per phase, time spent beyond the boss's longest reach |
| `greed{}` | per move id: `{ attempted, available }` — see §2 |
| `volts_in`, `volts_out` | the resource fight, for MOTHER-V above all |

### Per node / trial

| Field | Meaning |
|---|---|
| `node` | index |
| `attempts`, `correct` | |
| `input_device` | `key` / `pad` / `touch` — the Mind Node bug was device-specific and invisible in aggregate |

---

## 2. The greed metric

The one number this whole document exists for, and the primary success signal
for FURNACE CHOIR:

```
greed(move) = hits_attempted_in_its_opening / hits_safely_available_in_its_opening

hits_safely_available = floor(opening_ms / 380)      // her cycle: 150 active + 230 recovery
```

| Reading | Meaning | Action |
|---|---|---|
| ≈ 1.0 | the window is too safe — nobody is being tempted | shorten the recovery or move the punish position into the next attack's path |
| 1.5 – 2.5 | working as designed | leave it |
| ≈ 3.0 | players are being punished for correct reads | lengthen the recovery, or slow whatever punishes them |

---

## 3. The diagnostic rules

Implemented in `scripts/combat_telemetry_report.py`. These are the rules that
turn a table into a decision:

| Rule | Reading |
|---|---|
| High death share **and a flat curve across attempts** | **unreadable, not hard.** Fix the telegraph — lengthen it, or make the silhouette change larger. Do not touch damage. |
| High death share **and a falling curve** | working as designed. Leave it. |
| High retreat time in a phase | no viable engagement window in that phase. Add one. |
| Greed near 1.0 / near 3.0 | see §2 |
| One attack above ~40% of all damage taken | a telegraph problem, per the heuristic already written into `hurt()` |
| A device with a materially worse correct-rate on nodes | an input bug, not a difficulty one — this is exactly how the pad/stick defect would have surfaced |

---

## 4. What is NOT recorded

No identifiers, no timestamps beyond durations within a run, nothing that leaves
the machine. It is a debugging instrument for the person making the game, read
from the console or the report script, and it is capped so it cannot grow into
the save.

---

## 5. Status

**Specified, partially implemented.** `G.dmgLog` collects `dmg_by_id` today. The
attempt record, phase timing, retreat time and the greed counters are specified
here and not yet wired — ranked #3 in `COMBAT_BIBLE.md §7` because it is what
turns every judgement in these twelve files into something falsifiable.
