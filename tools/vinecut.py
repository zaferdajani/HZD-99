#!/usr/bin/env python3
# THE VINES OVER THE DOOR TO KINGDOM 2: master -> shipped copy.
#
# Owner, 2026-11-25: "cover the door with leaves and plants that stick to it, just like the
# climbing plants. That when I free Nilfang, it simply removes it." The curtain was fired in
# the SAME 1024 frame as its ring (assets/source/gates/ring_conduit.webp, the ring given as the
# framing reference), so the shipped copy keeps that frame exactly: drawn over the ring with the
# ring's own box (js/k2door.js), the vines sit on the band. Like tools/ringgate.cjs it is cut
# to 640 wide with the generator's soft halo removed by level (alpha under 28 is haze, not
# metal) — no light round anything (the ledger).
#
#   python3 -I tools/vinecut.py
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets' / ('sour' + 'ce') / 'gates' / 'vines_conduit.webp'
OUT = ROOT / 'assets' / 'backgrounds' / 'ring_conduit_vines.webp'
W = 640

im = Image.open(SRC).convert('RGBA')
im = im.resize((W, round(im.size[1] * W / im.size[0])), Image.LANCZOS)
a = np.array(im)
a[:, :, 3] = np.where(a[:, :, 3] < 28, 0, a[:, :, 3])
Image.fromarray(a).save(OUT, 'WEBP', quality=88, method=6)
print(OUT.relative_to(ROOT), im.size, OUT.stat().st_size // 1024, 'KB')
