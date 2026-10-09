#!/usr/bin/env python3
"""fixcut.py — cut chroma-green takes of ONE character into strips at ONE scale and ONE floor line.

  python3 -I tools/fixcut.py <spec.json>     (needs ffmpeg, numpy, Pillow; scipy optional)

spec: {"scale": s, "pad": px, "floor": y_src | null, "out": dir,
       "strips": [{"name", "clip", "times": [...], "float": 0|1}]}
Every strip shares the source->cell scale. Grounded strips are cropped so the
cell's bottom edge sits `pad` px (cell space) below the shared floor line;
floating strips are cropped tight around their own union bbox. Width is the
union of that strip's frames. Prints per-strip cell size + body bbox so the
renderer's k can be derived instead of tuned by eye.
"""
import json, subprocess, sys, os
import numpy as np
from PIL import Image

spec = json.load(open(sys.argv[1]))
S = spec['scale']; PAD = spec.get('pad', 4)

def frame(clip, t):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', clip, '-frames:v', '1',
                          '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    w, h = map(int, subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
        'stream=width,height', '-of', 'csv=p=0', clip], capture_output=True, text=True).stdout.strip().split(','))
    return np.frombuffer(raw, np.uint8).reshape(h, w, 3).astype(np.float32)

def key(F):
    # field colour measured from the corners actually present, not assumed
    h, w, _ = F.shape
    corners = np.concatenate([F[:8, :8].reshape(-1, 3), F[:8, -8:].reshape(-1, 3),
                              F[-8:, :8].reshape(-1, 3), F[-8:, -8:].reshape(-1, 3)])
    k = np.median(corners, 0)
    d = np.sqrt(((F - k) ** 2).sum(-1))
    a = np.clip((d - 60) / 70, 0, 1)
    # greenness: how far G exceeds the larger of R,B — kills the field and the spill fringe
    g = F[..., 1] - np.maximum(F[..., 0], F[..., 2])
    a = np.where(g > 60, np.minimum(a, np.clip((110 - g) / 50, 0, 1)), a)
    out = F.copy()
    out[..., 1] = np.minimum(F[..., 1], (F[..., 0] + F[..., 2]) / 2 + 4)   # despill: grey metal has G≈(R+B)/2
    # drop specks: anything not connected to the largest blob is noise or baked FX
    m = a > 0.5
    try:
        from scipy import ndimage
        lab, n = ndimage.label(m)
        if n > 1:
            sizes = ndimage.sum(m, lab, range(1, n + 1))
            keep = 1 + int(np.argmax(sizes))
            big = ndimage.binary_dilation(lab == keep, iterations=3)
            a = np.where(big, a, 0)
    except ImportError:
        pass
    return out, a

def bbox(a):
    ys, xs = np.where(a > 0.5)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

os.makedirs(spec['out'], exist_ok=True)
report = {}
for st in spec['strips']:
    frames = [key(frame(st['clip'], t)) for t in st['times']]
    bbs = [bbox(a) for _, a in frames]
    x0 = min(b[0] for b in bbs); x1 = max(b[2] for b in bbs)
    y0 = min(b[1] for b in bbs); y1 = max(b[3] for b in bbs)
    m = 6
    if st.get('float'):
        sy0, sy1 = y0 - m, y1 + m
    else:
        fl = spec['floor']
        sy1 = fl + PAD / S
        sy0 = min(y0 - m, sy1 - (st.get('minh', 0) / S))
    # horizontal: centred on the union, so the body does not swim inside the cell
    sx0, sx1 = x0 - m, x1 + m
    cw = int(round((sx1 - sx0) * S)); ch = int(round((sy1 - sy0) * S))
    strip = Image.new('RGBA', (cw * len(frames), ch), (0, 0, 0, 0))
    for i, (F, a) in enumerate(frames):
        rgba = np.dstack([F, a * 255]).clip(0, 255).astype(np.uint8)
        im = Image.fromarray(rgba, 'RGBA')
        # premultiply-safe resize: resize in premultiplied space
        pm = np.dstack([F * a[..., None], a * 255])
        pim = Image.fromarray(pm.clip(0, 255).astype(np.uint8), 'RGBA')
        box = (sx0, sy0, sx1, sy1)
        crop = pim.transform((cw, ch), Image.EXTENT, box, Image.BICUBIC)
        c = np.asarray(crop).astype(np.float32)
        al = c[..., 3:4] / 255
        rgb = np.where(al > 0.004, c[..., :3] / np.maximum(al, 0.004), 0)
        cell = Image.fromarray(np.dstack([rgb, c[..., 3:4]]).clip(0, 255).astype(np.uint8), 'RGBA')
        strip.paste(cell, (i * cw, 0))
    p = os.path.join(spec['out'], st['name'] + '.png')
    strip.save(p)
    # body bbox per cell, in cell space, for the renderer and the harness
    A = np.asarray(strip)[..., 3]
    cells = []
    for i in range(len(frames)):
        sub = A[:, i * cw:(i + 1) * cw]
        ys, xs = np.where(sub > 128)
        cells.append([int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)])
    report[st['name']] = {'cell': [cw, ch], 'n': len(frames), 'src': [float(round(v, 1)) for v in (sx0, sy0, sx1, sy1)], 'bodies': cells}
    print(st['name'], cw, ch, len(frames), 'feet', [b[3] for b in cells])
json.dump(report, open(os.path.join(spec['out'], 'report.json'), 'w'), indent=1)
