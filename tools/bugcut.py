#!/usr/bin/env python3
# THE INSECTS: cut a generated insect off its black field into the small sprite js/insects.js draws.
#
# Owner, 2026-11-25: insects "proper to the place ... butterflies ... dragonflies near swamps ...
# They are not NPCs, they're just flying away ... And they're small." Each master is one Higgsfield
# picture of one insect, from above, on black (assets/source/insects/). This keys the black away (or
# keeps the picture's own alpha when it has one), cuts the alpha FIRMLY so a soft glow left round the
# body by the generator does not come with it (THE LEDGER: no light round any body), crops the
# insect symmetrically about the picture's centre — so the wings of a butterfly or a moth fold about
# its body when the game beats them — and shrinks it to a small sprite.
#
#   python3 -I tools/bugcut.py <master.png> <out.webp> <height px> [sym]
import sys
import numpy as np
from PIL import Image


def main():
    src, dst, h = sys.argv[1], sys.argv[2], int(sys.argv[3])
    sym = len(sys.argv) > 4 and sys.argv[4] == 'sym'
    im = Image.open(src)
    a = np.asarray(im.convert('RGBA')).astype(np.float32)
    rgb = a[..., :3]
    if im.mode == 'RGBA' and a[..., 3].min() < 250:
        al = a[..., 3] / 255.0
    else:
        al = np.clip((rgb.max(axis=2) - 22) / 40.0, 0, 1)
    # a firm edge: the half-lit haze a generator leaves round a body is dropped, the body kept
    al = np.clip((al - 0.55) / 0.3, 0, 1)
    ys, xs = np.nonzero(al > 0.05)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    if sym:
        W = a.shape[1]; half = max(W / 2 - x0, x1 - W / 2)
        x0, x1 = int(max(0, W / 2 - half)), int(min(W, W / 2 + half))
    out = np.concatenate([rgb, (al * 255)[..., None]], axis=2)[y0:y1, x0:x1].astype(np.uint8)
    o = Image.fromarray(out, 'RGBA')
    w = max(2, round(o.width * h / o.height))
    o = o.resize((w, h), Image.LANCZOS)
    o.save(dst, 'WEBP', quality=90, method=6)
    print(dst, o.size)


if __name__ == '__main__':
    main()
