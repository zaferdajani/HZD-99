"""NULLFANG'S COVER: cut the archived Higgsfield masters into what the game draws.

No generated pixels here: the masters (assets/source/nfcover/, fired 2026-11-25 with
real alpha) are trimmed, scaled and measured, nothing more.

  leaves_a.webp  -> assets/characters/cover/leaf0..5.webp   one metal banana leaf each,
                    upright, stalk at the bottom; their stalk foot and tip are measured
                    into cover.json (fractions of the cut), which the rig bends about
  clump_a.webp   -> assets/characters/cover/clump_a.webp    the clump IN the arena
  clump_b.webp   -> assets/characters/cover/clump_b.webp    the clumps behind it

  python3 tools/nfcover.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets' / ('sour' + 'ce') / 'nfcover'
OUT = ROOT / 'assets' / 'characters' / 'cover'
OUT.mkdir(parents=True, exist_ok=True)
LEAF_H = 360          # shipped leaf height, px (drawn about 150 px tall at zoom 1)
CLUMP_W = 640         # shipped clump width, px (drawn 180-260 px wide; under lowres.cjs MIN_BYTES, so no small copy is owed)


def trim(im, a=24):
    al = np.array(im)[:, :, 3]
    ys, xs = np.nonzero(al > a)
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def save(im, name):
    p = OUT / name
    im.save(p, 'WEBP', quality=88, method=6)
    return p


meta = {'leaves': [], 'clumps': {}}
sheet = Image.open(SRC / 'leaves_a.webp').convert('RGBA')
al = np.array(sheet)[:, :, 3] > 24
lab, n = ndimage.label(ndimage.binary_closing(al, iterations=3))
sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
keep = [i + 1 for i, s in enumerate(sizes) if s > al.sum() * 0.03]
objs = ndimage.find_objects(lab)
boxes = sorted([(objs[k - 1], k) for k in keep], key=lambda q: q[0][1].start)
for i, (sl, k) in enumerate(boxes):
    ys, xs = sl
    crop = np.array(sheet)[ys, xs].copy()
    crop[:, :, 3] = np.where(lab[ys, xs] == k, crop[:, :, 3], 0)   # only this leaf
    im = Image.fromarray(crop)
    w, h = im.size
    k2 = LEAF_H / h
    im = im.resize((max(1, round(w * k2)), LEAF_H), Image.LANCZOS)
    a = np.array(im)[:, :, 3] > 40
    # the stalk foot: the centre of the lowest solid rows
    rows = np.nonzero(a.any(axis=1))[0]
    foot = rows[-6:]
    fx = float(np.mean([np.nonzero(a[r])[0].mean() for r in foot]))
    # the tip: the centre of the highest solid rows
    top = rows[:6]
    tx = float(np.mean([np.nonzero(a[r])[0].mean() for r in top]))
    save(im, 'leaf%d.webp' % i)
    meta['leaves'].append({'key': 'leaf%d' % i, 'w': im.size[0], 'h': im.size[1],
                           'foot': [round(fx / im.size[0], 4), round(rows[-1] / im.size[1], 4)],
                           'tip': [round(tx / im.size[0], 4), round(rows[0] / im.size[1], 4)]})
for name in ('clump_a', 'clump_b'):
    im = trim(Image.open(SRC / (name + '.webp')).convert('RGBA'))
    w, h = im.size
    im = im.resize((CLUMP_W, round(h * CLUMP_W / w)), Image.LANCZOS)
    a = np.array(im)[:, :, 3] > 40
    cols = np.nonzero(a.any(axis=0))[0]
    # the trunks' foot: the solid span of the bottom tenth (the scrap heap it stands on)
    base = a[int(im.size[1] * 0.9):].any(axis=0)
    bx = np.nonzero(base)[0]
    save(im, name + '.webp')
    meta['clumps'][name] = {'w': im.size[0], 'h': im.size[1],
                            'base': [round(bx.min() / im.size[0], 4), round(bx.max() / im.size[0], 4)]}
(OUT / 'cover.json').write_text(json.dumps(meta, indent=1) + '\n')
print(json.dumps(meta, indent=1))
