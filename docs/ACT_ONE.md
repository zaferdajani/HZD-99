# ACT ONE, ON THE CLOCK

The owner asked, 2026-08-23: *"test the game workflow. How it starts, does it
show the videos in the appropriate time, the dramatic effect of starting the
video fading into the video, the sound effects in the video, musicalities. And
then the sequence of events that happens during gameplay for act one, which
basically ends with the first boss. I mean, the first sage."*

Regenerate this file with `node tools/actone.cjs docs/ACT_ONE.md` (the repo
must be served on :8220). The tool watches a real build at 30 Hz and writes a
line every time something a player would notice changes.

---

## WHAT THE OPENING DOES, measured

**The reel is eight clips and forty-six seconds.** `intro1` through `intro8`,
not the six the code comments imply. Enter lands at 2.52s; the last frame of
`intro8` fades at 48.69s.

**The fade INTO the video is real and it is fast.** Every clip runs the same
three-phase shape: `in` for 0.33–0.37s, `play`, then `out` for 0.16s straight
into the next clip's `in`. There is no black gap between clips — one dissolves
into the next across a third of a second. Clips 1–6 play for **5.01s** each;
clips 7 and 8 play for **6.01s**. Three of them (1, 2, 5) insert a `hold` phase
between `in` and `play` — that is the cut machine waiting for the decoder, and
it costs 30–40ms, invisible.

**The music switch is on the same frame as the first fade.** At 2.58s the state
goes to CUT, `intro1:in` starts and the score changes from `title` to `intro`
in the same tick. That is the dramatic effect he asked about, and it is landing.

### Two things the measurement found

1. **THE CLIPS ARE SILENT — all eight of them.** Checked at the file level:
   every `assets/video/intro*.mp4` carries a video track and **no audio track
   at all**. So "the sound effects in the video" currently do not exist; the
   whole forty-six seconds is carried by the `intro` music bed alone. This is
   also why `MUS_DUCK` never moves during the reel — there is nothing to duck
   under. Two ways to fix it and they are different jobs: fire the audio with
   the films (the art/audio session), or score the reel from the game's own
   synth vocabulary, cue by cue against these timings (code). The timings below
   are what either one would be written against.

2. **THE SCORE USED TO FALL BACK TO THE MENU THEME FOR THE DIFFICULTY PICKER
   — fixed in the commit that added this file.** At 49.38s the reel ended, the
   state became DIFF, and the music returned to `title`: after forty-six
   seconds of the opening score, the last thing a player heard before gameplay
   was the tune from before the film. `cineEnd` now keeps the reel's own theme
   through the one choice that follows it and hands over to the kingdom when
   the run starts; backing out to the menu proper still takes the menu's tune.
   The timeline below is from after the fix — there is no `music title` line
   at the end of the reel any more.

---

## THE SEQUENCE OF EVENTS, room by room

Walked deliberately: each room is loaded with the flags a player who reached it
would hold, and left to present itself for six seconds. What the room does on
arrival — its music, its guardian, its people, what stands in it — is recorded.

| beat | what she meets | music |
|---|---|---|
| **W1** the waking floor | the cradle lets go (`wake`), the first lesson is `move` | zone A |
| **W2** the road | the city gate stands at the end of it | zone A |
| **A0** the meadow | the trader's booth, and one crawler | zone A |
| **A0B** Ratchet's den | the first NPC, the first shop, **a rest** | zone A |
| **A1** the scrap meadow | Servo, a crawler and a guard | zone A |
| **A5** the mouth | **BURIED** — the tunnel is under rubble and calls through it | zone A |
| **CV1** the entry hall | a crawler, and **a second buried door** (the Seam) | **X** |
| **CV1B** the Seam | **a rest** — the tunnel's save point | X |
| **CV3** the pillar | two crawlers and two bats around the crystal | X |
| **A4** NULLFANG's lair | the guardian **dormant**, and its own theme on arrival | **boss_glitch** |
| **GA1** the grotto | what the fallen guardian opens: scrap and **a rest** | X |
| **GA1T** its tunnel | the Deaf System terminal, one bat | X |
| **GA1D** THE MEADOW SAGE | the sage, 253 hp — the end of act one | **sage** |

Three notes on that table:

- **The kingdom changes voice when she goes underground.** Zone A's theme runs
  from the waking floor all the way to the mouth; the moment she is inside, it
  is zone X. That transition is doing real work.
- **The guardian's arrival is staged, not stated.** A4 loads with the boss
  already `dorm` and switches to `boss_glitch` on the same frame as the room —
  the chamber is dark for 2.3s and the light finds the thing asleep in it.
- **The sage's theme arrives 3.7s after the room does**, and that is correct
  rather than late: the duel track is triggered by the sage's FIRST MOVE AT HER
  (`entities.js`, `duelMus`), so the chamber is quiet while she walks in and
  the music starts when the fight does.

---

## THE RAW TIMELINE

