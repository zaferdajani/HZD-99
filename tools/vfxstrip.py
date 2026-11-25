#!/usr/bin/env python3
# Cut a generated EFFECT CLIP into a strip the game draws as LIGHT.
#
# Owner, 2026-11-24: "Why is the boss attk graphics so basic? Why not apply vfx ... and create a
# well made fight?" The bosses' attacks had been drawn in code out of circles and lines. These are
# generated effect clips (Higgsfield, on black), cut here, and drawn by js/bossvfx.js with the
# 'lighter' blend: black adds nothing, so the strip needs no matte at all, and there is no matte
# edge to show. That is also why it is cut differently from tools/vidstrip.cjs (a body, keyed) and
# tools/fxstrip.cjs (re-centred on the light per plate): an effect here keeps the clip's own
# framing across all its cells, so a pillar's foot stays on the floor and a burst stays centred.
#
#   python3 -I tools/vfxstrip.py <spec.json> <clipdir> <outdir> [name...]
#
# spec.json: { "<name>": { "src": "<clip>.mp4", "times": [s, ...] | "from": s, "to": s, "n": cells,
#                          "h": cell height px, "loop": bool, "crop": [x0, y0, x1, y1] (0-1, optional),
#                          "thr": the crop's brightness floor (a bolt shedding faint sparks over the whole
#                          frame is cropped to its flame, not to its sparks) } }
# A frame that is a white field (the generator's flash frame) is never sampled: it is listed out
# by choosing the times, and refused here if one slips through (mean > 150).
# The video's black is not black (16-24 in every channel, and graded): it is crushed to zero, or
# the strip would lay a grey rectangle over the room.
# Prints each strip's cells, cell size and the HOT POINT (the white core of the first full cell,
# as a fraction of the cell) - the point the game places on the thing that throws it.
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

BLACK = 26          # at and under this, the field
THR = 34            # brighter than this (after the crush) is the effect, for the crop


def frame(src, t):
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, 'f.png')
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', '%.3f' % t, '-i', src, '-frames:v', '1', p], check=True)
        return np.asarray(Image.open(p).convert('RGB')).astype(np.float32)


def crush(a):
    return np.clip((a - BLACK) * (255.0 / (255 - BLACK)), 0, 255)


def main():
    spec_p, clips, out = sys.argv[1:4]
    only = set(sys.argv[4:])
    spec = json.load(open(spec_p))
    os.makedirs(out, exist_ok=True)
    meta = {}
    for name, s in spec.items():
        if only and name not in only:
            continue
        times = s.get('times') or [s['from'] + (s['to'] - s['from']) * i / max(1, s['n'] - 1) for i in range(s['n'])]
        fr = []
        for t in times:
            a = frame(os.path.join(clips, s['src']), t)
            if a.mean() > 150:
                sys.exit('%s: the frame at %.2fs is a white flash field - leave it out of the times' % (name, t))
            fr.append(crush(a))
        H, W = fr[0].shape[:2]
        if s.get('crop'):
            x0, y0, x1, y1 = [int(round(v * (W if i % 2 == 0 else H))) for i, v in enumerate(s['crop'])]
        else:
            m = np.zeros((H, W), bool)
            for a in fr:
                m |= a.max(axis=2) > s.get('thr', THR)
            ys, xs = np.nonzero(m)
            if not len(xs):
                sys.exit(name + ': nothing in the window')
            px, py = int((xs.max() - xs.min()) * 0.05) + 4, int((ys.max() - ys.min()) * 0.05) + 4
            x0, x1 = max(0, xs.min() - px), min(W, xs.max() + px + 1)
            y0, y1 = max(0, ys.min() - py), min(H, ys.max() + py + 1)
        ch = int(s['h'])
        cw = int(round((x1 - x0) * ch / (y1 - y0)))
        cells = []
        for a in fr:
            im = Image.fromarray(a[y0:y1, x0:x1].astype(np.uint8)).resize((cw, ch), Image.LANCZOS)
            cells.append(np.asarray(im))
        strip = np.concatenate(cells, axis=1)
        # the hot point: the white core of the brightest cell
        lum = [c.astype(np.float32).min(axis=2) for c in cells]
        k = int(np.argmax([l.sum() for l in lum]))
        hot = lum[k] > max(200, np.percentile(lum[k], 99.5))
        ys, xs = np.nonzero(hot)
        hx, hy = (float(xs.mean() / cw), float(ys.mean() / ch)) if len(xs) else (0.5, 0.5)
        dst = os.path.join(out, name + '.webp')
        Image.fromarray(strip).save(dst, 'WEBP', quality=int(s.get('q', 86)), method=6)
        meta[name] = {'cells': len(cells), 'cw': cw, 'ch': ch, 'hot': [round(hx, 3), round(hy, 3)],
                      'crop': [round(x0 / W, 4), round(y0 / H, 4), round(x1 / W, 4), round(y1 / H, 4)],
                      'kb': round(os.path.getsize(dst) / 1024), 'loop': bool(s.get('loop'))}
        print(name, json.dumps(meta[name]))
    return meta


if __name__ == '__main__':
    main()
