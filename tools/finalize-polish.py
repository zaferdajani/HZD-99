"""One-time, idempotent polish corrections on the staging branch.
Original recordings remain recoverable in Git. This processes existing licensed
assets; it does not claim that new voice performances were generated.
"""
import array
import hashlib
import json
import pathlib
import subprocess
import sys
import wave

ROOT = pathlib.Path(__file__).resolve().parents[1]

def digest(data):
    return hashlib.sha256(data).hexdigest()

def apply_tests():
    spec = json.loads((ROOT / 'tools/release-edits/finalize-tests.json').read_text())
    changes = []
    for item in spec['files']:
        p = ROOT / item['path']
        assert p.resolve().is_relative_to(ROOT), 'Path outside repository'
        original = p.read_bytes()
        if digest(original) == item['after']:
            continue
        assert digest(original) == item['before'], 'Changed baseline: ' + item['path']
        lines = original.decode('utf-8').splitlines(keepends=True)
        for i, j, text in reversed(item['ops']):
            assert 0 <= i <= j <= len(lines)
            lines[i:j] = text.splitlines(keepends=True)
        result = ''.join(lines).encode('utf-8')
        assert digest(result) == item['after'], 'Result checksum mismatch: ' + item['path']
        changes.append((p, result))
    for p, result in changes:
        p.write_bytes(result)
    print('Applied', len(changes), 'verified test corrections')

def clean_audio():
    subprocess.run(['ffmpeg', '-version'], check=True, stdout=subprocess.DEVNULL)
    ledger_path = ROOT / 'docs/AUDIO_POLISH.json'
    ledger = json.loads(ledger_path.read_text()) if ledger_path.exists() else {}
    takes = [
        ('hzd_atk2', '8c374578054c3907e64c2d1ceae64496e4d2149f7dee65932f0745f742dd2c58', 'highpass=f=280:p=2'),
        ('hzd_yalla', 'ff92abd23c6e9770f26721988737cc4dc4d0ef4f06a4c542cca3bb9dab56f10a', 'rubberband=pitch=1.55,highpass=f=190:p=2'),
    ]
    for key, expected, filters in takes:
        p = ROOT / ('assets/sfx/vox/' + key + '.wav')
        current = digest(p.read_bytes())
        if key in ledger and current == ledger[key]['result_sha256']:
            continue
        assert current == expected, 'Changed voice source: ' + key
        with wave.open(str(p), 'rb') as src:
            sr = src.getframerate()
        raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(p), '-af', filters,
                                       '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'])
        pcm = array.array('f'); pcm.frombytes(raw)
        if sys.byteorder != 'little':
            pcm.byteswap()
        peak = max(abs(x) for x in pcm)
        assert peak > 0.001 and len(pcm) > sr / 10
        gain = 0.78 / peak
        head, tail = round(sr * .005), round(sr * .1)
        result = array.array('h')
        for i, sample in enumerate(pcm):
            envelope = min(1.0, i / max(1, head - 1))
            if i >= len(pcm) - tail:
                envelope *= ((len(pcm) - 1 - i) / max(1, tail - 1)) ** 2
            result.append(int(max(-1, min(1, sample * gain * envelope)) * 32767))
        if sys.byteorder != 'little':
            result.byteswap()
        with wave.open(str(p), 'wb') as dst:
            dst.setnchannels(1); dst.setsampwidth(2); dst.setframerate(sr)
            dst.writeframes(result.tobytes())
        ledger[key] = {'source_sha256': expected, 'result_sha256': digest(p.read_bytes()),
                       'filters': filters, 'peak_target': .78, 'head_fade_ms': 5,
                       'tail_fade_ms': 100, 'seconds': len(pcm) / sr,
                       'source': 'Existing project recording, filtered; not a newly generated performance'}
        print('Processed', key, ledger[key]['result_sha256'])
    ledger_path.write_text(json.dumps(ledger, indent=2) + '\n')
    credits = ROOT / 'assets/CREDITS.md'
    heading = '\n## Hero voice cleanup — 2026-09-11\n'
    if heading not in credits.read_text():
        with credits.open('a') as f:
            f.write(heading + '\nThe existing hzd_atk2 recording has low-frequency rumble removed; hzd_yalla is pitch-shifted with preserved duration. Both keep mono output, a 0.78 peak ceiling, and smooth attack/tail fades. No new source recording or license was introduced. Original and result SHA-256 values and exact filters are in docs/AUDIO_POLISH.json.\n')

if __name__ == '__main__':
    apply_tests()
    clean_audio()