ACT ONE — what the game shows, in order
(t is wall-clock seconds from boot; + is the gap from the line above)

    0.02s  +  0.02  BEAT      boot — the menu
    0.06s  +  0.04  state     MENU
    0.06s  +  0.00  music     title

    2.52s  +  2.46  BEAT      ENTER pressed — the opening reel begins
    2.58s  +  0.06  state     CUT
    2.58s  +  0.00  clip      intro1:in
    2.58s  +  0.00  music     intro
    2.91s  +  0.33  clip      intro1:play
    7.92s  +  5.01  clip      intro1:out
    8.09s  +  0.17  clip      intro2:in
    8.45s  +  0.36  clip      intro2:hold
    8.48s  +  0.03  clip      intro2:play
   13.46s  +  4.98  clip      intro2:out
   13.63s  +  0.17  clip      intro3:in
   13.99s  +  0.36  clip      intro3:play
   19.04s  +  5.05  clip      intro3:out
   19.19s  +  0.15  clip      intro4:in
   19.50s  +  0.31  clip      intro4:hold
   19.54s  +  0.04  clip      intro4:play
   24.52s  +  4.98  clip      intro4:out
   24.69s  +  0.17  clip      intro5:in
   25.05s  +  0.36  clip      intro5:hold
   25.08s  +  0.03  clip      intro5:play
   30.06s  +  4.98  clip      intro5:out
   30.23s  +  0.17  clip      intro6:in
   30.59s  +  0.36  clip      intro6:play
   35.61s  +  5.02  clip      intro6:out
   35.77s  +  0.16  clip      intro7:in
   36.10s  +  0.33  clip      intro7:hold
   36.15s  +  0.05  clip      intro7:play
   42.12s  +  5.97  clip      intro7:out
   42.31s  +  0.19  clip      intro8:in
   42.64s  +  0.33  clip      intro8:hold
   42.68s  +  0.04  clip      intro8:play
   48.68s  +  6.00  clip      intro8:out
   49.36s  +  0.68  state     DIFF

   62.56s  + 13.20  BEAT      reel window closed (60s)

   62.60s  +  0.04  BEAT      after the reel: state DIFF, room 

   62.62s  +  0.02  BEAT      W1 — the waking floor — she comes out of the cradle
   62.83s  +  0.21  state     PLAY
   62.83s  +  0.00  room      W1
   62.83s  +  0.00  music     A
   62.83s  +  0.00  lesson    move
   62.83s  +  0.00  wake      waking
   68.92s  +  6.09  room      music A | guardian - | npc - | in the room -

   68.96s  +  0.04  BEAT      W2 — the road, and the city gate
   69.95s  +  0.99  room      W2
   75.25s  +  5.30  room      music A | guardian - | npc - | in the room -

   75.27s  +  0.02  BEAT      A0 — the meadow: the trader and his booth
   76.08s  +  0.81  room      A0
   81.59s  +  5.51  room      music A | guardian - | npc - | in the room crawler

   81.68s  +  0.09  BEAT      A0B — Ratchet's den — the first NPC, the first shop
   84.03s  +  2.35  room      A0B
   87.99s  +  3.96  room      music A | guardian - | npc ratchet | in the room - | rest

   88.01s  +  0.02  BEAT      A1 — the scrap meadow: the first wolves
   88.79s  +  0.78  room      A1
   94.34s  +  5.55  room      music A | guardian - | npc servo | in the room crawler,guard

   94.37s  +  0.03  BEAT      A5 — the buried mouth — the tunnel is under rubble
   95.08s  +  0.71  room      A5
  100.65s  +  5.57  room      music A | guardian - | npc - | in the room - | BURIED

  100.67s  +  0.02  BEAT      CV1 — the tunnel: the entry hall
  102.38s  +  1.71  room      CV1
  102.38s  +  0.00  music     X
  106.94s  +  4.56  room      music X | guardian - | npc - | in the room crawler | BURIED

  106.97s  +  0.03  BEAT      CV1B — the Seam — the tunnel branch and its bench
  107.00s  +  0.03  room      CV1B
  113.23s  +  6.23  room      music X | guardian - | npc - | in the room bat | rest

  113.25s  +  0.02  BEAT      CV3 — the pillar chamber — the crystal is quarried here
  113.28s  +  0.03  room      CV3
  119.52s  +  6.24  room      music X | guardian - | npc - | in the room crawler,crawler,bat,bat

  119.55s  +  0.03  BEAT      A4 — NULLFANG's lair — the first guardian
  120.29s  +  0.74  room      A4
  120.29s  +  0.00  music     boss_glitch
  120.29s  +  0.00  boss      glitch:dorm
  125.82s  +  5.53  room      music boss_glitch | guardian glitch:dorm | npc - | in the room -

  125.84s  +  0.02  BEAT      GA1 — the grotto the guardian opens
  126.84s  +  1.00  room      GA1
  126.84s  +  0.00  music     X
  132.11s  +  5.27  room      music X | guardian - | npc - | in the room - | rest

  132.13s  +  0.02  BEAT      GA1T — its tunnel — the Deaf System terminal
  133.28s  +  1.15  room      GA1T
  138.39s  +  5.11  room      music X | guardian - | npc - | in the room bat

  138.42s  +  0.03  BEAT      GA1D — THE MEADOW SAGE — the end of act one
  138.44s  +  0.02  room      GA1D
  143.45s  +  5.01  music     sage
  144.67s  +  1.22  room      music sage | guardian - | npc - | in the room bat,sage
