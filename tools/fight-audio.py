"""THE FIGHT IS HEARD AS REAL ANIMALS AND REAL MATERIAL (owner, 2026-11-27).

"alpha wolf is a mix of sounds between the actual howling and the old geeky useless sounds of
hitting and jumping like Super Mario, which is not what I asked for. I asked for real sound effects
for wolves and attacks and fights."

Cuts the Alpha's and the pack's voices, her jump, landing, blade and clash, and the cats' hiss out
of CC0 field and foley recordings (Freesound), archived unchanged in assets/source/audio/fight/
with SOURCES.json. Every cue is one or more LAYERS of a recording — never an oscillator — high-
passed where the source carries wind or handling rumble, faded in 4 ms and out over its tail,
and normalised to -1 dBFS (the level each one is heard at is set where it is played: audio.js
FIGHT_VOICE / ALPHA_VOICE). Run from the repo root:

    python3 tools/fight-audio.py

then node tools/aactier.cjs (the AAC copies) and node build.cjs.
"""
import json
import subprocess
from pathlib import Path
import numpy as np

SRC = Path('assets/source/audio/fight')
SR = 44100

# cue -> (out file, [layer, ...]); a layer is (source file, start s, end s, gain, delay s, highpass Hz, rate)
CUTS = {
    # ---- the Alpha (replacing the generated takes of 2026-11-20, same names) ----
    'bark':  ('assets/sfx/alpha/bark.ogg',  [('dog_aggressive_bark_mrrap4food_619045.mp3', 3.55, 4.55, 1, 0, 90, 0.92)]),
    'growl': ('assets/sfx/alpha/growl.ogg', [('dog_aggressive_bark_mrrap4food_619045.mp3', 15.72, 16.78, 1, 0, 70, 0.94)]),
    'snap':  ('assets/sfx/alpha/snap.ogg',  [('dog_teeth_clatter_qubodup_841350.mp3', 0.60, 1.00, 1, 0, 120, 0.9),
                                             ('dog_snarl_attack_craigsmith_479633.mp3', 17.46, 17.92, 0.45, 0.02, 120, 1)]),
    'bite':  ('assets/sfx/alpha/bite.ogg',  [('dog_teeth_clatter_qubodup_841350.mp3', 1.94, 2.26, 1, 0, 120, 0.9),
                                             ('dog_snarl_attack_craigsmith_479633.mp3', 7.78, 8.55, 0.8, 0.03, 90, 1)]),
    'claw':  ('assets/sfx/alpha/claw.ogg',  [('swish_short_qvantor_877976.mp3', 0.0, 0.45, 1, 0, 150, 0.85),
                                             ('metal_plate_scratch_ridderick_707638.mp3', 0.38, 0.90, 0.75, 0.05, 150, 1)]),
    'rend':  ('assets/sfx/alpha/rend.ogg',  [('metal_plate_scratch_ridderick_707638.mp3', 0.34, 1.52, 1, 0, 120, 0.95),
                                             ('swish_short_qvantor_877976.mp3', 0.0, 0.45, 0.6, 0, 150, 0.8)]),
    'leap':  ('assets/sfx/alpha/leap.ogg',  [('dog_jumps_off_qubodup_827435.mp3', 0.66, 1.25, 1, 0, 90, 0.9),
                                             ('dog_snarl_attack_craigsmith_479633.mp3', 20.70, 21.20, 0.55, 0, 120, 1)]),
    'fury':  ('assets/sfx/alpha/fury.ogg',  [('angry_dog_cmdrobot_439535.mp3', 5.60, 6.96, 1, 0, 80, 0.9),
                                             ('dog_aggressive_bark_mrrap4food_619045.mp3', 18.32, 18.80, 0.8, 0.05, 90, 0.9)]),
    # ---- new: what the synth used to stand in for ----
    'quake': ('assets/sfx/alpha/quake.ogg', [('body_fall_heavy_dirt_leonelmail_504626.mp3', 0.36, 1.45, 1, 0, 40, 0.85)]),
    'step1': ('assets/sfx/alpha/step1.ogg', [('heavy_steps_gravel_ilmotografo_679108.mp3', 1.42, 1.78, 1, 0, 60, 0.85)]),
    'step2': ('assets/sfx/alpha/step2.ogg', [('heavy_steps_gravel_ilmotografo_679108.mp3', 2.60, 2.96, 1, 0, 60, 0.85)]),
    'yelp':  ('assets/sfx/alpha/yelp.ogg',  [('dog_yelping_unfa_160478.mp3', 3.06, 3.66, 1, 0, 320, 1)]),
    # ---- her: a jump is cloth and a push off rock, a landing is a footfall, a blade is a blade ----
    'jump':   ('assets/sfx/hz_jump.ogg',        [('cloth_rustle_brandondelehoy_494797.mp3', 0.0, 0.33, 1, 0, 150, 1),
                                                 ('boots_rock_jump_noxsound_558477.mp3', 0.42, 0.62, 0.5, 0, 120, 1.1)]),
    'land':   ('assets/sfx/hz_land.ogg',        [('boots_rock_jump_noxsound_558477.mp3', 1.96, 2.34, 1, 0, 90, 1.08)]),
    'swing1': ('assets/sfx/foley/swing1.ogg',   [('sword_swing_nomagician_840716.mp3', 0.06, 0.56, 1, 0, 200, 1)]),
    'swing2': ('assets/sfx/foley/swing2.ogg',   [('sword_swing_nomagician_840717.mp3', 0.04, 0.56, 1, 0, 200, 1)]),
    'swish':  ('assets/sfx/foley/swish.ogg',    [('swish_short_qvantor_877976.mp3', 0.0, 0.40, 1, 0, 200, 1)]),
    'clash1': ('assets/sfx/foley/clash1.ogg',   [('sword_clash_johnbuhr_326868.mp3', 0.0, 0.85, 1, 0, 150, 1)]),
    'clash2': ('assets/sfx/foley/clash2.ogg',   [('sword_clash_spycrah_471095.mp3', 0.94, 1.70, 1, 0, 150, 1)]),
    # ---- the cats (the same rule, swept) ----
    'hiss1': ('assets/sfx/cat/hiss1.ogg', [('cat_hissing_aunrea_485952.mp3', 0.0, 0.66, 1, 0, 200, 1)]),
    'hiss2': ('assets/sfx/cat/hiss2.ogg', [('cat_hisses_zabuhailo_146963.mp3', 0.14, 1.24, 1, 0, 200, 1)]),
}


