#!/usr/bin/env python3
# THE MEADOW'S LEDGES ARE SMALL PALMS: cut the fired sheet of three metal palms into the strip the
# game draws (js/game.js PLAT_PALM), and measure each one.
#
# Owner, 2026-11-25: "for hanging platforms, change its shape. It's just a straight line instead
# of an actual standing place. It can be like a small palm that we can jump on, or a small tree
# that we can jump on". The master (assets/source/platforms/palms_a.webp, Higgsfield, transparent)
# holds three palms side by side — narrow, medium and wide crown — each a short ringed trunk under
# a crown that is level on top. This finds the three by their alpha, scales them together (the
# widest crown to WIDE px, so the three keep their sizes relative to each other), packs them top to
# bottom, and measures for each, in the packed sheet:
#   top    the row her feet stand on: the first row opaque across most of the crown
#   cb     the crown's bottom: the first row under the crown that is only trunk
#   tx0    the trunk's centre x just under the crown; tx1 at its foot
#   tw     the trunk's width at its foot
#   foot   the last opaque row
#
#   python3 -I tools/palmcut.py <master.webp> <out.webp>
# prints the PLAT_PALM rows for js/game.js
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

WIDE = 420


def main():
    src, dst = sys.argv[1], sys.argv[2]
    sheet = Image.open(src).convert('RGBA')
    a = np.asarray(sheet)[:, :, 3] > 24
    lab, n = ndimage.label(ndimage.binary_closing(a, iterations=4))
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
    big = sorted(range(1, n + 1), key=lambda k: -sizes[k - 1])[:3]
    objs = ndimage.find_objects(lab)
    big.sort(key=lambda k: objs[k - 1][1].start)
    crops = []
    for k in big:
        ys, xs = objs[k - 1]
        c = np.asarray(sheet)[ys, xs].copy()
        c[:, :, 3] = np.where(lab[ys, xs] == k, c[:, :, 3], 0)
        crops.append(Image.fromarray(c))
    s = WIDE / max(c.size[0] for c in crops)
    crops = [c.resize((max(2, round(c.size[0] * s)), max(2, round(c.size[1] * s))), Image.LANCZOS) for c in crops]
    W = max(c.size[0] for c in crops) + 4
    H = sum(c.size[1] + 2 for c in crops) + 2
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    rows, y = [], 2
    for c in crops:
        out.alpha_composite(c, (2, y))
        al = np.asarray(c)[:, :, 3] > 90
        w, h = c.size
        widths = al.sum(axis=1)
        # the trunk's width: the opaque span at a quarter of the way up from its foot
        fr = h - 1 - int(h * 0.18)
        tw = int(widths[fr])
        top = int(np.argmax(widths > 0.6 * widths.max()))
        cb = top
        for r in range(top, h):
            if widths[r] <= tw * 1.6 and r > top + 4:
                cb = r
                break
        def cx(r):
            xs2 = np.nonzero(al[r])[0]
            return float(xs2.mean()) if len(xs2) else w / 2
        foot = int(np.nonzero(widths)[0].max())
        rows.append({'x': 2, 'y': y, 'w': w, 'h': h, 'top': top, 'cb': cb,
                     'tx0': round(cx(min(h - 1, cb + 3)), 1), 'tx1': round(cx(foot - 3), 1),
                     'tw': tw, 'foot': foot})
        y += h + 2
    out.save(dst, 'WEBP', quality=88, method=6)
    print(out.size)
    for r in rows:
        print('{ x: %(x)d, y: %(y)d, w: %(w)d, h: %(h)d, top: %(top)d, cb: %(cb)d, tx0: %(tx0)s, tx1: %(tx1)s, tw: %(tw)d, foot: %(foot)d },' % r)


if __name__ == '__main__':
    main()
