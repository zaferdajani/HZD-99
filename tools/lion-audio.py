"""Cut original Higgsfield creature performances to gameplay event lengths."""
import json
import subprocess
from pathlib import Path
import numpy as np

root = Path('assets/source/beast/studio-2026-10-04')
out = Path('assets/sfx/nullfang'); out.mkdir(exist_ok=True)
# Time ranges are measured from the delivered takes, not the prompt timeline.
cuts = {
    'coil': ('pounce', .8, 1.6, 1),
    'leap': ('pounce', 2.22, 2.95, 1.4),
    'land': ('pounce', 4.76, 5.46, 1),
    'step': ('pounce', 4.79, 5.06, 1.2),
    'swipe': ('rake', 2.78, 3.50, 2),
    'hurt': ('hurt', 1.76, 2.28, 1.5),
    'roar': ('roar', 2.75, 4.45, 2),
    'awake': ('roar', 1.5, 2.65, 1.2),
    'breath': ('roar', 4.8, 5.7, 1),
    'arrive': ('pounce', 4.76, 5.9, 1),
}
report = {}
for cue, (take, start, end, tempo) in cuts.items():
    duration = (end - start) / tempo
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-ss', str(start),
        '-t', str(end - start), '-i', str(root / (take + '.mp4')),
        '-vn', '-af', f'atempo={tempo},highpass=f=45', '-ac', '1', '-ar', '32000', '-f', 'f32le', '-'])
    a = np.frombuffer(raw, dtype='<f4').copy()
    peak = float(np.max(np.abs(a)))
    if peak < .01:
        raise ValueError(f'{cue}: no usable signal')
    a *= .8 / peak
    attack = min(len(a), 160)
    release = min(len(a) - attack, 2400)
    a[:attack] *= np.linspace(0, 1, attack)
    a[-release:] *= np.linspace(1, 0, release) ** 2
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', '32000',
        '-ac', '1', '-i', '-', '-c:a', 'libvorbis', '-q:a', '5', str(out / (cue + '.ogg'))],
        input=a.tobytes(), check=True)
    report[cue] = dict(source=str(root / (take + '.mp4')), start=start, end=end,
        tempo=tempo, duration=len(a)/32000, peak=float(np.max(np.abs(a))),
        rms=float(np.sqrt(np.mean(a*a))))
(root / 'audio-cuts.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
