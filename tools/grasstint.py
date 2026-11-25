#!/usr/bin/env python3
# THE GRASS — one CC0 painted grass card, tinted into the kingdoms' own greens.
#
# Owner, 2026-11-25: "Try to improve the grass ... find free library for the grass instead of these
# green lines ... if you can find grass that can move with the characters to show real life
# movements whenever I walk on it or an enemy walk on it, that would be amazing" — and "do not make
# the game heavy ... I need the game to be playable everywhere."
#
# The source is "grass blades alpha card texture (side view)" by para, OpenGameArt, CC0
# (assets/source/grass/, credited in assets/CREDITS.md): hand-painted blades seen from the side,
# 1024 x 256, seamless, on alpha. It is olive; the meadow is a vibrant yellow-green (the owner,
# 2026-08-23: "vibrant, even though all the machines are dead"), and the Nest grows violet fronds.
# This keeps the card's own light and shade (its value per pixel) and repaints the hue: each pixel's
# brightness relative to the card's mean is laid on the kingdom's mid colour, the roots a step darker
# so the strip sits INTO the ground, the tips a step lighter.
#
#   python3 -I tools/grasstint.py <card.png> <outdir>
#
# Writes grass_meadow.webp and grass_frond.webp (the game draws them in columns that bend:
# js/grass.js).
import os, sys
import numpy as np
from PIL import Image

VARIANTS = {
    # mid colour, tip colour (the lit top of a blade)
    'meadow': ((93, 163, 60), (150, 222, 96)),
    'frond': ((133, 68, 180), (214, 140, 255)),
}


def main():
    src, out = sys.argv[1:3]
    os.makedirs(out, exist_ok=True)
    a = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3:4]
    lum = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
    m = lum[al[..., 0] > 200].mean()
    rel = np.clip(lum / m, 0.35, 1.8)[..., None]
    H = a.shape[0]
    y = (np.arange(H, dtype=np.float32) / (H - 1))[:, None, None]   # 0 at the tips, 1 at the roots
    for name, (mid, tip) in VARIANTS.items():
        mid_c, tip_c = np.array(mid, np.float32), np.array(tip, np.float32)
        # tips toward the lit colour, roots a third darker
        base = tip_c * (1 - np.clip(y * 1.6, 0, 1)) + mid_c * np.clip(y * 1.6, 0, 1)
        shade = 1.0 - 0.34 * np.clip((y - 0.55) / 0.45, 0, 1)
        col = np.clip(base * rel * shade, 0, 255)
        # THE ROOTS FADE INTO THE GROUND (owner, 2026-11-25: "It shouldn't look like squares stuck
        # together. It should be continuous without edges"). The card's lower rows are a solid mat
        # with a ruled bottom edge; laid over the rock that edge is a line. From 55% of its height
        # down to the 80% the game draws (js/grass.js GRASS_CROP) the alpha falls to nothing, so the
        # grass grows OUT of the rock instead of being pasted on it.
        ramp = 1.0 - np.clip((y - 0.55) / 0.25, 0, 1)
        img = np.concatenate([col, al * ramp], axis=2).astype(np.uint8)
        dst = os.path.join(out, 'grass_' + name + '.webp')
        # shipped at 512 x 128: it is drawn about 24 px tall, so the card's own 256 rows are five
        # times what any screen shows (the full card stays in assets/source/grass/)
        im = Image.fromarray(img, 'RGBA').resize((a.shape[1] // 2, a.shape[0] // 2), Image.LANCZOS)
        im.save(dst, 'WEBP', quality=86, method=6)
        print(dst, round(os.path.getsize(dst) / 1024), 'KB')


if __name__ == '__main__':
    main()