def load(name, start, end, hp, rate):
    af = 'highpass=f=%d' % hp
    if rate != 1:
        af += ',asetrate=%d,aresample=%d' % (int(SR * rate), SR)
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-ss', str(start), '-t', str(end - start),
                                   '-i', str(SRC / name), '-vn', '-af', af, '-ac', '1', '-ar', str(SR),
                                   '-f', 'f32le', '-'])
    return np.frombuffer(raw, dtype='<f4').copy()


report = {}
for cue, (out, layers) in CUTS.items():
    parts = []
    for (name, start, end, gain, delay, hp, rate) in layers:
        a = load(name, start, end, hp, rate)
        if float(np.max(np.abs(a))) < 0.003:
            raise ValueError('%s: %s carries no signal at %.2f-%.2f' % (cue, name, start, end))
        a = a / float(np.max(np.abs(a))) * gain
        parts.append((int(delay * SR), a))
    n = max(d + len(a) for d, a in parts)
    mix = np.zeros(n, dtype=np.float32)
    for d, a in parts:
        mix[d:d + len(a)] += a
    mix *= 0.89 / float(np.max(np.abs(mix)))
    att = min(len(mix), int(0.004 * SR))
    rel = min(len(mix) - att, int(min(0.08, 0.25 * len(mix) / SR) * SR))
    mix[:att] *= np.linspace(0, 1, att)
    mix[-rel:] *= np.linspace(1, 0, rel) ** 2
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    '-c:a', 'libvorbis', '-q:a', '5', '-map_metadata', '-1', out], input=mix.tobytes(), check=True)
    W = int(0.1 * SR)
    loud = max(float(np.sqrt(np.mean(mix[i:i + W] ** 2))) for i in range(0, max(1, len(mix) - W), W // 2))
    report[cue] = dict(out=out, layers=[l[0] for l in layers], seconds=round(len(mix) / SR, 3), loudest_100ms_rms=round(loud, 3))
(SRC / 'cuts.json').write_text(json.dumps(report, indent=1) + '\n')
print(json.dumps(report, indent=1))
