"""Deterministic delivery of reviewed Higgsfield lion takes; no generated pixels.

Extract actual video frames, remove only border-connected black, retain one
scale for each take, and remove filmed vertical root motion (physics owns it).
The standing frame fits a 320x210px envelope; each take keeps one scale.
"""
import argparse
import io
import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

p = argparse.ArgumentParser()
p.add_argument('source')
p.add_argument('output')
p.add_argument('--frames', type=int, default=30)
p.add_argument('--start', type=float, default=0)
p.add_argument('--end', type=float, default=6)
p.add_argument('--threshold', type=int, default=48)
p.add_argument('--strict-borders', action='store_true')
p.add_argument('--foot-right', action='store_true', help='register on hind paws, excluding a filmed forepaw flash')
args = p.parse_args()

def frame(t):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-ss', str(t),
        '-i', args.source, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'])
    a = np.array(Image.open(io.BytesIO(raw)).convert('RGB'))
    dark = a.max(axis=2) < args.threshold
    seeds = np.zeros(dark.shape, dtype=bool)
    seeds[0] = dark[0]; seeds[-1] = dark[-1]
    seeds[:, 0] = dark[:, 0]; seeds[:, -1] = dark[:, -1]
    field = ndimage.binary_propagation(seeds, mask=dark)
    labels, n = ndimage.label(~field)
    sizes = np.bincount(labels.ravel()); sizes[0] = 0
    # Dark joints can separate bright armour islands. Keep substantial enclosed
    # islands, rejecting edge-connected studio light and tiny dust motes.
    keep = sizes >= 48
    edge = np.unique(np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1])))
    # A contact flash may join the animal to an edge. Preserve a component
    # containing substantial bright armour; reject standalone border light.
    bright = np.bincount(labels[a.max(axis=2) > 140], minlength=n+1)
    for label in edge:
        if args.strict_borders or bright[label] < 12000: keep[label] = False
    keep[0] = False
    subject = ndimage.binary_fill_holes(keep[labels])
    alpha = subject.astype(np.uint8) * 255
    ys, xs = np.where(subject)
    if not len(xs):
        raise ValueError('empty frame')
    # Reject sparse dust rows when locating the soles, without cutting toes.
    sole = subject[:, subject.shape[1] // 2:] if args.foot_right else subject
    rows = np.flatnonzero(sole.sum(axis=1) >= 10)
    foot = int(rows[-1])
    alpha[foot + 1:] = 0
    return Image.fromarray(np.dstack((a, alpha))), (int(xs.min()), int(ys.min()), int(xs.max()) + 1, foot + 1)

rest, rb = frame(0.08)
scale = min(210 / (rb[3] - rb[1]), 320 / (rb[2] - rb[0]))
times = np.linspace(args.start + .02, args.end - .02, args.frames)
sampled = [frame(float(t)) for t in times]
center = (min(b[0] for _, b in sampled) + max(b[2] for _, b in sampled)) / 2
cw, ch = 448, 256
sheet = Image.new('RGBA', (cw * args.frames, ch))
coverage = [np.count_nonzero(np.array(im)[:, :, 3] > 32) for im, _ in sampled]
if min(coverage) < max(coverage) * .5:
    raise ValueError('body vanished during keying; inspect the complete sequence')
for i, (im, b) in enumerate(sampled):
    x = round(cw / 2 + (b[0] - center) * scale)
    crop = im.crop(b)
    w, h = round(crop.width * scale), round(crop.height * scale)
    if x < 4 or x + w > cw - 4 or h > ch - 4:
        raise ValueError(f'frame {i} clips: {x},{w},{h}; do not shrink poses independently')
    sheet.alpha_composite(crop.resize((w, h), Image.Resampling.LANCZOS), (i * cw + x, ch - h))
out = Path(args.output); out.parent.mkdir(parents=True, exist_ok=True)
sheet.save(out, quality=90, method=6)
metadata = dict(source=args.source, frames=args.frames, cell=[cw, ch],
    times=[round(float(t), 4) for t in times], scale=scale,
    threshold=args.threshold, strictBorders=args.strict_borders, footRight=args.foot_right,
    rootMotion='vertical removed; simulation supplies trajectory',
    reference='standing envelope: 320x210px', reviewed=False)
out.with_suffix('.motion.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(json.dumps(dict(output=str(out), bytes=out.stat().st_size, **metadata)))
