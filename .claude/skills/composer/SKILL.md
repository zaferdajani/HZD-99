---
name: composer
description: Score a moment in the game — an opening, a boss, a zone, a menu, a death, a victory. Use whenever music is being written, replaced, or judged ("the music doesn't match", "make it epic", "new theme for X", "the track is boring"), and before prompting any text-to-music model. Covers what a cue must DO, how to brief the model so it comes back with that, how to measure the result instead of guessing, and how to cut it into the game so it loops, ducks and fades correctly.
---

# Composer

Writing music for a game is not writing music. A cue is a piece of the game's
machinery: it arrives on a cut, it plays under sound the player must still hear,
it repeats for ten minutes without becoming furniture, and it ends on an event
nobody scheduled. Judge every decision against the moment it serves, never
against how the track sounds alone.

## 1. Brief the moment before you brief the model

Write these five lines down before touching a generator. If you cannot answer
them, you are about to commission atmosphere and call it a score.

1. **Function** — what the player should feel, in one sentence, in the verbs of
   the scene. *"A city being sung to sleep, and then the song turning into an
   order."* Not "dark sci-fi music".
2. **Arc and hit points** — where the music must change, in seconds, matched to
   what is on screen. A cue with no hit points is wallpaper.
3. **Length and exit** — how long the picture is, and whether the cue ends
   (a cinematic), loops forever (a zone), or gets cut off mid-phrase (a fight).
4. **What it must not mask** — the sounds gameplay depends on. Music that
   crowds those frequencies makes the game feel unresponsive, and nobody can
   say why.
5. **The one memorable thing** — a motif, an interval, an instrument. A cue with
   no hook is not remembered as a cue; it is remembered as noise.

## 2. Write the arc as a timeline, not an adjective

"Epic" is not a brief — it is a genre tag, and a model will answer it with
generic trailer percussion. Epic is a *shape*: something small and human, then
something enormous arriving, then the small thing surviving it. Specify the
shape in seconds:

```
0:00-0:12  one music-box motif, alone, almost sweet          (the world before)
0:12-0:30  a detuned drone slides under it; the motif bends  (something arrives)
0:30-0:52  low brass + industrial percussion climb, tempo up (the takeover)
0:52-0:58  one crushing hit, then near silence               (the fall)
0:58-1:15  the motif again, alone, one cello under it        (who is left)
```

That timeline is what you paste into the prompt, and it is also the checklist
you verify the render against.

**Arc rules that hold up:**
- Contrast makes size, not volume. A brass wall is only huge if something quiet
  preceded it. Cue that starts loud has nowhere to go.
- One idea per cue. Two hooks fight and neither is remembered.
- Land the change ON the picture change, not near it. A hit half a second late
  reads as an accident.
- End cinematics unresolved when the story is unresolved. A tidy cadence tells
  the player everything is fine.

## 3. Prompting a text-to-music model

Model on this stack: `sonilo_music` via `generate_audio` (`duration` in seconds,
required; preflight with `get_cost: true`). It is text-to-music — no reference
audio, no stems, no seed continuity between calls.

What it actually responds to, roughly in order of leverage:

- **Instrumentation, named specifically.** "Detuned celesta, con-sordino low
  brass, taiko and anvil, solo cello" beats "orchestral".
- **Tempo and meter in numbers.** "72 BPM, 4/4, accelerating to 100 by the last
  third."
- **Key and mode.** "D minor, Phrygian inflection on the brass" gives it a
  colour to hold; without one it drifts.
- **Production words.** "Close-miked, dry, tape saturation, wide low end, no
  vocals" — these steer the mix more reliably than emotional adjectives.
- **The timeline above,** written as literal timestamps in the prompt.
- **Negatives.** "No vocals, no choir oohs, no snare rolls, no risers, no
  fade-out at the end" — cut the trailer clichés you do not want by name.

What it ignores or gets wrong, so plan around it:
- Exact hit-point timing is approximate. Generate longer than you need and cut
  the hit to the picture yourself in ffmpeg.
- It will often fade the ending. If the cue must loop, say no fade-out — and
  fix it in the edit regardless.
- Lyrics and named artists do not work and are not appropriate. Describe the
  music.

Generate **two or three takes** with different instrumentation emphases and
choose. It costs a few credits and the difference between takes is larger than
the difference any prompt tweak will get you.

## 4. Measure the render — never ship on vibes

You cannot hear the file. That is not a reason to guess; it is a reason to
measure. Every one of these is a real defect that measurement catches:

```bash
FF=<ffmpeg>
# 1. LOUDNESS + DYNAMIC RANGE. Game music sits under everything else.
$FF -hide_banner -i cue.wav -af ebur128=peak=true -f null - 2>&1 | tail -20
#    want: integrated ≈ -18 to -16 LUFS for a bed, -14 for a title/cinematic;
#    true peak <= -1.0 dBTP; LRA >= 6 for a cue with a real arc (LRA ~2 means
#    the "build" is a lie — it is compressed flat and will feel small).

# 2. THE ARC IS REALLY THERE. Level per 5s window should climb then drop.
$FF -hide_banner -i cue.wav -af astats=metadata=1:reset=220500,ametadata=print:key=lavfi.astats.Overall.RMS_level \
    -f null - 2>&1 | grep RMS_level

# 3. DEAD AIR at the head or tail — a cue that starts 1.5s late reads as a bug.
$FF -hide_banner -i cue.wav -af silencedetect=n=-45dB:d=0.4 -f null - 2>&1 | grep silence

# 4. THE GAMEPLAY BAND. Sum energy 1-4 kHz: that is where hits, pickups and
#    voice live. If the cue owns that band, gameplay stops sounding responsive.
$FF -hide_banner -i cue.wav -af "bandpass=f=2500:width_type=o:w=1.6,astats" -f null - 2>&1 | grep -i "RMS level"
#    compare against the full-band RMS; the band should sit clearly below it.
```

If a measurement fails, fix it in the edit rather than re-rolling the whole
cue — EQ the mid out with `equalizer=f=2500:t=o:w=1.6:g=-4`, normalise with
`loudnorm=I=-17:TP=-1.0:LRA=9`, trim silence with `atrim`.

## 5. Cut it into the game

- **Loops must be seamless.** Do not trust a "loop" the model returns. Cut on a
  bar line and crossfade the seam: `acrossfade=d=2:c1=tri:c2=tri` between the
  tail and the head. Then verify by concatenating two copies and listening for
  a level discontinuity in the astats window straddling the seam.
- **Ship the format the engine streams.** Long music is streamed, never decoded
  into memory — a 2 MB ogg becomes ~60 MB of float PCM if you decode it. Match
  what the rest of `assets/music/` uses (`.m4a`/AAC 128k here) and let the
  manifest scan pick it up by basename.
- **Fade, never cut, between cues.** A hard music change on a room transition
  is the single most amateur-sounding thing an otherwise good game does.
- **Duck under dialogue and boss roars,** don't just play louder.
- **Respect autoplay policy.** No browser starts audio before a user gesture.
  Design the first screen so the gesture happens naturally and the score starts
  with it — and never present silence as if it were the intended experience.

## 6. Verify against the brief, not against your prompt

Last step, always: re-read the five lines from §1 and say, for each, what in the
measured render delivers it. "Epic: LRA 11 with RMS climbing 14 dB across the
middle third, so the build is real." If you cannot point at evidence for a line,
that line did not get scored — go back and fix it before shipping.
